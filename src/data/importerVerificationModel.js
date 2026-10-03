// ============================================================
// AVANI AGRO FOODS — B2B BUYER VERIFICATION & OUTREACH READINESS
// src/data/importerVerificationModel.js
// Phase 2 Hardened: Truthful, Auditable, Deterministic Multi-Dimensional Verification
// ============================================================

// ── Logical Status Enums ─────────────────────────────────────

export const COMPANY_VERIFICATION_STATUSES = {
  UNVERIFIED: 'UNVERIFIED',
  DOMAIN_ASSOCIATED: 'DOMAIN_ASSOCIATED',
  COMPANY_VERIFIED: 'COMPANY_VERIFIED',
  INVALID: 'INVALID',
  includes: function(v) { return ['UNVERIFIED', 'DOMAIN_ASSOCIATED', 'COMPANY_VERIFIED', 'INVALID'].includes(v); },
  indexOf: function(v) { return ['UNVERIFIED', 'DOMAIN_ASSOCIATED', 'COMPANY_VERIFIED', 'INVALID'].indexOf(v); }
};

export const DOMAIN_VERIFICATION_STATUSES = {
  UNTESTED: 'UNTESTED',
  URL_FORMAT_VALID: 'URL_FORMAT_VALID',
  DOMAIN_REACHABLE: 'DOMAIN_REACHABLE',
  DOMAIN_ASSOCIATED: 'DOMAIN_ASSOCIATED',
  UNVERIFIED: 'UNVERIFIED',
  includes: function(v) {
    return ['UNTESTED', 'URL_FORMAT_VALID', 'DOMAIN_REACHABLE', 'DOMAIN_ASSOCIATED', 'UNVERIFIED'].includes(v);
  }
};

export const EMAIL_DELIVERABILITY_STATUSES = {
  UNTESTED: 'UNTESTED',
  FORMAT_VALID: 'FORMAT_VALID',
  DOMAIN_VALID: 'DOMAIN_VALID',
  DELIVERABILITY_CHECKED: 'DELIVERABILITY_CHECKED',
  DELIVERABLE: 'DELIVERABLE',
  BOUNCE: 'BOUNCE',
  INVALID: 'INVALID',
  includes: function(v) {
    return ['UNTESTED', 'FORMAT_VALID', 'DOMAIN_VALID', 'DELIVERABILITY_CHECKED', 'DELIVERABLE', 'BOUNCE', 'INVALID'].includes(v);
  }
};

export const PHONE_VERIFICATION_STATUSES = {
  UNTESTED: 'UNTESTED',
  FORMAT_VALID: 'FORMAT_VALID',
  VERIFIED: 'VERIFIED',
  INVALID: 'INVALID',
  includes: function(v) {
    return ['UNTESTED', 'FORMAT_VALID', 'VERIFIED', 'INVALID'].includes(v);
  }
};

export const CONTACT_VERIFICATION_STATUSES = {
  UNTESTED: 'UNTESTED',
  FORMAT_VALID: 'FORMAT_VALID',
  DOMAIN_ASSOCIATED: 'DOMAIN_ASSOCIATED',
  CONTACT_VERIFIED: 'CONTACT_VERIFIED',
  EMAIL_DELIVERABILITY_CHECKED: 'EMAIL_DELIVERABILITY_CHECKED',
  PHONE_VERIFIED: 'PHONE_VERIFIED',
  PROCUREMENT_CONTACT_IDENTIFIED: 'PROCUREMENT_CONTACT_IDENTIFIED',
  BOUNCE: 'BOUNCE',
  INVALID: 'INVALID',
  DO_NOT_CONTACT: 'DO_NOT_CONTACT',
  includes: function(v) {
    return [
      'UNTESTED', 'FORMAT_VALID', 'DOMAIN_ASSOCIATED', 'CONTACT_VERIFIED',
      'EMAIL_DELIVERABILITY_CHECKED', 'PHONE_VERIFIED',
      'PROCUREMENT_CONTACT_IDENTIFIED', 'BOUNCE', 'INVALID', 'DO_NOT_CONTACT'
    ].includes(v);
  }
};

export const BUSINESS_FIT_STATUSES = {
  RELEVANT: 'RELEVANT',
  POSSIBLY_RELEVANT: 'POSSIBLY_RELEVANT',
  UNASSESSED: 'UNASSESSED',
  NOT_RELEVANT: 'NOT_RELEVANT',
  includes: function(v) { return ['RELEVANT', 'POSSIBLY_RELEVANT', 'UNASSESSED', 'NOT_RELEVANT'].includes(v); }
};

export const BUYER_TYPES = {
  IMPORTER_CONFIRMED: 'IMPORTER_CONFIRMED',
  IMPORTER_UNCONFIRMED: 'IMPORTER_UNCONFIRMED',
  DISTRIBUTOR: 'DISTRIBUTOR',
  WHOLESALER: 'WHOLESALER',
  MANUFACTURER: 'MANUFACTURER',
  INGREDIENT_BUYER: 'INGREDIENT_BUYER',
  UNKNOWN: 'UNKNOWN',
  includes: function(v) {
    return [
      'IMPORTER_CONFIRMED', 'IMPORTER_UNCONFIRMED', 'DISTRIBUTOR',
      'WHOLESALER', 'MANUFACTURER', 'INGREDIENT_BUYER', 'UNKNOWN'
    ].includes(v);
  }
};

