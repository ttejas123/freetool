import React from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  Code, 
  Link, 
  Wand2, 
  MessageSquare, 
  CheckCircle2, 
  FileText,
  ChevronDown
} from 'lucide-react';

interface TextFormatToolbarProps {
  position: { top: number; left: number };
  onApplyStyle: (command: string, value?: string) => void;
  onAddComment: () => void;
}

export function TextFormatToolbar({ position, onApplyStyle, onAddComment }: TextFormatToolbarProps) {
  const handleCommand = (e: React.MouseEvent, command: string, value?: string) => {
    e.preventDefault();
    e.stopPropagation();
    onApplyStyle(command, value);
  };

  const handleComment = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAddComment();
  };

  return (
    <div 
      className="fixed z-[100] -translate-x-1/2 -translate-y-full mb-2 animate-in fade-in zoom-in duration-200"
      style={{ top: position.top, left: position.left }}
    >
      <div className="flex flex-col bg-white/90 dark:bg-zinc-900/95 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden min-w-[280px]">
        {/* Formatting Row */}
        <div className="flex items-center gap-0.5 p-1.5 border-b border-zinc-100 dark:border-zinc-800/50">
          <ToolbarButton icon={Bold} onMouseDown={(e) => handleCommand(e, 'bold')} tooltip="Bold" />
          <ToolbarButton icon={Italic} onMouseDown={(e) => handleCommand(e, 'italic')} tooltip="Italic" />
          <ToolbarButton icon={Underline} onMouseDown={(e) => handleCommand(e, 'underline')} tooltip="Underline" />
          <ToolbarButton icon={Strikethrough} onMouseDown={(e) => handleCommand(e, 'strikethrough')} tooltip="Strikethrough" />
          <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-1" />
          <ToolbarButton icon={Link} onMouseDown={(e) => handleCommand(e, 'createLink', '#')} tooltip="Link" />
          <ToolbarButton icon={Code} onMouseDown={(e) => handleCommand(e, 'formatBlock', 'pre')} tooltip="Code" />
          <div className="flex-1" />
          <button className="flex items-center gap-1 px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Auto <ChevronDown size={12} />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="p-1.5 flex flex-col gap-0.5">
          <ActionButton 
            icon={MessageSquare} 
            label="Comment" 
            shortcut="⌘J" 
            onMouseDown={(e) => handleComment(e)} 
          />
          
          {/* AI Skills - Commented out for now
          <div className="mt-2 mb-1 px-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            AI Skills
          </div>
          
          <ActionButton 
            icon={Wand2} 
            label="Improve writing" 
            onMouseDown={() => {}} 
            className="text-purple-600 dark:text-purple-400"
          />
          <ActionButton 
            icon={CheckCircle2} 
            label="Proofread" 
            onMouseDown={() => {}} 
          />
          <ActionButton 
            icon={FileText} 
            label="Explain" 
            onMouseDown={() => {}} 
          />
          */}
        </div>

        {/* AI Input Area - Commented out for now
        <div className="p-2 border-t border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-950/30">
          <div className="relative group">
            <input 
              type="text" 
              placeholder="Ask AI to edit..." 
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg py-1.5 pl-3 pr-10 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-400 opacity-0 group-focus-within:opacity-100 transition-opacity">
              ^E
            </div>
          </div>
        </div>
        */}
      </div>
      
      {/* Little arrow at bottom */}
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white dark:bg-zinc-900 border-r border-b border-zinc-200 dark:border-zinc-800 rotate-45" />
    </div>
  );
}

function ToolbarButton({ icon: Icon, onMouseDown, tooltip }: { icon: any, onMouseDown: (e: React.MouseEvent) => void, tooltip: string }) {
  return (
    <button 
      onMouseDown={onMouseDown}
      title={tooltip}
      className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors text-zinc-600 dark:text-zinc-300"
    >
      <Icon size={16} />
    </button>
  );
}

function ActionButton({ icon: Icon, label, shortcut, onMouseDown, className = "" }: { icon: any, label: string, shortcut?: string, onMouseDown: (e: React.MouseEvent) => void, className?: string }) {
  return (
    <button 
      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onMouseDown(e); }}
      className={`flex items-center justify-between w-full px-2 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors ${className}`}
    >
      <div className="flex items-center gap-2">
        <Icon size={14} />
        <span className="text-xs font-medium">{label}</span>
      </div>
      {shortcut && (
        <span className="text-[10px] text-zinc-400 font-medium">{shortcut}</span>
      )}
    </button>
  );
}
