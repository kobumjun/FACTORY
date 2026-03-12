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
            <div key={i} className="relative aspect-[9/16] overflow-hidden rounded-lg bg-zinc-800">
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
      <p className="mb-2 text-sm text-zinc-500">장면별 이미지를 생성합니다. 장면 수만큼 크레딧이 소모됩니다.</p>
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium hover:bg-emerald-500 disabled:opacity-50"
      >
        {loading ? '생성 중...' : '이미지 생성'}
      </button>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
}
