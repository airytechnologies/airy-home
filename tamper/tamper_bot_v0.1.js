const fs = require('fs');
const path = require('path');

// Load blocks directory from repo root
const blocksDir = path.resolve('airyblocks');

// Load tamper log JSON from current script folder
const tamperLogPath = path.join(__dirname, 'tamper_log.json');
let tamperLog;

try {
  const data = fs.readFileSync(tamperLogPath, 'utf8');
  tamperLog = JSON.parse(data);
  if (!Array.isArray(tamperLog)) {
    console.warn('⚠️ tamper_log.json was not an array. Resetting to empty array.');
    tamperLog = [];
  }
} catch (err) {
  console.error('❌ Failed to read or parse tamper_log.json. Starting with empty log.');
  tamperLog = [];
}

function checkBlocks() {
  const files = fs.readdirSync(blocksDir).filter(f => f.endsWith('.airyb'));

  files.forEach(file => {
    const filePath = path.join(blocksDir, file);
    const contents = fs.readFileSync(filePath, 'utf8');

    // Fake tamper detection for now: flag files missing the word "meta"
    if (!contents.includes('"meta"')) {
      console.log(`⚠️  Potential tamper detected: ${file}`);

      tamperLog.push({
        block: file,
        reason: 'Missing "meta" field',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Write back tamper log
  fs.writeFileSync(tamperLogPath, JSON.stringify(tamperLog, null, 2));
  console.log('✅ Tamper check complete.');
}

checkBlocks();

}

checkBlocks();
