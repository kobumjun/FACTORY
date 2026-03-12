'use server';

import { createClient } from '@/lib/supabase/server';
import { getCredits } from '@/lib/services/credits';

export async function getUserCredits(): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;
  return getCredits(user.id);
}
