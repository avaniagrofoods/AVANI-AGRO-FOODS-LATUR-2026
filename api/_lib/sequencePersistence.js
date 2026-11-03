// ============================================================
// AVANI AGRO FOODS — Sequence Persistence & Idempotency Store
// api/_lib/sequencePersistence.js
// Phase 3J: Durable Sequence State, Idempotency & Concurrency Lock
// ============================================================

import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// Repository and storage path constants
const REPO_ROOT_DIR = path.resolve(__dirname, '../..');
const REPO_SCRATCH_DIR = path.resolve(REPO_ROOT_DIR, 'scratch');
const PRIMARY_DATA_DIR = path.resolve(__dirname, '../_data');
const PRIMARY_FILE_PATH = path.join(PRIMARY_DATA_DIR, 'sequenceStateStore.json');
const TMP_FILE_PATH = path.join('/tmp', 'sequenceStateStore.json');

// In-memory cache synced with disk for maximum performance and cross-request durability
let memoryStore = null;
let boundPersistenceContract = null;

function createPersistenceError(code, message) {
  const err = new Error(`${code}: ${message}`);
  err.code = code;
  return err;
}

export function isProductionOrVercelRuntime() {
  const nodeEnv = String(process.env.NODE_ENV || '').trim().toLowerCase();
  const vercelFlag = String(process.env.VERCEL || '').trim();
  const vercelEnv = String(process.env.VERCEL_ENV || '').trim().toLowerCase();
  return (
    nodeEnv === 'production' ||
    Boolean(vercelFlag && vercelFlag !== '0' && vercelFlag !== 'false') ||
    vercelEnv === 'production' ||
    vercelEnv === 'preview'
  );
}

const IMPORT_ENV_SNAPSHOT = Object.freeze({
  hasIsolationEnv: process.env.SEQUENCE_TEST_ISOLATION !== undefined && process.env.SEQUENCE_TEST_ISOLATION !== '',
  isolationValue: process.env.SEQUENCE_TEST_ISOLATION ?? null,
  hasStorePathEnv: process.env.SEQUENCE_STORE_PATH !== undefined && process.env.SEQUENCE_STORE_PATH !== '',
  storePathValue: process.env.SEQUENCE_STORE_PATH
    ? path.resolve(String(process.env.SEQUENCE_STORE_PATH).trim())
    : null
});

function validateIsolatedStorePath(rawStorePath, requireExistingValidJson = true) {
  if (isProductionOrVercelRuntime()) {
    throw createPersistenceError(
      'ISOLATION_FORBIDDEN_IN_PRODUCTION',
      'Isolated test persistence mode cannot be activated in production or Vercel runtime environments.'
    );
  }

  if (process.env.SEQUENCE_TEST_ISOLATION !== '1') {
    throw createPersistenceError(
      'ISOLATION_FLAG_REQUIRED',
      'Custom SEQUENCE_STORE_PATH requires explicit SEQUENCE_TEST_ISOLATION=1.'
    );
  }

  if (!rawStorePath || typeof rawStorePath !== 'string' || rawStorePath.trim() === '') {
    throw createPersistenceError(
      'ISOLATED_STORE_PATH_MISSING',
      'SEQUENCE_TEST_ISOLATION=1 requires SEQUENCE_STORE_PATH to point to a pre-created JSON file under os.tmpdir().'
    );
  }

  const tmpBase = os.tmpdir();
  if (!tmpBase || typeof tmpBase !== 'string' || !fs.existsSync(tmpBase)) {
    throw createPersistenceError(
      'ISOLATED_TMPDIR_UNAVAILABLE',
      'OS temporary directory (os.tmpdir()) is unavailable for isolated test persistence.'
    );
  }

  const canonicalTmpBase = path.resolve(tmpBase);
  let realTmpBase = canonicalTmpBase;
  try {
    realTmpBase = fs.realpathSync.native ? fs.realpathSync.native(canonicalTmpBase) : fs.realpathSync(canonicalTmpBase);
  } catch {}

  const canonicalTarget = path.resolve(rawStorePath.trim());
  const canonicalTargetDir = path.dirname(canonicalTarget);
  let realTargetDir = canonicalTargetDir;
  try {
    realTargetDir = fs.realpathSync.native ? fs.realpathSync.native(canonicalTargetDir) : fs.realpathSync(canonicalTargetDir);
  } catch {}

  const normalizedTargetPosix = canonicalTarget.replace(/\\/g, '/');

  // Verify target parent directory is not a symlink and resides inside tmpdir
  try {
    if (fs.existsSync(canonicalTargetDir)) {
      const dirLstat = fs.lstatSync(canonicalTargetDir);
      if (dirLstat.isSymbolicLink()) {
        throw createPersistenceError(
          'ISOLATED_STORE_SYMLINK_FORBIDDEN',
          `Isolated store directory cannot be a symbolic link or junction: ${canonicalTargetDir}`
        );
      }
    }
  } catch (dirErr) {
    if (dirErr.code === 'ISOLATED_STORE_SYMLINK_FORBIDDEN') throw dirErr;
  }

  if (
    canonicalTarget === PRIMARY_FILE_PATH ||
    canonicalTarget.startsWith(PRIMARY_DATA_DIR + path.sep) ||
    canonicalTargetDir === PRIMARY_DATA_DIR ||
    canonicalTarget.startsWith(REPO_SCRATCH_DIR + path.sep) ||
    canonicalTargetDir === REPO_SCRATCH_DIR ||
    canonicalTarget.startsWith(REPO_ROOT_DIR + path.sep) ||
    realTargetDir.startsWith(REPO_ROOT_DIR + path.sep) ||
    canonicalTarget === path.resolve(TMP_FILE_PATH) ||
    normalizedTargetPosix === '/tmp/sequenceStateStore.json' ||
    !canonicalTarget.startsWith(canonicalTmpBase + path.sep) ||
    !realTargetDir.startsWith(realTmpBase + path.sep) ||
    canonicalTargetDir === canonicalTmpBase ||
    realTargetDir === realTmpBase ||
    path.extname(canonicalTarget).toLowerCase() !== '.json'
  ) {
    throw createPersistenceError(
      'INVALID_ISOLATED_STORE_PATH',
      `Rejected unsafe or non-isolated SEQUENCE_STORE_PATH: ${canonicalTarget}. Must reside in a dedicated subdirectory under os.tmpdir().`
    );
  }

  if (requireExistingValidJson) {
    if (!fs.existsSync(canonicalTarget)) {
      throw createPersistenceError(
        'ISOLATED_STORE_MISSING_OR_INVALID',
        `Isolated store file must already exist before module import or access: ${canonicalTarget}`
      );
    }

    try {
      const fileLstat = fs.lstatSync(canonicalTarget);
      if (fileLstat.isSymbolicLink()) {
        throw createPersistenceError(
          'ISOLATED_STORE_SYMLINK_FORBIDDEN',
          `Isolated store file cannot be a symbolic link: ${canonicalTarget}`
        );
      }
    } catch (lstatErr) {
      if (lstatErr.code === 'ISOLATED_STORE_SYMLINK_FORBIDDEN') throw lstatErr;
    }

    let parsed = null;
    try {
      const raw = fs.readFileSync(canonicalTarget, 'utf8');
      parsed = JSON.parse(raw);
    } catch (err) {
      throw createPersistenceError(
        'ISOLATED_STORE_MISSING_OR_INVALID',
        `Isolated store file could not be read or parsed as valid JSON (${canonicalTarget}): ${err.message}`
      );
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw createPersistenceError(
        'ISOLATED_STORE_MISSING_OR_INVALID',
        `Isolated store file must contain a JSON object root (${canonicalTarget}).`
      );
    }

    // Strict schema validation: Ensure all expected collections exist with correct types
    if (
      !parsed.sequences || typeof parsed.sequences !== 'object' || Array.isArray(parsed.sequences) ||
      !parsed.idempotencyKeys || typeof parsed.idempotencyKeys !== 'object' || Array.isArray(parsed.idempotencyKeys) ||
      !parsed.reservations || typeof parsed.reservations !== 'object' || Array.isArray(parsed.reservations) ||
      !parsed.processedEvents || typeof parsed.processedEvents !== 'object' || Array.isArray(parsed.processedEvents) ||
      !Array.isArray(parsed.auditLog)
    ) {
      throw createPersistenceError(
        'ISOLATED_STORE_SCHEMA_INVALID',
        `Isolated store file failed schema validation (${canonicalTarget}): required collections (sequences, idempotencyKeys, reservations, processedEvents, auditLog) missing or invalid.`
      );
    }
  }

  return canonicalTarget;
}

// Determine writable operational file path for non-isolated runtime (handles read-only Vercel lambda filesystem)
function resolveOperationalStorePath() {
  try {
    if (!fs.existsSync(PRIMARY_DATA_DIR)) {
      fs.mkdirSync(PRIMARY_DATA_DIR, { recursive: true });
    }
    const testFile = path.join(PRIMARY_DATA_DIR, '.write_test');
    fs.writeFileSync(testFile, 'ok', 'utf8');
    fs.unlinkSync(testFile);
    return PRIMARY_FILE_PATH;
  } catch (err) {
    return TMP_FILE_PATH;
  }
}

function bindOrVerifyPersistenceContract() {
  const rawIsolation = process.env.SEQUENCE_TEST_ISOLATION;
  const rawStorePath = process.env.SEQUENCE_STORE_PATH;
  const hasIsolationFlag = rawIsolation !== undefined && rawIsolation !== '' && rawIsolation !== '0';
  const hasStorePath = rawStorePath !== undefined && String(rawStorePath).trim() !== '';

  if (hasIsolationFlag || hasStorePath) {
    if (isProductionOrVercelRuntime()) {
      throw createPersistenceError(
        'ISOLATION_FORBIDDEN_IN_PRODUCTION',
        'Isolated test persistence configuration is forbidden in production or Vercel runtime environments.'
      );
    }
    if (rawIsolation !== '1') {
      throw createPersistenceError(
        'ISOLATION_FLAG_REQUIRED',
        'SEQUENCE_STORE_PATH cannot be used without explicit SEQUENCE_TEST_ISOLATION=1.'
      );
    }
    if (!hasStorePath) {
      throw createPersistenceError(
        'ISOLATED_STORE_PATH_MISSING',
        'SEQUENCE_TEST_ISOLATION=1 requires an explicit SEQUENCE_STORE_PATH under os.tmpdir().'
      );
    }
  }

  if (!IMPORT_ENV_SNAPSHOT.hasIsolationEnv && !IMPORT_ENV_SNAPSHOT.hasStorePathEnv) {
    if (hasIsolationFlag || hasStorePath) {
      throw createPersistenceError(
        'PERSISTENCE_CONFIG_CHANGED_AFTER_IMPORT',
        'SEQUENCE_TEST_ISOLATION and SEQUENCE_STORE_PATH must be configured before importing sequencePersistence.js.'
      );
    }
  } else {
    const currentResolvedPath = hasStorePath ? path.resolve(String(rawStorePath).trim()) : null;
    if (
      rawIsolation !== IMPORT_ENV_SNAPSHOT.isolationValue ||
      currentResolvedPath !== IMPORT_ENV_SNAPSHOT.storePathValue
    ) {
      throw createPersistenceError(
        'PERSISTENCE_CONFIG_CHANGED_AFTER_BINDING',
        'Persistence isolation configuration changed after module import.'
      );
    }
  }

  if (boundPersistenceContract !== null) {
    if (boundPersistenceContract.isIsolated) {
      if (isProductionOrVercelRuntime()) {
        throw createPersistenceError(
          'ISOLATION_FORBIDDEN_IN_PRODUCTION',
          'Production or Vercel environment marker detected while isolated persistence contract is bound.'
        );
      }
      const currentResolved = hasStorePath ? path.resolve(String(rawStorePath).trim()) : null;
      if (rawIsolation !== '1' || currentResolved !== boundPersistenceContract.storePath) {
        throw createPersistenceError(
          'PERSISTENCE_CONFIG_CHANGED_AFTER_BINDING',
          'Isolated persistence path or mode was modified after binding.'
        );
      }
    } else if (hasIsolationFlag || hasStorePath) {
      throw createPersistenceError(
        'PERSISTENCE_CONFIG_CHANGED_AFTER_BINDING',
        'Cannot switch to isolated persistence mode after operational persistence has been bound.'
      );
    }
    return boundPersistenceContract;
  }

  if (rawIsolation === '1') {
    const validatedIsolatedPath = validateIsolatedStorePath(rawStorePath, true);
    boundPersistenceContract = Object.freeze({
      mode: 'ISOLATED_TEST',
      isIsolated: true,
      storePath: validatedIsolatedPath
    });
    return boundPersistenceContract;
  }

  const operationalPath = resolveOperationalStorePath();
  boundPersistenceContract = Object.freeze({
    mode: isProductionOrVercelRuntime() ? 'PRODUCTION' : 'LOCAL_DEVELOPMENT',
    isIsolated: false,
    storePath: operationalPath
  });
  return boundPersistenceContract;
}

