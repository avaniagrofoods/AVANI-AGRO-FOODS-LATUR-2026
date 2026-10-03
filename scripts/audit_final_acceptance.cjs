// ============================================================
// AVANI AGRO FOODS — FULL ACCEPTANCE AUDIT SCRIPT
// Tasks 1–15: Source Inventory, Reconciliation, Forensics,
//             Phone/Email Validation, Provenance, Verification,
//             Country Coverage, Manufacturer Validation,
//             Placeholder Forensics, Git, Build artifact check
// ============================================================

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve('.');
const IMPORTER_SRC_ROOT = path.resolve('C:\\Users\\ALPHA-1\\Downloads\\21MAY2026\\SACHIN SHINDE DOCUMENTS\\AVANI AGRO FOODS\\Importor Data');
const MANUFACTURER_SRC_ROOT = path.resolve('C:\\Users\\ALPHA-1\\Downloads\\21MAY2026\\SACHIN SHINDE DOCUMENTS\\AVANI AGRO FOODS\\Manufacturer Data');
const IMPORTERS_JS = path.resolve('api/_data/importersData.js');
const MANUFACTURERS_JS = path.resolve('api/_data/manufacturersData.js');

// ── Helpers ──────────────────────────────────────────────────
function walk(dir, exts = ['.xlsx', '.xls', '.csv', '.json', '.txt']) {
  if (!fs.existsSync(dir)) return [];
  const results = [];
  function recurse(d) {
    let entries;
    try { entries = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) { recurse(full); continue; }
      const ext = path.extname(e.name).toLowerCase();
      if (exts.includes(ext)) {
        const stat = fs.statSync(full);
        results.push({ name: e.name, fullPath: full, sizeBytes: stat.size, modified: stat.mtime.toISOString() });
      }
    }
  }
  recurse(dir);
  return results;
}

function isRealEmail(v) {
  if (!v || v === 'Not Available' || v === 'N/A' || v === 'NA') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim());
}
function isRealPhone(v) {
  if (!v || v === 'Not Available' || v === 'N/A' || v === 'NA') return false;
  const digits = String(v).replace(/\D/g, '');
  return digits.length >= 7;
}
function isRealWebsite(v) {
  if (!v || v === 'Not Available' || v === 'N/A' || v === 'NA') return false;
  return /^https?:\/\/.+\..+/.test(String(v).trim());
}

function normalizeCountry(raw) {
  if (!raw) return 'UNKNOWN';
  const s = String(raw).trim();
  const upper = s.toUpperCase();
  if (upper === 'KSA' || upper === 'SAUDI' || upper === 'KINGDOM OF SAUDI ARABIA') return 'Saudi Arabia';
  if (upper === 'KOREA' || upper === 'SOUTH KOREA' || upper === 'REPUBLIC OF KOREA') return 'South Korea';
  if (upper === 'UAE' || upper === 'UNITED ARAB EMIRATES') return 'UAE';
  if (upper === 'USA' || upper === 'UNITED STATES' || upper === 'UNITED STATES OF AMERICA') return 'USA';
  if (upper === 'UK' || upper === 'UNITED KINGDOM') return 'UK';
  return s;
}

// ── SECTION 1: Source File Inventory ─────────────────────────
console.log('\n============================================================');
console.log('SECTION 1: SOURCE FILE INVENTORY');
console.log('============================================================');

const importerFiles = walk(IMPORTER_SRC_ROOT);
const manufacturerFiles = walk(MANUFACTURER_SRC_ROOT);

console.log(`\nIMPORTER SOURCE ROOT: ${IMPORTER_SRC_ROOT}`);
console.log(`Total files: ${importerFiles.length}`);
importerFiles.forEach(f => console.log(`  [${(f.sizeBytes/1024).toFixed(1)} KB] ${f.name} — ${f.modified.split('T')[0]}`));

console.log(`\nMANUFACTURER SOURCE ROOT: ${MANUFACTURER_SRC_ROOT}`);
console.log(`Total files: ${manufacturerFiles.length}`);
manufacturerFiles.forEach(f => console.log(`  [${(f.sizeBytes/1024).toFixed(1)} KB] ${f.name} — ${f.modified.split('T')[0]}`));

// ── SECTION 2: Load Production Data ──────────────────────────
console.log('\n============================================================');
console.log('SECTION 2: PRODUCTION DATASET LOAD');
console.log('============================================================');

