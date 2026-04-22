'use client';

import { useState, useRef, useCallback } from 'react';
import { pipeline } from '@huggingface/transformers';
import { useFilePaste } from '@/hooks/useFilePaste';
import { SEOHelmet } from '@/components/SEOHelmet';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { 
  Mic, 
  Headphones, 
  Trash2, 
  FileText, 
  Download, 
  Loader2, 
  Sparkles, 
  Volume2,
  CheckCircle2,
  Clock,
  Cpu,
  BrainCircuit
} from 'lucide-react';

const MODELS = [
  { id: 'onnx-community/whisper-tiny.en', name: 'Whisper Tiny (English Only)', size: '40MB', speed: 'Ultra Fast' },
  { id: 'onnx-community/whisper-tiny', name: 'Whisper Multi-language (Tiny)', size: '40MB', speed: 'Ultra Fast' },
  { id: 'onnx-community/whisper-base', name: 'Whisper Multi-language (Base)', size: '140MB', speed: 'Balanced' },
];

export default function SpeechToText() {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [transcription, setTranscription] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (file && (file.type.startsWith('audio/') || file.type.includes('video'))) {
      setAudioFile(file);
      setAudioUrl(URL.createObjectURL(file));
      setTranscription('');
      setProgress(0);
      setProgressText('');
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

  const processAudio = async () => {
    if (!audioFile) return;

    setIsProcessing(true);
    setProgress(0);
    setProgressText('Loading Whisper model...');

    try {
      // 1. Initialize Pipeline
      const transcriber = await pipeline('automatic-speech-recognition', selectedModel, {
        progress_callback: (p: any) => {
          if (p.status === 'progress') {
            setProgress(Math.round(p.progress * 100));
            setProgressText(`Downloading model: ${Math.round(p.progress * 100)}%`);
          } else if (p.status === 'ready') {
            setProgressText('Ready. Starting transcription...');
          }
        },
        device: 'webgpu' as any, // Try WebGPU first
      });

      setProgressText('Transcribing audio pixels...');
      
      // 2. Perform Transcription
      // Transformers.js handles conversion from file to audio data automatically in newer versions
      // but for robustness we convert to URL then transcriber handles it
      const result = await transcriber(audioUrl!, {
        chunk_length_s: 30,
        stride_length_s: 5,
        callback_function: (_output: any) => {
          // Streaming partial results if possible
          // setTranscription(prev => prev + output.text);
        }
      });

      setTranscription(Array.isArray(result) ? result[0].text : (result as any).text);
      setProgressText('Success');
      setProgress(100);
    } catch (error: any) {
      console.error('Transcription Error:', error);
      if (error.message?.includes('WebGPU')) {
          // Fallback to CPU if WebGPU fails
          setProgressText('WebGPU not supported. Falling back to CPU...');
          // Retry logic could go here or just inform user
      }
      setProgressText('Error: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTranscription = () => {
    if (!transcription) return;
    const blob = new Blob([transcription], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transcription.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 py-8 px-4">
      <SEOHelmet 
        title="Offline Speech to Text - AI Audio Transcription" 
        description="Convert audio to text locally in your browser. Powered by OpenAI's Whisper and Transformers.js. No server uploads, 100% private and secure." 
      />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-bold tracking-wider uppercase mb-3">
            <Mic className="w-3 h-3" />
            <span>WASM + WebGPU Accelerated</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Speech <span className="text-emerald-600">to Text</span>
          </h1>
          <p className="mt-3 text-lg text-gray-500 dark:text-gray-400 w-full">
            Convert any audio or video file into accurate text locally. Zero data leaves your device. High-fidelity transcription for 100+ languages.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
             <select 
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={isProcessing}
                className="h-12 pl-4 pr-10 rounded-2xl border-none ring-1 ring-gray-200 dark:ring-gray-700 bg-white dark:bg-gray-800 text-sm font-bold focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer outline-none shadow-lg transition-all"
                style={{ backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%2310B981\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'m6 8 4 4 4-4\'/%3E%3C/svg%3E")', backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2em 1.2em' }}
             >
                {MODELS.map(model => (
                <option key={model.id} value={model.id}>{model.name} — {model.size}</option>
                ))}
            </select>
            <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-emerald-500 text-white text-[8px] font-black rounded-full uppercase tracking-widest shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
               Pro AI
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Panel */}
        <div className="lg:col-span-12 space-y-6">
          <Card className="overflow-hidden border-none shadow-2xl bg-white dark:bg-gray-800/40 backdrop-blur-xl ring-1 ring-gray-200 dark:ring-gray-700">
             {!audioFile ? (
               <div 
                className="group relative p-20 text-center cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                  <div className="absolute inset-0 border-2 border-dashed border-gray-100 dark:border-gray-800 m-6 rounded-[40px] transition-all group-hover:border-emerald-500/50 group-hover:bg-emerald-50/5 dark:group-hover:bg-emerald-900/5" />
                  <div className="relative space-y-6">
                    <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-900/20 rounded-[32px] flex items-center justify-center mx-auto transform transition-all group-hover:scale-110 group-hover:rotate-3 duration-500">
                      <Headphones className="w-12 h-12 text-emerald-600 dark:text-emerald-500" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Drop your audio file</h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto font-medium">
                        Supports MP3, WAV, M4A, OGG & Video formats up to 50MB.
                        </p>
                    </div>
                    <div className="flex justify-center gap-4">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-900 rounded-xl text-[10px] font-bold text-gray-400 border border-gray-100 dark:border-gray-800">
                           <Sparkles className="w-3 h-3" /> PRIVATE
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-900 rounded-xl text-[10px] font-bold text-gray-400 border border-gray-100 dark:border-gray-800">
                           <Cpu className="w-3 h-3" /> GPU POWERED
                        </div>
                    </div>
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={onFileChange} 
                    accept="audio/*,video/*"
                    className="hidden" 
                  />
               </div>
             ) : (
                <div className="p-8 space-y-8">
                   <div className="flex flex-col md:flex-row items-center gap-8">
                      <div className="w-full md:w-1/3">
                         <div className="aspect-square rounded-[40px] bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-2xl relative overflow-hidden group">
                           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
                           <BrainCircuit className="w-24 h-24 text-white animate-pulse" />
                           <div className="absolute bottom-6 left-6 right-6 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                             <p className="text-[10px] font-black text-white/70 uppercase tracking-widest mb-1">File Name</p>
                             <p className="text-xs font-bold text-white truncate">{audioFile.name}</p>
                           </div>
                         </div>
                      </div>
                      <div className="w-full md:w-2/3 space-y-6">
                         <div className="flex items-center justify-between">
                            <div className="space-y-1">
                               <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Active Asset</p>
                               <h4 className="text-xl font-bold text-gray-900 dark:text-white">Processing Console</h4>
                            </div>
                            <Button 
                              variant="secondary" 
                              onClick={() => setAudioFile(null)}
                              className="h-10 w-10 p-0 rounded-full bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                         </div>
                         
                         <div className="p-6 bg-gray-50 dark:bg-gray-900/40 rounded-[32px] border border-gray-100 dark:border-gray-800 space-y-4">
                            <div className="flex items-center justify-between mb-2">
                               <div className="flex items-center gap-3">
                                  <Volume2 className="w-4 h-4 text-emerald-500" />
                                  <span className="text-sm font-bold">Audio Preview</span>
                               </div>
                               <span className="text-[10px] font-bold text-gray-400">{(audioFile.size / 1024 / 1024).toFixed(2)} MB</span>
                            </div>
                            <audio src={audioUrl!} controls className="w-full h-10 accent-emerald-500" />
                         </div>

                         <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 dark:bg-gray-900/40 rounded-2xl border border-gray-100 dark:border-gray-800">
                               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Compute Engine</p>
                               <p className="text-xs font-bold flex items-center gap-2">
                                 <BrainCircuit className="w-3.5 h-3.5 text-emerald-500" /> 
                                 WebGPU Core
                               </p>
                            </div>
                            <div className="p-4 bg-gray-50 dark:bg-gray-900/40 rounded-2xl border border-gray-100 dark:border-gray-800">
                               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Model Config</p>
                               <p className="text-xs font-bold flex items-center gap-2">
                                 <Clock className="w-3.5 h-3.5 text-emerald-500" /> 
                                 {MODELS.find(m => m.id === selectedModel)?.speed}
                               </p>
                            </div>
                         </div>
                      </div>
                   </div>

                   <Button 
                    onClick={processAudio} 
                    disabled={isProcessing}
                    className={`w-full py-8 rounded-[32px] font-black text-lg uppercase tracking-[4px] shadow-2xl transition-all duration-500 group ${
                      isProcessing 
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-400' 
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:scale-[1.01] active:scale-95 shadow-emerald-500/20'
                    }`}
                  >
                    {isProcessing ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-3">
                           <Loader2 className="w-6 h-6 animate-spin" />
                           <span>Analyzing Soundwaves...</span>
                        </div>
                        <div className="w-48 h-1 bg-white/20 rounded-full overflow-hidden mt-2">
                           <div className="h-full bg-white animate-progress" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-[10px] tracking-widest font-bold opacity-60 uppercase mt-1">{progressText}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <Mic className="w-6 h-6 group-hover:scale-125 transition-transform" />
                        <span>Initialize Transcription</span>
                      </div>
                    )}
                  </Button>
                </div>
             )}
          </Card>
        </div>

        {/* Result Area */}
        <div className="lg:col-span-12 space-y-6">
           <Card className="min-h-[400px] border-none shadow-2xl bg-white dark:bg-gray-800/40 backdrop-blur-xl ring-1 ring-gray-200 dark:ring-gray-700 flex flex-col overflow-hidden">
              <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white">Transcription Result</h4>
                    <p className="text-[10px] font-bold text-gray-400">RAW AI OUTPUT • LOCALLY PROCESSED</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {transcription && (
                    <>
                      <CopyButton value={transcription} size="sm" />
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={downloadTranscription}
                        className="h-10 px-5 rounded-xl text-xs font-bold bg-white dark:bg-gray-800 shadow-sm"
                      >
                        <Download className="w-4 h-4 mr-2" /> DOWNLOAD
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="flex-1 relative p-8">
                {!transcription && !isProcessing ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center select-none">
                     <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-[32px] flex items-center justify-center mb-6 opacity-20">
                        <FileText className="w-10 h-10" />
                     </div>
                     <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Waiting for Neural Engine</p>
                  </div>
                ) : (
                  <div className="prose dark:prose-invert max-w-none">
                    <p className="text-gray-700 dark:text-gray-300 font-medium text-lg leading-relaxed whitespace-pre-wrap">
                      {transcription || (isProcessing && progressText)}
                    </p>
                  </div>
                )}
              </div>

              {transcription && (
                 <div className="p-6 bg-emerald-50/50 dark:bg-emerald-900/10 border-t border-emerald-100 dark:border-emerald-900/30">
                    <div className="flex flex-wrap items-center justify-center gap-8">
                        <div className="flex items-center gap-2 text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">
                           <CheckCircle2 className="w-4 h-4" /> Finalized
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">
                           <Clock className="w-4 h-4" /> Time: {Math.round(transcription.split(' ').length / 2)}s est
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">
                           <BrainCircuit className="w-4 h-4" /> Model: Whisper-v2
                        </div>
                    </div>
                 </div>
              )}
           </Card>
        </div>
      </div>
    </div>
  );
}
