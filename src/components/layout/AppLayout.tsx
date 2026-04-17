import { useEffect, useState, useMemo } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toolRegistry } from '@/tools/toolRegistry';
import { ErrorBoundary } from '../ErrorBoundary';
import { useAppStore } from '../../store';
import { 
  Moon, 
  Sun, 
  Search, 
  Plus, 
  CheckCircle2, 
  Menu, 
  X, 
  Github, 
  Twitter, 
  Eye, 
  Compass,
  ChevronDown,
  LayoutGrid,
  Newspaper,
  Zap,
  Info,
  Mail
} from 'lucide-react';
import { ToastContainer } from '../ui/Toast';
import { trackPageView } from '@/lib/analytics';
import { CookieConsent } from '../ui/CookieConsent';
import { getCachedMetrics } from '@/lib/toolStats';
import { CommandPalette } from '../ui/CommandPalette';
import { CursorGlow } from '../ui/CursorGlow';
import { RichToolDescription } from '../ui/RichToolDescription';

const getCategoryColor = (category: string) => {
  const cat = category.toLowerCase();
  if (cat.includes('dev')) return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
  if (cat.includes('ai')) return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
  if (cat.includes('media')) return 'bg-pink-500/10 text-pink-500 border-pink-500/20';
  if (cat.includes('security')) return 'bg-green-500/10 text-green-500 border-green-500/20';
  return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
};

import { getSearchResults, escapeRegex } from '@/utils/search';

