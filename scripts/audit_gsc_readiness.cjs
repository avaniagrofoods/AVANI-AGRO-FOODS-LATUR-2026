const fs = require('fs');
const path = require('path');

async function main() {
  console.log('============================================================');
  console.log('AVANI AGRO FOODS — GOOGLE VERIFICATION & SEO AUDIT');
  console.log('============================================================\n');

  // 1. Search local repository for verification tags / files
  const findings = [];
  function searchDir(dir) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
      if (['node_modules', 'dist', '.git', '.vercel', 'scratch'].includes(f)) continue;
      const full = path.join(dir, f);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        searchDir(full);
      } else {
        if (/google[0-9a-f]{16}\.html/i.test(f)) {
          findings.push({ file: full, type: 'Verification HTML file' });
        }
        if (/\.(html|jsx?|tsx?|json|txt|md)$/.test(f)) {
          const content = fs.readFileSync(full, 'utf8');
          if (content.includes('google-site-verification')) {
            findings.push({ file: full, type: 'google-site-verification reference' });
          }
        }
      }
    }
  }

  searchDir('.');
  console.log('--- Task 5: Existing Google Verification Check ---');
  if (findings.length === 0) {
    console.log('Repository verification tokens/files: ABSENT');
  } else {
    findings.forEach(f => {
      console.log(`Repository finding: ${f.file} (${f.type})`);
    });
  }

  // 2. Check production HTML
  const prodRes = await fetch('https://www.avaniagrofoods.com/');
  const html = await prodRes.text();
  const hasMeta = html.includes('google-site-verification');
  if (hasMeta) {
    console.log('Production HTML Google verification: VERIFICATION TOKEN PRESENT — VALUE REDACTED');
  } else {
    console.log('Production HTML Google verification: ABSENT');
  }

  // Also check DNS TXT records for google-site-verification
  console.log('\n--- DNS TXT Verification Check ---');
  const dns = require('dns').promises;
  try {
    const txtRecords = await dns.resolveTxt('avaniagrofoods.com');
    const flatTxt = txtRecords.flat();
    const gTxt = flatTxt.filter(r => r.includes('google-site-verification'));
    if (gTxt.length > 0) {
      console.log('DNS TXT Google verification: VERIFICATION TOKEN PRESENT — VALUE REDACTED');
    } else {
      console.log('DNS TXT Google verification: ABSENT');
    }
  } catch (err) {
    console.log('DNS TXT lookup error / not found:', err.message);
  }
}

main().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
