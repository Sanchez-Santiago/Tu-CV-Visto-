import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type {
  ClasificacionIA,
  DeteccionPostulacionIA,
} from '../src/services/ia.service';
import { app } from '../src/app';
import { db } from '../src/config/database';
import { UsuarioModel } from '../src/models/usuario.model';
import { firmarToken } from '../src/utils/jwt';
import { resetTestDb } from './helpers/test-db';

const { clasificarLoteMock, detectarPostulacionesLoteMock } = vi.hoisted(
  () => ({
    clasificarLoteMock: vi.fn(),
    detectarPostulacionesLoteMock: vi.fn(),
  }),
);

vi.mock('../src/services/ia.service', async (importOriginal) => {
  const actual = await importOriginal<
    typeof import('../src/services/ia.service')
  >();
  return {
    ...actual,
    iaEstaConfigurada: () => true,
    clasificarLote: clasificarLoteMock,
    detectarPostulacionesLote: detectarPostulacionesLoteMock,
  };
});

let usuarioId = 0;
let token = '';
let postulacionIARechazo = 0;
let postulacionIAEntrevista = 0;
let postulacionCerrada = 0;
let postulacionFallback = 0;
let postulacionIdempotente = 0;

classificarIA('rechazo');

async function crearPostulacion(estado: string): Promise<number> {
  const res = await request(app).post('/api/postulaciones').send({
    usuario_id: usuarioId,
    empresa_id: empresaId,
    puesto: 'Senior Engineer',
  });
  const id = res.body.data.id as number;
  if (estado !== 'pendiente') {
    await db.execute({
      sql: 'UPDATE postulaciones SET estado = ? WHERE id = ?',
      args: [estado, id],
    });
  }
  return id;
}

function detectarPostulacionIA(
  esPostulacion: boolean,
  puesto: string | null = null,
): void {
  detectarPostulacionesLoteMock.mockImplementation(
    async (emails: { id: string }[]): Promise<(DeteccionPostulacionIA | null)[]> =>
      emails.map((_) => ({
        es_postulacion: esPostulacion,
        puesto,
        confianza: 97,
        motivo: 'prueba',
      })),
  );
}

function classificarIA(tipo: string): void {
  clasificarLoteMock.mockImplementation(
    async (emails: { id: string }[]): Promise<(ClasificacionIA | null)[]> =>
      emails.map((_) => ({
        tipo: tipo as ClasificacionIA['tipo'],
        confianza: 98,
        motivo: 'prueba',
      })),
  );
}

async function insertarEmail(opts: {
  postulacionId: number;
  contenido: string;
  asunto?: string;
  gmailMessageId?: string;
}): Promise<number> {
  const res = await db.execute({
    sql: `
      INSERT INTO emails
        (postulacion_id, gmail_message_id, tipo, asunto, remitente, destinatario,
         fecha, enviado, contenido_resumen, tipo_respuesta, tipo_respuesta_fuente)
      VALUES (?, ?, 'respuesta', ?, 'rrhh@empresa.com', 'candidato@test.com',
              ?, 0, ?, NULL, NULL)
      RETURNING id
    `,
    args: [
      opts.postulacionId,
      opts.gmailMessageId ?? `ia-${Date.now()}-${Math.random()}`,
      opts.asunto ?? 'Respuesta',
      new Date().toISOString(),
      opts.contenido,
    ],
  });
  return Number(res.rows[0]!.id);
}

async function insertarEmailSinPostulacion(opts: {
  contenido: string;
  asunto?: string;
  remitente?: string;
  enviado?: number;
  gmailMessageId?: string;
}): Promise<number> {
  const res = await db.execute({
    sql: `
      INSERT INTO emails
        (postulacion_id, gmail_message_id, tipo, asunto, remitente, destinatario,
         fecha, enviado, contenido_resumen, tipo_respuesta, tipo_respuesta_fuente)
      VALUES (NULL, ?, 'respuesta', ?, ?, 'candidato-ia@test.com',
              ?, ?, ?, NULL, NULL)
      RETURNING id
    `,
    args: [
      opts.gmailMessageId ?? `sin-${Date.now()}-${Math.random()}`,
      opts.asunto ?? 'Respuesta',
      opts.remitente ?? 'rrhh@empresax.com',
      new Date().toISOString(),
      opts.enviado ?? 0,
      opts.contenido,
    ],
  });
  return Number(res.rows[0]!.id);
}

async function analizar() {
  return request(app)
    .post('/api/gmail/analizar')
    .set('Authorization', `Bearer ${token}`);
}

let empresaId = 0;

