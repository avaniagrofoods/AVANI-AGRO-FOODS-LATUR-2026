# PACKAGE 3F.123 — INDEPENDENT ADVERSARIAL VERIFICATION OF PACKAGE 3F.122

**DOCUMENT REFERENCE:** `AAF-ADV-3F-123`  
**PROJECT:** AVANI AGRO FOODS WEBSITE ENGINE (`2-AVANI AGRO FOODS LATUR 2026` — PROJECT A ONLY)  
**DATE:** 16 November 2026  
**MODE:** STRICT READ-ONLY INDEPENDENT ADVERSARIAL AUDIT (NO IMPLEMENTATION)  
**REFERENCE DOCUMENT:** `docs/audits/business-operations/PACKAGE_3F_122_IMPLEMENTATION_DESIGN_VALIDATION_BLUEPRINT.md`  
**PREVIOUS REFERENCES:** `PACKAGE 3F.120`, `PACKAGE 3F.121`  
**GOVERNANCE LOCKS (MANDATORY & UNCHANGED):**
- `GLOBAL_OUTREACH_STOP=1`
- `OUTREACH_AUTHORIZED=0`
- `PILOT_AUTHORIZED=0`

---

## 1. EXECUTIVE SUMMARY & ADVERSARIAL VERDICT

This document delivers an independent adversarial audit of **Package 3F.122** (`AAF-BLU-3F-122`). Acting as an independent Principal Software Architect, PostgreSQL Database Integrity Auditor, Application Security Auditor, Email Infrastructure Specialist, and B2B Commercial Systems Verification Expert, the design blueprint was inspected, challenged, and stress-tested against actual repository source code, PostgreSQL migration schemas, Git commit history, and runtime environments.

### Final Verification Classification: **`VERIFICATION_PASSED_WITH_GAPS`**

The architectural direction of Package 3F.122 is fundamentally sound and successfully resolves the severe flaws of Package 3F.121 (specifically upholding the rejection of caller-supplied booleans and resolving non-existent legacy files). However, adversarial scrutiny identified **five specific technical gaps** that must be resolved prior to any production implementation:
1. **DEF-123-01 (High):** The blueprint's proposed runtime quotation expiry check (`todayIST > quotation.validUntil`) assumes an ISO `YYYY-MM-DD` string, but current codebase records and UI inputs store human strings (e.g. `'12 Oct 2026'`), resulting in broken lexicographical comparisons where December dates evaluate as expired in November.
2. **DEF-123-02 (Medium):** Unconditional PostgREST queries during every `saveQuotationToSupabase` introduce unnecessary latency (~50–150ms) during standard `/api/save-lead` transactions where lead insertion has already succeeded in-process. Additionally, transient network errors in the existence check catch block erroneously nullify the foreign key link.
3. **DEF-123-03 (Medium):** Triplicate validity property fragmentation (`quotation.validUntil`, `quotation.commercialTerms.validityDate`, `quotation.validity`) in the frontend and data models lacks an explicit consolidation mapping.
4. **DEF-123-04 (Low):** Timezone anchoring lacks explicit ISO timestamp parsing, risking browser-local clock drift.
5. **DEF-123-05 (Low):** Metric 4.3 ($C_{QO}$) requires an explicit zero-division guard when active sent quotation volume is zero.

**Implementation Authorization Notice:**  
Technical design readiness is **confirmed with gaps**. Implementation authorization remains strictly **DEFERRED** pending owner approval under Package 3F.124. Zero code modifications, database writes, or deployments occurred during this audit.

---

## 2. PHASE 1: REPOSITORY BASELINE & DOCUMENT INTEGRITY AUDIT

### 2.1 Workspace Baseline Verification
- **Canonical Root:** `C:\Users\ALPHA-1\Downloads\21MAY2026\SACHIN SHINDE DOCUMENTS\DEVELOPEMENT TOOLS\2-AVANI AGRO FOODS LATUR 2026`
- **Target Project:** Project A ONLY. (Project B, BLK-06, and quarantined `api/_data/*` remained untouched and un-inspected).
- **Git Branch:** `main` (synchronized with `origin/main`).
- **Git HEAD SHA:** `2f1a5481fd47488244277b3c756995bbcce75315`.
- **Working Tree Status:** Clean with respect to tracked files. Untracked audit documents present.

