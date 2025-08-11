# design.md — Conversational, Cursor-style Resume App

## 1) Summary (what this is)

A local, browser-run app that:

1. **Ingests any resume** (PDF/DOCX/image) and reconstructs a clean, ATS-safe structure.
2. **Explains** strengths/gaps for target roles (PM, AI PM, AI Eng, Full-stack).
3. **Edits conversationally** like Cursor: the AI returns **patches** (atomic diffs) you accept/reject inline.
4. **Tailors** to JDs with grounded, provenance-tagged changes (asks questions when unsure).
5. **Exports** a clean one-column PDF.

Only the **OpenAI API** call leaves the device (via a tiny **local proxy** using `.env` key). Everything else is local.

---

## 2) Goals & non-goals

### Goals (v1)

* Robust ingest (PDF/DOCX/IMG). OCR fallback.
* Canonical **Resume JSON (v1-min)** as the single source of truth.
* **Conversational, patch-first** editing (accept/reject + “why”).
* JD tailoring that’s **grounded** (no hallucinations).
* ATS-safe **PDF export**.
* Simple **metrics** (used/missing keywords + match score).
* Works fast on normal laptops; no local LLMs.

### Non-goals (v1)

* Fancy themes, multi-column templates, portfolio builder.
* Cloud storage, telemetry, or accounts.
* Job scraping / auto-apply.
* Local model hosting (Ollama, etc.).

---

## 3) High-level flow

```
[Upload resume] → [Detect: text vs image] → [Extract text]
                     │
                     ├─ text PDF → PDF.js text blocks
                     └─ image/low text → render canvas → Tesseract.js OCR

[Raw text] → [Structure]
   ├─ Heuristics (headings/bullets)
   ├─ (Optional) LangExtract microservice (future)
   └─ GPT-5 fallback structuring → Resume JSON (v1-min)
        ↳ Ajv validate + normalize dates

[Diagnose] → strengths, gaps, quick wins (role presets)

[Edit (chat)] ←→ returns PATCH (atomic diffs with rationale/provenance)
   ↳ Dry-run apply → Validate → Diff UI (accept/reject)

[JD Tailor] (paste JD) → returns PATCH or QUESTIONS (no guessing)

[Export PDF] (one-column, ATS-safe)
```

---

## 4) Architecture

### 4.1 Frontend (browser, local-first)

* **React + TypeScript**, single-page app.
* **Workers** for heavy tasks:

  * `pdf-worker` (PDF.js text extraction + canvas rendering for OCR)
  * `ocr-worker` (Tesseract.js)
  * `render-worker` (optional; HTML-to-PDF preflight if needed)
* **State**: a single `resumeJson` (schema-validated), `suggestions`, `history`, `lockedPaths`, `conversationState`.

### 4.2 Local proxy (Node/Express)

* Protects the API key in `.env`.
* Provides 3 endpoints:

  * `POST /ai/patch` → returns `{ patch: Suggestion[] } | { questions: string[] }`
  * `POST /ai/struct` → returns `{ resume: Resume }`
  * `POST /ai/util` → returns small typed JSON (keywords/score, etc.)
* Implements **Responses API** calls with:

  * `response_format: json_schema (strict)`
  * `reasoning.effort: medium` (chat) / `minimal` (utilities)
  * `text.verbosity: low`
  * `previous_response_id` for multi-turn edits
  * Up to **2 schema retries**, then clean error (no prose).

> Optional in a later phase: a **Python microservice** for `langextract` if we decide to keep it, still local-only.

---

## 5) Modules & responsibilities

### 5.1 Ingest & detection

* **File types**: `.pdf`, `.docx`, `.png/.jpg/.webp`.
* **Detect** text vs image for each page:

  * Use **pdfjs-dist** to extract text items.
  * If a page has extremely low text density (or images only), mark for OCR.

**Interfaces**

```ts
type IngestResult = {
  pages: { index: number; mode: "text" | "image"; text?: string }[];
  meta: { pageCount: number; fileType: "pdf"|"docx"|"img"; filename: string };
  flags: string[]; // e.g., ["ocr_used"] later
}
```

