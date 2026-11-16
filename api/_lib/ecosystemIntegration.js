// ============================================================
// AVANI AGRO FOODS — ECOSYSTEM INTEGRATION & OUTREACH GOVERNANCE MODULE
// api/_lib/ecosystemIntegration.js
// Connects Project A (Website & Quotation Engine) with
// Project B (AVANI_AGRO_INTELLIGENCE) via authenticated, idempotent
// event contracts, 13-stage B2B sales workflow, A/B/C grading,
// and Section 10 compliant outreach safety gates.
// ============================================================

import crypto from 'crypto';
import { getSupabaseStatus } from './supabaseClient.js';
import { getKvCredentials, isDistributedKvRequired } from './auth.js';
import { EMAIL_SEQUENCES, REQUIRED_POSITIONING_STATEMENT } from './emailSequences.js';

export const WORKFLOW_STAGES_13 = Object.freeze([
  'VERIFIED_PROSPECT',
  'RESEARCHED',
  'CONTACT_VALIDATED',
  'CONTACTED',
  'CONNECTED',
  'QUALIFIED',
  'REQUIREMENT_RECEIVED',
  'SAMPLE_DISCUSSION',
  'SUPPLIER_VERIFICATION',
  'QUOTATION',
  'NEGOTIATION',
  'PURCHASE_ORDER',
  'REPEAT_BUSINESS'
]);

export const PRIMARY_TARGET_MARKETS = Object.freeze([
  'USA', 'US', 'UNITED STATES',
  'UAE', 'AE', 'UNITED ARAB EMIRATES',
  'UK', 'GB', 'UNITED KINGDOM',
  'GERMANY', 'DE',
  'NETHERLANDS', 'NL',
  'FRANCE', 'FR', 'ITALY', 'IT', 'SPAIN', 'ES', 'BELGIUM', 'BE',
  'FINLAND', 'FI', 'SWEDEN', 'SE', 'SWITZERLAND', 'CH', 'POLAND', 'PL'
]);

export const SECONDARY_TARGET_MARKETS = Object.freeze([
  'CANADA', 'CA', 'AUSTRALIA', 'AU',
  'SAUDI ARABIA', 'SA', 'QATAR', 'QA', 'OMAN', 'OM', 'KUWAIT', 'KW',
  'SINGAPORE', 'SG', 'MALAYSIA', 'MY', 'JAPAN', 'JP', 'SOUTH KOREA', 'KR',
  'VIETNAM', 'VN', 'THAILAND', 'TH',
  'SOUTH AFRICA', 'ZA', 'KENYA', 'KE', 'NIGERIA', 'NG',
  'BRAZIL', 'BR', 'MEXICO', 'MX'
]);

export const APPROVED_BUYER_TYPES = Object.freeze([
  'IMPORTER',
  'DISTRIBUTOR',
  'INGREDIENT_BUYER',
  'FOOD_MANUFACTURER',
  'SEASONING_MANUFACTURER',
  'PRIVATE_LABEL',
  'FOOD_SERVICE',
  'BOTANICAL_INGREDIENT'
]);

export const APPROVED_PRODUCTS = Object.freeze([
  'Moringa Powder',
  'Moringa Leaf Powder',
  'Red Onion Powder',
  'Dehydrated Red Onion Powder'
]);

const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com', 'proton.me'
]);

const UNVERIFIED_CLAIM_PATTERNS = [
  /\bwe are the manufacturer\b/i,
  /\bour own factory\b/i,
  /\bour own farm\b/i,
  /\bguaranteed capacity\b/i,
  /\bunlimited stock\b/i
];

/**
 * Classifies an international B2B lead/prospect into Grade A/B/C, Market Tier,
 * and the canonical 13-stage B2B commercial workflow.
 */
