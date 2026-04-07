import React from 'react';
import { ChevronRight, HelpCircle, type LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface FAQItem {
  question: string;
  answer: string | React.ReactNode;
}

interface FAQSectionProps {
  items: FAQItem[];
  title?: string;
  description?: string;
  icon?: LucideIcon;
  className?: string;
}

export const FAQSection: React.FC<FAQSectionProps> = ({
  items,
  title = "Frequently Asked Questions",
  description,
  icon: Icon = HelpCircle,
  className
}) => {
  if (!items || items.length === 0) return null;

  return (
    <div className={cn("space-y-8 pt-10 border-t border-gray-100 dark:border-gray-800", className)}>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold flex items-center gap-3 text-gray-900 dark:text-white">
          <Icon className="w-6 h-6 text-blue-500" />
          {title}
        </h2>
        {description && <p className="text-gray-500 dark:text-gray-400 text-sm">{description}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item, index) => (
          <details 
            key={index} 
            className="group border border-gray-100 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-gray-900/30 overflow-hidden transition-all duration-300"
          >
            <summary className="flex items-center justify-between p-4 cursor-pointer font-medium list-none text-gray-900 dark:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors">
              <span className="flex-1 pr-4 font-semibold">{item.question}</span>
              <ChevronRight className="w-4 h-4 text-gray-400 transition-transform duration-300 group-open:rotate-90" />
            </summary>
            <div className="p-4 pt-0 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800 leading-relaxed animate-in fade-in slide-in-from-top-2 duration-300">
              {item.answer}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
};
