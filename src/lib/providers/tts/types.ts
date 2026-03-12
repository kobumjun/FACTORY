export interface TTSProvider {
  generateSpeech(text: string, options?: { voice?: string }): Promise<Buffer>;
}
