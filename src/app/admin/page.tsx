import { createAdminClient } from '@/lib/supabase/admin';

export default async function AdminPage() {
  const admin = createAdminClient();
  const { count: userCount } = await admin.from('profiles').select('*', { count: 'exact', head: true });
  const { count: projectCount } = await admin.from('projects').select('*', { count: 'exact', head: true });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Admin dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-3xl font-bold text-white">{userCount ?? 0}</p>
          <p className="mt-1 text-sm text-zinc-500">Total users</p>
        </div>
        <div className="border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-3xl font-bold text-white">{projectCount ?? 0}</p>
          <p className="mt-1 text-sm text-zinc-500">Total projects</p>
        </div>
      </div>
    </div>
  );
}
