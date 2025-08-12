import React, { useState } from 'react';

type Props = { questions: string[]; onSubmit: (answers: string[]) => void };

export default function Questions({ questions, onSubmit }: Props) {
  const [answers, setAnswers] = useState<string[]>(Array.from({ length: questions.length }, () => ''));
  return (
    <div className="space-y-2 border rounded p-2">
      <div className="text-sm font-semibold">Questions</div>
      {questions.map((q, i) => (
        <div key={i} className="space-y-1">
          <div className="text-sm">{q}</div>
          <input
            className="w-full border rounded px-2 py-1 text-sm"
            value={answers[i]}
            onChange={(e) => {
              const next = answers.slice();
              next[i] = e.target.value;
              setAnswers(next);
            }}
            placeholder="Your answer"
          />
        </div>
      ))}
      <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={() => onSubmit(answers)}>Submit</button>
    </div>
  );
}

import React, { useMemo, useState } from 'react';

type Props = { questions: string[]; onSubmit: (answers: string[]) => void };

export default function Questions({ questions, onSubmit }: Props) {
  const [answers, setAnswers] = useState<string[]>(() => questions.map(() => ''));

  const canSubmit = useMemo(() => answers.some((a) => a.trim().length > 0), [answers]);

  if (!questions || questions.length === 0) return null;
  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold">Questions</div>
      <div className="space-y-2">
        {questions.map((q, i) => (
          <div key={i} className="space-y-1">
            <div className="text-sm">{q}</div>
            <input
              className="w-full border rounded px-2 py-1 text-sm"
              placeholder="Your answer"
              value={answers[i] || ''}
              onChange={(e) => {
                const arr = answers.slice();
                arr[i] = e.target.value;
                setAnswers(arr);
              }}
            />
          </div>
        ))}
      </div>
      <button
        className="px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-60"
        disabled={!canSubmit}
        onClick={() => onSubmit(answers)}
      >
        Send answers
      </button>
    </div>
  );
}


