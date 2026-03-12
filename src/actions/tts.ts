'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getTTSProvider } from '@/lib/providers/tts';
import { useCredits } from '@/lib/services/credits';
import { CREDITS } from '@/lib/constants';
import type { ProjectTemplate } from '@/types/database';

/** Meme: funny, exaggerated, short punchy. Story: calm male, low-energy, philosophical. */
function getVoiceForTemplate(template: ProjectTemplate): string | undefined {
  const provider = process.env.TTS_PROVIDER ?? 'elevenlabs';
  if (template === 'meme') {
    return provider === 'elevenlabs' ? process.env.ELEVENLABS_VOICE_ID_MEME : process.env.OPENAI_VOICE_MEME;
  }
  return provider === 'elevenlabs' ? (process.env.ELEVENLABS_VOICE_ID_STORY || process.env.ELEVENLABS_VOICE_ID) : (process.env.OPENAI_VOICE_STORY || process.env.OPENAI_VOICE);
}

export async function generateTTS(projectId: string, options?: { bundled?: boolean }) {
  const supabase = await createClient();
  const admin = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Please sign in.' };

  const { data: project } = await supabase.from('projects').select('user_id, template').eq('id', projectId).eq('user_id', user.id).single();
  if (!project) return { error: 'Project not found.' };

  const { data: scenesStep } = await supabase
    .from('project_steps')
    .select('output_data')
    .eq('project_id', projectId)
    .eq('step', 'scenes')
    .single();

  const scenes = (scenesStep?.output_data as { scenes?: string[] })?.scenes;
  if (!Array.isArray(scenes) || scenes.length === 0) return { error: 'Split scenes first.' };

  const { hasShortCreditForProject } = await import('@/lib/services/credits');
  const skipCredit = options?.bundled ?? (await hasShortCreditForProject(user.id, projectId));
  if (!skipCredit) {
    const creditsOk = await useCredits(user.id, CREDITS.tts, 'usage', {
      id: projectId,
      type: 'project_step',
    });
    if (!creditsOk.ok) return { error: creditsOk.error };
  }

  await admin.from('project_steps').update({
    status: 'processing',
    updated_at: new Date().toISOString(),
  }).eq('project_id', projectId).eq('step', 'tts');

  const template = (project.template || 'story') as ProjectTemplate;
  const voice = getVoiceForTemplate(template);

  const ttsProvider = getTTSProvider();
  const audioUrls: string[] = [];

  try {
    for (let i = 0; i < scenes.length; i++) {
      const buffer = await ttsProvider.generateSpeech(scenes[i], voice ? { voice } : undefined);
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
      credits_used: skipCredit ? 0 : CREDITS.tts,
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
