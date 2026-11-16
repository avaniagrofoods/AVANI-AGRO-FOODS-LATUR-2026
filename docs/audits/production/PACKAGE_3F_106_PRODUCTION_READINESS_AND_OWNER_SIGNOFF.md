# PACKAGE 3F.106 — PRODUCTION READINESS & OWNER SIGN-OFF PACKAGE

**Project:** AVANI AGRO FOODS WEBSITE ENGINE — PROJECT A ONLY  
**Canonical Root:** `C:\Users\ALPHA-1\Downloads\21MAY2026\SACHIN SHINDE DOCUMENTS\DEVELOPEMENT TOOLS\2-AVANI AGRO FOODS LATUR 2026`  
**Verified Baseline HEAD:** `24a10079ee02c845bf8d0deaadfc318772bcd321`  
**Package Reference:** `3F.106`  
**Timestamp:** `2026-11-10T09:54:00+05:30`

---

## 1. Independent Adversarial Review (Section 8)

An independent adversarial audit of all Package 3F.106 changes was executed against the six required audit axes:

### 1.1 Can any fix be bypassed through an alternate header, query param, cookie, route, or fallback branch?
- **Result:** **NO BYPASS FOUND.**
- **Verification Details:**
  - `Authorization: Bearer <MASTER_GATE_PASSWORD>` has been completely removed from `api/importers.js`, `api/manufacturers.js`, and `api/admin-quotations.js`. Sending the raw master password in `Authorization` returns `401 UNAUTHORIZED`.
  - Legacy cookies (`admin_session`, `avani_admin_token`, `avani_portal_session`) are ignored by `verifyServerSession` in `api/_lib/auth.js`; only `avani_gate_session` (for gate/admin routes) and `avani_affiliate_session` (for affiliate routes) are parsed.
  - Webhook endpoints (`api/email-reply-webhook.js` and `api/admin-quotations.js?action=delivery-webhook`) explicitly reject `?secret=...`, `req.body.secret`, `req.body.webhookSecret`, and `x-webhook-secret` with `400 UNTRUSTED_SECRET_SOURCE` before signature verification, and require cryptographic `svix-id`, `svix-timestamp`, and `svix-signature` headers verified over the raw payload body.
  - Origin validation (`isExactAllowedOrigin`) parses `Origin` and `Referer` via `new URL(candidate).origin` and checks membership in a strict allowlist `Set` (`https://avaniagrofoods.com`, `https://www.avaniagrofoods.com`, plus localhost only when `NODE_ENV !== 'production'`). Subdomain tricks (`https://evil-avaniagrofoods.com`, `https://attacker.vercel.app`) are rejected with `403`.
  - Client IP extraction (`getClientIp`) ignores `x-forwarded-for` unless `TRUST_PROXY === '1'` and ignores `x-vercel-forwarded-for` unless `VERCEL === '1'`, neutralizing header spoofing of rate-limit buckets.

### 1.2 Does any fix break local development, preview deployments, or legitimate admin workflows?
- **Result:** **NO BREAKAGE FOUND; DEPLOYMENT CONSIDERATIONS DOCUMENTED.**
- **Verification Details:**
  - **Local development (`NODE_ENV !== 'production'`):** `http://localhost:5173`, `http://localhost:3000`, and `http://127.0.0.1:5173` are automatically included in `getAllowedOrigins()`, and in-memory Maps (`localSessionStore`, `rateLimitMap`) are permitted only when `NODE_ENV !== 'production'` and `KV_REQUIRED !== '1'` and Upstash KV is unconfigured.
  - **Preview deployments:** Wildcard `*.vercel.app` was intentionally removed per CC-04 to prevent cross-tenant Vercel preview origin abuse. If a specific preview URL requires mutation access, it must be explicitly added via `ALLOWED_ORIGIN` in that preview environment.
  - **Legitimate Admin & Affiliate UI workflows:** `PasswordGate.jsx`, `PrivateNav.jsx`, `AdminQuotations.jsx`, `AffiliateLogin.jsx`, and `AffiliateAuthGuard.jsx` persist the server-issued `csrfToken` via `src/lib/csrf.js` and attach `X-CSRF-Token` on all authenticated `POST` mutations.
  - **Vercel Webhook Raw Body Note:** `verifySvixSignature` requires `req.rawBody` (String or Buffer) to compute an authentic HMAC over the unparsed payload. In Vercel Node.js functions where default body parsing is active, the deployment must either supply `req.rawBody` via middleware/config or disable default body parsing on the webhook route so raw bytes are preserved. When `req.rawBody` is absent, the handler fails closed (`400 RAW_BODY_REQUIRED`) rather than verifying against a re-serialized object.

