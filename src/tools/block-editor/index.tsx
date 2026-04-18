import { Plus, ExternalLink } from 'lucide-react';
import { useEditorStore } from './store';
import { BlockWrapper } from './components/BlockWrapper';
import { Reorder, useDragControls } from 'framer-motion';

function DraggableItem({ block }: any) {
  const controls = useDragControls();
  return (
    <Reorder.Item value={block} className="w-full" dragListener={false} dragControls={controls}>
      <BlockWrapper block={block} dragControls={controls} />
    </Reorder.Item>
  );
}

export default function BlockEditor() {
  const { blocks, addBlock } = useEditorStore();

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 relative">
      <div className="flex-none p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <span className="bg-gradient-to-br from-indigo-500 to-purple-600 bg-clip-text text-transparent">Notion Clone</span>
        </h1>
        <div className="flex items-center gap-2 relative">
          <button 
            className="p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 transition-colors"
            title="Pop out into Sticky Note (Always on Top)"
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

      <div className="flex-1 overflow-y-auto w-full flex justify-center pb-32 pt-12">
        <div className="w-full max-w-3xl px-8 flex flex-col gap-1">
          <Reorder.Group axis="y" values={blocks} onReorder={(newBlocks) => useEditorStore.setState({ blocks: newBlocks })} className="w-full">
            {blocks.map((block, index) => (
              <DraggableItem key={block.id} block={block} index={index} />
            ))}
          </Reorder.Group>
          
          <div 
            className="mt-4 p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 flex items-center gap-2 cursor-text transition-colors opacity-0 hover:opacity-100"
            onClick={() => addBlock({ type: 'text', content: '' }, blocks[blocks.length - 1]?.id)}
          >
            <Plus size={20} /> Click to add a block
          </div>
        </div>
      </div>
    </div>
  );
}
