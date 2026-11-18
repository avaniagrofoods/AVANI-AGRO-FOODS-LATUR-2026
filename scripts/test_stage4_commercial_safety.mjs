import assert from 'node:assert/strict';
import { calculateQuotation, computeDefaultValidUntil, DEFAULT_COMMERCIAL_TERMS } from '../src/data/quotationCore.js';
import { PRODUCT_MASTER } from '../src/data/productMaster.js';
import { COMPANY_DETAILS, STANDARD_PRODUCTS } from '../src/data/pricingConfig.js';
import { sendQuotationToBuyer } from '../api/_lib/quotationModel.js';

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  [FAIL] ${name}: ${err.message}`);
    failed++;
  }
}

console.log('=== STAGE 4 PROJECT A COMMERCIAL SAFETY VERIFICATION ===');

await test('S4-01: Dynamic 15-day validity replaces expired hardcoded 12 Oct 2026', () => {
  assert.strictEqual(computeDefaultValidUntil('2026-11-26', 15), '2026-12-11');
  const q = calculateQuotation({ date: '2026-11-26', product: 'Moringa Powder', quantity: 500 });
  assert.strictEqual(q.validUntil, '2026-12-11');
  assert.ok(!q.validUntil.includes('12 Oct 2026'));
  assert.ok(!DEFAULT_COMMERCIAL_TERMS[4].includes('12 Oct 2026'));
});

await test('S4-02: Unsupported default Organic claim & placeholder Udyam removed from pricingConfig', () => {
  assert.ok(!COMPANY_DETAILS.registration.udyam.includes('0000000'));
  const moringa = STANDARD_PRODUCTS['moringa-powder'];
  assert.ok(!moringa.name.toLowerCase().includes('organic'));
  assert.ok(!moringa.specs.toLowerCase().includes('organic'));
  assert.strictEqual(moringa.priceApprovalStatus, 'INDICATIVE_NOT_APPROVED');
});

await test('S4-03: Unsupported universal 60-75 day delivery promise removed from defaults', () => {
  const q = calculateQuotation({ product: 'Dehydrated Red Onion Powder', quantity: 500 });
  assert.ok(!q.deliveryTimeline.includes('60–75 days'));
  assert.ok(!DEFAULT_COMMERCIAL_TERMS[2].includes('60–75 days'));
});

await test('S4-04: All unapproved product prices in PRODUCT_MASTER & calculateQuotation marked INDICATIVE', () => {
  for (const p of PRODUCT_MASTER) {
    assert.strictEqual(p.priceApprovalStatus, 'INDICATIVE_NOT_APPROVED');
  }
  const q = calculateQuotation({ product: 'Dehydrated Red Onion Powder', quantity: 500 });
  assert.strictEqual(q.ownerPriceApproved, false);
  assert.strictEqual(q.priceApprovalStatus, 'INDICATIVE — NOT APPROVED FOR CUSTOMER QUOTATION');
});

await test('S4-05: sendQuotationToBuyer blocks indicative/unapproved quotation prices', async () => {
  const q = calculateQuotation({
    product: 'Moringa Leaf Powder',
    quantity: 500,
    email: 'buyer@example.com',
    status: 'READY_FOR_BUYER',
    ownerPriceApproved: false
  });
  let blockedCode = null;
  try {
    await sendQuotationToBuyer(q, { recipient: 'buyer@example.com' });
  } catch (err) {
    blockedCode = err.code;
  }
  assert.strictEqual(blockedCode, 'UNAPPROVED_COMMERCIAL_PRICE');
});

await test('S4-06: Missing ownerPriceApproved (undefined) fails closed in sendQuotationToBuyer', async () => {
  const legacyLikeQuote = {
    quoteId: 'AAF-Q-2026-LEGACY-01',
    status: 'READY_FOR_BUYER',
    buyer: { name: 'Legacy Test', email: 'buyer@example.com' },
    items: [{ name: 'Moringa Powder', quantity: 500, rate: 350, total: 175000 }]
  };
  let blockedCode = null;
  try {
    await sendQuotationToBuyer(legacyLikeQuote, { recipient: 'buyer@example.com' });
  } catch (err) {
    blockedCode = err.code;
  }
  assert.strictEqual(blockedCode, 'UNAPPROVED_COMMERCIAL_PRICE');
});

await test('S4-07: Dynamic validity handles month and year boundaries accurately', () => {
  assert.strictEqual(computeDefaultValidUntil('2026-12-25', 15), '2027-01-09');
  assert.strictEqual(computeDefaultValidUntil('2026-11-20', 15), '2026-12-05');
});

console.log(`\nSTAGE 4 COMMERCIAL SAFETY RESULTS: ${passed} PASSED | ${failed} FAILED`);
if (failed > 0) process.exit(1);
