const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const ignore = ['node_modules', '.git', 'dist', 'brain', 'telemetry_backup'];

let findings = [];

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (ignore.includes(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      scanDir(full);
    } else if (e.isFile()) {
      const rel = path.relative(ROOT, full);
      const isEnvFile = path.basename(full).startsWith('.env');
      const isScratch = full.includes('scratch');
      const isTestScript = full.includes('test_phase_');
      
      const content = fs.readFileSync(full, 'utf8');
      
      const patterns = [
        { name: 'Private Key', regex: /-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/ },
        { name: 'AWS Access Key', regex: /AKIA[0-9A-Z]{16}/ },
        { name: 'Generic Secret Token', regex: /(?:api_key|apikey|secret|password|bearer|auth_token)\s*[:=]\s*['\"][a-zA-Z0-9_\-\.]{20,}['\"]/i }
      ];

      for (const p of patterns) {
        if (p.regex.test(content)) {
          findings.push({ file: rel, type: p.name, inEnvFile: isEnvFile, inTest: isTestScript || isScratch });
        }
      }
    }
  }
}

scanDir(ROOT);
console.log('Total Findings:', findings.length);
findings.forEach(f => console.log('File:', f.file, '| Type:', f.type, '| EnvFile:', f.inEnvFile, '| Test/Scratch:', f.inTest));
