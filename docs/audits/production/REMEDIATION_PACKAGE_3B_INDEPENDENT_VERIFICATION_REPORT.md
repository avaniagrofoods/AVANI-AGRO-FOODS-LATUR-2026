# AVANI AGRO FOODS — REMEDIATION PACKAGE 3B INDEPENDENT VERIFICATION & CONCURRENCY AUDIT REPORT

**Date:** 2026-10-13  
**Auditor Role:** Principal Software Engineer, Distributed Systems Specialist & Application Security Auditor  
**Workspace:** `C:\Users\ALPHA-1\Downloads\21MAY2026\SACHIN SHINDE DOCUMENTS\DEVELOPEMENT TOOLS\2-AVANI AGRO FOODS LATUR 2026`  
**Target Under Audit:** Package 3A Distributed Persistence, Quota/Pacing Governance, and Secondary Indexing  
**Audit Scope & Boundaries:** Authorized Website Repository only (`AVANI_AGRO_INTELLIGENCE` is strictly external and excluded).  
**Mode:** Strict Read-Only Audit (zero application modifications, zero git commits/resets/cleans, zero live network transmissions).

---

## 1. Executive Summary & Production Release Decision

### 1.1 Production Release Verdict

> ### 🛑 RELEASE DECISION: CONDITIONAL PASS / PRODUCTION HOLD (HOLD LIVE UNATTENDED OUTREACH)
>
> **Summary Statement:**  
> The distributed persistence primitives, state fencing, and secondary indexing mechanisms introduced in Package 3A represent a major architectural improvement over synchronous local filesystem operations. However, this independent verification audit identified **three (3) High-severity defects** and **two (2) Medium-severity defects** that prevent safe, unattended production email outreach.
>
> Most critically:
> 1. **Zero Production Dispatch Wiring:** `dispatchSequenceStepDistributed` is currently called by **ZERO** production HTTP endpoints or background cron handlers in `api/`. Production batch execution scripts still invoke synchronous local state machine functions.
> 2. **Pacing Anti-Burst RMW Race:** Anti-burst pacing in KV storage uses a non-atomic Read-Modify-Write pattern (`GET` -> filter -> `SET`), which allows concurrent workers to burst above the 1 send/minute ceiling under high concurrency.
> 3. **Double-Decrement Race on Quota Slot Release:** Releasing daily throughput slots relies on non-atomic `GET` -> `DEL` -> `DECR`. Concurrent release invocations or duplicate retries race and double-decrement the daily counter.
> 4. **External Provider Timeout Duplicate Window:** In the event of a provider network timeout after Resend accepts an email, the caller's rollback handler releases locks, permitting a retry worker to send a duplicate email to the buyer.
>
> **Authorization Policy:**  
> Core state fencing and webhook reply ingestion may remain enabled in staging. **Live automated outbound email sequences MUST REMAIN PAUSED** (`GLOBAL_OUTREACH_STOP=1`) until Package 3C implements the remediations detailed in Section 7.

---

### 1.2 Summary Scorecard

| Domain | Status | Rating | Key Finding |
|---|---|---|---|
| **Working Tree & Hash Integrity** | Verified | PASS | Bit-for-bit SHA-256 match on all 3 protected datasets; zero repo tampering. |
| **Safety Controls & Invariants** | Verified | PASS | Fail-closed defaults verified; outbound email transmission blocked. |
| **Production Call Graph Coverage** | Deficient | **HIGH RISK** | `dispatchSequenceStepDistributed` has **0 production callers** in `api/`. |
| **Daily Quota Atomicity** | Partial | CONDITIONAL | Atomic `INCR` succeeds, but slot rollback has a double-decrement race. |
| **Anti-Burst Pacing** | Deficient | **HIGH RISK** | Non-atomic JSON RMW allows concurrent workers to bypass 60s cooldown. |
| **State Machine Fencing** | Robust | PASS | Lease acquisition and fence token validation prevent concurrent state overwrite. |
| **Downstream Deduplication** | Incomplete | **HIGH RISK** | Lack of provider idempotency key integration leaves duplicate window on network timeout. |
| **Secondary Index Concurrency** | Robust | PASS | Set-based candidate deduplication prevents phantom sequence matches. |

