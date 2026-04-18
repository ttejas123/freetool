import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { useEditorStore } from '../store';
import { askOpenAI } from '../utils/ai';
import type { AIAction } from '../utils/ai';
import type { BlockData } from '../types';

interface AIPromptMenuProps {
  block: BlockData;
  onClose: () => void;
  position: { top: number; left: number };
}

const AI_ACTIONS: { label: string; action: AIAction }[] = [
  { label: 'Summarize', action: 'summarize' },
  { label: 'Improve Writing', action: 'improve' },
  { label: 'Fix Grammar', action: 'fix_grammar' },
  { label: 'Make Longer', action: 'make_longer' },
  { label: 'Make Shorter', action: 'make_shorter' },
  { label: 'Extract to Table', action: 'convert_to_table' }
];

export function AIPromptMenu({ block, onClose, position }: AIPromptMenuProps) {
  const { updateBlock } = useEditorStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAction = async (action: AIAction) => {
    // Convert raw html content to text for OpenAI logic (simplistic)
    const rawText = block.content.replace(/<[^>]*>/g, '');
    if (!rawText.trim()) {
      setError('Block is empty.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (action === 'convert_to_table') {
        const jsonStr = await askOpenAI(action, rawText, () => {});
        try {
          const parsed = JSON.parse(jsonStr);
          if (Array.isArray(parsed)) {
            // Transform current block into table, or create new block below
            updateBlock(block.id, { type: 'table', content: parsed });
          } else {
            setError('Failed to extract table structure.');
          }
        } catch(e) {
          setError('Failed to parse AI JSON response.');
        }
      } else {
        // Stream back into the text block
        updateBlock(block.id, { content: '' }); // clear it first
        let fullAcc = '';
        await askOpenAI(action, rawText, (chunk) => {
          fullAcc += chunk;
          updateBlock(block.id, { content: fullAcc.replace(/\n/g, '<br/>') });
        });
      }
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      if (action !== 'convert_to_table') {
         setLoading(false);
      }
    }
  };

  return (
    <div 
      className="absolute z-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl overflow-hidden w-64 shadow-indigo-500/10"
      style={{ top: position.top, left: position.left }}
    >
      <div className="p-3 bg-indigo-50/50 dark:bg-indigo-900/20 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
        <Sparkles size={16} className="text-indigo-500" />
        <span className="text-sm font-medium text-indigo-700 dark:text-indigo-400">Ask AI</span>
      </div>

      {error ? (
        <div className="p-3 text-xs text-red-500">{error}</div>
      ) : loading ? (
        <div className="p-4 flex flex-col items-center justify-center text-zinc-500 gap-2">
           <Loader2 className="animate-spin" size={20} />
           <span className="text-xs">Generating...</span>
        </div>
      ) : (
        <div className="py-1">
          {AI_ACTIONS.map((item, idx) => (
            <button
              key={idx}
              className="w-full text-left px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              onClick={() => handleAction(item.action)}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
      <div className="p-2 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex justify-end">
         <button className="text-xs text-zinc-500 hover:text-zinc-700" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
