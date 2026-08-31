import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import SEO from '../components/SEO'
import PasswordGate from '../components/PasswordGate'
import PrivateNav from '../components/PrivateNav'
import {
  Users, Building2, FileText, Plus, ArrowRight,
  TrendingUp, ShieldCheck, CheckCircle2, AlertCircle,
  Clock, Download, RefreshCw, Search, Phone, Mail, Globe,
  ExternalLink, FileSpreadsheet
} from 'lucide-react'
import { BUSINESS_INFO, WHATSAPP_NUMBER } from '../data/links'

export default function PrivateDashboard() {
  const navigate = useNavigate()
  const [importers, setImporters] = useState([])
  const [manufacturers, setManufacturers] = useState({ small: [], medium: [], large: [], all: [] })
  const [quotations, setQuotations] = useState([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    try {
      // 1. Fetch Importers
      const impRes = await fetch('/api/importers', {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin'
      })
      if (impRes.ok) {
        const impData = await impRes.json()
        setImporters(impData.importers || [])
      }

      // 2. Fetch Manufacturers
      const mfrRes = await fetch('/api/manufacturers', {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin'
      })
      if (mfrRes.ok) {
        const mfrData = await mfrRes.json()
        const all = mfrData.all || []
        setManufacturers({
          small: mfrData.manufacturers?.small || [],
          medium: mfrData.manufacturers?.medium || [],
          large: mfrData.manufacturers?.large || [],
          all
        })
      }

      // 3. Fetch Quotations & Local Enquiries
      let serverQuotes = []
      try {
        const quoteRes = await fetch('/api/admin-quotations', {
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin'
        })
        if (quoteRes.ok) {
          const qData = await quoteRes.json()
          serverQuotes = qData.quotations || []
        }
      } catch {}

      const localEnquiries = JSON.parse(localStorage.getItem('avani_enquiries') || '[]')
      const localQuotes = localEnquiries.map((e, idx) => ({
        quoteId: e.quoteId || `AAF-Q-2026-${1001 + idx}`,
        customerName: e.fullName || e.name || 'Direct Buyer',
        companyName: e.companyName || e.company || 'B2B Importer',
        country: e.country || 'International',
        product: e.product || 'Moringa Powder',
        quantity: e.quantity || 500,
        currency: 'USD',
        incoterm: e.incoterm || 'FOB Nhava Sheva',
        grandTotal: ((Number(e.quantity) || 500) * 4.82) + 210,
        status: e.status || 'NEW',
        date: e.date ? e.date.split(',')[0] : new Date().toISOString().split('T')[0]
      }))

      const merged = [...localQuotes, ...serverQuotes]
      const unique = Array.from(new Map(merged.map(q => [q.quoteId, q])).values())
      setQuotations(unique)

    } catch (err) {
      console.error('Error loading dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Derived real metrics
  const totalImporters = importers.length
  const verifiedImporters = importers.filter(i => i.verificationStatus === 'VERIFIED').length
  const highPriorityImporters = importers.filter(i => i.priority === 'HIGH').length

  const totalManufacturers = manufacturers.all.length
  const maharashtraMfrs = manufacturers.all.filter(m => m.location?.includes('Maharashtra')).length
  const verifiedMfrs = manufacturers.all.filter(m => m.verificationStatus === 'VERIFIED').length

  const totalQuotes = quotations.length
  const openQuotes = quotations.filter(q => q.status === 'NEW' || q.status === 'REVIEW_REQUIRED' || q.status === 'DRAFT' || q.status === 'SENT').length

  return (
    <PasswordGate
      title="Private Business Portal"
      description="Authentication required to access AVANI AGRO FOODS business intelligence and quotation systems."
      onUnlock={loadData}
    >
      <SEO
        title="Private Business Portal | AVANI AGRO FOODS"
        description="Private trade coordination portal for AVANI AGRO FOODS."
        noindex={true}
      />

      <PrivateNav onLogout={() => window.location.reload()} />

      <div className="page-top" style={{ minHeight: '100vh', background: '#f4f6f4', paddingBottom: 80 }}>
        
        {/* Portal Header */}
        <div style={{ background: 'linear-gradient(135deg, #0a1f0d, #1a4d2e)', padding: '48px 0 40px', color: 'white' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
              <div>
                <div className="section-tag" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', display: 'inline-flex', marginBottom: 12 }}>
                  <ShieldCheck size={14} /> Trade Intelligence &amp; Sourcing Operations
                </div>
                <h1 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: 900, color: 'white', marginBottom: 8 }}>
                  Business Intelligence Dashboard
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem', margin: 0 }}>
                  Internal management workspace for global buyers, Indian processor sourcing, and proforma quotations.
                </p>
              </div>

              {/* Quick Actions */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Link to="/private/importers?action=new" className="btn" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.25)', fontSize: '0.82rem', gap: 6 }}>
                  <Plus size={15} /> Add Importer
                </Link>
                <Link to="/private/manufacturers?action=new" className="btn" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.25)', fontSize: '0.82rem', gap: 6 }}>
                  <Plus size={15} /> Add Supplier
                </Link>
                <Link to="/private/quotations?tab=builder" className="btn btn-primary" style={{ background: 'var(--color-accent)', color: 'white', fontSize: '0.82rem', gap: 6 }}>
                  <Plus size={15} /> Create Quotation
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="container" style={{ paddingTop: 36 }}>

          {/* Real-time Business Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 20, marginBottom: 36 }}>
            
            {/* Metric 1: Global Importers */}
            <div className="card" style={{ padding: '24px', background: 'white', borderLeft: '4px solid #16a34a' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text-light)' }}>
                  Global Importers
                </span>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(22,163,74,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={18} color="#16a34a" />
                </div>
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--color-text)', lineHeight: 1, marginBottom: 8 }}>
                {totalImporters}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', display: 'flex', gap: 12 }}>
                <span><strong>{verifiedImporters}</strong> Verified</span>
                <span>•</span>
                <span><strong>{highPriorityImporters}</strong> High Priority</span>
              </div>
            </div>

            {/* Metric 2: Indian Manufacturers */}
            <div className="card" style={{ padding: '24px', background: 'white', borderLeft: '4px solid #0284c7' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text-light)' }}>
                  Processor Network
                </span>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(2,132,199,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={18} color="#0284c7" />
                </div>
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--color-text)', lineHeight: 1, marginBottom: 8 }}>
                {totalManufacturers}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', display: 'flex', gap: 12 }}>
                <span><strong>{maharashtraMfrs}</strong> in Maharashtra</span>
                <span>•</span>
                <span><strong>{verifiedMfrs}</strong> Verified</span>
              </div>
            </div>

            {/* Metric 3: Active Quotations */}
            <div className="card" style={{ padding: '24px', background: 'white', borderLeft: '4px solid #f59e0b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text-light)' }}>
                  Quotation Pipeline
                </span>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={18} color="#f59e0b" />
                </div>
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--color-text)', lineHeight: 1, marginBottom: 8 }}>
                {totalQuotes}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', display: 'flex', gap: 12 }}>
                <span><strong>{openQuotes}</strong> Active / Draft</span>
                <span>•</span>
                <span>Incoterms: FOB / CIF</span>
              </div>
            </div>

            {/* Metric 4: Sourcing Hub Status */}
            <div className="card" style={{ padding: '24px', background: 'white', borderLeft: '4px solid var(--color-primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text-light)' }}>
                  Hub Operations
                </span>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(26,77,46,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={18} color="var(--color-primary)" />
                </div>
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)', lineHeight: 1.2, marginBottom: 6 }}>
                Latur Desk Active
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>
                Nhava Sheva (JNPT) Dispatch Ready
              </div>
            </div>

          </div>

          {/* Core Modules Grid */}
          <div style={{ marginBottom: 44 }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: 18, color: 'var(--color-text)' }}>
              Core Business Intelligence Modules
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 24 }}>
              
              {/* Module Card 1: Importers */}
              <div className="card card-hover" style={{ padding: '32px', background: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 10, background: 'rgba(22,163,74,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Users size={24} color="#16a34a" />
                    </div>
                    <span className="badge" style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}>
                      {totalImporters} Buyers
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: 8 }}>
                    Importer Intelligence
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--color-text-light)', lineHeight: 1.6, marginBottom: 20 }}>
                    Access 30 verified international buyers across USA, Europe, Middle East, Japan, and Australia. Track outreach status, requirements, and initiate quotations.
                  </p>
                </div>
                <Link to="/private/importers" className="btn btn-primary" style={{ justifyContent: 'space-between' }}>
                  <span>Open Importer Intelligence</span>
                  <ArrowRight size={16} />
                </Link>
              </div>

              {/* Module Card 2: Manufacturers */}
              <div className="card card-hover" style={{ padding: '32px', background: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 10, background: 'rgba(2,132,199,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Building2 size={24} color="#0284c7" />
                    </div>
                    <span className="badge" style={{ background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd' }}>
                      {totalManufacturers} Suppliers
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: 8 }}>
                    Indian Manufacturer Database
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--color-text-light)', lineHeight: 1.6, marginBottom: 20 }}>
                    Directory of 60 vetted Indian processing plants, dehydration units, and milling facilities (20 Small, 20 Medium, 20 Large). Filter by location and capacity.
                  </p>
                </div>
                <Link to="/private/manufacturers" className="btn btn-primary" style={{ justifyContent: 'space-between' }}>
                  <span>Open Manufacturer Database</span>
                  <ArrowRight size={16} />
                </Link>
              </div>

              {/* Module Card 3: Quotations */}
              <div className="card card-hover" style={{ padding: '32px', background: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 10, background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileText size={24} color="#f59e0b" />
                    </div>
                    <span className="badge" style={{ background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a' }}>
                      {totalQuotes} Records
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: 8 }}>
                    Quotation Management
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--color-text-light)', lineHeight: 1.6, marginBottom: 20 }}>
                    Generate itemized proforma quotations with auto-calculations for FOB/CIF Incoterms, currency conversion, vector PDF export, and buyer print layouts.
                  </p>
                </div>
                <Link to="/private/quotations" className="btn btn-primary" style={{ justifyContent: 'space-between' }}>
                  <span>Open Quotation Management</span>
                  <ArrowRight size={16} />
                </Link>
              </div>

            </div>
          </div>

          {/* Recent Sourcing Inquiries & Quotations */}
          <div className="card" style={{ padding: '32px', background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--color-text)' }}>
                  Recent Inquiries &amp; Quotations Activity
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--color-text-light)', margin: '4px 0 0' }}>
                  Latest buyer RFQ submissions and generated commercial quotations
                </p>
              </div>
              <button onClick={loadData} className="btn" style={{ padding: '6px 12px', fontSize: '0.78rem', gap: 6, background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)' }}>
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh Data
              </button>
            </div>

            {quotations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--color-text-light)', fontSize: '0.88rem' }}>
                No quotations or inquiries recorded yet. Use the Contact form or Quotation Builder to generate records.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--color-bg-alt)', borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                      <th style={{ padding: '10px 14px' }}>Quote / Lead ID</th>
                      <th style={{ padding: '10px 14px' }}>Buyer &amp; Company</th>
                      <th style={{ padding: '10px 14px' }}>Country</th>
                      <th style={{ padding: '10px 14px' }}>Product</th>
                      <th style={{ padding: '10px 14px' }}>Volume</th>
                      <th style={{ padding: '10px 14px' }}>Incoterm</th>
                      <th style={{ padding: '10px 14px' }}>Total Est.</th>
                      <th style={{ padding: '10px 14px' }}>Status</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotations.slice(0, 5).map((q) => (
                      <tr key={q.quoteId} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'monospace' }}>
                          {q.quoteId}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 700 }}>{q.customerName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>{q.companyName}</div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>{q.country}</td>
                        <td style={{ padding: '12px 14px' }}>{q.product}</td>
                        <td style={{ padding: '12px 14px', fontWeight: 700 }}>{q.quantity} kg</td>
                        <td style={{ padding: '12px 14px' }}>{q.incoterm}</td>
                        <td style={{ padding: '12px 14px', fontWeight: 800 }}>
                          ${Number(q.grandTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span className="badge" style={{
                            fontSize: '0.7rem',
                            background: q.status === 'SENT' || q.status === 'ACCEPTED' ? '#f0fdf4' : '#fffbeb',
                            color: q.status === 'SENT' || q.status === 'ACCEPTED' ? '#166534' : '#92400e',
                            border: `1px solid ${q.status === 'SENT' || q.status === 'ACCEPTED' ? '#bbf7d0' : '#fde68a'}`
                          }}>
                            {q.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <Link to={`/private/quotations`} className="btn" style={{ padding: '4px 8px', fontSize: '0.75rem', background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)' }}>
                            View in Portal
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>
    </PasswordGate>
  )
}
