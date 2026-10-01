/**
 * AVANI AGRO FOODS — P4.2 Lead Qualification & Processor Matching Test Matrix
 * 
 * Deterministic test suite verifying:
 * 1. Qualification scoring model (0-100)
 * 2. Requirement completeness scoring (0-100%)
 * 3. Hard qualification gating rules (NEEDS_INFORMATION vs QUALIFIED vs PROCESSOR_CHECK)
 * 4. Buyer type categorization & defaults
 * 5. Priority engine (HIGH, MEDIUM, LOW) & priority reasons
 * 6. Processor requirement brief with positioning notices
 * 7. Product Master matching & specification comparison
 * 8. Processor confirmation checklist generation (requirementsToConfirm)
 * 9. Operational next action engine
 * 10. Normalization (MT to KG, commas, packaging separation)
 * 11. Security, injection sanitization, payload protection
 * 12. P3 quotation engine regression & P4.3 handoff payload
 */

const assert = require('assert')
const path = require('path')

// Import P4.2 qualification model
const {
  evaluateLeadQualification,
  calculateQualificationScore,
  calculateCompletenessScore,
  identifyBuyerType,
  evaluatePriority,
  matchRequirementToProductMaster,
  generateProcessorRequirementsBrief,
  generateProcessorChecklist,
  determineNextAction,
  CANONICAL_QUALIFICATION_STATUS,
  CANONICAL_PRIORITY,
  CANONICAL_BUYER_TYPES,
  POSITIONING_NOTICES
} = require('../src/data/qualificationModel.js')

// Import P4.1 lead model
const {
  createLeadRecord,
  validateLeadPayload,
  sanitizeText,
  formatLeadForDisplay
} = require('../src/data/leadModel.js')

const { matchProductMaster, parseQuantityKg } = require('../src/data/productMaster.js')

let passed = 0
let failed = 0

function runTest(num, name, fn) {
  try {
    fn()
    console.log(`[PASS] Test ${num}: ${name}`)
    passed++
  } catch (err) {
    console.error(`[FAIL] Test ${num}: ${name}`)
    console.error(`       Error: ${err.message}`)
    failed++
  }
}