if (IMPORT_ENV_SNAPSHOT.hasIsolationEnv || IMPORT_ENV_SNAPSHOT.hasStorePathEnv) {
  bindOrVerifyPersistenceContract();
}

// ── KV / REDIS REST CLIENT HELPERS ──────────────────────────────
export function getKvConfig() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return {
    url,
    token,
    hasDistributedKV: Boolean(url && token)
  };
}

export const hasDistributedKV = Boolean(
  (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL) &&
  (process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN)
);

export function isDistributedKvRequired() {
  if (process.env.REQUIRE_DISTRIBUTED_KV === '1' || process.env.STRICT_KV_ENFORCEMENT === '1') {
    return true;
  }
  const isIsolated = Boolean(
    boundPersistenceContract?.isIsolated ||
    (process.env.SEQUENCE_TEST_ISOLATION === '1' && !isProductionOrVercelRuntime())
  );
  if (isProductionOrVercelRuntime() && !isIsolated) {
    return true;
  }
  return false;
}

export async function execKVCommand(command, ...args) {
  const { url, token, hasDistributedKV: isConfigured } = getKvConfig();

  if (!isConfigured) {
    if (isDistributedKvRequired()) {
      const err = new Error('Distributed KV is strictly required (REQUIRE_DISTRIBUTED_KV=1 or production runtime) but KV credentials are missing.');
      err.code = 'KV_CREDENTIALS_MISSING';
      throw err;
    }
    return null;
  }

  const timeoutMs = Number(process.env.KV_TIMEOUT_MS) || 1500;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const endpoint = url.replace(/\/$/, '');
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([command, ...args]),
      signal: controller.signal
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      const err = new Error(`KV Backend HTTP ${res.status}: ${errText}`);
      err.code = 'KV_BACKEND_ERROR';
      err.statusCode = res.status;
      if (isDistributedKvRequired()) throw err;
      console.warn('[SequencePersistence] KV warning:', err.message);
      return null;
    }

    const data = await res.json().catch(jsonErr => {
      const parseErr = new Error(`KV Backend returned malformed JSON: ${jsonErr.message}`);
      parseErr.code = 'KV_MALFORMED_RESPONSE';
      throw parseErr;
    });

    if (!data || typeof data !== 'object' || !('result' in data)) {
      if (isDistributedKvRequired()) {
        const shapeErr = new Error('KV Backend returned invalid envelope (missing result field)');
        shapeErr.code = 'KV_MALFORMED_RESPONSE';
        throw shapeErr;
      }
      return null;
    }

    return data.result;
  } catch (err) {
    if (err.name === 'AbortError') {
      const timeoutErr = new Error(`KV operation timed out after ${timeoutMs}ms`);
      timeoutErr.code = 'KV_TIMEOUT';
      if (isDistributedKvRequired()) throw timeoutErr;
      console.warn('[SequencePersistence] KV timeout warning:', timeoutErr.message);
      return null;
    }
    if (isDistributedKvRequired()) {
      throw err;
    }
    console.warn('[SequencePersistence] KV error:', err.message);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function execKVPipeline(commands) {
  if (!Array.isArray(commands) || commands.length === 0) return [];
  const { url, token, hasDistributedKV: isConfigured } = getKvConfig();

  if (!isConfigured) {
    if (isDistributedKvRequired()) {
      const err = new Error('Distributed KV is strictly required (REQUIRE_DISTRIBUTED_KV=1 or production runtime) but KV credentials are missing.');
      err.code = 'KV_CREDENTIALS_MISSING';
      throw err;
    }
    return null;
  }

  const timeoutMs = Number(process.env.KV_TIMEOUT_MS) || 2500;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const endpoint = `${url.replace(/\/$/, '')}/pipeline`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(commands),
      signal: controller.signal
    });

    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data.map(item => (item && typeof item === 'object' && 'result' in item ? item.result : item)) : data;
    }

    // Fallback: execute commands sequentially if /pipeline endpoint is not handled by mock
    const results = [];
    for (const cmdArgs of commands) {
      const [cmd, ...args] = cmdArgs;
      const resVal = await execKVCommand(cmd, ...args);
      results.push(resVal);
    }
    return results;
  } catch (err) {
    if (isDistributedKvRequired()) throw err;
    try {
      const results = [];
      for (const cmdArgs of commands) {
        const [cmd, ...args] = cmdArgs;
        const resVal = await execKVCommand(cmd, ...args);
        results.push(resVal);
      }
      return results;
    } catch (fallbackErr) {
      console.warn('[SequencePersistence] Pipeline fallback error:', fallbackErr.message);
      return null;
    }
  } finally {
    clearTimeout(timer);
  }
}

export function getStorageConfiguration() {
  const contract = bindOrVerifyPersistenceContract();
  const storePath = contract.storePath;
  const isTmp = storePath === TMP_FILE_PATH;
  const isKvConfigured = getKvConfig().hasDistributedKV;
  return {
    storePath,
    mode: contract.mode,
    isIsolated: contract.isIsolated,
    isEphemeral: isTmp,
    hasDistributedKV: isKvConfigured,
    isDurable: !isTmp || isKvConfigured,
    strictKvEnforced: Boolean(process.env.REQUIRE_DISTRIBUTED_KV === '1' || process.env.STRICT_KV_ENFORCEMENT === '1')
  };
}

export function createEmptyStore() {
  return {
    version: '1.0.0',
    lastUpdated: new Date().toISOString(),
    sequences: {},          // key: `${campaign_id}:${recipient_id}` -> state
    idempotencyKeys: {},    // key: `${campaign_id}:${recipient_id}:${sequence_id}:${step}` -> details
    reservations: {},       // key: idempotencyKey -> { workerId, expiresAt }
    processedEvents: {},    // key: eventId -> { processedAt, details }
    auditLog: [],
    dailyThroughput: {},    // key: UTC dateKey -> { count, limit, reservations: [] }
    pacingLog: []           // list of { timestamp, workerId, reservationId }
  };
}

function getBundledBaselineStore() {
  const contract = bindOrVerifyPersistenceContract();
  if (contract.isIsolated) {
    throw createPersistenceError(
      'BUNDLED_STORE_FALLBACK_FORBIDDEN_IN_ISOLATION',
      'Isolated test mode must never read or seed from bundled operational sequenceStateStore.json.'
    );
  }
  try {
    return require('../_data/sequenceStateStore.json');
  } catch (e) {
    return createEmptyStore();
  }
}

export function loadStore() {
  const contract = bindOrVerifyPersistenceContract();
  const targetPath = contract.storePath;

  if (contract.isIsolated) {
    if (memoryStore) {
      if (!fs.existsSync(targetPath)) {
        throw createPersistenceError(
          'ISOLATED_STORE_MISSING_OR_INVALID',
          `Isolated store file was removed while memoryStore was active: ${targetPath}`
        );
      }
      return memoryStore;
    }

    const validatedPath = validateIsolatedStorePath(targetPath, true);
    const raw = fs.readFileSync(validatedPath, 'utf8');
    memoryStore = JSON.parse(raw);
    return memoryStore;
  }

  if (memoryStore) {
    return memoryStore;
  }

  try {
    if (fs.existsSync(targetPath)) {
      const raw = fs.readFileSync(targetPath, 'utf8');
      memoryStore = JSON.parse(raw);
      return memoryStore;
    }
    // Fallback (non-isolated runtime only): check primary if using tmp
    if (targetPath !== PRIMARY_FILE_PATH && fs.existsSync(PRIMARY_FILE_PATH)) {
      const raw = fs.readFileSync(PRIMARY_FILE_PATH, 'utf8');
      memoryStore = JSON.parse(raw);
      saveStore(memoryStore);
      return memoryStore;
    }
  } catch (err) {
    console.warn('[SequencePersistence] Warning reading persistent store, falling back to baseline:', err.message);
  }

  memoryStore = JSON.parse(JSON.stringify(getBundledBaselineStore()));
  saveStore(memoryStore);
  return memoryStore;
}

export function saveStore(store) {
  const contract = bindOrVerifyPersistenceContract();
  const targetPath = contract.storePath;

  memoryStore = store || memoryStore || createEmptyStore();
  memoryStore.lastUpdated = new Date().toISOString();

  if (process.env.SIMULATE_STORAGE_FAILURE === '1') {
    return { success: false, error: 'SIMULATED_STORAGE_FAILURE' };
  }

  if (contract.isIsolated) {
    const parentDir = path.dirname(targetPath);
    if (!fs.existsSync(parentDir)) {
      throw createPersistenceError(
        'ISOLATED_STORE_DIRECTORY_MISSING',
        `Isolated store parent directory does not exist: ${parentDir}`
      );
    }

    try {
      const serialized = JSON.stringify(memoryStore, null, 2);
      const tmpPath = `${targetPath}.tmp.${Date.now()}.${Math.random().toString(36).substring(2, 6)}`;
      fs.writeFileSync(tmpPath, serialized, 'utf8');
      fs.renameSync(tmpPath, targetPath);
      return { success: true, error: null };
    } catch (err) {
      // Never fall back to /tmp/sequenceStateStore.json or any shared path in isolated mode
      const code = err && err.code ? err.code : 'ISOLATED_STORE_WRITE_FAILED';
      throw createPersistenceError(
        code,
        `Isolated store write failed (${targetPath}): ${err.message}`
      );
    }
  }

  let writeSuccess = false;
  let writeError = null;

  try {
    const serialized = JSON.stringify(memoryStore, null, 2);
    const tmpPath = `${targetPath}.tmp.${Date.now()}.${Math.random().toString(36).substring(2, 6)}`;
    
    // Ensure parent directory exists
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Atomic write pattern: write to temp file then rename
    fs.writeFileSync(tmpPath, serialized, 'utf8');
    fs.renameSync(tmpPath, targetPath);
    writeSuccess = true;
  } catch (err) {
    // If target directory is read-only in non-isolated runtime, attempt fallback to /tmp
    if (err.code === 'EROFS' || err.code === 'EACCES') {
      try {
        const serialized = JSON.stringify(memoryStore, null, 2);
        const tmpPath = `${TMP_FILE_PATH}.tmp.${Date.now()}`;
        fs.writeFileSync(tmpPath, serialized, 'utf8');
        fs.renameSync(tmpPath, TMP_FILE_PATH);
        writeSuccess = true;
      } catch (tmpErr) {
        writeError = tmpErr;
        console.error('[SequencePersistence] Critical: Failed to persist to /tmp:', tmpErr.message);
      }
    } else {
      writeError = err;
      console.error('[SequencePersistence] Error persisting store:', err.message);
    }
  }

  return { success: writeSuccess, error: writeError ? writeError.message : null };
}

/**
 * Privacy-safe email masking for diagnostic logs (DPDP / PII protection)
 */
export function maskEmail(email) {
  if (!email || typeof email !== 'string') return '[EMPTY]';
  const trimmed = email.trim();
  const atIdx = trimmed.indexOf('@');
  if (atIdx <= 0 || atIdx === trimmed.length - 1) return '[MALFORMED]';
  const name = trimmed.substring(0, atIdx);
  const domain = trimmed.substring(atIdx + 1);
  const maskedName = name.length <= 2
    ? `${name[0]}*`
    : `${name[0]}${'*'.repeat(Math.min(name.length - 2, 8))}${name[name.length - 1]}`;
  return `${maskedName}@${domain}`;
}

/**
 * Shared deterministic recipient email resolver and sanitization gate.
 * Validates candidates, rejects CR/LF/control characters, strips display names,
 * detects conflicts, enforces RFC 5321/5322 syntax, and eliminates opaque ID fallbacks.
 */