export const DECISION_MAKER_STATUSES = {
  GENERIC_DEPARTMENT: 'GENERIC_DEPARTMENT',
  ROLE_IDENTIFIED: 'ROLE_IDENTIFIED',
  NAME_IDENTIFIED: 'NAME_IDENTIFIED',
  PROCUREMENT_CONFIRMED: 'PROCUREMENT_CONFIRMED',
  NOT_FOUND: 'NOT_FOUND',
  includes: function(v) {
    return ['GENERIC_DEPARTMENT', 'ROLE_IDENTIFIED', 'NAME_IDENTIFIED', 'PROCUREMENT_CONFIRMED', 'NOT_FOUND'].includes(v);
  }
};

export const OUTREACH_STATUSES = {
  NOT_READY: 'NOT_READY',
  READY: 'READY',
  SUPPRESSED: 'SUPPRESSED',
  BOUNCED: 'BOUNCED',
  DO_NOT_CONTACT: 'DO_NOT_CONTACT',
  includes: function(v) {
    return ['NOT_READY', 'READY', 'SUPPRESSED', 'BOUNCED', 'DO_NOT_CONTACT'].includes(v);
  }
};

export const VERIFICATION_METHODS = {
  OFFICIAL_REGISTRY: 'OFFICIAL_REGISTRY',
  OFFICIAL_WEBSITE: 'OFFICIAL_WEBSITE',
  BUSINESS_DIRECTORY: 'BUSINESS_DIRECTORY',
  MANUAL_RESEARCH: 'MANUAL_RESEARCH',
  EMAIL_DELIVERABILITY: 'EMAIL_DELIVERABILITY',
  PHONE_VERIFICATION: 'PHONE_VERIFICATION',
  UNTESTED: 'UNTESTED',
  OTHER: 'OTHER',
  includes: function(v) {
    return [
      'OFFICIAL_REGISTRY', 'OFFICIAL_WEBSITE', 'BUSINESS_DIRECTORY',
      'MANUAL_RESEARCH', 'EMAIL_DELIVERABILITY', 'PHONE_VERIFICATION', 'UNTESTED', 'OTHER'
    ].includes(v);
  }
};

// 21 Required Target Countries
export const REQUIRED_TARGET_COUNTRIES = [
  'USA', 'UK', 'UAE', 'Germany', 'Netherlands', 'Canada', 'Australia',
  'Saudi Arabia', 'Qatar', 'Oman', 'Kuwait', 'Singapore', 'Malaysia', 'Japan',
  'South Korea', 'Vietnam', 'Thailand', 'South Africa', 'Kenya', 'Nigeria', 'Brazil'
];

// ── Canonical Country Normalization ──────────────────────────
export function normalizeCountry(raw) {
  if (!raw || String(raw).trim() === '') return 'Unknown';
  const s = String(raw).trim();
  const upper = s.toUpperCase();
  if (upper === 'KSA' || upper === 'SAUDI' || upper === 'KINGDOM OF SAUDI ARABIA') return 'Saudi Arabia';
  if (upper === 'KOREA' || upper === 'SOUTH KOREA' || upper === 'REPUBLIC OF KOREA') return 'South Korea';
  if (upper === 'UAE' || upper === 'UNITED ARAB EMIRATES') return 'UAE';
  if (upper === 'USA' || upper === 'UNITED STATES' || upper === 'UNITED STATES OF AMERICA') return 'USA';
  if (upper === 'UK' || upper === 'UNITED KINGDOM') return 'UK';
  return s;
}

// ── Syntactic Format Evaluators ──────────────────────────────
export function isRealContact(v) {
  if (!v) return false;
  const s = String(v).trim();
  return s !== '' && s !== 'Not Available' && s !== 'N/A' && s !== 'NA' && s !== 'null' && s !== 'undefined';
}

export function isRealWebsite(v) {
  if (!isRealContact(v)) return false;
  return /^https?:\/\/.+\..+/.test(String(v).trim());
}

export function isRealPhone(v) {
  if (!isRealContact(v)) return false;
  const digits = String(v).replace(/\D/g, '');
  if (digits.length < 7) return false;
  if (/^(\d)\1{7,}$/.test(digits)) return false;
  if (digits.startsWith('123456789') || digits.includes('00000000')) return false;
  return true;
}

export function isRealEmail(v) {
  if (!isRealContact(v)) return false;
  const s = String(v).trim().toLowerCase();
  if (s.includes('sourcing@buyer.com') || s.includes('example.com') || s.includes('test@')) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
}

