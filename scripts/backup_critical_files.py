import os
import shutil
import json

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKUP_DIR = os.path.join(ROOT, 'backups', 'pre-b2b-lead-system-20261103')
os.makedirs(BACKUP_DIR, exist_ok=True)

FILES_TO_BACKUP = [
    os.path.join('src', 'data', 'blogs.js'),
    os.path.join('src', 'data', 'articles', 'moringaArticles.js'),
    os.path.join('src', 'data', 'articles', 'onionArticles.js'),
    os.path.join('src', 'data', 'links.js'),
    os.path.join('src', 'data', 'productMaster.js'),
    os.path.join('src', 'data', 'exportCompliance.js'),
    os.path.join('src', 'App.jsx'),
    os.path.join('src', 'pages', 'BlogPost.jsx'),
    os.path.join('src', 'pages', 'Products.jsx'),
    os.path.join('src', 'pages', 'Catalog.jsx'),
    os.path.join('src', 'pages', 'Contact.jsx'),
    os.path.join('public', 'sitemap.xml'),
    os.path.join('public', 'robots.txt'),
    os.path.join('vercel.json'),
    os.path.join('package.json')
]

print("Backing up critical production files...")
for rel_path in FILES_TO_BACKUP:
    src_file = os.path.join(ROOT, rel_path)
    if os.path.exists(src_file):
        dest_file = os.path.join(BACKUP_DIR, rel_path)
        os.makedirs(os.path.dirname(dest_file), exist_ok=True)
        shutil.copy2(src_file, dest_file)
        print(f"Backed up: {rel_path} -> {dest_file}")
    else:
        print(f"Skipping (not found): {rel_path}")

print("\nBackup complete!")
