import { EmpresaModel } from '../models/empresa.model';
import { EmailModel } from '../models/email.model';
import { PostulacionModel } from '../models/postulacion.model';
import { UsuarioModel } from '../models/usuario.model';
import type { EmailRow } from '../types/models';
import { AgendaService } from './agenda.service';
import { EmailService } from './email.service';
import { GmailService } from './gmail.service';
import {
  clasificarRespuesta,
  extraerEmailDireccion,
  matchearPostulacion,
  type TipoRespuesta,
} from './analisis.service';

const MAX_RESULTADOS = 100;
const MAX_PAGINAS = 10;
const ESPERA_ENTRE_MENSAJES_MS = 80;

function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface SincronizacionDetalle {
  postulacion_id: number | null;
  empresa: string;
  tipo_respuesta: TipoRespuesta;
  fecha: string;
  snippet: string;
  estado_anterior?: string | null;
  estado_nuevo?: string | null;
}

export interface ResumenSincronizacion {
  importados: number;
  yaExistentes: number;
  sinMatch: number;
  estados_actualizados: number;
  resumen: Record<TipoRespuesta, number>;
  detalle: SincronizacionDetalle[];
}

const resumenVacio: Record<TipoRespuesta, number> = {
  rechazo: 0,
  entrevista: 0,
  novedad: 0,
  contacto: 0,
  otro: 0,
};

export const SincronizacionService = {
  async sincronizar(
    usuarioId: number,
    dias = 14,
  ): Promise<ResumenSincronizacion> {
    const [recibidos, enviadosGmail] = await Promise.all([
      GmailService.listarRecibidos(usuarioId, dias, MAX_RESULTADOS, MAX_PAGINAS),
      GmailService.listarEnviados(usuarioId, dias, MAX_RESULTADOS, MAX_PAGINAS),
    ]);

    const mensajes: { id: string; esEnviado: boolean }[] = [];
    const idsVistos = new Set<string>();
    for (const mensaje of recibidos) {
      if (idsVistos.has(mensaje.id)) continue;
      idsVistos.add(mensaje.id);
      mensajes.push({ id: mensaje.id, esEnviado: false });
    }
    for (const mensaje of enviadosGmail) {
      if (idsVistos.has(mensaje.id)) continue;
      idsVistos.add(mensaje.id);
      mensajes.push({ id: mensaje.id, esEnviado: true });
    }

    const [usuario, postulaciones, emailsEnviados, empresasList] =
      await Promise.all([
        UsuarioModel.obtenerPorId(usuarioId),
        PostulacionModel.listar({ usuarioId }),
        EmailModel.listar(),
        EmpresaModel.listar(),
      ]);

    const nombreEmpresa = new Map<number, string>();
    for (const empresa of empresasList) {
      nombreEmpresa.set(empresa.id, empresa.nombre);
    }

    const paraMatcheo = postulaciones.map((postulacion) => ({
      id: postulacion.id,
      puesto: postulacion.puesto,
      empresa_nombre:
        postulacion.empresa_id !== null
          ? nombreEmpresa.get(postulacion.empresa_id) ?? ''
          : '',
    }));

    const enviados = emailsEnviados
      .filter(
        (email): email is EmailRow & { postulacion_id: number } =>
          email.enviado === 1 &&
          Boolean(email.gmail_message_id) &&
          email.postulacion_id !== null,
      )
      .map((email) => ({
        postulacion_id: email.postulacion_id,
        destinatario: email.destinatario,
      }));

    const resultado: ResumenSincronizacion = {
      importados: 0,
      yaExistentes: 0,
      sinMatch: 0,
      estados_actualizados: 0,
      resumen: { ...resumenVacio },
      detalle: [],
    };

    const estadoPorPostulacion = new Map<number, string>();
    for (const postulacion of postulaciones) {
      estadoPorPostulacion.set(postulacion.id, postulacion.estado);
    }

    const emailPropio = usuario?.email ?? '';

    const idsYaImportados = new Set<string>(
      emailsEnviados
        .filter(
          (email): email is EmailRow => Boolean(email.gmail_message_id),
        )
        .map((email) => email.gmail_message_id as string),
    );

    for (const mensaje of mensajes) {
      if (idsYaImportados.has(mensaje.id)) {
        resultado.yaExistentes += 1;
        continue;
      }

      const detalle = await GmailService.obtenerMensaje(usuarioId, mensaje.id);
      const contraparte = mensaje.esEnviado
        ? extraerEmailDireccion(detalle.cabeceras.para)
        : extraerEmailDireccion(detalle.cabeceras.de);

      if (
        !contraparte ||
        contraparte.toLowerCase() === emailPropio.toLowerCase()
      ) {
        resultado.sinMatch += 1;
        continue;
      }

      const tipoRespuesta: TipoRespuesta = mensaje.esEnviado
        ? 'otro'
        : clasificarRespuesta({
            asunto: detalle.cabeceras.asunto,
            remitente: contraparte,
            cuerpo: detalle.cuerpo,
          });

      const postulacionId = matchearPostulacion({
        remitente: contraparte,
        asunto: detalle.cabeceras.asunto,
        postulaciones: paraMatcheo,
        emailsEnviados: enviados,
      });

      const email =
        (mensaje.esEnviado
          ? await EmailService.registrarSalida(usuarioId, {
              postulacionId,
              gmailMessageId: mensaje.id,
              asunto: detalle.cabeceras.asunto,
              destinatario: contraparte,
              contenidoResumen: detalle.cuerpo.slice(0, 4000),
              contenidoHtml:
                detalle.cuerpoHtml || detalle.cuerpo.slice(0, 4000) || null,
              fecha: detalle.fecha ?? new Date().toISOString(),
            })
          : await EmailService.registrarEntrada(usuarioId, {
              postulacionId,
              gmailMessageId: mensaje.id,
              asunto: detalle.cabeceras.asunto,
              remitente: contraparte,
              contenidoResumen: detalle.cuerpo.slice(0, 4000),
              contenidoHtml:
                detalle.cuerpoHtml || detalle.cuerpo.slice(0, 4000) || null,
              fecha: detalle.fecha ?? new Date().toISOString(),
            }));

      if (email === null) {
        resultado.yaExistentes += 1;
        continue;
      }

      await AgendaService.agendarDesdeCorreo(contraparte);

      if (postulacionId === null) {
        resultado.sinMatch += 1;
      }
      resultado.importados += 1;
      if (!mensaje.esEnviado) {
        resultado.resumen[tipoRespuesta] += 1;
      }

      const estadoAnterior = estadoPorPostulacion.get(postulacionId ?? -1) ?? null;
      let estadoNuevo: string | null = null;
      if (
        !mensaje.esEnviado &&
        postulacionId !== null &&
        tipoRespuesta === 'entrevista' &&
        (estadoAnterior === 'pendiente' || estadoAnterior === 'en_proceso')
      ) {
        await PostulacionModel.actualizar(postulacionId, { estado: 'entrevista' });
        estadoNuevo = 'entrevista';
        estadoPorPostulacion.set(postulacionId, 'entrevista');
        resultado.estados_actualizados += 1;
      }

      resultado.detalle.push({
        postulacion_id: postulacionId,
        empresa:
          paraMatcheo.find((p) => p.id === postulacionId)?.empresa_nombre ?? '',
        tipo_respuesta: tipoRespuesta,
        fecha: email.fecha,
        snippet: detalle.snippet,
        estado_anterior: estadoAnterior,
        estado_nuevo: estadoNuevo,
      });

      await esperar(ESPERA_ENTRE_MENSAJES_MS);
    }

    return resultado;
  },
};