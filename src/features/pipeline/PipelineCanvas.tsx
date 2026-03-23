import { useCallback, useRef } from 'react';
import type { DragEvent } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { usePipelineStore } from './pipelineStore';
import { ToolNode } from './ToolNode';
import { toolRegistry } from '@/tools/toolRegistry';
import { Play, Trash2 } from 'lucide-react';

const nodeTypes = {
  toolNode: ToolNode,
};

function PipelineCanvasImpl() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { project } = useReactFlow();
  
  const nodes = usePipelineStore((state) => state.nodes);
  const edges = usePipelineStore((state) => state.edges);
  const onNodesChange = usePipelineStore((state) => state.onNodesChange);
  const onEdgesChange = usePipelineStore((state) => state.onEdgesChange);
  const onConnect = usePipelineStore((state) => state.onConnect);
  const addNode = usePipelineStore((state) => state.addNode);
  const clearPipeline = usePipelineStore((state) => state.clearPipeline);
  const runPipeline = usePipelineStore((state) => state.runPipeline);

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      const toolId = event.dataTransfer.getData('application/reactflow');
      if (!toolId) return;

      const tool = toolRegistry.find((t) => t.id === toolId);
      if (!tool) return;

      if (!reactFlowWrapper.current) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      
      const position = project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      addNode(tool, position);
    },
    [project, addNode]
  );

  return (
    <div className="flex-1 h-full w-full relative" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop as any}
        onDragOver={onDragOver as any}
        nodeTypes={nodeTypes}
        fitView
        className="bg-zinc-50 dark:bg-zinc-900/50"
      >
        <Background gap={12} size={1} />
        <Controls />
        <MiniMap 
          nodeStrokeColor={(n) => {
            if (n.data?.status === 'success') return '#22c55e'
            if (n.data?.status === 'running') return '#3b82f6'
            return '#e4e4e7';
          }}
          nodeColor={(n) => n.data?.status === 'running' ? '#eff6ff' : '#ffffff'}
        />

        <Panel position="top-right" className="flex space-x-2">
          <button
            onClick={clearPipeline}
            className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors shadow-sm text-sm font-medium"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear</span>
          </button>
          
          <button
            onClick={runPipeline}
            disabled={nodes.length === 0}
            className="flex items-center space-x-2 px-6 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
          >
            <Play className="w-4 h-4" />
            <span>Run Pipeline</span>
          </button>
        </Panel>
      </ReactFlow>
    </div>
  );
}

export function PipelineCanvas() {
  return (
    <ReactFlowProvider>
      <PipelineCanvasImpl />
    </ReactFlowProvider>
  );
}
