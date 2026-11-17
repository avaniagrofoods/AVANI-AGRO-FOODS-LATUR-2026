# PACKAGE 3F.125 — OWNER-AUTHORIZATION FRAMEWORK & PHASE-GATED CONTROLLED EXECUTION PLAN

**DOCUMENT REFERENCE:** `AAF-GOV-3F-125`  
**PROJECT:** AVANI AGRO FOODS WEBSITE ENGINE (`2-AVANI AGRO FOODS LATUR 2026` — PROJECT A ONLY)  
**DATE:** 17 November 2026  
**MODE:** STRICT READ-ONLY IMPLEMENTATION GOVERNANCE & CONTROLLED EXECUTION FRAMEWORK  
**AUTHORITATIVE REFERENCES:** `PACKAGE 3F.120`, `PACKAGE 3F.121`, `PACKAGE 3F.122`, `PACKAGE 3F.123`, `PACKAGE 3F.124`  
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

## 1. EXECUTIVE SUMMARY

This document establishes the comprehensive **Owner-Authorization Framework and Phase-Gated Controlled Execution Plan** for the AVANI AGRO FOODS Website Engine (Project A). Building on the forensic findings of Packages 3F.120 through 3F.124, this package defines the exact boundary conditions, verification criteria, rollback procedures, and approval tokens required before any source code, database schema, or deployment artifact may be modified.

### Key Governance Declarations:
1. **THIS DOCUMENT DOES NOT AUTHORIZE IMPLEMENTATION.** Preparation of this plan is strictly read-only.
2. **ZERO APPLICATION SOURCE CODE HAS BEEN MODIFIED.**
3. **ZERO DATABASE RECORDS OR SCHEMAS HAVE BEEN ALTERED.**
4. **ZERO TESTS, COMMITS, PUSHES, OR DEPLOYMENTS HAVE BEEN EXECUTED.**
5. **ABSOLUTE OUTREACH STOP REMAINS IN FORCE.** No emails, webhooks, campaigns, WhatsApp messages, or external buyer/supplier communications are authorized.

### Baseline Reconciliation Summary:
The reported inconsistency in Package 3F.124 regarding the working tree being "clean" versus "audit reports untracked and staged for commit" has been **reconciled via direct Git inspection**. The repository has **zero modified tracked files**, **zero staged files in the Git index**, and exactly **seven untracked audit documents** (Packages 3F.119 through 3F.124). The working tree is stable, tracked files match commit `2f1a548` exactly, and local `main` is identical to `origin/main`.

### Final Plan Classification:
**`PLAN_READY_FOR_OWNER_REVIEW`**

---

## 2. SCOPE AND EXCLUSIONS

### 2.1 Permitted Scope (Project A Only)
- Canonical Path: `C:\Users\ALPHA-1\Downloads\21MAY2026\SACHIN SHINDE DOCUMENTS\DEVELOPEMENT TOOLS\2-AVANI AGRO FOODS LATUR 2026`
- Architectural focus areas:
  1. Relational linkage between `public.leads` and `public.quotations` (DEF-120-01 / DEF-123-02).
  2. Individual quotation validity, date normalization, and `Asia/Kolkata` timezone anchoring (DEF-123-01 / DEF-123-03 / DEF-123-04).
  3. Zero-PII, server-authenticated Dashboard KPI aggregation engine with strict zero-data semantics (DEF-120-03 / DEF-123-05).
  4. Authoritative Resend email architecture and safe deprecation of `@emailjs/browser` (DEF-120-02).

### 2.2 Strictly Excluded Scope (Protected & Out-of-Scope)
- **Project B (`AVANI_AGRO_INTELLIGENCE`):** Strictly out of scope. Must not be accessed, inspected, modified, or tested.
- **Protected / Quarantined Files in Project A:**
  - `sequenceStateStore.json` (quarantined)
  - `importersData.js` (quarantined)
  - `importersData.snapshot-642.json` (quarantined)
  - `manufacturersData.js` (quarantined)
  - `api/_data/*` (quarantined artifacts)
  No inspection or modification of these protected files is permitted.
