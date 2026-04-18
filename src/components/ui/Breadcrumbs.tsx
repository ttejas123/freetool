import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { toolRegistry } from '@/tools/toolRegistry';

export const Breadcrumbs = () => {
  const location = useLocation();
  const pathPart = location.pathname.substring(1);
  const tool = toolRegistry.find(t => t.path === pathPart);

  if (!tool) return null;

  return (
    <nav className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-6">
      <Link 
        to="/" 
        className="flex items-center gap-1.5 hover:text-brand-500 transition-colors"
      >
        <Home className="w-3 h-3" />
        <span>Home</span>
      </Link>
      
      <ChevronRight className="w-3 h-3 opacity-30" />
      
      <Link 
        to={`/?category=${encodeURIComponent(tool.category)}`}
        className="hover:text-brand-500 transition-colors"
      >
        {tool.category}
      </Link>
      
      <ChevronRight className="w-3 h-3 opacity-30" />
      
      <span className="text-gray-900 dark:text-gray-200">
        {tool.name}
      </span>
    </nav>
  );
};
