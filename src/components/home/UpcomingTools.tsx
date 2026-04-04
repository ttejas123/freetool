import { motion } from 'framer-motion';
import { Sparkles, Bell, Vote, Construction } from 'lucide-react';

const upcomingTools = [
  {
    id: 'ai-code-refactor',
    name: 'AI Code Refactor',
    description: 'Instant code improvement using local LLMs. Refactor complex functions in seconds.',
    progress: 65,
    category: 'AI Tools'
  },
  {
    id: 'crypto-portfolio',
    name: 'Wealth Tracker',
    description: 'Track your assets across multiple chains with zero data collection.',
    progress: 40,
    category: 'Finance'
  },
  {
    id: 'student-planner',
    name: 'Academic OS',
    description: 'The ultimate space for students to manage courses, notes, and deadlines.',
    progress: 80,
    category: 'Student'
  }
];

export const UpcomingTools = () => {
  return (
    <section className="container mx-auto px-6 mb-32">
      <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-4">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-bold mb-4 border border-amber-500/20 uppercase tracking-widest">
            <Construction className="w-3 h-3" />
            Under Construction
          </div>
          <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4">🚀 Upcoming Tools</h2>
          <p className="text-gray-500 dark:text-gray-400">Sneak peek at what we're building next. Vote for your favorites to speed up development.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {upcomingTools.map((tool, i) => (
          <motion.div
            key={tool.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="group relative p-8 rounded-[2rem] bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 overflow-hidden"
          >
            {/* High-blur background effect */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 blur-[60px] -translate-y-1/2 translate-x-1/2 group-hover:bg-brand-500/20 transition-colors" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="px-3 py-1 rounded-lg bg-white dark:bg-white/5 text-[10px] font-bold text-gray-400 dark:text-gray-500 border border-gray-100 dark:border-white/10 uppercase tracking-widest">
                  {tool.category}
                </div>
                <div className="text-xs font-bold text-brand-500">
                  {tool.progress}% Ready
                </div>
              </div>

              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-brand-500 transition-colors">
                {tool.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                {tool.description}
              </p>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-gray-200 dark:bg-white/5 rounded-full mb-8 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  whileInView={{ width: `${tool.progress}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="h-full bg-brand-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                />
              </div>

              <div className="flex items-center gap-3">
                <button className="flex-1 py-3 px-4 bg-gray-900 dark:bg-white text-white dark:text-black rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg active:shadow-none">
                  <Bell className="w-4 h-4" />
                  Notify Me
                </button>
                <button className="w-12 h-12 flex items-center justify-center rounded-xl glass border-gray-200 dark:border-white/10 text-gray-500 hover:text-brand-500 hover:border-brand-500/50 transition-all">
                  <Vote className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* In Development Badge */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-12deg] opacity-0 group-hover:opacity-10 scale-150 pointer-events-none transition-all duration-500 text-6xl font-black text-brand-500">
              BUILDING
            </div>
          </motion.div>
        ))}
        
        {/* Submit Idea Card */}
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           transition={{ delay: 0.3 }}
           className="p-8 rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-white/10 flex flex-col items-center justify-center text-center group hover:border-brand-500/50 transition-colors"
        >
           <div className="w-16 h-16 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
             <Sparkles className="w-8 h-8" />
           </div>
           <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Have an Idea?</h3>
           <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 max-w-[200px]">We build what our community requests. Suggest a tool now.</p>
           <button className="px-6 py-3 bg-brand-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/20 hover:scale-105 active:scale-95 transition-all">
             Submit Request
           </button>
        </motion.div>
      </div>
    </section>
  );
};
