'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { useCredits } from '@/lib/services/credits';
import { CREDITS, MAX_VIDEO_SCENES } from '@/lib/constants';
import { renderVideo } from '@/lib/ffmpeg';
import { readFile, unlink } from 'fs/promises';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import path from 'path';
import os from 'os';

export async function renderProjectVideo(projectId: string, options?: { bundled?: boolean }) {
  const supabase = await createClient();
  const admin = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Please sign in.' };

  const { data: project } = await supabase.from('projects').select('user_id').eq('id', projectId).eq('user_id', user.id).single();
  if (!project) return { error: 'Project not found.' };

  const { data: imagesStep } = await supabase
    .from('project_steps')
    .select('output_data')
    .eq('project_id', projectId)
    .eq('step', 'images')
    .single();
  const { data: ttsStep } = await supabase
    .from('project_steps')
    .select('output_data')
    .eq('project_id', projectId)
    .eq('step', 'tts')
    .single();

  const imageUrls = (imagesStep?.output_data as { imageUrls?: string[] })?.imageUrls;
  const audioUrls = (ttsStep?.output_data as { audioUrls?: string[] })?.audioUrls;

  if (!Array.isArray(imageUrls) || !Array.isArray(audioUrls) || imageUrls.length !== audioUrls.length) {
    return { error: 'Generate images and TTS first.' };
  }

  const capped = Math.min(imageUrls.length, audioUrls.length, MAX_VIDEO_SCENES);
  const imageUrlsSliced = imageUrls.slice(0, capped);
  const audioUrlsSliced = audioUrls.slice(0, capped);

  const { hasShortCreditForProject } = await import('@/lib/services/credits');
  const skipCredit = options?.bundled ?? (await hasShortCreditForProject(user.id, projectId));
  if (!skipCredit) {
    const creditsOk = await useCredits(user.id, CREDITS.video, 'usage', {
      id: projectId,
      type: 'project_step',
    });
    if (!creditsOk.ok) return { error: creditsOk.error };
  }

  await admin.from('project_steps').update({
    status: 'processing',
    updated_at: new Date().toISOString(),
  }).eq('project_id', projectId).eq('step', 'video');

  const tmpDir = os.tmpdir();
  const imagePaths: string[] = [];
  const audioPaths: string[] = [];

  try {
    for (let i = 0; i < imageUrlsSliced.length; i++) {
      const imgPath = path.join(tmpDir, `vid-${projectId}-img-${i}.png`);
      const imgRes = await fetch(imageUrlsSliced[i]);
      if (!imgRes.body) throw new Error('No image body');
      await pipeline(Readable.fromWeb(imgRes.body as globalThis.ReadableStream<Uint8Array>), createWriteStream(imgPath));
      imagePaths.push(imgPath);

      const audPath = path.join(tmpDir, `vid-${projectId}-aud-${i}.mp3`);
      const audRes = await fetch(audioUrlsSliced[i]);
      if (!audRes.body) throw new Error('No audio body');
      await pipeline(Readable.fromWeb(audRes.body as globalThis.ReadableStream<Uint8Array>), createWriteStream(audPath));
      audioPaths.push(audPath);
    }

    const outputPath = path.join(tmpDir, `vid-${projectId}-output.mp4`);
    await renderVideo({ images: imagePaths, audios: audioPaths, outputPath });

    const videoBuffer = await readFile(outputPath);

    const { data: uploadData, error } = await admin.storage
      .from('projects')
      .upload(`${projectId}/videos/final.mp4`, videoBuffer, {
        contentType: 'video/mp4',
        upsert: true,
      });

    let videoUrl = '';
    if (!error) {
      const { data } = admin.storage.from('projects').getPublicUrl(uploadData.path);
      videoUrl = data.publicUrl;
    }

    for (const p of [...imagePaths, ...audioPaths, outputPath]) {
      try { await unlink(p); } catch {}
    }

    await admin.from('project_steps').update({
      status: 'completed',
      output_data: { videoUrl },
      credits_used: skipCredit ? 0 : CREDITS.video,
      updated_at: new Date().toISOString(),
    }).eq('project_id', projectId).eq('step', 'video');

    revalidatePath(`/dashboard/projects/${projectId}`);
    return { data: { videoUrl } };
  } catch (e) {
    const err = e instanceof Error ? e.message : '영상 합성 실패';
    for (const p of [...imagePaths, ...audioPaths]) {
      try { await unlink(p); } catch {}
    }
    await admin.from('project_steps').update({
      status: 'failed',
      error_message: err,
      updated_at: new Date().toISOString(),
    }).eq('project_id', projectId).eq('step', 'video');
    revalidatePath(`/dashboard/projects/${projectId}`);
    return { error: err };
  }
}