- **Commercial Commitments:** No foreign exchange contractual clauses may be activated (retaining Owner Decision: `REVIEW`).

---

## 3. EVIDENCE REVIEWED & TECHNICAL CITATIONS

All findings are grounded in direct, read-only inspection of repository source files:

| Evidence Tag | Source Path | Target Lines | Inspected Content & Architectural Observation | Classification |
| :--- | :--- | :--- | :--- | :---: |
| **EVD-125-01** | `api/save-lead.js` | Lines 160–164 | `inquiryId = body.inquiryId \|\| AAF-INQ-2026-${randSuffix}`; `quoteId = body.quoteId \|\| AAF-Q-2026-${randQuoteSuffix}`. | **VERIFIED** |
| **EVD-125-02** | `api/save-lead.js` | Lines 319, 328, 336 | `saveLeadToSupabase(inquiryRecord)` executed before `saveQuotationToSupabase(quotationRecord)`. Aborts with 500 if lead fails. | **VERIFIED** |
| **EVD-125-03** | `api/_lib/supabaseClient.js` | Lines 168–199 | PostgREST `POST` with `return=representation` returns inserted database row `result.data[0]`. | **VERIFIED** |
| **EVD-125-04** | `api/_lib/supabaseClient.js` | Lines 237–240 | Defective check: `!rawInquiryId.startsWith('AAF-INQ-2026-')` forces `safeInquiryId = null` for genuine leads. | **VERIFIED** |
| **EVD-125-05** | `supabase/migrations/20261110_quotations_table.sql` | Line 12 | Foreign key: `inquiry_id VARCHAR(50) REFERENCES public.leads(inquiry_id) ON DELETE SET NULL`. | **VERIFIED** |
| **EVD-125-06** | `supabase/migrations/20261103_init_b2b_leads.sql` | Line 9 | Referenced key: `inquiry_id VARCHAR(50) UNIQUE NOT NULL`. | **VERIFIED** |
| **EVD-125-07** | `src/pages/AdminQuotations.jsx` | Line 2163 | Text input `<input placeholder="12 Oct 2026" ... />` binds unparsed string to `builderForm.validUntil`. | **VERIFIED** |
| **EVD-125-08** | `src/data/quotationCore.js` | Line 31 | `validUntil = input.validUntil \|\| '12 Oct 2026'`. Hardcoded default human string. | **VERIFIED** |
| **EVD-125-09** | `src/data/quotationModel.js` | Lines 839, 1203 | Redundant validity property fragmentation across `validUntil`, `validityDate`, `validity`. | **VERIFIED** |
| **EVD-125-10** | `src/pages/PrivateDashboard.jsx` | Lines 42–126 | In-memory client-side aggregation loading raw lead PII and blending `localStorage`. | **VERIFIED** |
| **EVD-125-11** | `api/admin-quotations.js` | Lines 133, 175, 443 | Upstash KV gate session authentication (`verifyAdminAuth`) and rate limiting (60 req / 15 min). | **VERIFIED** |
| **EVD-125-12** | `package.json` | Line 15 | Orphaned dependency `"@emailjs/browser": "^4.4.1"`. Zero imports across `src/` or `api/`. | **VERIFIED** |

---

## 4. RECONCILED GIT BASELINE

### 4.1 Reconciled Baseline Audit

```
+--------------------------------------------------------------------------------------------------+
|                                  GIT BASELINE RECONCILIATION AUDIT                               |
+--------------------------------------------------------------------------------------------------+
```