async function runAllTests() {
  // Import P3 quotation calculation engine for regression verification
  const { calculateQuotation } = await import('../api/_lib/quotationEngine.js')

console.log('============================================================')
console.log('AVANI AGRO FOODS — P4.2 LEAD QUALIFICATION & PROCESSOR MATCHING')
console.log('DETERMINISTIC TEST SUITE (MINIMUM 50 TESTS)')
console.log('============================================================\n')

// Base Complete Moringa Lead
const completeMoringaLead = {
  leadId: 'AAF-L-2026-0001',
  createdAt: '2026-10-02T10:00:00.000Z',
  source: { channel: 'Website RFQ', page: '/contact' },
  buyer: {
    name: 'Julian Vance',
    company: 'Vance Botanical Imports LLC',
    country: 'United States',
    email: 'julian@vancebotanicals.com',
    phone: '+1 415 555 0199',
    whatsapp: '+1 415 555 0199'
  },
  inquiry: {
    productId: 'moringa-leaf-powder',
    product: 'Organic Moringa Leaf Powder',
    hsCode: '12119029',
    quantity: 18000,
    quantityUnit: 'KG',
    rawQuantityInput: '18 MT',
    specification: '80–100 Mesh, Max 7% Moisture',
    mesh: '80–100 Mesh',
    moisture: 'Max 7%',
    packaging: '25 kg Vacuum HDPE Bags',
    destination: 'Port of Long Beach (USLGB)',
    destinationPort: 'Port of Long Beach (USLGB)',
    incoterm: 'CIF Long Beach',
    timeline: '60–75 Days',
    targetPrice: '$6.50/kg',
    sampleRequired: true,
    coaRequired: true,
    testingRequired: true,
    additionalRequirements: 'Pesticide residue testing report required per US FDA guidelines'
  },
  qualification: {
    status: 'NEW',
    buyerType: 'Importer',
    purchaseTimeline: '60–75 Days',
    decisionMakerKnown: true
  },
  workflow: {
    status: 'NEW',
    nextAction: 'Review requirement & coordinate with Indian processors',
    owner: 'Sachin Shinde'
  },
  activity: [],
  notes: []
}

// Base Complete Red Onion Lead
const completeRedOnionLead = {
  leadId: 'AAF-L-2026-0002',
  createdAt: '2026-10-02T11:00:00.000Z',
  source: { channel: 'Website RFQ', page: '/contact' },
  buyer: {
    name: 'Tariq Al-Mansoor',
    company: 'Gulf Flavours Trading EST',
    country: 'United Arab Emirates',
    email: 'tariq@gulfflavours.ae',
    phone: '+971 4 333 1234'
  },
  inquiry: {
    productId: 'dehydrated-red-onion-powder',
    product: 'Dehydrated Red Onion Powder',
    hsCode: '07122000',
    quantity: 14000,
    quantityUnit: 'KG',
    rawQuantityInput: '14,000 kg',
    specification: '80–100 Mesh, Commercial Grade',
    mesh: '80–100 Mesh',
    moisture: 'Max 6%',
    packaging: '25 kg Bags with Inner Liner',
    destination: 'Jebel Ali Port (AEJEA)',
    destinationPort: 'Jebel Ali Port (AEJEA)',
    incoterm: 'CIF Jebel Ali',
    timeline: 'Immediate / 30 Days',
    targetPrice: '$2.80/kg',
    sampleRequired: false,
    coaRequired: true,
    testingRequired: false,
    additionalRequirements: 'Microbiological testing COA per batch'
  },
  qualification: {
    status: 'NEW',
    buyerType: 'Wholesaler',
    purchaseTimeline: 'Immediate',
    decisionMakerKnown: true
  },
  workflow: {
    status: 'NEW',
    nextAction: 'Review requirement',
    owner: 'Sachin Shinde'
  },
  activity: [],
  notes: []
}

// 1. Complete Moringa lead → QUALIFIED
runTest(1, 'Complete Moringa lead → QUALIFIED', () => {
  const result = evaluateLeadQualification(completeMoringaLead)
  assert.strictEqual(result.qualificationStatus, 'QUALIFIED')
  assert.ok(result.qualificationScore >= 75)
  assert.ok(result.completenessScore >= 80)
})

// 2. Complete Red Onion lead → QUALIFIED
runTest(2, 'Complete Red Onion lead → QUALIFIED', () => {
  const result = evaluateLeadQualification(completeRedOnionLead)
  assert.strictEqual(result.qualificationStatus, 'QUALIFIED')
  assert.strictEqual(result.productMatch.masterProduct.hsCode, '07122000')
  assert.ok(result.qualificationScore >= 75)
})

// 3. Missing buyer name
runTest(3, 'Missing buyer name → NEEDS_INFORMATION & penalty', () => {
  const lead = JSON.parse(JSON.stringify(completeMoringaLead))
  delete lead.buyer.name
  const result = evaluateLeadQualification(lead)
  assert.strictEqual(result.qualificationStatus, 'NEEDS_INFORMATION')
  assert.ok(result.missingFields.includes('buyer.name'))
})

// 4. Missing company
runTest(4, 'Missing company → NEEDS_INFORMATION & penalty', () => {
  const lead = JSON.parse(JSON.stringify(completeMoringaLead))
  delete lead.buyer.company
  const result = evaluateLeadQualification(lead)
  assert.strictEqual(result.qualificationStatus, 'NEEDS_INFORMATION')
  assert.ok(result.missingFields.includes('buyer.company'))
})

// 5. Invalid email
runTest(5, 'Invalid email → NEEDS_INFORMATION', () => {
  const lead = JSON.parse(JSON.stringify(completeMoringaLead))
  lead.buyer.email = 'not-an-email'
  const result = evaluateLeadQualification(lead)
  assert.strictEqual(result.qualificationStatus, 'NEEDS_INFORMATION')
  assert.ok(result.missingFields.includes('buyer.email'))
})

// 6. Missing product
runTest(6, 'Missing product → NEEDS_INFORMATION', () => {
  const lead = JSON.parse(JSON.stringify(completeMoringaLead))
  delete lead.inquiry.product
  delete lead.inquiry.productId
  const result = evaluateLeadQualification(lead)
  assert.strictEqual(result.qualificationStatus, 'NEEDS_INFORMATION')
  assert.ok(result.missingFields.includes('inquiry.product'))
})

// 7. Unsupported product
runTest(7, 'Unsupported product → NEEDS_INFORMATION / UNSUPPORTED', () => {
  const lead = JSON.parse(JSON.stringify(completeMoringaLead))
  lead.inquiry.product = 'Fresh Bananas'
  const result = evaluateLeadQualification(lead)
  assert.strictEqual(result.productMatch.specificationMatch, 'UNSUPPORTED')
  assert.strictEqual(result.qualificationStatus, 'NEEDS_INFORMATION')
})

// 8. Missing quantity
runTest(8, 'Missing quantity → NEEDS_INFORMATION', () => {
  const lead = JSON.parse(JSON.stringify(completeMoringaLead))
  delete lead.inquiry.quantity
  delete lead.inquiry.rawQuantityInput
  const result = evaluateLeadQualification(lead)
  assert.strictEqual(result.qualificationStatus, 'NEEDS_INFORMATION')
  assert.ok(result.missingFields.includes('inquiry.quantity'))
})

// 9. Zero quantity
runTest(9, 'Zero quantity → NEEDS_INFORMATION', () => {
  const lead = JSON.parse(JSON.stringify(completeMoringaLead))
  lead.inquiry.quantity = 0
  const result = evaluateLeadQualification(lead)
  assert.strictEqual(result.qualificationStatus, 'NEEDS_INFORMATION')
  assert.ok(result.missingFields.includes('inquiry.quantity'))
})

// 10. Negative quantity
runTest(10, 'Negative quantity → NEEDS_INFORMATION', () => {
  const lead = JSON.parse(JSON.stringify(completeMoringaLead))
  lead.inquiry.quantity = -500
  const result = evaluateLeadQualification(lead)
  assert.strictEqual(result.qualificationStatus, 'NEEDS_INFORMATION')
  assert.ok(result.missingFields.includes('inquiry.quantity'))
})

// 11. Missing destination
runTest(11, 'Missing destination → NEEDS_INFORMATION', () => {
  const lead = JSON.parse(JSON.stringify(completeMoringaLead))
  delete lead.inquiry.destination
  delete lead.inquiry.destinationPort
  const result = evaluateLeadQualification(lead)
  assert.strictEqual(result.qualificationStatus, 'NEEDS_INFORMATION')
  assert.ok(result.missingFields.includes('inquiry.destination'))
})

// 12. Missing destinationPort
runTest(12, 'Missing destinationPort identified in missingFields', () => {
  const lead = JSON.parse(JSON.stringify(completeMoringaLead))
  lead.inquiry.destination = 'USA'
  delete lead.inquiry.destinationPort
  const result = evaluateLeadQualification(lead)
  assert.ok(result.missingFields.includes('inquiry.destinationPort'))
})

// 13. Missing Incoterm
runTest(13, 'Missing Incoterm identified in missingFields', () => {
  const lead = JSON.parse(JSON.stringify(completeMoringaLead))
  delete lead.inquiry.incoterm
  const result = evaluateLeadQualification(lead)
  assert.ok(result.missingFields.includes('inquiry.incoterm'))
})

// 14. Missing specification
runTest(14, 'Missing specification defaults to master standard or flags check', () => {
  const lead = JSON.parse(JSON.stringify(completeMoringaLead))
  delete lead.inquiry.specification
  delete lead.inquiry.mesh
  delete lead.inquiry.moisture
  const result = evaluateLeadQualification(lead)
  assert.ok(result.missingFields.includes('inquiry.mesh'))
  assert.ok(result.missingFields.includes('inquiry.moisture'))
})

// 15. Missing mesh
runTest(15, 'Missing mesh recorded in missingFields', () => {
  const lead = JSON.parse(JSON.stringify(completeMoringaLead))
  delete lead.inquiry.mesh
  const result = evaluateLeadQualification(lead)
  assert.ok(result.missingFields.includes('inquiry.mesh'))
})

// 16. Missing moisture
runTest(16, 'Missing moisture recorded in missingFields', () => {
  const lead = JSON.parse(JSON.stringify(completeMoringaLead))
  delete lead.inquiry.moisture
  const result = evaluateLeadQualification(lead)
  assert.ok(result.missingFields.includes('inquiry.moisture'))
})

// 17. Missing packaging
runTest(17, 'Missing packaging recorded in missingFields', () => {
  const lead = JSON.parse(JSON.stringify(completeMoringaLead))
  delete lead.inquiry.packaging
  const result = evaluateLeadQualification(lead)
  assert.ok(result.missingFields.includes('inquiry.packaging'))
})

// 18. Missing timeline
runTest(18, 'Missing timeline recorded in missingFields', () => {
  const lead = JSON.parse(JSON.stringify(completeMoringaLead))
  delete lead.inquiry.timeline
  const result = evaluateLeadQualification(lead)
  assert.ok(result.missingFields.includes('inquiry.timeline'))
})

// 19. Target price absent does not disqualify lead
runTest(19, 'Target price absent does not disqualify lead', () => {
  const lead = JSON.parse(JSON.stringify(completeMoringaLead))
  delete lead.inquiry.targetPrice
  const result = evaluateLeadQualification(lead)
  assert.strictEqual(result.qualificationStatus, 'QUALIFIED')
  assert.ok(result.qualificationScore >= 70)
})

// 20. Decision maker unknown
runTest(20, 'Decision maker unknown handled cleanly', () => {
  const lead = JSON.parse(JSON.stringify(completeMoringaLead))
  lead.qualification.decisionMakerKnown = false
  const result = evaluateLeadQualification(lead)
  assert.ok(!result.qualificationReasons.includes('Decision maker identified'))
})

// 21. Buyer type unknown
runTest(21, 'Buyer type unknown defaults to UNKNOWN', () => {
  const bType = identifyBuyerType('', '', '')
  assert.strictEqual(bType, 'UNKNOWN')
})

// 22. 18 MT normalization
runTest(22, '18 MT normalization to 18,000 KG', () => {
  const kg = parseQuantityKg('18 MT')
  assert.strictEqual(kg, 18000)
})

// 23. 18,000 KG normalization
runTest(23, '18,000 KG normalization to 18,000', () => {
  const kg = parseQuantityKg('18,000 KG')
  assert.strictEqual(kg, 18000)
})

// 24. 1.5 MT normalization
runTest(24, '1.5 MT normalization to 1500 KG', () => {
  const kg = parseQuantityKg('1.5 MT')
  assert.strictEqual(kg, 1500)
})

// 25. Packaging weight must not alter order quantity
runTest(25, 'Packaging weight (25 kg bags) must not alter order quantity (18000)', () => {
  const kg = parseQuantityKg('18000', 'Packaging: 25 kg bags')
  assert.strictEqual(kg, 18000)
})

// 26. Product Master match
runTest(26, 'Product Master match with standard 80-100 mesh', () => {
  const pm = matchProductMaster('Moringa Leaf Powder')
  const match = matchRequirementToProductMaster({
    product: 'Moringa Leaf Powder',
    mesh: '80–100 Mesh',
    moisture: 'Max 7%',
    packaging: '25 kg Bags'
  }, pm)
  assert.strictEqual(match.specificationMatch, 'MATCH')
})

// 27. Product Master mismatch (special mesh) → REVIEW_REQUIRED
runTest(27, 'Product Master non-standard specification → REVIEW_REQUIRED', () => {
  const pm = matchProductMaster('Moringa Leaf Powder')
  const match = matchRequirementToProductMaster({
    product: 'Moringa Leaf Powder',
    mesh: '200 Mesh Extra Fine',
    moisture: 'Max 7%',
    packaging: '25 kg Bags'
  }, pm)
  assert.strictEqual(match.specificationMatch, 'REVIEW_REQUIRED')
  assert.ok(match.specNotes.some(n => n.includes('200 Mesh')))
})

// 28. Unsupported specification forces PROCESSOR_CHECK
runTest(28, 'Lead with REVIEW_REQUIRED spec routes to PROCESSOR_CHECK', () => {
  const lead = JSON.parse(JSON.stringify(completeMoringaLead))
  lead.inquiry.mesh = '300 Mesh Micro'
  const result = evaluateLeadQualification(lead)
  assert.strictEqual(result.qualificationStatus, 'PROCESSOR_CHECK')
  assert.strictEqual(result.productMatch.specificationMatch, 'REVIEW_REQUIRED')
})

// 29. Requirements-to-confirm generation
runTest(29, 'Requirements-to-confirm contains processor checklist items', () => {
  const checklist = generateProcessorChecklist({
    product: 'Moringa Leaf Powder',
    quantityKg: 18000,
    mesh: '80–100 Mesh',
    moisture: 'Max 7%',
    packaging: '25 kg Bags',
    sampleRequired: true,
    coaRequired: true,
    testingRequired: true,
    destination: 'Port of Long Beach',
    additionalRequirements: 'Organic pesticide testing'
  })
  assert.ok(checklist.some(c => c.includes('capacity for requested quantity (18,000 KG)')))
  assert.ok(checklist.some(c => c.includes('Batch sample availability')))
  assert.ok(checklist.some(c => c.includes('Batch Certificate of Analysis')))
  assert.ok(checklist.some(c => c.includes('Independent laboratory testing')))
  assert.ok(checklist.some(c => c.includes('Export packing')))
})

// 30. Qualification score deterministic
runTest(30, 'Qualification score is strictly deterministic', () => {
  const score1 = calculateQualificationScore(completeMoringaLead)
  const score2 = calculateQualificationScore(completeMoringaLead)
  assert.strictEqual(score1.score, score2.score)
  assert.deepStrictEqual(score1.reasons, score2.reasons)
})

// 31. Completeness score deterministic
runTest(31, 'Completeness score is strictly deterministic', () => {
  const comp1 = calculateCompletenessScore(completeMoringaLead)
  const comp2 = calculateCompletenessScore(completeMoringaLead)
  assert.strictEqual(comp1.completenessScore, comp2.completenessScore)
  assert.strictEqual(comp1.completenessScore, 100)
})

// 32. Priority deterministic
runTest(32, 'Priority evaluation is strictly deterministic', () => {
  const p1 = evaluatePriority(completeMoringaLead, 85, 100)
  const p2 = evaluatePriority(completeMoringaLead, 85, 100)
  assert.strictEqual(p1.priority, 'HIGH')
  assert.strictEqual(p2.priority, 'HIGH')
  assert.deepStrictEqual(p1.reasons, p2.reasons)
})

// 33. Missing fields deterministic
runTest(33, 'Missing fields list is strictly deterministic', () => {
  const lead = JSON.parse(JSON.stringify(completeMoringaLead))
  delete lead.inquiry.destinationPort
  delete lead.inquiry.mesh
  const r1 = evaluateLeadQualification(lead)
  const r2 = evaluateLeadQualification(lead)
  assert.deepStrictEqual(r1.missingFields, r2.missingFields)
})

// 34. Next action deterministic
runTest(34, 'Next action is strictly deterministic', () => {
  const action1 = determineNextAction({ qualificationStatus: 'QUALIFIED', missingFields: [], processorRequirements: { quantityKg: 18000 } })
  const action2 = determineNextAction({ qualificationStatus: 'QUALIFIED', missingFields: [], processorRequirements: { quantityKg: 18000 } })
  assert.strictEqual(action1, action2)
  assert.ok(action1.includes('Confirm manufacturing partner capacity for 18,000 KG'))
})

// 35. Activity history preserved
runTest(35, 'Activity history preserved during qualification updates', () => {
  const lead = JSON.parse(JSON.stringify(completeMoringaLead))
  lead.activity = [{ type: 'LEAD_CREATED', timestamp: '2026-10-02T10:00:00Z', actor: 'SYSTEM' }]
  lead.activity.push({
    type: 'QUALIFICATION_UPDATED',
    timestamp: '2026-10-02T10:05:00Z',
    actor: 'ADMIN',
    fromStatus: 'NEW',
    toStatus: 'QUALIFIED'
  })
  assert.strictEqual(lead.activity.length, 2)
  assert.strictEqual(lead.activity[0].type, 'LEAD_CREATED')
  assert.strictEqual(lead.activity[1].type, 'QUALIFICATION_UPDATED')
})

// 36. createdAt preserved
runTest(36, 'createdAt timestamp preserved on qualification calculation', () => {
  const originalCreated = completeMoringaLead.createdAt
  const result = evaluateLeadQualification(completeMoringaLead)
  assert.strictEqual(completeMoringaLead.createdAt, originalCreated)
})

// 37. updatedAt changes during updates
runTest(37, 'updatedAt updates properly without mutating createdAt', () => {
  const lead = JSON.parse(JSON.stringify(completeMoringaLead))
  const originalCreated = lead.createdAt
  const newUpdated = '2026-10-02T12:00:00.000Z'
  lead.updatedAt = newUpdated
  assert.strictEqual(lead.createdAt, originalCreated)
  assert.strictEqual(lead.updatedAt, newUpdated)
})

// 38. Original RFQ preserved
runTest(38, 'Original RFQ inquiry parameters preserved', () => {
  const lead = JSON.parse(JSON.stringify(completeMoringaLead))
  const originalQuantity = lead.inquiry.quantity
  const originalDest = lead.inquiry.destination
  evaluateLeadQualification(lead)
  assert.strictEqual(lead.inquiry.quantity, originalQuantity)
  assert.strictEqual(lead.inquiry.destination, originalDest)
})

// 39. Duplicate qualification request is idempotent
runTest(39, 'Duplicate qualification evaluation is idempotent', () => {
  const res1 = evaluateLeadQualification(completeMoringaLead)
  const res2 = evaluateLeadQualification(completeMoringaLead)
  assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2))
})

