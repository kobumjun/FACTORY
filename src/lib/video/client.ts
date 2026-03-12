'use client';

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { createClient } from '@/lib/supabase/client';
import { MAX_VIDEO_SCENES } from '@/lib/constants';

type RenderResult =
  | { data: { videoUrl: string } }
  | { error: string };

let ffmpegInstance: FFmpeg | null = null;

async function ensureFFmpegLoaded(): Promise<FFmpeg> {
  if (!ffmpegInstance) {
    console.log('[VideoClient] Creating FFmpeg instance');
    ffmpegInstance = new FFmpeg();
    console.log('[VideoClient] Loading FFmpeg core/WASM');
    await ffmpegInstance.load();
    console.log('[VideoClient] FFmpeg loaded');
  }
  return ffmpegInstance;
}

export async function renderVideoInBrowser(projectId: string): Promise<RenderResult> {
  try {
    console.log('[VideoClient] renderVideoInBrowser called', { projectId });
    const supabase = createClient();

    // 1) 이미지 / TTS 단계에서 생성된 URL 가져오기
    console.log('[VideoClient] Fetching image step data');
    const { data: imagesStep, error: imagesError } = await supabase
      .from('project_steps')
      .select('output_data')
      .eq('project_id', projectId)
      .eq('step', 'images')
      .single();

    if (imagesError) {
      console.error('[VideoClient] Failed to load images step', imagesError);
      return { error: 'Failed to load images step.' };
    }

    console.log('[VideoClient] Fetching TTS step data');
    const { data: ttsStep, error: ttsError } = await supabase
      .from('project_steps')
      .select('output_data')
      .eq('project_id', projectId)
      .eq('step', 'tts')
      .single();

    if (ttsError) {
      console.error('[VideoClient] Failed to load TTS step', ttsError);
      return { error: 'Failed to load TTS step.' };
    }

    const imageUrls = (imagesStep?.output_data as { imageUrls?: string[] })?.imageUrls;
    const audioUrls = (ttsStep?.output_data as { audioUrls?: string[] })?.audioUrls;

    if (!Array.isArray(imageUrls) || !Array.isArray(audioUrls) || imageUrls.length === 0 || audioUrls.length === 0) {
      console.error('[VideoClient] Invalid image/audio URLs', { imageUrls, audioUrls });
      return { error: 'Generate images and TTS first.' };
    }

    const capped = Math.min(imageUrls.length, audioUrls.length, MAX_VIDEO_SCENES);
    const imageUrlsSliced = imageUrls.slice(0, capped);
    const audioUrlsSliced = audioUrls.slice(0, capped);

    // 2) ffmpeg.wasm 로드
    console.log('[VideoClient] Start ffmpeg load');
    const ffmpeg = await ensureFFmpegLoaded();
    console.log('[VideoClient] ffmpeg ready');

    // 3) 입력 파일을 가상 FS에 기록
    console.log('[VideoClient] Start writing files to ffmpeg FS', { scenes: capped });
    for (let i = 0; i < imageUrlsSliced.length; i++) {
      const imgName = `img-${i}.png`;
      const audName = `aud-${i}.mp3`;
      await ffmpeg.writeFile(imgName, await fetchFile(imageUrlsSliced[i]));
      await ffmpeg.writeFile(audName, await fetchFile(audioUrlsSliced[i]));
    }

    const n = imageUrlsSliced.length;
    const width = 720;
    const height = 1280;
    const vf = `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`;

    // 4) 장면별로 단순 -vf 한 번씩 실행 (filter_complex 멈춤 회피), 이후 concat
    for (let i = 0; i < n; i++) {
      const sceneOut = `scene-${i}.mp4`;
      const args = [
        '-threads', '1',
        '-loop', '1', '-i', `img-${i}.png`, '-i', `aud-${i}.mp3`,
        '-vf', vf,
        '-c:v', 'libx264', '-c:a', 'aac', '-b:v', '1M',
        '-shortest', '-y', sceneOut,
      ];
      console.log('[VideoClient] Start ffmpeg exec scene', i, { args });
      await ffmpeg.exec(args);
      console.log('[VideoClient] ffmpeg exec scene', i, 'finished');
    }

    // 5) concat demuxer로 합치기 (재인코딩 없음)
    const listLines = Array.from({ length: n }, (_, i) => `file 'scene-${i}.mp4'`);
    const listContent = listLines.join('\n');
    await ffmpeg.writeFile('list.txt', new TextEncoder().encode(listContent));

    const outputName = 'output.mp4';
    const concatArgs = ['-f', 'concat', '-safe', '0', '-i', 'list.txt', '-c', 'copy', '-y', outputName];
    console.log('[VideoClient] Start ffmpeg concat', { concatArgs });
    await ffmpeg.exec(concatArgs);
    console.log('[VideoClient] ffmpeg exec finished');

    // 6) Blob 생성
    console.log('[VideoClient] Start blob creation');
    const data = (await ffmpeg.readFile(outputName)) as Uint8Array;
    const safeUint8 = new Uint8Array(data);
    const blob = new Blob([safeUint8], { type: 'video/mp4' });

    // 7) Supabase Storage 업로드
    const filePath = `${projectId}/videos/final.mp4`;
    console.log('[VideoClient] Start Supabase upload', { filePath });
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('projects')
      .upload(filePath, blob, {
        contentType: 'video/mp4',
        upsert: true,
      });

    if (uploadError || !uploadData) {
      console.error('[VideoClient] Upload failed', uploadError);
      return { error: 'Failed to upload video.' };
    }

    const { data: publicUrlData } = supabase.storage.from('projects').getPublicUrl(uploadData.path);
    const videoUrl = publicUrlData.publicUrl;
    console.log('[VideoClient] Upload finished', { videoUrl });

    // 8) project_steps에 video URL 저장 (DB 구조 유지)
    await supabase
      .from('project_steps')
      .update({
        status: 'completed',
        output_data: { videoUrl },
      })
      .eq('project_id', projectId)
      .eq('step', 'video');

    console.log('[VideoClient] Final success', { videoUrl });
    return { data: { videoUrl } };
  } catch (e) {
    console.error('[VideoClient] Video render failed', e);
    const message = e instanceof Error ? e.message : 'Video render failed.';
    return { error: message };
  }
}

