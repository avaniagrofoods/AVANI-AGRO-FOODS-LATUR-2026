-- ==============================================================================
-- AVANI AGRO FOODS: POSTGRESQL DURABLE IDEMPOTENCY LEDGER MIGRATION
-- Project: Project A (Website Engine)
-- Target Supabase Project: zqemrmzijlaysvfxygst
-- Dashboard URL: https://supabase.com/dashboard/project/zqemrmzijlaysvfxygst/sql/new
-- Target Schema: public
-- Migration ID: 20261117_inquiry_idempotency_ledger
-- ==============================================================================

-- 1. Create dedicated idempotency ledger table
CREATE TABLE IF NOT EXISTS public.inquiry_idempotency_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idempotency_key VARCHAR(128) NOT NULL,
    request_hash VARCHAR(64) NOT NULL,
    inquiry_id VARCHAR(64),
    quote_id VARCHAR(64),
    status VARCHAR(32) NOT NULL DEFAULT 'IN_PROGRESS',
    response_payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now() + interval '60 seconds'),
    CONSTRAINT uq_inquiry_idempotency_key UNIQUE (idempotency_key),
    CONSTRAINT chk_idempotency_status CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'FAILED'))
);

-- 2. Performance indexes for atomic reservation and cleanup
CREATE INDEX IF NOT EXISTS idx_idempotency_key_status 
    ON public.inquiry_idempotency_ledger (idempotency_key, status);

CREATE INDEX IF NOT EXISTS idx_idempotency_expires_at 
    ON public.inquiry_idempotency_ledger (expires_at);

-- 3. Row Level Security (RLS) Configuration
ALTER TABLE public.inquiry_idempotency_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages idempotency ledger" ON public.inquiry_idempotency_ledger;
CREATE POLICY "Service role manages idempotency ledger"
    ON public.inquiry_idempotency_ledger
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

GRANT ALL ON TABLE public.inquiry_idempotency_ledger TO service_role;
GRANT ALL ON TABLE public.inquiry_idempotency_ledger TO anon, authenticated;

-- 4. Atomic reservation helper function (reserve_idempotency_lock)
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
    -- Attempt atomic insertion of in-progress reservation
    INSERT INTO public.inquiry_idempotency_ledger (idempotency_key, request_hash, status, expires_at)
    VALUES (p_key, p_hash, 'IN_PROGRESS', timezone('utc'::text, now() + interval '60 seconds'))
    ON CONFLICT (idempotency_key) DO NOTHING
    RETURNING id INTO v_row;

    IF FOUND THEN
        -- Lock acquired successfully
        RETURN QUERY SELECT TRUE, 'IN_PROGRESS'::VARCHAR(32), NULL::JSONB, NULL::VARCHAR(64), NULL::VARCHAR(64);
        RETURN;
    END IF;

    -- If conflict, query existing state with qualified table alias
    SELECT l.status, l.response_payload, l.inquiry_id, l.quote_id, l.expires_at
    INTO v_row
    FROM public.inquiry_idempotency_ledger l
    WHERE l.idempotency_key = p_key;

    -- If existing lock has expired and was IN_PROGRESS, allow worker to reclaim it
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

    -- Return existing status (COMPLETED or active IN_PROGRESS)
    RETURN QUERY SELECT FALSE, v_row.status, v_row.response_payload, v_row.inquiry_id, v_row.quote_id;
END;
$$;

-- 5. Completion helper function (complete_idempotency_record)
CREATE OR REPLACE FUNCTION public.complete_idempotency_record(
    p_key VARCHAR(128),
    p_inquiry_id VARCHAR(64),
    p_quote_id VARCHAR(64),
    p_response_payload JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.inquiry_idempotency_ledger
    SET status = 'COMPLETED',
        inquiry_id = p_inquiry_id,
        quote_id = p_quote_id,
        response_payload = p_response_payload,
        updated_at = timezone('utc'::text, now()),
        expires_at = timezone('utc'::text, now() + interval '30 days')
    WHERE idempotency_key = p_key;
END;
$$;

-- 6. Failure release helper function (fail_idempotency_record)
CREATE OR REPLACE FUNCTION public.fail_idempotency_record(
    p_key VARCHAR(128)
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.inquiry_idempotency_ledger
    SET status = 'FAILED',
        updated_at = timezone('utc'::text, now())
    WHERE idempotency_key = p_key;
END;
$$;

-- 7. Grant execution permissions to PostgreSQL roles
GRANT EXECUTE ON FUNCTION public.reserve_idempotency_lock(varchar, varchar) TO service_role, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_idempotency_record(varchar, varchar, varchar, jsonb) TO service_role, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fail_idempotency_record(varchar) TO service_role, anon, authenticated;

-- 8. Explicitly notify PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';
