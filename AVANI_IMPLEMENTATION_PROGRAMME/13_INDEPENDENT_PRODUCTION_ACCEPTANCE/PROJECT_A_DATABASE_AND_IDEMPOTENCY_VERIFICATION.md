# PROJECT A DATABASE AND IDEMPOTENCY VERIFICATION REPORT
## INDEPENDENT VERIFICATION OF DATABASE ARCHITECTURE, PERSISTENCE SEMANTICS, AND IDEMPOTENCY

**Application:** AVANI AGRO FOODS Website Engine (Project A)  
**Project Path:** `C:\Users\ALPHA-1\Downloads\21MAY2026\SACHIN SHINDE DOCUMENTS\DEVELOPEMENT TOOLS\2-AVANI AGRO FOODS LATUR 2026`  
**Auditor:** Principal PostgreSQL & Distributed Systems Security Auditor  
**Audit Date:** 17 November 2026  
**Audit Classification:** **AMBER — CODE HARDENED BUT LIVE DB MIGRATION UNAPPLIED**  

---

## 1. NINE-POINT INDEPENDENT FORENSIC VERIFICATION

| Verification Item | Requirement / Question | Empirical Findings & Concrete Evidence | Audit Verdict |
| :--- | :--- | :--- | :--- |
| **1. Migration File Existence** | Does the SQL migration exist in the project migration directory? | File verified at `migrations/20261117_inquiry_idempotency_ledger.sql` (98 lines, 3,428 bytes). | **VERIFIED (PASS)** |
| **2. Syntax & Dependency Validity** | Are syntax, types, constraints, and dependencies valid PostgreSQL 15 DDL? | Valid DDL: Uses `gen_random_uuid()`, `JSONB`, `TIMESTAMPTZ`, unique constraint on `idempotency_key`, check constraint on `status`, RLS policy for `service_role`, and PL/pgSQL function `reserve_idempotency_lock`. | **VERIFIED (PASS)** |
| **3. Production Application** | Was the migration applied to the intended production Supabase database? | **NO.** Direct PostgREST probe against `https://zqemrmzijlaysvfxygst.supabase.co/rest/v1/inquiry_idempotency_ledger` returned HTTP 401 Unauthorized using local credentials. Table is NOT confirmed present on production. | **UNAPPLIED (BLOCKED)** |
| **4. Migration History** | Does production migration history confirm application? | No migration ledger table (e.g. `supabase_migrations.schema_migrations`) or audit record confirms application of this script. | **UNCONFIRMED** |
| **5. API Invocation of Durable Lock** | Does `api/save-lead.js` actually invoke `reserve_idempotency_lock`? | **NO.** Code inspection of `api/save-lead.js` confirms line 19 defines `const recentSubmissions = new Map()`. Neither `reserve_idempotency_lock` nor `inquiry_idempotency_ledger` is imported or referenced. The API still relies on the in-memory Map. | **DEFECT DETECTED (AMBER)** |
| **6. Concurrency & Expired Locks** | Are concurrent requests, retries, timeouts, and expired locks handled? | **In SQL:** `reserve_idempotency_lock` properly implements `INSERT ... ON CONFLICT DO NOTHING` and checks `expires_at < now()` to reclaim expired locks.<br>**In API:** In-memory map cleans entries after 60,000ms (`cleanOldSubmissions()`), but this is pod-local and does not protect across serverless instances. | **PARTIAL (SQL READY / API UNWIRED)** |
| **7. Insert-Only Persistence** | Is insert-only persistence genuinely enforced? | **YES in code:** In `api/_lib/supabaseClient.js` (lines 168-173), when `{ insertOnly: true }` is passed from `save-lead.js`, header `Prefer: return=representation` is set without `resolution=merge-duplicates`. | **VERIFIED (PASS)** |
| **8. Rejection of Client IDs** | Are client-supplied identifiers rejected or ignored? | **YES in code:** In `api/save-lead.js` (lines 163-167), server-side CSPRNG UUIDv4 is generated unconditionally: `AAF-INQ-${currentYear}-${crypto.randomUUID()}` and `AAF-Q-${currentYear}-${crypto.randomUUID()}`. Public caller `inquiryId` or `quoteId` in `req.body` are ignored. | **VERIFIED (PASS)** |
| **9. Accurate Failure Status Codes** | Do persistence failures return accurate HTTP status codes without false success? | **YES:** In `api/save-lead.js` (lines 376-384), if Supabase persistence fails, it deletes the deduplication key and returns `HTTP 500` with `persistenceStatus: 'FAILED'` and `inquiryId: null`. Verified via automated suite `test_p0_lead_remediation_suite.mjs` (Scenario 5 passed). | **VERIFIED (PASS)** |

---

## 2. ROOT CAUSE ANALYSIS OF GAPS

### Gap A: In-Memory Deduplication vs Distributed Ledger
While `migrations/20261117_inquiry_idempotency_ledger.sql` is fully authored and structurally sound, it has not been wired into `api/save-lead.js`. `api/save-lead.js` continues to use:
```javascript
const recentSubmissions = new Map();
...
const dedupKey = `${email}_${rawProduct}_${rawQuantity}`;
if (recentSubmissions.has(dedupKey)) {
  const existing = recentSubmissions.get(dedupKey);
  return res.status(200).json({
    success: true,
    message: 'Duplicate enquiry detected within 60s. Your enquiry has already been queued.',
    inquiryId: existing.inquiryId,
    quoteId: existing.quoteId
  });
}
```
**Consequence:** In a multi-instance serverless environment (e.g. Vercel Edge with multiple lambdas), two simultaneous requests from the same buyer hitting different regional instances will bypass the in-memory cache.

### Gap B: Supabase Service Role Key Authentication Failure
Probing live Supabase PostgREST at `https://zqemrmzijlaysvfxygst.supabase.co/rest/v1/` with the local credentials in `.env.local` returned:
```json
{"message":"Unregistered API key","hint":"Double check the provided API key as it is not registered for this project."}
```
- **Analysis:** The key in `.env.local` is a 43-character string starting with `sb_s...`, whereas Supabase PostgREST requires a standard 200+ character JWT starting with `eyJ...` signed with the project JWT secret.
- **Consequence:** Local development environments cannot execute SQL migrations against the live database directly. Production migrations must be applied through the authenticated Supabase Web Dashboard SQL Editor or using a freshly provisioned Supabase Management Token.

---

## 3. REMEDIATION ACTION PLAN

1. **Production Database Migration:**
   - Log into Supabase Dashboard for project `zqemrmzijlaysvfxygst`.
   - Open **SQL Editor** -> Create Query -> Paste contents of `migrations/20261117_inquiry_idempotency_ledger.sql`.
   - Execute query and verify table `public.inquiry_idempotency_ledger` and function `public.reserve_idempotency_lock` are created.
2. **API Wiring:**
   - Update `api/_lib/supabaseClient.js` to add `reserveIdempotencyLock(key, hash)` and `completeIdempotencyRecord(key, payload)`.
   - Update `api/save-lead.js` to invoke `reserveIdempotencyLock` before persisting, falling back gracefully to `recentSubmissions` Map if the ledger table is unreachable.
3. **Local Credentials Update:**
   - Retrieve the valid JWT `service_role` key from Supabase Project Settings -> API and update local `.env.local`.

---
*Report Certified by Principal PostgreSQL & Distributed Systems Security Auditor.*