beforeAll(async () => {
  vi.stubGlobal('fetch', vi.fn());
  await resetTestDb(db);

  const usuario = await UsuarioModel.crear({
    nombre: 'Candidato IA',
    email: 'candidato-ia@test.com',
  });
  usuarioId = usuario.id;

  const empresa = await db.execute({
    sql: "INSERT INTO empresas (nombre) VALUES (?) RETURNING id",
    args: ['Empresa IA'],
  });
  empresaId = Number(empresa.rows[0]!.id);

  postulacionIARechazo = await crearPostulacion('pendiente');
  postulacionIAEntrevista = await crearPostulacion('pendiente');
  postulacionCerrada = await crearPostulacion('aceptado');
  postulacionFallback = await crearPostulacion('pendiente');
  postulacionIdempotente = await crearPostulacion('pendiente');

  token = await firmarToken({
    usuario_id: usuarioId,
    email: usuario.email,
    nombre: usuario.nombre,
  });
});

afterAll(async () => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  await db.close();
});

describe('POST /api/gmail/analizar', () => {
  it('responde 401 sin autenticación', async () => {
    const res = await request(app).post('/api/gmail/analizar');
    expect(res.status).toBe(401);
  });

  it('clasifica con IA un rechazo y cierra la postulación', async () => {
    classificarIA('rechazo');
    const emailId = await insertarEmail({
      postulacionId: postulacionIARechazo,
      contenido:
        'Estimado candidato, le agradecemos su interés; lamentablemente no avanzamos. Saludos.',
      gmailMessageId: 'ia-rechazo-1',
    });

    const res = await analizar();
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    const detalle = res.body.data.detalle.find(
      (d: { email_id: number }) => d.email_id === emailId,
    );
    expect(detalle).toBeDefined();
    expect(detalle.tipo_respuesta).toBe('rechazo');
    expect(detalle.estado_anterior).toBe('pendiente');
    expect(detalle.estado_nuevo).toBe('rechazado');
    expect(detalle.fuente).toBe('ia');

    const postulacion = await request(app).get(
      `/api/postulaciones/${postulacionIARechazo}`,
    );
    expect(postulacion.body.data.estado).toBe('rechazado');

    const emails = await request(app).get(
      `/api/emails?postulacion_id=${postulacionIARechazo}`,
    );
    const guardado = emails.body.data.find(
      (e: { id: number }) => e.id === emailId,
    );
    expect(guardado.tipo_respuesta).toBe('rechazo');
    expect(guardado.tipo_respuesta_fuente).toBe('ia');
  });

  it('detecta con IA una entrevista que las keywords no detectarían', async () => {
    classificarIA('entrevista');
    const emailId = await insertarEmail({
      postulacionId: postulacionIAEntrevista,
      contenido:
        'Nos encantaría tener una charla virtual con vos la semana próxima. ¿Qué horario te queda?',
      gmailMessageId: 'ia-entrevista-1',
    });

    const res = await analizar();
    const detalle = res.body.data.detalle.find(
      (d: { email_id: number }) => d.email_id === emailId,
    );
    expect(detalle).toBeDefined();
    expect(detalle.tipo_respuesta).toBe('entrevista');
    expect(detalle.estado_nuevo).toBe('entrevista');

    const postulacion = await request(app).get(
      `/api/postulaciones/${postulacionIAEntrevista}`,
    );
    expect(postulacion.body.data.estado).toBe('entrevista');
  });

  it('no sobrescribe estados cerrados (aceptado) aunque la IA detecte rechazo', async () => {
    classificarIA('rechazo');
    const emailId = await insertarEmail({
      postulacionId: postulacionCerrada,
      contenido:
        'Gracias por participar, pero no seguimos con tu perfil en esta oportunidad.',
      gmailMessageId: 'ia-cerrada-1',
    });

    const res = await analizar();
    const detalle = res.body.data.detalle.find(
      (d: { email_id: number }) => d.email_id === emailId,
    );
    expect(detalle).toBeDefined();
    expect(detalle.tipo_respuesta).toBe('rechazo');
    expect(detalle.estado_anterior).toBe('aceptado');
    expect(detalle.estado_nuevo).toBeNull();

    const postulacion = await request(app).get(
      `/api/postulaciones/${postulacionCerrada}`,
    );
    expect(postulacion.body.data.estado).toBe('aceptado');
  });

  it('cae a keywords cuando la IA no clasifica (respuesta null)', async () => {
    clasificarLoteMock.mockImplementation(
      async (emails: { id: string }[]): Promise<(ClasificacionIA | null)[]> =>
        emails.map(() => null),
    );
    const emailId = await insertarEmail({
      postulacionId: postulacionFallback,
      contenido:
        'Gracias por tu interés. No preseleccionado en esta instancia.',
      gmailMessageId: 'ia-fallback-1',
    });

    const res = await analizar();
    const detalle = res.body.data.detalle.find(
      (d: { email_id: number }) => d.email_id === emailId,
    );
    expect(detalle).toBeDefined();
    expect(detalle.tipo_respuesta).toBe('rechazo');
    expect(detalle.fuente).toBe('keywords');
    expect(detalle.estado_nuevo).toBe('rechazado');
  });

  it('no procesa dos veces el mismo email (idempotencia)', async () => {
    classificarIA('rechazo');
    const emailId = await insertarEmail({
      postulacionId: postulacionIdempotente,
      contenido:
        'Lamentamos informarte que no continuamos con tu candidatura.',
      gmailMessageId: 'ia-idempotente-1',
    });

    const primera = await analizar();
    const idEnPrimera = primera.body.data.detalle.some(
      (d: { email_id: number }) => d.email_id === emailId,
    );
    expect(idEnPrimera).toBe(true);

    const segunda = await analizar();
    const idEnSegunda = segunda.body.data.detalle.some(
      (d: { email_id: number }) => d.email_id === emailId,
    );
    expect(idEnSegunda).toBe(false);
    expect(segunda.body.data.estados_actualizados).toBe(0);
  });

  it('crea una postulación cuando la IA detecta una postulación en un email sin asociar', async () => {
    detectarPostulacionIA(true, 'Backend Developer');
    const emailId = await insertarEmailSinPostulacion({
      contenido:
        'Nos gustaría invitarte a una entrevista técnica la próxima semana. Saludos, RRHH.',
      asunto: 'Entrevista Backend Developer',
      gmailMessageId: 'sin-ia-crea-1',
    });

    const res = await analizar();
    expect(res.status).toBe(200);
    expect(res.body.data.postulaciones_creadas).toBe(1);

    const detalle = res.body.data.detalle.find(
      (d: { email_id: number }) => d.email_id === emailId,
    );
    expect(detalle).toBeDefined();
    expect(detalle.postulacion_creada).toBe(true);
    expect(detalle.empresa).toBe('empresax');
    expect(detalle.puesto).toBe('Backend Developer');
    expect(detalle.estado_nuevo).toBe('entrevista');

    const buscado = await request(app).get(
      `/api/postulaciones?usuario_id=${usuarioId}`,
    );
    const creada = buscado.body.data.find(
      (p: { puesto: string }) =>
        p.empresa_id !== empresaId && p.puesto === 'Backend Developer',
    );
    expect(creada).toBeDefined();
    expect(creada.estado).toBe('entrevista');
    expect(creada.cantidad_mails_enviados).toBe(0);
    expect(creada.fuente).toBe('Email');

    const emailRow = await db.execute({
      sql: 'SELECT postulacion_id, tipo_respuesta FROM emails WHERE id = ?',
      args: [emailId],
    });
    expect(emailRow.rows[0].postulacion_id).toBe(creada.id);
    expect(emailRow.rows[0].tipo_respuesta).toBe('entrevista');

    const segunda = await analizar();
    expect(segunda.body.data.postulaciones_creadas).toBe(0);
    expect(segunda.body.data.postulaciones_vinculadas).toBe(0);
  });

  it('no crea postulación cuando la IA descarta un email sin asociar', async () => {
    detectarPostulacionIA(false);
    const emailId = await insertarEmailSinPostulacion({
      contenido: 'Tu factura mensual está disponible. Gracias por tu compra.',
      asunto: 'Factura',
      gmailMessageId: 'sin-ia-no-1',
    });

    const res = await analizar();
    expect(res.body.data.postulaciones_creadas).toBe(0);

    const emailRow = await db.execute({
      sql: 'SELECT tipo_respuesta FROM emails WHERE id = ?',
      args: [emailId],
    });
    expect(emailRow.rows[0].tipo_respuesta).toBe('otro');

    const segunda = await analizar();
    expect(segunda.body.data.postulaciones_creadas).toBe(0);
    expect(
      segunda.body.data.detalle.some(
        (d: { email_id: number }) => d.email_id === emailId,
      ),
    ).toBe(false);
  });

  it('vincula a una postulación existente en vez de duplicarla', async () => {
    const empresaY = await db.execute({
      sql: "INSERT INTO empresas (nombre) VALUES ('empresay') RETURNING id",
      args: [],
    });
    const empresaYId = Number(empresaY.rows[0]!.id);
    const resCrear = await request(app).post('/api/postulaciones').send({
      usuario_id: usuarioId,
      empresa_id: empresaYId,
      puesto: 'Marketing Lead',
    });
    const postulacionYId = resCrear.body.data.id as number;

    detectarPostulacionIA(true, 'Marketing Lead');
    const emailId = await insertarEmailSinPostulacion({
      contenido:
        'Queremos avanzar con vos en la vacante de Marketing Lead. Saludos.',
      asunto: 'Marketing Lead',
      remitente: 'rrhh@empresay.com',
      gmailMessageId: 'sin-ia-vincula-1',
    });

    const res = await analizar();
    expect(res.body.data.postulaciones_creadas).toBe(0);
    expect(res.body.data.postulaciones_vinculadas).toBe(1);

    const emailRow = await db.execute({
      sql: 'SELECT postulacion_id FROM emails WHERE id = ?',
      args: [emailId],
    });
    expect(emailRow.rows[0].postulacion_id).toBe(postulacionYId);

    const lista = await request(app).get('/api/postulaciones');
    const ids: number[] = lista.body.data.map((p: { id: number }) => p.id);
    expect(ids.filter((id) => id === postulacionYId)).toHaveLength(1);
  });
});