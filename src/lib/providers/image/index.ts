import type { ImageProvider } from './types';
import { createOpenAIImage } from './openai';

let _instance: ImageProvider | null = null;

export function getImageProvider(): ImageProvider {
  if (!_instance) {
    const provider = process.env.IMAGE_PROVIDER || 'openai';
    if (provider === 'openai') {
      _instance = createOpenAIImage();
    } else {
      throw new Error(`Unknown image provider: ${provider}`);
    }
  }
  return _instance;
}
