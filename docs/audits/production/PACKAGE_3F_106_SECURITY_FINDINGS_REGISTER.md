# PACKAGE 3F.106 — SECURITY FINDINGS REGISTER

- **Project:** AVANI AGRO FOODS WEBSITE ENGINE — PROJECT A ONLY
- **Canonical Root:** `C:\Users\ALPHA-1\Downloads\21MAY2026\SACHIN SHINDE DOCUMENTS\DEVELOPEMENT TOOLS\2-AVANI AGRO FOODS LATUR 2026`
- **Package Reference:** PACKAGE 3F.106
- **Report Date:** 2026-11-10
- **Baseline Reported HEAD:** `24a10079ee02c845bf8d0deaadfc318772bcd321`

---

## Summary Table of Findings & Statuses

| Finding ID | Title | Severity | Affected Files | Status | Verification Test IDs |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **CC-01** | Master Password Bearer Bypass & Legacy Cookie Bypass | CRITICAL | `api/admin-quotations.js`, `api/importers.js`, `api/manufacturers.js`, `api/_lib/auth.js` | `FIXED_AND_TESTED` | `T-01.1`, `T-01.2`, `T-01.3` |
| **CC-02** | Master Credential Precedence, Conflict & Legacy Silent Fallback | HIGH | `api/_lib/auth.js`, `api/verify-gate.js` | `FIXED_AND_TESTED` | `T-02.1`, `T-02.2`, `T-02.3` |
| **CC-03** | Session Revocation Inconsistency & Signature-Only KV Outage Fallback | CRITICAL | `api/_lib/auth.js`, `api/verify-gate.js`, `api/affiliate-auth.js`, `api/admin-quotations.js`, `api/importers.js`, `api/manufacturers.js` | `FIXED_AND_TESTED` | `T-03.1`, `T-04.1`, `T-04.2`, `T-05.1`, `T-05.2`, `T-06.1` |
| **CC-04** | Permissive Substring/Suffix Origin Matching & Missing CSRF Protection | HIGH | `api/_lib/auth.js`, `api/verify-gate.js`, `api/affiliate-auth.js`, `api/admin-quotations.js`, `src/lib/csrf.js`, `src/components/PasswordGate.jsx`, `src/components/PrivateNav.jsx`, `src/pages/AdminQuotations.jsx`, `src/pages/AffiliateLogin.jsx`, `src/components/AffiliateAuthGuard.jsx` | `FIXED_AND_TESTED` | `T-07.1`, `T-08.1` |
| **CC-05** | Portal Master Password Coupled to Excel Worksheet Protection | HIGH | `api/_lib/quotationEngine.js`, `api/quotation.js` | `FIXED_AND_TESTED` | `T-09.1` |
| **CC-06** | Unauthenticated / Non-Standard Webhook Secret & Replay Handling | CRITICAL | `api/_lib/auth.js`, `api/email-reply-webhook.js`, `api/admin-quotations.js`, `api/_lib/quotationModel.js`, `src/data/quotationModel.js` | `FIXED_AND_TESTED` | `T-10.1` |
| **CC-07** | Hardcoded Human Audit Actor Default & Client-Supplied Actor Spoofing | HIGH | `api/admin-quotations.js`, `api/_lib/quotationModel.js`, `src/data/quotationModel.js`, `api/_lib/supabaseClient.js`, `src/pages/AdminQuotations.jsx` | `FIXED_AND_TESTED` | `T-11.1` |
| **CC-08** | Non-Atomic Rate Limiting, Memory Fallback in Production & Spoofable `X-Forwarded-For` | HIGH | `api/_lib/auth.js`, `api/verify-gate.js`, `api/affiliate-auth.js`, `api/admin-quotations.js`, `api/importers.js`, `api/manufacturers.js`, `api/quotation.js`, `api/leads.js`, `api/lead-qualification.js`, `api/save-lead.js`, `api/email-reply-webhook.js` | `FIXED_AND_TESTED` | `T-12.1`, `T-13.1`, `T-14.1`, `T-15.1` |
| **AF-01** | Unescaped HTML Interpolation in Transactional Lead Notification Emails | MEDIUM | `api/save-lead.js` | `FIXED_AND_TESTED` | `T-15.1` |
| **AF-02** | Missing Origin Check and Rate Limiting on `/api/quotation` | MEDIUM | `api/quotation.js` | `FIXED_AND_TESTED` | `T-15.1` |
| **AF-03** | Unsanitized `quoteId` in `Content-Disposition` Response Header | MEDIUM | `api/quotation.js` | `FIXED_AND_TESTED` | `T-15.1` |

---

## Detailed Findings & Remediation Evidence

