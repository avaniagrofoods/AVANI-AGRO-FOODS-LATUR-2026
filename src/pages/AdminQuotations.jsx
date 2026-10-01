import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import SEO from '../components/SEO'
import PasswordGate from '../components/PasswordGate'
import PrivateNav from '../components/PrivateNav'
import {
  FileText, Plus, Printer, Download, Trash2, Mail,
  Phone, Building2, MapPin, CheckCircle2, Clock,
  RefreshCw, Share2, Copy, Check, Eye, Edit, ChevronRight,
  Calculator, Search, Filter, ShieldCheck, X, FileCheck, Layers, Save
} from 'lucide-react'
import { BUSINESS_INFO, WHATSAPP_NUMBER } from '../data/links'
import { PRODUCT_MASTER, getProductById, matchProductMaster, parseQuantityKg, parseUnitRate, validateQuotation } from '../data/productMaster'
import {
  CANONICAL_QUOTATION_STATUSES,
  PROCESSOR_VERIFICATION_STATUSES,
  PROCESSOR_CHECKLIST_DEFINITIONS,
  SOURCING_POSITIONING_NOTICES,
  createInitialProcessorVerification,
  evaluateProcessorVerification,
  validateStatusTransition,
  transitionQuotationStatus,
  reviseQuotation,
  updateNegotiation,
  recordPoReceipt,
  updateProcessorChecklist,
  createQuotationFromLead
} from '../data/quotationModel'

const STATUS_LIST = [
  'ALL',
  'DRAFT',
  'PROCESSOR_CHECK',
  'READY_FOR_BUYER',
  'SENT_TO_BUYER',
  'NEGOTIATION',
  'REVISED',
  'ACCEPTED',
  'PO_RECEIVED',
  'CANCELLED'
]

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED']
const INCOTERMS = [
  'FOB NHAVA SHEVA (JNPT MUMBAI)',
  'FOB Destination Port',
  'CIF Destination Port',
  'CFR Destination Port',
  'EXW (Partner Facility)',
  'Air Cargo (Mumbai)'
]

const DEFAULT_TERMS = [
  '1. Payment Terms: 50% Advance Payment, Balance 50% Before Dispatch.',
  '2. Price Basis: FOB Shipment terms (Final port details to be confirmed by Buyer).',
  '3. Delivery Timeline: Shipment within 60–75 days from the date of advance payment confirmation.',
  '4. Packaging: 25 kg Food-Grade HDPE Bags included.',
  '5. Validity: This quotation is valid until 12 Oct 2026.',
  '6. Inspection: Pre-dispatch inspection permitted at seller\'s warehouse at buyer\'s cost.',
  '7. Jurisdiction: All disputes are subject to the exclusive jurisdiction of competent courts in Latur, Maharashtra, India.'
]

