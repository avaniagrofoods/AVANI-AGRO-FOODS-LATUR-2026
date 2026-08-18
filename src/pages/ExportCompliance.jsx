import { useState, useMemo } from 'react'
import SEO from '../components/SEO'
import { Link } from 'react-router-dom'
import { Search, Globe, AlertCircle, CheckCircle, FileText, ChevronDown, ChevronUp, ExternalLink, ShieldCheck, HelpCircle } from 'lucide-react'
import { COMPLIANCE_DATA, REGIONS, REGULATORY_DISCLAIMER, AVANI_INTERNAL_STANDARDS } from '../data/exportCompliance'

const BADGE_COLORS = {
  'Mandatory': { bg: '#fef2f2', text: '#dc2626', border: '#fca5a5' },
  'Recommended': { bg: '#eff6ff', text: '#2563eb', border: '#93c5fd' },
  'Conditional': { bg: '#fffbeb', text: '#d97706', border: '#fcd34d' },
}

function RequirementPill({ label, type = 'Mandatory' }) {
  const colors = BADGE_COLORS[type] || BADGE_COLORS['Mandatory']
  return (
    <span style={{
      display: 'inline-block', fontSize: '0.72rem', fontWeight: 700,
      padding: '3px 10px', borderRadius: 20, marginRight: 6, marginBottom: 4,
      background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`,
    }}>
      {label}
    </span>
  )
}

function CountryCard({ country }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
      {/* Header */}
      <div
        style={{
          padding: '24px 28px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 16, background: expanded ? '#f8faf8' : 'white',
          transition: 'background 0.2s ease',
        }}
        onClick={() => setExpanded(e => !e)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(!expanded) } }}
        aria-expanded={expanded}
        aria-controls={`country-${country.code}`}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
          <span style={{ fontSize: '2.4rem', lineHeight: 1 }}>{country.flag}</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h3 style={{ fontWeight: 900, margin: 0, fontSize: '1.2rem' }}>{country.country}</h3>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-light)', fontWeight: 600 }}>({country.region})</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-primary)', marginTop: 4, fontWeight: 600 }}>
              Authority: {country.authority}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            fontSize: '0.68rem', fontWeight: 800, padding: '4px 12px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.08em',
            background: country.popularity === 'High' ? '#d1fae5' : country.popularity === 'Medium' ? '#fef3c7' : '#f3f4f6',
            color: country.popularity === 'High' ? '#065f46' : country.popularity === 'Medium' ? '#92400e' : '#374151',
          }}>
            {country.popularity} Demand
          </span>
          {expanded ? <ChevronUp size={20} color="var(--color-primary)" /> : <ChevronDown size={20} color="var(--color-text-light)" />}
        </div>
      </div>

      {/* Expanded Detailed Breakdown */}
      {expanded && (
        <div id={`country-${country.code}`} style={{ borderTop: '1px solid var(--color-border)', padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: 24, background: 'white' }}>

          {/* Products Applicable */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', paddingBottom: 16, borderBottom: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-light)' }}>
              Products Covered:
            </span>
            {country.products.map(p => (
              <span key={p} style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '3px 10px', borderRadius: 16, fontSize: '0.78rem', fontWeight: 700 }}>
                {p}
              </span>
            ))}
          </div>

          {/* Mandatory Destination Regulatory Requirements */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <CheckCircle size={18} color="#dc2626" />
              <h4 style={{ fontWeight: 900, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#dc2626', margin: 0 }}>
                Destination Market Regulatory Requirements (Mandatory)
              </h4>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--color-text-light)', marginBottom: 12 }}>
              These documentation standards are generally mandated by the destination government's food safety and customs authorities for clearance.
            </p>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {country.mandatoryDocuments.map(doc => (
                <li key={doc} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <span style={{ color: '#16a34a', fontWeight: 900, fontSize: '0.9rem' }}>✓</span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-text)' }}>{doc}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Conditional / Market Specific Requirements */}
          {country.conditionalDocuments.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <AlertCircle size={18} color="#d97706" />
                <h4 style={{ fontWeight: 900, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#d97706', margin: 0 }}>
                  Conditional / Product-Specific Requirements
                </h4>
              </div>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {country.conditionalDocuments.map(doc => (
                  <li key={doc} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{ color: '#d97706', fontWeight: 900, fontSize: '0.9rem' }}>•</span>
                    <span style={{ fontSize: '0.88rem', color: 'var(--color-text)' }}>{doc}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommended Certifications */}
          {country.recommendedCertifications.length > 0 && (
            <div>
              <h4 style={{ fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#2563eb', marginBottom: 10 }}>
                Recommended Buyer &amp; Market Certifications
              </h4>
              <div>
                {country.recommendedCertifications.map(cert => (
                  <RequirementPill key={cert} label={cert} type="Recommended" />
                ))}
              </div>
            </div>
          )}

          {/* Testing & Chemical Standards */}
          <div style={{ background: '#f8fafc', borderRadius: 12, padding: '20px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ fontWeight: 900, fontSize: '0.85rem', marginBottom: 6, color: '#1e293b' }}>
              🔬 Laboratory &amp; Testing Specifications
            </h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text)', lineHeight: 1.7 }}>
              {country.testingRequirements}
            </p>
          </div>

          {/* Labelling Standards */}
          <div style={{ background: '#f8fafc', borderRadius: 12, padding: '20px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ fontWeight: 900, fontSize: '0.85rem', marginBottom: 6, color: '#1e293b' }}>
              🏷️ Labelling &amp; Packaging Rules
            </h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text)', lineHeight: 1.7 }}>
              {country.labellingRequirements}
            </p>
          </div>

          {/* Responsibilities Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '18px' }}>
              <h5 style={{ fontWeight: 900, fontSize: '0.82rem', color: '#166534', marginBottom: 6, textTransform: 'uppercase' }}>
                Exporter Responsibility (India)
              </h5>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#14532d', lineHeight: 1.6 }}>
                {country.exporterResponsibilities}
              </p>
            </div>
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '18px' }}>
              <h5 style={{ fontWeight: 900, fontSize: '0.82rem', color: '#1e40af', marginBottom: 6, textTransform: 'uppercase' }}>
                Importer Responsibility (Destination)
              </h5>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#1e3a8a', lineHeight: 1.6 }}>
                {country.importerResponsibilities}
              </p>
            </div>
          </div>

          {/* Special Notes */}
          {country.specialRequirements && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '18px' }}>
              <h5 style={{ fontWeight: 900, fontSize: '0.82rem', color: '#92400e', marginBottom: 6, textTransform: 'uppercase' }}>
                💡 Market-Specific Trade Advisory
              </h5>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#78350f', lineHeight: 1.6 }}>
                {country.specialRequirements}
              </p>
            </div>
          )}

          {/* Official Sources */}
          {country.officialSources && country.officialSources.length > 0 && (
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
              <h5 style={{ fontWeight: 800, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-light)', marginBottom: 8 }}>
                Authoritative Government &amp; Regulatory Sources:
              </h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {country.officialSources.map(s => (
                  <a
                    key={s.name}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '0.8rem', color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none', fontWeight: 600 }}
                  >
                    <span>{s.name}</span>
                    <ExternalLink size={12} />
                    <span style={{ color: 'var(--color-text-light)', fontWeight: 400 }}>— {s.description}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-light)', borderTop: '1px solid var(--color-border)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <span>Last reviewed: {country.lastReviewed}</span>
            <span>Always verify requirements with the destination country's competent authority before commercial dispatch.</span>
          </div>

        </div>
      )}
    </div>
  )
}

export default function ExportCompliance() {
  const [search, setSearch] = useState('')
  const [activeRegion, setActiveRegion] = useState('All')

  const filtered = useMemo(() => {
    return COMPLIANCE_DATA.filter(c => {
      const matchSearch = !search || [c.country, c.region, c.authority, c.code, ...(c.products || [])].join(' ').toLowerCase().includes(search.toLowerCase())
      const matchRegion = activeRegion === 'All' || c.region === activeRegion
      return matchSearch && matchRegion
    })
  }, [search, activeRegion])

  return (
    <>
      <SEO
        title="Global Export Documentation & Compliance Guide (35 Markets) | AVANI AGRO FOODS"
        description="Comprehensive country-by-country export documentation and regulatory compliance guide for Moringa Powder and Red Onion Powder across 35 international markets (USA, EU, UK, UAE, Japan, Canada, Australia & more)."
        keywords="export compliance guide india, moringa export documentation, red onion powder export regulations, FDA moringa requirements, EU novel food moringa, UAE food import standards, food export customs documentation"
      />

      <div className="page-top">
        {/* Hero */}
        <div style={{ background: 'linear-gradient(135deg, #0a1f0d 0%, #1a4d2e 100%)', padding: '96px 0', color: 'white' }}>
          <div className="container" style={{ textAlign: 'center' }}>
            <div className="section-tag" style={{ justifyContent: 'center', background: 'rgba(255,255,255,0.1)', color: 'white', display: 'inline-flex', marginBottom: 20 }}>
              <Globe size={14} /> International Trade Compliance
            </div>
            <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.2rem)', fontWeight: 900, lineHeight: 1.15, marginBottom: 20 }}>
              Global Export Documentation &amp;<br />Regulatory Compliance Matrix
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.05rem', maxWidth: 720, margin: '0 auto 32px', lineHeight: 1.7 }}>
              A country-by-country regulatory reference for Indian agri-exporters, international B2B importers, and manufacturing partners. Covering 35 key global destinations.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <span style={{ background: 'rgba(255,255,255,0.12)', padding: '8px 20px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 600 }}>🌍 35 Global Markets</span>
              <span style={{ background: 'rgba(255,255,255,0.12)', padding: '8px 20px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 600 }}>🌿 Moringa Powder (HS 0712.90.90)</span>
              <span style={{ background: 'rgba(255,255,255,0.12)', padding: '8px 20px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 600 }}>🧅 Red Onion Powder (HS 0712.20.00)</span>
              <span style={{ background: 'rgba(255,255,255,0.12)', padding: '8px 20px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 600 }}>🏛️ Official Regulatory Sources</span>
            </div>
          </div>
        </div>

        {/* Regulatory Disclaimer Banner */}
        <div style={{ background: '#fff8e1', borderBottom: '2px solid #e6a817', padding: '20px 0' }}>
          <div className="container" style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <AlertCircle size={22} color="#b45309" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong style={{ color: '#92400e', fontSize: '0.88rem' }}>Regulatory Advisory Notice:</strong>
              <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#78350f', lineHeight: 1.6 }}>
                {REGULATORY_DISCLAIMER}
              </p>
            </div>
          </div>
        </div>

        {/* Search & Sticky Filter Bar */}
        <div style={{ background: 'white', borderBottom: '1px solid var(--color-border)', padding: '20px 0', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div className="container" style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
              <Search size={18} color="var(--color-text-light)" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search market (e.g. USA, Germany, Japan, UAE, Brazil)..."
                aria-label="Search countries"
                className="input"
                style={{ paddingLeft: 46, height: 48, width: '100%' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['All', ...REGIONS].map(r => (
                <button
                  key={r}
                  onClick={() => setActiveRegion(r)}
                  style={{
                    padding: '8px 16px', borderRadius: 20,
                    border: `1.5px solid ${activeRegion === r ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    background: activeRegion === r ? 'var(--color-primary)' : 'transparent',
                    color: activeRegion === r ? 'white' : 'var(--color-text)',
                    fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', fontWeight: 600, whiteSpace: 'nowrap' }}>
              Showing {filtered.length} of {COMPLIANCE_DATA.length} markets
            </div>
          </div>
        </div>

        <div className="container" style={{ padding: '56px 24px' }}>

          {/* AVANI Internal Standards vs External Standards Callout */}
          <div className="card" style={{ padding: '32px', marginBottom: 48, background: '#f8fafc', border: '1px solid #cbd5e1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <ShieldCheck size={24} color="var(--color-primary)" />
              <h2 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0 }}>
                AVANI AGRO FOODS Internal Quality Baselines
              </h2>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--color-text)', lineHeight: 1.7, marginBottom: 20 }}>
              Before export dispatch, all batches supplied by our manufacturing partners must meet AVANI AGRO FOODS internal quality benchmarks in addition to the destination market's statutory standards:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
              <div style={{ background: 'white', padding: '20px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: 8 }}>🌿 Moringa Powder Baseline</h3>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.82rem', color: 'var(--color-text-light)', lineHeight: 1.8 }}>
                  <li>Moisture: ≤ 7.0% (Export Grade)</li>
                  <li>Mesh Size: 80–100 Mesh fine green powder</li>
                  <li>Foreign Matter: Nil · Zero additives or colorants</li>
                  <li>Mandatory: Batch COA, Microbiology &amp; Heavy Metals panel</li>
                </ul>
              </div>
              <div style={{ background: 'white', padding: '20px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#991b1b', marginBottom: 8 }}>🧅 Red Onion Powder Baseline</h3>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.82rem', color: 'var(--color-text-light)', lineHeight: 1.8 }}>
                  <li>Moisture: ≤ 6.0% (Dehydrated Export Grade)</li>
                  <li>Mesh Size: 80–100 Mesh consistent pungency</li>
                  <li>Foreign Matter: Nil · 24 Months shelf life</li>
                  <li>Mandatory: Batch COA, Pyruvate report, Micro &amp; Heavy Metals</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Results Grid / List */}
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 24px', color: 'var(--color-text-light)' }}>
              <Globe size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>No destination markets match your search</h3>
              <p>Try searching by country name, region, or product keyword.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
              {(activeRegion === 'All' ? REGIONS : [activeRegion]).map(region => {
                const regionCountries = filtered.filter(c => c.region === region)
                if (regionCountries.length === 0) return null
                return (
                  <div key={region}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                      <h2 style={{ fontWeight: 900, fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-primary)', margin: 0 }}>
                        {region}
                      </h2>
                      <span style={{ fontSize: '0.78rem', color: 'var(--color-text-light)', fontWeight: 600 }}>({regionCountries.length} markets)</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {regionCountries.map(c => <CountryCard key={c.code} country={c} />)}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Navigation CTA Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 24, marginTop: 72 }}>
            <div className="card" style={{ padding: '36px', background: 'linear-gradient(135deg, #0a1f0d, #1a4d2e)', color: 'white', textAlign: 'center' }}>
              <FileText size={36} color="#e6a817" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ color: 'white', fontWeight: 900, marginBottom: 12 }}>Manufacturer Onboarding</h3>
              <p style={{ color: 'rgba(255,255,255,0.75)', marginBottom: 24, fontSize: '0.88rem', lineHeight: 1.6 }}>
                Indian food processors looking to supply Moringa or Onion Powder can view the full 35+ item documentation onboarding checklist.
              </p>
              <Link to="/manufacturer-requirements" className="btn" style={{ background: '#e6a817', color: 'black', fontWeight: 800 }}>
                Manufacturer Requirements →
              </Link>
            </div>
            <div className="card" style={{ padding: '36px', textAlign: 'center' }}>
              <Globe size={36} color="var(--color-primary)" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontWeight: 900, marginBottom: 12 }}>Request Export Quotation</h3>
              <p style={{ color: 'var(--color-text-light)', marginBottom: 24, fontSize: '0.88rem', lineHeight: 1.6 }}>
                Inquire about FOB Nhava Sheva / CIF destination seaport pricing, sample dispatch, and export documentation support.
              </p>
              <Link to="/contact" className="btn btn-primary">
                Send Export Inquiry →
              </Link>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