**DOCX path**

* Use **mammoth.js** (browser) to extract plain-text.
* Split by headings heuristically (Experience/Projects/Education).

**IMG path**

* Read via `<input type="file">` → HTMLImageElement → canvas → **Tesseract.js** OCR.

### 5.2 OCR (browser)

* **Tesseract.js** with `eng` data by default (allow change later).
* Render PDF pages to canvas (PDF.js) @ \~1.5–2.0 scale → pass bitmap to OCR worker.

**OCR worker message**

```ts
type OcrInput = { imageData: ImageData; lang: "eng" };
type OcrOutput = { text: string; conf: number };
```

### 5.3 Structuring (turn raw text into Resume JSON)

* **Heuristics**: detect sections by simple regex on headings (`Experience|Work|Projects|Education|Skills|Summary`, case-insensitive). Split bullets on `•`, `-`, `*`, numbered patterns.
* **Fallback LLM**: if heuristics yield weak coverage or user clicks “Fix Structure,” call **/ai/struct** with *raw text* + schema → GPT-5 returns **schema-valid Resume JSON** (empty arrays allowed).
* **Validation** with **Ajv**:

  * Dates must match `YYYY-MM` or `Present`.
  * Required arrays exist (`skills`, `work`, `education`).
  * `basics.(name|label|email|phone)` required.
* **Normalization** utility (in UI):

  * Coerce non-conforming dates (keep as strings; if only year is found, use `YYYY-01` and mark a “weak\_dates” flag).
  * Trim strings; dedupe bullets.

**Output**

```ts
type Resume = /* from models-and-prompts.md */;
type StructureResult = { resume: Resume; flags: string[] };
```

> **Note on langextract:** if we later add a local Python helper, it receives raw text → returns entities → UI maps to our schema. Keep the LLM fallback regardless.

### 5.4 Diagnosis (role-aware quick feedback)

* Lightweight client function (no model call needed for MVP) that:

  * Counts quantified bullets per role.
  * Checks if skills overlap with the selected role preset.
  * Flags weak dates / missing education / too long summary.
* Renders a small panel: **Strengths**, **Gaps**, **Quick Wins**.

### 5.5 Conversation engine (Cursor-style)

* Keeps **conversation state** per thread:

```ts
type ConversationState = {
  previousResponseId?: string; // thread id for GPT-5
  mode: "edit" | "jd" | "structuring" | "utility";
  jdText?: string;
  baseVersionId: string;       // hash(resumeJson)
  lockedPaths: string[];       // default: work.*.(company|position|startDate|endDate)
};
```

* **Prompt builder** selects one of the short templates in `models-and-prompts.md`:

  * 5.1 Edit (no JD)
  * 5.2 Tailor (with JD)
  * 5.3 Structuring (raw text → resume)
  * 5.4 Utilities (dates, keywords/score)
* Sends to `/ai/patch` or `/ai/struct` and expects **only**:

  * `{ patch: Suggestion[] }` or `{ questions: string[] }`
* Stores `previous_response_id` from the proxy to **thread** the next turn.

### 5.6 Patch engine

* **JSON Pointer applier** (custom or use a tiny lib):

  * `replace(path, newValue)`
  * `insert(path, newValue)` (append if index==length)
  * `delete(path)`
* **Dry-run apply** the whole patch on a copy:

  * If any op fails (bad path/index), stop and label the remaining as conflicted.
  * Re-validate with Ajv. If invalid, discard and show error.
* **Lock rules**: if a suggestion touches a locked path, mark it “locked” in UI; user must unlock to apply.
* **History**:

  * Maintain `history: Resume[]` for undo/redo (or store diffs if large).
  * Version label per snapshot (e.g., `main@v3`).

### 5.7 JD tailoring

* **Inputs**: `resumeJson`, `jdText`
* **Path**: call `/ai/patch` with tailoring prompt (5.2).
* If JD is very long, pre-summarize it with `/ai/util` (gpt-5-mini) to an ultra-small “requirements list” JSON and **append** it to the prompt.
* **Provenance**: suggestions must set `provenance: "from_jd"`.
* If unsupported claims would be needed → AI must return `questions` asking for evidence.

