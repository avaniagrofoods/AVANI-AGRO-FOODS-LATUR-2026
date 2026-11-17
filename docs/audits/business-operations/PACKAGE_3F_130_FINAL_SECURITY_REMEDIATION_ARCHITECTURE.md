# PACKAGE 3F.130 — FINAL SECURITY REMEDIATION ARCHITECTURE, UPSERT PROTECTION, CRYPTOGRAPHIC ID GENERATION AND QUOTATION RELATIONSHIP VERIFICATION

**Project:** AVANI AGRO FOODS Website Engine (Project A Only)  
**Author:** Principal Application Security Architect, Senior Node.js Engineer, PostgreSQL/Supabase Database Specialist, Distributed Systems Engineer and Independent Adversarial Auditor  
**Audit Package Reference:** `AAF-AUDIT-3F-130`  
**Classification:** `VERIFIED_SAFE_FOR_OWNER_AUTHORIZATION`  
**Date of Audit:** 17 November 2026  
**Canonical Git Baseline:** Commit `2f1a5481fd47488244277b3c756995bbcce75315` on branch `main` (`origin/main` synchronized)  
**Target Delivery Path:** `docs/audits/business-operations/PACKAGE_3F_130_FINAL_SECURITY_REMEDIATION_ARCHITECTURE.md`

---

## 1. Baseline Verification

In strict accordance with audit protocol, the Project A repository baseline was verified prior to analysis:

- **Canonical Repository Root:** `C:\Users\ALPHA-1\Downloads\21MAY2026\SACHIN SHINDE DOCUMENTS\DEVELOPEMENT TOOLS\2-AVANI AGRO FOODS LATUR 2026`
- **Active Git Branch:** `main`
- **Exact Git HEAD SHA:** `2f1a5481fd47488244277b3c756995bbcce75315`
- **Origin Synchronization:** Synchronized with `origin/main` (`HEAD` matches `origin/main` exactly, 0 commits ahead, 0 commits behind)
- **Git Working Tree Status:** Pristine for all tracked files; all modifications isolated to untracked documentation artifacts under `docs/audits/business-operations/`.
- **Staged Changes:** 0 files staged
- **Quarantined Ledgers & Project B Isolation:** Strictly unreferenced; `sequenceStateStore.json`, `importersData.*`, `manufacturersData.*`, and `api/_data/*` remain untouched.

---

## 2. Cryptographic ID Design

### 2.1 Inspection of Current Implementation
In `api/save-lead.js:157-164`:
```javascript
const timestamp = new Date().toISOString();
const dateStr = timestamp.split('T')[0];
const randSuffix = Math.floor(100000 + Math.random() * 900000);
const randQuoteSuffix = Math.floor(1000 + Math.random() * 9000);
const inquiryId = body.inquiryId || `AAF-INQ-2026-${randSuffix}`;
const quoteId = body.quoteId || `AAF-Q-2026-${randQuoteSuffix}`;
```

### 2.2 Architectural Comparison of Identifier Strategies

| ID Strategy | Entropy | Effective State Space ($S$) | Collision at 1,000 Records | Collision at 10,000 Records | DB Length Compatibility (`VARCHAR(50)`) | Serverless / Node Compatibility | Verdict |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **A. Math.random() 6-digit** | $\approx 19.8$ bits | $900,000$ | **42.6046%** (1 in 2.3) | **100.0000%** (1 in 1) | 19 chars (Compliant) | Vulnerable PRNG (V8 xorshift128+) | **REJECTED (Critical Flaw)** |
| **B. 8-digit random int** | $\approx 26.4$ bits | $90,000,000$ | 0.5535% (1 in 181) | **42.6227%** (1 in 2.3) | 21 chars (Compliant) | Insufficient long-term entropy | **REJECTED (Unsafe at scale)** |
| **C. 8-character hex** | 32 bits | $16^8 \approx 4.29 \times 10^9$ | 0.0116% (1 in 8,600) | 1.1573% (1 in 86) | 21 chars (Compliant) | Cryptographically secure (CSPRNG) | Acceptable for low volume |
| **D. 16-character hex / 8-byte** | 64 bits | $2^{64} \approx 1.84 \times 10^{19}$ | $< 10^{-12}$ (virtually 0) | $2.71 \times 10^{-10}$% | 29 chars (Compliant) | Node `crypto.randomBytes(8)` | Highly recommended |
| **E. UUIDv4 (122 bits)** | 122 bits | $2^{122} \approx 5.32 \times 10^{36}$ | $< 10^{-28}$ (virtually 0) | $< 10^{-26}$ (virtually 0) | 49 chars (Compliant: $49 \le 50$) | Node native `crypto.randomUUID()` | **RECOMMENDED ARCHITECTURE** |