export function classifyLeadAndMarket(lead = {}) {
  const countryRaw = String(lead.country || lead.country_code || '').trim().toUpperCase();
  let marketTier = 'OTHER';
  if (PRIMARY_TARGET_MARKETS.includes(countryRaw)) {
    marketTier = 'PRIMARY';
  } else if (SECONDARY_TARGET_MARKETS.includes(countryRaw)) {
    marketTier = 'SECONDARY';
  }

  const email = String(lead.email || '').trim().toLowerCase();
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const domain = emailValid ? email.split('@')[1] : '';
  const isBusinessDomain = Boolean(domain && !FREE_EMAIL_DOMAINS.has(domain));

  const quantityKg = Number(lead.quantityKg || lead.quantityNormalizedKg || lead.quantity || 0) || 0;
  const hasProvenance = Boolean(String(lead.sourceUrl || lead.source_url || lead.source || '').trim());

  let score = 0;
  if (emailValid && isBusinessDomain) score += 35;
  if (marketTier === 'PRIMARY') score += 30;
  else if (marketTier === 'SECONDARY') score += 15;
  if (quantityKg >= 500) score += 20;
  else if (quantityKg >= 100) score += 10;
  if (hasProvenance) score += 15;

  const leadGrade = score >= 75 ? 'A' : score >= 45 ? 'B' : 'C';

  const rawStage = String(lead.workflowStage || lead.stage || '').trim().toUpperCase();
  let workflowStage = 'VERIFIED_PROSPECT';
  if (WORKFLOW_STAGES_13.includes(rawStage)) {
    workflowStage = rawStage;
  } else if (lead.poNumber || lead.status === 'PO_RECEIVED') {
    workflowStage = 'PURCHASE_ORDER';
  } else if (['NEGOTIATION', 'BUYER_RESPONDED'].includes(lead.status)) {
    workflowStage = 'NEGOTIATION';
  } else if (['SENT_TO_BUYER', 'DELIVERED', 'OPENED', 'QUOTATION'].includes(lead.status)) {
    workflowStage = 'QUOTATION';
  } else if (lead.processorVerified || lead.status === 'READY_TO_SEND') {
    workflowStage = 'SUPPLIER_VERIFICATION';
  } else if (quantityKg > 0 || lead.inquiryId) {
    workflowStage = 'REQUIREMENT_RECEIVED';
  } else if (isBusinessDomain && hasProvenance) {
    workflowStage = 'CONTACT_VALIDATED';
  }

  return {
    leadGrade,
    score,
    marketTier,
    isBusinessDomain,
    workflowStage,
    workflowStageIndex: WORKFLOW_STAGES_13.indexOf(workflowStage),
    consentEligibility: lead.consentEligibility || (lead.unsubscribed || lead.suppressed ? 'INELIGIBLE_SUPPRESSED' : 'ELIGIBLE_B2B_LEGITIMATE_INTEREST'),
    suppressionStatus: lead.suppressed || lead.unsubscribed ? 'SUPPRESSED' : 'ACTIVE'
  };
}

/**
 * Enforces Section 10 Outreach Prerequisites before any SEQ-01..SEQ-05 dispatch.
 * Fail-closed if any governance lock, provenance, deliverability threshold, or compliance gate fails.
 */
export function evaluateOutreachReadinessGate(contact = {}, context = {}) {
  const issues = [];
  const env = context.env || (typeof process !== 'undefined' ? process.env : {});

  const rawStop = String(env.GLOBAL_OUTREACH_STOP ?? '1').trim().toLowerCase();
  if (rawStop !== '0' && rawStop !== 'false') {
    issues.push('GLOBAL_OUTREACH_STOP_ENGAGED');
  }

  const rawAuth = String(env.OUTREACH_AUTHORIZED ?? '0').trim().toLowerCase();
  if (rawAuth !== '1' && rawAuth !== 'true') {
    issues.push('OUTREACH_NOT_AUTHORIZED');
  }

  const email = String(contact.email || '').trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    issues.push('INVALID_EMAIL_ADDRESS');
  } else {
    const domain = email.split('@')[1];
    if (domain === 'avaniagrofoods.com') {
      issues.push('INTERNAL_DOMAIN_EXCLUDED');
    }
    if (FREE_EMAIL_DOMAINS.has(domain) && !contact.explicitInquiryOptIn) {
      issues.push('NON_BUSINESS_EMAIL_REQUIRES_EXPLICIT_INQUIRY');
    }
  }

  if (!String(contact.sourceUrl || contact.source_url || '').trim()) {
    issues.push('MISSING_CONTACT_PROVENANCE_URL');
  }

  if (!String(contact.company || contact.companyName || '').trim()) {
    issues.push('MISSING_BUYER_COMPANY_IDENTITY');
  }

  if (contact.suppressed || contact.unsubscribed || contact.bounced || contact.complained || contact.objected) {
    issues.push('CONTACT_SUPPRESSED_OR_STOPPED');
  }

  if (context.senderAuthVerified === false) {
    issues.push('SENDER_AUTH_SPF_DKIM_DMARC_UNVERIFIED');
  }

  const bounceRatePct = Number(context.bounceRatePct ?? 0);
  if (bounceRatePct > Number(context.maxBounceRatePct ?? 5.0)) {
    issues.push('BOUNCE_RATE_THRESHOLD_EXCEEDED');
  }

  const complaintRatePct = Number(context.complaintRatePct ?? 0);
  if (complaintRatePct > Number(context.maxComplaintRatePct ?? 0.1)) {
    issues.push('COMPLAINT_RATE_THRESHOLD_EXCEEDED');
  }

  const templateBody = String(context.renderedBody || '');
  if (templateBody) {
    for (const badRe of UNVERIFIED_CLAIM_PATTERNS) {
      if (badRe.test(templateBody)) {
        issues.push('UNVERIFIED_MANUFACTURER_CLAIM_DETECTED');
        break;
      }
    }
    if (!templateBody.includes(REQUIRED_POSITIONING_STATEMENT) && !templateBody.toLowerCase().includes('export trade co-ordinator')) {
      issues.push('MISSING_COMPLIANT_COORDINATOR_POSITIONING');
    }
  }

  const classification = classifyLeadAndMarket(contact);
  return {
    eligible: issues.length === 0,
    issues,
    classification,
    checkedAt: new Date().toISOString()
  };
}

