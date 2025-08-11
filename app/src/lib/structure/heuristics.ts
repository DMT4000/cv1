import type { Resume } from '../../types';
import { normalizeResume } from '../normalize';
import { validateResume } from '../validate';

export type StructureResult = { resume: Resume; flags: string[] };

const SECTION_RE = /(\n|^)\s*(Experience|Work|Projects|Education|Skills|Summary)\s*:?\s*(\n|$)/gi;
const BULLET_SPLIT_RE = /\n\s*[•\-*]|\n\s*\d+\./g;
const DATE_RE = /(\d{4})(?:[-/](\d{2}))?|Present/g;

export function structureHeuristically(rawText: string): StructureResult {
  const flags: string[] = [];
  const text = (rawText || '').replace(/\r/g, '\n');
  const sections = splitBySections(text);

  const resume: Resume = {
    basics: { name: '', label: '', email: '', phone: '', links: [] },
    summary: '',
    skills: [],
    work: [],
    projects: [],
    education: [],
    certs: [],
  } as any;

  // Basics extraction
  const headerZone = getHeaderZone(text);
  let emailMatch = headerZone.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  let phoneMatch = headerZone.match(/\+?\d[\d\-\s().]{6,}\d/);
  let linksMatches = headerZone.match(/(https?:\/\/|linkedin\.com\/in\/|github\.com\/[A-Za-z0-9._-]+)/gi) || [];
  const headingIdx = findFirstHeadingIndex(text);
  const aboveHeading = text.slice(0, headingIdx).split('\n').map((l) => l.trim()).filter(Boolean);
  const name = aboveHeading[0] || '';
  let labelLine = aboveHeading.find((l) => /(Product Manager|AI Product Manager|AI Engineer|Full-stack)/i.test(l)) || '';
  if (!labelLine) {
    const anyRole = text.match(/(Product Manager|AI Product Manager|AI Engineer|Full-stack)/i);
    if (anyRole) labelLine = anyRole[0];
  }
  if (!emailMatch) emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  if (!phoneMatch) phoneMatch = text.match(/\+?\d[\d\-\s().]{6,}\d/);
  if (linksMatches.length === 0) linksMatches = text.match(/(https?:\/\/|linkedin\.com\/in\/|github\.com\/[A-Za-z0-9._-]+)/gi) || [];

  resume.basics.name = name;
  resume.basics.label = labelLine;
  resume.basics.email = emailMatch?.[0] || '';
  resume.basics.phone = phoneMatch?.[0] || '';
  (resume.basics as any).links = Array.from(new Set(linksMatches));

  if (sections.Summary) {
    resume.summary = sections.Summary.trim();
  }

  if (sections.Skills) {
    const skills = sections.Skills
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);
    resume.skills = skills;
  }

  // Work: build only complete items
  if (sections.Experience || sections.Work) {
    const workText = `${sections.Experience || ''}\n${sections.Work || ''}`;
    const jobBlocks = workText.split(/\n\n+/).map((b) => b.trim()).filter(Boolean);
    const items: Resume['work'] = [];
    for (const block of jobBlocks) {
      const bullets = splitBullets(block).slice(0, 8);
      const [startRaw, endRaw] = guessDates(block);
      const startDate = normalizeDate(startRaw);
      const endDate = normalizeDate(endRaw);
      const headerLine = block.split('\n')[0] || '';
      const locMatch = headerLine.match(/\b([A-Z][A-Za-z]+(?:,?\s+[A-Z][A-Za-z]+)*)$/);
      const company = headerLine.split('—')[0]?.trim() || headerLine.split('-')[0]?.trim() || '';
      const position = '';
      const location = locMatch ? locMatch[1] : '';
      if (position && company && location && startDate && endDate && bullets.length >= 1) {
        items.push({ position, company, location, startDate, endDate, bullets });
      }
    }
    resume.work = items || [];
  }

  // Education: build only complete items
  if (sections.Education) {
    const blocks = sections.Education.split(/\n\n+/).map((b) => b.trim()).filter(Boolean);
    const items: Resume['education'] = [];
    for (const b of blocks) {
      const lines = b.split('\n').map((l) => l.trim()).filter(Boolean);
      const institution = lines[0] || '';
      const studyType = '';
      const area = '';
      const [startRaw, endRaw] = guessDates(b);
      const startDate = normalizeDate(startRaw);
      const endDate = normalizeDate(endRaw);
      if (institution && studyType && area && startDate && endDate) {
        items.push({ institution, studyType, area, startDate, endDate } as any);
      }
    }
    resume.education = items || [];
  }

  // Normalize then validate
  const normalized = normalizeResume(resume);
  const valid = validateResume(normalized.resume);
  if (!valid.ok) {
    // Surface normalization flags regardless
    return { resume: normalized.resume, flags: Array.from(new Set([...normalized.flags, 'heuristics_incomplete'])) };
  }
  return { resume: normalized.resume, flags: normalized.flags };
}

function splitBySections(text: string): Record<string, string> {
  const map: Record<string, string> = {};
  const indices: { name: string; index: number }[] = [];
  for (const match of text.matchAll(SECTION_RE)) {
    const name = (match[2] || '').trim();
    if (name) indices.push({ name, index: match.index ?? 0 });
  }
  indices.push({ name: '__END__', index: text.length });
  for (let i = 0; i < indices.length - 1; i++) {
    const cur = indices[i];
    const next = indices[i + 1];
    const chunk = text.slice(cur.index + cur.name.length, next.index);
    map[cur.name] = chunk;
  }
  return map;
}

function splitBullets(text: string): string[] {
  const normalized = text.replace(/\r/g, '\n');
  const parts = normalized.split(BULLET_SPLIT_RE);
  return parts.map((p) => p.trim()).filter(Boolean);
}

function guessDates(text: string): [string | undefined, string | undefined] {
  const matches = [...text.matchAll(DATE_RE)].map((m) => m[0]);
  const unique = Array.from(new Set(matches)).filter(Boolean);
  if (unique.length === 0) return [undefined, undefined];
  const start = unique[0];
  const end = unique[1] || 'Present';
  return [start, end];
}

function normalizeDate(d?: string): string {
  if (!d) return 'Present';
  if (/^(present|current|now)$/i.test(d)) return 'Present';
  // If only year detected, coerce to YYYY-01
  if (/^\d{4}$/.test(d)) return `${d}-01`;
  // If YYYY-MM already
  if (/^\d{4}-(0[1-9]|1[0-2])$/.test(d)) return d;
  // Fallback: try to capture year-month
  const m = d.match(/(\d{4})[-/](\d{2})/);
  if (m) return `${m[1]}-${m[2]}`;
  const y = d.match(/(\d{4})/);
  if (y) return `${y[1]}-01`;
  return 'Present';
}

function getHeaderZone(text: string): string {
  const idx = findFirstHeadingIndex(text);
  return text.slice(0, idx);
}

function findFirstHeadingIndex(text: string): number {
  const m = SECTION_RE.exec(text);
  SECTION_RE.lastIndex = 0; // reset
  return m?.index ?? Math.min(text.length, 2000);
}


