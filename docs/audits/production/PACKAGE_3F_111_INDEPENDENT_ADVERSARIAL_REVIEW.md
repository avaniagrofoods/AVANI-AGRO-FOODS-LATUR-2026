# PACKAGE 3F.111 — INDEPENDENT ADVERSARIAL VERIFICATION REPORT
# FORENSIC AUDIT OF PACKAGE 3F.110 (QUOTATION PERSISTENCE, WEBHOOK IDEMPOTENCY & SECURITY)

**PROJECT:** AVANI AGRO FOODS WEBSITE ENGINE (PROJECT A ONLY)  
**CANONICAL ROOT:** `C:\Users\ALPHA-1\Downloads\21MAY2026\SACHIN SHINDE DOCUMENTS\DEVELOPEMENT TOOLS\2-AVANI AGRO FOODS LATUR 2026`  
**DATE OF AUDIT:** 16 NOVEMBER 2026  
**MODE:** STRICT READ-ONLY FORENSIC AUDIT  
**BASELINE REPORTED HEAD:** `24a10079ee02c845bf8d0deaadfc318772bcd321`  
**CURRENT VERIFIED HEAD:** `24a10079ee02c845bf8d0deaadfc318772bcd321` (Branch: `main`)  
**ACTIVE GOVERNANCE LOCKS:**  
`GLOBAL_OUTREACH_STOP=1` · `OUTREACH_AUTHORIZED=0` · `PILOT_AUTHORIZED=0` · `PRODUCTION_AUTHORIZED=0` · `DEPLOYMENT_AUTHORIZED=0` · `REMOTE_PUSH_AUTHORIZED=0` · `GIT_MUTATION_AUTHORIZED=0`  

---

## 1. EXECUTIVE SUMMARY

Package 3F.111 represents an exhaustive, read-only adversarial audit of Package 3F.110. Package 3F.110 attempted to resolve four major architectural requirements:
1. Server-side quotation persistence in Supabase Postgres.
2. Distributed webhook idempotency with atomic lease claiming in Upstash KV.
3. Resend email delivery status tracking (`sent`, `delivered`, `bounced`, `opened`, `complained`).
4. Remediation of residual hardcoded operator attribution (`Sachin Shinde` -> role-bound `authenticated_operator`).

### Key Audit Findings
While Package 3F.110 established the foundation for Supabase schema migrations, PostgREST helper methods, and Svix webhook handling, **adversarial forensic analysis identified multiple critical and high-severity defects** that prevent production release:

1. **Foreign Key Violation & Data Loss on Quotation Save (CRITICAL):**  
   `src/data/quotationCore.js:29` synthesizes a non-existent `inquiryId` (`AAF-INQ-2026-XXXXXX`) whenever an enquiry is created or recalculated. `saveQuotationToSupabase` (`api/_lib/supabaseClient.js:225`) sends this synthetic ID to `public.quotations(inquiry_id)`, which enforces a foreign key constraint referencing `public.leads(inquiry_id)`. Because the lead does not exist in `public.leads`, PostgreSQL immediately rejects the insert with error `23503 foreign_key_violation`. In `api/admin-quotations.js:539`, this error is caught and deferred (`console.warn`), silently failing persistence while returning HTTP 200 to the admin operator.
2. **KV Outage Swallowing Causes Permanent Webhook Dropping (CRITICAL):**  
   In `api/_lib/quotationModel.js:542,569`, `claimQuotationWebhookDistributed` imports `authModule.execKVCommand` (the legacy wrapper that swallows errors and returns `null`) instead of `execKVCommandStrict`. When Upstash KV suffers a timeout, HTTP 5xx, or network failure, `execKVCommand` returns `null`. The code falls through to line 569, interprets the null result as an existing duplicate claim with status `'PROCESSED'`, and returns `{ claimed: false, duplicate: true, status: 'PROCESSED' }`. In `api/admin-quotations.js:249-255`, this causes the webhook handler to return HTTP 200 OK duplicate ACK to Resend, permanently dropping the webhook delivery event without retry.
3. **Missing Distributed Worker Fencing & Late-Completion Race (HIGH):**  
   In `completeQuotationWebhookDistributed` (`api/_lib/quotationModel.js:619-653`), although `workerId` is passed as a parameter, it is never compared against the active lease in KV before overwriting with `PROCESSED`. No atomic Compare-And-Swap (CAS) or Lua script is used. A worker whose 60-second lease expired due to event processing delays can complete late and overwrite a newer worker's active lease.
4. **Premature Webhook Idempotency Completion on Database Failure (HIGH):**  
   In `api/admin-quotations.js:276, 336-347`, errors during `saveQuotationToSupabase` or `updateQuotationDeliveryStatusInSupabase` are swallowed in local `catch` blocks. The handler then proceeds to line 343, executes `completeQuotationWebhookDistributed`, and returns HTTP 200 OK. Resend treats the event as successfully processed, preventing delivery retry and permanently losing database delivery status synchronization.
5. **In-Flight Webhook Concurrency Suppresses Retry (HIGH):**  
   In `api/admin-quotations.js:250-254`, when an event is currently in-flight (`claim.status === 'CLAIMED'`), the handler immediately returns HTTP 200 OK (`code: 'EVENT_IN_FLIGHT'`). If Worker 1 crashes before database update and lease expiry, Resend will never retry because it received an HTTP 200 OK acknowledgment.
6. **Delivery State Machine Regresses State & Lacks Monotonic Guards (HIGH):**  
   In `api/admin-quotations.js:309-326`, `deliveryStatus` initializes to `'pending'`. Unsupported or supplementary Resend events (such as `email.clicked` or `email.delivery_delayed`) fall through all `if/else if` branches and update the database with `delivery_status = 'pending'`, actively regressing a quotation that was already in `'delivered'` state. Furthermore, out-of-order events are not fenced (e.g. `delivered` after `bounced`).
7. **PostgREST Column Name Snake/Camel Mismatch Collapses UI Records (HIGH):**  
   `fetchQuotationsFromSupabase` (`api/_lib/supabaseClient.js:374`) returns raw PostgreSQL snake_case columns (`quotation_id`, `buyer_name`, `grand_total`). In `src/pages/AdminQuotations.jsx:355-356`, the frontend merges records using `q.quotationId || q.quoteId`. For Supabase records, both fields are `undefined`, causing the `Map` deduplication to collapse all database quotations into a single key (`undefined`), corrupting the admin dashboard quotation list.

