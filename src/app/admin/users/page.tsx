import { getUsers } from '@/actions/admin';
import AdjustCreditsForm from './AdjustCreditsForm';

export default async function AdminUsersPage() {
  const { data: users } = await getUsers();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Users</h1>
      <div className="overflow-x-auto border border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900">
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Credits</th>
              <th className="px-4 py-3 text-left">Joined</th>
              <th className="px-4 py-3 text-left">Adjust credits</th>
            </tr>
          </thead>
          <tbody>
            {(users ?? []).map((u) => (
              <tr key={u.id} className="border-b border-zinc-800">
                <td className="px-4 py-3">{u.email ?? '-'}</td>
                <td className="px-4 py-3">{u.full_name ?? '-'}</td>
                <td className="px-4 py-3">{u.role}</td>
                <td className="px-4 py-3">{u.credits}</td>
                <td className="px-4 py-3 text-zinc-500">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <AdjustCreditsForm userId={u.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
