import { calculateQuotation, generateExcelQuotation, generatePdfQuotation } from '../api/lib/quotationEngine.js';
import fs from 'fs';
import path from 'path';

async function testEngine() {
  console.log('Testing Quotation Engine...');
  const sampleInput = {
    customerName: 'Sarah Jenkins',
    companyName: 'Nordic Organic Superfoods Oy',
    email: 'sarah@nordicorganic.fi',
    phone: '+358 40 1234567',
    country: 'Finland',
    destination: 'Port of Helsinki',
    product: 'Moringa Leaf Powder',
    quantity: 500,
    currency: 'USD',
    incoterm: 'CIF'
  };

  const quote = calculateQuotation(sampleInput);
  console.log('Calculated Quote:', JSON.stringify(quote, null, 2));

  // Generate Excel
  const xlsxBuffer = await generateExcelQuotation(quote, process.env.MASTER_GATE_PASSWORD || 'Samarth@1356');
  fs.writeFileSync('scratch/test_quote.xlsx', xlsxBuffer);
  console.log(`Generated Excel: scratch/test_quote.xlsx (${xlsxBuffer.length} bytes)`);

  // Generate PDF
  const pdfBuffer = await generatePdfQuotation(quote);
  fs.writeFileSync('scratch/test_quote.pdf', pdfBuffer);
  console.log(`Generated PDF: scratch/test_quote.pdf (${pdfBuffer.length} bytes)`);

  console.log('Verification:');
  console.log(`- Subtotal FOB: ${quote.currency} ${quote.subtotalFob}`);
  console.log(`- Freight: ${quote.currency} ${quote.freight}`);
  console.log(`- Insurance: ${quote.currency} ${quote.insurance}`);
  console.log(`- Grand Total: ${quote.currency} ${quote.grandTotal}`);
  console.log('PASS: Engine calculation and file generation successful.');
}

testEngine().catch(console.error);
