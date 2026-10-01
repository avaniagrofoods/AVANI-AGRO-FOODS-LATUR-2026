// ============================================================
// AVANI AGRO FOODS — P0.10 BROWSER PRODUCTION INSPECTION
// Comprehensive headless browser inspection across all key pages
// ============================================================

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'https://www.avaniagrofoods.com';

const PAGES_TO_TEST = [
  { name: 'HOME', path: '/' },
  { name: 'ABOUT', path: '/about' },
  { name: 'PRODUCTS', path: '/products' },
  { name: 'CATALOG', path: '/catalog' },
  { name: 'BLOG', path: '/blog' },
  { name: 'CONTACT', path: '/contact' }
];

async function runBrowserInspection() {
  console.log('============================================================');
  console.log('AVANI AGRO FOODS — P0.10 LIVE BROWSER INSPECTION');
  console.log(`Target: ${BASE_URL}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('============================================================\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const inspectionReport = {
    timestamp: new Date().toISOString(),
    pages: [],
    overallStatus: 'PASS'
  };

  try {
    for (const p of PAGES_TO_TEST) {
      console.log(`>>> Inspecting ${p.name} (${p.path})...`);
      const page = await browser.newPage();
      
      const consoleErrors = [];
      const failedRequests = [];
      
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      page.on('requestfailed', req => {
        // Ignore analytics or external tracking failures if any
        failedRequests.push({
          url: req.url(),
          failure: req.failure() ? req.failure().errorText : 'Unknown failure'
        });
      });

      // Desktop Viewport
      await page.setViewport({ width: 1440, height: 900 });
      const response = await page.goto(`${BASE_URL}${p.path}`, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      const httpStatus = response.status();
      const title = await page.title();

      // Check for broken images on the page
      const imageAudit = await page.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll('img'));
        return imgs.map(img => ({
          src: img.src,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          complete: img.complete,
          isBroken: img.complete && img.naturalWidth === 0
        }));
      });

      const brokenImages = imageAudit.filter(img => img.isBroken);

      // Check for React error boundary or empty body
      const bodyContent = await page.evaluate(() => {
        return {
          textLength: document.body.innerText.trim().length,
          hasErrorBoundary: document.body.innerText.includes('Something went wrong') ||
                             document.body.innerText.includes('Minified React error'),
          buttonsCount: document.querySelectorAll('button, a.btn, a[href*="contact"], a[href*="wa.me"]').length,
          hasWhatsAppCta: !!document.querySelector('a[href*="wa.me"], a[href*="whatsapp"]')
        };
      });

      // Take Desktop Screenshot
      const screenshotFilename = `scratch/browser_qa_${p.name.toLowerCase()}_desktop.png`;
      await page.screenshot({ path: screenshotFilename, fullPage: false });

      // Mobile Viewport Check
      await page.setViewport({ width: 390, height: 844, isMobile: true });
      await page.waitForTimeout ? await page.waitForTimeout(500) : await new Promise(r => setTimeout(r, 500));
      
      const mobileAudit = await page.evaluate(() => {
        const menuBtn = document.querySelector('button[aria-label*="menu" i], button.mobile-menu-btn, button svg');
        return {
          hasMobileNavTrigger: !!menuBtn,
          bodyScrollWidth: document.body.scrollWidth,
          windowWidth: window.innerWidth,
          hasHorizontalOverflow: document.body.scrollWidth > window.innerWidth
        };
      });

      const mobileScreenshot = `scratch/browser_qa_${p.name.toLowerCase()}_mobile.png`;
      await page.screenshot({ path: mobileScreenshot, fullPage: false });

      // If contact page, verify form elements
      let formAudit = null;
      if (p.name === 'CONTACT') {
        formAudit = await page.evaluate(() => {
          const form = document.querySelector('form');
          const inputs = Array.from(document.querySelectorAll('input, select, textarea'));
          return {
            hasForm: !!form,
            inputNames: inputs.map(i => i.name || i.id || i.placeholder).filter(Boolean),
            submitButton: !!document.querySelector('button[type="submit"]')
          };
        });
      }

      await page.close();

      const pageResult = {
        name: p.name,
        path: p.path,
        httpStatus,
        title,
        textLength: bodyContent.textLength,
        brokenImagesCount: brokenImages.length,
        brokenImages,
        consoleErrorsCount: consoleErrors.length,
        consoleErrors,
        failedRequestsCount: failedRequests.length,
        failedRequests,
        hasWhatsAppCta: bodyContent.hasWhatsAppCta,
        hasHorizontalOverflow: mobileAudit.hasHorizontalOverflow,
        formAudit,
        status: (httpStatus === 200 && brokenImages.length === 0 && !bodyContent.hasErrorBoundary) ? 'PASS' : 'FAIL'
      };

      inspectionReport.pages.push(pageResult);

      console.log(`  HTTP: ${httpStatus} | Title: "${title.slice(0, 40)}..."`);
      console.log(`  Content length: ${bodyContent.textLength} chars | Broken images: ${brokenImages.length}`);
      console.log(`  Console errors: ${consoleErrors.length} | Failed requests: ${failedRequests.length}`);
      console.log(`  WhatsApp CTA: ${bodyContent.hasWhatsAppCta ? 'Present' : 'None'} | Mobile overflow: ${mobileAudit.hasHorizontalOverflow}`);
      if (formAudit) {
        console.log(`  Contact Form detected: ${formAudit.hasForm} | Inputs: ${formAudit.inputNames.length} | Submit button: ${formAudit.submitButton}`);
      }
      console.log(`  -> Page Status: ${pageResult.status}\n`);

      if (pageResult.status !== 'PASS') {
        inspectionReport.overallStatus = 'FAIL';
      }
    }
  } finally {
    await browser.close();
  }

  fs.writeFileSync('scratch/browser_inspection_report.json', JSON.stringify(inspectionReport, null, 2));
  console.log(`\n============================================================`);
  console.log(`OVERALL BROWSER INSPECTION STATUS: ${inspectionReport.overallStatus}`);
  console.log(`Saved detailed report to scratch/browser_inspection_report.json`);
  console.log(`============================================================\n`);
}

runBrowserInspection().catch(err => {
  console.error('Fatal browser inspection error:', err);
  process.exit(1);
});
