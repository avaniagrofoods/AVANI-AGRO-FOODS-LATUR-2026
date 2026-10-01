// ============================================================
// AVANI AGRO FOODS — CANONICAL QUOTATION MODEL (P4.3)
// Single Authoritative Schema for Qualified Lead -> Draft Quotation -> 
// Processor Verification -> Buyer Review -> Negotiation -> PO Handoff
// ============================================================

import {
  PRODUCT_MASTER,
  getProductById,
  matchProductMaster,
  parseQuantityKg,
  parseUnitRate,
  validateQuotation
} from './productMaster.js';

import {
  evaluateLeadQualification,
  CANONICAL_SPEC_MATCH
} from './qualificationModel.js';

import {
  calculateQuotation,
  DEFAULT_COMMERCIAL_TERMS
} from '../../api/_lib/quotationEngine.js';

import { sanitizeText } from './leadModel.js';

export const CANONICAL_QUOTATION_STATUSES = [
  'DRAFT',
  'PROCESSOR_CHECK',
  'READY_FOR_BUYER',
  'SENT_TO_BUYER',
  'NEGOTIATION',
  'REVISED',
  'ACCEPTED',
  'PO_RECEIVED',
  'CANCELLED'
];

export const PROCESSOR_VERIFICATION_STATUSES = [
  'PENDING',
  'PARTIALLY_CONFIRMED',
  'CONFIRMED',
  'REQUIRES_REVIEW'
];

export const PROCESSOR_CHECKLIST_DEFINITIONS = [
  { key: 'availabilityConfirmed', label: 'Manufacturing partner availability confirmed', mandatory: true },
  { key: 'capacityConfirmed', label: 'Requested quantity capacity confirmed', mandatory: true },
  { key: 'specificationConfirmed', label: 'Mesh specification confirmed', mandatory: true },
  { key: 'moistureConfirmed', label: 'Moisture specification confirmed', mandatory: true },
  { key: 'packagingConfirmed', label: 'Packaging confirmed', mandatory: true },
  { key: 'coaConfirmed', label: 'COA availability confirmed', mandatory: false },
  { key: 'testingConfirmed', label: 'Testing requirements confirmed', mandatory: false },
  { key: 'sampleConfirmed', label: 'Sample availability confirmed', mandatory: false },
  { key: 'leadTimeConfirmed', label: 'Production lead time confirmed', mandatory: true },
  { key: 'exportPackingConfirmed', label: 'Export packing / stuffing confirmed', mandatory: true }
];

export const SOURCING_POSITIONING_NOTICES = {
  PARTNER_ROLE: 'AVANI AGRO FOODS is an Indian sourcing and export trade coordination partner.',
  PROCESSOR_CONFIRMATION: 'Specification, capacity and availability are subject to confirmation with qualified Indian manufacturing/processing partners.',
  NON_MANUFACTURER_DISCLAIMER: 'AVANI AGRO FOODS coordinates sourcing, supplier communication and export documentation. AVANI is not a factory, direct processor, or farm owner.',
  partnerDisclaimer: 'AVANI AGRO FOODS is an Indian sourcing and export coordination partner. Manufacturing partner subject to confirmation.'
};

/**
 * Generate unique, canonical quotation ID
 * Format: AAF-Q-YYYY-XXXX (e.g. AAF-Q-2026-1001)
 */
export function generateQuotationId(year = new Date().getFullYear()) {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `AAF-Q-${year}-${rand}`;
}

/**
 * Validates whether a lead can create a Draft Quotation.
 * Returns { eligible: boolean, errors: string[], missingFields: string[], specMatch: string }
 */
