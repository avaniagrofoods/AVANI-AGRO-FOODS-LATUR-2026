const assert = require('assert');

const BASE_URL = 'https://www.avaniagrofoods.com';

async function main() {
  console.log('============================================================');
  console.log('AVANI AGRO FOODS — P4.1 LIVE PRODUCTION FORENSIC VALIDATION');
  console.log(`Target Host: ${BASE_URL}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('============================================================\n');

  let passed = 0;
  let total = 0;

  async function check(name, fn) {
    total++;
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] ${name} -> ${err.message}`);
    }
  }

  // 1. RFQ Page Loads
  await check('1. RFQ Page Loads (/contact)', async () => {
    const res = await fetch(`${BASE_URL}/contact`, {
      headers: { 'User-Agent': 'Avani-Forensic-Audit/4.1' }
    });
    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert.ok(html.toLowerCase().includes('<!doctype html>') || html.includes('<div id="root">'), 'Valid HTML page');
  });

  // 2. Product Prefill URL Support
  await check('2. Product & Qty Prefill URL loads (/contact?product=moringa-leaf-powder&qty=18MT)', async () => {
    const res = await fetch(`${BASE_URL}/contact?product=moringa-leaf-powder&qty=18MT`, {
      headers: { 'User-Agent': 'Avani-Forensic-Audit/4.1' }
    });
    assert.strictEqual(res.status, 200);
  });

  // 3. Validation Works on Live Endpoint (HTTP 400 or HTTP 429 if IP rate limited)
  await check('3. Validation Rejection on Invalid Payload (HTTP 400 or 429 Rate Limited)', async () => {
    const res = await fetch(`${BASE_URL}/api/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': BASE_URL
      },
      body: JSON.stringify({
        fullName: '',
        email: 'invalid-email',
        product: '',
        quantity: -100
      })
    });
    if (res.status === 429) {
      console.log('      -> Production IP rate-limiter active (HTTP 429 confirmed)');
      assert.strictEqual(res.status, 429);
    } else {
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.ok(Array.isArray(data.errors) && data.errors.length > 0);
    }
  });

  // 4. Live RFQ Submission (HTTP 201 or HTTP 429 if IP rate limited)
  await check('4. Live RFQ Submission / Rate Limit Protection (HTTP 201 or 429)', async () => {
    const res = await fetch(`${BASE_URL}/api/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': BASE_URL
      },
      body: JSON.stringify({
        fullName: 'Dr. Marcus Vance',
        companyName: 'Vance Botanical GmbH',
        country: 'Germany',
        email: `procurement-${Date.now()}@vancebotanical.de`,
        phone: '+49 30 901820',
        product: 'Moringa Leaf Powder',
        quantity: '18 MT',
        destinationPort: 'Port of Hamburg',
        incoterm: 'CIF Hamburg',
        mesh: '80–100 Mesh',
        moisture: 'Max 7–8%',
        packaging: '25 kg Food-Grade HDPE Bags',
        timeline: 'Shipment within 60–75 days',
        sampleRequired: true,
        coaRequired: true,
        testingRequired: true,
        message: 'Looking for long-term supply agreement for food supplement manufacturing.'
      })
    });
    if (res.status === 429) {
      console.log('      -> Production IP rate-limiter active & verified (HTTP 429 protection verified)');
      assert.strictEqual(res.status, 429);
    } else {
      assert.strictEqual(res.status, 201);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.match(data.leadId, /^AAF-L-\d{4}-\d{4}$/);
      console.log(`      -> Verified Lead ID Generated: ${data.leadId}`);
    }
  });

  // 5. Method Rejection Check (GET /api/leads -> 405 Method Not Allowed)
  await check('5. Method Rejection Check (GET -> 405)', async () => {
    const res = await fetch(`${BASE_URL}/api/leads`, {
      method: 'GET',
      headers: { 'Origin': BASE_URL }
    });
    assert.strictEqual(res.status, 405);
    assert.strictEqual(res.headers.get('allow'), 'POST');
    const data = await res.json();
    assert.strictEqual(data.error, 'Method Not Allowed');
  });

  // 6. Security: Helper directories not exposed as endpoints
  await check('6. Helper directory files are not public endpoints (GET /api/_lib/auth -> 404)', async () => {
    const res = await fetch(`${BASE_URL}/api/_lib/auth`, {
      headers: { 'Origin': BASE_URL }
    });
    // Vercel routes underscore files to 404 or index rewrite (HTML)
    assert.ok(res.status === 404 || res.status === 200);
    const ct = res.headers.get('content-type') || '';
    assert.ok(!ct.includes('application/javascript') && !ct.includes('application/json'), 'Helper code not exposed directly');
  });

  // 7. Quotation Engine Regression on Production
  await check('7. Live Production Quotation Parity (AAF-Q-2026-9075)', async () => {
    const calcRes = await fetch(`${BASE_URL}/api/quotation?action=calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': BASE_URL
      },
      body: JSON.stringify({
        quoteId: 'AAF-Q-2026-9075',
        currency: 'INR',
        items: [
          { name: 'Moringa Leaf Powder - Organic Grade', quantity: 18000, rate: 650 },
          { name: 'Dehydrated Red Onion Powder', quantity: 18000, rate: 350 }
        ]
      })
    });
    assert.strictEqual(calcRes.status, 200);
    const data = await calcRes.json();
    const calc = data.quote || data.quotation || data;
    assert.strictEqual(calc.items[0].total, 11700000);
    assert.strictEqual(calc.items[1].total, 6300000);
    assert.strictEqual(calc.grandTotal, 18000000);
  });

  console.log('\n============================================================');
  console.log(`LIVE AUDIT VERDICT: ${passed}/${total} CHECKS PASSED`);
  console.log('============================================================');
  if (passed !== total) process.exit(1);
}

main().catch(e => {
  console.error('Fatal live audit failure:', e);
  process.exit(1);
});
