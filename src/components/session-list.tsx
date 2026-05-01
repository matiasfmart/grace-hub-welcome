'use client';

import type { Visitor } from '@/lib/types';

interface SessionListProps {
  visitors: Visitor[];
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

export default function SessionList({ visitors }: SessionListProps) {
  if (visitors.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Aún no se registraron visitantes en esta sesión.
      </p>
    );
  }

  // Sort newest first
  const sorted = [...visitors].sort(
    (a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime(),
  );

  return (
    <ul className="flex flex-col gap-2">
      {sorted.map((v) => (
        <li
          key={v.id}
          className="rounded-lg border border-border bg-white px-4 py-3"
        >
          <div className="flex items-start justify-between gap-2">
            <span className="font-medium text-sm text-foreground">
              {v.firstName} {v.lastName}
            </span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {formatTime(v.registeredAt)}
            </span>
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            Cargado por: {v.addedByName}
          </div>
          {v.contact && (
            <div className="mt-0.5 text-xs text-muted-foreground">{v.contact}</div>
          )}
        </li>
      ))}
    </ul>
  );
}
