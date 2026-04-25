'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { SEOHelmet } from '../../components/SEOHelmet';
import { toolRegistry } from '@/tools/toolRegistry';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { CopyButton } from '../../components/ui/CopyButton';
import { FileDown, AlertTriangle } from 'lucide-react';
import { useToolStore } from '../../store/toolStore';
import { ToolChainer } from '../../components/ToolChainer';
import { Textarea } from '../../components/ui/Input';
import { trackEvent } from '../../lib/analytics';
import { Toggle } from '../../components/ui/Toggle';
import { Search, X, CheckCircle, Code2, CornerDownRight, ChevronRight, ChevronDown, Check, Copy } from 'lucide-react';
import { cn } from '../../components/ui/Button';
import { FixedSizeList as List } from 'react-window';

// --- Utilities ---

const repairJson = (str: string): string => {
  let repaired = str.trim();
  
  // 1. Fix unquoted keys (js object notation)
  // Match keys that start with letter/underscore/dollar and are not quoted
  repaired = repaired.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)(\s*:)/g, '$1"$2"$3');
  
  // 2. Convert single quotes to double quotes (only for strings, not within existing double quotes)
  // This is tricky for nested quotes, but handles simple case
  repaired = repaired.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, '"$1"');
  
  // 3. Remove trailing commas in objects and arrays
  repaired = repaired.replace(/,\s*([}\]])/g, '$1');
  
  // 4. Handle undefined/NaN
  repaired = repaired.replace(/:\s*undefined/g, ': null');
  repaired = repaired.replace(/:\s*NaN/g, ': null');

  return repaired;
};

interface JsonRow {
  path: string;
  key: string | null;
  value: any;
  type: string;
  indent: number;
  isExpandable: boolean;
  isArrayItem: boolean;
  itemIndex?: number;
}

const flattenJson = (
  data: any,
  path = '',
  indent = 0,
  rows: JsonRow[] = [],
  visited = new Set()
): JsonRow[] => {
  const type = data === null ? 'null' : typeof data;
  const isArray = Array.isArray(data);
  const isObject = type === 'object' && !isArray && data !== null;

  if (isObject || isArray) {
    if (visited.has(data)) {
      rows.push({ path, key: null, value: '[Circular Reference]', type: 'circular', indent, isExpandable: false, isArrayItem: false });
      return rows;
    }
    visited.add(data);
  }

  if (isArray) {
    rows.push({ path, key: null, value: '[', type: 'array_start', indent, isExpandable: true, isArrayItem: false });
    data.forEach((item, i) => {
      const itemPath = path ? `${path}[${i}]` : `[${i}]`;
      flattenJson(item, itemPath, indent + 1, rows, visited);
    });
    rows.push({ path, key: null, value: ']', type: 'array_end', indent, isExpandable: false, isArrayItem: false });
  } else if (isObject) {
    rows.push({ path, key: null, value: '{', type: 'object_start', indent, isExpandable: true, isArrayItem: false });
    Object.keys(data).forEach((key) => {
      const itemPath = path ? `${path}.${key}` : key;
      const isComplex = typeof data[key] === 'object' && data[key] !== null;
      
      if (!isComplex) {
        rows.push({ path: itemPath, key, value: data[key], type: data[key] === null ? 'null' : typeof data[key], indent: indent + 1, isExpandable: false, isArrayItem: false });
      } else {
        rows.push({ path: itemPath, key, value: null, type: 'key_only', indent: indent + 1, isExpandable: false, isArrayItem: false });
        flattenJson(data[key], itemPath, indent + 1, rows, visited);
      }
    });
    rows.push({ path, key: null, value: '}', type: 'object_end', indent, isExpandable: false, isArrayItem: false });
  } else {
    // Basic root value
    rows.push({ path, key: null, value: data, type, indent, isExpandable: false, isArrayItem: false });
  }

  return rows;
};


