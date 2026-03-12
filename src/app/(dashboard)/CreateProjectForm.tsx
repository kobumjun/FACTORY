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
        <label className="block text-sm font-medium text-zinc-400 mb-2">주제</label>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="예: 아침 일찍 일어나는 습관의 장점"
          required
          className="w-full max-w-md rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-400 mb-2">템플릿</label>
        <div className="flex flex-wrap gap-2">
          {templates.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTemplate(t.id)}
              className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
                template === t.id
                  ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                  : 'border-zinc-700 text-zinc-400 hover:border-zinc-600'
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
      <button
        type="submit"
        disabled={loading || !topic.trim()}
        className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-medium hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? '생성 중...' : '새 프로젝트 만들기'}
      </button>
    </form>
  );
}