export function resolveCanonicalRecipientEmail(stateOrInput, options = {}) {
  if (stateOrInput === null || stateOrInput === undefined) {
    return {
      valid: false,
      error: 'MISSING_RECIPIENT_EMAIL',
      reason: 'Recipient email is missing: input state or object is null or undefined'
    };
  }

  // 1. Candidate alias extraction with strict type checking
  let candidateEmail = null;
  let candidateRecipientEmail = null;
  let candidateLegacyRecipientEmail = null;

  if (typeof stateOrInput === 'string') {
    candidateEmail = stateOrInput;
  } else if (typeof stateOrInput === 'object' && stateOrInput !== null) {
    for (const key of ['email', 'recipient_email', 'recipientEmail']) {
      if (key in stateOrInput) {
        const val = stateOrInput[key];
        if (val !== undefined && val !== null) {
          if (typeof val !== 'string') {
            return {
              valid: false,
              error: 'INVALID_RECIPIENT_EMAIL_TYPE',
              reason: `Recipient email field '${key}' must be a string, received ${typeof val}`
            };
          }
          if (key === 'email') candidateEmail = val;
          if (key === 'recipient_email') candidateRecipientEmail = val;
          if (key === 'recipientEmail') candidateLegacyRecipientEmail = val;
        }
      }
    }
  } else {
    return {
      valid: false,
      error: 'INVALID_RECIPIENT_EMAIL_TYPE',
      reason: `Recipient email must be a string or object, received ${typeof stateOrInput}`
    };
  }

  const candidateEntries = [
    { field: 'email', val: candidateEmail },
    { field: 'recipient_email', val: candidateRecipientEmail },
    { field: 'recipientEmail', val: candidateLegacyRecipientEmail }
  ].filter(c => c.val !== null);

  if (candidateEntries.length === 0) {
    return {
      valid: false,
      error: 'MISSING_RECIPIENT_EMAIL',
      reason: 'No recipient email candidate found in state/input'
    };
  }

  const rawCandidates = candidateEntries.filter(c => c.val.trim().length > 0);
  if (rawCandidates.length === 0) {
    return {
      valid: false,
      error: 'EMPTY_RECIPIENT_EMAIL',
      reason: 'Recipient email candidate is empty or whitespace-only'
    };
  }

  // 2. Pre-check all candidates for CR/LF, control characters, and multiple addresses
  for (const cand of rawCandidates) {
    if (/[\r\n\x00-\x1F\x7F]/.test(cand.val)) {
      return {
        valid: false,
        error: 'INVALID_RECIPIENT_EMAIL',
        reason: `Recipient email in field '${cand.field}' contains illegal newline or control characters (header injection risk)`
      };
    }
    if (cand.val.includes(',') || cand.val.includes(';')) {
      return {
        valid: false,
        error: 'INVALID_RECIPIENT_EMAIL',
        reason: `Multiple recipient addresses are strictly forbidden in field '${cand.field}'`
      };
    }
  }

  // 3. Normalize each candidate: display-name stripping and lowercasing
  const normalizedList = [];
  for (const cand of rawCandidates) {
    const rawStr = cand.val.trim();
    const bracketMatch = rawStr.match(/^([^<]*)<([^>]+)>$/);
    let extracted;
    if (bracketMatch) {
      extracted = bracketMatch[2].trim();
    } else {
      if (rawStr.includes('<') || rawStr.includes('>')) {
        return {
          valid: false,
          error: 'INVALID_RECIPIENT_EMAIL',
          reason: `Malformed angle-bracket formatting in field '${cand.field}'`
        };
      }
      extracted = rawStr;
    }
    normalizedList.push({
      field: cand.field,
      raw: rawStr,
      normalized: extracted.toLowerCase()
    });
  }

  // 4. Conflicting candidate detection
  const firstNorm = normalizedList[0].normalized;
  for (let i = 1; i < normalizedList.length; i++) {
    if (normalizedList[i].normalized !== firstNorm) {
      return {
        valid: false,
        error: 'CONFLICTING_RECIPIENT_EMAIL',
        reason: `Conflicting recipient email addresses: '${normalizedList[0].field}' (${maskEmail(normalizedList[0].normalized)}) vs '${normalizedList[i].field}' (${maskEmail(normalizedList[i].normalized)})`
      };
    }
  }

  const cleanAddress = firstNorm;
  const atIdx = cleanAddress.indexOf('@');
  const localPart = atIdx !== -1 ? cleanAddress.substring(0, atIdx) : '';
  const domainPart = atIdx !== -1 ? cleanAddress.substring(atIdx + 1) : '';

  // 5. Conservative RFC 5321/5322 syntax validation
  const EMAIL_SYNTAX_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

  if (
    cleanAddress.length > 254 ||
    localPart.length > 64 ||
    localPart.length === 0 ||
    domainPart.length === 0 ||
    localPart.startsWith('.') ||
    localPart.endsWith('.') ||
    domainPart.startsWith('.') ||
    domainPart.endsWith('.') ||
    cleanAddress.includes('..') ||
    !cleanAddress.includes('@') ||
    !EMAIL_SYNTAX_REGEX.test(cleanAddress)
  ) {
    return {
      valid: false,
      error: 'INVALID_RECIPIENT_EMAIL',
      reason: `Recipient email failed RFC syntax validation: '${maskEmail(cleanAddress)}'`
    };
  }

  return {
    valid: true,
    canonicalEmail: cleanAddress,
    raw: normalizedList[0].raw
  };
}

/**
 * Safely escape a key component so colons and special characters do not collide with delimiters.
 * Preserves Unicode and handles null/undefined gracefully.
 */
export function escapeKeyComponent(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .trim()
    .replace(/%/g, '%25')
    .replace(/:/g, '%3A');
}

/**
 * Safely unescape a key component.
 */
export function unescapeKeyComponent(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/%3A/gi, ':')
    .replace(/%25/g, '%');
}

/**
 * Parse standard compound sequence storage key safely, handling colons in IDs, Unicode, empty components, and boundaries.
 * Backward compatible with unescaped keys.
 */
export function parseSequenceStorageKey(compoundKey) {
  if (!compoundKey || typeof compoundKey !== 'string') {
    return { campaignId: null, recipientId: null, valid: false, error: 'KEY_EMPTY_OR_INVALID' };
  }
  const trimmed = compoundKey.trim();
  const delimIdx = trimmed.indexOf(':');
  if (delimIdx === -1) {
    return { campaignId: null, recipientId: null, valid: false, error: 'DELIMITER_MISSING' };
  }
  const rawCampaign = trimmed.substring(0, delimIdx);
  const rawRecipient = trimmed.substring(delimIdx + 1);

  if (!rawCampaign || !rawRecipient) {
    return { campaignId: null, recipientId: null, valid: false, error: 'EMPTY_COMPONENT' };
  }

  const campaignId = unescapeKeyComponent(rawCampaign);
  const recipientId = unescapeKeyComponent(rawRecipient);

  return {
    campaignId,
    recipientId,
    valid: true,
    error: null
  };
}

/**
 * Generate standard sequence storage key with component escaping.
 * Output has exactly one delimiter colon, making parsing 100% deterministic even with colons in IDs.
 */
export function getSequenceStorageKey(campaignId, recipientId) {
  if (!campaignId || !recipientId) {
    throw new Error('campaignId and recipientId are required');
  }
  const cleanCampaign = String(campaignId).trim();
  const cleanRecipient = String(recipientId).trim().toLowerCase();
  return `${escapeKeyComponent(cleanCampaign)}:${escapeKeyComponent(cleanRecipient)}`;
}

/**
 * Generate standard step idempotency key
 */
export function generateStepIdempotencyKey(campaignId, recipientId, sequenceId, stepNumber) {
  if (!campaignId || !recipientId || !sequenceId) {
    throw new Error('campaignId, recipientId, and sequenceId are required for idempotency');
  }
  const step = stepNumber ? `EMAIL_${stepNumber}` : sequenceId;
  return `${escapeKeyComponent(campaignId)}:${escapeKeyComponent(recipientId).toLowerCase()}:${escapeKeyComponent(sequenceId)}:${escapeKeyComponent(step)}`;
}

/**
 * Parse standard step idempotency key
 */
