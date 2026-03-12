'use client';

import { useState } from 'react';
import { signIn } from '@/actions/auth';
import Link from 'next/link';

export default function LoginForm() {
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    const res = await signIn(formData);
    if (res?.error) setError(res.error);
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8">
      <h2 className="text-xl font-semibold mb-6">로그인</h2>
      <form action={handleSubmit} className="flex flex-col gap-4">
        <input
          type="email"
          name="email"
          placeholder="이메일"
          required
          className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none"
        />
        <input
          type="password"
          name="password"
          placeholder="비밀번호"
          required
          className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none"
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          className="rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium hover:bg-emerald-500 transition-colors"
        >
          로그인
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-zinc-500">
        계정이 없으신가요?{' '}
        <Link href="/signup" className="text-emerald-500 hover:underline">
          회원가입
        </Link>
      </p>
    </div>
  );
}
