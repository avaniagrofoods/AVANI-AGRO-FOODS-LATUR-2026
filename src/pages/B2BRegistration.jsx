import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Building2, Globe, CheckCircle2, 
  ArrowRight, ShieldCheck, Zap, 
  FileText, CreditCard, ChevronRight,
  Info, AlertCircle, Upload, Phone, Mail, User,
  Lock, ArrowLeft, CloudLightning, Shield 
} from 'lucide-react'
import SEO from '../components/SEO'
import { STRIPE_LINKS } from '../data/links'
import { sendB2BRegistrationEmail } from '../lib/emailjs'

const PLANS = [
  {
    region: '🇮🇳 India',
    plans: [
      { id: 'in_free', name: 'Trial', period: '6 Months', price: 'Free', desc: 'Try B2B store access', link: null, isFree: true },
      { id: 'in_monthly', name: 'Standard', period: 'Monthly', price: '₹4,999', desc: 'Full business networking', link: STRIPE_LINKS.INDIA.MONTHLY },
      { id: 'in_yearly', name: 'Premium', period: '1 Year', price: '₹39,999', desc: 'Best for growing exporters', link: STRIPE_LINKS.INDIA.YEARLY }
    ]
  },
  {
    region: '🌎 Global',
    plans: [
      { id: 'glb_free', name: 'Trial', period: '6 Months', price: 'Free', desc: 'Try international access', link: null, isFree: true },
      { id: 'glb_monthly', name: 'Export Pro', period: 'Monthly', price: '$99', desc: 'Full global network access', link: STRIPE_LINKS.GLOBAL.MONTHLY },
      { id: 'glb_yearly', name: 'Enterprise', period: '1 Year', price: '$899', desc: 'Priority global trade listing', link: STRIPE_LINKS.GLOBAL.YEARLY }
    ]
  }
]

