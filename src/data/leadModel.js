// ============================================================
// AVANI AGRO FOODS — CANONICAL B2B LEAD MODEL (P4.1)
// Single Authoritative Schema for Website RFQ -> Lead Record -> Qualification
// ============================================================

import { matchProductMaster, parseQuantityKg } from './productMaster.js';

export const CANONICAL_LEAD_STATUS = [
  'NEW',
  'RESEARCH',
  'CONTACTED',
  'CONNECTED',
  'QUALIFIED',
  'REQUIREMENT_RECEIVED',
  'SAMPLE',
  'QUOTE',
  'NEGOTIATION',
  'PO',
  'REPEAT',
  'LOST',
  'NURTURE'
];

export const CANONICAL_WORKFLOW_STATUS = [
  'NEW',
  'UNDER_REVIEW',
  'PROCESSOR_SOURCING',
  'SAMPLE_PENDING',
  'QUOTE_DRAFT',
  'QUOTE_SENT',
  'CLOSED'
];

/**
 * Generate unique, stable lead identifier
 * Format: AAF-L-YYYY-XXXX (e.g. AAF-L-2026-1001)
 */
export function generateLeadId(year = new Date().getFullYear()) {
  const randSeq = Math.floor(1000 + Math.random() * 9000);
  return `AAF-L-${year}-${randSeq}`;
}

/**
 * Sanitize string against XSS, HTML tags, and excessive length
 */
export function sanitizeString(input, maxLength = 255) {
  if (input === null || input === undefined) return '';
  const s = String(input)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Strip script tags and inner content
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')   // Strip style tags and inner content
    .replace(/<[^>]*>?/gm, '') // Strip all remaining HTML tags
    .replace(/[<>'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case "'": return '&#39;';
        case '"': return '&quot;';
        default: return c;
      }
    })
    .trim();
  return s.length > maxLength ? s.substring(0, maxLength) : s;
}

/**
 * Normalizes incoming RFQ payload from various form sources
 */
export function normalizeIncomingPayload(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {};
  }
  const buyer = input.buyer || {};
  const inquiry = input.inquiry || {};
  return {
    fullName: input.fullName || input.name || buyer.name || '',
    companyName: input.companyName || input.company || buyer.company || '',
    country: input.country || buyer.country || inquiry.destination || 'India',
    email: input.email || buyer.email || '',
    phone: input.phone || input.mobile || buyer.phone || buyer.whatsapp || '',
    whatsapp: input.whatsapp || buyer.whatsapp || input.phone || '',
    product: input.product || inquiry.product || input.productName || '',
    quantity: input.quantity !== undefined ? input.quantity : inquiry.quantity,
    quantityUnit: input.quantityUnit || inquiry.quantityUnit || 'KG',
    packaging: input.packaging || inquiry.packaging || '',
    destinationPort: input.destinationPort || input.destination || inquiry.destinationPort || inquiry.destination || '',
    incoterm: input.incoterm || inquiry.incoterm || 'FOB Nhava Sheva (JNPT Mumbai)',
    mesh: input.mesh || input.meshSize || inquiry.mesh || '',
    moisture: input.moisture || inquiry.moisture || '',
    timeline: input.timeline || input.deliveryTimeline || inquiry.timeline || '',
    sampleRequired: input.sampleRequired !== undefined ? input.sampleRequired : inquiry.sampleRequired,
    coaRequired: input.coaRequired !== undefined ? input.coaRequired : inquiry.coaRequired,
    testingRequired: input.testingRequired !== undefined ? input.testingRequired : inquiry.testingRequired,
    additionalRequirements: input.additionalRequirements || input.message || inquiry.additionalRequirements || '',
    source: input.source || input.sourceChannel || 'Website_Contact_RFQ',
    page: input.page || input.sourcePage || '/contact',
    campaign: input.campaign || '',
    referrer: input.referrer || '',
    utm_source: input.utm_source || '',
    utm_medium: input.utm_medium || '',
    utm_campaign: input.utm_campaign || '',
    utm_content: input.utm_content || '',
    buyerType: input.buyerType || input.businessType || 'Importer'
  };
}

/**
 * Validates RFQ payload strictly before lead creation
 * Returns: { valid: boolean, error?: string, errors: string[], sanitized?: object, lead?: object }
 */
