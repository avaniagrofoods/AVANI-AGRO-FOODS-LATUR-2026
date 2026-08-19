const path = require('path');
const XLSX = require('xlsx');

const dir = 'C:\\Users\\ALPHA-1\\Downloads\\21MAY2026\\SACHIN SHINDE DOCUMENTS\\AVANI AGRO FOODS\\Export Calaculation Sheet';

const targetFiles = [
  'Module_8_Quotation_AVANI_AGRO_FOODS.xlsx',
  'AVANI_AGRO_FOODS_Sheet13_Quotation_Generator.xlsx',
  'Avani_Agro_Foods_Export_Costing_Workbook-R1.xlsx',
  'Avani_Agro_Foods_product_costing_sheet_request-Genspark_AI_Sheets-20260728_1208.xlsx'
];

for (const file of targetFiles) {
  console.log(`\n======================================================`);
  console.log(`FILE: ${file}`);
  console.log(`======================================================`);
  try {
    const wb = XLSX.readFile(path.join(dir, file));
    for (const sheetName of wb.SheetNames) {
      if (sheetName.toLowerCase().includes('quot') || sheetName.toLowerCase().includes('fob') || sheetName.toLowerCase().includes('cif') || sheetName.toLowerCase().includes('master')) {
        console.log(`\n--- SHEET: ${sheetName} ---`);
        const sheet = wb.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
        console.log(data.slice(0, 30).map((row, idx) => `R${idx+1}: ${JSON.stringify(row)}`).join('\n'));
      }
    }
  } catch (e) {
    console.error(`Error reading ${file}:`, e.message);
  }
}
