# tasks.md — Build Plan (Cursor-style, AI-friendly)

This is the step-by-step backlog the AI should follow. Each task has: goal, files, implementation notes, and **acceptance criteria**. Work top-to-bottom. Push code that compiles at the end of each task.

---

## 0) Project scaffold (done)

### T0.1 – Repo & tooling (done)

**Goal:** Create monorepo-like structure with web app + local proxy.
**Files/dirs:**

```
/app/                  # React + TS
  /public
  /src
  package.json
/proxy/                # Node + Express
  src/
  package.json
.env.example
README.md
```

**Notes:**

* Node ≥ 18.
* Yarn or pnpm; pick one and stick to it.
* Add root `.gitignore`, `.editorconfig`, and basic ESLint/Prettier configs.

**Acceptance:**

* `pnpm i && pnpm -r run dev` starts both app and proxy (concurrently).
* `README.md` explains how to run.

---

## 1) Local proxy (OpenAI API wrapper) (done)

### T1.1 – Proxy bootstrap (done)

**Goal:** Minimal Express server with healthcheck.
**Files:**

```
/proxy/src/server.ts
/proxy/src/routes/health.ts
/proxy/package.json (scripts: dev, build, start)
```

**Notes:** Use `dotenv`, `cors`, `zod`.

**Acceptance:**

* `POST /health` returns `{ ok: true }`.

### T1.2 – OpenAI client & env (done)

**Goal:** Wire OpenAI SDK and env.
**Files:**

```
/proxy/src/lib/openai.ts
/.env.example
```

**Notes:**

* `.env.example` includes `OPENAI_API_KEY`, `OPENAI_MODEL=gpt-5`, `OPENAI_MINI=gpt-5-mini`.
* `openai.ts` exports a factory with sane defaults (reasoning.effort, text.verbosity).

**Acceptance:**

* Proxy boots with missing key → clear error; with key → OK.

### T1.3 – Schemas (zod) for requests & responses (done)

**Goal:** Define PatchEnvelope and Resume schemas for proxy validation.
**Files:**

```
/proxy/src/schemas/patch.ts
/proxy/src/schemas/resume.ts
```

**Notes:**

* Mirror **models-and-prompts.md** (Resume v1-min + PatchEnvelope).
* Export both Zod and JSON Schema (for Responses API `response_format`).

**Acceptance:**

* Unit test: parsing valid and invalid payloads.

### T1.4 – /ai/patch endpoint (done)

**Goal:** Implement `POST /ai/patch` (edit + JD tailoring).
**Files:**

```
/proxy/src/routes/ai.patch.ts
```

**Notes:**

* Request body: `{ mode: "edit"|"jd", resume, schema?, instruction?, jdText?, previousResponseId? }`
* Build prompt from **models-and-prompts.md** (5.1 or 5.2).
* Call `client.responses.create({ model:"gpt-5", reasoning:{effort:"medium"}, text:{verbosity:"low"}, response_format:{type:"json_schema", json_schema:PatchEnvelopeSchema}, input: PROMPT, previous_response_id })`
* Retry **2x** on schema violation. Return `{ patch }` **or** `{ questions }` + `responseId`.

**Acceptance:**

* With mocked OpenAI, returns a valid envelope (patch or questions).
* Logs redact PII (email/phone).

### T1.5 – /ai/struct endpoint (done)

**Goal:** Implement fallback structuring (raw text → Resume JSON).
**Files:**

```
/proxy/src/routes/ai.struct.ts
```

**Notes:**

* Body: `{ rawText, schema? }`
* Use prompt 5.3. Return `{ resume, responseId }`.

**Acceptance:**

* With mocked OpenAI, returns a schema-valid resume.

### T1.6 – /ai/util endpoint (done)

**Goal:** Deterministic helpers (gpt-5-mini).
**Files:**

```
/proxy/src/routes/ai.util.ts
```

**Notes:**

* Body: `{ kind: "normalize-dates"|"jd-coverage", resume, jdText? }`
* Use prompts 5.4. Return `{ patch }` or `{ used, missing, score }`.

**Acceptance:**

* Returns correct envelope shape per `kind`.

---

## 2) Frontend: scaffold & state (done)

### T2.1 – React app bootstrap (done)

**Goal:** Vite + React + TS + Tailwind.
**Files:**

