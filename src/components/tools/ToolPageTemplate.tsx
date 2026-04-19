import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

import type { RegistryTool } from '@/tools/toolRegistry';
import { toolRegistry } from '@/tools/toolRegistry';
import { FAQSection } from '@/components/ui/FAQSection';
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

  const defaultFaq = [
    {
      question: "Is my data secure?",
      answer: "Yes, all processing happens locally in your browser. We don't store or transmit your data to any servers."
    },
    {
      question: `Is ${tool.name} completely free?`,
      answer: "Yes! FreeTool.shop is a completely free suite of developer and creative utilities."
    }
  ];

  const isFullScreen = tool.fullScreen;

  return (
    <div className={isFullScreen ? 'flex flex-col flex-1 h-full w-full' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12'}>
      <Helmet>
        <title>{tool.name} - Free Tool</title>
        <meta name="description" content={tool.description} />
        <meta property="og:title" content={`${tool.name} - Free Tool`} />
        <meta property="og:description" content={tool.description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://freetool.shop/${tool.path}`} />
        <meta name="keywords" content={tool.tags?.join(', ') || ''} />
        <link rel="canonical" href={`https://freetool.shop/${tool.path}`} />
      </Helmet>

      {/* Tool UI */}
      <div className={isFullScreen ? 'flex flex-col flex-1 h-full w-full' : ''}>
        {children}
      </div>

      {!isFullScreen && (
        <>
          {/* Dynamic FAQ Section */}
          <FAQSection 
            items={tool.faq || defaultFaq}
            icon={tool.faqIcon}
            className="bg-white dark:bg-zinc-800/50 rounded-2xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm"
          />

          {/* About Section */}
          <section className="bg-zinc-50 dark:bg-zinc-900/30 rounded-2xl p-8 border border-zinc-100 dark:border-zinc-800/50">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              About {tool.name}
            </h2>
            <div className="prose dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-400">
              <p>{tool.description}</p>
              <p>
                Designed for speed and security, this tool runs entirely on your local machine. 
                By processing data within your browser, we ensure that sensitive information is never 
                transmitted over the network, providing a private and robust experience for developers and creators.
              </p>
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
        </>
      )}
    </div>
  );
}
