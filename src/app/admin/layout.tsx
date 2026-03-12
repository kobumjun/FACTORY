import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin" className="font-medium text-white hover:underline">Admin</Link>
        <Link href="/admin/users" className="text-zinc-400 hover:text-white">Users</Link>
        <Link href="/admin/logs" className="text-zinc-400 hover:text-white">Logs</Link>
      </div>
      {children}
    </div>
  );
}
