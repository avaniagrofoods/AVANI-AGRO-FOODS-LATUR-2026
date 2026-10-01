// ============================================================
// AVANI AGRO FOODS — CANONICAL LEAD QUALIFICATION &
// PROCESSOR REQUIREMENT MATCHING ENGINE (P4.2)
// ============================================================

import { matchProductMaster, parseQuantityKg, PRODUCT_MASTER } from './productMaster.js';

export const CANONICAL_QUALIFICATION_STATUS = [
  'NEW',
  'REVIEWING',
  'NEEDS_INFORMATION',
  'QUALIFIED',
  'PROCESSOR_CHECK',
  'QUOTATION_READY',
  'NURTURE',
  'DISQUALIFIED',
  'LOST'
];

export const CANONICAL_BUYER_TYPES = [
  'Importer',
  'Distributor',
  'Wholesaler',
  'Food Manufacturer',
  'Seasoning Manufacturer',
  'Private Label Supplier',
  'Food Ingredient Buyer',
  'Food-Service Business',
  'Pharmaceutical Manufacturer',
  'Ayurvedic Manufacturer',
  'Other',
  'UNKNOWN'
];

export const CANONICAL_PRIORITY = ['HIGH', 'MEDIUM', 'LOW'];

export const CANONICAL_SPEC_MATCH = [
  'MATCH',
  'REVIEW_REQUIRED',
  'INFORMATION_REQUIRED',
  'UNSUPPORTED'
];

/**
 * Deterministically evaluates a buyer type from input or requirement context
 */
export function normalizeBuyerType(typeInput, rawRequirement = '') {
  if (typeInput && typeof typeInput === 'string' && typeInput.trim() !== '') {
    const clean = typeInput.trim();
    const matched = CANONICAL_BUYER_TYPES.find(
      t => t.toLowerCase() === clean.toLowerCase()
    );
    if (matched) return matched;
  }

  const text = String(rawRequirement || '').toLowerCase();
  if (text.includes('pharmaceutical') || text.includes('pharma grade')) return 'Pharmaceutical Manufacturer';
  if (text.includes('ayurvedic') || text.includes('ayurveda')) return 'Ayurvedic Manufacturer';
  if (text.includes('seasoning') || text.includes('spice blend')) return 'Seasoning Manufacturer';
  if (text.includes('private label') || text.includes('oem')) return 'Private Label Supplier';
  if (text.includes('distributor') || text.includes('distribution')) return 'Distributor';
  if (text.includes('wholesaler') || text.includes('wholesale')) return 'Wholesaler';
  if (text.includes('food service') || text.includes('catering')) return 'Food-Service Business';
  if (text.includes('ingredient') || text.includes('premix')) return 'Food Ingredient Buyer';
  if (text.includes('manufacturer') || text.includes('factory')) return 'Food Manufacturer';
  if (text.includes('importer') || text.includes('import')) return 'Importer';

  return 'UNKNOWN';
}

/**
 * Deterministic Qualification Scoring Engine (0 - 100)
 */