### 5.8 PDF rendering (ATS-safe)

* **Render** a dedicated print view in React (one column, \~650–700px width).
* **Typography**:

  * Name 20–22pt bold; Label 11pt; Contacts 9pt
  * Section headers 11.5–12pt bold (small caps styling ok)
  * Body/bullets 9.5–10pt, line height \~1.25
* **Layout**:

  * Margins \~0.6–0.7in
  * Bullet symbol “•” with hanging indent (12–16px)
  * Keep header together; avoid widows/orphans (role header + ≥2 bullets together)
* **Export**: `window.print()` with print CSS → user “Save as PDF”

  * File name: `Firstname_Lastname_Role_vX.pdf`
* Optionally support **@react-pdf/renderer** later if we need guaranteed pagination.

---

## 6) Local proxy (API details)

**Stack**: Node 18+, Express, `openai` SDK, `zod` validation, `dotenv`.

### Endpoints

#### `POST /ai/patch`

* **Purpose**: CV Cursor (edit) and JD tailoring calls.
* **Body**:

```json
{
  "mode": "edit" | "jd",
  "resume": { /* Resume JSON */ },
  "schema": { /* Resume v1-min schema (optional server-side cached) */ },
  "instruction": "string",           // for 'edit'
  "jdText": "string",                // for 'jd'
  "previousResponseId": "string"     // optional
}
```

* **Returns**:

```json
{ "patch": [ /* Suggestion[] */ ] , "responseId": "..." }
// or
{ "questions": ["..."], "responseId": "..." }
```

* **Model params**:

  * `model: "gpt-5"`
  * `reasoning.effort: "medium"`
  * `text.verbosity: "low"`
  * `response_format: json_schema(strict)` with PatchEnvelope schema
  * up to 2 `schema` retries

#### `POST /ai/struct`

* **Purpose**: Fallback structuring from raw text → Resume JSON.
* **Body**:

```json
{
  "rawText": "string",
  "schema": { /* Resume v1-min schema (optional server-side cached) */ }
}
```

* **Returns**:

```json
{ "resume": { /* Resume */ } , "responseId": "..." }
```

* **Model params**:

  * `model: "gpt-5"`
  * `reasoning.effort: "medium"`
  * `response_format: json_schema(strict)` with Resume schema

#### `POST /ai/util`

* **Purpose**: deterministic helpers (gpt-5-mini):

  * date normalization **(returns patch)**
  * JD keywords & score **(returns { used, missing, score })**
* **Body**:

```json
{
  "kind": "normalize-dates" | "jd-coverage",
  "resume": { /* Resume */ },
  "jdText": "string"
}
```

* **Returns**:

```json
{ "patch": [ /* Suggestion[] */ ] }              // normalize-dates
// or
{ "used": ["..."], "missing": ["..."], "score": 78 }  // jd-coverage
```

* **Model params**:

  * `model: "gpt-5-mini"`
  * `reasoning.effort: "minimal"`
  * `response_format: json_schema(strict)` matching utility output

---

## 7) State & UI

### 7.1 Top-level state

```ts
type AppState = {
  resume: Resume;
  suggestions: Suggestion[];        // current batch from AI
  accepted: Set<string>;
  rejected: Set<string>;
  lockedPaths: string[];            // default lock rules for company/title/dates
  history: { id: string; resume: Resume }[];
  convo: ConversationState;
  rolePreset: "PM" | "AI PM" | "AI Eng" | "Full-stack";
  flags: string[];                  // e.g., ["ocr_used", "weak_dates"]
  metrics?: { used: string[]; missing: string[]; score: number };
};
```

### 7.2 Key screens/components

* **IngestPane**: file drop, progress, detection info.
* **PreviewPane**: left = current resume, right = proposed changes (diff highlights).
* **ChatPanel**: conversational input; shows **questions** if AI asks for facts.
* **SuggestionsList**: each suggestion with ✓/✗, rationale, provenance.
* **JDPanel**: JD text area; “Tailor” button.
* **DiagnosisPanel**: strengths/gaps/quick wins for selected role.
* **PDFPreview**: print-styled view + Export button.

