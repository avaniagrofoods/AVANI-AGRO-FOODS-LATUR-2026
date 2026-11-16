# ECOSYSTEM INTEGRATION ARCHITECTURE — PACKAGE 3F.115

**Systems Connected:**  
- **Project A:** Avani Agro Foods Website & Quotation Engine (React 18 / Vite 5 / Vercel Serverless / Supabase Postgres / Upstash Redis / Resend)  
- **Project B:** Avani Agro Intelligence System (Python 3.14 / SQLite WAL dev / Turso libSQL HTTP v2 prod)

---

## 1. Boundary & Data Ownership Rules

1. **Zero Shared Database:** Project A (`public.leads`, `public.quotations`, `public.crm_activities`, `public.lead_audit_logs`) and Project B (`companies`, `contacts`, `enquiries`, `sequence_enrollments`, `suppressions`, `source_evidence`, `jobs`) maintain strictly independent schemas and storage engines.
2. **Acyclic Directional Flow:** Project A emits signed immutable event envelopes (`LEAD_CAPTURED`, `QUOTATION_UPDATED`, `OUTREACH_STOP_SIGNAL`); Project B ingests and deduplicates them idempotently without calling back into Project A to mutate leads or bypass authentication.
3. **Vercel Serverless Ceiling Compliance:** All Project A integration endpoints live in `api/_lib/ecosystemIntegration.js` and are routed via existing `api/admin-quotations.js` actions (`?action=ecosystem-operations`, `evaluate-outreach-gate`, `ecosystem-sync`), keeping top-level serverless files at **11** (under the Vercel Hobby 12-function cap).

---

## 2. Authenticated Event Contract

- **Headers:**
  - `X-Avani-Timestamp`: Unix epoch seconds (string). Validated within `±300s` replay window.
  - `X-Avani-Signature`: `v1=<hex_hmac_sha256>` over `${timestamp}.${rawBody}` using shared `ECOSYSTEM_SYNC_SECRET`.
  - `X-Avani-Source`: `PROJECT_A_WEBSITE`.
- **Envelope Schema (`schemaVersion: "1.0"`):**
  - `eventType`: `LEAD_CAPTURED` | `QUOTATION_UPDATED` | `OUTREACH_STOP_SIGNAL`
  - `idempotencyKey`: Deterministic key `eco:<EVENT>:<ID_OR_EMAIL>` stored in Project B `processed_webhook_events` table to prevent duplicate processing.
  - `emittedAt`: ISO-8601 UTC timestamp.
  - `payload`: Normalized B2B lead/quotation/suppression attributes.

---

## 3. 13-Stage B2B Commercial Workflow & Lead Grading

Canonical progression implemented consistently in both `ecosystemIntegration.js` (Project A) and `ecosystem_bridge.py` (Project B):
`VERIFIED_PROSPECT` -> `RESEARCHED` -> `CONTACT_VALIDATED` -> `CONTACTED` -> `CONNECTED` -> `QUALIFIED` -> `REQUIREMENT_RECEIVED` -> `SAMPLE_DISCUSSION` -> `SUPPLIER_VERIFICATION` -> `QUOTATION` -> `NEGOTIATION` -> `PURCHASE_ORDER` -> `REPEAT_BUSINESS`.

- **Lead Grading (`A`/`B`/`C`):** Scores business email domain (`+35`), Primary/Secondary export market (`+30`/`+15`), volume in KG (`+20`/`+10`), and verified provenance `sourceUrl` (`+15`). Grade `A >= 75`, Grade `B >= 45`, Grade `C < 45`.
