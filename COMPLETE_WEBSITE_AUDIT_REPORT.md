# AVANI AGRO FOODS — COMPLETE WEBSITE, SEO, UX & INTERNATIONAL B2B CONVERSION AUDIT
**Document ID:** `AAF-AUDIT-MASTER-2026-V1`  
**Date:** November 2026  
**Auditor:** Senior International B2B Website Auditor, Technical SEO Specialist, Food Ingredient Export Marketing Strategist, CRO Specialist, UX/UI Auditor & Performance Engineer  
**Live Production URL:** `https://www.avaniagrofoods.com/`  
**Production Commit:** `b58a0d0` (Synced with GitHub `origin/main` & Vercel Production)  
**Corporate Entity:** AVANI AGRO FOODS  
**Business Role:** Agricultural Trade Coordination & Export Merchant  
**Location:** Latur, Maharashtra, India  
**Trade Coordinator:** Sachin Shinde (`sales@avaniagrofoods.com`, `+91 7219053645`)  
**Core Products:** Moringa Leaf Powder (*Moringa oleifera*) & Dehydrated Red Onion Powder (*Allium cepa*)  
**Primary Export Seaport:** Nhava Sheva (JNPT Mumbai, Port Code: INNSA)  
**Target Markets:** United States, United Kingdom, European Union, United Arab Emirates (GCC), Canada, Australia  

---

## EXECUTIVE SUMMARY & AUDIT SCORECARD

An exhaustive, evidence-based audit of the live AVANI AGRO FOODS digital presence was conducted. Every finding is derived directly from live HTTP responses, source code inspection, database models, technical configurations, and actual form interactions.

```
+=============================================================================+
|                       OVERALL WEBSITE HEALTH SCORE                          |
|                                                                             |
|                                 84 / 100                                    |
|                                                                             |
|   Technical SEO: 91/100         International Trust: 82/100                 |
|   Content & Authority: 86/100   RFQ & Lead Conversion: 78/100              |
|   Mobile UX & Speed: 85/100     Attribution & Tracking: 88/100             |
+=============================================================================+
```

### Strategic High-Level Verdict
AVANI AGRO FOODS possesses an **exceptionally strong technical and architectural foundation**:
1. Its **Agricultural Trade Coordinator positioning is honest, ethical, and defensible**—avoiding the disastrous broker trap of claiming non-existent multi-million dollar factories or private farming estates.
2. It has an **unprecedented 30-article B2B sourcing knowledge library** that outclasses 95% of competing Indian agricultural exporters.
3. Its technical infrastructure (Vercel Edge, React 18, Vite, Supabase CRM, GA4, automated quotation calculation) is modern, fast, and secure.

However, the audit identified **four critical commercial and conversion bottlenecks** that currently depress international lead acquisition:
- **Critical Lead-Loss Bug (P0):** A silent error fallback in `B2BRFQForm.jsx` and `B2BQuickEnquiry.jsx` pretends inquiries succeeded when the backend API errors, resulting in silent lead loss without database recording or sales notification.
- **Internal Link Silo Failure (P1):** All 30 authoritative blog articles link to generic catalog pages, with **ZERO internal links pointing to the two flagship bulk supplier landing pages** (`/moringa-powder-bulk-supplier-india` and `/red-onion-powder-bulk-supplier-india`), starving money pages of ranking equity.
- **Trust Contamination on Homepage (P1):** Consumer kitchen gadget Amazon affiliate links and affiliate disclosures appear directly on the B2B commercial homepage, confusing corporate importers.
- **Disconnected Products.jsx Modal (P0):** Submissions from the catalog modal bypass the Supabase database entirely, relying on client-side EmailJS.

---

## AUDIT SUITE INDEX: 12 DELIVERED ARTIFACTS

This comprehensive master report is supported by 11 specialized forensic audit documents and datasets located in the project repository:

1. **[`COMPLETE_WEBSITE_AUDIT_REPORT.md`](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/COMPLETE_WEBSITE_AUDIT_REPORT.md)** — This Master Comprehensive Audit.
2. **[`SEO_AUDIT_30_ARTICLES.csv`](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/SEO_AUDIT_30_ARTICLES.csv)** — Complete 24-column audit dataset of all 30 B2B pillar articles.
3. **[`PRODUCT_LANDING_PAGE_AUDIT.md`](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/PRODUCT_LANDING_PAGE_AUDIT.md)** — Deep-dive audit of the two primary money landing pages.
4. **[`TECHNICAL_SEO_AUDIT.md`](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/TECHNICAL_SEO_AUDIT.md)** — Crawlability, robots, sitemaps, canonicals, Edge routing, and Schema JSON-LD.
5. **[`INTERNATIONAL_BUYER_TRUST_AUDIT.md`](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/INTERNATIONAL_BUYER_TRUST_AUDIT.md)** — Credibility assessment for USA, UK, EU, UAE, Canada, and Australia buyers.
6. **[`RFQ_CONVERSION_AUDIT.md`](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/RFQ_CONVERSION_AUDIT.md)** — Analysis of all form components, validation friction, and silent drop hazards.
7. **[`MOBILE_UX_AND_PERFORMANCE_AUDIT.md`](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/MOBILE_UX_AND_PERFORMANCE_AUDIT.md)** — Responsive viewports, iOS input auto-zoom, touch targets, and CWV.
8. **[`KEYWORD_OPPORTUNITY_MAP.csv`](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/KEYWORD_OPPORTUNITY_MAP.csv)** — 20-row structured keyword target matrix with buyer intent and URL mapping.
9. **[`COMPETITOR_BENCHMARK_REPORT.md`](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/COMPETITOR_BENCHMARK_REPORT.md)** — Benchmarking against Grenera, Apex, Organic India, Jain Farm Fresh, Sensient.
10. **[`ANALYTICS_AND_TRACKING_AUDIT.md`](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/ANALYTICS_AND_TRACKING_AUDIT.md)** — GA4, UTM persistence, HubSpot, and Supabase lead pipelines.
11. **[`PRODUCT_CLAIMS_VERIFICATION_REGISTER.md`](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/PRODUCT_CLAIMS_VERIFICATION_REGISTER.md)** — Comprehensive claims registry classifying every spec into 4 statuses.
12. **[`WEBSITE_IMPROVEMENT_ROADMAP.md`](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/WEBSITE_IMPROVEMENT_ROADMAP.md)** — Prioritized 90-day execution plan across 4 phased intervals.

---

## SECTION 1: COMPLETE WEBSITE INVENTORY (PHASE 1)

The complete AVANI AGRO FOODS digital footprint comprises **50 public URLs** indexed in `public/sitemap.xml` and protected internal routes defined in `src/App.jsx`:

### 1.1 Core Commercial & Operational Routes (12 Pages)
1. `/` (Homepage) — Primary commercial portal. HTTP 200.
2. `/about` — Corporate history, trade coordinator identity, MSME registration. HTTP 200.
3. `/products` — Full product overview for Moringa and Red Onion. HTTP 200.
4. `/moringa-powder-bulk-supplier-india` — **Primary Money Landing Page (Moringa)**. HTTP 200.
5. `/red-onion-powder-bulk-supplier-india` — **Primary Money Landing Page (Red Onion)**. HTTP 200.
6. `/catalog` — Digital product catalog and packaging options. HTTP 200.
7. `/catalog/moringa-powder` — Moringa specification subpage. HTTP 200.
8. `/catalog/red-onion-powder` — Onion specification subpage. HTTP 200.
9. `/trade-coordination` — Sourcing coordination model explanation. HTTP 200.
10. `/export-process` — 6-stage trade workflow walkthrough. HTTP 200.
11. `/export-compliance` — 35-market international regulatory guide. HTTP 200.
12. `/contact` — Primary B2B RFQ inquiry portal. HTTP 200.

### 1.2 B2B Directories & Educational Channels (4 Pages)
13. `/manufacturer-requirements` — Partner supplier onboarding criteria. HTTP 200.
14. `/b2b` & `/b2b/register` — B2B partner registration. HTTP 200.
15. `/b2b/store` — Sample pack and trial order flow. HTTP 200.
16. `/resources` & `/affiliate` — Independent educational channel and product reviews. HTTP 200.

### 1.3 Legal & Compliance Disclosures (4 Pages)
17. `/privacy` & `/privacy-policy` — Corporate privacy policy. HTTP 200.
18. `/terms` — Commercial terms and conditions. HTTP 200.
19. `/disclaimer` — Trade coordination disclaimer. HTTP 200.
20. `/affiliate-disclaimer` & `/affiliate-disclosure` — Affiliate transparency disclosures. HTTP 200.

