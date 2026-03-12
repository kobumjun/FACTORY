'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getLLMProvider } from '@/lib/providers/llm';
import { useCredits } from '@/lib/services/credits';
import { CREDITS } from '@/lib/constants';
import type { ProjectTemplate } from '@/types/database';

const TEMPLATE_PROMPTS: Record<ProjectTemplate, string> = {
  motivation: '동기부여와 성장에 초점을 맞춘 짧고 임팩트 있는 톤으로',
  informative: '팩트 기반 정보를 쉽게 전달하는 톤으로',
  quotes: '명언이나 인용구 형식으로 짧고 감동적으로',
  horror: '공포·스릴러 분위기로 긴장감 있게',
  health: '운동·건강 팁을 실용적으로',
};

export async function generateScript(projectId: string) {
  const supabase = await createClient();
  const admin = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: '로그인이 필요합니다.' };

  const { data: project } = await supabase
    .from('projects')
    .select('topic, template')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single();

  if (!project) return { error: '프로젝트를 찾을 수 없습니다.' };

  const creditsOk = await useCredits(user.id, CREDITS.script, 'usage', {
    id: projectId,
    type: 'project_step',
  });
  if (!creditsOk.ok) return { error: creditsOk.error };

  await admin.from('project_steps').update({
    status: 'processing',
    updated_at: new Date().toISOString(),
  }).eq('project_id', projectId).eq('step', 'script');

  const templatePrompt = TEMPLATE_PROMPTS[project.template as ProjectTemplate];
  const llm = getLLMProvider();

  const prompt = `당신은 쇼츠(세로형 짧은 영상)용 스크립트 작가입니다.

주제: ${project.topic}
스타일: ${templatePrompt}

요구사항:
- 30~60초 분량 (약 100~200자)
- 문장을 3~6개의 장면으로 나눌 수 있게 작성
- 각 장면은 한 문장 또는 짧은 문단
- 쇼츠에 맞게 임팩트 있게

스크립트만 출력하고, 다른 설명은 하지 마세요.`;

  const start = Date.now();
  let script = '';
  try {
    script = await llm.generateText(prompt);
  } catch (e) {
    const err = e instanceof Error ? e.message : 'LLM 오류';
    await admin.from('project_steps').update({
      status: 'failed',
      error_message: err,
      updated_at: new Date().toISOString(),
    }).eq('project_id', projectId).eq('step', 'script');
    await admin.from('credit_transactions').insert({
      user_id: user.id,
      amount: CREDITS.script,
      balance_after: 0, // will need to refund - for MVP we skip
      type: 'refund',
      reference_id: projectId,
      reference_type: 'project_step',
    });
    revalidatePath(`/dashboard/projects/${projectId}`);
    return { error: err };
  }

  await admin.from('project_steps').update({
    status: 'completed',
    output_data: { script },
    credits_used: CREDITS.script,
    updated_at: new Date().toISOString(),
  }).eq('project_id', projectId).eq('step', 'script');

  await admin.from('generation_logs').insert({
    user_id: user.id,
    project_id: projectId,
    step: 'script',
    status: 'success',
    provider: process.env.LLM_PROVIDER || 'openai',
    credits_used: CREDITS.script,
    duration_ms: Date.now() - start,
  });

  revalidatePath(`/dashboard/projects/${projectId}`);
  return { data: { script } };
}
