import OpenAI from 'openai';
import type { TTSProvider } from './types';

export function createOpenAITTS(): TTSProvider {
  const apiKey = process.env.OPENAI_TTS_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_TTS_API_KEY or OPENAI_API_KEY is required');

  const client = new OpenAI({ apiKey });

  return {
    async generateSpeech(text: string, options?: { voice?: string }) {
      const res = await client.audio.speech.create({
        model: 'tts-1-hd',
        voice: (options?.voice as 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer') || 'alloy', // English voices
        input: text,
      });
      const arrayBuffer = await res.arrayBuffer();
      return Buffer.from(arrayBuffer);
    },
  };
}
