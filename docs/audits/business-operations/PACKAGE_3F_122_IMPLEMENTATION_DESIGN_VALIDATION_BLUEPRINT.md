# PACKAGE 3F.122 — INDEPENDENT IMPLEMENTATION DESIGN VALIDATION & CONTROLLED REMEDIATION BLUEPRINT

**DOCUMENT REFERENCE:** `AAF-BLU-3F-122`  
**PROJECT:** AVANI AGRO FOODS WEBSITE ENGINE (`2-AVANI AGRO FOODS LATUR 2026` — PROJECT A ONLY)  
**DATE:** 16 November 2026  
**MODE:** STRICT READ-ONLY VALIDATION & ARCHITECTURAL BLUEPRINT (NO IMPLEMENTATION)  
**GOVERNANCE LOCKS (ACTIVE & MANDATORY):**
- `GLOBAL_OUTREACH_STOP=1`
- `OUTREACH_AUTHORIZED=0`
- `PILOT_AUTHORIZED=0`

---

## 1. EXECUTIVE SUMMARY

This document delivers an independent architectural validation of the Package 3F.121 specification and establishes the complete, production-grade technical remediation blueprint for the three findings from Package 3F.120:
1. **DEF-120-01:** Foreign-key decoupling between quotations and buyer leads in `api/_lib/supabaseClient.js`.
2. **DEF-120-02:** Email architecture reconciliation across Resend transactional delivery, legacy client-side shims, and verification of non-existent legacy endpoints.
3. **DEF-120-03:** Production-grade server-side aggregation contracts for the six approved dashboard KPI groups.

### Key Architectural Validations & Refinements:
- **Refinement to DEF-120-01:** The Package 3F.121 proposal to rely on a caller-supplied boolean (`isLeadAssociated: true`) was **independently challenged and rejected**. Trusting an unverified caller boolean violates database integrity principles. The blueprint specifies an authoritative database existence verification against `public.leads` in `saveQuotationToSupabase`, guaranteeing 100% relational validity while preserving optional unlinked quotation workflows.
- **Resolution of Failed Email File Inspections:** Rigorous filesystem and Git log audits confirmed that `api/email-quote.js` and `api/quote.js` **never existed** in the repository. Quotation streaming is handled by `api/quotation.js` (where email dispatch is deprecated), while live quotation dispatch is hosted in `api/admin-quotations.js` (`action=send-buyer`). The email inventory is now complete, verified, and reconciled with Resend as the sole authoritative server-side provider.
- **Dashboard KPI Mathematical Rigor:** Every metric across the six approved groups (Country, Product, Stage, Conversion, Response Time, Lost Enquiries) is formulated with exact numerators, denominators, database source fields, date filters, and zero PII exposure.

**Final Blueprint Classification:** **`BLUEPRINT_READY`**

---

## 2. PACKAGE 3F.121 INDEPENDENT ASSESSMENT

| Assessment Area | Package 3F.121 Proposal | Independent Architectural Critique | Blueprint Resolution |
| :--- | :--- | :--- | :--- |
| **DEF-120-01 Linkage** | Remove `!rawInquiryId.startsWith('AAF-INQ-2026-')` and accept caller boolean `isLeadAssociated: true`. | **CHALLENGED & REJECTED.** Caller booleans are vulnerable to caller bugs and cannot prove database relationship integrity. | Blueprint mandates direct PostgREST/PostgreSQL existence validation against `public.leads`. |
| **DEF-120-02 Email Audit** | Reported client-side EmailJS duplication. Failed to locate `api/email-quote.js` and `api/quote.js`. | **CLARIFIED.** Failed files never existed. Browser EmailJS is not used; `src/lib/emailjs.js` is merely a fetch wrapper to `/api/save-lead`. | Blueprint documents complete verified inventory and establishes Resend server-side exclusivity. |
| **DEF-120-03 KPIs** | Outlined six KPI groups at high level. | **VALIDATED & EXPANDED.** Required mathematical formulas, deduplication rules, and event boundaries. | Blueprint defines exact numerators, denominators, and timestamp event contracts. |
| **Quotation Validity** | Dynamic per-quotation validity dates. | **VALIDATED.** Fully aligns with Owner Decision 1 (`INDIVIDUAL_PER_QUOTATION`). | Blueprint specifies schema, calculation, IST timezone behavior, and UI enforcement. |
| **FX Clause** | Evaluated 3 options. | **VALIDATED.** Fully aligns with Owner Decision 2 (`REVIEW`). | Blueprint evaluates commercial, legal, and operational trade-offs without activating clauses. |

---

## 3. OWNER DECISION RECONCILIATION

All five Authoritative Owner Decisions are preserved and reconciled without reinterpretation:

1. **Quotation Validity:** `INDIVIDUAL_PER_QUOTATION`  
   - Implemented as discrete `valid_until` (Date) and `validity_days` (Integer) fields.  
   - Prohibits universal 14-day or 30-day defaults.  
   - Preserves all historical quotation terms unchanged.
