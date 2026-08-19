const path = require('path');
const XLSX = require('xlsx');

const dir = 'C:\\Users\\ALPHA-1\\Downloads\\21MAY2026\\SACHIN SHINDE DOCUMENTS\\AVANI AGRO FOODS\\Export Calaculation Sheet';
const file = 'Avani_Agro_Foods_product_costing_sheet_request-Genspark_AI_Sheets-20260728_1208.xlsx';

const wb = XLSX.readFile(path.join(dir, file));
console.log('SHEETS:', wb.SheetNames);

for (const name of wb.SheetNames) {
  console.log(`\n======================================================`);
  console.log(`SHEET: ${name}`);
  console.log(`======================================================`);
  const sheet = wb.Sheets[name];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
  console.log(rows.slice(0, 35).map((r, i) => `R${i+1}: ${JSON.stringify(r)}`).join('\n'));
}
