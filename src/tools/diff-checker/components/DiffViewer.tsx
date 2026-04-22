'use client';

import React, { useMemo } from 'react';
import * as diffLib from 'diff';

export type Granularity = 'lines' | 'words' | 'chars' | 'sentences';

interface DiffViewerProps {
  oldString: string;
  newString: string;
  viewType: 'split' | 'inline';
  granularity: Granularity;
  ignoreWhitespace: boolean;
  isJson?: boolean;
}

function computeDiff(
  old: string, next: string, granularity: Granularity,
  ignoreWhitespace: boolean, isJson: boolean
): diffLib.Change[] {
  if (!old && !next) return [];

  // JSON mode always compares formatted JSON objects at line level
  if (isJson) {
    try {
      return diffLib.diffJson(JSON.parse(old || '{}'), JSON.parse(next || '{}'));
    } catch {
      // fall through to line diff
    }
  }
  switch (granularity) {
    case 'words':
      return diffLib.diffWords(old, next, ignoreWhitespace ? { ignoreCase: true } : { ignoreCase: false });
    case 'chars':
      return diffLib.diffChars(old, next, ignoreWhitespace ? { ignoreCase: true } : { ignoreCase: false });
    case 'sentences':
      return (diffLib as any).diffSentences?.(old, next) ?? diffLib.diffLines(old, next, ignoreWhitespace ? { ignoreWhitespace: true } : {});
    case 'lines':
    default:
      return diffLib.diffLines(old, next, ignoreWhitespace ? { newlineIsToken: false, ignoreWhitespace: true } : { newlineIsToken: false });
  }
}

// ── Intra-line character diff (for lines granularity) ─────────────────────────
function IntraLineDiff({ old: o, next: n, side }: { old: string; next: string; side: 'old' | 'new' }) {
  const chars = diffLib.diffChars(o, n);
  return (
    <>
      {chars.map((part, i) => {
        if (side === 'old' && part.added) return null;
        if (side === 'new' && part.removed) return null;
        const cls = part.removed
          ? 'bg-red-200 dark:bg-red-800/60 text-red-900 dark:text-red-200 rounded px-0.5'
          : part.added
          ? 'bg-green-200 dark:bg-green-800/60 text-green-900 dark:text-green-200 rounded px-0.5'
          : '';
        return <span key={i} className={cls}>{part.value}</span>;
      })}
    </>
  );
}

