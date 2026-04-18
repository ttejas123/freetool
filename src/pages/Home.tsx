import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toolRegistry, type RegistryTool } from '../tools/toolRegistry';
import { SEOHelmet } from '../components/SEOHelmet';
import { 
  Copy,
  Code,
  Database,
  Globe,
  Type,
  Palette,
  FileText,
  Ruler,
  Activity,
  Camera,
  Wand2,
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
  Terminal
} from 'lucide-react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { getToolMetricsSync, recordToolView, fetchAllToolMetrics, getCachedMetrics, type ToolMetric } from '../lib/toolStats';
import { trackPageView } from '../lib/analytics';
import { TypingText } from '../components/ui/TypingText';
import { Counter } from '../components/ui/Counter';
import { BackgroundEffects } from '../components/ui/BackgroundEffects';
import { UpcomingTools } from '../components/home/UpcomingTools';

const getCategoryConfig = (category: string) => {
  const cat = category.toLowerCase();
  if (cat === 'all') return { 
    icon: Layers, 
    color: 'from-brand-500 to-blue-600', 
    lightColor: 'bg-brand-500/10 text-brand-500 border-brand-500/20',
    glow: 'shadow-brand-500/20'
  };
  if (cat.includes('programming')) return { 
    icon: Terminal, 
    color: 'from-indigo-600 to-emerald-500', 
    lightColor: 'bg-indigo-600/10 text-indigo-600 border-indigo-600/20',
    glow: 'shadow-indigo-600/20'
  };
  if (cat.includes('dev')) return { 
    icon: Code, 
    color: 'from-indigo-500 to-purple-600', 
    lightColor: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
    glow: 'shadow-indigo-500/20'
  };
  if (cat.includes('ai') || cat.includes('creative')) return { 
    icon: Wand2, 
    color: 'from-purple-500 to-pink-600', 
    lightColor: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    glow: 'shadow-purple-500/20'
  };
  if (cat.includes('data')) return { 
    icon: Database, 
    color: 'from-blue-500 to-cyan-600', 
    lightColor: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    glow: 'shadow-blue-500/20'
  };
  if (cat.includes('security')) return { 
    icon: Shield, 
    color: 'from-emerald-500 to-teal-600', 
    lightColor: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    glow: 'shadow-emerald-500/20'
  };
  if (cat.includes('string') || cat.includes('text')) return { 
    icon: Type, 
    color: 'from-amber-500 to-orange-600', 
    lightColor: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    glow: 'shadow-amber-500/20'
  };
  if (cat.includes('media')) return { 
    icon: Camera, 
    color: 'from-pink-500 to-rose-600', 
    lightColor: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
    glow: 'shadow-pink-500/20'
  };
  if (cat.includes('network')) return { 
    icon: Globe, 
    color: 'from-sky-500 to-blue-600', 
    lightColor: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
    glow: 'shadow-sky-500/20'
  };
  if (cat.includes('health')) return { 
    icon: Activity, 
    color: 'from-red-500 to-orange-600', 
    lightColor: 'bg-red-500/10 text-red-500 border-red-500/20',
    glow: 'shadow-red-500/20'
  };
  if (cat.includes('design')) return { 
    icon: Palette, 
    color: 'from-violet-500 to-fuchsia-600', 
    lightColor: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
    glow: 'shadow-violet-500/20'
  };
  if (cat.includes('writing') || cat.includes('document')) return { 
    icon: FileText, 
    color: 'from-orange-500 to-yellow-600', 
    lightColor: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    glow: 'shadow-orange-500/20'
  };
  if (cat.includes('time')) return { 
    icon: Clock, 
    color: 'from-sky-400 to-indigo-500', 
    lightColor: 'bg-sky-400/10 text-sky-400 border-sky-400/20',
    glow: 'shadow-sky-400/20'
  };
  if (cat.includes('math')) return { 
    icon: Ruler, 
    color: 'from-slate-500 to-slate-700', 
    lightColor: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    glow: 'shadow-slate-500/20'
  };
  return { 
    icon: Compass, 
    color: 'from-gray-500 to-gray-700', 
    lightColor: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    glow: 'shadow-gray-500/20'
  };
};

const getCategoryColor = (category: string) => {
  return getCategoryConfig(category).lightColor;
};

import { getSearchResults } from '../utils/search';

