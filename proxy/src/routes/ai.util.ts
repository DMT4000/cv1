import { Router } from 'express';
import { z } from 'zod';
import { getOpenAIClient, getModels } from '../lib/openai.js';
import { ResumeSchema, ResumeJsonSchema } from '../schemas/resume.js';
import { PatchEnvelopeSchema, PatchEnvelopeJsonSchema } from '../schemas/patch.js';

const BodySchema = z
  .object({
    kind: z.enum(['normalize-dates', 'jd-coverage']),
    resume: ResumeSchema,
    jdText: z.string().optional(),
  })
  .strict();

export const router = Router();

router.post('/', async (req, res) => {
  const parse = BodySchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'invalid_body', details: parse.error.flatten() });
  }
  const { kind, resume, jdText } = parse.data;
  if (process.env.MOCK_OPENAI === '1' || !process.env.OPENAI_API_KEY) {
    if (kind === 'normalize-dates') {
      return res.json({ patch: [], responseId: 'mock_util_patch_1' });
    } else {
      return res.json({ used: [], missing: [], score: 0, responseId: 'mock_util_cov_1' });
    }
  }
  const client = getOpenAIClient();
  const { miniModel } = getModels();

  if (kind === 'normalize-dates') {
    const system = `<context_gathering>
You normalize dates in a Resume JSON and return a PATCH.
Rules:
- Return ONLY { "patch": Suggestion[] }.
- Convert any non-conforming dates to "YYYY-MM" or "Present".
- Do not modify any value other than dates.
</context_gathering>`;
    const user = `Resume JSON:\n${JSON.stringify(resume)}\n\nSchema:\n${JSON.stringify(
      ResumeJsonSchema
    )}\n\nReturn ONLY the JSON envelope.`;
    try {
      const resp = await client.responses.create({
        model: miniModel,
        reasoning: { effort: 'minimal' },
        response_format: {
          type: 'json_schema',
          json_schema: { name: 'patch_envelope', schema: PatchEnvelopeJsonSchema, strict: true },
        } as any,
        input: `${system}\n\n${user}`,
      } as any);
      const responseId = (resp as any).id;
      const content = (resp as any).output?.[0]?.content?.[0];
      const json = content && (content.parsed || content.json) ? (content.parsed ?? content.json) : JSON.parse(((resp as any).output_text || content?.text || ''));
      const valid = PatchEnvelopeSchema.safeParse(json);
      if (!valid.success) return res.status(400).json({ error: 'schema_invalid' });
      return res.json({ ...json, responseId });
    } catch (err: any) {
      return res.status(500).json({ error: 'openai_error', message: err?.message || String(err) });
    }
  } else {
    // jd-coverage
    const CoverageSchema = z
      .object({ used: z.array(z.string()), missing: z.array(z.string()), score: z.number() })
      .strict();
    const system = `<context_gathering>
You extract JD keywords and compute coverage against Resume JSON.
Rules:
- Return ONLY JSON: { "used": string[], "missing": string[], "score": number }.
- score = round(100 * |used| / max(1, |used| + |missing|)).
</context_gathering>`;
    const user = `Resume JSON:\n${JSON.stringify(resume)}\n\nJob Description:\n${jdText ?? ''}\n\nReturn ONLY the JSON object.`;
    try {
      const resp = await client.responses.create({
        model: miniModel,
        reasoning: { effort: 'minimal' },
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'jd_coverage',
            schema: {
              type: 'object',
              additionalProperties: false,
              required: ['used', 'missing', 'score'],
              properties: {
                used: { type: 'array', items: { type: 'string' } },
                missing: { type: 'array', items: { type: 'string' } },
                score: { type: 'number' },
              },
            },
            strict: true,
          },
        } as any,
        input: `${system}\n\n${user}`,
      } as any);
      const responseId = (resp as any).id;
      const content = (resp as any).output?.[0]?.content?.[0];
      const json = content && (content.parsed || content.json) ? (content.parsed ?? content.json) : JSON.parse(((resp as any).output_text || content?.text || ''));
      const valid = CoverageSchema.safeParse(json);
      if (!valid.success) return res.status(400).json({ error: 'schema_invalid' });
      return res.json({ ...json, responseId });
    } catch (err: any) {
      return res.status(500).json({ error: 'openai_error', message: err?.message || String(err) });
    }
  }
});


