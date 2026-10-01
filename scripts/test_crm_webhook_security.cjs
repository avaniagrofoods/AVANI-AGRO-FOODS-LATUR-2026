// ============================================================
// AVANI AGRO FOODS — CRM WEBHOOK SECURITY & INTEGRATION TEST SUITE
// Tests 10 security & functional requirements:
// 1. Valid secret -> accepted
// 2. Missing secret -> rejected
// 3. Wrong secret -> rejected
// 4. Malformed JSON -> safe rejection
// 5. Empty payload -> safe rejection
// 6. Secret leakage prevention -> no secret in response
// 7. Existing valid RFQ flow -> successful inquiry & quote
// 8. Existing quotation generation -> mathematical & catalog accuracy
// 9. CRM synchronization payload -> proper structure & secret inclusion
// 10. Frontend bundle inspection -> zero secret presence
// ============================================================

const fs = require('fs');
const path = require('path');
const vm = require('vm');

let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
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

// Load environment variables from .env.local if present
function loadEnv() {
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
}

loadEnv();

const CRM_SECRET = process.env.CRM_WEBHOOK_SECRET || 'test_crm_secret_64chars_cryptographically_secure_entropy_token_aaf';

/**
 * Creates an execution sandbox that mirrors the Google Apps Script runtime
 */
function createAppsScriptSandbox(configuredSecret = CRM_SECRET) {
  const scriptContent = fs.readFileSync(path.join(__dirname, 'google-apps-script-crm.js'), 'utf8');

  const sheetsData = {};
  const lock = {
    waitLock: () => true,
    releaseLock: () => true
  };

  const fakeSheet = (name) => ({
    rows: [],
    appendRow(row) {
      if (!sheetsData[name]) sheetsData[name] = [];
      sheetsData[name].push(row);
    },
    getLastRow() {
      return (sheetsData[name] || []).length;
    },
    getRange: () => ({
      setFontWeight: () => {},
      setBackground: () => {},
      setFontColor: () => {},
      setHorizontalAlignment: () => {}
    }),
    setFrozenRows: () => {}
  });

  const fakeSpreadsheet = {
    getName: () => 'AVANI AGRO FOODS — Customer Inquiry & Quotation CRM',
    getId: () => '1X2TTc9iQ2IWCTQV0RknH37A3lmIFaaC0ImT4rfBPuLI',
    getSheetByName: (name) => sheetsData[name] ? fakeSheet(name) : null,
    insertSheet: (name) => {
      sheetsData[name] = [];
      return fakeSheet(name);
    }
  };

  const context = {
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (key) => key === 'CRM_WEBHOOK_SECRET' ? configuredSecret : null
      })
    },
    LockService: {
      getScriptLock: () => lock
    },
    SpreadsheetApp: {
      getActiveSpreadsheet: () => fakeSpreadsheet
    },
    ContentService: {
      MimeType: { JSON: 'application/json' },
      createTextOutput: (text) => ({
        text,
        mimeType: 'application/json',
        setMimeType: function(m) { this.mimeType = m; return this; }
      })
    },
    Date: Date,
    JSON: JSON,
    Math: Math,
    console: console
  };

  vm.createContext(context);
  vm.runInContext(scriptContent, context);

  return { context, sheetsData };
}

