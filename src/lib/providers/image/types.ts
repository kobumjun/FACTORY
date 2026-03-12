export interface ImageProvider {
  generateImage(prompt: string, options?: { size?: string }): Promise<string>;
}