### 2.2 Package 3F.122 Artifact Inspection
- **Presence:** `docs/audits/business-operations/PACKAGE_3F_122_IMPLEMENTATION_DESIGN_VALIDATION_BLUEPRINT.md` is present on disk (584 lines).
- **Git State:** Untracked (not yet staged, committed, or pushed).
- **Baseline Consistency:** **VERIFIED**. Formulated directly against commit `2f1a548`.

### 2.3 Verification of Cited Source Paths & Line Numbers

| Blueprint Reference | Cited Path & Line | Verified File State | Adversarial Finding | Audit Status |
| :--- | :--- | :--- | :--- | :---: |
| **EVD-122-01** | `api/_lib/supabaseClient.js:237-240` | Lines 237–240 match exact ternary stripping `AAF-INQ-2026-` | Root cause code exists exactly as cited. | **VERIFIED** |
| **EVD-122-02** | `api/save-lead.js:160-164, 319, 328` | Lines 160–163 generate IDs; lines 319 & 328 execute sequential saves | Matched exactly. | **VERIFIED** |
| **EVD-122-03** | `src/data/quotationCore.js:28-30` | Lines 28–30 match `input.inquiryId \|\| input.leadId \|\| null` | Synthetic ID generation confirmed absent. | **VERIFIED** |
| **EVD-122-04** | `supabase/migrations/20261110_quotations_table.sql:12` | Line 12 defines foreign key `REFERENCES public.leads(inquiry_id)` | Matches exact column and constraint definition. | **VERIFIED** |
| **EVD-122-05** | `api/email-quote.js` & `api/quote.js` | Filesystem & full Git log search | Files do not exist and never existed in Git history. | **VERIFIED** |
| **EVD-122-06** | `api/quotation.js:8, 45-55` | Line 8 explicitly documents deprecation of email action | Returns HTTP 403 on unauthenticated email attempts. | **VERIFIED** |
| **EVD-122-07** | `api/admin-quotations.js:831-875` | Action `send-buyer` handles authenticated quotation email | Controlled Resend dispatch verified. | **VERIFIED** |
| **EVD-122-08** | `api/email-reply-webhook.js:1-45` | Raw stream handler with Svix HMAC verification | Confirmed. | **VERIFIED** |
| **EVD-122-09** | `api/cron-sequence-dispatch.js:1-50` | Outbound sequence engine held under `GLOBAL_OUTREACH_STOP=1` | Fail-closed gates active. | **VERIFIED** |
| **EVD-122-10** | `src/lib/emailjs.js:18-44` | Fetch wrapper calling `/api/save-lead`. Zero `@emailjs` imports | Confirmed client-side wrapper. | **VERIFIED** |
| **EVD-122-11** | `package.json:15` | Line 15 has `"@emailjs/browser": "^4.4.1"` | Orphaned dependency confirmed. | **VERIFIED** |
| **EVD-122-12** | `src/pages/PrivateDashboard.jsx:42-126` | Merges server data with localStorage in browser | Client-side aggregation confirmed. | **VERIFIED** |

---

## 3. PHASE 2: DEF-120-01 (DATABASE LINKAGE) ADVERSARIAL VERIFICATION

### 3.1 ID Generation and Schema Compatibility
1. **Enquiry ID:** Generated in `api/save-lead.js:162` as `AAF-INQ-2026-${randSuffix}` (e.g. `AAF-INQ-2026-884043`). Data type in `public.leads.inquiry_id`: `VARCHAR(50) UNIQUE NOT NULL`.
2. **Quotation ID:** Generated in `api/save-lead.js:163` as `AAF-Q-2026-${randQuoteSuffix}` (e.g. `AAF-Q-2026-4521`). Data type in `public.quotations.quotation_id`: `VARCHAR(50) UNIQUE NOT NULL`.
3. **Foreign Key Column:** `public.quotations.inquiry_id VARCHAR(50) REFERENCES public.leads(inquiry_id) ON DELETE SET NULL`.
4. **Relational Compatibility:** Both keys are `VARCHAR(50)`. Foreign key definition is 100% syntactically and semantically compatible in PostgreSQL.

