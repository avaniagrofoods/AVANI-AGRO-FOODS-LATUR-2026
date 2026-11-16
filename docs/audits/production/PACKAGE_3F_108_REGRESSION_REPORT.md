# PACKAGE 3F.108 — REGRESSION VERIFICATION REPORT

**PROJECT:** AVANI AGRO FOODS WEBSITE ENGINE — PROJECT A ONLY  
**CANONICAL ROOT:** `C:\Users\ALPHA-1\Downloads\21MAY2026\SACHIN SHINDE DOCUMENTS\DEVELOPEMENT TOOLS\2-AVANI AGRO FOODS LATUR 2026`  
**DATE:** 10 NOVEMBER 2026  
**MODE:** CONTROLLED LOCAL REGRESSION VERIFICATION  
**BASELINE REPORTED HEAD:** `24a10079ee02c845bf8d0deaadfc318772bcd321`  
**TEST SUITE COMMAND:** `node scripts/test_package_3f_108_regression.mjs`  
**TEST SUITE EXIT CODE:** `0`  
**FINAL TEST STATUS:** **24 PASSED, 0 FAILED (100% PASS RATE)**  
**ADDITIONAL REGRESSION:** **PACKAGE 3F.106 SUITE: 22 PASSED, 0 FAILED**  
**VITE PRODUCTION BUILD:** **EXIT CODE 0 (2,146 MODULES TRANSFORMED)**

---

## 1. TARGETED REGRESSION TEST EXECUTION REGISTER (T-108-01 – T-108-24)

