# PACKAGE 3F.121 — CONTROLLED BUSINESS OPERATIONS REMEDIATION SPECIFICATION & OWNER DECISION RECONCILIATION

**SPECIFICATION REFERENCE:** `AAF-SPEC-3F-121`  
**PROJECT:** AVANI AGRO FOODS WEBSITE ENGINE (`2-AVANI AGRO FOODS LATUR 2026` — PROJECT A ONLY)  
**DATE:** 16 November 2026  
**MODE:** STRICT READ-ONLY SPECIFICATION ONLY (NO IMPLEMENTATION)  
**GOVERNANCE LOCKS (ACTIVE & MANDATORY):**
- `GLOBAL_OUTREACH_STOP=1`
- `OUTREACH_AUTHORIZED=0`
- `PILOT_AUTHORIZED=0`

---

## 1. EXECUTIVE SUMMARY

This document establishes the authoritative, evidence-based technical remediation specification for the three findings identified in **Package 3F.120**:
1. **DEF-120-01 (Medium):** Quotation-to-Lead foreign key decoupling in `api/_lib/supabaseClient.js`.
2. **DEF-120-02 (Low):** Email architecture reconciliation between client-side EmailJS legacy shims and server-side Resend API dispatch.
3. **DEF-120-03 (Low):** Administrative dashboard aggregation and management reporting across six required KPI groups.

In addition, this specification incorporates and reconciles all five **Authoritative Owner Technical Decisions** issued on 16 November 2026:
- **Decision 1 (Quotation Validity):** `INDIVIDUAL_PER_QUOTATION` — dynamic per-quotation expiry dates, explicitly rejecting universal 14-day or 30-day blanket limits.
- **Decision 2 (FX Clause):** `REVIEW` — comprehensive legal/commercial risk analysis and proposed contractual formulations for international export proformas without imposing an arbitrary threshold.
- **Decision 3 (Email Architecture):** `RESEND` — server-side authoritative email delivery architecture while maintaining backwards compatibility and avoiding premature removal of working shims.
- **Decision 4 (Dashboard KPI Scope):** Server-side aggregation across exactly six approved KPI groups: Country, Product, Stage, Conversion, Response Time, and Lost Enquiries.
- **Decision 5 (Authorization):** `SPECIFICATION ONLY` — strict read-only specification; zero code, database, migration, or infrastructure mutation permitted.

**Final Specification Classification:** **`SPECIFICATION_READY`**

---

## 2. OWNER DECISION RECONCILIATION MATRIX

| # | Owner Decision Area | Authoritative Owner Mandate | Specification Reconciliation & Architecture Response | Alignment Status |
| :- | :--- | :--- | :--- | :---: |
| 1 | **Quotation Validity** | `INDIVIDUAL_PER_QUOTATION` | - Rejects hardcoded default '12 Oct 2026' and universal 14/30-day rules.<br>- Specifies discrete `valid_until` (Date) and `validity_days` (Integer) in database.<br>- Implements dynamic runtime expiry evaluations and UI expiration badges.<br>- Preserves existing quotation validity terms without retroactive truncation. | **VERIFIED & INCORPORATED** |
| 2 | **FX Clause** | `REVIEW` | - Rejects automatic contractual insertion of arbitrary $\pm 2\%$ threshold.<br>- Evaluates three distinct commercial formulations (Firm Validity, Agreed Band Surcharge, Dual Currency).<br>- Identifies official benchmark (RBI Reference Rate / FBIL) and applicable fixing dates.<br>- Highlights legal enforceability and buyer friction risks for separate owner/legal review. | **VERIFIED & INCORPORATED** |
| 3 | **Email Architecture** | `RESEND` | - Establishes Resend API as the authoritative server-side transactional email engine.<br>- Identifies all 5 notification workflows and separates buyer acknowledgements from internal sales alerts.<br>- Discloses that `src/lib/emailjs.js` is already a local fetch wrapper to `/api/save-lead`, not an active browser SDK.<br>- Specifies server-side idempotency, retry mechanisms, and delivery webhook tracking.<br>- Retains EmailJS shims during specification to prevent breaking client-side forms. | **VERIFIED & INCORPORATED** |
| 4 | **Dashboard KPI Scope** | Six Specified KPI Groups | - Restricts dashboard aggregation scope to: Country, Product, Stage, Conversion, Response Time, and Lost Enquiries.<br>- Specifies secure server-side aggregation endpoint (`GET /api/admin-quotations?action=kpi-summary`).<br>- Mandates strict data minimization: zero PII in aggregation payloads.<br>- Establishes exact mathematical formulas for numerators, denominators, and response times. | **VERIFIED & INCORPORATED** |
| 5 | **Authorization** | `SPECIFICATION ONLY` | - Strictly read-only audit and specification creation.<br>- Zero application files, database rows, migrations, or deployments modified.<br>- Governance outreach locks maintained at 100% stop (`GLOBAL_OUTREACH_STOP=1`). | **VERIFIED & INCORPORATED** |

---

## 3. SCOPE AND EXPLICIT EXCLUSIONS

### In-Scope (Specification Only):
- Deep source code and schema inspection of Project A (`2-AVANI AGRO FOODS LATUR 2026`).
- Root-cause diagnosis and remediation specification for DEF-120-01, DEF-120-02, and DEF-120-03.
- Data model, API contracts, security controls, and acceptance criteria for future Package 3F.122 implementation.