### 2.3 Mathematical Collision Probability Calculations (Birthday Problem)

The exact probability of at least one collision ($p$) among $k$ independently generated random identifiers drawn uniformly from state space $S$ is computed using the Birthday distribution:

$$p(k; S) = 1 - \prod_{i=1}^{k-1} \left(1 - \frac{i}{S}\right) \approx 1 - \exp\left(-\frac{k(k-1)}{2S}\right)$$

| Total Generated Records ($k$) | Option A: Math.random() ($S=900,000$) | Option B: 8-Digit Int ($S=90,000,000$) | Option C: 8-Char Hex ($S=4.295 \times 10^9$) | Option D: 16-Char Hex ($S=1.845 \times 10^{19}$) | Option E: UUIDv4 ($S=5.317 \times 10^{36}$) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1,000** | **42.6046%** (1 in 2.3) | 0.5535% (1 in 181) | 0.0116% (1 in 8,600) | $2.71 \times 10^{-12}$% (virtually 0) | $9.40 \times 10^{-30}$% (virtually 0) |
| **10,000** | **100.0000%** | **42.6227%** (1 in 2.3) | 1.1573% (1 in 86) | $2.71 \times 10^{-10}$% (virtually 0) | $9.40 \times 10^{-28}$% (virtually 0) |
| **100,000** | **100.0000%** | **100.0000%** | **68.7812%** (1 in 1.4) | $2.71 \times 10^{-8}$% (1 in $3.69 \times 10^9$) | $9.40 \times 10^{-26}$% (virtually 0) |
| **1,000,000** | **100.0000%** | **100.0000%** | **100.0000%** | 0.0027% (1 in 369,000) | $9.40 \times 10^{-24}$% (virtually 0) |
| **10,000,000** | **100.0000%** | **100.0000%** | **100.0000%** | 0.2706% (1 in 369) | $9.40 \times 10^{-22}$% (virtually 0) |

### 2.4 Column Limit & Consumer Compatibility Proof
- **Database Column Limits:**
  - `public.leads.inquiry_id` is defined as `VARCHAR(50)` in `supabase/migrations/20261103_init_b2b_leads.sql:9`.
  - `public.quotations.quotation_id` is defined as `VARCHAR(50)` in `supabase/migrations/20261110_quotations_table.sql:11`.
  - `public.quotations.inquiry_id` is defined as `VARCHAR(50)` in `supabase/migrations/20261110_quotations_table.sql:12`.
- **String Length Analysis for UUIDv4 Format:**
  - Prefix format: `AAF-INQ-${currentYear}-${uuid}`
  - Example: `AAF-INQ-2026-c29e24b5-8c7a-42b1-9e32-0a1b2c3d4e5f`
  - Total length: $13 \text{ chars prefix} + 36 \text{ chars UUID} = \mathbf{49 \text{ characters}}$.
  - Since $49 \le 50$, the UUIDv4 prefixed identifier **fits natively** into the existing `VARCHAR(50)` column without altering database schemas or executing DDL migrations.
  - Quotation format: `AAF-Q-${currentYear}-${uuid}` has length $11 + 36 = \mathbf{47 \text{ characters}} \le 50$.
- **Validation Rules:**
  - Regex pattern: `/^AAF-(INQ|L)-\d{4}-[A-Za-z0-9-]+$/`
  - Maximum length bound: $\le 50$ characters.
  - Backwards compatible with legacy IDs: `AAF-INQ-2026-100234` (19 chars) and `AAF-L-2026-4821` (15 chars).

---

