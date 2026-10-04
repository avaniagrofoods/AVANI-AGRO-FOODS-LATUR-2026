/**
 * AVANI AGRO FOODS — PHASE 3G TEST SUITE
 * test_phase_3g_auth_checklist.cjs
 *
 * Verifies:
 * 1. PHASE_3G_DOMAIN_AUTHENTICATION_CHECKLIST.json schema and completeness
 * 2. Strict status = NOT_TESTED_EXTERNAL (Zero fake PASS)
 * 3. Live DNS probing prohibited flag = false
 * 4. Precise technical specifications for SPF, DKIM, DMARC, MX
 * 5. Manual verification instructions documented
 */

const fs = require('fs');
const path = require('path');

const BRAIN_DIR = 'C:/Users/ALPHA-1/.gemini/antigravity/brain/c47ae283-a95c-4ba0-90ce-6297b044189f';

function runTest() {
  console.log('============================================================');
  console.log('TEST SUITE: Phase 3G — Domain Authentication Checklist Audit');
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

  const checklistPath = path.join(BRAIN_DIR, 'PHASE_3G_DOMAIN_AUTHENTICATION_CHECKLIST.json');
  assert(fs.existsSync(checklistPath), 'PHASE_3G_DOMAIN_AUTHENTICATION_CHECKLIST.json exists');

  const checklist = JSON.parse(fs.readFileSync(checklistPath, 'utf8'));

  // 1. Policy assertions
  assert(checklist.domain === 'avaniagrofoods.com', 'Domain is avaniagrofoods.com');
  assert(checklist.overall_dns_status === 'NOT_TESTED_EXTERNAL', 'Overall DNS status is NOT_TESTED_EXTERNAL');
  assert(checklist.probing_policy.live_dns_probing_permitted === false, 'Live DNS probing is forbidden (false)');
  assert(checklist.probing_policy.smtp_handshake_permitted === false, 'SMTP handshake is forbidden (false)');
  assert(checklist.probing_policy.fake_pass_permitted === false, 'Fake PASS is forbidden (false)');

  // 2. Specifications assertions
  const specs = checklist.authentication_specifications;
  assert(specs.spf && specs.spf.status === 'NOT_TESTED_EXTERNAL', 'SPF specification exists with status NOT_TESTED_EXTERNAL');
  assert(specs.spf.expected_value.includes('v=spf1'), 'SPF record syntax starts with v=spf1');

  assert(specs.dkim && specs.dkim.status === 'NOT_TESTED_EXTERNAL', 'DKIM specification exists with status NOT_TESTED_EXTERNAL');
  assert(specs.dkim.expected_selector === 'resend', 'DKIM selector is documented');

  assert(specs.dmarc && specs.dmarc.status === 'NOT_TESTED_EXTERNAL', 'DMARC specification exists with status NOT_TESTED_EXTERNAL');
  assert(specs.dmarc.expected_value.includes('v=DMARC1'), 'DMARC record syntax starts with v=DMARC1');

  assert(specs.mx && specs.mx.status === 'NOT_TESTED_EXTERNAL', 'MX specification exists with status NOT_TESTED_EXTERNAL');

  // 3. Action items presence
  assert(Array.isArray(checklist.action_items_before_production_authorization) && checklist.action_items_before_production_authorization.length > 0, 'Action items for manual admin verification are populated');

  // 4. Ensure no unauthorized PASS exists anywhere in checklist
  const jsonString = JSON.stringify(checklist);
  const fakePassFound = /"status"\s*:\s*"PASS"/i.test(jsonString);
  assert(!fakePassFound, 'Zero fake PASS statuses in domain authentication checklist');

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('[ALL TESTS PASSED] Phase 3G Domain Auth Checklist verified.\n');
  }
}

runTest();
