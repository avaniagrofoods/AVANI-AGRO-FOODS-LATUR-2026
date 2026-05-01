
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = 'c:/Users/ALPHA-1/Desktop/AVANI AGRO FOODS LATUR 2026';

const icons = [
  'FileText', 'Trash2', 'Mail', 'User', 'Building', 'MapPin', 'ArrowRight', 
  'CheckCircle', 'ExternalLink', 'Globe', 'Award', 'Users', 'TrendingUp', 
  'Leaf', 'Package', 'Star', 'Zap', 'Shield', 'BarChart3', 'Phone', 
  'MessageSquare', 'Send', 'Printer', 'Plus', 'Download', 'ChevronRight', 
  'CreditCard', 'ShieldCheck', 'CloudLightning', 'Building2', 'CheckCircle2',
  'Info', 'AlertCircle', 'Upload', 'ArrowLeft', 'Lock'
];

// This is a simplified check. A better way would be to import lucide-react and check exports.
// But since I'm in a script, I'll just check for common pitfalls.

function checkFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        checkFiles(fullPath);
      }
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      if (content.includes('lucide-react')) {
        const importMatch = content.match(/import\s*{([^}]+)}\s*from\s*['"]lucide-react['"]/);
        if (importMatch) {
          const importedIcons = importMatch[1].split(',').map(s => s.trim());
          for (const icon of importedIcons) {
             // We can't easily verify if they exist in lucide-react without importing it
             // But we can check if they are used in the file.
          }
        }
      }
    }
  }
}

console.log("Checking for lucide-react icon consistency...");
// Instead of checking if they exist in lucide-react, I'll check for the specific error reported: "FileText is not defined"
// This usually means it's USED but NOT IMPORTED.

function checkMissingImports(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        checkMissingImports(fullPath);
      }
    } else if (file.endsWith('.jsx')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      
      // Find all tags like <IconName
      const usedTags = content.match(/<([A-Z][a-zA-Z0-9]*)/g);
      if (usedTags) {
        const uniqueTags = [...new Set(usedTags.map(t => t.slice(1)))];
        for (const tag of uniqueTags) {
          // Ignore standard components and HTML tags
          if (['SEO', 'Link', 'LeadMagnet', 'Footer', 'Navbar', 'LanguageProvider', 'PasswordGate', 'QuotationBuilder'].includes(tag)) continue;
          
          // Check if it's imported or defined in the file
          const isImported = content.includes(`import {`) && content.includes(tag);
          const isDefined = content.includes(`function ${tag}`) || content.includes(`const ${tag} =`);
          
          if (!isImported && !isDefined && !['React', 'Fragment'].includes(tag)) {
            console.log(`Potential missing import for <${tag}> in ${path.relative(rootDir, fullPath)}`);
          }
        }
      }
    }
  }
}

checkMissingImports(path.join(rootDir, 'src'));
