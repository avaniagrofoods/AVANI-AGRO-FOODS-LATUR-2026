// ============================================================
// AVANI AGRO FOODS — UNIFIED QUOTATION ENGINE & DOCUMENT GENERATOR
// Single Source of Truth for Quotation Logic, PDF, DOCX, and XLSX
// ============================================================

import fs from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  ImageRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  WidthType,
  ShadingType,
  PageNumber
} from 'docx';
import {
  PRODUCT_MASTER,
  getProductById,
  matchProductMaster,
  parseQuantityKg,
  parseUnitRate,
  validateQuotation
} from './productMaster.js';
import {
  DEFAULT_COMMERCIAL_TERMS,
  calculateQuotation
} from '../../src/data/quotationCore.js';

export {
  parseQuantityKg,
  parseUnitRate,
  validateQuotation,
  DEFAULT_COMMERCIAL_TERMS,
  calculateQuotation
};

export const COMPANY_INFO = {
  name: 'AVANI AGRO FOODS',
  tagline: 'Agricultural Export Marketing, Sourcing & Trade Coordination Partner',
  owner: 'Sachin Shinde',
  businessModel: 'Trader / Export Marketing Partner / Business Development Partner / Commission-Based Export Coordination',
  phone: '+91 7219053645',
  email: 'sales@avaniagrofoods.com',
  website: 'https://www.avaniagrofoods.com',
  address: 'Old Barshi Road, 5 No Chauk, Kulswamini Nagar, Next to Sai School, Latur, Maharashtra 413512, India',
  primaryPort: 'JNPT / Nhava Sheva, Mumbai',
  compliance: 'Udyam Registered | Trade Partner Quality & Export Framework'
};

/**
 * Format numeric currency string cleanly (e.g. 6,300,000.00)
 */