export function validateLeadPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { valid: false, error: 'Invalid or missing payload. Expected JSON object.', errors: ['Invalid JSON payload.'] };
  }

  const errors = [];

  // 0. Payload Size & LeadId Format Checks
  try {
    const rawLen = JSON.stringify(payload).length;
    if (rawLen > 50000) {
      errors.push('Maximum payload limit exceeded (50KB maximum).');
    }
  } catch (e) {}

  if (payload.leadId && !/^AAF-L-\d{4}-\d{4,6}$/.test(payload.leadId)) {
    errors.push('Invalid leadId format. Expected AAF-L-YYYY-XXXX.');
  }

  // Flatten potential nested buyer/inquiry structures
  const buyer = payload.buyer || {};
  const inquiry = payload.inquiry || {};

  const name = sanitizeString(payload.fullName || payload.name || buyer.name, 150);
  const company = sanitizeString(payload.companyName || payload.company || buyer.company, 150);
  const email = String(payload.email || buyer.email || '').trim().toLowerCase();
  const phone = sanitizeString(payload.phone || payload.mobile || buyer.phone || buyer.whatsapp, 50);
  const country = sanitizeString(payload.country || buyer.country || inquiry.destination || 'India', 100);

  const rawProduct = sanitizeString(payload.product || inquiry.product || payload.productName, 150);
  const rawQuantity = payload.quantity !== undefined ? payload.quantity : inquiry.quantity;
  const rawRequirement = sanitizeString(payload.additionalRequirements || payload.message || payload.buyerRequirement || payload.additionalMessage || inquiry.additionalRequirements, 1000);

  // 1. Buyer Validation
  if (!name || name.length < 2) {
    errors.push('Buyer Full Name is required (minimum 2 characters).');
  }
  if (!company || company.length < 2) {
    errors.push('Company name is required (minimum 2 characters).');
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email) || email.length > 150) {
    errors.push('Valid email address is required.');
  }

  // 2. Product Validation
  if (!rawProduct || rawProduct.trim() === '') {
    errors.push('Product selection is required.');
  } else {
    const q = rawProduct.toLowerCase().trim();
    const knownKeywords = ['moringa', 'onion', 'garlic', 'ginger', 'turmeric', 'curcumin', 'beet', 'beetroot'];
    const isSupported = knownKeywords.some(k => q.includes(k));
    if (!isSupported) {
      errors.push(`Requested product "${rawProduct}" is currently unsupported in our verified export catalog.`);
    }
  }

  const pm = rawProduct ? matchProductMaster(rawProduct) : null;

  // 3. Quantity Validation (P3-hardened: quantity must be positive, explicit, and separate from packaging)
  if (rawQuantity === undefined || rawQuantity === null || (typeof rawQuantity === 'string' && rawQuantity.trim() === '')) {
    errors.push('Quantity must be greater than zero. Please specify requested quantity in KG or MT.');
  } else if (typeof rawQuantity === 'number' && rawQuantity <= 0) {
    errors.push('Quantity must be greater than zero.');
  } else if (typeof rawQuantity === 'string' && (rawQuantity.trim().startsWith('-') || /-\s*\d+/.test(rawQuantity))) {
    errors.push('Quantity must be greater than zero.');
  }

  let normalizedQty = 0;
  if (rawQuantity !== undefined && rawQuantity !== null && rawQuantity !== '') {
    normalizedQty = parseQuantityKg(rawQuantity);
    if (normalizedQty <= 0 && !errors.some(e => e.includes('Quantity must be greater than zero'))) {
      errors.push('Quantity must be greater than zero.');
    }
  }

  // 4. Destination Validation
  const destination = sanitizeString(payload.destinationPort || payload.destination || inquiry.destinationPort || inquiry.destination, 150);
  if (!destination || destination.trim() === '') {
    errors.push('Destination country or port is required.');
  }

  if (errors.length > 0) {
    return {
      valid: false,
      error: errors[0],
      errors
    };
  }

  const sanitized = {
    name,
    company,
    email,
    phone,
    country,
    product: pm.productName,
    productId: pm.productId,
    hsCode: pm.hsCode,
    quantity: normalizedQty,
    rawQuantity: String(rawQuantity).trim(),
    rawRequirement,
    destination,
    incoterm: sanitizeString(payload.incoterm || inquiry.incoterm || 'FOB Nhava Sheva (JNPT Mumbai)', 100),
    mesh: sanitizeString(payload.mesh || payload.meshSize || inquiry.mesh || 'Standard (80–100 Mesh)', 50),
    moisture: sanitizeString(payload.moisture || inquiry.moisture || 'Standard (Max 7–8%)', 50),
    packaging: sanitizeString(payload.packaging || inquiry.packaging || pm.defaultPackaging, 100),
    timeline: sanitizeString(payload.timeline || payload.deliveryTimeline || inquiry.timeline || 'Shipment within 60–75 days', 100),
    targetPrice: sanitizeString(payload.targetPrice || inquiry.targetPrice, 50),
    sampleRequired: Boolean(payload.sampleRequired || inquiry.sampleRequired),
    coaRequired: Boolean(payload.coaRequired || inquiry.coaRequired),
    testingRequired: Boolean(payload.testingRequired || inquiry.testingRequired),
    sourceChannel: sanitizeString(payload.source || payload.sourceChannel || 'Website_Contact_RFQ', 100),
    sourcePage: sanitizeString(payload.page || payload.sourcePage || '/contact', 100),
    campaign: sanitizeString(payload.campaign || '', 100),
    referrer: sanitizeString(payload.referrer || '', 255),
    utmSource: sanitizeString(payload.utm_source || '', 100),
    utmMedium: sanitizeString(payload.utm_medium || '', 100),
    utmCampaign: sanitizeString(payload.utm_campaign || '', 100),
    utmContent: sanitizeString(payload.utm_content || '', 100),
    buyerType: sanitizeString(payload.businessType || payload.buyerType || 'Importer', 50)
  };

  const lead = createLeadRecord(sanitized);

  return {
    valid: true,
    errors: [],
    sanitized,
    lead
  };
}