```
/app/src/main.tsx
/app/src/App.tsx
/app/index.html
/app/tailwind.config.ts
/app/postcss.config.cjs
```

**Acceptance:**

* App renders “Hello CV Cursor”.

### T2.2 – Types & schema validation (Ajv) (done)

**Goal:** Define `Resume`, `Suggestion`, and Ajv validator.
**Files:**

```
/app/src/types/index.ts
/app/src/lib/schema.ts
/app/src/lib/validate.ts
```

**Notes:**

* Import JSON Schema from `/proxy/src/schemas/resume.ts` (copy into app or embed).
* `validateResume(resume): { ok: boolean; errors?: string[] }`

**Acceptance:**

* Unit test with valid/invalid resumes.

### T2.3 – Global state store (done)

**Goal:** Centralize app data.
**Files:**

```
/app/src/store/appState.ts
```

**State:**

```ts
resume: Resume;
suggestions: Suggestion[];
accepted: Set<string>;
rejected: Set<string>;
lockedPaths: string[];
history: { id: string; resume: Resume }[];
convo: { previousResponseId?: string; mode: "edit"|"jd"|"structuring"|"utility"; jdText?: string; baseVersionId: string; lockedPaths: string[] };
rolePreset: "PM"|"AI PM"|"AI Eng"|"Full-stack";
flags: string[];
metrics?: { used: string[]; missing: string[]; score: number };
```

**Acceptance:**

* Store compiles; devtools show state updates.

---

## 3) Ingest & extraction (browser) (done)

### T3.1 – File drop & detection (done)

**Goal:** Drag-and-drop upload; detect PDF/DOCX/IMG.
**Files:**

```
/app/src/components/IngestPane.tsx
/app/src/lib/ingest.ts
```

**Acceptance:**

* Upload returns `{ meta, pages: [] }` stub.

### T3.2 – PDF text vs image detection (pdfjs-dist) (done)

**Goal:** Extract text per page; detect low-text pages.
**Files:**

```
/app/src/workers/pdf.worker.ts
/app/src/lib/pdf.ts (wrapper for worker)
```

**Heuristic:** if page text items < N or text density < threshold → mark `mode:"image"`.
**Acceptance:**

* For text PDFs, most pages `mode:"text"` with extracted text.

### T3.3 – DOCX & IMG paths (done)

**Goal:** DOCX text via `mammoth`, images via `<canvas>`.
**Files:**

```
/app/src/lib/docx.ts
/app/src/lib/image.ts
```

**Acceptance:**

* DOCX yields non-empty text.
* Image loads to canvas and returns bitmap.

### T3.4 – OCR worker (Tesseract.js) (done)

**Goal:** OCR for `mode:"image"` pages.
**Files:**

```
/app/src/workers/ocr.worker.ts
/app/src/lib/ocr.ts
```

**Acceptance:**

* OCR returns `{ text, conf }` per page.
* “OCR used” flag is set when any page OCRs.

### T3.5 – Raw text assembly (done)

**Goal:** Combine page texts with page separators.
**Files:**

```
/app/src/lib/text.ts
```

**Acceptance:**

* Returns a single `rawText` string.

---

## 4) Structuring (raw text → Resume JSON) (done)

### T4.1 – Heuristic structurer (done)

**Goal:** Basic section detection and mapping.
**Files:**

```
/app/src/lib/structure/heuristics.ts
```

**Notes:** Regex headings (`Experience|Work|Projects|Education|Skills|Summary`). Split bullets by `•|-|*|^\d+\.`. Create minimal `Resume` with empty arrays allowed.

**Acceptance:**

* Produces a schema-valid Resume for easy PDFs; sets `flags` for weak dates.

### T4.2 – LLM fallback structurer (done)

**Goal:** Call `/ai/struct` when heuristics are weak or user clicks “Fix Structure”.
**Files:**

```
/app/src/lib/structure/fallback.ts
```

**Acceptance:**

* Returns schema-valid Resume from raw text (with empty arrays allowed).

### T4.3 – Normalization & flags (done)

**Goal:** Normalize dates, trim strings, dedupe bullets.
**Files:**

```
/app/src/lib/normalize.ts
```

**Acceptance:**

* After normalization, `validateResume` passes; “weak\_dates” flagged when year-only.

---

## 5) Editor (diff, accept/reject) (done)