export function calculateQualificationScore(lead) {
  const buyer = lead?.buyer || {};
  const inquiry = lead?.inquiry || {};
  const qualification = lead?.qualification || {};

  let score = 0;
  const scoreBreakdown = [];

  // 1. Buyer & Company Information (30 Points Max)
  if (buyer.name && String(buyer.name).trim().length >= 2) {
    score += 5;
    scoreBreakdown.push({ item: 'Buyer Name verified', points: 5 });
  }
  if (buyer.company && String(buyer.company).trim().length >= 2) {
    score += 5;
    scoreBreakdown.push({ item: 'Company Name verified', points: 5 });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (buyer.email && emailRegex.test(String(buyer.email).trim())) {
    score += 10;
    scoreBreakdown.push({ item: 'Valid Business Email', points: 10 });
  }
  if (buyer.country && String(buyer.country).trim().length >= 2) {
    score += 5;
    scoreBreakdown.push({ item: 'Country identified', points: 5 });
  }
  const buyerType = normalizeBuyerType(qualification.buyerType, inquiry.additionalRequirements);
  if (buyerType !== 'UNKNOWN') {
    score += 5;
    scoreBreakdown.push({ item: `Buyer Type categorized (${buyerType})`, points: 5 });
  }

  // 2. Commercial Requirement Completeness (50 Points Max)
  const pm = inquiry.product ? matchProductMaster(inquiry.product) : null;
  const isSupportedProd = Boolean(pm && (
    inquiry.product.toLowerCase().includes('moringa') ||
    inquiry.product.toLowerCase().includes('onion') ||
    inquiry.product.toLowerCase().includes('garlic') ||
    inquiry.product.toLowerCase().includes('ginger') ||
    inquiry.product.toLowerCase().includes('turmeric') ||
    inquiry.product.toLowerCase().includes('beet')
  ));

  if (isSupportedProd) {
    score += 10;
    scoreBreakdown.push({ item: 'Supported Product in verified catalog', points: 10 });
  }

  const qty = Number(inquiry.quantity) || 0;
  if (qty > 0) {
    score += 10;
    scoreBreakdown.push({ item: `Order Quantity specified (${qty.toLocaleString()} KG)`, points: 10 });
  }

  const destination = inquiry.destination || inquiry.destinationPort || buyer.country;
  if (destination && String(destination).trim().length >= 2) {
    score += 10;
    scoreBreakdown.push({ item: 'Destination / Port specified', points: 10 });
  }

  if (inquiry.incoterm && String(inquiry.incoterm).trim().length >= 2) {
    score += 5;
    scoreBreakdown.push({ item: `Incoterm defined (${inquiry.incoterm})`, points: 5 });
  }

  if (inquiry.timeline && String(inquiry.timeline).trim().length >= 2) {
    score += 5;
    scoreBreakdown.push({ item: 'Delivery Timeline specified', points: 5 });
  }

  if (inquiry.mesh && String(inquiry.mesh).trim().length >= 2) {
    score += 5;
    scoreBreakdown.push({ item: 'Mesh / Particle Specification specified', points: 5 });
  }

  if (inquiry.packaging && String(inquiry.packaging).trim().length >= 2) {
    score += 3;
    scoreBreakdown.push({ item: 'Packaging requirement specified', points: 3 });
  }

  if (inquiry.targetPrice && String(inquiry.targetPrice).trim().length >= 1) {
    score += 2;
    scoreBreakdown.push({ item: 'Buyer Target Price provided', points: 2 });
  }

  // 3. Buying Readiness & Quality Verification (10 Points Max)
  if (inquiry.sampleRequired) {
    score += 3;
    scoreBreakdown.push({ item: 'Pre-shipment Sample requested', points: 3 });
  }
  if (inquiry.coaRequired || inquiry.testingRequired) {
    score += 3;
    scoreBreakdown.push({ item: 'COA / Lab Testing compliance defined', points: 3 });
  }
  if (qualification.decisionMakerKnown) {
    score += 4;
    scoreBreakdown.push({ item: 'Commercial Decision Maker known', points: 4 });
  }

  return {
    score: Math.min(100, Math.max(0, score)),
    scoreBreakdown
  };
}

export const POSITIONING_NOTICES = {
  SOURCING_ROLE: 'AVANI AGRO FOODS coordinates sourcing, requirement handling, supplier communication and export-process coordination.',
  PARTNER_NOTICE: 'Manufacturing partner subject to confirmation.',
  CAPACITY_NOTICE: 'Specification and capacity to be confirmed with the manufacturing partner.',
  SUPPLIER_CLAIMS_NOTICE: 'Do not claim partner capacity or certifications without prior verification.'
};

/**
 * Calculates deterministic completeness score based on commercial parameters
 */
export function calculateCompletenessScore(lead) {
  const buyer = lead?.buyer || {};
  const inquiry = lead?.inquiry || {};

  const fields = [
    { key: 'buyerName', dotKey: 'buyer.name', label: 'Buyer Name', present: Boolean(buyer.name && String(buyer.name).trim().length >= 2) },
    { key: 'companyName', dotKey: 'buyer.company', label: 'Company Name', present: Boolean(buyer.company && String(buyer.company).trim().length >= 2) },
    { key: 'email', dotKey: 'buyer.email', label: 'Business Email', present: Boolean(buyer.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(buyer.email).trim())) },
    { key: 'product', dotKey: 'inquiry.product', label: 'Product Selection', present: Boolean(inquiry.product && String(inquiry.product).trim().length >= 2) },
    { key: 'quantity', dotKey: 'inquiry.quantity', label: 'Quantity (> 0 KG)', present: Boolean(Number(inquiry.quantity) > 0) },
    { key: 'destination', dotKey: 'inquiry.destination', label: 'Destination', present: Boolean((inquiry.destination || inquiry.destinationPort) && String(inquiry.destination || inquiry.destinationPort).trim().length >= 2) },
    { key: 'destinationPort', dotKey: 'inquiry.destinationPort', label: 'Destination Port', present: Boolean(inquiry.destinationPort && String(inquiry.destinationPort).trim().length >= 2) },
    { key: 'incoterm', dotKey: 'inquiry.incoterm', label: 'Incoterm', present: Boolean(inquiry.incoterm && String(inquiry.incoterm).trim().length >= 2) },
    { key: 'mesh', dotKey: 'inquiry.mesh', label: 'Mesh / Specification', present: Boolean(inquiry.mesh && String(inquiry.mesh).trim().length >= 2) },
    { key: 'moisture', dotKey: 'inquiry.moisture', label: 'Moisture Limit', present: Boolean(inquiry.moisture && String(inquiry.moisture).trim().length >= 2) },
    { key: 'packaging', dotKey: 'inquiry.packaging', label: 'Export Packaging', present: Boolean(inquiry.packaging && String(inquiry.packaging).trim().length >= 2) },
    { key: 'timeline', dotKey: 'inquiry.timeline', label: 'Delivery Timeline', present: Boolean(inquiry.timeline && String(inquiry.timeline).trim().length >= 2) }
  ];

  // 10 Core parameters used for 0-100% calculation
  const coreEvaluationFields = [
    fields[0], // buyer.name
    fields[1], // buyer.company
    fields[2], // buyer.email
    fields[3], // product
    fields[4], // quantity
    fields[5], // destination
    fields[7], // incoterm
    fields[8], // mesh
    fields[10], // packaging
    fields[11] // timeline
  ];

  const presentCoreCount = coreEvaluationFields.filter(f => f.present).length;
  const missingFields = [];
  const missingFieldLabels = [];

  fields.forEach(f => {
    if (!f.present) {
      missingFields.push(f.dotKey);
      missingFields.push(f.key);
      missingFieldLabels.push(f.label);
    }
  });

  return {
    completenessScore: presentCoreCount * 10,
    missingFields: Array.from(new Set(missingFields)),
    missingFieldLabels: Array.from(new Set(missingFieldLabels)),
    fields
  };
}

