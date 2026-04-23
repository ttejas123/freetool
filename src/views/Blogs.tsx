'use client';

import { motion } from 'framer-motion';
import { SEOHelmet } from '../components/SEOHelmet';
import { 
  ArrowRight, 
  Clock, 
  User, 
  BookOpen,
  Sparkles,
  Zap,
  Shield,
  Code
} from 'lucide-react';

const IconMap: Record<string, any> = {
  Zap,
  Shield,
  Code
};

import { BackgroundEffects } from '@/components/ui/BackgroundEffects';

import { blogPosts } from '@/data/blogs';


export const Blogs = () => {
  return (
    <div className="min-h-screen bg-transparent transition-colors duration-300">
      <SEOHelmet 
        title="Engineering Blogs & Guides" 
        description="Deep dives into developer productivity, security, and the FreeTool platform."
      />
      {/* Hero Section */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 text-brand-500 text-[10px] font-black mb-8 border border-brand-500/20 uppercase tracking-[0.2em]">
              <BookOpen className="w-4 h-4" />
              <span>Expert Guides & Updates</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-gray-900 dark:text-white mb-8">
              FreeTool <span className="text-gradient">Blogs</span>
            </h1>
            <p className="text-xl text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
              Explore professional insights on modern engineering, productivity, and web security.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Blog Listing */}
      <section className="container mx-auto px-6 pb-40">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {blogPosts.map((post, i) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group flex flex-col p-8 rounded-[1.5rem] bg-white dark:bg-[#0A0A0A] border border-gray-100 dark:border-white/5 hover:border-brand-500/50 transition-all hover:shadow-2xl hover:shadow-brand-500/10"
            >
              <div className="flex items-center justify-between mb-8">
                <div className={`w-12 h-12 flex items-center justify-center rounded-2xl ${post.color} border border-transparent transition-transform group-hover:scale-110`}>
                  {IconMap[post.icon] ? (
                    (() => {
                      const Icon = IconMap[post.icon];
                      return <Icon className="w-6 h-6" />;
                    })()
                  ) : (
                    <Zap className="w-6 h-6" />
                  )}
                </div>
                <div className="px-3 py-1 rounded-full bg-gray-50 dark:bg-white/5 text-[10px] font-black text-gray-400 uppercase tracking-widest border border-gray-200 dark:border-white/10">
                  {post.category}
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-brand-500 transition-colors">
                {post.title}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-8 flex-1 leading-relaxed">
                {post.excerpt}
              </p>

              <div className="pt-8 border-t border-gray-50 dark:border-white/5 space-y-4">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5" />
                    <span className="font-bold">{post.author}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{post.readTime}</span>
                  </div>
                </div>
                <a 
                  href={`/blogs/${post.id}`}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-gray-50 dark:bg-white/5 hover:bg-brand-500 hover:text-white dark:text-gray-300 rounded-2xl text-sm font-bold transition-all group/btn"
                >
                  Read Full Post
                  <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                </a>
              </div>
            </motion.article>
          ))}
          
          {/* Newsletter Subscribe Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-10 rounded-[1.5rem] bg-gray-900 dark:bg-white text-white dark:text-black flex flex-col justify-center items-center text-center relative overflow-hidden group shadow-2xl"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/20 blur-[60px] translate-x-1/2 -translate-y-1/2" />
            <div className="w-16 h-16 rounded-2xl bg-brand-500 flex items-center justify-center mb-8 shadow-lg group-hover:scale-110 transition-transform">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-3xl font-black tracking-tighter mb-4 leading-none">
              Stay in the loop.
            </h3>
            <p className="text-white/50 dark:text-black/50 text-sm mb-10 font-medium">
                Get monthly digests of new tools, engineering guides, and security updates.
            </p>
            <div className="w-full space-y-3">
              <label htmlFor="newsletter-email" className="sr-only">Email address for monthly digest</label>
              <input 
                id="newsletter-email"
                type="email" 
                placeholder="your@email.com"
                className="w-full px-6 py-4 bg-white/10 dark:bg-black/5 border border-white/10 dark:border-black/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all placeholder:text-white/30 dark:placeholder:text-black/30"
              />
              <button className="w-full py-4 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl font-black text-sm transition-all shadow-xl active:scale-95">
                Subscribe Now
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};
