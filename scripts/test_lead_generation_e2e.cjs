// ============================================================
// AVANI AGRO FOODS — END-TO-END LEAD GENERATION SUITE
// Automated verification covering all 12 Phase Twelve Requirements:
// 1. Valid Moringa RFQ with full qualification fields
// 2. Valid Red Onion RFQ with full qualification fields
// 3. Combined product RFQ
// 4. Missing required name rejection
// 5. Missing / invalid email rejection
// 6. Anti-spam honeypot filtering
// 7. Deduplication detection (60s cache)
// 8. Origin security check
// 9. Attribution persistence & parsing
// 10. WhatsApp link generation with prefilled text
// 11. Sitemap XML coverage (50 URLs, landing pages priority 0.95)
// 12. 30-Article inventory integrity (0 broken slugs)
// ============================================================

const fs = require('fs');
const path = require('path');
const assert = require('assert');

let ipCounter = 1;

// Mock request / response factory for testing serverless API handler
function createMockReqRes({ method = 'POST', headers = {}, body = {}, ip = null } = {}) {
  const clientIp = ip || `10.0.1.${ipCounter++}`;
  const req = {
    method,
    headers: {
      origin: 'https://www.avaniagrofoods.com',
      'x-forwarded-for': clientIp,
      ...headers
    },
    body
  };

  let statusCode = 200;
  let responseData = null;
  const resHeaders = {};

  const res = {
    setHeader: (k, v) => { resHeaders[k] = v; return res; },
    status: (code) => { statusCode = code; return res; },
    json: (data) => { responseData = data; return res; },
    send: (data) => { responseData = data; return res; },
    getStatusCode: () => statusCode,
    getData: () => responseData,
    getHeaders: () => resHeaders
  };

  return { req, res };
}