### Final Verdict for Package 3F.111
**`INDEPENDENT_REVIEW_PASSED_WITH_PRODUCTION_BLOCKERS`**  
The independent verification successfully identified all architectural and runtime gaps. Production deployment is strictly blocked until corrective implementation under Package 3F.112 is authorized and executed.

---

## 2. REPOSITORY STATE AND BOUNDARIES

### 2.1 Git Repository Verification
- **Current HEAD Commit:** `24a10079ee02c845bf8d0deaadfc318772bcd321` (Verified via `git rev-parse HEAD`)
- **Current Branch:** `main` (Verified via `git branch --show-current`)
- **Reported Baseline HEAD:** `24a10079ee02c845bf8d0deaadfc318772bcd321` (Exact match: zero unauthorized commits or history rewrites).
- **Working Tree State:** Dirty. 28 tracked files modified, 21 untracked files present.

### 2.2 Strict Boundary Preservation
1. **Project B (`AVANI_AGRO_INTELLIGENCE`):** Strictly excluded. Not opened, read, searched, or referenced.
2. **Quarantined Files:**
   - `api/_data/sequenceStateStore.json`: **UNTOUCHED / NOT ACCESSED**
   - `api/_data/importersData.js`: **UNTOUCHED / NOT ACCESSED**
   - `api/_data/importersData.snapshot-642.json`: **UNTOUCHED / NOT ACCESSED**
   - `api/_data/manufacturersData.js`: **UNTOUCHED / NOT ACCESSED**
3. **Git Mutation Operations:** `git reset`, `git clean`, `git checkout --`, and `git restore` were **NEVER** executed. All pre-existing work and untracked files are preserved.

### 2.3 Inventory of Tracked Modifications (28 Files)
```
.gitignore
api/_lib/auth.js
api/_lib/quotationEngine.js
api/_lib/quotationModel.js
api/_lib/supabaseClient.js
api/admin-quotations.js
api/affiliate-auth.js
api/email-reply-webhook.js
api/importers.js
api/lead-qualification.js
api/leads.js
api/manufacturers.js
api/quotation.js
api/save-lead.js
api/verify-gate.js
middleware.js
src/components/AffiliateAuthGuard.jsx
src/components/PasswordGate.jsx
src/components/PrivateNav.jsx
src/data/leadModel.js
src/data/quotationCore.js
src/data/quotationModel.js
src/pages/AdminQuotations.jsx
src/pages/AffiliateLogin.jsx
src/pages/Contact.jsx
src/pages/PrivateDashboard.jsx
supabase/migrations/20261103_init_b2b_leads.sql
supabase/schema.sql
```

### 2.4 Inventory of Untracked Files (21 Files)
```
.env.example
docs/audits/production/PACKAGE_3F_106_ARCHITECTURE_AUDIT.md
docs/audits/production/PACKAGE_3F_106_CHANGE_AND_ROLLBACK_MANIFEST.md
docs/audits/production/PACKAGE_3F_106_DEFECT_REGISTRY_AND_CORRECTIVE_ACTIONS.md
docs/audits/production/PACKAGE_3F_106_INDEPENDENT_ADVERSARIAL_REVIEW.md
docs/audits/production/PACKAGE_3F_106_MASTER_ENVIRONMENT_RECOVERY_REPORT.md
docs/audits/production/PACKAGE_3F_106_REGRESSION_REPORT.md
docs/audits/production/PACKAGE_3F_107_INDEPENDENT_ADVERSARIAL_REVIEW.md
docs/audits/production/PACKAGE_3F_108_CHANGE_AND_ROLLBACK_MANIFEST.md
docs/audits/production/PACKAGE_3F_108_IMPLEMENTATION_REPORT.md
docs/audits/production/PACKAGE_3F_108_REGRESSION_REPORT.md
docs/audits/production/PACKAGE_3F_109_INDEPENDENT_POST_REMEDIATION_REVIEW.md
docs/audits/production/PACKAGE_3F_110_ARCHITECTURE_AND_SCHEMA_DESIGN.md
docs/audits/production/PACKAGE_3F_110_CHANGE_AND_ROLLBACK_MANIFEST.md
docs/audits/production/PACKAGE_3F_110_IMPLEMENTATION_REPORT.md
docs/audits/production/PACKAGE_3F_110_REGRESSION_REPORT.md
scripts/test_package_3f_106_regression.mjs
scripts/test_package_3f_108_regression.mjs
scripts/test_package_3f_110_regression.mjs
src/lib/csrf.js
supabase/migrations/20261110_quotations_table.sql
```

### 2.5 Inspection of the Post-3F.106 Test Failure Modification in `api/admin-quotations.js`
In Package 3F.106 regression test `T-10.1` (`scripts/test_package_3f_106_regression.mjs:931-945`), the test asserts:
```javascript
// Replay exact same webhook event -> rejected (400 Duplicate webhook event rejected)
assert.equal(replayWebhook.res.statusCode, 400);
assert.match(String(replayWebhook.res.body?.error), /Duplicate webhook event rejected/i);
```
However, in standard Resend/Svix webhook processing, a duplicate webhook delivery event must return **HTTP 200 OK** (idempotent ACK) so the webhook provider does not continuously retry an event that was already completed.

To satisfy both requirements, `api/admin-quotations.js:242-255` introduced a dual-branch check:
```javascript
if (claim.duplicate) {
  if (quotation && typeof quotation === 'object') {
    return res.status(400).json({
      error: `Duplicate webhook event rejected (replay protection): ${eventId}`,
      code: 'DUPLICATE_WEBHOOK_EVENT'
    });
  }
  return res.status(200).json({
    success: true,
    duplicate: true,
    message: `Webhook event ${eventId} already processed or in-flight. Idempotent acknowledgment.`,
    code: claim.status === 'CLAIMED' ? 'EVENT_IN_FLIGHT' : 'EVENT_ALREADY_PROCESSED'
  });
}
```
**Impact Analysis:**  
While this allows the legacy 3F.106 test harness (which passes an in-memory `quotation` object in the body) to receive HTTP 400, real incoming Resend webhooks (which do not attach a quotation object) receive HTTP 200 OK. However, as noted in FIND-111-05, returning HTTP 200 on `claim.status === 'CLAIMED'` is dangerous because an in-flight worker that subsequently crashes will never have its event retried by Resend.