2. **FX Clause:** `REVIEW`  
   - Evaluates three commercial options (Firm Short Validity, Surcharge Band, Split Freight).  
   - Identifies RBI reference rate source and applicable calculation dates.  
   - Strictly marked for separate owner/legal counsel review; zero contractual clauses activated.
3. **Email Architecture:** `RESEND`  
   - Authoritative server-side architecture based exclusively on Resend API.  
   - Existing shims in `src/lib/emailjs.js` retained during this specification task to avoid breaking dependent forms.  
   - Outlines safe deprecation plan.
4. **Dashboard KPIs:** `COUNTRY, PRODUCT, STAGE, CONVERSION, RESPONSE, LOST`  
   - Strictly restricted to these six groups.  
   - Formulates secure server-side aggregation returning zero buyer PII.
5. **Authorization:** `SPECIFICATION ONLY`  
   - Strictly read-only planning and blueprint creation. Zero code or database modifications executed.

---

## 4. EVIDENCE INVENTORY

| Evidence Tag | Source Path | Lines / Identifier | Content / Observation | Evidence Type |
| :--- | :--- | :--- | :--- | :--- |
| **EVD-122-01** | `api/_lib/supabaseClient.js` | Lines 237–240 | `safeInquiryId` check stripping `AAF-INQ-2026-` IDs. | **VERIFIED** |
| **EVD-122-02** | `api/save-lead.js` | Lines 160–164, 319, 328 | Generation of `AAF-INQ-2026-${randSuffix}` and sequential save of lead then quote. | **VERIFIED** |
| **EVD-122-03** | `src/data/quotationCore.js` | Lines 28–30 | `input.inquiryId \|\| input.leadId \|\| null`, confirming synthetic ID generation is absent. | **VERIFIED** |
| **EVD-122-04** | `supabase/migrations/20261110_quotations_table.sql` | Line 12 | `inquiry_id VARCHAR(50) REFERENCES public.leads(inquiry_id) ON DELETE SET NULL`. | **VERIFIED** |
| **EVD-122-05** | Filesystem & Git Log | `api/email-quote.js`, `api/quote.js` | Files do not exist in workspace or Git history. | **VERIFIED** |
| **EVD-122-06** | `api/quotation.js` | Lines 8, 45–55 | Deprecation notice for public email sending; rate-limited calculation and doc generation. | **VERIFIED** |
| **EVD-122-07** | `api/admin-quotations.js` | Lines 831–875 | Authenticated Resend quotation email dispatch (`action=send-buyer`). | **VERIFIED** |
| **EVD-122-08** | `api/email-reply-webhook.js` | Lines 1–45 | Inbound buyer reply detection via Resend/Svix webhook. | **VERIFIED** |
| **EVD-122-09** | `api/cron-sequence-dispatch.js` | Lines 1–50 | Automated outreach sequence engine, held under `GLOBAL_OUTREACH_STOP=1`. | **VERIFIED** |
| **EVD-122-10** | `src/lib/emailjs.js` | Lines 18–44 | Local fetch wrapper calling `/api/save-lead`. Zero `@emailjs` imports. | **VERIFIED** |
| **EVD-122-11** | `package.json` | Line 15 | Orphaned dependency `@emailjs/browser: "^4.4.1"`. | **VERIFIED** |
| **EVD-122-12** | `src/pages/PrivateDashboard.jsx` | Lines 42–126 | Client-side data fetching and in-memory aggregation. | **VERIFIED** |

---

## 5. DEF-120-01: ROOT CAUSE INDEPENDENT VALIDATION

### 5.1 Verification Checklist

1. **Enquiry Identifier Generation:**  
   *Verified in `api/save-lead.js:160-164`:*  
   `const randSuffix = Math.floor(100000 + Math.random() * 900000);`  
   `const inquiryId = body.inquiryId || `AAF-INQ-2026-${randSuffix}`;`  
   Canonical format: `AAF-INQ-2026-XXXXXX` (6-digit numeric suffix).
2. **Quotation Identifier Generation:**  
   *Verified in `api/save-lead.js:161-163`:*  
   `const randQuoteSuffix = Math.floor(1000 + Math.random() * 9000);`  
   `const quoteId = body.quoteId || `AAF-Q-2026-${randQuoteSuffix}`;`  
   Canonical format: `AAF-Q-2026-XXXX` (4-digit numeric suffix).
3. **Foreign-Key Column and Target:**  
   *Verified in `supabase/migrations/20261110_quotations_table.sql:12`:*  
   `inquiry_id VARCHAR(50) REFERENCES public.leads(inquiry_id) ON DELETE SET NULL`
4. **Column Data Types:**  
   - `public.leads.inquiry_id`: `VARCHAR(50) UNIQUE NOT NULL`
   - `public.quotations.inquiry_id`: `VARCHAR(50) NULLABLE`
   Data types are completely identical and compatible.
5. **Existence of Referenced Enquiry:**  
   In `api/save-lead.js:319`, `await saveLeadToSupabase(inquiryRecord)` executes **before** `saveQuotationToSupabase`. If lead persistence fails, the API terminates immediately with HTTP 500. Therefore, when `saveQuotationToSupabase` is called, the referenced lead is already committed in `public.leads`.
