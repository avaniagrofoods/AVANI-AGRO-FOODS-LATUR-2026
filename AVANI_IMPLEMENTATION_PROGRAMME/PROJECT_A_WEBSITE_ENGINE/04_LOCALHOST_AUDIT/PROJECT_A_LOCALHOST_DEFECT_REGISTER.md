# PROJECT A: LOCALHOST DEFECT REGISTER
## AVANI AGRO FOODS WEBSITE ENGINE

**Author:** QA Lead & Full-Stack Application Auditor  
**Date:** 2026-11-17  
**Reference:** Master Execution Prompt v3.0, Part 7 (Phase 3)  
**Location:** `PROJECT_A_WEBSITE_ENGINE/04_LOCALHOST_AUDIT/PROJECT_A_LOCALHOST_DEFECT_REGISTER.md`  

---

## 1. Localhost Defect Matrix

| Defect ID | Component / Area | Description | Root Cause | Severity | Business / Technical Impact | Proposed Correction | Status |
| :--- | :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| **DEF-LOC-A01** | `src/components/RFQModal.jsx` | RFQ modal historically called browser-side EmailJS service. | Client-side API key configuration in `src/lib/emailjs.js`. | **MEDIUM** | Inquiries bypass backend audit ledger and serverless database persistence if client browser blocks third-party scripts. | Unify all RFQ form dispatches to `/api/save-lead` serverless endpoint. | `OPEN` |
| **DEF-LOC-A02** | `api/save-lead.js:46-51` | Process-local `Map` cannot deduplicate concurrent submissions across separate serverless instances. | Node.js in-memory Map is isolated per container execution environment. | **CRITICAL** | Duplicate lead creation and redundant quotation issuance under cold starts / concurrent clicks. | Implement PostgreSQL-backed durable idempotency ledger table (`PACKAGE_3F_136_REMEDIATION_PLAN.md`). | `OPEN (AWAITING AUTH A3)` |
| **DEF-LOC-A03** | `src/assets/` & `public/` | Commodity photography (Moringa, Red Onion) stored in uncompressed JPG/PNG formats. | Lack of automated WebP/AVIF asset optimization pipeline. | **LOW** | Slightly slower mobile LCP for international buyers on slow connections. | Convert hero imagery to WebP with responsive `<picture>` tags and `srcset`. | `OPEN` |
| **DEF-LOC-A04** | `api/_lib/supabaseClient.js` | Lack of atomic transaction RPC for simultaneous `leads` + `quotations` persistence. | Multi-step asynchronous PostgREST calls without database-level transaction wrapper. | **HIGH** | If database network drops between lead insert and quote insert, orphan lead is created without quotation. | Wrap lead and quotation insertion in a single Supabase PostgreSQL stored procedure (`create_inquiry_with_quotation`). | `OPEN` |
| **DEF-LOC-A05** | `index.html` | Google Analytics 4 tracking script (`G-GNKT58TMBT`) active in local dev build. | Script included directly in root template without dev/prod conditional check. | **LOW** | Localhost developer testing generates synthetic pageviews in production Google Analytics. | Wrap GA4 tag in `import.meta.env.PROD` check or inject via Vite HTML plugin. | `OPEN` |
