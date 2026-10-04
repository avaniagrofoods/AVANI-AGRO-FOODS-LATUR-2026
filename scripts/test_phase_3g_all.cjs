/**
 * AVANI AGRO FOODS — PHASE 3G MASTER TEST RUNNER
 * test_phase_3g_all.cjs
 *
 * Runs all Phase 3G automated tests:
 * 1. Sender Identity & Positioning
 * 2. Domain Authentication Checklist
 * 3. Provider Safety & Credential Isolation
 */

const { execSync } = require('child_process');
const path = require('path');

const tests = [
  'test_phase_3g_sender_identity.cjs',
  'test_phase_3g_auth_checklist.cjs',
  'test_phase_3g_provider_safety.cjs'
];

console.log('============================================================');
console.log('AVANI AGRO FOODS — PHASE 3G MASTER TEST SUITE');
console.log('============================================================\n');

let allPassed = true;

for (const test of tests) {
  const testPath = path.join(__dirname, test);
  console.log(`>>> EXECUTING: ${test}`);
  try {
    const output = execSync(`node "${testPath}"`, { encoding: 'utf8' });
    console.log(output);
  } catch (err) {
    console.error(`FAILED: ${test}`);
    console.error(err.stdout || err.message);
    allPassed = false;
    break;
  }
}

if (allPassed) {
  console.log('============================================================');
  console.log('[SUCCESS] ALL PHASE 3G AUTOMATED TESTS PASSED (100%)');
  console.log('============================================================\n');
  process.exit(0);
} else {
  console.error('============================================================');
  console.error('[FAILURE] ONE OR MORE PHASE 3G TESTS FAILED');
  console.error('============================================================\n');
  process.exit(1);
}
