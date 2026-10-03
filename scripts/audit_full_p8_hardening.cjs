#!/usr/bin/env node
// ============================================================
// AVANI AGRO FOODS — POST-INTEGRATION AUDIT
// Full Autonomous Audit: Phases 1-10
// Data Quality | Placeholder Scan | Deduplication | Security | Field Completeness
// ============================================================

'use strict';

const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const API_DATA = path.join(ROOT, 'api', '_data');

// ─── Load data ────────────────────────────────────────────────
function loadImporters() {
  const raw = fs.readFileSync(path.join(API_DATA, 'importersData.js'), 'utf8');
  // Extract JSON array
  const match = raw.match(/export const IMPORTERS\s*=\s*(\[[\s\S]*\]);?\s*$/);
  if (!match) throw new Error('Could not parse IMPORTERS from importersData.js');
  return JSON.parse(match[1]);
}

function loadManufacturers() {
  const raw = fs.readFileSync(path.join(API_DATA, 'manufacturersData.js'), 'utf8');
  const match = raw.match(/export const MANUFACTURERS\s*=\s*(\{[\s\S]*\});?\s*$/);
  if (!match) throw new Error('Could not parse MANUFACTURERS from manufacturersData.js');
  return JSON.parse(match[1]);
}

// ─── Placeholder patterns ─────────────────────────────────────
const PLACEHOLDER_PHONES = [
  '+12345678900', '1234567890', '0000000000', '9999999999',
  '1111111111', '0123456789', '+10000000000', '(000) 000-0000',
  '000-000-0000', '123-456-7890', '+1 000-000-0000', '00000 00000',
];
const PLACEHOLDER_EMAILS = [
  'sourcing@buyer.com', 'buyer@example.com', 'info@example.com',
  'contact@example.com', 'test@test.com', 'admin@admin.com',
  'user@user.com', 'sample@sample.com', 'placeholder@placeholder.com',
  'noreply@noreply.com',
];

function isPlaceholderPhone(v) {
  if (!v || v === 'Not Available' || v === 'N/A') return false;
  const normalized = String(v).replace(/[\s\-().]/g, '');
  for (const p of PLACEHOLDER_PHONES) {
    if (normalized === p.replace(/[\s\-().]/g, '')) return true;
  }
  // Detect all-same-digit patterns like 1111111111
  const digits = normalized.replace(/\D/g, '');
  if (digits.length >= 7 && /^(\d)\1+$/.test(digits)) return true;
  // Sequential
  if (digits === '1234567890' || digits === '0123456789') return true;
  return false;
}

function isPlaceholderEmail(v) {
  if (!v || v === 'Not Available' || v === 'N/A') return false;
  const e = String(v).toLowerCase().trim();
  for (const p of PLACEHOLDER_EMAILS) {
    if (e === p.toLowerCase()) return true;
  }
  if (e.includes('example.com') || e.includes('test.com') || 
      e.includes('placeholder') || e.includes('sample.com')) return true;
  return false;
}

function isRealEmail(v) {
  if (!v || v === 'Not Available' || v === 'N/A' || v === '') return false;
  if (isPlaceholderEmail(v)) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim());
}

function isRealPhone(v) {
  if (!v || v === 'Not Available' || v === 'N/A' || v === '') return false;
  if (isPlaceholderPhone(v)) return false;
  const digits = String(v).replace(/\D/g, '');
  return digits.length >= 7;
}

function isRealWebsite(v) {
  if (!v || v === 'Not Available' || v === 'N/A' || v === '') return false;
  return /^https?:\/\/.+\..+/.test(String(v).trim());
}

