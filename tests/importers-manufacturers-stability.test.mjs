import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { IMPORTERS } from '../api/_data/importersData.js';
import { MANUFACTURERS } from '../api/_data/manufacturersData.js';
import {
  normalizeImporterWithVerification,
  getVerificationDashboardMetrics
} from '../api/_lib/importerVerificationModel.js';
import importersHandler from '../api/importers.js';
import manufacturersHandler from '../api/manufacturers.js';
import {
  isValidOptionalEmail,
  isValidOptionalPhone,
  csvCell,
  buildUtf8Csv,
  validateVerificationTransition,
  clampPage
} from '../src/lib/directoryUtils.js';

function createMockRes() {
  const headers = {};
  let statusCode = 200;
  let body = null;
  return {
    setHeader(k, v) { headers[k] = v; },
    status(code) { statusCode = code; return this; },
    json(payload) { body = payload; return this; },
    get result() { return { statusCode, headers, body }; }
  };
}

test('1. Importers dataset & dashboard metrics reconciliation (642 records, 0 outreach ready)', () => {
  assert.equal(IMPORTERS.length, 642);
  const normalized = IMPORTERS.map(normalizeImporterWithVerification);
  const metrics = getVerificationDashboardMetrics(normalized);

  assert.equal(metrics.totalRecords, 642);
  assert.equal(metrics.outreachReady, 0);
  assert.equal(metrics.outreachNotReady, 642);
  assert.equal(metrics.verificationQueueCount, 642);
  assert.equal(metrics.companyUnverified, 379);
  assert.equal(metrics.companyVerified, 22);
  assert.equal(metrics.domainAssociated, 241);
  assert.equal(metrics.companyVerified + metrics.domainAssociated + metrics.companyUnverified, 642);
  assert.equal(metrics.requiredCountriesCoverage, '21/21');
  assert.equal(new Set(normalized.map(i => i.id)).size, 642);
});

test('2. Manufacturers dataset & location reconciliation (126 real records, 0 headers, 4 MP, 5 unverified locations)', () => {
  const all = [...MANUFACTURERS.small, ...MANUFACTURERS.medium, ...MANUFACTURERS.large];
  assert.equal(MANUFACTURERS.small.length, 35);
  assert.equal(MANUFACTURERS.medium.length, 67);
  assert.equal(MANUFACTURERS.large.length, 24);
  assert.equal(all.length, 126);

  assert.equal(all.filter(m => /📍|Stronghold|Emerging/i.test(m.name || '')).length, 0);
  assert.equal(all.filter(m => m.state !== 'Gujarat' && (m.location || '').includes('Gujarat')).length, 0);
  assert.equal(all.filter(m => m.state === 'MP').length, 0);
  assert.equal(all.filter(m => m.state === 'Madhya Pradesh').length, 4);
  assert.equal(all.filter(m => m.location === 'Location not verified' && m.state === 'Unverified').length, 5);
  assert.equal(all.filter(m => m.verificationStatus === 'UNVERIFIED').length, 126);
});

test('3. API security: unauthorized GET blocked (401/503), POST rejected (405), bad origin blocked (403)', async () => {
  const resImpOrigin = createMockRes();
  await importersHandler({ method: 'GET', headers: { origin: 'https://evil.example.com' } }, resImpOrigin);
  assert.equal(resImpOrigin.result.statusCode, 403);

  const resMfrOrigin = createMockRes();
  await manufacturersHandler({ method: 'GET', headers: { origin: 'https://evil.example.com' } }, resMfrOrigin);
  assert.equal(resMfrOrigin.result.statusCode, 403);

  const resImpPost = createMockRes();
  await importersHandler({ method: 'POST', headers: { origin: 'https://www.avaniagrofoods.com' } }, resImpPost);
  assert.equal(resImpPost.result.statusCode, 405);

  const resMfrPost = createMockRes();
  await manufacturersHandler({ method: 'POST', headers: { origin: 'https://www.avaniagrofoods.com' } }, resMfrPost);
  assert.equal(resMfrPost.result.statusCode, 405);

  const resImpUnauth = createMockRes();
  await importersHandler({ method: 'GET', headers: { origin: 'https://www.avaniagrofoods.com' } }, resImpUnauth);
  assert.ok([401, 503].includes(resImpUnauth.result.statusCode));

  const resMfrUnauth = createMockRes();
  await manufacturersHandler({ method: 'GET', headers: { origin: 'https://www.avaniagrofoods.com' } }, resMfrUnauth);
  assert.ok([401, 503].includes(resMfrUnauth.result.statusCode));
});

