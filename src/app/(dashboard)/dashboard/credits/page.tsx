import { createClient } from '@/lib/supabase/server';
import { CREDITS } from '@/lib/constants';

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
      <h1 className="text-2xl font-bold">크레딧</h1>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <p className="text-4xl font-bold text-emerald-500">{credits}</p>
        <p className="mt-2 text-sm text-zinc-500">보유 크레딧</p>
      </div>
      <div>
        <h2 className="mb-4 text-lg font-medium">크레딧 사용량</h2>
        <ul className="space-y-2 text-sm text-zinc-400">
          <li>스크립트 생성: {CREDITS.script} 크레딧</li>
          <li>이미지 1장: {CREDITS.imagePerScene} 크레딧</li>
          <li>TTS 생성: {CREDITS.tts} 크레딧</li>
          <li>영상 렌더: {CREDITS.video} 크레딧</li>
        </ul>
      </div>
      <div className="rounded-xl border border-dashed border-zinc-700 p-6 text-center text-zinc-500">
        <p>Lemon Squeezy 결제 연동 준비 중입니다.</p>
        <p className="mt-2 text-sm">관리자가 테스트용 크레딧을 지급할 수 있습니다.</p>
      </div>
    </div>
  );
}
