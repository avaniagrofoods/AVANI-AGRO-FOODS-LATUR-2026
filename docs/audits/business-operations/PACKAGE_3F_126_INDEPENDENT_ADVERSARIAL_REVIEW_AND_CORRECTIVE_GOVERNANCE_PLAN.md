# PACKAGE 3F.126 — INDEPENDENT ADVERSARIAL REVIEW OF PACKAGE 3F.125 AND CORRECTIVE GOVERNANCE PLAN

**DOCUMENT REFERENCE:** `AAF-ADV-3F-126`  
**PROJECT:** AVANI AGRO FOODS WEBSITE ENGINE (`2-AVANI AGRO FOODS LATUR 2026` — PROJECT A ONLY)  
**DATE:** 17 November 2026  
**MODE:** STRICT READ-ONLY INDEPENDENT ADVERSARIAL REVIEW & CORRECTIVE GOVERNANCE (NO IMPLEMENTATION)  
**AUTHORITATIVE REFERENCES:** `PACKAGE 3F.120`, `PACKAGE 3F.121`, `PACKAGE 3F.122`, `PACKAGE 3F.123`, `PACKAGE 3F.124`, `PACKAGE 3F.125`  
**MANDATORY GOVERNANCE LOCKS (UNCHANGED & NON-NEGOTIABLE):**
- `GLOBAL_OUTREACH_STOP=1`
- `OUTREACH_AUTHORIZED=0`
- `PILOT_AUTHORIZED=0`

**OPERATIONAL PERMISSION BOUNDARIES (ALL ZERO / NOT AUTHORIZED):**
- `IMPLEMENTATION_AUTHORIZED=0`
- `DATABASE_MIGRATION_AUTHORIZED=0`
- `TEST_EXECUTION_AUTHORIZED=0`
- `DEPLOYMENT_AUTHORIZED=0`
- `GIT_COMMIT_AUTHORIZED=0`
- `GIT_PUSH_AUTHORIZED=0`
- `EXTERNAL_COMMUNICATION_AUTHORIZED=0`

---

## 1. EXECUTIVE SUMMARY & ADVERSARIAL VERDICT

This package performs an independent adversarial review of **Package 3F.125** (`AAF-GOV-3F-125`). While Package 3F.125 correctly established an explicit approval-token framework and reconciled the Git baseline status, deep adversarial scrutiny revealed **five architectural, procedural, and evidentiary flaws** that must be corrected before any owner authorization can be safely solicited:

1. **Phase 1B Migration Conflation:** Package 3F.125 incorrectly placed the quotation validity database migration (`validity_days`, `validity_basis`, `timezone_reference`) into Phase 1B ("Inquiry-to-Quotation Data Integrity"). Relationship integrity between `public.leads` and `public.quotations` requires **ZERO schema migrations** because the foreign-key column `inquiry_id VARCHAR(50) REFERENCES public.leads(inquiry_id) ON DELETE SET NULL` was already migrated and verified in Package 3F.116 (`20261110_quotations_table.sql:12`). The validity migration belongs strictly to **Phase 2 (Quotation Validity)**.
2. **EmailJS Deletion Paradox & Test Fragility:** Package 3F.125 proposed deleting `src/lib/emailjs.js` and updating imports across 4 frontend files. Adversarial inspection revealed that `scripts/test_package_3f_isolated_remediation.cjs` lines 304 and 355 explicitly execute `fs.readFileSync(path.resolve(__dirname, '../src/lib/emailjs.js'))`. Deleting `emailjs.js` will break existing regression test suites! The file is actually a local fetch wrapper and does not import `@emailjs/browser`. A safe re-export shim or retaining the wrapper is mandatory.
3. **Misconception of `inquiry_id` Provenance:** Package 3F.125 asserted that `sLead.record.inquiry_id` is a database-generated ID returned by PostgREST that must be propagated to `quotationRecord`. In reality, `inquiry_id` is generated client-side by Node.js in `api/save-lead.js:162` (`AAF-INQ-2026-${randSuffix}`). `quotationRecord.inquiryId` **ALREADY** receives this exact variable at line 283! The sole point of failure is line 239 of `api/_lib/supabaseClient.js`, where `safeInquiryId` explicitly stripped IDs matching `AAF-INQ-2026-`. No propagation changes in `api/save-lead.js` are necessary.
4. **Unsubstantiated Lock Duration & Zero Data-Loss Claims:** Package 3F.125 claimed `<10 ms lock duration` and `ZERO data-loss risk` for DDL column additions. These claims were theoretical estimates, not empirical facts. In PostgreSQL, `ALTER TABLE` acquires an `AccessExclusiveLock`, which can block concurrent queries if active transactions are queued. These claims are formally **reclassified as UNVERIFIED**, and explicit `SET LOCAL lock_timeout = '2s'` guardrails are mandated.
5. **Historical Backfill Fallacy:** In the live production database (`postgres.zqemrmzijlaysvfxygst`), `public.quotations` contains **exactly 0 rows** (verified in Packages 3F.116 and 3F.119). There are zero historical database quotations to backfill. Any speculative SQL script attempting to link quotes by matching buyer emails is dangerous, unnecessary, and could corrupt audit trails. The backfill proposal is formally **cancelled**.