// ── Backward-Compatible Verification Status Normalization ──────
export function normalizeVerificationStatus(raw) {
  if (!raw || String(raw).trim() === '') return 'NOT_AVAILABLE';
  const upper = String(raw).trim().toUpperCase();
  if (upper === 'VERIFIED') return 'VERIFIED';
  if (upper === 'UNVERIFIED' || upper === 'NEEDS REVIEW' || upper === 'NEEDS_REVIEW' || upper === 'PENDING' || upper === 'ACTIVE') {
    return 'UNVERIFIED';
  }
  return 'UNVERIFIED';
}

// ── Company Verification Evaluator ───────────────────────────
// Hardened: Requires documented legal commercial registry evidence.
// Does NOT infer COMPANY_VERIFIED from a mere legacy spreadsheet flag.
export function evaluateCompanyVerification(record) {
  const rawStatus = String(record.verificationStatus || '').trim().toUpperCase();
  const isLegacyVerified = rawStatus === 'VERIFIED';

  // 1. Explicit official chamber of commerce / ministry trade register evidence
  const hasOfficialRegistry = isLegacyVerified && (
    record.sourceType === 'B2B Trade Research & Verified Commercial Registry' ||
    String(record.source || '').includes('Chamber of Commerce') ||
    String(record.source || '').includes('Ministry of Commerce') ||
    String(record.source || '').includes('Trade Register') ||
    String(record.source || '').includes('Registered Food Processors') ||
    String(record.source || '').includes('Boursa Kuwait') ||
    String(record.source || '').includes('Board of Investment')
  );

  if (hasOfficialRegistry) {
    return COMPANY_VERIFICATION_STATUSES.COMPANY_VERIFIED;
  }

  // 2. Legacy verified with corporate domain matching company presence
  const hasWebsite = isRealWebsite(record.website);
  if (isLegacyVerified && hasWebsite) {
    return COMPANY_VERIFICATION_STATUSES.DOMAIN_ASSOCIATED;
  }

  // 3. All other records (needs review, unverified, or legacy verified without website)
  return COMPANY_VERIFICATION_STATUSES.UNVERIFIED;
}

// ── Domain Verification Evaluator ────────────────────────────
// Hardened: Distinguishes URL format validity from operational reachability & entity association
export function evaluateDomainVerification(website, companyVerificationStatus) {
  if (!isRealWebsite(website)) {
    return DOMAIN_VERIFICATION_STATUSES.UNVERIFIED;
  }
  if (companyVerificationStatus === COMPANY_VERIFICATION_STATUSES.COMPANY_VERIFIED || companyVerificationStatus === COMPANY_VERIFICATION_STATUSES.DOMAIN_ASSOCIATED) {
    return DOMAIN_VERIFICATION_STATUSES.DOMAIN_ASSOCIATED;
  }
  return DOMAIN_VERIFICATION_STATUSES.URL_FORMAT_VALID;
}

// ── Business Fit Evaluator ───────────────────────────────────
// Hardened: Auditable keyword & commodity evidence
export function evaluateBusinessFit(record) {
  const prods = String(record.products || '').toLowerCase();
  const ind = String(record.industry || '').toLowerCase();
  const biz = String(record.businessType || '').toLowerCase();
  const notes = String(record.notes || '').toLowerCase();
  const moringaInt = String(record.moringaInterest || '').toLowerCase();
  const onionInt = String(record.redOnionInterest || '').toLowerCase();

  const combined = `${prods} ${ind} ${biz} ${notes}`;

  // Specific evidence of Moringa or Dehydrated Red Onion interest
  if (
    prods.includes('moringa') ||
    prods.includes('onion') ||
    moringaInt === 'high' ||
    onionInt === 'high' ||
    notes.includes('moringa') ||
    notes.includes('onion') ||
    notes.includes('dehydrated')
  ) {
    return BUSINESS_FIT_STATUSES.RELEVANT;
  }

  // Broad food, seasoning, spice, botanical keywords
  if (
    combined.includes('seasoning') ||
    combined.includes('spice') ||
    combined.includes('botanical') ||
    combined.includes('nutraceutical') ||
    combined.includes('culinary') ||
    combined.includes('flavors') ||
    combined.includes('food ingredient') ||
    combined.includes('ingredient') ||
    combined.includes('food') ||
    combined.includes('grocery') ||
    combined.includes('produce')
  ) {
    return BUSINESS_FIT_STATUSES.POSSIBLY_RELEVANT;
  }

  if (!prods || prods === 'not available') {
    return BUSINESS_FIT_STATUSES.UNASSESSED;
  }

  return BUSINESS_FIT_STATUSES.NOT_RELEVANT;
}

