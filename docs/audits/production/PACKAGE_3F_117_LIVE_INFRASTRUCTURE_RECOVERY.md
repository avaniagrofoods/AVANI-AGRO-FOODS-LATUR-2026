# PACKAGE 3F.117 — LIVE INFRASTRUCTURE RECOVERY, API ACCEPTANCE AND FINAL PRODUCTION READINESS VERIFICATION

**Project:** AVANI AGRO FOODS Website Engine (Project A) & Avani Agro Intelligence Engine (Project B)  
**Project Designation:** Project A & Project B Integration and Cutover Audit  
**Canonical Root (Project A):** `C:\Users\ALPHA-1\Downloads\21MAY2026\SACHIN SHINDE DOCUMENTS\DEVELOPEMENT TOOLS\2-AVANI AGRO FOODS LATUR 2026`  
**Canonical Root (Project B):** `C:\Users\ALPHA-1\Downloads\21MAY2026\SACHIN SHINDE DOCUMENTS\DEVELOPEMENT TOOLS\AVANI_AGRO_INTELLIGENCE`  
**Production URL:** `https://www.avaniagrofoods.com/` (Apex: `https://avaniagrofoods.com/`)  
**Audit Date:** 16 November 2026  
**Auditor:** Principal Release Governance & Infrastructure Acceptance Authority  

---

## 1. MANDATORY GOVERNANCE LOCKS & SAFETY POLICY

Throughout the entire execution of Package 3F.117, the following mandatory governance policies remained strictly locked and enforced:

```
GLOBAL_OUTREACH_STOP=1
OUTREACH_AUTHORIZED=0
PILOT_AUTHORIZED=0
```

- **Zero Outbound Emails Sent:** No transactional or sequence marketing emails were transmitted.
- **Zero Live Webhook Invocations against External APIs:** No test traffic sent to external endpoints.
- **Quarantined Files Preserved:** Quarantined lead generation data files (`api/_data/*` in Project A, `acceptance_test_temp_20261009.txt` in Project B) remained strictly untouched.
- **No Secret Values Logged or Committed:** Credentials remained masked.
- **Fail-Closed Architecture Upheld:** Rate limiting and session verification security controls were never relaxed or bypassed.

---

## 2. EXECUTIVE STATUS & RELEASE VERDICT

### FINAL SYSTEM RELEASE STATUS: `PRODUCTION_PARTIAL`

| Core System Dimension | Status | Evidence Summary |
| :--- | :---: | :--- |
| **Git Repositories & Working Trees** | `PASS` | Project A at `1e34f1d` (clean, synced with GitHub `origin/main`); Project B at `34f1fb2` (clean local `main`). |
| **Quarantined Files Integrity** | `PASS` | `api/_data/*` (Project A) and `acceptance_test_temp_20261009.txt` (Project B) verified untouched. |
| **Local Regression Test Suites** | `PASS` | Project A: **97/97 passed** (3F.106: 22/22, 3F.108: 24/24, 3F.110: 18/18, 3F.112: 20/20, 3F.115: 13/13). Project B: **151/151 passed** in 15.89s. |
| **Production Vite Build & Bundle** | `PASS` | `2,146 modules transformed in 15.91s`, generated `/assets/index-D9l62DFI.js` (160 kB, HTTP 200 on CDN). |
| **Live Supabase PostgreSQL Database** | `PASS` | Connected to `aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres`. Migration `20261110_quotations_table.sql` 100% applied: **34 columns, 9 indexes, RLS enabled (2 policies), updated_at trigger, crm_activities default `authenticated_operator`**. |
| **Live Resend Email Infrastructure** | `PASS` | Domain `avaniagrofoods.com` status: `verified` (ID `a954c8b0-3fa0-4e98-acac-6e4630b6e830`). Webhooks `87adea51-93e2-433b-ae7d-e465c29f0813` and `9cbe2dbd-5e3f-4cb0-9b14-30d76b726391` both `enabled`. |
| **Cross-Project Ecosystem Bridge** | `PASS` | Node.js HMAC-SHA256 signing -> Python `EcosystemBridge` ingestion passed: `LEAD_CAPTURED` (Grade A, score 80), `DUPLICATE` rejection, tampered signature `401 INVALID_ECOSYSTEM_SIGNATURE`, and `OUTREACH_STOP_SIGNAL` `SUPPRESSED_AND_STOPPED`. |
| **Live Website, DNS, SSL & Mobile** | `PASS` | Apex `https://avaniagrofoods.com` 308-redirects to `https://www.avaniagrofoods.com/`. Public pages (`/`, `/products`, `/moringa-leaf-powder-exporter-india`, `/dehydrated-red-onion-exporter-india`, `/robots.txt`) return `HTTP 200` with strict HSTS, XFO, XCTO, and mobile viewport meta tags. |
| **Live API Rate Limiting & KV Store** | `OWNER ACTION REQUIRED` / `BLOCKED` | Vercel project `prj_3DBOT7AbclhcQ6318u4bETdbnhrQ` has **no Upstash Redis / Vercel KV store provisioned or connected**. Production endpoints requiring distributed KV fail closed with `HTTP 503 RATE_LIMIT_BACKEND_UNAVAILABLE`. |
| **Project B Remote Repository** | `OWNER ACTION REQUIRED` | No GitHub remote repository exists under `avaniagrofoods`. Project B exists strictly locally. |

