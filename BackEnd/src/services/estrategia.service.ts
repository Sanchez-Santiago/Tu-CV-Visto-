import { env } from '../config/env';
import { ContactoRrhhModel } from '../models/contacto-rrhh.model';
import { EmailModel } from '../models/email.model';
import { EmpresaModel } from '../models/empresa.model';
import { EstrategiaModel } from '../models/estrategia.model';
import { PostulacionModel } from '../models/postulacion.model';
import type { EmailRow, PostulacionRow } from '../types/models';
import type { TipoSeguimiento } from '../types/common';
import { AppError, NotFoundError } from '../utils/errors';
import { PlantillaService } from './plantilla.service';
import { clasificarRespuesta } from './analisis.service';
import { EmailService } from './email.service';

export interface ContactoDebido {
  postulacion_id: number;
  empresa: string;
  puesto: string;
  estado: string;
  ultimo_contacto: string | null;
  proxima_contacto: string | null;
  dias_desde_ultimo_contacto: number;
  dias_para_proximo_contacto: number;
  tipo_sugerido: TipoSeguimiento;
}

export interface RenovacionCandidata extends ContactoDebido {
  destinatario: string | null;
  asunto_sugerido: string;
  cuerpo_sugerido: string;
}

export interface RechazoDetectado {
  postulacion_id: number;
  empresa: string;
  puesto: string;
  email_id: number;
  asunto: string | null;
  fecha: string;
  snippet: string | null;
}

export interface EstadisticasEstrategia {
  total_postulaciones: number;
  mails_enviados: number;
  mails_recibidos: number;
  respondidas: number;
  tasa_respuesta: number;
  positivas: number;
  entrevistas: number;
  ofertas: number;
  aceptadas: number;
  rechazadas: number;
  activas: number;
  mails_por_mes: { mes: string; enviados: number; recibidos: number }[];
  mails_por_puesto: {
    puesto: string;
    postulaciones: number;
    mails_enviados: number;
    respondidas: number;
  }[];
}

const ESTADOS_POSITIVOS = ['entrevista', 'oferta', 'aceptado'];
const ESTADOS_CERRADOS = ['rechazado', 'aceptado', 'cancelado'];

function hoyDia(): string {
  return new Date().toISOString().slice(0, 10);
}

