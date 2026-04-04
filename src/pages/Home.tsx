import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toolRegistry, type RegistryTool } from '../tools/toolRegistry';
import { SEOHelmet } from '../components/SEOHelmet';
import { 
  Compass, 
  ChevronDown, 
  Eye, 
  ArrowUp, 
  Search, 
  Flame, 
  ArrowRight,
  Zap,
  Shield,
  Clock,
  Sparkles,
  Layers,
  Plus,
  ExternalLink,
  Copy
} from 'lucide-react';
import { useSearchParams, Link } from 'react-router-dom';
import { getToolMetricsSync, recordToolView, fetchAllToolMetrics, getCachedMetrics, type ToolMetric } from '../lib/toolStats';
import { trackPageView } from '../lib/analytics';
import { TypingText } from '../components/ui/TypingText';
import { Counter } from '../components/ui/Counter';
import { GridBackground } from '../components/ui/GridBackground';
import { UpcomingTools } from '../components/home/UpcomingTools';

const getCategoryColor = (category: string) => {
  const cat = category.toLowerCase();
  if (cat.includes('dev')) return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
  if (cat.includes('ai')) return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
  if (cat.includes('media')) return 'bg-pink-500/10 text-pink-500 border-pink-500/20';
  if (cat.includes('security')) return 'bg-green-500/10 text-green-500 border-green-500/20';
  return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
};

