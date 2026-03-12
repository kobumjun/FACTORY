import type { ImageProvider } from './types';

const STABILITY_BASE = 'https://api.stability.ai';
const DEFAULT_ENGINE = 'stable-diffusion-xl-1024-v1-0';

export function createStabilityImage(): ImageProvider {
  const apiKey = process.env.STABILITY_API_KEY;
  if (!apiKey) throw new Error('STABILITY_API_KEY is required for image provider');

  const engine = process.env.STABILITY_ENGINE ?? DEFAULT_ENGINE;

  return {
    async generateImage(prompt: string, options?: { size?: string; negativePrompt?: string; stylePreset?: string }) {
      const size = options?.size ?? '768x1344';
      const [width, height] = size.split('x').map(Number);

      const textPrompts: Array<{ text: string; weight?: number }> = [{ text: prompt, weight: 1 }];
      if (options?.negativePrompt?.trim()) {
        textPrompts.push({ text: options.negativePrompt.trim(), weight: -1 });
      }

      const body: Record<string, unknown> = {
        text_prompts: textPrompts,
        cfg_scale: 7,
        height: height || 1344,
        width: width || 768,
        samples: 1,
        steps: 30,
      };

      const stylePreset = options?.stylePreset ?? 'digital-art';
      if (stylePreset) {
        body.style_preset = stylePreset;
      }

      const res = await fetch(
        `${STABILITY_BASE}/v1/generation/${engine}/text-to-image`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(body),
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