// ─── PHASE 1: Source File Discovery ──────────────────────────
function phase1_sourceDiscovery() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  PHASE 1 — SOURCE FILE DISCOVERY                        ║');
  console.log('╚══════════════════════════════════════════════════════════╝');

  const importerDir = path.resolve('C:\\Users\\ALPHA-1\\Downloads\\21MAY2026\\SACHIN SHINDE DOCUMENTS\\AVANI AGRO FOODS\\Importor Data');
  const manufacturerDir = path.resolve('C:\\Users\\ALPHA-1\\Downloads\\21MAY2026\\SACHIN SHINDE DOCUMENTS\\AVANI AGRO FOODS\\Manufacturer Data');

  const results = { importerFiles: [], manufacturerFiles: [] };

  function scanDir(dir, label, bucket) {
    if (!fs.existsSync(dir)) {
      console.log(`  ⚠ Directory not found: ${dir}`);
      return;
    }
    const entries = fs.readdirSync(dir);
    let found = 0;
    for (const f of entries) {
      const ext = path.extname(f).toLowerCase();
      if (['.xlsx', '.xls', '.csv'].includes(ext)) {
        const fp = path.join(dir, f);
        const stat = fs.statSync(fp);
        bucket.push({
          filename: f,
          path: fp,
          sizeBytes: stat.size,
          sizeKB: (stat.size / 1024).toFixed(1),
          modified: stat.mtime.toISOString().split('T')[0],
          type: label,
        });
        found++;
        console.log(`  ✔ [${label}] ${f} (${(stat.size/1024).toFixed(1)} KB, ${stat.mtime.toISOString().split('T')[0]})`);
      }
    }
    console.log(`  → ${found} spreadsheet files found in ${label} directory`);
  }

  console.log('\n📂 IMPORTER DATA DIRECTORY:');
  scanDir(importerDir, 'IMPORTER', results.importerFiles);

  console.log('\n📂 MANUFACTURER DATA DIRECTORY:');
  scanDir(manufacturerDir, 'MANUFACTURER', results.manufacturerFiles);

  return results;
}

// ─── PHASE 2: Data Quality Audit ─────────────────────────────
function phase2_dataQuality(importers, manufacturers) {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  PHASE 2 — DATA QUALITY AUDIT                           ║');
  console.log('╚══════════════════════════════════════════════════════════╝');

  const report = {
    importers: {
      total: importers.length,
      placeholderPhones: [],
      placeholderEmails: [],
      missingCompany: [],
      missingCountry: [],
      missingProducts: [],
      missingEmail: [],
      missingPhone: [],
      missingWebsite: [],
      suspiciousContacts: [],
    },
    manufacturers: {
      total: 0,
      placeholderPhones: [],
      placeholderEmails: [],
      missingCompany: [],
      suspiciousContacts: [],
    },
  };

  // Check importers
  for (const imp of importers) {
    const id = `ID:${imp.id} ${imp.companyName || '??'}`;

    if (isPlaceholderPhone(imp.phone)) {
      report.importers.placeholderPhones.push({ id, phone: imp.phone });
    }
    if (isPlaceholderEmail(imp.email)) {
      report.importers.placeholderEmails.push({ id, email: imp.email });
    }
    if (!imp.companyName || imp.companyName.trim() === '') {
      report.importers.missingCompany.push(id);
    }
    if (!imp.country || imp.country.trim() === '') {
      report.importers.missingCountry.push(id);
    }
    if (!imp.products || imp.products.trim() === '') {
      report.importers.missingProducts.push(id);
    }
    if (!imp.email || imp.email.trim() === '' || imp.email === 'Not Available') {
      report.importers.missingEmail.push(id);
    }
    if (!imp.phone || imp.phone.trim() === '' || imp.phone === 'Not Available') {
      report.importers.missingPhone.push(id);
    }
    if (!imp.website || imp.website.trim() === '' || imp.website === 'Not Available') {
      report.importers.missingWebsite.push(id);
    }
  }

  // Check manufacturers
  const allMfr = [
    ...(manufacturers.small || []),
    ...(manufacturers.medium || []),
    ...(manufacturers.large || []),
  ];
  report.manufacturers.total = allMfr.length;

  for (const mfr of allMfr) {
    const id = `ID:${mfr.id} ${mfr.companyName || '??'}`;
    if (isPlaceholderPhone(mfr.phone)) {
      report.manufacturers.placeholderPhones.push({ id, phone: mfr.phone });
    }
    if (isPlaceholderEmail(mfr.email)) {
      report.manufacturers.suspiciousContacts.push({ id, email: mfr.email });
    }
    if (!mfr.companyName || mfr.companyName.trim() === '') {
      report.manufacturers.missingCompany.push(id);
    }
  }

  // Print summary
  console.log('\n  IMPORTERS:');
  console.log(`  Total Records: ${report.importers.total}`);
  console.log(`  Placeholder Phones: ${report.importers.placeholderPhones.length}`);
  if (report.importers.placeholderPhones.length > 0) {
    report.importers.placeholderPhones.forEach(x => console.log(`    ⚠ ${x.id} → "${x.phone}"`));
  }
  console.log(`  Placeholder Emails: ${report.importers.placeholderEmails.length}`);
  if (report.importers.placeholderEmails.length > 0) {
    report.importers.placeholderEmails.forEach(x => console.log(`    ⚠ ${x.id} → "${x.email}"`));
  }
  console.log(`  Missing Company Name: ${report.importers.missingCompany.length}`);
  console.log(`  Missing Country: ${report.importers.missingCountry.length}`);
  console.log(`  Missing Products: ${report.importers.missingProducts.length}`);
  console.log(`  Missing Email (blank/NA): ${report.importers.missingEmail.length}`);
  console.log(`  Missing Phone (blank/NA): ${report.importers.missingPhone.length}`);
  console.log(`  Missing Website (blank/NA): ${report.importers.missingWebsite.length}`);

  console.log('\n  MANUFACTURERS:');
  console.log(`  Total Records: ${report.manufacturers.total}`);
  console.log(`  Placeholder Phones: ${report.manufacturers.placeholderPhones.length}`);
  console.log(`  Suspicious Emails: ${report.manufacturers.suspiciousContacts.length}`);
  console.log(`  Missing Company Name: ${report.manufacturers.missingCompany.length}`);

  return report;
}

