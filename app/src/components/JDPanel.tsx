import React, { useState } from 'react';
import { useAppState } from '../store/appState';
import { aiPatch, aiUtil } from '../lib/api';
import type { Suggestion } from '../types';
import SuggestionItem from './SuggestionItem';
import InlineToast from './InlineToast';

export default function JDPanel() {
  const { resume } = useAppState();
  const [jd, setJd] = useState('');
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [coverage, setCoverage] = useState<{ used: string[]; missing: string[]; score: number } | null>(null);
  const [error, setError] = useState<string | undefined>(undefined);

  async function runTailor() {
    if (!jd.trim()) return;
    setLoading(true);
    setQuestions([]);
    setSuggestions([]);
    try {
      const env = await aiPatch({ mode: 'jd', resume, jdText: jd });
      if ('questions' in env) {
        setQuestions(env.questions);
      } else {
        setSuggestions(env.patch);
      }
      const cov = await aiUtil({ kind: 'jd-coverage', resume, jdText: jd });
      setCoverage({ used: cov.used, missing: cov.missing, score: cov.score });
      useAppState.setState({ metrics: { used: cov.used, missing: cov.missing, score: cov.score } });
    } catch (e) {
      setError((e as Error).message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function loadSample(path: string) {
    const resp = await fetch(path);
    const txt = await resp.text();
    setJd(txt);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <button className="px-3 py-1 bg-gray-200 rounded" onClick={() => loadSample('/fixtures/jd_pm.txt')}>Use sample jd_pm.txt</button>
        <button className="px-3 py-1 bg-gray-200 rounded" onClick={() => loadSample('/fixtures/jd_ai_eng.txt')}>Use sample jd_ai_eng.txt</button>
      </div>
      <textarea className="w-full h-40 border p-2" placeholder="Paste JD here" value={jd} onChange={(e) => setJd(e.target.value)} />
      <button className="px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-60" disabled={loading || !jd.trim()} onClick={runTailor}>
        {loading ? 'Tailoring…' : 'Tailor'}
      </button>
      {error && (
        <InlineToast message={error} onClose={() => setError(undefined)} onRetry={() => { setError(undefined); void runTailor(); }} />
      )}
      {questions.length > 0 && (
        <div>
          <div className="text-sm font-semibold">Questions</div>
          <ul className="list-disc pl-5 text-sm">
            {questions.map((q, i) => <li key={i}>{q}</li>)}
          </ul>
        </div>
      )}
      {suggestions.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-semibold">Suggestions</div>
          {suggestions.map((s) => (
            <SuggestionItem key={s.id} s={s} />
          ))}
        </div>
      )}
      {coverage && (
        <div className="text-sm">
          <div className="font-semibold">JD Coverage</div>
          <div>Score: {coverage.score}</div>
          <div>Used: {coverage.used.join(', ') || '-'}</div>
          <div>Missing: {coverage.missing.join(', ') || '-'}</div>
        </div>
      )}
    </div>
  );
}


