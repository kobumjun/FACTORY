'use client';

import { useState } from 'react';
import { renderVideoInBrowser } from '@/lib/video/client';

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
    const res = await renderVideoInBrowser(projectId);
    setLoading(false);
    if ('error' in res && res.error) setError(res.error);
    else if ('data' in res && res.data) window.location.reload();
  }

  if (videoUrl) {
    return (
      <div className="space-y-4">
        <div className="relative aspect-[9/16] max-w-sm overflow-hidden border border-zinc-700 bg-zinc-800">
          <video src={videoUrl} controls className="h-full w-full object-cover" />
        </div>
        <div className="flex gap-2">
          <a
            href={videoUrl}
            download="shorts.mp4"
            target="_blank"
            rel="noopener noreferrer"
            className="border border-zinc-600 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100"
          >
            Download
          </a>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-2 text-sm text-zinc-500">Combine images and TTS into a vertical short-form video. (3 credits)</p>
      <button
        onClick={handleRender}
        disabled={loading}
        className="border border-zinc-600 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100 disabled:opacity-50"
      >
        {loading ? 'Rendering...' : 'Render video'}
      </button>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