/**
 * Creates a complete Canonical Lead Record from validated RFQ inputs
 */
export function createLeadRecord(validatedData) {
  const timestamp = new Date().toISOString();
  const leadId = validatedData.leadId || generateLeadId();

  return {
    leadId,
    createdAt: timestamp,
    updatedAt: timestamp,

    source: {
      channel: validatedData.sourceChannel || 'website',
      page: validatedData.sourcePage || '/contact',
      campaign: validatedData.campaign || null,
      referrer: validatedData.referrer || null,
      utm_source: validatedData.utmSource || null,
      utm_medium: validatedData.utmMedium || null,
      utm_campaign: validatedData.utmCampaign || null,
      utm_content: validatedData.utmContent || null
    },

    buyer: {
      name: validatedData.name,
      company: validatedData.company,
      country: validatedData.country,
      email: validatedData.email,
      phone: validatedData.phone,
      whatsapp: validatedData.phone
    },

    inquiry: {
      productId: validatedData.productId,
      product: validatedData.product,
      hsCode: validatedData.hsCode,
      quantity: validatedData.quantity,
      quantityUnit: 'KG',
      rawQuantityInput: validatedData.rawQuantity,
      specification: `${validatedData.mesh}, Moisture ${validatedData.moisture}`,
      mesh: validatedData.mesh,
      moisture: validatedData.moisture,
      packaging: validatedData.packaging,
      destination: validatedData.destination,
      destinationPort: validatedData.destination,
      incoterm: validatedData.incoterm,
      timeline: validatedData.timeline,
      targetPrice: validatedData.targetPrice || null,
      sampleRequired: validatedData.sampleRequired,
      coaRequired: validatedData.coaRequired,
      testingRequired: validatedData.testingRequired,
      additionalRequirements: validatedData.rawRequirement || null
    },

    qualification: {
      status: 'NEW',
      buyerType: validatedData.buyerType || 'Importer',
      purchaseTimeline: validatedData.timeline || 'Immediate / 60–75 Days',
      decisionMakerKnown: false
    },

    workflow: {
      status: 'NEW',
      nextAction: 'Review requirement & coordinate with Indian processors for batch specs',
      owner: 'Sachin Shinde'
    },

    activity: [
      {
        type: 'RFQ_SUBMITTED',
        timestamp,
        actor: 'BUYER'
      }
    ],

    notes: []
  };
}

export const sanitizeText = sanitizeString;

// CommonJS compatibility export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CANONICAL_LEAD_STATUS,
    CANONICAL_WORKFLOW_STATUS,
    generateLeadId,
    sanitizeString,
    sanitizeText: sanitizeString,
    normalizeIncomingPayload,
    validateLeadPayload,
    createLeadRecord
  };
}
