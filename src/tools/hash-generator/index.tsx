import { useState, useEffect, useRef } from 'react';
import { SEOHelmet } from '../../components/SEOHelmet';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Textarea, Input } from '../../components/ui/Input';
import { CopyButton } from '../../components/ui/CopyButton';
import { Button } from '../../components/ui/Button';
import { Hash, FileText, GitCompare, Key, Trash2, CheckCircle2, XCircle, ShieldCheck, Zap, Info } from 'lucide-react';
import { md5, sha1, sha256, sha512, hmac256 } from './utils';
import { cn } from '../../lib/utils';

type ToolTab = 'text' | 'file' | 'compare' | 'hmac';

export default function HashGenerator() {
  const [activeTab, setActiveTab] = useState<ToolTab>('text');

  // Text Hashing State
  const [textInput, setTextInput] = useState('');
  const [textHashes, setTextHashes] = useState({
    md5: '',
    sha1: '',
    sha256: '',
    sha512: ''
  });

  // File Hashing State
  const [file, setFile] = useState<File | null>(null);
  const [fileHashes, setFileHashes] = useState({
    md5: '',
    sha256: ''
  });
  const [isHashingFile, setIsHashingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compare State
  const [compareA, setCompareA] = useState('');
  const [compareB, setCompareB] = useState('');

  // HMAC State
  const [hmacText, setHmacText] = useState('');
  const [hmacSecret, setHmacSecret] = useState('');
  const [hmacOutput, setHmacOutput] = useState('');

  // ⚡ Live Text Hashing
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!textInput.trim()) {
        setTextHashes({ md5: '', sha1: '', sha256: '', sha512: '' });
        return;
      }
      try {
        const [m, s1, s256, s512] = await Promise.all([
          md5(textInput),
          sha1(textInput),
          sha256(textInput),
          sha512(textInput)
        ]);
        setTextHashes({ md5: m, sha1: s1, sha256: s256, sha512: s512 });
      } catch (e) {
        console.error(e);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [textInput]);

  // 🔐 Live HMAC Generation
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!hmacText.trim() || !hmacSecret.trim()) {
        setHmacOutput('');
        return;
      }
      const hash = await hmac256(hmacText, hmacSecret);
      setHmacOutput(hash);
    }, 200);
    return () => clearTimeout(timer);
  }, [hmacText, hmacSecret]);

  // 📄 File Hashing Logic
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setIsHashingFile(true);

    try {
      const buffer = await selectedFile.arrayBuffer();
      const m = md5(new Uint8Array(buffer));
      const s256 = await sha256(buffer);
      setFileHashes({ md5: m, sha256: s256 });
    } catch (error) {
      console.error("File hashing failed", error);
    } finally {
      setIsHashingFile(false);
    }
  };

  const getDiffMarkup = (a: string, b: string) => {
    if (a === b) return null;
    if (!a || !b) return null;
    
    // Simple char-by-char comparison if same length
    if (a.length === b.length) {
      return (
        <div className="flex flex-wrap font-mono text-xs break-all">
          {a.split('').map((char, i) => (
            <span key={i} className={char === b[i] ? 'text-gray-500' : 'text-red-500 font-bold bg-red-100 dark:bg-red-900/30'}>
              {char}
            </span>
          ))}
        </div>
      );
    }
    return null;
  };

  const tabs: { id: ToolTab; label: string; icon: any }[] = [
    { id: 'text', label: 'Multi-Hash', icon: Hash },
    { id: 'file', label: 'File Hashing', icon: FileText },
    { id: 'hmac', label: 'HMAC Generator', icon: Key },
    { id: 'compare', label: 'Hash Compare', icon: GitCompare },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SEOHelmet 
        title="Hash Generator Pro - V2" 
        description="Professional cryptographic hash generator. Support for MD5, SHA-1, SHA-256, HMAC, File Hashing, and Hash Comparison." 
      />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-indigo-600 dark:from-brand-400 dark:to-indigo-400">
            Hash Generator <span className="text-sm font-medium px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 ml-2">V2.0</span>
          </h1>
          <p className="mt-1 text-gray-500">Secure, instant, and professional cryptographic tools.</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex p-1 space-x-1 bg-gray-100 dark:bg-slate-800 rounded-xl max-w-fit overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center px-4 py-2 text-sm font-medium transition-all rounded-lg gap-2 whitespace-nowrap",
              activeTab === tab.id 
                ? "bg-white dark:bg-slate-700 text-brand-600 dark:text-white shadow-sm" 
                : "text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* 🚀 Multi-Hash Tab */}
      {activeTab === 'text' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <Card className="border-none shadow-premium bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="text-amber-500 w-5 h-5" />
                <CardTitle className="text-lg">Input Text</CardTitle>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setTextInput('')} className="text-gray-400 hover:text-red-500">
                <Trash2 className="w-4 h-4 mr-1" /> Clear
              </Button>
            </CardHeader>
            <CardContent>
              <Textarea
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                placeholder="Type or paste your text here for instant multi-algorithm hashing..."
                className="min-h-[120px] focus:ring-brand-500/20 text-lg py-4 placeholder:italic"
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'MD5', value: textHashes.md5, desc: 'Message Digest Algorithm 5' },
              { label: 'SHA-1', value: textHashes.sha1, desc: 'Secure Hash Algorithm 1' },
              { label: 'SHA-256', value: textHashes.sha256, desc: 'Highly Secure 256-bit Hash' },
              { label: 'SHA-512', value: textHashes.sha512, desc: 'Most Secure 512-bit Hash' }
            ].map(algo => (
              <Card key={algo.label} className="group hover:shadow-md transition-shadow">
                <CardHeader className="py-3 flex flex-row items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xs font-bold text-gray-500 uppercase tracking-wider">{algo.label}</CardTitle>
                    <p className="text-[10px] text-gray-400">{algo.desc}</p>
                  </div>
                  <CopyButton value={algo.value} className="scale-90 opacity-40 group-hover:opacity-100 transition-opacity" />
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="font-mono text-sm break-all p-3 bg-gray-50 dark:bg-slate-800 rounded-lg text-brand-600 dark:text-brand-400 border border-transparent group-hover:border-brand-500/20 transition-colors">
                    {algo.value || <span className="opacity-30 italic">Awaiting input...</span>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 📄 File Hashing Tab */}
      {activeTab === 'file' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <Card className="border-dashed border-2 bg-slate-50 dark:bg-slate-900 shadow-none">
            <CardContent className="p-10 flex flex-col items-center justify-center text-center space-y-4">
              <div className="p-4 bg-brand-100 dark:bg-brand-900 rounded-full text-brand-600">
                <FileText className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Upload file to hash</h3>
                <p className="text-gray-500 max-w-sm mx-auto mt-2 text-sm">
                  The file will be processed entirely in your browser. It is never uploaded to any server.
                </p>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
              />
              <Button onClick={() => fileInputRef.current?.click()} disabled={isHashingFile}>
                {isHashingFile ? 'Processing...' : 'Select File'}
              </Button>
              {file && (
                <div className="flex items-center gap-2 text-sm text-brand-600 font-medium">
                  <CheckCircle2 className="w-4 h-4" /> {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </CardContent>
          </Card>

          {file && (
            <div className="space-y-4">
               {[
                { label: 'File MD5', value: fileHashes.md5 },
                { label: 'File SHA-256', value: fileHashes.sha256 }
              ].map(algo => (
                <Card key={algo.label}>
                  <CardHeader className="py-3 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-bold uppercase">{algo.label}</CardTitle>
                    <CopyButton value={algo.value} />
                  </CardHeader>
                  <CardContent>
                    <Input readOnly value={algo.value} className="font-mono text-brand-600 bg-transparent" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 🔐 HMAC Tab */}
      {activeTab === 'hmac' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="text-green-500 w-5 h-5" />
                HMAC-SHA256 Generator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Message / Payload</label>
                <Textarea 
                  value={hmacText}
                  onChange={e => setHmacText(e.target.value)}
                  placeholder="The message to be authenticated..."
                  className="min-h-[100px]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Secret Key</label>
                <div className="relative">
                  <Input 
                    type="password"
                    value={hmacSecret}
                    onChange={e => setHmacSecret(e.target.value)}
                    placeholder="Your secret key (Stripe, AWS, API key...)"
                    className="pr-10"
                  />
                  <Key className="absolute right-3 top-2.5 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </CardContent>
          </Card>

          {hmacOutput && (
            <Card className="border-green-200 dark:border-green-900 bg-green-50/30 dark:bg-green-900/10">
              <CardHeader className="py-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold text-green-700">HMAC OUTPUT (SHA-256)</CardTitle>
                <CopyButton value={hmacOutput} />
              </CardHeader>
              <CardContent>
                <code className="block break-all font-mono text-lg text-green-600 dark:text-green-400">
                  {hmacOutput}
                </code>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* 🔍 Compare Tab */}
      {activeTab === 'compare' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-xs font-bold uppercase text-gray-500">Hash / Text A</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea 
                  value={compareA}
                  onChange={e => setCompareA(e.target.value)}
                  className="font-mono text-sm bg-gray-50 dark:bg-slate-800"
                  placeholder="Paste first hash or text..."
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-xs font-bold uppercase text-gray-500">Hash / Text B</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea 
                  value={compareB}
                  onChange={e => setCompareB(e.target.value)}
                  className="font-mono text-sm bg-gray-50 dark:bg-slate-800"
                  placeholder="Paste second hash or text..."
                />
              </CardContent>
            </Card>
          </div>

          <Card className={cn(
            "transition-colors shadow-premium",
            compareA && compareB 
              ? (compareA === compareB ? "bg-green-50/50 dark:bg-green-900/10 border-green-200" : "bg-red-50/50 dark:bg-red-900/10 border-red-200")
              : "bg-gray-50 dark:bg-slate-900/50"
          )}>
            <CardContent className="p-8 flex flex-col items-center justify-center gap-4">
              {!compareA || !compareB ? (
                <div className="text-gray-400 flex flex-col items-center gap-2">
                  <Info className="w-8 h-8 opacity-20" />
                  <p>Paste two values above to compare them instantly</p>
                </div>
              ) : compareA === compareB ? (
                <>
                  <div className="p-4 bg-green-100 dark:bg-green-900 rounded-full text-green-600">
                    <CheckCircle2 className="w-12 h-12" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-green-700 dark:text-green-400 italic">Match Found!</h3>
                    <p className="text-green-600/70 text-sm mt-1">The two inputs are exactly identical.</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-4 bg-red-100 dark:bg-red-900 rounded-full text-red-600">
                    <XCircle className="w-12 h-12" />
                  </div>
                  <div className="text-center w-full">
                    <h3 className="text-2xl font-bold text-red-700 dark:text-red-400 italic">No Match</h3>
                    <p className="text-red-600/70 text-sm mt-1">Input values are different.</p>
                    
                    {/* Visual Diff */}
                    <div className="mt-6 p-4 bg-white dark:bg-black/20 rounded-xl text-left border border-red-100 dark:border-red-900/30 overflow-hidden">
                      <p className="text-[10px] uppercase font-bold text-gray-400 mb-2">Difference Highlighting:</p>
                      {getDiffMarkup(compareA, compareB) || (
                        <p className="text-xs text-gray-500 italic">Character diff is only available for strings of identical length.</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