### Explicit Exclusions (Prohibited):
- Modifying, deleting, or editing any application source code.
- Modifying database schemas, executing migrations, or writing/deleting database records.
- Triggering production or preview Vercel deployments.
- Executing Git commits, pushes, merges, or branch modifications.
- Sending real or test emails, or communicating with buyers or suppliers.
- Accessing or modifying quarantined BLK-06 files (`api/_data/*`, `acceptance_test_temp_20261009.txt`).
- Inspecting or modifying Project B (`AVANI_AGRO_INTELLIGENCE`) application assets.
- Changing any governance lock.

---

## 4. EVIDENCE INVENTORY WITH EXACT SOURCE REFERENCES

| Evidence Tag | File Path | Line Range | Content Description | Evidence Type |
| :--- | :--- | :--- | :--- | :--- |
| **EVD-121-01** | `api/_lib/supabaseClient.js` | Lines 237–240 | Defective `safeInquiryId` logic stripping genuine lead IDs starting with `AAF-INQ-2026-`. | **VERIFIED SOURCE** |
| **EVD-121-02** | `api/save-lead.js` | Lines 160–164 | Canonical lead enquiry ID generation (`AAF-INQ-2026-${randSuffix}`). | **VERIFIED SOURCE** |
| **EVD-121-03** | `src/data/quotationCore.js` | Lines 28–30 | Quotation core input mapping (`input.inquiryId \|\| input.leadId \|\| null`), confirming synthetic generation was already purged. | **VERIFIED SOURCE** |
| **EVD-121-04** | `supabase/migrations/20261110_quotations_table.sql` | Lines 12, 54 | Foreign key constraint `inquiry_id VARCHAR(50) REFERENCES public.leads(inquiry_id) ON DELETE SET NULL` and its index. | **VERIFIED SCHEMA** |
| **EVD-121-05** | `src/lib/emailjs.js` | Lines 18–44, 46–54 | `sendContactEmail` and `sendAutoReply` implementation showing local fetch wrapper to `/api/save-lead` with zero EmailJS SDK calls. | **VERIFIED SOURCE** |
| **EVD-121-06** | `package.json` | Line 15 | `@emailjs/browser: "^4.4.1"` listed as project dependency. | **VERIFIED CONFIG** |
| **EVD-121-07** | `src/pages/Contact.jsx` | Lines 4, 207–224 | Form handler calling `/api/save-lead` directly; `sendContactEmail` imported but uncalled. | **VERIFIED SOURCE** |
| **EVD-121-08** | `api/save-lead.js` | Lines 404–485 | Server-side transactional Resend dispatch for internal alert and buyer acknowledgement. | **VERIFIED SOURCE** |
| **EVD-121-09** | `src/pages/PrivateDashboard.jsx` | Lines 42–155 | Current client-side data retrieval querying all records into browser state for UI rendering. | **VERIFIED SOURCE** |
| **EVD-121-10** | `api/admin-quotations.js` | Lines 160–230 | Admin route session verification, rate limiting, and CSRF token enforcement. | **VERIFIED SOURCE** |

---

## 5. DEF-120-01: ROOT-CAUSE ANALYSIS & REMEDIATION SPECIFICATION

### 5.1 Root-Cause Forensic Analysis
In Package 3F.111, **FIND-111-01** reported that when pure quotations were created directly from the Admin Quotation Builder without an underlying buyer lead, `src/data/quotationCore.js` previously synthesized an artificial enquiry ID (`AAF-INQ-2026-XXXXXX`). When inserted into Supabase, PostgreSQL rejected the record with Foreign Key Violation `23503` because the synthetic key did not exist in `public.leads`.

Owner Decision 1 under Package 3F.112 mandated:
> *"Direct quotations without a genuine existing lead must use inquiry_id = NULL. Never generate artificial foreign-key identifiers."*

During implementation of Package 3F.112 (Git commit `b265ad3`), the following guard was introduced in `api/_lib/supabaseClient.js`:
```javascript
// Pure quotations without genuine pre-existing lead set inquiry_id to NULL (Owner Decision 1)
const rawInquiryId = quoteRecord.inquiryId || quoteRecord.leadId || null;
const safeInquiryId = (rawInquiryId && !rawInquiryId.startsWith('AAF-INQ-2026-')) ? rawInquiryId : (existingDelivery?.inquiry_id || null);
```

**The Flaw:**
The developer assumed that *any* identifier starting with `AAF-INQ-2026-` was a synthetic ID that needed to be suppressed. However, in `api/save-lead.js:162`, every genuine buyer lead captured through the website is assigned a canonical identifier matching that exact format:
```javascript
const randSuffix = Math.floor(100000 + Math.random() * 900000);
const inquiryId = body.inquiryId || `AAF-INQ-2026-${randSuffix}`;
```
Consequently:
1. `save-lead.js` persists a genuine lead with `inquiry_id = 'AAF-INQ-2026-884043'` to `public.leads`. (**Success**)
2. `save-lead.js` then calls `saveQuotationToSupabase(quotationRecord)` passing `inquiryId: 'AAF-INQ-2026-884043'`.
3. `supabaseClient.js:239` evaluates `!rawInquiryId.startsWith('AAF-INQ-2026-')`, which evaluates to `false`.
4. `safeInquiryId` falls back to `existingDelivery?.inquiry_id || null`, which evaluates to `null`.
5. The quotation is stored in `public.quotations` with `inquiry_id = NULL`, completely severing the relational link between the genuine lead and its quotation.

Meanwhile, in `src/data/quotationCore.js:29`, the synthetic generation had already been corrected:
```javascript
const inquiryId = input.inquiryId || input.leadId || null;
```
The guard in `supabaseClient.js` was therefore not only redundant but actively destructive.