export function validateLeadForQuotation(lead) {
  if (!lead || typeof lead !== 'object') {
    return {
      eligible: false,
      valid: false,
      errors: ['Lead object is missing or invalid'],
      reasons: ['Lead object is missing or invalid'],
      missingFields: ['lead'],
      specMatch: 'UNSUPPORTED'
    };
  }

  const errors = [];
  const missingFields = [];

  // 1. Verify leadId
  if (!lead.leadId || typeof lead.leadId !== 'string' || !lead.leadId.startsWith('AAF-L-')) {
    errors.push('Valid Lead ID (AAF-L-YYYY-XXXX) is required');
    missingFields.push('Lead ID');
  }

  // 2. Verify Buyer information
  const buyer = lead.buyer || {};
  if (!buyer.name || String(buyer.name).trim().length < 2) {
    errors.push('Buyer Contact Name is missing');
    missingFields.push('Buyer Contact Name');
  }
  if (!buyer.company || String(buyer.company).trim().length < 2) {
    errors.push('Company Name is missing');
    missingFields.push('Company Name');
  }
  const email = buyer.email ? String(buyer.email).trim() : '';
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Valid buyer business email is missing');
    missingFields.push('Business Email');
  }

  // 3. Verify Inquiry / Product
  const inquiry = lead.inquiry || {};
  const rawProduct = inquiry.product || '';
  if (!rawProduct || String(rawProduct).trim().length < 2) {
    errors.push('Inquired Product is missing');
    missingFields.push('Inquired Product');
  } else {
    const knownKeywords = ['moringa', 'onion', 'garlic', 'ginger', 'turmeric', 'curcumin', 'beet', 'beetroot'];
    const isSupported = knownKeywords.some(kw => rawProduct.toLowerCase().includes(kw));
    if (!isSupported) {
      errors.push(`Unsupported product "${rawProduct}". Only supported export products can be quoted.`);
      missingFields.push('Inquired Product');
    }
  }

  const pm = matchProductMaster(rawProduct);

  // 4. Verify Quantity
  const rawQ = inquiry.quantity;
  if (typeof rawQ === 'number' && rawQ <= 0) {
    errors.push('Order quantity must be a positive number greater than 0 KG');
    missingFields.push('Commercial Quantity');
  } else {
    const qty = parseQuantityKg(inquiry.quantity);
    if (!qty || qty <= 0) {
      errors.push('Order quantity must be a positive number greater than 0 KG');
      missingFields.push('Commercial Quantity');
    }
  }

  // 5. Verify Destination
  const destination = inquiry.destinationPort || inquiry.destination || buyer.country || '';
  if (!destination || String(destination).trim().length < 2) {
    errors.push('Destination port or country is missing');
    missingFields.push('Destination Port / Country');
  }

  // 6. Check Qualification assessment
  const qual = lead.qualification && (lead.qualification.qualificationStatus || lead.qualification.status)
    ? lead.qualification
    : evaluateLeadQualification(lead);

  const qualStatus = qual.qualificationStatus || qual.status;
  if (qualStatus === 'DISQUALIFIED') {
    errors.push('Lead has been marked as DISQUALIFIED');
  }

  const eligible = errors.length === 0;

  return {
    eligible,
    valid: eligible,
    errors,
    reasons: errors,
    missingFields,
    specMatch: qual.specificationMatch || (pm ? 'MATCH' : 'UNSUPPORTED'),
    qualificationStatus: qualStatus
  };
}

/**
 * Initializes empty processor verification state
 */
export function createInitialProcessorVerification(customNotes = []) {
  return {
    status: 'PENDING',
    availabilityConfirmed: false,
    capacityConfirmed: false,
    specificationConfirmed: false,
    moistureConfirmed: false,
    packagingConfirmed: false,
    coaConfirmed: false,
    testingConfirmed: false,
    sampleConfirmed: false,
    leadTimeConfirmed: false,
    exportPackingConfirmed: false,
    adminOverride: false,
    overrideReason: '',
    verifiedBy: '',
    verifiedAt: null,
    notes: Array.isArray(customNotes) ? customNotes : []
  };
}

/**
 * Evaluates current processor verification checklist and computes overall status:
 * 'PENDING' | 'PARTIALLY_CONFIRMED' | 'CONFIRMED' | 'REQUIRES_REVIEW'
 */
export function evaluateProcessorVerification(pv = {}) {
  if (!pv || typeof pv !== 'object') {
    return 'PENDING';
  }

  // Admin override takes precedence when provided with a recorded reason
  if (pv.adminOverride) {
    if (pv.overrideReason && String(pv.overrideReason).trim().length >= 5) {
      return 'CONFIRMED';
    }
    return 'REQUIRES_REVIEW';
  }

  // Check mandatory items
  const mandatoryKeys = PROCESSOR_CHECKLIST_DEFINITIONS.filter(d => d.mandatory).map(d => d.key);
  const allMandatoryConfirmed = mandatoryKeys.every(k => Boolean(pv[k]));

  const allKeys = PROCESSOR_CHECKLIST_DEFINITIONS.map(d => d.key);
  const confirmedCount = allKeys.filter(k => Boolean(pv[k])).length;

  if (confirmedCount === 0) {
    return 'PENDING';
  }

  if (allMandatoryConfirmed) {
    return 'CONFIRMED';
  }

  return 'PARTIALLY_CONFIRMED';
}

