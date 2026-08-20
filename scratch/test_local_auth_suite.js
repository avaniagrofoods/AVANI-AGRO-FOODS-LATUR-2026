import handlerGate from '../api/verify-gate.js';
import handlerAffiliate from '../api/affiliate-auth.js';
import handlerAdmin from '../api/admin-quotations.js';
import handlerQuotation from '../api/quotation.js';
import { generateExcelQuotation, calculateQuotation } from '../api/lib/quotationEngine.js';
import ExcelJS from 'exceljs';

// Mock Express/Vercel Req & Res
function createMockReqRes(options = {}) {
  const req = {
    method: options.method || 'POST',
    headers: options.headers || {},
    body: options.body || {},
    query: options.query || {},
  };

  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(k, v) {
      this.headers[k.toLowerCase()] = v;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
    send(data) {
      this.body = data;
      return this;
    }
  };

  return { req, res };
}

async function runLocalAuthTests() {
  console.log('==================================================');
  console.log('STARTING LOCAL UNIT & LOGIC TESTS');
  console.log('==================================================\n');

  process.env.MASTER_GATE_PASSWORD = 'Samarth@1356';
  process.env.AFFILIATE_PASSWORD = 'Samarth@1356';
  process.env.SESSION_SECRET = 'TEST_SESSION_SECRET_32_CHARACTERS_LONG_HEX_123456';

  let allPassed = true;
  function assert(title, condition, extra = '') {
    if (condition) {
      console.log(`[PASS] ${title} ${extra ? `(${extra})` : ''}`);
    } else {
      console.error(`[FAIL] ${title} ${extra ? `(${extra})` : ''}`);
      allPassed = false;
    }
  }

  // 1. MASTER GATE TESTS
  console.log('\n--- 1. MASTER GATE (/api/verify-gate) ---');
  // 1A. Wrong Password
  {
    const { req, res } = createMockReqRes({ body: { password: 'TEST123' } });
    await handlerGate(req, res);
    assert('Master Gate: Wrong password rejected with 401', res.statusCode === 401 && res.body?.error?.includes('Incorrect'));
  }

  // 1B. Empty Password
  {
    const { req, res } = createMockReqRes({ body: { password: '' } });
    await handlerGate(req, res);
    assert('Master Gate: Empty password rejected with 400', res.statusCode === 400);
  }

  // 1C. Missing Password
  {
    const { req, res } = createMockReqRes({ body: {} });
    await handlerGate(req, res);
    assert('Master Gate: Missing password rejected with 400', res.statusCode === 400);
  }

  // 1D. Correct Password (Samarth@1356)
  let gateCookie = '';
  {
    const { req, res } = createMockReqRes({ body: { password: 'Samarth@1356' } });
    await handlerGate(req, res);
    const cookie = res.headers['set-cookie'];
    gateCookie = cookie;
    assert('Master Gate: Correct password accepted with 200', res.statusCode === 200 && res.body?.success === true);
    assert('Master Gate: Cookie avani_gate_session issued', typeof cookie === 'string' && cookie.includes('avani_gate_session=') && cookie.includes('HttpOnly') && cookie.includes('SameSite=Strict'));
  }

  // 1E. Verify Session with Valid Cookie
  {
    const cookieVal = gateCookie.split(';')[0];
    const { req, res } = createMockReqRes({
      headers: { cookie: cookieVal },
      body: { action: 'verify' }
    });
    await handlerGate(req, res);
    assert('Master Gate: Verify valid session cookie -> 200', res.statusCode === 200 && res.body?.authenticated === true);
  }

  // 1F. Verify Session with Tampered Cookie
  {
    const tampered = 'avani_gate_session=tampered_payload.tampered_signature';
    const { req, res } = createMockReqRes({
      headers: { cookie: tampered },
      body: { action: 'verify' }
    });
    await handlerGate(req, res);
    assert('Master Gate: Tampered session cookie rejected -> 401', res.statusCode === 401 && res.body?.authenticated === false);
  }

  // 2. AFFILIATE AUTH TESTS
  console.log('\n--- 2. AFFILIATE PORTAL (/api/affiliate-auth) ---');
  // 2A. Wrong Password
  {
    const { req, res } = createMockReqRes({ body: { password: 'TEST123' } });
    await handlerAffiliate(req, res);
    assert('Affiliate: Wrong password rejected with 401', res.statusCode === 401);
  }

  // 2B. Correct Password (Samarth@1356)
  let affiliateCookie = '';
  {
    const { req, res } = createMockReqRes({ body: { password: 'Samarth@1356' } });
    await handlerAffiliate(req, res);
    const cookies = res.headers['set-cookie'];
    affiliateCookie = Array.isArray(cookies) ? cookies.find(c => c.includes('avani_affiliate_session=')) : cookies;
    assert('Affiliate: Correct password accepted with 200', res.statusCode === 200 && res.body?.success === true);
    assert('Affiliate: Cookie avani_affiliate_session issued', Boolean(affiliateCookie && affiliateCookie.includes('avani_affiliate_session=')));
  }

  // 2C. Verify Affiliate Session
  {
    const cookieVal = affiliateCookie.split(';')[0];
    const { req, res } = createMockReqRes({
      headers: { cookie: cookieVal },
      body: { action: 'verify' }
    });
    await handlerAffiliate(req, res);
    assert('Affiliate: Verify valid session cookie -> 200', res.statusCode === 200 && res.body?.authenticated === true);
  }

  // 3. ADMIN QUOTATIONS TESTS
  console.log('\n--- 3. ADMIN QUOTATIONS (/api/admin-quotations) ---');
  // 3A. Unauthenticated
  {
    const { req, res } = createMockReqRes({ method: 'GET' });
    await handlerAdmin(req, res);
    assert('Admin: Unauthenticated GET request rejected with 401', res.statusCode === 401);
  }

  // 3B. Authenticated with Gate Cookie
  {
    const cookieVal = gateCookie.split(';')[0];
    const { req, res } = createMockReqRes({
      method: 'GET',
      headers: { cookie: cookieVal }
    });
    await handlerAdmin(req, res);
    assert('Admin: Authenticated with avani_gate_session -> 200', res.statusCode === 200 && res.body?.quotations?.length > 0);
  }

  // 3C. Authenticated with Bearer token (Samarth@1356)
  {
    const { req, res } = createMockReqRes({
      method: 'GET',
      headers: { authorization: 'Bearer Samarth@1356' }
    });
    await handlerAdmin(req, res);
    assert('Admin: Authenticated with Bearer token (Samarth@1356) -> 200', res.statusCode === 200);
  }

  // 4. EXCEL WORKSHEET PROTECTION TEST
  console.log('\n--- 4. EXCEL WORKSHEET PROTECTION TEST ---');
  {
    const quote = calculateQuotation({
      customerName: 'Test Buyer',
      product: 'Moringa Leaf Powder',
      quantity: 500,
      currency: 'USD'
    });
    const xlsxBuffer = await generateExcelQuotation(quote, 'Samarth@1356');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(xlsxBuffer);
    const sheet = workbook.getWorksheet('Quotation');
    const isProtected = sheet.sheetProtection !== undefined && sheet.sheetProtection !== null;
    assert('Excel: Worksheet is protected', isProtected);
    assert('Excel: Protection algorithm uses password hash', Boolean(sheet.sheetProtection?.password || sheet.sheetProtection?.algorithmName));
  }

  console.log('\n==================================================');
  console.log(allPassed ? 'ALL LOCAL LOGIC TESTS PASSED (100%)' : 'SOME TESTS FAILED');
  console.log('==================================================');
}

runLocalAuthTests().catch(console.error);
