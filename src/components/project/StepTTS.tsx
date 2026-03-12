'use client';

import { useState } from 'react';
import { generateTTS } from '@/actions/tts';

export default function StepTTS({
  projectId,
  data,
}: {
  projectId: string;
  data: unknown;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioUrls = (data as { audioUrls?: string[] })?.audioUrls;

  async function handleGenerate() {
    setError(null);
    setLoading(true);
    const res = await generateTTS(projectId);
    setLoading(false);
    if (res.error) setError(res.error);
    else if (res.data) window.location.reload();
  }

  if (audioUrls && audioUrls.length > 0) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-zinc-500">TTS 오디오 {audioUrls.length}개 생성 완료</p>
        {audioUrls.map((url, i) => (
          <audio key={i} src={url} controls className="w-full max-w-md" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <p className="mb-2 text-sm text-zinc-500">장면별 TTS를 생성합니다. (1 크레딧)</p>
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium hover:bg-emerald-500 disabled:opacity-50"
      >
        {loading ? '생성 중...' : 'TTS 생성'}
      </button>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
}