---

## 3. SOURCE-BASED FINDINGS REGISTER

| Finding ID | Severity | File & Line | Summary | Required Correction |
|:---|:---:|:---|:---|:---|
| **FIND-111-01** | **CRITICAL** | `src/data/quotationCore.js:29`, `api/_lib/supabaseClient.js:225` | Synthetic `inquiryId` triggers Foreign Key Violation (`23503`) against `public.leads(inquiry_id)`, blocking all quotation inserts. | Only set `inquiry_id` if verified against an existing lead, or leave `NULL` on pure quotations. Map nested buyer fields safely. |
| **FIND-111-02** | **CRITICAL** | `api/_lib/quotationModel.js:542,569`, `api/admin-quotations.js:249` | Non-strict `execKVCommand` swallows Redis outages as `null`, faking a duplicate `'PROCESSED'` event and returning HTTP 200 to Resend, permanently dropping webhooks. | Use `execKVCommandStrict`, fail closed (HTTP 503) on KV error, mandate distributed KV in production runtime. |
| **FIND-111-03** | **HIGH** | `api/_lib/quotationModel.js:619-653` | `completeQuotationWebhookDistributed` does not verify worker lease ownership before overwriting key, permitting late expired workers to clobber active leases. | Enforce worker token verification (via Lua script or conditional CAS check) before setting `PROCESSED`. |
| **FIND-111-04** | **HIGH** | `api/admin-quotations.js:276, 336-347` | Database errors in webhook delivery update are caught and ignored, then the handler marks event completed in KV and returns HTTP 200. | Re-throw database failures, do NOT mark event completed in KV, return HTTP 500/503 so Resend retries. |
| **FIND-111-05** | **HIGH** | `api/admin-quotations.js:250-254` | In-flight duplicate claim (`status === 'CLAIMED'`) returns HTTP 200, suppressing provider retry if the active worker crashes. | Return HTTP 429 or 503 (`Retry-After: 15`) while event is in-flight, so provider retries if worker dies. |
| **FIND-111-06** | **HIGH** | `api/admin-quotations.js:309-326` | `deliveryStatus` initializes to `'pending'`, causing unsupported events (`email.clicked`) to overwrite `'delivered'` with `'pending'`. | Implement strict monotonic delivery state machine. Ignore unsupported events without mutating state. |
| **FIND-111-07** | **HIGH** | `api/_lib/supabaseClient.js:223-283` | Unconditional upsert (`resolution=merge-duplicates`) overwrites delivery tracking timestamps and statuses when quote is re-saved. | Exclude delivery tracking columns from draft save upserts, or use conditional update queries. |
| **FIND-111-08** | **HIGH** | `src/pages/AdminQuotations.jsx:355-356`, `api/_lib/supabaseClient.js:374` | PostgREST returns snake_case rows; frontend reads camelCase (`quoteId`), causing all DB records to merge into `undefined` in UI `Map`. | Normalize PostgREST rows to canonical frontend quotation schema (`quoteId`, `buyerName`, etc.) in API GET route. |
| **FIND-111-09** | **MEDIUM** | `api/admin-quotations.js:732-738`, `api/_lib/supabaseClient.js:324-334` | `action=send-buyer` only issues PATCH to Supabase (fails if not pre-saved) and does not persist `sent_at`. | Support `sentAt` in `updateQuotationDeliveryStatusInSupabase`, or ensure full upsert before dispatch. |
| **FIND-111-10** | **MEDIUM** | `supabase/migrations/20261103_init_b2b_leads.sql:115`, `20261110_quotations_table.sql:70-87` | Historical migration edited; RLS policy name discrepancy creates orphaned duplicate policies on existing databases. | Revert historical migration to immutable state; align policy drop/create names in new migration. |
| **FIND-111-11** | **MEDIUM** | `src/pages/AdminQuotations.jsx:1161,1219`, `src/pages/PrivateDashboard.jsx:226` | Actor attribution uses generic `'authenticated_operator'` string literal instead of session-bound verified actor. | Bind all audit actions to verified session actor (`gate_operator:session_<id>`). |
| **FIND-111-12** | **MEDIUM** | `scripts/test_package_3f_110_regression.mjs` | Regression tests assert only unconfigured error codes and in-memory mocks; no tests for DB persistence, concurrency, or lease fencing. | Add comprehensive integration and failure-recovery test suites in Package 3F.112. |
| **FIND-111-13** | **LOW** | `PACKAGE_3F_110_CHANGE_AND_ROLLBACK_MANIFEST.md:14-29`, `.env.example` | Manifest underreports working tree file counts; `.env.example` lacks Upstash Redis alias documentation. | Correct change manifest inventory and document all environment aliases in `.env.example`. |

---

## 4. MIGRATION AND SCHEMA ASSESSMENT

### 4.1 Schema Definitions: `20261110_quotations_table.sql` vs `schema.sql`
- **Table Structure:** `public.quotations` defines 24 primary columns, with 9 additional delivery tracking and attribution columns added in Package 3F.110:
  - `buyer_email VARCHAR(255)`
  - `provider_message_id VARCHAR(255)`
  - `provider_name VARCHAR(50) DEFAULT 'resend'`
  - `sent_at TIMESTAMPTZ`
  - `delivered_at TIMESTAMPTZ`
  - `bounced_at TIMESTAMPTZ`
  - `delivery_status VARCHAR(50) DEFAULT 'pending'`
  - `created_by VARCHAR(100) DEFAULT 'authenticated_operator'`
  - `updated_by VARCHAR(100) DEFAULT 'authenticated_operator'`
- **Monetary Precision:** All currency amounts use `NUMERIC(14, 2)` (`subtotal`, `grand_total`) and `NUMERIC(12, 2)` (`freight`, `insurance`, `documentation`, `other_charges`), guaranteeing zero floating-point drift.
- **Provider Message ID Uniqueness:** Partial unique index:
  ```sql
  CREATE UNIQUE INDEX IF NOT EXISTS idx_quotations_unique_provider_msg 
  ON public.quotations (provider_message_id) 
  WHERE provider_message_id IS NOT NULL;
  ```
  This index correctly permits multiple `NULL` records while strictly preventing two distinct quotations from binding to the same Resend `provider_message_id`.