### CC-01 — Master Password Bearer Bypass
- **Root Cause:** `api/admin-quotations.js` (`verifyAdminAuth`), `api/importers.js`, and `api/manufacturers.js` accepted `Authorization: Bearer <MASTER_GATE_PASSWORD>` directly as a valid authentication mechanism, and `api/admin-quotations.js` also accepted unissued legacy cookie names (`avani_admin_session=authenticated`, `avani_portal_auth=<password>`).
- **Remediation:** Removed all Bearer master-password comparisons and legacy cookie checks from `api/admin-quotations.js`, `api/importers.js`, `api/manufacturers.js`, and `api/_lib/auth.js`. All protected routes now require an active, cryptographically signed, server-verified `avani_gate_session` cookie via `await verifyServerSession(req, 'gate')`.
- **Status:** `FIXED_AND_TESTED`

### CC-02 — Credential Precedence
- **Root Cause:** `api/verify-gate.js` and `api/admin-quotations.js` evaluated `process.env.PRIVATE_PORTAL_PASSWORD || process.env.MASTER_GATE_PASSWORD`, allowing legacy `PRIVATE_PORTAL_PASSWORD` to silently override `MASTER_GATE_PASSWORD` or authenticate when `MASTER_GATE_PASSWORD` was unset.
- **Remediation:** Implemented `resolveMasterGatePassword()` in `api/_lib/auth.js`. `MASTER_GATE_PASSWORD` is the sole canonical master credential. If both `MASTER_GATE_PASSWORD` and `PRIVATE_PORTAL_PASSWORD` are set with differing values, authentication fails closed with HTTP `503` (`CREDENTIAL_CONFLICT`). If only `PRIVATE_PORTAL_PASSWORD` is set without `MASTER_GATE_PASSWORD`, authentication fails closed with HTTP `503` (`LEGACY_CREDENTIAL_ONLY_FORBIDDEN`). If neither is set, authentication fails closed with HTTP `503` (`MASTER_CREDENTIAL_MISSING`). Credential values are never logged or returned.
- **Status:** `FIXED_AND_TESTED`

### CC-03 — Session Revocation Consistency
- **Root Cause:** `verifySignedCookie` in `api/_lib/auth.js` only checked HMAC signatures synchronously (`v1.<timestamp>.<sig>`) without verifying server-side session existence, expiry timestamp, or revocation in KV, and `execKVCommand` swallowed KV errors as `null`.
- **Remediation:** Replaced `v1` tokens with `v2.<sessionId>.<issuedAtMs>.<expiresAtMs>.<signature>` in `api/_lib/auth.js`. Implemented `createServerSession`, `verifyServerSession`, and `revokeServerSession` backed by `execKVCommandStrict` (using Upstash REST `POST` JSON command arrays). Every protected route awaits `verifyServerSession`. Missing, malformed, expired, or revoked sessions return `401`. When KV is required or configured and unreachable/errored, `verifyServerSession` returns `503 SESSION_BACKEND_UNAVAILABLE` (`serviceUnavailable: true`) and never falls back to signature-only authentication.
- **Status:** `FIXED_AND_TESTED`

### CC-04 — Origin and CSRF
- **Root Cause:** `isAllowedOrigin` in `api/_lib/auth.js` used substring matching (`origin.includes('avaniagrofoods.com')`) and wildcard suffix matching (`origin.endsWith('.vercel.app')`), and cookie-authenticated `POST` mutations lacked CSRF tokens.
- **Remediation:** Replaced substring/suffix checks with `isExactAllowedOrigin(originStr)` using `new URL(originStr).origin` against an exact allowlist (`https://www.avaniagrofoods.com`, `https://avaniagrofoods.com`, exact entries in `ALLOWED_ORIGINS`, and local dev ports only when `!isProductionOrVercelRuntime()`). Implemented session-bound HMAC CSRF tokens (`generateCsrfToken`, `verifyCsrfRequest`, `createCsrfCookie`) enforced on all cookie-authenticated `POST` mutations (`api/admin-quotations.js`, `api/verify-gate.js` logout, `api/affiliate-auth.js` logout) and wired `X-CSRF-Token` in `src/lib/csrf.js`, `src/components/PasswordGate.jsx`, `src/components/PrivateNav.jsx`, `src/pages/AdminQuotations.jsx`, `src/pages/AffiliateLogin.jsx`, and `src/components/AffiliateAuthGuard.jsx`. Restricted `api/importers.js` and `api/manufacturers.js` to read-only `GET`.
- **Status:** `FIXED_AND_TESTED`

### CC-05 — Excel Credential Coupling
- **Root Cause:** `api/quotation.js` and `api/_lib/quotationEngine.js` passed `process.env.MASTER_GATE_PASSWORD` into `sheet.protect(lockPassword)`. Excel worksheet protection only hashes the password with a weak legacy 16-bit XOR hash in worksheet XML (`<sheetProtection>`) for UI cell locking, exposing a derivative of the portal master password to every recipient of a downloaded `.xlsx` quotation.
- **Remediation:** Completely removed `MASTER_GATE_PASSWORD` from `api/quotation.js` and `api/_lib/quotationEngine.js`. Added an explicit guard in `generateExcelQuotation` that throws `CREDENTIAL_COUPLING_FORBIDDEN` if a caller attempts to pass `MASTER_GATE_PASSWORD` or `PRIVATE_PORTAL_PASSWORD` as `worksheetProtectionPassword`. Optional UI cell locking now uses only a dedicated `WORKSHEET_PROTECTION_PASSWORD` if explicitly configured, with clear documentation that worksheet protection is UI edit-locking only and not file encryption.
- **Status:** `FIXED_AND_TESTED`

