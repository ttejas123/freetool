'use client';

import { useEffect, useState } from 'react';
import { Type, Heading1, Heading2, Heading3, Image, Table, FileText, Video } from 'lucide-react';
import { useEditorStore } from '../store';
import type { BlockType } from '../types';

export const SLASH_COMMANDS = [
  { icon: Type, label: 'Text', type: 'text', description: 'Just start writing with plain text.' },
  { icon: Heading1, label: 'Heading 1', type: 'h1', description: 'Big section heading.' },
  { icon: Heading2, label: 'Heading 2', type: 'h2', description: 'Medium section heading.' },
  { icon: Heading3, label: 'Heading 3', type: 'h3', description: 'Small section heading.' },
  { icon: Table, label: 'Table', type: 'table', description: 'Add a static or CSV/JSON imported table.' },
  { icon: Image, label: 'Image', type: 'image', description: 'Upload or embed with a link.' },
  { icon: Video, label: 'Video', type: 'video', description: 'Upload or embed a video.' },
  { icon: FileText, label: 'File', type: 'file', description: 'Upload a local file attachment.' },
];

interface SlashMenuProps {
  blockId: string;
  onClose: () => void;
  position: { top: number; left: number };
}

export function SlashMenu({ blockId, onClose, position }: SlashMenuProps) {
  const { updateBlock, pages, activePageId } = useEditorStore();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const activePage = pages.find(p => p.id === activePageId);
  const currentBlock = activePage?.blocks.find(b => b.id === blockId);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, SLASH_COMMANDS.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        selectItem(SLASH_COMMANDS[selectedIndex].type as BlockType);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, blockId]);

  const selectItem = (type: BlockType) => {
    let content = currentBlock?.content || '';
    if (typeof content === 'string') {
      // Remove the slash that triggered the menu
      content = content.replace(/\/$/, '').trim();
    }

    // Reset content for complex blocks if it was just text
    if (['table', 'image', 'video', 'file'].includes(type) && typeof content === 'string') {
      content = []; // Use empty array for table or appropriate default
    }

    updateBlock(blockId, { type, content });
    onClose();
  };

  return (
    <div 
      className="absolute z-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl overflow-hidden w-64 flex flex-col"
      style={{ top: position.top, left: position.left }}
    >
      <div className="p-2 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
        Basic Blocks
      </div>
      <div className="max-h-64 overflow-y-auto">
        {SLASH_COMMANDS.map((cmd, idx) => {
          const Icon = cmd.icon;
          return (
            <button
              key={idx}
              className={`w-full text-left px-4 py-2 flex items-center gap-3 transition-colors ${
                idx === selectedIndex ? 'bg-zinc-100 dark:bg-zinc-800' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
              }`}
              onClick={() => selectItem(cmd.type as BlockType)}
              onMouseEnter={() => setSelectedIndex(idx)}
            >
              <div className="p-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded">
                <Icon size={18} className="text-zinc-600 dark:text-zinc-300" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{cmd.label}</span>
                <span className="text-xs text-zinc-500">{cmd.description}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
