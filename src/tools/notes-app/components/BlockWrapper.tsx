import { useState } from 'react';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import type { BlockData } from '../types';
import { useEditorStore } from '../store';
import { TextBlock } from '../blocks/TextBlock';
import { TableBlock } from '../blocks/TableBlock';
import { MediaBlock } from '../blocks/MediaBlock';

interface BlockWrapperProps {
  block: BlockData;
  dragControls?: any;
}

export function BlockWrapper({ block, dragControls }: BlockWrapperProps) {
  const { addBlock, deleteBlock, focusedBlockId } = useEditorStore();
  const [isHovered, setIsHovered] = useState(false);
  
  const isFocused = focusedBlockId === block.id;

  const handleAddBelow = () => {
    addBlock({ type: 'text', content: '' }, block.id);
  };

  const renderBlock = () => {
    switch (block.type) {
      case 'text':
      case 'h1':
      case 'h2':
      case 'h3':
        return <TextBlock block={block} isFocused={isFocused} />;
      case 'table':
        return <TableBlock block={block} />;
      case 'image':
      case 'video':
      case 'file':
        return <MediaBlock block={block} />;
      default:
        return <div className="p-2 text-red-500">Unknown block type: {block.type}</div>;
    }
  };

  return (
    <div 
      className="group flex flex-col relative w-full mb-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start">
        {/* Hover Actions Panel */}
        <div 
          className={`flex-none w-20 flex items-center justify-end pr-2 opacity-0 transition-opacity gap-0.5 ${
            isHovered || isFocused ? 'opacity-100' : ''
          }`}
        >
          <button 
            onClick={() => deleteBlock(block.id)}
            className="p-1 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
            title="Delete block"
          >
            <Trash2 size={14} />
          </button>
          <button 
            onClick={handleAddBelow}
            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
            title="Add block below"
          >
            <Plus size={16} />
          </button>
          <div 
            className="p-1 cursor-grab active:cursor-grabbing text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
            onPointerDown={(e) => dragControls?.start(e)}
            style={{ touchAction: "none" }}
            title="Drag to reorder"
          >
            <GripVertical size={16} />
          </div>
        </div>
        
        <div className="flex-1 min-w-0 pr-4">
          {renderBlock()}
        </div>
      </div>
    </div>
  );
}