| Test ID | Test Objective | Implementation Path Tested | Classification | Command | Exit Code | Result | Evidence Summary |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **T-108-01** | Verify actual generated 64-hex session format is accepted by Edge Middleware | `middleware.js` -> `verifyCookieFormat` | **REAL_EDGE_MIDDLEWARE** | `node scripts/test_package_3f_108_regression.mjs` | `0` | **PASS** | Valid 64-hex HMAC token passed to `middleware(req)` returns `undefined` (pass-through). |
| **T-108-02** | Verify tampered/invalid session signature is rejected by API verification | `api/_lib/auth.js` -> `verifyServerSession` | **REAL_LOCAL_AUTH** | `node scripts/test_package_3f_108_regression.mjs` | `0` | **PASS** | Tampered signature cookie returns `authenticated: false`, code `SESSION_INVALID_SIGNATURE`. |
| **T-108-03** | Verify expired session token is rejected | `api/_lib/auth.js` -> `verifyServerSession` | **REAL_LOCAL_AUTH** | `node scripts/test_package_3f_108_regression.mjs` | `0` | **PASS** | Session with 1s TTL tested after 1.1s returns `authenticated: false`, code `SESSION_EXPIRED`. |
| **T-108-04** | Verify revoked session in KV/local store is rejected | `api/_lib/auth.js` -> `revokeServerSession` | **REAL_LOCAL_AUTH** | `node scripts/test_package_3f_108_regression.mjs` | `0` | **PASS** | Active session verified, revoked, and subsequent verification returns `SESSION_REVOKED`. |
| **T-108-05** | Verify KV outage during session check fails closed | `api/_lib/auth.js` -> `createServerSession` | **SYNTHETIC_MOCK_KV** | `node scripts/test_package_3f_108_regression.mjs` | `0` | **PASS** | `REQUIRE_DISTRIBUTED_KV=1` with unreachable endpoint returns 503 `SESSION_BACKEND_UNAVAILABLE`. |
| **T-108-06** | Verify legacy Bearer master password is rejected in Edge Middleware | `middleware.js` | **REAL_EDGE_MIDDLEWARE** | `node scripts/test_package_3f_108_regression.mjs` | `0` | **PASS** | `Authorization: Bearer <master_password>` hitting `/api/admin-quotations` returns HTTP 401. |
| **T-108-07** | Verify legitimate admin cookie request reaches API handler and returns quotations | `middleware.js` -> `api/admin-quotations.js` | **REAL_SERVERLESS_FLOW** | `node scripts/test_package_3f_108_regression.mjs` | `0` | **PASS** | GET `/api/admin-quotations` with active session cookie returns HTTP 200 and quotation list. |
| **T-108-08** | Verify unrelated admin routes without session remain protected at Edge | `middleware.js` | **REAL_EDGE_MIDDLEWARE** | `node scripts/test_package_3f_108_regression.mjs` | `0` | **PASS** | POST `/api/admin-quotations?action=save` without session cookie returns HTTP 401 at Edge. |
| **T-108-09** | Verify exact delivery-webhook route bypasses edge cookie check to handler | `middleware.js` | **REAL_EDGE_MIDDLEWARE** | `node scripts/test_package_3f_108_regression.mjs` | `0` | **PASS** | POST `/api/admin-quotations?action=delivery-webhook` returns `undefined` (allowed through). |
| **T-108-10** | Verify other admin routes cannot use webhook exemption | `middleware.js` | **REAL_EDGE_MIDDLEWARE** | `node scripts/test_package_3f_108_regression.mjs` | `0` | **PASS** | POST `/api/admin-quotations?action=delete-all` returns HTTP 401 at Edge. |
| **T-108-11** | Verify original raw webhook stream bytes verified via Svix signature | `api/admin-quotations.js` -> `verifySvixSignature` | **REAL_STREAM_AND_SVIX** | `node scripts/test_package_3f_108_regression.mjs` | `0` | **PASS** | Raw JSON stream verified with valid Svix HMAC and timestamp returns HTTP 200. |
| **T-108-12** | Verify missing raw body is rejected | `api/admin-quotations.js` | **REAL_SERVERLESS_HANDLER** | `node scripts/test_package_3f_108_regression.mjs` | `0` | **PASS** | Webhook request missing raw stream returns 503 `WEBHOOK_RAW_BODY_REQUIRED`. |
| **T-108-13** | Verify invalid webhook signature is rejected | `api/admin-quotations.js` -> `verifySvixSignature` | **REAL_STREAM_AND_SVIX** | `node scripts/test_package_3f_108_regression.mjs` | `0` | **PASS** | Tampered signature header returns HTTP 401 `WEBHOOK_UNAUTHORIZED`. |
| **T-108-14** | Verify expired webhook timestamp is rejected outside 5-minute tolerance | `api/admin-quotations.js` -> `verifySvixSignature` | **REAL_STREAM_AND_SVIX** | `node scripts/test_package_3f_108_regression.mjs` | `0` | **PASS** | Webhook timestamp older than 300 seconds returns HTTP 401 `WEBHOOK_UNAUTHORIZED`. |
| **T-108-15** | Verify valid provider event is mapped to quotation state | `api/_lib/quotationModel.js` | **REAL_MODEL_LOGIC** | `node scripts/test_package_3f_108_regression.mjs` | `0` | **PASS** | `email.delivered` transitions quotation status from `SENT_TO_BUYER` to `DELIVERED`. |
| **T-108-16** | Verify duplicate webhook event is rejected under replay protection | `api/_lib/quotationModel.js` | **REAL_MODEL_LOGIC** | `node scripts/test_package_3f_108_regression.mjs` | `0` | **PASS** | Processing identical `eventId` a second time throws duplicate event rejection error. |
| **T-108-17** | Verify unknown event type is handled safely without corrupting quotation | `api/_lib/quotationModel.js` | **REAL_MODEL_LOGIC** | `node scripts/test_package_3f_108_regression.mjs` | `0` | **PASS** | Unrecognized event type records audit entry while preserving existing status `SENT_TO_BUYER`. |
| **T-108-18** | Verify Gate CSRF token works only for Gate session | `api/_lib/auth.js` -> `verifyCsrfRequest` | **REAL_CSRF_VERIFICATION** | `node scripts/test_package_3f_108_regression.mjs` | `0` | **PASS** | Gate token passes for Gate session; rejected with 403 `CSRF_TOKEN_INVALID` for Affiliate session. |
| **T-108-19** | Verify Affiliate CSRF token works only for Affiliate session | `api/_lib/auth.js` -> `verifyCsrfRequest` | **REAL_CSRF_VERIFICATION** | `node scripts/test_package_3f_108_regression.mjs` | `0` | **PASS** | Affiliate token passes for Affiliate; rejected with 403 `CSRF_TOKEN_INVALID` for Gate session. |
| **T-108-20** | Verify simultaneous Gate and Affiliate sessions do not collide | `api/_lib/auth.js` | **REAL_SESSION_SEPARATION** | `node scripts/test_package_3f_108_regression.mjs` | `0` | **PASS** | Concurrent Gate and Affiliate sessions maintain distinct session IDs, roles, and cookies. |
| **T-108-21** | Verify client actor override cannot change server persisted audit actor | `api/admin-quotations.js` | **REAL_SERVERLESS_HANDLER** | `node scripts/test_package_3f_108_regression.mjs` | `0` | **PASS** | Injected `quoteData.owner: 'MaliciousOverride'` is overwritten by verified server session actor. |
| **T-108-22** | Verify missing Origin behavior matches endpoint mutation policy | `api/_lib/auth.js` -> `validateMutationOrigin` | **REAL_AUTH_POLICY** | `node scripts/test_package_3f_108_regression.mjs` | `0` | **PASS** | Mutation request with absent Origin and Referer returns 403 `ORIGIN_MISSING`. |
| **T-108-23** | Verify existing quotation calculation and generation remains functional | `api/admin-quotations.js` -> `quotationEngine.js` | **REAL_CALCULATION_ENGINE** | `node scripts/test_package_3f_108_regression.mjs` | `0` | **PASS** | POST `action: 'generate'` calculates FOB/CIF prices, charges, and totals accurately. |
| **T-108-24** | Verify existing logout and session revocation behavior remains functional | `api/verify-gate.js` -> `revokeServerSession` | **REAL_LOGOUT_HANDLER** | `node scripts/test_package_3f_108_regression.mjs` | `0` | **PASS** | Logout revokes session in store, clears cookies, and subsequent verification returns 401. |

