'use client';

import { useState, useEffect } from 'react';
import { 
  Settings2,
  Cpu
} from 'lucide-react';
import type { RegistryTool } from '@/tools/toolRegistry';

interface RichToolDescriptionProps {
  tool: RegistryTool;
}

export const RichToolDescription = ({ tool }: RichToolDescriptionProps) => {
  const [asyncDescription, setAsyncDescription] = useState<string | null>(null);

  useEffect(() => {
    // If not inline, dynamically fetch the heavily optimized description block
    if (!tool.longDescription) {
      import('@/data/longDescriptions.json').then((module) => {
        const descriptions = module.default as Record<string, string>;
        if (descriptions && descriptions[tool.id]) {
          setAsyncDescription(descriptions[tool.id]);
        }
      }).catch(err => console.error("Failed to load rich description", err));
    }
  }, [tool.id, tool.longDescription]);

  const displayDescription = tool.longDescription || asyncDescription;

  return (
    <article className="mt-16 w-full max-w-7xl mx-auto pb-24 text-gray-600 dark:text-gray-300">
      
      <div className="border-t border-gray-200 dark:border-white/10 pt-16 mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 text-brand-500 text-[10px] font-black mb-8 border border-brand-500/20 uppercase tracking-[0.2em]">
          <Settings2 className="w-4 h-4" />
          <span>In-Depth Guide</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-8 tracking-tight">
          Mastering the {tool.name}
        </h2>
        
        <div className="tool-description max-w-none mb-10">
          {displayDescription ? (
             <div dangerouslySetInnerHTML={{ __html: displayDescription }} />
          ) : (
            <>
              <p className="text-lg leading-relaxed mb-6 font-medium">
                Welcome to the ultimate guide on utilizing our powerful <strong>{tool.name}</strong>. 
                As part of the comprehensive FreeTool platform, this specific tool falls under our 
                <span className="capitalize font-bold text-brand-500 mx-1">{tool.category}</span> utilities 
                suite and is engineered to transform how you handle daily technical operations. 
                {tool.description}
              </p>
              <p className="text-lg leading-relaxed mb-10">
                In today's fast-paced digital environment, relying on slow, ad-ridden, or insecure solutions is no longer viable. That is exactly why our engineers built this specific <strong>{tool.name}</strong> module entirely from the ground up. Whether you are dealing with rapid prototyping, data manipulation, or final production enhancements, this tool operates fluidly directly inside your browser cache. This significantly reduces redundant network constraints and completely eliminates the frustrating latency traditionally associated with cloud-only alternatives.
              </p>
            </>
          )}
        </div>
      </div>

      <div className="mb-16 mt-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-widest text-gray-400 mr-2">Identified Tags:</span>
          {tool.tags.map((tag: string) => (
            <span key={tag} className="px-3 py-1 rounded bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 text-xs font-semibold">
              #{tag}
            </span>
          ))}
          <span className="px-3 py-1 rounded bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 text-xs font-semibold flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5" /> Client-Side Compute
          </span>
        </div>
      </div>

      {tool.faq && tool.faq.length > 0 && (
        <div className="pt-12 border-t border-gray-200 dark:border-white/10">
          <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-8 text-center">Frequently Asked Questions</h3>
          <div className="grid gap-6 md:gap-8 grid-cols-1 md:grid-cols-2">
            {tool.faq.map((item: { question: string; answer: string }, idx: number) => (
              <div key={idx} className="flex flex-col gap-2">
                <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-brand-500/10 text-brand-500 flex items-center justify-center text-xs font-black shrink-0">
                    Q
                  </div>
                  {item.question}
                </h4>
                <p className="text-sm pl-8 leading-relaxed">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-16 text-center text-sm font-medium text-gray-400 bg-gray-50 dark:bg-white/5 p-6 rounded-2xl border border-gray-200 dark:border-white/10">
        By utilizing {tool.name}, you agree to FreeTool's terms of secure, localized usage. Bookmark this specific utility or use our global keyboard shortcuts (Command/Ctrl + K) to launch it instantly anytime. 
      </div>

    </article>
  );
};