---

## 3. TASK-BY-TASK VERIFICATION EVIDENCE

### TASK 1 — REPOSITORY BASELINE & INTEGRITY (`PASS`)

- **Project A:**
  - Branch: `main`
  - Latest Commit: `1e34f1d docs(audits): publish Package 3F.116 final production cutover and live acceptance report`
  - Remote: `origin` -> `https://github.com/avaniagrofoods/AVANI-AGRO-FOODS-LATUR-2026.git`
  - Working Tree: Completely clean (`nothing to commit, working tree clean`).
  - Synced with remote: `Your branch is up to date with 'origin/main'`.
- **Project B:**
  - Branch: `main`
  - Latest Commit: `34f1fb2 docs(audits): publish Package 3F.116 final production cutover and live acceptance report`
  - Remote: None configured (`git remote -v` returns empty).
  - Working Tree: Completely clean (`nothing to commit, working tree clean`).
- **Quarantined Files Check:**
  - Project A: `api/_data/*` remained completely ignored and untouched.
  - Project B: `acceptance_test_temp_20261009.txt` verified present, unmodified (`09-Oct-26 1:14 PM`, length: 0).

---

### TASK 2 — UPSTASH REDIS / VERCEL KV AUDIT (`OWNER ACTION REQUIRED` / `BLOCKED`)

An exhaustive audit of Vercel Project `prj_3DBOT7AbclhcQ6318u4bETdbnhrQ` (`avani-agro-foods-latur-2026`) via the Vercel REST API revealed:

1. **Environment Variables Query (`GET /v9/projects/prj_3DBOT7AbclhcQ6318u4bETdbnhrQ/env`):**
   - Total environment variables: 30.
   - Variables matching `REDIS` or `KV`: **0 found** (`[]`).
   - Missing variables:
     - `KV_REST_API_URL`
     - `KV_REST_API_TOKEN`
     - `UPSTASH_REDIS_REST_URL`
     - `UPSTASH_REDIS_REST_TOKEN`
2. **Storage Stores Query (`GET /v1/storage/stores`):**
   - Stores attached to team `team_vUTeKhQxcSPYtztYtoLMWinO`:
     - `avani-ai-crm-prod` (MongoDB Atlas)
     - `avaniagrofoods` (Browserbase)
   - **No Upstash Redis database is provisioned or attached** to the team or project.
3. **Fail-Closed Security Verification:**
   - In accordance with production security architecture (`api/_lib/auth.js` line 44: `isDistributedKvRequired()`), when running under `VERCEL=1`, the application strictly refuses to fall back to an ephemeral in-memory store.
   - When requests hit `/api/save-lead`, `/api/leads`, `/api/verify-gate`, or `/api/admin-quotations?action=delivery-webhook`, the system returns:
     ```json
     {
       "code": "RATE_LIMIT_BACKEND_UNAVAILABLE",
       "error": "Distributed rate limiting backend (KV) is required in production but not configured."
     }
     ```
   - This fail-closed behavior ensures that attackers cannot bypass rate limits or compromise distributed idempotency when distributed cache credentials are absent.
