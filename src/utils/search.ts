import { type RegistryTool } from '../tools/toolRegistry';

export interface SearchMatch {
  tool: RegistryTool;
  score: number;
  matchField: string;
  matchSnippet: string;
}

export const getSearchResults = (query: string, tools: RegistryTool[]): SearchMatch[] => {
  if (!query) return tools.map(tool => ({ tool, score: 0, matchField: '', matchSnippet: '' }));
  const term = query.toLowerCase().trim();

  return tools
    .map(tool => {
      let score = 0;
      let matchField = '';
      let matchSnippet = '';

      // 1. Name match (Highest priority)
      if (tool.name.toLowerCase() === term) {
        score = 100;
      } else if (tool.name.toLowerCase().includes(term)) {
        score = 80;
      }

      // 2. Tag match
      const matchingTag = tool.tags.find(tag => tag.toLowerCase().includes(term));
      if (matchingTag && score < 70) {
        score = 70;
        matchField = 'Tag';
        matchSnippet = matchingTag;
      }

      // 3. Category match
      if (tool.category.toLowerCase().includes(term) && score < 60) {
        score = 60;
        matchField = 'Category';
        matchSnippet = tool.category;
      }

      // 4. Description match
      if (tool.description.toLowerCase().includes(term) && score < 50) {
        score = 50;
        matchField = 'Description';
        const index = tool.description.toLowerCase().indexOf(term);
        const start = Math.max(0, index - 20);
        const end = Math.min(tool.description.length, index + term.length + 30);
        matchSnippet = (start > 0 ? '...' : '') + tool.description.slice(start, end) + (end < tool.description.length ? '...' : '');
      }

      // 5. FAQ match
      if (tool.faq) {
        for (const item of tool.faq) {
          if (item.question.toLowerCase().includes(term) || item.answer.toLowerCase().includes(term)) {
            if (score < 40) {
              score = 40;
              matchField = 'FAQ';
              const text = item.question.toLowerCase().includes(term) ? item.question : item.answer;
              const index = text.toLowerCase().indexOf(term);
              const start = Math.max(0, index - 20);
              const end = Math.min(text.length, index + term.length + 30);
              matchSnippet = (start > 0 ? '...' : '') + text.slice(start, end) + (end < text.length ? '...' : '');
            }
            break;
          }
        }
      }

      // 6. Input/Output types
      const matchingIO = [...tool.inputType, ...tool.outputType].find(type => type.toLowerCase().includes(term));
      if (matchingIO && score < 30) {
        score = 30;
        matchField = 'Supports';
        matchSnippet = matchingIO;
      }

      return { tool, score, matchField, matchSnippet };
    })
    .filter(res => res.score > 0)
    .sort((a, b) => b.score - a.score);
};

export const escapeRegex = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};
