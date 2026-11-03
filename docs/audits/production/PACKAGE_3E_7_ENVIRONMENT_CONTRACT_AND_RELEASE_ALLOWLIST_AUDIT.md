# AVANI AGRO FOODS — PACKAGE 3E.7: ENVIRONMENT CONTRACT AND RELEASE ALLOWLIST AUDIT

- **Audit ID:** `AAF-3E7-20261018`
- **Date:** `2026-10-18`
- **Auditor Role:** Independent Security, Release Engineering & Environment Contract Auditor
- **Authorized Repository:** `C:\Users\ALPHA-1\Downloads\21MAY2026\SACHIN SHINDE DOCUMENTS\DEVELOPEMENT TOOLS\2-AVANI AGRO FOODS LATUR 2026`
- **Branch / HEAD:** `main` @ `2f2d73c3cbb04783cc2e54cfedaea919a3846c69`
- **Live Production Deployment (`www.avaniagrofoods.com`):** `dpl_6yuoycp4AUH8QS4U917Ue1fs5oeg` (`https://avani-agro-foods-latur-2026-3dmvvn1er.vercel.app`, Commit `30c0790d0b264f199c1604522b211b4139421517`, Status `● Ready`)
- **Audit Mode:** `STRICT READ-ONLY INSPECTION (Zero Source Edits, Zero File/State Resets, Zero Git Staging/Commits, Zero Deployments, Zero Secret Exposure, Zero Outreach)`
- **Final Release Readiness Status:** **HOLD**

---

## Executive Audit Summary (`PASS` / `FAIL` / `NOT VERIFIED`)

| Step | Audit Domain | Status | Evidence Summary |
| :---: | :--- | :---: | :--- |
| **Step 1** | **Baseline & Working-Tree Preservation** | **PASS** | `HEAD` is `2f2d73c3cbb04783cc2e54cfedaea919a3846c69` on `main`. `15` tracked modified files (`4668 insertions(+), 825 deletions(-)`), `0` staged files, and `24` pre-audit untracked files preserved untouched. |
| **Step 2** | **Source-of-Truth Environment Contract** | **PASS** | Exhaustively mapped all `32` server/client environment variables from source across `api/`, `src/`, and `scripts/`. Established exact `KV_REST_API_*` $\rightarrow$ `UPSTASH_REDIS_REST_*` precedence, silent local-fallback behavior when `REQUIRE_DISTRIBUTED_KV` is unset, and exact behavior of `GLOBAL_OUTREACH_STOP`, `OUTREACH_AUTHORIZED`, `REAL_BUYER_EMAILS`, and `REAL_BUYER_CONTACT` (proving `process.env.REAL_BUYER_CONTACT` is **never** read by runtime `api/` code). |
| **Step 3** | **Read-Only Remote Metadata & Live Deployment Identity** | **FAIL** *(Remote Env Blocker)* | Independently re-verified via `vercel inspect www.avaniagrofoods.com --no-color` and `vercel env ls --no-color` (`task-8344`): live domain points to `dpl_6yuoycp4AUH8QS4U917Ue1fs5oeg` (commit `30c0790d`). Remote Vercel environment has `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_WEBHOOK_SECRET`, `CRM_WEBHOOK_SECRET`, `SESSION_SECRET`, `MASTER_GATE_PASSWORD`, and `AFFILIATE_PASSWORD` (`Encrypted`), but is **missing** both KV credential pairs (`KV_REST_API_*` / `UPSTASH_REDIS_REST_*`), `REQUIRE_DISTRIBUTED_KV`, `CRON_SECRET`, and explicit `GLOBAL_OUTREACH_STOP` / `OUTREACH_AUTHORIZED` / `REAL_BUYER_EMAILS` / `REAL_BUYER_CONTACT` variables. |
| **Step 4** | **Sequence State Inspection & Preservation (`sequenceStateStore.json`)** | **PASS** *(Preserved; Excluded from Release)* | Read-only structural comparison against `HEAD:api/_data/sequenceStateStore.json` proved `HEAD` contains `3` Phase 3O pilot records (`3,240` B), whereas working tree (`32,626` B) contains `28` additional synthetic test/challenge records (`CAMP-01:*@target.com`, `CAMP-01:*@challenge.com`, `CAMP-CHALLENGE:*`, etc.) dual-written by 3 test scripts that omitted `SEQUENCE_STORE_PATH`. File preserved untouched and placed on the Release Exclusion List. |
| **Step 5** | **Release File Allowlist & Exclusion List (`Categories A–F`)** | **PASS** | Classified all `15` tracked modified files and all `25` untracked files into Categories `A`–`F` with code-level rationale. Produced an exact-path Release Allowlist and an exact-path Exclusion List. |
| **Step 6** | **Protected Dataset SHA-256 Hashes** | **PASS** | All 3 protected datasets (`importersData.js`, `importersData.snapshot-642.json`, `manufacturersData.js`) match their baseline SHA-256 hashes bit-for-bit. |

---

## 1. Step 1 — Repository Baseline

### 1.1 Exact Baseline Commands Executed
```powershell
git rev-parse --show-toplevel
git branch --show-current
git rev-parse HEAD
git status --short
git diff --stat
git diff --name-status
git diff --cached --stat
git diff --cached --name-status
git ls-files --others --exclude-standard
Test-Path "docs/audits/production/PACKAGE_3E_7_ENVIRONMENT_CONTRACT_AND_RELEASE_ALLOWLIST_AUDIT.md"
```

### 1.2 Recorded Baseline Output
- **Repository Root:** `C:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN SHINDE DOCUMENTS/DEVELOPEMENT TOOLS/2-AVANI AGRO FOODS LATUR 2026`
- **Branch:** `main`
- **HEAD Commit:** `2f2d73c3cbb04783cc2e54cfedaea919a3846c69` *(Matches expected `HEAD`)*
- **Staged Diff (`git diff --cached --stat` & `git diff --cached --name-status`):** *(Empty — `0` staged files)*
- **Pre-Existence Check (`Test-Path`):** `False`

#### Tracked Modified Files (`15` files — `4668 insertions(+), 825 deletions(-)`)
```text
M	api/_data/sequenceStateStore.json            | 1130 ++++++++++++++++++++-
M	api/_lib/dailyThroughputGovernor.js          |  344 ++++++-
M	api/_lib/quotationEngine.js                  |  221 ++---
M	api/_lib/quotationModel.js                   |  639 +++++++++++-
M	api/_lib/replyDetector.js                    |  109 ++-
M	api/_lib/sequencePersistence.js              | 1354 +++++++++++++++++++++++++-
M	api/_lib/sequenceStateMachine.js             |  673 ++++++++++++-
M	api/email-reply-webhook.js                   |  186 +++-
M	api/quotation.js                             |    7 +
M	scripts/audit_secrets.cjs                    |  132 ++-
M	scripts/execute_phase_3o_controlled_send.cjs |  163 ++--
M	scripts/test_p4_4_processor_confirmation.cjs |   15 +-
M	scripts/test_p4_5_email_dispatch.cjs         |   11 +-
M	src/data/quotationModel.js                   |  494 +---------
M	src/pages/AdminQuotations.jsx                |   15 +-
```

#### Untracked Files at Baseline (`24` files before creating this report)
1. `PHASE_3P_INDEPENDENT_VERIFICATION_REPORT.md`
2. `api/cron-sequence-dispatch.js`
3. `docs/audits/production/AAF-PRODUCTION-20261010-2300-PHASE2-PHASE3.md`
4. `docs/audits/production/AAF-PRODUCTION-20261010-2330-PHASE4.md`
5. `docs/audits/production/AAF-PRODUCTION-20261011-PHASE5.md`
6. `docs/audits/production/PACKAGE_3D_FINAL_REMEDIATION_REPORT.md`
7. `docs/audits/production/PACKAGE_3D_INDEPENDENT_VERIFICATION_REPORT.md`
8. `docs/audits/production/PACKAGE_3E_2_REMEDIATION_REPORT.md`
9. `docs/audits/production/PACKAGE_3E_4_REMEDIATION_REPORT.md`
10. `docs/audits/production/PACKAGE_3E_5_INDEPENDENT_ACCEPTANCE_AUDIT.md`
11. `docs/audits/production/PACKAGE_3E_6_RELEASE_READINESS_AUDIT.md`
12. `docs/audits/production/REMEDIATION_PACKAGE_3B_INDEPENDENT_VERIFICATION_REPORT.md`
13. `docs/audits/production/REMEDIATION_PACKAGE_3C_IMPLEMENTATION_REPORT.md`
14. `docs/audits/production/REMEDIATION_PACKAGE_3C_INDEPENDENT_VERIFICATION_REPORT.md`
15. `docs/audits/production/REMEDIATION_PACKAGE_3D_IMPLEMENTATION_REPORT.md`
16. `scripts/audit_package_3c_independent_challenge.cjs`
17. `scripts/audit_package_3d_independent_challenge.cjs`
18. `scripts/test_distributed_persistence_matrix.cjs`
19. `scripts/test_package_3c_concurrency_matrix.cjs`
20. `scripts/test_package_3d_regression.cjs`
21. `scripts/test_phase_4_sequence_regression.cjs`
22. `scripts/test_phase_5_quotation_regression.cjs`
23. `scripts/test_webhook_raw_body_resilience.cjs`
24. `src/data/quotationCore.js`

