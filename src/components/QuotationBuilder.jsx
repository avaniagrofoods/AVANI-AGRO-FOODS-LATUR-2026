import { useState } from 'react'
import { Printer, Plus, Trash2, Download } from 'lucide-react'
import { BUSINESS_INFO } from '../data/links'
import { PRODUCT_MASTER } from '../data/productMaster'

const moringa = PRODUCT_MASTER[0]
const defaultItems = [
  {
    id: 1,
    description: moringa.fullDescription,
    hscode: moringa.hsCode,
    quantity: 18000,
    unit: 'KG',
    rate: 350,
    amount: 6300000
  },
]

const generateQN = () => `AAF-Q-2026-${Math.floor(1000 + Math.random() * 9000)}`

export default function QuotationBuilder({ defaultName = 'VIKRAM', defaultEmail = 'vikrajaexports@gmail.com', defaultCountry = 'INDIA' }) {
  const [qn] = useState(generateQN())
  const today = '29 September 2026'
  const validUntil = '12 Oct 2026'

  const [items, setItems] = useState(defaultItems)
  const [consignee, setConsignee] = useState({ name: defaultName, address: 'Solapur, Maharashtra', country: defaultCountry, email: defaultEmail, phone: '84464 19006' })
  const [terms, setTerms] = useState({
    delivery: 'FOB Nhava Sheva (JNPT Mumbai)',
    payment: '50% Advance Payment, Balance 50% Before Dispatch.',
    origin: 'Latur, Maharashtra, India / JNPT Nhava Sheva, Mumbai',
    port: 'Nhava Sheva / JNPT, Mumbai',
    packing: '25 kg Food-Grade HDPE Bags included.',
    inspection: "Pre-dispatch inspection permitted at seller's warehouse at buyer's cost.",
    lead: 'Shipment within 60–75 days from the date of advance payment confirmation.',
    currency: 'INR',
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
          <img src="/assets/brand/avani-agro-foods-logo.png" alt="AVANI AGRO FOODS Logo" style={{ height: 60, marginBottom: 12, borderRadius: 8, background: 'white', padding: '4px' }} onError={e => { e.target.src = '/logo.png'; }} />
          <div style={{ fontWeight: 900, fontSize: '1.3rem' }}>{BUSINESS_INFO.name}</div>
          <div style={{ opacity: 0.8, fontSize: '0.8rem' }}>{BUSINESS_INFO.address.full}</div>
          <div style={{ opacity: 0.8, fontSize: '0.8rem' }}>{BUSINESS_INFO.phone} | {BUSINESS_INFO.email}</div>
          <div style={{ opacity: 0.8, fontSize: '0.8rem' }}>Trader &amp; Export Marketing Partner | MSME Udyam Registered</div>
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

      {/* Commercial Notes & Terms */}
      <div style={{ padding: '20px', background: '#f8faf8', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', marginBottom: 24 }}>
        <div style={{ fontWeight: 800, fontSize: '0.8rem', color: 'var(--color-primary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Commercial Notes &amp; Terms:</div>
        <ol style={{ fontSize: '0.78rem', color: 'var(--color-text)', lineHeight: 1.8, margin: 0, paddingLeft: 18 }}>
          <li><strong>Payment Terms:</strong> 50% Advance Payment, Balance 50% Before Dispatch.</li>
          <li><strong>Price Basis:</strong> FOB Shipment terms (Final port details to be confirmed by Buyer).</li>
          <li><strong>Delivery Timeline:</strong> Shipment within 60–75 days from the date of advance payment confirmation.</li>
          <li><strong>Packaging:</strong> 25 kg Food-Grade HDPE Bags included.</li>
          <li><strong>Validity:</strong> This quotation is valid until 12 Oct 2026.</li>
          <li><strong>Inspection:</strong> Pre-dispatch inspection permitted at seller's warehouse at buyer's cost.</li>
          <li><strong>Jurisdiction:</strong> All disputes are subject to the exclusive jurisdiction of competent courts in Latur, Maharashtra, India.</li>
        </ol>
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
