import { useState, useEffect, useMemo, useRef } from 'react';
import { toolRegistry, type RegistryTool } from '../tools/toolRegistry';
import { SEOHelmet } from '../components/SEOHelmet';
import { Compass, ChevronDown, Eye, ArrowUp, Pin, BadgeCheck, ListFilter, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { getToolMetricsSync, recordToolView, fetchAllToolMetrics, getCachedMetrics, type ToolMetric } from '../lib/toolStats';
import { trackPageView } from '../lib/analytics';
import { Filter } from 'lucide-react';

export const Home = () => {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'all';
  
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'views' | 'upvotes'>('newest');
  const [pricingFilter, setPricingFilter] = useState<'all' | 'free'>('all');
  const [metrics, setMetrics] = useState<Record<string, ToolMetric>>(getCachedMetrics());
  const [hoveredTool, setHoveredTool] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    trackPageView('/');
    
    // Initial check
    setTimeout(checkScroll, 100);
    
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
    }
    window.addEventListener('resize', checkScroll);
    
    return () => {
      if (container) container.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, []);

  // Fetch Global Metrics
  useEffect(() => {
    const loadStats = async () => {
       const globalMetrics = await fetchAllToolMetrics();
       setMetrics(globalMetrics);
    };
    loadStats();
    // Refresh every 30 seconds for 'live' feel
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Global aggregate stats
  const aggregateStats = useMemo(() => {
    const vals = Object.values(metrics);
    return {
       totalViews: vals.reduce((acc, curr) => acc + Number(curr.views), 0),
       totalUsers: vals.reduce((acc, curr) => acc + Number(curr.uniqueUsers), 0)
    };
  }, [metrics]);

  // Ranking calculation
  const rankedTools = useMemo(() => {
    return [...toolRegistry].sort((a, b) => {
        const m1 = metrics[a.id] || { views: 0, upvotes: 0 };
        const m2 = metrics[b.id] || { views: 0, upvotes: 0 };
        // Rank by Views + (Upvotes * 5) for a balanced popularity score
        const score1 = Number(m1.views) + (Number(m1.upvotes) * 5);
        const score2 = Number(m2.views) + (Number(m2.upvotes) * 5);
        return score2 - score1;
    });
  }, [metrics]);

  // Calculate unique categories and their tool counts
  const categories = useMemo(() => {
    const cats = Array.from(new Set(toolRegistry.map(t => t.category)));
    const allCount = toolRegistry.length;
    const catData = cats.map(cat => ({
      name: cat,
      count: toolRegistry.filter(t => t.category === cat).length
    })).sort((a, b) => b.count - a.count);
    
    return [{ name: 'All', count: allCount }, ...catData];
  }, []);

  const filteredTools = useMemo(() => {
    let tools = toolRegistry;
    
    // Filter by Pricing (All are free right now, but we'll show logic)
    if (pricingFilter === 'free') {
        // tools = tools.filter(t => t.pricing === 'free'); 
    }

    // Filter by Search Term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      tools = tools.filter(t => 
        t.name.toLowerCase().includes(term) || 
        t.category.toLowerCase().includes(term) ||
        t.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }

    if (selectedCategory !== 'All') {
       tools = tools.filter(t => t.category === selectedCategory);
    }
    
    if (tab === 'top') {
       tools = [...tools].sort((a, b) => {
           const m1 = metrics[a.id] || { upvotes: 0 };
           const m2 = metrics[b.id] || { upvotes: 0 };
           return Number(m2.upvotes) - Number(m1.upvotes);
       });
    } else if (tab === 'recents') {
       try {
         const recentIds = JSON.parse(localStorage.getItem('recentTools') || '[]');
         tools = recentIds.map((id: string) => toolRegistry.find(t => t.id === id)).filter(Boolean);
       } catch {
         tools = [];
       }
    } else if (tab === 'bookmarks') {
       tools = [];
    } else if (tab === 'featured') {
       tools = tools.filter(t => ['pipeline-builder', 'diff-checker', 'color-palette'].includes(t.id));
    } else {
        // Handle custom sorting if on 'all' tab
        if (sortBy === 'views') {
            tools = [...tools].sort((a, b) => (Number(metrics[b.id]?.views) || 0) - (Number(metrics[a.id]?.views) || 0));
        } else if (sortBy === 'upvotes') {
            tools = [...tools].sort((a, b) => (Number(metrics[b.id]?.upvotes) || 0) - (Number(metrics[a.id]?.upvotes) || 0));
        }
        // Default is newest first (toolRegistry order is already curated or we can add createdAt)
    }
    
    return tools;
  }, [selectedCategory, tab, searchTerm, sortBy, pricingFilter, metrics]);

  // Featured Tools (Mock IDs for visual layout)
  const featuredTools = useMemo(() => {
    return [
      toolRegistry.find(t => t.id === 'pipeline-builder') || toolRegistry[0],
      toolRegistry.find(t => t.id === 'diff-checker') || toolRegistry[1]
    ].filter(Boolean) as RegistryTool[];
  }, []);

  const ToolCard = ({ tool, featured = false }: { tool: RegistryTool, featured?: boolean }) => {
    const Icon = tool.icon;
    const stats = metrics[tool.id] || getToolMetricsSync(tool.id);
    const globalRank = rankedTools.findIndex(t => t.id === tool.id) + 1;

    return (
      <a
        href={`/${tool.path}`}
        onClick={() => recordToolView(tool.id)}
        onMouseEnter={() => setHoveredTool(tool.id)}
        onMouseLeave={() => setHoveredTool(null)}
        className={`group relative flex flex-col p-5 rounded-xl bg-white dark:bg-[#0A0A0A] border transition-all duration-200 ${
          hoveredTool === tool.id ? 'border-brand-500 shadow-lg' : 'border-gray-200 dark:border-gray-800/60 shadow-sm'
        }`}
      >
        <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1">
               {/* Icon Box */}
               <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-lg bg-gray-50 dark:bg-[#141414] border border-gray-100 dark:border-gray-800 text-gray-400 group-hover:text-brand-500 transition-colors">
                  <Icon className="w-6 h-6" />
               </div>
               
               <div className="flex-1 mt-0.5">
                  <div className="flex items-center gap-1.5">
                     <h3 className="font-semibold text-gray-900 dark:text-gray-200 group-hover:text-brand-500 dark:group-hover:text-white transition-colors">
                        {tool.name}
                     </h3>
                     <BadgeCheck className="w-4 h-4 text-brand-500 flex-shrink-0" />
                     {globalRank <= 4 && (
                       <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-500 px-1.5 py-0.5 rounded border border-amber-100 dark:border-amber-500/20">
                         #{globalRank}
                       </span>
                     )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{tool.category}</p>
                  
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {tool.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
               </div>
            </div>

            {/* Stats Badge */}
            <div className="flex flex-col items-center justify-center gap-1.5 bg-gray-50 dark:bg-[#141414] border border-gray-100 dark:border-gray-800 rounded-lg py-1.5 px-2.5 min-w-[3.5rem] flex-shrink-0">
               <div className="flex items-center justify-center gap-1 text-[11px] text-gray-500 dark:text-gray-400 w-full">
                  <ArrowUp className="w-3 h-3 text-brand-500" />
                  <span className="font-medium text-gray-700 dark:text-gray-300">{stats.upvotes}</span>
               </div>
               <div className="flex items-center justify-center gap-1 text-[11px] text-gray-500 dark:text-gray-400 w-full">
                  <Eye className="w-3 h-3 text-gray-400" />
                  <span>{stats.views}</span>
               </div>
            </div>
        </div>

        {/* Description line at bottom */}
        {featured ? (
          <p className="mt-5 text-sm text-gray-600 dark:text-gray-400">{tool.description}</p>
        ) : (
          <p className="mt-4 text-xs text-gray-500 line-clamp-1 group-hover:text-gray-700 dark:group-hover:text-gray-400 transition-colors pt-2 border-t border-gray-100 dark:border-gray-800/30">
             {tool.description}
          </p>
        )}
      </a>
    );
  };

  return (
    <div className="flex-1 w-full bg-gray-50 dark:bg-[#0A0A0A] transition-colors duration-200">
      <SEOHelmet
        title="Tools"
        description="A premium collection of high-performance developer tools."
      />

      {/* Main Browse Section */}
      <div className="max-w-[1400px] mx-auto px-4 py-6">
        <div className="text-[10px] sm:text-xs font-semibold text-gray-400 dark:text-gray-500 tracking-wider uppercase mb-5">
          {tab === 'all' ? 'Browse by category' : `Viewing ${tab}`}
        </div>

        {/* Category container with scroll arrows */}
        <div className="relative group/scroller">
          {/* Left Arrow */}
          {showLeftArrow && (
            <button 
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-white/80 dark:bg-[#141414]/80 backdrop-blur-md border border-gray-200 dark:border-gray-800 shadow-lg text-gray-700 dark:text-gray-300 -ml-3 animate-in fade-in zoom-in duration-200"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {/* Right Arrow */}
          {showRightArrow && (
            <button 
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-white/80 dark:bg-[#141414]/80 backdrop-blur-md border border-gray-200 dark:border-gray-800 shadow-lg text-gray-700 dark:text-gray-300 -mr-3 animate-in fade-in zoom-in duration-200"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {/* Category Pills - horizontally scrollable */}
          <div 
            ref={scrollContainerRef}
            className="flex items-center gap-2 overflow-x-auto pb-4 hide-scrollbar scroll-smooth"
          >
            {categories.map((cat) => {
               const isActive = selectedCategory === cat.name;
               return (
                 <button
                   key={cat.name}
                   onClick={() => setSelectedCategory(cat.name)}
                   className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full border text-sm transition-all duration-200 ${
                     isActive 
                       ? 'bg-gray-800 border-gray-600 text-white shadow-sm' 
                       : 'bg-white dark:bg-[#141414] border-gray-200 dark:border-gray-800/60 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700'
                   }`}
                 >
                   {cat.name === 'All' ? <ListFilter className="w-4 h-4 opacity-70" /> : <Compass className="w-4 h-4 opacity-70" />}
                   <span className="font-medium">{cat.name}</span>
                   <span className={`text-xs px-2 py-0.5 rounded font-semibold ${isActive ? 'bg-black/60 text-gray-300' : 'bg-gray-100 dark:bg-black/60 text-gray-500'}`}>
                      {cat.count}
                   </span>
                 </button>
               );
            })}
          </div>
        </div>

        {/* Filter and Sort Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between py-6 mt-1 border-b border-gray-200 dark:border-gray-800/60 gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
               {/* Search Input */}
               <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search tools, tags..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 bg-white dark:bg-[#141414] border border-gray-200 dark:border-gray-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  />
                  {searchTerm && (
                    <button 
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
               </div>

               <div className="relative">
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="appearance-none flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#141414] border border-gray-200 dark:border-gray-800 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors focus:outline-none cursor-pointer pr-8"
                  >
                    <option value="newest">Newest First</option>
                    <option value="views">Most Viewed</option>
                    <option value="upvotes">Top Rated</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
               </div>

               <div className="relative">
                  <select 
                    value={pricingFilter}
                    onChange={(e) => setPricingFilter(e.target.value as any)}
                    className="appearance-none flex items-center gap-2 px-3 py-2 bg-transparent border border-gray-200 dark:border-gray-800 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#141414] transition-colors focus:outline-none cursor-pointer pr-8"
                  >
                    <option value="all">All Pricing</option>
                    <option value="free">Free Only</option>
                  </select>
                  <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
               </div>
            </div>

           <div className="flex items-center justify-end w-full md:w-auto gap-4 text-xs text-gray-500 dark:text-gray-400">
              <div className="hidden sm:flex items-center gap-4 bg-white dark:bg-[#141414] rounded-full px-4 py-1.5 border border-gray-200 dark:border-gray-800">
                 <div className="flex items-center gap-1.5 font-medium">
                    <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></span>
                    <span className="text-gray-900 dark:text-gray-200">{aggregateStats.totalUsers.toLocaleString()}+</span> Users
                 </div>
                 <span className="text-gray-300 dark:text-gray-700">/</span>
                 <div className="font-medium flex items-center gap-1.5">
                    <span className="text-gray-900 dark:text-gray-200">{aggregateStats.totalViews.toLocaleString()}+</span> Views
                 </div>
              </div>
              <a href="#" className="flex items-center gap-1 text-brand-500 hover:text-brand-600 dark:hover:text-brand-400 font-medium">
                 View Stats
                 <ArrowUp className="w-3 h-3 rotate-45" />
              </a>
           </div>
        </div>

        {/* Featured Tools Section */}
        {selectedCategory === 'All' && tab === 'all' && (
          <div className="mt-10 mb-12 animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <Pin className="w-5 h-5 text-amber-500 fill-amber-500/20" />
                  <h2 className="text-xl font-bold tracking-tight">Featured Tools</h2>
               </div>
               <a href="/contact" className="px-4 py-1.5 border border-amber-200 dark:border-amber-900/40 text-amber-600 dark:text-amber-500/80 hover:text-amber-600 dark:hover:text-amber-500 text-sm font-medium rounded-lg hover:bg-amber-50 dark:hover:bg-amber-500/5 transition-colors">
                  Get featured
               </a>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {featuredTools.map((tool) => (
                <ToolCard key={`feat-${tool.id}`} tool={tool} featured={true} />
              ))}
            </div>
          </div>
        )}

        {/* All Tools Grouped (or Filtered) */}
        <div className="mt-10 animate-in fade-in duration-500 delay-150">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight capitalize">
            {tab !== 'all' ? `${tab} Tools ` : selectedCategory === 'All' && !searchTerm ? 'All Tools' : `${selectedCategory} Tools`}
          </h2>
          
          {selectedCategory === 'All' && tab === 'all' && !searchTerm ? (
            <div className="space-y-12 pb-12">
              {categories.filter(c => c.name !== 'All').map(cat => {
                const toolsInCategory = filteredTools.filter(t => t.category === cat.name);
                if (toolsInCategory.length === 0) return null;
                
                return (
                  <div key={cat.name} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-2">
                         <div className="w-1 h-6 bg-brand-500 rounded-full" />
                         <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{cat.name}</h3>
                         <span className="text-xs text-gray-500 font-medium px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-md">
                            {toolsInCategory.length}
                         </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                      {toolsInCategory.map((tool) => (
                        <ToolCard key={tool.id} tool={tool} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-12">
              {filteredTools.length > 0 ? (
                filteredTools.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))
              ) : (
                <div className="col-span-full py-20 text-center text-gray-500 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
                  No tools found in this criteria.
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
