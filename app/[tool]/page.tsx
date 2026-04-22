import { Suspense } from 'react';
import type { Metadata } from 'next';
import { toolRegistry } from '@/tools/toolRegistry';
import { ToolPageTemplate } from '@/components/tools/ToolPageTemplate';
import { notFound } from 'next/navigation';
import ToolRenderer from './ToolRenderer';

interface ToolPageProps {
  params: Promise<{ tool: string }>;
}

// Pre-render all tool pages at build time
export async function generateStaticParams() {
  return toolRegistry.map((tool) => ({
    tool: tool.path,
  }));
}

// Generate per-tool SEO metadata
export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const { tool: slug } = await params;
  const tool = toolRegistry.find((t) => t.path === slug);

  if (!tool) {
    return { title: 'Tool Not Found | FreeTool' };
  }

  const title = `${tool.name} - Free Tool`;
  const description = tool.description.replace(/<[^>]*>/g, '').slice(0, 200);
  const url = `https://www.freetool.shop/${tool.path}/`;

  return {
    title,
    description,
    keywords: tool.tags?.join(', '),
    openGraph: { title, description, type: 'website', url },
    twitter: { card: 'summary_large_image', title, description },
    alternates: { canonical: url },
  };
}

function PageLoader() {
  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="w-6 h-6 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
    </div>
  );
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { tool: slug } = await params;
  const tool = toolRegistry.find((t) => t.path === slug);

  if (!tool) {
    notFound();
  }

  // TypeScript narrowing after notFound() — tool is defined here
  return (
    <ToolPageTemplate toolPath={slug}>
      <Suspense fallback={<PageLoader />}>
        <ToolRenderer toolPath={slug} />
      </Suspense>
    </ToolPageTemplate>
  );
}
