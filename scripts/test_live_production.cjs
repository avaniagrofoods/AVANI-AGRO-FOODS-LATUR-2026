// ============================================================
// AVANI AGRO FOODS — LIVE PRODUCTION SMOKE TEST
// Tests live endpoints on https://www.avaniagrofoods.com
// ============================================================

const https = require('https');

async function fetchUrl(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          buffer,
          text: buffer.toString('utf-8')
        });
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function runLiveTests() {
  console.log('════════════════════════════════════════════════════════════════');
  console.log('  AVANI AGRO FOODS — LIVE PRODUCTION VERIFICATION SUITE         ');
  console.log(`  Live URL: https://www.avaniagrofoods.com                     `);
  console.log(`  Timestamp: ${new Date().toISOString()}                      `);
  console.log('════════════════════════════════════════════════════════════════\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details) {
    if (condition) {
      passed++;
      console.log(`  ✓ [PASS] ${testName}`);
      if (details) console.log(`           ${details}`);
    } else {
      failed++;
      console.error(`  ✗ [FAIL] ${testName}`);
      if (details) console.error(`           ${details}`);
    }
  }

  // 1. Live Contact Page
  console.log('\n--- 1. Testing Live Website Pages ---');
  const contactRes = await fetchUrl('https://www.avaniagrofoods.com/contact');
  assert(contactRes.statusCode === 200 && contactRes.text.includes('AVANI AGRO FOODS'),
    'Live Contact Page returns HTTP 200 with company branding',
    `Status: ${contactRes.statusCode}, Body size: ${contactRes.buffer.length} bytes`);

  // 2. Live Private Quotations Page
  const quotesRes = await fetchUrl('https://www.avaniagrofoods.com/private/quotations');
  assert(quotesRes.statusCode === 200,
    'Live Quotations Page (/private/quotations) returns HTTP 200',
    `Status: ${quotesRes.statusCode}, Body size: ${quotesRes.buffer.length} bytes`);

  // 3. Security Check: Unauthenticated Admin Endpoint Protection (Section 23)
  console.log('\n--- 2. Testing Live Security & Product Master API ---');
  const unauthRes = await fetchUrl('https://www.avaniagrofoods.com/api/admin-quotations');
  assert(unauthRes.statusCode === 401,
    'Section 23 Security: Unauthenticated request to /api/admin-quotations is blocked with HTTP 401',
    `Status: ${unauthRes.statusCode}`);

  // Authenticated Admin Product Master Request (Environment-Driven Secret)
  const adminPassword = process.env.AVANI_TEST_ADMIN_SECRET || process.env.PRIVATE_PORTAL_PASSWORD || process.env.MASTER_GATE_PASSWORD;
  if (!adminPassword) {
    console.log('[SECURITY NOTE] Skipping authenticated bearer test: AVANI_TEST_ADMIN_SECRET not set in environment.');
  } else {
    const prodMasterRes = await fetchUrl('https://www.avaniagrofoods.com/api/admin-quotations?action=get-products', {
      headers: {
        'Authorization': `Bearer ${adminPassword}`
      }
    });

    let productsJson = null;
    try {
      productsJson = JSON.parse(prodMasterRes.text);
    } catch (e) {}

    assert(prodMasterRes.statusCode === 200 && productsJson && Array.isArray(productsJson.products),
      'Authenticated Product Master endpoint returns canonical product catalog',
      `Status: ${prodMasterRes.statusCode}, Products count: ${productsJson?.products?.length}`);

    const moringaProd = productsJson?.products?.find(p => p.productId === 'moringa-leaf-powder');
    assert(moringaProd && moringaProd.hsCode === '12119029',
      'Live Product Master serves Moringa HS Code 12119029',
      `HS Code: ${moringaProd?.hsCode}`);

    const onionProd = productsJson?.products?.find(p => p.productId === 'red-onion-powder');
    assert(onionProd && onionProd.hsCode === '07122000',
      'Live Product Master serves Red Onion HS Code 07122000',
      `HS Code: ${onionProd?.hsCode}`);
  }

  // 4. Live Lead Capture & Auto-Quotation Draft
  console.log('\n--- 3. Testing Live Inquiry Submission & Auto-Quotation Draft ---');
  const testLeadPayload = JSON.stringify({
    name: 'VIKRAM',
    company: 'VIKRAJA SOLAPUR',
    email: 'vikrajaexports@gmail.com',
    phone: '84464 19006',
    country: 'INDIA',
    product: 'Moringa Leaf Powder',
    quantity: '18000',
    targetPrice: '350',
    currency: 'INR',
    incoterm: 'FOB Nhava Sheva (JNPT Mumbai)',
    destination: 'Designated International Port',
    message: 'We have a bulk export requirement for 18 MT Moringa Leaf Powder. Natural Green, 80–100 Mesh, Moisture Max 7–8%, 100% Pure, 25 kg Food-Grade HDPE Bags.',
    source: 'Automated_Production_Acceptance_Test'
  });

  const leadRes = await fetchUrl('https://www.avaniagrofoods.com/api/save-lead', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(testLeadPayload)
    },
    body: testLeadPayload
  });

  let leadJson = null;
  try {
    leadJson = JSON.parse(leadRes.text);
  } catch (e) {}

  assert(leadRes.statusCode === 200 && leadJson && leadJson.success === true,
    'Live /api/save-lead successfully received inquiry',
    `Status: ${leadRes.statusCode}, Success: ${leadJson?.success}`);

  assert(leadJson?.inquiryId && leadJson.inquiryId.startsWith('AAF-INQ-2026-'),
    'Live system generated Inquiry ID with standard format',
    `Inquiry ID: ${leadJson?.inquiryId}`);

  assert(leadJson?.quoteId && leadJson.quoteId.startsWith('AAF-Q-2026-'),
    'Live system generated Quotation Draft ID with standard format',
    `Quotation ID: ${leadJson?.quoteId}`);

  const draft = leadJson?.quotationDraft;
  assert(draft && draft.grandTotal === 6300000,
    'Live Auto-Quotation Draft calculated exactly: 18,000 × ₹350 = ₹6,300,000.00',
    `Calculated Grand Total: ${draft?.currency} ${draft?.grandTotal}`);

  assert(draft && draft.items[0]?.hscode === '12119029',
    'Live Auto-Quotation Draft contains canonical HS Code 12119029',
    `Item HS Code: ${draft?.items[0]?.hscode}`);

  // 5. Live PDF Generation via API
  console.log('\n--- 4. Testing Live PDF Generation Endpoint ---');
  const quoteDocPayload = JSON.stringify(draft || {
    quoteId: 'AAF-Q-2026-9075',
    buyerName: 'VIKRAM',
    companyName: 'VIKRAJA SOLAPUR',
    email: 'vikrajaexports@gmail.com',
    phone: '84464 19006',
    country: 'INDIA',
    currency: 'INR',
    incoterm: 'FOB',
    destinationPort: 'NHAVA SHEVA (JNPT MUMBAI)',
    subtotal: 6300000,
    grandTotal: 6300000,
    items: [
      {
        name: 'Moringa Leaf Powder',
        description: 'Moringa Leaf Powder — Natural Green, 80–100 Mesh, Moisture Max 7–8%, 100% Pure, 25 kg Food-Grade HDPE Bags.',
        hscode: '12119029',
        quantity: 18000,
        unit: 'KG',
        rate: 350,
        amount: 6300000
      }
    ]
  });

  const pdfRes = await fetchUrl('https://www.avaniagrofoods.com/api/quotation?action=download-pdf', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(quoteDocPayload)
    },
    body: quoteDocPayload
  });

  assert(pdfRes.statusCode === 200 && pdfRes.headers['content-type'] === 'application/pdf',
    'Live /api/quotation?action=download-pdf returns application/pdf with HTTP 200',
    `Status: ${pdfRes.statusCode}, Content-Type: ${pdfRes.headers['content-type']}, Size: ${pdfRes.buffer.length} bytes`);

  // 6. Live DOCX Generation via API
  console.log('\n--- 5. Testing Live Word (.DOCX) Generation Endpoint ---');
  const docxRes = await fetchUrl('https://www.avaniagrofoods.com/api/quotation?action=download-docx', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(quoteDocPayload)
    },
    body: quoteDocPayload
  });

  assert(docxRes.statusCode === 200 && docxRes.headers['content-type']?.includes('wordprocessingml'),
    'Live /api/quotation?action=download-docx returns Word document with HTTP 200',
    `Status: ${docxRes.statusCode}, Content-Type: ${docxRes.headers['content-type']}, Size: ${docxRes.buffer.length} bytes`);

  // Summary
  console.log('\n════════════════════════════════════════════════════════════════');
  console.log(`  LIVE TEST RESULTS: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log('════════════════════════════════════════════════════════════════\n');

  if (failed > 0) process.exit(1);
}

runLiveTests().catch(err => {
  console.error('Live Test Suite Fatal Error:', err);
  process.exit(1);
});
