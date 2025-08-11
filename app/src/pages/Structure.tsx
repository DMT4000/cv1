import React, { useState } from 'react';
import { structureHeuristically } from '../lib/structure/heuristics';
import { validateResume } from '../lib/validate';
import { structViaProxy } from '../lib/structure/fallback';
import { normalizeResume } from '../lib/normalize';

export default function StructurePage() {
  const [rawText, setRawText] = useState('');
  React.useEffect(() => {
    const saved = localStorage.getItem('rawText');
    if (saved) setRawText(saved);
  }, []);
  const [validateOk, setValidateOk] = useState<boolean | null>(null);

  async function runHeuristics() {
    const result = structureHeuristically(rawText);
    const norm = normalizeResume(result.resume);
    const v = validateResume(norm.resume);
    setValidateOk(v.ok);
    localStorage.setItem('validateOk', String(v.ok));
  }

  async function runNormalizeValidate() {
    const result = structureHeuristically(rawText);
    const norm = normalizeResume(result.resume);
    const v = validateResume(norm.resume);
    setValidateOk(v.ok);
  }

  async function runFallback() {
    const result = await structViaProxy(rawText);
    const v = validateResume(result.resume);
    setValidateOk(v.ok);
    localStorage.setItem('validateOk', String(v.ok));
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Structure</h2>
      <textarea className="w-full h-40 border p-2" placeholder="Paste raw text here" value={rawText} onChange={(e) => setRawText(e.target.value)} />
      <div className="flex gap-2">
        <button onClick={runHeuristics} className="px-3 py-1 bg-gray-200 rounded">Heuristics</button>
        <button onClick={runFallback} className="px-3 py-1 bg-gray-200 rounded">Fallback (/ai/struct)</button>
        <button onClick={runNormalizeValidate} className="px-3 py-1 bg-gray-200 rounded">Normalize & Validate</button>
      </div>
      {validateOk !== null && (
        <div className="text-sm">validate: {validateOk ? 'OK' : 'Fail'}</div>
      )}
    </div>
  );
}


