# AVANI AGRO FOODS — 90-DAY STRATEGIC WEBSITE IMPROVEMENT ROADMAP
**Document ID:** `AAF-ROADMAP-2026-V1`  
**Date:** November 2026  
**Auditor / Strategist:** B2B Conversion Rate Optimization (CRO) Lead & Technical SEO Director  
**Business Profile:** AVANI AGRO FOODS (Agricultural Trade Coordinator & Export Merchant, Latur, Maharashtra)  
**Trade Coordinator:** Sachin Shinde (`sales@avaniagrofoods.com`, `+91 7219053645`)  

---

## 1. Executive Implementation Overview

This 90-day roadmap translates the forensic findings across all audit phases into an actionable, prioritized execution schedule. The initiatives are structured to maximize commercial lead capture, eliminate data-loss hazards, resolve mobile UX friction, and amplify organic search authority without disrupting production stability.

```
+-------------------------------------------------------------------------+
|                         90-DAY EXECUTION TIMELINE                       |
|                                                                         |
|  [Days 1–15]      [Days 16–30]          [Days 31–60]      [Days 61–90]  |
|  Phase 1: P0      Phase 2: P1           Phase 3: P2       Phase 4: P3   |
|  Lead Safety &    CRO, Mobile UX &      SEO Titles, Link  Authority &   |
|  Trust Hygiene    Form Ergonomics       Silos & Specs     Buyer Tools   |
+-------------------------------------------------------------------------+
```

---

## 2. Phase 1: Days 1–15 — Critical Lead Safety & Trust Hygiene (P0)

*Objective: Stop lead leakage, eliminate silent form errors, remove conflicting affiliate signals from B2B pages, and fix crawler security leaks.*

| Task ID | Action Description | Target File / Component | Owner Input Required | Acceptance / Verification Criteria |
| :--- | :--- | :--- | :--- | :--- |
| `ACT-01` | **Fix Silent Fallback in RFQ Forms:** Replace synthetic success state on API error with transparent retry and one-click WhatsApp/Email dispatch. | [`B2BRFQForm.jsx`](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/src/components/B2BRFQForm.jsx), [`B2BQuickEnquiry.jsx`](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/src/components/B2BQuickEnquiry.jsx) | None (Code fix) | Test: Send invalid request; verify user is prompted with emergency WhatsApp link, zero fake IDs. |
| `ACT-02` | **Unify Products.jsx Modal to `/api/save-lead`:** Replace client EmailJS with authoritative backend API call and GA4 `generate_lead` event. | [`Products.jsx`](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/src/pages/Products.jsx) | None (Code fix) | Submissions from `/products` appear in Supabase `public.leads` and trigger automated quotations. |
| `ACT-03` | **Purge Affiliate Section from B2B Homepage:** Remove consumer kitchen gadget affiliate links and affiliate disclosure from main homepage. | [`Home.jsx`](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/src/pages/Home.jsx) | Owner approval to keep affiliate links on `/resources` only | Homepage contains 100% commercial B2B sourcing content; zero Amazon referral links. |
| `ACT-04` | **Remove Admin Link from Public Footer:** Delete `<Link to="/private">🔒 Business Portal</Link>` from public footer. | [`Footer.jsx`](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/src/components/Footer.jsx) | None (Security hygiene) | Inspect DOM; verify `/private` is unlinked. Googlebot stops receiving crawl blocks. |
| `ACT-05` | **Update `robots.txt` Explicit Directives:** Add explicit `Allow: /moringa-powder-bulk-supplier-india` and `Allow: /red-onion-powder-bulk-supplier-india`. | [`public/robots.txt`](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/public/robots.txt) | None (SEO fix) | Fetch live `robots.txt`; verify both landing pages are explicitly allowed. |

---

## 3. Phase 2: Days 16–30 — CRO, Mobile UX & Form Ergonomics (P1)

*Objective: Remove mobile friction, eliminate input auto-zoom on iOS, introduce Express Mobile RFQs, and position WhatsApp as an instant conversion channel.*

| Task ID | Action Description | Target File / Component | Owner Input Required | Acceptance / Verification Criteria |
| :--- | :--- | :--- | :--- | :--- |
| `ACT-06` | **Eliminate iOS Safari 14.4px Input Zoom:** Ensure all form inputs, textareas, and selects use `font-size: 16px` minimum on mobile. | `src/index.css`, `B2BRFQForm.jsx` | None (CSS fix) | Test on iPhone Safari; tapping form fields does not trigger viewport auto-zoom. |
| `ACT-07` | **Implement Express 4-Field Mobile RFQ Toggle:** Add a segmented control allowing mobile buyers to toggle between 4-field Express RFQ and 10-field Commercial RFQ. | `B2BRFQForm.jsx` | Confirm minimum fields: Name, Email/WhatsApp, Country, Volume | Mobile completion rate increases; form fits on screen without endless scroll. |
| `ACT-08` | **Reposition WhatsApp Floating Bubble on Mobile:** Move bubble up to `bottom: 84px` on screens `< 768px` to prevent button overlap. | `src/components/WhatsAppBubble.jsx` | None (CSS fix) | WhatsApp button never obscures the "Submit RFQ" button or privacy consent checkbox. |
| `ACT-09` | **Add Direct Money Page Links to Mobile Nav Drawer:** Add prominent links to Moringa and Red Onion bulk supplier pages in the hamburger menu. | [`Navbar.jsx`](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/src/components/Navbar.jsx) | None (UX fix) | Mobile visitors can reach both money pages with 2 taps from anywhere on the site. |
| `ACT-10` | **Add Live IST Timezone Operational Badge:** Add a dynamic Indian Standard Time indicator to the WhatsApp Trade Desk. | `WhatsAppBubble.jsx`, Landing Page Heroes | Confirm standard trade desk operating hours (e.g. 09:00–21:00 IST) | Displays 🟢 *Active Now* during business hours; 🟡 *Responses within 4 Hours* off-hours. |

