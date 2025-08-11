import { Router } from 'express';
import { z } from 'zod';
import { getOpenAIClient, getModels } from '../lib/openai.js';
import { ResumeSchema, ResumeJsonSchema } from '../schemas/resume.js';

const BodySchema = z
  .object({
    rawText: z.string(),
    schema: z.any().optional(),
  })
  .strict();

export const router = Router();

router.post('/', async (req, res) => {
  const parse = BodySchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'invalid_body', details: parse.error.flatten() });
  }
  const { rawText, schema } = parse.data;
  if (process.env.MOCK_OPENAI === '1' || !process.env.OPENAI_API_KEY) {
    return res.json({
      resume: {
        basics: {
          name: 'Sample User',
          label: 'Software Engineer',
          email: 'sample@example.com',
          phone: '+10000000000',
          location: '',
          links: ['https://example.com']
        },
        summary: 'Sample generated resume from mock /ai/struct.',
        skills: ['TypeScript'],
        work: [],
        education: [],
        certs: []
      },
      responseId: 'mock_struct_1',
    });
  }
  const client = getOpenAIClient();
  const { mainModel } = getModels();

  const system = `<context_gathering>
You convert raw resume text into the canonical Resume JSON (v1-min).
Rules:
- Return ONLY JSON: { "resume": <Resume> }.
- Dates must be strings in YYYY-MM or "Present".
- Keep arrays present (skills, work.bullets, etc.), even if empty.
- If uncertain about a field, omit it or leave it empty; do NOT fabricate.
- Output MUST validate against the provided JSON Schema.
</context_gathering>`;

  const user = `Raw Resume Text:\n${rawText}\n\nSchema:\n${JSON.stringify(
    schema ?? ResumeJsonSchema
  )}\n\nReturn ONLY:\n{ "resume": { ... } }`;

  const responseFormat = {
    type: 'json_schema',
    json_schema: { name: 'resume_envelope', schema: { type: 'object', properties: { resume: ResumeJsonSchema }, required: ['resume'], additionalProperties: false }, strict: true },
  } as const;

  try {
    const resp = await client.responses.create({
      model: mainModel,
      reasoning: { effort: 'medium' },
      response_format: responseFormat as any,
      input: `${system}\n\n${user}`,
    } as any);
    const responseId = (resp as any).id;
    const content = (resp as any).output?.[0]?.content?.[0];
    const json = content && (content.parsed || content.json) ? (content.parsed ?? content.json) : JSON.parse(((resp as any).output_text || content?.text || ''));
    const validated = ResumeSchema.safeParse(json.resume);
    if (!validated.success) return res.status(400).json({ error: 'schema_invalid' });
    return res.json({ resume: json.resume, responseId });
  } catch (err: any) {
    return res.status(500).json({ error: 'openai_error', message: err?.message || String(err) });
  }
});