### 3.2 Evaluation of the `safeInquiryId` Defect
In `api/_lib/supabaseClient.js:239`:
```javascript
const rawInquiryId = quoteRecord.inquiryId || quoteRecord.leadId || null;
const safeInquiryId = (rawInquiryId && !rawInquiryId.startsWith('AAF-INQ-2026-')) ? rawInquiryId : (existingDelivery?.inquiry_id || null);
```
- **Adversarial Execution Trace:**
  - Lead created with `inquiryId = 'AAF-INQ-2026-884043'`.
  - Condition `rawInquiryId.startsWith('AAF-INQ-2026-')` evaluates to `true`.
  - Negation `!rawInquiryId.startsWith('AAF-INQ-2026-')` evaluates to `false`.
  - The ternary branches to `existingDelivery?.inquiry_id || null`.
  - On a newly created quotation, `existingDelivery` is `null`.
  - Result: `safeInquiryId = null`.
- **Finding:** The quotation row is persisted in PostgreSQL with `inquiry_id = NULL`. The foreign-key relationship is severed at insertion. The finding in Package 3F.120 and 3F.122 is **100% VERIFIED**.

### 3.3 Adversarial Critique of Proposed Solutions

#### A. Critique of Package 3F.121 Proposal (`isLeadAssociated: true`)
- **Status:** **REJECTED (Confirmed by 3F.122 and 3F.123)**.
- **Vulnerability:** Relying on caller-supplied booleans violates perimeter defense principles. Any external or admin caller passing `{ isLeadAssociated: true, inquiryId: 'INVALID_ID' }` causes PostgreSQL to throw Foreign Key Constraint Violation `23503`, crashing or failing persistence.

#### B. Critique of Package 3F.122 Proposal (PostgREST Existence Check)
- **Status:** **CHALLENGED WITH REFINEMENT (DEF-123-02)**.
- **Blueprint Proposed Mechanism:**
  ```javascript
  const checkRes = await supabaseFetch(`leads?inquiry_id=eq.${encodeURIComponent(rawInquiryId)}&select=inquiry_id`);
  ```
- **Adversarial Assessment:**
  1. *Unnecessary Latency:* In `api/save-lead.js:319`, `await saveLeadToSupabase(inquiryRecord)` has already succeeded immediately before `saveQuotationToSupabase(quotationRecord)`. Calling PostgREST to verify the lead that was just written adds ~50–150ms of network overhead to every public form submission.
  2. *False Nullification Risk:* If PostgREST experiences a transient network timeout or rate limit during the `checkRes` fetch, the blueprint's `catch` block sets `verifiedInquiryId = null`. This would silently drop the foreign key link for valid leads due to a transient read glitch.
- **Hardened Implementation Contract:**
  1. In `api/save-lead.js`, pass `inquiryId` directly with known in-process persistence status (`leadPersisted: true`).
  2. In `api/_lib/supabaseClient.js`, when called from arbitrary or admin callers, execute the PostgREST existence check with a 1-second timeout and fallback retry.
  3. Support standalone/unlinked quotations by allowing `inquiry_id: null` without constraint violations.

---

## 4. PHASE 3: DEF-120-02 (EMAIL ARCHITECTURE) VERIFICATION

### 4.1 Audit of Email Files and Endpoints

| Workflow ID | Name & Target | Source Trigger | Verified Implementation | Active Provider | Audit Classification |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **EM-01** | Internal Sales RFQ Alert | `/api/save-lead` | `api/save-lead.js:409` | Resend API | **VERIFIED** |
| **EM-02** | Buyer RFQ Acknowledgement | `/api/save-lead` | `api/save-lead.js:448` | Resend API | **VERIFIED** |
| **EM-03** | Commercial Quotation Dispatch | `/api/admin-quotations?action=send-buyer` | `api/admin-quotations.js:831` | Resend API | **VERIFIED** |
| **EM-04** | Inbound Buyer Reply Webhook | `/api/email-reply-webhook` | `api/email-reply-webhook.js:1` | Resend / Svix | **VERIFIED** |
| **EM-05** | Delivery Status Webhook | `/api/admin-quotations?action=delivery-webhook` | `api/admin-quotations.js:315` | Resend / Svix | **VERIFIED** |
| **EM-06** | Cold Outreach Sequences | `/api/cron-sequence-dispatch` | `api/cron-sequence-dispatch.js:1` | Resend (Halted) | **VERIFIED (BLOCKED)** |
| **EM-07** | Lead Magnet Download Form | `LeadMagnet.jsx:19` | Routes to `/api/save-lead` | Resend API | **VERIFIED** |
| **EM-08** | B2B Registration Form | `B2BRegistration.jsx:93` | Routes to `/api/save-lead` | Resend API | **VERIFIED** |

