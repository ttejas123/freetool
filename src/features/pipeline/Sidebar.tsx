import type { DragEvent } from 'react';
import { toolRegistry } from '@/tools/toolRegistry';

export function Sidebar() {
  const onDragStart = (event: DragEvent, toolId: string) => {
    event.dataTransfer.setData('application/reactflow', toolId);
    event.dataTransfer.effectAllowed = 'move';
  };

  const categories = Array.from(new Set(toolRegistry.map((t) => t.category)));

  return (
    <aside className="w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 p-4 overflow-y-auto flex flex-col h-full">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">Tools</h2>
        <p className="text-sm text-zinc-500">Drag tools to the canvas to build a pipeline.</p>
      </div>

      <div className="space-y-6 flex-1">
        {categories.map((category) => {
          const catTools = toolRegistry.filter((t) => t.category === category && t.id !== 'pipeline-builder');
          if (catTools.length === 0) return null;

          return (
            <div key={category}>
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                {category}
              </h3>
              <div className="space-y-2">
                {catTools.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <div
                      key={tool.id}
                      className="flex items-center space-x-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 cursor-grab active:cursor-grabbing transition-colors"
                      onDragStart={(e) => onDragStart(e, tool.id)}
                      draggable
                    >
                      <Icon className="w-4 h-4 text-brand-500" />
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        {tool.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
