import { EmpresaModel } from '../models/empresa.model';
import type { EmpresaRow } from '../types/models';
import { ConflictError, NotFoundError } from '../utils/errors';
import type {
  ActualizarEmpresaInput,
  CrearEmpresaInput,
} from '../schemas/empresa';

export const EmpresaService = {
  async crear(input: CrearEmpresaInput): Promise<EmpresaRow> {
    if (await EmpresaModel.existeNombre(input.nombre)) {
      throw new ConflictError(`La empresa "${input.nombre}" ya existe`);
    }
    return EmpresaModel.crear(input);
  },

  listar(modalidad?: string): Promise<EmpresaRow[]> {
    return EmpresaModel.listar(modalidad);
  },

  async obtenerPorId(id: number): Promise<EmpresaRow> {
    const empresa = await EmpresaModel.obtenerPorId(id);
    if (!empresa) {
      throw new NotFoundError(`Empresa ${id} no encontrada`);
    }
    return empresa;
  },

  async actualizar(
    id: number,
    input: ActualizarEmpresaInput,
  ): Promise<EmpresaRow> {
    await this.obtenerPorId(id);
    if (input.nombre && (await EmpresaModel.existeNombre(input.nombre, id))) {
      throw new ConflictError(`La empresa "${input.nombre}" ya existe`);
    }
    const actualizada = await EmpresaModel.actualizar(id, input);
    if (!actualizada) {
      throw new NotFoundError(`Empresa ${id} no encontrada`);
    }
    return actualizada;
  },

  async eliminar(id: number): Promise<void> {
    const eliminada = await EmpresaModel.eliminar(id);
    if (!eliminada) {
      throw new NotFoundError(`Empresa ${id} no encontrada`);
    }
  },
};