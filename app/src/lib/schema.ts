// Canonical Resume JSON (v1-min) — copied from models-and-prompts.md
export const ResumeJsonSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'resume.v1.min.schema.json',
  title: 'Resume (v1-min)',
  type: 'object',
  additionalProperties: false,
  $defs: {
    date: { type: 'string', pattern: '^(\\d{4}-(0[1-9]|1[0-2])|Present)$' },
    link: { type: 'string', minLength: 1 },
  },
  properties: {
    basics: {
      type: 'object',
      additionalProperties: false,
      required: ['name', 'label', 'email', 'phone'],
      properties: {
        name: { type: 'string', minLength: 1 },
        label: { type: 'string', minLength: 1 },
        email: { type: 'string', minLength: 3 },
        phone: { type: 'string', minLength: 3 },
        location: { type: 'string', default: '' },
        links: { type: 'array', items: { $ref: '#/$defs/link' }, default: [] },
      },
    },
    summary: { type: 'string', default: '' },
    skills: { type: 'array', items: { type: 'string' }, default: [] },
    work: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['position', 'company', 'location', 'startDate', 'endDate', 'bullets'],
        properties: {
          position: { type: 'string' },
          company: { type: 'string' },
          location: { type: 'string' },
          startDate: { $ref: '#/$defs/date' },
          endDate: { $ref: '#/$defs/date' },
          bullets: { type: 'array', items: { type: 'string' } },
        },
      },
      default: [],
    },
    projects: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'startDate', 'bullets'],
        properties: {
          name: { type: 'string' },
          startDate: { $ref: '#/$defs/date' },
          endDate: { $ref: '#/$defs/date' },
          link: { $ref: '#/$defs/link' },
          bullets: { type: 'array', items: { type: 'string' } },
        },
      },
      default: [],
    },
    education: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['institution', 'studyType', 'area', 'startDate', 'endDate'],
        properties: {
          institution: { type: 'string' },
          studyType: { type: 'string' },
          area: { type: 'string' },
          startDate: { $ref: '#/$defs/date' },
          endDate: { $ref: '#/$defs/date' },
          notes: { type: 'string' },
        },
      },
      default: [],
    },
    certs: { type: 'array', items: { type: 'string' }, default: [] },
  },
  required: ['basics', 'skills', 'work', 'education'],
} as const;