### Final Review Classification:
**`PLAN_CORRECTED_AND_READY_FOR_OWNER_REVIEW`**

> [!IMPORTANT]
> Zero application source files, database records, schemas, or dependencies were modified during this audit. All governance locks remain strictly active.

---

## 2. SCOPE, PROTECTED BOUNDARIES & NON-NEGOTIABLE GOVERNANCE

### 2.1 Workspace and Project Restrictions
- **Project A Only:** `C:\Users\ALPHA-1\Downloads\21MAY2026\SACHIN SHINDE DOCUMENTS\DEVELOPEMENT TOOLS\2-AVANI AGRO FOODS LATUR 2026`.
- **Project B (`AVANI_AGRO_INTELLIGENCE`):** Strictly out of scope. Never opened, inspected, or modified.
- **Protected Files (Strictly Untouched):**
  - `sequenceStateStore.json`
  - `importersData.js`
  - `importersData.snapshot-642.json`
  - `manufacturersData.js`
  - `api/_data/*` quarantined files
  Zero protected files were inspected, altered, or staged.

### 2.2 Governance Status
- `GLOBAL_OUTREACH_STOP=1` (Active & Enforced)
- `OUTREACH_AUTHORIZED=0` (Active & Enforced)
- `PILOT_AUTHORIZED=0` (Active & Enforced)
- No outbound emails, test transmissions, webhooks, or external communications were initiated.

---

## 3. RECONCILED GIT BASELINE AND UNTRACKED DOCUMENT AUDIT

### 3.1 Empirical Git Inspection Results
- **Repository Root:** `C:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN SHINDE DOCUMENTS/DEVELOPEMENT TOOLS/2-AVANI AGRO FOODS LATUR 2026`
- **Current Branch:** `main`
- **Current HEAD Commit:** `2f1a5481fd47488244277b3c756995bbcce75315`
- **Upstream Tracking:** `origin/main` (Local is completely synchronized with remote).
- **Modified Tracked Files:** `0` (Zero files modified; `git diff` is empty).
- **Staged Files in Index:** `0` (Zero files staged; `git diff --staged` is empty).
- **Untracked Audit Reports:**
  1. `PACKAGE_3F_119_INDEPENDENT_POST_DEPLOYMENT_VERIFICATION.md`
  2. `docs/audits/business-operations/PACKAGE_3F_120_BUSINESS_OPERATIONS_READINESS_AUDIT.md`
  3. `docs/audits/business-operations/PACKAGE_3F_121_BUSINESS_OPERATIONS_REMEDIATION_SPECIFICATION.md`
  4. `docs/audits/business-operations/PACKAGE_3F_122_IMPLEMENTATION_DESIGN_VALIDATION_BLUEPRINT.md`
  5. `docs/audits/business-operations/PACKAGE_3F_123_INDEPENDENT_ADVERSARIAL_VERIFICATION.md`
  6. `docs/audits/business-operations/PACKAGE_3F_124_FINAL_IMPLEMENTATION_READINESS_VALIDATION.md`
  7. `docs/audits/business-operations/PACKAGE_3F_125_OWNER_AUTHORIZATION_AND_CONTROLLED_EXECUTION_PLAN.md`
  8. `docs/audits/production/PACKAGE_3F_119_INDEPENDENT_POST_DEPLOYMENT_VERIFICATION.md`