const importersRaw = fs.readFileSync(IMPORTERS_JS, 'utf8');
const mfrsRaw = fs.readFileSync(MANUFACTURERS_JS, 'utf8');

const impMatch = importersRaw.match(/export const IMPORTERS = (\[[\s\S]*?\]);/);
if (!impMatch) { console.error('FAIL: Could not parse IMPORTERS'); process.exit(1); }
const IMPORTERS = JSON.parse(impMatch[1]);

const mfrMatch = mfrsRaw.match(/export const MANUFACTURERS = ([\s\S]*?);[\s]*export/);
let MANUFACTURERS;
if (mfrMatch) {
  MANUFACTURERS = eval('(' + mfrMatch[1] + ')');
} else {
  const mfrMatch2 = mfrsRaw.match(/export const MANUFACTURERS = ([\s\S]*)/);
  MANUFACTURERS = eval('(' + mfrMatch2[1].replace(/;[\s]*$/, '') + ')');
}

const allMfrs = [...MANUFACTURERS.small, ...MANUFACTURERS.medium, ...MANUFACTURERS.large];

console.log(`\nIMPORTERS loaded: ${IMPORTERS.length}`);
console.log(`MANUFACTURERS.small: ${MANUFACTURERS.small.length}`);
console.log(`MANUFACTURERS.medium: ${MANUFACTURERS.medium.length}`);
console.log(`MANUFACTURERS.large: ${MANUFACTURERS.large.length}`);
console.log(`MANUFACTURERS total: ${allMfrs.length}`);

// ── SECTION 3: Importer Reconciliation ───────────────────────
console.log('\n============================================================');
console.log('SECTION 3: IMPORTER RECONCILIATION');
console.log('============================================================');

const BASELINE_IMPORTERS = 612;
const RESEARCHED_IMPORTERS = 30;
const EXPECTED_IMPORTERS = BASELINE_IMPORTERS + RESEARCHED_IMPORTERS; // 642
const EXPECTED_COUNTRIES = 21;
const EXPECTED_REAL_EMAIL = 331;
const EXPECTED_REAL_PHONE = 338;
const EXPECTED_VALID_WEBSITE = 448;

const realEmails = IMPORTERS.filter(i => isRealEmail(i.email)).length;
const realPhones = IMPORTERS.filter(i => isRealPhone(i.phone)).length;
const validWebsites = IMPORTERS.filter(i => isRealWebsite(i.website)).length;
const countries = new Set(IMPORTERS.map(i => normalizeCountry(i.country)).filter(Boolean));
const verifiedCount = IMPORTERS.filter(i => i.verificationStatus === 'VERIFIED').length;
const unverifiedCount = IMPORTERS.filter(i => i.verificationStatus === 'UNVERIFIED' || i.verificationStatus === 'NEEDS REVIEW').length;
const notAvailableCount = IMPORTERS.filter(i => !i.verificationStatus || i.verificationStatus === 'NOT_AVAILABLE').length;

const missingEmail = IMPORTERS.filter(i => !isRealEmail(i.email)).length;
const missingPhone = IMPORTERS.filter(i => !isRealPhone(i.phone)).length;
const missingWebsite = IMPORTERS.filter(i => !isRealWebsite(i.website)).length;
const missingCity = IMPORTERS.filter(i => !i.city || i.city === 'Not Available').length;

console.log(`\nExpected: ${EXPECTED_IMPORTERS} | Actual: ${IMPORTERS.length} | ${IMPORTERS.length === EXPECTED_IMPORTERS ? 'MATCH' : 'DISCREPANCY'}`);
console.log(`Expected countries: ${EXPECTED_COUNTRIES} | Actual: ${countries.size} | ${countries.size >= EXPECTED_COUNTRIES ? 'PASS' : 'FAIL'}`);
console.log(`Expected real email: ${EXPECTED_REAL_EMAIL} | Actual: ${realEmails} | ${realEmails === EXPECTED_REAL_EMAIL ? 'MATCH' : 'DISCREPANCY'}`);
console.log(`Expected real phone: ${EXPECTED_REAL_PHONE} | Actual: ${realPhones} | ${realPhones === EXPECTED_REAL_PHONE ? 'MATCH' : 'DISCREPANCY'}`);
console.log(`Expected valid website: ${EXPECTED_VALID_WEBSITE} | Actual: ${validWebsites} | ${validWebsites === EXPECTED_VALID_WEBSITE ? 'MATCH' : 'DISCREPANCY'}`);
console.log(`VERIFIED: ${verifiedCount} | UNVERIFIED/NEEDS REVIEW: ${unverifiedCount} | NOT_AVAILABLE: ${notAvailableCount}`);
console.log(`Missing email: ${missingEmail} | Missing phone: ${missingPhone} | Missing website: ${missingWebsite}`);
console.log(`Missing city field: ${missingCity}`);

