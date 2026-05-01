# Grace Hub Welcome — PWA Equipo de Bienvenida

Aplicación instalable (PWA) para el equipo de bienvenida de la iglesia. Permite registrar visitantes en tiempo real durante los cultos sin necesidad de papel.

## Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui** (componentes base)

## Uso

```bash
npm install
npm run dev       # desarrollo local (puerto 3001)
npm run build
npm start
```

## Variables de entorno

```env
NEXT_PUBLIC_API_URL=https://grace-hub-service.onrender.com/api/v1
WELCOME_TEAM_CODE=<código del equipo>   # solo en backend
```

## Documentación

- [Arquitectura](docs/ARCHITECTURE.md)
- [Propuesta de implementación](../docs-grace-hub/implementation-pending/PROPOSAL-6-PWA-AND-PROSPECT-DETAIL.md)
