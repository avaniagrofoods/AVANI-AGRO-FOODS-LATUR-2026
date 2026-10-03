import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import SEO from '../components/SEO'
import PasswordGate from '../components/PasswordGate'
import PrivateNav from '../components/PrivateNav'
import {
  Users, Building2, FileText, Plus, ArrowRight,
  TrendingUp, ShieldCheck, CheckCircle2, AlertCircle,
  Clock, Download, RefreshCw, Search, Phone, Mail, Globe,
  ExternalLink, FileSpreadsheet, Eye, X, Check
} from 'lucide-react'
import { BUSINESS_INFO, WHATSAPP_NUMBER } from '../data/links'
import { matchProductMaster, parseQuantityKg, parseUnitRate } from '../data/productMaster'
import {
  evaluateLeadQualification,
  CANONICAL_QUALIFICATION_STATUS,
  CANONICAL_PRIORITY,
  CANONICAL_BUYER_TYPES
} from '../data/qualificationModel'
import {
  validateLeadForQuotation,
  createQuotationFromLead,
  CANONICAL_QUOTATION_STATUSES
} from '../data/quotationModel'
import { getVerificationDashboardMetrics } from '../data/importerVerificationModel'

export default function PrivateDashboard() {
  const navigate = useNavigate()
  const [importers, setImporters] = useState([])
  const [manufacturers, setManufacturers] = useState({ small: [], medium: [], large: [], all: [] })
  const [quotations, setQuotations] = useState([])
  const [quotFilterStatus, setQuotFilterStatus] = useState('ALL')
  const [quotSortBy, setQuotSortBy] = useState('NEWEST')
  const [leads, setLeads] = useState([])
  const [selectedLead, setSelectedLead] = useState(null)
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [sortBy, setSortBy] = useState('NEWEST')
  const [adminNote, setAdminNote] = useState('')
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

      const savedQuotes = JSON.parse(localStorage.getItem('avani_quotations') || '[]')
      const localEnquiries = JSON.parse(localStorage.getItem('avani_enquiries') || '[]')
      const enquiryQuotes = localEnquiries.map((e, idx) => {
        const matchedQuote = savedQuotes.find(q => (q.quotationId === e.quoteId || q.quoteId === e.quoteId) || (e.inquiryId && (q.inquiryId === e.inquiryId || q.leadId === e.inquiryId)))
        if (matchedQuote) return matchedQuote

        const pm = matchProductMaster(e.product || '')
        const qty = parseQuantityKg(e.quantityNormalizedKg || e.quantity, e.message || '')
        const isIndia = (e.currency === 'INR' || e.country?.toLowerCase().includes('india'))
        const fallbackRate = isIndia ? pm.defaultRateInr : pm.defaultRateUsd
        const rate = parseUnitRate(e.requestedPrice || e.targetPrice || e.rate, fallbackRate)
        const subtotal = Number((qty * rate).toFixed(2))

        return {
          quotationId: e.quoteId || `AAF-Q-2026-${1001 + idx}`,
          leadId: e.inquiryId || `AAF-L-2026-${1001 + idx}`,
          customerName: e.fullName || e.name || 'Direct Buyer',
          companyName: e.companyName || e.company || 'B2B Importer',
          country: e.country || (isIndia ? 'INDIA' : 'International'),
          product: pm.productName,
          quantity: qty,
          currency: isIndia ? 'INR' : (e.currency || 'USD'),
          incoterm: e.incoterm || 'FOB NHAVA SHEVA (JNPT MUMBAI)',
          grandTotal: subtotal,
          status: e.status || 'DRAFT',
          date: e.date ? e.date.split(',')[0] : new Date().toISOString().split('T')[0]
        }
      })

      const merged = [...savedQuotes, ...enquiryQuotes, ...serverQuotes]
      const unique = Array.from(new Map(merged.map(q => [q.quotationId || q.quoteId, q])).values())

      // Normalize all quotation records into uniform canonical display format
      const normalizedQuotes = unique.map(q => {
        const qId = q.quotationId || q.quoteId
        const lId = q.leadId || q.inquiryId || q.source?.leadId || 'N/A'
        const bName = q.buyer?.name || q.buyerName || q.customerName || 'Direct Buyer'
        const comp = q.buyer?.company || q.companyName || 'B2B Importer'
        const ctry = q.buyer?.country || q.country || 'India'
        const prod = q.commercialRequirement?.product || q.product || q.items?.[0]?.name || 'Moringa Leaf Powder'
        const qty = q.commercialRequirement?.quantity || q.quantityKg || q.quantity || q.items?.[0]?.quantity || 0
        const curr = q.quotation?.currency || q.currency || 'INR'
        const total = Number(q.quotation?.grandTotal !== undefined ? q.quotation.grandTotal : (q.grandTotal || 0))
        const stat = q.status || 'DRAFT'
        const procCheck = q.processorVerification?.status || 'PENDING'
        const rev = q.revision?.revisionNumber !== undefined ? q.revision.revisionNumber : 0
        const created = q.createdAt || q.date || new Date().toISOString()
        const next = q.workflow?.nextAction || (stat === 'READY_FOR_BUYER' ? 'Ready to send to buyer' : 'Review requirement with Indian processors')
        return {
          ...q,
          quotationId: qId,
          quoteId: qId,
          leadId: lId,
          buyerName: bName,
          customerName: bName,
          companyName: comp,
          country: ctry,
          product: prod,
          quantity: qty,
          currency: curr,
          grandTotal: total,
          status: stat,
          processorCheckStatus: procCheck,
          revisionNumber: rev,
          createdAt: created,
          nextAction: next
        }
      })
      setQuotations(normalizedQuotes)

      // 4. Load Canonical B2B Leads (P4.1)
      const savedLeads = JSON.parse(localStorage.getItem('avani_leads') || '[]')
      const synthesizedLeads = localEnquiries.map((e, idx) => ({
        leadId: e.inquiryId && e.inquiryId.startsWith('AAF-L') ? e.inquiryId : `AAF-L-2026-${2001 + idx}`,
        createdAt: e.date || new Date().toISOString(),
        buyer: {
          name: e.fullName || e.name || 'Direct Buyer',
          company: e.companyName || e.company || 'B2B Importer',
          country: e.country || 'India',
          email: e.email || 'N/A',
          phone: e.phone || 'N/A'
        },
        inquiry: {
          product: e.product || 'Moringa Leaf Powder',
          hsCode: matchProductMaster(e.product || '').hsCode,
          quantity: parseQuantityKg(e.quantityNormalizedKg || e.quantity),
          quantityUnit: 'KG',
          destination: e.destinationPort || e.country || 'Nhava Sheva (JNPT Mumbai)',
          incoterm: e.incoterm || 'FOB Nhava Sheva (JNPT Mumbai)',
          mesh: e.meshSize || '80–100 Mesh',
          moisture: e.moisture || 'Max 7–8%',
          packaging: e.packaging || '25 kg Bags',
          timeline: e.deliveryTimeline || '60–75 Days',
          additionalRequirements: e.message || ''
        },
        qualification: { status: 'NEW', buyerType: e.businessType || 'Importer' },
        workflow: { status: 'NEW', nextAction: 'Review requirement & coordinate with Indian processors', owner: 'Sachin Shinde' }
      }))
      const allLeads = Array.from(new Map([...savedLeads, ...synthesizedLeads].map(l => [l.leadId, l])).values())
      setLeads(allLeads)

    } catch (err) {
      console.error('Error loading dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    const handleUpdate = () => loadData()
    window.addEventListener('lead-updated', handleUpdate)
    window.addEventListener('enquiry-updated', handleUpdate)
    return () => {
      window.removeEventListener('lead-updated', handleUpdate)
      window.removeEventListener('enquiry-updated', handleUpdate)
    }
  }, [])

  const handleUpdateLeadStatus = (leadId, newStatus, note = '') => {
    const savedLeads = JSON.parse(localStorage.getItem('avani_leads') || '[]')
    const now = new Date().toISOString()
    let found = false
    const updated = savedLeads.map(l => {
      if (l.leadId !== leadId) return l
      found = true
      const prevStatus = l.qualification?.status || l.workflow?.status || 'NEW'
      return {
        ...l,
        updatedAt: now,
        qualification: {
          ...(l.qualification || {}),
          status: newStatus
        },
        workflow: {
          ...(l.workflow || {}),
          status: newStatus
        },
        activity: [
          ...(l.activity || []),
          {
            type: 'QUALIFICATION_UPDATED',
            timestamp: now,
            actor: 'ADMIN',
            fromStatus: prevStatus,
            toStatus: newStatus,
            note: note || undefined
          }
        ],
        notes: note ? [...(l.notes || []), { text: note, date: now, author: 'Sachin Shinde' }] : (l.notes || [])
      }
    })

    if (!found && selectedLead && selectedLead.leadId === leadId) {
      const updatedLead = {
        ...selectedLead,
        updatedAt: now,
        qualification: { ...(selectedLead.qualification || {}), status: newStatus },
        workflow: { ...(selectedLead.workflow || {}), status: newStatus },
        activity: [
          ...(selectedLead.activity || []),
          { type: 'QUALIFICATION_UPDATED', timestamp: now, actor: 'ADMIN', fromStatus: selectedLead.workflow?.status || 'NEW', toStatus: newStatus, note: note || undefined }
        ],
        notes: note ? [...(selectedLead.notes || []), { text: note, date: now, author: 'Sachin Shinde' }] : (selectedLead.notes || [])
      }
      updated.push(updatedLead)
    }

    localStorage.setItem('avani_leads', JSON.stringify(updated))
    window.dispatchEvent(new Event('lead-updated'))
    loadData()
    if (selectedLead && selectedLead.leadId === leadId) {
      const refreshed = updated.find(l => l.leadId === leadId)
      if (refreshed) setSelectedLead(refreshed)
    }
    setAdminNote('')
  }

  // P4.3 Create Draft Quotation from Qualified Lead
  const handleCreateDraftQuotation = (lead) => {
    try {
      const validation = validateLeadForQuotation(lead)
      if (!validation.eligible) {
        alert('Quotation cannot be prepared yet. Missing: ' + validation.errors.join('; '))
        return
      }

      const quote = createQuotationFromLead(lead)
      const existingQuotes = JSON.parse(localStorage.getItem('avani_quotations') || '[]')
      const updatedQuotes = [quote, ...existingQuotes.filter(q => (q.quotationId || q.quoteId) !== quote.quotationId)]
      localStorage.setItem('avani_quotations', JSON.stringify(updatedQuotes))

      // Update lead with latest quotation linkage
      const savedLeads = JSON.parse(localStorage.getItem('avani_leads') || '[]')
      let found = false
      const updatedLeads = savedLeads.map(l => {
        if (l.leadId !== lead.leadId) return l
        found = true
        return {
          ...l,
          latestQuotationId: quote.quotationId,
          latestQuotationStatus: quote.status,
          quotationCount: (l.quotationCount || 0) + 1,
          activity: [
            ...(l.activity || []),
            {
              type: 'LEAD_TO_QUOTATION',
              timestamp: new Date().toISOString(),
              actor: 'Sachin Shinde',
              quotationId: quote.quotationId,
              details: `Draft Quotation ${quote.quotationId} created from Qualified Lead`
            }
          ]
        }
      })
      if (!found) {
        updatedLeads.push({
          ...lead,
          latestQuotationId: quote.quotationId,
          latestQuotationStatus: quote.status,
          quotationCount: 1,
          activity: [
            ...(lead.activity || []),
            {
              type: 'LEAD_TO_QUOTATION',
              timestamp: new Date().toISOString(),
              actor: 'Sachin Shinde',
              quotationId: quote.quotationId,
              details: `Draft Quotation ${quote.quotationId} created from Qualified Lead`
            }
          ]
        })
      }
      localStorage.setItem('avani_leads', JSON.stringify(updatedLeads))

      window.dispatchEvent(new Event('lead-updated'))
      window.dispatchEvent(new Event('quotation-updated'))

      navigate(`/private/quotations?tab=builder&quotationId=${encodeURIComponent(quote.quotationId)}&leadId=${encodeURIComponent(lead.leadId)}`)
    } catch (err) {
      alert('Error creating draft quotation: ' + err.message)
    }
  }

  // P4.2 Lead Qualification Evaluation & Pipeline Filtering
  const evaluatedLeads = leads.map(l => {
    const qual = evaluateLeadQualification(l)
    const leadQuotes = quotations.filter(q => q.leadId === l.leadId)
    const latestQuote = leadQuotes.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0]
    return {
      ...l,
      qual,
      quotationCount: leadQuotes.length,
      latestQuotationId: latestQuote?.quotationId || l.latestQuotationId || null,
      latestQuotationStatus: latestQuote?.status || l.latestQuotationStatus || null
    }
  })

  // P4.3 Quotation Pipeline Filtering & Sorting
  const filteredQuotations = quotations.filter(q => {
    if (quotFilterStatus === 'ALL') return true
    return (q.status || '').toUpperCase() === quotFilterStatus.toUpperCase()
  })

  const sortedQuotations = [...filteredQuotations].sort((a, b) => {
    if (quotSortBy === 'NEWEST') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    if (quotSortBy === 'OLDEST') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
    if (quotSortBy === 'VALUE') return Number(b.grandTotal || 0) - Number(a.grandTotal || 0)
    if (quotSortBy === 'QUANTITY') return Number(b.quantity || 0) - Number(a.quantity || 0)
    if (quotSortBy === 'STATUS') return String(a.status || '').localeCompare(String(b.status || ''))
    return 0
  })

  const filteredLeads = evaluatedLeads.filter(l => {
    if (filterStatus === 'ALL') return true
    return l.qual.qualificationStatus === filterStatus || (l.qualification?.status === filterStatus) || (l.workflow?.status === filterStatus)
  })

  const sortedLeads = [...filteredLeads].sort((a, b) => {
    if (sortBy === 'NEWEST') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    if (sortBy === 'OLDEST') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
    if (sortBy === 'PRIORITY') {
      const pMap = { HIGH: 3, MEDIUM: 2, LOW: 1 }
      return (pMap[b.qual.priority] || 0) - (pMap[a.qual.priority] || 0)
    }
    if (sortBy === 'SCORE') return b.qual.qualificationScore - a.qual.qualificationScore
    if (sortBy === 'QUANTITY') {
      const qA = Number(a.inquiry?.quantity || 0)
      const qB = Number(b.inquiry?.quantity || 0)
      return qB - qA
    }
    return 0
  })

  // Qualification summary counts
  const totalQualifiedCount = evaluatedLeads.filter(l => l.qual.qualificationStatus === 'QUALIFIED').length
  const totalNeedsInfoCount = evaluatedLeads.filter(l => l.qual.qualificationStatus === 'NEEDS_INFORMATION').length
  const totalProcessorCheckCount = evaluatedLeads.filter(l => l.qual.qualificationStatus === 'PROCESSOR_CHECK').length
  const totalHighPriorityCount = evaluatedLeads.filter(l => l.qual.priority === 'HIGH').length

  // Derived real metrics for dashboard modules and metrics grid
  const totalImporters = importers.length
  const verifiedImporters = importers.filter(i => i.verificationStatus === 'VERIFIED').length
  const highPriorityImporters = importers.filter(i => i.priority === 'HIGH').length

  const totalManufacturers = manufacturers?.all?.length || 0
  const maharashtraMfrs = (manufacturers?.all || []).filter(m => m.location?.includes('Maharashtra')).length
  const verifiedMfrs = (manufacturers?.all || []).filter(m => m.verificationStatus === 'VERIFIED').length

  const totalQuotes = quotations.length
  const openQuotes = quotations.filter(q => q.status === 'NEW' || q.status === 'REVIEW_REQUIRED' || q.status === 'DRAFT' || q.status === 'SENT').length

  // Phase 2: B2B Buyer Verification & Outreach Readiness Deterministic Metrics
  const verMetrics = useMemo(() => {
    return getVerificationDashboardMetrics(importers)
  }, [importers])

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

          {/* Phase 2: B2B Buyer Verification & Outreach Readiness Metrics Grid */}
          <div className="card" style={{ padding: '24px 28px', background: 'white', marginBottom: 36, border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20, borderBottom: '1px solid var(--color-border)', paddingBottom: 14 }}>
              <div>
                <span className="badge" style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', marginBottom: 6 }}>
                  🛡️ Phase 2 Hardened Verification Layer
                </span>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0, color: 'var(--color-text)' }}>
                  B2B Buyer Verification &amp; Outreach Readiness
                </h2>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>
                  Target Countries: <strong>{verMetrics.requiredCountriesCoverage}</strong>
                </span>
                <Link to="/private/importers?tab=ready" className="btn" style={{ fontSize: '0.78rem', padding: '6px 14px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }}>
                  Outreach Ready ({verMetrics.outreachReady})
                </Link>
                <Link to="/private/importers?tab=queue" className="btn" style={{ fontSize: '0.78rem', padding: '6px 14px', background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }}>
                  Verification Queue ({verMetrics.verificationQueueCount})
                </Link>
              </div>
            </div>

            {/* Explicit Outreach Readiness Policy Banner */}
            <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 20, fontSize: '0.82rem', color: '#334155', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '1.1rem' }}>ℹ️</span>
              <div>
                <strong>Operational Policy:</strong> OUTREACH_READY means the record has passed all configured verification and eligibility rules. Format validation alone does not qualify a contact. Real-world SMTP deliverability and dial tests are pending for Phase 2.3.
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14 }}>
              <div style={{ background: 'var(--color-bg-alt)', padding: '14px', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-light)', textTransform: 'uppercase' }}>Total Records</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--color-text)', marginTop: 4 }}>{verMetrics.totalRecords}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-light)' }}>642 Baseline</div>
              </div>

              <div style={{ background: 'var(--color-bg-alt)', padding: '14px', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-light)', textTransform: 'uppercase' }}>Required Countries</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#16a34a', marginTop: 4 }}>{verMetrics.requiredCountriesCoverage}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-light)' }}>{verMetrics.distinctCountriesCount} Total Countries</div>
              </div>

              <div style={{ background: 'var(--color-bg-alt)', padding: '14px', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-light)', textTransform: 'uppercase' }}>Company Verified</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#166534', marginTop: 4 }}>{verMetrics.companyVerified}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-light)' }}>Official Registry Evidence</div>
              </div>

              <div style={{ background: 'var(--color-bg-alt)', padding: '14px', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-light)', textTransform: 'uppercase' }}>Domain Associated</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0284c7', marginTop: 4 }}>{verMetrics.domainAssociated}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-light)' }}>Web Entity Associated</div>
              </div>

              <div style={{ background: 'var(--color-bg-alt)', padding: '14px', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-light)', textTransform: 'uppercase' }}>Company Unverified</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#d97706', marginTop: 4 }}>{verMetrics.companyUnverified}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-light)' }}>In Verification Queue</div>
              </div>

              <div style={{ background: 'var(--color-bg-alt)', padding: '14px', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-light)', textTransform: 'uppercase' }}>Business Fit Relevant</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#86198f', marginTop: 4 }}>{verMetrics.businessFitRelevant}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-light)' }}>Specific Moringa/Onion</div>
              </div>

              <div style={{ background: 'var(--color-bg-alt)', padding: '14px', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-light)', textTransform: 'uppercase' }}>Website URL Valid</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#2563eb', marginTop: 4 }}>{verMetrics.websiteUrlValid}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-light)' }}>Syntactically Valid URLs</div>
              </div>

              <div style={{ background: 'var(--color-bg-alt)', padding: '14px', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-light)', textTransform: 'uppercase' }}>Email Format Valid</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0891b2', marginTop: 4 }}>{verMetrics.emailFormatValid}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-light)' }}>Deliverability Untested</div>
              </div>

              <div style={{ background: 'var(--color-bg-alt)', padding: '14px', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-light)', textTransform: 'uppercase' }}>Phone Format Valid</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#059669', marginTop: 4 }}>{verMetrics.phoneFormatValid}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-light)' }}>Dialing Untested</div>
              </div>

              <div style={{ background: 'var(--color-bg-alt)', padding: '14px', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-light)', textTransform: 'uppercase' }}>Named DM Identified</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#4f46e5', marginTop: 4 }}>{verMetrics.decisionMakerIdentified}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-light)' }}>{verMetrics.decisionMakerGenericDept} Dept Desks</div>
              </div>

              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: 8, border: '1px solid #cbd5e1' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Outreach Ready</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#475569', marginTop: 4 }}>{verMetrics.outreachReady}</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Operational Gate Enforced</div>
              </div>

              <div style={{ background: '#fffbeb', padding: '14px', borderRadius: 8, border: '1px solid #fde68a' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#b45309', textTransform: 'uppercase' }}>Outreach Pending</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#b45309', marginTop: 4 }}>{verMetrics.outreachNotReady}</div>
                <div style={{ fontSize: '0.72rem', color: '#92400e' }}>In Verification Pipeline</div>
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

          {/* P4.2 Canonical B2B Leads & Qualification Pipeline */}
          <div className="card" style={{ padding: '32px', background: 'white', marginBottom: 36, borderTop: '4px solid var(--color-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--color-text)' }}>
                    B2B Lead Qualification &amp; Processor Matching Pipeline
                  </h3>
                  <span className="badge" style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', fontSize: '0.75rem' }}>
                    {evaluatedLeads.length} Total Leads
                  </span>
                  <span className="badge" style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', fontSize: '0.75rem' }}>
                    {totalQualifiedCount} Qualified
                  </span>
                  <span className="badge" style={{ background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', fontSize: '0.75rem' }}>
                    {totalProcessorCheckCount} Processor Check
                  </span>
                  <span className="badge" style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', fontSize: '0.75rem' }}>
                    {totalNeedsInfoCount} Needs Info
                  </span>
                </div>
                <p style={{ fontSize: '0.84rem', color: 'var(--color-text-light)', margin: '6px 0 0' }}>
                  Automated qualification scoring, requirement completeness audit, processor brief generation, and P4.3 quotation handoff.
                </p>
              </div>

              {/* Sorting and Refresh */}
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem' }}>
                  <label htmlFor="lead-sort-select" style={{ color: 'var(--color-text-light)', fontWeight: 600 }}>Sort by:</label>
                  <select
                    id="lead-sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    style={{ padding: '6px 10px', fontSize: '0.8rem', borderRadius: 6, border: '1px solid var(--color-border)', background: 'white' }}
                  >
                    <option value="NEWEST">Newest First</option>
                    <option value="OLDEST">Oldest First</option>
                    <option value="PRIORITY">Priority (High to Low)</option>
                    <option value="SCORE">Qualification Score (High to Low)</option>
                    <option value="QUANTITY">Order Volume (High to Low)</option>
                  </select>
                </div>
                <button onClick={loadData} className="btn" style={{ padding: '6px 12px', fontSize: '0.78rem', gap: 6, background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)' }}>
                  <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
                </button>
              </div>
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--color-border)' }}>
              {[
                { id: 'ALL', label: 'All Leads', count: evaluatedLeads.length },
                { id: 'NEW', label: 'New', count: evaluatedLeads.filter(l => l.qual.qualificationStatus === 'NEW').length },
                { id: 'REVIEWING', label: 'Reviewing', count: evaluatedLeads.filter(l => l.qual.qualificationStatus === 'REVIEWING').length },
                { id: 'NEEDS_INFORMATION', label: 'Needs Information', count: totalNeedsInfoCount },
                { id: 'QUALIFIED', label: 'Qualified', count: totalQualifiedCount },
                { id: 'PROCESSOR_CHECK', label: 'Processor Check', count: totalProcessorCheckCount },
                { id: 'QUOTATION_READY', label: 'Quotation Ready', count: evaluatedLeads.filter(l => l.qual.qualificationStatus === 'QUOTATION_READY').length },
                { id: 'NURTURE', label: 'Nurture', count: evaluatedLeads.filter(l => l.qual.qualificationStatus === 'NURTURE').length },
                { id: 'DISQUALIFIED', label: 'Disqualified', count: evaluatedLeads.filter(l => l.qual.qualificationStatus === 'DISQUALIFIED').length },
                { id: 'LOST', label: 'Lost', count: evaluatedLeads.filter(l => l.qual.qualificationStatus === 'LOST').length }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilterStatus(f.id)}
                  style={{
                    padding: '5px 12px',
                    fontSize: '0.76rem',
                    fontWeight: filterStatus === f.id ? 800 : 500,
                    borderRadius: 20,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    background: filterStatus === f.id ? 'var(--color-primary)' : 'var(--color-bg-alt)',
                    color: filterStatus === f.id ? 'white' : 'var(--color-text)',
                    border: `1px solid ${filterStatus === f.id ? 'var(--color-primary)' : 'var(--color-border)'}`
                  }}
                >
                  {f.label} ({f.count})
                </button>
              ))}
            </div>

            {sortedLeads.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--color-text-light)', fontSize: '0.88rem' }}>
                No leads match the selected filter <strong>"{filterStatus}"</strong>.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--color-bg-alt)', borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                      <th style={{ padding: '10px 12px' }}>Lead ID</th>
                      <th style={{ padding: '10px 12px' }}>Buyer &amp; Company</th>
                      <th style={{ padding: '10px 12px' }}>Country</th>
                      <th style={{ padding: '10px 12px' }}>Product</th>
                      <th style={{ padding: '10px 12px' }}>Quantity</th>
                      <th style={{ padding: '10px 12px' }}>Status</th>
                      <th style={{ padding: '10px 12px' }}>Score &amp; Comp.</th>
                      <th style={{ padding: '10px 12px' }}>Priority</th>
                      <th style={{ padding: '10px 12px' }}>Missing Info</th>
                      <th style={{ padding: '10px 12px' }}>Next Action</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedLeads.map((l) => {
                      const q = l.qual
                      const statusColor =
                        q.qualificationStatus === 'QUALIFIED' ? { bg: '#f0fdf4', text: '#166534', border: '#bbf7d0' } :
                        q.qualificationStatus === 'PROCESSOR_CHECK' ? { bg: '#fffbeb', text: '#92400e', border: '#fde68a' } :
                        q.qualificationStatus === 'QUOTATION_READY' ? { bg: '#f5f3ff', text: '#5b21b6', border: '#ddd6fe' } :
                        q.qualificationStatus === 'NEEDS_INFORMATION' ? { bg: '#fef2f2', text: '#991b1b', border: '#fecaca' } :
                        q.qualificationStatus === 'DISQUALIFIED' ? { bg: '#f3f4f6', text: '#4b5563', border: '#e5e7eb' } :
                        { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' }

                      const priorityColor =
                        q.priority === 'HIGH' ? { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' } :
                        q.priority === 'MEDIUM' ? { bg: '#fffbeb', text: '#b45309', border: '#fde68a' } :
                        { bg: '#f3f4f6', text: '#4b5563', border: '#e5e7eb' }

                      return (
                        <tr key={l.leadId} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: '12px', fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'monospace' }}>
                            <div>{l.leadId}</div>
                            {l.quotationCount > 0 ? (
                              <div style={{ marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <span className="badge" style={{ fontSize: '0.66rem', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '2px 6px' }}>
                                  {l.quotationCount} {l.quotationCount === 1 ? 'Quote' : 'Quotes'}
                                </span>
                                {l.latestQuotationStatus && (
                                  <span style={{ fontSize: '0.66rem', color: '#64748b' }}>({l.latestQuotationStatus})</span>
                                )}
                              </div>
                            ) : (
                              <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: 2 }}>0 Quotes</div>
                            )}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <div style={{ fontWeight: 700 }}>{l.buyer?.name || 'Direct Buyer'}</div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--color-text-light)' }}>{l.buyer?.company || 'Commercial Importer'}</div>
                          </td>
                          <td style={{ padding: '12px' }}>{l.buyer?.country || 'International'}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ fontWeight: 600 }}>{l.inquiry?.product || 'Moringa Powder'}</span>
                            {l.inquiry?.hsCode && (
                              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-light)', fontFamily: 'monospace' }}>HS: {l.inquiry.hsCode}</div>
                            )}
                          </td>
                          <td style={{ padding: '12px', fontWeight: 700 }}>
                            {Number(l.inquiry?.quantity || 0).toLocaleString()} {l.inquiry?.quantityUnit || 'KG'}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span className="badge" style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              background: statusColor.bg,
                              color: statusColor.text,
                              border: `1px solid ${statusColor.border}`,
                              whiteSpace: 'nowrap'
                            }}>
                              {q.qualificationStatus}
                            </span>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontWeight: 800, color: q.qualificationScore >= 70 ? '#166534' : q.qualificationScore >= 45 ? '#b45309' : '#b91c1c' }}>
                                {q.qualificationScore}/100
                              </span>
                              <span style={{ fontSize: '0.72rem', color: 'var(--color-text-light)' }}>({q.completenessScore}%)</span>
                            </div>
                            <div style={{ width: 60, height: 4, background: '#e2e8f0', borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
                              <div style={{
                                width: `${q.qualificationScore}%`,
                                height: '100%',
                                background: q.qualificationScore >= 70 ? '#16a34a' : q.qualificationScore >= 45 ? '#f59e0b' : '#ef4444'
                              }} />
                            </div>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span className="badge" style={{
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              background: priorityColor.bg,
                              color: priorityColor.text,
                              border: `1px solid ${priorityColor.border}`
                            }}>
                              {q.priority}
                            </span>
                          </td>
                          <td style={{ padding: '12px', fontSize: '0.75rem', maxWidth: 140 }}>
                            {q.missingFields && q.missingFields.length > 0 ? (
                              <span style={{ color: '#b91c1c', fontWeight: 600 }}>
                                {q.missingFields.length} missing ({q.missingFields.slice(0, 2).join(', ')}{q.missingFields.length > 2 ? '...' : ''})
                              </span>
                            ) : (
                              <span style={{ color: '#166534', fontWeight: 600 }}>Complete</span>
                            )}
                          </td>
                          <td style={{ padding: '12px', fontSize: '0.76rem', color: 'var(--color-text)', maxWidth: 200 }}>
                            {q.nextAction}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            <button
                              onClick={() => setSelectedLead(l)}
                              className="btn"
                              style={{ padding: '5px 10px', fontSize: '0.74rem', gap: 4, background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)', whiteSpace: 'nowrap' }}
                            >
                              <Eye size={13} /> Inspect &amp; Qualify
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Lead Requirement Inspection Modal (Expanded P4.2 11-Section Inspector) */}
          {selectedLead && (() => {
            const qual = evaluateLeadQualification(selectedLead)
            const proc = qual.processorRequirements || {}
            const buyer = selectedLead.buyer || {}
            const inq = selectedLead.inquiry || {}
            const statusColor =
              qual.qualificationStatus === 'QUALIFIED' ? { bg: '#f0fdf4', text: '#166534', border: '#bbf7d0' } :
              qual.qualificationStatus === 'PROCESSOR_CHECK' ? { bg: '#fffbeb', text: '#92400e', border: '#fde68a' } :
              qual.qualificationStatus === 'QUOTATION_READY' ? { bg: '#f5f3ff', text: '#5b21b6', border: '#ddd6fe' } :
              qual.qualificationStatus === 'NEEDS_INFORMATION' ? { bg: '#fef2f2', text: '#991b1b', border: '#fecaca' } :
              { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' }

            return (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.7)',
                backdropFilter: 'blur(5px)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px'
              }}>
                <div className="card" style={{
                  background: 'white',
                  maxWidth: 920,
                  width: '100%',
                  maxHeight: '92vh',
                  overflowY: 'auto',
                  borderRadius: 12,
                  boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
                  padding: '32px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 24
                }}>
                  {/* Modal Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--color-border)', paddingBottom: 16 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '1.3rem', fontWeight: 900, fontFamily: 'monospace', color: 'var(--color-primary)' }}>
                          {selectedLead.leadId}
                        </span>
                        <span className="badge" style={{
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          background: statusColor.bg,
                          color: statusColor.text,
                          border: `1px solid ${statusColor.border}`
                        }}>
                          {qual.qualificationStatus}
                        </span>
                        <span className="badge" style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          background: qual.priority === 'HIGH' ? '#fef2f2' : qual.priority === 'MEDIUM' ? '#fffbeb' : '#f3f4f6',
                          color: qual.priority === 'HIGH' ? '#b91c1c' : qual.priority === 'MEDIUM' ? '#b45309' : '#4b5563',
                          border: '1px solid currentColor'
                        }}>
                          PRIORITY: {qual.priority}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', marginTop: 4 }}>
                        Source: <strong>{selectedLead.source?.channel || 'Website RFQ'}</strong> | Created: {selectedLead.createdAt} | Updated: {selectedLead.updatedAt || selectedLead.createdAt}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedLead(null)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-light)', padding: 6 }}
                    >
                      <X size={22} />
                    </button>
                  </div>

                  {/* Section 1: Buyer Information & Section 2: Commercial Inquiry */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
                    {/* 1. Buyer Information */}
                    <div style={{ background: 'var(--color-bg-alt)', padding: 18, borderRadius: 8, border: '1px solid var(--color-border)' }}>
                      <h4 style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: 12 }}>
                        1. Buyer &amp; Organization Profile
                      </h4>
                      <div style={{ fontSize: '0.85rem', lineHeight: 1.7 }}>
                        <div><strong>Contact Name:</strong> {buyer.name || 'Not provided'}</div>
                        <div><strong>Company:</strong> {buyer.company || 'Not provided'}</div>
                        <div><strong>Country:</strong> {buyer.country || 'Not provided'}</div>
                        <div><strong>Business Email:</strong> {buyer.email || 'Not provided'}</div>
                        <div><strong>Phone / WhatsApp:</strong> {buyer.phone || buyer.whatsapp || 'Not provided'}</div>
                        <div><strong>Identified Buyer Type:</strong> <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.72rem' }}>{qual.buyerType}</span></div>
                        <div><strong>Decision Maker Known:</strong> {selectedLead.qualification?.decisionMakerKnown ? 'Yes' : 'To be confirmed'}</div>
                      </div>
                    </div>

                    {/* 2. Inquiry Parameters */}
                    <div style={{ background: 'var(--color-bg-alt)', padding: 18, borderRadius: 8, border: '1px solid var(--color-border)' }}>
                      <h4 style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: 12 }}>
                        2. Commercial Inquiry Details
                      </h4>
                      <div style={{ fontSize: '0.85rem', lineHeight: 1.7 }}>
                        <div><strong>Product:</strong> {inq.product || 'Not specified'}</div>
                        <div><strong>Harmonized Code:</strong> <span style={{ fontFamily: 'monospace' }}>{inq.hsCode || proc.hsCode}</span></div>
                        <div><strong>Requested Volume:</strong> {Number(inq.quantity || 0).toLocaleString()} {inq.quantityUnit || 'KG'} ({proc.quantityKg} KG normalized)</div>
                        <div><strong>Destination &amp; Port:</strong> {inq.destinationPort || inq.destination || 'Not specified'}</div>
                        <div><strong>Requested Incoterm:</strong> {inq.incoterm || 'Not specified'}</div>
                        <div><strong>Requested Packaging:</strong> {inq.packaging || 'Standard Bulk Pack'}</div>
                        <div><strong>Target Price:</strong> {inq.targetPrice ? `${inq.targetPrice}` : 'Open to quote'}</div>
                        <div><strong>Delivery Timeline:</strong> {inq.timeline || 'Standard Lead Time'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Qualification & Section 4: Requirement Completeness */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
                    {/* 3. Qualification Assessment */}
                    <div style={{ background: '#f8fafc', padding: 18, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <h4 style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text)', margin: 0 }}>
                          3. Qualification Assessment
                        </h4>
                        <span style={{ fontSize: '1.2rem', fontWeight: 900, color: qual.qualificationScore >= 70 ? '#16a34a' : '#f59e0b' }}>
                          {qual.qualificationScore} / 100
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-light)', marginBottom: 10 }}>
                        Scoring criteria met:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {qual.qualificationReasons && qual.qualificationReasons.map((r, i) => (
                          <span key={i} className="badge" style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', fontSize: '0.72rem' }}>
                            ✓ {r}
                          </span>
                        ))}
                      </div>
                      <div style={{ marginTop: 12, padding: 8, background: '#f1f5f9', borderRadius: 4, fontSize: '0.72rem', color: '#64748b' }}>
                        Notice: This score is an internal operational CRM readiness metric, not a credit assessment or buyer quality claim.
                      </div>
                    </div>

                    {/* 4. Requirement Completeness */}
                    <div style={{ background: '#f8fafc', padding: 18, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <h4 style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text)', margin: 0 }}>
                          4. Requirement Completeness
                        </h4>
                        <span style={{ fontSize: '1.2rem', fontWeight: 900, color: qual.completenessScore >= 80 ? '#16a34a' : '#ef4444' }}>
                          {qual.completenessScore}%
                        </span>
                      </div>
                      <div style={{ width: '100%', height: 6, background: '#e2e8f0', borderRadius: 3, marginBottom: 12, overflow: 'hidden' }}>
                        <div style={{ width: `${qual.completenessScore}%`, height: '100%', background: qual.completenessScore >= 80 ? '#16a34a' : '#f59e0b' }} />
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-light)' }}>
                        Priority drivers:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                        {qual.priorityReasons && qual.priorityReasons.map((pr, i) => (
                          <span key={i} className="badge" style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', fontSize: '0.72rem' }}>
                            • {pr}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Section 5: Product Match */}
                  <div style={{ background: '#fcfbf7', padding: 18, borderRadius: 8, border: '1px solid #f2edd9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                      <h4 style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', color: '#92400e', margin: 0 }}>
                        5. Product Master &amp; Specification Match
                      </h4>
                      <span className="badge" style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        background: qual.productMatch?.specificationMatch === 'MATCH' ? '#f0fdf4' : '#fffbeb',
                        color: qual.productMatch?.specificationMatch === 'MATCH' ? '#166534' : '#b45309',
                        border: '1px solid currentColor'
                      }}>
                        SPECIFICATION: {qual.productMatch?.specificationMatch}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, fontSize: '0.82rem', marginTop: 8 }}>
                      <div><strong>Catalog Product:</strong> {qual.productMatch?.masterProduct?.productName || 'Unmatched'}</div>
                      <div><strong>Buyer Mesh:</strong> {inq.mesh || 'Standard'} (Master: {qual.productMatch?.masterProduct?.meshStandard || '80–100 Mesh'})</div>
                      <div><strong>Buyer Moisture:</strong> {inq.moisture || 'Standard'} (Master: {qual.productMatch?.masterProduct?.moistureStandard || 'Max 7–8%'})</div>
                      <div><strong>Buyer Packaging:</strong> {inq.packaging || 'Standard'} (Master: {qual.productMatch?.masterProduct?.packagingStandard || '25 kg Bags'})</div>
                    </div>
                  </div>

                  {/* Section 6: Processor Requirement Brief & Positioning */}
                  <div style={{ background: '#f0fdf4', padding: 18, borderRadius: 8, border: '1px solid #bbf7d0' }}>
                    <h4 style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', color: '#166534', marginBottom: 8 }}>
                      6. Indian Processor Requirement Brief (Sourcing Coordination)
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: '#15803d', fontStyle: 'italic', margin: '0 0 12px' }}>
                      Positioning: AVANI AGRO FOODS coordinates sourcing, requirement handling, supplier communication and export-process coordination. Manufacturing partner subject to confirmation. Specification and capacity to be confirmed with the manufacturing partner.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, fontSize: '0.83rem', color: 'var(--color-text)' }}>
                      <div><strong>Sourcing Target:</strong> {proc.product} ({proc.quantityDisplay})</div>
                      <div><strong>Normalized Weight:</strong> {proc.quantityKg} KG Net</div>
                      <div><strong>HS Code:</strong> {proc.hsCode}</div>
                      <div><strong>Port / Dispatch:</strong> {proc.destination || 'Nhava Sheva (JNPT Mumbai)'}</div>
                      <div><strong>Sample Requested:</strong> {proc.sampleRequired ? 'YES — Batch sample needed' : 'Not required initially'}</div>
                      <div><strong>Batch COA:</strong> {proc.coaRequired ? 'YES — Mandatory' : 'Standard Processor COA'}</div>
                      <div><strong>Lab Testing:</strong> {proc.testingRequired ? 'YES — Heavy Metals / Microbiological' : 'Standard Quality Parameter'}</div>
                    </div>
                    {proc.additionalRequirements && (
                      <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px dashed #bbf7d0', fontSize: '0.8rem' }}>
                        <strong>Buyer Custom Instructions:</strong> {proc.additionalRequirements}
                      </div>
                    )}
                  </div>

                  {/* Section 7: Missing Information & Section 8: Processor Confirmation Checklist */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
                    {/* 7. Missing Information */}
                    <div style={{ background: '#fef2f2', padding: 18, borderRadius: 8, border: '1px solid #fecaca' }}>
                      <h4 style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', color: '#991b1b', marginBottom: 10 }}>
                        7. Missing Information Checklist
                      </h4>
                      {qual.missingFields && qual.missingFields.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {qual.missingFields.map((f, i) => (
                            <div key={i} style={{ fontSize: '0.8rem', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontWeight: 800 }}>⚠</span> Field missing: <strong>{f}</strong>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.82rem', color: '#166534', fontWeight: 600 }}>
                          ✓ All mandatory commercial parameters are satisfied.
                        </div>
                      )}
                    </div>

                    {/* 8. Processor Confirmation Checklist */}
                    <div style={{ background: '#fffbeb', padding: 18, borderRadius: 8, border: '1px solid #fde68a' }}>
                      <h4 style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', color: '#92400e', marginBottom: 10 }}>
                        8. Processor Confirmation Checklist
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {qual.requirementsToConfirm && qual.requirementsToConfirm.map((req, i) => (
                          <div key={i} style={{ fontSize: '0.8rem', color: '#78350f', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontWeight: 800 }}>☐</span> {req}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Section 9: Operational Next Action */}
                  <div style={{ background: '#eff6ff', padding: 18, borderRadius: 8, border: '1px solid #bfdbfe' }}>
                    <h4 style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', color: '#1e40af', marginBottom: 6 }}>
                      9. Recommended Operational Next Action
                    </h4>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1e3a8a' }}>
                      👉 {qual.nextAction}
                    </div>
                  </div>

                  {/* Section 10: Activity & Audit History */}
                  <div style={{ background: 'var(--color-bg-alt)', padding: 18, borderRadius: 8, border: '1px solid var(--color-border)' }}>
                    <h4 style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text-light)', marginBottom: 10 }}>
                      10. Activity &amp; Audit Trail
                    </h4>
                    {selectedLead.activity && selectedLead.activity.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {selectedLead.activity.map((act, i) => (
                          <div key={i} style={{ fontSize: '0.78rem', color: 'var(--color-text-light)', display: 'flex', justifyContent: 'space-between' }}>
                            <span><strong>{act.type}</strong> ({act.actor || 'SYSTEM'}): {act.fromStatus ? `${act.fromStatus} → ${act.toStatus}` : act.note || 'Recorded'}</span>
                            <span style={{ fontFamily: 'monospace' }}>{act.timestamp ? act.timestamp.split('T')[0] : ''}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>
                        Lead recorded via Website RFQ. No qualification status overrides yet.
                      </div>
                    )}
                  </div>

                  {/* Section 11: Admin Workflow & Status Overrides & P4.3 Handoff */}
                  <div style={{ background: '#f8fafc', padding: 20, borderRadius: 8, border: '1px solid #cbd5e1' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text)', marginBottom: 12 }}>
                      11. Workflow Actions &amp; P4.3 Draft Quotation Handoff
                    </h4>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Change Status:</label>
                        <select
                          defaultValue={selectedLead.workflow?.status || qual.qualificationStatus}
                          id="manual-status-select"
                          style={{ padding: '6px 12px', fontSize: '0.82rem', borderRadius: 6, border: '1px solid var(--color-border)', background: 'white' }}
                        >
                          {CANONICAL_QUALIFICATION_STATUS.map(st => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </div>
                      <input
                        type="text"
                        placeholder="Add internal note for audit trail..."
                        value={adminNote}
                        onChange={(e) => setAdminNote(e.target.value)}
                        style={{ flex: 1, minWidth: 240, padding: '6px 12px', fontSize: '0.82rem', borderRadius: 6, border: '1px solid var(--color-border)' }}
                      />
                      <button
                        onClick={() => {
                          const sel = document.getElementById('manual-status-select')
                          if (sel) handleUpdateLeadStatus(selectedLead.leadId, sel.value, adminNote)
                        }}
                        className="btn"
                        style={{ padding: '6px 14px', fontSize: '0.82rem', background: 'var(--color-primary)', color: 'white' }}
                      >
                        Update Status &amp; Save Note
                      </button>
                    </div>

                    {(() => {
                      const quotValidation = validateLeadForQuotation(selectedLead)
                      return (
                        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
                          {!quotValidation.eligible && (
                            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 16px', marginBottom: 14 }}>
                              <div style={{ fontWeight: 800, color: '#991b1b', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <AlertCircle size={15} /> Quotation cannot be prepared yet. Missing:
                              </div>
                              <ul style={{ margin: '6px 0 0 18px', padding: 0, fontSize: '0.8rem', color: '#b91c1c', lineHeight: 1.5 }}>
                                {quotValidation.errors.map((err, i) => (
                                  <li key={i}>{err}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                            <div style={{ fontSize: '0.8rem', color: quotValidation.eligible ? '#166534' : 'var(--color-text-light)' }}>
                              {quotValidation.eligible
                                ? '✓ Mandatory commercial parameters verified. Ready to create canonical Draft Quotation.'
                                : 'Complete missing details before generating a formal draft quotation.'}
                            </div>
                            <div style={{ display: 'flex', gap: 10 }}>
                              <button
                                onClick={() => handleCreateDraftQuotation(selectedLead)}
                                disabled={!quotValidation.eligible}
                                className="btn btn-primary"
                                style={{
                                  fontSize: '0.84rem',
                                  padding: '8px 18px',
                                  gap: 6,
                                  background: quotValidation.eligible ? 'var(--color-accent)' : '#94a3b8',
                                  cursor: quotValidation.eligible ? 'pointer' : 'not-allowed',
                                  opacity: quotValidation.eligible ? 1 : 0.6
                                }}
                              >
                                <Plus size={14} /> Create Draft Quotation
                              </button>
                              <button
                                onClick={() => setSelectedLead(null)}
                                className="btn"
                                style={{ fontSize: '0.84rem', padding: '8px 16px', background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)' }}
                              >
                                Close Inspector
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })()}
                  </div>

                </div>
              </div>
            )
          })()}

          {/* P4.3 Quotation Pipeline */}
          <div className="card" style={{ padding: '32px', background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--color-text)' }}>
                  Quotation Pipeline (P4.3 Commercial Desk)
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--color-text-light)', margin: '4px 0 0' }}>
                  End-to-end commercial workflow: Draft → Processor Check → Ready for Buyer → Sent → Negotiation → PO Received
                </p>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-text-light)', fontWeight: 600 }}>Sort:</span>
                  <select
                    value={quotSortBy}
                    onChange={(e) => setQuotSortBy(e.target.value)}
                    style={{ padding: '6px 10px', fontSize: '0.8rem', borderRadius: 6, border: '1px solid var(--color-border)', background: 'white' }}
                  >
                    <option value="NEWEST">Newest First</option>
                    <option value="OLDEST">Oldest First</option>
                    <option value="VALUE">Value (High to Low)</option>
                    <option value="QUANTITY">Quantity (High to Low)</option>
                    <option value="STATUS">Status</option>
                  </select>
                </div>
                <button onClick={loadData} className="btn" style={{ padding: '6px 12px', fontSize: '0.78rem', gap: 6, background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)' }}>
                  <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
                </button>
                <Link to="/private/quotations?tab=builder" className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '0.8rem', gap: 6 }}>
                  <Plus size={14} /> New Quotation
                </Link>
              </div>
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--color-border)' }}>
              {[
                { id: 'ALL', label: 'All' },
                { id: 'DRAFT', label: 'Draft' },
                { id: 'PROCESSOR_CHECK', label: 'Awaiting Processor' },
                { id: 'PROCESSOR_CONFIRMED', label: 'Processor Confirmed' },
                { id: 'COMMERCIAL_REVIEW', label: 'Commercial Review' },
                { id: 'READY_FOR_BUYER', label: 'Ready for Buyer' },
                { id: 'SENT_TO_BUYER', label: 'Sent' },
                { id: 'NEGOTIATION', label: 'Negotiation' },
                { id: 'REVISED', label: 'Revised' },
                { id: 'ACCEPTED', label: 'Accepted' },
                { id: 'PO_RECEIVED', label: 'PO Received' },
                { id: 'SEND_FAILED', label: 'Send Failed' },
                { id: 'CANCELLED', label: 'Cancelled' }
              ].map(f => {
                const count = f.id === 'ALL'
                  ? quotations.length
                  : quotations.filter(q => (q.status || '').toUpperCase() === f.id).length
                return (
                  <button
                    key={f.id}
                    onClick={() => setQuotFilterStatus(f.id)}
                    style={{
                      padding: '5px 12px',
                      fontSize: '0.76rem',
                      fontWeight: quotFilterStatus === f.id ? 800 : 500,
                      borderRadius: 20,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      background: quotFilterStatus === f.id ? 'var(--color-primary)' : 'var(--color-bg-alt)',
                      color: quotFilterStatus === f.id ? 'white' : 'var(--color-text)',
                      border: `1px solid ${quotFilterStatus === f.id ? 'var(--color-primary)' : 'var(--color-border)'}`
                    }}
                  >
                    {f.label} ({count})
                  </button>
                )
              })}
            </div>

            {sortedQuotations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--color-text-light)', fontSize: '0.88rem' }}>
                No quotations found matching filter <strong>"{quotFilterStatus}"</strong>.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--color-bg-alt)', borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                      <th style={{ padding: '10px 12px' }}>Quotation ID</th>
                      <th style={{ padding: '10px 12px' }}>Lead ID</th>
                      <th style={{ padding: '10px 12px' }}>Buyer</th>
                      <th style={{ padding: '10px 12px' }}>Company</th>
                      <th style={{ padding: '10px 12px' }}>Product</th>
                      <th style={{ padding: '10px 12px' }}>Quantity</th>
                      <th style={{ padding: '10px 12px' }}>Currency</th>
                      <th style={{ padding: '10px 12px' }}>Grand Total</th>
                      <th style={{ padding: '10px 12px' }}>Status</th>
                      <th style={{ padding: '10px 12px' }}>Processor Check</th>
                      <th style={{ padding: '10px 12px' }}>Revision</th>
                      <th style={{ padding: '10px 12px' }}>Created</th>
                      <th style={{ padding: '10px 12px' }}>Next Action</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedQuotations.map((q) => {
                      const statusColor =
                        q.status === 'ACCEPTED' || q.status === 'PO_RECEIVED' ? { bg: '#f0fdf4', text: '#166534', border: '#bbf7d0' } :
                        q.status === 'READY_FOR_BUYER' ? { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' } :
                        q.status === 'SENT_TO_BUYER' ? { bg: '#f5f3ff', text: '#6d28d9', border: '#ddd6fe' } :
                        q.status === 'NEGOTIATION' ? { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa' } :
                        q.status === 'PROCESSOR_CHECK' ? { bg: '#fffbeb', text: '#92400e', border: '#fde68a' } :
                        q.status === 'CANCELLED' ? { bg: '#fef2f2', text: '#991b1b', border: '#fecaca' } :
                        { bg: '#f3f4f6', text: '#4b5563', border: '#e5e7eb' }

                      const procColor =
                        q.processorCheckStatus === 'CONFIRMED' ? { bg: '#f0fdf4', text: '#166534' } :
                        q.processorCheckStatus === 'PARTIALLY_CONFIRMED' ? { bg: '#eff6ff', text: '#1d4ed8' } :
                        q.processorCheckStatus === 'REQUIRES_REVIEW' ? { bg: '#fef2f2', text: '#991b1b' } :
                        { bg: '#fffbeb', text: '#92400e' }

                      return (
                        <tr key={q.quotationId} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: '10px 12px', fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'monospace' }}>
                            {q.quotationId}
                          </td>
                          <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: 'var(--color-text-light)' }}>
                            {q.leadId}
                          </td>
                          <td style={{ padding: '10px 12px', fontWeight: 600 }}>
                            {q.buyerName}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            {q.companyName}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            {q.product}
                          </td>
                          <td style={{ padding: '10px 12px', fontWeight: 700 }}>
                            {Number(q.quantity || 0).toLocaleString()} KG
                          </td>
                          <td style={{ padding: '10px 12px', fontWeight: 700 }}>
                            {q.currency}
                          </td>
                          <td style={{ padding: '10px 12px', fontWeight: 800 }}>
                            {Number(q.grandTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <span className="badge" style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              background: statusColor.bg,
                              color: statusColor.text,
                              border: `1px solid ${statusColor.border}`,
                              whiteSpace: 'nowrap'
                            }}>
                              {q.status}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <span className="badge" style={{
                              fontSize: '0.66rem',
                              fontWeight: 700,
                              background: procColor.bg,
                              color: procColor.text,
                              whiteSpace: 'nowrap'
                            }}>
                              {q.processorCheckStatus}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--color-text-light)' }}>
                            Rev {q.revisionNumber}
                          </td>
                          <td style={{ padding: '10px 12px', fontSize: '0.76rem', color: 'var(--color-text-light)' }}>
                            {q.createdAt ? q.createdAt.split('T')[0] : 'N/A'}
                          </td>
                          <td style={{ padding: '10px 12px', fontSize: '0.76rem', color: 'var(--color-text)', maxWidth: 220 }}>
                            {q.nextAction}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                            <Link
                              to={`/private/quotations?tab=builder&quotationId=${encodeURIComponent(q.quotationId)}&leadId=${encodeURIComponent(q.leadId !== 'N/A' ? q.leadId : '')}`}
                              className="btn"
                              style={{ padding: '4px 10px', fontSize: '0.74rem', background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)', whiteSpace: 'nowrap' }}
                            >
                              Open Builder
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
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
