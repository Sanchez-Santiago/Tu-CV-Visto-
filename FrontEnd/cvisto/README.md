# CVisto — Frontend

Frontend de **CVisto**: la interfaz web del seguimiento integral de búsquedas laborales.

## Stack

- **React 19** + **Vite 6**
- **Tailwind CSS 4** (tema dark, skeuomorfismo moderno)
- **lucide-react** (iconos) · **motion** (animaciones)
- **Zod** (schemas de los datos del frontend)

## Estructura

```
src/
├── components/  → vistas (dashboard, postulaciones, empresas, contactos,
│                  emails, estrategia, seguimientos, análisis, configuración)
│                  y librería UI (Button, Input, Modal, Select, Toast…)
├── hooks/       → useAuth, usePostulaciones, useEmails, useEstrategia…
├── lib/         → cliente de API (client.ts), helpers de texto y nombres
├── schemas/     → schemas Zod
└── types/       → tipos de la aplicación
```

## Puesta en marcha

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Configurar `VITE_API_URL` en `.env` (por defecto apunta a `http://localhost:3000`):

   ```bash
   VITE_API_URL=http://localhost:3000
   ```

3. Levantar el dev server (en `http://localhost:5173`):

   ```bash
   npm run dev
   ```

### Otros comandos

| Comando | Descripción |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Build de producción |
| `npm run preview` | Vista previa del build |
| `npm run lint` | Chequeo de tipos (`tsc --noEmit`) |