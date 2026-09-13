import { ContactoRrhhModel } from '../models/contacto-rrhh.model';
import { PostulacionContactoModel } from '../models/postulacion-contacto.model';
import { PostulacionModel } from '../models/postulacion.model';
import type { ContactoRrhhRow } from '../types/models';
import { ConflictError, NotFoundError } from '../utils/errors';

export const PostulacionContactoService = {
  async asignar(
    postulacionId: number,
    contactoRrhhId: number,
  ): Promise<ContactoRrhhRow> {
    const postulacion = await PostulacionModel.obtenerPorId(postulacionId);
    if (!postulacion) {
      throw new NotFoundError(`Postulación ${postulacionId} no encontrada`);
    }
    const contacto = await ContactoRrhhModel.obtenerPorId(contactoRrhhId);
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
    postulacionId: number,
  ): Promise<ContactoRrhhRow[]> {
    const postulacion = await PostulacionModel.obtenerPorId(postulacionId);
    if (!postulacion) {
      throw new NotFoundError(`Postulación ${postulacionId} no encontrada`);
    }
    return PostulacionContactoModel.listarContactosDePostulacion(
      postulacionId,
    );
  },

  async quitar(postulacionId: number, contactoRrhhId: number): Promise<void> {
    const contacto = await ContactoRrhhModel.obtenerPorId(contactoRrhhId);
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