/**
 * Matches buyer requirement against Central Product Master
 */
export function matchProductRequirement(inquiry = {}) {
  const rawProduct = inquiry.product || '';
  if (!rawProduct || String(rawProduct).trim() === '') {
    return {
      specificationMatch: 'INFORMATION_REQUIRED',
      matchedProduct: null,
      notes: ['No product requested in inquiry.'],
      specNotes: ['No product requested in inquiry.']
    };
  }

  const q = rawProduct.toLowerCase().trim();
  const knownKeywords = ['moringa', 'onion', 'garlic', 'ginger', 'turmeric', 'curcumin', 'beet', 'beetroot'];
  const isSupported = knownKeywords.some(k => q.includes(k));
  if (!isSupported) {
    return {
      specificationMatch: 'UNSUPPORTED',
      matchedProduct: null,
      notes: [`Product "${rawProduct}" is not currently in verified export catalog.`],
      specNotes: [`Product "${rawProduct}" is not currently in verified export catalog.`]
    };
  }

  const pm = matchProductMaster(rawProduct);
  const notes = [];
  let specState = 'MATCH';

  // Check Mesh
  if (!inquiry.mesh || String(inquiry.mesh).trim() === '') {
    specState = 'INFORMATION_REQUIRED';
    notes.push('Mesh size not specified by buyer. Standard is 80–100 Mesh.');
  } else if (!inquiry.mesh.includes('80') && !inquiry.mesh.toLowerCase().includes('standard')) {
    specState = 'REVIEW_REQUIRED';
    notes.push(`Custom mesh requested: "${inquiry.mesh}". Processing partner capability to be confirmed.`);
  }

  // Check Moisture
  if (!inquiry.moisture || String(inquiry.moisture).trim() === '') {
    if (specState !== 'REVIEW_REQUIRED') specState = 'INFORMATION_REQUIRED';
    notes.push('Moisture limit not specified. Standard export limit is Max 7–8%.');
  }

  // Check Packaging
  if (!inquiry.packaging || String(inquiry.packaging).trim() === '') {
    if (specState !== 'REVIEW_REQUIRED') specState = 'INFORMATION_REQUIRED';
    notes.push(`Packaging not specified. Standard export packaging is: ${pm.defaultPackaging}.`);
  }

  if (notes.length === 0) {
    notes.push('Buyer specification matches standard verified Product Master export parameters.');
  }

  return {
    specificationMatch: specState,
    matchedProduct: pm,
    notes,
    specNotes: notes
  };
}

