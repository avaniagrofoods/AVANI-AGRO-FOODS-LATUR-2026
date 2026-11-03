# AVANI AGRO FOODS — PHASE 1: WEBSITE & CONVERSION BASELINE AUDIT
**Project:** International B2B Lead Generation System  
**Branch:** `feat/b2b-lead-generation-system`  
**Base Commit / Rollback Point:** `b89ca6f`  
**Active Production Deployment:** `dpl_8tTAn3VBwbgimqD23rRMPzJy4b6S` (Vercel Production)  
**Production Domain:** [https://www.avaniagrofoods.com/](https://www.avaniagrofoods.com/)  
**Date:** November 3, 2026  

---

## 1. Executive Summary & Repository Inspection

An exhaustive baseline audit of the existing live production website was conducted prior to any code modifications. The platform is built on **Vite 5.4.21**, **React 18.3.1**, **React Router 6.26.2**, and **Vercel Serverless Functions** (`/api/*`).

### Critical Protection Baseline
- **Existing Articles:** 30 comprehensive B2B articles (15 Moringa Powder, 15 Red Onion Powder).
- **Physical Image Assets:** 39 verified WebP assets in `public/blog/` (30 article featured, 6 supporting, 3 optimized thumbnails).
- **Existing URLs & Canonical Tags:** All 30 articles verified with 100% self-referencing canonical tags and zero broken links.
- **Backup Created:** Complete snapshot of critical files persisted in `backups/pre-b2b-lead-system-20261103/`.
- **Baseline Metadata Captured:** Codified in [`docs/audits/lead-generation/BASELINE_30_ARTICLES_INVENTORY.json`](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/docs/audits/lead-generation/BASELINE_30_ARTICLES_INVENTORY.json).

---

## 2. Page & Funnel Inspection

| Page / Component | URL / Route | Current State | Identified Conversion Gaps & Weaknesses |
|:---|:---|:---|:---|
| **Homepage** | `/` | Operational, clean hero, product highlights. | Lacks direct B2B RFQ wizard; CTAs navigate away rather than capturing fast intent. |
| **Products Page** | `/products` | Informational cards with "Request Bulk Quote" modal. | Form lacks buyer role, purchasing frequency, and destination port. |
| **Catalog Pages** | `/catalog`, `/catalog/:slug` | In-depth technical specifications with disclaimers. | Direct links route to `/contact`; no specialized landing page for search traffic. |
| **Dedicated Landing Pages** | `/moringa-powder-bulk-supplier-india`<br>`/red-onion-powder-bulk-supplier-india` | **DOES NOT EXIST** | High-intent B2B search terms ("moringa bulk supplier india") have no dedicated conversion pages. |
| **30 Blog Articles** | `/blog/:slug` | 30 high-ranking guides, inline enquiry form, TOC. | CTAs link generally to `/catalog` or `/contact`; need contextual links to dedicated landing pages. |
| **Contact Page** | `/contact` | Multi-field RFQ form submitting to `/api/save-lead`. | Excellent structure, but lacks session UTM parameter capture. |
| **Enquiry APIs** | `/api/save-lead`, `/api/quotation` | Sanitization, rate limiting, quotation math active. | Email notification status deferred (`PENDING_OWNER_DEC_07`); needs server-side dispatch logic. |
| **Admin Portal** | `/private`, `/admin/quotations` | Password-gated, search, filter, CSV export. | Fully functional; needs lead status workflow (`New`, `Qualified`, `Quotation Sent`, etc.). |

---

## 3. Detailed Audit Findings

### A. Broken Conversion Paths & Missing Calls to Action
1. **Absence of Dedicated B2B Sourcing Landing Pages:** International buyers arriving via Google searches for commercial sourcing terms (e.g., "bulk moringa powder supplier india FOB", "dehydrated red onion powder export container") land either on generic product pages or educational articles without an immediate, streamlined RFQ workflow.
2. **Contextual Article CTA Optimization:** While all 30 articles feature the `B2BQuickEnquiry` form, their contextual anchor links currently point to `/catalog/moringa-powder` and `/catalog/red-onion-powder` instead of dedicated, high-converting supplier landing pages.

### B. Buyer Qualification & Attribution
1. **UTM Attribution Gap:** If a prospect arrives with campaign parameters (`?utm_source=linkedin&utm_medium=cpc&utm_campaign=moringa_q4`), navigating to another page clears the URL parameters, causing subsequent form submissions to lose source attribution.
2. **Missing B2B Buyer Fields:** The quick inquiry form currently captures volume as a free-form string without standardizing unit (kg vs metric tonnes), purchasing frequency, buyer designation, or Incoterm preference.

### C. Technical & Factual Accuracy
1. **Operating Model Transparency:** The trade coordination model is accurately articulated across the website. However, technical product claims (mesh, moisture) must remain strictly synchronized with central product specifications to avoid drift.
2. **Certification Distinction:** Udyam / MSME registration is held directly by AVANI AGRO FOODS; food processing certifications (FSSAI, ISO 22000, BRCGS, Halal) belong to partner processors and must be clearly distinguished.

---

## 4. Phase 1 Audit Conclusion & Action Plan

1. **Phase 2:** Build `/moringa-powder-bulk-supplier-india` and `/red-onion-powder-bulk-supplier-india`.
2. **Phase 3:** Upgrade RFQ form with comprehensive B2B fields, client/server validation, and session-persistent UTM attribution.
3. **Phase 4:** Centralize product specifications and refine lead management lifecycle states.
4. **Phase 5:** Implement server-side notification email logic for both internal sales and buyer acknowledgement.
5. **Phase 6:** Integrate product-specific WhatsApp routing.
6. **Phase 7–12:** Complete attribution, internal linking, automated testing, and verification.
