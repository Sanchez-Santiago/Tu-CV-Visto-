import { env } from '../config/env';

type MetodoRuta = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface Parametro {
  nombre: string;
  tipo: string;
  donde: 'path' | 'query' | 'body';
  requerido: boolean;
  descripcion: string;
}

interface Respuesta {
  status: number;
  descripcion: string;
  ejemplo?: unknown;
}

interface Endpoint {
  metodo: MetodoRuta;
  path: string;
  descripcion: string;
  auth?: boolean;
  params: Parametro[];
  respuestas: Respuesta[];
}

interface Grupo {
  titulo: string;
  descripcion: string;
  endpoints: Endpoint[];
}

const COLOR_METODO: Record<MetodoRuta, string> = {
  GET: '#22c55e',
  POST: '#3b82f6',
  PUT: '#f59e0b',
  DELETE: '#ef4444',
};

const ENUMS = [
  ['Modalidad', 'presencial | remoto | hibrido | no_especificado'],
  ['Estado postulación', 'pendiente | en_proceso | entrevista | oferta | aceptado | rechazado | cancelado'],
  ['Interés', 'bajo | medio | alto'],
  ['Tipo de email', 'postulacion | seguimiento | respuesta | otro'],
  ['Tipo de seguimiento (estrategia)', 'consulta | novedad | recordatorio | nuevo_proyecto | disponibilidad'],
  ['Flags (enviado/respondio/requiere_aprobacion)', '0 (no) | 1 (sí)'],
] as const;

