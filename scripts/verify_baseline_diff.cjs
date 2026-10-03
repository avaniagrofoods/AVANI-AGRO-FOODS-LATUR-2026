// ============================================================
// AVANI AGRO FOODS — Baseline Structural Diff & Snapshot Verifier
// Proves 100% field-by-field preservation between snapshot and current dataset
// ============================================================

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const assert = require('assert');

// 1. Snapshot verification
const snapshotPath = path.resolve('api/_data/importersData.snapshot-642.json');
const metaPath = path.resolve('scripts/snapshot_642_metadata.json');

const snapshotRaw = fs.readFileSync(snapshotPath, 'utf8');
const snapshotBuf = fs.readFileSync(snapshotPath);
const snapshot = JSON.parse(snapshotRaw);
const snapshotHash = crypto.createHash('sha256').update(snapshotBuf).digest('hex');

const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));

assert.strictEqual(snapshotBuf.length, meta.sizeBytes, `Snapshot size mismatch: ${snapshotBuf.length} !== ${meta.sizeBytes}`);
assert.strictEqual(snapshotHash, meta.sha256, `Snapshot SHA-256 mismatch: ${snapshotHash} !== ${meta.sha256}`);
assert.strictEqual(snapshot.length, meta.recordCount, `Snapshot recordCount mismatch: ${snapshot.length} !== ${meta.recordCount}`);
console.log('[PASS] Snapshot file bytes and SHA-256 match snapshot_642_metadata.json exactly.');

// 2. Baseline 612 backup verification
const backup612Path = path.resolve('api/_data/importersData.backup-612.json');
const backup612Buf = fs.readFileSync(backup612Path);
const backup612 = JSON.parse(backup612Buf.toString('utf8'));
const backup612Hash = crypto.createHash('sha256').update(backup612Buf).digest('hex');
const EXPECTED_BACKUP_612_JSON_HASH = '3ee00a4928d97dd3fcc98763c97052969224cd1f6503ef69745acf3ee7ea91c1';

assert.strictEqual(backup612.length, 612, 'Backup 612 must contain 612 records');
assert.strictEqual(backup612Hash, EXPECTED_BACKUP_612_JSON_HASH, 'Backup 612 JSON SHA-256 matches commit 9ab9fae');
console.log('[PASS] Baseline 612-record backup JSON verified (3ee00a4928d97dd3fcc98763c97052969224cd1f6503ef69745acf3ee7ea91c1).');

// 3. Structural comparison between snapshot-642 and api/_data/importersData.js
const currentRaw = fs.readFileSync(path.resolve('api/_data/importersData.js'), 'utf8');
const currentMatch = currentRaw.match(/export const IMPORTERS = (\[[\s\S]*?\]);/);
assert(currentMatch, 'Could not parse IMPORTERS array from api/_data/importersData.js');
const current = JSON.parse(currentMatch[1]);

let added = 0;
let deleted = 0;
let modified = 0;
let reordered = 0;
const diffDetails = [];

const maxLen = Math.max(snapshot.length, current.length);
for (let i = 0; i < maxLen; i++) {
  const s = snapshot[i];
  const c = current[i];

  if (!s && c) { added++; continue; }
  if (s && !c) { deleted++; continue; }
  if (s.id !== c.id) { reordered++; }

  const allKeys = new Set([...Object.keys(s), ...Object.keys(c)]);
  let isMod = false;
  for (const k of allKeys) {
    if (JSON.stringify(s[k]) !== JSON.stringify(c[k])) {
      isMod = true;
      diffDetails.push({ index: i, id: s.id, field: k, snapshotVal: s[k], currentVal: c[k] });
    }
  }
  if (isMod) modified++;
}

const diffResult = {
  added,
  deleted,
  modified,
  reordered
};

console.log('Structural Diff Summary:', diffResult);
fs.writeFileSync(path.resolve('scripts/phase2_baseline_diff.json'), JSON.stringify(diffResult, null, 2));

assert.strictEqual(added, 0, 'No records added compared to snapshot');
assert.strictEqual(deleted, 0, 'No records deleted compared to snapshot');
assert.strictEqual(modified, 0, 'No records modified compared to snapshot');
assert.strictEqual(reordered, 0, 'No records reordered compared to snapshot');

console.log('[PASS] Structural diff verified: 0 added, 0 deleted, 0 modified, 0 reordered.');
