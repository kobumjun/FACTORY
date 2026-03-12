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
  if (profile?.role !== 'admin') redirect('/dashboard');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin" className="font-medium text-white hover:underline">관리자</Link>
        <Link href="/admin/users" className="text-zinc-400 hover:text-white">유저</Link>
        <Link href="/admin/logs" className="text-zinc-400 hover:text-white">로그</Link>
      </div>
      {children}
    </div>
  );
}
