import { describe, it, expect } from 'vitest';
import { applyPatchSequence } from '../lib/patch';

describe('applyPatchSequence', () => {
  it('applies replace/insert/delete in order', () => {
    const doc = { skills: [] as string[], summary: '' };
    const res = applyPatchSequence(doc, [
      { id: '1', path: '/summary', kind: 'replace', oldValue: '', newValue: 'A', rationale: 'r', provenance: 'from_user' },
      { id: '2', path: '/skills/0', kind: 'insert', newValue: 'TS', rationale: 'r', provenance: 'from_user' },
      { id: '3', path: '/skills/0', kind: 'delete', oldValue: 'TS', rationale: 'r', provenance: 'from_user' },
    ] as any);
    expect(res.ok).toBe(true);
    expect(res.value?.summary).toBe('A');
    expect(res.value?.skills).toEqual([]);
  });
});


