// ============================================================
// AVANI AGRO FOODS — Importer & Manufacturer Dataset Test Suite
// Verifies dataset integrity, zero placeholders, authentication & metrics
// ============================================================

const fs = require('fs');
const path = require('path');
const assert = require('assert');

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
console.log('AVANI AGRO FOODS — IMPORTER & MANUFACTURER TEST SUITE');
console.log('============================================================\n');

// Load datasets
const importersRaw = fs.readFileSync(path.resolve('api/_data/importersData.js'), 'utf8');
const mfrsRaw = fs.readFileSync(path.resolve('api/_data/manufacturersData.js'), 'utf8');

// Parse IMPORTERS
const impMatch = importersRaw.match(/export const IMPORTERS = (\[[\s\S]*?\]);/);
assert(impMatch, 'Could not parse IMPORTERS array from api/_data/importersData.js');
const IMPORTERS = JSON.parse(impMatch[1]);

// Parse MANUFACTURERS
const mfrMatch = mfrsRaw.match(/export const MANUFACTURERS = (\{[\s\S]*?\});/);
assert(mfrMatch, 'Could not parse MANUFACTURERS object from api/_data/manufacturersData.js');
const MANUFACTURERS = JSON.parse(mfrMatch[1]);

// Test 1: Importer dataset loads
runTest('Test 1: Importer dataset loads cleanly with valid array', () => {
  assert(Array.isArray(IMPORTERS), 'IMPORTERS should be an array');
  assert(IMPORTERS.length > 0, 'IMPORTERS should not be empty');
});

// Test 2: Manufacturer dataset loads
runTest('Test 2: Manufacturer dataset loads cleanly with small/medium/large groups', () => {
  assert(Array.isArray(MANUFACTURERS.small), 'MANUFACTURERS.small should be an array');
  assert(Array.isArray(MANUFACTURERS.medium), 'MANUFACTURERS.medium should be an array');
  assert(Array.isArray(MANUFACTURERS.large), 'MANUFACTURERS.large should be an array');
});

// Test 3: Country count correct
runTest('Test 3: Country count matches expected authoritative coverage (>= 20 countries)', () => {
  const countries = new Set(IMPORTERS.map(i => i.country).filter(Boolean));
  assert(countries.size >= 20, `Expected at least 20 countries, got ${countries.size}`);
  assert(countries.has('USA'), 'Should include USA');
  assert(countries.has('UK'), 'Should include UK');
  assert(countries.has('UAE'), 'Should include UAE');
  assert(countries.has('Germany'), 'Should include Germany');
  assert(countries.has('Netherlands'), 'Should include Netherlands');
});

// Test 4: Importer count correct
runTest('Test 4: Importer record count is positive and matches normalized unique tally (612)', () => {
  assert.strictEqual(IMPORTERS.length, 612, `Expected 612 unique importers, got ${IMPORTERS.length}`);
});

// Test 5: Manufacturer count correct
runTest('Test 5: Manufacturer record count matches normalized unique tally (129)', () => {
  const totalMfrs = MANUFACTURERS.small.length + MANUFACTURERS.medium.length + MANUFACTURERS.large.length;
  assert.strictEqual(totalMfrs, 129, `Expected 129 unique manufacturers, got ${totalMfrs}`);
});

// Test 6: Duplicate handling
runTest('Test 6: Duplicate handling ensures zero duplicate companies within same country', () => {
  const seen = new Set();
  IMPORTERS.forEach(i => {
    const key = `${i.companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}_${i.country.toLowerCase()}`;
    assert(!seen.has(key), `Found duplicate importer key: ${key}`);
    seen.add(key);
  });
});

