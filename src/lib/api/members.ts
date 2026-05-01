import type { Member } from '@/lib/types';

const API = process.env.NEXT_PUBLIC_API_URL;

/**
 * Fetches all active members (record_status = vigente).
 * Requires a valid JWT token (called from authenticated pages only).
 */
export async function getActiveMembers(token: string): Promise<Member[]> {
  const res = await fetch(`${API}/members?record_status=vigente`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error('Error al cargar la lista de miembros');
  }

  const data = (await res.json()) as Array<{ memberId: number; firstName: string; lastName: string }>;

  return data.map((m) => ({
    id: m.memberId,
    firstName: m.firstName,
    lastName: m.lastName,
    fullName: `${m.firstName} ${m.lastName}`,
  }));
}
