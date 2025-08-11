import { Router } from 'express';
import { z } from 'zod';
import { getOpenAIClient, getModels } from '../lib/openai.js';
import { ResumeSchema, ResumeJsonSchema } from '../schemas/resume.js';
import { PatchEnvelopeSchema, PatchEnvelopeJsonSchema } from '../schemas/patch.js';
import { redactPII } from '../lib/redact.js';

const BodySchema = z
  .object({
    mode: z.enum(['edit', 'jd']),
    resume: ResumeSchema,
    schema: z.any().optional(),
    instruction: z.string().optional(),
    jdText: z.string().optional(),
    previousResponseId: z.string().optional(),
  })
  .strict();

export const router = Router();

router.post('/', async (req, res) => {
  const parse = BodySchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'invalid_body', details: parse.error.flatten() });
  }

  const body = parse.data;
  if (process.env.MOCK_OPENAI === '1' || !process.env.OPENAI_API_KEY) {
    const mock = { patch: [], responseId: 'mock_patch_1' };
    return res.json(mock);
  }
  const client = getOpenAIClient();
  const { mainModel } = getModels();

  const system = body.mode === 'edit'
    ? `<context_gathering>
You are a resume editor that produces PATCHES, not prose.
Rules:
- Return ONLY JSON: { "patch": Suggestion[] } OR { "questions": string[] }.
- Suggestions must use JSON Pointer paths and be atomic (replace/insert/delete).
- Keep company names, titles, and dates unchanged unless explicitly instructed (user unlock).
- Prefer measurable bullets (impact + metric + tool), ≤ 2 lines each.
- After your patch is applied, the resume must validate against the provided JSON Schema.
</context_gathering>`
    : `<context_gathering>
You tailor resumes to a JD and produce PATCHES only.
Rules:
- Return ONLY JSON: { "patch": Suggestion[] } OR { "questions": string[] }.
- Ground changes in the current resume. If a claim is not supported, ask a question.
- Mark provenance="from_jd" for suggestions driven by the JD.
- Do NOT change company, title, or dates unless explicitly instructed.
- Keep bullets as impact + metric + tool. Keep JSON valid per schema.
</context_gathering>`;

  const user = body.mode === 'edit'
    ? `Resume JSON:\n${JSON.stringify(body.resume)}\n\nSchema:\n${JSON.stringify(
        body.schema ?? ResumeJsonSchema
      )}\n\nInstruction (user said):\n${body.instruction ?? ''}\n\nReturn ONLY the JSON envelope.`
    : `Resume JSON:\n${JSON.stringify(body.resume)}\n\nSchema:\n${JSON.stringify(
        body.schema ?? ResumeJsonSchema
      )}\n\nJob Description:\n${body.jdText ?? ''}\n\nGoal:\nTailor for this JD without inventing facts. If information is missing, ask questions.\n\nReturn ONLY the JSON envelope.`;

  const responseFormat = {
    type: 'json_schema',
    json_schema: { name: 'patch_envelope', schema: PatchEnvelopeJsonSchema, strict: true },
  } as const;

  // up to 2 retries on schema violation
  let attempts = 0;
  while (attempts < 3) {
    attempts++;
    try {
      const resp = await client.responses.create({
        model: mainModel,
        reasoning: { effort: 'medium' },
        text: { verbosity: 'low' },
        response_format: responseFormat as any,
        input: `${system}\n\n${user}`,
        previous_response_id: body.previousResponseId,
      } as any);

      const responseId = (resp as any).id;
      // Responses API may return structured JSON in content instead of text
      const content = (resp as any).output?.[0]?.content?.[0];
      let json: any;
      if (content && (content.parsed || content.json)) {
        json = content.parsed ?? content.json;
      } else {
        const text = (resp as any).output_text || content?.text || '';
        const redacted = redactPII(text);
        json = JSON.parse(redacted);
      }
      const valid = PatchEnvelopeSchema.safeParse(json);
      if (!valid.success) throw new Error('schema_invalid');
      return res.json({ ...json, responseId });
    } catch (err: any) {
      if (attempts >= 3) {
        const msg = err?.message || String(err);
        return res.status(400).json({ error: 'schema_invalid', message: msg });
      }
    }
  }
});