// sourceFile / sourceSheet provenance
const missingSourceFile = IMPORTERS.filter(i => !i.sourceFile).length;
const missingSourceSheet = IMPORTERS.filter(i => !i.sourceSheet).length;
const windowsPathLeak = IMPORTERS.filter(i => JSON.stringify(i).includes('C:\\Users')).length;
console.log(`Missing sourceFile: ${missingSourceFile} | Missing sourceSheet: ${missingSourceSheet} | Windows path leak: ${windowsPathLeak}`);

// ── SECTION 4: Manufacturer Reconciliation ────────────────────
console.log('\n============================================================');
console.log('SECTION 4: MANUFACTURER RECONCILIATION');
console.log('============================================================');

const EXPECTED_MFR = 129;
const EXPECTED_SMALL = 35;
const EXPECTED_MEDIUM = 70;
const EXPECTED_LARGE = 24;
const EXPECTED_MAHARASHTRA = 100;

const maharashtraCount = allMfrs.filter(m => {
  const loc = (m.location || '').toLowerCase();
  return loc.includes('maharashtra') || loc.includes('latur') || loc.includes('pune') ||
    loc.includes('nashik') || loc.includes('aurangabad') || loc.includes('satara') ||
    loc.includes('kolhapur') || loc.includes('nagpur') || loc.includes('mumbai');
}).length;

const mfrMissingSourceFile = allMfrs.filter(m => !m.sourceFile).length;
const mfrMissingSourceSheet = allMfrs.filter(m => !m.sourceSheet).length;
const mfrWindowsPathLeak = allMfrs.filter(m => JSON.stringify(m).includes('C:\\Users')).length;
const mfrVerified = allMfrs.filter(m => m.verificationStatus === 'VERIFIED').length;
const mfrUnverified = allMfrs.filter(m => m.verificationStatus === 'UNVERIFIED').length;

console.log(`\nExpected total: ${EXPECTED_MFR} | Actual: ${allMfrs.length} | ${allMfrs.length === EXPECTED_MFR ? 'MATCH' : 'DISCREPANCY'}`);
console.log(`Expected small: ${EXPECTED_SMALL} | Actual: ${MANUFACTURERS.small.length} | ${MANUFACTURERS.small.length === EXPECTED_SMALL ? 'MATCH' : 'DISCREPANCY'}`);
console.log(`Expected medium: ${EXPECTED_MEDIUM} | Actual: ${MANUFACTURERS.medium.length} | ${MANUFACTURERS.medium.length === EXPECTED_MEDIUM ? 'MATCH' : 'DISCREPANCY'}`);
console.log(`Expected large: ${EXPECTED_LARGE} | Actual: ${MANUFACTURERS.large.length} | ${MANUFACTURERS.large.length === EXPECTED_LARGE ? 'MATCH' : 'DISCREPANCY'}`);
console.log(`Expected Maharashtra: ${EXPECTED_MAHARASHTRA} | Actual: ${maharashtraCount} | ${maharashtraCount === EXPECTED_MAHARASHTRA ? 'MATCH' : 'DISCREPANCY'}`);
console.log(`VERIFIED: ${mfrVerified} | UNVERIFIED: ${mfrUnverified}`);
console.log(`Missing sourceFile: ${mfrMissingSourceFile} | Missing sourceSheet: ${mfrMissingSourceSheet} | Windows path leak: ${mfrWindowsPathLeak}`);

// ── SECTION 5: Duplicate Analysis ─────────────────────────────
console.log('\n============================================================');
console.log('SECTION 5: DUPLICATE ANALYSIS');
console.log('============================================================');