- **Baseline Audit Finding:** The baseline is **100% RECONCILED**. The working tree is clean with respect to tracked files. All audit reports are strictly untracked markdown documents awaiting separate owner commit authorization.

---

## 4. INVESTIGATION 1: SEPARATION OF PHASE 1 AND PHASE 2 MIGRATION REQUIREMENTS

### 4.1 The Flaw in Package 3F.125
Package 3F.125 structured Phase 1 as:
- Phase 1A: Source-Code Linkage Fix.
- Phase 1B: Database Migration (`supabase/migrations/20261116_quotation_validity.sql`).

### 4.2 Adversarial Codebase Evidence
1. `supabase/migrations/20261110_quotations_table.sql:12` already defines:
   ```sql
   inquiry_id VARCHAR(50) REFERENCES public.leads(inquiry_id) ON DELETE SET NULL
   ```
2. In `docs/audits/production/PACKAGE_3F_116_FINAL_PRODUCTION_CUTOVER.md:19`, migration `20261110_quotations_table.sql` was executed and verified on live Supabase PostgreSQL.
3. The foreign-key column and constraint **ALREADY EXIST** on `public.quotations`.
4. The migration proposed in 3F.125 (`20261116_quotation_validity.sql`) adds:
   - `validity_days INTEGER DEFAULT 14`
   - `validity_basis VARCHAR(100)`
   - `timezone_reference VARCHAR(50)`
5. **Adversarial Critique:** These three columns are strictly for **Quotation Validity (Phase 2)**. They have zero functional or structural relationship to Phase 1 (Relationship Integrity). Conflating them in Phase 1B violates phase-gate boundaries and would force the owner to approve a validity schema change before the validity engine is even reviewed!

### 4.3 Corrected Phase Architecture:
- **Phase 1: Relationship Integrity Remediation:**
  - **Schema Migration Required:** **NONE (0 SQL files)**.
  - **Code Remediation:** Fix `api/_lib/supabaseClient.js:239` to retain genuine `inquiry_id` values.
  - **Verification:** Unit test asserting quotation upsert preserves `AAF-INQ-2026-` foreign key.
- **Phase 2: Quotation Validity & Date Handling:**
  - **Phase 2A (Source Code):** `src/lib/dateUtils.js`, `quotationCore.js`, `quotationModel.js`, `AdminQuotations.jsx`.
  - **Phase 2B (Database Migration):** `supabase/migrations/20261117_quotation_validity.sql` adding `validity_days`, `validity_basis`, and `timezone_reference`.

---

## 5. INVESTIGATION 2: EMAILJS ANALYSIS, DEPENDENCY MAP & WORKFLOW RECONCILIATION

### 5.1 Reconciliation of the Zero-Import Claim vs File Deletion
Package 3F.125 noted that `@emailjs/browser` had zero imports in `src/` and proposed deleting `src/lib/emailjs.js`.
Adversarial inquiry: *If `@emailjs/browser` is not imported, why does `src/lib/emailjs.js` exist, and what happens if it is deleted?*

### 5.2 Evidence & Test Dependency Trap
1. In `scripts/test_package_3f_isolated_remediation.cjs`:
   - Line 304: `const emailjsFileContent = fs.readFileSync(path.resolve(__dirname, '../src/lib/emailjs.js'), 'utf8');`
   - Line 306: `assert(!emailjsFileContent.includes('@emailjs/browser'));`
   - Line 308: `assert(emailjsFileContent.includes('/api/save-lead'));`
   - Line 355: `const emailjsFileContent = fs.readFileSync(path.resolve(__dirname, '../src/lib/emailjs.js'), 'utf8');`
   - Line 357: `assert(emailjsFileContent.includes('normalizePhone'));`
