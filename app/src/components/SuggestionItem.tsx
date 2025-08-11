import React from 'react';
import type { Suggestion } from '../types';

type Props = { s: Suggestion; onAccept?: () => void; onReject?: () => void };

export default function SuggestionItem({ s, onAccept, onReject }: Props) {
  return (
    <div className="flex items-start justify-between gap-3 border p-2 rounded" role="group" aria-label="Suggestion">
      <div>
        <div className="font-mono text-xs" aria-label="Path and kind">{s.path} · {s.kind}</div>
        <div className="text-sm">{s.rationale} <span className="opacity-60">({s.provenance})</span></div>
      </div>
      <div className="flex gap-2">
        <button className="px-2 py-1 bg-green-600 text-white rounded" onClick={onAccept} aria-label="Accept suggestion">✓</button>
        <button className="px-2 py-1 bg-red-600 text-white rounded" onClick={onReject} aria-label="Reject suggestion">✗</button>
      </div>
    </div>
  );
}