## 3. UPSERT Buyer-Record Overwrite Prevention

### 3.1 Mechanism of the Overwrite Flaw
In `api/_lib/supabaseClient.js:168-172`:
```javascript
const result = await supabaseFetch('leads', {
  method: 'POST',
  body: row,
  prefer: 'resolution=merge-duplicates,return=representation'
});
```
When PostgREST receives `prefer: 'resolution=merge-duplicates'`, it translates the HTTP POST into:
```sql
INSERT INTO public.leads (...) VALUES (...)
ON CONFLICT (inquiry_id) DO UPDATE SET ...;
```
Because `inquiry_id` has a unique constraint, an unauthenticated public caller submitting an existing buyer's `inquiryId` causes PostgREST to execute an **UPDATE**, silently replacing the existing buyer's corporate details, email, contact telephone, and requirement text.

### 3.2 Comparative Analysis of Mutation Strategies

| Mutation Strategy | Behavior on Collision | Protection Against Attacker Hijacking | Accidental Collision Handling | Suitability for Public Ingestion |
| :--- | :--- | :--- | :--- | :--- |
| **A. Current UPSERT (`resolution=merge-duplicates`)** | Updates existing record | **ZERO (Catastrophic)**: Overwrites buyer details | Silently overwrites previous lead | **UNACCEPTABLE** |
| **B. Insert-Only (`return=representation`)** | Fails with HTTP 409 / PostgreSQL `23505` | **ABSOLUTE**: Cannot overwrite existing record | Rejection allows server retry with new UUID | **RECOMMENDED FOR PUBLIC API** |
| **C. Explicit Authorized Update (`PATCH` with Auth)** | Updates only target record | Enforces JWT/Role verification | N/A (Targets verified record) | **RECOMMENDED FOR ADMIN PORTAL** |
| **D. Database Ignore (`resolution=ignore-duplicates`)** | Does nothing (`ON CONFLICT DO NOTHING`) | Prevents overwrite | Drops new buyer lead silently | **UNACCEPTABLE (Silent lead drop)** |

### 3.3 Required Security Invariants
1. **Server-Side Generation Exclusivity:** The public `/api/save-lead` endpoint must never read or respect `body.inquiryId` or `body.quoteId`.
2. **Insert-Only Enforcement:** Public lead insertion must omit `resolution=merge-duplicates`.
3. **Safe Collision Recovery:** If PostgreSQL returns error code `23505` (`unique_violation`), the server catches the error, generates a fresh UUID, and performs a single bounded retry (maximum 2 attempts). Under no circumstances is an update performed.
4. **Separation of Concerns:** Administrative updates to existing leads are strictly isolated to authenticated routes (`/api/admin-leads` or `/api/admin-quotations`) using authenticated HTTP `PATCH` verbs protected by session tokens and CSRF headers.

---

## 4. Quotation Relationship Integrity

### 4.1 Ingestion Flow & Association Trace
The entire quotation-to-lead association path was audited across Project A:

```
[Public Web Ingestion]
         │
         ▼
api/save-lead.js
  ├── 1. Generate server-side inquiryId (`AAF-INQ-${year}-${uuid}`)
  ├── 2. Generate server-side quoteId (`AAF-Q-${year}-${uuid}`)
  ├── 3. Save Lead: saveLeadToSupabase(inquiryRecord)
  │      └── POST /leads (Insert-Only)
  │             └── PostgreSQL enforces UNIQUE (inquiry_id)
  │             └── Lead record committed
  └── 4. Save Quote: saveQuotationToSupabase(quotationRecord)
         └── Sets row.inquiry_id = server-generated inquiryId
         └── POST /quotations (Insert-Only)
                └── PostgreSQL enforces FK: inquiry_id REFERENCES public.leads(inquiry_id)
```

### 4.2 Remediation of `api/_lib/supabaseClient.js:239`
The current logic:
```javascript
const rawInquiryId = quoteRecord.inquiryId || quoteRecord.leadId || null;
const safeInquiryId = (rawInquiryId && !rawInquiryId.startsWith('AAF-INQ-2026-')) ? rawInquiryId : (existingDelivery?.inquiry_id || null);
```
**Defect:** Evaluates `!rawInquiryId.startsWith('AAF-INQ-2026-')` to `false` for every genuine new inquiry ID. This unconditionally sets `safeInquiryId` to `null` for all new inquiries.

