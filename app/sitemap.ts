import type { MetadataRoute } from 'next';
import { toolRegistry } from '@/tools/toolRegistry';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://www.freetool.shop';
  const today = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: today, changeFrequency: 'daily', priority: 1.0 },
    { url: `${base}/about/`, lastModified: today, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/blogs/`, lastModified: today, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/contact/`, lastModified: today, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/privacy-policy/`, lastModified: today, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/terms/`, lastModified: today, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/tech-news/`, lastModified: today, changeFrequency: 'daily', priority: 0.8 },
  ];

  const toolPages: MetadataRoute.Sitemap = toolRegistry.map((tool) => ({
    url: `${base}/${tool.path}/`,
    lastModified: today,
    changeFrequency: 'weekly',
    priority: 0.9,
  }));

  return [...staticPages, ...toolPages];
}
