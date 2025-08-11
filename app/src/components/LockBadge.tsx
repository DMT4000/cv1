import React from 'react';

type Props = { locked: boolean; onToggle?: () => void };

export default function LockBadge({ locked, onToggle }: Props) {
  return (
    <button
      className={`px-2 py-1 rounded text-xs ${locked ? 'bg-amber-200 text-amber-900' : 'bg-gray-200'}`}
      onClick={onToggle}
      aria-pressed={!locked}
      aria-label={locked ? 'Locked field' : 'Unlocked field'}
      title={locked ? 'Locked (click to unlock)' : 'Unlocked (click to lock)'}
    >
      {locked ? 'Locked' : 'Unlocked'}
    </button>
  );
}


