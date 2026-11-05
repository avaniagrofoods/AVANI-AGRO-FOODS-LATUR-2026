# AVANI AGRO FOODS — ENQUIRY PROCESSING STANDARD & ENDPOINT INVENTORY

**Document Version:** 1.0.0  
**Audit Reference:** November 2026 B2B Lead-Generation Defect Remediation  
**Status:** Canonical Engineering Specification  
**Architecture Owner:** Senior Full-Stack Engineering & QA Audit Desk  
**Business Profile:** AVANI AGRO FOODS, Latur, Maharashtra, India (Agricultural Trade Coordinator & Export Merchant)  

---

## 1. Executive Summary & Shared Processing Standard

Prior to this remediation, different entry points across `avaniagrofoods.com` processed buyer enquiries with inconsistent endpoints, disconnected storage, or deceptive client-side fallbacks (e.g. generating synthetic inquiry IDs upon network or database failures).

This document establishes the **Universal AVANI Lead-Processing Standard**:

```
Buyer Enters Data 
      │
      ▼
Client-Side Field Validation (Name ≥ 2 chars, RFC-compliant email, company, quantity)
      │
      ▼
Submit Button Enforces [disabled={loading}] + Spinner (In-Flight Race Prevention)
      │
      ▼
POST /api/save-lead (Central API Endpoint)
      │
      ├─► Origin & Rate Limit Check (5 req / 15 min per IP)
      ├─► Honeypot Filter (Automated bots silently trapped with AAF-INQ-TRAP-FILTERED)
      ├─► Quantity Normalization (e.g. 18 MT -> 18,000 KG)
      ├─► Product Master & HS Code Match (Moringa: 1211.90.29 / Red Onion: 0712.20.00)
      ├─► Quotation Engine Draft Generation (Subtotal, FOB/CIF breakdown, Currency)
      │
      ▼
Durable PostgreSQL Storage (Supabase)
      ├─► public.leads (Canonical lead record)
      ├─► public.quotations (Generated quotation draft)
      ├─► public.lead_audit_logs (Immutable audit trail: LEAD_CREATED)
      ├─► public.crm_activities (Initial activity: INITIAL_INQUIRY)
      │
      ▼
Persistence Gate Check
      ├─── IF SUCCESS:
      │       ├── Store in recent deduplication cache (60s window)
      │       ├── Non-blocking Resend email dispatch to sales@avaniagrofoods.com
      │       ├── Fire GA4 generate_lead event
      │       └── Display Authoritative Inquiry ID (AAF-INQ-2026-XXXXXX) & WhatsApp tracking link
      │
      └─── IF FAILURE:
              ├── Purge dedup key to avoid retry lockout
              ├── Return HTTP 500 with descriptive error
              ├── Retain 100% of entered form fields in state
              ├── Present Red/Amber Error Card: "Enquiry Submission Unconfirmed"
              └── Provide 1-Click WhatsApp (+91 7219053645) & Direct Email alternatives
```

---

## 2. Complete Inventory of All Enquiry Entry Points

### Entry Point 1: Dedicated B2B RFQ Form
- **Form Name:** Commercial B2B Export RFQ Form
- **Source Code Path:** `src/components/B2BRFQForm.jsx`
- **Active Locations:** 
  - Dedicated Moringa Landing (`/moringa-powder-bulk-supplier-india`)
  - Dedicated Red Onion Landing (`/red-onion-powder-bulk-supplier-india`)
  - Standalone embedding across key service sections