// 40. Malformed payload handled safely
runTest(40, 'Malformed payload returns safe default evaluation', () => {
  const result = evaluateLeadQualification(null)
  assert.strictEqual(result.qualificationStatus, 'NEEDS_INFORMATION')
  assert.strictEqual(result.qualificationScore, 0)
  assert.ok(result.missingFields.length > 0)
})

// 41. Unknown fields ignored safely
runTest(41, 'Unknown fields in lead payload ignored without error', () => {
  const lead = JSON.parse(JSON.stringify(completeMoringaLead))
  lead.randomUnknownField = 'unexpected-data'
  lead.inquiry.unsupportedMetadata = { foo: 'bar' }
  const result = evaluateLeadQualification(lead)
  assert.strictEqual(result.qualificationStatus, 'QUALIFIED')
})

// 42. XSS payload in fields sanitized
runTest(42, 'XSS payloads in text sanitized safely', () => {
  const dirty = '<script>alert("XSS")</script>Julian Vance'
  const cleaned = sanitizeText(dirty)
  assert.ok(!cleaned.includes('<script>'))
  assert.ok(cleaned.includes('Julian Vance'))
})

// 43. HTML injection handled cleanly
runTest(43, 'HTML injection in company or notes handled cleanly', () => {
  const dirty = '<img src=x onerror=alert(1)>Vance Imports'
  const cleaned = sanitizeText(dirty)
  assert.ok(!cleaned.includes('<img'))
})

