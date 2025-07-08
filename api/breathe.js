// api/breathe.js

const crypto = require('crypto');
const fetch = require('node-fetch');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) return res.status(500).json({ error: 'Missing GitHub token' });

  const owner = 'airytechnologies';
  const repo = 'airy-home';
  const path = 'airyblocks';
  const baseUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

  try {
    // Get current airyblocks
    const response = await fetch(baseUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const files = await response.json();

    const latestBlock = files
      .filter(f => f.name.endsWith('.airyb'))
      .map(f => parseInt(f.name.replace('block_', '').replace('.airyb', '')))
      .sort((a, b) => b - a)[0] || 0;

    const next = String(latestBlock + 1).padStart(6, '0');
    const filename = `block_${next}.airyb`;
    const fileUrl = `${baseUrl}/${filename}`;
    const parent = latestBlock ? `block_${String(latestBlock).padStart(6, '0')}` : null;

    // Check if it already exists
    const existingCheck = await fetch(fileUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (existingCheck.status === 200) {
      return res.status(409).json({ error: `Block ${filename} already exists — refusing to overwrite.` });
    }

    const timestamp = new Date();
    const timestampNano = process.hrtime.bigint().toString();

    const content = {
      data: {
        timestamp: timestamp.toISOString(),
        timestampNano,
        userAgent: req.headers['user-agent'],
        ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        parent,
      },
      meta: {}
    };

    const hash = crypto.createHash('sha256').update(JSON.stringify(content)).digest('hex');
    content.hash = hash;

    const encodedContent = Buffer.from(JSON.stringify(content, null, 2)).toString('base64');

    const commit = await fetch(fileUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `block_${next} committed`,
        content: encodedContent,
      }),
    });

    if (!commit.ok) {
      const err = await commit.text();
      throw new Error(`GitHub error: ${err}`);
    }

    return res.status(200).json({ message: `block_${next} created`, metadata: content });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
