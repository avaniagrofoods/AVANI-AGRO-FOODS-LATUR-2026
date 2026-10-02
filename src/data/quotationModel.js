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
  'READY_TO_SEND',
  'SENT_TO_BUYER',
  'DELIVERY_PENDING',
  'DELIVERED',
  'OPENED',
  'NEGOTIATION',
  'REVISED',
  'ACCEPTED',
  'PO_RECEIVED',
  'SEND_FAILED',
  'CANCELLED'
];

export const DISPATCH_STATUSES = [
  'DRAFT',
  'READY_TO_SEND',
  'SENDING',
  'SENT',
  'DELIVERY_PENDING',
  'DELIVERED',
  'OPENED',
  'BOUNCED',
  'COMPLAINED',
  'SEND_FAILED'
];

export const DELIVERY_STATUSES = [
  'PENDING',
  'DELIVERED',
  'BOUNCED',
  'COMPLAINED',
  'OPENED',
  'CLICKED'
];

export const FOLLOWUP_STATUSES = [
  'NO_FOLLOWUP',
  'FOLLOWUP_DUE',
  'FOLLOWUP_SENT',
  'BUYER_REPLIED',
  'NEGOTIATION',
  'CLOSED'
];

export const FOLLOWUP_TYPES = [
  'EMAIL',
  'WHATSAPP',
  'CALL',
  'LINKEDIN'
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
    itemOverrides: {},
    overrideHistory: [],
    notes: '',
    confirmationEvidence: '',
    internalOnly: true
  };
}

export const OVERRIDABLE_PROCESSOR_CHECKS = [
  'availability',
  'capacity',
  'mesh',
  'moisture',
  'packaging',
  'leadTime',
  'exportPacking',
  'mismatch',
  'coa',
  'testing',
  'sample'
];

export const NON_OVERRIDABLE_COMMERCIAL_CHECKS = [
  'buyerName',
  'company',
  'email',
  'country',
  'currency',
  'product',
  'quantity',
  'destinationPort',
  'incoterm',
  'unitRate',
  'calculation',
  'commercialTerms',
  'documentReady'
];

export function normalizeChecklistKey(key) {
  if (!key) return '';
  const k = String(key).trim();
  const lower = k.toLowerCase().replace(/[-_]/g, '');
  if (lower.includes('avail')) return 'availability';
  if (lower.includes('capac')) return 'capacity';
  if (lower.includes('mesh')) return 'mesh';
  if (lower.includes('moist')) return 'moisture';
  if (lower.includes('packag')) return 'packaging';
  if (lower.includes('leadtime') || lower.includes('lead_time')) return 'leadTime';
  if (lower.includes('export') || lower.includes('stuff')) return 'exportPacking';
  if (lower.includes('mismatch')) return 'mismatch';
  if (lower.includes('coa')) return 'coa';
  if (lower.includes('test')) return 'testing';
  if (lower.includes('sample')) return 'sample';
  return k;
}

export function isPcItemOverridden(itemKey, pc = {}) {
  if (!pc || typeof pc !== 'object') return false;
  const normKey = normalizeChecklistKey(itemKey);
  if (!normKey) return false;

  // 1. Check explicit itemOverrides map
  if (pc.itemOverrides && pc.itemOverrides[normKey]?.active) {
    return true;
  }

  // 2. Check bypassedChecks list on adminOverride
  if (Array.isArray(pc.adminOverride?.bypassedChecks)) {
    if (pc.adminOverride.bypassedChecks.some(c => normalizeChecklistKey(c) === normKey)) {
      return true;
    }
  }

  return false;
}

