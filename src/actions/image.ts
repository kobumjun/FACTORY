'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getImageProvider } from '@/lib/providers/image';
import { useCredits } from '@/lib/services/credits';
import { CREDITS } from '@/lib/constants';

export async function generateImages(projectId: string, options?: { bundled?: boolean }) {
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
    const totalCredits = scenes.length * CREDITS.imagePerScene;
    const creditsOk = await useCredits(user.id, totalCredits, 'usage', {
      id: projectId,
      type: 'project_step',
    });
    if (!creditsOk.ok) return { error: creditsOk.error };
  }

  await admin.from('project_steps').update({
    status: 'processing',
    updated_at: new Date().toISOString(),
  }).eq('project_id', projectId).eq('step', 'images');

  const imageProvider = getImageProvider();
  const styleMap: Record<string, string> = {
    motivation: 'modern motivational aesthetic, clean, professional',
    informative: 'clean infographic style, clear visuals',
    quotes: 'elegant typography, minimal background',
    horror: 'dark moody atmosphere, mysterious',
    health: 'bright fitness lifestyle, energetic',
  };
  const style = styleMap[project.template] || 'clean modern';

  const imageUrls: string[] = [];

  try {
    for (let i = 0; i < scenes.length; i++) {
      const prompt = `Vertical 9:16 image for shorts video. Scene: ${scenes[i]}. Style: ${style}. No text overlay. High quality.`;
      const url = await imageProvider.generateImage(prompt);
      imageUrls.push(url);
    }

    await admin.from('project_steps').update({
      status: 'completed',
      output_data: { imageUrls },
      credits_used: skipCredit ? 0 : scenes.length * CREDITS.imagePerScene,
      updated_at: new Date().toISOString(),
    }).eq('project_id', projectId).eq('step', 'images');

    revalidatePath(`/dashboard/projects/${projectId}`);
    return { data: { imageUrls } };
  } catch (e) {
    const err = e instanceof Error ? e.message : '이미지 생성 실패';
    await admin.from('project_steps').update({
      status: 'failed',
      error_message: err,
      updated_at: new Date().toISOString(),
    }).eq('project_id', projectId).eq('step', 'images');
    revalidatePath(`/dashboard/projects/${projectId}`);
    return { error: err };
  }
}
