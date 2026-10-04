const fs = require('fs');
const path = require('path');

console.log('--- TEST 6: PHASE 3F DRY RUN & ZERO-SEND VERIFICATION ---');

const brainDir = 'C:\\Users\\ALPHA-1\\.gemini\\antigravity\\brain\\c47ae283-a95c-4ba0-90ce-6297b044189f';
const dryRunData = JSON.parse(fs.readFileSync(path.join(brainDir, 'PHASE_3F_DRY_RUN_RESULTS.json'), 'utf8'));

if (dryRunData.length !== 16) {
  throw new Error(`Dry run results count mismatch: expected 16, got ${dryRunData.length}`);
}

dryRunData.forEach(r => {
  if (r.validationCheck !== 'PASS') throw new Error(`Record ${r.recordId} failed validation check`);
  if (r.suppressionCheck !== 'PASS_NOT_SUPPRESSED') throw new Error(`Record ${r.recordId} failed suppression check`);
  if (r.duplicateCheck !== 'PASS_NO_DUPLICATE') throw new Error(`Record ${r.recordId} failed duplicate check`);
  if (r.actualTransmissionStatus !== 'TRANSMISSION_BLOCKED') {
    throw new Error(`CRITICAL: Record ${r.recordId} transmission was not blocked!`);
  }
});

console.log('[PASS] Dry run verified. All 16 records evaluated and 100% transmission blocked.');
