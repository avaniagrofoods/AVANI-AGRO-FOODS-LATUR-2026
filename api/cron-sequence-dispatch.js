// ============================================================
// AVANI AGRO FOODS — Distributed Sequence Dispatch Handler
// api/cron-sequence-dispatch.js
// Phase 3D: Hardened Serverless Route & Fail-Closed Gate Architecture
//
// Hard Safety Invariants:
// - Constant-Time CRON_SECRET Authentication Required
// - Support for GET (Liveness/Status Ping) and POST (Targeted Execution)
// - GLOBAL_OUTREACH_STOP=1 Fail-Closed Gate
// - OUTREACH_AUTHORIZED=1 Authorization Gate
// - Strict Recipient Enrollment Verification (NO Auto-Enrollment)
// - Authoritative Human Approval Gate Verification (NO Fallback Synthesis)
// - Suppression, Unsubscribe, Bounce, Spam & Completed State Fencing
// - Direct Wiring to dispatchSequenceStepDistributed
// ============================================================

import crypto from 'crypto';
import {
  dispatchSequenceStepDistributed,
  SEQUENCE_STATUSES
} from './_lib/sequenceStateMachine.js';
import {
  getRecipientSequenceStateDistributed,
  getStorageConfiguration
} from './_lib/sequencePersistence.js';

/**
 * Constant-time comparison to prevent timing side-channel attacks on secret tokens
 */
