# Grace Hub Welcome — Arquitectura

> **Versión:** 1.0  
> **Fecha:** 2026-05-01  
> **Proyecto:** `grace-hub-welcome/`  
> **Propósito:** Aplicación PWA para el equipo de bienvenida — registro de visitantes en tiempo real

---

## 1. Principios de diseño

Esta aplicación tiene **un solo caso de uso**: registrar visitantes durante un culto. La arquitectura refleja esa simplicidad — sin capas innecesarias, sin abstracciones prematuras.

### Reglas inviolables

| # | Regla |
|---|---|
| R-1 | No hay multi-capas (no Services, no Mappers, no Endpoints separados). Hay exactamente **una función de fetch por operación de API**. |
| R-2 | El estado de autenticación vive en `sessionStorage`. No hay cookies. No hay Redux. |
| R-3 | La lista de visitantes del culto vive en estado React (`useState`). Se pierde al cerrar la app — esto es intencional. |
| R-4 | El `member_id` del usuario actual (quien está cargando) se persiste en `localStorage` para sobrevivir recargas. |
| R-5 | Los únicos archivos que hacen `fetch()` son los que están en `src/lib/api/`. Ningún componente llama a `fetch()` directamente. |
| R-6 | Cero lógica de negocio en los componentes. Los componentes solo renderizan y manejan eventos UI. |

---

## 2. Estructura de carpetas

```
grace-hub-welcome/
├── public/
│   ├── manifest.json          ← configuración PWA (nombre, íconos, display: standalone)
│   └── icons/                 ← íconos PNG en distintos tamaños (192x192, 512x512)
│
├── src/
│   ├── app/
│   │   ├── layout.tsx         ← Root layout: meta PWA, viewport, font
│   │   ├── globals.css        ← Tailwind base
│   │   ├── page.tsx           ← Pantalla de login (código de equipo)
│   │   └── register/
│   │       └── page.tsx       ← Pantalla principal de registro de visitantes
│   │
│   ├── components/
│   │   ├── login-form.tsx     ← Formulario de código de equipo + selector de identidad
│   │   ├── register-form.tsx  ← Formulario de datos del visitante
│   │   └── session-list.tsx   ← Lista en-memoria de visitantes del culto actual
│   │
│   ├── lib/
│   │   ├── types.ts           ← Tipos mínimos: Visitor, Member, AuthState
│   │   ├── storage.ts         ← Helpers para sessionStorage y localStorage
│   │   └── api/
│   │       ├── auth.ts        ← POST /auth/team-login
│   │       ├── members.ts     ← GET /members?record_status=vigente&minimal=true
│   │       └── prospects.ts   ← POST /prospects
│   │
│   └── hooks/
│       ├── use-auth.ts        ← Lee/escribe token en sessionStorage, redirige si no hay token
│       └── use-members.ts     ← Carga lista de miembros una vez, la cachea en estado
│
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 3. Flujo de navegación

```
/ (login)
  ├── Usuario ingresa código de equipo
  ├── Selecciona su nombre de la lista de miembros (obligatorio)
  └── POST /auth/team-login → token en sessionStorage + memberId en localStorage
        ↓
/register (pantalla principal)
  ├── Formulario: Nombre *, Apellido *, Teléfono, Notas
  ├── Campo "Cargado por" pre-cargado desde localStorage (cambiable)
  ├── POST /prospects → visitante registrado
  ├── Formulario se limpia
  └── Visitante aparece en lista en-memoria de la sesión
```

Si el usuario recarga `/register` sin token en `sessionStorage`, `use-auth.ts` redirige a `/`.  
Si el usuario recarga `/register` con token válido, el formulario se muestra con el último miembro pre-seleccionado desde `localStorage`.

---

## 4. Tipos mínimos (`src/lib/types.ts`)

```typescript
export interface Member {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
}

export interface Visitor {
  id: number;           // prospectId devuelto por el backend
  firstName: string;
  lastName: string;
  contact?: string;
  notes?: string;
  registeredAt: string; // ISO string del momento del registro
  addedByName: string;  // nombre del miembro que lo registró (para mostrar en la lista)
}

export interface AuthState {
  token: string;
  memberId: number;
  memberName: string;
}
```

---

## 5. Capa de API (`src/lib/api/`)

### `auth.ts`

```typescript
const API = process.env.NEXT_PUBLIC_API_URL;

