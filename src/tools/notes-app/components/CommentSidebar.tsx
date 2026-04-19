import React from 'react';
import { X, MessageSquare, CheckCircle2, History, Trash2 } from 'lucide-react';
import { useEditorStore } from '../store';
import { formatDistanceToNow } from 'date-fns';

export function CommentSidebar() {
  const { pages, activePageId, toggleCommentSidebar, resolveComment, deleteComment } = useEditorStore();
  const activePage = pages.find(p => p.id === activePageId);
  const comments = activePage?.comments || [];

  const activeComments = comments.filter(c => !c.isResolved);
  const resolvedComments = comments.filter(c => c.isResolved);

  return (
    <div className="w-80 h-full border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold">
          <MessageSquare size={18} className="text-indigo-500" />
          <span>Comments</span>
          <span className="text-xs bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.5 rounded text-zinc-500">
            {activeComments.length}
          </span>
        </div>
        <button 
          onClick={toggleCommentSidebar}
          className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-md transition-colors text-zinc-400"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
        {activeComments.length === 0 && resolvedComments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-full mb-3">
              <MessageSquare size={24} className="text-zinc-300" />
            </div>
            <p className="text-sm text-zinc-500">No comments yet</p>
            <p className="text-xs text-zinc-400 mt-1">Highlight text to add a comment</p>
          </div>
        )}

        {activeComments.map(comment => (
          <CommentItem 
            key={comment.id} 
            comment={comment} 
            onResolve={() => resolveComment(comment.id)}
            onDelete={() => deleteComment(comment.id)}
          />
        ))}

        {resolvedComments.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">
              <History size={12} />
              <span>Resolved</span>
            </div>
            <div className="flex flex-col gap-4 opacity-60 hover:opacity-100 transition-opacity">
              {resolvedComments.map(comment => (
                <CommentItem 
                  key={comment.id} 
                  comment={comment} 
                  onResolve={() => resolveComment(comment.id)}
                  onDelete={() => deleteComment(comment.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CommentItem({ comment, onResolve, onDelete }: { comment: any, onResolve: () => void, onDelete: () => void }) {
  return (
    <div className="group bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 hover:border-indigo-500/50 transition-all">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white uppercase">
            {comment.author[0]}
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold">{comment.author}</span>
            <span className="text-[10px] text-zinc-400">
              {formatDistanceToNow(new Date(comment.createdAt))} ago
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={onResolve}
            title={comment.isResolved ? "Reopen" : "Resolve"}
            className={`p-1 rounded-md transition-colors ${
              comment.isResolved 
                ? 'text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20' 
                : 'text-zinc-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
            }`}
          >
            <CheckCircle2 size={14} />
          </button>
          <button 
            onClick={onDelete}
            title="Delete"
            className="p-1 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-md transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
        {comment.text}
      </p>
    </div>
  );
}