### 5.2 Database Target Constraints
From migration `supabase/migrations/20261110_quotations_table.sql:12`:
```sql
inquiry_id VARCHAR(50) REFERENCES public.leads(inquiry_id) ON DELETE SET NULL,
```
- The foreign key target is `public.leads(inquiry_id)`.
- If `inquiry_id` is `NULL`, PostgreSQL accepts the row without violation.
- If `inquiry_id` is populated, the value **must** exist in `public.leads(inquiry_id)`.

### 5.3 Safest Remediation Specification
To guarantee that genuine leads retain their quotation link while preventing foreign-key violations on unpersisted or standalone quotations, `saveQuotationToSupabase` must:
1. Accept an optional explicit flag: `isLeadAssociated: true` (passed by `api/save-lead.js`).
2. When `quoteRecord.inquiryId` is provided:
   - If `isLeadAssociated === true`, trust `rawInquiryId` directly because `sLead` was already persisted immediately beforehand.
   - If `isLeadAssociated` is not set (e.g. from Admin UI), perform a lightweight, read-only foreign-key existence check (`SELECT inquiry_id FROM public.leads WHERE inquiry_id = ... LIMIT 1`) or use PostgREST `leads?inquiry_id=eq.${rawInquiryId}&select=inquiry_id`.
   - If the lead does not exist in `public.leads`, set `safeInquiryId = null` (strictly complying with Owner Decision 1).
3. If no `rawInquiryId` is passed, set `safeInquiryId = existingDelivery?.inquiry_id || null`.

---

## 6. DEF-120-02: EMAIL ARCHITECTURE ANALYSIS & SPECIFICATION

### 6.1 Complete Inventory of Existing Email Workflows

| # | Triggering Component | Target Handler | Transport Provider | Recipient | Email Purpose | Overlapping / Distinct? |
| :- | :--- | :--- | :--- | :--- | :--- | :--- |
| **W1** | Website RFQ (`Contact.jsx`, `B2BRFQForm.jsx`) | `api/save-lead.js:409` | **Resend API** | `sales@avaniagrofoods.com` | Internal Trade Alert: Complete buyer dossier, parameters, and UTM attribution. | **Distinct (Essential)** |
| **W2** | Website RFQ (`Contact.jsx`, `B2BRFQForm.jsx`) | `api/save-lead.js:448` | **Resend API** | Buyer Email | Buyer Acknowledgement: Official receipt, inquiry reference, next steps. | **Distinct (Essential)** |
| **W3** | Admin Quotation Builder (`AdminQuotations.jsx`) | `api/admin-quotations.js:831` | **Resend API** | Buyer Email | Official Commercial Quotation: Proforma quote, terms, PDF/DOCX attachments. | **Distinct (Essential)** |
| **W4** | Lead Magnet Download (`LeadMagnet.jsx`) | `src/lib/emailjs.js: sendContactEmail` | Calls `/api/save-lead` | `sales@avani...` & Buyer | Captures catalog/resource lead and dispatches W1 & W2 via Resend. | **Upstream Wrapper** |
| **W5** | B2B Registration (`B2BRegistration.jsx`) | `src/lib/emailjs.js: sendB2BRegistrationEmail` | Calls `/api/save-lead` | `sales@avani...` & Buyer | Captures enterprise partner lead and dispatches W1 & W2 via Resend. | **Upstream Wrapper** |
| **W6** | Legacy `sendAutoReply` in `emailjs.js` | `src/lib/emailjs.js:46` | **None (Stub)** | None | Returns `{ success: true, status: 'AUTO_REPLY_SERVER_CONTROLLED' }`. | **No-op Stub** |
| **W7** | Legacy `sendQuoteEmail` in `emailjs.js` | `src/lib/emailjs.js:81` | **None (Stub)** | None | Returns `{ success: true, status: 'SERVER_QUOTATION_REQUIRED' }`. | **No-op Stub** |

### 6.2 Key Architectural Insight on EmailJS
The Package 3F.120 observation that `Contact.jsx` triggers EmailJS in parallel with Resend was investigated at the source code level:
1. `src/lib/emailjs.js` was historically refactored in Package 3E.67. It **does not import** `@emailjs/browser` or make any external calls to EmailJS servers.
2. Every export in `src/lib/emailjs.js` (`sendContactEmail`, `sendB2BRegistrationEmail`, `sendAffiliateEmail`) actually executes a browser `fetch('/api/save-lead', ...)`.
3. In `Contact.jsx:4`, `sendContactEmail` and `sendAutoReply` are imported, but **never invoked** in the form submission handler (`handleSubmit`). `Contact.jsx` directly calls `fetch('/api/save-lead')`.
4. However, `@emailjs/browser` remains listed as an installed dependency in `package.json:15`, and legacy environment variables (`VITE_EMAILJS_*`) remain in configuration files, creating operator confusion.

### 6.3 Authoritative Resend Target Architecture
Under Owner Decision 3 (`RESEND`):
1. **Server-Side Exclusivity:** All outbound transactional emails must originate from Vercel serverless functions (`api/save-lead.js` and `api/admin-quotations.js`) utilizing authenticated HTTPS requests to `https://api.resend.com/emails`.
2. **Sender Identity Standardization:**
   - Buyer Acknowledgements & Commercial Quotations: `AVANI AGRO FOODS <sales@avaniagrofoods.com>` (verified domain).
   - Internal Administrative Alerts: `AVANI Trade System <notifications@avaniagrofoods.com>`.
3. **Idempotency & Lease Protection:**
   - Quotation dispatches from `admin-quotations.js` generate an idempotency key: `idempotencyKey = quote_${quotationId}_${revisionNumber || 0}`.
   - Prevents duplicate email dispatch if the operator clicks "Send to Buyer" multiple times.
