import SEO from '../components/SEO'
import { Link } from 'react-router-dom'
import { BUSINESS_INFO } from '../data/links'
import { Shield, Info, ExternalLink, CheckCircle2, HelpCircle } from 'lucide-react'

export default function AffiliateDisclaimer() {
  return (
    <>
      <SEO 
        title="Affiliate Disclosure & Transparency Statement | AVANI AGRO FOODS" 
        description="Comprehensive affiliate disclosure and editorial independence statement for AVANI AGRO FOODS. Learn how third-party product links and referral commissions operate." 
        keywords="affiliate disclosure, FTC compliance, editorial policy, amazon associates disclosure, avani agro foods disclosure"
      />

      <div className="page-top" style={{ minHeight: '100vh', background: '#fcfdfc', padding: '80px 0' }}>
        <div className="container" style={{ maxWidth: 840 }}>
          
          {/* Header */}
          <div style={{ marginBottom: 40, borderBottom: '1px solid var(--color-border)', paddingBottom: 24 }}>
            <div className="section-tag" style={{ marginBottom: 12 }}>
              <Shield size={13} /> Consumer Transparency
            </div>
            <h1 style={{ fontSize: '2.4rem', fontWeight: 900, color: 'var(--color-text)', marginBottom: 8 }}>
              Affiliate &amp; Editorial Disclosure
            </h1>
            <p style={{ color: 'var(--color-text-light)', fontSize: '0.9rem' }}>
              Last Reviewed &amp; Updated: <strong>August 2026</strong> | Compliant with FTC (16 CFR § 255) &amp; Global Advertising Standards
            </p>
          </div>

          {/* Quick Summary Callout */}
          <div style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: 'var(--radius-md)',
            padding: '24px',
            marginBottom: 40,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 16
          }}>
            <Info size={22} color="#b45309" style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: '0.92rem', color: '#92400e', lineHeight: 1.7 }}>
              <strong>Executive Summary:</strong> Certain links within our educational blog posts, buying guides, and "Resources &amp; Recommended Products" section are affiliate links. If you click through and make a purchase on a third-party website (such as Amazon or iHerb), AVANI AGRO FOODS may earn a referral commission at <strong>zero additional cost to you</strong>.
            </div>
          </div>

          {/* 1. What Are Affiliate Links */}
          <section style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 12, color: 'var(--color-text)' }}>
              1. What Are Affiliate Links?
            </h2>
            <p style={{ color: 'var(--color-text-light)', lineHeight: 1.8, fontSize: '0.95rem', marginBottom: 12 }}>
              An affiliate link is a specific tracking URL provided by third-party retailers or affiliate networks. When a reader clicks on one of these links on our website and completes a purchase on the target retailer's platform, the retailer tracks that the referral originated from our site and pays us a small percentage or fixed referral fee.
            </p>
            <p style={{ color: 'var(--color-text-light)', lineHeight: 1.8, fontSize: '0.95rem' }}>
              <strong>The No Additional Cost Principle:</strong> The price you pay for any recommended item is identical whether you use our affiliate link or navigate directly to the vendor's website. In some instances, our referral relationships may even provide access to exclusive seasonal promotional discounts.
            </p>
          </section>

          {/* 2. Amazon Associates Disclosure */}
          <section style={{ marginBottom: 36, padding: '24px', background: 'white', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 12, color: 'var(--color-text)' }}>
              2. Amazon Associates Program Disclosure
            </h2>
            <p style={{ color: 'var(--color-text-light)', lineHeight: 1.8, fontSize: '0.92rem', margin: 0 }}>
              <strong>AVANI AGRO FOODS</strong> (operated by Sachin Shinde) participates in the Amazon Services LLC Associates Program and Amazon India Associates Program, an affiliate advertising program designed to provide a means for websites to earn advertising fees by advertising and linking to Amazon.com, Amazon.in, and affiliated Amazon global marketplaces.
            </p>
          </section>

          {/* 3. iHerb & Other Third-Party Networks */}
          <section style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 12, color: 'var(--color-text)' }}>
              3. iHerb &amp; Other Partner Networks
            </h2>
            <p style={{ color: 'var(--color-text-light)', lineHeight: 1.8, fontSize: '0.95rem' }}>
              We also participate in third-party referral programs with wellness marketplaces such as iHerb (Rewards Code: PQZ1679), kitchen equipment manufacturers, and B2B export software providers. Any referral compensation received helps support our server infrastructure, technical maintenance, and free educational publishing.
            </p>
          </section>

          {/* 4. Strict Separation of Core B2B Business vs Affiliate Recommendations */}
          <section style={{ marginBottom: 36, padding: '24px', background: 'var(--color-bg-alt)', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--color-primary)' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 12, color: 'var(--color-text)' }}>
              4. Separation of Core B2B Export Coordination &amp; Third-Party Content
            </h2>
            <p style={{ color: 'var(--color-text-light)', lineHeight: 1.8, fontSize: '0.92rem', marginBottom: 12 }}>
              It is critical to distinguish between AVANI's two operating areas:
            </p>
            <ul style={{ paddingLeft: 20, color: 'var(--color-text-light)', lineHeight: 1.8, fontSize: '0.92rem' }}>
              <li><strong>Core B2B Agricultural Sourcing:</strong> Commercial container-load and bulk export coordination of Moringa Powder and Red Onion Powder directly with overseas importers, backed by formal proforma invoices, batch COAs, and port logistics.</li>
              <li><strong>Informational Resources:</strong> Independent educational publishing and third-party product reviews. AVANI is not the manufacturer, distributor, or warrantor of third-party retail products recommended via affiliate links.</li>
            </ul>
          </section>

          {/* 5. Editorial Independence */}
          <section style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 12, color: 'var(--color-text)' }}>
              5. Our Editorial Standards &amp; Independence
            </h2>
            <div style={{ display: 'grid', gap: 12 }}>
              {[
                'We do not accept monetary compensation to write positive reviews for products that fail our quality benchmarks.',
                'We clearly list both pros and cons for every evaluated third-party item, including who the product is suited for and who should avoid it.',
                'Our product selections are based on verified customer feedback, ingredient purity, certifications, and technical utility.',
                'We do not operate an internal multi-tier affiliate referral scheme paying fixed percentages to visitors for referrals.'
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '0.92rem', color: 'var(--color-text)' }}>
                  <CheckCircle2 size={16} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: 3 }} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </section>

          {/* 6. Contact Information */}
          <section style={{ borderTop: '1px solid var(--color-border)', paddingTop: 28, marginTop: 40 }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 12 }}>
              6. Questions or Inquiries Regarding Disclosures
            </h2>
            <p style={{ color: 'var(--color-text-light)', lineHeight: 1.8, fontSize: '0.92rem', marginBottom: 16 }}>
              If you have any questions regarding our affiliate disclosures, partner links, or editorial policies, please contact us directly:
            </p>
            <div style={{ fontSize: '0.9rem', color: 'var(--color-text)', lineHeight: 1.8 }}>
              <strong>AVANI AGRO FOODS</strong><br />
              Owner: Sachin Shinde<br />
              Address: {BUSINESS_INFO.address.full}<br />
              Email: <a href={`mailto:${BUSINESS_INFO.email}`} style={{ color: 'var(--color-primary)', fontWeight: 700 }}>{BUSINESS_INFO.email}</a><br />
              WhatsApp / Phone: {BUSINESS_INFO.phone}
            </div>
          </section>

          <div style={{ marginTop: 40, textAlign: 'center' }}>
            <Link to="/resources" className="btn btn-primary">
              Return to Resources Hub
            </Link>
          </div>

        </div>
      </div>
    </>
  )
}