1. **Repository Root:** `C:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN SHINDE DOCUMENTS/DEVELOPEMENT TOOLS/2-AVANI AGRO FOODS LATUR 2026`
2. **Current Branch:** `main`
3. **Current HEAD SHA:** `2f1a5481fd47488244277b3c756995bbcce75315`
4. **Upstream Tracking Branch:** `origin/main`
5. **Local HEAD equals Upstream:** **YES** (`Your branch is up to date with 'origin/main'`).
6. **Modified Tracked Files:** **NONE (0 files)**. `git diff` returned empty.
7. **Staged Files in Index:** **NONE (0 files)**. `git diff --staged` returned empty.
8. **Untracked Files:** Exactly 7 files:
   - `PACKAGE_3F_119_INDEPENDENT_POST_DEPLOYMENT_VERIFICATION.md`
   - `docs/audits/business-operations/PACKAGE_3F_120_BUSINESS_OPERATIONS_READINESS_AUDIT.md`
   - `docs/audits/business-operations/PACKAGE_3F_121_BUSINESS_OPERATIONS_REMEDIATION_SPECIFICATION.md`
   - `docs/audits/business-operations/PACKAGE_3F_122_IMPLEMENTATION_DESIGN_VALIDATION_BLUEPRINT.md`
   - `docs/audits/business-operations/PACKAGE_3F_123_INDEPENDENT_ADVERSARIAL_VERIFICATION.md`
   - `docs/audits/business-operations/PACKAGE_3F_124_FINAL_IMPLEMENTATION_READINESS_VALIDATION.md`
   - `docs/audits/production/PACKAGE_3F_119_INDEPENDENT_POST_DEPLOYMENT_VERIFICATION.md`
9. **Ignored Files:** Standard `.gitignore` entries verified (`node_modules/`, `dist/`, `.env.local`, `.vercel/`). Zero audit documents are ignored.
10. **Reconciliation Conclusion:** The Package 3F.124 statement that the working tree is "clean" was an informal shorthand indicating that *zero tracked application source files were dirty*. The audit documents are strictly **untracked files** waiting for separate owner authorization to commit. Zero staging or committing occurred. The baseline is **100% RECONCILED AND CONSISTENT**.

---

## 5. CURRENT-STATE FINDINGS FOR ALL FIVE DEFECT AREAS

### 5.1 DEF-120-01 / DEF-123-02: Inquiry-to-Quotation Relationship Integrity
- **Current Defect:** In `api/_lib/supabaseClient.js:239`, `safeInquiryId` explicitly discards IDs starting with `AAF-INQ-2026-`. Because genuine enquiries from `api/save-lead.js:162` generate IDs matching `AAF-INQ-2026-${randSuffix}`, every genuine enquiry quotation is saved to PostgreSQL with `inquiry_id = NULL`.
- **Database Schema Verification:** In `supabase/migrations/20261110_quotations_table.sql:12`, `inquiry_id VARCHAR(50) REFERENCES public.leads(inquiry_id) ON DELETE SET NULL`. Both columns are `VARCHAR(50)`. The foreign-key constraint is real, active, and enforces referential integrity.
- **Relational Proof:** In `api/save-lead.js:319`, `saveLeadToSupabase` executes `POST /rest/v1/leads` with `return=representation`. PostgREST returns `result.data[0].inquiry_id`. This committed key can be propagated directly into `quotationRecord.inquiryId` within the serverless execution context without redundant `GET` queries and without trusting external caller booleans.

### 5.2 DEF-123-01 / DEF-123-03 / DEF-123-04: Quotation Validity & Date Handling
- **Current Defect:** In `AdminQuotations.jsx:2163` and `quotationCore.js:31`, validity dates are handled as arbitrary text strings defaulting to `'12 Oct 2026'`. Direct string comparisons (e.g. `'2026-11-17' > '05 Dec 2026'`) compare ASCII values (`'2'` vs `'0'`), causing December dates to falsely evaluate as expired in November.
- **Property Fragmentation:** The codebase redundantly tracks validity under `validUntil`, `commercialTerms.validityDate`, and `validity`.
- **Timezone Drift:** Timezone evaluation is currently unanchored, causing browser client clock drift across UTC midnight.

