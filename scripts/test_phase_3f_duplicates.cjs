const fs = require('fs');
const path = require('path');

console.log('--- TEST 4: PHASE 3F DUPLICATE PREVENTION ---');

const brainDir = 'C:\\Users\\ALPHA-1\\.gemini\\antigravity\\brain\\c47ae283-a95c-4ba0-90ce-6297b044189f';
const segData = JSON.parse(fs.readFileSync(path.join(brainDir, 'PHASE_3F_SEGMENT_MAPPING.json'), 'utf8'));
const dupAudit = JSON.parse(fs.readFileSync(path.join(brainDir, 'PHASE_3F_DUPLICATE_AUDIT.json'), 'utf8'));

if (segData.length !== 16) throw new Error(`Expected 16 cohort records, got ${segData.length}`);

const emails = segData.map(r => r.canonicalEmail.toLowerCase());
const uniqueEmails = Array.from(new Set(emails));
if (emails.length !== uniqueEmails.length) {
  throw new Error('Duplicate email detected among cohort records!');
}

const companies = segData.map(r => r.companyName.toLowerCase().trim());
const uniqueCompanies = Array.from(new Set(companies));
if (companies.length !== uniqueCompanies.length) {
  throw new Error('Duplicate company name detected among cohort records!');
}

if (dupAudit.duplicateRecords !== 0 || dupAudit.status !== 'PASS') {
  throw new Error('Duplicate audit artifact failed validation!');
}

console.log('[PASS] Zero duplicates detected. All 16 cohort entities are distinct.');
