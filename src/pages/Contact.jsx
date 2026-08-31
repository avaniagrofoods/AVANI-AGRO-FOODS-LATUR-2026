import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import SEO from '../components/SEO'
import { sendContactEmail, sendAutoReply } from '../lib/emailjs'
import { logInquiry } from '../lib/googleSheets'
import { BUSINESS_INFO } from '../data/links'
import { trackContactSubmit } from '../lib/analytics'
import { Mail, Phone, MapPin, MessageSquare, Send, Globe, Shield, CheckCircle2, Building2, Package } from 'lucide-react'

const INQUIRY_TYPES = [
  'B2B Sourcing: Moringa Powder',
  'B2B Sourcing: Red Onion Powder',
  'Commercial Export Pricing Request',
  'Pre-Shipment Sample Request',
  'Distributor / Importer Partnership',
  'General Inquiry / Resources Question',
]

export default function Contact() {
  const navigate = useNavigate()
  const redirectTimer = useRef(null)
  const { email, phone, whatsapp, address } = BUSINESS_INFO

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    country: '',
    destinationPort: '',
    estimatedQuantity: '100',
    incoterm: 'FOB Nhava Sheva (Mumbai)',
    inquiryType: INQUIRY_TYPES[0],
    message: ''
  })
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

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
      await sendContactEmail({
        firstName: form.firstName,
        lastName: `${form.lastName} (${form.country})`,
        email: form.email,
        inquiryType: form.inquiryType,
        message: `Company: ${form.company}. Estimated Volume: ${form.estimatedQuantity} kg. Target Incoterm: ${form.incoterm}. Destination Port: ${form.destinationPort}. Message: ${form.message}`,
        phone: form.phone,
        company: form.company
      })

      // 2. Serverless Lead Capture
      try {
        await fetch('/api/save-lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `${form.firstName} ${form.lastName}`.trim(),
            email: form.email,
            phone: form.phone,
            company: form.company,
            country: form.country,
            product: form.inquiryType,
            quantity: Number(form.estimatedQuantity) || 100,
            currency: 'USD',
            incoterm: form.incoterm,
            destination: form.destinationPort,
            message: form.message,
            source: 'Website_Contact_B2B_RFQ'
          })
        });
      } catch (err) { console.error('Save Lead API Error:', err); }

      // 3. Google Sheets Logging Fallback
      try { await logInquiry(form) } catch (err) { console.error('Sheets Error:', err) }

      // 4. HubSpot CRM Submission
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
        if (!hsResponse.ok) console.warn('HubSpot Submission non-blocking notification')
      } catch (err) { console.error('HubSpot Error:', err) }

      // 5. Auto Reply to Customer
      try { await sendAutoReply(form) } catch {}

      // 6. Analytics Event
      trackContactSubmit(form.inquiryType);

      setStatus('success')
      setIsSuccess(true)

      // Save to LocalStorage for Admin Dashboard
      const newEnquiry = { id: Date.now(), ...form, date: new Date().toLocaleString(), isFulfilled: false }
      const existingEnquiries = JSON.parse(localStorage.getItem('avani_enquiries') || '[]')
      localStorage.setItem('avani_enquiries', JSON.stringify([newEnquiry, ...existingEnquiries]))
      window.dispatchEvent(new Event('enquiry-updated'))

    } catch (err) {
      console.error(err)
      setStatus('error')
    }
    setLoading(false)
  }

  return (
    <>
      <SEO
        title="Contact & Export Sourcing RFQ | AVANI AGRO FOODS"
        description="Connect with AVANI AGRO FOODS for Moringa Powder and Red Onion Powder B2B export pricing, sample requests, and sourcing coordination. Located in Latur, Maharashtra."
        keywords="contact avani agro foods, moringa powder export inquiry, red onion powder quotation, B2B agro sourcing india, sachin shinde latur"
      />

      <div className="page-top">
        {/* Header Hero */}
        <div style={{ background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))', padding: '80px 0', textAlign: 'center', color: 'white' }}>
          <div className="container">
            <div className="section-tag" style={{ justifyContent: 'center', background: 'rgba(255,255,255,0.15)', color: 'white', display: 'inline-flex', marginBottom: 16 }}>
              <MessageSquare size={14} /> Commercial Sourcing Inquiry
            </div>
            <h1 style={{ fontSize: 'clamp(2.2rem, 4vw, 3rem)', fontWeight: 900, color: 'white', marginBottom: 16 }}>
              Request a B2B Export Quotation
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1.05rem', maxWidth: 580, margin: '0 auto', lineHeight: 1.7 }}>
              Submit your required product specifications, target volume, and destination port. Our sourcing coordination team will respond with a formal proforma quotation.
            </p>
          </div>
        </div>

        <div className="container" style={{ padding: '72px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: 48, alignItems: 'flex-start' }}>

            {/* Contact & Business Profile Info */}
            <div>
              <div className="card" style={{ padding: '36px', background: 'white' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 900, marginBottom: 24, color: 'var(--color-text)' }}>
                  Commercial Contact
                </h2>
                
                {[
                  { icon: Mail, label: 'Official Business Email', value: email, href: `mailto:${email}` },
                  { icon: Phone, label: 'Direct WhatsApp / Phone', value: phone, href: `https://wa.me/${whatsapp}` },
                  { icon: Globe, label: 'Standard Export Ports', value: 'JNPT / Nhava Sheva (Mumbai) & Air Cargo', href: null },
                ].map(({ icon: Icon, label, value, href }) => (
                  <div key={label} style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(26,77,46,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={20} color="var(--color-primary)" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-light)', marginBottom: 4 }}>{label}</div>
                      {href ? (
                        <a href={href} target={href.startsWith('http') ? '_blank' : '_self'} rel="noopener noreferrer" style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-primary)', wordBreak: 'break-all' }}>{value}</a>
                      ) : (
                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{value}</span>
                      )}
                    </div>
                  </div>
                ))}

                {/* Office Address */}
                <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(26,77,46,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <MapPin size={20} color="var(--color-primary)" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-light)', marginBottom: 4 }}>Business Address</div>
                    <address style={{ fontSize: '0.88rem', fontWeight: 600, fontStyle: 'normal', lineHeight: 1.6 }}>
                      <strong>{BUSINESS_INFO.name}</strong><br />
                      {address.full}
                    </address>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 20, marginTop: 8 }}>
                  <h3 style={{ fontWeight: 800, marginBottom: 10, fontSize: '0.95rem' }}>Business Hours</h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', lineHeight: 1.8 }}>
                    <div>Monday – Saturday: 9:00 AM – 7:00 PM IST</div>
                    <div>Sunday: Closed (WhatsApp messages queued)</div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 20, marginTop: 16 }}>
                  <h3 style={{ fontWeight: 800, marginBottom: 12, fontSize: '0.95rem' }}>Verification &amp; Compliance</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.82rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle2 size={14} color="var(--color-primary)" /> Udyam / MSME Registered Firm
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle2 size={14} color="var(--color-primary)" /> Batch Lab COA Verification
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle2 size={14} color="var(--color-primary)" /> Phytosanitary &amp; COO Support
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* RFQ Form */}
            <div>
              {isSuccess ? (
                <div className="card" style={{ padding: '48px 36px', textAlign: 'center', background: 'white' }}>
                  <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(26,77,46,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <CheckCircle2 size={40} color="var(--color-primary)" />
                  </div>
                  <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--color-primary)', marginBottom: 12 }}>
                    Inquiry Received Successfully
                  </h2>
                  <p style={{ color: 'var(--color-text)', fontSize: '0.95rem', lineHeight: 1.7, maxWidth: 540, margin: '0 auto 24px' }}>
                    Thank you, <strong>{form.firstName}</strong>. Your commercial inquiry for <strong>{form.inquiryType}</strong> has been logged. Our export team will evaluate your parameters and respond to <strong>{form.email}</strong> within 24 business hours.
                  </p>
                  <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button onClick={() => setIsSuccess(false)} className="btn" style={{ background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)' }}>
                      Submit Another Inquiry
                    </button>
                    <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hi Sachin, I submitted an RFQ for ${form.inquiryType}.`)}`} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                      Follow Up on WhatsApp
                    </a>
                  </div>
                </div>
              ) : (
                <div className="card" style={{ padding: '40px', background: 'white' }}>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: 6 }}>
                    B2B RFQ Form
                  </h2>
                  <p style={{ color: 'var(--color-text-light)', fontSize: '0.88rem', marginBottom: 28 }}>
                    Please provide detailed product, volume, and destination requirements.
                  </p>

                  <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div>
                        <label className="label" htmlFor="first-name">First Name *</label>
                        <input id="first-name" className="input" required value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="First Name" />
                      </div>
                      <div>
                        <label className="label" htmlFor="last-name">Last Name *</label>
                        <input id="last-name" className="input" required value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Last Name" />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div>
                        <label className="label" htmlFor="contact-email">Business Email *</label>
                        <input id="contact-email" type="email" className="input" required value={form.email} onChange={e => set('email', e.target.value)} placeholder="purchasing@company.com" />
                      </div>
                      <div>
                        <label className="label" htmlFor="contact-phone">Phone / WhatsApp</label>
                        <input id="contact-phone" className="input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+1 234 567 8900" />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div>
                        <label className="label" htmlFor="contact-company">Company Name *</label>
                        <input id="contact-company" className="input" required value={form.company} onChange={e => set('company', e.target.value)} placeholder="Company / Importer Name" />
                      </div>
                      <div>
                        <label className="label" htmlFor="contact-country">Country of Business *</label>
                        <input id="contact-country" className="input" required value={form.country} onChange={e => set('country', e.target.value)} placeholder="e.g. USA, Germany, UAE" />
                      </div>
                    </div>

                    <div>
                      <label className="label" htmlFor="inquiry-type">Inquiry Topic / Product Interest *</label>
                      <select id="inquiry-type" className="input" value={form.inquiryType} onChange={e => set('inquiryType', e.target.value)}>
                        {INQUIRY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div>
                        <label className="label" htmlFor="est-qty">Estimated Quantity (kg) *</label>
                        <input id="est-qty" type="number" min="100" className="input" required value={form.estimatedQuantity} onChange={e => set('estimatedQuantity', e.target.value)} placeholder="e.g. 500" />
                      </div>
                      <div>
                        <label className="label" htmlFor="incoterm">Preferred Incoterm</label>
                        <select id="incoterm" className="input" value={form.incoterm} onChange={e => set('incoterm', e.target.value)}>
                          <option value="FOB Nhava Sheva (Mumbai)">FOB Nhava Sheva (Mumbai)</option>
                          <option value="CIF Destination Port">CIF Destination Port</option>
                          <option value="CFR Destination Port">CFR Destination Port</option>
                          <option value="Air Cargo (Mumbai)">Air Cargo (Mumbai)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="label" htmlFor="dest-port">Target Destination Port</label>
                      <input id="dest-port" className="input" value={form.destinationPort} onChange={e => set('destinationPort', e.target.value)} placeholder="e.g. Port of Los Angeles / Hamburg / Jebel Ali" />
                    </div>

                    <div>
                      <label className="label" htmlFor="contact-message">Detailed Requirements / Specifications *</label>
                      <textarea id="contact-message" className="input" required rows={4} value={form.message} onChange={e => set('message', e.target.value)} placeholder="Please detail required mesh size (e.g. 80 mesh), packaging preferences (e.g. 25kg drums), required test reports, or sample requests..." style={{ resize: 'vertical' }} />
                    </div>

                    {status === 'error' && (
                      <div style={{ color: '#dc2626', fontSize: '0.85rem', background: '#fef2f2', padding: 12, borderRadius: 8, border: '1px solid #fecaca' }}>
                        ⚠️ Submission error. Please email us directly at <a href={`mailto:${email}`} style={{ color: '#dc2626', fontWeight: 700 }}>{email}</a>
                      </div>
                    )}

                    <button id="submit-contact" type="submit" className="btn btn-primary" disabled={loading} style={{ justifyContent: 'center', height: 52, fontSize: '0.95rem' }}>
                      {loading ? 'Submitting RFQ...' : <><Send size={18} /> Submit B2B RFQ Inquiry</>}
                    </button>

                    <p style={{ fontSize: '0.72rem', color: 'var(--color-text-light)', textAlign: 'center', margin: 0 }}>
                      Your information is protected under our Privacy Policy and will only be used to respond to your commercial inquiry.
                    </p>
                  </form>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
