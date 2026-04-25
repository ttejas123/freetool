'use client';

import React, { useEffect } from 'react';
import { toolRegistry } from '@/tools/toolRegistry';
import { trackEvent } from '@/lib/analytics';

interface ToolPageTemplateProps {
  toolPath: string;
  children: React.ReactNode;
}

export function ToolPageTemplate({ toolPath, children }: ToolPageTemplateProps) {
  const tool = toolRegistry.find((t) => t.path === toolPath);

  useEffect(() => {
    if (!tool) return;
    trackEvent('tool_opened', {
      tool: tool.id,
      category: tool.category,
    });
  }, [tool]);

  if (!tool) return <>{children}</>;

  const relatedTools = toolRegistry
    .filter((t) => t.category === tool.category && t.id !== tool.id)
    .slice(0, 3);
  const isFullScreen = tool.fullScreen;

  return (
    <div
      className={
        isFullScreen
          ? 'flex flex-col flex-1 h-full w-full'
          : 'w-full px-4 sm:px-6 lg:px-8 py-8 space-y-12'
      }
    >
      {/* Tool UI */}
      <div className={isFullScreen ? 'flex flex-col flex-1 h-full w-full' : ''}>{children}</div>

      {!isFullScreen && (
        <>

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
