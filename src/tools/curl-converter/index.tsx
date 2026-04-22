'use client';

import { useState, useEffect, useCallback } from 'react';
import { SEOHelmet } from '@/components/SEOHelmet';
import { toolRegistry } from '@/tools/toolRegistry';
import { RichToolDescription } from '@/components/ui/RichToolDescription';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { OutputConsole } from '@/components/ui/OutputConsole';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { 
  Terminal, 
  AlertCircle, 
  Code2, 
  Info, 
  Monitor,
  MousePointerClick,
  Share2,
  Box,
  Coffee,
  Zap,
  Cpu,
  Globe,
  Settings2
} from 'lucide-react';

// Lazy load curlconverter to keep initial bundle size small
let curlConverterModule: any = null;

const LANGUAGES = [
  { id: 'python', name: 'Python', icon: Terminal, fn: 'toPython' },
  { id: 'javascript', name: 'JavaScript', icon: Code2, fn: 'toJavaScript' },
  { id: 'node', name: 'Node.js', icon: Box, fn: 'toNode' },
  { id: 'go', name: 'Go', icon: Zap, fn: 'toGo' },
  { id: 'php', name: 'PHP', icon: Globe, fn: 'toPhp' },
  { id: 'rust', name: 'Rust', icon: Cpu, fn: 'toRust' },
  { id: 'java', name: 'Java', icon: Coffee, fn: 'toJava' },
  { id: 'csharp', name: 'C#', icon: Settings2, fn: 'toCSharp' },
] as const;

