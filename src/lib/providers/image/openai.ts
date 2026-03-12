import OpenAI from 'openai';
import type { ImageProvider } from './types';

export function createOpenAIImage(): ImageProvider {
  const apiKey = process.env.OPENAI_IMAGE_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_IMAGE_API_KEY or OPENAI_API_KEY is required');

  const client = new OpenAI({ apiKey });

  return {
    async generateImage(prompt: string, options?: { size?: string }) {
      const res = await client.images.generate({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: (options?.size as '1024x1024' | '1024x1792') || '1024x1792', // 세로형
        response_format: 'url',
        quality: 'standard',
      });
      const url = res.data?.[0]?.url;
      if (!url) throw new Error('Image generation failed');
      return url;
    },
  };
}
