'use client';

import { createClient } from '@/lib/supabase/client';
import { useTransition } from 'react';

const redirectTo = typeof window !== 'undefined'
  ? `${window.location.origin}/auth/callback`
  : `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/auth/callback`;

export default function GoogleSignInButton({
  children = 'Login with Google',
  className = '',
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleSignIn() {
    startTransition(async () => {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) {
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleSignIn}
      disabled={isPending}
      className={className}
    >
      {isPending ? '...' : children}
    </button>
  );
}
