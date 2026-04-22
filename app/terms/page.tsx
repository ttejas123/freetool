import type { Metadata } from 'next';
import { Terms } from '@/views/Terms';

export const metadata: Metadata = {
  title: 'Terms of Service | FreeTool',
  description: "FreeTool's terms of service and usage policy.",
  alternates: { canonical: 'https://www.freetool.shop/terms/' },
};

export default function TermsPage() {
  return <Terms />;
}
