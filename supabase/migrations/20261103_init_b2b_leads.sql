-- Migration: 20261103_init_b2b_leads.sql
-- Description: Initialize B2B leads, quotations, audit log, and CRM activities with RLS
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inquiry_id VARCHAR(50) UNIQUE NOT NULL,
    submission_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    buyer_name VARCHAR(150) NOT NULL,
    company_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(50),
    buyer_role VARCHAR(100),
    country VARCHAR(100) NOT NULL,
    product VARCHAR(150) NOT NULL,
    quantity_original VARCHAR(50),
    quantity_normalized_kg NUMERIC(12, 2) NOT NULL,
    quantity_unit VARCHAR(20) DEFAULT 'KG',
    incoterm VARCHAR(100),
    destination_port VARCHAR(150),
    purchase_timeline VARCHAR(100),
    intended_application TEXT,
    packaging_preference VARCHAR(150),
    documents_requested TEXT,
    mesh_size VARCHAR(50),
    moisture VARCHAR(50),
    purity VARCHAR(50),
    target_price NUMERIC(12, 2),
    currency VARCHAR(10) DEFAULT 'USD',
    buyer_message TEXT,
    source VARCHAR(150) DEFAULT 'Website_Contact_RFQ',
    landing_page VARCHAR(255),
    referrer VARCHAR(255),
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    utm_content VARCHAR(100),
    utm_term VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'NEW_ENQUIRY',
    quotation_id VARCHAR(50),
    quotation_status VARCHAR(50) DEFAULT 'DRAFT',
    next_follow_up_date DATE,
    notes TEXT,
    raw_payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_inquiry_id ON public.leads (inquiry_id);
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads (email);
CREATE INDEX IF NOT EXISTS idx_leads_country ON public.leads (country);
CREATE INDEX IF NOT EXISTS idx_leads_product ON public.leads (product);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads (status);
CREATE INDEX IF NOT EXISTS idx_leads_submission_date ON public.leads (submission_date DESC);
CREATE INDEX IF NOT EXISTS idx_leads_quotation_id ON public.leads (quotation_id);

CREATE TABLE IF NOT EXISTS public.quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id VARCHAR(50) UNIQUE NOT NULL,
    inquiry_id VARCHAR(50) REFERENCES public.leads(inquiry_id) ON DELETE SET NULL,
    date DATE NOT NULL,
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

CREATE INDEX IF NOT EXISTS idx_quotations_quotation_id ON public.quotations (quotation_id);
CREATE INDEX IF NOT EXISTS idx_quotations_inquiry_id ON public.quotations (inquiry_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON public.quotations (status);
CREATE INDEX IF NOT EXISTS idx_quotations_date ON public.quotations (date DESC);

CREATE TABLE IF NOT EXISTS public.lead_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    actor VARCHAR(100) NOT NULL DEFAULT 'System',
    previous_state JSONB,
    new_state JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON public.lead_audit_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON public.lead_audit_logs (created_at DESC);

CREATE TABLE IF NOT EXISTS public.crm_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inquiry_id VARCHAR(50) NOT NULL REFERENCES public.leads(inquiry_id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    activity_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    summary TEXT NOT NULL,
    outcome VARCHAR(100),
    next_follow_up_date DATE,
    performed_by VARCHAR(100) NOT NULL DEFAULT 'Sachin Shinde',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_inquiry_id ON public.crm_activities (inquiry_id);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Deny anon access to leads" ON public.leads;
CREATE POLICY "Deny anon access to leads" ON public.leads FOR ALL TO anon USING (false);

DROP POLICY IF EXISTS "Deny anon access to quotations" ON public.quotations;
CREATE POLICY "Deny anon access to quotations" ON public.quotations FOR ALL TO anon USING (false);

DROP POLICY IF EXISTS "Deny anon access to audit" ON public.lead_audit_logs;
CREATE POLICY "Deny anon access to audit" ON public.lead_audit_logs FOR ALL TO anon USING (false);

DROP POLICY IF EXISTS "Deny anon access to crm" ON public.crm_activities;
CREATE POLICY "Deny anon access to crm" ON public.crm_activities FOR ALL TO anon USING (false);

DROP POLICY IF EXISTS "Service role full access to leads" ON public.leads;
CREATE POLICY "Service role full access to leads" ON public.leads FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access to quotations" ON public.quotations;
CREATE POLICY "Service role full access to quotations" ON public.quotations FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access to audit" ON public.lead_audit_logs;
CREATE POLICY "Service role full access to audit" ON public.lead_audit_logs FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access to crm" ON public.crm_activities;
CREATE POLICY "Service role full access to crm" ON public.crm_activities FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_leads_updated_at ON public.leads;
CREATE TRIGGER trigger_leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_quotations_updated_at ON public.quotations;
CREATE TRIGGER trigger_quotations_updated_at
    BEFORE UPDATE ON public.quotations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
