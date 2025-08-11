import React, { useState } from 'react';
import { useAppState } from '../store/appState';
import { postEditPatch } from '../lib/chat';
import type { Suggestion } from '../types';
import SuggestionItem from './SuggestionItem';
import { applyWithValidation } from '../lib/applyPatch';
import Questions from './Questions';
import InlineToast from './InlineToast';

export default function ChatPanel() {
  const { resume, convo } = useAppState();
  const [input, setInput] = useState('Tighten current role bullets to impact + metric + tool');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [questions, setQuestions] = useState<string[]>([]);
  const [responseId, setResponseId] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);

  async function performSend(text: string) {
    if (!text.trim()) return;
    setLoading(true);
    setQuestions([]);
    try {
      const resp = await postEditPatch({ resume, instruction: text, previousResponseId: convo.previousResponseId });
      const rid = (resp as any).responseId as string | undefined;
      setResponseId(rid);
      if (rid) {
        useAppState.setState((s) => ({ convo: { ...s.convo, previousResponseId: rid } }));
        localStorage.setItem('previousResponseId', rid);
      }
      if ('questions' in resp) {
        setSuggestions([]);
        setQuestions(resp.questions);
      } else {
        setQuestions([]);
        setSuggestions(resp.patch);
      }
    } catch (e) {
      setError((e as Error).message || 'Unknown error');
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }

  async function send() {
    await performSend(input);
  }

  function acceptOne(idx: number) {
    const s = suggestions[idx];
    if (!s) return;
    const res = applyWithValidation(resume as any, [s]);
    if (res.ok) {
      useAppState.setState({ resume: res.value! });
      const prev = Number(localStorage.getItem('appliedCount') || '0');
      localStorage.setItem('appliedCount', String(prev + 1));
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          className="flex-1 border rounded px-2 py-1"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask for edits (patches only)"
        />
        <button className="px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-60" onClick={send} disabled={loading}>
          {loading ? '…' : 'Send'}
        </button>
      </div>
      {responseId && (
        <div className="text-xs text-gray-500">responseId: {responseId}</div>
      )}
      {error && (
        <InlineToast message={error} onClose={() => setError(undefined)} onRetry={() => { setError(undefined); void send(); }} />
      )}
      {questions.length > 0 && (
        <Questions
          questions={questions}
          onSubmit={(answers) => {
            const instruction = answers
              .map((a, i) => (a.trim() ? `Q${i + 1}: ${questions[i]}\\nA: ${a.trim()}` : ''))
              .filter(Boolean)
              .join('\\n\\n');
            setInput(instruction);
            void performSend(instruction);
          }}
        />
      )}
      {suggestions.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-semibold">Suggestions</div>
          {suggestions.map((s, i) => (
            <SuggestionItem key={s.id} s={s} onAccept={() => acceptOne(i)} />
          ))}
        </div>
      )}
    </div>
  );
}


