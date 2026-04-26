'use client';

import React, { useState, useCallback, useEffect, useRef, Suspense } from 'react';
import { SEOHelmet } from '@/components/SEOHelmet';
import { toolRegistry } from '@/tools/toolRegistry';

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
  Table,
  Search,
  RefreshCw,
  Columns
} from 'lucide-react';

const SQL_KEYWORDS = [
  'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER', 'TRUNCATE',
  'FROM', 'WHERE', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'ON',
  'GROUP', 'BY', 'ORDER', 'HAVING', 'LIMIT', 'OFFSET',
  'TABLE', 'INDEX', 'VIEW', 'DATABASE', 'SCHEMA', 'FUNCTION', 'TRIGGER',
  'INTO', 'VALUES', 'SET', 'AS', 'DISTINCT', 'ALL', 'ANY', 'SOME',
  'AND', 'OR', 'NOT', 'NULL', 'IS', 'IN', 'BETWEEN', 'LIKE', 'ILIKE', 'EXISTS',
  'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
  'UNION', 'INTERSECT', 'EXCEPT',
  'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'CHECK', 'UNIQUE', 'DEFAULT', 'CONSTRAINT',
  'SERIAL', 'INTEGER', 'VARCHAR', 'TEXT', 'BOOLEAN', 'TIMESTAMP', 'DATE', 'TIME', 'NUMERIC', 'JSON', 'JSONB', 'UUID',
  'WITH', 'RECURSIVE', 'RETURNING', 'GRANT', 'REVOKE', 'WINDOW', 'OVER', 'PARTITION', 'RANK', 'DENSE_RANK', 'ROW_NUMBER',
  'LAG', 'LEAD', 'FIRST_VALUE', 'LAST_VALUE', 'COALESCE', 'NULLIF', 'GREATEST', 'LEAST'
];

const SQL_FUNCTIONS = [
  'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'ABS', 'CEIL', 'FLOOR', 'ROUND', 'TRUNC',
  'LENGTH', 'LOWER', 'UPPER', 'SUBSTR', 'REPLACE', 'TRIM', 'LTRIM', 'RTRIM',
  'NOW', 'CURRENT_DATE', 'CURRENT_TIME', 'CURRENT_TIMESTAMP', 'AGE', 'DATE_PART', 'DATE_TRUNC',
  'EXTRACT', 'TO_CHAR', 'TO_DATE', 'TO_NUMBER', 'CAST', 'COALESCE', 'NULLIF',
  'RANDOM', 'GEN_RANDOM_UUID', 'UUID_GENERATE_V4'
];

const SQL_SNIPPETS = [
  {
    label: 'CREATE TABLE',
    detail: 'Create a new table',
    insertText: 'CREATE TABLE ${1:table_name} (\n  id SERIAL PRIMARY KEY,\n  ${2:column_name} ${3:type}\n);'
  },
  {
    label: 'SELECT ALL',
    detail: 'Select all columns from a table',
    insertText: 'SELECT * FROM ${1:table_name};'
  },
  {
    label: 'INSERT INTO',
    detail: 'Insert a new row into a table',
    insertText: 'INSERT INTO ${1:table_name} (${2:columns})\nVALUES (${3:values});'
  },
  {
    label: 'JOIN',
    detail: 'Inner join two tables',
    insertText: 'INNER JOIN ${1:table_name} ON ${2:table1}.${3:id} = ${1:table_name}.${4:id}'
  },
  {
    label: 'CASE',
    detail: 'Conditional expression',
    insertText: 'CASE\n  WHEN ${1:condition} THEN ${2:result}\n  ELSE ${3:else_result}\nEND'
  }
];

