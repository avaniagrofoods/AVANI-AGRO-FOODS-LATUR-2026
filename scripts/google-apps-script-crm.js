// ============================================================
// AVANI AGRO FOODS — CUSTOMER INQUIRY & QUOTATION CRM
// Google Apps Script Webhook (Autonomous 5-Tab Architecture)
// Sheet Name: AVANI AGRO FOODS — Customer Inquiry & Quotation CRM
// ============================================================

/**
 * Automatically initializes or retrieves sheet with standardized styling & headers
 */
function getOrCreateSheet(ss, sheetName, headers) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if (headers && headers.length > 0) {
      sheet.appendRow(headers);
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#1A4D2E'); // Avani Forest Green
      headerRange.setFontColor('#FFFFFF');
      headerRange.setHorizontalAlignment('center');
      sheet.setFrozenRows(1);
    }
  }
  return sheet;
}

/**
 * Seeds Product Master sheet if empty
 */
function seedProductMaster(ss) {
  var headers = [
    'Product ID', 'Product Name', 'Short Name', 'Botanical Name',
    'Full Description', 'HS Code', 'Unit', 'Default Rate (INR)',
    'Default Rate (USD)', 'Default Packaging', 'Default Specifications',
    'Default Incoterm', 'Active', 'Last Updated', 'Verification Status'
  ];
  var sheet = getOrCreateSheet(ss, 'Product Master', headers);
  if (sheet.getLastRow() <= 1) {
    var products = [
      [
        'moringa-leaf-powder', 'Moringa Leaf Powder', 'Moringa Powder', 'Moringa Oleifera',
        'Moringa Leaf Powder — Natural Green — 80–100 Mesh — Moisture Max 7–8% — 100% Pure — 25 kg Food-Grade HDPE Bags',
        '12119029', 'KG', 350.00, 4.80, '25 kg Food-Grade HDPE Bags',
        'Natural Green, 80–100 Mesh, Moisture Max 7–8%, 100% Pure Moringa Oleifera Leaf Powder',
        'FOB Nhava Sheva (JNPT Mumbai)', 'TRUE', new Date().toISOString(), 'VERIFIED_ACTIVE'
      ],
      [
        'red-onion-powder', 'Dehydrated Red Onion Powder', 'Red Onion Powder', 'Allium Cepa',
        'Dehydrated Red Onion Powder — Premium Export Grade — 80–100 Mesh — Moisture < 6% — 20/25 kg Corrugated Export Cartons',
        '07122000', 'KG', 800.00, 9.60, '20 kg / 25 kg Poly-lined Corrugated Export Cartons',
        'Dehydrated Allium Cepa, 80–100 Mesh, Moisture < 6%, Characteristic Pungent Aroma, Pinkish Red',
        'FOB Nhava Sheva (JNPT Mumbai)', 'TRUE', new Date().toISOString(), 'VERIFIED_ACTIVE'
      ]
    ];
    for (var i = 0; i < products.length; i++) {
      sheet.appendRow(products[i]);
    }
  }
}

/**
 * Handle HTTP GET Requests (Healthcheck & Metadata)
 */
