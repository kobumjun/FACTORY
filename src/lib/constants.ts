export const TEMPLATES = [
  { id: 'meme', name: 'Meme', description: 'Short, punchy, meme-style reel' },
  { id: 'story', name: 'Story', description: 'Immersive, emotional, philosophical' },
] as const;

export type TemplateId = (typeof TEMPLATES)[number]['id'];

// 단계 상수
export const STEPS = [
  'script',
  'scenes',
  'images',
  'tts',
  'video',
  'metadata',
] as const;

export type StepId = (typeof STEPS)[number];

// 비디오 렌더링 시 메모리 한계를 위해 장면 수 상한 (Vercel serverless 대응)
export const MAX_VIDEO_SCENES = 5;

// 크레딧 비용
export const CREDITS = {
  script: 1,
  imagePerScene: 1,
  tts: 1,
  video: 3,
  metadata: 0, // 메타데이터는 LLM만 사용, 별도 크레딧 안 받음 (스크립트와 유사)
} as const;
