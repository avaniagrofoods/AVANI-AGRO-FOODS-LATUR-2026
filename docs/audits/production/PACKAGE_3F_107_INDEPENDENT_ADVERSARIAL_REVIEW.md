# PACKAGE 3F.107 — INDEPENDENT ADVERSARIAL SECURITY VERIFICATION & PRODUCTION RELEASE GATE REVIEW

**PROJECT A:** AVANI AGRO FOODS WEBSITE ENGINE  
**CANONICAL ROOT:** `C:\Users\ALPHA-1\Downloads\21MAY2026\SACHIN SHINDE DOCUMENTS\DEVELOPEMENT TOOLS\2-AVANI AGRO FOODS LATUR 2026`  
**REVIEW DATE:** 10 NOVEMBER 2026  
**MODE:** STRICT READ-ONLY INDEPENDENT ADVERSARIAL VERIFICATION & RELEASE GATE AUDIT  
**BASELINE REPOSITORY HEAD:** `24a10079ee02c845bf8d0deaadfc318772bcd321`  
**FINAL RELEASE GATE VERDICT:** `INDEPENDENT_REVIEW_PASSED_WITH_PRODUCTION_BLOCKERS`  
**PRODUCTION DEPLOYMENT DECISION:** **MAINTAIN PRODUCTION HOLD — DO NOT DEPLOY TO PRODUCTION**

---

## 1. EXECUTIVE SUMMARY & VERDICT

Package 3F.107 conducted an independent, evidence-based adversarial security verification of all source code changes, architecture claims, and test claims produced under Package 3F.106.

Package 3F.106 made substantial, positive architectural improvements across serverless API endpoints (session management, timing-safe comparisons, Lua-based rate limiting, origin checks, and HTML escaping). However, **independent adversarial tracing identified 2 critical production-breaking architectural blockers and 5 high/medium compliance and runtime defects** that were missed by Package 3F.106. Most notably, Package 3F.106 completely overlooked Vercel Edge Middleware (`middleware.js`), which in production **will intercept and reject 100% of legitimate cookie-authenticated requests and delivery webhooks to `/api/admin-quotations` before the handler ever executes**.

### Core Review Metrics

| Dimension | Assessment | Evidence Summary |
| :--- | :--- | :--- |
| **Baseline Repository Integrity** | **VERIFIED** | Baseline HEAD `24a10079ee02c845bf8d0deaadfc318772bcd321` confirmed. Quarantined data files remained untouched. |
| **Package 3F.106 Scope Adherence** | **VERIFIED** | 20 tracked files modified (+1,891, -676 lines), 8 untracked files added. No unrelated files touched. |
| **Package Dependencies** | **INCONSISTENCY IDENTIFIED** | Vite version installed is `5.4.21` (not `7.3.1` as reported in Package 3F.106 narrative). `eslint` is missing entirely from `node_modules` and package manifests. `.env.example` does not exist in root. |
| **Authentication & Precedence (CC-01, CC-02)** | **PARTIALLY FIXED** | Serverless handlers fixed; but `middleware.js` retains raw Bearer master password check and legacy reversed precedence (`PRIVATE_PORTAL_PASSWORD || MASTER_GATE_PASSWORD`). |
| **Session Lifecycle (CC-03)** | **PARTIALLY FIXED (BLOCKER AT EDGE)** | `api/_lib/auth.js` implements solid cryptographically random HMAC sessions with KV backing. However, `middleware.js` rejects session tokens lacking specific prefixes (`avani_gate_sess_`, etc.), blocking new 64-hex tokens on `/api/admin-*`. |
| **CSRF & Origin Validation (CC-04)** | **PARTIALLY FIXED** | Mutation origins strictly validated. However, `isAllowedOrigin()` permits requests with absent `Origin` AND `Referer` headers on non-mutation endpoints, and cookie/storage keys collide between Gate and Affiliate roles. |
| **Credential Decoupling (CC-05)** | **FIXED AND TESTED** | Excel generation completely decoupled from `MASTER_GATE_PASSWORD`. `CREDENTIAL_COUPLING_FORBIDDEN` enforced. Sheet protection documented as UI lock only. |
| **Webhook Signature & Raw Body (CC-06)** | **BLOCKED (CRITICAL)** | `POST /api/admin-quotations?action=delivery-webhook` does not configure `bodyParser: false`, rendering `req.rawBody` `undefined` on Vercel Node runtime (`503 WEBHOOK_RAW_BODY_REQUIRED`). Also blocked at Edge by `middleware.js` (`401`). Webhook handler contract expects non-standard nested body. |
| **Actor Attribution (CC-07)** | **PARTIALLY FIXED** | Server binds `authSession.actor`, but client frontend (`AdminQuotations.jsx`, `PrivateDashboard.jsx`) still contains hardcoded `'Sachin Shinde'` authoring strings in client-state mutations and saves. |
| **Rate Limiting & IP Resolution (CC-08)** | **FIXED NOT FULLY TESTED** | Redis Lua script implemented with fail-closed behavior. However, test harness simulated Lua in JS; cron dispatch unthrottled; fallback to `'127.0.0.1'` risk under proxy misconfiguration. |
| **Regression Test Authenticity** | **REVIEWED** | 22 test executions verified in `scripts/test_package_3f_106_regression.mjs`. However, tests directly invoke handlers in mock environments, completely bypassing Edge Middleware, Node streaming body parsers, and real Redis Lua execution. |

