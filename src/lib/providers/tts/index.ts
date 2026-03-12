import type { TTSProvider } from './types';
import { createOpenAITTS } from './openai';
import { createElevenLabsTTS } from './elevenlabs';

let _instance: TTSProvider | null = null;

export function getTTSProvider(): TTSProvider {
  if (!_instance) {
    const ttsProvider = process.env.TTS_PROVIDER ?? 'elevenlabs';
    switch (ttsProvider) {
      case 'elevenlabs':
        _instance = createElevenLabsTTS();
        break;
      case 'openai':
        _instance = createOpenAITTS();
        break;
      default:
        throw new Error(`Unknown TTS provider: ${ttsProvider}`);
    }
  }
  return _instance;
}
