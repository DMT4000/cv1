import { create } from 'zustand';
import type { Resume, Suggestion } from '../types';

export type AppState = {
  resume: Resume;
  suggestions: Suggestion[];
  accepted: Set<string>;
  rejected: Set<string>;
  lockedPaths: string[];
  unlockedPaths: string[];
  history: { id: string; resume: Resume }[];
  future: { id: string; resume: Resume }[];
  convo: {
    previousResponseId?: string;
    mode: 'edit' | 'jd' | 'structuring' | 'utility';
    jdText?: string;
    baseVersionId: string;
    lockedPaths: string[];
  };
  rolePreset: 'PM' | 'AI PM' | 'AI Eng' | 'Full-stack';
  flags: string[];
  metrics?: { used: string[]; missing: string[]; score: number };
  setResume: (r: Resume) => void;
  setSuggestions: (s: Suggestion[]) => void;
  undo: () => void;
  redo: () => void;
};

const emptyResume: Resume = {
  basics: { name: 'Sample User', label: 'Engineer', email: 'sample@example.com', phone: '+10000000000' },
  skills: ['TypeScript'],
  work: [],
  education: [],
};

const savedRaw = localStorage.getItem('appState');
let saved: any = {};
try { saved = savedRaw ? JSON.parse(savedRaw) : {}; } catch { saved = {}; }

export const useAppState = create<AppState>((set) => ({
  resume: (saved.resume as Resume) || emptyResume,
  suggestions: [],
  accepted: new Set(),
  rejected: new Set(),
  lockedPaths: ['/work/*/company', '/work/*/position', '/work/*/startDate', '/work/*/endDate'],
  unlockedPaths: saved.unlockedPaths || [],
  history: (saved.history as any) || [],
  future: (saved.future as any) || [],
  convo: { mode: 'edit', baseVersionId: 'v0', lockedPaths: [], previousResponseId: saved.previousResponseId },
  rolePreset: 'AI Eng',
  flags: [],
  setResume: (r) => set((s) => {
    const nextHistory = [...s.history, { id: `v${s.history.length + 1}`, resume: s.resume }];
    const persisted = { resumeJson: r, history: nextHistory, future: [] };
    localStorage.setItem('resumeJson', JSON.stringify(persisted.resumeJson));
    localStorage.setItem('history', JSON.stringify(persisted.history));
    localStorage.setItem('future', JSON.stringify(persisted.future));
    return { resume: r, history: nextHistory, future: [] };
  }),
  setSuggestions: (sugs) => set({ suggestions: sugs }),
  undo: () => set((s) => {
    if (s.history.length === 0) return s as any;
    const prev = s.history[s.history.length - 1];
    const rest = s.history.slice(0, -1);
    const fut = [{ id: `v${(s.history.length)}`, resume: s.resume }, ...s.future];
    localStorage.setItem('resumeJson', JSON.stringify(prev.resume));
    localStorage.setItem('history', JSON.stringify(rest));
    localStorage.setItem('future', JSON.stringify(fut));
    const appliedCount = Math.max(0, Number(localStorage.getItem('appliedCount') || '0') - 1);
    localStorage.setItem('appliedCount', String(appliedCount));
    return { resume: prev.resume, history: rest, future: fut } as any;
  }),
  redo: () => set((s) => {
    if (s.future.length === 0) return s as any;
    const [next, ...rest] = s.future;
    const hist = [...s.history, { id: `v${s.history.length + 1}`, resume: s.resume }];
    localStorage.setItem('resumeJson', JSON.stringify(next.resume));
    localStorage.setItem('history', JSON.stringify(hist));
    localStorage.setItem('future', JSON.stringify(rest));
    const appliedCount = Number(localStorage.getItem('appliedCount') || '0') + 1;
    localStorage.setItem('appliedCount', String(appliedCount));
    return { resume: next.resume, history: hist, future: rest } as any;
  }),
}));

// Persist combined appState on any change for Export/Import hydration
useAppState.subscribe((s) => {
  const appliedCount = Number(localStorage.getItem('appliedCount') || '0');
  const rawTextLen = Number(localStorage.getItem('rawTextLen') || '0');
  const ocr_used = localStorage.getItem('ocr_used') === 'true';
  const validateOk = localStorage.getItem('validateOk') === 'true';
  const previousResponseId = s.convo.previousResponseId;
  const snapshot = {
    resume: s.resume,
    history: s.history,
    future: s.future,
    unlockedPaths: s.unlockedPaths,
    appliedCount,
    previousResponseId,
    rawTextLen,
    ocr_used,
    validateOk,
  };
  localStorage.setItem('appState', JSON.stringify(snapshot));
});


