import { notFound } from 'next/navigation';
import { getProject } from '@/actions/project';
import { STEPS } from '@/lib/constants';
import StepScript from '@/components/project/StepScript';
import StepScenes from '@/components/project/StepScenes';
import StepImages from '@/components/project/StepImages';
import StepTTS from '@/components/project/StepTTS';
import StepVideo from '@/components/project/StepVideo';
import StepMetadata from '@/components/project/StepMetadata';
import type { StepName } from '@/types/database';

const STEP_COMPONENTS: Record<StepName, React.ComponentType<{ projectId: string; data: unknown }>> = {
  script: StepScript,
  scenes: StepScenes,
  images: StepImages,
  tts: StepTTS,
  video: StepVideo,
  metadata: StepMetadata,
};

const STEP_LABELS: Record<StepName, string> = {
  script: '1. 스크립트 생성',
  scenes: '2. 장면 분할',
  images: '3. 장면별 이미지',
  tts: '4. TTS 생성',
  video: '5. 영상 합성',
  metadata: '6. 메타데이터',
};

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data: project, error } = await getProject(id);

  if (error || !project) notFound();

  type StepRow = { step: StepName; status: string; output_data: unknown };
  const stepsMap = new Map<StepName, StepRow>(
    (project.steps ?? []).map((s: StepRow) => [s.step, s])
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">{project.name}</h1>
        <p className="mt-1 text-sm text-zinc-500">{project.topic}</p>
      </div>

      <div className="space-y-6">
        {STEPS.map((stepId) => {
          const step = stepsMap.get(stepId);
          const status = step?.status ?? 'pending';
          const Component = STEP_COMPONENTS[stepId];

          return (
            <div
              key={stepId}
              className="border border-zinc-800 bg-zinc-900 p-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-medium">{STEP_LABELS[stepId]}</h3>
                <StatusBadge status={status} />
              </div>
              <Component projectId={id} data={step?.output_data} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'border-zinc-700 bg-zinc-800 text-zinc-400',
    processing: 'border-amber-600 bg-amber-950 text-amber-400',
    completed: 'border-zinc-600 bg-zinc-800 text-white',
    failed: 'border-red-800 bg-red-950 text-red-400',
  };
  const labels: Record<string, string> = {
    pending: '대기중',
    processing: '생성중',
    completed: '완료',
    failed: '실패',
  };
  return (
    <span className={`border px-3 py-1 text-xs font-medium ${styles[status] ?? 'border-zinc-700 bg-zinc-800'}`}>
      {labels[status] ?? status}
    </span>
  );
}
