// ============================================================
// AVANI AGRO FOODS — UNIFIED SERVERLESS LEAD CAPTURE & QUOTATION TRIGGER
// Handles:
// 1. Input sanitization & duplicate prevention
// 2. Unique Lead ID & Quotation ID generation
// 3. Google Sheets webhook dispatch
// 4. Zapier webhook dispatch (if configured)
// 5. HubSpot CRM contact/deal creation (if configured)
// 6. Automated Quotation Calculation & Document Generation
// 7. Transactional Email notification (if configured)
// 8. Picky Assist WhatsApp notification (if configured)
// ============================================================

import { calculateQuotation, generateExcelQuotation, generatePdfQuotation, COMPANY_INFO } from './lib/quotationEngine.js';

// In-memory cache for recent submissions to prevent rapid duplicate double-clicks
const recentSubmissions = new Map();

function cleanOldSubmissions() {
  const now = Date.now();
  for (const [key, timestamp] of recentSubmissions.entries()) {
    if (now - timestamp > 60000) { // 1-minute dedup window
      recentSubmissions.delete(key);
    }
  }
}

export default async function handler(req, res) {
  // 1. Method Validation
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Security Headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  try {
    cleanOldSubmissions();

    const body = req.body || {};
    const name = (body.name || `${body.firstName || ''} ${body.lastName || ''}`).trim();
    const email = (body.email || '').trim().toLowerCase();
    const phone = (body.phone || body.mobile || '').trim();
    const company = (body.company || body.companyName || 'Private').trim();
    const country = (body.country || 'India').trim();
    const product = (body.product || body.inquiry || body.inquiryType || 'Moringa Leaf Powder').trim();
    const quantity = Number(body.quantity) || 100;
    const currency = (body.currency || 'USD').toUpperCase();
    const incoterm = (body.incoterm || 'CIF').toUpperCase();
    const message = (body.message || body.inquiry || '').trim();
    const source = (body.source || 'Website_Enquiry_Form').trim();

    // 2. Input Validation
    if (!name || name.length < 2) {
      return res.status(400).json({ error: 'Valid customer name is required.' });
    }

    if (!email || !email.includes('@') || !email.includes('.')) {
      return res.status(400).json({ error: 'Valid customer email is required.' });
    }

    if (!phone || phone.length < 6) {
      return res.status(400).json({ error: 'Valid phone/WhatsApp number is required.' });
    }

    // 3. Duplicate Prevention Key
    const dedupKey = `${email}_${product}_${quantity}`;
    if (recentSubmissions.has(dedupKey)) {
      return res.status(200).json({
        success: true,
        message: 'Duplicate submission detected within 60s. Your enquiry has already been queued.',
        leadId: recentSubmissions.get(dedupKey)
      });
    }

    const timestamp = new Date().toISOString();
    const dateStr = timestamp.split('T')[0].replace(/-/g, '');
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const leadId = `LEAD-${dateStr}-${randSuffix}`;

    recentSubmissions.set(dedupKey, leadId);

    // 4. Automated Quotation Engine Trigger
    let quote = null;
    let quoteId = null;
    let quoteStatus = 'NEEDS_PRICING';

    try {
      quote = calculateQuotation({
        leadId,
        customerName: name,
        companyName: company,
        email,
        phone,
        country,
        destination: country,
        product,
        quantity,
        currency,
        incoterm
      });
      quoteId = quote.quoteId;
      quoteStatus = 'GENERATED';
    } catch (calcErr) {
      console.warn('[Quotation Engine] Calculation deferred:', calcErr.message);
    }

    const leadRecord = {
      leadId,
      quoteId,
      createdAt: timestamp,
      name,
      company,
      email,
      phone,
      country,
      product,
      quantity,
      currency,
      incoterm,
      totalAmount: quote ? quote.grandTotal : 0,
      source,
      message,
      status: quoteStatus,
      integrations: {
        googleSheets: 'PENDING',
        hubSpot: process.env.HUBSPOT_ACCESS_TOKEN ? 'PENDING' : 'NOT_CONFIGURED',
        zapier: process.env.ZAPIER_WEBHOOK_URL ? 'PENDING' : 'NOT_CONFIGURED',
        whatsapp: process.env.PICKY_ASSIST_URL || 'https://app.pickyassist.com/url/5cb2564f744736ff1b4d09e1ebad26748625043e' ? 'PENDING' : 'NOT_CONFIGURED',
        email: process.env.EMAILJS_SERVICE_ID || process.env.SMTP_HOST ? 'PENDING' : 'READY_VIA_CLIENT'
      }
    };

    // 5. Google Sheets Webhook Dispatch
    const GOOGLE_SHEETS_WEBHOOK = process.env.GOOGLE_SHEETS_WEBHOOK || process.env.VITE_GOOGLE_SHEETS_WEBHOOK || "https://script.google.com/macros/s/AKfycbxQN2Z7Bi7V-iZFibeeFkOyOOaMeX-4jFF3hv4GIYSGILDpoKbMq1WpXlAlX_Uims8k/exec";
    if (GOOGLE_SHEETS_WEBHOOK && !GOOGLE_SHEETS_WEBHOOK.includes('YOUR_DEPLOYMENT_ID')) {
      try {
        await fetch(GOOGLE_SHEETS_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'LEAD_AND_QUOTATION',
            leadId,
            quoteId,
            timestamp,
            name,
            company,
            email,
            phone,
            country,
            product,
            quantity,
            totalAmount: leadRecord.totalAmount,
            currency,
            incoterm,
            status: quoteStatus,
            source,
            message
          })
        });
        leadRecord.integrations.googleSheets = 'SUCCESS';
      } catch (sheetErr) {
        leadRecord.integrations.googleSheets = 'FAILED';
        console.error('[Google Sheets] Webhook error:', sheetErr.message);
      }
    }

    // 6. Zapier Webhook Dispatch (if configured)
    const ZAPIER_WEBHOOK = process.env.ZAPIER_WEBHOOK_URL;
    if (ZAPIER_WEBHOOK) {
      try {
        await fetch(ZAPIER_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(leadRecord)
        });
        leadRecord.integrations.zapier = 'SUCCESS';
      } catch (zapErr) {
        leadRecord.integrations.zapier = 'FAILED';
        console.error('[Zapier] Webhook error:', zapErr.message);
      }
    }

    // 7. HubSpot CRM Contact & Deal Creation (if configured)
    const HUBSPOT_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;
    if (HUBSPOT_TOKEN) {
      try {
        const hsRes = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            properties: {
              email,
              firstname: name.split(' ')[0],
              lastname: name.split(' ').slice(1).join(' ') || 'Buyer',
              phone,
              company,
              country,
              lead_source: source,
              quotation_id: quoteId,
              quotation_status: quoteStatus
            }
          })
        });
        leadRecord.integrations.hubSpot = hsRes.ok ? 'SUCCESS' : 'FAILED';
      } catch (hsErr) {
        leadRecord.integrations.hubSpot = 'FAILED';
        console.error('[HubSpot] API error:', hsErr.message);
      }
    }

    // 8. Picky Assist WhatsApp Automation Dispatch (if configured)
    const PICKY_ASSIST_URL = process.env.PICKY_ASSIST_URL || "https://app.pickyassist.com/url/5cb2564f744736ff1b4d09e1ebad26748625043e";
    if (PICKY_ASSIST_URL) {
      try {
        await fetch(PICKY_ASSIST_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            phone,
            leadId,
            quoteId,
            product,
            quantity,
            total: leadRecord.totalAmount,
            currency,
            country,
            businessName: COMPANY_INFO.name,
            timestamp
          })
        });
        leadRecord.integrations.whatsapp = 'SUCCESS';
      } catch (waErr) {
        leadRecord.integrations.whatsapp = 'FAILED';
        console.error('[WhatsApp Webhook] error:', waErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Enquiry captured and quotation generated successfully.',
      leadId,
      quoteId,
      quote: quote ? {
        quoteId: quote.quoteId,
        date: quote.date,
        validUntil: quote.validUntil,
        customerName: quote.customerName,
        product: quote.items[0].name,
        quantity: quote.items[0].quantity,
        unitRate: quote.items[0].rate,
        currency: quote.currency,
        incoterm: quote.incoterm,
        subtotalFob: quote.subtotalFob,
        freight: quote.freight,
        insurance: quote.insurance,
        documentation: quote.documentation,
        grandTotal: quote.grandTotal,
        paymentTerms: quote.paymentTerms
      } : null,
      integrations: leadRecord.integrations
    });

  } catch (err) {
    console.error('[Save Lead API] Critical error:', err.message);
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while processing the enquiry. Please try again.'
    });
  }
}