/**
 * Creates a Canonical Quotation Record from a Qualified Lead
 * Never invents prices or capacities.
 */
export function createQuotationFromLead(lead, overrides = {}) {
  const validation = validateLeadForQuotation(lead);
  if (!validation.eligible) {
    throw new Error(`Quotation cannot be prepared yet. Missing: ${validation.errors.join('; ')}`);
  }

  const buyer = lead.buyer || {};
  const inquiry = lead.inquiry || {};
  const pm = matchProductMaster(inquiry.product || '');

  // Strictly convert and preserve quantity
  const quantity = parseQuantityKg(inquiry.quantity);
  const quantityUnit = (inquiry.quantityUnit || 'KG').toUpperCase();

  // Destination and Incoterm
  const destinationPort = inquiry.destinationPort || inquiry.destination || 'FOB NHAVA SHEVA (JNPT MUMBAI)';
  const incoterm = (inquiry.incoterm || 'FOB NHAVA SHEVA (JNPT MUMBAI)').toUpperCase().trim();

  // Currency: defaults based on country or override
  const isDomestic = buyer.country && String(buyer.country).toLowerCase().includes('india');
  const currency = overrides.currency || (isDomestic ? 'INR' : 'USD');

  // Rate: If not explicitly supplied by admin, do NOT silently invent.
  // In internal draft, rate is null / 0, marking price status as PENDING_INTERNAL_INPUT.
  let unitRate = null;
  if (overrides.unitRate !== undefined && overrides.unitRate !== null && overrides.unitRate !== '') {
    unitRate = parseUnitRate(overrides.unitRate, null);
  } else if (overrides.rate !== undefined && overrides.rate !== null && overrides.rate !== '') {
    unitRate = parseUnitRate(overrides.rate, null);
  }

  const effectiveRateForCalc = unitRate !== null && unitRate > 0 ? unitRate : 0;
  const lineTotal = Number((quantity * effectiveRateForCalc).toFixed(2));

  const quoteId = overrides.quotationId || generateQuotationId();
  const now = new Date().toISOString();

  // Commercial requirement snapshot (IMMUTABLE source snapshot of lead requirement)
  const commercialRequirement = {
    productId: pm.productId,
    product: inquiry.product || pm.productName,
    hsCode: pm.hsCode,
    quantity,
    quantityUnit,
    specification: inquiry.specification || pm.fullDescription,
    mesh: inquiry.mesh || (pm.productId === 'moringa-leaf-powder' ? '80–100 Mesh' : '80–100 Mesh'),
    moisture: inquiry.moisture || (pm.productId === 'moringa-leaf-powder' ? 'Max 7–8%' : 'Max 5%'),
    packaging: inquiry.packaging || pm.defaultPackaging,
    destinationPort,
    incoterm,
    timeline: inquiry.timeline || '60–75 Days',
    targetPrice: inquiry.targetPrice || null,
    sampleRequired: Boolean(inquiry.sampleRequired),
    coaRequired: Boolean(inquiry.coaRequired),
    testingRequired: Boolean(inquiry.testingRequired),
    additionalRequirements: inquiry.additionalRequirements || ''
  };

  // Processor verification state
  const processorVerification = createInitialProcessorVerification([
    `Source Lead: ${lead.leadId}`,
    `Specification match status: ${validation.specMatch}`,
    `Awaiting processor confirmation for ${quantity.toLocaleString()} ${quantityUnit} of ${pm.productName}.`
  ]);

  // Initial single line item
  const items = [
    {
      sr: 1,
      id: 1,
      productId: pm.productId,
      name: pm.productName,
      description: commercialRequirement.specification,
      hscode: pm.hsCode,
      hsCode: pm.hsCode,
      quantity,
      unit: quantityUnit,
      rate: effectiveRateForCalc,
      unitRate: effectiveRateForCalc,
      total: lineTotal,
      amount: lineTotal,
      packaging: commercialRequirement.packaging
    }
  ];

  // Calculated quotation block
  const calculated = calculateQuotation({
    quoteId,
    inquiryId: lead.leadId,
    date: now.split('T')[0],
    validUntil: overrides.validUntil || '12 Oct 2026',
    customerName: buyer.name,
    companyName: buyer.company,
    country: buyer.country,
    email: buyer.email,
    phone: buyer.phone || buyer.whatsapp,
    currency,
    destinationPort,
    incoterm,
    items,
    freight: overrides.freight || 0,
    insurance: overrides.insurance || 0,
    documentation: overrides.documentation || 0,
    otherCharges: overrides.otherCharges || 0
  });

  const quotation = {
    quotationId: quoteId,
    leadId: lead.leadId,
    createdAt: now,
    updatedAt: now,
    status: 'DRAFT',
    priceStatus: unitRate !== null && unitRate > 0 ? 'PRICED' : 'PENDING_INTERNAL_INPUT',

    source: {
      channel: lead.source?.channel || 'website',
      leadId: lead.leadId
    },

    buyer: {
      name: sanitizeText(buyer.name || ''),
      company: sanitizeText(buyer.company || ''),
      country: sanitizeText(buyer.country || ''),
      email: sanitizeText(buyer.email || ''),
      phone: sanitizeText(buyer.phone || ''),
      whatsapp: sanitizeText(buyer.whatsapp || buyer.phone || '')
    },

    commercialRequirement,

    processorVerification,

    quotation: {
      currency,
      items: calculated.items,
      subtotal: calculated.subtotal,
      freight: calculated.freight,
      insurance: calculated.insurance,
      documentation: calculated.documentation,
      otherCharges: calculated.otherCharges,
      grandTotal: calculated.grandTotal
    },

    commercialTerms: {
      paymentTerms: '50% Advance Payment, Balance 50% Before Dispatch.',
      priceBasis: `${incoterm} Shipment terms (Final port details to be confirmed by Buyer).`,
      deliveryTimeline: 'Shipment within 60–75 days from the date of advance payment confirmation.',
      packaging: `${commercialRequirement.packaging} included.`,
      validityDate: calculated.validUntil || '12 Oct 2026',
      inspection: "Pre-dispatch inspection permitted at seller's warehouse at buyer's cost.",
      jurisdiction: 'All disputes are subject to the exclusive jurisdiction of competent courts in Latur, Maharashtra, India.'
    },

    workflow: {
      owner: overrides.owner || 'Sachin Shinde',
      nextAction: 'Review requirement with Indian processing partners and input unit rate.',
      buyerReviewDate: null,
      negotiationNotes: []
    },

    revision: {
      revisionNumber: 0,
      previousRevisionId: null,
      createdAt: now,
      changedBy: overrides.owner || 'Sachin Shinde',
      changeReason: 'Initial Draft Quotation created from Qualified Lead',
      changeSummary: `Draft created from lead ${lead.leadId}`
    },

    revisionHistory: [],

    negotiation: {
      buyerRequestedPrice: inquiry.targetPrice ? parseUnitRate(inquiry.targetPrice, null) : null,
      buyerRequestedQuantity: null,
      requestedChanges: '',
      internalCounterOffer: null,
      counterOfferDate: null,
      negotiationNotes: []
    },

    po: {
      poNumber: '',
      poDate: null,
      poFileReference: '',
      poNotes: '',
      receivedBy: ''
    },

    notices: SOURCING_POSITIONING_NOTICES,

    activity: [
      {
        timestamp: now,
        actor: overrides.owner || 'Sachin Shinde',
        event: 'LEAD_TO_QUOTATION',
        quotationId: quoteId,
        leadId: lead.leadId,
        details: `Draft Quotation created from Qualified Lead ${lead.leadId}`
      },
      {
        timestamp: now,
        actor: overrides.owner || 'Sachin Shinde',
        event: 'QUOTATION_CREATED',
        quotationId: quoteId,
        leadId: lead.leadId,
        details: `Quotation record initialized with DRAFT status`
      }
    ]
  };

  return quotation;
}