---

## 2. BASELINE & ENVIRONMENT VERIFICATION

### 2.1 Git Repository State

- **Current HEAD:** `24a10079ee02c845bf8d0deaadfc318772bcd321` (matches baseline reported HEAD).
- **Branch:** `main` (synchronized with `origin/main`).
- **Clean Diff Scope:** `git diff --stat 24a10079ee02c845bf8d0deaadfc318772bcd321` confirms exactly 20 modified tracked files:
  - `api/_lib/auth.js`
  - `api/_lib/quotationEngine.js`
  - `api/_lib/quotationModel.js`
  - `api/_lib/supabaseClient.js`
  - `api/admin-quotations.js`
  - `api/affiliate-auth.js`
  - `api/email-reply-webhook.js`
  - `api/importers.js`
  - `api/lead-qualification.js`
  - `api/leads.js`
  - `api/manufacturers.js`
  - `api/quotation.js`
  - `api/save-lead.js`
  - `api/verify-gate.js`
  - `src/components/AffiliateAuthGuard.jsx`
  - `src/components/PasswordGate.jsx`
  - `src/components/PrivateNav.jsx`
  - `src/data/quotationModel.js`
  - `src/pages/AdminQuotations.jsx`
  - `src/pages/AffiliateLogin.jsx`
- **Quarantined Files Verification:**
  - `api/_data/sequenceStateStore.json`: Unchanged, not modified.
  - `api/_data/importersData.js`: Unchanged, not modified.
  - `api/_data/importersData.snapshot-642.json`: Unchanged, not modified.
  - `api/_data/manufacturersData.js`: Unchanged, not modified.

### 2.2 Package Manifest & Toolchain Discrepancies

1. **Vite Version Mismatch in Package 3F.106 Report:**
   - In `package.json`: `"devDependencies": { "@vitejs/plugin-react": "^4.3.1", "vite": "^5.4.1" }`
   - In `package-lock.json`: Resolved `node_modules/vite` is `5.4.21` (Vite 5).
   - In Package 3F.106's written report narrative, the text cited `avani-agro-foods@0.0.0` and `vite v7.3.1`. The actual project name is `avani-agro-foods-latur` (version `1.0.1`), and installed Vite is version `5.4.21`.
2. **Missing ESLint Binary:**
   - `package.json` line 9 defines `"lint": "eslint ."`.
   - However, `eslint` is **not declared** in `dependencies` or `devDependencies` of `package.json`, is absent in `package-lock.json`, and does not exist in `node_modules/.bin`. Running `npm run lint` fails with `eslint: not found`.
