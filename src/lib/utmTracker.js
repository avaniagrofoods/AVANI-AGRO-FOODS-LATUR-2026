// ============================================================
// AVANI AGRO FOODS — Centralized UTM & Attribution Tracker
// Captures and preserves marketing campaign parameters across
// multi-page browsing sessions for accurate B2B lead attribution.
// ============================================================

const UTM_STORAGE_KEY = 'aaf_utm_data';
const LANDING_PAGE_KEY = 'aaf_landing_page';
const INITIAL_REFERRER_KEY = 'aaf_initial_referrer';

/**
 * Initializes and captures UTM parameters from current URL.
 * Persists in sessionStorage so parameters survive navigation across the site.
 */
export function initUtmTracking() {
  if (typeof window === 'undefined') return;

  try {
    const urlParams = new URLSearchParams(window.location.search);
    const utmFields = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid'];
    const currentUtms = {};
    let hasUtm = false;

    utmFields.forEach(field => {
      const val = urlParams.get(field);
      if (val) {
        currentUtms[field] = val.trim();
        hasUtm = true;
      }
    });

    // 1. Capture landing page if first visit in session
    if (!sessionStorage.getItem(LANDING_PAGE_KEY)) {
      sessionStorage.setItem(LANDING_PAGE_KEY, window.location.pathname + window.location.search);
    }

    // 2. Capture initial external referrer if first visit
    if (!sessionStorage.getItem(INITIAL_REFERRER_KEY) && document.referrer) {
      if (!document.referrer.includes(window.location.hostname)) {
        sessionStorage.setItem(INITIAL_REFERRER_KEY, document.referrer);
      }
    }

    // 3. Save UTM data
    if (hasUtm) {
      sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(currentUtms));
    }
  } catch (err) {
    // Fail silently without disrupting user interaction
  }
}

/**
 * Retrieves stored attribution parameters for attachment to RFQ payloads.
 */
export function getAttributionData() {
  if (typeof window === 'undefined') {
    return {
      utm_source: '',
      utm_medium: '',
      utm_campaign: '',
      utm_content: '',
      utm_term: '',
      landing_page: '',
      initial_referrer: ''
    };
  }

  try {
    const storedStr = sessionStorage.getItem(UTM_STORAGE_KEY);
    const parsedUtms = storedStr ? JSON.parse(storedStr) : {};
    const landingPage = sessionStorage.getItem(LANDING_PAGE_KEY) || window.location.pathname;
    const initialReferrer = sessionStorage.getItem(INITIAL_REFERRER_KEY) || document.referrer || '';

    return {
      utm_source: parsedUtms.utm_source || '',
      utm_medium: parsedUtms.utm_medium || '',
      utm_campaign: parsedUtms.utm_campaign || '',
      utm_content: parsedUtms.utm_content || '',
      utm_term: parsedUtms.utm_term || '',
      gclid: parsedUtms.gclid || '',
      landing_page: landingPage,
      initial_referrer: initialReferrer
    };
  } catch (err) {
    return {
      utm_source: '',
      utm_medium: '',
      utm_campaign: '',
      utm_content: '',
      utm_term: '',
      landing_page: '',
      initial_referrer: ''
    };
  }
}
