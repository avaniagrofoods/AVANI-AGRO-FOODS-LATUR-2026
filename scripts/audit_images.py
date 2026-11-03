import os
import glob
from PIL import Image
import json

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BLOG_DIR = os.path.join(ROOT, 'public', 'blog')

def audit_images():
    print("=" * 70)
    print("AVANI AGRO FOODS — 36 IMAGES PRODUCTION AUDIT")
    print(f"Directory: {BLOG_DIR}")
    print("=" * 70)

    images = glob.glob(os.path.join(BLOG_DIR, "*.webp"))
    images.sort()
    
    print(f"Found {len(images)} WebP images in public/blog/\n")
    
    results = []
    total_size = 0
    all_valid = True

    for img_path in images:
        filename = os.path.basename(img_path)
        file_size_kb = os.path.getsize(img_path) / 1024
        total_size += file_size_kb

        try:
            with Image.open(img_path) as im:
                width, height = im.size
                img_format = im.format
                aspect = width / height
                is_16_9 = abs(aspect - (16/9)) < 0.05
                is_1200x675 = (width == 1200 and height == 675)

                status = "PASS" if (is_1200x675 and file_size_kb < 300) else "WARN"
                if status == "WARN":
                    all_valid = False

                info = {
                    "filename": filename,
                    "url": f"/blog/{filename}",
                    "width": width,
                    "height": height,
                    "aspect_ratio": f"{aspect:.2f}",
                    "format": img_format,
                    "size_kb": round(file_size_kb, 2),
                    "status": status
                }
                results.append(info)
                print(f"[{status}] {filename.padend(48) if hasattr(filename, 'padend') else filename:<48} | {width}x{height} | {file_size_kb:6.1f} KB | {img_format}")
        except Exception as e:
            print(f"[FAIL] {filename:<48} | Corrupted or unreadable: {e}")
            all_valid = False

    avg_size = total_size / len(images) if images else 0
    print("\n" + "=" * 70)
    print(f"Total Images: {len(images)} | Total Size: {total_size/1024:.2f} MB | Average Size: {avg_size:.1f} KB")
    print(f"All 36 Images Valid & Optimized: {all_valid}")
    print("=" * 70)

    # Save json report
    out_path = os.path.join(ROOT, 'docs', 'audits', 'production', 'IMAGE_36_AUDIT_REPORT.json')
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2)
    print(f"Saved report to: {out_path}\n")

if __name__ == '__main__':
    audit_images()
