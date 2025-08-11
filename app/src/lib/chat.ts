import type { Resume, Suggestion } from '../types';

export type PatchEnvelope = { patch: Suggestion[]; responseId?: string } | { questions: string[]; responseId?: string };

export async function postEditPatch(params: {
  resume: Resume;
  instruction: string;
  previousResponseId?: string;
  schema?: unknown;
}): Promise<PatchEnvelope> {
  const resp = await fetch('http://localhost:3001/ai/patch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: 'edit',
      resume: params.resume,
      instruction: params.instruction,
      previousResponseId: params.previousResponseId,
      schema: params.schema,
    }),
  });
  if (!resp.ok) throw new Error(`patch_failed_${resp.status}`);
  return (await resp.json()) as PatchEnvelope;
}

export async function postJDPatched(params: {
  resume: Resume;
  jdText: string;
  previousResponseId?: string;
  schema?: unknown;
}): Promise<PatchEnvelope> {
  const resp = await fetch('http://localhost:3001/ai/patch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: 'jd',
      resume: params.resume,
      jdText: params.jdText,
      previousResponseId: params.previousResponseId,
      schema: params.schema,
    }),
  });
  if (!resp.ok) throw new Error(`patch_failed_${resp.status}`);
  return (await resp.json()) as PatchEnvelope;
}

export async function postUtilJDCoverage(params: {
  resume: Resume;
  jdText: string;
}): Promise<{ used: string[]; missing: string[]; score: number; responseId?: string }> {
  const resp = await fetch('http://localhost:3001/ai/util', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind: 'jd-coverage', resume: params.resume, jdText: params.jdText }),
  });
  if (!resp.ok) throw new Error(`util_failed_${resp.status}`);
  return (await resp.json()) as any;
}


