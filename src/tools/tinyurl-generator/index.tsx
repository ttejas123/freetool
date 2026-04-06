import { useState, useEffect } from 'react';
import { Link2, Trash2, ArrowRight, Loader2, Unlink, Copy, Check, Terminal, Eye, X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CopyButton } from '@/components/ui/CopyButton';
import { SEOHelmet } from '@/components/SEOHelmet';
import { generateShortLink, getHistory, clearHistory, resolveShortLink, type ShortLink } from './utils';

// ── Expand tab logic ──────────────────────────────────────────────────────────
type ExpandResult = {
  short: string;
  resolved: string;
  curl: string;
  loading?: boolean;
  error?: boolean;
};

async function expandUrl(url: string): Promise<ExpandResult> {
  const curl = `curl -sI "${url}" | grep -i location`;
  try {
    const resolved = await resolveShortLink(url);
    return { short: url, resolved, curl };
  } catch (error: any) {
    return { short: url, resolved: error.message || 'Error: could not resolve', curl, error: true };
  }
}

function ExpandTab({ onPreview }: { onPreview: (url: string) => void }) {
  const [inputText, setInputText] = useState('');
  const [results, setResults] = useState<ExpandResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const handleExpand = async () => {
    const urls = inputText.split('\n').map(u => u.trim()).filter(Boolean);
    if (!urls.length) return;
    setLoading(true);
    setResults(urls.map(u => ({ short: u, resolved: '', curl: `curl -sI "${u}" | grep -i location`, loading: true })));
    const resolved = await Promise.all(urls.map(expandUrl));
    setResults(resolved);
    setLoading(false);
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 md:p-8 border-brand-100 dark:border-gray-700 bg-white dark:bg-gray-800/50 shadow-xl shadow-brand-500/5">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Short URLs to expand (one per line)
            </label>
            <textarea
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder={'https://tinyurl.com/xyz\nhttps://bit.ly/abc\nhttps://t.co/def'}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-y"
            />
          </div>
          <Button
            onClick={handleExpand}
            size="lg"
            disabled={loading || !inputText.trim()}
            className="w-full py-6 px-8 bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-500/20 gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Unlink className="w-5 h-5" /> Expand URLs</>}
          </Button>
        </div>
      </Card>

      {results.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Results</h2>
          {results.map((r, i) => (
            <Card key={i} className="p-4 space-y-3 hover:border-brand-500/50 transition-colors">
              {r.loading ? (
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
                  Resolving {r.short}…
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-3">
                    <Unlink className="w-4 h-4 mt-0.5 text-brand-500 shrink-0" />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="text-xs text-gray-400 font-medium">SHORT URL</div>
                      <div className="text-sm text-brand-600 dark:text-brand-400 truncate font-mono">{r.short}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <ArrowRight className="w-4 h-4 mt-0.5 text-green-500 shrink-0" />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="text-xs text-gray-400 font-medium">RESOLVED URL</div>
                      <div className={`text-sm truncate font-mono ${r.error ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}>
                        {r.resolved}
                      </div>
                    </div>
                    {!r.error && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => onPreview(r.resolved)} className="p-1 text-gray-400 hover:text-brand-500 transition-colors" title="Preview site">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => copyText(r.resolved)} className="p-1 text-gray-400 hover:text-brand-500 transition-colors">
                          {copied === r.resolved ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    )}
                  </div>
                  {/* cURL equivalent */}
                  <div className="flex items-center gap-3 bg-zinc-950 dark:bg-black rounded-lg px-3 py-2">
                    <Terminal className="w-3.5 h-3.5 text-green-400 shrink-0" />
                    <code className="flex-1 text-xs text-green-300 font-mono truncate">{r.curl}</code>
                    <button onClick={() => copyText(r.curl)} className="shrink-0 text-green-500 hover:text-green-300 transition-colors">
                      {copied === r.curl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Shorten Tab (existing, cleaned up) ───────────────────────────────────────
function ShortenTab({ onPreview }: { onPreview: (url: string) => void }) {
  const [url, setUrl] = useState('');
  const [history, setHistory] = useState<ShortLink[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => { getHistory().then(setHistory); }, []);

  const handleShorten = async () => {
    if (!url.trim()) { setError('Please enter a valid URL'); return; }
    try { new URL(url); setError(''); } catch {
      setError('Invalid URL. Include http:// or https://'); return;
    }
    setIsLoading(true);
    try {
      await generateShortLink(url);
      setHistory(await getHistory());
      setUrl('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate short link');
    } finally { setIsLoading(false); }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 md:p-8 border-brand-100 dark:border-gray-700 bg-white dark:bg-gray-800/50 shadow-xl shadow-brand-500/5">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="flex-1 w-full">
            <Input
              placeholder="https://example.com/very/long/url/that/needs/shortening"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleShorten()}
              className={`w-full text-lg py-6 ${error ? 'border-red-500 focus:ring-red-500' : ''}`}
            />
            {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
          </div>
          <Button onClick={handleShorten} size="lg" disabled={isLoading}
            className="w-full md:w-auto mt-1 md:mt-0 py-6 px-8 bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-500/20 gap-2">
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Shorten <ArrowRight className="w-5 h-5" /></>}
          </Button>
        </div>
      </Card>

      <Card className="p-4 md:p-5 border-brand-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 shadow-md">
        <div className="flex items-center gap-2 mb-2">
          <Terminal className="w-5 h-5 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Shorten via CLI</h3>
        </div>
        <p className="text-xs text-gray-500 mb-3">You can use our Supabase Edge Function directly from your terminal. (Replace the URL below)</p>
        <div className="flex items-center gap-3 bg-zinc-950 dark:bg-black rounded-lg px-3 py-2">
          <code className="flex-1 text-xs text-green-400 font-mono truncate">
            curl "https://[YOUR_PROJECT_REF].supabase.co/functions/v1/shorten?url=https://example.com"
          </code>
        </div>
      </Card>

      {history.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Link2 className="w-5 h-5 text-brand-500" />Recent Links
            </h2>
            <Button variant="secondary" size="sm" onClick={async () => { await clearHistory(); setHistory([]); }}
              className="text-red-500 hover:text-red-600 border-red-200 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/20">
              <Trash2 className="w-4 h-4 mr-2" />Clear
            </Button>
          </div>
          <div className="grid gap-4">
            {history.map(item => (
              <Card key={item.id} className="p-4 md:p-5 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center hover:border-brand-500/50 transition-colors">
                <div className="min-w-0 flex-1 space-y-1 w-full">
                  <div className="flex items-center justify-between gap-4">
                    <a href={item.shortUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-600 dark:text-brand-400 truncate hover:underline">{item.shortUrl}</a>
                    <span className="text-xs text-gray-400 whitespace-nowrap hidden sm:inline-block">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{item.originalUrl}</p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0 mt-3 sm:mt-0">
                  <button onClick={() => onPreview(item.shortUrl)} className="h-10 px-3 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-300 transition-colors flex items-center justify-center shrink-0" title="Preview site">
                    <Eye className="w-4 h-4" />
                  </button>
                  <CopyButton value={item.shortUrl} className="flex-1 sm:flex-none h-10" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Root component ────────────────────────────────────────────────────────────
export default function TinyUrlGenerator() {
  const [tab, setTab] = useState<'shorten' | 'expand'>('shorten');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pt-8 pb-16 relative">
      <SEOHelmet
        title="TinyURL Generator & URL Expander"
        description="Shorten long URLs instantly or expand short links to see the original destination, with cURL commands. Fully browser-side."
      />

      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-brand-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
          <Link2 className="w-8 h-8 text-brand-600 dark:text-brand-400" />
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white">
          TinyURL Generator
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto text-lg">
          Shorten long URLs or expand short ones — with cURL command equivalent.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 dark:bg-gray-800 rounded-2xl p-1.5 gap-1">
        <button
          onClick={() => setTab('shorten')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
            tab === 'shorten'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          <Link2 className="w-4 h-4" />Shorten URL
        </button>
        <button
          onClick={() => setTab('expand')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
            tab === 'expand'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          <Unlink className="w-4 h-4" />Expand URL
        </button>
      </div>

      {tab === 'shorten' ? <ShortenTab onPreview={setPreviewUrl} /> : <ExpandTab onPreview={setPreviewUrl} />}

      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white dark:bg-gray-900 w-full max-w-6xl h-[85vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800 animate-in slide-in-from-bottom-8">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
              <div className="flex items-center gap-3 w-full min-w-0 pr-4">
                <div className="bg-brand-100 dark:bg-brand-900/30 p-2 rounded-lg">
                  <Eye className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">Preview</h3>
                  <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-500 hover:text-brand-600 font-mono truncate hover:underline block">{previewUrl}</a>
                </div>
              </div>
              <button onClick={() => setPreviewUrl(null)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg text-gray-500 shrink-0 border-0">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 bg-gray-100 dark:bg-black relative">
              <iframe src={previewUrl} className="w-full h-full border-0 absolute inset-0" title="Preview" />
            </div>
            <div className="p-3 text-center text-xs text-gray-500 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex justify-center items-center gap-2">
              <span>Note: Some websites may refuse to connect inside an iframe due to their security settings.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