---

## 2. Working Tree & Safety Invariants Audit (Phase 0)

### 2.1 Git Repository & Working-Tree State

An audit of the git working tree was executed prior to running tests:
- **Git Branch:** `main`
- **Commit HEAD:** `2f2d73c docs: consolidate all 83 phase reports into MASTER_PHASE_REPORTS.md and archive individual reports`
- **Staged Diffs:** Empty (0 files staged)
- **Tracked Modifications Preserved (13 files):**
  1. `api/_data/sequenceStateStore.json`
  2. `api/_lib/dailyThroughputGovernor.js`
  3. `api/_lib/quotationEngine.js`
  4. `api/_lib/replyDetector.js`
  5. `api/_lib/sequencePersistence.js`
  6. `api/_lib/sequenceStateMachine.js`
  7. `api/email-reply-webhook.js`
  8. `api/quotation.js`
  9. `scripts/audit_secrets.cjs`
  10. `scripts/test_p4_4_processor_confirmation.cjs`
  11. `scripts/test_p4_5_email_dispatch.cjs`
  12. `src/data/quotationModel.js`
  13. `src/pages/AdminQuotations.jsx`
- **Pre-existing Untracked Artifacts Preserved (8 files):**
  - `PHASE_3P_INDEPENDENT_VERIFICATION_REPORT.md`
  - `docs/audits/production/AAF-PRODUCTION-20261010-2300-PHASE2-PHASE3.md`
  - `docs/audits/production/AAF-PRODUCTION-20261010-2330-PHASE4.md`
  - `docs/audits/production/AAF-PRODUCTION-20261011-PHASE5.md`
  - `scripts/test_distributed_persistence_matrix.cjs`
  - `scripts/test_phase_4_sequence_regression.cjs`
  - `scripts/test_phase_5_quotation_regression.cjs`
  - `scripts/test_webhook_raw_body_resilience.cjs`

### 2.2 Protected Datasets Integrity Verification

Every protected data file was hashed with SHA-256 and compared bit-for-bit against authorized baselines:

| Protected Dataset Path | Expected Hash | Verified Hash | Status |
|---|---|---|---|
| `api/_data/importersData.js` | `02AFC4E0F621B4326A1CBD67BFC31266A14DFA77F1B0F9767315BB971860F595` | `02AFC4E0F621B4326A1CBD67BFC31266A14DFA77F1B0F9767315BB971860F595` | **MATCH (PASS)** |
| `api/_data/importersData.snapshot-642.json` | `86100BDA94BE63A51EDDC6EE2B2458133F607D50CD5F7D66C25193F3C9137F9E` | `86100BDA94BE63A51EDDC6EE2B2458133F607D50CD5F7D66C25193F3C9137F9E` | **MATCH (PASS)** |
| `api/_data/manufacturersData.js` | `6F760D437E3C3C213E0571167B33B66B1DF87503E13DE12514BE552F4AED691C` | `6F760D437E3C3C213E0571167B33B66B1DF87503E13DE12514BE552F4AED691C` | **MATCH (PASS)** |

### 2.3 Runtime Outreach Safety Invariants

Environment evaluation confirmed fail-closed safeguards:
- In terminal environments where `GLOBAL_OUTREACH_STOP` is unset, `dailyThroughputGovernor.js` lines 145–158 and `sequenceStateMachine.js` lines 270–288 enforce fail-closed checks:
  ```javascript
  const stopEnv = process.env.GLOBAL_OUTREACH_STOP;
  // If undefined or '1', outreach is unconditionally aborted.
  ```
- **Live Transmission Shield:** Active. Zero emails were transmitted during this audit.

---

## 3. Production Route Trace & Call Graph Audit (Phase 1)

An exhaustive static and dynamic call-graph trace was executed across the entire repository to evaluate where Package 3A's distributed methods are invoked.