2. **The Risk:** Deleting `src/lib/emailjs.js` will cause existing test suite `test_package_3f_isolated_remediation.cjs` to crash with `ENOENT: no such file or directory`!
3. **File History:** In earlier prototypes, `src/lib/emailjs.js` used `@emailjs/browser`. During Package 3F, browser-direct email dispatch was eliminated for security reasons, and the functions in `emailjs.js` were redirected to native `fetch('/api/save-lead')`. However, the file was kept with its original name so existing UI forms (`Contact.jsx`, `LeadMagnet.jsx`, `B2BRegistration.jsx`) and test assertions would not break.

### 5.3 Complete Dependency and Email Workflow Map

```
+--------------------------------------------------------------------------------------------------+
|                                    EMAIL INFRASTRUCTURE MAP                                      |
+--------------------------------------------------------------------------------------------------+

[User Browser Forms]
   ├── Contact.jsx
   ├── LeadMagnet.jsx
   └── B2BRegistration.jsx
           │
           ▼
[Client Transport: src/lib/emailjs.js (Native fetch wrapper, ZERO @emailjs imports)]
           │
           ▼ HTTP POST /api/save-lead
[Serverless Ingestion: api/save-lead.js]
   ├── 1. Primary DB: saveLeadToSupabase() ───────► Supabase public.leads
   ├── 2. Quotation DB: saveQuotationToSupabase() ─► Supabase public.quotations
   ├── 3. Internal Alert: sendResendEmailWithRetry() ──► Resend API ──► sales@avaniagrofoods.com
   └── 4. Buyer Ack: sendResendEmailWithRetry() ──────► Resend API ──► Buyer Email

[Admin Builder: AdminQuotations.jsx]
   └── action=send-buyer ──► api/admin-quotations.js:831 ──► Resend API ──► Buyer Proforma

[Inbound Reply Hook: api/email-reply-webhook.js]
   └── Resend / Svix Webhook ──► Svix HMAC Verification ──► Distributed Redis CAS ──► Supabase

[Orphaned Package (package.json:15)]
   └── "@emailjs/browser": "^4.4.1" (UNREFERENCED IN BUNDLE — READY FOR NPM UNINSTALL)
```

### 5.4 Safe Remediation Recommendation:
- **Do NOT delete `src/lib/emailjs.js`**.
- Keep `src/lib/emailjs.js` as an active backward-compatibility wrapper or re-export shim:
  ```javascript
  // src/lib/emailjs.js — Backward-Compatibility Transport Wrapper
  // All client form dispatches route securely through serverless /api/save-lead.
  export * from './apiClient.js';
  ```
- This satisfies frontend hygiene, allows creating `src/lib/apiClient.js`, preserves regression test contracts in `test_package_3f_isolated_remediation.cjs`, and allows safe uninstallation of `"@emailjs/browser"` from `package.json`.

---

## 6. INVESTIGATION 3: SUPABASE INSERT RETURN STRUCTURE & INQUIRY ID PROVENANCE

### 6.1 Analysis of `saveLeadToSupabase` Return Pipeline
Package 3F.125 argued that `sLead.record.inquiry_id` is a database-generated ID returned by PostgREST that must be propagated to `quotationRecord`.

### 6.2 Empirical Code Verification
Let us trace the exact lines in `api/save-lead.js` and `api/_lib/supabaseClient.js`:

1. **Inquiry ID Generation (`api/save-lead.js:160-162`):**
   ```javascript
   const randSuffix = Math.floor(100000 + Math.random() * 900000);
   const inquiryId = body.inquiryId || `AAF-INQ-2026-${randSuffix}`;
   ```
   *Fact:* `inquiryId` is generated by Node.js in application memory. It is **NOT** generated by PostgreSQL sequences or database triggers.
2. **Payload Construction (`api/save-lead.js:280-284`):**
   ```javascript
   const quotationRecord = {
     quotationId: quote.quoteId,
     inquiryId, // <--- ALREADY PRESENT IN EXISTING SOURCE CODE!
     quoteDate: quote.date,
     ...
   };
   ```
   *Fact:* `quotationRecord.inquiryId` was ALREADY populated with `inquiryId` before `saveLeadToSupabase` or `saveQuotationToSupabase` was called!