// Importer duplicates by companyName+country
const seenImpKeys = new Map();
let impDupGroups = 0;
IMPORTERS.forEach(i => {
  const key = `${String(i.companyName).toLowerCase().replace(/[^a-z0-9]/g, '')}_${String(i.country).toLowerCase()}`;
  if (!seenImpKeys.has(key)) seenImpKeys.set(key, []);
  seenImpKeys.get(key).push(i.id);
});
const impDups = [...seenImpKeys.entries()].filter(([, ids]) => ids.length > 1);
impDupGroups = impDups.length;
console.log(`\nImporter duplicate groups (company+country): ${impDupGroups}`);
if (impDupGroups > 0) {
  impDups.forEach(([key, ids]) => console.log(`  ⚠ ${key}: IDs ${ids.join(', ')}`));
}

// Email duplicates
const emailMap = new Map();
IMPORTERS.forEach(i => {
  if (!isRealEmail(i.email)) return;
  if (!emailMap.has(i.email)) emailMap.set(i.email, []);
  emailMap.get(i.email).push(i.companyName);
});
const emailDups = [...emailMap.entries()].filter(([, companies]) => companies.length > 1);
console.log(`Importer duplicate email groups: ${emailDups.length}`);
emailDups.forEach(([email, companies]) => console.log(`  ℹ ${email}: ${companies.join(' | ')}`));

// Manufacturer duplicates
const seenMfrKeys = new Map();
allMfrs.forEach(m => {
  const key = String(m.name || m.companyName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!seenMfrKeys.has(key)) seenMfrKeys.set(key, []);
  seenMfrKeys.get(key).push(m.id);
});
const mfrDups = [...seenMfrKeys.entries()].filter(([, ids]) => ids.length > 1);
console.log(`Manufacturer duplicate groups (name): ${mfrDups.length}`);
if (mfrDups.length > 0) mfrDups.forEach(([key, ids]) => console.log(`  ⚠ ${key}: IDs ${ids.join(', ')}`));

// ── SECTION 6: Placeholder Forensics ─────────────────────────
console.log('\n============================================================');
console.log('SECTION 6: PLACEHOLDER FORENSICS (IMPORTERS + MANUFACTURERS)');
console.log('============================================================');

const SYNTHETIC_PHONE_PATTERNS = [
  { p: /^(\+?1)?2345678900$/, label: '+12345678900' },
  { p: /^(\+?0+)$/, label: 'all-zeros' },
  { p: /^(\+?1+)$/, label: 'all-ones' },
  { p: /^(\+?9+)$/, label: 'all-nines' },
  { p: /^1234567890$/, label: '1234567890' },
  { p: /^0987654321$/, label: '0987654321' },
];
const SYNTHETIC_EMAIL_PATTERNS = [
  /sourcing@buyer\.com/i,
  /test@test\./i,
  /example@example\./i,
  /dummy@/i,
  /placeholder@/i,
  /fake@/i,
];

let phonePlaceholders = 0;
let emailPlaceholders = 0;
const allRecords = [...IMPORTERS, ...allMfrs];
allRecords.forEach(r => {
  const phone = String(r.phone || '').replace(/\D/g, '');
  SYNTHETIC_PHONE_PATTERNS.forEach(({ p, label }) => {
    if (p.test(phone)) {
      console.log(`  ⚠ PLACEHOLDER PHONE [${label}]: ${r.companyName || r.name} → ${r.phone}`);
      phonePlaceholders++;
    }
  });
  const email = String(r.email || '');
  SYNTHETIC_EMAIL_PATTERNS.forEach(p => {
    if (p.test(email)) {
      console.log(`  ⚠ PLACEHOLDER EMAIL: ${r.companyName || r.name} → ${email}`);
      emailPlaceholders++;
    }
  });
});

// Check API route source for hardcoded AVANI numbers
const impApiContent = fs.readFileSync(path.resolve('api/importers.js'), 'utf8');
const mfrApiContent = fs.readFileSync(path.resolve('api/manufacturers.js'), 'utf8');
const srcPages = ['src/pages/Importers.jsx', 'src/pages/Manufacturers.jsx', 'src/pages/PrivateDashboard.jsx'];
let srcPlaceholders = 0;
srcPages.forEach(p => {
  if (!fs.existsSync(path.resolve(p))) return;
  const content = fs.readFileSync(path.resolve(p), 'utf8');
  if (content.includes('+12345678900') || content.includes('sourcing@buyer.com')) {
    console.log(`  ⚠ PLACEHOLDER IN SOURCE: ${p}`);
    srcPlaceholders++;
  }
});

