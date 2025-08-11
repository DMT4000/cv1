import { structureHeuristically } from '../src/lib/structure/heuristics';
import { normalizeResume } from '../src/lib/normalize';
import { validateResume } from '../src/lib/validate';
import { applyPatchSequence } from '../src/lib/patch';
import type { Suggestion } from '../src/types';

async function main() {
  // Simulate using sample clean.pdf → extracted text (no OCR)
  const rawText = `John Doe\nAI Engineer\njohn@example.com | +1 555 111 2222 | https://github.com/john\n\nSummary\nFull-stack engineer.\n\nSkills\nTypeScript, React, Node\n\nExperience\nAcme Corp — Senior Engineer — San Francisco\n2019-01 to Present\n• Shipped features\n• Improved reliability\n\nEducation\nState University\nBSc Computer Science\n2015 - 2019`;
  const rawTextLen = rawText.length;
  const ocr_used = false;

  // Heuristics → Normalize → Validate
  const heur = structureHeuristically(rawText);
  const norm = normalizeResume(heur.resume);
  const valid = validateResume(norm.resume);

  // Apply Sample Patch (replace + insert)
  const patch: Suggestion[] = [
    {
      id: 'p1',
      path: '/summary',
      kind: 'replace',
      oldValue: norm.resume.summary ?? '',
      newValue: 'Concise AI-focused summary',
      rationale: 'Tighten summary',
      provenance: 'from_user',
    },
    {
      id: 'p2',
      path: '/skills/0',
      kind: 'insert',
      newValue: 'TypeScript',
      rationale: 'Add key skill',
      provenance: 'from_user',
    },
  ];
  const appliedRes = applyPatchSequence(norm.resume, patch);
  const appliedCount = appliedRes.ok ? patch.length : 0;

  const summary = {
    rawTextLen,
    ocr_used,
    validate: valid.ok ? 'OK' : 'Fail',
    appliedCount,
  };
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