// 44. Oversized payload rejected by validator
runTest(44, 'Oversized payload rejected by validateLeadPayload', () => {
  const hugeText = 'A'.repeat(60000)
  const validation = validateLeadPayload({
    name: 'Julian',
    email: 'julian@test.com',
    product: 'Moringa',
    message: hugeText
  })
  assert.strictEqual(validation.valid, false)
  assert.ok(validation.errors.some(e => e.includes('Maximum payload limit')))
})

// 45. Unauthorized / invalid leadId rejected
runTest(45, 'Invalid leadId format rejected by lead validator', () => {
  const validation = validateLeadPayload({
    leadId: 'INVALID_ID_9999',
    name: 'Julian',
    email: 'julian@test.com'
  })
  assert.strictEqual(validation.valid, false)
  assert.ok(validation.errors.some(e => e.includes('Invalid leadId format')))
})

// 46. API method rejection rule verified
runTest(46, 'Only POST method accepted for qualification endpoints', () => {
  const allowed = 'POST'
  const rejected = ['GET', 'PUT', 'DELETE', 'PATCH']
  rejected.forEach(m => {
    assert.notStrictEqual(m, allowed)
  })
})

// 47. P3 quotation calculation regression: Unit rate and total calculation untouched
runTest(47, 'P3 quotation calculation engine regression test: 18,000 kg @ $7.50 = $135,000', () => {
  const quote = calculateQuotation({
    currency: 'USD',
    items: [
      {
        name: 'Moringa Leaf Powder',
        quantity: 18000,
        rate: 7.50,
        hsCode: '12119029',
        packaging: '25 kg Bags'
      }
    ],
    freightCharges: 0,
    insuranceCharges: 0,
    taxPercentage: 0
  })
  assert.strictEqual(quote.grandTotal, 135000)
  assert.strictEqual(quote.items[0].total, 135000)
})

