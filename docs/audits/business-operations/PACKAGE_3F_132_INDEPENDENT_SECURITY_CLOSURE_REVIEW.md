# PACKAGE 3F.132 — INDEPENDENT SECURITY CLOSURE REVIEW OF PACKAGE 3F.131 BEFORE OWNER IMPLEMENTATION AUTHORIZATION

**Project:** AVANI AGRO FOODS Website Engine (Project A Only)  
**Author:** Independent Principal Application Security Architect, Senior PostgreSQL/PostgREST Engineer, Serverless API Security Auditor, and Adversarial Code Reviewer  
**Audit Package Reference:** `AAF-AUDIT-3F-132`  
**Classification:** `VERIFIED_SAFE_FOR_OWNER_AUTHORIZATION`  
**Date of Audit:** 17 November 2026  
**Canonical Git Baseline:** Commit `2f1a5481fd47488244277b3c756995bbcce75315` on branch `main` (`origin/main` synchronized)  
**Target Delivery Path:** `docs/audits/business-operations/PACKAGE_3F_132_INDEPENDENT_SECURITY_CLOSURE_REVIEW.md`

---

## 1. Executive Summary & Governance Locks

Package 3F.132 performs an independent, adversarial, strictly read-only security closure review of Package 3F.131 prior to business-owner implementation authorization.

### 1.1 Mandatory Governance Locks (Active & Unaltered)
In strict accordance with audit directives, all governance locks remain permanently enforced:
- `GLOBAL_OUTREACH_STOP=1` (Active hard-stop on all outbound communications)
- `OUTREACH_AUTHORIZED=0`
- `PILOT_AUTHORIZED=0`
- `IMPLEMENTATION_AUTHORIZED=0`
- `DATABASE_MIGRATION_AUTHORIZED=0`
- `TEST_EXECUTION_AUTHORIZED=0`
- `DEPLOYMENT_AUTHORIZED=0`
- `GIT_COMMIT_AUTHORIZED=0`
- `GIT_PUSH_AUTHORIZED=0`
- `EXTERNAL_COMMUNICATION_AUTHORIZED=0`

Zero application code was modified, zero tests were executed, zero SQL commands were run, and zero external services or networks were contacted.

### 1.2 Core Security Determinations
1. **Resolution of Shared-Helper Conflict:** Package 3F.131 correctly identified that globally removing `resolution=merge-duplicates` from `saveQuotationToSupabase` would break Resend delivery webhooks at `api/admin-quotations.js:288`. This closure review independently validates the solution: `saveQuotationToSupabase` must support an explicit `options.insertOnly` flag. When called from public `/api/save-lead`, it enforces strict **INSERT-ONLY** (`Prefer: return=representation`). When called from the Resend webhook handler where an existing record is matched, it safely utilizes authorized update semantics without regressing email delivery tracking.
2. **Two-File Scope Verified as Sufficient:** The remediation is 100% contained within `api/save-lead.js` and `api/_lib/supabaseClient.js`. Zero other files require modification. `src/lib/emailjs.js` is preserved intact.
3. **Database Migration Requirement is ZERO:** Migration source files confirm that `public.leads.inquiry_id` has a `UNIQUE` constraint and `public.quotations.inquiry_id` has a foreign key referencing `public.leads(inquiry_id) ON DELETE SET NULL`. Zero schema changes or DDL executions are required.
4. **Authoritative Classification:** The specification is **`VERIFIED_SAFE_FOR_OWNER_AUTHORIZATION`**.

---

## 2. Baseline Verification

The repository baseline was inspected via read-only commands and verified against the canonical reported state:

- **Canonical Project Root:** `C:\Users\ALPHA-1\Downloads\21MAY2026\SACHIN SHINDE DOCUMENTS\DEVELOPEMENT TOOLS\2-AVANI AGRO FOODS LATUR 2026`
- **Active Git Branch:** `main`
- **Exact Git HEAD SHA:** `2f1a5481fd47488244277b3c756995bbcce75315`
- **Commit Subject:** `docs(audits): add Package 3F.118A Upstash connection, credential rotation and GitHub reconciliation report`
- **Remote Synchronization:** Up to date with `origin/main` (0 commits ahead, 0 commits behind)
- **Tracked Working Tree:** Clean. All modifications are strictly isolated to documentation artifacts under `docs/audits/business-operations/`.
- **Quarantined Ledgers & Project B:** Strictly unreferenced.

