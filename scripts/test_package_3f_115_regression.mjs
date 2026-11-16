// ============================================================
// PACKAGE 3F.115 — MASTER ECOSYSTEM RECOVERY, CONCURRENCY & INTEGRATION TESTS
// scripts/test_package_3f_115_regression.mjs
// Covers:
// - Distributed KV Lua atomic CAS, release, renewal, and leaseGeneration fencing (FIND-111-03 / OPT-ARCH-01)
// - Concurrent adversarial worker race (10 simultaneous workers racing on 1 webhook event)
// - Lease expiry & reclaim rejection (LEASE_EXPIRED_OR_MISSING, WORKER_OWNERSHIP_MISMATCH, LEASE_TOKEN_MISMATCH)
// - Admin Quotations automatic Compare-And-Delete lease release on DB failure
// - email-reply-webhook.js quotation delivery sync bridge to Supabase
// - Reply intent classification (UNSUBSCRIBE, OBJECTION, NEGATIVE_RESPONSE, INVALID_ADDRESS)
// - SEQ-01..SEQ-05 compliant positioning & safety gates
// - 13-Stage workflow, A/B/C grading, HMAC Ecosystem Bridge, and Unified Operations telemetry
// ============================================================

import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const isolatedTmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'avani-3f115-'));
const isolatedStorePath = path.join(isolatedTmpDir, 'seq_store.json');
fs.writeFileSync(isolatedStorePath, JSON.stringify({
  sequences: {},
  idempotencyKeys: {},
  reservations: {},
  processedEvents: {},
  auditLog: []
}), 'utf8');

process.env.NODE_ENV = 'test';
process.env.SEQUENCE_TEST_ISOLATION = '1';
process.env.SEQUENCE_STORE_PATH = isolatedStorePath;
process.env.SESSION_SECRET = 'avani-3f115-test-session-secret-min-32-characters-long';
process.env.MASTER_GATE_PASSWORD = 'CorrectMasterGatePassword2026!';
process.env.RESEND_WEBHOOK_SECRET = 'whsec_MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE';
process.env.ECOSYSTEM_SYNC_SECRET = 'avani-3f115-ecosystem-hmac-secret-32chars';

const {
  claimQuotationWebhookDistributed,
  completeQuotationWebhookDistributed,
  releaseQuotationWebhookDistributed,
  renewQuotationWebhookLeaseDistributed,
  processDeliveryWebhookAsync,
  _testExpireLocalWebhookClaim
} = await import('../api/_lib/quotationModel.js');
const {
  REQUIRED_POSITIONING_STATEMENT,
  EMAIL_SEQUENCES,
  renderSequenceEmail
} = await import('../api/_lib/emailSequences.js');
const { classifyReplyIntent } = await import('../api/_lib/replyDetector.js');
const {
  WORKFLOW_STAGES_13,
  classifyLeadAndMarket,
  evaluateOutreachReadinessGate,
  createSignedEcosystemEvent,
  verifySignedEcosystemEvent,
  getUnifiedEcosystemOperationsView
} = await import('../api/_lib/ecosystemIntegration.js');
const { default: adminQuotationsHandler } = await import('../api/admin-quotations.js');
const { default: emailReplyWebhookHandler } = await import('../api/email-reply-webhook.js');
const { createServerSession, _testResetAuthState } = await import('../api/_lib/auth.js');

const results = [];

async function runTest(id, name, fn) {
  try {
    await fn();
    results.push({ id, name, passed: true });
    console.log(`✅ [PASS] ${id}: ${name}`);
  } catch (err) {
    results.push({ id, name, passed: false, error: err?.message || String(err) });
    console.error(`❌ [FAIL] ${id}: ${name} -> ${err?.stack || err?.message}`);
  }
}

