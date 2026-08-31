import SEO from '../components/SEO'
import { BUSINESS_INFO } from '../data/links'

export default function Disclaimer() {
  return (
    <>
      <SEO 
        title="Disclaimer — Medical, Commercial & Affiliate | AVANI AGRO FOODS" 
        description="Official disclaimer covering nutritional educational content, B2B commercial specifications, and third-party affiliate links on the AVANI AGRO FOODS website." 
      />
      <div className="page-top" style={{ maxWidth: 800, margin: '0 auto', padding: '100px 24px' }}>
        <h1 style={{ fontWeight: 900, marginBottom: 8 }}>Website &amp; Regulatory Disclaimer</h1>
        <p style={{ color: 'var(--color-text-light)', marginBottom: 40 }}>Last updated: August 2026 | AVANI AGRO FOODS, Latur, Maharashtra, India</p>
        {[
          { 
            title: '⚕️ Health & Nutritional Disclaimer', 
            text: 'The educational information provided on this website regarding Moringa Powder, Red Onion Powder, and their nutritional attributes is intended strictly for general educational and informational purposes. It is not intended as medical advice, diagnostic instruction, or a substitute for professional medical care. Statements have not been evaluated by the FDA or international regulatory authorities. AVANI AGRO FOODS makes no medical diagnosis, treatment, or cure claims.' 
          },
          { 
            title: '📋 Third-Party Affiliate & Resources Disclosure', 
            text: 'AVANI AGRO FOODS participates in select third-party affiliate marketing programs, including Amazon Associates and iHerb. When visitors click our educational resource links and complete qualifying purchases, AVANI may receive a referral commission at zero additional cost to the buyer. We do not manufacture or warrant these third-party retail products.' 
          },
          { 
            title: '💼 B2B Commercial Sourcing & Specifications', 
            text: 'Commercial specifications, mesh sizes, and moisture benchmarks listed on our website represent baseline standards. Formal commercial commitments, FOB/CIF pricing, and batch-specific Certificates of Analysis (COA) are established via official proforma invoices and sales contracts with qualified partner processors.' 
          },
          { 
            title: '🗂️ Trade Directory Information', 
            text: 'Third-party commercial contact listings and trade directory references are compiled from verified commercial channels. AVANI AGRO FOODS encourages all commercial parties to conduct independent due diligence before executing business agreements.' 
          },
          { 
            title: '📬 Contact', 
            text: `For questions regarding this disclaimer, contact AVANI AGRO FOODS at ${BUSINESS_INFO.email} or via WhatsApp at ${BUSINESS_INFO.phone}. Address: ${BUSINESS_INFO.address.full}.` 
          },
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
