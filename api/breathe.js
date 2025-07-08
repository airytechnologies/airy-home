// api/breathe.js

import { NextResponse } from 'next/server';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const { GITHUB_TOKEN, REPO_OWNER, REPO_NAME } = process.env;

  const headers = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
  };

  const owner = REPO_OWNER || 'airytechnologies';
  const repo = REPO_NAME || 'airy-home';
  const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, '');
  const filename = `block_${timestamp}.airyb`;
  const branchName = `breathe-${timestamp}`;
  const content = `The breath was placed at ${new Date().toISOString()}\n`;

  try {
    // Step 1: Get default branch SHA
    const branchRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/main`, {
      headers,
    });

    const branchData = await branchRes.json();
    const latestCommitSha = branchData.object.sha;

    // Step 2: Create a new branch from main
    await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ref: `refs/heads/${branchName}`,
        sha: latestCommitSha,
      }),
    });

    // Step 3: Commit the new block file to the new branch
    const encodedContent = Buffer.from(content).toString('base64');

    const commitRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/airyblocks/${filename}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        message: `Add ${filename}`,
        content: encodedContent,
        branch: branchName,
      }),
    });

    const commitData = await commitRes.json();

    if (!commitRes.ok) {
      throw new Error(commitData.message || 'Failed to commit file');
    }

    // Step 4: Open a pull request from new branch into main
    const prRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: `Add ${filename}`,
        head: branchName,
        base: 'main',
        body: 'Automated PR from /breathe endpoint',
      }),
    });

    const prData = await prRes.json();

    if (!prRes.ok) {
      throw new Error(prData.message || 'Failed to open pull request');
    }

    return new NextResponse(
      JSON.stringify({ message: 'Pull request created', url: prData.html_url }),
      { status: 200 }
    );
  } catch (e) {
    return new NextResponse(
      JSON.stringify({ error: e.message }),
      { status: 500 }
    );
  }
}