```
+---------------------------------------------------------------------------------------------------+
|                                  CALL GRAPH AUDIT MAP                                              |
+---------------------------------------------------------------------------------------------------+
|  Distributed Function                   | Repository Callers Found                                |
|-----------------------------------------+---------------------------------------------------------|
|  dispatchSequenceStepDistributed        | [TEST ONLY] scripts/test_distributed_persistence_matrix.cjs|
|                                         | [PRODUCTION API] NONE (0 callers in api/)               |
|-----------------------------------------+---------------------------------------------------------|
|  reserveDailyThroughputSlotDistributed  | api/_lib/sequenceStateMachine.js                       |
|                                         | scripts/test_distributed_persistence_matrix.cjs         |
|-----------------------------------------+---------------------------------------------------------|
|  releaseDailyThroughputSlotDistributed  | api/_lib/sequenceStateMachine.js                       |
|                                         | scripts/test_distributed_persistence_matrix.cjs         |
|-----------------------------------------+---------------------------------------------------------|
|  saveRecipientSequenceStateDistributed  | api/_lib/sequenceStateMachine.js                       |
|                                         | api/email-reply-webhook.js                              |
|                                         | scripts/test_distributed_persistence_matrix.cjs         |
|-----------------------------------------+---------------------------------------------------------|
|  findSequenceByCriteriaDistributed     | api/_lib/replyDetector.js                               |
|                                         | api/email-reply-webhook.js                              |
|                                         | scripts/test_distributed_persistence_matrix.cjs         |
+---------------------------------------------------------------------------------------------------+
```

### 3.1 Critical Gap: Orphaned Distributed Dispatcher

`dispatchSequenceStepDistributed` was designed and tested in Package 3 and 3A to provide lease-based execution, fence tokens, and distributed quota reservation. However:
1. **No Vercel Serverless Route Wires to It:** An inspection of `api/` confirms that no API endpoint, cron trigger, or queue processor calls `dispatchSequenceStepDistributed`.
2. **Existing Batch Scripts Use Synchronous Local Methods:**
   - `scripts/execute_phase_3o_controlled_send.cjs` imports and calls `dispatchSequenceStep` (synchronous local filesystem method).
   - `scripts/test_p4_5_email_dispatch.cjs` calls `dispatchSequenceStep`.
3. **Operational Consequence:** Deploying the current repository to a multi-instance serverless cloud platform (e.g., Vercel) while attempting batch dispatch via existing scripts or cron handlers will either:
   - Run on ephemeral local disk (`/tmp`), losing state across instances, OR
   - Bypass the distributed governor, lease locks, and KV persistence entirely.

---

## 4. Concurrency & Race-Condition Deep Dive (Phases 2–4)

### 4.1 Daily Quota Reservation & Release Semantics

#### Reservation Path (`reserveDailyThroughputSlotDistributed`):
- **Mechanism:** Employs Redis `INCR` on `quota:daily:<YYYY-MM-DD>`.
- **Concurrency Behavior:** Atomic. If the returned counter exceeds `maxDailyEmails`, it issues an immediate `DECR` and returns `{ allowed: false, reason: 'DAILY_QUOTA_EXCEEDED' }`.
- **Verdict:** Correct and safe against over-allocation.

#### Release Path (`releaseDailyThroughputSlotDistributed`):
- **Mechanism in Code (`dailyThroughputGovernor.js` lines 453–469):**
  ```javascript
  const resKey = `quota:res:${reservationId}`;
  const resVal = await kvClient.get(resKey);
  if (!resVal) return false;
  await kvClient.del(resKey);
  await kvClient.decr(dailyKey);
  ```
- **Defect Identified (Finding 2):**
  Non-atomic `GET` followed by `DEL`. If two concurrent worker processes or retry routines call `releaseDailyThroughputSlotDistributed` with the same `reservationId` simultaneously:
  1. Worker A calls `GET quota:res:xyz` -> returns reservation object.
  2. Worker B calls `GET quota:res:xyz` -> returns reservation object before Worker A deletes it.
  3. Worker A issues `DEL` and `DECR`.
  4. Worker B issues `DEL` and `DECR`.
  - **Result:** Daily quota is decremented twice for a single reservation, artificially inflating remaining sending capacity beyond configured safety limits.

