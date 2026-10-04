// ============================================================
// AVANI AGRO FOODS — Sequence Persistence & Idempotency Store
// api/_lib/sequencePersistence.js
// Phase 3J: Durable Sequence State, Idempotency & Concurrency Lock
// ============================================================

import fs from 'fs';
import path from 'path';

// Primary and fallback storage paths
const PRIMARY_DATA_DIR = path.resolve(process.cwd(), 'api/_data');
const PRIMARY_FILE_PATH = path.join(PRIMARY_DATA_DIR, 'sequenceStateStore.json');
const TMP_FILE_PATH = path.join('/tmp', 'sequenceStateStore.json');

// In-memory cache synced with disk for maximum performance and cross-request durability
let memoryStore = null;

// Determine writable file path (handles read-only Vercel lambda filesystem)
function resolveStorePath() {
  if (process.env.SEQUENCE_STORE_PATH) {
    return process.env.SEQUENCE_STORE_PATH;
  }
  try {
    if (!fs.existsSync(PRIMARY_DATA_DIR)) {
      fs.mkdirSync(PRIMARY_DATA_DIR, { recursive: true });
    }
    // Test write permission
    const testFile = path.join(PRIMARY_DATA_DIR, '.write_test');
    fs.writeFileSync(testFile, 'ok', 'utf8');
    fs.unlinkSync(testFile);
    return PRIMARY_FILE_PATH;
  } catch (err) {
    // Read-only filesystem detected, use /tmp
    return TMP_FILE_PATH;
  }
}

const STORE_PATH = resolveStorePath();

function createEmptyStore() {
  return {
    version: '1.0.0',
    lastUpdated: new Date().toISOString(),
    sequences: {},          // key: `${campaign_id}:${recipient_id}` -> state
    idempotencyKeys: {},    // key: `${campaign_id}:${recipient_id}:${sequence_id}:${step}` -> details
    reservations: {},       // key: idempotencyKey -> { workerId, expiresAt }
    processedEvents: {},    // key: eventId -> { processedAt, details }
    auditLog: []
  };
}

export function loadStore() {
  if (memoryStore) {
    return memoryStore;
  }

  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf8');
      memoryStore = JSON.parse(raw);
      return memoryStore;
    }
    // Fallback: check primary if using tmp
    if (STORE_PATH !== PRIMARY_FILE_PATH && fs.existsSync(PRIMARY_FILE_PATH)) {
      const raw = fs.readFileSync(PRIMARY_FILE_PATH, 'utf8');
      memoryStore = JSON.parse(raw);
      return memoryStore;
    }
  } catch (err) {
    console.warn('[SequencePersistence] Warning reading persistent store, initializing fresh:', err.message);
  }

  memoryStore = createEmptyStore();
  saveStore(memoryStore);
  return memoryStore;
}

export function saveStore(store) {
  memoryStore = store || memoryStore || createEmptyStore();
  memoryStore.lastUpdated = new Date().toISOString();

  try {
    const serialized = JSON.stringify(memoryStore, null, 2);
    const targetPath = resolveStorePath();
    const tmpPath = `${targetPath}.tmp.${Date.now()}.${Math.random().toString(36).substring(2, 6)}`;
    
    // Ensure parent directory exists
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Atomic write pattern: write to temp file then rename
    fs.writeFileSync(tmpPath, serialized, 'utf8');
    fs.renameSync(tmpPath, targetPath);
  } catch (err) {
    // If target directory is read-only, attempt fallback to /tmp
    if (err.code === 'EROFS' || err.code === 'EACCES') {
      try {
        const serialized = JSON.stringify(memoryStore, null, 2);
        const tmpPath = `${TMP_FILE_PATH}.tmp.${Date.now()}`;
        fs.writeFileSync(tmpPath, serialized, 'utf8');
        fs.renameSync(tmpPath, TMP_FILE_PATH);
      } catch (tmpErr) {
        console.error('[SequencePersistence] Critical: Failed to persist to /tmp:', tmpErr.message);
      }
    } else {
      console.error('[SequencePersistence] Error persisting store:', err.message);
    }
  }
}

/**
 * Generate standard sequence storage key
 */
export function getSequenceStorageKey(campaignId, recipientId) {
  if (!campaignId || !recipientId) {
    throw new Error('campaignId and recipientId are required');
  }
  return `${String(campaignId).trim()}:${String(recipientId).trim().toLowerCase()}`;
}

/**
 * Generate standard step idempotency key
 */