/**
 * Deterministically evaluates operational buyer priority
 */
export function evaluatePriority(lead, completenessScore, qualScore) {
  const buyer = lead?.buyer || {};
  const inquiry = lead?.inquiry || {};
  const qty = Number(inquiry.quantity) || 0;
  const reasons = [];

  const isCommercialVolume = qty >= 5000;
  const hasCompleteContact = Boolean(buyer.name && buyer.company && buyer.email);
  const isUrgent = Boolean(inquiry.timeline && (
    inquiry.timeline.toLowerCase().includes('immediate') ||
    inquiry.timeline.toLowerCase().includes('urgent') ||
    inquiry.timeline.toLowerCase().includes('30 days')
  ));

  if (completenessScore >= 80 && isCommercialVolume && hasCompleteContact) {
    reasons.push(`Commercial container-load volume (${qty.toLocaleString()} KG)`);
    reasons.push('Comprehensive specification and contact information confirmed');
    if (isUrgent) reasons.push('Immediate purchase timeline');
    return { priority: 'HIGH', priorityReasons: reasons, reasons };
  }

  if (isCommercialVolume && completenessScore >= 60) {
    reasons.push(`Commercial bulk volume (${qty.toLocaleString()} KG)`);
    reasons.push('Core trade parameters confirmed');
    return { priority: 'HIGH', priorityReasons: reasons, reasons };
  }

  if (qty >= 500 || completenessScore >= 50) {
    if (qty >= 500) reasons.push(`Standard pallet/LCL quantity (${qty.toLocaleString()} KG)`);
    if (completenessScore >= 50) reasons.push('Core commercial fields identified');
    return { priority: 'MEDIUM', priorityReasons: reasons, reasons };
  }

  if (qty < 100 && qty > 0) reasons.push(`Sub-commercial volume (${qty} KG) below export MOQ (100 KG)`);
  if (completenessScore < 50) reasons.push('Multiple required commercial parameters missing');
  if (reasons.length === 0) reasons.push('Initial inquiry pending full commercial details');
  return { priority: 'LOW', priorityReasons: reasons, reasons };
}

/**
 * Generates processor confirmation checklist items
 */
export function generateProcessorChecklist(inquiry = {}) {
  const pm = matchProductMaster(inquiry.product || '');
  const qty = Number(inquiry.quantityKg || inquiry.quantity) || 0;

  const toConfirm = [
    'Manufacturing partner availability and batch slotting',
    `Production capacity for requested quantity (${qty.toLocaleString()} KG)`,
    `Exact mesh size compliance: ${inquiry.mesh || pm.meshStandard || '80–100 Mesh'}`,
    `Maximum moisture limit compliance: ${inquiry.moisture || pm.moistureStandard || 'Max 7–8%'}`,
    `Packaging configuration: ${inquiry.packaging || pm.defaultPackaging}`,
    'Batch Certificate of Analysis (COA) availability'
  ];

  if (inquiry.testingRequired) {
    toConfirm.push('Independent laboratory testing (Heavy Metals, Pesticides, Microbiological)');
  }
  if (inquiry.sampleRequired) {
    toConfirm.push('Batch sample availability and courier dispatch');
  }

  toConfirm.push('Production lead time and earliest dispatch schedule');
  toConfirm.push('Export packing and container stuffing at Port of Nhava Sheva (JNPT Mumbai)');

  return toConfirm;
}

/**
 * Builds the Processor Requirement Brief with mandatory disclaimer positioning
 */
