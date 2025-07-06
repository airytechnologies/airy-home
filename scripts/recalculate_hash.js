const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const airyblockDir = path.join(__dirname, '..', 'airyblocks');

function calculateHash(block) {
  const hashInput = JSON.stringify({
    version: block.version,
    schema_ref: block.schema_ref,
    timestamp_human: block.timestamp_human,
    timestamp_nano: block.timestamp_nano,
    agent: block.agent,
    parent: block.parent,
    meta: block.meta
  });
  return crypto.createHash('sha256').update(hashInput).digest('hex');
}

function isValidBlock(block) {
  return (
    block &&
    block.version &&
    block.schema_ref &&
    block.timestamp_human &&
    block.timestamp_nano &&
    block.agent &&
    block.parent &&
    block.meta
  );
}

const files = fs.readdirSync(airyblockDir).filter(file => file.endsWith('.airyb'));

files.forEach(file => {
  const filePath = path.join(airyblockDir, file);
  const data = fs.readFileSync(filePath, 'utf-8');

  try {
    const json = JSON.parse(data);
    if (!isValidBlock(json)) {
      console.log(`Skipping invalid block: ${file}`);
      return;
    }

    const currentHash = json.hash;
    const newHash = calculateHash(json);

    if (currentHash !== newHash) {
      json.hash = newHash;
      fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n');
      console.log(`🔄 Hash updated for: ${file}`);
    }
  } catch (e) {
    console.log(`⚠️ Error processing ${file}: ${e.message}`);
  }
});


updateHashes();

