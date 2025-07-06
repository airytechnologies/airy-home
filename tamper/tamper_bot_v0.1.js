const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { diffLines } = require('diff');

const blocksDir = path.join(__dirname, '../airyblocks');
const tamperLogPath = path.join(__dirname, 'tamper_log.json');

function calculateHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function loadTamperLog() {
  if (fs.existsSync(tamperLogPath)) {
    return JSON.parse(fs.readFileSync(tamperLogPath, 'utf8'));
  }
  return [];
}

function saveTamperLog(log) {
  fs.writeFileSync(tamperLogPath, JSON.stringify(log, null, 2));
}

function checkBlocks() {
  const tamperLog = loadTamperLog();

  const files = fs.readdirSync(blocksDir).filter(f => f.endsWith('.airyb'));

  for (const file of files) {
    const filePath = path.join(blocksDir, file);
    const raw = fs.readFileSync(filePath, 'utf8');
    let block;
    try {
      block = JSON.parse(raw);
    } catch (e) {
      console.error(`Failed to parse ${file}`);
      continue;
    }

    const { hash, ...withoutHash } = block;
    const recomputedHash = calculateHash(JSON.stringify(withoutHash));

    if (hash !== recomputedHash) {
      const diff = diffLines(JSON.stringify(withoutHash, null, 2), JSON.stringify(block, null, 2));

      tamperLog.push({
        block: file,
        detected_at: new Date().toISOString(),
        original_hash: hash,
        recalculated_hash: recomputedHash,
        full_block: block,
        differences: diff,
        ip: block?.agent?.ip || 'unknown',
        userAgent: block?.agent?.userAgent || 'unknown',
        referrer: block?.agent?.referrer || 'unknown'
      });

      console.log(`Tampering detected in ${file}`);
    }
  }

  saveTamperLog(tamperLog);
}

checkBlocks();
