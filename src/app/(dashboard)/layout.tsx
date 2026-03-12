import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';

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

  const { data: profile } = await supabase
    .from('profiles')
    .select('credits, role')
    .eq('id', user.id)
    .single();

  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="pl-64">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-zinc-800 bg-zinc-900 px-6">
          <span className="text-sm text-zinc-500">대시보드</span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-400">
              크레딧: <strong className="text-white">{profile?.credits ?? 0}</strong>
            </span>
          </div>
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
