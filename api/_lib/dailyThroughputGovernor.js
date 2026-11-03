// ============================================================
// AVANI AGRO FOODS — Daily Throughput Governor & Pacing Engine
// api/_lib/dailyThroughputGovernor.js
// Phase 3N: Concurrency-Safe Daily Quota & Anti-Burst Pacing
//
// Safety Architecture:
// - Default daily pilot limit: 20 emails/day (conservative pilot cap)
// - Default pacing rate: 1 email/minute (anti-burst)
// - Fail-closed on invalid, non-numeric, zero, negative, or excessive config
// - Concurrency-safe atomic reservations
// - Durable persistence across process restarts
// - Excludes dry runs, test fixtures, blocked/unapproved attempts
// ============================================================

import crypto from 'crypto';
import {
  loadStore,
  saveStore,
  getKvConfig,
  execKVCommand,
  isProductionOrVercelRuntime
} from './sequencePersistence.js';

export const DEFAULT_DAILY_PILOT_LIMIT = 20;
export const DEFAULT_MAX_SENDS_PER_MINUTE = 1;
export const MAX_REASONABLE_PILOT_LIMIT = 20; // Hard pilot ceiling matching approved Policy O-01

/**
 * Validate daily limit configuration.
 * Fails closed if invalid, missing, zero, negative, non-numeric, fractional,
 * or exceeds the owner-approved pilot cap of 20 emails/day (Policy O-01).
 */
export function validateDailyLimitConfig(limitInput) {
  if (limitInput === undefined || limitInput === null || limitInput === '') {
    return { valid: true, limit: DEFAULT_DAILY_PILOT_LIMIT };
  }

  const num = Number(limitInput);
  if (!Number.isInteger(num) || isNaN(num)) {
    return { valid: false, error: 'DAILY_LIMIT_NON_NUMERIC', reason: 'Daily limit must be an integer' };
  }

  if (num <= 0) {
    return { valid: false, error: 'DAILY_LIMIT_NON_POSITIVE', reason: 'Daily limit must be greater than zero' };
  }

  if (num > DEFAULT_DAILY_PILOT_LIMIT) {
    return {
      valid: false,
      error: 'DAILY_LIMIT_EXCEEDS_PILOT_CAP',
      reason: `Daily limit of ${num} exceeds the approved owner pilot cap of ${DEFAULT_DAILY_PILOT_LIMIT} emails/day (Policy O-01). Higher limits are not authorized.`
    };
  }

  return { valid: true, limit: num };
}

/**
 * Validate per-minute pacing configuration.
 * Fails closed if invalid, missing, zero, negative, non-numeric, or exceeds the
 * owner-approved default of 1 send/minute.
 * Note: Anti-burst pacing is an independent owner decision (ratified default 1 email/min);
 * Owner Policy O-04 specifically governs ambiguous transmission outcomes and reconciliation hold.
 */
export function validatePacingConfig(pacingInput) {
  if (pacingInput === undefined || pacingInput === null || pacingInput === '') {
    return { valid: true, maxPerMinute: DEFAULT_MAX_SENDS_PER_MINUTE };
  }

  const num = Number(pacingInput);
  if (!Number.isInteger(num) || isNaN(num)) {
    return { valid: false, error: 'PACING_NON_NUMERIC', reason: 'Pacing rate must be an integer' };
  }

  if (num <= 0) {
    return { valid: false, error: 'PACING_NON_POSITIVE', reason: 'Pacing rate must be greater than zero' };
  }

  if (num > 60) {
    return { valid: false, error: 'PACING_EXCESSIVE', reason: 'Pacing rate exceeds safe ceiling of 60 sends/minute' };
  }

  // Owner Pacing Decision: The owner approved 1 email/minute default.
  // There is currently no separate owner approval for pacing above 1 email/minute.
  // Rates above 1 send/minute must fail closed. No blanket env or caller boolean override permitted.
  if (num > DEFAULT_MAX_SENDS_PER_MINUTE) {
    return {
      valid: false,
      error: 'PACING_RATE_UNAUTHORIZED',
      reason: `Pacing rate of ${num} sends/minute exceeds approved default of ${DEFAULT_MAX_SENDS_PER_MINUTE} send/minute. Rates above 1/minute require separate explicit owner approval.`
    };
  }

  return { valid: true, maxPerMinute: num };
}

/**
 * Format UTC Date Key (YYYY-MM-DD)
 */
export function getUtcDateKey(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toISOString().slice(0, 10);
}