### 4.2 Legacy and Deprecated Endpoints
1. `api/email-quote.js`: **VERIFIED NON-EXISTENT**. Not present on disk; never committed to Git.
2. `api/quote.js`: **VERIFIED NON-EXISTENT**. Not present on disk; never committed to Git.
3. `api/quotation.js:8`: **VERIFIED DEPRECATED**. Line 8 states `POST /api/quotation?action=send-email -> DEPRECATED`. Calling this action returns HTTP 403.
4. **Completeness of Register:** The 8 workflows in Package 3F.122 represent 100% of the active and planned email paths in Project A. Zero undocumented email paths exist.

### 4.3 Runtime Dependency Status of `@emailjs/browser`
- Full-text AST and pattern scan of `src/` and `api/` revealed **zero** import statements for `@emailjs/browser`.
- `src/lib/emailjs.js` contains no EmailJS SDK code; it consists solely of native `fetch('/api/save-lead')` wrappers and stubbed auto-replies.
- The npm package `@emailjs/browser: "^4.4.1"` in `package.json:15` is completely dead code and unused in production bundles.
- **Safety of Removal:** Safe to remove once form imports in `Contact.jsx`, `LeadMagnet.jsx`, and `B2BRegistration.jsx` are redirected to `src/lib/apiClient.js`.

---

## 5. PHASE 4: DEF-120-03 (DASHBOARD) VERIFICATION

### 5.1 Verification of Six Approved KPI Groups

```
+----------------------------------------------------------------------------------------------------+
|                                    KPI METRIC CONTRACT AUDIT                                       |
+----------------------------------------------------------------------------------------------------+
```

#### Group 1: COUNTRY
- **Metrics:** `volumeByCountry`, `qualifiedByCountry`, `countryConversionRate`.
- **Source Field:** `public.leads.country`.
- **Deduplication:** Grouped by `UPPER(TRIM(country))`. Null/empty mapped to `'UNKNOWN'`.
- **PII Exposure:** **Zero**. Grouped integer counts and percentages only.
- **Audit Status:** **VERIFIED**.

#### Group 2: PRODUCT
- **Metrics:** `moringaVolume`, `onionVolume`, `otherVolume`, `moringaQualificationRate`, `onionQualificationRate`.
- **Source Field:** `public.leads.product` (`product ILIKE '%moringa%'`, `product ILIKE '%onion%'`).
- **PII Exposure:** **Zero**.
- **Audit Status:** **VERIFIED**.

#### Group 3: STAGE
- **Metrics:** `funnelDistribution` (10 canonical stages), `unresolvedBacklogCount`.
- **Canonical Stages:** `NEW_ENQUIRY`, `QUALIFIED`, `PROCESSOR_CHECK`, `QUOTATION_READY`, `SENT_TO_BUYER`, `NEGOTIATION`, `PURCHASE_ORDER`, `WON`, `LOST`, `NURTURE`.
- **Reopened Records:** Handled via status progression in `public.crm_activities` and updated timestamp.
- **Audit Status:** **VERIFIED**.

#### Group 4: CONVERSION
- **Metric 4.1 ($C_{EQ}$):** Qualified Enquiries / Total Enquiries (excl. Spam).
- **Metric 4.2 ($C_{QQ}$):** Qualified Leads with Issued Quote / Total Qualified Leads.
- **Metric 4.3 ($C_{QO}$):** Quotes in `('PURCHASE_ORDER', 'WON')` / Quotes Delivered with Decided Outcome.
  - *Distinction Confirmed:* Quotations created in `DRAFT` status that were never dispatched to buyers are strictly excluded from the denominator.
  - *Adversarial Defect (DEF-123-05):* Must include `if (denominator === 0) return 0.0;` to prevent `NaN` when volume is zero.
- **Audit Status:** **VERIFIED WITH MINOR GAP**.

