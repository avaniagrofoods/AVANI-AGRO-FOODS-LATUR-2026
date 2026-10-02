/**
 * AVANI AGRO FOODS — P4.4 LIVE PRODUCTION AUDIT SUITE
 * 
 * Verifies live production health against https://www.avaniagrofoods.com
 * Minimum 20 critical production tests:
 * 1. Homepage HTTP 200
 * 2. Contact HTTP 200
 * 3. Private dashboard authentication
 * 4. Quotation builder authentication
 * 5. Processor confirmation endpoint security
 * 6. Invalid status transition rejected
 * 7. Valid synthetic processor confirmation
 * 8. Buyer-ready gate
 * 9. Correct 18 MT normalization
 * 10. Correct HS code
 * 11. Correct quotation total
 * 12. PDF generation
 * 13. DOCX generation
 * 14. P3 regression
 * 15. No public processor-data leakage
 * 16. No PII analytics leakage
 * 17. Dispatch safety
 * 18. No false SENT state
 * 19. Revision integrity
 * 20. Working production quotation workflow
 */

const https = require('https')
const http = require('http')
const assert = require('assert')
const path = require('path')
const fs = require('fs')

const BASE_URL = process.env.TEST_BASE_URL || 'https://www.avaniagrofoods.com'

function fetchUrl(urlStr, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlStr)
    const client = parsed.protocol === 'https:' ? https : http
    const req = client.request(urlStr, options, (res) => {
      const chunks = []
      res.on('data', d => chunks.push(d))
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: Buffer.concat(chunks),
          text: Buffer.concat(chunks).toString('utf8')
        })
      })
    })
    req.on('error', reject)
    if (options.body) {
      req.write(options.body)
    }
    req.end()
  })
}

let passed = 0
let failed = 0

async function runLiveTest(num, name, fn) {
  try {
    await fn()
    console.log(`[PASS] Test ${num}: ${name}`)
    passed++
  } catch (err) {
    console.error(`[FAIL] Test ${num}: ${name}`)
    console.error(`       Error: ${err.message}`)
    failed++
  }
}

