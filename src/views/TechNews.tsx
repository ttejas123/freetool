'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SEOHelmet } from '../components/SEOHelmet';
import { 
  Newspaper, 
  Clock, 
  Globe, 
  RefreshCcw,
  Search,
  TrendingUp,
  MessageSquare,
  ArrowRight
} from 'lucide-react';
import { BackgroundEffects } from '@/components/ui/BackgroundEffects';

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  content: string;
  author: string;
  thumbnail: string;
}

const FEEDS = [
  { name: 'Hacker News', url: 'https://news.ycombinator.com/rss' },
  { name: 'Dev.to', url: 'https://dev.to/feed' },
  { name: 'TechCrunch', url: 'https://techcrunch.com/feed/' }
];

export const TechNews = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeed, setSelectedFeed] = useState(FEEDS[0]);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchNews = async (feedUrl: string) => {
    setLoading(true);
    try {
      const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`);
      const data = await response.json();
      if (data.status === 'ok') {
        setNews(data.items);
      }
    } catch (error) {
      console.error('Failed to fetch news', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews(selectedFeed.url);
  }, [selectedFeed]);

  const filteredNews = news.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-transparent transition-colors duration-300">
      <SEOHelmet 
        title="Engineering & Tech News Feed" 
        description="Stay updated with the latest in tech, engineering, and startups. Real-time RSS feed integration."
      />
      {/* Header Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 text-brand-500 text-[10px] font-black mb-8 border border-brand-500/20 uppercase tracking-[0.2em]">
              <Newspaper className="w-4 h-4" />
              <span>Real-Time Tech Digests</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-gray-900 dark:text-white mb-8">
              Tech <span className="text-gradient">News</span>
            </h1>
            <p className="text-xl text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
              The latest updates from the engineering world, curated from top developer hubs.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Control Bar */}
      <section className="container mx-auto px-6 mb-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-4 rounded-[2rem] glass border border-gray-100 dark:border-white/5">
          <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-white/5 rounded-2xl w-full md:w-auto overflow-x-auto no-scrollbar">
            {FEEDS.map((feed) => (
              <button
                key={feed.name}
                onClick={() => setSelectedFeed(feed)}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                  selectedFeed.name === feed.name 
                    ? 'bg-white dark:bg-white/10 text-brand-500 shadow-sm' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {feed.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <label htmlFor="news-search" className="sr-only">Search news articles</label>
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                id="news-search"
                type="text" 
                placeholder="Search news..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-gray-100 dark:bg-white/5 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none dark:text-white"
              />
            </div>
            <button 
              onClick={() => fetchNews(selectedFeed.url)}
              className="p-3 bg-brand-500/10 text-brand-500 rounded-xl hover:bg-brand-500/20 transition-all border border-brand-500/10"
              title="Refresh Feed"
              aria-label="Refresh technology feed"
            >
              <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </section>

      {/* News Feed */}
      <section className="container mx-auto px-6 pb-40">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-[280px] rounded-[1.5rem] bg-gray-50 dark:bg-white/5 animate-pulse" />
              ))}
            </motion.div>
          ) : (
            <motion.div 
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {filteredNews.map((item, i) => (
                <motion.article
                  key={item.link}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group relative flex flex-col p-8 rounded-[1.5rem] bg-white dark:bg-[#0A0A0A] border border-gray-100 dark:border-white/5 hover:border-brand-500/50 transition-all hover:shadow-2xl hover:shadow-brand-500/10"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-brand-500/10 text-brand-500 border border-brand-500/10">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{selectedFeed.name}</span>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 line-clamp-3 group-hover:text-brand-500 transition-colors cursor-pointer" onClick={() => window.open(item.link, '_blank')}>
                    {item.title}
                  </h3>

                  <div className="flex-1 overflow-hidden mb-8">
                     <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                        {item.content.replace(/<[^>]*>?/gm, '').substring(0, 120)}...
                     </p>
                  </div>

                  <div className="pt-6 border-t border-gray-50 dark:border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-[11px] font-bold text-gray-400">
                      <div className="flex items-center gap-1.5 ring-1 ring-gray-100 dark:ring-white/5 px-2 py-1 rounded-md">
                        <Clock className="w-3 h-3" />
                        {new Date(item.pubDate).toLocaleDateString()}
                      </div>
                      {item.author && (
                        <div className="hidden sm:flex items-center gap-1.5 ring-1 ring-gray-100 dark:ring-white/5 px-2 py-1 rounded-md">
                          <MessageSquare className="w-3 h-3 text-brand-500" />
                          {item.author.substring(0, 15)}
                        </div>
                      )}
                    </div>
                    <a 
                      href={item.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-3 bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-brand-500 hover:bg-brand-500/10 rounded-xl transition-all group/link shadow-sm"
                      aria-label={`Read full article: ${item.title}`}
                    >
                      <ArrowRight className="w-5 h-5 transition-transform group-hover/link:translate-x-0.5" />
                    </a>
                  </div>
                </motion.article>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {!loading && filteredNews.length === 0 && (
          <div className="py-40 text-center">
            <Globe className="w-16 h-16 text-gray-200 dark:text-white/5 mx-auto mb-6" />
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">No news items found.</h3>
            <p className="text-gray-500 dark:text-gray-400">Try adjusting your search or switching feeds.</p>
          </div>
        )}
      </section>
    </div>
  );
};