### 1.3 Does any fix introduce secret leakage in logs, errors, responses, cookies, or build artifacts?
- **Result:** **NO SECRET LEAKAGE FOUND.**
- **Verification Details:**
  - `generateExcelQuotation` in `api/_lib/quotationEngine.js` and `api/quotation.js` no longer reference `MASTER_GATE_PASSWORD` or `PRIVATE_PORTAL_PASSWORD`; a runtime guard (`CREDENTIAL_COUPLING_FORBIDDEN`) throws if any caller passes `workbookPassword` or `masterPassword`.
  - Session tokens and CSRF tokens use `SESSION_SIGNING_SECRET` (or domain-separated `HMAC-SHA256(MASTER_GATE_PASSWORD, "avani_derived_secret_v2:session_signing")`) and never embed plaintext passwords.
  - Error responses return structured error codes (`CREDENTIAL_CONFLICT`, `SESSION_BACKEND_UNAVAILABLE`, `RATE_LIMIT_BACKEND_UNAVAILABLE`, `CSRF_VALIDATION_FAILED`, `INVALID_WEBHOOK_SIGNATURE`) without echoing secret values or stack traces.
  - `npm run build` output inside `dist/` was verified; no server-side env vars (`MASTER_GATE_PASSWORD`, `RESEND_WEBHOOK_SECRET`, `KV_REST_API_TOKEN`) are bundled into client assets.

### 1.4 Are any files outside Project A or quarantined paths touched?
- **Result:** **ZERO VIOLATIONS.**
- **Verification Details:**
  - All operations occurred strictly inside `C:\Users\ALPHA-1\Downloads\21MAY2026\SACHIN SHINDE DOCUMENTS\DEVELOPEMENT TOOLS\2-AVANI AGRO FOODS LATUR 2026`.
  - None of the four quarantined files (`api/_data/sequenceStateStore.json`, `api/_data/importersData.js`, `api/_data/importersData.snapshot-642.json`, `api/_data/manufacturersData.js`) were read, opened, stat'd, hashed, or modified. Regression tests intercepted `importersData.js` and `manufacturersData.js` in memory via Node's `module.registerHooks`.

### 1.5 Are any status claims unsupported by executed commands?
- **Result:** **NO UNSUPPORTED CLAIMS.**
- **Verification Details:**
  - All 22 automated regression tests (`T-01.1` through `T-16.1`) were executed via `node scripts/test_package_3f_106_regression.mjs` (exit code `0`).
  - Production bundle compilation was executed via `npm run build` (exit code `0`).
  - `npm run lint` was executed and its exact failure (`'eslint' is not recognized as an internal or external command`) is transparently documented without fabrication.

### 1.6 Are there remaining security or reliability gaps?
- **Result:** **NO CODE-LEVEL BLOCKERS IN CC-01..CC-08; INFRASTRUCTURE ITEMS DOCUMENTED BELOW.**
- **Verification Details:**
  - All 8 mandatory corrective actions (`CC-01` through `CC-08`) and 3 additional security findings (`AF-01` through `AF-03`) are remediated and verified in `FIXED_AND_TESTED` state.
  - External infrastructure provisioning (Upstash Redis KV credentials, Resend Svix signing secret, canonical `MASTER_GATE_PASSWORD` without conflicting `PRIVATE_PORTAL_PASSWORD`, and optional ESLint package installation) remains under Owner operational control prior to live cutover.

---

## 2. Production Readiness Assessment (Section 9)

### A. Locally Verified
- **CC-01 through CC-08 & AF-01 through AF-03 Source Implementation:** Completed across 17 source files (`api/_lib/auth.js`, `api/verify-gate.js`, `api/affiliate-auth.js`, `api/importers.js`, `api/manufacturers.js`, `api/admin-quotations.js`, `api/_lib/quotationEngine.js`, `api/quotation.js`, `api/email-reply-webhook.js`, `src/data/quotationModel.js`, `api/_lib/quotationModel.js`, `api/_lib/supabaseClient.js`, `api/save-lead.js`, `api/leads.js`, `api/lead-qualification.js`, `src/lib/csrf.js`, and 5 React components/pages).
- **Automated Regression Test Suite (`scripts/test_package_3f_106_regression.mjs`):** 22/22 tests passed (`0` failures, exit code `0`), covering all 16 required test categories.
- **Production Frontend Build (`npm run build`):** Vite 7.3.1 production build succeeded (`2146 modules transformed`, exit code `0`).
- **Quarantine & Scope Preservation:** Verified via `git status --short` that zero quarantined files (`api/_data/*`) and zero files outside Project A were touched.

