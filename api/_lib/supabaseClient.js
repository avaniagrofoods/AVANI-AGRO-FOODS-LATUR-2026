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
  return Boolean(
    url && 
    key && 
    url.trim().length > 0 && 
    key.trim().length > 0 && 
    !url.includes('YOUR_SUPABASE') &&
    !key.includes('[SENSITIVE]')
  );
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
export async function saveLeadToSupabase(leadRecord, options = {}) {
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

  const allowUpsert = options.upsert === true && options.insertOnly !== true;
  const result = await supabaseFetch('leads', {
    method: 'POST',
    body: row,
    prefer: allowUpsert ? 'resolution=merge-duplicates,return=representation' : 'return=representation'
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

    // Record initial CRM activity event in public.crm_activities
    await recordCrmActivity({
      inquiryId: leadRecord.inquiryId,
      activityType: 'INITIAL_INQUIRY',
      summary: `Initial B2B lead captured via ${leadRecord.source || 'Website'}. Product: ${leadRecord.product}, Qty: ${leadRecord.quantityOriginal || leadRecord.quantityNormalizedKg || 'N/A'}.`,
      outcome: 'AWAITING_INITIAL_REVIEW',
      performedBy: 'Website Automation Engine'
    });

    return {
      persisted: true,
      status: 'SUCCESS',
      inquiryId: leadRecord.inquiryId,
      record: result.data?.[0] || row
    };
  }

  console.error('[Supabase Client] Failed to persist lead:', result.error);
  const isConflict = String(result.error || '').includes('23505');
  const code = isConflict ? '23505' : (result.status || 'ERROR');
  return {
    persisted: false,
    status: isConflict ? 'CONFLICT' : 'PERSISTENCE_FAILED',
    code,
    error: result.error,
    inquiryId: leadRecord.inquiryId
  };
}

/**
 * Save an export quotation record to Supabase
 */
export async function saveQuotationToSupabase(quoteRecord, options = {}) {
  if (!isSupabaseConfigured()) {
    return {
      persisted: false,
      status: 'SUPABASE_UNCONFIGURED',
      quoteId: quoteRecord.quoteId || quoteRecord.quotationId
    };
  }

  const qId = quoteRecord.quoteId || quoteRecord.quotationId;

  // Safe Upsert Semantics (FIND-111-07): Check for existing delivery tracking metadata
  // to avoid clobbering active provider status or timestamps during routine draft updates
  let existingDelivery = null;
  if (qId) {
    try {
      const existingRes = await getQuotationByIdFromSupabase(qId);
      if (existingRes.success && existingRes.quotation) {
        existingDelivery = existingRes.quotation;
      }
    } catch (_) {}
  }

  // Pure quotations without genuine pre-existing lead set inquiry_id to NULL (Owner Decision 1)
  const rawInquiryId = typeof quoteRecord.inquiryId === 'string' ? quoteRecord.inquiryId.trim() : (quoteRecord.leadId || null);
  const isValidInquiryId = Boolean(rawInquiryId && /^AAF-(INQ|L)-\d{4}-[A-Za-z0-9-]+$/.test(rawInquiryId) && rawInquiryId.length <= 50);
  const safeInquiryId = isValidInquiryId ? rawInquiryId : (existingDelivery?.inquiry_id || null);

  const row = {
    quotation_id: qId,
    inquiry_id: safeInquiryId,
    date: quoteRecord.date || new Date().toISOString().split('T')[0],
    valid_until: quoteRecord.validUntil || '12 Oct 2026',
    buyer_name: (quoteRecord.buyerName || quoteRecord.customerName || quoteRecord.buyer?.name || quoteRecord.name || 'Direct Buyer').trim(),
    company_name: (quoteRecord.companyName || quoteRecord.buyer?.company || quoteRecord.company || 'B2B Importer').trim(),
    country: (quoteRecord.country || quoteRecord.buyer?.country || 'India').trim(),
    currency: (quoteRecord.currency || 'USD').toUpperCase().trim(),
    incoterm: (quoteRecord.incoterm || quoteRecord.inquiry?.incoterm || 'FOB NHAVA SHEVA (JNPT MUMBAI)').trim(),
    destination_port: (quoteRecord.destinationPort || quoteRecord.destination || quoteRecord.port || 'NHAVA SHEVA (JNPT MUMBAI)').trim(),
    items: quoteRecord.items || [],
    subtotal: Number(quoteRecord.subtotal || 0),
    freight: Number(quoteRecord.freight || quoteRecord.freightCharges || 0),
    insurance: Number(quoteRecord.insurance || quoteRecord.insuranceCharges || 0),
    documentation: Number(quoteRecord.documentation || quoteRecord.documentationCharges || 0),
    other_charges: Number(quoteRecord.otherCharges || 0),
    grand_total: Number(quoteRecord.grandTotal || 0),
    payment_terms: quoteRecord.paymentTerms,
    delivery_timeline: quoteRecord.deliveryTimeline,
    status: quoteRecord.status || existingDelivery?.status || 'DRAFT',
    document_hash: quoteRecord.documentHash || null,
    raw_quotation: quoteRecord,
    
    // Delivery tracking and provider metadata with preservation of existing records
    buyer_email: quoteRecord.buyerEmail || quoteRecord.buyer?.email || quoteRecord.email || existingDelivery?.buyer_email || null,
    provider_message_id: quoteRecord.providerMessageId || quoteRecord.dispatch?.messageId || quoteRecord.messageId || existingDelivery?.provider_message_id || null,
    provider_name: quoteRecord.providerName || quoteRecord.dispatch?.provider || existingDelivery?.provider_name || 'resend',
    sent_at: quoteRecord.sentAt || quoteRecord.dispatch?.sentAt || existingDelivery?.sent_at || (['SENT', 'SENT_TO_BUYER'].includes(quoteRecord.status) ? new Date().toISOString() : null),
    delivered_at: quoteRecord.deliveredAt || quoteRecord.dispatch?.deliveredAt || existingDelivery?.delivered_at || null,
    bounced_at: quoteRecord.bouncedAt || quoteRecord.dispatch?.bouncedAt || existingDelivery?.bounced_at || null,
    delivery_status: quoteRecord.deliveryStatus || quoteRecord.dispatch?.deliveryStatus || existingDelivery?.delivery_status || (['SENT', 'SENT_TO_BUYER'].includes(quoteRecord.status) ? 'sent' : 'pending'),
    created_by: existingDelivery?.created_by || quoteRecord.createdBy || 'authenticated_operator',
    updated_by: quoteRecord.updatedBy || 'authenticated_operator'
  };

  const isInsertOnly = options.insertOnly === true;
  const allowUpsert = !isInsertOnly && (options.upsert === true || Boolean(existingDelivery));
  const result = await supabaseFetch('quotations', {
    method: 'POST',
    body: row,
    prefer: allowUpsert ? 'resolution=merge-duplicates,return=representation' : 'return=representation'
  });

  if (result.success) {
    await recordAuditLog({
      entityType: 'QUOTATION',
      entityId: row.quotation_id,
      action: 'QUOTATION_SAVED',
      actor: row.updated_by,
      newState: { status: row.status, deliveryStatus: row.delivery_status },
      notes: `Quotation saved/updated in Supabase (status: ${row.status})`
    }).catch(() => {});
  }

  const isConflict = String(result.error || '').includes('23505');
  const isFkViolation = String(result.error || '').includes('23503');
  const code = isConflict ? '23505' : (isFkViolation ? '23503' : (result.status || 'ERROR'));

  return {
    persisted: result.success,
    status: result.success ? 'SUCCESS' : (isConflict ? 'CONFLICT' : (isFkViolation ? 'FK_VIOLATION' : 'FAILED')),
    code,
    error: result.error || null,
    quoteId: row.quotation_id,
    record: result.data?.[0] || row
  };
}

/**
 * Get quotation by quotation_id from Supabase
 */
export async function getQuotationByIdFromSupabase(quotationId) {
  if (!isSupabaseConfigured() || !quotationId) {
    return { success: false, quotation: null, error: 'UNCONFIGURED_OR_EMPTY_ID' };
  }
  const result = await supabaseFetch(`quotations?quotation_id=eq.${encodeURIComponent(quotationId)}&select=*`, {
    method: 'GET'
  });
  if (result.success && Array.isArray(result.data) && result.data.length > 0) {
    return { success: true, quotation: result.data[0] };
  }
  return { success: false, quotation: null, error: result.error || 'NOT_FOUND' };
}

/**
 * Get quotation by provider_message_id from Supabase
 */
export async function getQuotationByMessageIdFromSupabase(messageId) {
  if (!isSupabaseConfigured() || !messageId) {
    return { success: false, quotation: null, error: 'UNCONFIGURED_OR_EMPTY_MESSAGE_ID' };
  }
  const result = await supabaseFetch(`quotations?provider_message_id=eq.${encodeURIComponent(messageId)}&select=*`, {
    method: 'GET'
  });
  if (result.success && Array.isArray(result.data) && result.data.length > 0) {
    return { success: true, quotation: result.data[0] };
  }
  return { success: false, quotation: null, error: result.error || 'NOT_FOUND' };
}

/**
 * Converts PostgREST snake_case database quotation row into canonical camelCase model
 */
export function mapSupabaseQuotationToModel(row) {
  if (!row || typeof row !== 'object') return row;
  return {
    ...row,
    quoteId: row.quotation_id || row.quoteId,
    quotationId: row.quotation_id || row.quotationId,
    inquiryId: row.inquiry_id || row.inquiryId || null,
    leadId: row.inquiry_id || row.leadId || null,
    date: row.date,
    validUntil: row.valid_until || row.validUntil || '12 Oct 2026',
    buyerName: row.buyer_name || row.buyerName || 'Direct Buyer',
    customerName: row.buyer_name || row.customerName || 'Direct Buyer',
    companyName: row.company_name || row.companyName || 'B2B Importer',
    country: row.country || 'India',
    email: row.buyer_email || row.email || null,
    buyerEmail: row.buyer_email || row.email || null,
    currency: row.currency || 'USD',
    incoterm: row.incoterm,
    destinationPort: row.destination_port || row.destinationPort,
    destination: row.destination_port || row.destination,
    items: Array.isArray(row.items) ? row.items : [],
    subtotal: Number(row.subtotal || 0),
    freight: Number(row.freight || 0),
    freightCharges: Number(row.freight || 0),
    insurance: Number(row.insurance || 0),
    insuranceCharges: Number(row.insurance || 0),
    documentation: Number(row.documentation || 0),
    documentationCharges: Number(row.documentation || 0),
    otherCharges: Number(row.other_charges || 0),
    grandTotal: Number(row.grand_total || 0),
    paymentTerms: row.payment_terms || row.paymentTerms,
    deliveryTimeline: row.delivery_timeline || row.deliveryTimeline,
    status: row.status || 'DRAFT',
    documentHash: row.document_hash || row.documentHash || null,
    providerMessageId: row.provider_message_id || row.providerMessageId || null,
    providerName: row.provider_name || row.providerName || 'resend',
    sentAt: row.sent_at || row.sentAt || null,
    deliveredAt: row.delivered_at || row.deliveredAt || null,
    bouncedAt: row.bounced_at || row.bouncedAt || null,
    deliveryStatus: row.delivery_status || row.deliveryStatus || 'pending',
    createdBy: row.created_by || row.createdBy || 'authenticated_operator',
    updatedBy: row.updated_by || row.updatedBy || 'authenticated_operator',
    createdAt: row.created_at || row.createdAt,
    updatedAt: row.updated_at || row.updatedAt
  };
}

/**
 * Update quotation delivery status and provider tracking in Supabase
 */
export async function updateQuotationDeliveryStatusInSupabase(quotationId, updateData = {}) {
  if (!isSupabaseConfigured() || !quotationId) {
    return { success: false, error: 'UNCONFIGURED_OR_EMPTY_ID' };
  }
  const patchBody = {
    updated_at: new Date().toISOString()
  };
  if (updateData.status) {
    patchBody.status = updateData.status === 'SENT' ? 'SENT_TO_BUYER' : updateData.status;
  }
  if (updateData.deliveryStatus) patchBody.delivery_status = updateData.deliveryStatus;
  if (updateData.sentAt) patchBody.sent_at = updateData.sentAt;
  if (updateData.deliveredAt) patchBody.delivered_at = updateData.deliveredAt;
  if (updateData.bouncedAt) patchBody.bounced_at = updateData.bouncedAt;
  if (updateData.providerMessageId) patchBody.provider_message_id = updateData.providerMessageId;
  if (updateData.providerName) patchBody.provider_name = updateData.providerName;
  if (updateData.updatedBy) patchBody.updated_by = updateData.updatedBy;

  const result = await supabaseFetch(`quotations?quotation_id=eq.${encodeURIComponent(quotationId)}`, {
    method: 'PATCH',
    body: patchBody,
    prefer: 'return=representation'
  });

  if (result.success) {
    await recordAuditLog({
      entityType: 'QUOTATION',
      entityId: quotationId,
      action: 'DELIVERY_STATUS_UPDATED',
      actor: updateData.updatedBy || 'webhook_delivery_processor',
      newState: patchBody,
      notes: `Quotation delivery status updated to ${patchBody.delivery_status || patchBody.status || 'UPDATED'}`
    }).catch(() => {});
  }

  return result;
}

/**
 * Retrieve quotations with pagination, status filter and search
 */
export async function fetchQuotationsFromSupabase({ limit = 50, offset = 0, status = null, search = null } = {}) {
  if (!isSupabaseConfigured()) {
    return { success: false, count: 0, quotations: [], unconfigured: true };
  }

  let query = `quotations?select=*&order=date.desc&limit=${limit}&offset=${offset}`;
  if (status && status !== 'ALL') {
    query += `&status=eq.${encodeURIComponent(status)}`;
  }
  if (search) {
    query += `&or=(buyer_name.ilike.*${encodeURIComponent(search)}*,company_name.ilike.*${encodeURIComponent(search)}*,quotation_id.ilike.*${encodeURIComponent(search)}*,country.ilike.*${encodeURIComponent(search)}*)`;
  }

  const result = await supabaseFetch(query, { method: 'GET' });
  const rawRows = Array.isArray(result.data) ? result.data : [];
  return {
    success: result.success,
    quotations: rawRows.map(mapSupabaseQuotationToModel),
    rawQuotations: rawRows,
    count: rawRows.length,
    error: result.error || null
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
 * Record a CRM activity or follow-up event in public.crm_activities
 */
export async function recordCrmActivity({
  inquiryId,
  activityType = 'INITIAL_INQUIRY',
  summary,
  outcome = 'NEW_LEAD_RECEIVED',
  nextFollowUpDate = null,
  performedBy = 'Website Automation Engine'
}) {
  if (!isSupabaseConfigured()) return { success: false, unconfigured: true };

  const activityEntry = {
    inquiry_id: inquiryId,
    activity_type: activityType,
    activity_date: new Date().toISOString(),
    summary: summary || 'Initial B2B enquiry received and registered',
    outcome,
    next_follow_up_date: nextFollowUpDate,
    performed_by: performedBy,
    created_at: new Date().toISOString()
  };

  return await supabaseFetch('crm_activities', {
    method: 'POST',
    body: activityEntry,
    prefer: 'return=minimal'
  });
}

/**
 * Update a lead status with audit trail tracking
 */
export async function updateLeadStatusInSupabase(inquiryId, newStatus, actor = 'authenticated_operator', notes = '', nextFollowUpDate = null) {
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

// ============================================================
// DURABLE IDEMPOTENCY LEDGER HELPERS (Priority 2 / Package 3F.136)
// Backed by public.inquiry_idempotency_ledger and reserve_idempotency_lock RPC
// ============================================================

/**
 * Atomically reserve an idempotency lock in PostgreSQL via stored procedure
 * with direct PostgREST table fallback for resilient dual-mode operation.
 */
export async function reserveIdempotencyLock(idempotencyKey, requestHash) {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      status: 'SUPABASE_UNCONFIGURED',
      error: 'Supabase credentials not configured'
    };
  }

  // 1. Attempt atomic stored procedure (RPC) first
  try {
    const result = await supabaseFetch('rpc/reserve_idempotency_lock', {
      method: 'POST',
      body: {
        p_key: String(idempotencyKey),
        p_hash: String(requestHash)
      }
    });

    if (result.success && Array.isArray(result.data) && result.data.length > 0) {
      const row = result.data[0];
      return {
        success: true,
        reserved: Boolean(row.reserved),
        existingStatus: row.existing_status,
        cachedResponse: row.cached_response,
        inquiryId: row.inquiry_id,
        quoteId: row.quote_id
      };
    }
  } catch (rpcErr) {
    console.warn('[Supabase Client] reserve_idempotency_lock RPC call threw error, attempting table fallback:', rpcErr.message);
  }

  // 2. Direct table fallback: inquiry_idempotency_ledger
  try {
    // Check if key already exists in ledger
    const checkRes = await supabaseFetch(`inquiry_idempotency_ledger?idempotency_key=eq.${encodeURIComponent(idempotencyKey)}&limit=1`, {
      method: 'GET'
    });

    if (checkRes.success && Array.isArray(checkRes.data) && checkRes.data.length > 0) {
      const existing = checkRes.data[0];
      // Check if expired IN_PROGRESS lock
      const isExpired = existing.status === 'IN_PROGRESS' && existing.expires_at && (new Date(existing.expires_at).getTime() < Date.now());
      if (isExpired) {
        // Reclaim expired lock
        const reclaimRes = await supabaseFetch(`inquiry_idempotency_ledger?idempotency_key=eq.${encodeURIComponent(idempotencyKey)}`, {
          method: 'PATCH',
          body: {
            status: 'IN_PROGRESS',
            request_hash: String(requestHash),
            updated_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 60000).toISOString()
          },
          prefer: 'return=representation'
        });
        if (reclaimRes.success) {
          return { success: true, reserved: true, existingStatus: 'RECLAIMED' };
        }
      }

      // Existing record is valid (COMPLETED or active IN_PROGRESS)
      return {
        success: true,
        reserved: false,
        existingStatus: existing.status,
        cachedResponse: existing.response_payload,
        inquiryId: existing.inquiry_id,
        quoteId: existing.quote_id
      };
    }

    // Key does not exist: attempt atomic insert
    const insertRes = await supabaseFetch('inquiry_idempotency_ledger', {
      method: 'POST',
      body: {
        idempotency_key: String(idempotencyKey),
        request_hash: String(requestHash),
        status: 'IN_PROGRESS',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 60000).toISOString()
      },
      prefer: 'return=representation'
    });

    if (insertRes.success) {
      return {
        success: true,
        reserved: true,
        existingStatus: 'IN_PROGRESS'
      };
    }

    // If insert failed due to conflict (concurrent insert), fetch existing record
    const isConflict = insertRes.status === 409 || String(insertRes.error || '').includes('23505');
    if (isConflict) {
      const secondCheck = await supabaseFetch(`inquiry_idempotency_ledger?idempotency_key=eq.${encodeURIComponent(idempotencyKey)}&limit=1`, {
        method: 'GET'
      });
      if (secondCheck.success && Array.isArray(secondCheck.data) && secondCheck.data.length > 0) {
        const row = secondCheck.data[0];
        return {
          success: true,
          reserved: false,
          existingStatus: row.status,
          cachedResponse: row.response_payload,
          inquiryId: row.inquiry_id,
          quoteId: row.quote_id
        };
      }
    }

    return {
      success: false,
      status: 'TABLE_FALLBACK_FAILED',
      error: insertRes.error || 'Failed to reserve idempotency lock via fallback'
    };
  } catch (fallbackErr) {
    return {
      success: false,
      status: 'FALLBACK_EXCEPTION',
      error: fallbackErr.message
    };
  }
}