console.log(`\nPhone placeholders found: ${phonePlaceholders}`);
console.log(`Email placeholders found: ${emailPlaceholders}`);
console.log(`Source file placeholders: ${srcPlaceholders}`);
const forensicsPass = phonePlaceholders === 0 && emailPlaceholders === 0 && srcPlaceholders === 0;
console.log(`Forensics: ${forensicsPass ? 'CLEAN' : 'FAIL'}`);

// ── SECTION 7: Phone Validation Summary ───────────────────────
console.log('\n============================================================');
console.log('SECTION 7: PHONE VALIDATION');
console.log('============================================================');

const phoneStatuses = { real: 0, notAvailable: 0, placeholder: 0, tooShort: 0 };
IMPORTERS.forEach(i => {
  const p = String(i.phone || '').trim();
  if (!p || p === 'Not Available' || p === 'N/A') { phoneStatuses.notAvailable++; return; }
  const digits = p.replace(/\D/g, '');
  if (digits.length < 7) { phoneStatuses.tooShort++; return; }
  if (/^0+$/.test(digits) || /^1234567890/.test(digits)) { phoneStatuses.placeholder++; return; }
  phoneStatuses.real++;
});
console.log(`\nImporter phone breakdown:`);
console.log(`  Real: ${phoneStatuses.real}`);
console.log(`  Not Available: ${phoneStatuses.notAvailable}`);
console.log(`  Too short / invalid: ${phoneStatuses.tooShort}`);
console.log(`  Placeholder: ${phoneStatuses.placeholder}`);
console.log(`  Total: ${IMPORTERS.length}`);

// ── SECTION 8: Email Validation Summary ───────────────────────
console.log('\n============================================================');
console.log('SECTION 8: EMAIL VALIDATION');
console.log('============================================================');

const emailStatuses = { valid: 0, notAvailable: 0, invalid: 0, placeholder: 0 };
IMPORTERS.forEach(i => {
  const e = String(i.email || '').trim();
  if (!e || e === 'Not Available' || e === 'N/A') { emailStatuses.notAvailable++; return; }
  if (SYNTHETIC_EMAIL_PATTERNS.some(p => p.test(e))) { emailStatuses.placeholder++; return; }
  if (isRealEmail(e)) { emailStatuses.valid++; return; }
  emailStatuses.invalid++;
});
console.log(`\nImporter email breakdown:`);
console.log(`  Valid: ${emailStatuses.valid}`);
console.log(`  Not Available: ${emailStatuses.notAvailable}`);
console.log(`  Invalid format: ${emailStatuses.invalid}`);
console.log(`  Placeholder: ${emailStatuses.placeholder}`);
console.log(`  Total: ${IMPORTERS.length}`);

// ── SECTION 9: Provenance Validation ─────────────────────────
console.log('\n============================================================');
console.log('SECTION 9: PROVENANCE VALIDATION');
console.log('============================================================');

const impProvOk = IMPORTERS.filter(i => i.sourceFile && i.sourceSheet).length;
const impProvFail = IMPORTERS.filter(i => !i.sourceFile || !i.sourceSheet).length;
const mfrProvOk = allMfrs.filter(m => m.sourceFile && m.sourceSheet).length;
const mfrProvFail = allMfrs.filter(m => !m.sourceFile || !m.sourceSheet).length;
console.log(`\nImporters with full provenance: ${impProvOk}/${IMPORTERS.length}`);
console.log(`Importers missing provenance: ${impProvFail}`);
console.log(`Manufacturers with full provenance: ${mfrProvOk}/${allMfrs.length}`);
console.log(`Manufacturers missing provenance: ${mfrProvFail}`);
console.log(`Windows path leaks (importers): ${windowsPathLeak}`);
console.log(`Windows path leaks (manufacturers): ${mfrWindowsPathLeak}`);

// ── SECTION 10: Verification Status Audit ────────────────────
console.log('\n============================================================');
console.log('SECTION 10: VERIFICATION STATUS AUDIT');
console.log('============================================================');

const impVerifCounts = {};
IMPORTERS.forEach(i => {
  const v = i.verificationStatus || 'MISSING';
  impVerifCounts[v] = (impVerifCounts[v] || 0) + 1;
});
console.log('\nImporter verificationStatus distribution (source data, not normalized):');
Object.entries(impVerifCounts).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

const nonStandard = IMPORTERS.filter(i =>
  !['VERIFIED', 'UNVERIFIED', 'NOT_AVAILABLE'].includes(i.verificationStatus)
).length;
console.log(`Non-standard values in source data: ${nonStandard} (normalized to UNVERIFIED at API layer)`);

