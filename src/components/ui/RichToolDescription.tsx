import { type RegistryTool } from '@/tools/toolRegistry';
import { 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  Settings2,
  Lock,
  Cpu
} from 'lucide-react';

interface RichToolDescriptionProps {
  tool: RegistryTool;
}

export const RichToolDescription = ({ tool }: RichToolDescriptionProps) => {
  return (
    <article className="mt-16 w-full max-w-6xl mx-auto px-6 pb-24 text-gray-600 dark:text-gray-300">
      
      <div className="border-t border-gray-200 dark:border-white/10 pt-16 mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 text-brand-500 text-[10px] font-black mb-8 border border-brand-500/20 uppercase tracking-[0.2em]">
          <Settings2 className="w-4 h-4" />
          <span>In-Depth Guide</span>
        </div>
        <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">
          Complete Guide to the {tool.name} Utility
        </h2>
        
        <p className="text-lg leading-relaxed mb-6 font-medium">
          Welcome to the ultimate guide on utilizing our powerful <strong>{tool.name}</strong>. 
          As part of the comprehensive FreeTool platform, this specific tool falls under our 
          <span className="capitalize font-bold text-brand-500 mx-1">{tool.category}</span> utilities 
          suite and is engineered to transform how you handle daily technical operations. 
          {tool.description}
        </p>

        <p className="text-lg leading-relaxed mb-10">
          In today's fast-paced digital environment, relying on slow, ad-ridden, or insecure solutions is no longer viable. That is exactly why our engineers built this specific <strong>{tool.name}</strong> module entirely from the ground up. Whether you are dealing with rapid prototyping, data manipulation, or final production enhancements, this tool operates fluidly directly inside your browser cache. This significantly reduces redundant network constraints and completely eliminates the frustrating latency traditionally associated with cloud-only alternatives.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
        <div className="bg-gray-50 dark:bg-white/5 p-8 rounded-[2rem] border border-gray-200 dark:border-white/10">
          <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-3">
            <Zap className="w-6 h-6 text-amber-500" />
            Core Capabilities
          </h3>
          <p className="mb-4 text-sm leading-relaxed">
            Every feature within the <strong>{tool.name}</strong> has been meticulously optimized. We leverage modern web specifications, Web Workers, and WebAssembly to ensure that even the heaviest workloads execute rapidly on your local device.
          </p>
          <ul className="space-y-4">
            <li className="flex gap-3 items-start">
              <CheckCircle2 className="w-5 h-5 text-brand-500 shrink-0 mt-0.5" />
              <span><strong>Instant Execution:</strong> Zero waiting in cloud queues. The logic runs utilizing your CPU's direct capabilities via JavaScript engine optimization.</span>
            </li>
            <li className="flex gap-3 items-start">
              <CheckCircle2 className="w-5 h-5 text-brand-500 shrink-0 mt-0.5" />
              <span><strong>No Size Limits:</strong> Unlike server-bound competitors, many of our operations skip rigid upload caps by keeping the file entirely off the network.</span>
            </li>
            <li className="flex gap-3 items-start">
              <CheckCircle2 className="w-5 h-5 text-brand-500 shrink-0 mt-0.5" />
              <span><strong>Rich Customization:</strong> Tailor your output with granular control over formats, precision, and styles before finalizing.</span>
            </li>
          </ul>
        </div>

        <div className="bg-gray-50 dark:bg-white/5 p-8 rounded-[2rem] border border-gray-200 dark:border-white/10">
          <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-emerald-500" />
            Zero-Knowledge Privacy
          </h3>
          <p className="mb-4 text-sm leading-relaxed">
            Data sovereignty is fundamentally ingrained in FreeTool's architecture. We utilize an aggressive "compute-locally" strategy for our suite of tools.
          </p>
          <ul className="space-y-4">
            <li className="flex gap-3 items-start">
              <Lock className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>Local Processing:</strong> Utilizing the HTML5 API, your sensitive inputs never physically leave your machine's memory boundaries.</span>
            </li>
            <li className="flex gap-3 items-start">
              <Lock className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>No Data Retention:</strong> There are no backend database records of your payloads, code snippets, or imagery unless using an explicit "Share" function.</span>
            </li>
            <li className="flex gap-3 items-start">
              <Lock className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>Encrypted Transport:</strong> Any ancillary analytical operations occur fully encrypted over TLS 1.3 standards.</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="mb-16">
        <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-6">Technical Architecture</h3>
        <p className="text-base leading-relaxed mb-4">
          Understanding the technical superiority under the hood of <strong>{tool.name}</strong> will help you leverage it properly. Built primarily for developers, analysts, and designers, the utility connects robust open-source paradigms with an aesthetically refined, dark-mode native interface. Our integration of persistent local caching means that repeating identical commands yields virtually instantaneous results.
        </p>
        <p className="text-base leading-relaxed mb-4">
          If you are working across multiple projects, this tool seamlessly integrates without disrupting your environment. We focus strictly on <em>idempotent</em> workflows, meaning your inputs will reliably yield the identical structured outputs every single time, absolutely free from artificial variation or hidden structural injection.
        </p>
        
        <div className="flex flex-wrap items-center gap-3 mt-8">
          <span className="text-xs font-bold uppercase tracking-widest text-gray-400 mr-2">Identified Tags:</span>
          {tool.tags.map(tag => (
            <span key={tag} className="px-3 py-1 rounded bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 text-xs font-semibold">
              #{tag}
            </span>
          ))}
          <span className="px-3 py-1 rounded bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 text-xs font-semibold flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5" /> Client-Side Compute
          </span>
        </div>
      </div>

      {tool.faq && tool.faq.length > 0 && (
        <div className="pt-12 border-t border-gray-200 dark:border-white/10">
          <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-8 text-center">Frequently Asked Questions</h3>
          <div className="grid gap-6 md:gap-8 grid-cols-1 md:grid-cols-2">
            {tool.faq.map((item, idx) => (
              <div key={idx} className="flex flex-col gap-2">
                <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-brand-500/10 text-brand-500 flex items-center justify-center text-xs font-black shrink-0">
                    Q
                  </div>
                  {item.question}
                </h4>
                <p className="text-sm pl-8 leading-relaxed">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-16 text-center text-sm font-medium text-gray-400 bg-gray-50 dark:bg-white/5 p-6 rounded-2xl border border-gray-200 dark:border-white/10">
        By utilizing {tool.name}, you agree to FreeTool's terms of secure, localized usage. Bookmark this specific utility or use our global keyboard shortcuts (Command/Ctrl + K) to launch it instantly anytime. 
      </div>

    </article>
  );
};