### T5.1 – Patch applier (JSON Pointer) (done)

**Goal:** Implement `replace/insert/delete`.
**Files:**

```
/app/src/lib/patch.ts
```

**Acceptance:**

* Unit tests: apply sequences of ops; detect out-of-range paths.

### T5.2 – Diff view (done)

**Goal:** Side-by-side panes (Current vs Proposed) with highlights.
**Files:**

```
/app/src/components/PreviewPane.tsx
/app/src/components/SuggestionItem.tsx
```

**Acceptance:**

* Shows proposed changes with ✓ / ✗ per suggestion; hover shows rationale + provenance.

### T5.3 – Accept/reject logic (done)

**Goal:** Apply accepted patches (dry-run → validate → commit).
**Files:**

```
/app/src/lib/applyPatch.ts
```

**Acceptance:**

* Accept applies change, updates history; reject leaves state; undo works.

### T5.4 – Lock rules UI (done)

**Goal:** Prevent edits to company/title/dates unless unlocked.
**Files:**

```
/app/src/components/LockBadge.tsx
```

**Acceptance:**

* Locked suggestions show warning; “Unlock” toggle enables apply.
### T5.5 – UX Shell (Stepper + Demo) (done)

**Goal:** Wrap the existing pieces into a single, clickable 5-step flow so I can test the product **in the browser** without terminals.

**Files**

```
/app/src/routes/Stepper.tsx
/app/src/pages/Upload.tsx
/app/src/pages/Structure.tsx
/app/src/pages/Edit.tsx
/app/src/pages/Tailor.tsx
/app/src/pages/Export.tsx
/app/public/fixtures/clean.pdf
/app/public/fixtures/scan.png
/app/public/fixtures/jd_pm.txt
/app/public/fixtures/jd_ai_eng.txt
```

**Requirements**

* **Top stepper:** 1) Upload → 2) Structure → 3) Edit → 4) Tailor → 5) Export
* **Reuse existing logic/components** (do not rewrite):

  * Upload page uses **IngestPane** (drag/drop) and adds **“Use sample clean.pdf / scan.png”** buttons (served from `/app/public/fixtures`).
  * Structure page shows three buttons: **Heuristics**, **Fallback (/ai/struct)**, **Normalize & Validate**.
  * Edit page shows the **two-pane diff**, **accept/reject**, **locks**; add an **“Apply Sample Patch”** button that loads a canned, schema-valid `{patch}` using JSON Pointers (1 replace, 1 insert, 1 delete) and runs the existing `applyWithValidation`.
  * Tailor page shows a JD textarea plus **“Use sample jd\_pm.txt / jd\_ai\_eng.txt”** buttons. **Run Tailoring** button can be present but **disabled** until Task 7.
  * Export page shows the **print preview** and an **Export PDF** button using `window.print()`.
* **Status strip (always visible; top-right or footer):**

  * `rawText: <len>` • `ocr_used: <true|false>` • `validate: <OK|Fail>` • `applied: <N>`
* **Persistence:** save and load from `localStorage`:

  * `resumeJson`, `baseVersionId` (hash), `previousResponseId`
* **Mock banner:** if the app detects no OpenAI key / mock mode, show a small **“Mock Mode”** ribbon; keep non-AI actions usable.
* **Keyboard shortcuts:** in Edit step, **Enter = accept**, **Esc = reject** on the selected suggestion.

**Acceptance**

* Visiting `http://localhost:5173/` shows the stepper.
* Clicking **Use sample clean.pdf** → **Heuristics** → **Normalize & Validate** sets `validate: OK` in the status strip.
* On **Edit**, clicking **Apply Sample Patch** updates the diff; locked field edits are blocked until unlocked.
* On **Export**, clicking **Export PDF** opens the browser print dialog; text is selectable in the preview.
* Refreshing the page keeps the current resume and step (localStorage working).

---

## 6) Conversation (AI wiring) (done)

### T6.1 – Prompt builder

**Goal:** Build prompts from **models-and-prompts.md**.
**Files:**

```
/app/src/lib/prompts.ts
```

**Acceptance:**

* Returns correct System+User strings for modes “edit” and “jd”.

### T6.2 – Chat panel & thread state

**Goal:** Chat UI with `previousResponseId` threading.
**Files:**

