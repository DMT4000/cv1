# requirements.md (lite)

## Functional

* Upload: PDF/DOCX/IMG → detect text vs image → OCR if needed → **rawText** produced.
* Structure: rawText → **Resume JSON (v1-min)** (schema-valid) via heuristics or `/ai/struct`.
* Edit (chat): user asks → `/ai/patch` returns **{patch}|{questions}** only → dry-run apply → validate → accept/reject.
* JD tailoring: paste JD → `/ai/patch` returns grounded changes; unsupported claims → **questions**.
* Export: one-column, ATS-safe **PDF**.
* Metrics: `/ai/util kind="jd-coverage"` → `{ used, missing, score }` displayed.

## Non-functional

* Privacy: only OpenAI calls leave device; no PII in logs.
* Determinism: low temp, JSON Schema outputs; same inputs → stable results.
* Performance: OCR ≤ \~2s/page; patch roundtrip ≤ \~6s; PDF export ≤ \~0.5s (1–2 pages).
* Reliability: 2 schema retries; clear errors; locked fields respected by default.

## Guardrails

* No edits to `/work/*/(company|position|startDate|endDate)` unless user unlocks.
* If uncertain → **questions**, never guess.
* After patch, resume must still **validate** against v1-min schema.
* Suggestions include **rationale** + **provenance** (`from_resume|from_jd|from_user`).

## Acceptance (MVP)

* Any supported upload → schema-valid Resume JSON (or guided structuring).
* Conversational edits always return **patch** or **questions** (no free prose).
* JD tailoring never invents facts; asks for missing evidence.
* Exported PDF is clean, one-column, ATS-safe.
* A guided 5-step UI (Upload→Structure→Edit→Tailor→Export) is available; “Run Demo” completes and shows validate: OK, a visible diff after a sample patch, and a clean print preview.

