import Link from 'next/link';
import { signOut } from '@/actions/auth';

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-zinc-800 bg-zinc-900/80 backdrop-blur">
      <div className="flex h-full flex-col p-4">
        <Link href="/dashboard" className="mb-8 text-xl font-bold text-emerald-500">
          AI Content Factory
        </Link>
        <nav className="flex flex-col gap-1">
          <Link
            href="/dashboard"
            className="rounded-lg px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            프로젝트
          </Link>
          <Link
            href="/dashboard/credits"
            className="rounded-lg px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            크레딧
          </Link>
          <Link
            href="/admin"
            className="rounded-lg px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            관리자
          </Link>
        </nav>
        <div className="mt-auto">
          <form action={signOut}>
            <button
              type="submit"
              className="w-full rounded-lg px-4 py-3 text-left text-sm text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
            >
              로그아웃
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