export const Home = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const tab = searchParams.get('tab') || 'all';
  
  // Handle hash scrolling (e.g., /#upcoming)
  useEffect(() => {
    if (location.hash) {
      const element = document.getElementById(location.hash.slice(1));
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [location.hash]);

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
    const term = searchTerm.trim();
    
    if (term) {
      const results = getSearchResults(term, tools);
      tools = results.map(r => r.tool);
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
    } else if (!term) {
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
        <BackgroundEffects />

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
                  <a 
                    key={`recent-${tool.id}`}
                    href={`/${tool.path}`}
                    className="flex items-center gap-5 p-5 rounded-[2rem] bg-white dark:bg-[#0A0A0A] border border-gray-100 dark:border-white/5 hover:border-brand-500/50 transition-all group shadow-sm hover:shadow-xl"
                  >
                     <div className={`w-12 h-12 flex items-center justify-center rounded-2xl ${getCategoryColor(tool.category).split(' ')[0]} ${getCategoryColor(tool.category).split(' ')[1]} text-gray-400 group-hover:scale-110 transition-transform`}>
                       <tool.icon className="w-6 h-6 text-current" />
                     </div>
                     <div className="flex-1 overflow-hidden">
                       <div className="font-extrabold text-sm text-gray-900 dark:text-white group-hover:text-brand-500 transition-colors truncate">{tool.name}</div>
                       <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{tool.category}</div>
                     </div>
                  </a>
                ))}
             </div>
          </motion.section>
        )}
      </AnimatePresence>

      <section className="container mx-auto px-6 mb-40" id="browse">
        <div className="flex flex-col md:flex-row items-end justify-between mb-16 px-2 gap-8">
           <div className="max-w-xl text-left border-l-4 border-brand-500 pl-8">
             <h2 className="text-5xl font-black text-gray-900 dark:text-white mb-4 leading-none">Discover</h2>
             <p className="text-lg text-gray-500 dark:text-gray-400 font-medium">Explore professional-grade utilities across specialized domains.</p>
           </div>
           <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-100 dark:bg-white/5 px-4 py-2 rounded-full border border-gray-200 dark:border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-brand-500" />
              <span>{toolRegistry.length} Tools Available</span>
           </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-24">
           {/* All Tools Card */}
           <motion.button 
             whileHover={{ y: -5, scale: 1.02 }}
             whileTap={{ scale: 0.98 }}
             onClick={() => {
               setSelectedCategory('All');
               document.getElementById('tool-listing')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
             }}
             className={`relative overflow-hidden group p-6 rounded-[2rem] border-2 transition-all flex flex-col items-start text-left min-h-[160px] ${
               selectedCategory === 'All' 
                 ? 'bg-gray-900 border-gray-900 text-white dark:bg-white dark:border-white dark:text-black shadow-2xl' 
                 : 'bg-white dark:bg-[#0A0A0A] border-gray-100 dark:border-white/5 hover:border-brand-500/50'
             }`}
           >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${selectedCategory === 'All' ? 'bg-brand-500 text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-400'} group-hover:scale-110 transition-transform`}>
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <span className="block text-sm font-black uppercase tracking-widest mb-1">Standard</span>
                <span className="text-lg font-black leading-none">All Utils</span>
              </div>
              {selectedCategory === 'All' && (
                <motion.div layoutId="active-pill" className="absolute top-4 right-4 w-2 h-2 rounded-full bg-brand-500" />
              )}
           </motion.button>

           {categories.map((cat) => {
             const config = getCategoryConfig(cat.name);
             const Icon = config.icon;
             const isActive = selectedCategory === cat.name;
             
             return (
               <motion.button 
                  key={cat.name}
                  whileHover={{ y: -5, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSelectedCategory(cat.name);
                    document.getElementById('tool-listing')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className={`relative overflow-hidden group p-6 rounded-[2rem] border-2 transition-all flex flex-col items-start text-left min-h-[160px] ${
                    isActive
                      ? `bg-white dark:bg-[#0A0A0A] border-transparent shadow-2xl ${config.glow}` 
                      : 'bg-white dark:bg-[#0A0A0A] border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10'
                  }`}
               >
                  {/* Background Aura for Active State */}
                  {isActive && (
                    <div className={`absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br ${config.color} opacity-20 blur-2xl rounded-full`} />
                  )}

                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-all duration-300 ${
                    isActive 
                      ? `bg-gradient-to-br ${config.color} text-white shadow-lg` 
                      : 'bg-gray-100 dark:bg-white/5 text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-white/10'
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  
                  <div className="relative z-10">
                    <span className={`block text-[10px] font-black uppercase tracking-widest mb-1 ${isActive ? 'text-brand-500' : 'text-gray-400'}`}>
                      {cat.count} Tools
                    </span>
                    <span className={`text-lg font-black leading-none ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                      {cat.name}
                    </span>
                  </div>

                  {isActive && (
                    <motion.div layoutId="active-pill" className={`absolute top-4 right-4 w-2 h-2 rounded-full bg-gradient-to-br ${config.color}`} />
                  )}
               </motion.button>
             );
           })}
        </div>

        <div id="tool-listing" className="flex flex-col md:flex-row items-center justify-between mb-16 gap-8 px-2 scroll-mt-24">
           <div className="flex flex-col">
              <h3 className="text-4xl font-black text-gray-900 dark:text-white capitalize leading-tight">
                {selectedCategory === 'All' ? tab === 'top' ? 'Trending Tools' : 'Global collection' : `${selectedCategory}`}
              </h3>
              <p className="text-sm text-gray-400 font-medium mt-1">
                Showing {filteredTools.length} {filteredTools.length === 1 ? 'utility' : 'utilities'} match your profile.
              </p>
           </div>
           
           <div className="flex items-center gap-4 w-full md:w-auto">
             <div className="relative flex-1 md:w-96 group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search tools, tags, use cases..."
                  value={searchTerm}
                  onChange={(e) => handleLocalSearch(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 bg-gray-100/50 dark:bg-white/5 border border-transparent dark:border-white/10 rounded-2xl text-base focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition-all dark:text-white shadow-inner"
                />
             </div>
             <div className="relative group">
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="appearance-none pl-6 pr-14 py-4 bg-gray-100/50 dark:bg-white/5 border border-transparent dark:border-white/10 rounded-2xl text-sm font-black uppercase tracking-widest focus:outline-none cursor-pointer dark:text-white shadow-inner hover:bg-gray-200/50 dark:hover:bg-white/10 transition-all"
                >
                  <option value="newest">Newest</option>
                  <option value="views">Popular</option>
                  <option value="upvotes">Best Rated</option>
                </select>
                <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none group-hover:text-brand-500 transition-colors" />
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

      {/* Why Choose FreeTool SEO Section */}
      <section className="container mx-auto px-6 mb-32 border-t border-gray-100 dark:border-white/5 pt-32">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 text-brand-500 text-[10px] font-black mb-8 border border-brand-500/20 uppercase tracking-[0.2em]">
             <Zap className="w-4 h-4" />
             <span>The FreeTool Advantage</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-6">
            Why We Built FreeTool Software Utilities
          </h2>
          <p className="text-xl text-gray-500 dark:text-gray-400 font-medium">
            Navigating dozens of disjointed, ad-riddled websites to find a reliable JSON formatter or an image compressor wastes valuable developer time. FreeTool fixes this entirely.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 font-medium text-gray-600 dark:text-gray-400">
           <div>
             <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">100% Free, Zero Ads, Zero Logins</h3>
             <p className="mb-6 leading-relaxed">
               Unlike other online developer utilities, FreeTool functions completely free without paywalls or annoying subscriptions. Our mission is to democratize high-quality, professional-grade developer tools that simply work. We completely removed the friction of creating user accounts. You can just open a tool and use it.
             </p>
             <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Unmatched Speed & Performance</h3>
             <p className="leading-relaxed">
               Our entire platform utilizes pure client-side processing using cutting-edge WebAssembly and Web Workers. Because the majority of our tools don't even talk to an external backend server, processing is instantaneous. No upload limits, no waiting for server queues, just instant results generated right from your own CPU cache.
             </p>
           </div>
           <div>
             <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Uncompromising Data Privacy</h3>
             <p className="mb-6 leading-relaxed">
               Security incidents shouldn't be the cost of formatting a JSON payload. FreeTool prioritizes zero-knowledge privacy. Because executions are client-side, your confidential API tokens, secret keys, or sensitive customer data never actually leave your machine's browser memory. When you use tools like our Password Generator or JSON formatter, you are completely protected.
             </p>
             <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Comprehensive Utility Suite</h3>
             <p className="leading-relaxed">
               With over 25+ integrated utilities spanning String Manipulation, Image Compression, PDF Merging, and CSS/SVG Art Generation, FreeTool is the only bookmark you need. Our integrated dashboard syncs perfectly with your workflow, allowing fast switching between tools without losing context.
             </p>
           </div>
        </div>
      </section>

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
               <a 
                 href="/contact"
                 className="inline-flex items-center gap-4 px-12 py-6 bg-brand-500 text-white rounded-2xl font-black text-2xl hover:scale-105 active:scale-95 transition-all shadow-2xl"
               >
                 Request a Tool
                 <Plus className="w-8 h-8" />
               </a>
            </div>
         </div>
      </section>
    </div>
  );
};
