import { useState, useEffect, useRef } from 'react';
import { useFilePaste } from '@/hooks/useFilePaste';
import { SEOHelmet } from '../../components/SEOHelmet';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Textarea } from '../../components/ui/Input';
import { CopyButton } from '../../components/ui/CopyButton';
import { Button } from '../../components/ui/Button';
import { Upload, FileText, ImageIcon, Key, Trash2, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { trackEvent } from '../../lib/analytics';
import { analyzeInput, formatBytes, fileToBase64, safeEncodeBase64 } from './utils';
import type { AnalysisResult, DetectedType } from './utils';
import './styles.css';

export default function Base64Encoder() {
  const [input, setInput] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isBroken, setIsBroken] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    try {
      const b64 = await fileToBase64(file);
      setInput(b64);
      trackEvent('file_uploaded', { tool: 'base64-converter', mime: file.type });
    } catch (err) {
      console.error('File read error:', err);
    }
  };

  useFilePaste((files) => {
    const file = files[0];
    if (file) processFile(file);
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!input.trim()) {
        setAnalysis(null);
        setIsBroken(false);
        return;
      }
      const result = analyzeInput(input);
      setAnalysis(result);
      setIsBroken(false);
      trackEvent('tool_used', { tool: 'base64-converter', type: result.type });
    }, 300);
    return () => clearTimeout(timer);
  }, [input]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const clear = () => {
    setInput('');
    setAnalysis(null);
    setIsBroken(false);
    trackEvent('clear_clicked', { tool: 'base64-converter' });
  };

  const getBadgeColor = (type: DetectedType) => {
    switch (type) {
      case 'jwt': return 'badge-purple';
      case 'image': return 'badge-green';
      case 'data-url': return 'badge-blue';
      default: return 'badge-gray';
    }
  };

  const renderJWT = () => {
    if (!analysis?.jwtInfo) return null;
    const { header, payload, expiry } = analysis.jwtInfo;
    return (
      <div className="jwt-section space-y-6">
        <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
          <Key className="w-5 h-5" />
          <h3 className="text-lg font-semibold">JWT Details</h3>
        </div>
        <div className="jwt-grid">
          <Card className="bg-gray-50/50 dark:bg-gray-800/30 border-none">
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium opacity-70">Header</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs font-mono overflow-auto max-h-[300px]">
                {JSON.stringify(header, null, 2)}
              </pre>
            </CardContent>
          </Card>
          <Card className="bg-gray-50/50 dark:bg-gray-800/30 border-none">
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium opacity-70">Payload</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs font-mono overflow-auto max-h-[300px]">
                {JSON.stringify(payload, null, 2)}
              </pre>
              {expiry && (
                <div className="mt-4 flex items-center gap-2 text-xs font-medium text-gray-500">
                  <ShieldCheck className="w-4 h-4 text-green-500" />
                  Expires: {expiry.toLocaleString()}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderPreview = () => {
    if (!analysis) return null;
    
    // Check if it's an image (either data-url or base64)
    const isImageData = analysis.type === 'data-url' && analysis.isImage;
    const isBase64Img = analysis.type === 'base64' && analysis.isImage;
    
    let imgSrc = '';
    if (isImageData) imgSrc = input;
    else if (isBase64Img) imgSrc = `data:${analysis.mimeType || 'image/png'};base64,${input}`;
    else if (analysis.type === 'base64' && !analysis.isImage && !analysis.isJson) {
        // Try anyway for unknown base64 that might be an image
        imgSrc = `data:image/png;base64,${input}`;
    }

    if (!imgSrc) return null;

    return (
      <div className="image-preview text-center">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-blue-500" />
            Image Preview
          </span>
          {isBroken && (
            <span className="text-xs text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Broken or Invalid Image Data
            </span>
          )}
        </div>
        <img 
          src={imgSrc} 
          alt="Base64 Preview" 
          onError={() => setIsBroken(true)}
          className={isBroken ? 'opacity-20 grayscale' : ''}
        />
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <SEOHelmet 
        title="Smart Base64 Converter & JWT Decoder" 
        description="Auto-detecting Base64 encoder/decoder with JWT analysis and image previews." 
      />
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              FreeTool Converter
            </h1>
            {analysis && (
              <span className={`badge ${getBadgeColor(analysis.type)} uppercase tracking-wider`}>
                {analysis.type}
              </span>
            )}
          </div>
          <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">
            Paste text, JWT, or upload files for instant analysis.
          </p>
        </div>
        <div className="flex items-center gap-3">
            {analysis && (
                <div className="text-right mr-4 hidden sm:block">
                    <p className="text-xs text-gray-400 uppercase font-semibold">Data Size</p>
                    <p className="text-sm font-bold text-brand-600">{formatBytes(analysis.size)}</p>
                </div>
            )}
            <Button onClick={clear} variant="secondary" size="sm" className="gap-2">
                <Trash2 className="w-4 h-4" /> Clear
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-12 space-y-6">
          <Card className="border-none shadow-2xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl ring-1 ring-gray-200 dark:ring-gray-800 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 px-6 py-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-600" />
                <span className="text-sm font-semibold uppercase tracking-wider opacity-70">Input Editor</span>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="gap-2 h-8 text-xs border-dashed"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload File
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={clear}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div 
                className="relative group group-hover:bg-gray-50/10 transition-colors"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add('bg-brand-50/20', 'dark:bg-brand-900/10');
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('bg-brand-50/20', 'dark:bg-brand-900/10');
                }}
                onDrop={async (e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('bg-brand-50/20', 'dark:bg-brand-900/10');
                    const file = e.dataTransfer.files[0];
                    if (file) {
                        const b64 = await fileToBase64(file);
                        setInput(b64);
                    }
                }}
              >
                {!input && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-40 select-none">
                    <Upload className="w-12 h-12 mb-2 text-gray-400" />
                    <p className="text-sm font-medium">Paste content or drop file here</p>
                  </div>
                )}
                <div className="p-4 pr-12 min-h-[300px]">
                  <Textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder=""
                    className="min-h-[250px] border-none focus:ring-0 px-0 resize-none bg-transparent font-mono text-sm leading-relaxed"
                  />
                </div>
                <div className="absolute top-4 right-4 focus-within:opacity-100 opacity-0 group-hover:opacity-100 transition-opacity">
                    <CopyButton value={input} size="sm" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {analysis && (
          <div className="lg:col-span-12 space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
            {/* Auto-detect Results */}
            <div className="flex flex-col gap-6">
              {analysis.type === 'jwt' && renderJWT()}
              {renderPreview()}
              
              {/* Output/Decoded Text View */}
              {(analysis.type === 'base64' || analysis.type === 'jwt' || analysis.type === 'data-url') && !analysis.isImage && (
                <Card className="border-none bg-brand-50/30 dark:bg-brand-900/10">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-semibold text-brand-700 dark:text-brand-300 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      {analysis.type === 'jwt' ? 'Decoded Payload' : 'Decoded Content'}
                    </CardTitle>
                    <CopyButton value={analysis.decoded} size="sm" />
                  </CardHeader>
                  <CardContent>
                    <pre className="text-sm font-mono whitespace-pre-wrap break-all max-h-[500px] overflow-auto">
                      {analysis.decoded}
                    </pre>
                  </CardContent>
                </Card>
              )}

              {/* Data URL Generator (if input is raw text) */}
              {analysis.type === 'text' && !analysis.isJson && input && (
                 <Card className="border-none bg-brand-50/30 dark:bg-brand-900/10">
                 <CardHeader className="flex flex-row items-center justify-between pb-2">
                   <CardTitle className="text-sm font-semibold text-brand-700 dark:text-brand-300 flex items-center gap-2">
                     <ArrowRight className="w-4 h-4" />
                     Generated Base64
                   </CardTitle>
                   <CopyButton value={safeEncodeBase64(input)} size="sm" />
                 </CardHeader>
                 <CardContent>
                   <p className="text-sm font-mono break-all line-clamp-6 opacity-60">
                     {safeEncodeBase64(input)}
                   </p>
                 </CardContent>
               </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
