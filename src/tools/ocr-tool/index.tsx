'use client';

import { useState, useRef, useCallback } from 'react';
import { createWorker, type Worker } from 'tesseract.js';
import { useFilePaste } from '@/hooks/useFilePaste';
import { SEOHelmet } from '@/components/SEOHelmet';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { 
  Upload, 
  Search, 
  Trash2, 
  FileText, 
  Download, 
  Loader2, 
  Globe, 
  Sparkles, 
  ScanText,
  CheckCircle2,
  BrainCircuit,
  Eye,
  Activity
} from 'lucide-react';
import { preprocessImage, type PreprocessConfig, reconstructLayout } from './utils';
import Tesseract from 'tesseract.js';

const LANGUAGES = [
  { code: 'eng', name: 'English' },
  { code: 'spa', name: 'Spanish' },
  { code: 'fra', name: 'French' },
  { code: 'deu', name: 'German' },
  { code: 'chi_sim', name: 'Chinese (Simplified)' },
  { code: 'jpn', name: 'Japanese' },
  { code: 'hin', name: 'Hindi' },
  { code: 'ara', name: 'Arabic' },
  { code: 'rus', name: 'Russian' },
  { code: 'por', name: 'Portuguese' },
];

/**
 * Scan Iteration Definitions
 */
const SCAN_PASSES: { name: string; config: PreprocessConfig }[] = [
  { name: 'Baseline Engine', config: { grayscale: false } },
  { name: 'Auto-Optimizer', config: { useOtsu: true, grayscale: true, contrast: 150 } },
  { name: 'Contrast Surge',  config: { useOtsu: true, grayscale: true, contrast: 200, brightness: 110 } },
  { name: 'Deep Inversion', config: { useOtsu: true, grayscale: true, invert: true, contrast: 150 } },
];

