import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import type { PipelineNodeData } from './pipelineStore';
import { usePipelineStore } from './pipelineStore';
import { clsx } from 'clsx';
import { CheckCircle2, Loader2, Play, Trash2 } from 'lucide-react';

export function ToolNode({ id, data }: NodeProps<PipelineNodeData>) {
  const deleteNode = usePipelineStore((state) => state.deleteNode);
  const { tool, status } = data;
  const Icon = tool.icon;

  const isIdle = status === 'idle';
  const isRunning = status === 'running';
  const isSuccess = status === 'success';

  return (
    <div className={clsx(
      "relative bg-white dark:bg-zinc-900 rounded-xl border-2 p-4 shadow-sm w-64 transition-all duration-300",
      isIdle && "border-zinc-200 dark:border-zinc-800",
      isRunning && "border-brand-500 shadow-brand-500/20 shadow-lg",
      isSuccess && "border-green-500 shadow-green-500/20"
    )}>
      {/* Input handle (left) */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-zinc-400 dark:bg-zinc-600 border-2 border-white dark:border-zinc-900"
      />

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={clsx(
            "p-2 rounded-lg",
            isIdle && "bg-brand-500/10 text-brand-500",
            isRunning && "bg-brand-500 text-white animate-pulse",
            isSuccess && "bg-green-500/10 text-green-500"
          )}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
              {tool.name}
            </h3>
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

      <div className="flex items-center justify-between text-xs font-medium">
        <span className="text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">
          {tool.inputType.length > 0 ? tool.inputType[0].toUpperCase() : 'NONE'}
        </span>
        
        {isRunning && <Loader2 className="w-4 h-4 text-brand-500 animate-spin" />}
        {isSuccess && <CheckCircle2 className="w-4 h-4 text-green-500" />}
        {isIdle && <Play className="w-4 h-4 text-zinc-300" />}

        <span className="text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">
          {tool.outputType.length > 0 ? tool.outputType[0].toUpperCase() : 'NONE'}
        </span>
      </div>

      {/* Output handle (right) */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-zinc-400 dark:bg-zinc-600 border-2 border-white dark:border-zinc-900"
      />
    </div>
  );
}