### 5.3 DEF-123-05: Dashboard KPI Aggregation
- **Current Defect:** `PrivateDashboard.jsx` pulls raw lead dossiers into the browser and calculates metrics in-memory. If no quotations have decided outcomes (current production baseline = 0 quotations), division produces `NaN` or misleading `0%` metrics.
- **Architecture Requirement:** Aggregation must be computed server-side via `action=kpi-summary`, requiring verified `avani_gate_session` authentication, returning zero PII, and enforcing distinct zero-data semantics (`N/A` for zero denominators).

### 5.4 DEF-120-02: Email Architecture Consolidation
- **Current State:** 8 verified production email workflows exist (EM-01 through EM-08). All serverless dispatch uses the Resend API (`api/save-lead.js:409, 448`, `api/admin-quotations.js:831`).
- **Dead Dependency:** `@emailjs/browser: "^4.4.1"` is an orphaned package in `package.json:15`. `src/lib/emailjs.js` is merely a fetch wrapper calling `/api/save-lead`.

---

## 6. CORRECTIVE IMPLEMENTATION PLAN (FOUR PHASE-GATED STAGES)

```
+--------------------------------------------------------------------------------------------------+
| PHASE 0: BASELINE & IMPLEMENTATION PREFLIGHT (READ-ONLY GATE)                                     |
| - Verify Git baseline, Supabase connection status, and preflight checksums.                      |
+--------------------------------------------------------------------------------------------------+
                                                 │
                                                 v
+--------------------------------------------------------------------------------------------------+
| PHASE 1: CORE DATA INTEGRITY & RELATIONSHIP CONTRACT (DEF-120-01 / DEF-123-02)                   |
| 1A: Source Code Changes (api/_lib/supabaseClient.js, api/save-lead.js)                           |
| 1B: Database Migration (supabase/migrations/20261116_quotation_validity.sql)                    |
+--------------------------------------------------------------------------------------------------+
                                                 │
                                                 v
+--------------------------------------------------------------------------------------------------+
| PHASE 2: INDIVIDUAL QUOTATION VALIDITY & TIMEZONE ENGINE (DEF-123-01 / 03 / 04)                  |
| - Implement src/lib/dateUtils.js (ISO normalization, Asia/Kolkata midnight boundary).            |
| - Update src/data/quotationCore.js and quotationModel.js to consolidate on validUntil.          |
| - Update AdminQuotations.jsx with validity days presets, date picker, and Amber badge.           |
+--------------------------------------------------------------------------------------------------+
                                                 │
                                                 v
+--------------------------------------------------------------------------------------------------+
| PHASE 3: SECURE SERVER-SIDE KPI AGGREGATION ENGINE (DEF-120-03 / DEF-123-05)                     |
| - Implement action=kpi-summary in api/admin-quotations.js (Zero PII, Zero-Data N/A semantics).   |
| - Update PrivateDashboard.jsx to consume server-side aggregation.                                |
+--------------------------------------------------------------------------------------------------+
                                                 │
                                                 v
+--------------------------------------------------------------------------------------------------+
| PHASE 4: CLIENT EMAIL CLEANUP & DEPENDENCY PRUNING (DEF-120-02)                                  |
| - Create src/lib/apiClient.js with clean fetch wrappers.                                         |
| - Re-point form imports in Contact.jsx, LeadMagnet.jsx, B2BRegistration.jsx.                      |
| - Delete src/lib/emailjs.js and uninstall @emailjs/browser.                                      |
+--------------------------------------------------------------------------------------------------+
```

---

## 7. OWNER AUTHORIZATION MATRIX

Every phase requires an explicit, separate owner authorization token. **No approval is assumed or preselected.**

