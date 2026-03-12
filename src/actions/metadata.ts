'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getLLMProvider } from '@/lib/providers/llm';

export async function generateMetadata(projectId: string) {
  const supabase = await createClient();
  const admin = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: '로그인이 필요합니다.' };

  const { data: project } = await supabase.from('projects').select('user_id, topic').eq('id', projectId).eq('user_id', user.id).single();
  if (!project) return { error: '프로젝트를 찾을 수 없습니다.' };

  const { data: scriptStep } = await supabase
    .from('project_steps')
    .select('output_data')
    .eq('project_id', projectId)
    .eq('step', 'script')
    .single();

  const script = (scriptStep?.output_data as { script?: string })?.script;
  if (!script) return { error: '스크립트가 없습니다.' };

  await admin.from('project_steps').update({
    status: 'processing',
    updated_at: new Date().toISOString(),
  }).eq('project_id', projectId).eq('step', 'metadata');

  const llm = getLLMProvider();
  const prompt = `다음 쇼츠 영상의 메타데이터를 JSON으로 생성해주세요.
주제: ${project.topic}
스크립트 요약: ${script.slice(0, 200)}

다음 형식의 JSON만 출력하세요 (다른 텍스트 없이):
{
  "title": "클릭을 부르는 제목 (50자 이내)",
  "description": "유튜브 설명란용 2~3문장",
  "hashtags": ["태그1", "태그2", "태그3", "태그4", "태그5"],
  "pinnedComment": "고정 댓글용 문구",
  "thumbnailCaption": "썸네일 문구 (짧게)"
}`;

  try {
    const raw = await llm.generateText(prompt);
    const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();
    const metadata = JSON.parse(cleaned);

    await admin.from('project_steps').update({
      status: 'completed',
      output_data: metadata,
      updated_at: new Date().toISOString(),
    }).eq('project_id', projectId).eq('step', 'metadata');

    revalidatePath(`/dashboard/projects/${projectId}`);
    return { data: metadata };
  } catch (e) {
    const err = e instanceof Error ? e.message : '메타데이터 생성 실패';
    await admin.from('project_steps').update({
      status: 'failed',
      error_message: err,
      updated_at: new Date().toISOString(),
    }).eq('project_id', projectId).eq('step', 'metadata');
    revalidatePath(`/dashboard/projects/${projectId}`);
    return { error: err };
  }
}
