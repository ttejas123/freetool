import { useState, useMemo } from 'react';
import { SEOHelmet } from '../../components/SEOHelmet';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Textarea } from '../../components/ui/Input';
import { CopyButton } from '../../components/ui/CopyButton';
import { Toggle } from '../../components/ui/Toggle';
import { 
  Settings, 
  Layers, 
  Trash2, 
  Link as LinkIcon, 
  Info,
  CheckCircle2,
  Hash,
  Type
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SlugOptions {
  separator: string;
  lowercase: boolean;
  bulkMode: boolean;
  maxLength: number;
}

export default function TextToSlug() {
  const [input, setInput] = useState('');
  const [options, setOptions] = useState<SlugOptions>({
    separator: '-',
    lowercase: true,
    bulkMode: false,
    maxLength: 60,
  });

  const slugify = (text: string, opts: SlugOptions) => {
    if (!text) return '';
    
    let result = text;
    
    // Normalize and remove diacritics
    result = result.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    if (opts.lowercase) {
      result = result.toLowerCase();
    }

    // Replace all non-alphanumeric (except space/hyphen) with space then clean up
    // This handles emojis and special symbols
    result = result.replace(/[^a-z0-9\s-_.]/gi, ' ');

    // Replace spaces and existing delimiters with the chosen separator
    const sep = opts.separator;
    result = result.replace(/[\s\-_.]+/g, sep);

    // Clean up leading/trailing separators
    if (sep) {
      const escapedSep = sep.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      result = result.replace(new RegExp(`^${escapedSep}+|${escapedSep}+$`, 'g'), '');

      // Trim to max length without cutting words if possible (simple trim for now)
      if (opts.maxLength > 0) {
        result = result.substring(0, opts.maxLength);
        // Ensure we don't end with a separator after trimming
        result = result.replace(new RegExp(`${escapedSep}+$`), '');
      }
    } else if (opts.maxLength > 0) {
      result = result.substring(0, opts.maxLength);
    }

    return result;
  };

  const output = useMemo(() => {
    if (options.bulkMode) {
      return input.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => slugify(line, options))
        .join('\n');
    }
    return slugify(input, options);
  }, [input, options]);

  const stats = useMemo(() => ({
    inputChars: input.length,
    inputWords: input.trim() ? input.trim().split(/\s+/).length : 0,
    outputLength: output.length,
    lines: input.split('\n').filter(l => l.trim()).length
  }), [input, output]);

  const separators = [
    { label: 'Hyphen (-)', value: '-' },
    { label: 'Underscore (_)', value: '_' },
    { label: 'Dot (.)', value: '.' },
    { label: 'None', value: '' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
      <SEOHelmet 
        title="Text to Slug Converter V3 | SEO Friendly URL Generator" 
        description="Convert any string or list of titles into SEO-friendly URL slugs. Features bulk mode, custom separators, and diacritic normalization." 
      />

      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-2xl mb-2">
          <LinkIcon className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-2" />
          <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Premium Tool V3</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Text to <span className="text-blue-600 dark:text-blue-400">Slug</span> Converter
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Transform messy titles into clean, URL-friendly slugs instantly. Perfect for SEO, bloggers, and developers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar Options - Takes 4 cols on large screens */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="overflow-hidden border-none shadow-xl ring-1 ring-gray-200 dark:ring-gray-800">
            <CardHeader className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-gray-500" />
                <CardTitle className="text-lg">Generator Options</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Bulk Mode Toggle */}
              <div className="flex items-center justify-between p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100/50 dark:border-blue-900/20">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                    <Layers className="w-4 h-4 text-blue-600 dark:text-blue-200" />
                  </div>
                  <div>
                    <span className="block font-semibold text-sm">Bulk Mode</span>
                    <span className="text-xs text-gray-500">Process line-by-line</span>
                  </div>
                </div>
                <Toggle 
                  checked={options.bulkMode} 
                  onChange={(e) => setOptions(prev => ({ ...prev, bulkMode: e.target.checked }))} 
                />
              </div>

              {/* Separator Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Hash className="w-4 h-4 text-gray-400" />
                  Separator Character
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {separators.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setOptions(prev => ({ ...prev, separator: s.value }))}
                      className={cn(
                        "px-3 py-2 text-sm rounded-lg border transition-all text-left",
                        options.separator === s.value
                          ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-none"
                          : "border-gray-200 dark:border-gray-800 hover:border-blue-400 dark:hover:border-blue-600"
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Max Length */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Type className="w-4 h-4 text-gray-400" />
                    Max Length
                  </label>
                  <span className="text-xs font-mono text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded">
                    {options.maxLength} chars
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  step="5"
                  value={options.maxLength}
                  onChange={(e) => setOptions(prev => ({ ...prev, maxLength: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <p className="text-[10px] text-gray-500 italic">Set to 0 for unlimited length. SEO recommended: 60.</p>
              </div>

              {/* Lowercase Toggle */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm font-medium">Always Lowercase</span>
                <Toggle 
                  checked={options.lowercase} 
                  onChange={(e) => setOptions(prev => ({ ...prev, lowercase: e.target.checked }))} 
                />
              </div>
            </CardContent>
          </Card>

          {/* Tips Card */}
          <Card className="bg-yellow-50/50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/20">
            <CardContent className="p-4 flex gap-3">
              <Info className="w-5 h-5 text-yellow-600 flex-shrink-0" />
              <div className="text-xs text-yellow-800 dark:text-yellow-400 leading-relaxed">
                <p className="font-semibold mb-1">SEO Pro Tip:</p>
                Keep slugs short and strictly include key descriptive words. Avoid "stop words" like 'and', 'the', or 'is'.
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Workspace - Takes 8 cols */}
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Input Card */}
            <Card className="flex flex-col border-none shadow-xl ring-1 ring-gray-200 dark:ring-gray-800">
              <CardHeader className="flex flex-row items-center justify-between py-4 border-b border-gray-100 dark:border-gray-800">
                <CardTitle className="text-base uppercase tracking-wider text-gray-500">Input Text</CardTitle>
                <div className="flex items-center space-x-2">
                   <span className="text-[10px] font-medium bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full text-gray-500">
                    {options.bulkMode ? `${stats.lines} Lines` : `${stats.inputWords} Words`}
                  </span>
                  <button 
                    onClick={() => setInput('')}
                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 transition-colors rounded-lg"
                    title="Clear All"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="h-80 md:h-96 border-0 focus:ring-0 rounded-none resize-none bg-gray-50/30 dark:bg-gray-900/20 p-6 text-base font-medium placeholder:text-gray-300"
                  placeholder={options.bulkMode ? "Paste multiple titles here (one per line)..." : "Type your article title or text here..."}
                />
              </CardContent>
            </Card>

            {/* Output Card */}
            <Card className="flex flex-col border-none shadow-xl ring-1 ring-blue-100 dark:ring-blue-900/30 bg-white dark:bg-gray-950">
              <CardHeader className="flex flex-row items-center justify-between py-4 border-b border-gray-100 dark:border-gray-800">
                <CardTitle className="text-base uppercase tracking-wider text-blue-600 dark:text-blue-400">Generated Slug</CardTitle>
                <div className="flex items-center space-x-2">
                   <span className="text-[10px] font-medium bg-blue-50 dark:bg-blue-900/40 px-2 py-1 rounded-full text-blue-600 dark:text-blue-400 uppercase">
                    {stats.outputLength} Chars
                  </span>
                  <CopyButton value={output} />
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1 relative overflow-hidden">
                <div className="h-80 md:h-96 p-6 font-mono text-sm break-all overflow-y-auto bg-white dark:bg-gray-950 text-gray-800 dark:text-gray-200 leading-relaxed">
                  {output ? (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                      {output}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-30 select-none">
                      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full">
                        <LinkIcon className="w-8 h-8" />
                      </div>
                      <p className="text-sm italic">Example: your-seo-slug-will-appear-here</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* SEO & FAQ Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-10 border-t border-gray-100 dark:border-gray-800">
        <div className="space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-500" />
            Slug Best Practices
          </h2>
          <ul className="space-y-4">
            {[
              { title: "Keep it descriptive", desc: "Slugs should explain exactly what the page is about." },
              { title: "Use lower case", desc: "Avoid mix-case as it can cause duplicate content issues on some servers." },
              { title: "Omit stop words", desc: "Words like 'a', 'an', 'the' add bulk without adding SEO value." },
              { title: "Short is better", desc: "Search engines prefer URLs that are focused and easy to read." }
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-4">
                <div className="mt-1 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 text-[10px] font-bold">
                  {i + 1}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

    </div>
  );
}
