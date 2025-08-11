# models-and-prompts.md (conversational, cursor-style, detailed)

Single source of truth for **data shapes**, the **AI contract**, and the **prompts** your conversational, Cursor-style app will use. This file is written for both humans and the AI that will implement the app.

---

## 0) Philosophy (how the AI should “feel”)

* **Cursor-style, patch-first.** The AI never dumps prose. It proposes small, safe, **patches** you can accept/reject inline.
* **Truth-first.** If the AI isn’t sure, it **asks questions**. It never invents employers, titles, dates, or metrics.
* **Deterministic.** Low verbosity, JSON Schema outputs, repeatable for the same inputs.
* **Conversational.** The user can say “tighten that bullet” or “make this fit the JD,” and the AI replies with atomic changes and a short *why* for each.

---

## 1) Runtime params (GPT-5 defaults)

Use the **Responses API** with **JSON Schema** outputs. Thread multi-turn edits via `previous_response_id` so the model reuses its reasoning.

**Defaults**

* `model`: `"gpt-5"` (conversation / patch generation)
* `model`: `"gpt-5-mini"` (deterministic utilities: dates, keywords, scoring)
* `response_format`: `{ type: "json_schema", json_schema: { name, schema, strict: true } }`
* `reasoning.effort`: `"medium"` (chat/patch) · `"minimal"` (utilities)
* `text.verbosity`: `"low"`
* `previous_response_id`: pass when continuing an edit thread
* **Retries**: up to 2 schema retries. If still invalid, return a clean error to the UI (don’t free-form improvise).

**Typical request (PATCH)**:

```ts
const resp = await client.responses.create({
  model: "gpt-5",
  reasoning: { effort: "medium" },
  text: { verbosity: "low" },
  response_format: {
    type: "json_schema",
    json_schema: { name: "patch_envelope", schema: PatchEnvelopeSchema, strict: true }
  },
  input: PROMPT,
  previous_response_id // optional thread continuation
});
```

---

## 2) Canonical Resume JSON (v1-min)

This is the **single source of truth** your UI edits and your PDF renderer prints. Keep it minimal and ATS-safe.

### JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "resume.v1.min.schema.json",
  "title": "Resume (v1-min)",
  "type": "object",
  "additionalProperties": false,
  "$defs": {
    "date": { "type": "string", "pattern": "^(\\d{4}-(0[1-9]|1[0-2])|Present)$" },
    "link": { "type": "string", "minLength": 1 }
  },
  "properties": {
    "basics": {
      "type": "object",
      "additionalProperties": false,
      "required": ["name", "label", "email", "phone"],
      "properties": {
        "name":  { "type": "string", "minLength": 1 },
        "label": { "type": "string", "minLength": 1 },
        "email": { "type": "string", "minLength": 3 },
        "phone": { "type": "string", "minLength": 3 },
        "location": { "type": "string", "default": "" },
        "links": { "type": "array", "items": { "$ref": "#/$defs/link" }, "default": [] }
      }
    },
    "summary": { "type": "string", "default": "" },
    "skills":  { "type": "array", "items": { "type": "string" }, "default": [] },
    "work": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["position", "company", "location", "startDate", "endDate", "bullets"],
        "properties": {
          "position":  { "type": "string" },
          "company":   { "type": "string" },
          "location":  { "type": "string" },
          "startDate": { "$ref": "#/$defs/date" },
          "endDate":   { "$ref": "#/$defs/date" },
          "bullets":   { "type": "array", "items": { "type": "string" } }
        }
      },
      "default": []
    },
    "projects": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["name", "startDate", "bullets"],
        "properties": {
          "name":      { "type": "string" },
          "startDate": { "$ref": "#/$defs/date" },
          "endDate":   { "$ref": "#/$defs/date" },
          "link":      { "$ref": "#/$defs/link" },
          "bullets":   { "type": "array", "items": { "type": "string" } }
        }
      },
      "default": []
    },
    "education": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["institution", "studyType", "area", "startDate", "endDate"],
        "properties": {
          "institution": { "type": "string" },
          "studyType":   { "type": "string" },
          "area":        { "type": "string" },
          "startDate":   { "$ref": "#/$defs/date" },
          "endDate":     { "$ref": "#/$defs/date" },
          "notes":       { "type": "string" }
        }
      },
      "default": []
    },
    "certs": { "type": "array", "items": { "type": "string" }, "default": [] }
  },
  "required": ["basics", "skills", "work", "education"]
}
```

**Style guidance (not schema, but enforced via prompts)**

* Bullets: **impact + metric + tool**, 3–5 per role, keep ≤ \~2 lines each.
* Dates are strings `"YYYY-MM"` or `"Present"` only.

---

## 3) Patch Spec (the diff language)

Every AI edit is an **atomic suggestion** you can accept or reject. Patches are applied **sequentially** in the order returned.

### Types

```ts
type Suggestion = {
  id: string;                              // unique within response
  path: string;                            // JSON Pointer (RFC 6901), e.g., "/work/0/bullets/2"
  kind: "replace" | "insert" | "delete";   // atomic operation
  oldValue?: any;                          // required for replace/delete
  newValue?: any;                          // required for replace/insert
  rationale: string;                       // short “why this helps”
  provenance: "from_resume" | "from_jd" | "from_user";
  confidence?: number;                     // 0..1 (optional)
  // optional niceties for UI ordering (AI may include but not required):
  priority?: 1 | 2 | 3;                    // 1=high, 3=low
  section?: "summary" | "skills" | "work" | "projects" | "education" | "certs";
};

