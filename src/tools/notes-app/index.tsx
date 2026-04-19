import { Plus, ExternalLink, Menu } from 'lucide-react';
import { useEditorStore } from './store';
import { BlockWrapper } from './components/BlockWrapper';
import { Sidebar } from './components/Sidebar';
import { Reorder, useDragControls } from 'framer-motion';
import { useState } from 'react';

function DraggableItem({ block }: any) {
  const controls = useDragControls();
  return (
    <Reorder.Item value={block} className="w-full" dragListener={false} dragControls={controls}>
      <BlockWrapper block={block} dragControls={controls} />
    </Reorder.Item>
  );
}

export default function BlockEditor() {
  const { pages, activePageId, addBlock, updatePageTitle } = useEditorStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const activePage = pages.find(p => p.id === activePageId) || pages[0];
  const blocks = activePage.blocks;

  return (
    <div className="flex h-full bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-hidden">
      {/* Sidebar */}
      {isSidebarOpen && <Sidebar />}

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        <div className="flex-none p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-md transition-colors text-zinc-500"
            >
              <Menu size={18} />
            </button>
            <h1 className="text-lg font-bold flex items-center gap-2">
              <span className="bg-gradient-to-br from-indigo-500 to-purple-600 bg-clip-text text-transparent">NoteSpace</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button 
              className="p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 transition-colors"
              title="Pop out into Sticky Note"
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.set('popup', 'true');
                window.open(url.toString(), 'StickyNote', 'width=450,height=600,popup=1');
              }}
            >
              <ExternalLink size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto w-full flex justify-center pb-32 pt-12 custom-scrollbar">
          <div className="w-full max-w-3xl px-8 flex flex-col gap-1">
            {/* Page Title */}
            <div className="mb-8 group/title">
              <input 
                type="text"
                value={activePage.title}
                onChange={(e) => updatePageTitle(activePage.id, e.target.value)}
                placeholder="Untitled"
                className="w-full text-5xl font-bold bg-transparent border-none outline-none placeholder:text-zinc-200 dark:placeholder:text-zinc-800"
              />
            </div>

            <Reorder.Group 
              axis="y" 
              values={blocks} 
              onReorder={(newBlocks) => {
                // Find index differences to call reorderBlocks or just overwrite
                // For simplicity with framer-motion and zustand, we can check if it changed
                if (JSON.stringify(newBlocks) !== JSON.stringify(blocks)) {
                  useEditorStore.setState((state) => ({
                    pages: state.pages.map(p => p.id === activePageId ? { ...p, blocks: newBlocks } : p)
                  }));
                }
              }} 
              className="w-full space-y-1"
            >
              {blocks.map((block) => (
                <DraggableItem key={block.id} block={block} />
              ))}
            </Reorder.Group>
            
            <div 
              className="mt-8 p-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-400 flex items-center gap-2 cursor-text transition-all opacity-0 hover:opacity-100 border border-transparent hover:border-zinc-100 dark:hover:border-zinc-800 rounded-lg group"
              onClick={() => addBlock({ type: 'text', content: '' }, blocks[blocks.length - 1]?.id)}
            >
              <div className="p-1 bg-zinc-50 dark:bg-zinc-900 rounded group-hover:bg-zinc-100 dark:group-hover:bg-zinc-800 transition-colors">
                <Plus size={16} /> 
              </div>
              <span className="text-sm font-medium">Click to add a block</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