| Decision Item | Phase Scope | Recommended Technical Option | Business & Technical Consequence | Approval Token Required | Initial State |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **DEC-01** | **Phase 1A** | Source-Code Linkage Fix | Eliminates FK stripping in `supabaseClient.js`; links future quotes to leads. | `APPROVE_PHASE_1A_SOURCE_CHANGES` | **NOT APPROVED** |
| **DEC-02** | **Phase 1B** | Database Migration | Adds `validity_days`, `validity_basis`, `timezone_reference` to `quotations`. | `APPROVE_PHASE_1B_DATABASE_MIGRATION` | **NOT APPROVED** |
| **DEC-03** | **Phase 1 Test** | Unit / Regression Test | Executes isolated unit test for database persistence contract. | `APPROVE_TESTS_PHASE_1` | **NOT APPROVED** |
| **DEC-04** | **Phase 2** | Validity & Date Engine | Normalizes all dates to ISO; anchors expiry to Asia/Kolkata midnight. | `APPROVE_PHASE_2_QUOTATION_VALIDITY` | **NOT APPROVED** |
| **DEC-05** | **Phase 2 Test** | Date & Expiry Test | Executes boundary tests (leap years, month-ends, timezone boundaries). | `APPROVE_TESTS_PHASE_2` | **NOT APPROVED** |
| **DEC-06** | **Phase 3** | Server-Side KPI Engine | Implements `action=kpi-summary`; eliminates client PII exposure; handles N/A. | `APPROVE_PHASE_3_KPI_AGGREGATION` | **NOT APPROVED** |
| **DEC-07** | **Phase 3 Test** | Analytics Contract Test | Verifies zero-PII payload and exact mathematical contracts. | `APPROVE_TESTS_PHASE_3` | **NOT APPROVED** |
| **DEC-08** | **Phase 4** | Email Cleanup & Prune | Removes `@emailjs/browser`; redirects forms to `apiClient.js`. | `APPROVE_PHASE_4_EMAIL_CONSOLIDATION` | **NOT APPROVED** |
| **DEC-09** | **Phase 4 Test** | Build & Form Test | Executes `npm run build` to verify clean unbundled asset compilation. | `APPROVE_TESTS_PHASE_4` | **NOT APPROVED** |
| **DEC-10** | **Release: Deploy** | Production Deployment | Deploys validated commit to Vercel production environment. | `APPROVE_PRODUCTION_DEPLOYMENT` | **NOT APPROVED** |
| **DEC-11** | **Release: Commit** | Git Commit | Stages and commits approved changes to local `main`. | `APPROVE_GIT_COMMIT` | **NOT APPROVED** |
| **DEC-12** | **Release: Push** | Git Push | Pushes committed changes to remote `origin/main`. | `APPROVE_GIT_PUSH` | **NOT APPROVED** |

---

## 8. PHASE-BY-PHASE APPROVAL GATES

### Execution Rules:
1. An approval token is valid ONLY when explicitly provided by the Business Owner in a subsequent chat turn.
2. If the owner approves Phase 1A, the agent must execute **ONLY Phase 1A**, stop immediately, present verifiable file diffs, and wait for Phase 1B approval.
3. No phase may proceed if the exit criteria of the preceding phase are not met.

### Detailed Phase Specifications & Exact Change Targets:

#### PHASE 0: Baseline & Preflight (Read-Only)
- **Files Expected to Change:** None (0 files).
- **Exit Criteria:** Git working tree reconciled, Supabase connectivity verified, preflight checksums recorded.

#### PHASE 1A: Source-Code Linkage Remediation
- **Exact Files to Change:**
  1. `api/_lib/supabaseClient.js`: Remove line 239 `!rawInquiryId.startsWith('AAF-INQ-2026-')` condition; persist candidate `inquiry_id`; catch FK error `23503` gracefully.
  2. `api/save-lead.js`: Propagate `sLead.record?.inquiry_id || sLead.inquiryId` directly into `quotationRecord.inquiryId` at lines 283 and 328.
- **Files That Must Not Change:** All other files in `api/`, `src/`, and database schemas.
- **Exit Criteria:** Static diff proves `safeInquiryId` retains `AAF-INQ-2026-` IDs.

