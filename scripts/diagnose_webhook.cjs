const fs = require('fs');

if (fs.existsSync('.env.local')) {
  for (const l of fs.readFileSync('.env.local', 'utf8').split('\n')) {
    const idx = l.indexOf('=');
    if (idx !== -1) {
      const k = l.substring(0, idx).trim();
      let v = l.substring(idx + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (!process.env[k]) process.env[k] = v;
    }
  }
}

const url = process.env.GOOGLE_SHEETS_WEBHOOK;
const secret = process.env.CRM_WEBHOOK_SECRET;

async function run() {
  console.log('1. Testing Missing Secret:');
  const r1 = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'TEST' }),
    signal: AbortSignal.timeout(15000)
  });
  console.log('Status 1:', r1.status);
  const t1 = await r1.text();
  console.log('Text 1:', t1.slice(0, 300));

  console.log('\n2. Testing Wrong Secret:');
  const r2 = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ webhookSecret: 'bad_token_123', type: 'TEST' }),
    signal: AbortSignal.timeout(15000)
  });
  console.log('Status 2:', r2.status);
  const t2 = await r2.text();
  console.log('Text 2:', t2.slice(0, 300));

  if (secret) {
    console.log('\n3. Testing Valid Authorized Ping:');
    const r3 = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        webhookSecret: secret,
        targetSheet: 'Customer Inquiries',
        type: 'TEST_PING',
        inquiryId: 'AAF-PING-TEST',
        buyerName: 'Security Ping Test',
        product: 'Moringa Leaf Powder'
      }),
      signal: AbortSignal.timeout(15000)
    });
    console.log('Status 3:', r3.status);
    const t3 = await r3.text();
    console.log('Text 3:', t3.slice(0, 300));
  }
}

run().catch(console.error);