// ── Buyer Type Classifier ─────────────────────────────────────
// Hardened: Does not classify as IMPORTER_CONFIRMED without documented import licensing/registry
export function classifyBuyerType(record, companyVerificationStatus) {
  const biz = String(record.businessType || '').toLowerCase();
  const ind = String(record.industry || '').toLowerCase();
  const notes = String(record.notes || '').toLowerCase();
  const prods = String(record.products || '').toLowerCase();
  const combined = `${biz} ${ind} ${notes} ${prods}`;

  const isOfficiallyVerified = companyVerificationStatus === COMPANY_VERIFICATION_STATUSES.COMPANY_VERIFIED;

  if (combined.includes('ingredient')) return BUYER_TYPES.INGREDIENT_BUYER;
  if (combined.includes('manufacturer') || combined.includes('factory') || combined.includes('processor') || combined.includes('processing')) {
    return BUYER_TYPES.MANUFACTURER;
  }
  if (combined.includes('distributor') || combined.includes('distribution')) return BUYER_TYPES.DISTRIBUTOR;
  if (combined.includes('wholesaler') || combined.includes('wholesale')) return BUYER_TYPES.WHOLESALER;
  if (combined.includes('importer') || combined.includes('import')) {
    return isOfficiallyVerified ? BUYER_TYPES.IMPORTER_CONFIRMED : BUYER_TYPES.IMPORTER_UNCONFIRMED;
  }

  return BUYER_TYPES.UNKNOWN;
}

// ── Decision Maker Evaluator ─────────────────────────────────
// Hardened: Does not count generic departments ("Procurement Desk") as named decision makers
const GENERIC_DEPT_PATTERNS = [
  'desk', 'department', 'team', 'division', 'service', 'dept', 'office', 'section', 'group',
  'procurement desk', 'buyer desk', 'commercial procurement desk', 'procurement department',
  'sales department', 'info desk', 'customer service', 'sourcing team', 'import operations team',
  'wholesale sourcing desk', 'food ingredients division', 'global ingredients sourcing dept',
  'purchasing & planning', 'equipe de sourcing global'
];

export function evaluateDecisionMaker(record) {
  const c = String(record.contactPerson || '').trim();
  const t = String(record.jobTitle || record.designation || '').trim();
  const cLower = c.toLowerCase();
  const tLower = t.toLowerCase();

  if (!c || c === 'Not Available' || c === 'N/A') {
    return {
      status: DECISION_MAKER_STATUSES.NOT_FOUND,
      name: 'Not Available',
      title: t && t !== 'Not Available' ? t : 'Not Available'
    };
  }

  // 1. Generic Department or Desk
  const isGeneric = GENERIC_DEPT_PATTERNS.some(p => cLower === p || cLower.includes(p));
  if (isGeneric) {
    return {
      status: DECISION_MAKER_STATUSES.GENERIC_DEPARTMENT,
      name: c,
      title: t && t !== 'Not Available' ? t : 'Departmental Desk'
    };
  }

  // 2. Specific role without a personal name
  const KNOWN_ROLES = [
    'buyer', 'owner', 'sourcing director', 'purchase head', 'purchase manager',
    'procurement manager', 'category head', 'fmcg import', 'food trading',
    'organic', 'agro products', 'ingredients', 'food import', 'spices', 'grocery'
  ];
  if (KNOWN_ROLES.some(r => cLower === r)) {
    return {
      status: DECISION_MAKER_STATUSES.ROLE_IDENTIFIED,
      name: `Role: ${c}`,
      title: t && t !== 'Not Available' ? t : c
    };
  }

  // 3. Human personal name (two or more words, non-commodity)
  const words = c.split(/\s+/);
  if (words.length >= 2 && !cLower.includes('food') && !cLower.includes('products') && !cLower.includes('import')) {
    if (
      tLower.includes('procurement') ||
      tLower.includes('purchasing') ||
      tLower.includes('sourcing') ||
      tLower.includes('buyer') ||
      cLower.includes('procurement')
    ) {
      return {
        status: DECISION_MAKER_STATUSES.PROCUREMENT_CONFIRMED,
        name: c,
        title: t && t !== 'Not Available' ? t : 'Procurement Executive'
      };
    }
    return {
      status: DECISION_MAKER_STATUSES.NAME_IDENTIFIED,
      name: c,
      title: t && t !== 'Not Available' ? t : 'Decision Maker'
    };
  }

  return {
    status: DECISION_MAKER_STATUSES.ROLE_IDENTIFIED,
    name: c,
    title: t && t !== 'Not Available' ? t : c
  };
}

// ── Contact Verification Evaluator ────────────────────────────
// Hardened: Does not promote format-valid contacts to DELIVERABILITY_CHECKED or PHONE_VERIFIED
export function evaluateContactVerification(record, dmStatus) {
  const rawOutreach = String(record.outreachStatus || '').toUpperCase();
  if (rawOutreach === 'DO_NOT_CONTACT') return CONTACT_VERIFICATION_STATUSES.DO_NOT_CONTACT;
  if (rawOutreach === 'BOUNCED' || rawOutreach === 'BOUNCE') return CONTACT_VERIFICATION_STATUSES.BOUNCE;
  if (rawOutreach === 'INVALID') return CONTACT_VERIFICATION_STATUSES.INVALID;

  // Real operational verification is currently pending (no probes/calls executed)
  const emailFormatValid = isRealEmail(record.email);
  const phoneFormatValid = isRealPhone(record.phone) || isRealPhone(record.whatsapp);
  const websiteValid = isRealWebsite(record.website);

  if (emailFormatValid || phoneFormatValid) {
    return CONTACT_VERIFICATION_STATUSES.FORMAT_VALID;
  }
  if (websiteValid) {
    return CONTACT_VERIFICATION_STATUSES.DOMAIN_ASSOCIATED;
  }
  return CONTACT_VERIFICATION_STATUSES.UNTESTED;
}