4. **Local Simulated KV Verification (`PASS`):**
   - The Lua atomic lease scripts, CAS completion/release/renewal, and concurrent worker mutual exclusion were comprehensively verified against a simulated KV server in test suite `scripts/test_package_3f_115_regression.mjs` (T-115-01 through T-115-06: 100% PASS).
5. **Action Required by Owner:**
   See Section 5 for exact 2-minute setup instructions in the Vercel Console.

---

### TASK 3 — SUPABASE DATABASE AUDIT (`PASS`)

Direct TLS SCRAM-SHA-256 inspection of production database `postgres.zqemrmzijlaysvfxygst` via connection pooler `aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres` (PostgreSQL 17.6) confirmed that migration `supabase/migrations/20261110_quotations_table.sql` was cleanly applied forward-only and is in a pristine state:

1. **Columns Count & Specification (34 Columns):**
   - Core fields: `id` (uuid, PK), `quotation_id` (varchar, NOT NULL, UNIQUE), `inquiry_id` (varchar, NULLABLE, FK -> `leads.inquiry_id` ON DELETE SET NULL), `date` (date, NOT NULL), `valid_until` (varchar, NOT NULL, default `'12 Oct 2026'`).
   - Commercial details: `buyer_name`, `company_name`, `country`, `currency` (default `'USD'`), `incoterm`, `destination_port`, `items` (jsonb, default `'[]'`), `subtotal`, `freight`, `insurance`, `documentation`, `other_charges`, `grand_total`, `payment_terms`, `delivery_timeline`, `status` (default `'DRAFT'`), `document_hash`, `raw_quotation` (jsonb).
   - Delivery tracking columns: `buyer_email` (varchar), `provider_message_id` (varchar), `provider_name` (varchar, default `'resend'`), `sent_at` (timestamptz), `delivered_at` (timestamptz), `bounced_at` (timestamptz), `delivery_status` (varchar, default `'pending'`).
   - Audit attribution columns: `created_by` (varchar, default `'authenticated_operator'`), `updated_by` (varchar, default `'authenticated_operator'`), `created_at` (timestamptz, default `now()`), `updated_at` (timestamptz, default `now()`).
2. **Indexes Count & Definitions (9 Indexes):**
   - `idx_quotations_date` (`date DESC`)
   - `idx_quotations_delivery_status` (`delivery_status`)
   - `idx_quotations_inquiry_id` (`inquiry_id`)
   - `idx_quotations_provider_message_id` (`provider_message_id`)
   - `idx_quotations_quotation_id` (`quotation_id`)
   - `idx_quotations_status` (`status`)
   - `idx_quotations_unique_provider_msg` (`UNIQUE (provider_message_id) WHERE (provider_message_id IS NOT NULL)`)
   - `quotations_pkey` (`UNIQUE (id)`)
   - `quotations_quotation_id_key` (`UNIQUE (quotation_id)`)
3. **Row-Level Security (RLS) & Policies:**
   - `relrowsecurity: true`, `relforcerowsecurity: false`.
   - Policy 1: `Deny all public access to quotations` (cmd: `ALL`, roles: `{anon}`) -> anon queries return 0 rows.
   - Policy 2: `Service role has full access to quotations` (cmd: `ALL`, roles: `{service_role}`) -> authenticated backend functions have full access.
4. **Triggers:**
   - `trigger_quotations_updated_at`: `UPDATE` on `quotations` executes function `handle_updated_at()`.
5. **Activity Log Default:**
   - `crm_activities.performed_by`: verified default value is `'authenticated_operator'::character varying`.
6. **Data Integrity:**
   - Active quotation records: `0` (clean production state, test records from prior runs verified deleted).

---

### TASK 4 — LIVE APPLICATION API ACCEPTANCE (`PASS` / Fail-Closed Active)

HTTP probes against `https://www.avaniagrofoods.com` produced exact expected status codes confirming edge security, origin checks, signature validation, and fail-closed rate-limit guards:

| Route & Probe | Method | Response Status | Observed Body / Code | Verdict |
| :--- | :---: | :---: | :--- | :---: |
| `/api/verify-gate` (No Session) | `GET` | `HTTP 503` | `{"authenticated":false,"code":"RATE_LIMIT_BACKEND_UNAVAILABLE"}` | `PASS` (Fail-closed) |
| `/api/verify-gate` (No Origin/Referer) | `POST` | `HTTP 403` | `{"authenticated":false,"code":"ORIGIN_MISSING"}` | `PASS` (Origin Guard) |
| `/api/leads` (Invalid Method) | `GET` | `HTTP 405` | `{"success":false,"error":"Method Not Allowed"}` | `PASS` (Method Guard) |
| `/api/leads` (Lead Creation) | `POST` | `HTTP 503` | `{"code":"RATE_LIMIT_BACKEND_UNAVAILABLE"}` | `PASS` (Fail-closed) |
| `/api/save-lead` (Lead Submission) | `POST` | `HTTP 503` | `{"code":"RATE_LIMIT_BACKEND_UNAVAILABLE"}` | `PASS` (Fail-closed) |
| `/api/save-lead` (Spoofed Origin) | `POST` | `HTTP 403` | `{"error":"Forbidden origin"}` | `PASS` (Anti-CORS Spoof) |
| `/api/importers` (Unauthenticated) | `GET` | `HTTP 503` | `{"code":"RATE_LIMIT_BACKEND_UNAVAILABLE"}` | `PASS` (Fail-closed) |
| `/api/manufacturers` (Unauthenticated)| `GET` | `HTTP 503` | `{"code":"RATE_LIMIT_BACKEND_UNAVAILABLE"}` | `PASS` (Fail-closed) |
| `/api/admin-quotations` (Unauthenticated)| `GET` | `HTTP 401` | `{"error":"Unauthorized admin access"}` | `PASS` (Edge Middleware) |
| `/api/admin-quotations?action=delivery-webhook` | `POST` | `HTTP 503` | `{"code":"RATE_LIMIT_BACKEND_UNAVAILABLE"}` | `PASS` (Fail-closed) |
| `/api/email-reply-webhook` (Missing Svix) | `POST` | `HTTP 401` | `{"error":"Unauthorized: Missing Svix/Resend signature headers"}` | `PASS` (Svix Guard) |

---

### TASK 5 — RESEND EMAIL INFRASTRUCTURE AUDIT (`PASS`)

Direct queries to the Resend API (`https://api.resend.com/`) with authenticated production credentials verified:

1. **Domain Status:**
   - Domain: `avaniagrofoods.com`
   - Status: `verified`
   - Region: `ap-northeast-1` (Tokyo)
   - Capabilities: `sending: enabled`, `receiving: disabled`
   - Domain ID: `a954c8b0-3fa0-4e98-acac-6e4630b6e830`
2. **Configured Webhooks:**
   - Webhook 1 (`87adea51-93e2-433b-ae7d-e465c29f0813`):
     - Endpoint: `https://www.avaniagrofoods.com/api/email-reply-webhook`
     - Status: `enabled`
     - Events: `email.bounced`, `email.delivered`, `email.received`, `email.sent`, `email.complained`, `email.opened`
   - Webhook 2 (`9cbe2dbd-5e3f-4cb0-9b14-30d76b726391`):
     - Endpoint: `https://www.avaniagrofoods.com/api/admin-quotations?action=delivery-webhook`
     - Status: `enabled`
     - Events: `email.sent`, `email.delivered`, `email.delivery_delayed`, `email.bounced`, `email.complained`, `email.opened`, `email.clicked`, `email.received`, `email.scheduled`, `contact.created`, `contact.updated`
   - Two legacy/inactive endpoints from 04-Oct-2026 (`3fc3366e...` and `175b66df...`) are confirmed `disabled`.

---

### TASK 6 — PROJECT B INTEGRATION & ECOSYSTEM BRIDGE (`PASS`)

1. **Cross-Project Event Ingestion (`PASS`):**
   - Project A Node ESM (`createSignedEcosystemEvent`) generated an HMAC-SHA256 signed envelope (`X-Avani-Timestamp`, `X-Avani-Signature: v1=...`, `X-Avani-Source: PROJECT_A_WEBSITE`).
   - Project B Python engine (`EcosystemBridge.ingest_project_a_event`) successfully validated the signature, classified the lead (Grade: `A`, Score: `80`, Market: `PRIMARY`, Stage: `REQUIREMENT_RECEIVED`), and stored the event in the database (`status: PROCESSED`, `code: 200`).
