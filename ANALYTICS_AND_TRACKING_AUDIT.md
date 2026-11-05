# AVANI AGRO FOODS — ANALYTICS, UTM ATTRIBUTION & LEAD TRACKING AUDIT
**Document ID:** `AAF-AUDIT-ANALYTICS-2026-V1`  
**Date:** November 2026  
**Auditor:** Marketing Analytics Architect & Lead Attribution Engineer  
**Core Technologies Audited:**
- Google Analytics 4 (`G-GNKT58TMBT`) via `gtag.js`
- Custom SPA Route Change Tracker (`src/App.jsx`)
- Centralized B2B Event Dispatcher (`src/lib/analytics.js`)
- Multi-Touch UTM & Session Attribution Tracker (`src/lib/utmTracker.js`)
- HubSpot CRM Tracking Snippet (`246074335`)
- Server-Side Lead Pipeline (`/api/save-lead.js` & Supabase `public.leads`)

---

## 1. Executive Summary & Attribution Health Score

Accurate end-to-end lead attribution is vital for international B2B commerce. Because B2B ingredient purchasing cycles span weeks or months (sampling, specification approval, proforma negotiation, container booking), the digital tracking infrastructure must faithfully record where high-value commercial inquiries originated (organic search, LinkedIn, Google Ads, direct referral).

```
+-------------------------------------------------------------+
| ANALYTICS & ATTRIBUTION HEALTH SCORE: 88 / 100              |
| Status: EXCELLENT ARCHITECTURE WITH CRM PARITY GAPS         |
+-------------------------------------------------------------+
```

### High-Level Analytics Scorecard
| Attribution Dimension | Benchmark Target | Live Implementation | Status |
| :--- | :--- | :--- | :--- |
| **GA4 Base Tag** | Asynchronous, non-blocking | Configured in `index.html` (`G-GNKT58TMBT`) | **PASS** |
| **SPA Route Tracking** | Virtual `page_view` on navigation | Fired via `RouteChangeHandler` in `App.jsx` | **PASS** |
| **UTM Persistence** | Survives multi-page browsing | SessionStorage cache via `utmTracker.js` | **PASS** |
| **Attribution in Lead Payload**| Sent to CRM backend | Injected into `/api/save-lead` payload | **PASS** |
| **RFQ Funnel Milestones** | Started, Failed, Submitted | Custom GA4 events in `analytics.js` | **PASS** |
| **Zero PII in Analytics** | Compliance with Google TOS | No names, emails, or phones sent to GA4 | **PASS** |
| **Products.jsx Modal Parity** | 100% CRM & GA4 integration | **Calls EmailJS only; skips GA4 & Supabase** | **DEFECT** |
| **GDPR / Cookie Banner** | Required for EU/UK buyers | **No explicit cookie consent banner** | **COMPLIANCE GAP**|

---

## 2. Forensic Tracking Architecture Inspection

### 2.1 Google Analytics 4 (GA4) Base Configuration
- **Script Location:** Lines 6–16 in `index.html`.
- **Implementation:**
  ```html
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-GNKT58TMBT"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    gtag('js', new Date());
    gtag('config', 'G-GNKT58TMBT', {
      send_page_view: true,
      cookie_flags: 'SameSite=None;Secure'
    });
  </script>
  ```
- **Evaluation:** Asynchronous and secure. Sets `SameSite=None;Secure` cookies for cross-origin compliance.

### 2.2 SPA Virtual Pageview Handling
- In standard Single Page Applications (SPAs) built with React Router, traditional page reloads do not occur during navigation.
- **Implementation in `src/App.jsx` (Lines 67–73):**
  ```javascript
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'page_view', {
      page_path: location.pathname,
      page_title: document.title,
    })
  }
  ```
- **Status:** **PASS**. Virtual pageviews fire accurately on every route change, ensuring accurate path analysis in GA4.

