import Ajv2020 from 'ajv/dist/2020';
import { ResumeJsonSchema } from './schema';

const ajv = new Ajv2020({ allErrors: true, strict: false });
const validate = ajv.compile(ResumeJsonSchema as any);

export function validateResume(resume: unknown): { ok: boolean; errors?: string[] } {
  const valid = validate(resume);
  if (valid) return { ok: true };
  const errors = (validate.errors || []).map((e) => `${e.instancePath || '/'} ${e.message}`.trim());
  return { ok: false, errors };
}


