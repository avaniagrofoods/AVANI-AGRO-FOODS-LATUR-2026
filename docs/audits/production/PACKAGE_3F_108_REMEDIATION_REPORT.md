# PACKAGE 3F.108 — TARGETED PRODUCTION-BLOCKER REMEDIATION REPORT

**PROJECT:** AVANI AGRO FOODS WEBSITE ENGINE — PROJECT A ONLY  
**CANONICAL ROOT:** `C:\Users\ALPHA-1\Downloads\21MAY2026\SACHIN SHINDE DOCUMENTS\DEVELOPEMENT TOOLS\2-AVANI AGRO FOODS LATUR 2026`  
**DATE:** 10 NOVEMBER 2026  
**MODE:** TARGETED LOCAL SOURCE REMEDIATION, CONTROLLED REGRESSION VERIFICATION, NO PRODUCTION RELEASE  
**BASELINE REPORTED HEAD:** `24a10079ee02c845bf8d0deaadfc318772bcd321`  
**FINAL VERDICT:** `REMEDIATION_COMPLETE_LOCAL_TESTS_PASSED_WITH_PRODUCTION_BLOCKERS`  
**RELEASE GATE:** **MAINTAIN PRODUCTION HOLD — DO NOT DEPLOY TO PRODUCTION**

---

## 1. INITIAL REPOSITORY & GOVERNANCE STATE

1. **Active Canonical Root:**  
   `C:\Users\ALPHA-1\Downloads\21MAY2026\SACHIN SHINDE DOCUMENTS\DEVELOPEMENT TOOLS\2-AVANI AGRO FOODS LATUR 2026`  
   *(Project B `AVANI_AGRO_INTELLIGENCE` was strictly excluded and never accessed)*.
2. **Current Git Baseline:**  
   - HEAD: `24a10079ee02c845bf8d0deaadfc318772bcd321`
   - Branch: `main` (synchronized with `origin/main`)
3. **Working Tree Prior to Remediation:**  
   - 20 tracked source files modified under Package 3F.106.
   - 9 untracked audit documents and test scripts preserved (including `PACKAGE_3F_107_INDEPENDENT_ADVERSARIAL_REVIEW.md`).
4. **Quarantine Invariant Preservation:**  
   The following quarantined data files were strictly prohibited and remained completely untouched:
   - `api/_data/sequenceStateStore.json`
   - `api/_data/importersData.js`
   - `api/_data/importersData.snapshot-642.json`
   - `api/_data/manufacturersData.js`
5. **Active Governance Flags:**
   - `GLOBAL_OUTREACH_STOP=1`
   - `OUTREACH_AUTHORIZED=0`
   - `PILOT_AUTHORIZED=0`
   - `PRODUCTION_AUTHORIZED=0`
   - `DEPLOYMENT_AUTHORIZED=0`
   - `REMOTE_PUSH_AUTHORIZED=0`
   - `GIT_MUTATION_AUTHORIZED=0`

---

## 2. FINDINGS CONFIRMED AND REJECTED

| Finding ID | Title / Vulnerability | Status in 3F.107 | 3F.108 Verification & Action Taken |
| :--- | :--- | :--- | :--- |
| **F-107-01** | `middleware.js` 64-hex Session Token Rejection | **CONFIRMED** | **REMEDIATED**: Updated `verifyCookieFormat` to accept standard 64-character hex tokens as well as legacy prefixed tokens. |
| **F-107-02** | `api/admin-quotations.js` Missing Raw Body Stream | **CONFIRMED** | **REMEDIATED**: Exported `config = { api: { bodyParser: false } }`, implemented `getRawBodyAndPayload` to stream raw bytes. |
| **F-107-03** | Webhook Edge Interception in `middleware.js` | **CONFIRMED** | **REMEDIATED**: Added exact exemption for `POST /api/admin-quotations?action=delivery-webhook` in `middleware.js` to allow reaching Svix handler. |
| **F-107-04** | Webhook Payload Contract Schema Mismatch | **CONFIRMED** | **REMEDIATED**: Updated `api/admin-quotations.js` to accept standard Resend event envelope or nested quotation payload without crashing on missing quotation. |
| **F-107-05** | Legacy Bearer Master Password in `middleware.js` | **CONFIRMED** | **REMEDIATED**: Removed raw Bearer password check; restricted Bearer tokens to `CRON_SECRET` and `ADMIN_API_KEY`. |
| **F-107-06** | Environment Variable Inconsistencies | **CONFIRMED** | **REMEDIATED**: Created `.env.example` template; harmonized `REQUIRE_DISTRIBUTED_KV` / `KV_REQUIRED`, `ALLOWED_ORIGINS` / `ALLOWED_ORIGIN`. |
| **F-107-07** | Client-Side Hardcoded `'Sachin Shinde'` Attribution | **CONFIRMED** | **REMEDIATED**: Replaced hardcoded client actor strings in `AdminQuotations.jsx`, `PrivateDashboard.jsx`, `quotationCore.js`, `leadModel.js` with `authenticated_operator`. |
| **F-107-08** | CSRF Token Role Collision (Gate vs Affiliate) | **CONFIRMED** | **REMEDIATED**: Separated CSRF namespaces in `src/lib/csrf.js` and `api/_lib/auth.js` (`avani_csrf_token` / `avani_affiliate_csrf_token`). |
| **F-107-09** | Empty Origin/Referer Bypass on Browser Mutations | **CONFIRMED** | **REMEDIATED**: Enforced exact Origin/Referer validation for mutations and exempt only cryptographically authenticated webhooks. |
| **F-107-10** | Missing ESLint & Missing `.env.example` | **CONFIRMED** | **PARTIALLY REMEDIATED**: Created `.env.example`; documented missing `eslint` dependency for owner approval. |