### B. Configuration Verified
- `vercel.json` routing, security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`), and serverless function rewrites inspected and aligned with API routes.
- `.env.example` and environment variable contract verified against `api/_lib/auth.js` fail-closed guards.

### C. Externally Verified
- **None.** Per Section 10 Governance (`DEPLOYMENT_AUTHORIZED=0`, `PRODUCTION_AUTHORIZED=0`, `REMOTE_PUSH_AUTHORIZED=0`, `GLOBAL_OUTREACH_STOP=1`), no live external calls to Upstash Redis, Supabase, Resend, or Vercel production deployments were executed during this local package.

### D. Awaiting Owner Decision
1. **Production Environment Variable Provisioning:** Owner must configure `MASTER_GATE_PASSWORD` (and remove `PRIVATE_PORTAL_PASSWORD`), `SESSION_SIGNING_SECRET`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `KV_REQUIRED=1`, and `RESEND_WEBHOOK_SECRET` in Vercel Production.
2. **Git Commit & Deployment Authorization:** Owner must review the changes and decide whether to commit, push to `origin/main`, and trigger a Vercel deployment.
3. **ESLint DevDependency Decision:** Decide whether to install `eslint` in `devDependencies` or remove the unused `"lint": "eslint ."` script from `package.json`.

### E. Not Verified
- **Live Upstash Redis KV network round-trip in Vercel Production runtime** (verified locally via mocked HTTP fetch against Upstash REST API contract and Lua script semantics).
- **Live Resend Svix webhook delivery in Vercel Production runtime** (verified locally via cryptographic HMAC-SHA256 Svix signature harness).
- **`npm run lint` execution:** Blocked locally because `eslint` is not installed in `package.json` (`devDependencies`) or `node_modules/.bin`.

---

## 3. Production Environment Variable Checklist (Names & Required State Only — No Secret Values)

| Variable Name | Scope | Required State in Production | Fail-Closed Behavior if Missing/Misconfigured |
|---|---|---|---|
| `NODE_ENV` | Runtime | `production` | Enables strict production mode (`KV_REQUIRED`, `Secure` cookies, no localhost origins). |
| `MASTER_GATE_PASSWORD` | Auth / Gate | **REQUIRED** (Strong high-entropy secret) | Returns `503 MASTER_CREDENTIAL_MISSING`. |
| `PRIVATE_PORTAL_PASSWORD` | Legacy Auth | **MUST BE UNSET / REMOVED** (or identical during transition) | Returns `503 CREDENTIAL_CONFLICT` if different from `MASTER_GATE_PASSWORD`, or `503 LEGACY_CREDENTIAL_ONLY_FORBIDDEN` if set alone. |
| `SESSION_SIGNING_SECRET` | Session / CSRF | **RECOMMENDED** (32+ byte random hex/base64 secret) | Falls back to domain-separated `HMAC-SHA256(MASTER_GATE_PASSWORD, "avani_derived_secret_v2:session_signing")`. |
| `AFFILIATE_PORTAL_PASSWORD` | Affiliate Auth | **REQUIRED** (if affiliate portal is enabled) | Returns `503 Server configuration error` on affiliate login if unset. |
| `KV_REST_API_URL` | Session & Rate Limit KV | **REQUIRED** (`https://<endpoint>.upstash.io`) | Returns `503 SESSION_BACKEND_UNAVAILABLE` / `503 RATE_LIMIT_BACKEND_UNAVAILABLE`. |
| `KV_REST_API_TOKEN` | Session & Rate Limit KV | **REQUIRED** (Upstash REST Bearer token) | Returns `503 SESSION_BACKEND_UNAVAILABLE` / `503 RATE_LIMIT_BACKEND_UNAVAILABLE`. |
| `KV_REQUIRED` | Fail-Closed Guard | **REQUIRED** (`1`) | Enforces strict KV availability even outside `NODE_ENV=production`. |
| `ALLOWED_ORIGIN` | CORS / CSRF Origin | **OPTIONAL** (`https://avaniagrofoods.com`) | Defaults to `https://avaniagrofoods.com` and `https://www.avaniagrofoods.com` in production. |
| `TRUST_PROXY` | Client IP Resolution | Set to `1` only behind a trusted reverse proxy stripping `x-forwarded-for` (Vercel sets `VERCEL=1` automatically) | Ignores `x-forwarded-for` unless `TRUST_PROXY=1`. |
| `RESEND_WEBHOOK_SECRET` | Webhooks | **REQUIRED** (`whsec_<base64>`) | Returns `503 WEBHOOK_UNCONFIGURED` on `/api/email-reply-webhook` and `/api/admin-quotations?action=delivery-webhook`. |
| `RESEND_API_KEY` | Transactional Email | **REQUIRED** (for lead/quotation emails when authorized) | Email dispatch fails safely without exposing credentials. |
| `SUPABASE_URL` | Persistence | **REQUIRED** | Returns persistence error on admin quotation storage. |
| `SUPABASE_SERVICE_ROLE_KEY` | Persistence | **REQUIRED** | Returns persistence error on admin quotation storage. |