const mfrVerifCounts = {};
allMfrs.forEach(m => {
  const v = m.verificationStatus || 'MISSING';
  mfrVerifCounts[v] = (mfrVerifCounts[v] || 0) + 1;
});
console.log('\nManufacturer verificationStatus distribution:');
Object.entries(mfrVerifCounts).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

// ── SECTION 11: Country Coverage ─────────────────────────────
console.log('\n============================================================');
console.log('SECTION 11: COUNTRY COVERAGE (21 required)');
console.log('============================================================');

const REQUIRED_COUNTRIES = [
  'USA', 'UK', 'UAE', 'Germany', 'Netherlands', 'Canada', 'Australia',
  'Saudi Arabia', 'Qatar', 'Oman', 'Kuwait', 'Singapore', 'Malaysia', 'Japan',
  'South Korea', 'Vietnam', 'Thailand', 'South Africa', 'Kenya', 'Nigeria', 'Brazil'
];

const countryMap = {};
IMPORTERS.forEach(i => {
  const c = normalizeCountry(i.country);
  countryMap[c] = (countryMap[c] || 0) + 1;
});

console.log('\nRequired country coverage:');
let missingCountries = [];
REQUIRED_COUNTRIES.forEach(c => {
  const count = countryMap[c] || 0;
  const status = count > 0 ? 'PRESENT' : 'MISSING';
  console.log(`  ${status} | ${c}: ${count} records`);
  if (count === 0) missingCountries.push(c);
});

console.log('\nAll countries in production:');
Object.entries(countryMap).sort(([a], [b]) => a.localeCompare(b)).forEach(([c, n]) => {
  console.log(`  ${c}: ${n}`);
});
console.log(`\nTotal countries present: ${Object.keys(countryMap).length}`);
console.log(`Missing required countries: ${missingCountries.length} — ${missingCountries.join(', ') || 'NONE'}`);
const countryTotal = Object.values(countryMap).reduce((s, n) => s + n, 0);
console.log(`Country total cross-check: ${countryTotal} (should equal ${IMPORTERS.length})`);

// ── SECTION 12: Manufacturer Maharashtra Coverage ─────────────
console.log('\n============================================================');
console.log('SECTION 12: MANUFACTURER SCALE + MAHARASHTRA');
console.log('============================================================');

console.log(`\nSmall: ${MANUFACTURERS.small.length} (expected 35 — ${MANUFACTURERS.small.length === 35 ? 'MATCH' : 'DISCREPANCY'})`);
console.log(`Medium: ${MANUFACTURERS.medium.length} (expected 70 — ${MANUFACTURERS.medium.length === 70 ? 'MATCH' : 'DISCREPANCY'})`);
console.log(`Large: ${MANUFACTURERS.large.length} (expected 24 — ${MANUFACTURERS.large.length === 24 ? 'MATCH' : 'DISCREPANCY'})`);
console.log(`Total: ${allMfrs.length} (expected 129 — ${allMfrs.length === 129 ? 'MATCH' : 'DISCREPANCY'})`);
console.log(`Maharashtra: ${maharashtraCount} (expected 100 — ${maharashtraCount === 100 ? 'MATCH' : 'DISCREPANCY'})`);

// ── SECTION 13: API Security (file-level check) ──────────────
console.log('\n============================================================');
console.log('SECTION 13: API SECURITY (FILE-LEVEL)');
console.log('============================================================');

const apiFiles = ['api/importers.js', 'api/manufacturers.js'];
apiFiles.forEach(f => {
  const content = fs.readFileSync(path.resolve(f), 'utf8');
  const has401 = content.includes('status(401)');
  const hasVerifyGate = content.includes('verifyGateAccess');
  const hasSecret = content.includes('sk_live_') || content.includes('-----BEGIN PRIVATE KEY-----');
  console.log(`\n${f}:`);
  console.log(`  verifyGateAccess: ${hasVerifyGate ? 'PRESENT' : 'MISSING'}`);
  console.log(`  HTTP 401 on reject: ${has401 ? 'PRESENT' : 'MISSING'}`);
  console.log(`  Hardcoded secrets: ${hasSecret ? 'FAIL ⚠' : 'NONE'}`);
});

// ── SECTION 14: Public Site Secret Scan ──────────────────────
console.log('\n============================================================');
console.log('SECTION 14: PUBLIC BUNDLE SECRET SCAN');
console.log('============================================================');

