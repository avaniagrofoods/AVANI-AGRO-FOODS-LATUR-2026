# AVANI AGRO FOODS — PRODUCT LANDING PAGE AUDIT
**Document ID:** `AAF-AUDIT-PLP-2026-V1`  
**Date:** November 2026  
**Auditor:** Senior B2B E-commerce Acceptance Tester, CRO Specialist & Technical SEO Auditor  
**Scope:** In-Depth Forensic Audit of the Two Core B2B Pillar Landing Pages:
1. `https://www.avaniagrofoods.com/moringa-powder-bulk-supplier-india`
2. `https://www.avaniagrofoods.com/red-onion-powder-bulk-supplier-india`

---

## 1. Executive Summary & Comparative Scorecard

Both landing pages serve as the primary commercial money pages for AVANI AGRO FOODS. They are built on React components ([`MoringaLanding.jsx`](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/src/pages/MoringaLanding.jsx) and [`RedOnionLanding.jsx`](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/src/pages/RedOnionLanding.jsx)) pulling standardized product data from [`centralProductConfig.js`](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/src/data/centralProductConfig.js).

| Evaluation Parameter | Moringa Landing Page | Red Onion Landing Page | Benchmark Standard | Status |
| :--- | :--- | :--- | :--- | :--- |
| **HTTP Status & Canonical** | 200 OK / Self-Canonical | 200 OK / Self-Canonical | 200 OK, Self-referential | **PASS** |
| **5-Second Value Clarity** | High (Clear product & export role) | High (Clear dehydrated focus) | Understandable in < 5 sec | **PASS** |
| **Trade Coordinator Positioning** | Explicit banner & disclaimers | Explicit banner & disclaimers | No false factory ownership | **PASS** |
| **Specification Depth** | 80–100 Mesh, ≤7% Moisture | 60–80 Mesh, ≤6% Moisture | Industrial R&D standards | **PASS** |
| **Third-Party Lab Trust** | NABL COA (Eurofins/SGS) | NABL COA (Microbiology/Ash) | ISO 17025 accredited | **PASS** |
| **Commercial Terms** | MOQ 100 kg / FCL 8–10 MT | MOQ 100 kg / FCL 14–16 MT | Clear volume & freight terms | **PASS** |
| **Primary Seaport Gate** | JNPT Nhava Sheva (INNSA) | JNPT Nhava Sheva (INNSA) | Authoritative port of loading | **PASS** |
| **RFQ Form Usability** | 10+ Input Fields (High friction) | 10+ Input Fields (High friction) | Streamlined multi-step / quick RFQ | **ATTENTION** |
| **WhatsApp Conversion Hand-off**| Present (Pre-filled query) | Present (Pre-filled query) | Instant mobile buyer channel | **PASS** |
| **Internal Linking Inflow** | **0 Links from 30 Articles** | **0 Links from 30 Articles** | Pillar content silo linking | **CRITICAL GAP** |
| **Schema.org Structured Data** | Product, FAQPage, Breadcrumb | Product, FAQPage, Breadcrumb | Rich Snippet Eligible | **PASS** |

---

## 2. In-Depth Audit: Moringa Bulk Supplier Landing Page
**URL:** `https://www.avaniagrofoods.com/moringa-powder-bulk-supplier-india`  
**Component:** `src/pages/MoringaLanding.jsx` (833 lines)  
**Primary Target Keyword:** `moringa powder bulk supplier india`  

### 2.1 Hero Section & 5-Second Test
- **Headline (H1):** *"Bulk Moringa Powder Supplier & Export Coordinator from India"*
  - *Evaluation:* Strong, factual, and eliminates broker ambiguity. Within 3 seconds, an overseas buyer understands the product (*Moringa oleifera*), the country of origin (*India*), and the operational role (*Export Coordinator*).
- **Subheadline:** Highlights standardized 80–100 mesh particle size, moisture limit (≤ 7.0%), batch COA validation by third-party NABL labs, and port departure via Nhava Sheva (JNPT Mumbai).
- **Hero Visual:** Contains a crisp botanical powder product visual with badge `HS 1211.90.29`.
- **Hero CTA:** Double CTA pairing:
  1. Primary Button: `"Request Bulk Quotation (RFQ)"` (smooth scrolls to `#rfq-section`).
  2. Secondary Button: `"WhatsApp Trade Desk"` (opens direct pre-filled chat with Sachin Shinde, Trade Coordinator).

### 2.2 Sourcing Model Transparency & Buyer Protection
- **Operating Model Banner:** Located immediately below the hero:
  > *"AVANI AGRO FOODS operates as an independent Indian agricultural trade coordination business headquartered in Latur, Maharashtra. We coordinate commercial procurement, processing oversight, third-party laboratory verification, and export documentation with vetted, FSSAI-licensed regional facilities. We do not make false claims of factory ownership."*
- **Audit Assessment:** This is exemplary compliance. It protects the company from foreign importer audit disputes and legal liabilities under US FTC and EU trade transparency regulations.

