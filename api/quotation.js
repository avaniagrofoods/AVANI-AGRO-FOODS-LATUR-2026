// ============================================================
// AVANI AGRO FOODS — ON-DEMAND QUOTATION API
// Endpoints:
// - POST /api/quotation?action=calculate -> Returns JSON breakdown
// - POST /api/quotation?action=download-pdf -> Generates & streams PDF
// - POST /api/quotation?action=download-xlsx -> Generates & streams password-protected XLSX
// - POST /api/quotation?action=send-email -> DEPRECATED (Returns 403; requires authenticated controlled dispatch)
// ============================================================

import { calculateQuotation, generateExcelQuotation, generatePdfQuotation, generateDocxQuotation } from './_lib/quotationEngine.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Security Headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  try {
    const action = req.query?.action || 'calculate';
    const body = req.body || {};
    if (typeof body !== 'object' || body === null) {
      return res.status(400).json({ error: 'Invalid payload' });
    }

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

    if (action === 'download-docx') {
      const docxBuffer = await generateDocxQuotation(quote);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="Quotation_${quote.quoteId}.docx"`);
      return res.status(200).send(docxBuffer);
    }

    if (action === 'download-xlsx') {
      const xlsxPassword = process.env.MASTER_GATE_PASSWORD || '';
      const xlsxBuffer = await generateExcelQuotation(quote, xlsxPassword);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="Quotation_${quote.quoteId}.xlsx"`);
      return res.status(200).send(xlsxBuffer);
    }

    if (action === 'send-email') {
      // Deprecated unauthenticated endpoint. Quotation dispatches must be authorized through the controlled dispatch gate.
      return res.status(403).json({
        success: false,
        error: 'DEPRECATED_ENDPOINT: Direct unauthenticated quotation emailing via /api/quotation is disabled. Use authenticated controlled buyer dispatch via /api/admin-quotations?action=send-buyer.',
        code: 'DISPATCH_AUTH_REQUIRED'
      });
    }

    return res.status(400).json({ error: 'Invalid action requested' });

  } catch (err) {
    console.error('[Quotation API] Error:', err.message);
    return res.status(500).json({ error: 'Failed to process quotation request.' });
  }
}
