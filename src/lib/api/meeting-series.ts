import type { MeetingSeries } from '@/lib/types';

const API = process.env.NEXT_PUBLIC_API_URL;

/**
 * Fetches all meeting series from the backend.
 * Returns an empty array silently on error — series selection is optional.
 */
export async function getMeetingSeries(token: string): Promise<MeetingSeries[]> {
  try {
    const res = await fetch(`${API}/meeting-series`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    const data = await res.json() as Array<{ seriesId: number; name: string; defaultTime?: string }>;
    return data.map((s) => ({ id: s.seriesId, name: s.name, defaultTime: s.defaultTime }));
  } catch {
    return [];
  }
}
