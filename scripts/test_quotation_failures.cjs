// ============================================================
// AVANI AGRO FOODS — PHASE 7 FAILURE & RESILIENCE TEST SUITE
// Tests all negative, failure, and security edge cases
// ============================================================

const fs = require('fs');

async function runFailureTests() {
  console.log('====================================================');
  console.log('AVANI AGRO FOODS — FAILURE & RESILIENCE TEST SUITE');
  console.log('====================================================\n');

  const { calculateQuotation } = await import('../api/_lib/quotationEngine.js');

  const failureResults = [];

  // Scenario 1: Empty input
  try {
    const q = calculateQuotation({});
    failureResults.push({ test: 'Empty Input Defaulting', status: 'PASS', details: `Handled safely, created default quote ${q.quoteId}` });
  } catch (e) {
    failureResults.push({ test: 'Empty Input Defaulting', status: 'FAIL', details: e.message });
  }

  // Scenario 2: Zero or negative quantity
  try {
    const q = calculateQuotation({ quantity: -50 });
    const ok = q.items[0].quantity >= 1;
    failureResults.push({ test: 'Negative Quantity Clamping', status: ok ? 'PASS' : 'FAIL', details: `Clamped to ${q.items[0].quantity}` });
  } catch (e) {
    failureResults.push({ test: 'Negative Quantity Clamping', status: 'FAIL', details: e.message });
  }

  // Scenario 3: Unknown product fallback
  try {
    const q = calculateQuotation({ product: 'NonExistentProduct123' });
    const ok = q.items[0].name.includes('Moringa');
    failureResults.push({ test: 'Unknown Product Fallback', status: ok ? 'PASS' : 'FAIL', details: `Fallback to ${q.items[0].name}` });
  } catch (e) {
    failureResults.push({ test: 'Unknown Product Fallback', status: 'FAIL', details: e.message });
  }

  // Scenario 4: Stripe Disabled Check
  const linksContent = fs.readFileSync('src/data/links.js', 'utf8');
  const stripeCheck = linksContent.includes('STRIPE_ENABLED = false') && !linksContent.includes('buy.stripe.com/test_');
  failureResults.push({ test: 'Stripe Disabled in links.js', status: stripeCheck ? 'PASS' : 'FAIL', details: 'Zero active Stripe payment links' });

  // Scenario 5: Secret Token Leak Check
  const hasSecret = linksContent.includes('sk_live_') || linksContent.includes('sk_test_') || linksContent.includes('whsec_');
  failureResults.push({ test: 'Frontend Secret Leak Scan', status: !hasSecret ? 'PASS' : 'FAIL', details: 'No secret tokens found' });

  console.table(failureResults);
}

runFailureTests().catch(console.error);
