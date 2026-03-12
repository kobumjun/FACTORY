'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const MIN_SCENES = 3;
const MAX_SCENES = 5;

interface ReelScene {
  narration?: string;
  visualDirection?: string;
}

interface ReelComposition {
  concept?: string;
  hook?: string;
  mood?: string;
  ending?: string;
  scenes?: ReelScene[];
}

export async function splitScenes(projectId: string, _options?: { bundled?: boolean }) {
  const supabase = await createClient();
  const admin = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Please sign in.' };

  const { data: project } = await supabase.from('projects').select('user_id').eq('id', projectId).eq('user_id', user.id).single();
  if (!project) return { error: 'Project not found.' };

  const { data: scriptStep } = await supabase
    .from('project_steps')
    .select('output_data')
    .eq('project_id', projectId)
    .eq('step', 'script')
    .single();

  const scriptRaw = (scriptStep?.output_data as { script?: string })?.script;
  if (!scriptRaw) return { error: 'Generate a script first.' };

  await admin.from('project_steps').update({
    status: 'processing',
    updated_at: new Date().toISOString(),
  }).eq('project_id', projectId).eq('step', 'scenes');

  try {
    const cleaned = scriptRaw.replace(/```json\n?|\n?```/g, '').trim();
    const comp = JSON.parse(cleaned) as ReelComposition;
    const rawScenes = Array.isArray(comp.scenes) ? comp.scenes : [];

    const scenes: string[] = [];
    const visualDirections: string[] = [];

    for (let i = 0; i < Math.min(rawScenes.length, MAX_SCENES); i++) {
      const s = rawScenes[i];
      const narr = (s?.narration || '').trim();
      const visual = (s?.visualDirection || '').trim();
      if (narr) {
        scenes.push(narr);
        visualDirections.push(visual || narr);
      }
    }

    if (scenes.length < MIN_SCENES) {
      throw new Error(`Need at least ${MIN_SCENES} scenes, got ${scenes.length}`);
    }

    await admin.from('project_steps').update({
      status: 'completed',
      output_data: { scenes, visualDirections },
      updated_at: new Date().toISOString(),
    }).eq('project_id', projectId).eq('step', 'scenes');

    revalidatePath(`/dashboard/projects/${projectId}`);
    return { data: { scenes } };
  } catch (e) {
    const err = e instanceof Error ? e.message : 'Invalid reel composition format';
    await admin.from('project_steps').update({
      status: 'failed',
      error_message: err,
      updated_at: new Date().toISOString(),
    }).eq('project_id', projectId).eq('step', 'scenes');
    revalidatePath(`/dashboard/projects/${projectId}`);
    return { error: err };
  }
}
