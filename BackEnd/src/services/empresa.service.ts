import { EmpresaModel } from '../models/empresa.model';
import type { EmpresaRow } from '../types/models';
import { ConflictError, NotFoundError } from '../utils/errors';
import type {
  ActualizarEmpresaInput,
  CrearEmpresaInput,
} from '../schemas/empresa';

export const EmpresaService = {
  async crear(usuarioId: number, input: CrearEmpresaInput): Promise<EmpresaRow> {
    if (await EmpresaModel.existeNombre(usuarioId, input.nombre)) {
      throw new ConflictError(`La empresa "${input.nombre}" ya existe`);
    }
    return EmpresaModel.crear(usuarioId, input);
  },

  listar(usuarioId: number, modalidad?: string): Promise<EmpresaRow[]> {
    return EmpresaModel.listar(usuarioId, modalidad);
  },

  async obtenerPorId(usuarioId: number, id: number): Promise<EmpresaRow> {
    const empresa = await EmpresaModel.obtenerPorIdDeUsuario(id, usuarioId);
    if (!empresa) {
      throw new NotFoundError(`Empresa ${id} no encontrada`);
    }
    return empresa;
  },

  async actualizar(
    usuarioId: number,
    id: number,
    input: ActualizarEmpresaInput,
  ): Promise<EmpresaRow> {
    await this.obtenerPorId(usuarioId, id);
    if (
      input.nombre &&
      (await EmpresaModel.existeNombre(usuarioId, input.nombre, id))
    ) {
      throw new ConflictError(`La empresa "${input.nombre}" ya existe`);
    }
    const actualizada = await EmpresaModel.actualizar(id, usuarioId, input);
    if (!actualizada) {
      throw new NotFoundError(`Empresa ${id} no encontrada`);
    }
    return actualizada;
  },

  async eliminar(usuarioId: number, id: number): Promise<void> {
    const eliminada = await EmpresaModel.eliminar(id, usuarioId);
    if (!eliminada) {
      throw new NotFoundError(`Empresa ${id} no encontrada`);
    }
  },
};
