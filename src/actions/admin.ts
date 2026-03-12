'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { addCredits } from '@/lib/services/credits';

export async function getUsers(limit = 50, offset = 0) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: 'Unauthorized' };

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return { data: [], error: 'Admin only' };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('profiles')
    .select('id, email, full_name, role, credits, created_at')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  return { data: data ?? [], error: error?.message };
}

export async function adjustCredits(userId: string, amount: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return { error: 'Admin only' };

  if (amount > 0) {
    await addCredits(userId, amount, 'admin_adjust', { id: user.id, type: 'admin' });
  }
  return { data: { ok: true } };
}

export async function getGenerationLogs(limit = 100) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: 'Unauthorized' };

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return { data: [], error: 'Admin only' };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('generation_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  return { data: data ?? [], error: error?.message };
}
