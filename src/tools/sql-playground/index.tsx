import React, { useState, useCallback, useEffect, useRef, Suspense } from 'react';
import { SEOHelmet } from '@/components/SEOHelmet';
import { toolRegistry } from '@/tools/toolRegistry';
import { RichToolDescription } from '@/components/ui/RichToolDescription';

const Editor = React.lazy(() => import('@monaco-editor/react'));
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PGlite } from '@electric-sql/pglite';

import { 
  Play, 
  Plus,
  FileCode,
  Trash2, 
  Sparkles,
  Database,
  Edit2,
  FolderCode,
  Settings,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Maximize2,
  Table
} from 'lucide-react';

interface File {
  id: string;
  name: string;
  content: string;
}

const DEFAULT_FILES: File[] = [
  {
    id: 'init-sql',
    name: '01_init.sql',
    content: `-- SQL Playground (WASM Postgres)
-- Run this script to initialize a sample database.

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (name, email) VALUES
  ('Alice Smith', 'alice@example.com'),
  ('Bob Johnson', 'bob@example.com'),
  ('Charlie Brown', 'charlie@example.com');

-- Let's query the table!
SELECT * FROM users;
`
  },
  {
    id: 'query-sql',
    name: '02_query.sql',
    content: `-- Now try running additional queries or operations
-- You can create more tables or alter existing ones.

SELECT
  COUNT(*) as total_users,
  MAX(created_at) as latest_user
FROM users;
`
  }
];

type ThemeMode = 'vs-dark' | 'light' | 'hc-black' | 'github-dark';

type LogEntry = 
  | { type: 'log'; content: string; time: string }
  | { type: 'error'; content: string; time: string }
  | { type: 'table'; fields: string[]; rows: any[][]; time: string };

interface ResultTab {
  id: string;
  name: string;
  logs: LogEntry[];
}

