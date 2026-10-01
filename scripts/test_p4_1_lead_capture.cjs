const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { execSync } = require('child_process');

// 1. Load Modules
const {
  CANONICAL_LEAD_STATUS,
  CANONICAL_WORKFLOW_STATUS,
  generateLeadId,
  sanitizeString,
  validateLeadPayload,
  createLeadRecord,
  normalizeIncomingPayload
} = require('../src/data/leadModel.js');

const leadsModule = require('../api/leads.js');
const leadsApiHandler = leadsModule.default || leadsModule;

// P3 Baseline engines to verify zero regression
const { parseQuantityKg, matchProductMaster } = require('../src/data/productMaster.js');
const { calculateQuotation } = require('../api/lib/quotationEngine.js');

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

let ipCounter = 10;

// Mock HTTP helper for Serverless Handler
function mockReqRes({ method = 'POST', headers = {}, body = null, ip = null } = {}) {
  const clientIp = ip || `10.0.1.${ipCounter++}`;
  const req = {
    method,
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': clientIp,
      ...headers
    },
    body
  };

  let statusCode = 200;
  const resHeaders = {};
  let responseData = null;
  let ended = false;

  const res = {
    setHeader: (k, v) => { resHeaders[k.toLowerCase()] = v; },
    status: (code) => {
      statusCode = code;
      return res;
    },
    json: (data) => {
      responseData = data;
      ended = true;
      return res;
    },
    end: () => {
      ended = true;
      return res;
    }
  };

  return {
    req,
    res,
    getStatus: () => statusCode,
    getData: () => responseData,
    getHeaders: () => resHeaders
  };
}

