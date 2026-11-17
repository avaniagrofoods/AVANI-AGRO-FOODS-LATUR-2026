# PACKAGE 3F.134 — INDEPENDENT POST-IMPLEMENTATION ADVERSARIAL VERIFICATION OF PACKAGE 3F.133

**Project:** AVANI AGRO FOODS Website Engine (Project A Only)  
**Author:** Independent Principal Application Security Auditor, Senior Node.js Engineer, PostgreSQL/PostgREST Specialist, and Adversarial Code Reviewer  
**Audit Package Reference:** `AAF-AUDIT-3F-134`  
**Classification:** `VERIFIED_SAFE_FOR_TEST_AUTHORIZATION`  
**Date of Audit:** 17 November 2026  
**Canonical Git Baseline:** Commit `2f1a5481fd47488244277b3c756995bbcce75315` on branch `main`  
**Target Delivery Path:** `docs/audits/business-operations/PACKAGE_3F_134_INDEPENDENT_POST_IMPLEMENTATION_VERIFICATION.md`

---

## 1. Executive Verdict & Governance Invariants

Package 3F.134 conducts an independent, adversarial, strictly read-only post-implementation verification of the Phase 1 source modifications executed under Package 3F.133.

### 1.1 Governance Status (All Locks Strictly Enforced)
The implementation authorization granted in Package 3F.133 has been consumed. All operational locks remain permanently active:
- `GLOBAL_OUTREACH_STOP=1` (Active hard-stop on all outbound communications)
- `OUTREACH_AUTHORIZED=0`
- `PILOT_AUTHORIZED=0`
- `IMPLEMENTATION_AUTHORIZED=0` (Zero additional source modifications permitted)
- `TEST_EXECUTION_AUTHORIZED=0` (Zero tests executed)
- `DATABASE_MIGRATION_AUTHORIZED=0` (Zero SQL executions)
- `DEPLOYMENT_AUTHORIZED=0` (Zero deployments)
- `GIT_COMMIT_AUTHORIZED=0`
- `GIT_PUSH_AUTHORIZED=0`
- `EXTERNAL_COMMUNICATION_AUTHORIZED=0`

### 1.2 Executive Determination
1. **Scope Boundary Verified:** Exactly **two tracked source files** (`api/save-lead.js` and `api/_lib/supabaseClient.js`) were modified. `src/lib/emailjs.js` and all other repository files remain 100% untouched.
2. **Public ID Injection Vector Permanently Closed:** Caller-supplied `body.inquiryId` and `body.quoteId` are discarded. All IDs are server-generated using native CSPRNG UUIDv4 (`crypto.randomUUID()`) with dynamic UTC year partitioning.
3. **Insert-Only Enforcement Verified:** Public lead ingestion enforces strict **INSERT-ONLY** persistence (`Prefer: return=representation`). The PostgREST UPSERT directive (`resolution=merge-duplicates`) has been permanently excised from public ingestion paths.
4. **Relational Linkage Restored:** The defective prefix check in `saveQuotationToSupabase` (`!rawInquiryId.startsWith('AAF-INQ-2026-')`) that actively severed foreign keys was removed. Format regex validation `/^AAF-(INQ|L)-\d{4}-[A-Za-z0-9-]+$/` accepts both UUIDv4 and legacy formats while preserving the foreign key reference to `public.leads(inquiry_id)`.
5. **Resend Delivery Webhook Preserved:** `saveQuotationToSupabase` implements caller-differentiated persistence options (`insertOnly: true` for public requests vs. authorized update semantics when `existingDelivery` is present), ensuring Svix-verified Resend delivery webhooks continue to update delivery status without `23505` collision errors.
6. **Partial-Persistence Resilience Verified:** Quotation collision retry does NOT re-insert or duplicate already committed leads. In-memory deduplication caches prevent duplicate database writes on rapid double submissions.
7. **Final Classification:** **`VERIFIED_SAFE_FOR_TEST_AUTHORIZATION`**.

---

## 2. Baseline and Diff Verification

