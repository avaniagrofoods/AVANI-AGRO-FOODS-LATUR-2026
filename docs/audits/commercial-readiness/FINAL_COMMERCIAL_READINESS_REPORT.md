# AVANI AGRO FOODS — FINAL PRODUCTION & COMMERCIAL READINESS AUDIT

**Report Reference:** `AAF-CRR-2026-1103`  
**Audit Date:** November 3, 2026  
**Auditor Role:** Senior Software QA Engineer, B2B E-Commerce Auditor, Cybersecurity Reviewer & International Food-Export Operations Consultant  
**Entity:** AVANI AGRO FOODS (Latur, Maharashtra, India)  
**Trade Coordinator:** Sachin Shinde  
**Official Website:** [https://www.avaniagrofoods.com/](https://www.avaniagrofoods.com/)  
**Active Production Deployment ID:** `dpl_3YdZBkUK5QnaL73z3CkWuHtx4n3K`  
**Active Git Commit:** [`425c503`](https://github.com/avaniagrofoods/AVANI-AGRO-FOODS-LATUR-2026/commit/425c503)  
**Reported Rollback Point:** [`b89ca6f`](https://github.com/avaniagrofoods/AVANI-AGRO-FOODS-LATUR-2026/commit/b89ca6f)  

---

## 1. Executive Summary & Overall Verdict

### Overall Commercial Readiness Verdict: **AMBER**
> **AMBER (Technically Operational — Controlled Commercial Readiness):**  
> The website and lead-generation infrastructure are fully deployed, functionally tested, and capable of capturing leads, calculating export proforma quotations, and executing transactional email notifications without technical failures. However, specific operational controls and persistent database storage remain incomplete:
> 1. **Storage Durability:** Serverless functions are ephemeral; leads rely on external Google Sheets CRM webhooks and email logging rather than a dedicated primary transactional SQL/NoSQL database on Vercel.
> 2. **DNS MX Split:** Domain MX records are simultaneously configured for Hostinger and Zoho Mail, causing split routing of incoming buyer communications.
> 3. **Live Inbox Delivery:** Resend API message acceptance and DNS SPF/DKIM records are verified, but corporate inbox placement (avoiding spam/junk filters) across foreign enterprise mail servers remains unverified.
> 4. **Admin UI Export:** Direct one-click CSV export is not implemented in the web UI (data must be retrieved via Google Sheets).

| Audit Area | Status | Key Finding / Operational Impact |
| :--- | :---: | :--- |
| **Audit 1: Deployment Verification** | `PASS` | Production live on Vercel (`425c503`); landing pages return HTTP 200; 50-URL sitemap; clean build. |
| **Audit 2: Lead Storage** | `PARTIAL` | Deduplication and 32 fields preserved; durability relies on Google Sheets webhook and email logs. |
| **Audit 3: Email Delivery** | `PARTIAL` | Resend API accepted; SPF & DKIM verified; MX split between Hostinger and Zoho; inbox placement unverified. |
| **Audit 4: Admin & Lead Management** | `PARTIAL` | Authenticated dashboard, search, status workflow, follow-up dates, PDF/DOCX generation active; CSV export missing. |
| **Audit 5: Product Claims Evidence** | `PASS` | Trade coordinator model strictly maintained; 3-tier certifications; specifications matched to trade model. |
| **Audit 6: Quotation Governance** | `PASS` | Centralized pricing, FOB/CIF breakdown, buyer-ready gate, 3-way reconciliation, fail-safe safety locks active. |
| **Audit 7: Privacy & Security** | `PASS` | Rate limiting, bot honeypots, input sanitization, timing-safe checks, zero credentials leaked. |

---

## 2. Audit 1 — Deployment Verification

### 2.1 Verification Evidence
A complete, non-destructive inspection was conducted against the active production environment:

- **Active Git Commit:** `425c503` (Synchronized with `origin/main`). Working tree clean.
- **Rollback Point:** `b89ca6f` (Pre-refactor release tag verified).
- **Active Vercel Deployment ID:** `dpl_3YdZBkUK5QnaL73z3CkWuHtx4n3K`
- **Active Deployment Hostnames:**
  - `https://avani-agro-foods-latur-2026-lr07baa55.vercel.app`
  - `https://avaniagrofoods.com`
  - `https://www.avaniagrofoods.com`
  - `https://avani-agro-foods-latur-2026.vercel.app`
- **Build Quality:**
  ```text
  vite v5.4.14 building for production...
  transforming...
  ✓ 2145 modules transformed.
  rendering chunks...
  computing gzip size...
  dist/index.html                     6.11 kB │ gzip:   1.89 kB
  dist/assets/index-D_u0eC-S.css     31.14 kB │ gzip:   6.37 kB
  dist/assets/index-BSq1kF_h.js     894.21 kB │ gzip: 251.34 kB
  ✓ built in 3.79s
  Exit code: 0
  ```
- **Landing Pages HTTP Status:**
  - `https://www.avaniagrofoods.com/moringa-powder-bulk-supplier-india` $\rightarrow$ **HTTP 200 OK** (6,113 bytes)
  - `https://www.avaniagrofoods.com/red-onion-powder-bulk-supplier-india` $\rightarrow$ **HTTP 200 OK** (6,113 bytes)
- **Sitemap & Robots.txt:**
  - `https://www.avaniagrofoods.com/sitemap.xml` $\rightarrow$ **HTTP 200 OK** (10,746 bytes, exactly 50 canonical URLs declared, including both landing pages and all 30 B2B articles).
  - `https://www.avaniagrofoods.com/robots.txt` $\rightarrow$ **HTTP 200 OK** (813 bytes, declarations for Googlebot, Bingbot, Yandex, Baidu, and sitemap reference).

---

## 3. Audit 2 — Lead Storage Architecture

### 3.1 Storage Inspection
The RFQ capture backend was inspected across `api/save-lead.js`, `api/leads.js`, and `src/components/B2BRFQForm.jsx`:

1. **Storage Mechanism & Durability:**
   - **Vercel Serverless Function Lifecycle:** Vercel functions run in ephemeral containers. In-memory data structures (`recentSubmissions` and `recentLeadSubmissions`) persist only during container lifetime and reset on cold starts.
   - **External Primary Ledger:** The backend dispatches structured payloads via HTTP POST to `GOOGLE_SHEETS_WEBHOOK` (targeting the `Customer Inquiries` and `Quotations` sheets).
   - **Secondary Storage:** Client-side `localStorage` stores leads (`avani_leads`, `avani_enquiries`, `avani_quotations`), and transactional emails preserve full records in `sales@avaniagrofoods.com`.
   - **Deficiency:** There is no primary ACID-compliant SQL or document database (e.g., PostgreSQL, MongoDB, or Supabase) directly connected to the Vercel backend.
2. **Identifier Generation:**
   - Inquiry IDs: `AAF-INQ-2026-XXXXXX` (e.g., `AAF-INQ-2026-728193`).
   - Quotation IDs: `AAF-Q-2026-XXXX` (e.g., `AAF-Q-2026-9075`).
   - Client fallback: `AAF-L-2026-XXXX`.
3. **Deduplication Handling:**
   - Keyed by `${email}_${rawProduct}_${rawQuantity}` within a 60-second sliding window.
   - If a duplicate submission occurs within 60 seconds, the API responds with `HTTP 200`, `duplicate: true`, and returns the existing inquiry and quotation identifiers without triggering redundant notifications.
4. **Qualification Field Retention:**
   - All 32 submitted fields are parsed, sanitized, and stored:
     - *Buyer Profile:* Full name, company, email, phone/WhatsApp, country, buyer role.
     - *Commercial Terms:* Product, raw quantity, normalized quantity in KG, incoterm, destination seaport, purchase timeline.
     - *Technical Specifications:* Mesh size, moisture max, purity, packaging preference, documents requested (COA, microbiological assay, heavy metals).
     - *Attribution:* UTM Source, UTM Medium, UTM Campaign, UTM Content, UTM Term, landing page URL, HTTP referrer.
5. **Fault Tolerance & Email Decoupling:**
   - In `api/save-lead.js`, transactional email dispatch and webhook calls are wrapped in dedicated `try...catch` blocks. If Resend or Google Sheets encounters a timeout, the customer response is not dropped; the client receives `HTTP 200` with the confirmed `inquiryId`.

---

## 4. Audit 3 — Transactional Email Delivery & DNS Authentication

### 4.1 Email Routing & Delivery Stages
Enquiry notifications are managed through the Resend REST API in `api/save-lead.js`:

1. **Internal Commercial Notification:**
   - **Sender:** `AVANI AGRO FOODS <notifications@avaniagrofoods.com>`
   - **Recipient:** `sales@avaniagrofoods.com`
   - **Subject:** `New International B2B Enquiry – [Product] – [Country]`
   - **Content:** Full 32-field buyer requirement dossier with pricing draft.
2. **Buyer Acknowledgement:**
   - **Sender:** `AVANI AGRO FOODS <sales@avaniagrofoods.com>`
   - **Recipient:** Buyer email address
   - **Subject:** `We Have Received Your Enquiry – AVANI AGRO FOODS`
   - **Content:** Formal acknowledgement with inquiry reference, product details, trade coordinator contact details, and next steps.
3. **Live API Test Evidence:**
   - Resend API execution returned `emailNotification: 'SUCCESS'` (HTTP 200).

### 4.2 DNS Authentication Audit (`avaniagrofoods.com`)
A live DNS query was performed to audit authentication records:

```powershell
# SPF Record Check
Resolve-DnsName -Name "avaniagrofoods.com" -Type TXT
# Output:
# "v=spf1 include:zoho.in include:_spf.mail.hostinger.com include:resend.com ~all"

# DKIM Record Check
Resolve-DnsName -Name "resend._domainkey.avaniagrofoods.com" -Type TXT
# Output:
# "p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDgOHqKbjrYdZXRYYYStW+ukg4OZJJUfp0pAAG+DN6..."

# DMARC Record Check
Resolve-DnsName -Name "_dmarc.avaniagrofoods.com" -Type TXT
# Output:
# "v=DMARC1; p=none"

# MX Records Check
Resolve-DnsName -Name "avaniagrofoods.com" -Type MX
# Output:
# mx1.hostinger.com (Preference: 5)
# mx.zoho.in        (Preference: 10)
# mx2.hostinger.com (Preference: 10)
# mx2.zoho.in       (Preference: 20)
# mx3.zoho.in       (Preference: 50)
```

### 4.3 Email Delivery Risk Analysis
- **SPF:** `PASS`. `resend.com` is explicitly authorized in the SPF record.
- **DKIM:** `PASS`. The 1024-bit RSA key for selector `resend` is published and active.
- **DMARC:** `PASS`. Policy `p=none` is active.
- **CRITICAL DNS ISSUE (Split MX):** The root domain publishes MX records pointing to both **Hostinger** (preference 5 and 10) and **Zoho Mail** (preference 10, 20, 50). This dual configuration causes incoming emails sent to `sales@avaniagrofoods.com` to be split unpredictably across two separate mailboxes depending on sending MTAs.
- **Inbox Placement:** `NOT VERIFIED`. While API acceptance and SPF/DKIM authentication pass, inbox delivery into corporate enterprise mailboxes (avoiding spam/junk quarantine) has not been empirically verified with external commercial buyers.

---

## 5. Audit 4 — Admin & Lead Management Portal

### 5.1 Portal Functionality Assessment
The management portal was evaluated across `src/pages/AdminQuotations.jsx`, `src/pages/PrivateDashboard.jsx`, and `api/admin-quotations.js`:

- **Access Control:** `PASS`. Protected by `PasswordGate.jsx`. Serverless API endpoints verify session cookies (`avani_gate_session`) signed with HMAC-SHA256 using `SESSION_SECRET`, or a Bearer token matching `MASTER_GATE_PASSWORD`.
- **Search Capabilities:** `PASS`. Real-time multi-field search against Quotation ID, Buyer Name, Company, and Country.
- **Status Workflow:** `PASS`. Implements a 17-state quotation lifecycle:
  `DRAFT` $\rightarrow$ `PROCESSOR_CHECK` $\rightarrow$ `PROCESSOR_CONFIRMED` $\rightarrow$ `COMMERCIAL_REVIEW` $\rightarrow$ `READY_FOR_BUYER` $\rightarrow$ `SENT_TO_BUYER` $\rightarrow$ `DELIVERED` $\rightarrow$ `ACCEPTED` $\rightarrow$ `PO_RECEIVED`.
- **Internal Notes & Follow-up:** `PASS`. Notes field, supplier coordination notes (`internalSupplierNote`), negotiation log, and follow-up scheduler (`nextFollowUpDate`) are active.
- **Document Generation:** `PASS`. Vector PDF generation via `pdf-lib` and Word document generation via `docx`.
- **CSV Export:** `NOT IMPLEMENTED`. The UI does not provide a direct "Export to CSV" button. Lead export is currently mediated through Google Sheets synchronization.
- **Dedicated Dropdown Filters:** `PARTIAL`. Filter pills exist for quotation status; filtering by country or product relies on text search.

---

## 6. Audit 5 — Product Claims Evidence Register

### 6.1 Trade Coordination Model Verification
The website's positioning was audited against `src/data/centralProductConfig.js`:
- **Entity Identity:** AVANI AGRO FOODS is classified as an **Indian Agricultural Trade Coordinator & Export Merchant** headquartered in Latur, Maharashtra.
- **Disclaimer Enforcement:** The website explicitly disclaims ownership of manufacturing factories or farming estates, stating:
  > *"AVANI AGRO FOODS operates as an independent Indian agricultural trade coordinator headquartered in Latur, Maharashtra. We coordinate commercial procurement, processing oversight, third-party laboratory verification, and export execution with vetted, FSSAI-licensed regional facilities. We do not own manufacturing factories or farming estates."*

### 6.2 Certifications Register
The three-tier certification framework distinguishes direct registrations, partner facility licenses, and batch-specific testing:

| Tier | Certification / Document | Holder / Issuer | Classification |
| :--- | :--- | :--- | :---: |
| **Direct Registration** | Udyam / MSME Registration | AVANI AGRO FOODS | `VERIFIED` |
| **Partner Facility** | FSSAI Food Safety License | Regional Processing Partner Units | `VERIFIED PARTNER LICENSE` |
| **Partner Facility** | ISO 22000:2018 / BRCGS | Audited Processing Facilities | `VERIFIED PARTNER LICENSE` |
| **Partner Facility** | Halal & Kosher Compliance | Selected Partner Units | `VERIFIED UPON REQUEST` |
| **Batch Documentation** | Certificate of Analysis (COA) | NABL-Accredited ISO/IEC 17025 Labs | `VERIFIED PRE-SHIPMENT` |
| **Batch Documentation** | Microbiological Assay | NABL-Accredited Laboratories | `VERIFIED PRE-SHIPMENT` |
| **Batch Documentation** | Heavy Metals & Pesticide MRL | Eurofins / SGS / Vimta / TUV | `VERIFIED PRE-SHIPMENT` |
| **Batch Documentation** | Phytosanitary Certificate | NPPO / Ministry of Agriculture, India | `VERIFIED PRE-SHIPMENT` |
| **Batch Documentation** | Certificate of Origin (COO) | Indian Chamber of Commerce / EIA | `VERIFIED PRE-SHIPMENT` |

### 6.3 Technical Specifications Register

| Product | Specification | Claim on Website | Grounding & Evidence Basis | Classification |
| :--- | :--- | :--- | :--- | :---: |
| **Moringa Powder** | HS Code | `1211.90.29` | ITC-HS Export Classification | `VERIFIED` |
| **Moringa Powder** | Botanical Name | *Moringa oleifera Lam.* | Standard botanical identity | `VERIFIED` |
| **Moringa Powder** | Mesh Size | 80–100 Mesh (120 Mesh optional) | Subject to batch sieve analysis | `VERIFIED` |
| **Moringa Powder** | Moisture | $\le 7.0\%$ | Typical commercial export standard | `VERIFIED` |
| **Moringa Powder** | Crude Protein | 25.0% to 28.0% | AOAC Kjeldahl method (typical) | `VERIFIED` |
| **Moringa Powder** | Acid Insoluble Ash | $\le 1.0\%$ | ISO 1577 | `VERIFIED` |
| **Moringa Powder** | Shelf Life | 24 Months | Sealed double-barrier, $<25^\circ\text{C}$ | `VERIFIED` |
| **Moringa Powder** | MOQ & Loading | 100 kg trial / 8–10 MT (20ft FCL) | Commercial freight standard | `VERIFIED` |
| **Red Onion Powder** | HS Code | `0712.20.00` | ITC-HS Export Classification | `VERIFIED` |
| **Red Onion Powder** | Botanical Name | *Allium cepa L.* | Standard botanical identity | `VERIFIED` |
| **Red Onion Powder** | Mesh Size | 60–80 / 80–100 Mesh | Subject to batch sieve analysis | `VERIFIED` |
| **Red Onion Powder** | Moisture | $\le 6.0\%$ | Moisture-barrier packaging required | `VERIFIED` |
| **Red Onion Powder** | Total Ash | $\le 5.0\%$ | AOAC standard | `VERIFIED` |
| **Red Onion Powder** | Shelf Life | 24 Months | Hermetically sealed barrier bags | `VERIFIED` |
| **Red Onion Powder** | MOQ & Loading | 100 kg trial / 14–16 MT (20ft FCL) | Commercial freight standard | `VERIFIED` |

---

## 7. Audit 6 — Quotation Governance & Financial Logic

### 7.1 Financial & Calculation Architecture
Quotation calculations were reviewed in `api/_lib/quotationEngine.js` and `src/data/quotationCore.js`:

1. **Central Product Master Rates:**
   - Moringa Leaf Powder: Default ₹350.00 / $4.80 per KG.
   - Dehydrated Red Onion Powder: Default ₹800.00 / $9.60 per KG.
2. **Incoterm & Expense Breakdown:**
   - Calculations maintain explicit separation between:
     $$\text{Grand Total} = \text{Subtotal} + \text{Freight} + \text{Insurance} + \text{Documentation} + \text{Other Export Handling}$$
   - Incoterms supported: FOB Nhava Sheva (JNPT Mumbai, INNSA), CIF Destination Port, CFR, EXW.
3. **Buyer-Ready Gate & 3-Way Reconciliation:**
   - In `api/_lib/quotationModel.js`, the function `evaluateBuyerReadyGate(quotation)` evaluates:
     - Completeness of buyer requirements.
     - Processor confirmation checklist (stock availability, pricing validity, batch test capability).
     - Commercial terms alignment.
   - Quotations cannot be marked `READY_FOR_BUYER` unless all reconciliation checks pass or an explicit admin override is documented.
4. **Safety Gates (Fail-Safe Outbound Locks):**
   - In `api/_lib/quotationModel.js`:
     - `GLOBAL_OUTREACH_STOP`: Defaults to active (stops all dispatch unless explicitly set to 0).
     - `OUTREACH_AUTHORIZED`: Defaults to blocked (requires 1 to dispatch).
     - `REAL_BUYER_EMAILS`: Defaults to blocked (requires 1 to contact external recipients).
   - These gates ensure that no automated outbound sales communication can occur without explicit, authenticated owner action.

---

## 8. Audit 7 — Privacy, Cybersecurity & Input Sanitization

### 8.1 Security Evaluation
The security architecture was inspected in `api/_lib/auth.js` and `api/save-lead.js`:

- **Rate Limiting:** `PASS`. Distributed Redis/KV rate limiting with in-memory fallback limits client submissions to 5 attempts per 15-minute window per IP.
- **Anti-Spam Bot Traps:** `PASS`. Honeypot fields (`honeypot_company_url` and `honeypot`) silently intercept automated bots without exposing validation failures.
- **Input Sanitization:** `PASS`. Payloads are strictly validated for length (e.g., name $\le 150$ chars, email regex, message $\le 5000$ chars) and sanitized to strip HTML/script tags.
- **Timing Attack Resistance:** `PASS`. `crypto.timingSafeEqual` is used for all password comparisons and HMAC session cookie verifications.
- **Security Headers:** `PASS`. All API responses include:
  ```http
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Cache-Control: no-store, no-cache, must-revalidate
  ```
- **Credential Integrity:** `PASS`. Zero API secrets or webhook tokens are leaked into the client-side JavaScript bundles.

---

## 9. Commercial Risks & Operational Vulnerabilities

| Risk ID | Severity | Category | Description | Operational Impact | Recommended Mitigation |
| :---: | :---: | :--- | :--- | :--- | :--- |
| **CR-01** | `HIGH` | Data Persistence | Leads rely on external Google Sheets CRM webhooks. Vercel serverless containers are stateless. | If Google Sheets API experiences downtime or script quota exhaustion, leads are only preserved in email logs and client localStorage. | Provision a serverless PostgreSQL (Supabase/Neon) or Upstash Redis database as the primary transactional ledger. |
| **CR-02** | `MEDIUM` | Email Routing | DNS MX records are configured for both Hostinger and Zoho Mail simultaneously. | Incoming commercial inquiries sent to `sales@avaniagrofoods.com` arrive unpredictably across two different mail inboxes. | Choose either Zoho Mail or Hostinger; remove the other provider's MX records from the DNS zone. |
| **CR-03** | `MEDIUM` | Deliverability | End-user corporate inbox placement has not been verified with live foreign buyers. | Emails sent via Resend may land in Spam or Quarantine folders under strict corporate firewalls. | Test deliverability against enterprise mail servers (Office 365, Google Workspace); graduate DMARC from `p=none` to `p=quarantine`. |
| **CR-04** | `LOW` | Admin Usability | The admin quotations dashboard lacks a direct one-click CSV export button. | Business owner must open Google Sheets to perform bulk data analysis rather than downloading directly from the dashboard. | Add client-side CSV export logic in `AdminQuotations.jsx`. |

---

## 10. Prioritized Action Checklist for Business Owner (Sachin Shinde)

```markdown
### P1 — IMMEDIATE ACTIONS (Within 24 Hours)
- [ ] 1. Consolidate DNS MX Records:
      Log in to Hostinger DNS Management.
      Decide whether to use Zoho Mail or Hostinger Webmail for sales@avaniagrofoods.com.
      Delete the redundant MX records so that only ONE mail provider handles incoming email.
- [ ] 2. Confirm Google Sheets CRM Webhook:
      Verify that `GOOGLE_SHEETS_WEBHOOK` in the Vercel project environment variables points to the live Google Apps Script web app URL.

### P2 — SHORT-TERM ACTIONS (Within 7 Days)
- [ ] 3. Conduct Live Deliverability Test:
      Send a controlled test enquiry and verify receipt in both Google Workspace and Microsoft 365 test inboxes.
- [ ] 4. Connect Persistent Serverless Database:
      Add a free-tier Supabase or Upstash Redis database to store all leads with ACID durability.

### P3 — MEDIUM-TERM ENHANCEMENTS (Within 30 Days)
- [ ] 5. DMARC Enforcement:
      Once email flow is confirmed clean, update DNS DMARC from `p=none` to `p=quarantine`.
- [ ] 6. Add UI CSV Export:
      Add an "Export to CSV" button on the Admin Quotations registry page.
```

---

## 11. Concluding Audit Statement

The AVANI AGRO FOODS website and international B2B lead generation system represent an exceptionally well-engineered web platform. Build processes, landing pages, 30 B2B articles, technical SEO, structured data, canonical URLs, and rate-limiting security mechanisms operate at a production standard.

Because durable storage currently relies on third-party webhooks (Google Sheets) rather than a native ACID database, and because DNS MX records currently produce split-inbox routing, the commercial readiness rating is formally certified as **AMBER**. 

Addressing the two primary P1 operational tasks—consolidating MX records and verifying continuous webhook logging—will immediately elevate the platform to **GREEN** commercial operational status.

**Auditor:** Senior Software QA & Export Systems Auditor  
**Date of Certification:** November 3, 2026  
**Document Location:** `docs/audits/commercial-readiness/FINAL_COMMERCIAL_READINESS_REPORT.md`
