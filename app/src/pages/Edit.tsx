import React, { useEffect, useMemo, useState } from 'react';
import SuggestionItem from '../components/SuggestionItem';
import { applyWithValidation } from '../lib/applyPatch';
import type { Suggestion } from '../types';
import ChatPanel from '../components/ChatPanel';

export default function EditPage() {
  const [resume, setResume] = useState<any>({ basics: { name: 'Sample User', label: 'Engineer', email: 'a@b.c', phone: '000' }, skills: [], work: [], education: [] });
  const [selectedIdx, setSelectedIdx] = useState(0);
  const samplePatch: Suggestion[] = useMemo(() => ([
    { id: '1', path: '/summary', kind: 'replace', oldValue: '', newValue: 'Concise summary', rationale: 'Add concise summary', provenance: 'from_user' },
    { id: '2', path: '/skills/0', kind: 'insert', newValue: 'TypeScript', rationale: 'Add skill', provenance: 'from_user' },
    { id: '3', path: '/skills/0', kind: 'delete', oldValue: 'TypeScript', rationale: 'Remove duplicate', provenance: 'from_user' },
  ]), []);

  function applySample() {
    const res = applyWithValidation(resume, samplePatch);
    if (res.ok) {
      setResume(res.value);
      const prev = Number(localStorage.getItem('appliedCount') || '0');
      localStorage.setItem('appliedCount', String(prev + samplePatch.length));
    }
  }

  function acceptOne(idx: number) {
    const s = samplePatch[idx];
    if (!s) return;
    const res = applyWithValidation(resume, [s]);
    if (res.ok) {
      setResume(res.value);
      const prev = Number(localStorage.getItem('appliedCount') || '0');
      localStorage.setItem('appliedCount', String(prev + 1));
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Enter') {
        e.preventDefault();
        acceptOne(selectedIdx);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setSelectedIdx((i) => (i + 1) % samplePatch.length);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedIdx, samplePatch.length]);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Edit</h2>
      <ChatPanel />
      <div className="space-y-2">
        {samplePatch.map((s, i) => (
          <div key={s.id} className={i === selectedIdx ? 'ring-2 ring-blue-500 rounded' : ''}>
            <SuggestionItem s={s} onAccept={() => acceptOne(i)} onReject={() => setSelectedIdx((idx) => (idx + 1) % samplePatch.length)} />
          </div>
        ))}
      </div>
      <button onClick={applySample} className="px-3 py-1 bg-blue-600 text-white rounded">Apply Sample Patch</button>
    </div>
  );
}