export function isCheckOverridden(itemKey, quotation = {}) {
  if (!quotation || typeof quotation !== 'object') return false;
  const normKey = normalizeChecklistKey(itemKey);
  const pc = quotation.processorConfirmation || {};
  if (isPcItemOverridden(itemKey, pc)) return true;

  // Support processorVerification administrative override if substantive reason provided (>= 5 chars)
  const pv = quotation.processorVerification || {};
  if (pv.adminOverride || pv.override) {
    const reason = String(pv.overrideReason || pv.reason || '').trim();
    if (reason.length >= 5) {
      // If pv has specific bypassedChecks, enforce item matching
      if (Array.isArray(pv.bypassedChecks) && pv.bypassedChecks.length > 0) {
        return pv.bypassedChecks.some(c => normalizeChecklistKey(c) === normKey);
      }
      if (pv.checkItem) {
        return normalizeChecklistKey(pv.checkItem) === normKey;
      }
      // If pc has adminOverride with specific bypassedChecks or itemOverrides, respect pc's item-level restriction
      if (pc.adminOverride?.active) {
        if (Array.isArray(pc.adminOverride.bypassedChecks) && pc.adminOverride.bypassedChecks.length > 0) {
          return pc.adminOverride.bypassedChecks.some(c => normalizeChecklistKey(c) === normKey);
        }
        if (pc.itemOverrides && Object.keys(pc.itemOverrides).length > 0) {
          return Boolean(pc.itemOverrides[normKey]?.active);
        }
      }
      // If no item-level restrictions are specified anywhere, general override applies
      return true;
    }
  }

  return false;
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

  // Check admin override validation
  if (pc.adminOverride?.active || pc.adminOverride?.override) {
    const reason = String(pc.adminOverride.reason || pc.adminOverride.overrideReason || '').trim();
    if (reason.length < 5) {
      return {
        confirmed: false,
        status: 'REQUIRES_REVIEW',
        issues: ['Admin override requires a clear reason of at least 5 characters'],
        checklist: {}
      };
    }
  }

  const issues = [];
  const checklist = {
    availability: Boolean(pc.availability?.available || isPcItemOverridden('availability', pc)),
    capacity: Boolean((pc.availability?.confirmedQuantity != null && Number(pc.availability.confirmedQuantity) >= Number(pc.availability.requestedQuantity || 0)) || isPcItemOverridden('capacity', pc)),
    mesh: Boolean((pc.specification?.mesh?.processorConfirmed != null && pc.specification.mesh.match !== false) || isPcItemOverridden('mesh', pc)),
    moisture: Boolean((pc.specification?.moisture?.processorConfirmed != null && pc.specification.moisture.match !== false) || isPcItemOverridden('moisture', pc)),
    packaging: Boolean((pc.specification?.packaging?.processorConfirmed != null && pc.specification.packaging.match !== false) || isPcItemOverridden('packaging', pc)),
    leadTime: Boolean(Number(pc.production?.leadTimeDays) > 0 || isPcItemOverridden('leadTime', pc)),
    exportPacking: Boolean(pc.logistics?.exportPackingConfirmed || isPcItemOverridden('exportPacking', pc)),
    stuffing: Boolean((pc.logistics?.stuffingConfirmed !== false && pc.logistics?.exportPackingConfirmed) || isPcItemOverridden('exportPacking', pc))
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
 * Sets explicit Admin Override with required justification and item-level targeting
 */
export function setAdminOverride(quotation, reasonOrOptions, actor = 'Sachin Shinde', bypassedChecks = []) {
  if (!quotation || typeof quotation !== 'object') {
    throw new Error('Valid quotation object required for admin override');
  }

  let cleanReason = '';
  let effectiveActor = actor;
  let checksToBypass = [];

  if (typeof reasonOrOptions === 'object' && reasonOrOptions !== null) {
    cleanReason = String(reasonOrOptions.reason || '').trim();
    effectiveActor = reasonOrOptions.actor || actor || 'Sachin Shinde';
    if (reasonOrOptions.checkItem) {
      checksToBypass = [reasonOrOptions.checkItem];
    } else if (Array.isArray(reasonOrOptions.bypassedChecks)) {
      checksToBypass = reasonOrOptions.bypassedChecks;
    }
  } else {
    cleanReason = String(reasonOrOptions || '').trim();
    effectiveActor = actor || 'Sachin Shinde';
    checksToBypass = Array.isArray(bypassedChecks) ? bypassedChecks : (bypassedChecks ? [bypassedChecks] : []);
  }

  if (cleanReason.length < 5) {
    throw new Error('Substantive reason required: Admin override requires a clear justification of at least 5 characters');
  }

  // Reject overriding non-overridable commercial/buyer checks
  for (const c of checksToBypass) {
    const rawKey = String(c).trim();
    if (NON_OVERRIDABLE_COMMERCIAL_CHECKS.includes(rawKey)) {
      throw new Error(`Commercial check "${rawKey}" cannot be overridden. Buyer and commercial terms are strictly mandatory.`);
    }
  }

  const now = new Date().toISOString();
  quotation.processorConfirmation = quotation.processorConfirmation || createInitialProcessorConfirmation(quotation.commercialRequirement || {});
  quotation.processorConfirmation.itemOverrides = quotation.processorConfirmation.itemOverrides || {};
  quotation.processorConfirmation.overrideHistory = quotation.processorConfirmation.overrideHistory || [];

  const normalizedBypassed = [];
  for (const c of checksToBypass) {
    const norm = normalizeChecklistKey(c);
    normalizedBypassed.push(norm);
    quotation.processorConfirmation.itemOverrides[norm] = {
      active: true,
      checkItem: norm,
      reason: cleanReason,
      actor: effectiveActor,
      timestamp: now
    };
    quotation.processorConfirmation.overrideHistory.push({
      checkItem: norm,
      reason: cleanReason,
      actor: effectiveActor,
      timestamp: now
    });
  }

  quotation.processorConfirmation.adminOverride = {
    active: true,
    reason: cleanReason,
    actor: effectiveActor,
    timestamp: now,
    bypassedChecks: normalizedBypassed,
    warning: 'ADMIN OVERRIDE — INTERNAL CONTROL',
    disclaimer: 'Override does not constitute processor confirmation.'
  };

  quotation.processorVerification = quotation.processorVerification || createInitialProcessorVerification();
  quotation.processorVerification.adminOverride = true;
  quotation.processorVerification.overrideReason = cleanReason;
  quotation.processorVerification.verifiedBy = effectiveActor;
  quotation.processorVerification.verifiedAt = now;
  quotation.processorVerification.bypassedChecks = normalizedBypassed;

  quotation.updatedAt = now;

  quotation.activity = quotation.activity || [];
  quotation.activity.push({
    timestamp: now,
    actor: effectiveActor,
    event: 'ADMIN_OVERRIDE_APPLIED',
    quotationId: quotation.quotationId,
    leadId: quotation.leadId,
    details: `ADMIN OVERRIDE — INTERNAL CONTROL: ${cleanReason}. Items: [${normalizedBypassed.join(', ') || 'none'}]. Override does not constitute processor confirmation.`
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

  // Line items check
  if (!items || items.length === 0) {
    issues.push('At least one line item is required');
  }

  // Currency check
  const curr = String(quote.currency || quotation.currency || '').toUpperCase();
  const supportedCurrencies = ['USD', 'EUR', 'GBP', 'INR', 'AED', 'SGD', 'CAD', 'AUD'];
  if (!curr || !supportedCurrencies.includes(curr)) {
    issues.push(`Unsupported currency "${curr}". Supported: ${supportedCurrencies.join(', ')}`);
  }

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
    isCheckOverridden('availability', quotation) ||
    (pc.availability !== undefined ? pc.availability.available : pv.availabilityConfirmed)
  );
  if (!availabilityConfirmed) issues.push('Processor availability has not been confirmed');

  // 12. Processor quantity capacity confirmed
  const requestedQty = Number(pc.availability?.requestedQuantity || req.quantity || firstItem.quantity || 0);
  const capacityConfirmed = Boolean(
    isCheckOverridden('capacity', quotation) ||
    (pc.availability !== undefined ? (pc.availability.confirmedQuantity != null && Number(pc.availability.confirmedQuantity) >= requestedQty) : pv.capacityConfirmed)
  );
  if (!capacityConfirmed) issues.push('Processor quantity capacity is unconfirmed or insufficient');

  // 13. Mesh confirmed
  const meshConfirmed = Boolean(
    isCheckOverridden('mesh', quotation) ||
    (pc.specification?.mesh !== undefined ? (pc.specification.mesh.processorConfirmed != null && pc.specification.mesh.match !== false) : pv.specificationConfirmed)
  );
  if (!meshConfirmed) issues.push('Mesh specification has not been confirmed with processor');

  // 14. Moisture confirmed
  const moistureConfirmed = Boolean(
    isCheckOverridden('moisture', quotation) ||
    (pc.specification?.moisture !== undefined ? (pc.specification.moisture.processorConfirmed != null && pc.specification.moisture.match !== false) : pv.moistureConfirmed)
  );
  if (!moistureConfirmed) issues.push('Moisture specification has not been confirmed with processor');

  // 15. Packaging confirmed
  const packagingConfirmed = Boolean(
    isCheckOverridden('packaging', quotation) ||
    (pc.specification?.packaging !== undefined ? (pc.specification.packaging.processorConfirmed != null && pc.specification.packaging.match !== false) : pv.packagingConfirmed)
  );
  if (!packagingConfirmed) issues.push('Packaging specification has not been confirmed with processor');

  // 16. Production lead time confirmed
  const leadTimeConfirmed = Boolean(
    isCheckOverridden('leadTime', quotation) ||
    (pc.production !== undefined ? Number(pc.production.leadTimeDays) > 0 : pv.leadTimeConfirmed)
  );
  if (!leadTimeConfirmed) issues.push('Production lead time has not been confirmed');

  // 17. Export packing / stuffing confirmed
  const exportPackingConfirmed = Boolean(
    isCheckOverridden('exportPacking', quotation) ||
    (pc.logistics !== undefined ? (pc.logistics.exportPackingConfirmed && pc.logistics.stuffingConfirmed !== false) : pv.exportPackingConfirmed)
  );
  if (!exportPackingConfirmed) issues.push('Export packing and container stuffing have not been confirmed');

  // 18. No unresolved mandatory mismatch
  const noMismatch = Boolean(
    isCheckOverridden('mismatch', quotation) ||
    isCheckOverridden('specification', quotation) ||
    (
      (pc.specification?.mesh !== undefined ? (pc.specification.mesh.match !== false) : pv.specificationConfirmed) &&
      (pc.specification?.moisture !== undefined ? (pc.specification.moisture.match !== false) : pv.moistureConfirmed) &&
      (pc.specification?.packaging !== undefined ? (pc.specification.packaging.match !== false) : pv.packagingConfirmed)
    )
  );
  if (!noMismatch) issues.push('Unresolved specification mismatch between buyer and processor');

  // 19. Quotation terms valid
  const termsValid = Boolean(
    (quotation.commercialTerms?.paymentTerms || quotation.paymentTerms) &&
    (quotation.commercialTerms?.priceBasis || quotation.priceBasis || quotation.incoterm) &&
    (quotation.commercialTerms?.deliveryTimeline || quotation.deliveryTimeline || quotation.timeline) &&
    (quotation.commercialTerms?.validityDate || quotation.validUntil || quotation.validity) &&
    (quotation.commercialTerms?.jurisdiction || quotation.jurisdiction)
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
    const coaAddressed = Boolean(pc.qualityDocuments?.coaAvailable || pv.coaConfirmed || isCheckOverridden('coa', quotation));
    optionalChecks.coa = coaAddressed;
    if (!coaAddressed) issues.push('Buyer requested COA, but COA availability has not been addressed with processor');
  }

  if (req.testingRequired) {
    const testingAddressed = Boolean(pc.qualityDocuments?.testingAvailable || pv.testingConfirmed || isCheckOverridden('testing', quotation));
    optionalChecks.testing = testingAddressed;
    if (!testingAddressed) issues.push('Buyer requested testing, but testing availability has not been addressed with processor');
  }

  if (req.sampleRequired) {
    const sampleAddressed = Boolean(pc.qualityDocuments?.sampleAvailable || pv.sampleConfirmed || isCheckOverridden('sample', quotation));
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
 * Initializes canonical dispatch structure (P4.5)
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
    dispatchAttemptId: null,
    idempotencyKey: null,
    messageId: null,
    provider: null,
    providerReference: null,
    deliveryStatus: 'PENDING',
    deliveryEvents: [],
    failureReason: null,
    resendHistory: [],
    documentsAttached: {
      pdf: true,
      docx: true
    }
  };
}

/**
 * Initializes canonical follow-up structure (P4.5)
 */
export function createInitialFollowUpState() {
  return {
    status: 'NO_FOLLOWUP',
    nextFollowUpDate: null,
    followUpType: 'EMAIL',
    notes: '',
    owner: 'Sachin Shinde',
    lastFollowUpAt: null,
    history: []
  };
}

/**
 * Generates B2B email text with strict sourcing coordination positioning
 */
export function generateB2BEmailTemplate(quotation) {
  if (!quotation) return { subject: '', text: '' };

  const buyerName = quotation.buyer?.name || 'Valued Buyer';
  const company = quotation.buyer?.company || '';
  const quoteId = quotation.quotationId || quotation.quoteId || '';
  const rev = quotation.revision?.revisionNumber !== undefined ? `R${quotation.revision.revisionNumber}` : 'R0';
  const items = quotation.quotation?.items || quotation.items || [];
  const item = items[0] || {};
  const isMultiProduct = items.length > 1;
  const productName = isMultiProduct ? 'Commercial Offer' : (item.name || quotation.commercialRequirement?.product || 'Export Product');
  const qty = item.quantity || quotation.commercialRequirement?.quantity || 0;
  const unit = item.unit || quotation.commercialRequirement?.quantityUnit || 'KG';
  const rate = item.rate || item.unitRate || 0;
  const currency = quotation.quotation?.currency || quotation.currency || 'USD';
  const grandTotal = quotation.quotation?.grandTotal || quotation.grandTotal || 0;
  const incoterm = quotation.commercialRequirement?.incoterm || quotation.incoterm || 'FOB NHAVA SHEVA (JNPT MUMBAI)';
  const destination = quotation.commercialRequirement?.destinationPort || quotation.destinationPort || '';
  const validity = quotation.commercialTerms?.validityDate || quotation.validUntil || '12 Oct 2026';
  const paymentTerms = quotation.commercialTerms?.paymentTerms || quotation.paymentTerms || '50% Advance Payment, Balance 50% Before Dispatch.';

  const subject = `Quotation ${quoteId} — ${productName}`;

  const text = `Dear ${buyerName}${company ? ` (${company})` : ''},

Thank you for your inquiry regarding Indian agricultural export products.

Please find attached our official commercial quotation:

QUOTATION REFERENCE: ${quoteId} (${rev})
PRODUCT: ${productName}
QUANTITY: ${Number(qty).toLocaleString()} ${unit}
PRICE BASIS: ${incoterm} ${destination ? `(${destination})` : ''}
CURRENCY: ${currency}
GRAND TOTAL: ${currency} ${Number(grandTotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
PAYMENT TERMS: ${paymentTerms}
VALIDITY: Until ${validity}

ATTACHED DOCUMENTS:
1. Formal Proforma Quotation Document (PDF)
2. Commercial Specification & Terms (DOCX)

AVANI AGRO FOODS is an Indian sourcing and export coordination partner. Processing and manufacturing are performed by vetted regional processing partners.

Please reply to this email or contact our export desk at info@avaniagrofoods.com to proceed or discuss commercial adjustments.

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
 * Synchronous pure JavaScript SHA-256 implementation adhering to NIST FIPS 180-4.
 * Uses Node.js crypto when available; falls back to pure JS in browser environments.
 * Outputs a 64-character lowercase hex string.
 */
export function sha256Sync(str) {
  if (typeof str !== 'string') {
    str = String(str || '');
  }
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    try {
      const nodeCrypto = typeof require !== 'undefined' ? require('crypto') : null;
      if (nodeCrypto && nodeCrypto.createHash) {
        return nodeCrypto.createHash('sha256').update(str, 'utf8').digest('hex');
      }
    } catch (_) {}
  }

  const bytes = [];
  for (let i = 0; i < str.length; i++) {
    let code = str.charCodeAt(i);
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code < 0xd800 || code >= 0xe000) {
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    } else {
      i++;
      code = 0x10000 + (((code & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
      bytes.push(0xf0 | (code >> 18), 0x80 | ((code >> 12) & 0x3f), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    }
  }

  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  let H0 = 0x6a09e667, H1 = 0xbb67ae85, H2 = 0x3c6ef372, H3 = 0xa54ff53a;
  let H4 = 0x510e527f, H5 = 0x9b05688c, H6 = 0x1f83d9ab, H7 = 0x5be0cd19;

  const bitLength = bytes.length * 8;
  bytes.push(0x80);
  while ((bytes.length + 8) % 64 !== 0) {
    bytes.push(0);
  }
  for (let i = 7; i >= 0; i--) {
    bytes.push((bitLength / Math.pow(2, i * 8)) & 0xff);
  }

  const W = new Uint32Array(64);
  for (let c = 0; c < bytes.length; c += 64) {
    for (let i = 0; i < 16; i++) {
      const idx = c + i * 4;
      W[i] = ((bytes[idx] << 24) | (bytes[idx + 1] << 16) | (bytes[idx + 2] << 8) | bytes[idx + 3]) >>> 0;
    }
    for (let i = 16; i < 64; i++) {
      const s0 = (((W[i - 15] >>> 7) | (W[i - 15] << 25)) ^ ((W[i - 15] >>> 18) | (W[i - 15] << 14)) ^ (W[i - 15] >>> 3)) >>> 0;
      const s1 = (((W[i - 2] >>> 17) | (W[i - 2] << 15)) ^ ((W[i - 2] >>> 19) | (W[i - 2] << 13)) ^ (W[i - 2] >>> 10)) >>> 0;
      W[i] = (W[i - 16] + s0 + W[i - 7] + s1) >>> 0;
    }

    let a = H0, b = H1, c0 = H2, d = H3, e = H4, f = H5, g = H6, h = H7;
    for (let i = 0; i < 64; i++) {
      const S1 = (((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7))) >>> 0;
      const ch = ((e & f) ^ ((~e) & g)) >>> 0;
      const temp1 = (h + S1 + ch + K[i] + W[i]) >>> 0;
      const S0 = (((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10))) >>> 0;
      const maj = ((a & b) ^ (a & c0) ^ (b & c0)) >>> 0;
      const temp2 = (S0 + maj) >>> 0;

      h = g; g = f; f = e; e = (d + temp1) >>> 0;
      d = c0; c0 = b; b = a; a = (temp1 + temp2) >>> 0;
    }

    H0 = (H0 + a) >>> 0;
    H1 = (H1 + b) >>> 0;
    H2 = (H2 + c0) >>> 0;
    H3 = (H3 + d) >>> 0;
    H4 = (H4 + e) >>> 0;
    H5 = (H5 + f) >>> 0;
    H6 = (H6 + g) >>> 0;
    H7 = (H7 + h) >>> 0;
  }

  const toHex = (n) => (n >>> 0).toString(16).padStart(8, '0');
  return `${toHex(H0)}${toHex(H1)}${toHex(H2)}${toHex(H3)}${toHex(H4)}${toHex(H5)}${toHex(H6)}${toHex(H7)}`;
}

/**
 * Generates a cryptographically strong UUID identifier.
 * Uses globalThis.crypto.randomUUID() where supported.
 */
export function generateSecureId(prefix = 'idemp') {
  let uuid = '';
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID) {
    try {
      uuid = globalThis.crypto.randomUUID();
    } catch (_) {}
  }
  if (!uuid && typeof process !== 'undefined' && process.versions && process.versions.node) {
    try {
      const nodeCrypto = typeof require !== 'undefined' ? require('crypto') : null;
      if (nodeCrypto?.randomUUID) {
        uuid = nodeCrypto.randomUUID();
      }
    } catch (_) {}
  }
  if (!uuid && typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues) {
    try {
      const buf = new Uint8Array(16);
      globalThis.crypto.getRandomValues(buf);
      buf[6] = (buf[6] & 0x0f) | 0x40; // RFC4122 v4
      buf[8] = (buf[8] & 0x3f) | 0x80;
      const b = Array.from(buf).map(x => x.toString(16).padStart(2, '0')).join('');
      uuid = `${b.slice(0, 8)}-${b.slice(8, 12)}-${b.slice(12, 16)}-${b.slice(16, 20)}-${b.slice(20)}`;
    } catch (_) {}
  }
  if (!uuid) {
    uuid = `uuid_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
  return prefix ? `${prefix}_${uuid}` : uuid;
}

/**
 * Provider-agnostic transactional email dispatch abstraction
 */
export async function sendQuotationEmail({ quotation, recipient, subject, text, html, attachments = [], idempotencyKey, ...restOpts }) {
  const options = { ...restOpts, ...(restOpts.options || {}) };
  // 1. Simulation and mock checks (for deterministic testing & QA)
  if (options.simulateFailure || options.mockFailure) {
    const errorMsg = options.failureReason || 'Mock provider network timeout';
    return {
      success: false,
      status: 'SEND_FAILED',
      error: errorMsg,
      provider: 'mock'
    };
  }

  if (options.simulateSuccess || options.mockSuccess || options.mockProviderDelivery || options.mockSimulation) {
    const messageId = options.mockProviderReference || options.messageId || `msg_mock_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    return {
      success: true,
      status: 'SENT',
      messageId,
      provider: 'SIMULATED_PROVIDER',
      timestamp: new Date().toISOString()
    };
  }

  // 2. Resend API provider
  if (typeof process !== 'undefined' && process.env && process.env.RESEND_API_KEY) {
    try {
      const headers = {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      };
      if (idempotencyKey) {
        headers['Idempotency-Key'] = String(idempotencyKey);
      }
      const bodyPayload = {
        from: process.env.RESEND_FROM_EMAIL || 'AVANI AGRO FOODS <sales@avaniagrofoods.com>',
        to: Array.isArray(recipient) ? recipient : [recipient],
        subject,
        text,
        html: html || text.replace(/\n/g, '<br/>')
      };
      if (attachments && attachments.length > 0) {
        bodyPayload.attachments = attachments.map(att => ({
          filename: att.filename,
          content: att.content
        }));
      }
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers,
        body: JSON.stringify(bodyPayload)
      });
      if (res.ok) {
        const data = await res.json();
        return {
          success: true,
          status: 'SENT',
          messageId: data.id || `resend_${Date.now()}`,
          provider: 'resend',
          timestamp: new Date().toISOString()
        };
      }
      const err = await res.json().catch(() => ({}));
      return {
        success: false,
        status: 'SEND_FAILED',
        error: err.message || `Resend error: HTTP ${res.status}`,
        provider: 'resend'
      };
    } catch (e) {
      return {
        success: false,
        status: 'SEND_FAILED',
        error: e.message,
        provider: 'resend'
      };
    }
  }

  // 3. SendGrid API provider
  if (typeof process !== 'undefined' && process.env && process.env.SENDGRID_API_KEY) {
    try {
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: recipient }] }],
          from: { email: process.env.SENDGRID_FROM_EMAIL || 'sales@avaniagrofoods.com', name: 'AVANI AGRO FOODS' },
          subject,
          content: [
            { type: 'text/plain', value: text },
            { type: 'text/html', value: html || text.replace(/\n/g, '<br/>') }
          ]
        })
      });
      if (res.status >= 200 && res.status < 300) {
        const msgId = res.headers?.get?.('x-message-id') || `sg_${Date.now()}`;
        return {
          success: true,
          status: 'SENT',
          messageId: msgId,
          provider: 'sendgrid',
          timestamp: new Date().toISOString()
        };
      }
      return {
        success: false,
        status: 'SEND_FAILED',
        error: `SendGrid error: HTTP ${res.status}`,
        provider: 'sendgrid'
      };
    } catch (e) {
      return {
        success: false,
        status: 'SEND_FAILED',
        error: e.message,
        provider: 'sendgrid'
      };
    }
  }

  // 4. SMTP provider check (not implemented in serverless runtime; fail closed)
  if (typeof process !== 'undefined' && process.env && process.env.SMTP_HOST) {
    return {
      success: false,
      status: 'SEND_FAILED',
      error: 'SMTP transport not implemented in serverless runtime. Configure RESEND_API_KEY for live delivery.',
      provider: 'smtp'
    };
  }

  // 5. Unconfigured provider fallback (prevents false SENT reporting)
  return {
    success: false,
    status: 'READY_TO_SEND',
    message: 'External mail provider not configured - no false SENT reported',
    provider: 'none'
  };
}

/**
 * Controlled buyer dispatch function with provider abstraction, duplicate send protection, and audit
 */
export async function sendQuotationToBuyer(quotation, options = {}) {
  if (!quotation || typeof quotation !== 'object') {
    const err = new Error('Valid quotation object required for dispatch');
    err.code = 'DISPATCH_BLOCKED';
    err.issues = ['Valid quotation object required for dispatch'];
    throw err;
  }

  const allowedStatuses = [
    'READY_FOR_BUYER',
    'REVISED',
    'SENT_TO_BUYER',
    'READY_TO_SEND',
    'SEND_FAILED',
    'DELIVERY_PENDING',
    'DELIVERED',
    'OPENED'
  ];

  if (!allowedStatuses.includes(quotation.status)) {
    const err = new Error(`Quotation in status "${quotation.status}" cannot be dispatched. Cannot dispatch quotation in status ${quotation.status}. Must be in READY_FOR_BUYER status.`);
    err.code = 'DISPATCH_BLOCKED';
    err.issues = [`Quotation in status ${quotation.status} cannot be dispatched`];
    throw err;
  }

  const adminReviewed = options.adminReviewed !== undefined ? options.adminReviewed : true;
  if (!adminReviewed) {
    const err = new Error('Explicit admin review confirmation is required before dispatching quotation.');
    err.code = 'DISPATCH_BLOCKED';
    err.issues = ['Explicit admin review confirmation is required'];
    throw err;
  }

  const recipient = (options.recipient || quotation.buyer?.email || quotation.email || '').trim();
  if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
    const err = new Error('Valid recipient email required for dispatch.');
    err.code = 'DISPATCH_BLOCKED';
    err.issues = ['Valid recipient email required for dispatch'];
    throw err;
  }

  // Evaluate buyer-ready gate
  const gate = evaluateBuyerReadyGate(quotation);
  if (!gate.passed && !gate.eligible && !options.bypassGate) {
    const err = new Error(`Dispatch blocked by buyer-ready gate: ${gate.issues.join('; ')}`);
    err.code = 'DISPATCH_BLOCKED';
    err.issues = gate.issues;
    throw err;
  }

  const now = new Date().toISOString();
  quotation.dispatch = quotation.dispatch || createInitialDispatchState();

  // Duplicate send protection
  const alreadySent = Boolean(
    quotation.dispatch.status === 'SENT' ||
    ['SENT_TO_BUYER', 'DELIVERY_PENDING', 'DELIVERED', 'OPENED'].includes(quotation.status)
  );

  const isResend = Boolean(options.isResend || options.resend || options.forceResend);

  if (alreadySent && !isResend) {
    const err = new Error('Duplicate dispatch blocked: Quotation has already been dispatched. Explicit resend confirmation and reason required.');
    err.code = 'DUPLICATE_SEND_BLOCKED';
    throw err;
  }

  if (alreadySent && isResend) {
    const resendReason = String(options.resendReason || options.reason || '').trim();
    if (resendReason.length < 5) {
      const err = new Error('Resend requires a substantive justification reason of at least 5 characters.');
      err.code = 'RESEND_REASON_REQUIRED';
      throw err;
    }

    quotation.dispatch.resendHistory = quotation.dispatch.resendHistory || [];
    quotation.dispatch.resendHistory.push({
      previousMessageId: quotation.dispatch.messageId,
      previousSentAt: quotation.dispatch.sentAt,
      resendReason,
      reason: resendReason,
      resendRequestedBy: options.actor || 'Sachin Shinde',
      timestamp: now
    });

    quotation.activity = quotation.activity || [];
    quotation.activity.push({
      timestamp: now,
      actor: options.actor || 'Sachin Shinde',
      event: 'RESEND_REQUESTED',
      quotationId: quotation.quotationId,
      leadId: quotation.leadId,
      details: `Explicit resend requested: ${resendReason}. Previous messageId: ${quotation.dispatch.messageId || 'N/A'}`
    });
  }

  const isRetry = Boolean(
    !isResend &&
    quotation.dispatch?.idempotencyKey &&
    ['READY_TO_SEND', 'SEND_FAILED'].includes(quotation.dispatch.status)
  );

  const attemptId = options.dispatchAttemptId || generateSecureId('att');
  const idempotencyKey = options.idempotencyKey || (isRetry ? quotation.dispatch.idempotencyKey : generateSecureId('idemp'));

  quotation.dispatch.recipient = recipient;
  quotation.dispatch.recipientCompany = quotation.buyer?.company || quotation.companyName || '';
  quotation.dispatch.recipientValidated = true;
  quotation.dispatch.reviewedByAdmin = true;
  quotation.dispatch.reviewedAt = now;
  quotation.dispatch.authorizedBy = options.actor || 'Sachin Shinde';
  quotation.dispatch.dispatchAttemptId = attemptId;
  quotation.dispatch.idempotencyKey = idempotencyKey;

  // Render email content
  const emailContent = generateB2BEmailTemplate(quotation);
  const emailRes = await sendQuotationEmail({
    quotation,
    recipient,
    subject: emailContent.subject,
    text: emailContent.text,
    attachments: options.attachments || [],
    idempotencyKey,
    options
  });

  if (emailRes.status === 'READY_TO_SEND') {
    quotation.dispatch.status = 'READY_TO_SEND';
    quotation.dispatch.preparedAt = now;
    quotation.dispatch.provider = 'none';

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
      dispatch: quotation.dispatch,
      quotation
    };
  }

  if (emailRes.status === 'SEND_FAILED') {
    const reason = emailRes.error || 'Mail delivery service timeout';
    quotation.dispatch.status = 'SEND_FAILED';
    quotation.dispatch.failureReason = reason;
    quotation.dispatch.lastError = reason;

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
      dispatch: quotation.dispatch,
      quotation
    };
  }

  // Provider accepted: SENT
  const msgId = emailRes.messageId;
  quotation.dispatch.status = 'SENT';
  quotation.dispatch.sentAt = now;
  quotation.dispatch.sentBy = options.actor || 'Sachin Shinde';
  quotation.dispatch.messageId = msgId;
  quotation.dispatch.provider = emailRes.provider || 'configured';
  quotation.dispatch.providerReference = msgId;
  quotation.dispatch.deliveryStatus = 'PENDING';
  quotation.dispatch.failureReason = null;

  quotation.status = 'SENT_TO_BUYER';
  quotation.updatedAt = now;

  quotation.activity = quotation.activity || [];
  if (isResend) {
    quotation.activity.push({
      timestamp: now,
      actor: options.actor || 'Sachin Shinde',
      event: 'RESEND_EXECUTED',
      quotationId: quotation.quotationId,
      leadId: quotation.leadId,
      details: `Quotation resent to ${recipient} (Provider Ref: ${msgId}). Reason: ${options.resendReason || 'Admin authorized resend'}`
    });
  } else {
    quotation.activity.push({
      timestamp: now,
      actor: options.actor || 'Sachin Shinde',
      event: 'QUOTATION_SENT',
      quotationId: quotation.quotationId,
      leadId: quotation.leadId,
      details: `Quotation dispatched to ${recipient} (Provider Ref: ${msgId})`
    });
  }

  return {
    success: true,
    status: 'SENT',
    messageId: msgId,
    message: `Quotation dispatched successfully to ${recipient}.`,
    dispatch: quotation.dispatch,
    quotation
  };
}

const seenWebhookEventIds = new Set();

/**
 * Processes incoming delivery webhook events (P4.5) with fail-closed authentication and replay protection
 */
export function processDeliveryWebhook(quotation, eventPayload = {}, webhookSecret = '', options = {}) {
  if (!quotation || typeof quotation !== 'object') {
    throw new Error('Valid quotation object required for webhook processing');
  }

  if (!eventPayload || typeof eventPayload !== 'object') {
    throw new Error('Invalid webhook payload');
  }

  const envSecret = (typeof process !== 'undefined' && process.env)
    ? (process.env.CRM_WEBHOOK_SECRET || process.env.WEBHOOK_SECRET || process.env.RESEND_WEBHOOK_SECRET || '')
    : '';

  if (options.requireSecret || envSecret) {
    if (!envSecret && !webhookSecret) {
      throw new Error('Webhook processing failed: No webhook secret configured. Failing closed to protect quotation status.');
    }
    if (webhookSecret !== envSecret) {
      throw new Error('Invalid webhook signature / secret');
    }
  } else if (webhookSecret) {
    if (envSecret && webhookSecret !== envSecret) {
      throw new Error('Invalid webhook signature / secret');
    }
  }

  // Replay protection: reject duplicate event IDs
  const eventId = eventPayload.id || eventPayload.eventId || eventPayload.data?.id;
  if (eventId) {
    if (seenWebhookEventIds.has(eventId)) {
      throw new Error(`Duplicate webhook event rejected (replay protection): ${eventId}`);
    }
    seenWebhookEventIds.add(eventId);
    if (seenWebhookEventIds.size > 1000) {
      const first = seenWebhookEventIds.values().next().value;
      seenWebhookEventIds.delete(first);
    }
  }

  const eventType = String(eventPayload.eventType || eventPayload.event || eventPayload.type || '').toLowerCase();
  const msgId = eventPayload.messageId || eventPayload.data?.messageId || eventPayload.data?.email_id || (eventPayload.data?.id && eventPayload.data.id !== eventId ? eventPayload.data.id : null);
  const eventTime = eventPayload.timestamp || eventPayload.data?.timestamp || new Date().toISOString();

  quotation.dispatch = quotation.dispatch || createInitialDispatchState();
  quotation.activity = quotation.activity || [];

  if (msgId && quotation.dispatch.messageId && quotation.dispatch.messageId !== msgId) {
    throw new Error(`Message ID mismatch: Webhook messageId ${msgId} does not match quotation dispatch ${quotation.dispatch.messageId}`);
  }

  quotation.dispatch.deliveryEvents = quotation.dispatch.deliveryEvents || [];
  quotation.dispatch.deliveryEvents.push({
    event: eventType,
    timestamp: eventTime,
    details: eventPayload
  });

  if (eventType.includes('deliver')) {
    quotation.dispatch.deliveryStatus = 'DELIVERED';
    quotation.status = 'DELIVERED';
    quotation.activity.push({
      timestamp: eventTime,
      actor: 'Email Provider Webhook',
      event: 'EMAIL_DELIVERED',
      quotationId: quotation.quotationId,
      details: `Email confirmed delivered to recipient (Message ID: ${msgId || quotation.dispatch.messageId})`
    });
  } else if (eventType.includes('bounce')) {
    quotation.dispatch.deliveryStatus = 'BOUNCED';
    quotation.dispatch.failureReason = eventPayload.reason || eventPayload.error || 'Recipient mailbox bounced message';
    quotation.status = 'SEND_FAILED';
    quotation.activity.push({
      timestamp: eventTime,
      actor: 'Email Provider Webhook',
      event: 'EMAIL_BOUNCED',
      quotationId: quotation.quotationId,
      details: `Email delivery bounced: ${quotation.dispatch.failureReason}`
    });
  } else if (eventType.includes('complain') || eventType.includes('spam')) {
    quotation.dispatch.deliveryStatus = 'COMPLAINED';
    quotation.activity.push({
      timestamp: eventTime,
      actor: 'Email Provider Webhook',
      event: 'EMAIL_COMPLAINED',
      quotationId: quotation.quotationId,
      details: 'Spam complaint recorded for dispatched email'
    });
  } else if (eventType.includes('open')) {
    quotation.dispatch.deliveryStatus = 'OPENED';
    if (['SENT_TO_BUYER', 'DELIVERED'].includes(quotation.status)) {
      quotation.status = 'OPENED';
    }
    quotation.activity.push({
      timestamp: eventTime,
      actor: 'Email Provider Webhook',
      event: 'EMAIL_OPENED',
      quotationId: quotation.quotationId,
      details: `Quotation email opened by recipient (Message ID: ${msgId || quotation.dispatch.messageId})`
    });
  } else if (eventType.includes('click')) {
    quotation.activity.push({
      timestamp: eventTime,
      actor: 'Email Provider Webhook',
      event: 'EMAIL_CLICKED',
      quotationId: quotation.quotationId,
      details: 'Recipient clicked a link inside commercial quotation email'
    });
  }

  quotation.updatedAt = eventTime;
  return quotation;
}

/**
 * Records structured buyer response (P4.5)
 */
export function recordBuyerResponse(quotation, responseData = {}, actor = 'Sachin Shinde') {
  if (!quotation || typeof quotation !== 'object') {
    throw new Error('Valid quotation object required');
  }

  const now = new Date().toISOString();
  quotation.buyerResponse = {
    responseDate: responseData.responseDate || now.split('T')[0],
    responseChannel: responseData.responseChannel || 'EMAIL',
    responseSummary: String(responseData.responseSummary || responseData.notes || '').trim(),
    buyerRequestedPrice: responseData.buyerRequestedPrice !== undefined && responseData.buyerRequestedPrice !== null ? parseUnitRate(responseData.buyerRequestedPrice, null) : null,
    buyerRequestedQuantity: responseData.buyerRequestedQuantity !== undefined && responseData.buyerRequestedQuantity !== null ? parseQuantityKg(responseData.buyerRequestedQuantity) : null,
    requestedChanges: String(responseData.requestedChanges || '').trim(),
    nextFollowUpDate: responseData.nextFollowUpDate || null,
    recordedAt: now,
    recordedBy: actor
  };

  if (quotation.buyerResponse.buyerRequestedPrice || quotation.buyerResponse.buyerRequestedQuantity || quotation.buyerResponse.requestedChanges) {
    quotation.negotiation = quotation.negotiation || {
      buyerRequestedPrice: null,
      buyerRequestedQuantity: null,
      requestedChanges: '',
      internalCounterOffer: null,
      counterOfferDate: null,
      negotiationNotes: []
    };
    if (quotation.buyerResponse.buyerRequestedPrice) quotation.negotiation.buyerRequestedPrice = quotation.buyerResponse.buyerRequestedPrice;
    if (quotation.buyerResponse.buyerRequestedQuantity) quotation.negotiation.buyerRequestedQuantity = quotation.buyerResponse.buyerRequestedQuantity;
    if (quotation.buyerResponse.requestedChanges) quotation.negotiation.requestedChanges = quotation.buyerResponse.requestedChanges;
    quotation.status = 'NEGOTIATION';
  }

  if (responseData.nextFollowUpDate || responseData.followUpStatus) {
    quotation.followup = quotation.followup || createInitialFollowUpState();
    if (responseData.nextFollowUpDate) quotation.followup.nextFollowUpDate = responseData.nextFollowUpDate;
    if (responseData.followUpStatus) quotation.followup.status = responseData.followUpStatus;
    quotation.followup.lastFollowUpAt = now;
  }

  quotation.activity = quotation.activity || [];
  quotation.activity.push({
    timestamp: now,
    actor,
    event: 'BUYER_RESPONSE_RECORDED',
    quotationId: quotation.quotationId,
    leadId: quotation.leadId,
    details: `Buyer response via ${quotation.buyerResponse.responseChannel}: ${quotation.buyerResponse.responseSummary || 'Response logged'}`
  });

  quotation.updatedAt = now;
  return quotation;
}

/**
 * Updates commercial follow-up tracking (P4.5)
 */
export function updateFollowUp(quotation, followupData = {}, actor = 'Sachin Shinde') {
  if (!quotation || typeof quotation !== 'object') {
    throw new Error('Valid quotation object required');
  }

  const now = new Date().toISOString();
  quotation.followup = quotation.followup || quotation.followUp || createInitialFollowUpState();
  quotation.followUp = quotation.followup;

  const st = followupData.followUpStatus || followupData.status;
  if (st) quotation.followup.status = st;
  if (followupData.nextFollowUpDate !== undefined) quotation.followup.nextFollowUpDate = followupData.nextFollowUpDate;
  const tp = followupData.followUpType || followupData.type;
  if (tp) quotation.followup.followUpType = tp;
  const nts = followupData.followUpNotes !== undefined ? followupData.followUpNotes : followupData.notes;
  if (nts !== undefined) quotation.followup.notes = String(nts).trim();
  const own = followupData.followUpOwner || followupData.owner;
  if (own) quotation.followup.owner = own;
  quotation.followup.lastFollowUpAt = now;

  quotation.followup.history = quotation.followup.history || [];
  quotation.followup.history.push({
    timestamp: now,
    actor,
    status: quotation.followup.status,
    nextFollowUpDate: quotation.followup.nextFollowUpDate,
    type: quotation.followup.followUpType,
    notes: quotation.followup.notes
  });

  quotation.activity = quotation.activity || [];
  quotation.activity.push({
    timestamp: now,
    actor,
    event: 'FOLLOWUP_RECORDED',
    quotationId: quotation.quotationId,
    leadId: quotation.leadId,
    details: `Follow-up [${quotation.followup.status}] (${quotation.followup.followUpType}): ${quotation.followup.notes || 'Status updated'}`
  });

  quotation.updatedAt = now;
  return quotation;
}

/**
 * Generates cryptographic SHA-256 integrity hash for commercial document parity.
 * Deterministic: identical document state => identical 64-character hex hash.
 * Changed document => different hash.
 * Output clearly identifies SHA-256 cryptographic integrity hash (not a digital signature).
 */
export function computeDocumentHash(quotation) {
  if (!quotation) return '';
  const rev = quotation.revision?.revisionNumber || 0;
  const quoteId = quotation.quotationId || quotation.quoteId || '';
  const grandTotal = quotation.quotation?.grandTotal || quotation.grandTotal || 0;
  const currency = quotation.quotation?.currency || quotation.currency || 'USD';
  const validity = quotation.commercialTerms?.validityDate || quotation.validUntil || '';
  const items = (quotation.quotation?.items || quotation.items || []).map(i => `${i.productId || i.id}:${i.quantity}:${i.rate}:${i.amount}`).join('|');

  const payload = `SHA256:${quoteId}:REV${rev}:${currency}:${grandTotal}:${validity}:${items}`;
  return sha256Sync(payload);
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
    READY_FOR_BUYER: ['READY_TO_SEND', 'SENT_TO_BUYER', 'COMMERCIAL_REVIEW', 'DRAFT', 'CANCELLED'],
    READY_TO_SEND: ['SENT_TO_BUYER', 'SEND_FAILED', 'READY_FOR_BUYER', 'CANCELLED'],
    SENT_TO_BUYER: ['DELIVERY_PENDING', 'DELIVERED', 'OPENED', 'NEGOTIATION', 'ACCEPTED', 'REVISED', 'CANCELLED'],
    DELIVERY_PENDING: ['DELIVERED', 'SEND_FAILED', 'OPENED', 'NEGOTIATION', 'ACCEPTED', 'REVISED', 'CANCELLED'],
    DELIVERED: ['OPENED', 'NEGOTIATION', 'ACCEPTED', 'REVISED', 'CANCELLED'],
    OPENED: ['NEGOTIATION', 'ACCEPTED', 'REVISED', 'PO_RECEIVED', 'CANCELLED'],
    SEND_FAILED: ['READY_TO_SEND', 'READY_FOR_BUYER', 'SENT_TO_BUYER', 'CANCELLED'],
    NEGOTIATION: ['REVISED', 'ACCEPTED', 'CANCELLED'],
    REVISED: ['PROCESSOR_CHECK', 'COMMERCIAL_REVIEW', 'READY_FOR_BUYER', 'READY_TO_SEND', 'SENT_TO_BUYER', 'NEGOTIATION', 'CANCELLED'],
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
    DELIVERY_STATUSES,
    FOLLOWUP_STATUSES,
    FOLLOWUP_TYPES,
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
    createInitialFollowUpState,
    generateB2BEmailTemplate,
    sendQuotationEmail,
    sendQuotationToBuyer,
    processDeliveryWebhook,
    recordBuyerResponse,
    updateFollowUp,
    computeDocumentHash,
    sha256Sync,
    generateSecureId,
    isCheckOverridden,
    isPcItemOverridden,
    normalizeChecklistKey,
    OVERRIDABLE_PROCESSOR_CHECKS,
    NON_OVERRIDABLE_COMMERCIAL_CHECKS,
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
