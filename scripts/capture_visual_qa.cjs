const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function capture() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const filesToCapture = [
    { pdf: 'scratch/Vikram_Quotation_AAF-Q-2026-9075.pdf', out: 'scratch/vikram_quotation_visual_qa.png' },
    { pdf: 'scratch/Long_Description_Wrapped.pdf', out: 'scratch/long_desc_quotation_visual_qa.png' },
    { pdf: 'scratch/Multi_Product_Quotation.pdf', out: 'scratch/multi_product_quotation_visual_qa.png' }
  ];

  for (const item of filesToCapture) {
    const pdfPath = path.resolve(item.pdf);
    const pdfBytes = fs.readFileSync(pdfPath);
    const base64 = pdfBytes.toString('base64');

    const htmlPath = path.resolve('scratch/view_pdf.html');
    const fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/');

    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 2200 });
    await page.goto(fileUrl, { waitUntil: 'networkidle2' });

    await page.evaluate((b64) => {
      return window.loadPdf(b64);
    }, base64);

    await page.waitForFunction(() => window.__PDF_RENDERED__ === true, { timeout: 15000 });

    const canvas = await page.$('#page-1');
    const screenshotPath = path.resolve(item.out);
    await canvas.screenshot({ path: screenshotPath });
    console.log('✓ Visual QA Screenshot successfully saved to:', screenshotPath);
    await page.close();
  }

  await browser.close();
}

capture().catch(err => {
  console.error('Capture error:', err);
  process.exit(1);
});
