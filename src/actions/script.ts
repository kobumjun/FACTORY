'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getLLMProvider } from '@/lib/providers/llm';
import { useCredits } from '@/lib/services/credits';
import { CREDITS } from '@/lib/constants';
import type { ProjectTemplate } from '@/types/database';

const REEL_PROMPTS: Record<ProjectTemplate, string> = {
  meme: `[Meme 릴스]
- 짧고 강한 훅, 밈처럼 바로 이해되는 상황
- 과장된 표정/구도/상황, 웃기고 임팩트 있게
- 짧고 중독성 있는 리듬, 실제 릴스 밈 영상 느낌`,
  story: `[Story 릴스]
- 진중하고 몰입감 있는 분위기
- 철학, 인간관계, 삶, 감정, 관찰, 짧은 서사
- 감정선과 장면 전환이 자연스럽고 진지하게`,
};

export async function generateScript(projectId: string, options?: { bundled?: boolean }) {
  const supabase = await createClient();
  const admin = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Please sign in.' };

  const { data: project } = await supabase
    .from('projects')
    .select('topic, template')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single();

  if (!project) return { error: 'Project not found.' };

  const { hasShortCreditForProject } = await import('@/lib/services/credits');
  const skipCredit = options?.bundled ?? (await hasShortCreditForProject(user.id, projectId));
  if (!skipCredit) {
    const creditsOk = await useCredits(user.id, CREDITS.script, 'usage', {
      id: projectId,
      type: 'project_step',
    });
    if (!creditsOk.ok) return { error: creditsOk.error };
  }

  await admin.from('project_steps').update({
    status: 'processing',
    updated_at: new Date().toISOString(),
  }).eq('project_id', projectId).eq('step', 'script');

  const reelTone = REEL_PROMPTS[project.template as ProjectTemplate];
  const llm = getLLMProvider();

  const prompt = `당신은 릴스/쇼츠용 연출 기획자입니다. 사용자 주제를 바탕으로 "릴스 구성안"을 JSON으로 작성하세요.

주제: ${project.topic}

톤: ${reelTone}

LANGUAGE (MANDATORY):
- Generate the narration in English only.
- Do not generate Korean text.
- Ensure the narration is written entirely in English.
- concept, hook, mood, ending, and narration must all be in English.

아래 형식의 JSON만 출력하세요 (다른 설명 없이):
{
  "concept": "Overall reel concept in one sentence (English)",
  "hook": "Hook for first 3 seconds (English)",
  "mood": "Overall mood/pacing (English)",
  "ending": "Ending beat (English)",
  "scenes": [
    {
      "narration": "Narration line for TTS (English only)",
      "visualDirection": "subject, expression, composition, framing, background, lighting, style tag, emotional tone (English)"
    }
  ]
}

요구사항:
- scenes 개수는 3~5개
- narration은 TTS로 읽힐 문장 (짧고 임팩트 있게, 반드시 영어)
- visualDirection은 각 장면의 시각 연출을 구체적으로 (이미지 생성용, 영어). photorealistic, realistic, cinematic photo, lifelike 등 실사/사진 관련 단어는 사용하지 말고, 2D cartoon/animation 스타일 용어만 사용하세요.`;

  const start = Date.now();
  let raw = '';
  try {
    raw = await llm.generateText(prompt);
  } catch (e) {
    const err = e instanceof Error ? e.message : 'LLM 오류';
    await admin.from('project_steps').update({
      status: 'failed',
      error_message: err,
      updated_at: new Date().toISOString(),
    }).eq('project_id', projectId).eq('step', 'script');
    if (!skipCredit) {
      await admin.from('credit_transactions').insert({
        user_id: user.id,
        amount: CREDITS.script,
        balance_after: 0,
        type: 'refund',
        reference_id: projectId,
        reference_type: 'project_step',
      });
    }
    revalidatePath(`/dashboard/projects/${projectId}`);
    return { error: err };
  }

  const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();
  const script = cleaned;

  await admin.from('project_steps').update({
    status: 'completed',
    output_data: { script },
    credits_used: skipCredit ? 0 : CREDITS.script,
    updated_at: new Date().toISOString(),
  }).eq('project_id', projectId).eq('step', 'script');

  await admin.from('generation_logs').insert({
    user_id: user.id,
    project_id: projectId,
    step: 'script',
    status: 'success',
    provider: process.env.LLM_PROVIDER || 'openai',
    credits_used: skipCredit ? 0 : CREDITS.script,
    duration_ms: Date.now() - start,
  });

  revalidatePath(`/dashboard/projects/${projectId}`);
  return { data: { script } };
}
