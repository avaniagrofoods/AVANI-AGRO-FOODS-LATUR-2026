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

import { calculateQuotation, parseQuantityKg, COMPANY_INFO } from './_lib/quotationEngine.js';
import { matchProductMaster } from './_lib/productMaster.js';
import { getClientIp, checkRateLimit, isAllowedOrigin } from './_lib/auth.js';
import { saveLeadToSupabase, saveQuotationToSupabase, isSupabaseConfigured } from './_lib/supabaseClient.js';

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

  // Security Headers
  if (!isAllowedOrigin(req)) {
    return res.status(403).json({ error: 'Forbidden origin' });
  }

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  try {
    const ip = getClientIp(req);
    const rateCheck = await checkRateLimit(ip, 'lead_submission');
    if (rateCheck.limited) {
      return res.status(429).json({
        error: `Too many submissions. Please wait ${rateCheck.minutesLeft} minute(s) before trying again.`
      });
    }

    cleanOldSubmissions();

    const body = req.body || {};
    if (typeof body !== 'object' || body === null) {
      return res.status(400).json({ error: 'Invalid payload.' });
    }

    // 0. Honeypot Spam Trap Check
    if (body.honeypot || body.website || body.honeypot_company_url) {
      return res.status(200).json({
        success: true,
        message: 'Your enquiry has been received.',
        inquiryId: 'AAF-INQ-TRAP-FILTERED'
      });
    }

    const name = String(body.name || body.fullName || `${body.firstName || ''} ${body.lastName || ''}`).trim();
    const email = String(body.email || '').trim().toLowerCase();
    const rawPhone = String(body.phone || body.mobile || '').trim();
    const isPhoneProvided = rawPhone.length > 0 && rawPhone !== 'N/A' && rawPhone !== 'Not-Provided';
    const phone = isPhoneProvided ? rawPhone : '';
    const company = String(body.company || body.companyName || 'Direct Buyer').trim();
    const country = String(body.country || 'India').trim();
    const rawProduct = String(body.product || body.inquiry || body.inquiryType || 'Moringa Leaf Powder').trim();
    const rawRequirement = String(body.message || body.buyerRequirement || body.additionalMessage || '').trim();
    const rawQuantity = String(body.quantity || body.quantityOriginal || '100').trim();
    const source = String(body.source || 'Website_Contact_RFQ').trim();
    const buyerRole = String(body.buyerRole || body.buyerType || 'Procurement Manager').trim();
    const quantityUnit = String(body.quantityUnit || 'KG').toUpperCase().trim();
    const intendedApplication = String(body.intendedApplication || '').trim();
    const packagingPreference = String(body.packagingPreference || '').trim();
    const purchaseTimeline = String(body.purchaseTimeline || '').trim();
    const documentsRequested = Array.isArray(body.documentsRequested) 
      ? body.documentsRequested.join(', ') 
      : String(body.documentsRequested || '').trim();
    const utmSource = String(body.utm_source || '').trim();
    const utmMedium = String(body.utm_medium || '').trim();
    const utmCampaign = String(body.utm_campaign || '').trim();
    const utmContent = String(body.utm_content || '').trim();
    const utmTerm = String(body.utm_term || '').trim();
    const landingPage = String(body.landing_page || body.page || '').trim();
    const referrer = String(body.referrer || '').trim();

    // 1. Validation & Length Bounds
    if (!name || name.length < 2 || name.length > 150) {
      return res.status(400).json({ error: 'Valid customer name is required (max 150 chars).' });
    }
    if (!email || !email.includes('@') || !email.includes('.') || email.length > 150) {
      return res.status(400).json({ error: 'Valid customer email is required (max 150 chars).' });
    }
    if (isPhoneProvided && (phone.length < 6 || phone.length > 50)) {
      return res.status(400).json({ error: 'Valid phone/WhatsApp number is required (between 6 and 50 chars).' });
    }
    if (company.length > 150) {
      return res.status(400).json({ error: 'Company name exceeds maximum length (150 chars).' });
    }
    if (rawRequirement.length > 5000) {
      return res.status(400).json({ error: 'Requirement text exceeds maximum allowed length.' });
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

    // 6. Build Structured Customer Inquiry Record (30+ columns matching Section 15 & B2B RFQ)
    const inquiryRecord = {
      inquiryId,
      inquiryDate: dateStr,
      buyerName: name,
      company,
      email,
      phone,
      country,
      buyerRole,
      product: pm.productName,
      buyerRequirement: rawRequirement || fullDescription,
      quantityOriginal: rawQuantity,
      quantityNormalizedKg: normalizedQuantity,
      quantityUnit,
      intendedApplication: intendedApplication || parsedReq.application || 'Commercial Food Processing',
      packagingPreference: packagingPreference || parsedReq.packaging,
      mesh: parsedReq.mesh,
      moisture: parsedReq.moisture,
      purity: parsedReq.purity,
      packaging: parsedReq.packaging,
      destination: country,
      destinationPort,
      incoterm,
      purchaseTimeline: purchaseTimeline || leadTime,
      documentsRequested: documentsRequested || 'Standard Batch COA',
      requestedPrice: rate,
      currency,
      coaRequested: (rawRequirement.toLowerCase().includes('coa') || documentsRequested.includes('COA')) ? 'YES' : 'NO',
      certificationsRequested: (rawRequirement.toLowerCase().includes('certif') || documentsRequested.includes('Certif')) ? 'YES' : 'NO',
      leadTime,
      source,
      landingPage,
      referrer,
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
      utmTerm,
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

    // 8. Primary Durable Database Persistence (Supabase PostgreSQL)
    let supabaseLeadPersistence = 'NOT_CONFIGURED_MISSING_CREDENTIALS';
    let supabaseQuotePersistence = 'NOT_CONFIGURED_MISSING_CREDENTIALS';
    let supabaseLeadDetails = null;

    if (isSupabaseConfigured()) {
      try {
        const sLead = await saveLeadToSupabase(inquiryRecord);
        supabaseLeadPersistence = sLead.persisted ? 'SUCCESS' : 'FAILED';
        supabaseLeadDetails = sLead;
      } catch (sErr) {
        console.error('[Supabase Primary Persistence Error - Lead]:', sErr.message);
        supabaseLeadPersistence = 'FAILED';
      }

      try {
        const sQuote = await saveQuotationToSupabase(quotationRecord);
        supabaseQuotePersistence = sQuote.persisted ? 'SUCCESS' : 'FAILED';
      } catch (sqErr) {
        console.error('[Supabase Primary Persistence Error - Quote]:', sqErr.message);
        supabaseQuotePersistence = 'FAILED';
      }

      // If Supabase is configured and failed to persist the lead, fail explicitly to prevent false success
      if (supabaseLeadPersistence !== 'SUCCESS') {
        recentSubmissions.delete(dedupKey);
        return res.status(500).json({
          success: false,
          error: 'Database persistence failed to confirm your enquiry. Your details were not permanently recorded. Please retry or contact Trade Coordinator Sachin Shinde directly on WhatsApp (+91 7219053645) or email sales@avaniagrofoods.com.',
          persistenceStatus: 'FAILED',
          inquiryId: null
        });
      }
    }

    // Store in recent deduplication cache ONLY after persistence is confirmed
    recentSubmissions.set(dedupKey, { inquiryId, quoteId });

    // 9. Integrations Status Tracking
    const integrations = {
      supabaseLead: supabaseLeadPersistence,
      supabaseQuotation: supabaseQuotePersistence,
      googleSheetsInquiry: 'PENDING',
      googleSheetsQuotation: 'PENDING',
      hubSpot: process.env.HUBSPOT_ACCESS_TOKEN ? 'PENDING' : 'NOT_CONFIGURED',
      zapier: process.env.ZAPIER_WEBHOOK_URL ? 'PENDING' : 'NOT_CONFIGURED',
      whatsapp: process.env.PICKY_ASSIST_URL ? 'PENDING' : 'NOT_CONFIGURED',
      emailNotification: 'NOT_CONFIGURED_MISSING_RESEND_API_KEY',
      emailProviderAcceptance: 'NOT_ATTEMPTED',
      emailDeliveryAlert: null
    };

    // Helper for resilient Resend email dispatch with retry
    async function sendResendEmailWithRetry(payload, maxRetries = 1) {
      const RESEND_API_KEY = process.env.RESEND_API_KEY;
      if (!RESEND_API_KEY) return { ok: false, status: 0, error: 'MISSING_KEY' };

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 7000);
          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${RESEND_API_KEY}`
            },
            body: JSON.stringify(payload),
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (res.ok) {
            const data = await res.json().catch(() => ({}));
            return { ok: true, status: res.status, id: data.id };
          }
          if (res.status >= 500 && attempt < maxRetries) {
            await new Promise(r => setTimeout(r, 400));
            continue;
          }
          return { ok: false, status: res.status };
        } catch (fetchErr) {
          if (attempt < maxRetries) {
            await new Promise(r => setTimeout(r, 400));
            continue;
          }
          return { ok: false, error: fetchErr.message };
        }
      }
      return { ok: false, error: 'RETRY_EXHAUSTED' };
    }

    // Dispatch Transactional Email Notifications via Resend API (Internal Alert + Buyer Confirmation)
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (RESEND_API_KEY) {
      try {
        // Internal notification to trade coordinator
        const internalResult = await sendResendEmailWithRetry({
          from: 'AVANI AGRO FOODS <notifications@avaniagrofoods.com>',
          to: ['sales@avaniagrofoods.com'],
          subject: `New International B2B Enquiry – ${pm.productName} – ${country}`,
          html: `
            <h2>New International B2B Enquiry</h2>
            <p><strong>Inquiry ID:</strong> ${inquiryId}</p>
            <p><strong>Quotation ID:</strong> ${quote.quoteId}</p>
            <p><strong>Date:</strong> ${timestamp}</p>
            <hr/>
            <h3>Buyer Profile</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Company:</strong> ${company}</p>
            <p><strong>Buyer Role:</strong> ${buyerRole}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone / WhatsApp:</strong> ${phone || 'Not provided'}</p>
            <p><strong>Country:</strong> ${country}</p>
            <p><strong>Destination Port:</strong> ${destinationPort}</p>
            <hr/>
            <h3>Commercial Requirements</h3>
            <p><strong>Product:</strong> ${pm.productName} (HS: ${pm.hsCode})</p>
            <p><strong>Quantity:</strong> ${rawQuantity} ${quantityUnit} (${normalizedQuantity} KG)</p>
            <p><strong>Incoterm:</strong> ${incoterm}</p>
            <p><strong>Indicative Rate:</strong> ${currency} ${rate} / KG</p>
            <p><strong>Estimated Grand Total:</strong> ${currency} ${quote.grandTotal}</p>
            <p><strong>Timeline:</strong> ${purchaseTimeline || leadTime}</p>
            <p><strong>Application:</strong> ${intendedApplication || 'Food Processing'}</p>
            <p><strong>Packaging:</strong> ${packagingPreference || parsedReq.packaging}</p>
            <p><strong>Documents Requested:</strong> ${documentsRequested || 'Standard COA'}</p>
            <p><strong>Notes:</strong> ${rawRequirement || 'None'}</p>
            <hr/>
            <h3>Attribution</h3>
            <p><strong>Source:</strong> ${source}</p>
            <p><strong>Landing Page:</strong> ${landingPage || 'Direct'}</p>
            <p><strong>UTM:</strong> source=${utmSource || '-'}, medium=${utmMedium || '-'}, campaign=${utmCampaign || '-'}</p>
          `
        });

        // Buyer acknowledgement email
        const buyerResult = await sendResendEmailWithRetry({
          from: 'AVANI AGRO FOODS <sales@avaniagrofoods.com>',
          to: [email],
          subject: 'We Have Received Your Enquiry – AVANI AGRO FOODS',
          html: `
            <h2>Thank you for contacting AVANI AGRO FOODS</h2>
            <p>Dear ${name},</p>
            <p>We have successfully received your commercial enquiry for <strong>${pm.productName}</strong>.</p>
            <p><strong>Inquiry Reference:</strong> ${inquiryId}</p>
            <p><strong>Indicative Quotation Reference:</strong> ${quote.quoteId}</p>
            <p>Our Trade Coordinator, Sachin Shinde, will review your technical specifications, batch availability with our vetted processing partners, and prepare a formal proforma quotation within 24 hours.</p>
            <h3>Enquiry Summary</h3>
            <ul>
              <li><strong>Product:</strong> ${pm.productName}</li>
              <li><strong>Quantity:</strong> ${rawQuantity} ${quantityUnit} (${normalizedQuantity} KG)</li>
              <li><strong>Incoterm & Destination:</strong> ${incoterm} - ${destinationPort}</li>
              <li><strong>Indicative Pricing Basis:</strong> ${currency} ${rate}/KG (${currency} ${quote.grandTotal})</li>
            </ul>
            <p>If you have urgent questions or wish to expedite batch samples, you may reach our trade desk directly on WhatsApp at <a href="https://wa.me/917219053645">+91 7219053645</a>.</p>
            <br/>
            <p>Best regards,</p>
            <p><strong>Sachin Shinde</strong><br/>Trade Coordinator<br/>AVANI AGRO FOODS<br/>Latur, Maharashtra, India<br/>Email: sales@avaniagrofoods.com<br/>Web: https://www.avaniagrofoods.com</p>
          `
        });

        if (internalResult.ok && buyerResult.ok) {
          integrations.emailNotification = 'SUCCESS';
          integrations.emailProviderAcceptance = 'ACCEPTED_BY_RESEND_API';
        } else {
          integrations.emailNotification = 'PARTIAL_OR_FAILED';
          integrations.emailProviderAcceptance = internalResult.ok ? 'INTERNAL_ONLY' : 'FAILED';
          integrations.emailDeliveryAlert = 'Email notification to buyer or sales desk failed. Inquiry remains safely stored in database.';
          console.warn('[Resend Dispatch Notice]: Email delivery incomplete, but lead record preserved safely.');
        }
      } catch (eErr) {
        console.error('[Resend Email Dispatch Error]:', eErr.message);
        integrations.emailNotification = 'FAILED';
        integrations.emailDeliveryAlert = 'Email notification service unreachable. Inquiry preserved in primary database.';
      }
    }

    // 9. Dispatch to Google Sheets Webhook (Both Inquiries and Quotations)
    const GOOGLE_SHEETS_WEBHOOK = process.env.GOOGLE_SHEETS_WEBHOOK || process.env.VITE_GOOGLE_SHEETS_WEBHOOK;
    if (GOOGLE_SHEETS_WEBHOOK && !GOOGLE_SHEETS_WEBHOOK.includes('YOUR_DEPLOYMENT_ID')) {
      try {
        // Send Customer Inquiry row
        await fetch(GOOGLE_SHEETS_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetSheet: 'Customer Inquiries',
            type: 'CUSTOMER_INQUIRY',
            webhookSecret: process.env.CRM_WEBHOOK_SECRET || '',
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
            webhookSecret: process.env.CRM_WEBHOOK_SECRET || '',
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

    // 11. WhatsApp Webhook Dispatch (if configured and phone is provided)
    const PICKY_ASSIST_URL = process.env.PICKY_ASSIST_URL || '';
    if (PICKY_ASSIST_URL && isPhoneProvided) {
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
      leadPersistence: 'PERSISTED',
      message: 'Inquiry registered and quotation draft created successfully.',
      inquiryId,
      quoteId: quote.quoteId,
      inquiry: inquiryRecord,
      quote,
      quotationDraft: quote,
      notificationDeliveryStatus: {
        leadPersistence: supabaseLeadPersistence === 'SUCCESS' ? 'PERSISTED_SUPABASE' : (integrations.googleSheetsInquiry === 'SUCCESS' ? 'PERSISTED_SECONDARY_LEDGER' : 'PERSISTED_LOCAL_AND_EMAIL'),
        supabasePersistence: supabaseLeadPersistence,
        emailNotification: integrations.emailNotification,
        emailProviderAcceptance: integrations.emailProviderAcceptance,
        emailDeliveryAlert: integrations.emailDeliveryAlert,
        webhooks: {
          googleSheetsInquiry: integrations.googleSheetsInquiry,
          googleSheetsQuotation: integrations.googleSheetsQuotation,
          zapier: integrations.zapier,
          whatsapp: integrations.whatsapp
        }
      },
      integrations
    });

  } catch (err) {
    console.error('[Save Lead API] Critical error:', err.message);
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while processing the enquiry. Please contact us directly.'
    });
  }
}