4. **Delivery Webhook Processing:**
   - Webhook endpoint: `POST /api/admin-quotations?action=delivery-webhook`.
   - Reconciles `email.delivered`, `email.bounced`, and `email.complained` events from Resend, updating `public.quotations.delivery_status`.
   - Protects against replay and race conditions using Upstash Redis atomic Lua CAS leases.
5. **Phase-Out Plan for EmailJS Shims:**
   - **Phase 1 (Current Specification):** Retain `src/lib/emailjs.js` shims unchanged so `LeadMagnet.jsx` and `B2BRegistration.jsx` continue functioning without disruption.
   - **Phase 2 (Future Package 3F.122):** Create `src/lib/apiClient.js` exporting `submitLeadInquiry` and `submitB2BRegistration`. Re-point component imports from `../lib/emailjs` to `../lib/apiClient`.
   - **Phase 3:** Remove `src/lib/emailjs.js` and cleanly uninstall `@emailjs/browser` via `npm uninstall @emailjs/browser`.

---

## 7. DEF-120-03: DASHBOARD ARCHITECTURE & SERVER-SIDE AGGREGATION SPECIFICATION

### 7.1 Existing Client-Side Limitations
In `src/pages/PrivateDashboard.jsx:42-126`:
- The component executes `fetch('/api/importers')`, `fetch('/api/manufacturers')`, and `fetch('/api/admin-quotations')`, pulling all raw records over the network.
- It then merges these records with browser `localStorage` items (`avani_quotations` and `avani_enquiries`).
- Metrics (total counts, qualification counts) are calculated using JavaScript `.filter()` in client memory.

**Operational Defects:**
- **Performance:** As database size grows beyond several hundred leads, fetching full records causes UI latency and bandwidth bloat.
- **Security & Privacy:** Pulling full database rows into the browser to display high-level KPI cards violates data minimization principles by exposing buyer PII in network payloads.
- **Data Integrity:** Blending browser `localStorage` with authoritative Supabase records leads to inconsistent numbers across different admin devices.

### 7.2 Server-Side Aggregation Specification (`api/admin-quotations.js?action=kpi-summary`)
A dedicated, authenticated serverless aggregation handler must be implemented:
- **Route:** `GET /api/admin-quotations?action=kpi-summary`
- **Access Control:** Requires valid server session (`verifyServerSession(req, 'gate')`). Unauthenticated requests return `HTTP 401 SESSION_MISSING`.
- **Payload Privacy:** Returns **zero PII**. Response contains strictly numerical counts, percentages, and aggregated ISO country codes.

### 7.3 Detailed Specification of the Six Approved KPI Groups

#### Group A: COUNTRY
- **Metrics:**
  1. `volumeByCountry`: Map of `{ [isoCountry: string]: count }` representing total non-spam enquiries.
  2. `qualifiedByCountry`: Map of `{ [isoCountry: string]: count }` where qualification score $\ge 60$ or status is `QUALIFIED`.
  3. `conversionByCountry`: Percentage of enquiries that reached `QUOTATION_SENT` or `PURCHASE_ORDER` per country:
     $$\text{Country Conversion \%} = \frac{\text{Quotations Issued for Country}}{\text{Total Enquiries from Country}} \times 100$$
- **Data Handling:** Normalizes variations (e.g. "USA", "United States", "US" $\rightarrow$ `USA`). Unparseable countries categorized as `UNKNOWN`.

#### Group B: PRODUCT
- **Metrics:**
  1. `moringaEnquiries`: Total enquiries mapped to Moringa Leaf Powder.
  2. `onionEnquiries`: Total enquiries mapped to Dehydrated Red Onion Powder.
  3. `otherEnquiries`: Sourcing requests for non-core commodities.
  4. `productQualificationRate`:
     $$\text{Product Qual \%} = \frac{\text{Qualified Enquiries for Product}}{\text{Total Enquiries for Product}} \times 100$$
  5. `productQuotationRate`:
     $$\text{Product Quote \%} = \frac{\text{Quotations Generated for Product}}{\text{Total Enquiries for Product}} \times 100$$

#### Group C: STAGE
- **Metrics:**
  1. `funnelDistribution`: Exact count across canonical lifecycle stages:
     - `NEW_ENQUIRY`
     - `QUALIFIED`
     - `PROCESSOR_CHECK`
     - `QUOTATION_READY`
     - `SENT_TO_BUYER`
     - `NEGOTIATION`
     - `PURCHASE_ORDER`
     - `WON`
     - `LOST`
     - `NURTURE`
  2. `unresolvedStages`: Count of active leads requiring immediate trade coordinator action (`NEW_ENQUIRY` + `PROCESSOR_CHECK`).

#### Group D: CONVERSION
- **Mathematical Formulations:**
  1. **Enquiry-to-Qualified Rate ($C_{EQ}$):**
     $$C_{EQ} = \frac{\text{Total Leads with Qualification Score } \ge 60 \text{ or Status } = \text{'QUALIFIED'}}{\text{Total Enquiries (excluding Spam Honeypots)}} \times 100$$
     - *Numerator:* Leads evaluated as qualified.
     - *Denominator:* Total leads in `public.leads`.
  2. **Qualified-to-Quotation Rate ($C_{QQ}$):**
     $$C_{QQ} = \frac{\text{Count of Distinct Leads with at least 1 Quotation in } \mathtt{public.quotations}}{\text{Total Qualified Leads}} \times 100$$
     - *Numerator:* Qualified leads with an issued quotation.
     - *Denominator:* Total qualified leads.
  3. **Quotation-to-Order Rate ($C_{QO}$):**
     $$C_{QO} = \frac{\text{Quotations with Status } \in (\text{'PURCHASE\_ORDER'}, \text{'PO\_RECEIVED'}, \text{'WON'})}{\text{Total Quotations with Status } \in (\text{'SENT\_TO\_BUYER'}, \text{'NEGOTIATION'}, \text{'PURCHASE\_ORDER'}, \text{'WON'}, \text{'LOST'})} \times 100$$
     - *Numerator:* Quotations resulting in commercial orders.
     - *Denominator:* Total quotations delivered to buyers with definitive outcomes.

