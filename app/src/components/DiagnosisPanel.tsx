import React, { useMemo } from 'react';
import { useAppState } from '../store/appState';
import { diagnose } from '../lib/diagnose';

export default function DiagnosisPanel() {
  const { resume, rolePreset } = useAppState();
  const dx = useMemo(() => diagnose(resume, rolePreset), [resume, rolePreset]);
  return (
    <div className="grid grid-cols-3 gap-3 text-sm">
      <div className="border p-3 rounded">
        <div className="font-semibold mb-1">Strengths</div>
        <ul className="list-disc pl-4">
          {dx.strengths.map((s, i) => <li key={i}>{s}</li>)}
        </ul>
      </div>
      <div className="border p-3 rounded">
        <div className="font-semibold mb-1">Gaps</div>
        <ul className="list-disc pl-4">
          {dx.gaps.map((s, i) => <li key={i}>{s}</li>)}
        </ul>
      </div>
      <div className="border p-3 rounded">
        <div className="font-semibold mb-1">Quick Wins</div>
        <ul className="list-disc pl-4">
          {dx.quickWins.map((s, i) => <li key={i}>{s}</li>)}
        </ul>
      </div>
    </div>
  );
}


