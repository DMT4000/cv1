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


