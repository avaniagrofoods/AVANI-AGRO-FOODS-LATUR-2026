import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import SEO from '../components/SEO'
import PasswordGate from '../components/PasswordGate'
import PrivateNav from '../components/PrivateNav'
import {
  Search, Download, Upload, Plus, Edit, Trash2,
  MapPin, Globe, Mail, Phone, ExternalLink, Filter,
  CheckCircle2, AlertCircle, Clock, FileText, ChevronRight,
  X, Check, RefreshCw, Send, MessageSquare, ShieldCheck, Eye
} from 'lucide-react'
import { WHATSAPP_NUMBER } from '../data/links'

const PRIORITIES = ['All', 'HIGH', 'MEDIUM', 'LOW']
const STATUSES = ['All', 'NEW', 'RESEARCHING', 'VERIFIED', 'CONTACTED', 'REPLIED', 'QUALIFIED', 'SAMPLE', 'QUOTATION', 'NEGOTIATION', 'ORDER', 'FOLLOW-UP']
const VERIFICATIONS = ['All', 'VERIFIED', 'PARTIALLY VERIFIED', 'UNVERIFIED', 'NEEDS REVIEW']

export default function Importers() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [importers, setImporters] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Filters & Search
  const [search, setSearch] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('All')
  const [selectedRegion, setSelectedRegion] = useState('All')
  const [selectedProduct, setSelectedProduct] = useState('All')
  const [selectedPriority, setSelectedPriority] = useState('All')
  const [selectedStatus, setSelectedStatus] = useState('All')
  const [selectedVerification, setSelectedVerification] = useState('All')
  const [sortBy, setSortBy] = useState('name') // name, priority, country, date

  // Dynamically derived countries from imported dataset
  const availableCountries = ['All', ...Array.from(new Set(importers.map(i => i.country).filter(Boolean))).sort()]

  // Filter & Sort logic
  const filtered = importers.filter(item => {
    const q = search.toLowerCase().trim()
    const matchSearch = !q ||
      item.name?.toLowerCase().includes(q) ||
      item.companyName?.toLowerCase().includes(q) ||
      item.country?.toLowerCase().includes(q) ||
      item.city?.toLowerCase().includes(q) ||
      item.location?.toLowerCase().includes(q) ||
      item.products?.toLowerCase().includes(q) ||
      item.email?.toLowerCase().includes(q) ||
      item.phone?.toLowerCase().includes(q) ||
      item.contactPerson?.toLowerCase().includes(q) ||
      item.businessType?.toLowerCase().includes(q)

    const matchCountry = selectedCountry === 'All' || item.country === selectedCountry
    const matchRegion = selectedRegion === 'All' || item.region === selectedRegion || (selectedRegion === 'USA' && item.country === 'USA')
    const matchProduct = selectedProduct === 'All' ||
      (selectedProduct === 'Moringa' && (item.products?.toLowerCase().includes('moringa') || item.moringaInterest === 'High')) ||
      (selectedProduct === 'Red Onion' && (item.products?.toLowerCase().includes('onion') || item.redOnionInterest === 'High'))

    const matchPriority = selectedPriority === 'All' || item.priority === selectedPriority
    const matchStatus = selectedStatus === 'All' || item.outreachStatus === selectedStatus
    const matchVerification = selectedVerification === 'All' || item.verificationStatus === selectedVerification

    return matchSearch && matchCountry && matchRegion && matchProduct && matchPriority && matchStatus && matchVerification
  })

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '')
    if (sortBy === 'country') return (a.country || '').localeCompare(b.country || '')
    if (sortBy === 'priority') {
      const pMap = { HIGH: 1, MEDIUM: 2, LOW: 3 }
      return (pMap[a.priority] || 4) - (pMap[b.priority] || 4)
    }
    if (sortBy === 'date') return (b.nextFollowUpDate || '').localeCompare(a.nextFollowUpDate || '')
    return 0
  })

  // Pagination calculation
  const totalPages = Math.ceil(sorted.length / pageSize) || 1
  const paginatedList = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // Export CSV
  const handleExportCSV = () => {
    if (!sorted.length) return
    const headers = [
      'ID', 'Company Name', 'Country', 'State/Region', 'City', 'Business Type',
      'Industry', 'Product Interest', 'Contact Person', 'Designation', 'Email',
      'Phone', 'Website', 'Verification Status', 'Priority', 'Outreach Status',
      'Estimated Requirement', 'Target Price', 'Preferred Incoterm', 'Destination Port',
      'Last Contact Date', 'Next Follow Up', 'Notes'
    ]
    const rows = sorted.map(i => [
      i.id,
      `"${(i.companyName || i.name || '').replace(/"/g, '""')}"`,
      `"${(i.country || '').replace(/"/g, '""')}"`,
      `"${(i.region || i.state || '').replace(/"/g, '""')}"`,
      `"${(i.city || '').replace(/"/g, '""')}"`,
      `"${(i.businessType || '').replace(/"/g, '""')}"`,
      `"${(i.industry || '').replace(/"/g, '""')}"`,
      `"${(i.products || '').replace(/"/g, '""')}"`,
      `"${(i.contactPerson || '').replace(/"/g, '""')}"`,
      `"${(i.designation || '').replace(/"/g, '""')}"`,
      `"${(i.email || '').replace(/"/g, '""')}"`,
      `"${(i.phone || i.contact || '').replace(/"/g, '""')}"`,
      `"${(i.website || '').replace(/"/g, '""')}"`,
      `"${(i.verificationStatus || 'VERIFIED')}"`,
      `"${(i.priority || 'MEDIUM')}"`,
      `"${(i.outreachStatus || 'NEW')}"`,
      `"${(i.estimatedRequirement || '')}"`,
      `"${(i.targetPrice || '')}"`,
      `"${(i.preferredIncoterm || '')}"`,
      `"${(i.destinationPort || '')}"`,
      `"${(i.lastContactDate || '')}"`,
      `"${(i.nextFollowUpDate || '')}"`,
      `"${(i.notes || '').replace(/"/g, '""')}"`
    ])

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `AVANI_Global_Importers_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Action: Create Quotation for Importer
  const handleCreateQuotation = (importer) => {
    const params = new URLSearchParams({
      tab: 'builder',
      buyer: importer.contactPerson || importer.name || '',
      company: importer.companyName || importer.name || '',
      email: importer.email || '',
      country: importer.country || '',
      product: (importer.products?.includes('Moringa') ? 'Moringa Powder' : 'Red Onion Powder')
    })
    navigate(`/private/quotations?${params.toString()}`)
  }

  // Delete Importer handler
  const handleDelete = (id) => {
    if (!window.confirm('Are you sure you want to remove this importer record from the active directory?')) return
    setImporters(prev => prev.filter(i => i.id !== id))
    if (selectedImporter?.id === id) setSelectedImporter(null)
  }

  // Add Importer handler
  const handleAddSubmit = (e) => {
    e.preventDefault()
    const newId = importers.length ? Math.max(...importers.map(i => i.id || 0)) + 1 : 1
    const record = {
      ...newFormData,
      id: newId,
      location: `${newFormData.city ? newFormData.city + ', ' : ''}${newFormData.country}`
    }
    setImporters(prev => [record, ...prev])
    setIsAddModalOpen(false)
    setSelectedImporter(record)
  }

  // Edit Importer handler
  const handleEditSubmit = (e) => {
    e.preventDefault()
    setImporters(prev => prev.map(i => i.id === editFormData.id ? editFormData : i))
    setSelectedImporter(editFormData)
    setIsEditModalOpen(false)
  }

  return (
    <PasswordGate
      title="Global Importers Database"
      description="Authentication required to view verified international buyers and importer intelligence."
      onUnlock={fetchData}
    >
      <SEO
        title="Importer Intelligence & Buyer Database | AVANI AGRO FOODS"
        description="Private international importer database."
        noindex={true}
      />

      <PrivateNav onLogout={() => window.location.reload()} />

      <div className="page-top" style={{ minHeight: '100vh', background: '#f8faf8', paddingBottom: 80 }}>
        
        {/* Module Header Banner */}
        <div style={{ background: 'linear-gradient(135deg, #0a1f0d, #1a4d2e)', padding: '40px 0 32px', color: 'white' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div className="section-tag" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', display: 'inline-flex', marginBottom: 10 }}>
                  🌍 Global Buyer Intelligence
                </div>
                <h1 style={{ fontSize: 'clamp(1.7rem, 3vw, 2.3rem)', fontWeight: 900, color: 'white', marginBottom: 4 }}>
                  Importer Intelligence Database
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.88rem', margin: 0 }}>
                  {importers.length} international agricultural buyers, supplement brands &amp; seasoning importers across {availableCountries.length > 1 ? availableCountries.length - 1 : 0} countries.
                </p>
              </div>

              {/* Header Actions */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="btn btn-primary"
                  style={{ background: 'var(--color-accent)', color: 'white', fontSize: '0.82rem', gap: 6 }}
                >
                  <Plus size={15} /> Add Importer
                </button>
                <button
                  onClick={handleExportCSV}
                  className="btn"
                  style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.25)', fontSize: '0.82rem', gap: 6 }}
                >
                  <Download size={15} /> Export CSV
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="container" style={{ paddingTop: 28 }}>

          {/* Search & Multi-Filter Control Bar */}
          <div className="card" style={{ padding: '20px', background: 'white', marginBottom: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              {/* Row 1: Search and Sort */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ position: 'relative', flex: '1 1 320px', maxWidth: 480 }}>
                  <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-light)' }} />
                  <input
                    className="input"
                    style={{ paddingLeft: 40, height: 42, fontSize: '0.88rem', background: 'var(--color-bg-alt)' }}
                    placeholder="Search company, contact person, country, city, product, email, phone..."
                    value={search}
                    onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', fontWeight: 700 }}>Sort by:</span>
                  <select
                    className="input"
                    style={{ height: 40, fontSize: '0.82rem', width: 'auto', background: 'var(--color-bg-alt)' }}
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                  >
                    <option value="name">Company Name (A-Z)</option>
                    <option value="country">Country</option>
                    <option value="priority">Priority (High to Low)</option>
                    <option value="date">Follow-up Date</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Country Filter Tabs & Dropdown */}
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-text-light)', marginRight: 4, whiteSpace: 'nowrap' }}>
                  Country:
                </span>
                {['All', 'USA', 'UK', 'UAE', 'Germany', 'Netherlands', 'Canada', 'Australia', 'Singapore'].map(ctry => (
                  <button
                    key={ctry}
                    onClick={() => { setSelectedCountry(ctry); setCurrentPage(1); }}
                    className="btn"
                    style={{
                      padding: '5px 12px',
                      fontSize: '0.76rem',
                      borderRadius: 16,
                      fontWeight: 700,
                      background: selectedCountry === ctry ? 'var(--color-primary)' : 'var(--color-bg-alt)',
                      color: selectedCountry === ctry ? 'white' : 'var(--color-text)',
                      border: selectedCountry === ctry ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {ctry === 'All' ? 'All Countries' : ctry}
                  </button>
                ))}
                <select
                  value={selectedCountry}
                  onChange={e => { setSelectedCountry(e.target.value); setCurrentPage(1); }}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 16,
                    fontSize: '0.76rem',
                    border: '1px solid var(--color-border)',
                    background: 'white',
                    fontWeight: 600,
                    marginLeft: 6
                  }}
                >
                  <option value="All">All {availableCountries.length > 1 ? availableCountries.length - 1 : 0} Countries...</option>
                  {availableCountries.filter(c => c !== 'All').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Row 3: Secondary Filters */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', borderTop: '1px solid var(--color-border)', paddingTop: 12, fontSize: '0.82rem' }}>
                <div>
                  <span style={{ color: 'var(--color-text-light)', marginRight: 6 }}>Product:</span>
                  <select
                    value={selectedProduct}
                    onChange={e => { setSelectedProduct(e.target.value); setCurrentPage(1); }}
                    style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid var(--color-border)', background: 'white' }}
                  >
                    <option value="All">All Products</option>
                    <option value="Moringa">Moringa Powder</option>
                    <option value="Red Onion">Red Onion Powder</option>
                  </select>
                </div>

                <div>
                  <span style={{ color: 'var(--color-text-light)', marginRight: 6 }}>Priority:</span>
                  <select
                    value={selectedPriority}
                    onChange={e => { setSelectedPriority(e.target.value); setCurrentPage(1); }}
                    style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid var(--color-border)', background: 'white' }}
                  >
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <div>
                  <span style={{ color: 'var(--color-text-light)', marginRight: 6 }}>Outreach Status:</span>
                  <select
                    value={selectedStatus}
                    onChange={e => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
                    style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid var(--color-border)', background: 'white' }}
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <span style={{ color: 'var(--color-text-light)', marginRight: 6 }}>Verification:</span>
                  <select
                    value={selectedVerification}
                    onChange={e => { setSelectedVerification(e.target.value); setCurrentPage(1); }}
                    style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid var(--color-border)', background: 'white' }}
                  >
                    {VERIFICATIONS.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>

                <div style={{ marginLeft: 'auto', color: 'var(--color-text-light)', fontSize: '0.8rem', alignSelf: 'center' }}>
                  Showing <strong>{sorted.length}</strong> of {importers.length} buyers
                </div>
              </div>

            </div>
          </div>

          {/* Results Grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <RefreshCw size={32} color="var(--color-primary)" className="animate-spin" style={{ margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--color-text-light)', fontSize: '0.9rem' }}>Loading global buyer records...</p>
            </div>
          ) : paginatedList.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '60px 24px', background: 'white' }}>
              <p style={{ color: 'var(--color-text-light)', fontSize: '1rem', marginBottom: 16 }}>
                No importers found matching your filter criteria.
              </p>
              <button
                onClick={() => { setSearch(''); setSelectedRegion('All'); setSelectedPriority('All'); setSelectedStatus('All'); setSelectedVerification('All'); }}
                className="btn btn-primary"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: 20 }}>
              {paginatedList.map(item => (
                <div
                  key={item.id}
                  className="card card-hover"
                  style={{
                    padding: '24px',
                    background: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    border: '1px solid var(--color-border)',
                    borderTop: `4px solid ${item.priority === 'HIGH' ? '#ef4444' : item.priority === 'MEDIUM' ? '#f59e0b' : '#3b82f6'}`
                  }}
                >
                  <div>
                    {/* Top Row: Country, Priority & Verification Badges */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={13} /> {item.location || item.country}
                      </span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <span className="badge" style={{
                          fontSize: '0.68rem',
                          background: item.priority === 'HIGH' ? '#fef2f2' : '#fffbeb',
                          color: item.priority === 'HIGH' ? '#dc2626' : '#d97706',
                          border: `1px solid ${item.priority === 'HIGH' ? '#fecaca' : '#fde68a'}`
                        }}>
                          {item.priority || 'MEDIUM'}
                        </span>
                        <span className="badge" style={{ fontSize: '0.68rem', background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}>
                          {item.verificationStatus || 'VERIFIED'}
                        </span>
                      </div>
                    </div>

                    {/* Company Name */}
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: 6 }}>
                      {item.companyName || item.name}
                    </h3>

                    {/* Business Type */}
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-light)', marginBottom: 12 }}>
                      {item.businessType || 'International Importer & Wholesaler'}
                    </div>

                    {/* Products & Requirements */}
                    <div style={{ background: 'var(--color-bg-alt)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: 14, fontSize: '0.82rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>
                        Products of Interest:
                      </div>
                      <div style={{ color: 'var(--color-text-light)' }}>
                        {item.products}
                      </div>
                    </div>

                    {/* Contact Person & Direct Info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.8rem', color: 'var(--color-text)', marginBottom: 16 }}>
                      {item.contactPerson && (
                        <div><strong>Contact:</strong> {item.contactPerson} ({item.designation || item.jobTitle || 'Lead'})</div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Mail size={12} color="var(--color-primary)" />
                        {item.email && item.email !== 'Not Available' ? (
                          <a href={`mailto:${item.email}`} style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>{item.email}</a>
                        ) : (
                          <span style={{ color: 'var(--color-text-light)' }}>Email: Not Available</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Phone size={12} color="var(--color-primary)" />
                        {item.phone && item.phone !== 'Not Available' ? (
                          <span>{item.phone}</span>
                        ) : (
                          <span style={{ color: 'var(--color-text-light)' }}>Phone: Not Available</span>
                        )}
                      </div>
                      {item.website && item.website !== 'Not Available' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Globe size={12} color="var(--color-primary)" />
                          <a href={item.website.startsWith('http') ? item.website : `https://${item.website}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>
                            {item.website.replace(/^https?:\/\//, '')}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions & Quotation Trigger */}
                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => setSelectedImporter(item)}
                        className="btn"
                        style={{ padding: '6px 10px', fontSize: '0.75rem', background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)', gap: 4 }}
                        title="View Complete Profile"
                      >
                        <Eye size={13} /> View
                      </button>
                      <button
                        onClick={() => { setEditFormData(item); setIsEditModalOpen(true); }}
                        className="btn"
                        style={{ padding: '6px 10px', fontSize: '0.75rem', background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)', gap: 4 }}
                        title="Edit Record"
                      >
                        <Edit size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="btn"
                        style={{ padding: '6px 8px', fontSize: '0.75rem', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}
                        title="Delete Record"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <button
                      onClick={() => handleCreateQuotation(item)}
                      className="btn btn-primary"
                      style={{ padding: '6px 12px', fontSize: '0.78rem', gap: 6, background: 'var(--color-accent)' }}
                      title="Generate Proforma Quotation for this buyer"
                    >
                      <FileText size={13} /> Create Quote
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 40 }}>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="btn"
                style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'white', border: '1px solid var(--color-border)' }}
              >
                Previous
              </button>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', margin: '0 8px' }}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="btn"
                style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'white', border: '1px solid var(--color-border)' }}
              >
                Next
              </button>
            </div>
          )}

        </div>

        {/* ── MODAL 1: VIEW IMPORTER DETAILS ──────────────────────── */}
        {selectedImporter && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: 20
          }}>
            <div className="card" style={{ maxWidth: 640, width: '100%', maxHeight: '90vh', overflowY: 'auto', background: 'white', padding: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <span className="badge" style={{ marginBottom: 6 }}>{selectedImporter.verificationStatus || 'VERIFIED'}</span>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--color-text)', margin: 0 }}>
                    {selectedImporter.companyName || selectedImporter.name}
                  </h2>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-light)' }}>
                    {selectedImporter.location || selectedImporter.country}
                  </div>
                </div>
                <button onClick={() => setSelectedImporter(null)} className="btn" style={{ padding: 6 }}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: '0.85rem', marginBottom: 24 }}>
                <div style={{ background: 'var(--color-bg-alt)', padding: 12, borderRadius: 6 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-light)' }}>BUSINESS TYPE</div>
                  <div style={{ fontWeight: 700 }}>{selectedImporter.businessType || 'N/A'}</div>
                </div>
                <div style={{ background: 'var(--color-bg-alt)', padding: 12, borderRadius: 6 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-light)' }}>INDUSTRY</div>
                  <div style={{ fontWeight: 700 }}>{selectedImporter.industry || 'N/A'}</div>
                </div>
                <div style={{ background: 'var(--color-bg-alt)', padding: 12, borderRadius: 6 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-light)' }}>ESTIMATED VOLUME</div>
                  <div style={{ fontWeight: 700 }}>{selectedImporter.estimatedRequirement || '2,000 kg / order'}</div>
                </div>
                <div style={{ background: 'var(--color-bg-alt)', padding: 12, borderRadius: 6 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-light)' }}>TARGET PRICE</div>
                  <div style={{ fontWeight: 700 }}>{selectedImporter.targetPrice || 'Market Rate'}</div>
                </div>
                <div style={{ background: 'var(--color-bg-alt)', padding: 12, borderRadius: 6 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-light)' }}>PREFERRED INCOTERM</div>
                  <div style={{ fontWeight: 700 }}>{selectedImporter.preferredIncoterm || 'CIF'}</div>
                </div>
                <div style={{ background: 'var(--color-bg-alt)', padding: 12, borderRadius: 6 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-light)' }}>DESTINATION PORT</div>
                  <div style={{ fontWeight: 700 }}>{selectedImporter.destinationPort || 'Regional Port'}</div>
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: 8 }}>Contact Person &amp; Communication</h4>
                <div style={{ fontSize: '0.85rem', lineHeight: 1.8, color: 'var(--color-text)' }}>
                  <div><strong>Name:</strong> {selectedImporter.contactPerson || 'Procurement Desk'} ({selectedImporter.designation || selectedImporter.jobTitle || 'Manager'})</div>
                  <div>
                    <strong>Email:</strong>{' '}
                    {selectedImporter.email && selectedImporter.email !== 'Not Available' ? (
                      <a href={`mailto:${selectedImporter.email}`} style={{ color: 'var(--color-primary)' }}>{selectedImporter.email}</a>
                    ) : (
                      <span style={{ color: 'var(--color-text-light)' }}>Not Available</span>
                    )}
                  </div>
                  <div>
                    <strong>Phone:</strong>{' '}
                    {selectedImporter.phone && selectedImporter.phone !== 'Not Available' ? (
                      <span>{selectedImporter.phone}</span>
                    ) : (
                      <span style={{ color: 'var(--color-text-light)' }}>Not Available</span>
                    )}
                  </div>
                  <div>
                    <strong>Website:</strong>{' '}
                    {selectedImporter.website && selectedImporter.website !== 'Not Available' && selectedImporter.website !== 'N/A' ? (
                      <a href={selectedImporter.website.startsWith('http') ? selectedImporter.website : `https://${selectedImporter.website}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)' }}>
                        {selectedImporter.website}
                      </a>
                    ) : (
                      <span style={{ color: 'var(--color-text-light)' }}>Not Available</span>
                    )}
                  </div>
                  <div>
                    <strong>Source Provenance:</strong> {selectedImporter.source || 'B2B Database'} ({selectedImporter.sourceFile || 'N/A'} - {selectedImporter.sourceSheet || 'N/A'})
                  </div>
                </div>
              </div>

              {selectedImporter.notes && (
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: 14, borderRadius: 6, fontSize: '0.85rem', color: '#92400e', marginBottom: 24 }}>
                  <strong>Operational Notes:</strong> {selectedImporter.notes}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => { setEditFormData(selectedImporter); setIsEditModalOpen(true); }}
                  className="btn"
                  style={{ background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)' }}
                >
                  Edit Profile
                </button>
                <button
                  onClick={() => handleCreateQuotation(selectedImporter)}
                  className="btn btn-primary"
                  style={{ background: 'var(--color-accent)' }}
                >
                  Generate Proforma Quote
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL 2: ADD NEW IMPORTER ───────────────────────────── */}
        {isAddModalOpen && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: 20
          }}>
            <div className="card" style={{ maxWidth: 600, width: '100%', maxHeight: '90vh', overflowY: 'auto', background: 'white', padding: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0 }}>Add New International Importer</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="btn" style={{ padding: 6 }}><X size={18} /></button>
              </div>

              <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="label">Company Name *</label>
                    <input className="input" required value={newFormData.companyName} onChange={e => setNewFormData({ ...newFormData, companyName: e.target.value, name: e.target.value })} placeholder="Company Name" />
                  </div>
                  <div>
                    <label className="label">Country *</label>
                    <input className="input" required value={newFormData.country} onChange={e => setNewFormData({ ...newFormData, country: e.target.value })} placeholder="e.g. USA, Germany, Japan" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="label">Contact Person</label>
                    <input className="input" value={newFormData.contactPerson} onChange={e => setNewFormData({ ...newFormData, contactPerson: e.target.value })} placeholder="Full Name" />
                  </div>
                  <div>
                    <label className="label">Email *</label>
                    <input type="email" required className="input" value={newFormData.email} onChange={e => setNewFormData({ ...newFormData, email: e.target.value })} placeholder="procurement@company.com" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="label">Phone / WhatsApp</label>
                    <input className="input" value={newFormData.phone} onChange={e => setNewFormData({ ...newFormData, phone: e.target.value, whatsapp: e.target.value })} placeholder="+1 234 567 8900" />
                  </div>
                  <div>
                    <label className="label">Products of Interest</label>
                    <input className="input" value={newFormData.products} onChange={e => setNewFormData({ ...newFormData, products: e.target.value })} placeholder="Moringa Powder, Red Onion Powder" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="label">Priority</label>
                    <select className="input" value={newFormData.priority} onChange={e => setNewFormData({ ...newFormData, priority: e.target.value })}>
                      <option value="HIGH">HIGH</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="LOW">LOW</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Status</label>
                    <select className="input" value={newFormData.outreachStatus} onChange={e => setNewFormData({ ...newFormData, outreachStatus: e.target.value })}>
                      {STATUSES.filter(s => s !== 'All').map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Verification</label>
                    <select className="input" value={newFormData.verificationStatus} onChange={e => setNewFormData({ ...newFormData, verificationStatus: e.target.value })}>
                      <option value="VERIFIED">VERIFIED</option>
                      <option value="PARTIALLY VERIFIED">PARTIALLY VERIFIED</option>
                      <option value="UNVERIFIED">UNVERIFIED</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">Buyer Notes &amp; Specifications</label>
                  <textarea className="input" rows={2} value={newFormData.notes} onChange={e => setNewFormData({ ...newFormData, notes: e.target.value })} placeholder="Mesh size, packaging preference, target price..." />
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn" style={{ background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)' }}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save to Directory</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── MODAL 3: EDIT IMPORTER ─────────────────────────────── */}
        {isEditModalOpen && editFormData && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: 20
          }}>
            <div className="card" style={{ maxWidth: 600, width: '100%', maxHeight: '90vh', overflowY: 'auto', background: 'white', padding: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0 }}>Edit Importer Record</h3>
                <button onClick={() => setIsEditModalOpen(false)} className="btn" style={{ padding: 6 }}><X size={18} /></button>
              </div>

              <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="label">Company Name</label>
                    <input className="input" required value={editFormData.companyName || editFormData.name} onChange={e => setEditFormData({ ...editFormData, companyName: e.target.value, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Country</label>
                    <input className="input" required value={editFormData.country} onChange={e => setEditFormData({ ...editFormData, country: e.target.value })} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="label">Contact Person</label>
                    <input className="input" value={editFormData.contactPerson || ''} onChange={e => setEditFormData({ ...editFormData, contactPerson: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Email</label>
                    <input type="email" className="input" value={editFormData.email || ''} onChange={e => setEditFormData({ ...editFormData, email: e.target.value })} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="label">Priority</label>
                    <select className="input" value={editFormData.priority} onChange={e => setEditFormData({ ...editFormData, priority: e.target.value })}>
                      <option value="HIGH">HIGH</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="LOW">LOW</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Status</label>
                    <select className="input" value={editFormData.outreachStatus} onChange={e => setEditFormData({ ...editFormData, outreachStatus: e.target.value })}>
                      {STATUSES.filter(s => s !== 'All').map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">Notes</label>
                  <textarea className="input" rows={3} value={editFormData.notes || ''} onChange={e => setEditFormData({ ...editFormData, notes: e.target.value })} />
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn" style={{ background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)' }}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Update Record</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </PasswordGate>
  )
}
