# CROSS-PROJECT INTEGRATION SPECIFICATION
## AVANI AGRO FOODS: PROJECT A & PROJECT B INTERFACE

**Author:** Principal Enterprise Systems Architect & Application Security Engineer  
**Date:** 2026-11-17  
**Projects Governed:**
- **PROJECT A:** `AVANI AGRO FOODS WEBSITE ENGINE` (Public Storefront, RFQ & Quotation Ingestion)
- **PROJECT B:** `AVANI_AGRO_INTELLIGENCE` (B2B Market Intelligence, Verification, CRM & Analytics)  
**Current Status:** SPECIFICATION ONLY | IMPLEMENTATION STRICTLY UNAUTHORIZED (`OUTREACH_AUTHORIZED=0`, `IMPLEMENTATION_AUTHORIZED=0`)  

---

## 1. System Responsibilities & Data Ownership

```mermaid
flowchart LR
    subgraph PROJ_A ["PROJECT A: WEBSITE ENGINE"]
        A_UI["B2B Buyer Frontend"]
        A_API["/api/save-lead\n/api/admin-quotations"]
        A_DB[("Supabase PostgreSQL\n(leads, inquiries, quotes)")]
    end

    subgraph PROJ_B ["PROJECT B: INTELLIGENCE ENGINE"]
        B_BRG["EcosystemBridge\n(HMAC Receiver)"]
        B_DEDUP["Deduplication & Entity Graph\n(Rule DR-04)"]
        B_DB[("SQLite WAL / Turso libSQL\n(companies, contacts, sequences)")]
    end

    A_API -.->|HMAC-SHA256 Signed Event\n(Async HTTP Push)| B_BRG
    B_BRG --> B_DEDUP
    B_DEDUP --> B_DB
```

### 1.1 Data Ownership Matrix
| Domain / Entity | Canonical System of Record (SoR) | Secondary Consumer | Permitted Access Model |
| :--- | :--- | :--- | :--- |
| **Public Buyer Inquiries (RFQs)** | **PROJECT A** | Project B | Asynchronous signed push event |
| **Commercial Quotations** | **PROJECT A** | Project B (Read-Only metadata) | Asynchronous signed push event |
| **Statutory Entity Profiles (PAN/GST/IEC)** | **PROJECT B** | Project A (None) | Internal to Project B |
| **APMC Trader & Supplier Directory** | **PROJECT B** | Project A (None) | Internal to Project B |
| **CRM Deal & Contact Mappings (HubSpot)** | **PROJECT B** | Project A (None) | Internal to Project B |
| **Outbound Email Sequences & Suppressions**| **PROJECT B** | Project A (None) | Internal to Project B |

---

## 2. API Integration Boundaries & Event Exchange Model

### 2.1 Decoupled Architecture Principles
1. **Zero Database Sharing:** Project A shall never connect to Project B's SQLite or Turso database; Project B shall never connect directly to Project A's Supabase PostgreSQL database.
2. **Asynchronous Push Model:** Project A dispatches webhook events to Project B's endpoint when a verified lead or quotation is created. Project A never waits synchronously for Project B's processing.
3. **Fail-Safe Decoupling:** If Project B is offline, undergoing maintenance, or unreachable, Project A's public website and quotation workflow must continue operating without degradation.

### 2.2 Event Protocol & Payload Schema

- **Transport:** HTTPS POST to `/api/ecosystem-sync`
- **Headers:**
  - `Content-Type: application/json`
  - `X-Avani-Timestamp: <unix_epoch_seconds>`
  - `X-Avani-Event-ID: <uuid_v4>`
  - `X-Avani-Signature: <hex_encoded_hmac_sha256>`

```json
{
  "event_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "event_type": "inquiry.created",
  "timestamp": "2026-11-17T14:24:00Z",
  "source": "avani-agro-website-engine",
  "data": {
    "inquiry_id": "AAF-INQ-2026-7f8e9d0a-1b2c-3d4e-5f6a-7b8c9d0e1f2a",
    "buyer_name": "Jean Dupont",
    "email": "j.dupont@agro-import.fr",
    "company_name": "Agro Import France SAS",
    "country_code": "FR",
    "phone": "+33140506070",
    "product_interest": "Moringa Powder",
    "target_quantity_mt": 5.0,
    "quote_reference": "AAF-Q-2026-11-0042"
  }
}
```

---

## 3. Cryptographic Authentication & Security Boundaries

### 3.1 HMAC-SHA256 Signature Verification
1. **Shared Secret:** Pre-shared cryptographic secret `ECOSYSTEM_BRIDGE_SECRET` (256-bit entropy).
2. **Signature Construction:**
   ```text
   signature_payload = X-Avani-Timestamp + "." + X-Avani-Event-ID + "." + raw_json_body
   computed_signature = HMAC_SHA256(ECOSYSTEM_BRIDGE_SECRET, signature_payload)
   ```
3. **Replay Attack Defense:**
   - Project B rejects events where `|current_time - X-Avani-Timestamp| > 300 seconds` (5-minute tolerance window).
   - Project B records `X-Avani-Event-ID` in a local deduplication cache. Duplicate event IDs are returned HTTP 200 with status `DUPLICATE_IGNORED`.

---

## 4. Error Handling, Duplicate Prevention & Logging

### 4.1 Ingestion Duplicate Prevention in Project B
When Project B receives an `inquiry.created` event:
1. `EcosystemBridge.ingest_event()` checks if `data.inquiry_id` already exists in `enquiries` table.
2. If already processed, the duplicate event is logged and discarded.
3. Candidate company and contact are routed to `src/intelligence/dedup.py` for entity resolution.
4. **Rule DR-04 Enforcement:** If the company shares an address with an APMC market yard (e.g., Latur Market Yard), merge is strictly prohibited without matching PAN or GSTIN.

### 4.2 Logging & Audit Trail
- Both projects record audit events independently:
  - Project A: Logged in `audit_logs` (Supabase).
  - Project B: Logged in `audit_events` (SQLite WAL) with `event_type = 'ECOSYSTEM_INGEST'`.
- Secrets, authorization headers, and raw HMAC keys are scrubbed before logging.

---

## 5. Explicit Non-Integration Conditions

The following operations are **strictly prohibited** at all times:
1. Direct cross-project SQL queries (e.g. Supabase Foreign Data Wrappers or SQLite ATTACH DATABASE).
2. Shared `.env` or configuration files.
3. Direct synchronous blocking HTTP calls during public user-facing checkout/RFQ requests in Project A.
4. Automated cold outreach triggers from Project A events while `GLOBAL_OUTREACH_STOP=1`.
5. Automatic execution of Project B tasks without explicit queue worker leasing.