/**
 * Mark a durable idempotency ledger entry as COMPLETED with its authoritative response
 */
export async function completeIdempotencyRecord(idempotencyKey, { inquiryId, quoteId, responsePayload }) {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase unconfigured' };
  }

  // Attempt atomic stored procedure first
  const rpcRes = await supabaseFetch('rpc/complete_idempotency_record', {
    method: 'POST',
    body: {
      p_key: String(idempotencyKey),
      p_inquiry_id: inquiryId || null,
      p_quote_id: quoteId || null,
      p_response_payload: responsePayload || null
    }
  });

  if (rpcRes.success) {
    return rpcRes;
  }

  // Direct table fallback
  return await supabaseFetch(`inquiry_idempotency_ledger?idempotency_key=eq.${encodeURIComponent(idempotencyKey)}`, {
    method: 'PATCH',
    body: {
      status: 'COMPLETED',
      inquiry_id: inquiryId || null,
      quote_id: quoteId || null,
      response_payload: responsePayload || null,
      updated_at: new Date().toISOString()
    },
    prefer: 'return=representation'
  });
}

/**
 * Mark an in-progress idempotency reservation as FAILED or release it on transient error
 */
export async function failIdempotencyRecord(idempotencyKey) {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase unconfigured' };
  }

  // Attempt atomic stored procedure first
  const rpcRes = await supabaseFetch('rpc/fail_idempotency_record', {
    method: 'POST',
    body: {
      p_key: String(idempotencyKey)
    }
  });

  if (rpcRes.success) {
    return rpcRes;
  }

  // Direct table fallback
  return await supabaseFetch(`inquiry_idempotency_ledger?idempotency_key=eq.${encodeURIComponent(idempotencyKey)}`, {
    method: 'PATCH',
    body: {
      status: 'FAILED',
      updated_at: new Date().toISOString()
    },
    prefer: 'return=representation'
  });
}