/**
 * Signs an outbound ecosystem event envelope with HMAC-SHA256 for Project B ingestion.
 */
export function createSignedEcosystemEvent(eventType, payload = {}, secret = '') {
  const effectiveSecret = String(secret || process.env.ECOSYSTEM_SYNC_SECRET || '').trim();
  if (!effectiveSecret) {
    const err = new Error('ECOSYSTEM_SYNC_SECRET is not configured.');
    err.code = 'ECOSYSTEM_SECRET_MISSING';
    throw err;
  }
  const timestamp = String(Math.floor(Date.now() / 1000));
  const idKey = `eco:${String(eventType || 'EVENT').toUpperCase()}:${payload.inquiryId || payload.quotationId || payload.email || 'unknown'}`;
  const envelope = {
    schemaVersion: '1.0',
    sourceProject: 'PROJECT_A_WEBSITE',
    eventType: String(eventType || 'LEAD_CAPTURED').toUpperCase(),
    idempotencyKey: payload.idempotencyKey || idKey,
    emittedAt: new Date().toISOString(),
    payload
  };
  const rawBody = JSON.stringify(envelope);
  const sig = crypto
    .createHmac('sha256', effectiveSecret)
    .update(`${timestamp}.${rawBody}`, 'utf8')
    .digest('hex');

  return {
    envelope,
    rawBody,
    headers: {
      'Content-Type': 'application/json',
      'X-Avani-Timestamp': timestamp,
      'X-Avani-Signature': `v1=${sig}`,
      'X-Avani-Source': 'PROJECT_A_WEBSITE'
    }
  };
}

/**
 * Verifies an HMAC-SHA256 signed ecosystem event envelope.
 */
export function verifySignedEcosystemEvent(rawBody, headers = {}, secret = '', toleranceSec = 300) {
  const effectiveSecret = String(secret || process.env.ECOSYSTEM_SYNC_SECRET || '').trim();
  if (!effectiveSecret) {
    return { valid: false, reason: 'ECOSYSTEM_SECRET_MISSING' };
  }
  const normalizedHeaders = Object.fromEntries(
    Object.entries(headers || {}).map(([k, v]) => [k.toLowerCase(), v])
  );
  const ts = normalizedHeaders['x-avani-timestamp'];
  const sig = normalizedHeaders['x-avani-signature'];
  if (!ts || !sig) {
    return { valid: false, reason: 'MISSING_SIGNATURE_HEADERS' };
  }
  const tsNum = parseInt(String(ts), 10);
  if (Number.isNaN(tsNum) || Math.abs(Math.floor(Date.now() / 1000) - tsNum) > toleranceSec) {
    return { valid: false, reason: 'TIMESTAMP_OUT_OF_WINDOW' };
  }
  const bodyStr = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : String(rawBody || '');
  const expected = `v1=${crypto.createHmac('sha256', effectiveSecret).update(`${tsNum}.${bodyStr}`, 'utf8').digest('hex')}`;
  const bufA = Buffer.from(String(sig).trim(), 'utf8');
  const bufB = Buffer.from(expected, 'utf8');
  if (bufA.length !== bufB.length || !crypto.timingSafeEqual(bufA, bufB)) {
    return { valid: false, reason: 'SIGNATURE_MISMATCH' };
  }
  return { valid: true, timestamp: tsNum };
}

