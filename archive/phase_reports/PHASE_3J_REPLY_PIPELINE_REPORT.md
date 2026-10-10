# AVANI AGRO FOODS — PHASE 3J INBOUND REPLY PIPELINE REPORT

**Generated:** 2026-10-04T19:12:00+05:30  
**Phase:** 3J Outreach Safety Remediation  
**Status:** IMPLEMENTED & DEPLOYED TO PRODUCTION  
**Outreach Authorization:** `OUTREACH_AUTHORIZED = 0` (STILL LOCKED)

---

## 1. Executive Summary

Phase 3J resolves the first of two critical automation safety gaps identified in Phase 3I: **Inbound Reply Detection and Automated Follow-up Cancellation**. 

Previously, `handleIncomingReply()` was a localized in-memory helper with no HTTP ingestion endpoint, no Svix signature verification, no multi-factor matching, and no durable cancellation across serverless invocations.

In Phase 3J, a complete production pipeline has been implemented, tested, and deployed to production. When an inbound buyer email or reply event arrives, the system validates the webhook signature, applies replay protection, matches the sender against active sequences using a multi-factor confidence hierarchy, sets `reply_detected = true`, sets `followups_cancelled = true`, and permanently halts all subsequent sequence emails (SEQ-02 through SEQ-05).

---

## 2. Event Path Architecture

```
                       [ INCOMING BUYER REPLY ]
                                  │
                                  ▼
           [ POST /api/email-reply-webhook (Vercel Node.js) ]
                                  │
           ┌──────────────────────┴──────────────────────┐
           ▼                                             ▼
 [ Svix Signature Verification ]               [ Direct Webhook Secret ]
   (svix-id, svix-timestamp,                    (x-webhook-secret /
    svix-signature HMAC SHA256)                  Bearer token)
           │                                             │
           └──────────────────────┬──────────────────────┘
                                  ▼
                     [ Authentication Passed? ]
                     ├── NO  ──► 401 Unauthorized (Fail Closed)
                     └── YES ──► Proceed
                                  │
                                  ▼
                   [ Replay Protection Filter ]
             Check processedEvents[eventId] in Durable Store
                     ├── DUPLICATE ──► 200 OK (Idempotent Ack)
                     └── NEW EVENT ──► Record eventId
                                  │
                                  ▼
                     [ Event Normalization ]
             Extract: From, To, Subject, In-Reply-To,
                      References, Message-ID, Timestamp
                                  │
                                  ▼
                   [ Multi-Factor Reply Matcher ]
                     api/_lib/replyDetector.js
         1. In-Reply-To / References == last_provider_message_id
         2. Exact normalized sender email (single match)
                                  │
           ┌──────────────────────┼──────────────────────┐
           ▼                      ▼                      ▼
    [ EXACT MATCH ]         [ AMBIGUOUS ]          [ UNMATCHED ]
           │                      │                      │
           │           Flag all matching records         │
           │           to MANUAL_REVIEW_REQUIRED         │
           │           and cancel follow-ups             │
           ▼                      │                      ▼
  [ Durable Store Update ]        │               Log audit entry
  - reply_detected = true         │               Return 200 IGNORED
  - reply_detected_at = now       │
  - followups_cancelled = true    │
  - status = 'REPLIED'            │
  - next_step = 'NONE'            │
  - next_due_at = null            │
           │                      │
           ▼                      ▼
  [ Permanent Halt: NO EMAIL 2, 3, 4, or 5 Can Ever Be Dispatched ]
```

---

## 3. Webhook Authentication & Security (Part J)

- **Endpoint:** `POST https://www.avaniagrofoods.com/api/email-reply-webhook`
- **Supported Authentication Schemes:**
  1. **Svix Standard Webhook Verification:**
     - Headers: `svix-id`, `svix-timestamp`, `svix-signature`
     - Tolerance: 5-minute replay prevention window
     - Algorithm: HMAC-SHA256 with base64 secret payload
  2. **Direct Shared Secret:**
     - Headers: `x-webhook-secret` or `Authorization: Bearer <secret>`
     - Uses `crypto.timingSafeEqual` to prevent timing attacks
- **Fail-Closed Behavior:**
  - If `RESEND_WEBHOOK_SECRET` / `CRM_WEBHOOK_SECRET` is unset: HTTP 500 (`WEBHOOK_UNCONFIGURED`)
  - If signature or secret is missing/invalid: HTTP 401 (`WEBHOOK_UNAUTHORIZED`)
  - Non-POST requests: HTTP 405 (`Method Not Allowed`)

---

## 4. Reply Matching Logic (Part B)

The matcher (`api/_lib/replyDetector.js`) refuses to rely on display names. It evaluates inbound messages with the following priority hierarchy:

1. **Priority 1: Message-ID & Thread References (Confidence: `EXACT_MESSAGE_ID` / `EXACT_REFERENCES`)**
   - Matches incoming `In-Reply-To` or `References` header against the recorded `last_provider_message_id` stored during outbound dispatch.
   - 100% deterministic thread matching even if the recipient replies from an alias or secondary email.

2. **Priority 2: Normalized Email Address (Confidence: `EXACT_EMAIL`)**
   - Normalizes email (`Name <buyer@domain.com>` → `buyer@domain.com`, lowercase, trimmed).
   - Queries durable store for single active sequence matching that recipient.

3. **Ambiguity Handling (Fail-Closed):**
   - If multiple active sequences match the same incoming email, the system **does not guess**.
   - It flags all matched records as `MANUAL_REVIEW_REQUIRED`, sets `followups_cancelled = true`, and suspends automation immediately.

---

## 5. Follow-Up Cancellation & Safety (Part C & Part H)

When a reply is processed:
- `reply_detected = true`
- `reply_detected_at = ISO-8601 timestamp`
- `followups_cancelled = true`
- `status = 'REPLIED'`
- `next_step = 'NONE'`
- `next_due_at = null`

**Timer Override Guarantee:**
In `api/_lib/sequenceStateMachine.js` (`dispatchSequenceStep`):
```javascript
if (state.replyDetected || state.followups_cancelled || state.sequenceStatus === 'REPLIED') {
  state.sequenceStatus = 'STOPPED_REPLY_RECEIVED';
  state.nextAction = 'HUMAN_REVIEW';
  state.nextFollowUpDueAt = null;
  return { success: false, blocked: true, reason: 'Reply already detected from recipient. All follow-ups cancelled.' };
}
```
Even if a timer trigger runs at 72 hours, the state check executes first and permanently aborts transmission.

---

## 6. Duplicate Webhook & Replay Protection (Part I)

- Every processed webhook event ID (`svix-id` or payload `id`) is recorded in `processedEvents[eventId]`.
- If Resend or a mail proxy retries delivery of the same webhook, the endpoint detects `hasEventBeenProcessed(eventId) === true`.
- It returns HTTP 200 (`EVENT_ALREADY_PROCESSED`) without creating duplicate database records, duplicate tasks, or secondary state transitions.
