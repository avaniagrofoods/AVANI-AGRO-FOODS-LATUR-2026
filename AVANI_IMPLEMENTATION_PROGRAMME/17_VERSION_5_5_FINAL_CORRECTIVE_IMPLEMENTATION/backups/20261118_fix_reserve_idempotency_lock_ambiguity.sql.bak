-- =========================================================================
-- AVANI AGRO FOODS — TARGETED STORED PROCEDURE HOTFIX (VERSION 5.4)
-- Resolves PostgreSQL Error 42702 (column reference "inquiry_id" is ambiguous)
-- Apply in Supabase SQL Editor: https://supabase.com/dashboard/project/zqemrmzijlaysvfxygst/sql/new
-- =========================================================================

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
    -- 1. Attempt atomic insertion of in-progress reservation
    INSERT INTO public.inquiry_idempotency_ledger (idempotency_key, request_hash, status, expires_at)
    VALUES (p_key, p_hash, 'IN_PROGRESS', timezone('utc'::text, now() + interval '60 seconds'))
    ON CONFLICT (idempotency_key) DO NOTHING
    RETURNING id INTO v_row;

    IF FOUND THEN
        -- Lock acquired successfully
        RETURN QUERY SELECT TRUE, 'IN_PROGRESS'::VARCHAR(32), NULL::JSONB, NULL::VARCHAR(64), NULL::VARCHAR(64);
        RETURN;
    END IF;

    -- 2. If conflict, query existing state with unambiguous qualified table alias
    SELECT l.status, l.response_payload, l.inquiry_id, l.quote_id, l.expires_at
    INTO v_row
    FROM public.inquiry_idempotency_ledger l
    WHERE l.idempotency_key = p_key;

    -- 3. If existing lock has expired and was IN_PROGRESS, allow worker to reclaim it atomically
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

    -- 4. Return existing status (COMPLETED or active IN_PROGRESS)
    RETURN QUERY SELECT FALSE, v_row.status, v_row.response_payload, v_row.inquiry_id, v_row.quote_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reserve_idempotency_lock(varchar, varchar) TO service_role, anon, authenticated;

-- Force PostgREST to reload its schema cache immediately
NOTIFY pgrst, 'reload schema';
