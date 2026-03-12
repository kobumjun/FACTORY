import { createAdminClient } from '@/lib/supabase/admin';
import type { CreditTransactionType } from '@/types/database';

export async function getCredits(userId: string): Promise<number> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', userId)
    .single();
  return data?.credits ?? 0;
}

export async function useCredits(
  userId: string,
  amount: number,
  type: CreditTransactionType,
  reference: { id: string; type: string }
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', userId)
    .single();

  const current = profile?.credits ?? 0;
  if (current < amount) {
    return { ok: false, error: 'Insufficient credits.' };
  }

  const newBalance = current - amount;

  await supabase.from('profiles').update({ credits: newBalance, updated_at: new Date().toISOString() }).eq('id', userId);
  await supabase.from('credit_transactions').insert({
    user_id: userId,
    amount: -amount,
    balance_after: newBalance,
    type,
    reference_id: reference.id,
    reference_type: reference.type,
  });

  return { ok: true };
}

export async function addCredits(
  userId: string,
  amount: number,
  type: CreditTransactionType,
  reference: { id?: string; type?: string }
): Promise<void> {
  const supabase = createAdminClient();
  const { data: profile } = await supabase.from('profiles').select('credits').eq('id', userId).single();
  const current = profile?.credits ?? 0;
  const newBalance = current + amount;

  await supabase.from('profiles').update({ credits: newBalance, updated_at: new Date().toISOString() }).eq('id', userId);
  await supabase.from('credit_transactions').insert({
    user_id: userId,
    amount,
    balance_after: newBalance,
    type,
    reference_id: reference.id ?? null,
    reference_type: reference.type ?? null,
  });
}

const STARTER_CREDITS = 6;
const STARTER_REFERENCE_TYPE = 'starter_bonus';

/** First-login starter credits (6). Idempotent: only grants if no prior starter_bonus transaction. */
export async function ensureStarterCredits(userId: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from('credit_transactions')
    .select('id')
    .eq('user_id', userId)
    .eq('reference_type', STARTER_REFERENCE_TYPE)
    .limit(1)
    .maybeSingle();

  if (existing) return false;

  await addCredits(userId, STARTER_CREDITS, 'admin_adjust', { type: STARTER_REFERENCE_TYPE });
  return true;
}
