# PACKAGE 3F.110 — ARCHITECTURE AND SCHEMA DESIGN REPORT

**PROJECT:** AVANI AGRO FOODS WEBSITE ENGINE (PROJECT A ONLY)  
**ROOT:** `C:\Users\ALPHA-1\Downloads\21MAY2026\SACHIN SHINDE DOCUMENTS\DEVELOPEMENT TOOLS\2-AVANI AGRO FOODS LATUR 2026`  
**DATE:** 10 NOVEMBER 2026  
**MODE:** CONTROLLED LOCAL IMPLEMENTATION & EVIDENCE-BASED PRODUCTION READINESS  
**BASELINE REPORTED HEAD:** `24a10079ee02c845bf8d0deaadfc318772bcd321`  
**GOVERNANCE:** GLOBAL_OUTREACH_STOP=1 · OUTREACH_AUTHORIZED=0 · PRODUCTION_AUTHORIZED=0  

---

## 1. EXECUTIVE SUMMARY & OBJECTIVES

Package 3F.110 addresses the architectural gaps identified in the Package 3F.109 post-remediation audit:
1. **Server-Side Quotation Persistence:** Transitioned quotation lifecycle storage from client-only simulation to primary Postgres persistence in Supabase via PostgREST with strict Row Level Security (RLS).
2. **Durable Webhook Idempotency:** Eliminated the ephemeral in-memory `seenWebhookEventIds = new Set()` in `api/_lib/quotationModel.js`, replacing it with distributed KV atomic lease claims (`claimQuotationWebhookDistributed` / `completeQuotationWebhookDistributed` using `SET NX EX`), preventing duplicate event execution across serverless cold starts.
3. **Delivery Tracking & Provider Attribution:** Added schema columns, unique constraints, and database indexes for Resend provider message ID tracking (`provider_message_id`), delivery timestamps (`sent_at`, `delivered_at`, `bounced_at`), and state transitions.
4. **Residual Actor Attribution Cleanup:** Purged residual hardcoded operator names (`Sachin Shinde`) from frontend client-side stores (`PrivateDashboard.jsx`, `Contact.jsx`) and SQL defaults (`supabase/schema.sql`, `supabase/migrations/20261103_init_b2b_leads.sql`), replacing them with role-bound `authenticated_operator`.

---

## 2. DATABASE SCHEMA ARCHITECTURE

### 2.1 Table: `public.quotations`

The schema migration `supabase/migrations/20261110_quotations_table.sql` establishes the authoritative Postgres data model:

```sql
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
    
    -- Delivery tracking & provider attribution (Added in Package 3F.110)
    buyer_email VARCHAR(255),
    provider_message_id VARCHAR(255),
    provider_name VARCHAR(50) DEFAULT 'resend',
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    bounced_at TIMESTAMPTZ,
    delivery_status VARCHAR(50) DEFAULT 'pending',
    created_by VARCHAR(100) DEFAULT 'authenticated_operator',
    updated_by VARCHAR(100) DEFAULT 'authenticated_operator',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 2.2 Indexing Strategy
- `idx_quotations_quotation_id`: B-Tree index on primary business ID (`quotation_id`).
- `idx_quotations_inquiry_id`: B-Tree index for CRM lead foreign key lookups.
- `idx_quotations_status`: B-Tree index for workflow status queries (`DRAFT`, `SENT`, `DELIVERED`, `BOUNCED`).
- `idx_quotations_delivery_status`: B-Tree index for delivery lifecycle queries.
- `idx_quotations_provider_message_id`: B-Tree index for webhook message matching.
- `idx_quotations_unique_provider_msg`: Partial UNIQUE index on `provider_message_id WHERE provider_message_id IS NOT NULL` preventing dual-attribution of provider events.
- `idx_quotations_date`: B-Tree index on quotation date descending for paginated admin feeds.

### 2.3 Row Level Security (RLS) Policies
- Anonymous role (`anon`): Zero permissions (`USING (false) WITH CHECK (false)`).
- Service role (`service_role`): Full CRUD permissions (`USING (true) WITH CHECK (true)`).
- Serverless endpoints consume PostgREST endpoints exclusively using `SUPABASE_SERVICE_ROLE_KEY`.

---

## 3. SERVERLESS PERSISTENCE & CLIENT LAYER

### 3.1 `api/_lib/supabaseClient.js` Enhancements
The Supabase abstraction layer provides five core operations for quotation lifecycle management:
1. `saveQuotationToSupabase(quoteRecord)`: Upserts quotation record with merge-duplicates resolution and records immutable audit log.
2. `getQuotationByIdFromSupabase(quotationId)`: Retrieves quotation by business ID.
3. `getQuotationByMessageIdFromSupabase(messageId)`: Resolves incoming webhook provider message ID to quotation record.
4. `updateQuotationDeliveryStatusInSupabase(quotationId, updateData)`: Atomically updates delivery tracking timestamps and statuses.
5. `fetchQuotationsFromSupabase({ limit, offset, status, search })`: Provides paginated, searchable quotation listings for admin portal.

### 3.2 Fail-Safe Unconfigured Behavior
When `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` is not present, all methods fail closed gracefully:
- Return structured status `{ persisted: false, status: 'SUPABASE_UNCONFIGURED' }` or `{ success: false, unconfigured: true }`.
- Read operations fall back to verified mock/sample datasets in offline dev/test mode.
- Write operations log structured warnings without throwing unhandled rejections.

---

## 4. DISTRIBUTED WEBHOOK IDEMPOTENCY ARCHITECTURE

### 4.1 Upstash KV Distributed Claim Model
In multi-region serverless architectures (Vercel), cold starts prevent shared memory sets from stopping webhook replay attacks. The new distributed claim engine enforces:

```
[Incoming Resend Webhook]
          │
          ▼
   [Svix Signature Verification]
          │
          ▼
   [claimQuotationWebhookDistributed(eventId, workerId, leaseSeconds=60)]
          │
   ┌──────┴──────┐
   ▼             ▼
[Key Exists?]  [Key Not Exists]
   │             │
   │ (Duplicate) │ (Atomic SET NX EX 60)
   ▼             ▼
[Return 200     [Process Webhook Event]
 Idempotent ACK] │
                 ▼
         [Update Postgres Status]
                 │
                 ▼
         [completeQuotationWebhookDistributed(eventId, retention=7d)]
```

### 4.2 Replay Protection Guarantees
- At-least-once delivery with bounded lease deduplication (60s lease window).
- 7-day retention (`EX 604800`) for completed events in distributed KV.
- Clean memory fallback for offline testing and local test runners.