---

## 4. Phase 3: Days 31–60 — SEO Link Silos, Metadata & Position Rewrites (P2)

*Objective: Flow link equity from all 30 articles into the two money pages, optimize title tags for SERP CTR, and clean up ambiguous factory wording.*

| Task ID | Action Description | Target File / Component | Owner Input Required | Acceptance / Verification Criteria |
| :--- | :--- | :--- | :--- | :--- |
| `ACT-11` | **Inject Contextual Links into 15 Moringa Articles:** Add anchor text links pointing to `/moringa-powder-bulk-supplier-india` across all 15 articles. | `src/data/articles/moringaArticles.js` | None (Content update) | Every Moringa article contains at least 1 prominent contextual link to the bulk LP. |
| `ACT-12` | **Inject Contextual Links into 15 Onion Articles:** Add anchor text links pointing to `/red-onion-powder-bulk-supplier-india` across all 15 articles. | `src/data/articles/onionArticles.js` | None (Content update) | Every Onion article contains at least 1 prominent contextual link to the bulk LP. |
| `ACT-13` | **Condense Article Title Tags (< 60 Characters):** Trim titles exceeding 60 characters to prevent SERP truncation on desktop and mobile. | `src/data/articles/moringaArticles.js`, `onionArticles.js` | None (SEO copy) | 100% of article title tags render under 60 characters with primary keyword intact. |
| `ACT-14` | **Perform Positioning Phrasing Rewrites:** Update Articles 1, 2, and 17 to replace "our factory/farms" with "vetted partner processing facilities". | `src/data/articles/moringaArticles.js`, `onionArticles.js` | Review revised phrasing | Zero claims of factory ownership or farming estates across all published text. |
| `ACT-15` | **Implement Google Consent Mode v2:** Add lightweight cookie consent banner for European Union and UK visitors. | `index.html`, `src/components/CookieBanner.jsx` | Confirm privacy contact email | Meets EU ePrivacy & GDPR standards; analytics firing respects user consent. |

---

## 5. Phase 4: Days 61–90 — Authority Building, Buyer Tooling & Scale (P3)

*Objective: Provide enterprise-grade trust assets, downloadable technical documentation, and container logistics calculators.*

| Task ID | Action Description | Target File / Component | Owner Input Required | Acceptance / Verification Criteria |
| :--- | :--- | :--- | :--- | :--- |
| `ACT-16` | **Publish Redacted Sample NABL COA PDFs:** Create downloadable representative batch COAs for Moringa and Red Onion. | `public/docs/`, Landing Pages | **Owner must provide 2 recent lab test certificates** | Buyers can click "Download Sample NABL COA" and inspect testing methodology. |
| `ACT-17` | **Publish Real Industrial Packaging Photos:** Replace studio graphics with high-res photos of 25 kg drums, poly liners, and container stuffing. | `public/images/`, Landing Pages | **Owner must take photos at partner unit / warehouse** | Real photos replace renders, dramatically boosting enterprise buyer confidence. |
| `ACT-18` | **Add Ocean Transit Times Matrix:** Display estimated shipping transit days from JNPT Nhava Sheva to major world container ports. | Landing Pages, `ExportProcess.jsx` | Confirm typical transit times with freight forwarder | Table shows: Jebel Ali (4-6d), Rotterdam (24-28d), New York (28-32d), Long Beach (30-35d). |
| `ACT-19` | **Interactive Container Payload Calculator:** Add a quick calculator showing container stuffing capacity (20ft FCL vs 40ft FCL) and packaging options. | `/catalog`, Landing Pages | Confirm pallet dimensions (1200x1000mm) and drum stacking limits | Buyers can calculate freight economics directly on the page before requesting quotes. |
| `ACT-20` | **Trade Body Verification Badges:** Add APEDA / Spices Board / MSME verified seal graphics once certificates are verified. | `Footer.jsx`, Landing Page Heroes | **Owner to provide RCMC certificate numbers** | Official registration badges displayed in header and footer. |

---

## 6. Resource Allocation & Governance Rules

1. **Zero Code Changes During Audit Phase:** These recommendations are staged for implementation in scheduled development sprints with formal version control.
2. **Preserve URL Slugs & Canonical Architecture:** No existing URL slugs (`/blog/[slug]`, `/moringa-powder-bulk-supplier-india`, `/red-onion-powder-bulk-supplier-india`) may be modified.
3. **Owner Approval Gate:** All technical claims, minimum order quantities, and pricing bands must receive explicit written sign-off from Sachin Shinde prior to deployment.