export function generateStepIdempotencyKey(campaignId, recipientId, sequenceId, stepNumber) {
  if (!campaignId || !recipientId || !sequenceId) {
    throw new Error('campaignId, recipientId, and sequenceId are required for idempotency');
  }
  const step = stepNumber ? `EMAIL_${stepNumber}` : sequenceId;
  return `${String(campaignId).trim()}:${String(recipientId).trim().toLowerCase()}:${sequenceId}:${step}`;
}

/**
 * Retrieve durable recipient sequence state
 */
export function getRecipientSequenceState(campaignId, recipientId) {
  const store = loadStore();
  const key = getSequenceStorageKey(campaignId, recipientId);
  return store.sequences[key] || null;
}

/**
 * Save or update durable recipient sequence state
 */
export function saveRecipientSequenceState(campaignId, recipientId, state) {
  const store = loadStore();
  const key = getSequenceStorageKey(campaignId, recipientId);
  
  const now = new Date().toISOString();
  const existing = store.sequences[key] || {};

  const updated = {
    campaign_id: campaignId,
    recipient_id: recipientId,
    sequence_id: state.sequence_id || state.currentSequenceId || existing.sequence_id || 'SEQ-01',
    current_step: state.current_step !== undefined ? state.current_step : (state.currentStep || existing.current_step || 0),
    status: state.status || state.sequenceStatus || existing.status || 'PROSPECT',
    sent_steps: state.sent_steps || existing.sent_steps || [],
    next_step: state.next_step !== undefined ? state.next_step : (state.current_step < 5 ? `EMAIL_${state.current_step + 1}` : 'NONE'),
    next_due_at: state.next_due_at !== undefined ? state.next_due_at : (state.nextFollowUpDueAt || existing.next_due_at || null),
    last_sent_at: state.last_sent_at !== undefined ? state.last_sent_at : (state.lastSentAt || existing.last_sent_at || null),
    reply_detected: Boolean(state.reply_detected !== undefined ? state.reply_detected : (state.replyDetected !== undefined ? state.replyDetected : existing.reply_detected)),
    reply_detected_at: state.reply_detected_at || state.repliedAt || existing.reply_detected_at || null,
    followups_cancelled: Boolean(state.followups_cancelled !== undefined ? state.followups_cancelled : existing.followups_cancelled),
    last_provider_message_id: state.last_provider_message_id || state.lastProviderMessageId || existing.last_provider_message_id || null,
    recipient_email: state.recipient_email || state.email || existing.recipient_email || recipientId,
    company_name: state.company_name || state.companyName || existing.company_name || '',
    contact_name: state.contact_name || state.contactName || existing.contact_name || '',
    created_at: existing.created_at || now,
    updated_at: now
  };

  // Enforce cancel invariants if reply detected
  if (updated.reply_detected) {
    updated.followups_cancelled = true;
    updated.status = 'REPLIED';
    updated.next_step = 'NONE';
    updated.next_due_at = null;
  }

  store.sequences[key] = updated;
  saveStore(store);
  return updated;
}

/**
 * Concurrency Protection: Atomic Step Reservation
 * Worker A reserves EMAIL_2; Worker B trying simultaneously gets ALREADY_RESERVED.
 */
export function reserveSequenceStep(campaignId, recipientId, sequenceId, stepNumber, workerId = 'worker-default', ttlSeconds = 300) {
  const store = loadStore();
  const idempotencyKey = generateStepIdempotencyKey(campaignId, recipientId, sequenceId, stepNumber);

  // 1. Check if already dispatched/sent
  if (store.idempotencyKeys[idempotencyKey]) {
    const existing = store.idempotencyKeys[idempotencyKey];
    return {
      reserved: false,
      alreadySent: true,
      reason: 'ALREADY_SENT',
      details: existing
    };
  }

  // 2. Check if currently reserved by another worker
  const nowMs = Date.now();
  const currentReservation = store.reservations[idempotencyKey];
  if (currentReservation && currentReservation.expiresAt > nowMs) {
    if (currentReservation.workerId !== workerId) {
      return {
        reserved: false,
        alreadyReserved: true,
        reason: 'ALREADY_RESERVED',
        workerId: currentReservation.workerId,
        expiresAt: new Date(currentReservation.expiresAt).toISOString()
      };
    }
  }

  // 3. Check sequence state for reply cancellation or completion
  const state = getRecipientSequenceState(campaignId, recipientId);
  if (state) {
    if (state.reply_detected || state.followups_cancelled || state.status === 'REPLIED') {
      return {
        reserved: false,
        blocked: true,
        reason: 'REPLY_ALREADY_DETECTED_FOLLOWUPS_CANCELLED'
      };
    }
    if (state.status === 'COMPLETED' || state.current_step >= 5) {
      return {
        reserved: false,
        blocked: true,
        reason: 'SEQUENCE_ALREADY_COMPLETED'
      };
    }
  }

  // 4. Grant Reservation
  const expiresAt = nowMs + (ttlSeconds * 1000);
  store.reservations[idempotencyKey] = {
    workerId,
    reservedAt: new Date(nowMs).toISOString(),
    expiresAt
  };
  saveStore(store);

  return {
    reserved: true,
    idempotencyKey,
    workerId,
    expiresAt: new Date(expiresAt).toISOString()
  };
}

