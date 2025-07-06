const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const blocksDir = path.join(__dirname, '../airyblocks');

function calculateHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function updateHashes() {
  const files = fs.readdirSync(blocksDir).filter(f => f.endsWith('.airyb'));

  for (const file of files) {
    const filePath = path.join(blocksDir, file);
    const raw = fs.readFileSync(filePath, 'utf8');
    let block;

    try {
      block = JSON.parse(raw);
    } catch {
      console.warn(`Skipping invalid block: ${file}`);
      continue;
    }

    const { hash, ...withoutHash } = block;
    const newHash = calculateHash(JSON.stringify(withoutHash));

    if (hash !== newHash) {
      block.hash = newHash;
      fs.writeFileSync(filePath, JSON.stringify(block, null, 2));
      console.log(`🔁 Recalculated hash for: ${file}`);
    }
  }
}

updateHashes();

