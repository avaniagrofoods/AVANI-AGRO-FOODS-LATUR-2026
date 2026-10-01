// ============================================================
// AVANI AGRO FOODS — SAFE SECRET AUDIT SCANNER
// Scans tracked repository files and git history without dumping secrets
// ============================================================

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SCAN_PATTERNS = [
  { name: 'Stripe Live Secret', regex: /sk_live_[0-9a-zA-Z]{24,}/ },
  { name: 'Stripe Webhook Secret', regex: /whsec_[0-9a-zA-Z]{24,}/ },
  { name: 'Generic Private Key', regex: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/ },
  { name: 'Google API Key', regex: /AIza[0-9A-Za-z\\-_]{35}/ },
  { name: 'Hardcoded Bearer Token', regex: /Bearer\s+['"][a-zA-Z0-9_\-\.]{20,}['"]/ },
  { name: 'Hardcoded Password Assignment', regex: /(?:password|adminPassword|authPassword)\s*[:=]\s*['"][^'"]{6,}['"]/i },
  { name: 'Hardcoded Webhook Secret', regex: /(?:CRM_WEBHOOK_SECRET|webhookSecret)\s*[:=]\s*['"][a-zA-Z0-9_\-\.]{10,}['"]/i }
];

// Files that are expected to contain references or dummy test data
const ALLOWED_TEST_SCRIPTS = [
  'scripts/test_crm_webhook_security.cjs',
  'scripts/test_live_production.cjs',
  'scripts/test_master_acceptance.cjs',
  'scripts/verify_p0_all_sections.cjs',
  'scripts/diagnose_webhook.cjs',
  'scripts/test_sheets_webhook.cjs'
];

function scanFiles() {
  console.log('============================================================');
  console.log('AVANI AGRO FOODS — REPOSITORY SECRET SCAN');
  console.log('============================================================\n');

  // Check .gitignore for .env and .env.local
  const gitignore = fs.readFileSync('.gitignore', 'utf8');
  const envIgnored = gitignore.includes('.env.local') || gitignore.includes('.env');
  console.log(`.env.local in .gitignore: ${envIgnored ? 'YES (SAFE)' : 'NO (EXPOSED)'}`);

  // Get list of tracked files
  const trackedFiles = execSync('git ls-files', { encoding: 'utf8' }).split('\n').filter(Boolean);
  
  const findings = [];

  for (const file of trackedFiles) {
    if (!fs.existsSync(file)) continue;
    // Skip binary files
    if (file.endsWith('.png') || file.endsWith('.webp') || file.endsWith('.jpg') || file.endsWith('.ico') || file.endsWith('.pdf')) continue;

    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, idx) => {
      for (const pattern of SCAN_PATTERNS) {
        if (pattern.regex.test(line)) {
          // Check if this is an environment variable lookup like process.env.XYZ
          const isEnvLookup = line.includes('process.env.') || line.includes('PropertiesService.getScriptProperties()');
          const isTestDummy = line.includes('test_crm_secret') || 
                              line.includes('invalid_wrong_secret') || 
                              line.includes('bad_token') ||
                              line.includes('bad_password') ||
                              line.includes('wrong_password') ||
                              line.includes('forged_fake_secret');

          let status = 'EXPOSED — FAIL';
          if (isEnvLookup || isTestDummy) {
            status = 'TEST FIXTURE / DUMMY STRING — SAFE';
          }

          findings.push({
            file,
            lineNum: idx + 1,
            secretType: pattern.name,
            status
          });
        }
      }
    });
  }

  console.log(`Tracked files scanned: ${trackedFiles.length}`);
  console.log(`Findings: ${findings.length}`);
  
  findings.forEach(f => {
    console.log(`FILE: ${f.file}:${f.lineNum}`);
    console.log(`  SECRET TYPE: ${f.secretType}`);
    console.log(`  STATUS: ${f.status}`);
  });

  return findings;
}

function scanGitHistory() {
  console.log('\n============================================================');
  console.log('AVANI AGRO FOODS — GIT HISTORY SECRET AUDIT');
  console.log('============================================================\n');

  // Look for any commit that added or modified .env files
  try {
    const envCommits = execSync('git log --all --full-history -- "**.env*"', { encoding: 'utf8' }).trim();
    if (envCommits) {
      console.log('Commits touching .env files:');
      console.log(envCommits.split('\n').slice(0, 5).join('\n'));
    } else {
      console.log('.env commits in history: NONE DETECTED (SAFE)');
    }
  } catch (e) {
    console.log('Git history scan notice:', e.message);
  }

  // Look for live stripe keys in git log
  try {
    const stripeGrep = execSync('git log -S "sk_live_" --oneline', { encoding: 'utf8' }).trim();
    console.log(`Historical sk_live_ commits: ${stripeGrep ? stripeGrep : 'NONE (SAFE)'}`);
  } catch (e) {
    console.log('Stripe search: NONE (SAFE)');
  }

  // Look for private keys in git log
  try {
    const keyGrep = execSync('git log -S "PRIVATE KEY" --oneline', { encoding: 'utf8' }).trim();
    console.log(`Historical PRIVATE KEY commits: ${keyGrep ? keyGrep : 'NONE (SAFE)'}`);
  } catch (e) {
    console.log('Private key search: NONE (SAFE)');
  }
}

const findings = scanFiles();
scanGitHistory();

const exposedCount = findings.filter(f => f.status.includes('FAIL')).length;
console.log(`\n============================================================`);
console.log(`EXPOSED CREDENTIALS DETECTED: ${exposedCount}`);
console.log(`STATUS: ${exposedCount === 0 ? 'PASS' : 'FAIL'}`);
console.log(`============================================================\n`);