---

### 4.2 Anti-Burst Pacing Window Race

- **Target Rule:** No two emails may be sent within 60 seconds (1 send/minute pacing ceiling).
- **Implementation (`dailyThroughputGovernor.js` lines 344–377):**
  ```javascript
  const logKey = 'quota:pacing:log';
  const history = (await kvClient.get(logKey)) || [];
  // Filter history to last 60 seconds...
  if (history.length >= maxPerMinute) {
    return { allowed: false, reason: 'PACING_RATE_LIMIT_EXCEEDED' };
  }
  history.push(Date.now());
  await kvClient.set(logKey, history, { ex: 3600 });
  ```
- **Defect Identified (Finding 1):**
  This is a classic **Read-Modify-Write (RMW)** race condition. In a distributed serverless environment with multiple concurrent workers:
  1. Worker 1 reads `quota:pacing:log` at $T_0$ (empty array).
  2. Worker 2 reads `quota:pacing:log` at $T_0 + 5\text{ms}$ (still empty array).
  3. Worker 1 evaluates condition (allowed), pushes $T_0$, and writes `[T0]`.
  4. Worker 2 evaluates condition (allowed), pushes $T_0 + 5\text{ms}$, and writes `[T0+5ms]`.
  - **Empirical Demonstration:** Both workers dispatch simultaneously within 5ms, directly violating the 60-second anti-burst rule.
  - **Root Cause:** Upstash REST KV does not support transactional JSON array mutation without Lua scripts or atomic key primitives.

---

### 4.3 Lease Acquisition, Fencing, and the Provider Timeout Duplicate Window

- **Lease & State Fencing:**
  - `acquireLeaseDistributed`: Uses `SETNX` (`SET ... NX EX 60`). Proved atomic; concurrent workers competing for the same recipient lease are rejected with `LEASE_ACQUISITION_FAILED`.
  - `fenceToken`: Incremented via monotonic version checking in `commitSequenceStepDistributed`. A worker whose lease expires and attempts a late write is rejected with `FENCE_TOKEN_MISMATCH`.
- **External Side-Effect Boundary (Finding 3):**
  While database state is fenced, downstream HTTP dispatch to email providers (Resend) is not transactional:
  ```
  [Caller] ---> reserveSlot() (OK)
  [Caller] ---> acquireLease() (OK)
  [Caller] ---> provider.sendEmail() ----> [Resend Provider] (200 OK Accepted)
                      |
           (Network drop / Client Timeout)
                      |
  [Caller catch block] ---> releaseReservation()
  [Caller catch block] ---> releaseSlot()
  ```
  - If Resend accepts the transmission but the client network times out before receiving the HTTP 200 response, the catch block rolls back the lease and quota slot.
  - A retry attempt will see freed quota and an unleased recipient, resulting in **a duplicate email transmitted to the customer**.
  - **Mitigation Requirement:** Resend does not offer a native idempotency-key header in its base send endpoint. Mitigation requires a durable "pre-dispatch intent record" that transitions through `SENDING` state before external calls.

---

### 4.4 Secondary Index Atomic Isolation

- **Implementation (`sequencePersistence.js` lines 1001–1015):**
  ```javascript
  // 1. Write primary state
  await kvClient.set(`seq_state:${key}`, stateJson);
  // 2. Add to email index set
  await kvClient.sadd(`seq_idx:email:${normEmail}`, key);
  // 3. Write messageId index
  if (messageId) await kvClient.set(`seq_idx:msgid:${messageId}`, key);
  ```