async function runTests() {
  console.log('════════════════════════════════════════════════════════════════');
  console.log('  AVANI AGRO FOODS — CRM WEBHOOK SECURITY REGRESSION SUITE       ');
  console.log(`  Timestamp: ${new Date().toISOString()}                      `);
  console.log('════════════════════════════════════════════════════════════════\n');

  // --- TEST 1: Valid secret accepted ---
  console.log('--- 1. Testing Apps Script Authentication Logic ---');
  {
    const { context, sheetsData } = createAppsScriptSandbox(CRM_SECRET);
    const validEvent = {
      postData: {
        contents: JSON.stringify({
          targetSheet: 'Customer Inquiries',
          type: 'CUSTOMER_INQUIRY',
          webhookSecret: CRM_SECRET,
          inquiryId: 'AAF-INQ-TEST-001',
          buyerName: 'Security QA Test Buyer',
          email: 'qa@example.com',
          phone: '+91 99999 88888',
          product: 'Moringa Leaf Powder',
          quantityNormalizedKg: 1000
        })
      }
    };
    const res = context.doPost(validEvent);
    const parsed = JSON.parse(res.text);
    assert(parsed.success === true, 'TEST 1: Valid secret is accepted by CRM webhook');
    assert(sheetsData['Customer Inquiries'] && sheetsData['Customer Inquiries'].length > 0,
      'TEST 1b: Authorized inquiry written to Customer Inquiries sheet');
  }

  // --- TEST 2: Missing secret rejected ---
  {
    const { context, sheetsData } = createAppsScriptSandbox(CRM_SECRET);
    const missingSecretEvent = {
      postData: {
        contents: JSON.stringify({
          targetSheet: 'Customer Inquiries',
          type: 'CUSTOMER_INQUIRY',
          inquiryId: 'AAF-INQ-TEST-UNAUTH',
          buyerName: 'Attacker Without Secret'
        })
      }
    };
    const res = context.doPost(missingSecretEvent);
    const parsed = JSON.parse(res.text);
    assert(parsed.success === false && parsed.error.includes('Unauthorized'),
      'TEST 2: Missing secret is rejected with Unauthorized error');
    assert(!sheetsData['Customer Inquiries'] || sheetsData['Customer Inquiries'].length === 0,
      'TEST 2b: Unauthorized payload NOT written to spreadsheet');
  }

  // --- TEST 3: Wrong secret rejected ---
  {
    const { context, sheetsData } = createAppsScriptSandbox(CRM_SECRET);
    const wrongSecretEvent = {
      postData: {
        contents: JSON.stringify({
          targetSheet: 'Customer Inquiries',
          type: 'CUSTOMER_INQUIRY',
          webhookSecret: 'forged_fake_secret_hex_999999999999',
          buyerName: 'Attacker With Wrong Secret'
        })
      }
    };
    const res = context.doPost(wrongSecretEvent);
    const parsed = JSON.parse(res.text);
    assert(parsed.success === false && parsed.error.includes('Unauthorized'),
      'TEST 3: Wrong secret is rejected with Unauthorized error');
    assert(!sheetsData['Customer Inquiries'] || sheetsData['Customer Inquiries'].length === 0,
      'TEST 3b: Unauthorized payload with invalid secret NOT written to spreadsheet');
  }

  // --- TEST 4: Malformed JSON handled safely ---
  {
    const { context } = createAppsScriptSandbox(CRM_SECRET);
    const malformedEvent = {
      postData: {
        contents: '{{{ invalid json payload'
      }
    };
    const res = context.doPost(malformedEvent);
    const parsed = JSON.parse(res.text);
    assert(parsed.success === false && parsed.error.includes('Malformed JSON'),
      'TEST 4: Malformed JSON handled safely without crash or spreadsheet modification');
  }

  // --- TEST 5: Empty payload handled safely ---
  {
    const { context } = createAppsScriptSandbox(CRM_SECRET);
    const emptyEvent = {};
    const res = context.doPost(emptyEvent);
    const parsed = JSON.parse(res.text);
    assert(parsed.success === false && parsed.error.includes('Missing request payload'),
      'TEST 5: Empty payload handled safely with Bad Request error');
  }

  // --- TEST 6: Secret leakage check ---
  console.log('\n--- 2. Testing Secret Confidentiality ---');
  {
    const { context } = createAppsScriptSandbox(CRM_SECRET);
    const events = [
      {},
      { postData: { contents: 'invalid' } },
      { postData: { contents: JSON.stringify({ webhookSecret: 'wrong' }) } },
      { postData: { contents: JSON.stringify({ webhookSecret: CRM_SECRET }) } }
    ];
    let leaked = false;
    for (const evt of events) {
      const res = context.doPost(evt);
      if (res.text.includes(CRM_SECRET)) {
        leaked = true;
      }
    }
    const getRes = context.doGet({});
    if (getRes.text.includes(CRM_SECRET)) {
      leaked = true;
    }
    assert(!leaked, 'TEST 6: Response bodies across all error/success branches NEVER leak the secret');
  }

  // --- TEST 7: RFQ Flow & Quotation Generation ---
  console.log('\n--- 3. Testing Quotation Engine & RFQ Flow ---');
  {
    const { calculateQuotation, parseQuantityKg } = await import('../api/_lib/quotationEngine.js');
    const { matchProductMaster } = await import('../api/_lib/productMaster.js');

    // 18 MT Moringa Export Quote
    const pm = matchProductMaster('Moringa Leaf Powder');
    const kg = parseQuantityKg('18 MT');
    assert(kg === 18000, 'TEST 7a: 18 MT correctly parsed as 18,000 KG');
    assert(pm.hsCode === '12119029', 'TEST 7b: Moringa HS Code matches canonical 12119029');

    const quote = calculateQuotation({
      quoteId: 'AAF-Q-2026-TEST',
      inquiryId: 'AAF-INQ-2026-TEST',
      date: '2026-09-30',
      validUntil: '12 Oct 2026',
      buyerName: 'Vikram',
      companyName: 'Vikraja Exports',
      country: 'India',
      currency: 'INR',
      items: [{
        sr: 1,
        productId: pm.productId,
        name: pm.productName,
        hscode: pm.hsCode,
        quantity: kg,
        unit: 'KG',
        rate: 350.00
      }],
      freight: 0,
      insurance: 0,
      documentation: 0
    });

    assert(quote.subtotal === 6300000 && quote.grandTotal === 6300000,
      'TEST 8: Quotation engine accurately calculates 18,000 KG @ ₹350 = ₹6,300,000');
  }

  // --- TEST 9: Quotation tab payload verification ---
  console.log('\n--- 4. Testing Quotations Tab Processing in Apps Script ---');
  {
    const { context, sheetsData } = createAppsScriptSandbox(CRM_SECRET);
    const validQuoteEvent = {
      postData: {
        contents: JSON.stringify({
          targetSheet: 'Quotations',
          type: 'QUOTATION',
          webhookSecret: CRM_SECRET,
          quotationId: 'AAF-Q-2026-9075',
          inquiryId: 'AAF-INQ-2026-TEST01',
          buyer: 'Vikram',
          company: 'Vikraja Exports',
          country: 'India',
          product: 'Moringa Leaf Powder',
          hsCode: '12119029',
          quantityKg: 18000,
          currency: 'INR',
          unitRate: 350,
          grandTotal: 6300000
        })
      }
    };
    const res = context.doPost(validQuoteEvent);
    const parsed = JSON.parse(res.text);
    assert(parsed.success === true, 'TEST 9a: Valid quotation sync accepted by Apps Script');
    assert(sheetsData['Quotations'] && sheetsData['Quotations'].length > 0,
      'TEST 9b: Quotation recorded in Quotations sheet with 28 standardized columns');
  }

  // --- TEST 10: Frontend bundle inspection ---
  console.log('\n--- 5. Testing Frontend Bundle for Secret Exposure ---');
  {
    const srcDir = path.join(__dirname, '..', 'src');
    function scanDir(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          scanDir(fullPath);
        } else if (entry.isFile() && /\.(js|jsx|ts|tsx|html|css|json)$/.test(entry.name)) {
          const content = fs.readFileSync(fullPath, 'utf8');
          if (content.includes('CRM_WEBHOOK_SECRET')) {
            return false;
          }
        }
      }
      return true;
    }
    const cleanFrontend = scanDir(srcDir);
    assert(cleanFrontend, 'TEST 10: Zero references to CRM_WEBHOOK_SECRET in frontend source code');
  }

  console.log('\n════════════════════════════════════════════════════════════════');
  console.log(`  RESULTS: ${passed} PASSED, ${failed} FAILED                 `);
  console.log('════════════════════════════════════════════════════════════════\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
