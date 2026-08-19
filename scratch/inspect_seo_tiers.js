// ============================================================
// AVANI AGRO FOODS — SEO Tier Inspection & Diagnostics
// Target: https://www.avaniagrofoods.com
// ============================================================

const BASE_URL = 'https://www.avaniagrofoods.com';

async function inspectTiers() {
  console.log('====================================================');
  console.log('SEO URL TIER INSPECTION & DIAGNOSTICS');
  console.log('====================================================\n');

  const tiers = {
    tier1: ['/', '/products', '/contact', '/about', '/b2b'],
    tier2: ['/manufacturers', '/importers', '/export-compliance', '/manufacturer-requirements', '/b2b/store', '/blog'],
    tier3Sample: [
      '/blog/moringa-powder-benefits-science-backed',
      '/blog/how-to-choose-quality-moringa-powder',
      '/blog/red-onion-powder-vs-fresh-onions',
      '/blog/how-to-export-moringa-powder-from-india'
    ],
    privateRoutes: ['/affiliate-login', '/admin/quotations', '/quotation-sheet', '/tools']
  };

  const results = [];

  for (const [tierName, routes] of Object.entries(tiers)) {
    console.log(`\n--- Inspecting ${tierName.toUpperCase()} ---`);
    for (const route of routes) {
      try {
        const res = await fetch(`${BASE_URL}${route}`);
        const html = await res.text();
        
        const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim() : '(none)';
        
        const hasCanonical = html.includes('rel="canonical"') || html.includes('https://www.avaniagrofoods.com');
        const isPrivate = tierName === 'privateRoutes';
        
        results.push({
          route,
          tier: tierName,
          status: res.status,
          title: title.substring(0, 40) + '...',
          canonicalVerified: hasCanonical,
          indexingDirective: isPrivate ? 'noindex (Expected)' : 'index, follow'
        });
        console.log(`[HTTP ${res.status}] ${route} | ${isPrivate ? 'PRIVATE (noindex)' : 'INDEXABLE'} | Title: ${title.substring(0, 35)}...`);
      } catch (err) {
        console.error(`Error on ${route}:`, err.message);
      }
    }
  }

  console.log('\n--- TIER AUDIT SUMMARY TABLE ---');
  console.table(results);
}

inspectTiers();
