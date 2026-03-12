'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getImageProvider } from '@/lib/providers/image';
import { useCredits } from '@/lib/services/credits';
import { CREDITS } from '@/lib/constants';
import type { ProjectTemplate } from '@/types/database';

const IMAGE_STYLE_BASE = 'Vertical 9:16, cartoon, meme-like, stylish modern animation, clean digital illustration, cinematic anime-like framing. No photorealistic, no stock photo feel. No text overlay.';

const IMAGE_STYLE_BY_TEMPLATE: Record<ProjectTemplate, string> = {
  meme: `${IMAGE_STYLE_BASE} Exaggerated expression, absurd or punchy visual setup, fast readability, bold visual contrast, humorous cartoon energy, meme reel style.`,
  story: `${IMAGE_STYLE_BASE} Calm cinematic composition, modern anime illustration, emotional silence, introspective atmosphere, stylish urban or minimal background, soft but intentional lighting.`,
};

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

  const output = scenesStep?.output_data as { scenes?: string[]; visualDirections?: string[] } | null;
  const scenes = output?.scenes ?? [];
  const visualDirections = output?.visualDirections ?? scenes;

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

  const template = (project.template || 'story') as ProjectTemplate;
  const styleSuffix = IMAGE_STYLE_BY_TEMPLATE[template];

  const imageProvider = getImageProvider();
  const imageUrls: string[] = [];

  try {
    for (let i = 0; i < scenes.length; i++) {
      const visual = visualDirections[i] || scenes[i];
      const prompt = `Scene ${i + 1}: ${visual}. Style: ${styleSuffix}`;
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
