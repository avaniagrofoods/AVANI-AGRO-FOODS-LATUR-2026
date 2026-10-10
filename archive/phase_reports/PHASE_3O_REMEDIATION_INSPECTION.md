# AVANI AGRO FOODS — PHASE 3O REMEDIATION INSPECTION REPORT
**Inspection & Architectural Audit (Strict Fail-Closed / Read-Only Inspection Mode)**  
**Date:** 2026-10-08  
**Inspector:** Senior Production Engineer, Email Automation Architect & Safety Auditor  
**Scope:** Phase A Inspection Only — Zero Code Modification / Zero Outbound Emails  

---

## Executive Summary

This inspection examines the two blockers identified during Phase 3O testing:
1. **Blocker 1:** While controlled test messages were successfully delivered to TEST-01, TEST-02, and TEST-03, `TEST-01` was not recorded in the durable store [`api/_data/sequenceStateStore.json`](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/_data/sequenceStateStore.json). As a consequence, `findSequenceByCriteria` found no active sequence for `sachinnshinde1356@gmail.com` and returned `IGNORED_UNMATCHED`.
2. **Blocker 2:** MX records for `avaniagrofoods.com` point to Hostinger (`mx1.hostinger.com`). The operator's actual test reply arrived in Hostinger Webmail at `sales@avaniagrofoods.com` (confirmed by operator screenshot), but Hostinger does not possess a native HTTP webhook integration to forward the reply to `https://www.avaniagrofoods.com/api/email-reply-webhook`.

Below are the detailed, evidence-based answers to all 10 architectural questions.

---

## Phase A: Answers to the 10 Inspection Questions

### 1. What state object is required for a recipient after SEQ-01?
In [`api/_lib/sequencePersistence.js`](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/_lib/sequencePersistence.js) (lines 153–172 and 305–324), the canonical sequence state record stored under `store.sequences[`${campaign_id}:${recipient_id}`]` requires the following schema:

```json
{
  "campaign_id": "PHASE_3O_CONTROLLED_PILOT_2026",
  "recipient_id": "TEST-01",
  "sequence_id": "SEQ-01",
  "current_step": 1,
  "status": "EMAIL_1_SENT",
  "sent_steps": ["EMAIL_1"],
  "next_step": "EMAIL_2",
  "next_due_at": "2026-10-11T16:58:00.152Z",
  "last_sent_at": "2026-10-08T16:58:00.152Z",
  "reply_detected": false,
  "reply_detected_at": null,
  "followups_cancelled": false,
  "last_provider_message_id": "01a11c73-51c6-767e-81c5-3e25e53d63a0",
  "recipient_email": "sachinnshinde1356@gmail.com",
  "company_name": "Avani Agro Foods Internal Pilot Inbox 1",
  "contact_name": "Sachin Shinde",
  "created_at": "2026-10-08T16:58:00.152Z",
  "updated_at": "2026-10-08T16:58:00.152Z"
}
```

### 2. Which function is responsible for persisting it?
- Primary function: `commitSequenceStep(campaignId, recipientId, sequenceId, stepNumber, details)` in [`api/_lib/sequencePersistence.js`](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/_lib/sequencePersistence.js) (lines 273–335).
- State-level function: `saveRecipientSequenceState(campaignId, recipientId, state)` in [`api/_lib/sequencePersistence.js`](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/_lib/sequencePersistence.js) (lines 146–185).
- High-level coordinator: `dispatchSequenceStep(state, campaignId, { useDurableStorage: true, ... })` in [`api/_lib/sequenceStateMachine.js`](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/_lib/sequenceStateMachine.js) (lines 380–387).

### 3. Why the previous controlled send did not persist it?
In [`scripts/execute_phase_3o_controlled_send.cjs`](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/scripts/execute_phase_3o_controlled_send.cjs):
- The script initialized `recipientState` with `createRecipientState()` and called `reserveDailyThroughputSlot()` (which properly updated `store.dailyThroughput`).
- It successfully transmitted the email via `postResendEmail()` and recorded telemetry into `scratch/phase_3o_send_telemetry.json`.
- However, it **omitted** the call to `commitSequenceStep()` or `saveRecipientSequenceState()` to write the recipient state into `store.sequences`. As a result, `store.sequences` remained an empty object `{}`.

