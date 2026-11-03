import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BLOG_DIR = os.path.join(ROOT, 'public', 'blog')

def optimize_legacy_thumbnails():
    legacy_files = [
        'export-process-thumbnail.webp',
        'moringa-powder-thumbnail.webp',
        'onion-powder-thumbnail.webp'
    ]

    for fname in legacy_files:
        fpath = os.path.join(BLOG_DIR, fname)
        if os.path.exists(fpath):
            with Image.open(fpath) as im:
                # Convert to RGB if needed
                rgb_im = im.convert('RGB')
                # Resize with aspect fit / crop to 1200x675
                target_w, target_h = 1200, 675
                # calculate scale
                w, h = rgb_im.size
                scale = max(target_w / w, target_h / h)
                new_w, new_h = int(w * scale), int(h * scale)
                resized = rgb_im.resize((new_w, new_h), Image.Resampling.LANCZOS)
                
                # center crop
                left = (new_w - target_w) // 2
                top = (new_h - target_h) // 2
                cropped = resized.crop((left, top, left + target_w, top + target_h))
                
                # Save as true WebP
                cropped.save(fpath, 'WEBP', quality=85, method=6)
                new_size_kb = os.path.getsize(fpath) / 1024
                print(f"Optimized {fname}: 1200x675 WebP, {new_size_kb:.1f} KB")

if __name__ == '__main__':
    optimize_legacy_thumbnails()
