import json
import re
import os

WORKSPACE_DIR = r"c:\Users\ALPHA-1\Downloads\21MAY2026\SACHIN SHINDE DOCUMENTS\DEVELOPEMENT TOOLS\2-AVANI AGRO FOODS LATUR 2026"

with open(os.path.join(WORKSPACE_DIR, "src", "data", "articles", "moringaArticles.js"), "r", encoding="utf-8") as f:
    moringa_text = f.read()

with open(os.path.join(WORKSPACE_DIR, "src", "data", "articles", "onionArticles.js"), "r", encoding="utf-8") as f:
    onion_text = f.read()

m_slugs = re.findall(r'"slug":\s*"([^"]+)"', moringa_text)
o_slugs = re.findall(r'"slug":\s*"([^"]+)"', onion_text)

print(f"Loaded {len(m_slugs)} Moringa slugs and {len(o_slugs)} Onion slugs.")

core_pages = [
    ("https://www.avaniagrofoods.com/", "weekly", "1.0"),
    ("https://www.avaniagrofoods.com/about", "monthly", "0.9"),
    ("https://www.avaniagrofoods.com/products", "weekly", "0.95"),
    ("https://www.avaniagrofoods.com/catalog", "weekly", "0.95"),
    ("https://www.avaniagrofoods.com/catalog/moringa-powder", "weekly", "0.95"),
    ("https://www.avaniagrofoods.com/catalog/red-onion-powder", "weekly", "0.95"),
    ("https://www.avaniagrofoods.com/trade-coordination", "monthly", "0.9"),
    ("https://www.avaniagrofoods.com/export-process", "monthly", "0.85"),
    ("https://www.avaniagrofoods.com/contact", "weekly", "0.9"),
    ("https://www.avaniagrofoods.com/export-compliance", "monthly", "0.85"),
    ("https://www.avaniagrofoods.com/manufacturer-requirements", "monthly", "0.85"),
    ("https://www.avaniagrofoods.com/b2b", "monthly", "0.7"),
    ("https://www.avaniagrofoods.com/resources", "weekly", "0.85"),
    ("https://www.avaniagrofoods.com/affiliate-disclosure", "monthly", "0.6"),
    ("https://www.avaniagrofoods.com/privacy-policy", "yearly", "0.5"),
    ("https://www.avaniagrofoods.com/terms", "yearly", "0.5"),
    ("https://www.avaniagrofoods.com/disclaimer", "yearly", "0.5"),
    ("https://www.avaniagrofoods.com/blog", "weekly", "0.95")
]

xml = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']

for loc, freq, prio in core_pages:
    xml.append(f"""  <url>
    <loc>{loc}</loc>
    <lastmod>2026-10-29</lastmod>
    <changefreq>{freq}</changefreq>
    <priority>{prio}</priority>
  </url>""")

xml.append("\n  <!-- 30 B2B Pillar Educational & Sourcing Articles -->")
for slug in m_slugs + o_slugs:
    xml.append(f"""  <url>
    <loc>https://www.avaniagrofoods.com/blog/{slug}</loc>
    <lastmod>2026-10-29</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>""")

xml.append("</urlset>\n")

sitemap_path = os.path.join(WORKSPACE_DIR, "public", "sitemap.xml")
with open(sitemap_path, "w", encoding="utf-8") as f:
    f.write("\n".join(xml))

print(f"Successfully updated {sitemap_path} with {len(core_pages) + len(m_slugs) + len(o_slugs)} URLs.")