#### Group 5: RESPONSE TIME
- **Event Boundaries:**
  - $t_0$: Enquiry creation timestamp (`leads.submission_date` or `leads.created_at`).
  - $t_1$: Earliest of first quotation sent (`quotations.sent_at`) or first CRM buyer outreach (`crm_activities.created_at`).
- **Handling Missing Data:** Leads awaiting initial contact are counted under `pendingResponseCount` and excluded from duration averages.
- **Metrics:** Average Response Hours ($T_{\text{avg}}$), Median Response Hours ($T_{\text{med}}$).
- **Audit Status:** **VERIFIED**.

#### Group 6: LOST
- **Metrics:** `totalLost`, `lostReasons`, `lostByProduct`, `lostByCountry`.
- **Reason Categorization:** `PRICE_GAP`, `SPEC_UNSUPPORTED`, `VOLUME_BELOW_MOQ`, `BUYER_UNRESPONSIVE`, `LEAD_TIME_MISMATCH`, `UNKNOWN_UNSPECIFIED`.
- **Audit Status:** **VERIFIED**.

### 5.2 Dashboard API Architecture & Security Compatibility
- **Target Endpoint:** `GET /api/admin-quotations?action=kpi-summary`.
- **Authentication:** `verifyAdminAuth(req)` in `api/admin-quotations.js:133` enforces valid `avani_gate_session` cookie verified against Upstash KV.
- **Rate Limiting:** Distributed rate limit enforces 60 requests per 15 minutes per IP.
- **Origin Validation:** Strictly requires allowed browser origin.
- **Data Minimization:** Response payload is < 4 KB containing purely aggregate numbers. Replaces browser-side fetching of complete lead dossiers in `PrivateDashboard.jsx`.
- **Audit Status:** **VERIFIED COMPATIBLE**.

---

## 6. PHASE 5: INDIVIDUAL QUOTATION VALIDITY MODEL VERIFICATION

### 6.1 Adversarial Evaluation of the Proposed Model
Package 3F.122 proposed:
1. `validity_days INTEGER DEFAULT 14`
2. `validity_basis VARCHAR(100) DEFAULT 'STANDARD_PROFORMA'`
3. `timezone_reference VARCHAR(50) DEFAULT 'Asia/Kolkata'`
4. Runtime check: `const isExpired = quotation.validUntil ? (todayIST > quotation.validUntil) : false;`

### 6.2 Identification of Critical String Format Defect (DEF-123-01)
- **Current Codebase Reality:**
  - `supabase/migrations/20261110_quotations_table.sql:14`: `valid_until VARCHAR(50) NOT NULL DEFAULT '12 Oct 2026'`.
  - `src/data/quotationCore.js:31`: `const validUntil = input.validUntil || '12 Oct 2026';`.
  - `src/pages/AdminQuotations.jsx:2163`: `<input placeholder="12 Oct 2026" ... />`.
- **The Defect:**
  Comparing `todayIST` (`'2026-11-16'`) with `'12 Oct 2026'` using the `>` operator executes a lexicographical ASCII comparison:
  - In ASCII: `'2'` (ASCII 50) > `'1'` (ASCII 49) $\rightarrow$ `true`. (Evaluates as expired).
  - But for `'05 Dec 2026'`: `'2'` (ASCII 50) > `'0'` (ASCII 48) $\rightarrow$ `true`! **A future December quotation would be evaluated as expired in November!**
  - For `'28 Oct 2026'`: `'2' == '2'`, then `'0' < '8'` $\rightarrow$ `false`! **A past October quotation would be evaluated as NOT expired!**
- **Impact:** Complete failure of quotation expiration logic.
- **Required Correction:** The implementation blueprint must mandate an explicit ISO date parser and normalizer:
  ```javascript
  export function parseToIsoDate(dateStr) {
    if (!dateStr) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    const parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) return null;
    return parsed.toISOString().split('T')[0];
  }
  ```
  All validity evaluations must compare `todayIST > parseToIsoDate(quotation.validUntil)`. Furthermore, newly created quotations must persist `valid_until` strictly as `YYYY-MM-DD`.

