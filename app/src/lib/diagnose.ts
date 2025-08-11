import type { Resume } from '../types';

export type Diagnosis = {
  strengths: string[];
  gaps: string[];
  quickWins: string[];
};

export function diagnose(resume: Resume, role: 'PM' | 'AI PM' | 'AI Eng' | 'Full-stack'): Diagnosis {
  const strengths: string[] = [];
  const gaps: string[] = [];
  const quickWins: string[] = [];

  const skills = (resume.skills || []).map((s) => s.toLowerCase());
  const bulletCount = (resume.work || []).reduce((n, w) => n + (w.bullets?.length || 0), 0);

  if (bulletCount >= 8) strengths.push('Solid experience coverage');
  if ((resume.summary || '').length > 0) strengths.push('Has a focused summary');

  // Role hints
  if (role === 'AI Eng') {
    const needles = ['python', 'pytorch', 'rag', 'vector', 'faiss'];
    if (needles.some((k) => skills.includes(k))) strengths.push('AI stack keywords present');
    if (!skills.includes('rag')) gaps.push('Add RAG if applicable');
    quickWins.push('Quantify at least 3 bullets with metric + tool');
  } else if (role === 'PM' || role === 'AI PM') {
    if (!skills.includes('a/b testing') && !skills.includes('experiments')) gaps.push('Add experimentation skills');
    quickWins.push('Shorten summary to ≤ 2 lines with focus on outcomes');
  } else if (role === 'Full-stack') {
    if (!skills.includes('typescript')) gaps.push('Surface TypeScript if relevant');
    quickWins.push('Ensure recent project lists stack (Node/React)');
  }

  // Dates
  const datePattern = /^(\d{4}-(0[1-9]|1[0-2])|Present)$/;
  const datesValid = (resume.work || []).every((w) => datePattern.test(w.startDate) && datePattern.test(w.endDate));
  if (!datesValid) gaps.push('Normalize dates to YYYY-MM or Present');

  return { strengths, gaps, quickWins };
}