/**
 * Validates a proposed state transition
 */
export function validateStatusTransition(currentStatus, targetStatus, quotation = {}, options = {}) {
  const cur = String(currentStatus || 'DRAFT').toUpperCase();
  const tgt = String(targetStatus || '').toUpperCase();

  if (!CANONICAL_QUOTATION_STATUSES.includes(tgt)) {
    return {
      allowed: false,
      reason: `Unknown quotation target status: "${targetStatus}".`
    };
  }

  if (cur === tgt) {
    return { allowed: true, reason: 'Status unchanged' };
  }

  // Any state can be CANCELLED by admin with reason
  if (tgt === 'CANCELLED') {
    return { allowed: true };
  }

  // Allowed transitions state machine
  const allowedTransitions = {
    DRAFT: ['PROCESSOR_CHECK', 'READY_FOR_BUYER', 'CANCELLED'],
    PROCESSOR_CHECK: ['READY_FOR_BUYER', 'DRAFT', 'CANCELLED'],
    READY_FOR_BUYER: ['SENT_TO_BUYER', 'DRAFT', 'CANCELLED'],
    SENT_TO_BUYER: ['NEGOTIATION', 'ACCEPTED', 'REVISED', 'CANCELLED'],
    NEGOTIATION: ['REVISED', 'ACCEPTED', 'CANCELLED'],
    REVISED: ['READY_FOR_BUYER', 'SENT_TO_BUYER', 'NEGOTIATION', 'CANCELLED'],
    ACCEPTED: ['PO_RECEIVED', 'CANCELLED'],
    PO_RECEIVED: ['CANCELLED'],
    CANCELLED: ['DRAFT']
  };

  const validNextStates = allowedTransitions[cur] || [];
  if (!validNextStates.includes(tgt)) {
    return {
      allowed: false,
      reason: `Invalid status transition from ${cur} to ${tgt}.`
    };
  }

  // Gating requirements for READY_FOR_BUYER
  if (tgt === 'READY_FOR_BUYER') {
    const checklist = {
      buyerValid: Boolean(quotation.buyer?.name && quotation.buyer?.company && quotation.buyer?.email),
      productValid: Boolean(quotation.commercialRequirement?.product || quotation.quotation?.items?.[0]?.name),
      quantityValid: Boolean(Number(quotation.commercialRequirement?.quantity || quotation.quotation?.items?.[0]?.quantity) > 0),
      destinationValid: Boolean(quotation.commercialRequirement?.destinationPort),
      priceEntered: false,
      processorConfirmed: false
    };

    // Check pricing: first item rate must be > 0 and not null
    const firstItem = quotation.quotation?.items?.[0] || {};
    const rate = Number(firstItem.rate || firstItem.unitRate || 0);
    checklist.priceEntered = rate > 0;

    // Check processor verification
    const pv = quotation.processorVerification || {};
    const pvStatus = evaluateProcessorVerification(pv);
    checklist.processorConfirmed = pvStatus === 'CONFIRMED' || Boolean(pv.adminOverride && pv.overrideReason);

    if (!checklist.buyerValid) {
      return { allowed: false, reason: 'Buyer details (name, company, email) required before ready state.', checklist };
    }
    if (!checklist.quantityValid) {
      return { allowed: false, reason: 'Valid positive quantity required before ready state.', checklist };
    }
    if (!checklist.priceEntered) {
      return { allowed: false, reason: 'Unit rate required before buyer-ready quotation.', checklist };
    }
    if (!checklist.processorConfirmed) {
      return { allowed: false, reason: 'Processor verification mandatory requirements must be confirmed before ready state.', checklist };
    }

    return { allowed: true, checklist };
  }

  // Gating requirements for ACCEPTED
  if (tgt === 'ACCEPTED') {
    if (!['SENT_TO_BUYER', 'NEGOTIATION', 'REVISED'].includes(cur)) {
      return { allowed: false, reason: `Cannot mark ACCEPTED directly from ${cur}.` };
    }
  }

  // Gating requirements for PO_RECEIVED
  if (tgt === 'PO_RECEIVED') {
    if (cur !== 'ACCEPTED') {
      return { allowed: false, reason: `Quotation must be ACCEPTED before PO_RECEIVED.` };
    }
    const poNum = options.poNumber || quotation.po?.poNumber;
    if (!poNum || String(poNum).trim().length < 2) {
      return { allowed: false, reason: 'PO Number is required for PO_RECEIVED transition.' };
    }
  }

  return { allowed: true };
}

