'use client';

import { useState } from 'react';
import { generateMetadata } from '@/actions/metadata';

export default function StepMetadata({
  projectId,
  data,
}: {
  projectId: string;
  data: unknown;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const meta = data as { title?: string; description?: string; hashtags?: string[]; pinnedComment?: string; thumbnailCaption?: string } | null;

  async function handleGenerate() {
    setError(null);
    setLoading(true);
    const res = await generateMetadata(projectId);
    setLoading(false);
    if (res.error) setError(res.error);
    else if (res.data) window.location.reload();
  }

  if (meta && meta.title) {
    return (
      <div className="space-y-4 text-sm">
        <div>
          <span className="text-zinc-500">제목:</span>
          <p className="mt-1 text-zinc-300">{meta.title}</p>
        </div>
        <div>
          <span className="text-zinc-500">설명:</span>
          <p className="mt-1 text-zinc-300 whitespace-pre-wrap">{meta.description}</p>
        </div>
        <div>
          <span className="text-zinc-500">해시태그:</span>
          <p className="mt-1 text-zinc-300">{meta.hashtags?.join(' ')}</p>
        </div>
        <div>
          <span className="text-zinc-500">고정 댓글:</span>
          <p className="mt-1 text-zinc-300">{meta.pinnedComment}</p>
        </div>
        <div>
          <span className="text-zinc-500">썸네일 문구:</span>
          <p className="mt-1 text-zinc-300">{meta.thumbnailCaption}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-2 text-sm text-zinc-500">유튜브 업로드용 제목, 설명, 해시태그, 고정 댓글, 썸네일 문구를 생성합니다.</p>
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium hover:bg-emerald-500 disabled:opacity-50"
      >
        {loading ? '생성 중...' : '메타데이터 생성'}
      </button>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
}
