import SEO from '../components/SEO'

export default function AffiliateDisclaimer() {
  return (
    <>
      <SEO 
        title="Affiliate Disclosure — Avani Agro Foods" 
        description="Transparency is important. Learn how Avani Agro Foods uses affiliate links to support our mission." 
      />
      <div className="page-top" style={{ maxWidth: 800, margin: '0 auto', padding: '100px 24px' }}>
        <h1 style={{ fontWeight: 900, marginBottom: 8 }}>Affiliate Disclosure</h1>
        <p style={{ color: 'var(--color-text-light)', marginBottom: 40 }}>Last updated: April 2026</p>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 16 }}>Transparency First</h2>
          <p style={{ color: 'var(--color-text-light)', lineHeight: 1.8, marginBottom: 16 }}>
            In compliance with the FTC guidelines, please assume that any and all links on this website are affiliate links of which Avani Agro Foods receives a small commission from sales of certain items, but the price is the same for you.
          </p>
          <p style={{ color: 'var(--color-text-light)', lineHeight: 1.8, marginBottom: 16 }}>
            <strong>Our Goal:</strong> Avani Agro Foods was founded to bridge the gap between Indian farmers and global buyers. Building and maintaining this platform (including our free B2B directories and market analysis) costs money. Affiliate commissions help us keep these resources free for the community.
          </p>
        </section>

        <section style={{ marginBottom: 40, padding: '32px', background: 'rgba(26,77,46,0.05)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 16 }}>What is an Affiliate Link?</h2>
          <p style={{ color: 'var(--color-text-light)', lineHeight: 1.8, fontSize: '0.95rem' }}>
            When you click on a link that leads to a product on Amazon (India or Global), iHerb, or other partner sites, we may earn a referral fee. This does <strong>not</strong> increase the price you pay. In many cases, our affiliate links actually provide you with special discounts or deals.
          </p>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 16 }}>Amazon Associates Disclosure</h2>
          <p style={{ color: 'var(--color-text-light)', lineHeight: 1.8 }}>
            Avani Agro Foods is a participant in the Amazon Services LLC Associates Program and the Amazon.in Associates Program, an affiliate advertising program designed to provide a means for sites to earn advertising fees by advertising and linking to Amazon.com and Amazon.in.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 16 }}>Our Commitment to You</h2>
          <p style={{ color: 'var(--color-text-light)', lineHeight: 1.8 }}>
            We only recommend products that we genuinely believe in or have seen used effectively in the agriculture and wellness space. Our recommendations are based on quality, certifications (FSSAI, Organic), and market demand — not just commission rates.
          </p>
          <p style={{ color: 'var(--color-text-light)', lineHeight: 1.8, marginTop: 16 }}>
            If you have any questions, please contact us at <a href="mailto:sales@avaniagrofoods.com" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>sales@avaniagrofoods.com</a>.
          </p>
        </section>
      </div>
    </>
  )
}