/**
 * Transitions Quotation Status with Audit Event Logging
 */
export function transitionQuotationStatus(quotation, targetStatus, actor = 'Sachin Shinde', details = {}) {
  const check = validateStatusTransition(quotation.status, targetStatus, quotation, details);
  if (!check.allowed) {
    throw new Error(`Status transition rejected: ${check.reason}`);
  }

  const now = new Date().toISOString();
  const oldStatus = quotation.status;
  quotation.status = targetStatus;
  quotation.updatedAt = now;

  let eventType = 'QUOTATION_UPDATED';
  let nextAction = quotation.workflow?.nextAction || '';

  if (targetStatus === 'PROCESSOR_CHECK') {
    eventType = 'PROCESSOR_CHECK_STARTED';
    nextAction = 'Confirm product specification, moisture, and capacity with manufacturing partner.';
  } else if (targetStatus === 'READY_FOR_BUYER') {
    eventType = 'QUOTATION_UPDATED';
    quotation.workflow.buyerReviewDate = now;
    nextAction = 'Review commercial quotation with Buyer and provide Proforma details.';
  } else if (targetStatus === 'SENT_TO_BUYER') {
    eventType = 'QUOTATION_SENT';
    nextAction = 'Follow up with Buyer regarding formal acceptance or clarification.';
  } else if (targetStatus === 'NEGOTIATION') {
    eventType = 'NEGOTIATION_STARTED';
    nextAction = 'Review buyer requested terms and evaluate internal counter-offer.';
  } else if (targetStatus === 'ACCEPTED') {
    eventType = 'QUOTATION_ACCEPTED';
    nextAction = 'Request formal Purchase Order (PO) and arrange 50% advance invoice.';
  } else if (targetStatus === 'PO_RECEIVED') {
    eventType = 'PO_RECEIVED';
    nextAction = 'Coordinate production schedule and dispatch timeline with processing partner.';
  } else if (targetStatus === 'CANCELLED') {
    eventType = 'QUOTATION_CANCELLED';
    nextAction = 'Archived quotation. No further action.';
  }

  quotation.workflow = {
    ...quotation.workflow,
    nextAction
  };

  quotation.activity = quotation.activity || [];
  quotation.activity.push({
    timestamp: now,
    actor,
    event: eventType,
    quotationId: quotation.quotationId,
    leadId: quotation.leadId,
    details: details.reason || `Status transitioned from ${oldStatus} to ${targetStatus}`
  });

  return quotation;
}

