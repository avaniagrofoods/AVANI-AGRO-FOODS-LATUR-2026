// ============================================================
// AVANI AGRO FOODS — COMPLETE PRODUCTION AUDIT & VERIFICATION
// Audits all 30 B2B Articles on https://www.avaniagrofoods.com/
// Checks HTTP status, DOM rendering, SEO, Canonical, Schema, Images, FAQs & CTAs
// ============================================================

const puppeteer = require('puppeteer');
const https = require('https');
const http = require('http');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'https://www.avaniagrofoods.com';
const rootDir = path.resolve(__dirname, '..');

// Helper to perform HTTPS GET
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AvaniAudit/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data
        });
      });
    });
    req.on('error', (err) => reject(err));
    req.setTimeout(15000, () => {
      req.abort();
      reject(new Error(`Timeout fetching ${url}`));
    });
  });
}

async function runProductionAudit() {
  console.log('========================================================================');
  console.log('AVANI AGRO FOODS — INDEPENDENT PRODUCTION VERIFICATION AUDIT');
  console.log(`Target: ${BASE_URL}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('========================================================================\n');

  // 1. Load articles data
  const blogsModulePath = path.join(rootDir, 'src', 'data', 'blogs.js');
  const { BLOGS } = await import('file:///' + blogsModulePath.replace(/\\/g, '/'));

  console.log(`Loaded ${BLOGS.length} articles from source configuration.`);

  // 2. Launch Puppeteer
  console.log('\nLaunching headless browser for deep DOM & visual audit...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const auditResults = [];
  let passedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < BLOGS.length; i++) {
    const blog = BLOGS[i];
    const articleNum = i + 1;
    const articleUrl = `${BASE_URL}/blog/${blog.slug}`;
    const cleanThumb = blog.thumbnail.startsWith('/') ? blog.thumbnail.slice(1) : blog.thumbnail;
    const imageUrl = `${BASE_URL}/${cleanThumb}`;

    process.stdout.write(`[${articleNum.toString().padStart(2, '0')}/30] Auditing: ${blog.slug.slice(0, 45).padEnd(45)} ... `);

    const result = {
      id: blog.id,
      number: articleNum,
      slug: blog.slug,
      title: blog.title,
      category: blog.category,
      url: articleUrl,
      httpStatus: 0,
      renderOk: false,
      titleMatch: false,
      canonicalMatch: false,
      metaDescOk: false,
      ogTagsOk: false,
      schemaOk: false,
      renderedH1: '',
      renderedH2Count: 0,
      renderedWordCount: 0,
      imageHttpOk: false,
      imageDomOk: false,
      faqOk: false,
      ctaOk: false,
      relatedOk: false,
      mobileOk: false,
      errors: []
    };

    try {
      // 1. Direct HTTP GET Check
      const httpRes = await fetchUrl(articleUrl);
      result.httpStatus = httpRes.statusCode;
      if (httpRes.statusCode !== 200) {
        result.errors.push(`HTTP status returned ${httpRes.statusCode}`);
      }

      // 2. Image HTTP GET Check
      try {
        const imgRes = await fetchUrl(imageUrl);
        result.imageHttpOk = (imgRes.statusCode === 200);
        if (imgRes.statusCode !== 200) {
          result.errors.push(`Featured image HTTP returned ${imgRes.statusCode}`);
        }
      } catch (err) {
        result.errors.push(`Featured image fetch error: ${err.message}`);
      }

      // 3. Headless Browser Page Rendering Check (Desktop)
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 800 });

      const pageErrors = [];
      page.on('pageerror', err => pageErrors.push(err.message));

      await page.goto(articleUrl, { waitUntil: 'networkidle2', timeout: 30000 });

      // Wait for React to render
      await page.waitForSelector('h1', { timeout: 10000 });

      const domData = await page.evaluate(() => {
        const h1 = document.querySelector('h1') ? document.querySelector('h1').innerText.trim() : '';
        const title = document.title;
        const canonical = document.querySelector('link[rel="canonical"]') ? document.querySelector('link[rel="canonical"]').getAttribute('href') : '';
        const metaDesc = document.querySelector('meta[name="description"]') ? document.querySelector('meta[name="description"]').getAttribute('content') : '';
        const ogTitle = document.querySelector('meta[property="og:title"]') ? document.querySelector('meta[property="og:title"]').getAttribute('content') : '';
        const ogImage = document.querySelector('meta[property="og:image"]') ? document.querySelector('meta[property="og:image"]').getAttribute('content') : '';
        const ogDesc = document.querySelector('meta[property="og:description"]') ? document.querySelector('meta[property="og:description"]').getAttribute('content') : '';
        
        // Check JSON-LD
        let hasBlogPosting = false;
        let hasBreadcrumbs = false;
        const schemaScripts = document.querySelectorAll('script[type="application/ld+json"]');
        schemaScripts.forEach(s => {
          try {
            const data = JSON.parse(s.innerText);
            if (data['@type'] === 'BlogPosting') hasBlogPosting = true;
            if (data['@type'] === 'BreadcrumbList') hasBreadcrumbs = true;
          } catch(e) {}
        });

        // Headings
        const h2Elements = Array.from(document.querySelectorAll('h2')).map(el => el.innerText.trim());
        
        // Article text content
        const articleEl = document.querySelector('article') || document.querySelector('.article-content') || document.querySelector('main');
        const text = articleEl ? articleEl.innerText : document.body.innerText;
        const words = text.split(/\s+/).filter(w => w.length > 0).length;

        // Image in DOM
        const imgEl = document.querySelector('img[src*="/blog/"]') || document.querySelector('.article-hero-image img');
        const imgRendered = imgEl ? (imgEl.naturalWidth > 0 && imgEl.getAttribute('alt')) : false;

        // FAQs in DOM
        const hasFaqSection = /FAQ|Frequently Asked Questions/i.test(document.body.innerText);

        // CTAs in DOM
        const hasQuoteCta = /Request Official Quotation|Request Quotation|Quick Enquiry|Connect with Sachin Shinde/i.test(document.body.innerText);
        const hasWhatsAppCta = document.querySelector('a[href*="wa.me"]') !== null;

        // Related articles in DOM
        const relatedLinks = Array.from(document.querySelectorAll('a[href*="/blog/article-"]'));

        return {
          h1,
          title,
          canonical,
          metaDesc,
          ogTitle,
          ogImage,
          ogDesc,
          hasBlogPosting,
          hasBreadcrumbs,
          h2Count: h2Elements.length,
          h2Elements,
          wordCount: words,
          imgRendered: Boolean(imgRendered),
          hasFaqSection,
          hasQuoteCta,
          hasWhatsAppCta,
          relatedCount: relatedLinks.length
        };
      });

      result.renderOk = Boolean(domData.h1);
      result.renderedH1 = domData.h1;
      result.titleMatch = domData.title.includes('AVANI AGRO FOODS');
      result.canonicalMatch = (domData.canonical === articleUrl);
      result.metaDescOk = Boolean(domData.metaDesc && domData.metaDesc.length > 40);
      result.ogTagsOk = Boolean(domData.ogTitle && domData.ogImage && domData.ogDesc);
      result.schemaOk = Boolean(domData.hasBlogPosting || domData.hasBreadcrumbs);
      result.renderedH2Count = domData.h2Count;
      result.renderedWordCount = domData.wordCount;
      result.imageDomOk = domData.imgRendered;
      result.faqOk = domData.hasFaqSection;
      result.ctaOk = (domData.hasQuoteCta && domData.hasWhatsAppCta);
      result.relatedOk = (domData.relatedCount >= 3);

      // 4. Mobile Viewport Check (iPhone 12/13/14 size: 390x844)
      await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
      await new Promise(r => setTimeout(r, 500));

      const mobileMetrics = await page.evaluate(() => {
        return {
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
        };
      });

      result.mobileOk = !mobileMetrics.hasHorizontalOverflow;

      await page.close();

      const isAllOk = result.httpStatus === 200 &&
                      result.renderOk &&
                      result.canonicalMatch &&
                      result.metaDescOk &&
                      result.imageHttpOk &&
                      result.faqOk &&
                      result.ctaOk &&
                      result.mobileOk;

      if (isAllOk) {
        console.log(`PASS (${result.renderedWordCount}w, ${result.renderedH2Count} h2s, HTTP 200)`);
        passedCount++;
      } else {
        console.log(`WARN/FAIL -> Issues: ${result.errors.join('; ') || 'DOM assertion failure'}`);
        failedCount++;
      }

    } catch (err) {
      result.errors.push(`Execution error: ${err.message}`);
      console.log(`ERROR (${err.message})`);
      failedCount++;
    }

    auditResults.push(result);
  }

  await browser.close();

  // Save audit report
  const reportPath = path.join(rootDir, 'docs', 'audits', 'production', 'ARTICLE_30_PRODUCTION_VERIFICATION_AUDIT.json');
  fs.writeFileSync(reportPath, JSON.stringify(auditResults, null, 2), 'utf-8');

  console.log('\n========================================================================');
  console.log(`AUDIT COMPLETE: ${passedCount}/30 Passed, ${failedCount}/30 Flagged/Failed.`);
  console.log(`Report saved to: ${reportPath}`);
  console.log('========================================================================\n');

  return auditResults;
}

runProductionAudit().catch(err => {
  console.error('[AUDIT FATAL ERROR]:', err);
  process.exit(1);
});
