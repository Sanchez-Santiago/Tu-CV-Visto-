import { getOAuthClient } from '../config/google';
import { CuentaGoogleModel } from '../models/cuenta-google.model';
import { AppError } from '../utils/errors';
import { randomBytes } from 'node:crypto';

const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1/users/me';

export interface AdjuntoGmail {
  nombre: string;
  mimeType: string;
  contenidoBase64: string;
}

export interface GmailMensajeResumen {
  id: string;
  threadId: string | null;
  snippet: string;
}

export interface GmailMensajeDetalle extends GmailMensajeResumen {
  fecha: string | null;
  cabeceras: {
    de: string | null;
    para: string | null;
    asunto: string | null;
    fecha: string | null;
  };
  cuerpo: string;
  cuerpoHtml: string;
}

interface CabeceraGmail {
  name?: string;
  value?: string;
}

interface RespuestaGmail {
  id?: string;
  threadId?: string;
  snippet?: string;
  internalDate?: string;
  nextPageToken?: string;
  payload?: {
    mimeType?: string;
    body?: { data?: string };
    parts?: RespuestaGmail['payload'][];
    headers?: CabeceraGmail[];
  };
  messages?: RespuestaGmail[];
}

async function obtenerAccessToken(usuarioId: number): Promise<string> {
  const cuenta = await CuentaGoogleModel.obtenerPorUsuario(usuarioId);
  if (!cuenta) {
    throw new AppError(
      401,
      'No hay una cuenta de Google vinculada a este usuario',
    );
  }

  if (cuenta.access_token && cuenta.token_expires_at) {
    const expira = new Date(cuenta.token_expires_at).getTime();
    if (expira > Date.now() + 60_000) {
      return cuenta.access_token;
    }
  }

  if (!cuenta.refresh_token) {
    throw new AppError(
      401,
      'La cuenta de Google no permite renovar el acceso (sin refresh_token). Vinculá la cuenta de nuevo.',
    );
  }

  const client = getOAuthClient();
  client.setCredentials({ refresh_token: cuenta.refresh_token });

  let token: string | null | undefined;
  try {
    const res = await client.getAccessToken();
    token = res.token;
  } catch (err) {
    throw new AppError(
      401,
      'No se pudo renovar el token de Google. Vinculá la cuenta de nuevo.',
      err instanceof Error ? err.message : undefined,
    );
  }

  if (!token) {
    throw new AppError(500, 'No se pudo obtener un token de Google');
  }

  const credenciales = client.credentials;
  await CuentaGoogleModel.upsertTokens({
    usuarioId,
    googleId: cuenta.google_id,
    accessToken: credenciales.access_token ?? token,
    tokenExpiresAt: credenciales.expiry_date
      ? new Date(credenciales.expiry_date).toISOString()
      : undefined,
  });
  return token;
}