function timingSafeTokenCompare(provided, expected) {
  if (typeof provided !== 'string' || typeof expected !== 'string') return false;
  if (provided.length === 0 || expected.length === 0) return false;
  const bufA = Buffer.from(provided);
  const bufB = Buffer.from(expected);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export default async function handler(req, res, testOptions = {}) {
  // 1. HTTP Method Gate (Allow GET for Vercel Cron/Liveness, POST for Targeted Dispatch)
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({
      error: 'METHOD_NOT_ALLOWED',
      message: 'Only GET and POST requests are permitted.'
    });
  }

  // 2. Authentication: Enforce CRON_SECRET with timing-safe comparison
  // Canonical method: Authorization: Bearer <CRON_SECRET> (RFC 6750, Vercel Cron standard)
  // Accepted alternate: x-cron-secret: <CRON_SECRET> (direct header, only when Authorization is absent)
  const rawSecret = process.env.CRON_SECRET;
  const configuredSecret = (typeof rawSecret === 'string') ? rawSecret.trim() : '';
  const rawAuth = req.headers['authorization'];
  const rawXCron = req.headers['x-cron-secret'];

  // 2a. Detect duplicate or multi-valued headers
  const isDuplicateAuth = Array.isArray(rawAuth) || (typeof rawAuth === 'string' && rawAuth.includes(','));
  const isDuplicateXCron = Array.isArray(rawXCron) || (typeof rawXCron === 'string' && rawXCron.includes(','));
  if (isDuplicateAuth || isDuplicateXCron) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      reason: 'DUPLICATE_AUTH_HEADER',
      message: 'Multiple or duplicate authorization headers provided.'
    });
  }

  // 2b. Reject ambiguous / conflicting credentials (both Authorization and x-cron-secret present)
  const hasAuth = typeof rawAuth === 'string' && rawAuth.trim().length > 0;
  const hasXCron = typeof rawXCron === 'string' && rawXCron.trim().length > 0;
  if (hasAuth && hasXCron) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      reason: 'AMBIGUOUS_CREDENTIALS',
      message: 'Ambiguous credentials: both Authorization and x-cron-secret headers provided.'
    });
  }

  let providedToken = '';
  if (hasAuth) {
    const authString = rawAuth.trim();
    if (!authString.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        reason: 'MALFORMED_AUTHORIZATION',
        message: 'Malformed Authorization header. Bearer token required.'
      });
    }
    providedToken = authString.slice(7).trim();
    if (providedToken.length === 0) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        reason: 'EMPTY_BEARER_TOKEN',
        message: 'Missing or empty Bearer token.'
      });
    }
  } else if (hasXCron) {
    providedToken = rawXCron.trim();
    if (providedToken.length === 0) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        reason: 'EMPTY_AUTH_TOKEN',
        message: 'Missing or empty x-cron-secret token.'
      });
    }
  } else {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Missing or invalid CRON_SECRET authorization token.'
    });
  }

  if (!configuredSecret || !providedToken || !timingSafeTokenCompare(providedToken, configuredSecret)) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Missing or invalid CRON_SECRET authorization token.'
    });
  }

  // 3. Absolute Safety Invariant Gate: GLOBAL_OUTREACH_STOP (FAIL-CLOSED)
  // In isolated test mode ONLY (SEQUENCE_TEST_ISOLATION=1), allow test harnesses to inject mock policy decisions without mutating process.env
  const isIsolatedTest = process.env.SEQUENCE_TEST_ISOLATION === '1';
  const effectiveGlobalStop = (isIsolatedTest && testOptions && testOptions.mockGlobalStop !== undefined)
    ? String(testOptions.mockGlobalStop).trim()
    : (process.env.GLOBAL_OUTREACH_STOP !== undefined ? String(process.env.GLOBAL_OUTREACH_STOP).trim() : undefined);

  if (effectiveGlobalStop === undefined || effectiveGlobalStop !== '0') {
    return res.status(403).json({
      error: 'GLOBAL_OUTREACH_STOP_ENGAGED',
      message: 'Global outreach stop is active. Automated outbound sequences are paused.',
      globalStop: effectiveGlobalStop ?? 'undefined'
    });
  }

  // 4. Outreach Authorization Gate: OUTREACH_AUTHORIZED (FAIL-CLOSED)
  const effectiveOutreachAuth = (isIsolatedTest && testOptions && testOptions.mockOutreachAuthorized !== undefined)
    ? String(testOptions.mockOutreachAuthorized).trim()
    : (process.env.OUTREACH_AUTHORIZED !== undefined ? String(process.env.OUTREACH_AUTHORIZED).trim() : undefined);

  if (effectiveOutreachAuth !== '1') {
    return res.status(403).json({
      error: 'OUTREACH_NOT_AUTHORIZED',
      message: 'Outreach authorization flag OUTREACH_AUTHORIZED=1 is missing.',
      outreachAuth: effectiveOutreachAuth ?? 'undefined'
    });
  }

  // 5. GET Handler: Liveness, Status & Architecture Verification (Safe for Vercel Cron ping)
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'CRON_DISPATCH_HEALTHY',
      mode: 'TARGETED_POST_REQUIRED',
      message: 'Automated background cron sweeps are disabled in current phase. Use POST with recipientId for targeted dispatch.',
      schedulerModel: 'TARGETED_OPERATOR_INVOCATION_ONLY',
      globalStop: effectiveGlobalStop,
      outreachAuth: effectiveOutreachAuth,
      storage: getStorageConfiguration()
    });
  }

  // 6. POST Payload Validation
  const body = req.body || {};
  const {
    recipientId,
    campaignId = 'CAMP-01',
    sequenceId = 'SEQ-01',
    dryRun = false,
    options = {}
  } = body;

  // 6b. Sanitize & Allowlist Operational Options (Strict Governance Boundary)
  // Governance-sensitive overrides (ownerApprovedPacingOverride, configuredPacing, configuredLimit,
  // isTestMode, trackTestQuota, safety gates) are strictly forbidden from request payloads and ignored.
  const rawOptions = (typeof options === 'object' && options !== null) ? options : {};
  const safeOperationalOptions = {};
  if (rawOptions.workerId !== undefined) {
    if (typeof rawOptions.workerId !== 'string') {
      return res.status(400).json({
        error: 'INVALID_WORKER_ID',
        message: 'Supplied workerId must be a string matching /^[a-zA-Z0-9_-]{1,64}$/'
      });
    }
    const trimmedWorker = rawOptions.workerId.trim();
    if (trimmedWorker.length === 0 || !/^[a-zA-Z0-9_-]{1,64}$/.test(trimmedWorker)) {
      return res.status(400).json({
        error: 'INVALID_WORKER_ID',
        message: 'Supplied workerId must be non-empty, max 64 characters, and contain only alphanumeric characters, underscores, and hyphens (/^[a-zA-Z0-9_-]{1,64}$/).'
      });
    }
    safeOperationalOptions.workerId = trimmedWorker;
  }
  if (typeof testOptions?.transmitter === 'function') {
    safeOperationalOptions.transmitter = testOptions.transmitter;
  }
  if (isIsolatedTest && testOptions) {
    if (testOptions.now) safeOperationalOptions.now = testOptions.now;
    if (testOptions.customStore) safeOperationalOptions.customStore = testOptions.customStore;
  }

  if (!recipientId || typeof recipientId !== 'string' || recipientId.trim().length === 0) {
    return res.status(400).json({
      error: 'MISSING_RECIPIENT_ID',
      message: 'recipientId is required for targeted dispatch execution.'
    });
  }

  if (!campaignId || typeof campaignId !== 'string' || campaignId.trim().length === 0) {
    return res.status(400).json({
      error: 'MISSING_CAMPAIGN_ID',
      message: 'campaignId is required.'
    });
  }

  // 7. Strict Persisted Enrollment Gate (DEFECT-3C-02 Remediation)
  // NEVER synthesize approvedForOutreach=true or create synthetic states for un-enrolled leads!
  const state = await getRecipientSequenceStateDistributed(campaignId, recipientId);
  if (!state) {
    return res.status(422).json({
      error: 'RECIPIENT_NOT_ENROLLED',
      message: 'Recipient has no persisted enrollment record in distributed storage. Auto-enrollment via cron is strictly forbidden.',
      recipientId,
      campaignId
    });
  }

  // 8. Suppression, Unsubscribe, Bounce, Spam, Reply & Lifecycle Fencing
  // Enforce lifecycle fencing before considering any candidate
  if (state.status === SEQUENCE_STATUSES.STOPPED_OPT_OUT || state.status === 'UNSUBSCRIBED' || state.opt_out_detected || state.followups_cancelled) {
    return res.status(422).json({
      error: 'RECIPIENT_UNSUBSCRIBED_OR_CANCELLED',
      message: 'Recipient has opted out or follow-ups are cancelled.',
      status: state.status
    });
  }

  if (state.status === SEQUENCE_STATUSES.STOPPED_BOUNCE || state.status === 'BOUNCED' || state.suppressed) {
    return res.status(422).json({
      error: 'RECIPIENT_SUPPRESSED',
      message: 'Recipient email is suppressed or bounced.',
      status: state.status
    });
  }

  if (state.status === SEQUENCE_STATUSES.STOPPED_COMPLAINT || state.status === 'COMPLAINT') {
    return res.status(422).json({
      error: 'RECIPIENT_SPAM_COMPLAINT',
      message: 'Recipient has recorded a spam complaint. Sequence permanently stopped.',
      status: state.status
    });
  }

  if (state.reply_detected === true || state.status === SEQUENCE_STATUSES.REPLIED || state.status === SEQUENCE_STATUSES.STOPPED_REPLY_RECEIVED) {
    return res.status(422).json({
      error: 'RECIPIENT_REPLY_RECEIVED',
      message: 'Inbound reply already recorded from recipient. All automated follow-ups cancelled.',
      status: state.status
    });
  }

  if (state.status === SEQUENCE_STATUSES.UNCERTAIN_DISPATCH) {
    return res.status(422).json({
      error: 'RECIPIENT_UNCERTAIN_DISPATCH_FROZEN',
      message: 'Recipient dispatch outcome is currently uncertain. Reconcile intent prior to further dispatch.',
      status: state.status
    });
  }

  if (state.status === SEQUENCE_STATUSES.COMPLETED || (state.current_step && state.current_step >= 5)) {
    return res.status(422).json({
      error: 'SEQUENCE_ALREADY_COMPLETED',
      message: 'Sequence is already completed (SEQ-05 finished). No subsequent steps exist.',
      status: state.status
    });
  }

  // 9. Explicit Authoritative Human Approval Gate Verification
  // Fail closed on missing, false, revoked, stale, malformed, or unverifiable approval
  const isApproved = state.approvedForOutreach === true || state.approved === true;
  if (!isApproved) {
    return res.status(422).json({
      error: 'RECIPIENT_NOT_APPROVED',
      message: 'Recipient has not received authoritative human operator approval for outreach.',
      approvedForOutreach: state.approvedForOutreach ?? false
    });
  }

  if (state.approvalRevoked === true || state.approvalStatus === 'REVOKED') {
    return res.status(422).json({
      error: 'APPROVAL_REVOKED',
      message: 'Recipient outreach approval has been revoked.',
      revokedAt: state.approvalRevokedAt || null
    });
  }

  if (state.approvedBy !== undefined && state.approvedBy !== null && (typeof state.approvedBy !== 'string' || state.approvedBy.trim().length === 0)) {
    return res.status(422).json({
      error: 'APPROVAL_UNVERIFIABLE',
      message: 'Recipient approval record is missing an authoritative operator identifier (approvedBy).'
    });
  }

  if (state.approvedAt !== undefined && state.approvedAt !== null && isNaN(new Date(state.approvedAt).getTime())) {
    return res.status(422).json({
      error: 'APPROVAL_MALFORMED',
      message: 'Recipient approval record contains an invalid or missing approval timestamp (approvedAt).'
    });
  }

  // 10. Dry-Run / Verification Mode
  if (dryRun) {
    return res.status(200).json({
      status: 'DRY_RUN_ELIGIBLE',
      eligible: true,
      campaignId,
      recipientId,
      currentState: state.status,
      approvedBy: state.approvedBy,
      approvedAt: state.approvedAt,
      storage: getStorageConfiguration()
    });
  }

  // 11. Execute Distributed Sequence Dispatch with Persisted State
  try {
    const dispatchResult = await dispatchSequenceStepDistributed(
      state,
      campaignId,
      safeOperationalOptions
    );

    const statusCode = dispatchResult.success ? 200 : (dispatchResult.uncertainOutcome ? 504 : (dispatchResult.error === 'TRANSMITTER_REQUIRED' ? 422 : 409));
    return res.status(statusCode).json(dispatchResult);
  } catch (err) {
    return res.status(500).json({
      error: 'DISPATCH_ERROR',
      message: err.message
    });
  }
}
