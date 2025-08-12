import type { Resume, Suggestion } from '../types';

const BASE = (import.meta as any).env?.VITE_PROXY_URL ?? '';
const MOCK = !BASE;

type PatchEnvelope = { patch: Suggestion[]; responseId?: string } | { questions: string[]; responseId?: string };

async function withBackoff<T>(fn: () => Promise<T>, retries = 3, base = 300): Promise<T> {
  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      return await fn();
    } catch (e: any) {
      const status = e?.status ?? e?.response?.status;
      if (!((status === 429) || (status >= 500)) || attempt >= retries) throw e;
      const jitter = Math.floor(Math.random() * 100);
      const delay = Math.min(2000, base * Math.pow(2, attempt)) + jitter;
      await new Promise((r) => setTimeout(r, delay));
      attempt++;
    }
  }
}

async function post<T>(path: string, body: any): Promise<T> {
  return withBackoff(async () => {
    const url = `${BASE}${path}`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const trace = resp.headers.get('x-trace-id') || '';
    if (trace) localStorage.setItem('lastTraceId', trace);
    if (!resp.ok) {
      const err: any = new Error(`${path}_failed_${resp.status}`);
      (err as any).status = resp.status;
      throw err;
    }
    return (await resp.json()) as T;
  });
}

// Public API
export async function aiStruct(rawText: string): Promise<{ resume: Resume; responseId?: string }>{
  if (MOCK) return mockStruct(rawText);
  return await post('/ai/struct', { rawText });
}

export async function aiPatch(body: {
  mode: 'edit' | 'jd';
  resume: Resume;
  instruction?: string;
  jdText?: string;
  previousResponseId?: string;
}): Promise<PatchEnvelope> {
  if (MOCK) return mockPatch(body);
  return await post('/ai/patch', body);
}

export async function aiUtil(body: { kind: 'jd-coverage'; resume: Resume; jdText: string }): Promise<{
  used: string[];
  missing: string[];
  score: number;
  responseId?: string;
}> {
  if (MOCK) return mockCoverage(body);
  return await post('/ai/util', body);
}

// --------------------
// Mock Mode helpers
// --------------------
function makeSampleResume(): Resume {
  return {
    basics: {
      name: 'Sample User',
      label: 'Software Engineer',
      email: 'sample@example.com',
      phone: '+10000000000',
      location: '',
      links: ['https://example.com'],
    },
    summary: 'Engineer shipping measurable impact in web apps.',
    skills: ['TypeScript', 'React', 'Node.js'],
    work: [
      {
        position: 'Engineer',
        company: 'Acme',
        location: 'Remote',
        startDate: '2022-01',
        endDate: 'Present',
        bullets: [
          'Built internal tools.',
          'Improved reliability.',
        ],
      },
    ],
    projects: [],
    education: [
      {
        institution: 'Uni',
        studyType: 'BS',
        area: 'CS',
        startDate: '2016-09',
        endDate: '2020-06',
      },
    ],
    certs: [],
  };
}

async function mockStruct(_rawText: string): Promise<{ resume: Resume; responseId?: string }>{
  return { resume: makeSampleResume(), responseId: 'mock_struct_1' };
}

function ensureArray<T>(arr: T[] | undefined): T[] { return Array.isArray(arr) ? arr : []; }

function buildDeterministicPatch(resume: Resume, provenance: Suggestion['provenance']): Suggestion[] {
  const skills = ensureArray(resume.skills);
  const firstSkillInsert: Suggestion = {
    id: 'p_insert_skill',
    path: `/skills/${Math.max(0, skills.length)}`,
    kind: 'insert',
    newValue: 'Framer Motion',
    rationale: 'Adds a modern UI skill relevant to the stack.',
    provenance,
    section: 'skills',
    priority: 2,
  } as Suggestion;

  const replaceSummary: Suggestion = {
    id: 'p_replace_summary',
    path: '/summary',
    kind: 'replace',
    oldValue: resume.summary ?? '',
    newValue: 'Engineer delivering + measurable impact; React/TypeScript, perf & DX focus.',
    rationale: 'Tightens summary and surfaces tools.',
    provenance,
    section: 'summary',
    priority: 1,
  } as Suggestion;

  const insertWorkBullet: Suggestion = {
    id: 'p_insert_bullet',
    path: '/work/0/bullets/0',
    kind: 'insert',
    newValue: 'Lifted page render performance 28% via memoization and code-splitting.',
    rationale: 'Adds measurable impact bullet (impact + metric + tool).',
    provenance,
    section: 'work',
    priority: 1,
  } as Suggestion;

  return [replaceSummary, firstSkillInsert, insertWorkBullet];
}

async function mockPatch(body: { mode: 'edit'|'jd'; resume: Resume; instruction?: string; jdText?: string }): Promise<PatchEnvelope> {
  // Always return a deterministic patch for demo
  const provenance: Suggestion['provenance'] = body.mode === 'jd' ? 'from_jd' : (body.instruction ? 'from_user' : 'from_resume');
  const patch = buildDeterministicPatch(body.resume, provenance);
  return { patch, responseId: 'mock_patch_1' };
}

async function mockCoverage(_body: { kind: 'jd-coverage'; resume: Resume; jdText: string }): Promise<{ used: string[]; missing: string[]; score: number; responseId?: string }>{
  const used = ['TypeScript'];
  const missing = ['GraphQL', 'CI/CD'];
  const score = Math.round((used.length / Math.max(1, used.length + missing.length)) * 100);
  return { used, missing, score, responseId: 'mock_util_cov_1' };
}

export const __MOCK__ = { MOCK };


