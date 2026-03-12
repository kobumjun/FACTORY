import { createAdminClient } from '@/lib/supabase/admin';

export default async function AdminPage() {
  const admin = createAdminClient();
  const { count: userCount } = await admin.from('profiles').select('*', { count: 'exact', head: true });
  const { count: projectCount } = await admin.from('projects').select('*', { count: 'exact', head: true });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">관리자 대시보드</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <p className="text-3xl font-bold text-emerald-500">{userCount ?? 0}</p>
          <p className="mt-1 text-sm text-zinc-500">총 유저</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <p className="text-3xl font-bold text-emerald-500">{projectCount ?? 0}</p>
          <p className="mt-1 text-sm text-zinc-500">총 프로젝트</p>
        </div>
      </div>
    </div>
  );
}
