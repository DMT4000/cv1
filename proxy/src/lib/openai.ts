import OpenAI from 'openai';

export type OpenAIModels = {
  mainModel: string;
  miniModel: string;
};

export function getModels(): OpenAIModels {
  const mainModel = process.env.OPENAI_MODEL || 'gpt-5';
  const miniModel = process.env.OPENAI_MINI || 'gpt-5-mini';
  return { mainModel, miniModel };
}

export function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // Do not throw here to allow /health; routes will error on usage
    return new OpenAI({ apiKey: 'missing-key' as any });
  }
  return new OpenAI({ apiKey });
}