/**
 * Request an atomic daily quota reservation and pacing check.
 * Concurrency-safe: inspects and commits atomically in store.
 */
export function reserveDailyThroughputSlot(options = {}) {
  const {
    now = new Date(),
    workerId = 'worker-1',
    isTestMode = false,
    trackTestQuota = false,
    customStore = null
  } = options;

  const configuredLimit = options.configuredLimit !== undefined
    ? options.configuredLimit
    : ((typeof process !== 'undefined' && process.env?.DAILY_PILOT_LIMIT !== undefined) ? process.env.DAILY_PILOT_LIMIT : DEFAULT_DAILY_PILOT_LIMIT);

  const configuredPacing = options.configuredPacing !== undefined
    ? options.configuredPacing
    : ((typeof process !== 'undefined' && process.env?.MAX_SENDS_PER_MINUTE !== undefined) ? process.env.MAX_SENDS_PER_MINUTE : DEFAULT_MAX_SENDS_PER_MINUTE);


  // 0. Production Runtime Guard: Local file-based governor forbidden in production
  if (isProductionOrVercelRuntime()) {
    return {
      allowed: false,
      blocked: true,
      error: 'PRODUCTION_LOCAL_GOVERNOR_FORBIDDEN',
      reason: 'Local file-based throughput governor must never execute in production runtime. Configure Upstash Redis.'
    };
  }

  // 1. Fail-closed configuration checks
  const limitCheck = validateDailyLimitConfig(configuredLimit);
  if (!limitCheck.valid) {
    return {
      allowed: false,
      blocked: true,
      error: 'CONFIG_FAIL_CLOSED',
      reason: `Fail-closed: Invalid daily limit config (${limitCheck.error}): ${limitCheck.reason}`
    };
  }

  const pacingCheck = validatePacingConfig(configuredPacing);
  if (!pacingCheck.valid) {
    return {
      allowed: false,
      blocked: true,
      error: 'CONFIG_FAIL_CLOSED',
      reason: `Fail-closed: Invalid pacing config (${pacingCheck.error}): ${pacingCheck.reason}`
    };
  }

  // In test mode without explicit quota tracking, allow simulation without consuming quota
  if (isTestMode && !trackTestQuota) {
    return {
      allowed: true,
      simulated: true,
      slot: 1,
      dailyLimit: limitCheck.limit,
      dateKey: getUtcDateKey(now)
    };
  }

  const store = customStore || loadStore();
  const dateKey = getUtcDateKey(now);
  const currentTimeMs = now instanceof Date ? now.getTime() : new Date(now).getTime();

  store.dailyThroughput = store.dailyThroughput || {};
  store.dailyThroughput[dateKey] = store.dailyThroughput[dateKey] || {
    count: 0,
    limit: limitCheck.limit,
    reservations: []
  };

  const dayData = store.dailyThroughput[dateKey];

  // 2. Daily Quota Check (Hard Pilot Cap)
  if (dayData.count >= limitCheck.limit) {
    return {
      allowed: false,
      blocked: true,
      quotaExceeded: true,
      dateKey,
      currentCount: dayData.count,
      dailyLimit: limitCheck.limit,
      reason: `Daily outreach limit reached (${dayData.count}/${limitCheck.limit}) for date ${dateKey}`
    };
  }

  // 3. Per-Minute Pacing Check (Anti-Burst)
  const minIntervalMs = Math.floor(60000 / pacingCheck.maxPerMinute);
  store.pacingLog = store.pacingLog || [];

  // Filter out timestamps older than 60 seconds
  store.pacingLog = store.pacingLog.filter(ts => (currentTimeMs - new Date(ts).getTime()) < 60000);

  if (store.pacingLog.length >= pacingCheck.maxPerMinute) {
    const oldestInWindow = new Date(store.pacingLog[0]).getTime();
    const waitRemainingMs = Math.max(0, 60000 - (currentTimeMs - oldestInWindow));
    return {
      allowed: false,
      paced: true,
      blocked: true,
      pacingExceeded: true,
      waitRemainingMs,
      maxPerMinute: pacingCheck.maxPerMinute,
      reason: `Pacing limit reached: maximum ${pacingCheck.maxPerMinute} email(s) per minute. Wait ${(waitRemainingMs / 1000).toFixed(1)}s.`
    };
  }

  // 4. Atomic Reservation
  const localNonce = crypto.randomBytes(8).toString('hex');
  const reservationId = `RES-${dateKey}-${dayData.count + 1}-${localNonce}`;
  dayData.count += 1;
  dayData.limit = limitCheck.limit;
  dayData.reservations.push({
    reservationId,
    workerId,
    nonce: localNonce,
    status: 'RESERVED',
    timestamp: now.toISOString ? now.toISOString() : new Date(now).toISOString()
  });

  store.pacingLog.push(now.toISOString ? now.toISOString() : new Date(now).toISOString());

  if (!customStore) {
    saveStore(store);
  }

  return {
    allowed: true,
    reservationId,
    dateKey,
    slot: dayData.count,
    nonce: localNonce,
    dailyLimit: limitCheck.limit,
    currentCount: dayData.count
  };
}