function formatNumber(num) {
  return Number(num || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

export default function AdminQuotations() {
  const [searchParams] = useSearchParams()
  const [quotations, setQuotations] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('list') // 'list', 'builder', 'preview', 'products'
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedQuote, setSelectedQuote] = useState(null)
  const [productMasterList, setProductMasterList] = useState(PRODUCT_MASTER)
  const [editingMasterId, setEditingMasterId] = useState(null)
  const [editMasterForm, setEditMasterForm] = useState({})

  // Modal / Transition State
  const [validationAlert, setValidationAlert] = useState(null)
  const [showRevisionModal, setShowRevisionModal] = useState(false)
  const [revisionReasonInput, setRevisionReasonInput] = useState('')
  const [showPoModal, setShowPoModal] = useState(false)
  const [poForm, setPoForm] = useState({ poNumber: '', poDate: new Date().toISOString().split('T')[0], poNotes: '' })
  const [showNegotiationModal, setShowNegotiationModal] = useState(false)
  const [negotiationForm, setNegotiationForm] = useState({ buyerRequestedPrice: '', buyerRequestedQuantity: '', requestedChanges: '', internalCounterOffer: '', note: '' })

  // Builder / Editor Form State
  const [builderForm, setBuilderForm] = useState({
    quoteId: `AAF-Q-2026-9075`,
    quotationId: `AAF-Q-2026-9075`,
    inquiryId: `AAF-INQ-2026-000001`,
    leadId: 'AAF-L-2026-1001',
    date: new Date().toISOString().split('T')[0],
    validUntil: '12 Oct 2026',
    buyerName: 'VIKRAM',
    companyName: 'VIKRAJA SOLAPUR',
    country: 'INDIA',
    destinationPort: 'NHAVA SHEVA (JNPT MUMBAI)',
    address: 'Solapur, Maharashtra, India',
    email: 'vikrajaexports@gmail.com',
    phone: '84464 19006',
    currency: 'INR',
    incoterm: INCOTERMS[0],
    origin: 'Latur, Maharashtra, India / JNPT Nhava Sheva, Mumbai',
    paymentTerms: '50% Advance Payment, Balance 50% Before Dispatch.',
    deliveryTimeline: 'Shipment within 60–75 days from the date of advance payment confirmation.',
    inspectionTerms: 'Pre-dispatch inspection permitted at seller\'s warehouse at buyer\'s cost.',
    jurisdiction: 'All disputes are subject to the exclusive jurisdiction of competent courts in Latur, Maharashtra, India.',
    packaging: '25 kg Food-Grade HDPE Bags included.',
    notes: 'Commercial trade offer coordinated by AVANI AGRO FOODS.',
    internalSupplierNote: '',
    items: [
      {
        id: 1,
        productId: 'moringa-leaf-powder',
        name: 'Moringa Leaf Powder',
        description: 'Moringa Leaf Powder\nNatural Green\n80–100 Mesh\nMoisture Max 7–8%\n100% Pure\n25 kg Food-Grade HDPE Bags',
        hscode: '12119029',
        quantity: 18000,
        unit: 'KG',
        rate: 350.00,
        amount: 6300000.00,
        packaging: '25 kg Food-Grade HDPE Bags'
      }
    ],
    freightCharges: 0,
    insuranceCharges: 0,
    documentationCharges: 0,
    otherCharges: 0,
    status: 'DRAFT',
    processorVerification: createInitialProcessorVerification(),
    commercialRequirement: {
      productId: 'moringa-leaf-powder',
      product: 'Moringa Leaf Powder',
      hsCode: '12119029',
      quantity: 18000,
      quantityUnit: 'KG',
      specification: 'Natural Green, 80–100 Mesh, Max 7–8% Moisture',
      mesh: '80–100 Mesh',
      moisture: 'Max 7–8%',
      packaging: '25 kg Food-Grade HDPE Bags',
      destinationPort: 'NHAVA SHEVA (JNPT MUMBAI)',
      incoterm: 'FOB NHAVA SHEVA (JNPT MUMBAI)',
      timeline: '60–75 Days',
      targetPrice: null
    },
    revision: {
      revisionNumber: 0,
      previousRevisionId: null,
      createdAt: new Date().toISOString(),
      changedBy: 'Sachin Shinde',
      changeReason: 'Initial Commercial Draft',
      changeSummary: 'Standard 18 MT export draft'
    },
    revisionHistory: [],
    negotiation: {
      buyerRequestedPrice: null,
      buyerRequestedQuantity: null,
      requestedChanges: '',
      internalCounterOffer: null,
      counterOfferDate: null,
      negotiationNotes: []
    },
    po: {
      poNumber: '',
      poDate: null,
      poFileReference: '',
      poNotes: '',
      receivedBy: ''
    },
    activity: []
  })

  // Load Quotations Data
  const loadData = async () => {
    setLoading(true)
    try {
      let serverQuotes = []
      try {
        const res = await fetch('/api/admin-quotations', {
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin'
        })
        if (res.ok) {
          const json = await res.json()
          serverQuotes = json.quotations || []
        }
      } catch (e) {
        console.warn('Server quote fetch error', e)
      }

      // Load local quotations & enquiries
      const localQuotes = JSON.parse(localStorage.getItem('avani_quotations') || '[]')
      const localEnquiries = JSON.parse(localStorage.getItem('avani_enquiries') || '[]')
      const enquiryQuotes = localEnquiries.map((e, idx) => {
        const pm = matchProductMaster(e.product || '')
        const qty = parseQuantityKg(e.quantityNormalizedKg || e.quantity, e.message || '')
        const fallbackRate = (e.currency === 'INR' || e.country?.toLowerCase().includes('india')) ? pm.defaultRateInr : pm.defaultRateUsd
        const rate = parseUnitRate(e.requestedPrice || e.targetPrice || e.rate, fallbackRate)
        return {
          quoteId: e.quoteId || `AAF-Q-2026-${2000 + idx}`,
          quotationId: e.quoteId || `AAF-Q-2026-${2000 + idx}`,
          inquiryId: e.inquiryId || `AAF-INQ-2026-${1000 + idx}`,
          leadId: e.inquiryId || `AAF-L-2026-${1000 + idx}`,
          date: e.date ? e.date.split(',')[0] : new Date().toISOString().split('T')[0],
          validUntil: '12 Oct 2026',
          buyerName: e.fullName || e.name || 'Direct Buyer',
          companyName: e.companyName || e.company || 'B2B Importer',
          country: e.country || 'India',
          email: e.email,
          phone: e.phone || '+91 7219053645',
          currency: e.currency || (e.country?.toLowerCase().includes('india') ? 'INR' : 'USD'),
          incoterm: e.incoterm || 'FOB NHAVA SHEVA (JNPT MUMBAI)',
          destinationPort: e.destinationPort || 'NHAVA SHEVA (JNPT MUMBAI)',
          subtotal: qty * rate,
          grandTotal: qty * rate,
          status: e.status || 'DRAFT',
          items: [
            {
              id: 1,
              productId: pm.productId,
              name: pm.productName,
              description: e.message || pm.fullDescription,
              hscode: pm.hsCode,
              quantity: qty,
              unit: 'KG',
              rate: rate,
              amount: qty * rate,
              packaging: pm.defaultPackaging
            }
          ]
        }
      })

      // Default sample 18 MT Vikram quotation if registry is empty
      const defaultVikramQuote = {
        quoteId: 'AAF-Q-2026-9075',
        quotationId: 'AAF-Q-2026-9075',
        inquiryId: 'AAF-INQ-2026-000001',
        leadId: 'AAF-L-2026-1001',
        date: '2026-09-29',
        validUntil: '12 Oct 2026',
        buyerName: 'VIKRAM',
        companyName: 'VIKRAJA SOLAPUR',
        country: 'INDIA',
        email: 'vikrajaexports@gmail.com',
        phone: '84464 19006',
        currency: 'INR',
        incoterm: 'FOB NHAVA SHEVA (JNPT MUMBAI)',
        destinationPort: 'NHAVA SHEVA (JNPT MUMBAI)',
        origin: 'Latur, Maharashtra, India / JNPT Nhava Sheva, Mumbai',
        subtotal: 6300000,
        freightCharges: 0,
        insuranceCharges: 0,
        documentationCharges: 0,
        grandTotal: 6300000,
        status: 'DRAFT',
        paymentTerms: '50% Advance Payment, Balance 50% Before Dispatch.',
        deliveryTimeline: 'Shipment within 60–75 days from the date of advance payment confirmation.',
        packaging: '25 kg Food-Grade HDPE Bags included.',
        commercialTerms: DEFAULT_TERMS,
        items: [
          {
            id: 1,
            productId: 'moringa-leaf-powder',
            name: 'Moringa Leaf Powder',
            description: 'Moringa Leaf Powder\nNatural Green\n80–100 Mesh\nMoisture Max 7–8%\n100% Pure\n25 kg Food-Grade HDPE Bags',
            hscode: '12119029',
            quantity: 18000,
            unit: 'KG',
            rate: 350.00,
            amount: 6300000.00,
            packaging: '25 kg Food-Grade HDPE Bags'
          }
        ]
      }

      const combined = [defaultVikramQuote, ...serverQuotes, ...enquiryQuotes, ...localQuotes]
      const unique = Array.from(new Map(combined.map(q => [q.quotationId || q.quoteId, q])).values())
      setQuotations(unique)

      // Also load custom product master overrides from localStorage
      const customPm = JSON.parse(localStorage.getItem('avani_product_master') || 'null')
      if (customPm && Array.isArray(customPm)) {
        setProductMasterList(customPm)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Handle URL pre-fill from Importers, Catalog, or Qualified Leads (P4.3)
  useEffect(() => {
    const tab = searchParams.get('tab')
    const qIdParam = searchParams.get('quotationId') || searchParams.get('quoteId')
    const lIdParam = searchParams.get('leadId')

    if (tab === 'builder' || qIdParam || lIdParam) {
      setActiveTab('builder')

      // 1. Try to find existing quotation by quotationId or leadId
      const localQuotes = JSON.parse(localStorage.getItem('avani_quotations') || '[]')
      let foundQuote = null
      if (qIdParam) {
        foundQuote = localQuotes.find(q => (q.quotationId === qIdParam || q.quoteId === qIdParam))
      }
      if (!foundQuote && lIdParam) {
        foundQuote = localQuotes.find(q => (q.leadId === lIdParam || q.inquiryId === lIdParam || q.source?.leadId === lIdParam))
      }

      if (foundQuote) {
        handleEditQuote(foundQuote)
        return
      }

      // 2. If no quotation exists yet but leadId is provided, try loading the lead from storage and auto-create draft
      if (lIdParam) {
        const localLeads = JSON.parse(localStorage.getItem('avani_leads') || '[]')
        const foundLead = localLeads.find(l => l.leadId === lIdParam)
        if (foundLead) {
          try {
            const newQuote = createQuotationFromLead(foundLead)
            const updated = [newQuote, ...localQuotes.filter(q => (q.quotationId || q.quoteId) !== newQuote.quotationId)]
            localStorage.setItem('avani_quotations', JSON.stringify(updated))
            setQuotations(prev => [newQuote, ...prev.filter(q => (q.quotationId || q.quoteId) !== newQuote.quotationId)])
            handleEditQuote(newQuote)
            return
          } catch (e) {
            console.warn('Could not auto-create quote from lead:', e.message)
          }
        }
      }

      // 3. Fallback URL param prefill
      const buyer = searchParams.get('buyer')
      const company = searchParams.get('company')
      const email = searchParams.get('email')
      const country = searchParams.get('country')
      const product = searchParams.get('product')
      const qtyParam = searchParams.get('qty')
      const incotermParam = searchParams.get('incoterm')
      const destParam = searchParams.get('dest')

      if (buyer || company || product) {
        const pm = product ? matchProductMaster(product) : PRODUCT_MASTER[0]
        const cleanQty = qtyParam ? parseQuantityKg(qtyParam) : 18000
        const isIndia = (country && country.toLowerCase().includes('india'))
        const defRate = isIndia ? pm.defaultRateInr : pm.defaultRateUsd
        setBuilderForm(prev => ({
          ...prev,
          quoteId: qIdParam || `AAF-Q-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          quotationId: qIdParam || `AAF-Q-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          leadId: lIdParam || prev.leadId,
          buyerName: buyer || prev.buyerName,
          companyName: company || prev.companyName,
          email: email || prev.email,
          country: country || prev.country,
          destinationPort: destParam || prev.destinationPort,
          incoterm: incotermParam || prev.incoterm,
          currency: isIndia ? 'INR' : prev.currency,
          items: [
            {
              id: 1,
              productId: pm.productId,
              name: pm.productName,
              description: pm.fullDescription,
              hscode: pm.hsCode,
              quantity: cleanQty,
              unit: 'KG',
              rate: defRate,
              amount: cleanQty * defRate,
              packaging: pm.defaultPackaging
            }
          ]
        }))
      }
    }
  }, [searchParams])

  // Item Management Handlers
  const handleAddItem = () => {
    const pm = PRODUCT_MASTER[0]
    const newItem = {
      id: Date.now(),
      productId: pm.productId,
      name: pm.productName,
      description: pm.fullDescription,
      hscode: pm.hsCode,
      quantity: 1000,
      unit: 'KG',
      rate: builderForm.currency === 'INR' ? pm.defaultRateInr : pm.defaultRateUsd,
      amount: 1000 * (builderForm.currency === 'INR' ? pm.defaultRateInr : pm.defaultRateUsd),
      packaging: pm.defaultPackaging
    }
    setBuilderForm(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }))
  }

  const handleProductSelect = (itemId, prodId) => {
    const pm = getProductById(prodId)
    setBuilderForm(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === itemId) {
          const rate = builderForm.currency === 'INR' ? pm.defaultRateInr : pm.defaultRateUsd
          const amount = item.quantity * rate
          return {
            ...item,
            productId: pm.productId,
            name: pm.productName,
            description: pm.fullDescription,
            hscode: pm.hsCode,
            rate,
            amount,
            packaging: pm.defaultPackaging
          }
        }
        return item
      })
    }))
  }

  // Helper: Sanitize & normalize quotation to ensure exact numeric parity
  const sanitizeQuote = (q) => {
    if (!q) return q
    const cleanedItems = (q.items || []).map((item, idx) => {
      const qNum = typeof item.quantity === 'number' 
        ? item.quantity 
        : parseFloat(String(item.quantity || 0).replace(/,/g, '').replace(/[^\d.]/g, ''))
      const quantity = !isNaN(qNum) ? qNum : 0

      const rNum = typeof item.rate === 'number'
        ? item.rate
        : parseFloat(String(item.rate !== undefined && item.rate !== null && item.rate !== '' ? item.rate : (item.unitRate || 0)).replace(/,/g, '').replace(/[^0-9.]/g, ''))
      const rate = !isNaN(rNum) ? rNum : 0

      const amount = Number((quantity * rate).toFixed(2))
      return {
        ...item,
        sr: idx + 1,
        quantity,
        rate,
        amount
      }
    })

    const subtotal = Number(cleanedItems.reduce((sum, i) => sum + i.amount, 0).toFixed(2))
    const freight = Number(Number(q.freightCharges || q.freight || 0).toFixed(2))
    const insurance = Number(Number(q.insuranceCharges || q.insurance || 0).toFixed(2))
    const documentation = Number(Number(q.documentationCharges || q.documentation || 0).toFixed(2))
    const otherCharges = Number(Number(q.otherCharges || 0).toFixed(2))
    const grandTotal = Number((subtotal + freight + insurance + documentation + otherCharges).toFixed(2))

    return {
      ...q,
      items: cleanedItems,
      subtotal,
      grandTotal,
      freightCharges: freight,
      insuranceCharges: insurance,
      documentationCharges: documentation,
      otherCharges
    }
  }

  const handleUpdateItem = (id, field, value) => {
    setBuilderForm(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: value }
          if (field === 'quantity') {
            const cleanQty = typeof value === 'string' ? parseFloat(value.replace(/,/g, '').replace(/[^\d.]/g, '')) : Number(value)
            const q = !isNaN(cleanQty) ? cleanQty : 0
            const r = typeof item.rate === 'string' ? parseFloat(item.rate.replace(/,/g, '').replace(/[^0-9.]/g, '')) || 0 : Number(item.rate) || 0
            updated.amount = Number((q * r).toFixed(2))
          } else if (field === 'rate') {
            const cleanRate = typeof value === 'string' ? parseFloat(value.replace(/,/g, '').replace(/[^0-9.]/g, '')) : Number(value)
            const r = !isNaN(cleanRate) ? cleanRate : 0
            const q = typeof item.quantity === 'string' ? parseFloat(item.quantity.replace(/,/g, '').replace(/[^\d.]/g, '')) || 0 : Number(item.quantity) || 0
            updated.amount = Number((q * r).toFixed(2))
          }
          return updated
        }
        return item
      })
    }))
  }

  const handleRemoveItem = (id) => {
    if (builderForm.items.length <= 1) return
    setBuilderForm(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }))
  }

  // Calculations
  const itemsSubtotal = Number(builderForm.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0).toFixed(2))
  const grandTotal = Number((
    itemsSubtotal +
    (Number(builderForm.freightCharges) || 0) +
    (Number(builderForm.insuranceCharges) || 0) +
    (Number(builderForm.documentationCharges) || 0) +
    (Number(builderForm.otherCharges) || 0)
  ).toFixed(2))

  // Edit Existing Quotation
  const handleEditQuote = (q) => {
    const sanitized = sanitizeQuote(q)
    const qId = q.quotationId || sanitized.quoteId || `AAF-Q-2026-${Math.floor(1000 + Math.random() * 9000)}`
    const lId = q.leadId || sanitized.inquiryId || q.source?.leadId || 'AAF-L-2026-1001'
    const bName = q.buyer?.name || sanitized.buyerName || sanitized.customerName || ''
    const comp = q.buyer?.company || sanitized.companyName || ''
    const ctry = q.buyer?.country || sanitized.country || 'INDIA'
    const mail = q.buyer?.email || sanitized.email || ''
    const ph = q.buyer?.phone || sanitized.phone || ''

    const commReq = q.commercialRequirement || {
      product: sanitized.items?.[0]?.name || sanitized.product || 'Moringa Leaf Powder',
      quantity: sanitized.items?.[0]?.quantity || 18000,
      quantityUnit: 'KG',
      specification: sanitized.items?.[0]?.description || '',
      mesh: '80–100 Mesh',
      moisture: 'Max 7–8%',
      packaging: '25 kg Food-Grade HDPE Bags',
      destinationPort: sanitized.destinationPort || 'NHAVA SHEVA (JNPT MUMBAI)',
      incoterm: sanitized.incoterm || INCOTERMS[0],
      timeline: '60–75 Days',
      targetPrice: null
    }

    const pv = q.processorVerification || createInitialProcessorVerification()
    const rev = q.revision || { revisionNumber: 0, previousRevisionId: null, changeReason: 'Initial Draft' }
    const revHist = q.revisionHistory || []
    const neg = q.negotiation || { buyerRequestedPrice: null, buyerRequestedQuantity: null, requestedChanges: '', internalCounterOffer: null, negotiationNotes: [] }
    const po = q.po || { poNumber: '', poDate: null, poFileReference: '', poNotes: '', receivedBy: '' }
    const act = q.activity || []

    setBuilderForm({
      quoteId: qId,
      quotationId: qId,
      inquiryId: lId || sanitized.inquiryId,
      leadId: lId,
      date: sanitized.date || new Date().toISOString().split('T')[0],
      validUntil: sanitized.validUntil || '12 Oct 2026',
      buyerName: bName,
      companyName: comp,
      country: ctry,
      destinationPort: sanitized.destinationPort || 'NHAVA SHEVA (JNPT MUMBAI)',
      address: sanitized.address || '',
      email: mail,
      phone: ph,
      currency: sanitized.currency || 'INR',
      incoterm: sanitized.incoterm || INCOTERMS[0],
      origin: sanitized.origin || 'Latur, Maharashtra, India / JNPT Nhava Sheva, Mumbai',
      paymentTerms: sanitized.paymentTerms || '50% Advance Payment, Balance 50% Before Dispatch.',
      deliveryTimeline: sanitized.deliveryTimeline || 'Shipment within 60–75 days from the date of advance payment confirmation.',
      inspectionTerms: sanitized.inspectionTerms || 'Pre-dispatch inspection permitted at seller\'s warehouse at buyer\'s cost.',
      jurisdiction: sanitized.jurisdiction || 'All disputes are subject to the exclusive jurisdiction of competent courts in Latur, Maharashtra, India.',
      packaging: sanitized.packaging || '25 kg Food-Grade HDPE Bags included.',
      notes: sanitized.notes || 'Commercial trade offer coordinated by AVANI AGRO FOODS.',
      internalSupplierNote: sanitized.internalSupplierNote || '',
      items: sanitized.items && sanitized.items.length > 0 ? sanitized.items : [
        {
          id: 1,
          productId: 'moringa-leaf-powder',
          name: sanitized.product || 'Moringa Leaf Powder',
          description: sanitized.description || 'Moringa Leaf Powder — Natural Green — 80–100 Mesh — 25 kg Food-Grade HDPE Bags',
          hscode: sanitized.hsCode || sanitized.hscode || '12119029',
          quantity: Number(sanitized.quantityKg || sanitized.quantity) || 18000,
          unit: sanitized.unit || 'KG',
          rate: Number(sanitized.unitRate !== undefined ? sanitized.unitRate : sanitized.rate) || 350,
          amount: (Number(sanitized.quantityKg || sanitized.quantity) || 18000) * (Number(sanitized.unitRate !== undefined ? sanitized.unitRate : sanitized.rate) || 350),
          packaging: '25 kg Food-Grade HDPE Bags'
        }
      ],
      freightCharges: sanitized.freightCharges || 0,
      insuranceCharges: sanitized.insuranceCharges || 0,
      documentationCharges: sanitized.documentationCharges || 0,
      otherCharges: sanitized.otherCharges || 0,
      status: sanitized.status || 'DRAFT',
      processorVerification: pv,
      commercialRequirement: commReq,
      revision: rev,
      revisionHistory: revHist,
      negotiation: neg,
      po: po,
      activity: act
    })
    setValidationAlert(null)
    setActiveTab('builder')
  }

  // P4.3 Processor Verification Handlers
  const handleProcessorCheckToggle = (key, value) => {
    setBuilderForm(prev => {
      const updatedPV = {
        ...(prev.processorVerification || createInitialProcessorVerification()),
        [key]: value
      }
      updatedPV.status = evaluateProcessorVerification(updatedPV)
      return {
        ...prev,
        processorVerification: updatedPV
      }
    })
  }

  const handleAdminOverrideToggle = (override, reason) => {
    setBuilderForm(prev => {
      const updatedPV = {
        ...(prev.processorVerification || createInitialProcessorVerification()),
        adminOverride: override,
        overrideReason: reason !== undefined ? reason : (prev.processorVerification?.overrideReason || '')
      }
      updatedPV.status = evaluateProcessorVerification(updatedPV)
      return {
        ...prev,
        processorVerification: updatedPV
      }
    })
  }

  // P4.3 Workflow State Machine Transition
  const handleStatusTransition = (targetStatus, details = {}) => {
    const currentQuote = {
      ...builderForm,
      quotationId: builderForm.quoteId || builderForm.quotationId,
      status: builderForm.status,
      buyer: {
        name: builderForm.buyerName,
        company: builderForm.companyName,
        email: builderForm.email,
        country: builderForm.country
      },
      commercialRequirement: builderForm.commercialRequirement || {
        product: builderForm.items[0]?.name,
        quantity: builderForm.items[0]?.quantity,
        destinationPort: builderForm.destinationPort
      },
      quotation: {
        items: builderForm.items,
        grandTotal: grandTotal
      },
      processorVerification: builderForm.processorVerification
    }

    const check = validateStatusTransition(builderForm.status, targetStatus, currentQuote, details)
    if (!check.allowed) {
      setValidationAlert({
        targetStatus,
        reason: check.reason,
        checklist: check.checklist
      })
      alert(`Cannot transition to ${targetStatus}: ${check.reason}`)
      return
    }

    setValidationAlert(null)
    const now = new Date().toISOString()
    const updatedForm = {
      ...builderForm,
      status: targetStatus,
      updatedAt: now,
      activity: [
        ...(builderForm.activity || []),
        {
          timestamp: now,
          actor: 'Sachin Shinde',
          event: targetStatus === 'PROCESSOR_CHECK' ? 'PROCESSOR_CHECK_STARTED'
            : targetStatus === 'READY_FOR_BUYER' ? 'QUOTATION_UPDATED'
            : targetStatus === 'SENT_TO_BUYER' ? 'QUOTATION_SENT'
            : targetStatus === 'NEGOTIATION' ? 'NEGOTIATION_STARTED'
            : targetStatus === 'ACCEPTED' ? 'QUOTATION_ACCEPTED'
            : targetStatus === 'PO_RECEIVED' ? 'PO_RECEIVED'
            : 'QUOTATION_CANCELLED',
          quotationId: builderForm.quoteId,
          details: details.reason || `Status transitioned to ${targetStatus}`
        }
      ]
    }
    setBuilderForm(updatedForm)

    // Save to storage
    const existing = JSON.parse(localStorage.getItem('avani_quotations') || '[]')
    const updated = [updatedForm, ...existing.filter(q => (q.quotationId || q.quoteId) !== updatedForm.quoteId)]
    localStorage.setItem('avani_quotations', JSON.stringify(updated))
    setQuotations(prev => [updatedForm, ...prev.filter(q => (q.quotationId || q.quoteId) !== updatedForm.quoteId)])
    alert(`Quotation status transitioned to ${targetStatus}!`)
  }

  // P4.3 Revision Handler
  const handleCreateRevisionSubmit = () => {
    if (!revisionReasonInput.trim()) {
      alert('Please provide a reason for this commercial revision.')
      return
    }
    const currentRev = builderForm.revision?.revisionNumber || 0
    const newRev = currentRev + 1
    const now = new Date().toISOString()

    const snapshot = {
      revisionNumber: currentRev,
      previousRevisionId: builderForm.revision?.previousRevisionId || null,
      savedAt: now,
      changedBy: 'Sachin Shinde',
      changeReason: builderForm.revision?.changeReason || 'Previous Revision',
      changeSummary: `Revision ${currentRev}`,
      items: JSON.parse(JSON.stringify(builderForm.items)),
      grandTotal: grandTotal
    }

    const updated = {
      ...builderForm,
      status: 'REVISED',
      revision: {
        revisionNumber: newRev,
        previousRevisionId: `${builderForm.quoteId}-R${currentRev}`,
        createdAt: now,
        changedBy: 'Sachin Shinde',
        changeReason: revisionReasonInput.trim(),
        changeSummary: `Commercial Rev ${newRev}`
      },
      revisionHistory: [...(builderForm.revisionHistory || []), snapshot],
      activity: [
        ...(builderForm.activity || []),
        {
          timestamp: now,
          actor: 'Sachin Shinde',
          event: 'QUOTATION_REVISED',
          quotationId: builderForm.quoteId,
          details: `Revision ${newRev} created: ${revisionReasonInput.trim()}`
        }
      ]
    }

    setBuilderForm(updated)
    const existing = JSON.parse(localStorage.getItem('avani_quotations') || '[]')
    const updatedList = [updated, ...existing.filter(q => (q.quotationId || q.quoteId) !== updated.quoteId)]
    localStorage.setItem('avani_quotations', JSON.stringify(updatedList))
    setQuotations(prev => [updated, ...prev.filter(q => (q.quotationId || q.quoteId) !== updated.quoteId)])
    setShowRevisionModal(false)
    setRevisionReasonInput('')
    alert(`Revision ${newRev} created successfully.`)
  }

  // P4.3 PO Receipt Handler
  const handleRecordPoSubmit = () => {
    if (!poForm.poNumber.trim()) {
      alert('PO Number is mandatory to record PO receipt.')
      return
    }
    const now = new Date().toISOString()
    const updated = {
      ...builderForm,
      status: 'PO_RECEIVED',
      po: {
        poNumber: poForm.poNumber.trim(),
        poDate: poForm.poDate || now.split('T')[0],
        poNotes: poForm.poNotes.trim(),
        receivedBy: 'Sachin Shinde'
      },
      activity: [
        ...(builderForm.activity || []),
        {
          timestamp: now,
          actor: 'Sachin Shinde',
          event: 'PO_RECEIVED',
          quotationId: builderForm.quoteId,
          details: `PO ${poForm.poNumber.trim()} received`
        }
      ]
    }
    setBuilderForm(updated)
    const existing = JSON.parse(localStorage.getItem('avani_quotations') || '[]')
    const updatedList = [updated, ...existing.filter(q => (q.quotationId || q.quoteId) !== updated.quoteId)]
    localStorage.setItem('avani_quotations', JSON.stringify(updatedList))
    setQuotations(prev => [updated, ...prev.filter(q => (q.quotationId || q.quoteId) !== updated.quoteId)])
    setShowPoModal(false)
    alert(`Purchase Order ${poForm.poNumber.trim()} recorded successfully. Status set to PO_RECEIVED.`)
  }

  // P4.3 Negotiation Handler
  const handleNegotiationSubmit = () => {
    const now = new Date().toISOString()
    const updated = {
      ...builderForm,
      status: 'NEGOTIATION',
      negotiation: {
        buyerRequestedPrice: negotiationForm.buyerRequestedPrice ? parseUnitRate(negotiationForm.buyerRequestedPrice, null) : builderForm.negotiation?.buyerRequestedPrice,
        buyerRequestedQuantity: negotiationForm.buyerRequestedQuantity ? parseQuantityKg(negotiationForm.buyerRequestedQuantity) : builderForm.negotiation?.buyerRequestedQuantity,
        requestedChanges: negotiationForm.requestedChanges || builderForm.negotiation?.requestedChanges || '',
        internalCounterOffer: negotiationForm.internalCounterOffer ? parseUnitRate(negotiationForm.internalCounterOffer, null) : builderForm.negotiation?.internalCounterOffer,
        counterOfferDate: negotiationForm.internalCounterOffer ? now : builderForm.negotiation?.counterOfferDate,
        negotiationNotes: negotiationForm.note ? [
          ...(builderForm.negotiation?.negotiationNotes || []),
          { date: now, author: 'Sachin Shinde', note: negotiationForm.note.trim() }
        ] : (builderForm.negotiation?.negotiationNotes || [])
      },
      activity: [
        ...(builderForm.activity || []),
        {
          timestamp: now,
          actor: 'Sachin Shinde',
          event: 'NEGOTIATION_UPDATED',
          quotationId: builderForm.quoteId,
          details: negotiationForm.note || 'Updated negotiation terms'
        }
      ]
    }
    setBuilderForm(updated)
    const existing = JSON.parse(localStorage.getItem('avani_quotations') || '[]')
    const updatedList = [updated, ...existing.filter(q => (q.quotationId || q.quoteId) !== updated.quoteId)]
    localStorage.setItem('avani_quotations', JSON.stringify(updatedList))
    setQuotations(prev => [updated, ...prev.filter(q => (q.quotationId || q.quoteId) !== updated.quoteId)])
    setShowNegotiationModal(false)
    alert('Negotiation terms recorded.')
  }

  // Duplicate Quotation Handler (Copies current saved values with new quoteId)
  const handleDuplicateQuote = (q) => {
    const newQuoteId = `AAF-Q-2026-${Math.floor(1000 + Math.random() * 9000)}`
    const duplicated = sanitizeQuote({
      ...q,
      quoteId: newQuoteId,
      date: new Date().toISOString().split('T')[0],
      status: 'DRAFT',
      updatedAt: new Date().toISOString()
    })
    const existing = JSON.parse(localStorage.getItem('avani_quotations') || '[]')
    const updated = [duplicated, ...existing.filter(item => item.quoteId !== duplicated.quoteId)]
    localStorage.setItem('avani_quotations', JSON.stringify(updated))
    setQuotations(prev => [duplicated, ...prev.filter(item => item.quoteId !== duplicated.quoteId)])
    setSelectedQuote(duplicated)
    setActiveTab('preview')
  }

  // Save Quotation Handler (Local + Server API + Google Sheets CRM sync)
  const handleSaveQuotation = async (e) => {
    e.preventDefault()
    
    // Validate quotation integrity
    const validation = validateQuotation(builderForm)
    if (!validation.valid) {
      alert(validation.error)
      return
    }

    const record = sanitizeQuote({
      ...builderForm,
      quotationId: builderForm.quoteId || builderForm.quotationId,
      leadId: builderForm.leadId || builderForm.inquiryId,
      customerName: builderForm.buyerName,
      commercialTerms: DEFAULT_TERMS,
      product: builderForm.items.map(i => i.name).join(' + '),
      processorVerification: builderForm.processorVerification,
      commercialRequirement: builderForm.commercialRequirement,
      revision: builderForm.revision,
      revisionHistory: builderForm.revisionHistory,
      negotiation: builderForm.negotiation,
      po: builderForm.po,
      activity: builderForm.activity,
      updatedAt: new Date().toISOString(),
      updatedBy: 'Admin (Sachin Shinde)'
    })

    // Save locally
    const existing = JSON.parse(localStorage.getItem('avani_quotations') || '[]')
    const updated = [record, ...existing.filter(q => (q.quoteId !== record.quoteId && q.quotationId !== record.quoteId))]
    localStorage.setItem('avani_quotations', JSON.stringify(updated))

    setQuotations(prev => [record, ...prev.filter(q => (q.quoteId !== record.quoteId && q.quotationId !== record.quoteId))])
    setSelectedQuote(record)

    // Save to server & Google Sheets CRM
    try {
      await fetch('/api/admin-quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          quoteData: record
        })
      })
    } catch (apiErr) {
      console.warn('Admin quote API sync error:', apiErr)
    }

    setActiveTab('preview')
  }

  // Status Change Handler
  const handleStatusChange = (quoteId, newStatus) => {
    const updated = quotations.map(q => q.quoteId === quoteId ? { ...q, status: newStatus } : q)
    setQuotations(updated)
    localStorage.setItem('avani_quotations', JSON.stringify(updated))
  }

  // Delete Quotation Handler
  const handleDeleteQuote = (quoteId) => {
    if (!window.confirm(`Delete quotation ${quoteId}?`)) return
    const updated = quotations.filter(q => q.quoteId !== quoteId)
    setQuotations(updated)
    localStorage.setItem('avani_quotations', JSON.stringify(updated))
    if (selectedQuote?.quoteId === quoteId) setSelectedQuote(null)
  }

  // Download PDF Action with clean numeric parity
  const handleDownloadPdf = async (quote) => {
    try {
      const payload = sanitizeQuote(quote)
      const res = await fetch('/api/quotation?action=download-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `Quotation_${payload.quoteId}.pdf`
        document.body.appendChild(a)
        a.click()
        a.remove()
      } else {
        alert('Serverless PDF generation unavailable. Printing browser view.')
        window.print()
      }
    } catch (err) {
      window.print()
    }
  }

  // Download DOCX Action with clean numeric parity
  const handleDownloadDocx = async (quote) => {
    try {
      const payload = sanitizeQuote(quote)
      const res = await fetch('/api/quotation?action=download-docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `Quotation_${payload.quoteId}.docx`
        document.body.appendChild(a)
        a.click()
        a.remove()
      } else {
        alert('Serverless DOCX generation unavailable.')
      }
    } catch (err) {
      alert('Error downloading Word document: ' + err.message)
    }
  }

  // Product Master Inline Editing
  const handleStartEditMaster = (pm) => {
    setEditingMasterId(pm.productId)
    setEditMasterForm({ ...pm })
  }

  const handleSaveMaster = (productId) => {
    const updated = productMasterList.map(p => p.productId === productId ? { ...editMasterForm, lastUpdated: new Date().toISOString() } : p)
    setProductMasterList(updated)
    localStorage.setItem('avani_product_master', JSON.stringify(updated))
    setEditingMasterId(null)
    alert(`Product Master for ${editMasterForm.productName} updated successfully! HS Code is now: ${editMasterForm.hsCode}`)
  }

  // Filtered Quotations
  const filteredQuotations = quotations.filter(q => {
    const matchStatus = statusFilter === 'ALL' || q.status === statusFilter
    const query = searchQuery.toLowerCase()
    const matchSearch = !query ||
      q.quoteId?.toLowerCase().includes(query) ||
      q.buyerName?.toLowerCase().includes(query) ||
      q.customerName?.toLowerCase().includes(query) ||
      q.companyName?.toLowerCase().includes(query) ||
      q.country?.toLowerCase().includes(query)
    return matchStatus && matchSearch
  })

  return (
    <PasswordGate
      title="Quotation Management Portal"
      description="Authentication required to manage proforma quotations and commercial pricing."
      onUnlock={loadData}
    >
      <SEO
        title="Quotation Management Portal | AVANI AGRO FOODS"
        description="Private quotation and pricing management."
        noindex={true}
      />

      <PrivateNav onLogout={() => window.location.reload()} />

      <div className="page-top" style={{ minHeight: '100vh', background: '#f8faf8', paddingBottom: 80 }}>
        
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #0a1f0d, #1a4d2e)', padding: '40px 0 32px', color: 'white' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div className="section-tag" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', display: 'inline-flex', marginBottom: 10 }}>
                  💼 Commercial Export Proforma Desk
                </div>
                <h1 style={{ fontSize: 'clamp(1.7rem, 3vw, 2.3rem)', fontWeight: 900, color: 'white', marginBottom: 4 }}>
                  Quotation Management System
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.88rem', margin: 0 }}>
                  Unified quotation architecture (`AAF-Q-2026-XXXX`), dynamic calculations, and instant PDF/DOCX generation.
                </p>
              </div>

              {/* Tab Selector */}
              <div style={{ display: 'flex', gap: 8, background: 'rgba(255,255,255,0.1)', padding: 4, borderRadius: 8, flexWrap: 'wrap' }}>
                <button
                  onClick={() => setActiveTab('list')}
                  className="btn"
                  style={{
                    padding: '8px 16px',
                    fontSize: '0.82rem',
                    borderRadius: 6,
                    background: activeTab === 'list' ? 'var(--color-primary)' : 'transparent',
                    color: 'white',
                    border: 'none'
                  }}
                >
                  Quotations Registry ({quotations.length})
                </button>
                <button
                  onClick={() => {
                    setBuilderForm(prev => ({
                      ...prev,
                      quoteId: `AAF-Q-2026-${Math.floor(1000 + Math.random() * 9000)}`,
                      inquiryId: `AAF-INQ-2026-${Math.floor(100000 + Math.random() * 900000)}`,
                      date: new Date().toISOString().split('T')[0]
                    }))
                    setActiveTab('builder')
                  }}
                  className="btn"
                  style={{
                    padding: '8px 16px',
                    fontSize: '0.82rem',
                    borderRadius: 6,
                    background: activeTab === 'builder' ? 'var(--color-primary)' : 'transparent',
                    color: 'white',
                    border: 'none',
                    gap: 6
                  }}
                >
                  <Plus size={14} /> New / Edit Quotation
                </button>
                <button
                  onClick={() => setActiveTab('products')}
                  className="btn"
                  style={{
                    padding: '8px 16px',
                    fontSize: '0.82rem',
                    borderRadius: 6,
                    background: activeTab === 'products' ? 'var(--color-primary)' : 'transparent',
                    color: 'white',
                    border: 'none',
                    gap: 6
                  }}
                >
                  <Layers size={14} /> Product Master
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="container" style={{ paddingTop: 28 }}>

          {/* ══════════════════════════════════════════════════════════ */}
          {/* TAB 1: QUOTATIONS LIST / CRM REGISTRY                     */}
          {/* ══════════════════════════════════════════════════════════ */}
          {activeTab === 'list' && (
            <div>
              {/* Search & Status Filters */}
              <div className="card" style={{ padding: '18px 24px', background: 'white', marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
                  <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: 440 }}>
                    <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-light)' }} />
                    <input
                      className="input"
                      style={{ paddingLeft: 40, height: 40, fontSize: '0.85rem', background: 'var(--color-bg-alt)' }}
                      placeholder="Search Quote ID, buyer name, company, country..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {/* Status Pills */}
                  <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
                    {STATUS_LIST.slice(0, 7).map(st => (
                      <button
                        key={st}
                        onClick={() => setStatusFilter(st)}
                        className="btn"
                        style={{
                          padding: '6px 12px',
                          fontSize: '0.75rem',
                          borderRadius: 14,
                          fontWeight: 700,
                          background: statusFilter === st ? 'var(--color-primary)' : 'var(--color-bg-alt)',
                          color: statusFilter === st ? 'white' : 'var(--color-text)',
                          border: statusFilter === st ? '1px solid var(--color-primary)' : '1px solid var(--color-border)'
                        }}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                {filteredQuotations.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--color-text-light)' }}>
                    No quotations found. Click <strong>"New Quotation"</strong> to create your first proforma.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ background: 'var(--color-bg-alt)', borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                          <th style={{ padding: '12px 16px' }}>Quote Number</th>
                          <th style={{ padding: '12px 16px' }}>Date</th>
                          <th style={{ padding: '12px 16px' }}>Buyer &amp; Company</th>
                          <th style={{ padding: '12px 16px' }}>Country</th>
                          <th style={{ padding: '12px 16px' }}>Incoterm</th>
                          <th style={{ padding: '12px 16px' }}>Grand Total</th>
                          <th style={{ padding: '12px 16px' }}>Status</th>
                          <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredQuotations.map((q) => (
                          <tr key={q.quoteId} style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <td style={{ padding: '14px 16px', fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'monospace' }}>
                              {q.quoteId}
                            </td>
                            <td style={{ padding: '14px 16px', color: 'var(--color-text-light)', fontSize: '0.8rem' }}>
                              {q.date}
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <div style={{ fontWeight: 700 }}>{q.buyerName || q.customerName}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>{q.companyName}</div>
                            </td>
                            <td style={{ padding: '14px 16px' }}>{q.country}</td>
                            <td style={{ padding: '14px 16px' }}>{q.incoterm || 'FOB'}</td>
                            <td style={{ padding: '14px 16px', fontWeight: 900, color: 'var(--color-text)' }}>
                              {q.currency || 'INR'} {formatNumber(q.grandTotal)}
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <select
                                value={q.status || 'DRAFT'}
                                onChange={e => handleStatusChange(q.quoteId, e.target.value)}
                                style={{
                                  padding: '4px 8px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  borderRadius: 4,
                                  border: '1px solid var(--color-border)',
                                  background: q.status === 'ACCEPTED' || q.status === 'SENT' ? '#f0fdf4' : '#fffbeb',
                                  color: q.status === 'ACCEPTED' || q.status === 'SENT' ? '#166534' : '#92400e'
                                }}
                              >
                                {STATUS_LIST.filter(s => s !== 'ALL').map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </td>
                            <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                <button
                                  onClick={() => handleEditQuote(q)}
                                  className="btn"
                                  style={{ padding: '5px 8px', fontSize: '0.75rem', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}
                                  title="Edit Quotation"
                                >
                                  <Edit size={13} /> Edit
                                </button>
                                <button
                                  onClick={() => { setSelectedQuote(q); setActiveTab('preview'); }}
                                  className="btn"
                                  style={{ padding: '5px 8px', fontSize: '0.75rem', background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)' }}
                                  title="View Printable Quotation"
                                >
                                  <Eye size={13} /> View
                                </button>
                                <button
                                  onClick={() => handleDuplicateQuote(q)}
                                  className="btn"
                                  style={{ padding: '5px 8px', fontSize: '0.75rem', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}
                                  title="Duplicate Quotation (Copies saved values)"
                                >
                                  <Copy size={13} /> Copy
                                </button>
                                <button
                                  onClick={() => handleDownloadPdf(q)}
                                  className="btn"
                                  style={{ padding: '5px 8px', fontSize: '0.75rem', background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)' }}
                                  title="Download Vector PDF"
                                >
                                  <Download size={13} /> PDF
                                </button>
                                <button
                                  onClick={() => handleDownloadDocx(q)}
                                  className="btn"
                                  style={{ padding: '5px 8px', fontSize: '0.75rem', background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)' }}
                                  title="Download Word Document (.DOCX)"
                                >
                                  <FileText size={13} /> DOCX
                                </button>
                                <button
                                  onClick={() => handleDeleteQuote(q.quoteId)}
                                  className="btn"
                                  style={{ padding: '5px 8px', fontSize: '0.75rem', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}
                                  title="Delete Quotation"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* TAB 2: INTERACTIVE QUOTATION BUILDER & EDITOR             */}
          {/* ══════════════════════════════════════════════════════════ */}
          {activeTab === 'builder' && (
            <div className="card" style={{ padding: '36px', background: 'white', maxWidth: 900, margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, borderBottom: '1px solid var(--color-border)', paddingBottom: 16 }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 900, margin: 0, color: 'var(--color-text)' }}>
                    Commercial Quotation Editor
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', margin: '4px 0 0' }}>
                    Configure export items, Incoterms, currency, full specifications, and commercial terms.
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 900,
                      padding: '4px 10px',
                      borderRadius: 12,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      background: builderForm.status === 'PO_RECEIVED' ? '#ecfdf5' : builderForm.status === 'ACCEPTED' ? '#dcfce7' : builderForm.status === 'READY_FOR_BUYER' ? '#eff6ff' : builderForm.status === 'PROCESSOR_CHECK' ? '#f5f3ff' : builderForm.status === 'CANCELLED' ? '#fef2f2' : '#fffbeb',
                      color: builderForm.status === 'PO_RECEIVED' ? '#065f46' : builderForm.status === 'ACCEPTED' ? '#166534' : builderForm.status === 'READY_FOR_BUYER' ? '#1d4ed8' : builderForm.status === 'PROCESSOR_CHECK' ? '#6d28d9' : builderForm.status === 'CANCELLED' ? '#991b1b' : '#92400e',
                      border: '1px solid currentColor'
                    }}>
                      Status: {builderForm.status || 'DRAFT'}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '4px 8px', borderRadius: 6, background: '#f1f5f9', color: '#475569' }}>
                      Rev {builderForm.revision?.revisionNumber || 0}
                    </span>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-primary)', background: 'var(--color-bg-alt)', padding: '6px 14px', borderRadius: 6, fontFamily: 'monospace' }}>
                      {builderForm.quoteId}
                    </div>
                  </div>
                  {builderForm.leadId && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginTop: 4 }}>
                      Lead Ref: <strong>{builderForm.leadId}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* P4.3 WORKFLOW STATE ACTIONS BAR */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '14px 18px', marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>
                      Commercial Workflow Actions:
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {builderForm.status === 'DRAFT' && (
                      <button
                        type="button"
                        onClick={() => handleStatusTransition('PROCESSOR_CHECK')}
                        className="btn"
                        style={{ padding: '6px 12px', fontSize: '0.78rem', background: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe', fontWeight: 700 }}
                      >
                        Initiate Processor Check →
                      </button>
                    )}
                    {builderForm.status === 'PROCESSOR_CHECK' && (
                      <button
                        type="button"
                        onClick={() => handleStatusTransition('READY_FOR_BUYER')}
                        className="btn"
                        style={{ padding: '6px 12px', fontSize: '0.78rem', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', fontWeight: 700 }}
                      >
                        Mark Ready for Buyer →
                      </button>
                    )}
                    {builderForm.status === 'READY_FOR_BUYER' && (
                      <button
                        type="button"
                        onClick={() => handleStatusTransition('SENT_TO_BUYER')}
                        className="btn"
                        style={{ padding: '6px 12px', fontSize: '0.78rem', background: '#312e81', color: 'white', border: 'none', fontWeight: 700 }}
                      >
                        Mark Sent to Buyer →
                      </button>
                    )}
                    {['READY_FOR_BUYER', 'SENT_TO_BUYER', 'NEGOTIATION'].includes(builderForm.status) && (
                      <button
                        type="button"
                        onClick={() => setShowNegotiationModal(true)}
                        className="btn"
                        style={{ padding: '6px 12px', fontSize: '0.78rem', background: '#fff7ed', color: '#c2410c', border: '1px solid #ffedd5', fontWeight: 700 }}
                      >
                        Record Negotiation
                      </button>
                    )}
                    {['SENT_TO_BUYER', 'NEGOTIATION', 'REVISED'].includes(builderForm.status) && (
                      <button
                        type="button"
                        onClick={() => handleStatusTransition('ACCEPTED')}
                        className="btn"
                        style={{ padding: '6px 12px', fontSize: '0.78rem', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', fontWeight: 700 }}
                      >
                        Mark Buyer Accepted
                      </button>
                    )}
                    {['ACCEPTED', 'SENT_TO_BUYER'].includes(builderForm.status) && (
                      <button
                        type="button"
                        onClick={() => setShowPoModal(true)}
                        className="btn"
                        style={{ padding: '6px 12px', fontSize: '0.78rem', background: '#065f46', color: 'white', border: 'none', fontWeight: 700 }}
                      >
                        Record PO Receipt →
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowRevisionModal(true)}
                      className="btn"
                      style={{ padding: '6px 12px', fontSize: '0.78rem', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', fontWeight: 700 }}
                    >
                      + Create Revision
                    </button>
                    {builderForm.status !== 'CANCELLED' && builderForm.status !== 'PO_RECEIVED' && (
                      <button
                        type="button"
                        onClick={() => {
                          const r = window.prompt('Reason for quotation cancellation:')
                          if (r) handleStatusTransition('CANCELLED', { reason: r })
                        }}
                        className="btn"
                        style={{ padding: '6px 10px', fontSize: '0.75rem', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* PRICE SAFETY & PENDING INTERNAL INPUT BANNER */}
              {builderForm.items.some(i => !i.rate || Number(i.rate) <= 0) && (
                <div style={{ background: '#fffbeb', border: '2px solid #f59e0b', borderRadius: 8, padding: '12px 16px', marginBottom: 20, color: '#92400e', fontSize: '0.85rem' }}>
                  <div style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
                    ⚠️ Commercial Price Input Required (PENDING_INTERNAL_INPUT)
                  </div>
                  <div style={{ marginTop: 4 }}>
                    Unit rate required before buyer-ready quotation. The quotation rate must be entered by AVANI commercial coordinator before this draft can transition to <strong>READY_FOR_BUYER</strong>.
                  </div>
                </div>
              )}

              {/* VALIDATION ALERT BANNER */}
              {validationAlert && (
                <div style={{ background: '#fef2f2', border: '2px solid #ef4444', borderRadius: 8, padding: '14px 16px', marginBottom: 20, color: '#991b1b', fontSize: '0.85rem' }}>
                  <div style={{ fontWeight: 800 }}>
                    ⛔ Cannot transition to {validationAlert.targetStatus}:
                  </div>
                  <div style={{ marginTop: 4 }}>
                    {validationAlert.reason}
                  </div>
                  {validationAlert.checklist && (
                    <ul style={{ margin: '8px 0 0 18px', padding: 0 }}>
                      {!validationAlert.checklist.buyerValid && <li>Buyer name, company, email, and country are required.</li>}
                      {!validationAlert.checklist.productValid && <li>Supported product is required.</li>}
                      {!validationAlert.checklist.quantityValid && <li>Order quantity must be greater than zero.</li>}
                      {!validationAlert.checklist.destinationValid && <li>Destination port or country is required.</li>}
                      {!validationAlert.checklist.priceEntered && <li><strong>Unit rate required before buyer-ready quotation.</strong></li>}
                      {!validationAlert.checklist.processorVerified && <li>All mandatory processor verification items must be confirmed (or admin override applied with reason).</li>}
                    </ul>
                  )}
                </div>
              )}

              {/* THREE-WAY COMMERCIAL AUDIT CARD */}
              <div style={{ background: '#fcfcfc', border: '1px solid var(--color-border)', borderRadius: 8, padding: '18px', marginBottom: 24 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-primary)', marginBottom: 12 }}>
                  Three-Way Requirement &amp; Verification Audit
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                  {/* Col 1: Buyer Requirement */}
                  <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 6, padding: '12px' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>
                      1. Buyer Inquired Requirement
                    </div>
                    <div style={{ fontSize: '0.82rem', lineHeight: 1.5 }}>
                      <div><strong>Product:</strong> {builderForm.commercialRequirement?.product || builderForm.items[0]?.name}</div>
                      <div><strong>Quantity:</strong> {builderForm.commercialRequirement?.quantity ? `${Number(builderForm.commercialRequirement.quantity).toLocaleString()} KG` : `${builderForm.items[0]?.quantity?.toLocaleString()} KG`}</div>
                      <div><strong>Mesh:</strong> {builderForm.commercialRequirement?.mesh || 'Standard'}</div>
                      <div><strong>Moisture:</strong> {builderForm.commercialRequirement?.moisture || 'Standard'}</div>
                      <div><strong>Destination:</strong> {builderForm.destinationPort || 'Nhava Sheva'}</div>
                      <div><strong>Target Price:</strong> {builderForm.commercialRequirement?.targetPrice ? `${builderForm.currency} ${builderForm.commercialRequirement.targetPrice}` : 'None provided'}</div>
                    </div>
                  </div>

                  {/* Col 2: Processor Verification */}
                  <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 6, padding: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                        2. Processor Verification
                      </span>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: 8,
                        background: builderForm.processorVerification?.status === 'CONFIRMED' ? '#dcfce7' : builderForm.processorVerification?.status === 'PARTIALLY_CONFIRMED' ? '#fef3c7' : '#f1f5f9',
                        color: builderForm.processorVerification?.status === 'CONFIRMED' ? '#166534' : builderForm.processorVerification?.status === 'PARTIALLY_CONFIRMED' ? '#92400e' : '#475569'
                      }}>
                        {builderForm.processorVerification?.status || 'PENDING'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.82rem', lineHeight: 1.5 }}>
                      <div><strong>Availability:</strong> {builderForm.processorVerification?.availabilityConfirmed ? '✅ Confirmed' : '⏳ Pending'}</div>
                      <div><strong>Capacity:</strong> {builderForm.processorVerification?.capacityConfirmed ? '✅ Confirmed' : '⏳ Pending'}</div>
                      <div><strong>Specification:</strong> {builderForm.processorVerification?.specificationConfirmed ? '✅ Confirmed' : '⏳ Pending'}</div>
                      <div><strong>Admin Override:</strong> {builderForm.processorVerification?.adminOverride ? `⚠️ Active (${builderForm.processorVerification?.overrideReason})` : 'None'}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4, fontStyle: 'italic' }}>
                        Availability subject to processor confirmation.
                      </div>
                    </div>
                  </div>

                  {/* Col 3: Avani Commercial Input */}
                  <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 6, padding: '12px' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>
                      3. Avani Commercial Terms
                    </div>
                    <div style={{ fontSize: '0.82rem', lineHeight: 1.5 }}>
                      <div><strong>Currency:</strong> {builderForm.currency}</div>
                      <div><strong>Quoted Grand Total:</strong> {builderForm.currency} {formatNumber(grandTotal)}</div>
                      <div><strong>Incoterm:</strong> {builderForm.incoterm}</div>
                      <div><strong>Price Basis:</strong> FOB Nhava Sheva (JNPT)</div>
                      <div><strong>Timeline:</strong> 60–75 Days from Advance</div>
                      <div><strong>Payment:</strong> 50% Advance, 50% Before Dispatch</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* PROCESSOR VERIFICATION CHECKLIST SECTION */}
              <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 8, padding: '18px', marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: '#1e293b' }}>
                      Processor Verification Checklist
                    </h3>
                    <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '2px 0 0' }}>
                      Verify with Indian manufacturing partner before releasing quotation to buyer. Boxes must be explicitly checked.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569' }}>
                      Status:
                    </span>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 900,
                      padding: '3px 8px',
                      borderRadius: 12,
                      background: builderForm.processorVerification?.status === 'CONFIRMED' ? '#dcfce7' : builderForm.processorVerification?.status === 'PARTIALLY_CONFIRMED' ? '#fef3c7' : '#f1f5f9',
                      color: builderForm.processorVerification?.status === 'CONFIRMED' ? '#166534' : builderForm.processorVerification?.status === 'PARTIALLY_CONFIRMED' ? '#92400e' : '#475569'
                    }}>
                      {builderForm.processorVerification?.status || 'PENDING'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
                  {PROCESSOR_CHECKLIST_ITEMS.map(chk => (
                    <label
                      key={chk.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        background: 'white',
                        padding: '8px 12px',
                        borderRadius: 6,
                        border: '1px solid #e2e8f0',
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(builderForm.processorVerification?.[chk.key])}
                        onChange={e => handleProcessorCheckToggle(chk.key, e.target.checked)}
                        style={{ width: 16, height: 16, cursor: 'pointer' }}
                      />
                      <span>
                        {chk.label}
                        {chk.mandatory && <span style={{ color: '#dc2626', marginLeft: 4 }}>*</span>}
                      </span>
                    </label>
                  ))}
                </div>

                {/* Admin Override */}
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #e2e8f0' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', fontWeight: 700, color: '#b45309', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={Boolean(builderForm.processorVerification?.adminOverride)}
                      onChange={e => handleAdminOverrideToggle(e.target.checked)}
                      style={{ width: 16, height: 16 }}
                    />
                    Enable Administrative Verification Override (Recorded in audit trail)
                  </label>
                  {builderForm.processorVerification?.adminOverride && (
                    <div style={{ marginTop: 8 }}>
                      <input
                        className="input"
                        placeholder="Reason for administrative override (mandatory)..."
                        value={builderForm.processorVerification?.overrideReason || ''}
                        onChange={e => handleAdminOverrideToggle(true, e.target.value)}
                        style={{ fontSize: '0.8rem', background: '#fffbeb', borderColor: '#fcd34d' }}
                      />
                    </div>
                  )}
                </div>

                {/* Positioning Disclaimer */}
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 10, fontStyle: 'italic', borderTop: '1px dashed #e2e8f0', paddingTop: 8 }}>
                  AVANI AGRO FOODS is an Indian sourcing and export coordination partner. Manufacturing partner subject to confirmation. Specification and capacity to be confirmed with the manufacturing partner.
                </div>
              </div>

              {/* REVISION HISTORY & NEGOTIATION TRACKER (if active) */}
              {(builderForm.revisionHistory?.length > 0 || builderForm.negotiation?.buyerRequestedPrice || builderForm.negotiation?.negotiationNotes?.length > 0) && (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '14px 18px', marginBottom: 20 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: 8 }}>
                    Commercial Audit: Revision &amp; Negotiation History
                  </div>
                  {builderForm.revisionHistory?.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Revisions:</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                        {builderForm.revisionHistory.map((rev, rIdx) => (
                          <span key={rIdx} style={{ fontSize: '0.72rem', background: 'white', border: '1px solid #cbd5e1', padding: '4px 8px', borderRadius: 4 }}>
                            Rev {rev.revisionNumber} ({rev.savedAt?.split('T')[0]}): {builderForm.currency} {formatNumber(rev.grandTotal)} — {rev.changeReason}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {builderForm.negotiation?.buyerRequestedPrice && (
                    <div style={{ fontSize: '0.78rem', color: '#0f172a', background: 'white', padding: '8px 12px', borderRadius: 6, border: '1px solid #fed7aa' }}>
                      <strong>Buyer Counter-Offer:</strong> {builderForm.currency} {builderForm.negotiation.buyerRequestedPrice}/kg | Qty: {builderForm.negotiation.buyerRequestedQuantity || 'As original'} | Changes: {builderForm.negotiation.requestedChanges || 'None'}
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleSaveQuotation} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                
                {/* 1. Buyer / Consignee Information */}
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 12, color: 'var(--color-primary)' }}>
                    1. Consignee / Buyer Information
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                    <div>
                      <label className="label">Buyer Contact Name *</label>
                      <input className="input" required value={builderForm.buyerName} onChange={e => setBuilderForm({ ...builderForm, buyerName: e.target.value })} placeholder="Full Name" />
                    </div>
                    <div>
                      <label className="label">Company Name *</label>
                      <input className="input" required value={builderForm.companyName} onChange={e => setBuilderForm({ ...builderForm, companyName: e.target.value })} placeholder="Company Name" />
                    </div>
                    <div>
                      <label className="label">Country *</label>
                      <input className="input" required value={builderForm.country} onChange={e => setBuilderForm({ ...builderForm, country: e.target.value })} placeholder="e.g. INDIA, USA, Germany" />
                    </div>
                    <div>
                      <label className="label">Business Email *</label>
                      <input type="email" required className="input" value={builderForm.email} onChange={e => setBuilderForm({ ...builderForm, email: e.target.value })} placeholder="buyer@example.com" />
                    </div>
                    <div>
                      <label className="label">Phone / WhatsApp *</label>
                      <input className="input" required value={builderForm.phone} onChange={e => setBuilderForm({ ...builderForm, phone: e.target.value })} placeholder="+91 84464 19006" />
                    </div>
                    <div>
                      <label className="label">Destination Port</label>
                      <input className="input" value={builderForm.destinationPort} onChange={e => setBuilderForm({ ...builderForm, destinationPort: e.target.value })} placeholder="e.g. NHAVA SHEVA (JNPT MUMBAI)" />
                    </div>
                  </div>
                </div>

                {/* 2. Commercial Trade Terms & Incoterms */}
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 12, color: 'var(--color-primary)' }}>
                    2. Commercial Trade Parameters
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                    <div>
                      <label className="label">Currency</label>
                      <select className="input" value={builderForm.currency} onChange={e => setBuilderForm({ ...builderForm, currency: e.target.value })}>
                        {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Incoterm</label>
                      <select className="input" value={builderForm.incoterm} onChange={e => setBuilderForm({ ...builderForm, incoterm: e.target.value })}>
                        {INCOTERMS.map(inc => <option key={inc} value={inc}>{inc}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Quotation Validity</label>
                      <input className="input" value={builderForm.validUntil} onChange={e => setBuilderForm({ ...builderForm, validUntil: e.target.value })} placeholder="12 Oct 2026" />
                    </div>
                  </div>
                </div>

                {/* 3. Product Items & Pricing */}
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: 'var(--color-primary)' }}>
                      3. Product Items, Specifications &amp; HS Codes
                    </h3>
                    <button type="button" onClick={handleAddItem} className="btn" style={{ padding: '4px 10px', fontSize: '0.78rem', background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)', gap: 4 }}>
                      <Plus size={13} /> Add Product Line
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {builderForm.items.map((item, idx) => (
                      <div key={item.id} style={{ background: 'var(--color-bg-alt)', padding: 16, borderRadius: 8, border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1.2fr 40px', gap: 10, alignItems: 'center' }}>
                          <div>
                            <label className="label" style={{ fontSize: '0.75rem', marginBottom: 2 }}>Product Master</label>
                            <select
                              className="input"
                              style={{ fontSize: '0.85rem', fontWeight: 700 }}
                              value={item.productId || 'moringa-leaf-powder'}
                              onChange={e => handleProductSelect(item.id, e.target.value)}
                            >
                              {productMasterList.map(p => (
                                <option key={p.productId} value={p.productId}>{p.productName} (HS: {p.hsCode})</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="label" style={{ fontSize: '0.75rem', marginBottom: 2 }}>HS Code</label>
                            <input className="input" style={{ fontSize: '0.85rem' }} value={item.hscode} onChange={e => handleUpdateItem(item.id, 'hscode', e.target.value)} placeholder="HS Code" />
                          </div>
                          <div>
                            <label className="label" style={{ fontSize: '0.75rem', marginBottom: 2 }}>Quantity ({item.unit || 'KG'})</label>
                            <input type="number" className="input" style={{ fontSize: '0.85rem' }} value={item.quantity} onChange={e => handleUpdateItem(item.id, 'quantity', e.target.value)} placeholder="18000" />
                          </div>
                          <div>
                            <label className="label" style={{ fontSize: '0.75rem', marginBottom: 2 }}>Rate / {item.unit || 'KG'}</label>
                            <input type="number" step="0.01" className="input" style={{ fontSize: '0.85rem' }} value={item.rate} onChange={e => handleUpdateItem(item.id, 'rate', e.target.value)} placeholder="350" />
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <label className="label" style={{ fontSize: '0.75rem', marginBottom: 2 }}>Line Total</label>
                            <div style={{ fontWeight: 900, fontSize: '0.95rem', color: 'var(--color-primary)' }}>
                              {builderForm.currency} {formatNumber(item.amount)}
                            </div>
                          </div>
                          <div>
                            {builderForm.items.length > 1 && (
                              <button type="button" onClick={() => handleRemoveItem(item.id)} className="btn" style={{ padding: 6, background: '#fef2f2', color: '#dc2626' }}>
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Full Multi-line Product Description (No Truncation!) */}
                        <div>
                          <label className="label" style={{ fontSize: '0.75rem', marginBottom: 2 }}>
                            Full Product Description &amp; Export Specifications (Full text stored &amp; rendered without truncation)
                          </label>
                          <textarea
                            className="input"
                            rows={3}
                            style={{ fontSize: '0.82rem', lineHeight: 1.5, resize: 'vertical' }}
                            value={item.description}
                            onChange={e => handleUpdateItem(item.id, 'description', e.target.value)}
                            placeholder="Moringa Leaf Powder — Natural Green — 80–100 Mesh — Moisture Max 7–8% — 100% Pure — 25 kg Food-Grade HDPE Bags"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Commercial Charges */}
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 12, color: 'var(--color-primary)' }}>
                    4. Freight, Insurance &amp; Export Handling
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                    <div>
                      <label className="label">Ocean / Air Freight ({builderForm.currency})</label>
                      <input type="number" step="0.01" className="input" value={builderForm.freightCharges} onChange={e => setBuilderForm({ ...builderForm, freightCharges: e.target.value })} />
                    </div>
                    <div>
                      <label className="label">Marine Cargo Insurance</label>
                      <input type="number" step="0.01" className="input" value={builderForm.insuranceCharges} onChange={e => setBuilderForm({ ...builderForm, insuranceCharges: e.target.value })} />
                    </div>
                    <div>
                      <label className="label">Documentation &amp; Port Handling</label>
                      <input type="number" step="0.01" className="input" value={builderForm.documentationCharges} onChange={e => setBuilderForm({ ...builderForm, documentationCharges: e.target.value })} />
                    </div>
                    <div>
                      <label className="label">Other Export Handling</label>
                      <input type="number" step="0.01" className="input" value={builderForm.otherCharges} onChange={e => setBuilderForm({ ...builderForm, otherCharges: e.target.value })} />
                    </div>
                  </div>
                </div>

                {/* Calculation Summary Box */}
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '18px 24px', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: '#166534', fontWeight: 700 }}>
                      ITEMS SUBTOTAL: {builderForm.currency} {formatNumber(itemsSubtotal)}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#166534' }}>
                      + Freight &amp; Charges: {builderForm.currency} {formatNumber(grandTotal - itemsSubtotal)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#166534' }}>TOTAL QUOTATION VALUE</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--color-primary)' }}>
                      {builderForm.currency} {formatNumber(grandTotal)}
                    </div>
                  </div>
                </div>

                {/* Commercial Notes & Terms Section (7 Points) */}
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 8, color: 'var(--color-primary)' }}>
                    5. Commercial Notes &amp; Terms (Official AVANI Terms)
                  </h3>
                  <div style={{ background: 'var(--color-bg-alt)', padding: 14, borderRadius: 6, fontSize: '0.82rem', lineHeight: 1.6 }}>
                    {DEFAULT_TERMS.map((term, tIdx) => (
                      <div key={tIdx} style={{ marginBottom: 4 }}>{term}</div>
                    ))}
                  </div>
                </div>

                {/* Submit Actions */}
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16 }}>
                  <button type="button" onClick={() => setActiveTab('list')} className="btn" style={{ background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)' }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ background: 'var(--color-accent)', gap: 8 }}>
                    <Save size={16} /> Save &amp; Generate Proforma Document →
                  </button>
                </div>

              </form>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* TAB 3: PROFORMA PRINT & PDF / DOCX PREVIEW                 */}
          {/* ══════════════════════════════════════════════════════════ */}
          {activeTab === 'preview' && selectedQuote && (
            <div style={{ maxWidth: 880, margin: '0 auto' }}>
              
              {/* Top Action Bar */}
              <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
                <button onClick={() => setActiveTab('list')} className="btn" style={{ background: 'white', border: '1px solid var(--color-border)' }}>
                  ← Back to Registry
                </button>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button onClick={() => handleEditQuote(selectedQuote)} className="btn" style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', gap: 6 }}>
                    <Edit size={15} /> Edit Quotation
                  </button>
                  <button onClick={() => handleDuplicateQuote(selectedQuote)} className="btn" style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', gap: 6 }}>
                    <Copy size={15} /> Duplicate
                  </button>
                  <button onClick={() => window.print()} className="btn" style={{ background: 'white', border: '1px solid var(--color-border)', gap: 6 }}>
                    <Printer size={15} /> Print Proforma
                  </button>
                  <button onClick={() => handleDownloadPdf(selectedQuote)} className="btn btn-primary" style={{ gap: 6 }}>
                    <Download size={15} /> Download Vector PDF
                  </button>
                  <button onClick={() => handleDownloadDocx(selectedQuote)} className="btn" style={{ background: '#1e3a8a', color: 'white', border: 'none', gap: 6 }}>
                    <FileText size={15} /> Download Word (.DOCX)
                  </button>
                </div>
              </div>

              {/* Printable Document Box */}
              <div id="quotation-builder" style={{
                background: 'white',
                padding: '48px',
                borderRadius: 8,
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--color-border)',
                fontFamily: 'Inter, sans-serif'
              }}>
                {/* Document Header with Official Logo */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid var(--color-primary)', paddingBottom: 24, marginBottom: 24 }}>
                  <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
                    <img
                      src="/assets/brand/avani-agro-foods-logo.png"
                      alt="AVANI AGRO FOODS Official Logo"
                      style={{ width: 72, height: 72, objectFit: 'contain' }}
                      onError={(e) => { e.target.src = '/logo.png'; }}
                    />
                    <div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--color-primary)' }}>
                        AVANI AGRO FOODS
                      </div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-accent)' }}>
                        AGRICULTURAL EXPORT MARKETING &amp; TRADE COORDINATION PARTNER
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', marginTop: 6, lineHeight: 1.5 }}>
                        Sachin Shinde — Trade Coordinator<br />
                        Old Barshi Road, 5 No Chauk, Kulswamini Nagar, Next to Sai School, Latur, Maharashtra 413512, India<br />
                        Email: sales@avaniagrofoods.com | Phone / WhatsApp: +91 7219053645
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--color-text)' }}>
                      COMMERCIAL QUOTATION
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'monospace', marginTop: 4 }}>
                      {selectedQuote.quoteId}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', marginTop: 6 }}>
                      Date: <strong>{selectedQuote.date}</strong><br />
                      Valid Until: <strong>{selectedQuote.validUntil || '12 Oct 2026'}</strong>
                    </div>
                  </div>
                </div>

                {/* Consignee Box */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28, background: 'var(--color-bg-alt)', padding: 16, borderRadius: 6, fontSize: '0.85rem' }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: 4 }}>CONSIGNEE / BUYER:</div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{selectedQuote.buyerName || selectedQuote.customerName}</div>
                    <div style={{ fontWeight: 700 }}>{selectedQuote.companyName}</div>
                    <div>Country: {selectedQuote.country}</div>
                    <div>Email: {selectedQuote.email}</div>
                    <div>Phone: {selectedQuote.phone}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: 4 }}>SHIPMENT &amp; TRADE DETAILS:</div>
                    <div><strong>Incoterm:</strong> {selectedQuote.incoterm}</div>
                    <div><strong>Port of Loading:</strong> JNPT / Nhava Sheva, Mumbai</div>
                    <div><strong>Destination Port:</strong> {selectedQuote.destinationPort || 'As agreed'}</div>
                    <div><strong>Origin:</strong> Maharashtra, India</div>
                    <div><strong>Currency:</strong> {selectedQuote.currency || 'INR'}</div>
                  </div>
                </div>

                {/* Line Items Table with Full Uncut Descriptions */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: 24 }}>
                  <thead>
                    <tr style={{ background: 'var(--color-primary)', color: 'white', textAlign: 'left' }}>
                      <th style={{ padding: '10px 12px', width: '5%' }}>#</th>
                      <th style={{ padding: '10px 12px', width: '45%' }}>Product Requirement &amp; Specification</th>
                      <th style={{ padding: '10px 12px', width: '15%' }}>HS Code</th>
                      <th style={{ padding: '10px 12px', width: '12%', textAlign: 'right' }}>Quantity</th>
                      <th style={{ padding: '10px 12px', width: '11%', textAlign: 'right' }}>Unit Rate</th>
                      <th style={{ padding: '10px 12px', width: '12%', textAlign: 'right' }}>Amount ({selectedQuote.currency || 'INR'})</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedQuote.items || [
                      {
                        id: 1,
                        name: selectedQuote.product || 'Moringa Leaf Powder',
                        description: selectedQuote.description || 'Moringa Leaf Powder — Natural Green — 80–100 Mesh — 25 kg Food-Grade HDPE Bags',
                        hscode: selectedQuote.hsCode || '12119029',
                        quantity: selectedQuote.quantityKg || selectedQuote.quantity || 18000,
                        unit: 'KG',
                        rate: selectedQuote.unitRate || selectedQuote.rate || 350,
                        amount: (Number(selectedQuote.quantityKg || selectedQuote.quantity) || 18000) * (Number(selectedQuote.unitRate || selectedQuote.rate) || 350)
                      }
                    ]).map((item, idx) => (
                      <tr key={item.id || idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '12px', verticalAlign: 'top' }}>{idx + 1}</td>
                        <td style={{ padding: '12px', verticalAlign: 'top' }}>
                          <div style={{ fontWeight: 800, color: 'var(--color-text)', marginBottom: 4 }}>{item.name}</div>
                          <div style={{ whiteSpace: 'pre-wrap', color: 'var(--color-text-light)', fontSize: '0.8rem', lineHeight: 1.5 }}>
                            {item.description}
                          </div>
                        </td>
                        <td style={{ padding: '12px', verticalAlign: 'top', fontWeight: 800, color: 'var(--color-primary)' }}>
                          {item.hscode || '12119029'}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', verticalAlign: 'top', fontWeight: 700 }}>
                          {Number(item.quantity).toLocaleString()} {item.unit || 'KG'}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', verticalAlign: 'top' }}>
                          {selectedQuote.currency || 'INR'} {formatNumber(item.rate)}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', verticalAlign: 'top', fontWeight: 900, color: 'var(--color-primary)' }}>
                          {selectedQuote.currency || 'INR'} {formatNumber(item.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Total Summary */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 28 }}>
                  <div style={{ width: 340, fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
                      <span>Subtotal (Product Value):</span>
                      <strong>{selectedQuote.currency || 'INR'} {formatNumber(selectedQuote.subtotal || selectedQuote.grandTotal)}</strong>
                    </div>
                    {Number(selectedQuote.freightCharges || 0) > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
                        <span>Freight Estimate:</span>
                        <strong>{selectedQuote.currency || 'INR'} {formatNumber(selectedQuote.freightCharges)}</strong>
                      </div>
                    )}
                    {Number(selectedQuote.insuranceCharges || 0) > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
                        <span>Marine Insurance:</span>
                        <strong>{selectedQuote.currency || 'INR'} {formatNumber(selectedQuote.insuranceCharges)}</strong>
                      </div>
                    )}
                    {Number(selectedQuote.documentationCharges || 0) > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
                        <span>Documentation / Handling:</span>
                        <strong>{selectedQuote.currency || 'INR'} {formatNumber(selectedQuote.documentationCharges)}</strong>
                      </div>
                    )}
                    
                    {/* Non-overlapping Grand Total Box */}
                    <div style={{
                      marginTop: 8,
                      padding: '12px 16px',
                      background: '#f0fdf4',
                      border: '2px solid var(--color-primary)',
                      borderRadius: 6
                    }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-primary)' }}>
                        GRAND TOTAL ({selectedQuote.incoterm}):
                      </div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--color-primary)', marginTop: 2 }}>
                        {selectedQuote.currency || 'INR'} {formatNumber(selectedQuote.grandTotal)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Terms & Conditions Notice (Exact 7 points) */}
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text)', borderTop: '1px solid var(--color-border)', paddingTop: 16, lineHeight: 1.6 }}>
                  <div style={{ fontWeight: 800, color: 'var(--color-primary)', marginBottom: 6 }}>
                    Commercial Notes &amp; Terms:
                  </div>
                  {(selectedQuote.commercialTerms || DEFAULT_TERMS).map((term, tIdx) => (
                    <div key={tIdx} style={{ marginBottom: 3 }}>{term}</div>
                  ))}
                </div>

                {/* Signature / Authorization */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 36, paddingTop: 16, borderTop: '1px dashed var(--color-border)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
                    AVANI AGRO FOODS • Commercial Export Division<br />
                    Latur, Maharashtra, India
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 900, fontSize: '0.9rem', color: 'var(--color-primary)' }}>Sachin Shinde</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>Trade Coordinator &amp; Export Partner</div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* TAB 4: CENTRALIZED PRODUCT MASTER MANAGER                 */}
          {/* ══════════════════════════════════════════════════════════ */}
          {activeTab === 'products' && (
            <div className="card" style={{ padding: '32px', background: 'white', maxWidth: 1000, margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid var(--color-border)', paddingBottom: 16 }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 900, margin: 0, color: 'var(--color-text)' }}>
                    Centralized Product Master
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', margin: '4px 0 0' }}>
                    Single source of truth for HS Codes, export rates, standard specifications, and packaging.
                  </p>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--color-bg-alt)', borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                      <th style={{ padding: '12px' }}>Product</th>
                      <th style={{ padding: '12px' }}>HS Code</th>
                      <th style={{ padding: '12px' }}>Default Rate (INR)</th>
                      <th style={{ padding: '12px' }}>Default Rate (USD)</th>
                      <th style={{ padding: '12px' }}>Default Packaging</th>
                      <th style={{ padding: '12px' }}>Status</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productMasterList.map(pm => {
                      const isEditing = editingMasterId === pm.productId
                      return (
                        <tr key={pm.productId} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: '14px 12px' }}>
                            <div style={{ fontWeight: 800 }}>{pm.productName}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}><em>{pm.botanicalName}</em></div>
                          </td>
                          <td style={{ padding: '14px 12px' }}>
                            {isEditing ? (
                              <input
                                className="input"
                                style={{ width: 110, fontSize: '0.82rem' }}
                                value={editMasterForm.hsCode}
                                onChange={e => setEditMasterForm({ ...editMasterForm, hsCode: e.target.value })}
                              />
                            ) : (
                              <span style={{ fontWeight: 800, color: 'var(--color-primary)', background: '#ecfdf5', padding: '4px 8px', borderRadius: 4 }}>
                                {pm.hsCode}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '14px 12px' }}>
                            {isEditing ? (
                              <input
                                type="number"
                                className="input"
                                style={{ width: 90, fontSize: '0.82rem' }}
                                value={editMasterForm.defaultRateInr}
                                onChange={e => setEditMasterForm({ ...editMasterForm, defaultRateInr: Number(e.target.value) })}
                              />
                            ) : (
                              `₹ ${pm.defaultRateInr}/kg`
                            )}
                          </td>
                          <td style={{ padding: '14px 12px' }}>
                            {isEditing ? (
                              <input
                                type="number"
                                step="0.01"
                                className="input"
                                style={{ width: 90, fontSize: '0.82rem' }}
                                value={editMasterForm.defaultRateUsd}
                                onChange={e => setEditMasterForm({ ...editMasterForm, defaultRateUsd: Number(e.target.value) })}
                              />
                            ) : (
                              `$ ${pm.defaultRateUsd}/kg`
                            )}
                          </td>
                          <td style={{ padding: '14px 12px', fontSize: '0.8rem', color: 'var(--color-text-light)' }}>
                            {pm.defaultPackaging}
                          </td>
                          <td style={{ padding: '14px 12px' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#166534', background: '#dcfce7', padding: '3px 8px', borderRadius: 12 }}>
                              {pm.verificationStatus}
                            </span>
                          </td>
                          <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                            {isEditing ? (
                              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                <button onClick={() => handleSaveMaster(pm.productId)} className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                                  Save
                                </button>
                                <button onClick={() => setEditingMasterId(null)} className="btn" style={{ padding: '4px 8px', fontSize: '0.75rem', background: 'var(--color-bg-alt)' }}>
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button onClick={() => handleStartEditMaster(pm)} className="btn" style={{ padding: '4px 10px', fontSize: '0.75rem', background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)' }}>
                                <Edit size={13} /> Edit HS Code / Rates
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* MODAL: CREATE REVISION                                     */}
          {/* ══════════════════════════════════════════════════════════ */}
          {showRevisionModal && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
              <div style={{ background: 'white', borderRadius: 8, padding: 24, maxWidth: 500, width: '100%', boxShadow: 'var(--shadow-xl)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 8px', color: 'var(--color-primary)' }}>
                  Create Controlled Commercial Revision
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 16px', lineHeight: 1.4 }}>
                  Creating Revision {(builderForm.revision?.revisionNumber || 0) + 1}. The current quotation state will be snapshotted in the audit history.
                </p>
                <div style={{ marginBottom: 16 }}>
                  <label className="label">Reason for Commercial Revision *</label>
                  <textarea
                    className="input"
                    rows={3}
                    placeholder="e.g. Buyer requested price reduction for 18 MT volume / updated packing specification..."
                    value={revisionReasonInput}
                    onChange={e => setRevisionReasonInput(e.target.value)}
                    required
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => { setShowRevisionModal(false); setRevisionReasonInput(''); }}
                    className="btn"
                    style={{ background: 'var(--color-bg-alt)' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateRevisionSubmit}
                    className="btn btn-primary"
                  >
                    Create Revision {(builderForm.revision?.revisionNumber || 0) + 1}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* MODAL: RECORD PURCHASE ORDER (PO_RECEIVED)                 */}
          {/* ══════════════════════════════════════════════════════════ */}
          {showPoModal && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
              <div style={{ background: 'white', borderRadius: 8, padding: 24, maxWidth: 500, width: '100%', boxShadow: 'var(--shadow-xl)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 8px', color: '#065f46' }}>
                  Record Commercial Purchase Order (PO)
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 16px', lineHeight: 1.4 }}>
                  Administrative PO receipt transition. No payment processing is triggered in this workflow step.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                  <div>
                    <label className="label">Buyer PO Number *</label>
                    <input
                      className="input"
                      placeholder="e.g. PO-USA-2026-881"
                      value={poForm.poNumber}
                      onChange={e => setPoForm({ ...poForm, poNumber: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">PO Date</label>
                    <input
                      type="date"
                      className="input"
                      value={poForm.poDate}
                      onChange={e => setPoForm({ ...poForm, poDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">PO Notes / Reference</label>
                    <textarea
                      className="input"
                      rows={2}
                      placeholder="e.g. Signed purchase order received via email. Awaiting advance payment."
                      value={poForm.poNotes}
                      onChange={e => setPoForm({ ...poForm, poNotes: e.target.value })}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setShowPoModal(false)}
                    className="btn"
                    style={{ background: 'var(--color-bg-alt)' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleRecordPoSubmit}
                    className="btn"
                    style={{ background: '#065f46', color: 'white', border: 'none' }}
                  >
                    Record PO &amp; Set PO_RECEIVED
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* MODAL: RECORD NEGOTIATION                                  */}
          {/* ══════════════════════════════════════════════════════════ */}
          {showNegotiationModal && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
              <div style={{ background: 'white', borderRadius: 8, padding: 24, maxWidth: 520, width: '100%', boxShadow: 'var(--shadow-xl)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 8px', color: '#c2410c' }}>
                  Record Commercial Negotiation
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 16px', lineHeight: 1.4 }}>
                  Tracks buyer requested revisions and internal counter-offers without overwriting the original inquiry baseline.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label className="label">Buyer Target Rate ({builderForm.currency})</label>
                    <input
                      type="number"
                      className="input"
                      placeholder="e.g. 330"
                      value={negotiationForm.buyerRequestedPrice}
                      onChange={e => setNegotiationForm({ ...negotiationForm, buyerRequestedPrice: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Buyer Requested Qty (KG)</label>
                    <input
                      type="number"
                      className="input"
                      placeholder="e.g. 20000"
                      value={negotiationForm.buyerRequestedQuantity}
                      onChange={e => setNegotiationForm({ ...negotiationForm, buyerRequestedQuantity: e.target.value })}
                    />
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label className="label">Avani Internal Counter-Offer Rate ({builderForm.currency})</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="e.g. 340"
                    value={negotiationForm.internalCounterOffer}
                    onChange={e => setNegotiationForm({ ...negotiationForm, internalCounterOffer: e.target.value })}
                  />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label className="label">Requested Changes / Terms</label>
                  <input
                    className="input"
                    placeholder="e.g. Buyer asked for CFR Hamburg shipping quote"
                    value={negotiationForm.requestedChanges}
                    onChange={e => setNegotiationForm({ ...negotiationForm, requestedChanges: e.target.value })}
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label className="label">Negotiation Note / Summary</label>
                  <textarea
                    className="input"
                    rows={2}
                    placeholder="e.g. Discussed with trade partner; agreed on 340/kg if 18 MT volume is confirmed."
                    value={negotiationForm.note}
                    onChange={e => setNegotiationForm({ ...negotiationForm, note: e.target.value })}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setShowNegotiationModal(false)}
                    className="btn"
                    style={{ background: 'var(--color-bg-alt)' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleNegotiationSubmit}
                    className="btn"
                    style={{ background: '#c2410c', color: 'white', border: 'none' }}
                  >
                    Save Negotiation Record
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </PasswordGate>
  )
}
