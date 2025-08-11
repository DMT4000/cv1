import { describe, it, expect } from 'vitest';
import { normalizeResume } from '../lib/normalize';

describe('normalizeResume', () => {
  it('coerces dates and trims strings', () => {
    const { resume, flags } = normalizeResume({
      basics: { name: ' A ', label: ' B ', email: 'a@b.c', phone: '1' },
      skills: [' A ', 'A'],
      work: [
        { position: ' p ', company: ' c ', location: ' l ', startDate: '2020-13', endDate: 'present', bullets: [' x ', 'x'] },
      ],
      education: [],
    } as any);
    expect(resume.basics.name).toBe('A');
    expect(resume.work[0].startDate).toMatch(/^\d{4}-(0[1-9]|1[0-2])$/);
    expect(resume.work[0].endDate).toBe('Present');
    expect(flags.includes('weak_dates')).toBe(true);
    expect(resume.skills).toEqual(['A']);
  });
});


