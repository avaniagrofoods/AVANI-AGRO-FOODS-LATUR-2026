import SEO from '../components/SEO'
export default function Privacy() {
  return (
    <>
      <SEO title="Privacy Policy" description="Avani Agro Foods Privacy Policy — how we handle your data." />
      <div className="page-top" style={{ maxWidth: 800, margin: '0 auto', padding: '100px 24px' }}>
        <h1 style={{ fontWeight: 900, marginBottom: 8 }}>Privacy Policy</h1>
        <p style={{ color: 'var(--color-text-light)', marginBottom: 40 }}>Last updated: April 2026</p>
        {[
          { title: '1. Information We Collect', text: 'We collect your name, email address, phone number, and business information when you submit an inquiry, join our affiliate program, or contact us. We also collect basic analytics data about site visits.' },
          { title: '2. How We Use Your Information', text: 'Your information is used exclusively to respond to your inquiries, send you quotes and documentation, manage your affiliate account, and send relevant business communications. We do not sell your data.' },
          { title: '3. Affiliate Tracking', text: 'Our affiliate tracking system logs clicks and conversions via Google Sheets. Affiliate IDs are stored locally in your browser (localStorage) and in our tracking sheet. We track referrals to attribute commissions accurately.' },
          { title: '4. Cookies', text: 'We use minimal cookies for session management (password-protected pages). We do not use third-party advertising cookies.' },
          { title: '5. Data Sharing', text: 'We do not share your personal data with third parties except where required by law. EmailJS and Google Sheets are used as processing tools under their respective privacy policies.' },
          { title: '6. Data Retention', text: 'Inquiry data is retained for 3 years for business record-keeping. You may request deletion at any time by emailing us.' },
          { title: '7. Contact', text: 'For privacy-related queries, email: avaniagrofoods1356@gmail.com | Phone: +91 7219053645' },
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
