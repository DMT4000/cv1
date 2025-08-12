import React from 'react';
import type { Suggestion } from '../types';
import { useAppState } from '../store/appState';
import LockBadge from './LockBadge';

type Props = { suggestions: Suggestion[]; onAccept?: (s: Suggestion) => void; onReject?: (s: Suggestion) => void };

function patternToRegex(pattern: string): RegExp {
  // Convert '/work/*/company' → ^/work/\\d+/company$
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const withWild = escaped.replace(/\\\*/g, '\\d+');
  return new RegExp(`^${withWild}$`);
}

function isLocked(path: string, lockedPatterns: string[], unlockedExact: string[]): boolean {
  if (unlockedExact.includes(path)) return false;
  return lockedPatterns.some((p) => patternToRegex(p).test(path));
}

export default function DiffPane({ suggestions, onAccept, onReject }: Props) {
  const { lockedPaths, unlockedPaths } = useAppState();
  const unlock = (path: string) => {
    useAppState.setState((s) => ({ unlockedPaths: Array.from(new Set([...(s.unlockedPaths || []), path])) }));
  };
  return (
    <div className="space-y-2" role="list" aria-label="Suggestions list">
      <div className="text-sm font-semibold">Suggestions</div>
      {suggestions.length === 0 ? (
        <div className="text-xs text-gray-500">No suggestions yet.</div>
      ) : null}
      {suggestions.map((s) => (
        <div key={s.id} className="group border rounded p-2 text-sm bg-white/80" role="listitem" aria-label={`Suggestion ${s.kind} at ${s.path}`}>
          <div className="flex items-center justify-between">
            <div className="font-mono text-xs">{s.path} · {s.kind}</div>
            <div>
              <LockBadge
                locked={isLocked(s.path, lockedPaths || [], unlockedPaths || [])}
                onToggle={() => unlock(s.path)}
              />
            </div>
          </div>
          <div className="truncate">{String(s.oldValue ?? '')} → {String(s.newValue ?? '')}</div>
          <div className="opacity-0 group-hover:opacity-100 text-xs text-gray-600 mt-1">{s.rationale} ({s.provenance})</div>
          {(onAccept || onReject) && (
            <div className="mt-2 flex gap-2">
              {onAccept && (
                <button
                  className="px-2 py-1 bg-green-600 text-white rounded disabled:opacity-60"
                  onClick={() => onAccept(s)}
                  title={isLocked(s.path, lockedPaths || [], unlockedPaths || []) ? 'Locked field — unlock to apply.' : ''}
                  disabled={isLocked(s.path, lockedPaths || [], unlockedPaths || [])}
                >
                  Accept
                </button>
              )}
              {onReject && <button className="px-2 py-1 bg-red-600 text-white rounded" onClick={() => onReject(s)}>Reject</button>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}


