import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-4xl font-bold">AI Content Factory</h1>
      <p className="text-zinc-400 text-center max-w-md">
        주제만 입력하면 쇼츠 영상을 자동으로 만들어줍니다.
      </p>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="rounded-lg bg-zinc-800 px-6 py-3 text-sm font-medium hover:bg-zinc-700 transition-colors"
        >
          로그인
        </Link>
        <Link
          href="/signup"
          className="rounded-lg bg-emerald-600 px-6 py-3 text-sm font-medium hover:bg-emerald-500 transition-colors"
        >
          회원가입
        </Link>
      </div>
    </div>
  );
}