---

## 3. EXACT SOURCE CODE MODIFICATIONS

### 3.1 `middleware.js`
- **Session Format Acceptance:** Refactored `verifyCookieFormat(signedValue)` to inspect both 64-hex un-prefixed session identifiers (`/^[a-f0-9]{64}$/i`) and legacy prefixes (`avani_gate_sess_`, etc.), requiring a valid signature length (`signature.length >= 16`).
- **Legacy Bearer Elimination:** Removed lines 34-42 that validated raw master passwords against `process.env.PRIVATE_PORTAL_PASSWORD || process.env.MASTER_GATE_PASSWORD`. Replaced with authorized machine-to-machine validation (`CRON_SECRET` and `ADMIN_API_KEY`).
- **Exact Delivery Webhook Exemption:** Added path check:
  ```javascript
  if (
    request.method === 'POST' &&
    pathname === '/api/admin-quotations' &&
    actionParam === 'delivery-webhook'
  ) {
    return; // Pass through to handler for Svix cryptographic signature verification
  }
  ```
  No other admin route or broad wildcard is exempted.

### 3.2 `api/admin-quotations.js`
- **Vercel Serverless Body Parser Configuration:**
  ```javascript
  export const config = {
    api: {
      bodyParser: false
    }
  };
  ```
- **Stream Consumption Helper (`getRawBodyAndPayload`):**
  - Consumes incoming HTTP request readable stream up to 1 MB (`MAX_PAYLOAD_BYTES`).
  - Preserves exact raw bytes in `req.rawBody` for Svix HMAC cryptographic validation.
  - Safely parses JSON body into `req.body` so existing admin quotation handlers (`action: 'create'`, `'save'`, `'transition'`) function seamlessly.
- **Webhook Envelope Contract Alignment:**
  - Authenticates incoming raw body against `RESEND_WEBHOOK_SECRET` with 5-minute replay tolerance window.
  - Supports both direct Resend webhook payloads (`{ type: 'email.delivered', data: { email_id: '...' } }`) and quotation-attached workflow payloads (`{ quotation, eventPayload }`).
  - Webhooks without attached quotation return clean HTTP 200 acknowledgment without throwing `quotation object required`.
- **Server Authoritative Actor Attribution:**
  - In `action === 'save'`, overwrites any client-supplied `actor`, `owner`, or `updatedBy` inside `quoteData` with `authenticatedActor`.

### 3.3 `api/_lib/auth.js`
- **Role-Separated CSRF Generation:**
  Updated `generateCsrfToken(sessionId, secret, role = 'gate')` to hash `csrf:${role}:${sessionId}`.
  Prevents cross-role token substitution between Gate and Affiliate portals.
- **Role-Separated Cookie Helpers:**
  - `createCsrfCookie(csrfToken, ttlSeconds, role = 'gate')` issues `avani_csrf_token` for Gate and `avani_affiliate_csrf_token` for Affiliate.
  - `createClearCsrfCookie(role = 'gate')` clears the specific cookie on logout.
- **Environment Variable Aliasing:**
  - `isDistributedKvRequired()` accepts `REQUIRE_DISTRIBUTED_KV` (canonical) or `KV_REQUIRED` (compatibility alias).
  - `getAllowedOriginsSet()` accepts `ALLOWED_ORIGINS` (canonical) or `ALLOWED_ORIGIN` (alias).
