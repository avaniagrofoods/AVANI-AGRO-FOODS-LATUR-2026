const path = require('path');
const XLSX = require('xlsx');

const dir = 'C:\\Users\\ALPHA-1\\Downloads\\21MAY2026\\SACHIN SHINDE DOCUMENTS\\AVANI AGRO FOODS\\Export Calaculation Sheet';

const targetFiles = [
  'Avani Agro Foods - Export Costing System.xlsx',
  'AVANI_AGRO_FOODS_Export_Cost_Calculator_20_Sheets_v1.xlsx',
  'AVANI_AGRO_FOODS_Export_Cost_Calculator_v4.xlsx'
];

for (const file of targetFiles) {
  console.log(`\n======================================================`);
  console.log(`FILE: ${file}`);
  console.log(`======================================================`);
  try {
    const wb = XLSX.readFile(path.join(dir, file));
    for (const sheetName of wb.SheetNames) {
      console.log(`\n--- SHEET: ${sheetName} ---`);
      const sheet = wb.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
      console.log(data.slice(0, 30).map((row, idx) => `R${idx+1}: ${JSON.stringify(row)}`).join('\n'));
    }
  } catch (e) {
    console.error(`Error reading ${file}:`, e.message);
  }
}