function createMockReqRes({
  method = 'GET',
  url = '/api/admin-quotations',
  headers = {},
  query = {},
  body = {},
  rawBody = undefined
} = {}) {
  const resHeaders = {};
  const normalizedHeaders = {};
  for (const [k, v] of Object.entries(headers)) {
    normalizedHeaders[k.toLowerCase()] = v;
  }
  const req = {
    method,
    url,
    query,
    headers: normalizedHeaders,
    body,
    rawBody,
    socket: { remoteAddress: '198.51.100.44' }
  };
  const res = {
    statusCode: 200,
    headers: resHeaders,
    body: null,
    setHeader(k, v) { resHeaders[k.toLowerCase()] = v; return this; },
    getHeader(k) { return resHeaders[k.toLowerCase()]; },
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; },
    send(data) { this.body = data; return this; },
    end(data) { if (data !== undefined) this.body = data; return this; }
  };
  return { req, res };
}

function signSvix(eventId, payloadObj) {
  const rawKey = Buffer.from('MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE', 'base64');
  const rawBody = JSON.stringify(payloadObj);
  const ts = String(Math.floor(Date.now() / 1000));
  const sig = crypto
    .createHmac('sha256', rawKey)
    .update(`${eventId}.${ts}.${rawBody}`, 'utf8')
    .digest('base64');
  return {
    rawBody,
    headers: {
      'svix-id': eventId,
      'svix-timestamp': ts,
      'svix-signature': `v1,${sig}`,
      'content-type': 'application/json'
    }
  };
}

// ── 1. DISTRIBUTED LEASE FENCING & REDIS LUA ATOMIC CAS ────────

await runTest('T-115-01', 'Claim generates unique leaseToken and monotonically increments leaseGeneration', async () => {
  const evtId = `evt_fencing_${Date.now()}_01`;
  const claim1 = await claimQuotationWebhookDistributed(evtId, 'worker-A', 60);
  assert.equal(claim1.claimed, true);
  assert.ok(claim1.leaseToken && claim1.leaseToken.length >= 16);
  assert.equal(claim1.leaseGeneration, 1);

  _testExpireLocalWebhookClaim(evtId);
  const claim2 = await claimQuotationWebhookDistributed(evtId, 'worker-B', 60);
  assert.equal(claim2.claimed, true);
  assert.equal(claim2.leaseGeneration, 2);
  assert.notEqual(claim2.leaseToken, claim1.leaseToken);
});

await runTest('T-115-02', 'Expired worker cannot complete missing/expired lease when workerId is supplied', async () => {
  const evtId = `evt_exp_${Date.now()}_02`;
  const claim = await claimQuotationWebhookDistributed(evtId, 'worker-stale', 1);
  assert.equal(claim.claimed, true);

  _testExpireLocalWebhookClaim(evtId);
  const completion = await completeQuotationWebhookDistributed(evtId, { type: 'email.delivered' }, 604800, 'worker-stale', claim.leaseToken);
  assert.equal(completion.completed, false);
  assert.equal(completion.reason, 'LEASE_EXPIRED_OR_MISSING');
});

await runTest('T-115-03', 'Stale worker presenting old leaseToken after reclaim is rejected with WORKER_OWNERSHIP_MISMATCH', async () => {
  const evtId = `evt_reclaim_${Date.now()}_03`;
  const claimA = await claimQuotationWebhookDistributed(evtId, 'worker-A', 1);
  _testExpireLocalWebhookClaim(evtId);

  const claimB = await claimQuotationWebhookDistributed(evtId, 'worker-B', 60);
  assert.equal(claimB.claimed, true);

  const staleComplete = await completeQuotationWebhookDistributed(evtId, {}, 604800, 'worker-A', claimA.leaseToken);
  assert.equal(staleComplete.completed, false);
  assert.equal(staleComplete.reason, 'WORKER_OWNERSHIP_MISMATCH');

  const wrongToken = await completeQuotationWebhookDistributed(evtId, {}, 604800, 'worker-B', claimA.leaseToken);
  assert.equal(wrongToken.completed, false);
  assert.equal(wrongToken.reason, 'LEASE_TOKEN_MISMATCH');

  const validComplete = await completeQuotationWebhookDistributed(evtId, { ok: true }, 604800, 'worker-B', claimB.leaseToken);
  assert.equal(validComplete.completed, true);
});

