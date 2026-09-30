// ============================================================
// AVANI AGRO FOODS — DEEP LIVE PRODUCTION SECURITY ACCEPTANCE
// Tests Step 17 items against https://www.avaniagrofoods.com
// ============================================================

const fs = require('fs');

if (fs.existsSync('.env.local')) {
  const lines = fs.readFileSync('.env.local', 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const k = trimmed.substring(0, idx).trim();
        let v = trimmed.substring(idx + 1).trim();
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
          v = v.slice(1, -1);
        }
        if (!process.env[k]) {
          process.env[k] = v;
        }
      }
    }
  }
}

let passed = 0;
let failed = 0;

function assert(condition, name, details = '') {
  if (condition) {
    passed++;
    console.log(`  ✓ [PASS] ${name}`);
    if (details) console.log(`           ${details}`);
  } else {
    failed++;
    console.error(`  ✗ [FAIL] ${name}`);
    if (details) console.error(`           ${details}`);
  }
}

async function run() {
  console.log('════════════════════════════════════════════════════════════════');
  console.log('  AVANI AGRO FOODS — STEP 17 LIVE PRODUCTION SECURITY AUDIT     ');
  console.log(`  Host: https://www.avaniagrofoods.com                         `);
  console.log(`  Timestamp: ${new Date().toISOString()}                      `);
  console.log('════════════════════════════════════════════════════════════════\n');

  // 1. GET / -> 200
  const rHome = await fetch('https://www.avaniagrofoods.com/');
  assert(rHome.status === 200, 'GET / returns HTTP 200');

  // 2. GET /contact -> 200
  const rContact = await fetch('https://www.avaniagrofoods.com/contact');
  assert(rContact.status === 200, 'GET /contact returns HTTP 200');

  // 3. GET /private/quotations -> 200 SPA
  const rPriv = await fetch('https://www.avaniagrofoods.com/private/quotations');
  assert(rPriv.status === 200, 'GET /private/quotations returns HTTP 200 SPA');

  // 4. Unauthenticated GET /api/admin-quotations -> 401
  const rAdminUnauth = await fetch('https://www.avaniagrofoods.com/api/admin-quotations');
  assert(rAdminUnauth.status === 401, 'Unauthenticated GET /api/admin-quotations returns HTTP 401');

  // 5. Invalid login POST /api/verify-gate -> 401
  const rInvalidLogin = await fetch('https://www.avaniagrofoods.com/api/verify-gate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'wrong_password_attempt_999' })
  });
  assert(rInvalidLogin.status === 401, 'Invalid login POST /api/verify-gate returns HTTP 401');

  // 6. Forged session cookie -> 401
  const rForged = await fetch('https://www.avaniagrofoods.com/api/admin-quotations', {
    headers: { 'Cookie': 'avani_gate_session=forged_unauthorized_token.fake_signature' }
  });
  assert(rForged.status === 401, 'Forged session cookie returns HTTP 401');

  // 7. Invalid bearer token -> 401
  const rInvalidBearer = await fetch('https://www.avaniagrofoods.com/api/admin-quotations', {
    headers: { 'Authorization': 'Bearer invalid_secret_token_123' }
  });
  assert(rInvalidBearer.status === 401, 'Invalid Bearer token returns HTTP 401');

  // 8. Public static Apps Script source GET /sheets-webhook.txt -> must NOT expose source code
  const rTxt = await fetch('https://www.avaniagrofoods.com/sheets-webhook.txt');
  const txtBody = await rTxt.text();
  assert(rTxt.status === 404 || !txtBody.includes('doPost'),
    'Public static Apps Script source (/sheets-webhook.txt) is NOT exposed (HTTP ' + rTxt.status + ')');

  // 9. Valid login POST /api/verify-gate
  const currentPass = process.env.MASTER_GATE_PASSWORD;
  if (currentPass) {
    const rValidLogin = await fetch('https://www.avaniagrofoods.com/api/verify-gate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: currentPass })
    });
    assert(rValidLogin.status === 200, 'Valid login POST /api/verify-gate returns HTTP 200 with session cookie');
  }

  // 10. Valid Bearer token to /api/admin-quotations?action=get-products
  if (currentPass) {
    const rValidBearer = await fetch('https://www.avaniagrofoods.com/api/admin-quotations?action=get-products', {
      headers: { 'Authorization': `Bearer ${currentPass}` }
    });
    assert(rValidBearer.status === 200, 'Valid Bearer token to /api/admin-quotations returns HTTP 200');
  }

  console.log('\n════════════════════════════════════════════════════════════════');
  console.log(`  STEP 17 AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED     `);
  console.log('════════════════════════════════════════════════════════════════\n');

  if (failed > 0) process.exit(1);
}

run().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
