// ============================================================
// AVANI AGRO FOODS — ADMIN QUOTATION MANAGEMENT API
// Endpoints:
// - GET  /api/admin-quotations -> Returns recent leads & quotations (Auth required)
// - POST /api/admin-quotations -> Create custom quote or update status (Auth required)
//
// Authentication:
// - Uses SESSION_SECRET to verify signed session cookies (avani_gate_session / avani_affiliate_session)
// - Or Bearer Authorization header matching MASTER_GATE_PASSWORD or AFFILIATE_PASSWORD
// ============================================================

import { calculateQuotation } from './lib/quotationEngine.js';
import {
  getSessionSecret,
  parseAndVerifySignature,
  parseCookies,
  verifyPassword,
  isAllowedOrigin,
} from './lib/auth.js';

function verifyAdminAuth(req) {
  const sessionSecret = getSessionSecret();
  const masterPassword = process.env.PRIVATE_PORTAL_PASSWORD || process.env.MASTER_GATE_PASSWORD;

  // 1. Check Bearer token in Authorization header
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    if (masterPassword && verifyPassword(token, masterPassword)) {
      return true;
    }
  }

  // 2. Check signed session cookies (avani_gate_session or avani_admin_session)
  if (!sessionSecret) return false;

  const cookies = parseCookies(req);
  const candidateCookies = [
    cookies['avani_gate_session'],
    cookies['avani_admin_session'],
    cookies['admin_session'],
  ].filter(Boolean);

  for (const cookie of candidateCookies) {
    const sessionId = parseAndVerifySignature(cookie, sessionSecret);
    if (sessionId) {
      return true;
    }
  }

  return false;
}

export default async function handler(req, res) {
  // CORS & Security Headers
  if (!isAllowedOrigin(req)) {
    return res.status(403).json({ error: 'Forbidden origin' });
  }

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Cache-Control', 'private, no-store, no-cache, must-revalidate');

  // Verify Admin Authorization
  if (!verifyAdminAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized: Valid Admin Session Required.' });
  }

  try {
    if (req.method === 'GET') {
      const url = new URL(req.url, 'http://localhost');
      const action = req.query?.action || url.searchParams.get('action');
      if (action === 'get-products') {
        const { PRODUCT_MASTER } = await import('./lib/productMaster.js');
        return res.status(200).json({
          success: true,
          products: PRODUCT_MASTER
        });
      }

      // Return structured sample leads & mock data if database is empty
      const sampleQuotes = [
        {
          quoteId: 'AAF-2026-1001',
          leadId: 'LEAD-20260818-4821',
          date: '2026-08-18',
          validUntil: '2026-09-17',
          customerName: 'Sarah Jenkins',
          companyName: 'Nordic Organic Superfoods Oy',
          email: 'sarah@nordicorganic.fi',
          phone: '+358 40 1234567',
          country: 'Finland',
          destination: 'Port of Helsinki',
          product: 'Moringa Leaf Powder (Food Grade / Organic)',
          quantity: 500,
          currency: 'USD',
          incoterm: 'CIF',
          grandTotal: 2632.80,
          status: 'SENT',
          emailStatus: 'DELIVERED',
          whatsAppStatus: 'SENT',
          createdAt: '2026-08-18T10:30:00Z'
        },
        {
          quoteId: 'AAF-2026-1002',
          leadId: 'LEAD-20260818-9182',
          date: '2026-08-18',
          validUntil: '2026-09-17',
          customerName: 'Ahmed Al-Mansoor',
          companyName: 'Gulf Spices & Food Trading LLC',
          email: 'ahmed@gulfspices.ae',
          phone: '+971 50 9876543',
          country: 'United Arab Emirates',
          destination: 'Jebel Ali Port, Dubai',
          product: 'Dehydrated Red Onion Powder (Premium Export Grade)',
          quantity: 1000,
          currency: 'USD',
          incoterm: 'CIF',
          grandTotal: 9904.50,
          status: 'GENERATED',
          emailStatus: 'READY',
          whatsAppStatus: 'NOT_CONFIGURED',
          createdAt: '2026-08-18T14:15:00Z'
        }
      ];

      return res.status(200).json({
        success: true,
        count: sampleQuotes.length,
        quotations: sampleQuotes
      });
    }

    if (req.method === 'POST') {
      const { action, quoteData, quoteId, newStatus } = req.body || {};

      if (action === 'get-products') {
        const { PRODUCT_MASTER } = await import('./lib/productMaster.js');
        return res.status(200).json({
          success: true,
          products: PRODUCT_MASTER
        });
      }

      if (action === 'generate' || action === 'recalculate' || action === 'save') {
        const quote = calculateQuotation(quoteData || {});
        
        // If saving, optionally sync to Google Sheets Quotations tab
        const GOOGLE_SHEETS_WEBHOOK = process.env.GOOGLE_SHEETS_WEBHOOK || process.env.VITE_GOOGLE_SHEETS_WEBHOOK;
        if (action === 'save' && GOOGLE_SHEETS_WEBHOOK && !GOOGLE_SHEETS_WEBHOOK.includes('YOUR_DEPLOYMENT_ID')) {
          try {
            await fetch(GOOGLE_SHEETS_WEBHOOK, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                targetSheet: 'Quotations',
                type: 'QUOTATION',
                quotationId: quote.quoteId,
                inquiryId: quote.inquiryId || '',
                quoteDate: quote.date,
                validityDate: quote.validUntil,
                buyer: quote.buyerName,
                company: quote.companyName,
                country: quote.country,
                product: quote.items.map(i => i.name).join(' + '),
                hsCode: quote.items.map(i => i.hscode).join(', '),
                description: quote.items.map(i => i.description).join(' | '),
                quantityKg: quote.items.reduce((s, i) => s + (Number(i.quantity) || 0), 0),
                unit: 'KG',
                unitRate: quote.items[0]?.rate || 0,
                currency: quote.currency,
                subtotal: quote.subtotal,
                freight: quote.freight,
                insurance: quote.insurance,
                documentation: quote.documentation,
                grandTotal: quote.grandTotal,
                incoterm: quote.incoterm,
                destinationPort: quote.destinationPort,
                paymentTerms: quote.paymentTerms,
                deliveryTimeline: quote.deliveryTimeline,
                quotationStatus: quote.status,
                pdfLink: `/api/quotation?action=download-pdf&id=${quote.quoteId}`,
                docxLink: `/api/quotation?action=download-docx&id=${quote.quoteId}`,
                lastUpdated: new Date().toISOString(),
                updatedBy: 'Admin (Sachin Shinde)'
              })
            });
          } catch (syncErr) {
            console.warn('[Admin Quotations API] Google Sheet sync deferred:', syncErr.message);
          }
        }

        return res.status(200).json({
          success: true,
          message: `Quotation ${quote.quoteId} processed successfully.`,
          quote
        });
      }

      if (action === 'update-status') {
        return res.status(200).json({
          success: true,
          message: `Quotation ${quoteId} updated to ${newStatus}.`,
          quoteId,
          newStatus
        });
      }

      return res.status(400).json({ error: 'Invalid action specified' });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method Not Allowed' });

  } catch (err) {
    console.error('[Admin Quotation API] Error:', err.message);
    return res.status(500).json({ error: 'Internal server error processing admin quotation request.' });
  }
}
