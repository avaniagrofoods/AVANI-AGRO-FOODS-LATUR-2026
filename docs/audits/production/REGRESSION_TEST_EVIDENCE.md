# REGRESSION TEST EVIDENCE — PACKAGE 3F.115

All tests listed below were actually executed on 16 November 2026 after final code edits. Zero failing tests remain (**248 / 248 passed** across both projects). Mocked tests are explicitly distinguished from live infrastructure checks.

---

## 1. Project A Automated Regression Suites (97 / 97 PASSED)

| Suite Command | Exit Code | Total | Passed | Failed | Skipped | Coverage Type |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| `node scripts/test_package_3f_106_regression.mjs` | `0` | `22` | `22` | `0` | `0` | Unit, API handler mocks, KV mocks, auth/CSRF/Svix security |
| `node scripts/test_package_3f_108_regression.mjs` | `0` | `24` | `24` | `0` | `0` | Edge middleware, session revocation, X-Forwarded-For spoofing, SSRF/HTML escaping |
| `node scripts/test_package_3f_110_regression.mjs` | `0` | `18` | `18` | `0` | `0` | Static AST/source checks, quotation engine, mocked webhook/DB idempotency |
| `node scripts/test_package_3f_112_regression.mjs` | `0` | `20` | `20` | `0` | `0` | Migration static checks, `inquiry_id=null`, snake/camel mapping, HTTP 429 retry |
| `node scripts/test_package_3f_115_regression.mjs` | `0` | `13` | `13` | `0` | `0` | Atomic Lua `EVAL` CAS mocks, 10-worker concurrency race, lease expiry, DB failure release, webhook bridge, `SEQ-01`..`05` compliance, 13-stage ecosystem API |
| **PROJECT A TOTAL** | **`0`** | **`97`** | **`97`** | **`0`** | **`0`** | **100% PASS (Offline / Mocked Infrastructure)** |

---

## 2. Project B Automated Test Suite (151 / 151 PASSED)

- **Exact Command (run from `AVANI_AGRO_INTELLIGENCE`):**  
  `C:\Python314\python.exe -m unittest discover -s tests -p "test_*.py" -v`
- **Result:** `Ran 151 tests in 35.317s -> OK` (`PROJECT_B_EXIT_CODE=0`, `0 failures`, `0 skipped`).
- **Pre-fix baseline:** Caught and fixed 2 real Svix signature verification failures (`test_valid_svix_signature`, `test_replay_duplicate_deduplicated`) plus added 4 new tests in `tests/unit/test_ecosystem_and_fencing_3f115.py`.
- **Coverage Type:** Real local SQLite WAL database integration, mocked libSQL HTTP pipeline, queue concurrency fencing, Svix crypto, sequence engine, and E2E synthetic pipeline.

---

## 3. Build & Static Verification

- **Vite Production Build (`cmd.exe /c "npm run build"`):** Exit code `0`, `2146 modules transformed`, built in `15.63s` (`dist/index.html`, `dist/assets/index-D9l62DFI.js`, `dist/assets/PrivateDashboard-CsrdaSFU.js`).
- **ESLint (`cmd.exe /c "npm run lint"`):** Exit code `1` (`'eslint' is not recognized` — `eslint` binary is not installed in `package.json` `devDependencies`).
- **Live Production HTTP Smoke Tests:** Executed read-only HTTP GET checks against `https://www.avaniagrofoods.com/` (see `LIVE_WEBSITE_AUDIT_REPORT.md`).
