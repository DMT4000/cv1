import type { Suggestion } from '../types';
import { applyPatchSequence } from './patch';
import { validateResume } from './validate';

export function applyWithValidation(current: any, patch: Suggestion[]): { ok: boolean; value?: any; error?: string } {
  // Dry-run
  const res = applyPatchSequence(current, patch);
  if (!res.ok) return res;
  const next = res.value;
  const v = validateResume(next);
  if (!v.ok) return { ok: false, error: 'schema_invalid' };
  return { ok: true, value: next };
}

export function applyWithSkip(current: any, patch: Suggestion[]): { ok: boolean; value?: any; errors: { id: string; error: string }[] } {
  let doc = JSON.parse(JSON.stringify(current));
  const errors: { id: string; error: string }[] = [];
  for (const op of patch) {
    const res = applyPatchSequence(doc, [op]);
    if (!res.ok) {
      errors.push({ id: op.id, error: res.error || 'unknown_error' });
      continue;
    }
    doc = res.value;
  }
  const v = validateResume(doc);
  if (!v.ok) return { ok: false, value: current, errors: errors.length ? errors : [{ id: 'schema', error: 'schema_invalid' }] };
  return { ok: true, value: doc, errors };
}


