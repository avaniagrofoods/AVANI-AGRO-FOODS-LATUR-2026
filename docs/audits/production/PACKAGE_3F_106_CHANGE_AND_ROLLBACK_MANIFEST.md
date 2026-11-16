# PACKAGE 3F.106 — CHANGE AND ROLLBACK MANIFEST

**Project:** AVANI AGRO FOODS WEBSITE ENGINE — PROJECT A ONLY  
**Canonical Root:** `C:\Users\ALPHA-1\Downloads\21MAY2026\SACHIN SHINDE DOCUMENTS\DEVELOPEMENT TOOLS\2-AVANI AGRO FOODS LATUR 2026`  
**Verified Baseline HEAD:** `24a10079ee02c845bf8d0deaadfc318772bcd321`  
**Branch:** `main` (`origin/main`)  
**Timestamp:** `2026-11-10T09:54:00+05:30`

---

## 1. Pre-Existing Working Tree State (Before Package 3F.106)

- **Baseline `git status --short` before Package 3F.106 edits:** Clean (0 modified tracked files, 0 untracked files).
- **Baseline Commit (`git rev-parse HEAD`):** `24a10079ee02c845bf8d0deaadfc318772bcd321`

---

## 2. Quarantine & Boundary Integrity Verification

The following quarantined files were **NEVER** accessed, read, opened, stat'd, hashed, or modified during Package 3F.106:
- `api/_data/sequenceStateStore.json` — **UNTOUCHED**
- `api/_data/importersData.js` — **UNTOUCHED**
- `api/_data/importersData.snapshot-642.json` — **UNTOUCHED**
- `api/_data/manufacturersData.js` — **UNTOUCHED**

Project B (`AVANI_AGRO_INTELLIGENCE`) was **NEVER** accessed, searched, read, or modified.

---

## 3. Complete Manifest of Files Modified or Created by Package 3F.106

### 3.1 Modified Tracked Application Files (16 Files)

| # | Relative Path | Action | Corrective Actions / Findings Addressed | Summary of Changes |
|---|---|---|---|---|
| 1 | `api/_lib/auth.js` | Modified | `CC-01`, `CC-02`, `CC-03`, `CC-04`, `CC-06`, `CC-07`, `CC-08` | Canonical `resolveMasterGatePassword()` with fail-closed conflict/legacy detection; Upstash KV-backed `createServerSession`, `verifyServerSession`, `revokeServerSession` failing closed (`503`) on KV errors; exact URL origin parser (`isExactAllowedOrigin`, `validateMutationOrigin`); session-bound HMAC CSRF tokens (`generateCsrfToken`, `verifyCsrfRequest`); Resend/Svix raw-body HMAC verification (`verifySvixSignature`); proxy-hardened `getClientIp`; atomic Redis Lua rate limiter (`checkRateLimit`) failing closed (`503`) on KV outages or corrupt state. |
| 2 | `api/verify-gate.js` | Modified | `CC-02`, `CC-03`, `CC-04`, `CC-07`, `CC-08` | Uses `resolveMasterGatePassword()`, `createServerSession('gate')`, `verifyServerSession(req, 'gate')`, `revokeServerSession(req, 'gate')`, issues CSRF cookie + JSON `csrfToken`, enforces `verifyCsrfRequest` on `logout`, and propagates `503` on KV/rate-limit outages. |
| 3 | `api/affiliate-auth.js` | Modified | `CC-03`, `CC-04`, `CC-07`, `CC-08` | Uses `createServerSession('affiliate')`, `verifyServerSession(req, 'affiliate')`, `revokeServerSession(req, 'affiliate')`, issues CSRF cookie + JSON `csrfToken`, enforces `verifyCsrfRequest` on `logout`, and propagates `503` on KV/rate-limit outages. |
| 4 | `api/importers.js` | Modified | `CC-01`, `CC-03`, `CC-04`, `CC-08` | Removed Bearer master password authentication; restricted to `GET` only; awaits `verifyServerSession(req, 'gate')` propagating `503`/`401`; enforces distributed rate limiting. |
| 5 | `api/manufacturers.js` | Modified | `CC-01`, `CC-03`, `CC-04`, `CC-08` | Removed Bearer master password authentication; restricted to `GET` only; awaits `verifyServerSession(req, 'gate')` propagating `503`/`401`; enforces distributed rate limiting. |
| 6 | `api/admin-quotations.js` | Modified | `CC-01`, `CC-03`, `CC-04`, `CC-06`, `CC-07`, `CC-08` | Removed Bearer master password and legacy cookie fallbacks; awaits `verifyAdminAuth(req)`; enforces `verifyCsrfRequest` on authenticated `POST` mutations; binds audit trail actor to `authSession.actor` ignoring client-supplied `actor`/`changedBy`; secures `delivery-webhook` with `verifySvixSignature`; enforces distributed rate limiting. |
| 7 | `api/_lib/quotationEngine.js` | Modified | `CC-05` | Removed `MASTER_GATE_PASSWORD` worksheet protection coupling from `generateExcelQuotation`; added explicit `CREDENTIAL_COUPLING_FORBIDDEN` guard. |
| 8 | `api/quotation.js` | Modified | `CC-04`, `CC-05`, `CC-08`, `AF-02`, `AF-03` | Removed `MASTER_GATE_PASSWORD` from `download-xlsx`; enforced `isAllowedOrigin(req)` and distributed `checkRateLimit`; added `sanitizeDownloadFilenameId` for `Content-Disposition` headers. |
| 9 | `api/email-reply-webhook.js` | Modified | `CC-06`, `CC-08` | Removed `verifyDirectSecret` fallback; requires `RESEND_WEBHOOK_SECRET` (`503` when unset), rejects query/body/header shared secrets (`400`), and verifies Svix HMAC signature over `req.rawBody` with 300s timestamp tolerance. |
| 10 | `src/data/quotationModel.js` | Modified | `CC-07` | Replaced hardcoded `'Sachin Shinde'` default audit actors with `'authenticated_operator'` / `'system_lead_pipeline'` and required explicit `actor` on `applyAdminOverride`. |
| 11 | `api/_lib/quotationModel.js` | Modified | `CC-07` | Replaced hardcoded `'Sachin Shinde'` default audit actors with `'authenticated_operator'` / `'system_lead_pipeline'`. |
| 12 | `api/_lib/supabaseClient.js` | Modified | `CC-06`, `CC-07` | Replaced hardcoded `'Sachin Shinde'` fallback actor and removed direct webhook secret comparison from `processDeliveryWebhook`. |
| 13 | `api/save-lead.js` | Modified | `CC-04`, `CC-08`, `AF-01` | Propagates `rateCheck.statusCode` (`503` on KV failure, `429` on limit exceeded) and escapes user-supplied fields via `escapeHtml` before HTML email interpolation. |
| 14 | `api/leads.js` | Modified | `CC-08` | Propagates `rateCheck.statusCode` (`503` on KV failure, `429` on limit exceeded). |
| 15 | `api/lead-qualification.js` | Modified | `CC-08` | Propagates `rateCheck.statusCode` (`503` on KV failure, `429` on limit exceeded). |
| 16 | `src/components/PasswordGate.jsx` | Modified | `CC-04` | Stores `csrfToken` via `setCsrfToken` on login/session check and clears it on failure. |
| 17 | `src/components/PrivateNav.jsx` | Modified | `CC-04` | Sends `X-CSRF-Token` via `withCsrfHeaders()` on `POST /api/verify-gate` logout and clears local CSRF storage. |
| 18 | `src/pages/AdminQuotations.jsx` | Modified | `CC-04`, `CC-07` | Attaches `X-CSRF-Token` via `withCsrfHeaders()` on admin `POST` mutations and removes client-hardcoded `actor: 'Sachin Shinde'` payload fields. |
| 19 | `src/pages/AffiliateLogin.jsx` | Modified | `CC-04` | Stores `csrfToken` via `setCsrfToken` on affiliate login. |
| 20 | `src/components/AffiliateAuthGuard.jsx` | Modified | `CC-04` | Syncs `csrfToken` on affiliate session check and sends `X-CSRF-Token` on affiliate logout. |

