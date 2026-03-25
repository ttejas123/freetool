
import { useToolStore } from '@/store/toolStore';
import { toolRegistry } from '@/tools/toolRegistry';

import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ToolChainerProps {
  currentToolId: string;
}

export const ToolChainer = ({ currentToolId }: ToolChainerProps) => {

  const currentOutput = useToolStore((state) => state.currentOutput);
  const passOutputToInput = useToolStore((state) => state.passOutputToInput);

  const currentTool = toolRegistry.find(t => t.id === currentToolId);

  if (!currentTool) return null;

  // Find compatible tools based on outputType -> inputType mapping
  const compatibleTools = toolRegistry.filter((tool) => {
    if (tool.id === currentToolId) return false;
    // Check intersection between current outputType and target inputType
    const hasMatchingType = tool.inputType.some(type => currentTool.outputType.includes(type));
    return hasMatchingType;
  });

  // Find related tools based on category or tags
  const relatedTools = toolRegistry.filter((tool) => {
    if (tool.id === currentToolId) return false;
    const sameCategory = tool.category === currentTool.category;
    const commonTags = tool.tags.some(tag => currentTool.tags.includes(tag));
    return sameCategory || commonTags;
  }).slice(0, 3);

  const handleSendToTool = (targetToolId: string, path: string) => {
    passOutputToInput(targetToolId);
    window.location.href = `/${path}`;
  };

  return (
    <div className="space-y-6 mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Use Output In Section */}
      {currentOutput && compatibleTools.length > 0 && (
        <div className="p-6 rounded-2xl bg-brand-50/50 dark:bg-brand-900/10 border border-brand-100 dark:border-brand-800/50">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Use Output In...
            </h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {compatibleTools.map(tool => {
              const Icon = tool.icon;
              return (
                <Button
                  key={tool.id}
                  variant="secondary"
                  className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-brand-500 hover:text-brand-600"
                  onClick={() => handleSendToTool(tool.id, tool.path)}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tool.name}
                  <ArrowRight className="w-4 h-4 ml-2 opacity-50" />
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Related Tools Section */}
      {relatedTools.length > 0 && (
        <div className="pt-8 border-t border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Related Tools
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {relatedTools.map(tool => {
              const Icon = tool.icon;
              return (
                <a
                  key={tool.id}
                  href={`/${tool.path}`}
                  className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-brand-500 hover:shadow-md transition-all flex items-start gap-3 group"
                >
                  <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 group-hover:bg-brand-50 dark:group-hover:bg-brand-900/20 group-hover:text-brand-600 dark:group-hover:text-brand-400">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                      {tool.name}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                      {tool.description}
                    </p>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