/**
 * Release an unused reservation slot if an error occurs before transmission.
 * Resilient: accepts (dateKey, reservationId) or (reservationId) directly.
 */
export function releaseDailyThroughputSlot(dateKey, reservationId, options = {}) {
  let resolvedDateKey = dateKey;
  let resolvedReservationId = reservationId;
  let resolvedOpts = options;

  // Handle single-argument or (reservationId, options) call
  if (typeof dateKey === 'string' && dateKey.startsWith('RES-')) {
    resolvedReservationId = dateKey;
    const parts = dateKey.split('-');
    resolvedDateKey = parts.slice(1, 4).join('-');
    if (typeof reservationId === 'object' && reservationId !== null) {
      resolvedOpts = reservationId;
    }
  } else if (typeof dateKey === 'object' && dateKey !== null) {
    resolvedDateKey = dateKey.dateKey;
    resolvedReservationId = dateKey.reservationId;
    resolvedOpts = reservationId || {};
  }

  // Production runtime guard: local file-based governor release forbidden in production
  if (isProductionOrVercelRuntime()) {
    console.error('[DAILY_GOVERNOR_PRODUCTION_FORBIDDEN]', {
      action: 'releaseDailyThroughputSlot',
      dateKey: resolvedDateKey,
      reservationId: resolvedReservationId,
      error: 'PRODUCTION_LOCAL_GOVERNOR_FORBIDDEN'
    });
    return false;
  }

  // Strict ownership fencing: workerId and nonce must be supplied
  if (!resolvedOpts.workerId || !resolvedOpts.nonce) {
    return false;
  }

  const store = resolvedOpts.customStore || loadStore();
  if (!store.dailyThroughput || !store.dailyThroughput[resolvedDateKey]) {
    return false;
  }

  const dayData = store.dailyThroughput[resolvedDateKey];
  if (!Array.isArray(dayData.reservations)) {
    return false;
  }

  const idx = dayData.reservations.findIndex(r => r.reservationId === resolvedReservationId);
  if (idx === -1) {
    return false;
  }

  const targetRes = dayData.reservations[idx];
  if (!targetRes || targetRes.status !== 'RESERVED') {
    return false;
  }

  if (!targetRes.workerId || targetRes.workerId !== resolvedOpts.workerId) {
    return false;
  }

  if (!targetRes.nonce || targetRes.nonce !== resolvedOpts.nonce) {
    return false;
  }

  // Pre-validate counter and active-reservation consistency before mutation
  if (!Number.isInteger(dayData.count) || dayData.count <= 0) {
    console.error('[DAILY_GOVERNOR_CORRUPT_COUNTER]', {
      dateKey: resolvedDateKey,
      reservationId: resolvedReservationId,
      currentCount: dayData.count,
      activeReservations: dayData.reservations.length,
      error: 'COUNTER_CORRUPTION_DETECTED'
    });
    return false;
  }

  dayData.reservations.splice(idx, 1);
  dayData.count = dayData.count - 1;
  if (!resolvedOpts.customStore) {
    try {
      const saveRes = saveStore(store);
      if (saveRes && saveRes.success === false) {
        console.error('[DAILY_GOVERNOR_SAVE_FAILED]', {
          dateKey: resolvedDateKey,
          reservationId: resolvedReservationId,
          error: saveRes.error
        });
        // Rollback memory mutation on save failure
        dayData.reservations.splice(idx, 0, targetRes);
        dayData.count = dayData.count + 1;
        return false;
      }
    } catch (saveErr) {
      console.error('[DAILY_GOVERNOR_SAVE_FAILED]', {
        dateKey: resolvedDateKey,
        reservationId: resolvedReservationId,
        error: saveErr?.message || String(saveErr)
      });
      // Rollback memory mutation on save exception
      dayData.reservations.splice(idx, 0, targetRes);
      dayData.count = dayData.count + 1;
      return false;
    }
  }
  return true;
}

