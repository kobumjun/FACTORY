# AI Content Factory

주제만 입력하면 쇼츠 영상을 자동으로 생성하는 SaaS MVP입니다.

## 시작하기

### 1. 환경 설정

```bash
cp .env.example .env.local
# .env.local에 Supabase, OpenAI, Lemon Squeezy 키 입력
```

### 2. Supabase 설정

1. [Supabase](https://supabase.com) 프로젝트 생성
2. SQL Editor에서 `supabase/migrations/001_initial_schema.sql` 실행
3. Storage에서 `projects` 버킷 생성 (public)
4. Authentication > Providers에서 Email 활성화

### 3. 로컬 실행

```bash
npm install
npm run dev
```

`http://localhost:3000` 접속

### 4. FFmpeg

영상 합성에 FFmpeg가 필요합니다. 로컬에 설치해주세요.

```bash
# macOS
brew install ffmpeg
```

## 크레딧

- 스크립트: 1
- 이미지 1장: 1
- TTS: 1
- 영상 렌더: 3

테스트 시 관리자 페이지에서 유저에게 크레딧을 지급할 수 있습니다.
(profiles.role을 'admin'으로 설정한 유저만 관리자 페이지 접근 가능)
