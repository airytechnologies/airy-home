// api/breathe.js
import { NextResponse } from 'next/server';
import { Octokit } from 'octokit';

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

const REPO = 'airy-home';
const OWNER = 'airytechnologies';
const BRANCH = 'main';

export async function POST(req) {
  try {
    const body = await req.json();
    const { content, filename } = body;

    // Step 1: Get SHA of latest main commit
    const {
      data: {
        object: { sha: latestMainSha },
      },
    } = await octokit.rest.git.getRef({
      owner: OWNER,
      repo: REPO,
      ref: `heads/${BRANCH}`,
    });

    // Step 2: Create new branch from main
    const branchName = `breathe/pr-${Date.now()}`;
    await octokit.rest.git.createRef({
      owner: OWNER,
      repo: REPO,
      ref: `refs/heads/${branchName}`,
      sha: latestMainSha,
    });

    // Step 3: Commit file to new branch
    const encodedContent = Buffer.from(content).toString('base64');
    await octokit.rest.repos.createOrUpdateFileContents({
      owner: OWNER,
      repo: REPO,
      path: `airyblocks/${filename}`,
      message: `Add ${filename} via breathe`,
      content: encodedContent,
      branch: branchName,
    });

    // Step 4: Open pull request to main
    const {
      data: { number: prNumber, html_url: prUrl },
    } = await octokit.rest.pulls.create({
      owner: OWNER,
      repo: REPO,
      title: `Add ${filename} via breathe`,
      head: branchName,
      base: BRANCH,
      body: `Automated breathe submission: ${filename}`,
    });

    // Step 5: Enable auto-merge if allowed
    try {
      await octokit.graphql(`
        mutation ($prId: ID!) {
          enablePullRequestAutoMerge(input: { pullRequestId: $prId, mergeMethod: MERGE }) {
            pullRequest { number, autoMergeRequest { enabledBy { login } } }
          }
        }
      `, {
        prId: `MDExOlB1bGxSZXF1ZXN0${prNumber.toString().padStart(6, '0')}`,
        headers: { 
          authorization: `token ${process.env.GITHUB_TOKEN}` 
        }
      });
    } catch (e) {
      console.warn('Auto-merge not enabled:', e.message);
    }

    return NextResponse.json({ status: 'ok', prUrl });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: `GitHub error: ${JSON.stringify(e.message)}` }, { status: 409 });
  }
}

