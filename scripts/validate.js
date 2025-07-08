import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

// Paths
const airyblocksDir = path.join(process.cwd(), 'airyblocks');
const schemaPath = path.join(process.cwd(), 'schema', 'airy.schema.001.json');

// Load schema
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));

// Setup AJV with formats (like "date-time")
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
const validate = ajv.compile(schema);

// Read block files
const files = fs.readdirSync(airyblocksDir).filter(f => f.endsWith('.airyb'));

let passed = 0;
let failed = 0;

for (const file of files) {
  const filePath = path.join(airyblocksDir, file);
  const raw = fs.readFileSync(filePath, 'utf-8');
  const block = JSON.parse(raw);

  const { hash, ...blockWithoutHash } = block;
  const valid = validate(blockWithoutHash);
  const recomputed = crypto.createHash('sha256').update(JSON.stringify(blockWithoutHash)).digest('hex');

  if (!valid) {
    console.log(`❌ ${file} failed schema validation:`);
    console.log(validate.errors);
    failed++;
  } else if (recomputed !== hash) {
    console.log(`❌ ${file} failed hash check`);
    console.log(`Expected: ${hash}`);
    console.log(`Actual:   ${recomputed}`);
    failed++;
  } else {
    console.log(`✅ ${file} is valid`);
    passed++;
  }
}

console.log(`\nValidation complete: ${passed} passed, ${failed} failed.`);
if (failed > 0) process.exit(1);
