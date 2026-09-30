// ============================================================
// AVANI AGRO FOODS — UNIFIED INQUIRY CAPTURE & QUOTATION TRIGGER
// Handles:
// 1. Input sanitization & duplicate prevention
// 2. Automated Quantity & Requirement Parsing (e.g. 18 MT -> 18,000 KG)
// 3. Unique Inquiry ID (AAF-INQ-2026-XXXXXX) & Quotation ID (AAF-Q-2026-XXXX)
// 4. Automated Quotation Calculation via central Quotation Engine
// 5. Google Sheets CRM dispatch (Customer Inquiries + Quotations tabs)
// 6. External integrations (Zapier, HubSpot, WhatsApp Picky Assist)
// ============================================================

import { calculateQuotation, parseQuantityKg, COMPANY_INFO } from './lib/quotationEngine.js';
import { matchProductMaster } from './lib/productMaster.js';

// In-memory cache for recent submissions to prevent double clicks (1 min window)
const recentSubmissions = new Map();

function cleanOldSubmissions() {
  const now = Date.now();
  for (const [key, timestamp] of recentSubmissions.entries()) {
    if (now - timestamp > 60000) {
      recentSubmissions.delete(key);
    }
  }
}

/**
 * Extract structured attributes from free-form requirement text
 */