**Corrected Architecture:**
```javascript
const rawInquiryId = typeof quoteRecord.inquiryId === 'string' ? quoteRecord.inquiryId.trim() : (quoteRecord.leadId || null);
const isValidFormat = rawInquiryId && /^AAF-(INQ|L)-\d{4}-[A-Za-z0-9-]+$/.test(rawInquiryId) && rawInquiryId.length <= 50;
const safeInquiryId = isValidFormat ? rawInquiryId : (existingDelivery?.inquiry_id || null);
```

### 4.3 Relationship Classification & Handling Matrix

| Relationship State | Condition | Backend Behavior | Database Outcome |
| :--- | :--- | :--- | :--- |
| **Verified Existing Relationship** | `inquiryId` generated by server and lead successfully persisted in `public.leads`. | Link `quotation.inquiry_id = lead.inquiry_id`. | Foreign key validated; relational link established. |
| **Missing Relationship (Standalone Quote)** | Direct quotation created by admin without prior web lead (e.g. phone/WhatsApp RFQ). | Set `quotation.inquiry_id = null`. | Permitted by `ON DELETE SET NULL`; independent quote created. |
| **Invalid Relationship (Non-existent ID)** | Caller passes an inquiry ID that does not exist in `public.leads`. | Reject association; return error code `23503` or reject input. Never substitute another lead. | Insert fails or association rejected; zero corruption. |
| **Authorized Internal Relationship** | Admin links an existing unassociated quotation to an existing verified lead. | Validate target `inquiry_id` exists in `public.leads`, then update `public.quotations`. | Validated foreign key maintained. |

---

## 5. Database Integrity

All findings in this section are classified based on source evidence:

| Finding Description | Source Evidence Reference | Verification Classification |
| :--- | :--- | :--- |
| `public.leads.inquiry_id` is defined as `VARCHAR(50) UNIQUE NOT NULL` | `supabase/migrations/20261103_init_b2b_leads.sql:9` | `VERIFIED_FROM_MIGRATION_FILE` |
| `public.quotations.quotation_id` is defined as `VARCHAR(50) UNIQUE NOT NULL` | `supabase/migrations/20261110_quotations_table.sql:11` | `VERIFIED_FROM_MIGRATION_FILE` |
| `public.quotations.inquiry_id` foreign key references `public.leads(inquiry_id)` | `supabase/migrations/20261110_quotations_table.sql:12` | `VERIFIED_FROM_MIGRATION_FILE` |
| Foreign key constraint enforces `ON DELETE SET NULL` | `supabase/migrations/20261110_quotations_table.sql:12` | `VERIFIED_FROM_MIGRATION_FILE` |
| B-Tree Index `idx_leads_inquiry_id` exists on `public.leads(inquiry_id)` | `supabase/migrations/20261103_init_b2b_leads.sql:51` | `VERIFIED_FROM_MIGRATION_FILE` |
| B-Tree Index `idx_quotations_inquiry_id` exists on `public.quotations(inquiry_id)` | `supabase/migrations/20261110_quotations_table.sql:54` | `VERIFIED_FROM_MIGRATION_FILE` |
| B-Tree Index `idx_quotations_quotation_id` exists on `public.quotations(quotation_id)` | `supabase/migrations/20261110_quotations_table.sql:53` | `VERIFIED_FROM_MIGRATION_FILE` |
| Database schema migrations required for Phase 1 remediation: **ZERO** | Package 3F.126, 3F.127, 3F.128 audits and migration file review | `VERIFIED_FROM_SOURCE` |
| Production database row counts and runtime lock behavior | Production connection not executed during read-only audit | `LIVE_DATABASE_UNVERIFIED` |

---

## 6. Legacy Compatibility

### 6.1 Downstream Consumer Impact Analysis

