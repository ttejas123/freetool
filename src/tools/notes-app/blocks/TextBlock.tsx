import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { BlockData } from '../types';
import { useEditorStore } from '../store';
import { SlashMenu } from '../components/SlashMenu';
import { TextFormatToolbar } from '../components/TextFormatToolbar';

interface TextBlockProps {
  block: BlockData;
  isFocused: boolean;
}

export function TextBlock({ block, isFocused }: TextBlockProps) {
  const { pages, activePageId, updateBlock, setFocusedBlock, addBlock, deleteBlock } = useEditorStore();
  const activePage = pages.find(p => p.id === activePageId);
  const blocks = activePage?.blocks || [];
  const editableRef = useRef<HTMLDivElement>(null);
  
  const [slashMenuState, setSlashMenuState] = useState<{ isOpen: boolean; top: number; left: number } | null>(null);
  const [toolbarState, setToolbarState] = useState<{ top: number; left: number } | null>(null);

  // To prevent updating state when typing, which changes cursor position, 
  // we keep track of whether we are currently editing.
  const isComposing = useRef(false);

  useEffect(() => {
    if (isFocused && editableRef.current) {
      if (document.activeElement !== editableRef.current) {
        editableRef.current.focus();
        
        // Move cursor to end
        const range = document.createRange();
        const sel = window.getSelection();
        if (sel) {
          range.selectNodeContents(editableRef.current);
          range.collapse(false); // false = to end
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }
    }
  }, [isFocused]);

  useEffect(() => {
    // Only update innerHTML if not currently focused, to avoid cursor jumps
    // This allows AI updates and initial loads to populate the text visually.
    if (editableRef.current && editableRef.current.innerHTML !== block.content && document.activeElement !== editableRef.current) {
      editableRef.current.innerHTML = block.content || '';
    }
  }, [block.content]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const html = e.currentTarget.innerHTML;
    updateBlock(block.id, { content: html });
    // Keep internal state in sync with react state
    if (html === '<br>') {
      updateBlock(block.id, { content: '' });
      setSlashMenuState(null);
    } else {
      // Check for slash
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const textBeforeCursor = range.startContainer.textContent?.slice(0, range.startOffset) || '';
        
        if (textBeforeCursor.endsWith('/')) {
          const rect = range.getBoundingClientRect();
          const parentRect = editableRef.current?.getBoundingClientRect();
          if (parentRect) {
            setSlashMenuState({ 
              isOpen: true, 
              top: rect.bottom - parentRect.top + 10, 
              left: rect.left - parentRect.left
            });
          }
        } else if (slashMenuState) {
          setSlashMenuState(null);
        }
      }
    }
  };

  const updateToolbarPosition = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !editableRef.current?.contains(selection.anchorNode)) {
      setToolbarState(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    setToolbarState({
      top: rect.top,
      left: rect.left + rect.width / 2
    });
  }, []);

  useEffect(() => {
    const handleSelectionChange = () => {
      // Small delay to ensure selection is final
      requestAnimationFrame(updateToolbarPosition);
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [updateToolbarPosition]);

  const handleApplyStyle = (command: string, value?: string) => {
    if (!editableRef.current) return;
    
    // Focus back to editable div if focus was lost (e.g. by clicking toolbar)
    editableRef.current.focus();
    
    document.execCommand(command, false, value);
    
    // Manually trigger input to sync state
    const html = editableRef.current.innerHTML;
    updateBlock(block.id, { content: html });
    
    // Update toolbar position as selection might have changed
    updateToolbarPosition();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (slashMenuState) {
      if (['ArrowDown', 'ArrowUp', 'Enter'].includes(e.key)) {
        // Handled by SlashMenu effect
        return;
      }
      if (e.key === 'Escape') {
         setSlashMenuState(null);
      }
    }
    
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // Split block at cursor position or just create new if at end
      addBlock({ type: 'text', content: '' }, block.id);
    } else if (e.key === 'Backspace' && (editableRef.current?.innerHTML === '' || editableRef.current?.innerHTML === '<br>')) {
      e.preventDefault();
      deleteBlock(block.id);
    } else if (e.key === 'ArrowUp') {
       const index = blocks.findIndex((b: any) => b.id === block.id);
       if (index > 0) {
         setFocusedBlock(blocks[index - 1].id);
       }
    } else if (e.key === 'ArrowDown') {
       const index = blocks.findIndex((b: any) => b.id === block.id);
       if (index < blocks.length - 1) {
         setFocusedBlock(blocks[index + 1].id);
       }
    }
  };

  const getPlaceholder = () => {
    switch (block.type) {
      case 'h1': return 'Heading 1';
      case 'h2': return 'Heading 2';
      case 'h3': return 'Heading 3';
      default: return "Type '/' for commands";
    }
  };

  let className = "outline-none w-full py-1 leading-relaxed break-words relative min-h-[1.5em]";
  
  if (block.type === 'h1') className += " text-4xl font-bold mt-6 mb-2 text-zinc-900 dark:text-zinc-50";
  else if (block.type === 'h2') className += " text-2xl font-semibold mt-4 mb-2 text-zinc-800 dark:text-zinc-100";
  else if (block.type === 'h3') className += " text-xl font-medium mt-3 mb-1 text-zinc-700 dark:text-zinc-200";
  else className += " text-base text-zinc-600 dark:text-zinc-400";

  return (
    <div className="relative group/text">
      {block.content === '' && isFocused && (
        <div className={`absolute left-0 top-1 text-zinc-300 dark:text-zinc-700 pointer-events-none select-none ${
          block.type === 'h1' ? 'text-4xl font-bold' : 
          block.type === 'h2' ? 'text-2xl font-semibold' :
          block.type === 'h3' ? 'text-xl font-medium' : 'text-base'
        }`}>
          {getPlaceholder()}
        </div>
      )}
      <div 
        ref={editableRef}
        contentEditable
        onFocus={() => setFocusedBlock(block.id)}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onCompositionStart={() => isComposing.current = true}
        onCompositionEnd={() => isComposing.current = false}
        onMouseUp={updateToolbarPosition}
        onKeyUp={updateToolbarPosition}
        suppressContentEditableWarning
        className={className}
      />
      {slashMenuState && slashMenuState.isOpen && (
        <SlashMenu 
          blockId={block.id} 
          position={{ top: slashMenuState.top, left: slashMenuState.left }} 
          onClose={() => setSlashMenuState(null)} 
        />
      )}
      {toolbarState && (
        <TextFormatToolbar 
          position={toolbarState} 
          onApplyStyle={handleApplyStyle} 
        />
      )}
    </div>
  );
}
