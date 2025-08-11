import { describe, it, expect, beforeAll } from 'vitest';
import { validateResume } from '../lib/validate';

const base = 'http://localhost:3001';

describe('Contract: proxy endpoints', () => {
  let isProxyUp = false;
  beforeAll(async () => {
    try {
      const res = await fetch(`${base}/health`, { method: 'POST' });
      isProxyUp = res.ok;
    } catch {
      isProxyUp = false;
    }
  });

  it('/ai/struct returns schema-valid resume (mock)', async () => {
    if (!isProxyUp) return; // skip when proxy not running
    const resp = await fetch(`${base}/ai/struct`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawText: 'John Doe, SE. Skills: TS' }),
    });
    expect(resp.ok).toBe(true);
    const json = await resp.json();
    expect(json.resume).toBeTruthy();
    const v = validateResume(json.resume);
    expect(v.ok).toBe(true);
  });

  it('/ai/patch enforces envelope shape (mock)', async () => {
    if (!isProxyUp) return; // skip when proxy not running
    const minimal = {
      basics: { name: 'A', label: 'B', email: 'a@b.c', phone: '123' },
      skills: [],
      work: [],
      education: [],
    };
    const resp = await fetch(`${base}/ai/patch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'edit', resume: minimal }),
    });
    expect(resp.ok).toBe(true);
    const json = await resp.json();
    const keys = Object.keys(json);
    // Must be either { patch } or { questions }
    expect(keys.includes('patch') || keys.includes('questions')).toBe(true);
  });
});


