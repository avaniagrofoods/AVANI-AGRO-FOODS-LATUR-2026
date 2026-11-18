# PRODUCTION SQL APPLICATION EVIDENCE REPORT
## TARGET DATABASE STATUS, EXECUTION PROTOCOL & APPLICATION VERIFICATION

**Programme:** AVANI AGRO FOODS TECHNICAL STABILISATION (VERSION 5.5)  
**Project:** Project A — Website Engine  
**Canonical Directory:** `AVANI_IMPLEMENTATION_PROGRAMME/17_VERSION_5_5_FINAL_CORRECTIVE_IMPLEMENTATION/`  
**Target Supabase Project:** `zqemrmzijlaysvfxygst`  
**Target Cluster Host:** `https://zqemrmzijlaysvfxygst.supabase.co`  
**Date:** 18 November 2026  
**Auditor:** PostgreSQL Database Engineer & Release Manager  
**Application State:** **PENDING 10-SECOND OWNER EXECUTION IN SUPABASE SQL EDITOR**

---

## 1. MANDATE & EXECUTION GOVERNANCE

Task 2.2 explicitly directs:
> *"If authenticated execution is unavailable: 1. Stop the migration application step. 2. Produce the reviewed SQL file. 3. Produce exact owner execution instructions. 4. Identify the exact Supabase project and migration. 5. Wait for the owner to execute it and provide the result. Do not mark the migration as applied until production introspection confirms the new function definition."*

---

## 2. DATABASE EXECUTION BOUNDARY AUDIT

1. **Available Connection Method:** Authenticated PostgREST REST API over HTTPS (`service_role` key).
2. **Direct TCP / DDL Capability:** Standard PostgREST REST endpoints (`/rest/v1/`) do not expose administrative Data Definition Language (DDL) capabilities (`CREATE FUNCTION`, `ALTER TABLE`) to HTTP callers.
3. **Absence of Direct DB Password:** No raw PostgreSQL connection string (`postgresql://postgres:...`) is stored locally or in Vercel secrets, preserving high-grade security isolation.
4. **Governed Execution Path:** Execution of DDL stored procedure hotfixes is managed through the authoritative [Supabase Web SQL Editor](https://supabase.com/dashboard/project/zqemrmzijlaysvfxygst/sql/new).

---

## 3. LIVE PRODUCTION INTROSPECTION STATUS

Authenticated introspection against `https://www.avaniagrofoods.com/api/save-lead?action=db-diagnostic` captures the current database state:

```json
{
  "configured": true,
  "projectRef": "zqemrmzijlaysvfxygst",
  "availablePostgRestEndpoints": [
    "/inquiry_idempotency_ledger",
    "/leads",
    "/quotations",
    "/crm_activities",
    "/lead_audit_logs",
    "/rpc/reserve_idempotency_lock",
    "/rpc/complete_idempotency_record",
    "/rpc/fail_idempotency_record"
  ],
  "tableCheck": {
    "success": true,
    "status": 200
  },
  "rpcCheck": {
    "success": false,
    "status": "REQUEST_FAILED",
    "error": "Supabase PostgREST error (400): {\"code\":\"42702\",\"details\":\"It could refer to either a PL/pgSQL variable or a table column.\",\"hint\":null,\"message\":\"column reference \\\"inquiry_id\\\" is ambiguous\"}"
  }
}
```

**Observation:** The stored procedure `reserve_idempotency_lock` exists in `zqemrmzijlaysvfxygst`, but executes the uncorrected SQL definition where `inquiry_id` collides with the return table parameters.

---

## 4. PRECISE OWNER EXECUTION INSTRUCTIONS FOR SACHIN SHINDE

To apply the correction safely and resolve error 42702:

### Step 1: Open Target Project SQL Editor
Navigate to the active Supabase project:
👉 **[https://supabase.com/dashboard/project/zqemrmzijlaysvfxygst/sql/new](https://supabase.com/dashboard/project/zqemrmzijlaysvfxygst/sql/new)**  
*(Confirm that project reference `zqemrmzijlaysvfxygst` is in the URL).*

### Step 2: Paste Reviewed Hotfix Script
Open local file:  
[migrations/20261118_fix_reserve_idempotency_lock_ambiguity.sql](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/migrations/20261118_fix_reserve_idempotency_lock_ambiguity.sql)

Copy and paste the exact SQL:
```sql
CREATE OR REPLACE FUNCTION public.reserve_idempotency_lock(
    p_key VARCHAR(128),
    p_hash VARCHAR(64)
)
RETURNS TABLE (
    reserved BOOLEAN,
    existing_status VARCHAR(32),
    cached_response JSONB,
    inquiry_id VARCHAR(64),
    quote_id VARCHAR(64)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
    v_row record;
BEGIN
    INSERT INTO public.inquiry_idempotency_ledger (idempotency_key, request_hash, status, expires_at)
    VALUES (p_key, p_hash, 'IN_PROGRESS', timezone('utc'::text, now() + interval '60 seconds'))
    ON CONFLICT (idempotency_key) DO NOTHING
    RETURNING id INTO v_row;

    IF FOUND THEN
        RETURN QUERY SELECT TRUE, 'IN_PROGRESS'::VARCHAR(32), NULL::JSONB, NULL::VARCHAR(64), NULL::VARCHAR(64);
        RETURN;
    END IF;

    SELECT l.status, l.response_payload, l.inquiry_id, l.quote_id, l.expires_at
    INTO v_row
    FROM public.inquiry_idempotency_ledger l
    WHERE l.idempotency_key = p_key;

    IF v_row.status = 'IN_PROGRESS' AND v_row.expires_at < timezone('utc'::text, now()) THEN
        UPDATE public.inquiry_idempotency_ledger
        SET status = 'IN_PROGRESS',
            request_hash = p_hash,
            expires_at = timezone('utc'::text, now() + interval '60 seconds'),
            updated_at = timezone('utc'::text, now())
        WHERE idempotency_key = p_key;

        RETURN QUERY SELECT TRUE, 'RECLAIMED'::VARCHAR(32), NULL::JSONB, NULL::VARCHAR(64), NULL::VARCHAR(64);
        RETURN;
    END IF;

    RETURN QUERY SELECT FALSE, v_row.status, v_row.response_payload, v_row.inquiry_id, v_row.quote_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reserve_idempotency_lock(varchar, varchar) TO service_role, anon, authenticated;
NOTIFY pgrst, 'reload schema';
```

### Step 3: Execute & Confirm
1. Click **Run** (Ctrl+Enter).
2. Expected Result: **`Success. No rows returned (0 rows, query finished)`**.

---

## 5. POST-APPLICATION VERIFICATION PROTOCOL

Once executed by the owner:
1. `NOTIFY pgrst, 'reload schema';` reloads PostgREST's schema router.
2. An automated query against `https://www.avaniagrofoods.com/api/save-lead?action=db-diagnostic` will confirm `rpcCheck.success: true`.
3. Duplicate submissions will immediately return `HTTP 200 OK` replaying the original quotation draft.

---
**Report Approved by:** PostgreSQL Database Engineer  
**Sign-off Status:** **HOTFIX REVIEWED — AWAITING 10-SECOND OWNER RUN IN SUPABASE SQL EDITOR**
