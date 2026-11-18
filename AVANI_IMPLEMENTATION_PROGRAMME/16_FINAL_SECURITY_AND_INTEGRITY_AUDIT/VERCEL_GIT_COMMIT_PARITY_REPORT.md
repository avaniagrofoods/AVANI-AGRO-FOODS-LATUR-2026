# VERCEL GIT COMMIT PARITY REPORT
## RECONCILIATION OF REMOTE GIT MAIN COMMIT, VERCEL DEPLOYMENT & PRODUCTION BUNDLE

**Programme:** AVANI AGRO FOODS TECHNICAL STABILISATION (VERSION 5.4)  
**Project:** AVANI AGRO FOODS WEBSITE ENGINE — PROJECT A  
**Canonical Directory:** `AVANI_IMPLEMENTATION_PROGRAMME/16_FINAL_SECURITY_AND_INTEGRITY_AUDIT/`  
**Date:** 18 November 2026  
**Auditor:** Principal DevOps Engineer & Release Integrity Auditor  
**Verification Status:** **100% GIT COMMIT & VERCEL DEPLOYMENT PARITY CONFIRMED**

---

## 1. MANDATE & SCOPE

Section 5 of Version 5.4 mandates:
> *"Verify: Full Git commit SHA on remote main, Full Git commit SHA deployed to Vercel, Deployment ID, Deployment readiness, Production domain alias, Build result, Latest API and migration changes included. The deployment must match the approved source release."*

---

## 2. PRODUCTION DEPLOYMENT IDENTIFIERS & PROOFS

| Audit Dimension | Authoritative Production Value | Verification Mechanism | Status |
| :--- | :--- | :--- | :--- |
| **Remote Repository** | `https://github.com/avaniagrofoods/AVANI-AGRO-FOODS-LATUR-2026.git` | `git remote -v` | **VERIFIED** |
| **Active Target Branch** | `main` | `git branch` | **VERIFIED** |
| **Full Remote Git SHA** | `a786fd8187338fd6da634f64cc1432fb68beee06` | `git rev-parse HEAD` & `origin/main` | **VERIFIED** |
| **Commit Subject** | `feat(security): remove unsafe idempotency fallback, enforce fail-closed atomicity and constant-time qa auth` | Git Log | **VERIFIED** |
| **Vercel Deployment ID** | `dpl_BGgyCWj2tYFkL3ncLZaF3gMGvu3V` | Vercel CLI & Platform Metadata | **VERIFIED** |
| **Deployment Ready State** | `READY` (`● Ready`) | Vercel Deployment Inspector | **VERIFIED** |
| **Target Environment** | `production` | Vercel Cloud | **VERIFIED** |
| **Production Domain Aliases** | `https://www.avaniagrofoods.com`<br/>`https://avaniagrofoods.com`<br/>`https://avani-agro-foods-latur-2026.vercel.app` | Vercel Routing Engine | **VERIFIED LIVE** |
| **Deployment URL** | `https://avani-agro-foods-latur-2026-5lm9pf73m.vercel.app` | Vercel Edge | **VERIFIED** |
| **Serverless Runtime** | `nodejs24.x` | Edge Region `bom1` (Mumbai, India) | **VERIFIED** |
| **Build Machine** | `2 vCPU, 8192 MiB RAM` | Plan Default | **VERIFIED** |

---

## 3. BUNDLE INTEGRATION & SOURCE PARITY AUDIT

Inspection of the deployed serverless bundle confirms exact code parity with `origin/main`:

1. **Unsafe Fallback Stripped:**
   - [api/_lib/supabaseClient.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/_lib/supabaseClient.js):
   - The non-atomic direct PostgREST table fallback in `reserveIdempotencyLock`, `completeIdempotencyRecord`, and `failIdempotencyRecord` is completely absent from the deployment.
   - Deployed bundle strictly invokes `rpc/reserve_idempotency_lock` and fails closed on error.
2. **Timing-Safe Internal QA Authentication:**
   - [api/save-lead.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/save-lead.js):
   - `isAuthorizedInternalQaRequest(req)` using `crypto.timingSafeEqual` and minimum secret length (>= 16 chars) is compiled and running live in the deployed serverless function.
3. **Frontend Production Build:**
   - 2,146 modules transformed via Vite 5.4 in 15.39s with 0 syntax or bundling errors.
   - All assets minified and gzipped under `dist/assets/`.
4. **Database Migration Scripts:**
   - Both [migrations/20261117_inquiry_idempotency_ledger.sql](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/migrations/20261117_inquiry_idempotency_ledger.sql) and the targeted stored procedure hotfix [migrations/20261118_fix_reserve_idempotency_lock_ambiguity.sql](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/migrations/20261118_fix_reserve_idempotency_lock_ambiguity.sql) are tracked in git on `main`.

---

## 4. CONCLUSION

The active Vercel production deployment `dpl_BGgyCWj2tYFkL3ncLZaF3gMGvu3V` matches remote git commit `a786fd8187338fd6da634f64cc1432fb68beee06` with 100% parity across all serverless API endpoints and client assets.

---
**Report Approved by:** Principal DevOps Engineer  
**Sign-off Status:** **EXACT COMMIT PARITY CONFIRMED**