#### PHASE 1B: Database Migration Execution
- **Exact File to Create:** `supabase/migrations/20261116_quotation_validity.sql`.
- **Target Schema:** `public.quotations`.
- **Exit Criteria:** Migration verified in Supabase SQL dashboard. Columns `validity_days`, `validity_basis`, and `timezone_reference` present.

#### PHASE 2: Quotation Validity & Date Handling
- **Exact Files to Change / Create:**
  1. `src/lib/dateUtils.js` (NEW): Canonical `parseToIsoDate()`, `addDaysToIsoDate()`, and `isQuotationExpired()`.
  2. `src/data/quotationCore.js`: Use `parseToIsoDate()` on input dates.
  3. `src/data/quotationModel.js`: Consolidate model validity on `validUntil`; map `commercialTerms.validityDate` as presentation getter.
  4. `src/pages/AdminQuotations.jsx`: Replace line 2163 text input with validity preset buttons and date picker; add Amber `EXPIRED` badge.
- **Exit Criteria:** Quotations with future dates evaluate as unexpired in IST; UI prevents entering invalid date strings.

#### PHASE 3: Secure Server-Side KPI Aggregation
- **Exact Files to Change:**
  1. `api/admin-quotations.js`: Add `action === 'kpi-summary'` handler calculating all 6 groups with zero PII and `N/A` semantics.
  2. `src/pages/PrivateDashboard.jsx`: Update `loadData()` to call `GET /api/admin-quotations?action=kpi-summary`.
- **Exit Criteria:** Endpoint returns HTTP 200 with aggregate JSON (< 4 KB) containing zero buyer PII; unauthenticated calls receive HTTP 401.

#### PHASE 4: Email Architecture Consolidation & Cleanup
- **Exact Files to Change / Create / Delete:**
  1. `src/lib/apiClient.js` (NEW): Native fetch wrappers for lead submission and registrations.
  2. `src/pages/Contact.jsx`: Point imports from `../lib/emailjs` to `../lib/apiClient`.
  3. `src/components/LeadMagnet.jsx`: Point imports to `../lib/apiClient`.
  4. `src/pages/B2BRegistration.jsx`: Point imports to `../lib/apiClient`.
  5. `src/lib/emailjs.js`: **DELETED**.
  6. `package.json`: Remove `"@emailjs/browser": "^4.4.1"`.
- **Exit Criteria:** `npm run build` completes with 0 errors; zero references to `emailjs` remain in `src/`.

---

## 9. DATABASE MIGRATION AND RECOVERY STRATEGY (PHASE 1B)

### 9.1 Exact Migration Definition
- **Filename:** `supabase/migrations/20261116_quotation_validity.sql`
- **SQL Execution Content:**
  ```sql
  -- AVANI AGRO FOODS — FORWARD-ONLY MIGRATION: QUOTATION VALIDITY
  ALTER TABLE public.quotations 
    ADD COLUMN IF NOT EXISTS validity_days INTEGER DEFAULT 14,
    ADD COLUMN IF NOT EXISTS validity_basis VARCHAR(100) DEFAULT 'STANDARD_PROFORMA',
    ADD COLUMN IF NOT EXISTS timezone_reference VARCHAR(50) DEFAULT 'Asia/Kolkata';

  COMMENT ON COLUMN public.quotations.validity_days IS 'Number of calendar days the offer remains firm from issue date';
  COMMENT ON COLUMN public.quotations.validity_basis IS 'Commercial pricing rationale (e.g., STANDARD_PROFORMA, SHORT_VALIDITY_FX)';
  COMMENT ON COLUMN public.quotations.timezone_reference IS 'Authoritative timezone for midnight expiry boundary (Asia/Kolkata)';
  ```

