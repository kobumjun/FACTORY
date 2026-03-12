export interface ImageGenerationOptions {
  size?: string;
  negativePrompt?: string;
  stylePreset?: string;
}

export interface ImageProvider {
  generateImage(prompt: string, options?: ImageGenerationOptions): Promise<string>;
}