3. **Database Insertion (`api/_lib/supabaseClient.js:168-199`):**
   ```javascript
   const result = await supabaseFetch('leads', {
     method: 'POST',
     body: row,
     prefer: 'resolution=merge-duplicates,return=representation'
   });
   if (result.success) {
     return {
       persisted: true,
       status: 'SUCCESS',
       inquiryId: leadRecord.inquiryId,
       record: result.data?.[0] || row
     };
   }
   ```
   *Fact:* PostgREST returns `result.data[0]`, where `inquiry_id` is simply the exact string passed in `row.inquiry_id`.
4. **The Real Point of Failure (`api/_lib/supabaseClient.js:238-239`):**
   ```javascript
   const rawInquiryId = quoteRecord.inquiryId || quoteRecord.leadId || null;
   const safeInquiryId = (rawInquiryId && !rawInquiryId.startsWith('AAF-INQ-2026-')) 
     ? rawInquiryId 
     : (existingDelivery?.inquiry_id || null);
   ```
   *Fact:* `quoteRecord.inquiryId` (`'AAF-INQ-2026-XXXXXX'`) was passed into `saveQuotationToSupabase`, but line 239 checked `!rawInquiryId.startsWith('AAF-INQ-2026-')`. Because it *did* start with `'AAF-INQ-2026-'`, the condition evaluated to `false`, discarding `rawInquiryId` and saving `inquiry_id = null`.

### 6.3 Conclusion:
No changes to `api/save-lead.js` are necessary. Proposing to change `api/save-lead.js` to assign `quotationRecord.inquiryId = sLead.record.inquiry_id` was redundant. The bug is **100% contained in `api/_lib/supabaseClient.js:239`**.

---

## 7. INVESTIGATION 4: CRITICAL AUDIT OF DDL LOCK DURATION & DATA-LOSS CLAIMS

### 7.1 Adversarial Reclassification: UNVERIFIED
In Package 3F.125 Section 9.2, the following statements were made:
- "Lock Duration: < 10 milliseconds"
- "Data Loss Risk: ZERO"

### 7.2 Technical Critique & Justification for Reclassification
1. **AccessExclusiveLock Behavior:** Adding a column in PostgreSQL via `ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS ... DEFAULT ...` requires an `AccessExclusiveLock`.
2. **Lock Queuing Vulnerability:** While PostgreSQL 11+ updates catalog metadata without rewriting tables for constant defaults, `AccessExclusiveLock` cannot be acquired until all existing concurrent read/write queries on `public.quotations` finish. If a slow transaction is running, the `ALTER TABLE` statement waits in queue. In PostgreSQL, once an `AccessExclusiveLock` enters the queue, **all subsequent SELECT, INSERT, and UPDATE queries behind it are blocked**, potentially freezing the application!
3. **Absence of Staging Benchmark:** No empirical measurement on the live Supabase database instance has been performed. Stating `< 10 milliseconds` as a confirmed metric without lock telemetry is an unverified assumption.
4. **Data Loss Pre-requisite:** Declaring "Data Loss Risk: ZERO" without a verified point-in-time recovery backup plan violates production release standards.
5. **Formal Classification:**
   - Lock Duration: **`UNVERIFIED (THEORETICAL DESIGN ESTIMATE)`**
   - Data Loss Risk: **`UNVERIFIED (REQUIRES PRE-MIGRATION SNAPSHOT)`**

### 7.3 Mandatory DDL Guardrails for Phase 2B:
Any future migration on `public.quotations` must include explicit session timeouts:
```sql
BEGIN;
-- Set lock timeout to 2 seconds to prevent blocking application queries
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '5s';

ALTER TABLE public.quotations 
  ADD COLUMN IF NOT EXISTS validity_days INTEGER DEFAULT 14,
  ADD COLUMN IF NOT EXISTS validity_basis VARCHAR(100) DEFAULT 'STANDARD_PROFORMA',
  ADD COLUMN IF NOT EXISTS timezone_reference VARCHAR(50) DEFAULT 'Asia/Kolkata';

COMMIT;
```