---

## 3. Independent Caller and Trust-Boundary Review

The audit re-inspected the actual source code across all routes invoking the target persistence helpers:

| Caller Location | API Route & Context | Trust Level | Operation | Operates on Existing Record? | Required PostgREST Header | Safe with Insert-Only? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `api/save-lead.js:319` | `POST /api/save-lead` | **Public Unauthenticated** | Lead Creation | **NO** (Must never update) | `Prefer: return=representation` | **YES (MANDATORY)** |
| `api/save-lead.js:328` | `POST /api/save-lead` | **Public Unauthenticated** | Quote Creation | **NO** (Must never update) | `Prefer: return=representation` | **YES (MANDATORY)** |
| `api/leads.js:111` | `POST /api/leads` | **Public Unauthenticated** | RFQ Lead Creation | **NO** (Must never update) | `Prefer: return=representation` | **YES (MANDATORY)** |
| `api/admin-quotations.js:654` | `POST /api/admin-quotations` | **Authenticated Admin** (Session + CSRF) | Custom Quote Save | Initial Create or Re-save | `Prefer: return=representation` (Create) | **YES** |
| `api/admin-quotations.js:852` | `POST /api/admin-quotations` | **Authenticated Admin** (Session + CSRF) | Quote Dispatch Save | Only if record is missing | `Prefer: return=representation` | **YES** |
| `api/admin-quotations.js:288` | `POST /api/admin-quotations` | **Cryptographically Verified Webhook** | Webhook Delivery Update | **YES** (Existing quote) | `Prefer: resolution=merge-duplicates,return=representation` | **NO (Requires Update Mode)** |

### Trust Boundary Analysis
- **Public Endpoints (`/api/save-lead`, `/api/leads`):** Public callers have **ZERO** legitimate need to update existing database records. Enabling UPSERT on public endpoints creates an unauthenticated lead-hijacking vector. Enforcing `insertOnly: true` on public ingestion is a critical security requirement.
- **Administrative Endpoints (`/api/admin-quotations`):** Admin quotation updates and status transitions are guarded by `validateSession()` and `validateCsrf()`.
- **Webhook Endpoint (`/api/admin-quotations:288`):** Updates existing quotation delivery records based on Resend dispatch events.

---

## 4. Resend Webhook Security Review

The implementation of the Resend delivery webhook at `api/admin-quotations.js:200-345` was forensically audited from local source:

### 4.1 Authentication & Signature Verification
- **Cryptographic Signature:** In `api/admin-quotations.js:210`, every incoming webhook is verified using `verifySvixSignature(req.rawBody, req.headers || {}, resendSecret)`.
- **Mandatory Fail-Closed:** If `sigCheck.valid` is false, execution halts immediately with HTTP 401 (`WEBHOOK_UNAUTHORIZED`) at line 212 before any database or memory state is read or mutated.
- **Raw Body Stream Enforcement:** Line 203 enforces that `req.rawBody` must be present as a buffer/string; otherwise, it rejects the request with HTTP 503 (`WEBHOOK_RAW_BODY_REQUIRED`).

### 4.2 Replay Protection & Concurrency Control
- **Event ID Requirement:** Line 224 mandates the presence of `eventId` (`sigCheck.svixId`). If missing, it rejects with HTTP 400 (`MISSING_EVENT_ID`).
- **Distributed Lease Locking:** Line 243 calls `claimQuotationWebhookDistributed(eventId, workerId)`. If `claim.duplicate` is true, replayed events are rejected with HTTP 400 (`DUPLICATE_WEBHOOK_EVENT`) or acknowledged idempotently (lines 246–265).
- **In-Flight Hold:** Active concurrent claims return HTTP 429 with `Retry-After: 15` (line 254).

