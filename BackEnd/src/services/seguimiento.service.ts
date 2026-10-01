import {
  SeguimientoModel,
  type FiltroSeguimientos,
} from '../models/seguimiento.model';
import type { SeguimientoRow } from '../types/models';
import { NotFoundError } from '../utils/errors';
import { postulacionDeUsuario } from '../utils/scope';
import type {
  ActualizarSeguimientoInput,
  CrearSeguimientoInput,
} from '../schemas/seguimiento';

function hoy(): string {
  return new Date().toISOString().slice(0, 10);
}

export const SeguimientoService = {
  async crear(
    usuarioId: number,
    input: CrearSeguimientoInput,
  ): Promise<SeguimientoRow> {
    await postulacionDeUsuario(input.postulacion_id, usuarioId);
    return SeguimientoModel.crear(usuarioId, input);
  },

  listar(
    usuarioId: number,
    filtros: Omit<FiltroSeguimientos, 'usuarioId'> = {},
  ): Promise<SeguimientoRow[]> {
    return SeguimientoModel.listar({ usuarioId, ...filtros });
  },

  listarPendientes(usuarioId: number): Promise<SeguimientoRow[]> {
    return SeguimientoModel.listar({ usuarioId, soloPendientes: true });
  },

  async obtenerPorId(usuarioId: number, id: number): Promise<SeguimientoRow> {
    const seguimiento = await SeguimientoModel.obtenerPorId(id);
    if (!seguimiento) {
      throw new NotFoundError(`Seguimiento ${id} no encontrado`);
    }
    await postulacionDeUsuario(seguimiento.postulacion_id, usuarioId);
    return seguimiento;
  },

  async listarDePostulacion(
    usuarioId: number,
    postulacionId: number,
  ): Promise<SeguimientoRow[]> {
    await postulacionDeUsuario(postulacionId, usuarioId);
    return SeguimientoModel.listar({ usuarioId, postulacionId });
  },

  async actualizar(
    usuarioId: number,
    id: number,
    input: ActualizarSeguimientoInput,
  ): Promise<SeguimientoRow> {
    const actual = await this.obtenerPorId(usuarioId, id);

    if (
      input.postulacion_id !== undefined &&
      input.postulacion_id !== actual.postulacion_id
    ) {
      await postulacionDeUsuario(input.postulacion_id, usuarioId);
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

    const actualizado = await SeguimientoModel.actualizar(id, usuarioId, datos);
    if (!actualizado) {
      throw new NotFoundError(`Seguimiento ${id} no encontrado`);
    }
    return actualizado;
  },

  async eliminar(usuarioId: number, id: number): Promise<void> {
    await this.obtenerPorId(usuarioId, id);
    const eliminado = await SeguimientoModel.eliminar(id, usuarioId);
    if (!eliminado) {
      throw new NotFoundError(`Seguimiento ${id} no encontrado`);
    }
  },
};
