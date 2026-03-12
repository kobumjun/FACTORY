import Link from 'next/link';
import { getProjects } from '@/actions/project';
import { TEMPLATES } from '@/lib/constants';
import CreateProjectForm from '../CreateProjectForm';

export default async function DashboardPage() {
  const { data: projects } = await getProjects();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Projects</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Create a new project or continue an existing one.
        </p>
      </div>

      <CreateProjectForm templates={TEMPLATES} />

      {projects && projects.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => {
            const templateName = TEMPLATES.find((t) => t.id === p.template)?.name ?? p.template;
            return (
              <Link
                key={p.id}
                href={`/dashboard/projects/${p.id}`}
                className="border border-zinc-800 bg-zinc-900 p-5 hover:border-zinc-700 hover:bg-zinc-800"
              >
                <h3 className="font-medium truncate text-white">{p.name}</h3>
                <p className="mt-1 text-sm text-zinc-500 truncate">{p.topic}</p>
                <span className="mt-2 inline-block text-xs text-zinc-600">{templateName}</span>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="border border-dashed border-zinc-700 bg-zinc-900 p-12 text-center text-zinc-500">
          No projects yet. Enter a topic and choose a template above to create one.
        </div>
      )}
    </div>
  );
}
