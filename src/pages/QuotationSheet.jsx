import SEO from '../components/SEO'
import PasswordGate from '../components/PasswordGate'
import { FileDown, ShieldCheck, Mail, Phone, ExternalLink } from 'lucide-react'

export default function QuotationSheet() {
  const content = (
    <div className="animate-in">
      <div className="section-header" style={{ textAlign: 'center', marginBottom: 48 }}>
        <div className="section-tag" style={{ justifyContent: 'center' }}><ShieldCheck size={14} /> Confidential Document</div>
        <h2 className="section-title">Global Standard Quotation Sheet</h2>
        <p className="section-desc">Version: 2026.04 — Valid for all International B2B Inquiries.</p>
      </div>

      <div className="card shadow-lg" style={{ padding: '40px', background: 'white', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 48, marginBottom: 48 }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: 16 }}>Pricing Overview</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '12px 0', color: 'var(--color-text-light)' }}>Moringa Powder (FOB)</td>
                  <td style={{ padding: '12px 0', fontWeight: 700, textAlign: 'right' }}>$3.50 - $4.80 / kg</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '12px 0', color: 'var(--color-text-light)' }}>Red Onion Powder (FOB)</td>
                  <td style={{ padding: '12px 0', fontWeight: 700, textAlign: 'right' }}>$2.00 - $2.80 / kg</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px 0', color: 'var(--color-text-light)' }}>Private Label Fee</td>
                  <td style={{ padding: '12px 0', fontWeight: 700, textAlign: 'right' }}>Contact for Quote</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: 16 }}>Export Logistics</h3>
            <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.85rem', color: 'var(--color-text-light)' }}>
              <li style={{ marginBottom: 10 }}>📦 <strong>Port of Loading:</strong> Nhava Sheva (Mumbai) / Chennai</li>
              <li style={{ marginBottom: 10 }}>🚢 <strong>Terms:</strong> FOB, CIF, CNF, Door-to-Door (Selected)</li>
              <li style={{ marginBottom: 10 }}>⌛ <strong>Lead Time:</strong> 14-21 Days after LC/Advance</li>
              <li style={{ marginBottom: 10 }}>📂 <strong>Documents:</strong> CoA, MSDS, Phytosanitary, COO</li>
            </ul>
          </div>
        </div>

        <div style={{ background: '#f8faf8', border: '1px dashed var(--color-border)', borderRadius: 12, padding: '32px', textAlign: 'center' }}>
          <h4 style={{ fontWeight: 800, marginBottom: 16 }}>Download Official PDF Quotation</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', marginBottom: 24 }}>This document includes detailed chemical analysis and volume-based discount tiers.</p>
          <button onClick={() => alert('Downloading official quotation sheet...')} className="btn btn-primary" style={{ gap: 8 }}>
            <FileDown size={18} /> Download Quotation-2026.pdf
          </button>
        </div>
      </div>

      <div style={{ marginTop: 48, display: 'flex', gap: 24, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
        <a href="mailto:sales@avaniagrofoods.com" className="btn" style={{ gap: 8, fontSize: '0.85rem' }}>
          <Mail size={16} /> Contact Sales
        </a>
        <a href="tel:+917219053645" className="btn" style={{ gap: 8, fontSize: '0.85rem' }}>
          <Phone size={16} /> Call Expert
        </a>
      </div>
    </div>
  )

  return (
    <>
      <SEO 
        title="B2B Quotation Sheet — Confidential Access"
        description="Access the official global standard quotation sheet for Avani Agro Foods products. Secure area for verified B2B partners."
      />
      <div className="page-top" style={{ minHeight: '100vh', background: '#f5f7f5', padding: '120px 0' }}>
        <div className="container" style={{ maxWidth: 900 }}>
          <PasswordGate password="Samarth@1356">
            {content}
          </PasswordGate>
        </div>
      </div>
    </>
  )
}