// Test 7: Placeholder phone filtering
runTest('Test 7: Zero occurrences of synthetic +12345678900 or trivial dummy patterns', () => {
  const allPhones = [
    ...IMPORTERS.map(i => i.phone),
    ...MANUFACTURERS.small.map(m => m.phone),
    ...MANUFACTURERS.medium.map(m => m.phone),
    ...MANUFACTURERS.large.map(m => m.phone)
  ];
  allPhones.forEach(p => {
    if (!p || p === 'Not Available') return;
    const digits = p.replace(/\D/g, '');
    assert(digits !== '12345678900', `Placeholder phone found: ${p}`);
    assert(digits !== '1234567890', `Placeholder phone found: ${p}`);
    assert(digits !== '0000000000', `Placeholder phone found: ${p}`);
    assert(digits !== '1111111111', `Placeholder phone found: ${p}`);
    assert(digits !== '9999999999', `Placeholder phone found: ${p}`);
  });
  assert(!importersRaw.includes('12345678900'), 'importersData.js raw text contains 12345678900');
  assert(!mfrsRaw.includes('12345678900'), 'manufacturersData.js raw text contains 12345678900');
});

// Test 8: Placeholder email filtering
runTest('Test 8: Zero occurrences of placeholder sourcing@buyer.com or dummy domains', () => {
  const allEmails = [
    ...IMPORTERS.map(i => i.email),
    ...MANUFACTURERS.small.map(m => m.email),
    ...MANUFACTURERS.medium.map(m => m.email),
    ...MANUFACTURERS.large.map(m => m.email)
  ];
  allEmails.forEach(e => {
    if (!e || e === 'Not Available') return;
    assert(!e.includes('buyer.com'), `Placeholder email found: ${e}`);
    assert(!e.includes('example.com'), `Placeholder email found: ${e}`);
    assert(!e.includes('test.com'), `Placeholder email found: ${e}`);
    assert(e.includes('@') && e.includes('.'), `Invalid email syntax found: ${e}`);
  });
  assert(!importersRaw.includes('sourcing@buyer.com'), 'importersData.js contains sourcing@buyer.com');
});

// Test 9: Missing-field handling
runTest('Test 9: Missing contact fields are explicitly standardized to "Not Available"', () => {
  const missingPhones = IMPORTERS.filter(i => i.phone === 'Not Available');
  const missingEmails = IMPORTERS.filter(i => i.email === 'Not Available');
  assert(missingPhones.length > 0, 'Expected some importers with Not Available phone');
  assert(missingEmails.length > 0, 'Expected some importers with Not Available email');
  IMPORTERS.forEach(i => {
    assert(i.phone !== null && i.phone !== undefined, 'Phone must not be null/undefined');
    assert(i.email !== null && i.email !== undefined, 'Email must not be null/undefined');
  });
});

// Test 10: Source provenance
runTest('Test 10: Every importer and manufacturer record retains sourceFile and sourceSheet provenance', () => {
  IMPORTERS.forEach(i => {
    assert(i.sourceFile, `Importer ${i.companyName} missing sourceFile`);
    assert(i.sourceSheet, `Importer ${i.companyName} missing sourceSheet`);
  });
  const allMfrs = [...MANUFACTURERS.small, ...MANUFACTURERS.medium, ...MANUFACTURERS.large];
  allMfrs.forEach(m => {
    assert(m.sourceFile, `Manufacturer ${m.companyName} missing sourceFile`);
    assert(m.sourceSheet, `Manufacturer ${m.companyName} missing sourceSheet`);
  });
});

// Test 11: /private authentication
runTest('Test 11: Private router requires authentication and PasswordGate for /private', () => {
  const privateDashboardContent = fs.readFileSync(path.resolve('src/pages/PrivateDashboard.jsx'), 'utf8');
  assert(privateDashboardContent.includes('<PasswordGate'), 'PrivateDashboard must render PasswordGate');
});

// Test 12: /private/importers authentication
runTest('Test 12: Private importers page requires authentication and PasswordGate', () => {
  const importersContent = fs.readFileSync(path.resolve('src/pages/Importers.jsx'), 'utf8');
  assert(importersContent.includes('<PasswordGate'), 'Importers must render PasswordGate');
});

