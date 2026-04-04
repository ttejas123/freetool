import { useEffect } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { toolRegistry } from '@/tools/toolRegistry';
import { ErrorBoundary } from '../ErrorBoundary';
import { useAppStore } from '../../store';
import { Moon, Sun, Search, Plus, Coffee, CheckCircle2 } from 'lucide-react';
import { ToastContainer } from '../ui/Toast';
import { trackPageView } from '@/lib/analytics';
import { CookieConsent } from '../ui/CookieConsent';
import { AdBanner } from '../AdBanner';

export const AppLayout = () => {
  const { theme, toggleTheme } = useAppStore();
  const location = useLocation();

  // Track page views on route changes
  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (consent === 'granted') {
      trackPageView(location.pathname);
    }

    const currentPath = location.pathname.substring(1);
    if (!currentPath) return; // ignore home
    
    // Check if path is a known tool
    const matchedTool = toolRegistry.find(t => t.path === currentPath);
    if (matchedTool) {
      try {
        const recentStr = localStorage.getItem('recentTools');
        const recent = recentStr ? JSON.parse(recentStr) : [];
        const newRecent = [matchedTool.id, ...recent.filter((id: string) => id !== matchedTool.id)].slice(0, 4);
        localStorage.setItem('recentTools', JSON.stringify(newRecent));
      } catch (e) {
        // ignore storage errors
      }
    }
  }, [location.pathname]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-200 relative pb-16 bg-gray-50 dark:bg-[#0A0A0A]">
      {/* Navbar implementation matching "FreeTool" design */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800/60 bg-white/80 dark:bg-[#0A0A0A]/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <a href="/" className="flex items-center gap-2 text-gray-900 dark:text-white font-bold text-xl tracking-tight">
              <div className="relative flex items-center justify-center">
                 <CheckCircle2 className="w-6 h-6 text-brand-500 fill-brand-500/20" />
              </div>
              <span>Free Tools</span>
            </a>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-500 dark:text-gray-400">
              <a href="/" className="text-gray-900 dark:text-white hover:text-brand-500 dark:hover:text-white transition">Tools</a>
              <a href="/?tab=top" className="hover:text-brand-500 dark:hover:text-white transition">Top</a>
              <a href="/?tab=featured" className="hover:text-brand-500 dark:hover:text-white transition">Featured</a>
              <a href="/?tab=recents" className="hover:text-brand-500 dark:hover:text-white transition">Recents</a>
              <a href="/?tab=bookmarks" className="hover:text-brand-500 dark:hover:text-white transition">Bookmarks</a>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <a href="/contact" className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-yellow-400/10 text-yellow-600 dark:text-yellow-500 hover:bg-yellow-400/20 transition">
              <Coffee className="w-4 h-4" />
            </a>
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded border border-gray-200 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400">
               <span>{toolRegistry.length} Tools</span>
            </div>
            <div className="relative hidden lg:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search tools..." 
                className="w-56 xl:w-64 pl-9 pr-4 py-1.5 bg-gray-100 dark:bg-[#111] border border-transparent dark:border-gray-800 rounded-lg text-sm text-gray-900 dark:text-gray-200 placeholder-gray-500 focus:outline-none focus:border-brand-500 dark:focus:border-brand-500 transition-colors"
               />
            </div>
            <a href="/contact" className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
               <Plus className="w-4 h-4" />
               Submit Tool
            </a>
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 container mx-auto px-4 py-8 flex flex-col">
        <AdBanner />
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>

      <footer className="border-t border-gray-200 dark:border-gray-800 py-6 mt-auto">
        <div className="container mx-auto px-4 flex flex-col items-center gap-4 text-sm">
          <div className="flex items-center gap-6 text-gray-500 dark:text-gray-400">
            <Link to="/privacy-policy" className="hover:text-brand-600 dark:hover:text-brand-400 transition">Privacy Policy</Link>
            <Link to="/contact" className="hover:text-brand-600 dark:hover:text-brand-400 transition">Contact Us</Link>
          </div>
          <div className="text-gray-500 dark:text-gray-400">
            Built for Developers. Fast & Secure. {new Date().getFullYear()}
          </div>
        </div>
      </footer>
      <ToastContainer />
      <CookieConsent />
    </div>
  );
};
