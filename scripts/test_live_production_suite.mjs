// scripts/test_live_production_suite.mjs
// Live End-to-End Acceptance Test against https://www.avaniagrofoods.com/api/save-lead

const LIVE_API_URL = 'https://www.avaniagrofoods.com/api/save-lead';

async function runLiveTests() {
  console.log('============================================================');
  console.log('AVANI AGRO FOODS — LIVE PRODUCTION ACCEPTANCE SUITE (V5.3)');
  console.log('Target API:', LIVE_API_URL);
  console.log('============================================================\n');

  const testKey = `LIVE-IDEM-KEY-${Date.now()}`;
  const basePayload = {
    name: 'SYNTHETIC_QA_VERIFICATION_BUYER',
    company: 'Synthetic Verification GmbH',
    email: 'synthetic-qa-acceptance@example-buyer.com',
    phone: '+49 30 99998888',
    country: 'Germany',
    product: 'Moringa Leaf Powder',
    quantity: '500',
    quantityUnit: 'KG',
    incoterm: 'FOB Nhava Sheva (JNPT Mumbai)',
    destinationPort: 'Hamburg, Germany',
    requirement: 'Controlled QA verification order. Please do not fulfill or contact.',
    source: 'B2B_Live_Acceptance_Verification'
  };

  // Test 1: Single Valid Submission
  console.log('--- TEST 1: Single Valid Controlled Submission ---');
  let res1, data1;
  try {
    const r = await fetch(LIVE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': testKey,
        'User-Agent': 'Live-Acceptance-Agent/1.0'
      },
      body: JSON.stringify(basePayload)
    });
    res1 = r.status;
    data1 = await r.json();
    console.log('Status:', res1);
    console.log('Success:', data1.success);
    console.log('Inquiry ID:', data1.inquiryId);
    console.log('Quote ID:', data1.quoteId);
    console.log('Persistence Status:', data1.persistenceStatus);
    console.log('Supabase Persistence:', data1.notificationDeliveryStatus?.supabasePersistence);
    console.log('Lead Persistence Label:', data1.notificationDeliveryStatus?.leadPersistence);
  } catch (err) {
    console.error('Test 1 Fetch Failed:', err.message);
  }

  // Test 2: Identical Duplicate Submission (Replay)
  console.log('\n--- TEST 2: Identical Duplicate Submission (Replay) ---');
  let res2, data2;
  try {
    const r = await fetch(LIVE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': testKey,
        'User-Agent': 'Live-Acceptance-Agent/1.0'
      },
      body: JSON.stringify(basePayload)
    });
    res2 = r.status;
    data2 = await r.json();
    console.log('Status:', res2);
    console.log('Success:', data2.success);
    console.log('Message:', data2.message);
    console.log('Returned Inquiry ID:', data2.inquiryId);
    console.log('Exact Match to Test 1 ID:', data2.inquiryId === data1?.inquiryId);
  } catch (err) {
    console.error('Test 2 Fetch Failed:', err.message);
  }

  // Test 3: Concurrent Duplicate Submissions
  console.log('\n--- TEST 3: Concurrent Duplicate Submissions ---');
  const concurrentKey = `LIVE-CONCUR-KEY-${Date.now()}`;
  try {
    const [c1, c2] = await Promise.all([
      fetch(LIVE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': concurrentKey,
          'User-Agent': 'Live-Acceptance-Agent/1.0'
        },
        body: JSON.stringify({ ...basePayload, email: 'concurrent-qa@example-buyer.com' })
      }),
      fetch(LIVE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': concurrentKey,
          'User-Agent': 'Live-Acceptance-Agent/1.0'
        },
        body: JSON.stringify({ ...basePayload, email: 'concurrent-qa@example-buyer.com' })
      })
    ]);

    const s1 = c1.status;
    const d1 = await c1.json();
    const s2 = c2.status;
    const d2 = await c2.json();

    console.log('Concurrent Request 1 Status:', s1, 'Inquiry ID:', d1.inquiryId, d1.code || d1.message);
    console.log('Concurrent Request 2 Status:', s2, 'Inquiry ID:', d2.inquiryId, d2.code || d2.message);
  } catch (err) {
    console.error('Test 3 Concurrent Fetch Failed:', err.message);
  }

  // Test 4: Rejection of Invalid Data and Safe Recovery
  console.log('\n--- TEST 4: Invalid Data Rejection & Immediate Safe Recovery ---');
  try {
    const invalidR = await fetch(LIVE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...basePayload, email: 'not-valid-email' })
    });
    const invStatus = invalidR.status;
    const invData = await invalidR.json();
    console.log('Invalid Email Status (Expected 400):', invStatus, invData);

    const recoveryKey = `LIVE-RECOVER-KEY-${Date.now()}`;
    const validRecoveryR = await fetch(LIVE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': recoveryKey
      },
      body: JSON.stringify({ ...basePayload, email: 'recovered-qa@example-buyer.com' })
    });
    const recStatus = validRecoveryR.status;
    const recData = await validRecoveryR.json();
    console.log('Recovery Request Status (Expected 200):', recStatus, 'Inquiry ID:', recData.inquiryId);
  } catch (err) {
    console.error('Test 4 Failed:', err.message);
  }
}

runLiveTests();
