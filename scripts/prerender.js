import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.resolve(PROJECT_ROOT, 'dist');
const PUBLIC_DIR = path.resolve(PROJECT_ROOT, 'public');
const TOOL_REGISTRY_PATH = path.resolve(PROJECT_ROOT, 'src/tools/toolRegistry.ts');
const SITEMAP_PATH_DIST = path.resolve(DIST_DIR, 'sitemap.xml');
const SITEMAP_PATH_PUBLIC = path.resolve(PUBLIC_DIR, 'sitemap.xml');

async function generateSitemap() {
  console.log('Generating Sitemap...');

  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
  }

  const registryContent = fs.readFileSync(TOOL_REGISTRY_PATH, 'utf-8');

  // List of additional static pages to prerender
  const staticPages = [
    { name: 'Privacy Policy', path: 'privacy-policy' },
    { name: 'Terms of Service', path: 'terms' },
    { name: 'About Us', path: 'about' },
    { name: 'Latest Blogs', path: 'blogs' },
    { name: 'Tech News', path: 'tech-news' },
    { name: 'Contact', path: 'contact' },
    { name: 'Redirect', path: 't' }
  ];

  let count = 0;
  const processedPaths = new Set();
  const currentDate = new Date().toISOString().split('T')[0];

  let sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  sitemapContent += `  <url>\n    <loc>https://www.freetool.shop/</loc>\n    <lastmod>${currentDate}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;

  // Process Static Pages
  for (const page of staticPages) {
    if (processedPaths.has(page.path)) continue;
    
    sitemapContent += `  <url>\n    <loc>https://www.freetool.shop/${page.path}</loc>\n    <lastmod>${currentDate}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    
    processedPaths.add(page.path);
    count++;
  }

  // Simple regex parser to extract tool info from toolRegistry.ts
  const toolRegex = /id:\s*['"]([^'"]+)['"][\s\S]*?name:\s*['"]([^'"]+)['"][\s\S]*?description:\s*['"]([^'"]+)['"][\s\S]*?path:\s*['"]([^'"]+)['"]/g;

  let match;
  while ((match = toolRegex.exec(registryContent)) !== null) {
    const [_, id, name, description, toolPath] = match;
    
    if (processedPaths.has(toolPath)) continue;

    sitemapContent += `  <url>\n    <loc>https://www.freetool.shop/${toolPath}</loc>\n    <lastmod>${currentDate}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
    
    processedPaths.add(toolPath);
    count++;
  }

  sitemapContent += `</urlset>`;
  
  fs.writeFileSync(SITEMAP_PATH_DIST, sitemapContent);
  console.log(`✅ Generated: /dist/sitemap.xml`);
  
  if (fs.existsSync(PUBLIC_DIR)) {
    fs.writeFileSync(SITEMAP_PATH_PUBLIC, sitemapContent);
    console.log(`✅ Generated: /public/sitemap.xml`);
  }

  console.log(`Sitemap Complete. Generated ${count} pages.`);
}

generateSitemap();
