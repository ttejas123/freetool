export type BlockType = 'text' | 'h1' | 'h2' | 'h3' | 'table' | 'image' | 'video' | 'file';

export interface BlockData {
  id: string;
  type: BlockType;
  content: any;
  metadata?: Record<string, any>;
}

export interface Page {
  id: string;
  title: string;
  icon?: string;
  blocks: BlockData[];
}

export interface EditorState {
  pages: Page[];
  activePageId: string;
  focusedBlockId: string | null;
  
  // Page Actions
  addPage: (title?: string, blocks?: BlockData[]) => void;
  deletePage: (id: string) => void;
  setActivePage: (id: string) => void;
  updatePageTitle: (id: string, title: string) => void;
  
  // Block Actions (modified to work on active page)
  addBlock: (block: Omit<BlockData, 'id'>, afterId?: string) => void;
  updateBlock: (id: string, partial: Partial<BlockData>) => void;
  deleteBlock: (id: string) => void;
  setFocusedBlock: (id: string | null) => void;
  reorderBlocks: (fromIndex: number, toIndex: number) => void;
  
  // Global Actions
  resetAll: () => void;
}
