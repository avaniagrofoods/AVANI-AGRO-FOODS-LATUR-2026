# PACKAGE 3F.120 — AVANI AGRO FOODS BUSINESS OPERATIONS READINESS & CUSTOMER ENQUIRY WORKFLOW INDEPENDENT AUDIT

**AUDIT REFERENCE:** `AAF-AUD-3F-120`  
**PROJECT:** AVANI AGRO FOODS WEBSITE ENGINE (`2-AVANI AGRO FOODS LATUR 2026` — PROJECT A ONLY)  
**AUDIT DATE:** 16 November 2026  
**MODE:** STRICT READ-ONLY INDEPENDENT AUDIT  
**GOVERNANCE LOCKS (ACTIVE & MANDATORY):**
- `GLOBAL_OUTREACH_STOP=1`
- `OUTREACH_AUTHORIZED=0`
- `PILOT_AUTHORIZED=0`

---

## 1. EXECUTIVE SUMMARY

An independent adversarial business systems, operations readiness, and customer enquiry workflow audit was executed on Project A.

The objective was to determine whether the existing website, APIs, database, and admin systems can reliably capture, validate, store, qualify, manage, and track B2B buyer enquiries through the quotation workflow, while maintaining transparent business positioning.

### High-Level Audit Findings:
1. **Transparent Sourcing Positioning:** **PASS**. Across all core pages (`Home.jsx`, `MoringaLanding.jsx`, `RedOnionLanding.jsx`, `TradeCoordination.jsx`, `Contact.jsx`), AVANI AGRO FOODS is consistently and prominently positioned as an independent agricultural trade coordinator and sourcing specialist that matches international buyer requirements with vetted processing partners in Maharashtra. There are zero false claims of factory or mill ownership.
2. **Lead Capture & Anti-Spam Hardening:** **PASS**. Unified lead capture (`api/save-lead.js`) enforces rigorous input sanitization, field bounds, automatic quantity normalization (e.g. 18 MT -> 18,000 kg), hidden honeypots for bot trapping, and distributed rate limiting.
3. **Database & Data Integrity:** **PASS WITH LIMITATION**. Lead and quotation records persist durably to Supabase PostgreSQL (`public.leads`, `public.quotations`) with strict Row-Level Security. However, an architectural defect in `api/_lib/supabaseClient.js` was uncovered where valid inquiry foreign keys starting with `AAF-INQ-2026-` are inadvertently set to `NULL` on initial quotation creation.
4. **Admin Security & Access Controls:** **PASS**. Administrative endpoints (`/api/verify-gate`, `/api/admin-quotations`) enforce distributed rate limiting, server-side session cookies in Upstash KV, CSRF token validation, exact Origin verification, and Svix HMAC signature checking on incoming webhooks.
5. **Enquiry-to-Quotation Workflow:** **PASS**. The quotation engine (`api/_lib/quotationEngine.js` and `src/data/quotationModel.js`) accurately calculates commercial quotations, item totals, freight/insurance lines, standardized Incoterms, and payment terms, backed by a processor confirmation checklist and admin override audit trail.
6. **Management Analytics:** **PARTIALLY_READY**. Pipeline metrics and lead lists exist in `PrivateDashboard.jsx`, but aggregate country-wise breakdown, product distribution share, and conversion funnel analytics are not yet aggregated into dedicated visual KPI widgets.

### Final Readiness Classification:
**`READY_WITH_LIMITATIONS`**

---

## 2. CURRENT ARCHITECTURE OVERVIEW