3. **Missing `.env.example`:**
   - Package 3F.106 claimed `.env.example` was verified and consistent.
   - An inspection of the root directory confirmed **`.env.example` does not exist**.

---

## 3. ADVERSARIAL VERIFICATION: CC-01 & CC-02 (AUTHENTICATION & CREDENTIAL PRECEDENCE)

### 3.1 Serverless Handler Audit
In serverless functions under `api/`:
- `api/_lib/auth.js` enforces strict constant-time comparison (`safeTimingCompare`) using `crypto.timingSafeEqual` with SHA-256 pre-hashing to prevent length leakage.
- Master password Bearer token usage has been eliminated in `api/admin-quotations.js:38-42` by enforcing `authenticateAdminRoute(req)`:
  - Bearer tokens are strictly resolved against `CRON_SECRET` (for automated invocations) or `ADMIN_API_KEY` (for programmatic integrations).
  - Webhook calls require valid Svix cryptographic signatures.
  - Interactive browser access strictly requires valid session cookies (`avani_gate_session`).

### 3.2 CRITICAL PRODUCTION BLOCKER: Unremediated `middleware.js` Edge Middleware

`middleware.js` is positioned at the edge for all routes matching `/admin/:path*` and `/api/admin-:path*`:

```javascript
// middleware.js: Lines 5-8
export const config = {
  matcher: ['/admin/:path*', '/api/admin-:path*'],
};
```

Adversarial tracing revealed three severe flaws in `middleware.js` that completely break production:

1. **Session Cookie Format Rejection (`middleware.js:11-23`):**
   ```javascript
   function verifyCookieFormat(cookieValue) {
     if (!cookieValue || typeof cookieValue !== 'string') return false;
     const [sessId, hmacSig] = cookieValue.split('.');
     if (!sessId || !hmacSig) return false;
     const validPrefixes = ['avani_gate_sess_', 'avani_admin_sess_', 'avani_sess_', 'admin_authenticated_'];
     return validPrefixes.some(prefix => sessId.startsWith(prefix));
   }
   ```
   In `api/_lib/auth.js:513`, `createServerSession()` generates session IDs as:
   ```javascript
   const sessionId = crypto.randomBytes(32).toString('hex'); // 64 raw hex characters, no prefix!
   ```
   **Impact:** Any administrator logging in through `/api/verify-gate` receives a valid session ID such as `a9f3...`. When this cookie is passed to any `/api/admin-quotations` request, `middleware.js` evaluates `verifyCookieFormat` as `false`, immediately short-circuiting at the edge and returning:
   ```json
   HTTP/1.1 401 Unauthorized
   {"error": "Unauthorized admin access"}
   ```
   The request is aborted before `api/admin-quotations.js` ever runs!

2. **Edge Rejection of Resend Delivery Webhook (`middleware.js:55-62`):**
   `POST /api/admin-quotations?action=delivery-webhook` matches the matcher `/api/admin-:path*`.
   Because incoming Resend webhooks do not carry an `avani_gate_session` cookie or a Bearer token matching `process.env.ADMIN_API_KEY`, `middleware.js` returns `401 Unauthorized` at the Edge. The Svix signature verification logic inside `api/admin-quotations.js` can never be reached.

3. **Legacy Insecure Bearer Master Password & Reversed Precedence Retained (`middleware.js:34-42`):**
   ```javascript
   // middleware.js: Lines 38-41
   const masterPassword = process.env.PRIVATE_PORTAL_PASSWORD || process.env.MASTER_GATE_PASSWORD;
   if (masterPassword && token === masterPassword) {
     return; // Bypasses middleware
   }
   ```
   - Checks `PRIVATE_PORTAL_PASSWORD` before `MASTER_GATE_PASSWORD` (legacy reversed precedence).
   - Permits raw master password in `Authorization: Bearer <password>` to bypass Edge protection, violating CC-01 and CC-02.

---

## 4. ADVERSARIAL VERIFICATION: CC-03 (SESSION LIFECYCLE & KV ENFORCEMENT)