// ─── PHASE 3: Deduplication ───────────────────────────────────
function phase3_deduplication(importers, manufacturers) {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  PHASE 3 — DEDUPLICATION ANALYSIS                       ║');
  console.log('╚══════════════════════════════════════════════════════════╝');

  function normalize(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();
  }
  function normPhone(s) {
    return String(s || '').replace(/\D/g, '');
  }
  function normEmail(s) {
    return String(s || '').toLowerCase().trim();
  }
  function domainOf(email) {
    const m = String(email || '').match(/@([^@]+)$/);
    return m ? m[1].toLowerCase() : '';
  }

  const dupReport = { importers: { byName: [], byEmail: [], byPhone: [] }, manufacturers: { byName: [] } };

  // Importers by company+country
  const byNameCountry = {};
  for (const imp of importers) {
    const key = normalize(imp.companyName) + '|' + normalize(imp.country);
    if (!byNameCountry[key]) byNameCountry[key] = [];
    byNameCountry[key].push(imp.id);
  }
  for (const [key, ids] of Object.entries(byNameCountry)) {
    if (ids.length > 1) dupReport.importers.byName.push({ key, ids });
  }

  // Importers by email
  const byEmail = {};
  for (const imp of importers) {
    if (!isRealEmail(imp.email)) continue;
    const key = normEmail(imp.email);
    if (!byEmail[key]) byEmail[key] = [];
    byEmail[key].push(imp.id);
  }
  for (const [email, ids] of Object.entries(byEmail)) {
    if (ids.length > 1) dupReport.importers.byEmail.push({ email, ids });
  }

  // Importers by phone
  const byPhone = {};
  for (const imp of importers) {
    if (!isRealPhone(imp.phone)) continue;
    const key = normPhone(imp.phone);
    if (key.length < 7) continue;
    if (!byPhone[key]) byPhone[key] = [];
    byPhone[key].push(imp.id);
  }
  for (const [phone, ids] of Object.entries(byPhone)) {
    if (ids.length > 1) dupReport.importers.byPhone.push({ phone, ids });
  }

  // Manufacturers by name
  const allMfr = [
    ...(manufacturers.small || []),
    ...(manufacturers.medium || []),
    ...(manufacturers.large || []),
  ];
  const byMfrName = {};
  for (const m of allMfr) {
    const key = normalize(m.companyName);
    if (!byMfrName[key]) byMfrName[key] = [];
    byMfrName[key].push(m.id);
  }
  for (const [key, ids] of Object.entries(byMfrName)) {
    if (ids.length > 1) dupReport.manufacturers.byName.push({ key, ids });
  }

  console.log('\n  IMPORTERS:');
  console.log(`  Duplicate company+country groups: ${dupReport.importers.byName.length}`);
  if (dupReport.importers.byName.length > 0) {
    dupReport.importers.byName.slice(0, 10).forEach(d => console.log(`    ⚠ "${d.key}" → IDs: ${d.ids.join(', ')}`));
    if (dupReport.importers.byName.length > 10) console.log(`    ... and ${dupReport.importers.byName.length - 10} more`);
  }
  console.log(`  Duplicate email groups: ${dupReport.importers.byEmail.length}`);
  if (dupReport.importers.byEmail.length > 0) {
    dupReport.importers.byEmail.slice(0, 10).forEach(d => console.log(`    ⚠ "${d.email}" → IDs: ${d.ids.join(', ')}`));
  }
  console.log(`  Duplicate phone groups: ${dupReport.importers.byPhone.length}`);
  if (dupReport.importers.byPhone.length > 0) {
    dupReport.importers.byPhone.slice(0, 10).forEach(d => console.log(`    ⚠ "${d.phone}" → IDs: ${d.ids.join(', ')}`));
  }

  console.log('\n  MANUFACTURERS:');
  console.log(`  Duplicate name groups: ${dupReport.manufacturers.byName.length}`);

  return dupReport;
}

