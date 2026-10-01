// ============================================================
// DIAGNOSTIC: Custom Domain & Attack Mode Inspection
// ============================================================
const https = require('https');

function checkDomain(urlStr, userAgent = 'curl/8.4.0') {
  return new Promise((resolve) => {
    const url = new URL(urlStr);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => { if (body.length < 2000) body += chunk.toString(); });
      res.on('end', () => {
        resolve({
          url: urlStr,
          statusCode: res.statusCode,
          headers: res.headers,
          mitigated: res.headers['x-vercel-mitigated'] || 'NONE',
          server: res.headers['server'] || 'UNKNOWN',
          location: res.headers['location'] || null,
          title: (body.match(/<title>([^<]*)<\/title>/i) || [])[1] || 'NO_TITLE',
          sampleBody: body.slice(0, 300).replace(/\s+/g, ' ')
        });
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ url: urlStr, error: 'TIMEOUT (10s)' });
    });

    req.on('error', (err) => {
      resolve({ url: urlStr, error: err.message });
    });

    req.end();
  });
}

async function run() {
  console.log('Testing custom domain endpoints...');
  
  const targets = [
    { url: 'https://www.avaniagrofoods.com/', ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    { url: 'https://www.avaniagrofoods.com/', ua: 'curl/8.4.0' },
    { url: 'https://avaniagrofoods.com/', ua: 'curl/8.4.0' },
    { url: 'https://avani-agro-foods-latur-2026.vercel.app/', ua: 'curl/8.4.0' }
  ];

  for (const t of targets) {
    console.log(`\n--- Querying ${t.url} with UA: [${t.ua.slice(0, 25)}...] ---`);
    const res = await checkDomain(t.url, t.ua);
    if (res.error) {
      console.log(`Error: ${res.error}`);
    } else {
      console.log(`Status: ${res.statusCode}`);
      console.log(`x-vercel-mitigated: ${res.mitigated}`);
      console.log(`Server: ${res.server}`);
      console.log(`Location: ${res.location}`);
      console.log(`Title: ${res.title}`);
      console.log(`Headers:`, {
        'x-vercel-cache': res.headers['x-vercel-cache'],
        'x-vercel-id': res.headers['x-vercel-id'],
        'strict-transport-security': res.headers['strict-transport-security'],
        'x-content-type-options': res.headers['x-content-type-options'],
        'content-type': res.headers['content-type']
      });
      console.log(`Sample Body: ${res.sampleBody.slice(0, 150)}...`);
    }
  }
}

run();
