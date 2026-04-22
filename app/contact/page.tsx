import type { Metadata } from 'next';
import { Contact } from '@/views/Contact';

export const metadata: Metadata = {
  title: 'Contact & Submit a Tool | FreeTool',
  description: 'Get in touch with the FreeTool team or submit a tool idea.',
  alternates: { canonical: 'https://www.freetool.shop/contact/' },
};

export default function ContactPage() {
  return <Contact />;
}
