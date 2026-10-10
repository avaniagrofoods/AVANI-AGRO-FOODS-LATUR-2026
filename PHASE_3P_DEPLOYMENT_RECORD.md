# AVANI AGRO FOODS — PHASE 3P DEPLOYMENT RECORD
**Controlled Vercel Production Promotion & Remote Asset Parity Record**  
**Date:** 2026-10-10  
**Target Environment:** Production  
**Deployment Platform:** Vercel  

---

## 1. Deployment Identity

| Property | Value |
| :--- | :--- |
| **Vercel Project Name** | `avani-agro-foods-latur-2026` |
| **Project ID** | `prj_3DBOT7AbclhcQ6318u4bETdbnhrQ` |
| **Production Deployment ID** | `dpl_6yuoycp4AUH8QS4U917Ue1fs5oeg` |
| **Deployment URL** | `https://avani-agro-foods-latur-2026-3dmvvn1er.vercel.app` |
| **Production Canonical Alias**| `https://www.avaniagrofoods.com` |
| **Vercel Ready State** | `READY` |
| **Production Commit SHA** | `30c0790d0b264f199c1604522b211b4139421517` (`30c0790`) |
| **GitHub Remote** | `https://github.com/avaniagrofoods/AVANI-AGRO-FOODS-LATUR-2026.git` |
| **Branch** | `main` (Synchronized: `99c672a..30c0790`) |

---

## 2. Remote Asset & Build Parity

- **Vite Build Output:**
  - `dist/index.html` (6.11 kB)
  - `dist/assets/Importers-CEVvwnwg.js` (43.10 kB)
  - `dist/assets/AdminQuotations-sx7_hAwD.js` (102.28 kB)
  - `dist/assets/quotationModel-BrvwxYTJ.js` (1,741.19 kB)
- **Edge / Serverless Middleware:** Edge middleware deployed and aliased to root domain.
- **Serverless API Functions:**
  - `api/importers.js`
  - `api/manufacturers.js`
  - `api/admin-quotations.js`
  - `api/quotation.js`
  - `api/leads.js`
  - `api/save-lead.js`
  - `api/lead-qualification.js`
  - `api/affiliate-auth.js`
  - `api/email-reply-webhook.js`
  - `api/verify-gate.js`

---

## 3. Post-Deployment Verification Summary

1. **HTTP 200 Verification:** Tested all 35 public and private application routes: 100% HTTP 200.
2. **API Verification:** Probed all 10 API routes: 100% correct response codes and security enforcement.
3. **Parity Test Suite:** Executed `scripts/test_live_production_parity.cjs` against live domain: 100% PASS across PDF streaming, DOCX generation, and quotation math.
4. **Interactive Audit:** Executed Puppeteer audit on `/private/importers`: 0 errors captured.
