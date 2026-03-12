import OpenAI from 'openai';
import type { LLMProvider } from './types';

export function createOpenAILLM(): LLMProvider {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is required');

  const client = new OpenAI({ apiKey });

  return {
    async generateText(prompt: string, options?: { maxTokens?: number }) {
      const res = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: options?.maxTokens ?? 2000,
      });
      return res.choices[0]?.message?.content?.trim() ?? '';
    },
  };
}