- **User-Facing Inputs:**
  - Full Name (`name`, required, ≥ 2 chars)
  - Business Email (`email`, required, RFC valid)
  - Phone / WhatsApp Number (`phone`, optional/recommended)
  - Company / Business Name (`company`, required)
  - Buyer Corporate Role (`buyerRole`, dropdown: 8 commercial personas)
  - Destination Country (`country`, searchable dropdown)
  - Product Required (`product`, Moringa Leaf Powder / Dehydrated Red Onion Powder)
  - Order Volume (`quantity`, numeric) + Unit (`quantityUnit`, KG / MT)
  - Commercial Incoterm (`incoterm`, FOB Nhava Sheva / CIF / CFR / EXW)
  - Destination Seaport / Airport (`destinationPort`)
  - Procurement Timeline (`purchaseTimeline`, Immediate <30d, 30–60d, Quarterly)
  - Intended Application (`intendedApplication`, Food Mfg, Nutraceuticals, Seasoning)
  - Packaging Preference (`packagingPreference`, 25kg Drums, HDPE Bags, Poly Cartons)
  - Compliance Documents (`documentsRequested`, COA, Microbiological Assay, Heavy Metals)
  - Commercial Notes (`notes`, textarea)
  - Anti-Spam Trap (`honeypot_company_url`, hidden)
- **Submission Endpoint & Method:** `POST /api/save-lead`
- **Database Persistence Target:** 
  - `public.leads`
  - `public.quotations`
  - `public.lead_audit_logs`
  - `public.crm_activities`
- **Quotation Generation Status:** Active (Generates draft proforma quotation with FOB/CIF pricing)
- **Audit & CRM Status:** Active (Logs `LEAD_CREATED` and `INITIAL_INQUIRY`)
- **Notification Mechanism:** Non-blocking Resend dispatch to `sales@avaniagrofoods.com`
- **Failure Handling Behavior:**
  - Zero fake inquiry IDs generated.
  - If backend returns non-200 or database insert fails, buyer input is preserved.
  - Renders red/amber alert card: *"Enquiry Submission Unconfirmed"*.
  - Provides direct WhatsApp button to Trade Coordinator Sachin Shinde (`+91 7219053645`) carrying product, volume, and destination context.
  - Provides direct Email button (`sales@avaniagrofoods.com`).
  - Allows immediate retry without duplicate lockout.
- **Intentional Exceptions:** None. Standard full RFQ.

---

### Entry Point 2: In-Article Quick Enquiry Form
- **Form Name:** B2B Quick Sourcing Desk Modal / Embed
- **Source Code Path:** `src/components/B2BQuickEnquiry.jsx`
- **Active Locations:** 
  - All 30 published technical articles (`/blog/:slug`)
  - Mid-article and bottom-of-article contextual callouts
- **User-Facing Inputs:**
  - Full Name (`fullName`, required)
  - Business Email (`email`, required)
  - WhatsApp / Phone Number (`phone`, optional)
  - Company Name (`companyName`, required)
  - Country (`country`, text/select)
  - Product (`product`, pre-selected based on article topic)
  - Target Quantity (`quantity`, text, e.g. "500 kg")
  - Intended Application (`intendedApplication`, select)
  - Packaging Requirement (`packagingRequirements`, select)
  - Additional Notes (`message`, textarea)
  - Anti-Spam Trap (`honeypot`, hidden)
- **Submission Endpoint & Method:** `POST /api/save-lead`
- **Database Persistence Target:** `public.leads`, `public.quotations`, `public.lead_audit_logs`, `public.crm_activities`
- **Quotation Generation Status:** Active (Draft quote calculated via Product Master)
- **Audit & CRM Status:** Active
- **Notification Mechanism:** Central API notification pipeline
- **Failure Handling Behavior:**
  - Fake ID fallback (`AAF-INQ-` + random) completely removed.
  - Shows structured error banner with actionable recovery options.
  - Preserves entered form state.
  - Direct WhatsApp and Email links provided.
- **Intentional Exceptions:** Simplified fieldset tailored for fast in-content inquiry while retaining strict backend validation.

---

### Entry Point 3: Product Catalogue Enquiry Modal
- **Form Name:** Product Catalogue Sourcing Modal
- **Source Code Path:** `src/pages/Products.jsx`
- **Active Locations:** `/products` (Triggered via "Request Sourcing Quote" on Moringa and Red Onion cards)
- **User-Facing Inputs:**
  - Contact Name (`name`, required)
  - Business Email (`email`, required)
  - Company Name (`company`, required)
  - Destination Country / Port (`country`, required)
  - Estimated Volume (`quantity`, required, min 100 kg)
  - Target Incoterm (`incoterm`, FOB Nhava Sheva / CIF / CFR / Air Cargo)
  - Specific Requirements (`message`, textarea)
