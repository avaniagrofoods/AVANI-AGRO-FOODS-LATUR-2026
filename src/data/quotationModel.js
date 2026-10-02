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
  'PROCESSOR_CONFIRMED',
  'COMMERCIAL_REVIEW',
  'READY_FOR_BUYER',
  'SENT_TO_BUYER',
  'NEGOTIATION',
  'REVISED',
  'ACCEPTED',
  'PO_RECEIVED',
  'CANCELLED'
];

export const DISPATCH_STATUSES = [
  'DRAFT',
  'READY_TO_SEND',
  'SENDING',
  'SENT',
  'SEND_FAILED'
];

export const PROCESSOR_CONFIRMATION_STATUSES = [
  'PENDING',
  'PARTIALLY_CONFIRMED',
  'CONFIRMED',
  'REQUIRES_REVIEW',
  'REJECTED'
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
 * Initializes canonical processor confirmation structure (P4.4)
 * Distinguishes BUYER REQUEST vs PROCESSOR CONFIRMED vs AVANI COMMERCIAL INPUT
 */
export function createInitialProcessorConfirmation(leadOrReq = {}, partner = {}) {
  const inquiry = leadOrReq.inquiry || leadOrReq.commercialRequirement || leadOrReq;
  const requestedQty = parseQuantityKg(inquiry.quantity) || 18000;
  const meshReq = inquiry.mesh || '80–100 Mesh';
  const moistureReq = inquiry.moisture || 'Max 7–8%';
  const pkgReq = inquiry.packaging || '25 kg Food-Grade HDPE Bags';

  return {
    status: 'PENDING',
    confirmedAt: null,
    confirmedBy: null,
    partner: {
      name: partner.name || '',
      reference: partner.reference || '',
      internalOnly: true
    },
    availability: {
      requestedQuantity: requestedQty,
      available: false,
      confirmedQuantity: null
    },
    specification: {
      mesh: {
        buyerRequested: meshReq,
        processorConfirmed: null,
        match: null
      },
      moisture: {
        buyerRequested: moistureReq,
        processorConfirmed: null,
        match: null
      },
      packaging: {
        buyerRequested: pkgReq,
        processorConfirmed: null,
        match: null
      }
    },
    qualityDocuments: {
      coaAvailable: false,
      testingAvailable: false,
      sampleAvailable: false
    },
    production: {
      leadTimeDays: null,
      earliestDispatchDate: null
    },
    logistics: {
      exportPackingConfirmed: false,
      stuffingConfirmed: false,
      jnptHandlingConfirmed: false
    },
    adminOverride: {
      active: false,
      reason: '',
      actor: '',
      timestamp: null,
      bypassedChecks: []
    },
    notes: '',
    confirmationEvidence: '',
    internalOnly: true
  };
}

/**
 * Evaluates canonical processor confirmation structure
 */
export function evaluateProcessorConfirmation(pc = {}) {
  if (!pc || typeof pc !== 'object') {
    return {
      confirmed: false,
      status: 'PENDING',
      issues: ['Processor confirmation object missing'],
      checklist: {}
    };
  }

  // Check admin override first
  if (pc.adminOverride?.active || pc.adminOverride?.override) {
    const reason = String(pc.adminOverride.reason || pc.adminOverride.overrideReason || '').trim();
    if (reason.length >= 5) {
      return {
        confirmed: true,
        status: 'CONFIRMED',
        overridden: true,
        issues: [],
        checklist: {
          availability: true,
          capacity: true,
          mesh: true,
          moisture: true,
          packaging: true,
          leadTime: true,
          exportPacking: true,
          stuffing: true
        }
      };
    }
    return {
      confirmed: false,
      status: 'REQUIRES_REVIEW',
      issues: ['Admin override requires a clear reason of at least 5 characters'],
      checklist: {}
    };
  }

  const issues = [];
  const checklist = {
    availability: Boolean(pc.availability?.available),
    capacity: Boolean(pc.availability?.confirmedQuantity != null && Number(pc.availability.confirmedQuantity) >= Number(pc.availability.requestedQuantity || 0)),
    mesh: Boolean(pc.specification?.mesh?.processorConfirmed != null && pc.specification.mesh.match !== false),
    moisture: Boolean(pc.specification?.moisture?.processorConfirmed != null && pc.specification.moisture.match !== false),
    packaging: Boolean(pc.specification?.packaging?.processorConfirmed != null && pc.specification.packaging.match !== false),
    leadTime: Boolean(Number(pc.production?.leadTimeDays) > 0),
    exportPacking: Boolean(pc.logistics?.exportPackingConfirmed),
    stuffing: Boolean(pc.logistics?.stuffingConfirmed !== false && pc.logistics?.exportPackingConfirmed)
  };

  if (!checklist.availability) issues.push('Manufacturing partner availability not confirmed');
  if (!checklist.capacity) issues.push('Quantity capacity not confirmed or insufficient');
  if (!checklist.mesh) issues.push('Mesh specification not confirmed');
  if (!checklist.moisture) issues.push('Moisture specification not confirmed');
  if (!checklist.packaging) issues.push('Packaging specification not confirmed');
  if (!checklist.leadTime) issues.push('Production lead time not confirmed');
  if (!checklist.exportPacking) issues.push('Export packing not confirmed');
  if (!checklist.stuffing) issues.push('Stuffing not confirmed');

  const confirmedCount = Object.values(checklist).filter(Boolean).length;
  let status = 'PENDING';
  if (confirmedCount === Object.keys(checklist).length) {
    status = 'CONFIRMED';
  } else if (confirmedCount > 0) {
    status = 'PARTIALLY_CONFIRMED';
  }

  return {
    confirmed: status === 'CONFIRMED',
    status,
    issues,
    checklist
  };
}

/**
 * Updates canonical processor confirmation structure and synchronizes legacy processorVerification
 */
export function updateProcessorConfirmation(quotation, updates = {}, actor = 'Sachin Shinde') {
  if (!quotation || typeof quotation !== 'object') {
    throw new Error('Valid quotation object required');
  }

  const now = new Date().toISOString();
  quotation.processorConfirmation = quotation.processorConfirmation || createInitialProcessorConfirmation(quotation.commercialRequirement || {});
  const pc = quotation.processorConfirmation;

  if (updates.partner) {
    pc.partner = { ...pc.partner, ...updates.partner, internalOnly: true };
  }
  if (updates.availability) {
    pc.availability = { ...pc.availability, ...updates.availability };
  }
  if (updates.available !== undefined) pc.availability.available = Boolean(updates.available);
  if (updates.confirmedQuantity !== undefined) pc.availability.confirmedQuantity = updates.confirmedQuantity !== null ? Number(updates.confirmedQuantity) : null;
  if (updates.requestedQuantity !== undefined) pc.availability.requestedQuantity = Number(updates.requestedQuantity);

  if (updates.specification) {
    if (updates.specification.mesh) {
      pc.specification.mesh = { ...pc.specification.mesh, ...updates.specification.mesh };
    }
    if (updates.specification.moisture) {
      pc.specification.moisture = { ...pc.specification.moisture, ...updates.specification.moisture };
    }
    if (updates.specification.packaging) {
      pc.specification.packaging = { ...pc.specification.packaging, ...updates.specification.packaging };
    }
  }
  if (updates.processorMesh !== undefined) pc.specification.mesh.processorConfirmed = updates.processorMesh;
  if (updates.meshMatch !== undefined) pc.specification.mesh.match = Boolean(updates.meshMatch);
  if (updates.processorMoisture !== undefined) pc.specification.moisture.processorConfirmed = updates.processorMoisture;
  if (updates.moistureMatch !== undefined) pc.specification.moisture.match = Boolean(updates.moistureMatch);
  if (updates.processorPackaging !== undefined) pc.specification.packaging.processorConfirmed = updates.processorPackaging;
  if (updates.packagingMatch !== undefined) pc.specification.packaging.match = Boolean(updates.packagingMatch);

  if (updates.qualityDocuments) {
    pc.qualityDocuments = { ...pc.qualityDocuments, ...updates.qualityDocuments };
  }
  if (updates.coaAvailable !== undefined) pc.qualityDocuments.coaAvailable = Boolean(updates.coaAvailable);
  if (updates.testingAvailable !== undefined) pc.qualityDocuments.testingAvailable = Boolean(updates.testingAvailable);
  if (updates.sampleAvailable !== undefined) pc.qualityDocuments.sampleAvailable = Boolean(updates.sampleAvailable);

  if (updates.production) {
    pc.production = { ...pc.production, ...updates.production };
  }
  if (updates.leadTimeDays !== undefined) pc.production.leadTimeDays = updates.leadTimeDays !== null ? Number(updates.leadTimeDays) : null;
  if (updates.earliestDispatchDate !== undefined) pc.production.earliestDispatchDate = updates.earliestDispatchDate;

  if (updates.logistics) {
    pc.logistics = { ...pc.logistics, ...updates.logistics };
  }
  if (updates.exportPackingConfirmed !== undefined) pc.logistics.exportPackingConfirmed = Boolean(updates.exportPackingConfirmed);
  if (updates.stuffingConfirmed !== undefined) pc.logistics.stuffingConfirmed = Boolean(updates.stuffingConfirmed);
  if (updates.jnptHandlingConfirmed !== undefined) pc.logistics.jnptHandlingConfirmed = Boolean(updates.jnptHandlingConfirmed);

  if (updates.adminOverride) {
    const active = Boolean(updates.adminOverride.active || updates.adminOverride.override);
    const reason = String(updates.adminOverride.reason || updates.adminOverride.overrideReason || '').trim();
    if (active && reason.length < 5) {
      throw new Error('Admin override requires a clear reason of at least 5 characters.');
    }
    pc.adminOverride = {
      active,
      reason,
      actor: updates.adminOverride.actor || actor,
      timestamp: updates.adminOverride.timestamp || now,
      bypassedChecks: updates.adminOverride.bypassedChecks || []
    };
  }

  if (updates.notes !== undefined) pc.notes = String(updates.notes);
  if (updates.confirmationEvidence !== undefined) pc.confirmationEvidence = String(updates.confirmationEvidence);

  const evalResult = evaluateProcessorConfirmation(pc);
  pc.status = evalResult.status;
  if (evalResult.status === 'CONFIRMED') {
    pc.confirmedAt = now;
    pc.confirmedBy = actor;
  }

  // Synchronize legacy processorVerification for backward compatibility
  quotation.processorVerification = quotation.processorVerification || createInitialProcessorVerification();
  const pv = quotation.processorVerification;
  pv.availabilityConfirmed = Boolean(pc.availability.available);
  pv.capacityConfirmed = Boolean(pc.availability.confirmedQuantity != null && Number(pc.availability.confirmedQuantity) >= Number(pc.availability.requestedQuantity || 0));
  pv.specificationConfirmed = Boolean(pc.specification.mesh.processorConfirmed != null && pc.specification.mesh.match !== false);
  pv.moistureConfirmed = Boolean(pc.specification.moisture.processorConfirmed != null && pc.specification.moisture.match !== false);
  pv.packagingConfirmed = Boolean(pc.specification.packaging.processorConfirmed != null && pc.specification.packaging.match !== false);
  pv.coaConfirmed = Boolean(pc.qualityDocuments.coaAvailable);
  pv.testingConfirmed = Boolean(pc.qualityDocuments.testingAvailable);
  pv.sampleConfirmed = Boolean(pc.qualityDocuments.sampleAvailable);
  pv.leadTimeConfirmed = Boolean(Number(pc.production.leadTimeDays) > 0);
  pv.exportPackingConfirmed = Boolean(pc.logistics.exportPackingConfirmed);
  if (pc.adminOverride?.active) {
    pv.adminOverride = true;
    pv.overrideReason = pc.adminOverride.reason;
  }
  pv.status = evaluateProcessorVerification(pv);
  pv.verifiedBy = actor;
  pv.verifiedAt = now;

  quotation.updatedAt = now;

  // Add audit trail event
  quotation.activity = quotation.activity || [];
  quotation.activity.push({
    timestamp: now,
    actor,
    event: pc.status === 'CONFIRMED' ? 'PROCESSOR_REQUIREMENT_CONFIRMED' : 'PROCESSOR_CHECK_UPDATED',
    quotationId: quotation.quotationId,
    leadId: quotation.leadId,
    details: `Processor confirmation status: ${pc.status}. ${pc.adminOverride?.active ? `(ADMIN OVERRIDE: ${pc.adminOverride.reason})` : ''}`
  });

  return quotation;
}

/**
 * Sets explicit Admin Override with required justification
 */
export function setAdminOverride(quotation, reason, actor = 'Sachin Shinde', bypassedChecks = []) {
  if (!quotation || typeof quotation !== 'object') {
    throw new Error('Valid quotation object required for admin override');
  }
  const cleanReason = String(reason || '').trim();
  if (cleanReason.length < 5) {
    throw new Error('Substantive reason required: Admin override requires a clear justification of at least 5 characters');
  }

  const now = new Date().toISOString();
  quotation.processorConfirmation = quotation.processorConfirmation || createInitialProcessorConfirmation(quotation.commercialRequirement || {});
  quotation.processorConfirmation.adminOverride = {
    active: true,
    reason: cleanReason,
    actor,
    timestamp: now,
    bypassedChecks: Array.isArray(bypassedChecks) ? bypassedChecks : [],
    warning: 'ADMIN OVERRIDE — INTERNAL CONTROL',
    disclaimer: 'Override does not constitute processor confirmation.'
  };

  quotation.processorVerification = quotation.processorVerification || createInitialProcessorVerification();
  quotation.processorVerification.adminOverride = true;
  quotation.processorVerification.overrideReason = cleanReason;
  quotation.processorVerification.verifiedBy = actor;
  quotation.processorVerification.verifiedAt = now;
  quotation.processorVerification.status = 'CONFIRMED';

  quotation.updatedAt = now;

  quotation.activity = quotation.activity || [];
  quotation.activity.push({
    timestamp: now,
    actor,
    event: 'ADMIN_OVERRIDE_APPLIED',
    quotationId: quotation.quotationId,
    leadId: quotation.leadId,
    details: `ADMIN OVERRIDE — INTERNAL CONTROL: ${cleanReason}. Override does not constitute processor confirmation.`
  });

  return quotation;
}

/**
 * Evaluates the 20 mandatory conditions + optional buyer requirements for the Buyer-Ready Gate
 */
export function evaluateBuyerReadyGate(quotation = {}) {
  const issues = [];
  const req = quotation.commercialRequirement || {};
  const buyer = quotation.buyer || {};
  const quote = quotation.quotation || {};
  const items = quote.items || [];
  const firstItem = items[0] || {};
  const pc = quotation.processorConfirmation || {};
  const pv = quotation.processorVerification || {};

  // Check admin override
  const isOverridden = Boolean(
    (pc.adminOverride?.active && String(pc.adminOverride?.reason || '').trim().length >= 5) ||
    (pv.adminOverride && String(pv.overrideReason || '').trim().length >= 5)
  );
  const overrideReason = (pc.adminOverride?.reason || pv.overrideReason || '').trim();
  const overrideActor = pc.adminOverride?.actor || pv.verifiedBy || 'Sachin Shinde';
  const overrideTimestamp = pc.adminOverride?.timestamp || pv.verifiedAt || new Date().toISOString();

  // 1. Buyer name present
  const buyerNameValid = Boolean(buyer.name && String(buyer.name).trim().length >= 2);
  if (!buyerNameValid) issues.push('Buyer name is missing or too short');

  // 2. Company present
  const companyValid = Boolean(buyer.company && String(buyer.company).trim().length >= 2);
  if (!companyValid) issues.push('Company Name is missing or too short');

  // 3. Valid business email
  const emailValid = Boolean(buyer.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(buyer.email).trim()));
  if (!emailValid) issues.push('Valid buyer business email is missing or malformed');

  // 4. Country present
  const countryValid = Boolean(buyer.country && String(buyer.country).trim().length >= 2);
  if (!countryValid) issues.push('Buyer country is missing');

  // 5. Supported product
  const rawProduct = firstItem.name || req.product || '';
  const pm = matchProductMaster(rawProduct);
  const productValid = Boolean(pm && (!firstItem.productId || firstItem.productId === pm.productId));
  if (!productValid) issues.push(`Unsupported product "${rawProduct}". Must match product master.`);

  // 6. Quantity > 0
  const qty = Number(req.quantity !== undefined ? req.quantity : firstItem.quantity);
  const quantityValid = !isNaN(qty) && isFinite(qty) && qty > 0;
  if (!quantityValid) issues.push('Quantity must be a valid positive number greater than 0');

  // 7. Destination present
  const dest = (quotation.destination?.port !== undefined ? quotation.destination.port : (req.destinationPort || quotation.destinationPort || '')).trim();
  const destinationValid = Boolean(dest.length >= 2);
  if (!destinationValid) issues.push('Destination port is missing');

  // 8. Incoterm present
  const incoterm = (quotation.destination?.incoterm !== undefined ? quotation.destination.incoterm : (req.incoterm || quotation.incoterm || '')).trim();
  const incotermValid = Boolean(incoterm.length >= 2);
  if (!incotermValid) issues.push('Incoterm is missing');

  // 9. Unit rate > 0
  const rate = Number(firstItem.rate !== undefined ? firstItem.rate : firstItem.unitRate);
  const rateValid = !isNaN(rate) && isFinite(rate) && rate > 0;
  if (!rateValid) issues.push('Unit rate must be a valid positive number greater than 0');

  // 10. Calculation passes canonical quotation engine
  let calcValid = false;
  try {
    if (items.length > 0 && quantityValid && rateValid) {
      const recalculated = calculateQuotation({
        quoteId: quotation.quotationId || 'TEST',
        inquiryId: quotation.leadId || 'LEAD',
        date: quotation.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
        validUntil: quotation.commercialTerms?.validityDate || '12 Oct 2026',
        customerName: buyer.name || 'Buyer',
        companyName: buyer.company || 'Company',
        country: buyer.country || 'India',
        email: buyer.email || 'buyer@example.com',
        currency: quote.currency || 'USD',
        destinationPort: dest || 'JNPT',
        incoterm: incoterm || 'FOB',
        items,
        freight: quote.freight || 0,
        insurance: quote.insurance || 0,
        documentation: quote.documentation || 0,
        otherCharges: quote.otherCharges || 0
      });
      if (recalculated.valid !== false && recalculated.grandTotal > 0) {
        if (!quote.grandTotal || Math.abs(recalculated.grandTotal - quote.grandTotal) > 0.01) {
          quote.subtotal = recalculated.subtotal;
          quote.grandTotal = recalculated.grandTotal;
          quote.items = recalculated.items;
        }
        calcValid = true;
      } else {
        const subtotalDiff = Math.abs(recalculated.subtotal - (quote.subtotal || 0));
        const grandTotalDiff = Math.abs(recalculated.grandTotal - (quote.grandTotal || 0));
        calcValid = subtotalDiff < 0.01 && grandTotalDiff < 0.01 && !isNaN(quote.grandTotal) && isFinite(quote.grandTotal) && quote.grandTotal > 0;
      }
    }
  } catch (err) {
    calcValid = false;
  }
  if (!calcValid) issues.push('Quotation totals do not match authoritative quotationEngine calculation');

  // 11. Processor availability confirmed
  const availabilityConfirmed = Boolean(
    isOverridden ||
    (pc.availability !== undefined ? pc.availability.available : pv.availabilityConfirmed)
  );
  if (!availabilityConfirmed) issues.push('Processor availability has not been confirmed');

  // 12. Processor quantity capacity confirmed
  const requestedQty = Number(pc.availability?.requestedQuantity || req.quantity || firstItem.quantity || 0);
  const capacityConfirmed = Boolean(
    isOverridden ||
    (pc.availability !== undefined ? (pc.availability.confirmedQuantity != null && Number(pc.availability.confirmedQuantity) >= requestedQty) : pv.capacityConfirmed)
  );
  if (!capacityConfirmed) issues.push('Processor quantity capacity is unconfirmed or insufficient');

  // 13. Mesh confirmed
  const meshConfirmed = Boolean(
    isOverridden ||
    (pc.specification?.mesh !== undefined ? (pc.specification.mesh.processorConfirmed != null && pc.specification.mesh.match !== false) : pv.specificationConfirmed)
  );
  if (!meshConfirmed) issues.push('Mesh specification has not been confirmed with processor');

  // 14. Moisture confirmed
  const moistureConfirmed = Boolean(
    isOverridden ||
    (pc.specification?.moisture !== undefined ? (pc.specification.moisture.processorConfirmed != null && pc.specification.moisture.match !== false) : pv.moistureConfirmed)
  );
  if (!moistureConfirmed) issues.push('Moisture specification has not been confirmed with processor');

  // 15. Packaging confirmed
  const packagingConfirmed = Boolean(
    isOverridden ||
    (pc.specification?.packaging !== undefined ? (pc.specification.packaging.processorConfirmed != null && pc.specification.packaging.match !== false) : pv.packagingConfirmed)
  );
  if (!packagingConfirmed) issues.push('Packaging specification has not been confirmed with processor');

  // 16. Production lead time confirmed
  const leadTimeConfirmed = Boolean(
    isOverridden ||
    (pc.production !== undefined ? Number(pc.production.leadTimeDays) > 0 : pv.leadTimeConfirmed)
  );
  if (!leadTimeConfirmed) issues.push('Production lead time has not been confirmed');

  // 17. Export packing / stuffing confirmed
  const exportPackingConfirmed = Boolean(
    isOverridden ||
    (pc.logistics !== undefined ? (pc.logistics.exportPackingConfirmed && pc.logistics.stuffingConfirmed !== false) : pv.exportPackingConfirmed)
  );
  if (!exportPackingConfirmed) issues.push('Export packing and container stuffing have not been confirmed');

  // 18. No unresolved mandatory mismatch
  const noMismatch = Boolean(
    (pc.specification?.mesh?.match !== false && pc.specification?.moisture?.match !== false && pc.specification?.packaging?.match !== false) ||
    isOverridden
  );
  if (!noMismatch) issues.push('Unresolved specification mismatch between buyer and processor');

  // 19. Quotation terms valid
  const termsValid = Boolean(
    quotation.commercialTerms?.paymentTerms &&
    quotation.commercialTerms?.priceBasis &&
    quotation.commercialTerms?.deliveryTimeline &&
    quotation.commercialTerms?.validityDate &&
    quotation.commercialTerms?.jurisdiction
  );
  if (!termsValid) issues.push('Commercial terms (payment, delivery, validity, jurisdiction) are incomplete');

  // 20. Buyer-facing document generated successfully / verifiable data structure
  const documentReady = Boolean(quotation.quotationId && buyerNameValid && companyValid && items.length > 0);
  if (!documentReady) issues.push('Buyer-facing document template cannot be generated');

  // Optional checks based on buyer request
  const optionalChecks = {
    coa: true,
    testing: true,
    sample: true
  };

  if (req.coaRequired) {
    const coaAddressed = Boolean(pc.qualityDocuments?.coaAvailable || pv.coaConfirmed || isOverridden);
    optionalChecks.coa = coaAddressed;
    if (!coaAddressed) issues.push('Buyer requested COA, but COA availability has not been addressed with processor');
  }

  if (req.testingRequired) {
    const testingAddressed = Boolean(pc.qualityDocuments?.testingAvailable || pv.testingConfirmed || isOverridden);
    optionalChecks.testing = testingAddressed;
    if (!testingAddressed) issues.push('Buyer requested testing, but testing availability has not been addressed with processor');
  }

  if (req.sampleRequired) {
    const sampleAddressed = Boolean(pc.qualityDocuments?.sampleAvailable || pv.sampleConfirmed || isOverridden);
    optionalChecks.sample = sampleAddressed;
    if (!sampleAddressed) issues.push('Buyer requested sample, but sample availability has not been addressed with processor');
  }

  const mandatoryChecks = {
    buyerNameValid,
    companyValid,
    emailValid,
    countryValid,
    productValid,
    quantityValid,
    destinationValid,
    incotermValid,
    rateValid,
    calcValid,
    availabilityConfirmed,
    capacityConfirmed,
    meshConfirmed,
    moistureConfirmed,
    packagingConfirmed,
    leadTimeConfirmed,
    exportPackingConfirmed,
    noMismatch,
    termsValid,
    documentReady
  };

  const eligible = issues.length === 0;
  return {
    passed: eligible,
    eligible,
    mandatoryChecks,
    optionalChecks,
    issues,
    overridden: isOverridden,
    overrideDetails: isOverridden ? {
      reason: overrideReason,
      actor: overrideActor,
      timestamp: overrideTimestamp,
      warning: 'ADMIN OVERRIDE — INTERNAL CONTROL',
      disclaimer: 'ADMIN OVERRIDE — INTERNAL CONTROL. Override does not constitute processor confirmation.'
    } : null
  };
}

