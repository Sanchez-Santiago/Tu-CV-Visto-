import { FirmaModel } from '../models/firma.model';
import type {
  ActualizarFirmaInput,
  CrearFirmaMeInput,
} from '../schemas/firma';
import type { FirmaRow } from '../types/models';
import { NotFoundError, ValidationError } from '../utils/errors';

export const FirmaService = {
  async listar(usuarioId: number): Promise<FirmaRow[]> {
    return FirmaModel.listarPorUsuario(usuarioId);
  },

  async crear(
    usuarioId: number,
    input: CrearFirmaMeInput,
  ): Promise<FirmaRow> {
    return FirmaModel.crear({ usuario_id: usuarioId, ...input });
  },

  async actualizar(
    usuarioId: number,
    id: number,
    input: ActualizarFirmaInput,
  ): Promise<FirmaRow> {
    const actual = await FirmaModel.obtenerPorId(id);
    if (!actual || actual.usuario_id !== usuarioId) {
      throw new NotFoundError(`Firma ${id} no encontrada`);
    }
    const actualizada = await FirmaModel.actualizar(id, input);
    if (!actualizada) {
      throw new NotFoundError(`Firma ${id} no encontrada`);
    }
    return actualizada;
  },

  async eliminar(usuarioId: number, id: number): Promise<void> {
    const actual = await FirmaModel.obtenerPorId(id);
    if (!actual || actual.usuario_id !== usuarioId) {
      throw new NotFoundError(`Firma ${id} no encontrada`);
    }
    const eliminada = await FirmaModel.eliminar(id);
    if (!eliminada) {
      throw new NotFoundError(`Firma ${id} no encontrada`);
    }
  },

  async obtenerParaEnvio(
    usuarioId: number,
    ids: number[],
  ): Promise<FirmaRow[]> {
    const firmas = await FirmaModel.listarPorUsuario(usuarioId);
    const porId = new Map(firmas.map((f) => [f.id, f]));
    const seleccionadas = ids.map((id) => porId.get(id));
    if (seleccionadas.some((f) => !f)) {
      throw new ValidationError('una o más firmas no pertenecen a este usuario');
    }
    return seleccionadas as FirmaRow[];
  },
};