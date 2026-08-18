import SEO from '../components/SEO'
import { BUSINESS_INFO } from '../data/links'

export default function Terms() {
  const { email, phone, address } = BUSINESS_INFO

  return (
    <>
      <SEO title="Terms & Conditions | AVANI AGRO FOODS" description="Terms and Conditions for doing business with Avani Agro Foods." />
      <div className="page-top" style={{ maxWidth: 800, margin: '0 auto', padding: '100px 24px' }}>
        <h1 style={{ fontWeight: 900, marginBottom: 8 }}>Terms &amp; Conditions</h1>
        <p style={{ color: 'var(--color-text-light)', marginBottom: 40 }}>Last updated: August 2026</p>
        {[
          { title: '1. General Business Scope', text: `AVANI AGRO FOODS operates as a B2B agricultural export business based in Latur, Maharashtra, India (${address.full}). We specialize in Moringa Powder and Red Onion Powder. AVANI AGRO FOODS holds Udyam registration; manufacturing and processing certifications (FSSAI, APEDA, IEC, ISO) are held by our vetted manufacturing partners.` },
          { title: '2. Quotations and Pricing', text: 'All export pricing provided via email, web inquiries, or proforma quotations is subject to final contract confirmation. Market fluctuations in agricultural commodities may result in price adjustments before an official Proforma Invoice is finalized.' },
          { title: '3. Orders and Commercial Terms', text: 'Commercial export orders are executed under agreed international trade terms (e.g. FOB Nhava Sheva, CIF destination port, Letter of Credit, Telegraphic Transfer) as specified in formal sales contracts.' },
          { title: '4. Partner Program Terms', text: 'Authorized partners must adhere to transparent, compliant business practices. Misrepresentation, unsolicited marketing, or unauthorized claims are strictly prohibited.' },
          { title: '5. Intellectual Property', text: 'All content on this website, including product technical information, branding, and text, is the property of AVANI AGRO FOODS. Unauthorized reproduction or scraping is prohibited.' },
          { title: '6. Quality & Regulatory Compliance', text: 'Products supplied are accompanied by batch Certificates of Analysis (COA) from partner manufacturers. Import regulatory compliance for the destination market should be verified in coordination with the buyer\'s customs broker.' },
          { title: '7. Governing Law', text: 'These terms and any business contracts shall be governed by the laws of India, with jurisdiction in the competent courts of Latur, Maharashtra.' },
          { title: '8. Contact Information', text: `For any questions regarding these terms, please contact us at ${email} or via WhatsApp at ${phone}. Address: ${address.full}.` },
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
