const puppeteer = require('puppeteer');
const fs = require('fs');

const pages = [
  '/',
  '/about',
  '/products',
  '/catalog',
  '/catalog/moringa-powder',
  '/catalog/red-onion-powder',
  '/trade-coordination',
  '/export-process',
  '/export-compliance',
  '/resources',
  '/blog',
  '/contact'
];

async function runAudit() {
  console.log('============================================================');
  console.log('TASK 6 & 7: FULL INDEXABILITY & METADATA AUDIT');
  console.log('Target: https://www.avaniagrofoods.com');
  console.log('Timestamp: ' + new Date().toISOString());
  console.log('============================================================\n');

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  } catch (err) {
    console.log('Puppeteer launch notice:', err.message, '- falling back to direct HTTP inspection');
  }

  const results = [];

  for (const p of pages) {
    const url = 'https://www.avaniagrofoods.com' + p;
    
    // 1. Raw HTTP check
    const rawRes = await fetch(url);
    const rawStatus = rawRes.status;
    const xRobots = rawRes.headers.get('x-robots-tag') || 'absent';
    const rawHtml = await rawRes.text();

    let pageTitle = '';
    let metaDesc = '';
    let canonical = '';
    let robotsMeta = '';
    let ogTitle = '';
    let ogDesc = '';
    let ogImage = '';
    let twitterCard = '';
    let structuredData = [];

    if (browser) {
      const page = await browser.newPage();
      await page.setViewport({ width: 1440, height: 900 });
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      pageTitle = await page.title();
      
      const meta = await page.evaluate(() => {
        const getMeta = (name, attr = 'name') => {
          const el = document.querySelector(`meta[${attr}="${name}"]`);
          return el ? el.getAttribute('content') : '';
        };

        const canEl = document.querySelector('link[rel="canonical"]');
        
        const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
        const jsonLd = scripts.map(s => {
          try {
            return JSON.parse(s.textContent);
          } catch {
            return null;
          }
        }).filter(Boolean);

        return {
          desc: getMeta('description'),
          robots: getMeta('robots'),
          canonical: canEl ? canEl.getAttribute('href') : '',
          ogTitle: getMeta('og:title', 'property'),
          ogDesc: getMeta('og:description', 'property'),
          ogImage: getMeta('og:image', 'property'),
          twitterCard: getMeta('twitter:card'),
          jsonLd
        };
      });

      metaDesc = meta.desc;
      canonical = meta.canonical;
      robotsMeta = meta.robots;
      ogTitle = meta.ogTitle;
      ogDesc = meta.ogDesc;
      ogImage = meta.ogImage;
      twitterCard = meta.twitterCard;
      structuredData = meta.jsonLd;

      await page.close();
    } else {
      // Fallback regex parsing of static HTML
      const tMatch = rawHtml.match(/<title>([^<]+)<\/title>/i);
      pageTitle = tMatch ? tMatch[1] : '';
      const dMatch = rawHtml.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
      metaDesc = dMatch ? dMatch[1] : '';
      const cMatch = rawHtml.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
      canonical = cMatch ? cMatch[1] : '';
    }

    const item = {
      path: p,
      url,
      httpStatus: rawStatus,
      xRobotsTag: xRobots,
      title: pageTitle,
      metaDescription: metaDesc,
      canonicalUrl: canonical,
      robotsMeta: robotsMeta || 'index, follow (default)',
      ogTitle,
      ogDesc,
      ogImage,
      twitterCard,
      structuredDataTypes: structuredData.map(s => s['@type'] || (Array.isArray(s['@graph']) ? s['@graph'].map(g => g['@type']).join(', ') : 'Unknown')),
      isIndexable: rawStatus === 200 && !robotsMeta.includes('noindex') && !xRobots.includes('noindex')
    };

    results.push(item);

    console.log(`PAGE: ${p}`);
    console.log(`  HTTP Status:       ${item.httpStatus}`);
    console.log(`  Title:             ${item.title}`);
    console.log(`  Meta Description:  ${item.metaDescription ? item.metaDescription.slice(0, 90) + '...' : '[NONE]'}`);
    console.log(`  Canonical:         ${item.canonicalUrl || '[NONE]'}`);
    console.log(`  Robots Directive:  ${item.robotsMeta} | X-Robots-Tag: ${item.xRobotsTag}`);
    console.log(`  Open Graph:        Title="${item.ogTitle || 'N/A'}" | Image="${item.ogImage || 'N/A'}"`);
    console.log(`  Structured Data:   ${item.structuredDataTypes.length ? item.structuredDataTypes.join(', ') : 'None'}`);
    console.log(`  Indexable:         ${item.isIndexable ? 'YES (PASS)' : 'NO (FAIL)'}`);
    console.log('');
  }

  if (browser) await browser.close();

  // Write structured JSON results to scratch
  if (!fs.existsSync('scratch')) fs.mkdirSync('scratch', { recursive: true });
  fs.writeFileSync('scratch/seo_pages_audit.json', JSON.stringify(results, null, 2));
  console.log('Saved detailed results to scratch/seo_pages_audit.json');
}

runAudit().catch(err => {
  console.error('Audit run error:', err);
  process.exit(1);
});
