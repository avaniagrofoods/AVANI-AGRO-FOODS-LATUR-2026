import { calculateQuotation, generatePdfQuotation, generateDocxQuotation } from '../api/lib/quotationEngine.js';

const quoteInput = {
  quoteId: 'AAF-Q-2026-9075',
  buyerName: 'VIKRAM',
  companyName: 'VIKRAJA SOLAPUR',
  country: 'INDIA',
  currency: 'INR',
  items: [
    {
      id: 1,
      productId: 'moringa-leaf-powder',
      name: 'Moringa Leaf Powder',
      description: 'Moringa Leaf Powder — Natural Green — 80–100 Mesh — Moisture Max 7–8% — 100% Pure — 25 kg Food-Grade HDPE Bags',
      hscode: '12119029',
      quantity: 18000,
      unit: 'KG',
      rate: 650,
      amount: 11700000
    },
    {
      id: 2,
      productId: 'moringa-leaf-powder',
      name: 'Moringa Leaf Powder',
      description: 'Moringa Leaf Powder — Natural Green — 80–100 Mesh — Moisture Max 7–8% — 100% Pure — 25 kg Food-Grade HDPE Bags',
      hscode: '12119029',
      quantity: '18000',
      unit: 'KG',
      rate: 350,
      amount: 6300000
    }
  ]
};

const res = calculateQuotation(quoteInput);
console.log('--- CALCULATION RESULT ---');
console.log('Item 1 qty:', res.items[0].quantity, 'rate:', res.items[0].rate, 'total:', res.items[0].total);
console.log('Item 2 qty:', res.items[1].quantity, 'rate:', res.items[1].rate, 'total:', res.items[1].total);
console.log('Subtotal:', res.subtotal);
console.log('GrandTotal:', res.grandTotal);
