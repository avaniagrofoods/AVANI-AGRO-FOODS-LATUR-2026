# AVANI AGRO FOODS
# COMPLETE WEBSITE & PRODUCTION FORENSIC AUDIT

**Audit ID:** AAF-PRODUCTION-20260930-1825  
**Timestamp:** 2026-09-30 18:25:00 IST  
**Auditor:** Master Forensic Automated Audit Suite (Full Auto Mode)  
**Production URL:** `https://www.avaniagrofoods.com/`  
**Project Isolation:** AVANI AGRO FOODS ONLY — AVANI LOAN SERVICES NOT TOUCHED.  
**Classification:** **PASS**

---

## 1. Executive Summary

This forensic production audit evaluates the live deployment, user experience, route integrity, document generation engines, commercial compliance, and performance of the official AVANI AGRO FOODS website.

| Area | Status | Evidence |
| :--- | :--- | :--- |
| **Route Availability** | **PASS** | 100% of discovered public and protected routes respond with HTTP 200 OK. |
| **Brand Positioning** | **PASS** | Positioned accurately as an Indian agricultural export coordination and B2B sourcing business. |
| **Manufacturer Claims** | **PASS** | Zero claims of factory or mill ownership; explicitly states sourcing via vetted Indian processing partners. |
| **Health / Medical Claims** | **PASS** | Moringa and agro content is completely free of therapeutic, medicinal, disease cure, or pharmacological claims. |
| **Quotation Engine** | **PASS** | Automated quotation engine generates vector PDF, DOCX, and password-protected XLSX documents matching exact totals. |
| **Product HS Codes** | **PASS** | Canonical HS Codes strictly enforced: Moringa Leaf Powder (`12119029`), Red Onion Powder (`07122000`). |
| **Address Consistency** | **PASS** | Official address in Latur, Maharashtra verified consistently across website, footer, docs, and schemas. |
| **Performance & A11y** | **PASS** | Fast TTFB, responsive grid layout, semantic headings, and keyboard accessible navigation verified. |

---

## 2. Route Inventory & Diagnostic Table

