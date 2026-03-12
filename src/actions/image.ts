'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getImageProvider } from '@/lib/providers/image';
import { useCredits } from '@/lib/services/credits';
import { CREDITS } from '@/lib/constants';
import type { ProjectTemplate } from '@/types/database';

const NEGATIVE_PROMPT = 'photorealistic, realism, photography, DSLR, camera lens, cinematic photo lighting, realistic skin texture, pores, hyperrealism, 3d render, octane render, blender render, ultra detailed skin, realistic human face, lifelike photo, modern digital painting realism';

const STORY_STYLE_BLOCK = `STYLE: 1990s western animated series (classic superhero animation style)

Create a 2D cel-animated illustration that looks like a frame from a dark 1990s animated TV series.

VISUAL STYLE RULES (VERY IMPORTANT):
- 2D cel animation
- thick black outlines
- flat colors
- strong dramatic shadows
- noir lighting
- stylized cartoon characters
- simplified facial features
- bold shapes
- minimal texture
- high contrast lighting
- animated series frame composition
- hand-drawn cartoon look
- western superhero animated show style

ABSOLUTE STYLE REQUIREMENTS:
- must look like traditional animation
- must look like a cartoon frame
- must NOT look like a photo
- must NOT look realistic`;

const MEME_STYLE_BLOCK = `STYLE: Exaggerated 2D cartoon meme frame

Create a 2D cel-animated illustration for a short meme reel.

VISUAL STYLE RULES (VERY IMPORTANT):
- 2D cartoon only
- exaggerated cartoon
- punchy meme frame
- bold facial expression
- comic-like exaggeration
- thick outlines, flat colors
- fast readability, bold contrast
- humorous cartoon energy
- must look like a cartoon
- must NOT look like a photo
- must NOT look realistic`;

const COMPOSITION_BLOCK = 'COMPOSITION: cinematic animated series framing, dramatic lighting, stylized cartoon environment. Vertical 9:16. No text overlay.';

function buildImagePrompt(template: ProjectTemplate, sceneDescription: string): { prompt: string; negativePrompt: string; stylePreset: string } {
  const styleBlock = template === 'story' ? STORY_STYLE_BLOCK : MEME_STYLE_BLOCK;

  const prompt = `${styleBlock}

SCENE DESCRIPTION:
${sceneDescription}

${COMPOSITION_BLOCK}`;

  return {
    prompt,
    negativePrompt: NEGATIVE_PROMPT,
    stylePreset: 'digital-art',
  };
}

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
  const imageProvider = getImageProvider();
  const imageUrls: string[] = [];

  try {
    for (let i = 0; i < scenes.length; i++) {
      const sceneDesc = (typeof visualDirections[i] === 'string' ? visualDirections[i] : scenes[i]) || '';
      const { prompt, negativePrompt, stylePreset } = buildImagePrompt(template, sceneDesc);

      const url = await imageProvider.generateImage(prompt, {
        negativePrompt,
        stylePreset,
      });
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