await runTest('T-115-04', 'Atomic lease renewal and compare-and-delete release reject unauthorized workers', async () => {
  const evtId = `evt_renew_${Date.now()}_04`;
  const claim = await claimQuotationWebhookDistributed(evtId, 'worker-owner', 30);

  const badRenew = await renewQuotationWebhookLeaseDistributed(evtId, 'worker-intruder', 60, claim.leaseToken);
  assert.equal(badRenew.renewed, false);
  assert.equal(badRenew.reason, 'WORKER_OWNERSHIP_MISMATCH');

  const goodRenew = await renewQuotationWebhookLeaseDistributed(evtId, 'worker-owner', 90, claim.leaseToken);
  assert.equal(goodRenew.renewed, true);

  const badRelease = await releaseQuotationWebhookDistributed(evtId, 'worker-owner', 'wrong-token');
  assert.equal(badRelease.released, false);
  assert.equal(badRelease.reason, 'LEASE_TOKEN_MISMATCH');

  const goodRelease = await releaseQuotationWebhookDistributed(evtId, 'worker-owner', claim.leaseToken);
  assert.equal(goodRelease.released, true);

  // Subsequent reclaim now succeeds cleanly
  const nextClaim = await claimQuotationWebhookDistributed(evtId, 'worker-retry', 60);
  assert.equal(nextClaim.claimed, true);
});

await runTest('T-115-05', 'Concurrent adversarial race: 10 simultaneous workers -> strictly 1 acquires lease', async () => {
  const evtId = `evt_race_${Date.now()}_05`;
  const outcomes = await Promise.all(
    Array.from({ length: 10 }, (_, idx) =>
      claimQuotationWebhookDistributed(evtId, `race-worker-${idx}`, 60)
    )
  );
  const winners = outcomes.filter((o) => o.claimed === true);
  const losers = outcomes.filter((o) => o.duplicate === true);
  assert.equal(winners.length, 1, 'Exactly one concurrent worker may acquire the lease');
  assert.equal(losers.length, 9, 'Remaining nine concurrent workers must see duplicate IN_FLIGHT');
});

