// ============================================================
// AVANI AGRO FOODS — DIST ASSETS SECRET SCANNER
// Scans compiled frontend assets in dist/ for any bundled secrets
// ============================================================

const fs = require('fs');
const path = require('path');

const DIST_DIR = path.resolve('dist');

const SECRET_PATTERNS = [
  { name: 'CRM_WEBHOOK_SECRET', regex: /CRM_WEBHOOK_SECRET/i },
  { name: 'MASTER_GATE_PASSWORD', regex: /MASTER_GATE_PASSWORD/i },
  { name: 'PRIVATE_PORTAL_PASSWORD', regex: /PRIVATE_PORTAL_PASSWORD/i },
  { name: 'Stripe Live Secret Key', regex: /sk_live_[0-9a-zA-Z]{24,}/ },
  { name: 'Stripe Webhook Secret', regex: /whsec_[0-9a-zA-Z]{24,}/ },
  { name: 'Google Apps Script Deployment ID', regex: /AKfycby[0-9a-zA-Z_-]{40,}/ },
  { name: 'Generic Private Key', regex: /-----BEGIN/ }
];

function scanDist() {
  console.log('============================================================');
  console.log('AVANI AGRO FOODS — DIST ASSETS AUDIT');
  console.log('============================================================\n');

  if (!fs.existsSync(DIST_DIR)) {
    console.error('dist directory does not exist! Run npm run build first.');
    process.exit(1);
  }

  function getFiles(dir) {
    let files = [];
    for (const item of fs.readdirSync(dir)) {
      const fullPath = path.join(dir, item);
      if (fs.statSync(fullPath).isDirectory()) {
        files = files.concat(getFiles(fullPath));
      } else {
        files.push(fullPath);
      }
    }
    return files;
  }

  const allFiles = getFiles(DIST_DIR);
  console.log(`Scanning ${allFiles.length} files in dist/...`);

  let exposures = 0;

  for (const f of allFiles) {
    if (f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.webp') || f.endsWith('.ico')) continue;
    const content = fs.readFileSync(f, 'utf8');

    for (const p of SECRET_PATTERNS) {
      if (p.regex.test(content)) {
        console.error(`  [EXPOSURE] ${path.relative(process.cwd(), f)} contains pattern for ${p.name}`);
        exposures++;
      }
    }
  }

  console.log(`\nDist Scan Complete. Exposures Found: ${exposures}`);
  console.log(`Status: ${exposures === 0 ? 'PASS' : 'FAIL'}`);
  return exposures === 0;
}

const pass = scanDist();
process.exit(pass ? 0 : 1);