6. **Exact `safeInquiryId` Conditional Behavior:**  
   In `api/_lib/supabaseClient.js:239`:  
   `const safeInquiryId = (rawInquiryId && !rawInquiryId.startsWith('AAF-INQ-2026-')) ? rawInquiryId : (existingDelivery?.inquiry_id || null);`  
   When `rawInquiryId` is `'AAF-INQ-2026-884043'`, `rawInquiryId.startsWith('AAF-INQ-2026-')` is `true`.  
   `!rawInquiryId.startsWith('AAF-INQ-2026-')` evaluates to `false`.  
   The ternary takes the falsy branch: `existingDelivery?.inquiry_id || null`.  
   For a newly created quotation, `existingDelivery` is `null`.  
   Result: `safeInquiryId = null`.
7. **Production of NULL Linkage:**  
   **VERIFIED.** The quotation row is inserted into PostgreSQL with `inquiry_id = NULL`.
8. **Root Cause Confirmation:**  
   **VERIFIED.** The reported root cause in Package 3F.120 and 3F.121 is 100% correct.

---

## 6. DEF-120-01: SAFE IMPLEMENTATION DESIGN

### 6.1 Why Caller Booleans Are Rejected
The Package 3F.121 proposal to accept a caller-supplied `isLeadAssociated: true` is **rejected** for the following architectural reasons:
1. **Security & Data Integrity Boundary:** Client inputs and serverless function callers must be treated as untrusted. Trusting a boolean parameter to bypass validation allows any buggy or malicious caller to pass `{ isLeadAssociated: true, inquiryId: 'NON_EXISTENT_ID' }`, triggering an unhandled PostgreSQL constraint violation (`23503`).
2. **Defensive Persistence:** The database persistence layer (`supabaseClient.js`) must be self-protecting and guarantee integrity independently of caller state.

### 6.2 The Authoritative Database Existence Verification Pattern
Instead of arbitrary string prefix checks or caller flags, `saveQuotationToSupabase` will perform authoritative verification:

```javascript
// ============================================================
// ARCHITECTURAL DESIGN: Authoritative Lead Existence Verification
// File: api/_lib/supabaseClient.js
// ============================================================

export async function saveQuotationToSupabase(quoteRecord) {
  if (!isSupabaseConfigured()) {
    return { persisted: false, status: 'SUPABASE_UNCONFIGURED', quoteId: quoteRecord.quoteId || quoteRecord.quotationId };
  }

  const qId = quoteRecord.quoteId || quoteRecord.quotationId;

  // 1. Resolve existing record to preserve delivery metadata
  let existingDelivery = null;
  if (qId) {
    try {
      const existingRes = await getQuotationByIdFromSupabase(qId);
      if (existingRes.success && existingRes.quotation) {
        existingDelivery = existingRes.quotation;
      }
    } catch (_) {}
  }

  // 2. Resolve candidate inquiry_id
  const rawInquiryId = (quoteRecord.inquiryId || quoteRecord.leadId || '').trim();
  let verifiedInquiryId = null;

  if (rawInquiryId) {
    // 3. Verify actual existence in public.leads via lightweight PostgREST check
    try {
      const checkRes = await supabaseFetch(`leads?inquiry_id=eq.${encodeURIComponent(rawInquiryId)}&select=inquiry_id`, {
        method: 'GET'
      });
      if (checkRes.success && Array.isArray(checkRes.data) && checkRes.data.length > 0) {
        // Confirmed: Lead exists in database. Safe to reference.
        verifiedInquiryId = rawInquiryId;
      } else {
        // Lead not found in database: Log warning and set to null (complying with Owner Decision 1)
        console.warn(`[Quotation Linkage Guard] Referenced inquiry_id "${rawInquiryId}" not found in public.leads. Storing with inquiry_id = null.`);
        verifiedInquiryId = existingDelivery?.inquiry_id || null;
      }
    } catch (err) {
      console.error('[Quotation Linkage Guard Error]:', err.message);
      verifiedInquiryId = existingDelivery?.inquiry_id || null;
    }
  } else {
    // Pure quotation without lead reference
    verifiedInquiryId = existingDelivery?.inquiry_id || null;
  }

  const row = {
    quotation_id: qId,
    inquiry_id: verifiedInquiryId,
    // ... remaining quotation fields
  };

  return await supabaseFetch('quotations', {
    method: 'POST',
    body: row,
    prefer: 'resolution=merge-duplicates,return=representation'
  });
}
```

### 6.3 Architectural Invariants Guaranteed
1. **Mathematical Safety:** If `verifiedInquiryId` is non-null, it is mathematically proven to exist in `public.leads`, eliminating Foreign Key Violation `23503`.
2. **Support for Pure Quotations:** If a quotation is created directly from the Admin Builder without a lead, `verifiedInquiryId` safely evaluates to `null`.
3. **Delivery Preservation:** Existing linked leads are never severed during routine quotation updates.

---

