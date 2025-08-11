import type { Resume } from '../../types';

export async function structViaProxy(rawText: string): Promise<{ resume: Resume; responseId?: string }>{
  const resp = await fetch('http://localhost:3001/ai/struct', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rawText }),
  });
  if (!resp.ok) throw new Error('struct_failed');
  const json = await resp.json();
  return { resume: json.resume, responseId: json.responseId };
}


