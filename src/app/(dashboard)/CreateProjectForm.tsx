'use client';

import { useState } from 'react';
import { createProject } from '@/actions/project';
import type { TemplateId } from '@/lib/constants';

type Template = { readonly id: TemplateId; readonly name: string; readonly description: string };

export default function CreateProjectForm({
  templates,
}: {
  templates: readonly Template[];
}) {
  const [topic, setTopic] = useState('');
  const [template, setTemplate] = useState<TemplateId>('motivation');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { data, error: err } = await createProject(topic.trim(), template);
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    if (data) {
      window.location.href = `/dashboard/projects/${data.id}`;
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-400">Topic</label>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. Benefits of waking up early"
          required
          className="w-full max-w-md border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none"
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
              className={`border px-4 py-2 text-sm ${
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
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
      <button
        type="submit"
        disabled={loading || !topic.trim()}
        className="border border-zinc-600 bg-white px-6 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Create project'}
      </button>
    </form>
  );
}
