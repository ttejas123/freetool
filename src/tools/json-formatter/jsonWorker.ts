
// Web Worker for JSON processing
/* eslint-disable no-restricted-globals */

const repairJson = (str: string): string => {
  let repaired = str.trim();
  
  // 1. Fix unquoted keys
  repaired = repaired.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)(\s*:)/g, '$1"$2"$3');
  
  // 2. Convert single quotes to double quotes
  repaired = repaired.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, '"$1"');
  
  // 3. Remove trailing commas
  repaired = repaired.replace(/,\s*([}\]])/g, '$1');
  
  // 4. Handle undefined/NaN
  repaired = repaired.replace(/:\s*undefined/g, ': null');
  repaired = repaired.replace(/:\s*NaN/g, ': null');

  return repaired;
};

interface JsonRow {
  path: string;
  key: string | null;
  value: any;
  type: string;
  indent: number;
  isExpandable: boolean;
  isArrayItem: boolean;
  itemIndex?: number;
}

const flattenJson = (
  data: any,
  path = '',
  indent = 0,
  rows: JsonRow[] = [],
  visited = new Set()
): JsonRow[] => {
  const type = data === null ? 'null' : typeof data;
  const isArray = Array.isArray(data);
  const isObject = type === 'object' && !isArray && data !== null;

  if (isObject || isArray) {
    if (visited.has(data)) {
      rows.push({ path, key: null, value: '[Circular Reference]', type: 'circular', indent, isExpandable: false, isArrayItem: false });
      return rows;
    }
    visited.add(data);
  }

  if (isArray) {
    rows.push({ path, key: null, value: '[', type: 'array_start', indent, isExpandable: true, isArrayItem: false });
    data.forEach((item, i) => {
      const itemPath = path ? `${path}[${i}]` : `[${i}]`;
      flattenJson(item, itemPath, indent + 1, rows, visited);
    });
    rows.push({ path, key: null, value: ']', type: 'array_end', indent, isExpandable: false, isArrayItem: false });
  } else if (isObject) {
    rows.push({ path, key: null, value: '{', type: 'object_start', indent, isExpandable: true, isArrayItem: false });
    Object.keys(data).forEach((key) => {
      const itemPath = path ? `${path}.${key}` : key;
      const isComplex = typeof data[key] === 'object' && data[key] !== null;
      
      if (!isComplex) {
        rows.push({ path: itemPath, key, value: data[key], type: data[key] === null ? 'null' : typeof data[key], indent: indent + 1, isExpandable: false, isArrayItem: false });
      } else {
        rows.push({ path: itemPath, key, value: null, type: 'key_only', indent: indent + 1, isExpandable: false, isArrayItem: false });
        flattenJson(data[key], itemPath, indent + 1, rows, visited);
      }
    });
    rows.push({ path, key: null, value: '}', type: 'object_end', indent, isExpandable: false, isArrayItem: false });
  } else {
    rows.push({ path, key: null, value: data, type, indent, isExpandable: false, isArrayItem: false });
  }

  return rows;
};

self.onmessage = (e) => {
  const { action, input, searchTerm, collapsedPaths } = e.data;

  if (action === 'process') {
    if (!input.trim()) {
      self.postMessage({ action: 'result', isValid: false, flatRows: [], formattedString: '' });
      return;
    }

    try {
      const parsedJson = JSON.parse(input);
      const flatRows = flattenJson(parsedJson);
      const formattedString = JSON.stringify(parsedJson, null, 2);
      
      self.postMessage({ 
        action: 'result', 
        isValid: true, 
        flatRows, 
        formattedString,
        needsFix: false 
      });
    } catch (err: any) {
      // Analyze error for helpful tips
      let hint = "";
      const msg = err.message.toLowerCase();
      
      if (msg.includes("unexpected token") || msg.includes("position")) {
        if (input.includes("'")) hint = "Tip: JSON requires double quotes (\"). Single quotes found.";
        else if (/[a-zA-Z0-9_$]+:/.test(input)) hint = "Tip: Keys must be quoted in JSON.";
        else if (input.trim().endsWith(",")) hint = "Tip: Trailing commas are not allowed.";
        else if (input.includes("[object Object]")) hint = "Tip: You pasted an object string representation, not actual JSON data.";
      }

      // Try repair
      try {
        const repaired = repairJson(input);
        const parsedRepaired = JSON.parse(repaired);
        self.postMessage({ 
          action: 'result', 
          isValid: false, 
          needsFix: true, 
          errorMessage: hint || err.message,
          originalError: err.message
        });
      } catch (err2) {
        self.postMessage({ 
          action: 'result', 
          isValid: false, 
          needsFix: false, 
          errorMessage: hint || err.message,
          originalError: err.message
        });
      }
    }
  } else if (action === 'filter') {
    const { flatRows, searchTerm, collapsedPaths } = e.data;
    
    let filtered = flatRows;
    if (collapsedPaths && collapsedPaths.size > 0) {
      filtered = flatRows.filter((row: any) => {
        for (const collapsedPath of collapsedPaths) {
          if (row.path.startsWith(collapsedPath + '.') || row.path.startsWith(collapsedPath + '[')) {
            return false;
          }
        }
        return true;
      });
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((row: any) => 
        (row.key && row.key.toLowerCase().includes(term)) || 
        (row.type !== 'array_start' && row.type !== 'array_end' && row.type !== 'object_start' && row.type !== 'object_end' && String(row.value).toLowerCase().includes(term))
      );
    }

    self.postMessage({ action: 'filtered', filtered });
  } else if (action === 'repair') {
    const fixed = repairJson(input);
    self.postMessage({ action: 'repaired', fixed });
  }
};
