import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SiteHeader from '@/components/layout/SiteHeader';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <SiteHeader />
      <main>
        <section className="border-b border-zinc-800">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              스크립트만 넣으면 AI가 쇼츠를 생성합니다
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-zinc-400">
              이미지 시퀀스, TTS, 자동화 파이프라인으로 콘텐츠 공장처럼 빠르게 제작하세요.
            </p>
            <div className="mt-8">
              <GoogleSignInButton
                className="inline-block border border-zinc-600 bg-white px-6 py-3 text-sm font-medium text-zinc-900 hover:bg-zinc-100"
              >
                Login with Google
              </GoogleSignInButton>
            </div>
          </div>
        </section>
        <section className="border-b border-zinc-800">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <h2 className="text-xl font-semibold text-white">제안 가치</h2>
            <ul className="mt-6 grid gap-6 sm:grid-cols-3">
              <li className="border border-zinc-800 p-6">
                <h3 className="font-medium text-white">스크립트 → 쇼츠</h3>
                <p className="mt-2 text-sm text-zinc-500">
                  주제만 입력하면 AI가 쇼츠용 스크립트를 생성하고, 장면별로 분할합니다.
                </p>
              </li>
              <li className="border border-zinc-800 p-6">
                <h3 className="font-medium text-white">이미지 + TTS</h3>
                <p className="mt-2 text-sm text-zinc-500">
                  장면별 이미지와 음성을 자동 생성해 세로형 쇼츠 영상으로 합성합니다.
                </p>
              </li>
              <li className="border border-zinc-800 p-6">
                <h3 className="font-medium text-white">다운로드·업로드</h3>
                <p className="mt-2 text-sm text-zinc-500">
                  제목·설명·해시태그까지 생성하고, 결과물을 다운로드하거나 유튜브에 올릴 수 있습니다.
                </p>
              </li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