### 4.2 Foreign Key & Data Integrity Defects
1. **Foreign Key Incompatibility:**  
   `inquiry_id VARCHAR(50) REFERENCES public.leads(inquiry_id) ON DELETE SET NULL`
   - In `src/data/quotationCore.js:29`, the pure quotation calculation automatically synthesizes:
     `inquiryId: input.inquiryId || `AAF-INQ-2026-${Math.floor(100000 + Math.random() * 900000)}``
   - When `api/admin-quotations.js:484` calls `calculateQuotation(safeQuoteData)` and passes it to `saveQuotationToSupabase(quote)`, PostgREST attempts to insert a foreign key that does NOT exist in `public.leads`.
   - **Postgres Result:** `ERROR 23503: insert or update on table "quotations" violates foreign key constraint "quotations_inquiry_id_fkey"`.
2. **Audit Trail Schema Compatibility:**  
   `public.lead_audit_logs` defines columns: `id`, `entity_type`, `entity_id`, `action`, `actor`, `previous_state`, `new_state`, `notes`, `created_at`.
   In `api/_lib/supabaseClient.js:386-395`, `recordAuditLog` inserts exact matching columns. However, when entity type is `QUOTATION`, the table name remains `lead_audit_logs`. While functionally compatible, the naming is misleading. More critically, audit insertions are executed asynchronously without a PostgreSQL transaction (`await recordAuditLog().catch(() => {})`), meaning a quotation write can succeed while its audit record is dropped silently.

### 4.3 Historical Migration Modification & RLS Policy Discrepancies
- **Historical Migration Tampering:** In `supabase/migrations/20261103_init_b2b_leads.sql:115`, the historical default was modified from `'Sachin Shinde'` to `'authenticated_operator'`. This violates database migration immutability. If this migration was already executed on a live database, local files and remote migration state will differ.
- **Policy Name Inconsistency:**
  - `20261103_init_b2b_leads.sql:129-142` creates:
    - `"Deny anon access to quotations"`
    - `"Service role full access to quotations"`
  - `20261110_quotations_table.sql:70-87` drops and creates:
    - `"Deny all public access to quotations"`
    - `"Service role has full access to quotations"`
  - On an incremental database run, the old policies from 20261103 will NOT be dropped by 20261110, resulting in redundant duplicate policies.

---

## 5. COMPLETE QUOTATION LIFECYCLE AUDIT

### End-to-End Execution Trace

```
1. Operator Action (UI):
   src/pages/AdminQuotations.jsx:1232 (Save) or :1058 (Send to Buyer)
   ↓
2. Browser HTTP Request:
   POST /api/admin-quotations
   Headers: Cookie: avani_gate_session=<token>, X-CSRF-Token=<csrf>
   Body: { action: 'save', quoteData: {...} } or { action: 'send-buyer', quotation: {...} }
   ↓
3. Vercel Edge Middleware:
   middleware.js:8 matcher: ['/admin/:path*', '/api/admin-:path*']
   middleware.js:74 extracts avani_gate_session cookie
   middleware.js:20 verifies 64-character hex format
   ↓
4. Serverless Handler Body & Stream Resolution:
   api/admin-quotations.js:29 config.api.bodyParser: false
   api/admin-quotations.js:150 getRawBodyAndPayload(req) reads chunks up to 1MB
   ↓
5. Authentication & Origin Gate:
   api/admin-quotations.js:167 isAllowedOrigin(req) checks Origin/Referer
   api/admin-quotations.js:176 checkRateLimit(clientIp, 'admin_quotations', 60, 900)
   api/admin-quotations.js:359 verifyAdminAuth(req) -> verifyServerSession(req, 'gate')
   ↓
6. CSRF Verification:
   api/admin-quotations.js:370 verifyCsrfRequest(req, authSession)
   api/_lib/auth.js:1084 verifies timingSafeEqual(providedToken, expectedToken)
   ↓
7. Quotation Calculation & Persistence:
   api/admin-quotations.js:484 calculateQuotation(safeQuoteData)
   api/admin-quotations.js:538 saveQuotationToSupabase(quote)
   api/_lib/supabaseClient.js:223 POST to PostgREST quotations table (FAILS ON FK: FIND-111-01)
   ↓
8. Dispatch to Buyer:
   api/admin-quotations.js:727 sendQuotationToBuyer(quotation, safeOptions)
   api/_lib/quotationModel.js:21 sendQuotationEmail(...) via Resend API
   api/admin-quotations.js:732 updateQuotationDeliveryStatusInSupabase(qId, { status: 'SENT', ... })
   ↓
9. Webhook Receipt & Signature Verification:
   POST /api/admin-quotations?action=delivery-webhook
   middleware.js:45 EXEMPTION: passes through directly
   api/admin-quotations.js:210 verifySvixSignature(rawBody, headers, resendSecret)
   api/_lib/auth.js:1146 verifies HMAC-SHA256 signature against signed content (svixId.timestamp.rawBody)
   ↓
10. Distributed Event Claim:
   api/admin-quotations.js:241 claimQuotationWebhookDistributed(eventId, workerId)
   api/_lib/quotationModel.js:552 execKV('SET', 'quote_event_claim:'+eventId, data, 'EX', 60, 'NX')
   ↓
11. Delivery State Transition:
   api/admin-quotations.js:306 getQuotationByMessageIdFromSupabase(messageId)
   api/admin-quotations.js:328 updateQuotationDeliveryStatusInSupabase(qId, { status: 'DELIVERED', ... })
   api/_lib/supabaseClient.js:342 recordAuditLog(...)
   ↓
12. Distributed Event Completion:
   api/admin-quotations.js:343 completeQuotationWebhookDistributed(eventId, details, 604800, workerId)
   api/_lib/quotationModel.js:640 execKV('SET', claimKey, completionData, 'EX', 604800)
   ↓
13. Webhook Acknowledgment:
   api/admin-quotations.js:349 returns HTTP 200 { success: true, message: '...' }
```

---

## 6. WEBHOOK SIGNATURE VERIFICATION ORDER

