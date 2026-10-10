# AVANI AGRO FOODS — PHASE 3J SEQUENCE PERSISTENCE REPORT

**Generated:** 2026-10-04T19:12:00+05:30  
**Phase:** 3J Outreach Safety Remediation  
**Status:** IMPLEMENTED & DEPLOYED TO PRODUCTION  
**Outreach Authorization:** `OUTREACH_AUTHORIZED = 0` (STILL LOCKED)

---

## 1. Executive Summary

Phase 3J resolves the second core automation gap: **Durable Sequence State, Idempotency and Concurrency Protection**.

Previously, sequence progress (`EMAIL_1_SENT`, `EMAIL_2_SENT`, etc.) was stored in memory variables within a local script invocation. Cold starts, serverless worker recycling, or redeployments lost sequence context, creating risks of duplicate sends or missed timing.

Phase 3J implements a durable, atomic persistence layer (`api/_lib/sequencePersistence.js`) that tracks every recipient's progress, enforces strict idempotency keys, and provides distributed reservation locks to prevent worker concurrency races.

---

## 2. Minimum State Schema Conformance (Part D)

Every sequence entry in the durable store strictly satisfies the required 15-field specification:

```json
{
  "campaign_id": "CAMP-001",
  "recipient_id": "importer-123",
  "sequence_id": "SEQ-01",
  "current_step": 1,
  "status": "EMAIL_1_SENT",
  "sent_steps": ["EMAIL_1"],
  "next_step": "EMAIL_2",
  "next_due_at": "2026-10-07T12:00:00.000Z",
  "last_sent_at": "2026-10-04T12:00:00.000Z",
  "reply_detected": false,
  "reply_detected_at": null,
  "followups_cancelled": false,
  "last_provider_message_id": "01a105a8-1ed9-7aa3-801d-0cb2cd2d8486",
  "recipient_email": "procurement@globalbuyer.com",
  "created_at": "2026-10-04T12:00:00.000Z",
  "updated_at": "2026-10-04T12:00:00.000Z"
}
```

---

## 3. Persistence Mechanism & Storage Topology

1. **Storage Topology:**
   - Primary path: `api/_data/sequenceStateStore.json`
   - Vercel Serverless Fallback: `/tmp/sequenceStateStore.json`
   - Path resolution automatically detects read-only filesystem environments (e.g. AWS Lambda / Vercel Edge/Serverless) and routes to `/tmp` with seed initialization from primary.

2. **Atomic Write Pattern:**
   - Writes to a temporary staging file (`.tmp.${timestamp}.${random}`) in the target directory.
   - Executes atomic filesystem rename (`fs.renameSync`) to eliminate partial-write or read-during-write hazards.

3. **No Unnecessary External Database:**
   - Adheres strictly to Part D ("DO NOT introduce an unnecessary new database technology").
   - Utilizes the repository's native file-backed JSON data architecture, with CRM sync hooks prepared for `GOOGLE_SHEETS_WEBHOOK` when configured.

---

## 4. Idempotency Key Specification (Part E)

- **Key Format:**
  `${campaign_id}:${recipient_id}:${sequence_id}:EMAIL_${step_number}`
- **Pre-Dispatch Check:**
  Before any transmission, `reserveSequenceStep()` and `dispatchSequenceStep()` check `store.idempotencyKeys[idempotencyKey]`.
- **Behavior:**
  - If status is `SENT` or `COMPLETED`: returns `{ success: false, duplicate: true, reason: 'ALREADY_SENT' }`.
  - If state is inconsistent or ambiguous: marks `MANUAL_REVIEW_REQUIRED` and fails closed. No transmission occurs.

---

## 5. Concurrency Protection & Worker Lease Locks (Part F)

To prevent simultaneous serverless functions or cron workers from sending duplicate sequence steps:

1. **Reservation Token:**
   `reserveSequenceStep(campaignId, recipientId, sequenceId, stepNumber, workerId, ttlSeconds = 300)`
2. **Lease Window:**
   - Worker A claims a 5-minute reservation lease for that exact step.
   - If Worker B simultaneously attempts to process the same step, it receives:
     `{ reserved: false, alreadyReserved: true, reason: 'ALREADY_RESERVED', workerId: 'worker-A' }`
   - Worker B immediately aborts sending.
3. **Commit Phase:**
   When Worker A completes transmission, it calls `commitSequenceStep()`, converting the temporary reservation into a permanent `SENT` record.
4. **Rollback Phase:**
   If transmission encounters an error, `releaseReservation()` clears the lease so the step can be retried safely.

---

## 6. Sequence Timing & Boundary Invariants (Part G)

- `FOLLOWUP_DELAY_HOURS = 72` (strictly enforced between steps)
- Five Steps: `SEQ-01` (EMAIL_1) → `SEQ-02` (EMAIL_2) → `SEQ-03` (EMAIL_3) → `SEQ-04` (EMAIL_4) → `SEQ-05` (EMAIL_5)
- No `SEQ-06` or `EMAIL_6` exists. Hard cap `if (nextStepNum > 5)` terminates sequence with `status = 'COMPLETED'`, `next_step = 'NONE'`, `next_due_at = null`.