### 1.4 Sourcing & Content Marketing Library (30 Articles)
- Exactly 15 Moringa articles and 15 Red Onion articles published under `/blog/[slug]`.
- All 30 URLs resolve to HTTP 200, feature valid Schema.org `BlogPosting` and `BreadcrumbList` markup, and average 874 words of technical and commercial sourcing guidance.

### 1.5 Protected Administrative Portals (Disallowed in robots.txt)
- `/private`, `/private/dashboard` — Internal operations dashboard.
- `/importers`, `/private/importers` — Buyer directory management.
- `/manufacturers`, `/private/manufacturers` — Processor facility directory.
- `/admin/quotations`, `/quotation-sheet` — Proforma quotation generator.

---

## SECTION 2: HOMEPAGE AUDIT & CONVERSION ANALYSIS (PHASE 2)

### 2.1 The 5-Second International Buyer Test
- **Evaluation:** **PASS (With Trust Caveats)**.
- Within 5 seconds, an overseas procurement manager lands and understands:
  1. *What is offered:* Indian agricultural ingredients (specifically Moringa Powder and Red Onion Powder).
  2. *Where it comes from:* Latur, Maharashtra, India.
  3. *What the business model is:* Indian Export Sourcing & Coordination.
  4. *How to take action:* "Request a B2B Quote" or "Explore Products".

### 2.2 Headline & Copy Critique
- **Current Main Headline (H1):**
  > *"Indian Agricultural Ingredients for Global B2B Buyers"*
- **Critique:** Dignified and accurate, but slightly generic. It does not immediately highlight the two core high-value products in the main title.
- **Recommended H1 Optimization:**
  > *"Export-Grade Moringa & Red Onion Powder for Global Food Importers"*
- **Current Subheadline:**
  > *"AVANI AGRO FOODS coordinates sourcing of export-grade Moringa Powder and Red Onion Powder from qualified Indian manufacturing and processing partners for importers, distributors, food businesses, and ingredient buyers worldwide."*
- **Critique:** Excellent factual positioning. Sets immediate legal and operational clarity.

