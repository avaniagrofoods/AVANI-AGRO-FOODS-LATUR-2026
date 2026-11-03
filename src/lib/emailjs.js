// ============================================================
// AVANI AGRO FOODS — SECURE CLIENT FORM SUBMISSION CLIENT
// Replaces browser-direct EmailJS transport with authenticated
// server-side API ingestion (/api/save-lead).
// Eliminates client-side credentials and unmonitored browser dispatch.
// ============================================================

function normalizePhone(val) {
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed.length >= 6 && trimmed.length <= 50 && trimmed !== 'N/A' && trimmed !== 'Not-Provided') {
      return trimmed;
    }
  }
  return ''; // Explicit empty string for optional phone; prevents injecting fabricated placeholder data
}

export async function sendContactEmail(formData) {
  const payload = {
    firstName: formData.firstName || '',
    lastName: formData.lastName || '',
    name: `${formData.firstName || ''} ${formData.lastName || ''}`.trim() || formData.name || 'Website Inquiry',
    email: formData.email,
    inquiryType: formData.inquiryType || 'General Inquiry',
    message: formData.message || '',
    phone: normalizePhone(formData.phone),
    company: formData.company || 'Direct Buyer',
    source: formData.source || 'Website_Contact_Form'
  };

  const res = await fetch('/api/save-lead', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    redirect: 'error'
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Server responded with ${res.status}`);
  }

  return res.json();
}

export async function sendAutoReply(formData) {
  // In accordance with Package 3E.67 & 3F: Browser-side direct auto-reply is disabled.
  // Auto-replies must be server-governed and abuse-protected under separate policy.
  return {
    success: true,
    status: 'AUTO_REPLY_SERVER_CONTROLLED',
    message: 'Auto-reply deferred to server-side policy'
  };
}

export async function sendAffiliateEmail(affData) {
  const payload = {
    name: affData.name,
    email: affData.email,
    phone: normalizePhone(affData.phone || affData.mobile),
    inquiryType: 'Affiliate Registration',
    message: `Affiliate ID: ${affData.affId || ''}, Platform: ${affData.platform || ''}, Followers: ${affData.followers || ''}`,
    source: 'Website_Affiliate_Form'
  };

  const res = await fetch('/api/save-lead', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    redirect: 'error'
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Server responded with ${res.status}`);
  }

  return res.json();
}

export async function sendQuoteEmail(quoteData, customerEmail) {
  // Quotation emails are strictly routed through authenticated server-side API (/api/quotation or /api/admin-quotations)
  return {
    success: true,
    status: 'SERVER_QUOTATION_REQUIRED',
    message: 'Quotation dispatch must be initiated via server-side /api/quotation endpoint.'
  };
}

export async function sendB2BRegistrationEmail(data) {
  const payload = {
    name: data.contactName || 'B2B Registrant',
    company: data.companyName || 'B2B Enterprise',
    email: data.email || data.contactEmail,
    phone: normalizePhone(data.mobile || data.contactPhone || data.phone),
    inquiryType: `B2B Registration - Plan: ${data.planName || 'Standard'}`,
    message: `Registration No: ${data.regNumber || 'N/A'}, Business Type: ${data.businessType || 'N/A'}, Country: ${data.country || 'India'}, Plan: ${data.planName || 'Standard'} (${data.planPrice || 'N/A'})`,
    source: 'Website_B2B_Registration'
  };

  const res = await fetch('/api/save-lead', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    redirect: 'error'
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Server responded with ${res.status}`);
  }

  return res.json();
}
