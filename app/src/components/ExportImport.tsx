import React from 'react';

export function ExportImport({ getState, setState }: { getState: () => unknown; setState: (next: any) => void }) {
  return (
    <div className="flex gap-2">
      <button
        className="px-3 py-1 bg-gray-200 rounded"
        onClick={() => {
          const data = getState();
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'resume-state.json';
          a.click();
          URL.revokeObjectURL(url);
        }}
      >
        Export JSON
      </button>
      <label className="px-3 py-1 bg-gray-200 rounded cursor-pointer">
        Import JSON
        <input
          type="file"
          accept="application/json"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const json = JSON.parse(await f.text());
            setState(json);
            location.reload();
          }}
        />
      </label>
    </div>
  );
}


