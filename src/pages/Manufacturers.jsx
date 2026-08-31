import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import SEO from '../components/SEO'
import PasswordGate from '../components/PasswordGate'
import PrivateNav from '../components/PrivateNav'
import {
  Search, Download, Plus, Edit, Trash2, MapPin,
  Globe, Mail, Phone, ExternalLink, Filter, CheckCircle2,
  Building2, ShieldCheck, Eye, X, RefreshCw, Package, Award
} from 'lucide-react'

const SCALES = [
  { id: 'all', label: 'All Scales' },
  { id: 'small', label: 'Small Scale (20 Units)' },
  { id: 'medium', label: 'Medium Scale (20 Units)' },
  { id: 'large', label: 'Large Scale (20 Units)' },
]

const STATES = [
  'All States',
  'Maharashtra (Priority Hub)',
  'Gujarat',
  'Tamil Nadu',
  'Karnataka',
  'Andhra Pradesh',
  'Kerala',
  'Rajasthan',
  'Madhya Pradesh',
  'Other States'
]

const PRIORITIES = ['All', 'HIGH', 'MEDIUM', 'LOW']
const VERIFICATIONS = ['All', 'VERIFIED', 'PARTIALLY VERIFIED', 'UNVERIFIED']

export default function Manufacturers() {
  const [searchParams] = useSearchParams()
  const [data, setData] = useState({ small: [], medium: [], large: [], all: [] })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Filters & Search
  const [search, setSearch] = useState('')
  const [selectedScale, setSelectedScale] = useState('all')
  const [selectedState, setSelectedState] = useState('All States')
  const [selectedPriority, setSelectedPriority] = useState('All')
  const [selectedVerification, setSelectedVerification] = useState('All')
  const [sortBy, setSortBy] = useState('name')

  // Modals
  const [selectedSupplier, setSelectedSupplier] = useState(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editFormData, setEditFormData] = useState(null)
  const [newFormData, setNewFormData] = useState({
    name: '',
    companyName: '',
    scale: 'small',
    supplierType: 'Processing & Dehydration Plant',
    state: 'Maharashtra',
    city: '',
    location: 'Maharashtra, India',
    products: 'Moringa Powder, Red Onion Powder',
    contactPerson: '',
    designation: 'Managing Partner',
    email: '',
    phone: '',
    whatsapp: '',
    website: '',
    moq: '200 kg',
    capacity: '10 MT / month',
    packaging: '25 kg Poly-Lined Export Drums / Sacks',
    privateLabel: 'Available',
    certifications: 'FSSAI, Partner NABL Testing',
    leadTime: '10-14 days',
    priceBasis: 'FOB Nhava Sheva',
    verificationStatus: 'VERIFIED',
    priority: 'HIGH',
    status: 'ACTIVE',
    notes: ''
  })

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 12

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/manufacturers', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
      })
      if (res.ok) {
        const json = await res.json()
        const manufacturers = json.manufacturers || { small: [], medium: [], large: [] }
        const all = json.all || [...(manufacturers.small || []), ...(manufacturers.medium || []), ...(manufacturers.large || [])]
        setData({
          small: manufacturers.small || [],
          medium: manufacturers.medium || [],
          large: manufacturers.large || [],
          all,
        })
      } else {
        setError('Authentication required to load manufacturer records.')
      }
    } catch (err) {
      setError('Network error while loading data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setIsAddModalOpen(true)
    }
  }, [searchParams])

  // Filter logic
  const currentList = selectedScale === 'all' ? data.all : (data[selectedScale] || [])

  const filtered = currentList.filter(item => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      item.name?.toLowerCase().includes(q) ||
      item.location?.toLowerCase().includes(q) ||
      item.products?.toLowerCase().includes(q) ||
      item.exportCountries?.toLowerCase().includes(q) ||
      item.email?.toLowerCase().includes(q) ||
      item.contactPerson?.toLowerCase().includes(q)

    const matchState = selectedState === 'All States' ||
      (selectedState.includes('Maharashtra') && item.location?.includes('Maharashtra')) ||
      (selectedState === 'Gujarat' && item.location?.includes('Gujarat')) ||
      (selectedState === 'Tamil Nadu' && item.location?.includes('Tamil Nadu')) ||
      (selectedState === 'Karnataka' && item.location?.includes('Karnataka')) ||
      (selectedState === 'Andhra Pradesh' && item.location?.includes('Andhra')) ||
      (selectedState === 'Kerala' && item.location?.includes('Kerala')) ||
      (selectedState === 'Rajasthan' && item.location?.includes('Rajasthan')) ||
      (selectedState === 'Madhya Pradesh' && item.location?.includes('Madhya')) ||
      (selectedState === 'Other States' && !['Maharashtra', 'Gujarat', 'Tamil Nadu', 'Karnataka', 'Andhra', 'Kerala', 'Rajasthan', 'Madhya'].some(s => item.location?.includes(s)))

    const matchPriority = selectedPriority === 'All' || item.priority === selectedPriority
    const matchVerification = selectedVerification === 'All' || item.verificationStatus === selectedVerification

    return matchSearch && matchState && matchPriority && matchVerification
  })

  // Sort logic
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '')
    if (sortBy === 'location') return (a.location || '').localeCompare(b.location || '')
    if (sortBy === 'priority') {
      const pMap = { HIGH: 1, MEDIUM: 2, LOW: 3 }
      return (pMap[a.priority] || 4) - (pMap[b.priority] || 4)
    }
    return 0
  })

  // Pagination
  const totalPages = Math.ceil(sorted.length / pageSize) || 1
  const paginatedList = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // Export CSV
  const handleExportCSV = () => {
    if (!sorted.length) return
    const headers = [
      'ID', 'Company Name', 'Scale', 'Supplier Type', 'Location', 'State', 'Products',
      'Export Countries', 'MOQ', 'Production Capacity', 'Packaging', 'Certifications',
      'Lead Time', 'Price Basis', 'Contact Person', 'Email', 'Phone', 'Website',
      'Verification Status', 'Priority', 'Status', 'Notes'
    ]
    const rows = sorted.map(m => [
      m.id,
      `"${(m.companyName || m.name || '').replace(/"/g, '""')}"`,
      `"${(m.scale || '').replace(/"/g, '""')}"`,
      `"${(m.supplierType || '').replace(/"/g, '""')}"`,
      `"${(m.location || '').replace(/"/g, '""')}"`,
      `"${(m.state || '').replace(/"/g, '""')}"`,
      `"${(m.products || '').replace(/"/g, '""')}"`,
      `"${(m.exportCountries || '').replace(/"/g, '""')}"`,
      `"${(m.moq || '').replace(/"/g, '""')}"`,
      `"${(m.capacity || '').replace(/"/g, '""')}"`,
      `"${(m.packaging || '').replace(/"/g, '""')}"`,
      `"${(m.certifications || '').replace(/"/g, '""')}"`,
      `"${(m.leadTime || '').replace(/"/g, '""')}"`,
      `"${(m.priceBasis || '').replace(/"/g, '""')}"`,
      `"${(m.contactPerson || '').replace(/"/g, '""')}"`,
      `"${(m.email || '').replace(/"/g, '""')}"`,
      `"${(m.phone || m.contact || '').replace(/"/g, '""')}"`,
      `"${(m.website || '').replace(/"/g, '""')}"`,
      `"${(m.verificationStatus || 'VERIFIED')}"`,
      `"${(m.priority || 'MEDIUM')}"`,
      `"${(m.status || 'ACTIVE')}"`,
      `"${(m.notes || '').replace(/"/g, '""')}"`
    ])

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `AVANI_Indian_Manufacturers_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Delete Supplier
  const handleDelete = (id) => {
    if (!window.confirm('Are you sure you want to remove this supplier record from the active directory?')) return
    setData(prev => {
      const updatedAll = prev.all.filter(m => m.id !== id)
      return {
        small: prev.small.filter(m => m.id !== id),
        medium: prev.medium.filter(m => m.id !== id),
        large: prev.large.filter(m => m.id !== id),
        all: updatedAll
      }
    })
    if (selectedSupplier?.id === id) setSelectedSupplier(null)
  }

  // Add Supplier
  const handleAddSubmit = (e) => {
    e.preventDefault()
    const newId = data.all.length ? Math.max(...data.all.map(m => m.id || 0)) + 1 : 1
    const record = {
      ...newFormData,
      id: newId,
      location: `${newFormData.city ? newFormData.city + ', ' : ''}${newFormData.state}`
    }
    setData(prev => ({
      ...prev,
      [record.scale]: [record, ...(prev[record.scale] || [])],
      all: [record, ...prev.all]
    }))
    setIsAddModalOpen(false)
    setSelectedSupplier(record)
  }

  // Edit Supplier
  const handleEditSubmit = (e) => {
    e.preventDefault()
    setData(prev => {
      const updateList = (list) => list.map(m => m.id === editFormData.id ? editFormData : m)
      return {
        small: updateList(prev.small),
        medium: updateList(prev.medium),
        large: updateList(prev.large),
        all: updateList(prev.all)
      }
    })
    setSelectedSupplier(editFormData)
    setIsEditModalOpen(false)
  }

  return (
    <PasswordGate
      title="Indian Manufacturers Database"
      description="Authentication required to view verified Indian processors and supplier specifications."
      onUnlock={fetchData}
    >
      <SEO
        title="Indian Manufacturer Database | AVANI AGRO FOODS"
        description="Private directory of 60 Indian Moringa and Onion Powder manufacturers."
        noindex={true}
      />

      <PrivateNav onLogout={() => window.location.reload()} />

      <div className="page-top" style={{ minHeight: '100vh', background: '#f8faf8', paddingBottom: 80 }}>
        
        {/* Header Banner */}
        <div style={{ background: 'linear-gradient(135deg, #0a1f0d, #1a4d2e)', padding: '40px 0 32px', color: 'white' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div className="section-tag" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', display: 'inline-flex', marginBottom: 10 }}>
                  🏭 Sourcing Network
                </div>
                <h1 style={{ fontSize: 'clamp(1.7rem, 3vw, 2.3rem)', fontWeight: 900, color: 'white', marginBottom: 4 }}>
                  Indian Manufacturer &amp; Processor Database
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.88rem', margin: 0 }}>
                  60 verified Indian processing plants, dehydration units &amp; botanical milling facilities.
                </p>
              </div>

              {/* Header Actions */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="btn btn-primary"
                  style={{ background: 'var(--color-accent)', color: 'white', fontSize: '0.82rem', gap: 6 }}
                >
                  <Plus size={15} /> Add Supplier
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

          {/* Search & Filter Controls */}
          <div className="card" style={{ padding: '20px', background: 'white', marginBottom: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              {/* Row 1: Search & Sort */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ position: 'relative', flex: '1 1 320px', maxWidth: 480 }}>
                  <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-light)' }} />
                  <input
                    className="input"
                    style={{ paddingLeft: 40, height: 42, fontSize: '0.88rem', background: 'var(--color-bg-alt)' }}
                    placeholder="Search plant name, city/state, products, email..."
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
                    <option value="name">Supplier Name (A-Z)</option>
                    <option value="location">Location / State</option>
                    <option value="priority">Priority (High to Low)</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Scale Selector Tabs */}
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
                {SCALES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => { setSelectedScale(s.id); setCurrentPage(1); }}
                    className="btn"
                    style={{
                      padding: '6px 14px',
                      fontSize: '0.78rem',
                      borderRadius: 16,
                      fontWeight: 700,
                      background: selectedScale === s.id ? 'var(--color-primary)' : 'var(--color-bg-alt)',
                      color: selectedScale === s.id ? 'white' : 'var(--color-text)',
                      border: selectedScale === s.id ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Row 3: Secondary Filters */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', borderTop: '1px solid var(--color-border)', paddingTop: 12, fontSize: '0.82rem' }}>
                <div>
                  <span style={{ color: 'var(--color-text-light)', marginRight: 6 }}>State Filter:</span>
                  <select
                    value={selectedState}
                    onChange={e => { setSelectedState(e.target.value); setCurrentPage(1); }}
                    style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid var(--color-border)', background: 'white' }}
                  >
                    {STATES.map(st => <option key={st} value={st}>{st}</option>)}
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
                  Showing <strong>{sorted.length}</strong> of {data.all.length} manufacturing partners
                </div>
              </div>

            </div>
          </div>

          {/* Results Grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <RefreshCw size={32} color="var(--color-primary)" className="animate-spin" style={{ margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--color-text-light)', fontSize: '0.9rem' }}>Loading manufacturer records...</p>
            </div>
          ) : paginatedList.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '60px 24px', background: 'white' }}>
              <p style={{ color: 'var(--color-text-light)', fontSize: '1rem', marginBottom: 16 }}>
                No manufacturers found matching your filter criteria.
              </p>
              <button
                onClick={() => { setSearch(''); setSelectedScale('all'); setSelectedState('All States'); setSelectedPriority('All'); setSelectedVerification('All'); }}
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
                    borderTop: `4px solid ${item.location?.includes('Maharashtra') ? '#16a34a' : '#0284c7'}`
                  }}
                >
                  <div>
                    {/* Top Row: Location & Scale Badges */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={13} /> {item.location}
                      </span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <span className="badge" style={{ fontSize: '0.68rem', background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd', textTransform: 'capitalize' }}>
                          {item.scale || 'Partner'}
                        </span>
                        <span className="badge" style={{ fontSize: '0.68rem', background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}>
                          {item.verificationStatus || 'VERIFIED'}
                        </span>
                      </div>
                    </div>

                    {/* Plant / Unit Name */}
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: 6 }}>
                      {item.companyName || item.name}
                    </h3>

                    {/* Supplier Type */}
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-light)', marginBottom: 12 }}>
                      {item.supplierType || 'Processing & Dehydration Facility'}
                    </div>

                    {/* Products Sourced */}
                    <div style={{ background: 'var(--color-bg-alt)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: 14, fontSize: '0.82rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>
                        Products Sourced:
                      </div>
                      <div style={{ color: 'var(--color-text-light)' }}>
                        {item.products}
                      </div>
                    </div>

                    {/* Specifications & Export Info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.8rem', color: 'var(--color-text)', marginBottom: 16 }}>
                      <div><strong>Export Markets:</strong> {item.exportCountries || 'Global'}</div>
                      {item.contactPerson && (
                        <div><strong>Contact:</strong> {item.contactPerson} ({item.designation || 'Head'})</div>
                      )}
                      {item.email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Mail size={12} color="var(--color-primary)" />
                          <a href={`mailto:${item.email}`} style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>{item.email}</a>
                        </div>
                      )}
                      {item.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Phone size={12} color="var(--color-primary)" />
                          <span>{item.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => setSelectedSupplier(item)}
                        className="btn"
                        style={{ padding: '6px 10px', fontSize: '0.75rem', background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)', gap: 4 }}
                        title="View Full Facility Specifications"
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

                    <a
                      href={`mailto:${item.email}?subject=${encodeURIComponent(`Sourcing Requirement — AVANI AGRO FOODS`)}`}
                      className="btn btn-primary"
                      style={{ padding: '6px 12px', fontSize: '0.78rem', gap: 6 }}
                    >
                      <Mail size={13} /> Contact
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
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

        {/* ── MODAL 1: VIEW MANUFACTURER DETAILS ────────────────── */}
        {selectedSupplier && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: 20
          }}>
            <div className="card" style={{ maxWidth: 640, width: '100%', maxHeight: '90vh', overflowY: 'auto', background: 'white', padding: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                    <span className="badge">{selectedSupplier.verificationStatus || 'VERIFIED'}</span>
                    <span className="badge" style={{ background: '#f0f9ff', color: '#0369a1', textTransform: 'capitalize' }}>{selectedSupplier.scale || 'Partner'} Scale</span>
                  </div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--color-text)', margin: 0 }}>
                    {selectedSupplier.companyName || selectedSupplier.name}
                  </h2>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-light)' }}>
                    {selectedSupplier.location}
                  </div>
                </div>
                <button onClick={() => setSelectedSupplier(null)} className="btn" style={{ padding: 6 }}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: '0.85rem', marginBottom: 24 }}>
                <div style={{ background: 'var(--color-bg-alt)', padding: 12, borderRadius: 6 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-light)' }}>SUPPLIER TYPE</div>
                  <div style={{ fontWeight: 700 }}>{selectedSupplier.supplierType || 'Processing Facility'}</div>
                </div>
                <div style={{ background: 'var(--color-bg-alt)', padding: 12, borderRadius: 6 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-light)' }}>MINIMUM ORDER QTY</div>
                  <div style={{ fontWeight: 700 }}>{selectedSupplier.moq || '100 kg'}</div>
                </div>
                <div style={{ background: 'var(--color-bg-alt)', padding: 12, borderRadius: 6 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-light)' }}>CAPACITY / MONTH</div>
                  <div style={{ fontWeight: 700 }}>{selectedSupplier.capacity || '10 MT / month'}</div>
                </div>
                <div style={{ background: 'var(--color-bg-alt)', padding: 12, borderRadius: 6 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-light)' }}>PACKAGING OPTIONS</div>
                  <div style={{ fontWeight: 700 }}>{selectedSupplier.packaging || '25 kg Drums / Cartons'}</div>
                </div>
                <div style={{ background: 'var(--color-bg-alt)', padding: 12, borderRadius: 6 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-light)' }}>LEAD TIME</div>
                  <div style={{ fontWeight: 700 }}>{selectedSupplier.leadTime || '10-14 days'}</div>
                </div>
                <div style={{ background: 'var(--color-bg-alt)', padding: 12, borderRadius: 6 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-light)' }}>PRICE BASIS</div>
                  <div style={{ fontWeight: 700 }}>{selectedSupplier.priceBasis || 'FOB Nhava Sheva'}</div>
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: 8 }}>Commercial Contact Information</h4>
                <div style={{ fontSize: '0.85rem', lineHeight: 1.8, color: 'var(--color-text)' }}>
                  <div><strong>Contact Person:</strong> {selectedSupplier.contactPerson || 'Commercial Head'} ({selectedSupplier.designation || 'Lead'})</div>
                  <div><strong>Email:</strong> <a href={`mailto:${selectedSupplier.email}`} style={{ color: 'var(--color-primary)' }}>{selectedSupplier.email}</a></div>
                  <div><strong>Phone:</strong> {selectedSupplier.phone || selectedSupplier.contact}</div>
                  {selectedSupplier.website && selectedSupplier.website !== 'N/A' && (
                    <div><strong>Website:</strong> <a href={`https://${selectedSupplier.website.replace('https://', '')}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)' }}>{selectedSupplier.website}</a></div>
                  )}
                </div>
              </div>

              {selectedSupplier.notes && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: 14, borderRadius: 6, fontSize: '0.85rem', color: '#166534', marginBottom: 24 }}>
                  <strong>Technical &amp; Sourcing Notes:</strong> {selectedSupplier.notes}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => { setEditFormData(selectedSupplier); setIsEditModalOpen(true); }}
                  className="btn"
                  style={{ background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)' }}
                >
                  Edit Profile
                </button>
                <a
                  href={`mailto:${selectedSupplier.email}?subject=${encodeURIComponent(`AVANI AGRO FOODS — Sourcing Inquiry`)}`}
                  className="btn btn-primary"
                >
                  Send Commercial RFQ
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL 2: ADD NEW SUPPLIER ───────────────────────────── */}
        {isAddModalOpen && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: 20
          }}>
            <div className="card" style={{ maxWidth: 600, width: '100%', maxHeight: '90vh', overflowY: 'auto', background: 'white', padding: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0 }}>Add New Indian Manufacturer</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="btn" style={{ padding: 6 }}><X size={18} /></button>
              </div>

              <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="label">Plant / Company Name *</label>
                    <input className="input" required value={newFormData.companyName} onChange={e => setNewFormData({ ...newFormData, companyName: e.target.value, name: e.target.value })} placeholder="e.g. Nashik Agro Dehy" />
                  </div>
                  <div>
                    <label className="label">State *</label>
                    <input className="input" required value={newFormData.state} onChange={e => setNewFormData({ ...newFormData, state: e.target.value })} placeholder="e.g. Maharashtra" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="label">Contact Person</label>
                    <input className="input" value={newFormData.contactPerson} onChange={e => setNewFormData({ ...newFormData, contactPerson: e.target.value })} placeholder="Full Name" />
                  </div>
                  <div>
                    <label className="label">Email *</label>
                    <input type="email" required className="input" value={newFormData.email} onChange={e => setNewFormData({ ...newFormData, email: e.target.value })} placeholder="info@plant.com" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="label">Scale</label>
                    <select className="input" value={newFormData.scale} onChange={e => setNewFormData({ ...newFormData, scale: e.target.value })}>
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">MOQ</label>
                    <input className="input" value={newFormData.moq} onChange={e => setNewFormData({ ...newFormData, moq: e.target.value })} placeholder="100 kg" />
                  </div>
                  <div>
                    <label className="label">Monthly Capacity</label>
                    <input className="input" value={newFormData.capacity} onChange={e => setNewFormData({ ...newFormData, capacity: e.target.value })} placeholder="10 MT" />
                  </div>
                </div>

                <div>
                  <label className="label">Products Manufactured</label>
                  <input className="input" value={newFormData.products} onChange={e => setNewFormData({ ...newFormData, products: e.target.value })} placeholder="Moringa Powder, Red Onion Powder" />
                </div>

                <div>
                  <label className="label">Plant &amp; Testing Specifications Notes</label>
                  <textarea className="input" rows={2} value={newFormData.notes} onChange={e => setNewFormData({ ...newFormData, notes: e.target.value })} placeholder="Drying method, mesh sizes, COA availability..." />
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn" style={{ background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)' }}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save to Directory</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── MODAL 3: EDIT SUPPLIER ─────────────────────────────── */}
        {isEditModalOpen && editFormData && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: 20
          }}>
            <div className="card" style={{ maxWidth: 600, width: '100%', maxHeight: '90vh', overflowY: 'auto', background: 'white', padding: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0 }}>Edit Supplier Record</h3>
                <button onClick={() => setIsEditModalOpen(false)} className="btn" style={{ padding: 6 }}><X size={18} /></button>
              </div>

              <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="label">Company Name</label>
                    <input className="input" required value={editFormData.companyName || editFormData.name} onChange={e => setEditFormData({ ...editFormData, companyName: e.target.value, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Location</label>
                    <input className="input" required value={editFormData.location} onChange={e => setEditFormData({ ...editFormData, location: e.target.value })} />
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
                    <label className="label">MOQ</label>
                    <input className="input" value={editFormData.moq || ''} onChange={e => setEditFormData({ ...editFormData, moq: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Capacity</label>
                    <input className="input" value={editFormData.capacity || ''} onChange={e => setEditFormData({ ...editFormData, capacity: e.target.value })} />
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