---

## 8. INVESTIGATION 5: HISTORICAL QUOTATION BACKFILL ANALYSIS

### 8.1 Empirical Verification of Production Database State
Previous packages proposed an optional SQL backfill script:
```sql
UPDATE public.quotations q SET inquiry_id = l.inquiry_id FROM public.leads l WHERE ...
```

### 8.2 Audit Finding: Exactly Zero Records in `public.quotations`
1. In `docs/audits/production/PACKAGE_3F_116_FINAL_PRODUCTION_CUTOVER.md:90`: Pre-migration count of `public.quotations` was verified as `0`.
2. In `PACKAGE_3F_119_INDEPENDENT_POST_DEPLOYMENT_VERIFICATION.md:170`: Post-deployment verification confirmed:
   - `Total Rows in public.quotations: 0`
   - `Total Rows in public.leads: 20`
3. **Conclusion:** There are **ZERO historical quotation rows** in `public.quotations` in the live production database!

### 8.3 Inherent Flaws of Heuristic Backfill
Even if historical quotations existed, matching by `LOWER(TRIM(q.buyer_email)) = LOWER(TRIM(l.email))` is fundamentally flawed:
1. **Multiple Inquiries per Buyer:** A single buyer email (e.g. an importer) may submit multiple inquiries over months for different products (e.g. Moringa Powder vs Red Onion Powder). A blanket email-match join would attach the quotation to an arbitrary or incorrect inquiry!
2. **Offline Admin Quotations:** Administrators can create quotations directly in `AdminQuotations.jsx` for phone or WhatsApp enquiries that have no web lead. Heuristic email matching would falsely attach an offline phone quote to a historical web inquiry!
3. **Audit Verdict:** The historical backfill proposal is formally **CANCELLED**. Zero backfill operations will be executed.

---

## 9. CORRECTED PHASE-BY-PHASE CHANGE MATRIX & SCOPE BOUNDARIES

The execution plan is corrected to strictly isolate functional domains:

```
+--------------------------------------------------------------------------------------------------+
| PHASE 0: BASELINE PREFLIGHT & INTEGRITY AUDIT                                                    |
| - Verify Git status (0 dirty tracked files).                                                     |
| - Verify Supabase connectivity and record count (leads=20, quotations=0).                        |
| - No files modified.                                                                             |
+--------------------------------------------------------------------------------------------------+
                                                 │
                                                 v
+--------------------------------------------------------------------------------------------------+
| PHASE 1: RELATIONSHIP INTEGRITY REMEDIATION (NO DATABASE MIGRATION)                              |
| - Scope: Fix api/_lib/supabaseClient.js:239 (remove startsWith stripping).                       |
| - Database Migration: NONE (0 SQL files). Foreign key already exists in schema.                  |
| - Exact Change Target: api/_lib/supabaseClient.js ONLY.                                          |
+--------------------------------------------------------------------------------------------------+
                                                 │
                                                 v
+--------------------------------------------------------------------------------------------------+
| PHASE 2: QUOTATION VALIDITY & DATE HANDLING (INCLUDES MIGRATION)                                 |
| - Phase 2A (Source Code):                                                                        |
|   • src/lib/dateUtils.js (NEW canonical date & expiry utility)                                   |
|   • src/data/quotationCore.js (date normalization)                                               |
|   • src/data/quotationModel.js (validity property consolidation)                                 |
|   • src/pages/AdminQuotations.jsx (preset buttons, date picker, Amber badge)                     |
| - Phase 2B (Database Migration):                                                                 |
|   • supabase/migrations/20261117_quotation_validity.sql (validity_days, basis, timezone)         |
+--------------------------------------------------------------------------------------------------+
                                                 │
                                                 v
+--------------------------------------------------------------------------------------------------+
| PHASE 3: SECURE SERVER-SIDE KPI AGGREGATION ENGINE                                               |
| - Scope:                                                                                         |
|   • api/admin-quotations.js (add action=kpi-summary, Zero PII, N/A zero-data semantics)           |
|   • src/pages/PrivateDashboard.jsx (consume server endpoint, remove client PII aggregation)      |
+--------------------------------------------------------------------------------------------------+
                                                 │
                                                 v
+--------------------------------------------------------------------------------------------------+
| PHASE 4: EMAIL ARCHITECTURE CLEANUP & DEPENDENCY PRUNING                                         |
| - Scope:                                                                                         |
|   • src/lib/apiClient.js (NEW native fetch wrappers)                                             |
|   • src/lib/emailjs.js (RE-EXPORT SHIM to preserve test suites, DO NOT DELETE)                   |
|   • package.json (uninstall unused @emailjs/browser)                                             |
|   • Optional: re-point form imports in Contact.jsx, LeadMagnet.jsx, B2BRegistration.jsx           |
+--------------------------------------------------------------------------------------------------+
```

