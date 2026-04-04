import { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Command, ArrowRight, Zap, Star, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toolRegistry, type RegistryTool } from '@/tools/toolRegistry';

export const CommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const filteredTools = useMemo(() => {
    if (!query) return toolRegistry.slice(0, 5);
    const term = query.toLowerCase();
    return toolRegistry.filter(t => 
      t.name.toLowerCase().includes(term) || 
      t.category.toLowerCase().includes(term) ||
      t.tags.some(tag => tag.toLowerCase().includes(term))
    ).slice(0, 8);
  }, [query, toolRegistry]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredTools.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredTools.length) % filteredTools.length);
    } else if (e.key === 'Enter') {
      if (filteredTools[selectedIndex]) {
        handleSelect(filteredTools[selectedIndex]);
      }
    }
  };

  const handleSelect = (tool: RegistryTool) => {
    navigate(`/${tool.path}`);
    setIsOpen(false);
  };


  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm dark:bg-black/80"
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-[#0A0A0A] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden"
              onKeyDown={handleKeyDown}
            >
              <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-100 dark:border-white/10">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  ref={inputRef}
                  placeholder="What tool do you need? (Try 'JSON' or 'PDF')"
                  className="flex-1 bg-transparent border-none outline-none text-lg text-gray-900 dark:text-gray-100 placeholder-gray-500"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                   Esc
                </div>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-2">
                {filteredTools.length > 0 ? (
                  <div className="space-y-1">
                    <div className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center justify-between">
                       Tools & Utilities
                       {!query && <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-500" /> Popular</span>}
                    </div>
                    {filteredTools.map((tool: RegistryTool, index: number) => (
                      <button
                        key={tool.id}
                        onClick={() => handleSelect(tool)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`w-full flex items-center justify-between p-4 rounded-xl transition-all group ${
                          index === selectedIndex ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' : 'hover:bg-gray-50 dark:hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                           <div className={`w-10 h-10 flex items-center justify-center rounded-lg ${
                              index === selectedIndex ? 'bg-white/20' : 'bg-gray-100 dark:bg-white/5 text-gray-400'
                           } group-hover:scale-110 transition-transform`}>
                             <tool.icon className="w-5 h-5" />
                           </div>
                           <div className="text-left">
                              <div className="font-bold">{tool.name}</div>
                              <div className={`text-xs ${index === selectedIndex ? 'text-white/70' : 'text-gray-500'}`}>{tool.category}</div>
                           </div>
                        </div>
                        {index === selectedIndex && (
                          <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest bg-white/20 px-2 py-1 rounded">
                             <Command className="w-3 h-3" />
                             ENTER
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="py-20 text-center">
                     <Search className="w-12 h-12 text-gray-200 dark:text-white/5 mx-auto mb-4" />
                     <p className="text-gray-500 mb-2">No tools found for "{query}"</p>
                     <p className="text-sm text-gray-400">Try searching for broader terms or featured categories.</p>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 bg-gray-50 dark:bg-black/20 border-t border-gray-100 dark:border-white/10 flex items-center justify-between">
                 <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                       <Zap className="w-3 h-3 text-amber-500" /> Use Cases:
                    </div>
                    {['Developers', 'Students', 'Content Creators'].map(tag => (
                      <button key={tag} className="text-[10px] font-bold text-gray-500 hover:text-brand-500 uppercase tracking-widest transition-colors">
                        {tag}
                      </button>
                    ))}
                 </div>
                 <div className="hidden sm:flex items-center gap-4 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                    <span className="flex items-center gap-1"><ArrowRight className="w-3 h-3" /> Select</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Recent</span>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
