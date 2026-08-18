import SEO from '../components/SEO'
import { BUSINESS_INFO } from '../data/links'

export default function Privacy() {
  const { email, phone, address } = BUSINESS_INFO

  return (
    <>
      <SEO title="Privacy Policy | AVANI AGRO FOODS" description="Avani Agro Foods Privacy Policy — how we handle your data and inquiries." />
      <div className="page-top" style={{ maxWidth: 800, margin: '0 auto', padding: '100px 24px' }}>
        <h1 style={{ fontWeight: 900, marginBottom: 8 }}>Privacy Policy</h1>
        <p style={{ color: 'var(--color-text-light)', marginBottom: 40 }}>Last updated: August 2026</p>
        {[
          { title: '1. Information We Collect', text: 'We collect your name, email address, phone number, and business information when you submit an export inquiry, contact us, or register for B2B services. We also collect basic analytics data about site visits.' },
          { title: '2. How We Use Your Information', text: 'Your information is used exclusively to respond to your inquiries, provide export quotations and documentation, manage partner accounts, and communicate regarding export orders. We do not sell your data.' },
          { title: '3. Partner Tracking', text: 'Partner tracking systems log referrals and conversions to attribute business relationships accurately. Data is handled confidentially and in accordance with applicable privacy laws.' },
          { title: '4. Cookies & Sessions', text: 'We use secure, minimal HttpOnly session cookies for authorized access areas. We do not use third-party behavioral advertising cookies.' },
          { title: '5. Data Sharing', text: 'We do not share your personal data with third parties except where required for shipping/logistics fulfillment or by legal authorities.' },
          { title: '6. Data Retention', text: 'Inquiry and business data is retained for record-keeping and regulatory compliance. You may request information updates or deletion by emailing us.' },
          { title: '7. Contact Information', text: `For privacy-related queries, contact AVANI AGRO FOODS at ${email} | Phone/WhatsApp: ${phone} | Address: ${address.full}` },
        ].map(({ title, text }) => (
          <div key={title} style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 10 }}>{title}</h2>
            <p style={{ color: 'var(--color-text-light)', lineHeight: 1.8, margin: 0 }}>{text}</p>
          </div>
        ))}
      </div>
    </>
  )
}
