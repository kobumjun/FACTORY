// 템플릿 상수
export const TEMPLATES = [
  { id: 'motivation', name: '동기부여 쇼츠', description: '동기부여·성장 콘텐츠용' },
  { id: 'informative', name: '정보형 쇼츠', description: '팩트·정보 전달용' },
  { id: 'quotes', name: '명언 쇼츠', description: '명언·인용구 형식' },
  { id: 'horror', name: '공포썰 쇼츠', description: '공포·스릴러 스토리' },
  { id: 'health', name: '헬스 쇼츠', description: '운동·건강 팁' },
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

// 크레딧 비용
export const CREDITS = {
  script: 1,
  imagePerScene: 1,
  tts: 1,
  video: 3,
  metadata: 0, // 메타데이터는 LLM만 사용, 별도 크레딧 안 받음 (스크립트와 유사)
} as const;
