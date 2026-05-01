'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { session } from '@/lib/storage';
import RegisterForm from '@/components/register-form';
import SessionList from '@/components/session-list';
import type { Visitor } from '@/lib/types';

export default function RegisterPage() {
  const router = useRouter();
  const token = useAuth();
  const [visitors, setVisitors] = useState<Visitor[]>([]);

  // useAuth redirects to '/' if no token — render nothing during redirect
  if (!token) return null;

  const handleLogout = () => {
    session.clear();
    router.replace('/');
  };

  const handleVisitorRegistered = (visitor: Visitor) => {
    setVisitors((prev) => [visitor, ...prev]);
  };

  return (
    <main className="flex min-h-screen flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-5 py-3 shadow-sm">
        <div>
          <span className="font-semibold text-sm text-foreground">Grace Hub · Bienvenida</span>
          <p className="text-xs text-muted-foreground">Equipo de bienvenida</p>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
        >
          Salir
        </button>
      </header>

      <div className="flex-1 px-5 py-6 space-y-8 max-w-lg mx-auto w-full">
        {/* Registration form card */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-foreground">Nuevo visitante</h2>
          <RegisterForm
            token={token}
            onVisitorRegistered={handleVisitorRegistered}
          />
        </div>

        {/* Session list */}
        <section>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Registrados hoy ({visitors.length})
          </h2>
          <SessionList visitors={visitors} />
        </section>
      </div>
    </main>
  );
}
