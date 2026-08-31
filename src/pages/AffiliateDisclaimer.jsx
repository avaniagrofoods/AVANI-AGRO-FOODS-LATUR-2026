import SEO from '../components/SEO'
import { Link } from 'react-router-dom'
import { BUSINESS_INFO } from '../data/links'
import { Shield, Info, CheckCircle2 } from 'lucide-react'

export default function AffiliateDisclaimer() {
  return (
    <>
      <SEO 
        title="Affiliate & Editorial Disclosure | AVANI AGRO FOODS" 
        description="Official transparency statement: AVANI AGRO FOODS future affiliate program disclosure and separation of core B2B export coordination from third-party content." 
        keywords="affiliate disclosure, FTC compliance, editorial policy, avani agro foods disclosure"
      />

      <div className="page-top" style={{ minHeight: '100vh', background: '#fcfdfc', padding: '80px 0' }}>
        <div className="container" style={{ maxWidth: 840 }}>
          
          {/* Header */}
          <div style={{ marginBottom: 40, borderBottom: '1px solid var(--color-border)', paddingBottom: 24 }}>
            <div className="section-tag" style={{ marginBottom: 12 }}>
              <Shield size={13} /> Consumer &amp; Partner Transparency
            </div>
            <h1 style={{ fontSize: '2.4rem', fontWeight: 900, color: 'var(--color-text)', marginBottom: 8 }}>
              Affiliate &amp; Editorial Disclosure
            </h1>
            <p style={{ color: 'var(--color-text-light)', fontSize: '0.9rem' }}>
              Last Reviewed: <strong>August 2026</strong> | AVANI AGRO FOODS, Latur, Maharashtra, India
            </p>
          </div>

          {/* Primary Future Affiliate Statement */}
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
            <div style={{ fontSize: '0.95rem', color: '#92400e', lineHeight: 1.7 }}>
              <strong>Official Status &amp; Policy:</strong> AVANI AGRO FOODS may participate in third-party affiliate programs in the future. Where applicable, qualifying links on our educational resources pages may generate a referral commission at <strong>no additional cost to the user</strong>. Currently, all third-party product links remain informational references and are disabled until official affiliate program registration and approval.
            </div>
          </div>

          {/* Section 1: Third-Party Independence */}
          <section style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 12, color: 'var(--color-text)' }}>
              1. Third-Party Products &amp; Brand Responsibilities
            </h2>
            <p style={{ color: 'var(--color-text-light)', lineHeight: 1.8, fontSize: '0.95rem', marginBottom: 12 }}>
              AVANI AGRO FOODS is not currently representing every referenced product on this website as its own manufactured product. Third-party products, laboratory testing instruments, kitchen equipment, and retail superfood brands remain the sole intellectual property and commercial responsibility of their respective manufacturers, brands, and sellers.
            </p>
            <p style={{ color: 'var(--color-text-light)', lineHeight: 1.8, fontSize: '0.95rem' }}>
              Any purchase made through third-party platforms is governed strictly by the terms, warranties, and return policies of that third-party retailer.
            </p>
          </section>

          {/* Section 2: Core B2B Business Separation */}
          <section style={{ marginBottom: 36, padding: '24px', background: 'var(--color-bg-alt)', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--color-primary)' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 12, color: 'var(--color-text)' }}>
              2. Strict Separation of Core B2B Business &amp; Educational Resources
            </h2>
            <ul style={{ paddingLeft: 20, color: 'var(--color-text-light)', lineHeight: 1.8, fontSize: '0.92rem', margin: 0 }}>
              <li style={{ marginBottom: 8 }}>
                <strong>Core B2B Agricultural Sourcing:</strong> Commercial container-scale export coordination of Moringa Powder and Red Onion Powder directly with international importers, backed by formal proforma invoices, batch COAs from vetted partner processors, and port logistics.
              </li>
              <li>
                <strong>Educational Resources &amp; Reviews:</strong> Informational guides discussing equipment and retail products. We do not claim active affiliate participation until programs are formally approved.
              </li>
            </ul>
          </section>

          {/* Section 3: Editorial Standards */}
          <section style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 12, color: 'var(--color-text)' }}>
              3. Editorial Standards &amp; Principles
            </h2>
            <div style={{ display: 'grid', gap: 12 }}>
              {[
                'We do not accept monetary compensation to publish false or misleading product reviews.',
                'Product reviews clearly outline balanced strengths and limitations.',
                'We do not operate an internal multi-tier recruitment scheme.',
                'We do not make unsupported medical or therapeutic cure claims for any agricultural ingredient.'
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '0.92rem', color: 'var(--color-text)' }}>
                  <CheckCircle2 size={16} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: 3 }} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Section 4: Contact */}
          <section style={{ borderTop: '1px solid var(--color-border)', paddingTop: 28, marginTop: 40 }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 12 }}>
              4. Contact Information
            </h2>
            <p style={{ color: 'var(--color-text-light)', lineHeight: 1.8, fontSize: '0.92rem', marginBottom: 16 }}>
              For questions regarding our editorial disclosures or commercial sourcing services, please contact:
            </p>
            <div style={{ fontSize: '0.9rem', color: 'var(--color-text)', lineHeight: 1.8 }}>
              <strong>AVANI AGRO FOODS</strong><br />
              Trade Coordinator: Sachin Shinde<br />
              Address: {BUSINESS_INFO.address.full}<br />
              Email: <a href={`mailto:${BUSINESS_INFO.email}`} style={{ color: 'var(--color-primary)', fontWeight: 700 }}>{BUSINESS_INFO.email}</a><br />
              WhatsApp / Phone: {BUSINESS_INFO.phone}
            </div>
          </section>

          <div style={{ marginTop: 40, textAlign: 'center' }}>
            <Link to="/resources" className="btn btn-primary">
              Return to Resources
            </Link>
          </div>

        </div>
      </div>
    </>
  )
}
