import SEO from '../components/SEO'
export default function Disclaimer() {
  return (
    <>
      <SEO title="Disclaimer & Affiliate Disclosure" description="Avani Agro Foods disclaimer, affiliate disclosure, and medical disclaimer." />
      <div className="page-top" style={{ maxWidth: 800, margin: '0 auto', padding: '100px 24px' }}>
        <h1 style={{ fontWeight: 900, marginBottom: 8 }}>Disclaimer</h1>
        <p style={{ color: 'var(--color-text-light)', marginBottom: 40 }}>Last updated: April 2026 | Avani Agro Foods, Latur, Maharashtra, India</p>
        {[
          { title: '⚕️ Medical Disclaimer', text: 'The health information provided on this website regarding Moringa Powder and its nutritional benefits is strictly for educational and informational purposes only. It is not intended as medical advice, nor as a substitute for professional medical care. Always consult a qualified healthcare provider before making any health decisions. Avani Agro Foods makes no medical claims about our products.' },
          { title: '📋 Affiliate Disclosure', text: 'Avani Agro Foods participates in affiliate programs including Amazon Associates (India & Global) and iHerb. When you click our affiliate links and make a purchase, we may earn a commission at no additional cost to you. This income helps us maintain our website and create free content. All affiliate opinions are our own and are not influenced by commission potential.' },
          { title: '📊 Business Projections', text: 'Revenue projections (e.g., "₹1 Crore in 12 months") mentioned on this site are goals and targets — not guaranteed outcomes. Actual results will vary based on market conditions, effort, and external factors.' },
          { title: '🗂️ Directory Accuracy', text: 'Manufacturers and importers listed in our password-protected directories are compiled from public sources. Avani Agro Foods does not guarantee the accuracy of contact information and recommends verifying all details before conducting business.' },
          { title: '📦 Product Information', text: 'All product specifications are based on our current production standards. Batch-specific certifications and CoA (Certificate of Analysis) are available upon request and may vary slightly by harvest season.' },
          { title: '📬 Contact', text: 'Questions about this disclaimer: sales@avaniagrofoods.com' },
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