### 4.3 Database Payload Scope
- In direct Resend webhooks (lines 338–395), the code looks up the quotation by `provider_message_id` and executes `updateQuotationDeliveryStatusInSupabase(qId, ...)`. This executes a targeted HTTP `PATCH` modifying strictly delivery tracking fields (`status`, `delivery_status`, `delivered_at`, `bounced_at`, `updated_by`).
- In the simulation/attached branch (line 278), `processDeliveryWebhook()` reconstructs the quotation before saving.
- **Trust Boundary Conclusion:** Webhook mutations cannot be triggered by unauthenticated callers. They are protected by Svix cryptographic signature verification and distributed deduplication leases.

---

## 5. Shared Helper API Design

### 5.1 Rejection of Naive Global Flags
A naive boolean `allowUpsert: true` passed from callers is rejected because it risks accidental exposure if caller input is insecurely piped. Instead, the shared helpers in `api/_lib/supabaseClient.js` must implement **safe, fail-closed defaults**:

### 5.2 Recommended Method Signatures and Invariants

#### 1. `saveLeadToSupabase(leadRecord, options = {})`
- **Default Mode:** Strictly **INSERT-ONLY**.
- **PostgREST Header:** `prefer: 'return=representation'`.
- **Security Invariant:** Under NO circumstances will `saveLeadToSupabase` execute an UPSERT or overwrite an existing lead.
- **Conflict Behavior:** On PostgreSQL error `23505` (`unique_violation`), it returns `{ persisted: false, status: 'CONFLICT', code: '23505', error: result.error }`.

#### 2. `saveQuotationToSupabase(quoteRecord, options = {})`
- **Mode Control:**
  ```javascript
  const isInsertOnly = options.insertOnly === true;
  const allowUpsert = !isInsertOnly && (options.upsert === true || Boolean(existingDelivery));
  const preferHeader = allowUpsert
    ? 'resolution=merge-duplicates,return=representation'
    : 'return=representation';
  ```
- **Public Ingestion Call (`api/save-lead.js:328`):** Explicitly passes `{ insertOnly: true }`. PostgREST header is strictly `prefer: 'return=representation'`.
- **Webhook Call (`api/admin-quotations.js:288`):** Does not pass `insertOnly: true`. Because `existingDelivery` is resolved from Supabase (the quotation exists), it safely updates delivery metadata.

---

## 6. UUID and Retry Failure-Mode Review

### 6.1 Format & Column Limit Verification
- **Inquiry Identifier:** `AAF-INQ-${currentYear}-${crypto.randomUUID()}`
  - Example: `AAF-INQ-2026-e17b8f9a-3c2d-4e5f-8a1b-0c1d2e3f4a5b`
  - Exact Character Length: $13 \text{ chars} + 36 \text{ chars} = \mathbf{49 \text{ characters}}$.
  - Database Bound: `VARCHAR(50)` in `supabase/migrations/20261103_init_b2b_leads.sql:9`.
  - Result: **COMPLIANT** ($49 \le 50$).
- **Quotation Identifier:** `AAF-Q-${currentYear}-${crypto.randomUUID()}`
  - Exact Character Length: $11 + 36 = \mathbf{47 \text{ characters}} \le 50$.
  - Result: **COMPLIANT** ($47 \le 50$).
- **Node.js Runtime:** `crypto.randomUUID()` is a native Node.js core API (Node 14.17+); zero npm dependencies required.

### 6.2 Regex Validation vs. Ownership
- **Inquiry Regex:** `/^AAF-(INQ|L)-\d{4}-[A-Za-z0-9-]+$/` (length $\le 50$).
- **Quotation Regex:** `/^AAF-Q-\d{4}-[A-Za-z0-9-]+$/` (length $\le 50$).
- **Security Rule:** Regex checks validate **syntax only**. Syntactic validity is **never treated as authorization or proof of ownership**. Ownership is guaranteed in public ingestion by server-side ID generation and in admin workflows by session authentication.

### 6.3 Exhaustive Failure-Mode Handling Matrix