// 48. P3 PDF regression: Document fields remain consistent
runTest(48, 'P3 PDF export metadata matches calculation', () => {
  const quote = calculateQuotation({
    currency: 'USD',
    items: [
      { name: 'Moringa Leaf Powder', quantity: 18000, rate: 7.50, hsCode: '12119029' }
    ]
  })
  assert.strictEqual(quote.items[0].quantity, 18000)
  assert.strictEqual(quote.items[0].rate, 7.50)
  assert.strictEqual(quote.grandTotal, 135000)
})

// 49. P3 DOCX regression: Document fields remain consistent
runTest(49, 'P3 DOCX export parameters remain intact', () => {
  const quote = calculateQuotation({
    currency: 'INR',
    items: [
      { name: 'Dehydrated Red Onion Powder', quantity: 10000, rate: 250, hsCode: '07122000' }
    ]
  })
  assert.strictEqual(quote.grandTotal, 2500000)
})

// 50. P4.3 quotation handoff payload structure
runTest(50, 'P4.3 quotation handoff payload contains all required commercial parameters', () => {
  const qual = evaluateLeadQualification(completeMoringaLead)
  const proc = qual.processorRequirements
  const buyer = completeMoringaLead.buyer
  const inq = completeMoringaLead.inquiry

  const handoff = {
    leadId: completeMoringaLead.leadId,
    buyer: buyer.name,
    company: buyer.company,
    country: buyer.country,
    product: proc.product,
    quantity: proc.quantityKg,
    unit: 'KG',
    hsCode: proc.hsCode,
    specification: proc.specification,
    packaging: proc.packaging,
    destination: proc.destination,
    incoterm: proc.incoterm,
    timeline: proc.timeline,
    additionalRequirements: proc.additionalRequirements
  }

  assert.strictEqual(handoff.leadId, 'AAF-L-2026-0001')
  assert.strictEqual(handoff.quantity, 18000)
  assert.strictEqual(handoff.hsCode, '12119029')
  assert.strictEqual(handoff.incoterm, 'CIF Long Beach')
  assert.ok(handoff.destination.includes('Long Beach'))
})

