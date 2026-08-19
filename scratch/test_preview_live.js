// ============================================================
// AVANI AGRO FOODS — Preview Live Validation Test Suite
// Executes against live Vercel Preview URL
// ============================================================

const PREVIEW_URL = 'https://avani-agro-foods-latur-2026-oesd1mt0v.vercel.app';

async function runTests() {
  console.log(`Starting Live Preview Tests against: ${PREVIEW_URL}`);
  const results = [];

  // ── TEST GROUP 1: PUBLIC ROUTES ──────────────────────────────
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
    '/affiliate-login',
    '/robots.txt',
    '/sitemap.xml',
  ];

  console.log('\n--- 1. Public Routes HTTP Verification ---');
  for (const route of publicRoutes) {
    try {
      const res = await fetch(`${PREVIEW_URL}${route}`);
      const status = res.status;
      const ok = status === 200;
      results.push({ test: `Route ${route}`, status, pass: ok });
      console.log(`[${ok ? 'PASS' : 'FAIL'}] ${route} -> HTTP ${status}`);
    } catch (err) {
      results.push({ test: `Route ${route}`, error: err.message, pass: false });
      console.error(`[ERROR] ${route} -> ${err.message}`);
    }
  }

  // ── TEST GROUP 2: API AUTHENTICATION TESTS ───────────────────
  console.log('\n--- 2. API Authentication Tests ---');

  // Test A: Wrong Password
  try {
    const res = await fetch(`${PREVIEW_URL}/api/affiliate-auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'wrong_password_test_123' })
    });
    const data = await res.json();
    const ok = res.status === 401 && data.error && typeof data.remainingAttempts === 'number';
    results.push({ test: 'API Wrong Password', status: res.status, pass: ok, data });
    console.log(`[${ok ? 'PASS' : 'FAIL'}] Wrong Password -> HTTP ${res.status} (Remaining: ${data.remainingAttempts})`);
  } catch (err) {
    console.error('API Test Failed:', err);
  }

  // Test B: Rate Limiting (5 Attempts)
  console.log('\n--- 3. Rate Limiting Test (5 failed attempts) ---');
  let rateLimitHit = false;
  for (let i = 1; i <= 6; i++) {
    const res = await fetch(`${PREVIEW_URL}/api/affiliate-auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: `wrong_attempt_${i}` })
    });
    console.log(`Attempt ${i} -> HTTP ${res.status}`);
    if (res.status === 429) {
      rateLimitHit = true;
    }
  }
  results.push({ test: 'Rate Limit 429 on 6th Attempt', pass: rateLimitHit });
  console.log(`[${rateLimitHit ? 'PASS' : 'FAIL'}] Rate Limiting 429 Status Verified`);

  // Test C: Edge Middleware Redirection
  console.log('\n--- 4. Edge Middleware Protection on /affiliate ---');
  try {
    const res = await fetch(`${PREVIEW_URL}/affiliate`, {
      redirect: 'manual'
    });
    const status = res.status;
    const location = res.headers.get('location') || '';
    const ok = status === 307 && location.includes('/affiliate-login');
    results.push({ test: 'Edge Middleware Redirect', status, pass: ok, location });
    console.log(`[${ok ? 'PASS' : 'FAIL'}] Unauthenticated /affiliate -> HTTP ${status}, Location: ${location}`);
  } catch (err) {
    console.error('Edge Middleware Test Failed:', err);
  }

  console.log('\n--- Summary ---');
  console.log(JSON.stringify(results, null, 2));
}

runTests();
