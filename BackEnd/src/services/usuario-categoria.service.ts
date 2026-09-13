import { CategoriaModel } from '../models/categoria.model';
import { UsuarioCategoriaModel } from '../models/usuario-categoria.model';
import { UsuarioModel } from '../models/usuario.model';
import type { CategoriaRow } from '../types/models';
import { ConflictError, NotFoundError } from '../utils/errors';

export const UsuarioCategoriaService = {
  async asignar(
    usuarioId: number,
    categoriaId: number,
  ): Promise<CategoriaRow> {
    const usuario = await UsuarioModel.obtenerPorId(usuarioId);
    if (!usuario) {
      throw new NotFoundError(`Usuario ${usuarioId} no encontrado`);
    }
    const categoria = await CategoriaModel.obtenerPorId(categoriaId);
    if (!categoria) {
      throw new NotFoundError(`Categoría ${categoriaId} no encontrada`);
    }
    if (await UsuarioCategoriaModel.existe(usuarioId, categoriaId)) {
      throw new ConflictError(
        `El usuario ${usuarioId} ya tiene la categoría ${categoriaId}`,
      );
    }
    await UsuarioCategoriaModel.asignar(usuarioId, categoriaId);
    return categoria;
  },

  async listarCategoriasDeUsuario(
    usuarioId: number,
  ): Promise<CategoriaRow[]> {
    const usuario = await UsuarioModel.obtenerPorId(usuarioId);
    if (!usuario) {
      throw new NotFoundError(`Usuario ${usuarioId} no encontrado`);
    }
    return UsuarioCategoriaModel.listarCategoriasDeUsuario(usuarioId);
  },

  async quitar(usuarioId: number, categoriaId: number): Promise<void> {
    const categoria = await CategoriaModel.obtenerPorId(categoriaId);
    if (!categoria) {
      throw new NotFoundError(`Categoría ${categoriaId} no encontrada`);
    }
    const quitada = await UsuarioCategoriaModel.quitar(usuarioId, categoriaId);
    if (!quitada) {
      throw new NotFoundError(
        `La categoría ${categoriaId} no está asignada al usuario ${usuarioId}`,
      );
    }
  },
};