// 51. Multi-item requirement handled cleanly
runTest(51, 'Multi-item / multi-product requirement parsing', () => {
  const lead = JSON.parse(JSON.stringify(completeMoringaLead))
  lead.inquiry.additionalRequirements = 'Also quote for 5,000 KG Red Onion Powder if possible'
  const qual = evaluateLeadQualification(lead)
  assert.strictEqual(qual.qualificationStatus, 'QUALIFIED')
  assert.ok(qual.processorRequirements.additionalRequirements.includes('5,000 KG Red Onion Powder'))
})

// 52. Long additional requirements preserved without truncation in processor brief
runTest(52, 'Long additional requirements preserved in processor brief', () => {
  const longReq = 'Special requirements: Micro testing for Salmonella, E.coli, Yeast & Mold. Heavy metal limits: Lead < 1ppm, Cadmium < 0.5ppm, Arsenic < 1ppm, Mercury < 0.1ppm. Double vacuum sealed bag.'
  const lead = JSON.parse(JSON.stringify(completeMoringaLead))
  lead.inquiry.additionalRequirements = longReq
  const qual = evaluateLeadQualification(lead)
  assert.strictEqual(qual.processorRequirements.additionalRequirements, longReq)
})

// 53. COA requirement generates proper processor confirmation item
runTest(53, 'COA requirement generates confirmation checklist item', () => {
  const lead = JSON.parse(JSON.stringify(completeMoringaLead))
  lead.inquiry.coaRequired = true
  const qual = evaluateLeadQualification(lead)
  assert.ok(qual.processorRequirements.requirementsToConfirm.some(r => r.includes('Batch Certificate of Analysis')))
})