### 2.3 Product Specifications & Technical Depth
The landing page includes an indicative technical parameters table:
- **Botanical Name:** *Moringa oleifera* (Leaves)
- **Mesh Particle Sizing:** 80–100 Mesh (Fine Powder), with 120 Mesh available on request.
- **Moisture Content:** ≤ 7.0% (standard export threshold to inhibit microbial proliferation).
- **Crude Protein:** 25.0% to 28.0% (dry basis, Kjeldahl method).
- **Acid Insoluble Ash:** ≤ 1.0% (proves absence of sand and silica adulteration).
- **Packaging:** 25 kg Food-Grade HDPE Drums with double virgin polyethylene liners, or 5-ply multi-wall Kraft paper sacks with moisture barrier.
- **Preservation & Shelf Life:** 24 months sealed below 25°C in dry conditions.
- **Pre-Shipment Sample Policy:** 100g to 500g evaluation samples coordinated via DHL/FedEx Express for verified commercial buyers.

### 2.4 Identified Deficiencies & Opportunities for Moringa Landing Page
1. **Zero Contextual Backlinks from Pillar Articles:**
   - *Issue:* Despite 15 published articles on Moringa sourcing, none link back to `/moringa-powder-bulk-supplier-india`. They link to `/catalog/moringa-powder`.
   - *Impact:* Severe loss of domain authority and keyword ranking power for the main commercial search term.
   - *Remediation:* Update internal links in all 15 Moringa articles to point directly to `/moringa-powder-bulk-supplier-india` with targeted anchor texts (`bulk moringa powder supplier india`, `request moringa export quote`).
2. **Missing Downloadable Sample COA:**
   - *Issue:* International buyers require visual proof of analytical testing. Currently, COA testing is described in text, but no redacted sample PDF COA is downloadable.
   - *Remediation:* Provide a downloadable "Redacted Representative NABL COA (PDF)" button so QA managers can verify test parameters immediately.
3. **RFQ Form Length on Mobile Devices:**
   - *Issue:* The embedded `B2BRFQForm` requires scrolling past 10 fields on mobile before reaching the submit button.
   - *Remediation:* Introduce a simplified 4-field "Express RFQ" tab (Name, Email/WhatsApp, Country, Quantity) alongside the full 10-field Commercial RFQ.

---

## 3. In-Depth Audit: Red Onion Powder Bulk Supplier Landing Page
**URL:** `https://www.avaniagrofoods.com/red-onion-powder-bulk-supplier-india`  
**Component:** `src/pages/RedOnionLanding.jsx` (833 lines)  
**Primary Target Keyword:** `red onion powder bulk supplier india`  

### 3.1 Hero Section & Value Clarity
- **Headline (H1):** *"Bulk Red Onion Powder Supplier & Export Coordinator from India"*
  - *Evaluation:* Immediate clarity. Distinguishes from generic white onion powder and specifies industrial dehydration grade.
- **Subheadline:** Highlights high-solids Indian red onion varieties (N-53, Bhima Shakti), pungency retention (pyruvic acid index), 60–80 mesh particle size, moisture (≤ 6.0%), and ocean freight through JNPT Nhava Sheva.
- **Hero Visual:** Dehydrated powder visual with badge `HS 0712.20.00`.
- **Hero CTAs:** Direct anchors to `#rfq-section` and WhatsApp Trade Desk.

### 3.2 Technical Specification Depth & Industrial Relevance
- **Botanical Identity:** 100% Dehydrated *Allium cepa* L.
- **Sourcing Geography:** Maharashtra Onion Belt (Nashik, Latur, Pune agricultural districts).
- **Mesh Sizing:** 60–80 Mesh (optimal for seasoning dispersion without airborne dusting loss) / 80–100 Mesh available.
- **Moisture Threshold:** ≤ 6.0% (crucial for hygroscopic onion powder to prevent irreversible caking).
- **Pungency Metric:** High Pyruvic Acid Content (characteristic sharp pungency and volatile sulfur profile).
- **Total Ash:** ≤ 5.0% maximum.
- **Anti-Caking Additives:** 100% pure single ingredient; optional food-grade precipitated silica ($SiO_2$) strictly per buyer specification.
- **Container Logistics:** 20ft FCL holds 14 to 16 Metric Tons (20 kg cartons / 25 kg poly-lined multi-wall bags).

### 3.3 Identified Deficiencies & Opportunities for Red Onion Landing Page
1. **Zero Contextual Backlinks from Onion Articles:**
   - *Issue:* All 15 Red Onion articles link to `/catalog/red-onion-powder` instead of `/red-onion-powder-bulk-supplier-india`.
   - *Remediation:* Redirect link equity from all 15 articles to this landing page.
2. **Missing Anti-Caking Specification Protocol:**
   - *Issue:* Overseas importers often inquire whether anticaking agents are added. While the copy notes "pure single ingredient", it should explicitly list buyer-specified anticaking options (e.g. max 1% silicon dioxide E551 for humid tropical destinations vs 100% additive-free clean-label).