| System Component | Consumer File | Legacy Format (`AAF-INQ-2026-XXXXXX` / `AAF-L-XXXX`) | Proposed Format (`AAF-INQ-YYYY-<UUID>`) | Compatibility Assessment |
| :--- | :--- | :--- | :--- | :--- |
| **Lead Card Component** | `src/components/LeadCard.jsx` | Renders string badge | Renders string badge | **Fully Compatible (No regex checks)** |
| **Lead Detail Modal** | `src/components/LeadDetailModal.jsx` | Displays ID in header | Displays ID in header | **Fully Compatible** |
| **Admin Dashboard** | `src/pages/AdminDashboard.jsx` | Displays tabular ID | Displays tabular ID | **Fully Compatible** |
| **Quotation Admin** | `api/admin-quotations.js` | Parses quote & inquiry strings | Parses quote & inquiry strings | **Fully Compatible** |
| **PostgREST Storage** | PostgreSQL tables | Stored in `VARCHAR(50)` | Stored in `VARCHAR(50)` ($49 \le 50$) | **Fully Compatible** |
| **Audit Logs** | `public.lead_audit_logs` | `entity_id VARCHAR(100)` | `entity_id VARCHAR(100)` ($49 \le 100$) | **Fully Compatible** |
| **CRM Activities** | `public.crm_activities` | `inquiry_id VARCHAR(50)` | `inquiry_id VARCHAR(50)` ($49 \le 50$) | **Fully Compatible** |

No historical lead records require alteration or data migration.

---

## 7. Error Handling Architecture

```
                  POST /api/save-lead
                          │
                          ▼
            [In-Memory Deduplication (60s)]
             ├── Match found? ──> Return HTTP 200 (Cached Reference)
             └── Unique?
                  │
                  ▼
         [Generate Server-Side UUIDs]
                  │
                  ▼
         [saveLeadToSupabase (Insert-Only)]
             ├── Success? ──> Proceed to Quotation Persistence
             ├── Error 23505 (Collision)?
             │    └── Retry with new UUID (Max 2 attempts)
             │    └── Failure? ──> Return HTTP 500 (Safe abort, no overwrite)
             └── Error 5xx / Timeout?
                  └── Clear dedupKey; Return HTTP 500 (Fail-closed)
                  │
                  ▼
      [saveQuotationToSupabase (Insert-Only)]
             ├── Success? ──> Return HTTP 200 { success: true, inquiryId, quoteId }
             ├── Error 23503 (Foreign Key)?
             │    └── Log relational mismatch; Quote marked unlinked
             │    └── Lead remains preserved; Return HTTP 200 with lead confirmed
             └── Error 5xx / Timeout?
                  └── Log quote error; Lead remains preserved
```

### 7.1 Specific Failure Handling Protocols
- **PostgreSQL 23505 (`unique_violation`):** Handled via bounded retry. Under insert-only mode, the duplicate is rejected by PostgreSQL. The server generates a fresh UUID and retries once.
- **PostgreSQL 23503 (`foreign_key_violation`):** Handled by setting the quotation's `inquiry_id` to `null` or aborting quotation creation with an audit log. The system **never** substitutes another lead ID.
- **Ambiguous Network Timeouts:** In the event of a client timeout, client deduplication caches prevent duplicate processing, and the database rejects any colliding insert attempts safely.

---

## 8. Exact Implementation Specification

The proposed implementation is strictly confined to **two source files**:

### 8.1 File 1: `api/save-lead.js`
- **Functions Affected:** Default export handler (Lines 157–164).
- **Current Vulnerability:** Accepts `body.inquiryId` and `body.quoteId` from unauthenticated client input and relies on low-entropy `Math.random()`.
- **Proposed Correction:**
```javascript
import crypto from 'crypto';

// 3. ID Generation (Cryptographically Secure UUIDv4, Server-Enforced)
const now = new Date();
const currentYear = now.getUTCFullYear();
const timestamp = now.toISOString();
const dateStr = timestamp.split('T')[0];

// Strictly server-controlled; ignores caller-supplied body.inquiryId or body.quoteId
const inquiryId = `AAF-INQ-${currentYear}-${crypto.randomUUID()}`;
const quoteId = `AAF-Q-${currentYear}-${crypto.randomUUID()}`;
```
- **Security Invariant:** External callers can no longer select IDs; collision probability drops to $< 10^{-28}$.