// Helper for type highlighting
const ValueDisplay = ({ 
  row, 
  showTypes, 
  showPaths,
  searchTerm, 
  onCopyPath 
}: { 
  row: JsonRow, 
  showTypes: boolean, 
  showPaths: boolean,
  searchTerm: string, 
  onCopyPath: (path: string) => void 
}) => {
  const { key, value, type, indent, path } = row;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopyPath(path);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highlight = (text: string) => {
    if (!searchTerm) return text;
    const parts = String(text).split(new RegExp(`(${searchTerm})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === searchTerm.toLowerCase() 
        ? <span key={i} className="bg-yellow-200 dark:bg-yellow-800/50 text-black dark:text-white px-0.5 rounded">{part}</span> 
        : part
    );
  };

  const renderValueByStyle = () => {
    if (type === 'string') return <span className="text-green-600 dark:text-green-400">"{highlight(value)}"</span>;
    if (type === 'number') return <span className="text-blue-600 dark:text-blue-400">{value}</span>;
    if (type === 'boolean') return <span className="text-purple-600 dark:text-purple-400 font-medium">{String(value)}</span>;
    if (type === 'null') return <span className="text-gray-400 italic">null</span>;
    if (type === 'array_start' || type === 'array_end' || type === 'object_start' || type === 'object_end') {
      return <span className="text-gray-500 font-bold">{value}</span>;
    }
    return <span className="text-gray-700 dark:text-gray-300">{highlight(String(value))}</span>;
  };

  return (
    <div 
      className="group flex items-center py-0.5 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors cursor-default whitespace-pre"
      style={{ paddingLeft: `${indent * 1.5}rem` }}
    >
      {key && (
        <>
          <span 
            className={cn(
              "text-indigo-600 dark:text-indigo-400 font-semibold",
              showPaths ? "cursor-pointer hover:underline decoration-brand-500/50 underline-offset-4" : "cursor-default"
            )}
            onClick={() => showPaths && handleCopy()}
            title={showPaths ? "Click to copy JSON path" : undefined}
          >
            "{highlight(key)}"
          </span>
          <span className="text-gray-400 mx-1">:</span>
        </>
      )}
      
      {renderValueByStyle()}

      {showTypes && (type !== 'array_start' && type !== 'array_end' && type !== 'object_start' && type !== 'object_end' && type !== 'key_only' && type !== 'circular') && (
        <span className="ml-2 text-[10px] uppercase tracking-wider text-gray-400 bg-gray-100 dark:bg-gray-800 px-1 rounded border dark:border-gray-700">
          {type}
        </span>
      )}
      
      {showPaths && (
        <button 
          className={cn(
            "opacity-0 group-hover:opacity-100 ml-2 p-1 rounded-md transition-all duration-200",
            copied ? "text-green-500 bg-green-50 dark:bg-green-950/30" : "text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-950/30"
          )}
          onClick={handleCopy}
        >
          {copied ? (
            <div className="flex items-center gap-1 text-[10px] font-bold px-1">
              <Check className="w-3 h-3" />
              <span>Copied!</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[10px] font-bold px-1">
              <Copy className="w-3 h-3" />
              <span>Copy Path</span>
            </div>
          )}
        </button>
      )}
    </div>
  );
};

export default function JsonFormatter() {
  const currentInput = useToolStore(state => state.currentInput);
  const setInputGlobal = useToolStore(state => state.setInput);
  const setOutputGlobal = useToolStore(state => state.setOutput);

  const [input, setInput] = useState(() => currentInput || '');
  const [debouncedInput, setDebouncedInput] = useState('');
  const [showTypes, setShowTypes] = useState(false);
  const [showPaths, setShowPaths] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const tool = toolRegistry.find(t => t.id === 'json-formatter')!;
  const [needsFix, setNeedsFix] = useState(false);
  const [collapsedPaths, setCollapsedPaths] = useState<Set<string>>(new Set());

  const [containerNode, setContainerNode] = useState<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerNode) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setContainerSize({ width, height });
    });
    observer.observe(containerNode);
    return () => observer.disconnect();
  }, [containerNode]);

  // Consume global input once

  // Consume global input once
  useEffect(() => {
    if (currentInput) {
      setInputGlobal(null);
    }
  }, [currentInput, setInputGlobal]);

  // Debouncing heavy JSON parsing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedInput(input);
      // Check if it might need a fix
      if (input.trim()) {
        try {
          JSON.parse(input);
          setNeedsFix(false);
        } catch (e) {
          // If parsing fails, see if repairing it would help
          try {
            const repaired = repairJson(input);
            JSON.parse(repaired);
            setNeedsFix(true);
          } catch (e2) {
            setNeedsFix(false); 
          }
        }
      } else {
        setNeedsFix(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [input]);

  const parsedJson = useMemo(() => {
    if (!debouncedInput.trim()) return null;
    try { return JSON.parse(debouncedInput); } catch (e) { return e; }
  }, [debouncedInput]);

  const isValid = parsedJson && !(parsedJson instanceof Error);
  const formattedString = isValid ? JSON.stringify(parsedJson, null, 2) : '';

  const flatRows = useMemo(() => {
    if (!isValid) return [];
    // For very large JSON, flattening is heavy, but much better than recursive components
    return flattenJson(parsedJson);
  }, [parsedJson, isValid]);

  const filteredRows = useMemo(() => {
    // 1. First filter by collapsed paths
    let rows = flatRows;
    if (collapsedPaths.size > 0) {
      rows = flatRows.filter(row => {
        // If any of the row's parent paths are collapsed, hide it
        // A parent path for 'a.b.c' would be 'a' or 'a.b'
        for (const collapsedPath of collapsedPaths) {
          if (row.path.startsWith(collapsedPath + '.') || row.path.startsWith(collapsedPath + '[')) {
            return false;
          }
        }
        return true;
      });
    }

    // 2. Then filter by search term if present
    if (!searchTerm) return rows;
    const term = searchTerm.toLowerCase();
    return rows.filter(row => 
      (row.key && row.key.toLowerCase().includes(term)) || 
      (row.type !== 'array_start' && row.type !== 'array_end' && row.type !== 'object_start' && row.type !== 'object_end' && String(row.value).toLowerCase().includes(term))
    );
  }, [flatRows, searchTerm, collapsedPaths]);

  // Sync valid output to global store
  useEffect(() => {
    if (isValid && debouncedInput.trim()) {
      setOutputGlobal(formattedString);
      trackEvent("tool_used", {
        tool: "json-formatter",
        input_size: debouncedInput.length
      });
    } else {
      setOutputGlobal(null);
    }
  }, [formattedString, isValid, debouncedInput, setOutputGlobal]);

  const downloadJson = () => {
    if (!isValid) return;
    const blob = new Blob([formattedString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'formatted.json'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleApplyFix = () => {
    const fixed = repairJson(input);
    setInput(fixed);
    setNeedsFix(false);
    trackEvent('json_fixed', { tool: 'json-formatter' });
  };

  const toggleCollapse = (path: string) => {
    setCollapsedPaths(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const expandAll = () => {
    setCollapsedPaths(new Set());
    trackEvent('expand_all_clicked', { tool: 'json-formatter' });
  };

  const collapseAll = () => {
    // Collapse all object/array starts
    const allCollapsible = flatRows
      .filter(r => r.type === 'object_start' || r.type === 'array_start')
      .map(r => r.path);
    setCollapsedPaths(new Set(allCollapsible));
    trackEvent('collapse_all_clicked', { tool: 'json-formatter' });
  };

  const copyPath = (path: string) => {
    navigator.clipboard.writeText(path);
  };

  return (
    <div className="w-full mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pt-8 px-4 flex flex-col min-h-[85vh]">
      <SEOHelmet title="Pro JSON Formatter & Search" description="High-performance JSON viewer with search, path copying, and auto-fix capabilities." />
      
      <Breadcrumbs />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-brand-500/20">
             <tool.icon className="w-3 h-3" />
             <span>Professional Dev Tools</span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white">
             {tool.name.split(' ')[0]} <span className="text-brand-500">{tool.name.split(' ').slice(1).join(' ')}</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium">
             {tool.description}
          </p>
        </div>
      </div>

        <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-gray-800 p-1.5 px-3 rounded-xl border shadow-sm">
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" className="h-8 px-2 text-[10px] uppercase font-bold" onClick={expandAll}>Expand All</Button>
            <Button size="sm" variant="ghost" className="h-8 px-2 text-[10px] uppercase font-bold" onClick={collapseAll}>Collapse All</Button>
          </div>
          <div className="h-4 w-[1px] bg-gray-200 dark:bg-gray-700 hidden sm:block" />
          <Toggle 
            label="Paths" 
            checked={showPaths} 
            onChange={(e) => setShowPaths(e.target.checked)} 
            className="scale-90"
          />
          <div className="h-4 w-[1px] bg-gray-200 dark:bg-gray-700 hidden sm:block" />
          <Toggle 
            label="Types" 
            checked={showTypes} 
            onChange={(e) => setShowTypes(e.target.checked)} 
            className="scale-90"
          />
          <div className="h-4 w-[1px] bg-gray-200 dark:bg-gray-700 hidden sm:block" />
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-brand-500" />
            <input 
              type="text" 
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-8 py-1.5 text-sm bg-gray-50 dark:bg-gray-900 border-none focus:ring-1 focus:ring-brand-500 rounded-lg w-32 md:w-48 transition-all"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

      {needsFix && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-2xl flex items-center justify-between animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 dark:bg-amber-800 p-2 rounded-full">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">Invalid JSON detected</p>
              <p className="text-xs text-amber-700 dark:text-amber-400">It looks like a JS object or has syntax errors. I can fix it for you.</p>
            </div>
          </div>
          <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white border-none" onClick={handleApplyFix}>
            <CheckCircle className="w-4 h-4 mr-2" /> Fix and Format
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-[600px]">
        <Card className="flex flex-col h-full rounded-2xl overflow-hidden border bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm group">
          <CardHeader className="py-3 px-4 border-b flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
            <div className="flex items-center gap-2">
              <CornerDownRight className="w-4 h-4 text-brand-500" />
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500">Input Editor</CardTitle>
            </div>
            <Button size="sm" variant="ghost" className="h-8 text-xs hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20" onClick={() => { setInput(''); trackEvent('clear_clicked', { tool: 'json-formatter' }); }}>Clear</Button>
          </CardHeader>
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder='{paste_json: "here"}'
            className="flex-1 border-0 focus:ring-0 resize-none font-mono text-sm bg-transparent p-6 leading-relaxed"
            spellCheck="false"
          />
        </Card>

        <Card className="flex flex-col h-full rounded-2xl overflow-hidden border shadow-lg group">
          <CardHeader className="py-3 px-4 border-b flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", isValid ? "bg-green-500" : "bg-red-500")} />
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500">
                {isValid ? `Formatted Output (${flatRows.length} nodes)` : "Validation Error"}
              </CardTitle>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => { downloadJson(); trackEvent('download_clicked', { tool: 'json-formatter' }); }} disabled={!isValid}>
                <FileDown className="w-3.5 h-3.5 mr-2"/> Download
              </Button>
              <CopyButton size="sm" className="h-8 text-xs" value={formattedString} onClick={() => trackEvent('copy_clicked', { tool: 'json-formatter' })} />
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden bg-white dark:bg-[#0d1117] relative">
            {!debouncedInput.trim() ? (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400 italic bg-gray-50 dark:bg-gray-900/20">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-full flex items-center justify-center">
                    <Code2 className="w-6 h-6 opacity-20" />
                  </div>
                  <span>Awaiting input...</span>
                </div>
              </div>
            ) : !isValid ? (
              <div className="absolute inset-0 flex items-center justify-center text-red-500 flex-col gap-3 p-8 bg-red-50/30 dark:bg-red-950/10">
                <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-2xl">
                  <AlertTriangle className="w-8 h-8 opacity-50" />
                </div>
                <span className="text-sm font-bold uppercase tracking-widest">Syntax Error</span>
                <span className="text-xs opacity-75 text-center font-mono max-w-sm leading-relaxed bg-white dark:bg-gray-900 p-4 rounded-xl border border-red-100 dark:border-red-900/50 shadow-sm break-all">
                  {(parsedJson as Error).message}
                </span>
              </div>
            ) : (
              <div ref={setContainerNode} className="absolute inset-0">
                {filteredRows.length > 0 && containerSize.width > 0 ? (
                  <List
                    height={containerSize.height}
                    itemCount={filteredRows.length}
                    itemSize={28} // ~28px row height
                    width={containerSize.width}
                    itemData={{
                      rows: filteredRows,
                      collapsedPaths,
                      toggleCollapse,
                      showTypes,
                      showPaths,
                      searchTerm,
                      copyPath,
                    }}
                    className="scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800"
                  >
                    {({ index, style, data }) => {
                      const row = data.rows[index];
                      const isCollapsed = data.collapsedPaths.has(row.path);
                      const canToggle = row.type === 'object_start' || row.type === 'array_start';

                      return (
                        <div style={style} className="flex items-center min-w-max pr-4">
                          <div
                            className="w-6 h-full flex items-center justify-center cursor-pointer text-gray-400 hover:text-brand-500 shrink-0"
                            onClick={() => canToggle && data.toggleCollapse(row.path)}
                          >
                            {canToggle && (
                              isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <ValueDisplay
                            row={row}
                            showTypes={data.showTypes}
                            showPaths={data.showPaths}
                            searchTerm={data.searchTerm}
                            onCopyPath={data.copyPath}
                          />
                        </div>
                      );
                    }}
                  </List>
                ) : (
                  containerSize.width > 0 && <div className="p-8 text-center text-gray-400 italic">No matches found for "{searchTerm}"</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ToolChainer currentToolId="json-formatter" />
    </div>
  );
}