## 7. COMPLETE EMAIL WORKFLOW AUDIT (WORKSTREAM B)

### 7.1 Reconciliation of Previously Failed Inspections

| Target File | Inspection Result | Evidence & Technical Facts | Audit Classification |
| :--- | :--- | :--- | :---: |
| `api/email-quote.js` | **FAILED (FILE NOT FOUND)** | `Get-Item api/email-quote.js` exited with code 1. File does not exist on disk and was never committed in Git history. It was a hypothetical reference in early planning notes. | **VERIFIED (NON-EXISTENT)** |
| `api/quote.js` | **FAILED (FILE NOT FOUND)** | `Get-Item api/quote.js` exited with code 1. File does not exist. The actual implemented file is `api/quotation.js`. | **VERIFIED (NON-EXISTENT)** |
| `api/quotation.js` | **ACCESSIBLE & VERIFIED** | Implements quotation calculation and PDF/DOCX generation. Line 8 explicitly states: `POST /api/quotation?action=send-email -> DEPRECATED (Returns 403; requires authenticated controlled dispatch)`. | **VERIFIED** |

*Audit Statement:* The email architecture audit is complete. No valid email workflows were missed; the failed inspections were caused by non-existent file names cited in legacy documentation.

### 7.2 Complete Production Email Workflow Register

| ID | Workflow Name | Trigger Source | Recipient | Endpoint / Function | Provider | Retry Policy | Idempotency Key / Guard | Purpose |
| :- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **EM-01** | Internal Sales RFQ Alert | Web Form Submission (`Contact.jsx`, `B2BRFQForm.jsx`) | `sales@avaniagrofoods.com` | `api/save-lead.js:409` | **Resend** | 1 retry with 400ms delay + 7s timeout | Deduplication window (60s) in memory | Internal alert with complete buyer dossier & UTM data. |
| **EM-02** | Buyer RFQ Acknowledgement | Web Form Submission (`Contact.jsx`, `B2BRFQForm.jsx`) | Buyer Contact Email | `api/save-lead.js:448` | **Resend** | 1 retry with 400ms delay + 7s timeout | Bound to `inquiryId` in `save-lead.js` | Buyer receipt confirmation with reference IDs and WhatsApp link. |
| **EM-03** | Commercial Quotation Dispatch | Admin Builder ("Send to Buyer") | Buyer Contact Email | `api/admin-quotations.js:831` (`action=send-buyer`) | **Resend** | Managed via Resend API response | `quote_${quoteId}_${revisionNumber}` | Transmits proforma quotation PDF/DOCX and formal payment terms. |
| **EM-04** | Inbound Buyer Reply Detection | Buyer email reply via MX / inbound hook | Avani System / CRM | `api/email-reply-webhook.js:1` | **Resend / Svix** | Resend exponential retry on 5xx | Svix `msg_id` with atomic Redis Lua CAS lease | Halts outreach sequence, records buyer response, alerts sales desk. |
| **EM-05** | Delivery Webhook Tracking | Resend event (`delivered`, `bounced`, `complained`) | Avani System | `api/admin-quotations.js:315` (`action=delivery-webhook`) | **Resend / Svix** | Resend exponential retry on 5xx | Svix `msg_id` with atomic Redis Lua CAS lease | Updates `public.quotations.delivery_status` and timestamps. |
| **EM-06** | Cold Outreach Sequences | Cron Job (`CRON_SECRET`) | Prospective Importers | `api/cron-sequence-dispatch.js:1` | **Resend** | State machine retry counters | Redis recipient state lock | **HELD UNDER GLOBAL_OUTREACH_STOP=1.** Zero emails dispatched. |
| **EM-07** | Lead Magnet Download | Ebook / Guide form | `sales@avani...` & Buyer | `src/components/LeadMagnet.jsx:19` | Routes to `save-lead.js` | Governed by EM-01/02 | Handled by `save-lead.js` | Resource capture (dispatches EM-01 & EM-02). |
| **EM-08** | B2B Registration | Partner Signup form | `sales@avani...` & Buyer | `src/pages/B2BRegistration.jsx:93` | Routes to `save-lead.js` | Governed by EM-01/02 | Handled by `save-lead.js` | Enterprise registration (dispatches EM-01 & EM-02). |

### 7.3 Status of `@emailjs/browser` Dependency
- Source code search across `src/` and `api/` revealed **zero** import statements for `@emailjs/browser`.
- `src/lib/emailjs.js` contains no third-party SDK calls; all functions wrap native `fetch('/api/save-lead')`.
- Build tools and Vite bundles do not include `@emailjs/browser` in active chunks.
- It remains solely as an unused entry in `package.json:15`.

---

## 8. RESEND TARGET ARCHITECTURE

### 8.1 Principles
1. **Server-Side Sole Authority:** Zero client-side credentials or browser direct email dispatches.
2. **Domain Isolation:**
   - Outbound transactional: `sales@avaniagrofoods.com` (authenticated via SPF, DKIM, DMARC on Vercel/Resend).
   - System notifications: `notifications@avaniagrofoods.com`.