/**
 * Request an atomic daily quota reservation and pacing check in distributed KV.
 * Uses atomic Redis INCR with daily TTL and anti-burst pacing tracking.
 * Fails closed if strict mode is active and KV is unavailable.
 */
export async function reserveDailyThroughputSlotDistributed(options = {}) {
  const {
    now = new Date(),
    workerId = 'worker-1',
    isTestMode = false,
    trackTestQuota = false,
    customStore = null
  } = options;

  const configuredLimit = options.configuredLimit !== undefined
    ? options.configuredLimit
    : ((typeof process !== 'undefined' && process.env?.DAILY_PILOT_LIMIT !== undefined) ? process.env.DAILY_PILOT_LIMIT : DEFAULT_DAILY_PILOT_LIMIT);

  const configuredPacing = options.configuredPacing !== undefined
    ? options.configuredPacing
    : ((typeof process !== 'undefined' && process.env?.MAX_SENDS_PER_MINUTE !== undefined) ? process.env.MAX_SENDS_PER_MINUTE : DEFAULT_MAX_SENDS_PER_MINUTE);

  // 1. Fail-closed configuration checks
  const limitCheck = validateDailyLimitConfig(configuredLimit);
  if (!limitCheck.valid) {
    return {
      allowed: false,
      blocked: true,
      error: 'CONFIG_FAIL_CLOSED',
      reason: `Fail-closed: Invalid daily limit config (${limitCheck.error}): ${limitCheck.reason}`
    };
  }

  const pacingCheck = validatePacingConfig(configuredPacing);
  if (!pacingCheck.valid) {
    return {
      allowed: false,
      blocked: true,
      error: 'CONFIG_FAIL_CLOSED',
      reason: `Fail-closed: Invalid pacing config (${pacingCheck.error}): ${pacingCheck.reason}`
    };
  }

  const isKvConfigured = getKvConfig().hasDistributedKV;
  const isProductionRuntime = isProductionOrVercelRuntime();

  // Production Guard: Test mode simulation strictly forbidden in production runtime
  if (isProductionRuntime && isTestMode) {
    return {
      allowed: false,
      blocked: true,
      error: 'PRODUCTION_TEST_MODE_FORBIDDEN',
      reason: 'Test mode simulation is strictly forbidden in production or Vercel runtime environments.'
    };
  }

  if (!isKvConfigured && (process.env.REQUIRE_DISTRIBUTED_KV === '1' || process.env.STRICT_KV_ENFORCEMENT === '1' || isProductionRuntime)) {
    return {
      allowed: false,
      blocked: true,
      reason: 'MISSING_DISTRIBUTED_KV_STORAGE: Distributed KV required in multi-instance or production mode but unconfigured'
    };
  }

  if (isTestMode && !trackTestQuota) {
    return {
      allowed: true,
      simulated: true,
      slot: 1,
      dailyLimit: limitCheck.limit,
      dateKey: getUtcDateKey(now)
    };
  }

  // If KV is not configured and strict mode is off, fall back to local store
  if (!isKvConfigured) {
    return reserveDailyThroughputSlot(options);
  }

  const dateKey = getUtcDateKey(now);
  const nowIso = now instanceof Date ? now.toISOString() : new Date(now).toISOString();
  const currentTimeMs = now instanceof Date ? now.getTime() : new Date(now).getTime();
  const quotaKey = `quota:daily:${dateKey}`;

  // 1b. Fast Advisory Quota Pre-check (read-only, zero side-effects)
  const preCheckRaw = await execKVCommand('GET', quotaKey);
  if (preCheckRaw !== null && preCheckRaw !== undefined) {
    const preCheckVal = parseInt(String(preCheckRaw), 10);
    if (!isNaN(preCheckVal) && preCheckVal >= limitCheck.limit) {
      return {
        allowed: false,
        blocked: true,
        quotaExceeded: true,
        dateKey,
        currentCount: preCheckVal,
        dailyLimit: limitCheck.limit,
        reason: `Daily outreach limit reached (${preCheckVal}/${limitCheck.limit}) for date ${dateKey}`
      };
    }
  }

  // 2. Pre-Check & Acquire Anti-Burst Pacing Lock BEFORE Modifying Daily Quota Counter
  // This eliminates crash-induced quota burns caused by acquiring quota then aborting on pacing.
  const tempReservationNonce = crypto.randomBytes(8).toString('hex');
  const pacingLockKey = 'quota:pacing:active';
  const pacingLogKey = 'quota:pacing:log';

  // Read existing pacing log for compatibility and reset detection
  const rawPacing = await execKVCommand('GET', pacingLogKey);
  let pacingTimestamps = [];
  if (rawPacing) {
    try {
      const parsed = typeof rawPacing === 'string' ? JSON.parse(rawPacing) : rawPacing;
      if (Array.isArray(parsed)) pacingTimestamps = parsed;
    } catch {}
  } else {
    // If pacing log was deleted/absent, any previous active lock is cleared
    await execKVCommand('DEL', pacingLockKey).catch(() => {});
  }

  const validPacing = pacingTimestamps.filter(ts => (currentTimeMs - new Date(ts).getTime()) < 60000);

  let pacingLockAcquired = false;
  const pacingWindowSec = 60;
  const lockPayload = JSON.stringify({
    reservationId: `RES-${dateKey}-PENDING-${tempReservationNonce}`,
    workerId,
    acquiredAt: currentTimeMs,
    expiresAt: currentTimeMs + (pacingWindowSec * 1000),
    pacingWindowSec
  });

  if (pacingCheck.maxPerMinute === 1) {
    // Strict Anti-Burst Pacing (1 send/min): Atomic Ownership-Aware Lock
    const lockResult = await execKVCommand('SET', pacingLockKey, lockPayload, 'NX', 'EX', String(pacingWindowSec));

    if (lockResult !== 'OK') {
      const rawLock = await execKVCommand('GET', pacingLockKey);
      let existingLock = null;
      if (rawLock) {
        try {
          existingLock = typeof rawLock === 'string' ? JSON.parse(rawLock) : rawLock;
        } catch {}
      }

      const isStale = (
        !rawLock ||
        !existingLock ||
        typeof existingLock.acquiredAt !== 'number' ||
        currentTimeMs >= (existingLock.expiresAt || (existingLock.acquiredAt + pacingWindowSec * 1000)) ||
        (currentTimeMs - existingLock.acquiredAt >= pacingWindowSec * 1000)
      );

      if (isStale) {
        await execKVCommand('SET', pacingLockKey, lockPayload, 'EX', String(pacingWindowSec));
        pacingLockAcquired = true;
      } else {
        // Paced! Quota counter has NOT been touched, preventing any quota leaks
        const waitRemainingMs = Math.max(0, (existingLock.expiresAt || (existingLock.acquiredAt + pacingWindowSec * 1000)) - currentTimeMs);
        return {
          allowed: false,
          paced: true,
          blocked: true,
          pacingExceeded: true,
          waitRemainingMs,
          maxPerMinute: pacingCheck.maxPerMinute,
          heldBy: existingLock.workerId || 'unknown',
          reason: `Pacing limit reached: maximum ${pacingCheck.maxPerMinute} email(s) per minute. Wait ${(waitRemainingMs / 1000).toFixed(1)}s.`
        };
      }
    } else {
      pacingLockAcquired = true;
    }

    validPacing.push(nowIso);
    await execKVCommand('SET', pacingLogKey, JSON.stringify(validPacing), 'EX', '120');
  } else {
    // Multiple sends allowed per minute (maxPerMinute > 1)
    if (validPacing.length >= pacingCheck.maxPerMinute) {
      const oldest = new Date(validPacing[0]).getTime();
      const waitRemainingMs = Math.max(0, 60000 - (currentTimeMs - oldest));
      return {
        allowed: false,
        paced: true,
        blocked: true,
        pacingExceeded: true,
        waitRemainingMs,
        maxPerMinute: pacingCheck.maxPerMinute,
        reason: `Pacing limit reached: maximum ${pacingCheck.maxPerMinute} email(s) per minute. Wait ${(waitRemainingMs / 1000).toFixed(1)}s.`
      };
    }
    validPacing.push(nowIso);
    await execKVCommand('SET', pacingLogKey, JSON.stringify(validPacing), 'EX', '120');
  }

  // 3. Atomic Daily Quota Increment via Redis INCR
  const currentCount = await execKVCommand('INCR', quotaKey);

  if (currentCount === 1) {
    // 48-hour expiration on new date key (aligned with reservation TTL)
    await execKVCommand('EXPIRE', quotaKey, '172800');
  }

  const reservationId = `RES-${dateKey}-${currentCount}-${tempReservationNonce}`;

  if (currentCount > limitCheck.limit) {
    // Quota ceiling exceeded! Roll back the increment atomically and release pacing lock
    await execKVCommand('DECR', quotaKey);
    if (pacingLockAcquired) {
      await execKVCommand('DEL', pacingLockKey).catch(() => {});
    }
    return {
      allowed: false,
      blocked: true,
      quotaExceeded: true,
      dateKey,
      currentCount: currentCount - 1,
      dailyLimit: limitCheck.limit,
      reason: `Daily outreach limit reached (${currentCount - 1}/${limitCheck.limit}) for date ${dateKey}`
    };
  }

  // If pacing lock was acquired, update its payload with the final reservationId
  if (pacingLockAcquired) {
    const finalLockPayload = JSON.stringify({
      reservationId,
      workerId,
      acquiredAt: currentTimeMs,
      expiresAt: currentTimeMs + (pacingWindowSec * 1000),
      pacingWindowSec
    });
    await execKVCommand('SET', pacingLockKey, finalLockPayload, 'EX', String(pacingWindowSec)).catch(() => {});
  }

  // 4. Create and store unique scoped reservation record with ALIGNED 48-hour TTL (172800s)
  // Fixes BLK-02: ensures delayed operator/cron reconciliation within 48h finds the reservation key
  const reservationKey = `quota:res:${reservationId}`;
  const resRecord = JSON.stringify({
    reservationId,
    workerId,
    nonce: tempReservationNonce,
    dateKey,
    slot: currentCount,
    timestamp: nowIso,
    status: 'RESERVED'
  });

  try {
    const setRes = await execKVCommand('SET', reservationKey, resRecord, 'EX', '172800');
    if (setRes !== 'OK' && setRes !== true && setRes !== 1) {
      throw new Error(`Reservation write returned unexpected response: ${JSON.stringify(setRes)}`);
    }
  } catch (setErr) {
    // Immediate local compensation: if reservation write fails or times out, decrement quota and release pacing lock
    await execKVCommand('DECR', quotaKey).catch(() => {});
    if (pacingLockAcquired) {
      await execKVCommand('DEL', pacingLockKey).catch(() => {});
    }
    return {
      allowed: false,
      blocked: true,
      error: 'RESERVATION_WRITE_FAILED',
      reason: `Failed to persist reservation record: ${setErr.message}. Quota slot safely compensated via DECR.`
    };
  }

  // Also sync the exact reservation record in local/custom store for inspection
  try {
    const store = customStore || loadStore();
    store.dailyThroughput = store.dailyThroughput || {};
    store.dailyThroughput[dateKey] = store.dailyThroughput[dateKey] || {
      count: 0,
      limit: limitCheck.limit,
      reservations: []
    };
    const dayData = store.dailyThroughput[dateKey];
    dayData.count = currentCount;
    dayData.limit = limitCheck.limit;
    if (!dayData.reservations.some(r => r.reservationId === reservationId)) {
      dayData.reservations.push({
        reservationId,
        workerId,
        nonce: tempReservationNonce,
        status: 'RESERVED',
        timestamp: nowIso
      });
    }
    store.pacingLog = store.pacingLog || [];
    store.pacingLog.push(nowIso);
    if (!customStore) {
      saveStore(store);
    }
  } catch {}

  return {
    allowed: true,
    reservationId,
    dateKey,
    slot: currentCount,
    nonce: tempReservationNonce,
    dailyLimit: limitCheck.limit,
    currentCount,
    storage: 'distributed_kv'
  };
}