### 9.2 Safety & Impact Assessment:
- **Lock Duration:** `< 10 milliseconds` (metadata-only column additions with default values in PostgreSQL 11+).
- **Data Loss Risk:** **ZERO**. No tables or columns dropped.
- **Rollback Feasibility:** Fully reversible via `ALTER TABLE public.quotations DROP COLUMN IF EXISTS validity_days, DROP COLUMN IF EXISTS validity_basis, DROP COLUMN IF EXISTS timezone_reference;`. However, forward-recovery is preferred as the columns are fully nullable with defaults.
- **Pre-Migration Prerequisite:** Run read-only row count check (`SELECT COUNT(*) FROM public.quotations;`).

---

## 10. TEST AND VERIFICATION STRATEGY

Test execution is NOT authorized by this package. When authorized under separate tokens (`APPROVE_TESTS_PHASE_X`), the following test classifications apply:

| Test Identifier | Target Phase | Category | Description & Scope | Synthetic Data Policy |
| :--- | :---: | :---: | :--- | :--- |
| **TEST-P1-01** | Phase 1 | `LOCAL_TEST` | Unit test verifying `saveQuotationToSupabase` retains `AAF-INQ-2026-` IDs. | Mock PostgREST client; zero DB writes. |
| **TEST-P1-02** | Phase 1 | `LOCAL_TEST` | Unit test verifying unlinked quotations persist `inquiry_id = null`. | Mock PostgREST client. |
| **TEST-P2-01** | Phase 2 | `LOCAL_TEST` | Date parser unit test: `parseToIsoDate('12 Oct 2026') === '2026-10-12'`. | Pure function execution in Node.js. |
| **TEST-P2-02** | Phase 2 | `LOCAL_TEST` | Expiry boundary test: verifies `23:59:59 IST` evaluates correctly across UTC. | Mock system clock at boundary. |
| **TEST-P3-01** | Phase 3 | `LOCAL_TEST` | KPI math test: verifies $C_{QO} = \text{null}$ when decided quote count = 0. | Mock SQL aggregate dataset. |
| **TEST-P3-02** | Phase 3 | `LOCAL_TEST` | Zero-PII contract test: asserts response schema contains zero email/name keys. | Schema validation against JSON response. |
| **TEST-P4-01** | Phase 4 | `LOCAL_TEST` | Build verification: `npm run build` compiles Vite bundle without `@emailjs`. | Local build sandbox; zero deployment. |

---

## 11. SECURITY AND PRIVACY CONTROLS

1. **Authentication Boundary:** `api/admin-quotations.js` enforces `verifyAdminAuth(req)` backed by Upstash Redis KV. Any call without a valid `avani_gate_session` cookie returns HTTP 401.
2. **PII Elimination:** The KPI summary endpoint returns strictly aggregated numeric counts, percentages, and country codes. No buyer names, telephone numbers, emails, or individual transaction amounts are returned.
3. **Foreign-Key Defense:** Eliminating caller booleans prevents untrusted clients from injecting unvalidated relationship assertions. Referential integrity is strictly enforced by PostgreSQL constraint `23503`.

---

## 12. ROLLBACK AND RECOVERY PLAN

| Phase | Rollback Action | Estimated Recovery Time | Risk Level |
| :--- | :--- | :---: | :---: |
| **Phase 1A** | Git checkout `2f1a548` for `api/_lib/supabaseClient.js` and `api/save-lead.js`. | < 1 minute | **LOW** |
| **Phase 1B** | Execute SQL: `ALTER TABLE public.quotations DROP COLUMN IF EXISTS validity_days...`. | < 1 minute | **LOW** |
| **Phase 2** | Remove `src/lib/dateUtils.js`; revert `AdminQuotations.jsx`, `quotationCore.js`, `quotationModel.js`. | < 2 minutes | **LOW** |
| **Phase 3** | Revert `PrivateDashboard.jsx` and remove `action=kpi-summary` in `admin-quotations.js`. | < 2 minutes | **LOW** |
| **Phase 4** | Restore `src/lib/emailjs.js`; re-install `@emailjs/browser: "^4.4.1"`. | < 3 minutes | **LOW** |
| **Production** | Roll back Vercel deployment to previous deployment `dpl_95oVzbZiuaT7rVJcKhr9xekpXCqY`. | < 1 minute | **LOW** |

