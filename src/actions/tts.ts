'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getTTSProvider } from '@/lib/providers/tts';
import { useCredits } from '@/lib/services/credits';
import { CREDITS } from '@/lib/constants';

export async function generateTTS(projectId: string) {
  const supabase = await createClient();
  const admin = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: '로그인이 필요합니다.' };

  const { data: project } = await supabase.from('projects').select('user_id').eq('id', projectId).eq('user_id', user.id).single();
  if (!project) return { error: '프로젝트를 찾을 수 없습니다.' };

  const { data: scenesStep } = await supabase
    .from('project_steps')
    .select('output_data')
    .eq('project_id', projectId)
    .eq('step', 'scenes')
    .single();

  const scenes = (scenesStep?.output_data as { scenes?: string[] })?.scenes;
  if (!Array.isArray(scenes) || scenes.length === 0) return { error: '먼저 장면을 분할해주세요.' };

  const creditsOk = await useCredits(user.id, CREDITS.tts, 'usage', {
    id: projectId,
    type: 'project_step',
  });
  if (!creditsOk.ok) return { error: creditsOk.error };

  await admin.from('project_steps').update({
    status: 'processing',
    updated_at: new Date().toISOString(),
  }).eq('project_id', projectId).eq('step', 'tts');

  const ttsProvider = getTTSProvider();
  const audioUrls: string[] = [];

  try {
    for (let i = 0; i < scenes.length; i++) {
      const buffer = await ttsProvider.generateSpeech(scenes[i]);
      const path = `${projectId}/tts/scene-${i}.mp3`;
      await admin.storage
        .from('projects')
        .upload(path, buffer, { contentType: 'audio/mpeg', upsert: true });
      const { data } = admin.storage.from('projects').getPublicUrl(path);
      audioUrls.push(data.publicUrl);
    }

    await admin.from('project_steps').update({
      status: 'completed',
      output_data: { audioUrls },
      credits_used: CREDITS.tts,
      updated_at: new Date().toISOString(),
    }).eq('project_id', projectId).eq('step', 'tts');

    revalidatePath(`/dashboard/projects/${projectId}`);
    return { data: { audioUrls } };
  } catch (e) {
    const err = e instanceof Error ? e.message : 'TTS 생성 실패';
    await admin.from('project_steps').update({
      status: 'failed',
      error_message: err,
      updated_at: new Date().toISOString(),
    }).eq('project_id', projectId).eq('step', 'tts');
    revalidatePath(`/dashboard/projects/${projectId}`);
    return { error: err };
  }
}
