export type BlockType = 'text' | 'h1' | 'h2' | 'h3' | 'table' | 'image' | 'video' | 'file';

export interface BlockData {
  id: string;
  type: BlockType;
  content: any;
  metadata?: Record<string, any>;
}

export interface EditorState {
  blocks: BlockData[];
  focusedBlockId: string | null;
  addBlock: (block: Omit<BlockData, 'id'>, afterId?: string) => void;
  updateBlock: (id: string, partial: Partial<BlockData>) => void;
  deleteBlock: (id: string) => void;
  setFocusedBlock: (id: string | null) => void;
  reorderBlocks: (fromIndex: number, toIndex: number) => void;
  AI_API_KEY: string | null;
  setApiKey: (key: string) => void;
}