export async function teamLogin(teamCode: string, memberId: number): Promise<string> {
  const res = await fetch(`${API}/auth/team-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teamCode, memberId }),
  });
  if (!res.ok) throw new Error('Código incorrecto');
  const data: { token: string } = await res.json();
  return data.token;
}
```

### `members.ts`

```typescript
export async function getActiveMembers(): Promise<Member[]> {
  const res = await fetch(`${API}/members?record_status=vigente&fields=minimal`);
  if (!res.ok) throw new Error('Error al cargar miembros');
  const data = await res.json();
  // El endpoint devuelve { data: MemberResponse[] } — extraer y mapear solo los campos necesarios
  return data.data.map((m: { memberId: number; firstName: string; lastName: string }) => ({
    id: m.memberId,
    firstName: m.firstName,
    lastName: m.lastName,
    fullName: `${m.firstName} ${m.lastName}`,
  }));
}
```

### `prospects.ts`

```typescript
export interface CreateVisitorPayload {
  firstName: string;
  lastName: string;
  visitDate: string;   // YYYY-MM-DD (generado automáticamente)
  contact?: string;
  notes?: string;
  source: 'pwa';
  addedBy: number;     // member_id — obligatorio
}

export async function createProspect(
  token: string,
  payload: CreateVisitorPayload,
): Promise<{ prospectId: number }> {
  const res = await fetch(`${API}/prospects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Error al registrar visitante');
  return res.json();
}
```

---

## 6. Storage helpers (`src/lib/storage.ts`)

```typescript
const KEYS = {
  TOKEN: 'ghw_token',
  MEMBER_ID: 'ghw_member_id',
  MEMBER_NAME: 'ghw_member_name',
} as const;

// sessionStorage — se pierde al cerrar el navegador/tab
export const session = {
  setToken: (token: string) => sessionStorage.setItem(KEYS.TOKEN, token),
  getToken: (): string | null => sessionStorage.getItem(KEYS.TOKEN),
  clear: () => { sessionStorage.removeItem(KEYS.TOKEN); },
};

// localStorage — persiste entre sesiones del mismo dispositivo
export const local = {
  setMember: (id: number, name: string) => {
    localStorage.setItem(KEYS.MEMBER_ID, String(id));
    localStorage.setItem(KEYS.MEMBER_NAME, name);
  },
  getMemberId: (): number | null => {
    const val = localStorage.getItem(KEYS.MEMBER_ID);
    return val ? Number(val) : null;
  },
  getMemberName: (): string | null => localStorage.getItem(KEYS.MEMBER_NAME),
};
```

**Por qué dos storages distintos:**  
- `token` en `sessionStorage`: expira cuando se cierra la pestaña. Si el teléfono se queda solo en el culto, nadie puede acceder sin reautenticarse.  
- `memberId` en `localStorage`: sobrevive recargas. La persona que estaba usando el formulario es la misma después de un F5. No requiere volver a seleccionarse.

---

## 7. Hooks

### `use-auth.ts`

```typescript
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { session } from '@/lib/storage';

export function useAuth() {
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
```

**Uso:** `const token = useAuth()` en `register/page.tsx`. Si devuelve `null`, el componente renderiza `null` (en blanco) mientras redirige.

### `use-members.ts`

```typescript
'use client';
import { useEffect, useState } from 'react';
import { getActiveMembers } from '@/lib/api/members';
import type { Member } from '@/lib/types';

export function useMembers() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getActiveMembers()
      .then(setMembers)
      .finally(() => setLoading(false));
  }, []);

  return { members, loading };
}
```

**Notas:**
- Se carga una sola vez al montar el componente padre.
- No hay caché persistida — si se recarga la app, vuelve a pedir los miembros. Con ~100 miembros esta llamada es negligible (<5ms en red local, <50ms en producción).
- Sin error state porque si falla, el formulario muestra el dropdown vacío — el usuario puede reintentar recargando.

---

## 8. Componentes

### `login-form.tsx`

**Responsabilidad:** Capturar código de equipo + identidad del miembro y autenticar.

**Estado local:**
- `teamCode: string`
- `selectedMemberId: number | null` — pre-cargado desde `localStorage`
- `isPending: boolean`
- `error: string | null`

**Flujo:**
1. Carga lista de miembros con `useMembers()`
2. Pre-selecciona el último miembro desde `localStorage`
3. On submit: llama `teamLogin(code, memberId)` → guarda token en `sessionStorage` + miembro en `localStorage` → `router.push('/register')`

**Validación:** Ambos campos son obligatorios. El botón queda `disabled` si alguno falta o si `isPending`.

---

### `register-form.tsx`

**Responsabilidad:** Capturar datos del visitante y enviarlo al backend.

**Props:**
```typescript
interface RegisterFormProps {
  token: string;
  currentMemberId: number;
  currentMemberName: string;
  onVisitorRegistered: (visitor: Visitor) => void;
}
```

**Estado local:**
- `firstName`, `lastName`, `contact`, `notes`: `string`
- `addedBy: number` — inicializado con `currentMemberId`, cambiable
- `isPending: boolean`
- `errors: Record<string, string>`

**On submit:**
1. Valida `firstName` y `lastName` requeridos, `addedBy` requerido
2. Llama `createProspect(token, { ...data, visitDate: todayISO(), source: 'pwa', addedBy })`
3. `onVisitorRegistered(visitor)` — agrega a lista en-memoria
4. Limpia los campos `firstName`, `lastName`, `contact`, `notes`. **No limpia `addedBy`** — la misma persona puede registrar varios visitantes seguidos.

---

### `session-list.tsx`

**Responsabilidad:** Mostrar los visitantes registrados en el culto actual.

**Props:**
```typescript
interface SessionListProps {
  visitors: Visitor[];
}
```

Lista simple, ordenada por hora de registro descendente. Muestra nombre completo, hora de registro, y "Cargado por: [nombre]". Sin acciones (no puede editar ni borrar desde la PWA — regla de negocio).

---

## 9. Pantallas

### Pantalla `/` — Login

```
┌─────────────────────────────────┐
│       Grace Hub                 │
│       Equipo de Bienvenida      │
├─────────────────────────────────┤
│                                 │
│  Código del equipo *            │
│  [________________________]     │
│                                 │
│  ¿Cuál es tu nombre? *          │
│  [Buscar miembro...]  ▾         │
│                                 │
│       [  Ingresar  ]            │
│                                 │
│  (mensaje de error si hay)      │
└─────────────────────────────────┘
```

---

### Pantalla `/register` — Registro

```
┌─────────────────────────────────┐
│  Grace Hub · Bienvenida         │
│  Hola, María L.        [Salir]  │
├─────────────────────────────────┤
│                                 │
│  Nombre *                       │
│  [________________________]     │
│                                 │
│  Apellido *                     │
│  [________________________]     │
│                                 │
│  Teléfono / WhatsApp            │
│  [________________________]     │
│                                 │
│  Notas                          │
│  [________________________]     │
│                                 │
│  Cargado por *                  │
│  [María López          ]  ▾     │
│                                 │
│  [  Registrar visitante  ]      │
│                                 │
├─────────────────────────────────┤
│  Registrados hoy (3):           │
│  · Juan García  · 20:15  María  │
│  · Ana Pérez    · 20:08  Carlos │
│  · Luis Gómez   · 19:55  María  │
└─────────────────────────────────┘
```

---

## 10. Configuración PWA (`public/manifest.json`)

```json
{
  "name": "Grace Hub Bienvenida",
  "short_name": "Bienvenida",
  "description": "Registro de visitantes para el equipo de bienvenida",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

En `app/layout.tsx`:
```typescript
export const metadata = {
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default' },
};
```

---

## 11. Decisiones de diseño documentadas

| Decisión | Alternativa descartada | Justificación |
|---|---|---|
| No hay capas de Service/Mapper/Endpoint | Seguir la arquitectura del admin | La PWA tiene 3 llamadas HTTP. Las capas existen para manejar complejidad — aquí no hay complejidad que manejar. |
| `addedBy` en el formulario (no en el login) | Login individual por miembro | El equipo usa un solo teléfono. El "quién carga" es contextual a cada visitante, no a la sesión completa. |
| `addedBy` obligatorio sin validación en backend | `NOT NULL` en DB | La DB ya acepta `null` (datos existentes). La obligatoriedad se aplica solo en la UI para nuevos registros. |
| `token` en `sessionStorage`, `memberId` en `localStorage` | Todo en uno o todo en otro | El token debe expirar al cerrar la tab (seguridad). La identidad del miembro puede sobrevivir recargas (UX). |
| Lista de visitantes en React state (in-memory) | Persistir en DB y traerlos con GET | La lista "del culto actual" no tiene un concepto claro en el modelo de datos. Usar el estado React es simple y correcto. |
| `GET /members` sin auth (o con Bearer token) | Endpoint público | Los miembros no son datos sensibles para este contexto. Se puede proteger con Bearer si se prefiere. |
