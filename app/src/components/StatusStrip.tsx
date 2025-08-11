import React from 'react';

type Props = { rawTextLen: number; ocrUsed: boolean; validateOk: boolean; appliedCount: number };

export default function StatusStrip({ rawTextLen, ocrUsed, validateOk, appliedCount }: Props) {
  const traceId = localStorage.getItem('lastTraceId') || '';
  return (
    <div className="fixed bottom-2 right-2 text-xs bg-black/80 text-white px-3 py-2 rounded-xl shadow-lg backdrop-blur-sm" role="status" aria-live="polite">
      <span>rawText: {rawTextLen}</span>
      <span className="mx-2">•</span>
      <span>ocr_used: {ocrUsed ? 'true' : 'false'}</span>
      <span className="mx-2">•</span>
      <span>validate: {validateOk ? 'OK' : 'Fail'}</span>
      <span className="mx-2">•</span>
      <span>applied: {appliedCount}</span>
      {traceId && (
        <span className="ml-2 opacity-70">trace: {traceId}</span>
      )}
    </div>
  );
}


