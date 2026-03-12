import type { LLMProvider } from './types';
import { createOpenAILLM } from './openai';

let _instance: LLMProvider | null = null;

export function getLLMProvider(): LLMProvider {
  if (!_instance) {
    const llmProvider = process.env.LLM_PROVIDER ?? 'openai';
    switch (llmProvider) {
    case 'openai':
      _instance = createOpenAILLM();
      break;
    default:
      throw new Error(`Unknown LLM provider: ${llmProvider}`);
    }
  }
  return _instance;
}
