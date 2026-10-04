/**
 * AVANI AGRO FOODS — PHASE 3G FINAL TEST SUITE
 * test_phase_3g_final.cjs
 *
 * Verifies:
 * 1. Remediation report and final gate matrix exist and are consistent
 * 2. Live DNS authentication status records real findings (SPF FAIL, DKIM PASS, DMARC PASS)
 * 3. Provider final status records fail-closed behavior and CREDENTIAL_REQUIRED
 * 4. Security scan confirms zero secret exposure (PASS)
 * 5. Hard stop and safety locks remain fully engaged (OUTREACH_AUTHORIZED = 0, GLOBAL_OUTREACH_STOP = 1)
 * 6. Cryptographic production dataset baseline remains 100% frozen
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT_DIR = 'C:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN SHINDE DOCUMENTS/DEVELOPEMENT TOOLS/2-AVANI AGRO FOODS LATUR 2026';
const BRAIN_DIR = 'C:/Users/ALPHA-1/.gemini/antigravity/brain/c47ae283-a95c-4ba0-90ce-6297b044189f';

function runTest() {
  console.log('============================================================');
  console.log('TEST SUITE: Phase 3G — Final Remediation & Closure Audit');
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

  // 1. Verify Remediation Report
  const remReportPath = path.join(BRAIN_DIR, 'PHASE_3G_REMEDIATION_REPORT.md');
  assert(fs.existsSync(remReportPath), 'PHASE_3G_REMEDIATION_REPORT.md exists');
  const remReport = fs.readFileSync(remReportPath, 'utf8');
  assert(remReport.includes('CONDITIONAL_PASS'), 'Remediation report classifies status as CONDITIONAL_PASS');
  assert(remReport.includes('EMAIL_PROVIDER = NOT_CONFIGURED'), 'Remediation report documents EMAIL_PROVIDER = NOT_CONFIGURED');
  assert(remReport.includes('RFC 7208'), 'Remediation report cites RFC 7208 regarding dual SPF records');

  // 2. Verify Final Gate Matrix
  const matrixPath = path.join(BRAIN_DIR, 'PHASE_3G_FINAL_GATE_MATRIX.json');
  assert(fs.existsSync(matrixPath), 'PHASE_3G_FINAL_GATE_MATRIX.json exists');
  const matrix = JSON.parse(fs.readFileSync(matrixPath, 'utf8'));
  assert(matrix.overall_phase_3g_status === 'CONDITIONAL_PASS', 'Final gate matrix status is CONDITIONAL_PASS');
  assert(matrix.gate_evaluations['G3.1_SENDER_IDENTITY'].status === 'PASS', 'Gate G3.1 status is PASS');
  assert(matrix.gate_evaluations['G3.2_DOMAIN_AUTHENTICATION'].status === 'ACTION_REQUIRED', 'Gate G3.2 status is ACTION_REQUIRED');
  assert(matrix.gate_evaluations['G3.3_EMAIL_PROVIDER'].status === 'CONFIGURATION_REQUIRED', 'Gate G3.3 status is CONFIGURATION_REQUIRED');
  assert(matrix.gate_evaluations['G3.4_DELIVERABILITY_ARCHITECTURE'].status === 'PASS', 'Gate G3.4 status is PASS');
  assert(matrix.gate_evaluations['G3.5_COMPLIANCE'].status === 'IMPLEMENTATION_REVIEWED', 'Gate G3.5 status is IMPLEMENTATION_REVIEWED');

  // 3. Verify Final Authentication Status
  const authPath = path.join(BRAIN_DIR, 'PHASE_3G_FINAL_AUTHENTICATION_STATUS.json');
  assert(fs.existsSync(authPath), 'PHASE_3G_FINAL_AUTHENTICATION_STATUS.json exists');
  const authStatus = JSON.parse(fs.readFileSync(authPath, 'utf8'));
  assert(authStatus.live_dns_findings.spf.status === 'FAIL', 'Live SPF status is FAIL (dual records)');
  assert(authStatus.live_dns_findings.dkim.status === 'PASS', 'Live DKIM status is PASS');
  assert(authStatus.live_dns_findings.dmarc.status === 'PASS', 'Live DMARC status is PASS');
  assert(authStatus.live_dns_findings.spf.record_count === 2, 'Live SPF count is 2 (violates RFC 7208)');

  // 4. Verify Provider Final Status
  const provPath = path.join(BRAIN_DIR, 'PHASE_3G_PROVIDER_FINAL_STATUS.json');
  assert(fs.existsSync(provPath), 'PHASE_3G_PROVIDER_FINAL_STATUS.json exists');
  const provStatus = JSON.parse(fs.readFileSync(provPath, 'utf8'));
  assert(provStatus.final_provider_gate_status === 'CREDENTIAL_REQUIRED', 'Provider gate status is CREDENTIAL_REQUIRED');
  assert(provStatus.fail_closed_verification.api_key_missing === 'NO_SEND', 'Missing API key results in NO_SEND');
  assert(provStatus.fail_closed_verification.global_stop_enabled === 'NO_SEND', 'Global stop results in NO_SEND');
  assert(provStatus.fail_closed_verification.recipient_suppressed === 'NO_SEND', 'Suppressed recipient results in NO_SEND');

  // 5. Verify Security Scan
  const secPath = path.join(BRAIN_DIR, 'PHASE_3G_SECURITY_SCAN.json');
  assert(fs.existsSync(secPath), 'PHASE_3G_SECURITY_SCAN.json exists');
  const secStatus = JSON.parse(fs.readFileSync(secPath, 'utf8'));
  assert(secStatus.secret_exposure_status === 'PASS', 'Security scan secret exposure status is PASS');
  assert(secStatus.findings_summary.committed_source_secrets === 0, 'Zero committed source secrets');

  // 6. Verify Safety Invariants
  const controls = matrix.operational_controls;
  assert(controls.OUTREACH_AUTHORIZED === 0, 'OUTREACH_AUTHORIZED is 0');
  assert(controls.PILOT_AUTHORIZED === 0, 'PILOT_AUTHORIZED is 0');
  assert(controls.GLOBAL_OUTREACH_STOP === 1, 'GLOBAL_OUTREACH_STOP is 1');
  assert(controls.EMAILS_SENT === 0, 'EMAILS_SENT is 0');
  assert(controls.SMTP_PROBES === 0, 'SMTP_PROBES is 0');
  assert(controls.MX_PROBES === 0, 'MX_PROBES is 0');
  assert(controls.DATASET_MUTATIONS === 0, 'DATASET_MUTATIONS is 0');

  // 7. Verify Production Baseline Hashes
  function hash(f) { return crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT_DIR, f))).digest('hex').toUpperCase(); }
  const impHash = hash('api/_data/importersData.js');
  const snapHash = hash('api/_data/importersData.snapshot-642.json');
  assert(impHash === '02AFC4E0F621B4326A1CBD67BFC31266A14DFA77F1B0F9767315BB971860F595', 'importersData.js SHA256 matches frozen baseline');
  assert(snapHash === '86100BDA94BE63A51EDDC6EE2B2458133F607D50CD5F7D66C25193F3C9137F9E', 'snapshot-642.json SHA256 matches frozen baseline');

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('[ALL TESTS PASSED] Phase 3G Final Remediation & Closure Audit verified.\n');
  }
}

runTest();
