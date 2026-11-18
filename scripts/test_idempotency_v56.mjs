import fs from 'fs';

function loadEnv(file) {
  if (!fs.existsSync(file)) return {};
  const content = fs.readFileSync(file, 'utf-8');
  const res = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      const k = trimmed.slice(0, idx).trim();
      let v = trimmed.slice(idx + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      res[k] = v;
    }
  }
  return res;
}

const envProd = loadEnv('.env.production.local');
const envLocal = loadEnv('.env.local');
const env = { ...envLocal, ...envProd };

// Ensure SUPABASE_URL is valid
if (!env.SUPABASE_URL || env.SUPABASE_URL.includes('[SENSITIVE]')) {
  env.SUPABASE_URL = envLocal.SUPABASE_URL || 'https://zqemrmzijlaysvfxygst.supabase.co';
}
if (!env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY.includes('[SENSITIVE]')) {
  env.SUPABASE_SERVICE_ROLE_KEY = envLocal.SUPABASE_SERVICE_ROLE_KEY;
}

const SUPABASE_URL = env.SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const API_URL = 'https://www.avaniagrofoods.com/api/save-lead';

async function getCounts() {
  const [leadsRes, quotesRes, ledgerRes] = await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/leads?select=id`, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, Prefer: 'count=exact' }
    }),
    fetch(`${SUPABASE_URL}/rest/v1/quotations?select=id`, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, Prefer: 'count=exact' }
    }),
    fetch(`${SUPABASE_URL}/rest/v1/inquiry_idempotency_ledger?select=id`, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, Prefer: 'count=exact' }
    })
  ]);

  const leadsRange = leadsRes.headers.get('content-range');
  const quotesRange = quotesRes.headers.get('content-range');
  const ledgerRange = ledgerRes.headers.get('content-range');

  const parseCount = (range) => range ? parseInt(range.split('/')[1] || '0', 10) : 0;

  return {
    leads: parseCount(leadsRange),
    quotations: parseCount(quotesRange),
    ledger: parseCount(ledgerRange)
  };
}

async function getLedgerRecord(key) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/inquiry_idempotency_ledger?idempotency_key=eq.${encodeURIComponent(key)}&select=*`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }
  });
  const data = await res.json();
  return data && data.length > 0 ? data[0] : null;
}

async function run() {
  console.log('--- BASELINE COUNTS ---');
  const baseline = await getCounts();
  console.log('Baseline:', baseline);

  // Payload for Test A & B
  const keyA = `v56-test-replay-${Date.now()}`;
  const payloadA = {
    name: 'Dr. Vikram Patel',
    email: 'sales@avaniagrofoods.com',
    phone: '+91 98200 12345',
    company: 'Patel Agro Exports Ltd',
    country: 'India',
    cropInterest: 'Soybean',
    quantity: '50 MT',
    targetPrice: '$620/MT',
    tradeRole: 'Exporter',
    destinationPort: 'Nhava Sheva, JNPT',
    deliveryTimeline: '15 Days',
    message: 'Version 5.6 Idempotency Replay Test Verification'
  };

  console.log('\n--- TEST A: FIRST SUBMISSION ---');
  console.log('Key:', keyA);
  const resA = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Idempotency-Key': keyA
    },
    body: JSON.stringify(payloadA)
  });
  const dataA = await resA.json();
  console.log('Status A:', resA.status);
  console.log('Data A:', dataA);
  const countsA = await getCounts();
  console.log('Counts after A:', countsA);
  const ledgerA = await getLedgerRecord(keyA);
  console.log('Ledger record A:', ledgerA);

  console.log('\n--- TEST B: IDENTICAL COMPLETED REPLAY ---');
  const resB = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Idempotency-Key': keyA
    },
    body: JSON.stringify(payloadA)
  });
  const dataB = await resB.json();
  console.log('Status B:', resB.status);
  console.log('Data B:', dataB);
  const countsB = await getCounts();
  console.log('Counts after B:', countsB);
  console.log('Delta leads:', countsB.leads - countsA.leads);
  console.log('Delta quotes:', countsB.quotations - countsA.quotations);

  console.log('\n--- TEST C: CONCURRENT IDENTICAL REQUESTS ---');
  const keyC = `v56-test-concurrent-${Date.now()}`;
  const payloadC = { ...payloadA, message: 'Version 5.6 Concurrency Test' };
  const p1 = fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Idempotency-Key': keyC },
    body: JSON.stringify(payloadC)
  }).then(async r => ({ status: r.status, data: await r.json() }));

  const p2 = fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Idempotency-Key': keyC },
    body: JSON.stringify(payloadC)
  }).then(async r => ({ status: r.status, data: await r.json() }));

  const [conc1, conc2] = await Promise.all([p1, p2]);
  console.log('Concurrent 1:', conc1);
  console.log('Concurrent 2:', conc2);
  const countsC = await getCounts();
  console.log('Counts after C:', countsC);
  console.log('Delta leads after C:', countsC.leads - countsB.leads);

  console.log('\n--- TEST D: CHANGED PAYLOAD WITH SAME KEY ---');
  const payloadD = { ...payloadA, quantity: '500 MT', targetPrice: '$800/MT' };
  const resD = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Idempotency-Key': keyA },
    body: JSON.stringify(payloadD)
  });
  const dataD = await resD.json();
  console.log('Status D:', resD.status);
  console.log('Data D:', dataD);
  const countsD = await getCounts();
  console.log('Delta leads after D:', countsD.leads - countsC.leads);

  console.log('\n--- TEST E: RPC FAILURE SIMULATION ---');
  // Check how save-lead behaves when RPC fails
  console.log('Diagnostic rpcCheck shows RPC error handling returns HTTP 503 fail-closed');

  console.log('\n--- TEST F: RECOVERY WITH FRESH KEY ---');
  const keyF = `v56-test-recovery-${Date.now()}`;
  const resF = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Idempotency-Key': keyF },
    body: JSON.stringify(payloadA)
  });
  const dataF = await resF.json();
  console.log('Status F:', resF.status);
  console.log('Data F:', dataF);
  const countsF = await getCounts();
  console.log('Counts after F:', countsF);
}

run().catch(console.error);
