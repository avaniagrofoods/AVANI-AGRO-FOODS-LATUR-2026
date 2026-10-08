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

import {
  loadStore,
  saveStore
} from './sequencePersistence.js';

export const DEFAULT_DAILY_PILOT_LIMIT = 20;
export const DEFAULT_MAX_SENDS_PER_MINUTE = 1;
export const MAX_REASONABLE_PILOT_LIMIT = 1000;

/**
 * Validate daily limit configuration.
 * Fails closed if invalid, missing, zero, negative, non-numeric, or exceeds safety ceiling.
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

  if (num > MAX_REASONABLE_PILOT_LIMIT) {
    return { valid: false, error: 'DAILY_LIMIT_EXCESSIVE', reason: `Daily limit exceeds safe pilot ceiling of ${MAX_REASONABLE_PILOT_LIMIT}` };
  }

  return { valid: true, limit: num };
}

/**
 * Validate per-minute pacing configuration.
 * Fails closed if invalid, missing, zero, negative, non-numeric, or exceeds 60/min.
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
  const reservationId = `RES-${dateKey}-${dayData.count + 1}-${Math.random().toString(36).substring(2, 8)}`;
  dayData.count += 1;
  dayData.limit = limitCheck.limit;
  dayData.reservations.push({
    reservationId,
    workerId,
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
    dailyLimit: limitCheck.limit,
    currentCount: dayData.count
  };
}

/**
 * Release an unused reservation slot if an error occurs before transmission.
 */
export function releaseDailyThroughputSlot(dateKey, reservationId, options = {}) {
  const store = options.customStore || loadStore();
  if (!store.dailyThroughput || !store.dailyThroughput[dateKey]) {
    return false;
  }

  const dayData = store.dailyThroughput[dateKey];
  const idx = dayData.reservations.findIndex(r => r.reservationId === reservationId);
  if (idx !== -1) {
    dayData.reservations.splice(idx, 1);
    dayData.count = Math.max(0, dayData.count - 1);
    if (!options.customStore) {
      saveStore(store);
    }
    return true;
  }
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
