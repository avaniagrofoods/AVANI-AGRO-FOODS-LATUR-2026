// ============================================================
// AVANI AGRO FOODS — SERVER-SIDE QUOTATION ENGINE
// Generates:
// 1. Normalized Quotation Data Structure
// 2. Protected Excel (.xlsx) Quotation File
// 3. Vector PDF (.pdf) Quotation Document
// ============================================================

import ExcelJS from 'exceljs';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export const COMPANY_INFO = {
  name: 'AVANI AGRO FOODS',
  tagline: 'Premium Dehydrated Agro Products & Export Division',
  owner: 'Sachin Shinde',
  phone: '+91 7219053645',
  email: 'sales@avaniagrofoods.com',
  website: 'https://www.avaniagrofoods.com',
  address: 'Old Barshi Road, Kulswamininagar, 5 No Chauk, Next to Sai School, Latur – 413512, Maharashtra, India',
  compliance: 'Udyam Registered | Partner FSSAI, APEDA, IEC & ISO Compliant'
};

export const PRODUCT_CATALOG = {
  'moringa-powder': {
    name: 'Moringa Leaf Powder (Food Grade / Organic)',
    hscode: '12119029',
    unit: 'kg',
    priceInr: 400,
    priceUsd: 4.82,
    packaging: '25 kg Food Grade Laminated HDPE Drums / Vacuum Pouches'
  },
  'red-onion-powder': {
    name: 'Dehydrated Red Onion Powder (Premium Export Grade)',
    hscode: '07122000',
    unit: 'kg',
    priceInr: 800,
    priceUsd: 9.64,
    packaging: '20 kg / 25 kg Poly-lined Corrugated Export Cartons'
  },
  'garlic-powder': {
    name: 'Dehydrated Garlic Powder (Premium Grade)',
    hscode: '07129020',
    unit: 'kg',
    priceInr: 680,
    priceUsd: 8.19,
    packaging: '25 kg Corrugated Export Cartons with Inner Liner'
  },
  'ginger-powder': {
    name: 'Dried Ginger Powder (Zingiber Officinale)',
    hscode: '09101110',
    unit: 'kg',
    priceInr: 660,
    priceUsd: 7.95,
    packaging: '25 kg Kraft Paper Bags with Poly Inner'
  },
  'turmeric-powder': {
    name: 'Turmeric Powder (High Curcumin 3.5%+)',
    hscode: '09103020',
    unit: 'kg',
    priceInr: 400,
    priceUsd: 4.82,
    packaging: '25 kg Double Poly-lined Bags in Fiber Drums'
  },
  'beetroot-powder': {
    name: 'Beetroot Powder (Natural Colorant)',
    hscode: '07129090',
    unit: 'kg',
    priceInr: 450,
    priceUsd: 5.42,
    packaging: '20 kg Foil-laminated Export Bags in Cartons'
  }
};

/**
 * Calculates a complete, validated quotation record
 */
