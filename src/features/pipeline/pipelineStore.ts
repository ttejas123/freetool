import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';
import type {
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
} from 'reactflow';
import type { RegistryTool } from '@/tools/toolRegistry';
import { executeNode } from './executionEngine';

export type PipelineNodeData = {
  tool: RegistryTool;
  status: 'idle' | 'running' | 'success' | 'error';
  input?: string;
  output?: any;
  config?: Record<string, any>; // per-node config (e.g. compression algorithm)
};

export type PipelineNode = Node<PipelineNodeData>;

export type SavedPipeline = {
  name: string;
  nodes: PipelineNode[];
  edges: Edge[];
  savedAt: number;
};

export interface PipelineState {
  nodes: PipelineNode[];
  edges: Edge[];
  savedPipelines: Record<string, SavedPipeline>;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  addNode: (tool: RegistryTool, position: { x: number; y: number }) => void;
  updateNodeData: (nodeId: string, data: Partial<PipelineNodeData>) => void;
  runPipeline: () => Promise<void>;
  clearPipeline: () => void;
  deleteNode: (nodeId: string) => void;
  savePipeline: (name: string) => void;
  loadPipeline: (name: string) => void;
  deleteSavedPipeline: (name: string) => void;
}

export const usePipelineStore = create<PipelineState>()(
  persist(
    (set, get) => ({
      nodes: [],
      edges: [],
      savedPipelines: {},
      onNodesChange: (changes: NodeChange[]) => {
        set({
          nodes: applyNodeChanges(changes, get().nodes) as PipelineNode[],
        });
      },
      onEdgesChange: (changes: EdgeChange[]) => {
        set({
          edges: applyEdgeChanges(changes, get().edges),
        });
      },
      onConnect: (connection: Connection) => {
        set({
          edges: addEdge(
            { ...connection, animated: true, style: { stroke: '#6366f1', strokeWidth: 2 } },
            get().edges
          ),
        });
      },
      addNode: (tool: RegistryTool, position: { x: number; y: number }) => {
        const newNode: PipelineNode = {
          id: `${tool.id}-${Date.now()}`,
          type: 'toolNode',
          position,
          data: {
            tool,
            status: 'idle',
            config: {},
          },
        };
        set({ nodes: [...get().nodes, newNode] });
      },
      deleteNode: (nodeId: string) => {
        set({
          nodes: get().nodes.filter((node) => node.id !== nodeId),
          edges: get().edges.filter(
            (edge) => edge.source !== nodeId && edge.target !== nodeId
          ),
        });
      },
      updateNodeData: (nodeId: string, data: Partial<PipelineNodeData>) => {
        set({
          nodes: get().nodes.map((node) => {
            if (node.id === nodeId) {
              return { ...node, data: { ...node.data, ...data } };
            }
            return node;
          }),
        });
      },
      clearPipeline: () => {
        set({ nodes: [], edges: [] });
      },
      savePipeline: (name: string) => {
        const { nodes, edges, savedPipelines } = get();
        const saved: SavedPipeline = {
          name,
          nodes: nodes.map(n => ({ ...n, data: { ...n.data, status: 'idle', output: undefined } })),
          edges,
          savedAt: Date.now(),
        };
        set({ savedPipelines: { ...savedPipelines, [name]: saved } });
      },
      loadPipeline: (name: string) => {
        const { savedPipelines } = get();
        const pipeline = savedPipelines[name];
        if (!pipeline) return;
        set({ nodes: pipeline.nodes, edges: pipeline.edges });
      },
      deleteSavedPipeline: (name: string) => {
        const { savedPipelines } = get();
        const next = { ...savedPipelines };
        delete next[name];
        set({ savedPipelines: next });
      },
      runPipeline: async () => {
        const { nodes, edges, updateNodeData } = get();

        // Reset status
        nodes.forEach(n => updateNodeData(n.id, { status: 'idle', output: undefined }));

        // Build adjacency list for BFS topological traversal
        const adj = new Map<string, string[]>();
        const inDegree = new Map<string, number>();

        nodes.forEach(n => {
          adj.set(n.id, []);
          inDegree.set(n.id, 0);
        });

        edges.forEach(e => {
          if (adj.has(e.source) && inDegree.has(e.target)) {
            adj.get(e.source)!.push(e.target);
            inDegree.set(e.target, inDegree.get(e.target)! + 1);
          }
        });

        // Find root nodes (no incoming edges)
        const queue: string[] = [];
        nodes.forEach(n => {
          if (inDegree.get(n.id) === 0) queue.push(n.id);
        });

        const outputs = new Map<string, any>();

        while (queue.length > 0) {
          const currId = queue.shift()!;
          const node = get().nodes.find(n => n.id === currId);
          if (!node) continue;

          updateNodeData(currId, { status: 'running' });

          // Determine input
          const incomingEdges = edges.filter(e => e.target === currId);
          let inputToProcess: any = node.data.input;

          if (incomingEdges.length > 0) {
            const parentId = incomingEdges[0].source;
            inputToProcess = outputs.get(parentId);
          }

          try {
            const output = await executeNode(
              node.data.tool.id,
              inputToProcess || '',
              node.data.config || {}
            );
            outputs.set(currId, output);
            updateNodeData(currId, { status: 'success', output });

            for (const childId of adj.get(currId) || []) {
              inDegree.set(childId, inDegree.get(childId)! - 1);
              if (inDegree.get(childId) === 0) {
                queue.push(childId);
              }
            }
          } catch (err) {
            console.error(err);
            updateNodeData(currId, { status: 'error' });
            break;
          }
        }
      },
    }),
    {
      name: 'freetool-pipeline-storage',
    }
  )
);
