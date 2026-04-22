import type { Metadata } from 'next';
import { About } from '@/views/About';

export const metadata: Metadata = {
  title: 'About Us | FreeTool',
  description: 'Learn about FreeTool — a free, privacy-first suite of developer and creative tools.',
  alternates: { canonical: 'https://www.freetool.shop/about/' },
};

export default function AboutPage() {
  return <About />;
}
