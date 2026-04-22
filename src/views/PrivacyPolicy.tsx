'use client';

import { Shield, Eye, Lock, Globe, Bell, UserCheck } from 'lucide-react';
import { BackgroundEffects } from '@/components/ui/BackgroundEffects';

export const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-[#050505] py-16 px-4 sm:px-6 lg:px-8">
      <BackgroundEffects />
      
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16 px-4 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 mb-8 border border-brand-500/20">
            <Shield className="w-10 h-10" />
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-4">
            Privacy Policy
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            We value your privacy like our own. Our tools are designed to keep your data secure, private, and under your control.
          </p>
          <p className="mt-6 text-sm font-semibold text-gray-400 dark:text-gray-500 flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Last updated: April 8, 2026
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-[#0A0A0A] rounded-[40px] p-8 md:p-16 border border-gray-100 dark:border-white/5 shadow-inner">
          <div className="space-y-16">
            {/* Section 1 */}
            <section className="relative">
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-white/5 shadow-sm flex items-center justify-center flex-shrink-0 border border-gray-100 dark:border-white/5">
                  <Eye className="w-6 h-6 text-brand-500" />
                </div>
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">1. Data Transparency</h2>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-lg">
                    FreeTool.shop is built on the principle of "Client-Side Processing." For the vast majority of our tools, your data NEVER leaves your browser.
                  </p>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <li className="flex items-center gap-3 p-4 bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">In-browser encryption</span>
                    </li>
                    <li className="flex items-center gap-3 p-4 bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">No input logging</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 2 */}
            <section className="relative">
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-white/5 shadow-sm flex items-center justify-center flex-shrink-0 border border-gray-100 dark:border-white/5">
                  <Globe className="w-6 h-6 text-brand-500" />
                </div>
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">2. Analytics & Advertising</h2>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-lg">
                    To keep our tools free, we use industry-standard services. These third parties may use cookies to improve your experience.
                  </p>
                  <div className="space-y-4 pt-4">
                    <div className="p-6 bg-brand-50/50 dark:bg-brand-900/5 rounded-3xl border border-brand-100 dark:border-brand-900/20">
                      <h4 className="font-bold text-brand-700 dark:text-brand-400 mb-2">Google AdSense</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Google uses cookies to serve ads based on your visit to this site and other sites on the Internet. You may opt out by visiting the <a href="https://adssettings.google.com/" target="_blank" className="underline font-semibold hover:text-brand-600">Google Ad Settings</a>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section className="relative">
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-white/5 shadow-sm flex items-center justify-center flex-shrink-0 border border-gray-100 dark:border-white/5">
                  <Lock className="w-6 h-6 text-brand-500" />
                </div>
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">3. Information Security</h2>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-lg">
                    We implement various security measures to maintain the safety of your information. This includes SSL encryption and regular security updates.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section className="relative">
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-white/5 shadow-sm flex items-center justify-center flex-shrink-0 border border-gray-100 dark:border-white/5">
                  <UserCheck className="w-6 h-6 text-brand-500" />
                </div>
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">4. Your Rights</h2>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-lg">
                    Depending on your location (e.g., EU GDPR), you have specific rights over your data, including the right to access, correct, or delete any limited personal data we may hold.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section className="relative">
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-white/5 shadow-sm flex items-center justify-center flex-shrink-0 border border-gray-100 dark:border-white/5">
                  <Bell className="w-6 h-6 text-brand-500" />
                </div>
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">5. Policy Updates</h2>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-lg">
                    We may update this policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
                  </p>
                </div>
              </div>
            </section>
          </div>

          <div className="mt-20 pt-16 border-t border-gray-200 dark:border-white/5 text-center">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Questions about your data?</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-lg mx-auto">
              If you have any questions regarding this privacy policy or our treatment of your personal data, please don't hesitate to reach out.
            </p>
            <a 
              href="mailto:tthakare73@gmail.com" 
              className="inline-flex items-center gap-2 px-8 py-4 bg-brand-500 text-white font-bold rounded-2xl hover:bg-brand-600 transition-colors shadow-xl shadow-brand-500/20"
            >
              Contact Privacy Team
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

const CheckCircle2 = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
    <path d="m9 12 2 2 4-4"/>
  </svg>
);
