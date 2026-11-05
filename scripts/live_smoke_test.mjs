import https from 'https';

const urls = [
  'https://www.avaniagrofoods.com/',
  'https://www.avaniagrofoods.com/products',
  'https://www.avaniagrofoods.com/moringa-powder-bulk-supplier-india',
  'https://www.avaniagrofoods.com/red-onion-powder-bulk-supplier-india',
  'https://www.avaniagrofoods.com/contact',
  'https://www.avaniagrofoods.com/blog',
  'https://www.avaniagrofoods.com/blog/what-is-moringa-powder-b2b-buyer-sourcing-guide-india',
  'https://www.avaniagrofoods.com/blog/what-is-red-onion-powder-complete-b2b-buyers-guide',
  'https://www.avaniagrofoods.com/sitemap.xml',
  'https://www.avaniagrofoods.com/robots.txt'
];

async function checkUrl(url) {
  return new Promise((resolve) => {
    const req = https.get(url, (res) => {
      resolve({ url, status: res.statusCode, headers: res.headers });
    });
    req.on('error', (err) => resolve({ url, status: 'ERROR', error: err.message }));
    req.setTimeout(10000, () => {
      req.abort();
      resolve({ url, status: 'TIMEOUT' });
    });
  });
}

async function run() {
  console.log('============================================================');
  console.log('AVANI AGRO FOODS — LIVE PRODUCTION HTTP SMOKE TEST');
  console.log('Target: https://www.avaniagrofoods.com');
  console.log('============================================================');

  let passCount = 0;
  for (const u of urls) {
    const res = await checkUrl(u);
    const ok = res.status === 200 || res.status === 304;
    if (ok) passCount++;
    console.log(`[HTTP ${res.status}] ${u} -> ${ok ? 'PASS' : 'FAIL'}`);
  }

  console.log('============================================================');
  console.log(`Summary: ${passCount}/${urls.length} URLs returned HTTP 200/304`);
  console.log(`Smoke Test Verdict: ${passCount === urls.length ? 'GREEN — PRODUCTION LIVE' : 'FAIL'}`);
  console.log('============================================================');
}

run();