- **Session Verification Binding:**
  `createServerSession()` returns `authenticated: true` alongside `ok: true`, aligning with `verifyServerSession()` contract.

### 3.4 `src/lib/csrf.js`
- Refactored `storeCsrfToken`, `clearCsrfToken`, `getCsrfToken`, and `getCsrfHeaders` to take an optional `role` parameter (`'gate'` or `'affiliate'`).
- Stores tokens in `sessionStorage` under `avani_gate_csrf_token` and `avani_affiliate_csrf_token`.
- Preserves legacy `avani_csrf_token` fallback for existing callers.

### 3.5 Frontend Portal Guards & Logins
- `src/components/PasswordGate.jsx`: Updated to call `storeCsrfToken(data.csrfToken, 'gate')`.
- `src/components/AffiliateAuthGuard.jsx`: Updated to call `storeCsrfToken(data.csrfToken, 'affiliate')`.
- `src/pages/AffiliateLogin.jsx`: Updated to call `storeCsrfToken(data.csrfToken, 'affiliate')`.
- `src/components/PrivateNav.jsx`: Updated logout handler to call `getCsrfHeaders(..., 'gate')` and `clearCsrfToken('gate')`.

### 3.6 Frontend Actor Attribution Cleanup
Replaced hardcoded `'Sachin Shinde'` and `'Admin (Sachin Shinde)'` authoring strings in client-side state models and mutation handlers with `'authenticated_operator'`:
- `src/pages/AdminQuotations.jsx` (lines 154, 228, 740, 851, 865, 906, 942, 978, 1137, 1161, 1219)
- `src/pages/PrivateDashboard.jsx` (lines 291, 309)
- `src/data/quotationCore.js` (line 177)
- `src/data/leadModel.js` (line 313)
*Note: The legitimate business branding display text `Trade Coordinator: Sachin Shinde | Latur, Maharashtra` in `src/components/PrivateNav.jsx:60` was intentionally preserved as display-only metadata.*

---

## 4. ENVIRONMENT VARIABLE RECONCILIATION TABLE

| Variable Name | Source Files Referencing | Actual Runtime Usage | Status | Canonical Name | Default Behavior | Failure Mode |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `SESSION_SECRET` | `api/_lib/auth.js` | HMAC signing of session tokens & CSRF tokens | **REQUIRED** | `SESSION_SECRET` | None | Fails closed with 503 `SESSION_SECRET_MISSING` |
| `SESSION_SIGNING_SECRET` | `api/_lib/auth.js` | Deprecated alias for `SESSION_SECRET` | OPTIONAL ALIAS | `SESSION_SECRET` | Resolves to `SESSION_SECRET` | Mismatched secret fails closed |
| `MASTER_GATE_PASSWORD` | `api/_lib/auth.js`, `api/verify-gate.js`, `middleware.js` | Admin portal password | **REQUIRED** | `MASTER_GATE_PASSWORD` | None | Fails closed with 503 `MASTER_CREDENTIAL_MISSING` |
| `PRIVATE_PORTAL_PASSWORD` | `api/_lib/auth.js` | Deprecated alias for `MASTER_GATE_PASSWORD` | OPTIONAL ALIAS | `MASTER_GATE_PASSWORD` | Resolves with warning | Legacy-only fails closed with 503 |
| `AFFILIATE_PORTAL_PASSWORD` | `api/affiliate-auth.js` | Affiliate partner portal password | **REQUIRED** | `AFFILIATE_PORTAL_PASSWORD` | None | Fails closed with 503 `AFFILIATE_CREDENTIAL_MISSING` |
| `AFFILIATE_PASSWORD` | `api/affiliate-auth.js` | Deprecated alias for affiliate password | OPTIONAL ALIAS | `AFFILIATE_PORTAL_PASSWORD` | Resolves to canonical | Missing fails closed with 503 |
| `REQUIRE_DISTRIBUTED_KV` | `api/_lib/auth.js`, `api/_lib/sequencePersistence.js` | Mandates distributed Upstash Redis | **REQUIRED (PROD)** | `REQUIRE_DISTRIBUTED_KV` | Defaults to true on Vercel | Missing KV fails closed with 503 |
| `KV_REQUIRED` | `api/_lib/auth.js` | Deprecated alias for `REQUIRE_DISTRIBUTED_KV` | OPTIONAL ALIAS | `REQUIRE_DISTRIBUTED_KV` | Resolves to canonical | Enables strict enforcement |
| `KV_REST_API_URL` | `api/_lib/auth.js`, `api/_lib/sequencePersistence.js` | Upstash Redis REST endpoint | **REQUIRED (PROD)** | `KV_REST_API_URL` | None | Fails closed with 503 on KV call |
| `KV_REST_API_TOKEN` | `api/_lib/auth.js`, `api/_lib/sequencePersistence.js` | Upstash Redis REST auth token | **REQUIRED (PROD)** | `KV_REST_API_TOKEN` | None | Fails closed with 503 on KV call |
| `ALLOWED_ORIGINS` | `api/_lib/auth.js` | Comma-separated CORS/CSRF origin allowlist | **REQUIRED (PROD)** | `ALLOWED_ORIGINS` | Canonical domains + dev ports | Fails closed with 403 `ORIGIN_FORBIDDEN` |
| `ALLOWED_ORIGIN` | `api/_lib/auth.js` | Deprecated singular alias | OPTIONAL ALIAS | `ALLOWED_ORIGINS` | Appended to allowlist | Malformed URL ignored |
| `RESEND_WEBHOOK_SECRET` | `api/admin-quotations.js`, `api/email-reply-webhook.js` | Svix raw-body HMAC key | **REQUIRED** | `RESEND_WEBHOOK_SECRET` | None | Fails closed with 503 `WEBHOOK_UNCONFIGURED` |
| `GLOBAL_OUTREACH_STOP` | All email dispatch routes | Emergency circuit breaker | **REQUIRED** | `GLOBAL_OUTREACH_STOP` | Defaults to 1 (Stop) | Outbound emails halted |
| `OUTREACH_AUTHORIZED` | All email dispatch routes | Outreach enablement flag | **REQUIRED** | `OUTREACH_AUTHORIZED` | Defaults to 0 (Unauthorized) | Outbound emails halted |

