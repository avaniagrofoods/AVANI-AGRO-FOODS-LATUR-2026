import json
import re
import os

WORKSPACE_DIR = r"c:\Users\ALPHA-1\Downloads\21MAY2026\SACHIN SHINDE DOCUMENTS\DEVELOPEMENT TOOLS\2-AVANI AGRO FOODS LATUR 2026"
DOCS_DIR = os.path.join(WORKSPACE_DIR, "docs", "marketing")
os.makedirs(DOCS_DIR, exist_ok=True)

with open(os.path.join(WORKSPACE_DIR, "src", "data", "articles", "moringaArticles.js"), "r", encoding="utf-8") as f:
    moringa_text = f.read()

with open(os.path.join(WORKSPACE_DIR, "src", "data", "articles", "onionArticles.js"), "r", encoding="utf-8") as f:
    onion_text = f.read()

# Load articles via simple json parse of the exported object
m_json_str = moringa_text[moringa_text.find("["):moringa_text.rfind("]") + 1]
o_json_str = onion_text[onion_text.find("["):onion_text.rfind("]") + 1]

moringa_articles = json.loads(m_json_str)
onion_articles = json.loads(o_json_str)
all_articles = moringa_articles + onion_articles

campaigns = []
md_lines = [
    "# AVANI AGRO FOODS — COMPLETE 30-ARTICLE B2B SOCIAL MEDIA MARKETING CAMPAIGN",
    "**Author:** Sachin Shinde, Agricultural Trade Coordinator  ",
    "**Headquarters:** Latur, Maharashtra, India  ",
    "**Contact:** sales@avaniagrofoods.com | +91 7219053645  ",
    "**Target Audience:** Food Importers, Ingredient Procurement Directors, Food Processing Scientists, Spice Traders (USA, UK, UAE, EU, Canada, Australia)  \n",
    "This document contains ready-to-publish B2B social media assets for all 30 published articles:\n",
    "- 30 Professional LinkedIn Articles & Feed Posts\n",
    "- 30 Short Social Media Updates (Twitter / X / B2B Threads)\n",
    "- 30 Seven-Slide Educational Carousel Concepts (PDF / SlideShare ready)\n",
    "- Social Sharing Image references\n",
    "---\n"
]

for art in all_articles:
    art_id = art["id"]
    title = art["title"]
    slug = art["slug"]
    category = art["category"]
    url = f"https://www.avaniagrofoods.com/blog/{slug}"
    image = art["thumbnail"]
    is_m = "moringa" in title.lower()

    # 1. Professional LinkedIn Post
    hook = f"Procuring bulk {('Moringa leaf powder' if is_m else 'dehydrated Red Onion powder')} directly from India? Here is what most overseas buyers discover only after opening their first container:"
    linkedin_post = f"""{hook}

{art['excerpt']}

At AVANI AGRO FOODS, operating from the agricultural heartland of Maharashtra, India, we bridge the gap between regional processing facilities and international seaports. Here are 3 key procurement insights from our latest B2B technical guide:

1. Technical Purity & Mesh: {('Standard 80-100 mesh versus 120-150 micro-milled leaf tissue' if is_m else 'Controlled continuous belt dehydration preventing case-hardening and high sugars')}
2. Quality & Lab Integrity: Every batch validated with independent, NABL-accredited Certificates of Analysis prior to container stuffing.
3. Export Logistics: Direct transit to Nhava Sheva Port (JNPT Mumbai) with full Phytosanitary and customs documentation.

Read our complete procurement guide:
{url}

For commercial proforma inquiries or pre-shipment sample evaluations:
WhatsApp: +91 7219053645 | Email: sales@avaniagrofoods.com

#FoodIngredients #B2BSourcing #{'MoringaPowder #Nutraceuticals' if is_m else 'DehydratedOnion #SpiceIndustry'} #AgroExport #IndiaExport #SupplyChainTransparency #AvaniAgroFoods"""

    # 2. Short Social Post
    short_post = f"B2B Buyer Guide: {title}. Essential specifications, moisture thresholds, and export logistics from India. Read full guide: {url} #AgroExport #{'Moringa' if is_m else 'OnionPowder'} @AvaniAgroFoods"

    # 3. 7-Slide Carousel Concept
    product_name = "Moringa Leaf Powder" if is_m else "Dehydrated Red Onion Powder"
    carousel = [
        f"Slide 1 [Cover]: Sourcing {product_name} from India: The B2B Buyer's Playbook by Sachin Shinde, AVANI AGRO FOODS.",
        f"Slide 2 [The Challenge]: Why 30% of agricultural botanical shipments face quality rejection, caking, or customs border holds.",
        f"Slide 3 [Agronomic Origin]: Why Maharashtra's soil and microclimate produce world-class {product_name} with superior bio-actives and flavor density.",
        f"Slide 4 [Processing Integrity]: From sanitized washing to low-temperature dehydration and stainless steel pulverization with 10,000 Gauss magnetic traps.",
        f"Slide 5 [Analytical Checklist]: The essential testing criteria: Moisture {('<= 7.0%' if is_m else '<= 6.0%')}, Ash limits, Salmonella negative, and heavy metals screening.",
        f"Slide 6 [International Gateways]: Navigating US FDA FSVP, UK BTOM, and UAE Dubai Municipality FoodWatch compliance without administrative friction.",
        f"Slide 7 [Next Steps]: Partner with an audited trade coordination desk in Maharashtra. Request your proforma quote at avaniagrofoods.com."
    ]

    campaign_item = {
        "id": art_id,
        "title": title,
        "slug": slug,
        "url": url,
        "image": image,
        "linkedin_post": linkedin_post,
        "short_post": short_post,
        "carousel_slides": carousel
    }
    campaigns.append(campaign_item)

    # Append to markdown
    md_lines.append(f"## Article {art_id}: {title}")
    md_lines.append(f"**URL:** [{url}]({url})  ")
    md_lines.append(f"**Category:** {category} | **Image:** `{image}`\n")
    md_lines.append("### 1. Professional LinkedIn Post")
    md_lines.append("```text\n" + linkedin_post + "\n```\n")
    md_lines.append("### 2. Short Social Media Post (Twitter / X)")
    md_lines.append("```text\n" + short_post + "\n```\n")
    md_lines.append("### 3. 7-Slide Educational Carousel Concept")
    for s_idx, slide in enumerate(carousel, 1):
        md_lines.append(f"- **Slide {s_idx}:** {slide}")
    md_lines.append("\n---\n")

# Write Markdown Dossier
md_path = os.path.join(DOCS_DIR, "SOCIAL_MEDIA_CAMPAIGN_30_ARTICLES.md")
with open(md_path, "w", encoding="utf-8") as f:
    f.write("\n".join(md_lines))

# Write JSON Dossier
json_path = os.path.join(DOCS_DIR, "social_media_campaign_30_articles.json")
with open(json_path, "w", encoding="utf-8") as f:
    json.dump(campaigns, f, indent=2, ensure_ascii=False)

print(f"Successfully generated social media campaign dossiers in {md_path} and {json_path}!")
