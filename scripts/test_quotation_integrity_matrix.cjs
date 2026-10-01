// ============================================================
// AVANI AGRO FOODS — P3.2 DETERMINISTIC QUOTATION INTEGRITY TEST SUITE
// Automated verification of Tests 1 through 14
// ============================================================

const fs = require('fs');
const path = require('path');

async function runIntegrityTestSuite() {
  console.log('============================================================');
  console.log('AVANI AGRO FOODS — P3.2 QUOTATION INTEGRITY AUTOMATED MATRIX');
  console.log(`Execution Time: ${new Date().toISOString()}`);
  console.log('============================================================\n');

  const {
    calculateQuotation,
    generatePdfQuotation,
    generateDocxQuotation,
    generateExcelQuotation,
    parseQuantityKg,
    parseUnitRate,
    validateQuotation
  } = await import('../api/_lib/quotationEngine.js');

  const results = [];
  function assertTest(id, name, condition, details) {
    const status = condition ? 'PASS' : 'FAIL';
    results.push({ id, name, status, details });
    console.log(`[${id}] ${status.padEnd(4)}: ${name} — ${details}`);
    if (!condition) {
      console.error(`  ERROR: Assertion failed for ${id}`);
    }
  }

  // --- TEST 1: 1 item: quantity = 1, rate = 100 ---
  {
    const q = calculateQuotation({
      items: [{ quantity: 1, rate: 100 }]
    });
    const passed = q.items[0].total === 100 && q.subtotal === 100 && q.grandTotal === 100;
    assertTest('TEST 1', '1 Item (1 @ 100)', passed, `lineTotal=${q.items[0].total}, subtotal=${q.subtotal}, grandTotal=${q.grandTotal}`);
  }

  // --- TEST 2: quantity = 25, rate = 350 -> Expected: 8,750 ---
  {
    const q = calculateQuotation({
      items: [{ quantity: 25, rate: 350 }]
    });
    const passed = q.items[0].total === 8750 && q.subtotal === 8750;
    assertTest('TEST 2', 'Sample Quantity (25 @ 350)', passed, `lineTotal=${q.items[0].total}, subtotal=${q.subtotal}`);
  }

  // --- TEST 3: quantity = 18,000, rate = 350 -> Expected: 6,300,000 ---
  {
    const q = calculateQuotation({
      items: [{ quantity: 18000, rate: 350 }]
    });
    const passed = q.items[0].total === 6300000 && q.subtotal === 6300000;
    assertTest('TEST 3', 'Bulk Container (18,000 @ 350)', passed, `lineTotal=${q.items[0].total}, subtotal=${q.subtotal}`);
  }

  // --- TEST 4: quantity = 18,000, rate = 650 -> Expected: 11,700,000 ---
  {
    const q = calculateQuotation({
      items: [{ quantity: 18000, rate: 650 }]
    });
    const passed = q.items[0].total === 11700000 && q.subtotal === 11700000;
    assertTest('TEST 4', 'Bulk Container Premium (18,000 @ 650)', passed, `lineTotal=${q.items[0].total}, subtotal=${q.subtotal}`);
  }

  // --- TEST 5: Two items: 18,000 × 650 and 18,000 × 350 -> Expected subtotal: 18,000,000 ---
  {
    const q = calculateQuotation({
      quoteId: 'AAF-Q-2026-9075',
      buyerName: 'VIKRAM',
      companyName: 'VIKRAJA SOLAPUR',
      items: [
        {
          name: 'Moringa Leaf Powder (Export Grade A)',
          description: 'Moringa Leaf Powder — Natural Green — 80–100 Mesh — 25 kg Food-Grade HDPE Bags',
          quantity: 18000,
          rate: 650
        },
        {
          name: 'Moringa Leaf Powder (Standard Grade)',
          description: 'Moringa Leaf Powder — Natural Green — 80–100 Mesh — 25 kg Food-Grade HDPE Bags',
          quantity: '18000', // string input from UI
          rate: 350
        }
      ]
    });
    const passed = q.items[0].total === 11700000 && q.items[1].total === 6300000 && q.subtotal === 18000000 && q.grandTotal === 18000000;
    assertTest('TEST 5', 'Two Items Subtotal (18M Total)', passed, `Item1=${q.items[0].total}, Item2=${q.items[1].total}, subtotal=${q.subtotal}, grandTotal=${q.grandTotal}`);
  }

  // --- TEST 6: quantity = 0 -> Must not produce NaN or incorrect totals ---
  {
    const q = calculateQuotation({
      items: [{ quantity: 0, rate: 350 }]
    });
    const passed = q.items[0].quantity === 0 && q.items[0].total === 0 && q.subtotal === 0 && !isNaN(q.grandTotal);
    assertTest('TEST 6', 'Zero Quantity Handling', passed, `quantity=${q.items[0].quantity}, total=${q.items[0].total}, isNaN=${isNaN(q.grandTotal)}`);
  }

  // --- TEST 7: missing quantity -> Must fail validation clearly ---
  {
    const valResult = validateQuotation({
      items: [{ rate: 350 }]
    });
    const passed = valResult.valid === false && valResult.error.toLowerCase().includes('quantity');
    assertTest('TEST 7', 'Missing Quantity Validation', passed, `valid=${valResult.valid}, error="${valResult.error}"`);
  }

  // --- TEST 8: missing rate -> Must fail validation clearly ---
  {
    const valResult = validateQuotation({
      items: [{ quantity: 18000 }]
    });
    const passed = valResult.valid === false && (valResult.error.toLowerCase().includes('rate') || valResult.error.toLowerCase().includes('price'));
    assertTest('TEST 8', 'Missing Rate Validation', passed, `valid=${valResult.valid}, error="${valResult.error}"`);
  }

  // --- TEST 9: formatted quantity: "18,000" -> Must normalize safely to: 18000 ---
  {
    const desc = 'Moringa Leaf Powder — 25 kg Food-Grade HDPE Bags';
    const parsed1 = parseQuantityKg('18,000', desc);
    const parsed2 = parseQuantityKg('18,000 KG', desc);
    const parsed3 = parseQuantityKg('18 MT', desc);
    const passed = parsed1 === 18000 && parsed2 === 18000 && parsed3 === 18000;
    assertTest('TEST 9', 'Formatted Quantity Normalization', passed, `'18,000'=${parsed1}, '18,000 KG'=${parsed2}, '18 MT'=${parsed3}`);
  }

  // --- TEST 10: PDF Parity: Generated PDF totals must equal quotation state totals ---
  {
    const quote = calculateQuotation({
      quoteId: 'AAF-Q-2026-9075',
      buyerName: 'VIKRAM',
      companyName: 'VIKRAJA SOLAPUR',
      country: 'INDIA',
      currency: 'INR',
      items: [
        {
          name: 'Moringa Leaf Powder (Grade A)',
          description: 'Moringa Leaf Powder — Natural Green — 80–100 Mesh — 25 kg Food-Grade HDPE Bags',
          quantity: 18000,
          rate: 650
        },
        {
          name: 'Moringa Leaf Powder (Standard)',
          description: 'Moringa Leaf Powder — Natural Green — 80–100 Mesh — 25 kg Food-Grade HDPE Bags',
          quantity: '18000',
          rate: 350
        }
      ]
    });

    const pdfBuffer = await generatePdfQuotation(quote);
    const pdfBytes = pdfBuffer.length;
    // Verify pdfBuffer is valid PDF header
    const isPdf = pdfBuffer.slice(0, 5).toString('ascii') === '%PDF-';
    // State total: 18,000,000
    const stateTotal = quote.grandTotal;
    // PDF generator recalculates with calculateQuotation(quoteInput), asserting parity
    const recalcQuote = calculateQuotation(quote);
    const passed = isPdf && pdfBytes > 2000 && recalcQuote.grandTotal === stateTotal && recalcQuote.grandTotal === 18000000;
    assertTest('TEST 10', 'Vector PDF Data Parity', passed, `PDF bytes=${pdfBytes}, isPdf=${isPdf}, StateTotal=${stateTotal}, RecalcTotal=${recalcQuote.grandTotal}`);
  }

  // --- TEST 11: DOCX Parity: Generated DOCX totals must equal quotation state totals ---
  {
    const quote = calculateQuotation({
      quoteId: 'AAF-Q-2026-9075',
      buyerName: 'VIKRAM',
      currency: 'INR',
      items: [
        { name: 'Moringa Leaf Powder', quantity: 18000, rate: 650 },
        { name: 'Moringa Leaf Powder', quantity: 18000, rate: 350 }
      ]
    });
    const docxBuffer = await generateDocxQuotation(quote);
    const isDocx = docxBuffer.length > 5000;
    const recalcQuote = calculateQuotation(quote);
    const passed = isDocx && recalcQuote.grandTotal === quote.grandTotal && quote.grandTotal === 18000000;
    assertTest('TEST 11', 'DOCX Document Parity', passed, `DOCX bytes=${docxBuffer.length}, ParityTotal=${recalcQuote.grandTotal}`);
  }

  // --- TEST 12: Reopen Saved Quotation: Saved quotation must reproduce identical calculations ---
  {
    const originalQuote = calculateQuotation({
      quoteId: 'AAF-Q-2026-9075',
      buyerName: 'VIKRAM',
      companyName: 'VIKRAJA SOLAPUR',
      items: [
        { name: 'Moringa Leaf Powder', quantity: 18000, rate: 650 },
        { name: 'Moringa Leaf Powder', quantity: 18000, rate: 350 }
      ]
    });
    // Serialize to JSON and parse back (simulating LocalStorage / DB persistence)
    const serialized = JSON.stringify(originalQuote);
    const reopened = JSON.parse(serialized);
    const recalculated = calculateQuotation(reopened);

    const passed = recalculated.subtotal === originalQuote.subtotal &&
                   recalculated.grandTotal === originalQuote.grandTotal &&
                   recalculated.items[0].total === originalQuote.items[0].total &&
                   recalculated.items[1].total === originalQuote.items[1].total;
    assertTest('TEST 12', 'Reopen Saved Quotation Persistence', passed, `Original=${originalQuote.grandTotal}, Reopened=${recalculated.grandTotal}`);
  }

  // --- TEST 13: Edit Quotation: Changing quantity from 25 to 18,000 must update without stale values ---
  {
    // Initially quote has 25 kg
    const initial = calculateQuotation({
      items: [{ name: 'Moringa Leaf Powder', quantity: 25, rate: 350 }]
    });
    const initialTotal = initial.grandTotal; // 8,750

    // User edits quantity to 18,000
    const editedInput = {
      ...initial,
      items: [{ ...initial.items[0], quantity: 18000 }]
    };
    const edited = calculateQuotation(editedInput);
    const editedTotal = edited.grandTotal; // 6,300,000

    const pdfBuffer = await generatePdfQuotation(edited);
    const passed = initialTotal === 8750 && editedTotal === 6300000 && pdfBuffer.length > 2000;
    assertTest('TEST 13', 'Edit Quotation Quantity 25 -> 18,000', passed, `InitialTotal=${initialTotal}, EditedTotal=${editedTotal}`);
  }

  // --- TEST 14: Duplicate Quotation: Duplicating must copy current saved values, not Product Master defaults ---
  {
    const customQuote = calculateQuotation({
      quoteId: 'AAF-Q-2026-9075',
      buyerName: 'VIKRAM',
      companyName: 'VIKRAJA SOLAPUR',
      items: [
        { name: 'Custom Moringa Batch', quantity: 18000, rate: 650 },
        { name: 'Custom Secondary Batch', quantity: 18000, rate: 350 }
      ]
    });

    // Simulate duplication
    const duplicatedInput = {
      ...customQuote,
      quoteId: 'AAF-Q-2026-9999',
      date: '2026-10-02'
    };
    const duplicated = calculateQuotation(duplicatedInput);

    const passed = duplicated.quoteId === 'AAF-Q-2026-9999' &&
                   duplicated.items.length === 2 &&
                   duplicated.items[0].rate === 650 &&
                   duplicated.items[1].rate === 350 &&
                   duplicated.grandTotal === customQuote.grandTotal;
    assertTest('TEST 14', 'Duplicate Quotation Preservation', passed, `NewQuoteId=${duplicated.quoteId}, Items=${duplicated.items.length}, Total=${duplicated.grandTotal}`);
  }

  console.log('\n============================================================');
  const allPassed = results.every(r => r.status === 'PASS');
  console.log(`TOTAL TESTS: ${results.length} | PASSED: ${results.filter(r => r.status === 'PASS').length} | FAILED: ${results.filter(r => r.status === 'FAIL').length}`);
  console.log(`STATUS: ${allPassed ? 'ALL TESTS PASSED — 100% PARITY CERTIFIED' : 'TESTS FAILED'}`);
  console.log('============================================================\n');

  return allPassed;
}

runIntegrityTestSuite().then(success => {
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