---

## 2. PRE-EXISTING PACKAGE 3F.106 REGRESSION SUITE VERIFICATION

Command: `node scripts/test_package_3f_106_regression.mjs`  
Exit Code: `0`  
Result: **22 Passed, 0 Failed**  
Key Validations Preserved:
- T-01.1 – T-01.3: Bearer token and legacy cookie rejection.
- T-02.1 – T-02.3: Credential precedence and fail-closed state.
- T-03.1 – T-06.1: Gate session lifecycle, HMAC tamper rejection, KV outage, and logout revocation.
- T-07.1 – T-08.1: Exact origin allowlist and session-bound CSRF token validation.
- T-09.1: Excel generation credential decoupling.
- T-10.1: Plaintext secret rejection on webhooks.
- T-11.1: Privileged mutation server actor attribution.
- T-12.1 – T-14.1: Atomic sliding-window rate limiting.
- T-15.1 – T-16.1: Sensitive route audit, HTML escaping, and end-to-end commercial quotation workflow.

---

## 3. PRODUCTION FRONTEND BUILD VERIFICATION

Command: `npm run build`  
Exit Code: `0`  
Output Summary:
```
vite v5.4.21 building for production...
transforming...
✓ 2146 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                                     6.11 kB │ gzip:  2.04 kB
dist/assets/PrivateNav-DMLaE-K1.js                  3.05 kB │ gzip:  1.28 kB
dist/assets/PasswordGate-DS0qeTlD.js                4.35 kB │ gzip:  1.80 kB
dist/assets/AdminQuotations-DWe0oQ4K.js           106.05 kB │ gzip: 22.62 kB
dist/assets/PrivateDashboard-AuzwXr0i.js           79.21 kB │ gzip: 17.78 kB
✓ built in 24.10s
```

All 2,146 modules transformed and bundled cleanly with zero syntax errors, missing imports, or build failures.

---

## 4. REMAINING TEST LIMITATIONS

1. **Synthetic Redis Lua Evaluation:** In local testing, Redis sliding-window Lua commands are verified via local mocks and test fixtures. Final live Redis cluster verification requires deploying to Vercel with active Upstash Redis instances.
2. **External Email and Webhook Delivery:** Under active safety gates (`GLOBAL_OUTREACH_STOP=1`, `OUTREACH_AUTHORIZED=0`), live external SMTP/Resend delivery was not invoked. All email transport safety invariants were verified to fail closed.
