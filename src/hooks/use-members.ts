'use client';

import { useEffect, useState } from 'react';
import { getActiveMembers } from '@/lib/api/members';
import { session } from '@/lib/storage';
import type { Member } from '@/lib/types';

/**
 * Loads the list of active members once on mount.
 * Requires an authenticated session (reads token from sessionStorage).
 */
export function useMembers(): { members: Member[]; loading: boolean; error: string | null } {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = session.getToken();
    if (!token) {
      setError('No hay sesión activa');
      setLoading(false);
      return;
    }
    getActiveMembers(token)
      .then((data) => {
        setMembers(data);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Error al cargar miembros');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return { members, loading, error };
}
