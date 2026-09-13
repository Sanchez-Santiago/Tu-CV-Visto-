import { ExperienciaModel } from '../models/experiencia.model';
import type {
  ActualizarExperienciaInput,
  CrearExperienciaMeInput,
} from '../schemas/experiencia';
import type { ExperienciaRow } from '../types/models';
import { NotFoundError } from '../utils/errors';

export const ExperienciaService = {
  async listar(usuarioId: number): Promise<ExperienciaRow[]> {
    return ExperienciaModel.listarPorUsuario(usuarioId);
  },

  async crear(
    usuarioId: number,
    input: CrearExperienciaMeInput,
  ): Promise<ExperienciaRow> {
    return ExperienciaModel.crear({ usuario_id: usuarioId, ...input });
  },

  async actualizar(
    usuarioId: number,
    id: number,
    input: ActualizarExperienciaInput,
  ): Promise<ExperienciaRow> {
    const actual = await ExperienciaModel.obtenerPorId(id);
    if (!actual || actual.usuario_id !== usuarioId) {
      throw new NotFoundError(`Experiencia ${id} no encontrada`);
    }
    const actualizada = await ExperienciaModel.actualizar(id, input);
    if (!actualizada) {
      throw new NotFoundError(`Experiencia ${id} no encontrada`);
    }
    return actualizada;
  },

  async eliminar(usuarioId: number, id: number): Promise<void> {
    const actual = await ExperienciaModel.obtenerPorId(id);
    if (!actual || actual.usuario_id !== usuarioId) {
      throw new NotFoundError(`Experiencia ${id} no encontrada`);
    }
    const eliminada = await ExperienciaModel.eliminar(id);
    if (!eliminada) {
      throw new NotFoundError(`Experiencia ${id} no encontrada`);
    }
  },
};