async function runSuite() {
  console.log('========================================================================');
  console.log('AVANI AGRO FOODS — B2B LEAD GENERATION SYSTEM E2E TEST SUITE');
  console.log(`Execution Timestamp: ${new Date().toISOString()}`);
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;
  const testResults = [];

  function record(testName, success, details = '') {
    if (success) {
      passed++;
      console.log(`  [PASS] ${testName}`);
    } else {
      failed++;
      console.error(`  [FAIL] ${testName} - ${details}`);
    }
    testResults.push({ testName, success, details });
  }

  // Import handler dynamically (ESM)
  let saveLeadHandler;
  try {
    const saveLeadModule = await import('../api/save-lead.js');
    saveLeadHandler = saveLeadModule.default;
  } catch (err) {
    console.error('Failed to import api/save-lead.js:', err);
    process.exit(1);
  }

  // ── TEST 1: Valid Moringa RFQ Submission ──────────────────────────────
  try {
    const { req, res } = createMockReqRes({
      body: {
        name: 'John Miller',
        company: 'Global Botanicals Inc',
        email: 'jmiller@globalbotanicals.com',
        phone: '+1 312 555 0192',
        buyerRole: 'Procurement / Purchasing Manager',
        country: 'United States',
        product: 'Moringa Powder',
        quantity: '1000',
        quantityUnit: 'KG',
        incoterm: 'FOB Nhava Sheva (JNPT Mumbai, Port Code: INNSA)',
        destinationPort: 'Port of New York / New Jersey',
        purchaseTimeline: 'Immediate Commercial Order (< 30 Days)',
        intendedApplication: 'Dietary Supplement Capsules',
        packagingPreference: '25 kg Food-Grade HDPE Drums with Double Poly Liners',
        documentsRequested: ['Certificate of Analysis (COA)', 'Microbiological Assay', 'Heavy Metals Screening'],
        message: 'Require 80-100 mesh organic specification with batch NABL COA.',
        source: 'B2B_Landing_RFQ_Moringa_Landing_Page',
        landing_page: '/moringa-powder-bulk-supplier-india',
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'b2b-moringa-usa'
      }
    });

    await saveLeadHandler(req, res);
    const data = res.getData();

    const ok = res.getStatusCode() === 200 &&
      data.success === true &&
      data.inquiryId.startsWith('AAF-INQ-') &&
      data.quoteId.startsWith('AAF-Q-') &&
      data.inquiry.buyerRole === 'Procurement / Purchasing Manager' &&
      data.inquiry.quantityNormalizedKg === 1000 &&
      data.inquiry.landingPage === '/moringa-powder-bulk-supplier-india' &&
      data.inquiry.utmSource === 'google';

    record('1. Valid Moringa RFQ submission with full qualification & attribution', ok, ok ? '' : JSON.stringify(data));
  } catch (err) {
    record('1. Valid Moringa RFQ submission', false, err.message);
  }

  // ── TEST 2: Valid Red Onion RFQ Submission ────────────────────────────
  try {
    const { req, res } = createMockReqRes({
      body: {
        name: 'Sophie Dubois',
        company: 'EuroSeasoning SA',
        email: 'sdubois@euroseasoning.fr',
        phone: '+33 1 42 68 00 00',
        buyerRole: 'Food & Beverage Manufacturer',
        country: 'France',
        product: 'Dehydrated Red Onion Powder',
        quantity: '5000',
        quantityUnit: 'KG',
        incoterm: 'CIF Destination Seaport (Worldwide)',
        destinationPort: 'Port of Le Havre',
        purchaseTimeline: 'Next Quarter Procurement (30–60 Days)',
        intendedApplication: 'Snack Seasonings & Dry Soup Premixes',
        packagingPreference: '20 kg Corrugated Export Cartons with 4x5kg Vacuum Liners',
        documentsRequested: ['Certificate of Analysis (COA)', 'Microbiological Assay'],
        message: 'High pyruvic acid pungency required for potato chip topical dusting.',
        source: 'B2B_Landing_RFQ_Red_Onion_Landing_Page',
        landing_page: '/red-onion-powder-bulk-supplier-india',
        utm_source: 'linkedin',
        utm_medium: 'b2b',
        utm_campaign: 'onion-europe-2026'
      }
    });

    await saveLeadHandler(req, res);
    const data = res.getData();

    const ok = res.getStatusCode() === 200 &&
      data.success === true &&
      data.inquiryId.startsWith('AAF-INQ-') &&
      data.quoteId.startsWith('AAF-Q-') &&
      data.inquiry.product.toLowerCase().includes('onion') &&
      data.inquiry.quantityNormalizedKg === 5000 &&
      data.inquiry.destinationPort === 'Port of Le Havre';

    record('2. Valid Red Onion RFQ submission with industrial specifications', ok, ok ? '' : JSON.stringify(data));
  } catch (err) {
    record('2. Valid Red Onion RFQ submission', false, err.message);
  }

  // ── TEST 3: Combined Lot RFQ Submission ───────────────────────────────
  try {
    const { req, res } = createMockReqRes({
      body: {
        name: 'Tariq Al-Mansoor',
        company: 'Gulf Food Distribution Co LLC',
        email: 'tariq@gulffoodist.ae',
        phone: '+971 4 333 4455',
        buyerRole: 'Food Importer / Bulk Distributor',
        country: 'United Arab Emirates',
        product: 'Both Moringa and Red Onion Powder',
        quantity: '2000',
        quantityUnit: 'KG',
        incoterm: 'CIF Destination Seaport (Worldwide)',
        destinationPort: 'Port of Jebel Ali, Dubai',
        purchaseTimeline: 'Long-Term Annual / Monthly Supply Contract',
        message: 'Combined 20ft container trial lot (1 MT Moringa + 1 MT Red Onion).',
        source: 'B2B_Landing_Combined_Lot',
        landing_page: '/products'
      }
    });

    await saveLeadHandler(req, res);
    const data = res.getData();

    const ok = res.getStatusCode() === 200 &&
      data.success === true &&
      data.inquiryId.startsWith('AAF-INQ-') &&
      data.quoteId.startsWith('AAF-Q-');

    record('3. Combined Lot RFQ submission', ok, ok ? '' : JSON.stringify(data));
  } catch (err) {
    record('3. Combined Lot RFQ submission', false, err.message);
  }

  // ── TEST 4: Missing Required Name Rejection ───────────────────────────
  try {
    const { req, res } = createMockReqRes({
      body: {
        name: '',
        company: 'Acme Corp',
        email: 'test@acme.com',
        product: 'Moringa Powder',
        quantity: '500'
      }
    });

    await saveLeadHandler(req, res);
    const ok = res.getStatusCode() === 400 && res.getData().error.includes('name');
    record('4. Missing required name rejected with HTTP 400', ok, ok ? '' : `Status: ${res.getStatusCode()}`);
  } catch (err) {
    record('4. Missing required name rejected', false, err.message);
  }

  // ── TEST 5: Missing / Invalid Email Rejection ──────────────────────────
  try {
    const { req, res } = createMockReqRes({
      body: {
        name: 'Valid Name',
        company: 'Acme Corp',
        email: 'invalid-email-string',
        product: 'Moringa Powder',
        quantity: '500'
      }
    });

    await saveLeadHandler(req, res);
    const ok = res.getStatusCode() === 400 && res.getData().error.includes('email');
    record('5. Invalid email address rejected with HTTP 400', ok, ok ? '' : `Status: ${res.getStatusCode()}`);
  } catch (err) {
    record('5. Invalid email address rejected', false, err.message);
  }

  // ── TEST 6: Spam Honeypot Trap Filtering ──────────────────────────────
  try {
    const { req, res } = createMockReqRes({
      body: {
        name: 'Spam Bot',
        company: 'Spam Co',
        email: 'bot@spam.com',
        product: 'Moringa Powder',
        quantity: '500',
        honeypot_company_url: 'http://spam-link.ru' // bot filled this hidden field!
      }
    });

    await saveLeadHandler(req, res);
    const data = res.getData();
    const ok = res.getStatusCode() === 200 &&
      data.success === true &&
      data.inquiryId === 'AAF-INQ-TRAP-FILTERED';

    record('6. Anti-spam honeypot silent trap filtered', ok, ok ? '' : JSON.stringify(data));
  } catch (err) {
    record('6. Anti-spam honeypot silent trap', false, err.message);
  }

  // ── TEST 7: Deduplication Detection (60s Window) ──────────────────────
  try {
    const dedupBody = {
      name: 'Dedup Tester',
      company: 'Dedup Inc',
      email: 'dedup.test@example.com',
      product: 'Moringa Powder',
      quantity: '850'
    };

    // First submission
    const { req: req1, res: res1 } = createMockReqRes({ body: dedupBody });
    await saveLeadHandler(req1, res1);

    // Immediate second submission with identical email, product, quantity
    const { req: req2, res: res2 } = createMockReqRes({ body: dedupBody });
    await saveLeadHandler(req2, res2);

    const data2 = res2.getData();
    const ok = res2.getStatusCode() === 200 &&
      data2.message &&
      data2.message.includes('Duplicate');

    record('7. Deduplication detection within 60s window', ok, ok ? '' : JSON.stringify(data2));
  } catch (err) {
    record('7. Deduplication detection', false, err.message);
  }

  // ── TEST 8: Unauthorized Origin Security Check ────────────────────────
  try {
    const { req, res } = createMockReqRes({
      headers: {
        origin: 'https://malicious-phishing-site.xyz'
      },
      body: {
        name: 'Attacker',
        email: 'attacker@evil.com'
      }
    });

    await saveLeadHandler(req, res);
    const ok = res.getStatusCode() === 403 && res.getData().error.includes('Forbidden');
    record('8. Unauthorized origin rejected with HTTP 403', ok, ok ? '' : `Status: ${res.getStatusCode()}`);
  } catch (err) {
    record('8. Unauthorized origin rejected', false, err.message);
  }

  // ── TEST 9: Attribution Extraction & Persistence ──────────────────────
  try {
    const { req, res } = createMockReqRes({
      body: {
        name: 'Attribution Tester',
        company: 'Attribution Corp',
        email: `attr.${Date.now()}@example.com`,
        product: 'Moringa Powder',
        quantity: '300',
        landing_page: '/moringa-powder-bulk-supplier-india',
        referrer: 'https://www.google.com/',
        utm_source: 'linkedin',
        utm_medium: 'sponsored_content',
        utm_campaign: 'leadgen_q4',
        utm_content: 'banner_spec',
        utm_term: 'bulk_moringa_export'
      }
    });

    await saveLeadHandler(req, res);
    const data = res.getData();

    const ok = res.getStatusCode() === 200 &&
      data.inquiry.utmSource === 'linkedin' &&
      data.inquiry.utmMedium === 'sponsored_content' &&
      data.inquiry.utmCampaign === 'leadgen_q4' &&
      data.inquiry.utmContent === 'banner_spec' &&
      data.inquiry.utmTerm === 'bulk_moringa_export' &&
      data.inquiry.landingPage === '/moringa-powder-bulk-supplier-india' &&
      data.inquiry.referrer === 'https://www.google.com/';

    record('9. Full 7-parameter session attribution parsed & recorded', ok, ok ? '' : JSON.stringify(data.inquiry));
  } catch (err) {
    record('9. Attribution extraction & persistence', false, err.message);
  }

  // ── TEST 10: Context-Aware WhatsApp Link Generation ───────────────────
  try {
    const linksModule = await import('../src/data/links.js');
    const { getWhatsAppInquiryUrl } = linksModule;

    const url1 = getWhatsAppInquiryUrl('Moringa Powder', 'Moringa Landing Page', 'AAF-INQ-2026-999999');
    const ok1 = url1.includes('wa.me/917219053645') &&
      url1.includes('Moringa%20Powder') &&
      url1.includes('AAF-INQ-2026-999999');

    const url2 = getWhatsAppInquiryUrl('Dehydrated Red Onion Powder', 'Red Onion Landing Page');
    const ok2 = url2.includes('wa.me/917219053645') &&
      url2.includes('Dehydrated%20Red%20Onion%20Powder');

    const ok = ok1 && ok2;
    record('10. Context-aware prefilled WhatsApp URL generation', ok, ok ? '' : `URL: ${url1}`);
  } catch (err) {
    record('10. WhatsApp link generation', false, err.message);
  }

  // ── TEST 11: Sitemap XML Coverage (50 URLs & Landing Pages) ───────────
  try {
    const sitemapPath = path.resolve(__dirname, '../public/sitemap.xml');
    const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');

    const urlMatches = sitemapContent.match(/<loc>(.*?)<\/loc>/g) || [];
    const urlCount = urlMatches.length;

    const hasMoringaLanding = sitemapContent.includes('https://www.avaniagrofoods.com/moringa-powder-bulk-supplier-india');
    const hasOnionLanding = sitemapContent.includes('https://www.avaniagrofoods.com/red-onion-powder-bulk-supplier-india');

    const ok = urlCount === 50 && hasMoringaLanding && hasOnionLanding;
    record('11. Sitemap XML contains exactly 50 URLs including both new landing pages', ok, `Found ${urlCount} URLs, moringaLanding: ${hasMoringaLanding}, onionLanding: ${hasOnionLanding}`);
  } catch (err) {
    record('11. Sitemap XML verification', false, err.message);
  }

  // ── TEST 12: 30-Article Inventory Integrity Check ─────────────────────
  try {
    const blogsModule = await import('../src/data/blogs.js');
    const { BLOGS, getBlogBySlug } = blogsModule;

    const baselinePath = path.resolve(__dirname, '../docs/audits/lead-generation/BASELINE_30_ARTICLES_INVENTORY.json');
    const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
    const baselineArticles = Array.isArray(baseline) ? baseline : (baseline.articles || []);

    let allPreserved = true;
    let missingSlugs = [];

    for (const b of baselineArticles) {
      const match = getBlogBySlug(b.slug);
      if (!match) {
        allPreserved = false;
        missingSlugs.push(b.slug);
      }
    }

    const countOk = BLOGS.length === 30;
    const ok = countOk && allPreserved;

    record('12. All 30 baseline articles preserved with 0 broken slugs', ok, `Count: ${BLOGS.length}/30, Missing: ${missingSlugs.join(', ')}`);
  } catch (err) {
    record('12. 30-Article inventory integrity check', false, err.message);
  }

  // Summary
  console.log('\n========================================================================');
  console.log(`TEST SUITE SUMMARY: ${passed} PASSED / ${failed} FAILED (Total: ${passed + failed})`);
  console.log('========================================================================\n');

  // Save report to disk
  const reportPath = path.resolve(__dirname, '../docs/audits/lead-generation/E2E_LEAD_GENERATION_TEST_RESULTS.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    totalTests: passed + failed,
    passed,
    failed,
    status: failed === 0 ? 'ALL_PASSED' : 'TESTS_FAILED',
    results: testResults
  }, null, 2));

  if (failed > 0) {
    process.exit(1);
  }
}

runSuite().catch(err => {
  console.error('Fatal test suite exception:', err);
  process.exit(1);
});