### 4. Exact state-machine transition required after a reply?
Defined in [`api/_lib/sequenceStateMachine.js`](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/_lib/sequenceStateMachine.js) (lines 403–457) and [`api/_lib/sequencePersistence.js`](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/_lib/sequencePersistence.js) (lines 362–403):
- Prior Status: `EMAIL_1_SENT`
- New Status: `REPLIED` / `STOPPED_REPLY_RECEIVED`
- `reply_detected`: `true`
- `followups_cancelled`: `true`
- `next_step`: `'NONE'`
- `next_due_at`: `null` (clears the 72-hour timer)
- `leadStatus`: `'REPLIED'`
- `nextAction`: `'HUMAN_REVIEW'`
- Operator Task: An audit task is generated (`TASK-...`, type `INCOMING_BUYER_REPLY`, status `PENDING_HUMAN_OPERATOR_REVIEW`).

### 5. Exact webhook payload schema?
In [`api/_lib/replyDetector.js`](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/_lib/replyDetector.js) (lines 37–85), `normalizeInboundPayload` accepts the standard Resend webhook schema:

```json
{
  "type": "email.received",
  "id": "evt_...",
  "created_at": "ISO-8601 string",
  "data": {
    "email_id": "...",
    "from": "Sender Name <email@example.com>",
    "to": ["sales@avaniagrofoods.com"],
    "subject": "Email Subject",
    "text": "Plain text body",
    "created_at": "ISO-8601 string",
    "headers": {
      "message-id": "<...>",
      "in-reply-to": "<...>",
      "references": "<...>"
    }
  }
}
```

### 6. Exact signature verification mechanism?
In [`api/email-reply-webhook.js`](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/email-reply-webhook.js) (lines 18–59):
- **Svix HMAC-SHA256:**
  - Header: `svix-id`, `svix-timestamp`, `svix-signature`
  - Replay window: `Math.abs(Date.now() / 1000 - svixTimestamp) <= 300` seconds (5 minutes). Stale timestamps are rejected with HTTP 401.
  - Secret: `RESEND_WEBHOOK_SECRET` (the prefix `whsec_` is stripped and the remaining base64 payload is decoded into a byte key buffer).
  - String to sign: `${svixId}.${svixTimestamp}.${rawBody}`
  - Signature computed: `crypto.createHmac('sha256', key).update(toSign).digest('base64')`
  - Verification: `crypto.timingSafeEqual` against the `v1,...` signature token.
- **Fallback Direct Secret:**
  - Header: `x-webhook-secret: <secret>` or `Authorization: Bearer <secret>` checked via `crypto.timingSafeEqual`.

### 7. Exact deduplication mechanism?
In [`api/email-reply-webhook.js`](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/email-reply-webhook.js) (lines 125–136):
- Unique event key: `eventId = headers['svix-id'] || payload.id || payload.eventId || payload.data?.id || payload.data?.email_id;`
- Lookup: `hasEventBeenProcessed(eventId)` checks `store.processedEvents[eventId]`.
- If already processed: Returns HTTP 200 with `{ success: true, duplicate: true, code: 'EVENT_ALREADY_PROCESSED' }`.
- If new: Upon successful processing, calls `recordProcessedEvent(eventId, details)` which commits `store.processedEvents[eventId] = { processedAt, details }`.

### 8. Exact conditions required to cancel future follow-ups?
In [`api/_lib/sequenceStateMachine.js`](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/_lib/sequenceStateMachine.js) (lines 204–210) and [`api/_lib/sequencePersistence.js`](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/_lib/sequencePersistence.js) (lines 224–230):
Any of the following flags evaluates to an immediate, permanent dispatch block:
1. `state.replyDetected === true`
2. `state.followups_cancelled === true`
3. `state.sequenceStatus === 'STOPPED_REPLY_RECEIVED'`
4. `state.sequenceStatus === 'REPLIED'`
When present, `dispatchSequenceStep()` returns `{ success: false, blocked: true, reason: 'Reply already detected from recipient. All follow-ups cancelled.' }`, making SEQ-02 dispatch impossible.