/**
 * Release a reservation without committing (e.g. if an error occurred before transmission)
 */
export function releaseReservation(idempotencyKey) {
  const store = loadStore();
  if (store.reservations[idempotencyKey]) {
    delete store.reservations[idempotencyKey];
    saveStore(store);
    return true;
  }
  return false;
}

/**
 * Commit a successful sequence step transmission
 */
export function commitSequenceStep(campaignId, recipientId, sequenceId, stepNumber, details = {}) {
  const store = loadStore();
  const idempotencyKey = generateStepIdempotencyKey(campaignId, recipientId, sequenceId, stepNumber);
  const now = new Date().toISOString();

  // 1. Record idempotency key permanently
  store.idempotencyKeys[idempotencyKey] = {
    campaignId,
    recipientId,
    sequenceId,
    stepNumber,
    step: `EMAIL_${stepNumber}`,
    dispatchedAt: now,
    providerMessageId: details.providerMessageId || null,
    sesMessageId: details.sesMessageId || null,
    status: 'SENT'
  };

  // 2. Remove reservation
  delete store.reservations[idempotencyKey];

  // 3. Update durable sequence state
  const key = getSequenceStorageKey(campaignId, recipientId);
  const existing = store.sequences[key] || {};
  const sentSteps = new Set(existing.sent_steps || []);
  sentSteps.add(`EMAIL_${stepNumber}`);

  const isFinalStep = stepNumber >= 5;
  const nextStepNum = stepNumber + 1;

  const nextDue = isFinalStep ? null : new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();

  store.sequences[key] = {
    campaign_id: campaignId,
    recipient_id: recipientId,
    sequence_id: sequenceId,
    current_step: stepNumber,
    status: isFinalStep ? 'COMPLETED' : `EMAIL_${stepNumber}_SENT`,
    sent_steps: Array.from(sentSteps),
    next_step: isFinalStep ? 'NONE' : `EMAIL_${nextStepNum}`,
    next_due_at: nextDue,
    last_sent_at: now,
    reply_detected: existing.reply_detected || false,
    reply_detected_at: existing.reply_detected_at || null,
    followups_cancelled: isFinalStep ? true : (existing.followups_cancelled || false),
    last_provider_message_id: details.providerMessageId || existing.last_provider_message_id || null,
    recipient_email: details.email || existing.recipient_email || recipientId,
    company_name: details.companyName || existing.company_name || '',
    contact_name: details.contactName || existing.contact_name || '',
    created_at: existing.created_at || now,
    updated_at: now
  };

  // 4. Audit Log
  store.auditLog.push({
    event: 'STEP_COMMITTED',
    idempotencyKey,
    timestamp: now
  });

  saveStore(store);
  return store.sequences[key];
}

/**
 * Webhook Replay Protection: Check if event has already been processed
 */
export function hasEventBeenProcessed(eventId) {
  if (!eventId) return false;
  const store = loadStore();
  return Boolean(store.processedEvents[String(eventId)]);
}

/**
 * Webhook Replay Protection: Mark event as processed
 */
export function recordProcessedEvent(eventId, details = {}) {
  if (!eventId) return;
  const store = loadStore();
  store.processedEvents[String(eventId)] = {
    processedAt: new Date().toISOString(),
    details
  };
  saveStore(store);
}

/**
 * Handle Inbound Reply Event in Persistent Store
 */