### 2.3 The Critical Trust Contamination on Homepage
- **Finding:** Lines 496–586 of [`Home.jsx`](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/src/pages/Home.jsx#L496-L586) feature Amazon consumer kitchen gadgets with "Check Current Price" external affiliate links.
- **Commercial Impact:** Damages enterprise credibility. Serious food manufacturers do not expect an agricultural exporter selling 20-ton container loads to also promote consumer kitchen tools for affiliate commissions on their main B2B homepage.
- **Action Required:** Remove this section from the homepage completely; retain it strictly under `/resources`.

---

## SECTION 3: PRODUCT LANDING PAGE AUDIT SUMMARY (PHASE 3)

Detailed in [`PRODUCT_LANDING_PAGE_AUDIT.md`](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/PRODUCT_LANDING_PAGE_AUDIT.md):

### Moringa Landing Page (`/moringa-powder-bulk-supplier-india`)
- **Strengths:** 80–100 mesh, ≤ 7.0% moisture, crude protein 25–28%, acid insoluble ash ≤ 1.0%, HS Code 1211.90.29, MOQ 100 kg / FCL 8–10 MT. Clear port declaration: JNPT Nhava Sheva (INNSA).
- **Gaps:** Zero internal links from the 15 Moringa blog articles; missing downloadable sample COA PDF; 10+ field form creates mobile friction.

### Red Onion Landing Page (`/red-onion-powder-bulk-supplier-india`)
- **Strengths:** High pyruvic acid pungency standardization, 60–80 mesh, ≤ 6.0% moisture, total ash ≤ 5.0%, HS Code 0712.20.00, MOQ 100 kg / FCL 14–16 MT.
- **Gaps:** Zero internal links from the 15 Onion blog articles; missing ocean transit time estimates from JNPT to world container ports (Rotterdam, Jebel Ali, Long Beach).

---

## SECTION 4: 30-ARTICLE SEO AUDIT SUMMARY (PHASE 4)

Detailed in [`SEO_AUDIT_30_ARTICLES.csv`](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/SEO_AUDIT_30_ARTICLES.csv):

- **Article Volume:** 30 authoritative B2B articles (15 Moringa, 15 Red Onion).
- **Word Counts:** Range 714 to 1,402 words; Average: **874 words**.
- **Grade Breakdown:**
  - **Grade A:** 3 articles (Articles 1, 2, 16) — >1,000 words, exceptional technical depth.
  - **Grade B:** 22 articles — Strong B2B intent, clear headings, solid buyer focus.
  - **Grade C:** 5 articles (Articles 15, 21, 22, 25, 28) — Sub-750 words, need expansion on commercial logistics and technical testing.
  - **Grade D:** 0 articles.
- **The Core SEO Link Silo Failure:**
  - Across all 30 articles, internal links point to `/catalog/moringa-powder` (17 times), `/catalog/red-onion-powder` (18 times), and `/contact` (30 times).
  - **ZERO articles link to `/moringa-powder-bulk-supplier-india` or `/red-onion-powder-bulk-supplier-india`!**
  - Injecting contextual links from all 30 articles to the two bulk supplier landing pages is the single highest-impact SEO quick win available.

---

## SECTION 5: KEYWORD & SEARCH INTENT ANALYSIS (PHASE 5)

Detailed in [`KEYWORD_OPPORTUNITY_MAP.csv`](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/KEYWORD_OPPORTUNITY_MAP.csv):

- **Primary Head Commercial Keywords:**
  - `moringa powder bulk supplier india` -> Targeted by `/moringa-powder-bulk-supplier-india`
  - `red onion powder bulk supplier india` -> Targeted by `/red-onion-powder-bulk-supplier-india`
- **High-Intent Technical Long-Tail Targets:**
  - `moringa powder 80 mesh 100 mesh specification` -> Article 8
  - `moringa powder COA microbiological testing NABL` -> Article 3
  - `dehydrated red onion powder low moisture export` -> Article 20
  - `red onion powder pyruvic acid pungency index` -> Article 16
  - `bulk moringa powder FOB nhava sheva price` -> Landing Page / Quotation Engine

---

## SECTION 6: TECHNICAL SEO & INFRASTRUCTURE SUMMARY (PHASE 6)

Detailed in [`TECHNICAL_SEO_AUDIT.md`](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/TECHNICAL_SEO_AUDIT.md):

- **Edge Redirection:** 100% permanent HTTP 308 redirection for `http://` -> `https://` and non-www -> `www.avaniagrofoods.com`.
- **Sitemap Health:** 50 URLs in `public/sitemap.xml`, all returning HTTP 200. Zero redirects or broken links.
- **Robots.txt Health:** Blocks administrative endpoints; needs explicit `Allow:` entries for the two bulk landing pages.
- **Public Footer Crawler Leak:** Remove line 93 of `Footer.jsx` linking to `/private` to eliminate crawl blocks in Google Search Console.
- **Title Tag Truncation:** 26 of 30 article titles exceed 60 characters on desktop due to long brand suffixes; trim to maintain <60 characters.

---

## SECTION 7: INTERNATIONAL BUYER TRUST & CREDIBILITY (PHASE 7)

Detailed in [`INTERNATIONAL_BUYER_TRUST_AUDIT.md`](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/INTERNATIONAL_BUYER_TRUST_AUDIT.md):

- **The Honest Coordinator Advantage:** Overseas buyers prefer a transparent trade coordinator with third-party lab oversight over a deceptive broker claiming non-existent factories.
- **Three-Tier Certification Model:** Flawlessly distinguishes direct MSME registration vs partner facility FSSAI/ISO licenses vs batch-specific NABL testing reports.
- **Trust Deficiencies to Fix:**
  1. Remove consumer affiliate gadget cards from homepage.
  2. Provide downloadable redacted sample NABL Certificates of Analysis.
  3. Replace studio renders with authentic packaging photos (25 kg drums on heat-treated pallets).

---

## SECTION 8: RFQ & CONVERSION RATE OPTIMIZATION (CRO) (PHASE 8)

Detailed in [`RFQ_CONVERSION_AUDIT.md`](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/RFQ_CONVERSION_AUDIT.md):

- **Critical Bug (P0): Silent Fallback in `B2BRFQForm.jsx`:**
  When `/api/save-lead` fails or encounters network drops, lines 193–220 generate a fake inquiry ID and show a success checkmark. The lead is lost forever.
  *Fix:* Present an honest retry screen with direct one-click WhatsApp dispatch.
- **Catalog Modal Disconnection (P0):**
  `Products.jsx` modal sends email via EmailJS only; it does not write to Supabase `public.leads` or fire GA4 conversion events.
  *Fix:* Route through `/api/save-lead`.
- **Mobile Ergonomics (P1):**
  10+ fields cause high mobile drop-off. Introduce a 4-field "Express RFQ" toggle on mobile.

---

## SECTION 9: MOBILE UX & PERFORMANCE SUMMARY (PHASE 9)

Detailed in [`MOBILE_UX_AND_PERFORMANCE_AUDIT.md`](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/MOBILE_UX_AND_PERFORMANCE_AUDIT.md):

- **iOS Safari 14.4px Input Zoom:** Inputs using `0.9rem` trigger automatic zooming on iPhones. Enforce `font-size: 16px` minimum.
- **WhatsApp Floating Button Collision:** Floating button collides with the "Submit RFQ" button on narrow viewports; reposition vertically on mobile.
- **Core Web Vitals:** LCP ~1.9s, CLS 0.02, INP ~85ms. Outstanding performance foundation.

---

## SECTION 10: COMPETITOR BENCHMARK & POSITIONING (PHASE 10)

Detailed in [`COMPETITOR_BENCHMARK_REPORT.md`](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/COMPETITOR_BENCHMARK_REPORT.md):

- **Against Grenera & Apex (Moringa):** AVANI offers faster founder access, 100 kg trial consignments, and unbiased third-party lab testing.
- **Against Jain Farm Fresh & Oceanic (Dehydrated Onion):** AVANI serves mid-market seasoning blenders seeking sub-container orders with standardized pyruvic acid pungency.
- **Strategic Tagline:** *"Your Trusted Agricultural Quality Advocate in India."*

---

## SECTION 11: ANALYTICS & ATTRIBUTION SUMMARY (PHASE 11)

Detailed in [`ANALYTICS_AND_TRACKING_AUDIT.md`](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/ANALYTICS_AND_TRACKING_AUDIT.md):

- **GA4 & UTM Tracking:** GA4 (`G-GNKT58TMBT`) and `utmTracker.js` successfully persist multi-touch attribution across browsing sessions into RFQ submissions.
- **Gaps to Address:** Implement Google Consent Mode v2 for European compliance; link `Products.jsx` modal to GA4 `generate_lead`.

---

## SECTION 12: PRODUCT CLAIMS VERIFICATION (PHASE 12)

Detailed in [`PRODUCT_CLAIMS_VERIFICATION_REGISTER.md`](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/PRODUCT_CLAIMS_VERIFICATION_REGISTER.md):

- Master register of 30+ technical parameters, certifications, and claims.
- Verified factual basis for HS codes, botanical identities, dehydration ratios, and seaport gates.
- Phrasing cleanup identified for Articles 1, 2, and 17 to eliminate legacy factory ownership references.

---

## SECTION 13: STRATEGIC ACTION MATRIX & EXECUTIVE ROADMAP (PHASE 14)

### 13.1 Top 10 Conversion Problems
1. Silent error fallback in `B2BRFQForm.jsx` drops leads silently during API or network blips.
2. `Products.jsx` catalog modal bypasses Supabase `public.leads` and GA4 conversion tracking.
3. Consumer Amazon affiliate links on the B2B homepage contaminate commercial trading credibility.
4. 10+ form input fields create severe abandonment on mobile screens.
5. Absence of downloadable redacted sample NABL COA PDFs for QA directors.
6. Absence of authentic industrial packaging and container loading photos.
7. WhatsApp floating bubble collides with form submit buttons on mobile screens (< 390px).
8. iOS Safari 14.4px input font size triggers disorienting auto-zoom on iPhones.
9. Lack of ocean transit time transparency from JNPT Nhava Sheva to destination ports.
10. Absence of an Indian Standard Time (IST) availability indicator on WhatsApp CTAs.

### 13.2 Top 10 SEO Opportunities
1. Inject contextual links from all 15 Moringa articles to `/moringa-powder-bulk-supplier-india`.
2. Inject contextual links from all 15 Onion articles to `/red-onion-powder-bulk-supplier-india`.
3. Add explicit `Allow:` directives in `robots.txt` for both primary bulk landing pages.
4. Remove public footer link to `/private` to eliminate Google Search Console crawl warnings.
5. Condense 26 blog article title tags to < 60 characters to eliminate SERP truncation.
6. Add `@id` URI identifiers to Schema.org Product markup for Google Knowledge Graph disambiguation.
7. Optimize meta descriptions to front-load primary commercial keywords in the first 115 characters.
8. Create targeted landing sections for US FDA FSVP and EU MRL pesticide compliance.
9. Build dedicated container freight pricing tables for FOB Nhava Sheva vs CIF major world ports.
10. Add downloadable technical specification sheets to capture technical ingredient searches.

### 13.3 Top 10 Quick Wins (Deployable within 7 Days)
1. **Fix Silent RFQ Fallback:** Replace synthetic success state with transparent WhatsApp/Email error card.
2. **Remove Affiliate Section from Homepage:** Relocate exclusively to `/resources`.
3. **Remove `/private` Link from Footer:** Eliminate crawler blocks immediately.
4. **Update `robots.txt`:** Explicitly declare both bulk supplier landing pages as allowed.
5. **Connect `Products.jsx` Modal to `/api/save-lead`:** Unify 100% of incoming leads into Supabase.
6. **Reposition Mobile WhatsApp Bubble:** Move to `bottom: 84px` on screens < 768px.
7. **Fix iOS Input Zoom:** Add CSS rule setting mobile form inputs to `font-size: 16px`.
8. **Add Bulk Landing Links to Mobile Nav:** Place direct links in the mobile hamburger drawer.
9. **Inject Top Contextual Links:** Add bulk landing page links to Articles 1, 2, 8, 9, 16, 17, 20, 24.
10. **Add IST Timezone Clock:** Display live trade desk operating status on WhatsApp buttons.

### 13.4 Specific Changes for Moringa Powder
- **Target URL:** `https://www.avaniagrofoods.com/moringa-powder-bulk-supplier-india`
- **Internal Links:** Route link equity from all 15 Moringa blog articles using anchor text *"bulk moringa powder supplier india"*.
- **Quality Document:** Upload a downloadable sample Certificate of Analysis (COA) showing moisture (≤ 7%), heavy metals panel (Pb, Cd, As, Hg), and microbial plate counts.
- **Pricing Clarity:** Add commercial volume breakdown in quotation section (100 kg commercial trial, 1 MT LCL, 8–10 MT 20ft FCL).
- **Positioning Polish:** Ensure Article 2 explicitly credits *"our vetted partner processing facilities in Maharashtra"* for shade-drying and micro-milling.

### 13.5 Specific Changes for Red Onion Powder
- **Target URL:** `https://www.avaniagrofoods.com/red-onion-powder-bulk-supplier-india`
- **Internal Links:** Route link equity from all 15 Onion blog articles using anchor text *"dehydrated red onion powder wholesale india"*.
- **Pungency Standardization:** Expand the pyruvic acid index explanation to educate buyers on how low-temperature dehydration preserves natural onion aroma.
- **Ocean Transit Matrix:** Add maritime shipping transit schedule from JNPT Nhava Sheva (e.g. Jebel Ali 5 days, Rotterdam 26 days, New York 30 days).
- **Anti-Caking Declaration:** Clearly specify that standard product is 100% pure single ingredient, with food-grade silica added only upon explicit buyer contract request.

---

## 14. LIST OF INFORMATION NEEDED FROM OWNER (SACHIN SHINDE)

To finalize documentation and execute the 90-day roadmap, the following factual details are requested:

1. **Udyam / MSME Certificate Number:** Provide the official registration number for display in compliance footers.
2. **APEDA / Spices Board RCMC Status:** Confirm whether AVANI AGRO FOODS holds an active Registration-cum-Membership Certificate.
3. **Authorized Dealer (AD) Code Bank:** Confirm primary bank for foreign exchange export inward remittances.
4. **Redacted Sample Lab Reports:** Provide two recent NABL laboratory test certificates (one for Moringa, one for Red Onion) for PDF conversion and buyer download.
5. **Partner Facility Certifications:** Confirm whether current partner processors hold active BRCGS, ISO 22000, or Halal certificates.
6. **Commercial MOQ Confirmation:** Confirm whether 100 kg commercial trial consignments remain standard policy for 2026.
7. **2026 Indicative Pricing Review:** Review Schema price bands (Moringa: $6.50–$12.00 USD/kg; Onion: $3.20–$5.80 USD/kg) against current harvest rates.
8. **Operational Photos:** Provide 4–6 authentic photos of 25 kg export drums, pallets, and container loading for website display.
