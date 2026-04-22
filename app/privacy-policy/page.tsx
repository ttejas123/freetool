import type { Metadata } from 'next';
import { PrivacyPolicy } from '@/views/PrivacyPolicy';

export const metadata: Metadata = {
  title: 'Privacy Policy | FreeTool',
  description: "How FreeTool handles your data — spoiler: we don't collect any.",
  alternates: { canonical: 'https://www.freetool.shop/privacy-policy/' },
};

export default function PrivacyPolicyPage() {
  return <PrivacyPolicy />;
}