---

## 4. Post-Deployment Smoke-Test Plan (Do Not Execute Against Production Without Authorization)

Once the Owner provisions the production environment variables and authorizes deployment, execute the following read-safe/non-destructive smoke tests against the deployed target:

1. **Unauthenticated Protected API Rejection (CC-01 / CC-03):**
   - `curl -i https://avaniagrofoods.com/api/importers` -> Expect `401 Unauthorized`.
   - `curl -i -H "Authorization: Bearer <any-value>" https://avaniagrofoods.com/api/admin-quotations` -> Expect `401 Unauthorized`.
2. **Gate Login, Session Verification & CSRF Issuance (CC-02 / CC-03 / CC-04):**
   - Authenticate via `POST /api/verify-gate` with `Origin: https://avaniagrofoods.com` and valid `MASTER_GATE_PASSWORD`.
   - Confirm `200 OK`, `Set-Cookie: avani_gate_session=...; HttpOnly; Secure; SameSite=Strict`, `Set-Cookie: avani_csrf_token=...`, and JSON `csrfToken`.
   - Call `GET /api/verify-gate` with the session cookie -> Confirm `200 OK` (`authenticated: true, actor: "gate_operator:session_..."`).
3. **CSRF & Origin Enforcement on Admin Mutations (CC-04):**
   - Attempt `POST /api/verify-gate` (`{"action":"logout"}`) with valid session cookie but **without** `X-CSRF-Token` -> Expect `403 CSRF_VALIDATION_FAILED`.
   - Repeat with valid `X-CSRF-Token` and `Origin: https://avaniagrofoods.com` -> Expect `200 OK` and session revocation in Upstash KV.
   - Replay the old `avani_gate_session` cookie on `GET /api/verify-gate` -> Expect `401 Unauthorized`.
4. **Quotation Excel Download Decoupling (CC-05):**
   - Request a quotation `.xlsx` export and verify that workbook protection does not embed or accept `MASTER_GATE_PASSWORD`.
5. **Webhook Signature Enforcement (CC-06):**
   - `curl -i -X POST https://avaniagrofoods.com/api/email-reply-webhook -H "Content-Type: application/json" -d '{"type":"email.received"}'` -> Expect `401 INVALID_WEBHOOK_SIGNATURE` (or `400` if raw body/headers missing).

---

## 5. Owner Sign-Off Decision Table (Blank — Awaiting Owner Completion)

> [!IMPORTANT]
> In accordance with Package 3F.106 Governance Rules, Owner approval has **not** been fabricated or pre-filled. Complete the table below to record formal Owner decisions.

| Decision Item | Scope / Requirement | Owner Decision (`APPROVED` / `DEFERRED` / `REJECTED`) | Owner Name / Initials | Date / Timestamp | Notes / Conditions |
|---|---|---|---|---|---|
| **1. Security Remediation Sign-Off (`CC-01`..`CC-08`, `AF-01`..`AF-03`)** | Approve code changes across the 17 Project A source files and regression suite (`scripts/test_package_3f_106_regression.mjs`). | `[ ] APPROVED` `[ ] DEFERRED` `[ ] REJECTED` | | | |
| **2. Production Secret & KV Provisioning** | Confirm `MASTER_GATE_PASSWORD`, `SESSION_SIGNING_SECRET`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `KV_REQUIRED=1`, and `RESEND_WEBHOOK_SECRET` are set in Vercel Production and `PRIVATE_PORTAL_PASSWORD` is removed. | `[ ] APPROVED` `[ ] DEFERRED` `[ ] REJECTED` | | | |
| **3. Git Commit & Remote Push Authorization** | Authorize staging, committing on `main`, and pushing to `origin/main` (`GIT_MUTATION_AUTHORIZED=1`, `REMOTE_PUSH_AUTHORIZED=1`). | `[ ] APPROVED` `[ ] DEFERRED` `[ ] REJECTED` | | | |
| **4. Production Deployment & Cutover Authorization** | Authorize Vercel production deployment and execution of the Section 4 Post-Deployment Smoke-Test Plan (`DEPLOYMENT_AUTHORIZED=1`, `PRODUCTION_AUTHORIZED=1`). | `[ ] APPROVED` `[ ] DEFERRED` `[ ] REJECTED` | | | |
