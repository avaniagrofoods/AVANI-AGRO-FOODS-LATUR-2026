// ============================================================
// AVANI AGRO FOODS — SUPABASE REST CLIENT & PERSISTENCE ENGINE
// api/_lib/supabaseClient.js
// Handles durable PostgreSQL lead storage with zero client-side leakage,
// Row-Level Security compliance, retries, and secondary ledger fallback.
// ============================================================

/**
 * Checks whether Supabase environment variables are configured
 */
export function isSupabaseConfigured() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  return Boolean(url && key && url.trim().length > 0 && key.trim().length > 0 && !url.includes('YOUR_SUPABASE'));
}

/**
 * Get sanitized Supabase connection metadata (zero secret exposure)
 */
export function getSupabaseStatus() {
  const configured = isSupabaseConfigured();
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  let projectRef = 'NOT_CONFIGURED';
  try {
    if (url) {
      const parsed = new URL(url);
      projectRef = parsed.hostname.split('.')[0] || 'CONFIGURED';
    }
  } catch (_) {}

  return {
    configured,
    projectRef: configured ? projectRef : 'NOT_CONFIGURED',
    hasServiceKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY),
    mode: configured ? 'PRIMARY_PERSISTENT_POSTGRES' : 'FALLBACK_SECONDARY_LEDGERS'
  };
}

/**
 * Low-level PostgREST HTTP fetch wrapper with retry logic
 */
