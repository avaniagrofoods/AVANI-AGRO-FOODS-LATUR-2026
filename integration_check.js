// integration_check.js
// Puppeteer script to verify HubSpot, Google Analytics, and Google Sheets integrations on https://www.avaniagrofoods.com/
// Run with: node integration_check.js (requires Node >=14 with ES module support)

import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  const requests = [];

  // Listen for network requests
  page.on('request', req => {
    requests.push({ url: req.url(), method: req.method() });
  });

  await page.goto('https://www.avaniagrofoods.com/', { waitUntil: 'networkidle2', timeout: 60000 });

  // Detect HubSpot script
  const hubspotScript = await page.$('script[src*="hs-scripts.com"]');
  const hubspotPresent = !!hubspotScript;

  // Detect Google Analytics (gtag)
  const gaScript = await page.$('script[src*="googletagmanager.com/gtag/js"]');
  const gaPresent = !!gaScript;

  // Detect Google Sheets usage (e.g., script src containing "sheets.googleapis.com")
  const sheetsScript = await page.$('script[src*="sheets.googleapis.com"]');
  const sheetsPresent = !!sheetsScript;

  console.log('HubSpot script present:', hubspotPresent);
  console.log('Google Analytics script present:', gaPresent);
  console.log('Google Sheets script present:', sheetsPresent);
  console.log('Total network requests:', requests.length);
  console.log('Sample request URLs:');
  console.log(requests.slice(0, 10).map(r => r.url));

  await browser.close();
})();
