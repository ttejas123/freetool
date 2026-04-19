import { useState } from 'react';
import { 
  Terminal, 
  Copy, 
  Check, 
  Maximize2, 
  Download, 
  Loader2, 
  AlertCircle,
  Globe,
  Trash2
} from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';
import { Modal } from './Modal';


interface OutputConsoleProps {
  title?: string;
  output: string | null;
  isLoading?: boolean;
  error?: string | null;
  exitCode?: number | null;
  language?: string;
  onClear?: () => void;
  className?: string;
}

export const OutputConsole = ({ 
  title = "Console Output", 
  output, 
  isLoading, 
  error, 
  exitCode,
  language = 'text',
  onClear,
  className = ""
}: OutputConsoleProps) => {
  const [copied, setCopied] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `output_${new Date().getTime()}.${language === 'json' ? 'json' : 'txt'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderContent = (content: string) => (
    <pre className="font-mono text-[13px] leading-6 whitespace-pre-wrap break-all">
      {content}
    </pre>
  );

  return (
    <>
      <Card className={`flex flex-col min-h-[400px] rounded-[2rem] overflow-hidden border-none shadow-2xl bg-[#010409] group ${className}`}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-black/40 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-green-500" />
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{title}</span>
          </div>

          <div className="flex items-center gap-2">
            {exitCode !== undefined && exitCode !== null && (
              <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter ${exitCode === 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                Exit: {exitCode}
              </div>
            )}
            
            <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
               <button 
                 onClick={handleCopy}
                 disabled={!output}
                 title="Copy Output"
                 aria-label="Copy Output"
                 className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all disabled:opacity-30"
               >
                 {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
               </button>
               <button 
                 onClick={() => setIsMaximized(true)}
                 disabled={!output}
                 title="Maximize Output"
                 aria-label="Maximize Output"
                 className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all disabled:opacity-30"
               >
                 <Maximize2 className="w-3.5 h-3.5" />
               </button>
               <button 
                 onClick={handleExport}
                 disabled={!output}
                 title="Export Result"
                 aria-label="Export Result"
                 className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all disabled:opacity-30"
               >
                 <Download className="w-3.5 h-3.5" />
               </button>
               {onClear && (
                 <button 
                   onClick={onClear}
                   title="Clear Output"
                   aria-label="Clear Output"
                   className="p-1.5 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-500 transition-all"
                 >
                   <Trash2 className="w-3.5 h-3.5" />
                 </button>
               )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 font-mono text-[13px] leading-6 overflow-auto scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4 py-20">
              <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest animate-pulse">Running Execution...</span>
            </div>
          ) : error ? (
            <div className="flex items-start gap-3 text-red-400 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-4 h-4 mt-1 shrink-0" />
              <div className="space-y-2">
                <p className="font-bold text-xs uppercase tracking-tight">Backend Error</p>
                <p className="opacity-90">{error}</p>
              </div>
            </div>
          ) : output ? (
            <div className="text-green-400/90 selection:bg-green-500/30 selection:text-white">
              {renderContent(output)}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center opacity-20 py-20">
              <Globe className="w-12 h-12 text-gray-500 mb-4" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Ready to execute</p>
            </div>
          )}
        </div>
      </Card>

      {/* Big Model View */}
      <Modal 
        isOpen={isMaximized} 
        onClose={() => setIsMaximized(false)} 
        title={`${title} - Big Model View`}
        size="full"
      >
        <div className="bg-[#010409] rounded-3xl p-8 h-full overflow-auto relative group">
           <div className="absolute top-4 right-4 flex gap-2">
              <Button size="sm" onClick={handleCopy} className="bg-white/5 border-white/10 hover:bg-white/10">
                {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                Copy Content
              </Button>
              <Button size="sm" onClick={handleExport} className="bg-white/5 border-white/10 hover:bg-white/10">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
           </div>
           <div className="text-green-400/90 font-mono text-base pt-12">
             {output && renderContent(output)}
           </div>
        </div>
      </Modal>
    </>
  );
};