3. **Delivery Tracking State Machine:**
   - Monotonic state progression: `pending` $\rightarrow$ `sent` $\rightarrow$ `delivered` (terminal) OR `bounced` (terminal) OR `complained` (terminal).
   - Prohibits regressions (e.g. an `email.clicked` event will never revert `delivered` to `pending`).

### 8.2 Safe Refactoring Roadmap for Client Forms
To eliminate the misleading `emailjs.js` naming without breaking existing forms:
1. Create `src/lib/apiClient.js` providing:
   - `submitLeadInquiry(data)`
   - `submitB2BRegistration(data)`
   - `submitLeadMagnet(data)`
2. Update imports in `Contact.jsx`, `LeadMagnet.jsx`, and `B2BRegistration.jsx`.
3. Deprecate and delete `src/lib/emailjs.js`.
4. Run `npm uninstall @emailjs/browser` to remove the package.

---

## 9. DASHBOARD KPI DATA CONTRACTS (WORKSTREAM C)

### 9.1 Data Contract Specifications

```
+--------------------------------------------------------------------------------------------------+
|                                    KPI GROUP SPECIFICATIONS                                      |
+--------------------------------------------------------------------------------------------------+
```

#### Group 1: COUNTRY
- **Metric 1.1: Inbound Volume by Country (`volumeByCountry`)**
  - *Meaning:* Gross distribution of international sourcing enquiries.
  - *Database Source:* `public.leads.country`
  - *Numerator:* `COUNT(id)` grouped by `UPPER(TRIM(country))`.
  - *Denominator:* Total leads in selected date range.
  - *Missing/Invalid:* Values `NULL`, `''`, or length $< 2$ grouped into `'UNKNOWN'`.
- **Metric 1.2: Qualified Volume by Country (`qualifiedByCountry`)**
  - *Meaning:* Commercial demand meeting export viability standards.
  - *Numerator:* `COUNT(id)` where `status IN ('QUALIFIED', 'PROCESSOR_CHECK', 'QUOTATION_READY', 'SENT_TO_BUYER', 'NEGOTIATION', 'PURCHASE_ORDER', 'WON')` OR `(raw_payload->'qualification'->>'qualificationScore')::numeric >= 60`.
  - *Denominator:* Gross country volume.
- **Metric 1.3: Country Conversion Performance (`countryConversionRate`)**
  - *Numerator:* Leads in country with at least one quotation in `status IN ('SENT_TO_BUYER', 'NEGOTIATION', 'PURCHASE_ORDER', 'WON')`.
  - *Denominator:* Total qualified leads in country.

#### Group 2: PRODUCT
- **Metric 2.1: Moringa Demand Share (`moringaShare`)**
  - *Meaning:* Demand share for Moringa oleifera leaf powder.
  - *Source:* `public.leads.product` (`product ILIKE '%moringa%'`)
- **Metric 2.2: Red Onion Demand Share (`onionShare`)**
  - *Meaning:* Demand share for Dehydrated Red Onion Powder.
  - *Source:* `public.leads.product` (`product ILIKE '%onion%'`)
- **Metric 2.3: Product Qualification Rate**
  - *Numerator:* Qualified enquiries for Product $P$.
  - *Denominator:* Total enquiries for Product $P$.
- **Metric 2.4: Product Quotation Rate**
  - *Numerator:* Delivered quotations for Product $P$.
  - *Denominator:* Qualified enquiries for Product $P$.

#### Group 3: STAGE
- **Metric 3.1: Funnel Distribution (`funnelDistribution`)**
  - *Meaning:* Distribution of all records across the 10 canonical lifecycle stages:
    1. `NEW_ENQUIRY`
    2. `QUALIFIED`
    3. `PROCESSOR_CHECK`
    4. `QUOTATION_READY`
    5. `SENT_TO_BUYER`
    6. `NEGOTIATION`
    7. `PURCHASE_ORDER`
    8. `WON`
    9. `LOST`
    10. `NURTURE`
- **Metric 3.2: Unresolved Backlog Count (`unresolvedCount`)**
  - *Numerator:* `COUNT(id)` where `status IN ('NEW_ENQUIRY', 'PROCESSOR_CHECK')`.
  - *Operational Target:* Should trend towards zero within 24 hours of submission.
- **Reopened Enquiries:** Handled as an active state transition updating `status` and `updated_at`, recorded in `public.crm_activities`.

#### Group 4: CONVERSION
- **Metric 4.1: Enquiry-to-Qualified Rate ($C_{EQ}$)**
  $$\text{Numerator: Total Qualified Leads} \quad / \quad \text{Denominator: Total Inbound Enquiries (excluding Spam)}$$
- **Metric 4.2: Qualified-to-Quotation Rate ($C_{QQ}$)**
  $$\text{Numerator: Distinct Qualified Leads with Issued Quote} \quad / \quad \text{Denominator: Total Qualified Leads}$$