// ── Deterministic OUTREACH_READY Eligibility Rule ─────────────
// Hardened: FORMAT_VALID != VERIFIED. Requires operationally verified contact channels.
export function evaluateOutreachReadiness(data) {
  const blockers = [];

  // Rule 1: Company identity must be officially verified against commercial registry
  if (data.companyVerificationStatus !== COMPANY_VERIFICATION_STATUSES.COMPANY_VERIFIED) {
    blockers.push('Company identity is not verified against official commercial registry');
  }

  // Rule 2: Country must be recognized and present
  if (!data.country || data.country === 'Unknown' || data.country === 'Not Available') {
    blockers.push('Target country is missing or unrecognized');
  }

  // Rule 3: Business fit must be RELEVANT or POSSIBLY_RELEVANT
  if (data.businessFitStatus !== BUSINESS_FIT_STATUSES.RELEVANT && data.businessFitStatus !== BUSINESS_FIT_STATUSES.POSSIBLY_RELEVANT) {
    blockers.push('Business fit is unassessed or not relevant');
  }

  // Rule 4: At least one operationally verified contact method required (format valid is NOT sufficient)
  const hasOperationallyVerifiedContact = Boolean(
    data.emailDeliverabilityStatus === EMAIL_DELIVERABILITY_STATUSES.DELIVERABLE ||
    data.phoneVerificationStatus === PHONE_VERIFICATION_STATUSES.VERIFIED
  );
  if (!hasOperationallyVerifiedContact) {
    blockers.push('No operationally verified contact channel (format-valid only; operational deliverability/phone verification pending)');
  }

  // Rule 5: Contact must not be INVALID
  if (data.contactVerificationStatus === CONTACT_VERIFICATION_STATUSES.INVALID) {
    blockers.push('Contact information is marked INVALID');
  }

  // Rule 6: Contact must not be BOUNCE
  if (data.contactVerificationStatus === CONTACT_VERIFICATION_STATUSES.BOUNCE || data.outreachStatus === OUTREACH_STATUSES.BOUNCED) {
    blockers.push('Contact is marked as BOUNCE');
  }

  // Rule 7: Contact must not be DO_NOT_CONTACT
  if (data.contactVerificationStatus === CONTACT_VERIFICATION_STATUSES.DO_NOT_CONTACT || data.outreachStatus === OUTREACH_STATUSES.DO_NOT_CONTACT) {
    blockers.push('Contact is marked DO_NOT_CONTACT');
  }

  // Rule 8: Verification source provenance must be present
  if (!data.verificationSource || data.verificationSource === 'Not Available') {
    blockers.push('Verification source provenance is missing');
  }

  // Rule 9: Verification timestamp must be a real verification event timestamp
  if (!data.lastVerifiedAt) {
    blockers.push('Verification event timestamp is missing');
  }

  // Rule 10: Record must not be SUPPRESSED
  if (data.outreachStatus === OUTREACH_STATUSES.SUPPRESSED) {
    blockers.push('Record is marked SUPPRESSED');
  }

  // Rule 11: Explicit blocker: UNVERIFIED records can never enter outreach
  if (data.companyVerificationStatus === COMPANY_VERIFICATION_STATUSES.UNVERIFIED || data.verificationStatus === 'UNVERIFIED') {
    blockers.push('Record is classified UNVERIFIED');
  }

  const isReady = blockers.length === 0;
  let status = OUTREACH_STATUSES.NOT_READY;
  if (isReady) {
    status = OUTREACH_STATUSES.READY;
  } else if (data.contactVerificationStatus === CONTACT_VERIFICATION_STATUSES.BOUNCE || data.outreachStatus === OUTREACH_STATUSES.BOUNCED) {
    status = OUTREACH_STATUSES.BOUNCED;
  } else if (data.contactVerificationStatus === CONTACT_VERIFICATION_STATUSES.DO_NOT_CONTACT || data.outreachStatus === OUTREACH_STATUSES.DO_NOT_CONTACT) {
    status = OUTREACH_STATUSES.DO_NOT_CONTACT;
  } else if (data.outreachStatus === OUTREACH_STATUSES.SUPPRESSED) {
    status = OUTREACH_STATUSES.SUPPRESSED;
  }

  return {
    isReady,
    status,
    outreachStatus: status,
    blockers,
    reasons: blockers
  };
}

