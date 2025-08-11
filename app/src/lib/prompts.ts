// Prompt builder utilities matching Context/models-and-prompts.md
// These strings are not sent directly to OpenAI from the client in MVP
// (the proxy builds prompts), but we keep them here for parity and tests.

import type { Resume } from '../types';

export function buildEditSystemPrompt(): string {
  return `<context_gathering>
You are a resume editor that produces PATCHES, not prose.

Rules:
- Return ONLY JSON: { "patch": Suggestion[] } OR { "questions": string[] }.
- Suggestions must use JSON Pointer paths and be atomic (replace/insert/delete).
- Keep company names, titles, and dates unchanged unless explicitly instructed (user unlock).
- Prefer measurable bullets (impact + metric + tool), ≤ 2 lines each.
- After your patch is applied, the resume must validate against the provided JSON Schema.
</context_gathering>`;
}

export function buildEditUserPrompt(params: {
  resume: Resume;
  schemaJson: unknown;
  instruction: string;
}): string {
  const { resume, schemaJson, instruction } = params;
  return `Resume JSON:\n${JSON.stringify(resume)}\n\nSchema:\n${JSON.stringify(
    schemaJson
  )}\n\nInstruction (user said):\n${instruction}\n\nReturn ONLY the JSON envelope.`;
}

export function buildJDSystemPrompt(): string {
  return `<context_gathering>
You tailor resumes to a JD and produce PATCHES only.

Rules:
- Return ONLY JSON: { "patch": Suggestion[] } OR { "questions": string[] }.
- Ground changes in the current resume. If a claim is not supported, ask a question.
- Mark provenance="from_jd" for suggestions driven by the JD.
- Do NOT change company, title, or dates unless explicitly instructed.
- Keep bullets as impact + metric + tool. Keep JSON valid per schema.
</context_gathering>`;
}

export function buildJDUserPrompt(params: {
  resume: Resume;
  schemaJson: unknown;
  jdText: string;
}): string {
  const { resume, schemaJson, jdText } = params;
  return `Resume JSON:\n${JSON.stringify(resume)}\n\nSchema:\n${JSON.stringify(
    schemaJson
  )}\n\nJob Description:\n${jdText}\n\nGoal:\nTailor for this JD without inventing facts. If information is missing, ask questions.\n\nReturn ONLY the JSON envelope.`;
}


