import { type RegistryTool } from '../tools/toolRegistry';

export interface SearchMatch {
  tool: RegistryTool;
  score: number;
  matchField: string;
  matchSnippet: string;
}

export const getSearchResults = (query: string, tools: RegistryTool[]): SearchMatch[] => {
  if (!query) return tools.map(tool => ({ tool, score: 0, matchField: '', matchSnippet: '' }));
  
  const rawQuery = query.toLowerCase().trim();
  const queryWords = rawQuery.split(/\s+/).filter(word => word.length > 1);
  
  return tools
    .map(tool => {
      let score = 0;
      let matchField = '';
      let matchSnippet = '';

      const name = tool.name.toLowerCase();
      const description = tool.description.toLowerCase();
      const tags = tool.tags.map(t => t.toLowerCase());
      const category = tool.category.toLowerCase();

      // 1. Exact full query match (Ultimate priority)
      if (name === rawQuery) {
        score += 200;
      } else if (name.includes(rawQuery)) {
        score += 150;
      }

      // 2. Word-based matching
      let wordsMatched = 0;
      queryWords.forEach(word => {
        let wordMatched = false;
        
        // Name match
        if (name.includes(word)) {
          score += 50;
          wordMatched = true;
        }

        // Tag match (Synonyms)
        const matchedTag = tags.find(tag => tag.includes(word));
        if (matchedTag) {
          score += 40;
          wordMatched = true;
          if (!matchField) {
             matchField = 'Tag';
             matchSnippet = matchedTag;
          }
        }

        // Category match
        if (category.includes(word)) {
          score += 30;
          wordMatched = true;
        }

        // Description match
        if (description.includes(word)) {
          score += 20;
          wordMatched = true;
          if (!matchField) {
            matchField = 'Description';
            const index = description.indexOf(word);
            const start = Math.max(0, index - 20);
            const end = Math.min(description.length, index + word.length + 30);
            matchSnippet = (start > 0 ? '...' : '') + tool.description.slice(start, end) + (end < description.length ? '...' : '');
          }
        }

        if (wordMatched) wordsMatched++;
      });

      // Bonus for matching all words in the query
      if (queryWords.length > 1 && wordsMatched === queryWords.length) {
        score += 100;
      }

      // 3. FAQ match (fallback)
      if (tool.faq && score < 40) {
        for (const item of tool.faq) {
          const q = item.question.toLowerCase();
          const a = item.answer.toLowerCase();
          if (q.includes(rawQuery) || a.includes(rawQuery)) {
            score += 40;
            matchField = 'FAQ';
            const text = q.includes(rawQuery) ? item.question : item.answer;
            const index = text.toLowerCase().indexOf(rawQuery);
            const start = Math.max(0, index - 20);
            const end = Math.min(text.length, index + rawQuery.length + 30);
            matchSnippet = (start > 0 ? '...' : '') + text.slice(start, end) + (end < text.length ? '...' : '');
            break;
          }
        }
      }

      return { tool, score, matchField, matchSnippet };
    })
    .filter(res => res.score > 0)
    .sort((a, b) => b.score - a.score);
};

export const escapeRegex = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};
