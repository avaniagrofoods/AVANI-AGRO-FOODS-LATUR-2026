// ============================================================
// AVANI AGRO FOODS — ON-DEMAND QUOTATION API
// Endpoints:
// - POST /api/quotation?action=calculate -> Returns JSON breakdown
// - POST /api/quotation?action=download-pdf -> Generates & streams PDF
// - POST /api/quotation?action=download-docx -> Generates & streams DOCX
// - POST /api/quotation?action=download-xlsx -> Generates & streams XLSX (decoupled from portal master password)
// - POST /api/quotation?action=send-email -> DEPRECATED (Returns 403; requires authenticated controlled dispatch)
// ============================================================

import {
  calculateQuotation,
  generateExcelQuotation,
  generatePdfQuotation,
  generateDocxQuotation
} from './_lib/quotationEngine.js';
import {
  getClientIp,
  checkRateLimit,
  isAllowedOrigin
} from './_lib/auth.js';

function sanitizeDownloadFilenameId(rawId) {
  const cleaned = String(rawId || 'Quotation').replace(/[^a-zA-Z0-9_-]/g, '_');
  return cleaned.slice(0, 64) || 'Quotation';
}

export default async function handler(req, res) {
  if (!isAllowedOrigin(req)) {
    return res.status(403).json({
      error: 'Forbidden origin',
      code: 'ORIGIN_FORBIDDEN'
    });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  // CC-08 & AF-02: Distributed rate limiting on quotation generation
  const clientIp = getClientIp(req);
  const rateLimit = await checkRateLimit(clientIp, 'public_quotation', { maxAttempts: 30, windowSeconds: 900 });
  if (rateLimit.limited) {
    return res.status(rateLimit.statusCode || 429).json({
      success: false,
      error: rateLimit.error || 'Too many quotation requests. Please try again later.',
      code: rateLimit.code
    });
  }

  try {
    const action = req.query?.action || 'calculate';
    const body = req.body || {};
    if (typeof body !== 'object' || body === null) {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    const quote = calculateQuotation(body);
    const safeQuoteId = sanitizeDownloadFilenameId(quote.quoteId);

    if (action === 'calculate') {
      return res.status(200).json({
        success: true,
        quote
      });
    }

    if (action === 'download-pdf') {
      const pdfBuffer = await generatePdfQuotation(quote);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Quotation_${safeQuoteId}.pdf"`);
      return res.status(200).send(pdfBuffer);
    }

    if (action === 'download-docx') {
      const docxBuffer = await generateDocxQuotation(quote);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="Quotation_${safeQuoteId}.docx"`);
      return res.status(200).send(docxBuffer);
    }

    if (action === 'download-xlsx') {
      // CC-05: Never pass portal master password to Excel worksheet protection.
      // Optional worksheet cell-lock password (UI edit lock only, NOT file encryption) may be configured via XLSX_WORKSHEET_LOCK_PASSWORD.
      const worksheetLockPassword = (process.env.XLSX_WORKSHEET_LOCK_PASSWORD || '').trim();
      const xlsxBuffer = await generateExcelQuotation(quote, worksheetLockPassword);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="Quotation_${safeQuoteId}.xlsx"`);
      return res.status(200).send(xlsxBuffer);
    }

    if (action === 'send-email') {
      return res.status(403).json({
        success: false,
        error: 'DEPRECATED_ENDPOINT: Direct unauthenticated quotation emailing via /api/quotation is disabled. Use authenticated controlled buyer dispatch via /api/admin-quotations?action=send-buyer.',
        code: 'DISPATCH_AUTH_REQUIRED'
      });
    }

    return res.status(400).json({ error: 'Invalid action requested' });

  } catch (err) {
    console.error('[Quotation API] Error:', err.message);
    if (err.code === 'UNSUPPORTED_SCRIPT_ERROR' || err.message?.includes('UNSUPPORTED_SCRIPT_ERROR')) {
      return res.status(422).json({
        success: false,
        error: 'PDF generation failed: Document contains unsupported non-Latin characters. Standard export quotation PDF requires Latin characters to ensure data integrity.',
        code: 'UNSUPPORTED_SCRIPT_ERROR'
      });
    }
    if (err.code === 'CREDENTIAL_COUPLING_FORBIDDEN') {
      return res.status(500).json({
        success: false,
        error: err.message,
        code: err.code
      });
    }
    return res.status(500).json({ error: 'Failed to process quotation request.' });
  }
}
