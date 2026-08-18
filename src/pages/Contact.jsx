import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import SEO from '../components/SEO'
import { sendContactEmail, sendAutoReply } from '../lib/emailjs'
import { logInquiry } from '../lib/googleSheets'
import QuotationBuilder from '../components/QuotationBuilder'
import { BUSINESS_INFO } from '../data/links'
import { trackContactSubmit } from '../lib/analytics'
import { Mail, Phone, MapPin, MessageSquare, Send, Globe } from 'lucide-react'

const INQUIRY_TYPES = [
  'Export Pricing Request',
  'Sample Request',
  'Bulk B2B Inquiry',
  'Affiliate Program',
  'Importer / Distributor Partnership',
  'General Inquiry',
]

export default function Contact() {
  const navigate = useNavigate()
  const redirectTimer = useRef(null)
  const { email, phone, whatsapp, address } = BUSINESS_INFO

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', company: '', country: '',
    inquiryType: INQUIRY_TYPES[0], message: ''
  })
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [showQuote, setShowQuote] = useState(false)

  useEffect(() => {
    return () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current)
    }
  }, [])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus('')
    try {
      // 1. EmailJS Notification
      await sendContactEmail(form)

      // 2. Google Sheets Logging
      try { await logInquiry(form) } catch (err) { console.error('Sheets Error:', err) }

      // 3. HubSpot CRM Submission
      try {
        const hsResponse = await fetch('https://api-na2.hubspot.com/submissions/v3/integration/submit/246074335/ee1ee377-e19b-4026-80cd-f5eddbb35793', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fields: [
              { name: 'firstname', value: form.firstName },
              { name: 'lastname', value: form.lastName },
              { name: 'email', value: form.email },
              { name: 'mobilephone', value: form.phone },
              { name: 'company', value: form.company },
              { name: 'country', value: form.country },
              { name: 'message', value: form.message },
              { name: 'inquiry_type', value: form.inquiryType }
            ],
            context: { pageUri: window.location.href, pageName: document.title }
          })
        })
        if (!hsResponse.ok) throw new Error('HubSpot Submission Failed')
      } catch (err) { console.error('HubSpot Error:', err) }

      // 4. Auto Reply to Customer
      try { await sendAutoReply(form) } catch {}

      // 5. GA4 Conversion Event
      trackContactSubmit(form.inquiryType);

      setStatus('success')

      // 5. Save to LocalStorage for Admin Tracking
      const newEnquiry = { id: Date.now(), ...form, date: new Date().toLocaleString(), isFulfilled: false }
      const existingEnquiries = JSON.parse(localStorage.getItem('avani_enquiries') || '[]')
      localStorage.setItem('avani_enquiries', JSON.stringify([newEnquiry, ...existingEnquiries]))
      window.dispatchEvent(new Event('enquiry-updated'))

      if (['Export Pricing Request', 'Sample Request', 'Bulk B2B Inquiry', 'Importer / Distributor Partnership'].includes(form.inquiryType)) {
        setShowQuote(true)
        redirectTimer.current = setTimeout(() => navigate('/'), 5000)
      } else {
        redirectTimer.current = setTimeout(() => navigate('/'), 5000)
      }
    } catch (err) {
      console.error(err)
      setStatus('error')
    }
    setLoading(false)
  }

  return (
    <>
      <SEO
        title="Contact & Export Inquiry | AVANI AGRO FOODS Latur"
        description="Contact Avani Agro Foods for Moringa Powder and Onion Powder export pricing, bulk orders and sample requests. Old Barshi Road, Latur 413512, Maharashtra. Response within 24 hours."
        keywords="contact avani agro foods, moringa powder inquiry, onion powder bulk order, export inquiry india, latur maharashtra exporter"
      />

      <div className="page-top">
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))', padding: '80px 0', textAlign: 'center' }}>
          <div className="container">
            <div className="section-tag" style={{ justifyContent: 'center', background: 'rgba(255,255,255,0.1)', color: 'white', display: 'inline-flex', marginBottom: 20 }}>
              <MessageSquare size={14} /> Contact &amp; Inquiries
            </div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white', marginBottom: 16 }}>Get In Touch</h1>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1.05rem', maxWidth: 500, margin: '0 auto' }}>
              Send us your inquiry and receive a proforma quotation automatically. Response within 24 hours.
            </p>
          </div>
        </div>

        <div className="container" style={{ padding: '72px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 48, alignItems: 'flex-start' }}>

            {/* Contact Info */}
            <div>
              <div className="card" style={{ padding: '32px' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 900, marginBottom: 28 }}>Contact Details</h2>
                {[
                  { icon: Mail, label: 'Email', value: email, href: `mailto:${email}` },
                  { icon: Phone, label: 'WhatsApp / Phone', value: phone, href: `https://wa.me/${whatsapp}` },
                  { icon: Globe, label: 'Export Ports', value: 'Nhava Sheva (JN Port), Mumbai', href: null },
                ].map(({ icon: Icon, label, value, href }) => (
                  <div key={label} style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(26,77,46,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={20} color="var(--color-primary)" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-light)', marginBottom: 4 }}>{label}</div>
                      {href ? (
                        <a href={href} target={href.startsWith('http') ? '_blank' : '_self'} rel="noopener noreferrer" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-primary)', wordBreak: 'break-all' }}>{value}</a>
                      ) : (
                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{value}</span>
                      )}
                    </div>
                  </div>
                ))}

                {/* Official Address */}
                <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(26,77,46,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <MapPin size={20} color="var(--color-primary)" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-light)', marginBottom: 4 }}>Office Address</div>
                    <address style={{ fontSize: '0.9rem', fontWeight: 600, fontStyle: 'normal', lineHeight: 1.7 }}>
                      <strong>AVANI AGRO FOODS</strong><br />
                      {address.lines.map((line, i) => <span key={i}>{line}<br /></span>)}
                    </address>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 24, marginTop: 8 }}>
                  <h3 style={{ fontWeight: 800, marginBottom: 14, fontSize: '0.95rem' }}>Business Hours</h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', lineHeight: 2 }}>
                    <div>Monday – Saturday: 9:00 AM – 7:00 PM IST</div>
                    <div>Sunday: By Appointment</div>
                    <div style={{ marginTop: 8, color: 'var(--color-primary)', fontWeight: 600 }}>WhatsApp response 24/7</div>
                  </div>
                </div>

                <div style={{ marginTop: 28 }}>
                  <h3 style={{ fontWeight: 800, marginBottom: 14, fontSize: '0.95rem' }}>Compliance</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {['✅ Udyam Registered', '🤝 Partner APEDA Compliant', '🤝 Partner IEC Holders', '✅ GST Registered (Partner)'].map(c => (
                      <span key={c} style={{ fontSize: '0.8rem', color: 'var(--color-text)' }}>{c}</span>
                    ))}
                  </div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--color-text-light)', marginTop: 10, lineHeight: 1.5 }}>
                    FSSAI, APEDA and IEC registrations are held by our manufacturing partners who supply and process products exported by AVANI AGRO FOODS.
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <div>
              {status === 'success' && !showQuote && (
                <div style={{ background: 'rgba(26,77,46,0.1)', border: '1px solid var(--color-primary)', borderRadius: 'var(--radius-md)', padding: '20px', marginBottom: 28 }}>
                  <div style={{ fontWeight: 800, color: 'var(--color-primary)', marginBottom: 6 }}>✅ Message received!</div>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text)' }}>Thank you! We'll respond within 24 hours. A confirmation email has been sent to {form.email}.</p>
                  <p style={{ margin: '10px 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-light)' }}>Redirecting to Home page in 5 seconds...</p>
                </div>
              )}

              {!showQuote ? (
                <div className="card" style={{ padding: '40px' }}>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: 8 }}>Send an Inquiry</h2>
                  <p style={{ color: 'var(--color-text-light)', fontSize: '0.9rem', marginBottom: 32 }}>Fill out the form and a proforma quotation will appear automatically for export inquiries.</p>

                  <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div>
                        <label className="label" htmlFor="first-name">First Name *</label>
                        <input id="first-name" className="input" required value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="Sachin" />
                      </div>
                      <div>
                        <label className="label" htmlFor="last-name">Last Name *</label>
                        <input id="last-name" className="input" required value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Shinde" />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div>
                        <label className="label" htmlFor="contact-email">Business Email *</label>
                        <input id="contact-email" type="email" className="input" required value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@company.com" />
                      </div>
                      <div>
                        <label className="label" htmlFor="contact-phone">Phone / WhatsApp</label>
                        <input id="contact-phone" className="input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+1 234 567 8900" />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div>
                        <label className="label" htmlFor="contact-company">Company Name</label>
                        <input id="contact-company" className="input" value={form.company} onChange={e => set('company', e.target.value)} placeholder="Your Company Ltd." />
                      </div>
                      <div>
                        <label className="label" htmlFor="contact-country">Country *</label>
                        <input id="contact-country" className="input" required value={form.country} onChange={e => set('country', e.target.value)} placeholder="USA, UAE, UK..." />
                      </div>
                    </div>
                    <div>
                      <label className="label" htmlFor="inquiry-type">Inquiry Type *</label>
                      <select id="inquiry-type" className="input" value={form.inquiryType} onChange={e => set('inquiryType', e.target.value)}>
                        {INQUIRY_TYPES.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label" htmlFor="contact-message">Message / Requirements *</label>
                      <textarea id="contact-message" className="input" required rows={5} value={form.message} onChange={e => set('message', e.target.value)} placeholder="Please describe your requirements: product, quantity, destination country, packaging preference..." style={{ resize: 'vertical' }} />
                    </div>

                    {status === 'error' && (
                      <div style={{ color: '#dc2626', fontSize: '0.85rem', background: 'rgba(220,38,38,0.08)', padding: 12, borderRadius: 8 }}>
                        ⚠️ Failed to send. Please email us directly at <a href={`mailto:${email}`}>{email}</a>
                      </div>
                    )}

                    <button id="submit-contact" type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      {loading ? 'Sending...' : <><Send size={18} /> Send Inquiry &amp; Get Quotation</>}
                    </button>

                    <p style={{ fontSize: '0.72rem', color: 'var(--color-text-light)', textAlign: 'center', margin: 0 }}>
                      *This form is connected to EmailJS. If submission fails, WhatsApp us directly at {phone}.
                    </p>
                  </form>
                </div>
              ) : (
                <div className="animate-in">
                  <div style={{ background: 'rgba(26,77,46,0.08)', border: '1px solid var(--color-primary)', borderRadius: 'var(--radius-md)', padding: '32px', marginBottom: 40, textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: 16 }}>✅</div>
                    <div style={{ fontWeight: 900, color: 'var(--color-primary)', fontSize: '1.5rem', marginBottom: 12 }}>Inquiry Received Successfully!</div>
                    <p style={{ fontSize: '1rem', color: 'var(--color-text)', maxWidth: 600, margin: '0 auto 24px' }}>
                      Thank you for your interest in Avani Agro Foods. Our team will review your requirements and respond within 24 hours.
                    </p>
                    <div style={{ fontSize: '0.9rem', color: 'var(--color-text-light)' }}>
                      A confirmation email has been sent to <strong>{form.email}</strong>.
                    </div>
                    <div style={{ marginTop: 24, fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                      Redirecting to Home page in 5 seconds...
                    </div>
                  </div>

                  <div style={{ textAlign: 'center', marginTop: 24 }}>
                    <button onClick={() => { if (redirectTimer.current) clearTimeout(redirectTimer.current); navigate('/') }} className="btn" style={{ gap: 8 }}>
                      <MessageSquare size={16} /> ← Return to Home
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
