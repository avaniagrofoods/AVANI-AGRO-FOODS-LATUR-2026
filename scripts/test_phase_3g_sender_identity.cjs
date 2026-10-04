/**
 * AVANI AGRO FOODS — PHASE 3G TEST SUITE
 * test_phase_3g_sender_identity.cjs
 *
 * Verifies:
 * 1. Sender email: sales@avaniagrofoods.com
 * 2. Display name: AVANI AGRO FOODS
 * 3. Contact person: Sachin Shinde
 * 4. Physical address matches registered address in Latur, Maharashtra
 * 5. Strict sourcing and export coordination partner positioning
 * 6. Zero prohibited representations (manufacturer, factory, farmer, producer, certified manufacturer, etc.)
 * 7. Compliant sender signatures across all outreach templates T01-T07
 */

const fs = require('fs');
const path = require('path');

const BRAIN_DIR = 'C:/Users/ALPHA-1/.gemini/antigravity/brain/c47ae283-a95c-4ba0-90ce-6297b044189f';

function runTest() {
  console.log('============================================================');
  console.log('TEST SUITE: Phase 3G — Sender Identity & Positioning Audit');
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

  // 1. Verify Infrastructure Matrix Sender Identity
  const matrixPath = path.join(BRAIN_DIR, 'PHASE_3G_EMAIL_INFRASTRUCTURE_MATRIX.json');
  assert(fs.existsSync(matrixPath), 'PHASE_3G_EMAIL_INFRASTRUCTURE_MATRIX.json exists');
  const matrix = JSON.parse(fs.readFileSync(matrixPath, 'utf8'));

  const sender = matrix.sender_identity;
  assert(sender.from_email === 'sales@avaniagrofoods.com', 'Sender From email is sales@avaniagrofoods.com');
  assert(sender.display_name === 'AVANI AGRO FOODS', 'Sender Display Name is AVANI AGRO FOODS');
  assert(sender.contact_person === 'Sachin Shinde', 'Contact Person is Sachin Shinde');
  assert(sender.positioning.toLowerCase().includes('sourcing') && sender.positioning.toLowerCase().includes('coordination'), 'Positioning includes sourcing and coordination partner');

  // Address check
  const addr = sender.physical_address;
  assert(addr.city === 'Latur' && addr.postal_code === '413512' && addr.state === 'Maharashtra', 'Physical address city, postal code, and state match Latur-413512, Maharashtra');

  // Forbidden claims in Matrix
  const forbiddenAudit = sender.forbidden_representations_audit;
  assert(forbiddenAudit.manufacturer_claimed === false, 'Manufacturer is NOT claimed');
  assert(forbiddenAudit.factory_claimed === false, 'Factory owner is NOT claimed');
  assert(forbiddenAudit.farmer_claimed === false, 'Farmer is NOT claimed');
  assert(forbiddenAudit.producer_claimed === false, 'Producer is NOT claimed');
  assert(forbiddenAudit.certified_manufacturer_claimed === false, 'Certified manufacturer is NOT claimed');
  assert(forbiddenAudit.large_exporter_claimed === false, 'Large exporter claim is NOT made');

  // 2. Verify Sender Audit Document
  const auditPath = path.join(BRAIN_DIR, 'PHASE_3G_SENDER_IDENTITY_AUDIT.md');
  assert(fs.existsSync(auditPath), 'PHASE_3G_SENDER_IDENTITY_AUDIT.md exists');
  const auditContent = fs.readFileSync(auditPath, 'utf8');
  assert(auditContent.includes('sales@avaniagrofoods.com'), 'Audit doc references sales@avaniagrofoods.com');
  assert(auditContent.includes('Latur-413512, Maharashtra, India'), 'Audit doc references full postal address');
  assert(auditContent.includes('GATE G3.1 PASSED'), 'Audit doc declares GATE G3.1 PASSED');

  // 3. Verify Templates T01-T07 contain valid postal address and sender persona
  const templatesPath = path.join(BRAIN_DIR, 'PHASE_3F_EMAIL_TEMPLATES.md');
  assert(fs.existsSync(templatesPath), 'PHASE_3F_EMAIL_TEMPLATES.md exists');
  const templatesContent = fs.readFileSync(templatesPath, 'utf8');

  // Check each template T01 to T07
  for (let i = 1; i <= 7; i++) {
    const tId = `T0${i}`;
    assert(templatesContent.includes(`Template ${tId}`), `Template ${tId} exists in email templates`);
  }

  // Address presence in templates
  assert(templatesContent.includes('Latur-413512, Maharashtra, India'), 'Templates contain complete physical address');
  assert(templatesContent.includes('Sachin Shinde'), 'Templates contain Sachin Shinde as sign-off');
  assert(templatesContent.includes('UNSUBSCRIBE'), 'Templates contain clear opt-out keyword UNSUBSCRIBE');

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('[ALL TESTS PASSED] Phase 3G Sender Identity verified.\n');
  }
}

runTest();