const DANGEROUS_PATTERNS = [
  'MASTER_GATE_PASSWORD=',
  'PRIVATE_PORTAL_PASSWORD=',
  'SESSION_SECRET=',
  'RESEND_API_KEY=',
  'sk_live_',
  '-----BEGIN PRIVATE KEY-----',
];
const distDir = path.resolve('dist');
let bundleSecrets = 0;
if (fs.existsSync(distDir)) {
  function scanDir(d) {
    fs.readdirSync(d, { withFileTypes: true }).forEach(e => {
      const full = path.join(d, e.name);
      if (e.isDirectory()) { scanDir(full); return; }
      const ext = path.extname(e.name);
      if (!['.js', '.html', '.css', '.map'].includes(ext)) return;
      const content = fs.readFileSync(full, 'utf8');
      DANGEROUS_PATTERNS.forEach(pat => {
        if (content.includes(pat)) {
          console.log(`  ⚠ SECRET IN BUNDLE: ${full.replace(distDir, 'dist')} — ${pat}`);
          bundleSecrets++;
        }
      });
    });
  }
  scanDir(distDir);
} else {
  console.log('  dist/ not found — build required first');
}
console.log(`\nBundle secret occurrences: ${bundleSecrets} (expected 0)`);

// ── SECTION 15: Build Artifact Check ─────────────────────────
console.log('\n============================================================');
console.log('SECTION 15: BUILD ARTIFACT CHECK');
console.log('============================================================');

const indexHtml = path.resolve('dist/index.html');
const assetsDir = path.resolve('dist/assets');
const buildExists = fs.existsSync(indexHtml);
const assetsExist = fs.existsSync(assetsDir);
console.log(`\ndist/index.html: ${buildExists ? 'EXISTS' : 'MISSING'}`);
console.log(`dist/assets/: ${assetsExist ? 'EXISTS' : 'MISSING'}`);
if (buildExists) {
  const stat = fs.statSync(indexHtml);
  console.log(`  index.html size: ${stat.size} bytes (non-empty: ${stat.size > 100 ? 'YES' : 'NO'})`);
}

// ── FINAL SUMMARY ─────────────────────────────────────────────
console.log('\n============================================================');
console.log('ACCEPTANCE SUMMARY');
console.log('============================================================');

const checks = [
  ['Importers count = 642 (612 baseline + 30 researched)', IMPORTERS.length === 642],
  ['Manufacturers total = 129', allMfrs.length === 129],
  ['Small = 35', MANUFACTURERS.small.length === 35],
  ['Medium = 70', MANUFACTURERS.medium.length === 70],
  ['Large = 24', MANUFACTURERS.large.length === 24],
  ['Maharashtra = 100', maharashtraCount === 100],
  ['Countries >= 21', Object.keys(countryMap).length >= 21],
  ['All 21 required countries present', missingCountries.length === 0],
  ['Country total = 642', countryTotal === IMPORTERS.length],
  ['Real email count = 331', realEmails === 331],
  ['Real phone count = 338', realPhones === 338],
  ['Valid website count = 448', validWebsites === 448],
  ['Importer provenance 100%', impProvFail === 0],
  ['Manufacturer provenance 100%', mfrProvFail === 0],
  ['No Windows path leaks', windowsPathLeak === 0 && mfrWindowsPathLeak === 0],
  ['Placeholder forensics CLEAN', forensicsPass],
  ['No bundle secrets', bundleSecrets === 0],
  ['API 401 gate (importers)', impApiContent.includes('status(401)')],
  ['API 401 gate (manufacturers)', mfrApiContent.includes('status(401)')],
  ['Build artifacts exist', buildExists && assetsExist],
  ['No importer company+country duplicates', impDupGroups === 0],
  ['No manufacturer name duplicates', mfrDups.length === 0],
];

let passed = 0; let failed = 0;
checks.forEach(([name, result]) => {
  console.log(`  [${result ? 'PASS' : 'FAIL'}] ${name}`);
  if (result) passed++; else failed++;
});

console.log(`\nTotal: ${passed} PASS, ${failed} FAIL`);
console.log(`\nFINAL ACCEPTANCE: ${failed === 0 ? 'PRODUCTION ACCEPTED — ALL 21 REQUIRED COUNTRIES & 22 ACCEPTANCE CRITERIA MET' : 'BLOCKED — ' + failed + ' criterion/criteria failed'}`);