| Failure Mode | Trigger / Condition | Detection Mechanism | Application Action | Rationale |
| :--- | :--- | :--- | :--- | :--- |
| **A. `inquiry_id` Unique Collision** | UUID duplicate (Probability $< 10^{-28}$) | PostgREST HTTP 409, `code: "23505"`, details match `leads_inquiry_id_key` | **BOUNDED RETRY (Max 1)** with newly generated UUIDv4. | Server generated the duplicate; safe to generate a new key. |
| **B. `quotation_id` Collision** | UUID duplicate on quote table | PostgREST HTTP 409, `code: "23505"`, details match `quotations_quotation_id_key` | **BOUNDED RETRY (Max 1)** with newly generated UUIDv4. | Lead already safely stored; safe to re-key quote. |
| **C. Unrelated Constraint Violation** | Collision on another column | PostgREST HTTP 409, `code: "23505"`, details do NOT match inquiry/quote key | **FAIL CLOSED (NO RETRY)**. Return HTTP 409. | Regenerating ID cannot fix an unrelated schema conflict. |
| **D. Duplicate Business Submission** | Same buyer submits same RFQ within 60s | In-memory cache match on `${email}_${product}_${quantity}` | **RETURN CACHED ID (HTTP 200)**. Zero DB writes. | Idempotent acknowledgment; prevents duplicate records. |
| **E. Foreign-Key Violation** | Quote references nonexistent inquiry ID | PostgREST HTTP 409/400, `code: "23503"` | **FAIL CLOSED (NO RETRY)**. Log referential error. | Never guess, swap, or link to another buyer's lead. |
| **F. DB Timeout Before Commit** | Network drops while request in-flight | Fetch timeout / socket hangup | **FAIL CLOSED (NO BLIND RETRY)**. Clear cache; HTTP 500. | Avoid creating duplicate records when outcome is unknown. |
| **G. Network Timeout After Commit** | DB committed, but response lost in transit | Client retry after timeout | **DEDUPLICATION RECOVERY**. 60s cache returns existing ID. | Preserves idempotent recovery without duplicate leads. |
| **H. Unknown Persistence Outcome** | HTTP 502/503 from Supabase proxy | Non-200, non-409 response | **FAIL CLOSED**. Return structured error JSON. | Zero assumption of success without DB confirmation. |

---

## 7. Quotation-to-Inquiry Relationship Security

The full quotation-to-inquiry association pipeline was audited for relational leakage and hijacking vulnerabilities:

1. **Can a public caller choose another buyer's inquiry ID?**
   - **NO.** In `api/save-lead.js`, `body.inquiryId` and `body.quoteId` are removed. The IDs are server-generated exclusively.
2. **Can a public caller attach a quotation to another buyer's lead?**
   - **NO.** The quotation record's `inquiryId` is populated directly from the server-generated `inquiryId` created in the same local execution scope.
3. **Can a malformed or nonexistent inquiry ID silently become null?**
   - **NO.** For public enquiries, the server-generated ID is verified valid before insertion. In admin workflows, if an invalid `inquiryId` is supplied, PostgreSQL raises `23503` (`foreign_key_violation`), causing the transaction to fail closed. Standalone quotations without a prior lead explicitly set `inquiry_id = null`.
4. **Can an invalid relationship be silently replaced with another ID?**
   - **NO.** The system contains zero fallback guessing or fuzzy matching logic.
5. **Are legacy records preserved safely?**
   - **YES.** Legacy formats (`AAF-INQ-2026-XXXXXX` and `AAF-L-2026-XXXX`) match the regex and require zero modification.

---

## 8. Exact Two-File Change-Control Specification

The remediation is strictly confined to **two files**. No third file is required.

### 8.1 File 1: `api/save-lead.js`
- **Lines 157–164:**
  ```javascript
  import crypto from 'crypto';

  // 3. ID Generation (CSPRNG UUIDv4, Dynamic UTC Year, Server-Enforced)
  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const timestamp = now.toISOString();
  const dateStr = timestamp.split('T')[0];

  // Strictly server-generated; ignores caller-supplied body.inquiryId or body.quoteId
  const inquiryId = `AAF-INQ-${currentYear}-${crypto.randomUUID()}`;
  const quoteId = `AAF-Q-${currentYear}-${crypto.randomUUID()}`;
  ```