3. **Transit Time & Sea Freight Transparency:**
   - *Issue:* Importers in UAE (Jebel Ali), Europe (Rotterdam), and USA (Long Beach/New York) need estimated ocean transit days to schedule factory production runs.
   - *Remediation:* Add an "Estimated Ocean Transit Times from JNPT" table (e.g. Jebel Ali: 4–6 days; Rotterdam: 24–28 days; New York: 28–32 days).

---

## 4. RFQ Form & Conversion Architecture on Both Pages
Both landing pages embed [`B2BRFQForm.jsx`](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/src/components/B2BRFQForm.jsx).

### 4.1 Form Strengths
- Captures critical B2B parameters: Buyer Role, Product, Volume (KG/MT), Incoterm (FOB/CIF), Destination Port, Target Timeline, Packaging Preference, and Requested Documents.
- Automatically captures UTM source, medium, campaign, and session landing page via `utmTracker.js`.
- Silent honeypot trap (`honeypot_company_url`) blocks automated web scrapers.
- Pre-selects default product based on landing page context (`defaultProduct="Moringa Powder"` or `"Dehydrated Red Onion Powder"`).

### 4.2 Critical Conversion Flaw: Silent Fallback on API Error
- **Audit Finding:**
  ```javascript
  // src/components/B2BRFQForm.jsx (Lines 193-220)
  } else {
    // Controlled fallback with generated inquiry ID
    const fallbackInq = `AAF-INQ-2026-${Math.floor(100000 + Math.random() * 900000)}`
    setSubmitted(true)
    setSubmissionResult({ inquiryId: fallbackInq, ... })
  }
  ```
- **Hazard:** If the backend endpoint `/api/save-lead` returns an HTTP 500 error or is unreachable, the form catches the failure, displays a green checkmark, and tells the buyer: *"Thank you! Your quotation request has been queued under AAF-INQ-2026-XXXXXX"*.
- **Consequence:** The buyer closes the tab expecting a quotation, but the inquiry is **NOT saved to Supabase** and **no email is sent to `sales@avaniagrofoods.com`** unless the buyer happens to click the WhatsApp link.
- **Urgent Recommendation:** The fallback should visibly alert the user: *"Network delay saving inquiry to CRM. Please click below to send your quotation directly via WhatsApp or email sales@avaniagrofoods.com to guarantee instant confirmation."*

---

## 5. Specification Register & Owner Confirmation Checklist

The following parameters appear on the live landing pages and must be formally verified with the business owner:

| Parameter | Displayed Value | Audit Classification | Action Required from Owner |
| :--- | :--- | :--- | :--- |
| **Moringa Mesh Sizing** | 80–100 Mesh (120 Mesh on request) | Needs Confirmation | Confirm partner milling equipment sieve size standard. |
| **Moringa Moisture** | ≤ 7.0% | Standard Industry Fact | Confirm standard moisture test limit on current partner lot. |
| **Moringa Protein** | 25.0%–28.0% | Indicative Lab Range | Provide typical NABL test certificate for protein content. |
| **Onion Mesh Sizing** | 60–80 Mesh | Standard Industry Fact | Confirm pulverizer mesh standard at partner dehydrator. |
| **Onion Moisture** | ≤ 6.0% | Standard Industry Fact | Confirm whether moisture barrier bags include desiccants. |
| **FCL Container Weight** | 8–10 MT (Moringa) / 14–16 MT (Onion) | Standard Maritime Fact | Confirm maximum palletized stuffing weight with freight forwarder. |
| **Minimum Order Quantity** | 100 kg Trial Consignment | Business Rule | Confirm whether 100 kg trial order is commercially accepted. |
| **Indicative Pricing** | Moringa: $6.50–$12.00 / Onion: $3.20–$5.80 | In Schema Markup | Verify current market price ranges for 2026 container contracts. |

---

## 6. Actionable Implementation Recommendations

### Priority 1: High-Impact Internal Link Injection (Immediate)
- Modify `src/data/articles/moringaArticles.js` and `src/data/articles/onionArticles.js`:
  - Replace generic links to `/catalog/...` with prominent contextual links to `/moringa-powder-bulk-supplier-india` and `/red-onion-powder-bulk-supplier-india`.
  - Add a sticky floating CTA banner on each article: *"Sourcing Bulk [Product]? View Full Export Specifications & Request FOB/CIF Quote →"*.

### Priority 2: Fix Silent Form Fallback (Security & Lead Assurance)
- Update `B2BRFQForm.jsx` and `B2BQuickEnquiry.jsx`:
  - When API returns an error, do NOT mask it with a synthetic success state.
  - Display an interactive fallback card offering one-click WhatsApp dispatch with all filled form parameters pre-encoded in the URL.

### Priority 3: Add Express 4-Field Mobile RFQ
- On screens `< 768px`, show a segmented toggle at the top of `#rfq-section`:
  - `[ Express RFQ (4 Fields) ]` | `[ Detailed Commercial Specification (10 Fields) ]`
  - Reduces mobile abandonment by an estimated 35–45%.