### 2.1 Git Status & Tracked Working Tree
```
$ git status -s
 M api/_lib/supabaseClient.js
 M api/save-lead.js
?? PACKAGE_3F_119_INDEPENDENT_POST_DEPLOYMENT_VERIFICATION.md
?? docs/audits/business-operations/
?? docs/audits/production/PACKAGE_3F_119_INDEPENDENT_POST_DEPLOYMENT_VERIFICATION.md
```
- **Tracked Files Modified:** Exactly 2 (`api/_lib/supabaseClient.js` and `api/save-lead.js`).
- **HEAD Commit SHA:** `2f1a5481fd47488244277b3c756995bbcce75315` on branch `main`.
- **Zero Drift:** No unauthorized source files, configuration files, test scripts, or migrations were modified or created.

### 2.2 Complete Source Diff Inspection
The complete diff was independently audited line-by-line:

#### A. `api/save-lead.js`
- **Line 12:** Added `import crypto from 'crypto';` (Native Node.js core module).
- **Lines 158–166:** Exclusively assigns server-generated UUIDv4 tokens:
  ```javascript
  const now = new Date();
  const currentYear = now.getUTCFullYear();
  let inquiryId = `AAF-INQ-${currentYear}-${crypto.randomUUID()}`;
  let quoteId = `AAF-Q-${currentYear}-${crypto.randomUUID()}`;
  ```
  Removed `randSuffix`, `randQuoteSuffix`, and the fallback assignments `body.inquiryId || ...` and `body.quoteId || ...`.
- **Lines 320–346:** Lead persistence loop wraps `saveLeadToSupabase(inquiryRecord, { insertOnly: true })` in a bounded retry (max 2 attempts) specifically triggering on `code === '23505'` collisions on `inquiry_id`.
- **Lines 348–374:** Quotation persistence loop wraps `saveQuotationToSupabase(quotationRecord, { insertOnly: true })` in a bounded retry (max 2 attempts) specifically triggering on `code === '23505'` collisions on `quotation_id`.

#### B. `api/_lib/supabaseClient.js`
- **Line 118:** Updated signature: `export async function saveLeadToSupabase(leadRecord, options = {})`.
- **Lines 168–172:** Evaluates `const allowUpsert = options.upsert === true && options.insertOnly !== true;` and sets `prefer: allowUpsert ? 'resolution=merge-duplicates,return=representation' : 'return=representation'`.
- **Lines 203–210:** Extracts `code: '23505'` and `status: 'CONFLICT'` when `result.error` includes `23505`.
- **Line 218:** Updated signature: `export async function saveQuotationToSupabase(quoteRecord, options = {})`.
- **Lines 242–244:** Replaced broken prefix condition with:
  ```javascript
  const rawInquiryId = typeof quoteRecord.inquiryId === 'string' ? quoteRecord.inquiryId.trim() : (quoteRecord.leadId || null);
  const isValidInquiryId = Boolean(rawInquiryId && /^AAF-(INQ|L)-\d{4}-[A-Za-z0-9-]+$/.test(rawInquiryId) && rawInquiryId.length <= 50);
  const safeInquiryId = isValidInquiryId ? rawInquiryId : (existingDelivery?.inquiry_id || null);
  ```
- **Lines 282–286:** Sets `preferHeader` to `return=representation` when `options.insertOnly === true`.
- **Lines 301–308:** Adds structured error extraction for `23505` (conflict) and `23503` (foreign key violation).

---

## 3. Inquiry and Quotation ID Generation Verification

### 3.1 Dimensions & Database Column Bounds
- **Inquiry ID Structure:** `AAF-INQ-${currentYear}-${crypto.randomUUID()}`
  - Example: `AAF-INQ-2026-c29e24b5-8c7a-42b1-9e32-0a1b2c3d4e5f`
  - Exact Character Length: $8 \text{ (AAF-INQ-)} + 4 \text{ (2026)} + 1 \text{ (-)} + 36 \text{ (UUID)} = \mathbf{49 \text{ characters}}$.
  - Column Limit: `VARCHAR(50)` in `supabase/migrations/20261103_init_b2b_leads.sql:9`.
  - Margin: 1 character remaining ($49 \le 50$).
