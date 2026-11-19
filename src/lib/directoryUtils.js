// ============================================================
// AVANI AGRO FOODS — Shared Directory Validation, CSV & Filter Helpers
// Used by Importers.jsx, Manufacturers.jsx & automated regression tests
// ============================================================

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidOptionalEmail(value) {
  const raw = String(value ?? '').trim();
  if (!raw || raw.toLowerCase() === 'not available') return true;
  return EMAIL_REGEX.test(raw);
}

export function isValidOptionalPhone(value) {
  const raw = String(value ?? '').trim();
  if (!raw || raw.toLowerCase() === 'not available') return true;
  const digits = raw.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 16;
}

/**
 * Neutralizes spreadsheet formula injection (=, +, -, @, tab, CR)
 * and safely double-quotes CSV cells for RFC 4180 + Excel UTF-8.
 */
export function csvCell(value) {
  const raw = value == null ? '' : String(value);
  const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function buildUtf8Csv(headers, rows) {
  return '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * Enforces evidence requirement before upgrading a record's verification status
 * away from UNVERIFIED. Never allows silent self-approval without evidence/notes.
 */
export function validateVerificationTransition(previousStatus, nextStatus, evidenceText) {
  const prev = String(previousStatus || 'UNVERIFIED').toUpperCase();
  const next = String(nextStatus || 'UNVERIFIED').toUpperCase();
  if (next === prev || next === 'UNVERIFIED' || next === 'NEEDS_REVIEW' || next === 'NEEDS FOUNDER REVIEW') {
    return { allowed: true };
  }
  const hasEvidence = String(evidenceText ?? '').trim().length >= 5;
  if (!hasEvidence) {
    return {
      allowed: false,
      error: `Documentary evidence or review notes (at least 5 characters) are required to change verification status from ${prev} to ${next}.`
    };
  }
  return { allowed: true };
}

export function clampPage(currentPage, totalItems, pageSize) {
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const safePage = Math.max(1, Math.min(currentPage || 1, totalPages));
  return { totalPages, safePage };
}
