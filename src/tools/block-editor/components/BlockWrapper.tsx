import { useState } from 'react';
import { GripVertical, Plus } from 'lucide-react';
import type { BlockData } from '../types';
import { useEditorStore } from '../store';
import { TextBlock } from '../blocks/TextBlock';
import { TableBlock } from '../blocks/TableBlock';
import { MediaBlock } from '../blocks/MediaBlock';
import { AIPromptMenu } from './AIPromptMenu';
import { Sparkles } from 'lucide-react';

interface BlockWrapperProps {
  block: BlockData;
  dragControls?: any;
}

export function BlockWrapper({ block, dragControls }: BlockWrapperProps) {
  const { addBlock, focusedBlockId } = useEditorStore();
  const [isHovered, setIsHovered] = useState(false);
  const [aiMenuState, setAiMenuState] = useState<{ isOpen: boolean; top: number; left: number } | null>(null);
  
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
        <div 
          className={`flex-none w-16 flex items-center justify-end pr-2 opacity-0 transition-opacity gap-1 ${
            isHovered || isFocused ? 'opacity-100' : ''
          }`}
        >
          {block.type === 'text' && (
             <button 
               onClick={(e) => {
                 const rect = e.currentTarget.getBoundingClientRect();
                 setAiMenuState({ isOpen: true, top: rect.bottom + 5, left: rect.left });
               }}
               className="p-1 text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 rounded"
               title="Ask AI"
             >
               <Sparkles size={14} />
             </button>
          )}
          <button 
            onClick={handleAddBelow}
            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded"
          >
            <Plus size={16} />
          </button>
          <div 
            className="p-1 cursor-grab active:cursor-grabbing text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded"
            onPointerDown={(e) => dragControls?.start(e)}
            style={{ touchAction: "none" }}
          >
            <GripVertical size={16} />
          </div>
        </div>
        
        <div className="flex-1 min-w-0 pr-4">
          {renderBlock()}
        </div>
      </div>
      
      {aiMenuState && aiMenuState.isOpen && (
         <AIPromptMenu 
            block={block} 
            onClose={() => setAiMenuState(null)} 
            position={{ top: aiMenuState.top, left: aiMenuState.left }} 
         />
      )}
    </div>
  );
}
