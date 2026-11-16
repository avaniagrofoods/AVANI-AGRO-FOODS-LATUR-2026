# PACKAGE 3F.108 — CHANGE AND ROLLBACK MANIFEST

**PROJECT:** AVANI AGRO FOODS WEBSITE ENGINE — PROJECT A ONLY  
**CANONICAL ROOT:** `C:\Users\ALPHA-1\Downloads\21MAY2026\SACHIN SHINDE DOCUMENTS\DEVELOPEMENT TOOLS\2-AVANI AGRO FOODS LATUR 2026`  
**DATE:** 10 NOVEMBER 2026  
**MODE:** CONTROLLED LOCAL SOURCE REMEDIATION  
**BASELINE REPORTED HEAD:** `24a10079ee02c845bf8d0deaadfc318772bcd321`  
**GIT MUTATION STATUS:** ZERO COMMITS, ZERO PUSHES, NO GIT HISTORY ALTERED

---

## 1. INVENTORY OF MODIFIED SOURCE FILES

| File Path | Type | Reason for Modification | Risk Assessment | Verification Status | Dependencies |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `middleware.js` | Tracked | Accept 64-hex session cookies, remove master password Bearer bypass, add delivery-webhook exemption | Low. Fixes 100% false-positive 401 at Edge for valid admin sessions and webhooks | **VERIFIED** (T-108-01, 06, 08, 09, 10) | Node crypto, Vercel Edge Runtime |
| `api/admin-quotations.js` | Tracked | Export `bodyParser: false`, implement raw stream consumption, align webhook payload schema, overwrite client actor in save action | Medium. Alters request body parsing for admin quotations POST mutations | **VERIFIED** (T-108-07, 11, 12, 13, 14, 21, 23) | Node streams, `_lib/auth.js`, `_lib/quotationModel.js` |
| `api/_lib/auth.js` | Tracked | Role-separate CSRF tokens (`csrf:${role}:${sessionId}`), support env var aliases (`KV_REQUIRED`, `ALLOWED_ORIGIN`), align `authenticated: true` | Low. Enhances CSRF security and backward compatibility | **VERIFIED** (T-108-02..05, 18, 19, 20, 22) | Node crypto, Upstash KV |
| `api/verify-gate.js` | Tracked | Explicitly pass `'gate'` role to `createCsrfCookie` | Low. Guarantees Gate CSRF cookie isolation | **VERIFIED** (T-108-24, 3F.106 T-03.1) | `_lib/auth.js` |
| `api/affiliate-auth.js` | Tracked | Explicitly pass `'affiliate'` role to `createCsrfCookie`, accept `AFFILIATE_PASSWORD` fallback | Low. Prevents affiliate auth lockout under alias configuration | **VERIFIED** (T-108-19, 20) | `_lib/auth.js` |
| `src/lib/csrf.js` | Untracked (created in 3F.106) | Add role-specific storage keys (`avani_gate_csrf_token`, `avani_affiliate_csrf_token`) | Low. Eliminates CSRF collision between Gate and Affiliate sessions | **VERIFIED** (T-108-18, 19, 20, Vite Build) | Web browser `sessionStorage`, `document.cookie` |
| `src/components/PasswordGate.jsx` | Tracked | Store CSRF token under `'gate'` role | Low. Frontend UI security | **VERIFIED** (Vite Build) | `src/lib/csrf.js` |
| `src/components/AffiliateAuthGuard.jsx` | Tracked | Store CSRF token under `'affiliate'` role | Low. Frontend UI security | **VERIFIED** (Vite Build) | `src/lib/csrf.js` |
| `src/pages/AffiliateLogin.jsx` | Tracked | Store CSRF token under `'affiliate'` role | Low. Frontend UI security | **VERIFIED** (Vite Build) | `src/lib/csrf.js` |
| `src/components/PrivateNav.jsx` | Tracked | Pass `'gate'` role to `getCsrfHeaders` and `clearCsrfToken` on logout | Low. Ensures clean Gate session teardown | **VERIFIED** (T-108-24, Vite Build) | `src/lib/csrf.js` |
| `src/pages/AdminQuotations.jsx` | Tracked | Replace client hardcoded `'Sachin Shinde'` author strings with `'authenticated_operator'` | Low. Frontend author attribution cleanup | **VERIFIED** (T-108-21, Vite Build) | `src/data/quotationModel.js` |
| `src/pages/PrivateDashboard.jsx` | Tracked | Replace client hardcoded `'Sachin Shinde'` lead activity actor with `'authenticated_operator'` | Low. Frontend author attribution cleanup | **VERIFIED** (Vite Build) | `src/data/leadModel.js` |
| `src/data/quotationCore.js` | Tracked | Set fallback `updatedBy` to `'authenticated_operator'` | Low. Data model normalization | **VERIFIED** (Vite Build, T-108-23) | None |
| `src/data/leadModel.js` | Tracked | Set workflow owner fallback to `'authenticated_operator'` | Low. Data model normalization | **VERIFIED** (Vite Build) | None |
| `.gitignore` | Tracked | Add `!.env.example` exception rule | Minimal. Allows configuration template to be visible in Git | **VERIFIED** (`git status`) | Git |

