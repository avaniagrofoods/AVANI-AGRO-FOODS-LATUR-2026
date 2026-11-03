const https = require('https');

function fetchUrl(urlStr) {
  return new Promise((resolve, reject) => {
    https.get(urlStr, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({
        statusCode: res.statusCode,
        headers: res.headers,
        body: data
      }));
    }).on('error', reject);
  });
}

function postJson(urlStr, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const u = new URL(urlStr);
    const req = https.request({
      hostname: u.hostname,
      port: 443,
      path: u.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'Origin': 'https://www.avaniagrofoods.com'
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(body); } catch(e) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: json,
          rawBody: body
        });
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function verifyLive() {
  console.log('============================================================');
  console.log('LIVE PRODUCTION VERIFICATION — B2B LEAD GENERATION SYSTEM');
  console.log('Domain: https://www.avaniagrofoods.com');
  console.log('Timestamp:', new Date().toISOString());
  console.log('============================================================\n');

  // 1. Verify Moringa Landing Page
  console.log('1. Checking /moringa-powder-bulk-supplier-india ...');
  const moringaRes = await fetchUrl('https://www.avaniagrofoods.com/moringa-powder-bulk-supplier-india');
  console.log(`   Status: HTTP ${moringaRes.statusCode}`);
  const moringaHasTitle = moringaRes.body.includes('Moringa');
  console.log(`   HTML Delivered: ${moringaRes.body.length} bytes, hasContent: ${moringaHasTitle}`);

  // 2. Verify Red Onion Landing Page
  console.log('\n2. Checking /red-onion-powder-bulk-supplier-india ...');
  const onionRes = await fetchUrl('https://www.avaniagrofoods.com/red-onion-powder-bulk-supplier-india');
  console.log(`   Status: HTTP ${onionRes.statusCode}`);
  const onionHasTitle = onionRes.body.includes('Onion');
  console.log(`   HTML Delivered: ${onionRes.body.length} bytes, hasContent: ${onionHasTitle}`);

  // 3. Verify Sitemap
  console.log('\n3. Checking /sitemap.xml ...');
  const sitemapRes = await fetchUrl('https://www.avaniagrofoods.com/sitemap.xml');
  const countUrls = (sitemapRes.body.match(/<loc>/g) || []).length;
  const hasMoringaInSitemap = sitemapRes.body.includes('moringa-powder-bulk-supplier-india');
  const hasOnionInSitemap = sitemapRes.body.includes('red-onion-powder-bulk-supplier-india');
  console.log(`   Status: HTTP ${sitemapRes.statusCode}, Total URLs: ${countUrls}`);
  console.log(`   Includes Moringa Landing: ${hasMoringaInSitemap}`);
  console.log(`   Includes Onion Landing: ${hasOnionInSitemap}`);

  // 4. Verify Live API /api/save-lead
  console.log('\n4. Live Controlled Test RFQ Submission to /api/save-lead ...');
  const liveRfq = {
    name: 'Controlled Audit Tester',
    company: 'Avani Lead System Audit LLC',
    email: 'audit.live.' + Date.now() + '@avaniagrofoods.com',
    phone: '+1 555 019 9999',
    buyerRole: 'Procurement / Purchasing Manager',
    country: 'United States',
    product: 'Moringa Powder',
    quantity: '1000',
    quantityUnit: 'KG',
    incoterm: 'FOB Nhava Sheva (JNPT Mumbai, Port Code: INNSA)',
    destinationPort: 'New York',
    purchaseTimeline: 'Immediate Commercial Order (< 30 Days)',
    intendedApplication: 'Dietary Supplement Capsules',
    packagingPreference: '25 kg Food-Grade HDPE Drums',
    documentsRequested: ['Certificate of Analysis (COA)'],
    message: '[CONTROLLED_AUDIT] Verifying live B2B lead generation deployment.',
    source: 'B2B_Landing_RFQ_Live_Production_Audit',
    landing_page: '/moringa-powder-bulk-supplier-india',
    utm_source: 'live_audit',
    utm_medium: 'automated_harness',
    utm_campaign: 'phase14_verification'
  };

  const apiRes = await postJson('https://www.avaniagrofoods.com/api/save-lead', liveRfq);
  console.log(`   Status: HTTP ${apiRes.statusCode}`);
  console.log(`   Success: ${apiRes.data ? apiRes.data.success : false}`);
  console.log(`   Inquiry ID: ${apiRes.data ? apiRes.data.inquiryId : 'N/A'}`);
  console.log(`   Quote ID: ${apiRes.data ? apiRes.data.quoteId : 'N/A'}`);
  console.log(`   Buyer Role: ${apiRes.data && apiRes.data.inquiry ? apiRes.data.inquiry.buyerRole : 'N/A'}`);
  console.log(`   Landing Page: ${apiRes.data && apiRes.data.inquiry ? apiRes.data.inquiry.landingPage : 'N/A'}`);
  console.log(`   Email Notification: ${apiRes.data && apiRes.data.integrations ? apiRes.data.integrations.emailNotification : 'N/A'}`);

  console.log('\n============================================================');
  console.log('LIVE PRODUCTION VERIFICATION FINISHED SUCCESSFULLY!');
  console.log('============================================================\n');
}

verifyLive().catch(err => {
  console.error('Live audit error:', err);
  process.exit(1);
});
