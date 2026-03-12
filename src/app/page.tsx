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
              Turn a script into short-form videos with AI
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-zinc-400">
              Image sequences, TTS, and an automated pipeline—create content at scale.
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
            <h2 className="text-xl font-semibold text-white">What you get</h2>
            <ul className="mt-6 grid gap-6 sm:grid-cols-3">
              <li className="border border-zinc-800 p-6">
                <h3 className="font-medium text-white">Script to shorts</h3>
                <p className="mt-2 text-sm text-zinc-500">
                  Enter a topic and AI generates a short-form script and splits it into scenes.
                </p>
              </li>
              <li className="border border-zinc-800 p-6">
                <h3 className="font-medium text-white">Images + TTS</h3>
                <p className="mt-2 text-sm text-zinc-500">
                  Scene-by-scene images and voice are generated and combined into vertical shorts.
                </p>
              </li>
              <li className="border border-zinc-800 p-6">
                <h3 className="font-medium text-white">Download & upload</h3>
                <p className="mt-2 text-sm text-zinc-500">
                  Titles, descriptions, and hashtags are generated; download or publish to YouTube.
                </p>
              </li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
