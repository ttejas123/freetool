'use client';

// SEO is now handled by Next.js generateMetadata() in app/[tool]/page.tsx
// This component is kept as a no-op for any remaining references during migration.
import React from 'react';

interface SEOHelmetProps {
  title?: string;
  description?: string;
  canonical?: string;
  type?: string;
}

export const SEOHelmet: React.FC<SEOHelmetProps> = () => {
  return null;
};
