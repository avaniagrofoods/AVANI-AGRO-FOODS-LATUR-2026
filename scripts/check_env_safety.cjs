const fs = require('fs');

function checkEnv(f) {
  if (!fs.existsSync(f)) return { exists: false };
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  const vars = {};
  lines.forEach(l => {
    const t = l.trim();
    if (t && !t.startsWith('#')) {
      const idx = t.indexOf('=');
      if (idx !== -1) {
        const key = t.slice(0, idx).trim();
        const val = t.slice(idx + 1).trim();
        const isBlank = (val === '""' || val === "''" || val === '');
        vars[key] = isBlank ? 'BLANK' : 'PRESENT';
      }
    }
  });
  return { exists: true, vars };
}

console.log('.env.production.local:', JSON.stringify(checkEnv('.env.production.local'), null, 2));
console.log('.env.vercel:', JSON.stringify(checkEnv('.env.vercel'), null, 2));
console.log('.env.local:', JSON.stringify(checkEnv('.env.local'), null, 2));

