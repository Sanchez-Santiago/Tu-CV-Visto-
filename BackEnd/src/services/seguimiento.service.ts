import { PostulacionModel } from '../models/postulacion.model';
import {
  SeguimientoModel,
  type FiltroSeguimientos,
} from '../models/seguimiento.model';
import type { SeguimientoRow } from '../types/models';
import { NotFoundError } from '../utils/errors';
import type {
  ActualizarSeguimientoInput,
  CrearSeguimientoInput,
} from '../schemas/seguimiento';

function hoy(): string {
  return new Date().toISOString().slice(0, 10);
}

export const SeguimientoService = {
  async crear(input: CrearSeguimientoInput): Promise<SeguimientoRow> {
    const postulacion = await PostulacionModel.obtenerPorId(
      input.postulacion_id,
    );
    if (!postulacion) {
      throw new NotFoundError(
        `Postulación ${input.postulacion_id} no encontrada`,
      );
    }
    return SeguimientoModel.crear(input);
  },

  listar(filtros: FiltroSeguimientos = {}): Promise<SeguimientoRow[]> {
    return SeguimientoModel.listar(filtros);
  },

  async listarPendientes(): Promise<SeguimientoRow[]> {
    return SeguimientoModel.listar({ soloPendientes: true });
  },

  async obtenerPorId(id: number): Promise<SeguimientoRow> {
    const seguimiento = await SeguimientoModel.obtenerPorId(id);
    if (!seguimiento) {
      throw new NotFoundError(`Seguimiento ${id} no encontrado`);
    }
    return seguimiento;
  },

  async listarDePostulacion(
    postulacionId: number,
  ): Promise<SeguimientoRow[]> {
    const postulacion = await PostulacionModel.obtenerPorId(postulacionId);
    if (!postulacion) {
      throw new NotFoundError(`Postulación ${postulacionId} no encontrada`);
    }
    return SeguimientoModel.listar({ postulacionId });
  },

  async actualizar(
    id: number,
    input: ActualizarSeguimientoInput,
  ): Promise<SeguimientoRow> {
    const actual = await this.obtenerPorId(id);

    if (
      input.postulacion_id !== undefined &&
      input.postulacion_id !== actual.postulacion_id
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

    // Al marcar como enviado se asigna la fecha de envío si aún no tiene una.
    const enviado = input.enviado ?? actual.enviado;
    let datos: ActualizarSeguimientoInput = { ...input };
    if (
      enviado === 1 &&
      actual.fecha_envio === null &&
      input.fecha_envio === undefined
    ) {
      datos = { ...datos, fecha_envio: hoy() };
    }

    const actualizado = await SeguimientoModel.actualizar(id, datos);
    if (!actualizado) {
      throw new NotFoundError(`Seguimiento ${id} no encontrado`);
    }
    return actualizado;
  },

  async eliminar(id: number): Promise<void> {
    await this.obtenerPorId(id);
    const eliminado = await SeguimientoModel.eliminar(id);
    if (!eliminado) {
      throw new NotFoundError(`Seguimiento ${id} no encontrado`);
    }
  },
};