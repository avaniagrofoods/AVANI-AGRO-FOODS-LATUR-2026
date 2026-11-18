# PRODUCTION PREFLIGHT AND BACKUP REPORT
## BASELINE INSPECTION & PRE-CORRECTION SYSTEM ARCHITECTURE AUDIT

**Programme:** AVANI AGRO FOODS TECHNICAL STABILISATION (VERSION 5.5)  
**Project:** Project A — Website Engine (`AVANI-AGRO-FOODS-LATUR-2026`)  
**Canonical Directory:** `AVANI_IMPLEMENTATION_PROGRAMME/17_VERSION_5_5_FINAL_CORRECTIVE_IMPLEMENTATION/`  
**Execution Date:** 18 November 2026  
**Auditor:** Senior Full-Stack & Systems Reliability Engineer  
**Baseline Status:** **PREFLIGHT COMPLETE — SYSTEM SAFELY BACKED UP**

---

## 1. PROJECT A PRODUCTION ENVIRONMENT STATE

| Parameter | Authoritative Observed Value | Verification Mechanism | Status |
| :--- | :--- | :--- | :---: |
| **Local Working Branch** | `main` | `git status` | **CLEAN** |
| **Local HEAD SHA** | `c1375b130789fdf06ce34c1e6308ac871a348b8e` | `git rev-parse HEAD` | **VERIFIED** |
| **Remote origin/main SHA** | `c1375b130789fdf06ce34c1e6308ac871a348b8e` | `git rev-parse origin/main` | **IN SYNC** |
| **Active Vercel Deployment ID** | `dpl_BGgyCWj2tYFkL3ncLZaF3gMGvu3V` | `vercel inspect` | **READY** |
| **Active Deployment Target** | `production` | Vercel Platform Metadata | **VERIFIED** |
| **Deployed Git Commit SHA** | `a786fd8187338fd6da634f64cc1432fb68beee06` | Vercel Deployment Inspector | **CODE PARITY** |
| **Live Production Aliases** | `https://www.avaniagrofoods.com`<br/>`https://avaniagrofoods.com`<br/>`https://avani-agro-foods-latur-2026.vercel.app` | Vercel Edge Routing | **LIVE & ROUTING** |
| **Supabase Project Reference** | `zqemrmzijlaysvfxygst` | Production Secret Vault | **CONFIRMED** |
| **Supabase Base URL** | `https://zqemrmzijlaysvfxygst.supabase.co` | Production Secret Vault | **CONFIRMED** |
| **PostgREST Connection State** | Connected via TLS 1.3 (`bom1` / Mumbai) | Live Diagnostic Probe | **ACTIVE (200 OK)** |

---

## 2. PRODUCTION ENVIRONMENT VARIABLE AUDIT (SECRET-PRESERVED)

The production Vercel project contains the following active environment variables (values strictly redacted for security):

```text
[Vercel Production Secret Vault]
- KV_REST_API_TOKEN          (Upstash Redis Token)
- KV_REST_API_URL            (Upstash Redis Endpoint)
- REDIS_URL                  (Redis Connection String)
- SUPABASE_URL               (https://zqemrmzijlaysvfxygst.supabase.co)
- SUPABASE_SERVICE_ROLE_KEY  (Service Role Secret)
- RESEND_API_KEY             (Resend Email API Secret)
- RESEND_FROM_EMAIL          (Sender Identity)
- RESEND_WEBHOOK_SECRET      (Webhook Signature Verification)
- CRM_WEBHOOK_SECRET         (Internal QA & Webhook Secret)
- SESSION_SECRET             (HMAC Session Secret)
- MASTER_GATE_PASSWORD       (Administrative Gate Credential)
- PRIVATE_PORTAL_PASSWORD    (Client Portal Credential)
- ZAPIER_WEBHOOK_URL         (Secondary Webhook URL)
- HUBSPOT_ACCESS_TOKEN       (HubSpot Integration Secret)
- VITE_GOOGLE_SHEETS_WEBHOOK (CRM Fallback Webhook)
```
*Zero credentials or secrets were exposed or leaked into logs, documentation, or client-side bundles.*

---

## 3. IDEMPOTENCY SUBSYSTEM BASELINE INSPECTION

Introspection of the production API (`https://www.avaniagrofoods.com/api/save-lead?action=db-diagnostic`) revealed:

1. **Table Check:** `inquiry_idempotency_ledger` exists in `public` schema and is accepting queries (`HTTP 200 OK`).
2. **RPC Function Registration:**
   - `/rpc/reserve_idempotency_lock`: Registered in PostgREST schema cache.
   - `/rpc/complete_idempotency_record`: Registered in PostgREST schema cache.
   - `/rpc/fail_idempotency_record`: Registered in PostgREST schema cache.
3. **RPC Conflict Defect Status:**
   - Direct execution on existing key returns `code 42702`: `column reference "inquiry_id" is ambiguous`.
   - Confirms that the target database in `zqemrmzijlaysvfxygst` currently runs the original function definition which lacks `#variable_conflict use_column` and table alias `l.`.
   - Pending resolution: `migrations/20261118_fix_reserve_idempotency_lock_ambiguity.sql`.
4. **Client-Side Safeguards:**
   - Unsafe direct PostgREST table fallback was removed in `api/_lib/supabaseClient.js`.
   - Fail-closed security is active: any RPC failure immediately returns `HTTP 503 (IDEMPOTENCY_UNAVAILABLE)`.

---

## 4. PRE-CHANGE BACKUPS

All critical application source and migration files were archived prior to executing modifications:

- `backups/supabaseClient.js.bak` — Client database integration logic.
- `backups/save-lead.js.bak` — Serverless API inquiry entrypoint.
- `backups/auth.js.bak` — Rate limiting and client IP extraction.
- `backups/20261117_inquiry_idempotency_ledger.sql.bak` — Full baseline migration.
- `backups/20261118_fix_reserve_idempotency_lock_ambiguity.sql.bak` — Targeted stored procedure hotfix.

All backups are securely preserved under [AVANI_IMPLEMENTATION_PROGRAMME/17_VERSION_5_5_FINAL_CORRECTIVE_IMPLEMENTATION/backups/](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/AVANI_IMPLEMENTATION_PROGRAMME/17_VERSION_5_5_FINAL_CORRECTIVE_IMPLEMENTATION/backups/).

---
**Report Approved by:** Senior Full-Stack & Systems Reliability Engineer  
**Sign-off Status:** **PHASE 1 COMPLETE — BASELINE RECORDED**
