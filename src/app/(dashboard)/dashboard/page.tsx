import Link from 'next/link';
import { getProjects } from '@/actions/project';
import { createClient } from '@/lib/supabase/server';
import { TEMPLATES } from '@/lib/constants';
import GenerateShortForm from './GenerateShortForm';

export default async function DashboardPage() {
  const { data: projects } = await getProjects();
  const supabase = await createClient();

  const projectsWithVideo = await Promise.all(
    (projects ?? []).map(async (p) => {
      const { data: step } = await supabase
        .from('project_steps')
        .select('output_data')
        .eq('project_id', p.id)
        .eq('step', 'video')
        .eq('status', 'completed')
        .single();
      const videoUrl = (step?.output_data as { videoUrl?: string })?.videoUrl;
      return { ...p, videoUrl };
    })
  );
  const completed = projectsWithVideo.filter((p) => p.videoUrl);
  const templateName = (id: string) => TEMPLATES.find((t) => t.id === id)?.name ?? id;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Generate Short</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Enter a prompt and style (Meme or Story), then Generate Short. One short = 1 credit.
        </p>
      </div>

      <GenerateShortForm templates={TEMPLATES} />

      {completed.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-medium text-white">Recent shorts</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {completed.map((p) => (
              <Link
                key={p.id}
                href={`/dashboard/projects/${p.id}`}
                className="border border-zinc-800 bg-zinc-900 p-5 hover:border-zinc-700 hover:bg-zinc-800"
              >
                <h3 className="font-medium truncate text-white">{p.name}</h3>
                <p className="mt-1 text-sm text-zinc-500 truncate">{p.topic}</p>
                <span className="mt-2 inline-block text-xs text-zinc-600">{templateName(p.template)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