// ─── PHASE 4: Field completeness & status distinction ─────────
function phase4_fieldStatus(importers, manufacturers) {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  PHASE 4 — FIELD STATUS & VERIFICATION DISTINCTION      ║');
  console.log('╚══════════════════════════════════════════════════════════╝');

  const requiredFields = [
    'id','companyName','country','city','location','products',
    'contactPerson','jobTitle','email','phone','whatsapp','website',
    'verificationStatus','priority','outreachStatus',
    'source','sourceFile','sourceSheet',
  ];

  const missingFields = {};
  let totalMissing = 0;
  for (const f of requiredFields) missingFields[f] = 0;

  for (const imp of importers) {
    for (const f of requiredFields) {
      const v = imp[f];
      if (v === undefined || v === null || v === '') {
        missingFields[f]++;
        totalMissing++;
      }
    }
  }

  console.log('\n  Required field gaps (importers):');
  let anyGap = false;
  for (const [f, count] of Object.entries(missingFields)) {
    if (count > 0) {
      console.log(`  ⚠ "${f}": missing in ${count} records`);
      anyGap = true;
    }
  }
  if (!anyGap) console.log('  ✔ All required fields present across all importer records');

  // Verification distribution
  const vCounts = {};
  for (const imp of importers) {
    const v = imp.verificationStatus || 'MISSING';
    vCounts[v] = (vCounts[v] || 0) + 1;
  }
  console.log('\n  Importer verification status distribution:');
  for (const [v, c] of Object.entries(vCounts)) {
    console.log(`  ${v}: ${c}`);
  }

  // Manufacturer verification
  const allMfr = [
    ...(manufacturers.small || []),
    ...(manufacturers.medium || []),
    ...(manufacturers.large || []),
  ];
  const mvCounts = {};
  for (const m of allMfr) {
    const v = m.verificationStatus || 'MISSING';
    mvCounts[v] = (mvCounts[v] || 0) + 1;
  }
  console.log('\n  Manufacturer verification status distribution:');
  for (const [v, c] of Object.entries(mvCounts)) {
    console.log(`  ${v}: ${c}`);
  }

  return { missingFields, totalMissing };
}

// ─── PHASE 5: Contactability Scores ──────────────────────────
function phase5_contactability(importers) {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  PHASE 5 — CONTACTABILITY ANALYSIS                      ║');
  console.log('╚══════════════════════════════════════════════════════════╝');

  let highCount = 0, medCount = 0, lowCount = 0, zeroCount = 0;
  let emailAvail = 0, phoneAvail = 0, whatsappAvail = 0, websiteAvail = 0;

  for (const imp of importers) {
    const e = isRealEmail(imp.email);
    const p = isRealPhone(imp.phone);
    const w = isRealPhone(imp.whatsapp);
    const ws = isRealWebsite(imp.website);

    if (e) emailAvail++;
    if (p) phoneAvail++;
    if (w) whatsappAvail++;
    if (ws) websiteAvail++;

    const score = (e ? 1 : 0) + (p ? 1 : 0) + (ws ? 1 : 0);
    if (score >= 3) highCount++;
    else if (score === 2) medCount++;
    else if (score === 1) lowCount++;
    else zeroCount++;
  }

  const total = importers.length;
  console.log(`\n  Email Available: ${emailAvail} / ${total} (${(100*emailAvail/total).toFixed(1)}%)`);
  console.log(`  Phone Available: ${phoneAvail} / ${total} (${(100*phoneAvail/total).toFixed(1)}%)`);
  console.log(`  WhatsApp Available: ${whatsappAvail} / ${total} (${(100*whatsappAvail/total).toFixed(1)}%)`);
  console.log(`  Website Available: ${websiteAvail} / ${total} (${(100*websiteAvail/total).toFixed(1)}%)`);
  console.log(`\n  Contactability Bands:`);
  console.log(`  HIGH (3+ channels): ${highCount}`);
  console.log(`  MEDIUM (2 channels): ${medCount}`);
  console.log(`  LOW (1 channel): ${lowCount}`);
  console.log(`  ZERO (no usable contact): ${zeroCount}`);

  return { emailAvail, phoneAvail, whatsappAvail, websiteAvail, highCount, medCount, lowCount, zeroCount };
}