export const AppLayout = () => {
  const { theme, toggleTheme } = useAppStore();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [navSearch, setNavSearch] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const term = navSearch.trim();
    const url = term 
      ? `/?search=${encodeURIComponent(term)}#browse` 
      : `/#browse`;
    
    setShowSearchDropdown(false);
    setNavSearch('');
    window.location.href = url;
  };

  const searchResults = useMemo(() => {
    const term = navSearch.trim();
    const results = getSearchResults(term, toolRegistry);
    if (!term) return results.slice(0, 10);
    return results;
  }, [navSearch]);

  const highlightMatch = (text: string, term: string) => {
    if (!term) return text;
    const parts = text.split(new RegExp(`(${escapeRegex(term)})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === term.toLowerCase() ? (
            <mark key={i} className="bg-amber-400/30 text-amber-900 dark:text-amber-200 rounded px-0.5">{part}</mark>
          ) : part
        )}
      </span>
    );
  };

  const metrics = useMemo(() => getCachedMetrics(), []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (consent === 'granted') {
      trackPageView(location.pathname);
    }

    const pathPart = location.pathname.substring(1);
    const matchedToolPath = toolRegistry.find(t => t.path === pathPart);
    if (matchedToolPath) {
      try {
        const recentStr = localStorage.getItem('recentTools');
        const recent = recentStr ? JSON.parse(recentStr) : [];
        const newRecent = [matchedToolPath.id, ...recent.filter((id: string) => id !== matchedToolPath.id)].slice(0, 4);
        localStorage.setItem('recentTools', JSON.stringify(newRecent));
      } catch (e) {
        // ignore storage errors
      }
    }
  }, [location.pathname]);

  const currentMatchedTool = useMemo(() => {
    const pathPart = location.pathname.substring(1);
    return toolRegistry.find(t => t.path === pathPart);
  }, [location.pathname]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSearchDropdown(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300 bg-white dark:bg-[#050505]">
      {/* Premium Navbar */}
      <header 
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          isScrolled ? 'py-3 glass shadow-sm' : 'py-5 bg-transparent'
        }`}
      >
        <div className="container mx-auto px-6 flex items-center justify-between gap-8">
          <div className="flex items-center gap-10">
            <a href="/" className="flex items-center gap-2.5 group">
              <div className="relative flex items-center justify-center w-9 h-9">
                 <img src="/favicon.png" alt="Logo" className="w-9 h-9" />
              </div>
              <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                Free<span className="text-gradient">Tool</span>
              </span>
            </a>
            
            <nav className="hidden lg:flex items-center gap-10 text-[14px] font-bold">
              <a href="/" className="text-gray-900 dark:text-white hover:text-brand-500 transition-colors">
                Tools
              </a>
              
              {/* Resources Dropdown */}
              <div className="relative group/dropdown">
                <button className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-brand-500 transition-colors py-2">
                  Resources
                  <ChevronDown className="w-4 h-4 group-hover/dropdown:rotate-180 transition-transform duration-300" />
                </button>
                
                <div className="absolute top-full -left-4 w-64 pt-4 opacity-0 scale-95 group-hover/dropdown:opacity-100 group-hover/dropdown:scale-100 transition-all duration-200 pointer-events-none group-hover/dropdown:pointer-events-auto z-[100]">
                  <div className="bg-white dark:bg-[#0A0A0A] border border-gray-100 dark:border-white/10 rounded-[2rem] shadow-2xl p-4 overflow-hidden">
                    {[
                      { name: 'Latest Blogs', desc: 'Expert guides & updates', icon: LayoutGrid, path: '/blogs' },
                      { name: 'Tech News', desc: 'Daily developer digests', icon: Newspaper, path: '/tech-news' },
                      { name: 'Product Scope', desc: 'Roadmap & upcoming', icon: Zap, path: '/#upcoming' },
                    ].map((item) => (
                      <a 
                        key={item.name}
                        href={item.path}
                        className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all group/item"
                      >
                        <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-white/5 text-gray-400 group-hover/item:bg-brand-500 group-hover/item:text-white transition-all">
                          <item.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900 dark:text-white">{item.name}</div>
                          <div className="text-[10px] text-gray-500 dark:text-gray-400">{item.desc}</div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              <a href="/about" className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-brand-500 transition-colors">
                <Info className="w-4 h-4" />
                About
              </a>
              
              <a href="/contact" className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-brand-500 transition-colors">
                <Mail className="w-4 h-4" />
                Support
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <form onSubmit={handleSearch} className="relative hidden md:block">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search tools..." 
                value={navSearch}
                onChange={(e) => {
                  setNavSearch(e.target.value);
                  setShowSearchDropdown(true);
                }}
                onFocus={() => setShowSearchDropdown(true)}
                className="w-48 lg:w-72 pl-10 pr-4 py-2 bg-gray-100/50 dark:bg-white/5 border border-transparent dark:border-white/5 rounded-full text-sm text-gray-900 dark:text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:bg-white dark:focus:bg-black/50 transition-all duration-200"
               />

              {/* Search Results Dropdown */}
              <AnimatePresence>
                {showSearchDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowSearchDropdown(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-full mt-3 right-0 w-[400px] glass border border-gray-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden z-20"
                    >
                      <div className="p-2 max-h-[450px] overflow-y-auto custom-scrollbar">
                        {searchResults.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {searchResults.map((result) => {
                              const { tool, matchField, matchSnippet } = result;
                              const stats = metrics[tool.id] || { views: 0 };
                              const catClass = getCategoryColor(tool.category);
                              return (
                                <button
                                  key={tool.id}
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    window.location.href = `/${tool.path}`;
                                    setShowSearchDropdown(false);
                                  }}
                                  className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-100 dark:hover:bg-white/5 transition-all text-left group"
                                >
                                  <div className={`w-10 h-10 flex items-center justify-center rounded-xl ${catClass.split(' ')[0]} ${catClass.split(' ')[1]} border ${catClass.split(' ')[2]}`}>
                                    <tool.icon className="w-5 h-5" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 mb-0.5">
                                      <span className="font-bold text-sm text-gray-900 dark:text-white truncate group-hover:text-brand-500 transition-colors">
                                        {highlightMatch(tool.name, navSearch)}
                                      </span>
                                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                        {tool.category}
                                      </span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                      {matchField && (
                                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 italic">
                                          <span className="font-bold uppercase tracking-wider bg-black/5 dark:bg-white/5 px-1 rounded">
                                            {matchField}
                                          </span>
                                          <span className="truncate">
                                            {highlightMatch(matchSnippet, navSearch)}
                                          </span>
                                        </div>
                                      )}
                                      <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-medium">
                                          <Eye className="w-3 h-3" />
                                          {stats.views.toLocaleString()} views
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="py-8 px-4 text-center">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gray-100 dark:bg-white/5 mb-3 text-gray-400">
                              <Search className="w-6 h-6" />
                            </div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">No tools found</p>
                            <p className="text-xs text-gray-500 mt-1">Try a different search term</p>
                          </div>
                        )}
                        
                        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-white/5 px-2 pb-1">
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              handleSearch();
                            }}
                            className="w-full py-2 text-xs font-bold text-brand-500 hover:bg-brand-500/10 rounded-xl transition-all"
                          >
                            {navSearch.trim() ? `View all results for "${navSearch}"` : 'View all tools'}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </form>

            <div className="flex items-center gap-2 border-l border-gray-200 dark:border-white/10 pl-4 ml-2">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
                aria-label="Toggle Theme"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              
              <a 
                href="/contact" 
                className="hidden sm:flex items-center gap-2 px-5 py-2 bg-gray-900 dark:bg-white text-white dark:text-black rounded-full text-sm font-semibold hover:opacity-90 transition-all shadow-md active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Submit
              </a>

              <button 
                className="lg:hidden p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="lg:hidden absolute top-full left-0 w-full glass border-t border-gray-200 dark:border-white/10 px-6 py-8 flex flex-col gap-6 shadow-2xl"
            >
              <nav className="flex flex-col gap-4 text-xl font-bold">
                <a href="/" onClick={() => setIsMobileMenuOpen(false)}>All Tools</a>
                <a href="/#upcoming" onClick={() => setIsMobileMenuOpen(false)}>Product Roadmap</a>
                <a href="/blogs" onClick={() => setIsMobileMenuOpen(false)}>Blogs</a>
                <a href="/tech-news" onClick={() => setIsMobileMenuOpen(false)}>Tech News</a>
                <a href="/about" onClick={() => setIsMobileMenuOpen(false)}>About Us</a>
                <a href="/contact" onClick={() => setIsMobileMenuOpen(false)}>Contact Support</a>
              </nav>
              <div className="pt-6 border-t border-gray-200 dark:border-white/10">
                <div className="flex items-center gap-4 text-gray-500">
                   <Twitter className="w-5 h-5" />
                   <Github className="w-5 h-5" onClick={()=> window.open('https://www.github.com/ttejas123')} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        <ErrorBoundary>
          <Outlet />
          {currentMatchedTool && <RichToolDescription tool={currentMatchedTool} />}
        </ErrorBoundary>
      </main>

      {/* Premium Footer */}
      <footer className="bg-gray-50 dark:bg-[#0A0A0A] border-t border-gray-200 dark:border-white/5 pt-20 pb-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <a href="/" className="flex items-center gap-2.5 mb-6">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-500 shadow-md">
                   <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-bold tracking-tight dark:text-white">
                  Free<span className="text-gradient">Tool</span>
                </span>
              </a>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-8 leading-relaxed">
                The most comprehensive directory of high-performance developer tools. Built for speed, privacy, and productivity.
              </p>
              <div className="flex items-center gap-4">
                <a href="#" className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 hover:text-brand-500 transition-all">
                  <Twitter className="w-4 h-4" />
                </a>
                <a href="https://www.github.com/ttejas123" className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 hover:text-brand-500 transition-all">
                  <Github className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-6 uppercase text-xs tracking-widest">Platform</h4>
              <ul className="flex flex-col gap-4 text-sm text-gray-500 dark:text-gray-400">
                <li><a href="/" className="hover:text-brand-500 transition-colors">Browse Tools</a></li>
                <li><a href="/?tab=featured" className="hover:text-brand-500 transition-colors">Featured</a></li>
                <li><a href="/?tab=top" className="hover:text-brand-500 transition-colors">Trending</a></li>
                <li><a href="/about" className="hover:text-brand-500 transition-colors">About Us</a></li>
                <li><a href="/contact" className="hover:text-brand-500 transition-colors">Submit Tool</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-6 uppercase text-xs tracking-widest">Legal</h4>
              <ul className="flex flex-col gap-4 text-sm text-gray-500 dark:text-gray-400">
                <li><a href="/privacy-policy" className="hover:text-brand-500 transition-colors">Privacy Policy</a></li>
                <li><a href="/terms" className="hover:text-brand-500 transition-colors">Terms of Service</a></li>
                <li><a href="/privacy-policy#cookies" className="hover:text-brand-500 transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-200 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-gray-500 dark:text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} FreeTool. All rights reserved.
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1.5 ring-1 ring-green-500/20 bg-green-500/10 text-green-600 dark:text-green-500 px-2.5 py-1 rounded-full text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                Systems Operational
              </span>
            </div>
          </div>
        </div>
      </footer>
      <CommandPalette />
      <ToastContainer />
      <CookieConsent />
      <CursorGlow />

      {/* Floating Discovery Button */}
      <AnimatePresence>
        {isScrolled && (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              if (location.pathname === '/') {
                document.getElementById('browse')?.scrollIntoView({ behavior: 'smooth' });
              } else {
                window.location.href = '/#browse';
              }
            }}
            className="fixed right-6 bottom-32 z-40 group flex items-center gap-3"
            aria-label="Discover Tools"
          >
            <div className="absolute right-full mr-3 py-2 px-4 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black text-xs font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
              Quick Explore
            </div>
            <div className="w-14 h-14 rounded-2xl bg-white/80 dark:bg-black/50 backdrop-blur-xl border-2 border-brand-500/50 flex items-center justify-center text-brand-500 shadow-[0_20px_50px_rgba(59,130,246,0.25)] ring-4 ring-brand-500/10 group-hover:bg-brand-500 group-hover:text-white group-hover:border-brand-500 group-hover:shadow-brand-500/40 transition-all duration-300">
              <Compass className="w-7 h-7" />
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

