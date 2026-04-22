import type { Metadata } from 'next';
import { Blogs } from '@/views/Blogs';

export const metadata: Metadata = {
  title: 'Blogs | FreeTool',
  description: 'Expert guides, tutorials, and updates from the FreeTool team.',
  alternates: { canonical: 'https://www.freetool.shop/blogs/' },
};

export default function BlogsPage() {
  return <Blogs />;
}
