'use client';

import { useState } from 'react';
import Image from 'next/image';
import { generateImages } from '@/actions/image';

export default function StepImages({
  projectId,
  data,
}: {
  projectId: string;
  data: unknown;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const imageUrls = (data as { imageUrls?: string[] })?.imageUrls;

  async function handleGenerate() {
    setError(null);
    setLoading(true);
    const res = await generateImages(projectId);
    setLoading(false);
    if (res.error) setError(res.error);
    else if (res.data) window.location.reload();
  }

  if (imageUrls && imageUrls.length > 0) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {imageUrls.map((url, i) => (
            <div key={i} className="relative aspect-[9/16] overflow-hidden border border-zinc-700 bg-zinc-800">
              <Image
                src={url}
                alt={`Scene ${i + 1}`}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-2 text-sm text-zinc-500">Generate one image per scene. Credits are used per scene.</p>
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="border border-zinc-600 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100 disabled:opacity-50"
      >
        {loading ? 'Generating...' : 'Generate images'}
      </button>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
