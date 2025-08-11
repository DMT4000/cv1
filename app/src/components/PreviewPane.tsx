import React from 'react';

type Props = { left?: React.ReactNode; right?: React.ReactNode };

export default function PreviewPane({ left, right }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="border p-3 min-h-[200px] rounded-2xl bg-white shadow-sm">{left ?? 'Current'}</div>
      <div className="border p-3 min-h-[200px] rounded-2xl bg-white shadow-sm">{right ?? 'Proposed'}</div>
    </div>
  );
}