/**
 * Creates a new Revision of an existing quotation without destroying previous records.
 */
export function reviseQuotation(quotation, changes = {}, changeReason = '', changedBy = 'Sachin Shinde') {
  if (!quotation || typeof quotation !== 'object') {
    throw new Error('Valid quotation object required for revision');
  }

  const now = new Date().toISOString();
  const currentRevisionNumber = quotation.revision?.revisionNumber || 0;
  const newRevisionNumber = currentRevisionNumber + 1;

  // Snapshot the current version into revisionHistory
  const snapshot = {
    revisionNumber: currentRevisionNumber,
    previousRevisionId: quotation.revision?.previousRevisionId || null,
    savedAt: now,
    changedBy: quotation.revision?.changedBy || changedBy,
    changeReason: quotation.revision?.changeReason || 'Previous revision',
    changeSummary: quotation.revision?.changeSummary || `Revision ${currentRevisionNumber}`,
    quotationSnapshot: {
      status: quotation.status,
      quotation: JSON.parse(JSON.stringify(quotation.quotation)),
      commercialTerms: JSON.parse(JSON.stringify(quotation.commercialTerms)),
      processorVerification: JSON.parse(JSON.stringify(quotation.processorVerification))
    }
  };

  quotation.revisionHistory = quotation.revisionHistory || [];
  quotation.revisionHistory.push(snapshot);

  // Update revision pointer
  quotation.revision = {
    revisionNumber: newRevisionNumber,
    previousRevisionId: `${quotation.quotationId}-R${currentRevisionNumber}`,
    createdAt: now,
    changedBy,
    changeReason: changeReason || `Commercial revision ${newRevisionNumber}`,
    changeSummary: changes.summary || `Updated pricing or specification parameters for Rev ${newRevisionNumber}`
  };

  // Apply changes to quotation items / terms
  const updatedItems = (changes.items || quotation.quotation.items).map((item, idx) => {
    const qty = parseQuantityKg(item.quantity);
    const rate = parseUnitRate(item.rate !== undefined ? item.rate : item.unitRate, 0);
    const total = Number((qty * rate).toFixed(2));
    return {
      ...item,
      quantity: qty,
      rate,
      unitRate: rate,
      total,
      amount: total
    };
  });

  // Re-run single source of truth calculation engine
  const recalculated = calculateQuotation({
    quoteId: quotation.quotationId,
    inquiryId: quotation.leadId,
    date: quotation.createdAt.split('T')[0],
    validUntil: changes.validUntil || quotation.commercialTerms?.validityDate,
    customerName: quotation.buyer?.name,
    companyName: quotation.buyer?.company,
    country: quotation.buyer?.country,
    email: quotation.buyer?.email,
    phone: quotation.buyer?.phone,
    currency: changes.currency || quotation.quotation?.currency,
    destinationPort: changes.destinationPort || quotation.commercialRequirement?.destinationPort,
    incoterm: changes.incoterm || quotation.commercialRequirement?.incoterm,
    items: updatedItems,
    freight: changes.freight !== undefined ? changes.freight : quotation.quotation?.freight,
    insurance: changes.insurance !== undefined ? changes.insurance : quotation.quotation?.insurance,
    documentation: changes.documentation !== undefined ? changes.documentation : quotation.quotation?.documentation,
    otherCharges: changes.otherCharges !== undefined ? changes.otherCharges : quotation.quotation?.otherCharges
  });

  quotation.quotation = {
    currency: recalculated.currency,
    items: recalculated.items,
    subtotal: recalculated.subtotal,
    freight: recalculated.freight,
    insurance: recalculated.insurance,
    documentation: recalculated.documentation,
    otherCharges: recalculated.otherCharges,
    grandTotal: recalculated.grandTotal
  };

  quotation.status = 'REVISED';
  quotation.updatedAt = now;

  // Add audit trail entry
  quotation.activity = quotation.activity || [];
  quotation.activity.push({
    timestamp: now,
    actor: changedBy,
    event: 'QUOTATION_REVISED',
    quotationId: quotation.quotationId,
    leadId: quotation.leadId,
    details: `Created Revision ${newRevisionNumber}. Reason: ${changeReason || 'Commercial adjustment'}`
  });

  return quotation;
}

