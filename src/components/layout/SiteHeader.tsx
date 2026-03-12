import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { signOut } from '@/actions/auth';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';

export default async function SiteHeader() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <header className="border-b border-zinc-800 bg-zinc-950">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight text-white">
          AI Content Factory
        </Link>
        <nav className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-200 hover:border-zinc-600 hover:bg-zinc-800 hover:text-white"
              >
                Dashboard
              </Link>
              <form action={signOut} className="inline">
                <button
                  type="submit"
                  className="border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-400 hover:border-zinc-600 hover:bg-zinc-800 hover:text-zinc-200"
                >
                  Logout
                </button>
              </form>
            </>
          ) : (
            <GoogleSignInButton
              className="border border-zinc-600 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100"
            />
          )}
        </nav>
      </div>
    </header>
  );
}