---

## 2. Step 2 — Source-of-Truth Environment Variable Contract

### 2.1 Complete Environment Variable Contract Table
Every `process.env.<VAR>` and `import.meta.env.<VAR>` reference across `api/`, `src/`, `vercel.json`, `package.json`, and `scripts/` was extracted and verified directly against source files:

| Exact Variable Name | Exact Source File(s) & Line(s) | Purpose | Required or Optional | Fail-Closed / Default Behavior When Missing | Relevant Vercel Target Scopes | Secret? | Safe Verification Method |
| :--- | :--- | :--- | :---: | :--- | :---: | :---: | :--- |
| **`KV_REST_API_URL`** | [api/_lib/sequencePersistence.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/_lib/sequencePersistence.js#L46-L58) (`:46`, `:56`), [api/_lib/auth.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/_lib/auth.js#L16) (`:16`) | Primary REST endpoint URL for Vercel KV / Upstash Redis distributed state, leases, rate limits, and webhook event deduplication. | **Required** *(Either `KV_REST_API_*` pair OR `UPSTASH_REDIS_REST_*` pair)* | Falls back to `process.env.UPSTASH_REDIS_REST_URL`. If both URL or Token are missing: when `REQUIRE_DISTRIBUTED_KV=1` (or `STRICT_KV_ENFORCEMENT=1`), throws `KV_CREDENTIALS_MISSING` / blocks fail-closed (`503` in webhook, `blocked: true` in sequence reservation & governor). **When `REQUIRE_DISTRIBUTED_KV` is unset, silently falls back to ephemeral local `/tmp/sequenceStateStore.json`!** | `Production`, `Preview` | **No** *(Endpoint URL, stored `Encrypted` in Vercel)* | `vercel env ls --no-color` (check variable name & scope) |
| **`KV_REST_API_TOKEN`** | [api/_lib/sequencePersistence.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/_lib/sequencePersistence.js#L47-L58) (`:47`, `:57`), [api/_lib/auth.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/_lib/auth.js#L17) (`:17`) | Primary Bearer authentication token for Vercel KV / Upstash Redis REST API. | **Required** *(Either `KV_REST_API_*` pair OR `UPSTASH_REDIS_REST_*` pair)* | Falls back to `process.env.UPSTASH_REDIS_REST_TOKEN`. Same fail-closed vs. `/tmp` fallback behavior as `KV_REST_API_URL`. | `Production`, `Preview` | **Yes** | `vercel env ls --no-color` |
| **`UPSTASH_REDIS_REST_URL`** | [api/_lib/sequencePersistence.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/_lib/sequencePersistence.js#L46-L58) (`:46`, `:56`), [api/_lib/auth.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/_lib/auth.js#L16) (`:16`) | Secondary (fallback) REST endpoint URL for direct Upstash Redis integration when `KV_REST_API_URL` is unset. | **Required only if `KV_REST_API_URL` is not set** | Used only when `KV_REST_API_URL` is falsy (`undefined` or `""`). | `Production`, `Preview` | **No** *(Endpoint URL, stored `Encrypted` in Vercel)* | `vercel env ls --no-color` |
| **`UPSTASH_REDIS_REST_TOKEN`** | [api/_lib/sequencePersistence.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/_lib/sequencePersistence.js#L47-L58) (`:47`, `:57`), [api/_lib/auth.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/_lib/auth.js#L17) (`:17`) | Secondary (fallback) Bearer token for direct Upstash Redis integration when `KV_REST_API_TOKEN` is unset. | **Required only if `KV_REST_API_TOKEN` is not set** | Used only when `KV_REST_API_TOKEN` is falsy (`undefined` or `""`). | `Production`, `Preview` | **Yes** | `vercel env ls --no-color` |
| **`REQUIRE_DISTRIBUTED_KV`** | [api/email-reply-webhook.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/email-reply-webhook.js#L255) (`:255`), [api/_lib/sequencePersistence.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/_lib/sequencePersistence.js#L64) (`:64`, `:93`, `:104`, `:123`, `:188`, `:1300`, etc.), [api/_lib/dailyThroughputGovernor.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/_lib/dailyThroughputGovernor.js#L293) (`:293`, `:488`, `:531`), [api/_lib/sequenceStateMachine.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/_lib/sequenceStateMachine.js#L1132) (`:1132`, `:1176`) | Enforces strict fail-closed distributed KV operation (`==='1'`), preventing silent fallback to per-instance `/tmp/sequenceStateStore.json` on Vercel. | **Required (`='1'`)** for Production Serverless Safety | **Not fail-closed when missing!** If unset or `!== '1'`, `sequencePersistence.js` and `dailyThroughputGovernor.js` silently fall back to local `/tmp` storage when KV is unconfigured or errors out. Must be set to `'1'` in production. | `Production`, `Preview` | **No** (`'1'`) | `vercel env ls --no-color` |
| **`STRICT_KV_ENFORCEMENT`** | [api/_lib/sequencePersistence.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/_lib/sequencePersistence.js#L188) (`:188`, `:447`, `:1300`), [api/_lib/dailyThroughputGovernor.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/_lib/dailyThroughputGovernor.js#L293) (`:293`) | Secondary alias checked alongside `REQUIRE_DISTRIBUTED_KV === '1'` in `reserveSequenceStepDistributed` and `reserveDailyThroughputSlotDistributed`. | **Optional** *(Redundant if `REQUIRE_DISTRIBUTED_KV=1` is set)* | Checked via `process.env.REQUIRE_DISTRIBUTED_KV === '1' \|\| process.env.STRICT_KV_ENFORCEMENT === '1'`. Note that `execKVCommand` and `api/email-reply-webhook.js` only check `REQUIRE_DISTRIBUTED_KV === '1'`, so `REQUIRE_DISTRIBUTED_KV=1` is the primary required flag. | `Production`, `Preview` | **No** (`'1'`) | `vercel env ls --no-color` |
| **`REQUIRE_DURABLE_STORAGE`** | [api/_lib/sequencePersistence.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/_lib/sequencePersistence.js#L628) (`:628`) | Forces synchronous `commitSequenceStep` to fail closed if `saveStore()` fails. | **Optional** *(Auto-enabled when `NODE_ENV === 'production'`)* | Checked as `process.env.REQUIRE_DURABLE_STORAGE === '1' \|\| process.env.NODE_ENV === 'production'`. | `Production`, `Preview` | **No** (`'1'`) | `vercel env ls --no-color` |
| **`KV_TIMEOUT_MS`** | [api/_lib/sequencePersistence.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/_lib/sequencePersistence.js#L72) (`:72`, `:131`) | Timeout in ms for Upstash/Vercel KV REST requests. | **Optional** | Defaults to `1500` ms for `execKVCommand` and `2500` ms for `execKVPipeline`. | `Production`, `Preview` | **No** | `vercel env ls --no-color` |
| **`CRON_SECRET`** | [api/cron-sequence-dispatch.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/cron-sequence-dispatch.js#L49-L60) (`:49–60`) | Bearer / `x-cron-secret` token verified via `crypto.timingSafeEqual` for `/api/cron-sequence-dispatch`. | **Required** | **Fails closed (`401 UNAUTHORIZED`)** if `CRON_SECRET` is missing, empty, or does not match the request token. | `Production`, `Preview` | **Yes** | `vercel env ls --no-color` |
| **`GLOBAL_OUTREACH_STOP`** | [api/cron-sequence-dispatch.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/cron-sequence-dispatch.js#L63-L70) (`:63–70`), [api/_lib/quotationModel.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/_lib/quotationModel.js#L27-L43) (`:27–43`, `:287–308`) | Master emergency kill-switch halting all sequence and quotation email dispatches. Must be `'1'` during hold/safe operation. | **Required (`='1'`)** | **Fails closed (STOPPED)** when `undefined`, `""`, `'1'`, `'true'`, or malformed. Only `'0'` (or `'false'` in `quotationModel.js`) permits passage. | `Production`, `Preview`, `Development` | **No** (`'1'` or `'0'`) | `vercel env ls --no-color` |
| **`OUTREACH_AUTHORIZED`** | [api/cron-sequence-dispatch.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/cron-sequence-dispatch.js#L73-L80) (`:73–80`), [api/_lib/quotationModel.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/_lib/quotationModel.js#L49-L60) (`:49–60`, `:311–328`) | Explicit server-side authorization gate for outbound sequence and quotation emails. Must be `'0'` during hold/safe operation. | **Required (`='0'`)** | **Fails closed (`403` / `BLOCKED_UNAUTHORIZED`)** when `undefined`, `""`, `'0'`, `'false'`, or malformed. Only `'1'` (or `'true'` in `quotationModel.js`) authorizes. | `Production`, `Preview`, `Development` | **No** (`'0'` or `'1'`) | `vercel env ls --no-color` |
| **`REAL_BUYER_EMAILS`** | [api/_lib/quotationModel.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/_lib/quotationModel.js#L87-L98) (`:87–98`, `:155–166`) | Secondary hard gate immediately preceding live `fetch()` to Resend or SendGrid in `sendQuotationEmail`. Must be `'0'` during hold/safe operation. | **Required (`='0'`)** | **Fails closed (`BLOCKED_REAL_BUYER_EMAILS`)** when `undefined`, `""`, `'0'`, `'false'`, or malformed. Only `'1'` or `'true'` allows live provider transmission in `quotationModel.js`. *(Not read by `cron-sequence-dispatch.js` or `sequenceStateMachine.js`).* | `Production`, `Preview`, `Development` | **No** (`'0'` or `'1'`) | `vercel env ls --no-color` |
| **`REAL_BUYER_CONTACT`** | [scripts/execute_phase_3o_controlled_send.cjs](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/scripts/execute_phase_3o_controlled_send.cjs#L376) (`:376` — static JSON telemetry field only) | Policy safety invariant flag. **Not read from `process.env` by any runtime file in `api/` or `src/`.** | **Policy Flag (`='0'`)** | Ignored by runtime `api/` code when absent, malformed, or set; runtime protection relies on `GLOBAL_OUTREACH_STOP`, `OUTREACH_AUTHORIZED`, `REAL_BUYER_EMAILS`, and `approvedForOutreach === true`. Should still be set to `'0'` for policy consistency. | `Production`, `Preview`, `Development` | **No** (`'0'`) | `vercel env ls --no-color` |
| **`RESEND_WEBHOOK_SECRET`** | [api/email-reply-webhook.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/email-reply-webhook.js#L207) (`:207`), [api/admin-quotations.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/admin-quotations.js#L426) (`:426`), [api/_lib/quotationModel.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/_lib/quotationModel.js#L540) (`:540`) | Primary signing secret (`whsec_...`) for Svix HMAC-SHA256 verification on `/api/email-reply-webhook` and fallback secret on `/api/admin-quotations` delivery webhooks. | **Required** | Falls back to `CRM_WEBHOOK_SECRET` then `WEBHOOK_SECRET`. If all three are missing, **fails closed** (`500 WEBHOOK_UNCONFIGURED` in `email-reply-webhook.js`; `503 WEBHOOK_UNCONFIGURED` in `admin-quotations.js`). | `Production`, `Preview` | **Yes** | `vercel env ls --no-color` |
| **`CRM_WEBHOOK_SECRET`** | [api/admin-quotations.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/admin-quotations.js#L162) (`:162`, `:426`), [api/_lib/quotationModel.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/_lib/quotationModel.js#L540) (`:540`), [api/email-reply-webhook.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/email-reply-webhook.js#L207) (`:207`), [api/save-lead.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/save-lead.js#L285) (`:285`, `:303`) | Primary secret for quotation delivery webhooks (`processDeliveryWebhook`) and outbound Google Sheets CRM sync payload authentication. | **Required** | In `admin-quotations.js` / `quotationModel.js`, falls back to `WEBHOOK_SECRET` then `RESEND_WEBHOOK_SECRET` (fails closed if all 3 are unset). In `save-lead.js`, defaults to `''` in outbound Sheets payload. | `Production`, `Preview` | **Yes** | `vercel env ls --no-color` |
| **`WEBHOOK_SECRET`** | [api/email-reply-webhook.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/email-reply-webhook.js#L207) (`:207`), [api/admin-quotations.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/admin-quotations.js#L426) (`:426`), [api/_lib/quotationModel.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/_lib/quotationModel.js#L540) (`:540`) | Legacy fallback webhook secret alias when `RESEND_WEBHOOK_SECRET` and `CRM_WEBHOOK_SECRET` are unset. | **Optional** *(Covered by `RESEND_WEBHOOK_SECRET` and `CRM_WEBHOOK_SECRET`)* | Not used when `RESEND_WEBHOOK_SECRET` and `CRM_WEBHOOK_SECRET` are set. | `Production`, `Preview` | **Yes** | `vercel env ls --no-color` |
| **`SESSION_SECRET`** | [api/_lib/auth.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/_lib/auth.js#L91) (`:91`) — used by `verify-gate.js`, `affiliate-auth.js`, `admin-quotations.js`, `importers.js`, `manufacturers.js` | HMAC-SHA256 signing secret for HttpOnly session cookies (`avani_gate_session`, `avani_affiliate_session`). | **Required** | **Fails closed:** `verify-gate.js` (`:105`) and `affiliate-auth.js` return `500` on login and `401` on cookie verification when `SESSION_SECRET` is missing. | `Production`, `Preview` | **Yes** | `vercel env ls --no-color` |
| **`MASTER_GATE_PASSWORD`** | [api/verify-gate.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/verify-gate.js#L51) (`:51`), [api/admin-quotations.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/admin-quotations.js#L23) (`:23`), [api/importers.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/importers.js#L36) (`:36`), [api/manufacturers.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/manufacturers.js#L23) (`:23`), [api/quotation.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/quotation.js#L54) (`:54`), [api/_lib/quotationEngine.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/_lib/quotationEngine.js#L838) (`:838`) | Master password for private portal authentication (`/api/verify-gate`, `/api/importers`, `/api/manufacturers`, `/api/admin-quotations`) and XLSX sheet protection password (`/api/quotation?action=download-xlsx`). | **Required** | In auth routes, checked via `process.env.PRIVATE_PORTAL_PASSWORD \|\| process.env.MASTER_GATE_PASSWORD`; if both are missing, **fails closed** (`500` on login, `401` on Bearer auth). In `quotation.js:54`, defaults to `''` (unprotected XLSX sheet if unset). | `Production`, `Preview` | **Yes** | `vercel env ls --no-color` |
| **`PRIVATE_PORTAL_PASSWORD`** | [api/verify-gate.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/verify-gate.js#L51) (`:51`), [api/admin-quotations.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/admin-quotations.js#L23) (`:23`), [api/importers.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/importers.js#L36) (`:36`), [api/manufacturers.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/manufacturers.js#L23) (`:23`) | Optional override password taking precedence over `MASTER_GATE_PASSWORD` for private portal routes (`PRIVATE_PORTAL_PASSWORD \|\| MASTER_GATE_PASSWORD`). | **Optional** *(Covered by `MASTER_GATE_PASSWORD`)* | Falls back cleanly to `MASTER_GATE_PASSWORD`. | `Production`, `Preview` | **Yes** | `vercel env ls --no-color` |
| **`AFFILIATE_PASSWORD`** | [api/affiliate-auth.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/affiliate-auth.js#L50) (`:50`) | Password for affiliate portal login (`/api/affiliate-auth`). | **Required** | **Fails closed (`500`)** if missing when login is attempted. | `Production`, `Preview` | **Yes** | `vercel env ls --no-color` |
| **`RESEND_API_KEY`** | [api/_lib/quotationModel.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/_lib/quotationModel.js#L85-L101) (`:85`, `:101`), [scripts/execute_phase_3o_controlled_send.cjs](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/scripts/execute_phase_3o_controlled_send.cjs#L169) (`:169`) | API key for Resend transactional email provider (gated behind `GLOBAL_OUTREACH_STOP=0`, `OUTREACH_AUTHORIZED=1`, `REAL_BUYER_EMAILS=1`). | **Required** *(for email capability when authorized)* | In `quotationModel.js`, if missing and `SENDGRID_API_KEY` is also missing, returns `{ success: false, status: 'READY_TO_SEND', provider: 'none' }` (no false `SENT` status). | `Production`, `Preview` | **Yes** | `vercel env ls --no-color` |
| **`RESEND_FROM_EMAIL`** | [api/_lib/quotationModel.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/_lib/quotationModel.js#L108) (`:108`) | Sender identity for Resend quotation emails. | **Optional** *(Has safe default, currently provisioned)* | Defaults to `'AVANI AGRO FOODS <sales@avaniagrofoods.com>'`. | `Production`, `Preview` | **No** *(Stored `Encrypted` in Vercel)* | `vercel env ls --no-color` |
| **`SENDGRID_API_KEY`** | [api/_lib/quotationModel.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/_lib/quotationModel.js#L153-L171) (`:153`, `:171`) | Secondary fallback email provider API key if `RESEND_API_KEY` is unset. | **Optional** | Ignored when `RESEND_API_KEY` is set. | `Production`, `Preview` | **Yes** | `vercel env ls --no-color` |
| **`SENDGRID_FROM_EMAIL`** | [api/_lib/quotationModel.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/_lib/quotationModel.js#L176) (`:176`) | Sender address for SendGrid fallback provider. | **Optional** | Defaults to `'sales@avaniagrofoods.com'`. | `Production`, `Preview` | **No** | `vercel env ls --no-color` |
| **`DAILY_PILOT_LIMIT`** | [api/_lib/dailyThroughputGovernor.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/_lib/dailyThroughputGovernor.js#L99) (`:99`, `:265`) | Daily outbound sequence email cap (`1..1000`). | **Optional** | Defaults to `20` (`DEFAULT_DAILY_PILOT_LIMIT`) when unset or `""`. **Fails closed** (`CONFIG_FAIL_CLOSED`) if non-integer, $\le 0$, or $> 1000$. | `Production`, `Preview` | **No** | `vercel env ls --no-color` |
| **`MAX_SENDS_PER_MINUTE`** | [api/_lib/dailyThroughputGovernor.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/_lib/dailyThroughputGovernor.js#L103) (`:103`, `:269`) | Per-minute anti-burst pacing limit (`1..60`). | **Optional** | Defaults to `1` (`DEFAULT_MAX_SENDS_PER_MINUTE`) when unset or `""`. **Fails closed** (`CONFIG_FAIL_CLOSED`) if non-integer, $\le 0$, or $> 60$. | `Production`, `Preview` | **No** | `vercel env ls --no-color` |
| **`GOOGLE_SHEETS_WEBHOOK` / `VITE_GOOGLE_SHEETS_WEBHOOK`** | [api/admin-quotations.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/admin-quotations.js#L153) (`:153`), [api/save-lead.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/save-lead.js#L275) (`:275`) | Apps Script webhook URL for syncing inquiries and quotations to Google Sheets (`GOOGLE_SHEETS_WEBHOOK \|\| VITE_GOOGLE_SHEETS_WEBHOOK`). | **Optional** *(Currently provisioned via `VITE_GOOGLE_SHEETS_WEBHOOK`)* | Skips Google Sheets sync gracefully if unset. | `Production`, `Preview`, `Development` | **Yes** *(Webhook URL)* | `vercel env ls --no-color` |
| **`ZAPIER_WEBHOOK_URL`** | [api/save-lead.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/save-lead.js#L270) (`:270`, `:315`) | Optional Zapier webhook URL for new lead notifications. | **Optional** *(Provisioned)* | Sets `integrations.zapier = 'NOT_CONFIGURED'` when unset. | `Production`, `Preview` | **Yes** *(Webhook URL)* | `vercel env ls --no-color` |
| **`HUBSPOT_ACCESS_TOKEN`** | [api/save-lead.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/save-lead.js#L269) (`:269`) | Optional HubSpot integration status flag. | **Optional** *(Provisioned)* | Sets `integrations.hubSpot = 'NOT_CONFIGURED'` when unset. | `Production`, `Preview` | **Yes** | `vercel env ls --no-color` |
| **`PICKY_ASSIST_URL`** | [api/save-lead.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/save-lead.js#L271) (`:271`, `:329`) | Optional WhatsApp notification webhook URL. | **Optional** | Sets `integrations.whatsapp = 'NOT_CONFIGURED'` when unset. | `Production`, `Preview` | **Yes** *(Webhook URL)* | `vercel env ls --no-color` |
| **`VITE_EMAILJS_*` (`SERVICE_ID`, `PUBLIC_KEY`, `TEMPLATE_*`)** | [src/lib/emailjs.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/src/lib/emailjs.js#L3-L9) (`:3–9`) | Public client-side EmailJS configuration for website contact/inquiry forms. | **Optional** *(Provisioned)* | Falls back to default client template IDs in `src/lib/emailjs.js`. | `Production`, `Preview`, `Development` | **No** *(Public client keys)* | `vercel env ls --no-color` |
| **`SEQUENCE_STORE_PATH` / `SIMULATE_STORAGE_FAILURE`** | [api/_lib/sequencePersistence.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/_lib/sequencePersistence.js#L26) (`:26`, `:248`) | Local test-isolation override path and simulated disk-failure injection hook. | **Test-Only** *(Must NOT be set in Vercel)* | When unset, uses normal storage resolution. | **None** *(Local tests only)* | **No** | Confirm absent in `vercel env ls --no-color` |

---

### 2.2 KV / Upstash Redis Naming, Precedence, and Fallback Resolution (From Source)

1. **Exact Source Code Evidence:**
   - **[api/_lib/sequencePersistence.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/_lib/sequencePersistence.js#L45-L58) (lines `45–58`):**
     ```javascript
     export function getKvConfig() {
       const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
       const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
       return {
         url,
         token,
         hasDistributedKV: Boolean(url && token)
       };
     }
     ```
   - **[api/_lib/auth.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/_lib/auth.js#L16-L18) (lines `16–18`):**
     ```javascript
     const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
     const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
     export const hasDistributedKV = Boolean(kvUrl && kvToken);
     ```
2. **Are Both Naming Pairs Supported?**
   - **Yes.** Both the Vercel KV naming convention (`KV_REST_API_URL` + `KV_REST_API_TOKEN`) and the Upstash Redis REST naming convention (`UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`) are directly supported in both `api/_lib/sequencePersistence.js` and `api/_lib/auth.js`. Both modules speak the standard Upstash Redis REST protocol (`Authorization: Bearer ${token}`).
3. **Exact Precedence & Mismatch Hazard:**
   - **URL Precedence:** `KV_REST_API_URL` is evaluated first; `UPSTASH_REDIS_REST_URL` is used only if `KV_REST_API_URL` is falsy (`undefined` or `""`).
   - **Token Precedence:** `KV_REST_API_TOKEN` is evaluated first; `UPSTASH_REDIS_REST_TOKEN` is used only if `KV_REST_API_TOKEN` is falsy (`undefined` or `""`).
   - **Non-Interchangeability of Mixed Pairs:** Because `url` and `token` resolve independently via `||`, setting `KV_REST_API_URL` alongside `UPSTASH_REDIS_REST_TOKEN` (from different databases) would pair mismatched credentials. Operators must provision a complete, matched pair (recommended: `KV_REST_API_URL` + `KV_REST_API_TOKEN`, or both pairs set to the exact same Upstash REST endpoint and token).
4. **Critical Fallback Discovery (`REQUIRE_DISTRIBUTED_KV=1` Requirement):**
   - In `api/_lib/sequencePersistence.js` (lines `63–70`, `675`, `1111`, `1300`) and `api/_lib/dailyThroughputGovernor.js` (lines `292–314`), if `hasDistributedKV` is `false` **and** `REQUIRE_DISTRIBUTED_KV !== '1'` (and `STRICT_KV_ENFORCEMENT !== '1'`), the code **does not fail closed** — it silently falls back to local file persistence (`/tmp/sequenceStateStore.json` on Vercel lambda), which is ephemeral across serverless instances!
   - Furthermore, [api/cron-sequence-dispatch.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/cron-sequence-dispatch.js#L121) calls `getRecipientSequenceStateDistributed(campaignId, recipientId)` at line `121` without checking `getStorageConfiguration().hasDistributedKV` first; if `REQUIRE_DISTRIBUTED_KV` is unset and KV credentials are missing, `getRecipientSequenceStateDistributed` falls back to `getRecipientSequenceState` (reading the bundled `api/_data/sequenceStateStore.json`!).
   - **Mandatory Contract Rule:** Remote Vercel `Production` and `Preview` environments **must** set `REQUIRE_DISTRIBUTED_KV=1` alongside `KV_REST_API_URL` and `KV_REST_API_TOKEN` so that any missing or unreachable KV backend fails closed immediately rather than falling back to `/tmp` or bundled JSON state.

---

### 2.3 Safety Invariant Interpretation Matrix (`GLOBAL_OUTREACH_STOP`, `OUTREACH_AUTHORIZED`, `REAL_BUYER_EMAILS`, `REAL_BUYER_CONTACT`)

| Safety Variable & Code Location | When Absent (`undefined`) | When Empty (`""`) or Whitespace | When Malformed (`"invalid"`, `"2"`, `"yes"`) | When Set to `'0'` / `'false'` | When Set to `'1'` / `'true'` |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`GLOBAL_OUTREACH_STOP`** in [api/cron-sequence-dispatch.js:63-70](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/cron-sequence-dispatch.js#L63-L70) | **BLOCKS (`403`)** (`globalStop === undefined`) | **BLOCKS (`403`)** (`"".trim() !== '0'`) | **BLOCKS (`403`)** (`!== '0'`) | `'0'` $\rightarrow$ **PERMITS** next check; `'false'` $\rightarrow$ **BLOCKS (`403`)** (`'false' !== '0'`) | **BLOCKS (`403 GLOBAL_OUTREACH_STOP_ENGAGED`)** |
| **`GLOBAL_OUTREACH_STOP`** in [api/_lib/quotationModel.js:27-43, 287-308](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/_lib/quotationModel.js#L27-L43) | **BLOCKS** (`BLOCKED_GLOBAL_STOP`) | **BLOCKS** (`BLOCKED_GLOBAL_STOP`) | **BLOCKS** (`BLOCKED_GLOBAL_STOP`) | `'0'` or `'false'` (case-insensitive) $\rightarrow$ **PERMITS** next check *(unless `options.globalOutreachStop === true`)* | **BLOCKS** (`BLOCKED_GLOBAL_STOP`) |
| **`globalOutreachStop` option** in [api/_lib/sequenceStateMachine.js:199-201, 634-636](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/_lib/sequenceStateMachine.js#L634-L636) | Does **not** read `process.env` directly; when `opts.globalOutreachStop === undefined` and `!isTestMode`, defaults to **`true` (BLOCKS)** | When `opts.globalOutreachStop === ""`, evaluates `Boolean(false)` $\rightarrow$ **PERMITS** if caller explicitly passes `""`! | When `opts.globalOutreachStop` is passed as non-`'1'` string (e.g. `'true'`), `opts.globalOutreachStop === true \|\| 1 \|\| '1'` is `false`! *(Mitigated by `cron-sequence-dispatch.js:63` checking `process.env` first)* | `false`, `0`, `'0'` $\rightarrow$ **PERMITS** next check | `true`, `1`, `'1'` $\rightarrow$ **BLOCKS** (`STOPPED_GLOBAL_STOP`) |
| **`OUTREACH_AUTHORIZED`** in [api/cron-sequence-dispatch.js:73-80](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/cron-sequence-dispatch.js#L73-L80) | **BLOCKS (`403`)** (`'undefined' !== '1'`) | **BLOCKS (`403`)** (`'' !== '1'`) | **BLOCKS (`403`)** (`!== '1'`) | **BLOCKS (`403 OUTREACH_NOT_AUTHORIZED`)** | `'1'` $\rightarrow$ **PERMITS**; `'true'` $\rightarrow$ **BLOCKS (`403`)** (`'true' !== '1'`) |
| **`OUTREACH_AUTHORIZED`** in [api/_lib/quotationModel.js:49-60, 311-328](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/_lib/quotationModel.js#L49-L60) | **BLOCKS** (`BLOCKED_UNAUTHORIZED`) | **BLOCKS** (`BLOCKED_UNAUTHORIZED`) | **BLOCKS** (`BLOCKED_UNAUTHORIZED`) | **BLOCKS** (`BLOCKED_UNAUTHORIZED`) | `'1'` or `'true'` (case-insensitive) $\rightarrow$ **PERMITS** *(unless `options.outreachAuthorized === false`)* |
| **`REAL_BUYER_EMAILS`** in [api/_lib/quotationModel.js:87-98, 155-166](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/_lib/quotationModel.js#L87-L98) | **BLOCKS** (`BLOCKED_REAL_BUYER_EMAILS`) | **BLOCKS** (`BLOCKED_REAL_BUYER_EMAILS`) | **BLOCKS** (`BLOCKED_REAL_BUYER_EMAILS`) | **BLOCKS** (`BLOCKED_REAL_BUYER_EMAILS`) | `'1'` or `'true'` (case-insensitive) $\rightarrow$ **PERMITS** live Resend/SendGrid call in `quotationModel.js`. *(Not read by `cron-sequence-dispatch.js`)* |
| **`REAL_BUYER_CONTACT`** across all `api/` and `src/` files | **NOT READ BY RUNTIME CODE** (`0` `process.env.REAL_BUYER_CONTACT` references in `api/` or `src/`) | **NOT READ BY RUNTIME CODE** | **NOT READ BY RUNTIME CODE** | **NOT READ BY RUNTIME CODE** (Used only as static JSON telemetry `REAL_BUYER_CONTACT: 0` in `scripts/execute_phase_3o_controlled_send.cjs:376`) | **NOT READ BY RUNTIME CODE** |

---

## 3. Step 3 — Read-Only Remote Metadata & Live Deployment Identity

### 3.1 Reconfirmed Live Production Deployment (`task-8344`)
Executed read-only `vercel whoami --no-color` and `vercel inspect www.avaniagrofoods.com --no-color` at `2026-10-18T11:38+05:30`:
- **Authenticated CLI Account:** `avaniagrofoods1356-4705`
- **Project Name / ID:** `avani-agro-foods-latur-2026` (`prj_3DBOT7AbclhcQ6318u4bETdbnhrQ`, Org `team_vUTeKhQxcSPYtztYtoLMWinO`)
- **Active Production Alias:** `https://www.avaniagrofoods.com` (also bound to `https://avaniagrofoods.com` and `https://avani-agro-foods-latur-2026.vercel.app`)
- **Resolved Active Deployment ID:** `dpl_6yuoycp4AUH8QS4U917Ue1fs5oeg`
- **Resolved Active Deployment URL:** `https://avani-agro-foods-latur-2026-3dmvvn1er.vercel.app`
- **Deployment Status / Target / Created:** `● Ready` / `production` / `Fri Oct 09 2026 01:12:47 GMT+0530 [9d ago]`
- **Deployed Git Commit:** `30c0790d0b264f199c1604522b211b4139421517` (`30c0790`)
- **Verification Status:** **PASS (Deployment Identity Confirmed)** — However, the candidate changes in the local working tree (`15` modified tracked files and `24` untracked files on top of `HEAD` `2f2d73c3`) are **not yet deployed** to `www.avaniagrofoods.com`.

### 3.2 Reconfirmed Remote Vercel Environment Variables (`vercel env ls --no-color`, `task-8344`)
> [!IMPORTANT]
> Only variable names, encryption flags (`Encrypted`), target environments, and creation ages were retrieved via `vercel env ls --no-color`. Zero secret values were fetched, pulled, or printed.

| Variable Name | Currently Present in Remote Vercel? | Remote Scopes Configured | Required Scopes for Candidate Release | Gap / Action Required Before Release |
| :--- | :---: | :--- | :--- | :--- |
| `KV_REST_API_URL` (or `UPSTASH_REDIS_REST_URL`) | **NO (MISSING)** | None | `Production`, `Preview` | **BLOCKER:** Must provision `KV_REST_API_URL` (or `UPSTASH_REDIS_REST_URL`) in `Production` and `Preview`. |
| `KV_REST_API_TOKEN` (or `UPSTASH_REDIS_REST_TOKEN`) | **NO (MISSING)** | None | `Production`, `Preview` | **BLOCKER:** Must provision matching `KV_REST_API_TOKEN` (or `UPSTASH_REDIS_REST_TOKEN`) in `Production` and `Preview`. |
| `REQUIRE_DISTRIBUTED_KV` | **NO (MISSING)** | None | `Production`, `Preview` | **BLOCKER:** Must set `REQUIRE_DISTRIBUTED_KV=1` in `Production` and `Preview` to prevent silent fallback to `/tmp` or bundled JSON state. |
| `CRON_SECRET` | **NO (MISSING)** | None | `Production`, `Preview` | **BLOCKER:** Must provision a strong random `CRON_SECRET` (`Encrypted`) in `Production` and `Preview`. |
| `GLOBAL_OUTREACH_STOP` | **NO (MISSING)** | None *(Defaults fail-closed in code)* | `Production`, `Preview`, `Development` | **REQUIRED SAFETY LOCK:** Explicitly set `GLOBAL_OUTREACH_STOP=1` across all scopes. |
| `OUTREACH_AUTHORIZED` | **NO (MISSING)** | None *(Defaults fail-closed in code)* | `Production`, `Preview`, `Development` | **REQUIRED SAFETY LOCK:** Explicitly set `OUTREACH_AUTHORIZED=0` across all scopes. |
| `REAL_BUYER_EMAILS` | **NO (MISSING)** | None *(Defaults fail-closed in code)* | `Production`, `Preview`, `Development` | **REQUIRED SAFETY LOCK:** Explicitly set `REAL_BUYER_EMAILS=0` across all scopes. |
| `REAL_BUYER_CONTACT` | **NO (MISSING)** | None | `Production`, `Preview`, `Development` | **POLICY LOCK:** Explicitly set `REAL_BUYER_CONTACT=0` across all scopes. |
| `RESEND_WEBHOOK_SECRET` | **YES (`Encrypted`)** | `Production, Preview` (`14d ago`) | `Production`, `Preview` | **PASS** |
| `CRM_WEBHOOK_SECRET` | **YES (`Encrypted`)** | `Production` (`18d`), `Preview` (`16d`) | `Production`, `Preview` | **PASS** |
| `RESEND_API_KEY` | **YES (`Encrypted`)** | `Production` (`16d`), `Preview` (`16d`) | `Production`, `Preview` | **PASS** |
| `RESEND_FROM_EMAIL` | **YES (`Encrypted`)** | `Production` (`16d`), `Preview` (`16d`) | `Production`, `Preview` | **PASS** |
| `SESSION_SECRET` | **YES (`Encrypted`)** | `Production` (`61d`), `Preview` (`61d`) | `Production`, `Preview` | **PASS** |
| `MASTER_GATE_PASSWORD` | **YES (`Encrypted`)** | `Production` (`59d ago`) | `Production`, `Preview` | **PASS (`Production`) / WARN (`Preview`):** Add to `Preview` if preview portal testing is needed. |
| `AFFILIATE_PASSWORD` | **YES (`Encrypted`)** | `Production` (`59d ago`) | `Production`, `Preview` | **PASS (`Production`)** |
| `VITE_GOOGLE_SHEETS_WEBHOOK` | **YES (`Encrypted`)** | `Production` (`18d`), `Preview, Development` (`184d`) | `Production`, `Preview`, `Development` | **PASS** |
| `ZAPIER_WEBHOOK_URL` | **YES (`Encrypted`)** | `Preview, Production` (`60d ago`) | `Production`, `Preview` | **PASS** |
| `HUBSPOT_ACCESS_TOKEN` | **YES (`Encrypted`)** | `Preview, Production` (`60d ago`) | `Production`, `Preview` | **PASS** |
| `VITE_EMAILJS_*` (5 vars), `VITE_ZOHO_*` (2 vars), `VITE_OWNER_*` (2 vars) | **YES (`Encrypted`)** | `Production, Preview, Development` (`184d ago`) | `Production`, `Preview`, `Development` | **PASS** |

---

## 4. Step 4 — Sequence State Inspection & Strict Preservation (`api/_data/sequenceStateStore.json`)

### 4.1 Read-Only Structural Comparison (`HEAD` vs. Working Tree)
A content-safe structural inspection was executed comparing `git show HEAD:api/_data/sequenceStateStore.json` against the working-tree file `api/_data/sequenceStateStore.json` without printing buyer personal data or modifying the file:

| Metric | `HEAD` (`2f2d73c3` / Live `30c0790d`) | Working Tree (`git diff`: `1130 +-`) | Provenance & Risk Analysis |
| :--- | :---: | :---: | :--- |
| **Git Tracking Status** | **Tracked** | **Tracked (Modified, Unstaged)** | File is tracked in Git and bundled into serverless functions via `getBundledBaselineStore()` (`api/_lib/sequencePersistence.js:206-212`). |
| **Serialized Size** | `3,240 bytes` | `32,626 bytes` | `+29,386 bytes` of test/challenge state added in working tree. |
| **`lastUpdated` Timestamp** | `2026-10-08T17:03:37.000Z` | `2026-10-14T09:31:19.793Z` | Matches the exact timestamp of the Package 3E.2 local regression test run (`2026-10-14T09:31Z`). |
| **Top-Level Keys** | `version`, `lastUpdated`, `sequences`, `idempotencyKeys`, `reservations`, `processedEvents`, `auditLog` | Adds `dailyThroughput`, `pacingLog`, `dispatchIntents` | Working-tree file contains runtime governor and dispatch-intent tables from local test runs. |
| **Sequence Record Count (`sequences`)** | **`3` records** (`PHASE_3O_CONTROLLED_PILOT_2026:test-01`, `test-02`, `test-03`) | **`31` records** (`3` Phase 3O records + `28` synthetic test records) | Working tree added `28` synthetic test records across `CAMP-01` (`20`), `CAMP-CHALLENGE` (`2`), `CAMP-AMBIGUOUS` (`2`), `CAMP-NOT-SENT` (`2`), `CAMP-LATE-REC` (`1`), and `CAMP-RACE` (`1`), and mutated `PHASE_3O_CONTROLLED_PILOT_2026:test-01` (`approvedForOutreach: false`). |
| **`approvedForOutreach === true` Count** | `0` | **`11` synthetic records** | Working-tree file has `11` synthetic test records (`*@target.com`, `*@challenge.com`) marked `approvedForOutreach: true`. |
| **`dispatchIntents` / `reservations` / `dailyThroughput`** | `0` / `0` / `[]` | `9` intents / `1` reservation / `["2026-10-13", "2026-10-14"]` | Leftover test artifacts from local mock-KV runs. |

### 4.2 Root Cause of Working-Tree Mutation & Preservation Mandate
1. **Why `api/_data/sequenceStateStore.json` Was Mutated Locally:**
   - Four sequence test suites (`test_distributed_persistence_matrix.cjs:24`, `test_package_3c_concurrency_matrix.cjs:38`, `test_phase_4_sequence_regression.cjs:31`, `test_webhook_raw_body_resilience.cjs:25`) properly set `process.env.SEQUENCE_STORE_PATH` to an isolated temporary file before importing `sequencePersistence.js`.
   - However, three untracked test/challenge scripts — [scripts/test_package_3d_regression.cjs](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/scripts/test_package_3d_regression.cjs), [scripts/audit_package_3d_independent_challenge.cjs](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/scripts/audit_package_3d_independent_challenge.cjs), and [scripts/audit_package_3c_independent_challenge.cjs](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/scripts/audit_package_3c_independent_challenge.cjs) — set `KV_REST_API_URL` to a local mock server **without** setting `SEQUENCE_STORE_PATH`. Because `saveRecipientSequenceStateDistributed`, `saveDispatchIntentDistributed`, and `reserveDailyThroughputSlotDistributed` dual-write to both KV and the local store (`api/_data/sequenceStateStore.json`), running those three scripts polluted `api/_data/sequenceStateStore.json` with `28` synthetic test records.
2. **Strict Preservation & Exclusion Rule:**
   - In accordance with Package 3E.7 rules, `api/_data/sequenceStateStore.json` has been **strictly preserved untouched** (not reset, truncated, or modified).
   - Because `getBundledBaselineStore()` (`api/_lib/sequencePersistence.js:206-212`) loads `api/_data/sequenceStateStore.json` as the initial baseline in serverless functions, **staging or committing the working-tree diff of `api/_data/sequenceStateStore.json` is unsafe** and would ship `28` synthetic test records (`11` marked `approvedForOutreach: true`) into the production bundle.
   - Therefore, `api/_data/sequenceStateStore.json` is placed on the **Release Exclusion List** requiring explicit human review before any state change.

---

## 5. Step 5 — Complete Working-Tree Classification (`A`–`F`), Proposed Release Allowlist & Exclusion List

### 5.1 Complete Classification of All `15` Tracked Modified Files & `25` Untracked Files
Categories:
- **A.** Required application remediation
- **B.** Required tests
- **C.** Required audit documentation
- **D.** Existing unrelated change
- **E.** Generated/runtime state
- **F.** Unknown provenance / human review required

| # | Exact Repository File Path | Git Status | Category | Evidence-Based Rationale | Allowlist Decision |
| :-: | :--- | :---: | :---: | :--- | :---: |
| 1 | [src/data/quotationCore.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/src/data/quotationCore.js) | Untracked (`??`) | **A** | Pure shared quotation calculation (`calculateQuotation`) and `DEFAULT_COMMERCIAL_TERMS` module (`180` lines) created in Package 3E.4 (`AAF-3E3-01` fix). Imported by both `src/data/quotationModel.js` and `api/_lib/quotationEngine.js`. | **ALLOWLIST** |
| 2 | [src/data/quotationModel.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/src/data/quotationModel.js) | Modified (`M`) | **A** | Package 3E.2 & 3E.4 remediation: removes server-only email/webhook functions from browser bundle and imports pure calculation core from `./quotationCore.js`. Reduces client chunk by `-94.86%` (`1.73 MB` $\rightarrow$ `88.9 kB`). | **ALLOWLIST** |
| 3 | [api/_lib/quotationEngine.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/_lib/quotationEngine.js) | Modified (`M`) | **A** | Package 3E.4 & Phase 5 remediation: imports/re-exports `calculateQuotation` and `DEFAULT_COMMERCIAL_TERMS` from `../../src/data/quotationCore.js`, and enforces `cleanPdfText` WinAnsi sanitization + `UNSUPPORTED_SCRIPT_ERROR`. | **ALLOWLIST** |
| 4 | [api/_lib/quotationModel.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/_lib/quotationModel.js) | Modified (`M`) | **A** | Package 3E.2 & Phase 5 remediation: authoritative server-only `sendQuotationEmail`, `sendQuotationToBuyer`, and `processDeliveryWebhook` with fail-closed `GLOBAL_OUTREACH_STOP`, `OUTREACH_AUTHORIZED`, and `REAL_BUYER_EMAILS` gates. | **ALLOWLIST** |
| 5 | [src/pages/AdminQuotations.jsx](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/src/pages/AdminQuotations.jsx) | Modified (`M`) | **A** | Package 3E.2 & Phase 5 remediation: removes unused server dispatch imports (`lines 36–38`) and surfaces HTTP `422` `UNSUPPORTED_SCRIPT_ERROR` alerts (`lines 1266–1275`). | **ALLOWLIST** |
| 6 | [api/quotation.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/quotation.js) | Modified (`M`) | **A** | Phase 5 remediation: returns structured HTTP `422` JSON response on `UNSUPPORTED_SCRIPT_ERROR` during PDF generation (`lines 74–80`). | **ALLOWLIST** |
| 7 | [api/email-reply-webhook.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/email-reply-webhook.js) | Modified (`M`) | **A** | Packages 3A–3C remediation: raw-body stream reader (`bodyParser: false`) for Svix HMAC-SHA256 verification and distributed event lease deduplication (`claimEventDistributed` / `completeEventDistributed`). | **ALLOWLIST** |
| 8 | [api/cron-sequence-dispatch.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/cron-sequence-dispatch.js) | Untracked (`??`) | **A** | Packages 3A–3D remediation (`DEFECT-3C-02/03`): hardened targeted sequence dispatch endpoint enforcing timing-safe `CRON_SECRET`, `GLOBAL_OUTREACH_STOP`, `OUTREACH_AUTHORIZED`, persisted enrollment, and `approvedForOutreach === true`. | **ALLOWLIST** |
| 9 | [api/_lib/sequencePersistence.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/_lib/sequencePersistence.js) | Modified (`M`) | **A** | Packages 3A–3D remediation (`DEFECT-3C-01`): distributed KV persistence, escaped compound keys, secondary email/msgid indexes, lease-expiry reconciliation commit (`commitReconciledSequenceStepDistributed`), and webhook event leases. | **ALLOWLIST** |
| 10 | [api/_lib/sequenceStateMachine.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/_lib/sequenceStateMachine.js) | Modified (`M`) | **A** | Packages 3A–3D remediation (`DEFECT-3C-01/02/03`): `dispatchSequenceStepDistributed`, durable dispatch intents, `UNCERTAIN_DISPATCH` freeze, and `reconcileUncertainDispatchIntentDistributed`. | **ALLOWLIST** |
| 11 | [api/_lib/dailyThroughputGovernor.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/_lib/dailyThroughputGovernor.js) | Modified (`M`) | **A** | Packages 3A–3C remediation: distributed daily quota (`INCR`/`DECR`) and ownership-aware anti-burst pacing lock (`quota:pacing:active`). | **ALLOWLIST** |
| 12 | [api/_lib/replyDetector.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/_lib/replyDetector.js) | Modified (`M`) | **A** | Packages 3A–3C remediation: asynchronous distributed reply matching (`matchInboundReplyAsync`, `processInboundReplyAsync`) and fail-closed ambiguous-match handling. | **ALLOWLIST** |
| 13 | [scripts/execute_phase_3o_controlled_send.cjs](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/scripts/execute_phase_3o_controlled_send.cjs) | Modified (`M`) | **A** | Package 3D & 3D Final Gate remediation (`DEFECT-3C-03`): routes controlled send through `dispatchSequenceStepDistributed` and fixes callback-scoped telemetry variables (`lines 251–254, 319–341`). | **ALLOWLIST** |
| 14 | [scripts/audit_secrets.cjs](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/scripts/audit_secrets.cjs) | Modified (`M`) | **B** | Phase 3/5 secret scanner with classified benign test-token allowlist (`CLASSIFIED_BENIGN_FINDINGS`). | **ALLOWLIST** |
| 15 | [scripts/test_p4_4_processor_confirmation.cjs](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/scripts/test_p4_4_processor_confirmation.cjs) | Modified (`M`) | **B** | Package 3E.2 test update: imports server dispatch functions from `../api/_lib/quotationModel.js`; in-memory only (`70/70 PASS`). | **ALLOWLIST** |
| 16 | [scripts/test_p4_5_email_dispatch.cjs](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/scripts/test_p4_5_email_dispatch.cjs) | Modified (`M`) | **B** | Package 3E.2 test update: imports server dispatch functions from `../api/_lib/quotationModel.js`; in-memory only (`46/46 PASS`). | **ALLOWLIST** |
| 17 | [scripts/test_phase_5_quotation_regression.cjs](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/scripts/test_phase_5_quotation_regression.cjs) | Untracked (`??`) | **B** | Phase 5 & Package 3E.4 in-memory quotation, PDF Unicode, and outreach safety-gate regression suite (`58/58 PASS`, zero disk writes). | **ALLOWLIST** |
| 18 | [scripts/test_phase_4_sequence_regression.cjs](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/scripts/test_phase_4_sequence_regression.cjs) | Untracked (`??`) | **B** | Phase 4 sequence lifecycle regression suite (`23/23 PASS`; isolates `SEQUENCE_STORE_PATH` at line `31` and cleans up temp files). | **ALLOWLIST** |
| 19 | [scripts/test_distributed_persistence_matrix.cjs](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/scripts/test_distributed_persistence_matrix.cjs) | Untracked (`??`) | **B** | Distributed KV persistence & fencing token suite (`28/28 PASS`; isolates `SEQUENCE_STORE_PATH` at line `24`). | **ALLOWLIST** |
| 20 | [scripts/test_package_3c_concurrency_matrix.cjs](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/scripts/test_package_3c_concurrency_matrix.cjs) | Untracked (`??`) | **B** | Package 3C concurrency & anti-burst pacing suite (`16/16 PASS`; isolates `SEQUENCE_STORE_PATH` at line `38`). | **ALLOWLIST** |
| 21 | [scripts/test_webhook_raw_body_resilience.cjs](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/scripts/test_webhook_raw_body_resilience.cjs) | Untracked (`??`) | **B** | Svix raw-body HMAC & replay-protection suite (`9/9 PASS`; isolates `SEQUENCE_STORE_PATH` at line `25`). | **ALLOWLIST** |
| 22 | [scripts/test_package_3d_regression.cjs](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/scripts/test_package_3d_regression.cjs) | Untracked (`??`) | **F** *(Test lacking store isolation)* | Package 3D regression suite (`18/18 PASS`), **but omits `process.env.SEQUENCE_STORE_PATH`**, causing dual-writes into tracked `api/_data/sequenceStateStore.json` when executed. Hold for human review / store-path isolation before committing. | **EXCLUDE (Human Review)** |
| 23 | [scripts/audit_package_3d_independent_challenge.cjs](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/scripts/audit_package_3d_independent_challenge.cjs) | Untracked (`??`) | **F** *(Audit script lacking store isolation)* | Package 3D adversarial challenge script (`24/24 PASS`), **but omits `process.env.SEQUENCE_STORE_PATH`**, mutating `api/_data/sequenceStateStore.json` when executed. | **EXCLUDE (Human Review)** |
| 24 | [scripts/audit_package_3c_independent_challenge.cjs](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/scripts/audit_package_3c_independent_challenge.cjs) | Untracked (`??`) | **F** *(Audit script lacking store isolation)* | Package 3C challenge script, **but omits `process.env.SEQUENCE_STORE_PATH`**, mutating `api/_data/sequenceStateStore.json` when executed. | **EXCLUDE (Human Review)** |
| 25 | [api/_data/sequenceStateStore.json](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/_data/sequenceStateStore.json) | Modified (`M`) | **E / F** | Tracked baseline store polluted with `28` synthetic test/challenge records (`11` marked `approvedForOutreach: true`) from local test runs. Must **not** be staged or deployed in its modified state. | **EXCLUDE (MUST NOT STAGE)** |
| 26 | [PHASE_3P_INDEPENDENT_VERIFICATION_REPORT.md](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/PHASE_3P_INDEPENDENT_VERIFICATION_REPORT.md) | Untracked (`??`) | **D** | Earlier Phase 3P verification report placed in repository root (`2026-10-10`, prior to `MASTER_PHASE_REPORTS.md` consolidation in `2f2d73c3`). | **EXCLUDE** |
| 27 | `docs/audits/production/AAF-PRODUCTION-20261010-2300-PHASE2-PHASE3.md` | Untracked (`??`) | **C** | Phase 2 & 3 webhook/persistence audit report. | **ALLOWLIST (Docs)** |
| 28 | `docs/audits/production/AAF-PRODUCTION-20261010-2330-PHASE4.md` | Untracked (`??`) | **C** | Phase 4 sequence state machine audit report. | **ALLOWLIST (Docs)** |
| 29 | `docs/audits/production/AAF-PRODUCTION-20261011-PHASE5.md` | Untracked (`??`) | **C** | Phase 5 quotation engine & safety gate audit report. | **ALLOWLIST (Docs)** |
| 30 | `docs/audits/production/REMEDIATION_PACKAGE_3B_INDEPENDENT_VERIFICATION_REPORT.md` | Untracked (`??`) | **C** | Package 3B independent verification report. | **ALLOWLIST (Docs)** |
| 31 | `docs/audits/production/REMEDIATION_PACKAGE_3C_IMPLEMENTATION_REPORT.md` | Untracked (`??`) | **C** | Package 3C implementation report. | **ALLOWLIST (Docs)** |
| 32 | `docs/audits/production/REMEDIATION_PACKAGE_3C_INDEPENDENT_VERIFICATION_REPORT.md` | Untracked (`??`) | **C** | Package 3C independent verification report. | **ALLOWLIST (Docs)** |
| 33 | `docs/audits/production/REMEDIATION_PACKAGE_3D_IMPLEMENTATION_REPORT.md` | Untracked (`??`) | **C** | Package 3D implementation report. | **ALLOWLIST (Docs)** |
| 34 | `docs/audits/production/PACKAGE_3D_INDEPENDENT_VERIFICATION_REPORT.md` | Untracked (`??`) | **C** | Package 3D independent verification report. | **ALLOWLIST (Docs)** |
| 35 | `docs/audits/production/PACKAGE_3D_FINAL_REMEDIATION_REPORT.md` | Untracked (`??`) | **C** | Package 3D final remediation gate report. | **ALLOWLIST (Docs)** |
| 36 | `docs/audits/production/PACKAGE_3E_2_REMEDIATION_REPORT.md` | Untracked (`??`) | **C** | Package 3E.2 client/server boundary remediation report. | **ALLOWLIST (Docs)** |
| 37 | `docs/audits/production/PACKAGE_3E_4_REMEDIATION_REPORT.md` | Untracked (`??`) | **C** | Package 3E.4 pure quotation core extraction report. | **ALLOWLIST (Docs)** |
| 38 | `docs/audits/production/PACKAGE_3E_5_INDEPENDENT_ACCEPTANCE_AUDIT.md` | Untracked (`??`) | **C** | Package 3E.5 independent acceptance audit report. | **ALLOWLIST (Docs)** |
| 39 | `docs/audits/production/PACKAGE_3E_6_RELEASE_READINESS_AUDIT.md` | Untracked (`??`) | **C** | Package 3E.6 release readiness and deployment evidence audit report. | **ALLOWLIST (Docs)** |
| 40 | `docs/audits/production/PACKAGE_3E_7_ENVIRONMENT_CONTRACT_AND_RELEASE_ALLOWLIST_AUDIT.md` | Untracked (`??`) | **C** | This Package 3E.7 environment contract and release allowlist audit report. | **ALLOWLIST (Docs)** |

---

### 5.2 Proposed Exact-Path Release Allowlist (`35` Paths — Never Use Broad `git add .` or `git add -A`)

#### Group 1 — Required Application Remediations (Category A: `13` Exact Paths)
```text
src/data/quotationCore.js
src/data/quotationModel.js
src/pages/AdminQuotations.jsx
api/_lib/quotationEngine.js
api/_lib/quotationModel.js
api/quotation.js
api/email-reply-webhook.js
api/cron-sequence-dispatch.js
api/_lib/sequencePersistence.js
api/_lib/sequenceStateMachine.js
api/_lib/dailyThroughputGovernor.js
api/_lib/replyDetector.js
scripts/execute_phase_3o_controlled_send.cjs
```

#### Group 2 — Verified Non-Mutating / Store-Isolated Regression Tests (Category B: `8` Exact Paths)
```text
scripts/audit_secrets.cjs
scripts/test_p4_4_processor_confirmation.cjs
scripts/test_p4_5_email_dispatch.cjs
scripts/test_phase_5_quotation_regression.cjs
scripts/test_phase_4_sequence_regression.cjs
scripts/test_distributed_persistence_matrix.cjs
scripts/test_package_3c_concurrency_matrix.cjs
scripts/test_webhook_raw_body_resilience.cjs
```

#### Group 3 — Production Audit Documentation (Category C: `14` Exact Paths)
```text
docs/audits/production/AAF-PRODUCTION-20261010-2300-PHASE2-PHASE3.md
docs/audits/production/AAF-PRODUCTION-20261010-2330-PHASE4.md
docs/audits/production/AAF-PRODUCTION-20261011-PHASE5.md
docs/audits/production/REMEDIATION_PACKAGE_3B_INDEPENDENT_VERIFICATION_REPORT.md
docs/audits/production/REMEDIATION_PACKAGE_3C_IMPLEMENTATION_REPORT.md
docs/audits/production/REMEDIATION_PACKAGE_3C_INDEPENDENT_VERIFICATION_REPORT.md
docs/audits/production/REMEDIATION_PACKAGE_3D_IMPLEMENTATION_REPORT.md
docs/audits/production/PACKAGE_3D_INDEPENDENT_VERIFICATION_REPORT.md
docs/audits/production/PACKAGE_3D_FINAL_REMEDIATION_REPORT.md
docs/audits/production/PACKAGE_3E_2_REMEDIATION_REPORT.md
docs/audits/production/PACKAGE_3E_4_REMEDIATION_REPORT.md
docs/audits/production/PACKAGE_3E_5_INDEPENDENT_ACCEPTANCE_AUDIT.md
docs/audits/production/PACKAGE_3E_6_RELEASE_READINESS_AUDIT.md
docs/audits/production/PACKAGE_3E_7_ENVIRONMENT_CONTRACT_AND_RELEASE_ALLOWLIST_AUDIT.md
```

---

### 5.3 Proposed Exact-Path Exclusion List (`5` Paths — Must NOT Be Staged Without Human Review/Remediation)

| Excluded Exact Path | Category | Exclusion Rationale |
| :--- | :---: | :--- |
| `api/_data/sequenceStateStore.json` | **E / F** | Contains `28` synthetic test/challenge sequence records (`11` marked `approvedForOutreach: true`), `9` dispatch intents, and `2` daily throughput dates written during earlier local test runs. Because `getBundledBaselineStore()` loads this file on serverless cold starts, staging it would ship synthetic test state into production. |
| `scripts/test_package_3d_regression.cjs` | **F** | Does not set `process.env.SEQUENCE_STORE_PATH` before running against its mock KV server, causing `sequencePersistence.js` dual-writes to mutate `api/_data/sequenceStateStore.json`. Should only be allowlisted after adding isolated `SEQUENCE_STORE_PATH` configuration. |
| `scripts/audit_package_3d_independent_challenge.cjs` | **F** | Same as above: omits `process.env.SEQUENCE_STORE_PATH` and mutates `api/_data/sequenceStateStore.json` when executed. |
| `scripts/audit_package_3c_independent_challenge.cjs` | **F** | Same as above: omits `process.env.SEQUENCE_STORE_PATH` and mutates `api/_data/sequenceStateStore.json` when executed. |
| `PHASE_3P_INDEPENDENT_VERIFICATION_REPORT.md` | **D** | Root-level report from Phase 3P (`2026-10-10`) predating the `MASTER_PHASE_REPORTS.md` archive commit (`2f2d73c3`); should not be committed to the repository root. |

---

## 6. Step 6 — Protected Dataset SHA-256 Hashes

Verified via `Get-FileHash -Algorithm SHA256`:

| Protected Dataset File | Expected SHA-256 | Actual Recomputed SHA-256 | Status |
| :--- | :--- | :--- | :---: |
| [api/_data/importersData.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/_data/importersData.js) | `02AFC4E0F621B4326A1CBD67BFC31266A14DFA77F1B0F9767315BB971860F595` | `02AFC4E0F621B4326A1CBD67BFC31266A14DFA77F1B0F9767315BB971860F595` | **PASS (EXACT MATCH)** |
| [api/_data/importersData.snapshot-642.json](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/_data/importersData.snapshot-642.json) | `86100BDA94BE63A51EDDC6EE2B2458133F607D50CD5F7D66C25193F3C9137F9E` | `86100BDA94BE63A51EDDC6EE2B2458133F607D50CD5F7D66C25193F3C9137F9E` | **PASS (EXACT MATCH)** |
| [api/_data/manufacturersData.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/_data/manufacturersData.js) | `6F760D437E3C3C213E0571167B33B66B1DF87503E13DE12514BE552F4AED691C` | `6F760D437E3C3C213E0571167B33B66B1DF87503E13DE12514BE552F4AED691C` | **PASS (EXACT MATCH)** |

---

## 7. Unresolved Questions, Final Release Decision & Next Authorized Action

### 7.1 Unresolved Operational Items Requiring Human Authorization
1. **Remote Vercel Distributed KV Provisioning:** Will the operator provision Vercel KV (`KV_REST_API_URL` + `KV_REST_API_TOKEN`) or direct Upstash Redis (`UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`) alongside `REQUIRE_DISTRIBUTED_KV=1` in Vercel `Production` and `Preview`?
2. **Remote `CRON_SECRET` & Explicit Outreach Lock Variables:** Will the operator add `CRON_SECRET` (`Encrypted`), `GLOBAL_OUTREACH_STOP=1`, `OUTREACH_AUTHORIZED=0`, `REAL_BUYER_EMAILS=0`, and `REAL_BUYER_CONTACT=0` to Vercel `Production` and `Preview` before deployment?
3. **Handling of `api/_data/sequenceStateStore.json` and the 3 Unisolated Test Scripts:** Does the operator authorize restoring `api/_data/sequenceStateStore.json` to its `HEAD` (`2f2d73c3`) state (which holds only the 3 `PHASE_3O_CONTROLLED_PILOT_2026` records) and adding `SEQUENCE_STORE_PATH` isolation to `test_package_3d_regression.cjs`, `audit_package_3d_independent_challenge.cjs`, and `audit_package_3c_independent_challenge.cjs` in a dedicated pre-commit hygiene step?

### 7.2 Final Release Decision: **HOLD**

### 7.3 Next Authorized Action
1. **Operator Environment Setup (Outside Repo):** Configure `KV_REST_API_URL` + `KV_REST_API_TOKEN` (or `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`), `REQUIRE_DISTRIBUTED_KV=1`, `CRON_SECRET`, `GLOBAL_OUTREACH_STOP=1`, `OUTREACH_AUTHORIZED=0`, `REAL_BUYER_EMAILS=0`, and `REAL_BUYER_CONTACT=0` in Vercel Project Settings (`Production` & `Preview`), then verify presence via read-only `vercel env ls --no-color`.
2. **Authorized Pre-Release Hygiene & Staging Package:** Once remote variables are verified present, authorize a narrowly scoped package to (a) isolate `SEQUENCE_STORE_PATH` in the 3 Package 3C/3D test scripts, (b) human-verify and restore `api/_data/sequenceStateStore.json` to its clean `HEAD` baseline, and (c) stage only the exact paths on the approved Release Allowlist.
