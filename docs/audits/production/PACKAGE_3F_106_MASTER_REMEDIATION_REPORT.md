# PACKAGE 3F.106 — MASTER REMEDIATION & ARCHITECTURE REVIEW REPORT

- **Project:** AVANI AGRO FOODS WEBSITE ENGINE — PROJECT A ONLY
- **Canonical Root:** `C:\Users\ALPHA-1\Downloads\21MAY2026\SACHIN SHINDE DOCUMENTS\DEVELOPEMENT TOOLS\2-AVANI AGRO FOODS LATUR 2026`
- **Package Reference:** PACKAGE 3F.106
- **Report Date:** 2026-11-10
- **Baseline Reported HEAD:** `24a10079ee02c845bf8d0deaadfc318772bcd321` (Verified Exact Match)

---

## 1. Executive Summary

Package 3F.106 recovered full local execution and file-editing capabilities inside the canonical Project A workspace using authorized native Antigravity tools (`read_file`, `write_file`, `edit_file`, `run_command`), verified the exact baseline HEAD (`24a10079ee02c845bf8d0deaadfc318772bcd321`), completed all eight mandatory security corrective actions (**CC-01** through **CC-08**) plus three additional architecture audit findings (**AF-01** through **AF-03**), executed a 22-test end-to-end regression suite exercising real API handlers and engines, verified lint and production build outputs, and conducted an independent adversarial review.

All safety invariants remain strictly enforced (`GLOBAL_OUTREACH_STOP=1`, `OUTREACH_AUTHORIZED=0`, `PILOT_AUTHORIZED=0`, `PRODUCTION_AUTHORIZED=0`, `DEPLOYMENT_AUTHORIZED=0`, `REMOTE_PUSH_AUTHORIZED=0`, `GIT_MUTATION_AUTHORIZED=0`). Zero quarantined files (`api/_data/*`) and zero files in Project B (`AVANI_AGRO_INTELLIGENCE`) were accessed or modified.

---

## 2. Corrective Actions Implemented (CC-01 through CC-08)

### CC-01 — Master Password Bearer Bypass (`FIXED_AND_TESTED`)
- **Affected Files:** `api/admin-quotations.js`, `api/importers.js`, `api/manufacturers.js`, `api/_lib/auth.js`
- **Exploitability & Root Cause:** `verifyAdminAuth` in `api/admin-quotations.js` and `verifyGateAccess` in `api/importers.js` and `api/manufacturers.js` accepted `Authorization: Bearer <MASTER_GATE_PASSWORD>` directly as an authentication mechanism, and `api/admin-quotations.js` also accepted unissued static cookies (`avani_admin_session=authenticated`, `avani_portal_auth=<password>`). This bypassed session issuance, TTL enforcement, CSRF tokens, and server-side session revocation.
- **Remediation:** Removed all Bearer master-password acceptance and legacy cookie checks across all endpoints. Every protected route now calls `await verifyServerSession(req, 'gate')`, requiring a valid HMAC-signed `avani_gate_session` cookie backed by an active server-side session record.

### CC-02 — Credential Precedence & Conflict Detection (`FIXED_AND_TESTED`)
- **Affected Files:** `api/_lib/auth.js` (`resolveMasterGatePassword`), `api/verify-gate.js`
- **Exploitability & Root Cause:** `process.env.PRIVATE_PORTAL_PASSWORD || process.env.MASTER_GATE_PASSWORD` gave precedence to a legacy variable and allowed silent authentication when only the legacy variable was set or when the two variables conflicted.
- **Remediation:** Established `MASTER_GATE_PASSWORD` as the single canonical master credential in `resolveMasterGatePassword()`:
  - If `MASTER_GATE_PASSWORD` and `PRIVATE_PORTAL_PASSWORD` are both set and differ, fails closed with HTTP `503` (`CREDENTIAL_CONFLICT`).
  - If only `PRIVATE_PORTAL_PASSWORD` is set without `MASTER_GATE_PASSWORD`, fails closed with HTTP `503` (`LEGACY_CREDENTIAL_ONLY_FORBIDDEN`).
  - If neither is set, fails closed with HTTP `503` (`MASTER_CREDENTIAL_MISSING`).
  - Never logs, returns, or exposes credential values.

