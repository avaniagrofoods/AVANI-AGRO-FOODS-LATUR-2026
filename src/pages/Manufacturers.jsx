import { useState } from 'react'
import SEO from '../components/SEO'
import PasswordGate from '../components/PasswordGate'
import { MANUFACTURERS } from '../data/manufacturersData'
import { Search, Filter, Download, MapPin, Globe, Mail, Phone } from 'lucide-react'

const ALL = [...MANUFACTURERS.small, ...MANUFACTURERS.medium, ...MANUFACTURERS.large]

const SCALES = { all: [...ALL], small: MANUFACTURERS.small, medium: MANUFACTURERS.medium, large: MANUFACTURERS.large }

export default function Manufacturers() {
  const [search, setSearch] = useState('')
  const [scale, setScale] = useState('all')
  const [affFilter, setAffFilter] = useState('all')

  const filtered = SCALES[scale].filter(m => {
    const q = search.toLowerCase()
    const matchSearch = !q || m.name.toLowerCase().includes(q) || m.location.toLowerCase().includes(q) || m.products.toLowerCase().includes(q) || m.exportCountries.toLowerCase().includes(q)
    const matchAff = affFilter === 'all' || (affFilter === 'yes' && m.affiliateAvailable === 'Yes') || (affFilter === 'inquiry' && m.affiliateAvailable === 'Inquiry Needed')
    return matchSearch && matchAff
  })

  const handleExport = () => {
    const csv = ['#,Name,Location,Products,Export Countries,Website,Affiliate Available,Email,Contact']
    filtered.forEach(m => {
      csv.push(`${m.id},"${m.name}","${m.location}","${m.products}","${m.exportCountries}","${m.website}","${m.affiliateAvailable}","${m.email}","${m.contact}"`)
    })
    const blob = new Blob([csv.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'manufacturers-avani-agro.csv'; a.click()
  }

  return (
    <PasswordGate title="Indian Manufacturers Database" subtitle="This database contains 60 verified Indian Moringa & Onion Powder manufacturers." storageKey="mfr_access">
      <SEO title="Indian Manufacturers Database" description="Password-protected database of 60 Indian Moringa and Onion Powder manufacturers — Small, Medium and Large scale." />

      <div className="page-top">
        <div style={{ background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))', padding: '72px 0', textAlign: 'center' }}>
          <div className="container">
            <div className="section-tag" style={{ justifyContent: 'center', background: 'rgba(255,255,255,0.15)', color: 'white', display: 'inline-flex', marginBottom: 16 }}>
              🏭 Manufacturers Directory
            </div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white', marginBottom: 12 }}>Indian Manufacturers Database</h1>
            <p style={{ color: 'rgba(255,255,255,0.75)', maxWidth: 600, margin: '0 auto' }}>
              {ALL.length} verified manufacturers across India — 20 Small · 20 Medium · 20 Large scale. Maharashtra-first priority.
            </p>
          </div>
        </div>

        <div className="container" style={{ padding: '48px 24px' }}>
          {/* Controls */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 32, alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ position: 'relative', flex: '1 1 280px' }}>
              <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-light)' }} />
              <input id="mfr-search" className="input" placeholder="Search by name, location, product..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 42 }} />
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {[['all', 'All (60)'], ['small', 'Small (20)'], ['medium', 'Medium (20)'], ['large', 'Large (20)']].map(([k, l]) => (
                <button key={k} onClick={() => setScale(k)} className="btn" style={{ background: scale === k ? 'var(--color-primary)' : 'white', color: scale === k ? 'white' : 'var(--color-text)', border: '1px solid var(--color-border)', fontSize: '0.85rem' }}>{l}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <select className="input" value={affFilter} onChange={e => setAffFilter(e.target.value)} style={{ minWidth: 180 }}>
                <option value="all">All Affiliate Status</option>
                <option value="yes">Affiliate: Yes</option>
                <option value="inquiry">Inquiry Needed</option>
              </select>
              <button onClick={handleExport} className="btn" style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--color-accent)', color: 'white' }}>
                <Download size={15} /> Export CSV
              </button>
            </div>
          </div>

          {/* Count */}
          <div style={{ marginBottom: 20, fontSize: '0.85rem', color: 'var(--color-text-light)' }}>Showing <strong>{filtered.length}</strong> manufacturers</div>

          {/* Table */}
          <div style={{ overflowX: 'auto', background: 'white', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'var(--color-primary)', color: 'white' }}>
                  {['#', 'Company', 'Location', 'Products', 'Export Countries', 'Affiliate', 'Contact'].map(h => (
                    <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((m, idx) => (
                  <tr key={m.id} style={{ borderBottom: '1px solid var(--color-border)', background: idx % 2 === 0 ? 'white' : '#f8faf8', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(26,77,46,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'white' : '#f8faf8'}>
                    <td style={{ padding: '12px 16px', color: 'var(--color-text-light)', fontWeight: 700 }}>{m.id}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 800 }}>{m.name}</div>
                      {m.website !== 'N/A' && <a href={`https://${m.website}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.72rem', color: 'var(--color-primary)' }}>{m.website}</a>}
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={12} color="var(--color-text-light)" />
                        {m.location}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', maxWidth: 200 }}>
                      {m.products.split(', ').map(p => <span key={p} className="badge" style={{ marginRight: 4, marginBottom: 4, display: 'inline-block' }}>{p}</span>)}
                    </td>
                    <td style={{ padding: '12px 16px', maxWidth: 180 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Globe size={12} color="var(--color-text-light)" />
                        <span style={{ fontSize: '0.8rem' }}>{m.exportCountries}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        fontSize: '0.7rem', fontWeight: 700, borderRadius: 30, padding: '3px 10px',
                        background: m.affiliateAvailable === 'Yes' ? 'rgba(26,77,46,0.12)' : m.affiliateAvailable === 'No' ? 'rgba(220,38,38,0.1)' : 'rgba(230,168,23,0.15)',
                        color: m.affiliateAvailable === 'Yes' ? 'var(--color-primary)' : m.affiliateAvailable === 'No' ? '#dc2626' : '#b45309'
                      }}>{m.affiliateAvailable}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <a href={`mailto:${m.email}`} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--color-primary)' }}>
                          <Mail size={11} /> {m.email}
                        </a>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
                          <Phone size={11} /> {m.contact}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: 48, color: 'var(--color-text-light)' }}>
                No results found for "{search}"
              </div>
            )}
          </div>

          <div style={{ marginTop: 24, padding: '16px', background: 'rgba(230,168,23,0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(230,168,23,0.2)' }}>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-text-light)' }}>
              <strong>📋 Disclaimer:</strong> This database is compiled from public business directories and direct outreach. Avani Agro Foods does not guarantee the accuracy of all contact information. Always verify before business transactions. Do not share this data without authorization.
            </p>
          </div>
        </div>
      </div>
    </PasswordGate>
  )
}
