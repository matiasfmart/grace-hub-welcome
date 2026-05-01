const API = process.env.NEXT_PUBLIC_API_URL;

export interface CreateVisitorPayload {
  firstName: string;
  lastName: string;
  visitDate: string; // YYYY-MM-DD — generated automatically, never input by user
  contact?: string;
  notes?: string;
  source: 'pwa';
  addedBy: number;  // member_id — required by business rule RN-PWA-1
}

/**
 * Registers a new visitor (prospect) via the backend.
 * Requires a Bearer token — uses Authorization header, not cookie.
 */
export async function createProspect(
  token: string,
  payload: CreateVisitorPayload,
): Promise<{ prospectId: number }> {
  const res = await fetch(`${API}/prospects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (res.status === 401) {
    throw new Error('Sesión expirada. Volvé a ingresar.');
  }
  if (!res.ok) {
    throw new Error('Error al registrar el visitante');
  }

  return res.json() as Promise<{ prospectId: number }>;
}
