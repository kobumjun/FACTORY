import type { ImageProvider } from './types';

const STABILITY_BASE = 'https://api.stability.ai';
const DEFAULT_ENGINE = 'stable-diffusion-xl-1024-v1-0';

export function createStabilityImage(): ImageProvider {
  const apiKey = process.env.STABILITY_API_KEY;
  if (!apiKey) throw new Error('STABILITY_API_KEY is required for image provider');

  const engine = process.env.STABILITY_ENGINE ?? DEFAULT_ENGINE;

  return {
    async generateImage(prompt: string, options?: { size?: string }) {
      const size = options?.size ?? '1024x1792';
      const [width, height] = size.split('x').map(Number);

      const res = await fetch(
        `${STABILITY_BASE}/v1/generation/${engine}/text-to-image`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            text_prompts: [{ text: prompt }],
            cfg_scale: 7,
            height: height || 1792,
            width: width || 1024,
            samples: 1,
            steps: 30,
            style_preset: 'photographic',
          }),
        }
      );

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Stability API error: ${res.status} ${err}`);
      }

      const data = (await res.json()) as { artifacts?: Array<{ base64?: string }> };
      const base64 = data.artifacts?.[0]?.base64;
      if (!base64) throw new Error('Stability image generation failed');

      return `data:image/png;base64,${base64}`;
    },
  };
}
