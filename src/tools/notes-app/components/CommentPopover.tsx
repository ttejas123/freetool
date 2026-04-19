import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';

interface CommentPopoverProps {
  position: { top: number; left: number };
  onSave: (text: string) => void;
  onCancel: () => void;
}

export function CommentPopover({ position, onSave, onCancel }: CommentPopoverProps) {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSave = () => {
    if (text.trim()) {
      onSave(text.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div 
      className="fixed z-[110] -translate-x-1/2 -translate-y-full mb-4 animate-in fade-in zoom-in duration-200"
      style={{ top: position.top, left: position.left }}
    >
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden w-72">
        <div className="p-3">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a comment..."
            className="w-full h-24 bg-transparent border-none outline-none resize-none text-sm placeholder:text-zinc-400 dark:text-zinc-100"
          />
        </div>
        <div className="px-3 py-2 border-t border-zinc-100 dark:border-zinc-800/50 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-950/30">
          <span className="text-[10px] text-zinc-400 font-medium">^Enter to save</span>
          <div className="flex items-center gap-2">
            <button 
              onClick={onCancel}
              className="p-1 px-3 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={!text.trim()}
              className="flex items-center gap-1.5 p-1 px-3 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md text-xs font-bold transition-all"
            >
              <Send size={12} />
              <span>Comment</span>
            </button>
          </div>
        </div>
      </div>
      {/* Little arrow at bottom */}
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white dark:bg-zinc-900 border-r border-b border-zinc-200 dark:border-zinc-800 rotate-45" />
    </div>
  );
}
