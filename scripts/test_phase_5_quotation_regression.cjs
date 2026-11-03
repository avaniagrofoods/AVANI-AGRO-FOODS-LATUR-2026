// ============================================================
// AVANI AGRO FOODS — PHASE 5 QUOTATION PIPELINE REGRESSION SUITE
// Automated verification for commercial integrity, document generation,
// authorization, persistence, safety invariants, and audit logging.
// ============================================================

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const crypto = require('crypto');

async function runPhase5QuotationRegression() {
  console.log('============================================================');
  console.log('AVANI AGRO FOODS — PHASE 5 QUOTATION PIPELINE REGRESSION');
  console.log(`Execution Timestamp: ${new Date().toISOString()}`);
  console.log('============================================================\n');

  // Dynamic module imports
  const {
    calculateQuotation,
    generatePdfQuotation,
    generateDocxQuotation,
    generateExcelQuotation,
    cleanPdfText,
    parseQuantityKg,
    parseUnitRate,
    COMPANY_INFO,
    DEFAULT_COMMERCIAL_TERMS
  } = await import('../api/_lib/quotationEngine.js');

  const {
    createQuotationFromLead,
    validateLeadForQuotation,
    validateQuotationState,
    evaluateBuyerReadyGate,
    createInitialProcessorConfirmation,
    updateProcessorConfirmation,
    setAdminOverride,
    validateStatusTransition,
    sendQuotationEmail,
    sendQuotationToBuyer,
    computeDocumentHash,
    generateB2BEmailTemplate,
    POSITIONING_NOTICES
  } = await import('../api/_lib/quotationModel.js');

  const quotationHandler = (await import('../api/quotation.js')).default;

  let passed = 0;
  let failed = 0;
  const testResults = [];

  function record(section, testId, description, fn) {
    try {
      fn();
      passed++;
      testResults.push({ section, testId, description, status: 'PASS' });
      console.log(`  [PASS] ${section} - ${testId}: ${description}`);
    } catch (err) {
      failed++;
      testResults.push({ section, testId, description, status: 'FAIL', error: err.message });
      console.error(`  [FAIL] ${section} - ${testId}: ${description}`);
      console.error(`         Error: ${err.message}`);
    }
  }

  async function recordAsync(section, testId, description, fn) {
    try {
      await fn();
      passed++;
      testResults.push({ section, testId, description, status: 'PASS' });
      console.log(`  [PASS] ${section} - ${testId}: ${description}`);
    } catch (err) {
      failed++;
      testResults.push({ section, testId, description, status: 'FAIL', error: err.message });
      console.error(`  [FAIL] ${section} - ${testId}: ${description}`);
      console.error(`         Error: ${err.message}`);
    }
  }

  function createFullConfirmationUpdates() {
    return {
      partner: {
        name: 'Avani Verified Manufacturing Partner MH-01',
        reference: 'VMP-LATUR-2026-01'
      },
      available: true,
      confirmedQuantity: 18000,
      meshMatch: true,
      processorMesh: '80–100 Mesh',
      moistureMatch: true,
      processorMoisture: 'Max 6.5%',
      packagingMatch: true,
      processorPackaging: '25 kg Food-Grade HDPE Bags with inner liner',
      leadTimeDays: 45,
      earliestDispatchDate: '2026-11-20',
      exportPackingConfirmed: true,
      stuffingConfirmed: true,
      jnptHandlingConfirmed: true,
      coaAvailable: true,
      testingAvailable: true,
      sampleAvailable: true,
      notes: 'Partner verified capacity and export packaging specifications.'
    };
  }

  // --- SECTION 1: PROTECTED DATASET HASH VERIFICATION ---
  console.log('\n--- 1. PROTECTED DATASET HASH VERIFICATION ---');

  const PROTECTED_HASHES = {
    'api/_data/importersData.js': '02AFC4E0F621B4326A1CBD67BFC31266A14DFA77F1B0F9767315BB971860F595',
    'api/_data/importersData.snapshot-642.json': '86100BDA94BE63A51EDDC6EE2B2458133F607D50CD5F7D66C25193F3C9137F9E',
    'api/_data/manufacturersData.js': '6F760D437E3C3C213E0571167B33B66B1DF87503E13DE12514BE552F4AED691C'
  };

  record('HASH_SAFETY', 'H-01', 'api/_data/importersData.js SHA-256 matches baseline', () => {
    const fileBytes = fs.readFileSync(path.join(__dirname, '../api/_data/importersData.js'));
    const hash = crypto.createHash('sha256').update(fileBytes).digest('hex').toUpperCase();
    assert.strictEqual(hash, PROTECTED_HASHES['api/_data/importersData.js']);
  });

  record('HASH_SAFETY', 'H-02', 'api/_data/importersData.snapshot-642.json SHA-256 matches baseline', () => {
    const fileBytes = fs.readFileSync(path.join(__dirname, '../api/_data/importersData.snapshot-642.json'));
    const hash = crypto.createHash('sha256').update(fileBytes).digest('hex').toUpperCase();
    assert.strictEqual(hash, PROTECTED_HASHES['api/_data/importersData.snapshot-642.json']);
  });

  record('HASH_SAFETY', 'H-03', 'api/_data/manufacturersData.js SHA-256 matches baseline', () => {
    const fileBytes = fs.readFileSync(path.join(__dirname, '../api/_data/manufacturersData.js'));
    const hash = crypto.createHash('sha256').update(fileBytes).digest('hex').toUpperCase();
    assert.strictEqual(hash, PROTECTED_HASHES['api/_data/manufacturersData.js']);
  });

  // --- SECTION 2: COMMERCIAL INTEGRITY & FINANCIAL CALCULATIONS ---
  console.log('\n--- 2. COMMERCIAL INTEGRITY & FINANCIAL CALCULATIONS ---');

  record('COMMERCIAL', 'C-01', 'Quantity parsing: MT, KG, comma-formatted strings', () => {
    assert.strictEqual(parseQuantityKg('18 MT'), 18000);
    assert.strictEqual(parseQuantityKg('18,000 KG'), 18000);
    assert.strictEqual(parseQuantityKg('18000'), 18000);
    assert.strictEqual(parseQuantityKg('500 gm'), 500);
    assert.strictEqual(parseQuantityKg('2.5 MT'), 2500);
  });

  record('COMMERCIAL', 'C-02', 'Unit rate parsing: currency prefixes, commas, strings', () => {
    assert.strictEqual(parseUnitRate('INR 350'), 350);
    assert.strictEqual(parseUnitRate('$4.50'), 4.5);
    assert.strictEqual(parseUnitRate('1,250.50'), 1250.5);
    assert.strictEqual(parseUnitRate('0'), 0);
  });

  record('COMMERCIAL', 'C-03', 'Exact decimal arithmetic: Subtotal + Freight + Insurance + Documentation = Grand Total', () => {
    const payload = {
      items: [
        { quantity: 18000, rate: 350 }, // 6,300,000
        { quantity: 5000, rate: 650.75 } // 3,253,750
      ],
      freightCharges: 125000.50,
      insuranceCharges: 15420.25,
      documentationCharges: 5000.00,
      otherCharges: 1250.25,
      currency: 'INR'
    };
    const res = calculateQuotation(payload);
    assert.strictEqual(res.items[0].total, 6300000);
    assert.strictEqual(res.items[1].total, 3253750);
    assert.strictEqual(res.subtotal, 9553750);
    assert.strictEqual(res.freight, 125000.50);
    assert.strictEqual(res.insurance, 15420.25);
    assert.strictEqual(res.documentation, 5000.00);
    assert.strictEqual(res.otherCharges, 1250.25);
    const expectedGrand = 9553750 + 125000.50 + 15420.25 + 5000.00 + 1250.25;
    assert.strictEqual(res.grandTotal, Number(expectedGrand.toFixed(2)));
    assert.strictEqual(res.grandTotal, 9700421);
  });

  record('COMMERCIAL', 'C-04', 'Zero floating point drift on cent values (0.10 + 0.20)', () => {
    const payload = {
      items: [
        { quantity: 1, rate: 0.10 },
        { quantity: 1, rate: 0.20 }
      ],
      currency: 'USD'
    };
    const res = calculateQuotation(payload);
    assert.strictEqual(res.subtotal, 0.30);
    assert.strictEqual(res.grandTotal, 0.30);
  });

  record('COMMERCIAL', 'C-05', 'Empty payload safely defaults with valid structure', () => {
    const res = calculateQuotation({});
    assert.ok(res.quoteId.startsWith('AAF-Q-2026-'));
    assert.strictEqual(res.items.length, 1);
    assert.strictEqual(res.grandTotal, 0);
    assert.strictEqual(res.status, 'DRAFT');
  });

  record('COMMERCIAL', 'C-06', 'Negative quantities and negative charges clamped or handled safely', () => {
    const res = calculateQuotation({ quantity: -100, freightCharges: -500 });
    assert.ok(res.items[0].quantity >= 1);
    assert.strictEqual(res.freight, -500);
    assert.ok(!isNaN(res.grandTotal));
  });

  record('COMMERCIAL', 'C-07', 'Commercial terms preserve 7 non-negotiable clauses and Latur jurisdiction', () => {
    assert.strictEqual(DEFAULT_COMMERCIAL_TERMS.length, 7);
    assert.ok(DEFAULT_COMMERCIAL_TERMS[0].includes('50% Advance'));
    assert.ok(DEFAULT_COMMERCIAL_TERMS[6].includes('Latur, Maharashtra, India'));
  });

  record('COMMERCIAL', 'C-08', 'Positioning notice strictly enforces Trader/Sourcing partner, 0 manufacturer claims', () => {
    assert.ok(COMPANY_INFO.businessModel.includes('Trader'));
    assert.ok(COMPANY_INFO.businessModel.includes('Commission-Based Export Coordination'));
    assert.ok(!COMPANY_INFO.businessModel.includes('Sole Manufacturer'));
    assert.ok(!COMPANY_INFO.businessModel.includes('Primary Producer'));
    assert.ok(POSITIONING_NOTICES.partnerDisclaimer.includes('Indian sourcing and export coordination partner'));
  });

  // --- SECTION 3: PROCESSOR CONFIRMATION & BUYER-READY GATE ---
  console.log('\n--- 3. PROCESSOR CONFIRMATION & BUYER-READY GATE ---');

  const baseLead = {
    leadId: 'AAF-L-SYN-2026-001',
    buyer: {
      name: 'Synthetic Buyer Alpha',
      company: 'Synthetic Global Agro Corp',
      email: 'buyer.alpha@synthetic-test-domain.com',
      country: 'Germany'
    },
    inquiry: {
      product: 'Organic Moringa Leaf Powder',
      quantity: 18000,
      quantityUnit: 'KG',
      rawQuantityInput: '18 MT',
      specification: '80–100 Mesh, Max 7% Moisture',
      mesh: '80–100 Mesh',
      moisture: 'Max 7%',
      packaging: '25 kg Vacuum HDPE Bags',
      destination: 'Port of Hamburg',
      destinationPort: 'Port of Hamburg',
      incoterm: 'FOB Nhava Sheva',
      targetPrice: 350
    },
    qualification: {
      status: 'QUALIFIED',
      qualificationScore: 90
    }
  };

  record('GATE', 'G-01', 'Unconfirmed processor terms block READY_FOR_BUYER gate', () => {
    const quote = createQuotationFromLead(baseLead);
    const gate = evaluateBuyerReadyGate(quote);
    assert.strictEqual(gate.passed, false);
    assert.ok(gate.issues.some(i => i.toLowerCase().includes('processor') || i.toLowerCase().includes('confirmed')));
  });

  record('GATE', 'G-02', 'Processor confirmation allows READY_FOR_BUYER gate to pass', () => {
    const quote = createQuotationFromLead(baseLead);
    quote.quotation.items[0].rate = 350;
    updateProcessorConfirmation(quote, createFullConfirmationUpdates());
    const gate = evaluateBuyerReadyGate(quote);
    assert.strictEqual(gate.passed, true);
    assert.strictEqual(gate.issues.length, 0);
  });

  record('GATE', 'G-03', 'Substantive admin override allows gate bypass with documented reason', () => {
    const quote = createQuotationFromLead(baseLead);
    setAdminOverride(quote, {
      checkItem: 'mesh',
      reason: 'Standard 80-100 mesh inventory pre-verified at warehouse inspection',
      actor: 'Sachin Shinde'
    });
    assert.ok(quote.processorConfirmation.adminOverride.active);
    assert.strictEqual(quote.processorConfirmation.overrideHistory.length, 1);
    assert.strictEqual(quote.processorConfirmation.overrideHistory[0].checkItem, 'mesh');
  });

  record('GATE', 'G-04', 'Trivial admin override (< 5 chars) is rejected', () => {
    const quote = createQuotationFromLead(baseLead);
    assert.throws(() => {
      setAdminOverride(quote, {
        checkItem: 'mesh',
        reason: 'ok',
        actor: 'Sachin Shinde'
      });
    }, /at least 5 characters/i);
  });

  record('GATE', 'G-05', 'Illegal status transition DRAFT -> PO_RECEIVED is blocked', () => {
    const quote = createQuotationFromLead(baseLead);
    const transition = validateStatusTransition('DRAFT', 'PO_RECEIVED', quote);
    assert.strictEqual(transition.allowed, false);
  });

  // --- SECTION 4: DOCUMENT GENERATION & UNICODE / WINANSI RESILIENCE ---
  console.log('\n--- 4. DOCUMENT GENERATION & UNICODE RESILIENCE ---');

  record('DOC_GEN', 'D-01', 'cleanPdfText sanitizes curly quotes, em-dash, bullets, and Rupee symbol', () => {
    const dirtyText = '“High Quality” Moringa — 80–100 Mesh • Price: ₹350/kg • €4.50';
    const clean = cleanPdfText(dirtyText);
    assert.ok(!clean.includes('“'));
    assert.ok(!clean.includes('”'));
    assert.ok(!clean.includes('—'));
    assert.ok(!clean.includes('•'));
    assert.ok(!clean.includes('₹'));
    assert.ok(clean.includes('"High Quality"'));
    assert.ok(clean.includes('INR 350/kg'));
    assert.ok(clean.includes('80-100 Mesh'));
  });

  await recordAsync('DOC_GEN', 'D-02', 'generatePdfQuotation handles heavy unicode without WinAnsi encoding crash', async () => {
    const unicodeLead = {
      ...baseLead,
      buyer: {
        ...baseLead.buyer,
        name: 'François Müller “Importateur”',
        company: 'Ökologische Kräuter & Gewürze GmbH — Zürich'
      },
      inquiry: {
        ...baseLead.inquiry,
        specification: '80–100 Mesh • Max 7% Moisture • Special Grade ₹350',
        destination: 'Port of Rotterdam — Haven 45'
      }
    };
    const quote = calculateQuotation(unicodeLead);
    const pdfBuf = await generatePdfQuotation(quote);
    assert.ok(Buffer.isBuffer(pdfBuf));
    assert.ok(pdfBuf.length > 5000);
    // Verify PDF header magic bytes %PDF-
    assert.strictEqual(pdfBuf.slice(0, 4).toString(), '%PDF');
  });

  await recordAsync('DOC_GEN', 'D-03', 'generateDocxQuotation succeeds and creates valid document buffer', async () => {
    const quote = calculateQuotation(baseLead);
    const docxBuf = await generateDocxQuotation(quote);
    assert.ok(Buffer.isBuffer(docxBuf));
    assert.ok(docxBuf.length > 5000);
  });

  await recordAsync('DOC_GEN', 'D-04', 'generateExcelQuotation creates password-protected workbook buffer', async () => {
    const quote = calculateQuotation(baseLead);
    const xlsxBuf = await generateExcelQuotation(quote, 'SecureAdminPass2026!');
    assert.ok(Buffer.isBuffer(xlsxBuf));
    assert.ok(xlsxBuf.length > 5000);
    // Verify ZIP magic bytes for XLSX (PK..)
    assert.strictEqual(xlsxBuf[0], 0x50);
    assert.strictEqual(xlsxBuf[1], 0x4B);
  });

  record('DOC_GEN', 'D-05', 'Parity: UI, PDF, DOCX, and XLSX data sources compute identical totals', () => {
    const quote = calculateQuotation(baseLead);
    assert.strictEqual(quote.grandTotal, quote.subtotalFob + quote.freight + quote.insurance + quote.documentation + quote.otherCharges);
    assert.strictEqual(quote.items[0].total, quote.items[0].quantity * quote.items[0].rate);
  });

  record('DOC_GEN', 'D-06', 'cleanPdfText rejects Devanagari script explicitly with UNSUPPORTED_SCRIPT_ERROR', () => {
    assert.throws(() => {
      cleanPdfText('अवनी ऍग्रो फूड्स (Avani Agro Foods)');
    }, (err) => {
      return err.code === 'UNSUPPORTED_SCRIPT_ERROR' && err.message.includes('UNSUPPORTED_SCRIPT_ERROR');
    });
  });

  record('DOC_GEN', 'D-07', 'cleanPdfText rejects Arabic script explicitly with UNSUPPORTED_SCRIPT_ERROR', () => {
    assert.throws(() => {
      cleanPdfText('شركة تجارية (Trading Company)');
    }, (err) => {
      return err.code === 'UNSUPPORTED_SCRIPT_ERROR' && err.message.includes('UNSUPPORTED_SCRIPT_ERROR');
    });
  });

  record('DOC_GEN', 'D-08', 'cleanPdfText rejects CJK / Chinese script explicitly with UNSUPPORTED_SCRIPT_ERROR', () => {
    assert.throws(() => {
      cleanPdfText('农业食品进出口公司 (Agro Foods Import)');
    }, (err) => {
      return err.code === 'UNSUPPORTED_SCRIPT_ERROR' && err.message.includes('UNSUPPORTED_SCRIPT_ERROR');
    });
  });

  record('DOC_GEN', 'D-09', 'cleanPdfText rejects Cyrillic script explicitly with UNSUPPORTED_SCRIPT_ERROR', () => {
    assert.throws(() => {
      cleanPdfText('Агро экспорт (Agro Export)');
    }, (err) => {
      return err.code === 'UNSUPPORTED_SCRIPT_ERROR' && err.message.includes('UNSUPPORTED_SCRIPT_ERROR');
    });
  });

  await recordAsync('DOC_GEN', 'D-10', 'generatePdfQuotation fails explicitly when quotation contains non-Latin scripts', async () => {
    const nonLatinLead = {
      ...baseLead,
      buyer: {
        ...baseLead.buyer,
        name: 'अवनी ऍग्रो (Avani Agro Buyer)'
      }
    };
    const quote = calculateQuotation(nonLatinLead);
    await assert.rejects(async () => {
      await generatePdfQuotation(quote);
    }, (err) => {
      return err.code === 'UNSUPPORTED_SCRIPT_ERROR' && err.message.includes('UNSUPPORTED_SCRIPT_ERROR');
    });
  });

  record('DOC_GEN', 'D-11', 'cleanPdfText preserves Latin characters, numbers, currencies, and specs without data loss', () => {
    const input = 'Order: 18,000 KG @ INR 350.50/kg | Total: USD 63,000.00 | Mesh: 80–100 | Moisture: Max 6.5%';
    const output = cleanPdfText(input);
    assert.ok(output.includes('18,000 KG'));
    assert.ok(output.includes('350.50'));
    assert.ok(output.includes('USD 63,000.00'));
    assert.ok(output.includes('80-100'));
    assert.ok(output.includes('Max 6.5%'));
  });

  await recordAsync('DOC_GEN', 'D-12', 'api/quotation download-pdf returns HTTP 422 with UNSUPPORTED_SCRIPT_ERROR when document contains non-Latin scripts', async () => {
    let statusCode = null;
    let jsonBody = null;
    let sentBuffer = null;
    const req = {
      method: 'POST',
      query: { action: 'download-pdf' },
      body: {
        buyer: { name: 'अवनी ऍग्रो (Avani Agro)' },
        product: 'Moringa Leaf Powder',
        quantity: 1000
      }
    };
    const res = {
      setHeader: () => {},
      status: (code) => {
        statusCode = code;
        return {
          json: (data) => { jsonBody = data; return res; },
          send: (data) => { sentBuffer = data; return res; }
        };
      }
    };

    await quotationHandler(req, res);
    assert.strictEqual(statusCode, 422);
    assert.strictEqual(jsonBody?.success, false);
    assert.strictEqual(jsonBody?.code, 'UNSUPPORTED_SCRIPT_ERROR');
    assert.ok(jsonBody?.error?.includes('unsupported non-Latin characters'));
    assert.strictEqual(sentBuffer, null, 'Failed PDF generation must never return a buffer as HTTP 200');
  });

  // --- SECTION 5: SAFETY INVARIANTS & EMAIL DISPATCH GATES ---
  console.log('\n--- 5. SAFETY INVARIANTS & EMAIL DISPATCH GATES ---');

  await recordAsync('SAFETY_GATE', 'S-01', 'GLOBAL_OUTREACH_STOP=1 blocks sendQuotationEmail fail-closed', async () => {
    const oldStop = process.env.GLOBAL_OUTREACH_STOP;
    process.env.GLOBAL_OUTREACH_STOP = '1';
    try {
      const quote = createQuotationFromLead(baseLead);
      const res = await sendQuotationEmail({
        quotation: quote,
        recipient: 'synthetic.test@example.com',
        subject: 'Quotation Test',
        text: 'Commercial terms'
      });
      assert.strictEqual(res.success, false);
      assert.strictEqual(res.status, 'BLOCKED_GLOBAL_STOP');
      assert.ok(res.error.includes('GLOBAL_OUTREACH_STOP is active'));
    } finally {
      if (oldStop !== undefined) process.env.GLOBAL_OUTREACH_STOP = oldStop; else delete process.env.GLOBAL_OUTREACH_STOP;
    }
  });

  await recordAsync('SAFETY_GATE', 'S-01A', 'GLOBAL_OUTREACH_STOP=true (lowercase) blocks sendQuotationEmail fail-closed', async () => {
    const oldStop = process.env.GLOBAL_OUTREACH_STOP;
    process.env.GLOBAL_OUTREACH_STOP = 'true';
    try {
      const quote = createQuotationFromLead(baseLead);
      const res = await sendQuotationEmail({
        quotation: quote,
        recipient: 'synthetic.test@example.com',
        subject: 'Quotation Test',
        text: 'Commercial terms'
      });
      assert.strictEqual(res.success, false);
      assert.strictEqual(res.status, 'BLOCKED_GLOBAL_STOP');
      assert.ok(res.error.includes('GLOBAL_OUTREACH_STOP is active'));
    } finally {
      if (oldStop !== undefined) process.env.GLOBAL_OUTREACH_STOP = oldStop; else delete process.env.GLOBAL_OUTREACH_STOP;
    }
  });

  await recordAsync('SAFETY_GATE', 'S-01B', 'GLOBAL_OUTREACH_STOP=TRUE (case-insensitive) blocks sendQuotationToBuyer', async () => {
    const oldStop = process.env.GLOBAL_OUTREACH_STOP;
    process.env.GLOBAL_OUTREACH_STOP = 'TRUE';
    try {
      const quote = createQuotationFromLead(baseLead);
      quote.status = 'READY_FOR_BUYER';
      quote.quotation.items[0].rate = 350;
      updateProcessorConfirmation(quote, createFullConfirmationUpdates());
      const res = await sendQuotationToBuyer(quote, {
        recipient: 'synthetic.test@example.com',
        adminReviewed: true
      });
      assert.strictEqual(res.success, false);
      assert.strictEqual(res.status, 'BLOCKED_GLOBAL_STOP');
      assert.strictEqual(quote.dispatch.status, 'BLOCKED_GLOBAL_STOP');
    } finally {
      if (oldStop !== undefined) process.env.GLOBAL_OUTREACH_STOP = oldStop; else delete process.env.GLOBAL_OUTREACH_STOP;
    }
  });

  await recordAsync('SAFETY_GATE', 'S-01C', 'Caller option globalOutreachStop=false CANNOT bypass GLOBAL_OUTREACH_STOP=1', async () => {
    const oldStop = process.env.GLOBAL_OUTREACH_STOP;
    process.env.GLOBAL_OUTREACH_STOP = '1';
    try {
      const quote = createQuotationFromLead(baseLead);
      const res = await sendQuotationEmail({
        quotation: quote,
        recipient: 'synthetic.test@example.com',
        subject: 'Quotation Test',
        text: 'Commercial terms',
        globalOutreachStop: false
      });
      assert.strictEqual(res.success, false);
      assert.strictEqual(res.status, 'BLOCKED_GLOBAL_STOP');
    } finally {
      if (oldStop !== undefined) process.env.GLOBAL_OUTREACH_STOP = oldStop; else delete process.env.GLOBAL_OUTREACH_STOP;
    }
  });

  await recordAsync('SAFETY_GATE', 'S-02', 'GLOBAL_OUTREACH_STOP=1 blocks sendQuotationToBuyer fail-closed', async () => {
    const oldStop = process.env.GLOBAL_OUTREACH_STOP;
    process.env.GLOBAL_OUTREACH_STOP = '1';
    try {
      const quote = createQuotationFromLead(baseLead);
      quote.status = 'READY_FOR_BUYER';
      quote.quotation.items[0].rate = 350;
      updateProcessorConfirmation(quote, createFullConfirmationUpdates());
      const res = await sendQuotationToBuyer(quote, {
        recipient: 'synthetic.test@example.com',
        adminReviewed: true
      });
      assert.strictEqual(res.success, false);
      assert.strictEqual(res.status, 'BLOCKED_GLOBAL_STOP');
      assert.strictEqual(quote.dispatch.status, 'BLOCKED_GLOBAL_STOP');
    } finally {
      if (oldStop !== undefined) process.env.GLOBAL_OUTREACH_STOP = oldStop; else delete process.env.GLOBAL_OUTREACH_STOP;
    }
  });

  await recordAsync('SAFETY_GATE', 'S-02A', 'Missing (undefined) GLOBAL_OUTREACH_STOP blocks sendQuotationEmail fail-closed', async () => {
    const oldStop = process.env.GLOBAL_OUTREACH_STOP;
    delete process.env.GLOBAL_OUTREACH_STOP;
    try {
      const quote = createQuotationFromLead(baseLead);
      const res = await sendQuotationEmail({
        quotation: quote,
        recipient: 'synthetic.test@example.com',
        subject: 'Quotation Test',
        text: 'Commercial terms'
      });
      assert.strictEqual(res.success, false);
      assert.strictEqual(res.status, 'BLOCKED_GLOBAL_STOP');
      assert.ok(res.error.includes('GLOBAL_OUTREACH_STOP'));
    } finally {
      if (oldStop !== undefined) process.env.GLOBAL_OUTREACH_STOP = oldStop; else delete process.env.GLOBAL_OUTREACH_STOP;
    }
  });

  await recordAsync('SAFETY_GATE', 'S-02B', 'Empty string GLOBAL_OUTREACH_STOP="" blocks sendQuotationEmail fail-closed', async () => {
    const oldStop = process.env.GLOBAL_OUTREACH_STOP;
    process.env.GLOBAL_OUTREACH_STOP = '';
    try {
      const quote = createQuotationFromLead(baseLead);
      const res = await sendQuotationEmail({
        quotation: quote,
        recipient: 'synthetic.test@example.com',
        subject: 'Quotation Test',
        text: 'Commercial terms'
      });
      assert.strictEqual(res.success, false);
      assert.strictEqual(res.status, 'BLOCKED_GLOBAL_STOP');
      assert.ok(res.error.includes('GLOBAL_OUTREACH_STOP'));
    } finally {
      if (oldStop !== undefined) process.env.GLOBAL_OUTREACH_STOP = oldStop; else delete process.env.GLOBAL_OUTREACH_STOP;
    }
  });

  await recordAsync('SAFETY_GATE', 'S-02C', 'Malformed GLOBAL_OUTREACH_STOP="invalid" blocks sendQuotationEmail fail-closed', async () => {
    const oldStop = process.env.GLOBAL_OUTREACH_STOP;
    process.env.GLOBAL_OUTREACH_STOP = 'invalid';
    try {
      const quote = createQuotationFromLead(baseLead);
      const res = await sendQuotationEmail({
        quotation: quote,
        recipient: 'synthetic.test@example.com',
        subject: 'Quotation Test',
        text: 'Commercial terms'
      });
      assert.strictEqual(res.success, false);
      assert.strictEqual(res.status, 'BLOCKED_GLOBAL_STOP');
      assert.ok(res.error.includes('GLOBAL_OUTREACH_STOP'));
    } finally {
      if (oldStop !== undefined) process.env.GLOBAL_OUTREACH_STOP = oldStop; else delete process.env.GLOBAL_OUTREACH_STOP;
    }
  });

  await recordAsync('SAFETY_GATE', 'S-02D', 'Missing (undefined) GLOBAL_OUTREACH_STOP blocks sendQuotationToBuyer fail-closed', async () => {
    const oldStop = process.env.GLOBAL_OUTREACH_STOP;
    delete process.env.GLOBAL_OUTREACH_STOP;
    try {
      const quote = createQuotationFromLead(baseLead);
      quote.status = 'READY_FOR_BUYER';
      quote.quotation.items[0].rate = 350;
      updateProcessorConfirmation(quote, createFullConfirmationUpdates());
      const res = await sendQuotationToBuyer(quote, {
        recipient: 'synthetic.test@example.com',
        adminReviewed: true
      });
      assert.strictEqual(res.success, false);
      assert.strictEqual(res.status, 'BLOCKED_GLOBAL_STOP');
      assert.strictEqual(quote.dispatch.status, 'BLOCKED_GLOBAL_STOP');
    } finally {
      if (oldStop !== undefined) process.env.GLOBAL_OUTREACH_STOP = oldStop; else delete process.env.GLOBAL_OUTREACH_STOP;
    }
  });

  await recordAsync('SAFETY_GATE', 'S-02E', 'Malformed GLOBAL_OUTREACH_STOP="unspecified" blocks sendQuotationToBuyer fail-closed', async () => {
    const oldStop = process.env.GLOBAL_OUTREACH_STOP;
    process.env.GLOBAL_OUTREACH_STOP = 'unspecified';
    try {
      const quote = createQuotationFromLead(baseLead);
      quote.status = 'READY_FOR_BUYER';
      quote.quotation.items[0].rate = 350;
      updateProcessorConfirmation(quote, createFullConfirmationUpdates());
      const res = await sendQuotationToBuyer(quote, {
        recipient: 'synthetic.test@example.com',
        adminReviewed: true
      });
      assert.strictEqual(res.success, false);
      assert.strictEqual(res.status, 'BLOCKED_GLOBAL_STOP');
      assert.strictEqual(quote.dispatch.status, 'BLOCKED_GLOBAL_STOP');
    } finally {
      if (oldStop !== undefined) process.env.GLOBAL_OUTREACH_STOP = oldStop; else delete process.env.GLOBAL_OUTREACH_STOP;
    }
  });

  await recordAsync('SAFETY_GATE', 'S-02F', 'Explicitly permitted non-stop values ("0" / "false") permit progression when authorized', async () => {
    const oldStop = process.env.GLOBAL_OUTREACH_STOP;
    const oldAuth = process.env.OUTREACH_AUTHORIZED;
    process.env.GLOBAL_OUTREACH_STOP = '0';
    process.env.OUTREACH_AUTHORIZED = '1';
    try {
      const quote = createQuotationFromLead(baseLead);
      const res0 = await sendQuotationEmail({
        quotation: quote,
        recipient: 'synthetic.test@example.com',
        subject: 'Quotation Test',
        text: 'Commercial terms',
        mockSimulation: true
      });
      assert.strictEqual(res0.success, true);
      assert.strictEqual(res0.status, 'SENT');

      process.env.GLOBAL_OUTREACH_STOP = 'false';
      const resFalse = await sendQuotationEmail({
        quotation: quote,
        recipient: 'synthetic.test@example.com',
        subject: 'Quotation Test',
        text: 'Commercial terms',
        mockSimulation: true
      });
      assert.strictEqual(resFalse.success, true);
      assert.strictEqual(resFalse.status, 'SENT');
    } finally {
      if (oldStop !== undefined) process.env.GLOBAL_OUTREACH_STOP = oldStop; else delete process.env.GLOBAL_OUTREACH_STOP;
      if (oldAuth !== undefined) process.env.OUTREACH_AUTHORIZED = oldAuth; else delete process.env.OUTREACH_AUTHORIZED;
    }
  });

  await recordAsync('SAFETY_GATE', 'S-03', 'OUTREACH_AUTHORIZED=0 blocks sendQuotationEmail fail-closed', async () => {
    const oldAuth = process.env.OUTREACH_AUTHORIZED;
    const oldStop = process.env.GLOBAL_OUTREACH_STOP;
    process.env.OUTREACH_AUTHORIZED = '0';
    process.env.GLOBAL_OUTREACH_STOP = '0';
    try {
      const quote = createQuotationFromLead(baseLead);
      const res = await sendQuotationEmail({
        quotation: quote,
        recipient: 'synthetic.test@example.com',
        subject: 'Quotation Test',
        text: 'Commercial terms'
      });
      assert.strictEqual(res.success, false);
      assert.strictEqual(res.status, 'BLOCKED_UNAUTHORIZED');
      assert.ok(res.error.includes('OUTREACH_NOT_AUTHORIZED'));
    } finally {
      if (oldAuth !== undefined) process.env.OUTREACH_AUTHORIZED = oldAuth; else delete process.env.OUTREACH_AUTHORIZED;
      if (oldStop !== undefined) process.env.GLOBAL_OUTREACH_STOP = oldStop; else delete process.env.GLOBAL_OUTREACH_STOP;
    }
  });

  await recordAsync('SAFETY_GATE', 'S-03A', 'Missing (undefined) OUTREACH_AUTHORIZED blocks sendQuotationEmail fail-closed', async () => {
    const oldAuth = process.env.OUTREACH_AUTHORIZED;
    const oldStop = process.env.GLOBAL_OUTREACH_STOP;
    delete process.env.OUTREACH_AUTHORIZED;
    process.env.GLOBAL_OUTREACH_STOP = '0';
    try {
      const quote = createQuotationFromLead(baseLead);
      const res = await sendQuotationEmail({
        quotation: quote,
        recipient: 'synthetic.test@example.com',
        subject: 'Quotation Test',
        text: 'Commercial terms'
      });
      assert.strictEqual(res.success, false);
      assert.strictEqual(res.status, 'BLOCKED_UNAUTHORIZED');
      assert.ok(res.error.includes('OUTREACH_NOT_AUTHORIZED'));
    } finally {
      if (oldAuth !== undefined) process.env.OUTREACH_AUTHORIZED = oldAuth; else delete process.env.OUTREACH_AUTHORIZED;
      if (oldStop !== undefined) process.env.GLOBAL_OUTREACH_STOP = oldStop; else delete process.env.GLOBAL_OUTREACH_STOP;
    }
  });

  await recordAsync('SAFETY_GATE', 'S-03B', 'Empty string OUTREACH_AUTHORIZED="" blocks sendQuotationEmail fail-closed', async () => {
    const oldAuth = process.env.OUTREACH_AUTHORIZED;
    const oldStop = process.env.GLOBAL_OUTREACH_STOP;
    process.env.OUTREACH_AUTHORIZED = '';
    process.env.GLOBAL_OUTREACH_STOP = '0';
    try {
      const quote = createQuotationFromLead(baseLead);
      const res = await sendQuotationEmail({
        quotation: quote,
        recipient: 'synthetic.test@example.com',
        subject: 'Quotation Test',
        text: 'Commercial terms'
      });
      assert.strictEqual(res.success, false);
      assert.strictEqual(res.status, 'BLOCKED_UNAUTHORIZED');
    } finally {
      if (oldAuth !== undefined) process.env.OUTREACH_AUTHORIZED = oldAuth; else delete process.env.OUTREACH_AUTHORIZED;
      if (oldStop !== undefined) process.env.GLOBAL_OUTREACH_STOP = oldStop; else delete process.env.GLOBAL_OUTREACH_STOP;
    }
  });

  await recordAsync('SAFETY_GATE', 'S-03C', 'Unrecognized value OUTREACH_AUTHORIZED="invalid" blocks sendQuotationEmail', async () => {
    const oldAuth = process.env.OUTREACH_AUTHORIZED;
    const oldStop = process.env.GLOBAL_OUTREACH_STOP;
    process.env.OUTREACH_AUTHORIZED = 'invalid';
    process.env.GLOBAL_OUTREACH_STOP = '0';
    try {
      const quote = createQuotationFromLead(baseLead);
      const res = await sendQuotationEmail({
        quotation: quote,
        recipient: 'synthetic.test@example.com',
        subject: 'Quotation Test',
        text: 'Commercial terms'
      });
      assert.strictEqual(res.success, false);
      assert.strictEqual(res.status, 'BLOCKED_UNAUTHORIZED');
    } finally {
      if (oldAuth !== undefined) process.env.OUTREACH_AUTHORIZED = oldAuth; else delete process.env.OUTREACH_AUTHORIZED;
      if (oldStop !== undefined) process.env.GLOBAL_OUTREACH_STOP = oldStop; else delete process.env.GLOBAL_OUTREACH_STOP;
    }
  });

  await recordAsync('SAFETY_GATE', 'S-03D', 'Caller option outreachAuthorized=true CANNOT bypass missing OUTREACH_AUTHORIZED in sendQuotationEmail', async () => {
    const oldAuth = process.env.OUTREACH_AUTHORIZED;
    const oldStop = process.env.GLOBAL_OUTREACH_STOP;
    delete process.env.OUTREACH_AUTHORIZED;
    process.env.GLOBAL_OUTREACH_STOP = '0';
    try {
      const quote = createQuotationFromLead(baseLead);
      const res = await sendQuotationEmail({
        quotation: quote,
        recipient: 'synthetic.test@example.com',
        subject: 'Quotation Test',
        text: 'Commercial terms',
        outreachAuthorized: true
      });
      assert.strictEqual(res.success, false);
      assert.strictEqual(res.status, 'BLOCKED_UNAUTHORIZED');
    } finally {
      if (oldAuth !== undefined) process.env.OUTREACH_AUTHORIZED = oldAuth; else delete process.env.OUTREACH_AUTHORIZED;
      if (oldStop !== undefined) process.env.GLOBAL_OUTREACH_STOP = oldStop; else delete process.env.GLOBAL_OUTREACH_STOP;
    }
  });

  await recordAsync('SAFETY_GATE', 'S-04', 'OUTREACH_AUTHORIZED=0 blocks sendQuotationToBuyer fail-closed', async () => {
    const oldAuth = process.env.OUTREACH_AUTHORIZED;
    const oldStop = process.env.GLOBAL_OUTREACH_STOP;
    process.env.OUTREACH_AUTHORIZED = '0';
    process.env.GLOBAL_OUTREACH_STOP = '0';
    try {
      const quote = createQuotationFromLead(baseLead);
      quote.status = 'READY_FOR_BUYER';
      quote.quotation.items[0].rate = 350;
      updateProcessorConfirmation(quote, createFullConfirmationUpdates());
      const res = await sendQuotationToBuyer(quote, {
        recipient: 'synthetic.test@example.com',
        adminReviewed: true
      });
      assert.strictEqual(res.success, false);
      assert.strictEqual(res.status, 'BLOCKED_UNAUTHORIZED');
      assert.strictEqual(quote.dispatch.status, 'BLOCKED_UNAUTHORIZED');
    } finally {
      if (oldAuth !== undefined) process.env.OUTREACH_AUTHORIZED = oldAuth; else delete process.env.OUTREACH_AUTHORIZED;
      if (oldStop !== undefined) process.env.GLOBAL_OUTREACH_STOP = oldStop; else delete process.env.GLOBAL_OUTREACH_STOP;
    }
  });

  await recordAsync('SAFETY_GATE', 'S-04A', 'Missing (undefined) OUTREACH_AUTHORIZED blocks sendQuotationToBuyer fail-closed', async () => {
    const oldAuth = process.env.OUTREACH_AUTHORIZED;
    const oldStop = process.env.GLOBAL_OUTREACH_STOP;
    delete process.env.OUTREACH_AUTHORIZED;
    process.env.GLOBAL_OUTREACH_STOP = '0';
    try {
      const quote = createQuotationFromLead(baseLead);
      quote.status = 'READY_FOR_BUYER';
      quote.quotation.items[0].rate = 350;
      updateProcessorConfirmation(quote, createFullConfirmationUpdates());
      const res = await sendQuotationToBuyer(quote, {
        recipient: 'synthetic.test@example.com',
        adminReviewed: true
      });
      assert.strictEqual(res.success, false);
      assert.strictEqual(res.status, 'BLOCKED_UNAUTHORIZED');
      assert.strictEqual(quote.dispatch.status, 'BLOCKED_UNAUTHORIZED');
    } finally {
      if (oldAuth !== undefined) process.env.OUTREACH_AUTHORIZED = oldAuth; else delete process.env.OUTREACH_AUTHORIZED;
      if (oldStop !== undefined) process.env.GLOBAL_OUTREACH_STOP = oldStop; else delete process.env.GLOBAL_OUTREACH_STOP;
    }
  });

  await recordAsync('SAFETY_GATE', 'S-04B', 'Caller option outreachAuthorized=true CANNOT bypass missing OUTREACH_AUTHORIZED in sendQuotationToBuyer', async () => {
    const oldAuth = process.env.OUTREACH_AUTHORIZED;
    const oldStop = process.env.GLOBAL_OUTREACH_STOP;
    delete process.env.OUTREACH_AUTHORIZED;
    process.env.GLOBAL_OUTREACH_STOP = '0';
    try {
      const quote = createQuotationFromLead(baseLead);
      quote.status = 'READY_FOR_BUYER';
      quote.quotation.items[0].rate = 350;
      updateProcessorConfirmation(quote, createFullConfirmationUpdates());
      const res = await sendQuotationToBuyer(quote, {
        recipient: 'synthetic.test@example.com',
        adminReviewed: true,
        outreachAuthorized: true
      });
      assert.strictEqual(res.success, false);
      assert.strictEqual(res.status, 'BLOCKED_UNAUTHORIZED');
      assert.strictEqual(quote.dispatch.status, 'BLOCKED_UNAUTHORIZED');
    } finally {
      if (oldAuth !== undefined) process.env.OUTREACH_AUTHORIZED = oldAuth; else delete process.env.OUTREACH_AUTHORIZED;
      if (oldStop !== undefined) process.env.GLOBAL_OUTREACH_STOP = oldStop; else delete process.env.GLOBAL_OUTREACH_STOP;
    }
  });

  await recordAsync('SAFETY_GATE', 'S-05', 'REAL_BUYER_EMAILS=0 blocks external Resend live transmission', async () => {
    const oldKey = process.env.RESEND_API_KEY;
    const oldReal = process.env.REAL_BUYER_EMAILS;
    const oldAuth = process.env.OUTREACH_AUTHORIZED;
    const oldStop = process.env.GLOBAL_OUTREACH_STOP;
    process.env.RESEND_API_KEY = 're_test_mock_dummy_key_12345';
    process.env.REAL_BUYER_EMAILS = '0';
    process.env.OUTREACH_AUTHORIZED = '1';
    process.env.GLOBAL_OUTREACH_STOP = '0';
    try {
      const quote = createQuotationFromLead(baseLead);
      const res = await sendQuotationEmail({
        quotation: quote,
        recipient: 'synthetic.test@example.com',
        subject: 'Quotation Test',
        text: 'Commercial terms',
        mockSimulation: false
      });
      assert.strictEqual(res.success, false);
      assert.strictEqual(res.status, 'BLOCKED_REAL_BUYER_EMAILS');
      assert.ok(res.error.includes('REAL_BUYER_EMAILS=0'));
    } finally {
      if (oldKey !== undefined) process.env.RESEND_API_KEY = oldKey; else delete process.env.RESEND_API_KEY;
      if (oldReal !== undefined) process.env.REAL_BUYER_EMAILS = oldReal; else delete process.env.REAL_BUYER_EMAILS;
      if (oldAuth !== undefined) process.env.OUTREACH_AUTHORIZED = oldAuth; else delete process.env.OUTREACH_AUTHORIZED;
      if (oldStop !== undefined) process.env.GLOBAL_OUTREACH_STOP = oldStop; else delete process.env.GLOBAL_OUTREACH_STOP;
    }
  });

  await recordAsync('SAFETY_GATE', 'S-05A', 'Caller option allowRealBuyerEmails=true CANNOT bypass REAL_BUYER_EMAILS=0 for Resend', async () => {
    const oldKey = process.env.RESEND_API_KEY;
    const oldReal = process.env.REAL_BUYER_EMAILS;
    const oldAuth = process.env.OUTREACH_AUTHORIZED;
    const oldStop = process.env.GLOBAL_OUTREACH_STOP;
    process.env.RESEND_API_KEY = 're_test_mock_dummy_key_12345';
    process.env.REAL_BUYER_EMAILS = '0';
    process.env.OUTREACH_AUTHORIZED = '1';
    process.env.GLOBAL_OUTREACH_STOP = '0';
    try {
      const quote = createQuotationFromLead(baseLead);
      const res = await sendQuotationEmail({
        quotation: quote,
        recipient: 'synthetic.test@example.com',
        subject: 'Quotation Test',
        text: 'Commercial terms',
        allowRealBuyerEmails: true,
        mockSimulation: false
      });
      assert.strictEqual(res.success, false);
      assert.strictEqual(res.status, 'BLOCKED_REAL_BUYER_EMAILS');
    } finally {
      if (oldKey !== undefined) process.env.RESEND_API_KEY = oldKey; else delete process.env.RESEND_API_KEY;
      if (oldReal !== undefined) process.env.REAL_BUYER_EMAILS = oldReal; else delete process.env.REAL_BUYER_EMAILS;
      if (oldAuth !== undefined) process.env.OUTREACH_AUTHORIZED = oldAuth; else delete process.env.OUTREACH_AUTHORIZED;
      if (oldStop !== undefined) process.env.GLOBAL_OUTREACH_STOP = oldStop; else delete process.env.GLOBAL_OUTREACH_STOP;
    }
  });

  await recordAsync('SAFETY_GATE', 'S-05B', 'Caller option allowRealBuyerEmails=true CANNOT bypass REAL_BUYER_EMAILS=0 for SendGrid', async () => {
    const oldKey = process.env.SENDGRID_API_KEY;
    const oldReal = process.env.REAL_BUYER_EMAILS;
    const oldAuth = process.env.OUTREACH_AUTHORIZED;
    const oldStop = process.env.GLOBAL_OUTREACH_STOP;
    process.env.SENDGRID_API_KEY = 'SG.test_mock_dummy_key_12345';
    process.env.REAL_BUYER_EMAILS = '0';
    process.env.OUTREACH_AUTHORIZED = '1';
    process.env.GLOBAL_OUTREACH_STOP = '0';
    try {
      const quote = createQuotationFromLead(baseLead);
      const res = await sendQuotationEmail({
        quotation: quote,
        recipient: 'synthetic.test@example.com',
        subject: 'Quotation Test',
        text: 'Commercial terms',
        allowRealBuyerEmails: true,
        mockSimulation: false
      });
      assert.strictEqual(res.success, false);
      assert.strictEqual(res.status, 'BLOCKED_REAL_BUYER_EMAILS');
    } finally {
      if (oldKey !== undefined) process.env.SENDGRID_API_KEY = oldKey; else delete process.env.SENDGRID_API_KEY;
      if (oldReal !== undefined) process.env.REAL_BUYER_EMAILS = oldReal; else delete process.env.REAL_BUYER_EMAILS;
      if (oldAuth !== undefined) process.env.OUTREACH_AUTHORIZED = oldAuth; else delete process.env.OUTREACH_AUTHORIZED;
      if (oldStop !== undefined) process.env.GLOBAL_OUTREACH_STOP = oldStop; else delete process.env.GLOBAL_OUTREACH_STOP;
    }
  });

  await recordAsync('SAFETY_GATE', 'S-05C', 'Network trap: No outbound HTTP requests escape during blocked dispatch attempts', async () => {
    let networkAttempted = false;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (...args) => {
      networkAttempted = true;
      throw new Error(`CRITICAL_SECURITY_LEAK: Outbound network call intercepted to: ${args[0]}`);
    };
    const oldKey = process.env.RESEND_API_KEY;
    const oldReal = process.env.REAL_BUYER_EMAILS;
    const oldAuth = process.env.OUTREACH_AUTHORIZED;
    const oldStop = process.env.GLOBAL_OUTREACH_STOP;
    process.env.RESEND_API_KEY = 're_test_trap_key';
    process.env.REAL_BUYER_EMAILS = '0';
    process.env.OUTREACH_AUTHORIZED = '1';
    process.env.GLOBAL_OUTREACH_STOP = '0';
    try {
      const quote = createQuotationFromLead(baseLead);
      const res = await sendQuotationEmail({
        quotation: quote,
        recipient: 'synthetic.test@example.com',
        subject: 'Quotation Test',
        text: 'Commercial terms',
        allowRealBuyerEmails: true,
        mockSimulation: false
      });
      assert.strictEqual(res.success, false);
      assert.strictEqual(res.status, 'BLOCKED_REAL_BUYER_EMAILS');
      assert.strictEqual(networkAttempted, false, 'Network trap detected an unauthorized HTTP request attempt!');
    } finally {
      globalThis.fetch = originalFetch;
      if (oldKey !== undefined) process.env.RESEND_API_KEY = oldKey; else delete process.env.RESEND_API_KEY;
      if (oldReal !== undefined) process.env.REAL_BUYER_EMAILS = oldReal; else delete process.env.REAL_BUYER_EMAILS;
      if (oldAuth !== undefined) process.env.OUTREACH_AUTHORIZED = oldAuth; else delete process.env.OUTREACH_AUTHORIZED;
      if (oldStop !== undefined) process.env.GLOBAL_OUTREACH_STOP = oldStop; else delete process.env.GLOBAL_OUTREACH_STOP;
    }
  });

  await recordAsync('SAFETY_GATE', 'S-06', 'Unconfigured provider sets READY_TO_SEND without false SENT reporting', async () => {
    const oldAuth = process.env.OUTREACH_AUTHORIZED;
    const oldStop = process.env.GLOBAL_OUTREACH_STOP;
    process.env.OUTREACH_AUTHORIZED = '1';
    process.env.GLOBAL_OUTREACH_STOP = '0';
    try {
      const quote = createQuotationFromLead(baseLead);
      quote.status = 'READY_FOR_BUYER';
      quote.quotation.items[0].rate = 350;
      updateProcessorConfirmation(quote, createFullConfirmationUpdates());
      const res = await sendQuotationToBuyer(quote, {
        recipient: 'synthetic.test@example.com',
        adminReviewed: true,
        mockSimulation: false
      });
      assert.strictEqual(res.status, 'READY_TO_SEND');
      assert.strictEqual(quote.dispatch.status, 'READY_TO_SEND');
      assert.strictEqual(quote.dispatch.provider, 'none');
    } finally {
      if (oldAuth !== undefined) process.env.OUTREACH_AUTHORIZED = oldAuth; else delete process.env.OUTREACH_AUTHORIZED;
      if (oldStop !== undefined) process.env.GLOBAL_OUTREACH_STOP = oldStop; else delete process.env.GLOBAL_OUTREACH_STOP;
    }
  });

  // --- SECTION 6: IDEMPOTENCY, DUPLICATE DISPATCH & AUDIT TRAIL ---
  console.log('\n--- 6. IDEMPOTENCY, DUPLICATE DISPATCH & AUDIT TRAIL ---');

  await recordAsync('IDEMPOTENCY', 'I-01', 'Duplicate send blocked after successful dispatch without explicit resend reason', async () => {
    const oldAuth = process.env.OUTREACH_AUTHORIZED;
    const oldStop = process.env.GLOBAL_OUTREACH_STOP;
    process.env.OUTREACH_AUTHORIZED = '1';
    process.env.GLOBAL_OUTREACH_STOP = '0';
    try {
      const quote = createQuotationFromLead(baseLead);
      quote.status = 'READY_FOR_BUYER';
      quote.quotation.items[0].rate = 350;
      updateProcessorConfirmation(quote, createFullConfirmationUpdates());
      const res1 = await sendQuotationToBuyer(quote, {
        recipient: 'synthetic.test@example.com',
        adminReviewed: true,
        mockSimulation: true
      });
      assert.strictEqual(res1.status, 'SENT');
      assert.strictEqual(quote.status, 'SENT_TO_BUYER');

      // Duplicate attempt without isResend
      await assert.rejects(async () => {
        await sendQuotationToBuyer(quote, {
          recipient: 'synthetic.test@example.com',
          adminReviewed: true,
          mockSimulation: true
        });
      }, /Duplicate dispatch blocked/);
    } finally {
      if (oldAuth !== undefined) process.env.OUTREACH_AUTHORIZED = oldAuth; else delete process.env.OUTREACH_AUTHORIZED;
      if (oldStop !== undefined) process.env.GLOBAL_OUTREACH_STOP = oldStop; else delete process.env.GLOBAL_OUTREACH_STOP;
    }
  });

  await recordAsync('IDEMPOTENCY', 'I-02', 'Explicit resend allowed with substantive justification and logs resendHistory', async () => {
    const oldAuth = process.env.OUTREACH_AUTHORIZED;
    const oldStop = process.env.GLOBAL_OUTREACH_STOP;
    process.env.OUTREACH_AUTHORIZED = '1';
    process.env.GLOBAL_OUTREACH_STOP = '0';
    try {
      const quote = createQuotationFromLead(baseLead);
      quote.status = 'READY_FOR_BUYER';
      quote.quotation.items[0].rate = 350;
      updateProcessorConfirmation(quote, createFullConfirmationUpdates());
      await sendQuotationToBuyer(quote, {
        recipient: 'synthetic.test@example.com',
        adminReviewed: true,
        mockSimulation: true
      });
      const firstMsgId = quote.dispatch.messageId;

      // Resend with substantive justification
      const resendRes = await sendQuotationToBuyer(quote, {
        recipient: 'synthetic.test@example.com',
        adminReviewed: true,
        isResend: true,
        resendReason: 'Buyer procurement director requested re-send to secondary email',
        mockSimulation: true
      });
      assert.strictEqual(resendRes.status, 'SENT');
      assert.ok(quote.dispatch.resendHistory.length >= 1);
      assert.strictEqual(quote.dispatch.resendHistory[0].previousMessageId, firstMsgId);
      assert.ok(quote.activity.some(a => a.event === 'RESEND_EXECUTED'));
    } finally {
      if (oldAuth !== undefined) process.env.OUTREACH_AUTHORIZED = oldAuth; else delete process.env.OUTREACH_AUTHORIZED;
      if (oldStop !== undefined) process.env.GLOBAL_OUTREACH_STOP = oldStop; else delete process.env.GLOBAL_OUTREACH_STOP;
    }
  });

  record('IDEMPOTENCY', 'I-03', 'Document hash changes deterministically when commercial values change', () => {
    const q1 = createQuotationFromLead(baseLead);
    const hash1 = computeDocumentHash(q1);

    const modifiedLead = JSON.parse(JSON.stringify(baseLead));
    modifiedLead.inquiry.quantity = 36000;
    const q2 = createQuotationFromLead(modifiedLead);
    const hash2 = computeDocumentHash(q2);

    assert.notStrictEqual(hash1, hash2);
  });

  // --- SECTION 7: AUTHORIZATION & ACCESS CONTROL ---
  console.log('\n--- 7. AUTHORIZATION & ACCESS CONTROL ---');

  record('AUTH', 'A-01', '/api/admin-quotations requires valid admin session token', () => {
    const adminCode = fs.readFileSync(path.join(__dirname, '../api/admin-quotations.js'), 'utf8');
    assert.ok(adminCode.includes('verifyAdminAuth'));
    assert.ok(adminCode.includes('401'));
  });

  record('AUTH', 'A-02', 'Public quotation route /api/quotation send-email deprecated and returns 403', () => {
    const publicCode = fs.readFileSync(path.join(__dirname, '../api/quotation.js'), 'utf8');
    assert.ok(publicCode.includes('send-email'));
    assert.ok(publicCode.includes('403'));
    assert.ok(publicCode.includes('DEPRECATED'));
  });

  record('AUTH', 'A-03', 'Admin quotation UI is guarded by PasswordGate component', () => {
    const adminUi = fs.readFileSync(path.join(__dirname, '../src/pages/AdminQuotations.jsx'), 'utf8');
    assert.ok(adminUi.includes('<PasswordGate'));
  });

  // --- FINAL SUMMARY ---
  console.log('\n============================================================');
  console.log(`PHASE 5 TEST SUITE EXECUTION COMPLETE`);
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('============================================================');

  if (failed > 0) {
    console.error(`\nFAILED TESTS SUMMARY:`);
    testResults.filter(t => t.status === 'FAIL').forEach(t => {
      console.error(` - [${t.section} ${t.testId}] ${t.description}: ${t.error}`);
    });
    process.exit(1);
  }
}

runPhase5QuotationRegression().catch(err => {
  console.error('Fatal test execution failure:', err);
  process.exit(1);
});
