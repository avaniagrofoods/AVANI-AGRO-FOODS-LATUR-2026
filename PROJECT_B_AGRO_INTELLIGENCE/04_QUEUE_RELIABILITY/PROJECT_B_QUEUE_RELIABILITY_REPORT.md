# PROJECT B: QUEUE RELIABILITY & LEASE FENCING REPORT
## AVANI_AGRO_INTELLIGENCE ENGINE

**Author:** Principal Distributed Systems Engineer & Backend Architect  
**Date:** 2026-11-17  
**Reference:** Master Execution Prompt v3.0, Part 6 (Phase 2)  
**Location:** `PROJECT_B_AGRO_INTELLIGENCE/04_QUEUE_RELIABILITY/PROJECT_B_QUEUE_RELIABILITY_REPORT.md`  

---

## 1. Distributed Queue Architecture (`src/queue/job_queue.py`)

### 1.1 Atomic Compare-and-Swap (CAS) Lease Leasing
- **Mechanism:** In `JobQueue.dequeue()`, workers claim jobs via an atomic SQL UPDATE statement:
  ```sql
  UPDATE jobs
  SET status = 'IN_FLIGHT',
      worker_id = ?,
      lease_token = ?,
      lease_generation = ?,
      locked_until = ?,
      updated_at = ?
  WHERE job_id = ?
    AND (status = 'PENDING' OR (status = 'IN_FLIGHT' AND locked_until < ?))
    AND (lease_generation = ? OR lease_generation IS NULL);
  ```
- **Concurrency Protection:** If two workers attempt to claim the same job simultaneously, the database engine enforces serialization. Worker 1 succeeds (`rowcount == 1`); Worker 2 fails (`rowcount == 0`) and automatically advances to the next candidate without starving other queue items.
- **Verdict:** `VERIFIED PASS (AAF-B-004)`.

---

## 2. Fenced Completion & Stale Worker Rejection

### 2.1 The Stale Worker Split-Brain Threat
- **Failure Scenario:** Worker A claims Job 1 with a 60-second lease. Worker A experiences an OS pause or heavy garbage collection spike exceeding 60 seconds. Worker B observes that Job 1's `locked_until` has passed, claims Job 1, increments `lease_generation`, and issues a new `lease_token`. When Worker A wakes up, it attempts to complete Job 1.
- **Lease Fencing Protection:**
  - In `JobQueue.complete(job_id, lease_token)`:
    ```sql
    DELETE FROM jobs WHERE job_id = ? AND lease_token = ? AND status = 'IN_FLIGHT';
    ```
  - Because Worker B modified `lease_token`, Worker A's `DELETE` matches 0 rows (`rowcount == 0`).
  - Worker A's mutation is rejected, and an audit event `JOB_COMPLETION_FENCING_REJECTED` is logged.
  - A stale worker can **never** commit a result after its lease has expired and a newer worker has acquired the task.
- **Verdict:** `VERIFIED HARDENED (AAF-B-005)`.

### 2.2 Dynamic Heartbeat: `renew_lease()`
- For long-running batch extraction jobs, workers call:
  ```python
  job_queue.renew_lease(job_id, lease_token, lease_seconds=60)
  ```
  This extends `locked_until` atomically, provided the worker still holds the valid `lease_token`.
- **Verdict:** `VERIFIED PASS (AAF-B-006)`.

---

## 3. Dead-Letter Queue (DLQ) & Crash Recovery

### 3.1 Exponential Backoff & Max Retries
- When a task fails, `JobQueue.fail()` increments `retry_count` and computes exponential backoff:
  $$\text{delay} = \min(3600, 2^{\text{retry\_count}} \times 10)\text{ seconds}$$
- When `retry_count >= max_retries`, the task is transitioned into `dead_letter_jobs` with full payload and error stack trace for operator analysis.
- **Verdict:** `VERIFIED PASS (AAF-B-007)`.
