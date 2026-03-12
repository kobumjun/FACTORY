import type { ImageProvider } from './types';
import { createOpenAIImage } from './openai';
import { createStabilityImage } from './stability';

let _instance: ImageProvider | null = null;

export function getImageProvider(): ImageProvider {
  if (!_instance) {
    const imageProvider = process.env.IMAGE_PROVIDER ?? 'stability';
    switch (imageProvider) {
      case 'stability':
        _instance = createStabilityImage();
        break;
      case 'openai':
        _instance = createOpenAIImage();
        break;
      default:
        throw new Error(`Unknown image provider: ${imageProvider}`);
    }
  }
  return _instance;
}