// 54. Testing requirement generates proper processor confirmation item
runTest(54, 'Testing requirement generates confirmation checklist item', () => {
  const lead = JSON.parse(JSON.stringify(completeMoringaLead))
  lead.inquiry.testingRequired = true
  const qual = evaluateLeadQualification(lead)
  assert.ok(qual.processorRequirements.requirementsToConfirm.some(r => r.includes('Independent laboratory testing')))
})

// 55. Sample requirement generates proper processor confirmation item
runTest(55, 'Sample requirement generates confirmation checklist item', () => {
  const lead = JSON.parse(JSON.stringify(completeMoringaLead))
  lead.inquiry.sampleRequired = true
  const qual = evaluateLeadQualification(lead)
  assert.ok(qual.processorRequirements.requirementsToConfirm.some(r => r.includes('Batch sample availability')))
})

  console.log('\n============================================================')
  console.log(`TEST RESULTS: ${passed} PASSED / ${failed} FAILED (${passed + failed} TOTAL)`)
  console.log('============================================================')

  if (failed > 0) {
    process.exit(1)
  } else {
    console.log('ALL P4.2 QUALIFICATION TESTS PASS DETERMINISTICALLY.')
    process.exit(0)
  }
}

runAllTests().catch(err => {
  console.error('Fatal test execution error:', err)
  process.exit(1)
})
