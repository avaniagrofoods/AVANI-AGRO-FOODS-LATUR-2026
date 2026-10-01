const https = require('https');
const zlib = require('zlib');

const BASE_URL = 'https://www.avaniagrofoods.com';

function fetchUrl(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      const chunks = [];
      res.on('data', (d) => chunks.push(d));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: Buffer.concat(chunks)
        });
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

function extractAllDecodedTextFromPdf(buf) {
  let idx = 0;
  let allDecoded = [];
  while ((idx = buf.indexOf('stream', idx)) !== -1) {
    let start = idx + 6;
    if (buf[start] === 13 && buf[start + 1] === 10) start += 2;
    else if (buf[start] === 10 || buf[start] === 13) start += 1;
    const end = buf.indexOf('endstream', start);
    if (end === -1) break;
    const slice = buf.slice(start, end);
    try {
      const decomp = zlib.inflateSync(slice).toString('utf8');
      const hexMatches = decomp.match(/<([0-9A-Fa-f]+)>\s*Tj/g);
      if (hexMatches) {
        hexMatches.forEach((m) => {
          const hex = m.replace(/[^0-9A-Fa-f]/g, '');
          allDecoded.push(Buffer.from(hex, 'hex').toString('utf8'));
        });
      }
    } catch (e) {}
    idx = end + 9;
  }
  return allDecoded.join('\n');
}

