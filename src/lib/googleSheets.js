// ============================================================
// GOOGLE SHEETS WEBHOOK — Affiliate Tracking
// Sheet: https://docs.google.com/spreadsheets/d/1X2TTc9iQ2IWCTQV0RknH37A3lmIFaaC0ImT4rfBPuLI
// ============================================================
// 
// SETUP INSTRUCTIONS:
// 1. Open the Google Sheet above
// 2. Click Extensions → Apps Script
// 3. Paste the script from /public/sheets-webhook.txt into the editor
// 4. Deploy → New Deployment → Web App → "Anyone" access
// 5. Copy the deployment URL and paste into VITE_GOOGLE_SHEETS_WEBHOOK in .env.local
// ============================================================

const WEBHOOK_URL = import.meta.env.VITE_GOOGLE_SHEETS_WEBHOOK || "https://script.google.com/macros/s/AKfycbxQN2Z7Bi7V-iZFibeeFkOyOOaMeX-4jFF3hv4GIYSGILDpoKbMq1WpXlAlX_Uims8k/exec";

/**
 * Log an affiliate event to Google Sheets
 * @param {Object} data - Event data
 */
export async function logAffiliateEvent(data) {
  if (!WEBHOOK_URL || WEBHOOK_URL.includes('YOUR_DEPLOYMENT_ID')) {
    // Fallback: store locally
    const existing = JSON.parse(localStorage.getItem('aff_events') || '[]');
    existing.push({ ...data, timestamp: new Date().toISOString() });
    localStorage.setItem('aff_events', JSON.stringify(existing));
    console.log('[Sheets] Webhook not configured — logged locally:', data);
    return { success: true, local: true };
  }

  try {
    const payload = {
      ...data,
      timestamp: new Date().toISOString(),
      source: window.location.href
    };

    // IMPORTANT: In no-cors mode, we cannot set Content-Type to application/json.
    // We send it as a plain string which defaults to text/plain, avoiding preflight.
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify(payload)
    });

    // Also store locally as backup
    const existing = JSON.parse(localStorage.getItem('aff_events') || '[]');
    existing.push({ ...payload });
    localStorage.setItem('aff_events', JSON.stringify(existing));

    return { success: true };
  } catch (err) {
    console.error('[Sheets] Failed to log event:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Log a new affiliate registration
 */
export async function logAffiliateRegistration({ affId, name, email, phone, platform, followers, why }) {
  return logAffiliateEvent({
    type: 'REGISTRATION',
    affId,
    affName: name,
    affEmail: email,
    phone,
    product: 'N/A',
    platform,
    followers,
    why,
    amount: 0
  });
}

/**
 * Log a link click
 */
export async function logAffiliateClick({ affId, affName, affEmail, product, platform }) {
  return logAffiliateEvent({
    type: 'CLICK',
    affId,
    affName,
    affEmail,
    product,
    platform,
    amount: 0
  });
}

/**
 * Log a general inquiry / export request
 */
export async function logInquiry(formData) {
  return logAffiliateEvent({
    type: 'INQUIRY',
    affId: 'GENERAL',
    affName: `${formData.firstName} ${formData.lastName}`,
    affEmail: formData.email,
    product: formData.inquiryType,
    platform: formData.company || 'N/A',
    followers: formData.country,
    amount: 0,
    message: formData.message
  });
}

/**
 * Log a new B2B registration
 */
export async function logB2BRegistration(data) {
  return logAffiliateEvent({
    type: 'B2B_REGISTRATION',
    affId: data.regNumber || 'B2B',
    affName: data.companyName,
    affEmail: data.email,
    phone: data.mobile,
    product: data.planName,
    platform: data.businessType,
    followers: data.country,
    amount: 0,
    message: `Contact: ${data.contactName}. License: ${data.license?.name || 'No'}. Photo: ${data.warehousePhoto?.name || 'No'}`
  });
}

/**
 * Get all locally stored events (for admin view when webhook is not set)
 */
export function getLocalEvents() {
  return JSON.parse(localStorage.getItem('aff_events') || '[]');
}

/**
 * Clear local events
 */
export function clearLocalEvents() {
  localStorage.removeItem('aff_events');
}
