import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.resolve(PROJECT_ROOT, 'dist');
const TOOL_REGISTRY_PATH = path.resolve(PROJECT_ROOT, 'src/tools/toolRegistry.ts');
const INDEX_HTML_PATH = path.resolve(DIST_DIR, 'index.html');

async function prerender() {
  console.log('Starting SSG Prerendering...');

  if (!fs.existsSync(INDEX_HTML_PATH)) {
    console.error('dist/index.html not found. Did you run vite build?');
    process.exit(1);
  }

  const indexTmpl = fs.readFileSync(INDEX_HTML_PATH, 'utf-8');
  const registryContent = fs.readFileSync(TOOL_REGISTRY_PATH, 'utf-8');

  // Simple regex parser to extract tool info from toolRegistry.ts
  const toolRegex = /id:\s*['"]([^'"]+)['"][\s\S]*?name:\s*['"]([^'"]+)['"][\s\S]*?description:\s*['"]([^'"]+)['"][\s\S]*?path:\s*['"]([^'"]+)['"]/g;

  let match;
  let count = 0;

  while ((match = toolRegex.exec(registryContent)) !== null) {
    const [_, id, name, description, toolPath] = match;

    const toolDir = path.resolve(DIST_DIR, toolPath);
    if (!fs.existsSync(toolDir)) {
      fs.mkdirSync(toolDir, { recursive: true });
    }

    // Replace the default title and inject meta tags
    let html = indexTmpl.replace(
      /<title>.*?<\/title>/,
      `<title>${name} - Ozone Tools</title>\n    <meta name="description" content="${description}">`
    );

    const outPath = path.resolve(toolDir, 'index.html');
    fs.writeFileSync(outPath, html);
    console.log(`✅ Generated: /${toolPath}/index.html`);
    count++;
  }

  console.log(`SSG Complete. Generated ${count} static pages.`);
}

prerender();
