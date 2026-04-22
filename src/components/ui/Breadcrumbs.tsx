'use client';

import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { toolRegistry } from '@/tools/toolRegistry';

export const Breadcrumbs = () => {
  const pathname = usePathname();
  const pathPart = pathname.substring(1).replace(/\/$/, '');
  const tool = toolRegistry.find(t => t.path === pathPart);

  if (!tool) return null;

  return (
    <nav className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-6">
      <a 
        href="/" 
        className="flex items-center gap-1.5 hover:text-brand-500 transition-colors"
      >
        <Home className="w-3 h-3" />
        <span>Home</span>
      </a>
      
      <ChevronRight className="w-3 h-3 opacity-30" />
      
      <a 
        href={`/?category=${encodeURIComponent(tool.category)}`}
        className="hover:text-brand-500 transition-colors"
      >
        {tool.category}
      </a>
      
      <ChevronRight className="w-3 h-3 opacity-30" />
      
      <span className="text-gray-900 dark:text-gray-200">
        {tool.name}
      </span>
    </nav>
  );
};