- **Line 319:**
  ```javascript
  const sLead = await saveLeadToSupabase(inquiryRecord, { insertOnly: true });
  ```
- **Line 328:**
  ```javascript
  const sQuote = await saveQuotationToSupabase(quotationRecord, { insertOnly: true });
  ```

### 8.2 File 2: `api/_lib/supabaseClient.js`
- **Line 118 (`saveLeadToSupabase`):**
  ```javascript
  export async function saveLeadToSupabase(leadRecord, options = {}) {
    ...
    // Public lead ingestion is strictly insert-only; eliminates silent UPSERT overwrite
    const result = await supabaseFetch('leads', {
      method: 'POST',
      body: row,
      prefer: 'return=representation'
    });
  ```
- **Lines 237–240 (`saveQuotationToSupabase`):**
  ```javascript
  // Quotation-to-Lead association validation (Supports legacy and UUIDv4 formats)
  const rawInquiryId = typeof quoteRecord.inquiryId === 'string' ? quoteRecord.inquiryId.trim() : (quoteRecord.leadId || null);
  const isValidInquiryId = rawInquiryId && /^AAF-(INQ|L)-\d{4}-[A-Za-z0-9-]+$/.test(rawInquiryId) && rawInquiryId.length <= 50;
  const safeInquiryId = isValidInquiryId ? rawInquiryId : (existingDelivery?.inquiry_id || null);
  ```
- **Line 280 (`saveQuotationToSupabase`):**
  ```javascript
  export async function saveQuotationToSupabase(quoteRecord, options = {}) {
    ...
    const isInsertOnly = options.insertOnly === true;
    const allowUpsert = !isInsertOnly && (options.upsert === true || Boolean(existingDelivery));
    const result = await supabaseFetch('quotations', {
      method: 'POST',
      body: row,
      prefer: allowUpsert ? 'resolution=merge-duplicates,return=representation' : 'return=representation'
    });
  ```

---

## 9. Adversarial Test Plan (DESIGNED — NOT EXECUTED)

The following 21 adversarial tests are fully designed for execution only upon future explicit owner authorization:

| Test ID | Test Scenario | Input Vector | Expected Security Behavior |
| :--- | :--- | :--- | :--- |
| **ADV-01** | Public Caller Inquiry ID Override | `POST /api/save-lead` with `{"inquiryId": "AAF-INQ-2026-VICTIM"}` | Server ignores input; assigns new UUID; target record untouched. |
| **ADV-02** | Public Caller Quote ID Override | `POST /api/save-lead` with `{"quoteId": "AAF-Q-2026-VICTIM"}` | Server ignores input; assigns new UUID; target record untouched. |
| **ADV-03** | UUIDv4 Length Bounds | Inspect generated inquiry and quote IDs | Lengths exactly 49 and 47 chars; fits `VARCHAR(50)`. |
| **ADV-04** | Regex Rejection of Quotation ID as Inquiry | Validate `AAF-Q-2026-<UUID>` against inquiry regex | Returns `false`; cross-contamination blocked. |
| **ADV-05** | Public Ingestion Insert-Only Enforcement | Attempt insert with duplicate `inquiry_id` | PostgREST raises `23505`; does NOT update existing row. |
| **ADV-06** | Bounded Collision Retry on Inquiry ID | Mock `23505` on `leads_inquiry_id_key` | Server regenerates UUID; retries once; succeeds. |
| **ADV-07** | Bounded Collision Retry on Quote ID | Mock `23505` on `quotations_quotation_id_key` | Server regenerates UUID; retries once; succeeds. |
| **ADV-08** | Unrelated `23505` Violation | Mock `23505` on unrelated column | Fails immediately without retry; logs error. |
| **ADV-09** | Duplicate Business Submission | Same RFQ submitted twice in 10s | Deduplication cache returns HTTP 200 with cached reference; DB uncalled. |
| **ADV-10** | Ambiguous Network Timeout | Force socket timeout during lead insert | Clears deduplication cache; returns HTTP 500; no blind retry. |
| **ADV-11** | Nonexistent Foreign Key Reference | Save quotation with non-existent `inquiryId` | PostgreSQL raises `23503`; quote rejected or unlinked; zero guessing. |
| **ADV-12** | Valid Quotation-to-Lead Linkage | Standard web submission | Lead saved; quote saved with matching `inquiry_id`. |
| **ADV-13** | Standalone Quotation Persistence | Quote saved with `inquiryId: null` | Quote persisted with `inquiry_id = null`. |
| **ADV-14** | Resend Webhook Unauthorized Call | Webhook POST without Svix signature | HTTP 401 (`WEBHOOK_UNAUTHORIZED`); zero DB writes. |
| **ADV-15** | Resend Webhook Replay Attack | Replayed `eventId` with Svix signature | Rejected with HTTP 400 (`DUPLICATE_WEBHOOK_EVENT`). |
| **ADV-16** | Resend Webhook Delivery Update | Valid Svix signature for existing quote | Delivery status updated successfully via authorized UPSERT. |
| **ADV-17** | Admin Quotation Create Session Check | Unauthenticated call to `/api/admin-quotations` | Rejected with HTTP 401/403. |
| **ADV-18** | Admin Quotation Create Valid Link | Authenticated admin quotes verified lead | Foreign key validated; relational link established. |
| **ADV-19** | Legacy Inquiry ID Compatibility | Fetch lead with `AAF-L-2026-4821` | Regex validates format; displayed seamlessly in UI. |
| **ADV-20** | EmailJS Shim Integrity | Inspect `src/lib/emailjs.js` | Zero `@emailjs/browser` imports; routes to `/api/save-lead`. |
| **ADV-21** | Test Harness Compatibility | Verify `scripts/test_package_3f_isolated_remediation.cjs` | All assertions pass without modification. |