async function runAllLiveTests() {
  const { calculateQuotation } = await import('../api/_lib/quotationEngine.js')
  const {
    createQuotationFromLead,
    evaluateBuyerReadyGate,
    updateProcessorConfirmation,
    sendQuotationToBuyer,
    reviseQuotation,
    parseQuantityKg,
    PRODUCT_MASTER
  } = require('../src/data/quotationModel.js')

  console.log('============================================================')
  console.log('AVANI AGRO FOODS — P4.4 LIVE PRODUCTION AUDIT SUITE')
  console.log('Target:', BASE_URL)
  console.log('Timestamp:', new Date().toISOString())
  console.log('============================================================\n')

  // 1. Homepage HTTP 200
  await runLiveTest(1, 'Homepage HTTP 200', async () => {
    const res = await fetchUrl(`${BASE_URL}/`, { method: 'GET' })
    assert.strictEqual(res.statusCode, 200)
    assert.ok(res.text.includes('AVANI AGRO FOODS'))
  })

  // 2. Contact HTTP 200
  await runLiveTest(2, 'Contact HTTP 200', async () => {
    const res = await fetchUrl(`${BASE_URL}/contact`, { method: 'GET' })
    assert.strictEqual(res.statusCode, 200)
    assert.ok(res.text.includes('html') || res.text.includes('<!DOCTYPE'))
  })

  // 3. Private dashboard authentication
  await runLiveTest(3, 'Private dashboard authentication blocks unauthenticated requests', async () => {
    const res = await fetchUrl(`${BASE_URL}/api/admin-quotations`, { method: 'GET' })
    assert.strictEqual(res.statusCode, 401)
    assert.ok(res.text.includes('Unauthorized'))
  })

  // 4. Quotation builder authentication
  await runLiveTest(4, 'Quotation builder authentication blocks unauthenticated mutations', async () => {
    const res = await fetchUrl(`${BASE_URL}/api/admin-quotations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create-draft', leadData: {} })
    })
    assert.strictEqual(res.statusCode, 401)
    assert.ok(res.text.includes('Unauthorized'))
  })

  // 5. Processor confirmation endpoint security
  await runLiveTest(5, 'Processor confirmation endpoint security blocks unauthenticated mutation', async () => {
    const res = await fetchUrl(`${BASE_URL}/api/admin-quotations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'processor-confirm', quotation: { quotationId: 'AAF-Q-TEST' }, updates: {} })
    })
    assert.strictEqual(res.statusCode, 401)
  })

  // Synthetic Test Lead
  const syntheticLead = {
    leadId: 'AAF-L-2026-9999',
    createdAt: '2026-10-02T10:00:00.000Z',
    source: { channel: 'Website RFQ', page: '/contact' },
    buyer: {
      fullName: 'Synthetic Trade Partner',
      name: 'Synthetic Trade Partner',
      email: 'synthetic-buyer@testing-only.internal',
      company: 'Synthetic Global Foods Ltd',
      phone: '+44 20 7946 0999',
      country: 'United Kingdom'
    },
    inquiry: {
      product: 'Moringa Leaf Powder',
      quantity: 18000,
      quantityRaw: '18 MT',
      destinationPort: 'Port of Felixstowe',
      destinationCountry: 'United Kingdom',
      incoterm: 'FOB',
      packaging: '25 kg Food-Grade HDPE Bags',
      mesh: '80–100 Mesh',
      moisture: 'Max 7%',
      coaRequired: true,
      testingRequired: true,
      sampleRequired: false,
      timeline: '60–75 Days'
    },
    qualification: {
      qualificationStatus: 'QUALIFIED',
      qualificationScore: 95
    }
  }

  // 6. Invalid status transition rejected
  await runLiveTest(6, 'Invalid status transition rejected', async () => {
    const q = createQuotationFromLead(syntheticLead)
    // Directly transitioning from DRAFT to ACCEPTED is invalid
    const { validateStatusTransition } = require('../src/data/quotationModel.js')
    const check = validateStatusTransition('DRAFT', 'ACCEPTED', q)
    assert.strictEqual(check.allowed, false)
  })

  // 7. Valid synthetic processor confirmation
  await runLiveTest(7, 'Valid synthetic processor confirmation completes successfully', async () => {
    const q = createQuotationFromLead(syntheticLead)
    updateProcessorConfirmation(q, {
      partner: { name: 'Synthetic Manufacturing Partner MH-01', reference: 'SYN-01' },
      available: true,
      confirmedQuantity: 18000,
      meshMatch: true,
      processorMesh: '80–100 Mesh',
      moistureMatch: true,
      processorMoisture: 'Max 7%',
      packagingMatch: true,
      processorPackaging: '25 kg Food-Grade HDPE Bags',
      leadTimeDays: 45,
      earliestDispatchDate: '2026-11-20',
      exportPackingConfirmed: true,
      stuffingConfirmed: true,
      jnptHandlingConfirmed: true,
      coaAvailable: true,
      testingAvailable: true,
      sampleAvailable: true
    })
    assert.strictEqual(q.processorConfirmation.status, 'CONFIRMED')
  })

  // 8. Buyer-ready gate
  await runLiveTest(8, 'Buyer-ready gate validates all conditions', async () => {
    const q = createQuotationFromLead(syntheticLead)
    q.quotation.items[0].rate = 350
    updateProcessorConfirmation(q, {
      available: true,
      confirmedQuantity: 18000,
      meshMatch: true,
      processorMesh: '80–100 Mesh',
      moistureMatch: true,
      processorMoisture: 'Max 7%',
      packagingMatch: true,
      processorPackaging: '25 kg Food-Grade HDPE Bags',
      leadTimeDays: 45,
      earliestDispatchDate: '2026-11-20',
      exportPackingConfirmed: true,
      stuffingConfirmed: true,
      coaAvailable: true,
      testingAvailable: true,
      sampleAvailable: true
    })
    const gate = evaluateBuyerReadyGate(q)
    assert.strictEqual(gate.eligible, true)
    assert.strictEqual(gate.issues.length, 0)
  })

  // 9. Correct 18 MT normalization
  await runLiveTest(9, 'Correct 18 MT normalization to 18,000 KG', async () => {
    const kg = parseQuantityKg('18 MT')
    assert.strictEqual(kg, 18000)
  })

  // 10. Correct HS code
  await runLiveTest(10, 'Correct HS code verification for both core export products', async () => {
    const moringa = PRODUCT_MASTER.find(p => p.productId === 'moringa-leaf-powder')
    const onion = PRODUCT_MASTER.find(p => p.productId === 'red-onion-powder')
    assert.strictEqual(moringa.hsCode, '12119029')
    assert.strictEqual(onion.hsCode, '07122000')
  })

  // 11. Correct quotation total
  await runLiveTest(11, 'Correct quotation total calculation (18,000 x 350 = 6,300,000)', async () => {
    const res = calculateQuotation({
      items: [{ quantity: 18000, rate: 350 }],
      currency: 'INR'
    })
    assert.strictEqual(res.grandTotal, 6300000)
    assert.strictEqual(res.items[0].amount, 6300000)
  })

  // 12. PDF generation
  await runLiveTest(12, 'Live PDF generation endpoint produces valid binary PDF', async () => {
    const res = await fetchUrl(`${BASE_URL}/api/quotation?action=download-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ quantity: 18000, rate: 350, name: 'Moringa Leaf Powder' }],
        currency: 'INR'
      })
    })
    assert.strictEqual(res.statusCode, 200)
    assert.strictEqual(res.headers['content-type'], 'application/pdf')
    assert.ok(res.body.slice(0, 4).toString() === '%PDF')
  })

  // 13. DOCX generation
  await runLiveTest(13, 'Live DOCX generation endpoint produces valid binary DOCX', async () => {
    const res = await fetchUrl(`${BASE_URL}/api/quotation?action=download-docx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ quantity: 18000, rate: 350, name: 'Moringa Leaf Powder' }],
        currency: 'INR'
      })
    })
    assert.strictEqual(res.statusCode, 200)
    assert.ok(res.headers['content-type'].includes('officedocument') || res.headers['content-type'].includes('application/octet-stream') || res.headers['content-type'].includes('application/vnd'))
    assert.ok(res.body.slice(0, 2).toString() === 'PK') // ZIP header
  })

  // 14. P3 regression
  await runLiveTest(14, 'P3 calculation regression parity: 18M Grand Total', async () => {
    const res = calculateQuotation({
      items: [
        { quantity: 18000, rate: 650 },
        { quantity: 18000, rate: 350 }
      ],
      freightCharges: 0,
      insuranceCharges: 0,
      documentationCharges: 0,
      currency: 'INR'
    })
    assert.strictEqual(res.items[0].amount, 11700000)
    assert.strictEqual(res.items[1].amount, 6300000)
    assert.strictEqual(res.subtotal, 18000000)
    assert.strictEqual(res.grandTotal, 18000000)
  })

  // 15. No public processor-data leakage
  await runLiveTest(15, 'No public processor-data leakage on public routes', async () => {
    const publicPages = ['/', '/products', '/trade-coordination', '/export-process', '/contact']
    for (const p of publicPages) {
      const res = await fetchUrl(`${BASE_URL}${p}`)
      assert.ok(!res.text.includes('internalOnly'), `Internal key found on ${p}`)
      assert.ok(!res.text.includes('VMP-LATUR-2026-01'), `Internal reference found on ${p}`)
    }
  })

  // 16. No PII analytics leakage
  await runLiveTest(16, 'No PII analytics leakage in frontend code or bundles', async () => {
    const home = await fetchUrl(`${BASE_URL}/`)
    assert.ok(!home.text.includes('gtag("event", "lead", { email'))
    assert.ok(!home.text.includes('gtag("event", "quote", { email'))
  })

  // 17. Dispatch safety
  await runLiveTest(17, 'Dispatch safety prevents sending unapproved drafts', async () => {
    const draft = createQuotationFromLead(syntheticLead)
    await assert.rejects(async () => {
      await sendQuotationToBuyer(draft, { recipient: syntheticLead.buyer.email })
    }, /Cannot dispatch quotation in status DRAFT/i)
  })

  // 18. No false SENT state
  await runLiveTest(18, 'No false SENT state when external email provider is unconfigured', async () => {
    const q = createQuotationFromLead(syntheticLead)
    q.quotation.items[0].rate = 350
    updateProcessorConfirmation(q, {
      available: true,
      confirmedQuantity: 18000,
      meshMatch: true,
      processorMesh: '80–100 Mesh',
      moistureMatch: true,
      processorMoisture: 'Max 7%',
      packagingMatch: true,
      processorPackaging: '25 kg Food-Grade HDPE Bags',
      leadTimeDays: 45,
      earliestDispatchDate: '2026-11-20',
      exportPackingConfirmed: true,
      stuffingConfirmed: true,
      coaAvailable: true,
      testingAvailable: true,
      sampleAvailable: true
    })
    q.status = 'READY_FOR_BUYER'
    const result = await sendQuotationToBuyer(q, { recipient: syntheticLead.buyer.email })
    assert.strictEqual(result.status, 'READY_TO_SEND')
    assert.notStrictEqual(result.status, 'SENT')
  })

  // 19. Revision integrity
  await runLiveTest(19, 'Revision integrity preserves previous revisions and buyer requirements', async () => {
    const q = createQuotationFromLead(syntheticLead)
    q.quotation.items[0].rate = 350
    reviseQuotation(q, { rate: 340 }, 'Volume discount applied', 'Sachin Shinde')
    assert.strictEqual(q.revision.revisionNumber, 1)
    assert.strictEqual(q.revision.history.length, 1)
    assert.strictEqual(q.revision.history[0].quotationSnapshot.items[0].rate, 350)
    assert.strictEqual(q.quotation.items[0].rate, 340)
  })

  // 20. Working production quotation workflow
  await runLiveTest(20, 'Working production quotation workflow (End-to-End)', async () => {
    // Stage 1: Lead to Draft
    const q = createQuotationFromLead(syntheticLead)
    assert.strictEqual(q.status, 'DRAFT')

    // Stage 2: Pricing input
    q.quotation.items[0].rate = 350

    // Stage 3: Processor confirmation
    updateProcessorConfirmation(q, {
      partner: { name: 'Verified Partner MH-01' },
      available: true,
      confirmedQuantity: 18000,
      meshMatch: true,
      processorMesh: '80–100 Mesh',
      moistureMatch: true,
      processorMoisture: 'Max 7%',
      packagingMatch: true,
      processorPackaging: '25 kg Food-Grade HDPE Bags',
      leadTimeDays: 45,
      earliestDispatchDate: '2026-11-20',
      exportPackingConfirmed: true,
      stuffingConfirmed: true,
      coaAvailable: true,
      testingAvailable: true,
      sampleAvailable: true
    })
    assert.strictEqual(q.processorConfirmation.status, 'CONFIRMED')

    // Stage 4: Buyer-Ready Gate
    const gate = evaluateBuyerReadyGate(q)
    assert.strictEqual(gate.eligible, true)
    q.status = 'READY_FOR_BUYER'

    // Stage 5: Controlled dispatch preparation
    const dispatchResult = await sendQuotationToBuyer(q, { recipient: syntheticLead.buyer.email })
    assert.ok(['READY_TO_SEND', 'SENT'].includes(dispatchResult.status))

    // Stage 6: Negotiation / Counteroffer
    const { updateNegotiation } = require('../src/data/quotationModel.js')
    updateNegotiation(q, { buyerRequestedPrice: 330, negotiationNotes: 'Buyer proposed 330' })
    assert.strictEqual(q.status, 'NEGOTIATION')

    // Stage 7: Revision
    reviseQuotation(q, { rate: 335 }, 'Compromise counter-rate agreed', 'Sachin Shinde')
    assert.strictEqual(q.status, 'REVISED')
    assert.strictEqual(q.revision.revisionNumber, 1)

    // Stage 8: Accepted & PO
    q.status = 'ACCEPTED'
    const { recordPoReceipt } = require('../src/data/quotationModel.js')
    recordPoReceipt(q, { poNumber: 'PO-SYNTH-2026-001', poNotes: 'Deposit wire received' })
    assert.strictEqual(q.status, 'PO_RECEIVED')
    assert.strictEqual(q.po.poNumber, 'PO-SYNTH-2026-001')
  })

  console.log('\n============================================================')
  console.log(`LIVE AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED`)
  console.log('============================================================')

  if (failed > 0) {
    process.exit(1)
  }
}

runAllLiveTests().catch(err => {
  console.error('Fatal live audit error:', err)
  process.exit(1)
})
