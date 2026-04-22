'use client';

import { useState, useEffect } from 'react';
import { useFilePaste } from '@/hooks/useFilePaste';
import { SEOHelmet } from '../../components/SEOHelmet';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Textarea } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Table, BarChart2, Upload, Loader2, Play, RefreshCcw } from 'lucide-react';
import { parseData } from './utils';
import { DataTable } from './components/DataTable';
import { DataCharts } from './components/DataCharts';
import { useToolStore } from '../../store/toolStore';
import { ToolChainer } from '../../components/ToolChainer';

export default function DataVisualizer() {
  const currentInput = useToolStore(state => state.currentInput);
  const setInputGlobal = useToolStore(state => state.setInput);
  const setOutputGlobal = useToolStore(state => state.setOutput);

  const [input, setInput] = useState(() => currentInput || '');
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [view, setView] = useState<'table' | 'chart'>('table');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = (file: File) => {
    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      setInput(content);
      // Automatically process after uploading
      try {
        const result = await parseData(content);
        if (result.error) {
           setError(result.error);
        } else {
           setData(result.data);
           setColumns(result.columns);
        }
      } catch (err) {
        setError('Error reading file.');
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      setError('Error reading file.');
      setIsLoading(false);
    };
    reader.readAsText(file);
  };

  useFilePaste((files) => {
    const file = files[0];
    if (file && (file.name.endsWith('.json') || file.name.endsWith('.csv') || file.type === 'application/json' || file.type === 'text/csv' || file.type === 'text/plain')) {
      processFile(file);
    }
  });

  // Consume global input
  useEffect(() => {
    if (currentInput) {
      setInputGlobal(null);
      // Auto process if there's input
      handleProcess();
    }
  }, [currentInput]);

  // Sync valid output back to store
  useEffect(() => {
    if (data && data.length > 0) {
      setOutputGlobal(JSON.stringify(data, null, 2));
    } else {
      setOutputGlobal(null);
    }
  }, [data, setOutputGlobal]);

  const handleProcess = async () => {
    if (!input.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await parseData(input);
      if (result.error) {
        setError(result.error);
        setData([]);
        setColumns([]);
      } else {
        setData(result.data);
        setColumns(result.columns);
      }
    } catch (err) {
      setError('An error occurred while processing data.');
      setData([]);
      setColumns([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
    e.target.value = ''; // Reset input
  };

  const handleClear = () => {
    setInput('');
    setData([]);
    setColumns([]);
    setError(null);
  };

  const loadSampleData = () => {
    const csv = `id,name,aggr_score,active,role,department\n1,Alice,85,true,Engineering,Backend\n2,Bob,92,true,Engineering,Frontend\n3,Charlie,78,false,Marketing,SEO\n4,David,88,true,Design,UI\n5,Eve,95,true,Engineering,DevOps`;
    setInput(csv);
  };

  return (
    <div className="w-full mx-auto space-y-6 animate-in fade-in duration-500">
      <SEOHelmet 
        title="Free JSON & CSV Data Visualizer Online" 
        description="Visualize, filter, and chart JSON and CSV datasets directly in your browser without uploading." 
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Data Visualizer</h1>
          <p className="mt-1 text-gray-500">Transform JSON/CSV into tables and charts.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {data.length > 0 && (
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mr-4">
              <button
                onClick={() => setView('table')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  view === 'table' 
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Table className="w-4 h-4" />
                Table
              </button>
              <button
                onClick={() => setView('chart')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  view === 'chart' 
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <BarChart2 className="w-4 h-4" />
                Chart
              </button>
            </div>
          )}
          <Button variant="secondary" size="sm" onClick={loadSampleData}>
            Sample CSV
          </Button>
          <Button variant="secondary" size="sm" onClick={handleClear} className="gap-2">
            <RefreshCcw className="w-4 h-4" />
            Clear
          </Button>
        </div>
      </div>

      {!data.length && (
        <Card className="w-full mx-auto mt-8">
          <CardHeader>
            <CardTitle>Input Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors w-full cursor-pointer relative">
              <input 
                type="file" 
                accept=".json,.csv"
                onChange={handleFileUpload} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="text-center flex flex-col items-center">
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="font-medium text-gray-900 dark:text-gray-100">Upload JSON or CSV File</span>
                <span className="text-sm text-gray-500 mt-1">Files are processed instantly on your device</span>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200 dark:border-gray-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-gray-900 px-2 text-gray-500">Or paste raw text</span>
              </div>
            </div>
            
            <Textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Paste raw JSON or CSV data here..."
              className="font-mono text-sm min-h-[200px]"
            />

            {error && (
              <div className="text-sm text-red-500 mt-2">{error}</div>
            )}
            
            <Button onClick={handleProcess} className="w-full gap-2" disabled={isLoading || !input.trim()}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Process Data
            </Button>
          </CardContent>
        </Card>
      )}

      {data.length > 0 && (
        <div className="animate-in slide-in-from-bottom-4 duration-500">
          {view === 'table' ? (
             <DataTable data={data} columns={columns} />
          ) : (
             <DataCharts data={data} columns={columns} />
          )}
        </div>
      )}

      <ToolChainer currentToolId="data-visualizer" />
    </div>
  );
}