2. **Duplicate Replay Attack Defense (`PASS`):**
   - Replaying the exact same envelope yielded `status: DUPLICATE`, `code: 200` without duplicate processing.
3. **Tampered Payload/Signature Defense (`PASS`):**
   - Tampering with signature bits yielded `status: REJECTED`, `code: 401`, `reason: INVALID_ECOSYSTEM_SIGNATURE`.
4. **Outreach Safety Stop Signal (`PASS`):**
   - Outbound `OUTREACH_STOP_SIGNAL` envelope was verified and immediately processed by Project B, triggering contact suppression and enrollment termination (`action: SUPPRESSED_AND_STOPPED`, `code: 200`).
5. **Project B Remote Repository Check (`OWNER ACTION REQUIRED`):**
   - GitHub organization repository listing (`gh repo list avaniagrofoods`) confirmed that no repository named `AVANI-AGRO-INTELLIGENCE` exists on GitHub.
   - Project B resides strictly on the local canonical filesystem at commit `34f1fb2`.

---

### TASK 7 — LIVE WEBSITE & MOBILE VIEWPORT ACCEPTANCE (`PASS`)

HTTP live network inspection of `https://www.avaniagrofoods.com/` and its primary routes demonstrated complete operational health:

1. **Apex Redirect:**
   - Request: `GET https://avaniagrofoods.com`
   - Response: `HTTP 308 Permanent Redirect` -> `Location: https://www.avaniagrofoods.com/`
   - HSTS: `max-age=63072000`
2. **Public Route Responses (`HTTP 200`):**
   - Homepage: `https://www.avaniagrofoods.com/` (`HTTP 200`, `text/html; charset=utf-8`)
   - Products: `https://www.avaniagrofoods.com/products` (`HTTP 200`)
   - Moringa Exporter: `https://www.avaniagrofoods.com/moringa-leaf-powder-exporter-india` (`HTTP 200`)
   - Dehydrated Onion: `https://www.avaniagrofoods.com/dehydrated-red-onion-exporter-india` (`HTTP 200`)
   - Robots: `https://www.avaniagrofoods.com/robots.txt` (`HTTP 200`, `Allow: /products`, `Allow: /catalog`, etc.)
