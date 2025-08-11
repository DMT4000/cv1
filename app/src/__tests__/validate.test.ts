import { describe, it, expect } from 'vitest';
import { validateResume } from '../lib/validate';

describe('validateResume', () => {
  it('accepts minimal valid resume', () => {
    const resume = {
      basics: { name: 'A', label: 'B', email: 'a@b.c', phone: '123' },
      skills: [],
      work: [],
      education: [],
    };
    const res = validateResume(resume);
    expect(res.ok).toBe(true);
  });

  it('rejects invalid date', () => {
    const resume = {
      basics: { name: 'A', label: 'B', email: 'a@b.c', phone: '123' },
      skills: [],
      work: [
        { position: 'P', company: 'C', location: 'L', startDate: '2020-13', endDate: 'Present', bullets: [] },
      ],
      education: [],
    };
    const res = validateResume(resume);
    expect(res.ok).toBe(false);
  });
});


