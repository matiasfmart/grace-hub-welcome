'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { createProspect } from '@/lib/api/prospects';
import { useMembers } from '@/hooks/use-members';
import type { Member, Visitor } from '@/lib/types';

interface RegisterFormProps {
  token: string;
  onVisitorRegistered: (visitor: Visitor) => void;
}

function todayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function RegisterForm({
  token,
  onVisitorRegistered,
}: RegisterFormProps) {
  const firstNameRef = useRef<HTMLInputElement>(null);
  const { members } = useMembers();
  const [isPending, startTransition] = useTransition();

  // Visitor fields — cleared after each successful submit
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [contact, setContact] = useState('');
  const [notes, setNotes] = useState('');

  // addedBy — NOT cleared after submit (same person registers multiple visitors in a session)
  const [addedBy, setAddedBy] = useState<number>(0);
  const [addedByName, setAddedByName] = useState<string>('');
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Focus first field on mount
  useEffect(() => {
    firstNameRef.current?.focus();
  }, []);

  const filteredMembers = members.filter((m) =>
    m.fullName.toLowerCase().includes(memberSearch.toLowerCase()),
  );

  const handleSelectMember = (member: Member) => {
    setAddedBy(member.id);
    setAddedByName(member.fullName);
    setMemberSearch('');
    setShowMemberDropdown(false);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!firstName.trim()) newErrors.firstName = 'El nombre es requerido.';
    if (!lastName.trim()) newErrors.lastName = 'El apellido es requerido.';
    if (!addedBy) newErrors.addedBy = 'Seleccioná quién está agregando este visitante.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    if (!validate()) return;

    startTransition(async () => {
      try {
        const result = await createProspect(token, {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          contact: contact.trim() || undefined,
          notes: notes.trim() || undefined,
          visitDate: todayISO(),
          source: 'pwa',
          addedBy,
        });

        const visitor: Visitor = {
          id: result.prospectId,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          contact: contact.trim() || undefined,
          notes: notes.trim() || undefined,
          registeredAt: new Date().toISOString(),
          addedByName,
        };

        onVisitorRegistered(visitor);

        // Clear visitor fields only — addedBy is intentionally preserved
        setFirstName('');
        setLastName('');
        setContact('');
        setNotes('');
        setErrors({});
        setSuccessMessage(`✓ ${visitor.firstName} ${visitor.lastName} registrado/a`);

        // Auto-hide success message after 3s
        setTimeout(() => setSuccessMessage(null), 3000);

        // Re-focus first field for next entry
        firstNameRef.current?.focus();
      } catch (err: unknown) {
        setErrors({
          submit: err instanceof Error ? err.message : 'Error al registrar visitante',
        });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Visitor name fields */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="firstName" className="text-sm font-medium">
            Nombre <span className="text-destructive">*</span>
          </label>
          <input
            ref={firstNameRef}
            id="firstName"
            type="text"
            autoComplete="off"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="h-11 rounded-lg border border-input bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          {errors.firstName && (
            <p className="text-xs text-destructive">{errors.firstName}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="lastName" className="text-sm font-medium">
            Apellido <span className="text-destructive">*</span>
          </label>
          <input
            id="lastName"
            type="text"
            autoComplete="off"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="h-11 rounded-lg border border-input bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          {errors.lastName && (
            <p className="text-xs text-destructive">{errors.lastName}</p>
          )}
        </div>
      </div>

      {/* Contact */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="contact" className="text-sm font-medium text-muted-foreground">
          Teléfono / WhatsApp
        </label>
        <input
          id="contact"
          type="tel"
          inputMode="tel"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="11-1234-5678"
          className="h-11 rounded-lg border border-input bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Notes */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="notes" className="text-sm font-medium text-muted-foreground">
          Notas
        </label>
        <textarea
          id="notes"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Primera vez, conocido de..."
          className="rounded-lg border border-input bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>

      {/* Added by — required, persists between submissions */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">
          Cargado por <span className="text-destructive">*</span>
        </label>

        {!showMemberDropdown ? (
          <button
            type="button"
            onClick={() => { setShowMemberDropdown(true); setMemberSearch(''); }}
            className="flex h-11 items-center justify-between rounded-lg border border-input bg-white px-3 text-sm text-foreground"
          >
            <span>{addedByName}</span>
            <span className="text-muted-foreground text-xs">Cambiar</span>
          </button>
        ) : (
          <div className="relative">
            <input
              type="text"
              autoFocus
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              placeholder="Buscar tu nombre..."
              className="h-11 w-full rounded-lg border border-input bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            {filteredMembers.length > 0 && (
              <ul className="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-lg border border-border bg-white shadow-lg">
                {filteredMembers.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      onMouseDown={() => handleSelectMember(m)}
                      className="w-full px-3 py-2.5 text-left text-sm hover:bg-secondary"
                    >
                      {m.fullName}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {errors.addedBy && (
          <p className="text-xs text-destructive">{errors.addedBy}</p>
        )}
      </div>

      {/* Submit error */}
      {errors.submit && (
        <div className="rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          {errors.submit}
        </div>
      )}

      {/* Success feedback */}
      {successMessage && (
        <div className="rounded-lg bg-green-50 px-3 py-2.5 text-sm font-medium text-green-700">
          {successMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="h-12 rounded-lg bg-primary font-medium text-primary-foreground transition-opacity disabled:opacity-50"
      >
        {isPending ? 'Registrando...' : 'Registrar visitante'}
      </button>
    </form>
  );
}
