# AVANI AGRO FOODS
# COMPLETE WEBSITE & PRODUCTION FORENSIC AUDIT

**Audit ID:** AAF-PRODUCTION-20260930-1805  
**Timestamp:** 2026-09-30 18:05:00 IST  
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

## 2. Complete Route Inventory & HTTP Status

### 2.1 Primary Public Pages
| Route | Method | Status | Content / Purpose |
| :--- | :--- | :--- | :--- |
| `/` | GET | 200 OK | Home — B2B hero, value proposition, core product showcase |
| `/about` | GET | 200 OK | About Us — Sourcing coordination model, Sachin Shinde profile |
| `/products` | GET | 200 OK | Product directory with specifications and quotation triggers |
| `/catalog` | GET | 200 OK | B2B Product Catalog overview |
| `/catalog/moringa-powder` | GET | 200 OK | Moringa Leaf Powder technical specifications & RFQ |
| `/catalog/red-onion-powder`| GET | 200 OK | Dehydrated Red Onion Powder technical specifications & RFQ |
| `/trade-coordination` | GET | 200 OK | Trade coordination, quality verification, and export logistics |
| `/export-process` | GET | 200 OK | Step-by-step export flow from inquiry to customs dispatch |
| `/contact` | GET | 200 OK | Official contact form, WhatsApp CTA, and corporate address |

### 2.2 Compliance & Sourcing Guides
| Route | Method | Status | Content / Purpose |
| :--- | :--- | :--- | :--- |
| `/export-compliance` | GET | 200 OK | Comprehensive Indian agricultural export regulations |
| `/manufacturer-requirements` | GET | 200 OK | Vetting standards for Indian manufacturing partners |
| `/b2b` | GET | 200 OK | B2B buyer onboarding & registration form |
| `/b2b/store` | GET | 200 OK | Bulk inquiry store with unit price benchmarks |
| `/b2b/register` | GET | 200 OK | Partner registration gateway |
| `/resources` | GET | 200 OK | Export checklists, documentation guides, and trade resources |
| `/affiliate` | GET | 200 OK | Business development & referral program overview |

### 2.3 Educational Blog Articles
| Route | Method | Status | Content / Purpose |
| :--- | :--- | :--- | :--- |
| `/blog` | GET | 200 OK | B2B Agro Trade Knowledge Base |
| `/blog/moringa-powder-export-quality-specifications` | GET | 200 OK | Technical analysis of export-grade Moringa oleifera |
| `/blog/red-onion-powder-dehydration-process` | GET | 200 OK | Dehydration mechanics and moisture retention analysis |
| `/blog/fssai-apeda-export-compliance-guide` | GET | 200 OK | Regulatory compliance framework for food exporters |
| `/blog/b2b-agro-export-invoicing-incoterms` | GET | 200 OK | Incoterms (FOB, CIF, CFR) guide for international trade |

### 2.4 Legal & Compliance Pages
| Route | Method | Status | Content / Purpose |
| :--- | :--- | :--- | :--- |
| `/privacy` / `/privacy-policy` | GET | 200 OK | GDPR / Indian IT Act compliant privacy disclosure |
| `/terms` | GET | 200 OK | Commercial terms, payment terms, and Latur jurisdiction |
| `/disclaimer` | GET | 200 OK | Trade coordination & third-party processor disclaimer |
| `/affiliate-disclaimer` | GET | 200 OK | Transparent referral and affiliate partnership disclosures |

### 2.5 Protected B2B Intelligence Portals (Server Gate Guarded)
| Route | Method | Status | Protection Mechanism |
| :--- | :--- | :--- | :--- |
| `/private` / `/private/dashboard` | GET | 200 OK (SPA) | Password Gate modal blocks data until server session validates |
| `/importers` / `/private/importers` | GET | 200 OK (SPA) | Protected API `/api/importers` enforces HTTP 401 unauth block |
| `/manufacturers` / `/private/manufacturers` | GET | 200 OK (SPA) | Protected API `/api/manufacturers` enforces HTTP 401 unauth block |
| `/admin/quotations` / `/private/quotations` | GET | 200 OK (SPA) | Protected API `/api/admin-quotations` enforces HTTP 401 unauth block |
| `/quotation-sheet` | GET | 200 OK (SPA) | Protected administrative quotation builder |
| `/tools` | GET | 200 OK (SPA) | Internal trade and export calculation utility |

---

## 3. Brand Identity, Address & Commercial Positioning

### 3.1 Official Business Contact Information
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
- **Address Verification:** Verified identical in website footer, Contact page, JSON-LD Schema, and generated quotation documents.

### 3.2 Approved Commercial Positioning
- **Approved Statement:** "Indian agricultural export coordination and B2B sourcing business. Connecting international importers and food processors with vetted Indian processing partners."
- **Processor Clarification:** "AVANI AGRO FOODS coordinates sourcing with independent Indian processors and facilities. Available from verified manufacturing partner subject to technical batch confirmation."
- **Prohibited Claims Audit:** Zero claims of factory ownership, milling plants, or unauthorized international certifications found in codebase.

---

## 4. Quotation Document Generation Engine

Automated document generation tested across PDF, DOCX, and XLSX formats via `api/lib/quotationEngine.js`:

1. **Vector PDF Generation:**
   - Generated using `pdf-lib` with true vector text and high-resolution official logo.
   - Includes full buyer requirements, line item breakdown, canonical HS codes, and exact 7 commercial notes.
   - Tested Vikram Order (18,000 KG @ ₹350/KG = ₹6,300,000.00): Rendered with 100% calculation precision.

2. **Word (.DOCX) Generation:**
   - Generated using `docx` package with styled tables, corporate branding, and signatory block.
   - Tested Vikram Order: Rendered with identical figures and commercial clauses.

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
