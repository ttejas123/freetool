import { 
  Plus, FileText, Trash2, BookOpen, GraduationCap, Archive, 
  ClipboardList, Presentation, Calendar, Rocket, File
} from 'lucide-react';
import { useEditorStore } from '../store';
import { TEMPLATES } from '../utils/templates';

const IconMap: Record<string, any> = {
  BookOpen,
  ClipboardList,
  Presentation,
  Calendar,
  Rocket,
  FileText,
  File
};

function PageIcon({ iconName, className = "w-4 h-4" }: { iconName?: string, className?: string }) {
  const Icon = (iconName && IconMap[iconName]) || FileText;
  return <Icon className={className} />;
}

export function Sidebar() {
  const { pages, activePageId, setActivePage, addPage, deletePage, resetAll } = useEditorStore();

  const handleAddTemplate = (template: any) => {
    addPage(template.title, template.blocks);
  };

  return (
    <div className="w-64 h-full bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500">Workspace</h2>
        <button 
          onClick={() => addPage()}
          className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded transition-colors"
          title="Add new page"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {/* Pages List */}
        <div>
          <div className="px-2 pb-2 text-[10px] font-bold text-zinc-400 uppercase tracking-tight">Recent Notes</div>
          <div className="space-y-0.5">
            {pages.map((page) => (
              <div 
                key={page.id}
                className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all ${
                  activePageId === page.id 
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200 dark:border-zinc-700' 
                  : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100 border border-transparent'
                }`}
                onClick={() => setActivePage(page.id)}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div className={`p-1 rounded ${activePageId === page.id ? 'text-indigo-500' : 'text-zinc-400'}`}>
                    <PageIcon iconName={page.icon} className="w-4 h-4" />
                  </div>
                  <span className="truncate text-sm font-medium">{page.title}</span>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); deletePage(page.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded transition-all"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Templates Section */}
        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <div className="px-2 pb-2 text-[10px] font-bold text-zinc-400 uppercase tracking-tight">Templates</div>
          
          <div className="space-y-4 pt-1 px-1">
            {/* Student */}
            <div>
              <div className="px-2 py-1 flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                <GraduationCap size={14} className="text-zinc-400" /> Student
              </div>
              <div className="mt-1 space-y-0.5">
                {TEMPLATES.student.map(t => (
                  <button 
                    key={t.id}
                    onClick={() => handleAddTemplate(t)}
                    className="w-full text-left px-2.5 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-md transition-colors flex items-center gap-2"
                  >
                    <PageIcon iconName={t.icon} className="w-3.5 h-3.5 opacity-70" />
                    {t.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Classroom */}
            <div>
              <div className="px-2 py-1 flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                <BookOpen size={14} className="text-zinc-400" /> Classroom
              </div>
              <div className="mt-1 space-y-0.5">
                {TEMPLATES.classroom.map(t => (
                  <button 
                    key={t.id}
                    onClick={() => handleAddTemplate(t)}
                    className="w-full text-left px-2.5 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-md transition-colors flex items-center gap-2"
                  >
                    <PageIcon iconName={t.icon} className="w-3.5 h-3.5 opacity-70" />
                    {t.title}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
        <button 
          onClick={() => { if(confirm('Reset all data? This will clear all pages.')) resetAll(); }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-zinc-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md transition-all border border-transparent hover:border-red-200 dark:hover:border-red-800/30"
        >
          <Archive size={14} /> Reset Workspace
        </button>
      </div>
    </div>
  );
}
