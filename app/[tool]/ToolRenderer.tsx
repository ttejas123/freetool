'use client';

import { toolRegistry } from '@/tools/toolRegistry';

interface ToolRendererProps {
  toolPath: string;
}

export default function ToolRenderer({ toolPath }: ToolRendererProps) {
  const tool = toolRegistry.find((t) => t.path === toolPath);
  if (!tool) return null;

  const ToolComponent = tool.component as React.ComponentType<object>;
  return <ToolComponent />;
}
