import { useState, useMemo, useEffect } from 'react';
import { SEOHelmet } from '../../components/SEOHelmet';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Textarea } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { CopyButton } from '../../components/ui/CopyButton';
import { ArrowLeftRight, DatabaseZap, Loader2, RefreshCcw } from 'lucide-react';
import { compressData, decompressData, getByteSize, formatBytes } from './utils';
import { useToolStore } from '../../store/toolStore';
import { ToolChainer } from '../../components/ToolChainer';

export default function CompressionTool() {
  const currentInput = useToolStore(state => state.currentInput);
  const setInputGlobal = useToolStore(state => state.setInput);
  const setOutputGlobal = useToolStore(state => state.setOutput);

  const [input, setInput] = useState(() => currentInput || '');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'compress' | 'decompress'>('compress');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Consume global input
  useEffect(() => {
    if (currentInput) {
      setInputGlobal(null);
    }
  }, [currentInput, setInputGlobal]);

  // Sync valid output back to store
  useEffect(() => {
    if (output) {
      setOutputGlobal(output);
    } else {
      setOutputGlobal(null);
    }
  }, [output, setOutputGlobal]);

  const toggleMode = () => {
    setMode(m => m === 'compress' ? 'decompress' : 'compress');
    setInput(output);
    setOutput('');
    setError(null);
  };

  const handleProcess = async () => {
    if (!input.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      if (mode === 'compress') {
        const result = await compressData(input);
        setOutput(result);
      } else {
        const result = await decompressData(input);
        setOutput(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during processing.');
      setOutput('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError(null);
  };

  const loadSampleData = () => {
    if (mode === 'compress') {
      setInput(JSON.stringify(Array.from({ length: 100 }).map((_, i) => ({
        id: i,
        name: `User ${i}`,
        email: `user${i}@example.com`,
        timestamp: new Date().toISOString(),
        isActive: i % 2 === 0
      })), null, 2));
    } else {
      // Small piece of sample compressed payload
      setInput('eJzj4lKwUyhPzSspVtJRgLByU1IqgVwhEBUbCwBymAob');
    }
  };

  const inputSize = useMemo(() => getByteSize(input), [input]);
  const outputSize = useMemo(() => getByteSize(output), [output]);
  const ratio = useMemo(() => {
    if (mode === 'compress' && inputSize > 0 && outputSize > 0) {
      return ((1 - (outputSize / inputSize)) * 100).toFixed(1);
    }
    return null;
  }, [mode, inputSize, outputSize]);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      <SEOHelmet 
        title={`Text & JSON ${mode === 'compress' ? 'Compressor' : 'Decompressor'} Online`}
        description="Compress or decompress text and JSON payloads instantly in your browser." 
      />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Compression Tool</h1>
          <p className="mt-1 text-gray-500">Gzip-compress text/JSON safely in your browser.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={toggleMode} variant="secondary" className="gap-2">
            <ArrowLeftRight className="w-4 h-4" />
            Switch to {mode === 'compress' ? 'Decompress' : 'Compress'}
          </Button>
          <Button variant="secondary" size="sm" onClick={loadSampleData}>
            Sample Data
          </Button>
          <Button variant="secondary" size="sm" onClick={handleClear} className="gap-2">
            <RefreshCcw className="w-4 h-4" />
            Clear
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle>Input ({mode === 'compress' ? 'Text/JSON' : 'Base64'})</CardTitle>
            <span className="text-sm font-mono text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
              {formatBytes(inputSize)}
            </span>
          </CardHeader>
          <CardContent>
            <Textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={`Paste ${mode === 'compress' ? 'data to compress' : 'base64 to decompress'} here...`}
              className="min-h-[350px] font-mono text-sm border-0 focus:ring-0 px-0 resize-y bg-transparent"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="flex items-center gap-2">
              Output ({mode === 'compress' ? 'Base64' : 'Text/JSON'})
              {output && <CopyButton value={output} />}
            </CardTitle>
            <div className="flex gap-2">
               {ratio && (
                <span className="text-sm font-mono font-medium text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded">
                  {ratio}% savings
                </span>
              )}
              <span className="text-sm font-mono text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                {formatBytes(outputSize)}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={output}
              readOnly
              placeholder="Output will appear here..."
              className={`min-h-[350px] border-0 focus:ring-0 px-0 resize-y bg-transparent font-mono text-sm ${
                mode === 'compress' ? 'text-brand-600 dark:text-brand-400 break-all' : ''
              }`}
            />
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg flex items-center justify-center">
          {error}
        </div>
      )}

      <div className="flex justify-center">
        <Button 
          size="lg" 
          onClick={handleProcess} 
          disabled={!input.trim() || isLoading}
          className="w-full sm:w-auto min-w-[200px] gap-2"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <DatabaseZap className="w-5 h-5" />}
          {mode === 'compress' ? 'Compress Data' : 'Decompress Data'}
        </Button>
      </div>

      <ToolChainer currentToolId="compression-tool" />
    </div>
  );
}
