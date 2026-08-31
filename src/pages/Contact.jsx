import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import SEO from '../components/SEO'
import { sendContactEmail, sendAutoReply } from '../lib/emailjs'
import { logInquiry } from '../lib/googleSheets'
import { BUSINESS_INFO, WHATSAPP_NUMBER } from '../data/links'
import { trackContactSubmit } from '../lib/analytics'
import {
  Mail, Phone, MapPin, MessageSquare, Send, Globe,
  Shield, CheckCircle2, Building2, Package, CheckSquare,
  HelpCircle, Clock, AlertCircle
} from 'lucide-react'

const BUSINESS_TYPES = [
  'Importer',
  'Distributor',
  'Wholesaler',
  'Food Manufacturer',
  'Private Label Brand',
  'Food Service / Catering',
  'Retailer',
  'Trader / Broker',
  'Other'
]

const PRODUCTS = [
  'Moringa Powder',
  'Red Onion Powder',
  'Both Products',
  'Other Agricultural Ingredient'
]

const INCOTERMS = [
  'FOB Nhava Sheva (JNPT Mumbai)',
  'CIF Destination Port',
  'CFR Destination Port',
  'EXW (Partner Facility)',
  'Air Cargo (Mumbai)',
  'Other'
]

export default function Contact() {
  const navigate = useNavigate()
  const redirectTimer = useRef(null)
  const { email, phone, whatsapp, address } = BUSINESS_INFO

  const [form, setForm] = useState({
    fullName: '',
    companyName: '',
    country: '',
    businessType: BUSINESS_TYPES[0],
    email: '',
    phone: '',
    product: PRODUCTS[0],
    quantity: '500',
    frequency: 'One-Time Order',
    meshSize: '80–100 Mesh',
    moisture: '≤ 7.0%',
    packaging: '25 kg Drums / Cartons',
    privateLabel: 'Standard Export Packaging',
    targetPrice: '',
    incoterm: INCOTERMS[0],
    destinationPort: '',
    deliveryTimeline: 'Standard (14–21 days)',
    testingReqs: 'Standard COA (Microbiology, Heavy Metals, Moisture)',
    additionalMessage: '',
    honeypot: '' // Spam protection trap
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
    
    // Spam protection
    if (form.honeypot) {
      console.warn('Spam submission detected.')
      return
    }

    setLoading(true)
    setStatus('')

    try {
      const formattedMessage = `
--- B2B SOURCING REQUIREMENT ---
Company: ${form.companyName}
Business Type: ${form.businessType}
Country: ${form.country}
Product: ${form.product}
Quantity: ${form.quantity} kg (${form.frequency})
Mesh: ${form.meshSize} | Moisture: ${form.moisture}
Packaging: ${form.packaging} | Private Label: ${form.privateLabel}
Incoterm: ${form.incoterm} | Port: ${form.destinationPort}
Delivery Timeline: ${form.deliveryTimeline}
Target Price: ${form.targetPrice || 'Market'}
Testing/Certifications: ${form.testingReqs}

Additional Notes:
${form.additionalMessage}
      `.trim()

      // 1. EmailJS Notification
      await sendContactEmail({
        firstName: form.fullName,
        lastName: `(${form.country} - ${form.companyName})`,
        email: form.email,
        inquiryType: `B2B RFQ: ${form.product} (${form.quantity}kg)`,
        message: formattedMessage,
        phone: form.phone,
        company: form.companyName
      })

      // 2. Serverless Lead Capture
      try {
        await fetch('/api/save-lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.fullName,
            email: form.email,
            phone: form.phone,
            company: form.companyName,
            country: form.country,
            product: form.product,
            quantity: Number(form.quantity) || 500,
            currency: 'USD',
            incoterm: form.incoterm,
            destination: form.destinationPort,
            message: formattedMessage,
            source: 'Website_Contact_RFQ'
          })
        });
      } catch (err) { console.error('Save Lead API Error:', err); }

      // 3. Google Sheets Logging Fallback
      try {
        await logInquiry({
          firstName: form.fullName,
          lastName: form.country,
          email: form.email,
          phone: form.phone,
          company: form.companyName,
          country: form.country,
          inquiryType: `B2B Sourcing: ${form.product}`,
          message: formattedMessage
        })
      } catch (err) { console.error('Sheets Error:', err) }

      // 4. Auto Reply to Customer
      try {
        await sendAutoReply({
          firstName: form.fullName,
          email: form.email
        })
      } catch {}

      // 5. Analytics Event
      trackContactSubmit(`B2B RFQ: ${form.product}`);

      setStatus('success')
      setIsSuccess(true)

      // Save to LocalStorage for Admin Dashboard
      const newEnquiry = {
        id: Date.now(),
        ...form,
        date: new Date().toLocaleString(),
        isFulfilled: false
      }
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
        title="Send Your B2B Product Requirement | AVANI AGRO FOODS"
        description="Submit your B2B agricultural sourcing requirements for Moringa Powder and Red Onion Powder. AVANI AGRO FOODS coordinates with vetted Indian manufacturers for indicative quotations."
        keywords="b2b product requirement, moringa rfq, red onion powder quotation, agro sourcing inquiry india, sachin shinde latur"
      />

      <div className="page-top" style={{ minHeight: '100vh', background: '#f8faf8', paddingBottom: 80 }}>
        
        {/* Header Hero */}
        <div style={{ background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))', padding: '72px 0 56px', textAlign: 'center', color: 'white' }}>
          <div className="container" style={{ maxWidth: 840 }}>
            <div className="section-tag" style={{ justifyContent: 'center', background: 'rgba(255,255,255,0.15)', color: 'white', display: 'inline-flex', marginBottom: 16 }}>
              <MessageSquare size={14} /> Commercial B2B Inquiry
            </div>
            <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, color: 'white', marginBottom: 14 }}>
              Send Your B2B Product Requirement
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1.05rem', maxWidth: 640, margin: '0 auto', lineHeight: 1.7 }}>
              Tell us what you need and AVANI AGRO FOODS will coordinate with suitable Indian manufacturers, processors, or suppliers based on your requirements.
            </p>
          </div>
        </div>

        <div className="container" style={{ paddingTop: 48 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 40, alignItems: 'flex-start' }}>

            {/* Left Column: Contact Details & Importer Checklist */}
            <div>
              
              {/* Importer Requirement Checklist */}
              <div className="card" style={{ padding: '30px', background: 'white', borderLeft: '4px solid var(--color-primary)', marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <CheckSquare size={20} color="var(--color-primary)" />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
                    Information That Helps Us Respond Faster
                  </h3>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', lineHeight: 1.6, marginBottom: 16 }}>
                  Providing specific parameters allows our trade coordination desk to verify harvest batch availability and return an accurate proforma estimate:
                </p>
                <ol style={{ paddingLeft: 20, margin: 0, fontSize: '0.84rem', color: 'var(--color-text)', lineHeight: 1.8 }}>
                  <li>Target Product (Moringa / Red Onion)</li>
                  <li>Required Volume (kg or Metric Tons)</li>
                  <li>Mesh Size &amp; Technical Specifications</li>
                  <li>Export Packaging Preference</li>
                  <li>Destination Country &amp; Port of Entry</li>
                  <li>Required Delivery Timeline</li>
                  <li>Batch Testing &amp; COA Requirements</li>
                  <li>Private Label Requirement (if any)</li>
                  <li>Target Commercial Terms (FOB / CIF)</li>
                  <li>Expected Purchase Frequency</li>
                </ol>
              </div>

              {/* Commercial Contact Details */}
              <div className="card" style={{ padding: '30px', background: 'white' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: 20, color: 'var(--color-text)' }}>
                  Commercial Contact
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div style={{ display: 'flex', gap: 14 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(26,77,46,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Mail size={18} color="var(--color-primary)" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-light)' }}>Official Email</div>
                      <a href={`mailto:${email}`} style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-primary)' }}>{email}</a>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 14 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(26,77,46,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Phone size={18} color="var(--color-primary)" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-light)' }}>Phone / WhatsApp</div>
                      <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-primary)' }}>{phone}</a>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 14 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(26,77,46,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <MapPin size={18} color="var(--color-primary)" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-light)' }}>Business Location</div>
                      <address style={{ fontSize: '0.85rem', fontWeight: 600, fontStyle: 'normal', lineHeight: 1.5, color: 'var(--color-text)' }}>
                        <strong>{BUSINESS_INFO.name}</strong><br />
                        Sachin Shinde (Trade Coordinator)<br />
                        {address.full}
                      </address>
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 18, marginTop: 20 }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-light)', lineHeight: 1.6 }}>
                    <strong>Response Timeline:</strong> Standard business inquiries are reviewed and answered within 24 business hours.
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: B2B Requirement RFQ Form */}
            <div>
              {isSuccess ? (
                <div className="card" style={{ padding: '48px 36px', textAlign: 'center', background: 'white' }}>
                  <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'rgba(26,77,46,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <CheckCircle2 size={38} color="var(--color-primary)" />
                  </div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-primary)', marginBottom: 12 }}>
                    Requirement Received Successfully
                  </h2>
                  <p style={{ color: 'var(--color-text)', fontSize: '0.95rem', lineHeight: 1.7, maxWidth: 520, margin: '0 auto 24px' }}>
                    Thank you, <strong>{form.fullName}</strong>. Your sourcing requirement for <strong>{form.product}</strong> ({form.quantity} kg) has been submitted to AVANI AGRO FOODS. Our trade coordination desk will review specifications and respond to <strong>{form.email}</strong> within 24 business hours.
                  </p>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button onClick={() => setIsSuccess(false)} className="btn" style={{ background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)' }}>
                      Submit Another Requirement
                    </button>
                    <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hi Sachin, I submitted a B2B sourcing requirement for ${form.product}.`)}`} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                      Follow Up on WhatsApp
                    </a>
                  </div>
                </div>
              ) : (
                <div className="card" style={{ padding: '36px', background: 'white' }}>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 900, marginBottom: 6 }}>
                    B2B Requirement Form
                  </h2>
                  <p style={{ color: 'var(--color-text-light)', fontSize: '0.86rem', marginBottom: 24 }}>
                    Please fill out the parameters below to receive an indicative proforma quotation.
                  </p>

                  <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    
                    {/* Honeypot Spam Trap (Hidden) */}
                    <div style={{ display: 'none' }}>
                      <input name="honeypot" value={form.honeypot} onChange={e => set('honeypot', e.target.value)} tabIndex={-1} autoComplete="off" />
                    </div>

                    {/* Row 1: Name & Company */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                      <div>
                        <label className="label">Full Name *</label>
                        <input className="input" required value={form.fullName} onChange={e => set('fullName', e.target.value)} placeholder="Full Name" />
                      </div>
                      <div>
                        <label className="label">Company Name *</label>
                        <input className="input" required value={form.companyName} onChange={e => set('companyName', e.target.value)} placeholder="Company / Importer Name" />
                      </div>
                    </div>

                    {/* Row 2: Email & Phone */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                      <div>
                        <label className="label">Business Email *</label>
                        <input type="email" className="input" required value={form.email} onChange={e => set('email', e.target.value)} placeholder="purchasing@company.com" />
                      </div>
                      <div>
                        <label className="label">WhatsApp / Phone *</label>
                        <input className="input" required value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+1 234 567 8900" />
                      </div>
                    </div>

                    {/* Row 3: Country & Business Type */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                      <div>
                        <label className="label">Country of Business *</label>
                        <input className="input" required value={form.country} onChange={e => set('country', e.target.value)} placeholder="e.g. USA, Germany, UAE, Japan" />
                      </div>
                      <div>
                        <label className="label">Business Type</label>
                        <select className="input" value={form.businessType} onChange={e => set('businessType', e.target.value)}>
                          {BUSINESS_TYPES.map(bt => <option key={bt} value={bt}>{bt}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Row 4: Product & Volume */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                      <div>
                        <label className="label">Product Required *</label>
                        <select className="input" value={form.product} onChange={e => set('product', e.target.value)}>
                          {PRODUCTS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="label">Required Quantity (kg) *</label>
                        <input type="number" min="100" className="input" required value={form.quantity} onChange={e => set('quantity', e.target.value)} placeholder="Min 100 kg" />
                      </div>
                    </div>

                    {/* Row 5: Incoterm & Destination Port */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                      <div>
                        <label className="label">Preferred Incoterm</label>
                        <select className="input" value={form.incoterm} onChange={e => set('incoterm', e.target.value)}>
                          {INCOTERMS.map(term => <option key={term} value={term}>{term}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="label">Destination Port / City</label>
                        <input className="input" value={form.destinationPort} onChange={e => set('destinationPort', e.target.value)} placeholder="e.g. Port of Los Angeles / Rotterdam" />
                      </div>
                    </div>

                    {/* Row 6: Specifications (Mesh & Packaging) */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                      <div>
                        <label className="label">Mesh Size / Specification</label>
                        <input className="input" value={form.meshSize} onChange={e => set('meshSize', e.target.value)} placeholder="e.g. 80–100 Mesh" />
                      </div>
                      <div>
                        <label className="label">Packaging Preference</label>
                        <input className="input" value={form.packaging} onChange={e => set('packaging', e.target.value)} placeholder="e.g. 25 kg HDPE Drums / Sacks" />
                      </div>
                    </div>

                    {/* Row 7: Testing & Private Label */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                      <div>
                        <label className="label">Testing / Certification Needs</label>
                        <input className="input" value={form.testingReqs} onChange={e => set('testingReqs', e.target.value)} placeholder="e.g. Heavy Metals, Pesticides, COA" />
                      </div>
                      <div>
                        <label className="label">Target Price (USD/kg - Optional)</label>
                        <input className="input" value={form.targetPrice} onChange={e => set('targetPrice', e.target.value)} placeholder="e.g. Indicative Budget" />
                      </div>
                    </div>

                    {/* Additional Message */}
                    <div>
                      <label className="label">Detailed Requirements &amp; Notes</label>
                      <textarea className="input" rows={3} value={form.additionalMessage} onChange={e => set('additionalMessage', e.target.value)} placeholder="Mention any private label artwork needs, specific microbiological limits, or target shipment deadlines..." style={{ resize: 'vertical' }} />
                    </div>

                    {status === 'error' && (
                      <div style={{ color: '#dc2626', fontSize: '0.85rem', background: '#fef2f2', padding: 12, borderRadius: 8, border: '1px solid #fecaca' }}>
                        ⚠️ Submission failed. Please email us directly at <a href={`mailto:${email}`} style={{ color: '#dc2626', fontWeight: 700 }}>{email}</a>
                      </div>
                    )}

                    <button id="submit-requirement" type="submit" className="btn btn-primary" disabled={loading} style={{ justifyContent: 'center', height: 50, fontSize: '0.95rem' }}>
                      {loading ? 'Submitting Requirement...' : <><Send size={18} /> Submit B2B Sourcing Requirement</>}
                    </button>

                    <p style={{ fontSize: '0.72rem', color: 'var(--color-text-light)', textAlign: 'center', margin: 0 }}>
                      We respect your privacy. Data is used strictly for commercial quotation coordination.
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
