'use client';

import { useState } from 'react';
import { renderProjectVideo } from '@/actions/video';
import Link from 'next/link';

export default function StepVideo({
  projectId,
  data,
}: {
  projectId: string;
  data: unknown;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoUrl = (data as { videoUrl?: string })?.videoUrl;

  async function handleRender() {
    setError(null);
    setLoading(true);
    const res = await renderProjectVideo(projectId);
    setLoading(false);
    if (res.error) setError(res.error);
    else if (res.data) window.location.reload();
  }

  if (videoUrl) {
    return (
      <div className="space-y-4">
        <div className="relative aspect-[9/16] max-w-sm overflow-hidden rounded-lg bg-zinc-800">
          <video src={videoUrl} controls className="h-full w-full object-cover" />
        </div>
        <div className="flex gap-2">
          <a
            href={videoUrl}
            download="shorts.mp4"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium hover:bg-emerald-500"
          >
            다운로드
          </a>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-2 text-sm text-zinc-500">이미지와 TTS를 합쳐 세로형 쇼츠 영상을 만듭니다. (3 크레딧)</p>
      <button
        onClick={handleRender}
        disabled={loading}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium hover:bg-emerald-500 disabled:opacity-50"
      >
        {loading ? '렌더링 중...' : '영상 합성'}
      </button>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
}
