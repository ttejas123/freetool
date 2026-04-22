'use client';

import { useCallback, useRef, useState } from 'react';
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
import { Play, Trash2, Save, FolderOpen, X, CheckCircle2, ChevronDown } from 'lucide-react';

const nodeTypes = {
  toolNode: ToolNode,
};

// ── Save/Load Modal ────────────────────────────────────────────────────────────
function SaveModal({ onClose, onSave }: { onClose: () => void; onSave: (name: string) => void }) {
  const [name, setName] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700 p-6 w-80">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-zinc-900 dark:text-zinc-100">Save Pipeline</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200">
            <X className="w-4 h-4" />
          </button>
        </div>
        <input
          autoFocus
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && name.trim()) { onSave(name.trim()); onClose(); } }}
          placeholder="Pipeline name..."
          className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 mb-4"
        />
        <button
          disabled={!name.trim()}
          onClick={() => { onSave(name.trim()); onClose(); }}
          className="w-full py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  );
}

// ── Load Dropdown ──────────────────────────────────────────────────────────────
function LoadDropdown({
  savedPipelines,
  onLoad,
  onDelete,
  onClose,
}: {
  savedPipelines: Record<string, { name: string; savedAt: number }>;
  onLoad: (name: string) => void;
  onDelete: (name: string) => void;
  onClose: () => void;
}) {
  const names = Object.keys(savedPipelines);
  if (names.length === 0) {
    return (
      <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl z-50 p-4 text-sm text-zinc-500 text-center">
        No saved pipelines yet
      </div>
    );
  }
  return (
    <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl z-50 overflow-hidden">
      <div className="px-3 py-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800">
        Saved Pipelines
      </div>
      {names.map(name => (
        <div key={name} className="flex items-center justify-between px-3 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 group">
          <button
            className="flex-1 text-left"
            onClick={() => { onLoad(name); onClose(); }}
          >
            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{name}</p>
            <p className="text-xs text-zinc-400">
              {new Date(savedPipelines[name].savedAt).toLocaleString()}
            </p>
          </button>
          <button
            onClick={() => onDelete(name)}
            className="ml-2 text-zinc-300 hover:text-red-500 dark:text-zinc-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Canvas Impl ────────────────────────────────────────────────────────────────
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
  const savePipeline = usePipelineStore((state) => state.savePipeline);
  const loadPipeline = usePipelineStore((state) => state.loadPipeline);
  const deleteSavedPipeline = usePipelineStore((state) => state.deleteSavedPipeline);
  const savedPipelines = usePipelineStore((state) => state.savedPipelines);

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadMenu, setShowLoadMenu] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const handleSave = (name: string) => {
    savePipeline(name);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  };

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
    <>
      {showSaveModal && (
        <SaveModal
          onClose={() => setShowSaveModal(false)}
          onSave={handleSave}
        />
      )}

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
              if (n.data?.status === 'success') return '#22c55e';
              if (n.data?.status === 'running') return '#3b82f6';
              if (n.data?.status === 'error') return '#ef4444';
              return '#e4e4e7';
            }}
            nodeColor={(n) => n.data?.status === 'running' ? '#eff6ff' : '#ffffff'}
          />

          <Panel position="top-right" className="flex items-center space-x-2">
            {/* Save button */}
            <button
              onClick={() => setShowSaveModal(true)}
              disabled={nodes.length === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-brand-50 hover:border-brand-200 hover:text-brand-600 transition-colors shadow-sm text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {savedFlash ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Save className="w-4 h-4" />}
              <span>{savedFlash ? 'Saved!' : 'Save'}</span>
            </button>

            {/* Load dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowLoadMenu(v => !v)}
                className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors shadow-sm text-sm font-medium"
              >
                <FolderOpen className="w-4 h-4" />
                <span>Load</span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              </button>
              {showLoadMenu && (
                <LoadDropdown
                  savedPipelines={savedPipelines}
                  onLoad={loadPipeline}
                  onDelete={deleteSavedPipeline}
                  onClose={() => setShowLoadMenu(false)}
                />
              )}
            </div>

            {/* Clear button */}
            <button
              onClick={clearPipeline}
              className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors shadow-sm text-sm font-medium"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear</span>
            </button>

            {/* Run button */}
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
    </>
  );
}

export function PipelineCanvas() {
  return (
    <ReactFlowProvider>
      <PipelineCanvasImpl />
    </ReactFlowProvider>
  );
}
