import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileJson, 
  Database, 
  Table, 
  Download, 
  Upload, 
  Settings, 
  RefreshCcw, 
  ArrowRightLeft,
  Info,
  Check,
  Clipboard,
  Loader2,
  FileCode,
  FilePlus,
  Maximize2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SEOHelmet } from '../../components/SEOHelmet';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Input';
import { parseData, exportData, detectFormat, type SupportedFormat } from './utils';
import { useFilePaste } from '@/hooks/useFilePaste';
import { useToolStore } from '../../store/toolStore';

const FORMATS: { id: SupportedFormat; label: string; icon: any; color: string; bg: string; border: string }[] = [
  { id: 'json', label: 'JSON', icon: FileJson, color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  { id: 'csv', label: 'CSV', icon: Table, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  { id: 'excel', label: 'Excel', icon: Database, color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20' },
  { id: 'parquet', label: 'Parquet', icon: FileCode, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
];

const DELIMITERS = [
  { label: 'Comma (,)', value: ',' },
  { label: 'Semicolon (;)', value: ';' },
  { label: 'Tab (\\t)', value: '\t' },
  { label: 'Pipe (|)', value: '|' },
];

interface DataTableProps {
  data: any[];
  columns: string[];
  maxHeight?: string;
  limit?: number;
}

const DataTable = ({ data, columns, maxHeight = '650px', limit = 50 }: DataTableProps) => (
  <div className="group border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl shadow-2xl">
    <div className={`overflow-x-auto scrollbar-hide`} style={{ maxHeight }}>
      <table className="w-full text-left border-separate border-spacing-0">
        <thead className="sticky top-0 bg-gray-50/90 dark:bg-gray-800/90 backdrop-blur-md z-10">
          <tr>
            <th className="px-5 py-4 w-12 text-center text-[10px] font-black text-gray-400 border-b border-gray-100 dark:border-gray-800 uppercase tracking-widest">#</th>
            {columns.map(col => (
              <th key={col} className="px-6 py-4 text-xs font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800 min-w-[150px]">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                  {col}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
          {data.slice(0, limit).map((row, i) => (
            <tr key={i} className="hover:bg-brand-500/5 transition-colors group/row">
              <td className="px-5 py-4 text-center text-[10px] font-bold text-gray-400 bg-gray-50/30 dark:bg-gray-900/30 transition-colors group-hover/row:text-brand-600 italic">
                {i + 1}
              </td>
              {columns.map(col => (
                <td key={col} className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 font-mono tracking-tight">
                  <div className="max-h-20 overflow-hidden text-ellipsis line-clamp-2">
                    {row[col] === null || row[col] === undefined ? 
                      <span className="text-gray-300 dark:text-gray-600 font-sans italic opacity-50">null</span> : 
                      typeof row[col] === 'object' ? JSON.stringify(row[col]) : String(row[col])
                    }
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    {data.length > limit && (
      <div className="p-6 bg-gradient-to-t from-gray-50 to-transparent dark:from-gray-800/50 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 rounded-full border border-gray-100 dark:border-gray-800 shadow-sm text-xs font-bold text-gray-500">
          <Info className="w-3.5 h-3.5" />
          Showing top {limit} / {data.length.toLocaleString()} rows for optimal performance
        </div>
      </div>
    )}
  </div>
);

export default function DataConverter() {
  const setOutputGlobal = useToolStore(state => state.setOutput);

  const [inputData, setInputData] = useState<string | ArrayBuffer>('');
  const [inputText, setInputText] = useState('');
  const [inputFormat, setInputFormat] = useState<SupportedFormat>('json');
  const [outputFormat, setOutputFormat] = useState<SupportedFormat>('csv');
  const [delimiter, setDelimiter] = useState(',');
  
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const processInput = useCallback(async (content: string | ArrayBuffer, format: SupportedFormat) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await parseData(content, format, { delimiter });
      if (result.error) {
        setError(result.error);
        setParsedData([]);
      } else {
        setParsedData(result.data);
        setColumns(result.columns);
      }
    } catch (err: any) {
      setError(err.message || 'Processing failed');
    } finally {
      setIsLoading(false);
    }
  }, [delimiter]);

  const processFile = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const format = detectFormat(file.name);
      if (format) setInputFormat(format);

      let content: string | ArrayBuffer;
      if (format === 'excel' || format === 'parquet') {
        content = await file.arrayBuffer();
      } else {
        content = await file.text();
        setInputText(content as string);
      }
      setInputData(content);
      processInput(content, format || inputFormat);
    } catch (err: any) {
      setError(err.message || 'Failed to process file');
      setIsLoading(false);
    }
  }, [inputFormat, processInput]);

  useFilePaste((files) => {
    if (files.length > 0) processFile(files[0]);
  });

  const handleConvert = async () => {
    const dataToParse = inputFormat === 'excel' || inputFormat === 'parquet' ? inputData : inputText;
    if (!dataToParse) return;

    setIsLoading(true);
    setError(null);
    try {
      const result = await parseData(dataToParse, inputFormat, { delimiter });
      if (result.error) {
        setError(result.error);
        return;
      }

      const blob = await exportData(result.data, outputFormat, { delimiter });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `converted_data.${outputFormat === 'excel' ? 'xlsx' : outputFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      if (outputFormat === 'json' || outputFormat === 'csv') {
        const text = await blob.text();
        setOutputGlobal(text);
      }
    } catch (err: any) {
      setError(err.message || 'Conversion failed');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const dataToParse = inputFormat === 'excel' || inputFormat === 'parquet' ? inputData : inputText;
    if (dataToParse) {
      processInput(dataToParse, inputFormat);
    }
  }, [delimiter, inputFormat, processInput, inputData, inputText]);

  const swapFormats = () => {
    const prevInput = inputFormat;
    const prevOutput = outputFormat;
    setInputFormat(prevOutput);
    setOutputFormat(prevInput);
  };

  const loadSample = () => {
    const sampleText = JSON.stringify([
      { "id": 1, "name": "Project Ozone", "type": "Software", "active": true, "rating": 4.9 },
      { "id": 2, "name": "Data Stream", "type": 102, "active": false, "rating": "N/A" },
      { "id": 3, "name": "Vortex AI", "type": "Algorithm", "active": true, "rating": 4.8 }
    ], null, 2);
    setInputFormat('json');
    setOutputFormat('csv');
    setInputText(sampleText);
    processInput(sampleText, 'json');
  };

  const clearAll = () => {
    setInputData('');
    setInputText('');
    setParsedData([]);
    setColumns([]);
    setError(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const copyToClipboard = () => {
    if (!parsedData.length) return;
    navigator.clipboard.writeText(JSON.stringify(parsedData, null, 2));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
      <SEOHelmet 
        title="Ozone Data Converter Pro - JSON, CSV, Excel, Parquet" 
        description="Fast, secure, enterprise-grade data conversion between JSON, CSV, Excel, and Parquet. Client-side processing for ultimate privacy." 
      />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4 md:px-0">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 md:p-3 bg-brand-600 rounded-2xl shadow-lg shadow-brand-600/20">
              <RefreshCcw className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              Data Converter <span className="text-brand-600">Pro</span>
            </h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm md:text-lg ml-1">
            Transform heavy datasets with pixel-perfect precision.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
           <Button variant="secondary" onClick={loadSample} className="flex-1 md:flex-none gap-2 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 h-10 md:h-11">
             <FilePlus className="w-4 h-4 text-brand-600" />
             Sample Data
           </Button>
           <Button variant="secondary" onClick={clearAll} className="flex-1 md:flex-none gap-2 h-10 md:h-11">
             <RefreshCcw className="w-4 h-4" />
             Reset
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Configuration */}
        <div className="lg:col-span-12 xl:col-span-5 space-y-6">
          <Card className="border-brand-500/20 shadow-2xl shadow-brand-500/5 backdrop-blur-sm bg-white/80 dark:bg-gray-900/80">
            <CardHeader className="border-b border-gray-100 dark:border-gray-800/50">
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-brand-500" />
                Pipeline Config
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 md:space-y-8 p-4 md:p-8">
              
              {/* Premium Format Selectors */}
              <div className="space-y-6">
                <div className="space-y-3">
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">Input Source</span>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {FORMATS.map(f => (
                      <button
                        key={f.id}
                        onClick={() => {
                          setInputFormat(f.id);
                          if (inputText || inputData) processInput(inputFormat === 'excel' || inputFormat === 'parquet' ? inputData : inputText, f.id);
                        }}
                        className={`flex flex-col items-center gap-2 p-2.5 md:p-3 rounded-xl border-2 transition-all ${
                          inputFormat === f.id 
                            ? `${f.bg} ${f.border.replace('/20', '/100')} ${f.color} scale-[1.02] md:scale-105 shadow-md` 
                            : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-800 text-gray-400 grayscale hover:grayscale-0 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <f.icon className="w-4 h-4 md:w-5 md:h-5" />
                        <span className="text-[10px] font-bold uppercase">{f.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-center -my-3">
                  <button 
                    onClick={swapFormats}
                    className="p-2.5 md:p-3 bg-brand-600 text-white rounded-full hover:rotate-180 transition-all duration-500 shadow-lg shadow-brand-600/40 relative z-10"
                  >
                    <ArrowRightLeft className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">Output Target</span>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {FORMATS.map(f => (
                      <button
                        key={f.id}
                        onClick={() => setOutputFormat(f.id)}
                        className={`flex flex-col items-center gap-2 p-2.5 md:p-3 rounded-xl border-2 transition-all ${
                          outputFormat === f.id 
                            ? `${f.bg} ${f.border.replace('/20', '/100')} ${f.color} scale-[1.02] md:scale-105 shadow-md` 
                            : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-800 text-gray-400 grayscale hover:grayscale-0 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <f.icon className="w-4 h-4 md:w-5 md:h-5" />
                        <span className="text-[10px] font-bold uppercase">{f.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Delimiter Setting (with enhanced UI) */}
              <AnimatePresence>
                {(inputFormat === 'csv' || outputFormat === 'csv') && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100/50 dark:border-blue-900/20 space-y-3"
                  >
                     <label className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-2">
                       <Table className="w-3 h-3" />
                       CSV Separation Delimiter
                     </label>
                     <div className="flex flex-wrap gap-2">
                       {DELIMITERS.map(d => (
                         <button
                           key={d.value}
                           onClick={() => setDelimiter(d.value)}
                           className={`flex-1 min-w-[80px] py-2 rounded-lg text-xs font-bold border transition-all ${
                             delimiter === d.value 
                               ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                               : 'bg-white dark:bg-gray-800 border-blue-200 dark:border-blue-900/30 text-blue-400'
                           }`}
                         >
                           {d.label.split(' ')[0]}
                         </button>
                       ))}
                     </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* File Upload Zone */}
              <div className="relative group">
                <input 
                  type="file" 
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 group-hover:border-brand-500 rounded-3xl p-10 transition-all bg-gray-50/30 dark:bg-gray-800/30 flex flex-col items-center justify-center gap-4 text-center">
                  <div className="w-16 h-16 bg-white dark:bg-gray-900 rounded-2xl shadow-xl flex items-center justify-center border border-gray-100 dark:border-gray-800 group-hover:scale-110 group-hover:shadow-brand-500/20 transition-all">
                    <Upload className="w-8 h-8 text-brand-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-extrabold text-gray-900 dark:text-white">Upload working data</p>
                    <p className="text-sm text-gray-500 font-medium tracking-tight">Drop any JSON, CSV, XLSX, or PARQUET file</p>
                  </div>
                </div>
              </div>

              {/* Manual Editor for text-based formats */}
              {(inputFormat === 'json' || inputFormat === 'csv') && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Raw Input Data</label>
                    <span className="text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-full font-bold uppercase">Manual Editor</span>
                  </div>
                  <Textarea 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onBlur={() => processInput(inputText, inputFormat)}
                    placeholder={`Paste your code or text here...`}
                    className="font-mono text-[11px] leading-relaxed min-h-[180px] bg-gray-50/50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800 rounded-2xl focus:bg-white dark:focus:bg-gray-900 transition-all"
                  />
                </div>
              )}

              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-5 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl text-red-600 dark:text-red-400 text-sm flex items-start gap-4"
                >
                  <div className="p-1 bg-red-100 dark:bg-red-900/40 rounded-lg">
                    <Info className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold">Execution Error</p>
                    <p className="opacity-80 text-xs font-medium leading-relaxed">{error}</p>
                  </div>
                </motion.div>
              )}

              <Button 
                onClick={handleConvert} 
                className="w-full h-16 text-lg font-black gap-3 rounded-2xl bg-brand-600 hover:bg-brand-700 shadow-2xl shadow-brand-600/30 hover:-translate-y-1 transition-all active:scale-95"
                disabled={isLoading || (!inputText && !inputData)}
              >
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Download className="w-6 h-6" />}
                Process & Export
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Dynamic Preview */}
        <div className="lg:col-span-12 xl:col-span-7 space-y-6 ">
          <div className="sticky top-8 space-y-6">
            <Card className="border-none shadow-none bg-transparent p-6">
              <CardHeader className="bg-transparent border-none px-0 pt-0">
                <CardTitle className="flex flex-col md:flex-row md:items-center justify-between w-full gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-500 rounded-lg">
                      <Table className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-none">Live Inspector</h3>
                      <p className="text-[10px] text-gray-500 mt-1 uppercase font-black tracking-widest">Real-time Data Stream</p>
                    </div>
                  </div>
                  
                  {parsedData.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center h-10 px-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-800 text-xs font-bold text-gray-500">
                        {parsedData.length.toLocaleString()} records
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="secondary" size="sm" onClick={() => setIsExpanded(true)} className="h-10 w-10 p-0 rounded-xl bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                          <Maximize2 className="w-4 h-4" />
                        </Button>
                        <Button variant="secondary" size="sm" onClick={copyToClipboard} className="h-10 px-4 rounded-xl gap-2 font-bold bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-800">
                          {isCopied ? <Check className="w-4 h-4 text-green-500" /> : <Clipboard className="w-4 h-4" />}
                          {isCopied ? (window.innerWidth < 640 ? '' : 'Copied') : (window.innerWidth < 640 ? '' : 'JSON Copy')}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0">
                <AnimatePresence mode="wait">
                  {parsedData.length > 0 ? (
                    <motion.div 
                      key="data-present"
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -30 }}
                      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    >
                      <DataTable data={parsedData} columns={columns} />
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="no-data"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center justify-center min-h-[500px] border-4 border-dashed border-gray-100 dark:border-gray-800 rounded-[40px] bg-gray-50/20 dark:bg-gray-800/5 text-gray-400 relative overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-transparent animate-pulse" />
                      <div className="relative z-10 flex flex-col items-center gap-6">
                        <div className="relative">
                          <div className="absolute inset-0 blur-2xl bg-brand-500/20 rounded-full animate-pulse" />
                          <Database className="w-24 h-24 text-gray-200 dark:text-gray-800 group-hover:scale-110 transition-transform duration-700" />
                        </div>
                        <div className="text-center space-y-2">
                          <p className="text-2xl font-black text-gray-300 dark:text-gray-700 tracking-tight">Awaiting Data Streams</p>
                          <p className="text-sm font-medium opacity-50 max-w-[200px] mx-auto leading-relaxed">Load a source to start the real-time transformation pipeline.</p>
                        </div>
                        <div className="flex gap-4">
                          <Button variant="ghost" onClick={loadSample} className="text-brand-600 font-bold gap-2">
                             <FilePlus className="w-4 h-4" />
                             Try Samples
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Expanded Modal */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-8 bg-gray-950/40 backdrop-blur-xl"
            onClick={() => setIsExpanded(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full h-full max-w-7xl bg-white dark:bg-gray-900 rounded-2xl md:rounded-[40px] shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 md:p-8 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="p-2 md:p-3 bg-brand-600 rounded-xl md:rounded-2xl shadow-lg shadow-brand-600/20">
                    <Table className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg md:text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight leading-tight">Data Auditor</h2>
                    <p className="text-[10px] text-gray-500 font-bold mt-0.5">Full dataset inspection ({parsedData.length.toLocaleString()} records)</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsExpanded(false)}
                  className="p-2 md:p-4 bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-red-500 rounded-xl md:rounded-2xl transition-all"
                >
                  <X className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden p-2 md:p-8">
                 <DataTable data={parsedData} columns={columns} maxHeight="100%" limit={200} />
              </div>
              <div className="p-4 md:p-6 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800 flex justify-center">
                 <Button onClick={() => setIsExpanded(false)} className="w-full md:w-auto px-8 h-12 rounded-xl font-bold">
                    Exit Auditor View
                 </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feature Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pb-12">
        {FORMATS.map((f, i) => (
          <motion.div 
            key={f.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`group p-8 rounded-[32px] bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xl hover:shadow-2xl transition-all cursor-default overflow-hidden relative`}
          >
             <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
               <f.icon className="w-32 h-32" />
             </div>
             <div className={`p-4 w-fit rounded-2xl mb-6 shadow-inner ${f.bg} ${f.color}`}>
               <f.icon className="w-6 h-6" />
             </div>
             <h4 className="text-xl font-black text-gray-900 dark:text-white mb-2">{f.label} Protocols</h4>
             <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
               {f.id === 'parquet' && 'Enterprise-grade columnar storage format. Optimized for deep analytics and high-speed data retrieval.'}
               {f.id === 'excel' && 'Native spreadsheet synchronization. Maintains complex tabular hierarchies across legacy systems.'}
               {f.id === 'csv' && 'The universal bridge of data. Lightweight, human-readable, and compatible with literally everything.'}
               {f.id === 'json' && 'The nervous system of the web. Perfect for hierarchical documents and modern API exchange.'}
             </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