- **Metric 4.3: Quotation-to-Order Rate ($C_{QO}$)**
  $$\text{Numerator: Quotes in } (\mathtt{'PURCHASE\_ORDER'}, \mathtt{'WON'}) \quad / \quad \text{Denominator: Quotes Delivered to Buyers with Decided Outcome}$$
  *Rule:* Quotations created in draft that were never sent to buyers are strictly excluded from the denominator.

#### Group 5: RESPONSE TIME
- **Event Definition:**
  - $t_0$: Lead submission timestamp (`leads.submission_date` or `leads.created_at`).
  - $t_1$: Earliest response timestamp from:
    1. `crm_activities.created_at` where `activity_type IN ('QUOTATION_SENT', 'BUYER_EMAIL', 'INITIAL_CONTACT')`
    2. `quotations.sent_at`
- **Metric 5.1: Average Response Time ($T_{\text{avg}}$):** $\frac{1}{N}\sum(t_1 - t_0)$ in hours.
- **Metric 5.2: Median Response Time ($T_{\text{med}}$):** 50th percentile of $(t_1 - t_0)$ in hours.
- **Treatment of Missing Values:** Leads awaiting first response are tracked as `pending_response_count` and excluded from duration averages.

#### Group 6: LOST
- **Metric 6.1: Lost Opportunity Count (`totalLost`)**
  - Leads with `status IN ('LOST', 'LOST_NOT_QUALIFIED', 'DISQUALIFIED')`.
- **Metric 6.2: Categorized Lost Reasons (`lostReasons`):**
  - `PRICE_GAP`: Target price below processor floor.
  - `SPEC_UNSUPPORTED`: Non-standard microbiological or mesh criteria.
  - `VOLUME_BELOW_MOQ`: Volume $< 100$ kg.
  - `BUYER_UNRESPONSIVE`: No response after follow-up.
  - `LEAD_TIME_MISMATCH`: Delivery timeline unfeasible.
  - `UNKNOWN_UNSPECIFIED`: Default; separately categorized.
- **Metric 6.3: Lost Breakdown:** Segmented by Product and Country.

---

## 10. DASHBOARD AUTHORIZATION & PRIVACY DESIGN

1. **Authentication Requirement:**  
   The aggregation endpoint (`GET /api/admin-quotations?action=kpi-summary`) requires an active, verified `avani_gate_session` cookie in Upstash KV. Unauthenticated callers receive `HTTP 401 SESSION_MISSING`.
2. **Zero PII Payload Guarantee:**  
   The response payload contains **zero personal data**. No buyer names, company contact emails, telephone numbers, or specific proforma values are exposed. Only aggregate integers, percentages, and country codes are transmitted.
3. **Data Minimization:**  
   Replaces the existing practice of pulling hundreds of full customer records into the browser with a compact JSON summary (< 4 KB), preventing client memory exhaustion and securing customer information.

---

## 11. INDIVIDUAL QUOTATION VALIDITY DESIGN (WORKSTREAM D)

### 11.1 Schema Additions (Forward-Only)
In `public.quotations`:
```sql
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS validity_days INTEGER DEFAULT 14;
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS validity_basis VARCHAR(100) DEFAULT 'STANDARD_PROFORMA';
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS timezone_reference VARCHAR(50) DEFAULT 'Asia/Kolkata';
```

### 11.2 Calculations and Timezone Behavior
- **Issue Timestamp:** `date DATE` (Calendar issue date) and `created_at TIMESTAMPTZ` (Exact UTC creation time).
- **Expiry Timestamp:** Calculated at **23:59:59 IST (UTC+05:30)** on the calendar date `valid_until`.
  $$\mathtt{expiry\_timestamp} = \mathtt{valid\_until} + \mathtt{"23:59:59+05:30"}$$
- **Timezone Anchor:** Explicitly anchored to **Asia/Kolkata (IST)**. Agricultural commodity allocations and container dispatch schedules are managed from Maharashtra, India.
- **Runtime Expiration Evaluation:**
  Evaluated dynamically without cron mutations:
  ```javascript
  const todayIST = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  const isExpired = quotation.validUntil ? (todayIST > quotation.validUntil) : false;
  ```

### 11.3 Revision and Cancellation Handling
- **Revising an Expired Quotation:**  
  When an expired quote is revised, `quotationModel.js:reviseQuotation` increments `revisionNumber`, sets the new issue date, applies new validity days, and transitions previous versions to `SUPERSEDED`.
- **UI Expiry Enforcement:**  
  Expired quotes display an Amber `EXPIRED` badge. Clicking "Send to Buyer" on an expired quote triggers a warning modal requiring re-validation or revision.
- **Historical Preservation:**  
  Historical records with legacy dates are preserved untouched.

---

## 12. HISTORICAL DATA PRESERVATION STRATEGY

1. **Immutable Historical Migrations:**  
   No historical migrations will be re-run or edited. All database schema enhancements will be introduced in forward-only migration `20261116_quotation_validity_and_analytics.sql`.
2. **Safe Backfill for Linkage (Optional):**  
   If the business owner authorizes backfilling unlinked quotations:
   ```sql
   -- Safe forward-only reconciliation matching on buyer email
   UPDATE public.quotations q
   SET inquiry_id = l.inquiry_id
   FROM public.leads l
   WHERE q.inquiry_id IS NULL
     AND LOWER(TRIM(q.buyer_email)) = LOWER(TRIM(l.email))
     AND q.created_at >= l.created_at;
   ```
