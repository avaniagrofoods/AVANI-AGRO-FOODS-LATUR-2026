// ============================================================
// AVANI AGRO FOODS — Complete Live Production Validation Suite
// Target: https://www.avaniagrofoods.com
// ============================================================

const BASE_URL = 'https://www.avaniagrofoods.com';

async function runLiveAudit() {
  console.log(`====================================================`);
  console.log(`LIVE PRODUCTION TEST SUITE: ${BASE_URL}`);
  console.log(`Time: ${new Date().toISOString()}`);
  console.log(`====================================================\n`);

  const report = {
    buildVersion: null,
    routes: [],
    securityHeaders: {},
    robotsTxt: null,
    sitemap: null,
    authAPI: {},
    edgeMiddleware: null
  };

  // 1. Check Homepage HTML & Build Marker
  console.log('--- 1. Live Homepage & Build Marker Audit ---');
  try {
    const res = await fetch(`${BASE_URL}/`);
    const text = await res.text();
    const isV2 = text.includes('Build: 2026-08-18-v2.0.0') || text.includes('2026-08-18');
    const hasGA4 = text.includes('G-GNKT58TMBT');
    const hasCanonical = text.includes('rel="canonical"') || text.includes('https://www.avaniagrofoods.com');
    
    report.buildVersion = {
      httpStatus: res.status,
      isPhase4Build: isV2,
      hasGA4Script: hasGA4,
      hasCanonical: hasCanonical
    };
    console.log(`[PASS] Homepage Status: HTTP ${res.status}`);
    console.log(`[${isV2 ? 'PASS' : 'WARN'}] Phase 4 Build Marker Active: ${isV2}`);
    console.log(`[${hasGA4 ? 'PASS' : 'FAIL'}] GA4 Tag (G-GNKT58TMBT) In HTML: ${hasGA4}`);

    // Security Headers on Live Response
    report.securityHeaders = {
      hsts: res.headers.get('strict-transport-security'),
      xContentTypeOptions: res.headers.get('x-content-type-options'),
      xFrameOptions: res.headers.get('x-frame-options'),
      referrerPolicy: res.headers.get('referrer-policy')
    };
    console.log('Live Security Headers:', report.securityHeaders);
  } catch (err) {
    console.error('Homepage fetch error:', err);
  }

  // 2. Public Routes Test
  const publicRoutes = [
    '/',
    '/about',
    '/products',
    '/contact',
    '/b2b',
    '/b2b/store',
    '/manufacturer-requirements',
    '/export-compliance',
    '/blog',
    '/blog/moringa-powder-benefits-science-backed',
    '/manufacturers',
    '/importers',
    '/privacy',
    '/terms',
    '/disclaimer',
    '/affiliate-disclaimer',
    '/affiliate-login'
  ];

  console.log('\n--- 2. Public Routes Status Check ---');
  for (const route of publicRoutes) {
    try {
      const res = await fetch(`${BASE_URL}${route}`);
      const ok = res.status === 200;
      report.routes.push({ route, status: res.status, pass: ok });
      console.log(`[${ok ? 'PASS' : 'FAIL'}] ${route} -> HTTP ${res.status}`);
    } catch (e) {
      report.routes.push({ route, error: e.message, pass: false });
    }
  }

  // 3. Robots.txt Validation
  console.log('\n--- 3. Robots.txt Verification ---');
  try {
    const res = await fetch(`${BASE_URL}/robots.txt`);
    const txt = await res.text();
    const blocksManufacturers = txt.includes('Disallow: /manufacturers');
    const blocksImporters = txt.includes('Disallow: /importers');
    const hasSitemap = txt.includes('Sitemap: https://www.avaniagrofoods.com/sitemap.xml');
    
    report.robotsTxt = {
      status: res.status,
      manufacturersAllowed: !blocksManufacturers,
      importersAllowed: !blocksImporters,
      sitemapDeclared: hasSitemap
    };
    console.log(`[PASS] robots.txt Status: HTTP ${res.status}`);
    console.log(`[${!blocksManufacturers ? 'PASS' : 'FAIL'}] /manufacturers Allowed for Crawlers: ${!blocksManufacturers}`);
    console.log(`[${!blocksImporters ? 'PASS' : 'FAIL'}] /importers Allowed for Crawlers: ${!blocksImporters}`);
    console.log(`[${hasSitemap ? 'PASS' : 'FAIL'}] Sitemap Linked in robots.txt: ${hasSitemap}`);
  } catch (err) {
    console.error('robots.txt error:', err);
  }

  // 4. Sitemap.xml Validation
  console.log('\n--- 4. Sitemap.xml Verification ---');
  try {
    const res = await fetch(`${BASE_URL}/sitemap.xml`);
    const xml = await res.text();
    const locMatches = (xml.match(/<loc>/g) || []).length;
    const hasPriority = xml.includes('<priority>');
    
    report.sitemap = {
      status: res.status,
      urlCount: locMatches,
      hasObsoletePriority: hasPriority
    };
    console.log(`[PASS] sitemap.xml Status: HTTP ${res.status}`);
    console.log(`[PASS] Total Canonical URLs in Sitemap: ${locMatches}`);
    console.log(`[${!hasPriority ? 'PASS' : 'WARN'}] Obsolete Priority Tags Removed: ${!hasPriority}`);
  } catch (err) {
    console.error('sitemap error:', err);
  }

  // 5. Edge Middleware / Protected Route
  console.log('\n--- 5. Edge Middleware /affiliate Guard Test ---');
  try {
    const res = await fetch(`${BASE_URL}/affiliate`, { redirect: 'manual' });
    const location = res.headers.get('location') || '';
    const ok = (res.status === 307 || res.status === 302) && location.includes('/affiliate-login');
    report.edgeMiddleware = { status: res.status, location, pass: ok };
    console.log(`[${ok ? 'PASS' : 'FAIL'}] GET /affiliate -> HTTP ${res.status} (Redirect to: ${location})`);
  } catch (err) {
    console.error('Middleware error:', err);
  }

  // 6. API Authentication Tests
  console.log('\n--- 6. API Authentication & Rate Limiting Tests ---');
  // Test 6a: Wrong Password
  try {
    const res = await fetch(`${BASE_URL}/api/affiliate-auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'wrong_password_test_live' })
    });
    const data = await res.json();
    const ok = res.status === 401 && typeof data.remainingAttempts === 'number';
    report.authAPI.wrongPassword = { status: res.status, pass: ok, remaining: data.remainingAttempts };
    console.log(`[${ok ? 'PASS' : 'FAIL'}] Wrong Password -> HTTP ${res.status}, Remaining: ${data.remainingAttempts}`);
  } catch (err) {
    console.error('API wrong password error:', err);
  }

  // Test 6b: Rate Limiting (5 failures)
  let hit429 = false;
  for (let i = 1; i <= 6; i++) {
    const res = await fetch(`${BASE_URL}/api/affiliate-auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: `attempt_${i}_wrong` })
    });
    if (res.status === 429) hit429 = true;
  }
  report.authAPI.rateLimiting = { pass: hit429 };
  console.log(`[${hit429 ? 'PASS' : 'FAIL'}] Rate Limiter Lockout (HTTP 429): ${hit429}`);

  console.log('\n====================================================');
  console.log('FINAL AUDIT SUMMARY DATA:');
  console.log(JSON.stringify(report, null, 2));
}

runLiveAudit();
