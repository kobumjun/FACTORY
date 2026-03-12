'use client';

import { useState } from 'react';
import { splitScenes } from '@/actions/scenes';

export default function StepScenes({
  projectId,
  data,
}: {
  projectId: string;
  data: unknown;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scenes = (data as { scenes?: string[] })?.scenes;

  async function handleSplit() {
    setError(null);
    setLoading(true);
    const res = await splitScenes(projectId);
    setLoading(false);
    if (res.error) setError(res.error);
    else if (res.data) window.location.reload();
  }

  if (scenes && scenes.length > 0) {
    return (
      <div className="space-y-2">
        <ul className="list-inside list-decimal space-y-1 text-sm text-zinc-300">
          {scenes.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-2 text-sm text-zinc-500">스크립트를 장면별로 나눕니다. 먼저 스크립트를 생성해주세요.</p>
      <button
        onClick={handleSplit}
        disabled={loading}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium hover:bg-emerald-500 disabled:opacity-50"
      >
        {loading ? '분할 중...' : '장면 분할'}
      </button>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
}