/**
 * Builds the real, non-fabricated Unified Operational View requested in Section 11.
 */
export function getUnifiedEcosystemOperationsView({ quotations = [], leads = [], sequenceStates = [], errorCount = 0 } = {}) {
  const supa = getSupabaseStatus();
  const kv = getKvCredentials();
  const env = typeof process !== 'undefined' ? process.env : {};

  const stageCounts = Object.fromEntries(WORKFLOW_STAGES_13.map((s) => [s, 0]));
  const gradeCounts = { A: 0, B: 0, C: 0 };
  for (const lead of leads) {
    const cls = classifyLeadAndMarket(lead);
    stageCounts[cls.workflowStage] = (stageCounts[cls.workflowStage] || 0) + 1;
    gradeCounts[cls.leadGrade] = (gradeCounts[cls.leadGrade] || 0) + 1;
  }
  for (const q of quotations) {
    const cls = classifyLeadAndMarket(q);
    stageCounts[cls.workflowStage] = (stageCounts[cls.workflowStage] || 0) + 1;
  }

  let sentCount = 0;
  let deliveredCount = 0;
  let bouncedCount = 0;
  let repliedCount = 0;
  let unsubCount = 0;
  for (const q of quotations) {
    const ds = String(q.deliveryStatus || q.delivery_status || '').toLowerCase();
    if (ds === 'sent' || ds === 'delivered' || ds === 'opened' || q.status === 'SENT_TO_BUYER') sentCount += 1;
    if (ds === 'delivered' || ds === 'opened' || q.status === 'DELIVERED') deliveredCount += 1;
    if (ds === 'bounced' || q.status === 'SEND_FAILED') bouncedCount += 1;
  }
  for (const st of sequenceStates) {
    if (st.reply_detected) repliedCount += 1;
    if (st.opt_out_detected || st.status === 'STOPPED_OPT_OUT') unsubCount += 1;
    if (st.suppressed) bouncedCount += 1;
  }

  return {
    generatedAt: new Date().toISOString(),
    sourceModel: 'ACTUAL_SOURCE_TELEMETRY',
    website: {
      url: 'https://www.avaniagrofoods.com/',
      inquiryCount: leads.length,
      quotationCount: quotations.length,
      apiErrorsObserved: Number(errorCount) || 0,
      quotationsByStatus: quotations.reduce((acc, q) => {
        const s = q.status || 'DRAFT';
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      }, {})
    },
    sales: {
      workflowStages: WORKFLOW_STAGES_13,
      stageCounts,
      gradeCounts,
      leadOwner: 'Sachin Shinde'
    },
    outreach: {
      sequencesConfigured: Object.keys(EMAIL_SEQUENCES),
      globalOutreachStop: String(env.GLOBAL_OUTREACH_STOP ?? '1').trim(),
      outreachAuthorized: String(env.OUTREACH_AUTHORIZED ?? '0').trim(),
      emailsSent: sentCount,
      delivered: deliveredCount,
      bounced: bouncedCount,
      replies: repliedCount,
      unsubscribes: unsubCount,
      positioningCompliant: Object.values(EMAIL_SEQUENCES).every((seq) =>
        seq.bodyText.includes(REQUIRED_POSITIONING_STATEMENT)
      )
    },
    infrastructure: {
      vercelRuntime: Boolean(env.VERCEL || env.VERCEL_ENV),
      supabaseConfigured: supa.configured,
      supabaseProjectRef: supa.projectRef,
      upstashKvConfigured: kv.configured,
      upstashKvRequired: isDistributedKvRequired(),
      resendConfigured: Boolean(env.RESEND_API_KEY && env.RESEND_WEBHOOK_SECRET)
    }
  };
}