### 4.1 Token Generation and Structure
- `api/_lib/auth.js:464-530`: Sessions are signed as `<sessionId>.<hmacSignature>`.
- `sessionId` generated via `crypto.randomBytes(32).toString('hex')` (256 bits of cryptographically secure entropy).
- HMAC generated with `crypto.createHmac('sha256', secret)`.

### 4.2 KV Persistence & Outage Fail-Closed Behavior
- `api/_lib/auth.js:580-607`: If distributed KV is configured, session validity requires active existence in KV store.
- If KV call throws or returns an error, `verifyServerSession()` strictly rejects the session with `{ valid: false, code: 'SESSION_KV_ERROR' }` or `{ valid: false, code: 'SESSION_REVOKED_OR_EXPIRED' }`.
- There is **no signature-only fallback** during KV outages. This was verified in code and correctly enforces CC-03.

### 4.3 Environment Configuration & Naming Hazards
1. **`SESSION_SECRET` vs `MASTER_GATE_PASSWORD` Fallback:**
   - Package 3F.106's documentation claimed `SESSION_SECRET` was optional and fell back to HMAC derived from `MASTER_GATE_PASSWORD`.
   - Code verification (`api/_lib/auth.js:431-439`) proved that `resolveSessionSecret()` returns `null` if neither `SESSION_SECRET` nor `SESSION_SIGNING_SECRET` is set.
   - If missing in production, `createServerSession()` immediately aborts with `503 SESSION_SECRET_MISSING`.
2. **`REQUIRE_DISTRIBUTED_KV` vs `KV_REQUIRED`:**
   - `api/_lib/auth.js:59-66` checks `process.env.REQUIRE_DISTRIBUTED_KV === '1'` or `process.env.STRICT_KV_ENFORCEMENT === '1'`.
   - Package 3F.106's deployment checklist instructed the Owner to configure `KV_REQUIRED=1`. If an operator sets `KV_REQUIRED=1`, the application will **not** enforce distributed KV, remaining in in-memory fallback mode across serverless lambdas.
3. **`AFFILIATE_PORTAL_PASSWORD` vs `AFFILIATE_PASSWORD`:**
   - `api/affiliate-auth.js:117` resolves `process.env.AFFILIATE_PORTAL_PASSWORD || process.env.AFFILIATE_GATE_PASSWORD`.
   - In `scripts/test_package_3f_106_regression.mjs:207`, the test harness set `AFFILIATE_PASSWORD`. Because of this, the test script never tested successful affiliate login (`POST /api/affiliate-auth`).

---

## 5. ADVERSARIAL VERIFICATION: CC-04 (CSRF DEFENSE & ORIGIN VALIDATION)

### 5.1 Mutation Origin Validation
- Mutation requests (`POST`, `PUT`, `DELETE`, `PATCH`) in `api/verify-gate.js`, `api/affiliate-auth.js`, and `api/admin-quotations.js` call `validateMutationOrigin(req)` (`api/_lib/auth.js:994-1017`).
- Validates that either `Origin` or `Referer` is present and matches the configured allowlist (`ALLOWED_ORIGINS`).

### 5.2 Identified Weaknesses & Token Collisions
1. **Unprotected Public Form Routes Allow Omitted Origin/Referer:**
   - In `isAllowedOrigin(req, options)` (`api/_lib/auth.js:971-985`):
     ```javascript
     if (!originHeader && !refererHeader) {
       return options.requireOriginHeader ? false : true;
     }
     ```
   - Callers in `api/quotation.js:29`, `api/save-lead.js:67`, `api/leads.js:39`, and `api/lead-qualification.js:27` invoke `isAllowedOrigin(req)` without `{ requireOriginHeader: true }`. Consequently, raw POST requests crafted without `Origin` or `Referer` headers bypass origin checks.
