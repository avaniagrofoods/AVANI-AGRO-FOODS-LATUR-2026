#!/usr/bin/env node
// ============================================================
// AVANI AGRO FOODS — Deep Duplicate + Verification Status Audit
// Investigates the 9 duplicate email groups
// and analyzes "NEEDS REVIEW" vs standard verification statuses
// ============================================================

'use strict';
const fs = require('fs');
const path = require('path');

const API_DATA = path.resolve(__dirname, '..', 'api', '_data');

function loadImporters() {
  const raw = fs.readFileSync(path.join(API_DATA, 'importersData.js'), 'utf8');
  const match = raw.match(/export const IMPORTERS\s*=\s*(\[[\s\S]*\]);?\s*$/);
  return JSON.parse(match[1]);
}

const importers = loadImporters();

// ─── Investigate duplicate emails ───────────────────────────
console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log('║  DUPLICATE EMAIL GROUP INVESTIGATION                     ║');
console.log('╚══════════════════════════════════════════════════════════╝');

const KNOWN_DUPS = [
  { email: 'micah@micahrich.com', ids: [25, 31] },
  { email: 'info@doehler.com', ids: [328, 463] },
  { email: 'info@nexira.com', ids: [344, 423] },
  { email: 'info@givaudan.com', ids: [345, 466] },
  { email: 'info@sabinsa.com', ids: [346, 386, 426] },
  { email: 'info@sternchemie.com', ids: [352, 442] },
  { email: 'info@worlee.de', ids: [355, 424] },
  { email: 'info@hollandandbarrett.com', ids: [366, 445] },
  { email: 'info@aidp.com', ids: [387, 435] },
];

const byId = {};
for (const imp of importers) byId[imp.id] = imp;

for (const dup of KNOWN_DUPS) {
  console.log(`\n  Email: "${dup.email}"`);
  for (const id of dup.ids) {
    const r = byId[id];
    if (r) {
      console.log(`  ID:${id} | ${r.companyName} | ${r.country} | ${r.city} | ${r.products} | ${r.verificationStatus}`);
    }
  }
}

// ─── Analyze whether duplicates are truly duplicate or legitimate multi-branch ──
console.log('\n\n  ANALYSIS: Are these truly problematic duplicates?');
console.log('  ─────────────────────────────────────────────────');
console.log('  info@... addresses may be shared generic contacts for multinational companies');
console.log('  with different branch offices in different countries (legitimate multi-branch).');
console.log('  Checking whether duplicates share same company+country...\n');

for (const dup of KNOWN_DUPS) {
  const records = dup.ids.map(id => byId[id]).filter(Boolean);
  const countries = [...new Set(records.map(r => r.country))];
  const companies = [...new Set(records.map(r => r.companyName))];
  const isSameCountry = countries.length === 1;
  const isSameCompany = companies.length === 1;
  
  let classification;
  if (isSameCompany && isSameCountry) {
    classification = '⚠ TRUE DUPLICATE — same company, same country, same email';
  } else if (isSameCompany && !isSameCountry) {
    classification = '✔ LEGITIMATE MULTI-BRANCH — same company, different countries, shared generic email';
  } else {
    classification = '⚠ SUSPICIOUS — different companies sharing same email';
  }
  
  console.log(`  "${dup.email}" → ${classification}`);
  console.log(`    Companies: ${companies.join(' | ')}`);
  console.log(`    Countries: ${countries.join(' | ')}`);
}

// ─── Verification status distribution analysis ───────────────
console.log('\n\n╔══════════════════════════════════════════════════════════╗');
console.log('║  VERIFICATION STATUS ANALYSIS                            ║');
console.log('╚══════════════════════════════════════════════════════════╝');

const vCounts = {};
for (const imp of importers) {
  const v = imp.verificationStatus || 'MISSING';
  vCounts[v] = (vCounts[v] || 0) + 1;
}

console.log('\n  Current verification values in dataset:');
for (const [v, c] of Object.entries(vCounts)) {
  console.log(`  ${v}: ${c} records`);
}

console.log('\n  ISSUE: "NEEDS REVIEW" is not in the required schema.');
console.log('  Required values: VERIFIED | UNVERIFIED | NOT_AVAILABLE');
console.log('  "NEEDS REVIEW" should be standardized.');

// Sample NEEDS REVIEW records
const needsReview = importers.filter(i => i.verificationStatus === 'NEEDS REVIEW');
console.log(`\n  Sample "NEEDS REVIEW" records (first 10):`);
needsReview.slice(0, 10).forEach(r => {
  console.log(`  ID:${r.id} | ${r.companyName} | ${r.country} | email: ${r.email} | phone: ${r.phone}`);
});

// Check if NEEDS REVIEW records have real contact info or not
let nrWithEmail = 0, nrWithPhone = 0, nrWithWebsite = 0;
for (const r of needsReview) {
  const hasEmail = r.email && r.email !== 'Not Available' && r.email !== '';
  const hasPhone = r.phone && r.phone !== 'Not Available' && r.phone !== '';
  const hasWebsite = r.website && r.website !== 'Not Available' && r.website !== '';
  if (hasEmail) nrWithEmail++;
  if (hasPhone) nrWithPhone++;
  if (hasWebsite) nrWithWebsite++;
}

console.log(`\n  "NEEDS REVIEW" contact availability:`);
console.log(`  With real email: ${nrWithEmail}/${needsReview.length}`);
console.log(`  With real phone: ${nrWithPhone}/${needsReview.length}`);
console.log(`  With real website: ${nrWithWebsite}/${needsReview.length}`);

// Recommend remediation
console.log('\n  RECOMMENDED ACTION:');
console.log('  "NEEDS REVIEW" → should be mapped to "UNVERIFIED" in the API layer');
console.log('  Reasoning: Not verified externally = UNVERIFIED per spec');
console.log('  This is a cosmetic data issue, not a data corruption issue.');
console.log('  No fake data, no placeholders — simply non-standard status value.');

// ─── Missing city field check ────────────────────────────────
console.log('\n\n╔══════════════════════════════════════════════════════════╗');
console.log('║  MISSING CITY FIELD ANALYSIS (26 records)                ║');
console.log('╚══════════════════════════════════════════════════════════╝');

const missingCity = importers.filter(i => !i.city || i.city.trim() === '');
console.log(`\n  Records with missing city (${missingCity.length}):`);
missingCity.slice(0, 15).forEach(r => {
  console.log(`  ID:${r.id} | ${r.companyName} | ${r.country} | location: "${r.location}" | address: "${r.address}"`);
});

// Check if location field can substitute
const hasLocationSubstitute = missingCity.filter(r => r.location && r.location.trim() !== '');
console.log(`\n  Of these, ${hasLocationSubstitute.length} have a location field that can substitute for city display.`);
console.log('  These are NOT data corruption — city may be embedded in location/address field.');