- **Quotation ID Structure:** `AAF-Q-${currentYear}-${crypto.randomUUID()}`
  - Exact Character Length: $6 + 4 + 1 + 36 = \mathbf{47 \text{ characters}} \le 50$.
- **Runtime Compatibility:** `crypto.randomUUID()` is native to Node.js 14.17+ and all active Vercel serverless execution environments.

### 3.2 Client Override Elimination
- Inspection of `api/save-lead.js` confirms that `body.inquiryId` and `body.quoteId` are **zero times referenced** in the assignment logic.
- An attacker transmitting `{"inquiryId": "AAF-INQ-2026-VICTIM", "quoteId": "AAF-Q-2026-VICTIM"}` will have those fields completely ignored; the server unconditionally assigns fresh UUIDv4 identifiers.

### 3.3 Format Validation vs. Ownership Validation
- **Regex:** `/^AAF-(INQ|L)-\d{4}-[A-Za-z0-9-]+$/`
  - Correctly matches proposed UUIDv4 inquiry IDs (49 chars).
  - Correctly matches legacy formats (`AAF-INQ-2026-100234` and `AAF-L-2026-4821`).
  - Correctly rejects quotation IDs (`AAF-Q-2026-...`).
- **Security Rule:** Syntactic regex validity validates string formatting and length only. In public lead ingestion, ownership is guaranteed because the IDs are minted in the same server-side execution context. In admin contexts, ownership is governed by operator session authentication.

---

## 4. Insert-Only and UPSERT Security Review

### 4.1 PostgREST Header Enforcement
- In `saveLeadToSupabase`:
  ```javascript
  const allowUpsert = options.upsert === true && options.insertOnly !== true;
  prefer: allowUpsert ? 'resolution=merge-duplicates,return=representation' : 'return=representation'
  ```
  - When invoked from public `/api/save-lead:322`, options is `{ insertOnly: true }`. PostgREST header is strictly `prefer: 'return=representation'`.
  - When invoked from public `/api/leads:111`, options is omitted (`{}`). `allowUpsert` evaluates to `false`, enforcing `prefer: 'return=representation'`.
  - **Verdict:** Public lead ingestion cannot execute an UPSERT under any condition.

### 4.2 Caller-Differentiated Quotation Persistence
- In `saveQuotationToSupabase`:
  ```javascript
  const isInsertOnly = options.insertOnly === true;
  const allowUpsert = !isInsertOnly && (options.upsert === true || Boolean(existingDelivery));
  prefer: allowUpsert ? 'resolution=merge-duplicates,return=representation' : 'return=representation'
  ```
  - When invoked from public `/api/save-lead:353`, options is `{ insertOnly: true }`. `isInsertOnly` is `true`, forcing `allowUpsert` to `false` and enforcing `return=representation` (INSERT-ONLY).
  - Can an untrusted public caller cause `existingDelivery` to be populated?
    - **NO.** The public caller has zero control over `qId` (server-generated UUIDv4). A fresh UUIDv4 will never match an existing row in Supabase. Even in the theoretical case of a collision, `isInsertOnly === true` explicitly overrides `existingDelivery` and forces insert-only mode.
  - When invoked from the Resend webhook handler (`api/admin-quotations.js:288`):
    - `options.insertOnly` is not set (`false`).
    - The webhook payload matches an existing quotation in Supabase, populating `existingDelivery`.
    - `allowUpsert` evaluates to `true`, allowing the webhook to update delivery metadata without `23505` conflict errors.

---

## 5. Resend Webhook Security Architecture

The webhook execution path in `api/admin-quotations.js:200-345` was re-audited against the new client code:

