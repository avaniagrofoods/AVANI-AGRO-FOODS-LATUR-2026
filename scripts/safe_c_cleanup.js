// scripts/safe_c_cleanup.js
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const timestamp = new Date().toISOString();
console.log(`[${timestamp}] Starting Safe C: Drive Audit & Cleanup...`);

function getDriveSpace() {
  const output = execSync('powershell -Command "$d = Get-PSDrive C; [math]::Round($d.Free/1GB, 4).ToString() + \',\' + $d.Free.ToString() + \',\' + [math]::Round($d.Used/1GB, 4).ToString() + \',\' + $d.Used.ToString()"', { encoding: 'utf-8' }).trim();
  const [freeGB, freeBytes, usedGB, usedBytes] = output.split(',');
  return { freeGB: parseFloat(freeGB), freeBytes: parseInt(freeBytes), usedGB: parseFloat(usedGB), usedBytes: parseInt(usedBytes) };
}

const before = getDriveSpace();
console.log(`BEFORE CLEANUP: Free ${before.freeGB} GB (${before.freeBytes} bytes), Used ${before.usedGB} GB`);

const auditLog = [];

// 1. Clean _npx cache in AppData/Local/npm-cache/_npx (safe disposable npx run cache)
const npxCacheDir = 'C:\\Users\\ALPHA-1\\AppData\\Local\\npm-cache\\_npx';
if (fs.existsSync(npxCacheDir)) {
  try {
    fs.rmSync(npxCacheDir, { recursive: true, force: true });
    auditLog.push({
      path: npxCacheDir,
      fileType: 'Directory / NPX Temporary Cache',
      size: '~1.66 GB',
      reason: 'Temporary npx downloaded package cache',
      action: 'Safely removed stale _npx cache directory',
      timestamp: new Date().toISOString()
    });
    console.log('Cleaned C:\\Users\\ALPHA-1\\AppData\\Local\\npm-cache\\_npx');
  } catch (err) {
    console.warn('Could not remove npx cache:', err.message);
  }
}

// 2. Clean AppData/Local/Temp safe temporary files (> 1 hour old)
const tempDir = 'C:\\Users\\ALPHA-1\\AppData\\Local\\Temp';
let tempCleanedBytes = 0;
let tempCleanedFiles = 0;
if (fs.existsSync(tempDir)) {
  const entries = fs.readdirSync(tempDir);
  for (const entry of entries) {
    const fullPath = path.join(tempDir, entry);
    try {
      const stat = fs.statSync(fullPath);
      const oneHourAgo = Date.now() - 3600 * 1000;
      if (stat.mtimeMs < oneHourAgo) {
        if (stat.isFile()) {
          tempCleanedBytes += stat.size;
          fs.unlinkSync(fullPath);
          tempCleanedFiles++;
        } else if (stat.isDirectory()) {
          fs.rmSync(fullPath, { recursive: true, force: true });
          tempCleanedFiles++;
        }
      }
    } catch (e) {
      // Ignored: in-use or locked
    }
  }
  auditLog.push({
    path: tempDir,
    fileType: 'Temporary files (>1hr old)',
    size: `${(tempCleanedBytes / (1024 * 1024)).toFixed(2)} MB`,
    reason: 'Temporary application files',
    action: `Removed ${tempCleanedFiles} unlocked files/dirs`,
    timestamp: new Date().toISOString()
  });
  console.log(`Cleaned ${tempCleanedFiles} temp files (${(tempCleanedBytes / (1024 * 1024)).toFixed(2)} MB) from Temp`);
}

// 3. Clean temporary build / test files in workspace (keeping code and databases intact)
const workspace = process.cwd();
const files = fs.readdirSync(workspace);
for (const f of files) {
  if (f.startsWith('vite.config.js.timestamp-')) {
    const fullPath = path.join(workspace, f);
    try {
      const stat = fs.statSync(fullPath);
      fs.unlinkSync(fullPath);
      auditLog.push({
        path: fullPath,
        fileType: 'Stale Build Artifact',
        size: `${stat.size} bytes`,
        reason: 'Temporary vite config timestamp file',
        action: 'Removed file',
        timestamp: new Date().toISOString()
      });
    } catch (e) {}
  }
}

const after = getDriveSpace();
const removedBytes = after.freeBytes - before.freeBytes;
const removedGB = (removedBytes / (1024 * 1024 * 1024)).toFixed(3);

console.log(`AFTER CLEANUP: Free ${after.freeGB} GB (${after.freeBytes} bytes), Used ${after.usedGB} GB`);
console.log(`TOTAL SAFELY REMOVED: ${removedGB} GB (${removedBytes} bytes)`);

const report = {
  beforeFreeGB: before.freeGB,
  beforeFreeBytes: before.freeBytes,
  afterFreeGB: after.freeGB,
  afterFreeBytes: after.freeBytes,
  removedGB: parseFloat(removedGB),
  removedBytes,
  auditLog
};

fs.writeFileSync(path.join(workspace, 'scripts', 'c_cleanup_report.json'), JSON.stringify(report, null, 2));
console.log('Cleanup report saved to scripts/c_cleanup_report.json');