export function calculateQuotation(input) {
  const quoteId = input.quoteId || `AAF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const leadId = input.leadId || `LEAD-${Date.now().toString().slice(-6)}`;
  const date = new Date().toISOString().split('T')[0];
  const validUntil = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

  const currency = (input.currency || 'USD').toUpperCase();
  const incoterm = (input.incoterm || 'CIF').toUpperCase();
  const quantity = Math.max(1, Number(input.quantity) || 100);

  // Match product
  let productKey = 'moringa-powder';
  const rawProd = (input.product || '').toLowerCase();
  for (const k of Object.keys(PRODUCT_CATALOG)) {
    if (rawProd.includes(k.replace('-powder', '')) || rawProd.includes(k)) {
      productKey = k;
      break;
    }
  }
  const prod = PRODUCT_CATALOG[productKey];

  const unitRate = currency === 'USD' ? prod.priceUsd : prod.priceInr;
  const subtotalFob = Number((quantity * unitRate).toFixed(2));

  // Freight, Insurance, Documentation
  const freight = incoterm === 'CIF' ? (Number(input.freight) || (currency === 'USD' ? 150.00 : 12000.00)) : 0.00;
  const insurance = incoterm === 'CIF' ? Number(((subtotalFob + freight) * 0.005).toFixed(2)) : 0.00;
  const documentation = currency === 'USD' ? 60.00 : 5000.00;

  const grandTotal = Number((subtotalFob + freight + insurance + documentation).toFixed(2));

  return {
    quoteId,
    leadId,
    date,
    validUntil,
    customerName: input.customerName || input.name || 'Valued Trade Partner',
    companyName: input.companyName || input.company || 'Direct Buyer',
    email: input.email || 'sales@avaniagrofoods.com',
    phone: input.phone || input.mobile || '+91 7219053645',
    country: input.country || 'International',
    destination: input.destination || input.port || 'Designated International Port',
    incoterm,
    currency,
    items: [
      {
        sr: 1,
        name: prod.name,
        hscode: prod.hscode,
        quantity,
        unit: 'KG',
        rate: unitRate,
        total: subtotalFob,
        packaging: prod.packaging
      }
    ],
    subtotalFob,
    freight,
    insurance,
    documentation,
    grandTotal,
    paymentTerms: '30% Advance T/T with Purchase Order, 70% against B/L copy (or Irrevocable L/C at sight)',
    deliveryTerms: `${incoterm} - 15 to 20 working days from order confirmation`,
    status: 'GENERATED',
    createdAt: new Date().toISOString()
  };
}

/**
 * Generates password-protected XLSX Workbook Buffer
 */
export async function generateExcelQuotation(quote, password = 'AvaniExport@2026') {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AVANI AGRO FOODS';
  workbook.created = new Date();
  
  const sheet = workbook.addWorksheet('Quotation', {
    views: [{ showGridLines: true }]
  });

  // Title & Company Header
  sheet.mergeCells('A1:F1');
  sheet.getCell('A1').value = COMPANY_INFO.name;
  sheet.getCell('A1').font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A4D2E' } };
  sheet.getRow(1).height = 30;

  sheet.mergeCells('A2:F2');
  sheet.getCell('A2').value = `${COMPANY_INFO.tagline} | ${COMPANY_INFO.address}`;
  sheet.getCell('A2').font = { size: 9, italic: true, color: { argb: 'FF555555' } };
  sheet.getCell('A2').alignment = { horizontal: 'center' };

  sheet.mergeCells('A3:F3');
  sheet.getCell('A3').value = `Phone: ${COMPANY_INFO.phone} | Email: ${COMPANY_INFO.email} | Web: ${COMPANY_INFO.website}`;
  sheet.getCell('A3').font = { size: 9, color: { argb: 'FF555555' } };
  sheet.getCell('A3').alignment = { horizontal: 'center' };

  // Quotation Metadata
  sheet.addRow([]);
  sheet.addRow(['PROFORMA EXPORT QUOTATION', '', '', '', 'Quote No:', quote.quoteId]);
  sheet.getCell('A5').font = { size: 12, bold: true, color: { argb: 'FF1A4D2E' } };
  sheet.getCell('F5').font = { size: 11, bold: true };

  sheet.addRow(['Customer / Buyer:', quote.customerName, '', '', 'Date:', quote.date]);
  sheet.addRow(['Company:', quote.companyName, '', '', 'Valid Until:', quote.validUntil]);
  sheet.addRow(['Country / Destination:', `${quote.country} (${quote.destination})`, '', '', 'Incoterm:', quote.incoterm]);
  sheet.addRow(['Contact Email / Phone:', `${quote.email} | ${quote.phone}`, '', '', 'Currency:', quote.currency]);
  sheet.addRow([]);

  // Product Table Header
  const headerRow = sheet.addRow(['Sr.', 'Product Description', 'HS Code', 'Qty (KG)', `Unit Rate (${quote.currency})`, `Total (${quote.currency})`]);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A4D2E' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });
  headerRow.height = 24;

  // Item Rows
  for (const item of quote.items) {
    const row = sheet.addRow([
      item.sr,
      item.name,
      item.hscode,
      item.quantity,
      item.rate.toFixed(2),
      item.total.toFixed(2)
    ]);
    row.getCell(1).alignment = { horizontal: 'center' };
    row.getCell(3).alignment = { horizontal: 'center' };
    row.getCell(4).alignment = { horizontal: 'right' };
    row.getCell(5).alignment = { horizontal: 'right' };
    row.getCell(6).alignment = { horizontal: 'right', font: { bold: true } };
  }

  // Commercial Summary Rows
  sheet.addRow([]);
  sheet.addRow(['', '', '', '', 'Subtotal (FOB):', quote.subtotalFob.toFixed(2)]);
  sheet.addRow(['', '', '', '', 'Ocean / Air Freight:', quote.freight.toFixed(2)]);
  sheet.addRow(['', '', '', '', 'Marine Insurance (0.5%):', quote.insurance.toFixed(2)]);
  sheet.addRow(['', '', '', '', 'Export Documentation & Port Handling:', quote.documentation.toFixed(2)]);
  
  const grandTotalRow = sheet.addRow(['', '', '', '', `GRAND TOTAL (${quote.incoterm}):`, quote.grandTotal.toFixed(2)]);
  grandTotalRow.getCell(5).font = { bold: true, size: 11, color: { argb: 'FF1A4D2E' } };
  grandTotalRow.getCell(6).font = { bold: true, size: 12, color: { argb: 'FF1A4D2E' } };
  grandTotalRow.getCell(6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } };

  // Terms & Conditions
  sheet.addRow([]);
  sheet.addRow(['TERMS & CONDITIONS:']);
  sheet.getCell('A19').font = { bold: true, size: 10, color: { argb: 'FF1A4D2E' } };
  sheet.addRow(['1. Payment Terms: ' + quote.paymentTerms]);
  sheet.addRow(['2. Delivery & Lead Time: ' + quote.deliveryTerms]);
  sheet.addRow(['3. Packaging: ' + quote.items[0].packaging]);
  sheet.addRow(['4. Quality & Lab Analysis: Certificate of Analysis (COA) and Phytosanitary Certificate included.']);
  sheet.addRow(['5. Validity: This quotation is valid for 30 calendar days from the date of issue.']);

  // Column Widths
  sheet.columns = [
    { width: 6 },
    { width: 38 },
    { width: 14 },
    { width: 12 },
    { width: 22 },
    { width: 22 }
  ];

  // Apply Worksheet Protection with password
  await sheet.protect(password, {
    selectLockedCells: true,
    selectUnlockedCells: true,
    formatCells: false,
    formatColumns: false,
    formatRows: false,
    insertColumns: false,
    insertRows: false,
    insertHyperlinks: false,
    deleteColumns: false,
    deleteRows: false,
    sort: false,
    autoFilter: false,
    pivotTables: false
  });

  return await workbook.xlsx.writeBuffer();
}

/**
 * Generates matching Vector PDF Document Buffer
 */
export async function generatePdfQuotation(quote) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 Portrait
  const { width, height } = page.getSize();

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const primaryColor = rgb(26 / 255, 77 / 255, 46 / 255); // #1A4D2E
  const darkTextColor = rgb(0.15, 0.15, 0.15);
  const lightTextColor = rgb(0.4, 0.4, 0.4);

  // Top Header Banner
  page.drawRectangle({
    x: 30,
    y: height - 110,
    width: width - 60,
    height: 80,
    color: primaryColor
  });

  page.drawText(COMPANY_INFO.name, {
    x: 45,
    y: height - 60,
    size: 18,
    font: fontBold,
    color: rgb(1, 1, 1)
  });

  page.drawText(COMPANY_INFO.tagline, {
    x: 45,
    y: height - 76,
    size: 8.5,
    font: fontRegular,
    color: rgb(0.9, 0.9, 0.9)
  });

  page.drawText(`${COMPANY_INFO.phone} | ${COMPANY_INFO.email} | ${COMPANY_INFO.website}`, {
    x: 45,
    y: height - 92,
    size: 8,
    font: fontRegular,
    color: rgb(0.85, 0.85, 0.85)
  });

  page.drawText('PROFORMA INVOICE', {
    x: width - 200,
    y: height - 55,
    size: 10,
    font: fontBold,
    color: rgb(0.9, 0.9, 0.9)
  });

  page.drawText(quote.quoteId, {
    x: width - 200,
    y: height - 74,
    size: 14,
    font: fontBold,
    color: rgb(1, 1, 1)
  });

  page.drawText(`Date: ${quote.date} | Valid: ${quote.validUntil}`, {
    x: width - 200,
    y: height - 92,
    size: 8,
    font: fontRegular,
    color: rgb(0.85, 0.85, 0.85)
  });

  // Buyer Info Card
  let y = height - 130;
  page.drawRectangle({
    x: 30,
    y: y - 75,
    width: width - 60,
    height: 75,
    color: rgb(0.97, 0.98, 0.97),
    borderColor: rgb(0.85, 0.9, 0.85),
    borderWidth: 1
  });

  page.drawText('CONSIGNEE / BUYER DETAILS', { x: 45, y: y - 18, size: 8, font: fontBold, color: primaryColor });
  page.drawText(`Buyer Name: ${quote.customerName}`, { x: 45, y: y - 32, size: 9, font: fontBold, color: darkTextColor });
  page.drawText(`Company: ${quote.companyName}`, { x: 45, y: y - 46, size: 8.5, font: fontRegular, color: lightTextColor });
  page.drawText(`Email: ${quote.email} | Phone: ${quote.phone}`, { x: 45, y: y - 60, size: 8.5, font: fontRegular, color: lightTextColor });

  page.drawText('TRADE PARAMETERS', { x: 320, y: y - 18, size: 8, font: fontBold, color: primaryColor });
  page.drawText(`Country: ${quote.country}`, { x: 320, y: y - 32, size: 8.5, font: fontRegular, color: darkTextColor });
  page.drawText(`Destination Port: ${quote.destination}`, { x: 320, y: y - 46, size: 8.5, font: fontRegular, color: darkTextColor });
  page.drawText(`Incoterm: ${quote.incoterm} | Currency: ${quote.currency}`, { x: 320, y: y - 60, size: 8.5, font: fontBold, color: primaryColor });

  // Items Table
  y -= 95;
  page.drawRectangle({
    x: 30,
    y: y - 22,
    width: width - 60,
    height: 22,
    color: primaryColor
  });

  page.drawText('Sr.', { x: 38, y: y - 15, size: 8, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText('Product Description', { x: 65, y: y - 15, size: 8, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText('HS Code', { x: 260, y: y - 15, size: 8, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText('Qty (KG)', { x: 330, y: y - 15, size: 8, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText(`Rate (${quote.currency})`, { x: 400, y: y - 15, size: 8, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText(`Amount (${quote.currency})`, { x: 485, y: y - 15, size: 8, font: fontBold, color: rgb(1, 1, 1) });

  y -= 22;
  for (const item of quote.items) {
    page.drawRectangle({
      x: 30,
      y: y - 26,
      width: width - 60,
      height: 26,
      color: rgb(1, 1, 1),
      borderColor: rgb(0.9, 0.9, 0.9),
      borderWidth: 0.5
    });

    page.drawText(String(item.sr), { x: 42, y: y - 17, size: 8.5, font: fontRegular, color: lightTextColor });
    page.drawText(item.name.substring(0, 38), { x: 65, y: y - 17, size: 8.5, font: fontBold, color: darkTextColor });
    page.drawText(item.hscode, { x: 260, y: y - 17, size: 8.5, font: fontRegular, color: lightTextColor });
    page.drawText(String(item.quantity), { x: 345, y: y - 17, size: 8.5, font: fontRegular, color: darkTextColor });
    page.drawText(item.rate.toFixed(2), { x: 415, y: y - 17, size: 8.5, font: fontRegular, color: darkTextColor });
    page.drawText(item.total.toFixed(2), { x: 500, y: y - 17, size: 8.5, font: fontBold, color: primaryColor });
    y -= 26;
  }

  // Commercial Breakdown
  y -= 15;
  const summaryX = 330;
  const valX = 500;

  page.drawText('Subtotal (FOB Value):', { x: summaryX, y, size: 8.5, font: fontRegular, color: lightTextColor });
  page.drawText(`${quote.currency} ${quote.subtotalFob.toFixed(2)}`, { x: valX, y, size: 8.5, font: fontRegular, color: darkTextColor });

  y -= 16;
  page.drawText('Estimated Ocean / Air Freight:', { x: summaryX, y, size: 8.5, font: fontRegular, color: lightTextColor });
  page.drawText(`${quote.currency} ${quote.freight.toFixed(2)}`, { x: valX, y, size: 8.5, font: fontRegular, color: darkTextColor });

  y -= 16;
  page.drawText('Marine Insurance (0.5%):', { x: summaryX, y, size: 8.5, font: fontRegular, color: lightTextColor });
  page.drawText(`${quote.currency} ${quote.insurance.toFixed(2)}`, { x: valX, y, size: 8.5, font: fontRegular, color: darkTextColor });

  y -= 16;
  page.drawText('Export Documentation & Port Handling:', { x: summaryX, y, size: 8.5, font: fontRegular, color: lightTextColor });
  page.drawText(`${quote.currency} ${quote.documentation.toFixed(2)}`, { x: valX, y, size: 8.5, font: fontRegular, color: darkTextColor });

  y -= 22;
  page.drawRectangle({
    x: summaryX - 10,
    y: y - 6,
    width: width - summaryX - 20,
    height: 24,
    color: rgb(0.91, 0.96, 0.92)
  });

  page.drawText(`GRAND TOTAL (${quote.incoterm}):`, { x: summaryX, y: y + 2, size: 9.5, font: fontBold, color: primaryColor });
  page.drawText(`${quote.currency} ${quote.grandTotal.toFixed(2)}`, { x: valX - 10, y: y + 2, size: 10.5, font: fontBold, color: primaryColor });

  // Terms & Conditions Block
  y -= 50;
  page.drawRectangle({
    x: 30,
    y: y - 105,
    width: width - 60,
    height: 105,
    color: rgb(0.98, 0.98, 0.98),
    borderColor: rgb(0.9, 0.9, 0.9),
    borderWidth: 0.5
  });

  page.drawText('COMMERCIAL TERMS & EXPORT CONDITIONS', { x: 45, y: y - 18, size: 8.5, font: fontBold, color: primaryColor });
  page.drawText(`1. Payment Terms: ${quote.paymentTerms}`, { x: 45, y: y - 34, size: 8, font: fontRegular, color: darkTextColor });
  page.drawText(`2. Lead Time & Delivery: ${quote.deliveryTerms}`, { x: 45, y: y - 48, size: 8, font: fontRegular, color: darkTextColor });
  page.drawText(`3. Packaging: ${quote.items[0].packaging}`, { x: 45, y: y - 62, size: 8, font: fontRegular, color: darkTextColor });
  page.drawText(`4. Quality & Lab COA: Third-party NABL lab testing report & Phytosanitary Certificate provided.`, { x: 45, y: y - 76, size: 8, font: fontRegular, color: darkTextColor });
  page.drawText(`5. Validity: This quotation is strictly valid for 30 calendar days from ${quote.date}.`, { x: 45, y: y - 90, size: 8, font: fontRegular, color: darkTextColor });

  // Signatory Area
  y -= 135;
  page.drawText('For AVANI AGRO FOODS', { x: width - 200, y: y + 10, size: 9, font: fontBold, color: primaryColor });
  page.drawText('Authorized Export Signatory', { x: width - 200, y: y - 15, size: 8, font: fontItalic, color: lightTextColor });
  page.drawText(COMPANY_INFO.owner, { x: width - 200, y: y - 28, size: 8.5, font: fontBold, color: darkTextColor });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
