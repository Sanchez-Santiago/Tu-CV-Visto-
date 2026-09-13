import { CategoriaModel } from '../models/categoria.model';
import type { CategoriaRow } from '../types/models';
import { ConflictError, NotFoundError } from '../utils/errors';
import type {
  ActualizarCategoriaInput,
  CrearCategoriaInput,
} from '../schemas/categoria';

export const CategoriaService = {
  async crear(input: CrearCategoriaInput): Promise<CategoriaRow> {
    if (await CategoriaModel.existeNombre(input.nombre)) {
      throw new ConflictError(`La categoría "${input.nombre}" ya existe`);
    }
    return CategoriaModel.crear(input);
  },

  listar(): Promise<CategoriaRow[]> {
    return CategoriaModel.listar();
  },

  async obtenerPorId(id: number): Promise<CategoriaRow> {
    const categoria = await CategoriaModel.obtenerPorId(id);
    if (!categoria) {
      throw new NotFoundError(`Categoría ${id} no encontrada`);
    }
    return categoria;
  },

  async actualizar(
    id: number,
    input: ActualizarCategoriaInput,
  ): Promise<CategoriaRow> {
    await this.obtenerPorId(id);
    if (input.nombre && (await CategoriaModel.existeNombre(input.nombre, id))) {
      throw new ConflictError(`La categoría "${input.nombre}" ya existe`);
    }
    const actualizada = await CategoriaModel.actualizar(id, input);
    if (!actualizada) {
      throw new NotFoundError(`Categoría ${id} no encontrada`);
    }
    return actualizada;
  },

  async eliminar(id: number): Promise<void> {
    const eliminada = await CategoriaModel.eliminar(id);
    if (!eliminada) {
      throw new NotFoundError(`Categoría ${id} no encontrada`);
    }
  },
};