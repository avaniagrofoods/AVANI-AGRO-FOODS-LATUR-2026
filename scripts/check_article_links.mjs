import { MORINGA_ARTICLES } from '../src/data/articles/moringaArticles.js';
import { ONION_ARTICLES } from '../src/data/articles/onionArticles.js';

let mCount = 0;
MORINGA_ARTICLES.forEach((a, i) => {
  const has = a.content.includes('/moringa-powder-bulk-supplier-india');
  if (has) mCount++;
  console.log(`Moringa #${i+1} [${a.slug}]: has = ${has}`);
});

let oCount = 0;
ONION_ARTICLES.forEach((a, i) => {
  const has = a.content.includes('/red-onion-powder-bulk-supplier-india');
  if (has) oCount++;
  console.log(`Onion #${i+1} [${a.slug}]: has = ${has}`);
});

console.log(`\nTotals: Moringa ${mCount}/${MORINGA_ARTICLES.length}, Onion ${oCount}/${ONION_ARTICLES.length}`);