export default function SQLPlayground() {
  const [files, setFiles] = useState<File[]>(() => {
    const saved = localStorage.getItem('sql-editor-files-v1');
    return saved ? JSON.parse(saved) : DEFAULT_FILES;
  });
  const [activeFileId, setActiveFileId] = useState<string>(files[0]?.id || 'init-sql');
  const [tabs, setTabs] = useState<ResultTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const totalExecutions = useRef(0);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isTerminalOpen, setIsTerminalOpen] = useState(true);
  const [terminalHeight, setTerminalHeight] = useState(() => {
    const saved = localStorage.getItem('sql-editor-term-height');
    return saved ? parseInt(saved) : 320;
  });
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [activeActivity, setActiveActivity] = useState<string>('files');
  const [theme, setTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem('sql-editor-theme') as ThemeMode) || 'vs-dark';
  });

  
  const [isDbReady, setIsDbReady] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const pgRef = useRef<PGlite | null>(null);
  const tool = toolRegistry.find(t => t.id === 'sql-playground')!;
  const activeFile = files.find(f => f.id === activeFileId) || files[0];
  const isResizing = useRef(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Initialize PGlite database only once
  useEffect(() => {
    async function initDB() {
      try {
        if (!pgRef.current) {
          pgRef.current = new PGlite();
          await pgRef.current.waitReady;
          setIsDbReady(true);
          const initTab: ResultTab = { id: 'init', name: 'System', logs: [{ type: 'log', content: '✅ WebAssembly PostgreSQL Database initialized successfully.', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }] };
          setTabs([initTab]);
          setActiveTabId(initTab.id);
        }
      } catch (err: any) {
        const errTab: ResultTab = { id: 'err', name: 'Error', logs: [{ type: 'error', content: `Failed to initialize DB: ${err.message}`, time: new Date().toLocaleTimeString() }] };
        setTabs([errTab]);
        setActiveTabId(errTab.id);
      }
    }
    initDB();

    return () => {
      // In a real unmount we might want to shut down, but React 18 strict mode
      // double-mounts, so we'll leave it running in memory to avoid recreation bugs.
    };
  }, []);

  // Persistence
  useEffect(() => {
    localStorage.setItem('sql-editor-files-v1', JSON.stringify(files));
  }, [files]);

  useEffect(() => {
    localStorage.setItem('sql-editor-term-height', terminalHeight.toString());
  }, [terminalHeight]);

  useEffect(() => {
    localStorage.setItem('sql-editor-theme', theme);
  }, [theme]);

  const runCode = useCallback(async () => {
    if (!activeFile || !pgRef.current || !isDbReady) return;
    setIsTerminalOpen(true);
    // const start = performance.now();
    totalExecutions.current += 1;
    const localExe = totalExecutions.current;
    
    const getTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    try {
      // Execute the query using exec which supports multiple statements
      const results = await pgRef.current.exec(activeFile.content);
      
      const newTabs: ResultTab[] = [];
      const timeStr = getTime();

      results.forEach((result, idx) => {
        const itemLogs: LogEntry[] = [];
        if (result.rows && result.rows.length > 0) {
          // If query returned rows (like a SELECT)
          const fields = result.fields.map((f: any) => f.name);
          const rows = result.rows.map((row: any) => fields.map((f: any) => row[f]));
          itemLogs.push({ type: 'table', fields, rows, time: timeStr });
        } else {
          // Execution succeeding without rows (e.g. CREATE, UPDATE, DELETE)
          const affectedRows = result.affectedRows;
          itemLogs.push({
            type: 'log',
            content: `Query Executed Successfully.\n${affectedRows !== undefined ? `Rows affected: ${affectedRows}` : ''}`,
            time: timeStr
          });
        }
        newTabs.push({
           id: `exec-${localExe}-${idx}`,
           name: `Query ${localExe}.${idx + 1}`,
           logs: itemLogs
        });
      });
      
      setTabs(prev => {
        const updated = [...prev, ...newTabs];
        return updated.slice(-25); // Max limit of 25 windows
      });
      if (newTabs.length > 0) {
        setActiveTabId(newTabs[0].id);
      }
    } catch (err: any) {
      const errTab: ResultTab = {
        id: `exec-${localExe}-err`,
        name: `Error ${localExe}`,
        logs: [{ type: 'error', content: `POSTGRES ERROR:\n\n${err.message}`, time: getTime() }]
      };
      setTabs(prev => {
        const updated = [...prev, errTab];
        return updated.slice(-25);
      });
      setActiveTabId(errTab.id);
    } finally {
      // performance block finished
    }
  }, [activeFile, isDbReady]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        runCode();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setIsSidebarOpen(prev => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault();
        setIsTerminalOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [runCode]);

  // Resizing Logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const height = window.innerHeight - e.clientY - 32;
      if (height > 64 && height < window.innerHeight * 0.8) {
        setTerminalHeight(height);
      }
    };
    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = 'default';
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const toggleSidebar = (activity: string) => {
    if (activeActivity === activity && isSidebarOpen) {
      setIsSidebarOpen(false);
    } else {
      setActiveActivity(activity);
      setIsSidebarOpen(true);
    }
  };

  const addFile = () => {
    const newFile: File = {
      id: `file-${Date.now()}`,
      name: `script-${files.length + 1}.sql`,
      content: '-- New SQL Query\n'
    };
    setFiles([...files, newFile]);
    setActiveFileId(newFile.id);
  };

  const deleteFile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (files.length <= 1) return;
    const newFiles = files.filter(f => f.id !== id);
    setFiles(newFiles);
    if (activeFileId === id) {
      setActiveFileId(newFiles[0].id);
    }
  };

  const updateFileContent = (content: string) => {
    setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, content } : f));
  };

  const renameFile = (id: string, newName: string) => {
    if (!newName.trim()) return;
    setFiles(prev => prev.map(f => f.id === id ? { ...f, name: newName } : f));
    setEditingFileId(null);
  };

  const clearDb = async () => {
    if (!pgRef.current) return;
    try {
      // Ephemeral restart trick - simply clear public schemas
      await pgRef.current.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
      const resetTab: ResultTab = { id: `sys-${Date.now()}`, name: 'System', logs: [{ type: 'log', content: '✅ Schema dropped & rebuilt. Database is clean.', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }] };
      setTabs(prev => [...prev, resetTab].slice(-25));
      setActiveTabId(resetTab.id);
    } catch (err: any) {
      const errTab: ResultTab = { id: `err-${Date.now()}`, name: 'Error', logs: [{ type: 'error', content: `Failed to reset DB: ${err.message}`, time: new Date().toLocaleTimeString() }] };
      setTabs(prev => [...prev, errTab].slice(-25));
      setActiveTabId(errTab.id);
    }
  };

  const isDark = theme !== 'light';
  const sidebarBg = isDark ? '#0d1117' : '#f6f8fa';
  const activityBarBg = isDark ? '#161b22' : '#ebf0f4';
  const borderColor = isDark ? '#30363d' : '#d0d7de';
  const textColor = isDark ? '#c9d1d9' : '#1f2328';


  return (
    <>
      <SEOHelmet
        title="SQL Playground - WASM Postgres Sandbox"
        description="WASM-powered scalable PostgreSQL sandbox. Write, run, and test full SQL natively in your browser with zero latency and true privacy."
      />

      <div className="w-full mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pt-8 px-4">
        <Breadcrumbs />
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-brand-500/20">
               <Database className="w-3 h-3" />
               <span>Professional Dev Tools</span>
            </div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white">
               SQL <span className="text-brand-500">Playground</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium w-full">
               Write, run, and explore real PostgreSQL queries natively in your browser using high-performance WASM sandboxing. No backend required.
            </p>
          </div>
          <div className="flex gap-3">
             <button
               onClick={clearDb}
               className="px-4 py-2 text-xs font-bold bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95"
             >
                Reset Database
             </button>
          </div>
        </div>

        <div 
          className="w-full flex flex-col h-[800px] shrink-0 overflow-hidden font-sans selection:bg-brand-500/30 shadow-2xl rounded-[2.5rem] border border-gray-100 dark:border-gray-800"
          style={{ backgroundColor: sidebarBg, color: textColor }}
        >
        <div className="flex-1 flex overflow-hidden">
          {/* 1. Activity Bar */}
          <div 
            className="w-12 flex flex-col items-center py-4 gap-4 shrink-0 z-30 border-r"
            style={{ backgroundColor: activityBarBg, borderColor: borderColor }}
          >
            <button 
              onClick={() => toggleSidebar('files')}
              className={`p-2 transition-all ${activeActivity === 'files' && isSidebarOpen ? 'text-brand-500 border-l-2 border-brand-500' : 'text-[#8b949e] hover:text-brand-500'}`}
            >
              <FolderCode className="w-6 h-6" />
            </button>
            <div className="mt-auto flex flex-col gap-4">
              <button 
                 onClick={() => toggleSidebar('settings')}
                 className={`p-2 transition-all ${activeActivity === 'settings' && isSidebarOpen ? 'text-brand-500 border-l-2 border-brand-500' : 'text-[#8b949e] hover:text-brand-500'}`}
              >
                <Settings className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* 2. Side Bar */}
          <div 
            className={`flex flex-col border-r transition-all duration-200 group relative ${isSidebarOpen ? 'w-64' : 'w-0 overflow-hidden border-none'}`}
            style={{ backgroundColor: sidebarBg, borderColor: borderColor }}
          >
            <div className="p-3 flex items-center justify-between h-9 shrink-0">
              <span className="text-[11px] font-bold uppercase tracking-wider opacity-60">
                 {activeActivity === 'files' ? 'Explorer' : 'Settings'}
              </span>
            </div>
            
            {activeActivity === 'files' ? (
              <div className="px-1 overflow-y-auto">
                <button className="w-full flex items-center gap-1.5 px-2 py-1 text-[11px] font-black uppercase opacity-80 border-b border-white/5">
                    <ChevronDown className="w-3 h-3" />
                    <span>WASM Postgres</span>
                </button>
                
                <div className="mt-2 space-y-0.5">
                    <div className="px-4 py-1 flex items-center justify-between group/add">
                      <span className="text-[10px] opacity-50 font-bold uppercase">Queries</span>
                      <button onClick={addFile} className="hover:text-brand-500 opacity-0 group-hover/add:opacity-100 transition-opacity">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    
                    {files.map(file => (
                      <div
                        key={file.id}
                        onClick={() => setActiveFileId(file.id)}
                        className={`group flex items-center justify-between px-4 py-1 cursor-pointer transition-all ${
                          activeFileId === file.id 
                            ? 'bg-brand-500/10 text-brand-500 border-l-2 border-brand-500 font-bold' 
                            : 'opacity-70 hover:bg-black/5 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <Database className={`w-3.5 h-3.5 shrink-0 ${activeFileId === file.id ? 'text-brand-500' : ''}`} />
                          {editingFileId === file.id ? (
                            <input
                              autoFocus
                              defaultValue={file.name}
                              onBlur={(e) => renameFile(file.id, e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && renameFile(file.id, (e.target as HTMLInputElement).value)}
                              className="bg-transparent border border-brand-500 focus:ring-1 focus:ring-brand-500 p-0 text-[12px] w-full outline-none px-1"
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <span className="text-[13px] truncate">{file.name}</span>
                          )}
                        </div>
                        <div className={`flex items-center gap-1 transition-opacity ${activeFileId === file.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setEditingFileId(file.id); }}
                            className="p-0.5 hover:text-brand-500"
                          >
                            <Edit2 className="w-2.5 h-2.5" />
                          </button>
                          {files.length > 1 && (
                            <button 
                              onClick={(e) => deleteFile(file.id, e)}
                              className="p-0.5 hover:text-red-500"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className="p-4 space-y-6 text-sm">
                 <p className="opacity-60 leading-relaxed">Customize your playground experience.</p>
                 <div className="grid grid-cols-2 gap-2">
                    {(['vs-dark', 'light', 'github-dark'] as const).map(t => (
                       <button
                         key={t}
                         onClick={() => setTheme(t)}
                         className={`p-2 rounded-lg border text-[10px] font-bold uppercase ${theme === t ? 'border-brand-500 bg-brand-500/10 text-brand-500' : 'border-white/10'}`}
                       >
                          {t.replace('-', ' ')}
                       </button>
                    ))}
                 </div>
              </div>
            )}
          </div>

          {/* 3. Main Editor Area */}
          <div className="flex-1 flex flex-col overflow-hidden relative">
            <div className="flex h-9 border-b shrink-0 bg-[#161b22]/30" style={{ borderColor }}>
               {files.map(file => (
                 <div
                   key={file.id}
                   onClick={() => setActiveFileId(file.id)}
                   className={`flex items-center gap-2 px-4 h-full border-r cursor-pointer min-w-[120px] transition-all relative ${
                     activeFileId === file.id ? 'text-brand-500 font-bold bg-[#0d1117]' : 'opacity-50 hover:bg-black/5'
                   }`}
                   style={{ borderColor }}
                 >
                   <FileCode className="w-3 h-3" />
                   <span className="text-[12px] truncate">{file.name}</span>
                 </div>
               ))}
            </div>

            <div className="flex-1 relative overflow-hidden bg-[#0d1117]">
               {isMounted && (
                 <Suspense fallback={<div className="flex items-center justify-center h-full text-white/50">Loading Editor...</div>}>
                   <Editor
                      height="100%"
                      language="sql"
                      theme={theme}
                      value={activeFile?.content || ''}
                      onChange={(val) => updateFileContent(val || '')}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        automaticLayout: true,
                        scrollBeyondLastLine: false,
                        padding: { top: 16 }
                      }}
                   />
                 </Suspense>
               )}
               <button 
                  onClick={runCode}
                  disabled={!isDbReady}
                  className="absolute top-4 right-8 z-30 group flex items-center gap-3 bg-brand-500 hover:bg-brand-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-full shadow-2xl shadow-brand-500/20 active:scale-95 transition-all"
               >
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">Execute</span>
                    <span className="text-[8px] opacity-70 font-bold uppercase tracking-tight">Cmd + Enter</span>
                  </div>
                  <Play className="w-4 h-4 fill-white" />
               </button>
            </div>

            {/* Resize Handle */}
            <div 
               className="h-1 cursor-ns-resize bg-brand-500/20 hover:bg-brand-500 transition-colors z-40" 
               onMouseDown={() => { isResizing.current = true; document.body.style.cursor = 'ns-resize'; }}
            />

            {/* 4. Modern Result Pane */}
            <div 
              className={`flex flex-col transition-all duration-300 ${isTerminalOpen ? '' : 'h-8 overflow-hidden'}`}
              style={{ height: isTerminalOpen ? terminalHeight : 32, backgroundColor: isDark ? '#161b22' : '#ffffff', borderTop: `1px solid ${borderColor}` }}
            >
               <div className="flex items-center px-4 h-8 shrink-0 border-b justify-between overflow-visible z-20" style={{ borderColor }}>
                  <div className="flex items-center gap-1 flex-1 overflow-x-auto hide-scrollbar overflow-visible">
                     <span className="text-[10px] font-black uppercase tracking-widest text-brand-500 mr-2 shrink-0">Output</span>
                     
                     {tabs.length > 5 && (
                       <div className="relative group flex items-center h-full mr-1">
                         <button className="px-3 transform -skew-x-[15deg] h-6 flex items-center border-l justify-center px-4 border-r text-[10px] font-bold uppercase tracking-tight transition-all shrink-0 opacity-50 hover:bg-black/5 hover:opacity-100" style={{ borderColor }}>
                           <span className="skew-x-[15deg] flex items-center gap-1">History <ChevronDown className="w-3 h-3" /></span>
                         </button>
                         <div className="absolute top-7 left-0 hidden group-hover:flex flex-col bg-white dark:bg-[#161b22] border shadow-xl z-50 min-w-[120px] max-h-60 overflow-y-auto" style={{ borderColor }}>
                            {tabs.slice(0, -5).map(tab => (
                              <button key={tab.id} onClick={() => setActiveTabId(tab.id)} className={`px-4 py-2 text-[10px] font-bold uppercase text-left whitespace-nowrap hover:bg-brand-500/10 ${activeTabId === tab.id ? 'text-brand-500 bg-brand-500/5' : ''}`}>
                                {tab.name}
                              </button>
                            ))}
                         </div>
                       </div>
                     )}

                     {tabs.slice(-5).map(tab => (
                       <button 
                         key={tab.id}
                         onClick={() => setActiveTabId(tab.id)}
                         className={`px-3 transform -skew-x-[15deg] h-6 flex items-center border-l justify-center px-4 border-r text-[10px] font-bold uppercase tracking-tight transition-all shrink-0 ${
                           activeTabId === tab.id ? 'bg-brand-500 shadow-[inset_0_-2px_0_rgba(0,0,0,0.2)] text-white' : 'opacity-50 hover:bg-black/5 hover:opacity-100'
                         }`}
                         style={{ borderColor: activeTabId === tab.id ? 'transparent' : borderColor }}
                       >
                         <span className="skew-x-[15deg]">{tab.name}</span>
                       </button>
                     ))}

                     {!isDbReady && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-yellow-500/10 rounded text-[9px] font-bold text-yellow-500 uppercase animate-pulse ml-2 shrink-0">
                           Starting WASM Database...
                        </div>
                     )}
                  </div>
                  <div className="ml-auto flex items-center gap-1 pl-4 shrink-0">
                     <button onClick={() => { setTabs([]); setActiveTabId(null); }} className="p-1 px-3 flex items-center gap-1.5 bg-red-500/5 hover:bg-red-500/10 text-red-500 rounded text-[9px] font-bold uppercase tracking-tighter opacity-80 hover:opacity-100 transition-all border border-red-500/10">
                       <Trash2 className="w-3 h-3" /> Clear Tabs
                     </button>
                     <div className="w-px h-3 bg-white/10 mx-1" />
                     <button onClick={() => setIsTerminalOpen(!isTerminalOpen)} className="p-1.5 opacity-50 hover:opacity-100">
                        {isTerminalOpen ? <ChevronDown className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                     </button>
                  </div>
               </div>
               
               <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                  {tabs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-20 select-none">
                       <Database className="w-12 h-12 mb-4" />
                       <p className="text-xs font-bold uppercase tracking-widest">Awaiting execution...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                        {tabs.find(t => t.id === activeTabId)?.logs.map((log, i) => (
                          <div key={i} className="flex gap-4 animate-in slide-in-from-left-4 duration-300">
                            <div className="w-10 pt-1 shrink-0 text-[10px] font-bold opacity-30 font-mono tracking-tighter">{log.time}</div>
                            <div className="flex-1 flex flex-col gap-1.5 overflow-hidden">
                               {log.type === 'table' ? (
                                 <div className="border rounded-xl overflow-x-auto custom-scrollbar" style={{ borderColor }}>
                                   <table className="w-full text-sm text-left">
                                     <thead className="text-[11px] uppercase bg-black/5 border-b" style={{ borderColor }}>
                                       <tr>
                                         {log.fields.map((field, idx) => (
                                           <th key={idx} className="px-4 py-2 font-bold opacity-70 whitespace-nowrap">{field}</th>
                                         ))}
                                       </tr>
                                     </thead>
                                     <tbody>
                                       {log.rows.map((row, rIdx) => (
                                         <tr key={rIdx} className="border-b last:border-b-0 hover:bg-black/5 transition-colors" style={{ borderColor }}>
                                           {row.map((val, cIdx) => (
                                             <td key={cIdx} className="px-4 py-2 whitespace-nowrap opacity-90 max-w-sm truncate whitespace-pre">{val !== null ? String(val) : <i>null</i>}</td>
                                           ))}
                                         </tr>
                                       ))}
                                     </tbody>
                                   </table>
                                 </div>
                               ) : (
                                 <div className={`p-4 rounded-2xl border flex gap-3 ${
                                   log.type === 'error' ? 'bg-red-500/5 border-red-500/20 text-red-500' : 
                                   'bg-brand-500/5 border-brand-500/10 text-brand-500'
                                 }`}>
                                    {log.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                                    <pre className="text-xs font-mono font-medium whitespace-pre-wrap">{log.content}</pre>
                                 </div>
                               )}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
               </div>
            </div>
          </div>
        </div>

        {/* 5. Status Bar */}
        <div 
           className="h-8 flex items-center justify-between px-3 border-t text-[11px] font-medium shrink-0"
           style={{ backgroundColor: activityBarBg, borderColor: borderColor, color: textColor }}
        >
           <div className="flex items-center gap-4">
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-black uppercase text-[9px] transition-colors ${
                isDbReady ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
              }`}>
                 <Database className="w-3 h-3" />
                 <span>{isDbReady ? 'PostgreSQL 16 Engine Active' : 'Initializing...'}</span>
              </div>
           </div>
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 opacity-50">Ln {activeFile?.content.split('\n').length}, Col 1</div>
              <div className="w-px h-3 bg-white/10" />
               <div className="flex items-center gap-1.5 px-3 py-1 bg-brand-500/10 text-brand-500 rounded-full font-black uppercase text-[9px]">
                 <Table className="w-3 h-3" />
                 <span>Tabular Output</span>
              </div>
              <div className="w-px h-3 bg-white/10" />
              <div 
                 onClick={() => toggleSidebar('settings')}
                 className="flex items-center gap-1.5 px-3 py-1 bg-brand-500 text-white rounded-full cursor-pointer hover:bg-brand-600 transition-all text-[9px] font-black uppercase pointer-events-auto"
              >
                 <Sparkles className="w-3 h-3" />
                 <span>{theme.replace('-', ' ')}</span>
              </div>
            </div>
          </div>
        </div>

        <RichToolDescription tool={tool} />
      </div>
    </>
  );
}