---

## 10. CORRECTED DATABASE MIGRATION PLAN (PHASE 2B)

### 10.1 Separation Confirmation
- **Phase 1 Migration:** **NONE**.
- **Phase 2 Migration:** `supabase/migrations/20261117_quotation_validity.sql`.

### 10.2 Production Migration DDL Contract
```sql
-- Migration: 20261117_quotation_validity.sql
-- Project: AVANI AGRO FOODS Website Engine (Project A)
-- Phase: 2B (Quotation Validity & Date Handling)
-- Prerequisites: lock_timeout and statement_timeout enforced

BEGIN;

SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '5s';

ALTER TABLE public.quotations 
  ADD COLUMN IF NOT EXISTS validity_days INTEGER DEFAULT 14,
  ADD COLUMN IF NOT EXISTS validity_basis VARCHAR(100) DEFAULT 'STANDARD_PROFORMA',
  ADD COLUMN IF NOT EXISTS timezone_reference VARCHAR(50) DEFAULT 'Asia/Kolkata';

COMMENT ON COLUMN public.quotations.validity_days IS 'Number of calendar days offer remains valid from issue date';
COMMENT ON COLUMN public.quotations.validity_basis IS 'Commercial pricing basis (e.g. STANDARD_PROFORMA, SHORT_VALIDITY_FX)';
COMMENT ON COLUMN public.quotations.timezone_reference IS 'Timezone for midnight expiry boundary (Asia/Kolkata)';

COMMIT;
```

---

## 11. TEST AUTHORIZATION & CLASSIFICATION REGISTER

All tests remain unexecuted and require explicit, separate owner authorization tokens:

| Test Identifier | Phase | Execution Mode | Scope & Invariant Verified | Approval Token |
| :--- | :---: | :---: | :--- | :--- |
| **TEST-P1-01** | Phase 1 | `LOCAL_TEST` | Asserts `saveQuotationToSupabase` retains `AAF-INQ-2026-` IDs without foreign key violations. | `APPROVE_TESTS_PHASE_1` |
| **TEST-P2-01** | Phase 2 | `LOCAL_TEST` | Asserts `parseToIsoDate('12 Oct 2026') === '2026-10-12'`. | `APPROVE_TESTS_PHASE_2` |
| **TEST-P2-02** | Phase 2 | `LOCAL_TEST` | Asserts `isQuotationExpired()` enforces exact `23:59:59.999 IST` boundary across UTC midnight. | `APPROVE_TESTS_PHASE_2` |
| **TEST-P3-01** | Phase 3 | `LOCAL_TEST` | Asserts `action=kpi-summary` returns `N/A` for zero decided quotes and returns zero buyer PII. | `APPROVE_TESTS_PHASE_3` |
| **TEST-P4-01** | Phase 4 | `LOCAL_TEST` | Asserts `scripts/test_package_3f_isolated_remediation.cjs` passes with `emailjs.js` shim. | `APPROVE_TESTS_PHASE_4` |
| **TEST-P4-02** | Phase 4 | `LOCAL_TEST` | Asserts `npm run build` succeeds cleanly without `@emailjs/browser` in `package.json`. | `APPROVE_TESTS_PHASE_4` |

---

## 12. RELEASE, DEPLOYMENT & GIT AUTHORIZATION GATES

