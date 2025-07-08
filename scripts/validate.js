const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

// Setup AJV and add format validation (for date-time)
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

// Load the schema
const schemaPath = path.join(__dirname, '../schema/airy.schema.001.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
const validate = ajv.compile(schema);

// Read all .airyb files
const blocksDir = path.join(__dirname, '../airyblocks');
const files = fs.readdirSync(blocksDir)
  .filter(file => file.endsWith('.airyb') && !file.startsWith('legacy/'));

let passed = 0;
let failed = 0;

files.forEach(file => {
  const filePath = path.join(blocksDir, file);
  const raw = fs.readFileSync(filePath, 'utf-8');
  const block = JSON.parse(raw);

  const { hash, ...blockWithoutHash } = block;
  const valid = validate(blockWithoutHash);
  const recalculated = crypto.createHash('sha256').update(JSON.stringify(blockWithoutHash)).digest('hex');

  if (!valid) {
    console.log(`❌ ${file} failed schema validation:`);
    console.log(validate.errors);
    failed++;
  } else if (recalculated !== hash) {
    console.log(`❌ ${file} failed hash check`);
    console.log(`Expected: ${hash}`);
    console.log(`Actual:   ${recalculated}`);
    failed++;
  } else {
    console.log(`✅ ${file} passed`);
    passed++;
  }
});

console.log(`\nValidation complete: ${passed} passed, ${failed} failed.`);
if (failed > 0) process.exit(1);
