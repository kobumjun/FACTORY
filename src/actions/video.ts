'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { useCredits } from '@/lib/services/credits';
import { CREDITS } from '@/lib/constants';
import { renderVideo } from '@/lib/ffmpeg';
import { writeFile, readFile, unlink } from 'fs/promises';
import path from 'path';
import os from 'os';

export async function renderProjectVideo(projectId: string) {
  const supabase = await createClient();
  const admin = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: '로그인이 필요합니다.' };

  const { data: project } = await supabase.from('projects').select('user_id').eq('id', projectId).eq('user_id', user.id).single();
  if (!project) return { error: '프로젝트를 찾을 수 없습니다.' };

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
    return { error: '이미지와 TTS를 먼저 생성해주세요.' };
  }

  const creditsOk = await useCredits(user.id, CREDITS.video, 'usage', {
    id: projectId,
    type: 'project_step',
  });
  if (!creditsOk.ok) return { error: creditsOk.error };

  await admin.from('project_steps').update({
    status: 'processing',
    updated_at: new Date().toISOString(),
  }).eq('project_id', projectId).eq('step', 'video');

  const tmpDir = os.tmpdir();
  const imagePaths: string[] = [];
  const audioPaths: string[] = [];

  try {
    for (let i = 0; i < imageUrls.length; i++) {
      const imgRes = await fetch(imageUrls[i]);
      const imgBuf = Buffer.from(await imgRes.arrayBuffer());
      const imgPath = path.join(tmpDir, `vid-${projectId}-img-${i}.png`);
      await writeFile(imgPath, imgBuf);
      imagePaths.push(imgPath);

      const audRes = await fetch(audioUrls[i]);
      const audBuf = Buffer.from(await audRes.arrayBuffer());
      const audPath = path.join(tmpDir, `vid-${projectId}-aud-${i}.mp3`);
      await writeFile(audPath, audBuf);
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
      credits_used: CREDITS.video,
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
