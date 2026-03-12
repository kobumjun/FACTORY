import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getProject } from '@/actions/project';

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data: project, error } = await getProject(id);

  if (error || !project) notFound();

  type StepRow = { step: string; status: string; output_data: unknown };
  const stepsMap = new Map<string, StepRow>(
    (project.steps ?? []).map((s: StepRow) => [s.step, s])
  );

  const videoStep = stepsMap.get('video');
  const videoUrl = videoStep?.status === 'completed' && videoStep?.output_data && typeof videoStep.output_data === 'object' && 'videoUrl' in videoStep.output_data
    ? (videoStep.output_data as { videoUrl: string }).videoUrl
    : null;

  const metadataStep = stepsMap.get('metadata');
  const metadata = metadataStep?.status === 'completed' && metadataStep?.output_data && typeof metadataStep.output_data === 'object'
    ? (metadataStep.output_data as { title?: string; description?: string; hashtags?: string[]; pinnedComment?: string; thumbnailCaption?: string })
    : null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{project.name}</h1>
          <p className="mt-1 text-sm text-zinc-500">{project.topic}</p>
        </div>
        <Link
          href="/dashboard"
          className="border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800"
        >
          Back to dashboard
        </Link>
      </div>

      {videoUrl ? (
        <div className="space-y-6 border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-lg font-medium text-white">Video</h2>
          <div className="relative aspect-[9/16] max-w-sm overflow-hidden border border-zinc-700">
            <video src={videoUrl} controls className="h-full w-full object-cover" />
          </div>
          <div className="flex gap-2">
            <a
              href={videoUrl}
              download="short.mp4"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-zinc-600 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100"
            >
              Download
            </a>
          </div>
          {metadata && (
            <div className="space-y-3 border-t border-zinc-800 pt-6 text-sm">
              {metadata.title && (
                <div>
                  <span className="text-zinc-500">Title:</span>
                  <p className="mt-1 text-zinc-300">{metadata.title}</p>
                </div>
              )}
              {metadata.description && (
                <div>
                  <span className="text-zinc-500">Description:</span>
                  <p className="mt-1 whitespace-pre-wrap text-zinc-300">{metadata.description}</p>
                </div>
              )}
              {metadata.hashtags && metadata.hashtags.length > 0 && (
                <div>
                  <span className="text-zinc-500">Hashtags:</span>
                  <p className="mt-1 text-zinc-300">{metadata.hashtags.join(' ')}</p>
                </div>
              )}
              {metadata.pinnedComment && (
                <div>
                  <span className="text-zinc-500">Pinned comment:</span>
                  <p className="mt-1 text-zinc-300">{metadata.pinnedComment}</p>
                </div>
              )}
              {metadata.thumbnailCaption && (
                <div>
                  <span className="text-zinc-500">Thumbnail caption:</span>
                  <p className="mt-1 text-zinc-300">{metadata.thumbnailCaption}</p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="border border-zinc-800 bg-zinc-900 p-8 text-center text-zinc-500">
          <p>This short is not ready yet. Generate a new one from the dashboard.</p>
          <Link href="/dashboard" className="mt-4 inline-block text-sm text-zinc-400 hover:text-white">
            Go to dashboard
          </Link>
        </div>
      )}
    </div>
  );
}