#### Group E: RESPONSE
- **Definition of Events:**
  - **Start Event ($t_0$):** `public.leads.submission_date` (or `leads.created_at`).
  - **End Event ($t_1$):** Earliest of:
    1. First activity timestamp in `public.crm_activities` with `activity_type IN ('QUOTATION_SENT', 'BUYER_CONTACTED', 'INITIAL_RESPONSE')`.
    2. Associated quotation timestamp in `public.quotations.sent_at`.
- **Calculated Metrics:**
  - $\Delta t = t_1 - t_0$ (measured in decimal hours).
  - `averageResponseHours`: Arithmetic mean ($\frac{1}{N}\sum \Delta t$).
  - `medianResponseHours`: 50th percentile of $\Delta t$ (protects metric from weekend/holiday outliers).
  - `untrackedLeadsCount`: Enquiries where no recorded contact event has occurred yet, or timestamps are missing.

#### Group F: LOST
- **Metrics:**
  1. `totalLostCount`: Enquiries with status `LOST`, `LOST_NOT_QUALIFIED`, or `DISQUALIFIED`.
  2. `lostReasonBreakdown`: Categorized by structured reason:
     - `PRICE_GAP` (Buyer budget below processor floor)
     - `SPEC_UNSUPPORTED` (Mesh / moisture outside partner capabilities)
     - `VOLUME_BELOW_MOQ` (Requirement < 100 kg)
     - `BUYER_UNRESPONSIVE` (No reply after follow-up sequence)
     - `LEAD_TIME_MISMATCH` (Buyer needed immediate spot cargo)
     - `UNKNOWN_UNSPECIFIED` (Separately classified; never lumped into other categories)
  3. `lostByProduct`: Lost counts mapped to Moringa vs. Onion.
  4. `lostByCountry`: Geographical distribution of lost enquiries.

---

## 8. INDIVIDUAL QUOTATION VALIDITY DESIGN (OWNER DECISION 1)

### 8.1 Core Principles
In accordance with Owner Decision 1 (`INDIVIDUAL_PER_QUOTATION`), the system must reject universal 14-day or 30-day fixed validity assumptions. In international agricultural commodity trade, price stability varies significantly based on harvest cycles, processor lot sizes, packaging lead times, and freight volatility. Therefore, each quotation must carry its own explicit validity terms.

### 8.2 Data Schema Specification
In `public.quotations`:
1. `valid_until DATE NOT NULL`: The exact calendar expiration date (e.g. `2026-12-05`).
2. `validity_days INTEGER NOT NULL DEFAULT 14`: The number of calendar days the quote remains valid from its issue date (`date`).
3. `validity_basis VARCHAR(100) DEFAULT 'STANDARD_PROFORMA'`: Contextual classification (e.g. `SPOT_OFFER`, `HARVEST_CONTRACT`, `SAMPLE_EVALUATION`).

### 8.3 Quotation Creation & Revision UI Controls
In `AdminQuotations.jsx`:
- The operator is provided with quick-select validity presets (`7 Days (Spot)`, `14 Days (Standard)`, `21 Days`, `30 Days (Harvest Lot)`), plus a custom date picker.
- Selecting a preset automatically calculates `valid_until = date + days`.
- Selecting a custom date automatically calculates `validity_days = valid_until - date`.
- The validity window is rendered prominently on buyer documents:
  > *"This Proforma Quotation is valid exclusively until **[DD MMMM YYYY]** (XX calendar days from issue date). Sourcing allocation and container freight space are subject to re-confirmation if advance deposit is received after this date."*

### 8.4 Dynamic Runtime Expiration Evaluation
The system must dynamically evaluate quotation expiration without requiring asynchronous cron mutations:
```javascript
export function evaluateQuotationValidity(quotation) {
  const today = new Date().toISOString().split('T')[0];
  const validUntil = quotation.validUntil || quotation.valid_until;
  const isExpired = Boolean(validUntil && today > validUntil);

  return {
    isExpired,
    validUntil,
    daysRemaining: validUntil ? Math.ceil((new Date(validUntil) - new Date(today)) / (1000 * 60 * 60 * 24)) : null,
    statusText: isExpired ? 'EXPIRED' : 'ACTIVE'
  };
}
```
**Administrative Enforcement:**
- If `isExpired === true` and the status is `READY_FOR_BUYER`, the UI displays an `EXPIRED OFFER` amber warning badge.
- Attempting to execute `send-buyer` on an expired quotation triggers a confirmation modal requiring the operator to either:
  1. Confirm dispatch of the existing terms with recorded justification, or
  2. Click "Revise Quotation" to update rates and extend the validity date.

### 8.5 Preservation of Historical Quotations
Historical quotation records created under previous packages must not be retroactively modified. If a legacy record contains a valid date string (e.g. `'12 Oct 2026'`), it remains untouched. If it lacks an ISO date, the system defaults `isExpired` to false for historical display purposes.

---

## 9. FOREIGN EXCHANGE (FX) CLAUSE REVIEW & CONTRACTUAL PROPOSALS (OWNER DECISION 2)

### 9.1 Commercial & Operational Context
AVANI AGRO FOODS coordinates sourcing from domestic Indian processors whose cost structures are denominated in Indian Rupees (INR), including raw agricultural materials, dehydration labor, NABL laboratory testing, local road transport to Nhava Sheva (JNPT), and Indian port handling.

