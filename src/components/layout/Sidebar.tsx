import Link from 'next/link';
import { signOut } from '@/actions/auth';

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-zinc-800 bg-zinc-900">
      <div className="flex h-full flex-col p-4">
        <Link href="/dashboard" className="mb-8 text-lg font-semibold text-white">
          AI Content Factory
        </Link>
        <nav className="flex flex-col gap-0">
          <Link
            href="/dashboard"
            className="border border-transparent px-4 py-3 text-sm text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800 hover:text-white"
          >
            프로젝트
          </Link>
          <Link
            href="/dashboard/credits"
            className="border border-transparent px-4 py-3 text-sm text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800 hover:text-white"
          >
            크레딧
          </Link>
          <Link
            href="/admin"
            className="border border-transparent px-4 py-3 text-sm text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800 hover:text-white"
          >
            관리자
          </Link>
        </nav>
        <div className="mt-auto">
          <form action={signOut}>
            <button
              type="submit"
              className="w-full border border-transparent px-4 py-3 text-left text-sm text-zinc-500 hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-300"
            >
              Logout
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
