import { create } from 'zustand';
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

export type PipelineNodeData = {
  tool: RegistryTool;
  status: 'idle' | 'running' | 'success' | 'error';
  input?: any;
  output?: any;
};

export type PipelineNode = Node<PipelineNodeData>;

export interface PipelineState {
  nodes: PipelineNode[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  addNode: (tool: RegistryTool, position: { x: number; y: number }) => void;
  updateNodeData: (nodeId: string, data: Partial<PipelineNodeData>) => void;
  runPipeline: () => Promise<void>;
  clearPipeline: () => void;
  deleteNode: (nodeId: string) => void;
}

export const usePipelineStore = create<PipelineState>((set, get) => ({
  nodes: [],
  edges: [],
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
      edges: addEdge(connection, get().edges),
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
  runPipeline: async () => {
    const { nodes, edges, updateNodeData } = get();
    // Simple naive execution order: find root nodes, then walk
    // For this demo, we'll just execute them sequentially as they are linked

    const executed = new Set<string>();
    
    // reset status
    nodes.forEach(n => updateNodeData(n.id, { status: 'idle' }));

    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        updateNodeData(node.id, { status: 'running' });
        
        // Simulate execution time
        await new Promise((resolve) => setTimeout(resolve, 800));
        
        updateNodeData(node.id, { status: 'success', output: 'Processed Data' });
    }
  },
}));
