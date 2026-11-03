import os
import sys
from PIL import Image, ImageEnhance, ImageFilter, ImageOps, ImageDraw, ImageFont

# Source high-resolution images
BRAIN_DIR = r"C:\Users\ALPHA-1\.gemini\antigravity\brain\a2d7ddf9-7519-4eec-83ea-602054f18c84"
MORINGA_HERO = os.path.join(BRAIN_DIR, "moringa_powder_b2b_1793608749977.jpg")
ONION_HERO = os.path.join(BRAIN_DIR, "red_onion_powder_1793608870283.jpg")
MORINGA_MFG = os.path.join(BRAIN_DIR, "moringa_manufacturing_1793609008095.jpg")

WORKSPACE_DIR = r"c:\Users\ALPHA-1\Downloads\21MAY2026\SACHIN SHINDE DOCUMENTS\DEVELOPEMENT TOOLS\2-AVANI AGRO FOODS LATUR 2026"
DEST_DIR = os.path.join(WORKSPACE_DIR, "public", "blog")
os.makedirs(DEST_DIR, exist_ok=True)

# 30 article image definitions
# Articles 1-15: Moringa Powder
# Articles 16-30: Red Onion Powder

TARGET_WIDTH = 1200
TARGET_HEIGHT = 675 # 16:9 aspect ratio

def crop_and_resize(img, crop_box=None, zoom=1.0, contrast=1.05, brightness=1.0, color=1.05):
    """Crop, zoom, adjust color, and resize to exact 1200x675 with high quality"""
    w, h = img.size
    if crop_box:
        img_cropped = img.crop(crop_box)
    else:
        # Default center crop to 16:9
        target_ratio = 16.0 / 9.0
        current_ratio = w / float(h)
        if current_ratio > target_ratio:
            new_w = int(h * target_ratio)
            left = (w - new_w) // 2
            img_cropped = img.crop((left, 0, left + new_w, h))
        else:
            new_h = int(w / target_ratio)
            top = (h - new_h) // 2
            img_cropped = img.crop((0, top, w, top + new_h))

    # Apply subtle enhancements
    if brightness != 1.0:
        img_cropped = ImageEnhance.Brightness(img_cropped).enhance(brightness)
    if contrast != 1.0:
        img_cropped = ImageEnhance.Contrast(img_cropped).enhance(contrast)
    if color != 1.0:
        img_cropped = ImageEnhance.Color(img_cropped).enhance(color)

    # Resize to exact dimensions using Lanczos
    return img_cropped.resize((TARGET_WIDTH, TARGET_HEIGHT), Image.Resampling.LANCZOS)

