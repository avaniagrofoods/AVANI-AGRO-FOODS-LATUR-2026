// ============================================================
// AVANI AGRO FOODS — Live Authentication & Session Security Suite
// Target: https://www.avaniagrofoods.com
// ============================================================

const BASE_URL = 'https://www.avaniagrofoods.com';

// Use the password from environment or test argument securely
const TEST_PASS = process.env.TEST_AFFILIATE_PASS || 'Samarth@1176';

async function testAuthSecurity() {
  console.log('====================================================');
  console.log('LIVE AUTHENTICATION & REPLAY VALIDATION');
  console.log('====================================================\n');

  let sessionCookie = null;

  // 1. Correct Password Login
  console.log('--- 1. Testing Login with Configured Password ---');
  try {
    const res = await fetch(`${BASE_URL}/api/affiliate-auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: TEST_PASS })
    });
    const data = await res.json();
    const rawCookie = res.headers.get('set-cookie') || '';
    
    console.log(`Login Response Status: HTTP ${res.status}`);
    console.log(`Session Type: ${data.sessionType || 'standard'}`);
    
    const hasHttpOnly = rawCookie.toLowerCase().includes('httponly');
    const hasSecure = rawCookie.toLowerCase().includes('secure');
    const hasSameSite = rawCookie.toLowerCase().includes('samesite=strict');
    const hasPath = rawCookie.toLowerCase().includes('path=/');

    console.log(`[${res.status === 200 ? 'PASS' : 'FAIL'}] Login HTTP Status 200: ${res.status === 200}`);
    console.log(`[${hasHttpOnly ? 'PASS' : 'FAIL'}] Cookie HttpOnly: ${hasHttpOnly}`);
    console.log(`[${hasSecure ? 'PASS' : 'FAIL'}] Cookie Secure: ${hasSecure}`);
    console.log(`[${hasSameSite ? 'PASS' : 'FAIL'}] Cookie SameSite=Strict: ${hasSameSite}`);
    console.log(`[${hasPath ? 'PASS' : 'FAIL'}] Cookie Path=/: ${hasPath}`);

    // Extract cookie value for replay test
    const match = rawCookie.match(/affiliate_session=([^;]+)/);
    if (match) {
      sessionCookie = match[0];
    }
  } catch (err) {
    console.error('Login error:', err);
  }

  if (!sessionCookie) {
    console.log('Cannot proceed with replay tests without session cookie.');
    return;
  }

  // 2. Test Protected Route Access with Cookie (Browser A / First Client)
  console.log('\n--- 2. Accessing Protected Route with Valid Cookie ---');
  try {
    const res = await fetch(`${BASE_URL}/affiliate`, {
      headers: { 'Cookie': sessionCookie },
      redirect: 'manual'
    });
    console.log(`[${res.status === 200 ? 'PASS' : 'INFO'}] Protected Route Response: HTTP ${res.status}`);
  } catch (err) {
    console.error('Protected route test error:', err);
  }

  // 3. Test Copied Cookie on Simulated Browser B
  console.log('\n--- 3. Replay Test: Sending Copied Cookie from Browser B ---');
  try {
    const res = await fetch(`${BASE_URL}/affiliate`, {
      headers: {
        'Cookie': sessionCookie,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) BrowserB_TestClient'
      },
      redirect: 'manual'
    });
    console.log(`Browser B Access Before Logout: HTTP ${res.status}`);
  } catch (err) {
    console.error('Browser B replay test error:', err);
  }

  // 4. Logout from Browser A
  console.log('\n--- 4. Executing Logout from Browser A ---');
  try {
    const res = await fetch(`${BASE_URL}/api/affiliate-auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie
      },
      body: JSON.stringify({ action: 'logout' })
    });
    const data = await res.json();
    const logoutCookie = res.headers.get('set-cookie') || '';
    const isCleared = logoutCookie.includes('Max-Age=0') || logoutCookie.includes('expires=');
    
    console.log(`[${res.status === 200 ? 'PASS' : 'FAIL'}] Logout HTTP Status 200: ${res.status === 200}`);
    console.log(`[${isCleared ? 'PASS' : 'FAIL'}] Set-Cookie Clears Session (Max-Age=0): ${isCleared}`);
    console.log(`Revocation Status in API response: ${data.revoked ? 'Server-Side Revoked' : 'Client Cookie Cleared'}`);
  } catch (err) {
    console.error('Logout test error:', err);
  }

  // 5. Test Copied Cookie from Browser B After Logout
  console.log('\n--- 5. Replay Test: Sending Copied Cookie from Browser B After Logout ---');
  try {
    const res = await fetch(`${BASE_URL}/affiliate`, {
      headers: {
        'Cookie': sessionCookie,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) BrowserB_TestClient'
      },
      redirect: 'manual'
    });
    console.log(`Browser B Access After Logout: HTTP ${res.status}`);
    console.log(`Security Model Note: In stateless HMAC mode (without KV), the cryptographic signature on copied tokens remains valid until 7-day TTL expiry, while client cookies are deleted. With KV configured, server-side revocation invalidates copied tokens immediately.`);
  } catch (err) {
    console.error('Browser B post-logout replay error:', err);
  }

  console.log('\n====================================================');
  console.log('AUTHENTICATION & REPLAY TEST COMPLETE');
  console.log('====================================================');
}

testAuthSecurity();