```
/app/src/components/ChatPanel.tsx
/app/src/lib/chat.ts
```

**Flow:** send `{ resume, instruction }` or `{ resume, jdText }` to `/ai/patch`; store `responseId` → `convo.previousResponseId`.

**Acceptance:**

* Multi-turn: follow-up edits keep context consistent (shorter, faster responses).

### T6.3 – Questions flow

**Goal:** Render `questions[]` and let user answer inline.
**Files:**

```
/app/src/components/Questions.tsx
```

**Acceptance:**

* User answers feed new instruction back; next call returns a patch grounded by answers.

---

## 7) JD tailoring (done)

### T7.1 – JD panel

**Goal:** Textarea/drop zone for JD.
**Files:**

```
/app/src/components/JDPanel.tsx
```

**Acceptance:**

* Paste or upload JD; “Tailor” triggers `/ai/patch` with tailoring prompt.

### T7.2 – Optional: pre-summary (mini model)

**Goal:** For very long JDs, summarize to a tiny requirements list with `/ai/util`.
**Acceptance:**

* When JD > N chars, call util; append result to prompt; tailoring still returns patch/questions.

---

## 8) PDF export (done)

### T8.1 – Print view

**Goal:** Dedicated print page matching design spec.
**Files:**

```
/app/src/components/PDFPreview.tsx
/app/src/styles/print.css
```

**Acceptance:**

* “Export PDF” opens system dialog; output looks as specified (one column, correct typography).

---

## 9) Metrics & diagnosis (done)

### T9.1 – JD coverage util

**Goal:** Call `/ai/util kind="jd-coverage"` and display used/missing/score.
**Files:**

```
/app/src/components/MetricsPanel.tsx
```

**Acceptance:**

* Metrics panel updates after tailoring; simple, readable.

### T9.2 – Diagnosis panel (client heuristic)

**Goal:** Show strengths/gaps/quick wins based on role preset.
**Files:**

```
/app/src/components/DiagnosisPanel.tsx
/app/src/lib/diagnose.ts
```

**Acceptance:**

* Reasonable suggestions (e.g., “Add metrics to current role”, “Reduce summary length”).

---

## 10) Polish & hardening

### T10.1 – Keyboard shortcuts & accessibility

**Goal:** Keyboard-first accept/reject; aria landmarks; focus states.
**Acceptance:**

* Tab through suggestions; Enter=accept, Esc=reject (or similar mapping).

### T10.2 – Error surfaces

**Goal:** Friendly, actionable errors with retry buttons.
**Acceptance:**

* Simulate schema violation → clear toast + “Retry” works.

### T10.3 – Performance passes

**Goal:** Workers working; no main-thread jank.
**Acceptance:**

* OCR/PDF extraction doesn’t freeze UI; typical edit turn ≤ \~6s.

---

## 11) Testing

### T11.1 – Unit tests

* Patch applier (all ops)
* Validator (Ajv)
* Normalizer (dates, trimming)
* Prompt builder (returns correct templates)

### T11.2 – Integration tests

* Ingest → Structure → Validate (PDF + image)
* Chat edit flow (mocked proxy)
* JD tailoring flow (questions → patch)

### T11.3 – E2E (Playwright)

* Upload sample resume (clean + scanned)
* Accept patches
* Tailor to JD (with a missing claim → question → user answer → patch)
* Export PDF

**Acceptance:** CI green, basic coverage.

---

## 12) Deliverables checklist (MVP “done”) (done)

* [x] Any supported upload produces a schema-valid **Resume JSON** (or a guided path to fix).
* [x] Conversational edits return **patches** or **questions** only.
* [x] Locked fields respected by default.
* [x] JD tailoring asks for facts when missing; never invents.
* [x] Exported PDF is one-column, ATS-safe.
* [x] Same inputs/settings → stable results.

---

## 13) Post-MVP (parking lot, not for now)

* Memory Vault (local fact store + provenance)
* Version branches & snapshots
* Theming / multiple templates
* LangExtract (local Python helper) as a first-pass structurer
* Cover-letter generator (cited to resume lines)

---

### Runbook (for humans & AI)

* Dev:

  * `pnpm -r dev` → start app and proxy
  * Add `OPENAI_API_KEY` in `.env`
* Build:

  * `pnpm -r build` → build app & proxy
* Test:

  * `pnpm -r test`
