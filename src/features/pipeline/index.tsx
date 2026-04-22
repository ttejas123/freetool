'use client';

import { Sidebar } from './Sidebar';
import { PipelineCanvas } from './PipelineCanvas';

export default function PipelineBuilder() {
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] min-h-[600px] border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-zinc-900">
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <PipelineCanvas />
      </div>
    </div>
  );
}
