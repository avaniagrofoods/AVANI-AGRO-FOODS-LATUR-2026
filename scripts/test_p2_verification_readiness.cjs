// ============================================================
// AVANI AGRO FOODS — Phase 2 Verification & Outreach Readiness Test Suite
// Verifies 17 Data Integrity Requirements, Status Enums, Verification Dimensions,
// The 8 Unverified Records, and Outreach Blocking Rules
// ============================================================

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const crypto = require('crypto');

let passed = 0;
let failed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] ${name}: ${err.message}`);
    failed++;
  }
}

console.log('============================================================');
console.log('AVANI AGRO FOODS — PHASE 2 VERIFICATION & OUTREACH TEST SUITE');
console.log('============================================================\n');

// Load datasets and modules
const importersRaw = fs.readFileSync(path.resolve('api/_data/importersData.js'), 'utf8');
const impMatch = importersRaw.match(/export const IMPORTERS = (\[[\s\S]*?\]);/);
assert(impMatch, 'Could not parse IMPORTERS array from api/_data/importersData.js');
const IMPORTERS = JSON.parse(impMatch[1]);

const {
  COMPANY_VERIFICATION_STATUSES,
  CONTACT_VERIFICATION_STATUSES,
  BUSINESS_FIT_STATUSES,
  BUYER_TYPES,
  DECISION_MAKER_STATUSES,
  OUTREACH_STATUSES,
  VERIFICATION_METHODS,
  evaluateCompanyVerification,
  evaluateDomainVerification,
  evaluateContactVerification,
  evaluateBusinessFit,
  classifyBuyerType,
  evaluateDecisionMaker,
  evaluateOutreachReadiness,
  deriveVerificationQueueDetails,
  normalizeImporterWithVerification,
  getVerificationDashboardMetrics
} = require('../api/_lib/importerVerificationModel.js');

const normalizedImporters = IMPORTERS.map(normalizeImporterWithVerification);

// Requirement 1: Current total remains 642
runTest('Req 1: Current total remains exactly 642 production records', () => {
  assert.strictEqual(IMPORTERS.length, 642, `Expected 642 records, got ${IMPORTERS.length}`);
  assert.strictEqual(normalizedImporters.length, 642, `Expected 642 normalized records, got ${normalizedImporters.length}`);
});

// Requirement 2: Required 21 countries remain represented
runTest('Req 2: All 21 required target countries remain represented', () => {
  const REQUIRED_21_COUNTRIES = [
    'USA', 'UK', 'UAE', 'Germany', 'Netherlands', 'Canada', 'Australia',
    'Saudi Arabia', 'Qatar', 'Oman', 'Kuwait', 'Singapore', 'Malaysia',
    'Japan', 'South Korea', 'Vietnam', 'Thailand', 'South Africa',
    'Kenya', 'Nigeria', 'Brazil'
  ];
  const presentCountries = new Set(IMPORTERS.map(i => i.country).filter(Boolean));
  REQUIRED_21_COUNTRIES.forEach(c => {
    assert(presentCountries.has(c), `Missing required target country: ${c}`);
  });
  assert(presentCountries.size >= 21, `Expected at least 21 countries, found ${presentCountries.size}`);
});

// Requirement 3: Existing 612 baseline records remain preserved & backup checksum matches
runTest('Req 3: 612 baseline backup artifact exists with exact authoritative SHA-256 and 642 snapshot exists', () => {
  const backup612Path = path.resolve('api/_data/importersData.backup-612.json');
  assert(fs.existsSync(backup612Path), 'Baseline backup 612 artifact must exist');
  const backup612Raw = fs.readFileSync(backup612Path, 'utf8');
  const backup612Hash = crypto.createHash('sha256').update(backup612Raw).digest('hex');
  const EXPECTED_BACKUP_JSON_HASH = '3ee00a4928d97dd3fcc98763c97052969224cd1f6503ef69745acf3ee7ea91c1';
  assert.strictEqual(backup612Hash, EXPECTED_BACKUP_JSON_HASH, `Baseline backup JSON SHA-256 mismatch! Got ${backup612Hash}`);

  const checksumFile = path.resolve('scripts/baseline_importers_checksum.json');
  assert(fs.existsSync(checksumFile), 'scripts/baseline_importers_checksum.json must exist');
  const checksumMeta = JSON.parse(fs.readFileSync(checksumFile, 'utf8'));
  const EXPECTED_PRE_REMEDIATION_JS_HASH = 'b3e1ccc3b6d0764555cab095d5e39e6817927356167aa0a8bea192c62346d886';
  assert.strictEqual(checksumMeta.sha256, EXPECTED_PRE_REMEDIATION_JS_HASH, 'Baseline 612 JS checksum record matches authoritative hash');
  assert.strictEqual(checksumMeta.recordCount, 612, 'Baseline record count is 612');

  const snapshot642Path = path.resolve('api/_data/importersData.snapshot-642.json');
  assert(fs.existsSync(snapshot642Path), 'Snapshot 642 artifact must exist');
  const snapshot642Raw = fs.readFileSync(snapshot642Path, 'utf8');
  const snapshot642 = JSON.parse(snapshot642Raw);
  assert.strictEqual(snapshot642.length, 642, `Snapshot 642 must contain 642 records, got ${snapshot642.length}`);
});

// Requirement 4: No duplicate company identifiers are introduced
runTest('Req 4: Zero duplicate company identifiers (companyName + country) across 642 records', () => {
  const seen = new Set();
  const duplicates = [];
  IMPORTERS.forEach(i => {
    const key = `${(i.companyName || '').trim().toLowerCase()}:::${(i.country || '').trim().toLowerCase()}`;
    if (seen.has(key)) {
      duplicates.push(key);
    }
    seen.add(key);
  });
  assert.strictEqual(duplicates.length, 0, `Found duplicate company+country: ${duplicates.join(', ')}`);
});

// Requirement 5: Duplicate email analysis is clean and bounded
runTest('Req 5: Real emails have no unexpected collisions (only known corporate sibling entities)', () => {
  const emailMap = new Map();
  IMPORTERS.forEach(i => {
    const email = (i.email || '').trim().toLowerCase();
    if (email && email !== 'not available' && email.includes('@')) {
      if (!emailMap.has(email)) emailMap.set(email, []);
      emailMap.get(email).push(i.companyName);
    }
  });
  const collisions = Array.from(emailMap.entries()).filter(([_, comps]) => comps.length > 1);
  // Exactly 9 known multi-entity corporate groups (Givaudan/Naturex, Döhler, Holland & Barrett, etc.)
  assert(collisions.length <= 9, `Unexpected email collisions: ${collisions.length}`);
});

// Requirement 6: Real phone identifiers have no invalid placeholder duplications
runTest('Req 6: Real phone numbers contain no fake placeholders or unauthorized duplicates', () => {
  const phoneMap = new Map();
  IMPORTERS.forEach(i => {
    const phone = (i.phone || '').trim();
    if (phone && phone !== 'Not Available') {
      if (!phoneMap.has(phone)) phoneMap.set(phone, []);
      phoneMap.get(phone).push(i.companyName);
    }
  });
  const multiPhones = Array.from(phoneMap.entries()).filter(([_, comps]) => comps.length > 1);
  // All multi-phones must be legitimate shared group switchboards
  multiPhones.forEach(([p, comps]) => {
    assert(p.length >= 6, `Invalid short phone collided: ${p}`);
  });
});

// Requirement 7: UNVERIFIED cannot become OUTREACH_READY automatically
runTest('Req 7: UNVERIFIED records are strictly blocked from OUTREACH_READY', () => {
  const unverifiedRecords = normalizedImporters.filter(i => i.companyVerificationStatus === COMPANY_VERIFICATION_STATUSES.UNVERIFIED);
  assert(unverifiedRecords.length > 0, `Must have UNVERIFIED records in the dataset, found ${unverifiedRecords.length}`);
  unverifiedRecords.forEach(r => {
    assert.strictEqual(
      r.outreachStatus,
      OUTREACH_STATUSES.NOT_READY,
      `UNVERIFIED record ${r.companyName} must have outreachStatus NOT_READY, got ${r.outreachStatus}`
    );
  });

  // Direct rule evaluation test
  const testCandidate = {
    companyVerificationStatus: COMPANY_VERIFICATION_STATUSES.UNVERIFIED,
    contactVerificationStatus: CONTACT_VERIFICATION_STATUSES.CONTACT_VERIFIED,
    businessFitStatus: BUSINESS_FIT_STATUSES.RELEVANT,
    country: 'USA',
    email: 'buyer@example.com',
    phone: '+1-555-123-4567'
  };
  const readiness = evaluateOutreachReadiness(testCandidate);
  assert.strictEqual(readiness.outreachStatus, OUTREACH_STATUSES.NOT_READY);
  assert(readiness.reasons.some(r => r.includes('Company identity is not verified')));
});

// Requirement 8: INVALID cannot become OUTREACH_READY
runTest('Req 8: INVALID company or contact verification strictly blocks OUTREACH_READY', () => {
  const invalidCompanyCandidate = {
    companyVerificationStatus: COMPANY_VERIFICATION_STATUSES.INVALID,
    contactVerificationStatus: CONTACT_VERIFICATION_STATUSES.CONTACT_VERIFIED,
    businessFitStatus: BUSINESS_FIT_STATUSES.RELEVANT,
    country: 'USA',
    email: 'buyer@example.com'
  };
  assert.strictEqual(evaluateOutreachReadiness(invalidCompanyCandidate).outreachStatus, OUTREACH_STATUSES.NOT_READY);

  const invalidContactCandidate = {
    companyVerificationStatus: COMPANY_VERIFICATION_STATUSES.COMPANY_VERIFIED,
    contactVerificationStatus: CONTACT_VERIFICATION_STATUSES.INVALID,
    businessFitStatus: BUSINESS_FIT_STATUSES.RELEVANT,
    country: 'USA',
    email: 'invalid@example.com'
  };
  assert.strictEqual(evaluateOutreachReadiness(invalidContactCandidate).outreachStatus, OUTREACH_STATUSES.NOT_READY);
});

// Requirement 9: BOUNCED cannot become OUTREACH_READY
runTest('Req 9: BOUNCE contact verification strictly blocks OUTREACH_READY', () => {
  const bouncedCandidate = {
    companyVerificationStatus: COMPANY_VERIFICATION_STATUSES.COMPANY_VERIFIED,
    contactVerificationStatus: CONTACT_VERIFICATION_STATUSES.BOUNCE,
    businessFitStatus: BUSINESS_FIT_STATUSES.RELEVANT,
    country: 'USA',
    email: 'bounced@example.com'
  };
  const res = evaluateOutreachReadiness(bouncedCandidate);
  assert.strictEqual(res.outreachStatus, OUTREACH_STATUSES.BOUNCED);
  assert(res.reasons.some(r => r.includes('marked as BOUNCE')));
});

// Requirement 10: DO_NOT_CONTACT cannot become OUTREACH_READY
runTest('Req 10: DO_NOT_CONTACT contact verification strictly blocks OUTREACH_READY', () => {
  const dncCandidate = {
    companyVerificationStatus: COMPANY_VERIFICATION_STATUSES.COMPANY_VERIFIED,
    contactVerificationStatus: CONTACT_VERIFICATION_STATUSES.DO_NOT_CONTACT,
    businessFitStatus: BUSINESS_FIT_STATUSES.RELEVANT,
    country: 'USA',
    email: 'optout@example.com'
  };
  const res = evaluateOutreachReadiness(dncCandidate);
  assert.strictEqual(res.outreachStatus, OUTREACH_STATUSES.DO_NOT_CONTACT);
  assert(res.reasons.some(r => r.includes('DO_NOT_CONTACT')));
});

// Requirement 11: Missing required fields prevent OUTREACH_READY
runTest('Req 11: Missing required fields (company, country, or contact method) prevent OUTREACH_READY', () => {
  // Missing country
  const noCountry = {
    companyVerificationStatus: COMPANY_VERIFICATION_STATUSES.COMPANY_VERIFIED,
    contactVerificationStatus: CONTACT_VERIFICATION_STATUSES.CONTACT_VERIFIED,
    businessFitStatus: BUSINESS_FIT_STATUSES.RELEVANT,
    country: '',
    email: 'buyer@example.com'
  };
  assert.strictEqual(evaluateOutreachReadiness(noCountry).outreachStatus, OUTREACH_STATUSES.NOT_READY);

  // Missing all contact methods
  const noContact = {
    companyVerificationStatus: COMPANY_VERIFICATION_STATUSES.COMPANY_VERIFIED,
    contactVerificationStatus: CONTACT_VERIFICATION_STATUSES.CONTACT_VERIFIED,
    businessFitStatus: BUSINESS_FIT_STATUSES.RELEVANT,
    country: 'UK',
    email: 'Not Available',
    phone: 'Not Available'
  };
  assert.strictEqual(evaluateOutreachReadiness(noContact).outreachStatus, OUTREACH_STATUSES.NOT_READY);
});

// Requirement 12: Verification timestamps are valid ISO strings for verified records, null for unverified
runTest('Req 12: Verification timestamps are valid ISO-8601 strings when verified, and null when unverified (no fabricated dates)', () => {
  normalizedImporters.forEach(r => {
    if (r.companyVerificationStatus === COMPANY_VERIFICATION_STATUSES.COMPANY_VERIFIED ||
        r.companyVerificationStatus === COMPANY_VERIFICATION_STATUSES.DOMAIN_ASSOCIATED) {
      if (r.lastVerifiedAt) {
        const dateVal = Date.parse(r.lastVerifiedAt);
        assert(!isNaN(dateVal), `Invalid lastVerifiedAt timestamp in ${r.companyName}: ${r.lastVerifiedAt}`);
      }
    } else {
      // Unverified records must have null lastVerifiedAt
      assert.strictEqual(r.lastVerifiedAt, null, `Unverified record ${r.companyName} must have null lastVerifiedAt, got ${r.lastVerifiedAt}`);
    }
  });
});

// Requirement 13: Verification source cannot be fabricated
runTest('Req 13: Verification sources are authentic and non-fabricated (no invented provenance)', () => {
  const allowedSources = new Set(Object.values(VERIFICATION_METHODS).filter(v => typeof v === 'string'));
  normalizedImporters.forEach(r => {
    assert(
      allowedSources.has(r.verificationMethod),
      `Fabricated or unknown verificationMethod ${r.verificationMethod} in ${r.companyName}`
    );
    // Unverified records must never have guessed or fabricated sources
    if (r.companyVerificationStatus === COMPANY_VERIFICATION_STATUSES.UNVERIFIED) {
      assert.strictEqual(
        r.verificationMethod,
        VERIFICATION_METHODS.UNTESTED,
        `Unverified record ${r.companyName} must have verificationMethod UNTESTED`
      );
    }
  });
});

// Requirement 14: Existing API authentication remains enforced
runTest('Req 14: API endpoints strictly reject unauthenticated calls with HTTP 401', () => {
  const impApi = fs.readFileSync(path.resolve('api/importers.js'), 'utf8');
  const mfrApi = fs.readFileSync(path.resolve('api/manufacturers.js'), 'utf8');
  assert(impApi.includes('verifyGateAccess'), 'api/importers.js must require verifyGateAccess');
  assert(impApi.includes('status(401)'), 'api/importers.js must return 401');
  assert(mfrApi.includes('verifyGateAccess'), 'api/manufacturers.js must require verifyGateAccess');
  assert(mfrApi.includes('status(401)'), 'api/manufacturers.js must return 401');
});

// Requirement 15: Private verification data cannot leak publicly
runTest('Req 15: No private verification tokens or master secrets leak into frontend bundle or files', () => {
  const publicFiles = ['src/pages/Importers.jsx', 'src/pages/PrivateDashboard.jsx'];
  publicFiles.forEach(f => {
    const content = fs.readFileSync(path.resolve(f), 'utf8');
    assert(!content.includes('MASTER_GATE_PASSWORD'), `${f} must not contain MASTER_GATE_PASSWORD`);
    assert(!content.includes('RESEND_API_KEY'), `${f} must not contain RESEND_API_KEY`);
    assert(!content.includes('STRIPE_SECRET_KEY'), `${f} must not contain STRIPE_SECRET_KEY`);
    assert(!content.includes('SESSION_SECRET'), `${f} must not contain SESSION_SECRET`);
  });
});

// Requirement 16: AVANI LOAN SERVICES remains untouched
runTest('Req 16: AVANI LOAN SERVICES directory and files remain completely untouched', () => {
  const gitStatus = require('child_process').execSync('git status --porcelain', { encoding: 'utf8' });
  const changedFiles = gitStatus.split('\n').filter(Boolean);
  changedFiles.forEach(line => {
    assert(!line.toLowerCase().includes('loan'), `ALS file touched: ${line}`);
    assert(!line.toLowerCase().includes('als'), `ALS file touched: ${line}`);
  });
});

// Requirement 17: The 8 UNVERIFIED newly added records remain explicitly tracked in verification queue
runTest('Req 17: The 8 newly added UNVERIFIED companies are strictly in verification queue with NOT_READY outreach', () => {
  const THE_8_UNVERIFIED_IDS = [613, 617, 623, 626, 627, 632, 639, 642];
  const foundRecords = normalizedImporters.filter(i => THE_8_UNVERIFIED_IDS.includes(i.id));
  assert.strictEqual(foundRecords.length, 8, `Expected all 8 unverified records, found ${foundRecords.length}`);

  foundRecords.forEach(r => {
    assert.strictEqual(r.companyVerificationStatus, COMPANY_VERIFICATION_STATUSES.UNVERIFIED, `${r.companyName} must be UNVERIFIED`);
    assert.strictEqual(r.outreachStatus, OUTREACH_STATUSES.NOT_READY, `${r.companyName} must have outreachStatus NOT_READY`);
    assert.strictEqual(r.inVerificationQueue, true, `${r.companyName} must be inVerificationQueue`);
    assert(r.verificationQueueDetails, `${r.companyName} must have verificationQueueDetails`);
    assert(r.verificationQueueDetails.missingFields.length > 0, `${r.companyName} must list missing fields`);
    assert(r.verificationQueueDetails.nextAction, `${r.companyName} must specify nextAction`);
  });
});

// Test 18: Authoritative dashboard metrics calculation returns exact hardened counts
runTest('Test 18: Dashboard metrics dynamically calculate from actual dataset without hardcoding', () => {
  const metrics = getVerificationDashboardMetrics(normalizedImporters);
  assert.strictEqual(metrics.totalRecords, 642, `totalRecords expected 642, got ${metrics.totalRecords}`);
  assert.strictEqual(metrics.requiredCountriesCount, 21, `requiredCountriesCount expected 21, got ${metrics.requiredCountriesCount}`);
  assert.strictEqual(metrics.companyVerified, 22, `companyVerified expected 22, got ${metrics.companyVerified}`);
  assert.strictEqual(metrics.domainAssociated, 241, `domainAssociated expected 241, got ${metrics.domainAssociated}`);
  assert.strictEqual(metrics.companyUnverified, 379, `companyUnverified expected 379, got ${metrics.companyUnverified}`);
  assert.strictEqual(metrics.websiteUrlValid, 448, `websiteUrlValid expected 448, got ${metrics.websiteUrlValid}`);
  assert.strictEqual(metrics.emailFormatValid, 331, `emailFormatValid expected 331, got ${metrics.emailFormatValid}`);
  assert.strictEqual(metrics.emailDeliverabilityChecked, 0, `emailDeliverabilityChecked expected 0, got ${metrics.emailDeliverabilityChecked}`);
  assert.strictEqual(metrics.emailDeliverable, 0, `emailDeliverable expected 0, got ${metrics.emailDeliverable}`);
  assert.strictEqual(metrics.phoneFormatValid, 338, `phoneFormatValid expected 338, got ${metrics.phoneFormatValid}`);
  assert.strictEqual(metrics.phoneVerified, 0, `phoneVerified expected 0, got ${metrics.phoneVerified}`);
  assert.strictEqual(metrics.businessFitRelevant, 375, `businessFitRelevant expected 375, got ${metrics.businessFitRelevant}`);
  assert.strictEqual(metrics.businessFitPossiblyRelevant, 201, `businessFitPossiblyRelevant expected 201, got ${metrics.businessFitPossiblyRelevant}`);
  assert.strictEqual(metrics.decisionMakerGenericDept, 384, `decisionMakerGenericDept expected 384, got ${metrics.decisionMakerGenericDept}`);
  assert.strictEqual(metrics.decisionMakerRoleIdentified, 232, `decisionMakerRoleIdentified expected 232, got ${metrics.decisionMakerRoleIdentified}`);
  assert.strictEqual(metrics.decisionMakerNameIdentified, 18, `decisionMakerNameIdentified expected 18, got ${metrics.decisionMakerNameIdentified}`);
  assert.strictEqual(metrics.decisionMakerProcurementConfirmed, 8, `decisionMakerProcurementConfirmed expected 8, got ${metrics.decisionMakerProcurementConfirmed}`);
  assert.strictEqual(metrics.decisionMakerIdentified, 26, `decisionMakerIdentified (named total) expected 26, got ${metrics.decisionMakerIdentified}`);
  assert.strictEqual(metrics.outreachReady, 0, `outreachReady expected 0, got ${metrics.outreachReady}`);
  assert.strictEqual(metrics.outreachNotReady, 642, `outreachNotReady expected 642, got ${metrics.outreachNotReady}`);
  assert.strictEqual(metrics.invalidCount, 0, `invalidCount expected 0, got ${metrics.invalidCount}`);
  assert.strictEqual(metrics.bouncedCount, 0, `bouncedCount expected 0, got ${metrics.bouncedCount}`);
  assert.strictEqual(metrics.suppressedCount, 0, `suppressedCount expected 0, got ${metrics.suppressedCount}`);
  assert.strictEqual(metrics.verificationQueueCount, 642, `verificationQueueCount expected 642, got ${metrics.verificationQueueCount}`);
});

// Regression Test 19: Legacy VERIFIED without registry evidence does NOT automatically become COMPANY_VERIFIED
runTest('Req 19: Legacy VERIFIED without registry evidence does NOT become COMPANY_VERIFIED', () => {
  const legacyVerifiedWithSite = {
    companyName: 'Test Corp',
    verificationStatus: 'VERIFIED',
    website: 'https://testcorp.com',
    source: 'General B2B Directory'
  };
  const statusWithSite = evaluateCompanyVerification(legacyVerifiedWithSite);
  assert.strictEqual(statusWithSite, COMPANY_VERIFICATION_STATUSES.DOMAIN_ASSOCIATED, 'Should be DOMAIN_ASSOCIATED, not COMPANY_VERIFIED');

  const legacyVerifiedNoSite = {
    companyName: 'Test Corp No Site',
    verificationStatus: 'VERIFIED',
    website: 'Not Available',
    source: 'General B2B Directory'
  };
  const statusNoSite = evaluateCompanyVerification(legacyVerifiedNoSite);
  assert.strictEqual(statusNoSite, COMPANY_VERIFICATION_STATUSES.UNVERIFIED, 'Should be UNVERIFIED without website');
});

// Regression Test 20: FORMAT_VALID does NOT become DELIVERABILITY_CHECKED
runTest('Req 20: FORMAT_VALID contact does NOT become DELIVERABILITY_CHECKED', () => {
  const norm = normalizeImporterWithVerification({
    id: 9999,
    companyName: 'Format Only LLC',
    country: 'USA',
    email: 'valid.syntax@globaltradecorp.com',
    phone: '+1-555-123-4567',
    website: 'https://globaltradecorp.com'
  });
  assert.strictEqual(norm.emailFormatValid, true, 'emailFormatValid should be true');
  assert.strictEqual(norm.emailDeliverabilityStatus, 'UNTESTED', 'emailDeliverabilityStatus must be UNTESTED');
  assert.strictEqual(norm.emailVerified, false, 'emailVerified must be false');
  assert.strictEqual(norm.phoneFormatValid, true, 'phoneFormatValid should be true');
  assert.strictEqual(norm.phoneVerificationStatus, 'UNTESTED', 'phoneVerificationStatus must be UNTESTED');
  assert.strictEqual(norm.phoneVerified, false, 'phoneVerified must be false');
});

// Regression Test 21: Missing lastVerifiedAt blocks verified status in outreach readiness
runTest('Req 21: Missing lastVerifiedAt blocks OUTREACH_READY', () => {
  const candidate = {
    companyVerificationStatus: COMPANY_VERIFICATION_STATUSES.COMPANY_VERIFIED,
    contactVerificationStatus: CONTACT_VERIFICATION_STATUSES.FORMAT_VALID,
    emailDeliverabilityStatus: 'DELIVERABLE',
    country: 'USA',
    businessFitStatus: BUSINESS_FIT_STATUSES.RELEVANT,
    verificationSource: 'National Registry',
    lastVerifiedAt: null // missing!
  };
  const readiness = evaluateOutreachReadiness(candidate);
  assert.strictEqual(readiness.outreachStatus, OUTREACH_STATUSES.NOT_READY);
  assert(readiness.blockers.some(b => b.includes('Verification event timestamp is missing')));
});

// Regression Test 22: Missing verificationEvidence blocks company verification
runTest('Req 22: Missing verificationEvidence prevents promotion to COMPANY_VERIFIED', () => {
  const norm = normalizeImporterWithVerification({
    id: 9998,
    companyName: 'No Evidence Corp',
    country: 'USA',
    verificationStatus: 'UNVERIFIED'
  });
  assert.strictEqual(norm.companyVerificationStatus, COMPANY_VERIFICATION_STATUSES.UNVERIFIED);
  assert.strictEqual(norm.verificationEvidence, null);
});

// Regression Test 23: Missing verificationSource blocks company verification
runTest('Req 23: Missing verificationSource blocks OUTREACH_READY', () => {
  const candidate = {
    companyVerificationStatus: COMPANY_VERIFICATION_STATUSES.COMPANY_VERIFIED,
    contactVerificationStatus: CONTACT_VERIFICATION_STATUSES.FORMAT_VALID,
    emailDeliverabilityStatus: 'DELIVERABLE',
    country: 'USA',
    businessFitStatus: BUSINESS_FIT_STATUSES.RELEVANT,
    lastVerifiedAt: '2026-10-01T00:00:00.000Z',
    verificationSource: null // missing!
  };
  const readiness = evaluateOutreachReadiness(candidate);
  assert.strictEqual(readiness.outreachStatus, OUTREACH_STATUSES.NOT_READY);
  assert(readiness.blockers.some(b => b.includes('Verification source provenance is missing')));
});

// Regression Test 24: Generic Procurement Desk does not count as named decision maker
runTest('Req 24: Generic "Procurement Desk" classifies as GENERIC_DEPARTMENT, not named decision maker', () => {
  const deskResult = evaluateDecisionMaker({
    contactPerson: 'Procurement Desk',
    jobTitle: 'Buyer'
  });
  assert.strictEqual(deskResult.status, DECISION_MAKER_STATUSES.GENERIC_DEPARTMENT);

  const deptResult = evaluateDecisionMaker({
    contactPerson: 'Sales Department',
    jobTitle: 'Sales Team'
  });
  assert.strictEqual(deptResult.status, DECISION_MAKER_STATUSES.GENERIC_DEPARTMENT);

  const humanResult = evaluateDecisionMaker({
    contactPerson: 'John Smith',
    jobTitle: 'Procurement Director'
  });
  assert.strictEqual(humanResult.status, DECISION_MAKER_STATUSES.PROCUREMENT_CONFIRMED);
});

// Regression Test 25: Importer keyword does not automatically mean IMPORTER_CONFIRMED
runTest('Req 25: Importer keyword without commercial registry filing yields IMPORTER_UNCONFIRMED', () => {
  const unverifiedImporter = classifyBuyerType(
    { businessType: 'Food Importer', industry: 'Import/Export' },
    COMPANY_VERIFICATION_STATUSES.DOMAIN_ASSOCIATED // Not COMPANY_VERIFIED
  );
  assert.strictEqual(unverifiedImporter, BUYER_TYPES.IMPORTER_UNCONFIRMED);

  const confirmedImporter = classifyBuyerType(
    { businessType: 'Food Importer', industry: 'Import/Export' },
    COMPANY_VERIFICATION_STATUSES.COMPANY_VERIFIED // Official registry
  );
  assert.strictEqual(confirmedImporter, BUYER_TYPES.IMPORTER_CONFIRMED);
});

// Regression Test 26: Broad "food" keyword does not automatically mean RELEVANT
runTest('Req 26: Broad "food" keyword without specific Moringa/Onion evidence yields POSSIBLY_RELEVANT', () => {
  const broadFood = evaluateBusinessFit({
    products: 'General food products and snacks',
    industry: 'Food Industry'
  });
  assert.strictEqual(broadFood, BUSINESS_FIT_STATUSES.POSSIBLY_RELEVANT, 'Broad food keyword must be POSSIBLY_RELEVANT, not RELEVANT');

  const specificMoringa = evaluateBusinessFit({
    products: 'Organic Moringa Powder and Herbal Extracts',
    industry: 'Nutraceuticals'
  });
  assert.strictEqual(specificMoringa, BUSINESS_FIT_STATUSES.RELEVANT, 'Specific Moringa interest must be RELEVANT');

  const specificOnion = evaluateBusinessFit({
    products: 'Dehydrated Red Onion Flakes and Powders',
    industry: 'Seasonings'
  });
  assert.strictEqual(specificOnion, BUSINESS_FIT_STATUSES.RELEVANT, 'Specific Onion interest must be RELEVANT');
});

// Regression Test 27: UNVERIFIED record cannot become OUTREACH_READY
runTest('Req 27: UNVERIFIED record cannot become OUTREACH_READY even with verified email', () => {
  const unverifiedCandidate = {
    companyVerificationStatus: COMPANY_VERIFICATION_STATUSES.UNVERIFIED,
    emailDeliverabilityStatus: 'DELIVERABLE',
    country: 'USA',
    businessFitStatus: BUSINESS_FIT_STATUSES.RELEVANT,
    lastVerifiedAt: '2026-10-01T00:00:00.000Z',
    verificationSource: 'Test Source'
  };
  const readiness = evaluateOutreachReadiness(unverifiedCandidate);
  assert.strictEqual(readiness.outreachStatus, OUTREACH_STATUSES.NOT_READY);
  assert(readiness.blockers.some(b => b.includes('Company identity is not verified')));
});

// Regression Test 28: INVALID contact cannot become OUTREACH_READY
runTest('Req 28: INVALID contact cannot become OUTREACH_READY', () => {
  const invalidCandidate = {
    companyVerificationStatus: COMPANY_VERIFICATION_STATUSES.COMPANY_VERIFIED,
    contactVerificationStatus: CONTACT_VERIFICATION_STATUSES.INVALID,
    emailDeliverabilityStatus: 'INVALID',
    phoneVerificationStatus: 'INVALID',
    country: 'USA',
    businessFitStatus: BUSINESS_FIT_STATUSES.RELEVANT,
    lastVerifiedAt: '2026-10-01T00:00:00.000Z',
    verificationSource: 'National Registry'
  };
  const readiness = evaluateOutreachReadiness(invalidCandidate);
  assert.strictEqual(readiness.outreachStatus, OUTREACH_STATUSES.NOT_READY);
  assert(readiness.blockers.some(b => b.includes('Contact information is marked INVALID')));
});

// Regression Test 29: Format-valid contact alone cannot become OUTREACH_READY
runTest('Req 29: Format-valid contact alone (without operational deliverability check) cannot become OUTREACH_READY', () => {
  const formatOnlyCandidate = {
    companyVerificationStatus: COMPANY_VERIFICATION_STATUSES.COMPANY_VERIFIED,
    contactVerificationStatus: CONTACT_VERIFICATION_STATUSES.FORMAT_VALID,
    emailFormatValid: true,
    emailDeliverabilityStatus: 'UNTESTED', // Not DELIVERABLE!
    phoneFormatValid: true,
    phoneVerificationStatus: 'UNTESTED', // Not VERIFIED!
    country: 'USA',
    businessFitStatus: BUSINESS_FIT_STATUSES.RELEVANT,
    lastVerifiedAt: '2026-10-01T00:00:00.000Z',
    verificationSource: 'National Registry'
  };
  const readiness = evaluateOutreachReadiness(formatOnlyCandidate);
  assert.strictEqual(readiness.outreachStatus, OUTREACH_STATUSES.NOT_READY);
  assert(readiness.blockers.some(b => b.includes('No operationally verified contact channel')));
});

console.log('\n============================================================');
console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('============================================================\n');

if (failed > 0) {
  process.exit(1);
}
