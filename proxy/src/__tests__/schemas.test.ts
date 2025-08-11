import { describe, it, expect } from 'vitest';
import { ResumeSchema } from '../schemas/resume.js';
import { PatchEnvelopeSchema } from '../schemas/patch.js';

describe('schemas', () => {
  it('parses a minimal valid resume', () => {
    const resume = {
      basics: { name: 'A', label: 'B', email: 'a@b.c', phone: '123' },
      skills: [],
      work: [],
      education: [],
    };
    const parsed = ResumeSchema.safeParse(resume);
    expect(parsed.success).toBe(true);
  });

  it('rejects invalid date', () => {
    const resume = {
      basics: { name: 'A', label: 'B', email: 'a@b.c', phone: '123' },
      skills: [],
      work: [
        {
          position: 'Dev',
          company: 'X',
          location: 'Y',
          startDate: '2020-13',
          endDate: '2021-01',
          bullets: [],
        },
      ],
      education: [],
    };
    const parsed = ResumeSchema.safeParse(resume);
    expect(parsed.success).toBe(false);
  });

  it('accepts patch envelope and questions', () => {
    const patchEnv = { patch: [] };
    const qEnv = { questions: ['Need metric for impact'] };
    expect(PatchEnvelopeSchema.safeParse(patchEnv).success).toBe(true);
    expect(PatchEnvelopeSchema.safeParse(qEnv).success).toBe(true);
  });
});