2. **CSRF Storage Key Collision Between Gate and Affiliate Roles:**
   - In `src/lib/csrf.js:6`:
     ```javascript
     export const CSRF_COOKIE_NAME = 'avani_csrf_token';
     const STORAGE_KEY = 'avani_csrf_token';
     ```
   - Both `/api/verify-gate.js` and `/api/affiliate-auth.js` issue cookies named `avani_csrf_token`.
   - In a multi-tab or single-browser scenario where an operator accesses both the Gate/Admin portal and the Affiliate portal, whichever login occurs second overwrites `sessionStorage.getItem('avani_csrf_token')` and the `avani_csrf_token` cookie. Subsequent mutations on the other tab fail with `403 CSRF_FORBIDDEN`.

---

## 6. ADVERSARIAL VERIFICATION: CC-05 (CREDENTIAL DECOUPLING IN EXCEL ENGINE)

### 6.1 Password Isolation
- `api/_lib/quotationEngine.js:838-852` and `api/quotation.js:87-95`:
  - `generateExcelQuotation` requires `options.sheetProtectionPassword`.
  - The function explicitly checks:
    ```javascript
    if (sheetPassword && (sheetPassword === masterPassword || sheetPassword === privatePassword)) {
      throw new Error('CREDENTIAL_COUPLING_FORBIDDEN: Sheet protection password cannot reuse administrative secrets.');
    }
    ```
- Excel generation is fully decoupled from `MASTER_GATE_PASSWORD`.

### 6.2 Protection Scope Clarification
- The codebase docstrings and comments now explicitly clarify that ExcelJS worksheet protection is a lightweight UI edit-protection mechanism, not cryptographic file encryption.

---

## 7. ADVERSARIAL VERIFICATION: CC-06 (DELIVERY WEBHOOK SIGNATURE & RAW BODY)

### 7.1 CRITICAL PRODUCTION BLOCKER: Missing Body Parser Configuration on `api/admin-quotations.js`

In Vercel Serverless (Node.js runtime), request bodies are automatically parsed into JavaScript objects unless the route explicitly opts out.

- In `api/email-reply-webhook.js:30-34`, body parsing is properly disabled:
  ```javascript
  export const config = {
    api: {
      bodyParser: false,
    },
  };
  ```
  It then consumes the stream with `getRawBodyAndPayload(req)` to preserve exact raw bytes for cryptographic signature verification.

- **Defect in `api/admin-quotations.js`:**
  - `api/admin-quotations.js` **does not export `config = { api: { bodyParser: false } }`**.
  - `api/admin-quotations.js` **does not read the raw HTTP stream**.
  - Instead, lines 80-85 execute:
    ```javascript
    if (req.rawBody === undefined || req.rawBody === null) {
      return res.status(503).json({
        error: 'Webhook raw body required for signature verification.',
        code: 'WEBHOOK_RAW_BODY_REQUIRED',
      });
    }
    ```
  - In production Vercel environments, `req.rawBody` is **never populated** automatically when default body parsing is enabled.
  - **Impact:** Any delivery webhook from Resend will **always fail with `503 WEBHOOK_RAW_BODY_REQUIRED`**, permanently disabling delivery status tracking.

### 7.2 Non-Standard Webhook Payload Structure Contract
In `api/admin-quotations.js:95-103`:
```javascript
const { quotation, eventPayload } = req.body || {};
if (!quotation || typeof quotation !== 'object') {
  return res.status(400).json({ error: 'Quotation object required', code: 'QUOTATION_REQUIRED' });
}
```
A standard Resend webhook sends only the event object (`{ type: "email.delivered", data: { email_id: "..." } }`). It does not send `{ quotation, eventPayload }`. Even if raw body handling were functional, standard Resend delivery webhooks would be rejected with `400 QUOTATION_REQUIRED`.

### 7.3 Raw Body Loss in `api/email-reply-webhook.js` Mode C
In `api/email-reply-webhook.js:119-128`, if `req.body` is already parsed, it falls back to:
```javascript
const rawBody = JSON.stringify(req.body || {});
```
`JSON.stringify` does not preserve original byte order, whitespace, or unicode sequences, which can cause Svix signature verification failures.

---

## 8. ADVERSARIAL VERIFICATION: CC-07 (ACTOR ATTRIBUTION)

### 8.1 Server-Side Binding
- `api/admin-quotations.js:46-51`: The server correctly extracts `authenticatedActor = authSession.actor || 'admin'` and binds it to all audit events and server-side state transitions.