/**
 * Release ownership-aware distributed pacing lock if held by this reservation
 */
export async function releasePacingLockDistributed(reservationId, workerId = null) {
  if (!reservationId) return false;
  const isKvConfigured = getKvConfig().hasDistributedKV;
  if (!isKvConfigured && process.env.REQUIRE_DISTRIBUTED_KV !== '1') return false;

  const pacingKey = 'quota:pacing:active';
  const raw = await execKVCommand('GET', pacingKey);
  if (!raw) return false;

  let currentLock = null;
  try {
    currentLock = typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {}

  if (currentLock && currentLock.reservationId === reservationId) {
    if (!workerId || currentLock.workerId === workerId) {
      await execKVCommand('DEL', pacingKey);
      return true;
    }
  }
  return false;
}

/**
 * Release an unused reservation slot in distributed KV and local store.
 * Atomic and idempotent: uses atomic server-side Lua script to verify status == 'RESERVED',
 * workerId ownership, and cryptographic nonce match before deleting reservation and decrementing quota.
 * Fails closed if workerId or nonce are omitted.
 */
export async function releaseDailyThroughputSlotDistributed(dateKey, reservationId, options = {}) {
  let resolvedDateKey = dateKey;
  let resolvedReservationId = reservationId;
  let resolvedOpts = options;

  if (typeof dateKey === 'string' && dateKey.startsWith('RES-')) {
    resolvedReservationId = dateKey;
    const parts = dateKey.split('-');
    resolvedDateKey = parts.slice(1, 4).join('-');
    if (typeof reservationId === 'object' && reservationId !== null) {
      resolvedOpts = reservationId;
    }
  } else if (typeof dateKey === 'object' && dateKey !== null) {
    resolvedDateKey = dateKey.dateKey;
    resolvedReservationId = dateKey.reservationId;
    resolvedOpts = reservationId || {};
  }

  if (!resolvedReservationId || !resolvedDateKey) {
    return false;
  }

  // Strict fencing: workerId and nonce are mandatory to prevent accidental or unauthorized cancellation
  if (!resolvedOpts.workerId || !resolvedOpts.nonce) {
    return false;
  }

  const isKvConfigured = getKvConfig().hasDistributedKV;

  if (isKvConfigured || process.env.REQUIRE_DISTRIBUTED_KV === '1') {
    const reservationKey = `quota:res:${resolvedReservationId}`;
    const quotaKey = `quota:daily:${resolvedDateKey}`;

    // Policy O-03: Quota restoration permitted ONLY for proven local pre-flight cancellation before latch and before network transmission.
    // Atomic server-side Lua script pre-validates reservation status ('RESERVED'), workerId == ARGV[1], nonce == ARGV[2],
    // and verifies quota key existence, non-null, integer type, and positive value BEFORE any mutations to prevent partial mutation failures.
    const luaScript = `
      local raw = redis.call('get', KEYS[1])
      if not raw then return 0 end
      local ok, res = pcall(cjson.decode, raw)
      if not ok or not res or res.status ~= 'RESERVED' then return -1 end
      if not res.workerId or res.workerId ~= ARGV[1] then return -2 end
      if not res.nonce or res.nonce ~= ARGV[2] then return -3 end

      local quotaRaw = redis.call('get', KEYS[2])
      if not quotaRaw then
        -- Missing quota counter: cannot safely release without ledger counter
        return -5
      end

      local num = tonumber(quotaRaw)
      if not num or math.floor(num) ~= num then
        -- Non-numeric or fractional counter
        return -4
      end

      if num <= 0 then
        -- Counter zero or negative while reservation exists indicates ledger corruption
        return -6
      end

      redis.call('del', KEYS[1])
      redis.call('decr', KEYS[2])
      return 1
    `;

    try {
      const evalRes = await execKVCommand('EVAL', luaScript, '2', reservationKey, quotaKey, resolvedOpts.workerId, resolvedOpts.nonce);
      if (evalRes === 1 || evalRes === '1') {
        // Ownership-aware release of pacing lock if held by this reservation
        await releasePacingLockDistributed(resolvedReservationId, resolvedOpts.workerId).catch(() => {});
        // Also sync local store
        releaseDailyThroughputSlot(resolvedDateKey, resolvedReservationId, resolvedOpts);
        return true;
      }
      return false;
    } catch (evalErr) {
      // If Lua EVAL fails or is rejected, fail closed to prevent non-atomic or unfenced release
      return false;
    }
  }

  if (isProductionOrVercelRuntime() || process.env.REQUIRE_DISTRIBUTED_KV === '1') {
    return false;
  }

  return releaseDailyThroughputSlot(resolvedDateKey, resolvedReservationId, resolvedOpts);
}

/**
 * Atomically latch a daily throughput reservation into DISPATCH_IN_FLIGHT status.
 * Prevents subsequent pre-flight cancellation from releasing quota once dispatch begins.
 */
export async function latchReservationInFlightDistributed(reservationId, workerId, nonce, options = {}) {
  if (!reservationId || !workerId || !nonce) {
    return false;
  }

  const isKvConfigured = getKvConfig().hasDistributedKV;

  if (isKvConfigured || process.env.REQUIRE_DISTRIBUTED_KV === '1') {
    const reservationKey = `quota:res:${reservationId}`;
    const nowIso = new Date().toISOString();

    const luaScript = `
      local raw = redis.call('get', KEYS[1])
      if not raw then return 0 end
      local ok, res = pcall(cjson.decode, raw)
      if not ok or not res or res.status ~= 'RESERVED' then return -1 end
      if not res.workerId or res.workerId ~= ARGV[1] then return -2 end
      if not res.nonce or res.nonce ~= ARGV[2] then return -3 end
      res.status = 'DISPATCH_IN_FLIGHT'
      res.latchedAt = ARGV[3]
      local ttl = redis.call('ttl', KEYS[1])
      if ttl > 0 then
        redis.call('set', KEYS[1], cjson.encode(res), 'ex', ttl)
      else
        redis.call('set', KEYS[1], cjson.encode(res), 'ex', 172800)
      end
      return 1
    `;

    try {
      const evalRes = await execKVCommand('EVAL', luaScript, '1', reservationKey, workerId, nonce, nowIso);
      if (evalRes === 1 || evalRes === '1') {
        // Also sync local store
        try {
          const parts = reservationId.split('-');
          const dateKey = parts.slice(1, 4).join('-');
          const store = options.customStore || loadStore();
          if (store.dailyThroughput && store.dailyThroughput[dateKey]) {
            const res = store.dailyThroughput[dateKey].reservations?.find(r => r.reservationId === reservationId);
            if (res) {
              res.status = 'DISPATCH_IN_FLIGHT';
              res.latchedAt = nowIso;
              if (!options.customStore) saveStore(store);
            }
          }
        } catch {}
        return true;
      }
      return false;
    } catch (evalErr) {
      return false;
    }
  }

  // Local fallback
  try {
    const parts = reservationId.split('-');
    const dateKey = parts.slice(1, 4).join('-');
    const store = options.customStore || loadStore();
    if (store.dailyThroughput && store.dailyThroughput[dateKey]) {
      const res = store.dailyThroughput[dateKey].reservations?.find(r => r.reservationId === reservationId);
      if (res && res.status === 'RESERVED' && res.workerId === workerId && res.nonce === nonce) {
        res.status = 'DISPATCH_IN_FLIGHT';
        res.latchedAt = new Date().toISOString();
        if (!options.customStore) saveStore(store);
        return true;
      }
    }
  } catch {}
  return false;
}


/**
 * Query current daily utilization.
 */
export function getDailyThroughputStatus(date = new Date(), options = {}) {
  const store = options.customStore || loadStore();
  const dateKey = getUtcDateKey(date);
  const dayData = (store.dailyThroughput && store.dailyThroughput[dateKey]) || { count: 0, limit: DEFAULT_DAILY_PILOT_LIMIT };
  return {
    dateKey,
    count: dayData.count,
    limit: dayData.limit || DEFAULT_DAILY_PILOT_LIMIT,
    remaining: Math.max(0, (dayData.limit || DEFAULT_DAILY_PILOT_LIMIT) - dayData.count)
  };
}

/**
 * Report-only daily quota reconciler.
 * Owner Policy O-05: Reconciler is strictly report-only with zero state-write authority.
 * INCR, DECR, SET, and DEL are strictly prohibited. Emits audit telemetry and drift metrics only.
 */
export async function reconcileDailyQuotaDistributed(dateKey, activeReservationCount = null) {
  if (!dateKey) return { reconciled: false, reason: 'MISSING_DATE_KEY', writeAuthority: 'ZERO_WRITE_REPORT_ONLY', observationOnly: true };
  const isKvConfigured = getKvConfig().hasDistributedKV;
  if (!isKvConfigured && process.env.REQUIRE_DISTRIBUTED_KV !== '1') {
    return { reconciled: false, reason: 'KV_NOT_CONFIGURED', writeAuthority: 'ZERO_WRITE_REPORT_ONLY', observationOnly: true };
  }

  const quotaKey = `quota:daily:${dateKey}`;
  const rawCurrent = await execKVCommand('GET', quotaKey);
  const currentCount = rawCurrent !== null && rawCurrent !== undefined ? parseInt(rawCurrent, 10) : 0;

  if (activeReservationCount !== null && activeReservationCount !== undefined) {
    const target = Math.max(0, parseInt(activeReservationCount, 10));
    const drift = currentCount - target;
    if (drift !== 0) {
      return {
        reconciled: false,
        observationOnly: true,
        driftDetected: true,
        currentCount,
        targetCount: target,
        drift,
        writeAuthority: 'ZERO_WRITE_REPORT_ONLY',
        note: 'Audit drift detected. State-modifying operations (DECR/SET) prohibited under Owner Policy O-05.'
      };
    }
    return {
      reconciled: true,
      observationOnly: true,
      driftDetected: false,
      currentCount,
      targetCount: target,
      drift: 0,
      writeAuthority: 'ZERO_WRITE_REPORT_ONLY',
      status: 'IN_SYNC'
    };
  }

  return {
    reconciled: true,
    observationOnly: true,
    driftDetected: false,
    currentCount,
    writeAuthority: 'ZERO_WRITE_REPORT_ONLY',
    status: 'OBSERVED'
  };
}