test('4. Form validation: email & phone format validation', () => {
  assert.equal(isValidOptionalEmail(''), true);
  assert.equal(isValidOptionalEmail('Not Available'), true);
  assert.equal(isValidOptionalEmail('buyer@company.com'), true);
  assert.equal(isValidOptionalEmail('not-an-email'), false);
  assert.equal(isValidOptionalEmail('bad@domain'), false);

  assert.equal(isValidOptionalPhone(''), true);
  assert.equal(isValidOptionalPhone('Not Available'), true);
  assert.equal(isValidOptionalPhone('+91 94208 23237'), true);
  assert.equal(isValidOptionalPhone('12345'), false);
});

test('5. Verification workflow: blocks status upgrade without documentary evidence', () => {
  const blocked = validateVerificationTransition('UNVERIFIED', 'VERIFIED', '');
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.error.includes('Documentary evidence'));

  const allowedWithEvidence = validateVerificationTransition('UNVERIFIED', 'UNDER_REVIEW', 'Batch COA #2026-01 verified via email');
  assert.equal(allowedWithEvidence.allowed, true);

  const downgradeAllowed = validateVerificationTransition('UNDER_REVIEW', 'UNVERIFIED', '');
  assert.equal(downgradeAllowed.allowed, true);
});

test('6. CSV export security: UTF-8 BOM, RFC4180 quoting & formula-injection neutralization', () => {
  assert.equal(csvCell('=CMD("calc")'), `"'=CMD(""calc"")"`);
  assert.equal(csvCell('+1234'), `"'` + `+1234"`);
  assert.equal(csvCell('-SUM(A1:A2)'), `"'-SUM(A1:A2)"`);
  assert.equal(csvCell('@HYPERLINK("x")'), `"'@HYPERLINK(""x"")"`);
  assert.equal(csvCell('Safe, "Quoted" Co.'), `"Safe, ""Quoted"" Co."`);

  const csv = buildUtf8Csv(['ID', 'Name'], [['1', csvCell('=HYPERLINK("bad")')]]);
  assert.equal(csv.charCodeAt(0), 0xFEFF);
  assert.ok(csv.includes(`"'=HYPERLINK(""bad"")"`));
});

test('7. Pagination clamping prevents empty out-of-range pages when filters shrink results', () => {
  assert.deepEqual(clampPage(10, 5, 12), { totalPages: 1, safePage: 1 });
  assert.deepEqual(clampPage(0, 50, 12), { totalPages: 5, safePage: 1 });
  assert.deepEqual(clampPage(3, 50, 12), { totalPages: 5, safePage: 3 });
  assert.deepEqual(clampPage(2, 0, 12), { totalPages: 1, safePage: 1 });
});

test('8. UI stability, search coverage & zero-fabrication invariants across PasswordGate, Importers, Manufacturers', () => {
  const gateSrc = fs.readFileSync(path.resolve('src/components/PasswordGate.jsx'), 'utf8');
  const impSrc = fs.readFileSync(path.resolve('src/pages/Importers.jsx'), 'utf8');
  const mfrSrc = fs.readFileSync(path.resolve('src/pages/Manufacturers.jsx'), 'utf8');

  assert.ok(!gateSrc.includes('}, [onUnlock])'), 'PasswordGate infinite loop dependency must remain removed');
  assert.ok(gateSrc.includes('onUnlockRef'), 'PasswordGate must stabilize onUnlock via ref');
  assert.ok(gateSrc.includes('AbortController'), 'PasswordGate must abort pending auth check on unmount');

  // Race-condition protection in both pages
  assert.ok(impSrc.includes('AbortController') && impSrc.includes('requestIdRef') && impSrc.includes('useCallback'));
  assert.ok(mfrSrc.includes('AbortController') && mfrSrc.includes('requestIdRef') && mfrSrc.includes('useCallback'));

  // Search coverage
  assert.ok(impSrc.includes('item.website?.toLowerCase().includes(q)') && impSrc.includes('item.domain?.toLowerCase().includes(q)'));
  assert.ok(mfrSrc.includes('item.facilityName?.toLowerCase().includes(q)') && mfrSrc.includes('item.phone?.toLowerCase().includes(q)'));

  // Zero fabricated VERIFIED defaults
  assert.ok(!impSrc.includes("|| 'VERIFIED'"));
  assert.ok(!impSrc.includes("verificationStatus: 'VERIFIED'"));
  assert.ok(!mfrSrc.includes("|| 'VERIFIED'"));
  assert.ok(!mfrSrc.includes("verificationStatus: 'VERIFIED'"));
});