async function runProductionAudit() {
  console.log('============================================================');
  console.log('AVANI AGRO FOODS — P3.2 LIVE PRODUCTION VALIDATION');
  console.log('Base URL:', BASE_URL);
  console.log('Timestamp:', new Date().toISOString());
  console.log('============================================================\n');

  // 1. Public Routes Regression Check
  const routes = [
    '/',
    '/about',
    '/products',
    '/products/moringa-leaf-powder',
    '/products/dehydrated-red-onion',
    '/trade-coordination',
    '/export-process',
    '/export-compliance',
    '/manufacturer-requirements',
    '/blog',
    '/contact',
    '/robots.txt',
    '/sitemap.xml'
  ];

  console.log('--- 1. Testing Public Routes ---');
  let routesPassed = 0;
  for (const r of routes) {
    try {
      const res = await fetchUrl(`${BASE_URL}${r}`, { method: 'GET' });
      if (res.statusCode === 200) {
        routesPassed++;
        console.log(`[PASS] ${r} -> HTTP ${res.statusCode}`);
      } else {
        console.error(`[FAIL] ${r} -> HTTP ${res.statusCode}`);
      }
    } catch (err) {
      console.error(`[ERROR] ${r} -> ${err.message}`);
    }
  }

  // 2. Live API PDF and DOCX Parity Test for AAF-Q-2026-9075
  console.log('\n--- 2. Testing Live API PDF & DOCX Generation for AAF-Q-2026-9075 ---');
  const quotePayload = {
    quoteId: 'AAF-Q-2026-9075',
    quotationNumber: 'AAF-Q-2026-9075',
    buyerName: 'VIKRAM',
    customerName: 'VIKRAM',
    companyName: 'VIKRAJA SOLAPUR',
    buyer: {
      name: 'VIKRAM',
      company: 'VIKRAJA SOLAPUR',
      email: 'vikram@vikrajasolapur.com',
      country: 'India',
      destinationPort: 'Nhava Sheva'
    },
    incoterm: 'FOB',
    currency: 'INR',
    items: [
      {
        id: '1',
        name: 'Moringa Leaf Powder - Organic Grade',
        hsCode: '12119029',
        quantity: 18000,
        unit: 'KG',
        rate: 650,
        amount: 11700000,
        description: '25 kg Food-Grade HDPE Bags with inner liner'
      },
      {
        id: '2',
        name: 'Moringa Leaf Powder - Conventional Grade',
        hsCode: '12119029',
        quantity: 18000,
        unit: 'KG',
        rate: 350,
        amount: 6300000,
        description: '25 kg Food-Grade HDPE Bags with inner liner'
      }
    ],
    subtotal: 18000000,
    grandTotal: 18000000,
    commercialNotes: 'Standard Commercial Terms'
  };

  const payloadString = JSON.stringify(quotePayload);

  // Test calculate endpoint on live site
  const calcRes = await fetchUrl(`${BASE_URL}/api/quotation?action=calculate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payloadString)
    },
    body: payloadString
  });
  console.log(`Calculate API Status: ${calcRes.statusCode} | Content-Type: ${calcRes.headers['content-type']}`);
  const calcJson = JSON.parse(calcRes.body.toString('utf8'));
  const item1 = calcJson.quote?.items?.[0];
  const item2 = calcJson.quote?.items?.[1];
  console.log(`Live Calculate Item 1: ${item1?.quantity} ${item1?.unit} @ ${item1?.rate} = ${item1?.amount}`);
  console.log(`Live Calculate Item 2: ${item2?.quantity} ${item2?.unit} @ ${item2?.rate} = ${item2?.amount}`);
  console.log(`Live Calculate Subtotal: ${calcJson.quote?.subtotal} | Grand Total: ${calcJson.quote?.grandTotal}`);

  // Test PDF download on live site
  const pdfRes = await fetchUrl(`${BASE_URL}/api/quotation?action=download-pdf`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payloadString)
    },
    body: payloadString
  });
  console.log(`PDF Download API Status: ${pdfRes.statusCode} | Content-Type: ${pdfRes.headers['content-type']} | Size: ${pdfRes.body.length} bytes`);
  
  const isPdfValid = pdfRes.statusCode === 200 && pdfRes.body.slice(0, 4).toString() === '%PDF';
  const decodedPdfText = extractAllDecodedTextFromPdf(pdfRes.body);

  // Check for defect amounts vs correct amounts
  const hasOldDefectAmount = decodedPdfText.includes('8,750') || decodedPdfText.includes('8750.00');
  const hasCorrectTotal = decodedPdfText.includes('18,000,000') || decodedPdfText.includes('18000000');
  const hasItem1CorrectAmount = decodedPdfText.includes('11,700,000') || decodedPdfText.includes('11700000');
  const hasItem2CorrectAmount = decodedPdfText.includes('6,300,000') || decodedPdfText.includes('6300000');
  const hasItem2CorrectQty = decodedPdfText.includes('18,000 KG');

  console.log(`PDF Header Valid (%PDF): ${isPdfValid}`);
  console.log(`PDF Contains Item 1 Amount (INR 11,700,000.00): ${hasItem1CorrectAmount}`);
  console.log(`PDF Contains Item 2 Qty (18,000 KG): ${hasItem2CorrectQty}`);
  console.log(`PDF Contains Item 2 Amount (INR 6,300,000.00): ${hasItem2CorrectAmount}`);
  console.log(`PDF Contains Grand Total (INR 18,000,000.00): ${hasCorrectTotal}`);
  console.log(`PDF Contains Stale Defect Amount (INR 8,750.00): ${hasOldDefectAmount}`);

  // Test DOCX download on live site
  const docxRes = await fetchUrl(`${BASE_URL}/api/quotation?action=download-docx`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payloadString)
    },
    body: payloadString
  });
  console.log(`DOCX Download API Status: ${docxRes.statusCode} | Content-Type: ${docxRes.headers['content-type']} | Size: ${docxRes.body.length} bytes`);
  const isDocxValid = docxRes.statusCode === 200 && docxRes.body.length > 5000;

  const calculatePass = calcJson.quote?.grandTotal === 18000000 && item2?.quantity === 18000 && item2?.amount === 6300000;
  const pdfPass = isPdfValid && hasCorrectTotal && hasItem2CorrectAmount && hasItem2CorrectQty && !hasOldDefectAmount;
  const docxPass = isDocxValid;

  console.log('\n============================================================');
  console.log('SUMMARY AUDIT VERDICT:');
  console.log(`Public Routes: ${routesPassed}/${routes.length} HTTP 200`);
  console.log(`Live Calculate Parity: ${calculatePass ? 'PASS' : 'FAIL'}`);
  console.log(`Live PDF Generation: ${isPdfValid ? 'PASS' : 'FAIL'}`);
  console.log(`Live PDF Calculation Correct: ${pdfPass ? 'PASS' : 'FAIL'}`);
  console.log(`Live DOCX Generation: ${docxPass ? 'PASS' : 'FAIL'}`);
  console.log('============================================================');

  if (calculatePass && pdfPass && docxPass && routesPassed === routes.length) {
    console.log('OVERALL PRODUCTION VERDICT: 100% PASS — 0 DEFECTS REMAINING');
  } else {
    console.error('OVERALL PRODUCTION VERDICT: INCOMPLETE OR FAILED');
    process.exit(1);
  }
}

runProductionAudit().catch(err => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});
