'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { ProjectTemplate } from '@/types/database';
import { STEPS } from '@/lib/constants';

export async function createProject(topic: string, template: ProjectTemplate) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Please sign in.' };

  const name = topic.slice(0, 50) || 'New project';

  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      name,
      topic,
      template,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  // 초기 project_steps 생성
  const steps = STEPS.map((step) => ({
    project_id: project.id,
    step,
    status: step === 'script' ? 'pending' : 'pending',
  }));

  await supabase.from('project_steps').insert(steps);

  revalidatePath('/dashboard');
  return { data: project };
}

export async function getProjects() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: 'Please sign in.' };

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) return { data: [], error: error.message };
  return { data: data ?? [] };
}

export async function getProject(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: '로그인이 필요합니다.' };

  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !project) return { data: null, error: error?.message ?? 'Project not found.' };

  const { data: steps } = await supabase
    .from('project_steps')
    .select('*')
    .eq('project_id', id)
    .order('created_at');

  return { data: { ...project, steps: steps ?? [] } };
}