/**
 * Updates negotiation parameters without overwriting the original buyer inquiry
 */
export function updateNegotiation(quotation, negotiationData = {}, actor = 'Sachin Shinde') {
  if (!quotation || typeof quotation !== 'object') {
    throw new Error('Valid quotation object required');
  }

  const now = new Date().toISOString();
  quotation.negotiation = quotation.negotiation || {};

  if (negotiationData.buyerRequestedPrice !== undefined) {
    quotation.negotiation.buyerRequestedPrice = parseUnitRate(negotiationData.buyerRequestedPrice, null);
  }
  if (negotiationData.buyerRequestedQuantity !== undefined) {
    quotation.negotiation.buyerRequestedQuantity = parseQuantityKg(negotiationData.buyerRequestedQuantity);
  }
  if (negotiationData.requestedChanges !== undefined) {
    quotation.negotiation.requestedChanges = String(negotiationData.requestedChanges || '').trim();
  }
  if (negotiationData.internalCounterOffer !== undefined) {
    quotation.negotiation.internalCounterOffer = parseUnitRate(negotiationData.internalCounterOffer, null);
    quotation.negotiation.counterOfferDate = now;
  }
  if (negotiationData.note) {
    quotation.negotiation.negotiationNotes = quotation.negotiation.negotiationNotes || [];
    quotation.negotiation.negotiationNotes.push({
      date: now,
      author: actor,
      note: String(negotiationData.note).trim()
    });
  }

  quotation.status = 'NEGOTIATION';
  quotation.updatedAt = now;

  quotation.activity = quotation.activity || [];
  quotation.activity.push({
    timestamp: now,
    actor,
    event: 'NEGOTIATION_UPDATED',
    quotationId: quotation.quotationId,
    leadId: quotation.leadId,
    details: negotiationData.note || 'Updated negotiation terms'
  });

  return quotation;
}

/**
 * Records PO Receipt administrative details
 */
