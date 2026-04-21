import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.resolve(PROJECT_ROOT, 'dist');
const PUBLIC_DIR = path.resolve(PROJECT_ROOT, 'public');
const TOOL_REGISTRY_PATH = path.resolve(PROJECT_ROOT, 'src/tools/toolRegistry.ts');
const INDEX_HTML_PATH = path.resolve(DIST_DIR, 'index.html');
const SITEMAP_PATH_DIST = path.resolve(DIST_DIR, 'sitemap.xml');
const SITEMAP_PATH_PUBLIC = path.resolve(PUBLIC_DIR, 'sitemap.xml');

async function prerender() {
  console.log('Starting SSG Prerendering...');

  if (!fs.existsSync(INDEX_HTML_PATH)) {
    console.error('dist/index.html not found. Did you run vite build?');
    process.exit(1);
  }

  const indexTmpl = fs.readFileSync(INDEX_HTML_PATH, 'utf-8');
  const registryContent = fs.readFileSync(TOOL_REGISTRY_PATH, 'utf-8');

  // List of additional static pages to prerender
  const staticPages = [
    {
      name: 'Privacy Policy',
      description: 'Privacy Policy for Free Tool - DevTools Hub',
      path: 'privacy-policy'
    },
    {
      name: 'Terms of Service',
      description: 'Terms of Service for Free Tool - Legal agreements and usage guidelines',
      path: 'terms'
    },
    {
      name: 'About Us',
      description: 'Learn more about Free Tool and our mission to provide free developer utilities',
      path: 'about'
    },
    {
      name: 'Latest Blogs',
      description: 'Expert guides, tool updates, and developer insights',
      path: 'blogs'
    },
    {
      name: 'Tech News',
      description: 'Daily tech news and developer updates',
      path: 'tech-news'
    },
    {
      name: 'Contact',
      description: 'Contact us for any queries or feedback regarding Free Tool',
      path: 'contact'
    },
    {
      name: 'Redirect',
      description: 'Redirecting to your destination...',
      path: 't'
    }
  ];

  let count = 0;
  const processedPaths = new Set();
  const currentDate = new Date().toISOString().split('T')[0];

  let sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  sitemapContent += `  <url>\n    <loc>https://www.freetool.shop/</loc>\n    <lastmod>${currentDate}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;

  // Process Static Pages
  for (const page of staticPages) {
    if (processedPaths.has(page.path)) continue;
    
    const pageDir = path.resolve(DIST_DIR, page.path);
    if (!fs.existsSync(pageDir)) {
      fs.mkdirSync(pageDir, { recursive: true });
    }

    let html = indexTmpl.replace(
      /<title>.*?<\/title>/,
      `<title>${page.name} - Free Tool</title>\n    <meta name="description" content="${page.description}">`
    );

    const outPath = path.resolve(pageDir, 'index.html');
    fs.writeFileSync(outPath, html);
    
    sitemapContent += `  <url>\n    <loc>https://www.freetool.shop/${page.path}</loc>\n    <lastmod>${currentDate}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    
    console.log(`✅ Generated: /${page.path}/index.html`);
    processedPaths.add(page.path);
    count++;
  }

  // Simple regex parser to extract tool info from toolRegistry.ts
  const toolRegex = /id:\s*['"]([^'"]+)['"][\s\S]*?name:\s*['"]([^'"]+)['"][\s\S]*?description:\s*['"]([^'"]+)['"][\s\S]*?path:\s*['"]([^'"]+)['"]/g;

  let match;
  while ((match = toolRegex.exec(registryContent)) !== null) {
    const [_, id, name, description, toolPath] = match;
    
    // Skip if path already processed (static pages or duplicate tool paths)
    if (processedPaths.has(toolPath)) continue;

    const toolDir = path.resolve(DIST_DIR, toolPath);
    if (!fs.existsSync(toolDir)) {
      fs.mkdirSync(toolDir, { recursive: true });
    }

    // Replace the default title and inject meta tags
    let html = indexTmpl.replace(
      /<title>.*?<\/title>/,
      `<title>${name} - Free Tool</title>\n    <meta name="description" content="${description}">`
    );

    const outPath = path.resolve(toolDir, 'index.html');
    fs.writeFileSync(outPath, html);
    
    sitemapContent += `  <url>\n    <loc>https://www.freetool.shop/${toolPath}</loc>\n    <lastmod>${currentDate}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
    
    console.log(`✅ Generated: /${toolPath}/index.html`);
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

  console.log(`SSG Complete. Generated ${count} static pages.`);
}

prerender();