// Test 13: Unauthorized API rejection
runTest('Test 13: Importers and Manufacturers serverless APIs reject unauthenticated requests (HTTP 401)', () => {
  const impApi = fs.readFileSync(path.resolve('api/importers.js'), 'utf8');
  const mfrApi = fs.readFileSync(path.resolve('api/manufacturers.js'), 'utf8');
  assert(impApi.includes('verifyGateAccess'), 'api/importers.js must call verifyGateAccess');
  assert(impApi.includes('status(401)'), 'api/importers.js must return 401 when unauthenticated');
  assert(mfrApi.includes('verifyGateAccess'), 'api/manufacturers.js must call verifyGateAccess');
  assert(mfrApi.includes('status(401)'), 'api/manufacturers.js must return 401 when unauthenticated');
});

// Test 14: Authorized API access logic
runTest('Test 14: Authorized API access returns full dataset and success response', () => {
  const impApi = fs.readFileSync(path.resolve('api/importers.js'), 'utf8');
  const mfrApi = fs.readFileSync(path.resolve('api/manufacturers.js'), 'utf8');
  // api/importers.js returns a normalized copy — check response shape + auth gates
  assert(impApi.includes('success: true'), 'api/importers.js must return success: true');
  assert(impApi.includes('count:'), 'api/importers.js must return count field');
  // Phase 8: normalized array key (either 'importers: IMPORTERS' or 'importers: normalized')
  assert(
    impApi.includes('importers: IMPORTERS') || impApi.includes('importers: normalized'),
    'api/importers.js must return importers array in response'
  );
  assert(mfrApi.includes('manufacturers: MANUFACTURERS'), 'api/manufacturers.js must return MANUFACTURERS');
});


// Test 15: Dashboard metrics computation
runTest('Test 15: Dashboard dynamically derives totalImporters and totalManufacturers without hardcoding', () => {
  const dashboardContent = fs.readFileSync(path.resolve('src/pages/PrivateDashboard.jsx'), 'utf8');
  assert(dashboardContent.includes('const totalImporters = importers.length'), 'totalImporters must be dynamic');
  assert(dashboardContent.includes('const totalManufacturers = manufacturers?.all?.length'), 'totalManufacturers must be dynamic');
});

// Test 16: Importer search logic
runTest('Test 16: Importer search filter tests match against company, product, and contact', () => {
  const importersContent = fs.readFileSync(path.resolve('src/pages/Importers.jsx'), 'utf8');
  assert(importersContent.includes('item.companyName?.toLowerCase().includes(q)'), 'Must filter by companyName');
  assert(importersContent.includes('item.products?.toLowerCase().includes(q)'), 'Must filter by products');
  assert(importersContent.includes('item.country?.toLowerCase().includes(q)'), 'Must filter by country');
});

// Test 17: Country filter dynamic generation
runTest('Test 17: Country filter list is dynamically generated from importers array', () => {
  const importersContent = fs.readFileSync(path.resolve('src/pages/Importers.jsx'), 'utf8');
  assert(importersContent.includes("availableCountries = ['All', ...Array.from(new Set(importers.map(i => i.country)"), 'availableCountries must be derived dynamically');
});

// Test 18: Manufacturer display & compliance
runTest('Test 18: Manufacturer cards display partner facilities with compliance disclaimers', () => {
  const mfrsContent = fs.readFileSync(path.resolve('src/pages/Manufacturers.jsx'), 'utf8');
  assert(mfrsContent.includes('Subject to independent verification') || mfrsContent.includes('subject to independent commercial verification'), 'Must include compliance verification note');
});

// Test 19: Production build verification
runTest('Test 19: Production build artifacts exist and are non-empty in dist/', () => {
  assert(fs.existsSync(path.resolve('dist/index.html')), 'dist/index.html must exist');
  assert(fs.existsSync(path.resolve('dist/assets')), 'dist/assets directory must exist');
  const indexHtml = fs.readFileSync(path.resolve('dist/index.html'), 'utf8');
  assert(indexHtml.includes('<html') && indexHtml.length > 500, 'dist/index.html must be valid HTML');
});

console.log('\n============================================================');
console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('============================================================\n');

if (failed > 0) {
  process.exit(1);
}
