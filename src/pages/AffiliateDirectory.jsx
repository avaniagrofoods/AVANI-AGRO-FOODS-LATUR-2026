import { useState, useEffect } from 'react'
import SEO from '../components/SEO'
import { Lock, Users, CheckCircle, Trash2, ShieldCheck, Search, Filter, Download, ExternalLink } from 'lucide-react'

export default function AffiliateDirectory() {
  const [password, setPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [error, setError] = useState('')
  const [affiliates, setAffiliates] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (isAuthenticated) {
      const stored = JSON.parse(localStorage.getItem('affiliates') || '[]')
      setAffiliates(stored)
    }
  }, [isAuthenticated])

  const handleLogin = (e) => {
    e.preventDefault()
    if (password === 'Samarth@1356') {
      setIsAuthenticated(true)
      setError('')
    } else {
      setError('Invalid admin password')
    }
  }

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

  if (!isAuthenticated) {
    return (
      <div className="page-top" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)' }}>
        <SEO title="Admin Login — Affiliate Directory" description="Authorized access only." />
        <div className="card" style={{ maxWidth: 400, width: '100%', padding: '48px 32px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(26,77,46,0.1)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Lock size={32} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: 8 }}>Admin Access</h1>
          <p style={{ color: 'var(--color-text-light)', marginBottom: 32, fontSize: '0.9rem' }}>Please enter the directory password to continue.</p>
          
          <form onSubmit={handleLogin}>
            <input 
              type="password" 
              className="input" 
              placeholder="Enter Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ textAlign: 'center', fontSize: '1.1rem', letterSpacing: '4px', marginBottom: 16 }}
              required
            />
            {error && <p style={{ color: '#ef4444', fontSize: '0.8rem', marginBottom: 16, fontWeight: 600 }}>{error}</p>}
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              Access Directory
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <>
      <SEO title="Affiliate Directory — Admin" description="Manage your global affiliate network." />
      <div className="page-top" style={{ background: '#f8fafc', minHeight: '100vh', padding: '100px 24px 60px' }}>
        <div className="container">
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40, flexWrap: 'wrap', gap: 24 }}>
            <div>
              <div className="section-tag" style={{ background: 'rgba(26,77,46,0.1)', color: 'var(--color-primary)' }}>
                <ShieldCheck size={14} /> Admin Control Panel
              </div>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginTop: 8 }}>Affiliate Directory</h1>
              <p style={{ color: 'var(--color-text-light)', marginTop: 8 }}>Managing {affiliates.length} registered partners</p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn" style={{ background: 'white', border: '1px solid var(--color-border)', fontSize: '0.85rem' }}>
                <Download size={16} /> Export CSV
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 32 }}>
            {[
              { label: 'Total Registrations', value: affiliates.length, icon: Users, color: 'var(--color-primary)' },
              { label: 'Pending Approval', value: affiliates.filter(a => !a.status).length, icon: Filter, color: '#e6a817' },
              { label: 'Active Affiliates', value: affiliates.filter(a => a.status === 'Approved').length, icon: CheckCircle, color: '#10b981' }
            ].map((s, i) => (
              <div key={i} className="card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ width: 48, height: 48, borderRadius: '12px', background: `${s.color}15`, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <s.icon size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{s.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Table Card */}
          <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--color-border)' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--color-border)', background: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div style={{ position: 'relative', maxWidth: 400, width: '100%' }}>
                <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-light)' }} />
                <input 
                  type="text" 
                  className="input" 
                  placeholder="Search by name, email or ID..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ paddingLeft: 48, background: '#f1f5f9', border: 'none' }}
                />
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--color-border)' }}>
                    {['Affiliate Info', 'Platform', 'Registration Date', 'Status', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredAffiliates.length > 0 ? filteredAffiliates.map((aff, i) => (
                    <tr key={aff.affId} style={{ borderBottom: i === filteredAffiliates.length - 1 ? 'none' : '1px solid #f1f5f9', background: 'white', transition: 'background 0.2s' }} className="table-row-hover">
                      <td style={{ padding: '20px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary), #2d8f5c)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '0.8rem' }}>
                            {aff.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{aff.name}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>{aff.email}</div>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: 4, fontFamily: 'monospace' }}>{aff.affId}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '20px 24px' }}>
                        <span className="badge" style={{ background: '#f1f5f9', color: 'var(--color-text-dark)', border: '1px solid #e2e8f0' }}>{aff.platform}</span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginTop: 4 }}>{aff.followers || 'No followers data'}</div>
                      </td>
                      <td style={{ padding: '20px 24px', fontSize: '0.85rem', color: 'var(--color-text-light)' }}>
                        {new Date(aff.joinedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '20px 24px' }}>
                        <span style={{ 
                          padding: '4px 12px', 
                          borderRadius: '20px', 
                          fontSize: '0.7rem', 
                          fontWeight: 800, 
                          background: aff.status === 'Approved' ? '#d1fae5' : '#fef3c7', 
                          color: aff.status === 'Approved' ? '#065f46' : '#92400e' 
                        }}>
                          {aff.status || 'Pending'}
                        </span>
                      </td>
                      <td style={{ padding: '20px 24px' }}>
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
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .table-row-hover:hover {
          background-color: #f8fafc !important;
        }
      `}} />
    </>
  )
}
