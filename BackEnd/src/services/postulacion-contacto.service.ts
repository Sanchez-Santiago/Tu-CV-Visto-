import { ContactoRrhhModel } from '../models/contacto-rrhh.model';
import { PostulacionContactoModel } from '../models/postulacion-contacto.model';
import type { ContactoRrhhRow } from '../types/models';
import { ConflictError, NotFoundError } from '../utils/errors';
import { postulacionDeUsuario } from '../utils/scope';

export const PostulacionContactoService = {
  async asignar(
    usuarioId: number,
    postulacionId: number,
    contactoRrhhId: number,
  ): Promise<ContactoRrhhRow> {
    await postulacionDeUsuario(postulacionId, usuarioId);
    const contacto = await ContactoRrhhModel.obtenerPorIdDeUsuario(
      contactoRrhhId,
      usuarioId,
    );
    if (!contacto) {
      throw new NotFoundError(`Contacto ${contactoRrhhId} no encontrado`);
    }
    if (await PostulacionContactoModel.existe(postulacionId, contactoRrhhId)) {
      throw new ConflictError(
        `La postulación ${postulacionId} ya tiene el contacto ${contactoRrhhId}`,
      );
    }
    await PostulacionContactoModel.asignar(postulacionId, contactoRrhhId);
    return contacto;
  },

  async listarContactos(
    usuarioId: number,
    postulacionId: number,
  ): Promise<ContactoRrhhRow[]> {
    await postulacionDeUsuario(postulacionId, usuarioId);
    return PostulacionContactoModel.listarContactosDePostulacion(
      postulacionId,
    );
  },

  async quitar(
    usuarioId: number,
    postulacionId: number,
    contactoRrhhId: number,
  ): Promise<void> {
    await postulacionDeUsuario(postulacionId, usuarioId);
    const contacto = await ContactoRrhhModel.obtenerPorIdDeUsuario(
      contactoRrhhId,
      usuarioId,
    );
    if (!contacto) {
      throw new NotFoundError(`Contacto ${contactoRrhhId} no encontrado`);
    }
    const quitado = await PostulacionContactoModel.quitar(
      postulacionId,
      contactoRrhhId,
    );
    if (!quitado) {
      throw new NotFoundError(
        `El contacto ${contactoRrhhId} no está asignado a la postulación ${postulacionId}`,
      );
    }
  },
};