await runTest('T-115-06', 'Upstash Redis REST Lua EVAL atomic completion & release against simulated KV server', async () => {
  const origFetch = globalThis.fetch;
  const kvStore = new Map();
  let luaCompleteCalled = false;
  let luaReleaseCalled = false;

  process.env.KV_REST_API_URL = 'https://mock-upstash.upstash.io';
  process.env.KV_REST_API_TOKEN = 'mock-upstash-token-32-chars-minimum';

  globalThis.fetch = async (url, init) => {
    const body = JSON.parse(init.body);
    const cmd = String(body[0]).toUpperCase();
    let result = null;

    if (cmd === 'INCR') {
      const next = (Number(kvStore.get(body[1]) || 0)) + 1;
      kvStore.set(body[1], String(next));
      result = next;
    } else if (cmd === 'EXPIRE') {
      result = kvStore.has(body[1]) ? 1 : 0;
    } else if (cmd === 'SET') {
      const isNx = body.includes('NX');
      if (isNx && kvStore.has(body[1])) {
        result = null;
      } else {
        kvStore.set(body[1], body[2]);
        result = 'OK';
      }
    } else if (cmd === 'GET') {
      result = kvStore.get(body[1]) || null;
    } else if (cmd === 'EVAL') {
      const script = String(body[1]);
      const key = body[3];
      const reqWorker = body[4];
      const reqToken = body[5];
      const currentRaw = kvStore.get(key);

      if (script.includes('KEYS[1], newPayload')) {
        luaCompleteCalled = true;
        if (!currentRaw) {
          result = [0, 'LEASE_EXPIRED_OR_MISSING'];
        } else {
          const cur = JSON.parse(currentRaw);
          if (cur.workerId !== reqWorker) result = [0, 'WORKER_OWNERSHIP_MISMATCH', cur.workerId];
          else if (reqToken && cur.leaseToken !== reqToken) result = [0, 'LEASE_TOKEN_MISMATCH'];
          else {
            kvStore.set(key, body[6]);
            result = [1, 'COMPLETED'];
          }
        }
      } else if (script.includes('redis.call("DEL", KEYS[1])')) {
        luaReleaseCalled = true;
        if (!currentRaw) result = [0, 'LEASE_NOT_FOUND'];
        else {
          const cur = JSON.parse(currentRaw);
          if (cur.workerId !== reqWorker) result = [0, 'WORKER_OWNERSHIP_MISMATCH'];
          else if (reqToken && cur.leaseToken !== reqToken) result = [0, 'LEASE_TOKEN_MISMATCH'];
          else {
            kvStore.delete(key);
            result = [1, 'RELEASED'];
          }
        }
      }
    }

    return new Response(JSON.stringify({ result }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  };

  try {
    const evtId = `evt_lua_${Date.now()}_06`;
    const claim = await claimQuotationWebhookDistributed(evtId, 'lua-worker-1', 60);
    assert.equal(claim.storage, 'distributed_kv');
    assert.equal(claim.leaseGeneration, 1);

    const hijack = await completeQuotationWebhookDistributed(evtId, {}, 604800, 'lua-attacker', claim.leaseToken);
    assert.equal(hijack.completed, false);
    assert.equal(hijack.atomicLua, true);
    assert.equal(hijack.reason, 'WORKER_OWNERSHIP_MISMATCH');

    const comp = await completeQuotationWebhookDistributed(evtId, { delivered: true }, 604800, 'lua-worker-1', claim.leaseToken);
    assert.equal(comp.completed, true);
    assert.equal(comp.atomicLua, true);
    assert.equal(luaCompleteCalled, true);

    const evtRel = `evt_lua_rel_${Date.now()}`;
    const claimRel = await claimQuotationWebhookDistributed(evtRel, 'lua-worker-2', 60);
    const rel = await releaseQuotationWebhookDistributed(evtRel, 'lua-worker-2', claimRel.leaseToken);
    assert.equal(rel.released, true);
    assert.equal(luaReleaseCalled, true);
  } finally {
    globalThis.fetch = origFetch;
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
  }
});

// ── 2. WEBHOOK DB FAILURE AUTO-RELEASE & RESEND DELIVERY BRIDGE ──

await runTest('T-115-07', 'admin-quotations delivery-webhook releases lease on Supabase DB failure so immediate retry succeeds', async () => {
  const origFetch = globalThis.fetch;
  process.env.SUPABASE_URL = 'https://mock-project.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-service-role-key-secret';

  let supaAttempt = 0;
  globalThis.fetch = async (url, init) => {
    const u = String(url);
    if (u.includes('mock-project.supabase.co')) {
      supaAttempt++;
      if (supaAttempt <= 3) {
        return new Response('Internal Server Error', { status: 500 });
      }
      if ((init?.method || 'GET') === 'GET') {
        return new Response(JSON.stringify([{
          quotation_id: 'AAF-Q-2026-8801',
          status: 'SENT_TO_BUYER',
          delivery_status: 'sent',
          provider_message_id: 'msg_retry_bridge_8801'
        }]), { status: 200, headers: { 'content-type': 'application/json' } });
      }
      return new Response(JSON.stringify([{
        quotation_id: 'AAF-Q-2026-8801',
        status: 'DELIVERED',
        delivery_status: 'delivered'
      }]), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    return origFetch(url, init);
  };

  try {
    const evtId = `evt_dbretry_${Date.now()}_07`;
    const payload = { id: evtId, type: 'email.delivered', data: { email_id: 'msg_retry_bridge_8801' } };
    const signed1 = signSvix(evtId, payload);
    const r1 = createMockReqRes({
      method: 'POST',
      url: '/api/admin-quotations?action=delivery-webhook',
      headers: signed1.headers,
      body: payload,
      rawBody: signed1.rawBody
    });
    await adminQuotationsHandler(r1.req, r1.res);
    assert.equal(r1.res.statusCode, 503, 'DB failure must fail closed with HTTP 503');
    assert.equal(r1.res.body?.code, 'DATABASE_UNAVAILABLE');

    // Immediate retry should acquire freed lease and return 200 (not 429 IN_FLIGHT!)
    const signed2 = signSvix(evtId, payload);
    const r2 = createMockReqRes({
      method: 'POST',
      url: '/api/admin-quotations?action=delivery-webhook',
      headers: signed2.headers,
      body: payload,
      rawBody: signed2.rawBody
    });
    await adminQuotationsHandler(r2.req, r2.res);
    assert.equal(r2.res.statusCode, 200, 'Released lease must allow retry without 429 block');
    assert.equal(r2.res.body?.success, true);
  } finally {
    globalThis.fetch = origFetch;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  }
});

await runTest('T-115-08', 'email-reply-webhook.js syncs quotation delivery status in Supabase for Resend email.bounced webhook', async () => {
  const origFetch = globalThis.fetch;
  process.env.SUPABASE_URL = 'https://mock-project.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-service-role-key-secret';
  let patchPayload = null;

  globalThis.fetch = async (url, init) => {
    const u = String(url);
    if (u.includes('mock-project.supabase.co')) {
      if ((init?.method || 'GET') === 'GET') {
        return new Response(JSON.stringify([{
          quotation_id: 'AAF-Q-2026-9902',
          status: 'SENT_TO_BUYER',
          delivery_status: 'sent',
          provider_message_id: 'msg_bounce_bridge_9902'
        }]), { status: 200, headers: { 'content-type': 'application/json' } });
      }
      if (u.includes('/rest/v1/quotations') && init?.method === 'PATCH') {
        patchPayload = JSON.parse(init.body);
      }
      return new Response(JSON.stringify([JSON.parse(init.body)]), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    return origFetch(url, init);
  };

  try {
    const evtId = `evt_bridge_bounce_${Date.now()}`;
    const payload = {
      id: evtId,
      type: 'email.bounced',
      data: { email_id: 'msg_bounce_bridge_9902', email: 'bounced@example.com' }
    };
    const signed = signSvix(evtId, payload);
    const { req, res } = createMockReqRes({
      method: 'POST',
      url: '/api/email-reply-webhook',
      headers: signed.headers,
      body: payload,
      rawBody: signed.rawBody
    });
    await emailReplyWebhookHandler(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body?.action, 'BOUNCE_ACKNOWLEDGED');
    assert.ok(patchPayload, 'Must patch matching quotation record in Supabase');
    assert.equal(patchPayload.status, 'SEND_FAILED');
    assert.equal(patchPayload.delivery_status, 'bounced');
  } finally {
    globalThis.fetch = origFetch;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  }
});

// ── 3. OUTREACH COMPLIANCE, REPLY INTENT & ECOSYSTEM INTEGRATION ──

await runTest('T-115-09', 'SEQ-01 through SEQ-05 include exact compliant positioning statement and zero manufacturer claims', async () => {
  assert.deepEqual(Object.keys(EMAIL_SEQUENCES), ['SEQ-01', 'SEQ-02', 'SEQ-03', 'SEQ-04', 'SEQ-05']);
  for (const seqId of Object.keys(EMAIL_SEQUENCES)) {
    const rendered = renderSequenceEmail(seqId, {
      contact_name: 'Elena',
      company_name: 'Pacific Herbals Inc',
      product_focus: 'Moringa Powder'
    });
    assert.ok(rendered.bodyText.includes(REQUIRED_POSITIONING_STATEMENT), `${seqId} must contain exact required positioning statement`);
    assert.doesNotMatch(rendered.bodyText, /\bwe are the manufacturer\b/i);
  }
});

await runTest('T-115-10', 'classifyReplyIntent accurately distinguishes UNSUBSCRIBE, OBJECTION, NEGATIVE_RESPONSE, INVALID_ADDRESS', async () => {
  assert.equal(classifyReplyIntent('Please unsubscribe me from this list'), 'UNSUBSCRIBE');
  assert.equal(classifyReplyIntent('Your price too high for us right now'), 'OBJECTION');
  assert.equal(classifyReplyIntent('We already have a supplier, no thanks'), 'NEGATIVE_RESPONSE');
  assert.equal(classifyReplyIntent('550 5.1.1 user unknown mailbox unavailable'), 'INVALID_ADDRESS');
  assert.equal(classifyReplyIntent('Please share 25kg FOB Nhava Sheva quote'), 'INQUIRY_REPLY');
});

await runTest('T-115-11', 'evaluateOutreachReadinessGate enforces provenance, business domain, circuit breakers, and kill switch', async () => {
  const validContact = {
    email: 'buying@eurospice.de',
    company: 'EuroSpice GmbH',
    country: 'Germany',
    quantityKg: 1000,
    sourceUrl: 'https://eurospice.de/contact'
  };

  // Locked by default (GLOBAL_OUTREACH_STOP=1)
  const locked = evaluateOutreachReadinessGate(validContact, {
    env: { GLOBAL_OUTREACH_STOP: '1', OUTREACH_AUTHORIZED: '1' }
  });
  assert.equal(locked.eligible, false);
  assert.ok(locked.issues.includes('GLOBAL_OUTREACH_STOP_ENGAGED'));

  // Missing provenance blocked even when authorized
  const noProv = evaluateOutreachReadinessGate(
    { ...validContact, sourceUrl: '' },
    { env: { GLOBAL_OUTREACH_STOP: '0', OUTREACH_AUTHORIZED: '1' } }
  );
  assert.equal(noProv.eligible, false);
  assert.ok(noProv.issues.includes('MISSING_CONTACT_PROVENANCE_URL'));

  // Bounce circuit breaker blocks when > 5%
  const highBounce = evaluateOutreachReadinessGate(validContact, {
    env: { GLOBAL_OUTREACH_STOP: '0', OUTREACH_AUTHORIZED: '1' },
    bounceRatePct: 6.5
  });
  assert.equal(highBounce.eligible, false);
  assert.ok(highBounce.issues.includes('BOUNCE_RATE_THRESHOLD_EXCEEDED'));

  // Eligible compliant contact passes when all prerequisites satisfied
  const rendered = renderSequenceEmail('SEQ-01', { company_name: 'EuroSpice GmbH' });
  const allowed = evaluateOutreachReadinessGate(validContact, {
    env: { GLOBAL_OUTREACH_STOP: '0', OUTREACH_AUTHORIZED: '1' },
    senderAuthVerified: true,
    bounceRatePct: 0.5,
    complaintRatePct: 0.0,
    renderedBody: rendered.bodyText
  });
  assert.equal(allowed.eligible, true);
  assert.equal(allowed.classification.leadGrade, 'A');
  assert.equal(allowed.classification.marketTier, 'PRIMARY');
});

await runTest('T-115-12', '13-stage workflow, signed ecosystem event creation/verification, and unified operations view', async () => {
  assert.equal(WORKFLOW_STAGES_13.length, 13);
  assert.equal(WORKFLOW_STAGES_13[0], 'VERIFIED_PROSPECT');
  assert.equal(WORKFLOW_STAGES_13[12], 'REPEAT_BUSINESS');

  const signed = createSignedEcosystemEvent('LEAD_CAPTURED', {
    inquiryId: 'AAF-INQ-2026-11501',
    company: 'Gulf Spice Imports',
    email: 'procurement@gulfspice.ae',
    country: 'UAE',
    quantityKg: 800,
    sourceUrl: 'https://www.avaniagrofoods.com/contact'
  }, process.env.ECOSYSTEM_SYNC_SECRET);

  const checkOk = verifySignedEcosystemEvent(signed.rawBody, signed.headers, process.env.ECOSYSTEM_SYNC_SECRET);
  assert.equal(checkOk.valid, true);

  const checkTampered = verifySignedEcosystemEvent(signed.rawBody + ' ', signed.headers, process.env.ECOSYSTEM_SYNC_SECRET);
  assert.equal(checkTampered.valid, false);
  assert.equal(checkTampered.reason, 'SIGNATURE_MISMATCH');

  const cls = classifyLeadAndMarket(signed.envelope.payload);
  assert.equal(cls.leadGrade, 'A');
  assert.equal(cls.workflowStage, 'REQUIREMENT_RECEIVED');

  const ops = getUnifiedEcosystemOperationsView({ quotations: [], leads: [signed.envelope.payload] });
  assert.equal(ops.website.inquiryCount, 1);
  assert.equal(ops.sales.workflowStages.length, 13);
  assert.equal(ops.outreach.positioningCompliant, true);
});

await runTest('T-115-13', 'admin-quotations GET ?action=ecosystem-operations and POST actions enforce session + CSRF and succeed', async () => {
  _testResetAuthState();
  const session = await createServerSession('gate');
  assert.equal(session.ok, true);

  // GET unauthenticated fails closed (401)
  const unauth = createMockReqRes({
    method: 'GET',
    url: '/api/admin-quotations?action=ecosystem-operations',
    headers: { origin: 'https://www.avaniagrofoods.com' }
  });
  await adminQuotationsHandler(unauth.req, unauth.res);
  assert.equal(unauth.res.statusCode, 401);

  // GET authenticated succeeds (200)
  const getOps = createMockReqRes({
    method: 'GET',
    url: '/api/admin-quotations?action=ecosystem-operations',
    query: { action: 'ecosystem-operations' },
    headers: {
      origin: 'https://www.avaniagrofoods.com',
      cookie: `avani_gate_session=${session.token}`
    }
  });
  await adminQuotationsHandler(getOps.req, getOps.res);
  assert.equal(getOps.res.statusCode, 200);
  assert.equal(getOps.res.body?.operations?.sales?.workflowStages?.length, 13);

  // POST ecosystem-sync creates signed envelope
  const postSync = createMockReqRes({
    method: 'POST',
    url: '/api/admin-quotations',
    headers: {
      origin: 'https://www.avaniagrofoods.com',
      cookie: `avani_gate_session=${session.token}`,
      'x-csrf-token': session.csrfToken,
      'content-type': 'application/json'
    },
    body: {
      action: 'ecosystem-sync',
      eventType: 'LEAD_CAPTURED',
      payload: {
        inquiryId: 'AAF-INQ-2026-11502',
        company: 'Nordic Foods Oy',
        email: 'buy@nordicfoods.fi',
        country: 'Finland',
        quantityKg: 600,
        sourceUrl: 'https://www.avaniagrofoods.com/contact'
      }
    }
  });
  await adminQuotationsHandler(postSync.req, postSync.res);
  assert.equal(postSync.res.statusCode, 200);
  assert.equal(postSync.res.body?.signedEnvelopeCreated, true);
  assert.equal(postSync.res.body?.classification?.leadGrade, 'A');
});

const passed = results.filter((r) => r.passed).length;
const failed = results.filter((r) => !r.passed).length;
try { fs.rmSync(isolatedTmpDir, { recursive: true, force: true }); } catch {}
console.log(`\nPACKAGE 3F.115 REGRESSION SUMMARY: ${passed}/${results.length} PASSED, ${failed} FAILED`);
if (failed > 0) process.exit(1);