---

## 2. INVENTORY OF CREATED FILES

| File Path | Purpose | Risk | Verification Status |
| :--- | :--- | :--- | :--- |
| `.env.example` | Canonical environment configuration template with non-sensitive placeholders | None. Contains zero real secrets or credentials | **VERIFIED** (Inspected) |
| `scripts/test_package_3f_108_regression.mjs` | Targeted regression test harness covering T-108-01 through T-108-24 | None. Read-only local test execution | **VERIFIED** (Exit Code 0, 24 passed) |
| `docs/audits/production/PACKAGE_3F_108_REMEDIATION_REPORT.md` | Comprehensive technical remediation report | Documentation only | **VERIFIED** (Written) |
| `docs/audits/production/PACKAGE_3F_108_REGRESSION_REPORT.md` | Formal regression test register and evidence report | Documentation only | **VERIFIED** (Written) |
| `docs/audits/production/PACKAGE_3F_108_CHANGE_AND_ROLLBACK_MANIFEST.md` | This document | Documentation only | **VERIFIED** (Written) |

---

## 3. PROHIBITED / QUARANTINED FILES INTEGRITY CONFIRMATION

The following four quarantined files were strictly unaccessed, unmodified, and preserved:
- `api/_data/sequenceStateStore.json`
- `api/_data/importersData.js`
- `api/_data/importersData.snapshot-642.json`
- `api/_data/manufacturersData.js`

Project B (`AVANI_AGRO_INTELLIGENCE`) was strictly excluded and unaccessed.

---

## 4. ROLLBACK INSTRUCTIONS

*Notice: In accordance with Package 3F.108 instructions, live destructive Git rollback was not executed during this verification package to preserve all pre-existing user modifications.*

If the operator requires reverting the changes made in Package 3F.108 back to the Package 3F.107 baseline:

1. **Revert Tracked File Modifications Made in Package 3F.108:**
   ```bash
   # Revert only the files modified in 3F.108 back to their 3F.107 state:
   git checkout -- middleware.js
   git checkout -- api/admin-quotations.js
   git checkout -- api/_lib/auth.js
   git checkout -- api/verify-gate.js
   git checkout -- api/affiliate-auth.js
   git checkout -- src/components/AffiliateAuthGuard.jsx
   git checkout -- src/components/PasswordGate.jsx
   git checkout -- src/components/PrivateNav.jsx
   git checkout -- src/data/leadModel.js
   git checkout -- src/data/quotationCore.js
   git checkout -- src/pages/AdminQuotations.jsx
   git checkout -- src/pages/PrivateDashboard.jsx
   git checkout -- .gitignore
   ```

2. **Remove Files Created in Package 3F.108:**
   ```bash
   rm .env.example
   rm scripts/test_package_3f_108_regression.mjs
   rm docs/audits/production/PACKAGE_3F_108_REMEDIATION_REPORT.md
   rm docs/audits/production/PACKAGE_3F_108_REGRESSION_REPORT.md
   rm docs/audits/production/PACKAGE_3F_108_CHANGE_AND_ROLLBACK_MANIFEST.md
   ```

3. **Rebuild Frontend Application:**
   ```bash
   npm run build
   ```

4. **Preserve Untracked Pre-Existing Reports:**
   Do **not** run `git clean -fd`, as doing so would destroy pre-existing Package 3F.106 and 3F.107 reports and audit registers.
