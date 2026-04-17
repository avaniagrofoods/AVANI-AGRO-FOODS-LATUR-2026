import emailjs from '@emailjs/browser'

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_ez4cafu'
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'keeklL2S-cJ4zYcyV'
const TEMPLATE_CONTACT = import.meta.env.VITE_EMAILJS_TEMPLATE_CONTACT || 'template_or9d6zk'
const TEMPLATE_AUTO_REPLY = import.meta.env.VITE_EMAILJS_TEMPLATE_AUTO_REPLY || 'template_g9rnfik'
const TEMPLATE_AFFILIATE = import.meta.env.VITE_EMAILJS_TEMPLATE_AFFILIATE || 'template_affiliate'
const TEMPLATE_QUOTE = import.meta.env.VITE_EMAILJS_TEMPLATE_QUOTE || 'template_quote'

// Initialize EmailJS
emailjs.init(PUBLIC_KEY)

export async function sendContactEmail(formData) {
  return emailjs.send(SERVICE_ID, TEMPLATE_CONTACT, {
    from_name: `${formData.firstName} ${formData.lastName}`,
    from_email: formData.email,
    inquiry_type: formData.inquiryType,
    message: formData.message,
    phone: formData.phone || 'Not provided',
    company: formData.company || 'Not provided',
    to_name: 'Sachin Shinde',
    to_email: 'avaniagrofoods1356@gmail.com'
  })
}

export async function sendAutoReply(formData) {
  return emailjs.send(SERVICE_ID, TEMPLATE_AUTO_REPLY, {
    to_name: `${formData.firstName} ${formData.lastName}`,
    to_email: formData.email,
    from_name: 'Avani Agro Foods',
    inquiry_type: formData.inquiryType
  })
}

export async function sendAffiliateEmail(affData) {
  return emailjs.send(SERVICE_ID, TEMPLATE_AFFILIATE, {
    aff_name: affData.name,
    aff_email: affData.email,
    aff_id: affData.affId,
    aff_platform: affData.platform,
    aff_followers: affData.followers,
    to_email: 'avaniagrofoods1356@gmail.com'
  })
}

export async function sendQuoteEmail(quoteData, customerEmail) {
  return emailjs.send(SERVICE_ID, TEMPLATE_QUOTE, {
    customer_name: quoteData.consigneeName,
    customer_email: customerEmail,
    quote_number: quoteData.quoteNumber,
    total: quoteData.total,
    product_summary: quoteData.items?.map(i => i.description).join(', '),
    to_email: customerEmail
  })
}
