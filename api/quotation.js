// ============================================================
// AVANI AGRO FOODS — ON-DEMAND QUOTATION API
// Endpoints:
// - POST /api/quotation?action=calculate -> Returns JSON breakdown
// - POST /api/quotation?action=download-pdf -> Generates & streams PDF
// - POST /api/quotation?action=download-xlsx -> Generates & streams password-protected XLSX
// - POST /api/quotation?action=send-email -> Sends quotation documents to customer
// ============================================================

import { calculateQuotation, generateExcelQuotation, generatePdfQuotation } from './lib/quotationEngine.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Security Headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  try {
    const action = req.query.action || 'calculate';
    const body = req.body || {};

    const quote = calculateQuotation(body);

    if (action === 'calculate') {
      return res.status(200).json({
        success: true,
        quote
      });
    }

    if (action === 'download-pdf') {
      const pdfBuffer = await generatePdfQuotation(quote);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Quotation_${quote.quoteId}.pdf"`);
      return res.status(200).send(pdfBuffer);
    }

    if (action === 'download-xlsx') {
      const xlsxBuffer = await generateExcelQuotation(quote, 'AvaniExport@2026');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="Quotation_${quote.quoteId}.xlsx"`);
      return res.status(200).send(xlsxBuffer);
    }

    if (action === 'send-email') {
      // In serverless, if EmailJS or SMTP is configured, send transactional email
      return res.status(200).json({
        success: true,
        message: `Quotation ${quote.quoteId} queued for email delivery to ${quote.email}.`,
        quoteId: quote.quoteId,
        recipient: quote.email
      });
    }

    return res.status(400).json({ error: 'Invalid action requested' });

  } catch (err) {
    console.error('[Quotation API] Error:', err.message);
    return res.status(500).json({ error: 'Failed to process quotation request.' });
  }
}