async function supabaseFetch(endpoint, options = {}, retries = 2) {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      status: 'UNCONFIGURED',
      error: 'Supabase credentials (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) are not configured.'
    };
  }

  const baseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL).replace(/\/$/, '');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  const url = `${baseUrl}/rest/v1/${endpoint}`;

  const headers = {
    'apikey': serviceKey,
    'Authorization': `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
    'Prefer': options.prefer || 'return=representation',
    ...(options.headers || {})
  };

  let lastError = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

      const res = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        let data = null;
        const text = await res.text();
        if (text) {
          try {
            data = JSON.parse(text);
          } catch (_) {
            data = text;
          }
        }
        return { success: true, status: res.status, data };
      }

      const errorText = await res.text().catch(() => '');
      lastError = new Error(`Supabase PostgREST error (${res.status}): ${errorText}`);

      // Retry only on server errors (5xx) or rate limits (429)
      if (res.status < 500 && res.status !== 429) {
        break;
      }
    } catch (err) {
      lastError = err;
    }

    if (attempt < retries) {
      const backoffMs = Math.pow(2, attempt) * 300;
      await new Promise(r => setTimeout(r, backoffMs));
    }
  }

  return {
    success: false,
    status: 'REQUEST_FAILED',
    error: lastError ? lastError.message : 'Unknown PostgREST error'
  };
}

/**
 * Save a canonical Lead record into the primary Supabase database
 */
export async function saveLeadToSupabase(leadRecord) {
  if (!isSupabaseConfigured()) {
    return {
      persisted: false,
      status: 'SUPABASE_UNCONFIGURED',
      message: 'Supabase credentials not configured in environment. Using secondary ledgers.',
      inquiryId: leadRecord.inquiryId
    };
  }

  const row = {
    inquiry_id: leadRecord.inquiryId,
    submission_date: leadRecord.inquiryDate || new Date().toISOString(),
    buyer_name: leadRecord.buyerName,
    company_name: leadRecord.company || leadRecord.companyName || 'Direct Buyer',
    email: (leadRecord.email || '').toLowerCase().trim(),
    phone: leadRecord.phone || null,
    buyer_role: leadRecord.buyerRole || null,
    country: leadRecord.country || 'India',
    product: leadRecord.product,
    quantity_original: String(leadRecord.quantityOriginal || leadRecord.quantity || ''),
    quantity_normalized_kg: Number(leadRecord.quantityNormalizedKg || leadRecord.quantityKg || 0),
    quantity_unit: leadRecord.quantityUnit || 'KG',
    incoterm: leadRecord.incoterm || null,
    destination_port: leadRecord.destinationPort || null,
    purchase_timeline: leadRecord.purchaseTimeline || null,
    intended_application: leadRecord.intendedApplication || null,
    packaging_preference: leadRecord.packagingPreference || null,
    documents_requested: leadRecord.documentsRequested || null,
    mesh_size: leadRecord.mesh || null,
    moisture: leadRecord.moisture || null,
    purity: leadRecord.purity || null,
    target_price: leadRecord.requestedPrice ? Number(leadRecord.requestedPrice) : null,
    currency: leadRecord.currency || 'USD',
    buyer_message: leadRecord.buyerRequirement || leadRecord.message || null,
    source: leadRecord.source || 'Website_Contact_RFQ',
    landing_page: leadRecord.landingPage || null,
    referrer: leadRecord.referrer || null,
    utm_source: leadRecord.utmSource || null,
    utm_medium: leadRecord.utmMedium || null,
    utm_campaign: leadRecord.utmCampaign || null,
    utm_content: leadRecord.utmContent || null,
    utm_term: leadRecord.utmTerm || null,
    status: 'NEW_ENQUIRY',
    quotation_id: leadRecord.quotationId || null,
    quotation_status: leadRecord.quotationStatus || 'DRAFT',
    notes: leadRecord.notes || null,
    raw_payload: leadRecord
  };

  const result = await supabaseFetch('leads', {
    method: 'POST',
    body: row,
    prefer: 'resolution=merge-duplicates,return=representation'
  });

  if (result.success) {
    // Record audit trail event
    await recordAuditLog({
      entityType: 'LEAD',
      entityId: leadRecord.inquiryId,
      action: 'LEAD_CREATED',
      actor: 'Website Automation Engine',
      newState: { status: 'NEW_ENQUIRY', quotationId: leadRecord.quotationId },
      notes: `Lead captured via ${leadRecord.source || 'Website'}. Mapped to inquiry ${leadRecord.inquiryId}.`
    });

    return {
      persisted: true,
      status: 'SUCCESS',
      inquiryId: leadRecord.inquiryId,
      record: result.data?.[0] || row
    };
  }

  console.error('[Supabase Client] Failed to persist lead:', result.error);
  return {
    persisted: false,
    status: 'PERSISTENCE_FAILED',
    error: result.error,
    inquiryId: leadRecord.inquiryId
  };
}

/**
 * Save an export quotation record to Supabase
 */
export async function saveQuotationToSupabase(quoteRecord) {
  if (!isSupabaseConfigured()) {
    return {
      persisted: false,
      status: 'SUPABASE_UNCONFIGURED',
      quoteId: quoteRecord.quoteId || quoteRecord.quotationId
    };
  }

  const row = {
    quotation_id: quoteRecord.quoteId || quoteRecord.quotationId,
    inquiry_id: quoteRecord.inquiryId || null,
    date: quoteRecord.date || new Date().toISOString().split('T')[0],
    valid_until: quoteRecord.validUntil || '12 Oct 2026',
    buyer_name: quoteRecord.buyerName || quoteRecord.customerName,
    company_name: quoteRecord.companyName,
    country: quoteRecord.country,
    currency: quoteRecord.currency || 'USD',
    incoterm: quoteRecord.incoterm,
    destination_port: quoteRecord.destinationPort,
    items: quoteRecord.items || [],
    subtotal: Number(quoteRecord.subtotal || 0),
    freight: Number(quoteRecord.freight || quoteRecord.freightCharges || 0),
    insurance: Number(quoteRecord.insurance || quoteRecord.insuranceCharges || 0),
    documentation: Number(quoteRecord.documentation || quoteRecord.documentationCharges || 0),
    other_charges: Number(quoteRecord.otherCharges || 0),
    grand_total: Number(quoteRecord.grandTotal || 0),
    payment_terms: quoteRecord.paymentTerms,
    delivery_timeline: quoteRecord.deliveryTimeline,
    status: quoteRecord.status || 'DRAFT',
    document_hash: quoteRecord.documentHash || null,
    raw_quotation: quoteRecord
  };

  const result = await supabaseFetch('quotations', {
    method: 'POST',
    body: row,
    prefer: 'resolution=merge-duplicates,return=representation'
  });

  return {
    persisted: result.success,
    status: result.success ? 'SUCCESS' : 'FAILED',
    error: result.error || null,
    quoteId: row.quotation_id
  };
}

/**
 * Record an entry in the immutable lead/quotation audit trail
 */
export async function recordAuditLog({ entityType, entityId, action, actor = 'System', previousState = null, newState = null, notes = '' }) {
  if (!isSupabaseConfigured()) return;

  const logEntry = {
    entity_type: entityType,
    entity_id: entityId,
    action,
    actor,
    previous_state: previousState,
    new_state: newState,
    notes,
    created_at: new Date().toISOString()
  };

  await supabaseFetch('lead_audit_logs', {
    method: 'POST',
    body: logEntry,
    prefer: 'return=minimal'
  });
}

/**
 * Update a lead status with audit trail tracking
 */
export async function updateLeadStatusInSupabase(inquiryId, newStatus, actor = 'Sachin Shinde', notes = '', nextFollowUpDate = null) {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase unconfigured' };
  }

  const patchBody = {
    status: newStatus,
    updated_at: new Date().toISOString()
  };
  if (notes) patchBody.notes = notes;
  if (nextFollowUpDate) patchBody.next_follow_up_date = nextFollowUpDate;

  const result = await supabaseFetch(`leads?inquiry_id=eq.${encodeURIComponent(inquiryId)}`, {
    method: 'PATCH',
    body: patchBody,
    prefer: 'return=representation'
  });

  if (result.success) {
    await recordAuditLog({
      entityType: 'LEAD',
      entityId: inquiryId,
      action: 'STATUS_TRANSITION',
      actor,
      newState: { status: newStatus, nextFollowUpDate },
      notes
    });
  }

  return result;
}

/**
 * Retrieve leads with pagination and search
 */
export async function fetchLeadsFromSupabase({ limit = 50, offset = 0, status = null, search = null } = {}) {
  if (!isSupabaseConfigured()) {
    return { success: false, count: 0, leads: [], unconfigured: true };
  }

  let query = `leads?select=*&order=submission_date.desc&limit=${limit}&offset=${offset}`;
  if (status && status !== 'ALL') {
    query += `&status=eq.${encodeURIComponent(status)}`;
  }
  if (search) {
    query += `&or=(buyer_name.ilike.*${encodeURIComponent(search)}*,company_name.ilike.*${encodeURIComponent(search)}*,inquiry_id.ilike.*${encodeURIComponent(search)}*,country.ilike.*${encodeURIComponent(search)}*)`;
  }

  const result = await supabaseFetch(query, { method: 'GET' });
  return {
    success: result.success,
    leads: result.data || [],
    count: Array.isArray(result.data) ? result.data.length : 0,
    error: result.error || null
  };
}
