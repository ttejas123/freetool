'use client';

import React, { useState, useCallback, useEffect, useRef, Suspense } from 'react';
import { SEOHelmet } from '@/components/SEOHelmet';
import { toolRegistry } from '@/tools/toolRegistry';

const Editor = React.lazy(() => import('@monaco-editor/react'));
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { 
  Play, 
  Plus,
  FileCode,
  Trash2, 
  Sparkles,
  Code2,
  Edit2,
  FolderCode,
  Settings,
  Box,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Clock,
  Maximize2
} from 'lucide-react';

interface File {
  id: string;
  name: string;
  content: string;
}

const DEFAULT_FILES: File[] = [
  {
    id: 'main-js',
    name: 'main.js',
    content: '// JavaScript IDE Pro - Result Mode\n\nconst Ozone = {\n  version: "3.1",\n  engine: "Monaco",\n  mode: "Premium Result Workspace"\n};\n\nfunction audit() {\n  console.log("Analyzing project state...");\n  console.log("Current Setup:", Ozone);\n  console.log("Success: Workspace optimized.");\n}\n\naudit();\n'
  }
];

type ThemeMode = 'vs-dark' | 'light' | 'hc-black' | 'github-dark';

export default function JavaScriptRunner() {
  const [files, setFiles] = useState<File[]>(DEFAULT_FILES);
  const [activeFileId, setActiveFileId] = useState<string>(DEFAULT_FILES[0].id);
  const [logs, setLogs] = useState<{ type: 'log' | 'error' | 'warn'; content: string; time: string }[]>([]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isTerminalOpen, setIsTerminalOpen] = useState(true);
  const [terminalHeight, setTerminalHeight] = useState(320);
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [activeActivity, setActiveActivity] = useState<string>('files');
  const [theme, setTheme] = useState<ThemeMode>('vs-dark');
  const [exeTime, setExeTime] = useState(0);
  const [isFocusMode, setIsFocusMode] = useState(false);

  const tool = toolRegistry.find(t => t.id === 'js-compiler')!;
  const activeFile = files.find(f => f.id === activeFileId) || files[0];
  const isResizing = useRef(false);

  // Persistence
  useEffect(() => {
    localStorage.setItem('js-editor-files-v3', JSON.stringify(files));
  }, [files]);

  useEffect(() => {
    localStorage.setItem('js-editor-term-height', terminalHeight.toString());
  }, [terminalHeight]);

  useEffect(() => {
    localStorage.setItem('js-editor-theme', theme);
  }, [theme]);

  const runCode = useCallback(() => {
    if (!activeFile) return;
    setLogs([]);
    setIsTerminalOpen(true);
    const start = performance.now();
    
    const capturedLogs: { type: 'log' | 'error' | 'warn'; content: string; time: string }[] = [];
    const getTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const customConsole = {
      log: (...args: any[]) => {
        capturedLogs.push({
          type: 'log',
          content: args.map(a => {
            if (typeof a === 'object' && a !== null) return JSON.stringify(a, null, 2);
            return String(a);
          }).join(' '),
          time: getTime()
        });
      },
      error: (...args: any[]) => {
        capturedLogs.push({
          type: 'error',
          content: args.map(a => String(a)).join(' '),
          time: getTime()
        });
      },
      warn: (...args: any[]) => {
        capturedLogs.push({
          type: 'warn',
          content: args.map(a => String(a)).join(' '),
          time: getTime()
        });
      },
      info: (...args: any[]) => {
        capturedLogs.push({
          type: 'log',
          content: args.map(a => String(a)).join(' '),
          time: getTime()
        });
      },
      table: (data: any) => {
        capturedLogs.push({
          type: 'log',
          content: `TABLE:\n${JSON.stringify(data, null, 2)}`,
          time: getTime()
        });
      }
    };

    try {
      const execute = new Function('console', activeFile.content);
      execute(customConsole);
      setLogs(capturedLogs);
    } catch (err: any) {
      setLogs([{ type: 'error', content: `RUNTIME ERROR: ${err.message || 'Syntax Error'}`, time: getTime() }]);
    } finally {
      setExeTime(Math.round(performance.now() - start));

    }
  }, [activeFile]);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Load persisted state
    const savedFiles = localStorage.getItem('js-editor-files-v3');
    if (savedFiles) {
      try {
        const parsed = JSON.parse(savedFiles);
        setFiles(parsed);
        setActiveFileId(parsed[0]?.id || 'main-js');
      } catch (e) {}
    }

    const savedHeight = localStorage.getItem('js-editor-term-height');
    if (savedHeight) setTerminalHeight(parseInt(savedHeight));

    const savedTheme = localStorage.getItem('js-editor-theme');
    if (savedTheme) setTheme(savedTheme as ThemeMode);

    setIsMounted(true);
  }, []);

  // Focus Mode Body Class Handling
  useEffect(() => {
    if (isMounted) {
      if (isFocusMode) {
        document.body.classList.add('playground-focus-mode');
        document.body.style.overflow = 'hidden';
      } else {
        document.body.classList.remove('playground-focus-mode');
        document.body.style.overflow = '';
      }
    }
    return () => {
      document.body.classList.remove('playground-focus-mode');
      document.body.style.overflow = '';
    };
  }, [isFocusMode, isMounted]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        runCode();
      }
      if (e.key === 'Escape' && isFocusMode) {
        setIsFocusMode(false);
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
  }, [runCode, isFocusMode]);

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
      name: `script-${files.length + 1}.js`,
      content: '// New JavaScript File\n'
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

  const isDark = theme !== 'light';
  const sidebarBg = isDark ? '#0d1117' : '#f6f8fa';
  const activityBarBg = isDark ? '#161b22' : '#ebf0f4';
  const borderColor = isDark ? '#30363d' : '#d0d7de';
  const textColor = isDark ? '#c9d1d9' : '#1f2328';


  return (
    <>
      <SEOHelmet
        title="JavaScript IDE Pro - Premium Output"
        description="Professional-grade JavaScript editor with modern Result Pane design, Monaco engine, and resizable workspace. 100% private."
      />

      <div className="w-full mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pt-8 px-4">
        <Breadcrumbs />
        
        {!isMounted ? (
          <div className="w-full h-[800px] flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-[1.5rem] border border-dashed border-gray-300 dark:border-gray-700">
             <div className="flex flex-col items-center gap-4 text-gray-400">
                <div className="w-8 h-8 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
                <p className="text-sm font-medium uppercase tracking-widest">Waking up JS Engine...</p>
             </div>
          </div>
        ) : (
          <>
            {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-brand-500/20">
               <tool.icon className="w-3 h-3" />
               <span>Professional Dev Tools</span>
            </div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white">
               JavaScript <span className="text-brand-500">IDE Pro</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium">
               A high-performance environment with real-time console output and modern Result Pane.
            </p>
          </div>
        </div>

        <div 
          onClick={() => !isFocusMode && setIsFocusMode(true)}
          className={`w-full flex flex-col shrink-0 overflow-hidden font-sans selection:bg-brand-500/30 shadow-2xl transition-all duration-500 ease-in-out ${
            isFocusMode 
              ? 'fixed inset-0 z-[10000] w-screen h-screen rounded-none border-none' 
              : 'w-full h-[800px] rounded-[1.5rem] border border-gray-100 dark:border-gray-800'
          }`}
          style={{ backgroundColor: sidebarBg, color: textColor }}
        >
          {/* Focus Mode Header / Click-to-Start Overlay */}
          {!isFocusMode && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/5 dark:bg-black/20 backdrop-blur-[2px] opacity-0 hover:opacity-100 transition-all duration-500 group cursor-pointer border-2 border-transparent hover:border-brand-500/50 rounded-[1.5rem]">
              <div className="bg-white dark:bg-gray-900 px-8 py-4 rounded-full shadow-2xl flex items-center gap-4 scale-90 group-hover:scale-100 transition-transform">
                <div className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center animate-pulse">
                  <Play className="w-5 h-5 text-white fill-white ml-1" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white">Click to Start Coding</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">Active IDE Pro Environment</p>
                </div>
              </div>
            </div>
          )}

          {isFocusMode && (
             <div className="h-10 flex items-center justify-between px-4 border-b bg-brand-500/5 backdrop-blur-md sticky top-0 z-[60]" style={{ borderColor }}>
                <div className="flex items-center gap-3">
                   <Code2 className="w-4 h-4 text-brand-500" />
                   <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Zen Focus Mode</span>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsFocusMode(false); }}
                  className="flex items-center gap-2 px-4 py-1 bg-white/10 hover:bg-red-500/10 hover:text-red-500 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border border-white/5"
                >
                  Exit Focus (Esc)
                </button>
             </div>
          )}
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
                    <span>Ozone-JS</span>
                </button>
                
                <div className="mt-2 space-y-0.5">
                    <div className="px-4 py-1 flex items-center justify-between group/add">
                      <span className="text-[10px] opacity-50 font-bold uppercase">Files</span>
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
                          <FileCode className={`w-3.5 h-3.5 shrink-0 ${activeFileId === file.id ? 'text-brand-500' : ''}`} />
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
                      language="javascript"
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
                  className="absolute top-4 right-8 z-30 group flex items-center gap-3 bg-brand-500 hover:bg-brand-600 text-white px-6 py-2.5 rounded-full shadow-2xl shadow-brand-500/20 active:scale-95 transition-all"
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

            {/* 4. Modern Result Pane (Not a Terminal) */}
            <div 
              className={`flex flex-col transition-all duration-300 ${isTerminalOpen ? '' : 'h-8 overflow-hidden'}`}
              style={{ height: isTerminalOpen ? terminalHeight : 32, backgroundColor: isDark ? '#161b22' : '#ffffff', borderTop: `1px solid ${borderColor}` }}
            >
               <div className="flex items-center px-4 h-8 shrink-0 border-b" style={{ borderColor }}>
                  <div className="flex items-center gap-4">
                     <span className="text-[10px] font-black uppercase tracking-widest text-brand-500">Live Result Output</span>
                     {exeTime > 0 && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-brand-500/5 rounded text-[9px] font-bold text-brand-500/60 uppercase">
                           <Clock className="w-2.5 h-2.5" /> {exeTime}ms
                        </div>
                     )}
                  </div>
                  <div className="ml-auto flex items-center gap-1">
                     <button onClick={() => setLogs([])} className="p-1 px-2 hover:bg-black/5 rounded text-[9px] font-bold uppercase tracking-tighter opacity-50 hover:opacity-100 transition-all">
                       Clear Result
                     </button>
                     <div className="w-px h-3 bg-white/10 mx-1" />
                     <button onClick={() => setIsTerminalOpen(!isTerminalOpen)} className="p-1.5 opacity-50 hover:opacity-100">
                        {isTerminalOpen ? <ChevronDown className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                     </button>
                  </div>
               </div>
               
               <div className="flex-1 overflow-y-auto p-0 flex flex-col font-mono custom-scrollbar">
                  {logs.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-20 select-none py-12">
                       <Code2 className="w-12 h-12 mb-4" />
                       <p className="text-xs font-bold uppercase tracking-widest">Awaiting execution...</p>
                    </div>
                  ) : (
                    logs.map((log, i) => (
                      <div 
                        key={i} 
                        className={`group flex items-start gap-3 px-4 py-1.5 border-b transition-colors ${
                          log.type === 'error' ? 'bg-red-500/5 hover:bg-red-500/10' : 
                          log.type === 'warn' ? 'bg-yellow-500/5 hover:bg-yellow-500/10' :
                          'hover:bg-white/5'
                        }`}
                        style={{ borderColor: borderColor }}
                      >
                        <div className="flex items-center gap-2 shrink-0 pt-0.5">
                           {log.type === 'error' ? (
                             <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                           ) : log.type === 'warn' ? (
                             <AlertCircle className="w-3.5 h-3.5 text-yellow-500" />
                           ) : (
                             <ChevronDown className="w-3.5 h-3.5 opacity-20 -rotate-90 group-hover:rotate-0 transition-transform" />
                           )}
                        </div>
                        <div className="flex-1 text-[12px] leading-relaxed break-words whitespace-pre-wrap py-0.5">
                           <span className={`${
                             log.type === 'error' ? 'text-red-500' : 
                             log.type === 'warn' ? 'text-yellow-600 dark:text-yellow-400' :
                             'text-gray-900 dark:text-gray-300'
                           }`}>
                             {log.content}
                           </span>
                        </div>
                        <div className="shrink-0 text-[10px] opacity-30 pt-0.5 tabular-nums">{log.time}</div>
                      </div>
                    ))
                  )}
                  {/* Prompt Mockup */}
                  <div className="px-4 py-2 flex items-center gap-2 opacity-30 border-b border-transparent">
                     <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
                     <div className="w-2 h-4 bg-brand-500/50 animate-pulse" />
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* 5. Status Bar */}
         <div 
            className="h-8 flex items-center justify-between px-3 border-t text-[11px] font-medium shrink-0 z-50 relative"
            style={{ backgroundColor: activityBarBg, borderColor: borderColor, color: textColor }}
         >
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-brand-500/10 text-brand-500 rounded-full font-black uppercase text-[9px]">
                 <Box className="w-3 h-3" />
                 <span>Ozone Pro Runtime</span>
              </div>
           </div>
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 opacity-50">Ln {activeFile?.content.split('\n').length}, Col 1</div>
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
      </>
    )}
  </div>
</>
);
}