- **Defects Identified (Findings 4 & 5):**
  1. **Partial Multi-Key Write Failure:** These operations are separate HTTP calls. If Step 1 succeeds and Step 2 fails due to a network error, the email secondary index does not point to the updated state.
     - *Mitigating Factor:* `findSequenceByCriteriaDistributed` verifies the underlying state upon lookup and tolerates missing secondary pointers by falling back to primary key lookup if known.
  2. **Colon Delimiter Collision:** Key formulation uses `${campaignId}:${recipientId}`. When parsing keys from secondary indexes, naive string splitting (`key.split(':')`) breaks if `campaignId` or `recipientId` contains colons (e.g., URNs or formatted timestamps).

---

## 5. Empirical Concurrency Test Results (Phase 5)

Fourteen (14) isolated concurrency scenarios were executed using a high-fidelity mock Upstash KV server instrumented with artificial network latency (5ms–15ms) to simulate real-world serverless distribution.

### 5.1 Scenario Execution Matrix

| # | Test Scenario Description | Invocations | Expected Behavior | Observed Result | Status |
|---|---|---|---|---|---|
| **01** | Atomic Daily Quota Cap | 15 concurrent | Exactly 5 granted, 10 denied | 5 granted, 10 denied | **PASS** |
| **02** | Anti-Burst Pacing Concurrency | 5 concurrent (5ms gap) | 1 granted, 4 paced | **5 granted (BURST LEAK)** | **FAIL (Finding 1)** |
| **03** | Concurrent Lease Competition | 10 concurrent for 1 key | Exactly 1 granted, 9 locked out | 1 granted, 9 locked out | **PASS** |
| **04** | Stale Lease Expiry & Recovery | Sequential after TTL | Expired lease reclaimed cleanly | Clean takeover after TTL | **PASS** |
| **05** | Fencing Token Overwrite Rejection | Worker A vs Worker B | Late worker commit rejected | Stale token rejected | **PASS** |
| **06** | Secondary Index Email Set Ingestion | 5 concurrent updates | Set contains all distinct keys | All 5 keys present | **PASS** |
| **07** | Ambiguous Candidate Filtering | 2 sequences, 1 replied | Reply attributed to active only | Correct attribution | **PASS** |
| **08** | Stale Index Reference Handling | 1 live key, 1 dead key | Dead key skipped gracefully | Dead key pruned | **PASS** |
| **09** | Release Slot Concurrent Retry | 2 concurrent releases | Exactly 1 DECR issued | **2 DECRs issued (OVER-CREDIT)**| **FAIL (Finding 2)** |
| **10** | Quota Rollback on Step Rejection | Failure in step 1 | Slot decremented back to 0 | Slot cleanly restored | **PASS** |
| **11** | High Concurrency Quota Exhaustion | 50 concurrent | Count never exceeds limit | Cap strictly enforced | **PASS** |
| **12** | Monotonic Version Increment | 5 sequential steps | Version 1 -> 2 -> 3 -> 4 -> 5 | Sequence monotonic | **PASS** |
| **13** | Rapid Alternating Lease Renewal | 2 ping-pong workers | Mutual exclusion preserved | Zero overlap | **PASS** |
| **14** | Message-ID Fast Lookup Resolution | 10 lookups | Exact state resolution | 100% resolution match | **PASS** |

---

## 6. Comprehensive Findings Table