### CC-03 — Session Revocation Consistency & Fail-Closed KV Verification (`FIXED_AND_TESTED`)
- **Affected Files:** `api/_lib/auth.js`, `api/verify-gate.js`, `api/affiliate-auth.js`, `api/admin-quotations.js`, `api/importers.js`, `api/manufacturers.js`
- **Exploitability & Root Cause:** `api/admin-quotations.js`, `api/importers.js`, and `api/manufacturers.js` previously validated only the cookie HMAC signature without checking server-side session existence or revocation in KV, and `execKVCommand` swallowed KV errors as `null`, allowing revoked sessions to remain valid until cookie expiry or during KV outages.
- **Remediation:**
  - Implemented `execKVCommandStrict` using Upstash REST `POST` JSON command arrays, distinguishing key misses (`null`) from network/HTTP/parse errors (which throw).
  - Implemented `createServerSession`, `verifyServerSession`, and `revokeServerSession` in `api/_lib/auth.js`.
  - Session records (`session:<role>:<sessionId>`) store `{ active: true, revoked: false, sessionId, role, actor, actorRole, createdAt, issuedAtMs, expiresAtMs }` with `EX` TTL matching cookie `Max-Age`.
  - When KV is required or configured and unreachable/errored, `verifyServerSession` fails closed with HTTP `503` (`SESSION_BACKEND_UNAVAILABLE`, `backendUnavailable: true`) and **never** falls back to signature-only authentication.
  - All protected callers (`verify-gate.js`, `affiliate-auth.js`, `admin-quotations.js`, `importers.js`, `manufacturers.js`) await `verifyServerSession` and propagate `503` on backend outage and `401` on missing/tampered/expired/revoked sessions.

### CC-04 — Exact Origin Allowlist & Session-Bound CSRF Protection (`FIXED_AND_TESTED`)
- **Affected Files:** `api/_lib/auth.js`, `api/verify-gate.js`, `api/affiliate-auth.js`, `api/admin-quotations.js`, `api/importers.js`, `api/manufacturers.js`, `src/lib/csrf.js`, `src/components/PasswordGate.jsx`, `src/components/PrivateNav.jsx`, `src/pages/AdminQuotations.jsx`, `src/pages/AffiliateLogin.jsx`, `src/components/AffiliateAuthGuard.jsx`
- **Exploitability & Root Cause:** `isAllowedOrigin` previously used `.includes('avaniagrofoods.com')` and `.endsWith('.vercel.app')`, which could be bypassed by any attacker domain containing `avaniagrofoods.com` or any `.vercel.app` tenant. Furthermore, cookie-authenticated `POST` mutations had no CSRF token verification.
- **Remediation:**
  - Replaced substring/suffix matching with `isExactAllowedOrigin` and `validateMutationOrigin` using `new URL(origin)` exact origin comparison against `https://www.avaniagrofoods.com`, `https://avaniagrofoods.com`, explicitly configured origins in `ALLOWED_ORIGINS`, and local dev ports (`localhost:3000/5173/4173`) strictly when `!isProductionOrVercelRuntime()`.
  - Implemented session-bound HMAC CSRF tokens (`generateCsrfToken(sessionId, secret)`, `verifyCsrfRequest(req, session)`).
  - Enforced `verifyCsrfRequest` on all cookie-authenticated `POST` mutations (`POST /api/admin-quotations`, `POST /api/verify-gate` logout, `POST /api/affiliate-auth` logout).
  - Restricted `/api/importers` and `/api/manufacturers` to read-only `GET`.
  - Wired `src/lib/csrf.js` across frontend authentication and admin quotation components to store `csrfToken` and send `X-CSRF-Token` on mutations.

### CC-05 — Excel Credential Decoupling (`FIXED_AND_TESTED`)
- **Affected Files:** `api/_lib/quotationEngine.js`, `api/quotation.js`
- **Exploitability & Root Cause:** `api/quotation.js` and `api/_lib/quotationEngine.js` passed `process.env.MASTER_GATE_PASSWORD` into `sheet.protect()`. Excel worksheet protection (`<sheetProtection>`) only applies a weak 16-bit XOR hash for UI cell-edit locking (not encryption), leaking a derivative of the portal master password inside downloaded `.xlsx` files.
- **Remediation:**
  - Removed `MASTER_GATE_PASSWORD` from `api/quotation.js` and `api/_lib/quotationEngine.js`.
  - Added an explicit runtime guard in `generateExcelQuotation` throwing `CREDENTIAL_COUPLING_FORBIDDEN` if `MASTER_GATE_PASSWORD` or `PRIVATE_PORTAL_PASSWORD` is passed as a worksheet lock password.
  - Documented clearly in code that `sheet.protect()` is UI cell-edit locking only and does not provide encryption or confidentiality.

