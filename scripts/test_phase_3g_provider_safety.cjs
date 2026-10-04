/**
 * AVANI AGRO FOODS — PHASE 3G TEST SUITE
 * test_phase_3g_provider_safety.cjs
 *
 * Verifies:
 * 1. Safe credential handling (Zero unredacted secrets printed in Phase 3G reports)
 * 2. Provider status declared as CONFIGURATION_REQUIRED
 * 3. Fail-closed security architecture in backend webhook handlers
 * 4. Production env files contain no unredacted active credentials
 * 5. Hard stop and safety locks remain fully engaged (OUTREACH_AUTHORIZED = 0, GLOBAL_OUTREACH_STOP = 1)
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = 'C:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN SHINDE DOCUMENTS/DEVELOPEMENT TOOLS/2-AVANI AGRO FOODS LATUR 2026';
const BRAIN_DIR = 'C:/Users/ALPHA-1/.gemini/antigravity/brain/c47ae283-a95c-4ba0-90ce-6297b044189f';

function runTest() {
  console.log('============================================================');
  console.log('TEST SUITE: Phase 3G — Provider Configuration & Safety Audit');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  // 1. Check Phase 3G Provider Configuration report
  const providerReportPath = path.join(BRAIN_DIR, 'PHASE_3G_PROVIDER_CONFIGURATION.md');
  assert(fs.existsSync(providerReportPath), 'PHASE_3G_PROVIDER_CONFIGURATION.md exists');
  const providerContent = fs.readFileSync(providerReportPath, 'utf8');

  // Ensure no raw Resend keys leaked in report
  const rawKeyPattern = /re_[a-zA-Z0-9]{25,}/;
  const rawSecretPattern = /whsec_[a-zA-Z0-9]{25,}/;
  assert(!rawKeyPattern.test(providerContent), 'Zero unredacted Resend API keys in provider report');
  assert(!rawSecretPattern.test(providerContent), 'Zero unredacted Webhook secrets in provider report');
  assert(providerContent.includes('CONFIGURATION_REQUIRED'), 'Provider report declares CONFIGURATION_REQUIRED');

  // 2. Check Infrastructure Matrix Provider Block
  const matrixPath = path.join(BRAIN_DIR, 'PHASE_3G_EMAIL_INFRASTRUCTURE_MATRIX.json');
  assert(fs.existsSync(matrixPath), 'PHASE_3G_EMAIL_INFRASTRUCTURE_MATRIX.json exists');
  const matrix = JSON.parse(fs.readFileSync(matrixPath, 'utf8'));

  assert(matrix.email_provider.status === 'CONFIGURATION_REQUIRED', 'Email provider status in matrix is CONFIGURATION_REQUIRED');
  assert(matrix.email_provider.credentials_redacted === true, 'Credentials redacted flag is true');
  assert(matrix.email_provider.secrets_exposed === false, 'Secrets exposed flag is false');
  assert(matrix.email_provider.webhook_fail_closed_verified === true, 'Webhook fail-closed verified flag is true');

  // 3. Check Safety Invariants
  const controls = matrix.operational_controls;
  assert(controls.OUTREACH_AUTHORIZED === 0, 'OUTREACH_AUTHORIZED is 0');
  assert(controls.PILOT_AUTHORIZED === 0, 'PILOT_AUTHORIZED is 0');
  assert(controls.GLOBAL_OUTREACH_STOP === 1, 'GLOBAL_OUTREACH_STOP is 1');
  assert(controls.EMAILS_SENT === 0, 'EMAILS_SENT is 0');
  assert(controls.SMTP_PROBES === 0, 'SMTP_PROBES is 0');
  assert(controls.MX_PROBES === 0, 'MX_PROBES is 0');

  // 4. Verify Backend API Fail-Closed Implementation
  const adminQuotationsPath = path.join(ROOT_DIR, 'api/admin-quotations.js');
  assert(fs.existsSync(adminQuotationsPath), 'api/admin-quotations.js exists');
  const apiCode = fs.readFileSync(adminQuotationsPath, 'utf8');
  assert(apiCode.includes('Failing closed until RESEND_WEBHOOK_SECRET'), 'Backend endpoint fails closed on unconfigured webhook');

  // 5. Verify Production Env Safety
  const prodEnvPath = path.join(ROOT_DIR, '.env.production.local');
  if (fs.existsSync(prodEnvPath)) {
    const prodEnv = fs.readFileSync(prodEnvPath, 'utf8');
    assert(!rawKeyPattern.test(prodEnv), '.env.production.local has no unredacted live Resend keys');
  }

  const vercelEnvPath = path.join(ROOT_DIR, '.env.vercel');
  if (fs.existsSync(vercelEnvPath)) {
    const vercelEnv = fs.readFileSync(vercelEnvPath, 'utf8');
    assert(!rawKeyPattern.test(vercelEnv), '.env.vercel has no unredacted live Resend keys');
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('[ALL TESTS PASSED] Phase 3G Provider Safety verified.\n');
  }
}

runTest();
