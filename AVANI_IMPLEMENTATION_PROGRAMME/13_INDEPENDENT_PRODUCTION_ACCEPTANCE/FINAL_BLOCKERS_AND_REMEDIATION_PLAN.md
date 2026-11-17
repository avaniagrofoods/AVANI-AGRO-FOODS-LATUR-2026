# FINAL BLOCKERS AND REMEDIATION PLAN
## AVANI AGRO FOODS — CONCRETE RESIDUAL GAPS & STEP-BY-STEP PRODUCTION CLOSURE PLAN

**Programme:** AVANI AGRO FOODS Website Engine (Project A) & Agro Intelligence (Project B)  
**Author:** Antigravity Principal Systems Architect & DevOps Lead  
**Audit Date:** 17 November 2026  
**Current Governance State:** AMBER (CODE HARDENED & TESTED; DEPLOYMENT & MIGRATION PENDING)  

---

## 1. INVENTORY OF REMAINING TECHNICAL GAPS

| Gap ID | Component | Exact Technical Defect | Severity | Remediation Requirement |
| :--- | :--- | :--- | :--- | :--- |
| **GAP-A1** | Project A Database | SQL Migration `20261117_inquiry_idempotency_ledger.sql` is unapplied to live Supabase PostgreSQL. | HIGH | Apply DDL to live Supabase database via Supabase Dashboard SQL Editor. |
| **GAP-A2** | Project A API | `api/save-lead.js` still relies on in-memory `recentSubmissions` Map; does not invoke `reserve_idempotency_lock`. | MEDIUM | Wire durable reservation call into `api/save-lead.js` with fallback to memory if DB offline. |
| **GAP-A3** | Project A Git | Working tree contains uncommitted changes in `api/save-lead.js` and `api/_lib/supabaseClient.js`. | HIGH | Stage, commit, and push changes to GitHub `origin/main`. |
| **GAP-A4** | Project A Deploy | Live Vercel production is running commit `2f1a548` (prior to Phase 1 hardening). | HIGH | Trigger Vercel production build via git push to promote hardened code. |
| **GAP-A5** | Project A Local Env | Local `.env.local` Supabase service role key is invalid (returns HTTP 401 Unregistered API key). | MEDIUM | Retrieve valid JWT service role key from Supabase project settings and update `.env.local`. |
| **GAP-B1** | B2B Buyer DB | 4 records in buyer database had minor URL domain variations / redirects. | LOW | Update buyer URLs in CRM database using corrected values from `BUYER_DATABASE_35_RECORD_AUDIT.csv`. |

---

## 2. STEP-BY-STEP REMEDIATION EXECUTION PLAN

### Step 1: Apply Database Migration to Supabase
1. Navigate to Supabase Web Management Console: `https://app.supabase.com/project/zqemrmzijlaysvfxygst`.
2. Open **SQL Editor** -> **New Query**.
3. Load the SQL file:
   `C:\Users\ALPHA-1\Downloads\21MAY2026\SACHIN SHINDE DOCUMENTS\DEVELOPEMENT TOOLS\2-AVANI AGRO FOODS LATUR 2026\migrations\20261117_inquiry_idempotency_ledger.sql`
4. Execute the SQL script.
5. Verify created objects:
   - Table `public.inquiry_idempotency_ledger` with unique constraint on `idempotency_key`.
   - Function `public.reserve_idempotency_lock(p_key, p_hash)`.
   - RLS policy granting access to `service_role`.

### Step 2: Wire Durable Idempotency into `api/save-lead.js`
1. Add `reserveIdempotencyLock` helper function in `api/_lib/supabaseClient.js`.
2. In `api/save-lead.js`, compute a deterministic SHA-256 hash of the request payload (`email + product + quantity`).
3. Call `reserveIdempotencyLock`:
   - If `reserved === true`: Proceed with persistence.
   - If `reserved === false && status === 'COMPLETED'`: Return cached response immediately.
   - If `reserved === false && status === 'IN_PROGRESS'`: Return 409 or 429 concurrent submission warning.
   - If database call fails or table not yet present: Fall back gracefully to in-memory `recentSubmissions` Map to prevent service outage.

### Step 3: Git Commit and Release
```powershell
cd "C:\Users\ALPHA-1\Downloads\21MAY2026\SACHIN SHINDE DOCUMENTS\DEVELOPEMENT TOOLS\2-AVANI AGRO FOODS LATUR 2026"

# 1. Verify working tree
git status

# 2. Stage verified source code and documentation
git add api/save-lead.js api/_lib/supabaseClient.js migrations/ RFQ_FAILURE_TEST_RESULTS.json AVANI_IMPLEMENTATION_PROGRAMME/

# 3. Commit with semantic message
git commit -m "feat(security): implement server UUIDv4, insert-only persistence and durable idempotency ledger"

# 4. Push to production branch
git push origin main
```

### Step 4: Verify Vercel Production Deployment
1. Monitor Vercel deployment pipeline: GitHub webhook triggers automated build.
2. Verify Vite build succeeds across all 2,146 modules.
3. Probe live production URL `https://www.avaniagrofoods.com/api/save-lead` to confirm new deployment commit ID.
4. Run synthetic RFQ test against live site to confirm end-to-end serverless persistence.

---
*Plan Certified by Antigravity Principal Systems Architect.*
