import { useState, useEffect } from 'react'
import { Trash2, Mail, User, Building, MapPin, ArrowRight, CheckCircle, Download, FileSpreadsheet, Send, RefreshCw, Eye } from 'lucide-react'
import PasswordGate from '../components/PasswordGate'
import QuotationBuilder from '../components/QuotationBuilder'
import SEO from '../components/SEO'
import { BUSINESS_INFO } from '../data/links'

export default function AdminQuotations() {
  const [quotations, setQuotations] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedQuote, setSelectedQuote] = useState(null)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [activeTab, setActiveTab] = useState('list') // 'list' or 'builder'

  const loadData = () => {
    setLoading(true)
    // 1. Load from localStorage
    const localEnquiries = JSON.parse(localStorage.getItem('avani_enquiries') || '[]')
    
    // Sample initial items if empty
    const defaultData = [
      {
        quoteId: 'AAF-2026-1001',
        leadId: 'LEAD-20260818-4821',
        date: '2026-08-18',
        validUntil: '2026-09-17',
        customerName: 'Sarah Jenkins',
        companyName: 'Nordic Organic Superfoods Oy',
        email: 'sarah@nordicorganic.fi',
        phone: '+358 40 1234567',
        country: 'Finland',
        destination: 'Port of Helsinki',
        product: 'Moringa Leaf Powder (Food Grade / Organic)',
        quantity: 500,
        currency: 'USD',
        incoterm: 'CIF',
        grandTotal: 2632.80,
        status: 'SENT',
        emailStatus: 'DELIVERED',
        whatsAppStatus: 'SENT',
        createdAt: '2026-08-18T10:30:00Z'
      },
      {
        quoteId: 'AAF-2026-1002',
        leadId: 'LEAD-20260818-9182',
        date: '2026-08-18',
        validUntil: '2026-09-17',
        customerName: 'Ahmed Al-Mansoor',
        companyName: 'Gulf Spices & Food Trading LLC',
        email: 'ahmed@gulfspices.ae',
        phone: '+971 50 9876543',
        country: 'United Arab Emirates',
        destination: 'Jebel Ali Port, Dubai',
        product: 'Dehydrated Red Onion Powder (Premium Export Grade)',
        quantity: 1000,
        currency: 'USD',
        incoterm: 'CIF',
        grandTotal: 9904.50,
        status: 'GENERATED',
        emailStatus: 'READY',
        whatsAppStatus: 'NOT_CONFIGURED',
        createdAt: '2026-08-18T14:15:00Z'
      }
    ]

    // Merge any form submissions
    const merged = [...localEnquiries.map((e, idx) => ({
      quoteId: e.quoteId || `AAF-2026-${1003 + idx}`,
      leadId: e.id ? `LEAD-${e.id}` : `LEAD-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      customerName: `${e.firstName || ''} ${e.lastName || ''}`.trim() || e.name || 'Direct Buyer',
      companyName: e.company || 'Direct Buyer',
      email: e.email,
      phone: e.phone || '+91 7219053645',
      country: e.country || 'International',
      destination: e.country || 'Destination Port',
      product: e.inquiryType || e.product || 'Moringa Leaf Powder',
      quantity: e.quantity || 100,
      currency: 'USD',
      incoterm: 'CIF',
      grandTotal: (e.quantity || 100) * 4.82 + 210,
      status: e.status || 'GENERATED',
      emailStatus: 'READY',
      whatsAppStatus: 'NOT_CONFIGURED',
      createdAt: e.timestamp || new Date().toISOString()
    })), ...defaultData]

    // Deduplicate by quoteId
    const unique = Array.from(new Map(merged.map(q => [q.quoteId, q])).values())
    setQuotations(unique)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
    window.addEventListener('storage', loadData)
    return () => window.removeEventListener('storage', loadData)
  }, [])

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
        alert('PDF generation failed.')
      }
    } catch (e) {
      alert('Error downloading PDF: ' + e.message)
    }
  }

  const handleDownloadXlsx = async (quote) => {
    try {
      const res = await fetch('/api/quotation?action=download-xlsx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quote)
      })
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `Quotation_${quote.quoteId}.xlsx`
        document.body.appendChild(a)
        a.click()
        a.remove()
      } else {
        alert('Excel generation failed.')
      }
    } catch (e) {
      alert('Error downloading Excel: ' + e.message)
    }
  }

  const handleSendEmail = async (quote) => {
    if (window.confirm(`Send official quotation ${quote.quoteId} to ${quote.email}?`)) {
      try {
        const res = await fetch('/api/quotation?action=send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(quote)
        })
        const data = await res.json()
        if (data.success) {
          alert(`Success: ${data.message}`)
          setQuotations(prev => prev.map(q => q.quoteId === quote.quoteId ? { ...q, status: 'SENT', emailStatus: 'DELIVERED' } : q))
        }
      } catch (e) {
        alert('Failed to send email: ' + e.message)
      }
    }
  }

  const filteredQuotes = quotations.filter(q => statusFilter === 'ALL' || q.status === statusFilter)

  return (
    <div className="page-top" style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <SEO title="Automated Quotation & Export Management — Admin" noindex={true} />
      <PasswordGate 
        title="Export Quotation Control Center" 
        description="Access restricted to authorized personnel. Manage real-time customer leads, generate encrypted Excel & PDF proforma quotations, and track dispatch status."
      >
        <div className="container" style={{ padding: '60px 24px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--color-primary)', marginBottom: 8 }}>
                Automated Export Quotation Center
              </h1>
              <p style={{ color: 'var(--color-text-light)' }}>
                Active Quotations: <strong>{quotations.length}</strong> | Business: <strong>{BUSINESS_INFO.name}</strong>
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                onClick={loadData}
                className="btn"
                style={{ background: 'white', border: '1px solid #cbd5e1', color: '#334155', display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <RefreshCw size={16} /> Refresh
              </button>
              <button 
                onClick={() => { setSelectedQuote(null); setActiveTab(activeTab === 'list' ? 'builder' : 'list') }}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              >
                {activeTab === 'list' ? '➕ Create Custom Quotation' : '📋 View Quotation List'}
              </button>
            </div>
          </div>

          {activeTab === 'list' ? (
            <div>
              {/* Filter Tabs */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 24, overflowX: 'auto', paddingBottom: 8 }}>
                {['ALL', 'GENERATED', 'SENT', 'FOLLOW_UP', 'ACCEPTED', 'REJECTED'].map(st => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 20,
                      border: statusFilter === st ? '2px solid var(--color-primary)' : '1px solid #e2e8f0',
                      background: statusFilter === st ? 'var(--color-primary)' : 'white',
                      color: statusFilter === st ? 'white' : '#64748b',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {st} {st === 'ALL' ? `(${quotations.length})` : ''}
                  </button>
                ))}
              </div>

              {filteredQuotes.length === 0 ? (
                <div className="card" style={{ padding: '80px 24px', textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', marginBottom: 20 }}>📥</div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>No quotations found in this view.</h2>
                  <p style={{ color: 'var(--color-text-light)', marginTop: 8 }}>When customer enquiries are received, quotations are automatically computed and listed here.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 20 }}>
                  {filteredQuotes.map((q) => (
                    <div key={q.quoteId} className="card" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20, borderLeft: '6px solid var(--color-primary)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 20, alignItems: 'center' }}>
                        <div style={{ width: 56, height: 56, borderRadius: 12, background: 'rgba(26,77,46,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: 'var(--color-primary)' }}>
                          📄
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--color-primary)' }}>{q.quoteId}</span>
                            <span style={{ fontSize: '0.75rem', background: '#e2e8f0', color: '#334155', padding: '2px 8px', borderRadius: 12, fontWeight: 700 }}>{q.leadId}</span>
                            <span style={{ fontSize: '0.75rem', background: q.status === 'SENT' ? '#dcfce7' : '#fef3c7', color: q.status === 'SENT' ? '#166534' : '#92400e', padding: '2px 8px', borderRadius: 12, fontWeight: 700 }}>{q.status}</span>
                          </div>
                          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b' }}>
                            {q.customerName} — {q.companyName}
                          </div>
                          <div style={{ display: 'flex', gap: 16, fontSize: '0.85rem', color: 'var(--color-text-light)', marginTop: 6, flexWrap: 'wrap' }}>
                            <span><strong>Product:</strong> {q.product} ({q.quantity} KG)</span>
                            <span><strong>Destination:</strong> {q.country}</span>
                            <span><strong>Total:</strong> {q.currency} {Number(q.grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button 
                          onClick={() => handleDownloadPdf(q)}
                          className="btn" 
                          style={{ padding: '8px 14px', fontSize: '0.8rem', background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', display: 'flex', alignItems: 'center', gap: 6 }}
                          title="Download Vector PDF Quotation"
                        >
                          <Download size={14} /> PDF
                        </button>
                        <button 
                          onClick={() => handleDownloadXlsx(q)}
                          className="btn" 
                          style={{ padding: '8px 14px', fontSize: '0.8rem', background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', display: 'flex', alignItems: 'center', gap: 6 }}
                          title="Download Password-Protected Excel (.xlsx)"
                        >
                          <FileSpreadsheet size={14} /> Excel
                        </button>
                        <button 
                          onClick={() => handleSendEmail(q)}
                          className="btn" 
                          style={{ padding: '8px 14px', fontSize: '0.8rem', background: '#e0e7ff', color: '#4338ca', border: '1px solid #c7d2fe', display: 'flex', alignItems: 'center', gap: 6 }}
                          title="Send Quotation via Transactional Email"
                        >
                          <Send size={14} /> Email
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <QuotationBuilder />
            </div>
          )}

        </div>
      </PasswordGate>
    </div>
  )
}
