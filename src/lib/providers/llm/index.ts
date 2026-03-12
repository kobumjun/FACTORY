import type { LLMProvider } from './types';
import { createOpenAILLM } from './openai';

let _instance: LLMProvider | null = null;

export function getLLMProvider(): LLMProvider {
  if (!_instance) {
    const provider = process.env.LLM_PROVIDER || 'openai';
    if (provider === 'openai') {
      _instance = createOpenAILLM();
    } else {
      throw new Error(`Unknown LLM provider: ${provider}`);
    }
  }
  return _instance;
}