Adversarial analysis of `api/admin-quotations.js:184-245` established the exact execution sequence:

1. **Step 1 — Secret Source Check (Lines 186-193):**  
   Rejects request with HTTP 400 (`UNTRUSTED_SECRET_SOURCE`) if `webhookSecret` or `secret` is supplied in query parameters or request body.
2. **Step 2 — Environment Secret Check (Lines 195-201):**  
   Checks `process.env.RESEND_WEBHOOK_SECRET`. If missing, returns HTTP 503 (`WEBHOOK_UNCONFIGURED`).
3. **Step 3 — Raw Stream Preservation (Lines 203-208):**  
   Verifies that `req.rawBody` contains the unmodified raw string/buffer. If missing, returns HTTP 503 (`WEBHOOK_RAW_BODY_REQUIRED`).
4. **Step 4 — Svix Cryptographic Signature Check (Lines 210-216):**  
   Executes `verifySvixSignature(req.rawBody, req.headers, resendSecret)`. Verifies:
   - Presence of `svix-id`, `svix-timestamp`, `svix-signature`.
   - Timestamp within 300 seconds (5-minute replay window).
   - HMAC-SHA256 signature matching expected base64 digest.
   - If invalid, immediately returns HTTP 401 (`WEBHOOK_UNAUTHORIZED`).
5. **Step 5 — Event ID Extraction & Validation (Lines 222-228):**  
   Extracts `eventId = sigCheck.svixId || eventPayload?.id ...`. If missing, returns HTTP 400 (`MISSING_EVENT_ID`).
6. **Step 6 — Distributed Claim (Lines 240-241):**  
   Only after Steps 1–5 have completely passed does the code invoke `claimQuotationWebhookDistributed(eventId, workerId)`.

**Verdict on Ordering:**  
The verification order is **CRYPTOGRAPHICALLY CORRECT**. Raw bytes are preserved, signature is verified before event claiming, unverified payloads cannot claim event IDs or mutate data, and edge middleware exempts only the exact webhook path.

---

## 7. DISTRIBUTED LEASE OWNERSHIP

Adversarial inspection of `api/_lib/quotationModel.js:530-653`:

1. **Worker Identity Storage:** `workerId` is correctly embedded in the claim payload (`{"status":"CLAIMED","workerId":"worker_..."}`).
2. **Claim Atomicity:** `SET quote_event_claim:<id> <data> EX 60 NX` is atomic in Redis/KV.
3. **Ownership Verification on Completion (DEFECT):**  
   `completeQuotationWebhookDistributed(eventId, details, 604800, workerId)` takes `workerId`, but line 640 simply runs:
   ```javascript
   await execKV('SET', claimKey, completionData, 'EX', String(retentionSeconds));
   ```
   It **NEVER verifies** that the key currently in Redis still belongs to `workerId`. If Worker 1 takes 65 seconds (exceeding the 60s lease), Redis expires the key. Worker 2 claims the key. Worker 1 then completes late and blindly overwrites Worker 2's lease with `PROCESSED`.
4. **Error Propagation (DEFECT):**  
   `claimQuotationWebhookDistributed` uses `authModule.execKVCommand` which catches errors and returns `null`. On KV failure, `null` is converted to `{ claimed: false, duplicate: true, status: 'PROCESSED' }`, causing silent dropping of events.
5. **In-Memory Fallback in Production (DEFECT):**  
   When KV is unconfigured, lines 580-613 silently fall back to `localWebhookClaims` (`Map`). In Vercel serverless multi-instance production, this provides zero multi-region deduplication.

---

## 8. FAILURE AND RETRY MATRIX (19 SCENARIOS)

| # | Scenario | Current Behavior | Expected Safe Behavior | Data Loss / Duplicate Risk | Retry Implication | Severity |
|:---:|:---|:---|:---|:---:|:---:|:---:|
| 1 | **Invalid Svix Signature** | Returns HTTP 401 (`WEBHOOK_UNAUTHORIZED`). No claim made. | Return HTTP 401 immediately. | None | Resend retries until secret fixed or drops. | Verified Safe |
| 2 | **Invalid Event Structure** | Fails payload validation, returns HTTP 400. | Return HTTP 400 immediately. | None | Provider does not retry. | Verified Safe |
| 3 | **Missing Event ID** | Returns HTTP 400 (`MISSING_EVENT_ID`). | Return HTTP 400 immediately. | None | Provider does not retry. | Verified Safe |
| 4 | **KV Claim Backend Unavailable** | `execKVCommand` catches error, returns `null`, handler returns HTTP 200 duplicate ACK. | Fail closed: return HTTP 503 (`DISTRIBUTED_KV_UNAVAILABLE`). | **HIGH:** Event silently dropped permanently. | Resend thinks event succeeded; will never retry. | **CRITICAL** |
| 5 | **Database Unavailable on Webhook** | PostgREST error caught in local try/catch; handler proceeds to complete KV claim and returns HTTP 200. | Re-throw error; do NOT complete KV claim; return HTTP 503. | **HIGH:** Webhook status not saved to DB. | Resend will never retry; state desynchronized forever. | **HIGH** |
| 6 | **Worker Crashes Between Claim & DB** | Lease expires after 60s in KV. | Lease expires; subsequent retry by Resend reclaims event. | Low (if retry occurs). | Resend retries after backoff. | Verified Safe |
| 7 | **Worker Crashes Between DB & Completion** | DB is updated, but KV key expires after 60s. | On retry, worker sees DB already updated; completes KV idempotently. | Minor: duplicate DB update. | Provider retries once; updates idempotently. | Medium |
| 8 | **Lease Expires During Processing** | Key deleted by Redis TTL. Worker continues running. | Fencing token or CAS check blocks late writes. | Race condition risk with new worker. | New worker can claim concurrently. | **HIGH** |
| 9 | **Another Worker Reclaims Event** | Worker 2 acquires lease via `SET NX EX`. | Worker 2 processes event cleanly. | Duplicate processing if Worker 1 still alive. | Concurrent DB write possible. | **HIGH** |
| 10 | **Original Worker Completes Late** | Worker 1 overwrites Worker 2's claim unconditionally. | Worker 1's write is rejected because lease token does not match. | **HIGH:** Clobbers Worker 2's active claim. | State corruption. | **HIGH** |
| 11 | **Duplicate Arrives While In-Flight** | Returns HTTP 200 (`EVENT_IN_FLIGHT`). | Return HTTP 429/503 (`Retry-After: 15`). | **HIGH:** If Worker 1 dies, Resend drops event. | Resend drops retry because it got HTTP 200. | **HIGH** |
| 12 | **Duplicate Arrives After Completion** | Returns HTTP 200 (`EVENT_ALREADY_PROCESSED`). | Return HTTP 200 idempotent acknowledgment. | None | Correctly acknowledged without reprocessing. | Verified Safe |
| 13 | **Same Event ID, Different Payload** | KV recognizes event ID, returns duplicate ACK; payload ignored. | Reject or flag hash mismatch; or treat by event ID. | Low (event ID is UUID from provider). | None | Verified Safe |
| 14 | **Unknown Provider Message ID** | Lookup returns null; skips DB update, returns HTTP 200. | Log warning; return HTTP 200 or 404 depending on policy. | Low (unrelated email event). | None | Verified Safe |
| 15 | **Two Events Target Same Quotation** | Both claim distinct event IDs in KV; race on PostgREST update. | Atomic DB update with monotonic status fencing. | Last write wins without status monotonicity. | Potential out-of-order state regression. | **HIGH** |
| 16 | **Delivered Arrives After Bounced** | Sets `status = 'DELIVERED'`, overwriting `'BOUNCED'`. | Guard against reversing terminal failure state. | False positive: resurrects dead lead. | Invalid delivery report. | **HIGH** |
| 17 | **Bounced Arrives After Delivered** | Sets `status = 'BOUNCED'`, overwriting `'DELIVERED'`. | Accepted: bounce can be late (asynchronous DSN). | Valid correction. | Accurate bounce tracking. | Verified Safe |
| 18 | **KV Completion OK, DB Update Failed** | Current code completes KV even when DB fails! | KV must ONLY complete if DB update succeeded. | **CRITICAL:** State lost in DB forever. | Resend never retries. | **HIGH** |
| 19 | **DB Update OK, Audit Insertion Failed** | Quote updated; audit log fails silently (`.catch(() => {})`). | Wrap in PostgreSQL transaction or write to local dead-letter queue. | Incomplete audit trail. | Regulatory / compliance gap. | Medium |

