# CVisto

**Seguimiento integral de búsquedas laborales** — un espacio de trabajo digital para organizar tus postulaciones, empresas, contactos de RR. HH. y comunicaciones en un solo lugar.

> JobTrack / CVisto: *Personal Job Application & Follow-up Manager*

---

## Objetivo del proyecto

Buscar trabajo implica postularse a varias empresas al mismo tiempo, y es fácil perder el control de:

- dónde te postulaste y a qué puesto;
- cuándo se envió cada postulación;
- qué persona de RR. HH. fue contactada;
- qué correos enviaste y si te respondieron;
- si el proceso continúa o fue rechazado;
- cuándo corresponde hacer un seguimiento;
- cuáles oportunidades son las más interesantes.

**CVisto centraliza toda esa información** con un seguimiento ordenado y estadísticas, ayudando a las personas que buscan trabajo a no perder oportunidades por falta de organización. El sistema **no reemplaza tus decisiones**: actúa como un asistente de gestión que organiza la información y automatiza tareas previamente autorizadas (como preparar seguimientos o sincronizar tu Gmail).

```
Encontrar oportunidad
        ↓
Registrar empresa y contacto RRHH
        ↓
Registrar postulación
        ↓
Enviar postulación  (desde Gmail o registrando el email)
        ↓
Esperar respuesta  ← la sincronización detecta respuestas automáticamente
        ↓
¿Respondieron?
   ┌────┴────┐
   │         │
  NO        SÍ
   │         │
  Preparar    Actualizar estado
  seguimiento│
   ↓
  Enviar seguimiento
```

### Estados de postulación

Cada postulación puede pasar por: `pendiente`, `en_proceso`, `entrevista`, `oferta`, `aceptado`, `rechazado`, `cancelado`. Cada correo vinculado, cada contacto y cada seguimiento quedan registrados y ligados a esa postulación.

---

## IA (roadmap — no implementada)

Se planea incorporar asistencia con **inteligencia artificial** en el futuro, por ejemplo:

- analizar automáticamente las respuestas recibidas y sugerir próximos pasos;
- redactar borradores de seguimiento personalizados por postulación;
- detectar oportunidades de mejora en el CV o en el tono de las comunicaciones.

> ⚠️ **Aún no está implementado.** En el repo quedaron dependencias base de `@google/genai` en el frontend, pero la IA no está en uso en ninguna funcionalidad actual.

---

## Funcionalidades actuales

- **Dashboard** con estadísticas y gráfico de actividad mensual (emails enviados/recibidos, postulaciones activas, tasas de respuesta).
- **Postulaciones**: alta/edición/borrado, estados, nivel de interés, fuente, modalidad, contador de emails enviados y próximos contactos.
- **Empresas** y **contactos de RR. HH.**, con botón para escribirles un email directo.
- **Emails**:
  - historial vinculado a postulaciones con registro manual;
  - **lector de correos** con vista HTML completa;
  - **Responder / Reenviar** con el asunto y el mensaje original precargados;
  - redacción con **CC**, **adjuntos** (fotos, videos, PDF, Word, zip… hasta 18 MB) y **autocompletar destinatario** desde tus contactos;
  - filtros: búsqueda, Todos/Recibidos/Enviados, **rango de fechas** y **paginación** (50 por página).
- **Sincronización con Gmail**: importa correos de los últimos 60 días (recibidos **y enviados**, con paginación), vincula mails enviados a postulaciones por empresa/contacto y **clasifica automáticamente las respuestas** (rechazo, entrevista, novedad, contacto) detectando palabras clave.
- **Estrategia de contacto**: lista quién conviene contactar ahora (cadencia vencida), renovaciones sugeridas con plantillas, revisiones de rechazos y cálculos de próximos contactos.
- **Seguimientos** con fecha programada, tipo y aprobación antes del envío.
- **Exportación de backup** en JSON y configuración de perfil.
- **Login con Google OAuth 2.0**.

---

## Tecnologías

### Backend (`BackEnd/`)

| Herramienta | Uso |
|---|---|
| **Bun** | Runtime y gestor de paquetes |
| **TypeScript** | Lenguaje (modo estricto) |
| **Express** | Framework HTTP |
| **Zod** | Validación de entrada y tipos |
| **Turso / SQLite** | Base de datos (`@libsql/client`) |
| **google-auth-library** | OAuth 2.0 / Google |
| **jose** | Firmado y verificación de JWT |
| **Vitest + Supertest** | Tests (168 tests) |
| **ESLint / Prettier** | Lint y formato |

