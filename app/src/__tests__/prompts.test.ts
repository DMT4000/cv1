import { describe, it, expect } from 'vitest';
import { buildEditSystemPrompt, buildJDSystemPrompt, buildEditUserPrompt, buildJDUserPrompt } from '../lib/prompts';

describe('prompts', () => {
  it('returns non-empty system prompts', () => {
    expect(buildEditSystemPrompt().length).toBeGreaterThan(10);
    expect(buildJDSystemPrompt().length).toBeGreaterThan(10);
  });
  it('builds user prompts with resume and schema', () => {
    const resume = { basics: { name: 'A', label: 'B', email: 'a@b.c', phone: '1' }, skills: [], work: [], education: [] } as any;
    const schema = { type: 'object' };
    const u1 = buildEditUserPrompt({ resume, schemaJson: schema, instruction: 'Tighten' });
    expect(u1.includes('Resume JSON')).toBe(true);
    const u2 = buildJDUserPrompt({ resume, schemaJson: schema, jdText: 'JD text' });
    expect(u2.includes('Job Description')).toBe(true);
  });
});