### CC-06 — Webhook Authentication & Replay Protection (`FIXED_AND_TESTED`)
- **Affected Files:** `api/_lib/auth.js` (`verifySvixSignature`), `api/email-reply-webhook.js`, `api/admin-quotations.js`, `api/_lib/quotationModel.js`, `src/data/quotationModel.js`
- **Exploitability & Root Cause:** `api/admin-quotations.js` (`delivery-webhook`) compared `req.body.webhookSecret` using `!==`, `processDeliveryWebhook` allowed unauthenticated status changes when `envSecret` was unset, and `api/email-reply-webhook.js` allowed a non-standard `verifyDirectSecret` fallback header.
- **Remediation:**
  - Confirmed Resend (via Svix) as the transactional email provider.
  - Implemented `verifySvixSignature(rawBody, headers, secret)` in `api/_lib/auth.js` verifying `svix-id`, `svix-timestamp` (5-minute replay tolerance window), and `svix-signature` (`v1,<base64_hmac_sha256>` over `${svixId}.${svixTimestamp}.${rawBody}` using `crypto.timingSafeEqual`).
  - Both `/api/email-reply-webhook` and `/api/admin-quotations` (`delivery-webhook`) reject query/body secrets (`400 UNTRUSTED_SECRET_SOURCE`), fail closed when `RESEND_WEBHOOK_SECRET` is unset (`503 WEBHOOK_UNCONFIGURED`), require `req.rawBody` (`503 WEBHOOK_RAW_BODY_REQUIRED`), and enforce event ID replay deduplication.

### CC-07 — Verified Audit Actor Attribution (`FIXED_AND_TESTED`)
- **Affected Files:** `api/admin-quotations.js`, `api/_lib/quotationModel.js`, `src/data/quotationModel.js`, `api/_lib/supabaseClient.js`, `src/pages/AdminQuotations.jsx`
- **Exploitability & Root Cause:** `api/admin-quotations.js` trusted `req.body.actor` and `req.body.changedBy` and defaulted to hardcoded `'Sachin Shinde'`, allowing callers to forge audit trail attribution.
- **Remediation:**
  - `api/admin-quotations.js` now derives `authenticatedActor = authSession.actor` (`gate_operator:session_<12hex>`) and `authenticatedRole = authSession.actorRole` strictly from the verified server session, ignoring/overriding `req.body.actor`, `req.body.changedBy`, `req.body.options.actor`, and `req.body.overrides.owner`.
  - Removed hardcoded `'Sachin Shinde'` default audit actors from `src/data/quotationModel.js`, `api/_lib/quotationModel.js`, `api/_lib/supabaseClient.js`, and `src/pages/AdminQuotations.jsx` (replacing them with `'authenticated_operator'` / `'system_lead_pipeline'`, while preserving legitimate business contact metadata on printable documents).

### CC-08 — Distributed Rate Limiting & Trusted Proxy Boundary (`FIXED_AND_TESTED`)
- **Affected Files:** `api/_lib/auth.js`, `api/verify-gate.js`, `api/affiliate-auth.js`, `api/admin-quotations.js`, `api/importers.js`, `api/manufacturers.js`, `api/quotation.js`, `api/leads.js`, `api/lead-qualification.js`, `api/save-lead.js`, `api/email-reply-webhook.js`
- **Exploitability & Root Cause:** `getClientIp` trusted `req.headers['x-forwarded-for'].split(',')[0]` unconditionally, `checkRateLimit` used non-atomic `INCR`+`EXPIRE`, silently fell back to per-instance memory on KV errors in production, and did not detect corrupt counter values.
- **Remediation:**
  - Hardened `getClientIp(req)` to use `x-vercel-forwarded-for` only on Vercel runtime (`VERCEL=1`), or the rightmost hop of `x-forwarded-for` only when `TRUST_PROXY=1`, otherwise `req.socket.remoteAddress`.
  - Replaced `INCR`+`EXPIRE` with an atomic Redis Lua `EVAL` script (`ATOMIC_RATE_LIMIT_LUA`) executed via `execKVCommandStrict`.
  - Added corrupt counter state detection (`RATE_LIMIT_CORRUPT_STATE` -> deletes corrupt key and fails closed with `503`).
  - Enforced fail-closed `503 RATE_LIMIT_BACKEND_UNAVAILABLE` across all 10 API endpoints when KV is required or configured and unreachable.

---

## 3. Additional Security & Architecture Audit Findings (Section 5)

- **AF-01 (`FIXED_AND_TESTED`):** Added `escapeHtml()` in `api/save-lead.js` to sanitize all user-supplied lead fields (`name`, `company`, `email`, `phone`, `product`, `message`) before interpolating into Resend HTML notification emails.
- **AF-02 (`FIXED_AND_TESTED`):** Added `isAllowedOrigin(req)` validation and distributed `checkRateLimit` (`quotation_api`, 30 req/15 min) to `api/quotation.js` to protect CPU-intensive PDF/DOCX/XLSX generation.
- **AF-03 (`FIXED_AND_TESTED`):** Added `sanitizeDownloadFilenameId()` in `api/quotation.js` to strip CR/LF/quotes and non-alphanumeric characters from `quote.quoteId` in `Content-Disposition` headers.