### 9. Whether sequence state is expected to be deployed JSON or runtime-persistent storage?
- **Serverless Reality:** On Vercel Lambdas, the filesystem outside `/tmp` is read-only (`EROFS`). While `/tmp` is writable, it is ephemeral and container-isolated.
- **Architectural Requirement:** Baseline sequence states must be committed into [`api/_data/sequenceStateStore.json`](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/_data/sequenceStateStore.json) and deployed with the Vercel bundle so that all serverless Lambdas initialize from the identical deterministic baseline.

### 10. Whether Hostinger provides an actual inbound webhook/HTTP integration available to this account?
- **Hostinger Capability Audit:** Hostinger Mail (hosted on `mx1.hostinger.com` / `mx2.hostinger.com`) is a standard email hosting platform (Roundcube / Titan). It natively supports SMTP, IMAP, POP3, and standard Email Forwarding. **Hostinger does NOT offer a native inbound HTTP webhook integration** (there is no setting in Hostinger to trigger an HTTP POST upon receiving an email).
- **Architectural Consequence:** An inbound bridge is technically required to connect Hostinger's email reception with Vercel's authenticated HTTP webhook.

---

## Proposed Minimal Remediation Plan

### Step 1: Fix Durable Send State (Phase B)
1. Update [`scripts/execute_phase_3o_controlled_send.cjs`](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/scripts/execute_phase_3o_controlled_send.cjs) to invoke `commitSequenceStep()` immediately after a successful Resend dispatch so that `store.sequences` is populated with the true `EMAIL_1_SENT` state.
2. Record `TEST-01`, `TEST-02`, and `TEST-03` with their actual Resend provider message IDs (`01a11c73...`, `01a11c74...`, `01a11c75...`) and timestamps in [`api/_data/sequenceStateStore.json`](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/_data/sequenceStateStore.json).
3. Add a deterministic test suite `scripts/test_phase_3o_reply_lifecycle.cjs` verifying that:
   - Successful send -> durable recipient state is committed.
   - Failed send -> state is not falsely marked.

### Step 2: Bridge Architecture for Hostinger Inbound (Phase C)
Since Hostinger does not possess a native HTTP webhook, we will provide a verified, cryptographically signed bridge script ([`scripts/bridge_hostinger_inbound_reply.cjs`](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/scripts/bridge_hostinger_inbound_reply.cjs)) that:
1. Ingests the real, verified reply from the Hostinger inbox (`sales@avaniagrofoods.com`).
2. Extracts message identifiers, subject, body, and timestamp.
3. Formats the canonical Resend `email.received` payload.
4. Generates a valid Svix HMAC-SHA256 signature using the production `RESEND_WEBHOOK_SECRET`.
5. Transmits it via HTTPS POST to `https://www.avaniagrofoods.com/api/email-reply-webhook`.

### Step 3: Verification & Lifecycle Proof (Phases D–F)
1. Probe production webhook to verify authentication, replay protection, and deduplication.
2. Deliver the genuine TEST-01 reply through the bridge.
3. Prove that `TEST-01` transitions to `STOPPED_REPLY_RECEIVED`.
4. Prove that `followups_cancelled` is set to `true` and SEQ-02 is blocked.
5. Prove that exactly 0 outbound emails are sent.
6. Verify dataset hashes and run full regression suites (144+ tests).

---

## Conclusion of Phase A Inspection

Inspection is complete. All 10 architectural questions are grounded in codebase telemetry. No code, data, or configuration has been modified during this phase.

```text
PHASE_A_INSPECTION = COMPLETE
AWAITING ADVANCEMENT TO PHASE B (FIX DURABLE SEND STATE).
```