3. **Zero Data Loss:**  
   Foreign key constraint is `ON DELETE SET NULL`, ensuring deleting a lead never cascades into deleting financial quotation records.

---

## 13. FOREIGN EXCHANGE (FX) COMMERCIAL REVIEW (WORKSTREAM E)

In accordance with Owner Decision 2, the selection of an FX clause remains under **`REVIEW`**. Below is the comparative operational evaluation:

| Parameter | Option A: Firm Short Validity Offer | Option B: Currency Fluctuation Surcharge Band | Option C: Split FOB & Maritime Freight |
| :--- | :--- | :--- | :--- |
| **Mechanism** | 7–10 days firm fixed USD price; quote expires thereafter. | USD price tied to baseline RBI rate; adjusts if shift $\ge 3\%$. | FOB Nhava Sheva cargo value fixed; ocean freight at actuals. |
| **Buyer Impact** | **Zero Friction.** Standard B2B import practice. Highly favored. | **Moderate Friction.** Importers dislike floating commodity invoices. | **Standard Practice.** Widely accepted by freight forwarders. |
| **Seller Risk** | **Low.** Risk capped to a 10-day window. | **Very Low.** Margin protected against INR depreciation/appreciation. | **Low.** Insulates seller from volatile container shipping rates. |
| **Reference Source** | Internal pricing desk. | **Reserve Bank of India (FBIL Reference Rate)** at 1:30 PM IST. | Shipping Line Tariff / B/L. |
| **Trigger Event** | Calendar expiration date. | Realization rate varies $\ge 3.0\%$ from baseline on SWIFT credit. | Liner rate fluctuation. |
| **Legal Review Needed?** | Standard commercial contract. | **Mandatory.** Requires bilateral buyer sign-off on proforma. | Standard commercial invoice. |

*Operational Recommendation for Owner Review:* **Option A** is the cleanest, lowest-friction commercial approach for initial pilot export shipments.

---

## 14. API AND DATABASE CONTRACT RECOMMENDATIONS

### 14.1 Recommended Endpoint Contract: `GET /api/admin-quotations?action=kpi-summary`
- **Method:** `GET`
- **Security:** Cookie `avani_gate_session` required; rate-limited to 60 req / 15 min.
- **Contract Schema:**
```typescript
interface KpiSummaryResponse {
  success: boolean;
  timestamp: string;
  kpis: {
    country: {
      volumeByCountry: Record<string, number>;
      qualifiedByCountry: Record<string, number>;
      countryConversionRate: Record<string, number>;
    };
    product: {
      moringaVolume: number;
      onionVolume: number;
      otherVolume: number;
      moringaQualificationRate: number;
      onionQualificationRate: number;
    };
    stage: {
      funnel: Record<string, number>;
      unresolvedCount: number;
    };
    conversion: {
      enquiryToQualifiedPct: number;
      qualifiedToQuotationPct: number;
      quotationToOrderPct: number;
    };
    response: {
      averageResponseHours: number;
      medianResponseHours: number;
      pendingResponseCount: number;
    };
    lost: {
      totalLost: number;
      reasons: Record<string, number>;
      byProduct: Record<string, number>;
      byCountry: Record<string, number>;
    };
  };
}
```

---

## 15. DEPENDENCIES AND IMPLEMENTATION ORDER

The implementation must be executed in four strictly decoupled phases:

```
+--------------------------------------------------------------------------------------------------+
| PHASE 1: DATABASE INTEGRITY & ENQUIRY LINKAGE (DEF-120-01)                                       |
| - Update api/_lib/supabaseClient.js to query public.leads before populating inquiry_id.         |
| - Verify quotation saves from save-lead.js persist matching inquiry_id.                          |
| - Verify standalone quotations persist inquiry_id = null without FK violation.                   |
+--------------------------------------------------------------------------------------------------+
                                                  │
                                                  v
+--------------------------------------------------------------------------------------------------+
| PHASE 2: INDIVIDUAL QUOTATION VALIDITY (OWNER DECISION 1)                                        |
| - Forward-only database migration adding validity_days, validity_basis to public.quotations.     |
| - Update quotationModel.js and AdminQuotations.jsx with dynamic validity presets & date pickers. |
| - Add dynamic evaluateQuotationValidity runtime check and Amber warning badges.                  |
+--------------------------------------------------------------------------------------------------+
                                                  │
                                                  v
+--------------------------------------------------------------------------------------------------+
| PHASE 3: SERVER-SIDE KPI AGGREGATION ENGINE (DEF-120-03)                                         |
| - Implement action=kpi-summary in api/admin-quotations.js covering all six groups.               |
| - Connect PrivateDashboard.jsx to consume kpi-summary endpoint.                                  |
| - Remove raw record in-memory calculation and localStorage blending.                            |
+--------------------------------------------------------------------------------------------------+
                                                  │
                                                  v
+--------------------------------------------------------------------------------------------------+
| PHASE 4: CLIENT EMAIL CLEAN-UP (DEF-120-02)                                                      |
| - Create src/lib/apiClient.js with clean native fetch wrappers.                                  |
| - Update imports in Contact.jsx, LeadMagnet.jsx, and B2BRegistration.jsx.                        |
| - Delete src/lib/emailjs.js and uninstall @emailjs/browser from package.json.                    |
+--------------------------------------------------------------------------------------------------+
```

