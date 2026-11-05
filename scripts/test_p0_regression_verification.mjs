// ============================================================
// AVANI AGRO FOODS — REGRESSION VERIFICATION RUNNER
// scripts/test_p0_regression_verification.mjs
// Verifies:
// 1. All 30 published articles remain intact with slugs, headings, and metadata
// 2. Both dedicated product landing pages load and have intact routes
// 3. Central quotation engine calculations (Moringa, Red Onion, quantity tiers, incoterms)
// 4. Client build integrity
// ============================================================

import fs from 'fs';
import path from 'path';
import { MORINGA_ARTICLES } from '../src/data/articles/moringaArticles.js';
import { ONION_ARTICLES } from '../src/data/articles/onionArticles.js';
import { calculateQuotation, parseQuantityKg } from '../api/_lib/quotationEngine.js';
import { matchProductMaster } from '../api/_lib/productMaster.js';

const results = [];

function check(testName, pass, details) {
  results.push({ testName, pass, details });
  const badge = pass ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m';
  console.log(`[${badge}] ${testName}`);
}

console.log('============================================================');
console.log('AVANI AGRO FOODS — P0 REGRESSION VERIFICATION SUITE');
console.log('============================================================\n');

// 1. Article Integrity (30 Articles)
const allArticles = [...MORINGA_ARTICLES, ...ONION_ARTICLES];
check('Total Articles Count (Must be 30)', allArticles.length === 30, { count: allArticles.length });

const missingSlugs = allArticles.filter(a => !a.slug);
check('All Articles Have Valid Slugs', missingSlugs.length === 0, { missingSlugs: missingSlugs.map(a => a.id) });

const missingContent = allArticles.filter(a => !a.content || a.content.length < 500);
check('All Articles Have Substantive Content (>500 chars)', missingContent.length === 0, { missing: missingContent.map(a => a.slug) });

const missingSeo = allArticles.filter(a => !a.seoTitle || !a.seoDesc);
check('All Articles Have SEO Title & Meta Description', missingSeo.length === 0, { missing: missingSeo.map(a => a.slug) });

// 2. Landing Pages Route & Component Integrity
const moringaLandingPath = path.resolve(process.cwd(), 'src/pages/MoringaLanding.jsx');
const onionLandingPath = path.resolve(process.cwd(), 'src/pages/RedOnionLanding.jsx');
const appJsxPath = path.resolve(process.cwd(), 'src/App.jsx');

check('Moringa Landing Page Component Exists', fs.existsSync(moringaLandingPath), { path: moringaLandingPath });
check('Red Onion Landing Page Component Exists', fs.existsSync(onionLandingPath), { path: onionLandingPath });

const appJsx = fs.readFileSync(appJsxPath, 'utf8');
const moringaRoutePresent = appJsx.includes('/moringa-powder-bulk-supplier-india');
const onionRoutePresent = appJsx.includes('/red-onion-powder-bulk-supplier-india');

check('Route /moringa-powder-bulk-supplier-india Configured in App.jsx', moringaRoutePresent, {});
check('Route /red-onion-powder-bulk-supplier-india Configured in App.jsx', onionRoutePresent, {});

// 3. Central Quotation Engine Commercial Calculations
const moringaQuote = calculateQuotation({
  quoteId: 'TEST-Q-MORINGA',
  inquiryId: 'TEST-INQ-M',
  date: '2026-11-05',
  validUntil: '2026-12-05',
  buyerName: 'Regression Tester',
  companyName: 'Test Corp',
  email: 'test@example.com',
  country: 'USA',
  destinationPort: 'Long Beach',
  incoterm: 'FOB NHAVA SHEVA',
  currency: 'USD',
  items: [{
    sr: 1,
    productId: 'AAF-MNG-001',
    name: 'Moringa Leaf Powder',
    description: 'Export Grade',
    hscode: '1211.90.29',
    quantity: 1000,
    unit: 'KG',
    rate: 4.80,
    total: 4800.00
  }],
  freight: 250,
  insurance: 50,
  documentation: 100
});

check('Quotation Engine: Subtotal Calculation', moringaQuote.subtotal === 4800, { subtotal: moringaQuote.subtotal });
check('Quotation Engine: Grand Total (Subtotal + Charges)', moringaQuote.grandTotal === 5200, { grandTotal: moringaQuote.grandTotal });
check('Quotation Engine: Currency Integrity', moringaQuote.currency === 'USD', { currency: moringaQuote.currency });

const onionQuote = calculateQuotation({
  quoteId: 'TEST-Q-ONION',
  inquiryId: 'TEST-INQ-O',
  date: '2026-11-05',
  validUntil: '2026-12-05',
  buyerName: 'Indian Buyer',
  companyName: 'Local Food Ltd',
  email: 'buyer@localfoods.in',
  country: 'India',
  destinationPort: 'Nhava Sheva',
  incoterm: 'EXW',
  currency: 'INR',
  items: [{
    sr: 1,
    productId: 'AAF-ONN-001',
    name: 'Dehydrated Red Onion Powder',
    description: 'Export Grade',
    hscode: '0712.20.00',
    quantity: 2000,
    unit: 'KG',
    rate: 180,
    total: 360000
  }],
  freight: 0,
  insurance: 0,
  documentation: 0
});

check('Quotation Engine: INR Domestic Currency Calculation', onionQuote.currency === 'INR' && onionQuote.grandTotal === 360000, {
  currency: onionQuote.currency,
  grandTotal: onionQuote.grandTotal
});

// 4. Quantity Normalizer & Product Master Integrity
const pmMoringa = matchProductMaster('Moringa Powder');
const pmOnion = matchProductMaster('Red Onion Powder');
check('Product Master: Moringa Match', pmMoringa.productId === 'moringa-leaf-powder' && (pmMoringa.hsCode === '12119029' || pmMoringa.hsCode === '1211.90.29'), { pmMoringa });
check('Product Master: Onion Match', pmOnion.productId === 'red-onion-powder' && (pmOnion.hsCode === '07122000' || pmOnion.hsCode === '0712.20.00'), { pmOnion });

const qty1 = parseQuantityKg('18 MT');
const qty2 = parseQuantityKg('500 kg');
check('Quantity Normalizer: 18 MT -> 18000 KG', qty1 === 18000, { qty1 });
check('Quantity Normalizer: 500 kg -> 500 KG', qty2 === 500, { qty2 });

// 5. Build Distribution Artifact Verification
const distHtml = path.resolve(process.cwd(), 'dist/index.html');
check('Vite Production Build Artifact Exists (dist/index.html)', fs.existsSync(distHtml), { distHtml });

const allPassed = results.every(r => r.pass);
console.log(`\n============================================================`);
console.log(`REGRESSION SUMMARY: ${results.filter(r => r.pass).length}/${results.length} PASSED`);
console.log(`Final Regression Verdict: ${allPassed ? 'GREEN' : 'RED'}`);
console.log(`============================================================\n`);