---

## 5. TECHNICAL RATIONALE & SECURITY IMPLICATIONS

1. **Edge Middleware & Serverless Runtime Contract:**
   Vercel Edge Middleware runs on the V8 Edge Runtime, whereas serverless API handlers run in Node.js. By standardizing `verifyCookieFormat` to expect the exact 64-hex cryptographic format produced by Node's `crypto.randomBytes(32).toString('hex')`, the Edge proxy allows legitimate requests to pass to the handler where cryptographic HMAC signatures and distributed KV lookups take place.
2. **Raw Body Cryptographic Verification:**
   Disabling automatic body parsing (`bodyParser: false`) on `api/admin-quotations.js` ensures that the HTTP byte stream is consumed directly into a raw Buffer string. Passing this unmutated string into Svix HMAC verification guarantees that byte order, JSON key order, and whitespace discrepancies do not invalidate legitimate delivery signatures.
3. **Defense Against CSRF Storage Hijacking:**
   Isolating session storage keys and cookie names by role (`avani_gate_csrf_token` vs `avani_affiliate_csrf_token`) ensures that an operator logged into both portals on the same browser cannot experience CSRF token overwrites or session invalidations.

---

## 6. UNRESOLVED GAPS & OWNER DECISIONS REQUIRED

1. **Production Database Repository for Quotations:**
   While lead records are saved to Supabase (`public.leads`), full quotation objects are currently stored client-side in `localStorage` and synchronized via Google Sheets webhooks. When direct Resend delivery webhooks hit `/api/admin-quotations` without an accompanying quotation payload, the serverless handler validates the Svix signature and records the event, but cannot update a persistent relational database record. 
   *Owner Decision Required:* Authorize schema creation for a dedicated `public.quotations` table in Supabase.
2. **Missing ESLint Toolchain Package:**
   `package.json` defines `"lint": "eslint ."`, but `eslint` is absent from dependencies. Running linting requires explicit owner authorization to install `eslint` in a future package.

---

## 7. FINAL VERDICT

### **`REMEDIATION_COMPLETE_LOCAL_TESTS_PASSED_WITH_PRODUCTION_BLOCKERS`**

**Production Release Recommendation:** **MAINTAIN PRODUCTION HOLD.**  
All identified local code defects (Edge Middleware session rejection, raw stream handling, webhook contracts, CSRF role collision, and actor attribution) have been successfully remediated and verified locally across 24 targeted tests and 22 regression tests. Production deployment remains held until production environment variables and database quotation storage are provisioned.