---

## 9. DELIVERY STATE MACHINE

### 9.1 Supported Event Matrix
The application integrates with Resend via Svix webhooks. The following events are processed in `api/admin-quotations.js:309-326`:

| Resend Event | Extracted Event Type | Resulting `delivery_status` | Resulting `status` | Defect / Vulnerability |
|:---|:---|:---:|:---:|:---|
| `email.sent` | `email.sent` | `'pending'` | Unchanged | Overwrites `'delivered'` with `'pending'` if arrives late! |
| `email.delivered` | `email.delivered` | `'delivered'` | `'DELIVERED'` | Valid, but uses `new Date()` instead of event timestamp. |
| `email.bounced` | `email.bounced` | `'bounced'` | `'BOUNCED'` | Non-canonical status (`BOUNCED` vs `SEND_FAILED`). |
| `email.complained` | `email.complained` | `'complained'` | Unchanged | Valid tracking. |
| `email.opened` | `email.opened` | `'opened'` | Unchanged | Valid tracking. |
| `email.clicked` | `email.clicked` | `'pending'` *(falls through)* | Unchanged | **DEFECT:** Regresses status to `'pending'`! |
| `email.delivery_delayed` | `email.delivery_delayed` | `'pending'` *(falls through)* | Unchanged | **DEFECT:** Regresses status to `'pending'`! |

### 9.2 Transition Table & Monotonic Invariants

```
                      ┌──────────────────────┐
                      │        DRAFT         │
                      └──────────┬───────────┘
                                 │ send-buyer dispatch
                                 ▼
                      ┌──────────────────────┐
                      │    SENT_TO_BUYER     │
                      │ (delivery: 'sent')   │
                      └───────┬──────┬───────┘
                              │      │
            email.delivered   │      │ email.bounced
                              ▼      ▼
    ┌───────────────────────────┐  ┌───────────────────────────┐
    │         DELIVERED         │  │        SEND_FAILED        │
    │  (delivery: 'delivered')  │  │   (delivery: 'bounced')   │
    └──────────────┬────────────┘  └───────────────────────────┘
                   │
  email.opened     │ (Non-terminal: updates deliveryStatus
  or email.clicked │  without changing terminal business state)
                   ▼
    ┌───────────────────────────┐
    │          OPENED           │
    │    (delivery: 'opened')   │
    └───────────────────────────┘
```

**Required State Machine Invariants:**
1. **Terminal Failure:** Once a quotation enters `SEND_FAILED` / `'bounced'`, an `email.sent` or `email.delivered` event must NOT reverse it without human override.
2. **Terminal Delivery:** Once `delivery_status` is `'delivered'`, late-arriving `email.sent`, `email.delivery_delayed`, or `email.clicked` events must NEVER reset `delivery_status` back to `'pending'`.
3. **Canonical Status Parity:** The database `status` column must use `CANONICAL_QUOTATION_STATUSES` (`'SENT_TO_BUYER'`, `'SEND_FAILED'`, `'DELIVERED'`), avoiding arbitrary strings like `'BOUNCED'` or `'SENT'`.

---

## 10. ACTOR ATTRIBUTION AND AUTHORIZATION

### 10.1 Verified Server Session Identity
In `api/admin-quotations.js:359-381`:
```javascript
const authSession = await verifyAdminAuth(req);
const authenticatedActor = authSession.actor; // e.g. "gate_operator:session_a1b2c3d4e5f6"
const authenticatedRole = authSession.actorRole; // "gate"
```
The server correctly extracts `session.actor` derived from HMAC-verified session cookies (`api/_lib/auth.js:940-975`). All privileged API actions (`processor-confirm`, `admin-override`, `send-buyer`, `save`, `update-followup`) overwrite any client-supplied `req.body.actor` with `authenticatedActor`.

### 10.2 Residual Attribution Defects
1. **Client-Side Hardcoded Operator Defaults:**  
   In `src/pages/AdminQuotations.jsx:1161,1219`, follow-up updates and recalculations pass literal `'authenticated_operator'` in client state payloads.
