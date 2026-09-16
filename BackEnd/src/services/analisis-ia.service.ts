import { db } from '../config/database';
import { EmpresaModel } from '../models/empresa.model';
import { EmailModel } from '../models/email.model';
import { PostulacionModel } from '../models/postulacion.model';
import { UsuarioModel } from '../models/usuario.model';
import type { EmailRow } from '../types/models';
import type { PostulacionRow } from '../types/models';
import type { EstadoPostulacion, TipoRespuesta } from '../types/common';
import {
  clasificarLote,
  detectarPostulacionesLote,
  iaEstaConfigurada,
  TAMANIO_LOTE,
} from './ia.service';
import { AgendaService } from './agenda.service';
import {
  clasificarRespuesta,
  dominioSinTld,
} from './analisis.service';

const LIMITE_MAXIMO = 100;

export interface AnalisisDetalleIA {
  email_id: number;
  postulacion_id: number | null;
  empresa: string;
  tipo_respuesta: TipoRespuesta;
  snippet: string;
  estado_anterior: string | null;
  estado_nuevo: string | null;
  fuente: 'keywords' | 'ia';
  postulacion_creada?: boolean;
  vinculado_a_existente?: boolean;
  puesto?: string;
}

export interface ResumenAnalisisIA {
  analizados: number;
  rechazos: number;
  entrevistas: number;
  ofertas: number;
  estados_actualizados: number;
  postulaciones_creadas: number;
  postulaciones_vinculadas: number;
  detalle: AnalisisDetalleIA[];
}

const TRANSICIONES: Partial<Record<TipoRespuesta, EstadoPostulacion>> = {
  rechazo: 'rechazado',
  entrevista: 'entrevista',
  oferta: 'oferta',
};

const ESTADOS_ABIERTOS: readonly string[] = [
  'pendiente',
  'en_proceso',
  'entrevista',
];

const PALABRAS_POSTULACION: readonly string[] = [
  'postulacion',
  'postulación',
  'candidatura',
  'curriculum',
  'hoja de vida',
  'vacante',
  'apply',
  'aplicacion',
  'aplicación',
];

