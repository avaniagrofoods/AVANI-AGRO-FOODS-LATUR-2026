import puppeteer from 'puppeteer';
import fs from 'fs';

let MASTER_PASSWORD = process.env.MASTER_GATE_PASSWORD || process.env.PRIVATE_PORTAL_PASSWORD || '';
try {
  if (!MASTER_PASSWORD && fs.existsSync('.env.local')) {
    const envFile = fs.readFileSync('.env.local', 'utf8');
    const match = envFile.match(/(?:PRIVATE_PORTAL_PASSWORD|MASTER_GATE_PASSWORD)\s*=\s*([^\r\n]+)/);
    if (match) {
      MASTER_PASSWORD = match[1].trim().replace(/^['"]|['"]$/g, '');
    }
  }
} catch {}
if (!MASTER_PASSWORD) {
  MASTER_PASSWORD = 'Samarth@1356';
}
const PROD_BASE = 'https://www.avaniagrofoods.com';

console.log('============================================================');
console.log('AVANI AGRO FOODS — PRODUCTION LIVE VERIFICATION');
console.log(`Target: ${PROD_BASE}`);
console.log('============================================================\n');

async function runVerification() {
  const results = [];

  function record(title, passed, detail = '') {
    results.push({ title, passed, detail });
    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${title} ${detail ? '(' + detail + ')' : ''}`);
  }

  // 1. Direct API security & payload checks
  try {
    const impRes = await fetch(`${PROD_BASE}/api/importers`);
    record('API: Unauthenticated /api/importers rejected with 401', impRes.status === 401, `Status: ${impRes.status}`);

    const mfrRes = await fetch(`${PROD_BASE}/api/manufacturers`);
    record('API: Unauthenticated /api/manufacturers rejected with 401', mfrRes.status === 401, `Status: ${mfrRes.status}`);

    // Verify Master Gate Login endpoint
    const loginRes = await fetch(`${PROD_BASE}/api/verify-gate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: MASTER_PASSWORD })
    });
    record('API: POST /api/verify-gate returns HTTP 200', loginRes.status === 200, `Status: ${loginRes.status}`);

    // Test API authentication with Bearer token
    const authImpRes = await fetch(`${PROD_BASE}/api/importers`, {
      headers: { Authorization: `Bearer ${MASTER_PASSWORD}` }
    });
    record('API: Authenticated /api/importers returns 200', authImpRes.status === 200, `Status: ${authImpRes.status}`);
    if (authImpRes.status === 200) {
      const impJson = await authImpRes.json();
      record('API: Importer payload count is 612', impJson.count === 612, `Count: ${impJson.count}`);
      const rawText = JSON.stringify(impJson);
      const hasFake = rawText.includes('+12345678900') || rawText.includes('1234567890') || rawText.includes('sourcing@buyer.com');
      record('API: Zero placeholder contact numbers in importer response', !hasFake, hasFake ? 'FOUND PLACEHOLDER' : 'ZERO occurrences');
    }

    const authMfrRes = await fetch(`${PROD_BASE}/api/manufacturers`, {
      headers: { Authorization: `Bearer ${MASTER_PASSWORD}` }
    });
    record('API: Authenticated /api/manufacturers returns 200', authMfrRes.status === 200, `Status: ${authMfrRes.status}`);
    if (authMfrRes.status === 200) {
      const mfrJson = await authMfrRes.json();
      record('API: Manufacturer payload count is 129', mfrJson.count === 129, `Count: ${mfrJson.count}`);
      const rawMfrText = JSON.stringify(mfrJson);
      const hasMfrFake = rawMfrText.includes('+12345678900') || rawMfrText.includes('+91 7219053645');
      record('API: Zero placeholder contacts in manufacturer response', !hasMfrFake, hasMfrFake ? 'FOUND PLACEHOLDER' : 'ZERO occurrences');
    }
  } catch (err) {
    record('API: Direct API checks execution', false, err.message);
  }

  // 2. Launch Puppeteer browser
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  const pageErrors = [];
  page.on('pageerror', err => pageErrors.push(err.message));

  try {
    // 3. Test /private unauthenticated
    await page.goto(`${PROD_BASE}/private`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('input[type="password"]', { timeout: 10000 });
    const contentUnauth = await page.content();
    record('Page: /private unauthenticated shows PasswordGate', contentUnauth.includes('Private Business Portal') || contentUnauth.includes('UNLOCK ACCESS'));
    record('Page: /private unauthenticated does not show ErrorBoundary', !contentUnauth.includes('Something went wrong'));

    // 4. Authenticate through PasswordGate form
    await page.type('input[type="password"]', MASTER_PASSWORD);
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) {
      await submitBtn.click();
    } else {
      await page.keyboard.press('Enter');
    }

    await page.waitForFunction(
      () => document.body.innerText.includes('Business Intelligence Dashboard') || document.body.innerText.includes('PROCESSOR NETWORK'),
      { timeout: 15000 }
    );
    await new Promise(r => setTimeout(r, 2000));

    // 5. Verify /private authenticated dashboard
    const contentAuth = await page.content();
    record('Page: /private authenticated loaded dashboard', contentAuth.includes('Business Intelligence Dashboard'));
    record('Page: /private no ErrorBoundary', !contentAuth.includes('Something went wrong'));
    record('Page: /private displays Global Importers count (612)', contentAuth.includes('612'));
    record('Page: /private displays Processor Network count (129)', contentAuth.includes('129'));

    // 6. Test /private/importers
    await page.goto(`${PROD_BASE}/private/importers`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForFunction(() => document.body.innerText.includes('Importer Intelligence Database'), { timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));
    const contentImporters = await page.content();

    record('Page: /private/importers loaded successfully', contentImporters.includes('Importer Intelligence Database'));
    record('Page: /private/importers no ErrorBoundary', !contentImporters.includes('Something went wrong'));
    record('Page: /private/importers dynamic country filter rendered', contentImporters.includes('All Countries') && contentImporters.includes('USA'));
    record('Page: /private/importers displays 612 buyers in subtitle', contentImporters.includes('612 international agricultural buyers'));

    // 7. SPECIFIC PLACEHOLDER FORENSICS CHECK
    const hasPlaceholderPhone = contentImporters.includes('+12345678900') || contentImporters.includes('+1 234 567 8900') || contentImporters.includes('12345678900');
    record('Placeholder Check: +12345678900 NOT FOUND in /private/importers page', !hasPlaceholderPhone, hasPlaceholderPhone ? 'FOUND PLACEHOLDER' : 'ZERO occurrences');

    const hasPlaceholderEmail = contentImporters.includes('sourcing@buyer.com');
    record('Placeholder Check: sourcing@buyer.com NOT FOUND in /private/importers page', !hasPlaceholderEmail, hasPlaceholderEmail ? 'FOUND PLACEHOLDER' : 'ZERO occurrences');

    // 8. Test /private/manufacturers
    await page.goto(`${PROD_BASE}/private/manufacturers`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForFunction(() => document.body.innerText.includes('Indian Manufacturer'), { timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));
    const contentMfrs = await page.content();

    record('Page: /private/manufacturers loaded successfully', contentMfrs.includes('Indian Manufacturer & Processor Database'));
    record('Page: /private/manufacturers no ErrorBoundary', !contentMfrs.includes('Something went wrong'));
    record('Page: /private/manufacturers shows dynamic unit count (129)', contentMfrs.includes('129 Indian processing plants'));

    const hasMfrPlaceholderPhone = contentMfrs.includes('+12345678900') || contentMfrs.includes('+91 7219053645');
    record('Placeholder Check: +12345678900 / +91 7219053645 NOT FOUND in manufacturers page', !hasMfrPlaceholderPhone, hasMfrPlaceholderPhone ? 'FOUND PLACEHOLDER' : 'ZERO occurrences');

    record('Browser console/page errors check', pageErrors.length === 0, pageErrors.length > 0 ? pageErrors.join(', ') : 'Zero errors');

  } catch (err) {
    record('Browser verification execution', false, err.message);
  } finally {
    await browser.close();
  }

  console.log('\n============================================================');
  const allPassed = results.every(r => r.passed);
  console.log(`PRODUCTION VERIFICATION STATUS: ${allPassed ? 'ALL PASSED (PRODUCTION READY)' : 'FAILURES DETECTED'}`);
  console.log('============================================================\n');

  if (!allPassed) {
    process.exit(1);
  }
}

runVerification();
