const crypto = require('crypto');
const fetch = require('node-fetch');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const token = process.env.GITHUB_TOKEN;
  const owner = 'airytechnologies';
  const repo = 'airy-home';
  const path = 'airyblocks';

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/vnd.github+json',
  };

  try {
    // Step 1: Get latest block number
    const contentsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, { headers });
    const files = await contentsRes.json();

    const latest = files
      .filter(f => f.name.endsWith('.airyb'))
      .map(f => parseInt(f.name.replace('block_', '').replace('.airyb', '')))
      .sort((a, b) => b - a)[0] || 0;

    const next = String(latest + 1).padStart(6, '0');
    const filename = `block_${next}.airyb`;
    const parent = latest > 0 ? `block_${String(latest).padStart(6, '0')}` : null;

    // Step 2: Create content
    const content = {
      version: "1.0.0",
      schema_ref: "airy.schema.001",
      timestamp_human: new Date().toISOString(),
      timestamp_nano: process.hrtime.bigint().toString(),
      agent: {
        type: "human",
        ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
        referrer: req.headers['referer'] || null,
      },
      parent,
      meta: {}
    };

    content.hash = crypto.createHash('sha256').update(JSON.stringify(content)).digest('hex');
    const encoded = Buffer.from(JSON.stringify(content, null, 2)).toString('base64');

    // Step 3: Create branch
    const mainShaRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/main`, { headers });
    const { object: { sha: baseSha } } = await mainShaRes.json();

    const branchName = `breathe/block_${next}`;
    await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ref: `refs/heads/${branchName}`,
        sha: baseSha,
      }),
    });

    // Step 4: Commit file to new branch
    await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}/${filename}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        message: `block_${next} committed via breath`,
        content: encoded,
        branch: branchName,
      }),
    });

    // Step 5: Open pull request
    const prRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: `Add ${filename}`,
        head: branchName,
        base: 'main',
        body: 'Block added via breathe button 🫁',
      }),
    });

    const pr = await prRes.json();

    return res.status(200).json({ message: `PR opened: ${pr.html_url}` });
  } catch (err) {
    console.error('❌ breathe error:', err);
    return res.status(500).json({ error: err.message || 'Unexpected error' });
  }
};