// ── Verification Queue Items & Next Action Builder ───────────
export function deriveVerificationQueueDetails(data) {
  const missing = [];
  let nextAction = 'Record in good standing.';

  if (data.companyVerificationStatus === COMPANY_VERIFICATION_STATUSES.UNVERIFIED) {
    missing.push('Chamber of commerce or government commercial registry filing');
    nextAction = 'Cross-reference corporate registration on official ministry or trade directory.';
  } else if (data.companyVerificationStatus === COMPANY_VERIFICATION_STATUSES.DOMAIN_ASSOCIATED) {
    missing.push('Official business incorporation document or tax registration');
    nextAction = 'Verify active enterprise registration against local business register.';
  }

  if (!data.emailFormatValid) {
    missing.push('Valid corporate email address');
  } else if (data.emailDeliverabilityStatus === EMAIL_DELIVERABILITY_STATUSES.UNTESTED) {
    missing.push('SMTP mailbox deliverability test');
    if (nextAction.includes('good standing')) {
      nextAction = 'Execute controlled SMTP MX deliverability check.';
    }
  }

  if (!data.phoneFormatValid) {
    missing.push('Valid corporate telephone number');
  } else if (data.phoneVerificationStatus === PHONE_VERIFICATION_STATUSES.UNTESTED) {
    missing.push('Phone switchboard / IVR verification');
  }

  if (data.decisionMakerStatus === DECISION_MAKER_STATUSES.GENERIC_DEPARTMENT || data.decisionMakerStatus === DECISION_MAKER_STATUSES.NOT_FOUND) {
    missing.push('Named procurement officer or sourcing director');
    if (nextAction.includes('good standing')) {
      nextAction = 'Identify named procurement manager via LinkedIn or company website.';
    }
  }

  if (data.businessFitStatus === BUSINESS_FIT_STATUSES.UNASSESSED) {
    missing.push('Product requirement audit (Moringa / Onion powder)');
  }

  return {
    missing,
    nextAction
  };
}

// ── Complete Record Normalization with Verification Layer ────
export function normalizeImporterWithVerification(imp) {
  const normCountry = normalizeCountry(imp.country);
  const normVerification = normalizeVerificationStatus(imp.verificationStatus);

  const websiteUrlValid = isRealWebsite(imp.website);
  const emailFormatValid = isRealEmail(imp.email);
  const phoneFormatValid = isRealPhone(imp.phone);
  const whatsappFormatValid = isRealPhone(imp.whatsapp);

  // Email deliverability status: format-valid only in this pass (no probes sent)
  const emailDeliverabilityStatus = emailFormatValid
    ? EMAIL_DELIVERABILITY_STATUSES.UNTESTED
    : EMAIL_DELIVERABILITY_STATUSES.INVALID;

  // Phone verification status: format-valid only in this pass (no calls placed)
  const phoneVerificationStatus = phoneFormatValid
    ? PHONE_VERIFICATION_STATUSES.UNTESTED
    : PHONE_VERIFICATION_STATUSES.INVALID;

  // Company verification status: hardened evaluation
  const companyVerificationStatus = evaluateCompanyVerification({
    ...imp,
    verificationStatus: normVerification,
    website: imp.website
  });

  const domainVerificationStatus = evaluateDomainVerification(imp.website, companyVerificationStatus);
  const businessFitStatus = evaluateBusinessFit(imp);
  const buyerType = classifyBuyerType({ ...imp, verificationStatus: normVerification }, companyVerificationStatus);
  const dm = evaluateDecisionMaker(imp);

  const contactVerificationStatus = evaluateContactVerification(
    {
      ...imp,
      email: imp.email,
      phone: imp.phone,
      whatsapp: imp.whatsapp,
      website: imp.website
    },
    dm.status
  );

  // Real timestamps: only assign verification timestamp if verified in registry/directory
  const isVerifiedEntity = companyVerificationStatus === COMPANY_VERIFICATION_STATUSES.COMPANY_VERIFIED ||
                           companyVerificationStatus === COMPANY_VERIFICATION_STATUSES.DOMAIN_ASSOCIATED;

  const lastVerifiedAt = isVerifiedEntity && imp.importedAt ? imp.importedAt : null;
  const verificationUpdatedAt = lastVerifiedAt;

  // Verification provenance: truthful, non-fabricated
  let verificationSource = imp.source || null;
  let verificationMethod = VERIFICATION_METHODS.UNTESTED;
  let verificationEvidence = null;

  if (companyVerificationStatus === COMPANY_VERIFICATION_STATUSES.COMPANY_VERIFIED) {
    verificationMethod = VERIFICATION_METHODS.OFFICIAL_REGISTRY;
    verificationEvidence = imp.sourceType || imp.source || 'Official Commercial Trade Registry';
    verificationSource = imp.source || 'National Chamber of Commerce / Commercial Registry';
  } else if (companyVerificationStatus === COMPANY_VERIFICATION_STATUSES.DOMAIN_ASSOCIATED) {
    verificationMethod = VERIFICATION_METHODS.BUSINESS_DIRECTORY;
    verificationEvidence = 'Corporate domain associated via B2B directory research';
    verificationSource = imp.source || 'B2B Trade Directory';
  }

  // Pre-check structure for readiness evaluation
  const preCheck = {
    companyVerificationStatus,
    domainVerificationStatus,
    country: normCountry,
    businessFitStatus,
    emailFormatValid,
    phoneFormatValid,
    emailDeliverabilityStatus,
    phoneVerificationStatus,
    contactVerificationStatus,
    outreachStatus: imp.outreachStatus,
    verificationSource,
    lastVerifiedAt,
    verificationStatus: normVerification
  };

  const readiness = evaluateOutreachReadiness(preCheck);

  // Derive verification queue details
  const queueInfo = deriveVerificationQueueDetails({
    companyVerificationStatus,
    emailFormatValid,
    phoneFormatValid,
    emailDeliverabilityStatus,
    phoneVerificationStatus,
    decisionMakerStatus: dm.status,
    businessFitStatus
  });

  // A record is in verification queue if UNVERIFIED or outreach NOT_READY
  const inVerificationQueue = companyVerificationStatus === COMPANY_VERIFICATION_STATUSES.UNVERIFIED || readiness.status === OUTREACH_STATUSES.NOT_READY;

  return {
    ...imp,
    // Preserved fields with canonical normalization
    country: normCountry,
    verificationStatus: normVerification,
    // Dimensional verification layers
    companyVerificationStatus,
    domainVerificationStatus,
    contactVerificationStatus,
    businessFitStatus,
    buyerType,
    decisionMakerStatus: dm.status,
    decisionMakerName: dm.name,
    decisionMakerTitle: dm.title,
    // Contact Deliverability & Verification (Truthful Terminology)
    emailFormatValid,
    phoneFormatValid,
    whatsappFormatValid,
    websiteUrlValid,
    emailDeliverabilityStatus,
    phoneVerificationStatus,
    // Backward-compatible boolean flags (Format-Valid != Deliverable)
    emailVerified: emailDeliverabilityStatus === EMAIL_DELIVERABILITY_STATUSES.DELIVERABLE,
    phoneVerified: phoneVerificationStatus === PHONE_VERIFICATION_STATUSES.VERIFIED,
    websiteVerified: domainVerificationStatus === DOMAIN_VERIFICATION_STATUSES.DOMAIN_ASSOCIATED,
    // Outreach Readiness
    outreachStatus: readiness.status,
    isOutreachReady: readiness.isReady,
    outreachBlockers: readiness.blockers,
    // Provenance & Audit Trail
    lastVerifiedAt,
    verificationUpdatedAt,
    verificationSource,
    verificationMethod,
    verificationNotes: imp.notes || `${normCountry} buyer record in ${normVerification} status.`,
    verificationEvidence,
    verifiedBy: isVerifiedEntity ? 'AVANI Data Architecture & Verification Engine' : null,
    // Verification Queue Integration
    inVerificationQueue,
    verificationQueueDetails: {
      missingFields: queueInfo.missing,
      nextAction: queueInfo.nextAction
    },
    missingVerificationFields: queueInfo.missing,
    nextVerificationAction: queueInfo.nextAction,
    // Product Interest
    moringaInterest: imp.moringaInterest || 'UNKNOWN',
    redOnionInterest: imp.redOnionInterest || 'UNKNOWN'
  };
}

