import { env } from '../config/env';
import { EmailModel, type FiltroEmails } from '../models/email.model';
import { EmpresaModel } from '../models/empresa.model';
import { PostulacionModel } from '../models/postulacion.model';
import { SeguimientoModel } from '../models/seguimiento.model';
import { UsuarioModel } from '../models/usuario.model';
import type { EmailRow } from '../types/models';
import { NotFoundError, ValidationError } from '../utils/errors';
import { AgendaService } from './agenda.service';
import { GmailService } from './gmail.service';
import { PlantillaService } from './plantilla.service';
import type {
  ActualizarEmailInput,
  CrearEmailInput,
} from '../schemas/email';
import type { EnviarGmailInput } from '../schemas/gmail';

function hoyDia(): string {
  return new Date().toISOString().slice(0, 10);
}

function sumarDias(fecha: string, dias: number): string {
  const d = new Date(`${fecha}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

async function proximaContactoPara(postulacionId: number): Promise<string> {
  const postulacion = await PostulacionModel.obtenerPorId(postulacionId);
  if (!postulacion) {
    throw new NotFoundError(`Postulación ${postulacionId} no encontrada`);
  }
  const empresa =
    postulacion.empresa_id !== null
      ? await EmpresaModel.obtenerPorId(postulacion.empresa_id)
      : null;
  const cadencia = empresa?.cadencia_contacto ?? env.CADENCIA_CONTACTO_DIAS;
  return sumarDias(hoyDia(), cadencia);
}

export const EmailService = {
  async crear(input: CrearEmailInput): Promise<EmailRow> {
    if (input.postulacion_id === null) {
      throw new ValidationError('postulacion_id es obligatorio al crear un email');
    }
    const postulacion = await PostulacionModel.obtenerPorId(input.postulacion_id);
    if (!postulacion) {
      throw new NotFoundError(
        `Postulación ${input.postulacion_id} no encontrada`,
      );
    }

    const email = await EmailModel.crear(input);
    if (input.enviado === 1) {
      const proximaContacto = await proximaContactoPara(input.postulacion_id);
      await PostulacionModel.incrementarMails(
        input.postulacion_id,
        email.fecha,
        proximaContacto,
      );
    }
    return email;
  },

  listar(filtros: FiltroEmails = {}): Promise<EmailRow[]> {
    return EmailModel.listar(filtros);
  },

  async registrarEntrada(
    usuarioId: number,
    input: {
      postulacionId: number | null;
      gmailMessageId: string;
      asunto: string | null;
      remitente: string;
      contenidoResumen: string;
      contenidoHtml: string | null;
      fecha: string;
    },
  ): Promise<EmailRow | null> {
    if (input.postulacionId !== null) {
      const postulacion = await PostulacionModel.obtenerPorId(
        input.postulacionId,
      );
      if (!postulacion || postulacion.usuario_id !== usuarioId) {
        throw new NotFoundError(
          `Postulación ${input.postulacionId} no encontrada`,
        );
      }
    }

    const existente = await EmailModel.obtenerPorGmailMessageId(
      input.gmailMessageId,
    );
    if (existente) {
      return null;
    }

    const usuario = await UsuarioModel.obtenerPorId(usuarioId);
    if (!usuario) {
      throw new NotFoundError(`Usuario ${usuarioId} no encontrado`);
    }

    const email = await EmailModel.crear({
      postulacion_id: input.postulacionId,
      gmail_message_id: input.gmailMessageId,
      tipo: 'respuesta',
      asunto: input.asunto ?? undefined,
      remitente: input.remitente,
      destinatario: usuario.email,
      fecha: input.fecha,
      enviado: 0,
      contenido_resumen: input.contenidoResumen,
      cuerpo_html: input.contenidoHtml ?? undefined,
    });

    if (input.postulacionId !== null) {
      await PostulacionModel.actualizar(input.postulacionId, { respondio: 1 });
    }

    return email;
  },

  async registrarSalida(
    usuarioId: number,
    input: {
      postulacionId: number | null;
      gmailMessageId: string;
      asunto: string | null;
      destinatario: string;
      contenidoResumen: string;
      contenidoHtml: string | null;
      fecha: string;
    },
  ): Promise<EmailRow | null> {
    if (input.postulacionId !== null) {
      const postulacion = await PostulacionModel.obtenerPorId(
        input.postulacionId,
      );
      if (!postulacion || postulacion.usuario_id !== usuarioId) {
        throw new NotFoundError(
          `Postulación ${input.postulacionId} no encontrada`,
        );
      }
    }

    const existente = await EmailModel.obtenerPorGmailMessageId(
      input.gmailMessageId,
    );
    if (existente) {
      return null;
    }

    const usuario = await UsuarioModel.obtenerPorId(usuarioId);
    if (!usuario) {
      throw new NotFoundError(`Usuario ${usuarioId} no encontrado`);
    }

    const email = await EmailModel.crear({
      postulacion_id: input.postulacionId,
      gmail_message_id: input.gmailMessageId,
      tipo: input.postulacionId !== null ? 'postulacion' : 'seguimiento',
      asunto: input.asunto ?? undefined,
      remitente: usuario.email,
      destinatario: input.destinatario,
      fecha: input.fecha,
      enviado: 1,
      contenido_resumen: input.contenidoResumen,
      cuerpo_html: input.contenidoHtml ?? undefined,
    });

    return email;
  },

  async obtenerPorId(id: number): Promise<EmailRow> {
    const email = await EmailModel.obtenerPorId(id);
    if (!email) {
      throw new NotFoundError(`Email ${id} no encontrado`);
    }
    return email;
  },

  async listarDePostulacion(postulacionId: number): Promise<EmailRow[]> {
    const postulacion = await PostulacionModel.obtenerPorId(postulacionId);
    if (!postulacion) {
      throw new NotFoundError(`Postulación ${postulacionId} no encontrada`);
    }
    return EmailModel.listar({ postulacionId });
  },

  async actualizar(
    id: number,
    input: ActualizarEmailInput,
  ): Promise<EmailRow> {
    const actual = await this.obtenerPorId(id);

    if (
      input.postulacion_id !== undefined &&
      input.postulacion_id !== actual.postulacion_id &&
      input.postulacion_id !== null
    ) {
      const postulacion = await PostulacionModel.obtenerPorId(
        input.postulacion_id,
      );
      if (!postulacion) {
        throw new NotFoundError(
          `Postulación ${input.postulacion_id} no encontrada`,
        );
      }
    }

    const actualizado = await EmailModel.actualizar(id, input);
    if (!actualizado) {
      throw new NotFoundError(`Email ${id} no encontrado`);
    }

    const nuevoEnviado = input.enviado ?? actual.enviado;
    if (
      actualizado.postulacion_id !== null &&
      actual.enviado === 0 &&
      nuevoEnviado === 1
    ) {
      const proximaContacto = await proximaContactoPara(
        actualizado.postulacion_id,
      );
      await PostulacionModel.incrementarMails(
        actualizado.postulacion_id,
        actualizado.fecha,
        proximaContacto,
      );
    } else if (
      actual.enviado === 1 &&
      nuevoEnviado === 0 &&
      actualizado.postulacion_id !== null
    ) {
      await PostulacionModel.decrementarMails(actualizado.postulacion_id);
    }

    return actualizado;
  },

  async enviarYRegistrar(
    usuarioId: number,
    input: EnviarGmailInput,
  ): Promise<EmailRow> {
    const postulacionId = input.postulacion_id ?? null;

    const postulacion =
      postulacionId !== null
        ? await PostulacionModel.obtenerPorId(postulacionId)
        : null;
    if (postulacionId !== null && !postulacion) {
      throw new NotFoundError(
        `Postulación ${postulacionId} no encontrada`,
      );
    }

    const usuario = await UsuarioModel.obtenerPorId(usuarioId);
    if (!usuario) {
      throw new NotFoundError(`Usuario ${usuarioId} no encontrado`);
    }

    const tipoSeguimiento = input.tipo_seguimiento ?? null;
    let asunto = input.asunto;
    let cuerpo = input.cuerpo;
    if (!asunto || !cuerpo) {
      if (postulacionId === null) {
        throw new ValidationError(
          'asunto y cuerpo son obligatorios para un envío sin postulación vinculada',
        );
      }
      const plantilla = await PlantillaService.generar({
        tipo: tipoSeguimiento ?? 'novedad',
        usuarioId,
        postulacionId,
      });
      asunto = asunto ?? plantilla.asunto;
      cuerpo = cuerpo ?? plantilla.cuerpo;
    }

    const enviado = await GmailService.enviar(usuarioId, {
      destinatario: input.destinatario,
      asunto: asunto,
      cuerpo: cuerpo,
      ...(input.cc ? { cc: input.cc } : {}),
      ...(input.adjuntos?.length
        ? {
            adjuntos: input.adjuntos.map((a) => ({
              nombre: a.nombre,
              mimeType: a.mime_type,
              contenidoBase64: a.contenido_base64,
            })),
          }
        : {}),
    });

    const fechaEnvio = new Date().toISOString();
    const email = await EmailModel.crear({
      postulacion_id: postulacionId,
      gmail_message_id: enviado.gmailMessageId,
      tipo: input.tipo,
      tipo_seguimiento: tipoSeguimiento ?? undefined,
      asunto: asunto,
      remitente: usuario.email,
      destinatario: input.destinatario,
      fecha: fechaEnvio,
      enviado: 1,
      contenido_resumen: enviado.snippet,
      cuerpo_html: cuerpo,
    });

    await AgendaService.agendarDesdeCorreo(input.destinatario);

    if (postulacionId !== null && postulacion) {
      const empresa =
        postulacion.empresa_id !== null
          ? await EmpresaModel.obtenerPorId(postulacion.empresa_id)
          : null;
      const cadencia = empresa?.cadencia_contacto ?? env.CADENCIA_CONTACTO_DIAS;
      const proximaContacto = sumarDias(fechaEnvio.slice(0, 10), cadencia);

      await PostulacionModel.incrementarMails(
        postulacionId,
        fechaEnvio,
        proximaContacto,
      );

      if (input.crear_seguimiento === true) {
        await SeguimientoModel.crear({
          postulacion_id: postulacionId,
          fecha_programada: input.fecha_programada ?? hoyDia(),
          tipo_seguimiento: tipoSeguimiento ?? 'consulta',
          enviado: 1,
          requiere_aprobacion: 0,
          fecha_envio: hoyDia(),
        });
      }
    }
    return email;
  },

  async eliminar(id: number): Promise<void> {
    const email = await this.obtenerPorId(id);
    if (email.enviado === 1 && email.postulacion_id !== null) {
      await PostulacionModel.decrementarMails(email.postulacion_id);
    }
    const eliminado = await EmailModel.eliminar(id);
    if (!eliminado) {
      throw new NotFoundError(`Email ${id} no encontrado`);
    }
  },
};