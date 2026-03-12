export interface LLMProvider {
  generateText(prompt: string, options?: { maxTokens?: number }): Promise<string>;
}