async function requestGmail(
  usuarioId: number,
  ruta: string,
  init?: RequestInit,
): Promise<RespuestaGmail> {
  const token = await obtenerAccessToken(usuarioId);
  const res = await fetch(`${GMAIL_API}${ruta}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    let errorJson: { error?: { message?: string; status?: string } } | null =
      null;
    let body = '';
    try {
      errorJson = (await res.json()) as {
        error?: { message?: string; status?: string };
      };
    } catch {
      body = await res.text().catch(() => '');
    }
    const razon =
      errorJson?.error?.message ?? errorJson?.error?.status ?? body;
    const detalle = JSON.stringify(errorJson) || body;

    const texto = String(razon).toLowerCase();
    const estadoError = errorJson?.error?.status ?? '';

    if (
      res.status === 429 ||
      texto.includes('quota exceeded') ||
      texto.includes('rate limit') ||
      texto.includes('resource exhausted') ||
      estadoError === 'RATE_LIMIT' ||
      estadoError === 'RESOURCE_EXHAUSTED'
    ) {
      throw new AppError(
        503,
        'Se superó la cuota de la Gmail API (límite por minuto). Esperá aproximadamente 1 minuto y presioná "Actualizar" de nuevo.',
        detalle.slice(0, 500),
      );
    }

    if (res.status === 403) {
      if (
        texto.includes('not been enabled') ||
        texto.includes('is not enabled') ||
        texto.includes('has not been used') ||
        texto.includes('access not configured')
      ) {
        throw new AppError(
          502,
          'La Gmail API no está habilitada en Google Cloud. Activá "Gmail API" en https://console.cloud.google.com/apis/library/gmail.googleapis.com y volvé a conectarte.',
          detalle.slice(0, 500),
        );
      }
      throw new AppError(
        502,
        'Tu cuenta de Google no tiene permisos de Gmail. Reconectá la cuenta aceptando "leer y enviar correos en tu nombre" (scopes gmail.readonly y gmail.send).',
        detalle.slice(0, 500),
      );
    }

    throw new AppError(
      502,
      `Error de la Gmail API (${res.status})`,
      detalle.slice(0, 500),
    );
  }

  return res.json() as Promise<RespuestaGmail>;
}

function limpiarCabecera(valor: string): string {
  return valor.replace(/[\r\n]/g, ' ').trim();
}

function encriptarNombreAdjunto(nombre: string, indice: number): string {
  const limpio = nombre.replace(/["\r\n;]/g, '_').trim();
  return limpio || `adjunto-${indice + 1}`;
}

function envolverBase64(contenido: string): string {
  const limpio = contenido.replace(/\s+/g, '');
  return limpio.match(/.{1,76}/g)?.join('\r\n') ?? '';
}

function escaparTextoPlano(cuerpo: string): string {
  return cuerpo.replace(/\r?\n/g, '\r\n');
}

function escaparAtributo(texto: string): string {
  return texto.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const TEXTO_PLANO_PART = [
  'Content-Type: text/plain; charset="UTF-8"',
  'Content-Transfer-Encoding: 8bit',
  '',
];

const HTML_PART = [
  'Content-Type: text/html; charset="UTF-8"',
  'Content-Transfer-Encoding: 8bit',
  '',
];

export interface FirmaImagenGmail {
  contentId: string;
  mimeType: string;
  contenidoBase64: string;
}

function construirMensajeRaw(
  input: {
    destinatario: string;
    asunto: string;
    cuerpo: string;
    html: string;
    cc?: string;
  },
  adjuntos?: AdjuntoGmail[],
  firmasImagenes?: FirmaImagenGmail[],
): string {
  const asunto = input.asunto.replace(/[\r\n]+/g, ' ').trim();
  const cuerpo = escaparTextoPlano(input.cuerpo);
  const html = input.html.replace(/\r?\n/g, '\r\n');

  const cabecerasComunes = [
    `To: ${input.destinatario}`,
    ...(input.cc ? [`Cc: ${limpiarCabecera(input.cc)}`] : []),
    `Subject: ${asunto}`,
  ];

  const tieneAdjuntos = (adjuntos ?? []).length > 0;
  const tieneImagenes = (firmasImagenes ?? []).length > 0;

  const boundaryAlternativa = `----=_cvisto_alt_${randomBytes(8).toString('hex')}`;
  const parteAlternativa = [
    'Content-Type: multipart/alternative; boundary="' + boundaryAlternativa + '"',
    '',
    `--${boundaryAlternativa}`,
    ...TEXTO_PLANO_PART,
    cuerpo,
    `--${boundaryAlternativa}`,
    ...HTML_PART,
    html,
    `--${boundaryAlternativa}--`,
  ];

  let cabeceraContenido: string;
  let cuerpoMulti: string[];

  if (!tieneAdjuntos && !tieneImagenes) {
    cabeceraContenido = 'Content-Type: multipart/alternative; boundary="' + boundaryAlternativa + '"';
    cuerpoMulti = [``, ...parteAlternativa.slice(1)];
  } else if (tieneAdjuntos) {
    const boundaryMixto = `----=_cvisto_mixed_${randomBytes(8).toString('hex')}`;
    cabeceraContenido = 'Content-Type: multipart/mixed; boundary="' + boundaryMixto + '"';
    cuerpoMulti = [`--${boundaryMixto}`];
    if (tieneImagenes) {
      const boundaryRelacionado = `----=_cvisto_related_${randomBytes(8).toString('hex')}`;
      cuerpoMulti.push(
        `Content-Type: multipart/related; boundary="${boundaryRelacionado}"`,
        '',
        `--${boundaryRelacionado}`,
      );
      for (const parte of parteAlternativa) {
        cuerpoMulti.push(parte);
      }
      for (let i = 0; i < (firmasImagenes ?? []).length; i += 1) {
        const firma = (firmasImagenes ?? [])[i] as FirmaImagenGmail;
        cuerpoMulti.push(
          `--${boundaryRelacionado}`,
          `Content-Type: ${firma.mimeType}; name="firma-${i + 1}"`,
          `Content-ID: <${firma.contentId}>`,
          'Content-Disposition: inline; filename="firma-' + (i + 1) + '"',
          'Content-Transfer-Encoding: base64',
          '',
          envolverBase64(firma.contenidoBase64),
        );
      }
      cuerpoMulti.push(`--${boundaryRelacionado}--`);
    } else {
      for (const parte of parteAlternativa) {
        cuerpoMulti.push(parte);
      }
    }
    for (let i = 0; i < (adjuntos ?? []).length; i += 1) {
      const adjunto = (adjuntos ?? [])[i] as AdjuntoGmail;
      const nombre = encriptarNombreAdjunto(adjunto.nombre, i);
      cuerpoMulti.push(
        `--${boundaryMixto}`,
        `Content-Type: ${adjunto.mimeType}; name="${nombre}"`,
        `Content-Disposition: attachment; filename="${nombre}"`,
        'Content-Transfer-Encoding: base64',
        '',
        envolverBase64(adjunto.contenidoBase64),
      );
    }
    cuerpoMulti.push(`--${boundaryMixto}--`);
  } else {
    const boundaryRelacionado = `----=_cvisto_related_${randomBytes(8).toString('hex')}`;
    cabeceraContenido = 'Content-Type: multipart/related; boundary="' + boundaryRelacionado + '"';
    cuerpoMulti = [`--${boundaryRelacionado}`];
    for (const parte of parteAlternativa) {
      cuerpoMulti.push(parte);
    }
    for (let i = 0; i < (firmasImagenes ?? []).length; i += 1) {
      const firma = (firmasImagenes ?? [])[i] as FirmaImagenGmail;
      cuerpoMulti.push(
        `--${boundaryRelacionado}`,
        `Content-Type: ${firma.mimeType}; name="firma-${i + 1}"`,
        `Content-ID: <${firma.contentId}>`,
        'Content-Disposition: inline; filename="firma-' + (i + 1) + '"',
        'Content-Transfer-Encoding: base64',
        '',
        envolverBase64(firma.contenidoBase64),
      );
    }
    cuerpoMulti.push(`--${boundaryRelacionado}--`);
  }

  return [...cabecerasComunes, 'MIME-Version: 1.0', cabeceraContenido, ...cuerpoMulti].join('\r\n');
}

function cabecerasDeInteres(
  cabeceras: CabeceraGmail[],
): GmailMensajeDetalle['cabeceras'] {
  const obtener = (nombre: string): string | null => {
    const encontrada = cabeceras.find(
      (c) => c.name?.toLowerCase() === nombre.toLowerCase(),
    );
    return encontrada?.value ?? null;
  };
  return {
    de: obtener('From'),
    para: obtener('To'),
    asunto: obtener('Subject'),
    fecha: obtener('Date'),
  };
}

function extraerCuerpo(payload?: RespuestaGmail['payload']): string | null {
  if (!payload) return null;
  if (payload.body?.data) {
    return Buffer.from(
      payload.body.data.replace(/-/g, '+').replace(/_/g, '/'),
      'base64',
    ).toString('utf8');
  }
  for (const parte of payload.parts ?? []) {
    const cuerpo = extraerCuerpo(parte);
    if (cuerpo) return cuerpo;
  }
  return null;
}

function extraerParteHtml(payload?: RespuestaGmail['payload']): string | null {
  if (!payload) return null;
  if (payload.mimeType === 'text/html' && payload.body?.data) {
    return Buffer.from(
      payload.body.data.replace(/-/g, '+').replace(/_/g, '/'),
      'base64',
    ).toString('utf8');
  }
  for (const parte of payload.parts ?? []) {
    const cuerpo = extraerParteHtml(parte);
    if (cuerpo) return cuerpo;
  }
  return null;
}

export const GmailService = {
  async enviar(
    usuarioId: number,
    input: {
      destinatario: string;
      asunto: string;
      cuerpo: string;
      html: string;
      cc?: string;
      adjuntos?: AdjuntoGmail[];
      firmasImagenes?: FirmaImagenGmail[];
    },
  ): Promise<{ gmailMessageId: string; threadId: string; snippet: string }> {
    const raw = construirMensajeRaw(
      input,
      input.adjuntos,
      input.firmasImagenes,
    );
    const data = await requestGmail(usuarioId, '/messages/send', {
      method: 'POST',
      body: JSON.stringify({
        raw: Buffer.from(raw).toString('base64url'),
      }),
    });
    return {
      gmailMessageId: data.id ?? '',
      threadId: data.threadId ?? '',
      snippet: data.snippet ?? '',
    };
  },

  async listarMensajes(
    usuarioId: number,
    maxResults = 10,
    query = '',
    maxPaginas = 1,
  ): Promise<GmailMensajeResumen[]> {
    const tamanioPagina = Math.min(Math.max(maxResults, 1), 100);
    const mensajes: GmailMensajeResumen[] = [];
    let pagina = 0;
    let pageToken: string | undefined;
    do {
      const parametros = new URLSearchParams({
        maxResults: String(tamanioPagina),
      });
      if (query.trim()) parametros.set('q', query.trim());
      if (pageToken) parametros.set('pageToken', pageToken);
      const data = await requestGmail(usuarioId, `/messages?${parametros}`);
      for (const mensaje of data.messages ?? []) {
        mensajes.push({
          id: mensaje.id ?? '',
          threadId: mensaje.threadId ?? null,
          snippet: mensaje.snippet ?? '',
        });
      }
      pageToken = data.nextPageToken;
      pagina += 1;
    } while (pageToken && pagina < maxPaginas);
    return mensajes;
  },

  async listarRecibidos(
    usuarioId: number,
    dias = 14,
    maxResults = 50,
    maxPaginas = 1,
  ): Promise<GmailMensajeResumen[]> {
    return this.listarMensajes(
      usuarioId,
      maxResults,
      `in:inbox newer_than:${dias}d`,
      maxPaginas,
    );
  },

  async listarEnviados(
    usuarioId: number,
    dias = 14,
    maxResults = 50,
    maxPaginas = 1,
  ): Promise<GmailMensajeResumen[]> {
    return this.listarMensajes(
      usuarioId,
      maxResults,
      `in:sent newer_than:${dias}d`,
      maxPaginas,
    );
  },

  async obtenerMensaje(
    usuarioId: number,
    messageId: string,
  ): Promise<GmailMensajeDetalle> {
    const data = await requestGmail(usuarioId, `/messages/${messageId}`);
    return {
      id: data.id ?? '',
      threadId: data.threadId ?? null,
      snippet: data.snippet ?? '',
      fecha: data.internalDate
        ? new Date(Number(data.internalDate)).toISOString()
        : null,
      cabeceras: cabecerasDeInteres(data.payload?.headers ?? []),
      cuerpo: extraerCuerpo(data.payload) ?? '',
      cuerpoHtml: extraerParteHtml(data.payload) ?? '',
    };
  },
};