// ── Line numbered split view ──────────────────────────────────────────────────
function SplitView({
  changes, granularity,
}: { changes: diffLib.Change[]; granularity: Granularity }) {
  let leftLine = 1, rightLine = 1;

  // rebuild lines
  const rows: { leftNum?: number; rightNum?: number; left?: diffLib.Change; right?: diffLib.Change }[] = [];

  changes.forEach(change => {
    if (!change.added && !change.removed) {
      const lines = change.value.split('\n');
      lines.forEach((_, idx) => {
        if (idx === lines.length - 1 && lines[idx] === '') return;
        rows.push({ leftNum: leftLine++, rightNum: rightLine++, left: change, right: change });
      });
    } else if (change.removed) {
      const lines = change.value.split('\n');
      lines.forEach((_, idx) => {
        if (idx === lines.length - 1 && lines[idx] === '') return;
        rows.push({ leftNum: leftLine++, left: change });
      });
    } else if (change.added) {
      const lines = change.value.split('\n');
      lines.forEach((_, idx) => {
        if (idx === lines.length - 1 && lines[idx] === '') return;
        rows.push({ rightNum: rightLine++, right: change });
      });
    }
  });

  const cellCls = (change?: diffLib.Change) => {
    if (!change) return 'bg-zinc-50 dark:bg-zinc-900';
    if (change.removed) return 'bg-red-50 dark:bg-red-950/40';
    if (change.added)   return 'bg-green-50 dark:bg-green-950/40';
    return '';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs font-mono border-collapse">
        <colgroup>
          <col className="w-10" /><col /><col className="w-10" /><col />
        </colgroup>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-zinc-100 dark:border-zinc-800/60">
              {/* Left */}
              <td className={`select-none px-2 py-0.5 text-right text-zinc-300 dark:text-zinc-600 border-r border-zinc-100 dark:border-zinc-800 ${cellCls(row.left)}`}>
                {row.leftNum}
              </td>
              <td className={`px-3 py-0.5 whitespace-pre-wrap break-all align-top ${cellCls(row.left)}`}>
                {row.left?.removed && row.right?.added && granularity === 'lines'
                  ? <IntraLineDiff old={row.left.value} next={row.right.value} side="old" />
                  : row.left ? (
                    <span className={row.left.removed ? 'text-red-700 dark:text-red-300' : 'text-zinc-700 dark:text-zinc-300'}>
                      {row.left.value}
                    </span>
                  ) : null}
              </td>
              {/* Right */}
              <td className={`select-none px-2 py-0.5 text-right text-zinc-300 dark:text-zinc-600 border-r border-x border-zinc-100 dark:border-zinc-800 ${cellCls(row.right)}`}>
                {row.rightNum}
              </td>
              <td className={`px-3 py-0.5 whitespace-pre-wrap break-all align-top ${cellCls(row.right)}`}>
                {row.right?.added && row.left?.removed && granularity === 'lines'
                  ? <IntraLineDiff old={row.left.value} next={row.right.value} side="new" />
                  : row.right ? (
                    <span className={row.right.added ? 'text-green-700 dark:text-green-300' : 'text-zinc-700 dark:text-zinc-300'}>
                      {row.right.value}
                    </span>
                  ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Inline view ───────────────────────────────────────────────────────────────
function InlineView({ changes }: { changes: diffLib.Change[] }) {
  let lineNum = 1;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs font-mono border-collapse">
        <tbody>
          {changes.map((change, ci) => {
            const segments = change.value.split('\n');
            return segments.map((seg, si) => {
              if (si === segments.length - 1 && seg === '') return null;
              const num = lineNum++;
              const rowCls = change.added
                ? 'bg-green-50 dark:bg-green-950/40'
                : change.removed
                ? 'bg-red-50 dark:bg-red-950/40'
                : '';
              const prefix = change.added ? '+' : change.removed ? '-' : ' ';
              const textCls = change.added
                ? 'text-green-700 dark:text-green-300'
                : change.removed
                ? 'text-red-700 dark:text-red-300 line-through'
                : 'text-zinc-600 dark:text-zinc-400';
              return (
                <tr key={`${ci}-${si}`} className={`border-b border-zinc-100 dark:border-zinc-800/40 ${rowCls}`}>
                  <td className="select-none w-10 px-2 py-0.5 text-right text-zinc-300 dark:text-zinc-600 border-r border-zinc-100 dark:border-zinc-800">{num}</td>
                  <td className="select-none w-5 px-2 py-0.5 text-center font-bold text-zinc-400">{prefix}</td>
                  <td className={`px-3 py-0.5 whitespace-pre-wrap break-all ${textCls}`}>{seg}</td>
                </tr>
              );
            });
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Stats bar ─────────────────────────────────────────────────────────────────
function StatsBar({ changes }: { changes: diffLib.Change[] }) {
  const added    = changes.filter(c => c.added).reduce((s, c) => s + c.count!, 0);
  const removed  = changes.filter(c => c.removed).reduce((s, c) => s + c.count!, 0);
  const unchanged = changes.filter(c => !c.added && !c.removed).reduce((s, c) => s + c.count!, 0);

  return (
    <div className="flex items-center gap-4 text-xs font-medium px-1">
      <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
        <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
        +{added} added
      </span>
      <span className="flex items-center gap-1 text-red-500 dark:text-red-400">
        <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
        -{removed} removed
      </span>
      <span className="flex items-center gap-1 text-zinc-400">
        <span className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-600 inline-block" />
        {unchanged} unchanged
      </span>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export const DiffViewer: React.FC<DiffViewerProps> = ({
  oldString, newString, viewType, granularity, ignoreWhitespace, isJson = false,
}) => {
  const changes = useMemo(
    () => computeDiff(oldString, newString, granularity, ignoreWhitespace, isJson),
    [oldString, newString, granularity, ignoreWhitespace, isJson]
  );

  if (!changes.length) {
    return (
      <div className="text-center py-10 text-gray-500 dark:text-gray-400">
        No differences found
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <StatsBar changes={changes} />
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {viewType === 'split'
          ? <SplitView changes={changes} granularity={granularity} />
          : <InlineView changes={changes} />}
      </div>
    </div>
  );
};
