import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { ensureStarterCredits } from '@/lib/services/credits';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  const { data: starterTx } = await supabase
    .from('credit_transactions')
    .select('id')
    .eq('user_id', user.id)
    .eq('reference_type', 'starter_bonus')
    .limit(1)
    .maybeSingle();

  if (!starterTx) {
    await ensureStarterCredits(user.id);
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('credits, role')
    .eq('id', user.id)
    .single();

  return (
    <div className="min-h-screen">
      <Sidebar isAdmin={profile?.role === 'admin'} />
      <main className="pl-64">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-zinc-800 bg-zinc-900 px-6">
          <span className="text-sm text-zinc-500">Dashboard</span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-400">
              Credits: <strong className="text-white">{profile?.credits ?? 0}</strong>
            </span>
          </div>
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
