import fs from 'fs';

const content = fs.readFileSync('.env.local', 'utf-8');
const env = {};
for (const line of content.split('\n')) {
  const parts = line.trim().split('=');
  if (parts.length >= 2) {
    const k = parts[0].trim();
    const v = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
    env[k] = v;
  }
}

const url = env.SUPABASE_URL || 'https://zqemrmzijlaysvfxygst.supabase.co';
const key = env.SUPABASE_SERVICE_ROLE_KEY;

async function testCounts() {
  const res = await fetch(`${url}/rest/v1/leads?select=id`, {
    method: 'HEAD',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: 'count=exact'
    }
  });
  console.log('Status:', res.status);
  console.log('Content-Range:', res.headers.get('content-range'));

  const ledgerRes = await fetch(`${url}/rest/v1/inquiry_idempotency_ledger?select=idempotency_key,status,inquiry_id,quote_id,created_at&order=created_at.desc&limit=5`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`
    }
  });
  const ledgerData = await ledgerRes.json();
  console.log('Recent Ledger Entries:', JSON.stringify(ledgerData, null, 2));

  const quoteRes = await fetch(`${url}/rest/v1/quotations?select=id`, {
    method: 'HEAD',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: 'count=exact'
    }
  });
  console.log('Quotations Content-Range:', quoteRes.headers.get('content-range'));
}

testCounts().catch(console.error);
