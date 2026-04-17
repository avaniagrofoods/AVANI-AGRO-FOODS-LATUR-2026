import { useState } from 'react'
import SEO from '../components/SEO'
import PasswordGate from '../components/PasswordGate'
import { IMPORTERS } from '../data/importersData'
import { Search, Download, MapPin, Globe, Mail, Phone } from 'lucide-react'

const REGIONS = ['All', 'USA', 'Europe', 'Middle East', 'Asia Pacific', 'Africa', 'Canada']

export default function Importers() {
  const [search, setSearch] = useState('')
  const [region, setRegion] = useState('All')

  const filtered = IMPORTERS.filter(m => {
    const q = search.toLowerCase()
    const matchSearch = !q || m.name.toLowerCase().includes(q) || m.location.toLowerCase().includes(q) || m.products.toLowerCase().includes(q)
    const matchRegion = region === 'All' ||
      (region === 'USA' && m.location.includes('USA')) ||
      (region === 'Europe' && (m.location.includes('France') || m.location.includes('Germany') || m.location.includes('UK') || m.location.includes('Netherlands') || m.location.includes('Ireland') || m.location.includes('Sweden') || m.location.includes('Italy'))) ||
      (region === 'Middle East' && (m.location.includes('UAE') || m.location.includes('Saudi') || m.location.includes('Kuwait'))) ||
      (region === 'Asia Pacific' && (m.location.includes('Japan') || m.location.includes('China') || m.location.includes('Australia') || m.location.includes('Singapore') || m.location.includes('Korea') || m.location.includes('Malaysia'))) ||
      (region === 'Africa' && (m.location.includes('Kenya') || m.location.includes('Nigeria') || m.location.includes('South Africa'))) ||
      (region === 'Canada' && m.location.includes('Canada'))
    return matchSearch && matchRegion
  })

  const handleExport = () => {
    const csv = ['#,Name,Location,Products,Import Countries,Website,Email,Contact']
    filtered.forEach(m => {
      csv.push(`${m.id},"${m.name}","${m.location}","${m.products}","${m.importCountries}","${m.website}","${m.email}","${m.contact}"`)
    })
    const blob = new Blob([csv.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'importers-avani-agro.csv'; a.click()
  }

  return (
    <PasswordGate title="Global Importers Database" subtitle="This database contains 30 verified global importers of Moringa Powder & Onion Powder." storageKey="imp_access">
      <SEO title="Global Importers Database" description="30 verified international importers of Moringa Powder and Red Onion Powder from India. USA, EU, UAE, Japan, Australia and more." />

      <div className="page-top">
        <div style={{ background: 'linear-gradient(135deg, #0a1f0d, #1a4d2e)', padding: '72px 0', textAlign: 'center' }}>
          <div className="container">
            <div className="section-tag" style={{ justifyContent: 'center', background: 'rgba(255,255,255,0.15)', color: 'white', display: 'inline-flex', marginBottom: 16 }}>
              🌍 Global Importers
            </div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white', marginBottom: 12 }}>Global Importers Database</h1>
            <p style={{ color: 'rgba(255,255,255,0.75)', maxWidth: 600, margin: '0 auto' }}>
              {IMPORTERS.length} verified international buyers of Moringa Powder & Red Onion Powder across {REGIONS.length - 1} regions.
            </p>
          </div>
        </div>

        <div className="container" style={{ padding: '48px 24px' }}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 32, alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ position: 'relative', flex: '1 1 280px' }}>
              <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-light)' }} />
              <input id="imp-search" className="input" placeholder="Search by name, location, product..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 42 }} />
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {REGIONS.map(r => (
                <button key={r} onClick={() => setRegion(r)} className="btn" style={{ background: region === r ? 'var(--color-primary)' : 'white', color: region === r ? 'white' : 'var(--color-text)', border: '1px solid var(--color-border)', fontSize: '0.8rem' }}>{r}</button>
              ))}
              <button onClick={handleExport} className="btn" style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--color-accent)', color: 'white' }}>
                <Download size={15} /> Export CSV
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 20, fontSize: '0.85rem', color: 'var(--color-text-light)' }}>Showing <strong>{filtered.length}</strong> importers</div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            {filtered.map(m => (
              <div key={m.id} className="card card-hover" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--color-primary)', textTransform: 'uppercase', background: 'rgba(26,77,46,0.08)', padding: '3px 10px', borderRadius: 30 }}>#{m.id}</div>
                  <Globe size={16} color="var(--color-text-light)" />
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 6 }}>{m.name}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--color-text-light)', marginBottom: 12 }}>
                  <MapPin size={12} /> {m.location}
                </div>
                <div style={{ marginBottom: 12 }}>
                  {m.products.split(', ').slice(0, 3).map(p => <span key={p} className="badge" style={{ marginRight: 4, marginBottom: 4, display: 'inline-block', fontSize: '0.65rem' }}>{p}</span>)}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-light)', marginBottom: 16 }}>
                  <strong>Imports from:</strong> {m.importCountries}
                </div>
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {m.website !== 'N/A' && <a href={`https://www.${m.website}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--color-primary)' }}><Globe size={12} /> {m.website}</a>}
                  <a href={`mailto:${m.email}`} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--color-text)' }}><Mail size={12} /> {m.email}</a>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--color-text-light)' }}><Phone size={12} /> {m.contact}</span>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: 64, color: 'var(--color-text-light)' }}>No importers found for the selected filters.</div>
          )}

          <div style={{ marginTop: 32, padding: '16px', background: 'rgba(230,168,23,0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(230,168,23,0.2)' }}>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-text-light)' }}>
              <strong>📋 Disclaimer:</strong> Contact information is compiled from public business directories. Avani Agro Foods does not guarantee accuracy. Verify before initiating business. This database is for authorized partners only.
            </p>
          </div>
        </div>
      </div>
    </PasswordGate>
  )
}
