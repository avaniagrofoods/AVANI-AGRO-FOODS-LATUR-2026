const fs = require('fs');
const path = require('path');

console.log('--- TEST 2: PHASE 3F AUTHORIZATION GATE ---');

const brainDir = 'C:\\Users\\ALPHA-1\\.gemini\\antigravity\\brain\\c47ae283-a95c-4ba0-90ce-6297b044189f';
const gateData = JSON.parse(fs.readFileSync(path.join(brainDir, 'PHASE_3F_GATE_MATRIX.json'), 'utf8'));
const pilotData = JSON.parse(fs.readFileSync(path.join(brainDir, 'PHASE_3F_PILOT_MANIFEST.json'), 'utf8'));

const f2Gate = gateData.find(g => g.gateId === 'GATE_F2');
if (!f2Gate || f2Gate.result !== 'PASS') {
  throw new Error('GATE_F2 Authorization State check failed');
}

if (pilotData.outreachAuthorizedState !== 0) {
  throw new Error(`Pilot manifest outreachAuthorizedState must be 0, got ${pilotData.outreachAuthorizedState}`);
}

if (pilotData.globalOutreachStopState !== 1) {
  throw new Error(`Pilot manifest globalOutreachStopState must be 1, got ${pilotData.globalOutreachStopState}`);
}

if (pilotData.status !== 'PILOT_NOT_AUTHORIZED') {
  throw new Error(`Pilot status must be PILOT_NOT_AUTHORIZED, got ${pilotData.status}`);
}

// Simulate barrier check
function attemptSend(record) {
  const OUTREACH_AUTHORIZED = pilotData.outreachAuthorizedState;
  const GLOBAL_OUTREACH_STOP = pilotData.globalOutreachStopState;
  
  if (OUTREACH_AUTHORIZED !== 1) return { status: 'BLOCKED', reason: 'OUTREACH_NOT_AUTHORIZED' };
  if (GLOBAL_OUTREACH_STOP === 1) return { status: 'BLOCKED', reason: 'GLOBAL_OUTREACH_STOP_ACTIVE' };
  return { status: 'ALLOWED' };
}

pilotData.candidates.forEach(c => {
  const res = attemptSend(c);
  if (res.status !== 'BLOCKED') {
    throw new Error(`Security breach: attemptSend returned ${res.status} for record ${c.recordId}`);
  }
});

console.log('[PASS] Authorization barrier strictly enforced. All transmissions blocked.');