// ─── PHASE 6: Product Fit ─────────────────────────────────────
function phase6_productFit(importers) {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  PHASE 6 — PRODUCT FIT ANALYSIS                         ║');
  console.log('╚══════════════════════════════════════════════════════════╝');

  let morYes=0, morNo=0, morUnk=0;
  let onYes=0, onNo=0, onUnk=0;
  let both=0;

  for (const imp of importers) {
    const mi = String(imp.moringaInterest || '').toUpperCase();
    const ri = String(imp.redOnionInterest || '').toUpperCase();
    const mYes = mi === 'YES' || mi === 'HIGH' || mi === 'POTENTIAL';
    const rYes = ri === 'YES' || ri === 'HIGH' || ri === 'POTENTIAL';
    if (mi === 'HIGH' || mi === 'YES') morYes++;
    else if (mi === 'POTENTIAL') morYes++;
    else if (mi === 'NO') morNo++;
    else morUnk++;
    if (ri === 'HIGH' || ri === 'YES') onYes++;
    else if (ri === 'POTENTIAL') onYes++;
    else if (ri === 'NO') onNo++;
    else onUnk++;
    if (mYes && rYes) both++;
  }

  console.log(`\n  Moringa Interest YES/POTENTIAL: ${morYes}`);
  console.log(`  Moringa Interest NO: ${morNo}`);
  console.log(`  Moringa Interest UNKNOWN: ${morUnk}`);
  console.log(`  Red Onion Interest YES/POTENTIAL: ${onYes}`);
  console.log(`  Red Onion Interest NO: ${onNo}`);
  console.log(`  Red Onion Interest UNKNOWN: ${onUnk}`);
  console.log(`  Both Moringa + Red Onion: ${both}`);

  return { morYes, morNo, morUnk, onYes, onNo, onUnk, both };
}

// ─── PHASE 8: Data Provenance Check ──────────────────────────
function phase8_provenance(importers, manufacturers) {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  PHASE 8 — DATA PROVENANCE CHECK                        ║');
  console.log('╚══════════════════════════════════════════════════════════╝');

  let impMissingProv = 0;
  const pathLeakPatterns = ['C:\\', 'C:/', 'Users\\', 'ALPHA-1', '/home/', 'Downloads'];

  for (const imp of importers) {
    if (!imp.sourceFile || !imp.sourceSheet) impMissingProv++;
    for (const f of ['sourceFile', 'sourceSheet', 'notes', 'address']) {
      const v = String(imp[f] || '');
      for (const p of pathLeakPatterns) {
        if (v.includes(p)) {
          console.log(`  ⚠ PATH LEAK in importer ID:${imp.id} field "${f}": "${v}"`);
        }
      }
    }
  }

  const allMfr = [
    ...(manufacturers.small || []),
    ...(manufacturers.medium || []),
    ...(manufacturers.large || []),
  ];
  let mfrMissingProv = 0;
  for (const m of allMfr) {
    if (!m.sourceFile || !m.sourceSheet) mfrMissingProv++;
    for (const f of ['sourceFile', 'sourceSheet', 'notes', 'address']) {
      const v = String(m[f] || '');
      for (const p of pathLeakPatterns) {
        if (v.includes(p)) {
          console.log(`  ⚠ PATH LEAK in manufacturer ID:${m.id} field "${f}": "${v}"`);
        }
      }
    }
  }

  console.log(`  Importers missing sourceFile/sourceSheet: ${impMissingProv}`);
  console.log(`  Manufacturers missing sourceFile/sourceSheet: ${mfrMissingProv}`);
  if (impMissingProv === 0 && mfrMissingProv === 0) {
    console.log('  ✔ All records have provenance data');
  }
}

