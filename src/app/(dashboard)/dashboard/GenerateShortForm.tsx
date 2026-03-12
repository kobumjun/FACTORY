'use client';

import { useState } from 'react';
import { startShortGeneration } from '@/actions/project';
import { generateScript } from '@/actions/script';
import { splitScenes } from '@/actions/scenes';
import { generateImages } from '@/actions/image';
import { generateTTS } from '@/actions/tts';
import { renderVideoInBrowser } from '@/lib/video/client';
import { generateMetadata } from '@/actions/metadata';
import type { TemplateId } from '@/lib/constants';

type Template = { readonly id: TemplateId; readonly name: string; readonly description: string };

const PROGRESS_LABELS = {
  script: 'Generating script (LLM)...',
  scenes: 'Splitting script into scenes...',
  images: 'Generating images for each scene...',
  tts: 'Generating TTS audio for each scene...',
  video: 'Rendering video in browser (ffmpeg.wasm)...',
  metadata: 'Generating metadata for YouTube...',
} as const;

type StepKey = keyof typeof PROGRESS_LABELS;

export default function GenerateShortForm({
  templates,
}: {
  templates: readonly Template[];
}) {
  const [prompt, setPrompt] = useState('');
  const [template, setTemplate] = useState<TemplateId>('motivation');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    videoUrl: string;
    metadata?: { title?: string; description?: string; hashtags?: string[]; pinnedComment?: string; thumbnailCaption?: string };
    projectId: string;
  } | null>(null);

  const steps: StepKey[] = ['script', 'scenes', 'images', 'tts', 'video', 'metadata'];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log('[GenerateShort] Generate button clicked', { prompt: prompt.trim(), template });
    setError(null);
    setResult(null);
    setLoading(true);

    console.log('[GenerateShort] Start project initialization');
    const start = await startShortGeneration(prompt.trim(), template);
    if (start.error) {
      console.error('[GenerateShort] Failed to start project', start.error);
      setError(start.error);
      setLoading(false);
      return;
    }
    const projectId = start.data!.projectId;
    console.log('[GenerateShort] Project initialized', { projectId });

    for (const step of steps) {
      console.log('[GenerateShort] Starting step', step);
      setProgress(PROGRESS_LABELS[step]);
      let res: { error?: string; data?: unknown };
      switch (step) {
        case 'script':
          console.log('[GenerateShort] Start script generation');
          res = await generateScript(projectId, { bundled: true });
          console.log('[GenerateShort] Script generated');
          break;
        case 'scenes':
          console.log('[GenerateShort] Start scene split');
          res = await splitScenes(projectId, { bundled: true });
          console.log('[GenerateShort] Scenes generated');
          break;
        case 'images':
          console.log('[GenerateShort] Start image generation');
          res = await generateImages(projectId, { bundled: true });
          console.log('[GenerateShort] Images generated');
          break;
        case 'tts':
          console.log('[GenerateShort] Start TTS generation');
          res = await generateTTS(projectId, { bundled: true });
          console.log('[GenerateShort] TTS generated');
          break;
        case 'video':
          console.log('[GenerateShort] Start browser video render');
          res = await renderVideoInBrowser(projectId);
          console.log('[GenerateShort] Browser video render finished');
          break;
        case 'metadata':
          console.log('[GenerateShort] Start metadata generation');
          res = await generateMetadata(projectId);
          console.log('[GenerateShort] Metadata generated');
          break;
        default:
          res = {};
      }
      if (res.error) {
        console.error('[GenerateShort] Step failed', { step, error: res.error });
        setError(res.error);
        setLoading(false);
        setProgress(null);
        return;
      }
      if (step === 'video' && res.data && typeof res.data === 'object' && 'videoUrl' in res.data) {
        setResult({
          videoUrl: (res.data as { videoUrl: string }).videoUrl,
          projectId,
        });
      }
      if (step === 'metadata' && res.data && typeof res.data === 'object') {
        setResult((prev) => (prev ? {
          ...prev,
          metadata: res.data as { title?: string; description?: string; hashtags?: string[]; pinnedComment?: string; thumbnailCaption?: string },
        } : {
          videoUrl: '',
          projectId,
          metadata: res.data as { title?: string; description?: string; hashtags?: string[]; pinnedComment?: string; thumbnailCaption?: string },
        }));
      }
    }

    setProgress(null);
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-400">Prompt</label>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Benefits of waking up early"
            required
            disabled={loading}
            className="w-full max-w-md border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none disabled:opacity-70"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-400">Template</label>
          <div className="flex flex-wrap gap-2">
            {templates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTemplate(t.id)}
                disabled={loading}
                className={`border px-4 py-2 text-sm disabled:opacity-70 ${
                  template === t.id
                    ? 'border-white bg-zinc-700 text-white'
                    : 'border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          className="border border-zinc-600 bg-white px-6 py-3 text-sm font-medium text-zinc-900 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Generate Short (1 credit)'}
        </button>
      </form>

      {progress && (
        <div className="border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-sm text-zinc-300">{progress}</p>
        </div>
      )}

      {result && result.videoUrl && !loading && (
        <div className="space-y-4 border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-lg font-medium text-white">Your short</h2>
          <div className="relative aspect-[9/16] max-w-sm overflow-hidden border border-zinc-700">
            <video src={result.videoUrl} controls className="h-full w-full object-cover" />
          </div>
          <div className="flex gap-2">
            <a
              href={result.videoUrl}
              download="short.mp4"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-zinc-600 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100"
            >
              Download
            </a>
            <a
              href={`/dashboard/projects/${result.projectId}`}
              className="border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800"
            >
              View details
            </a>
          </div>
          {result.metadata && (
            <div className="mt-4 space-y-2 border-t border-zinc-800 pt-4 text-sm text-zinc-400">
              {result.metadata.title && (
                <p><span className="text-zinc-500">Title:</span> {result.metadata.title}</p>
              )}
              {result.metadata.description && (
                <p><span className="text-zinc-500">Description:</span> {result.metadata.description}</p>
              )}
              {result.metadata.hashtags && result.metadata.hashtags.length > 0 && (
                <p><span className="text-zinc-500">Hashtags:</span> {result.metadata.hashtags.join(' ')}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
