import { UsuarioModel } from '../models/usuario.model';
import type { ActualizarUsuarioInput } from '../schemas/usuario';
import type { UsuarioRow } from '../types/models';
import { NotFoundError } from '../utils/errors';

export const UsuarioService = {
  async actualizar(
    id: number,
    input: ActualizarUsuarioInput,
  ): Promise<UsuarioRow> {
    const actualizado = await UsuarioModel.actualizar(id, input);
    if (!actualizado) {
      throw new NotFoundError(`Usuario ${id} no encontrado`);
    }
    return actualizado;
  },
};