### 8.2 Client-Side Hardcoded Attribution Remaining in Source
Adversarial search revealed extensive hardcoded author strings in frontend files:
- `src/pages/AdminQuotations.jsx:154`: `owner: 'Sachin Shinde'`
- `src/pages/AdminQuotations.jsx:228, 851, 865`: `changedBy: 'Sachin Shinde'`
- `src/pages/AdminQuotations.jsx:740`: `handleAdminOverrideToggle` sets `actor: 'Sachin Shinde'`
- `src/pages/AdminQuotations.jsx:906`: `handleRecordPoSubmit` sets `receivedBy: 'Sachin Shinde'`
- `src/pages/AdminQuotations.jsx:942`: `handleNegotiationSubmit` sets `author: 'Sachin Shinde'`
- `src/pages/AdminQuotations.jsx:978`: `handleOverrideSubmit` calls `setAdminOverride(..., 'Sachin Shinde')`
- `src/pages/AdminQuotations.jsx:1137`: `handleRecordBuyerResponseSubmit` calls `recordBuyerResponse(..., 'Sachin Shinde')`
- `src/pages/AdminQuotations.jsx:1161`: `handleUpdateFollowUpSubmit` calls `updateFollowUp(..., 'Sachin Shinde')`
- `src/pages/AdminQuotations.jsx:1219`: `handleSaveQuotation` sets `updatedBy: 'Admin (Sachin Shinde)'`
- `src/pages/PrivateDashboard.jsx:291, 309`: submits `actor: 'Sachin Shinde'`
- `src/data/quotationCore.js:177`: `updatedBy: input.updatedBy || 'Admin (Sachin Shinde)'`
- `src/data/leadModel.js:313`: `owner: 'Sachin Shinde'`

When an administrator performs actions directly on the UI and saves the quotation via `action: 'save'`, the client sends these hardcoded strings inside the payload, contaminating the quotation history.

---

## 9. ADVERSARIAL VERIFICATION: CC-08 (RATE LIMITING & IP EXTRACTION)

### 9.1 Redis Lua Implementation
- `api/_lib/auth.js:108-129` implements `ATOMIC_RATE_LIMIT_LUA` with sliding window and fail-closed error handling.
- `api/quotation.js:47` enforces `checkRateLimit(clientIp, 'public_quotation', { maxAttempts: 30, windowSeconds: 900 })`.

### 9.2 Rate Limiting Gaps & IP Fallback Hazards
1. **Unthrottled Sequence Dispatch:**
   - `api/cron-sequence-dispatch.js` does not invoke `checkRateLimit()`, relying solely on `CRON_SECRET` Bearer authentication.
2. **IP Extraction Edge Case (`api/_lib/auth.js:208-232`):**
   - In `getClientIp(req)`, if `x-vercel-forwarded-for` is missing or fails IP sanitization, and `TRUST_PROXY` is not `'1'`, it falls back to:
     ```javascript
     const fallback = req.socket && req.socket.remoteAddress ? req.socket.remoteAddress : '127.0.0.1';
     ```
   - In serverless environments where `socket.remoteAddress` is a private load balancer IP or `undefined`, all such requests collapse into the `'127.0.0.1'` bucket, leading to collective rate-limit exhaustion.

---

## 10. ADVERSARIAL VERIFICATION: AF-01 THROUGH AF-03

- **AF-01 (HTML Injection in Email Notifications):**
  - `api/save-lead.js:20-27`: `escapeHtml()` function properly sanitizes user input fields (`name`, `company`, `email`, `phone`, `requirementDetails`, etc.).
  - *Observation:* `inquiryId` and `quote.quoteId` (`lines 162-163`) are injected directly into HTML without passing through `escapeHtml()`. If an attacker supplies a malicious `inquiryId` in the JSON body, it can bypass escaping.
- **AF-02 (Public Quotation API Rate Limiting):**
  - Implemented in `api/quotation.js:47` (30 requests / 15 minutes).
