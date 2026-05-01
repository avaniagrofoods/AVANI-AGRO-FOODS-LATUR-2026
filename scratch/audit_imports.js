
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = 'c:/Users/ALPHA-1/Desktop/AVANI AGRO FOODS LATUR 2026';

function findFiles(dir, allFiles = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        findFiles(fullPath, allFiles);
      }
    } else if (file.endsWith('.jsx')) {
      allFiles.push(fullPath);
    }
  }
  return allFiles;
}

const files = findFiles(path.join(rootDir, 'src'));

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf-8');
  const relPath = path.relative(rootDir, file);
  
  // Find all component-like usages: <SomeName 
  const matches = content.match(/<([A-Z][a-zA-Z0-9]*)/g);
  if (matches) {
    const tags = [...new Set(matches.map(m => m.slice(1)))];
    tags.forEach(tag => {
      // Common exclusions
      if (['Link', 'SEO', 'Navbar', 'Footer', 'LanguageProvider', 'PasswordGate', 'QuotationBuilder', 'LeadMagnet', 'WhatsAppBubble', 'Route', 'Routes', 'BrowserRouter', 'AnimatePresence', 'motion', 'PremiumUploader'].includes(tag)) return;
      
      // Check if tag is imported
      const hasImport = new RegExp(`import\\s+.*${tag}.*from`, 'g').test(content);
      const hasDefinition = content.includes(`function ${tag}`) || content.includes(`const ${tag} =`);
      
      if (!hasImport && !hasDefinition && !['React', 'Fragment'].includes(tag)) {
        console.log(`ERROR: ${tag} is used in ${relPath} but not imported or defined.`);
      }
    });
  }
});