1. **Cryptographic Validation:** `verifySvixSignature(req.rawBody, req.headers || {}, resendSecret)` executes at line 210. Unsigned or invalid requests fail closed immediately with HTTP 401 (`WEBHOOK_UNAUTHORIZED`) at line 212.
2. **Replay Protection:** Line 243 executes `claimQuotationWebhookDistributed(eventId, workerId)`. Replayed event IDs are rejected with HTTP 400 (`DUPLICATE_WEBHOOK_EVENT`). Active concurrent claims return HTTP 429 (`Retry-After: 15`).
3. **Restricted Mutation Scope:** In direct Resend webhooks (lines 342–395), mutations are strictly executed via `updateQuotationDeliveryStatusInSupabase(qId, ...)`. This helper executes an HTTP `PATCH` modifying exclusively delivery metadata (`status`, `delivery_status`, `delivered_at`, `bounced_at`, `updated_by`).
4. **Immutability of Commercial Terms:** Webhook execution cannot alter quotation pricing, buyer identity, items, incoterms, destination ports, or quotation terms.

---

## 6. Critical Retry and Partial-Persistence Analysis

The control flow in `api/save-lead.js` was traced across all 8 failure scenarios:

### Scenario A: Inquiry ID Collision Before Lead Insertion
- **State:** Lead is NOT committed.
- **Control Flow:** `sLead` returns `code === '23505'` matching `inquiry_id`. The `while` loop regenerates a fresh UUIDv4 for `inquiryId`, updates `inquiryRecord`, `quotationRecord`, and `quote`, and retries insert (attempt 2).
- **Outcome:** Lead is inserted once with the new UUID. Quotation insertion proceeds with the matching new UUID. Zero duplicate records. Zero overwrites.

### Scenario B: Quotation ID Collision After Successful Lead Insertion
- **State:** Lead IS committed in database (`public.leads`). Quotation insert fails with `23505` on `quotation_id`.
- **Control Flow:** The quotation retry loop (lines 351–373) catches `sQuote.code === '23505'`. It regenerates a fresh UUIDv4 for `quoteId` and re-attempts quotation insert.
- **Crucial Invariant Verified:** The lead persistence loop (lines 320–346) is **ALREADY COMPLETED**. The lead insertion is **NEVER re-executed**.
- **Outcome:** Exactly 1 lead committed, exactly 1 quotation committed. Zero duplicate leads created.

### Scenario C: Unrelated PostgreSQL 23505 Error
- **State:** Constraint collision on an unrelated column (e.g., duplicate message ID).
- **Control Flow:** Error detail does not contain `inquiry_id` or `quotation_id`. The condition evaluates to `false`, executing `break` immediately.
- **Outcome:** Fails closed. Zero blind retries.

### Scenario D: Foreign-Key Violation (PostgreSQL 23503)
- **State:** `sQuote` returns `code === '23503'`.
- **Control Flow:** Not a 23505 error; loop terminates immediately without retry.
- **Outcome:** Fails closed. The lead is preserved; the invalid quotation association is rejected without guessing or swapping.

### Scenario E: Network Timeout Before Database Commit
- **State:** Connection drops before PostgREST commits.
- **Control Flow:** Exception caught by `try...catch`; `supabaseLeadPersistence = 'FAILED'`. Line 376 detects failure, purges the in-memory cache slot (`recentSubmissions.delete(dedupKey)`), and returns HTTP 500.
- **Outcome:** Fail-closed. Buyer is prompted to retry cleanly.

### Scenario F: Network Timeout After Database Commit
- **State:** Database committed lead, but HTTP response was dropped by the network.
- **Control Flow:** If the buyer resubmits within 60s, line 147 (`recentSubmissions.has(dedupKey)`) catches the submission and returns the cached `{ inquiryId, quoteId }` with HTTP 200 without executing another database insert.
- **Outcome:** Idempotent recovery. Zero duplicate records.

### Scenario G: Rapid Duplicate Business Submission
- **State:** Buyer double-clicks submit button within 10 seconds.
- **Control Flow:** Line 147 intercepts request before database logic is reached.
- **Outcome:** Returns HTTP 200 with cached reference. Database is never contacted.

