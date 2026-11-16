# DATABASE MIGRATION RECONCILIATION — PACKAGE 3F.115

## 1. Project A (Supabase PostgreSQL) Migration Integrity

1. **Historical Baseline Immutability (`supabase/migrations/20261103_init_b2b_leads.sql`):**
   - Verified against Git commit `a06c17d` and `24a1007`: zero byte difference.
   - `crm_activities.performed_by` retains original `DEFAULT 'Sachin Shinde'`.
2. **Forward-Only Migration (`supabase/migrations/20261110_quotations_table.sql`):**
   - Idempotent creation of `public.quotations` (`inquiry_id REFERENCES public.leads(inquiry_id) ON DELETE SET NULL`).
   - Adds delivery attribution columns (`buyer_email`, `provider_message_id`, `provider_name`, `sent_at`, `delivered_at`, `bounced_at`, `delivery_status`, `created_by`, `updated_by`).
   - Adds partial unique index `idx_quotations_unique_provider_msg` on `provider_message_id WHERE provider_message_id IS NOT NULL`.
   - Drops both historical and updated RLS policy names and applies `service_role` full CRUD + `anon` strict deny-all.
   - Applies forward-only alteration: `ALTER TABLE public.crm_activities ALTER COLUMN performed_by SET DEFAULT 'authenticated_operator';`.
3. **Remote Execution Status:**
   - **PENDING OWNER DASHBOARD EXECUTION.** Local `.env.local` contains intentionally revoked key `sb_secret_ChrsKuo...` (`HTTP 401 Unregistered API key`), whereas the active rotated key (`sb_secret_oUwlG...` per commit `7bb3412`) resides in Supabase/Vercel Dashboards.
   - Back up existing tables via `pg_dump` or Supabase dashboard backup before running `20261110_quotations_table.sql`.

---

## 2. Project B (SQLite / Turso libSQL) Migration Integrity

1. **Idempotent Schema Version Tracking (`src/storage/migrations.py`):**
   - `schema_version` table tracks applied migrations.
   - Migration `001_queue_fencing_and_webhook_idempotency` adds `worker_id`, `lease_token`, `lease_generation`, `completed_at` to `jobs` and creates `processed_webhook_events`.
2. **Serverless Production Guard (`src/storage/adapter.py`):**
   - `Database._should_auto_init_schema` strictly disables auto-DDL when `VERCEL=1` or `VERCEL_ENV=production` to avoid cold-start catalog locks.
   - `create_storage_adapter()` fails closed (`ConfigurationError`) if local SQLite is attempted in production without HTTPS `DATABASE_URL` + 32+ char `DATABASE_AUTH_TOKEN`.