export default function CurlConverter() {
  const [curl, setCurl] = useState('curl https://api.example.com/v1/data \\\n  -H "Authorization: Bearer YOUR_TOKEN" \\\n  -d "{\"foo\": \"bar\"}"');
  const [selectedLang, setSelectedLang] = useState<typeof LANGUAGES[number]>(LANGUAGES[0]);
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const tool = toolRegistry.find(t => t.id === 'curl-converter')!;

  // Initialize curlconverter
  useEffect(() => {
    const init = async () => {
      try {
        if (!curlConverterModule) {
          curlConverterModule = await import('curlconverter');
        }
      } catch (err) {
        console.error('Failed to load curlconverter:', err);
        setError('Failed to initialize compiler engine. Please refresh the page.');
      } finally {
        setIsInitializing(false);
      }
    };
    init();
  }, []);

  // Conversion logic
  const convert = useCallback(() => {
    if (!curl.trim() || !curlConverterModule) return;
    
    try {
      setError(null);
      // curlconverter functions expect a string. 
      // Some versions need to be called as curlConverterModule.toPython(curl)
      const convertFn = curlConverterModule[selectedLang.fn];
      if (typeof convertFn === 'function') {
        const result = convertFn(curl);
        setOutput(result);
      } else {
        // Fallback for different module structures
        const result = curlConverterModule.default[selectedLang.fn](curl);
        setOutput(result);
      }
    } catch (err: any) {
      setError(err.message || 'Invalid cURL command');
      setOutput('');
    }
  }, [curl, selectedLang, isInitializing]);

  useEffect(() => {
    if (!isInitializing) {
      convert();
    }
  }, [curl, selectedLang, isInitializing, convert]);

  const handleExample = (example: string) => {
    if (example === 'get') setCurl('curl https://api.github.com/repos/node-fetch/node-fetch');
    if (example === 'post') setCurl('curl -X POST https://website.com/api \\\n  -H "Content-Type: application/json" \\\n  -d \'{"key": "value"}\'');
    if (example === 'auth') setCurl('curl -u username:password https://api.test.com');
  };

  return (
    <>
      <SEOHelmet
        title="cURL to Code Converter - Python, JS, Go, PHP and more"
        description="Instantly convert cURL commands into clean, production-ready code for Python, JavaScript, Go, PHP, Rust and other languages."
      />

      <div className="w-full mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pt-8 pb-16 px-4">
        <Breadcrumbs />
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-brand-500/20">
               <Terminal className="w-3 h-3" />
               <span>Professional Dev Tools</span>
            </div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white">
              Convert <span className="text-brand-500">cURL</span> to Code
            </h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              Transform raw shell commands into readable snippets for your favorite languages.
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => handleExample('get')} className="text-[10px] uppercase font-bold text-gray-400 hover:text-brand-500">Example GET</Button>
            <Button variant="ghost" size="sm" onClick={() => handleExample('post')} className="text-[10px] uppercase font-bold text-gray-400 hover:text-brand-500">Example POST</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Input Area */}
          <div className="lg:col-span-12 xl:col-span-5 space-y-6">
            <Card className="rounded-[2.5rem] overflow-hidden border-none shadow-2xl bg-white dark:bg-gray-800/40">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400/20" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400/20" />
                    <div className="w-3 h-3 rounded-full bg-green-400/20" />
                  </div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">cURL Command</span>
                </div>
              </div>
              <div className="p-0">
                <textarea
                  value={curl}
                  onChange={(e) => setCurl(e.target.value)}
                  placeholder="Paste your curl command here..."
                  className="w-full h-80 min-h-[300px] p-8 font-mono text-[14px] bg-[#0d1117] text-gray-100 resize-none focus:outline-none scrollbar-thin scrollbar-thumb-gray-800"
                  spellCheck="false"
                />
              </div>
            </Card>

            {error && (
              <div className="flex items-start gap-4 p-6 bg-red-500/10 border border-red-500/20 rounded-[2rem] text-red-500 transition-all animate-in zoom-in-95">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-black uppercase tracking-tight">Syntax Error</p>
                  <p className="text-xs font-medium opacity-80">{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Output Area */}
          <div className="lg:col-span-12 xl:col-span-7 space-y-6">
            <Card className="rounded-[2.5rem] overflow-hidden border-none shadow-2xl bg-[#0d1117]">
              {/* Tab Selector */}
              <div className="px-4 py-2 bg-white/5 dark:bg-white/5 border-b border-white/10 overflow-x-auto scrollbar-hide">
                <div className="flex items-center gap-1 min-w-max">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.id}
                      onClick={() => setSelectedLang(lang)}
                      className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                        selectedLang.id === lang.id 
                          ? 'bg-white/10 text-white shadow-xl' 
                          : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                      }`}
                    >
                      <lang.icon className="w-3.5 h-3.5" />
                      {lang.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Code Panel */}
              <OutputConsole 
                 output={output}
                 isLoading={isInitializing}
                 error={error}
                 title={`${selectedLang.name} Code`}
                 language={selectedLang.id}
                 onClear={() => setOutput('')}
                 className="rounded-t-none min-h-[500px]"
              />
            </Card>
          </div>
        </div>

        {/* Instructions Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
          <div className="md:col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-500/10 rounded-lg">
                <Info className="w-5 h-5 text-brand-500" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">How to Get cURL?</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-8 bg-white dark:bg-gray-800/40 rounded-[2rem] space-y-4 border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group">
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-brand-500/5 rounded-full blur-2xl group-hover:bg-brand-500/10 transition-colors" />
                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 font-black text-xl">1</div>
                <h3 className="font-black text-gray-900 dark:text-white uppercase text-xs tracking-widest">Open DevTools</h3>
                <p className="text-sm text-gray-500 leading-relaxed font-medium">
                  Right-click anywhere on your page and select <span className="text-brand-500 font-bold">Inspect</span>, then go to the <span className="text-blue-500 font-bold">Network</span> tab.
                </p>
                <Monitor className="absolute bottom-6 right-6 w-12 h-12 text-gray-200 dark:text-gray-800 group-hover:scale-110 transition-transform" />
              </div>

              <div className="p-8 bg-white dark:bg-gray-800/40 rounded-[2rem] space-y-4 border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group">
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-green-500/5 rounded-full blur-2xl group-hover:bg-green-500/10 transition-colors" />
                <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500 font-black text-xl">2</div>
                <h3 className="font-black text-gray-900 dark:text-white uppercase text-xs tracking-widest">Copy as cURL</h3>
                <p className="text-sm text-gray-500 leading-relaxed font-medium">
                  Perform the action (click login/submit), right-click the request, and select <span className="text-green-500 font-bold underline">Copy {'>'} Copy as cURL</span>.
                </p>
                <MousePointerClick className="absolute bottom-6 right-6 w-12 h-12 text-gray-200 dark:text-gray-800 group-hover:scale-110 transition-transform" />
              </div>
            </div>
          </div>

          <Card className="p-8 bg-brand-600 rounded-[2.5rem] text-white flex flex-col justify-between shadow-2xl shadow-brand-500/20">
             <div className="space-y-4">
                <Share2 className="w-10 h-10 opacity-50" />
                <h3 className="text-2xl font-black leading-tight">Secure & Private Conversion</h3>
                <p className="text-sm font-medium text-brand-100 opacity-90">
                  All parsing happens directly in your browser using WebAssembly. Your sensitive cookies, tokens, and data never leave your computer.
                </p>
             </div>
             <Button variant="outline" className="mt-8 border-white/20 bg-white/10 hover:bg-white/20 text-white font-black text-xs uppercase tracking-widest rounded-2xl py-6">
                Spread the tool
             </Button>
          </Card>
        </div>

        <RichToolDescription tool={tool} />
      </div>
    </>
  );
}
