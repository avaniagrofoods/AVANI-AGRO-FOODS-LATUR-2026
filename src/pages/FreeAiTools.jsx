import { useState } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import { Calculator, Search, Calculator as CalcIcon, Info, ArrowRight } from 'lucide-react'

const HS_CODES = [
  { code: '1211.90.90', product: 'Moringa Leaves (Dehydrated)', notes: 'Primary code for whole/crushed leaves' },
  { code: '0712.90.90', product: 'Moringa Powder (Export Grade)', notes: 'Standard powder code for export' },
  { code: '0712.20.00', product: 'Red Onion Powder', notes: 'Specific for dehydrated onion products' },
  { code: '0703.10.10', product: 'Fresh Red Onions', notes: 'For fresh export bulk orders' },
  { code: '1106.30.90', product: 'Moringa Seed Powder', notes: 'Seeds and related meal products' },
]

export default function FreeAiTools() {
  const [calc, setCalc] = useState({
    unitCost: 350,
    qty: 1000,
    shippingUSD: 1200,
    marginPct: 20,
    exchangeRate: 83.5
  })
  const [hsQuery, setHsQuery] = useState('')

  const subtotalINR = calc.unitCost * calc.qty
  const subtotalUSD = subtotalINR / calc.exchangeRate
  const totalCostUSD = subtotalUSD + calc.shippingUSD
  const targetPriceUSD = totalCostUSD * (1 + calc.marginPct / 100)
  const pricePerUnitUSD = targetPriceUSD / calc.qty

  const filteredHS = HS_CODES.filter(h => 
    h.product.toLowerCase().includes(hsQuery.toLowerCase()) || 
    h.code.includes(hsQuery)
  )

  return (
    <>
      <SEO 
        title="Free B2B Export AI Tools | HS Code Finder"
        description="Free professional tools for agricultural exporters. Find HS Codes and calculate export profitability for Moringa and Onion products."
      />

      <div className="page-top">
        <div style={{ background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))', padding: '80px 0', textAlign: 'center', color: 'white' }}>
          <div className="container">
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: 16 }}>Free B2B Export Tools</h1>
            <p style={{ opacity: 0.9, fontSize: '1.1rem', maxWidth: 600, margin: '0 auto' }}>
              Professional utilities to streamline your international trade operations.
            </p>
          </div>
        </div>

        <div className="container" style={{ padding: '72px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 48 }}>
            
            {/* Tool 1: HS Code Finder */}
            <div className="card" style={{ padding: 40 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
                <div style={{ background: 'rgba(34,197,94,0.1)', padding: 12, borderRadius: 12 }}>
                  <Search size={24} color="var(--color-primary)" />
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0 }}>HS Code Finder</h2>
              </div>

              <div style={{ position: 'relative', marginBottom: 24 }}>
                <input 
                  className="input" 
                  placeholder="Search product (e.g. Moringa, Onion)..." 
                  value={hsQuery}
                  onChange={e => setHsQuery(e.target.value)}
                  style={{ paddingLeft: 44, width: '100%' }}
                />
                <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {filteredHS.length > 0 ? filteredHS.map(h => (
                  <div key={h.code} style={{ padding: 16, background: 'var(--color-bg-alt)', borderRadius: 12, border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: '1rem' }}>{h.code}</span>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-light)' }}>Agricultural</span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 4 }}>{h.product}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>{h.notes}</div>
                  </div>
                )) : (
                  <p style={{ textAlign: 'center', color: 'var(--color-text-light)', padding: '20px 0' }}>No matching codes found.</p>
                )}
              </div>
            </div>

            {/* Tool 2: Profitability Calculator */}
            <div className="card" style={{ padding: 40 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
                <div style={{ background: 'rgba(239,68,68,0.1)', padding: 12, borderRadius: 12 }}>
                  <CalcIcon size={24} color="var(--color-accent)" />
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0 }}>Export Pricing Calc</h2>
              </div>

              <div style={{ display: 'grid', gap: 16, marginBottom: 32 }}>
                <div>
                  <label className="label">Unit Procurement Cost (INR)</label>
                  <input type="number" className="input" value={calc.unitCost} onChange={e => setCalc(p => ({ ...p, unitCost: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className="label">Quantity (KG)</label>
                  <input type="number" className="input" value={calc.qty} onChange={e => setCalc(p => ({ ...p, qty: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className="label">Freight & Insurance (USD)</label>
                  <input type="number" className="input" value={calc.shippingUSD} onChange={e => setCalc(p => ({ ...p, shippingUSD: Number(e.target.value) }))} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="label">Target Margin (%)</label>
                    <input type="number" className="input" value={calc.marginPct} onChange={e => setCalc(p => ({ ...p, marginPct: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <label className="label">Exchange Rate (INR/USD)</label>
                    <input type="number" className="input" value={calc.exchangeRate} onChange={e => setCalc(p => ({ ...p, exchangeRate: Number(e.target.value) }))} />
                  </div>
                </div>
              </div>

              <div style={{ background: 'var(--color-primary)', color: 'white', padding: 24, borderRadius: 16 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.8, marginBottom: 8 }}>Recommended Export Price (CIF)</div>
                <div style={{ fontSize: '2rem', fontWeight: 900 }}>USD {pricePerUnitUSD.toFixed(2)} / KG</div>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', marginTop: 16, paddingTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: '0.65rem', opacity: 0.7 }}>Total Invoice</div>
                    <div style={{ fontWeight: 700 }}>USD {targetPriceUSD.toFixed(0)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.65rem', opacity: 0.7 }}>Net Profit</div>
                    <div style={{ fontWeight: 700 }}>INR {((targetPriceUSD - totalCostUSD) * calc.exchangeRate).toFixed(0)}</div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <div style={{ marginTop: 64, textAlign: 'center' }}>
            <div className="card" style={{ padding: '32px', display: 'inline-block', maxWidth: 700 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, textAlign: 'left' }}>
                <Info size={20} color="var(--color-primary)" />
                <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem' }}>B2B Enterprise Support</p>
              </div>
              <p style={{ color: 'var(--color-text-light)', fontSize: '0.9rem', textAlign: 'left', lineHeight: 1.6 }}>
                These tools provide estimates based on current market data. For official proforma quotations with precise logistics costs from Nhava Sheva port, please use our <Link to="/contact" style={{ color: 'var(--color-primary)', fontWeight: 700 }}>Quotation Builder</Link>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