- **AF-03 (Filename Sanitization):**
  - `api/quotation.js:23-26` implements `sanitizeDownloadFilenameId()` restricting characters to alphanumeric, underscore, and hyphen.

---

## 11. REGRESSION TEST HARNESS AUDIT (`scripts/test_package_3f_106_regression.mjs`)

The test harness was analyzed line by line to determine the authenticity and fidelity of the reported test results.

### 11.1 Test Suite Structure
The test file defines 22 `runTest` blocks:
- `T-01.1` to `T-01.3`: Safe timing compare and length resistance.
- `T-02.1` to `T-02.3`: Precedence resolution.
- `T-03.1`: Gate verification handler.
- `T-04.1` & `T-04.2`: Session creation, HMAC signing, and tampering detection.
- `T-05.1` & `T-05.2`: Session verification, KV revocation, and fail-closed behavior.
- `T-06.1`: Origin checking.
- `T-07.1`: CSRF token generation and validation.
- `T-08.1`: Admin quotations mutation origin and CSRF rejection.
- `T-09.1`: Excel credential decoupling.
- `T-10.1`: Webhook signature verification stubs.
- `T-11.1`: Admin quotations actor audit tracking.
- `T-12.1`: Rate limiter sliding window and fail-closed state.
- `T-13.1`: Corrupt counter recovery.
- `T-14.1`: Concurrency safety.
- `T-15.1`: Sensitive routes audit (AF-01, AF-02, AF-03).
- `T-16.1`: End-to-end commercial quotation workflow.

### 11.2 Fidelity Limitations of Local Test Harness
1. **Edge Middleware Not Tested:** Tests invoke `api/*.js` handlers directly in Node.js. `middleware.js` was never loaded or executed during regression testing, masking the `verifyCookieFormat` blocker.
2. **Mock KV Emulated Lua:** In `installMockKvFetch` (`lines 252-269`), Redis Lua scripts (`EVAL`) were simulated with a mock JavaScript implementation rather than being executed by a real Redis engine.
3. **Synthetic `req.rawBody` Injection:** In webhook tests, `req.rawBody` was manually populated on the synthetic request object, masking the fact that Vercel serverless does not populate `req.rawBody` on `api/admin-quotations.js`.
4. **Untested Affiliate Login:** The test harness set `AFFILIATE_PASSWORD` instead of `AFFILIATE_PORTAL_PASSWORD`, skipping live affiliate authentication flows.

---

## 12. FINAL FINDINGS REGISTER