2. **Fallback Attribution in Database Helpers:**  
   In `api/_lib/supabaseClient.js:255-256`:
   ```javascript
   created_by: quoteRecord.createdBy || 'authenticated_operator',
   updated_by: quoteRecord.updatedBy || 'authenticated_operator'
   ```
   Because `calculateQuotation` in `api/admin-quotations.js:485` sets `quote.updatedBy = authenticatedActor`, the serverless path has the actor, but `quote.createdBy` is omitted and falls back to `'authenticated_operator'`.
3. **Contact & Lead Forms:**  
   In `src/pages/Contact.jsx:280` and `src/pages/PrivateDashboard.jsx:179`, initial workflow records set `owner: 'authenticated_operator'`.

---

## 11. TEST AUTHENTICITY ASSESSMENT

### Breakdown of `scripts/test_package_3f_110_regression.mjs` (18 Tests)

| Test ID | Asserted Scope | Real Infrastructure or Mock? | What It Actually Proves | Test Limitation |
|:---|:---|:---:|:---|:---|
| **T-110-01** | Migration file exists | Local Filesystem | File is non-empty on disk. | Does not validate SQL syntax or DB execution. |
| **T-110-02** | Migration column names | Static String Match | SQL contains expected column strings. | Does not execute against PostgreSQL. |
| **T-110-03** | Indexes & RLS | Static String Match | SQL contains `CREATE INDEX` and `RLS` strings. | Does not verify index planner usage or policy logic. |
| **T-110-04** | `saveQuotationToSupabase` unconfigured | Mock / Env isolation | Code returns `SUPABASE_UNCONFIGURED` when env is unset. | Zero verification of actual PostgREST insert or FK logic! |
| **T-110-05** | `getQuotationById` unconfigured | Mock / Env isolation | Returns error when credentials absent. | No DB read verification. |
| **T-110-06** | `updateQuotationDeliveryStatus` unconfigured | Mock / Env isolation | Fails safely when credentials absent. | No PATCH verification. |
| **T-110-07** | `fetchQuotationsFromSupabase` unconfigured | Mock / Env isolation | Returns empty array when unconfigured. | No pagination or query verification. |
| **T-110-08** | `claimQuotationWebhookDistributed` lease | In-Memory `Map` | Acquired lease in local memory store. | Did not test Redis/Upstash network calls. |
| **T-110-09** | Reject duplicate event ID | In-Memory `Map` | Duplicate key in local Map returns `duplicate: true`. | Did not test Redis atomic `NX` or TTL expiry. |
| **T-110-10** | `completeQuotationWebhookDistributed` TTL | In-Memory `Map` | Sets status `PROCESSED` in local Map. | Did not test worker ownership check or Redis TTL. |
| **T-110-11** | `processDeliveryWebhookAsync` replay | In-Memory `Map` | Throws `DUPLICATE_WEBHOOK_EVENT` on in-memory duplicate. | Mocked in-memory test. |
| **T-110-12** | Handler delivery-webhook replay | Mock Req/Res | Replay of direct webhook returns HTTP 200 duplicate ACK. | Uses local Map; does not test KV network failures. |
| **T-110-13** | Handler GET fallback | Mock Req/Res | GET returns sample quotes when unconfigured. | Verified local fallback behavior only. |
| **T-110-14** | `PrivateDashboard.jsx` operator string | Static Regex | File does not contain `'Sachin Shinde'` at specific lines. | Static text assertion. |
| **T-110-15** | `Contact.jsx` operator string | Static Regex | File does not contain `'Sachin Shinde'` at line 280. | Static text assertion. |
| **T-110-16** | `supabase/schema.sql` operator default | Static Regex | File does not contain `'Sachin Shinde'` in defaults. | Static text assertion. |
| **T-110-17** | CSRF Token separation | Pure Crypto | Gate and Affiliate tokens are cryptographically distinct. | Valid unit crypto test. |
| **T-110-18** | Edge Middleware token regex | Unit Function | Rejects non-64 hex / malformed cookies. | Valid unit regex test. |

**Authenticity Finding:**  
None of the 18 tests execute against real PostgreSQL or Upstash Redis infrastructure. 100% of the tests pass in an unconfigured, isolated environment because they test only missing-credential guardrails and in-memory Map structures. **They completely failed to uncover the Foreign Key violation (FIND-111-01) and the KV outage failure (FIND-111-02).**

---

## 12. ENVIRONMENT AND CONFIGURATION AUDIT

### Environment Variables Inventory vs `.env.example`

| Variable Name | Present in Source? | Present in `.env.example`? | Usage & Sensitivity | Status |
|:---|:---:|:---:|:---|:---:|
| `SESSION_SECRET` | Yes | Yes (Line 12) | 256-bit HMAC secret for cookies & CSRF | Configured & Documented |
| `MASTER_GATE_PASSWORD` | Yes | Yes (Line 16) | Master admin password | Configured & Documented |
| `AFFILIATE_PORTAL_PASSWORD` | Yes | Yes (Line 20) | Affiliate portal password | Configured & Documented |
| `ADMIN_API_KEY` | Yes | Yes (Line 23) | M2M machine token | Configured & Documented |
| `CRON_SECRET` | Yes | Yes (Line 26) | Vercel Cron authorization token | Configured & Documented |
| `REQUIRE_DISTRIBUTED_KV` | Yes | Yes (Line 31) | Mandates distributed KV; fails closed if absent | Configured & Documented |
| `KV_REST_API_URL` | Yes | Yes (Line 34) | Upstash Redis REST URL | Configured & Documented |
| `KV_REST_API_TOKEN` | Yes | Yes (Line 37) | Upstash Redis REST Token | Configured & Documented |
| `UPSTASH_REDIS_REST_URL` | Yes | **Missing** | Alias for `KV_REST_API_URL` | Undocumented in `.env.example` |
| `UPSTASH_REDIS_REST_TOKEN` | Yes | **Missing** | Alias for `KV_REST_API_TOKEN` | Undocumented in `.env.example` |
| `ALLOWED_ORIGINS` | Yes | Yes (Line 42) | CORS / Mutation Origin allowlist | Configured & Documented |
| `RESEND_WEBHOOK_SECRET` | Yes | Yes (Line 47) | Svix webhook HMAC signing secret | Configured & Documented |
| `RESEND_API_KEY` | Yes | Yes (Line 50) | Resend email dispatch key | Configured & Documented |
| `GLOBAL_OUTREACH_STOP` | Yes | Yes (Line 54) | Emergency kill-switch | Configured & Documented |
| `OUTREACH_AUTHORIZED` | Yes | Yes (Line 57) | Operational outreach gate | Configured & Documented |
| `REAL_BUYER_EMAILS` | Yes | Yes (Line 60) | Live external dispatch invariant | Configured & Documented |
| `SUPABASE_URL` | Yes | Yes (Line 64) | PostgREST API URL | Configured & Documented |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Yes (Line 67) | Server-side service role key | Configured & Documented |
| `VITE_SUPABASE_URL` | Yes | **Missing** | Fallback for client/Vite builds | Document in `.env.example` |