---

## 13. PRODUCTION DEPLOYMENT & RELEASE GATES

### 13.1 Production Deployment Gate (`APPROVE_PRODUCTION_DEPLOYMENT`)
Requires all of the following prior to execution:
1. Phases 1 through 4 completed and verified with zero defects.
2. `npm run build` completed cleanly with zero errors.
3. Explicit owner instruction containing `APPROVE_PRODUCTION_DEPLOYMENT`.
4. Verification that Vercel environment variables remain intact.

### 13.2 Git Commit & Push Gates (`APPROVE_GIT_COMMIT`, `APPROVE_GIT_PUSH`)
1. No commits may be made to `main` without `APPROVE_GIT_COMMIT`.
2. Staging must be explicit (`git add <exact-file>`). Blanket staging (`git add .`) is strictly prohibited.
3. Untracked audit documents will be committed under a descriptive commit message (`docs(audits): add Packages 3F.119 through 3F.125`).
4. Remote push requires `APPROVE_GIT_PUSH`. Force-pushing or rewriting history is strictly prohibited.

---

## 14. OUTREACH AND EXTERNAL SYSTEM RESTRICTIONS

The following restrictions remain in force continuously:
- **No external buyer emails may be sent.**
- **No supplier or processor contact may be initiated.**
- **No WhatsApp messages may be triggered.**
- `GLOBAL_OUTREACH_STOP=1`, `OUTREACH_AUTHORIZED=0`, `PILOT_AUTHORIZED=0` must remain active in all serverless environments.

---

## 15. RESIDUAL RISKS AND UNRESOLVED QUESTIONS

1. **Historical Quotation Reconciliation:** Existing historical quotations in `public.quotations` have `inquiry_id = null`. While forward-only operations are protected, reconciling historical quotations requires owner approval of the email-match backfill script.
2. **FX Contractual Clause:** Owner decision remains `REVIEW`. Commercial Option A (Firm 7–10 days validity) remains the operational recommendation until legal review is conducted.

---

## 16. FINAL READINESS CLASSIFICATION

### Classification: **`PLAN_READY_FOR_OWNER_REVIEW`**

This framework is complete, verified against actual codebase files, and provides an airtight, phase-gated execution path.

**IMPLEMENTATION IS NOT AUTHORIZED BY THIS REPORT.**

---

## 17. EXPLICIT OWNER DECISION FORM

To authorize execution of any stage, the Business Owner must copy the relevant token below and send it in a subsequent instruction:

```
================================================================================
                    AVANI AGRO FOODS — OWNER DECISION FORM
================================================================================

[ ] PHASE 1A: Source-Code Linkage Fix
    Token: APPROVE_PHASE_1A_SOURCE_CHANGES

[ ] PHASE 1B: Database Migration Execution
    Token: APPROVE_PHASE_1B_DATABASE_MIGRATION

[ ] PHASE 1 TESTS: Execute Unit Tests for Phase 1
    Token: APPROVE_TESTS_PHASE_1

[ ] PHASE 2: Quotation Validity & Date Normalization Engine
    Token: APPROVE_PHASE_2_QUOTATION_VALIDITY

[ ] PHASE 2 TESTS: Execute Date & Expiry Boundary Tests
    Token: APPROVE_TESTS_PHASE_2

[ ] PHASE 3: Secure Server-Side KPI Aggregation Engine
    Token: APPROVE_PHASE_3_KPI_AGGREGATION

[ ] PHASE 3 TESTS: Execute KPI Analytics & Security Tests
    Token: APPROVE_TESTS_PHASE_3

[ ] PHASE 4: Client Email Clean-Up & Deprecate @emailjs/browser
    Token: APPROVE_PHASE_4_EMAIL_CONSOLIDATION

[ ] PHASE 4 TESTS: Execute Production Build Verification
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
*Certified by Senior Independent Software Implementation Governance Auditor & Application Security Specialist.*
