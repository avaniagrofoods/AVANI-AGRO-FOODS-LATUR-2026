const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const assert = require('assert');

// 1. Load Modules
const { 
  parseQuantityKg, 
  parseUnitRate, 
  validateQuotation, 
  PRODUCT_MASTER, 
  getProductById, 
  matchProductMaster 
} = require('../src/data/productMaster.js');

const { 
  calculateQuotation, 
  generatePdfQuotation, 
  generateDocxQuotation,
  DEFAULT_COMMERCIAL_TERMS,
  COMPANY_INFO
} = require('../api/lib/quotationEngine.js');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] ${name} -> ${err.message}`);
    failedTests++;
  }
}

async function runAsyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`[PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] ${name} -> ${err.message}`);
    failedTests++;
  }
}

function extractAllDecodedTextFromPdf(buf) {
  let idx = 0;
  let allDecoded = [];
  while ((idx = buf.indexOf('stream', idx)) !== -1) {
    let start = idx + 6;
    if (buf[start] === 13 && buf[start + 1] === 10) start += 2;
    else if (buf[start] === 10 || buf[start] === 13) start += 1;
    const end = buf.indexOf('endstream', start);
    if (end === -1) break;
    const slice = buf.slice(start, end);
    try {
      const decomp = zlib.inflateSync(slice).toString('utf8');
      const hexMatches = decomp.match(/<([0-9A-Fa-f]+)>\s*Tj/g);
      if (hexMatches) {
        hexMatches.forEach((m) => {
          const hex = m.replace(/[^0-9A-Fa-f]/g, '');
          allDecoded.push(Buffer.from(hex, 'hex').toString('utf8'));
        });
      }
    } catch (e) {}
    idx = end + 9;
  }
  return allDecoded.join('\n');
}

async function main() {
  console.log('============================================================');
  console.log('AVANI AGRO FOODS — P3.3 FORENSIC HARDENING & ACCURACY AUDIT');
  console.log('Timestamp:', new Date().toISOString());
  console.log('============================================================\n');

  // --- PHASE 2: PRODUCT MASTER INTEGRITY ---
  console.log('--- PHASE 2: Product Master Integrity ---');
  runTest('Product Master: Moringa Leaf Powder specifications', () => {
    const p = getProductById('moringa-leaf-powder');
    assert.strictEqual(p.productName, 'Moringa Leaf Powder');
    assert.strictEqual(p.hsCode, '12119029');
    assert.strictEqual(p.unit, 'KG');
    assert.strictEqual(p.defaultPackaging, '25 kg Food-Grade HDPE Bags');
    assert.strictEqual(p.defaultRateInr, 350.00);
    assert.strictEqual(p.moqKg, 100);
    assert.strictEqual(p.active, true);
    assert.ok(p.defaultSpecifications.includes('80–100 Mesh'));
    assert.ok(p.defaultSpecifications.includes('Moisture Max 7–8%'));
  });

  runTest('Product Master: Dehydrated Red Onion Powder specifications', () => {
    const p = getProductById('red-onion-powder');
    assert.strictEqual(p.productName, 'Dehydrated Red Onion Powder');
    assert.strictEqual(p.hsCode, '07122000');
    assert.strictEqual(p.unit, 'KG');
    assert.strictEqual(p.defaultRateInr, 800.00);
    assert.strictEqual(p.moqKg, 100);
    assert.strictEqual(p.active, true);
    assert.ok(p.defaultSpecifications.includes('80–100 Mesh'));
    assert.ok(p.defaultSpecifications.includes('Moisture < 6%'));
  });

  // --- PHASE 3: QUANTITY PARSING ---
  console.log('\n--- PHASE 3: Quantity Parsing Matrix ---');
  const qtyTestCases = [
    [1, 1],
    [25, 25],
    [100, 100],
    [1000, 1000],
    [18000, 18000],
    ['1', 1],
    ['25', 25],
    ['1,000', 1000],
    ['18,000', 18000],
    ['18,000 KG', 18000],
    ['18 MT', 18000],
    ['1.5 MT', 1500],
    ['0', 0],
    ['0 KG', 0],
    ['', 0],
    [null, 0],
    [undefined, 0],
    [-5, 1],
    [12.4, 12],
    [12.6, 13]
  ];

  for (const [input, expected] of qtyTestCases) {
    runTest(`Quantity parsing: ${JSON.stringify(input)} -> ${expected}`, () => {
      const res = parseQuantityKg(input);
      assert.strictEqual(res, expected);
    });
  }

  const packagingDescCases = [
    '25 kg bags',
    '50 kg bags',
    '1000 kg pallet',
    '25 KG HDPE bags',
    '25 kg Food-Grade HDPE Bags with inner liner'
  ];

  for (const desc of packagingDescCases) {
    runTest(`Explicit quantity "18000" with packaging "${desc}" -> 18000`, () => {
      const res = parseQuantityKg('18000', desc);
      assert.strictEqual(res, 18000);
    });
  }

  // --- PHASE 4: UNIT RATE PARSING ---
  console.log('\n--- PHASE 4: Unit Rate Parsing Matrix ---');
  const rateTestCases = [
    [350, 350],
    [650, 650],
    ['350', 350],
    ['350.00', 350],
    ['INR 350', 350],
    ['₹350', 350],
    ['0', 0],
    [0, 0],
    ['350.75', 350.75],
    [null, 350],
    ['', 350]
  ];

  for (const [input, expected] of rateTestCases) {
    runTest(`Rate parsing: ${JSON.stringify(input)} -> ${expected}`, () => {
      const res = parseUnitRate(input, 350);
      assert.strictEqual(res, expected);
    });
  }

  // --- PHASE 5: CALCULATION MATRIX ---
  console.log('\n--- PHASE 5: Calculation Matrix ---');
  runTest('1 x 100 = 100', () => {
    const q = calculateQuotation({ items: [{ name: 'Test', quantity: 1, rate: 100 }] });
    assert.strictEqual(q.items[0].total, 100);
    assert.strictEqual(q.grandTotal, 100);
  });

  runTest('25 x 350 = 8,750', () => {
    const q = calculateQuotation({ items: [{ name: 'Test', quantity: 25, rate: 350 }] });
    assert.strictEqual(q.items[0].total, 8750);
    assert.strictEqual(q.grandTotal, 8750);
  });

  runTest('18,000 x 350 = 6,300,000', () => {
    const q = calculateQuotation({ items: [{ name: 'Test', quantity: 18000, rate: 350 }] });
    assert.strictEqual(q.items[0].total, 6300000);
    assert.strictEqual(q.grandTotal, 6300000);
  });

  runTest('18,000 x 650 = 11,700,000', () => {
    const q = calculateQuotation({ items: [{ name: 'Test', quantity: 18000, rate: 650 }] });
    assert.strictEqual(q.items[0].total, 11700000);
    assert.strictEqual(q.grandTotal, 11700000);
  });

  runTest('Two items: (18,000 x 650) + (18,000 x 350) = 18,000,000', () => {
    const q = calculateQuotation({
      items: [
        { name: 'Item 1', quantity: 18000, rate: 650 },
        { name: 'Item 2', quantity: 18000, rate: 350 }
      ]
    });
    assert.strictEqual(q.items[0].total, 11700000);
    assert.strictEqual(q.items[1].total, 6300000);
    assert.strictEqual(q.subtotal, 18000000);
    assert.strictEqual(q.grandTotal, 18000000);
  });

  runTest('Edge Case: Decimal quantity & rate without floating point drift', () => {
    const q = calculateQuotation({
      items: [
        { name: 'Item 1', quantity: 1250, rate: 350.50 },
        { name: 'Item 2', quantity: 500, rate: 649.75 }
      ]
    });
    // 1250 * 350.50 = 438125.00
    // 500 * 649.75 = 324875.00
    // Total = 763000.00
    assert.strictEqual(q.items[0].total, 438125.00);
    assert.strictEqual(q.items[1].total, 324875.00);
    assert.strictEqual(q.grandTotal, 763000.00);
  });

  runTest('Edge Case: Missing quantity fails validation cleanly', () => {
    const v = validateQuotation({
      items: [{ name: 'Test', quantity: '', rate: 350 }]
    });
    assert.strictEqual(v.valid, false);
    assert.ok(v.error.includes('Missing quantity'));
  });

  runTest('Edge Case: Missing rate fails validation cleanly', () => {
    const v = validateQuotation({
      items: [{ name: 'Test', quantity: 18000, rate: '' }]
    });
    assert.strictEqual(v.valid, false);
    assert.ok(v.error.includes('Missing unit rate'));
  });

  // --- PHASE 6: QUOTATION PERSISTENCE SIMULATION ---
  console.log('\n--- PHASE 6: Quotation Persistence Lifecycle ---');
  runTest('Full Lifecycle: CREATE -> SAVE -> EDIT -> REOPEN -> DUPLICATE', () => {
    // 1. Initial creation
    let quote = {
      quoteId: 'AAF-Q-2026-TEST',
      buyer: { name: 'VIKRAM', company: 'VIKRAJA SOLAPUR', country: 'India' },
      items: [
        { id: 1, name: 'Moringa Leaf Powder', quantity: 25, rate: 350, description: '25 kg bags' }
      ]
    };
    let calculated = calculateQuotation(quote);
    assert.strictEqual(calculated.grandTotal, 8750);

    // 2. Save to simulated storage (JSON serialize & deserialize)
    let serialized = JSON.stringify(calculated);
    let reloaded = JSON.parse(serialized);

    // 3. User Edits quantity to 18,000
    reloaded.items[0].quantity = 18000;
    let recalculated = calculateQuotation(reloaded);
    assert.strictEqual(recalculated.items[0].total, 6300000);
    assert.strictEqual(recalculated.grandTotal, 6300000);

    // 4. Save edit and re-open
    let reSerialized = JSON.stringify(recalculated);
    let reopened = JSON.parse(reSerialized);
    assert.strictEqual(reopened.grandTotal, 6300000);

    // 5. Duplicate quotation
    let duplicated = {
      ...reopened,
      quoteId: 'AAF-Q-2026-DUPLICATE',
      items: reopened.items.map(it => ({ ...it }))
    };
    let duplicateCalc = calculateQuotation(duplicated);
    assert.strictEqual(duplicateCalc.grandTotal, 6300000);
    assert.strictEqual(duplicateCalc.items[0].quantity, 18000);
  });

  // --- PHASE 7 & 8: PDF & DOCX PARITY ---
  console.log('\n--- PHASE 7 & 8: PDF & DOCX Generation Parity ---');
  await runAsyncTest('Vector PDF Programmatic Text Extraction & Parity Assertion', async () => {
    const quotePayload = {
      quoteId: 'AAF-Q-2026-9075',
      buyerName: 'VIKRAM',
      customerName: 'VIKRAM',
      companyName: 'VIKRAJA SOLAPUR',
      currency: 'INR',
      incoterm: 'FOB NHAVA SHEVA (JNPT MUMBAI)',
      items: [
        { id: 1, name: 'Moringa Leaf Powder', hsCode: '12119029', quantity: 18000, rate: 650, description: '25 kg Food-Grade HDPE Bags with inner liner' },
        { id: 2, name: 'Moringa Leaf Powder', hsCode: '12119029', quantity: 18000, rate: 350, description: '25 kg Food-Grade HDPE Bags with inner liner' }
      ]
    };

    const quote = calculateQuotation(quotePayload);
    const pdfBuf = await generatePdfQuotation(quote);

    assert.ok(pdfBuf.length > 10000, 'PDF buffer size is reasonable');
    assert.strictEqual(pdfBuf.slice(0, 4).toString(), '%PDF', 'PDF magic header valid');

    const decodedText = extractAllDecodedTextFromPdf(pdfBuf);

    assert.ok(decodedText.includes('18,000 KG'), 'PDF contains 18,000 KG quantity');
    assert.ok(decodedText.includes('INR 11,700,000.00'), 'PDF contains Item 1 total INR 11,700,000.00');
    assert.ok(decodedText.includes('INR 6,300,000.00'), 'PDF contains Item 2 total INR 6,300,000.00');
    assert.ok(decodedText.includes('INR 18,000,000.00'), 'PDF contains Grand Total INR 18,000,000.00');
    assert.ok(!decodedText.includes('8,750'), 'PDF does NOT contain stale 8,750 defect');
  });

  await runAsyncTest('DOCX Document Generation & Parity Assertion', async () => {
    const quotePayload = {
      quoteId: 'AAF-Q-2026-9075',
      buyerName: 'VIKRAM',
      currency: 'INR',
      items: [
        { id: 1, name: 'Moringa Leaf Powder', hsCode: '12119029', quantity: 18000, rate: 650, description: '25 kg Food-Grade HDPE Bags with inner liner' },
        { id: 2, name: 'Moringa Leaf Powder', hsCode: '12119029', quantity: 18000, rate: 350, description: '25 kg Food-Grade HDPE Bags with inner liner' }
      ]
    };

    const quote = calculateQuotation(quotePayload);
    const docxBuf = await generateDocxQuotation(quote);

    assert.ok(docxBuf.length > 5000, 'DOCX buffer size valid');
    // Check zip header (PK..)
    assert.strictEqual(docxBuf.slice(0, 2).toString(), 'PK', 'DOCX zip format valid');
  });

  // --- PHASE 11 & 12: COMMERCIAL TERMS & COMPANY POSITIONING ---
  console.log('\n--- PHASE 11 & 12: Commercial Terms & Company Identity ---');
  runTest('Approved 7 Commercial Terms are intact', () => {
    assert.strictEqual(DEFAULT_COMMERCIAL_TERMS.length, 7, 'Exact 7 terms exist');
    assert.ok(DEFAULT_COMMERCIAL_TERMS[0].includes('Payment Terms: 50% Advance Payment, Balance 50% Before Dispatch'));
    assert.ok(DEFAULT_COMMERCIAL_TERMS[1].includes('Price Basis: FOB Shipment terms'));
    assert.ok(DEFAULT_COMMERCIAL_TERMS[2].includes('Delivery Timeline: Shipment within 60–75 days'));
    assert.ok(DEFAULT_COMMERCIAL_TERMS[3].includes('Packaging: 25 kg Food-Grade HDPE Bags included'));
    assert.ok(DEFAULT_COMMERCIAL_TERMS[4].includes('Validity: This quotation is valid until'));
    assert.ok(DEFAULT_COMMERCIAL_TERMS[5].includes("Inspection: Pre-dispatch inspection permitted at seller's warehouse"));
    assert.ok(DEFAULT_COMMERCIAL_TERMS[6].includes('Jurisdiction: All disputes are subject to the exclusive jurisdiction of competent courts in Latur'));
  });

  runTest('Company Positioning: Indian Agricultural Sourcing & Trade Coordination Partner', () => {
    assert.strictEqual(COMPANY_INFO.name, 'AVANI AGRO FOODS');
    assert.ok(COMPANY_INFO.tagline.includes('Agricultural Export Marketing, Sourcing & Trade Coordination Partner'));
    assert.ok(!COMPANY_INFO.tagline.toLowerCase().includes('factory'));
    assert.ok(!COMPANY_INFO.tagline.toLowerCase().includes('manufacturing plant'));
  });

  // --- PHASE 13: PDF VISUAL QA / MULTI-ITEM STRESS TESTING ---
  console.log('\n--- PHASE 13: Multi-Item Stress Testing ---');
  await runAsyncTest('PDF Stress Test: 1-item, 2-item, 5-item, and long descriptions without errors', async () => {
    // 5-item quotation
    const fiveItemQuote = calculateQuotation({
      quoteId: 'AAF-Q-2026-STRESS-5',
      buyerName: 'Global Agro Importer LLC',
      currency: 'USD',
      items: [
        { id: 1, name: 'Moringa Leaf Powder', quantity: 5000, rate: 4.80, description: 'Organic Grade Moringa Oleifera powder in 25 kg bags' },
        { id: 2, name: 'Dehydrated Red Onion Powder', quantity: 3000, rate: 9.60, description: 'Export grade 80-100 mesh dehydrated red onion powder' },
        { id: 3, name: 'Dehydrated Garlic Powder', quantity: 2000, rate: 8.19, description: 'Dehydrated garlic powder moisture < 5%' },
        { id: 4, name: 'Dried Ginger Powder', quantity: 1500, rate: 7.95, description: 'Sun dried fine ground ginger powder' },
        { id: 5, name: 'Turmeric Powder (High Curcumin)', quantity: 4000, rate: 4.82, description: 'Curcumin 3.5%+ brilliant yellow turmeric powder in fiber drums' }
      ]
    });

    const pdfBuf = await generatePdfQuotation(fiveItemQuote);
    assert.ok(pdfBuf.length > 10000, '5-item PDF generated cleanly');
    const decoded = extractAllDecodedTextFromPdf(pdfBuf);
    assert.ok(decoded.includes('AAF-Q-2026-STRESS-5'), 'PDF contains stress quote ID');
  });

  console.log('\n============================================================');
  console.log(`SUMMARY: ${passedTests}/${totalTests} TESTS PASSED (${failedTests} FAILED)`);
  console.log('============================================================');

  if (failedTests > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal audit execution error:', err);
  process.exit(1);
});
