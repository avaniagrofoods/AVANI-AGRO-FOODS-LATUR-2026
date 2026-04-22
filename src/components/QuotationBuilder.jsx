import { useState } from 'react'
import { Printer, Plus, Trash2, FileText, Download } from 'lucide-react'

const defaultItems = [
  { id: 1, description: 'Premium Moringa Powder — Export Grade A', hscode: '0712.90.90', quantity: 100, unit: 'KG', rate: 350, amount: 35000 },
]

const generateQN = () => `AAF-${Date.now().toString().slice(-6)}`

export default function QuotationBuilder({ defaultName = '', defaultEmail = '', defaultCountry = '' }) {
  const [qn] = useState(generateQN())
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
  const validUntil = new Date(Date.now() + 15 * 86400000).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })

  const [items, setItems] = useState(defaultItems)
  const [consignee, setConsignee] = useState({ name: defaultName, address: '', country: defaultCountry, email: defaultEmail, phone: '' })
  const [terms, setTerms] = useState({
    delivery: 'CIF',
    payment: '30% Advance, 70% before shipment',
    origin: 'India (Maharashtra)',
    port: 'Nhava Sheva / JNPT, Mumbai',
    packing: 'Multi-wall Kraft Bags (25 kg each)',
    inspection: 'NABL Lab Certificate of Analysis provided',
    lead: '14-21 working days from PO confirmation',
    currency: 'USD',
  })

  const addRow = () => {
    setItems(prev => [...prev, {
      id: Date.now(), description: '', hscode: '', quantity: 1, unit: 'KG', rate: 0, amount: 0
    }])
  }

  const removeRow = (id) => setItems(prev => prev.filter(r => r.id !== id))

  const updateRow = (id, field, value) => {
    setItems(prev => prev.map(r => {
      if (r.id !== id) return r
      const updated = { ...r, [field]: field === 'quantity' || field === 'rate' ? Number(value) : value }
      updated.amount = updated.quantity * updated.rate
      return updated
    }))
  }

  const subtotal = items.reduce((s, i) => s + i.amount, 0)
  const tax = 0
  const total = subtotal + tax

  const handlePrint = () => window.print()

  const fmt = (n) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)

  return (
    <div className="quotation-wrapper" style={{ display: 'flex', justifyContent: 'center', padding: '40px 20px', background: '#f5f7f5' }}>
      <div id="quotation-builder" style={{ 
        fontFamily: 'Inter, sans-serif',
        maxWidth: '850px',
        width: '100%',
        background: 'white',
        boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
        borderRadius: '8px',
        padding: '60px',
        position: 'relative',
        margin: '0 auto'
      }}>
      {/* Print-only styles */}
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 15mm; }
          * { transform: none !important; animation: none !important; transition: none !important; }
          body { background: white !important; margin: 0; padding: 0; }
          body * { visibility: hidden; }
          #quotation-builder, #quotation-builder * { visibility: visible; }
          #quotation-builder { 
            position: absolute !important; 
            top: 0 !important; 
            left: 0 !important; 
            width: 100% !important; 
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print { display: none !important; }
          input, select, textarea { 
            border: none !important; 
            background: transparent !important; 
            box-shadow: none !important;
            outline: none !important;
            appearance: none !important;
            -webkit-appearance: none !important;
            color: black !important;
          }
        }
      `}</style>

      {/* Quotation Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))', color: 'white', padding: '32px', borderRadius: 'var(--radius-md)' }}>
        <div>
          <img src="/logo.jpeg" alt="Logo" style={{ height: 56, marginBottom: 12, borderRadius: 8 }} onError={e => e.target.style.display='none'} />
          <div style={{ fontWeight: 900, fontSize: '1.3rem' }}>AVANI AGRO FOODS</div>
          <div style={{ opacity: 0.8, fontSize: '0.8rem' }}>Latur, Maharashtra, India — 413512</div>
          <div style={{ opacity: 0.8, fontSize: '0.8rem' }}>+91 7219053645 | sales@avaniagrofoods.com</div>
          <div style={{ opacity: 0.8, fontSize: '0.8rem' }}>FSSAI | APEDA | IEC Registered</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.7, marginBottom: 6 }}>Proforma Invoice</div>
          <div style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: 2 }}>{qn}</div>
          <div style={{ opacity: 0.8, fontSize: '0.8rem', marginTop: 8 }}>Date: {today}</div>
          <div style={{ opacity: 0.8, fontSize: '0.8rem' }}>Valid Until: {validUntil}</div>
        </div>
      </div>

      {/* Consignee Details */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 }}>
        <div style={{ padding: '20px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: 12 }}>Consignee / Buyer Details</div>
          {[['name', 'Company / Person Name'], ['address', 'Address'], ['country', 'Country'], ['email', 'Email'], ['phone', 'Phone']].map(([k, label]) => (
            <div key={k} style={{ marginBottom: 8 }}>
              <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--color-text-light)', marginBottom: 3 }}>{label}</label>
              <input className="input" value={consignee[k]} onChange={e => setConsignee(p => ({ ...p, [k]: e.target.value }))} placeholder={label} style={{ fontSize: '0.85rem', padding: '6px 10px', width: '100%' }} />
            </div>
          ))}
        </div>
        <div style={{ padding: '20px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: 12 }}>Trade Terms</div>
          {Object.entries(terms).map(([k, v]) => (
            <div key={k} style={{ marginBottom: 8 }}>
              <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--color-text-light)', marginBottom: 3, textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}</label>
              <input className="input" value={v} onChange={e => setTerms(p => ({ ...p, [k]: e.target.value }))} style={{ fontSize: '0.85rem', padding: '6px 10px', width: '100%' }} />
            </div>
          ))}
        </div>
      </div>

      {/* Items Table */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: 12 }}>Product Line Items</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--color-primary)', color: 'white' }}>
                {['#', 'Product Description', 'HS Code', 'Qty', 'Unit', 'Rate (USD)', 'Amount (USD)', ''].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '0.7rem', letterSpacing: '0.1em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.id} style={{ background: idx % 2 === 0 ? 'white' : '#f8faf8', borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '8px 12px', color: 'var(--color-text-light)', fontSize: '0.8rem' }}>{idx + 1}.</td>
                  <td style={{ padding: '8px 12px' }}>
                    <input value={item.description} onChange={e => updateRow(item.id, 'description', e.target.value)} style={{ width: '100%', border: '1px solid var(--color-border)', borderRadius: 4, padding: '5px 8px', fontSize: '0.85rem' }} placeholder="Product description" />
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <input value={item.hscode} onChange={e => updateRow(item.id, 'hscode', e.target.value)} style={{ width: 110, border: '1px solid var(--color-border)', borderRadius: 4, padding: '5px 8px', fontSize: '0.8rem' }} placeholder="HS Code" />
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <input type="number" value={item.quantity} onChange={e => updateRow(item.id, 'quantity', e.target.value)} style={{ width: 70, border: '1px solid var(--color-border)', borderRadius: 4, padding: '5px 8px', fontSize: '0.85rem' }} />
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <select value={item.unit} onChange={e => updateRow(item.id, 'unit', e.target.value)} style={{ border: '1px solid var(--color-border)', borderRadius: 4, padding: '5px 8px', fontSize: '0.85rem' }}>
                      {['KG', 'MT', 'LTR', 'PCS', 'BOX'].map(u => <option key={u}>{u}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <input type="number" value={item.rate} onChange={e => updateRow(item.id, 'rate', e.target.value)} style={{ width: 90, border: '1px solid var(--color-border)', borderRadius: 4, padding: '5px 8px', fontSize: '0.85rem' }} />
                  </td>
                  <td style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--color-primary)' }}>
                    {fmt(item.amount)}
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <button onClick={() => removeRow(item.id)} className="no-print" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}>
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button onClick={addRow} className="btn no-print" style={{ marginTop: 12, background: 'transparent', border: '1px dashed var(--color-primary)', color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Plus size={16} /> Add Line Item
        </button>
      </div>

      {/* Totals */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 32 }}>
        <div style={{ minWidth: 300, padding: '20px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: '#f8faf8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: '0.9rem' }}>
            <span>Subtotal:</span>
            <span style={{ fontWeight: 600 }}>USD {fmt(subtotal)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: '0.9rem', color: 'var(--color-text-light)' }}>
            <span>Tax / Custom Duty:</span>
            <span>As Applicable</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', borderTop: '2px solid var(--color-primary)', fontSize: '1.1rem', fontWeight: 900, color: 'var(--color-primary)' }}>
            <span>TOTAL:</span>
            <span>USD {fmt(total)}</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-light)', marginTop: 8 }}>
            *Price inclusive of standard packaging. Insurance & freight as per {terms.delivery} terms.
          </div>
        </div>
      </div>

      {/* Notes */}
      <div style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(26,77,46,0.05), rgba(26,77,46,0.02))', borderRadius: 'var(--radius-md)', border: '1px solid rgba(26,77,46,0.1)', marginBottom: 24 }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', lineHeight: 1.8, margin: 0 }}>
          <strong>Terms & Conditions:</strong> This quotation is valid for {validUntil}. Prices subject to market fluctuation. Final quantity &amp; price confirmed on receipt of Purchase Order. All products are FSSAI compliant. Documents provided: Certificate of Analysis, Phytosanitary Certificate, Certificate of Origin, Packing List, Commercial Invoice. Bank Details shared upon PO confirmation.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="no-print" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button onClick={handlePrint} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Printer size={18} /> Print / Save PDF
        </button>
        <button onClick={handlePrint} className="btn" style={{ background: 'var(--color-accent)', color: 'white', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Download size={18} /> Download Quotation
        </button>
      </div>
      </div>
    </div>
  )
}