| Finding ID | Corrective Action / Vulnerability | Status | Severity | Production Blocker? | Root Cause Summary |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **F-107-01** | `middleware.js` Cookie Rejection | **PARTIALLY_FIXED** | **CRITICAL** | **YES** | `middleware.js:19-21` requires cookie prefix (`avani_gate_sess_`), rejecting 64-hex tokens from `api/_lib/auth.js:513`. |
| **F-107-02** | `api/admin-quotations.js` Raw Body | **BLOCKED** | **CRITICAL** | **YES** | Lacks `bodyParser: false`; `req.rawBody` is `undefined` on Vercel Node runtime (`503`). |
| **F-107-03** | Webhook Edge Middleware Rejection | **BLOCKED** | **HIGH** | **YES** | `middleware.js` intercepts `/api/admin-quotations?action=delivery-webhook` and returns `401`. |
| **F-107-04** | Resend Webhook Payload Contract | **BLOCKED** | **HIGH** | **YES** | `api/admin-quotations.js:95-103` requires `{ quotation, eventPayload }`, which Resend does not send. |
| **F-107-05** | Legacy Password in `middleware.js` | **PARTIALLY_FIXED** | **HIGH** | **NO** | `middleware.js:38-41` retains Bearer master password check and legacy reversed precedence. |
| **F-107-06** | Env Var Documentation Mismatches | **PARTIALLY_FIXED** | **HIGH** | **NO** | `KV_REQUIRED` documented vs `REQUIRE_DISTRIBUTED_KV` in code; `ALLOWED_ORIGIN` vs `ALLOWED_ORIGINS`. |
| **F-107-07** | Client Hardcoded Actor Attribution | **PARTIALLY_FIXED** | **MEDIUM** | **NO** | `AdminQuotations.jsx` & `PrivateDashboard.jsx` hardcode `'Sachin Shinde'` in client state and payloads. |
| **F-107-08** | CSRF Token Storage Collision | **PARTIALLY_FIXED** | **MEDIUM** | **NO** | Gate and Affiliate roles share identical cookie and `sessionStorage` key (`avani_csrf_token`). |
| **F-107-09** | Empty Origin/Referer Bypass | **PARTIALLY_FIXED** | **MEDIUM** | **NO** | `isAllowedOrigin()` permits empty origin headers on non-mutation endpoints (`save-lead`, `quotation`). |
| **F-107-10** | Missing ESLint & `.env.example` | **NOT_FIXED** | **LOW** | **NO** | `eslint` binary absent; `.env.example` missing from repository root. |
| **CC-05** | Credential Decoupling in Excel | **FIXED_AND_TESTED** | N/A | **NO** | Decoupled; `CREDENTIAL_COUPLING_FORBIDDEN` enforced; documentation updated. |
| **AF-01** | HTML Injection Sanitization | **FIXED_AND_TESTED** | N/A | **NO** | HTML escaping applied to user inputs in `api/save-lead.js` (minor unescaped `inquiryId` noted). |
| **AF-02** | Rate Limiting on Quotation API | **FIXED_AND_TESTED** | N/A | **NO** | Sliding window rate limit enforced in `api/quotation.js`. |
| **AF-03** | Filename Path Sanitization | **FIXED_AND_TESTED** | N/A | **NO** | Alphanumeric and hyphen sanitization enforced. |

---

## 13. PRODUCTION READINESS EVALUATION & RELEASE GATE DECISION

### 13.1 Production Readiness Criteria Checklist

1. **All core security remediations verified at source code level:** **NO** (Blocked by `middleware.js` and `api/admin-quotations.js`).
2. **All core workflows tested locally without errors:** **YES** (In local mock harness; however, mock harness masked edge middleware and raw stream parsing issues).
3. **Environment variable configuration verified and documented accurately:** **NO** (Multiple naming discrepancies identified between documentation and code).
4. **Build and runtime execution verified against declared versions:** **PARTIAL** (Build succeeds; but Vite version cited in report was inaccurate, and ESLint is missing).
5. **Zero regressions in public quotation, catalog, or inquiry workflows:** **YES** (Public catalog and inquiry workflows remain functional).
6. **Zero bypass paths remaining for administrative or privileged functions:** **NO** (`middleware.js:38-41` still permits raw Bearer password).
7. **External services and production database untouched:** **YES** (Verified).
8. **Owner sign-off package prepared with transparent status:** **YES** (Delivered in this report).

---

## 14. FINAL RECOMMENDATION

### **MAINTAIN PRODUCTION HOLD — DO NOT DEPLOY TO PRODUCTION**

Deploying the current codebase to production will result in:
1. Immediate failure of administrative access to quotations (`/api/admin-quotations` blocked by Edge Middleware `verifyCookieFormat`).
2. Permanent failure of delivery status webhooks (`503 WEBHOOK_RAW_BODY_REQUIRED` and `401 Unauthorized` at Edge).
3. Potential operational lockout if operator relies on documented `KV_REQUIRED=1` instead of `REQUIRE_DISTRIBUTED_KV=1`.

### Required Remediations for Package 3F.108:
1. Update `middleware.js` to support 64-hex un-prefixed session tokens, remove legacy Bearer password bypass, and allow webhook paths to pass to handler-level signature checks.
2. Configure `export const config = { api: { bodyParser: false } }` in `api/admin-quotations.js` and implement streaming raw-body retrieval.
3. Align webhook payload contract in `api/admin-quotations.js` with standard Resend webhook schemas.
4. Harmonize environment variable names across code and documentation.
5. Replace remaining client-side `'Sachin Shinde'` hardcoded author strings with dynamic session actor values.
