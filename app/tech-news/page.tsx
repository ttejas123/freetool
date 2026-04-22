import type { Metadata } from 'next';
import { TechNews } from '@/views/TechNews';

export const metadata: Metadata = {
  title: 'Tech News | FreeTool',
  description: 'Daily developer news, open-source highlights, and tech industry updates.',
  alternates: { canonical: 'https://www.freetool.shop/tech-news/' },
};

export default function TechNewsPage() {
  return <TechNews />;
}