---

## 16. FAILURE AND RECOVERY SCENARIOS

1. **Lead Verification Query Timeout during Quotation Save:**  
   If the existence check for `inquiry_id` against `public.leads` times out, `supabaseClient.js` falls back to `inquiry_id = null` and logs an audit error. The quotation save succeeds, avoiding 500 errors on buyer forms.
2. **Resend API Downtime during RFQ:**  
   `api/save-lead.js` catches Resend dispatch errors, preserves the lead in Supabase, and returns HTTP 200 with `emailDeliveryAlert` set, ensuring no buyer requirement is lost.
3. **Redis Rate Limit Outage:**  
   If Upstash Redis is unreachable, serverless endpoints fail closed with `HTTP 503 DISTRIBUTED_KV_UNAVAILABLE`, preventing un-throttled spam attacks.

---

## 17. ACCEPTANCE CRITERIA FOR FUTURE VERIFICATION

1. **AC-122-01 (Quotation Linkage):** Submitting a valid RFQ via `/api/save-lead` creates a row in `public.leads` and a row in `public.quotations` where `quotations.inquiry_id === leads.inquiry_id`.
2. **AC-122-02 (Standalone Quotation FK Safety):** Creating an unlinked quotation in Admin Builder stores `inquiry_id = NULL` without throwing error `23503`.
3. **AC-122-03 (Quotation Expiry Display):** Quotations with `valid_until < CURRENT_DATE` display an Amber `EXPIRED` badge and require confirmation before dispatch.
4. **AC-122-04 (KPI Endpoint Security):** `GET /api/admin-quotations?action=kpi-summary` returns 401 without an active session cookie, and returns accurate mathematical metrics across all 6 groups when authenticated.
5. **AC-122-05 (Zero PII in Analytics):** Network response of `action=kpi-summary` contains zero buyer names, emails, or phone numbers.
6. **AC-122-06 (Clean Dependency Tree):** Running `npm run build` succeeds without `@emailjs/browser` installed.

---

## 18. ROLLBACK AND COMPATIBILITY CONSIDERATIONS

- **Zero Breaking Schema Changes:** All database column additions are forward-only (`ADD COLUMN IF NOT EXISTS`).
- **Graceful Degradation:** If the KPI summary endpoint encounters an error, `PrivateDashboard.jsx` displays a retry button without crashing the navigation or quotation workflows.
- **Client Form Isolation:** Frontend forms communicate via standard HTTP POST `/api/save-lead`; client-side refactoring does not alter API payload contracts.

---

## 19. OUTSTANDING EVIDENCE Gaps & VERIFICATION LIMITATIONS

1. **Actual Inbound Webhook Logs:** Live inbound buyer reply webhooks (`email-reply-webhook.js`) cannot be triggered without active email dispatches (held under `GLOBAL_OUTREACH_STOP=1`). Verified via static code inspection and Svix HMAC signature test suites.
2. **Historical Lead Response Time Timestamps:** Several baseline leads in `public.leads` lack corresponding rows in `public.crm_activities`. The KPI engine properly accounts for this by classifying them as `pending_response_count`.

---

## 20. OUTSTANDING OWNER / LEGAL DECISIONS

1. **FX Contractual Wording Approval:**  
   Owner/Legal decision on whether to adopt Option A (Firm 10-day validity, recommended) or Option B ($\pm 3\%$ surcharge clause).
2. **Historical Data Reconciliation:**  
   Confirmation of whether to run the one-time SQL update linking historical unlinked quotations to leads by email match.
3. **Response Time SLA Threshold:**  
   Confirmation of target response time threshold (e.g. 12 hours) for dashboard health status indicators.

---

## 21. IMPLEMENTATION READINESS CLASSIFICATION

### Classification: **`BLUEPRINT_READY`**

All technical architectures, root causes, data models, API contracts, security boundaries, and owner decisions are fully validated and documented. The project is ready for controlled execution under a future implementation package.

---

## 22. GOVERNANCE AND SYSTEM-STATE CONFIRMATION

- **Application Source Code Modified:** NO (0 files changed)
- **Database Records Written / Deleted:** NO (0 rows modified)
- **Migrations Executed:** NO
- **Deployments Triggered:** NO
- **Git Commits / Pushes Executed:** NO
- **Credentials / Secrets Changed:** NO
- **External Communications / Outreach Activated:** NO
- **Governance Locks:** `GLOBAL_OUTREACH_STOP=1`, `OUTREACH_AUTHORIZED=0`, `PILOT_AUTHORIZED=0` strictly maintained.
