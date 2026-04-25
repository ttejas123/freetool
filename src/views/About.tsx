'use client';

import { Rocket, Shield, Zap, Heart, Globe, Cpu, Plus } from 'lucide-react';

export const About = () => {
  return (
    <div className="min-h-screen bg-transparent">
      
      {/* Hero Section */}
      <section className="relative pt-50 pb-50 overflow-hidden">
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-brand-500/10 dark:bg-brand-500/5 rounded-full blur-[120px] animate-pulse-slow"></div>
          <div className="absolute top-[20%] -right-[10%] w-[35%] h-[35%] bg-accent-purple/10 dark:bg-accent-purple/5 rounded-full blur-[100px] animate-float-slow"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-50 dark:bg-brand-900/10 border border-brand-100 dark:border-brand-900/20 text-brand-600 dark:text-brand-400 text-sm font-medium mb-8 animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
            </span>
            Our Mission
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 dark:text-white mb-8 tracking-tight">
            Empowering Developers <br />
            <span className="text-gradient">with Better Tools.</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
            FreeTool.shop was built with a simple goal: to provide high-quality, privacy-first, and lightning-fast tools for developers, completely for free.
          </p>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 bg-gray-50 dark:bg-[#080808]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">Core Values</h2>
            <p className="text-gray-600 dark:text-gray-400">What drives us forward every day.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-[#0D0D0D] p-10 rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm hover:shadow-xl transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <Zap className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Speed is Everything</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Developer tools should be fast. Every pixel and line of code is optimized to ensure instant results, even on slower connections.
              </p>
            </div>

            <div className="bg-white dark:bg-[#0D0D0D] p-10 rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm hover:shadow-xl transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <Shield className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Privacy by Default</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Most tools here process your data entirely in the browser. We don't store your inputs or use them to train models. Your data stays yours.
              </p>
            </div>

            <div className="bg-white dark:bg-[#0D0D0D] p-10 rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm hover:shadow-xl transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-pink-100 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <Heart className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Open & Free</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                We believe great tools should be accessible to everyone. Our platform will always provide free access to essential developer utilities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats / Story Section */}
      <section className="py-24 border-t border-gray-100 dark:border-white/5 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">Our Story</h2>
              <div className="space-y-6 text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                <p>
                  FreeTool.shop started as a small personal project by Tejas Thakare to automate repetitive tasks. It quickly grew into a comprehensive hub for developers who value speed and simplicity.
                </p>
                <p>
                  Today, FreeTool.shop serves thousands of developers every month, helping them format code, generate assets, and debug faster. We are constantly adding new tools based on community feedback.
                </p>
                <p className="font-medium text-gray-900 dark:text-white italic">
                  "Built by a developer, for developers. No fluff, just tools that work."
                </p>
              </div>
              <div className="mt-10 flex gap-6">
                <div className="flex flex-col">
                  <span className="text-3xl font-bold text-brand-500">50+</span>
                  <span className="text-sm text-gray-500">Powerful Tools</span>
                </div>
                <div className="w-px h-12 bg-gray-200 dark:bg-white/10"></div>
                <div className="flex flex-col">
                  <span className="text-3xl font-bold text-brand-500">100%</span>
                  <span className="text-sm text-gray-500">Client-Side Logic</span>
                </div>
                <div className="w-px h-12 bg-gray-200 dark:bg-white/10"></div>
                <div className="flex flex-col">
                  <span className="text-3xl font-bold text-brand-500">Fast</span>
                  <span className="text-sm text-gray-500">Vite Powered</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute -inset-10 bg-gradient-to-tr from-brand-500/20 to-accent-purple/20 rounded-full blur-3xl opacity-50"></div>
              <div className="relative bg-white dark:bg-[#0D0D0D] border border-gray-200 dark:border-white/5 rounded-[40px] p-8 shadow-2xl overflow-hidden aspect-video flex items-center justify-center">
                <div className="grid grid-cols-3 gap-6 animate-float">
                  <Cpu className="w-16 h-16 text-brand-500/20" />
                  <Globe className="w-16 h-16 text-accent-purple/20" />
                  <Rocket className="w-16 h-16 text-brand-500/20" />
                  <Zap className="w-16 h-16 text-accent-purple/20" />
                  <Shield className="w-16 h-16 text-brand-500/20" />
                  <Heart className="w-16 h-16 text-accent-purple/20" />
                </div>
              </div>
            </div>
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