// ─── PHASE 10: Placeholder Forensics ─────────────────────────
function phase10_placeholderForensics(importers, manufacturers) {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  PHASE 10 — PLACEHOLDER FORENSICS                       ║');
  console.log('╚══════════════════════════════════════════════════════════╝');

  const SCAN_STRINGS = [
    '+12345678900', '1234567890', '0000000000', 'sourcing@buyer.com',
    '9999999999', '1111111111', 'buyer@example.com', 'test@test.com',
    'admin@admin.com', '123-456-7890', '000-000-0000',
  ];

  const allMfr = [
    ...(manufacturers.small || []),
    ...(manufacturers.medium || []),
    ...(manufacturers.large || []),
  ];

  const findings = [];

  function scanRecord(record, type) {
    const serialized = JSON.stringify(record).toLowerCase();
    for (const needle of SCAN_STRINGS) {
      if (serialized.includes(needle.toLowerCase())) {
        findings.push({ type, id: record.id, needle, record: record.companyName });
      }
    }
  }

  for (const imp of importers) scanRecord(imp, 'IMPORTER');
  for (const m of allMfr) scanRecord(m, 'MANUFACTURER');

  // Also scan the source JS files themselves
  const files = [
    path.join(API_DATA, 'importersData.js'),
    path.join(API_DATA, 'manufacturersData.js'),
  ];

  const fileFindingsMap = {};
  for (const fp of files) {
    const content = fs.readFileSync(fp, 'utf8').toLowerCase();
    for (const needle of SCAN_STRINGS) {
      if (content.includes(needle.toLowerCase())) {
        if (!fileFindingsMap[fp]) fileFindingsMap[fp] = [];
        fileFindingsMap[fp].push(needle);
      }
    }
  }

  console.log('\n  Specific pattern scan:');
  const scanResults = {};
  for (const needle of ['+12345678900', 'sourcing@buyer.com', '1234567890', '0000000000']) {
    const found = findings.some(f => f.needle === needle);
    const fileFound = Object.values(fileFindingsMap).some(arr => arr.includes(needle));
    const status = (found || fileFound) ? '⚠ FOUND' : '✔ NOT FOUND';
    scanResults[needle] = { status, found: found || fileFound };
    console.log(`  ${needle}: ${status}`);
  }

  if (findings.length === 0 && Object.keys(fileFindingsMap).length === 0) {
    console.log('\n  ✔ ZERO placeholder patterns detected in dataset');
  } else {
    console.log(`\n  ⚠ Total placeholder findings in records: ${findings.length}`);
    findings.slice(0, 20).forEach(f => 
      console.log(`    [${f.type}] ID:${f.id} "${f.record}" → "${f.needle}"`)
    );
    console.log('\n  ⚠ Placeholder findings in source files:');
    for (const [fp, needles] of Object.entries(fileFindingsMap)) {
      console.log(`    ${path.basename(fp)}: ${needles.join(', ')}`);
    }
  }

  return { findings, scanResults, fileFindingsMap };
}