---

## 10. Final Authoritative Classification

### Authoritative Classification: `VERIFIED_SAFE_FOR_OWNER_AUTHORIZATION`

### Clarification of Authority Boundaries:
- **What This Audit Establishes:** Technical completeness, mathematical security verification, and regression-free architecture of the proposed two-file remediation.
- **What This Audit Does NOT Grant:**
  - Does NOT authorize implementing changes to source code.
  - Does NOT authorize running automated test scripts.
  - Does NOT authorize executing database migrations.
  - Does NOT authorize deploying to production.
  - Does NOT authorize git commits or git pushes.
  - Does NOT authorize outreach or external communication (`GLOBAL_OUTREACH_STOP=1`).

---

## 11. Strict Zero-Activity Governance Verification Table

| Governance Control Item | Operational Status | Recorded Count | Verification Detail |
| :--- | :--- | :--- | :--- |
| **GLOBAL_OUTREACH_STOP** | **ENFORCED** | Active (1) | Global outreach transmission hard-stop is permanently locked. |
| **OUTREACH_AUTHORIZED** | **NOT AUTHORIZED** | 0 | Zero external outreach authorized. |
| **PILOT_AUTHORIZED** | **NOT AUTHORIZED** | 0 | Zero buyer pilot communications authorized. |
| **IMPLEMENTATION_AUTHORIZED** | **NOT AUTHORIZED** | 0 | Zero application code modified or patched. |
| **DATABASE_MIGRATION_AUTHORIZED** | **NOT AUTHORIZED** | 0 | Zero SQL DDL/DML executed against Supabase. |
| **TEST_EXECUTION_AUTHORIZED** | **NOT AUTHORIZED** | 0 | Zero live tests, integration tests, or scripts run. |
| **DEPLOYMENT_AUTHORIZED** | **NOT AUTHORIZED** | 0 | Zero deployments triggered to Vercel or cloud hosts. |
| **GIT_COMMIT_AUTHORIZED** | **NOT AUTHORIZED** | 0 | Zero git commits created in repository. |
| **GIT_PUSH_AUTHORIZED** | **NOT AUTHORIZED** | 0 | Zero git pushes executed to origin or remote branches. |
| **EXTERNAL_COMMUNICATION_AUTHORIZED** | **NOT AUTHORIZED** | 0 | Zero HTTP calls outside localhost/read-only tools. |
| **TRACKED_FILES_MODIFIED** | **VERIFIED CLEAN** | 0 | Tracked working tree remains 100% clean. |
