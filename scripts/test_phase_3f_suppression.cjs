const fs = require('fs');
const path = require('path');

console.log('--- TEST 3: PHASE 3F SUPPRESSION & DO-NOT-CONTACT ---');

const brainDir = 'C:\\Users\\ALPHA-1\\.gemini\\antigravity\\brain\\c47ae283-a95c-4ba0-90ce-6297b044189f';
const suppData = JSON.parse(fs.readFileSync(path.join(brainDir, 'PHASE_3F_SUPPRESSION_MODEL.json'), 'utf8'));

// Verify blocked IDs 4, 7, 29 are suppressed
const blockedIds = [4, 7, 29];
blockedIds.forEach(id => {
  const found = suppData.activeSuppressionList.some(s => s.recordId === id);
  if (!found) throw new Error(`Blocked ID ${id} is missing from active suppression list!`);
});

// Verify purged contaminated channels
const purgedChannels = [
  'pr@arabicalondon.com',
  'ilovehotsauce@heatonist.com',
  'adminwg@mail.mayfirst.org'
];

purgedChannels.forEach(email => {
  const found = suppData.purgedChannels.some(p => p.email === email);
  if (!found) throw new Error(`Purged channel ${email} is missing from purgedChannels!`);
});

console.log('[PASS] Suppression model correctly blocks IDs 4, 7, 29 and purged channels.');