/**
 * Diagnostic function to inspect actual live database tables and RPC status
 */
export async function inspectDatabaseState() {
  const status = getSupabaseStatus();
  if (!status.configured) {
    return {
      configured: false,
      projectRef: 'NOT_CONFIGURED',
      error: 'Supabase credentials not configured'
    };
  }

  const tableCheck = await supabaseFetch('inquiry_idempotency_ledger?limit=1');
  const rpcCheck = await supabaseFetch('rpc/reserve_idempotency_lock', {
    method: 'POST',
    body: { p_key: 'probe_test', p_hash: 'probe_hash' }
  });
  const leadsCheck = await supabaseFetch('leads?limit=1');
  const crmCheck = await supabaseFetch('crm_activities?limit=1');
  const openApiCheck = await supabaseFetch('');

  const openApiPaths = openApiCheck.success && openApiCheck.data?.paths ? Object.keys(openApiCheck.data.paths) : [];

  return {
    configured: true,
    projectRef: status.projectRef,
    availablePostgRestEndpoints: openApiPaths,
    tableCheck: {
      success: tableCheck.success,
      status: tableCheck.status,
      error: tableCheck.error,
      data: tableCheck.data || null
    },
    rpcCheck: {
      success: rpcCheck.success,
      status: rpcCheck.status,
      error: rpcCheck.error
    },
    leadsCheck: {
      success: leadsCheck.success,
      status: leadsCheck.status,
      error: leadsCheck.error
    },
    crmCheck: {
      success: crmCheck.success,
      status: crmCheck.status,
      error: crmCheck.error
    }
  };
}

