import OpenAI from 'openai';
import type { ImageProvider } from './types';

export function createOpenAIImage(): ImageProvider {
  const apiKey = process.env.OPENAI_IMAGE_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_IMAGE_API_KEY or OPENAI_API_KEY is required');

  const client = new OpenAI({ apiKey });

  return {
    async generateImage(prompt: string, options?: { size?: string; negativePrompt?: string }) {
      let fullPrompt = prompt;
      if (options?.negativePrompt?.trim()) {
        fullPrompt = `${prompt}\n\nAvoid: ${options.negativePrompt.trim()}`;
      }
      const res = await client.images.generate({
        model: 'dall-e-3',
        prompt: fullPrompt,
        n: 1,
        size: (options?.size ?? '768x1344') === '768x1344' ? '1024x1792' : (options?.size as '1024x1024' | '1024x1792'), // 기본 768x1344, DALL-E는 1024x1792로 매핑
        response_format: 'url',
        quality: 'standard',
      });
      const url = res.data?.[0]?.url;
      if (!url) throw new Error('Image generation failed');
      return url;
    },
  };
}