export function recordPoReceipt(quotation, poData = {}, actor = 'Sachin Shinde') {
  if (!quotation || typeof quotation !== 'object') {
    throw new Error('Valid quotation object required');
  }

  const poNumber = String(poData.poNumber || '').trim();
  if (!poNumber || poNumber.length < 2) {
    throw new Error('PO Number is mandatory to record PO receipt');
  }

  const now = new Date().toISOString();
  quotation.po = {
    poNumber,
    poDate: poData.poDate || now.split('T')[0],
    poFileReference: String(poData.poFileReference || '').trim(),
    poNotes: String(poData.poNotes || '').trim(),
    receivedBy: actor
  };

  quotation.status = 'PO_RECEIVED';
  quotation.updatedAt = now;
  quotation.workflow = {
    ...quotation.workflow,
    nextAction: `Purchase Order ${poNumber} received. Coordinate manufacturing schedule with partner.`
  };

  quotation.activity = quotation.activity || [];
  quotation.activity.push({
    timestamp: now,
    actor,
    event: 'PO_RECEIVED',
    quotationId: quotation.quotationId,
    leadId: quotation.leadId,
    details: `PO ${poNumber} recorded. Notes: ${poData.poNotes || 'None'}`
  });

  return quotation;
}

/**
 * Updates processor verification checklist items and records audit event
 */
export function updateProcessorChecklist(quotation, updates = {}, actor = 'Sachin Shinde') {
  if (!quotation || typeof quotation !== 'object') {
    throw new Error('Valid quotation object required');
  }

  const now = new Date().toISOString();
  quotation.processorVerification = quotation.processorVerification || createInitialProcessorVerification();

  PROCESSOR_CHECKLIST_DEFINITIONS.forEach(item => {
    if (updates[item.key] !== undefined) {
      quotation.processorVerification[item.key] = Boolean(updates[item.key]);
    }
  });

  if (updates.adminOverride !== undefined) {
    quotation.processorVerification.adminOverride = Boolean(updates.adminOverride);
    quotation.processorVerification.overrideReason = String(updates.overrideReason || '').trim();
  }

  if (updates.notes) {
    if (Array.isArray(updates.notes)) {
      quotation.processorVerification.notes = updates.notes;
    } else if (typeof updates.notes === 'string' && updates.notes.trim()) {
      quotation.processorVerification.notes = quotation.processorVerification.notes || [];
      quotation.processorVerification.notes.push(updates.notes.trim());
    }
  }

  quotation.processorVerification.status = evaluateProcessorVerification(quotation.processorVerification);
  quotation.processorVerification.verifiedBy = actor;
  quotation.processorVerification.verifiedAt = now;
  quotation.updatedAt = now;

  const eventName = quotation.processorVerification.status === 'CONFIRMED'
    ? 'PROCESSOR_REQUIREMENT_CONFIRMED'
    : 'PROCESSOR_CHECK_STARTED';

  quotation.activity = quotation.activity || [];
  quotation.activity.push({
    timestamp: now,
    actor,
    event: eventName,
    quotationId: quotation.quotationId,
    leadId: quotation.leadId,
    details: `Processor verification updated. Status: ${quotation.processorVerification.status}`
  });

  return quotation;
}

// ESM aliases and helper re-exports
export const PROCESSOR_CHECKLIST_ITEMS = PROCESSOR_CHECKLIST_DEFINITIONS;
export const POSITIONING_NOTICES = SOURCING_POSITIONING_NOTICES;
export {
  parseQuantityKg,
  parseUnitRate,
  matchProductMaster,
  PRODUCT_MASTER,
  sanitizeText,
  DEFAULT_COMMERCIAL_TERMS
};

// CommonJS compatibility export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CANONICAL_QUOTATION_STATUSES,
    PROCESSOR_VERIFICATION_STATUSES,
    PROCESSOR_CHECKLIST_DEFINITIONS,
    PROCESSOR_CHECKLIST_ITEMS: PROCESSOR_CHECKLIST_DEFINITIONS,
    SOURCING_POSITIONING_NOTICES,
    POSITIONING_NOTICES: SOURCING_POSITIONING_NOTICES,
    generateQuotationId,
    validateLeadForQuotation,
    createInitialProcessorVerification,
    evaluateProcessorVerification,
    createQuotationFromLead,
    validateStatusTransition,
    transitionQuotationStatus,
    reviseQuotation,
    updateNegotiation,
    recordPoReceipt,
    updateProcessorChecklist,
    parseQuantityKg,
    parseUnitRate,
    matchProductMaster,
    PRODUCT_MASTER,
    sanitizeText,
    DEFAULT_COMMERCIAL_TERMS
  };
}