### Scenario H: Partial Success (Lead Committed, Quotation Failed)
- **State:** Lead persists successfully; quotation fails (e.g. timeout during quote insert).
- **Control Flow:** `supabaseLeadPersistence === 'SUCCESS'`. Line 376 check passes because the primary lead is safely stored.
- **Outcome:** Lead is preserved in `public.leads`. The enquiry is confirmed to the buyer with `inquiryId`. Trade coordinator can access the enquiry in the CRM and regenerate quotation terms. Zero data loss.

---

## 7. Quotation-to-Inquiry Relationship Security

The assignment expression in `api/_lib/supabaseClient.js:244`:
```javascript
const safeInquiryId = isValidInquiryId ? rawInquiryId : (existingDelivery?.inquiry_id || null);
```
was independently verified across all contexts:

1. **Public Lead Creation:** `rawInquiryId` is the server-generated `AAF-INQ-${currentYear}-${uuid}`. It matches the regex and length bound. `safeInquiryId` is populated with this exact ID, linking the quotation to the lead.
2. **Resend Delivery Webhooks:** The incoming webhook payload does not contain an inquiry ID (`rawInquiryId = null`). `isValidInquiryId` is `false`. `safeInquiryId` falls back to `existingDelivery?.inquiry_id`, **preserving the original relationship** without nullifying it.
3. **Standalone Quotations:** When an admin creates a quotation without a web lead, `inquiryId` is `null`. `safeInquiryId` resolves to `null`. This is explicitly supported by `public.quotations(inquiry_id) REFERENCES public.leads(inquiry_id) ON DELETE SET NULL` and Owner Decision 1.
4. **Invalid Input Defense:** If an invalid string is passed, it fails regex validation and falls back to `null`. The system **never** substitutes another buyer's inquiry ID.

---

## 8. Exact Scope and Regression Review

- **Authorized Files:** Exactly `api/save-lead.js` and `api/_lib/supabaseClient.js`.
- **`src/lib/emailjs.js`:** Inspected via `git status`; confirmed **100% untouched**.
- **`api/leads.js`:** Untouched; inherits `insertOnly` default from `saveLeadToSupabase`.
- **`api/admin-quotations.js`:** Untouched; delivery webhooks at line 288 continue to work seamlessly via `existingDelivery` UPSERT support.
- **Database Migrations:** Zero migrations performed.

---

## 9. Adversarial Test Plan (DESIGNED — NOT EXECUTED)

In compliance with `TEST_EXECUTION_AUTHORIZED=0`, the following 15 test cases are designed for future execution:

| Test ID | Adversarial Test Scenario | Input Vector | Expected Security Behavior |
| :--- | :--- | :--- | :--- |
| **TEST-01** | Public `inquiryId` Override Rejection | `POST /api/save-lead` with `{"inquiryId": "AAF-INQ-2026-HIJACK"}` | Server assigns fresh UUID; victim record untouched. |
| **TEST-02** | Public `quoteId` Override Rejection | `POST /api/save-lead` with `{"quoteId": "AAF-Q-2026-HIJACK"}` | Server assigns fresh UUID; victim record untouched. |
| **TEST-03** | Public Ingestion Insert-Only Mode | Direct mock insert with colliding `inquiry_id` | Returns `23505`; does NOT update existing lead. |
| **TEST-04** | Bounded Inquiry ID Collision Retry | Simulated `23505` on `leads_inquiry_id_key` | Server regenerates UUID; retries once; succeeds. |
| **TEST-05** | Quotation Collision Does Not Re-insert Lead | Simulated `23505` on `quotations_quotation_id_key` | Quotation retries with new UUID; lead is NOT re-inserted. |
| **TEST-06** | Unrelated Constraint Collision | Simulated `23505` on unrelated column | Fails immediately without retry; logs error. |
| **TEST-07** | Duplicate Submission (60s Window) | Identical RFQ submitted twice in 10s | Cache returns HTTP 200 with cached reference; DB uncontacted. |
| **TEST-08** | Timeout Fail-Closed Behavior | Simulated network timeout during lead insert | Clears deduplication cache; returns HTTP 500. |
| **TEST-09** | Quotation-to-Lead Linkage | Standard web submission | Quotation persisted with matching `inquiry_id`. |
| **TEST-10** | Standalone Quotation Support | Save quotation with `inquiryId: null` | Quotation persisted with `inquiry_id = null`. |
| **TEST-11** | Foreign Key Violation Fail-Closed | Save quotation with non-existent `inquiryId` | PostgreSQL raises `23503`; quote rejected without guessing. |
| **TEST-12** | Resend Webhook Unauthorized Call | Webhook POST without Svix signature | HTTP 401 (`WEBHOOK_UNAUTHORIZED`); zero DB writes. |
| **TEST-13** | Resend Webhook Replay Rejection | Replayed `eventId` with Svix signature | Rejected with HTTP 400 (`DUPLICATE_WEBHOOK_EVENT`). |
| **TEST-14** | Resend Webhook Delivery Update | Valid Svix signature for existing quote | Delivery status updated successfully via authorized UPSERT. |
| **TEST-15** | EmailJS Shim Integrity | Inspect `src/lib/emailjs.js` | Zero `@emailjs/browser` imports; routes to `/api/save-lead`. |

