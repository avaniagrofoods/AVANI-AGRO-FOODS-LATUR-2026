const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const dir = 'C:\\Users\\ALPHA-1\\Downloads\\21MAY2026\\SACHIN SHINDE DOCUMENTS\\AVANI AGRO FOODS\\Export Calaculation Sheet';

const files = fs.readdirSync(dir).filter(f => f.endsWith('.xlsx'));

console.log(`Found ${files.length} XLSX files in calculation directory.\n`);

const summary = [];

for (const file of files) {
  const filePath = path.join(dir, file);
  try {
    const wb = XLSX.readFile(filePath);
    const sheetNames = wb.SheetNames;
    
    const sheetDetails = sheetNames.map(name => {
      const sheet = wb.Sheets[name];
      const range = sheet['!ref'] || 'empty';
      const cellCount = Object.keys(sheet).filter(k => !k.startsWith('!')).length;
      return { name, range, cellCount };
    });

    summary.push({
      file,
      sheets: sheetDetails
    });
  } catch (err) {
    summary.push({ file, error: err.message });
  }
}

console.log(JSON.stringify(summary, null, 2));
