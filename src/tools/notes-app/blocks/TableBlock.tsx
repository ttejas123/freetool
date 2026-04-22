'use client';

import React, { useState } from 'react';
import { Table as TableIcon, FileUp, Clipboard, X, Plus, Trash } from 'lucide-react';
import Papa from 'papaparse';
import type { BlockData } from '../types';
import { useEditorStore } from '../store';

interface TableBlockProps {
  block: BlockData;
}

export function TableBlock({ block }: TableBlockProps) {
  const { updateBlock } = useEditorStore();
  const [dragActive, setDragActive] = useState(false);
  const [showPaste, setShowPaste] = useState(false);
  const [pasteValue, setPasteValue] = useState('');

  const handleDataUpdate = (data: any[]) => {
    updateBlock(block.id, { content: data });
  };

  const processText = (text: string) => {
    try {
      const json = JSON.parse(text);
      if (Array.isArray(json)) {
        handleDataUpdate(json);
        return true;
      }
    } catch (e) {
      Papa.parse(text, {
        complete: (results) => {
          if (results.data && results.data.length > 0) {
            handleDataUpdate(results.data);
          }
        },
        header: true,
        skipEmptyLines: true,
      });
      return true;
    }
    return false;
  };

  const handleFileUpload = (e: any) => {
    const file = e.target?.files?.[0] || (e as React.DragEvent).dataTransfer?.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (file.name.endsWith('.csv')) {
        Papa.parse(content, {
          complete: (results) => handleDataUpdate(results.data),
          header: true,
        });
      } else {
        try {
          const json = JSON.parse(content);
          if (Array.isArray(json)) handleDataUpdate(json);
        } catch (e) {
          alert('Invalid JSON file. Must be an array of objects.');
        }
      }
    };
    reader.readAsText(file);
  };

  // --- Table Actions ---
  const addRow = () => {
    const headers = Object.keys(block.content[0] || { 'Column 1': '', 'Column 2': '' });
    const newRow = Object.fromEntries(headers.map(h => [h, '']));
    handleDataUpdate([...block.content, newRow]);
  };

  const addColumn = () => {
    const newColName = `Column ${Object.keys(block.content[0] || {}).length + 1}`;
    const newData = block.content.length > 0 
      ? block.content.map((row: any) => ({ ...row, [newColName]: '' }))
      : [{ [newColName]: '', 'Column 1': '' }]; // Initial if empty
    handleDataUpdate(newData);
  };

  const deleteRow = (idx: number) => {
    handleDataUpdate(block.content.filter((_: any, i: number) => i !== idx));
  };

  const deleteColumn = (colKey: string) => {
    handleDataUpdate(block.content.map((row: any) => {
      const newRow = { ...row };
      delete newRow[colKey];
      return newRow;
    }));
  };

  const updateCell = (rowIdx: number, colKey: string, value: string) => {
    const newData = [...block.content];
    newData[rowIdx] = { ...newData[rowIdx], [colKey]: value };
    handleDataUpdate(newData);
  };

  const renameColumn = (oldName: string, newName: string) => {
    if (!newName || oldName === newName) return;
    handleDataUpdate(block.content.map((row: any) => {
      const newRow: any = {};
      Object.keys(row).forEach(key => {
        if (key === oldName) newRow[newName] = row[key];
        else newRow[key] = row[key];
      });
      return newRow;
    }));
  };

  const initEmptyTable = () => {
    handleDataUpdate([
      { 'Column 1': '', 'Column 2': '' },
      { 'Column 1': '', 'Column 2': '' }
    ]);
  };

  const hasData = Array.isArray(block.content) && block.content.length > 0;
  
  if (!hasData) {
    return (
      <div 
        className={`w-full p-8 mt-2 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all min-h-[250px] ${
          dragActive 
          ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20 scale-[1.01]' 
          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/30 dark:bg-zinc-900/30'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFileUpload(e); }}
        onPaste={(e) => {
          const text = e.clipboardData.getData('text');
          if (processText(text)) e.preventDefault();
        }}
      >
        {!showPaste ? (
          <>
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-full shadow-sm mb-4 border border-zinc-100 dark:border-zinc-800">
              <TableIcon className="text-indigo-500" size={32} />
            </div>
            <p className="text-base font-semibold text-zinc-800 dark:text-zinc-200">Start with a table</p>
            <p className="text-sm text-zinc-500 mb-6 text-center max-w-xs">Create a new table or import data from CSV/JSON</p>
            
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button 
                onClick={initEmptyTable}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-all shadow-md shadow-indigo-500/20"
              >
                <Plus size={16} /> New Table
              </button>
              <label className="px-4 py-2 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-sm font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 cursor-pointer flex items-center gap-2 transition-all">
                <FileUp size={16} /> Upload
                <input type="file" accept=".csv,.json" className="hidden" onChange={handleFileUpload} />
              </label>
              <button 
                onClick={() => setShowPaste(true)}
                className="px-4 py-2 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-sm font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 flex items-center gap-2 transition-all"
              >
                <Clipboard size={16} /> Paste
              </button>
            </div>
          </>
        ) : (
          <div className="w-full max-w-lg flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Paste JSON or CSV</span>
              <button onClick={() => setShowPaste(false)} className="text-zinc-400 hover:text-zinc-600"><X size={16} /></button>
            </div>
            <textarea 
              autoFocus
              className="w-full h-32 p-3 text-xs font-mono bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all custom-scrollbar"
              placeholder='[{"Name": "John", "Age": 30}, ...]'
              value={pasteValue}
              onChange={(e) => {
                setPasteValue(e.target.value);
                if (processText(e.target.value)) {
                  setPasteValue('');
                  setShowPaste(false);
                }
              }}
            />
          </div>
        )}
      </div>
    );
  }

  const headers = Object.keys(block.content[0] || {});
  
  return (
    <div className="w-full mt-4 mb-2 group/table-root">
      <div className="overflow-x-auto custom-scrollbar rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm relative">
        <table className="w-full text-sm text-left border-collapse table-fixed">
          <thead className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              {headers.map((hl, i) => (
                <th 
                  key={i} 
                  className="px-4 py-2 border-r border-zinc-100 dark:border-zinc-800 last:border-r-0 relative group/header"
                >
                  <div 
                    contentEditable
                    suppressContentEditableWarning
                    className="font-semibold text-zinc-600 dark:text-zinc-400 outline-none focus:text-indigo-600 transition-colors py-1 truncate"
                    onBlur={(e) => renameColumn(hl, e.currentTarget.textContent || hl)}
                    onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                  >
                    {hl}
                  </div>
                  <button 
                    onClick={() => deleteColumn(hl)}
                    className="absolute -top-1 -right-1 p-1 bg-white dark:bg-zinc-900 text-red-500 rounded-full border border-red-50 opacity-0 group-hover/header:opacity-100 transition-opacity hover:bg-red-50"
                  >
                    <X size={10} />
                  </button>
                </th>
              ))}
              <th className="w-10 px-0 py-0 border-l border-zinc-100 dark:border-zinc-800 bg-zinc-50/30">
                <button 
                  onClick={addColumn}
                  className="w-full h-full flex items-center justify-center text-zinc-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all"
                  title="Add Column"
                >
                  <Plus size={14} />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {block.content.map((row: any, i: number) => (
              <tr 
                key={i} 
                className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50/20 dark:hover:bg-zinc-900/20 transition-colors group/row"
              >
                {headers.map((hl, j) => (
                  <td key={j} className="border-r border-zinc-100 dark:border-zinc-800 last:border-r-0 p-0 relative">
                    <div 
                      contentEditable
                      suppressContentEditableWarning
                      className="px-4 py-2 outline-none text-zinc-600 dark:text-zinc-400 focus:bg-white dark:focus:bg-zinc-900 shadow-inner-indigo min-h-[40px] break-words"
                      onBlur={(e) => updateCell(i, hl, e.currentTarget.textContent || '')}
                    >
                      {row[hl]}
                    </div>
                  </td>
                ))}
                <td className="w-10 text-center opacity-0 group-hover/row:opacity-100 transition-opacity">
                   <button 
                    onClick={() => deleteRow(i)}
                    className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                    title="Delete Row"
                   >
                     <Trash size={12} />
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <button 
          onClick={addRow}
          className="w-full py-2.5 flex items-center justify-center gap-2 text-zinc-400 hover:text-indigo-500 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-all border-t border-zinc-100 dark:border-zinc-800"
        >
          <Plus size={14} /> <span className="text-xs font-medium">Add Row</span>
        </button>
      </div>
      
      {block.content.length > 0 && (
        <div className="mt-2 flex items-center justify-end gap-2 opacity-0 group-hover/table-root:opacity-100 transition-opacity">
           <span className="text-[10px] text-zinc-400 font-medium">{block.content.length} rows × {headers.length} columns</span>
        </div>
      )}
    </div>
  );
}