### Frontend (`FrontEnd/cvisto/`)

| Herramienta | Uso |
|---|---|
| **React 19** | UI |
| **Vite 6** | Bundler y dev server |
| **Tailwind CSS 4** | Estilos (tema dark, skeuomorfismo moderno) |
| **lucide-react** | Iconos |
| **motion** | Animaciones |
| **Zod** | Schemas compartidos del frontend |

### Integraciones

- **Google OAuth 2.0**: inicio de sesión sin guardar contraseñas.
- **Gmail API**: sincronización de inbox, lectura de mensajes, clasificación de respuestas y envío de correos reales (con CC y adjuntos multipart).

---

## Estructura del proyecto

```
.
├── BackEnd/
│   ├── src/
│   │   ├── config/       → env (Zod), cliente de Turso, credenciales de Google
│   │   ├── controllers/  → entrada y salida HTTP
│   │   ├── services/     → lógica de negocio (Gmail, sincronización, estrategia…)
│   │   ├── models/       → acceso a datos (queries parametrizadas)
│   │   ├── routes/       → definición de rutas Express
│   │   ├── schemas/      → validación Zod por entidad
│   │   ├── middlewares/  → autenticación, errores, logger, validación
│   │   ├── types/        → tipos compartidos, enums y filas de tablas
│   │   └── utils/        → errores, JWT, migraciones, documentación
│   ├── database/         → schema.sql (DDL) y seeds.sql (datos base)
│   ├── scripts/          → migrate.ts
│   └── tests/            → suites Vitest (SQLite local)
│
└── FrontEnd/
    └── cvisto/
        ├── src/
        │   ├── components/  → vistas, modales y librería UI
        │   ├── hooks/       → useAuth, usePostulaciones, useEmails…
        │   ├── lib/         → cliente de API y helpers de texto
        │   ├── schemas/     → schemas Zod del frontend
        │   └── types/       → tipos de la aplicación
        ├── index.html
        └── vite.config.ts
```

### Arquitectura del backend

```
HTTP Request
     ↓
Controller  → validación y HTTP (Zod en los middlewares)
     ↓
Service     → lógica de negocio y reglas
     ↓
Model       → acceso a datos (queries parametrizadas)
     ↓
Turso / SQLite
```

---

## Puesta en marcha local

### Requisitos

- **Bun** ≥ 1.3
- **Node.js** (para el frontend)

### Backend (`BackEnd/`)

1. Copiar `.env.example` a `.env` y completar las variables:
   - `URL_TURSO` y `TOKEN_TURSO`: base remota de Turso (o `file:./db.sqlite` para local).
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` y el redirect URI (`GOOGLE_CALLBACK_URL`).
   - `JWT_SECRET`: una clave larga y aleatoria.
2. Instalar dependencias y preparar la base:

   ```bash
   bun install
   bun run migrate
   ```

3. Levantar el servidor (por defecto en `http://localhost:3000`):

   ```bash
   bun run dev
   ```

### Frontend (`FrontEnd/cvisto/`)

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Configurar `VITE_API_URL` en `.env` apuntando al backend (por defecto `http://localhost:3000`).
3. Levantar la app (por defecto en `http://localhost:5173`):

   ```bash
   npm run dev
   ```

### Scripts útiles

| Comando | Descripción |
|---|---|
| `bun run migrate` | Aplica schema y seeds a la base |
| `bun test` | Corre las 168 pruebas del backend (Vitest) |
| `bun run typecheck` | Chequeo de tipos del backend |
| `bun run lint` | ESLint del backend |
| `npm run dev` | Dev server del frontend (Vite) |
| `npm run build` | Build de producción del frontend |
| `npm run lint` | Chequeo de tipos del frontend (`tsc --noEmit`) |

---

## Tests

El backend cuenta con **168 tests** cubriendo autenticación, empresas, contactos, postulaciones, emails, seguimientos, estrategia, sincronización de Gmail, envío de correos (incluidos CC y adjuntos multipart), renovaciones por plantilla y más. Los tests corren contra una base SQLite local para no tocar la base remota.

---

## Licencia

Licenciado bajo la **GNU General Public License v3.0**. Ver [`LICENSE`](LICENSE).