import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import SEO from '../components/SEO'
import PasswordGate from '../components/PasswordGate'
import PrivateNav from '../components/PrivateNav'
import {
  FileText, Plus, Printer, Download, Trash2, Mail,
  Phone, Building2, MapPin, CheckCircle2, Clock,
  RefreshCw, Share2, Copy, Check, Eye, Edit, ChevronRight,
  Calculator, Search, Filter, ShieldCheck, X
} from 'lucide-react'
import { BUSINESS_INFO, WHATSAPP_NUMBER } from '../data/links'

const STATUS_LIST = ['ALL', 'DRAFT', 'SENT', 'VIEWED', 'NEGOTIATION', 'REVISED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED']

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR']
const INCOTERMS = [
  'FOB Nhava Sheva (JNPT Mumbai)',
  'CIF Destination Port',
  'CFR Destination Port',
  'EXW (Partner Facility)',
  'Air Cargo (Mumbai)'
]

export default function AdminQuotations() {
  const [searchParams] = useSearchParams()
  const [quotations, setQuotations] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('list') // 'list', 'builder', 'preview'
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedQuote, setSelectedQuote] = useState(null)
  const [copiedId, setCopiedId] = useState('')

  // Builder Form State
  const [builderForm, setBuilderForm] = useState({
    quoteId: `AAF-Q-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    date: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    buyerName: '',
    companyName: '',
    country: '',
    address: '',
    email: '',
    phone: '',
    currency: 'USD',
    incoterm: INCOTERMS[0],
    origin: 'Nhava Sheva (JNPT Mumbai) / Latur, Maharashtra',
    destinationPort: '',
    paymentTerms: '30% Advance, 70% against BL Copy (or Irrevocable LC at sight)',
    leadTime: '14 to 21 working days from Proforma confirmation',
    inspectionTerms: 'NABL-Accredited Lab Certificate of Analysis (COA) provided with batch',
    sampleTerms: 'Representative pre-shipment sample dispatch via DHL/FedEx',
    notes: 'Indicative commercial quotation subject to final supplier, freight and specification confirmation.',
    internalSupplierNote: '',
    items: [
      { id: 1, description: 'Export Grade Moringa Leaf Powder (80–100 Mesh, Moisture ≤ 7.0%)', hscode: '0712.90.90', quantity: 500, unit: 'KG', rate: 4.80, amount: 2400 }
    ],
    freightCharges: 0,
    insuranceCharges: 0,
    documentationCharges: 150,
    otherCharges: 0,
    status: 'DRAFT'
  })

  // Load Quotations Data
  const loadData = async () => {
    setLoading(true)
    try {
      let serverQuotes = []
      try {
        const res = await fetch('/api/admin-quotations', {
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin'
        })
        if (res.ok) {
          const json = await res.json()
          serverQuotes = json.quotations || []
        }
      } catch (e) {
        console.warn('Server quote fetch error', e)
      }

      // Load local quotations & enquiries
      const localQuotes = JSON.parse(localStorage.getItem('avani_quotations') || '[]')
      const localEnquiries = JSON.parse(localStorage.getItem('avani_enquiries') || '[]')
      const enquiryQuotes = localEnquiries.map((e, idx) => ({
        quoteId: e.quoteId || `AAF-Q-2026-${2000 + idx}`,
        date: e.date ? e.date.split(',')[0] : new Date().toISOString().split('T')[0],
        validUntil: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        buyerName: e.fullName || e.name || 'Direct Buyer',
        companyName: e.companyName || e.company || 'B2B Importer',
        country: e.country || 'International',
        email: e.email,
        phone: e.phone || '+91 7219053645',
        currency: 'USD',
        incoterm: e.incoterm || 'FOB Nhava Sheva',
        product: e.product || 'Moringa Powder',
        quantity: Number(e.quantity) || 500,
        unit: 'KG',
        grandTotal: ((Number(e.quantity) || 500) * 4.80) + 150,
        status: e.status || 'NEW',
        items: [
          { id: 1, description: `${e.product || 'Moringa Powder'} (Export Grade)`, hscode: '0712.90.90', quantity: Number(e.quantity) || 500, unit: 'KG', rate: 4.80, amount: (Number(e.quantity) || 500) * 4.80 }
        ]
      }))

      const combined = [...localQuotes, ...enquiryQuotes, ...serverQuotes]
      const unique = Array.from(new Map(combined.map(q => [q.quoteId, q])).values())
      setQuotations(unique)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Handle URL pre-fill from Importers module
  useEffect(() => {
    const tab = searchParams.get('tab')
    const buyer = searchParams.get('buyer')
    const company = searchParams.get('company')
    const email = searchParams.get('email')
    const country = searchParams.get('country')
    const product = searchParams.get('product')

    if (tab === 'builder' || buyer || company) {
      setActiveTab('builder')
      setBuilderForm(prev => ({
        ...prev,
        quoteId: `AAF-Q-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        buyerName: buyer || prev.buyerName,
        companyName: company || prev.companyName,
        email: email || prev.email,
        country: country || prev.country,
        items: product ? [
          {
            id: 1,
            description: `${product} (Export Grade Batch)`,
            hscode: product.includes('Onion') ? '0712.20.00' : '0712.90.90',
            quantity: 500,
            unit: 'KG',
            rate: product.includes('Onion') ? 2.50 : 4.80,
            amount: product.includes('Onion') ? 1250 : 2400
          }
        ] : prev.items
      }))
    }
  }, [searchParams])

  // Builder Item Row Actions
  const handleAddItem = () => {
    setBuilderForm(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { id: Date.now(), description: 'Dehydrated Red Onion Powder (60–80 Mesh)', hscode: '0712.20.00', quantity: 500, unit: 'KG', rate: 2.50, amount: 1250 }
      ]
    }))
  }

  const handleRemoveItem = (id) => {
    setBuilderForm(prev => ({
      ...prev,
      items: prev.items.filter(i => i.id !== id)
    }))
  }

  const handleUpdateItem = (id, field, val) => {
    setBuilderForm(prev => ({
      ...prev,
      items: prev.items.map(i => {
        if (i.id !== id) return i
        const updated = { ...i, [field]: field === 'quantity' || field === 'rate' ? Number(val) || 0 : val }
        updated.amount = Number((updated.quantity * updated.rate).toFixed(2))
        return updated
      })
    }))
  }

  // Monetary Calculations
  const itemsSubtotal = builderForm.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
  const grandTotal = Number((
    itemsSubtotal +
    (Number(builderForm.freightCharges) || 0) +
    (Number(builderForm.insuranceCharges) || 0) +
    (Number(builderForm.documentationCharges) || 0) +
    (Number(builderForm.otherCharges) || 0)
  ).toFixed(2))

  // Save Quotation
  const handleSaveQuotation = (e) => {
    e.preventDefault()
    const record = {
      ...builderForm,
      subtotal: itemsSubtotal,
      grandTotal: grandTotal,
      customerName: builderForm.buyerName,
      product: builderForm.items.map(i => i.description).join(' + ')
    }

    // Save to localStorage
    const existing = JSON.parse(localStorage.getItem('avani_quotations') || '[]')
    const updated = [record, ...existing.filter(q => q.quoteId !== record.quoteId)]
    localStorage.setItem('avani_quotations', JSON.stringify(updated))

    setQuotations(prev => [record, ...prev.filter(q => q.quoteId !== record.quoteId)])
    setSelectedQuote(record)
    setActiveTab('preview')
  }

  // Status Change Handler
  const handleStatusChange = (quoteId, newStatus) => {
    const updated = quotations.map(q => q.quoteId === quoteId ? { ...q, status: newStatus } : q)
    setQuotations(updated)
    localStorage.setItem('avani_quotations', JSON.stringify(updated))
  }

  // Delete Quotation Handler
  const handleDeleteQuote = (quoteId) => {
    if (!window.confirm(`Delete quotation ${quoteId}?`)) return
    const updated = quotations.filter(q => q.quoteId !== quoteId)
    setQuotations(updated)
    localStorage.setItem('avani_quotations', JSON.stringify(updated))
    if (selectedQuote?.quoteId === quoteId) setSelectedQuote(null)
  }

  // Download PDF Action
  const handleDownloadPdf = async (quote) => {
    try {
      const res = await fetch('/api/quotation?action=download-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quote)
      })
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `Quotation_${quote.quoteId}.pdf`
        document.body.appendChild(a)
        a.click()
        a.remove()
      } else {
        alert('PDF generation failed. Printing browser view instead.')
        window.print()
      }
    } catch (err) {
      window.print()
    }
  }

  // Filtered Quotations
  const filteredQuotations = quotations.filter(q => {
    const matchStatus = statusFilter === 'ALL' || q.status === statusFilter
    const query = searchQuery.toLowerCase()
    const matchSearch = !query ||
      q.quoteId?.toLowerCase().includes(query) ||
      q.buyerName?.toLowerCase().includes(query) ||
      q.customerName?.toLowerCase().includes(query) ||
      q.companyName?.toLowerCase().includes(query) ||
      q.country?.toLowerCase().includes(query)
    return matchStatus && matchSearch
  })

  return (
    <PasswordGate
      title="Quotation Management Portal"
      description="Authentication required to manage proforma quotations and commercial pricing."
      onUnlock={loadData}
    >
      <SEO
        title="Quotation Management Portal | AVANI AGRO FOODS"
        description="Private quotation and pricing management."
        noindex={true}
      />

      <PrivateNav onLogout={() => window.location.reload()} />

      <div className="page-top" style={{ minHeight: '100vh', background: '#f8faf8', paddingBottom: 80 }}>
        
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #0a1f0d, #1a4d2e)', padding: '40px 0 32px', color: 'white' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div className="section-tag" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', display: 'inline-flex', marginBottom: 10 }}>
                  💼 Commercial Proforma Desk
                </div>
                <h1 style={{ fontSize: 'clamp(1.7rem, 3vw, 2.3rem)', fontWeight: 900, color: 'white', marginBottom: 4 }}>
                  Quotation Management System
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.88rem', margin: 0 }}>
                  Standard quotation generation (`AAF-Q-2026-XXXX`), Incoterms calculations, and export PDFs.
                </p>
              </div>

              {/* Tab Selector */}
              <div style={{ display: 'flex', gap: 8, background: 'rgba(255,255,255,0.1)', padding: 4, borderRadius: 8 }}>
                <button
                  onClick={() => setActiveTab('list')}
                  className="btn"
                  style={{
                    padding: '8px 16px',
                    fontSize: '0.82rem',
                    borderRadius: 6,
                    background: activeTab === 'list' ? 'var(--color-primary)' : 'transparent',
                    color: 'white',
                    border: 'none'
                  }}
                >
                  Quotations Registry ({quotations.length})
                </button>
                <button
                  onClick={() => setActiveTab('builder')}
                  className="btn"
                  style={{
                    padding: '8px 16px',
                    fontSize: '0.82rem',
                    borderRadius: 6,
                    background: activeTab === 'builder' ? 'var(--color-primary)' : 'transparent',
                    color: 'white',
                    border: 'none',
                    gap: 6
                  }}
                >
                  <Plus size={14} /> New Quotation
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="container" style={{ paddingTop: 28 }}>

          {/* ══════════════════════════════════════════════════════════ */}
          {/* TAB 1: QUOTATIONS LIST / CRM REGISTRY                     */}
          {/* ══════════════════════════════════════════════════════════ */}
          {activeTab === 'list' && (
            <div>
              {/* Search & Status Filters */}
              <div className="card" style={{ padding: '18px 24px', background: 'white', marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
                  <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: 440 }}>
                    <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-light)' }} />
                    <input
                      className="input"
                      style={{ paddingLeft: 40, height: 40, fontSize: '0.85rem', background: 'var(--color-bg-alt)' }}
                      placeholder="Search Quote ID, buyer name, company, country..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {/* Status Pills */}
                  <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
                    {STATUS_LIST.slice(0, 7).map(st => (
                      <button
                        key={st}
                        onClick={() => setStatusFilter(st)}
                        className="btn"
                        style={{
                          padding: '6px 12px',
                          fontSize: '0.75rem',
                          borderRadius: 14,
                          fontWeight: 700,
                          background: statusFilter === st ? 'var(--color-primary)' : 'var(--color-bg-alt)',
                          color: statusFilter === st ? 'white' : 'var(--color-text)',
                          border: statusFilter === st ? '1px solid var(--color-primary)' : '1px solid var(--color-border)'
                        }}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                {filteredQuotations.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--color-text-light)' }}>
                    No quotations found. Click <strong>"New Quotation"</strong> to create your first proforma.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ background: 'var(--color-bg-alt)', borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                          <th style={{ padding: '12px 16px' }}>Quote Number</th>
                          <th style={{ padding: '12px 16px' }}>Date</th>
                          <th style={{ padding: '12px 16px' }}>Buyer &amp; Company</th>
                          <th style={{ padding: '12px 16px' }}>Country</th>
                          <th style={{ padding: '12px 16px' }}>Incoterm</th>
                          <th style={{ padding: '12px 16px' }}>Grand Total</th>
                          <th style={{ padding: '12px 16px' }}>Status</th>
                          <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredQuotations.map((q) => (
                          <tr key={q.quoteId} style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <td style={{ padding: '14px 16px', fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'monospace' }}>
                              {q.quoteId}
                            </td>
                            <td style={{ padding: '14px 16px', color: 'var(--color-text-light)', fontSize: '0.8rem' }}>
                              {q.date}
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <div style={{ fontWeight: 700 }}>{q.buyerName || q.customerName}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>{q.companyName}</div>
                            </td>
                            <td style={{ padding: '14px 16px' }}>{q.country}</td>
                            <td style={{ padding: '14px 16px' }}>{q.incoterm || 'FOB'}</td>
                            <td style={{ padding: '14px 16px', fontWeight: 900, color: 'var(--color-text)' }}>
                              {q.currency || '$'} {Number(q.grandTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <select
                                value={q.status || 'DRAFT'}
                                onChange={e => handleStatusChange(q.quoteId, e.target.value)}
                                style={{
                                  padding: '4px 8px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  borderRadius: 4,
                                  border: '1px solid var(--color-border)',
                                  background: q.status === 'ACCEPTED' || q.status === 'SENT' ? '#f0fdf4' : '#fffbeb',
                                  color: q.status === 'ACCEPTED' || q.status === 'SENT' ? '#166534' : '#92400e'
                                }}
                              >
                                {STATUS_LIST.filter(s => s !== 'ALL').map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </td>
                            <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                <button
                                  onClick={() => { setSelectedQuote(q); setActiveTab('preview'); }}
                                  className="btn"
                                  style={{ padding: '5px 8px', fontSize: '0.75rem', background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)' }}
                                  title="View Printable Quotation"
                                >
                                  <Eye size={13} /> View
                                </button>
                                <button
                                  onClick={() => handleDownloadPdf(q)}
                                  className="btn"
                                  style={{ padding: '5px 8px', fontSize: '0.75rem', background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)' }}
                                  title="Download Vector PDF"
                                >
                                  <Download size={13} />
                                </button>
                                <button
                                  onClick={() => handleDeleteQuote(q.quoteId)}
                                  className="btn"
                                  style={{ padding: '5px 8px', fontSize: '0.75rem', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}
                                  title="Delete Quotation"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* TAB 2: INTERACTIVE QUOTATION BUILDER                      */}
          {/* ══════════════════════════════════════════════════════════ */}
          {activeTab === 'builder' && (
            <div className="card" style={{ padding: '36px', background: 'white', maxWidth: 900, margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, borderBottom: '1px solid var(--color-border)', paddingBottom: 16 }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 900, margin: 0, color: 'var(--color-text)' }}>
                    Proforma Quotation Builder
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', margin: '4px 0 0' }}>
                    Configure export items, Incoterms, currency, and commercial terms.
                  </p>
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-primary)', background: 'var(--color-bg-alt)', padding: '6px 14px', borderRadius: 6, fontFamily: 'monospace' }}>
                  {builderForm.quoteId}
                </div>
              </div>

              <form onSubmit={handleSaveQuotation} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                
                {/* Buyer / Consignee Information */}
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 12, color: 'var(--color-primary)' }}>
                    1. Consignee / Buyer Information
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                    <div>
                      <label className="label">Buyer Contact Name *</label>
                      <input className="input" required value={builderForm.buyerName} onChange={e => setBuilderForm({ ...builderForm, buyerName: e.target.value })} placeholder="Full Name" />
                    </div>
                    <div>
                      <label className="label">Company Name *</label>
                      <input className="input" required value={builderForm.companyName} onChange={e => setBuilderForm({ ...builderForm, companyName: e.target.value })} placeholder="Company Name" />
                    </div>
                    <div>
                      <label className="label">Country *</label>
                      <input className="input" required value={builderForm.country} onChange={e => setBuilderForm({ ...builderForm, country: e.target.value })} placeholder="e.g. USA, Germany, UAE" />
                    </div>
                    <div>
                      <label className="label">Business Email *</label>
                      <input type="email" required className="input" value={builderForm.email} onChange={e => setBuilderForm({ ...builderForm, email: e.target.value })} placeholder="procurement@company.com" />
                    </div>
                    <div>
                      <label className="label">Phone / WhatsApp</label>
                      <input className="input" value={builderForm.phone} onChange={e => setBuilderForm({ ...builderForm, phone: e.target.value })} placeholder="+1 234 567 8900" />
                    </div>
                    <div>
                      <label className="label">Destination Port</label>
                      <input className="input" value={builderForm.destinationPort} onChange={e => setBuilderForm({ ...builderForm, destinationPort: e.target.value })} placeholder="e.g. Port of Los Angeles / Rotterdam" />
                    </div>
                  </div>
                </div>

                {/* Commercial Terms & Incoterms */}
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 12, color: 'var(--color-primary)' }}>
                    2. Commercial Trade Terms
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                    <div>
                      <label className="label">Currency</label>
                      <select className="input" value={builderForm.currency} onChange={e => setBuilderForm({ ...builderForm, currency: e.target.value })}>
                        {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Incoterm</label>
                      <select className="input" value={builderForm.incoterm} onChange={e => setBuilderForm({ ...builderForm, incoterm: e.target.value })}>
                        {INCOTERMS.map(inc => <option key={inc} value={inc}>{inc}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Quotation Validity</label>
                      <input type="date" className="input" value={builderForm.validUntil} onChange={e => setBuilderForm({ ...builderForm, validUntil: e.target.value })} />
                    </div>
                  </div>
                </div>

                {/* Line Items Table */}
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: 'var(--color-primary)' }}>
                      3. Product Items &amp; Pricing
                    </h3>
                    <button type="button" onClick={handleAddItem} className="btn" style={{ padding: '4px 10px', fontSize: '0.78rem', background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)', gap: 4 }}>
                      <Plus size={13} /> Add Product Line
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {builderForm.items.map((item, idx) => (
                      <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 40px', gap: 8, alignItems: 'center', background: 'var(--color-bg-alt)', padding: 10, borderRadius: 6 }}>
                        <div>
                          <input className="input" style={{ fontSize: '0.82rem' }} value={item.description} onChange={e => handleUpdateItem(item.id, 'description', e.target.value)} placeholder="Product Description" />
                        </div>
                        <div>
                          <input className="input" style={{ fontSize: '0.82rem' }} value={item.hscode} onChange={e => handleUpdateItem(item.id, 'hscode', e.target.value)} placeholder="HS Code" />
                        </div>
                        <div>
                          <input type="number" className="input" style={{ fontSize: '0.82rem' }} value={item.quantity} onChange={e => handleUpdateItem(item.id, 'quantity', e.target.value)} placeholder="Quantity" />
                        </div>
                        <div>
                          <input type="number" step="0.01" className="input" style={{ fontSize: '0.82rem' }} value={item.rate} onChange={e => handleUpdateItem(item.id, 'rate', e.target.value)} placeholder="Rate / kg" />
                        </div>
                        <div style={{ fontWeight: 800, fontSize: '0.85rem', textAlign: 'right' }}>
                          ${item.amount.toFixed(2)}
                        </div>
                        <div>
                          {builderForm.items.length > 1 && (
                            <button type="button" onClick={() => handleRemoveItem(item.id)} className="btn" style={{ padding: 6, background: '#fef2f2', color: '#dc2626' }}>
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Freight & Additional Charges */}
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 12, color: 'var(--color-primary)' }}>
                    4. Freight, Inspection &amp; Export Charges
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                    <div>
                      <label className="label">Freight Estimate ({builderForm.currency})</label>
                      <input type="number" step="0.01" className="input" value={builderForm.freightCharges} onChange={e => setBuilderForm({ ...builderForm, freightCharges: e.target.value })} />
                    </div>
                    <div>
                      <label className="label">Marine Cargo Insurance</label>
                      <input type="number" step="0.01" className="input" value={builderForm.insuranceCharges} onChange={e => setBuilderForm({ ...builderForm, insuranceCharges: e.target.value })} />
                    </div>
                    <div>
                      <label className="label">Documentation &amp; Testing</label>
                      <input type="number" step="0.01" className="input" value={builderForm.documentationCharges} onChange={e => setBuilderForm({ ...builderForm, documentationCharges: e.target.value })} />
                    </div>
                    <div>
                      <label className="label">Other Export Handling</label>
                      <input type="number" step="0.01" className="input" value={builderForm.otherCharges} onChange={e => setBuilderForm({ ...builderForm, otherCharges: e.target.value })} />
                    </div>
                  </div>
                </div>

                {/* Calculation Summary Box */}
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '18px 24px', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 700 }}>ITEMS SUBTOTAL: ${itemsSubtotal.toFixed(2)}</div>
                    <div style={{ fontSize: '0.8rem', color: '#166534' }}>+ Freight &amp; Documentation: ${(grandTotal - itemsSubtotal).toFixed(2)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#166534' }}>TOTAL ESTIMATED VALUE</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--color-primary)' }}>
                      {builderForm.currency} ${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                {/* Internal Sourcing Notes (Not shown on buyer PDF) */}
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
                  <label className="label" style={{ color: '#b45309' }}>
                    🔒 Internal Supplier / Sourcing Reference (Internal Only — Not Printed)
                  </label>
                  <input className="input" value={builderForm.internalSupplierNote} onChange={e => setBuilderForm({ ...builderForm, internalSupplierNote: e.target.value })} placeholder="e.g. Sourced from Sahyadri Agro Nashik @ Rs 340/kg" />
                </div>

                {/* Submit Actions */}
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16 }}>
                  <button type="button" onClick={() => setActiveTab('list')} className="btn" style={{ background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)' }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ background: 'var(--color-accent)' }}>
                    Save &amp; Generate Proforma Document →
                  </button>
                </div>

              </form>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* TAB 3: PROFORMA PRINT & PDF PREVIEW                       */}
          {/* ══════════════════════════════════════════════════════════ */}
          {activeTab === 'preview' && selectedQuote && (
            <div style={{ maxWidth: 850, margin: '0 auto' }}>
              
              {/* Top Action Bar */}
              <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
                <button onClick={() => setActiveTab('list')} className="btn" style={{ background: 'white', border: '1px solid var(--color-border)' }}>
                  ← Back to Registry
                </button>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => window.print()} className="btn" style={{ background: 'white', border: '1px solid var(--color-border)', gap: 6 }}>
                    <Printer size={15} /> Print Proforma
                  </button>
                  <button onClick={() => handleDownloadPdf(selectedQuote)} className="btn btn-primary" style={{ gap: 6 }}>
                    <Download size={15} /> Download Vector PDF
                  </button>
                </div>
              </div>

              {/* Printable Document Box */}
              <div id="quotation-builder" style={{
                background: 'white',
                padding: '48px',
                borderRadius: 8,
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--color-border)',
                fontFamily: 'Inter, sans-serif'
              }}>
                {/* Document Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid var(--color-primary)', paddingBottom: 24, marginBottom: 24 }}>
                  <div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--color-primary)' }}>
                      AVANI AGRO FOODS
                    </div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-accent)' }}>
                      INDIAN AGRICULTURAL EXPORT COORDINATION
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', marginTop: 8, lineHeight: 1.5 }}>
                      Sachin Shinde — Trade Coordinator<br />
                      {BUSINESS_INFO.address.full}<br />
                      Email: {BUSINESS_INFO.email} | WhatsApp: {BUSINESS_INFO.phone}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--color-text)' }}>
                      PROFORMA INVOICE
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'monospace', marginTop: 4 }}>
                      {selectedQuote.quoteId}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', marginTop: 6 }}>
                      Date: <strong>{selectedQuote.date}</strong><br />
                      Valid Until: <strong>{selectedQuote.validUntil}</strong>
                    </div>
                  </div>
                </div>

                {/* Consignee Box */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28, background: 'var(--color-bg-alt)', padding: 16, borderRadius: 6, fontSize: '0.85rem' }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text-light)', marginBottom: 4 }}>CONSIGNEE / BUYER:</div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{selectedQuote.buyerName || selectedQuote.customerName}</div>
                    <div style={{ fontWeight: 700 }}>{selectedQuote.companyName}</div>
                    <div>{selectedQuote.country}</div>
                    <div>{selectedQuote.email}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text-light)', marginBottom: 4 }}>SHIPMENT &amp; TRADE DETAILS:</div>
                    <div><strong>Incoterm:</strong> {selectedQuote.incoterm}</div>
                    <div><strong>Port of Loading:</strong> Nhava Sheva (JNPT Mumbai)</div>
                    <div><strong>Destination Port:</strong> {selectedQuote.destinationPort || 'As agreed'}</div>
                    <div><strong>Origin:</strong> Maharashtra, India</div>
                  </div>
                </div>

                {/* Line Items Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: 24 }}>
                  <thead>
                    <tr style={{ background: 'var(--color-primary)', color: 'white', textAlign: 'left' }}>
                      <th style={{ padding: '10px 12px' }}>#</th>
                      <th style={{ padding: '10px 12px' }}>Description of Goods</th>
                      <th style={{ padding: '10px 12px' }}>HS Code</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Quantity</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Unit Rate</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Amount ({selectedQuote.currency || 'USD'})</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedQuote.items || [
                      { id: 1, description: selectedQuote.product || 'Moringa Powder', hscode: '0712.90.90', quantity: selectedQuote.quantity || 500, unit: 'KG', rate: 4.80, amount: (selectedQuote.quantity || 500) * 4.80 }
                    ]).map((item, idx) => (
                      <tr key={item.id || idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '10px 12px' }}>{idx + 1}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 700 }}>{item.description}</td>
                        <td style={{ padding: '10px 12px' }}>{item.hscode || '0712.90.90'}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>{item.quantity} {item.unit || 'KG'}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>${Number(item.rate).toFixed(2)}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800 }}>${Number(item.amount).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Total Summary */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 28 }}>
                  <div style={{ width: 280, fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
                      <span>Subtotal:</span>
                      <strong>${Number(selectedQuote.subtotal || selectedQuote.grandTotal - 150).toFixed(2)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
                      <span>Freight &amp; Handling:</span>
                      <strong>${Number(selectedQuote.freightCharges || 0).toFixed(2)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
                      <span>Documentation / Testing:</span>
                      <strong>${Number(selectedQuote.documentationCharges || 150).toFixed(2)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: '1.1rem', fontWeight: 900, color: 'var(--color-primary)', borderTop: '2px solid var(--color-primary)' }}>
                      <span>GRAND TOTAL:</span>
                      <span>{selectedQuote.currency || 'USD'} ${Number(selectedQuote.grandTotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                {/* Terms & Conditions Notice */}
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-light)', borderTop: '1px solid var(--color-border)', paddingTop: 16, lineHeight: 1.6 }}>
                  <div><strong>Payment Terms:</strong> {selectedQuote.paymentTerms || '30% Advance, 70% against BL Copy.'}</div>
                  <div><strong>Delivery Lead Time:</strong> {selectedQuote.leadTime || '14 to 21 working days.'}</div>
                  <div><strong>Quality &amp; Testing:</strong> {selectedQuote.inspectionTerms || 'NABL-Accredited Lab Certificate of Analysis (COA) provided with shipment.'}</div>
                  <div style={{ marginTop: 8, fontStyle: 'italic' }}>
                    *Notice: {selectedQuote.notes || 'Indicative commercial quotation subject to final supplier, freight and specification confirmation.'}
                  </div>
                </div>

                {/* Signature / Authorization */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 36, paddingTop: 16, borderTop: '1px dashed var(--color-border)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
                    AVANI AGRO FOODS • Udyam / MSME Registered<br />
                    Latur, Maharashtra, India
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>Sachin Shinde</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>Trade Coordinator &amp; Sourcing Lead</div>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>
      </div>
    </PasswordGate>
  )
}
