const { execSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');

console.log('--- TEST 1: PHASE 3F PRODUCTION INTEGRITY ---');

const expectedHead = '99c672a9a84070586fc5f0f813fc018a208d75d2';
const expectedJsSha = '02afc4e0f621b4326a1cbd67bfc31266a14dfa77f1b0f9767315bb971860f595';
const expectedSnapSha = '86100bda94be63a51eddc6ee2b2458133f607d50cd5f7d66c25193f3c9137f9e';

const head = execSync('git rev-parse HEAD').toString().trim();
console.log('Git HEAD:', head);
if (head !== expectedHead) {
  throw new Error(`Git HEAD mismatch: expected ${expectedHead}, got ${head}`);
}

const jsContent = fs.readFileSync('api/_data/importersData.js');
const jsSha = crypto.createHash('sha256').update(jsContent).digest('hex').toLowerCase();
console.log('importersData.js SHA256:', jsSha);
if (jsSha !== expectedJsSha) {
  throw new Error(`importersData.js SHA mismatch: expected ${expectedJsSha}, got ${jsSha}`);
}

const snapContent = fs.readFileSync('api/_data/importersData.snapshot-642.json');
const snapSha = crypto.createHash('sha256').update(snapContent).digest('hex').toLowerCase();
console.log('snapshot-642.json SHA256:', snapSha);
if (snapSha !== expectedSnapSha) {
  throw new Error(`snapshot-642.json SHA mismatch: expected ${expectedSnapSha}, got ${snapSha}`);
}

const diffOutput = execSync('node scripts/verify_baseline_diff.cjs').toString();
if (!diffOutput.includes('0 added, 0 deleted, 0 modified, 0 reordered')) {
  throw new Error('Baseline structural diff failed!');
}
console.log('[PASS] Production integrity verified 100% frozen.');