def create_article_images():
    print("Loading base source images...")
    img_moringa = Image.open(MORINGA_HERO).convert("RGB")
    img_onion = Image.open(ONION_HERO).convert("RGB")
    img_mfg = Image.open(MORINGA_MFG).convert("RGB")
    
    mw, mh = img_moringa.size
    ow, oh = img_onion.size
    
    # Pre-calculate distinct crops for Moringa (Articles 1 - 15)
    # 1: Full wide hero
    # 2: Manufacturing focus (from mfg)
    # 3: Close up on moringa powder bowl (macro texture)
    # 4: Sourcing focus (leaves + bowl)
    # 5: Export packaging sacks focus
    # 6: Wide culinary angle
    # 7: Packaging sacks tight crop
    # 8: Powder specifications close-up
    # 9: Export shipment readiness
    # 10: Private label brand packaging
    # 11: Supplier audit / QA inspection
    # 12: Laboratory sample evaluation
    # 13: Export compliance & documentation
    # 14: Global markets / container logistics
    # 15: Commercial B2B quotation & trade desk
    
    moringa_specs = [
        # Art 1: What is moringa
        {"name": "article-1-what-is-moringa-powder.webp", "source": img_moringa, "crop": None, "contrast": 1.08, "brightness": 1.02},
        # Art 2: How is moringa made
        {"name": "article-2-how-is-moringa-powder-made.webp", "source": img_mfg, "crop": None, "contrast": 1.05, "brightness": 1.0},
        # Art 3: Quality checklist
        {"name": "article-3-moringa-quality-checklist.webp", "source": img_moringa, "crop": (int(mw*0.25), int(mh*0.3), int(mw*0.75), mh), "contrast": 1.1, "brightness": 1.03},
        # Art 4: How to choose supplier
        {"name": "article-4-choose-moringa-supplier-india.webp", "source": img_moringa, "crop": (0, int(mh*0.1), int(mw*0.75), mh), "contrast": 1.06, "brightness": 1.01},
        # Art 5: Bulk moringa import factors
        {"name": "article-5-bulk-moringa-import-factors.webp", "source": img_moringa, "crop": (int(mw*0.1), 0, mw, int(mh*0.9)), "contrast": 1.05, "brightness": 1.02},
        # Art 6: Applications in food & beverage
        {"name": "article-6-moringa-food-beverage-applications.webp", "source": img_moringa, "crop": (int(mw*0.3), int(mh*0.25), mw, mh), "contrast": 1.08, "brightness": 1.04},
        # Art 7: Packaging & storage
        {"name": "article-7-moringa-packaging-storage.webp", "source": img_moringa, "crop": (0, 0, int(mw*0.65), int(mh*0.85)), "contrast": 1.06, "brightness": 1.0},
        # Art 8: Specifications for importers
        {"name": "article-8-moringa-specifications-guide.webp", "source": img_moringa, "crop": (int(mw*0.2), int(mh*0.35), int(mw*0.8), int(mh*0.95)), "contrast": 1.12, "brightness": 1.03},
        # Art 9: Export from India
        {"name": "article-9-moringa-export-from-india.webp", "source": img_moringa, "crop": (int(mw*0.05), int(mh*0.05), int(mw*0.95), int(mh*0.95)), "contrast": 1.07, "brightness": 1.02},
        # Art 10: Private label & food distributors
        {"name": "article-10-moringa-private-label-distributors.webp", "source": img_moringa, "crop": (int(mw*0.1), int(mh*0.05), int(mw*0.55), int(mh*0.75)), "contrast": 1.08, "brightness": 1.03},
        # Art 11: Questions to ask supplier
        {"name": "article-11-questions-to-ask-moringa-supplier.webp", "source": img_moringa, "crop": (int(mw*0.15), int(mh*0.2), int(mw*0.85), mh), "contrast": 1.05, "brightness": 1.02},
        # Art 12: Sample evaluation checklist
        {"name": "article-12-moringa-sample-evaluation-checklist.webp", "source": img_moringa, "crop": (int(mw*0.28), int(mh*0.4), int(mw*0.72), mh), "contrast": 1.1, "brightness": 1.04},
        # Art 13: Import documentation
        {"name": "article-13-moringa-import-documentation.webp", "source": img_moringa, "crop": (0, int(mh*0.05), int(mw*0.7), int(mh*0.8)), "contrast": 1.06, "brightness": 1.02},
        # Art 14: USA, UK, UAE buyer considerations
        {"name": "article-14-moringa-sourcing-usa-uk-uae.webp", "source": img_moringa, "crop": (int(mw*0.1), int(mh*0.15), mw, mh), "contrast": 1.07, "brightness": 1.03},
        # Art 15: Request bulk quotation
        {"name": "article-15-request-bulk-moringa-quotation.webp", "source": img_moringa, "crop": (0, int(mh*0.1), int(mw*0.8), int(mh*0.95)), "contrast": 1.06, "brightness": 1.02},
    ]

    # Pre-calculate distinct crops for Red Onion Powder (Articles 16 - 30)
    onion_specs = [
        # Art 16: What is red onion powder
        {"name": "article-16-what-is-red-onion-powder.webp", "source": img_onion, "crop": None, "contrast": 1.08, "brightness": 1.02},
        # Art 17: How is red onion powder manufactured
        {"name": "article-17-how-is-red-onion-powder-manufactured.webp", "source": img_onion, "crop": (int(ow*0.1), 0, int(ow*0.9), int(oh*0.9)), "contrast": 1.06, "brightness": 1.0},
        # Art 18: Applications in food manufacturing
        {"name": "article-18-red-onion-powder-food-applications.webp", "source": img_onion, "crop": (int(ow*0.3), int(oh*0.3), ow, oh), "contrast": 1.1, "brightness": 1.03},
        # Art 19: Choose reliable red onion supplier
        {"name": "article-19-choose-reliable-red-onion-supplier-india.webp", "source": img_onion, "crop": (0, 0, int(ow*0.8), int(oh*0.9)), "contrast": 1.07, "brightness": 1.02},
        # Art 20: Quality specifications
        {"name": "article-20-red-onion-powder-quality-specifications.webp", "source": img_onion, "crop": (int(ow*0.25), int(oh*0.35), int(ow*0.75), oh), "contrast": 1.12, "brightness": 1.04},
        # Art 21: Bulk guide for importers & distributors
        {"name": "article-21-bulk-red-onion-powder-importers-distributors.webp", "source": img_onion, "crop": (0, int(oh*0.05), int(ow*0.65), int(oh*0.85)), "contrast": 1.06, "brightness": 1.01},
        # Art 22: Seasonings, sauces & food formulations
        {"name": "article-22-red-onion-powder-seasonings-sauces-formulations.webp", "source": img_onion, "crop": (int(ow*0.2), int(oh*0.4), ow, oh), "contrast": 1.09, "brightness": 1.03},
        # Art 23: Packaging & storage requirements
        {"name": "article-23-red-onion-powder-packaging-storage.webp", "source": img_onion, "crop": (int(ow*0.4), 0, ow, int(oh*0.85)), "contrast": 1.06, "brightness": 1.0},
        # Art 24: Export from India international guide
        {"name": "article-24-red-onion-powder-export-from-india.webp", "source": img_onion, "crop": (int(ow*0.05), int(oh*0.05), int(ow*0.95), int(oh*0.95)), "contrast": 1.08, "brightness": 1.02},
        # Art 25: Private label & food manufacturers
        {"name": "article-25-red-onion-powder-food-manufacturers-private-label.webp", "source": img_onion, "crop": (0, 0, int(ow*0.7), int(oh*0.8)), "contrast": 1.07, "brightness": 1.02},
        # Art 26: Sample evaluation & quality checklist
        {"name": "article-26-red-onion-powder-sample-evaluation.webp", "source": img_onion, "crop": (int(ow*0.3), int(oh*0.35), int(ow*0.7), oh), "contrast": 1.12, "brightness": 1.04},
        # Art 27: Import documentation & compliance
        {"name": "article-27-red-onion-powder-import-documentation.webp", "source": img_onion, "crop": (int(ow*0.05), int(oh*0.1), int(ow*0.75), int(oh*0.9)), "contrast": 1.05, "brightness": 1.01},
        # Art 28: Compare suppliers before bulk purchasing
        {"name": "article-28-compare-red-onion-powder-suppliers.webp", "source": img_onion, "crop": (int(ow*0.15), 0, int(ow*0.85), int(oh*0.95)), "contrast": 1.06, "brightness": 1.02},
        # Art 29: USA, UK, UAE markets
        {"name": "article-29-red-onion-powder-sourcing-usa-uk-uae.webp", "source": img_onion, "crop": (int(ow*0.1), int(oh*0.15), mw, mh), "contrast": 1.07, "brightness": 1.03},
        # Art 30: Request bulk quotation from India
        {"name": "article-30-request-bulk-red-onion-powder-quotation.webp", "source": img_onion, "crop": (0, int(oh*0.1), int(ow*0.8), int(oh*0.95)), "contrast": 1.06, "brightness": 1.02},
    ]

    all_specs = moringa_specs + onion_specs
    
    print(f"Generating {len(all_specs)} professional 1200x675 WebP images...")
    for idx, item in enumerate(all_specs, start=1):
        target_path = os.path.join(DEST_DIR, item["name"])
        proc_img = crop_and_resize(
            item["source"],
            crop_box=item["crop"],
            contrast=item.get("contrast", 1.05),
            brightness=item.get("brightness", 1.0)
        )
        # Save as optimized WebP with quality=88
        proc_img.save(target_path, "WEBP", quality=88, method=6)
        file_size_kb = os.path.getsize(target_path) / 1024.0
        print(f"[{idx}/30] Saved {item['name']} ({file_size_kb:.1f} KB)")

    # Also generate supporting images for both product lines
    supporting_images = [
        ("moringa-supporting-harvest.webp", img_moringa, (0, 0, int(mw*0.6), mh)),
        ("moringa-supporting-texture.webp", img_moringa, (int(mw*0.3), int(mh*0.3), int(mw*0.7), mh)),
        ("moringa-supporting-packaging.webp", img_moringa, (0, 0, int(mw*0.5), int(mh*0.7))),
        ("red-onion-supporting-harvest.webp", img_onion, (0, int(oh*0.4), int(ow*0.4), oh)),
        ("red-onion-supporting-texture.webp", img_onion, (int(ow*0.3), int(oh*0.35), int(ow*0.7), oh)),
        ("red-onion-supporting-packaging.webp", img_onion, (int(ow*0.4), 0, ow, int(oh*0.8))),
    ]
    for s_name, s_source, s_crop in supporting_images:
        target_path = os.path.join(DEST_DIR, s_name)
        proc_img = crop_and_resize(s_source, crop_box=s_crop, contrast=1.08, brightness=1.02)
        proc_img.save(target_path, "WEBP", quality=88, method=6)
        print(f"Saved supporting image: {s_name}")

    print("All article images successfully created and optimized!")

if __name__ == "__main__":
    create_article_images()
