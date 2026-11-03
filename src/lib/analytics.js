// ============================================================
// AVANI AGRO FOODS — Centralized GA4 & Custom Analytics Tracker
// Safe event dispatching adhering to Google Analytics 4 standards.
// Zero PII (no passwords, emails, names, or phones transmitted).
// ============================================================

/**
 * Dispatches custom events to Google Analytics 4 (gtag) and dataLayer.
 * @param {string} eventName - Standardized GA4 event name
 * @param {Object} params - Event metadata (sanitized, non-PII)
 */
export function trackEvent(eventName, params = {}) {
  try {
    // 1. Send to GA4 gtag if loaded
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, {
        ...params,
        send_to_timestamp: Date.now(),
      })
    }

    // 2. Push to Google Tag Manager dataLayer if present
    if (window.dataLayer && Array.isArray(window.dataLayer)) {
      window.dataLayer.push({
        event: eventName,
        ...params,
      })
    }

    // 3. Log event in development environment
    if (import.meta.env.DEV) {
      console.log(`[GA4 Event] ${eventName}:`, params)
    }
  } catch (err) {
    // Silently prevent tracking exceptions from impacting user experience
  }
}

// ── STANDARDIZED GA4 & CUSTOM EVENTS ─────────────────────────

export const ANALYTICS_EVENTS = {
  // Google Recommended Events
  GENERATE_LEAD: 'generate_lead',
  LOGIN: 'login',
  SIGN_UP: 'sign_up',
  
  // Custom B2B & Export Workflow Events (Necessary for specific funnel tracking)
  CONTACT_FORM_SUBMIT: 'contact_form_submit',
  QUOTE_REQUEST: 'quote_request',
  WHATSAPP_CLICK: 'whatsapp_click',
  EMAIL_CLICK: 'email_click',
  CATALOG_DOWNLOAD: 'catalog_download',
  PRODUCT_INQUIRY: 'product_inquiry',
  MANUFACTURER_APPLICATION: 'manufacturer_application',
  B2B_TRIAL_START: 'b2b_trial_start',
  
  // High-Intent Lead Generation Events
  PRODUCT_PAGE_VIEW: 'product_page_view',
  ARTICLE_VIEW: 'article_view',
  RFQ_OPEN: 'rfq_open',
  RFQ_STARTED: 'rfq_started',
  RFQ_SUBMIT_SUCCESS: 'rfq_submit_success',
  RFQ_VALIDATION_FAILURE: 'rfq_validation_failure',
  PRODUCT_CTA_CLICK: 'product_cta_click'
}

export function trackProductPageView(productName = '', source = 'direct') {
  trackEvent(ANALYTICS_EVENTS.PRODUCT_PAGE_VIEW, {
    product_name: productName,
    page_source: source
  })
}

export function trackArticleView(articleTitle = '', slug = '', category = '') {
  trackEvent(ANALYTICS_EVENTS.ARTICLE_VIEW, {
    article_title: articleTitle,
    article_slug: slug,
    article_category: category
  })
}

export function trackRfqOpen(product = '', source = '') {
  trackEvent(ANALYTICS_EVENTS.RFQ_OPEN, {
    product_interest: product,
    rfq_source: source
  })
}

export function trackRfqStarted(product = '') {
  trackEvent(ANALYTICS_EVENTS.RFQ_STARTED, {
    product_interest: product
  })
}

export function trackRfqSubmitSuccess(inquiryId = '', product = '', quantity = '', country = '') {
  trackEvent(ANALYTICS_EVENTS.RFQ_SUBMIT_SUCCESS, {
    inquiry_id: inquiryId,
    product_interest: product,
    quantity_value: quantity,
    buyer_country: country
  })
  trackEvent(ANALYTICS_EVENTS.GENERATE_LEAD, {
    lead_source: 'b2b_rfq_system',
    inquiry_id: inquiryId
  })
}

export function trackRfqValidationFailure(product = '', errorReason = '') {
  trackEvent(ANALYTICS_EVENTS.RFQ_VALIDATION_FAILURE, {
    product_interest: product,
    validation_error: errorReason
  })
}

export function trackProductCtaClick(product = '', ctaLabel = '', source = '') {
  trackEvent(ANALYTICS_EVENTS.PRODUCT_CTA_CLICK, {
    product_interest: product,
    cta_label: ctaLabel,
    click_source: source
  })
}

export function trackWhatsAppClick(source = 'general', product = '') {
  trackEvent(ANALYTICS_EVENTS.WHATSAPP_CLICK, {
    click_source: source,
    product_interest: product || 'general',
  })
}

export function trackEmailClick(source = 'general') {
  trackEvent(ANALYTICS_EVENTS.EMAIL_CLICK, {
    click_source: source,
  })
}

export function trackContactSubmit(serviceType = 'export_inquiry') {
  trackEvent(ANALYTICS_EVENTS.CONTACT_FORM_SUBMIT, {
    service_type: serviceType,
  })
  trackEvent(ANALYTICS_EVENTS.GENERATE_LEAD, {
    lead_source: 'contact_form',
  })
}

export function trackManufacturerApplication(productType = '') {
  trackEvent(ANALYTICS_EVENTS.MANUFACTURER_APPLICATION, {
    product_type: productType,
  })
  trackEvent(ANALYTICS_EVENTS.GENERATE_LEAD, {
    lead_source: 'manufacturer_onboarding',
  })
}

export function trackB2BTrialStart(tier = 'India Trial 1-Month', billingCountry = '') {
  trackEvent(ANALYTICS_EVENTS.B2B_TRIAL_START, {
    tier,
    billing_country: billingCountry || 'India',
  })
  trackEvent(ANALYTICS_EVENTS.SIGN_UP, {
    method: 'b2b_registration',
    tier,
  })
}

export function trackAffiliateLogin() {
  trackEvent(ANALYTICS_EVENTS.LOGIN, {
    method: 'affiliate_password_gate',
  })
}

export function trackCatalogDownload(catalogType = 'master_pdf') {
  trackEvent(ANALYTICS_EVENTS.CATALOG_DOWNLOAD, {
    catalog_type: catalogType,
  })
}

export function trackProductInquiry(productName = '') {
  trackEvent(ANALYTICS_EVENTS.PRODUCT_INQUIRY, {
    product_name: productName,
  })
}
