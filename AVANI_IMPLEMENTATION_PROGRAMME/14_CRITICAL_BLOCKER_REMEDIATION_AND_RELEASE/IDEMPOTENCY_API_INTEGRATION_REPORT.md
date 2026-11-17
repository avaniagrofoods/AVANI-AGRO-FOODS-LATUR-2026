# IDEMPOTENCY API INTEGRATION REPORT
## DURABLE CROSS-INSTANCE IDEMPOTENCY, RPC RESERVATION PROTOCOL & INTEGRITY AUDIT

**Project:** AVANI AGRO FOODS WEBSITE ENGINE — PROJECT A  
**Canonical Directory:** `AVANI_IMPLEMENTATION_PROGRAMME/14_CRITICAL_BLOCKER_REMEDIATION_AND_RELEASE/`  
**Date:** 17 November 2026  
**Auditor:** Principal Distributed Systems Architect & Application Security Engineer  
**Status:** **FULLY INTEGRATED & 100% REGRESSION VERIFIED (9/9 PASS)**

---

## 1. ARCHITECTURAL OVERVIEW

In multi-instance serverless deployments (such as Vercel AWS Lambda / Cloudflare Edge runtimes), in-memory deduplication caches (e.g. `Map` / `LRU`) fail to prevent duplicate lead creation when concurrent requests arrive at separate runtime instances.

To achieve bulletproof, durable idempotency without external third-party dependencies, Project A implements a PostgreSQL-backed **Durable Idempotency Ledger** governed by atomic Database RPC procedures.

```
                      [ Client B2B RFQ Submission ]
                                    │
                                    ▼
                     [ API: api/save-lead.js ]
                                    │
    ┌───────────────────────────────┴───────────────────────────────┐
    │ 1. Extract / Compute Idempotency-Key & SHA-256 Request Hash   │
    │ 2. Call PostgreSQL RPC: reserve_idempotency_lock(key, hash)   │
    └───────────────────────────────┬───────────────────────────────┘
                                    │
         ┌──────────────────────────┴──────────────────────────┐
         │                                                     │
[ Case A: Reserved = TRUE ]                               [ Case B: Reserved = FALSE ]
         │                                                     │
         ├─ Status: IN_PROGRESS                                ├─ If IN_PROGRESS:
         ├─ Execute Quote & Ingestion                          │  Return HTTP 409 Conflict
         ├─ Persist Leads (insert-only)                        │
         ├─ Call complete_idempotency_record(...)              └─ If COMPLETED:
         │  (caches final JSON payload)                           Return HTTP 200 Replay
         └─ Return HTTP 200 Success                               (with cached inquiry ID)
```

---

## 2. KEY INTEGRATION ARTIFACTS

### 2.1 Storage Client Integration (`api/_lib/supabaseClient.js`)
Three dedicated helper functions were added to `api/_lib/supabaseClient.js`:

1. **`reserveIdempotencyLock(idempotencyKey, requestHash)`:**
   Invokes the PostgreSQL RPC function `reserve_idempotency_lock` via PostgREST:
   ```javascript
   export async function reserveIdempotencyLock(idempotencyKey, requestHash) {
     const payload = {
       p_idempotency_key: String(idempotencyKey).substring(0, 128),
       p_request_hash: String(requestHash).substring(0, 64)
     };
     const res = await supabaseFetch('rpc/reserve_idempotency_lock', {
       method: 'POST',
       body: JSON.stringify(payload)
     });
     ...
   }
   ```
   Returns an atomic status object:
   - `{ success: true, reserved: true }`: New lock acquired; safe to process.
   - `{ success: true, reserved: false, existingStatus: 'IN_PROGRESS' }`: Concurrent execution in flight.
   - `{ success: true, reserved: false, existingStatus: 'COMPLETED', cachedResponse: {...} }`: Prior execution succeeded; immediate safe replay.

2. **`completeIdempotencyRecord(idempotencyKey, payload)`:**
   Invokes `complete_idempotency_record` to atomically transition the record to `COMPLETED`, storing the full response JSON for future replays.