function normalizarTexto(valor: string | null): string {
  return (valor ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function esPostulacionPorKeywords(email: {
  enviado: number;
  asunto: string | null;
  remitente: string;
  contenido_resumen: string | null;
}): boolean {
  if (email.enviado === 1) {
    const texto = normalizarTexto(`${email.asunto ?? ''} ${email.remitente}`);
    return PALABRAS_POSTULACION.some((p) => texto.includes(normalizarTexto(p)));
  }

  const tipo = clasificarRespuesta({
    asunto: email.asunto,
    remitente: email.remitente,
    cuerpo: email.contenido_resumen ?? '',
  });
  return tipo === 'entrevista' || tipo === 'oferta' || tipo === 'rechazo';
}

interface EmailPendiente {
  id: number;
  postulacion_id: number | null;
  asunto: string | null;
  remitente: string;
  contenido_resumen: string | null;
  tipo_respuesta: string | null;
  tipo_respuesta_fuente: string | null;
  postulacion_estado: string | null;
}

export const AnalisisIAService = {
  async analizarEmailsPendientes(usuarioId: number): Promise<ResumenAnalisisIA> {
    const usuario = await UsuarioModel.obtenerPorId(usuarioId);
    const emailUsuario = usuario?.email ?? '';

    const [pendientes, candidatas, postulaciones, empresasList] =
      await Promise.all([
        this.cargarPendientes(usuarioId),
        emailUsuario
          ? EmailModel.listarSinPostulacionParaIA(emailUsuario, LIMITE_MAXIMO)
          : [],
        PostulacionModel.listar({ usuarioId }),
        EmpresaModel.listar(),
      ]);

    const resultado: ResumenAnalisisIA = {
      analizados: 0,
      rechazos: 0,
      entrevistas: 0,
      ofertas: 0,
      estados_actualizados: 0,
      postulaciones_creadas: 0,
      postulaciones_vinculadas: 0,
      detalle: [],
    };

    const usarIA = iaEstaConfigurada();

    await this.procesarCandidatas(usuarioId, candidatas, postulaciones, empresasList, resultado, usarIA);

    if (pendientes.length === 0) {
      return resultado;
    }

    const empresaDePostulacion = new Map<number, number>();
    for (const postulacion of postulaciones) {
      empresaDePostulacion.set(postulacion.id, postulacion.empresa_id);
    }
    const nombreEmpresa = new Map<number, string>();
    for (const empresa of empresasList) {
      nombreEmpresa.set(empresa.id, empresa.nombre);
    }

    for (let i = 0; i < pendientes.length; i += TAMANIO_LOTE) {
      const lote = pendientes.slice(i, i + TAMANIO_LOTE);
      const sinClasificar = lote.filter((email) => !email.tipo_respuesta);
      const clasificaciones =
        usarIA && sinClasificar.length > 0
          ? await clasificarLote(
              sinClasificar.map((email) => ({
                id: String(email.id),
                asunto: email.asunto,
                remitente: email.remitente,
                contenido: email.contenido_resumen ?? '',
              })),
            )
          : [];

      let indiceIA = 0;
      for (const email of lote) {
        const clasificadoPrevio = email.tipo_respuesta;
        let tipo: TipoRespuesta;
        let fuente: 'keywords' | 'ia';

        if (clasificadoPrevio) {
          tipo = clasificadoPrevio as TipoRespuesta;
          fuente = email.tipo_respuesta_fuente === 'ia' ? 'ia' : 'keywords';
        } else {
          const clasificacionIA = clasificaciones[indiceIA];
          indiceIA += 1;
          if (clasificacionIA) {
            tipo = clasificacionIA.tipo;
            fuente = 'ia';
          } else {
            tipo = clasificarRespuesta({
              asunto: email.asunto,
              remitente: email.remitente,
              cuerpo: email.contenido_resumen ?? '',
            });
            fuente = 'keywords';
          }
          await EmailModel.actualizar(email.id, {
            tipo_respuesta: tipo,
            tipo_respuesta_fuente: fuente,
          });
        }

        resultado.analizados += 1;
        if (tipo === 'rechazo') resultado.rechazos += 1;
        if (tipo === 'entrevista') resultado.entrevistas += 1;
        if (tipo === 'oferta') resultado.ofertas += 1;

        const estadoAnterior = email.postulacion_estado;
        const objetivo =
          email.postulacion_id !== null
            ? TRANSICIONES[tipo]
            : undefined;
        let estadoNuevo: string | null = null;
        if (
          email.postulacion_id !== null &&
          objetivo &&
          estadoAnterior &&
          ESTADOS_ABIERTOS.includes(estadoAnterior) &&
          estadoAnterior !== objetivo
        ) {
          await PostulacionModel.actualizar(email.postulacion_id, {
            estado: objetivo,
          });
          estadoNuevo = objetivo;
          resultado.estados_actualizados += 1;
        }

        const empresaId = empresaDePostulacion.get(email.postulacion_id ?? -1);
        resultado.detalle.push({
          email_id: email.id,
          postulacion_id: email.postulacion_id,
          empresa:
            empresaId !== undefined
              ? nombreEmpresa.get(empresaId) ?? ''
              : '',
          tipo_respuesta: tipo,
          snippet: this.generarSnippet(email.contenido_resumen ?? ''),
          estado_anterior: estadoAnterior,
          estado_nuevo: estadoNuevo,
          fuente,
        });
      }
    }

    return resultado;
  },

  async cargarPendientes(usuarioId: number): Promise<EmailPendiente[]> {
    const resultado = await db.execute({
      sql: `
        SELECT e.id, e.postulacion_id, e.asunto, e.remitente, e.contenido_resumen,
               e.tipo_respuesta, e.tipo_respuesta_fuente, p.estado AS postulacion_estado
        FROM emails e
        JOIN postulaciones p ON p.id = e.postulacion_id
        WHERE e.enviado = 0
          AND e.tipo = 'respuesta'
          AND p.usuario_id = ?
          AND (
            e.tipo_respuesta IS NULL
            OR p.estado IN ('pendiente', 'en_proceso', 'entrevista')
          )
        ORDER BY e.fecha ASC, e.id ASC
        LIMIT ?
      `,
      args: [usuarioId, LIMITE_MAXIMO],
    });
    return resultado.rows as unknown as EmailPendiente[];
  },

  async procesarCandidatas(
    usuarioId: number,
    candidatas: EmailRow[],
    postulaciones: PostulacionRow[],
    empresasList: { id: number; nombre: string }[],
    resultado: ResumenAnalisisIA,
    usarIA: boolean,
  ): Promise<void> {
    if (candidatas.length === 0) return;

    const nombreEmpresa = new Map<number, string>();
    for (const empresa of empresasList) {
      nombreEmpresa.set(empresa.id, empresa.nombre);
    }

    for (let i = 0; i < candidatas.length; i += TAMANIO_LOTE) {
      const lote = candidatas.slice(i, i + TAMANIO_LOTE);

      const detecciones =
        usarIA
          ? await detectarPostulacionesLote(
              lote.map((email) => ({
                id: String(email.id),
                asunto: email.asunto,
                remitente: email.remitente,
                contenido: email.contenido_resumen ?? '',
              })),
            )
          : [];

      let indiceIA = 0;
      for (const email of lote) {
        const deteccionIA = detecciones[indiceIA];
        indiceIA += 1;

        let esPostulacion: boolean;
        let puestoIA: string | null = null;
        if (deteccionIA) {
          esPostulacion = deteccionIA.es_postulacion;
          puestoIA = deteccionIA.puesto;
        } else {
          esPostulacion = esPostulacionPorKeywords(email);
        }

        const fuente: 'ia' | 'keywords' =
          usarIA && deteccionIA ? 'ia' : 'keywords';

        if (!esPostulacion) {
          await EmailModel.actualizar(email.id, {
            tipo_respuesta: 'otro',
            tipo_respuesta_fuente: fuente,
          });
          continue;
        }

        const contraparte =
          email.enviado === 1 ? (email.destinatario ?? '') : email.remitente;
        const empresaId = await AgendaService.agendarDesdeCorreo(contraparte);

        if (empresaId === null) {
          await EmailModel.actualizar(email.id, {
            tipo_respuesta: 'otro',
            tipo_respuesta_fuente: fuente,
          });
          continue;
        }

        const puesto = puestoIA ?? this.puestoFallback(email);
        const existente = this.buscarPostulacionExistente(
          postulaciones,
          empresaId,
          puesto,
        );

        const tipoDetalle = this.tipoParaDetalle(email);

        if (existente) {
          await EmailModel.actualizar(email.id, {
            postulacion_id: existente.id,
          });
          resultado.postulaciones_vinculadas += 1;
          resultado.detalle.push({
            email_id: email.id,
            postulacion_id: existente.id,
            empresa:
              nombreEmpresa.get(empresaId) ??
              dominioSinTld(contraparte) ??
              '',
            tipo_respuesta: tipoDetalle,
            snippet: this.generarSnippet(email.contenido_resumen ?? ''),
            estado_anterior: null,
            estado_nuevo: null,
            fuente,
            vinculado_a_existente: true,
            puesto,
          });
          continue;
        }

        const estadoInicial = TRANSICIONES[tipoDetalle] ?? 'pendiente';
        const postulacionCreada = await PostulacionModel.crear({
          usuario_id: usuarioId,
          empresa_id: empresaId,
          puesto,
          estado: estadoInicial,
          interes: 'medio',
          respondio: email.enviado === 0 ? 1 : 0,
          fuente: 'Email',
          cantidad_mails_enviados: email.enviado === 1 ? 1 : 0,
          fecha_postulacion: email.fecha?.slice(0, 10) ?? null,
          ultimo_contacto: email.fecha?.slice(0, 10) ?? null,
          observaciones: `Creada automáticamente desde el email "${(email.asunto ?? '').slice(0, 120)}"`,
        });

        await EmailModel.actualizar(email.id, {
          postulacion_id: postulacionCreada.id,
          tipo_respuesta: tipoDetalle,
          tipo_respuesta_fuente: fuente,
        });

        postulaciones.push(postulacionCreada);

        resultado.postulaciones_creadas += 1;
        resultado.detalle.push({
          email_id: email.id,
          postulacion_id: postulacionCreada.id,
          empresa:
            nombreEmpresa.get(empresaId) ??
            dominioSinTld(contraparte) ??
            '',
          tipo_respuesta: tipoDetalle,
          snippet: this.generarSnippet(email.contenido_resumen ?? ''),
          estado_anterior: null,
          estado_nuevo: estadoInicial,
          fuente,
          postulacion_creada: true,
          puesto,
        });
      }
    }
  },

  tipoParaDetalle(email: EmailRow): TipoRespuesta {
    if (email.enviado === 1) return 'otro';
    return clasificarRespuesta({
      asunto: email.asunto,
      remitente: email.remitente,
      cuerpo: email.contenido_resumen ?? '',
    });
  },

  puestoFallback(email: EmailRow): string {
    const limpio = (email.asunto ?? '')
      .replace(/^(re|fwd|fv|ev|rw|aw|atb|ant)\s*:\s*/i, '')
      .replace(/^\[[^\]]*\]\s*/, '')
      .trim();
    return limpio.length >= 2 && limpio.length <= 150
      ? limpio
      : 'Postulación vía correo';
  },

  buscarPostulacionExistente(
    postulaciones: PostulacionRow[],
    empresaId: number,
    puesto: string,
  ): PostulacionRow | null {
    const normalizado = normalizarTexto(puesto);
    return (
      postulaciones.find(
        (p) =>
          p.empresa_id === empresaId &&
          normalizarTexto(p.puesto) === normalizado,
      ) ?? null
    );
  },

  generarSnippet(contenido: string, maximo = 300): string {
    const comprimido = contenido.replace(/\s+/g, ' ').trim();
    return comprimido.length > maximo
      ? `${comprimido.slice(0, maximo)}…`
      : comprimido;
  },
};

export function tieneEmailsPendientesParaIA(
  resultado: ResumenAnalisisIA,
): boolean {
  return resultado.analizados > 0 || resultado.detalle.length > 0;
}