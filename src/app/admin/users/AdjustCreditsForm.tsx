'use client';

import { useState } from 'react';
import { adjustCredits } from '@/actions/admin';

export default function AdjustCreditsForm({ userId }: { userId: string }) {
  const [amount, setAmount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setDone(false);
    await adjustCredits(userId, amount);
    setLoading(false);
    setDone(true);
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
        min={1}
        max={1000}
        className="w-20 border border-zinc-700 bg-zinc-800 px-2 py-1 text-sm text-white"
      />
      <button
        type="submit"
        disabled={loading}
        className="border border-zinc-600 bg-white px-2 py-1 text-xs text-zinc-900 hover:bg-zinc-100 disabled:opacity-50"
      >
        {loading ? '...' : 'Grant'}
      </button>
      {done && <span className="text-xs text-zinc-400">Done</span>}
    </form>
  );
}
