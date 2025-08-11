import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

const dateSchema = z.string().regex(/^(\d{4}-(0[1-9]|1[0-2])|Present)$/);

export const ResumeSchema = z.object({
  basics: z
    .object({
      name: z.string().min(1),
      label: z.string().min(1),
      email: z.string().min(3),
      phone: z.string().min(3),
      location: z.string().optional().default(''),
      links: z.array(z.string()).optional().default([]),
    })
    .strict(),
  summary: z.string().optional().default(''),
  skills: z.array(z.string()).optional().default([]),
  work: z
    .array(
      z
        .object({
          position: z.string(),
          company: z.string(),
          location: z.string(),
          startDate: dateSchema,
          endDate: dateSchema,
          bullets: z.array(z.string()),
        })
        .strict()
    )
    .optional()
    .default([]),
  projects: z
    .array(
      z
        .object({
          name: z.string(),
          startDate: dateSchema,
          endDate: dateSchema.optional(),
          link: z.string().optional(),
          bullets: z.array(z.string()),
        })
        .strict()
    )
    .optional()
    .default([]),
  education: z
    .array(
      z
        .object({
          institution: z.string(),
          studyType: z.string(),
          area: z.string(),
          startDate: dateSchema,
          endDate: dateSchema,
          notes: z.string().optional(),
        })
        .strict()
    )
    .optional()
    .default([]),
  certs: z.array(z.string()).optional().default([]),
}).strict();

export type Resume = z.infer<typeof ResumeSchema>;

export const ResumeJsonSchema = zodToJsonSchema(ResumeSchema, {
  name: 'resume.v1.min.schema.json',
  $refStrategy: 'none',
});