function diasEntre(inicio: string, fin: string): number {
  const a = new Date(`${inicio}T00:00:00Z`);
  const b = new Date(`${fin}T00:00:00Z`);
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

function esVencida(
  fila: {
    ultimo_contacto: string | null;
    proxima_contacto: string | null;
    fecha_postulacion: string | null;
    created_at: string;
    empresa_cadencia_contacto: number | null;
  },
  hoy: string,
): boolean {
  const cadencia = fila.empresa_cadencia_contacto ?? env.CADENCIA_CONTACTO_DIAS;
  const base =
    fila.ultimo_contacto ?? fila.fecha_postulacion ?? fila.created_at.slice(0, 10);
  const diasDesde = diasEntre(base, hoy);
  return (
    (fila.proxima_contacto !== null && fila.proxima_contacto <= hoy) ||
    (fila.proxima_contacto === null && diasDesde >= cadencia)
  );
}

function diasDesdeUltimoContacto(fila: {
  ultimo_contacto: string | null;
  fecha_postulacion: string | null;
  created_at: string;
}, hoy: string): number {
  const base =
    fila.ultimo_contacto ?? fila.fecha_postulacion ?? fila.created_at.slice(0, 10);
  return diasEntre(base, hoy);
}

function sugerirTipo(
  cantidadMailsEnviados: number,
  diasDesde: number,
): TipoSeguimiento {
  if (cantidadMailsEnviados === 0) return 'consulta';
  if (diasDesde >= 90) return 'disponibilidad';
  if (diasDesde >= 45) return 'nuevo_proyecto';
  return 'novedad';
}

async function obtenerDestinatario(
  postulacionId: number,
): Promise<string | null> {
  const emails = await EmailModel.listar({ postulacionId });
  const enviado = emails.find(
    (email) => email.enviado === 1 && Boolean(email.destinatario),
  );
  if (enviado) return enviado.destinatario;

  const postulacion = await PostulacionModel.obtenerPorId(postulacionId);
  if (postulacion?.empresa_id !== null && postulacion?.empresa_id !== undefined) {
    const contactos = await ContactoRrhhModel.listarPorEmpresa(
      postulacion.empresa_id,
    );
    const contacto = contactos.find((c) => Boolean(c.email));
    if (contacto) return contacto.email;
  }
  return null;
}

export const EstrategiaService = {
  async listarDebidas(usuarioId: number): Promise<ContactoDebido[]> {
    const filas = await EstrategiaModel.listarDebidas(usuarioId);
    const hoy = hoyDia();
    const debidas: ContactoDebido[] = [];

    for (const fila of filas) {
      if (!esVencida(fila, hoy)) continue;

      const diasDesde = diasDesdeUltimoContacto(fila, hoy);
      const cadencia =
        fila.empresa_cadencia_contacto ?? env.CADENCIA_CONTACTO_DIAS;
      const diasParaProximo =
        fila.proxima_contacto !== null
          ? diasEntre(hoy, fila.proxima_contacto)
          : cadencia - diasDesde;

      debidas.push({
        postulacion_id: fila.id,
        empresa: fila.empresa_nombre,
        puesto: fila.puesto,
        estado: fila.estado,
        ultimo_contacto: fila.ultimo_contacto,
        proxima_contacto: fila.proxima_contacto,
        dias_desde_ultimo_contacto: diasDesde,
        dias_para_proximo_contacto: diasParaProximo,
        tipo_sugerido: sugerirTipo(fila.cantidad_mails_enviados, diasDesde),
      });
    }

    return debidas.sort((a, b) =>
      a.dias_para_proximo_contacto === b.dias_para_proximo_contacto
        ? a.dias_desde_ultimo_contacto - b.dias_desde_ultimo_contacto
        : a.dias_para_proximo_contacto - b.dias_para_proximo_contacto,
    );
  },

  async listarRenovaciones(usuarioId: number): Promise<RenovacionCandidata[]> {
    const filas = await EstrategiaModel.listarDebidas(usuarioId);
    const hoy = hoyDia();
    const candidatas: RenovacionCandidata[] = [];

    for (const fila of filas) {
      if (fila.respondio === 1) continue;
      if (!esVencida(fila, hoy)) continue;

      const diasDesde = diasDesdeUltimoContacto(fila, hoy);
      const tipo = sugerirTipo(fila.cantidad_mails_enviados, diasDesde);
      const [destinatario, plantilla] = await Promise.all([
        obtenerDestinatario(fila.id),
        PlantillaService.generar({ tipo, usuarioId, postulacionId: fila.id }),
      ]);

      const cadencia =
        fila.empresa_cadencia_contacto ?? env.CADENCIA_CONTACTO_DIAS;
      const diasParaProximo =
        fila.proxima_contacto !== null
          ? diasEntre(hoy, fila.proxima_contacto)
          : cadencia - diasDesde;

      candidatas.push({
        postulacion_id: fila.id,
        empresa: fila.empresa_nombre,
        puesto: fila.puesto,
        estado: fila.estado,
        ultimo_contacto: fila.ultimo_contacto,
        proxima_contacto: fila.proxima_contacto,
        dias_desde_ultimo_contacto: diasDesde,
        dias_para_proximo_contacto: diasParaProximo,
        tipo_sugerido: tipo,
        destinatario,
        asunto_sugerido: plantilla.asunto,
        cuerpo_sugerido: plantilla.cuerpo,
      });
    }

    return candidatas.sort((a, b) =>
      a.dias_desde_ultimo_contacto === b.dias_desde_ultimo_contacto
        ? a.postulacion_id - b.postulacion_id
        : b.dias_desde_ultimo_contacto - a.dias_desde_ultimo_contacto,
    );
  },

  async renovar(
    usuarioId: number,
    items: { postulacion_id: number; asunto?: string; cuerpo?: string }[],
  ): Promise<{ enviados: number; emails: EmailRow[] }> {
    const hoy = hoyDia();
    const emails: EmailRow[] = [];

    for (const item of items) {
      const postulacion = await PostulacionModel.obtenerPorId(
        item.postulacion_id,
      );
      if (!postulacion || postulacion.usuario_id !== usuarioId) {
        throw new NotFoundError(
          `Postulación ${item.postulacion_id} no encontrada`,
        );
      }

      const destinatario = await obtenerDestinatario(item.postulacion_id);
      if (!destinatario) {
        throw new AppError(
          400,
          `No hay destinatario para la postulación ${item.postulacion_id}. Cargá un contacto o un email enviado primero.`,
        );
      }

      const diasDesde = diasDesdeUltimoContacto(postulacion, hoy);
      const tipo = sugerirTipo(
        postulacion.cantidad_mails_enviados,
        diasDesde,
      );

      const plantilla = await PlantillaService.generar({
        tipo,
        usuarioId,
        postulacionId: item.postulacion_id,
      });

      const email = await EmailService.enviarYRegistrar(usuarioId, {
        postulacion_id: item.postulacion_id,
        destinatario,
        asunto: item.asunto?.trim() || plantilla.asunto,
        cuerpo: item.cuerpo?.trim() || plantilla.cuerpo,
        tipo: 'seguimiento',
        tipo_seguimiento: tipo,
        crear_seguimiento: true,
      });

      emails.push(email);
    }

    return { enviados: emails.length, emails };
  },

  async revisionRechazos(usuarioId: number): Promise<RechazoDetectado[]> {
    const postulaciones = await PostulacionModel.listar({ usuarioId });
    const postulacionNombres = new Map<number, string>();
    const empresas = await EmpresaModel.listar();
    const nombreEmpresa = new Map<number, string>();
    for (const empresa of empresas) {
      nombreEmpresa.set(empresa.id, empresa.nombre);
    }
    for (const p of postulaciones) {
      postulacionNombres.set(
        p.id,
        p.empresa_id !== null ? nombreEmpresa.get(p.empresa_id) ?? '' : '',
      );
    }

    const respuestas = (await EmailModel.listarResumenParaUsuario(usuarioId)).filter(
      (email) =>
        email.tipo === 'respuesta' &&
        email.postulacion_id !== null &&
        Boolean(email.gmail_message_id),
    );

    const cerradas = new Map(
      postulaciones
        .filter((p) => ESTADOS_CERRADOS.includes(p.estado))
        .map((p) => [p.id, true]),
    );

    const candidatos: RechazoDetectado[] = [];
    for (const email of respuestas) {
      if (email.postulacion_id === null) continue;
      if (cerradas.has(email.postulacion_id)) continue;
      const tipo = clasificarRespuesta({
        asunto: email.asunto,
        remitente: email.remitente,
        cuerpo: email.contenido_resumen ?? '',
      });
      if (tipo !== 'rechazo') continue;
      if (email.postulacion_id === null) continue;
      const postulacion = postulaciones.find(
        (p) => p.id === email.postulacion_id,
      );
      candidatos.push({
        postulacion_id: email.postulacion_id,
        empresa: postulacionNombres.get(email.postulacion_id) ?? '',
        puesto: postulacion?.puesto ?? '',
        email_id: email.id,
        asunto: email.asunto,
        fecha: email.fecha,
        snippet: email.contenido_resumen ?? null,
      });
    }

    return candidatos.sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
    );
  },

  async confirmarRechazo(
    usuarioId: number,
    postulacionId: number,
  ): Promise<PostulacionRow> {
    const postulacion = await PostulacionModel.obtenerPorId(postulacionId);
    if (!postulacion || postulacion.usuario_id !== usuarioId) {
      throw new NotFoundError(`Postulación ${postulacionId} no encontrada`);
    }
    const actualizada = await PostulacionModel.actualizar(postulacionId, {
      estado: 'rechazado',
      respondio: 1,
    });
    if (!actualizada) {
      throw new NotFoundError(`Postulación ${postulacionId} no encontrada`);
    }
    return actualizada;
  },

  async estadisticas(usuarioId: number): Promise<EstadisticasEstrategia> {
    const [postulaciones, emails] = await Promise.all([
      PostulacionModel.listar({ usuarioId }),
      EmailModel.listarResumenParaUsuario(usuarioId),
    ]);

    const enviados = emails.filter((e) => e.enviado === 1);
    const recibidos = emails.filter(
      (e) => e.tipo === 'respuesta' || e.enviado === 0,
    );
    const respondidas = postulaciones.filter(
      (p) =>
        p.respondio === 1 ||
        ESTADOS_POSITIVOS.includes(p.estado) ||
        p.estado === 'rechazado',
    ).length;

    const activas = postulaciones.filter(
      (p) => !ESTADOS_CERRADOS.includes(p.estado),
    ).length;
    const entrevistas = postulaciones.filter(
      (p) => p.estado === 'entrevista',
    ).length;
    const ofertas = postulaciones.filter((p) => p.estado === 'oferta').length;
    const aceptadas = postulaciones.filter(
      (p) => p.estado === 'aceptado',
    ).length;
    const rechazadas = postulaciones.filter(
      (p) => p.estado === 'rechazado',
    ).length;
    const positivas = postulaciones.filter((p) =>
      ESTADOS_POSITIVOS.includes(p.estado),
    ).length;

    const porMes = new Map<string, { enviados: number; recibidos: number }>();
    for (const email of emails) {
      const mes = (email.fecha ?? '').slice(0, 7);
      if (!mes) continue;
      const actual = porMes.get(mes) ?? { enviados: 0, recibidos: 0 };
      if (email.enviado === 1) actual.enviados += 1;
      else actual.recibidos += 1;
      porMes.set(mes, actual);
    }

    const porPuesto = new Map<
      string,
      { postulaciones: number; mails_enviados: number; respondidas: number }
    >();
    for (const p of postulaciones) {
      const puestoSinEspacios = (p.puesto ?? 'Sin especificar').trim() || 'Sin especificar';
      const actual = porPuesto.get(puestoSinEspacios) ?? {
        postulaciones: 0,
        mails_enviados: 0,
        respondidas: 0,
      };
      actual.postulaciones += 1;
      if (
        p.respondio === 1 ||
        ESTADOS_POSITIVOS.includes(p.estado) ||
        p.estado === 'rechazado'
      ) {
        actual.respondidas += 1;
      }
      porPuesto.set(puestoSinEspacios, actual);
    }
    for (const email of enviados) {
      const postulacion = postulaciones.find(
        (p) => p.id === email.postulacion_id,
      );
      if (!postulacion) continue;
      const puesto =
        (postulacion.puesto ?? 'Sin especificar').trim() || 'Sin especificar';
      const actual = porPuesto.get(puesto);
      if (actual) actual.mails_enviados += 1;
    }

    return {
      total_postulaciones: postulaciones.length,
      mails_enviados: enviados.length,
      mails_recibidos: recibidos.length,
      respondidas,
      tasa_respuesta:
        postulaciones.length > 0
          ? Math.round((respondidas / postulaciones.length) * 100)
          : 0,
      positivas,
      entrevistas,
      ofertas,
      aceptadas,
      rechazadas,
      activas,
      mails_por_mes: Array.from(porMes.entries())
        .map(([mes, valores]) => ({ mes, ...valores }))
        .sort((a, b) => a.mes.localeCompare(b.mes)),
      mails_por_puesto: Array.from(porPuesto.entries())
        .map(([puesto, valores]) => ({ puesto, ...valores }))
        .sort((a, b) => b.mails_enviados - a.mails_enviados),
    };
  },
};