### 7.3 UX micro-rules

* All AI responses are **patches or questions**—never prose suggestions.
* Accept applies immediately (with undo).
* Batch accept by section.
* Locked field alerts are clear with “Unlock” inline toggle.
* Show short **why** + **provenance** on hover.

### 7.4 UX shell (Stepper + Demo)

A thin wrapper orchestrates existing screens:
- Steps: Upload → Structure → Edit → Tailor → Export.
- Each step surfaces the already-built functions (ingest, heuristics, /ai/struct, normalize+validate, diff editor+locks, JD panel, print preview).
- A status strip shows: rawText length, ocr_used, validate OK/Fail, applied count.
- “Run Demo” triggers a scripted happy path for demos/tests.
- Persist resumeJson/baseVersionId/previousResponseId in localStorage.

---

## 8) Error handling

* **Invalid AI JSON** → proxy retries schema once; if still invalid, return `{error:"schema_invalid"}`; UI shows a gentle error and keeps state unchanged.
* **Patch dry-run fails** (bad path/index) → mark conflicted; suggest “recompute on latest.”
* **Schema invalid after apply** → reject patch and show error (AI should keep atomic).
* **OCR failure** → prompt retry (lower DPI) or “Upload clearer scan.”
* **Network 429/5xx** → exponential backoff; show queued spinner.

---

## 9) Performance

* **Workers** for PDF.js and Tesseract.js to keep UI responsive.
* **Token hygiene**:

  * Send compacted JSON (`JSON.stringify` with no spaces).
  * For repeated turns, pass `previous_response_id` to cut context size.
  * Pre-summarize huge JDs with gpt-5-mini (optional).
* **Targets**:

  * OCR page: ≤ 2s @ typical DPI
  * Edit turn (AI): ≤ 6s average
  * PDF export: ≤ 500ms for 1–2 pages

---

## 10) Security & privacy

* API key lives in `.env` (proxy only).
* No analytics; no external calls except OpenAI.
* No PII in logs; redact email/phone if printed to console (dev mode only).
* Strict CORS to `http://localhost`.

---

## 11) Dependencies

**Frontend**

* React + TypeScript
* `pdfjs-dist` (PDF parsing/rendering)
* `tesseract.js` (OCR)
* `mammoth` (DOCX → text)
* `ajv` (JSON Schema validation)
* `class-variance-authority`/`clsx` (styling helpers, optional)
* `zustand` or Redux Toolkit (state, optional)

**Proxy**

* Node 18+, Express
* `openai` SDK
* `zod` (validate requests)
* `dotenv`, `cors`

**Testing**

* Vitest/Jest + React Testing Library
* Playwright (E2E happy path)

---

## 12) Milestones (ties to `tasks.md`)

1. **Scaffold**: React app + proxy; health checks.
2. **Ingest**: PDF.js text + image detection; DOCX + IMG; OCR worker.
3. **Structure**: heuristics + Ajv; `/ai/struct` fallback; flags.
4. **Editor**: diff view, accept/reject, lock rules, history.
5. **Conversation**: `/ai/patch` wired; previous\_response\_id threading.
6. **JD Tailoring**: JD panel; patch or questions flow.
7. **PDF Export**: print view + CSS; naming.
8. **Metrics**: `/ai/util` JD coverage; panel.
9. **Polish**: diagnosis panel; UX microcopy; keyboard shortcuts.
10. **Hardening**: error states; performance; tests.

---

## 13) Acceptance (Done for v1)

* Any supported upload yields a **valid Resume JSON** (even scans).
* Conversational edits return **patches** or **questions**—no free-form prose.
* Locked fields are respected by default.
* JD tailoring never invents facts; asks when unsure.
* Exported PDF is clean, one-column, and ATS-safe.
* Same inputs/settings → stable results (low temp, schema-enforced).