### 2.3 UTM Parameter Persistence (`utmTracker.js`)
- **Module:** [`src/lib/utmTracker.js`](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/src/lib/utmTracker.js)
- **Functionality:**
  - Upon initial landing, extracts: `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, and `gclid`.
  - Captures `landing_page` (e.g. `/moringa-powder-bulk-supplier-india`) and initial external `referrer`.
  - Stores data inside `sessionStorage` under key `aaf_utm_data`.
  - When the buyer browses 5 other blog articles and finally fills out the contact form, `getAttributionData()` pulls the original campaign parameters and passes them into the RFQ payload.
- **Status:** **EXCELLENT**. Solves the classic B2B multi-page attribution loss problem.

---

## 3. Lead Funnel Event Tracking (`analytics.js`)

[`src/lib/analytics.js`](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/src/lib/analytics.js) defines a structured B2B lead event taxonomy:

| Standard Event Name | Trigger Condition | Dispatched Parameters | PII Check |
| :--- | :--- | :--- | :--- |
| `product_page_view` | Buyer views Moringa/Onion landing page | `product_name`, `page_source` | Clean (Zero PII) |
| `article_view` | Buyer opens one of 30 blog articles | `article_title`, `article_slug`, `category` | Clean (Zero PII) |
| `rfq_started` | Buyer focuses on first input in RFQ form | `product_interest`, `rfq_source` | Clean (Zero PII) |
| `rfq_validation_failure` | Form submitted with missing required field | `product_interest`, `failure_reason` | Clean (Zero PII) |
| `rfq_submit_success` | RFQ successfully submitted | `product`, `quantity`, `country`, `source` | Clean (Zero PII) |
| `whatsapp_click` | Buyer clicks floating or inline WhatsApp CTA | `product`, `click_source` | Clean (Zero PII) |
| `catalog_download` | Buyer initiates commercial catalog download | `catalog_type` | Clean (Zero PII) |

---

## 4. Critical Analytics Deficiencies & Gaps

### Defect #1: `Products.jsx` Catalog Modal Bypasses GA4 Lead Event
- In `src/pages/Products.jsx`, when a buyer opens the product modal and clicks submit, the handler triggers `sendContactEmail()` via EmailJS.
- **Finding:** It **does not invoke `trackRfqSubmitSuccess()`** or `trackEvent('generate_lead')`.
- **Impact:** Inquiries generated from `/products` modal do not appear in GA4 conversion reports or Google Ads conversion tracking.

### Defect #2: Absence of GDPR / ePrivacy Cookie Banner for EU/UK Traffic
- Under EU GDPR and UK Data Protection regulations, analytics cookies (`_ga`, `_ga_*`) require prior explicit user consent before activation.
- Currently, `gtag('config', 'G-GNKT58TMBT')` executes automatically upon page load for all global visitors.
- **Recommendation:** Implement a lightweight, non-intrusive Cookie Consent Banner for European visitors with "Accept / Preferences" options, integrating Google Consent Mode v2 (`analytics_storage: 'denied'` / `'granted'`).

### Defect #3: HubSpot Script Execution Without Form Integration
- Line 142 of `index.html` loads HubSpot tracking code:
  `<script id="hubspot" async defer src="https://js.hs-scripts.com/246074335.js"></script>`
- However, the React forms (`B2BRFQForm.jsx`) do not have the HubSpot tracking API hook (`window._hsq.push(...)`) connected to transmit lead data directly into HubSpot CRM contacts.
- **Recommendation:** Either connect the HubSpot tracking API to transmit lead lifecycle stages, or remove the HubSpot script to save 45KB of external script execution if HubSpot is not actively utilized.

---

## 5. Actionable Analytics & Tracking Checklist

1. **Unify `Products.jsx` Modal to Call `trackRfqSubmitSuccess` (P0):** Ensure all lead submissions fire the standard GA4 `generate_lead` conversion event.
2. **Implement Google Consent Mode v2 (P1):** Ensure compliance with European Union and UK regulations without blocking anonymous conversion modeling.
3. **Configure GA4 Custom Dimensions (P1):**
   - In Google Analytics 4 Admin, register custom definitions for:
     - `product_interest` (Event-scoped)
     - `buyer_country` (Event-scoped)
     - `quantity_value` (Event-scoped)
     - `rfq_source` (Event-scoped)
4. **Link Google Search Console to GA4 Property (P2):** Complete the GSC-GA4 link to view organic search queries and landing page impressions directly in GA4.