// ── Metric Aggregator for Private Dashboard ───────────────────
export function getVerificationDashboardMetrics(records) {
  let companyVerified = 0;
  let domainAssociated = 0;
  let companyUnverified = 0;

  let websiteUrlValid = 0;
  let emailFormatValid = 0;
  let phoneFormatValid = 0;

  let emailDeliverabilityChecked = 0;
  let emailDeliverable = 0;
  let emailBounce = 0;

  let phoneVerified = 0;
  let phoneInvalid = 0;

  let businessFitRelevant = 0;
  let businessFitPossiblyRelevant = 0;
  let businessFitNotRelevant = 0;
  let businessFitUnassessed = 0;

  let decisionMakerGenericDept = 0;
  let decisionMakerRoleIdentified = 0;
  let decisionMakerNameIdentified = 0;
  let decisionMakerProcurementConfirmed = 0;

  let outreachReady = 0;
  let outreachNotReady = 0;
  let invalid = 0;
  let suppressed = 0;
  let bounced = 0;
  let verificationQueueCount = 0;

  const countries = {};
  const buyerTypes = {};

  records.forEach(r => {
    // Country distribution
    const c = r.country || 'Unknown';
    countries[c] = (countries[c] || 0) + 1;

    // Buyer type distribution
    const bt = r.buyerType || BUYER_TYPES.UNKNOWN;
    buyerTypes[bt] = (buyerTypes[bt] || 0) + 1;

    // Company Verification
    if (r.companyVerificationStatus === COMPANY_VERIFICATION_STATUSES.COMPANY_VERIFIED) companyVerified++;
    else if (r.companyVerificationStatus === COMPANY_VERIFICATION_STATUSES.DOMAIN_ASSOCIATED) domainAssociated++;
    else companyUnverified++;

    // Format Validity
    if (r.websiteUrlValid) websiteUrlValid++;
    if (r.emailFormatValid) emailFormatValid++;
    if (r.phoneFormatValid) phoneFormatValid++;
    else phoneInvalid++;

    // Contact Operational Verification
    if (r.emailDeliverabilityStatus === EMAIL_DELIVERABILITY_STATUSES.DELIVERABILITY_CHECKED) emailDeliverabilityChecked++;
    if (r.emailDeliverabilityStatus === EMAIL_DELIVERABILITY_STATUSES.DELIVERABLE) emailDeliverable++;
    if (r.emailDeliverabilityStatus === EMAIL_DELIVERABILITY_STATUSES.BOUNCE) emailBounce++;
    if (r.phoneVerificationStatus === PHONE_VERIFICATION_STATUSES.VERIFIED) phoneVerified++;

    // Business Fit
    if (r.businessFitStatus === BUSINESS_FIT_STATUSES.RELEVANT) businessFitRelevant++;
    else if (r.businessFitStatus === BUSINESS_FIT_STATUSES.POSSIBLY_RELEVANT) businessFitPossiblyRelevant++;
    else if (r.businessFitStatus === BUSINESS_FIT_STATUSES.NOT_RELEVANT) businessFitNotRelevant++;
    else businessFitUnassessed++;

    // Decision Maker
    if (r.decisionMakerStatus === DECISION_MAKER_STATUSES.GENERIC_DEPARTMENT) decisionMakerGenericDept++;
    else if (r.decisionMakerStatus === DECISION_MAKER_STATUSES.ROLE_IDENTIFIED) decisionMakerRoleIdentified++;
    else if (r.decisionMakerStatus === DECISION_MAKER_STATUSES.NAME_IDENTIFIED) decisionMakerNameIdentified++;
    else if (r.decisionMakerStatus === DECISION_MAKER_STATUSES.PROCUREMENT_CONFIRMED) decisionMakerProcurementConfirmed++;

    // Outreach
    if (r.outreachStatus === OUTREACH_STATUSES.READY) outreachReady++;
    else outreachNotReady++;

    if (r.contactVerificationStatus === CONTACT_VERIFICATION_STATUSES.INVALID || r.companyVerificationStatus === COMPANY_VERIFICATION_STATUSES.INVALID) invalid++;
    if (r.outreachStatus === OUTREACH_STATUSES.SUPPRESSED) suppressed++;
    if (r.outreachStatus === OUTREACH_STATUSES.BOUNCED) bounced++;

    if (r.inVerificationQueue) verificationQueueCount++;
  });

  const distinctCountries = Object.keys(countries).length;
  const missingRequired = REQUIRED_TARGET_COUNTRIES.filter(c => !countries[c]);

  return {
    totalRecords: records.length,
    requiredCountriesCount: REQUIRED_TARGET_COUNTRIES.length - missingRequired.length,
    requiredCountriesCoverage: `${REQUIRED_TARGET_COUNTRIES.length - missingRequired.length}/${REQUIRED_TARGET_COUNTRIES.length}`,
    distinctCountriesCount: distinctCountries,
    missingRequiredCountries: missingRequired,
    // Company Verification
    companyVerified,
    domainAssociated,
    companyUnverified,
    // Website & Domain
    websiteUrlValid,
    websiteVerified: domainAssociated,
    domainVerified: domainAssociated,
    // Email
    emailFormatValid,
    emailDeliverabilityChecked,
    emailDeliverable,
    emailBounce,
    emailVerified: emailDeliverable,
    // Phone
    phoneFormatValid,
    phoneVerified,
    phoneInvalid,
    // Business Fit
    businessFitRelevant,
    businessFitPossiblyRelevant,
    businessFitNotRelevant,
    businessFitUnassessed,
    // Decision Maker
    decisionMakerGenericDept,
    decisionMakerRoleIdentified,
    decisionMakerNameIdentified,
    decisionMakerProcurementConfirmed,
    decisionMakerIdentified: decisionMakerNameIdentified + decisionMakerProcurementConfirmed,
    // Outreach
    outreachReady,
    outreachNotReady,
    invalid,
    invalidCount: invalid,
    suppressed,
    suppressedCount: suppressed,
    bounced,
    bouncedCount: bounced,
    // Queue
    verificationQueueCount,
    countries,
    buyerTypes
  };
}

// CommonJS compatibility for Node.js test runners and CJS scripts
const CJS_EXPORTS = {
  COMPANY_VERIFICATION_STATUSES,
  DOMAIN_VERIFICATION_STATUSES,
  EMAIL_DELIVERABILITY_STATUSES,
  PHONE_VERIFICATION_STATUSES,
  CONTACT_VERIFICATION_STATUSES,
  BUSINESS_FIT_STATUSES,
  BUYER_TYPES,
  DECISION_MAKER_STATUSES,
  OUTREACH_STATUSES,
  VERIFICATION_METHODS,
  REQUIRED_TARGET_COUNTRIES,
  normalizeCountry,
  isRealContact,
  isRealWebsite,
  isRealPhone,
  isRealEmail,
  normalizeVerificationStatus,
  evaluateCompanyVerification,
  evaluateDomainVerification,
  evaluateBusinessFit,
  classifyBuyerType,
  evaluateDecisionMaker,
  evaluateContactVerification,
  evaluateOutreachReadiness,
  deriveVerificationQueueDetails,
  normalizeImporterWithVerification,
  getVerificationDashboardMetrics
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CJS_EXPORTS;
}
