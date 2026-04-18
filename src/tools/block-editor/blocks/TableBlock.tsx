import React, { useState } from 'react';
import { Table as TableIcon, FileUp, Trash2 } from 'lucide-react';
import Papa from 'papaparse';
import type { BlockData } from '../types';
import { useEditorStore } from '../store';

interface TableBlockProps {
  block: BlockData;
}

export function TableBlock({ block }: TableBlockProps) {
  const { updateBlock, deleteBlock } = useEditorStore();
  const [dragActive, setDragActive] = useState(false);

  const handleDataUpdate = (data: any[]) => {
    updateBlock(block.id, { content: data });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.csv')) {
      Papa.parse(file, {
        complete: (results) => {
          handleDataUpdate(results.data);
        },
        header: true,
        worker: true,
      });
    } else if (file.name.endsWith('.json')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          if (Array.isArray(json)) {
             handleDataUpdate(json);
          } else {
             alert('JSON must be an array of objects.');
          }
        } catch (e) {
          console.error(e);
        }
      };
      reader.readAsText(file);
    }
  };

  const hasData = Array.isArray(block.content) && block.content.length > 0;
  
  if (!hasData) {
    return (
      <div 
        className={`w-full p-8 mt-2 rounded-lg border-2 border-dashed flex flex-col items-center justify-center transition-colors ${
          dragActive ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => { e.preventDefault(); setDragActive(false); /* Implement similar to file upload */ }}
      >
        <TableIcon className="text-zinc-400 mb-2" size={32} />
        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Upload CSV or JSON to create a table</p>
        <label className="mt-4 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-sm rounded-md cursor-pointer flex items-center gap-2 transition-colors">
          <FileUp size={16} /> Choose File
          <input type="file" accept=".csv,.json" className="hidden" onChange={handleFileUpload} />
        </label>
      </div>
    );
  }

  // Render Table
  const headers = Object.keys(block.content[0] || {});
  
  return (
    <div className="w-full overflow-x-auto mt-4 mb-2 rounded border border-zinc-200 dark:border-zinc-800 relative group">
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={() => deleteBlock(block.id)}
          className="p-1.5 bg-red-100 text-red-600 rounded shadow-sm hover:bg-red-200"
          title="Delete Table"
        >
          <Trash2 size={14} />
        </button>
      </div>
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 dark:bg-zinc-900">
          <tr>
            {headers.map((hl, i) => (
              <th key={i} className="px-4 py-2 font-semibold">
                {String(hl)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.content.slice(0, 100).map((row: any, i: number) => (
            <tr key={i} className="border-b border-zinc-100 dark:border-zinc-800">
              {headers.map((hl, j) => (
                <td key={j} className="px-4 py-2 max-w-xs truncate">
                  {typeof row[hl] === 'object' ? JSON.stringify(row[hl]) : String(row[hl] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {block.content.length > 100 && (
         <div className="p-2 text-center text-xs text-zinc-500 border-t border-zinc-200 dark:border-zinc-800">
            Showing first 100 of {block.content.length} rows.
         </div>
      )}
    </div>
  );
}