function parseRequirementText(text = '') {
  const t = String(text || '');
  const meshMatch = t.match(/(\d+[–-]\d+\s*mesh)/i);
  const moistureMatch = t.match(/(moisture\s*(?:max)?\s*[\d.–%-]+)/i);
  const purityMatch = t.match(/(\d+%\s*pure)/i);
  const packagingMatch = t.match(/(\d+\s*kg[^\n,.]*bags?|\d+\s*kg[^\n,.]*drums?|\d+\s*kg[^\n,.]*cartons?)/i);
  const leadTimeMatch = t.match(/(\d+[–-]\d+\s*days)/i);
  const priceMatch = t.match(/(?:price|rate)\s*(?:per\s*kg)?[:=]?\s*(?:inr|rs\.?|usd|\$)?\s*(\d+(?:\.\d+)?)/i);

  return {
    mesh: meshMatch ? meshMatch[1] : '80–100 Mesh',
    moisture: moistureMatch ? moistureMatch[1] : 'Max 7–8%',
    purity: purityMatch ? purityMatch[1] : '100% Pure',
    packaging: packagingMatch ? packagingMatch[1] : '25 kg Food-Grade HDPE Bags',
    leadTime: leadTimeMatch ? leadTimeMatch[1] : '60–75 days',
    parsedPrice: priceMatch ? parseFloat(priceMatch[1]) : null
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  try {
    cleanOldSubmissions();

    const body = req.body || {};
    const name = (body.name || body.fullName || `${body.firstName || ''} ${body.lastName || ''}`).trim();
    const email = (body.email || '').trim().toLowerCase();
    const phone = (body.phone || body.mobile || '').trim();
    const company = (body.company || body.companyName || 'Direct Buyer').trim();
    const country = (body.country || 'India').trim();
    const rawProduct = (body.product || body.inquiry || body.inquiryType || 'Moringa Leaf Powder').trim();
    const rawRequirement = (body.message || body.buyerRequirement || body.additionalMessage || '').trim();
    const rawQuantity = String(body.quantity || body.quantityOriginal || '100').trim();
    const source = (body.source || 'Website_Contact_RFQ').trim();

    // 1. Validation
    if (!name || name.length < 2) {
      return res.status(400).json({ error: 'Valid customer name is required.' });
    }
    if (!email || !email.includes('@') || !email.includes('.')) {
      return res.status(400).json({ error: 'Valid customer email is required.' });
    }
    if (!phone || phone.length < 6) {
      return res.status(400).json({ error: 'Valid phone/WhatsApp number is required.' });
    }

    // 2. Deduplication check
    const dedupKey = `${email}_${rawProduct}_${rawQuantity}`;
    if (recentSubmissions.has(dedupKey)) {
      const existing = recentSubmissions.get(dedupKey);
      return res.status(200).json({
        success: true,
        message: 'Duplicate enquiry detected within 60s. Your enquiry has already been queued.',
        inquiryId: existing.inquiryId,
        quoteId: existing.quoteId
      });
    }

    // 3. ID Generation
    const timestamp = new Date().toISOString();
    const dateStr = timestamp.split('T')[0];
    const randSuffix = Math.floor(100000 + Math.random() * 900000);
    const randQuoteSuffix = Math.floor(1000 + Math.random() * 9000);
    const inquiryId = body.inquiryId || `AAF-INQ-2026-${randSuffix}`;
    const quoteId = body.quoteId || `AAF-Q-2026-${randQuoteSuffix}`;

    // 4. Normalized Quantity & Product Matching
    const normalizedQuantity = parseQuantityKg(rawQuantity, rawRequirement);
    const pm = matchProductMaster(rawProduct);
    const parsedReq = parseRequirementText(rawRequirement);

    // Determine Currency: INR if country is India or currency explicitly requested as INR
    const currency = (body.currency || (country.toUpperCase().includes('IND') ? 'INR' : 'USD')).toUpperCase();

    // Determine Rate: Explicit rate > Parsed rate > Product Master default
    let rate;
    if (body.rate !== undefined && body.rate !== null && body.rate !== '') {
      rate = Number(body.rate);
    } else if (body.targetPrice && !isNaN(parseFloat(body.targetPrice))) {
      rate = parseFloat(body.targetPrice);
    } else if (parsedReq.parsedPrice !== null) {
      rate = parsedReq.parsedPrice;
    } else {
      rate = currency === 'INR' ? pm.defaultRateInr : pm.defaultRateUsd;
    }

    const incoterm = (body.incoterm || 'FOB NHAVA SHEVA (JNPT MUMBAI)').toUpperCase().trim();
    const destinationPort = (body.destinationPort || body.destination || 'NHAVA SHEVA (JNPT MUMBAI)').trim();
    const leadTime = body.deliveryTimeline || parsedReq.leadTime || '60–75 days';

    // Full description without truncation
    const fullDescription = body.fullDescription || (
      rawRequirement.length > 30 ? rawRequirement : `${pm.productName}\nNatural Green\n${parsedReq.mesh}\nMoisture ${parsedReq.moisture}\n${parsedReq.purity}\n${parsedReq.packaging}`
    );

    // 5. Calculate Quotation Draft
    const quote = calculateQuotation({
      quoteId,
      inquiryId,
      date: dateStr,
      validUntil: body.validUntil || '12 Oct 2026',
      buyerName: name,
      companyName: company,
      email,
      phone,
      country,
      destinationPort,
      incoterm,
      currency,
      items: [
        {
          sr: 1,
          productId: pm.productId,
          name: pm.productName,
          description: fullDescription,
          hscode: pm.hsCode,
          quantity: normalizedQuantity,
          unit: 'KG',
          rate,
          total: Number((normalizedQuantity * rate).toFixed(2)),
          packaging: parsedReq.packaging
        }
      ],
      freight: Number(body.freight || 0),
      insurance: Number(body.insurance || 0),
      documentation: Number(body.documentation || 0),
      deliveryTimeline: `Shipment within ${leadTime} from the date of advance payment confirmation.`,
      paymentTerms: body.paymentTerms || '50% Advance Payment, Balance 50% Before Dispatch.',
      status: 'DRAFT',
      createdAt: timestamp,
      updatedAt: timestamp,
      updatedBy: 'Website Automation Engine'
    });

    // 6. Build Structured Customer Inquiry Record (30 columns matching Section 15)
    const inquiryRecord = {
      inquiryId,
      inquiryDate: dateStr,
      buyerName: name,
      company,
      email,
      phone,
      country,
      product: pm.productName,
      buyerRequirement: rawRequirement || fullDescription,
      quantityOriginal: rawQuantity,
      quantityNormalizedKg: normalizedQuantity,
      mesh: parsedReq.mesh,
      moisture: parsedReq.moisture,
      purity: parsedReq.purity,
      packaging: parsedReq.packaging,
      destination: country,
      destinationPort,
      incoterm,
      requestedPrice: rate,
      currency,
      coaRequested: rawRequirement.toLowerCase().includes('coa') ? 'YES' : 'NO',
      certificationsRequested: rawRequirement.toLowerCase().includes('certif') ? 'YES' : 'NO',
      leadTime,
      source,
      quotationId: quote.quoteId,
      quotationStatus: 'DRAFT',
      adminStatus: 'NEW',
      nextAction: 'Review & Send Draft Quotation',
      notes: `Captured automatically via ${source}. Mapped to Product Master ${pm.productId}.`,
      lastUpdated: timestamp
    };

    // 7. Build Structured Quotation Record (28 columns matching Section 15)
    const quotationRecord = {
      quotationId: quote.quoteId,
      inquiryId,
      quoteDate: quote.date,
      validityDate: quote.validUntil,
      buyer: quote.buyerName,
      company: quote.companyName,
      country: quote.country,
      product: pm.productName,
      hsCode: pm.hsCode,
      description: fullDescription,
      quantityKg: normalizedQuantity,
      unit: 'KG',
      unitRate: rate,
      currency,
      subtotal: quote.subtotal,
      freight: quote.freight,
      insurance: quote.insurance,
      documentation: quote.documentation,
      grandTotal: quote.grandTotal,
      incoterm: quote.incoterm,
      destinationPort: quote.destinationPort,
      paymentTerms: quote.paymentTerms,
      deliveryTimeline: quote.deliveryTimeline,
      quotationStatus: quote.status,
      pdfLink: `/api/quotation?action=download-pdf&id=${quote.quoteId}`,
      docxLink: `/api/quotation?action=download-docx&id=${quote.quoteId}`,
      lastUpdated: timestamp,
      updatedBy: 'Website Automation Engine'
    };

    // Store in recent deduplication cache
    recentSubmissions.set(dedupKey, { inquiryId, quoteId });

    // 8. Integrations Status Tracking
    const integrations = {
      googleSheetsInquiry: 'PENDING',
      googleSheetsQuotation: 'PENDING',
      hubSpot: process.env.HUBSPOT_ACCESS_TOKEN ? 'PENDING' : 'NOT_CONFIGURED',
      zapier: process.env.ZAPIER_WEBHOOK_URL ? 'PENDING' : 'NOT_CONFIGURED',
      whatsapp: process.env.PICKY_ASSIST_URL || 'https://app.pickyassist.com/url/5cb2564f744736ff1b4d09e1ebad26748625043e' ? 'PENDING' : 'NOT_CONFIGURED'
    };

    // 9. Dispatch to Google Sheets Webhook (Both Inquiries and Quotations)
    const GOOGLE_SHEETS_WEBHOOK = process.env.GOOGLE_SHEETS_WEBHOOK || process.env.VITE_GOOGLE_SHEETS_WEBHOOK || "https://script.google.com/macros/s/AKfycbxQN2Z7Bi7V-iZFibeeFkOyOOaMeX-4jFF3hv4GIYSGILDpoKbMq1WpXlAlX_Uims8k/exec";
    if (GOOGLE_SHEETS_WEBHOOK && !GOOGLE_SHEETS_WEBHOOK.includes('YOUR_DEPLOYMENT_ID')) {
      try {
        // Send Customer Inquiry row
        await fetch(GOOGLE_SHEETS_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetSheet: 'Customer Inquiries',
            type: 'CUSTOMER_INQUIRY',
            ...inquiryRecord
          })
        });
        integrations.googleSheetsInquiry = 'SUCCESS';
      } catch (err) {
        integrations.googleSheetsInquiry = 'FAILED';
        console.error('[Google Sheets CRM] Inquiry write error:', err.message);
      }

      try {
        // Send Quotation row
        await fetch(GOOGLE_SHEETS_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetSheet: 'Quotations',
            type: 'QUOTATION',
            ...quotationRecord
          })
        });
        integrations.googleSheetsQuotation = 'SUCCESS';
      } catch (err) {
        integrations.googleSheetsQuotation = 'FAILED';
        console.error('[Google Sheets CRM] Quotation write error:', err.message);
      }
    }

    // 10. Zapier Webhook Dispatch (if configured)
    if (process.env.ZAPIER_WEBHOOK_URL) {
      try {
        await fetch(process.env.ZAPIER_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ inquiry: inquiryRecord, quotation: quotationRecord })
        });
        integrations.zapier = 'SUCCESS';
      } catch (zapErr) {
        integrations.zapier = 'FAILED';
      }
    }

    // 11. WhatsApp Webhook Dispatch (if configured)
    const PICKY_ASSIST_URL = process.env.PICKY_ASSIST_URL || "https://app.pickyassist.com/url/5cb2564f744736ff1b4d09e1ebad26748625043e";
    if (PICKY_ASSIST_URL) {
      try {
        await fetch(PICKY_ASSIST_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            phone,
            inquiryId,
            quoteId: quote.quoteId,
            product: pm.productName,
            quantity: `${normalizedQuantity} KG`,
            total: `${quote.currency} ${quote.grandTotal}`,
            businessName: COMPANY_INFO.name,
            timestamp
          })
        });
        integrations.whatsapp = 'SUCCESS';
      } catch (waErr) {
        integrations.whatsapp = 'FAILED';
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Inquiry registered and quotation draft created successfully.',
      inquiryId,
      quoteId: quote.quoteId,
      inquiry: inquiryRecord,
      quote,
      quotationDraft: quote,
      integrations
    });

  } catch (err) {
    console.error('[Save Lead API] Critical error:', err.message);
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while processing the enquiry: ' + err.message
    });
  }
}