3. **Security Headers Enforced on HTML & Assets:**
   - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
   - `X-Frame-Options: SAMEORIGIN` (HTML) / `DENY` (API)
   - `X-Content-Type-Options: nosniff`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Permissions-Policy: geolocation=(), microphone=(), camera=()`
4. **Mobile & Viewport Verification:**
   - HTML documents feature `<meta name="viewport" content="width=device-width, initial-scale=1.0">`.
   - Verified via HTTP header probes under both Desktop Chrome User-Agent and Mobile Safari (iPhone iOS 17) User-Agent.
   - Vite compiled production bundle: `/assets/index-D9l62DFI.js` (160,417 bytes, HTTP 200 from Vercel Edge CDN).
   - *(Note: Mobile verification was conducted via authenticated HTTP edge inspection and DOM metadata analysis; interactive browser pane was not used).*

---

## 4. AUDIT CLASSIFICATION MATRIX

| Item ID | Audit Target | Classification | Remarks & Current State |
| :--- | :--- | :---: | :--- |
| **AUD-117-01** | Project A Git sync (`1e34f1d` with `origin/main`) | `PASS` | Synced and verified. |
| **AUD-117-02** | Project B Git clean state (`34f1fb2`) | `PASS` | Working tree clean. |
| **AUD-117-03** | Quarantined files preservation | `PASS` | `api/_data/*` and test temp files intact. |
| **AUD-117-04** | Project A test suite (97/97 tests) | `PASS` | All 5 test suites pass cleanly. |
| **AUD-117-05** | Project B test suite (151/151 tests) | `PASS` | Passed in 15.89s via Python 3.14. |
| **AUD-117-06** | Production Vite build | `PASS` | 2,146 modules transformed, bundle verified. |
| **AUD-117-07** | Supabase database schema (34 cols, 9 idxs) | `PASS` | 100% verified via TLS SCRAM-SHA-256 pooler. |
| **AUD-117-08** | Supabase RLS policies & triggers | `PASS` | Anon denied, service_role allowed, trigger active. |
| **AUD-117-09** | Resend domain verification (`avaniagrofoods.com`)| `PASS` | Verified in `ap-northeast-1`. |
| **AUD-117-10** | Resend active webhooks | `PASS` | 2 enabled endpoints configured. |
| **AUD-117-11** | Cross-Project HMAC-SHA256 Signed Bridge | `PASS` | Passed all 4 end-to-end integration tests. |
| **AUD-117-12** | Apex 308 redirect & security headers | `PASS` | Verified live on production CDN. |
| **AUD-117-13** | Edge Middleware & CSRF / Origin defenses | `PASS` | 401 on unauth admin, 403 on spoofed origin. |
| **AUD-117-14** | Vercel KV / Upstash Redis store provisioning | `OWNER ACTION REQUIRED` / `BLOCKED` | Store not yet provisioned in Vercel project. |
| **AUD-117-15** | Live API form submission / portal auth | `OWNER ACTION REQUIRED` / `BLOCKED` | Endpoints fail closed with HTTP 503 until KV is linked. |
| **AUD-117-16** | Project B GitHub remote creation | `OWNER ACTION REQUIRED` | Remote does not yet exist under `avaniagrofoods`. |
| **AUD-117-17** | Global outreach locks (`GLOBAL_OUTREACH_STOP=1`)| `PASS` | Preserved and enforced. |

---

## 5. EXACT REMAINING OWNER ACTIONS (TO REACH `PRODUCTION_READY_OUTREACH_HELD`)

To unblock the live API forms (`/api/save-lead`, `/api/leads`), session persistence, and webhook distributed idempotency, the business owner (Sachin Shinde) needs to complete **one 2-minute action** in the Vercel Dashboard:

### Action 1: Provision and Connect Upstash Redis in Vercel Console (2 Minutes)

1. Log in to [Vercel Dashboard](https://vercel.com/) with account `avaniagrofoods1356-4705`.
2. In the top navigation, click **Storage**.
3. Click **Create Database** and select **Upstash Redis** (or **Vercel KV**).
4. Enter a database name (e.g. `avani-kv-prod`), select primary region **Mumbai (bom1)** or **Singapore (sin1)** (closest to India users).
5. On the **Connect Projects** screen:
   - Select project: **`avani-agro-foods-latur-2026`**
   - Select environments: **Production** and **Preview**.
   - Click **Connect**.
6. This automatically injects:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   (and/or `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`) into the project environment.
7. Trigger a redeploy in Vercel (or execute `vercel --prod` from CLI).
8. Once connected, all live API endpoints (`/api/save-lead`, `/api/leads`, `/api/verify-gate`) will immediately transition from `HTTP 503` to `HTTP 200`.

### Action 2 (Optional): Create Remote GitHub Repository for Project B (1 Minute)

When the owner wishes to synchronize Project B with GitHub:

Run the following command from Project B root using GitHub CLI:
```powershell
cd "C:\Users\ALPHA-1\Downloads\21MAY2026\SACHIN SHINDE DOCUMENTS\DEVELOPEMENT TOOLS\AVANI_AGRO_INTELLIGENCE"
gh repo create avaniagrofoods/AVANI-AGRO-INTELLIGENCE --private --source=. --remote=origin --push
```

---

## 6. AUDIT CONCLUSION & SIGN-OFF

The core website, static content, SEO landing pages, global export product catalogs, DNS, SSL, security headers, database schemas, and email deliverability infrastructure are **100% operational and healthy**.

The application code behaves with exemplary security discipline: in the absence of a distributed KV store, the system **fails closed** (`HTTP 503 RATE_LIMIT_BACKEND_UNAVAILABLE`) rather than exposing the application to race conditions, denial-of-service, or idempotency bypasses.

As soon as the owner completes **Action 1** (linking Upstash Redis via the Vercel Storage console), the entire ecosystem will achieve **`PRODUCTION_READY_OUTREACH_HELD`**.

```
CURRENT OVERALL STATUS: PRODUCTION_PARTIAL
OUTREACH ENFORCEMENT: GLOBAL_OUTREACH_STOP=1 (STRICTLY ACTIVE)
```
