import React from 'react';

type Props = { rawTextLen: number; ocrUsed: boolean; validateOk: boolean; appliedCount: number };

export default function StatusStrip({ rawTextLen, ocrUsed, validateOk, appliedCount }: Props) {
  return (
    <div className="fixed bottom-2 right-2 text-xs bg-black/80 text-white px-3 py-2 rounded shadow">
      <span>rawText: {rawTextLen}</span>
      <span className="mx-2">•</span>
      <span>ocr_used: {ocrUsed ? 'true' : 'false'}</span>
      <span className="mx-2">•</span>
      <span>validate: {validateOk ? 'OK' : 'Fail'}</span>
      <span className="mx-2">•</span>
      <span>applied: {appliedCount}</span>
    </div>
  );
}