type PatchEnvelope = { patch: Suggestion[] } | { questions: string[] };
```

### JSON Pointer cheat-sheet

* Whole field: `/summary`
* 4th skill: `/skills/3`
* First bullet of second job: `/work/1/bullets/0`
* Insert at index N: `/work/0/bullets/N` with `kind:"insert"`
* **Reorder** an array: emulate with `delete` + `insert` (we don’t define `move` in v1)

### Locking & conflicts

* **Locked by default**: `/work/*/(company|position|startDate|endDate)`
  If a patch touches a locked path, the client rejects it and shows “locked field — unlock to apply.”
* **Sequential apply**: Patches are computed against the **current JSON**. The client applies them in return order. If a path becomes invalid (e.g., index out of range after earlier edits), the client stops and marks the rest conflicted, showing a one-click “recompute on latest” action.

---

## 4) AI Contract (hard rules)

* Return **only one** of:

  * `{"patch": Suggestion[]}`
  * `{"questions": string[]}`
* No free-form prose outside that envelope.
* **Do not** change company names, titles, or dates unless the user explicitly asked (UI unlock).
* If unsure (missing facts, ungrounded claim), **ask via `questions`** — don’t guess.
* After applying your patch, the resume **must validate** against **Resume v1-min**.

---

## 5) Prompts (copy-paste, conversational)

These are the **only** prompts the app uses. Keep them short; they rely on the schema to enforce shape.

### 5.1 CV Cursor — edit/refine (no JD)

**System**

```
<context_gathering>
You are a resume editor that produces PATCHES, not prose.

Rules:
- Return ONLY JSON: { "patch": Suggestion[] } OR { "questions": string[] }.
- Suggestions must use JSON Pointer paths and be atomic (replace/insert/delete).
- Keep company names, titles, and dates unchanged unless explicitly instructed (user unlock).
- Prefer measurable bullets (impact + metric + tool), ≤ 2 lines each.
- After your patch is applied, the resume must validate against the provided JSON Schema.
</context_gathering>
```

**User**

```
Resume JSON:
{{RESUME_JSON}}

Schema:
{{RESUME_SCHEMA_JSON}}

Instruction (user said):
{{USER_INSTRUCTION}}

Return ONLY the JSON envelope.
```

---

### 5.2 JD Tailoring — grounded changes for a job

**System**

```
<context_gathering>
You tailor resumes to a JD and produce PATCHES only.

Rules:
- Return ONLY JSON: { "patch": Suggestion[] } OR { "questions": string[] }.
- Ground changes in the current resume. If a claim is not supported, ask a question.
- Mark provenance="from_jd" for suggestions driven by the JD.
- Do NOT change company, title, or dates unless explicitly instructed.
- Keep bullets as impact + metric + tool. Keep JSON valid per schema.
</context_gathering>
```

**User**

```
Resume JSON:
{{RESUME_JSON}}

Schema:
{{RESUME_SCHEMA_JSON}}

Job Description:
{{JD_TEXT}}

Goal:
Tailor for this JD without inventing facts. If information is missing, ask questions.

Return ONLY the JSON envelope.
```

---

### 5.3 Fallback Structuring — build resume JSON from raw text

**System**

```
<context_gathering>
You convert raw resume text into the canonical Resume JSON (v1-min).

Rules:
- Return ONLY JSON: { "resume": <Resume> }.
- Dates must be strings in YYYY-MM or "Present".
- Keep arrays present (skills, work.bullets, etc.), even if empty.
- If uncertain about a field, omit it or leave it empty; do NOT fabricate.
- Output MUST validate against the provided JSON Schema.
</context_gathering>
```

**User**

```
Raw Resume Text:
{{RAW_TEXT}}

Schema:
{{RESUME_SCHEMA_JSON}}

Return ONLY:
{ "resume": { ... } }
```

---

### 5.4 Deterministic utilities (gpt-5-mini)

**Date normalization → returns a patch**
**System**

```
<context_gathering>
You normalize dates in a Resume JSON and return a PATCH.

Rules:
- Return ONLY { "patch": Suggestion[] }.
- Convert any non-conforming dates to "YYYY-MM" or "Present".
- Do not modify any value other than dates.
</context_gathering>
```

**User**

```
Resume JSON:
{{RESUME_JSON}}

Schema:
{{RESUME_SCHEMA_JSON}}

Return ONLY the JSON envelope.
```

**JD keywords & coverage → returns typed JSON**
**System**

```
<context_gathering>
You extract JD keywords and compute coverage against Resume JSON.

Rules:
- Return ONLY JSON: { "used": string[], "missing": string[], "score": number }.
- score = round(100 * |used| / max(1, |used| + |missing|)).
</context_gathering>
```

**User**

```
Resume JSON:
{{RESUME_JSON}}

Job Description:
{{JD_TEXT}}

Return ONLY the JSON object.
```

---

## 6) Conversation state & threading (for that “Cursor feel”)

The app should keep explicit, minimal state per conversation thread:

```ts
type ConversationState = {
  previousResponseId?: string;  // pass back to GPT-5
  baseVersionId: string;        // hash of the resume JSON at the start of this turn
  lockedPaths: string[];        // default: ['/work/*/company', '/work/*/position', '/work/*/startDate', '/work/*/endDate']
  mode: "edit" | "jd" | "structuring" | "utility";
  jdText?: string;              // present in "jd" mode
};
```

**Flow**

1. User asks something (“tighten HOT Capital bullets”).
2. Client sends System+User prompt + `previous_response_id` (if any) + current resume JSON.
3. AI returns `{patch:[...]}` or `{questions:[...]}`.
4. Client **dry-runs** patch on a copy → re-validate → show diff.
5. Accept/reject → update resume JSON → **new baseVersionId**.
6. Next turn: pass `previous_response_id` from step 2 to keep context short and focused.

---

## 7) Error taxonomy (and what the AI should do)

The AI should **not** try to “fix” these with prose. The **client** owns retries. Just keep returning envelope JSON.

* **Invalid JSON** (parse error): client retries with same prompt once; otherwise surfaces a clean error.
* **Schema invalid after patch**: client shows error and discards patch; user can retry. (AI should keep patches small to reduce this.)
* **Locked field mutation**: client rejects the patch and explains “locked field”.
* **Path not found / out of range**: partial apply stops; UI offers “recompute on latest” (sends the same instruction again).
* **No changes suggested**: AI returns `{"questions":["What outcome do you want? Shorter? More metrics? Tailor to JD?"]}`

---

## 8) Examples (multi-turn, conversational)

### A) Edit flow (no JD)

**User:** “Make my current Fuxion bullets more measurable; keep companies/dates as is.”

**AI →**

```json
{
  "patch": [
    {
      "id": "p1",
      "path": "/work/0/bullets/0",
      "kind": "replace",
      "oldValue": "Improved product adoption.",
      "newValue": "Lifted weekly active users +22% by shipping habit loops and reminder cadences informed by cohort analysis.",
      "rationale": "Adds metric and mechanism to a vague claim.",
      "provenance": "from_resume",
      "confidence": 0.86,
      "priority": 1,
      "section": "work"
    },
    {
      "id": "p2",
      "path": "/work/0/bullets/2",
      "kind": "insert",
      "newValue": "Reduced onboarding drop-off 18% with copy tests and simplified permissions (Optimizely).",
      "rationale": "Second measurable win to balance the role.",
      "provenance": "from_resume",
      "priority": 2,
      "section": "work"
    }
  ]
}
```

**User:** “Good. Shorten the summary to 2 lines and surface AI/LLM.”

**AI →**

```json
{
  "patch": [
    {
      "id": "p3",
      "path": "/summary",
      "kind": "replace",
      "oldValue": "Product leader focusing on growth...",
      "newValue": "PM shipping AI-powered features that drive activation and retention; blends discovery, analytics, and delivery.",
      "rationale": "Concise, includes AI/LLM theme per instruction.",
      "provenance": "from_user",
      "confidence": 0.88,
      "section": "summary"
    }
  ]
}
```

### B) JD tailoring (grounded)

**User:** *pastes JD* “Tailor to this. Don’t invent Mixpanel unless I confirm.”

**AI →**

```json
{
  "questions": [
    "Do you have hands-on Mixpanel experimentation? If yes, share one measurable outcome to add."
  ]
}
```

**User:** “Yes — ran 7 experiments; improved activation +9%.”

**AI →**

```json
{
  "patch": [
    {
      "id": "p4",
      "path": "/skills/3",
      "kind": "replace",
      "oldValue": "A/B Testing",
      "newValue": "A/B Testing, Mixpanel",
      "rationale": "JD asks for Mixpanel specifically; now grounded by your confirmation.",
      "provenance": "from_jd",
      "confidence": 0.8,
      "section": "skills"
    },
    {
      "id": "p5",
      "path": "/work/0/bullets/1",
      "kind": "insert",
      "newValue": "Ran 7 Mixpanel experiments that increased activation +9% by optimizing first-session checklist.",
      "rationale": "Concrete JD-aligned result; uses your metric.",
      "provenance": "from_jd",
      "priority": 1,
      "section": "work"
    }
  ]
}
```

---

## 9) Token & context hygiene (so conversations stay snappy)

* Don’t send giant prompts. Send **current resume JSON** only (already compact).
* For long JDs, **paste as is**; GPT-5 handles it. If extreme, pre-summarize with `"gpt-5-mini"` into a tiny “requirements list” JSON for the main tailoring call.
* Always pass `previous_response_id` on subsequent turns to reduce tokens/latency.

---

## 10) Client apply order (so patches are safe)

1. **Validate** current resume JSON (defense in depth).
2. **Dry-run** apply patches in order on a copy.
3. Re-validate the result against schema.
4. If valid, commit and show the diff. If not, show an error and keep the old JSON.
5. If a patch hits a locked path, reject that suggestion only.
6. If an index changed due to a prior accepted patch, stop and show “recompute on latest.”

---

## 11) Quick command “macros” (common conversational asks)

Your UI can turn these into concise **USER\_INSTRUCTION** strings for prompt 5.1 or 5.2.

* “**Tighten all bullets** in my current role (3–5, impact+metric+tool).”
* “**Quantify** this role; prefer activation/retention metrics.”
* “**Shorten to 1 page**; remove lowest-impact bullets first.”
* “**Mirror JD order** of skills and responsibilities.”
* “**Rewrite summary** for AI PM; keep it ≤2 lines.”
* “**Make bullets parallel** (start with verb + metric).”
* “**Remove redundancy** in skills and use JD terms.”

---

## 12) Minimal JD Requirements Graph (optional helper)

If you want a structured JD view for UI toggles, keep it tiny:

```json
{
  "skills": [{ "name": "RAG", "weight": 3 }, { "name": "CI/CD", "weight": 2 }],
  "signals": [{ "name": "Shipped AI feature", "weight": 3 }],
  "notes": ""
}
```

When present, include it at the end of the JD text in the tailoring prompt (“optional context”).

---

## 13) Safety rails the AI should internalize (repeat!)

* **Never** add employers, titles, degrees, or dates.
* **Never** embed markdown, tables, or emojis in strings.
* **Always** prefer concrete numbers and tools (when grounded).
* **Always** ask when a claim is missing support.
* **Always** fit the schema; if your change would break it, don’t suggest it.

---

## 14) Success signals for each turn (AI self-check)

Before returning a patch, the model should implicitly confirm:

* [ ] Did I avoid locked fields?
* [ ] Are my paths correct and indices valid relative to the provided JSON?
* [ ] Will the result still match the schema?
* [ ] Did I keep bullets ≤ \~2 lines and 3–5 per role?
* [ ] Did I add rationale + provenance on every suggestion?
* [ ] If I’m unsure, did I return `questions` instead of guessing?