export function formatCurrency(amount, currency = 'INR') {
  const num = Number(amount) || 0;
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Resolve absolute logo file path
 */
function getLogoBuffer() {
  try {
    const candidates = [
      path.resolve(process.cwd(), 'public/assets/brand/avani-agro-foods-logo.png'),
      path.resolve(process.cwd(), 'public/logo.png'),
      path.resolve(process.cwd(), 'src/assets/avani-agro-foods-logo.png')
    ];
    for (const c of candidates) {
      if (fs.existsSync(c)) {
        return fs.readFileSync(c);
      }
    }
  } catch (e) {
    console.warn('[QuotationEngine] Logo read warning:', e.message);
  }
  return null;
}

/**
 * WinAnsi / ASCII text sanitizer for pdf-lib StandardFonts (Helvetica)
 * Prevents silent data corruption and runtime crashes.
 * Preserves numbers, Latin characters, decimals, specs, and maps standard currencies/punctuation.
 * Fails explicitly if unsupported non-Latin scripts (Devanagari, Arabic, CJK, Cyrillic) are present.
 */
export function cleanPdfText(str, options = {}) {
  if (str === null || str === undefined) return '';
  let s = String(str);
  s = s
    .replace(/[\u200B-\u200D\uFEFF]/g, '')       // strip zero-width formatting / BOM
    .replace(/\u00A0/g, ' ')                     // non-breaking space to regular space
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'") // single curly quotes
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"') // double curly quotes
    .replace(/[\u2013\u2014]/g, '-')             // en-dash, em-dash
    .replace(/[\u2022\u2023\u25E6\u2043\u2219]/g, '*') // bullets
    .replace(/[\u2026]/g, '...')                 // ellipsis
    .replace(/[\u2122]/g, '(TM)')                // trade mark
    .replace(/[\u20B9]/g, 'INR ')                // Indian Rupee sign
    .replace(/[\u20AC]/g, 'EUR ')                // Euro sign
    .replace(/[\u00A3]/g, 'GBP ')                // Pound
    .replace(/[\u00A5]/g, 'JPY ')                // Yen
    .replace(/[\t\r]/g, ' ');                    // tabs and CR to spaces

  // Detect unmappable non-Latin characters (Devanagari, Arabic, CJK, Cyrillic, etc.)
  // Reject unsupported content to prevent silent data loss / blank PDF generation
  const unmappableChars = s.match(/[^\x20-\x7E\xA0-\xFF\n]/g);
  if (unmappableChars && unmappableChars.length > 0) {
    if (options.flagUnsupported) {
      return s.replace(/[^\x20-\x7E\xA0-\xFF\n]/g, '[?]');
    }
    const sample = unmappableChars.slice(0, 10).join('');
    const err = new Error(`UNSUPPORTED_SCRIPT_ERROR: PDF generation failed. Unsupported non-Latin characters detected: "${sample}". Standard export PDF requires Latin/WinAnsi characters to prevent data corruption.`);
    err.code = 'UNSUPPORTED_SCRIPT_ERROR';
    err.unsupportedChars = unmappableChars;
    throw err;
  }

  return s;
}

/**
 * Text wrapper utility for pdf-lib
 */
function wrapText(text, maxCharsPerLine = 40) {
  if (!text) return [];
  const clean = cleanPdfText(text);
  const rawLines = clean.split('\n');
  const wrapped = [];

  for (const line of rawLines) {
    if (line.length <= maxCharsPerLine) {
      wrapped.push(line);
      continue;
    }
    const words = line.split(' ');
    let currentLine = '';
    for (const w of words) {
      if ((currentLine + ' ' + w).trim().length <= maxCharsPerLine) {
        currentLine = (currentLine + ' ' + w).trim();
      } else {
        if (currentLine) wrapped.push(currentLine);
        currentLine = w;
      }
    }
    if (currentLine) wrapped.push(currentLine);
  }
  return wrapped;
}

/**
 * Generates Vector PDF Document Buffer with AVANI Logo, full descriptions, and clean layout
 */
export async function generatePdfQuotation(quoteInput) {
  const quote = calculateQuotation(quoteInput);
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(`AVANI AGRO FOODS COMMERCIAL QUOTATION - ${cleanPdfText(quote.quoteId)}`);
  pdfDoc.setAuthor('AVANI AGRO FOODS');
  pdfDoc.setSubject(`Export Quotation for ${cleanPdfText(quote.buyerName)} - AVANI AGRO FOODS`);
  pdfDoc.setKeywords(['AVANI AGRO FOODS', 'Commercial Quotation', 'Export', cleanPdfText(quote.quoteId)]);
  pdfDoc.setProducer('AVANI AGRO FOODS Export Management Portal');
  pdfDoc.setCreator('AVANI AGRO FOODS Quotation Engine');

  let page = pdfDoc.addPage([595.28, 841.89]); // A4 Portrait
  const attachSafeDraw = (p) => {
    const rawDrawText = p.drawText.bind(p);
    p.drawText = (text, opts) => rawDrawText(cleanPdfText(text), opts);
  };
  attachSafeDraw(page);
  const { width, height } = page.getSize();

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const primaryColor = rgb(26 / 255, 77 / 255, 46 / 255); // #1A4D2E
  const accentColor = rgb(197 / 255, 155 / 255, 39 / 255); // #C59B27
  const darkTextColor = rgb(0.12, 0.12, 0.12);
  const lightTextColor = rgb(0.35, 0.35, 0.35);
  const borderColor = rgb(0.85, 0.88, 0.85);

  // Embed Logo Image (supports both PNG and JPEG formats)
  const logoBytes = getLogoBuffer();
  let embeddedLogo = null;
  if (logoBytes) {
    try {
      const u8 = new Uint8Array(logoBytes);
      if (u8[0] === 0xFF && u8[1] === 0xD8) {
        embeddedLogo = await pdfDoc.embedJpg(u8);
      } else {
        embeddedLogo = await pdfDoc.embedPng(u8);
      }
    } catch (logoErr) {
      try {
        embeddedLogo = await pdfDoc.embedJpg(new Uint8Array(logoBytes));
      } catch (e2) {
        console.warn('[PDF Generator] Could not embed logo:', e2.message);
      }
    }
  }

  // --- HEADER SECTION ---
  // Header background banner
  page.drawRectangle({
    x: 30,
    y: height - 110,
    width: width - 60,
    height: 80,
    color: primaryColor
  });

  // Draw Logo if available
  let textStartX = 45;
  if (embeddedLogo) {
    const logoDim = 60;
    page.drawImage(embeddedLogo, {
      x: 45,
      y: height - 100,
      width: logoDim,
      height: logoDim
    });
    textStartX = 115;
  }

  // Company Name and Subtext (Preferred Header per Section 9)
  page.drawText('AVANI AGRO FOODS', {
    x: textStartX,
    y: height - 50,
    size: 15,
    font: fontBold,
    color: rgb(1, 1, 1)
  });

  page.drawText('Premium Dehydrated Agro Products & Export Division', {
    x: textStartX,
    y: height - 64,
    size: 7.8,
    font: fontItalic,
    color: rgb(0.9, 0.9, 0.9)
  });

  page.drawText('+91 7219053645 | sales@avaniagrofoods.com', {
    x: textStartX,
    y: height - 78,
    size: 7.5,
    font: fontRegular,
    color: rgb(0.85, 0.85, 0.85)
  });

  page.drawText('https://www.avaniagrofoods.com | Latur, Maharashtra, India', {
    x: textStartX,
    y: height - 91,
    size: 7,
    font: fontRegular,
    color: rgb(0.8, 0.8, 0.8)
  });

  // Right Header: Quotation Details
  const rightX = width - 180;
  page.drawText('COMMERCIAL QUOTATION', {
    x: rightX,
    y: height - 50,
    size: 9.5,
    font: fontBold,
    color: rgb(0.92, 0.92, 0.92)
  });

  page.drawText(quote.quoteId, {
    x: rightX,
    y: height - 66,
    size: 12,
    font: fontBold,
    color: rgb(1, 1, 1)
  });

  page.drawText(`Date: ${quote.date}`, {
    x: rightX,
    y: height - 80,
    size: 8,
    font: fontRegular,
    color: rgb(0.9, 0.9, 0.9)
  });

  page.drawText(`Valid Until: ${quote.validUntil}`, {
    x: rightX,
    y: height - 93,
    size: 8,
    font: fontBold,
    color: rgb(1, 0.95, 0.8)
  });

  // --- BUYER & TRADE METADATA CARDS ---
  let y = height - 125;
  page.drawRectangle({
    x: 30,
    y: y - 72,
    width: width - 60,
    height: 72,
    color: rgb(0.97, 0.98, 0.97),
    borderColor,
    borderWidth: 1
  });

  // Buyer column
  page.drawText('BUYER / CONSIGNEE DETAILS', { x: 45, y: y - 16, size: 8, font: fontBold, color: primaryColor });
  page.drawText(`Buyer: ${quote.buyerName}`, { x: 45, y: y - 29, size: 8.5, font: fontBold, color: darkTextColor });
  page.drawText(`Company: ${quote.companyName}`, { x: 45, y: y - 42, size: 8, font: fontRegular, color: lightTextColor });
  page.drawText(`Email: ${quote.email}`, { x: 45, y: y - 54, size: 8, font: fontRegular, color: lightTextColor });
  page.drawText(`Phone: ${quote.phone}`, { x: 45, y: y - 66, size: 8, font: fontRegular, color: lightTextColor });

  // Trade Terms column
  page.drawText('SHIPMENT & TRADE PARAMETERS', { x: 310, y: y - 16, size: 8, font: fontBold, color: primaryColor });
  page.drawText(`Country: ${quote.country}`, { x: 310, y: y - 29, size: 8, font: fontRegular, color: darkTextColor });
  page.drawText(`Destination Port: ${quote.destinationPort}`, { x: 310, y: y - 42, size: 8, font: fontRegular, color: darkTextColor });
  page.drawText(`Incoterm: ${quote.incoterm}`, { x: 310, y: y - 54, size: 8, font: fontBold, color: primaryColor });
  page.drawText(`Currency: ${quote.currency} | Loading Port: JNPT / Nhava Sheva`, { x: 310, y: y - 66, size: 8, font: fontRegular, color: darkTextColor });

  // --- ITEMS TABLE HEADER ---
  y -= 88;
  const colX = {
    sr: 34,
    desc: 60,
    hscode: 275,
    qty: 345,
    rate: 415,
    total: 485
  };

  page.drawRectangle({
    x: 30,
    y: y - 20,
    width: width - 60,
    height: 20,
    color: primaryColor
  });

  page.drawText('#', { x: colX.sr, y: y - 14, size: 8, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText('Product Requirement & Specification', { x: colX.desc, y: y - 14, size: 8, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText('HS Code', { x: colX.hscode, y: y - 14, size: 8, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText('Quantity', { x: colX.qty, y: y - 14, size: 8, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText(`Unit Rate (${quote.currency})`, { x: colX.rate, y: y - 14, size: 8, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText(`Total (${quote.currency})`, { x: colX.total, y: y - 14, size: 8, font: fontBold, color: rgb(1, 1, 1) });

  y -= 20;

  // Render Line Items with Dynamic Row Height (No truncation!)
  for (const item of quote.items) {
    const descLines = wrapText(item.description || item.name, 38);
    const rowHeight = Math.max(28, (descLines.length + 1) * 11 + 10);

    // Page-break protection if table row exceeds page boundary
    if (y - rowHeight < 150) {
      page = pdfDoc.addPage([595.28, 841.89]);
      attachSafeDraw(page);
      y = height - 50;
    }

    page.drawRectangle({
      x: 30,
      y: y - rowHeight,
      width: width - 60,
      height: rowHeight,
      color: rgb(1, 1, 1),
      borderColor,
      borderWidth: 0.5
    });

    // Sr #
    page.drawText(String(item.sr), { x: colX.sr, y: y - 15, size: 8, font: fontRegular, color: lightTextColor });

    // Product Title
    page.drawText(item.name, { x: colX.desc, y: y - 15, size: 8.5, font: fontBold, color: darkTextColor });

    // Multi-line full specification / description
    let lineY = y - 27;
    for (const dLine of descLines) {
      page.drawText(dLine, { x: colX.desc, y: lineY, size: 7.5, font: fontRegular, color: lightTextColor });
      lineY -= 10.5;
    }

    // HS Code
    page.drawText(String(item.hscode), { x: colX.hscode, y: y - 15, size: 8.5, font: fontBold, color: primaryColor });

    // Quantity
    page.drawText(`${item.quantity.toLocaleString('en-IN')} ${item.unit}`, { x: colX.qty, y: y - 15, size: 8.5, font: fontBold, color: darkTextColor });

    // Unit Rate
    page.drawText(`${quote.currency} ${item.rate.toFixed(2)}`, { x: colX.rate, y: y - 15, size: 8.5, font: fontRegular, color: darkTextColor });

    // Line Total
    page.drawText(`${quote.currency} ${formatCurrency(item.total, quote.currency)}`, { x: colX.total, y: y - 15, size: 9, font: fontBold, color: primaryColor });

    y -= rowHeight;
  }

  // --- COMMERCIAL FINANCIAL SUMMARY ---
  y -= 12;
  const summaryLabelX = 300;
  const summaryValueX = 475;

  page.drawText('Subtotal (Product Value):', { x: summaryLabelX, y, size: 8.5, font: fontRegular, color: lightTextColor });
  page.drawText(`${quote.currency} ${formatCurrency(quote.subtotal, quote.currency)}`, { x: summaryValueX, y, size: 8.5, font: fontBold, color: darkTextColor });

  if (quote.freight > 0) {
    y -= 14;
    page.drawText('Ocean / Air Freight Estimate:', { x: summaryLabelX, y, size: 8.5, font: fontRegular, color: lightTextColor });
    page.drawText(`${quote.currency} ${formatCurrency(quote.freight, quote.currency)}`, { x: summaryValueX, y, size: 8.5, font: fontRegular, color: darkTextColor });
  }

  if (quote.insurance > 0) {
    y -= 14;
    page.drawText('Marine Cargo Insurance:', { x: summaryLabelX, y, size: 8.5, font: fontRegular, color: lightTextColor });
    page.drawText(`${quote.currency} ${formatCurrency(quote.insurance, quote.currency)}`, { x: summaryValueX, y, size: 8.5, font: fontRegular, color: darkTextColor });
  }

  if (quote.documentation > 0) {
    y -= 14;
    page.drawText('Export Documentation & Handling:', { x: summaryLabelX, y, size: 8.5, font: fontRegular, color: lightTextColor });
    page.drawText(`${quote.currency} ${formatCurrency(quote.documentation, quote.currency)}`, { x: summaryValueX, y, size: 8.5, font: fontRegular, color: darkTextColor });
  }

  // GRAND TOTAL BLOCK (Two-line / Structured Layout — Zero text overlap guaranteed!)
  y -= 18;
  const grandTotalBoxHeight = 42;
  page.drawRectangle({
    x: 290,
    y: y - grandTotalBoxHeight + 8,
    width: width - 320,
    height: grandTotalBoxHeight,
    color: rgb(0.92, 0.96, 0.93),
    borderColor: primaryColor,
    borderWidth: 1
  });

  // Top line of Grand Total block: Clear Incoterm context
  const cleanIncoterm = quote.incoterm ? (quote.incoterm.length > 30 ? quote.incoterm.slice(0, 30) + '...' : quote.incoterm) : 'FOB';
  page.drawText(`GRAND TOTAL (${cleanIncoterm})`, {
    x: 300,
    y: y - 3,
    size: 7.8,
    font: fontBold,
    color: primaryColor
  });

  // Bottom line of Grand Total block: Prominent, non-overlapping total
  page.drawText(`${quote.currency} ${formatCurrency(quote.grandTotal, quote.currency)}`, {
    x: 300,
    y: y - 22,
    size: 13,
    font: fontBold,
    color: primaryColor
  });

  // --- COMMERCIAL NOTES & TERMS (Exact 7 points) ---
  y -= (grandTotalBoxHeight + 16);
  const termsBoxHeight = 115;
  page.drawRectangle({
    x: 30,
    y: y - termsBoxHeight,
    width: width - 60,
    height: termsBoxHeight,
    color: rgb(0.985, 0.985, 0.985),
    borderColor,
    borderWidth: 0.5
  });

  page.drawText('COMMERCIAL NOTES & TERMS:', {
    x: 42,
    y: y - 14,
    size: 8,
    font: fontBold,
    color: primaryColor
  });

  let termY = y - 27;
  for (const term of quote.commercialTerms) {
    page.drawText(term, {
      x: 42,
      y: termY,
      size: 7.2,
      font: fontRegular,
      color: darkTextColor
    });
    termY -= 11.5;
  }

  // --- FOOTER & SIGNATORY SECTION ---
  y -= (termsBoxHeight + 14);
  page.drawText('For AVANI AGRO FOODS', {
    x: width - 210,
    y: y - 6,
    size: 8.5,
    font: fontBold,
    color: primaryColor
  });

  page.drawText('Sachin Shinde', {
    x: width - 210,
    y: y - 22,
    size: 9,
    font: fontBold,
    color: darkTextColor
  });

  page.drawText('Trade Coordinator & Export Business Development', {
    x: width - 210,
    y: y - 33,
    size: 7.5,
    font: fontItalic,
    color: lightTextColor
  });

  page.drawText('Commercial Export Division • Latur, Maharashtra, India', {
    x: 42,
    y: y - 33,
    size: 7.5,
    font: fontRegular,
    color: lightTextColor
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * Generates matching Microsoft Word (.docx) Quotation Document Buffer
 */
export async function generateDocxQuotation(quoteInput) {
  const quote = calculateQuotation(quoteInput);
  const logoBytes = getLogoBuffer();

  const docChildren = [];

  // Header Table: Logo (Left) + Company Info (Right)
  const headerCells = [];
  if (logoBytes) {
    headerCells.push(
      new TableCell({
        width: { size: 15, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.NONE },
          bottom: { style: BorderStyle.NONE },
          left: { style: BorderStyle.NONE },
          right: { style: BorderStyle.NONE }
        },
        children: [
          new Paragraph({
            children: [
              new ImageRun({
                data: logoBytes,
                transformation: { width: 55, height: 55 }
              })
            ]
          })
        ]
      })
    );
  }

  headerCells.push(
    new TableCell({
      width: { size: logoBytes ? 85 : 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE }
      },
      children: [
        new Paragraph({
          children: [
            new TextRun({ text: COMPANY_INFO.name, bold: true, size: 28, color: '1A4D2E' })
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({ text: COMPANY_INFO.businessModel, italics: true, size: 16, color: '555555' })
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `${COMPANY_INFO.phone} | ${COMPANY_INFO.email} | ${COMPANY_INFO.website}`, size: 16, color: '666666' })
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({ text: COMPANY_INFO.address, size: 15, color: '777777' })
          ]
        })
      ]
    })
  );

  docChildren.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [new TableRow({ children: headerCells })]
    })
  );

  docChildren.push(new Paragraph({ text: '', spacing: { after: 150 } }));

  // Proforma Invoice Title & Reference
  docChildren.push(
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({ text: 'COMMERCIAL PROFORMA QUOTATION', bold: true, size: 22, color: '1A4D2E' })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({ text: `Quotation No: ${quote.quoteId}`, bold: true, size: 20 }),
        new TextRun({ text: `  |  Date: ${quote.date}  |  Valid Until: ${quote.validUntil}`, size: 18, color: '555555' })
      ],
      spacing: { after: 200 }
    })
  );

  // Buyer Details & Trade Terms Table
  docChildren.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              shading: { fill: 'F4F7F4', type: ShadingType.CLEAR },
              children: [
                new Paragraph({ children: [new TextRun({ text: 'BUYER / CONSIGNEE DETAILS', bold: true, size: 16, color: '1A4D2E' })] }),
                new Paragraph({ children: [new TextRun({ text: `Name: ${quote.buyerName}`, bold: true, size: 18 })] }),
                new Paragraph({ children: [new TextRun({ text: `Company: ${quote.companyName}`, size: 17 })] }),
                new Paragraph({ children: [new TextRun({ text: `Email: ${quote.email}`, size: 16 })] }),
                new Paragraph({ children: [new TextRun({ text: `Phone: ${quote.phone}`, size: 16 })] })
              ]
            }),
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              shading: { fill: 'F4F7F4', type: ShadingType.CLEAR },
              children: [
                new Paragraph({ children: [new TextRun({ text: 'TRADE & SHIPMENT PARAMETERS', bold: true, size: 16, color: '1A4D2E' })] }),
                new Paragraph({ children: [new TextRun({ text: `Country: ${quote.country}`, size: 17 })] }),
                new Paragraph({ children: [new TextRun({ text: `Destination Port: ${quote.destinationPort}`, size: 17 })] }),
                new Paragraph({ children: [new TextRun({ text: `Incoterm: ${quote.incoterm}`, bold: true, size: 18, color: '1A4D2E' })] }),
                new Paragraph({ children: [new TextRun({ text: `Currency: ${quote.currency} | Loading: JNPT / Nhava Sheva`, size: 16 })] })
              ]
            })
          ]
        })
      ]
    })
  );

  docChildren.push(new Paragraph({ text: '', spacing: { after: 200 } }));

  // Line Items Table Header
  const tableRows = [
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({ width: { size: 6, type: WidthType.PERCENTAGE }, shading: { fill: '1A4D2E' }, children: [new Paragraph({ children: [new TextRun({ text: '#', bold: true, color: 'FFFFFF', size: 16 })] })] }),
        new TableCell({ width: { size: 44, type: WidthType.PERCENTAGE }, shading: { fill: '1A4D2E' }, children: [new Paragraph({ children: [new TextRun({ text: 'Product Description & Specification', bold: true, color: 'FFFFFF', size: 16 })] })] }),
        new TableCell({ width: { size: 14, type: WidthType.PERCENTAGE }, shading: { fill: '1A4D2E' }, children: [new Paragraph({ children: [new TextRun({ text: 'HS Code', bold: true, color: 'FFFFFF', size: 16 })] })] }),
        new TableCell({ width: { size: 12, type: WidthType.PERCENTAGE }, shading: { fill: '1A4D2E' }, children: [new Paragraph({ children: [new TextRun({ text: 'Quantity', bold: true, color: 'FFFFFF', size: 16 })] })] }),
        new TableCell({ width: { size: 12, type: WidthType.PERCENTAGE }, shading: { fill: '1A4D2E' }, children: [new Paragraph({ children: [new TextRun({ text: `Rate (${quote.currency})`, bold: true, color: 'FFFFFF', size: 16 })] })] }),
        new TableCell({ width: { size: 12, type: WidthType.PERCENTAGE }, shading: { fill: '1A4D2E' }, children: [new Paragraph({ children: [new TextRun({ text: `Total (${quote.currency})`, bold: true, color: 'FFFFFF', size: 16 })] })] })
      ]
    })
  ];

  // Line Item Rows (Full description, no truncation)
  for (const item of quote.items) {
    tableRows.push(
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ text: String(item.sr) })] }),
          new TableCell({
            children: [
              new Paragraph({ children: [new TextRun({ text: item.name, bold: true, size: 18 })] }),
              new Paragraph({ children: [new TextRun({ text: item.description, size: 15, color: '444444' })] }),
              new Paragraph({ children: [new TextRun({ text: `Packaging: ${item.packaging}`, italics: true, size: 14, color: '666666' })] })
            ]
          }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(item.hscode), bold: true, color: '1A4D2E' })] })] }),
          new TableCell({ children: [new Paragraph({ text: `${item.quantity.toLocaleString('en-IN')} ${item.unit}` })] }),
          new TableCell({ children: [new Paragraph({ text: `${quote.currency} ${item.rate.toFixed(2)}` })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${quote.currency} ${formatCurrency(item.total, quote.currency)}`, bold: true })] })] })
        ]
      })
    );
  }

  // Summary Rows
  tableRows.push(
    new TableRow({
      children: [
        new TableCell({ columnSpan: 4, borders: { left: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE } }, children: [new Paragraph({ text: '' })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Subtotal:', bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${quote.currency} ${formatCurrency(quote.subtotal, quote.currency)}`, bold: true })] })] })
      ]
    })
  );

  if (quote.freight > 0) {
    tableRows.push(
      new TableRow({
        children: [
          new TableCell({ columnSpan: 4, borders: { left: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE } }, children: [new Paragraph({ text: '' })] }),
          new TableCell({ children: [new Paragraph({ text: 'Freight:' })] }),
          new TableCell({ children: [new Paragraph({ text: `${quote.currency} ${formatCurrency(quote.freight, quote.currency)}` })] })
        ]
      })
    );
  }

  if (quote.insurance > 0) {
    tableRows.push(
      new TableRow({
        children: [
          new TableCell({ columnSpan: 4, borders: { left: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE } }, children: [new Paragraph({ text: '' })] }),
          new TableCell({ children: [new Paragraph({ text: 'Insurance:' })] }),
          new TableCell({ children: [new Paragraph({ text: `${quote.currency} ${formatCurrency(quote.insurance, quote.currency)}` })] })
        ]
      })
    );
  }

  if (quote.documentation > 0) {
    tableRows.push(
      new TableRow({
        children: [
          new TableCell({ columnSpan: 4, borders: { left: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE } }, children: [new Paragraph({ text: '' })] }),
          new TableCell({ children: [new Paragraph({ text: 'Documentation:' })] }),
          new TableCell({ children: [new Paragraph({ text: `${quote.currency} ${formatCurrency(quote.documentation, quote.currency)}` })] })
        ]
      })
    );
  }

  // Grand Total Row in DOCX
  tableRows.push(
    new TableRow({
      children: [
        new TableCell({ columnSpan: 4, borders: { left: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE } }, children: [new Paragraph({ text: '' })] }),
        new TableCell({
          shading: { fill: 'E8F5E9' },
          children: [new Paragraph({ children: [new TextRun({ text: `GRAND TOTAL (${quote.incoterm}):`, bold: true, size: 18, color: '1A4D2E' })] })]
        }),
        new TableCell({
          shading: { fill: 'E8F5E9' },
          children: [new Paragraph({ children: [new TextRun({ text: `${quote.currency} ${formatCurrency(quote.grandTotal, quote.currency)}`, bold: true, size: 20, color: '1A4D2E' })] })]
        })
      ]
    })
  );

  docChildren.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: tableRows
    })
  );

  docChildren.push(new Paragraph({ text: '', spacing: { after: 200 } }));

  // Commercial Notes & Terms (Exact 7 points)
  docChildren.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Commercial Notes & Terms:', bold: true, size: 20, color: '1A4D2E' })
      ],
      spacing: { after: 100 }
    })
  );

  for (const term of quote.commercialTerms) {
    docChildren.push(
      new Paragraph({
        children: [new TextRun({ text: term, size: 16 })],
        spacing: { after: 50 }
      })
    );
  }

  docChildren.push(new Paragraph({ text: '', spacing: { after: 250 } }));

  // Signatory Box
  docChildren.push(
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({ text: 'For AVANI AGRO FOODS', bold: true, size: 18, color: '1A4D2E' })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({ text: 'Sachin Shinde', bold: true, size: 18 }),
        new TextRun({ text: '\nTrade Coordinator & Export Business Development', italics: true, size: 16, color: '555555' })
      ]
    })
  );

  const doc = new Document({
    title: `Commercial Quotation ${quote.quoteId}`,
    description: `AVANI AGRO FOODS Commercial Quotation for ${quote.buyerName}`,
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, bottom: 720, left: 720, right: 720 }
          }
        },
        children: docChildren
      }
    ]
  });

  return await Packer.toBuffer(doc);
}

