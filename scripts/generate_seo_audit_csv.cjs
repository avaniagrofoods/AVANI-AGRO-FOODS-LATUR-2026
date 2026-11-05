const fs = require('fs');
const path = require('path');

// Dynamically import ESM modules
async function run() {
  const moringaModule = await import('../src/data/articles/moringaArticles.js');
  const onionModule = await import('../src/data/articles/onionArticles.js');

  const MORINGA_ARTICLES = moringaModule.MORINGA_ARTICLES;
  const ONION_ARTICLES = onionModule.ONION_ARTICLES;
  const all = [...MORINGA_ARTICLES, ...ONION_ARTICLES];

  const header = [
    'ID',
    'Article_Slug',
    'Category',
    'Article_Title',
    'Primary_Keyword',
    'Secondary_Keywords',
    'Search_Intent',
    'Target_Buyer_Persona',
    'SEO_Title',
    'SEO_Description',
    'Title_Length_Chars',
    'Meta_Desc_Length_Chars',
    'H1_Heading',
    'H2_Count',
    'H3_Count',
    'Word_Count',
    'Internal_Links_Count',
    'Internal_Link_Targets',
    'Links_To_Moringa_Landing',
    'Links_To_Onion_Landing',
    'Current_CTA',
    'SEO_Content_Grade',
    'Audit_Findings_Deficiencies',
    'Actionable_Remediation_Priority'
  ].join(',');

  const rows = all.map(a => {
    const words = a.content ? a.content.split(/\s+/).filter(Boolean).length : 0;
    const h2Count = (a.content.match(/^##\s+/gm) || []).length;
    const h3Count = (a.content.match(/^###\s+/gm) || []).length;
    const titleLen = (a.seoTitle || a.title || '').length;
    const descLen = (a.seoDesc || a.excerpt || '').length;
    const internalLinks = (a.content.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [])
      .map(l => l.match(/\[([^\]]+)\]\(([^)]+)\)/)[2])
      .filter(l => l.startsWith('/') || l.includes('avaniagrofoods.com'));
    
    const linksToMoringa = internalLinks.filter(l => l.includes('moringa-powder-bulk-supplier-india')).length;
    const linksToOnion = internalLinks.filter(l => l.includes('red-onion-powder-bulk-supplier-india')).length;
    
    const isMoringa = a.id <= 15;
    const primaryKw = a.keywords && a.keywords[0] ? a.keywords[0] : (isMoringa ? 'moringa powder bulk' : 'red onion powder bulk');
    const secKws = a.keywords ? a.keywords.slice(1).join('; ') : '';
    
    // Search intent & persona
    let intent = 'Commercial Investigation';
    let persona = 'Procurement Manager / Food Importer';
    if (a.title.toLowerCase().includes('what is') || a.title.toLowerCase().includes('how is')) {
      intent = 'Informational / Commercial';
      persona = 'Technical R&D / Ingredient Sourcing Specialist';
    } else if (a.title.toLowerCase().includes('specification') || a.title.toLowerCase().includes('quality checklist')) {
      intent = 'Commercial / Technical Specification';
      persona = 'QA / QC Manager & Compliance Officer';
    } else if (a.title.toLowerCase().includes('choose') || a.title.toLowerCase().includes('supplier') || a.title.toLowerCase().includes('compare') || a.title.toLowerCase().includes('questions to ask')) {
      intent = 'Commercial Investigation';
      persona = 'B2B Sourcing Director / Commodity Buyer';
    } else if (a.title.toLowerCase().includes('request') || a.title.toLowerCase().includes('rfq') || a.title.toLowerCase().includes('sample') || a.title.toLowerCase().includes('how to request')) {
      intent = 'Transactional';
      persona = 'Purchasing Agent / Commercial Buyer';
    } else if (a.title.toLowerCase().includes('applications') || a.title.toLowerCase().includes('manufacturing') || a.title.toLowerCase().includes('seasonings')) {
      intent = 'Commercial / Formulation';
      persona = 'Food Scientist / Product Developer';
    }

    // Grade calculation
    let grade = 'B';
    let deficiencies = [];
    let remediation = [];

    if (titleLen > 60) {
      deficiencies.push(`Title exceeds 60-char desktop limit (${titleLen} chars)`);
      remediation.push('Shorten title or brand suffix to maintain <60 chars');
    }
    if (descLen > 160) {
      deficiencies.push(`Meta desc exceeds 160 chars (${descLen} chars)`);
      remediation.push('Condense meta description to 150-155 chars');
    }
    if (isMoringa && linksToMoringa === 0) {
      deficiencies.push('Zero internal links to /moringa-powder-bulk-supplier-india landing page');
      remediation.push('Add contextual anchor text linking to Moringa Bulk Landing Page');
    }
    if (!isMoringa && linksToOnion === 0) {
      deficiencies.push('Zero internal links to /red-onion-powder-bulk-supplier-india landing page');
      remediation.push('Add contextual anchor text linking to Red Onion Bulk Landing Page');
    }
    if (words < 800) {
      deficiencies.push(`Word count below 800 words (${words} words)`);
      remediation.push('Expand commercial FAQ & container logistics details');
    }

    if (a.content.includes('our processing unit') || a.content.includes('our factory') || a.content.includes('our farm')) {
      deficiencies.push('Contains ambiguous factory/farm wording');
      remediation.push('Reinforce trade coordinator / partner processing facility terminology');
    }

    if (words >= 1000 && deficiencies.length <= 2) {
      grade = 'A';
    } else if (words < 750 || deficiencies.length >= 4) {
      grade = 'C';
    } else {
      grade = 'B';
    }

    const escapeCsv = (str) => '"' + String(str || '').replace(/"/g, '""').replace(/\r?\n/g, ' ') + '"';

    return [
      a.id,
      escapeCsv(a.slug),
      escapeCsv(a.category),
      escapeCsv(a.title),
      escapeCsv(primaryKw),
      escapeCsv(secKws),
      escapeCsv(intent),
      escapeCsv(persona),
      escapeCsv(a.seoTitle || a.title),
      escapeCsv(a.seoDesc || a.excerpt),
      titleLen,
      descLen,
      escapeCsv(a.title),
      h2Count,
      h3Count,
      words,
      internalLinks.length,
      escapeCsv(internalLinks.join('; ')),
      linksToMoringa,
      linksToOnion,
      escapeCsv('/contact?product=' + (isMoringa ? 'moringa' : 'onion') + '&type=quote'),
      grade,
      escapeCsv(deficiencies.join(' | ') || 'None critical'),
      escapeCsv(remediation.join(' | ') || 'Maintain baseline')
    ].join(',');
  });

  const targetPath = path.resolve(__dirname, '../SEO_AUDIT_30_ARTICLES.csv');
  fs.writeFileSync(targetPath, header + '\n' + rows.join('\n'), 'utf8');
  console.log('Successfully generated SEO_AUDIT_30_ARTICLES.csv at', targetPath, 'with', rows.length, 'records.');
}

run().catch(err => {
  console.error('Error generating CSV:', err);
  process.exit(1);
});