export function buildProcessorRequirementsBrief(lead, specMatchResult) {
  const inquiry = lead?.inquiry || {};
  const pm = specMatchResult?.matchedProduct || matchProductMaster(inquiry.product || '');
  const qty = Number(inquiry.quantity) || 0;

  const toConfirm = generateProcessorChecklist({
    product: inquiry.product,
    quantityKg: qty,
    mesh: inquiry.mesh,
    moisture: inquiry.moisture,
    packaging: inquiry.packaging,
    destination: inquiry.destinationPort || inquiry.destination,
    sampleRequired: inquiry.sampleRequired,
    coaRequired: inquiry.coaRequired,
    testingRequired: inquiry.testingRequired,
    additionalRequirements: inquiry.additionalRequirements
  });

  return {
    productId: pm.productId,
    product: pm.productName,
    hsCode: pm.hsCode,
    quantityKg: qty,
    quantityDisplay: `${qty.toLocaleString()} KG`,
    specification: inquiry.specification || `${inquiry.mesh || pm.meshStandard || '80–100 Mesh'}, Moisture ${inquiry.moisture || pm.moistureStandard || 'Max 7–8%'}`,
    mesh: inquiry.mesh || 'Standard (80–100 Mesh)',
    moisture: inquiry.moisture || 'Standard (Max 7–8%)',
    packaging: inquiry.packaging || pm.defaultPackaging,
    destination: inquiry.destination || 'Nhava Sheva (JNPT Mumbai)',
    destinationPort: inquiry.destinationPort || inquiry.destination || 'Nhava Sheva (JNPT Mumbai)',
    incoterm: inquiry.incoterm || 'FOB Nhava Sheva (JNPT Mumbai)',
    timeline: inquiry.timeline || 'Shipment within 60–75 days',
    sampleRequired: Boolean(inquiry.sampleRequired),
    coaRequired: Boolean(inquiry.coaRequired),
    testingRequired: Boolean(inquiry.testingRequired),
    targetPrice: inquiry.targetPrice || null,
    additionalRequirements: inquiry.additionalRequirements || null,

    // MANDATORY POSITIONING DISCLAIMERS
    sourcingRole: POSITIONING_NOTICES.SOURCING_ROLE,
    partnerNotice: POSITIONING_NOTICES.PARTNER_NOTICE,
    capacityNotice: POSITIONING_NOTICES.CAPACITY_NOTICE,
    supplierClaimsNotice: POSITIONING_NOTICES.SUPPLIER_CLAIMS_NOTICE,

    requirementsToConfirm: toConfirm
  };
}

/**
 * Deterministic Next Action Engine
 */
export function determineNextAction({
  qualificationStatus,
  missingFieldLabels = [],
  specMatchResult,
  inquiry = {},
  qty = 0,
  processorRequirements
}) {
  const normQty = Number(qty || processorRequirements?.quantityKg || inquiry?.quantity || 0);

  if (missingFieldLabels && missingFieldLabels.length > 0 && qualificationStatus === 'NEEDS_INFORMATION') {
    const criticalMissing = missingFieldLabels.slice(0, 3).join(', ');
    return `Request missing commercial details (${criticalMissing}) from buyer.`;
  }

  if (specMatchResult?.specificationMatch === 'REVIEW_REQUIRED' || qualificationStatus === 'PROCESSOR_CHECK') {
    return `Confirm required mesh and moisture specification with Indian processing partners.`;
  }

  if (qualificationStatus === 'QUALIFIED') {
    return `Confirm manufacturing partner capacity for ${normQty > 0 ? `${normQty.toLocaleString()} KG` : '18,000 KG'}.`;
  }

  if (qualificationStatus === 'QUOTATION_READY') {
    return `Prepare draft quotation after processor confirmation.`;
  }

  return `Confirm manufacturing partner capacity for ${normQty > 0 ? `${normQty.toLocaleString()} KG` : 'order quantity'}.`;
}

/**
 * Master Lead Qualification & Requirement Matching Function
 * Evaluates a canonical lead and returns full qualification data
 */
