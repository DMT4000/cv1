import type { Resume } from '../types';

const DATE_RE = /^(\d{4}-(0[1-9]|1[0-2])|Present)$/;

export function normalizeResume(input: Resume): { resume: Resume; flags: string[] } {
  const flags: string[] = [];
  const clone: Resume = JSON.parse(JSON.stringify(input));

  // Map Present variants
  const mapPresent = (s?: string) =>
    typeof s === 'string' && /^(present|current|now)$/i.test(s.trim()) ? 'Present' : s;

  // Trim strings
  const trimString = (s?: string) => (typeof s === 'string' ? s.trim() : s);

  clone.summary = trimString(clone.summary) || '';
  if (clone.basics) {
    clone.basics.name = trimString(clone.basics.name) || '';
    clone.basics.label = trimString(clone.basics.label) || '';
    clone.basics.email = trimString(clone.basics.email) || '';
    clone.basics.phone = trimString(clone.basics.phone) || '';
  }

  clone.skills = Array.from(new Set((clone.skills || []).map((s) => s.trim()).filter(Boolean)));

  for (const w of clone.work || []) {
    w.position = trimString(w.position) || '';
    w.company = trimString(w.company) || '';
    w.location = trimString(w.location) || '';
    w.startDate = mapPresent(w.startDate) as string;
    if (!DATE_RE.test(w.startDate)) {
      w.startDate = coerceDate(w.startDate);
      flags.push('weak_dates');
    }
    w.endDate = mapPresent(w.endDate) as string;
    if (!DATE_RE.test(w.endDate)) {
      w.endDate = coerceDate(w.endDate);
      flags.push('weak_dates');
    }
    w.bullets = dedupeArray(w.bullets || []);
  }

  for (const p of clone.projects || []) {
    p.startDate = mapPresent(p.startDate) as string;
    if (!DATE_RE.test(p.startDate)) p.startDate = coerceDate(p.startDate);
    if (p.endDate) {
      p.endDate = mapPresent(p.endDate) as string;
      if (!DATE_RE.test(p.endDate)) p.endDate = coerceDate(p.endDate);
    }
    p.bullets = dedupeArray(p.bullets || []);
  }

  for (const e of clone.education || []) {
    e.startDate = mapPresent(e.startDate) as string;
    if (!DATE_RE.test(e.startDate)) e.startDate = coerceDate(e.startDate);
    e.endDate = mapPresent(e.endDate) as string;
    if (!DATE_RE.test(e.endDate)) e.endDate = coerceDate(e.endDate);
  }

  return { resume: clone, flags: Array.from(new Set(flags)) };
}

function dedupeArray(arr: string[]): string[] {
  return Array.from(new Set(arr.map((s) => s.trim()).filter(Boolean)));
}

function coerceDate(d: string): string {
  if (d === 'Present') return d;
  const y = d.match(/(\d{4})/);
  const m = d.match(/(?:\d{4})[-/](\d{1,2})/);
  const year = y ? y[1] : '2000';
  let monthNum = m ? Number(m[1]) : 1;
  if (!Number.isFinite(monthNum) || monthNum < 1 || monthNum > 12) monthNum = 1;
  const month = String(monthNum).padStart(2, '0');
  return `${year}-${month}`;
}