### CC-06 — Webhook Authentication
- **Root Cause:** `api/admin-quotations.js` (`delivery-webhook`) accepted `req.body.webhookSecret` using non-constant-time `!==`, `processDeliveryWebhook` allowed unauthenticated status mutations if `envSecret` was unset, and `api/email-reply-webhook.js` allowed a non-standard `verifyDirectSecret` fallback header.
- **Remediation:** Standardized on Resend's documented Svix webhook signature protocol (`svix-id`, `svix-timestamp`, `svix-signature` HMAC-SHA256 over `${svixId}.${svixTimestamp}.${rawBody}` with a 300-second timestamp tolerance window and `crypto.timingSafeEqual`) via `verifySvixSignature` in `api/_lib/auth.js`. Both `api/email-reply-webhook.js` and `api/admin-quotations.js` (`delivery-webhook`) reject query/body secrets (`400 UNTRUSTED_SECRET_SOURCE`), fail closed when `RESEND_WEBHOOK_SECRET` is unset (`503 WEBHOOK_UNCONFIGURED`), require raw body verification, and enforce replay deduplication on `eventId`/`svix-id`.
- **Status:** `FIXED_AND_TESTED`

### CC-07 — Audit Actor Attribution
- **Root Cause:** `api/admin-quotations.js` trusted `req.body.actor` and `req.body.changedBy` and defaulted to hardcoded `'Sachin Shinde'`, allowing any caller to spoof audit attribution or misattribute system/operator actions.
- **Remediation:** Derived the authenticated actor principal strictly from the verified server-side session (`authSession.actor`, formatted as `gate_operator:session_<12hex>`) in `api/admin-quotations.js`, overriding all client-supplied `actor`, `changedBy`, `options.actor`, and `overrides.owner` fields. Replaced hardcoded `'Sachin Shinde'` default audit actors in `src/data/quotationModel.js`, `api/_lib/quotationModel.js`, `api/_lib/supabaseClient.js`, and `src/pages/AdminQuotations.jsx` with `'authenticated_operator'` / `'system_lead_pipeline'`.
- **Status:** `FIXED_AND_TESTED`

### CC-08 — Distributed Rate Limiting
- **Root Cause:** `getClientIp` trusted `req.headers['x-forwarded-for'].split(',')[0]` unconditionally (allowing trivial IP spoofing), `checkRateLimit` executed non-atomic `INCR` + `EXPIRE` GET-path calls, silently fell back to per-instance memory when KV failed in production, and had no corrupt counter detection.
- **Remediation:** Hardened `getClientIp(req)` to trust `x-vercel-forwarded-for` only on Vercel runtime (`VERCEL=1`), or the rightmost hop of `x-forwarded-for` only when `TRUST_PROXY=1`, defaulting to `req.socket.remoteAddress`. Replaced `INCR`+`EXPIRE` with an atomic Redis Lua `EVAL` script (`ATOMIC_RATE_LIMIT_LUA`) via Upstash REST `POST`. Added corrupt counter detection (`RATE_LIMIT_CORRUPT_STATE` -> deletes corrupt key and fails closed with `503`) and production KV outage fail-closed behavior (`503 RATE_LIMIT_BACKEND_UNAVAILABLE`) across all 10 API routes.
- **Status:** `FIXED_AND_TESTED`

### AF-01 — Unescaped HTML Interpolation in `api/save-lead.js`
- **Root Cause:** `api/save-lead.js` interpolated user-supplied lead fields (`name`, `company`, `email`, `phone`, `product`, `message`) directly into the HTML email body sent via Resend.
- **Remediation:** Added `escapeHtml()` in `api/save-lead.js` and escaped all user-supplied fields before HTML template interpolation.
- **Status:** `FIXED_AND_TESTED`

### AF-02 — Missing Origin Check and Rate Limiting on `/api/quotation`
- **Root Cause:** `api/quotation.js` generated CPU-intensive PDF/DOCX/XLSX buffers without verifying request origin or enforcing rate limits.
- **Remediation:** Added `isAllowedOrigin(req)` validation and distributed `checkRateLimit` (`quotation_api`, 30 req/15 min) with `503`/`429` propagation in `api/quotation.js`.
- **Status:** `FIXED_AND_TESTED`

### AF-03 — Unsanitized `quoteId` in `Content-Disposition` Header in `/api/quotation`
- **Root Cause:** `api/quotation.js` interpolated `quote.quoteId` directly into `Content-Disposition: attachment; filename="Quotation_${quote.quoteId}.pdf"`, enabling header injection or malformed filenames.
- **Remediation:** Added `sanitizeDownloadFilenameId(rawId)` in `api/quotation.js` stripping non-alphanumeric/underscore/hyphen characters and bounding length to 64 characters.
- **Status:** `FIXED_AND_TESTED`
