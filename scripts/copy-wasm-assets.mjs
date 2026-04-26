import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '..');
const PUBLIC_WASM_DIR = path.resolve(PROJECT_ROOT, 'public/wasm');
// Ensure directory exists
if (!fs.existsSync(PUBLIC_WASM_DIR)) {
  fs.mkdirSync(PUBLIC_WASM_DIR, { recursive: true });
}

const assetsToCopy = [
  // Tree Sitter (for cURL Converter)
  {
    from: 'node_modules/curlconverter/dist/tree-sitter-bash.wasm',
    to: 'tree-sitter-bash.wasm'
  },
  {
    from: 'node_modules/web-tree-sitter/tree-sitter.wasm',
    to: 'tree-sitter.wasm'
  }
];

// Special handling for directory copies
const directoriesToCopy = [
  // Add other directories here if needed
];

function run() {
  console.log('🚀 Syncing WASM & AI Model assets to public/wasm...');

  let successCount = 0;
  let warnCount = 0;

  assetsToCopy.forEach(asset => {
    const sourcePath = path.resolve(PROJECT_ROOT, asset.from);
    const destPath = path.resolve(PUBLIC_WASM_DIR, asset.to);

    // Ensure parent directory exists
    const destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`✅ Copied: ${asset.to}`);
      successCount++;
    } else {
      console.warn(`⚠️ Warning: Source file not found: ${asset.from}`);
      warnCount++;
    }
  });

  directoriesToCopy.forEach(dir => {
    const sourcePath = path.resolve(PROJECT_ROOT, dir.from);
    const destPath = path.resolve(PUBLIC_WASM_DIR, dir.to);

    if (fs.existsSync(sourcePath)) {
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
      }
      
      const files = fs.readdirSync(sourcePath);
      files.forEach(file => {
        const s = path.join(sourcePath, file);
        const d = path.join(destPath, file);
        if (fs.statSync(s).isFile()) {
           fs.copyFileSync(s, d);
        }
      });
      console.log(`✅ Copied directory: ${dir.to} (${files.length} files)`);
      successCount++;
    } else {
      console.warn(`⚠️ Warning: Source directory not found: ${dir.from}`);
      warnCount++;
    }
  });

  console.log(`\n✨ Asset sync complete. (Success: ${successCount}, Warnings: ${warnCount})`);
  
  if (warnCount > 0) {
    console.log('\n💡 Tip: If models are missing, ensure you ran: npm install @imgly/background-removal-data\n');
  }
}

run();
