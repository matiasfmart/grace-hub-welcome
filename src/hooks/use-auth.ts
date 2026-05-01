'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { session } from '@/lib/storage';

/**
 * Reads the JWT from sessionStorage and redirects to login if absent.
 * Returns null while redirecting (component should render nothing).
 * Returns the token string once confirmed valid.
 */
export function useAuth(): string | null {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const stored = session.getToken();
    if (!stored) {
      router.replace('/');
    } else {
      setToken(stored);
    }
  }, [router]);

  return token;
}
