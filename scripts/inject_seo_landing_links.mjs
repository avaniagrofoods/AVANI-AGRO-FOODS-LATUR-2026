import fs from 'fs';
import path from 'path';

const moringaAnchors = [
  'bulk Moringa powder supplier from India',
  'export-grade Indian Moringa powder supplier',
  'Moringa oleifera bulk supplier India',
  'Indian Moringa powder export supplier',
  'wholesale Moringa leaf powder supplier India',
  'bulk Moringa leaf powder export supplier',
  'Moringa powder bulk supplier India',
  'Indian botanical ingredient bulk supplier',
  'commercial Moringa powder supplier India',
  'contract Moringa bulk supplier in India',
  'certified Moringa powder bulk supplier India',
  'Indian Moringa leaf powder bulk supplier',
  'FOB & CIF Moringa powder supplier India',
  'COA-verified Moringa bulk supplier India',
  'Maharashtra Moringa powder bulk supplier'
];

const onionAnchors = [
  'dehydrated red onion powder bulk supplier India',
  'Indian red onion powder bulk supplier',
  'bulk dehydrated red onion supplier India',
  'commercial red onion powder supplier India',
  'export-grade red onion powder supplier India',
  'wholesale red onion powder bulk supplier',
  'Red Onion Powder Bulk Supplier India',
  'Indian dehydrated onion powder export supplier',
  'food manufacturing red onion powder supplier',
  'commercial seasoning red onion powder bulk supplier',
  'bulk red onion powder export supplier India',
  'Indian food ingredient bulk onion supplier',
  'FCL & LCL red onion powder supplier India',
  'lab-verified red onion powder bulk supplier',
  'Nashik & Maharashtra red onion powder bulk supplier'
];

// 1. Process Moringa Articles
const moringaFilePath = path.resolve('src/data/articles/moringaArticles.js');
let moringaCode = fs.readFileSync(moringaFilePath, 'utf-8');

// Match JSON objects in export const MORINGA_ARTICLES = [...]
// To be safe, import the array, modify contents, and re-serialize cleanly
const { MORINGA_ARTICLES } = await import('../src/data/articles/moringaArticles.js');

MORINGA_ARTICLES.forEach((article, index) => {
  if (!article.content.includes('/moringa-powder-bulk-supplier-india')) {
    const anchor = moringaAnchors[index] || 'Moringa powder bulk supplier India';
    const linkBullet = `- Sourcing commercial container volumes? Review our dedicated [${anchor}](/moringa-powder-bulk-supplier-india) export portal for full technical specifications, NABL testing parameters, and FOB/CIF delivery terms.\n`;
    
    // Find the last list item or append before closing quotes
    if (article.content.includes('- [')) {
      const lastIndex = article.content.lastIndexOf('- [');
      article.content = article.content.slice(0, lastIndex) + linkBullet + article.content.slice(lastIndex);
    } else {
      article.content = article.content.trim() + '\n\n' + linkBullet;
    }
  }
});

const newMoringaContent = `// ============================================================
// CATEGORY A: MORINGA POWDER — 15 COMPREHENSIVE B2B ARTICLES
// AVANI AGRO FOODS — Indian Agricultural Export Coordination
// Author: Sachin Shinde, Trade Coordinator, Latur, Maharashtra
// ============================================================

export const MORINGA_ARTICLES = ${JSON.stringify(MORINGA_ARTICLES, null, 2)};
`;

fs.writeFileSync(moringaFilePath, newMoringaContent, 'utf-8');
console.log('Successfully updated 15 Moringa articles with contextual landing links.');

// 2. Process Onion Articles
const onionFilePath = path.resolve('src/data/articles/onionArticles.js');
const { ONION_ARTICLES } = await import('../src/data/articles/onionArticles.js');

ONION_ARTICLES.forEach((article, index) => {
  if (!article.content.includes('/red-onion-powder-bulk-supplier-india')) {
    const anchor = onionAnchors[index] || 'Red Onion Powder Bulk Supplier India';
    const linkBullet = `- Sourcing commercial container volumes? Review our dedicated [${anchor}](/red-onion-powder-bulk-supplier-india) export portal for full technical specifications, pyruvic acid flavor standards, and FOB/CIF delivery terms.\n`;
    
    // Find the last list item or append before closing quotes
    if (article.content.includes('- [')) {
      const lastIndex = article.content.lastIndexOf('- [');
      article.content = article.content.slice(0, lastIndex) + linkBullet + article.content.slice(lastIndex);
    } else {
      article.content = article.content.trim() + '\n\n' + linkBullet;
    }
  }
});

const newOnionContent = `// ============================================================
// CATEGORY B: DEHYDRATED RED ONION POWDER — 15 COMPREHENSIVE B2B ARTICLES
// AVANI AGRO FOODS — Indian Agricultural Export Coordination
// Author: Sachin Shinde, Trade Coordinator, Latur, Maharashtra
// ============================================================

export const ONION_ARTICLES = ${JSON.stringify(ONION_ARTICLES, null, 2)};
`;

fs.writeFileSync(onionFilePath, newOnionContent, 'utf-8');
console.log('Successfully updated 15 Onion articles with contextual landing links.');
