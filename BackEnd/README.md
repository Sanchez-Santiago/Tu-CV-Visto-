# CVisto — Backend

Backend de **JobTrack / CVisto**: gestión de postulaciones laborales.

## Stack

- **Runtime**: Bun
- **Lenguaje**: TypeScript (strict)
- **Framework**: Express
- **Base de datos**: SQLite remoto vía Turso (`@libsql/client`)
- **Validación**: Zod
- **Tests**: Vitest + Supertest

## Arquitectura

```
HTTP Request
     ↓
Controller  →  validación y HTTP (Zod en los middlewares)
     ↓
Service     →  lógica de negocio y reglas
     ↓
Model       →  acceso a datos (queries parametrizadas)
     ↓
Turso / SQLite
```

## Requisitos

- Bun >= 1.3

## Instalación

```bash
bun install
cp .env.example .env   # completar TOKEN_TURSO y URL_TURSO
```

## Comandos

| Comando             | Descripción                                        |
| ------------------- | -------------------------------------------------- |
| `bun run dev`       | Levanta el servidor con watch                      |
| `bun run start`     | Levanta el servidor                                |
| `bun run migrate`   | Aplica `schema.sql` + migraciones de columnas (idempotentes) + `seeds.sql` a Turso |
| `bun run test`      | Corre Vitest                                       |
| `bun run typecheck` | TypeScript sin emitir (tsc --noEmit)               |
| `bun run lint`      | ESLint                                             |
| `bun run format`    | Prettier                                           |

## Configuración por entorno (`.env`)

- `NODE_ENV` — `development` | `production` | `test` (por defecto `development`).
- `LOG_LEVEL` — `debug` | `info` | `warn` | `error` | `silent`. Por defecto `debug` en
  development y `warn` en production; `silent` apaga todo el logging
  (arranque, requests, errores y flujo OAuth).
- `PANTALLA_BETA` — `true` (por defecto): tras el login el backend **muestra una pantalla
  de "fase de prueba"** en `GET /auth/callback` en lugar de redirigir al frontend.
  En `false` vuelve el redirect a `FRONTEND_URL/auth/callback`. Útil mientras no exista
  el frontend o la app esté sin verificar.
- `CADENCIA_CONTACTO_DIAS` — días sugeridos entre contactos a una empresa (por defecto `30`).
  Se usa al enviar un email para calcular `postulaciones.proxima_contacto = hoy + cadencia`;
  una empresa puede sobreescribir la global con `empresas.cadencia_contacto`.

## Endpoints disponibles

### Sistema
- `GET /` — página home del backend.
- `GET /docs` — documentación completa de la API (endpoints, parámetros y respuestas con ejemplos).
- `GET /health` — estado del servidor y conexión a la base.

### Autenticación (Google OAuth)
- `GET /auth/google/login` — redirige a Google para autorizar (login + Gmail).
- `GET /auth/google/callback` — exchange del código, crea/actualiza el usuario, guarda los tokens en `cuentas_google`, emite JWT en cookie y redirige a `FRONTEND_URL`.
- `GET /auth/me` — **protegido**, devuelve el usuario autenticado (lee cookie o Bearer).
- `GET /auth/callback` — **protegido**, pantalla de "fase de prueba" (si `PANTALLA_BETA=true`); también sirve de destino al refrescar tras el login.
- `POST /auth/logout` — limpia las cookies de sesión.

> Nota: el *Authorized redirect URI* de Google Cloud Console debe coincidir exactamente
> con `GOOGLE_CALLBACK_URL` y el consent screen debe incluir `gmail.readonly` y `gmail.send`.
> La primera vez que el usuario se autentica hay que guardar `refresh_token` (el
> consent con `access_type=offline` lo devuelve); sin él no se podrán renovar accesos.
> El callback acepta `?redirect=` opcional (debe empezar con `FRONTEND_URL`; si no, vuelve a `FRONTEND_URL/auth/callback`). Con `PANTALLA_BETA=true` siempre se muestra la pantalla de prueba en el backend y se ignoran los redirects.

### Categorías
- `GET /api/categorias` · `POST /api/categorias` · `GET/PUT/DELETE /api/categorias/:id`

### Empresas
- `GET /api/empresas` (filtro opcional `?modalidad=`) · `POST /api/empresas`
- `GET/PUT/DELETE /api/empresas/:id`
- `GET /api/empresas/:id/contactos` — contactos RRHH de la empresa

### Contactos RRHH
- `POST /api/contactos-rrhh` · `GET/PUT/DELETE /api/contactos-rrhh/:id`

