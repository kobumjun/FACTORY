import type { TTSProvider } from './types';

const ELEVENLABS_BASE = 'https://api.elevenlabs.io';
const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel
const DEFAULT_MODEL = 'eleven_multilingual_v2';

export function createElevenLabsTTS(): TTSProvider {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error('ELEVENLABS_API_KEY is required for TTS provider');

  const voiceId = process.env.ELEVENLABS_VOICE_ID ?? DEFAULT_VOICE_ID;
  const modelId = process.env.ELEVENLABS_MODEL_ID ?? DEFAULT_MODEL;

  return {
    async generateSpeech(text: string, options?: { voice?: string }) {
      const vid = options?.voice ?? voiceId;

      const res = await fetch(
        `${ELEVENLABS_BASE}/v1/text-to-speech/${vid}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'audio/mpeg',
            'xi-api-key': apiKey,
          },
          body: JSON.stringify({
            text,
            model_id: modelId,
          }),
        }
      );

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`ElevenLabs API error: ${res.status} ${err}`);
      }

      const arrayBuffer = await res.arrayBuffer();
      return Buffer.from(arrayBuffer);
    },
  };
}