interface SchemaInfo {
  tables: {
    name: string;
    columns: { name: string; type: string }[];
  }[];
}

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
  const [files, setFiles] = useState<File[]>(DEFAULT_FILES);
  const [activeFileId, setActiveFileId] = useState<string>(files[0]?.id || 'init-sql');
  const [tabs, setTabs] = useState<ResultTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const totalExecutions = useRef(0);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isTerminalOpen, setIsTerminalOpen] = useState(true);
  const [terminalHeight, setTerminalHeight] = useState(320);
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [activeActivity, setActiveActivity] = useState<string>('files');
  const [theme, setTheme] = useState<ThemeMode>('vs-dark');
  const [isFocusMode, setIsFocusMode] = useState(false);

  const [schema, setSchema] = useState<SchemaInfo>({ tables: [] });
  const [isRefreshingSchema, setIsRefreshingSchema] = useState(false);
  const monacoRef = useRef<any>(null);
  const editorRef = useRef<any>(null);
  const completionProviderRef = useRef<any>(null);

  
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
    const savedFiles = localStorage.getItem('sql-editor-files-v1');
    if (savedFiles) {
      const parsed = JSON.parse(savedFiles);
      setFiles(parsed);
      if (parsed[0]) setActiveFileId(parsed[0].id);
    }

    const savedHeight = localStorage.getItem('sql-editor-term-height');
    if (savedHeight) setTerminalHeight(parseInt(savedHeight));

    const savedTheme = localStorage.getItem('sql-editor-theme') as ThemeMode;
    if (savedTheme) setTheme(savedTheme);
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('sql-editor-files-v1', JSON.stringify(files));
    }
  }, [files, isMounted]);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('sql-editor-term-height', terminalHeight.toString());
    }
  }, [terminalHeight, isMounted]);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('sql-editor-theme', theme);
    }
  }, [theme, isMounted]);

  // Focus Mode Scroll Lock
  useEffect(() => {
    // Handle focus mode body classes
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

  const fetchSchema = useCallback(async () => {
    if (!pgRef.current || !isDbReady) return;
    setIsRefreshingSchema(true);
    try {
      // Query to get tables and their columns
      const res = await pgRef.current.query(`
        SELECT 
          t.table_name, 
          c.column_name,
          c.data_type
        FROM 
          information_schema.tables t
        JOIN 
          information_schema.columns c ON t.table_name = c.table_name
        WHERE 
          t.table_schema = 'public'
        ORDER BY 
          t.table_name, c.ordinal_position;
      `);

      const tablesMap = new Map<string, { name: string; columns: { name: string; type: string }[] }>();
      
      res.rows.forEach((row: any) => {
        if (!tablesMap.has(row.table_name)) {
          tablesMap.set(row.table_name, { name: row.table_name, columns: [] });
        }
        tablesMap.get(row.table_name)!.columns.push({
          name: row.column_name,
          type: row.data_type
        });
      });

      setSchema({ tables: Array.from(tablesMap.values()) });
    } catch (err) {
      console.error('Failed to fetch schema:', err);
    } finally {
      setIsRefreshingSchema(false);
    }
  }, [isDbReady]);

  useEffect(() => {
    if (isDbReady) {
      fetchSchema();
    }
  }, [isDbReady, fetchSchema]);

  const setupIntelligence = useCallback((monaco: any, currentSchema: SchemaInfo) => {
    if (completionProviderRef.current) {
      completionProviderRef.current.dispose();
    }

    completionProviderRef.current = monaco.languages.registerCompletionItemProvider('sql', {
      triggerCharacters: ['.', ' '],
      provideCompletionItems: (model: any, position: any) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const suggestions: any[] = [];

        // Context Analysis
        const lineContent = model.getLineContent(position.lineNumber);
        const textBeforeCursor = lineContent.substring(0, position.column - 1);
        const words = textBeforeCursor.trim().split(/\s+/);
        const lastWord = words[words.length - 1]?.toUpperCase();
        
        const isAfterFromOrJoin = ['FROM', 'JOIN', 'INTO', 'UPDATE', 'TABLE', 'REFERENCES'].includes(lastWord);
        const dotMatch = textBeforeCursor.match(/(\w+)\.$/);
        const tableNameAtDot = dotMatch ? dotMatch[1] : null;

        // 1. Table-specific Columns (if user typed 'tablename.')
        if (tableNameAtDot) {
          const table = currentSchema.tables.find(t => t.name === tableNameAtDot);
          if (table) {
            table.columns.forEach(c => {
              suggestions.push({
                label: c.name,
                kind: monaco.languages.CompletionItemKind.Field,
                insertText: c.name,
                detail: `${c.type} from ${table.name}`,
                range
              });
            });
            return { suggestions };
          }
        }

        // 2. Table suggestions (prioritize if after FROM/JOIN)
        if (isAfterFromOrJoin) {
          currentSchema.tables.forEach(t => {
            suggestions.push({
              label: t.name,
              kind: monaco.languages.CompletionItemKind.Class,
              insertText: t.name,
              detail: 'Table',
              sortText: '001-' + t.name, // Make them appear first
              range
            });
          });
          return { suggestions };
        }

        // 3. Keywords & Functions
        SQL_KEYWORDS.forEach(k => {
          suggestions.push({
            label: k,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: k,
            range
          });
        });

        SQL_FUNCTIONS.forEach(f => {
          suggestions.push({
            label: f,
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: `${f}(${lastWord === 'COUNT' ? '*' : ''})`,
            detail: 'Function',
            range
          });
        });

        // 4. Snippets
        SQL_SNIPPETS.forEach(s => {
          suggestions.push({
            label: s.label,
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: s.insertText,
            insertTextRules: monaco.languages.CompletionItemInsertValueRule.InsertAsSnippet,
            documentation: s.detail,
            range
          });
        });

        // 5. All names (Tables and Columns) as fallback
        currentSchema.tables.forEach(t => {
          suggestions.push({
            label: t.name,
            kind: monaco.languages.CompletionItemKind.Class,
            insertText: t.name,
            detail: 'Table',
            range
          });
          t.columns.forEach(c => {
            suggestions.push({
              label: c.name,
              kind: monaco.languages.CompletionItemKind.Field,
              insertText: c.name,
              detail: `${c.type} (${t.name})`,
              range
            });
          });
        });

        return { suggestions };
      }
    });
  }, []);

  // Real-time Linting
  useEffect(() => {
    if (!activeFile?.content || !pgRef.current || !isDbReady || !monacoRef.current || !editorRef.current) return;

    const validate = async () => {
      const model = editorRef.current.getModel();
      if (!model) return;

      try {
        // Dry-run using a transaction that we immediately roll back
        await pgRef.current?.exec(`BEGIN; ${activeFile.content}; ROLLBACK;`);
        monacoRef.current.editor.setModelMarkers(model, 'sql', []);
      } catch (err: any) {
        // Reset transaction state in case it aborted
        await pgRef.current?.query('ROLLBACK').catch(() => {});
        
        if (err.position) {
          const pos = parseInt(err.position);
          const content = activeFile.content;
          const lines = content.slice(0, pos - 1).split('\n');
          const lineNumber = lines.length;
          const column = lines[lines.length - 1].length + 1;

          const word = model.getWordAtPosition({ lineNumber, column });
          
          monacoRef.current.editor.setModelMarkers(model, 'sql', [{
            startLineNumber: lineNumber,
            startColumn: word ? word.startColumn : column,
            endLineNumber: lineNumber,
            endColumn: word ? word.endColumn : column + 1,
            message: err.message,
            severity: monacoRef.current.MarkerSeverity.Error
          }]);
        }
      }
    };

    const timer = setTimeout(validate, 500);
    return () => clearTimeout(timer);
  }, [activeFile?.content, isDbReady]);

  useEffect(() => {
    if (monacoRef.current) {
      setupIntelligence(monacoRef.current, schema);
    }
  }, [schema, setupIntelligence]);

  const handleEditorMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    setupIntelligence(monaco, schema);
  };

  const runCode = useCallback(async () => {
    if (!activeFile || !pgRef.current || !isDbReady) return;
    setIsTerminalOpen(true);
    
    // Clear previous markers
    if (monacoRef.current && editorRef.current) {
      monacoRef.current.editor.setModelMarkers(editorRef.current.getModel(), 'sql', []);
    }

    if (!activeFile.content.trim()) return;

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

      // Refresh schema after successful execution
      fetchSchema();

    } catch (err: any) {
      // Handle error markers if position is available
      if (err.position && monacoRef.current && editorRef.current) {
        const pos = parseInt(err.position);
        const content = activeFile.content;
        const lines = content.slice(0, pos - 1).split('\n');
        const lineNumber = lines.length;
        const column = lines[lines.length - 1].length + 1;

        // Find the word at that position to highlight it
        const model = editorRef.current.getModel();
        const word = model.getWordAtPosition({ lineNumber, column });
        
        monacoRef.current.editor.setModelMarkers(model, 'sql', [{
          startLineNumber: lineNumber,
          startColumn: word ? word.startColumn : column,
          endLineNumber: lineNumber,
          endColumn: word ? word.endColumn : column + 1,
          message: err.message,
          severity: monacoRef.current.MarkerSeverity.Error
        }]);
      }

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
    }
  }, [activeFile, isDbReady, fetchSchema]);

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
      if (e.key === 'Escape' && isFocusMode) {
        setIsFocusMode(false);
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
      fetchSchema();
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
            <button
              onClick={() => setIsFocusMode(!isFocusMode)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95 ${
                isFocusMode 
                  ? 'bg-brand-500 text-white hover:bg-brand-600' 
                  : 'bg-white dark:bg-gray-800 border dark:border-gray-700 hover:shadow-md'
              }`}
            >
               <Maximize2 className="w-3.5 h-3.5" />
               <span>{isFocusMode ? 'Exit Focus' : 'Focus Mode'}</span>
            </button>
          </div>
        </div>

        {!isMounted ? (
          <div className="w-full h-[800px] flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-[1.5rem] border border-dashed border-gray-300 dark:border-gray-700">
             <div className="flex flex-col items-center gap-4 text-gray-400">
                <RefreshCw className="w-8 h-8 animate-spin" />
                <p className="text-sm font-medium uppercase tracking-widest">Preparing Environment...</p>
             </div>
          </div>
        ) : (
          <div 
            className={`flex flex-col shrink-0 overflow-hidden font-sans selection:bg-brand-500/30 shadow-2xl transition-all duration-500 ease-in-out ${
              isFocusMode 
                ? 'fixed inset-0 z-[10000] w-screen h-screen rounded-none border-none' 
                : 'w-full h-[800px] rounded-[1.5rem] border border-gray-100 dark:border-gray-800'
            }`}
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
                <button 
                  onClick={() => toggleSidebar('database')}
                  className={`p-2 transition-all ${activeActivity === 'database' && isSidebarOpen ? 'text-brand-500 border-l-2 border-brand-500' : 'text-[#8b949e] hover:text-brand-500'}`}
                >
                  <Database className="w-6 h-6" />
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
                    {activeActivity === 'files' ? 'Explorer' : activeActivity === 'database' ? 'Database' : 'Settings'}
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
                ) : activeActivity === 'database' ? (
                  <div className="flex flex-col h-full">
                    <div className="px-4 py-3 flex items-center justify-between border-b border-white/5">
                      <div className="flex items-center gap-2">
                          <Database className="w-4 h-4 text-brand-500" />
                          <span className="text-[12px] font-bold">Public Schema</span>
                      </div>
                      <button 
                        onClick={fetchSchema}
                        disabled={isRefreshingSchema}
                        className={`p-1 hover:text-brand-500 transition-all ${isRefreshingSchema ? 'animate-spin opacity-50' : ''}`}
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                      {schema.tables.length === 0 ? (
                        <div className="p-4 text-center opacity-40">
                            <p className="text-[11px] font-medium italic">No tables found.</p>
                        </div>
                      ) : (
                        schema.tables.map(table => (
                          <details key={table.name} className="group/table" open>
                              <summary className="flex items-center gap-2 px-2 py-1.5 hover:bg-white/5 rounded cursor-pointer list-none transition-colors">
                                <ChevronDown className="w-3 h-3 opacity-40 group-open/table:rotate-0 -rotate-90 transition-transform" />
                                <Table className="w-3.5 h-3.5 text-brand-500/70" />
                                <span className="text-[13px] font-medium">{table.name}</span>
                                <span className="ml-auto text-[10px] opacity-30">{table.columns.length}</span>
                              </summary>
                              <div className="pl-7 pr-2 py-1 space-y-1">
                                {table.columns.map(col => (
                                  <div key={col.name} className="flex items-center justify-between py-0.5 group/col">
                                      <div className="flex items-center gap-2 overflow-hidden">
                                        <Columns className="w-3 h-3 opacity-30" />
                                        <span className="text-[12px] opacity-80 truncate">{col.name}</span>
                                      </div>
                                      <span className="text-[9px] font-mono opacity-30 uppercase">{col.type}</span>
                                  </div>
                                ))}
                              </div>
                          </details>
                        ))
                      )}
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

                <div 
                  className="flex-1 relative overflow-hidden bg-[#0d1117] group/editor"
                  onClick={() => !isFocusMode && setIsFocusMode(true)}
                >
                  {!isFocusMode && (
                    <div className="absolute inset-0 z-40 bg-black/0 group-hover/editor:bg-black/5 flex items-center justify-center cursor-pointer transition-all opacity-0 group-hover/editor:opacity-100 pointer-events-none">
                        <div className="bg-brand-500 text-white px-4 py-2 rounded-full text-xs font-bold shadow-xl flex items-center gap-2">
                          <Maximize2 className="w-3.5 h-3.5" />
                          Click to Start Coding
                        </div>
                    </div>
                  )}
                  {isMounted && (
                    <Suspense fallback={<div className="flex items-center justify-center h-full text-white/50">Loading Editor...</div>}>
                      <Editor
                        height="100%"
                        language="sql"
                        theme={theme}
                        value={activeFile?.content || ''}
                        onChange={(val) => updateFileContent(val || '')}
                        onMount={handleEditorMount}
                        options={{
                          minimap: { enabled: false },
                          fontSize: 14,
                          automaticLayout: true,
                          scrollBeyondLastLine: false,
                          padding: { top: 16 },
                          quickSuggestions: true,
                          suggestOnTriggerCharacters: true
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
                <button 
                  onClick={() => setIsFocusMode(!isFocusMode)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-black uppercase text-[9px] transition-all ${
                    isFocusMode ? 'bg-brand-500 text-white' : 'hover:bg-brand-500/10 hover:text-brand-500'
                  }`}
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>{isFocusMode ? 'Focus On' : 'Enter Focus Mode'}</span>
                </button>
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
        )}
      </div>
    </>
  );
}