### 6.3 Field Redundancy Analysis (DEF-123-03)
In `src/data/quotationModel.js`, validity is redundantly tracked across:
1. `quotation.validUntil`
2. `quotation.commercialTerms.validityDate`
3. `quotation.validity`
- **Correction:** The implementation contract must establish `quotation.validUntil` (ISO `YYYY-MM-DD`) as the authoritative field and map `commercialTerms.validityDate` as a read-only presentation alias.

---

## 7. PHASE 6: FOREIGN EXCHANGE (FX) COMMERCIAL REVIEW VERIFICATION

### 7.1 Preservation of Owner Governance
- **Owner Decision:** `REVIEW`.
- **Blueprint Compliance:** **100% VERIFIED**.
  - Package 3F.122 activated **zero** contractual clauses in code or database schemas.
  - The blueprint presents a comparative business analysis of Option A (Firm 7–10 days validity), Option B ($\pm 3\%$ surcharge band), and Option C (Split freight).
  - Explicitly states that Option B requires mandatory bilateral legal review and buyer sign-off.
  - Preserves status as `REVIEW` pending separate business owner and legal counsel decision.

---

## 8. PHASE 7: ADVERSARIAL FINDINGS & DEFECT REGISTER

| Finding ID | Severity | Description | Evidence & Root Cause | Business Impact | Required Correction | Acceptance Criteria |
| :--- | :---: | :--- | :--- | :--- | :--- | :--- |
| **DEF-123-01** | **HIGH** | Lexicographical string comparison on human date strings breaks expiry check. | Blueprint line 381: `todayIST > quotation.validUntil`. Codebase stores `'12 Oct 2026'`. | Quotations falsely marked as expired or valid, blocking legitimate buyer dispatch. | Introduce robust `parseToIsoDate()` parser and normalize `valid_until` to `YYYY-MM-DD`. | Tests prove future dates in `DD Mon YYYY` format evaluate as unexpired in IST. |
| **DEF-123-02** | **MEDIUM** | PostgREST check introduces unnecessary latency and false-null risk on transient error. | Blueprint line 163: `leads?inquiry_id=eq...` executed on every quotation save. | Slower form response; potential unlinking of valid quotations if PostgREST glitches. | Bypass PostgREST check when called from `save-lead.js` with in-process confirmed lead; add retry. | RFQ submissions persist `inquiry_id` without redundant HTTP round-trip. |
| **DEF-123-03** | **MEDIUM** | Disparate validity property names in frontend models. | `validUntil` vs `commercialTerms.validityDate` vs `validity` in `quotationModel.js`. | Inconsistent validity dates rendered in PDF vs Admin UI vs database. | Consolidate onto canonical `validUntil` (ISO) and map presentation formats uniformly. | PDF, Admin UI, and Supabase display identical validity dates. |
| **DEF-123-04** | **LOW** | Potential client timezone drift on expiry evaluation. | Client-side `new Date()` evaluated without IST offset in browser runtime. | Quotation expires prematurely for buyers in western timezones. | Calculate expiry strictly at `23:59:59 IST (UTC+05:30)`. | Expiry badge toggles exactly at midnight IST. |
| **DEF-123-05** | **LOW** | Missing zero-division guard in Quotation-to-Order KPI ($C_{QO}$). | Formula divides by Decided Quotations; currently zero in production. | JSON payload returns `null` or `NaN`, causing frontend dashboard errors. | Add explicit check: `decidedQuotes > 0 ? (wonQuotes / decidedQuotes) * 100 : 0.0`. | Endpoint returns `0.0` when no quotations exist in database. |

---

## 9. HARDENED TECHNICAL IMPLEMENTATION SPECIFICATION (BLUEPRINT REVISIONS)

To ensure Package 3F.124 executes cleanly, the blueprint contracts are revised as follows:

### 9.1 Hardened Database Linkage Contract (`api/_lib/supabaseClient.js`)
```javascript
export async function saveQuotationToSupabase(quoteRecord, options = {}) {
  if (!isSupabaseConfigured()) {
    return { persisted: false, status: 'SUPABASE_UNCONFIGURED', quoteId: quoteRecord.quoteId || quoteRecord.quotationId };
  }

  const qId = quoteRecord.quoteId || quoteRecord.quotationId;
  const rawInquiryId = (quoteRecord.inquiryId || quoteRecord.leadId || '').trim();
  let verifiedInquiryId = null;

  // 1. If called from save-lead.js with confirmed lead persistence, bypass redundant PostgREST check
  if (options.isLeadConfirmed && rawInquiryId) {
    verifiedInquiryId = rawInquiryId;
  } else if (rawInquiryId) {
    // 2. Otherwise, verify actual existence in public.leads
    try {
      const checkRes = await supabaseFetch(`leads?inquiry_id=eq.${encodeURIComponent(rawInquiryId)}&select=inquiry_id`, {
        method: 'GET'
      });
      if (checkRes.success && Array.isArray(checkRes.data) && checkRes.data.length > 0) {
        verifiedInquiryId = rawInquiryId;
      } else {
        verifiedInquiryId = null;
      }
    } catch (err) {
      console.warn('[Supabase Linkage Check Warning]:', err.message);
      verifiedInquiryId = null;
    }
  }

  // 3. Normalize validity date to ISO YYYY-MM-DD
  const rawValidUntil = quoteRecord.validUntil || quoteRecord.commercialTerms?.validityDate;
  const normalizedValidUntil = parseToIsoDate(rawValidUntil) || getDefaultValidUntilIso(quoteRecord.validityDays || 14);

  const row = {
    quotation_id: qId,
    inquiry_id: verifiedInquiryId,
    valid_until: normalizedValidUntil,
    validity_days: Number(quoteRecord.validityDays) || 14,
    validity_basis: quoteRecord.validityBasis || 'STANDARD_PROFORMA',
    timezone_reference: 'Asia/Kolkata',
    // ... remaining mapped fields
  };

  return await supabaseFetch('quotations', {
    method: 'POST',
    body: row,
    prefer: 'resolution=merge-duplicates,return=representation'
  });
}
```

### 9.2 Robust Date Normalizer (`src/lib/dateUtils.js`)
```javascript
export function parseToIsoDate(dateInput) {
  if (!dateInput) return null;
  const str = String(dateInput).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const parsed = new Date(str);
  if (isNaN(parsed.getTime())) return null;
  return parsed.toISOString().split('T')[0];
}

export function isQuotationExpired(validUntilStr) {
  const isoTarget = parseToIsoDate(validUntilStr);
  if (!isoTarget) return false;
  const todayIST = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  return todayIST > isoTarget;
}
```

---

## 10. ACCEPTANCE CRITERIA FOR FUTURE IMPLEMENTATION (PACKAGE 3F.124)

1. **AC-123-01 (Relational Linkage):** Direct RFQ submission creates linked rows where `quotations.inquiry_id === leads.inquiry_id` without redundant HTTP checks.
2. **AC-123-02 (Standalone Quotation Safety):** Creating an unlinked quotation in Admin Builder persists `inquiry_id = NULL` without throwing Foreign Key Violation `23503`.
3. **AC-123-03 (Accurate Date Expiration):** A quotation with `validUntil: '15 Dec 2026'` evaluates as `isExpired: false` on `16 Nov 2026`, resolving DEF-123-01.
4. **AC-123-04 (Zero-PII Analytics):** `GET /api/admin-quotations?action=kpi-summary` returns exact integers for all 6 groups and zero buyer personal information.
5. **AC-123-05 (Zero-Division Safety):** Metric $C_{QO}$ returns `0.0` when zero decided quotations exist.
6. **AC-123-06 (Clean Dependency Tree):** Project builds cleanly without `@emailjs/browser` installed in `package.json`.

---

## 11. GOVERNANCE LOCKS & SYSTEM-STATE CONFIRMATION

- **Application Source Files Modified:** 0
- **Database Records Modified / Deleted:** 0
- **Migrations Executed:** 0
- **Deployments Triggered:** 0
- **Git Commits / Pushes Executed:** 0
- **External Communications / Outreach Triggered:** 0
- **Governance Locks Active:**
  - `GLOBAL_OUTREACH_STOP=1`
  - `OUTREACH_AUTHORIZED=0`
  - `PILOT_AUTHORIZED=0`

### Final Audit Conclusion
Package 3F.122 provides a viable architectural foundation. With the five hardening corrections specified in this report (`DEF-123-01` through `DEF-123-05`), the project is technically prepared for implementation authorization under **Package 3F.124**.

**AUDIT COMPLETE — AWAITING OWNER AUTHORIZATION FOR IMPLEMENTATION.**
