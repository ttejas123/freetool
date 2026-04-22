'use client';

import { useState, useCallback, useMemo } from 'react';
import { SEOHelmet } from '../../components/SEOHelmet';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { CopyButton } from '../../components/ui/CopyButton';
import {
  Database, RefreshCw, Plus, Trash2, ChevronDown, ChevronRight,
  Table2, Code2, FileText, Download, LayoutTemplate, Sparkles
} from 'lucide-react';
import {
  FIELD_TYPES, generateRecord, toCSV, toSQL
} from './generators';
import type { FieldDef, FieldType } from './generators';

let _id = Date.now();
const nextId = () => `field-${++_id}`;

const PRESETS: Record<string, { label: string; fields: FieldDef[] }> = {
  student: {
    label: 'Student Profile',
    fields: [
      { id: nextId(), name: 'id', type: 'uuid', config: {} },
      { id: nextId(), name: 'full_name', type: 'fullName', config: {} },
      { id: nextId(), name: 'university', type: 'company', config: {} },
      { id: nextId(), name: 'major', type: 'jobArea', config: {} },
      { id: nextId(), name: 'gpa', type: 'float', config: { min: 2, max: 4, decimals: 2 } },
      { id: nextId(), name: 'graduation_year', type: 'integer', config: { min: 2024, max: 2028 } },
    ]
  },
  books: {
    label: 'Book Store',
    fields: [
      { id: nextId(), name: 'id', type: 'uuid', config: {} },
      { id: nextId(), name: 'title', type: 'productName', config: {} },
      { id: nextId(), name: 'author', type: 'uuid', config: {}, isNested: true, nestedFields: [
        { id: nextId(), name: 'firstName', type: 'firstName', config: {} },
        { id: nextId(), name: 'lastName', type: 'lastName', config: {} },
      ]},
      { id: nextId(), name: 'genre', type: 'productCategory', config: {} },
      { id: nextId(), name: 'isbn', type: 'isbn', config: {} },
      { id: nextId(), name: 'rating', type: 'float', config: { min: 0, max: 5, decimals: 1 } },
      { id: nextId(), name: 'tags', type: 'word', config: {}, isArray: true, arrayCount: 3 },
    ]
  },
  food: {
    label: 'Food Recipes',
    fields: [
      { id: nextId(), name: 'id', type: 'uuid', config: {} },
      { id: nextId(), name: 'dish', type: 'dish', config: {} },
      { id: nextId(), name: 'cuisine', type: 'cuisine', config: {} },
      { id: nextId(), name: 'price', type: 'price', config: {} },
      { id: nextId(), name: 'calories', type: 'integer', config: { min: 100, max: 1200 } },
      { id: nextId(), name: 'ingredients', type: 'ingredient', config: {}, isArray: true, arrayCount: 4 },
    ]
  },
  employee: {
    label: 'Employee Directory',
    fields: [
      { id: nextId(), name: 'id', type: 'uuid', config: {} },
      { id: nextId(), name: 'name', type: 'fullName', config: {} },
      { id: nextId(), name: 'job_title', type: 'jobTitle', config: {} },
      { id: nextId(), name: 'department', type: 'department', config: {} },
      { id: nextId(), name: 'salary', type: 'integer', config: { min: 45000, max: 180000 } },
      { id: nextId(), name: 'manager', type: 'uuid', config: {}, isNested: true, nestedFields: [
        { id: nextId(), name: 'name', type: 'fullName', config: {} },
        { id: nextId(), name: 'email', type: 'email', config: {} },
      ]},
    ]
  },
  realestate: {
    label: 'Real Estate',
    fields: [
      { id: nextId(), name: 'id', type: 'uuid', config: {} },
      { id: nextId(), name: 'address', type: 'streetAddress', config: {} },
      { id: nextId(), name: 'price', type: 'amount', config: {} },
      { id: nextId(), name: 'property_type', type: 'productMaterial', config: {} },
      { id: nextId(), name: 'specs', type: 'uuid', config: {}, isNested: true, nestedFields: [
        { id: nextId(), name: 'bedrooms', type: 'integer', config: { min: 1, max: 5 } },
        { id: nextId(), name: 'bathrooms', type: 'integer', config: { min: 1, max: 3 } },
        { id: nextId(), name: 'sqft', type: 'integer', config: { min: 600, max: 8000 } },
      ]},
      { id: nextId(), name: 'features', type: 'word', config: {}, isNested: true, isArray: true, arrayCount: 3, nestedFields: [
        { id: nextId(), name: 'feature', type: 'word', config: {} }
      ]},
    ]
  }
};

