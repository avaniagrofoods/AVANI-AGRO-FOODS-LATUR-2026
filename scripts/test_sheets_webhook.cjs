// Use native global fetch in Node 18+
const fs = require('fs');

if (fs.existsSync('.env.local')) {
  const lines = fs.readFileSync('.env.local', 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const k = trimmed.substring(0, idx).trim();
        let v = trimmed.substring(idx + 1).trim();
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
          v = v.slice(1, -1);
        }
        if (!process.env[k]) {
          process.env[k] = v;
        }
      }
    }
  }
}

async function testGoogleSheetsWebhook() {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK || process.env.VITE_GOOGLE_SHEETS_WEBHOOK;
  if (!webhookUrl) {
    console.log('[SECURITY NOTE] Skipping sheets webhook test: GOOGLE_SHEETS_WEBHOOK is not set in environment.');
    return;
  }
  console.log('Testing Google Sheets Webhook (Environment-Driven)');

  const testInquiryPayload = {
    targetSheet: 'Customer Inquiries',
    type: 'INQUIRY',
    webhookSecret: process.env.CRM_WEBHOOK_SECRET || '',
    inquiryId: 'AAF-INQ-2026-TEST01',
    inquiryDate: '2026-09-30',
    buyerName: 'VIKRAM (Automated Test)',
    company: 'VIKRAJA SOLAPUR',
    email: 'vikrajaexports@gmail.com',
    phone: '84464 19006',
    country: 'INDIA',
    product: 'Moringa Leaf Powder',
    buyerRequirement: 'Bulk export requirement for 18 MT Moringa Leaf Powder 80-100 Mesh.',
    quantityOriginal: '18 MT',
    quantityNormalizedKg: 18000,
    mesh: '80–100 Mesh',
    moisture: 'Max 7–8%',
    purity: '100% Pure',
    packaging: '25 kg Food-Grade HDPE Bags',
    destination: 'Designated International Port',
    destinationPort: 'NHAVA SHEVA (JNPT MUMBAI)',
    incoterm: 'FOB NHAVA SHEVA (JNPT MUMBAI)',
    requestedPrice: 350.00,
    currency: 'INR',
    leadTime: '60–75 days',
    source: 'Automated_Acceptance_Verification',
    quotationId: 'AAF-Q-2026-9075',
    quotationStatus: 'DRAFT',
    adminStatus: 'NEW',
    nextAction: 'Review Quotation Draft',
    notes: 'Verified single quotation record workflow',
    lastUpdated: new Date().toISOString()
  };

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testInquiryPayload),
      redirect: 'manual'
    });
    console.log('Webhook Response Status:', res.status);
    const text = await res.text();
    console.log('Webhook Response Body:', text.slice(0, 300));
    if (res.status === 200 || res.status === 302) {
      console.log('✓ Google Sheets Webhook successfully delivered payload!');
    }
  } catch (e) {
    console.error('Webhook Error:', e.message);
  }
}

testGoogleSheetsWebhook();