export function parseStepIdempotencyKey(key) {
  if (!key || typeof key !== 'string') return null;
  const parts = key.split(':');
  if (parts.length < 4) return null;
  return {
    campaignId: unescapeKeyComponent(parts[0]),
    recipientId: unescapeKeyComponent(parts[1]),
    sequenceId: unescapeKeyComponent(parts[2]),
    step: unescapeKeyComponent(parts.slice(3).join(':'))
  };
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
    recipient_email: (() => {
      const emailRes = resolveCanonicalRecipientEmail(state);
      if (emailRes.valid) return emailRes.canonicalEmail;
      const existRes = resolveCanonicalRecipientEmail(existing);
      if (existRes.valid) return existRes.canonicalEmail;
      return null;
    })(),
    company_name: state.company_name || state.companyName || existing.company_name || '',
    contact_name: state.contact_name || state.contactName || existing.contact_name || '',
    approvedForOutreach: Boolean(state.approvedForOutreach !== undefined ? state.approvedForOutreach : (state.approved !== undefined ? state.approved : existing.approvedForOutreach)),
    approvedBy: state.approvedBy !== undefined ? state.approvedBy : (existing.approvedBy !== undefined ? existing.approvedBy : null),
    approvedAt: state.approvedAt !== undefined ? state.approvedAt : (existing.approvedAt !== undefined ? existing.approvedAt : null),
    approvalRevoked: Boolean(state.approvalRevoked !== undefined ? state.approvalRevoked : existing.approvalRevoked),
    approvalRevokedAt: state.approvalRevokedAt || existing.approvalRevokedAt || null,
    approvalStatus: state.approvalStatus || existing.approvalStatus || null,
    haltReason: state.haltReason !== undefined ? state.haltReason : (existing.haltReason || null),
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
  // Concurrency Gate: If multi-instance mode strictly requires distributed KV, fail closed when unconfigured
  if ((process.env.REQUIRE_DISTRIBUTED_KV === '1' || process.env.STRICT_KV_ENFORCEMENT === '1') && !getKvConfig().hasDistributedKV) {
    return {
      reserved: false,
      blocked: true,
      reason: 'MISSING_DISTRIBUTED_KV_STORAGE: Distributed KV required in multi-instance mode but unconfigured'
    };
  }

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

  // 1b. Check durable dispatch intent
  const existingIntent = store.dispatchIntents && store.dispatchIntents[idempotencyKey];
  if (existingIntent) {
    if (existingIntent.status === 'COMMITTED' || existingIntent.status === 'RECONCILED_CONFIRMED_SENT') {
      return { reserved: false, alreadySent: true, reason: 'ALREADY_SENT', details: existingIntent };
    }
    if (existingIntent.status === 'PROVIDER_ACCEPTED' || existingIntent.status === 'RECONCILIATION_HOLD' || existingIntent.status === 'COMMIT_FAILED_HOLD') {
      return { reserved: false, blocked: true, reconciliationHold: true, reason: 'DISPATCH_INTENT_RECONCILIATION_HOLD', details: existingIntent };
    }
    if (existingIntent.status === 'DISPATCH_IN_FLIGHT') {
      return { reserved: false, blocked: true, inFlight: true, reason: 'DISPATCH_INTENT_IN_FLIGHT', details: existingIntent };
    }
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
  const leaseToken = crypto.randomBytes(8).toString('hex');
  store.reservations[idempotencyKey] = {
    workerId,
    leaseToken,
    reservedAt: new Date(nowMs).toISOString(),
    expiresAt
  };
  saveStore(store);

  return {
    reserved: true,
    idempotencyKey,
    workerId,
    leaseToken,
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
 * Validate incoming idempotency replay against stored commit record.
 * Ensures replay explicitly presents and matches stored providerMessageId and payloadDigest,
 * preventing replay bypass via empty details.
 */
export function validateIdempotencyReplay(stored, incoming = {}, idempotencyKey = '') {
  if (!stored || typeof stored !== 'object') {
    return {
      valid: false,
      error: 'STORED_IDEMPOTENCY_CORRUPT',
      reason: `FATAL_IDEMPOTENCY_CONFLICT: Stored idempotency record is missing or corrupt for ${idempotencyKey}`,
      idempotencyKey,
      existing: stored || null,
      incoming: incoming || {}
    };
  }

  const storedProvId = stored.providerMessageId ? String(stored.providerMessageId).trim() : null;
  const incomingProvId = incoming.providerMessageId ? String(incoming.providerMessageId).trim() : null;
  const storedDigest = stored.payloadDigest ? String(stored.payloadDigest).trim() : null;
  const incomingDigest = incoming.payloadDigest ? String(incoming.payloadDigest).trim() : null;

  if (!storedProvId && !storedDigest) {
    return {
      valid: false,
      error: 'INSUFFICIENT_STORED_EVIDENCE',
      reason: `FATAL_IDEMPOTENCY_CONFLICT: Stored record lacks required evidence (providerMessageId and payloadDigest missing) for ${idempotencyKey}`,
      idempotencyKey,
      existing: stored,
      incoming: incoming || {}
    };
  }

  if (storedProvId) {
    if (!incomingProvId || incomingProvId !== storedProvId) {
      return {
        valid: false,
        error: 'FATAL_IDEMPOTENCY_CONFLICT',
        reason: `FATAL_IDEMPOTENCY_CONFLICT: Provider message ID mismatch or missing on replay for ${idempotencyKey}`,
        idempotencyKey,
        existing: stored,
        incoming: {
          providerMessageId: incoming.providerMessageId || null,
          payloadDigest: incoming.payloadDigest || null
        }
      };
    }
  } else if (incomingProvId) {
    return {
      valid: false,
      error: 'FATAL_IDEMPOTENCY_CONFLICT',
      reason: `FATAL_IDEMPOTENCY_CONFLICT: Incoming supplied provider message ID but stored record has none for ${idempotencyKey}`,
      idempotencyKey,
      existing: stored,
      incoming: {
        providerMessageId: incoming.providerMessageId || null,
        payloadDigest: incoming.payloadDigest || null
      }
    };
  }

  if (storedDigest) {
    if (!incomingDigest || incomingDigest !== storedDigest) {
      return {
        valid: false,
        error: 'FATAL_IDEMPOTENCY_CONFLICT',
        reason: `FATAL_IDEMPOTENCY_CONFLICT: Payload digest mismatch or missing on replay for ${idempotencyKey}`,
        idempotencyKey,
        existing: stored,
        incoming: {
          providerMessageId: incoming.providerMessageId || null,
          payloadDigest: incoming.payloadDigest || null
        }
      };
    }
  } else if (incomingDigest) {
    return {
      valid: false,
      error: 'FATAL_IDEMPOTENCY_CONFLICT',
      reason: `FATAL_IDEMPOTENCY_CONFLICT: Incoming supplied payload digest but stored record has none for ${idempotencyKey}`,
      idempotencyKey,
      existing: stored,
      incoming: {
        providerMessageId: incoming.providerMessageId || null,
        payloadDigest: incoming.payloadDigest || null
      }
    };
  }

  return { valid: true };
}

/**
 * Commit a successful sequence step transmission
 */
export function commitSequenceStep(campaignId, recipientId, sequenceId, stepNumber, details = {}) {
  const store = loadStore();
  const idempotencyKey = generateStepIdempotencyKey(campaignId, recipientId, sequenceId, stepNumber);
  const now = new Date().toISOString();

  // Fencing check: if workerId or leaseToken is specified and a reservation exists, verify ownership and lease
  if (store.reservations && store.reservations[idempotencyKey]) {
    const currentRes = store.reservations[idempotencyKey];
    if (details.reconciled === true) {
      delete store.reservations[idempotencyKey];
    } else {
      if (details.workerId && currentRes.workerId !== details.workerId) {
        return {
          committed: false,
          fencingViolation: true,
          reason: `FENCING_VIOLATION: Reservation held by ${currentRes.workerId}, not ${details.workerId}`,
          currentWorkerId: currentRes.workerId
        };
      }
      if (currentRes.leaseToken || details.leaseToken) {
        if (!details.leaseToken || !currentRes.leaseToken || String(details.leaseToken).trim() !== String(currentRes.leaseToken).trim()) {
          return {
            committed: false,
            fencingViolation: true,
            reason: `FENCING_VIOLATION: Lease token mismatch or missing. Reservation held token ${currentRes.leaseToken || 'none'}, incoming supplied ${details.leaseToken || 'none'}`,
            currentLeaseToken: currentRes.leaseToken || null,
            incomingLeaseToken: details.leaseToken || null
          };
        }
      }
      if (currentRes.expiresAt <= Date.now()) {
        return {
          committed: false,
          leaseExpired: true,
          reason: `LEASE_EXPIRED: Reservation expired at ${new Date(currentRes.expiresAt).toISOString()}`
        };
      }
    }
  }

  // Idempotency check: if already committed, return existing without re-mutating
  if (store.idempotencyKeys && store.idempotencyKeys[idempotencyKey]) {
    const existing = store.idempotencyKeys[idempotencyKey];
    const replayValidation = validateIdempotencyReplay(existing, details, idempotencyKey);
    if (!replayValidation.valid) {
      return {
        committed: false,
        fatalConflict: true,
        error: replayValidation.error,
        reason: replayValidation.reason,
        idempotencyKey,
        existing: replayValidation.existing,
        incoming: replayValidation.incoming
      };
    }
    return {
      committed: true,
      alreadyCommitted: true,
      idempotencyKey,
      details: existing
    };
  }

  // 1. Record idempotency key permanently
  store.idempotencyKeys[idempotencyKey] = {
    campaignId,
    recipientId,
    sequenceId,
    stepNumber,
    step: `EMAIL_${stepNumber}`,
    dispatchedAt: now,
    providerMessageId: details.providerMessageId || null,
    payloadDigest: details.payloadDigest || null,
    sesMessageId: details.sesMessageId || null,
    workerId: details.workerId || null,
    leaseToken: details.leaseToken || null,
    status: 'SENT'
  };

  // 2. Remove reservation only if matching active lease token
  if (store.reservations && store.reservations[idempotencyKey]) {
    const activeRes = store.reservations[idempotencyKey];
    if (!activeRes.leaseToken || activeRes.leaseToken === details.leaseToken) {
      delete store.reservations[idempotencyKey];
    }
  }

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
    recipient_email: (() => {
      const detRes = resolveCanonicalRecipientEmail(details);
      if (detRes.valid) return detRes.canonicalEmail;
      const existRes = resolveCanonicalRecipientEmail(existing);
      if (existRes.valid) return existRes.canonicalEmail;
      return null;
    })(),
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

  const saveResult = saveStore(store);
  if (!saveResult.success && (process.env.REQUIRE_DURABLE_STORAGE === '1' || process.env.NODE_ENV === 'production')) {
    return {
      committed: false,
      storageFailure: true,
      reason: `DURABLE_STORAGE_WRITE_FAILED: ${saveResult.error || 'Write error'}`
    };
  }

  return {
    committed: true,
    ...store.sequences[key]
  };
}

/**
 * Webhook Replay Protection: Check if event has already been processed (Synchronous - Local)
 */
export function hasEventBeenProcessed(eventId) {
  if (!eventId) return false;
  const store = loadStore();
  return Boolean(store.processedEvents[String(eventId)]);
}

/**
 * Webhook Replay Protection: Mark event as processed (Synchronous - Local)
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
 * Distributed Webhook Atomic Claim with Lease TTL
 * Addresses crash window: Uses lease (default 60s) so if a worker crashes before completion,
 * the lease automatically expires to allow retry processing.
 * Does NOT make false claims of exactly-once delivery; provides at-least-once delivery with bounded lease deduplication.
 */
export async function claimEventDistributed(eventId, workerId = 'worker-default', leaseSeconds = 60) {
  if (!eventId) throw new Error('eventId is required for claimEventDistributed');
  const claimKey = `event_claim:${String(eventId).trim()}`;
  const isKvConfigured = getKvConfig().hasDistributedKV;
  const isKvRequired = isDistributedKvRequired();

  if (isKvConfigured || isKvRequired) {
    const claimData = JSON.stringify({
      status: 'CLAIMED',
      workerId,
      claimedAt: new Date().toISOString()
    });

    // Atomic claim via SET claimKey claimData EX leaseSeconds NX
    const claimResult = await execKVCommand('SET', claimKey, claimData, 'EX', String(leaseSeconds), 'NX');

    // If result is "OK", this worker won the exclusive lease
    if (claimResult === 'OK') {
      return {
        claimed: true,
        duplicate: false,
        status: 'CLAIMED',
        workerId,
        storage: 'distributed_kv'
      };
    }

    // Key exists: inspect its current status
    const existingRaw = await execKVCommand('GET', claimKey);
    let existing = null;
    try {
      existing = typeof existingRaw === 'string' ? JSON.parse(existingRaw) : existingRaw;
    } catch {}

    const status = existing?.status || 'PROCESSED';
    return {
      claimed: false,
      duplicate: true,
      status,
      details: existing,
      storage: 'distributed_kv'
    };
  }

  // Local fallback mode
  const store = loadStore();
  store.reservations = store.reservations || {};
  store.processedEvents = store.processedEvents || {};

  if (store.processedEvents[eventId]) {
    return {
      claimed: false,
      duplicate: true,
      status: 'PROCESSED',
      details: store.processedEvents[eventId],
      storage: 'local_file'
    };
  }

  const existingRes = store.reservations[claimKey];
  const now = Date.now();
  if (existingRes && existingRes.expiresAt > now) {
    return {
      claimed: false,
      duplicate: true,
      status: 'CLAIMED',
      details: existingRes,
      storage: 'local_file'
    };
  }

  store.reservations[claimKey] = {
    workerId,
    claimedAt: new Date().toISOString(),
    expiresAt: now + (leaseSeconds * 1000)
  };
  saveStore(store);

  return {
    claimed: true,
    duplicate: false,
    status: 'CLAIMED',
    workerId,
    storage: 'local_file'
  };
}

/**
 * Distributed Webhook Completion
 * Atomically marks event as PROCESSED with 7-day retention TTL in distributed KV and local store.
 * Verifies lease ownership if workerId is provided to reject stale/superseded workers.
 */
export async function completeEventDistributed(eventId, details = {}, retentionSeconds = 604800, workerId = null) {
  if (!eventId) return { completed: false, reason: 'MISSING_EVENT_ID' };
  const claimKey = `event_claim:${String(eventId).trim()}`;
  const isKvConfigured = getKvConfig().hasDistributedKV;
  const isKvRequired = isDistributedKvRequired();

  if (isKvConfigured || isKvRequired) {
    // If workerId is provided, verify lease ownership before completing
    if (workerId) {
      const currentRaw = await execKVCommand('GET', claimKey);
      if (currentRaw) {
        let currentClaim = null;
        try {
          currentClaim = typeof currentRaw === 'string' ? JSON.parse(currentRaw) : currentRaw;
        } catch {}

        if (currentClaim && currentClaim.workerId && currentClaim.workerId !== workerId) {
          const err = new Error(`STALE_WORKER_CLAIM_SUPERSEDED: Event lease was claimed by ${currentClaim.workerId}, but worker ${workerId} attempted completion.`);
          err.code = 'STALE_WORKER_CLAIM_SUPERSEDED';
          err.currentWorkerId = currentClaim.workerId;
          err.callerWorkerId = workerId;
          if (isKvRequired) throw err;
          console.warn('[SequencePersistence] Warning:', err.message);
          return {
            completed: false,
            superseded: true,
            code: 'STALE_WORKER_CLAIM_SUPERSEDED',
            currentWorkerId: currentClaim.workerId
          };
        }
      }
    }

    const completionData = JSON.stringify({
      status: 'PROCESSED',
      completedAt: new Date().toISOString(),
      workerId: workerId || 'unknown',
      details
    });

    await execKVCommand('SET', claimKey, completionData, 'EX', String(retentionSeconds));
  }

  // Also update local store
  const store = loadStore();
  store.processedEvents = store.processedEvents || {};
  store.processedEvents[String(eventId)] = {
    processedAt: new Date().toISOString(),
    workerId: workerId || 'unknown',
    details
  };
  if (store.reservations && store.reservations[claimKey]) {
    delete store.reservations[claimKey];
  }
  saveStore(store);

  return { completed: true, status: 'PROCESSED' };
}

/**
 * Query event status across distributed KV or local fallback
 */
export async function getEventStatusDistributed(eventId) {
  if (!eventId) return { exists: false, status: null };
  const claimKey = `event_claim:${String(eventId).trim()}`;
  const isKvConfigured = getKvConfig().hasDistributedKV;

  if (isKvConfigured || process.env.REQUIRE_DISTRIBUTED_KV === '1') {
    const raw = await execKVCommand('GET', claimKey);
    if (raw === null || raw === undefined) {
      return { exists: false, status: null, storage: 'distributed_kv' };
    }
    let parsed = null;
    try {
      parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch {}
    return {
      exists: true,
      status: parsed?.status || 'UNKNOWN',
      details: parsed,
      storage: 'distributed_kv'
    };
  }

  const store = loadStore();
  if (store.processedEvents?.[eventId]) {
    return { exists: true, status: 'PROCESSED', details: store.processedEvents[eventId], storage: 'local_file' };
  }
  const res = store.reservations?.[claimKey];
  if (res && res.expiresAt > Date.now()) {
    return { exists: true, status: 'CLAIMED', details: res, storage: 'local_file' };
  }
  return { exists: false, status: null, storage: 'local_file' };
}

/**
 * Async Webhook Replay Protection Wrapper
 */
export async function hasEventBeenProcessedAsync(eventId) {
  const status = await getEventStatusDistributed(eventId);
  return status.exists;
}

/**
 * Async Webhook Replay Protection Mark Wrapper
 */
export async function recordProcessedEventAsync(eventId, details = {}) {
  await completeEventDistributed(eventId, details);
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
 * Test whether a sequence state is currently active vs. terminal/completed.
 */
export function isSequenceActiveState(st) {
  if (!st) return false;
  if (st.followups_cancelled === true) return false;
  if (st.reply_detected === true) return false;
  const status = String(st.status || st.sequenceStatus || st.sequence_status || '').toUpperCase();
  const terminalStatuses = [
    'COMPLETED',
    'REPLIED',
    'STOPPED_REPLY_RECEIVED',
    'BOUNCED',
    'STOPPED_BOUNCED',
    'OPT_OUT',
    'STOPPED_OPT_OUT',
    'STOPPED_INVALID',
    'UNSUBSCRIBED'
  ];
  if (terminalStatuses.includes(status)) return false;
  return true;
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
      const emailRes = resolveCanonicalRecipientEmail(state);
      const stateEmail = emailRes.valid ? emailRes.canonicalEmail : (state.recipient_email && state.recipient_email.includes('@') ? state.recipient_email.trim().toLowerCase() : '');
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
    const activeCandidates = matches.filter(isSequenceActiveState);
    if (activeCandidates.length === 1) {
      return {
        match: activeCandidates[0],
        confidence: 'EXACT_EMAIL_ACTIVE',
        ambiguous: false,
        totalCandidates: matches.length,
        resolvedFromActive: true
      };
    } else if (activeCandidates.length > 1) {
      return {
        match: null,
        matches: activeCandidates,
        confidence: 'AMBIGUOUS',
        ambiguous: true,
        reason: 'MULTIPLE_ACTIVE_CAMPAIGNS'
      };
    } else {
      return {
        match: null,
        matches,
        confidence: 'AMBIGUOUS',
        ambiguous: true,
        reason: 'MULTIPLE_TERMINAL_CAMPAIGNS'
      };
    }
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
 * Reset store (strictly restricted to verified isolated-test mode)
 */
export function resetSequenceStoreForTesting() {
  if (isProductionOrVercelRuntime()) {
    throw createPersistenceError(
      'RESET_FORBIDDEN_IN_PRODUCTION',
      'resetSequenceStoreForTesting() is strictly forbidden in production or Vercel runtime environments.'
    );
  }

  const contract = bindOrVerifyPersistenceContract();
  if (!contract.isIsolated || contract.mode !== 'ISOLATED_TEST') {
    throw createPersistenceError(
      'RESET_REQUIRES_ISOLATED_TEST_MODE',
      'resetSequenceStoreForTesting() requires active SEQUENCE_TEST_ISOLATION=1 and a validated os.tmpdir() store path.'
    );
  }

  const targetPath = validateIsolatedStorePath(contract.storePath, false);
  if (
    targetPath === PRIMARY_FILE_PATH ||
    targetPath.startsWith(PRIMARY_DATA_DIR + path.sep) ||
    targetPath === path.resolve(TMP_FILE_PATH)
  ) {
    throw createPersistenceError(
      'INVALID_ISOLATED_STORE_PATH',
      `resetSequenceStoreForTesting() refused to operate on shared store path: ${targetPath}`
    );
  }

  memoryStore = createEmptyStore();
  const saveResult = saveStore(memoryStore);
  if (!saveResult || !saveResult.success) {
    throw createPersistenceError(
      'ISOLATED_STORE_RESET_WRITE_FAILED',
      `Failed to reset isolated sequence store at ${targetPath}: ${saveResult?.error || 'unknown error'}`
    );
  }
  return memoryStore;
}

// ── DISTRIBUTED SEQUENCE STATE & CONCURRENCY CONTROLS ────────────

function normalizeEmailInternal(raw) {
  if (!raw || typeof raw !== 'string') return '';
  const match = raw.match(/<([^>]+)>/);
  const email = match ? match[1] : raw;
  return email.trim().toLowerCase();
}

function cleanMessageIdInternal(id) {
  if (!id || typeof id !== 'string') return '';
  return id.replace(/[<>'"\s]/g, '');
}

/**
 * Retrieve durable recipient sequence state across distributed KV or local fallback
 */
export async function getRecipientSequenceStateDistributed(campaignId, recipientId) {
  if (!campaignId || !recipientId) return null;
  const isKvConfigured = getKvConfig().hasDistributedKV;
  const isKvRequired = isDistributedKvRequired();

  if (isKvConfigured || isKvRequired) {
    const key = getSequenceStorageKey(campaignId, recipientId);
    const raw = await execKVCommand('GET', `seq_state:${key}`);
    if (raw) {
      try {
        return typeof raw === 'string' ? JSON.parse(raw) : raw;
      } catch (e) {
        console.warn('[SequencePersistence] Error parsing distributed sequence state:', e.message);
        if (isKvRequired) {
          throw createPersistenceError('DISTRIBUTED_STATE_CORRUPT', `Failed to parse distributed sequence state for ${key}: ${e.message}`);
        }
      }
    }
    if (!isKvRequired) {
      return getRecipientSequenceState(campaignId, recipientId);
    }
    return null;
  }

  return getRecipientSequenceState(campaignId, recipientId);
}

/**
 * Save recipient sequence state to distributed KV with secondary index mappings
 */
export async function saveRecipientSequenceStateDistributed(campaignId, recipientId, state) {
  const isKvConfigured = getKvConfig().hasDistributedKV;
  const isKvRequired = isDistributedKvRequired();
  const key = getSequenceStorageKey(campaignId, recipientId);

  if (isKvConfigured || isKvRequired) {
    const stateJson = JSON.stringify(state);
    await execKVCommand('SET', `seq_state:${key}`, stateJson);

    // Maintain secondary indexes in Redis (atomic Redis Set SADD for email)
    if (state && state.recipient_email) {
      const emailRes = resolveCanonicalRecipientEmail(state.recipient_email);
      if (emailRes.valid) {
        await execKVCommand('SADD', `seq_idx:email:${emailRes.canonicalEmail}`, key);
      }
    }
    if (state && state.last_provider_message_id) {
      const cleanId = cleanMessageIdInternal(state.last_provider_message_id);
      if (cleanId) {
        await execKVCommand('SET', `seq_idx:msgid:${cleanId}`, key);
      }
    }
  }

  const localSaved = saveRecipientSequenceState(campaignId, recipientId, state);
  return localSaved;
}

/**
 * Idempotently reconcile secondary indexes for a recipient
 */
export async function reconcileSecondaryIndexesDistributed(campaignId, recipientId, state = null) {
  const isKvConfigured = getKvConfig().hasDistributedKV;
  const isKvRequired = isDistributedKvRequired();
  if (!isKvConfigured && !isKvRequired) {
    return { reconciled: false, reason: 'KV_NOT_CONFIGURED' };
  }

  const key = getSequenceStorageKey(campaignId, recipientId);
  let currentState = state;
  if (!currentState) {
    currentState = await getRecipientSequenceStateDistributed(campaignId, recipientId);
  }

  if (currentState) {
    if (currentState.recipient_email) {
      const emailRes = resolveCanonicalRecipientEmail(currentState.recipient_email);
      if (emailRes.valid) {
        await execKVCommand('SADD', `seq_idx:email:${emailRes.canonicalEmail}`, key);
      }
    }
    if (currentState.last_provider_message_id) {
      const cleanId = cleanMessageIdInternal(currentState.last_provider_message_id);
      if (cleanId) {
        await execKVCommand('SET', `seq_idx:msgid:${cleanId}`, key);
      }
    }
    return { reconciled: true, status: 'REPAIRED_ACTIVE', key };
  } else {
    // If state does not exist in distributed KV, prune index references
    if (recipientId && String(recipientId).includes('@')) {
      const normEmail = normalizeEmailInternal(recipientId);
      await execKVCommand('SREM', `seq_idx:email:${normEmail}`, key);
    }
    return { reconciled: true, status: 'PRUNED_ORPHAN', key };
  }
}

/**
 * Save durable dispatch intent in distributed KV and local store
 */
export async function saveDispatchIntentDistributed(idempotencyKey, intentRecord) {
  if (!idempotencyKey) return null;
  const isKvConfigured = getKvConfig().hasDistributedKV;
  const isKvRequired = isDistributedKvRequired();
  const record = {
    ...intentRecord,
    updatedAt: new Date().toISOString()
  };
  const json = JSON.stringify(record);

  if (isKvConfigured || isKvRequired) {
    await execKVCommand('SET', `seq_intent:${idempotencyKey}`, json, 'EX', '2592000');
  }

  // Also record in local store for inspection/fallback (never mask isolation contract errors)
  const contract = bindOrVerifyPersistenceContract();
  try {
    const store = loadStore();
    store.dispatchIntents = store.dispatchIntents || {};
    store.dispatchIntents[idempotencyKey] = record;
    const saveResult = saveStore(store);
    if (contract.isIsolated && (!saveResult || !saveResult.success) && process.env.SIMULATE_STORAGE_FAILURE !== '1') {
      throw createPersistenceError(
        saveResult?.code || 'ISOLATED_STORE_WRITE_FAILED',
        `Failed to persist dispatch intent in isolated store: ${saveResult?.error || 'unknown error'}`
      );
    }
  } catch (err) {
    if (contract.isIsolated || (err && typeof err.code === 'string' && err.code.includes('ISOLAT'))) {
      throw err;
    }
    if (isKvRequired) {
      throw err;
    }
  }

  return record;
}

/**
 * Retrieve durable dispatch intent
 */
export async function getDispatchIntentDistributed(idempotencyKey) {
  if (!idempotencyKey) return null;
  const isKvConfigured = getKvConfig().hasDistributedKV;
  const isKvRequired = isDistributedKvRequired();

  if (isKvConfigured || isKvRequired) {
    const raw = await execKVCommand('GET', `seq_intent:${idempotencyKey}`);
    if (raw) {
      try {
        return typeof raw === 'string' ? JSON.parse(raw) : raw;
      } catch (err) {
        if (isKvRequired) {
          throw createPersistenceError('DISTRIBUTED_INTENT_CORRUPT', `Failed to parse dispatch intent for ${idempotencyKey}: ${err.message}`);
        }
      }
    }
    if (!isKvRequired) {
      const store = loadStore();
      if (store.dispatchIntents && store.dispatchIntents[idempotencyKey]) {
        return store.dispatchIntents[idempotencyKey];
      }
    }
    return null;
  }

  const store = loadStore();
  if (store.dispatchIntents && store.dispatchIntents[idempotencyKey]) {
    return store.dispatchIntents[idempotencyKey];
  }
  return null;
}

/**
 * Update durable dispatch intent status with genuinely atomic CAS validation and terminal state protection.
 * Evaluates expectedStatus, terminal COMMITTED guard, and write atomically via Redis Lua.
 */
export async function updateDispatchIntentStatusDistributed(idempotencyKey, status, extra = {}) {
  if (!idempotencyKey || typeof idempotencyKey !== 'string') {
    return { updated: false, error: 'INVALID_IDEMPOTENCY_KEY' };
  }

  const expectedStatus = extra?.expectedStatus ? String(extra.expectedStatus).trim() : null;
  if (!expectedStatus) {
    return {
      updated: false,
      casFailed: true,
      error: 'EXPECTED_STATUS_REQUIRED',
      reason: `updateDispatchIntentStatusDistributed requires explicit non-empty expectedStatus for intent ${idempotencyKey}`
    };
  }

  const { expectedStatus: _omitted, ...cleanExtra } = extra;
  const nowIso = new Date().toISOString();
  const cleanExtraJson = JSON.stringify(cleanExtra);

  const isKvConfigured = getKvConfig().hasDistributedKV;
  const isKvRequired = isDistributedKvRequired();

  if (isKvConfigured || isKvRequired) {
    const key = `seq_intent:${idempotencyKey}`;
    // Atomic Redis Lua script:
    // Preconditions and terminal check evaluated before any write; TTL preserved exactly.
    const luaScript = `
      local raw = redis.call('get', KEYS[1])
      if not raw then
        return cjson.encode({ ok = false, error = 'INTENT_NOT_FOUND' })
      end
      local ok, data = pcall(cjson.decode, raw)
      if not ok or type(data) ~= 'table' then
        return cjson.encode({ ok = false, error = 'INTENT_CORRUPT' })
      end
      if data.status == 'COMMITTED' and ARGV[2] ~= 'COMMITTED' then
        return cjson.encode({ ok = false, error = 'TERMINAL_STATE_REACHED', currentStatus = data.status, attemptedStatus = ARGV[2] })
      end
      if ARGV[1] ~= '*' then
        local matched = false
        for exp in string.gmatch(ARGV[1], "([^,]+)") do
          local trimmedExp = exp:match("^%s*(.-)%s*$")
          if data.status == trimmedExp then
            matched = true
            break
          end
        end
        if not matched then
          return cjson.encode({ ok = false, error = 'CAS_MISMATCH', currentStatus = data.status, expectedStatus = ARGV[1], attemptedStatus = ARGV[2] })
        end
      end
      data.status = ARGV[2]
      data.updatedAt = ARGV[4]
      if ARGV[3] and ARGV[3] ~= '' and ARGV[3] ~= '{}' then
        local extraOk, extraData = pcall(cjson.decode, ARGV[3])
        if extraOk and type(extraData) == 'table' then
          for k, v in pairs(extraData) do
            data[k] = v
          end
        end
      end
      local updatedJson = cjson.encode(data)
      local currentTtl = redis.call('ttl', KEYS[1])
      if currentTtl and currentTtl > 0 then
        redis.call('set', KEYS[1], updatedJson, 'EX', currentTtl)
      else
        redis.call('set', KEYS[1], updatedJson, 'EX', ARGV[5])
      end
      return cjson.encode({ ok = true, result = data })
    `;

    try {
      const evalRes = await execKVCommand('EVAL', luaScript, '1', key, expectedStatus, status, cleanExtraJson, nowIso, '2592000');
      let parsedRes = null;
      if (typeof evalRes === 'string') {
        try { parsedRes = JSON.parse(evalRes); } catch {}
      } else if (evalRes && typeof evalRes === 'object') {
        parsedRes = evalRes;
      }

      if (parsedRes) {
        if (parsedRes.ok === true && parsedRes.result) {
          // Sync local / isolated store if active
          try {
            const store = loadStore();
            store.dispatchIntents = store.dispatchIntents || {};
            store.dispatchIntents[idempotencyKey] = parsedRes.result;
            saveStore(store);
          } catch {}
          return parsedRes.result;
        }
        return {
          updated: false,
          casFailed: parsedRes.error === 'CAS_MISMATCH',
          terminalStateReached: parsedRes.error === 'TERMINAL_STATE_REACHED',
          currentStatus: parsedRes.currentStatus || null,
          expectedStatus,
          attemptedStatus: status,
          error: parsedRes.error || 'CAS_OPERATION_FAILED',
          reason: `Atomic CAS rejected update for ${idempotencyKey}: ${parsedRes.error}`
        };
      }
    } catch (evalErr) {
      if (isKvRequired) {
        throw createPersistenceError('DISTRIBUTED_CAS_FAILED', `Atomic intent CAS failed: ${evalErr.message}`);
      }
    }
  }

  // Local / offline store fallback (strict non-bypassable in-process atomic checks)
  const store = loadStore();
  const existing = store.dispatchIntents && store.dispatchIntents[idempotencyKey];
  if (!existing) {
    return {
      updated: false,
      error: 'INTENT_NOT_FOUND',
      reason: `Intent ${idempotencyKey} does not exist in local store; cannot update`
    };
  }

  if (existing.status === 'COMMITTED' && status !== 'COMMITTED') {
    return {
      updated: false,
      terminalStateReached: true,
      currentStatus: existing.status,
      attemptedStatus: status,
      error: 'TERMINAL_STATE_REACHED',
      reason: `Cannot transition intent ${idempotencyKey} from terminal COMMITTED to ${status}`
    };
  }

  const allowedStatuses = expectedStatus.split(',').map(s => s.trim());
  if (expectedStatus !== '*' && !allowedStatuses.includes(existing.status)) {
    return {
      updated: false,
      casFailed: true,
      currentStatus: existing.status,
      expectedStatus,
      attemptedStatus: status,
      error: 'CAS_MISMATCH',
      reason: `Intent status ${existing.status} did not match expected status ${expectedStatus}`
    };
  }

  const updated = {
    ...existing,
    status,
    ...cleanExtra,
    updatedAt: nowIso
  };
  store.dispatchIntents[idempotencyKey] = updated;
  saveStore(store);
  return updated;
}

/**
 * Remove recipient sequence state and prune secondary indexes from distributed KV
 */
export async function removeRecipientSequenceStateDistributed(campaignId, recipientId, email = null) {
  const isKvConfigured = getKvConfig().hasDistributedKV;
  const isKvRequired = isDistributedKvRequired();
  const key = getSequenceStorageKey(campaignId, recipientId);
  const targetEmail = email || recipientId;
  const normEmail = normalizeEmailInternal(targetEmail);

  if (isKvConfigured || isKvRequired) {
    await execKVCommand('DEL', `seq_state:${key}`);
    if (normEmail) {
      await execKVCommand('SREM', `seq_idx:email:${normEmail}`, key);
    }
  }

  // Also remove from local store
  const store = loadStore();
  if (store.sequences && store.sequences[key]) {
    delete store.sequences[key];
    saveStore(store);
  }

  return { removed: true, campaignId, recipientId, email: normEmail };
}


/**
 * Atomic / token-conditional Compare-and-Delete for distributed KV keys.
 * Deletes key if and only if the current value matches expectedSerializedValue.
 * Supports server-side Lua EVAL for true atomicity.
 * If server-side Lua is unsupported or rejected, it fails closed by default
 * because a two-step GET + DEL is non-atomic and can clobber concurrent leases.
 */
export async function compareAndDeleteKV(key, expectedSerializedValue, options = {}) {
  if (!key || expectedSerializedValue === undefined || expectedSerializedValue === null) return false;
  const expectedStr = typeof expectedSerializedValue === 'string' ? expectedSerializedValue : JSON.stringify(expectedSerializedValue);

  // 1. Attempt atomic server-side Lua EVAL
  try {
    const luaScript = 'if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end';
    const evalRes = await execKVCommand('EVAL', luaScript, '1', key, expectedStr);
    if (evalRes === 1 || evalRes === '1') return true;
    if (evalRes === 0 || evalRes === '0') return false;
  } catch (evalErr) {
    // Lua EVAL rejected or unsupported by backend
  }

  // 2. Strict distributed safety check:
  // In distributed systems, a two-step GET followed by DEL is NOT atomic: between GET and DEL,
  // a concurrent worker could acquire a replacement lease and DEL would clobber it.
  // By default, if atomic EVAL is unavailable, fail closed to prevent silent lock deletion.
  if (options.allowUnsafeFallback === true) {
    const current = await execKVCommand('GET', key);
    const currentStr = typeof current === 'string' ? current : (current ? JSON.stringify(current) : null);
    if (currentStr && currentStr.trim() === expectedStr.trim()) {
      const delRes = await execKVCommand('DEL', key);
      return delRes === 1 || delRes === '1';
    }
  }

  // Fail closed: Atomic compare-and-delete cannot be guaranteed without server-side Lua support
  return false;
}

/**
 * Distributed Step Reservation via SET NX EX with lease and cancellation gates
 */
export async function reserveSequenceStepDistributed(campaignId, recipientId, sequenceId, stepNumber, workerId = 'worker-default', ttlSeconds = 300) {
  const isKvRequired = isDistributedKvRequired();
  const isKvConfigured = getKvConfig().hasDistributedKV;

  if (isKvRequired && !isKvConfigured) {
    return {
      reserved: false,
      blocked: true,
      reason: 'MISSING_DISTRIBUTED_KV_STORAGE: Distributed KV required in multi-instance or production mode but unconfigured'
    };
  }

  const idempotencyKey = generateStepIdempotencyKey(campaignId, recipientId, sequenceId, stepNumber);

  if (isKvConfigured || isKvRequired) {
    // 1. Check if already dispatched/sent in distributed KV
    const idemRaw = await execKVCommand('GET', `seq_idem:${idempotencyKey}`);
    if (idemRaw) {
      let existing = null;
      try { existing = typeof idemRaw === 'string' ? JSON.parse(idemRaw) : idemRaw; } catch {}
      return {
        reserved: false,
        alreadySent: true,
        reason: 'ALREADY_SENT',
        details: existing
      };
    }

    // 1b. Check durable dispatch intent (survives lease expiry, crash, or commit failure)
    const intent = await getDispatchIntentDistributed(idempotencyKey);
    if (intent) {
      if (intent.status === 'COMMITTED' || intent.status === 'RECONCILED_CONFIRMED_SENT') {
        return {
          reserved: false,
          alreadySent: true,
          reason: 'ALREADY_SENT',
          details: intent
        };
      }
      if (intent.status === 'PROVIDER_ACCEPTED' || intent.status === 'RECONCILIATION_HOLD' || intent.status === 'COMMIT_FAILED_HOLD') {
        return {
          reserved: false,
          blocked: true,
          reconciliationHold: true,
          reason: 'DISPATCH_INTENT_RECONCILIATION_HOLD: Prior dispatch for this step is frozen in reconciliation hold. Automatic retry blocked.',
          details: intent
        };
      }
      if (intent.status === 'DISPATCH_IN_FLIGHT') {
        return {
          reserved: false,
          blocked: true,
          inFlight: true,
          reason: 'DISPATCH_INTENT_IN_FLIGHT: Prior dispatch intent is in flight or pending reconciliation.',
          details: intent
        };
      }
    }

    // 2. Check distributed sequence state for cancellation / completion
    const state = await getRecipientSequenceStateDistributed(campaignId, recipientId);
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

    // 3. Attempt atomic reservation via SET NX EX
    const nowMs = Date.now();
    const expiresAt = nowMs + (ttlSeconds * 1000);
    const leaseToken = crypto.randomBytes(8).toString('hex');
    const reservationData = JSON.stringify({
      workerId,
      leaseToken,
      reservedAt: new Date(nowMs).toISOString(),
      expiresAt
    });

    const setResult = await execKVCommand('SET', `seq_res:${idempotencyKey}`, reservationData, 'EX', String(ttlSeconds), 'NX');

    if (setResult === 'OK') {
      reserveSequenceStep(campaignId, recipientId, sequenceId, stepNumber, workerId, ttlSeconds);
      return {
        reserved: true,
        idempotencyKey,
        workerId,
        leaseToken,
        expiresAt: new Date(expiresAt).toISOString(),
        storage: 'distributed_kv'
      };
    }

    // Reservation already exists in KV
    const existingRaw = await execKVCommand('GET', `seq_res:${idempotencyKey}`);
    let currentRes = null;
    try { currentRes = typeof existingRaw === 'string' ? JSON.parse(existingRaw) : existingRaw; } catch {}

    if (currentRes && currentRes.workerId === workerId && currentRes.expiresAt > nowMs) {
      return {
        reserved: true,
        idempotencyKey,
        workerId,
        leaseToken: currentRes.leaseToken || null,
        expiresAt: new Date(currentRes.expiresAt).toISOString(),
        storage: 'distributed_kv'
      };
    }

    if (currentRes && currentRes.expiresAt && currentRes.expiresAt <= nowMs) {
      // Stale lock detected: previous lease has expired. Clear and re-acquire conditionally.
      // Use compareAndDeleteKV to guarantee we only delete the lock if it STILL matches the expired payload,
      // preventing Worker A from wiping Worker B's newly acquired replacement lease.
      const lockCleared = await compareAndDeleteKV(`seq_res:${idempotencyKey}`, typeof existingRaw === 'string' ? existingRaw : JSON.stringify(existingRaw));
      if (lockCleared) {
        const retryResult = await execKVCommand('SET', `seq_res:${idempotencyKey}`, reservationData, 'EX', String(ttlSeconds), 'NX');
        if (retryResult === 'OK') {
          reserveSequenceStep(campaignId, recipientId, sequenceId, stepNumber, workerId, ttlSeconds);
          return {
            reserved: true,
            idempotencyKey,
            workerId,
            leaseToken,
            expiresAt: new Date(expiresAt).toISOString(),
            recoveredFromStaleLock: true,
            storage: 'distributed_kv'
          };
        }
      }
    }

    return {
      reserved: false,
      alreadyReserved: true,
      reason: 'ALREADY_RESERVED',
      workerId: currentRes?.workerId || 'unknown',
      expiresAt: currentRes?.expiresAt ? new Date(currentRes.expiresAt).toISOString() : null,
      storage: 'distributed_kv'
    };
  }

  if (isKvRequired) {
    return {
      reserved: false,
      blocked: true,
      reason: 'MISSING_DISTRIBUTED_KV_STORAGE: Distributed KV required but unavailable'
    };
  }

  return reserveSequenceStep(campaignId, recipientId, sequenceId, stepNumber, workerId, ttlSeconds);
}

/**
 * Release a reservation in distributed KV and local store
 */
export async function releaseReservationDistributed(idempotencyKey, workerId = null) {
  const isKvConfigured = getKvConfig().hasDistributedKV;
  const isKvRequired = isDistributedKvRequired();

  if (isKvConfigured || isKvRequired) {
    if (workerId) {
      const raw = await execKVCommand('GET', `seq_res:${idempotencyKey}`);
      let res = null;
      try { res = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch {}
      if (res && res.workerId !== workerId) {
        return false;
      }
      if (raw) {
        await compareAndDeleteKV(`seq_res:${idempotencyKey}`, typeof raw === 'string' ? raw : JSON.stringify(raw));
      }
    } else {
      await execKVCommand('DEL', `seq_res:${idempotencyKey}`);
    }
  }
  releaseReservation(idempotencyKey);
  return true;
}

/**
 * Commit a successful sequence step transmission in distributed KV and local store
 */
export async function commitSequenceStepDistributed(campaignId, recipientId, sequenceId, stepNumber, details = {}) {
  const idempotencyKey = generateStepIdempotencyKey(campaignId, recipientId, sequenceId, stepNumber);
  const now = new Date().toISOString();
  const isKvConfigured = getKvConfig().hasDistributedKV;
  const isKvRequired = isDistributedKvRequired();

  if (isKvRequired && !isKvConfigured) {
    return {
      committed: false,
      storageFailure: true,
      reason: 'MISSING_DISTRIBUTED_KV_STORAGE: Distributed KV required for commit but unconfigured'
    };
  }

  if (isKvConfigured || isKvRequired) {
    // Fencing check: verify worker lease ownership and lease token
    const resRaw = await execKVCommand('GET', `seq_res:${idempotencyKey}`);
    let currentRes = null;
    try { currentRes = typeof resRaw === 'string' ? JSON.parse(resRaw) : resRaw; } catch {}

    if (currentRes) {
      if (details.workerId && currentRes.workerId !== details.workerId) {
        return {
          committed: false,
          fencingViolation: true,
          reason: `FENCING_VIOLATION: Reservation held by ${currentRes.workerId}, not ${details.workerId}`,
          currentWorkerId: currentRes.workerId
        };
      }
      if (currentRes.leaseToken || details.leaseToken) {
        if (!details.leaseToken || !currentRes.leaseToken || String(details.leaseToken).trim() !== String(currentRes.leaseToken).trim()) {
          return {
            committed: false,
            fencingViolation: true,
            reason: `FENCING_VIOLATION: Lease token mismatch or missing. Reservation held token ${currentRes.leaseToken || 'none'}, incoming supplied ${details.leaseToken || 'none'}`,
            currentLeaseToken: currentRes.leaseToken || null,
            incomingLeaseToken: details.leaseToken || null
          };
        }
      }
      if (currentRes.expiresAt <= Date.now()) {
        return {
          committed: false,
          leaseExpired: true,
          reason: `LEASE_EXPIRED: Reservation expired at ${new Date(currentRes.expiresAt).toISOString()}`
        };
      }
    } else if (details.workerId || details.leaseToken) {
      const idemRaw = await execKVCommand('GET', `seq_idem:${idempotencyKey}`);
      if (idemRaw) {
        let idemParsed = null;
        try { idemParsed = typeof idemRaw === 'string' ? JSON.parse(idemRaw) : idemRaw; } catch {}

        if (!idemParsed || typeof idemParsed !== 'object') {
          return {
            committed: false,
            fatalConflict: true,
            storageCorrupt: true,
            error: 'STORED_IDEMPOTENCY_CORRUPT',
            reason: `FATAL_IDEMPOTENCY_CONFLICT: Stored idempotency record for ${idempotencyKey} is corrupt or unparseable. Fail-closed.`,
            idempotencyKey
          };
        }

        const replayValidation = validateIdempotencyReplay(idemParsed, details, idempotencyKey);
        if (!replayValidation.valid) {
          return {
            committed: false,
            fatalConflict: true,
            error: replayValidation.error,
            reason: replayValidation.reason,
            idempotencyKey,
            existing: replayValidation.existing,
            incoming: replayValidation.incoming
          };
        }

        return {
          committed: true,
          alreadyCommitted: true,
          idempotencyKey,
          details: idemParsed
        };
      }
      return {
        committed: false,
        leaseExpired: true,
        reason: 'LEASE_EXPIRED: Reservation expired or not found'
      };
    }

    // Idempotency check: if already committed
    const idemCheck = await execKVCommand('GET', `seq_idem:${idempotencyKey}`);
    if (idemCheck) {
      let parsed = null;
      try { parsed = typeof idemCheck === 'string' ? JSON.parse(idemCheck) : idemCheck; } catch {}

      if (!parsed || typeof parsed !== 'object') {
        return {
          committed: false,
          fatalConflict: true,
          storageCorrupt: true,
          error: 'STORED_IDEMPOTENCY_CORRUPT',
          reason: `FATAL_IDEMPOTENCY_CONFLICT: Stored idempotency record for ${idempotencyKey} is corrupt or unparseable. Fail-closed.`,
          idempotencyKey
        };
      }

      const replayValidation = validateIdempotencyReplay(parsed, details, idempotencyKey);
      if (!replayValidation.valid) {
        return {
          committed: false,
          fatalConflict: true,
          error: replayValidation.error,
          reason: replayValidation.reason,
          idempotencyKey,
          existing: replayValidation.existing,
          incoming: replayValidation.incoming
        };
      }

      return {
        committed: true,
        alreadyCommitted: true,
        idempotencyKey,
        details: parsed
      };
    }

    // Record commit in distributed KV
    const commitRecord = {
      campaignId,
      recipientId,
      sequenceId,
      stepNumber,
      step: `EMAIL_${stepNumber}`,
      dispatchedAt: now,
      providerMessageId: details.providerMessageId || null,
      payloadDigest: details.payloadDigest || null,
      sesMessageId: details.sesMessageId || null,
      workerId: details.workerId || null,
      leaseToken: details.leaseToken || null,
      status: 'SENT'
    };

    await execKVCommand('SET', `seq_idem:${idempotencyKey}`, JSON.stringify(commitRecord), 'EX', '2592000');
    if (resRaw) {
      await compareAndDeleteKV(`seq_res:${idempotencyKey}`, typeof resRaw === 'string' ? resRaw : JSON.stringify(resRaw)).catch(() => {});
    }

    // Update sequence state in distributed KV
    const existing = (await getRecipientSequenceStateDistributed(campaignId, recipientId)) || {};
    const sentSteps = new Set(existing.sent_steps || []);
    sentSteps.add(`EMAIL_${stepNumber}`);

    const isFinalStep = stepNumber >= 5;
    const nextStepNum = stepNumber + 1;
    const nextDue = isFinalStep ? null : new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();

    const updated = {
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
      recipient_email: (() => {
        const detRes = resolveCanonicalRecipientEmail(details);
        if (detRes.valid) return detRes.canonicalEmail;
        const existRes = resolveCanonicalRecipientEmail(existing);
        if (existRes.valid) return existRes.canonicalEmail;
        return null;
      })(),
      company_name: details.companyName || existing.company_name || '',
      contact_name: details.contactName || existing.contact_name || '',
      created_at: existing.created_at || now,
      updated_at: now
    };

    await saveRecipientSequenceStateDistributed(campaignId, recipientId, updated);
    commitSequenceStep(campaignId, recipientId, sequenceId, stepNumber, details);

    return {
      committed: true,
      ...updated
    };
  }

  if (isKvRequired) {
    return {
      committed: false,
      storageFailure: true,
      reason: 'MISSING_DISTRIBUTED_KV_STORAGE: Distributed KV required for commit but unavailable'
    };
  }

  return commitSequenceStep(campaignId, recipientId, sequenceId, stepNumber, details);
}

/**
 * Dedicated, concurrency-safe reconciliation commit transition (Phase 3D - DEFECT-3C-01)
 * Safely commits a confirmed transmission even after the original 300-second reservation lease has expired.
 * Requires trustworthy evidence (valid providerMessageId) and enforces an atomic reconciliation mutex.
 */
export async function commitReconciledSequenceStepDistributed(campaignId, recipientId, sequenceId, stepNumber, reconciliationDetails = {}) {
  const idempotencyKey = generateStepIdempotencyKey(campaignId, recipientId, sequenceId, stepNumber);
  const now = new Date().toISOString();
  const isKvConfigured = getKvConfig().hasDistributedKV;
  const isKvRequired = isDistributedKvRequired();

  if (isKvRequired && !isKvConfigured) {
    return {
      committed: false,
      storageFailure: true,
      reason: 'MISSING_DISTRIBUTED_KV_STORAGE: Distributed KV required for reconciliation commit but unconfigured'
    };
  }

  if (isKvConfigured || isKvRequired) {
    // 1. Idempotency check: if already committed, validate replay identity before returning
    const idemCheck = await execKVCommand('GET', `seq_idem:${idempotencyKey}`);
    if (idemCheck) {
      let parsed = null;
      try { parsed = typeof idemCheck === 'string' ? JSON.parse(idemCheck) : idemCheck; } catch {}
      if (!parsed || typeof parsed !== 'object') {
        return {
          committed: false,
          fatalConflict: true,
          storageCorrupt: true,
          error: 'STORED_IDEMPOTENCY_CORRUPT',
          reason: `FATAL_IDEMPOTENCY_CONFLICT: Stored idempotency record for ${idempotencyKey} is corrupt or unparseable. Fail-closed.`,
          idempotencyKey
        };
      }

      const replayValidation = validateIdempotencyReplay(parsed, reconciliationDetails, idempotencyKey);
      if (!replayValidation.valid) {
        return {
          committed: false,
          fatalConflict: true,
          error: replayValidation.error,
          reason: replayValidation.reason,
          idempotencyKey,
          existing: replayValidation.existing,
          incoming: replayValidation.incoming
        };
      }
      return {
        committed: true,
        alreadyCommitted: true,
        idempotencyKey,
        details: parsed
      };
    }

    // 2. Validate trustworthy evidence
    const { providerMessageId, sesMessageId, workerId, reconciledBy, evidenceSource, reconciliationNotes } = reconciliationDetails;
    if (!providerMessageId || typeof providerMessageId !== 'string' || providerMessageId.trim().length === 0) {
      return {
        committed: false,
        invalidEvidence: true,
        reason: 'TRUSTWORTHY_EVIDENCE_REQUIRED: Confirmed reconciliation requires non-empty providerMessageId'
      };
    }

    // 3. Acquire dedicated reconciliation distributed lock (NX EX 30)
    const reconcilerId = reconciledBy || workerId || `reconciler-${Date.now()}`;
    const recLockKey = `seq_rec_lock:${idempotencyKey}`;
    const lockAcquired = await execKVCommand('SET', recLockKey, reconcilerId, 'NX', 'EX', '30');
    if (lockAcquired !== 'OK') {
      return {
        committed: false,
        reconciliationLocked: true,
        reason: 'RECONCILIATION_IN_PROGRESS: Another reconciler holds the lock for this intent.'
      };
    }

    try {
      // 4. Record commit in distributed KV
      const commitRecord = {
        campaignId,
        recipientId,
        sequenceId,
        stepNumber,
        step: `EMAIL_${stepNumber}`,
        dispatchedAt: now,
        providerMessageId: providerMessageId.trim(),
        sesMessageId: sesMessageId || null,
        workerId: reconcilerId,
        status: 'SENT',
        reconciled: true,
        reconciledAt: now,
        evidenceSource: evidenceSource || 'provider_verification',
        reconciliationNotes: reconciliationNotes || ''
      };

      await execKVCommand('SET', `seq_idem:${idempotencyKey}`, JSON.stringify(commitRecord), 'EX', '2592000');

      // Fencing cleanup: replace unconditional DEL with compareAndDeleteKV using verified reservation identity.
      // If expectedReservation is not supplied, preserve seq_res without deleting to prevent deleting replacement reservations owned by other workers.
      const expectedRes = reconciliationDetails.expectedReservation || reconciliationDetails.reservationRaw || null;
      if (expectedRes) {
        const expectedResStr = typeof expectedRes === 'string' ? expectedRes : JSON.stringify(expectedRes);
        await compareAndDeleteKV(`seq_res:${idempotencyKey}`, expectedResStr).catch(() => {});
      }

      // 5. Update sequence state in distributed KV
      const existing = (await getRecipientSequenceStateDistributed(campaignId, recipientId)) || {};
      const sentSteps = new Set(existing.sent_steps || []);
      sentSteps.add(`EMAIL_${stepNumber}`);

      const isFinalStep = stepNumber >= 5;
      const nextStepNum = stepNumber + 1;
      const nextDue = isFinalStep ? null : new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();

      const updated = {
        ...existing,
        campaign_id: campaignId,
        recipient_id: recipientId,
        sequence_id: sequenceId,
        current_step: stepNumber,
        status: isFinalStep ? 'COMPLETED' : `EMAIL_${stepNumber}_SENT`,
        sent_steps: Array.from(sentSteps),
        next_step: isFinalStep ? 'NONE' : `EMAIL_${nextStepNum}`,
        next_due_at: nextDue,
        last_sent_at: existing.last_sent_at || now,
        last_provider_message_id: providerMessageId.trim(),
        recipient_email: (() => {
          const recRes = resolveCanonicalRecipientEmail(reconciliationDetails);
          if (recRes.valid) return recRes.canonicalEmail;
          const existRes = resolveCanonicalRecipientEmail(existing);
          if (existRes.valid) return existRes.canonicalEmail;
          return null;
        })(),
        company_name: existing.company_name || '',
        contact_name: existing.contact_name || '',
        haltReason: null,
        updated_at: now
      };

      await saveRecipientSequenceStateDistributed(campaignId, recipientId, updated);
      commitSequenceStep(campaignId, recipientId, sequenceId, stepNumber, commitRecord);

      return {
        committed: true,
        reconciled: true,
        idempotencyKey,
        ...updated
      };
    } finally {
      await execKVCommand('DEL', recLockKey).catch(() => {});
    }
  }

  if (isKvRequired) {
    return {
      committed: false,
      storageFailure: true,
      reason: 'MISSING_DISTRIBUTED_KV_STORAGE: Distributed KV required for reconciliation commit but unavailable'
    };
  }

  // Local fallback
  return commitSequenceStep(campaignId, recipientId, sequenceId, stepNumber, reconciliationDetails);
}

/**
 * Handle Inbound Reply Event in Distributed Store
 */
export async function recordReplyReceivedDistributed(campaignId, recipientId, replyData = {}) {
  const isKvConfigured = getKvConfig().hasDistributedKV;
  const isKvRequired = isDistributedKvRequired();
  const now = replyData.timestamp || new Date().toISOString();

  if (isKvRequired && !isKvConfigured) {
    throw new Error('MISSING_DISTRIBUTED_KV_STORAGE: Distributed KV required to record reply but unavailable');
  }

  if (isKvConfigured || isKvRequired) {
    let existing = await getRecipientSequenceStateDistributed(campaignId, recipientId);
    if (!existing) {
      existing = {
        campaign_id: campaignId,
        recipient_id: recipientId,
        sequence_id: replyData.sequenceId || 'SEQ-01',
        current_step: 1,
        sent_steps: ['EMAIL_1'],
        created_at: now
      };
    }

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

    await saveRecipientSequenceStateDistributed(campaignId, recipientId, existing);
    recordReplyReceived(campaignId, recipientId, replyData);
    return existing;
  }

  return recordReplyReceived(campaignId, recipientId, replyData);
}

/**
 * Handle Inbound Bounce in Distributed Store
 */
export async function recordBounceDistributed(campaignId, recipientId, bounceData = {}) {
  const isKvConfigured = getKvConfig().hasDistributedKV;
  const isKvRequired = isDistributedKvRequired();
  const now = bounceData.timestamp || new Date().toISOString();

  if (isKvRequired && !isKvConfigured) {
    throw new Error('MISSING_DISTRIBUTED_KV_STORAGE: Distributed KV required to record bounce but unavailable');
  }

  if (isKvConfigured || isKvRequired) {
    let existing = await getRecipientSequenceStateDistributed(campaignId, recipientId);
    if (!existing) {
      existing = {
        campaign_id: campaignId,
        recipient_id: recipientId,
        sequence_id: 'SEQ-01',
        created_at: now
      };
    }

    existing.status = 'BOUNCED';
    existing.followups_cancelled = true;
    existing.next_step = 'NONE';
    existing.next_due_at = null;
    existing.updated_at = now;
    existing.bounce_details = bounceData;

    await saveRecipientSequenceStateDistributed(campaignId, recipientId, existing);
    recordBounce(campaignId, recipientId, bounceData);
    return existing;
  }

  return recordBounce(campaignId, recipientId, bounceData);
}

/**
 * Handle Opt-Out / Unsubscribe in Distributed Store
 */
export async function recordOptOutDistributed(campaignId, recipientId, optOutData = {}) {
  const isKvConfigured = getKvConfig().hasDistributedKV;
  const isKvRequired = isDistributedKvRequired();
  const now = optOutData.timestamp || new Date().toISOString();

  if (isKvRequired && !isKvConfigured) {
    throw new Error('MISSING_DISTRIBUTED_KV_STORAGE: Distributed KV required to record opt-out but unavailable');
  }

  if (isKvConfigured || isKvRequired) {
    let existing = await getRecipientSequenceStateDistributed(campaignId, recipientId);
    if (!existing) {
      existing = {
        campaign_id: campaignId,
        recipient_id: recipientId,
        sequence_id: 'SEQ-01',
        created_at: now
      };
    }

    existing.status = 'UNSUBSCRIBED';
    existing.followups_cancelled = true;
    existing.next_step = 'NONE';
    existing.next_due_at = null;
    existing.updated_at = now;
    existing.opt_out_details = optOutData;

    await saveRecipientSequenceStateDistributed(campaignId, recipientId, existing);
    recordOptOut(campaignId, recipientId, optOutData);
    return existing;
  }

  return recordOptOut(campaignId, recipientId, optOutData);
}

/**
 * Find active recipient state across distributed KV indexes or local fallback
 */
export async function findSequenceByCriteriaDistributed(criteria = {}) {
  const isKvConfigured = getKvConfig().hasDistributedKV;
  const isKvRequired = isDistributedKvRequired();

  if (isKvRequired && !isKvConfigured) {
    throw new Error('MISSING_DISTRIBUTED_KV_STORAGE: Distributed KV required for criteria lookup but unavailable');
  }

  if (isKvConfigured || isKvRequired) {
    const { email, inReplyTo, references, campaignId } = criteria;

    // 1. Direct message ID lookup via index
    if (inReplyTo) {
      const cleanId = cleanMessageIdInternal(inReplyTo);
      const targetKey = await execKVCommand('GET', `seq_idx:msgid:${cleanId}`);
      if (targetKey) {
        const parsedKey = parseSequenceStorageKey(targetKey);
        if (parsedKey.valid) {
          const { campaignId: cId, recipientId: rId } = parsedKey;
          const state = await getRecipientSequenceStateDistributed(cId, rId);
          if (state) return { match: state, confidence: 'EXACT_MESSAGE_ID', ambiguous: false };
        }
      }
    }

    if (references) {
      const cleanRef = cleanMessageIdInternal(references);
      const targetKey = await execKVCommand('GET', `seq_idx:msgid:${cleanRef}`);
      if (targetKey) {
        const parsedKey = parseSequenceStorageKey(targetKey);
        if (parsedKey.valid) {
          const { campaignId: cId, recipientId: rId } = parsedKey;
          const state = await getRecipientSequenceStateDistributed(cId, rId);
          if (state) return { match: state, confidence: 'EXACT_REFERENCES', ambiguous: false };
        }
      }
    }

    // 2. Email lookup via index (atomic Redis Set with fallback to legacy JSON)
    if (email) {
      const normEmail = normalizeEmailInternal(email);
      if (normEmail) {
        let keyList = [];
        const smembersResult = await execKVCommand('SMEMBERS', `seq_idx:email:${normEmail}`);
        if (Array.isArray(smembersResult) && smembersResult.length > 0) {
          keyList = smembersResult;
        } else {
          const targetKeyRaw = await execKVCommand('GET', `seq_idx:email:${normEmail}`);
          if (targetKeyRaw) {
            try {
              const parsed = typeof targetKeyRaw === 'string' ? JSON.parse(targetKeyRaw) : targetKeyRaw;
              keyList = Array.isArray(parsed) ? parsed : [String(parsed)];
            } catch {
              keyList = [String(targetKeyRaw)];
            }
          }
        }

        const candidateStates = [];
        const deadKeys = [];
        for (const k of keyList) {
          const parsedKey = parseSequenceStorageKey(k);
          if (parsedKey.valid) {
            const { campaignId: cId, recipientId: rId } = parsedKey;
            if (campaignId && String(cId).trim() !== String(campaignId).trim()) {
              continue;
            }
            const st = await getRecipientSequenceStateDistributed(cId, rId);
            if (st) {
              candidateStates.push(st);
            } else {
              deadKeys.push(k);
            }
          } else {
            deadKeys.push(k);
          }
        }

        // Self-heal dangling / orphaned keys
        if (deadKeys.length > 0) {
          for (const deadK of deadKeys) {
            await execKVCommand('SREM', `seq_idx:email:${normEmail}`, deadK).catch(() => {});
          }
        }

        if (candidateStates.length === 1) {
          return { match: candidateStates[0], confidence: 'EXACT_EMAIL', ambiguous: false };
        } else if (candidateStates.length > 1) {
          const activeCandidates = candidateStates.filter(isSequenceActiveState);

          if (activeCandidates.length === 1) {
            return {
              match: activeCandidates[0],
              confidence: 'EXACT_EMAIL_ACTIVE',
              ambiguous: false,
              totalCandidates: candidateStates.length,
              resolvedFromActive: true
            };
          } else if (activeCandidates.length > 1) {
            return {
              match: null,
              matches: activeCandidates,
              confidence: 'AMBIGUOUS',
              ambiguous: true,
              reason: 'MULTIPLE_ACTIVE_CAMPAIGNS'
            };
          } else {
            return {
              match: null,
              matches: candidateStates,
              confidence: 'AMBIGUOUS',
              ambiguous: true,
              reason: 'MULTIPLE_TERMINAL_CAMPAIGNS'
            };
          }
        }
      }
    }

    // Fallback to local store search only if distributed KV is not strictly required
    if (isKvRequired) {
      return { match: null, ambiguous: false, reason: 'NOT_FOUND_IN_DISTRIBUTED_INDEX' };
    }
    return findSequenceByCriteria(criteria);
  }

  return findSequenceByCriteria(criteria);
}