### 3.2 New Files Created by Package 3F.106 (8 Files)

| # | Relative Path | Category | Purpose |
|---|---|---|---|
| 1 | `src/lib/csrf.js` | Frontend Security Helper | Stores server-issued CSRF token in `sessionStorage` / `avani_csrf_token` cookie and attaches `X-CSRF-Token` header via `withCsrfHeaders()`. |
| 2 | `scripts/test_package_3f_106_regression.mjs` | Automated Regression Suite | 22-test behavioral regression suite covering all 16 mandatory test categories (`T-01` through `T-16`) with in-memory module hooks protecting quarantined data files. |
| 3 | `docs/audits/production/PACKAGE_3F_106_ENVIRONMENT_RECOVERY_REPORT.md` | Audit Deliverable 1 | Environment & capability recovery evidence report. |
| 4 | `docs/audits/production/PACKAGE_3F_106_MASTER_REMEDIATION_REPORT.md` | Audit Deliverable 2 | Master architectural & security remediation report (`CC-01`..`CC-08`, `AF-01`..`AF-03`). |
| 5 | `docs/audits/production/PACKAGE_3F_106_SECURITY_FINDINGS_REGISTER.md` | Audit Deliverable 3 | Complete security findings register with root causes, fixes, and `FIXED_AND_TESTED` verification evidence. |
| 6 | `docs/audits/production/PACKAGE_3F_106_REGRESSION_TEST_REGISTER.md` | Audit Deliverable 4 | Behavioral regression test register, build/lint log, and test-to-remediation traceability matrix. |
| 7 | `docs/audits/production/PACKAGE_3F_106_PRODUCTION_READINESS_AND_OWNER_SIGNOFF.md` | Audit Deliverable 5 | Independent adversarial review, production readiness categories, env var checklist, smoke-test plan, and blank Owner Sign-Off table. |
| 8 | `docs/audits/production/PACKAGE_3F_106_CHANGE_AND_ROLLBACK_MANIFEST.md` | Audit Deliverable 6 | Complete change manifest and non-destructive rollback instructions (this document). |

---

## 4. Non-Destructive Rollback Procedures

No commits, history rewrites, or remote pushes were performed during Package 3F.106; HEAD remains at `24a10079ee02c845bf8d0deaadfc318772bcd321`.

### Option A: Selective File Rollback (Restore Specific Modified Tracked File(s))
To revert any individual modified tracked file to baseline `24a10079ee02c845bf8d0deaadfc318772bcd321` without affecting untracked files or audit reports:
```powershell
git checkout 24a10079ee02c845bf8d0deaadfc318772bcd321 -- <relative-file-path>
```

### Option B: Stash Package 3F.106 Code Changes (Non-Destructive Reversible Rollback)
To temporarily shelve all modified tracked files and `src/lib/csrf.js` while keeping a full backup in the Git stash stack (preserving all audit deliverables in `docs/audits/production/`):
```powershell
git stash push -m "backup-package-3f-106-remediation" -- api/ src/ scripts/test_package_3f_106_regression.mjs
```
*(Can be restored at any time via `git stash pop`.)*
