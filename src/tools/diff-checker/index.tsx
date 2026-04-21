import { useState, useEffect } from 'react';
import { SEOHelmet } from '../../components/SEOHelmet';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Textarea } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { formatInput } from './utils';
import { DiffViewer } from './components/DiffViewer';
import type { Granularity } from './components/DiffViewer';
import {
  Columns, ListTree, RefreshCcw, ArrowRight, ArrowLeft,
  CaseSensitive, WholeWord, FileCode, Type, AlignLeft
} from 'lucide-react';

const GRANULARITIES: { id: Granularity; label: string; icon: typeof Type }[] = [
  { id: 'lines',     label: 'Line',      icon: AlignLeft },
  { id: 'words',     label: 'Word',      icon: WholeWord },
  { id: 'chars',     label: 'Char',      icon: CaseSensitive },
  { id: 'sentences', label: 'Sentence',  icon: FileCode },
];

export default function DiffChecker() {
  const [leftInput,  setLeftInput]  = useState('');
  const [rightInput, setRightInput] = useState('');
  const [isJsonMode, setIsJsonMode] = useState(false);
  const [viewMode,   setViewMode]   = useState<'split' | 'inline'>('split');
  const [granularity, setGranularity] = useState<Granularity>('lines');
  const [ignoreWS,   setIgnoreWS]   = useState(false);

  const [debouncedLeft,  setDebouncedLeft]  = useState('');
  const [debouncedRight, setDebouncedRight] = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedLeft(formatInput(leftInput, isJsonMode));
      setDebouncedRight(formatInput(rightInput, isJsonMode));
    }, 300);
    return () => clearTimeout(t);
  }, [leftInput, rightInput, isJsonMode]);

  const loadSampleData = () => {
    if (isJsonMode) {
      setLeftInput('{\n  "name": "John Doe",\n  "age": 30,\n  "role": "Developer"\n}');
      setRightInput('{\n  "name": "John Doe",\n  "age": 31,\n  "role": "Senior Developer",\n  "active": true\n}');
    } else {
      setLeftInput('The quick brown fox jumps over the lazy dog.\nHello World!\nThis line is unchanged.');
      setRightInput('The quick brown foxy jumps over the  lazy dog.\nHello React!\nThis line is unchanged.');
    }
  };

  const acceptLeftToRight = () => setRightInput(leftInput);
  const acceptRightToLeft = () => setLeftInput(rightInput);

  return (
    <div className="w-full mx-auto space-y-6 animate-in fade-in duration-500">
      <SEOHelmet
        title="Diff Checker — Line, Word & Character Compare"
        description="Compare text or JSON with side-by-side or inline diff. Switch between line, word, and character granularity with intra-line highlighting."
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Diff Checker</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">Compare text with line, word, or character granularity.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant={isJsonMode ? 'secondary' : 'ghost'} onClick={() => setIsJsonMode(!isJsonMode)}
            className={isJsonMode ? 'bg-brand-100 dark:bg-brand-900/30' : ''}>
            JSON Mode
          </Button>
          <Button variant={ignoreWS ? 'secondary' : 'ghost'} onClick={() => setIgnoreWS(!ignoreWS)}
            className={ignoreWS ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' : ''}>
            Ignore WS
          </Button>
          <Button variant="secondary" size="sm" onClick={loadSampleData}>Sample</Button>
          <Button variant="secondary" size="sm" onClick={() => { setLeftInput(''); setRightInput(''); }} className="gap-2">
            <RefreshCcw className="w-4 h-4" />Clear
          </Button>
        </div>
      </div>

      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Granularity */}
        <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1 gap-0.5">
          {GRANULARITIES.map(g => {
            const Icon = g.icon;
            return (
              <button key={g.id} onClick={() => setGranularity(g.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  granularity === g.id
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}>
                <Icon className="w-3.5 h-3.5" />{g.label}
              </button>
            );
          })}
        </div>

        {/* Split / Inline */}
        <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1 gap-0.5">
          <button onClick={() => setViewMode('split')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'split' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}>
            <Columns className="w-4 h-4" />Split
          </button>
          <button onClick={() => setViewMode('inline')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'inline' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}>
            <ListTree className="w-4 h-4" />Inline
          </button>
        </div>

        {/* Accept changes */}
        {(leftInput || rightInput) && (
          <div className="flex gap-2 ml-auto">
            <button
              onClick={acceptRightToLeft}
              title="Accept right → left (overwrite left with right)"
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-green-400 hover:text-green-600 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />Accept R→L
            </button>
            <button
              onClick={acceptLeftToRight}
              title="Accept left → right (overwrite right with left)"
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-green-400 hover:text-green-600 transition-colors"
            >
              Accept L→R<ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Input textareas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded font-mono">A</span>
              Original
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={leftInput}
              onChange={e => setLeftInput(e.target.value)}
              placeholder={`Paste original ${isJsonMode ? 'JSON' : 'text'} here...`}
              className="min-h-[220px] font-mono text-sm border-0 focus:ring-0 px-0 resize-y bg-transparent"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-0.5 rounded font-mono">B</span>
              Modified
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={rightInput}
              onChange={e => setRightInput(e.target.value)}
              placeholder={`Paste modified ${isJsonMode ? 'JSON' : 'text'} here...`}
              className="min-h-[220px] font-mono text-sm border-0 focus:ring-0 px-0 resize-y bg-transparent"
            />
          </CardContent>
        </Card>
      </div>

      {/* Diff result */}
      <Card>
        <CardHeader>
          <CardTitle>Comparison Result</CardTitle>
        </CardHeader>
        <CardContent className="p-0 pb-4">
          {(debouncedLeft || debouncedRight) ? (
            <DiffViewer
              oldString={debouncedLeft}
              newString={debouncedRight}
              viewType={viewMode}
              granularity={granularity}
              ignoreWhitespace={ignoreWS}
              isJson={isJsonMode}
            />
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg mx-4">
              Enter text in both panels above to see the comparison
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
