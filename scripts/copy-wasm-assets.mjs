import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '..');
const PUBLIC_WASM_DIR = path.resolve(PROJECT_ROOT, 'public/wasm');
const ONNX_WASM_DIR = path.resolve(PUBLIC_WASM_DIR, 'onnxruntime-web');

// Ensure directories exist
[PUBLIC_WASM_DIR, ONNX_WASM_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const assetsToCopy = [
  // ONNX Runtime WASM (for Background Removal)
  {
    from: 'node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.wasm',
    to: 'onnxruntime-web/ort-wasm-simd-threaded.wasm'
  },
  {
    from: 'node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.wasm',
    to: 'onnxruntime-web/ort-wasm-simd-threaded.jsep.wasm'
  },
  {
    from: 'node_modules/onnxruntime-web/dist/ort-wasm-simd.wasm',
    to: 'onnxruntime-web/ort-wasm-simd.wasm'
  },
  {
    from: 'node_modules/onnxruntime-web/dist/ort-wasm.wasm',
    to: 'onnxruntime-web/ort-wasm.wasm'
  },
  // ONNX Runtime MJS (also required by @imgly/background-removal)
  {
    from: 'node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.mjs',
    to: 'onnxruntime-web/ort-wasm-simd-threaded.mjs'
  },
  {
    from: 'node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.mjs',
    to: 'onnxruntime-web/ort-wasm-simd-threaded.jsep.mjs'
  },
  // Tree Sitter (for cURL Converter) - Copy to both /wasm/ and root for compatibility
  {
    from: 'node_modules/curlconverter/dist/tree-sitter-bash.wasm',
    to: 'tree-sitter-bash.wasm'
  },
  {
    from: 'node_modules/web-tree-sitter/tree-sitter.wasm',
    to: 'tree-sitter.wasm'
  },
  {
    from: 'node_modules/curlconverter/dist/tree-sitter-bash.wasm',
    to: '../tree-sitter-bash.wasm'
  },
  {
    from: 'node_modules/web-tree-sitter/tree-sitter.wasm',
    to: '../tree-sitter.wasm'
  }
];

console.log('🚀 Copying WASM & MJS assets to public/wasm...');

assetsToCopy.forEach(asset => {
  const sourcePath = path.resolve(PROJECT_ROOT, asset.from);
  const destPath = path.resolve(PUBLIC_WASM_DIR, asset.to);

  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, destPath);
    console.log(`✅ Copied: ${asset.to}`);
  } else {
    // Some versions might not have all files, only warn
    console.warn(`⚠️ Warning: Source file not found: ${asset.from}`);
  }
});

console.log('✨ WASM assets ready.');
