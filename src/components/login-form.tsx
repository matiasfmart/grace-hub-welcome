'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { teamLogin } from '@/lib/api/auth';
import { session } from '@/lib/storage';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [teamCode, setTeamCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!teamCode.trim()) {
      setError('Ingresá el código del equipo.');
      return;
    }

    startTransition(async () => {
      try {
        const token = await teamLogin(teamCode.trim());
        session.setToken(token);
        router.push('/register');
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error al ingresar');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="teamCode" className="text-sm font-medium text-foreground">
          Código del equipo <span className="text-destructive">*</span>
        </label>
        <div className="relative">
          <input
            id="teamCode"
            type={showPassword ? 'text' : 'password'}
            inputMode="text"
            autoComplete="off"
            value={teamCode}
            onChange={(e) => setTeamCode(e.target.value)}
            placeholder="••••••••"
            className="h-11 w-full rounded-lg border border-input bg-white px-3 pr-10 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? 'Ocultar código' : 'Mostrar código'}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending || !teamCode}
        className="h-12 rounded-lg bg-primary font-medium text-primary-foreground transition-opacity disabled:opacity-50"
      >
        {isPending ? 'Ingresando...' : 'Ingresar'}
      </button>
    </form>
  );
}