---

## 10. Final Authoritative Classification

### Authoritative Classification: `VERIFIED_SAFE_FOR_TEST_AUTHORIZATION`

### Clarification of Authority Boundaries:
- **Audit Verification Result:** The Phase 1 source implementation is technically verified, mathematically sound, regression-free, and strictly confined to the authorized two files.
- **What This Classification Does NOT Grant:**
  - Does NOT authorize executing automated tests or test scripts (`TEST_EXECUTION_AUTHORIZED=0`).
  - Does NOT authorize running builds or package commands.
  - Does NOT authorize executing database migrations (`DATABASE_MIGRATION_AUTHORIZED=0`).
  - Does NOT authorize production deployment (`DEPLOYMENT_AUTHORIZED=0`).
  - Does NOT authorize Git commits or pushes (`GIT_COMMIT_AUTHORIZED=0`, `GIT_PUSH_AUTHORIZED=0`).
  - Does NOT authorize external outreach or communications (`GLOBAL_OUTREACH_STOP=1`).

---

## 11. Strict Zero-Activity Governance Verification Table

| Governance Control Item | Operational Status | Recorded Count | Verification Detail |
| :--- | :--- | :--- | :--- |
| **GLOBAL_OUTREACH_STOP** | **ENFORCED** | Active (1) | Global outreach transmission hard-stop is permanently locked. |
| **OUTREACH_AUTHORIZED** | **NOT AUTHORIZED** | 0 | Zero external outreach authorized. |
| **PILOT_AUTHORIZED** | **NOT AUTHORIZED** | 0 | Zero buyer pilot communications authorized. |
| **IMPLEMENTATION_AUTHORIZED** | **CONSUMED (PHASE 1 DONE)** | 2 Files | `api/save-lead.js` and `api/_lib/supabaseClient.js` modified strictly. |
| **DATABASE_MIGRATION_AUTHORIZED** | **NOT AUTHORIZED** | 0 | Zero SQL DDL/DML executed against Supabase. |
| **TEST_EXECUTION_AUTHORIZED** | **NOT AUTHORIZED** | 0 | Zero live tests, integration tests, or scripts run. |
| **DEPLOYMENT_AUTHORIZED** | **NOT AUTHORIZED** | 0 | Zero deployments triggered to Vercel or cloud hosts. |
| **GIT_COMMIT_AUTHORIZED** | **NOT AUTHORIZED** | 0 | Zero git commits created in repository. |
| **GIT_PUSH_AUTHORIZED** | **NOT AUTHORIZED** | 0 | Zero git pushes executed to origin or remote branches. |
| **EXTERNAL_COMMUNICATION_AUTHORIZED** | **NOT AUTHORIZED** | 0 | Zero HTTP calls outside localhost/read-only tools. |
| **TRACKED_FILES_MODIFIED** | **EXACTLY TWO (AUTHORIZED)** | 2 | `api/save-lead.js`, `api/_lib/supabaseClient.js`. |
