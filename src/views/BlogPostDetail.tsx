'use client';

import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Clock, 
  User, 
  Share2,
  Bookmark,
  Link2
} from 'lucide-react';
import { BlogPost } from '@/data/blogs';
import { SEOHelmet } from '../components/SEOHelmet';

interface BlogPostDetailProps {
  post: BlogPost;
}

export const BlogPostDetail = ({ post }: BlogPostDetailProps) => {
  return (
    <div className="min-h-screen w-full bg-transparent transition-colors duration-300 overflow-x-clip">
      <SEOHelmet 
        title={`${post.title} | FreeTool Blog`} 
        description={post.excerpt}
      />
      
      {/* Article Header */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <a 
              href="/blogs"
              className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-brand-500 transition-colors mb-12 group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              Back to Blogs
            </a>

            <div className="flex items-center gap-3 mb-8">
              <div className={`px-4 py-1.5 rounded-full ${post.color} text-[10px] font-black uppercase tracking-[0.2em] border border-current opacity-80`}>
                {post.category}
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-white/10" />
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">
                {post.date}
              </div>
            </div>

            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-gray-900 dark:text-white mb-8 leading-[1.1]">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center justify-between gap-6 pt-8 border-t border-gray-100 dark:border-white/5">
              <div className="flex items-center gap-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-500">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900 dark:text-white">{post.author}</div>
                    <div className="text-[10px] text-gray-500 uppercase font-black tracking-tighter">Author</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900 dark:text-white">{post.readTime}</div>
                    <div className="text-[10px] text-gray-500 uppercase font-black tracking-tighter">Reading Time</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button className="p-3 rounded-full bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-brand-500 hover:bg-brand-500/10 transition-all border border-transparent hover:border-brand-500/20">
                  <Share2 className="w-5 h-5" />
                </button>
                <button className="p-3 rounded-full bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-brand-500 hover:bg-brand-500/10 transition-all border border-transparent hover:border-brand-500/20">
                  <Bookmark className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Article Content */}
      <section className="container mx-auto px-6 pb-40">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="relative"
          >
            {/* Sidebar interactions */}
            <div className="hidden min-[1300px]:flex absolute -left-32 top-0 flex-col gap-6 h-full">
                 <div className="sticky top-32 flex flex-col gap-6">
                   <button 
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      // Add a toast notification here if available
                    }}
                    className="group flex flex-col items-center gap-2 text-gray-400 hover:text-brand-500 transition-colors"
                   >
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white dark:bg-[#0A0A0A] border border-gray-100 dark:border-white/5 group-hover:border-brand-500/30 group-hover:shadow-lg group-hover:shadow-brand-500/10 transition-all">
                          <Link2 className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-tighter">Copy Link</span>
                   </button>
                 </div>
            </div>

            <article className="blog-rich-text max-w-none">
              <div 
                className="blog-content"
                dangerouslySetInnerHTML={{ __html: post.content }} 
              />
            </article>

            {/* Newsletter Footer */}
            <div className="mt-24 p-12 rounded-[3rem] bg-gray-900 dark:bg-white text-white dark:text-black relative overflow-hidden group shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/20 blur-[100px] translate-x-1/3 -translate-y-1/3" />
                <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <h3 className="text-4xl font-black tracking-tighter mb-4 leading-none">
                            Did you enjoy this read?
                        </h3>
                        <p className="text-white/60 dark:text-black/60 font-medium">
                            Join 5,000+ engineers receiving our weekly digest of modern tools and architectural patterns.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <input 
                            type="email" 
                            placeholder="Enter your email"
                            className="flex-1 px-6 py-4 bg-white/10 dark:bg-black/5 border border-white/10 dark:border-black/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all placeholder:text-white/30 dark:placeholder:text-black/30"
                        />
                        <button className="px-8 py-4 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl font-black text-sm transition-all shadow-xl active:scale-95 whitespace-nowrap">
                            Subscribe
                        </button>
                    </div>
                </div>
            </div>
          </motion.div>
        </div>
      </section>
      

    </div>
  );
};