async function main() {
  console.log('============================================================');
  console.log('AVANI AGRO FOODS — P4.1 LEAD CAPTURE & RFQ TEST MATRIX');
  console.log('============================================================');

  // Test 1: Valid Moringa RFQ
  await runAsyncTest('Test 1: Valid Moringa RFQ', async () => {
    const { req, res, getStatus, getData } = mockReqRes({
      method: 'POST',
      body: {
        fullName: 'John Smith',
        companyName: 'Smith Organics LLC',
        country: 'United States',
        email: 'john@smithorganics.com',
        phone: '+1 555-019-2831',
        product: 'Moringa Leaf Powder',
        quantity: 18000,
        quantityUnit: 'KG',
        destinationPort: 'Port of Long Beach (USLGB)',
        incoterm: 'FOB Nhava Sheva (JNPT Mumbai)',
        packaging: '25 KG Food-Grade HDPE Bags'
      }
    });
    await leadsApiHandler(req, res);
    assert.strictEqual(getStatus(), 201);
    const data = getData();
    assert.strictEqual(data.success, true);
    assert.match(data.leadId, /^AAF-L-\d{4}-\d{4}$/);
    assert.strictEqual(data.lead.inquiry.product, 'Moringa Leaf Powder');
    assert.strictEqual(data.lead.inquiry.quantity, 18000);
    assert.strictEqual(data.lead.inquiry.hsCode, '12119029');
    assert.strictEqual(data.lead.workflow.status, 'NEW');
  });

  // Test 2: Valid Red Onion RFQ
  await runAsyncTest('Test 2: Valid Red Onion RFQ', async () => {
    const { req, res, getStatus, getData } = mockReqRes({
      method: 'POST',
      body: {
        fullName: 'Fiona Gallagher',
        companyName: 'EuroSpices BV',
        country: 'Netherlands',
        email: 'fiona@eurospices.nl',
        phone: '+31 20 794 0000',
        product: 'Dehydrated Red Onion Powder',
        quantity: '18 MT',
        destinationPort: 'Port of Rotterdam',
        incoterm: 'CIF Rotterdam'
      }
    });
    await leadsApiHandler(req, res);
    assert.strictEqual(getStatus(), 201);
    const data = getData();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.lead.inquiry.quantity, 18000);
    assert.strictEqual(data.lead.inquiry.hsCode, '07122000');
    assert.strictEqual(data.lead.buyer.country, 'Netherlands');
  });

  // Test 3: Missing buyer name
  await runAsyncTest('Test 3: Missing buyer name', async () => {
    const { req, res, getStatus, getData } = mockReqRes({
      method: 'POST',
      body: {
        fullName: '',
        companyName: 'Global Foods Corp',
        country: 'Germany',
        email: 'info@globalfoods.de',
        product: 'Moringa Leaf Powder',
        quantity: 5000,
        destinationPort: 'Hamburg'
      }
    });
    await leadsApiHandler(req, res);
    assert.strictEqual(getStatus(), 400);
    const data = getData();
    assert.strictEqual(data.success, false);
    assert.ok(data.errors.some(e => e.includes('Name is required')));
  });

  // Test 4: Missing company
  await runAsyncTest('Test 4: Missing company', async () => {
    const { req, res, getStatus, getData } = mockReqRes({
      method: 'POST',
      body: {
        fullName: 'Hans Gruber',
        companyName: '',
        country: 'Germany',
        email: 'hans@gruber.de',
        product: 'Moringa Leaf Powder',
        quantity: 5000,
        destinationPort: 'Hamburg'
      }
    });
    await leadsApiHandler(req, res);
    assert.strictEqual(getStatus(), 400);
    assert.ok(getData().errors.some(e => e.includes('Company name is required')));
  });

  // Test 5: Missing email
  await runAsyncTest('Test 5: Missing email', async () => {
    const { req, res, getStatus, getData } = mockReqRes({
      method: 'POST',
      body: {
        fullName: 'Hans Gruber',
        companyName: 'Nakatomi Imports',
        country: 'Germany',
        email: '',
        product: 'Moringa Leaf Powder',
        quantity: 5000,
        destinationPort: 'Hamburg'
      }
    });
    await leadsApiHandler(req, res);
    assert.strictEqual(getStatus(), 400);
    assert.ok(getData().errors.some(e => e.includes('Valid email address is required')));
  });

  // Test 6: Invalid email
  await runAsyncTest('Test 6: Invalid email', async () => {
    const { req, res, getStatus, getData } = mockReqRes({
      method: 'POST',
      body: {
        fullName: 'Hans Gruber',
        companyName: 'Nakatomi Imports',
        country: 'Germany',
        email: 'not-an-email@com',
        product: 'Moringa Leaf Powder',
        quantity: 5000,
        destinationPort: 'Hamburg'
      }
    });
    await leadsApiHandler(req, res);
    assert.strictEqual(getStatus(), 400);
    assert.ok(getData().errors.some(e => e.includes('Valid email address is required')));
  });

  // Test 7: Missing product
  await runAsyncTest('Test 7: Missing product', async () => {
    const { req, res, getStatus, getData } = mockReqRes({
      method: 'POST',
      body: {
        fullName: 'Hans Gruber',
        companyName: 'Nakatomi Imports',
        country: 'Germany',
        email: 'hans@nakatomi.de',
        product: '',
        quantity: 5000,
        destinationPort: 'Hamburg'
      }
    });
    await leadsApiHandler(req, res);
    assert.strictEqual(getStatus(), 400);
    assert.ok(getData().errors.some(e => e.includes('Product selection is required')));
  });

  // Test 8: Unsupported product
  await runAsyncTest('Test 8: Unsupported product', async () => {
    const { req, res, getStatus, getData } = mockReqRes({
      method: 'POST',
      body: {
        fullName: 'Hans Gruber',
        companyName: 'Nakatomi Imports',
        country: 'Germany',
        email: 'hans@nakatomi.de',
        product: 'Industrial Machine Parts',
        quantity: 5000,
        destinationPort: 'Hamburg'
      }
    });
    await leadsApiHandler(req, res);
    assert.strictEqual(getStatus(), 400);
    assert.ok(getData().errors.some(e => e.includes('unsupported')));
  });

  // Test 9: Missing quantity
  await runAsyncTest('Test 9: Missing quantity', async () => {
    const { req, res, getStatus, getData } = mockReqRes({
      method: 'POST',
      body: {
        fullName: 'Hans Gruber',
        companyName: 'Nakatomi Imports',
        country: 'Germany',
        email: 'hans@nakatomi.de',
        product: 'Moringa Leaf Powder',
        quantity: '',
        destinationPort: 'Hamburg'
      }
    });
    await leadsApiHandler(req, res);
    assert.strictEqual(getStatus(), 400);
    assert.ok(getData().errors.some(e => e.includes('Quantity must be greater than zero')));
  });

  // Test 10: Zero quantity
  await runAsyncTest('Test 10: Zero quantity', async () => {
    const { req, res, getStatus, getData } = mockReqRes({
      method: 'POST',
      body: {
        fullName: 'Hans Gruber',
        companyName: 'Nakatomi Imports',
        country: 'Germany',
        email: 'hans@nakatomi.de',
        product: 'Moringa Leaf Powder',
        quantity: 0,
        destinationPort: 'Hamburg'
      }
    });
    await leadsApiHandler(req, res);
    assert.strictEqual(getStatus(), 400);
    assert.ok(getData().errors.some(e => e.includes('Quantity must be greater than zero')));
  });

  // Test 11: Negative quantity
  await runAsyncTest('Test 11: Negative quantity', async () => {
    const { req, res, getStatus, getData } = mockReqRes({
      method: 'POST',
      body: {
        fullName: 'Hans Gruber',
        companyName: 'Nakatomi Imports',
        country: 'Germany',
        email: 'hans@nakatomi.de',
        product: 'Moringa Leaf Powder',
        quantity: -500,
        destinationPort: 'Hamburg'
      }
    });
    await leadsApiHandler(req, res);
    assert.strictEqual(getStatus(), 400);
    assert.ok(getData().errors.some(e => e.includes('Quantity must be greater than zero')));
  });

  // Test 12: 18,000 KG
  runTest('Test 12: Quantity 18,000 KG normalization', () => {
    const norm = normalizeIncomingPayload({
      fullName: 'Buyer A',
      companyName: 'Company A',
      country: 'UK',
      email: 'a@buyer.co.uk',
      product: 'moringa-leaf-powder',
      quantity: '18000',
      quantityUnit: 'KG',
      destinationPort: 'London Gateway'
    });
    const { valid, errors, lead } = validateLeadPayload(norm);
    assert.strictEqual(valid, true, `Errors: ${errors ? errors.join(', ') : ''}`);
    assert.strictEqual(lead.inquiry.quantity, 18000);
    assert.strictEqual(lead.inquiry.quantityUnit, 'KG');
  });

  // Test 13: 18 MT
  runTest('Test 13: Quantity 18 MT normalization to 18,000 KG', () => {
    const norm = normalizeIncomingPayload({
      fullName: 'Buyer B',
      companyName: 'Company B',
      country: 'France',
      email: 'b@buyer.fr',
      product: 'moringa-leaf-powder',
      quantity: '18 MT',
      destinationPort: 'Le Havre'
    });
    const { valid, errors, lead } = validateLeadPayload(norm);
    assert.strictEqual(valid, true, `Errors: ${errors ? errors.join(', ') : ''}`);
    assert.strictEqual(lead.inquiry.quantity, 18000);
    assert.strictEqual(lead.inquiry.quantityUnit, 'KG');
  });

  // Test 14: "18,000 KG"
  runTest('Test 14: Quantity "18,000 KG" string with comma normalization', () => {
    const norm = normalizeIncomingPayload({
      fullName: 'Buyer C',
      companyName: 'Company C',
      country: 'UAE',
      email: 'c@buyer.ae',
      product: 'moringa-leaf-powder',
      quantity: '18,000 KG',
      destinationPort: 'Jebel Ali'
    });
    const { valid, errors, lead } = validateLeadPayload(norm);
    assert.strictEqual(valid, true, `Errors: ${errors ? errors.join(', ') : ''}`);
    assert.strictEqual(lead.inquiry.quantity, 18000);
    assert.strictEqual(lead.inquiry.quantityUnit, 'KG');
  });

  // Test 15: Packaging "25 KG bags" with quantity 18 MT
  runTest('Test 15: Packaging "25 KG bags" with order quantity 18 MT distinct separation', () => {
    const norm = normalizeIncomingPayload({
      fullName: 'Buyer D',
      companyName: 'Company D',
      country: 'USA',
      email: 'd@buyer.us',
      product: 'moringa-leaf-powder',
      quantity: '18 MT',
      packaging: '25 KG Food-Grade HDPE Bags with inner liner',
      destinationPort: 'Port of Los Angeles'
    });
    const { valid, errors, lead } = validateLeadPayload(norm);
    assert.strictEqual(valid, true, `Errors: ${errors ? errors.join(', ') : ''}`);
    assert.strictEqual(lead.inquiry.quantity, 18000);
    assert.strictEqual(lead.inquiry.packaging, '25 KG Food-Grade HDPE Bags with inner liner');
    assert.notStrictEqual(lead.inquiry.quantity, 25);
  });

  // Test 16: Missing destination
  await runAsyncTest('Test 16: Missing destination', async () => {
    const { req, res, getStatus, getData } = mockReqRes({
      method: 'POST',
      body: {
        fullName: 'Hans Gruber',
        companyName: 'Nakatomi Imports',
        country: 'Germany',
        email: 'hans16@nakatomi.de',
        product: 'Moringa Leaf Powder',
        quantity: 5000,
        destinationPort: ''
      }
    });
    await leadsApiHandler(req, res);
    assert.strictEqual(getStatus(), 400);
    assert.ok(getData().errors.some(e => e.includes('Destination country or port is required')));
  });

  // Test 17: Optional fields omitted
  await runAsyncTest('Test 17: Optional fields omitted', async () => {
    const { req, res, getStatus, getData } = mockReqRes({
      method: 'POST',
      body: {
        fullName: 'Minimalist Buyer',
        companyName: 'Bare Minima Trading',
        country: 'Japan',
        email: 'buyer@tokyomin.jp',
        product: 'Moringa Leaf Powder',
        quantity: 2000,
        destinationPort: 'Tokyo Port'
        // omitted: mesh, moisture, testingRequired, sampleRequired, timeline, notes
      }
    });
    await leadsApiHandler(req, res);
    assert.strictEqual(getStatus(), 201);
    const data = getData();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.lead.inquiry.sampleRequired, false);
    assert.strictEqual(data.lead.inquiry.coaRequired, false);
    assert.strictEqual(data.lead.inquiry.testingRequired, false);
    assert.strictEqual(data.lead.inquiry.mesh, 'Standard (80–100 Mesh)');
    assert.strictEqual(data.lead.workflow.status, 'NEW');
  });

  // Test 18: Long additional requirements
  await runAsyncTest('Test 18: Long additional requirements handled safely', async () => {
    const longText = 'A'.repeat(1200);
    const { req, res, getStatus, getData } = mockReqRes({
      method: 'POST',
      body: {
        fullName: 'Verbose Buyer',
        companyName: 'Specification Heavy Inc',
        country: 'Switzerland',
        email: 'verbose@specswiss.ch',
        product: 'Moringa Leaf Powder',
        quantity: 10000,
        destinationPort: 'Basel',
        additionalRequirements: longText
      }
    });
    await leadsApiHandler(req, res);
    assert.strictEqual(getStatus(), 201);
    const data = getData();
    assert.strictEqual(data.success, true);
    assert.ok(data.lead.inquiry.additionalRequirements.length <= 1000);
  });

  // Test 19: Duplicate submission behavior
  await runAsyncTest('Test 19: Duplicate submission behavior within 60s window', async () => {
    const payload = {
      fullName: 'Rapid Buyer',
      companyName: 'Speedy Spices',
      country: 'Singapore',
      email: 'rapid@speedyspices.sg',
      product: 'Moringa Leaf Powder',
      quantity: 5000,
      destinationPort: 'Jurong Port'
    };

    // First submission
    const res1 = mockReqRes({ method: 'POST', body: payload });
    await leadsApiHandler(res1.req, res1.res);
    assert.strictEqual(res1.getStatus(), 201);
    const id1 = res1.getData().leadId;

    // Immediate second identical submission
    const res2 = mockReqRes({ method: 'POST', body: payload });
    await leadsApiHandler(res2.req, res2.res);
    assert.strictEqual(res2.getStatus(), 200);
    assert.strictEqual(res2.getData().duplicate, true);
    assert.strictEqual(res2.getData().leadId, id1);
  });

  // Test 20: Malformed JSON
  await runAsyncTest('Test 20: Malformed payload / non-object', async () => {
    const { req, res, getStatus, getData } = mockReqRes({
      method: 'POST',
      body: 'invalid-string-not-json-object'
    });
    await leadsApiHandler(req, res);
    assert.strictEqual(getStatus(), 400);
    assert.ok(getData().error.includes('Bad Request') || getData().error.includes('Validation Error'));
  });

  // Test 21: Unsupported HTTP method (GET, PUT, DELETE, PATCH reject with 405)
  await runAsyncTest('Test 21: Unsupported HTTP method rejection (405)', async () => {
    for (const method of ['GET', 'PUT', 'DELETE', 'PATCH']) {
      const { req, res, getStatus, getData, getHeaders } = mockReqRes({ method });
      await leadsApiHandler(req, res);
      assert.strictEqual(getStatus(), 405, `Method ${method} should return 405`);
      assert.strictEqual(getHeaders()['allow'], 'POST');
      assert.strictEqual(getData().error, 'Method Not Allowed');
    }
  });

  // Test 22: Unknown / arbitrary fields ignored
  runTest('Test 22: Unknown / arbitrary fields sanitized out', () => {
    const input = {
      fullName: 'Alice Walker',
      companyName: 'Walker Trade',
      country: 'Canada',
      email: 'alice@walkertrade.ca',
      product: 'Moringa Leaf Powder',
      quantity: 3000,
      destinationPort: 'Vancouver',
      adminPassword: 'hack',
      isPrivileged: true,
      sqlInjection: "DROP TABLE users;"
    };
    const norm = normalizeIncomingPayload(input);
    const { lead } = validateLeadPayload(norm);
    assert.strictEqual(lead.adminPassword, undefined);
    assert.strictEqual(lead.isPrivileged, undefined);
    assert.strictEqual(lead.sqlInjection, undefined);
    assert.strictEqual(lead.buyer.name, 'Alice Walker');
  });

  // Test 23: XSS payload sanitization
  runTest('Test 23: XSS payload sanitization', () => {
    const raw = '<script>alert("XSS")</script><b>Hello</b> & "World"';
    const clean = sanitizeString(raw);
    assert.ok(!clean.includes('<script>'));
    assert.ok(!clean.includes('alert'));
    assert.ok(clean.includes('&quot;World&quot;'));
  });

  // Test 24: HTML injection
  runTest('Test 24: HTML injection in inquiry fields', () => {
    const input = {
      fullName: 'Bob <img src="x" onerror="steal()">',
      companyName: '<a href="http://evil.com">Evil Corp</a>',
      country: 'USA',
      email: 'bob@evil.com',
      product: 'Moringa Leaf Powder',
      quantity: 1000,
      destinationPort: '<iframe src="evil.com"></iframe>New York',
      additionalRequirements: '<style>body{display:none}</style>Need urgent delivery'
    };
    const norm = normalizeIncomingPayload(input);
    const { lead } = validateLeadPayload(norm);
    assert.ok(!lead.buyer.name.includes('<img'));
    assert.ok(!lead.buyer.company.includes('<a'));
    assert.ok(!lead.inquiry.destination.includes('<iframe'));
    assert.ok(!lead.inquiry.additionalRequirements.includes('<style'));
  });

  // Test 25: PII analytics exclusion
  runTest('Test 25: PII analytics exclusion verification', () => {
    const contactCode = fs.readFileSync(path.join(__dirname, '../src/pages/Contact.jsx'), 'utf8');
    assert.ok(!contactCode.includes('email: formData.email'), 'Never push buyer email to analytics');
    assert.ok(!contactCode.includes('phone: formData.phone'), 'Never push buyer phone to analytics');
    assert.ok(!contactCode.includes('buyer_name:'), 'Never push buyer name to analytics');
    assert.ok(!contactCode.includes('buyer_email:'), 'Never push buyer email to analytics');
  });

  // Test 26: Lead ID uniqueness & formatting
  runTest('Test 26: Lead ID uniqueness and format (AAF-L-YYYY-XXXX)', () => {
    const ids = new Set();
    for (let i = 0; i < 50; i++) {
      const id = generateLeadId();
      assert.match(id, /^AAF-L-\d{4}-\d{4}$/);
      assert.ok(!ids.has(id), `Duplicate ID generated: ${id}`);
      ids.add(id);
    }
  });

  // Test 27: Product prefill logic
  runTest('Test 27: Product prefill logic', () => {
    const pmMoringa = matchProductMaster('moringa-leaf-powder');
    assert.strictEqual(pmMoringa.productId, 'moringa-leaf-powder');
    assert.strictEqual(pmMoringa.hsCode, '12119029');

    const pmOnion = matchProductMaster('dehydrated-red-onion-powder');
    assert.strictEqual(pmOnion.productId, 'red-onion-powder');
    assert.strictEqual(pmOnion.hsCode, '07122000');
  });

  // Test 28: URL quantity prefill
  runTest('Test 28: URL quantity prefill parsing (e.g. 18MT -> 18000 KG)', () => {
    const parsed1 = parseQuantityKg('18MT');
    assert.strictEqual(parsed1, 18000);

    const parsed2 = parseQuantityKg('25000');
    assert.strictEqual(parsed2, 25000);

    const parsed3 = parseQuantityKg('18,000 KG');
    assert.strictEqual(parsed3, 18000);
  });

  // Test 29: Existing quotation engine regression
  runTest('Test 29: Existing P3 quotation engine parity regression check', () => {
    const calc = calculateQuotation({
      items: [
        { name: 'Moringa Leaf Powder', quantity: 18000, rate: 650, currency: 'INR' },
        { name: 'Dehydrated Red Onion Powder', quantity: 18000, rate: 350, currency: 'INR' }
      ]
    });
    assert.strictEqual(calc.items[0].total, 11700000);
    assert.strictEqual(calc.items[1].total, 6300000);
    assert.strictEqual(calc.grandTotal, 18000000);
  });

  // Test 30: Build regression check
  runTest('Test 30: Vite project files structural integrity', () => {
    assert.ok(fs.existsSync(path.join(__dirname, '../src/data/leadModel.js')));
    assert.ok(fs.existsSync(path.join(__dirname, '../api/leads.js')));
    assert.ok(fs.existsSync(path.join(__dirname, '../src/pages/Contact.jsx')));
    assert.ok(fs.existsSync(path.join(__dirname, '../src/pages/PrivateDashboard.jsx')));
  });

  console.log('============================================================');
  console.log(`RESULTS: ${passedTests}/${totalTests} TESTS PASSED`);
  if (failedTests > 0) {
    console.error(`FAILURES: ${failedTests} TESTS FAILED`);
    process.exit(1);
  } else {
    console.log('ALL P4.1 LEAD CAPTURE TESTS PASS!');
  }
}

main().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