1. **`APPROVE_PRODUCTION_DEPLOYMENT`:** Requires all 4 phases completed, all tests passed, and Vercel environment variables verified.
2. **`APPROVE_GIT_COMMIT`:** Explicitly lists files to be staged. Blanket `git add .` is forbidden.
3. **`APPROVE_GIT_PUSH`:** Authorizes `git push origin main`. No force-pushes or history rewriting.

---

## 13. OUTREACH AND EXTERNAL SYSTEM RESTRICTIONS

- `GLOBAL_OUTREACH_STOP=1` remains active.
- `OUTREACH_AUTHORIZED=0` remains active.
- `PILOT_AUTHORIZED=0` remains active.
- Zero buyer emails, cold outreach sequences, WhatsApp messages, or marketing campaigns may be triggered.

---

## 14. RESIDUAL RISKS AND UNRESOLVED QUESTIONS

1. **Owner Decision on FX Clause:** Owner decision remains `REVIEW`. Commercial Option A (Firm 7–10 days validity) remains the operational recommendation. No contractual FX clauses are activated.
2. **Live Migration Lock Telemetry:** In Phase 2B, the `SET LOCAL lock_timeout = '2s'` ensures that if Supabase PostgreSQL has open transactions, the migration aborts safely rather than blocking production traffic.

---

## 15. CORRECTED OWNER DECISION FORM

```
================================================================================
           AVANI AGRO FOODS — CORRECTED OWNER DECISION FORM (3F.126)
================================================================================

[ ] PHASE 1: Source-Code Linkage Remediation (api/_lib/supabaseClient.js)
    Token: APPROVE_PHASE_1_SOURCE_CHANGES
    (Note: Zero database migrations in Phase 1)

[ ] PHASE 1 TESTS: Execute Unit Tests for Phase 1
    Token: APPROVE_TESTS_PHASE_1

[ ] PHASE 2A: Quotation Validity & Date Engine (Code)
    Token: APPROVE_PHASE_2A_VALIDITY_CODE

[ ] PHASE 2B: Database Migration (supabase/migrations/20261117_quotation_validity.sql)
    Token: APPROVE_PHASE_2B_VALIDITY_MIGRATION

[ ] PHASE 2 TESTS: Execute Date & Expiry Boundary Tests
    Token: APPROVE_TESTS_PHASE_2

[ ] PHASE 3: Secure Server-Side KPI Aggregation Engine
    Token: APPROVE_PHASE_3_KPI_AGGREGATION

[ ] PHASE 3 TESTS: Execute KPI Analytics & Security Tests
    Token: APPROVE_TESTS_PHASE_3

[ ] PHASE 4: Email Shim & Prune @emailjs/browser Dependency
    Token: APPROVE_PHASE_4_EMAIL_CONSOLIDATION

[ ] PHASE 4 TESTS: Execute Build & Test Suite Verification
    Token: APPROVE_TESTS_PHASE_4

[ ] RELEASE: Deploy Validated Build to Production Vercel
    Token: APPROVE_PRODUCTION_DEPLOYMENT

[ ] RELEASE: Git Commit Approved Files
    Token: APPROVE_GIT_COMMIT

[ ] RELEASE: Git Push to Remote Repository
    Token: APPROVE_GIT_PUSH

================================================================================
```

---

## 16. FINAL READINESS CLASSIFICATION

### Classification: **`PLAN_CORRECTED_AND_READY_FOR_OWNER_REVIEW`**

All five flaws of Package 3F.125 are corrected:
1. Phase 1 has zero migrations; validity migration is moved strictly to Phase 2B.
2. `src/lib/emailjs.js` is preserved as a re-export shim, protecting existing regression test suites.
3. ID provenance is proven to be client-generated, isolating the defect 100% to `supabaseClient.js:239`.
4. DDL lock duration is reclassified as `UNVERIFIED` and protected with a 2-second lock timeout.
5. Historical backfill is formally cancelled due to zero database quotations.

**IMPLEMENTATION IS NOT AUTHORIZED BY THIS REPORT.**

---
*Certified by Senior Independent Software Implementation Governance Auditor & Application Security Specialist.*
