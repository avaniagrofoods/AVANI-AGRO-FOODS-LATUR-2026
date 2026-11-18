# VERCEL DEPLOYED COMMIT VERIFICATION REPORT
## FORENSIC AUDIT OF LIVE PRODUCTION DEPLOYMENTS, GIT COMMITS & BUILD ARTIFACTS

**Programme:** AVANI AGRO FOODS TECHNICAL STABILISATION (VERSION 5.3)  
**Project:** AVANI AGRO FOODS WEBSITE ENGINE — PROJECT A  
**Canonical Directory:** `AVANI_IMPLEMENTATION_PROGRAMME/15_FINAL_PRODUCTION_ACCEPTANCE/`  
**Date:** 18 November 2026  
**Auditor:** Principal DevOps & Infrastructure Engineer  
**Status:** **PRODUCTION DEPLOYMENT VERIFIED READY & LIVE (STATUS: GREEN)**

---

## 1. PRODUCTION DEPLOYMENT METADATA

The production deployment serving `https://www.avaniagrofoods.com` was inspected via Vercel CLI:

| Parameter | Authoritative Value | Verification Method |
| :--- | :--- | :--- |
| **Deployment ID** | `dpl_EKa1B9uRZ3WDpz8SPyLZ3iQyHpk3` | Verified via `vercel inspect` |
| **Deployment Status** | `● Ready` | Operational |
| **Target Environment** | `production` | Vercel Platform |
| **Creation Timestamp** | `Wed Nov 18 2026 08:28:40 GMT+0530` | Live Platform Metadata |
| **Build Duration** | `34 seconds` | Vercel Build Cloud |
| **Active Production Aliases** | `https://www.avaniagrofoods.com`<br/>`https://avaniagrofoods.com`<br/>`https://avani-agro-foods-latur-2026.vercel.app` | Confirmed live |
| **Build Machine** | `2 vCPU, 8192 MiB RAM` | Plan Default |
| **Serverless Runtime** | `nodejs24.x` | Edge Region `bom1` (Mumbai, India) |
| **Inspector URL** | `https://vercel.com/avaniagrofoods1356-4705s-projects/avani-agro-foods-latur-2026/EKa1B9uRZ3WDpz8SPyLZ3iQyHpk3` | Vercel Console |

---

## 2. GIT COMMIT TRACKING & RELEASE RECONCILIATION

### 2.1 Git Repository Status
- **Remote Repository:** `https://github.com/avaniagrofoods/AVANI-AGRO-FOODS-LATUR-2026.git`
- **Active Branch:** `main`
- **Working Tree:** All changes tracked and verified.

### 2.2 Vercel Release Verification
- Deployment `dpl_EKa1B9uRZ3WDpz8SPyLZ3iQyHpk3` was deployed via authenticated Vercel CLI (`vercel deploy --prod --yes`).
- Ready state confirmed: `READY` in `bom1` region.
- Production traffic automatically routed to `https://www.avaniagrofoods.com`.

---

## 3. DEPLOYED FUNCTIONAL INTEGRATION CONFIRMATION

Inspection of the deployed serverless bundle confirms that the live production engine contains:
1. `reserveIdempotencyLock` with dual-mode atomic RPC and direct PostgREST table fallback in `api/_lib/supabaseClient.js`.
2. `completeIdempotencyRecord` and `failIdempotencyRecord` in `api/_lib/supabaseClient.js`.
3. Dynamic rate limit protection allowing high-throughput B2B transactions while blocking malicious floods in `api/save-lead.js`.
4. SHA-256 deterministic key generation and client `Idempotency-Key` header extraction.
5. Strict insert-only PostgREST semantics for customer leads and quotations.
6. Real-time diagnostic inspector endpoint (`/api/save-lead?action=db-diagnostic`).

---
**Report Approved by:** Principal DevOps & Infrastructure Engineer  
**Sign-off Status:** **DEPLOYMENT VERIFIED ACTIVE & LIVE (GREEN)**
