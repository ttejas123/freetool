import { useState, useEffect, useMemo } from 'react';

import { toolRegistry, type RegistryTool } from '../tools/toolRegistry';
import { SEOHelmet } from '../components/SEOHelmet';
import { Search, Compass, Clock, Star, LayoutGrid } from 'lucide-react';

export const Home = () => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [recentTools, setRecentTools] = useState<RegistryTool[]>([]);

  // Calculate unique categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(toolRegistry.map(t => t.category)));
    return ['All', ...cats.sort()];
  }, []);

  // Set up recent and recommended on mount
  useEffect(() => {
    try {
      const recentIds = JSON.parse(localStorage.getItem('recentTools') || '[]');
      const recent = recentIds.map((id: string) => toolRegistry.find(t => t.id === id)).filter(Boolean);
      setRecentTools(recent);
    } catch (e) {
      setRecentTools([]);
    }
  }, []);

  // Static recommended tools for now
  const recommendedTools = useMemo(() => {
    const recommendedIds = ['json-formatter', 'data-visualizer', 'diff-checker', 'color-palette'];
    return recommendedIds.map(id => toolRegistry.find(t => t.id === id)).filter(Boolean) as RegistryTool[];
  }, []);

  const filteredTools = toolRegistry.filter((tool) => {
    const matchesSearch = 
      tool.name.toLowerCase().includes(search.toLowerCase()) ||
      tool.description.toLowerCase().includes(search.toLowerCase()) ||
      tool.category.toLowerCase().includes(search.toLowerCase()) ||
      tool.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
      
    const matchesCategory = selectedCategory === 'All' || tool.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const isSearchingOrFiltering = search.length > 0 || selectedCategory !== 'All';

  const ToolCard = ({ tool }: { tool: RegistryTool }) => {
    const Icon = tool.icon;
    return (
      <a
        key={tool.id}
        href={`/${tool.path}`}
        className="group relative flex flex-col p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-brand-500 dark:hover:border-brand-500 hover:shadow-lg transition-all"
      >
        <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-brand-50 dark:bg-gray-700/50 text-brand-600 dark:text-brand-400 group-hover:scale-110 transition-transform">
          <Icon className="w-6 h-6" />
        </div>
        <h3 className="mt-4 text-xl font-bold text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
          {tool.name}
        </h3>
        <p className="mt-2 text-gray-500 dark:text-gray-400 text-sm line-clamp-2">
          {tool.description}
        </p>
        <div className="mt-auto pt-4 flex gap-2 w-full flex-wrap">
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
            {tool.category}
          </span>
          {tool.tags.slice(0, 2).map(tag => (
            <span key={tag} className="text-xs font-medium bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 px-2 py-0.5 rounded-full items-center flex">
              {tag}
            </span>
          ))}
        </div>
      </a>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <SEOHelmet
        title="Home"
        description="A premium collection of high-performance developer tools, available instantly online without any backend processing."
      />

      <div className="text-center max-w-2xl mx-auto space-y-4 pt-10 pb-6">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          Developer Essentials, <br />
          <span className="text-brand-600 dark:text-brand-500 text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-500">
            Zero Latency
          </span>.
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Supercharge your workflow with instant, client-side utility tools. No data leaves your browser.
        </p>

        <div className="relative mt-8 max-w-lg mx-auto">
          <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search tools, tags, categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white dark:bg-gray-800 border-2 border-transparent focus:border-brand-500 shadow-sm transition-all text-gray-900 dark:text-white dark:placeholder-gray-400 outline-none"
          />
        </div>

        {/* Categories Pill Row */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
          {categories.map((cat) => (
             <button
               key={cat}
               onClick={() => setSelectedCategory(cat)}
               className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                 selectedCategory === cat
                   ? 'bg-brand-600 text-white shadow-md'
                   : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
               }`}
             >
               {cat}
             </button>
          ))}
        </div>
      </div>

      {!isSearchingOrFiltering ? (
        <div className="space-y-12">
          {/* Recently Used Section */}
          {recentTools.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                <Clock className="w-5 h-5 text-brand-500" />
                <h2 className="text-xl font-bold tracking-tight">Recently Used</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {recentTools.map((tool) => (
                  <ToolCard key={`recent-${tool.id}`} tool={tool} />
                ))}
              </div>
            </section>
          )}

          {/* Recommended Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Star className="w-5 h-5 text-amber-500" />
              <h2 className="text-xl font-bold tracking-tight">Recommended</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {recommendedTools.map((tool) => (
                <ToolCard key={`rec-${tool.id}`} tool={tool} />
              ))}
            </div>
          </section>

          {/* All Tools Grouped by Category */}
          <section className="space-y-8 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2 text-gray-900 dark:text-white mb-2">
              <Compass className="w-5 h-5 text-blue-500" />
              <h2 className="text-xl font-bold tracking-tight">Explore the Platform</h2>
            </div>
            {categories.filter(c => c !== 'All').map((cat) => {
              const categoryTools = toolRegistry.filter(t => t.category === cat);
              if (categoryTools.length === 0) return null;
              return (
                <div key={cat} className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4 opacity-50"/> {cat}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {categoryTools.map(tool => (
                      <ToolCard key={tool.id} tool={tool} />
                    ))}
                  </div>
                </div>
              );
            })}
          </section>
        </div>
      ) : (
        /* Filtered/Searched View */
        <div className="pt-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Search Results ({filteredTools.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTools.length > 0 ? (
              filteredTools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-gray-500 dark:text-gray-400 text-lg">
                No tools found matching your criteria.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
