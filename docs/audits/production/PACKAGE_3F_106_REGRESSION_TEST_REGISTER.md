# PACKAGE 3F.106 — REGRESSION TEST REGISTER

- **Project:** AVANI AGRO FOODS WEBSITE ENGINE — PROJECT A ONLY
- **Canonical Root:** `C:\Users\ALPHA-1\Downloads\21MAY2026\SACHIN SHINDE DOCUMENTS\DEVELOPEMENT TOOLS\2-AVANI AGRO FOODS LATUR 2026`
- **Package Reference:** PACKAGE 3F.106
- **Test Runner Command:** `node scripts/test_package_3f_106_regression.mjs`
- **Execution Timestamp:** `2026-11-10T09:51:06+05:30`
- **Exit Code:** `0` (`22 PASSED, 0 FAILED`)

---

## 1. Test Execution Summary

| Metric | Value |
| :--- | :--- |
| **Total Test Cases Executed** | `22` |
| **Passed** | `22` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Exit Code** | `0` |
| **Quarantined Files Accessed** | `0` (`module.registerHooks` short-circuits `importersData.js` and `manufacturersData.js` in memory) |

---

## 2. Detailed Test Register (`scripts/test_package_3f_106_regression.mjs`)

| Test ID | Category | Description & Real Handler / Function Exercised | Result | Duration |
| :--- | :--- | :--- | :--- | :--- |
| **T-01.1** | `CC-01` | Reject `Authorization: Bearer <MASTER_GATE_PASSWORD>` on `GET /api/admin-quotations` (`401`) | **PASS** | `5ms` |
| **T-01.2** | `CC-01` | Reject `Authorization: Bearer <MASTER_GATE_PASSWORD>` on `GET /api/importers` and `GET /api/manufacturers` (`401`) | **PASS** | `2ms` |
| **T-01.3** | `CC-01` | Reject unissued legacy cookie names (`avani_admin_session=authenticated`, `avani_portal_auth=<password>`) on `/api/admin-quotations` (`401`) | **PASS** | `1ms` |
| **T-02.1** | `CC-02` | Conflicting `MASTER_GATE_PASSWORD` and `PRIVATE_PORTAL_PASSWORD` fails closed with `503 CREDENTIAL_CONFLICT` (`resolveMasterGatePassword` + `POST /api/verify-gate`) | **PASS** | `3ms` |
| **T-02.2** | `CC-02` | Legacy-only `PRIVATE_PORTAL_PASSWORD` without `MASTER_GATE_PASSWORD` fails closed with `503 LEGACY_CREDENTIAL_ONLY_FORBIDDEN` (`resolveMasterGatePassword` + `POST /api/verify-gate`) | **PASS** | `0ms` |
| **T-02.3** | `CC-02` | Missing both `MASTER_GATE_PASSWORD` and `PRIVATE_PORTAL_PASSWORD` fails closed with `503 MASTER_CREDENTIAL_MISSING` | **PASS** | `0ms` |
| **T-03.1** | `CC-03` | Valid login on `POST /api/verify-gate` issues signed session + CSRF cookies, persists active record in KV, and authenticates `GET /api/importers` and `GET /api/manufacturers` (`200`) | **PASS** | `107ms` |
| **T-04.1** | `CC-03` | Reject tampered HMAC signature and tampered `sessionId` on session cookies (`401 SESSION_INVALID_SIGNATURE`) | **PASS** | `1ms` |
| **T-04.2** | `CC-03` | Reject expired session record (`401 SESSION_EXPIRED`) and unpersisted/unknown session ID (`401 SESSION_REVOKED_OR_EXPIRED`) | **PASS** | `1ms` |
| **T-05.1** | `CC-03` | KV outage during session verification returns `503 SESSION_BACKEND_UNAVAILABLE` and propagates `503` on `/api/admin-quotations` (never falls back to signature-only) | **PASS** | `2ms` |
| **T-05.2** | `CC-03` | Malformed JSON session record in KV fails closed with `401 SESSION_MALFORMED_RECORD` | **PASS** | `2ms` |
| **T-06.1** | `CC-03` | Logout (`POST /api/verify-gate` `action: 'logout'`) immediately revokes session in KV and blocks replay (`401`) across `verify-gate`, `GET/POST /api/admin-quotations`, `GET /api/importers`, and `GET /api/manufacturers` | **PASS** | `5ms` |
| **T-07.1** | `CC-04` | Exact origin allowlist accepts `https://www.avaniagrofoods.com` & `https://avaniagrofoods.com` and rejects substring/suffix spoofing (`evil-avaniagrofoods.com`, `avaniagrofoods.com.attacker.com`, `attacker-preview.vercel.app`, `localhost` in prod, `null`, missing Origin on mutations) with `403` | **PASS** | `1ms` |
| **T-08.1** | `CC-04` | Cookie-authenticated `POST /api/admin-quotations` mutations reject missing CSRF token (`403 CSRF_TOKEN_MISSING`), tampered token (`403 CSRF_TOKEN_INVALID`), and cross-session token (`403 CSRF_TOKEN_INVALID`), and accept valid session-bound `X-CSRF-Token` (`200`) | **PASS** | `173ms` |
| **T-09.1** | `CC-05` | `generateExcelQuotation` generates valid `.xlsx` buffer, opens cleanly in `ExcelJS`, has zero coupling to `MASTER_GATE_PASSWORD`, and throws `CREDENTIAL_COUPLING_FORBIDDEN` if master password is supplied | **PASS** | `149ms` |
| **T-10.1** | `CC-06` | `/api/email-reply-webhook` and `/api/admin-quotations (delivery-webhook)` reject query/body secrets (`400 UNTRUSTED_SECRET_SOURCE`), fail closed (`503 WEBHOOK_UNCONFIGURED`) when secret unset, reject bad Svix signature (`401 WEBHOOK_UNAUTHORIZED`), accept valid Svix raw-body HMAC (`200`), and reject duplicate event replay (`400`) | **PASS** | `44ms` |
| **T-11.1** | `CC-07` | Privileged `POST /api/admin-quotations` (`create-draft`, `admin-override`) ignores client-supplied `req.body.actor` / `changedBy` / `overrides.owner` and attributes audit events strictly to server-verified `gate_operator:session_<12hex>` | **PASS** | `3ms` |
| **T-12.1** | `CC-08` | Distributed rate limiter enforces threshold (`429`), fails closed (`503 RATE_LIMIT_BACKEND_UNAVAILABLE`) on KV outage in production, and `getClientIp` ignores spoofed `X-Forwarded-For` when not on Vercel / `TRUST_PROXY!=1` | **PASS** | `3ms` |
| **T-13.1** | `CC-08` | Corrupt rate-limit counter state in KV or local store is evicted (`DEL`) and fails closed with `503 RATE_LIMIT_CORRUPT_STATE` | **PASS** | `1ms` |
| **T-14.1** | `CC-08` | 15 concurrent requests against `maxAttempts: 5` increment atomically without race-condition bypass (exactly 5 allowed, 10 blocked with `429`) | **PASS** | `3ms` |
| **T-15.1** | `CC-08/AF-01/02/03` | All 10 API endpoints enforce rate-limit/KV outage propagation (`503`), `api/save-lead.js` escapes `<script>`/`<img>` HTML payloads (`AF-01`), and `api/quotation.js` sanitizes `Content-Disposition` filenames (`AF-03`) | **PASS** | `72ms` |
| **T-16.1** | `WORKFLOW` | Commercial quotation calculation (`calculateQuotation`), PDF/DOCX/XLSX generation, 20-point buyer-ready gate (`evaluateBuyerReadyGate`), and safety gate (`GLOBAL_OUTREACH_STOP=1` -> `BLOCKED_GLOBAL_STOP`) | **PASS** | `124ms` |