### Postulaciones
- `GET /api/postulaciones` — listar (filtros opcionales: `estado`, `interes`, `modalidad`, `empresa_id`, `usuario_id`).
- `POST /api/postulaciones` — crear (`usuario_id`, `empresa_id`, `puesto` obligatorios).
- `GET/PUT/DELETE /api/postulaciones/:id`
- `GET /api/postulaciones/:id/relacion` — línea de tiempo de la relación: postulación + emails + seguimientos.
- `GET /api/postulaciones/:postulacionId/contactos` · `POST /api/postulaciones/:postulacionId/contactos` (`{ contacto_rrhh_id }`) · `DELETE /api/postulaciones/:postulacionId/contactos/:contactoId`

### Emails (historial de comunicaciones)
- `GET /api/emails` — listar (filtro opcional `?postulacion_id=`) · `POST /api/emails`
- `GET/PUT/DELETE /api/emails/:id`
- Al crear/borrar un email con `enviado=1` se actualiza automáticamente `cantidad_mails_enviados`, `ultimo_contacto` (y la `proxima_contacto` sugerida) de la postulación.
- Campo `tipo_seguimiento` para registrar el motivo estratégico del contacto (`consulta | novedad | recordatorio | nuevo_proyecto | disponibilidad`).

### Seguimientos (estrategia de contacto)
- `GET /api/seguimientos` — listar (filtros `?postulacion_id=`, `?enviado=`) · `GET /api/seguimientos/pendientes`
- `POST /api/seguimientos` · `GET/PUT/DELETE /api/seguimientos/:id`
- Cada seguimiento lleva `tipo_seguimiento` (default `consulta`). Al marcar un seguimiento como `enviado=1` se asigna `fecha_envio` automáticamente si no venía.

### Estrategia de contacto
- `GET /api/estrategia/debidas` — a quién conviene contactar ahora: postulaciones activas con
  `proxima_contacto` vencida o sin contacto desde hace más de una cadencia. Devuelve días desde el
  último contacto y `tipo_sugerido` de mensaje. Sin tareas en segundo plano: el sistema solo sugiere
  y el usuario decide enviar.

### Gmail (envío y lectura reales)
Endpoints protegidos por autenticación (requieren una fila en `cuentas_google` con token vigente).
- `POST /api/gmail/enviar` — envía un email por la Gmail API del usuario (`postulacion_id`, `destinatario` obligatorios; `asunto` y `cuerpo` opcionales — si faltan, el backend genera el borrador de novedades con la plantilla según `tipo_seguimiento`). Registra el email en `emails` (con `gmail_message_id` y `tipo_seguimiento`), incrementa `cantidad_mails_enviados`/`ultimo_contacto` y recalcula `proxima_contacto`; puede crear el seguimiento como enviado.
- `GET /api/gmail/mensajes` — lista mensajes (`?max_results=` 1-50 por defecto 10, `?q=` búsqueda tipo Gmail).
- `GET /api/gmail/mensajes/:id` — detalle de un mensaje (cabeceras From/To/Subject/Date, cuerpo decodificado).
- El token de acceso se renueva automáticamente con el `refresh_token` si está vencido.

### Tablas puente
- `GET /api/usuarios/:usuarioId/categorias` · `POST /api/usuarios/:usuarioId/categorias` (`{ categoria_id }`) · `DELETE /api/usuarios/:usuarioId/categorias/:categoriaId`

## Estructura

```
src/
├── config/      → env (Zod) y cliente de Turso
├── controllers/ → entrada/salida HTTP
├── services/    → lógica de negocio
├── models/      → acceso a datos
├── routes/      → definición de rutas Express
├── middlewares/ → auth, errores, logger, validación
├── schemas/     → schemas Zod por entidad
├── types/       → tipos compartidos, enums y filas de tablas
└── utils/       → errores, JWT, migraciones, documentación
database/
├── schema.sql   → DDL (creación de tablas e índices)
└── seeds.sql    → datos iniciales (categorías base)
scripts/migrate.ts → aplica schema + seeds
tests/           → tests Vitest (usan SQLite local)
```

## Base de datos

El schema lo definen las tablas en `database/schema.sql`:

`usuarios`, `experiencias_laborales`, `proyectos`, `categorias_trabajo`,
`usuario_categorias`, `contactos`, `empresas`, `contactos_rrhh`,
`postulaciones`, `postulacion_contactos`, `emails`, `seguimientos`,
`cuentas_google` (tokens OAuth de Google por usuario para la integración Gmail).

Los tests corren contra un SQLite local (`tests/.test-cvisto.db`) para no
tocar la base remota; el schema se resetea antes de cada suite.