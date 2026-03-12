'use server';

// NOTE:
// Server-side ffmpeg rendering has been removed.
// Video rendering now happens in the browser via ffmpeg.wasm (`@ffmpeg/ffmpeg`).
// This action is kept only as a placeholder to avoid accidental server usage.

export async function renderProjectVideo() {
  return {
    error: 'Server-side video rendering has been deprecated. Please update client code to use browser-based rendering.',
  };
}
