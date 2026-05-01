const API = process.env.NEXT_PUBLIC_API_URL;

/**
 * Authenticates the welcome team with the shared team code.
 * Returns a JWT token to be stored in sessionStorage.
 * Identity (addedBy) is captured explicitly in each registration form.
 */
export async function teamLogin(teamCode: string): Promise<string> {
  const res = await fetch(`${API}/auth/team-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teamCode }),
  });

  if (res.status === 401) {
    throw new Error('Código incorrecto');
  }
  if (!res.ok) {
    throw new Error('Error al conectar con el servidor');
  }

  const data = (await res.json()) as { token: string };
  return data.token;
}