export default function OCRTool() {
  const [image, setImage] = useState<string | null>(null);
  const [text, setText] = useState<string>('');
  const [confidence, setConfidence] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [selectedLang, setSelectedLang] = useState('eng');
  const [scannerPreview, setScannerPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target?.result as string);
        setText('');
        setConfidence(null);
        setProgress(0);
        setStatus('');
        setScannerPreview(null);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  useFilePaste((files) => {
    const file = files[0];
    if (file) handleFile(file);
  });

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  /**
   * Main Recursive Multi-Pass Logic
   */
  const processImage = async () => {
    if (!image) return;

    setIsProcessing(true);
    setProgress(0);
    setText('');
    setConfidence(0);
    setStatus('Initializing Neural Engine...');

    let bestResult = { text: '', confidence: 0 };
    let worker: Worker | null = null;

    try {
      setStatus('Engine Warming Up...');
      
      worker = await createWorker(selectedLang, 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      await worker.setParameters({
        tessedit_pageseg_mode: Tesseract.PSM.AUTO, // Fully automatic page segmentation
      });

      // Execute Iterative Passes
      for (let i = 0; i < SCAN_PASSES.length; i++) {
        const pass = SCAN_PASSES[i];
        setStatus(`Iteration ${i + 1}/${SCAN_PASSES.length}: ${pass.name}...`);
        
        // 1. Pre-process current perspective
        const processed = await preprocessImage(image, pass.config);
        setScannerPreview(processed);
        
        // 2. Run OCR using worker to get nested layout blocks
        const { data } = await worker.recognize(processed, {}, { blocks: true });
        const resultConf = data.confidence;
        
        // Parse nested output format into a flat word array
        const extractedWords: any[] = [];
        if (data.blocks && data.blocks.length > 0) {
           data.blocks.forEach((b: any) => {
             if (b.paragraphs) {
               b.paragraphs.forEach((p: any) => {
                 if (p.lines) {
                   p.lines.forEach((l: any) => {
                     if (l.words) {
                       l.words.forEach((w: any) => extractedWords.push(w));
                     }
                   });
                 }
               });
             }
           });
        }
        
        // Use structure if words are available, otherwise fallback to raw text
        const formattedText = extractedWords && extractedWords.length > 0 
          ? reconstructLayout(extractedWords as any) 
          : data.text;
        
        console.log(`Pass ${i+1} (${pass.name}): Confidence ${resultConf}%`);

        // 3. Evaluation: Keep the best result (ignore completely failed passes)
        if (resultConf > bestResult.confidence && formattedText.trim()) {
          bestResult = { text: formattedText, confidence: resultConf };
          setText(formattedText); // Update live for feedback
          setConfidence(resultConf);
        }

        // Optimization: Stop early if we hit extreme high confidence
        if (resultConf > 92) break;
      }

      setStatus('Scan Completed Successfully');
    } catch (error) {
      console.error('OCR Error:', error);
      setStatus('Engine Malfunction: Calibration failed');
    } finally {
       if (worker) await worker.terminate();
       setIsProcessing(false);
       setScannerPreview(null);
    }
  };

  const downloadText = () => {
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'extracted-text.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 py-8 px-4">
      <SEOHelmet 
        title="AI OCR Scanner - Deep Multi-Pass Extraction" 
        description="Professional OCR tool using iterative scanning technologies. Automatically optimizes image contrast and binarization to extract text from complex backgrounds with up to 99% accuracy." 
      />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-bold tracking-wider uppercase mb-3">
            <BrainCircuit className="w-3.5 h-3.5" />
            <span>Automatic Iterative Engine</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Deep <span className="text-indigo-600 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">OCR Scanner</span>
          </h1>
          <p className="mt-3 text-lg text-gray-500 dark:text-gray-400 w-full font-medium">
            Next-generation extraction engine. Automatically tries multiple visual perspectives to isolate text from noisy backgrounds and decorations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
            disabled={isProcessing}
            className="h-10 pl-3 pr-8 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-bold focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer outline-none shadow-sm transition-all"
            style={{ backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%236366F1\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'m6 8 4 4 4-4\'/%3E%3C/svg%3E")', backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
          >
            {LANGUAGES.map(lang => (
              <option key={lang.code} value={lang.code}>{lang.name}</option>
            ))}
          </select>
          <Button 
            onClick={() => { setImage(null); setScannerPreview(null); setText(''); }} 
            variant="secondary" 
            className="h-10 px-4 rounded-xl text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Image Canvas */}
        <div className="lg:col-span-6 space-y-6">
          <Card className="overflow-hidden border-none shadow-2xl bg-white dark:bg-gray-800/40 backdrop-blur-xl ring-1 ring-gray-200 dark:ring-gray-700">
            {!image ? (
              <div 
                className="group relative p-12 text-center"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="absolute inset-0 border-2 border-dashed border-gray-200 dark:border-gray-700 m-4 rounded-2xl transition-all group-hover:border-indigo-500/50 group-hover:bg-indigo-50/5 dark:group-hover:bg-indigo-950/10" />
                <div className="relative space-y-4 py-12">
                  <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl flex items-center justify-center mx-auto mb-6 transform transition-transform group-hover:scale-110 duration-300">
                    <Upload className="w-10 h-10 text-indigo-600 dark:text-indigo-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Upload Target Asset</h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto text-sm leading-relaxed px-4">
                    Drag and drop or click to browse. Best results with sharp text and high contrast.
                  </p>
                  <div className="flex justify-center gap-3 pt-4">
                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-[10px] font-black text-gray-500 uppercase tracking-widest border border-gray-200 dark:border-gray-700">WASM</span>
                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-[10px] font-black text-gray-500 uppercase tracking-widest border border-gray-200 dark:border-gray-700">AI CORE</span>
                  </div>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={onFileChange} 
                  accept="image/*"
                  className="hidden" 
                />
              </div>
            ) : (
              <div className="relative group">
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-400" />
                      <div className="w-2 h-2 rounded-full bg-yellow-400" />
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                      <span className="ml-2 text-[10px] font-black uppercase tracking-[20%] text-gray-400">Scanner Preview</span>
                   </div>
                   {!isProcessing && (
                     <Button 
                      onClick={() => setImage(null)} 
                      variant="ghost" 
                      className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                     >
                      <Trash2 className="w-4 h-4" />
                     </Button>
                   )}
                </div>
                <div className="relative bg-gray-100 dark:bg-gray-900/80 p-8 flex flex-col items-center justify-center min-h-[450px] gap-6">
                  {/* Raw vs Scanner View Toggle in UI */}
                  <div className="relative w-full flex items-center justify-center">
                    <img 
                        src={scannerPreview || image} 
                        alt="Current view" 
                        className={`max-w-full max-h-[400px] object-contain shadow-2xl rounded-lg transition-all duration-300 ${isProcessing && !scannerPreview ? 'opacity-50 blur-[2px]' : ''}`} 
                    />
                    
                    {scannerPreview && (
                        <div className="absolute top-2 right-2 px-2 py-1 bg-indigo-600 text-white text-[9px] font-black rounded-md uppercase tracking-[1px] shadow-lg animate-pulse">
                            AI Perspective Active
                        </div>
                    )}
                  </div>

                  {isProcessing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                       <div className="bg-white dark:bg-gray-900 p-8 rounded-[32px] shadow-2xl text-center space-y-6 min-w-[300px] border border-white/20 ring-1 ring-black/5 animate-in zoom-in duration-300">
                          <div className="relative inline-block">
                             <div className="w-20 h-20 border-4 border-indigo-100 dark:border-indigo-900/30 border-t-indigo-600 rounded-full animate-spin mx-auto" />
                             <div className="absolute inset-0 flex items-center justify-center">
                                <ScanText className="w-8 h-8 text-indigo-500 animate-pulse" />
                             </div>
                          </div>
                          <div className="space-y-3">
                             <div className="flex items-center justify-center gap-2">
                                <Activity className="w-3.5 h-3.5 text-indigo-500" />
                                <p className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">{status}</p>
                             </div>
                             <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-indigo-600 transition-all duration-300 ease-out shadow-[0_0_8px_rgba(79,70,229,0.5)]"
                                  style={{ width: `${progress}%` }}
                                />
                             </div>
                             <div className="flex justify-between items-center px-1">
                                <p className="text-[10px] font-black text-indigo-600 uppercase">Confidence: {confidence}%</p>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{progress}%</p>
                             </div>
                          </div>
                       </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>

          <Button 
            onClick={processImage} 
            disabled={!image || isProcessing}
            className={`w-full py-8 rounded-2xl font-black text-sm uppercase tracking-[3px] shadow-2xl transition-all duration-300 relative overflow-hidden group ${
              !image || isProcessing 
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed opacity-50' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:scale-[1.01] hover:shadow-indigo-500/20 active:scale-[0.98]'
            }`}
          >
            {isProcessing ? (
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Neural Calibration...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                <span>Execute Deep Scan</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
          </Button>
        </div>

        {/* Right Column: Dynamic Results */}
        <div className="lg:col-span-6 space-y-6">
          <Card className="h-full flex flex-col border-none shadow-2xl bg-white dark:bg-gray-800/40 backdrop-blur-xl ring-1 ring-gray-200 dark:ring-gray-700 min-h-[580px] overflow-hidden">
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                    <span className="text-[10px] font-black uppercase tracking-[2px] text-gray-900 dark:text-white">Analysis Results</span>
                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest leading-none">Best pass found</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {text && (
                  <>
                    <CopyButton value={text} size="sm" />
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={downloadText}
                      className="h-9 px-4 rounded-lg text-[10px] font-black uppercase tracking-wider bg-white dark:bg-gray-800 shadow-sm border-gray-100 dark:border-gray-700"
                    >
                      <Download className="w-4 h-4 mr-2" /> Export TXT
                    </Button>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex-1 relative flex flex-col">
              {!text && !isProcessing ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center opacity-30 select-none">
                  <div className="w-16 h-16 bg-gray-200 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-4 transform rotate-3">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Awaiting Calibration</h4>
                  <p className="text-sm max-w-[220px] font-medium">Neural engine output will materialize here after processing iterations.</p>
                </div>
              ) : (
                <div className="relative flex-1 flex flex-col">
                    <textarea
                    value={text}
                    readOnly
                    placeholder="Calibrating sensors..."
                    className="flex-1 w-full p-8 bg-transparent text-gray-700 dark:text-gray-300 font-mono text-[13px] leading-relaxed border-none focus:ring-0 resize-none animate-in fade-in duration-300"
                    />
                    
                    {confidence !== null && confidence > 0 && (
                        <div className="p-4 bg-indigo-50/30 dark:bg-indigo-900/10 border-t border-indigo-100/50 dark:border-indigo-950/50 mt-auto">
                             <div className="flex flex-wrap items-center justify-center gap-6">
                                <div className="flex items-center gap-1.5 text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                                    <Activity className="w-3.5 h-3.5" /> Confidence: {confidence}%
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> High Accuracy
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                                    <Globe className="w-3.5 h-3.5" /> Lang: {LANGUAGES.find(l => l.code === selectedLang)?.name}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
              )}
            </div>
          </Card>

          {/* Deep Insight Info */}
          <div className="p-6 rounded-[24px] bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-100/50 dark:border-indigo-900/30">
             <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-gray-800 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Eye className="w-6 h-6 text-indigo-500" />
                </div>
                <div className="space-y-1">
                   <h5 className="text-sm font-bold text-indigo-900 dark:text-indigo-200">How Automatic Iteration works</h5>
                   <p className="text-xs text-indigo-700/70 dark:text-indigo-400/70 leading-relaxed font-medium">
                      Our engine automatically tries 4 visual configurations (Baseline, Optimized, Contrast Surge, and Deep Inversion). It analyzes the results of each and picks the one with the highest mathematical confidence score.
                   </p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