/**
 * Generates protected Excel (.xlsx) Quotation File Buffer
 */
export async function generateExcelQuotation(quoteInput, password = process.env.MASTER_GATE_PASSWORD || '') {
  const quote = calculateQuotation(quoteInput);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AVANI AGRO FOODS';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Quotation', {
    views: [{ showGridLines: true }]
  });

  sheet.mergeCells('A1:F1');
  sheet.getCell('A1').value = COMPANY_INFO.name;
  sheet.getCell('A1').font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A4D2E' } };
  sheet.getRow(1).height = 30;

  sheet.mergeCells('A2:F2');
  sheet.getCell('A2').value = `${COMPANY_INFO.businessModel} | ${COMPANY_INFO.address}`;
  sheet.getCell('A2').font = { size: 9, italic: true, color: { argb: 'FF555555' } };
  sheet.getCell('A2').alignment = { horizontal: 'center' };

  sheet.mergeCells('A3:F3');
  sheet.getCell('A3').value = `Phone: ${COMPANY_INFO.phone} | Email: ${COMPANY_INFO.email} | Web: ${COMPANY_INFO.website}`;
  sheet.getCell('A3').font = { size: 9, color: { argb: 'FF555555' } };
  sheet.getCell('A3').alignment = { horizontal: 'center' };

  sheet.addRow([]);
  sheet.addRow(['COMMERCIAL EXPORT QUOTATION', '', '', '', 'Quote No:', quote.quoteId]);
  sheet.getCell('A5').font = { size: 12, bold: true, color: { argb: 'FF1A4D2E' } };
  sheet.getCell('F5').font = { size: 11, bold: true };

  sheet.addRow(['Customer / Buyer:', quote.buyerName, '', '', 'Date:', quote.date]);
  sheet.addRow(['Company:', quote.companyName, '', '', 'Valid Until:', quote.validUntil]);
  sheet.addRow(['Country / Destination:', `${quote.country} (${quote.destinationPort})`, '', '', 'Incoterm:', quote.incoterm]);
  sheet.addRow(['Contact Email / Phone:', `${quote.email} | ${quote.phone}`, '', '', 'Currency:', quote.currency]);
  sheet.addRow([]);

  const headerRow = sheet.addRow(['Sr.', 'Product Description', 'HS Code', 'Qty (KG)', `Unit Rate (${quote.currency})`, `Total (${quote.currency})`]);
  headerRow.eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A4D2E' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });
  headerRow.height = 24;

  for (const item of quote.items) {
    const row = sheet.addRow([
      item.sr,
      item.description || item.name,
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

  sheet.addRow([]);
  sheet.addRow(['', '', '', '', 'Subtotal:', quote.subtotal.toFixed(2)]);
  if (quote.freight > 0) sheet.addRow(['', '', '', '', 'Freight:', quote.freight.toFixed(2)]);
  if (quote.insurance > 0) sheet.addRow(['', '', '', '', 'Insurance:', quote.insurance.toFixed(2)]);
  if (quote.documentation > 0) sheet.addRow(['', '', '', '', 'Documentation:', quote.documentation.toFixed(2)]);

  const grandTotalRow = sheet.addRow(['', '', '', '', `GRAND TOTAL (${quote.incoterm}):`, quote.grandTotal.toFixed(2)]);
  grandTotalRow.getCell(5).font = { bold: true, size: 11, color: { argb: 'FF1A4D2E' } };
  grandTotalRow.getCell(6).font = { bold: true, size: 12, color: { argb: 'FF1A4D2E' } };
  grandTotalRow.getCell(6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } };

  sheet.addRow([]);
  sheet.addRow(['COMMERCIAL NOTES & TERMS:']);
  sheet.getCell(`A${sheet.rowCount}`).font = { bold: true, size: 10, color: { argb: 'FF1A4D2E' } };
  for (const term of quote.commercialTerms) {
    sheet.addRow([term]);
  }

  sheet.columns = [
    { width: 6 },
    { width: 44 },
    { width: 14 },
    { width: 14 },
    { width: 22 },
    { width: 22 }
  ];

  if (password) {
    await sheet.protect(password, {
      selectLockedCells: true,
      selectUnlockedCells: true
    });
  }

  return await workbook.xlsx.writeBuffer();
}
