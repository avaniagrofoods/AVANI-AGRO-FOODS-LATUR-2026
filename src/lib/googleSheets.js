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

const WEBHOOK_URL = import.meta.env.VITE_GOOGLE_SHEETS_WEBHOOK || '';

/**
 * Log an affiliate event to Google Sheets
 * @param {Object} data - Event data
 * @param {string} data.type - 'REGISTRATION' | 'CLICK' | 'SALE' | 'VIEW'
 * @param {string} data.affId - Affiliate ID
 * @param {string} data.affName - Affiliate name
 * @param {string} data.affEmail - Affiliate email
 * @param {string} data.product - Product/link clicked
 * @param {string} data.platform - Amazon/iHerb/Direct
 * @param {number} [data.amount] - For SALE events
 */
export async function logAffiliateEvent(data) {
  if (!WEBHOOK_URL || WEBHOOK_URL.includes('YOUR_DEPLOYMENT_ID')) {
    // Fallback: store locally for now
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

    // Use no-cors because GAS web apps often require it from browser
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
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
export async function logAffiliateRegistration({ affId, name, email, platform, followers }) {
  return logAffiliateEvent({
    type: 'REGISTRATION',
    affId,
    affName: name,
    affEmail: email,
    product: 'N/A',
    platform,
    followers,
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
