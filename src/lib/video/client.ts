'use client';

import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import { createClient } from '@/lib/supabase/client';
import { MAX_VIDEO_SCENES } from '@/lib/constants';

type RenderResult =
  | { data: { videoUrl: string } }
  | { error: string };

const ffmpeg = createFFmpeg({ log: false });
let ffmpegLoaded = false;

async function ensureFFmpegLoaded() {
  if (!ffmpegLoaded) {
    await ffmpeg.load();
    ffmpegLoaded = true;
  }
}

export async function renderVideoInBrowser(projectId: string): Promise<RenderResult> {
  try {
    const supabase = createClient();

    // 1) 이미지 / TTS 단계에서 생성된 URL 가져오기
    const { data: imagesStep, error: imagesError } = await supabase
      .from('project_steps')
      .select('output_data')
      .eq('project_id', projectId)
      .eq('step', 'images')
      .single();

    if (imagesError) return { error: 'Failed to load images step.' };

    const { data: ttsStep, error: ttsError } = await supabase
      .from('project_steps')
      .select('output_data')
      .eq('project_id', projectId)
      .eq('step', 'tts')
      .single();

    if (ttsError) return { error: 'Failed to load TTS step.' };

    const imageUrls = (imagesStep?.output_data as { imageUrls?: string[] })?.imageUrls;
    const audioUrls = (ttsStep?.output_data as { audioUrls?: string[] })?.audioUrls;

    if (!Array.isArray(imageUrls) || !Array.isArray(audioUrls) || imageUrls.length === 0 || audioUrls.length === 0) {
      return { error: 'Generate images and TTS first.' };
    }

    const capped = Math.min(imageUrls.length, audioUrls.length, MAX_VIDEO_SCENES);
    const imageUrlsSliced = imageUrls.slice(0, capped);
    const audioUrlsSliced = audioUrls.slice(0, capped);

    // 2) ffmpeg.wasm 로드
    await ensureFFmpegLoaded();

    // 3) 입력 파일을 가상 FS에 기록
    for (let i = 0; i < imageUrlsSliced.length; i++) {
      const imgName = `img-${i}.png`;
      const audName = `aud-${i}.mp3`;
      ffmpeg.FS('writeFile', imgName, await fetchFile(imageUrlsSliced[i]));
      ffmpeg.FS('writeFile', audName, await fetchFile(audioUrlsSliced[i]));
    }

    const n = imageUrlsSliced.length;
    const width = 720;
    const height = 1280;

    const inputs: string[] = [];
    for (let i = 0; i < n; i++) {
      inputs.push('-loop', '1', '-i', `img-${i}.png`, '-i', `aud-${i}.mp3`);
    }

    const scaleParts: string[] = [];
    const concatParts: string[] = [];
    for (let i = 0; i < n; i++) {
      const vIn = i * 2;
      const aIn = i * 2 + 1;
      scaleParts.push(
        `[${vIn}:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2[v${i}]`,
      );
      concatParts.push(`[v${i}][${aIn}:a]`);
    }
    const filterComplex = `${scaleParts.join(';')};${concatParts.join('')}concat=n=${n}:v=1:a=1[outv][outa]`;

    const outputName = 'output.mp4';

    const args = [
      ...inputs,
      '-filter_complex',
      filterComplex,
      '-map',
      '[outv]',
      '-map',
      '[outa]',
      '-c:v',
      'libx264',
      '-c:a',
      'aac',
      '-b:v',
      '1M',
      '-shortest',
      '-y',
      outputName,
    ];

    await ffmpeg.run(...args);

    const data = ffmpeg.FS('readFile', outputName);
    const blob = new Blob([data.buffer], { type: 'video/mp4' });

    // 4) Supabase Storage 업로드
    const filePath = `${projectId}/videos/final.mp4`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('projects')
      .upload(filePath, blob, {
        contentType: 'video/mp4',
        upsert: true,
      });

    if (uploadError || !uploadData) {
      return { error: 'Failed to upload video.' };
    }

    const { data: publicUrlData } = supabase.storage.from('projects').getPublicUrl(uploadData.path);
    const videoUrl = publicUrlData.publicUrl;

    // 5) project_steps에 video URL 저장 (DB 구조 유지)
    await supabase
      .from('project_steps')
      .update({
        status: 'completed',
        output_data: { videoUrl },
      })
      .eq('project_id', projectId)
      .eq('step', 'video');

    return { data: { videoUrl } };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Video render failed.';
    return { error: message };
  }
}

