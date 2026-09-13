import { ProyectoModel } from '../models/proyecto.model';
import type {
  ActualizarProyectoInput,
  CrearProyectoMeInput,
} from '../schemas/proyecto';
import type { ProyectoRow } from '../types/models';
import { NotFoundError } from '../utils/errors';

export const ProyectoService = {
  async listar(usuarioId: number): Promise<ProyectoRow[]> {
    return ProyectoModel.listarPorUsuario(usuarioId);
  },

  async crear(
    usuarioId: number,
    input: CrearProyectoMeInput,
  ): Promise<ProyectoRow> {
    return ProyectoModel.crear({ usuario_id: usuarioId, ...input });
  },

  async actualizar(
    usuarioId: number,
    id: number,
    input: ActualizarProyectoInput,
  ): Promise<ProyectoRow> {
    const actual = await ProyectoModel.obtenerPorId(id);
    if (!actual || actual.usuario_id !== usuarioId) {
      throw new NotFoundError(`Proyecto ${id} no encontrado`);
    }
    const actualizado = await ProyectoModel.actualizar(id, input);
    if (!actualizado) {
      throw new NotFoundError(`Proyecto ${id} no encontrado`);
    }
    return actualizado;
  },

  async eliminar(usuarioId: number, id: number): Promise<void> {
    const actual = await ProyectoModel.obtenerPorId(id);
    if (!actual || actual.usuario_id !== usuarioId) {
      throw new NotFoundError(`Proyecto ${id} no encontrado`);
    }
    const eliminado = await ProyectoModel.eliminar(id);
    if (!eliminado) {
      throw new NotFoundError(`Proyecto ${id} no encontrado`);
    }
  },
};