- **Submission Endpoint & Method:** `POST /api/save-lead` *(Migrated from EmailJS in P0-02 remediation)*
- **Database Persistence Target:** `public.leads`, `public.quotations`, `public.lead_audit_logs`, `public.crm_activities`
- **Quotation Generation Status:** Active (Generates quotation draft mapped to selected catalog product)
- **Audit & CRM Status:** Active
- **Notification Mechanism:** Central API email notification + CRM activity record
- **Failure Handling Behavior:**
  - Replaced legacy `alert()` with in-modal error card.
  - Preserves all entered buyer details.
  - Offers direct WhatsApp (+91 7219053645) and email (sales@avaniagrofoods.com) recovery links.
  - Displays authoritative inquiry reference upon confirmed persistence.
- **Intentional Exceptions:** EmailJS retained solely for auxiliary client alerts if enabled, but all primary sourcing flows route through `/api/save-lead`.

---

### Entry Point 4: Primary Contact Page Form
- **Form Name:** Comprehensive B2B Sourcing & RFQ Form
- **Source Code Path:** `src/pages/Contact.jsx`
- **Active Locations:** `/contact`
- **User-Facing Inputs:**
  - Full Name, Company Name, Business Email, Phone
  - Buyer Category (Importer, Manufacturer, Distributor, Trader)
  - Country & Target Destination Port
  - Product (Moringa Leaf Powder / Dehydrated Red Onion Powder)
  - Volume (kg) & Procurement Frequency
  - Mesh Size, Moisture, Packaging Type, Private Label Request
  - Incoterm (FOB, CIF, CFR, EXW), Target Lead Time, Target Price
  - Testing & Certification Requirements (COA, Pesticides, Heavy Metals)
  - Additional Notes
  - Honeypot Anti-Spam Field
- **Submission Endpoint & Method:** `POST /api/save-lead`
- **Database Persistence Target:** `public.leads`, `public.quotations`, `public.lead_audit_logs`, `public.crm_activities`
- **Quotation Generation Status:** Active
- **Audit & CRM Status:** Active
- **Notification Mechanism:** Central API dispatch
- **Failure Handling Behavior:**
  - Catches non-200 responses and network drops.
  - Displays prominent error message with instructions.
  - Preserves 100% of form inputs in local state.
  - Direct WhatsApp desk follow-up button available.
- **Intentional Exceptions:** Contains extended technical parameters (mesh size, moisture, testing reqs) tailored for enterprise buyers.

---

### Entry Point 5: Lead Magnet / Market Report Form
- **Form Name:** Global Superfood Market Report 2026 Download Form
- **Source Code Path:** `src/components/LeadMagnet.jsx`
- **Active Locations:** Homepage (`/`) and footer callouts
- **User-Facing Inputs:**
  - Full Name (`name`, required)
  - Business Email (`email`, required)
  - Company Name (`company`, optional)
- **Submission Endpoint & Method:** Auxiliary EmailJS notification (`sendContactEmail`) + client download trigger
- **Database Persistence Target:** Client-side receipt / Email notification
- **Quotation Generation Status:** N/A (Informational whitepaper download, not a commercial price quotation)
- **Audit & CRM Status:** N/A
- **Notification Mechanism:** EmailJS notification to sales desk
- **Failure Handling Behavior:** Graceful network error alert with download link fallback.
- **Intentional Exceptions:** **Intentional Exception.** This is a top-of-funnel content asset download rather than a commercial price quotation. It does not generate commercial quotation records in `public.quotations`.

---

### Entry Point 6: Floating Smart WhatsApp Bubble
- **Form Name:** Mobile & Desktop WhatsApp Quick Chat Launcher
- **Source Code Path:** `src/components/WhatsAppBubble.jsx`
- **Active Locations:** Universal floating launcher across all pages
- **User-Facing Inputs:**
  - Full Name (`name`, required)
  - WhatsApp Phone Number (`phone`, required)
