'use client';

import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import type { PipelineNodeData } from './pipelineStore';
import { usePipelineStore } from './pipelineStore';
import { clsx } from 'clsx';
import { CheckCircle2, Loader2, Play, Trash2, AlertCircle, Download } from 'lucide-react';

import { toolRegistry } from '@/tools/toolRegistry';

// ── Compression selector for download-zip node ────────────────────────────────
function ZipConfigPanel({ id, config }: { id: string; config: Record<string, any> }) {
  const updateNodeData = usePipelineStore(s => s.updateNodeData);
  return (
    <div className="mb-3 space-y-1.5">
      <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Compression</label>
      <div className="flex gap-2">
        {['deflate', 'none'].map(algo => (
          <button
            key={algo}
            onClick={() => updateNodeData(id, { config: { ...config, compression: algo } })}
            className={clsx(
              'flex-1 text-xs py-1 rounded-md font-medium border transition-colors',
              (config.compression ?? 'deflate') === algo
                ? 'bg-brand-500 text-white border-brand-500'
                : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-brand-300'
            )}
          >
            {algo === 'deflate' ? 'Deflate (zlib)' : 'None'}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Output preview helper ─────────────────────────────────────────────────────
function OutputPreview({ output, toolId }: { output: any; toolId: string }) {
  if (toolId === 'qr-generator' && Array.isArray(output)) {
    return (
      <div className="mb-3 flex flex-wrap gap-1.5">
        {output.slice(0, 4).map((item: any, i: number) => (
          <img
            key={i}
            src={item.dataUri}
            alt={`QR ${i + 1}`}
            className="w-12 h-12 rounded border border-zinc-200 dark:border-zinc-700 bg-white"
          />
        ))}
        {output.length > 4 && (
          <div className="w-12 h-12 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-xs text-zinc-500">
            +{output.length - 4}
          </div>
        )}
      </div>
    );
  }

  if ((toolId === 'tinyurl-shorten' || toolId === 'tinyurl-expand') && Array.isArray(output)) {
    return (
      <div className="mb-3 space-y-1">
        {output.slice(0, 3).map((item: any, i: number) => (
          <div key={i} className="text-xs rounded bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2 py-1 truncate text-zinc-600 dark:text-zinc-400">
            {item.short || item.resolved || JSON.stringify(item)}
          </div>
        ))}
        {output.length > 3 && <div className="text-xs text-zinc-400">+{output.length - 3} more</div>}
      </div>
    );
  }

  return null;
}

// ── Main ToolNode ─────────────────────────────────────────────────────────────
export function ToolNode({ id, data }: NodeProps<PipelineNodeData>) {
  const deleteNode = usePipelineStore((state) => state.deleteNode);
  const updateNodeData = usePipelineStore((state) => state.updateNodeData);
  const edges = usePipelineStore((state) => state.edges);

  const { status, input, output, config = {} } = data;
  
  // Rehydrate tool from registry to restore functions/components lost during localStorage serialization
  const tool = toolRegistry.find(t => t.id === data.tool.id) || data.tool;
  const Icon = tool.icon;

  const isIdle = status === 'idle';
  const isRunning = status === 'running';
  const isSuccess = status === 'success';
  const isError = status === 'error';

  const isRoot = !edges.some(e => e.target === id);

  const handleDownload = () => {
    if (!output) return;
    const content = typeof output === 'string' ? output : JSON.stringify(output, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tool.id}-result.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={clsx(
      'relative bg-white dark:bg-zinc-900 rounded-xl border-2 p-4 shadow-sm w-72 transition-all duration-300',
      isIdle && 'border-zinc-200 dark:border-zinc-800',
      isRunning && 'border-brand-500 shadow-brand-500/20 shadow-lg',
      isSuccess && 'border-green-500 shadow-green-500/20',
      isError && 'border-red-500 shadow-red-500/20'
    )}>
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-zinc-400 dark:bg-zinc-600 border-2 border-white dark:border-zinc-900"
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={clsx(
            'p-2 rounded-lg',
            isIdle && 'bg-brand-500/10 text-brand-500',
            isRunning && 'bg-brand-500 text-white animate-pulse',
            isSuccess && 'bg-green-500/10 text-green-500',
            isError && 'bg-red-500/10 text-red-500'
          )}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">{tool.name}</h3>
            <p className="text-xs text-zinc-500">{tool.category}</p>
          </div>
        </div>
        <button
          onClick={() => deleteNode(id)}
          className="text-zinc-400 hover:text-red-500 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Root: input textarea */}
      {isRoot && (
        <div className="mb-3">
          <textarea
            className="w-full h-16 text-xs p-2 rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 resize-none focus:outline-none focus:ring-1 focus:ring-brand-500"
            placeholder="Enter input here (one URL per line)..."
            value={input || ''}
            onChange={(e) => updateNodeData(id, { input: e.target.value })}
            disabled={isRunning}
          />
        </div>
      )}

      {/* Per-node config */}
      {tool.id === 'download-zip' && (
        <ZipConfigPanel id={id} config={config} />
      )}

      {/* Output preview */}
      {isSuccess && output && (
        <OutputPreview output={output} toolId={tool.id} />
      )}

      {/* Download button for non-zip tools */}
      {isSuccess && output && tool.id !== 'download-zip' && (
        <div className="mb-3">
          <button
            onClick={handleDownload}
            className="w-full text-xs font-medium py-1.5 px-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-md border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors flex items-center justify-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Download Output
          </button>
        </div>
      )}

      {/* Error message */}
      {isError && (
        <div className="mb-3 flex items-center gap-1.5 text-xs text-red-500 bg-red-50 dark:bg-red-900/20 rounded-md px-2.5 py-1.5 border border-red-200 dark:border-red-800">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Execution failed – check console</span>
        </div>
      )}

      {/* Footer type badges */}
      <div className="flex items-center justify-between text-xs font-medium">
        <span className="text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">
          {tool.inputType.length > 0 ? tool.inputType[0].toUpperCase() : 'NONE'}
        </span>

        {isRunning && <Loader2 className="w-4 h-4 text-brand-500 animate-spin" />}
        {isSuccess && <CheckCircle2 className="w-4 h-4 text-green-500" />}
        {isIdle && <Play className="w-4 h-4 text-zinc-300" />}
        {isError && <AlertCircle className="w-4 h-4 text-red-400" />}

        <span className="text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">
          {tool.outputType.length > 0 ? tool.outputType[0].toUpperCase() : 'NONE'}
        </span>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-zinc-400 dark:bg-zinc-600 border-2 border-white dark:border-zinc-900"
      />
    </div>
  );
}
