# AVANI AGRO FOODS — PHASE 3I EMAIL SEQUENCE STATE MACHINE

## Overview
This document describes the implemented email sequence state machine for Avani Agro Foods. The architecture is fully autonomous, deterministic, and enforces strict delays and idempotency.

## States
The state machine relies on a linear progression of states:
- `PROSPECT`
- `EMAIL_1_SENT`
- `EMAIL_2_SENT`
- `EMAIL_3_SENT`
- `EMAIL_4_SENT`
- `EMAIL_5_SENT`
- `COMPLETED`

## Interruption States
If any non-standard event occurs, the sequence enters an interrupt state:
- `STOPPED_REPLIED`
- `STOPPED_BOUNCED`
- `STOPPED_OPT_OUT`
- `STOPPED_GLOBAL_HALT`

## Timings
- Delay between sequences: `72 hours`

## Safety Gates
1. `OUTREACH_AUTHORIZED` must be `1`. (Currently `0`).
2. `GLOBAL_OUTREACH_STOP` must be `0`. (Currently `1`).
3. If either gate is closed, the system immediately returns a `BLOCKED` status and prevents execution.

## Idempotency
- Key format: `campaignId:recipientId:sequenceId`
- Guarantees that even under heavy retry load or multiple simultaneous crons, an email cannot be dispatched twice to the same recipient for the same sequence.
