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
};

const emptyResume: Resume = {
  basics: { name: 'Sample User', label: 'Engineer', email: 'sample@example.com', phone: '+10000000000' },
  skills: ['TypeScript'],
  work: [],
  education: [],
};

export const useAppState = create<AppState>((set) => ({
  resume: emptyResume,
  suggestions: [],
  accepted: new Set(),
  rejected: new Set(),
  lockedPaths: [],
  unlockedPaths: [],
  history: [],
  convo: { mode: 'edit', baseVersionId: 'v0', lockedPaths: [] },
  rolePreset: 'AI Eng',
  flags: [],
  setResume: (r) => set({ resume: r }),
}));


