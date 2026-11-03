const puppeteer = require('puppeteer');
const http = require('http');
const path = require('path');
const fs = require('fs');

async function testLocalBuild() {
  const rootDir = path.resolve(__dirname, '..');
  const distDir = path.join(rootDir, 'dist');
  
  // Native HTTP server for dist
  const server = http.createServer((req, res) => {
    let filePath = path.join(distDir, req.url.split('?')[0]);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(distDir, 'index.html');
    }
    const ext = path.extname(filePath);
    let contentType = 'text/html';
    if (ext === '.js') contentType = 'application/javascript';
    if (ext === '.css') contentType = 'text/css';
    if (ext === '.webp') contentType = 'image/webp';
    if (ext === '.png') contentType = 'image/png';
    if (ext === '.jpg') contentType = 'image/jpeg';
    
    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500);
        res.end('Error');
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      }
    });
  });

  await new Promise(resolve => server.listen(4173, resolve));
  console.log('Local dist preview server listening on port 4173');

  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  const testUrl = 'http://localhost:4173/blog/what-is-moringa-powder-b2b-buyer-sourcing-guide-india';
  console.log('Navigating to:', testUrl);
  await page.goto(testUrl, { waitUntil: 'networkidle2' });
  await page.waitForSelector('h1', { timeout: 10000 });

  // Desktop check
  await page.setViewport({ width: 1280, height: 800 });
  const desktopData = await page.evaluate(() => ({
    title: document.title,
    h1: document.querySelector('h1')?.innerText,
    canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
    schema: document.querySelector('script#dynamic-seo-schema')?.innerText,
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth
  }));
  console.log('Desktop Check:', desktopData);

  // Mobile check (390x844)
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await new Promise(r => setTimeout(r, 600));

  const mobileData = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
  }));
  console.log('Mobile Check (390px):', mobileData);

  await browser.close();
  server.close();

  if (mobileData.hasHorizontalOverflow) {
    console.error('FAILED: Mobile horizontal overflow still present!');
    process.exit(1);
  } else {
    console.log('SUCCESS: Zero horizontal overflow on mobile!');
  }
}

testLocalBuild().catch(err => {
  console.error(err);
  process.exit(1);
});
