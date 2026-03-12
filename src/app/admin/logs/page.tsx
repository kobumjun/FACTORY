import { getGenerationLogs } from '@/actions/admin';

export default async function AdminLogsPage() {
  const { data: logs } = await getGenerationLogs();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">생성 로그</h1>
      <div className="overflow-x-auto border border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900">
              <th className="px-4 py-3 text-left">일시</th>
              <th className="px-4 py-3 text-left">유저</th>
              <th className="px-4 py-3 text-left">프로젝트</th>
              <th className="px-4 py-3 text-left">단계</th>
              <th className="px-4 py-3 text-left">상태</th>
              <th className="px-4 py-3 text-left">크레딧</th>
              <th className="px-4 py-3 text-left">오류</th>
            </tr>
          </thead>
          <tbody>
            {(logs ?? []).map((log) => (
              <tr key={log.id} className="border-b border-zinc-800">
                <td className="px-4 py-3 text-zinc-500">{new Date(log.created_at).toLocaleString()}</td>
                <td className="px-4 py-3 truncate max-w-[120px]">{log.user_id}</td>
                <td className="px-4 py-3 truncate max-w-[120px]">{log.project_id ?? '-'}</td>
                <td className="px-4 py-3">{log.step}</td>
                <td className="px-4 py-3">
                  <span className={log.status === 'success' ? 'text-white' : 'text-red-400'}>
                    {log.status}
                  </span>
                </td>
                <td className="px-4 py-3">{log.credits_used ?? '-'}</td>
                <td className="px-4 py-3 max-w-[200px] truncate text-red-400">{log.error_message ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