const GRUPOS: Grupo[] = [
  {
    titulo: 'Sistema',
    descripcion: 'Estado general del servicio.',
    endpoints: [
      {
        metodo: 'GET',
        path: '/health',
        descripcion: 'Devuelve si el servidor está arriba y conectado a Turso.',
        params: [],
        respuestas: [
          { status: 200, descripcion: 'Servidor y base OK', ejemplo: { ok: true, servicio: 'cvisto-backend' } },
          { status: 503, descripcion: 'Base de datos no disponible', ejemplo: { ok: false, servicio: 'cvisto-backend' } },
        ],
      },
    ],
  },
  {
    titulo: 'Autenticación (Google OAuth)',
    descripcion:
      'Flujo con redirect del navegador. Al completarlo se emite un JWT en la cookie ' +
      'httpOnly <code>cvisto_token</code> (más la cookie legible <code>cvisto_logged=1</code>).',
    endpoints: [
      {
        metodo: 'GET',
        path: '/auth/google/login',
        descripcion:
          'Inicia el login con Google: redirige (302) a accounts.google.com con scopes ' +
          '<code>openid email profile gmail.readonly gmail.send</code>.',
        params: [],
        respuestas: [
          { status: 302, descripcion: 'Redirección a accounts.google.com (Location)' },
        ],
      },
      {
        metodo: 'GET',
        path: '/auth/google/callback',
        descripcion:
          'Google redirige aquí con el <code>code</code>. Intercambia el código, crea/actualiza ' +
          'el usuario, guarda los tokens en <code>cuentas_google</code> y setea las cookies de sesión.',
        params: [
          { nombre: 'code', tipo: 'string', donde: 'query', requerido: true, descripcion: 'Código de autorización de Google' },
          { nombre: 'redirect', tipo: 'string', donde: 'query', requerido: false, descripcion: 'Destino posterior (debe empezar con FRONTEND_URL)' },
        ],
        respuestas: [
          { status: 200, descripcion: 'Sin FRONTEND_URL configurada renderiza la pantalla de "fase de prueba" (HTML)' },
          { status: 302, descripcion: 'Con FRONTEND_URL configurada redirige a FRONTEND_URL/auth/callback#token=...' },
          { status: 400, descripcion: 'Falta el parámetro code' },
          { status: 401, descripcion: 'Código de Google inválido o expirado' },
        ],
      },
      {
        metodo: 'GET',
        path: '/auth/callback',
        descripcion: 'Pantalla de "fase de prueba" (HTML). Útil al refrescar tras el login.',
        auth: true,
        params: [],
        respuestas: [
          { status: 200, descripcion: 'HTML de la pantalla beta', ejemplo: '<!doctype html> ...' },
          { status: 401, descripcion: 'Sin sesión' },
        ],
      },
      {
        metodo: 'PUT',
        path: '/api/usuarios/me',
        descripcion: 'Actualiza el perfil del usuario autenticado (parcial: solo se envían los campos presentes).',
        auth: true,
        params: [
          { nombre: 'nombre', tipo: 'string (1-200)', donde: 'body', requerido: false, descripcion: 'Nombre completo' },
          { nombre: 'perfil', tipo: 'string (500)', donde: 'body', requerido: false, descripcion: 'Rol objetivo / perfil' },
          { nombre: 'pais', tipo: 'string (100)', donde: 'body', requerido: false, descripcion: 'País de residencia' },
          { nombre: 'provincia', tipo: 'string (100)', donde: 'body', requerido: false, descripcion: 'Provincia de residencia' },
          { nombre: 'cv', tipo: 'text', donde: 'body', requerido: false, descripcion: 'Contenido del CV / resumen' },
        ],
        respuestas: [
          { status: 200, descripcion: 'Perfil actualizado', ejemplo: { ok: true, data: { id: 3, nombre: 'Santiago', email: 'correo@gmail.com', perfil: 'Frontend Developer', pais: null, provincia: null, cv: null, created_at: '2026-09-01T12:00:00Z', updated_at: '2026-09-10T12:00:00Z' } } },
          { status: 400, descripcion: 'Datos inválidos' },
          { status: 401, descripcion: 'Sin sesión' },
        ],
      },
      {
        metodo: 'GET',
        path: '/auth/me',
        descripcion: 'Devuelve el usuario autenticado según la cookie o el header Bearer.',
        auth: true,
        params: [],
        respuestas: [
          {
            status: 200,
            descripcion: 'Datos del usuario',
            ejemplo: {
              ok: true,
              data: {
                id: 3,
                nombre: 'Santiago',
                email: 'correo@gmail.com',
                perfil: null,
                pais: null,
                provincia: null,
                cv: null,
                created_at: '2026-09-01T12:00:00Z',
                updated_at: '2026-09-01T12:00:00Z',
              },
            },
          },
          { status: 401, descripcion: 'Sin sesión' },
        ],
      },
      {
        metodo: 'POST',
        path: '/auth/logout',
        descripcion: 'Limpia las cookies de sesión.',
        params: [],
        respuestas: [{ status: 204, descripcion: 'Sin contenido' }],
      },
    ],
  },
  {
    titulo: 'Categorías de trabajo',
    descripcion: 'Categorías base (seed) para clasificar experiencias/proyectos del usuario.',
    endpoints: [
      {
        metodo: 'GET',
        path: '/api/categorias',
        descripcion: 'Lista todas las categorías.',
        params: [],
        respuestas: [
          {
            status: 200,
            descripcion: 'Array de categorías',
            ejemplo: { ok: true, data: [{ id: 1, nombre: 'Backend', created_at: '2026-09-01T12:00:00Z' }] },
          },
        ],
      },
      {
        metodo: 'POST',
        path: '/api/categorias',
        descripcion: 'Crea una categoría.',
        params: [
          { nombre: 'nombre', tipo: 'string (1-100)', donde: 'body', requerido: true, descripcion: 'Nombre de la categoría' },
        ],
        respuestas: [
          { status: 201, descripcion: 'Categoría creada', ejemplo: { ok: true, data: { id: 15, nombre: 'Frontend', created_at: '2026-09-10T12:00:00Z' } } },
        ],
      },
      {
        metodo: 'GET',
        path: '/api/categorias/:id',
        descripcion: 'Obtiene una categoría por id.',
        params: [{ nombre: 'id', tipo: 'number', donde: 'path', requerido: true, descripcion: 'Id de la categoría' }],
        respuestas: [{ status: 200, descripcion: 'Categoría' }, { status: 404, descripcion: 'No existe' }],
      },
      {
        metodo: 'PUT',
        path: '/api/categorias/:id',
        descripcion: 'Actualiza una categoría (parcial).',
        params: [
          { nombre: 'id', tipo: 'number', donde: 'path', requerido: true, descripcion: 'Id de la categoría' },
          { nombre: 'nombre', tipo: 'string (1-100)', donde: 'body', requerido: false, descripcion: 'Nuevo nombre' },
        ],
        respuestas: [{ status: 200, descripcion: 'Categoría actualizada' }, { status: 404, descripcion: 'No existe' }],
      },
      {
        metodo: 'DELETE',
        path: '/api/categorias/:id',
        descripcion: 'Elimina una categoría.',
        params: [{ nombre: 'id', tipo: 'number', donde: 'path', requerido: true, descripcion: 'Id de la categoría' }],
        respuestas: [{ status: 204, descripcion: 'Eliminada' }, { status: 404, descripcion: 'No existe' }],
      },
    ],
  },
  {
    titulo: 'Empresas',
    descripcion:
      'Empresas a las que el usuario postula. <code>cadencia_contacto</code> (en días) ajusta la ' +
      'frecuencia de contacto para esa empresa; si es null se usa la global ' +
      '<code>CADENCIA_CONTACTO_DIAS</code>.',
    endpoints: [
      {
        metodo: 'GET',
        path: '/api/empresas',
        descripcion: 'Lista empresas. Filtro opcional por modalidad.',
        params: [
          { nombre: 'modalidad', tipo: 'enum', donde: 'query', requerido: false, descripcion: 'presencial | remoto | hibrido | no_especificado' },
        ],
        respuestas: [
          {
            status: 200,
            descripcion: 'Array de empresas',
            ejemplo: {
              ok: true,
              data: [
                {
                  id: 1,
                  nombre: 'Globant',
                  pais: 'Argentina',
                  provincia: 'Buenos Aires',
                  ciudad: 'CABA',
                  modalidad: 'hibrido',
                  cadencia_contacto: 60,
                  observaciones: null,
                  created_at: '2026-09-01T12:00:00Z',
                  updated_at: '2026-09-01T12:00:00Z',
                },
              ],
            },
          },
        ],
      },
      {
        metodo: 'POST',
        path: '/api/empresas',
        descripcion: 'Crea una empresa.',
        params: [
          { nombre: 'nombre', tipo: 'string (1-200)', donde: 'body', requerido: true, descripcion: 'Nombre de la empresa' },
          { nombre: 'pais', tipo: 'string', donde: 'body', requerido: false, descripcion: 'País' },
          { nombre: 'provincia', tipo: 'string', donde: 'body', requerido: false, descripcion: 'Provincia/estado' },
          { nombre: 'ciudad', tipo: 'string', donde: 'body', requerido: false, descripcion: 'Ciudad' },
          { nombre: 'modalidad', tipo: 'enum', donde: 'body', requerido: false, descripcion: 'presencial | remoto | hibrido | no_especificado' },
          { nombre: 'cadencia_contacto', tipo: 'number (días)|null', donde: 'body', requerido: false, descripcion: 'Cada cuánto conviene contactar (si es null se usa la global)' },
          { nombre: 'observaciones', tipo: 'string (2000)', donde: 'body', requerido: false, descripcion: 'Notas' },
        ],
        respuestas: [{ status: 201, descripcion: 'Empresa creada', ejemplo: { ok: true, data: { id: 1, nombre: 'Globant', pais: 'Argentina', provincia: 'Buenos Aires', ciudad: 'CABA', modalidad: 'remoto', cadencia_contacto: 60, observaciones: null, created_at: '2026-09-10T12:00:00Z', updated_at: '2026-09-10T12:00:00Z' } } }],
      },
      {
        metodo: 'GET',
        path: '/api/empresas/:id',
        descripcion: 'Obtiene una empresa.',
        params: [{ nombre: 'id', tipo: 'number', donde: 'path', requerido: true, descripcion: 'Id de la empresa' }],
        respuestas: [{ status: 200, descripcion: 'Empresa' }, { status: 404, descripcion: 'No existe' }],
      },
      {
        metodo: 'GET',
        path: '/api/empresas/:id/contactos',
        descripcion: 'Lista los contactos de RRHH de la empresa.',
        params: [{ nombre: 'id', tipo: 'number', donde: 'path', requerido: true, descripcion: 'Id de la empresa' }],
        respuestas: [
          { status: 200, descripcion: 'Array de contactos RRHH', ejemplo: { ok: true, data: [{ id: 4, empresa_id: 1, nombre: 'Ana López', email: 'ana@empresa.com', cargo: 'Recruiter', observaciones: null, created_at: '2026-09-01T12:00:00Z', updated_at: '2026-09-01T12:00:00Z' }] } },
        ],
      },
      {
        metodo: 'PUT',
        path: '/api/empresas/:id',
        descripcion: 'Actualiza una empresa (parcial).',
        params: [
          { nombre: 'id', tipo: 'number', donde: 'path', requerido: true, descripcion: 'Id de la empresa' },
          { nombre: 'nombre', tipo: 'string', donde: 'body', requerido: false, descripcion: 'Nuevo nombre' },
          { nombre: 'modalidad', tipo: 'enum', donde: 'body', requerido: false, descripcion: 'Nueva modalidad' },
        ],
        respuestas: [{ status: 200, descripcion: 'Empresa actualizada' }, { status: 404, descripcion: 'No existe' }],
      },
      {
        metodo: 'DELETE',
        path: '/api/empresas/:id',
        descripcion: 'Elimina una empresa.',
        params: [{ nombre: 'id', tipo: 'number', donde: 'path', requerido: true, descripcion: 'Id de la empresa' }],
        respuestas: [{ status: 204, descripcion: 'Eliminada' }, { status: 404, descripcion: 'No existe' }],
      },
    ],
  },
  {
    titulo: 'Contactos de RRHH',
    descripcion: 'Personas de contacto dentro de una empresa.',
    endpoints: [
      {
        metodo: 'GET',
        path: '/api/contactos-rrhh',
        descripcion: 'Lista contactos RRHH del usuario. Filtro opcional por empresa.',
        params: [{ nombre: 'empresa_id', tipo: 'number', donde: 'query', requerido: false, descripcion: 'Filtrar contactos de una empresa' }],
        respuestas: [{ status: 200, descripcion: 'Lista de contactos' }],
      },
      {
        metodo: 'POST',
        path: '/api/contactos-rrhh',
        descripcion: 'Crea un contacto RRHH (email único por empresa; duplicado → 409).',
        params: [
          { nombre: 'empresa_id', tipo: 'number', donde: 'body', requerido: true, descripcion: 'Id de la empresa' },
          { nombre: 'nombre', tipo: 'string (1-200)', donde: 'body', requerido: true, descripcion: 'Nombre del contacto' },
          { nombre: 'email', tipo: 'email', donde: 'body', requerido: true, descripcion: 'Email de contacto' },
          { nombre: 'cargo', tipo: 'string (200)', donde: 'body', requerido: false, descripcion: 'Puesto (Recruiter, etc.)' },
          { nombre: 'observaciones', tipo: 'string (2000)', donde: 'body', requerido: false, descripcion: 'Notas' },
        ],
        respuestas: [
          { status: 201, descripcion: 'Contacto creado', ejemplo: { ok: true, data: { id: 4, empresa_id: 1, nombre: 'Ana López', email: 'ana@empresa.com', cargo: 'Recruiter', observaciones: null, created_at: '2026-09-10T12:00:00Z', updated_at: '2026-09-10T12:00:00Z' } } },
          { status: 404, descripcion: 'Empresa no existe (empresa_id)' },
          { status: 409, descripcion: 'Email duplicado en la misma empresa' },
        ],
      },
      {
        metodo: 'GET',
        path: '/api/contactos-rrhh/:id',
        descripcion: 'Obtiene un contacto.',
        params: [{ nombre: 'id', tipo: 'number', donde: 'path', requerido: true, descripcion: 'Id del contacto' }],
        respuestas: [{ status: 200, descripcion: 'Contacto' }, { status: 404, descripcion: 'No existe' }],
      },
      {
        metodo: 'PUT',
        path: '/api/contactos-rrhh/:id',
        descripcion: 'Actualiza un contacto (parcial).',
        params: [
          { nombre: 'id', tipo: 'number', donde: 'path', requerido: true, descripcion: 'Id del contacto' },
          { nombre: 'email', tipo: 'email', donde: 'body', requerido: false, descripcion: 'Nuevo email' },
        ],
        respuestas: [{ status: 200, descripcion: 'Contacto actualizado' }, { status: 404, descripcion: 'No existe' }, { status: 409, descripcion: 'Email duplicado' }],
      },
      {
        metodo: 'DELETE',
        path: '/api/contactos-rrhh/:id',
        descripcion: 'Elimina un contacto.',
        params: [{ nombre: 'id', tipo: 'number', donde: 'path', requerido: true, descripcion: 'Id del contacto' }],
        respuestas: [{ status: 204, descripcion: 'Eliminado' }, { status: 404, descripcion: 'No existe' }],
      },
    ],
  },
  {
    titulo: 'Postulaciones',
    descripcion:
      'El corazón del sistema: cada postulación a una empresa. Los mails enviados y seguimientos ' +
      'actualizan automáticamente <code>cantidad_mails_enviados</code>, <code>ultimo_contacto</code> ' +
      'y <code>proxima_contacto</code> (fecha sugerida para el próximo contacto).',
    endpoints: [
      {
        metodo: 'GET',
        path: '/api/postulaciones',
        descripcion: 'Lista postulaciones con filtros opcionales.',
        params: [
          { nombre: 'estado', tipo: 'enum', donde: 'query', requerido: false, descripcion: 'pendiente | en_proceso | entrevista | oferta | aceptado | rechazado | cancelado' },
          { nombre: 'interes', tipo: 'enum', donde: 'query', requerido: false, descripcion: 'bajo | medio | alto' },
          { nombre: 'modalidad', tipo: 'enum', donde: 'query', requerido: false, descripcion: 'modalidad de la empresa' },
          { nombre: 'empresa_id', tipo: 'number', donde: 'query', requerido: false, descripcion: 'Filtrar por empresa' },
          { nombre: 'usuario_id', tipo: 'number', donde: 'query', requerido: false, descripcion: 'Filtrar por usuario' },
        ],
        respuestas: [
          {
            status: 200,
            descripcion: 'Array de postulaciones',
            ejemplo: {
              ok: true,
              data: [
                {
                  id: 5,
                  usuario_id: 3,
                  empresa_id: 1,
                  puesto: 'Backend Engineer',
                  modalidad: 'remoto',
                  respondio: 0,
                  estado: 'en_proceso',
                  interes: 'alto',
                  fuente: 'LinkedIn',
                  cantidad_mails_enviados: 2,
                  fecha_postulacion: '2026-09-10',
                  ultimo_contacto: '2026-09-10',
                  proxima_contacto: '2026-10-10',
                  observaciones: null,
                  created_at: '2026-09-10T12:00:00Z',
                  updated_at: '2026-09-10T12:00:00Z',
                },
              ],
            },
          },
        ],
      },
      {
        metodo: 'POST',
        path: '/api/postulaciones',
        descripcion: 'Crea una postulación.',
        params: [
          { nombre: 'usuario_id', tipo: 'number', donde: 'body', requerido: true, descripcion: 'Id del usuario' },
          { nombre: 'empresa_id', tipo: 'number', donde: 'body', requerido: true, descripcion: 'Id de la empresa' },
          { nombre: 'puesto', tipo: 'string (1-200)', donde: 'body', requerido: true, descripcion: 'Puesto al que postula' },
          { nombre: 'modalidad', tipo: 'enum', donde: 'body', requerido: false, descripcion: 'presencial | remoto | hibrido | no_especificado' },
          { nombre: 'respondio', tipo: '0|1', donde: 'body', requerido: false, descripcion: '¿La empresa respondió? (default 0)' },
          { nombre: 'estado', tipo: 'enum', donde: 'body', requerido: false, descripcion: 'default pendiente' },
          { nombre: 'interes', tipo: 'enum', donde: 'body', requerido: false, descripcion: 'default medio' },
          { nombre: 'fuente', tipo: 'string (100)', donde: 'body', requerido: false, descripcion: 'LinkedIn, referencia, etc.' },
          { nombre: 'cantidad_mails_enviados', tipo: 'number', donde: 'body', requerido: false, descripcion: 'default 0 (se actualiza solo con los emails)' },
          { nombre: 'fecha_postulacion', tipo: 'YYYY-MM-DD', donde: 'body', requerido: false, descripcion: 'Fecha de la postulación' },
          { nombre: 'ultimo_contacto', tipo: 'YYYY-MM-DD|null', donde: 'body', requerido: false, descripcion: 'Última fecha de contacto' },
          { nombre: 'proxima_contacto', tipo: 'YYYY-MM-DD|null', donde: 'body', requerido: false, descripcion: 'Fecha sugerida para el próximo contacto (se recalcula sola al enviar)' },
          { nombre: 'observaciones', tipo: 'string (2000)', donde: 'body', requerido: false, descripcion: 'Notas' },
        ],
        respuestas: [
          { status: 201, descripcion: 'Postulación creada', ejemplo: { ok: true, data: { id: 5, usuario_id: 3, empresa_id: 1, puesto: 'Backend Engineer', modalidad: null, respondio: 0, estado: 'pendiente', interes: 'medio', fuente: null, cantidad_mails_enviados: 0, fecha_postulacion: null, ultimo_contacto: null, proxima_contacto: null, observaciones: null, created_at: '2026-09-10T12:00:00Z', updated_at: '2026-09-10T12:00:00Z' } } },
          { status: 404, descripcion: 'usuario_id o empresa_id no existen' },
        ],
      },
      {
        metodo: 'GET',
        path: '/api/postulaciones/:id',
        descripcion: 'Obtiene una postulación.',
        params: [{ nombre: 'id', tipo: 'number', donde: 'path', requerido: true, descripcion: 'Id de la postulación' }],
        respuestas: [{ status: 200, descripcion: 'Postulación' }, { status: 404, descripcion: 'No existe' }],
      },
      {
        metodo: 'GET',
        path: '/api/postulaciones/:id/relacion',
        descripcion:
          'Línea de tiempo de la relación con la empresa: la postulación, todos sus emails ' +
          '(con tipo_seguimiento) y sus seguimientos.',
        params: [{ nombre: 'id', tipo: 'number', donde: 'path', requerido: true, descripcion: 'Id de la postulación' }],
        respuestas: [{ status: 200, descripcion: 'Historial completo' }, { status: 404, descripcion: 'No existe' }],
      },
      {
        metodo: 'PUT',
        path: '/api/postulaciones/:id',
        descripcion: 'Actualiza una postulación (parcial).',
        params: [
          { nombre: 'id', tipo: 'number', donde: 'path', requerido: true, descripcion: 'Id de la postulación' },
          { nombre: 'estado', tipo: 'enum', donde: 'body', requerido: false, descripcion: 'Nuevo estado' },
          { nombre: 'respondio', tipo: '0|1', donde: 'body', requerido: false, descripcion: '¿Respondió la empresa?' },
        ],
        respuestas: [{ status: 200, descripcion: 'Postulación actualizada' }, { status: 404, descripcion: 'No existe' }],
      },
      {
        metodo: 'DELETE',
        path: '/api/postulaciones/:id',
        descripcion: 'Elimina una postulación.',
        params: [{ nombre: 'id', tipo: 'number', donde: 'path', requerido: true, descripcion: 'Id de la postulación' }],
        respuestas: [{ status: 204, descripcion: 'Eliminada' }, { status: 404, descripcion: 'No existe' }],
      },
      {
        metodo: 'GET',
        path: '/api/postulaciones/:postulacionId/contactos',
        descripcion: 'Lista los contactos RRHH asignados a la postulación.',
        params: [{ nombre: 'postulacionId', tipo: 'number', donde: 'path', requerido: true, descripcion: 'Id de la postulación' }],
        respuestas: [{ status: 200, descripcion: 'Array de contactos RRHH' }, { status: 404, descripcion: 'Postulación no existe' }],
      },
      {
        metodo: 'POST',
        path: '/api/postulaciones/:postulacionId/contactos',
        descripcion: 'Asigna un contacto RRHH a la postulación.',
        params: [
          { nombre: 'postulacionId', tipo: 'number', donde: 'path', requerido: true, descripcion: 'Id de la postulación' },
          { nombre: 'contacto_rrhh_id', tipo: 'number', donde: 'body', requerido: true, descripcion: 'Id del contacto' },
        ],
        respuestas: [
          { status: 201, descripcion: 'Contacto asignado', ejemplo: { ok: true, data: { postulacion_id: 5, contacto_rrhh_id: 4 } } },
          { status: 404, descripcion: 'Postulación o contacto no existen' },
        ],
      },
      {
        metodo: 'DELETE',
        path: '/api/postulaciones/:postulacionId/contactos/:contactoId',
        descripcion: 'Quita un contacto de la postulación.',
        params: [
          { nombre: 'postulacionId', tipo: 'number', donde: 'path', requerido: true, descripcion: 'Id de la postulación' },
          { nombre: 'contactoId', tipo: 'number', donde: 'path', requerido: true, descripcion: 'Id del contacto' },
        ],
        respuestas: [{ status: 204, descripcion: 'Quitado' }, { status: 404, descripcion: 'No asignado' }],
      },
    ],
  },
  {
    titulo: 'Usuarios ↔ Categorías',
    descripcion: 'Relación many-to-many entre usuarios y categorías (tabla puente).',
    endpoints: [
      {
        metodo: 'GET',
        path: '/api/usuarios/:usuarioId/categorias',
        descripcion: 'Lista las categorías del usuario.',
        params: [{ nombre: 'usuarioId', tipo: 'number', donde: 'path', requerido: true, descripcion: 'Id del usuario' }],
        respuestas: [{ status: 200, descripcion: 'Array de categorías' }, { status: 404, descripcion: 'Usuario no existe' }],
      },
      {
        metodo: 'POST',
        path: '/api/usuarios/:usuarioId/categorias',
        descripcion: 'Asigna una categoría al usuario.',
        params: [
          { nombre: 'usuarioId', tipo: 'number', donde: 'path', requerido: true, descripcion: 'Id del usuario' },
          { nombre: 'categoria_id', tipo: 'number', donde: 'body', requerido: true, descripcion: 'Id de la categoría' },
        ],
        respuestas: [{ status: 201, descripcion: 'Asignada', ejemplo: { ok: true, data: { usuario_id: 3, categoria_id: 1 } } }],
      },
      {
        metodo: 'DELETE',
        path: '/api/usuarios/:usuarioId/categorias/:categoriaId',
        descripcion: 'Quita una categoría del usuario.',
        params: [
          { nombre: 'usuarioId', tipo: 'number', donde: 'path', requerido: true, descripcion: 'Id del usuario' },
          { nombre: 'categoriaId', tipo: 'number', donde: 'path', requerido: true, descripcion: 'Id de la categoría' },
        ],
        respuestas: [{ status: 204, descripcion: 'Quitada' }],
      },
    ],
  },
  {
    titulo: 'Emails',
    descripcion:
      'Historial de comunicaciones de una postulación. Al crear/borrar un email con ' +
      '<code>enviado=1</code> se actualiza <code>cantidad_mails_enviados</code>, ' +
      '<code>ultimo_contacto</code> y la <code>proxima_contacto</code> sugerida. El campo ' +
      '<code>tipo_seguimiento</code> registra el motivo estratégico del contacto.',
    endpoints: [
      {
        metodo: 'GET',
        path: '/api/emails',
        descripcion: 'Lista emails (ordenados por fecha desc).',
        params: [{ nombre: 'postulacion_id', tipo: 'number', donde: 'query', requerido: false, descripcion: 'Filtrar por postulación' }],
        respuestas: [{ status: 200, descripcion: 'Array de emails' }],
      },
      {
        metodo: 'POST',
        path: '/api/emails',
        descripcion: 'Registra un email manualmente. Si <code>enviado=1</code> incrementa el contador de la postulación.',
        params: [
          { nombre: 'postulacion_id', tipo: 'number', donde: 'body', requerido: true, descripcion: 'Postulación asociada' },
          { nombre: 'tipo', tipo: 'enum', donde: 'body', requerido: true, descripcion: 'postulacion | seguimiento | respuesta | otro' },
          { nombre: 'tipo_seguimiento', tipo: 'enum', donde: 'body', requerido: false, descripcion: 'consulta | novedad | recordatorio | nuevo_proyecto | disponibilidad' },
          { nombre: 'remitente', tipo: 'email', donde: 'body', requerido: true, descripcion: 'Quién envió' },
          { nombre: 'destinatario', tipo: 'email', donde: 'body', requerido: true, descripcion: 'Quién recibió' },
          { nombre: 'fecha', tipo: 'string (ISO)', donde: 'body', requerido: true, descripcion: 'Fecha del email (ej. 2026-09-10T10:00:00Z)' },
          { nombre: 'enviado', tipo: '0|1', donde: 'body', requerido: false, descripcion: 'default 1' },
          { nombre: 'gmail_message_id', tipo: 'string (200)', donde: 'body', requerido: false, descripcion: 'Id del mensaje en Gmail (si aplica)' },
          { nombre: 'asunto', tipo: 'string (500)', donde: 'body', requerido: false, descripcion: 'Asunto' },
          { nombre: 'contenido_resumen', tipo: 'string (4000)', donde: 'body', requerido: false, descripcion: 'Resumen del contenido' },
        ],
        respuestas: [
          {
            status: 201,
            descripcion: 'Email creado',
            ejemplo: {
              ok: true,
              data: {
                id: 12,
                postulacion_id: 5,
                gmail_message_id: '18f0a1b2c3',
                tipo: 'seguimiento',
                tipo_seguimiento: 'novedad',
                asunto: 'Actualización de mi perfil – Santiago',
                remitente: 'tu@gmail.com',
                destinatario: 'rrhh@empresa.com',
                fecha: '2026-09-10T10:00:00Z',
                enviado: 1,
                contenido_resumen: 'Quería continuar con el proceso',
                created_at: '2026-09-10T10:00:05Z',
              },
            },
          },
          { status: 404, descripcion: 'Postulación no existe' },
        ],
      },
      {
        metodo: 'GET',
        path: '/api/emails/:id',
        descripcion: 'Obtiene un email.',
        params: [{ nombre: 'id', tipo: 'number', donde: 'path', requerido: true, descripcion: 'Id del email' }],
        respuestas: [{ status: 200, descripcion: 'Email' }, { status: 404, descripcion: 'No existe' }],
      },
      {
        metodo: 'PUT',
        path: '/api/emails/:id',
        descripcion: 'Actualiza un email (parcial). Al cambiar <code>enviado</code> 0↔1 ajusta el contador.',
        params: [
          { nombre: 'id', tipo: 'number', donde: 'path', requerido: true, descripcion: 'Id del email' },
          { nombre: 'enviado', tipo: '0|1', donde: 'body', requerido: false, descripcion: 'Cambia el estado enviado/no enviado' },
        ],
        respuestas: [{ status: 200, descripcion: 'Email actualizado' }, { status: 404, descripcion: 'No existe' }],
      },
      {
        metodo: 'DELETE',
        path: '/api/emails/:id',
        descripcion: 'Elimina un email (si era <code>enviado=1</code> decrementa el contador).',
        params: [{ nombre: 'id', tipo: 'number', donde: 'path', requerido: true, descripcion: 'Id del email' }],
        respuestas: [{ status: 204, descripcion: 'Eliminado' }, { status: 404, descripcion: 'No existe' }],
      },
    ],
  },
  {
    titulo: 'Seguimientos',
    descripcion:
      'Plan de contacto estratégico por postulación. <code>tipo_seguimiento</code> indica el motivo ' +
      'del contacto (consulta | novedad | recordatorio | nuevo_proyecto | disponibilidad). ' +
      'Al marcar <code>enviado=1</code> se asigna <code>fecha_envio</code>.',
    endpoints: [
      {
        metodo: 'GET',
        path: '/api/seguimientos',
        descripcion: 'Lista seguimientos (ordenados por fecha_programada asc).',
        params: [
          { nombre: 'postulacion_id', tipo: 'number', donde: 'query', requerido: false, descripcion: 'Filtrar por postulación' },
          { nombre: 'enviado', tipo: '0|1', donde: 'query', requerido: false, descripcion: 'Filtrar por estado' },
        ],
        respuestas: [{ status: 200, descripcion: 'Array de seguimientos' }],
      },
      {
        metodo: 'GET',
        path: '/api/seguimientos/pendientes',
        descripcion: 'Lista solo seguimientos pendientes (<code>enviado=0</code>).',
        params: [{ nombre: 'postulacion_id', tipo: 'number', donde: 'query', requerido: false, descripcion: 'Filtrar por postulación' }],
        respuestas: [{ status: 200, descripcion: 'Array de seguimientos pendientes' }],
      },
      {
        metodo: 'POST',
        path: '/api/seguimientos',
        descripcion: 'Crea un seguimiento.',
        params: [
          { nombre: 'postulacion_id', tipo: 'number', donde: 'body', requerido: true, descripcion: 'Postulación asociada' },
          { nombre: 'fecha_programada', tipo: 'YYYY-MM-DD', donde: 'body', requerido: true, descripcion: 'Cuándo hacer el seguimiento' },
          { nombre: 'tipo_seguimiento', tipo: 'enum', donde: 'body', requerido: false, descripcion: 'Motivo del contacto (default consulta)' },
          { nombre: 'enviado', tipo: '0|1', donde: 'body', requerido: false, descripcion: 'default 0' },
          { nombre: 'requiere_aprobacion', tipo: '0|1', donde: 'body', requerido: false, descripcion: 'default 1' },
          { nombre: 'fecha_envio', tipo: 'YYYY-MM-DD|null', donde: 'body', requerido: false, descripcion: 'Cuándo se envió' },
          { nombre: 'observaciones', tipo: 'string (2000)', donde: 'body', requerido: false, descripcion: 'Notas' },
        ],
        respuestas: [
          {
            status: 201,
            descripcion: 'Seguimiento creado',
            ejemplo: { ok: true, data: { id: 8, postulacion_id: 5, fecha_programada: '2026-09-20', tipo_seguimiento: 'consulta', enviado: 0, requiere_aprobacion: 1, fecha_envio: null, observaciones: null, created_at: '2026-09-10T10:00:00Z' } },
          },
          { status: 404, descripcion: 'Postulación no existe' },
        ],
      },
      {
        metodo: 'GET',
        path: '/api/seguimientos/:id',
        descripcion: 'Obtiene un seguimiento.',
        params: [{ nombre: 'id', tipo: 'number', donde: 'path', requerido: true, descripcion: 'Id del seguimiento' }],
        respuestas: [{ status: 200, descripcion: 'Seguimiento' }, { status: 404, descripcion: 'No existe' }],
      },
      {
        metodo: 'PUT',
        path: '/api/seguimientos/:id',
        descripcion: 'Actualiza un seguimiento (parcial).',
        params: [
          { nombre: 'id', tipo: 'number', donde: 'path', requerido: true, descripcion: 'Id del seguimiento' },
          { nombre: 'enviado', tipo: '0|1', donde: 'body', requerido: false, descripcion: 'Al marcar 1 se autofirma fecha_envio si no viene' },
        ],
        respuestas: [{ status: 200, descripcion: 'Seguimiento actualizado' }, { status: 404, descripcion: 'No existe' }],
      },
      {
        metodo: 'DELETE',
        path: '/api/seguimientos/:id',
        descripcion: 'Elimina un seguimiento.',
        params: [{ nombre: 'id', tipo: 'number', donde: 'path', requerido: true, descripcion: 'Id del seguimiento' }],
        respuestas: [{ status: 204, descripcion: 'Eliminado' }, { status: 404, descripcion: 'No existe' }],
      },
    ],
  },
  {
    titulo: 'Estrategia de contacto',
    descripcion:
      'A quién conviene contactar ahora. Cada envío registra <code>ultimo_contacto</code> y ' +
      'calcula <code>proxima_contacto = hoy + cadencia</code> (días de la empresa u ' +
      '<code>CADENCIA_CONTACTO_DIAS</code> global). Los borradores de novedades se generan ' +
      'automáticamente con datos reales (proyectos, experiencias, perfil).',
    endpoints: [
      {
        metodo: 'GET',
        path: '/api/estrategia/debidas',
        descripcion:
          'Lista las postulaciones activas que conviene contactar: con <code>proxima_contacto</code> ' +
          'vencida o sin contacto y con más de una cadencia sin novedades. Sugiere el tipo de ' +
          'mensaje a enviar.',
        params: [],
        respuestas: [
          {
            status: 200,
            descripcion: 'Array de contactos debidos, ordenados por urgencia',
            ejemplo: {
              ok: true,
              data: [
                {
                  postulacion_id: 5,
                  empresa: 'Globant',
                  puesto: 'Backend Engineer',
                  estado: 'en_proceso',
                  ultimo_contacto: '2026-08-15',
                  proxima_contacto: '2026-09-14',
                  dias_desde_ultimo_contacto: 26,
                  dias_para_proximo_contacto: -4,
                  tipo_sugerido: 'novedad',
                },
              ],
            },
          },
        ],
      },
    ],
  },
  {
    titulo: 'Gmail (enviar y leer correos reales)',
    descripcion:
      'Usan la cuenta de Google vinculada del usuario (tabla <code>cuentas_google</code>). ' +
      'Requisito: haberse autenticado una vez con consent que incluya ' +
      '<code>gmail.readonly</code> y <code>gmail.send</code>. Todos requieren sesión y ' +
      'renuevan el access token automáticamente si vence.',
    endpoints: [
      {
        metodo: 'POST',
        path: '/api/gmail/enviar',
        descripcion:
          'Envía un email real desde la cuenta Gmail del usuario y lo registra en ' +
          '<code>emails</code> con su <code>gmail_message_id</code>, incrementando el contador de la ' +
          'postulación y recalculando <code>proxima_contacto</code>. Si no se envían ' +
          '<code>asunto</code> y/o <code>cuerpo</code>, el backend genera el borrador con la ' +
          'plantilla de novedades (según <code>tipo_seguimiento</code>). Opcionalmente crea el ' +
          'seguimiento como enviado.',
        auth: true,
        params: [
          { nombre: 'postulacion_id', tipo: 'number', donde: 'body', requerido: true, descripcion: 'Postulación asociada' },
          { nombre: 'destinatario', tipo: 'email', donde: 'body', requerido: true, descripcion: 'A quién enviar' },
          { nombre: 'asunto', tipo: 'string (1-500)', donde: 'body', requerido: false, descripcion: 'Asunto. Si falta, se genera por plantilla' },
          { nombre: 'cuerpo', tipo: 'string (1-50000)', donde: 'body', requerido: false, descripcion: 'Contenido en texto plano. Si falta, se genera por plantilla' },
          { nombre: 'tipo', tipo: 'enum', donde: 'body', requerido: false, descripcion: 'default seguimiento' },
          { nombre: 'tipo_seguimiento', tipo: 'enum', donde: 'body', requerido: false, descripcion: 'Motivo del contacto (consulta | novedad | recordatorio | nuevo_proyecto | disponibilidad). Default novedad al generar borrador' },
          { nombre: 'crear_seguimiento', tipo: 'boolean', donde: 'body', requerido: false, descripcion: 'Crear seguimiento como enviado' },
          { nombre: 'fecha_programada', tipo: 'YYYY-MM-DD', donde: 'body', requerido: false, descripcion: 'Para el seguimiento (default hoy)' },
        ],
        respuestas: [
          {
            status: 201,
            descripcion: 'Email enviado y registrado',
            ejemplo: { ok: true, data: { id: 12, postulacion_id: 5, gmail_message_id: 'ABCDEF123', tipo: 'seguimiento', tipo_seguimiento: 'novedad', asunto: 'Actualización de mi perfil – Santiago', remitente: 'tu@gmail.com', destinatario: 'rrhh@empresa.com', fecha: '2026-09-10T10:00:00Z', enviado: 1, contenido_resumen: 'Quería compartirles algunas novedades...', created_at: '2026-09-10T10:00:05Z' } },
          },
          { status: 401, descripcion: 'Sin sesión o sin cuenta de Google vinculada' },
          { status: 404, descripcion: 'Postulación no existe' },
          { status: 502, descripcion: 'Error de la Gmail API' },
        ],
      },
      {
        metodo: 'GET',
        path: '/api/gmail/mensajes',
        descripcion: 'Lista mensajes de la bandeja de entrada del usuario.',
        auth: true,
        params: [
          { nombre: 'max_results', tipo: 'number (1-50)', donde: 'query', requerido: false, descripcion: 'Cantidad máxima (default 10)' },
          { nombre: 'q', tipo: 'string', donde: 'query', requerido: false, descripcion: 'Búsqueda estilo Gmail (ej. from:empresa.com)' },
        ],
        respuestas: [
          { status: 200, descripcion: 'Array de mensajes (resumen)', ejemplo: { ok: true, data: [{ id: '18f0ab', threadId: '18f0a1', snippet: 'Hola...' }] } },
        ],
      },
      {
        metodo: 'GET',
        path: '/api/gmail/mensajes/:id',
        descripcion: 'Obtiene el detalle de un mensaje: cabeceras y cuerpo decodificado.',
        auth: true,
        params: [{ nombre: 'id', tipo: 'string', donde: 'path', requerido: true, descripcion: 'Id del mensaje en Gmail' }],
        respuestas: [
          {
            status: 200,
            descripcion: 'Detalle del mensaje',
            ejemplo: {
              ok: true,
              data: {
                id: '18f0ab',
                threadId: '18f0a1',
                snippet: 'Respuesta de RRHH',
                fecha: '2026-09-10T12:00:00Z',
                cabeceras: { de: 'rrhh@empresa.com', para: 'tu@gmail.com', asunto: 'Tu postulación', fecha: 'Wed, 10 Sep 2026 09:00:00 -0300' },
                cuerpo: 'Te invitamos a una entrevista...',
              },
            },
          },
        ],
      },
    ],
  },
];