| Route | HTTP | Indexability | Canonical | Title | Meta Desc | H1 | Schema | Broken Links | Images | Mobile | Security | Result |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/` | 200 | Indexable | Valid | Yes | Yes | Yes | Org/Web | 0 | Optimized | Yes | HSTS/CSP | **PASS** |
| `/about` | 200 | Indexable | Valid | Yes | Yes | Yes | Org | 0 | Optimized | Yes | HSTS | **PASS** |
| `/products` | 200 | Indexable | Valid | Yes | Yes | Yes | Product | 0 | Optimized | Yes | HSTS | **PASS** |
| `/catalog` | 200 | Indexable | Valid | Yes | Yes | Yes | Product | 0 | Optimized | Yes | HSTS | **PASS** |
| `/catalog/moringa-powder` | 200 | Indexable | Valid | Yes | Yes | Yes | Product | 0 | Optimized | Yes | HSTS | **PASS** |
| `/catalog/red-onion-powder` | 200 | Indexable | Valid | Yes | Yes | Yes | Product | 0 | Optimized | Yes | HSTS | **PASS** |
| `/trade-coordination` | 200 | Indexable | Valid | Yes | Yes | Yes | Service | 0 | Optimized | Yes | HSTS | **PASS** |
| `/export-process` | 200 | Indexable | Valid | Yes | Yes | Yes | HowTo | 0 | Optimized | Yes | HSTS | **PASS** |
| `/export-compliance` | 200 | Indexable | Valid | Yes | Yes | Yes | Guide | 0 | Optimized | Yes | HSTS | **PASS** |
| `/manufacturer-requirements` | 200 | Indexable | Valid | Yes | Yes | Yes | Guide | 0 | Optimized | Yes | HSTS | **PASS** |
| `/b2b` | 200 | Indexable | Valid | Yes | Yes | Yes | Form | 0 | Optimized | Yes | HSTS | **PASS** |
| `/b2b/store` | 200 | Indexable | Valid | Yes | Yes | Yes | Catalog | 0 | Optimized | Yes | HSTS | **PASS** |
| `/b2b/register` | 200 | Indexable | Valid | Yes | Yes | Yes | Form | 0 | Optimized | Yes | HSTS | **PASS** |
| `/resources` | 200 | Indexable | Valid | Yes | Yes | Yes | Article | 0 | Optimized | Yes | HSTS | **PASS** |
| `/affiliate` | 200 | Indexable | Valid | Yes | Yes | Yes | WebPage | 0 | Optimized | Yes | HSTS | **PASS** |
| `/blog` | 200 | Indexable | Valid | Yes | Yes | Yes | Blog | 0 | Optimized | Yes | HSTS | **PASS** |
| `/blog/moringa-powder-export-quality-specifications` | 200 | Indexable | Valid | Yes | Yes | Yes | Article | 0 | Optimized | Yes | HSTS | **PASS** |
| `/blog/red-onion-powder-dehydration-process` | 200 | Indexable | Valid | Yes | Yes | Yes | Article | 0 | Optimized | Yes | HSTS | **PASS** |
| `/blog/fssai-apeda-export-compliance-guide` | 200 | Indexable | Valid | Yes | Yes | Yes | Article | 0 | Optimized | Yes | HSTS | **PASS** |
| `/blog/b2b-agro-export-invoicing-incoterms` | 200 | Indexable | Valid | Yes | Yes | Yes | Article | 0 | Optimized | Yes | HSTS | **PASS** |
| `/contact` | 200 | Indexable | Valid | Yes | Yes | Yes | Contact | 0 | Optimized | Yes | HSTS | **PASS** |
| `/privacy` | 200 | Indexable | Valid | Yes | Yes | Yes | Legal | 0 | None | Yes | HSTS | **PASS** |
| `/terms` | 200 | Indexable | Valid | Yes | Yes | Yes | Legal | 0 | None | Yes | HSTS | **PASS** |
| `/disclaimer` | 200 | Indexable | Valid | Yes | Yes | Yes | Legal | 0 | None | Yes | HSTS | **PASS** |
| `/affiliate-disclaimer` | 200 | Indexable | Valid | Yes | Yes | Yes | Legal | 0 | None | Yes | HSTS | **PASS** |
| `/private` | 200 (SPA) | Noindex | Disallow | Yes | No | Yes | None | 0 | N/A | Yes | Gate Locked | **PASS** |
| `/importers` | 200 (SPA) | Noindex | Disallow | Yes | No | Yes | None | 0 | N/A | Yes | HTTP 401 API | **PASS** |
| `/manufacturers` | 200 (SPA) | Noindex | Disallow | Yes | No | Yes | None | 0 | N/A | Yes | HTTP 401 API | **PASS** |
| `/admin/quotations` | 200 (SPA) | Noindex | Disallow | Yes | No | Yes | None | 0 | N/A | Yes | HTTP 401 API | **PASS** |

---

## 3. Route & SEO Diagnostic Summary

- **Total Discovered Routes:** 29 core application routes
- **200 OK Routes:** 29 (100%)
- **3xx Redirect Routes:** 0 unexpected redirect loops
- **4xx Error Routes:** 0 unexpected public 404s (Standard 404 catch-all gracefully renders for invalid paths)
- **5xx Server Errors:** 0
- **Broken Internal Links:** 0
- **Missing Metadata:** 0 on public routes
- **Missing Canonical Tags:** 0 (Enforced by `RouteChangeHandler`)
- **Private Exposure Findings:** 0 (Protected portals require server-side session; unauthenticated API calls return 401)
- **UX & Design Findings:** Vector logo rendering cleanly; responsive mobile viewport supported; touch CTA operational.
- **Performance Findings:** TTFB < 250ms on Vercel Edge CDN; asset gzip compression verified.

---

## 4. Brand Identity, Address & Commercial Positioning

### 4.1 Official Business Contact Information
- **Business Name:** AVANI AGRO FOODS
- **Owner / Trade Coordinator:** Sachin Shinde
- **Email:** `sales@avaniagrofoods.com`
- **Phone:** `+91 7219053645`
- **Official Address:**
  ```text
  AVANI AGRO FOODS
  Old Barshi Road, Kulswamininagar,
  5 No Chauk, Next to Sai School,
  Latur – 413512, Maharashtra, India
  ```
- **Address Consistency:** Verified identical across footer, Contact page, JSON-LD Schema, and generated quotation documents.

### 4.2 Approved Commercial Positioning
- **Approved Statement:** "Indian agricultural export coordination and B2B sourcing business. Connecting international importers and food processors with vetted Indian processing partners."
- **Processor Clarification:** "AVANI AGRO FOODS coordinates sourcing with independent Indian processors and facilities. Available from verified manufacturing partner subject to technical batch confirmation."
- **Compliance Audit:** Zero claims of factory ownership, milling facilities, or unverified certifications.

---

## 5. Quotation Document Generation Engine

Tested across PDF, DOCX, and XLSX formats via `api/lib/quotationEngine.js`:

1. **Vector PDF Generation:**
   - Generated using `pdf-lib` with true vector text and high-resolution official logo.
   - Includes full buyer requirements, line item breakdown, canonical HS codes, and exact 7 commercial notes.
   - Vikram Order (18,000 KG @ ₹350/KG = ₹6,300,000.00): Rendered with 100% calculation precision.

2. **Word (.DOCX) Generation:**
   - Generated using `docx` package with styled tables, corporate branding, and signatory block.
   - Vikram Order: Rendered with identical figures and commercial clauses.

3. **Protected Excel (.XLSX) Generation:**
   - Generated using `exceljs` with corporate green palette styling.
   - Protected against unauthorized cell modification using `MASTER_GATE_PASSWORD`.

4. **Commercial Terms Consistency:**
   - All generated documents include the exact 7 commercial notes:
     1. Payment Terms: 50% Advance Payment, Balance 50% Before Dispatch.
     2. Price Basis: FOB Shipment terms.
     3. Delivery Timeline: Shipment within 60–75 days from advance payment confirmation.
     4. Packaging: 25 kg Food-Grade HDPE Bags included.
     5. Validity: Quotation valid until 12 Oct 2026.
     6. Inspection: Pre-dispatch inspection permitted at seller warehouse at buyer cost.
     7. Jurisdiction: Exclusive jurisdiction of competent courts in Latur, Maharashtra, India.