However, export quotations to international buyers in the United States, Europe, United Kingdom, and the Middle East are issued in United States Dollars (USD) or Euros (EUR).

Between the date a quotation is issued and the date the buyer's 50% advance bank wire arrives via SWIFT, exchange-rate fluctuations can erode trade coordination margins.

### 9.2 Key Parameters for FX Clause Evaluation
1. **Benchmark Reference Source:** Reserve Bank of India (RBI) Reference Rate (published by FBIL — Financial Benchmarks India Pvt Ltd) at 1:30 PM IST.
2. **Baseline Date:** The official fixing date stated on the Proforma Invoice (typically the date of quote issue).
3. **Realization Date:** The date funds are credited to AVANI AGRO FOODS' authorized Indian bank account.

### 9.3 Detailed Evaluation of Three Contractual Formulations

#### Option A: Firm Short Validity Offer (No FX Adjustment Clause) — *Commercial Recommendation*
- **Mechanism:** The quotation carries a firm fixed price in USD without any complex floating currency formulas, but validity is restricted to 7 to 10 days.
- **Contractual Wording:**
  > *"Pricing is quoted firm in United States Dollars (USD) based on current currency exchange rates. This offer is valid exclusively for 10 calendar days. If commercial contract confirmation or advance payment is received after the validity date, AVANI AGRO FOODS reserves the right to issue a revised proforma quotation reflecting prevailing exchange and raw material rates."*
- **Commercial Assessment:**
  - *Buyer Impact:* **Zero Friction**. Overseas B2B buyers strongly prefer clean, fixed invoices without variable recalculation clauses.
  - *Risk to Avani:* **Low**. Exposure is capped to a short 10-day window.

#### Option B: Currency Fluctuation Surcharge Clause (Agreed Band Threshold)
- **Mechanism:** Rates remain fixed if exchange rate movements stay within an agreed band (e.g. $\pm 3\%$). If the INR depreciates or appreciates beyond the band prior to payment credit, pricing is adjusted proportionally.
- **Formula:**
  $$\text{Adjusted USD Rate} = \text{Base USD Rate} \times \left(1 + \frac{\text{Baseline Rate} - \text{Realization Rate}}{\text{Baseline Rate}}\right)$$
- **Proposed Contractual Language (Subject to Separate Legal Review):**
  > *"[PROPOSED CLAUSE FOR LEGAL/OWNER REVIEW]: Pricing in this Proforma Quotation is established on the basis of the Reserve Bank of India (RBI) Reference Rate of 1 USD = INR [XX.XX] on the date of quotation. In the event the official RBI reference exchange rate on the date of advance wire realization varies by more than [3.0%] from the baseline rate, AVANI AGRO FOODS reserves the right to adjust the final commercial invoice proportionately, subject to buyer written confirmation prior to cargo dispatch."*
- **Commercial Assessment:**
  - *Buyer Impact:* **Moderate Friction**. Large corporate buyers may reject open-ended adjustment clauses in their procurement purchase orders.
  - *Legal Risk:* Bilateral enforceability requires the buyer to formally countersign the proforma terms before dispatch.

#### Option C: Split Sourcing & Ocean Freight Quotation
- **Mechanism:** Separation of domestic FOB cargo value and variable international maritime container freight lines.
- **Contractual Wording:**
  > *"FOB Nhava Sheva cargo value is fixed for [XX] days. Ocean freight and bunker adjustment factors (BAF) are indicative and will be billed at actual liner rates prevailing at the time of Bill of Lading issuance."*
- **Commercial Assessment:**
  - *Buyer Impact:* **Industry Standard**. Widely accepted by global freight forwarders and international importers.

*Note: In accordance with Owner Decision 2, none of these clauses will be automatically activated in software until formal legal and owner review is completed.*

---

## 10. TARGET ARCHITECTURE SPECIFICATION

```
+----------------------------------------------------------------------------------------------------+
|                                      CLIENT APPLICATION (SPA)                                      |
|  - Contact.jsx / B2BRFQForm.jsx: Native fetch('/api/save-lead')                                    |
|  - LeadMagnet.jsx / B2BRegistration.jsx: Re-pointed to apiClient.js                                 |
|  - PrivateDashboard.jsx: Consumes /api/admin-quotations?action=kpi-summary (Zero PII)              |
+----------------------------------------------------------------------------------------------------+
                                                  |
                                    HTTPS POST/GET (JSON Payloads)
                                                  v
+----------------------------------------------------------------------------------------------------+
|                                    VERCEL SERVERLESS LAYER                                         |
|                                                                                                    |
|  [api/save-lead.js]                       [api/admin-quotations.js]                                |
|   - Input sanitization & bounds check      - Session verification ('gate' HttpOnly cookie)        |
|   - Bot honeypot filtering                 - CSRF validation on all mutating POST requests         |
|   - Quantity normalization                 - action=kpi-summary (Server-side 6-group aggregation)  |
|   - Saves Lead to Supabase                 - action=send-buyer (Idempotent Resend API dispatch)    |
|   - Saves Quote to Supabase (FK linked!)   - action=delivery-webhook (Svix HMAC verification)      |
|   - Dispatches Resend internal & buyer                                                             |
+----------------------------------------------------------------------------------------------------+
             |                                              |                         |
             v                                              v                         v
+--------------------------+                 +---------------------------+  +------------------------+
|   UPSTASH REDIS (bom1)   |                 |    SUPABASE POSTGRESQL    |  |     RESEND API v1      |
| - Distributed Rate Limit |                 |  - public.leads           |  | - Transactional Emails |
| - Session Token Store    |                 |  - public.quotations      |  | - Delivery Tracking    |
| - Webhook Lease CAS      |                 |  - public.crm_activities  |  | - Svix Webhook Signing |
|                          |                 |  - public.audit_logs      |  |                        |
+--------------------------+                 +---------------------------+  +------------------------+
```