---

## 13. ROLLBACK AND MIGRATION SAFETY

1. **Historical Migration Immutability:**  
   `supabase/migrations/20261103_init_b2b_leads.sql` must be reverted to its original baseline state (`DEFAULT 'Sachin Shinde'`). Any changes to column defaults must be executed via `ALTER TABLE ... ALTER COLUMN SET DEFAULT` in the new migration `20261110_quotations_table.sql`.
2. **Reversibility of Migration 20261110:**  
   A formal rollback script `20261110_quotations_table_down.sql` must be prepared containing:
   ```sql
   DROP POLICY IF EXISTS "Service role has full access to quotations" ON public.quotations;
   DROP POLICY IF EXISTS "Deny all public access to quotations" ON public.quotations;
   DROP INDEX IF EXISTS public.idx_quotations_unique_provider_msg;
   DROP INDEX IF EXISTS public.idx_quotations_provider_message_id;
   DROP INDEX IF EXISTS public.idx_quotations_delivery_status;
   -- Do not DROP TABLE in production without explicit data backup
   ```
3. **Source Rollback Boundaries:**  
   All changes across 3F.106, 3F.108, and 3F.110 remain in the local uncommitted working tree. Individual packages cannot be rolled back via `git reset` or `git checkout` without destroying all subsequent remediations. Rollback must be managed via surgical patch management.

---

## 14. PRIORITIZED BLOCKER REGISTER

### Critical Blockers (Release Blocker — Must Fix Before Any Deployment)
1. **BLK-01 (FIND-111-01):** Fix Foreign Key violation on quotation save. Decouple synthetic inquiry ID from foreign key constraint, or insert corresponding lead record prior to quotation creation.
2. **BLK-02 (FIND-111-02):** Eliminate KV error-swallowing in webhook claiming. Replace `execKVCommand` with `execKVCommandStrict`, mandate distributed KV in production runtime, and fail closed (HTTP 503) on Redis outages.

### High-Risk Blockers (Corrective Implementation Required)
3. **BLK-03 (FIND-111-03):** Implement worker ownership verification and fencing tokens in `completeQuotationWebhookDistributed` to prevent late-completing workers from clobbering newer leases.
4. **BLK-04 (FIND-111-04):** Prevent premature webhook completion on database failure. If PostgreSQL update fails, re-throw error and return HTTP 500/503 so Resend retries.
5. **BLK-05 (FIND-111-05):** Return HTTP 429/503 on in-flight webhook claims instead of HTTP 200, preserving provider retry capacity if the worker crashes.
6. **BLK-06 (FIND-111-06):** Fix delivery state machine: prevent `email.clicked` and other unsupported events from regressing status to `'pending'`, enforce canonical status names, and prevent out-of-order state reversals.
7. **BLK-07 (FIND-111-07):** Constrain quotation upserts to prevent overwriting delivery tracking fields when quotes are modified in the admin UI.
8. **BLK-08 (FIND-111-08):** Normalize PostgREST snake_case rows to camelCase in `api/admin-quotations.js` GET handler to prevent UI record collapse.

### Medium-Risk Blockers (Quality, Drift & Attribution)
9. **BLK-09 (FIND-111-09):** Support `sentAt` in `updateQuotationDeliveryStatusInSupabase`, and handle unpersisted quotes in `action=send-buyer`.
10. **BLK-10 (FIND-111-10):** Revert historical migration `20261103_init_b2b_leads.sql` and reconcile RLS policy naming in `20261110_quotations_table.sql`.
11. **BLK-11 (FIND-111-11):** Purge residual `'authenticated_operator'` string fallbacks and bind all audit actions to verified session identity.
12. **BLK-12 (FIND-111-12):** Create real integration and crash-recovery test suites in `scripts/test_package_3f_112_regression.mjs`.

---

## 15. MANDATORY INDEPENDENT REVIEW GATE & RECOMMENDATIONS

### Pre-Implementation Review Gate Summary
The forensic review under Package 3F.111 is complete. In strict adherence to Section 5 of the Master Execution Package:
- **Application source code has NOT been modified during this audit phase.**
- **No tests were executed during this audit phase.**
- **All governance locks remain strictly active:** `GLOBAL_OUTREACH_STOP=1`, `OUTREACH_AUTHORIZED=0`, `PRODUCTION_AUTHORIZED=0`.

### Required Owner Decisions Before Package 3F.112 Authorization
1. **Decision on Quotation Foreign Key:** Confirm whether pure quotations without a pre-existing B2B website enquiry should set `inquiry_id = NULL` (recommended), or whether a companion lead should be automatically synthesized in `public.leads`.
2. **Decision on In-Flight Webhook Retries:** Confirm the retry contract for Resend when an event is in-flight: return HTTP 429 (`Retry-After: 15`) or HTTP 503 to ensure Resend retries if the worker dies.
3. **Authorization to Implement Package 3F.112:** The project owner must explicitly authorize advancing from read-only audit mode to corrective implementation.

---

## 16. FINAL AUDIT VERDICT

```
================================================================================
FINAL VERDICT: INDEPENDENT_REVIEW_PASSED_WITH_PRODUCTION_BLOCKERS
================================================================================
```

The independent verification is successfully completed. Two critical defects, six high-risk defects, four medium-risk defects, and one low-risk defect were conclusively identified and documented with exact file and line references. Production release remains strictly blocked pending corrective implementation under Package 3F.112.