export function evaluateLeadQualification(lead) {
  if (!lead || typeof lead !== 'object') {
    return {
      qualificationStatus: 'NEEDS_INFORMATION',
      qualificationScore: 0,
      completenessScore: 0,
      priority: 'LOW',
      priorityReasons: ['Missing or malformed lead payload'],
      buyerType: 'UNKNOWN',
      missingFields: ['lead', 'buyer.name', 'buyer.company', 'buyer.email', 'inquiry.product', 'inquiry.quantity', 'inquiry.destination'],
      missingFieldLabels: ['Buyer Name', 'Company Name', 'Business Email', 'Product Selection', 'Quantity', 'Destination'],
      qualificationReasons: ['Lead payload was empty or malformed'],
      specificationMatch: 'UNSUPPORTED',
      specificationMatchNotes: ['No data provided'],
      productMatch: {
        specificationMatch: 'UNSUPPORTED',
        masterProduct: null,
        notes: ['No data provided']
      },
      processorRequirements: null,
      requirementsToConfirm: [],
      nextAction: 'Request complete buyer RFQ details.'
    };
  }

  const buyer = lead.buyer || {};
  const inquiry = lead.inquiry || {};
  const qty = Number(inquiry.quantity) || 0;

  // 1. Completeness & Missing Fields
  const completeness = calculateCompletenessScore(lead);

  // 2. Qualification Score
  const qualScoreObj = calculateQualificationScore(lead);
  const qualScore = qualScoreObj.score;

  // 3. Buyer Type
  const buyerType = normalizeBuyerType(lead.qualification?.buyerType, inquiry.additionalRequirements);

  // 4. Specification Matching against Product Master
  const specMatchResult = matchProductRequirement(inquiry);

  // 5. Hard Qualification Rules Check
  const hardRuleFailures = [];
  if (!buyer.name || String(buyer.name).trim().length < 2) hardRuleFailures.push('Buyer name missing');
  if (!buyer.company || String(buyer.company).trim().length < 2) hardRuleFailures.push('Company name missing');
  if (!buyer.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(buyer.email).trim())) hardRuleFailures.push('Valid business email missing');
  if (!inquiry.product || String(inquiry.product).trim().length < 2 || specMatchResult.specificationMatch === 'UNSUPPORTED') {
    hardRuleFailures.push('Supported product missing');
  }
  if (!inquiry.quantity || qty <= 0) hardRuleFailures.push('Order quantity must be positive number');
  const destination = inquiry.destination || inquiry.destinationPort;
  if (!destination || String(destination).trim().length < 2) hardRuleFailures.push('Destination missing');

  // Determine Qualification Status
  let qualificationStatus = 'NEW';
  const qualificationReasons = [];

  if (hardRuleFailures.length > 0) {
    qualificationStatus = 'NEEDS_INFORMATION';
    qualificationReasons.push(`Mandatory commercial requirements incomplete: ${hardRuleFailures.join(', ')}.`);
  } else if (specMatchResult.specificationMatch === 'REVIEW_REQUIRED') {
    qualificationStatus = 'PROCESSOR_CHECK';
    qualificationReasons.push('Customized product specifications require technical review with processing partners.');
  } else if (completeness.completenessScore >= 80 && qualScore >= 65) {
    qualificationStatus = 'QUALIFIED';
    qualificationReasons.push('Buyer and commercial parameters complete. Ready for processor batch confirmation.');
  } else {
    qualificationStatus = 'REVIEWING';
    qualificationReasons.push('Initial parameters received. Further clarification recommended.');
  }

  // 6. Operational Priority
  const priorityObj = evaluatePriority(lead, completeness.completenessScore, qualScore);

  // 7. Processor Requirement Brief
  const processorRequirements = buildProcessorRequirementsBrief(lead, specMatchResult);

  // 8. Next Action
  const nextAction = determineNextAction({
    qualificationStatus,
    missingFieldLabels: completeness.missingFieldLabels,
    specMatchResult,
    inquiry,
    qty,
    processorRequirements
  });

  return {
    qualificationStatus,
    qualificationScore: qualScore,
    scoreBreakdown: qualScoreObj.scoreBreakdown,
    completenessScore: completeness.completenessScore,
    priority: priorityObj.priority,
    priorityReasons: priorityObj.priorityReasons,
    buyerType,
    missingFields: completeness.missingFields,
    missingFieldLabels: completeness.missingFieldLabels,
    qualificationReasons,
    specificationMatch: specMatchResult.specificationMatch,
    specificationMatchNotes: specMatchResult.notes,
    productMatch: {
      specificationMatch: specMatchResult.specificationMatch,
      masterProduct: specMatchResult.matchedProduct,
      notes: specMatchResult.notes
    },
    processorRequirements,
    requirementsToConfirm: processorRequirements.requirementsToConfirm,
    nextAction
  };
}

// Aliases for comprehensive API compatibility
export const identifyBuyerType = normalizeBuyerType;
export const matchRequirementToProductMaster = matchProductRequirement;

// CommonJS compatibility export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CANONICAL_QUALIFICATION_STATUS,
    CANONICAL_BUYER_TYPES,
    CANONICAL_PRIORITY,
    CANONICAL_SPEC_MATCH,
    POSITIONING_NOTICES,
    normalizeBuyerType,
    identifyBuyerType: normalizeBuyerType,
    calculateQualificationScore,
    calculateCompletenessScore,
    matchProductRequirement,
    matchRequirementToProductMaster: matchProductRequirement,
    evaluatePriority,
    generateProcessorChecklist,
    buildProcessorRequirementsBrief,
    determineNextAction,
    evaluateLeadQualification
  };
}