const DEFAULT_FIELDS: FieldDef[] = PRESETS.student.fields;

type OutputFormat = 'json' | 'csv' | 'sql';
type ViewMode = 'raw' | 'table';

// ── Type selector drop-down ───────────────────────────────────────────────────
function TypeSelect({ value, onChange }: { value: FieldType; onChange: (t: FieldType) => void }) {
  const groupedTypes = useMemo(() => {
    const groups: Record<string, typeof FIELD_TYPES> = {};
    FIELD_TYPES.forEach(ft => {
      const cat = ft.category || 'General';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(ft);
    });
    return groups;
  }, []);

  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value as FieldType)}
        aria-label="Field Type"
        className="w-full text-xs appearance-none pl-2 pr-6 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
      >
        {Object.entries(groupedTypes).map(([cat, types]) => (
          <optgroup key={cat} label={cat}>
            {types.map(ft => (
              <option key={ft.id} value={ft.id}>{ft.label}</option>
            ))}
          </optgroup>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-400" />
    </div>
  );
}

// ── Config panel for types that need it ──────────────────────────────────────
function FieldConfig({ field, onChange }: { field: FieldDef; onChange: (c: Record<string, any>) => void }) {
  if (field.type === 'integer' || field.type === 'float' || field.type === 'amount' || field.type === 'price') {
    return (
      <div className="flex gap-2 mt-1">
        <div className="flex-1">
          <label className="text-[10px] text-zinc-400 uppercase font-bold px-1">Min</label>
          <input type="number" placeholder="min" value={field.config.min ?? ''} onChange={e => onChange({ ...field.config, min: +e.target.value })}
            className="w-full text-xs px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none" />
        </div>
        <div className="flex-1">
          <label className="text-[10px] text-zinc-400 uppercase font-bold px-1">Max</label>
          <input type="number" placeholder="max" value={field.config.max ?? ''} onChange={e => onChange({ ...field.config, max: +e.target.value })}
            className="w-full text-xs px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none" />
        </div>
        {(field.type === 'float' || field.type === 'amount' || field.type === 'price') && (
          <div className="w-16">
            <label className="text-[10px] text-zinc-400 uppercase font-bold px-1">Dec</label>
            <input type="number" placeholder="dp" value={field.config.decimals ?? 2} onChange={e => onChange({ ...field.config, decimals: +e.target.value })}
              className="w-full text-xs px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none" />
          </div>
        )}
      </div>
    );
  }
  return null;
}

// ── Single field row ──────────────────────────────────────────────────────────
function FieldRow({
  field, depth = 0, onChange, onDelete,
}: {
  field: FieldDef;
  depth?: number;
  onChange: (updated: FieldDef) => void;
  onDelete: () => void;
  onAddNested?: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const isNested = field.isNested;

  return (
    <div className={`rounded-lg border ${depth > 0 ? 'border-brand-200 dark:border-brand-800/30 bg-brand-50/20 dark:bg-brand-900/5' : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm'}`}>
      <div className={`flex items-center gap-2 px-3 py-2 ${isNested ? 'cursor-pointer' : ''}`}
        onClick={isNested ? () => setExpanded(v => !v) : undefined}>
        {isNested && (
          <button className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 shrink-0">
            {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        )}
        {/* Name */}
        <input
          value={field.name}
          onChange={e => onChange({ ...field, name: e.target.value })}
          onClick={e => e.stopPropagation()}
          className="flex-1 min-w-0 text-sm font-medium px-2 py-1 rounded border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 bg-transparent text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-brand-400"
          placeholder="field name"
        />
        {!isNested && (
          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
            <div className="w-40">
              <TypeSelect value={field.type} onChange={type => onChange({ ...field, type })} />
            </div>
            <label className="flex items-center gap-1 text-[10px] text-zinc-500 cursor-pointer whitespace-nowrap">
              <input type="checkbox" checked={field.isArray ?? false}
                className="rounded border-zinc-300 text-brand-600 focus:ring-brand-500"
                onChange={e => onChange({ ...field, isArray: e.target.checked })} />
              Array
            </label>
            {field.isArray && (
              <input type="number" min="1" max="20" value={field.arrayCount ?? 2}
                onChange={e => onChange({ ...field, arrayCount: +e.target.value })}
                className="w-10 text-[10px] px-1 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100" />
            )}
          </div>
        )}
        {isNested && (
          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
            <label className="flex items-center gap-1 text-xs text-zinc-500 cursor-pointer">
              <input type="checkbox" checked={field.isArray ?? false}
                className="rounded border-zinc-300 text-brand-600 focus:ring-brand-500"
                onChange={e => onChange({ ...field, isArray: e.target.checked })} />
              Array
            </label>
            {field.isArray && (
              <input type="number" min="1" max="20" value={field.arrayCount ?? 2}
                onChange={e => onChange({ ...field, arrayCount: +e.target.value })}
                className="w-14 text-xs px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100" />
            )}
          </div>
        )}
        <button onClick={e => { e.stopPropagation(); onDelete(); }}
          className="text-zinc-300 hover:text-red-500 dark:text-zinc-600 dark:hover:text-red-400 shrink-0 transition-colors p-1">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {!isNested && (
        <div className="px-3 pb-2 ml-4 border-l-2 border-zinc-100 dark:border-zinc-800">
          <FieldConfig field={field} onChange={c => onChange({ ...field, config: c })} />
        </div>
      )}

      {isNested && expanded && field.nestedFields && (
        <div className="px-3 pb-3 space-y-2 ml-4 border-l-2 border-brand-100 dark:border-brand-900/30">
          {field.nestedFields.map((nf, ni) => (
            <FieldRow
              key={nf.id}
              field={nf}
              depth={depth + 1}
              onChange={updated => {
                const next = [...field.nestedFields!];
                next[ni] = updated;
                onChange({ ...field, nestedFields: next });
              }}
              onDelete={() => {
                onChange({ ...field, nestedFields: field.nestedFields!.filter((_, ii) => ii !== ni) });
              }}
            />
          ))}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onChange({
                ...field,
                nestedFields: [
                  ...field.nestedFields!,
                  { id: nextId(), name: `field${field.nestedFields!.length + 1}`, type: 'word', config: {} }
                ]
              });
            }}
            className="flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:underline px-2 py-1"
          >
            <Plus className="w-3 h-3" /> Add sub-field
          </button>
        </div>
      )}
    </div>
  );
}

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// ── Main Component ────────────────────────────────────────────────────────────
export default function RandomData() {
  const [fields, setFields] = useState<FieldDef[]>(DEFAULT_FIELDS);
  const [count, setCount] = useState(10);
  const [data, setData] = useState<Record<string, any>[]>([]);
  const [format, setFormat] = useState<OutputFormat>('json');
  const [view, setView] = useState<ViewMode>('raw');

  const [isExpanded, setIsExpanded] = useState(false);

  const generate = useCallback(() => {
    setData(Array.from({ length: count }, () => generateRecord(fields)));
  }, [count, fields]);

  const outputStr = useMemo(() => {
    if (!data.length) return '';
    if (format === 'json') return JSON.stringify(data, null, 2);
    if (format === 'csv')  return toCSV(data);
    return toSQL(data);
  }, [data, format]);

  const byteSize = useMemo(() => {
    if (!outputStr) return 0;
    return new TextEncoder().encode(outputStr).length;
  }, [outputStr]);

  const flatHeaders = useMemo(() => {
    if (!data.length) return [];
    const first: Record<string, any> = {};
    const flattenObject = (obj: any, prefix = '') => {
      Object.keys(obj).forEach(key => {
        const val = obj[key];
        const k = prefix ? `${prefix}.${key}` : key;
        if (val && typeof val === 'object' && !Array.isArray(val)) flattenObject(val, k);
        else first[k] = val;
      });
    };
    flattenObject(data[0]);
    return Object.keys(first);
  }, [data]);

  const flatData = useMemo(() => {
    return data.map(row => {
      const out: Record<string, any> = {};
      const flatten = (obj: any, prefix = '') => {
        Object.keys(obj).forEach(key => {
          const val = obj[key];
          const k = prefix ? `${prefix}.${key}` : key;
          if (val && typeof val === 'object' && !Array.isArray(val)) flatten(val, k);
          else out[k] = Array.isArray(val) ? JSON.stringify(val) : val;
        });
      };
      flatten(row);
      return out;
    });
  }, [data]);

  const addField = () => {
    setFields(prev => [...prev, { id: nextId(), name: `field${prev.length + 1}`, type: 'word', config: {} }]);
  };
  const addNested = () => {
    setFields(prev => [...prev, {
      id: nextId(), name: 'nested', type: 'uuid', config: {},
      isNested: true, nestedFields: [
        { id: nextId(), name: 'id', type: 'uuid', config: {} },
        { id: nextId(), name: 'label', type: 'word', config: {} },
      ]
    }]);
  };

  const loadPreset = (key: string) => {
    // Deep clone to ensure new IDs and fresh state
    const preset = JSON.parse(JSON.stringify(PRESETS[key].fields));
    // Regenerate IDs to avoid collision if loaded multiple times
    const reId = (fs: FieldDef[]) => fs.map(f => {
      f.id = nextId();
      if (f.nestedFields) f.nestedFields = reId(f.nestedFields);
      return f;
    });
    setFields(reId(preset));
  };

  const downloadFile = () => {
    const ext = format === 'json' ? 'json' : format === 'csv' ? 'csv' : 'sql';
    const mime = format === 'json' ? 'application/json' : 'text/plain';
    const blob = new Blob([outputStr], { type: mime });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `random-data.${ext}`;
    a.click();
  };

  return (
    <div className="w-full mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
      <SEOHelmet title="Random Data Generator" description="Generate custom mock JSON, CSV and SQL data with 65+ field types, domain templates, and nested objects." />

      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">Random Data Generator</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-brand-500" />
            Add fields, load templates, and generate professional mock data.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Button onClick={generate} className="gap-2 shadow-lg shadow-brand-500/20" size="lg">
            <RefreshCw className="w-4 h-4" /> Generate {count} Records
          </Button>
          {byteSize > 0 && (
            <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
              Output Size: <span className="font-bold text-brand-600 dark:text-brand-400">{formatBytes(byteSize)}</span>
            </span>
          )}
        </div>
      </div>

      {/* Templates Row */}
      <div className="flex flex-wrap gap-2 items-center text-sm">
        <span className="text-zinc-500 font-medium flex items-center gap-1">
          <LayoutTemplate className="w-4 h-4" /> Templates:
        </span>
        {Object.entries(PRESETS).map(([key, preset]) => (
          <button
            key={key}
            onClick={() => loadPreset(key)}
            className="px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:border-brand-400 hover:text-brand-600 dark:hover:text-brand-400 transition-all text-xs font-medium"
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className={`grid grid-cols-1 ${isExpanded ? 'lg:grid-cols-2' : 'lg:grid-cols-[380px_1fr]'} gap-6 transition-all duration-300`}>
        {/* ── Config Panel ── */}
        <Card className="h-fit">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-brand-500" />
              Schema Builder
            </CardTitle>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              <LayoutTemplate className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
            </button>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Count slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="rows-count" className="text-sm font-medium text-gray-700 dark:text-gray-300">Rows to Generate</label>
                <span className="px-2 py-0.5 rounded bg-brand-50 dark:bg-brand-900/30 text-xs font-mono font-bold text-brand-600 dark:text-brand-400">{count}</span>
              </div>
              <input 
                id="rows-count"
                type="range" min="1" max="500" value={count}
                onChange={e => setCount(+e.target.value)}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-brand-600" />
              <div className="flex justify-between text-[10px] uppercase font-bold text-zinc-400 tracking-wider"><span>1 row</span><span>500 rows</span></div>
            </div>

            {/* Fields */}
            <div className="space-y-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Fields & Types</label>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {fields.map((f, i) => (
                  <FieldRow
                    key={f.id}
                    field={f}
                    onChange={updated => {
                      const next = [...fields];
                      next[i] = updated;
                      setFields(next);
                    }}
                    onDelete={() => setFields(fields.filter((_, ii) => ii !== i))}
                  />
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={addField} className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2.5 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-brand-400 hover:text-brand-600 dark:hover:border-brand-600 dark:hover:text-brand-400 transition-all font-medium">
                  <Plus className="w-3.5 h-3.5" /> Add Field
                </button>
                <button onClick={addNested} className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2.5 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-brand-400 hover:text-brand-600 dark:hover:border-brand-600 dark:hover:text-brand-400 transition-all font-medium">
                  <Plus className="w-3.5 h-3.5" /> Nested Object
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Output Panel ── */}
        <Card className="overflow-hidden flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <CardTitle>Generated Data</CardTitle>
              {byteSize > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold text-zinc-500 uppercase tracking-tight">
                  {formatBytes(byteSize)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Format */}
              <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1 gap-0.5">
                {(['json', 'csv', 'sql'] as OutputFormat[]).map(f => (
                  <button key={f} onClick={() => setFormat(f)}
                    className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${format === f ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'}`}>
                    {f}
                  </button>
                ))}
              </div>
              {/* View */}
              <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1 gap-0.5">
                <button onClick={() => setView('raw')}
                  className={`flex items-center gap-1 px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${view === 'raw' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-800'}`}>
                  <Code2 className="w-3 h-3" />Raw
                </button>
                {format === 'json' && (
                  <button onClick={() => setView('table')}
                    className={`flex items-center gap-1 px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${view === 'table' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-800'}`}>
                    <Table2 className="w-3 h-3" />Table
                  </button>
                )}
              </div>
              {data.length > 0 && <>
                <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-700 mx-1" />
                <CopyButton value={outputStr} />
                <button onClick={downloadFile} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-brand-600 hover:border-brand-300 transition-all font-medium">
                  <Download className="w-3.5 h-3.5" /> Export
                </button>
              </>}
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            {!data.length ? (
              <div className="min-h-[500px] flex flex-col items-center justify-center text-gray-400 gap-4 bg-zinc-50/50 dark:bg-zinc-900/30">
                <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                  <FileText className="w-8 h-8 opacity-20" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-zinc-500">No data generated yet</p>
                  <p className="text-xs text-zinc-400 mt-1">Configure your schema and click <strong>Generate</strong></p>
                </div>
              </div>
            ) : view === 'table' && format === 'json' ? (
              <div className="overflow-auto max-h-[600px]">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-800 z-10 shadow-[0_1px_0_rgba(0,0,0,0.05)]">
                    <tr>
                      {flatHeaders.map(h => (
                        <th key={h} className="px-4 py-3 font-bold text-zinc-500 dark:text-zinc-400 whitespace-nowrap border-b border-zinc-200 dark:border-zinc-700 uppercase tracking-tighter text-[10px]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {flatData.map((row, i) => (
                      <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/60 border-b border-zinc-100 dark:border-zinc-800/60 transition-colors">
                        {flatHeaders.map(h => (
                          <td key={h} className="px-4 py-3 text-zinc-800 dark:text-zinc-200 whitespace-nowrap max-w-[200px] truncate font-mono text-[11px]" title={String(row[h] ?? '')}>
                            {String(row[h] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-zinc-50 dark:bg-zinc-950 min-h-[500px] max-h-[650px] overflow-auto p-6 font-mono text-xs text-zinc-800 dark:text-zinc-300 leading-relaxed">
                <pre className="whitespace-pre-wrap break-all">{outputStr}</pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
