import { useState, useEffect } from 'react'
import SEO from '../components/SEO'
import PasswordGate from '../components/PasswordGate'
import { Users, CheckCircle, Trash2, ShieldCheck, Search, Filter, Download, ExternalLink } from 'lucide-react'

export default function AffiliateDirectory() {
  const [affiliates, setAffiliates] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('affiliates') || '[]')
    setAffiliates(stored)
  }, [])

  const handleApprove = (id) => {
    const updated = affiliates.map(a => 
      a.affId === id ? { ...a, status: 'Approved' } : a
    )
    setAffiliates(updated)
    localStorage.setItem('affiliates', JSON.stringify(updated))
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this affiliate?')) {
      const updated = affiliates.filter(a => a.affId !== id)
      setAffiliates(updated)
      localStorage.setItem('affiliates', JSON.stringify(updated))
    }
  }

  const filteredAffiliates = affiliates.filter(a => 
    a.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.email?.toLowerCase().includes(search.toLowerCase()) ||
    a.affId?.toLowerCase().includes(search.toLowerCase())
  )

  const handleExportCSV = () => {
    if (affiliates.length === 0) return alert('No affiliates to export.')
    const headers = ['Affiliate ID', 'Name', 'Email', 'Phone', 'Platform', 'Joined Date', 'Status']
    const rows = affiliates.map(a => [
      a.affId,
      `"${a.name}"`,
      a.email,
      a.phone,
      `"${a.platform || 'General'}"`,
      a.date || 'N/A',
      a.status || 'Pending'
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `avani_affiliates_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="page-top" style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <PasswordGate title="Affiliate Admin Directory" description="Authorized admin access required to manage affiliate partners.">
        <SEO title="Affiliate Partner Directory (Admin)" description="Confidential directory of registered Avani Agro Foods affiliate partners." />
        
        <div style={{ background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))', padding: '60px 0', color: 'white' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600, marginBottom: 12 }}>
                  <ShieldCheck size={14} /> Confidential Admin Access
                </div>
                <h1 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: 8 }}>Affiliate Partner Directory</h1>
                <p style={{ opacity: 0.8, fontSize: '0.95rem' }}>Review, manage, and verify all registered B2B and retail affiliate accounts.</p>
              </div>
              <div>
                <button 
                  onClick={handleExportCSV}
                  className="btn" 
                  style={{ background: 'white', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}
                >
                  <Download size={16} /> Export CSV
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="container" style={{ padding: '40px 24px' }}>
          {/* Stats Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 32 }}>
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Total Registered</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--color-primary)', marginTop: 4 }}>{affiliates.length}</div>
            </div>
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Approved Active</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#16a34a', marginTop: 4 }}>
                {affiliates.filter(a => a.status === 'Approved').length}
              </div>
            </div>
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Pending Verification</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#d97706', marginTop: 4 }}>
                {affiliates.filter(a => a.status !== 'Approved').length}
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="card" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: 360 }}>
                <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-light)' }} />
                <input 
                  type="text" 
                  className="input" 
                  placeholder="Search by name, email, ID..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ paddingLeft: 42, width: '100%' }}
                />
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-light)' }}>
                Showing <strong>{filteredAffiliates.length}</strong> of {affiliates.length} partners
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--color-border)', background: '#f8fafc' }}>
                    <th style={{ padding: '16px 20px', fontWeight: 800 }}>Affiliate ID</th>
                    <th style={{ padding: '16px 20px', fontWeight: 800 }}>Partner Details</th>
                    <th style={{ padding: '16px 20px', fontWeight: 800 }}>Platform / Bio</th>
                    <th style={{ padding: '16px 20px', fontWeight: 800 }}>Status</th>
                    <th style={{ padding: '16px 20px', fontWeight: 800 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAffiliates.length > 0 ? filteredAffiliates.map((aff) => (
                    <tr key={aff.affId} style={{ borderBottom: '1px solid var(--color-border)' }} className="table-row-hover">
                      <td style={{ padding: '20px', fontWeight: 700, color: 'var(--color-primary)' }}>
                        {aff.affId}
                      </td>
                      <td style={{ padding: '20px' }}>
                        <div style={{ fontWeight: 800 }}>{aff.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>{aff.email}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>{aff.phone}</div>
                      </td>
                      <td style={{ padding: '20px', maxWidth: 260 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{aff.platform || 'General Referral'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {aff.audience || 'N/A'}
                        </div>
                      </td>
                      <td style={{ padding: '20px' }}>
                        <span style={{ 
                          display: 'inline-block',
                          padding: '4px 12px', 
                          borderRadius: 20, 
                          fontSize: '0.75rem', 
                          fontWeight: 800,
                          background: aff.status === 'Approved' ? '#dcfce7' : '#fef3c7',
                          color: aff.status === 'Approved' ? '#15803d' : '#b45309'
                        }}>
                          {aff.status || 'Pending'}
                        </span>
                      </td>
                      <td style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {aff.status !== 'Approved' && (
                            <button 
                              onClick={() => handleApprove(aff.affId)}
                              style={{ padding: '8px', borderRadius: '8px', border: '1px solid #d1fae5', background: '#ecfdf5', color: '#059669', cursor: 'pointer' }}
                              title="Approve"
                            >
                              <CheckCircle size={18} />
                            </button>
                          )}
                          <button 
                            onClick={() => handleDelete(aff.affId)}
                            style={{ padding: '8px', borderRadius: '8px', border: '1px solid #fee2e2', background: '#fef2f2', color: '#dc2626', cursor: 'pointer' }}
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                          <a 
                            href={`mailto:${aff.email}`}
                            style={{ padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', cursor: 'pointer', display: 'flex' }}
                            title="Contact"
                          >
                            <ExternalLink size={18} />
                          </a>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--color-text-light)' }}>
                        <div style={{ marginBottom: 12 }}><Users size={40} opacity={0.3} /></div>
                        No affiliates found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </PasswordGate>

      <style dangerouslySetInnerHTML={{ __html: `
        .table-row-hover:hover {
          background-color: #f8fafc !important;
        }
      `}} />
    </div>
  )
}
