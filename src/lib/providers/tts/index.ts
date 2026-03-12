import type { TTSProvider } from './types';
import { createOpenAITTS } from './openai';

let _instance: TTSProvider | null = null;

export function getTTSProvider(): TTSProvider {
  if (!_instance) {
    const provider = process.env.TTS_PROVIDER || 'openai';
    if (provider === 'openai') {
      _instance = createOpenAITTS();
    } else {
      throw new Error(`Unknown TTS provider: ${provider}`);
    }
  }
  return _instance;
}
