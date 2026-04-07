import { Helmet } from 'react-helmet-async';
import { FileText, ShieldCheck, Scale, AlertCircle } from 'lucide-react';

export const Terms = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050505] py-12 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>Terms of Service - FreeTool.shop</title>
        <meta name="description" content="Terms of Service for FreeTool.shop - Free Developer Tools" />
      </Helmet>

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 mb-6">
            <Scale className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight sm:text-5xl mb-4">
            Terms of Service
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Please read these terms carefully before using our services. By using FreeTool.shop, you agree to these terms.
          </p>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-500">
            Last updated: April 8, 2026
          </p>
        </div>

        <div className="bg-white dark:bg-[#0A0A0A] rounded-3xl p-8 md:p-12 shadow-sm border border-gray-200 dark:border-white/5 space-y-12">
          {/* Section 1: Acceptance */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck className="w-6 h-6 text-brand-500" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">1. Acceptance of Terms</h2>
            </div>
            <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-400">
              <p>
                By accessing or using FreeTool.shop (the "Service"), you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you may not use our services.
              </p>
            </div>
          </section>

          {/* Section 2: Description of Service */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-brand-500" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">2. Description of Service</h2>
            </div>
            <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-400">
              <p>
                FreeTool.shop provides a collection of online tools for developers, including but not limited to converters, generators, and formatters. These tools are provided "as is" and are intended for general use.
              </p>
            </div>
          </section>

          {/* Section 3: Usage Guidelines */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-brand-500" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">3. Usage Guidelines</h2>
            </div>
            <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-400">
              <ul className="list-disc pl-5 space-y-2">
                <li>You agree not to use the Service for any unlawful purpose.</li>
                <li>You may not attempt to interfere with the proper functioning of the Service.</li>
                <li>You are responsible for any data you process through our tools.</li>
                <li>Automated use of the Service (e.g., scraping or high-frequency API calls) is prohibited without prior consent.</li>
              </ul>
            </div>
          </section>

          {/* Section 4: Privacy */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck className="w-6 h-6 text-brand-500" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">4. Privacy</h2>
            </div>
            <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-400">
              <p>
                Your privacy is important to us. Please review our <a href="/privacy-policy" className="text-brand-600 dark:text-brand-400 hover:underline">Privacy Policy</a> to understand how we collect and use information.
              </p>
            </div>
          </section>

          {/* Section 5: Intellectual Property */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Scale className="w-6 h-6 text-brand-500" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">5. Intellectual Property</h2>
            </div>
            <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-400">
              <p>
                The Service and its original content, features, and functionality are and will remain the exclusive property of FreeTool.shop. Your use of the tools does not transfer any ownership rights to you.
              </p>
            </div>
          </section>

          {/* Section 6: Disclaimer of Warranties */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-brand-500" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">6. Disclaimer of Warranties</h2>
            </div>
            <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-400">
              <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/20 rounded-xl p-4 text-sm">
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE." WE DISCLAIM ALL WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
              </div>
            </div>
          </section>

          {/* Section 7: Limitation of Liability */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Scale className="w-6 h-6 text-brand-500" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">7. Limitation of Liability</h2>
            </div>
            <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-400">
              <p>
                To the maximum extent permitted by law, FreeTool.shop shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues.
              </p>
            </div>
          </section>

          {/* Section 8: Changes to Terms */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-brand-500" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">8. Changes to Terms</h2>
            </div>
            <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-400">
              <p>
                We reserve the right to modify or replace these terms at any time. We will provide notice of any significant changes by posting the new terms on this page.
              </p>
            </div>
          </section>

          {/* Contact Section */}
          <div className="pt-12 border-t border-gray-200 dark:border-white/5 text-center">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Have questions?</h3>
            <p className="text-gray-600 dark:text-gray-400">
              If you have any questions about these Terms, please <a href="/contact" className="text-brand-600 dark:text-brand-400 font-medium hover:underline">contact us</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
