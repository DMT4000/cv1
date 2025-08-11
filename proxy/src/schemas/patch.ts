import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

export const SuggestionSchema = z
  .object({
    id: z.string(),
    path: z.string(),
    kind: z.enum(['replace', 'insert', 'delete']),
    oldValue: z.any().optional(),
    newValue: z.any().optional(),
    rationale: z.string(),
    provenance: z.enum(['from_resume', 'from_jd', 'from_user']),
    confidence: z.number().min(0).max(1).optional(),
    priority: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
    section: z
      .enum(['summary', 'skills', 'work', 'projects', 'education', 'certs'])
      .optional(),
  })
  .strict()
  .superRefine((val, ctx) => {
    if (val.kind === 'replace' && (val.oldValue === undefined || val.newValue === undefined)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'replace requires oldValue and newValue',
      });
    }
    if (val.kind === 'insert' && val.newValue === undefined) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'insert requires newValue' });
    }
    if (val.kind === 'delete' && val.oldValue === undefined) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'delete requires oldValue' });
    }
  });

export const PatchEnvelopeSchema = z.union([
  z.object({ patch: z.array(SuggestionSchema) }).strict(),
  z.object({ questions: z.array(z.string()) }).strict(),
]);

export type Suggestion = z.infer<typeof SuggestionSchema>;
export type PatchEnvelope = z.infer<typeof PatchEnvelopeSchema>;

export const PatchEnvelopeJsonSchema = zodToJsonSchema(PatchEnvelopeSchema, {
  name: 'patch_envelope',
  $refStrategy: 'none',
});