```
+--------------------------------------------------------------------------------------------------+
|                                    B2B BUYER / WEB VISITOR                                       |
+--------------------------------------------------------------------------------------------------+
                               |                                      |
                 [Web Enquiries / RFQ Form]               [Direct WhatsApp / Phone]
                               v                                      v
+-----------------------------------------------------+  +-----------------------------------------+
|                  Vercel Serverless                  |  |  Trade Coordinator: Sachin Shinde       |
|                 (api/save-lead.js)                  |  |  WhatsApp: +91 7219053645               |
+-----------------------------------------------------+  +-----------------------------------------+
       |                           |                     |  sales@avaniagrofoods.com               |
       v                           v                     +-----------------------------------------+
[Upstash Redis (bom1)]   [PostgreSQL (Supabase)]
 - Distributed Rate Limiting   - public.leads (20 rows)
 - Session Revocation Token    - public.quotations
 - Webhook Idempotency Lease   - public.crm_activities
                               - public.audit_logs
                                   |
                                   v
+--------------------------------------------------------------------------------------------------+
|                     AUTHENTICATED ADMIN WORKSPACE (PrivateDashboard & AdminQuotations)          |
|  - Lead Qualification Scoring (0-100)        - Processor Verification Checklist                 |
|  - Quotation Builder & PDF/DOCX Export       - Buyer Ready Gate & Resend Email Dispatch         |
+--------------------------------------------------------------------------------------------------+
```

---

## 3. AUDIT WORKSTREAM 1 — WEBSITE CONVERSION & BRAND POSITIONING

