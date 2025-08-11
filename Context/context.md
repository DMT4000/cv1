# context.md (conversational, strong)

## what we’re building (in one breath)

**Cursor for CVs** — drop in any resume (even a photo or messy PDF), the app understands it, explains what’s strong/weak for your target roles, proposes changes as bite-sized patches you can accept/reject in a diff view, chats with you to clarify facts, and tailors to any JD without hallucinating. everything runs locally in your browser; only the OpenAI API call leaves your device.

---

## First-minute flow (UI shell)

The app presents a 5-step guided flow:
1) Upload  2) Structure  3) Edit  4) Tailor  5) Export

- “Use sample …” buttons load /app/public/fixtures/{clean.pdf, scan.png, jd_pm.txt, jd_ai_eng.txt}.
- Status strip (always visible): rawText length • ocr_used • validate: OK/Fail • applied: N.
- “Run Demo” executes: Upload clean.pdf → Heuristics → Normalize & Validate → Apply Sample Patch → Export Preview.
- Persist resumeJson, baseVersionId, previousResponseId in localStorage so refresh keeps state.
- If AI isn’t live (no key), show a small “Mock Mode” banner; non-AI actions still work.

---

## how you use it (first 60–120 seconds)

**1) drop your resume**

* you drag a PDF/DOCX/image. the app auto-detects if it’s text or image.
* if it’s image-only, it OCRs. either way, it extracts text and rebuilds a clean structure.

**2) instant understanding**

* you get a quick digest: *“I found 4 roles, 1 project, 12 skills. confidence looks good. two dates are fuzzy.”*
* it shows a simple “state of your CV” for your selected track (PM, AI PM, AI Eng, Full-stack).

**3) conversational editing starts**

* a chat bubble pops:
  *“want me to tighten your bullets to impact + metric + tool and keep dates/companies locked?”*
  you say “yes.” it proposes **patches** (tiny, safe edits) you can accept/reject inline.
  every patch has a short **why** and a **provenance** tag (“from\_resume”, “from\_jd”, or “from\_user”).

**4) tailor to a JD**

* paste a job description. it builds a requirements view and suggests **reordering**, **surfacing the right project**, and **wording tweaks** that mirror the JD’s priorities.
* if a claim isn’t grounded, it **asks** instead of inventing: *“do you want to add the Mixpanel experiment we discussed?”*

**5) export**

* click “export PDF.” it prints a clean, ATS-friendly, one-column resume.

---

## what “conversational editing” really means (like Cursor)

* you’re always working in a **diff**: left = current truth, right = proposed change.
* the AI never dumps a wall of prose; it sends a **patch list** (small, targeted edits).
* every suggestion has:

  * **path** to what changes (so we can highlight it),
  * **old → new**,
  * **why** it helps,
  * **provenance** (where it came from).
* you can accept one suggestion, a whole section, or an entire batch. undo is instant.
* you can **teach facts in-chat** (“our Entel pilot processed 50k NFC tx”) and they’re saved for later use (your local memory vault, later phase).
* dates/companies/titles are **locked by default**. if you want to change them, you explicitly unlock.

**tiny example**

> you: “make the HOT Capital bullets stronger for AI engineer”
> AI: *“proposed 3 edits (impact + metric + tool). none alter your employers/dates.”*
>
> * replace `/work/1/bullets/0`: “Improved retrieval” → “Raised retrieval **precision +17 pts** with MMR + chunk tuning (FAISS).”
> * insert bullet at `/work/1/bullets/2`: “Built **eval harness (300 gold Qs)**; release gate at **≥0.82 F1**.”
> * replace `/skills/3`: “AI” → “**RAG, Eval Harness, FAISS**” (matches JD wording)
>   *accept all* → applied, preview updates, PDF ready.

---

## why this is valuable

