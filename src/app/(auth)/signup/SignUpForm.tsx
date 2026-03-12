'use client';

import { useState } from 'react';
import { signUp } from '@/actions/auth';
import Link from 'next/link';

export default function SignUpForm() {
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    const res = await signUp(formData);
    if (res?.error) setError(res.error);
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8">
      <h2 className="text-xl font-semibold mb-6">회원가입</h2>
      <form action={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          name="fullName"
          placeholder="이름"
          className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none"
        />
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
          minLength={6}
          className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none"
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          className="rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium hover:bg-emerald-500 transition-colors"
        >
          회원가입
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-zinc-500">
        이미 계정이 있으신가요?{' '}
        <Link href="/login" className="text-emerald-500 hover:underline">
          로그인
        </Link>
      </p>
    </div>
  );
}