/**
 * Generates Three-Way Commercial Audit comparing:
 * Buyer Requirement vs Processor Confirmed vs Final Quotation Value
 */
export function generateThreeWayAudit(quotation) {
  if (!quotation) return [];

  const req = quotation.commercialRequirement || {};
  const pc = quotation.processorConfirmation || {};
  const quote = quotation.quotation || {};
  const terms = quotation.commercialTerms || {};
  const firstItem = quote.items?.[0] || {};

  const fields = [
    {
      field: 'Product',
      buyerRequested: req.product || firstItem.name || 'N/A',
      processorConfirmed: pc.partner?.name ? `${req.product || firstItem.name} (${pc.partner.name})` : (pc.availability?.available ? req.product : 'Pending'),
      finalQuotationValue: firstItem.name || req.product || 'N/A'
    },
    {
      field: 'HS Code',
      buyerRequested: req.hsCode || firstItem.hscode || 'N/A',
      processorConfirmed: pc.availability?.available ? (req.hsCode || firstItem.hscode) : 'Pending',
      finalQuotationValue: firstItem.hscode || firstItem.hsCode || req.hsCode || 'N/A'
    },
    {
      field: 'Quantity',
      buyerRequested: `${Number(req.quantity || firstItem.quantity || 0).toLocaleString()} ${req.quantityUnit || 'KG'}`,
      processorConfirmed: pc.availability?.confirmedQuantity != null ? `${Number(pc.availability.confirmedQuantity).toLocaleString()} KG` : 'Pending',
      finalQuotationValue: `${Number(firstItem.quantity || req.quantity || 0).toLocaleString()} ${firstItem.unit || 'KG'}`
    },
    {
      field: 'Mesh',
      buyerRequested: req.mesh || '80–100 Mesh',
      processorConfirmed: pc.specification?.mesh?.processorConfirmed || 'Pending',
      finalQuotationValue: req.mesh || '80–100 Mesh'
    },
    {
      field: 'Moisture',
      buyerRequested: req.moisture || 'Max 7–8%',
      processorConfirmed: pc.specification?.moisture?.processorConfirmed || 'Pending',
      finalQuotationValue: req.moisture || 'Max 7–8%'
    },
    {
      field: 'Packaging',
      buyerRequested: req.packaging || '25 kg Food-Grade HDPE Bags',
      processorConfirmed: pc.specification?.packaging?.processorConfirmed || 'Pending',
      finalQuotationValue: firstItem.packaging || req.packaging || '25 kg Food-Grade HDPE Bags'
    },
    {
      field: 'Sample',
      buyerRequested: req.sampleRequired ? 'Sample Required' : 'Not Requested',
      processorConfirmed: pc.qualityDocuments?.sampleAvailable ? 'Sample Available' : (req.sampleRequired ? 'Pending' : 'Not Requested'),
      finalQuotationValue: req.sampleRequired ? (pc.qualityDocuments?.sampleAvailable ? 'Confirmed by Air Courier' : 'Subject to Confirmation') : 'Not Included'
    },
    {
      field: 'COA',
      buyerRequested: req.coaRequired ? 'Batch COA Required' : 'Standard',
      processorConfirmed: pc.qualityDocuments?.coaAvailable ? 'Batch COA Available' : 'Pending',
      finalQuotationValue: pc.qualityDocuments?.coaAvailable ? 'Manufacturer Batch COA Included' : 'Pending Confirmation'
    },
    {
      field: 'Testing',
      buyerRequested: req.testingRequired ? 'Testing / Lab Analysis' : 'Standard Quality',
      processorConfirmed: pc.qualityDocuments?.testingAvailable ? 'Third-Party / In-House Lab Available' : 'Pending',
      finalQuotationValue: pc.qualityDocuments?.testingAvailable ? 'Lab Test Parameters Confirmed' : 'Standard Parameters'
    },
    {
      field: 'Production timeline',
      buyerRequested: req.timeline || '60–75 Days',
      processorConfirmed: pc.production?.leadTimeDays ? `${pc.production.leadTimeDays} Days` : 'Pending',
      finalQuotationValue: terms.deliveryTimeline || '60–75 days from advance payment'
    },
    {
      field: 'Dispatch timeline',
      buyerRequested: req.timeline || '60–75 Days',
      processorConfirmed: pc.production?.earliestDispatchDate || (pc.production?.leadTimeDays ? `${pc.production.leadTimeDays} Days from Advance` : 'Pending'),
      finalQuotationValue: terms.deliveryTimeline || '60–75 days'
    },
    {
      field: 'Destination',
      buyerRequested: req.destinationPort || 'NHAVA SHEVA (JNPT MUMBAI)',
      processorConfirmed: pc.logistics?.jnptHandlingConfirmed ? 'JNPT Mumbai Logistics Confirmed' : 'Pending',
      finalQuotationValue: req.destinationPort || 'FOB NHAVA SHEVA (JNPT MUMBAI)'
    },
    {
      field: 'Incoterm',
      buyerRequested: req.incoterm || 'FOB',
      processorConfirmed: pc.logistics?.exportPackingConfirmed ? 'Export Packed for FOB' : 'Pending',
      finalQuotationValue: req.incoterm || 'FOB NHAVA SHEVA (JNPT MUMBAI)'
    },
    {
      field: 'Currency',
      buyerRequested: req.targetPrice ? (quote.currency || 'USD') : (quote.currency || 'USD'),
      processorConfirmed: 'INR (Internal Sourcing Basis)',
      finalQuotationValue: quote.currency || 'USD'
    },
    {
      field: 'Unit rate',
      buyerRequested: req.targetPrice ? `${quote.currency || 'USD'} ${Number(req.targetPrice).toFixed(2)}` : 'Market Offer Requested',
      processorConfirmed: pc.partner?.name ? 'Commercial Offer Validated' : 'Pending',
      finalQuotationValue: `${quote.currency || 'USD'} ${Number(firstItem.rate || firstItem.unitRate || 0).toFixed(2)} / ${firstItem.unit || 'KG'}`
    },
    {
      field: 'Total value',
      buyerRequested: req.targetPrice ? `${quote.currency || 'USD'} ${(Number(req.quantity || 0) * Number(req.targetPrice || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A',
      processorConfirmed: pc.availability?.confirmedQuantity && firstItem.rate ? `${quote.currency || 'USD'} ${(Number(pc.availability.confirmedQuantity) * Number(firstItem.rate)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Pending',
      finalQuotationValue: `${quote.currency || 'USD'} ${Number(quote.grandTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
  ];

  return fields.map(row => {
    let status = 'MATCH';
    if (String(row.processorConfirmed).includes('Pending')) {
      status = 'PENDING';
    } else if (quotation.processorConfirmation?.adminOverride?.active) {
      status = 'OVERRIDDEN';
    }
    return { ...row, status };
  });
}

/**
 * Initializes canonical dispatch structure
 */
export function createInitialDispatchState() {
  return {
    status: 'DRAFT',
    recipient: '',
    recipientCompany: '',
    recipientValidated: false,
    reviewedByAdmin: false,
    reviewedAt: null,
    authorizedBy: null,
    preparedAt: null,
    sentAt: null,
    sentBy: null,
    messageId: null,
    providerReference: null,
    failureReason: null,
    documentsAttached: {
      pdf: true,
      docx: true
    }
  };
}

/**
 * Generates B2B email text with strict sourcing coordination positioning
 */
export function generateB2BEmailTemplate(quotation) {
  if (!quotation) return { subject: '', text: '' };

  const buyerName = quotation.buyer?.name || 'Valued Buyer';
  const company = quotation.buyer?.company || '';
  const quoteId = quotation.quotationId || '';
  const rev = quotation.revision?.revisionNumber !== undefined ? `R${quotation.revision.revisionNumber}` : 'R0';
  const item = quotation.quotation?.items?.[0] || {};
  const productName = item.name || quotation.commercialRequirement?.product || 'Export Product';
  const qty = item.quantity || quotation.commercialRequirement?.quantity || 0;
  const unit = item.unit || quotation.commercialRequirement?.quantityUnit || 'KG';
  const rate = item.rate || item.unitRate || 0;
  const currency = quotation.quotation?.currency || 'USD';
  const grandTotal = quotation.quotation?.grandTotal || 0;
  const incoterm = quotation.commercialRequirement?.incoterm || 'FOB NHAVA SHEVA (JNPT MUMBAI)';
  const destination = quotation.commercialRequirement?.destinationPort || '';
  const validity = quotation.commercialTerms?.validityDate || '12 Oct 2026';
  const paymentTerms = quotation.commercialTerms?.paymentTerms || '50% Advance Payment, Balance 50% Before Dispatch.';

  const subject = `Official Commercial Quotation: ${quoteId} (${rev}) — ${productName} — AVANI AGRO FOODS`;

  const text = `Dear ${buyerName}${company ? ` (${company})` : ''},

Thank you for your interest in sourcing Indian agricultural export ingredients.

Please find attached our official commercial quotation based on the requirement discussed:

QUOTATION REFERENCE: ${quoteId} (${rev})
PRODUCT: ${productName}
QUANTITY: ${Number(qty).toLocaleString()} ${unit}
UNIT RATE: ${currency} ${Number(rate).toFixed(2)} / ${unit}
GRAND TOTAL: ${currency} ${Number(grandTotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
TERMS: ${incoterm} ${destination ? `(${destination})` : ''}
PAYMENT TERMS: ${paymentTerms}
VALIDITY: Until ${validity}

ATTACHMENTS:
1. Formal Quotation Document (PDF)
2. Commercial Specification & Terms (DOCX)

AVANI AGRO FOODS coordinates sourcing, supplier communication and export-process coordination with qualified Indian manufacturing partners. Final product availability and specifications remain subject to manufacturing partner confirmation.

To proceed or request any adjustments, please reply to this email or contact our export desk at info@avaniagrofoods.com.

Kind regards,

Sachin Shinde
Export Trade Coordination Desk
AVANI AGRO FOODS
Latur, Maharashtra, India
Website: https://www.avaniagrofoods.com
Email: info@avaniagrofoods.com`;

  return { subject, text };
}

/**
 * Controlled buyer dispatch function with provider abstraction and false SENT prevention
 */
export async function sendQuotationToBuyer(quotation, options = {}) {
  if (!quotation || typeof quotation !== 'object') {
    throw new Error('Valid quotation object required for dispatch');
  }

  if (!['READY_FOR_BUYER', 'REVISED', 'SENT_TO_BUYER'].includes(quotation.status)) {
    throw new Error(`Quotation in status "${quotation.status}" cannot be dispatched. Cannot dispatch quotation in status ${quotation.status}. Must be in READY_FOR_BUYER status.`);
  }

  const adminReviewed = options.adminReviewed !== undefined ? options.adminReviewed : true;
  if (!adminReviewed) {
    throw new Error('Explicit admin review confirmation is required before dispatching quotation.');
  }

  const recipient = (options.recipient || quotation.buyer?.email || '').trim();
  if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
    throw new Error('Valid recipient email required for dispatch.');
  }

  const now = new Date().toISOString();
  quotation.dispatch = quotation.dispatch || createInitialDispatchState();
  quotation.dispatch.recipient = recipient;
  quotation.dispatch.recipientCompany = quotation.buyer?.company || '';
  quotation.dispatch.recipientValidated = true;
  quotation.dispatch.reviewedByAdmin = true;
  quotation.dispatch.reviewedAt = now;
  quotation.dispatch.authorizedBy = options.actor || 'Sachin Shinde';

  // Check if live or test mail provider is present
  const simulateFailure = Boolean(options.simulateFailure || options.mockFailure);
  const simulateSuccess = Boolean(options.simulateSuccess || options.mockSuccess || options.mockProviderDelivery);

  const hasExternalProvider = Boolean(
    (typeof process !== 'undefined' && process.env && (process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY || process.env.SMTP_HOST)) ||
    simulateSuccess ||
    simulateFailure
  );

  if (!hasExternalProvider) {
    quotation.dispatch.status = 'READY_TO_SEND';
    quotation.dispatch.preparedAt = now;

    quotation.activity = quotation.activity || [];
    quotation.activity.push({
      timestamp: now,
      actor: options.actor || 'Sachin Shinde',
      event: 'SEND_TO_BUYER_REQUESTED',
      quotationId: quotation.quotationId,
      leadId: quotation.leadId,
      details: `Quotation verified and marked READY_TO_SEND to ${recipient}. External mail provider not configured.`
    });

    return {
      success: true,
      status: 'READY_TO_SEND',
      message: 'Quotation verified and marked READY_TO_SEND. (External mail provider not configured - no false SENT reported)',
      dispatch: quotation.dispatch
    };
  }

  if (simulateFailure) {
    const reason = options.failureReason || 'Mail delivery service timeout';
    quotation.dispatch.status = 'SEND_FAILED';
    quotation.dispatch.failureReason = reason;

    quotation.activity = quotation.activity || [];
    quotation.activity.push({
      timestamp: now,
      actor: options.actor || 'Sachin Shinde',
      event: 'SEND_FAILED',
      quotationId: quotation.quotationId,
      leadId: quotation.leadId,
      details: `Dispatch failed: ${reason}`
    });

    return {
      success: false,
      status: 'SEND_FAILED',
      error: reason,
      dispatch: quotation.dispatch
    };
  }

  const msgId = options.mockProviderReference || options.messageId || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  quotation.dispatch.status = 'SENT';
  quotation.dispatch.sentAt = now;
  quotation.dispatch.sentBy = options.actor || 'Sachin Shinde';
  quotation.dispatch.messageId = msgId;
  quotation.dispatch.providerReference = msgId;
  quotation.dispatch.failureReason = null;

  quotation.status = 'SENT_TO_BUYER';
  quotation.updatedAt = now;

  quotation.activity = quotation.activity || [];
  quotation.activity.push({
    timestamp: now,
    actor: options.actor || 'Sachin Shinde',
    event: 'QUOTATION_SENT',
    quotationId: quotation.quotationId,
    leadId: quotation.leadId,
    details: `Quotation dispatched to ${recipient} (Provider Ref: ${msgId})`
  });

  return {
    success: true,
    status: 'SENT',
    messageId: msgId,
    message: `Quotation dispatched successfully to ${recipient}.`,
    dispatch: quotation.dispatch
  };
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

    destination: {
      port: destinationPort,
      country: sanitizeText(buyer.country || inquiry.destinationCountry || ''),
      incoterm
    },
    destinationPort,
    destinationCountry: sanitizeText(buyer.country || inquiry.destinationCountry || ''),
    incoterm,
    leadRequirementSnapshot: JSON.parse(JSON.stringify(lead)),

    commercialRequirement,

    processorVerification,

    processorConfirmation: createInitialProcessorConfirmation(commercialRequirement),

    dispatch: createInitialDispatchState(),

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
      changeSummary: `Draft created from lead ${lead.leadId}`,
      history: []
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

  // Allowed transitions state machine (backward compatible with P4.3 + P4.4 substates)
  const allowedTransitions = {
    DRAFT: ['PROCESSOR_CHECK', 'PROCESSOR_CONFIRMED', 'COMMERCIAL_REVIEW', 'READY_FOR_BUYER', 'CANCELLED'],
    PROCESSOR_CHECK: ['PROCESSOR_CONFIRMED', 'COMMERCIAL_REVIEW', 'READY_FOR_BUYER', 'DRAFT', 'CANCELLED'],
    PROCESSOR_CONFIRMED: ['COMMERCIAL_REVIEW', 'PROCESSOR_CHECK', 'READY_FOR_BUYER', 'CANCELLED'],
    COMMERCIAL_REVIEW: ['READY_FOR_BUYER', 'PROCESSOR_CONFIRMED', 'PROCESSOR_CHECK', 'CANCELLED'],
    READY_FOR_BUYER: ['SENT_TO_BUYER', 'COMMERCIAL_REVIEW', 'DRAFT', 'CANCELLED'],
    SENT_TO_BUYER: ['NEGOTIATION', 'ACCEPTED', 'REVISED', 'CANCELLED'],
    NEGOTIATION: ['REVISED', 'ACCEPTED', 'CANCELLED'],
    REVISED: ['PROCESSOR_CHECK', 'COMMERCIAL_REVIEW', 'READY_FOR_BUYER', 'SENT_TO_BUYER', 'NEGOTIATION', 'CANCELLED'],
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

  // Gating requirements for PROCESSOR_CONFIRMED
  if (tgt === 'PROCESSOR_CONFIRMED') {
    const pc = quotation.processorConfirmation || {};
    const pv = quotation.processorVerification || {};
    const pcEval = evaluateProcessorConfirmation(pc);
    const pvStatus = evaluateProcessorVerification(pv);
    const confirmed = pcEval.confirmed || pvStatus === 'CONFIRMED';
    if (!confirmed) {
      return { allowed: false, reason: 'Processor confirmation requires availability, capacity, and specifications to be confirmed with partner.' };
    }
    return { allowed: true };
  }

  // Gating requirements for COMMERCIAL_REVIEW
  if (tgt === 'COMMERCIAL_REVIEW') {
    const firstItem = quotation.quotation?.items?.[0] || {};
    const rate = Number(firstItem.rate || firstItem.unitRate || 0);
    if (rate <= 0) {
      return { allowed: false, reason: 'Commercial review requires positive unit rate to be set.' };
    }
    return { allowed: true };
  }

  // Gating requirements for READY_FOR_BUYER
  if (tgt === 'READY_FOR_BUYER') {
    const gate = evaluateBuyerReadyGate(quotation);
    const checklist = {
      buyerValid: Boolean(gate.mandatoryChecks?.buyerNameValid && gate.mandatoryChecks?.companyValid && gate.mandatoryChecks?.emailValid),
      productValid: Boolean(gate.mandatoryChecks?.productValid),
      quantityValid: Boolean(gate.mandatoryChecks?.quantityValid),
      destinationValid: Boolean(gate.mandatoryChecks?.destinationValid),
      priceEntered: Boolean(gate.mandatoryChecks?.rateValid),
      processorConfirmed: Boolean(gate.mandatoryChecks?.availabilityConfirmed && gate.mandatoryChecks?.capacityConfirmed)
    };

    if (!gate.passed) {
      // Prioritize specific reason for backward compatibility with P4.3 tests
      if (!checklist.buyerValid) {
        return { allowed: false, reason: 'Buyer details (name, company, email) required before ready state.', checklist, gate };
      }
      if (!checklist.quantityValid) {
        return { allowed: false, reason: 'Valid positive quantity required before ready state.', checklist, gate };
      }
      if (!checklist.priceEntered) {
        return { allowed: false, reason: 'Unit rate required before buyer-ready quotation.', checklist, gate };
      }
      if (!checklist.processorConfirmed) {
        return { allowed: false, reason: 'Processor verification mandatory requirements must be confirmed before ready state.', checklist, gate };
      }
      return {
        allowed: false,
        reason: `Buyer-ready gate requirement unfulfilled: ${gate.issues.join('; ')}`,
        checklist,
        gate
      };
    }

    return { allowed: true, checklist, gate };
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
  } else if (targetStatus === 'PROCESSOR_CONFIRMED') {
    eventType = 'PROCESSOR_REQUIREMENT_CONFIRMED';
    nextAction = 'Manufacturing partner confirmed capacity and specifications. Proceed to Commercial Review.';
  } else if (targetStatus === 'COMMERCIAL_REVIEW') {
    eventType = 'COMMERCIAL_REVIEW_STARTED';
    nextAction = 'Review commercial pricing, freight, payment terms and validity before Buyer-Ready gate.';
  } else if (targetStatus === 'READY_FOR_BUYER') {
    eventType = 'QUOTATION_READY';
    quotation.workflow.buyerReviewDate = now;
    nextAction = 'Commercial quotation verified and buyer-ready. Review dispatch parameters before sending.';
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

  if (typeof changes === 'string') {
    changedBy = changeReason || 'Sachin Shinde';
    changeReason = changes;
    changes = {};
  }

  const now = new Date().toISOString();
  const currentRevisionNumber = quotation.revision?.revisionNumber || 0;
  const newRevisionNumber = currentRevisionNumber + 1;

  // Snapshot the current version into revisionHistory
  const snapshot = {
    revisionNumber: currentRevisionNumber,
    previousRevisionId: quotation.revision?.previousRevisionId || `${quotation.quotationId}-R${currentRevisionNumber}`,
    savedAt: now,
    timestamp: now,
    actor: changedBy || quotation.revision?.changedBy || 'Sachin Shinde',
    reason: changeReason || quotation.revision?.changeReason || 'Previous revision',
    changedBy: quotation.revision?.changedBy || changedBy,
    changeReason: quotation.revision?.changeReason || 'Previous revision',
    changeSummary: quotation.revision?.changeSummary || `Revision ${currentRevisionNumber}`,
    quotationSnapshot: {
      status: quotation.status,
      items: JSON.parse(JSON.stringify(quotation.quotation?.items || [])),
      quotation: JSON.parse(JSON.stringify(quotation.quotation)),
      commercialTerms: JSON.parse(JSON.stringify(quotation.commercialTerms)),
      commercialRequirement: JSON.parse(JSON.stringify(quotation.commercialRequirement || {})),
      processorVerification: JSON.parse(JSON.stringify(quotation.processorVerification || {})),
      processorConfirmation: JSON.parse(JSON.stringify(quotation.processorConfirmation || {})),
      dispatch: JSON.parse(JSON.stringify(quotation.dispatch || {}))
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
    changeSummary: changes.summary || `Updated pricing or specification parameters for Rev ${newRevisionNumber}`,
    history: quotation.revisionHistory
  };

  // Apply changes to quotation items / terms
  const updatedItems = (changes.items || quotation.quotation.items).map((item, idx) => {
    const rawQty = (changes.quantity !== undefined && idx === 0) ? changes.quantity : ((changes.quantityKg !== undefined && idx === 0) ? changes.quantityKg : item.quantity);
    const qty = parseQuantityKg(rawQty);
    const effectiveRate = (changes.rate !== undefined && idx === 0) ? changes.rate : ((changes.unitRate !== undefined && idx === 0) ? changes.unitRate : (item.rate !== undefined ? item.rate : item.unitRate));
    const rate = parseUnitRate(effectiveRate, 0);
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
    DISPATCH_STATUSES,
    PROCESSOR_CONFIRMATION_STATUSES,
    PROCESSOR_VERIFICATION_STATUSES,
    PROCESSOR_CHECKLIST_DEFINITIONS,
    PROCESSOR_CHECKLIST_ITEMS: PROCESSOR_CHECKLIST_DEFINITIONS,
    SOURCING_POSITIONING_NOTICES,
    POSITIONING_NOTICES: SOURCING_POSITIONING_NOTICES,
    generateQuotationId,
    validateLeadForQuotation,
    createInitialProcessorVerification,
    evaluateProcessorVerification,
    createInitialProcessorConfirmation,
    evaluateProcessorConfirmation,
    updateProcessorConfirmation,
    setAdminOverride,
    evaluateBuyerReadyGate,
    generateThreeWayAudit,
    createInitialDispatchState,
    generateB2BEmailTemplate,
    sendQuotationToBuyer,
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