export default function B2BRegistration() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)
  
  const [formData, setFormData] = useState({
    companyName: '',
    regNumber: '',
    businessType: '',
    country: '',
    mobile: '',
    email: '',
    contactName: '',
    license: null,
    warehousePhoto: null
  })

  const updateForm = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleNextStep = () => {
    if (step === 2 && selectedPlan?.isFree) {
      setStep(4) // Skip payment for free plan
    } else {
      setStep(prev => prev + 1)
    }
    window.scrollTo(0, 0)
  }

  const handleBackStep = () => {
    if (step === 4 && selectedPlan?.isFree) {
      setStep(2)
    } else {
      setStep(prev => prev - 1)
    }
    window.scrollTo(0, 0)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // Mock upload or registration logic
      await sendB2BRegistrationEmail({
        ...formData,
        planId: selectedPlan?.id,
        planName: selectedPlan?.name,
        planPrice: selectedPlan?.price
      })
      
      setSubmitted(true)
      setStep(5)
    } catch (error) {
      console.error('Registration failed:', error)
      alert('Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const renderStepIndicator = () => (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 60, gap: 12 }}>
      {[1, 2, 3, 4, 5].map((s) => {
        const isActive = step === s
        const isCompleted = step > s || (s === 3 && selectedPlan?.isFree && step >= 4)
        
        return (
          <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ 
              width: 32, height: 32, borderRadius: '50%',
              background: isCompleted ? 'var(--color-primary)' : (isActive ? 'var(--color-accent)' : '#eee'),
              color: isCompleted || isActive ? 'white' : '#888',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: '0.8rem',
              transition: 'all 0.3s ease'
            }}>
              {isCompleted ? <CheckCircle2 size={16} /> : s}
            </div>
            {s < 5 && (
              <div style={{ width: 40, height: 2, background: step > s ? 'var(--color-primary)' : '#eee', margin: '0 8px' }} />
            )}
          </div>
        )
      })}
    </div>
  )

  const renderStep = () => {
    switch(step) {
      case 1: // Business Details
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="registration-step"
          >
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: 12 }}>Business <span style={{ color: 'var(--color-primary)' }}>Details</span></h2>
            <p style={{ color: 'var(--color-text-light)', marginBottom: 32 }}>Tell us about your company to start the registration.</p>
            
            <div style={{ display: 'grid', gap: 24 }}>
              <div>
                <label className="label">Full Company Name *</label>
                <div style={{ position: 'relative' }}>
                  <Building2 size={18} style={{ position: 'absolute', left: 16, top: 18, color: '#888' }} />
                  <input 
                    className="input" style={{ paddingLeft: 48 }}
                    placeholder="e.g. Avani Agro Foods Ltd" 
                    value={formData.companyName}
                    onChange={(e) => updateForm('companyName', e.target.value)}
                  />
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                  <label className="label">Registration / Tax ID *</label>
                  <input 
                    className="input" 
                    placeholder="PAN / GST / VAT" 
                    value={formData.regNumber}
                    onChange={(e) => updateForm('regNumber', e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Business Type *</label>
                  <select 
                    className="input"
                    value={formData.businessType}
                    onChange={(e) => updateForm('businessType', e.target.value)}
                  >
                    <option value="">Select type</option>
                    <option>Manufacturer</option>
                    <option>Wholesaler / Distributor</option>
                    <option>Retailer</option>
                    <option>Importer</option>
                    <option>Exporter</option>
                    <option>Agent / Broker</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="label">Operations Country *</label>
                <div style={{ position: 'relative' }}>
                  <Globe size={18} style={{ position: 'absolute', left: 16, top: 18, color: '#888' }} />
                  <input 
                    className="input" style={{ paddingLeft: 48 }}
                    placeholder="e.g. India, United Arab Emirates" 
                    value={formData.country}
                    onChange={(e) => updateForm('country', e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: 40, height: 56, justifyContent: 'center' }}
              disabled={!formData.companyName || !formData.regNumber || !formData.businessType || !formData.country}
              onClick={handleNextStep}
            >
              Continue to Plans <ChevronRight size={20} />
            </button>
          </motion.div>
        )

      case 2: // Plan Selection
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="registration-step"
          >
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: 12 }}>Choose Your <span style={{ color: 'var(--color-primary)' }}>Plan</span></h2>
            <p style={{ color: 'var(--color-text-light)', marginBottom: 32 }}>Select a membership level to join our global network.</p>

            <div style={{ display: 'grid', gap: 40 }}>
              {PLANS.map((group) => (
                <div key={group.region}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                    <div style={{ height: 1, flex: 1, background: '#eee' }}></div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#888', letterSpacing: 1 }}>{group.region} Marketplace</span>
                    <div style={{ height: 1, flex: 1, background: '#eee' }}></div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
                    {group.plans.map((plan) => (
                      <motion.div 
                        key={plan.id}
                        whileHover={{ scale: 1.02, translateY: -5 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedPlan(plan)}
                        className={`card card-hover ${selectedPlan?.id === plan.id ? 'active-card' : ''}`}
                        style={{ 
                          padding: 24, 
                          cursor: 'pointer',
                          border: selectedPlan?.id === plan.id ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                          background: plan.isFree ? 'linear-gradient(135deg, #fff, #f8faf8)' : 'white',
                          position: 'relative'
                        }}
                      >
                        {plan.isFree && (
                          <div style={{ 
                            position: 'absolute', top: -12, right: 20, 
                            background: 'var(--color-accent)', color: 'white', 
                            padding: '4px 12px', borderRadius: 20, fontSize: '0.65rem', fontWeight: 900,
                            boxShadow: '0 4px 12px rgba(239,68,68,0.2)'
                          }}>
                            MOST POPULAR TRIAL
                          </div>
                        )}
                        <h4 style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: 4 }}>{plan.name}</h4>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', marginBottom: 16 }}>{plan.desc}</div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 16 }}>
                          <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-primary)' }}>{plan.price}</span>
                          <span style={{ fontSize: '0.8rem', color: '#888' }}>/ {plan.period}</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-primary)' }}>
                          <ShieldCheck size={14} /> Global Visibility Included
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 16, marginTop: 48 }}>
              <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={handleBackStep}>
                <ArrowLeft size={18} /> Back
              </button>
              <button 
                className="btn btn-primary" style={{ flex: 2, justifyContent: 'center' }}
                disabled={!selectedPlan}
                onClick={handleNextStep}
              >
                {selectedPlan?.isFree ? 'Claim Free Access' : 'Proceed to Payment'}
              </button>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ 
                marginTop: 40, padding: 24, borderRadius: 'var(--radius-md)', 
                background: 'rgba(26,77,46,0.05)', border: '1px dashed var(--color-primary)',
                display: 'flex', gap: 16, alignItems: 'center'
              }}
            >
              <Zap color="var(--color-primary)" />
              <div style={{ fontSize: '0.9rem' }}>
                <strong>New: 6-Month Free Trial!</strong> You can now explore the network and list your business for free for the first 6 months. No credit card required.
              </div>
            </motion.div>
          </motion.div>
        )

      case 3: // Payment (Only if not Free)
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="registration-step"
          >
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: 12 }}>Secure <span style={{ color: 'var(--color-primary)' }}>Payment</span></h2>
            <p style={{ color: 'var(--color-text-light)', marginBottom: 32 }}>Please finish your subscription payout to activate your B2B listing.</p>

            <div className="card" style={{ padding: 40, textAlign: 'center', border: '2px solid var(--color-primary)', background: 'linear-gradient(135deg, #fff, #f0faf4)' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(26,77,46,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <CreditCard size={32} color="var(--color-primary)" />
              </div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 8 }}>{selectedPlan?.price} for {selectedPlan?.name}</h3>
              <p style={{ color: 'var(--color-text-light)', marginBottom: 32 }}>Billed {selectedPlan?.period.toLowerCase()}. Secure checkout via Stripe.</p>
              
              <a 
                href={selectedPlan?.link} target="_blank" rel="noopener noreferrer" 
                className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', height: 56 }}
              >
                Pay Now with Stripe <ChevronRight size={18} style={{ marginLeft: 8 }} />
              </a>
              
              <div style={{ marginTop: 24, padding: 16, background: 'rgba(0,0,0,0.03)', borderRadius: 12, display: 'flex', gap: 12, alignItems: 'center', textAlign: 'left' }}>
                <Info size={16} color="var(--color-primary)" />
                <span style={{ fontSize: '0.75rem', color: '#666' }}>After payment, you will be automatically redirected to complete your profile verification.</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16, marginTop: 40 }}>
              <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={handleBackStep}>
                <ArrowLeft size={18} /> Back
              </button>
              <button 
                className="btn btn-outline" 
                style={{ flex: 2, justifyContent: 'center' }}
                onClick={handleNextStep}
              >
                Continue Verification
              </button>
            </div>
          </motion.div>
        )

      case 4: // Final Details & Documents
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="registration-step"
          >
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: 12 }}>Contact & <span style={{ color: 'var(--color-primary)' }}>Verification</span></h2>
            <p style={{ color: 'var(--color-text-light)', marginBottom: 32 }}>Complete your profile for the B2B directory listing.</p>

            <div style={{ display: 'grid', gap: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                  <label className="label">Contact Person Name *</label>
                  <div style={{ position: 'relative' }}>
                    <User size={18} style={{ position: 'absolute', left: 16, top: 18, color: '#888' }} />
                    <input 
                      className="input" style={{ paddingLeft: 48 }}
                      required placeholder="Full Name" 
                      value={formData.contactName}
                      onChange={(e) => updateForm('contactName', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Business Email *</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={18} style={{ position: 'absolute', left: 16, top: 18, color: '#888' }} />
                    <input 
                      type="email" className="input" style={{ paddingLeft: 48 }}
                      required placeholder="email@company.com" 
                      value={formData.email}
                      onChange={(e) => updateForm('email', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="label">WhatsApp / Mobile Number *</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={18} style={{ position: 'absolute', left: 16, top: 18, color: '#888' }} />
                  <input 
                    className="input" style={{ paddingLeft: 48 }}
                    required placeholder="+91 98765 43210" 
                    value={formData.mobile}
                    onChange={(e) => updateForm('mobile', e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <PremiumUploader 
                  label="BUSINESS LICENSE (PDF/JPG)" 
                  sub="Formal registration document"
                  onUpload={() => {}}
                />
                <PremiumUploader 
                  label="WAREHOUSE / OFFICE PHOTO" 
                  sub="Verification of physical presence"
                  onUpload={() => {}}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16, marginTop: 40 }}>
              <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={handleBackStep}>
                <ArrowLeft size={18} /> Back
              </button>
              <button 
                type="submit" className="btn btn-primary" style={{ flex: 2, justifyContent: 'center' }}
                disabled={loading}
                onClick={handleSubmit}
              >
                {loading ? 'Submitting...' : 'Complete Registration'}
              </button>
            </div>
            
            <p style={{ marginTop: 24, fontSize: '0.75rem', color: '#888', textAlign: 'center' }}>
              By clicking complete, you agree to our B2B Marketplace Terms and verification process.
            </p>
          </motion.div>
        )

      case 5: // Success
        return (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="registration-step" 
            style={{ textAlign: 'center', padding: '40px 0' }}
          >
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <CheckCircle2 size={40} color="white" />
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: 12 }}>Registration <span style={{ color: 'var(--color-primary)' }}>Pending</span></h2>
            <p style={{ color: 'var(--color-text-light)', fontSize: '1.1rem', maxWidth: 500, margin: '0 auto 32px' }}>
              Thank you for joining the Avani Agro Foods B2B network! Our team will verify your business details within 24-48 hours.
            </p>
            
            <div className="card" style={{ padding: 24, background: '#f8faf8', marginBottom: 32, border: '1px solid var(--color-primary)' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: 8, letterSpacing: 1.5 }}>PREVIEW ACCESS GRANTED</div>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-light)' }}>
                You can now browse the B2B store and view partner details. Your own listing will appear once verified.
              </p>
            </div>

            <button 
              className="btn btn-primary" 
              style={{ padding: '0 40px', height: 56 }}
              onClick={() => window.location.href = '/b2b/store'}
            >
              Enter B2B Store <ArrowRight size={20} />
            </button>
          </motion.div>
        )
    }
  }

  return (
    <>
      <SEO 
        title="B2B Business Registration — Avani Agro Foods"
        description="Register your business for global B2B access. Export premium Moringa, Onion powder and other agro products. Join our verified partner network today."
      />

      <div className="page-top" style={{ minHeight: '100vh', background: '#fcfdfc', padding: '120px 0' }}>
        <div className="container" style={{ maxWidth: 800 }}>
          
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div className="section-tag" style={{ margin: '0 auto 16px' }}>
              <ShieldCheck size={14} /> Global B2B Network
            </div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900 }}>B2B <span style={{ color: 'var(--color-primary)' }}>Onboarding</span></h1>
          </div>

          {renderStepIndicator()}

          <div className="card" style={{ 
            padding: '48px', 
            boxShadow: '0 40px 100px rgba(0,0,0,0.08)', 
            position: 'relative', 
            overflow: 'hidden',
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.4)'
          }}>
            <div style={{ 
              position: 'absolute', top: 0, left: 0, width: '100%', height: 4, 
              background: `linear-gradient(to right, var(--color-primary) ${(step/5)*100}%, #eee 0%)`,
              transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
            }} />
            <AnimatePresence mode="wait">
              {renderStep()}
            </AnimatePresence>
          </div>

          <div style={{ marginTop: 60, display: 'flex', justifyContent: 'center', gap: 40 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>140+</div>
              <div style={{ fontSize: '0.7rem', color: '#888', textTransform: 'uppercase' }}>Verified Partners</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>24/7</div>
              <div style={{ fontSize: '0.7rem', color: '#888', textTransform: 'uppercase' }}>Export Support</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>Secure</div>
              <div style={{ fontSize: '0.7rem', color: '#888', textTransform: 'uppercase' }}>Trade Network</div>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        .animate-in { animation: slideIn 0.5s ease-out; }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .active-card {
          border-color: var(--color-primary) !important;
          box-shadow: 0 10px 30px rgba(26,77,46,0.1) !important;
        }
        .input {
          height: 56px;
          border-radius: var(--radius-sm);
        }
        .label {
          font-weight: 700;
          font-size: 0.85rem;
          margin-bottom: 8px;
          display: block;
        }
      `}</style>
    </>
  )
}

function PremiumUploader({ label, sub, onUpload }) {
  return (
    <div style={{ textAlign: 'left' }}>
      <label className="label">{label}</label>
      <motion.div 
        whileHover={{ scale: 1.01, borderColor: 'var(--color-primary)' }}
        whileTap={{ scale: 0.99 }}
        style={{ 
          border: '2px dashed var(--color-border)', 
          borderRadius: 16, 
          padding: '32px 20px', 
          textAlign: 'center', 
          cursor: 'pointer', 
          background: 'rgba(255,255,255,0.5)',
          transition: 'all 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12
        }}
      >
        <div style={{ 
          width: 48, height: 48, borderRadius: '50%', 
          background: 'rgba(26,77,46,0.05)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center' 
        }}>
          <Upload size={20} color="var(--color-primary)" />
        </div>
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-dark-green)' }}>{sub}</div>
          <div style={{ fontSize: '0.65rem', color: '#888', marginTop: 4 }}>Drag and drop or click to browse</div>
        </div>
      </motion.div>
    </div>
  )
}

function ExternalLink({ size, style }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" 
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
      <polyline points="15 3 21 3 21 9"></polyline>
      <line x1="10" y1="14" x2="21" y2="3"></line>
    </svg>
  )
}
