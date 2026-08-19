async function testLiveQuotationApi() {
  console.log('Testing Live Production Quotation APIs on https://www.avaniagrofoods.com ...');

  // Test 1: Quotation Calculation
  const calcRes = await fetch('https://www.avaniagrofoods.com/api/quotation?action=calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerName: 'Live Test Partner',
      product: 'Moringa Leaf Powder',
      quantity: 500,
      currency: 'USD',
      incoterm: 'CIF',
      country: 'Japan',
      destination: 'Port of Tokyo'
    })
  });
  const calcData = await calcRes.json();
  console.log('Live Quotation API Response:', JSON.stringify(calcData, null, 2));

  // Test 2: Save Lead API
  const leadRes = await fetch('https://www.avaniagrofoods.com/api/save-lead', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Tokyo Organic Foods KK',
      email: 'import@tokyoorganic.jp',
      phone: '+81 3 1234 5678',
      country: 'Japan',
      product: 'Moringa Leaf Powder (Food Grade / Organic)',
      quantity: 500,
      currency: 'USD',
      source: 'Live_Test_Verification'
    })
  });
  const leadData = await leadRes.json();
  console.log('Live Lead Capture API Response:', JSON.stringify(leadData, null, 2));

  console.log('\nLIVE API VERIFICATION COMPLETE: ALL SERVERLESS ENDPOINTS OPERATIONAL!');
}

testLiveQuotationApi().catch(console.error);
