-- ============================================================
-- AVANI AGRO FOODS — SUPABASE SCHEMA MIGRATION: QUOTATIONS PERSISTENCE
-- Migration: 20261110_quotations_table.sql
-- Description: Creates/enhances public.quotations table with delivery
-- tracking, Resend provider mapping, durable state machine, and RLS.
-- ============================================================

-- 1. Create table if not exists with core fields
CREATE TABLE IF NOT EXISTS public.quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id VARCHAR(50) UNIQUE NOT NULL,
    inquiry_id VARCHAR(50) REFERENCES public.leads(inquiry_id) ON DELETE SET NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until VARCHAR(50) NOT NULL DEFAULT '12 Oct 2026',
    
    buyer_name VARCHAR(150) NOT NULL,
    company_name VARCHAR(150) NOT NULL,
    country VARCHAR(100) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    incoterm VARCHAR(100) NOT NULL,
    destination_port VARCHAR(150) NOT NULL,
    
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    freight NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    insurance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    documentation NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    other_charges NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    grand_total NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    
    payment_terms TEXT,
    delivery_timeline TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    document_hash VARCHAR(64),
    raw_quotation JSONB,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Add delivery tracking & provider attribution columns if not present
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS buyer_email VARCHAR(255);
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS provider_message_id VARCHAR(255);
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS provider_name VARCHAR(50) DEFAULT 'resend';
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS bounced_at TIMESTAMPTZ;
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS created_by VARCHAR(100) DEFAULT 'authenticated_operator';
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100) DEFAULT 'authenticated_operator';

-- 3. Indexes for fast CRM lookup and webhook delivery attribution
CREATE INDEX IF NOT EXISTS idx_quotations_quotation_id ON public.quotations (quotation_id);
CREATE INDEX IF NOT EXISTS idx_quotations_inquiry_id ON public.quotations (inquiry_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON public.quotations (status);
CREATE INDEX IF NOT EXISTS idx_quotations_delivery_status ON public.quotations (delivery_status);
CREATE INDEX IF NOT EXISTS idx_quotations_provider_message_id ON public.quotations (provider_message_id);
CREATE INDEX IF NOT EXISTS idx_quotations_date ON public.quotations (date DESC);

-- Unique index on provider_message_id when non-null to prevent duplicate message attribution
CREATE UNIQUE INDEX IF NOT EXISTS idx_quotations_unique_provider_msg 
ON public.quotations (provider_message_id) 
WHERE provider_message_id IS NOT NULL;

-- 4. Row Level Security (RLS) Policies
-- Sensitive B2B quotation pricing and buyer contacts must be shielded from anonymous access.
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;

-- Drop existing public / anon policies from both historical and new naming schemes
DROP POLICY IF EXISTS "Deny anon access to quotations" ON public.quotations;
DROP POLICY IF EXISTS "Deny all public access to quotations" ON public.quotations;
DROP POLICY IF EXISTS "Service role full access to quotations" ON public.quotations;
DROP POLICY IF EXISTS "Service role has full access to quotations" ON public.quotations;

-- Service role has full CRUD access for serverless API operations
CREATE POLICY "Service role has full access to quotations"
ON public.quotations
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Anonymous web visitors have zero read or write access
CREATE POLICY "Deny all public access to quotations"
ON public.quotations
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- 5. Forward-only migration: Update crm_activities operator default safely
ALTER TABLE public.crm_activities ALTER COLUMN performed_by SET DEFAULT 'authenticated_operator';