---

## 11. DATA MODEL & API CONTRACT RECOMMENDATIONS

### 11.1 Quotation Table Contract Update
In `public.quotations` (Supabase):
```sql
-- Planned forward-only additions for Package 3F.122:
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS validity_days INTEGER DEFAULT 14;
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS validity_basis VARCHAR(100) DEFAULT 'STANDARD_PROFORMA';
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS baseline_exchange_rate NUMERIC(10, 4);
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS exchange_rate_source VARCHAR(50) DEFAULT 'RBI_REFERENCE';
```

### 11.2 KPI Summary API Contract
- **Request:** `GET /api/admin-quotations?action=kpi-summary`
- **Headers:** `Cookie: avani_gate_session=<token>`
- **Response (`HTTP 200 OK`):**
```json
{
  "success": true,
  "timestamp": "2026-11-16T18:00:00.000Z",
  "kpis": {
    "country": {
      "volumeByCountry": { "USA": 12, "GERMANY": 4, "UAE": 3, "INDIA": 1 },
      "qualifiedByCountry": { "USA": 8, "GERMANY": 3, "UAE": 2, "INDIA": 1 },
      "conversionByCountry": { "USA": 66.7, "GERMANY": 75.0, "UAE": 66.7, "INDIA": 100.0 }
    },
    "product": {
      "moringaEnquiries": 14,
      "onionEnquiries": 6,
      "otherEnquiries": 0,
      "moringaQualificationRate": 71.4,
      "onionQualificationRate": 66.7,
      "moringaQuotationRate": 100.0,
      "onionQuotationRate": 100.0
    },
    "stage": {
      "funnel": {
        "NEW_ENQUIRY": 5,
        "QUALIFIED": 9,
        "PROCESSOR_CHECK": 2,
        "READY_FOR_BUYER": 1,
        "SENT_TO_BUYER": 2,
        "NEGOTIATION": 1,
        "PURCHASE_ORDER": 0,
        "WON": 0,
        "LOST": 0,
        "NURTURE": 0
      },
      "unresolvedCount": 7
    },
    "conversion": {
      "enquiryToQualifiedPct": 70.0,
      "qualifiedToQuotationPct": 100.0,
      "quotationToOrderPct": 0.0,
      "totalEnquiriesEvaluated": 20,
      "totalQualified": 14,
      "totalQuotationsIssued": 14
    },
    "response": {
      "averageResponseHours": 4.2,
      "medianResponseHours": 3.5,
      "untrackedCount": 4,
      "trackedCount": 16
    },
    "lost": {
      "totalLost": 0,
      "reasons": {
        "PRICE_GAP": 0,
        "SPEC_UNSUPPORTED": 0,
        "VOLUME_BELOW_MOQ": 0,
        "BUYER_UNRESPONSIVE": 0,
        "LEAD_TIME_MISMATCH": 0,
        "UNKNOWN_UNSPECIFIED": 0
      },
      "byProduct": { "moringa": 0, "onion": 0 },
      "byCountry": {}
    }
  }
}
```

---

## 12. SECURITY & PRIVACY CONTROLS

1. **Authentication Boundary:**
   - The KPI summary endpoint is guarded by `verifyServerSession(req, 'gate')`.
   - Any request lacking an authentic, unexpired, and unrevoked session cookie in Upstash KV is rejected immediately with `HTTP 401 SESSION_MISSING`.
2. **Data Minimization (Zero PII):**
   - The KPI aggregation engine executes server-side SQL/PostgREST counts and averages.
   - Individual buyer names, contact numbers, email addresses, and specific commercial contract terms are **strictly excluded** from the response payload.
3. **Audit Trail Immutability:**
   - Any manual status transition or quotation revision continues to be logged to `public.audit_logs` with verified operator attribution derived from the session token.
4. **Rate Limiting:**
   - The aggregation endpoint is rate-limited to 60 requests per 15-minute window per IP to prevent administrative denial-of-service.

---

## 13. FAILURE, RETRY AND RECOVERY SCENARIOS

1. **Database Outage During Lead Submission:**
   - If Supabase PostgreSQL is unreachable during `save-lead.js`, the function fails closed with `HTTP 500`.
   - The deduplication cache key is evicted to allow immediate buyer retry.
   - A descriptive error message surfaces in the UI providing Sachin Shinde's direct WhatsApp and phone contact for offline handling.
2. **Email Provider Outage During RFQ:**
   - If Resend API returns an error or times out during `save-lead.js`, the lead record remains **safely committed** to Supabase.
   - The response status informs the client that the enquiry was preserved, while flagging email alert delivery as deferred.
3. **Quotation Delivery Webhook Retries:**
   - In-flight webhooks receive `HTTP 429` with `Retry-After: 15`.
   - Transient database update failures return `HTTP 503`, prompting Resend's automated exponential retry mechanism.
   - Succeeded webhooks execute atomic Lua CAS leases in Upstash Redis, guaranteeing exactly-once status attribution.

---

## 14. HISTORICAL DATA PRESERVATION STRATEGY

1. **Non-Destructive Relational Linkage:**
   - Correcting DEF-120-01 applies only to new quotation insertions and explicit updates.
   - Existing historical quotations in `public.quotations` with `inquiry_id = NULL` will be mapped via a safe, optional, forward-only reconciliation query matching on `buyer_email` and `created_at` timestamp proximity.
