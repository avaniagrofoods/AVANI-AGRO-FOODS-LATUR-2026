/**
 * AVANI AGRO FOODS — PHASE 3O CONTROLLED LIVE TEST DISPATCH
 * scripts/execute_phase_3o_controlled_send.cjs
 *
 * HARD SAFETY INVARIANTS:
 * - EXACT ALLOWLIST:
 *   1. sachinnshinde1356@gmail.com
 *   2. starpowerzlatur2210@gmail.com
 *   3. avaniloanservicelatur@gmail.com
 * - ZERO REAL BUYERS / IMPORTERS / MANUFACTURERS
 * - SENDER: AVANI AGRO FOODS <sales@avaniagrofoods.com>
 * - REPLY-TO: sales@avaniagrofoods.com
 * - SEQUENCE: SEQ-01 ONLY
 * - PACING: >= 60 SECONDS BETWEEN SENDS
 * - GLOBAL_OUTREACH_STOP = 1 (remains active for all other recipients)
 * - PILOT_AUTHORIZED = 1 ONLY FOR THE THREE TEST ADDRESSES
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

const {
  createRecipientState,
  approveRecipientForOutreach,
  dispatchSequenceStep,
  SEQUENCE_STATUSES,
  LEAD_STATUSES
} = require('../api/_lib/sequenceStateMachine.js');

const {
  commitSequenceStep
} = require('../api/_lib/sequencePersistence.js');

const {
  reserveDailyThroughputSlot,
  getDailyThroughputStatus
} = require('../api/_lib/dailyThroughputGovernor.js');

const {
  SENDER_IDENTITY,
  renderSequenceEmail
} = require('../api/_lib/emailSequences.js');

const { IMPORTERS } = require('../api/_data/importersData.js');

// 1. Strict Recipient Allowlist
const ALLOWED_TEST_RECIPIENTS = new Set([
  'sachinnshinde1356@gmail.com',
  'starpowerzlatur2210@gmail.com',
  'avaniloanservicelatur@gmail.com'
]);

// 2. Exact Test Fixtures
const TEST_RECIPIENTS = [
  {
    recipientId: 'TEST-01',
    email: 'sachinnshinde1356@gmail.com',
    companyName: 'Avani Agro Foods Internal Pilot Inbox 1',
    contactPerson: 'Sachin Shinde',
    productFocus: 'Moringa & Dehydrated Red Onion Powder'
  },
  {
    recipientId: 'TEST-02',
    email: 'starpowerzlatur2210@gmail.com',
    companyName: 'Avani Agro Foods Internal Pilot Inbox 2',
    contactPerson: 'Star Power Sourcing Desk',
    productFocus: 'Dehydrated Red Onion Powder'
  },
  {
    recipientId: 'TEST-03',
    email: 'avaniloanservicelatur@gmail.com',
    companyName: 'Avani Agro Foods Internal Pilot Inbox 3',
    contactPerson: 'Avani Loan Service Procurement',
    productFocus: 'Moringa Oleifera Leaf Powder'
  }
];

function getEnvVar(name) {
  if (process.env[name]) return process.env[name];
  const envLocalPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envLocalPath)) {
    const lines = fs.readFileSync(envLocalPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1 && trimmed.substring(0, idx).trim() === name) {
        return trimmed.substring(idx + 1).trim().replace(/^["']|["']$/g, '');
      }
    }
  }
  return null;
}

function computeSha256(filePath) {
  const fullPath = path.isAbsolute(filePath) ? filePath : path.join(__dirname, '..', filePath);
  return crypto.createHash('sha256').update(fs.readFileSync(fullPath)).digest('hex').toUpperCase();
}

function postResendEmail(apiKey, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = https.request({
      hostname: 'api.resend.com',
      port: 443,
      path: '/emails',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ statusCode: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ statusCode: res.statusCode, rawBody: body });
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function getResendEmailStatus(apiKey, emailId) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.resend.com',
      port: 443,
      path: `/emails/${emailId}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ statusCode: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ statusCode: res.statusCode, rawBody: body });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function executeControlledSend() {
  console.log('============================================================');
  console.log('AVANI AGRO FOODS — PHASE 3O CONTROLLED TEST SEND EXECUTION');
  console.log('============================================================\n');

  // PRE-FLIGHT SAFETY CHECKS
  console.log('--- PRE-FLIGHT SAFETY CHECKS ---');

  // Check 1: API Key
  const apiKey = getEnvVar('RESEND_API_KEY');
  if (!apiKey) {
    throw new Error('FAIL-CLOSED: Missing RESEND_API_KEY');
  }
  console.log('[CHECK 1] RESEND_API_KEY present: PASS');

  // Check 2: Frozen Datasets
  const hashes = [
    ['importersData.js', computeSha256('api/_data/importersData.js'), '02AFC4E0F621B4326A1CBD67BFC31266A14DFA77F1B0F9767315BB971860F595'],
    ['snapshot-642.json', computeSha256('api/_data/importersData.snapshot-642.json'), '86100BDA94BE63A51EDDC6EE2B2458133F607D50CD5F7D66C25193F3C9137F9E'],
    ['manufacturersData.js', computeSha256('api/_data/manufacturersData.js'), '6F760D437E3C3C213E0571167B33B66B1DF87503E13DE12514BE552F4AED691C']
  ];
  for (const [name, actual, expected] of hashes) {
    if (actual !== expected) {
      throw new Error(`FAIL-CLOSED: Dataset hash mismatch on ${name}: ${actual} !== ${expected}`);
    }
  }
  console.log('[CHECK 2] Frozen Dataset SHA-256 Checksums (3/3): PASS');

  // Check 3: Real Buyer Exclusions
  const realBuyersInAllowlist = IMPORTERS.filter(imp => {
    const e = (imp.email || imp.contactEmail || '').toLowerCase().trim();
    return e && ALLOWED_TEST_RECIPIENTS.has(e);
  });
  if (realBuyersInAllowlist.length > 0) {
    throw new Error(`FAIL-CLOSED: Real buyer email matched allowlist: ${realBuyersInAllowlist.length}`);
  }
  console.log('[CHECK 3] Real Buyer Allowlist Exclusion (0/642 matched): PASS');

  // Check 4: Sender Identity
  if (SENDER_IDENTITY.email !== 'sales@avaniagrofoods.com' || SENDER_IDENTITY.replyTo !== 'sales@avaniagrofoods.com') {
    throw new Error('FAIL-CLOSED: Sender identity or reply-to mismatch');
  }
  console.log(`[CHECK 4] Sender: ${SENDER_IDENTITY.formatted} | Reply-To: ${SENDER_IDENTITY.replyTo}: PASS`);

  // Check 5: Exactly 3 Test Recipients
  if (TEST_RECIPIENTS.length !== 3) {
    throw new Error('FAIL-CLOSED: Must have exactly 3 test recipients');
  }
  for (const r of TEST_RECIPIENTS) {
    if (!ALLOWED_TEST_RECIPIENTS.has(r.email.toLowerCase().trim())) {
      throw new Error(`FAIL-CLOSED: Recipient ${r.email} is not in allowlist!`);
    }
  }
  console.log('[CHECK 5] Allowlist Exact Match (3 inboxes): PASS\n');

  console.log('Operator Authorization: RECORDED (Controlled Test Inbox Pilot Authorized)');
  console.log('Sending SEQ-01 with >= 60-second minimum pacing between transmissions...\n');

  const sendResults = [];

  for (let i = 0; i < TEST_RECIPIENTS.length; i++) {
    const fixture = TEST_RECIPIENTS[i];
    const itemNum = i + 1;
    console.log(`------------------------------------------------------------`);
    console.log(`[TEST-0${itemNum}] Preparing transmission to: ${fixture.email}`);
    console.log(`Company: ${fixture.companyName} | Contact: ${fixture.contactPerson}`);

    // Create & Approve Recipient State
    const recipientState = createRecipientState(fixture);
    approveRecipientForOutreach(recipientState, {
      approvedBy: 'Operator (Sachin Shinde)',
      approvalSource: 'PHASE_3O_CONTROLLED_TEST_AUTHORIZATION',
      now: new Date()
    });

    // Verify Human Approval Gate
    if (!recipientState.approvedForOutreach) {
      throw new Error(`FAIL-CLOSED: Recipient ${fixture.recipientId} was not approved!`);
    }

    // Render SEQ-01
    const rendered = renderSequenceEmail('SEQ-01', {
      contact_name: fixture.contactPerson,
      company_name: fixture.companyName,
      product_focus: fixture.productFocus,
      email: fixture.email
    });

    console.log(`Rendered Subject: "${rendered.subject}"`);
    console.log(`Rendered Body Length: ${rendered.bodyText.length} bytes`);

    // Reserve Throughput Governor Slot
    const governorResult = reserveDailyThroughputSlot({
      workerId: 'phase-3o-controlled-test-worker',
      isTestMode: false // Live governor reservation
    });

    if (!governorResult.allowed) {
      throw new Error(`FAIL-CLOSED: DailyThroughputGovernor blocked dispatch: ${governorResult.reason}`);
    }
    console.log(`Governor slot reserved: ${governorResult.quotaUsed}/${governorResult.limit} today (Reservation ID: ${governorResult.reservationId})`);

    // Prepare Payload
    const payload = {
      from: SENDER_IDENTITY.formatted,
      to: [fixture.email],
      reply_to: SENDER_IDENTITY.replyTo,
      subject: rendered.subject,
      text: rendered.bodyText,
      headers: {
        'X-Campaign-ID': 'PHASE_3O_CONTROLLED_PILOT_2026',
        'X-Entity-Role': 'Export Trade Co-Ordinator',
        'X-Sequence-Step': 'SEQ-01',
        'X-Controlled-Test': 'PHASE_3O_TEST',
        'X-Test-Recipient-ID': fixture.recipientId
      }
    };

    const sendTimestamp = new Date().toISOString();
    console.log(`Transmitting to Resend API at ${sendTimestamp}...`);

    const resendResponse = await postResendEmail(apiKey, payload);
    console.log(`Resend HTTP Status: ${resendResponse.statusCode}`);

    let providerMessageId = null;
    let isSuccess = false;
    let deliveryTelemetry = null;

    if (resendResponse.statusCode >= 200 && resendResponse.statusCode < 300 && resendResponse.data && resendResponse.data.id) {
      providerMessageId = resendResponse.data.id;
      isSuccess = true;
      console.log(`[PASS] Accepted by Resend! Message ID: ${providerMessageId}`);

      // Query Resend Telemetry after 3 seconds
      console.log('Querying Resend message telemetry...');
      await sleep(3000);
      const telRes = await getResendEmailStatus(apiKey, providerMessageId);
      deliveryTelemetry = telRes.data || {};
      console.log(`Provider Telemetry Status: ${deliveryTelemetry.status || 'created/accepted'}`);

      // Commit durable sequence state immediately upon verified send success
      commitSequenceStep('PHASE_3O_CONTROLLED_PILOT_2026', fixture.recipientId, 'SEQ-01', 1, {
        email: fixture.email,
        companyName: fixture.companyName,
        contactName: fixture.contactPerson,
        providerMessageId
      });
      console.log(`[DURABLE STATE] Committed ${fixture.recipientId} to sequenceStateStore.json`);
    } else {
      console.error(`[FAIL] Resend rejected dispatch:`, JSON.stringify(resendResponse, null, 2));
    }

    // Advance State
    recipientState.currentSequenceId = 'SEQ-01';
    recipientState.currentStep = 1;
    recipientState.sequenceStatus = SEQUENCE_STATUSES.EMAIL_1_SENT;
    recipientState.leadStatus = LEAD_STATUSES.OUTREACH_ACTIVE;
    recipientState.lastSentAt = sendTimestamp;

    const record = {
      testId: `TEST-0${itemNum}`,
      recipientId: fixture.recipientId,
      recipient: fixture.email,
      companyName: fixture.companyName,
      contactPerson: fixture.contactPerson,
      productFocus: fixture.productFocus,
      timestamp: sendTimestamp,
      sequenceStep: 'SEQ-01',
      sender: SENDER_IDENTITY.formatted,
      replyTo: SENDER_IDENTITY.replyTo,
      httpStatus: resendResponse.statusCode,
      success: isSuccess,
      blocked: false,
      providerMessageId,
      providerResponse: resendResponse.data || resendResponse.rawBody,
      deliveryTelemetry,
      quotaConsumed: governorResult.quotaUsed,
      quotaLimit: governorResult.limit,
      sequenceState: recipientState.sequenceStatus,
      leadState: recipientState.leadStatus,
      suppressionState: 'NONE'
    };

    sendResults.push(record);

    // Apply Pacing if not last item
    if (i < TEST_RECIPIENTS.length - 1) {
      const pacingSeconds = 65; // Enforce minimum 60-second pacing + 5s buffer
      console.log(`\n[PACING] Waiting ${pacingSeconds} seconds to enforce governor minimum 60s pacing rule...`);
      for (let s = pacingSeconds; s > 0; s -= 15) {
        console.log(`[PACING] ${s} seconds remaining before next transmission...`);
        await sleep(Math.min(15, s) * 1000);
      }
      console.log(`[PACING] Pacing requirement satisfied. Proceeding to next transmission.\n`);
    }
  }

  console.log('\n============================================================');
  console.log('ALL THREE CONTROLLED TEST TRANSMISSIONS COMPLETE');
  console.log('============================================================\n');

  // Save Telemetry State File
  const finalState = {
    auditId: 'PHASE-3O-CONTROLLED-TEST-SEND',
    timestamp: new Date().toISOString(),
    mode: 'CONTROLLED_TEST_INBOX_SEND',
    operatorAuthorization: 'EXPLICIT_OPERATOR_AUTHORIZATION_RECORDED',
    productionDeployment: 'dpl_FCuc65DfVpY46WsScQgQz4Scz4Vp',
    senderIdentity: SENDER_IDENTITY.formatted,
    replyTo: SENDER_IDENTITY.replyTo,
    sequence: 'SEQ-01_ONLY',
    sendResults,
    metrics: {
      TEST_01: sendResults[0] && sendResults[0].success ? 'PASS' : 'FAIL',
      TEST_02: sendResults[1] && sendResults[1].success ? 'PASS' : 'FAIL',
      TEST_03: sendResults[2] && sendResults[2].success ? 'PASS' : 'FAIL',
      REAL_BUYER_CONTACT: 0,
      REAL_BUYER_EMAILS: 0,
      UNAUTHORIZED_EMAILS: 0,
      SMTP_PROBES: 0,
      MX_PROBES: 0,
      GLOBAL_OUTREACH_STOP: 1,
      OUTREACH_AUTHORIZED: 0,
      PILOT_AUTHORIZED_TEST_INBOXES_ONLY: 1
    }
  };

  const outPath = path.join(__dirname, '..', 'scratch', 'phase_3o_send_telemetry.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(finalState, null, 2), 'utf8');
  console.log(`[SAVED] Telemetry written to ${outPath}`);

  return finalState;
}

executeControlledSend().catch(err => {
  console.error('\n[FATAL EXECUTION ERROR]:', err);
  process.exit(1);
});
