const puppeteer = require('puppeteer');

async function testOne() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  const testUrl = 'https://www.avaniagrofoods.com/blog/what-is-moringa-powder-b2b-buyer-sourcing-guide-india';
  console.log('Navigating to:', testUrl);
  await page.goto(testUrl, { waitUntil: 'networkidle2' });
  await page.waitForSelector('h1', { timeout: 10000 });

  const data = await page.evaluate(() => {
    return {
      title: document.title,
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
      metaDesc: document.querySelector('meta[name="description"]')?.getAttribute('content'),
      h1: document.querySelector('h1')?.innerText,
      imgSrc: document.querySelector('img[src*="/blog/"]')?.src,
      imgNaturalWidth: document.querySelector('img[src*="/blog/"]')?.naturalWidth,
      imgAlt: document.querySelector('img[src*="/blog/"]')?.getAttribute('alt'),
      hasQuoteCta: /Request Official Quotation|Request Quotation|Quick Enquiry|Connect with Sachin Shinde/i.test(document.body.innerText),
      hasWhatsAppCta: document.querySelector('a[href*="wa.me"]') !== null,
      hasFaqSection: /FAQ|Frequently Asked Questions/i.test(document.body.innerText),
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      allImages: Array.from(document.querySelectorAll('img')).map(i => ({ src: i.src, alt: i.alt, naturalWidth: i.naturalWidth }))
    };
  });

  console.log('DOM Evaluation:');
  console.log(JSON.stringify(data, null, 2));

  // Mobile check
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await new Promise(r => setTimeout(r, 500));
  const mobileData = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
  }));
  console.log('Mobile Evaluation:');
  console.log(JSON.stringify(mobileData, null, 2));

  await browser.close();
}

testOne().catch(console.error);
