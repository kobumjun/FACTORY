import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import ffmpegPath from 'ffmpeg-static';

export interface RenderOptions {
  images: string[];
  audios: string[];
  outputPath: string;
}

/**
 * Resolves ffmpeg binary path and ensures it exists (Vercel serverless compatible).
 * Requires serverExternalPackages: ['ffmpeg-static'] in next.config.
 */
function getFfmpegBinary(): string {
  const bin = ffmpegPath ?? 'ffmpeg';
  const resolvedPath = path.resolve(bin);
  if (!fs.existsSync(resolvedPath)) {
    console.error('FFMPEG binary not found:', resolvedPath);
    throw new Error('FFMPEG binary missing in runtime. Ensure serverExternalPackages includes "ffmpeg-static".');
  }
  return resolvedPath;
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
  const isVercel = process.env.VERCEL === '1';
  const width = isVercel ? 720 : 1080;
  const height = isVercel ? 1280 : 1920;

  const inputs: string[] = [];
  for (let i = 0; i < n; i++) {
    inputs.push('-loop', '1', '-i', images[i], '-i', audios[i]);
  }

  const scaleParts: string[] = [];
  const concatParts: string[] = [];
  for (let i = 0; i < n; i++) {
    const vIn = i * 2;
    const aIn = i * 2 + 1;
    scaleParts.push(`[${vIn}:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2[v${i}]`);
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
    ...(isVercel ? ['-b:v', '1M'] : []),
    '-shortest', '-y', outputPath,
  ];

  const bin = getFfmpegBinary();
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
