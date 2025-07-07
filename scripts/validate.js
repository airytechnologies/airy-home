import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import Ajv from 'ajv';

const airyblocksDir = path.join(process.cwd(), 'airyblocks');
const schemaPath = path.join(process.cwd(), 'schema', 'airy.schema.001.json');

const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(schema);

const files = fs.readdirSync(airyblocksDir).filter(f => f.endsWith('.airyb'));

let passed = 0;
let failed = 0;

for (const file of files) {
  const filePath = path.join(airyblocksDir, file);
  const contentRaw = fs.readFileSync(filePath, 'utf-8');
  const content = JSON.parse(contentRaw);

  // Extract and remove hash before validating and recalculating
  const originalHash = content.hash;
  delete content.hash;

  const valid = validate(content);
  const recalculatedHash = crypto.createHash('sha256').update(JSON.stringify(content)).digest('hex');

  if (!valid) {
    console.log(`❌ ${file} failed schema validation.`);
    console.log(validate.errors);
    failed++;
  } else if (recalculatedHash !== originalHash) {
    console.log(`❌ ${file} failed hash match.\nExpected: ${originalHash}\nActual:   ${recalculatedHash}`);
    failed++;
  } else {
    console.log(`✅ ${file} is valid.`);
    passed++;
  }
}

console.log(`\nValidation complete: ${passed} passed, ${failed} failed.`);