2. **Schema Compatibility:**
   - All proposed column additions (`validity_days`, `validity_basis`, etc.) utilize `ADD COLUMN IF NOT EXISTS` with backward-compatible default values.
   - Zero historical rows will be dropped, altered, or overwritten.

---

## 15. REMEDIATION SEQUENCE AND DEPENDENCIES (FOR FUTURE PACKAGE 3F.122)

```
[Phase 1: Database Linkage (DEF-120-01)]
  │ 1. Update api/_lib/supabaseClient.js to remove '!rawInquiryId.startsWith()' check.
  │ 2. Add 'isLeadAssociated: true' flag in api/save-lead.js.
  │ 3. Execute unit tests verifying quotations.inquiry_id matches leads.inquiry_id.
  v
[Phase 2: Quotation Validity & Controls (Owner Decision 1)]
  │ 1. Add validity_days and validity_basis columns to public.quotations schema.
  │ 2. Update AdminQuotations.jsx with dynamic validity presets and custom date picker.
  │ 3. Add evaluateQuotationValidity runtime expiration check in quotationModel.js.
  v
[Phase 3: Server-Side KPI Aggregation (DEF-120-03 & Owner Decision 4)]
  │ 1. Implement 'action=kpi-summary' in api/admin-quotations.js covering 6 KPI groups.
  │ 2. Build lightweight visual KPI cards in PrivateDashboard.jsx.
  │ 3. Remove client-side in-memory aggregation of raw records.
  v
[Phase 4: Client Email Clean-Up (DEF-120-02 & Owner Decision 3)]
  │ 1. Create src/lib/apiClient.js with clean fetch methods.
  │ 2. Update LeadMagnet.jsx and B2BRegistration.jsx imports.
  │ 3. Safely deprecate src/lib/emailjs.js and uninstall @emailjs/browser.
```

---

## 16. ACCEPTANCE CRITERIA FOR FUTURE VERIFICATION

1. **AC-121-01 (Quotation Linkage):** When a new lead is submitted through `/api/save-lead`, both `public.leads` and `public.quotations` must contain matching records where `quotations.inquiry_id == leads.inquiry_id`.
2. **AC-121-02 (Standalone Quotations):** When an admin creates a custom quote without an inquiry, `quotations.inquiry_id` must be stored as `NULL` without throwing Foreign Key Violation `23503`.
3. **AC-121-03 (Quotation Validity):** Every quotation created in `AdminQuotations.jsx` must carry an explicit `valid_until` date and `validity_days` integer; expired quotes must display an amber warning badge.
4. **AC-121-04 (KPI Endpoint Security):** Calling `/api/admin-quotations?action=kpi-summary` without an active session cookie must return `HTTP 401 SESSION_MISSING`.
5. **AC-121-05 (KPI Aggregation Correctness):** The KPI summary response must return non-null, mathematically consistent values across all six KPI groups with zero buyer PII.
6. **AC-121-06 (Email Provider Hygiene):** Submitting an RFQ on `/contact` must trigger server-side Resend dispatch without executing client-side EmailJS calls.

---

## 17. FUTURE VERIFICATION AND TEST PLAN

1. **Automated Unit Testing (`test_package_3f_122.mjs`):**
   - Test lead submission with automatic inquiry-to-quotation foreign key validation.
   - Test standalone quotation creation confirming `inquiry_id = null`.
   - Test quotation validity evaluation with simulated past, present, and future dates.
   - Test KPI summary math (numerators, denominators, percentage caps).
2. **Security & Session Boundary Testing:**
   - Probe `/api/admin-quotations?action=kpi-summary` with spoofed cookies, invalid tokens, and cross-origin headers to confirm fail-closed behavior.
3. **Regression Testing:**
   - Execute complete existing regression suites (Project A: 97/97 tests, Project B: 151/151 tests) to ensure zero regressions in rate limiting or webhook idempotency.

---

## 18. UNRESOLVED QUESTIONS & OWNER DECISIONS STILL REQUIRED

1. **Historical Quotation Reconciliation:**
   - Does the owner wish to execute a one-time database update to link existing unlinked quotations to historical leads where buyer emails match, or leave existing historical rows untouched?
2. **FX Clause Legal Review:**
   - Which of the three proposed FX contractual formulations (Firm Short Validity, Surcharge Band, or Split Sourcing) is preferred for formal legal counsel review?
3. **Response Time SLA Target:**
   - What is the operational target SLA for first response time (e.g. 4 hours, 12 hours, 24 hours) for color-coding the response time KPI widget?

---

## 19. RISKS AND IMPLEMENTATION PREREQUISITES

- **Outreach Safety:** Governance outreach locks (`GLOBAL_OUTREACH_STOP=1`, `OUTREACH_AUTHORIZED=0`, `PILOT_AUTHORIZED=0`) must remain strictly enforced during all future work.
- **Dependency Isolation:** Removing `@emailjs/browser` must only occur after confirming that all frontend forms (`LeadMagnet.jsx`, `B2BRegistration.jsx`, `Contact.jsx`) have been migrated to native API client wrappers.
- **Database Backup:** A read-only snapshot or export of `public.leads` and `public.quotations` must be verified prior to executing any foreign-key reconciliation.

---

## 20. FINAL READINESS CLASSIFICATION

### Classification: **`SPECIFICATION_READY`**

This specification completely reconciles all five Owner Decisions, identifies the exact root causes and line references for findings DEF-120-01, DEF-120-02, and DEF-120-03, and establishes a safe, non-destructive, phased implementation plan for future Package 3F.122.

*Governance locks remain 100% active. Zero application files, databases, credentials, or deployments were modified.*