export function recordReplyReceived(campaignId, recipientId, replyData = {}) {
  const store = loadStore();
  const key = getSequenceStorageKey(campaignId, recipientId);
  const now = replyData.timestamp || new Date().toISOString();

  const existing = store.sequences[key] || {
    campaign_id: campaignId,
    recipient_id: recipientId,
    sequence_id: replyData.sequenceId || 'SEQ-01',
    current_step: 1,
    sent_steps: ['EMAIL_1'],
    created_at: now
  };

  // Apply strict cancellation invariants
  existing.reply_detected = true;
  existing.reply_detected_at = now;
  existing.followups_cancelled = true;
  existing.status = 'REPLIED';
  existing.next_step = 'NONE';
  existing.next_due_at = null;
  existing.updated_at = now;
  existing.reply_details = {
    from: replyData.from || '',
    subject: replyData.subject || '',
    inReplyTo: replyData.inReplyTo || '',
    messageId: replyData.messageId || ''
  };

  store.sequences[key] = existing;

  store.auditLog.push({
    event: 'INBOUND_REPLY_PROCESSED',
    campaignId,
    recipientId,
    timestamp: now,
    followupsCancelled: true
  });

  saveStore(store);
  return existing;
}

/**
 * Find active recipient state by email or provider message ID
 */
export function findSequenceByCriteria(criteria = {}) {
  const store = loadStore();
  const { email, inReplyTo, references, campaignId } = criteria;

  const normalizedEmail = email ? String(email).trim().toLowerCase() : null;
  const matches = [];

  for (const [key, state] of Object.entries(store.sequences)) {
    // 1. Direct message ID match (highest confidence)
    if (inReplyTo && state.last_provider_message_id) {
      if (inReplyTo.includes(state.last_provider_message_id) || state.last_provider_message_id.includes(inReplyTo)) {
        return { match: state, confidence: 'EXACT_MESSAGE_ID', ambiguous: false };
      }
    }

    if (references && state.last_provider_message_id) {
      if (references.includes(state.last_provider_message_id)) {
        return { match: state, confidence: 'EXACT_REFERENCES', ambiguous: false };
      }
    }

    // 2. Email matching
    if (normalizedEmail) {
      const stateEmail = String(state.recipient_email || state.recipient_id).trim().toLowerCase();
      if (stateEmail === normalizedEmail) {
        if (!campaignId || String(state.campaign_id).trim() === String(campaignId).trim()) {
          matches.push(state);
        }
      }
    }
  }

  if (matches.length === 1) {
    return { match: matches[0], confidence: 'EXACT_EMAIL', ambiguous: false };
  } else if (matches.length > 1) {
    return { match: null, matches, confidence: 'AMBIGUOUS', ambiguous: true };
  }

  return { match: null, confidence: 'NOT_FOUND', ambiguous: false };
}

/**
 * Record Bounce in Persistent Store
 */
export function recordBounce(campaignId, recipientId, bounceData = {}) {
  const store = loadStore();
  const key = getSequenceStorageKey(campaignId, recipientId);
  const now = bounceData.timestamp || new Date().toISOString();

  const existing = store.sequences[key] || {
    campaign_id: campaignId,
    recipient_id: recipientId,
    sequence_id: 'SEQ-01',
    created_at: now
  };

  existing.status = 'BOUNCED';
  existing.followups_cancelled = true;
  existing.next_step = 'NONE';
  existing.next_due_at = null;
  existing.updated_at = now;
  existing.bounce_details = bounceData;

  store.sequences[key] = existing;
  store.auditLog.push({
    event: 'BOUNCE_RECORDED',
    campaignId,
    recipientId,
    timestamp: now
  });

  saveStore(store);
  return existing;
}

/**
 * Record Opt-Out / Unsubscribe in Persistent Store
 */
export function recordOptOut(campaignId, recipientId, optOutData = {}) {
  const store = loadStore();
  const key = getSequenceStorageKey(campaignId, recipientId);
  const now = optOutData.timestamp || new Date().toISOString();

  const existing = store.sequences[key] || {
    campaign_id: campaignId,
    recipient_id: recipientId,
    sequence_id: 'SEQ-01',
    created_at: now
  };

  existing.status = 'UNSUBSCRIBED';
  existing.followups_cancelled = true;
  existing.next_step = 'NONE';
  existing.next_due_at = null;
  existing.updated_at = now;
  existing.opt_out_details = optOutData;

  store.sequences[key] = existing;
  store.auditLog.push({
    event: 'OPT_OUT_RECORDED',
    campaignId,
    recipientId,
    timestamp: now
  });

  saveStore(store);
  return existing;
}

/**
 * Reset store (for clean test isolation)
 */
export function resetSequenceStoreForTesting() {
  memoryStore = createEmptyStore();
  try {
    if (fs.existsSync(STORE_PATH)) {
      fs.unlinkSync(STORE_PATH);
    }
  } catch (err) {}
  saveStore(memoryStore);
  return memoryStore;
}