| Area / Page | File Reference | Verification Evidence | Finding |
| :--- | :--- | :--- | :--- |
| **Homepage** | [src/pages/Home.jsx](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/src/pages/Home.jsx#L14-L105) | Explicitly defines business model as "B2B Sourcing / Indian Export Coordination". FAQ: *"AVANI AGRO FOODS operates as an Indian agricultural export coordination and B2B merchant sourcing specialist... We partner directly with vetted agricultural processors and dehydrators in Maharashtra and South India."* | **PASS** |
| **Moringa Powder** | [src/pages/MoringaLanding.jsx](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/src/pages/MoringaLanding.jsx#L25-L35) | FAQ explicitly asks: *"Does AVANI AGRO FOODS own manufacturing factories or farming estates? No... We do not make false claims of factory ownership."* Features Tier 2 Partner Facility compliance section. | **PASS** |
| **Red Onion Powder** | [src/pages/RedOnionLanding.jsx](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/src/pages/RedOnionLanding.jsx#L25-L35) | Explicitly clarifies sourcing coordination from audited dehydration facilities in Nashik, Pune, and Latur belts. Zero claims of plant ownership. | **PASS** |
| **Contact Page** | [src/pages/Contact.jsx](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/src/pages/Contact.jsx#L400-L465) | Lists official email `sales@avaniagrofoods.com`, WhatsApp `+91 7219053645`, Latur office address, and transparent trade coordination timeline notes. | **PASS** |
| **Enquiry Forms** | [src/components/B2BRFQForm.jsx](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/src/components/B2BRFQForm.jsx#L465-L530) | Full parameters capture: product, quantity, mesh size, moisture, packaging, Incoterm, destination port, target price, timeline. | **PASS** |
| **Mobile Navigation** | [src/components/Navbar.jsx](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/src/components/Navbar.jsx#L1-L150) | Responsive mobile drawer, tap targets >= 44px, links to products, export process, trade coordination, and contact form. | **PASS** |
| **WhatsApp Links** | [src/components/WhatsAppBubble.jsx](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO FOODS LATUR 2026/src/components/WhatsAppBubble.jsx#L1-L85) | Encodes pre-filled buyer message directly targeting `+91 7219053645` (Sachin Shinde). | **PASS** |
| **CTA Destinations** | Various pages | All "Request Quotation" and "Get Pricing" buttons route to `/contact#rfq` or trigger modal RFQ forms. Zero broken anchors detected. | **PASS** |

---

## 4. AUDIT WORKSTREAM 2 — LEAD CAPTURE ENGINE

| Verification Check | Implementation Reference | Audit Observation | Finding |
| :--- | :--- | :--- | :--- |
| **Field Validation** | `api/save-lead.js:128-144` | Bounds enforced: Name (2–150 chars), Email (regex + max 150), Phone (6–50 chars if provided), Company (max 150 chars), Requirement text (max 5000 chars). | **PASS** |
| **Required Fields** | `api/save-lead.js:129-134` | Rejects payload with HTTP 400 if name or valid email is omitted. | **PASS** |
| **Email & Phone Validation** | `api/save-lead.js:132-137` | Rejects malformed emails missing `@` or `.`; validates international phone length bounds. | **PASS** |
| **Quantity & Unit Parsing** | `api/_lib/quotationEngine.js: parseQuantityKg` | Converts free-form inputs (e.g. `"18 MT"`, `"500 kg"`, `"1 FCL"`) into normalized numeric KG for accurate quoting. | **PASS** |
| **Country & Application Capture** | `api/save-lead.js:107, 114` | Captures destination country, destination port, and intended application (e.g. food manufacturing, seasoning). | **PASS** |
| **Duplicate Prevention** | `api/save-lead.js:145-155` | 60-second in-memory dedup sliding cache by `${email}_${product}_${quantity}` prevents rapid double-clicks. | **PASS** |
| **Spam & Bot Protection** | `api/save-lead.js:92-99` | Invisible honeypot fields (`honeypot`, `honeypot_company_url`). Bot submissions are silently trapped with HTTP 200 without database insertion. | **PASS** |
| **Error & Retry Handling** | `api/save-lead.js:336-345` | Fails closed: if primary Supabase persistence fails, returns HTTP 500 with descriptive error and WhatsApp direct contact fallback. | **PASS** |
| **User Confirmation** | `src/pages/Contact.jsx:450-465` | Displays permanent reference IDs (`AAF-INQ-2026-XXXXXX` and `AAF-Q-2026-XXXX`) with direct WhatsApp follow-up button. | **PASS** |

---

## 5. AUDIT WORKSTREAM 3 — DATABASE AND DATA INTEGRITY

| Database Check | Schema / Code Reference | Audit Findings | Finding |
| :--- | :--- | :--- | :--- |
| **Lead Record Schema** | `supabase/migrations/20261103_init_b2b_leads.sql` | 30+ structured columns: `inquiry_id`, `buyer_name`, `company_name`, `email`, `phone`, `country`, `product`, `quantity_normalized_kg`, `incoterm`, `destination_port`, `status`. | **PASS** |
| **Quotation Schema** | `supabase/migrations/20261110_quotations_table.sql` | 28 columns: `quotation_id`, `inquiry_id`, `date`, `valid_until`, `buyer_name`, `items` (JSONB), `grand_total`, `status`, `delivery_status`, `provider_message_id`. | **PASS** |
| **Row Level Security (RLS)** | `20261110_quotations_table.sql:66-90` | Public / anonymous read and write access explicitly DENIED (`USING (false)`). Service role granted full access. Zero client credential leakage. | **PASS** |
| **Server-Side PostgREST Access** | `api/_lib/supabaseClient.js:40-60` | HTTP fetch via PostgREST with exponential retry, Bearer token auth, and `Prefer: return=representation`. | **PASS** |
| **Audit Trail & Logging** | `api/_lib/supabaseClient.js:175-193` | Automatically logs `LEAD_CREATED` to `public.audit_logs` and records initial activity in `public.crm_activities`. | **PASS** |
| **Foreign Key Lead-Quotation Link** | `api/_lib/supabaseClient.js:237-240` | **DEFECT DETECTED**: Code sets `safeInquiryId = (rawInquiryId && !rawInquiryId.startsWith('AAF-INQ-2026-')) ? rawInquiryId : null`. Consequently, valid leads generated by `save-lead.js` with standard prefix `AAF-INQ-2026-` have their quotation `inquiry_id` set to `NULL` upon creation. | **FAIL** (Defect DEF-120-01) |

---

## 6. AUDIT WORKSTREAM 4 — ADMIN SECURITY & ACCESS CONTROLS

| Security Control | Code Reference | Implementation Details | Finding |
| :--- | :--- | :--- | :--- |
| **Authentication Gate** | `api/verify-gate.js:106-155` | Resolves canonical `MASTER_GATE_PASSWORD`. Compares via constant-time hash verification. Master Bearer bypasses removed. | **PASS** |
| **Session Issuance & KV Storage** | `api/_lib/auth.js: createServerSession` | Issues 256-bit cryptographically secure session ID, stored in Upstash KV with 14-day TTL. Sets HttpOnly, Secure, SameSite=Strict cookie. | **PASS** |
| **Session Revocation (Logout)** | `api/verify-gate.js:77-104` | Atomically deletes session key from KV and clears client cookies with max-age=0. | **PASS** |
| **Admin Route Protection** | `api/admin-quotations.js:160-230` | Validates session via `verifyServerSession(req, 'gate')`. Rejects unauthorized requests with HTTP 401. | **PASS** |
| **CSRF Protection** | `api/_lib/auth.js: verifyCsrfRequest` | Enforces double-submit CSRF cookie token on all mutating POST requests. | **PASS** |
| **CORS & Origin Validation** | `api/_lib/auth.js: isAllowedOrigin` | Strict allowlist: `https://www.avaniagrofoods.com`, `https://avaniagrofoods.com`, Vercel preview domains, and localhost development. Rejects untrusted origins with HTTP 403. | **PASS** |
| **Distributed Rate Limiting** | `api/_lib/auth.js: checkRateLimit` | Enforces atomic Lua token-bucket rate limits on `gate` login (5 attempts / 15 min) and `lead_submission` via Upstash Redis. Fails closed with 503 on KV outage. | **PASS** |
| **Webhook Signature Validation** | `api/admin-quotations.js:235-310` | Delivery webhooks require Svix HMAC-SHA256 signature and timestamp tolerance check against raw incoming bytes. | **PASS** |

---

## 7. AUDIT WORKSTREAM 5 — EMAIL AND NOTIFICATIONS WORKFLOW

| Notification Component | Implementation Reference | Audit Observation | Finding |
| :--- | :--- | :--- | :--- |
| **Transactional Email Provider** | `api/save-lead.js:364-402` | Integrates Resend API (`api.resend.com/emails`) using authenticated Bearer token and timeout controller. | **PASS** |
| **Internal Sales Alert** | `api/save-lead.js:409-445` | Dispatches detailed HTML notification to `sales@avaniagrofoods.com` with complete buyer profile, product specifications, indicative pricing, and UTM attribution. | **PASS** |
| **Buyer Confirmation Email** | `api/save-lead.js:448-471` | Dispatches professional acknowledgement from `sales@avaniagrofoods.com` with reference IDs and WhatsApp contact options. | **PASS** |
| **Delivery Webhook Tracking** | `api/admin-quotations.js:315-465` | Receives Resend webhook events (`email.delivered`, `email.bounced`, `email.complained`), matches `provider_message_id`, and updates database delivery timestamps. | **PASS** |
| **Dual Dispatch Conflict** | `src/pages/Contact.jsx:250-265` | **LIMITATION DETECTED**: `Contact.jsx` triggers client-side EmailJS after `save-lead.js` already dispatched transactional emails via Resend, risking duplicate buyer emails or confusing delivery logs. | **FAIL** (Defect DEF-120-02) |
| **Webhook Mutual Exclusion** | `api/_lib/quotationModel.js: completeQuotationWebhookDistributed` | Atomic Lua lease claim prevents concurrent race conditions across serverless instances; duplicate replays return `HTTP 400 DUPLICATE_WEBHOOK_EVENT`. | **PASS** |

---

## 8. AUDIT WORKSTREAM 6 — LEAD MANAGEMENT & LIFECYCLE STAGES

The audit evaluated support for the 15 canonical commercial export stages:

| Stage # | Stage Name | System Support Status | Implementation Evidence |
| :---: | :--- | :---: | :--- |
| 1 | **NEW** | **IMPLEMENTED** | Captured as `NEW_ENQUIRY` in `public.leads` and `NEW` in `PrivateDashboard.jsx`. |
| 2 | **RESEARCH** | **PARTIALLY_IMPLEMENTED** | Supported as `RESEARCHING` in `Importers.jsx` and `RESEARCHED` in `ecosystemIntegration.js:17`. No automated enrichment script in Project A. |
| 3 | **CONTACTED** | **IMPLEMENTED** | Supported in `ecosystemIntegration.js:19` and tracked upon email dispatch. |
| 4 | **CONNECTED** | **IMPLEMENTED** | Supported in `ecosystemIntegration.js:20` and buyer reply detection (`replyDetector.js`). |
| 5 | **QUALIFIED** | **IMPLEMENTED** | Automated scoring >= 60 in `qualificationModel.js`; filterable in `PrivateDashboard.jsx:791`. |
| 6 | **REQUIREMENT_RECEIVED** | **IMPLEMENTED** | Captured in `public.leads.buyer_message` and `ecosystemIntegration.js:22`. |
| 7 | **SAMPLE_REQUESTED** | **IMPLEMENTED** | Supported in `AdminQuotations.jsx:57` (`SAMPLE_REQUESTED`) and `ecosystemIntegration.js:23` (`SAMPLE_DISCUSSION`). |
| 8 | **SUPPLIER_VERIFICATION** | **IMPLEMENTED** | Implemented as `PROCESSOR_CHECK` and `updateProcessorConfirmation` in `quotationModel.js`. |
| 9 | **QUOTATION_PREPARATION** | **IMPLEMENTED** | Implemented as `DRAFT` in `quotationEngine.js` and `QUOTATION_PREPARATION` in `AdminQuotations.jsx:54`. |
| 10 | **QUOTATION_SENT** | **IMPLEMENTED** | Implemented as `SENT_TO_BUYER` in `supabaseClient.js` and `quotationModel.js:854`. |
| 11 | **NEGOTIATION** | **IMPLEMENTED** | Modal in `AdminQuotations.jsx:130` captures counter-offers, requested price, and notes; status `NEGOTIATION`. |
| 12 | **PURCHASE_ORDER** | **IMPLEMENTED** | Tracked via `record-po` action in `admin-quotations.js:935` and `PO_RECEIVED` status. |
| 13 | **WON** | **IMPLEMENTED** | Represented by `PURCHASE_ORDER` completion and `REPEAT_BUSINESS` transition. |
| 14 | **LOST** | **IMPLEMENTED** | Implemented as `LOST_NOT_QUALIFIED` in `AdminQuotations.jsx:60` and `LOST` in `qualificationModel.js:17`. |
| 15 | **NURTURE** | **IMPLEMENTED** | Implemented in `qualificationModel.js:15` and filterable in `PrivateDashboard.jsx`. |

*Verdict:* 14 of 15 stages are natively supported in state machines and database columns. 1 stage (`RESEARCH`) is primarily operated in Project B.

---

## 9. AUDIT WORKSTREAM 7 — BUYER QUALIFICATION ENGINE

| Qualification Metric | Engine Rule (`qualificationModel.js`) | Audit Findings |
| :--- | :--- | :--- |
| **Buyer / Company Identity** | 10 pts max | Verifies name and company string length >= 2 chars. |
| **Email Verification** | 10 pts max | Validates RFC compliant business email regex. |
| **Destination Country** | 5 pts max | Identifies export destination; checks against approved target markets. |
| **Buyer Persona Classification** | 5 pts max | Normalizes into 12 canonical buyer types (Importer, Food Manufacturer, Seasoning Manufacturer, etc.). |
| **Commercial Volume** | 20 pts max | Evaluates volume against container thresholds (Full Container Load >= 8 MT: 20 pts, Trial LCL >= 500 kg: 15 pts, Sample < 100 kg: 5 pts). |
| **Logistics & Incoterms** | 15 pts max | Grants full points if specific Incoterm (FOB/CIF) and target seaport are specified. |
| **Technical Specifications** | 15 pts max | Evaluates mesh size, moisture limits, and microbiological criteria against product masters. |
| **Processor Matching** | 20 pts max | Evaluates whether current partner facilities can fulfill volume, lead time, and specifications. |
| **Overall Scoring Formula** | $\text{Score} = \sum \text{Points}$ (0–100) | $\ge 60 \rightarrow \text{QUALIFIED}$, $35\text{--}59 \rightarrow \text{NEEDS\_INFORMATION}$, $< 35 \rightarrow \text{DISQUALIFIED}$. |

---

## 10. AUDIT WORKSTREAM 8 — SUPPLIER COORDINATION & PROCESSOR MATCHING

| Coordination Step | System Capability | Evidence & Audit Findings | Finding |
| :--- | :--- | :--- | :--- |
| **Partner Identification** | Internal Partner ID | Partner name, location, FSSAI, and APEDA are stored under `processorConfirmation.partner` with `internalOnly: true` (shielded from buyer-facing documents). | **PASS** |
| **Supplier Verification** | Verification Checklist | Verifies FSSAI license, dehydration machinery, grinding infrastructure, and hygiene standards. | **PASS** |
| **Specification Confirmation** | Parameter Match Guard | Three-way match comparing Buyer Requested vs Processor Confirmed for Mesh, Moisture, and Packaging. | **PASS** |
| **MOQ & Capacity Confirmation** | Volume Feasibility | Processor confirms batch availability and maximum dispatch volume. | **PASS** |
| **COA Collection** | Quality Documents | Records whether batch NABL lab test report (COA) is available from partner unit. | **PASS** |
| **Sample Coordination** | Sample Availability | Records whether physical sample courier is supported from active batch lot. | **PASS** |
| **Admin Override** | Audit-Controlled Override | If processor verification cannot be completed immediately, an authenticated operator can execute an override with recorded reason and timestamp. | **PASS** |
| **Direct Supplier Portal** | Web UI for Processors | **LIMITATION DETECTED**: Processor checks are performed manually by the trade coordinator and entered into admin UI; there is no self-service portal for processing partners. | **NOT_APPLICABLE** (Designed as merchant model) |

---

## 11. AUDIT WORKSTREAM 9 — QUOTATION MANAGEMENT & RISK REVIEW

| Element | Specification | Audit Evaluation |
| :--- | :--- | :--- |
| **Quotation Numbering** | `AAF-Q-2026-XXXX` | Sequential/randomized 4-digit suffix generated at enquiry time. |
| **Pricing Validation** | Multi-Line Calculation | Calculates Subtotal, Freight, Insurance, Documentation, and Grand Total with 2-decimal precision. |
| **Product Specifications** | Botanical & Dehydrated Specs | Accurately defaults to Product Master standards (e.g. 80–100 Mesh, $\le 7\%$ moisture for Moringa; 60–80 Mesh, $\le 6\%$ moisture for Onion). |
| **Validity Tracking** | Fixed Validity Date | Defaults to 30-day window (`validUntil`). |
| **Revision History** | Multi-Revision Support | `reviseQuotation` preserves revision history, previous quote IDs, and revision notes. |
| **Document Integrity** | SHA256 Hashing | `compute-document-hash` computes cryptographic hash across all commercial terms to detect document tampering. |
| **Financial Risk 1 (FX Volatility)** | USD Quotation vs INR Sourcing | **RISK**: Export quotations issued in USD while sourcing partner procurement is in INR. Currency fluctuations between quotation date and payment receipt create margin volatility. |
| **Financial Risk 2 (Price Shelf-Life)** | 30-Day Fixed Quote | **RISK**: Raw agricultural prices (fresh onion and moringa crop) fluctuate seasonally. 30-day fixed quotes risk processor price increases before advance deposit arrives. |

---

## 12. AUDIT WORKSTREAM 10 — MANAGEMENT REPORTING & METRICS

| Management Metric | Current Implementation Status | Where Available | Recommended Enhancement |
| :--- | :---: | :--- | :--- |
| **Total Enquiries** | **AVAILABLE** | `PrivateDashboard.jsx` (Total Leads counter) | Add daily / weekly velocity trend card |
| **Qualified Enquiries** | **AVAILABLE** | `PrivateDashboard.jsx` (Qualified tab filter) | Display qualification % KPI card |
| **Country-Wise Leads** | **PARTIAL** | Mapped on individual lead cards | Add aggregated country distribution bar chart |
| **Product-Wise Enquiries** | **PARTIAL** | Mapped on individual lead cards | Add Moringa vs Onion enquiry share breakdown |
| **Lead Source Attribution** | **PARTIAL** | Captured in DB column `source`, `utm_source` | Add source conversion report (Organic vs Direct vs Campaign) |
| **Response Time (SLA)** | **PARTIAL** | DB stores `created_at` and `sent_at` | Add average time-to-quote metric widget |
| **Sample Requests** | **AVAILABLE** | Filterable via `SAMPLE_REQUESTED` pipeline | Add active sample courier tracking panel |
| **Quotations Issued** | **AVAILABLE** | `PrivateDashboard.jsx` (Quotation tab & status counts)| Display total pipeline value in USD & INR |
| **Conversion Rate** | **PROPOSED** | Funnel data exists; no percentage calculation | Build automated conversion rate dashboard |
| **Lost Opportunities** | **AVAILABLE** | Filterable via `LOST_NOT_QUALIFIED` | Add loss reason breakdown categorization |
| **Repeat Buyers** | **PROPOSED** | Tracked via `REPEAT_BUSINESS` stage | Add customer lifetime value (LTV) view |

---

## 13. DEFECT REGISTER

| Defect ID | Severity | File Reference | Description | Operational Impact | Recommended Action |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **DEF-120-01** | **MEDIUM** | `api/_lib/supabaseClient.js:238-240` | `safeInquiryId` logic checks `!rawInquiryId.startsWith('AAF-INQ-2026-')`. When a genuine lead is created with `AAF-INQ-2026-XXXXXX`, this check fails and sets `inquiry_id = null` on the quotation row. | Quotations created alongside new leads lose their relational link to the lead in Supabase. | Update condition to verify genuine lead ID format or lookup lead existence before setting to NULL. |
| **DEF-120-02** | **LOW** | `src/pages/Contact.jsx:250-265` | `Contact.jsx` triggers EmailJS from browser after server-side `save-lead.js` already dispatches transactional notifications via Resend. | Potential dual email dispatch and client-side credential exposure in browser network inspector. | Deprecate client-side EmailJS call; rely solely on authoritative server-side Resend dispatch. |
| **DEF-120-03** | **LOW** | `src/pages/PrivateDashboard.jsx:130-170` | Pipeline metrics are computed client-side by fetching all rows into memory without server-side aggregation. | Slower dashboard load time once lead volume exceeds several hundred records. | Create a dedicated `/api/leads-summary` aggregation endpoint using PostgREST `select=count`. |

---

## 14. RISK CLASSIFICATION

- **Positioning / Compliance Risk:** **NEGLIGIBLE (PASS)**. Transparent trade coordination model is thoroughly and uniformly communicated across all web assets.
- **Security / Authorization Risk:** **LOW (PASS)**. Rate limiting, origin restrictions, session verification, and CSRF protection are actively enforced.
- **Data Integrity Risk:** **MEDIUM**. Quotation-to-lead foreign key decoupling (DEF-120-01) requires corrective normalization to ensure relational integrity.
- **Financial / Commercial Risk:** **MEDIUM**. 30-day USD quotation validity without currency escalation clauses creates margin exposure during periods of high agricultural price volatility.

---

## 15. EXACT AFFECTED FILE REFERENCES

1. [src/pages/Home.jsx](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/src/pages/Home.jsx) — Brand positioning, export workflow, CTAs.
2. [src/pages/MoringaLanding.jsx](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/src/pages/MoringaLanding.jsx) — Moringa product specifications, processor partner compliance.
3. [src/pages/RedOnionLanding.jsx](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/src/pages/RedOnionLanding.jsx) — Red onion product specifications, dehydrator partner compliance.
4. [src/pages/Contact.jsx](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/src/pages/Contact.jsx) — B2B RFQ form, lead submission handler.
5. [src/pages/PrivateDashboard.jsx](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/src/pages/PrivateDashboard.jsx) — Admin lead and quotation management dashboard.
6. [src/pages/AdminQuotations.jsx](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/src/pages/AdminQuotations.jsx) — Administrative quotation builder, processor checks, negotiations.
7. [api/save-lead.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/save-lead.js) — Unified lead capture, validation, deduplication, Resend dispatch.
8. [api/admin-quotations.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/admin-quotations.js) — Quotation management API, processor checks, delivery webhook.
9. [api/_lib/supabaseClient.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/_lib/supabaseClient.js) — PostgREST persistence, `saveLeadToSupabase`, `saveQuotationToSupabase`.
10. [src/data/qualificationModel.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/src/data/qualificationModel.js) — 100-point qualification scoring engine.
11. [src/data/quotationModel.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/src/data/quotationModel.js) — Quotation state machine, processor confirmation checklist, revision history.

---

## 16. EVIDENCE AND VERIFICATION METHOD

- **Codebase AST & Content Inspection:** Full textual and structural search across all React components, serverless API handlers, database migration scripts, and utility models.
- **Runtime API Probes (Reconciled from 3F.118A/119):** Verified 10 live HTTP endpoints on production deployment `dpl_95oVzbZiuaT7rVJcKhr9xekpXCqY`.
- **Direct Wire Database Inspection:** Read-only PostgreSQL verification of `public.leads` and `public.quotations` schemas, constraints, and record counts.
- **Distributed State Verification:** Evaluated Upstash Redis REST Lua script execution, TTL handling, and mutual exclusion lease fencing.

---

## 17. CORRECTIVE IMPLEMENTATION RECOMMENDATIONS (PROPOSED PACKAGE 3F.121)

1. **Resolve Quotation FK Linkage (DEF-120-01):**
   - Correct `supabaseClient.js:239` so that valid leads created by `save-lead.js` retain their foreign key `inquiry_id` link in `public.quotations`.
2. **Consolidate Email Dispatch (DEF-120-02):**
   - Remove redundant client-side `EmailJS` invocation in `Contact.jsx`; standardize exclusively on authoritative server-side `Resend API` dispatch in `save-lead.js`.
3. **Add Currency & Validity Hedging Clauses:**
   - Add standard commercial export terms to proforma quotations: *"Prices subject to currency fluctuation exceeding $\pm 2\%$ and raw material price stability prior to receipt of advance payment."*
4. **Implement Management Analytics Dashboard Widget:**
   - Build a lightweight summary card in `PrivateDashboard.jsx` aggregating Country Distribution, Product Split, Average Response Time, and Pipeline Conversion Rate.

---

## 18. TEST ACCEPTANCE CRITERIA FOR FUTURE IMPLEMENTATION

1. Submitting a new lead via `/api/save-lead` must persist both `public.leads` and `public.quotations` where `quotations.inquiry_id == leads.inquiry_id`.
2. Submitting an inquiry on `/contact` must dispatch exactly one buyer email via Resend without triggering client-side EmailJS.
3. Quotation PDFs must render clear currency fluctuation and validity expiration terms.
4. `PrivateDashboard.jsx` must display accurate country-wise enquiry counts and product distribution.

---

## 19. DEPENDENCIES AND ROLLBACK CONSIDERATIONS

- **Zero Migration Rollback Risk:** Correcting DEF-120-01 is a forward-only JavaScript change in `api/_lib/supabaseClient.js`. The SQL schema already specifies `REFERENCES public.leads(inquiry_id) ON DELETE SET NULL`.
- **EmailJS Deprecation:** Disabling client-side EmailJS removes external third-party API exposure from browser network requests, improving client-side performance and security.

---

## 20. OWNER DECISIONS REQUIRED

Prior to proceeding with Package 3F.121, the Business Owner (Sachin Shinde) should review and decide:

1. **Quotation Validity Window:**
   - Confirm whether standard proforma quotation validity should remain 30 days or be reduced to 14 days during volatile crop seasons.
2. **Currency Fluctuation Clause:**
   - Confirm approval to include standard international export FX adjustment clauses on USD proforma invoices.
3. **Client-Side EmailJS Deprecation:**
   - Confirm approval to remove EmailJS and rely exclusively on server-side Resend notifications.
4. **Analytics Scope:**
   - Confirm preferred management dashboard KPI metrics (e.g. Top 5 Target Countries, Moringa vs Onion ratio).

---

## 21. FINAL BUSINESS OPERATIONS READINESS CLASSIFICATION

### Overall Rating: **`READY_WITH_LIMITATIONS`**

- **Customer Conversion & Positioning:** **READY**
- **Lead Capture & Anti-Spam Security:** **READY**
- **Admin Authentication & Access Controls:** **READY**
- **Quotation Calculation & Processor Checks:** **READY**
- **Relational Data Integrity:** **READY_WITH_LIMITATIONS** (DEF-120-01)
- **Notification Workflow:** **READY_WITH_LIMITATIONS** (DEF-120-02)
- **Executive Reporting:** **PARTIALLY_READY** (Basic counters active; advanced charts proposed)

*Governance outreach locks (`GLOBAL_OUTREACH_STOP=1`, `OUTREACH_AUTHORIZED=0`, `PILOT_AUTHORIZED=0`) remain active and enforced.*
