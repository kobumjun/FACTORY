import { spawn } from 'child_process';
import ffmpegPath from 'ffmpeg-static';

export interface RenderOptions {
  images: string[];
  audios: string[];
  outputPath: string;
}

/**
 * Renders vertical shorts: pairs (image, audio) concatenated.
 * Uses ffmpeg-static binary (Vercel/serverless compatible).
 */
export async function renderVideo(options: RenderOptions): Promise<string> {
  const { images, audios, outputPath } = options;

  if (images.length !== audios.length) {
    throw new Error('Images and audios count must match');
  }

  const n = images.length;
  const inputs: string[] = [];
  for (let i = 0; i < n; i++) {
    inputs.push('-loop', '1', '-i', images[i], '-i', audios[i]);
  }

  const scaleParts: string[] = [];
  const concatParts: string[] = [];
  for (let i = 0; i < n; i++) {
    const vIn = i * 2;
    const aIn = i * 2 + 1;
    scaleParts.push(`[${vIn}:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2[v${i}]`);
    concatParts.push(`[v${i}][${aIn}:a]`);
  }
  const filterComplex =
    scaleParts.join(';') + ';' +
    concatParts.join('') + `concat=n=${n}:v=1:a=1[outv][outa]`;

  const args = [
    ...inputs.flat(),
    '-filter_complex', filterComplex,
    '-map', '[outv]', '-map', '[outa]',
    '-c:v', 'libx264', '-c:a', 'aac',
    '-shortest', '-y', outputPath,
  ];

  const bin = ffmpegPath ?? 'ffmpeg';
  return new Promise((resolve, reject) => {
    const proc = spawn(bin, args);
    let stderr = '';
    proc.stderr.on('data', (d) => { stderr += d.toString(); });
    proc.on('close', (code) => {
      if (code === 0) resolve(outputPath);
      else reject(new Error(`FFmpeg failed: ${stderr.slice(-500)}`));
    });
  });
}