export const Home = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'all';
  
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState<'newest' | 'views' | 'upvotes'>('newest');
  const [metrics, setMetrics] = useState<Record<string, ToolMetric>>(getCachedMetrics());
  const [recentTools, setRecentTools] = useState<RegistryTool[]>([]);

  useEffect(() => {
    trackPageView('/');
    const saved = localStorage.getItem('recentTools');
    if (saved) {
       try {
         const ids = JSON.parse(saved);
         const tools = ids.map((id: string) => toolRegistry.find(t => t.id === id)).filter(Boolean);
         setRecentTools(tools);
       } catch (e) {
         console.error('Failed to load recent tools', e);
       }
    }
  }, []);

  useEffect(() => {
    const query = searchParams.get('search');
    if (query !== null) {
      setSearchTerm(query);
    }
  }, [searchParams]);

  const handleLocalSearch = (val: string) => {
     setSearchTerm(val);
     const newParams = new URLSearchParams(searchParams);
     if (val) newParams.set('search', val);
     else newParams.delete('search');
     setSearchParams(newParams, { replace: true });
  };

  useEffect(() => {
    const loadStats = async () => {
       const globalMetrics = await fetchAllToolMetrics();
       setMetrics(globalMetrics);
    };
    loadStats();
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const aggregateStats = useMemo(() => {
    const vals = Object.values(metrics);
    return {
       totalViews: vals.reduce((acc: number, curr: ToolMetric) => acc + (Number(curr.views) || 0), 0),
       totalUsers: vals.reduce((acc: number, curr: ToolMetric) => acc + (Number(curr.uniqueUsers) || 0), 0)
    };
  }, [metrics]);

  const rankedTools = useMemo(() => {
    return [...toolRegistry].sort((a, b) => {
        const m1 = metrics[a.id] || { views: 0, upvotes: 0 };
        const m2 = metrics[b.id] || { views: 0, upvotes: 0 };
        const score1 = (Number(m1.views) || 0) + ((Number(m1.upvotes) || 0) * 5);
        const score2 = (Number(m2.views) || 0) + ((Number(m2.upvotes) || 0) * 5);
        return score2 - score1;
    });
  }, [metrics]);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(toolRegistry.map(t => t.category)));
    return cats.map(cat => ({
      name: cat,
      count: toolRegistry.filter(t => t.category === cat).length
    })).sort((a, b) => b.count - a.count);
  }, []);

  const filteredTools = useMemo(() => {
    let tools = toolRegistry;
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
           return (Number(m2.upvotes) || 0) - (Number(m1.upvotes) || 0);
       });
    } else if (tab === 'featured') {
       tools = tools.filter(t => ['pipeline-builder', 'diff-checker', 'color-palette'].includes(t.id));
    } else {
        if (sortBy === 'views') {
            tools = [...tools].sort((a, b) => (Number(metrics[b.id]?.views) || 0) - (Number(metrics[a.id]?.views) || 0));
        } else if (sortBy === 'upvotes') {
            tools = [...tools].sort((a, b) => (Number(metrics[b.id]?.upvotes) || 0) - (Number(metrics[a.id]?.upvotes) || 0));
        }
    }
    return tools;
  }, [selectedCategory, tab, searchTerm, sortBy, metrics]);

  const ToolCard = ({ tool }: { tool: RegistryTool }) => {
    const Icon = tool.icon;
    const stats = metrics[tool.id] || getToolMetricsSync(tool.id);
    const globalRank = rankedTools.findIndex(t => t.id === tool.id) + 1;
    const catClass = getCategoryColor(tool.category);

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -5 }}
        className="group relative"
      >
        <a
          href={`/${tool.path}`}
          onClick={() => recordToolView(tool.id)}
          className="block p-6 rounded-3xl bg-white dark:bg-[#0A0A0A] border border-gray-100 dark:border-white/5 hover:border-brand-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-brand-500/10 active:scale-95"
        >
          <div className="flex items-start justify-between mb-6">
            <div className={`w-14 h-14 flex items-center justify-center rounded-2xl ${catClass.split(' ')[0]} ${catClass.split(' ')[1]} border ${catClass.split(' ')[2]} group-hover:scale-110 transition-transform shadow-sm`}>
              <Icon className="w-7 h-7" />
            </div>
            
            {/* Quick Actions overlay handles hover state */}
            <div className="flex flex-col items-end gap-2">
               <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-500 hover:text-brand-500 transition-colors">
                     <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button className="p-2 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-500 hover:text-brand-500 transition-colors">
                     <ExternalLink className="w-3.5 h-3.5" />
                  </button>
               </div>
               <div className="flex flex-col items-end gap-1.5">
                {globalRank <= 3 && (
                  <div className="flex items-center gap-1 text-[9px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 uppercase tracking-tighter">
                    <Flame className="w-2.5 h-2.5" />
                    TRENDING
                  </div>
                )}
                {(stats?.upvotes || 0) > 10 && (
                  <div className="flex items-center gap-1 text-[9px] font-bold text-brand-500 bg-brand-500/10 px-2 py-0.5 rounded-full border border-brand-500/20 uppercase tracking-tighter">
                    <Plus className="w-2.5 h-2.5" />
                    POPULAR
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-brand-500 transition-colors">
              {tool.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-2 leading-relaxed">
              {tool.description}
            </p>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-gray-50 dark:border-white/5">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Eye className="w-4 h-4" />
                <span className="font-bold tabular-nums"><Counter value={stats?.views || 0} duration={1} /></span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <ArrowUp className="w-4 h-4 text-brand-500" />
                <span className="font-bold text-gray-700 dark:text-gray-300 tabular-nums">{stats?.upvotes || 0}</span>
              </div>
            </div>
            <div className="text-[10px] font-bold px-2 py-1 rounded-md bg-gray-50 dark:bg-white/5 text-gray-400 uppercase tracking-widest border border-transparent group-hover:border-brand-500/20 group-hover:text-brand-500 transition-all">
              {tool.category}
            </div>
          </div>
        </a>
      </motion.div>
    );
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.3 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="flex-1 w-full bg-white dark:bg-[#050505] transition-colors duration-200 overflow-x-hidden">
      <SEOHelmet
        title="Premium Developer Tools"
        description="Transform your workflow with our suite of high-performance, privacy-focused developer tools."
      />

      {/* Hero Section */}
      <section className="relative pt-32 pb-48 overflow-hidden bg-glow">
        <GridBackground />

        <div className="container mx-auto px-6 relative z-10 text-center">
          <motion.div variants={container} initial="hidden" animate="show">
            <motion.div variants={item} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 text-brand-500 text-[10px] font-black mb-10 border border-brand-500/20 uppercase tracking-[0.2em] shadow-sm">
              <Sparkles className="w-4 h-4" />
              <span>OVER <Counter value={100} duration={1.5} />+ FREE TOOLS FOR DEVELOPERS</span>
            </motion.div>
            
            <motion.h1 variants={item} className="text-6xl md:text-8xl font-black tracking-tighter text-gray-900 dark:text-white mb-10 leading-[0.9]">
              Scale your workflow.<br />
              <span className="text-gradient drop-shadow-sm">
                {"Fast. Free. Secure.".split(" ").map((word, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 + (i * 0.2), type: 'spring' }}
                    className="inline-block mr-4"
                  >
                    {word}
                  </motion.span>
                ))}
              </span>
            </motion.h1>
            
            <motion.p variants={item} className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-14 leading-relaxed font-medium">
              <TypingText text="Professional-grade tools for modern engineers. No tracking, no accounts—just pure performance in the browser." />
            </motion.p>

            <motion.div variants={item} className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <button 
                onClick={() => document.getElementById('browse')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full sm:w-auto px-10 py-5 bg-gray-900 dark:bg-white text-white dark:text-black rounded-2xl font-black text-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 shadow-2xl shadow-brand-500/20 active:shadow-none"
              >
                Explore All Tools
                <ArrowRight className="w-6 h-6" />
              </button>
              <button 
                onClick={() => {
                  const newParams = new URLSearchParams(searchParams);
                  newParams.set('tab', 'top');
                  setSearchParams(newParams);
                  document.getElementById('browse')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full sm:w-auto px-10 py-5 glass rounded-2xl font-black text-xl hover:bg-white dark:hover:bg-white/10 transition-all border border-gray-200 dark:border-white/10 active:scale-95 shadow-xl"
              >
                View Popular
              </button>
            </motion.div>

            <motion.div variants={item} className="mt-20 flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-30 group-hover:opacity-100 transition-opacity">
               <div className="flex items-center gap-2 font-bold text-xs hover:text-brand-500 transition-colors cursor-default">
                  <Shield className="w-5 h-5 text-brand-500" />
                  PRIVACY FIRST
               </div>
               <div className="flex items-center gap-2 font-bold text-xs hover:text-amber-500 transition-colors cursor-default">
                  <Zap className="w-5 h-5 text-amber-500" />
                  ULTRA FAST
               </div>
               <div className="flex items-center gap-2 font-bold text-xs hover:text-accent-purple transition-colors cursor-default">
                  <Clock className="w-5 h-5 text-accent-purple" />
                  NO LOGIN REQ.
               </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Trust Stats Bar */}
      <div className="relative z-20 -mt-24 mb-32">
        <div className="container mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass shadow-2xl rounded-[3rem] p-12 grid grid-cols-2 md:grid-cols-4 gap-12 text-center"
          >
            <div>
              <div className="text-5xl font-black text-gray-900 dark:text-white mb-2 tabular-nums">
                <Counter value={aggregateStats.totalUsers || 10000} suffix="+" />
              </div>
              <div className="text-[11px] text-gray-400 uppercase tracking-[0.3em] font-black">Active Users</div>
            </div>
            <div>
              <div className="text-5xl font-black text-gray-900 dark:text-white mb-2 tabular-nums">
                <Counter value={aggregateStats.totalViews || 1000000} suffix="+" />
              </div>
              <div className="text-[11px] text-gray-400 uppercase tracking-[0.3em] font-black">Ops / Month</div>
            </div>
            <div>
              <div className="text-5xl font-black text-gray-900 dark:text-white mb-2 tabular-nums">
                <Counter value={toolRegistry.length} />
              </div>
              <div className="text-[11px] text-gray-400 uppercase tracking-[0.3em] font-black">Live Tools</div>
            </div>
            <div>
              <div className="text-5xl font-black text-gray-900 dark:text-white mb-2">100%</div>
              <div className="text-[11px] text-gray-400 uppercase tracking-[0.3em] font-black">Privacy First</div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Recently Used Section */}
      <AnimatePresence>
        {recentTools.length > 0 && (
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="container mx-auto px-6 mb-32"
          >
             <div className="flex items-center gap-4 mb-10">
               <div className="px-3 py-1 bg-brand-500/10 text-brand-500 text-[10px] font-black rounded-lg uppercase tracking-widest border border-brand-500/20">
                 HISTORY
               </div>
               <h2 className="text-3xl font-black text-gray-900 dark:text-white">Recent Activity</h2>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {recentTools.slice(0, 4).map(tool => (
                  <Link 
                    key={`recent-${tool.id}`}
                    to={`/${tool.path}`}
                    className="flex items-center gap-5 p-5 rounded-[2rem] bg-white dark:bg-[#0A0A0A] border border-gray-100 dark:border-white/5 hover:border-brand-500/50 transition-all group shadow-sm hover:shadow-xl"
                  >
                     <div className={`w-12 h-12 flex items-center justify-center rounded-2xl ${getCategoryColor(tool.category).split(' ')[0]} ${getCategoryColor(tool.category).split(' ')[1]} text-gray-400 group-hover:scale-110 transition-transform`}>
                       <tool.icon className="w-6 h-6 text-current" />
                     </div>
                     <div className="flex-1 overflow-hidden">
                       <div className="font-extrabold text-sm text-gray-900 dark:text-white group-hover:text-brand-500 transition-colors truncate">{tool.name}</div>
                       <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{tool.category}</div>
                     </div>
                  </Link>
                ))}
             </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Categories Discovery */}
      <section className="container mx-auto px-6 mb-40" id="browse">
        <div className="flex items-end justify-between mb-16 px-2">
           <div className="max-w-xl text-left border-l-4 border-brand-500 pl-8">
             <h2 className="text-5xl font-black text-gray-900 dark:text-white mb-4 leading-none">Discovery</h2>
             <p className="text-lg text-gray-500 dark:text-gray-400 font-medium">Browse our tools by category or use cases.</p>
           </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-24">
           <button 
             onClick={() => setSelectedCategory('All')}
             className={`flex flex-col items-center justify-center p-8 rounded-[2.5rem] border-2 transition-all group ${
               selectedCategory === 'All' 
                 ? 'bg-brand-500 border-brand-500 text-white shadow-2xl shadow-brand-500/20 scale-105' 
                 : 'bg-white dark:bg-white/5 border-gray-100 dark:border-white/5 hover:border-brand-500/50 dark:text-white'
             }`}
           >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${selectedCategory === 'All' ? 'bg-white/20' : 'bg-gray-100 dark:bg-white/5 text-gray-400'} group-hover:scale-110 transition-transform`}>
                <Layers className="w-8 h-8" />
              </div>
              <span className="text-sm font-black uppercase tracking-widest">All Tools</span>
           </button>
           {categories.map((cat) => (
             <button 
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`flex flex-col items-center justify-center p-8 rounded-[2.5rem] border-2 transition-all group ${
                  selectedCategory === cat.name
                    ? 'bg-brand-500 border-brand-500 text-white shadow-2xl shadow-brand-500/20 scale-105' 
                    : 'bg-white dark:bg-white/5 border-gray-100 dark:border-white/5 hover:border-brand-500/50 dark:text-white'
                }`}
             >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${selectedCategory === cat.name ? 'bg-white/20' : 'bg-gray-100 dark:bg-white/5 text-gray-400'} group-hover:scale-110 transition-transform`}>
                  <Compass className="w-8 h-8" />
                </div>
                <span className="text-sm font-black uppercase tracking-widest">{cat.name}</span>
                <span className={`text-[11px] mt-2 font-bold opacity-60 ${selectedCategory === cat.name ? 'text-white' : ''}`}>{cat.count} tools</span>
             </button>
           ))}
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-8 px-2">
           <h3 className="text-4xl font-black text-gray-900 dark:text-white capitalize">
             {selectedCategory === 'All' ? tab === 'top' ? 'Trending Tools' : 'Global collection' : `${selectedCategory}`}
           </h3>
           <div className="flex items-center gap-4 w-full md:w-auto">
             <div className="relative flex-1 md:w-96">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search tools, tags, use cases..."
                  value={searchTerm}
                  onChange={(e) => handleLocalSearch(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 bg-gray-100/50 dark:bg-white/5 border border-transparent dark:border-white/10 rounded-2xl text-base focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition-all dark:text-white shadow-inner"
                />
             </div>
             <div className="relative">
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="appearance-none pl-6 pr-14 py-4 bg-gray-100/50 dark:bg-white/5 border border-transparent dark:border-white/10 rounded-2xl text-sm font-black uppercase tracking-widest focus:outline-none cursor-pointer dark:text-white shadow-inner"
                >
                  <option value="newest">Newest</option>
                  <option value="views">Popular</option>
                  <option value="upvotes">Best Rated</option>
                </select>
                <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
             </div>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 min-h-[400px]">
          <AnimatePresence mode="popLayout">
            {filteredTools.length > 0 ? (
              filteredTools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                key="no-results"
                className="col-span-full flex flex-col items-center justify-center py-48 text-center"
              >
                <div className="w-24 h-24 bg-gray-100 dark:bg-white/5 rounded-[2rem] flex items-center justify-center mb-10">
                   <Search className="w-10 h-10 text-gray-300" />
                </div>
                <h4 className="text-3xl font-black text-gray-900 dark:text-white mb-4">No tools found</h4>
                <p className="text-gray-500 dark:text-gray-400 font-medium">Try searching for broader terms or categories.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Upcoming Tools Section */}
      <UpcomingTools />

      {/* Call to Action Section */}
      <section className="container mx-auto px-6 mb-40">
         <div className="relative p-16 md:p-28 rounded-[4rem] bg-gray-900 dark:bg-white overflow-hidden shadow-[0_50px_100px_-20px_rgba(59,130,246,0.3)]">
            <div className="absolute top-0 right-0 w-[50%] h-full bg-brand-500/20 skew-x-12 translate-x-1/2 pointer-events-none"></div>
            <div className="relative z-10 max-w-2xl text-left">
               <h2 className="text-5xl md:text-7xl font-black text-white dark:text-black mb-8 leading-[0.9] tracking-tighter">
                 Missing a tool?<br />We build fast.
               </h2>
               <p className="text-white/50 dark:text-black/50 text-xl mb-14 font-medium leading-relaxed">
                 Our roadmap is driven by our community. Submit your request today and we'll aim to ship it in record time.
               </p>
               <Link 
                 to="/contact"
                 className="inline-flex items-center gap-4 px-12 py-6 bg-brand-500 text-white rounded-2xl font-black text-2xl hover:scale-105 active:scale-95 transition-all shadow-2xl"
               >
                 Request a Tool
                 <Plus className="w-8 h-8" />
               </Link>
            </div>
         </div>
      </section>
    </div>
  );
};
