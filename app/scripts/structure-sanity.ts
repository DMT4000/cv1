import { structureHeuristically } from '../src/lib/structure/heuristics';
import { normalizeResume } from '../src/lib/normalize';
import { validateResume } from '../src/lib/validate';
import { structViaProxy } from '../src/lib/structure/fallback';

async function main() {
  const rawText = `John Doe\nAI Engineer\njohn@example.com | +1 555 111 2222 | https://github.com/john\n\nSummary\nFull-stack engineer.\n\nSkills\nTypeScript, React, Node\n\nExperience\nAcme Corp — Senior Engineer — San Francisco\n2019-01 to Present\n• Shipped features\n• Improved reliability\n\nEducation\nState University\nBSc Computer Science\n2015 - 2019`;

  // 1) Heuristics
  const heuristic = structureHeuristically(rawText);
  const v1 = validateResume(heuristic.resume);
  console.log('heuristics.valid', v1.ok);

  // 2) Fallback via proxy
  const fallback = await structViaProxy(rawText);
  const v2 = validateResume(fallback.resume);
  console.log('fallback.valid', v2.ok);

  // 3) Normalize & flags
  const normalized = normalizeResume(heuristic.resume);
  const allDatesValid = checkDates(normalized.resume);
  console.log('normalized.dates_valid', allDatesValid);
  console.log('normalized.flags', normalized.flags);
}

function checkDates(resume: any): boolean {
  const re = /^(\d{4}-(0[1-9]|1[0-2])|Present)$/;
  const dates: string[] = [];
  for (const w of resume.work || []) {
    dates.push(w.startDate, w.endDate);
  }
  for (const p of resume.projects || []) {
    if (p.startDate) dates.push(p.startDate);
    if (p.endDate) dates.push(p.endDate);
  }
  for (const e of resume.education || []) {
    dates.push(e.startDate, e.endDate);
  }
  return dates.every((d) => re.test(d));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


