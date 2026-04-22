'use client';

import { useToastStore } from '../../store/toastStore';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer = () => {
  const { toasts, removeToast } = useToastStore();

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div 
          key={t.id} 
          className="flex items-center justify-between gap-3 min-w-[300px] p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-xl pointer-events-auto animate-in slide-in-from-bottom-5 fade-in duration-300"
        >
          <div className="flex items-center gap-3">
            {icons[t.type]}
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{t.message}</p>
          </div>
          <button 
            onClick={() => removeToast(t.id)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
