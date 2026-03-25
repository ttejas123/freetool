import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

import type { RegistryTool } from '@/tools/toolRegistry';
import { toolRegistry } from '@/tools/toolRegistry';
import { trackEvent } from '@/lib/analytics';

interface ToolPageTemplateProps {
  tool: RegistryTool;
  children: React.ReactNode;
}

export function ToolPageTemplate({ tool, children }: ToolPageTemplateProps) {
  useEffect(() => {
    trackEvent('tool_opened', {
      tool: tool.id,
      category: tool.category
    });
  }, [tool.id, tool.category]);

  // Find related tools (same category, excluding current)
  const relatedTools = toolRegistry
    .filter((t) => t.category === tool.category && t.id !== tool.id)
    .slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      <Helmet>
        <title>{tool.name} - Ozone Tools</title>
        <meta name="description" content={tool.description} />
        <meta property="og:title" content={`${tool.name} - Ozone Tools`} />
        <meta property="og:description" content={tool.description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://ozonetools.com/${tool.path}`} />
        <meta name="keywords" content={tool.tags?.join(', ') || ''} />
        <link rel="canonical" href={`https://ozonetools.com/${tool.path}`} />
      </Helmet>

      {/* Tool UI */}
      <div>
        {children}
      </div>

      {/* SEO Content Section */}
      <section className="bg-white dark:bg-zinc-800/50 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
          About {tool.name}
        </h2>
        <div className="prose dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-400">
          <p>{tool.description}</p>
          <p>
            This tool is designed to be fast, secure, and run completely in your browser.
            Your data never leaves your device, ensuring maximum privacy and security.
          </p>
          <h3 className="text-xl font-semibold mt-6 mb-3 text-zinc-900 dark:text-zinc-100">Frequently Asked Questions</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-zinc-900 dark:text-zinc-200">Is my data secure?</h4>
              <p className="text-sm">Yes, all processing happens locally in your browser. We don't store or transmit your data to any servers.</p>
            </div>
            <div>
              <h4 className="font-medium text-zinc-900 dark:text-zinc-200">Is {tool.name} completely free?</h4>
              <p className="text-sm">Yes! Ozone Tools is a completely free suite of developer utilities.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Related Tools */}
      {relatedTools.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">
            Related Tools in {tool.category}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {relatedTools.map((relatedTool) => (
              <a
                key={relatedTool.id}
                href={`/${relatedTool.path}`}
                className="group p-4 bg-white dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-brand-500/50 transition-all block"
              >
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-brand-500/10 rounded-lg text-brand-500">
                    <relatedTool.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-brand-500 transition-colors">
                    {relatedTool.name}
                  </h3>
                </div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">
                  {relatedTool.description}
                </p>
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
