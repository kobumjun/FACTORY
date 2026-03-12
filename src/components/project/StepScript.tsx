'use client';

import { useState } from 'react';
import { generateScript } from '@/actions/script';

export default function StepScript({
  projectId,
  data,
}: {
  projectId: string;
  data: unknown;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const script = (data as { script?: string })?.script;

  async function handleGenerate() {
    setError(null);
    setLoading(true);
    const res = await generateScript(projectId);
    setLoading(false);
    if (res.error) setError(res.error);
    else if (res.data) window.location.reload();
  }

  if (script) {
    return (
      <div className="space-y-2">
        <pre className="whitespace-pre-wrap rounded-lg bg-zinc-800 p-4 text-sm text-zinc-300">{script}</pre>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium hover:bg-emerald-500 disabled:opacity-50"
      >
        {loading ? '생성 중...' : '스크립트 생성 (1 크레딧)'}
      </button>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
}
