import React, { useMemo, useState } from 'react';
import ChatPanel from '../components/ChatPanel';
import StatusStrip from '../components/StatusStrip';
import { useAppState } from '../store/appState';
import { aiStruct, __MOCK__ } from '../lib/api';
import { structureHeuristically } from '../lib/structure/heuristics';
import { normalizeResume } from '../lib/normalize';
import { validateResume } from '../lib/validate';
import PreviewPane from '../components/PreviewPane';
import DiffPane from '../components/DiffPane';
import type { Suggestion } from '../types';
import { applyWithValidation, applyWithSkip } from '../lib/applyPatch';
import { extractPdfText } from '../lib/pdf';
import { assembleRawText } from '../lib/text';
import JDPanel from '../components/JDPanel';
import { ExportImport } from '../components/ExportImport';

export default function ChatEditor() {
  const state = useAppState();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const status = useMemo(() => ({
    rawTextLen: Number(localStorage.getItem('rawTextLen') || '0'),
    ocrUsed: localStorage.getItem('ocr_used') === 'true',
    validateOk: localStorage.getItem('validateOk') === 'true',
    appliedCount: Number(localStorage.getItem('appliedCount') || '0'),
  }), [state.resume]);

  async function useSample() {
    setBusy(true);
    setError(undefined);
    try {
      // Load sample clean.pdf as raw text surrogate by fetching a baked text fixture if present
      // For now, simulate rawText length
      const rawText = 'Sample resume text from clean.pdf';
      localStorage.setItem('rawTextLen', String(rawText.length));
      localStorage.setItem('ocr_used', 'false');

      // Heuristics → normalize; if weak, call aiStruct (mock or proxy)
      const heur = structureHeuristically(rawText);
      let resume = heur.resume;
      let flags = heur.flags;
      if (flags.includes('heuristics_incomplete')) {
        const via = await aiStruct(rawText);
        resume = via.resume as any;
      }
      const norm = normalizeResume(resume);
      resume = norm.resume;
      flags = Array.from(new Set([...flags, ...norm.flags]));
      const v = validateResume(resume);
      localStorage.setItem('validateOk', String(v.ok));
      state.setResume(resume as any);
    } catch (e) {
      setError((e as Error).message || 'sample_failed');
    } finally {
      setBusy(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(undefined);
    try {
      const pages = await extractPdfText(file);
      const rawText = assembleRawText(pages.map((p) => ({ index: p.index, text: p.text })));
      localStorage.setItem('rawTextLen', String(rawText.length));
      localStorage.setItem('ocr_used', 'false');
      const heur = structureHeuristically(rawText);
      let resume = heur.resume;
      let flags = heur.flags;
      if (flags.includes('heuristics_incomplete')) {
        const via = await aiStruct(rawText);
        resume = via.resume as any;
      }
      const norm = normalizeResume(resume);
      resume = norm.resume;
      flags = Array.from(new Set([...flags, ...norm.flags]));
      const v = validateResume(resume);
      localStorage.setItem('validateOk', String(v.ok));
      state.setResume(resume as any);
    } catch (err) {
      setError((err as Error).message || 'upload_failed');
    } finally {
      setBusy(false);
      // reset input to allow re-uploading same file
      e.currentTarget.value = '';
    }
  }

  function applySamplePatch() {
    const prov: Suggestion['provenance'] = 'from_resume';
    const patch: Suggestion[] = [
      { id: 'sp1', path: '/summary', kind: 'replace', oldValue: state.resume.summary ?? '', newValue: 'Impact-focused engineer; TS/React; shipping measurable outcomes.', rationale: 'Tightens summary', provenance: prov },
      { id: 'sp2', path: `/skills/${(state.resume.skills || []).length}`, kind: 'insert', newValue: 'GraphQL', rationale: 'Adds relevant stack keyword', provenance: prov },
    ];
    const res = applyWithValidation(state.resume as any, patch);
    if (res.ok) {
      useAppState.setState({ resume: res.value as any });
      const prev = Number(localStorage.getItem('appliedCount') || '0');
      localStorage.setItem('appliedCount', String(prev + patch.length));
      useAppState.setState({ suggestions: patch });
    }
  }

  function acceptSuggestion(s: Suggestion) {
    const res = applyWithValidation(state.resume as any, [s]);
    if (res.ok) {
      useAppState.setState({ resume: res.value as any, suggestions: (state.suggestions || []).filter((x) => x.id !== s.id) });
      const prev = Number(localStorage.getItem('appliedCount') || '0');
      localStorage.setItem('appliedCount', String(prev + 1));
    }
  }

  function rejectSuggestion(s: Suggestion) {
    useAppState.setState({ suggestions: (state.suggestions || []).filter((x) => x.id !== s.id) });
  }

  function demoLockedChange() {
    const s: Suggestion = {
      id: 'locked_demo',
      path: '/work/0/company',
      kind: 'replace',
      oldValue: (state.resume.work?.[0]?.company ?? 'Acme'),
      newValue: 'NewCo',
      rationale: 'Demo: attempt to change locked company field',
      provenance: 'from_user',
      section: 'work',
    } as Suggestion;
    useAppState.setState({ suggestions: [s] });
  }

  return (
    <div className="min-h-screen p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-lg font-semibold">CV Cursor — Chat Editor {__MOCK__.MOCK ? <span className="ml-2 text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-800">Mock Mode</span> : null}</div>
        <div className="flex gap-2 items-center">
          <button className="px-3 py-1 bg-gray-200 rounded" onClick={useSample} disabled={busy}>{busy ? 'Loading…' : 'Use sample clean.pdf'}</button>
          <button className="px-3 py-1 bg-gray-200 rounded" onClick={applySamplePatch}>Apply Sample Patch</button>
          <label className="px-3 py-1 bg-gray-200 rounded cursor-pointer">
            Upload PDF
            <input type="file" accept="application/pdf" className="hidden" onChange={handleUpload} />
          </label>
          <button className="px-3 py-1 bg-amber-200 text-amber-900 rounded" onClick={demoLockedChange} title="Shows disabled accept with lock tooltip">Locked Change (demo)</button>
          <ExportImport
            getState={() => JSON.parse(localStorage.getItem('appState') || '{}')}
            setState={(v) => localStorage.setItem('appState', JSON.stringify(v))}
          />
        </div>
      </div>
      {error && <div className="text-sm text-red-700 mb-2">{error}</div>}
      <div className="grid grid-cols-2 gap-4">
        <div className="border rounded-2xl p-3 shadow-sm bg-white">
          <ChatPanel />
        </div>
        <div className="border rounded-2xl p-3 shadow-sm bg-white">
          <DiffPane suggestions={state.suggestions || []} onAccept={acceptSuggestion} onReject={rejectSuggestion} />
          <div className="mt-3 flex gap-2">
            <button className="px-3 py-1 bg-gray-200 rounded" onClick={() => useAppState.getState().undo()}>Undo</button>
            <button className="px-3 py-1 bg-gray-200 rounded" onClick={() => useAppState.getState().redo()}>Redo</button>
            <button
              className="px-3 py-1 bg-gray-200 rounded"
              onClick={() => {
                const bad: Suggestion = { id: 'bad', path: '/skills/999', kind: 'replace', oldValue: '', newValue: 'X', rationale: 'conflict demo', provenance: 'from_user' } as any;
                const out = applyWithSkip(state.resume as any, [bad]);
                if (!out.ok && out.errors.length) {
                  alert(`Conflict: ${out.errors.map((e) => `${e.id}:${e.error}`).join(', ')}`);
                }
              }}
            >
              Simulate Conflict
            </button>
          </div>
        </div>
      </div>
      <div className="mt-4 border rounded-2xl p-3 bg-white shadow-sm">
        <div className="text-sm font-semibold mb-2">Tailor & Metrics</div>
        <JDPanel />
      </div>
      <StatusStrip rawTextLen={status.rawTextLen} ocrUsed={status.ocrUsed} validateOk={status.validateOk} appliedCount={status.appliedCount} />
    </div>
  );
}


