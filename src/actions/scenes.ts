'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getLLMProvider } from '@/lib/providers/llm';

const MAX_SCENES = 4;

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

  const script = (scriptStep?.output_data as { script?: string })?.script;
  if (!script) return { error: 'Generate a script first.' };

  await admin.from('project_steps').update({
    status: 'processing',
    updated_at: new Date().toISOString(),
  }).eq('project_id', projectId).eq('step', 'scenes');

  const llm = getLLMProvider();
  const prompt = `다음 쇼츠 스크립트를 장면 단위로 나눠주세요.
각 장면은 한 화면에 표시될 문장입니다.
JSON 배열로만 출력하세요. 예: ["첫 번째 문장", "두 번째 문장"]

스크립트:
${script}`;

  let raw = '';
  try {
    raw = await llm.generateText(prompt);
    const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();
    let scenes = JSON.parse(cleaned) as string[];
    if (!Array.isArray(scenes) || scenes.length === 0) throw new Error('Invalid scenes format');
    scenes = scenes.slice(0, MAX_SCENES);

    await admin.from('project_steps').update({
      status: 'completed',
      output_data: { scenes },
      updated_at: new Date().toISOString(),
    }).eq('project_id', projectId).eq('step', 'scenes');

    revalidatePath(`/dashboard/projects/${projectId}`);
    return { data: { scenes } };
  } catch (e) {
    const err = e instanceof Error ? e.message : '장면 분할 실패';
    await admin.from('project_steps').update({
      status: 'failed',
      error_message: err,
      updated_at: new Date().toISOString(),
    }).eq('project_id', projectId).eq('step', 'scenes');
    revalidatePath(`/dashboard/projects/${projectId}`);
    return { error: err };
  }
}