| ID | Severity | Category | File & Location | Description & Impact | Recommendation |
|---|---|---|---|---|---|
| **AAF-3B-01** | **HIGH** | Race Condition | `api/_lib/dailyThroughputGovernor.js` L344–L377 | **Anti-Burst Pacing RMW Race:** Non-atomic JSON array read-modify-write permits concurrent workers to send simultaneously, exceeding 1 send/min. | Replace JSON array with atomic key window: `SET quota:pacing:active <workerId> NX EX 60` or Redis Sorted Set `ZADD`. |
| **AAF-3B-02** | **HIGH** | Race Condition | `api/_lib/dailyThroughputGovernor.js` L453–L469 | **Reservation Release Double-Decrement:** `GET` then `DEL` allows racing retries to delete the same reservation twice, double-decrementing daily quota. | Use atomic `DEL` return value: Decrement quota only if `DEL quota:res:<id>` returned `1` (indicating successful key removal). |
| **AAF-3B-03** | **HIGH** | Reliability / Side Effects | `api/_lib/sequenceStateMachine.js` L810–L843 | **Provider Timeout Duplicate Send Window:** Network drop after Resend acceptance causes catch block to release lease, enabling retry duplicate sends. | Introduce `PENDING_TRANSMISSION` state with persistent send-intent record before invoking external provider API. |
| **AAF-3B-04** | **HIGH** | Architecture / Wiring | `api/` (Project Root) | **Zero Production Callers for Distributed Dispatch:** `dispatchSequenceStepDistributed` is not invoked by any production API route or cron handler. | Wire Vercel cron or API route to `dispatchSequenceStepDistributed` and deprecate local sync dispatch in batch scripts. |
| **AAF-3B-05** | **MEDIUM** | Distributed Storage | `api/_lib/sequencePersistence.js` L1001–L1015 | **Partial Multi-Key Write Discrepancy:** State write, email set update, and messageId write are non-transactional across Upstash HTTP calls. | Group related writes into an Upstash Redis pipeline/transaction (`MULTI`/`EXEC`) or add self-healing sync. |
| **AAF-3B-06** | **MEDIUM** | Data Encoding | `api/_lib/sequencePersistence.js` L880, L940 | **Colon Delimiter Ambiguity:** Key parsing uses `split(':')`, which fails if `campaignId` or `recipientId` contains colons. | Use delimiter escaping, JSON-encoded keys, or fixed segment slicing (`indexOf` / `lastIndexOf`). |

---

## 7. Package 3C Remediation Plan

To clear the conditional hold and prepare the outreach system for production readiness, the following remediations must be executed in **Package 3C**:

### Phase 1: Atomic Pacing & Quota Release Remediation
1. **Fix Anti-Burst Pacing:**
   - Migrate `quota:pacing:log` from JSON RMW to an atomic reservation key:
     ```javascript
     const pacingKey = `quota:pacing:lock`;
     // Atomic acquire with 60-second TTL
     const acquired = await kvClient.set(pacingKey, reservationId, { nx: true, ex: 60 });
     if (!acquired) {
       return { allowed: false, reason: 'PACING_RATE_LIMIT_EXCEEDED' };
     }
     ```
2. **Fix Quota Slot Double-Decrement:**
   - Eliminate `GET` before `DEL` in `releaseDailyThroughputSlotDistributed`:
     ```javascript
     // kvClient.del returns 1 if key existed and was deleted, 0 otherwise
     const deletedCount = await kvClient.del(resKey);
     if (deletedCount === 1) {
       await kvClient.decr(dailyKey);
       return true;
     }
     return false;
     ```

### Phase 2: Production Dispatch Pipeline Wiring
1. **Implement Serverless Outreach Handler:**
   - Create or update an authenticated endpoint in `api/cron-dispatch.js` (or similar) that validates `CRON_SECRET` and calls `dispatchSequenceStepDistributed`.
2. **Upgrade Batch Scripts:**
   - Update `scripts/execute_phase_3o_controlled_send.cjs` to call `dispatchSequenceStepDistributed` instead of synchronous `dispatchSequenceStep`.

### Phase 3: Downstream Idempotency & Send-Intent Fencing
1. **Durable Intent Record:**
   - Write a short-lived `seq_intent:<id>` token in KV before dispatching to Resend.
   - On catch/timeout, verify whether provider accepted the transmission prior to releasing quota or leases.

---

## 8. Verification Sign-Off

- **Audit Status:** Complete
- **Final Release Gate:** **CONDITIONAL PASS — PRODUCTION OUTREACH HOLD IN EFFECT**
- **Safety Flags:** Unaltered (`GLOBAL_OUTREACH_STOP=1`, `OUTREACH_AUTHORIZED=0`, `REAL_BUYER_CONTACT=0`, `REAL_BUYER_EMAILS=0`)
- **Next Required Step:** Package 3C Remediation Authorization by Project Stakeholders.
