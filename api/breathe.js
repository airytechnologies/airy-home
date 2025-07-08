const crypto = require('crypto');
const fetch = require('node-fetch');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const token = process.env.GITHUB_TOKEN;
  if (!token) return res.status(500).json({ error: 'Missing GitHub token' });

  const owner = 'airytechnologies';
  const repo = 'airy-home';
  const blocksPath = 'airyblocks';
  const apiBase = `https://api.github.com/repos/${owner}/${repo}`;

  try {
    // Get latest block number
    const filesRes = await fetch(`${apiBase}/contents/${blocksPath}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const files = await filesRes.json();

    const latestBlock = files
      .filter(f => f.name.endsWith('.airyb'))
      .map(f => parseInt(f.name.replace('block_', '').replace('.airyb', '')))
      .sort((a, b) => b - a)[0] || 0;

    const next = String(latestBlock + 1).padStart(6, '0');
    const filename = `block_${next}.airyb`;
    const parent = latestBlock ? `block_${String(latestBlock).padStart(6, '0')}` : null;

    const timestamp = new Date();
    const timestampNano = process.hrtime.bigint().toString();

    const content = {
      version: '1.0.0',
      schema_ref: 'airy.schema.001',
      timestamp_human: timestamp.toISOString(),
      timestamp_nano: timestampNano,
      agent: {
        type: 'human',
        ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress || '',
        userAgent: req.headers['user-agent'] || '',
        referrer: req.headers['referer'] || '',
      },
      parent,
      meta: {},
    };

    const hash = crypto.createHash('sha256').update(JSON.stringify(content)).digest('hex');
    content.hash = hash;

    const encodedContent = Buffer.from(JSON.stringify(content, null, 2)).toString('base64');

    // Get default branch
    const repoRes = await fetch(`${apiBase}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const repoData = await repoRes.json();
    const mainRef = repoData.default_branch || 'main';

    // Get latest commit SHA
    const mainRefRes = await fetch(`${apiBase}/git/ref/heads/${mainRef}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const mainRefData = await mainRefRes.json();
    const latestCommitSha = mainRefData.object.sha;

    // Create a new branch
    const branchName = `block-${next}`;
    const newRefRes = await fetch(`${apiBase}/git/refs`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ref: `refs/heads/${branchName}`,
        sha: latestCommitSha,
      }),
    });

    if (!newRefRes.ok) {
      const err = await newRefRes.text();
      throw new Error(`Branch creation failed: ${err}`);
    }

    // ✅ Wait briefly to let GitHub register the new branch
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Commit the file to the new branch
    const commitRes = await fetch(`${apiBase}/contents/${blocksPath}/${filename}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `block_${next} committed via breathe`,
        content: encodedContent,
        branch: branchName,
      }),
    });

    if (!commitRes.ok) {
      const err = await commitRes.text();
      throw new Error(`GitHub error: ${err}`);
    }

    // Open a PR
    const prRes = await fetch(`${apiBase}/pulls`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: `Add ${filename}`,
        head: branchName,
        base: mainRef,
        body: 'Block created by airy breathe button.',
      }),
    });

    if (!prRes.ok) {
      const err = await prRes.text();
      throw new Error(`Pull request failed: ${err}`);
    }

    const prData = await prRes.json();
    return res.status(200).json({ message: `block_${next} created`, pr_url: prData.html_url });

  } catch (err) {
    console.error(err);
    return res.status(500).send(`❌ ${err.message}`);
  }
};
