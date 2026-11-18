# AVANI AGRO FOODS
## VERSION 5.7 DELIVERABLE 03: LIVE DUPLICATE REPLAY AND DATABASE ACCEPTANCE REPORT

**Organisation:** AVANI AGRO FOODS  
**Owner:** Sachin Shinde — Founder & CEO  
**Target Project:** Project A — Website Engine  
**Live Production API:** `POST https://www.avaniagrofoods.com/api/save-lead`  
**Supabase Database:** `zqemrmzijlaysvfxygst.supabase.co`  
**Programme Directory:** `AVANI_IMPLEMENTATION_PROGRAMME/19_VERSION_5_7_POST_SQL_PRODUCTION_VERIFICATION/`  
**Execution Date:** 18 November 2026  
**Auditor / Engineer:** Principal QA & Database Architect (Antigravity v5.7)

---

### 1. EXECUTIVE SUMMARY & ACCEPTANCE HIGHLIGHT

This report establishes the verified resolution of the primary acceptance gate for the AVANI AGRO FOODS Website Engine: **Successful Completed Duplicate Response Replay with Zero Duplicate Records**.

Following the application of the PL/pgSQL hotfix in Supabase, the live production API was subjected to real HTTP inquiries using synthetic data.

**Key Findings:**
1. **HTTP 200 OK Replay Achieved:** Duplicate submissions with an identical idempotency key return **HTTP 200 OK** containing the exact original inquiry and quotation response.
2. **Deterministic Identifiers:** The original `inquiryId` and `quoteId` are preserved and replayed identically.
3. **Zero Database Inflation:** Exactly **one** lead and **one** quotation were created. Zero duplicate rows exist in Supabase.
4. **Zero Duplicate Notifications:** Replay requests return cached payloads directly, preventing redundant email dispatches or duplicate CRM activities.

---

### 2. COMPLETE LIVE TEST SCENARIO FORENSICS

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                              VERSION 5.7 LIVE REPLAY & CONCURRENCY MATRIX                              │
├──────┬──────────────────────────────┬───────────────────┬───────────────┬──────────────────────────────┤
│ Test │ Scenario Description         │ Idempotency Key   │ HTTP Status   │ Verified Production Outcome  │
├──────┼──────────────────────────────┼───────────────────┼───────────────┼──────────────────────────────┤
│ A    │ First Ingestion Request      │ v57-test-inspect-*│ 200 OK        │ 1 Lead, 1 Quote Created      │
├──────┼──────────────────────────────┼───────────────────┼───────────────┼──────────────────────────────┤
│ B    │ Identical Duplicate Replay   │ v57-test-inspect-*│ 200 OK        │ Replayed exact IDs; 0 Dups   │
├──────┼──────────────────────────────┼───────────────────┼───────────────┼──────────────────────────────┤
│ C    │ Direct Database Audit        │ (Supabase Ledger) │ Verified      │ 1 Lead, 1 Quote, 1 Ledger Row│
├──────┼──────────────────────────────┼───────────────────┼───────────────┼──────────────────────────────┤
│ D    │ Concurrent Competing Requests│ v57-test-conc-*   │ 200 OK / 409  │ Winner 200; Competitor 409   │
├──────┼──────────────────────────────┼───────────────────┼───────────────┼──────────────────────────────┤
│ E    │ Changed Payload / Same Key   │ v57-test-conc-*   │ 200 OK        │ Returned original cached IDs │
├──────┼──────────────────────────────┼───────────────────┼───────────────┼──────────────────────────────┤
│ F    │ RPC Fail-Closed & Recovery   │ v57-test-recov-*  │ 200 OK        │ Recovery verified            │
└──────┴──────────────────────────────┴───────────────────┴───────────────┴──────────────────────────────┘
```

---

### 3. DEEP DIVE: TEST A & TEST B VERIFICATION EVIDENCE

#### TEST A: First Submission
- **Request Metadata:**
  - Idempotency Key: `v57-test-inspect-1794977320000`
  - Buyer Name: `Dr. Vikram Patel`
  - Email: `sales@avaniagrofoods.com`
  - Crop Interest: `Soybean` (Quantity: `50 MT`)
  - Target Price: `$620/MT`
  - Destination Port: `Nhava Sheva, JNPT`
- **Production API Response (Test A):**
  - **HTTP Status:** **`200 OK`**
  - **Inquiry ID:** **`AAF-INQ-2026-6cbf27b4-b5b3-4473-aa3a-e758ec61bb71`**
  - **Quotation ID:** **`AAF-Q-2026-3a5b5a71-40a4-4564-8540-324d4ce31a39`**
  - **Lead Persistence:** `PERSISTED_SUPABASE` (`SUCCESS`)
  - **Quotation Status:** `DRAFT`
  - **Grand Total:** INR 17,500,000

#### TEST B: Identical Duplicate Replay
- **Request Metadata:**
  - Same Idempotency Key: `v57-test-inspect-1794977320000`
  - Same Normalized Payload and Headers
- **Production API Response (Test B):**
  - **HTTP Status:** **`200 OK`** (HTTP 503 is eliminated!)
  - **Inquiry ID:** **`AAF-INQ-2026-6cbf27b4-b5b3-4473-aa3a-e758ec61bb71`** (Exact match)
  - **Quotation ID:** **`AAF-Q-2026-3a5b5a71-40a4-4564-8540-324d4ce31a39`** (Exact match)
  - **Lead Persistence:** `PERSISTED_SUPABASE`
  - **Payload Semantic Match:** 100% field-for-field value equality.
  - **Side Effect Audit:**
    - Resend Email Calls: **ZERO (0)** (cached response returned directly).
    - Database Rows Created: **ZERO (0)**.

---

### 4. TEST C: DIRECT DATABASE INTEGRITY AUDIT

Database verification confirmed:
1. **Table `public.leads`:** Exactly **one** record exists for inquiry ID `AAF-INQ-2026-6cbf27b4-b5b3-4473-aa3a-e758ec61bb71`.
2. **Table `public.quotations`:** Exactly **one** record exists for quote ID `AAF-Q-2026-3a5b5a71-40a4-4564-8540-324d4ce31a39`.
3. **Table `public.inquiry_idempotency_ledger`:** Exactly **one** row exists for key `v57-test-inspect-1794977320000` with status `'COMPLETED'`, referencing `inquiry_id` and `quote_id`, and storing the full serialized JSON response in `response_payload`.
4. **Conclusion:** Zero duplicate database rows exist.

---

### 5. TEST D & TEST E: CONCURRENCY AND CONFLICT REJECTION

- **Test D (Simultaneous Concurrent Ingestion):**
  - Two asynchronous POST requests were dispatched simultaneously with key `v57-test-conc-1794977420000`.
  - Request 1 won the lock: Returned **`HTTP 200 OK`** and created `AAF-INQ-2026-a93ae42c-6d33-4cee-909e-2c6a72387737`.
  - Request 2 was locked: Returned **`HTTP 409 Conflict`** (`code: IDEMPOTENCY_IN_PROGRESS`).
  - Total inquiries created: Exactly **one (1)**.
- **Test E (Changed Payload Reused with Completed Key):**
  - Reused the key from Test D with modified quantity (`999 MT`) and price (`$999/MT`).
  - The API returned the **original completed cached response** (`AAF-INQ-2026-a93ae42c-6d33-4cee-909e-2c6a72387737`) rather than creating a new record or updating the existing record. Zero database inflation.

---

### 6. PHASE 3 VERDICT

**VERDICT: PASS (COMPLETED DUPLICATE REPLAY & CONCURRENCY FULLY CERTIFIED)**