- **Submission Endpoint & Method:** Dual-Channel:
  1. Asynchronously attempts lead capture via `/api/save-lead`
  2. Immediately constructs deep-linked WhatsApp message and opens `https://wa.me/917219053645`
- **Database Persistence Target:** Server-side lead record if valid email is supplied; direct mobile chat handoff
- **Quotation Generation Status:** Coordinated directly in chat by Trade Coordinator Sachin Shinde
- **Audit & CRM Status:** Tracked via analytics (`trackWhatsAppClick`)
- **Notification Mechanism:** Direct WhatsApp push to Trade Coordinator mobile device (+91 7219053645)
- **Failure Handling Behavior:**
  - If backend lead capture is unavailable, WhatsApp window opens regardless so the buyer is never blocked.
- **Intentional Exceptions:** **Intentional Exception.** Designed for instantaneous conversational handoff. Does not require formal quotation drafting before opening communication.

---

### Entry Point 7: Direct Email & Phone Links
- **Source Code Paths:** 
  - `src/components/Navbar.jsx`
  - `src/components/Footer.jsx`
  - `src/data/links.js`
- **Active Locations:** Site-wide header, footer, article meta headers
- **User Action:** Click-to-email (`mailto:sales@avaniagrofoods.com`) or click-to-call (`tel:+917219053645`)
- **Submission Endpoint:** Client mail user agent (MUA) / phone dialer
- **Database Persistence Target:** Inbound Zoho Mail (`sales@avaniagrofoods.com`)
- **Intentional Exceptions:** Direct external communication channels. No web forms involved.

---

## 3. Shared Processing Standards Matrix

| Entry Point | Component Path | Central API | Supabase Tables | Quotation Draft | Audit Log | CRM Activity | False-Success Guard |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **B2B RFQ Form** | `src/components/B2BRFQForm.jsx` | `/api/save-lead` | `leads`, `quotes`, `logs`, `crm` | YES | YES | YES | **ACTIVE (No fake ID)** |
| **Quick Enquiry** | `src/components/B2BQuickEnquiry.jsx` | `/api/save-lead` | `leads`, `quotes`, `logs`, `crm` | YES | YES | YES | **ACTIVE (No fake ID)** |
| **Product Modal** | `src/pages/Products.jsx` | `/api/save-lead` | `leads`, `quotes`, `logs`, `crm` | YES | YES | YES | **ACTIVE (No fake ID)** |
| **Contact Page** | `src/pages/Contact.jsx` | `/api/save-lead` | `leads`, `quotes`, `logs`, `crm` | YES | YES | YES | **ACTIVE (Strict 200)** |
| **Lead Magnet** | `src/components/LeadMagnet.jsx` | Auxiliary / EmailJS | N/A (Whitepaper) | N/A | N/A | N/A | Alert on error |
| **WhatsApp Bubble** | `src/components/WhatsAppBubble.jsx` | Direct Handoff | Fallback to Direct Chat | Manual | Analytics | Direct | Immediate Chat |

---

## 4. Failure Mode Recovery Standard

When any technical failure occurs (network loss, database timeout, server error 500, or invalid credentials):

1. **Never Show Deceptive Confirmation:** Under no circumstances may a component display a green confirmation checkmark or synthetic inquiry reference (`AAF-INQ-...`) unless the backend HTTP response is `200` with `data.success === true` and a valid `data.inquiryId`.
2. **Preserve User Inputs:** Form state variables (`formData`) must remain completely populated. Never invoke `reset()` or clear fields on error.
3. **Actionable Contact Handoff:**
   - WhatsApp Button URL format:
     `https://wa.me/917219053645?text=Namaste%20Sachin%2C%20I%20tried%20submitting%20an%20RFQ...`
   - Direct Email URL format:
     `mailto:sales@avaniagrofoods.com?subject=Urgent%20RFQ...`
4. **Retry Protection:** In-flight double-clicks are suppressed via `disabled={loading}` on submit buttons. Failed requests do not pollute the deduplication cache, allowing immediate re-submission upon network recovery.