3. **`failIdempotencyRecord(idempotencyKey)`:**
   Invokes `fail_idempotency_record` on unexpected runtime errors or downstream persistence failures, clearing the lock and enabling immediate client retries.

### 2.2 Controller Integration (`api/save-lead.js`)
The main lead capture handler enforces the following sequence:

1. **Deterministic Key Derivation:**
   ```javascript
   const deterministicKey = crypto.createHash('sha256')
     .update(`${email}:${pm.productId || rawProduct}:${normalizedQuantity}:${dateStr}`)
     .digest('hex');
   const idempotencyKey = String(
     req.headers['idempotency-key'] || 
     req.headers['x-idempotency-key'] || 
     body.idempotencyKey || 
     deterministicKey
   ).substring(0, 128);
   ```

2. **Concurrency & Replay Enforcement:**
   - If the database indicates `existingStatus === 'IN_PROGRESS'`, the API terminates immediately with **HTTP 409 Conflict**:
     ```json
     {
       "success": false,
       "code": "CONCURRENT_REQUEST_IN_PROGRESS",
       "error": "An identical enquiry is currently being processed. Please wait a few seconds before retrying."
     }
     ```
   - If `existingStatus === 'COMPLETED'`, the API terminates with **HTTP 200 OK**, returning the previously committed `inquiryId` and quotation data without re-triggering notifications or database writes.

3. **Strict Fail-Closed Persistence:**
   If primary database insertion fails, the API invokes `failIdempotencyRecord(idempotencyKey)`, purges the local deduplication cache, and returns **HTTP 500**, ensuring zero silent or unrecorded enquiries.

---

## 3. SECURITY & INTEGRITY INVARIANTS

| Invariant | Implementation Mechanism | Verification Status |
| :--- | :--- | :--- |
| **Strict Insert-Only PostgREST** | `allowUpsert ? 'resolution=merge-duplicates,return=representation' : 'return=representation'`. Set to `insertOnly: true` in `save-lead.js`. Prevents accidental overwrites. | **VERIFIED (IDEM-06)** |
| **Server-Enforced UUIDv4** | `AAF-INQ-${currentYear}-${crypto.randomUUID()}` generated dynamically on the server. Caller-supplied `inquiryId` and `quoteId` are stripped. | **VERIFIED (IDEM-03)** |
| **Deterministic Key Uniqueness** | SHA-256 hash across email, product, normalized quantity, and UTC date. | **VERIFIED (IDEM-08)** |
| **Concurrency Protection** | PostgreSQL row-level locks and 60-second in-progress expiration prevent double processing. | **VERIFIED (IDEM-09)** |
| **Cache Purge on Failure** | Failed insertions clear lock and cache, permitting immediate user retries. | **VERIFIED (IDEM-05)** |

---

## 4. REGRESSION VERIFICATION EVIDENCE

The test script `scripts/test_idempotency_matrix.mjs` was executed and recorded in `IDEMPOTENCY_TEST_RESULTS.json`:
- **IDEM-01:** Repeated Identical Inquiry Submission Deduplication — **PASS**
- **IDEM-02:** Client Custom Idempotency-Key Header Handling — **PASS**
- **IDEM-03:** Client Identifier Override Stripping & Server UUIDv4 Invariant — **PASS**
- **IDEM-04:** Database Persistence Failure Shield (Fail-Closed Enforcement) — **PASS**
- **IDEM-05:** Deduplication Cache Purge on Persistence Failure — **PASS**
- **IDEM-06:** Strict Insert-Only PostgREST Semantic Verification — **PASS**
- **IDEM-07:** Durable Idempotency Helper Functions Exported — **PASS**
- **IDEM-08:** Deterministic SHA-256 Idempotency Key Computation — **PASS**
- **IDEM-09:** PostgreSQL Idempotency Reservation 60s TTL & Stale Reclaim Policy — **PASS**

**Result:** **9 / 9 TESTS GREEN (100% PASS RATE)**.

---
**Report Approved by:** Principal Distributed Systems Architect  
**Sign-off Status:** **ARCHITECTURALLY CERTIFIED & PRODUCTION READY**
