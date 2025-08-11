import React, { useState } from 'react';
import { useAppState } from '../store/appState';
import type { Suggestion } from '../types';
import Questions from './Questions';
import InlineToast from './InlineToast';
import { aiPatch } from '../lib/api';

export default function ChatPanel() {
  const { resume, convo } = useAppState();
  const [input, setInput] = useState('Tighten current role bullets to impact + metric + tool');
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<string[]>([]);
  const [responseId, setResponseId] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);

  async function performSend(text: string) {
    if (!text.trim()) return;
    setLoading(true);
    setQuestions([]);
    try {
      const resp = await aiPatch({ mode: 'edit', resume, instruction: text, previousResponseId: convo.previousResponseId });
      const rid = (resp as any).responseId as string | undefined;
      setResponseId(rid);
      if (rid) {
        useAppState.setState((s) => ({ convo: { ...s.convo, previousResponseId: rid } }));
        localStorage.setItem('previousResponseId', rid);
      }
      if ('questions' in resp) {
        useAppState.setState({ suggestions: [] });
        setQuestions(resp.questions);
      } else {
        setQuestions([]);
        useAppState.setState({ suggestions: resp.patch });
      }
    } catch (e) {
      setError((e as Error).message || 'Unknown error');
      useAppState.setState({ suggestions: [] });
    } finally {
      setLoading(false);
    }
  }

  async function send() {
    await performSend(input);
  }

  return (
    <div className="space-y-3" role="region" aria-label="Chat panel">
      <div className="flex gap-2">
        <input
          className="flex-1 border rounded px-2 py-1"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask for edits (patches only)"
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); void send(); }
            if (e.key === 'Escape') { e.preventDefault(); setInput(''); }
            if (e.key === 'ArrowUp') { e.preventDefault(); setInput((prev) => prev || 'Tighten current role bullets to impact + metric + tool'); }
          }}
          aria-label="Chat input"
        />
        <button className="px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-60" onClick={send} disabled={loading} aria-label="Send message">
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
    </div>
  );
}