function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: 'AVANI AGRO FOODS CRM Webhook Active',
    spreadsheetName: ss.getName(),
    spreadsheetId: ss.getId(),
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle HTTP POST Requests (Inquiries & Quotations Dispatch)
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000); // 10-second lock protection against concurrency collisions
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var data = JSON.parse(e.postData.contents);
    var target = data.targetSheet || (data.type === 'QUOTATION' ? 'Quotations' : 'Customer Inquiries');

    // Initialize Required Tabs
    seedProductMaster(ss);
    getOrCreateSheet(ss, 'Activity Log', ['Timestamp', 'Action', 'Reference ID', 'User / Source', 'Details']);
    getOrCreateSheet(ss, 'Settings', ['Key', 'Value', 'Description', 'Updated At']);

    // 1. CUSTOMER INQUIRIES TAB
    if (target === 'Customer Inquiries' || data.type === 'CUSTOMER_INQUIRY') {
      var inqHeaders = [
        'Inquiry ID', 'Inquiry Date', 'Buyer Name', 'Company', 'Email',
        'Phone', 'Country', 'Product', 'Buyer Requirement', 'Quantity Original',
        'Quantity Normalized KG', 'Mesh', 'Moisture', 'Purity', 'Packaging',
        'Destination', 'Destination Port', 'Incoterm', 'Requested Price', 'Currency',
        'COA Requested', 'Certifications Requested', 'Lead Time', 'Source',
        'Quotation ID', 'Quotation Status', 'Admin Status', 'Next Action', 'Notes', 'Last Updated'
      ];
      var inqSheet = getOrCreateSheet(ss, 'Customer Inquiries', inqHeaders);
      
      inqSheet.appendRow([
        data.inquiryId || ('AAF-INQ-' + Date.now()),
        data.inquiryDate || new Date().toISOString().split('T')[0],
        data.buyerName || data.name || '',
        data.company || '',
        data.email || '',
        data.phone || '',
        data.country || '',
        data.product || '',
        data.buyerRequirement || data.message || '',
        data.quantityOriginal || data.quantity || '',
        data.quantityNormalizedKg || data.quantity || 0,
        data.mesh || '',
        data.moisture || '',
        data.purity || '',
        data.packaging || '',
        data.destination || '',
        data.destinationPort || '',
        data.incoterm || '',
        data.requestedPrice || data.rate || '',
        data.currency || 'INR',
        data.coaRequested || 'NO',
        data.certificationsRequested || 'NO',
        data.leadTime || '',
        data.source || 'Website',
        data.quotationId || '',
        data.quotationStatus || 'DRAFT',
        data.adminStatus || 'NEW',
        data.nextAction || 'Review Quotation Draft',
        data.notes || '',
        data.lastUpdated || new Date().toISOString()
      ]);

      // Log to Activity Log
      var logSheet = ss.getSheetByName('Activity Log');
      if (logSheet) {
        logSheet.appendRow([
          new Date().toISOString(),
          'INQUIRY_CREATED',
          data.inquiryId || '',
          data.source || 'Website',
          'Inquiry for ' + (data.product || '') + ' (' + (data.quantityNormalizedKg || '') + ' KG)'
        ]);
      }
    }

    // 2. QUOTATIONS TAB
    if (target === 'Quotations' || data.type === 'QUOTATION') {
      var quoteHeaders = [
        'Quotation ID', 'Inquiry ID', 'Quote Date', 'Validity Date', 'Buyer',
        'Company', 'Country', 'Product', 'HS Code', 'Description',
        'Quantity KG', 'Unit', 'Unit Rate', 'Currency', 'Subtotal',
        'Freight', 'Insurance', 'Documentation', 'Grand Total', 'Incoterm',
        'Destination Port', 'Payment Terms', 'Delivery Timeline', 'Quotation Status',
        'PDF Link', 'DOCX Link', 'Last Updated', 'Updated By'
      ];
      var quoteSheet = getOrCreateSheet(ss, 'Quotations', quoteHeaders);

      quoteSheet.appendRow([
        data.quotationId || '',
        data.inquiryId || '',
        data.quoteDate || new Date().toISOString().split('T')[0],
        data.validityDate || '12 Oct 2026',
        data.buyer || data.buyerName || '',
        data.company || data.companyName || '',
        data.country || '',
        data.product || '',
        data.hsCode || data.hscode || '',
        data.description || '',
        data.quantityKg || data.quantity || 0,
        data.unit || 'KG',
        data.unitRate || data.rate || 0,
        data.currency || 'INR',
        data.subtotal || 0,
        data.freight || 0,
        data.insurance || 0,
        data.documentation || 0,
        data.grandTotal || 0,
        data.incoterm || '',
        data.destinationPort || '',
        data.paymentTerms || '',
        data.deliveryTimeline || '',
        data.quotationStatus || 'DRAFT',
        data.pdfLink || '',
        data.docxLink || '',
        data.lastUpdated || new Date().toISOString(),
        data.updatedBy || 'Website Automation Engine'
      ]);

      // Log to Activity Log
      var logSheetQ = ss.getSheetByName('Activity Log');
      if (logSheetQ) {
        logSheetQ.appendRow([
          new Date().toISOString(),
          'QUOTATION_RECORDED',
          data.quotationId || '',
          data.updatedBy || 'System',
          'Quotation generated for ' + (data.buyer || '') + ' — Value: ' + (data.currency || '') + ' ' + (data.grandTotal || 0)
        ]);
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Record synchronized successfully with Google Sheets CRM.',
      targetSheet: target,
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.message
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