### 8.2 File 2: `api/_lib/supabaseClient.js`
- **Functions Affected:** `saveLeadToSupabase` (Line 171) and `saveQuotationToSupabase` (Lines 237–240, 280).
- **Current Vulnerabilities:**
  1. `prefer: 'resolution=merge-duplicates'` allows UPSERT overwrite.
  2. `!rawInquiryId.startsWith('AAF-INQ-2026-')` nullifies legitimate new inquiry IDs.
- **Proposed Correction:**
```javascript
// In saveLeadToSupabase (Line 171):
const result = await supabaseFetch('leads', {
  method: 'POST',
  body: row,
  prefer: 'return=representation' // INSERT-ONLY; eliminates silent UPSERT overwrite
});

// In saveQuotationToSupabase (Lines 237–240):
const rawInquiryId = typeof quoteRecord.inquiryId === 'string' ? quoteRecord.inquiryId.trim() : (quoteRecord.leadId || null);
const isValidInquiryId = rawInquiryId && /^AAF-(INQ|L)-\d{4}-[A-Za-z0-9-]+$/.test(rawInquiryId) && rawInquiryId.length <= 50;
const safeInquiryId = isValidInquiryId ? rawInquiryId : (existingDelivery?.inquiry_id || null);

// In saveQuotationToSupabase (Line 280):
const result = await supabaseFetch('quotations', {
  method: 'POST',
  body: row,
  prefer: 'return=representation' // INSERT-ONLY for new quotations
});
```
- **Preservation of Dependencies:** `src/lib/emailjs.js` is preserved in its entirety to ensure tests 8 and 10 in `scripts/test_package_3f_isolated_remediation.cjs` continue to pass.

---

## 9. Test Plan Design Only (Execution Strictly Prohibited)

In compliance with the read-only mandate, the following 18 tests are designed for execution only upon future explicit owner authorization:

| Test ID | Test Name & Scenario | Input | Expected Result | Security Property Enforced | Failure Condition |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **T-01** | Public Caller Supplies Existing `inquiryId` | `POST /api/save-lead` with `{"inquiryId": "AAF-INQ-2026-TARGET123", ...}` | Server ignores input; assigns new `AAF-INQ-2026-<UUID>`. | Client trust boundary isolation. | Existing lead is overwritten or caller ID accepted. |
| **T-02** | Public Caller Supplies Existing `quoteId` | `POST /api/save-lead` with `{"quoteId": "AAF-Q-2026-TARGET123", ...}` | Server ignores input; assigns new `AAF-Q-2026-<UUID>`. | Client trust boundary isolation. | Existing quote is overwritten or caller ID accepted. |
| **T-03** | Sequential Submissions Generate Distinct IDs | Two sequential submissions with identical form data after 61s. | Two unique IDs with distinct UUID suffixes generated. | ID uniqueness and PRNG independence. | Suffixes match or collide. |
| **T-04** | Simulated ID Collision Rejection | Mock `saveLeadToSupabase` simulating existing `inquiry_id` collision. | PostgreSQL returns error `23505`. | Database unique constraint integrity. | PostgREST silently updates existing record. |
| **T-05** | Database Unique Constraint Rejection | Direct mock INSERT with identical `inquiry_id`. | Throws HTTP 409 / PostgreSQL `23505`. | Referential integrity enforcement. | Duplicate key inserted or merged. |
| **T-06** | Bounded Retry on Collision | Simulated `23505` error on initial lead insert. | System catches error, generates new UUID, retries insert. | High-availability resilience without overwrite. | Request fails immediately without retry, or retries with same ID. |
| **T-07** | Retry Limit Enforcement | Repeated mock `23505` errors exceeding retry bound. | Request fails safely after 2 attempts; returns HTTP 500. | Denial-of-Service / infinite loop prevention. | Unbounded retry loop occurs. |
| **T-08** | Duplicate Form Submission (60s Window) | Identical form submitted twice within 10 seconds. | In-memory cache returns HTTP 200 with cached reference; DB not hit. | Ingestion deduplication and resource protection. | Database receives second insert or merges. |
| **T-09** | Invalid Quotation `inquiryId` Rejection | `saveQuotationToSupabase` called with non-existent `inquiryId`. | PostgreSQL raises `23503`; quote not linked to invalid lead. | Foreign-key referential integrity. | Quotation links to non-existent lead or substitutes random lead. |
| **T-10** | Missing Quotation `inquiryId` Handling | Quotation saved with `inquiryId: null`. | Quote persists with `inquiry_id = null`. | Standalone quotation support (Owner Decision 1). | Insert fails or generates fictitious lead. |
| **T-11** | Quotation-to-Lead Relationship Persistence | Standard web enquiry submitted. | Lead persisted; quote persisted with matching `inquiry_id`. | Relational integrity preservation. | Quotation has `inquiry_id = null`. |
| **T-12** | Admin Authorization Isolation | Admin modifies quote via `/api/admin-quotations`. | Permitted only with valid session and CSRF token. | Administrative privilege control. | Unauthenticated caller updates quotation. |
| **T-13** | Legacy ID Compatibility Verification | Query existing lead with legacy `AAF-L-2026-` ID. | Validated successfully by regex; displayed properly. | Backwards compatibility. | Regex rejects legacy format. |
| **T-14** | PostgreSQL Error 23503 Protocol | Direct DB call triggering foreign-key violation. | Returns structured error JSON without crashing process. | Graceful database error handling. | Unhandled exception or process termination. |
| **T-15** | PostgreSQL Error 23505 Protocol | Direct DB call triggering unique violation. | Returns structured error JSON without updating record. | Graceful database error handling. | Record overwritten via UPSERT. |
| **T-16** | Network Timeout Fail-Closed Behavior | Database fetch experiences network timeout. | Endpoint clears deduplication slot; returns HTTP 500. | Fail-closed transactional safety. | False success returned to user. |
| **T-17** | EmailJS Shim Integrity | Inspect `src/lib/emailjs.js`. | File exists, zero `@emailjs/browser` imports, routes to server. | Client form submission security. | File deleted or browser-direct dispatch present. |
| **T-18** | Isolated Remediation Test Harness Compatibility | Verify `scripts/test_package_3f_isolated_remediation.cjs`. | All assertions pass against proposed two-file structure. | Regression-free architecture. | Existing test assertions fail. |

---

## 10. Owner Authorization Package

### 10.1 Package Summary
- **Remediation Scope:** Strictly bounded to `api/save-lead.js` and `api/_lib/supabaseClient.js`.
- **Database Migrations:** **Zero (0)**. The schema already possesses all required tables, constraints, and indexes.
- **Preserved Assets:** `src/lib/emailjs.js` and test harnesses remain untouched.
- **Rollback Safety:** Rollback involves reverting the two files to commit `2f1a5481fd47488244277b3c756995bbcce75315`.

### 10.2 Residual Risks & Governance
- **Residual Risk:** Distributed serverless instances do not share in-memory deduplication state across distinct cold-start execution contexts.
  - *Mitigation:* The database `UNIQUE` constraint on `inquiry_id` and insert-only mode guarantee that even under distributed concurrent execution, zero buyer records can be overwritten.
- **Required Future Approvals:** Formal owner sign-off is required before any transition from `SPECIFICATION ONLY` to `IMPLEMENTATION AUTHORIZED`.

---

## 11. Final Report Classification

### Authoritative Classification: `VERIFIED_SAFE_FOR_OWNER_AUTHORIZATION`

**Justification:**
1. The mathematical proof demonstrates that switching to UUIDv4 reduces collision risk from 42.6% to $< 10^{-28}$.
2. The UUIDv4 prefixed format (`AAF-INQ-YYYY-<UUID>`) measures 49 characters, fitting within `VARCHAR(50)`.
3. Eliminating `resolution=merge-duplicates` removes the vulnerability enabling unauthenticated buyer lead overwrites.
4. Correcting `supabaseClient.js:239` restores 100% of legitimate quotation-to-lead relational linkages.
5. The proposed remediation requires zero database migrations and preserves existing test harnesses.

---

## 12. Strict Zero-Activity Governance Verification Table

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