* **ingests anything**: no more “422 upload failed.” scanned resume? still works.
* **signal over fluff**: shows strengths, gaps, and “quick wins” that actually move recruiter/ATS needles.
* **surgical edits**: changes are safe and explainable; you stay in control.
* **truth-first tailoring**: matches the JD but won’t invent. uncertain → question, not claim.
* **local-first**: you keep your data. the only outbound call is to OpenAI.

---

## what v1 includes (and feels like)

* **ingest + understand**: OCR if needed, structure rebuild, confidence flags.
* **diagnose**: role-aware strengths/gaps + quick wins (PM, AI PM, AI Eng, Full-stack).
* **diff editor**: patch suggestions with accept/reject and “why”.
* **JD tailoring**: grounded suggestions that re-order and tighten the story.
* **ATS-safe export**: one-column, clean type, proper metadata.
* **light metrics**: used/missing keywords + simple match score you can sanity-check.

## what v1 skips (intentionally)

* fancy themes or multi-column layouts (save for later).
* job scraping / auto-apply.
* local LLMs (ollama). we use OpenAI only.
* cloud accounts, telemetry, or server-side storage.

---

## operating constraints (so the AI builds the right thing)

* **runtime:** browser app (local).
* **AI:** OpenAI only. **GPT-5** for conversation/suggestions; **GPT-5-mini** for deterministic utilities (dates, keyword extraction, scoring).
* **secrets:** `.env` key, referenced by a tiny **local proxy** so the browser never exposes it.
* **offline:** everything except the OpenAI call stays on-device.

---

## ground rules (must/never)

* **must**: every AI output validates against the **canonical resume JSON (v1-min)**.
* **must**: suggestions are **patches**, not prose dumps.
* **must**: show **provenance** and a short **why** for each change.
* **must**: company names, titles, and dates are **immutable** unless the user unlocks.
* **never**: invent employers, degrees, or metrics.
* **if unsure**: ask a **question**; don’t assert.

---

## target roles (starter presets the AI leans on)

* **PM:** strategy, discovery→delivery, experiments, analytics, stakeholder mgmt.
* **AI PM:** LLM feature design, evals/guardrails, RAG patterns, latency/cost tradeoffs.
* **AI Engineer:** Python, PyTorch, RAG, vector DBs, eval harnesses, deploy/observability.
* **Full-stack:** Node/TS, React/Next, REST/GraphQL, SQL/NoSQL, auth, testing, CI/CD, cloud.

---

## inputs & outputs (so expectations are crystal)

**inputs**

* resume file (pdf/docx/image)
* optional job description (text)

**outputs**

* **current resume JSON** (single source of truth for UI + PDF)
* **proposed patch list** (accept/reject, with why/provenance)
* **tailored PDF** (ATS safe)
* **metrics.json** (used/missing keywords, simple score)
* **flags** (e.g., `ocr_used`, `weak_dates`)

---

## what “good” looks like (quality bar)

* 100% of uploads produce a valid resume JSON (even scans).
* < 2 minutes from upload → tailored PDF for a JD.
* suggestions read like a great PM/Eng peer edit: concise, measurable, tool-aware.
* same inputs/settings → stable outputs (low temp, schema-enforced).
* zero ungrounded claims in final resumes.

---

## tone & UX cues (for the AI and UI)

* be **helpful, concise, and confident**; avoid filler.
* always explain **why** a change helps (briefly) and how it maps to the JD or best practices.
* default to **measurable impact** and **tool names**.
* keep bullets **≤ 2 lines**; keep skills **flat**; keep dates **YYYY-MM** or “Present”.

---

## AI Contract (must-have)

* Returns **either** `{"patch": Suggestion[]}` **or** `{"questions": string[]}` — no free-form prose.
* Suggestions use **JSON Pointer** paths; include `oldValue`, `newValue`, short `rationale`, and `provenance` (`from_resume | from_jd | from_user`).
* **Do not** change company names, titles, or dates unless user explicitly unlocks them.
* All outputs **must validate** against the **Canonical Resume JSON v1-min**.
* If uncertain, **ask a question** instead of guessing.

