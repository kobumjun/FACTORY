import { createClient } from '@/lib/supabase/server';

export default async function CreditsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', user.id)
    .single();

  const credits = profile?.credits ?? 0;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">Credits</h1>
      <div className="border border-zinc-800 bg-zinc-900 p-6">
        <p className="text-4xl font-bold text-white">{credits}</p>
        <p className="mt-2 text-sm text-zinc-500">Available credits</p>
      </div>
      <div className="border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-lg font-medium text-white">Usage</h2>
        <ul className="mt-3 space-y-2 text-sm text-zinc-400">
          <li>· 1 short = 1 credit</li>
          <li>· 6 test credits are provided on first sign-in.</li>
        </ul>
      </div>
      <div className="border border-zinc-800 bg-zinc-900 p-6 text-center text-sm text-zinc-500">
        Additional credits can be purchased when available.
      </div>
    </div>
  );
}