// ─── FINAL SUMMARY ────────────────────────────────────────────
function printFinalSummary(importers, manufacturers, dqReport, dupReport, contactStats, placeholderResult) {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  FINAL AUDIT SUMMARY                                     ║');
  console.log('╚══════════════════════════════════════════════════════════╝');

  const allMfr = [
    ...(manufacturers.small || []),
    ...(manufacturers.medium || []),
    ...(manufacturers.large || []),
  ];

  const countries = new Set(importers.map(i => i.country).filter(Boolean));

  let realEmailCount = 0, realPhoneCount = 0, realWebsiteCount = 0;
  let verifiedCount = 0, unverifiedCount = 0, notAvailableCount = 0;

  for (const imp of importers) {
    if (isRealEmail(imp.email)) realEmailCount++;
    if (isRealPhone(imp.phone)) realPhoneCount++;
    if (isRealWebsite(imp.website)) realWebsiteCount++;
    const vs = String(imp.verificationStatus || '');
    if (vs === 'VERIFIED') verifiedCount++;
    else if (vs === 'UNVERIFIED') unverifiedCount++;
    else notAvailableCount++;
  }

  const dupCount = dupReport.importers.byName.reduce((s,d) => s + d.ids.length - 1, 0)
    + dupReport.importers.byEmail.reduce((s,d) => s + d.ids.length - 1, 0)
    + dupReport.importers.byPhone.reduce((s,d) => s + d.ids.length - 1, 0);

  const placeholderQuarantined = placeholderResult.findings.length;

  console.log('\n  SOURCE DATA:');
  console.log(`  Unique Importers: ${importers.length}`);
  console.log(`  Unique Manufacturers: ${allMfr.length}`);
  console.log(`    Small: ${(manufacturers.small||[]).length}`);
  console.log(`    Medium: ${(manufacturers.medium||[]).length}`);
  console.log(`    Large: ${(manufacturers.large||[]).length}`);
  console.log(`  Countries (importers): ${countries.size}`);
  console.log(`  Countries list: ${[...countries].sort().join(', ')}`);

  console.log('\n  CONTACT QUALITY:');
  console.log(`  Real Email Count: ${realEmailCount}`);
  console.log(`  Real Phone Count: ${realPhoneCount}`);
  console.log(`  Valid Website Count: ${realWebsiteCount}`);

  console.log('\n  VERIFICATION:');
  console.log(`  VERIFIED: ${verifiedCount}`);
  console.log(`  UNVERIFIED: ${unverifiedCount}`);
  console.log(`  NOT_AVAILABLE / OTHER: ${notAvailableCount}`);

  console.log('\n  DEDUPLICATION:');
  console.log(`  Duplicate groups (company+country): ${dupReport.importers.byName.length}`);
  console.log(`  Duplicate groups (email): ${dupReport.importers.byEmail.length}`);
  console.log(`  Duplicate groups (phone): ${dupReport.importers.byPhone.length}`);
  console.log(`  Estimated redundant entries: ${dupCount}`);

  console.log('\n  PLACEHOLDER SCAN:');
  for (const [needle, result] of Object.entries(placeholderResult.scanResults)) {
    console.log(`  "${needle}": ${result.status}`);
  }
  console.log(`  Total placeholder findings quarantined: ${placeholderQuarantined}`);

  console.log('\n  DATA QUALITY ISSUES:');
  console.log(`  Importer placeholder phones: ${dqReport.importers.placeholderPhones.length}`);
  console.log(`  Importer placeholder emails: ${dqReport.importers.placeholderEmails.length}`);
  console.log(`  Importer missing country: ${dqReport.importers.missingCountry.length}`);
  console.log(`  Importer missing products: ${dqReport.importers.missingProducts.length}`);
  console.log(`  Manufacturer placeholder phones: ${dqReport.manufacturers.placeholderPhones.length}`);
}

// ─── MAIN ─────────────────────────────────────────────────────
async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  AVANI AGRO FOODS — POST-INTEGRATION AUDIT               ║');
  console.log('║  Data Quality Hardening | Phases 1-10                   ║');
  console.log(`║  Timestamp: ${new Date().toISOString()}           ║`);
  console.log('╚══════════════════════════════════════════════════════════╝');

  let importers, manufacturers;
  try {
    importers = loadImporters();
    console.log(`\n✔ Loaded ${importers.length} importer records from api/_data/importersData.js`);
  } catch (e) {
    console.error('✗ Failed to load importers:', e.message);
    process.exit(1);
  }

  try {
    manufacturers = loadManufacturers();
    const total = (manufacturers.small||[]).length + (manufacturers.medium||[]).length + (manufacturers.large||[]).length;
    console.log(`✔ Loaded ${total} manufacturer records from api/_data/manufacturersData.js`);
  } catch (e) {
    console.error('✗ Failed to load manufacturers:', e.message);
    process.exit(1);
  }

  // Run all phases
  phase1_sourceDiscovery();
  const dqReport = phase2_dataQuality(importers, manufacturers);
  const dupReport = phase3_deduplication(importers, manufacturers);
  phase4_fieldStatus(importers, manufacturers);
  const contactStats = phase5_contactability(importers);
  phase6_productFit(importers);
  phase8_provenance(importers, manufacturers);
  const placeholderResult = phase10_placeholderForensics(importers, manufacturers);
  printFinalSummary(importers, manufacturers, dqReport, dupReport, contactStats, placeholderResult);

  console.log('\n✅ AUDIT COMPLETE\n');
}

main().catch(e => {
  console.error('AUDIT FATAL ERROR:', e);
  process.exit(1);
});
