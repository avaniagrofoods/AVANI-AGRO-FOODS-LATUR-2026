import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Trash2, Mail, User, Building, MapPin, ArrowRight, CheckCircle, ExternalLink } from 'lucide-react'
import PasswordGate from '../components/PasswordGate'
import QuotationBuilder from '../components/QuotationBuilder'

export default function AdminQuotations() {
  const [enquiries, setEnquiries] = useState([])
  const [selectedEnquiry, setSelectedEnquiry] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const loadEnquiries = () => {
      const data = JSON.parse(localStorage.getItem('avani_enquiries') || '[]')
      setEnquiries(data)
    }
    loadEnquiries()
    window.addEventListener('enquiry-updated', loadEnquiries)
    window.addEventListener('storage', loadEnquiries)
    return () => {
      window.removeEventListener('enquiry-updated', loadEnquiries)
      window.removeEventListener('storage', loadEnquiries)
    }
  }, [])

  const deleteEnquiry = (id) => {
    if (window.confirm('Are you sure you want to delete this enquiry?')) {
      const updated = enquiries.filter(e => e.id !== id)
      localStorage.setItem('avani_enquiries', JSON.stringify(updated))
      setEnquiries(updated)
      window.dispatchEvent(new Event('enquiry-updated'))
    }
  }

  const handleFillQuotation = (enquiry) => {
    setSelectedEnquiry(enquiry)
  }

  return (
    <div className="page-top" style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <PasswordGate 
        password="Samarth@1356" 
        title="Admin Control Center" 
        description="Access restricted to authorized personnel. Manage received enquiries and generate proforma quotations."
      >
        <div className="container" style={{ padding: '60px 24px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
            <div>
              <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--color-primary)', marginBottom: 8 }}>Enquiry Management</h1>
              <p style={{ color: 'var(--color-text-light)' }}>Total Enquiries: <strong>{enquiries.length}</strong></p>
            </div>
            {selectedEnquiry && (
              <button 
                onClick={() => setSelectedEnquiry(null)} 
                className="btn" 
                style={{ background: 'white', color: 'var(--color-primary)', border: '1px solid var(--color-primary)' }}
              >
                &larr; Back to List
              </button>
            )}
          </div>

          {!selectedEnquiry ? (
            <div style={{ display: 'grid', gap: 20 }}>
              {enquiries.length === 0 ? (
                <div className="card" style={{ padding: '80px 24px', textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', marginBottom: 20 }}>📥</div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>No enquiries received yet.</h2>
                  <p style={{ color: 'var(--color-text-light)', marginTop: 8 }}>When visitors submit the contact form, they will appear here.</p>
                </div>
              ) : (
                enquiries.map((enquiry) => (
                  <div key={enquiry.id} className="card animate-in" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 24, alignItems: 'center' }}>
                      <div style={{ width: 50, height: 50, borderRadius: 12, background: 'rgba(26,77,46,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <User size={24} color="var(--color-primary)" />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                          <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{enquiry.firstName} {enquiry.lastName}</h3>
                          <span style={{ fontSize: '0.7rem', background: 'var(--color-accent)', color: 'white', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>{enquiry.inquiryType}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 16, fontSize: '0.85rem', color: 'var(--color-text-light)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Building size={14} /> {enquiry.company || 'Private'}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={14} /> {enquiry.country}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={14} /> {enquiry.email}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button 
                        onClick={() => handleFillQuotation(enquiry)}
                        className="btn btn-primary" 
                        style={{ padding: '10px 20px', fontSize: '0.85rem', gap: 8 }}
                      >
                        <FileText size={16} /> Fill Quotation <ArrowRight size={14} />
                      </button>
                      <button 
                        onClick={() => deleteEnquiry(enquiry.id)}
                        style={{ width: 44, height: 44, borderRadius: 8, background: '#fee2e2', color: '#dc2626', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Delete Enquiry"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="animate-in">
              <div className="card" style={{ padding: '32px', marginBottom: 32, borderLeft: '6px solid var(--color-primary)' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: 16 }}>Processing Enquiry for: {selectedEnquiry.firstName} {selectedEnquiry.lastName}</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, fontSize: '0.9rem' }}>
                  <div><strong>Email:</strong> {selectedEnquiry.email}</div>
                  <div><strong>Phone:</strong> {selectedEnquiry.phone || 'N/A'}</div>
                  <div><strong>Company:</strong> {selectedEnquiry.company || 'N/A'}</div>
                  <div><strong>Country:</strong> {selectedEnquiry.country}</div>
                </div>
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--color-border)', fontSize: '0.95rem' }}>
                  <strong>Message:</strong> 
                  <p style={{ marginTop: 8, color: 'var(--color-text-light)', fontStyle: 'italic' }}>"{selectedEnquiry.message}"</p>
                </div>
              </div>

              <QuotationBuilder 
                defaultName={`${selectedEnquiry.firstName} ${selectedEnquiry.lastName} — ${selectedEnquiry.company}`} 
                defaultEmail={selectedEnquiry.email} 
                defaultCountry={selectedEnquiry.country} 
              />
            </div>
          )}

        </div>
      </PasswordGate>
    </div>
  )
}
