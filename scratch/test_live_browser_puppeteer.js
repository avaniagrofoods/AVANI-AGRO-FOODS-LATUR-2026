import puppeteer from 'puppeteer';

async function runLiveBrowserTests() {
  console.log('==================================================');
  console.log('STARTING LIVE PRODUCTION BROWSER E2E TESTS');
  console.log('Target: https://www.avaniagrofoods.com');
  console.log('Timestamp:', new Date().toISOString());
  console.log('==================================================\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const results = [];
  function record(testName, status, details) {
    results.push({ testName, status, details });
    console.log(`[${status}] ${testName} -> ${details}`);
  }

  try {
    // -----------------------------------------------------------
    // TEST 1: /manufacturers (Master Gate) - Fresh Incognito Context
    // -----------------------------------------------------------
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    console.log('Navigating to https://www.avaniagrofoods.com/manufacturers...');
    await page.goto('https://www.avaniagrofoods.com/manufacturers', { waitUntil: 'networkidle2' });

    // Verify Password Gate is rendered
    const gateHeading = await page.$eval('h2', el => el.innerText).catch(() => '');
    record('Manufacturers: Password Gate Visible', gateHeading.includes('Manufacturers') ? 'PASS' : 'FAIL', `Heading: "${gateHeading}"`);

    // 1A: Test Wrong Password (TEST123)
    await page.type('input[type="password"]', 'TEST123');
    await page.click('button[type="submit"]');
    await page.waitForNetworkIdle();
    await new Promise(r => setTimeout(r, 1000));

    const errorText = await page.evaluate(() => {
      const el = document.querySelector('.card div[style*="color: rgb(239, 68, 68)"]') || document.querySelector('.card');
      return el ? el.innerText : '';
    });
    const hasError = errorText.includes('Incorrect password') || errorText.includes('try again');
    record('Manufacturers: Wrong Password Rejected', hasError ? 'PASS' : 'FAIL', `Error message: "${errorText.replace(/\n/g, ' ')}"`);

    // 1B: Test Correct Password (Samarth@1356)
    // Clear input if needed and type correct password
    await page.click('input[type="password"]', { clickCount: 3 });
    await page.type('input[type="password"]', 'Samarth@1356');
    await page.click('button[type="submit"]');
    await page.waitForNetworkIdle();
    await new Promise(r => setTimeout(r, 1500));

    // Verify Protected Content Unlocked
    const pageContent = await page.evaluate(() => document.body.innerText);
    const unlocked = pageContent.includes('Database') && (pageContent.includes('Search') || pageContent.includes('Export') || pageContent.includes('Verified') || pageContent.includes('Manufacturer'));
    record('Manufacturers: Correct Password Unlocks Content', unlocked ? 'PASS' : 'FAIL', 'Protected database table and directory content loaded');

    // -----------------------------------------------------------
    // TEST 2: /importers (Session persistence across master portals)
    // -----------------------------------------------------------
    console.log('\nNavigating to https://www.avaniagrofoods.com/importers with gate session...');
    await page.goto('https://www.avaniagrofoods.com/importers', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));

    const importersContent = await page.evaluate(() => document.body.innerText);
    const importersUnlocked = importersContent.includes('Importers') && (importersContent.includes('Buyer') || importersContent.includes('Search') || importersContent.includes('Verified') || importersContent.includes('Database'));
    record('Importers: Session Cookie Authenticated Access', importersUnlocked ? 'PASS' : 'FAIL', 'Global Importers directory accessible via valid session');

    // -----------------------------------------------------------
    // TEST 3: /admin/quotations (Admin portal with gate session)
    // -----------------------------------------------------------
    console.log('\nNavigating to https://www.avaniagrofoods.com/admin/quotations...');
    await page.goto('https://www.avaniagrofoods.com/admin/quotations', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));

    const adminContent = await page.evaluate(() => document.body.innerText);
    const adminAccessible = adminContent.includes('Quotation') || adminContent.includes('Admin') || adminContent.includes('AAF-');
    record('Admin Quotations: Protected Content Accessible', adminAccessible ? 'PASS' : 'FAIL', 'Quotation administration table & controls rendered');

    // -----------------------------------------------------------
    // TEST 4: /affiliate-login (Separate Affiliate Portal)
    // -----------------------------------------------------------
    const affiliateContext = await browser.createBrowserContext();
    const affPage = await affiliateContext.newPage();
    await affPage.setViewport({ width: 1280, height: 800 });

    console.log('\nNavigating to https://www.avaniagrofoods.com/affiliate-login...');
    await affPage.goto('https://www.avaniagrofoods.com/affiliate-login', { waitUntil: 'networkidle2' });

    // 4A: Test Wrong Password
    await affPage.type('input[type="password"]', 'TEST123');
    await affPage.click('button[type="submit"]');
    await affPage.waitForNetworkIdle();
    await new Promise(r => setTimeout(r, 1000));

    const affErrorText = await affPage.evaluate(() => document.body.innerText);
    const affHasError = affErrorText.includes('Incorrect password') || affErrorText.includes('try again');
    record('Affiliate: Wrong Password Rejected', affHasError ? 'PASS' : 'FAIL', 'Error message rendered on failed login');

    // 4B: Test Correct Password (Samarth@1356)
    await affPage.click('input[type="password"]', { clickCount: 3 });
    await affPage.type('input[type="password"]', 'Samarth@1356');
    await affPage.click('button[type="submit"]');
    await affPage.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
    await new Promise(r => setTimeout(r, 2000));

    const affFinalUrl = affPage.url();
    const affDashboardContent = await affPage.evaluate(() => document.body.innerText);
    const affUnlocked = affFinalUrl.includes('/affiliate') && (affDashboardContent.includes('Affiliate') || affDashboardContent.includes('Commission') || affDashboardContent.includes('Partner'));
    record('Affiliate: Correct Password Logs In', affUnlocked ? 'PASS' : 'FAIL', `Redirected to ${affFinalUrl}, Partner Portal accessible`);

    console.log('\n==================================================');
    console.log('LIVE BROWSER ACCEPTANCE SUMMARY:');
    console.table(results);
    console.log('==================================================');

  } catch (err) {
    console.error('Browser Test Error:', err);
  } finally {
    await browser.close();
  }
}

runLiveBrowserTests().catch(console.error);
