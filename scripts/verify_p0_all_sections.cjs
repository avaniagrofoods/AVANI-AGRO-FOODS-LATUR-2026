// ============================================================
// AVANI AGRO FOODS — P0 PRODUCTION VERIFICATION RUNNER
// Comprehensive automated execution of P0.4 - P0.15
// ============================================================

const https = require('https');
const http = require('http');
const fs = require('fs');

// Load environment variables safely
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

async function request(urlStr, options = {}) {
  const urlObj = new URL(urlStr);
  const client = urlObj.protocol === 'https:' ? https : http;
  
  return new Promise((resolve, reject) => {
    const req = client.request(urlStr, {
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: options.timeout || 35000,
    }, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          buffer,
          text: buffer.toString('utf-8')
        });
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });
    req.on('error', reject);

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function main() {
  const report = {
    timestamp: new Date().toISOString(),
    results: {}
  };

  console.log('============================================================');
  console.log('AVANI AGRO FOODS — EXECUTING P0 AUTOMATED VERIFICATIONS');
  console.log('============================================================\n');

  // ------------------------------------------------------------
  // P0.4: CUSTOM DOMAIN VERIFICATION
  // ------------------------------------------------------------
  console.log('>>> [P0.4] Custom Domain Verification (https://www.avaniagrofoods.com/)');
  
  // 1. Node fetch / standard GET
  const getRes = await request('https://www.avaniagrofoods.com/', {
    headers: { 'User-Agent': 'Node-Fetch-Acceptance/1.0' }
  });
  // 2. HEAD request
  const headRes = await request('https://www.avaniagrofoods.com/', {
    method: 'HEAD',
    headers: { 'User-Agent': 'Node-Fetch-Acceptance/1.0' }
  });
  // 3. Browser-like UA
  const browserUaRes = await request('https://www.avaniagrofoods.com/', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
    }
  });
  // 4. curl-like UA
  const curlRes = await request('https://www.avaniagrofoods.com/', {
    headers: { 'User-Agent': 'curl/8.4.0' }
  });

  const extractTitle = (html) => {
    const m = html.match(/<title>([^<]+)<\/title>/i);
    return m ? m[1].trim() : 'No title found';
  };

  report.results.p04_custom_domain = {
    get_status: getRes.statusCode,
    get_x_vercel_mitigated: getRes.headers['x-vercel-mitigated'] || 'absent',
    get_server: getRes.headers['server'] || 'unknown',
    get_title: extractTitle(getRes.text),
    head_status: headRes.statusCode,
    head_x_vercel_mitigated: headRes.headers['x-vercel-mitigated'] || 'absent',
    browser_ua_status: browserUaRes.statusCode,
    browser_ua_x_vercel_mitigated: browserUaRes.headers['x-vercel-mitigated'] || 'absent',
    curl_status: curlRes.statusCode,
    curl_x_vercel_mitigated: curlRes.headers['x-vercel-mitigated'] || 'absent'
  };

  console.log(`  GET status: ${getRes.statusCode} | x-vercel-mitigated: ${report.results.p04_custom_domain.get_x_vercel_mitigated}`);
  console.log(`  HEAD status: ${headRes.statusCode} | x-vercel-mitigated: ${report.results.p04_custom_domain.head_x_vercel_mitigated}`);
  console.log(`  Browser UA status: ${browserUaRes.statusCode} | x-vercel-mitigated: ${report.results.p04_custom_domain.browser_ua_x_vercel_mitigated}`);
  console.log(`  curl UA status: ${curlRes.statusCode} | x-vercel-mitigated: ${report.results.p04_custom_domain.curl_x_vercel_mitigated}`);
  console.log(`  Title: "${report.results.p04_custom_domain.get_title}"\n`);

  // ------------------------------------------------------------
  // P0.5: ROOT DOMAIN REDIRECT CHECK
  // ------------------------------------------------------------
  console.log('>>> [P0.5] Root Domain Redirect Check (https://avaniagrofoods.com)');
  const rootRes = await request('https://avaniagrofoods.com', {
    headers: { 'User-Agent': 'Node-Fetch-Acceptance/1.0' }
  });
  report.results.p05_root_domain = {
    statusCode: rootRes.statusCode,
    location: rootRes.headers['location'] || 'none'
  };
  console.log(`  Root status: ${rootRes.statusCode} | Location: ${report.results.p05_root_domain.location}\n`);

  // ------------------------------------------------------------
  // P0.6: PUBLIC ROUTES CHECK
  // ------------------------------------------------------------
  console.log('>>> [P0.6] Public Routes Check');
  const routes = [
    '/',
    '/about',
    '/products',
    '/catalog',
    '/catalog/moringa-powder',
    '/catalog/red-onion-powder',
    '/trade-coordination',
    '/export-process',
    '/export-compliance',
    '/resources',
    '/blog',
    '/contact',
    '/robots.txt',
    '/sitemap.xml'
  ];

  report.results.p06_public_routes = [];
  for (const r of routes) {
    const res = await request(`https://www.avaniagrofoods.com${r}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Node Acceptance Runner)' }
    });
    const item = {
      route: r,
      status: res.statusCode,
      contentType: res.headers['content-type'] || 'unknown',
      bytes: res.buffer.length,
      x_vercel_mitigated: res.headers['x-vercel-mitigated'] || 'absent'
    };
    report.results.p06_public_routes.push(item);
    console.log(`  Route: ${r.padEnd(28)} | HTTP ${res.statusCode} | ${item.contentType.split(';')[0]} | ${item.bytes} bytes | mitigated: ${item.x_vercel_mitigated}`);
  }
  console.log('');

  // ------------------------------------------------------------
  // P0.7: PROTECTED APIs (Unauthenticated)
  // ------------------------------------------------------------
  console.log('>>> [P0.7] Protected APIs Check (Unauthenticated - Expected 401)');
  const protectedApis = [
    '/api/admin-quotations',
    '/api/importers',
    '/api/manufacturers'
  ];
  report.results.p07_protected_apis = [];
  for (const api of protectedApis) {
    const res = await request(`https://www.avaniagrofoods.com${api}`, {
      headers: { 'User-Agent': 'Node Acceptance Runner' }
    });
    const item = {
      api,
      status: res.statusCode,
      pass: res.statusCode === 401
    };
    report.results.p07_protected_apis.push(item);
    console.log(`  API: ${api.padEnd(25)} | HTTP ${res.statusCode} | Expected 401 -> ${item.pass ? 'PASS' : 'FAIL'}`);
  }
  console.log('');

  // ------------------------------------------------------------
  // P0.8: SECURITY HEADERS
  // ------------------------------------------------------------
  console.log('>>> [P0.8] Security Headers Inspection');
  const headers = getRes.headers;
  report.results.p08_security_headers = {
    'strict-transport-security': headers['strict-transport-security'] || 'NOT SET',
    'x-content-type-options': headers['x-content-type-options'] || 'NOT SET',
    'x-frame-options': headers['x-frame-options'] || 'NOT SET',
    'referrer-policy': headers['referrer-policy'] || 'NOT SET',
    'content-security-policy': headers['content-security-policy'] || 'NOT SET',
    'permissions-policy': headers['permissions-policy'] || 'NOT SET'
  };
  for (const [k, v] of Object.entries(report.results.p08_security_headers)) {
    console.log(`  ${k.padEnd(28)}: ${v}`);
  }
  console.log('');

  // ------------------------------------------------------------
  // P0.9: STATIC ASSETS
  // ------------------------------------------------------------
  console.log('>>> [P0.9] Static Assets Verification');
  const assets = [
    '/logo.png',
    '/moringa.png',
    '/onion.png',
    '/sachin.png',
    '/blog/moringa-powder-thumbnail.webp'
  ];
  report.results.p09_static_assets = [];
  for (const a of assets) {
    const res = await request(`https://www.avaniagrofoods.com${a}`, {
      headers: { 'User-Agent': 'Node Acceptance Runner' }
    });
    const item = {
      asset: a,
      status: res.statusCode,
      contentType: res.headers['content-type'] || 'unknown',
      contentLength: res.headers['content-length'] || res.buffer.length,
      pass: res.statusCode === 200 && res.buffer.length > 500
    };
    report.results.p09_static_assets.push(item);
    console.log(`  Asset: ${a.padEnd(35)} | HTTP ${res.statusCode} | ${item.contentType} | ${item.contentLength} bytes -> ${item.pass ? 'PASS' : 'FAIL'}`);
  }
  console.log('');

  // ------------------------------------------------------------
  // P0.11: CRITICAL FORM TEST (Synthetic Safe Test)
  // ------------------------------------------------------------
  console.log('>>> [P0.11] Critical Form Test (/api/save-lead)');
  const testPayload = JSON.stringify({
    name: 'SYNTHETIC ACCEPTANCE VERIFIER',
    company: 'AVANI AGRO VERIFICATION LABS',
    email: 'verification@avaniagrofoods.com',
    phone: '+91 72190 53645',
    country: 'INDIA',
    product: 'Moringa Leaf Powder',
    quantity: '500',
    targetPrice: '450',
    currency: 'INR',
    incoterm: 'FOB Nhava Sheva (JNPT Mumbai)',
    destination: 'Mumbai Port',
    message: 'SAFE AUTOMATED VERIFICATION TEST — DO NOT PROCESS AS REAL ORDER',
    source: 'P0_Custom_Domain_Finalization_Suite'
  });

  const formRes = await request('https://www.avaniagrofoods.com/api/save-lead', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(testPayload),
      'User-Agent': 'Node Acceptance Runner'
    },
    body: testPayload
  });

  let formJson = null;
  try {
    formJson = JSON.parse(formRes.text);
  } catch (e) {
    formJson = { raw: formRes.text };
  }

  report.results.p011_critical_form = {
    statusCode: formRes.statusCode,
    success: formJson.success,
    inquiryId: formJson.inquiryId || null,
    quoteId: formJson.quoteId || null,
    googleSheets: formJson.integrations?.googleSheetsInquiry || formJson.integrations?.googleSheets || null,
    whatsapp: formJson.integrations?.whatsapp || null,
    pass: formRes.statusCode === 200 && formJson.success === true && !!formJson.inquiryId && !!formJson.quoteId
  };
  console.log(`  Status: ${formRes.statusCode} | Success: ${formJson.success} | Inquiry: ${formJson.inquiryId} | Quote: ${formJson.quoteId}`);
  console.log(`  Sheets Dispatch: ${report.results.p011_critical_form.googleSheets} | WhatsApp Dispatch: ${formJson.integrations?.whatsapp}`);
  console.log(`  Result: ${report.results.p011_critical_form.pass ? 'PASS' : 'FAIL'}\n`);

  // ------------------------------------------------------------
  // P0.12: GOOGLE APPS SCRIPT WEBHOOK SECURITY
  // ------------------------------------------------------------
  console.log('>>> [P0.12] Google Apps Script Webhook Security Check');
  const gasWebhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK || process.env.VITE_GOOGLE_SHEETS_WEBHOOK;
  if (!gasWebhookUrl) {
    console.log('  [WARN] GOOGLE_SHEETS_WEBHOOK not found in environment.');
    report.results.p012_gas_webhook = { status: 'SKIPPED_NO_ENV' };
  } else {
    // 1. Unauthorized / missing secret (Google Apps Script redirects to script.googleusercontent.com)
    let unauthRejected = false;
    let badSecretRejected = false;
    let validPingSuccess = false;

    try {
      const unauthGas = await fetch(gasWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'INQUIRY', inquiryId: 'UNAUTH-TEST' }),
        redirect: 'follow',
        signal: AbortSignal.timeout(30000)
      });
      const unauthText = await unauthGas.text();
      let unauthJson = null;
      try { unauthJson = JSON.parse(unauthText); } catch (e) {}
      unauthRejected = unauthGas.status === 401 || (unauthJson && unauthJson.success === false && unauthJson.error.includes('Unauthorized'));
    } catch (e) {
      console.log('  Unauth test warning:', e.message);
    }

    try {
      const badSecretGas = await fetch(gasWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookSecret: 'invalid_wrong_secret_123', type: 'INQUIRY' }),
        redirect: 'follow',
        signal: AbortSignal.timeout(30000)
      });
      const badSecretText = await badSecretGas.text();
      let badSecretJson = null;
      try { badSecretJson = JSON.parse(badSecretText); } catch (e) {}
      badSecretRejected = badSecretGas.status === 401 || (badSecretJson && badSecretJson.success === false && badSecretJson.error.includes('Unauthorized'));
    } catch (e) {
      console.log('  Bad secret test warning:', e.message);
    }

    // 3. Authorized verification using existing environment secret (never printed)
    if (process.env.CRM_WEBHOOK_SECRET) {
      try {
        const validGas = await fetch(gasWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            webhookSecret: process.env.CRM_WEBHOOK_SECRET,
            targetSheet: 'Customer Inquiries',
            type: 'CUSTOMER_INQUIRY',
            inquiryId: 'AAF-INQ-ACCEPTANCE-PING',
            buyerName: 'Security Acceptance Verification',
            company: 'Avani Verification Suite',
            email: 'audit@avaniagrofoods.com',
            product: 'Moringa Leaf Powder'
          }),
          redirect: 'follow',
          signal: AbortSignal.timeout(30000)
        });
        const validText = await validGas.text();
        let validJson = null;
        try { validJson = JSON.parse(validText); } catch (e) {}
        validPingSuccess = validGas.status === 200 && validJson && validJson.success === true;
      } catch (e) {
        console.log('  Valid ping warning:', e.message);
      }
    }

    report.results.p012_gas_webhook = {
      unauth_rejected: unauthRejected,
      bad_secret_rejected: badSecretRejected,
      authorized_ping_success: validPingSuccess,
      pass: unauthRejected && (process.env.CRM_WEBHOOK_SECRET ? validPingSuccess : true)
    };
    console.log(`  Missing Secret Rejected: ${unauthRejected ? 'YES (PASS)' : 'NO (FAIL)'}`);
    console.log(`  Bad Secret Rejected: ${badSecretRejected ? 'YES (PASS)' : 'NO (FAIL)'}`);
    console.log(`  Authorized Delivery: ${validPingSuccess ? 'YES (PASS)' : 'SKIPPED/UNVERIFIED'}`);
    console.log(`  Overall Apps Script Result: ${report.results.p012_gas_webhook.pass ? 'PASS' : 'FAIL'}`);
  }
  console.log('');

  // ------------------------------------------------------------
  // P0.13: WHATSAPP DEEP LINK
  // ------------------------------------------------------------
  console.log('>>> [P0.13] WhatsApp Deep Link Check');
  const waRes = await request('https://wa.me/917219053645', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  report.results.p013_whatsapp = {
    statusCode: waRes.statusCode,
    includesPhone: waRes.text.includes('917219053645') || waRes.text.includes('whatsapp://'),
    pass: waRes.statusCode === 200 || (waRes.statusCode >= 300 && waRes.statusCode < 400)
  };
  console.log(`  Status: ${waRes.statusCode} | Content verified: ${report.results.p013_whatsapp.includesPhone} -> ${report.results.p013_whatsapp.pass ? 'PASS' : 'FAIL'}\n`);

  // ------------------------------------------------------------
  // P0.14: SEO ENDPOINTS
  // ------------------------------------------------------------
  console.log('>>> [P0.14] SEO Endpoints (robots.txt, sitemap.xml)');
  const robotsRes = await request('https://www.avaniagrofoods.com/robots.txt');
  const sitemapRes = await request('https://www.avaniagrofoods.com/sitemap.xml');

  const robotsOk = robotsRes.statusCode === 200 && robotsRes.text.includes('User-agent') && robotsRes.text.includes('Disallow: /private');
  const sitemapOk = sitemapRes.statusCode === 200 && sitemapRes.text.includes('<urlset') && !sitemapRes.text.includes('/api/') && !sitemapRes.text.includes('/private');

  report.results.p014_seo = {
    robots_status: robotsRes.statusCode,
    robots_ok: robotsOk,
    sitemap_status: sitemapRes.statusCode,
    sitemap_ok: sitemapOk
  };
  console.log(`  robots.txt: HTTP ${robotsRes.statusCode} | Private disallow present: ${robotsOk ? 'PASS' : 'FAIL'}`);
  console.log(`  sitemap.xml: HTTP ${sitemapRes.statusCode} | Valid XML, private excluded: ${sitemapOk ? 'PASS' : 'FAIL'}\n`);

  // ------------------------------------------------------------
  // SAVE JSON REPORT
  // ------------------------------------------------------------
  fs.writeFileSync('scratch/p0_verification_report.json', JSON.stringify(report, null, 2));
  console.log('Saved verification results to scratch/p0_verification_report.json');
}

main().catch(err => {
  console.error('Fatal error running P0 verification:', err);
  process.exit(1);
});