function escapeHtml(valor: string): string {
  return valor
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function jsonEjemplo(valor: unknown): string {
  return JSON.stringify(valor, null, 2);
}

const ESTILOS = `
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: #0f172a;
    color: #e2e8f0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    line-height: 1.6;
  }
  header.principal {
    background: #1e293b;
    border-bottom: 1px solid #334155;
    padding: 16px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    position: sticky;
    top: 0;
    z-index: 10;
  }
  header.principal .logo { font-weight: 800; font-size: 18px; color: #fff; }
  header.principal .logo span { color: #22c55e; }
  header.principal nav a {
    color: #94a3b8;
    text-decoration: none;
    margin-left: 18px;
    font-size: 14px;
  }
  header.principal nav a:hover { color: #fff; }
  .contenedor { max-width: 1100px; margin: 0 auto; padding: 32px 24px 64px; }
  h1 { font-size: 28px; margin: 0 0 8px; }
  .subtitulo { color: #94a3b8; margin: 0 0 24px; }
  .tarjeta { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 24px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; }
  .grid a.tarjeta {
    text-decoration: none; color: inherit; display: block;
    transition: border-color .15s ease, transform .15s ease;
  }
  .grid a.tarjeta:hover { border-color: #22c55e; transform: translateY(-2px); }
  .grid .titulo-card { font-weight: 700; color: #fff; margin-bottom: 6px; }
  .grid .texto-card { font-size: 14px; color: #94a3b8; }
  .badge {
    display: inline-block; background: #334155; color: #e2e8f0;
    border-radius: 999px; font-size: 12px; font-weight: 600;
    padding: 4px 10px; margin: 0 4px 4px 0;
  }
  .badge.beta { background: #f59e0b; color: #1c1917; }
  .badge.auth { background: #3b82f6; color: #fff; }
  .code { background: #0b1220; border: 1px solid #1e293b; border-radius: 8px; padding: 14px 16px; overflow-x: auto; font-size: 13px; }
  pre { margin: 0; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
  code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; background: #0b1220; padding: 2px 5px; border-radius: 4px; font-size: .92em; }
  .layout-docs { display: grid; grid-template-columns: 240px 1fr; gap: 32px; align-items: start; }
  nav.indice { position: sticky; top: 84px; }
  nav.indice a { display: block; color: #94a3b8; text-decoration: none; font-size: 14px; padding: 6px 0; }
  nav.indice a:hover { color: #22c55e; }
  h2 { font-size: 22px; border-bottom: 1px solid #334155; padding-bottom: 8px; margin: 40px 0 8px; }
  .grupo-desc { color: #94a3b8; font-size: 14px; margin: 0 0 20px; }
  article.endpoint { border: 1px solid #334155; border-radius: 12px; background: #1e293b; margin-bottom: 16px; overflow: hidden; }
  .cabecera-ep { display: flex; align-items: center; gap: 10px; padding: 14px 18px; flex-wrap: wrap; }
  .metodo { border-radius: 6px; color: #fff; font-weight: 800; font-size: 12px; padding: 4px 10px; letter-spacing: .04em; }
  .ruta { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-weight: 600; color: #fff; }
  .margen-izq { margin-left: auto; }
  .cuerpo-ep { padding: 0 18px 18px; }
  .cuerpo-ep > p { margin: 0 0 16px; color: #cbd5e1; font-size: 14px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; margin: 12px 0; }
  th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #334155; vertical-align: top; }
  th { color: #94a3b8; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: .04em; }
  .req { color: #f59e0b; font-weight: 700; }
  .opc { color: #94a3b8; }
  .resumen-resp { margin-top: 14px; font-size: 14px; color: #94a3b8; }
  .resumen-resp strong { color: #e2e8f0; }
  .error-format { margin-top: 12px; }
  .footer { color: #64748b; font-size: 13px; border-top: 1px solid #1e293b; padding: 20px 0; margin-top: 40px; }
  @media (max-width: 820px) { .layout-docs { grid-template-columns: 1fr; } nav.indice { position: static; } }
`;

function layout(contenido: string, titulo: string): string {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(titulo)} · CVisto API</title>
<style>${ESTILOS}</style>
</head>
<body>
<header class="principal">
  <div class="logo">CVisto<span>·api</span></div>
  <nav>
    <a href="/">Home</a>
    <a href="/docs">Documentación</a>
    <a href="/health">Health</a>
  </nav>
</header>
<div class="contenedor">${contenido}</div>
</body>
</html>`;
}

function botonMetodo(metodo: MetodoRuta): string {
  return `<span class="metodo" style="background:${COLOR_METODO[metodo]}">${metodo}</span>`;
}

function tablaParametros(params: Parametro[]): string {
  if (params.length === 0) return '';
  const filas = params
    .map(
      (p) => `
        <tr>
          <td><code>${escapeHtml(p.nombre)}</code></td>
          <td>${escapeHtml(p.tipo)}</td>
          <td>${escapeHtml(p.donde)}</td>
          <td>${p.requerido ? '<span class="req">requerido</span>' : '<span class="opc">opcional</span>'}</td>
          <td>${escapeHtml(p.descripcion)}</td>
        </tr>`,
    )
    .join('');
  return `
    <table>
      <thead><tr><th>Nombre</th><th>Tipo</th><th>Ubicación</th><th>Requerido</th><th>Descripción</th></tr></thead>
      <tbody>${filas}</tbody>
    </table>`;
}

function bloquesRespuesta(respuestas: Respuesta[]): string {
  return respuestas
    .map((r) => {
      const ejemplo =
        r.ejemplo === undefined
          ? ''
          : `<div class="code"><pre>${escapeHtml(jsonEjemplo(r.ejemplo))}</pre></div>`;
      return `
        <div class="resumen-resp">
          <strong>${r.status}</strong> — ${escapeHtml(r.descripcion)}
        </div>
        ${ejemplo}`;
    })
    .join('');
}

function renderEndpoint(ep: Endpoint): string {
  const badgeAuth = ep.auth
    ? '<span class="badge auth">requiere sesión</span>'
    : '';
  return `
  <article class="endpoint">
    <div class="cabecera-ep">
      ${botonMetodo(ep.metodo)}
      <span class="ruta">${escapeHtml(ep.path)}</span>
      <span class="margen-izq">${badgeAuth}</span>
    </div>
    <div class="cuerpo-ep">
      <p>${ep.descripcion}</p>
      ${tablaParametros(ep.params)}
      <div class="resumen"><h4 style="margin:16px 0 4px;color:#94a3b8;font-size:13px;text-transform:uppercase;letter-spacing:.04em;">Respuestas</h4>${bloquesRespuesta(ep.respuestas)}</div>
    </div>
  </article>`;
}

function seccionesDocs(grupos: Grupo[]): string {
  return grupos
    .map(
      (g) => `
    <h2 id="${escapeHtml(g.titulo.toLowerCase().replace(/\W+/g, '-'))}">${escapeHtml(g.titulo)}</h2>
    <p class="grupo-desc">${g.descripcion}</p>
    ${g.endpoints.map(renderEndpoint).join('')}`,
    )
    .join('');
}

function indiceDocs(grupos: Grupo[]): string {
  const enlaces = grupos
    .map(
      (g) =>
        `<a href="#${escapeHtml(g.titulo.toLowerCase().replace(/\W+/g, '-'))}">${escapeHtml(g.titulo)}</a>`,
    )
    .join('');
  return `<nav class="indice">${enlaces}</nav>`;
}

export function renderHomePage(): string {
  const total = GRUPOS.reduce((n, g) => n + g.endpoints.length, 0);
  const badgeBeta = env.PANTALLA_BETA === 'true'
    ? '<span class="badge beta">fase de prueba</span>'
    : '';
  const contenido = `
    <h1>Backend de CVisto</h1>
    <p class="subtitulo">
      API REST para gestionar postulaciones laborales: empresas, contactos, emails,
      seguimientos e integración con Gmail. ${badgeBeta}
    </p>
    <div class="grid">
      <a class="tarjeta" href="/docs">
        <div class="titulo-card">Documentación</div>
        <div class="texto-card">Todos los endpoints, los datos que reciben y las respuestas con ejemplos (${total} rutas).</div>
      </a>
      <a class="tarjeta" href="/health">
        <div class="titulo-card">Estado (health)</div>
        <div class="texto-card">Verificá en vivo que el servidor y la base de datos funcionen.</div>
      </a>
      <a class="tarjeta" href="/auth/google/login">
        <div class="titulo-card">Iniciar sesión con Google</div>
        <div class="texto-card">Flujo OAuth para autenticarte y vincular tu cuenta Gmail.</div>
      </a>
      <a class="tarjeta" href="https://github.com" target="_blank" rel="noopener">
        <div class="titulo-card">Repositorio</div>
        <div class="texto-card">Código fuente y licencia del proyecto.</div>
      </a>
    </div>
    <h2>Probar la API</h2>
    <p>La base URL es <code>${escapeHtml(`http://localhost:${env.PORT}`)}</code>. Los endpoints JSON devuelven un sobre <code>{ ok, data }</code> (o <code>{ ok:false, error }</code> en errores).</p>
    <div class="code"><pre>curl http://localhost:${env.PORT}/api/empresas</pre></div>
    <div class="footer">Stack: Bun · Express · TypeScript · Turso · Zod · Vitest</div>
  `;
  return layout(contenido, 'Home');
}

export function renderDocsPage(): string {
  const contenido = `
    <h1>Documentación de la API</h1>
    <p class="subtitulo">Base URL: <code>${escapeHtml(`http://localhost:${env.PORT}`)}</code>. Todas las rutas prefijadas con <code>/api</code> (salvo auth y health).</p>

    <div class="tarjeta">
      <h3 style="margin-top:0">Formato de respuesta</h3>
      <div class="code"><pre>${escapeHtml('{ "ok": true, "data": ... }')}</pre></div>
      <div class="code" style="margin-top:10px"><pre>${escapeHtml('{ "ok": false, "error": { "message": "Datos inválidos", "details": [ { "campo": "nombre", "mensaje": "nombre es obligatorio" } ] } }')}</pre></div>
      <p style="margin-top:12px">Códigos: <strong>400</strong> datos inválidos · <strong>401</strong> sin sesión/account · <strong>404</strong> no encontrado · <strong>409</strong> conflicto (duplicado) · <strong>500</strong> interno · <strong>502</strong> error Gmail.</p>
      <h3 style="margin-top:16px">Autenticación</h3>
      <p>Las rutas marcadas <span class="badge auth">requiere sesión</span> aceptan la cookie <code>cvisto_token</code> o el header <code>Authorization: Bearer &lt;jwt&gt;</code>.</p>
      <h3 style="margin-top:16px">Enums usados</h3>
      <div class="code"><pre>${ENUMS.map(([nombre, valores]) => `${nombre}: ${escapeHtml(valores)}`).join('\n')}</pre></div>
      <p style="margin-top:12px">Las fechas se envían como <code>YYYY-MM-DD</code> (<code>emails.fecha</code> acepta datetime ISO completo).</p>
    </div>

    <div class="layout-docs" style="margin-top:32px">
      ${indiceDocs(GRUPOS)}
      <div>${seccionesDocs(GRUPOS)}</div>
    </div>
  `;
  return layout(contenido, 'Documentación');
}