import os
import json
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, 'docs', 'audits', 'lead-generation')
os.makedirs(OUT_DIR, exist_ok=True)

# Parse blogs data directly from blogs.js or using node
import subprocess
result = subprocess.run(['node', '-e', '''
const path = require('path');
(async () => {
  const blogsPath = path.resolve('src/data/blogs.js');
  const { BLOGS } = await import('file:///' + blogsPath.replace(/\\\\/g, '/'));
  const baseline = BLOGS.map(b => ({
    id: b.id,
    title: b.title,
    slug: b.slug,
    category: b.category,
    date: b.date,
    author: b.author,
    thumbnail: b.thumbnail,
    seoTitle: b.seoTitle,
    seoDesc: b.seoDesc,
    canonical: `https://www.avaniagrofoods.com/blog/${b.slug}`
  }));
  console.log(JSON.stringify(baseline, null, 2));
})();
'''], capture_output=True, text=True, cwd=ROOT)

if result.returncode == 0:
    out_file = os.path.join(OUT_DIR, 'BASELINE_30_ARTICLES_INVENTORY.json')
    with open(out_file, 'w', encoding='utf-8') as f:
        f.write(result.stdout)
    data = json.loads(result.stdout)
    print(f"Successfully recorded baseline inventory of {len(data)} articles to {out_file}")
else:
    print(f"Error extracting baseline: {result.stderr}")
