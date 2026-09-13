import { EmpresaModel } from '../models/empresa.model';
import { ContactoRrhhModel } from '../models/contacto-rrhh.model';
import type { ContactoRrhhRow } from '../types/models';
import { ConflictError, NotFoundError } from '../utils/errors';
import type {
  ActualizarContactoRrhhInput,
  CrearContactoRrhhInput,
} from '../schemas/contacto-rrhh';

function esErrorConstraintUnico(error: unknown): boolean {
  return (
    error instanceof Error &&
    /UNIQUE constraint failed/i.test(error.message)
  );
}

export const ContactoRrhhService = {
  async crear(input: CrearContactoRrhhInput): Promise<ContactoRrhhRow> {
    const empresa = await EmpresaModel.obtenerPorId(input.empresa_id);
    if (!empresa) {
      throw new NotFoundError(`Empresa ${input.empresa_id} no encontrada`);
    }
    if (
      await ContactoRrhhModel.existeEmailEnEmpresa(
        input.email,
        input.empresa_id,
      )
    ) {
      throw new ConflictError(
        `Ya existe un contacto con el email "${input.email}" en esa empresa`,
      );
    }
    try {
      return await ContactoRrhhModel.crear(input);
    } catch (error) {
      if (esErrorConstraintUnico(error)) {
        throw new ConflictError(
          `Ya existe un contacto con el email "${input.email}" en esa empresa`,
        );
      }
      throw error;
    }
  },

  async obtenerPorId(id: number): Promise<ContactoRrhhRow> {
    const contacto = await ContactoRrhhModel.obtenerPorId(id);
    if (!contacto) {
      throw new NotFoundError(`Contacto ${id} no encontrado`);
    }
    return contacto;
  },

  async listar(empresaId?: number): Promise<ContactoRrhhRow[]> {
    if (empresaId !== undefined) {
      const empresa = await EmpresaModel.obtenerPorId(empresaId);
      if (!empresa) {
        throw new NotFoundError(`Empresa ${empresaId} no encontrada`);
      }
    }
    return ContactoRrhhModel.listar(empresaId);
  },

  async listarPorEmpresa(empresaId: number): Promise<ContactoRrhhRow[]> {
    const empresa = await EmpresaModel.obtenerPorId(empresaId);
    if (!empresa) {
      throw new NotFoundError(`Empresa ${empresaId} no encontrada`);
    }
    return ContactoRrhhModel.listarPorEmpresa(empresaId);
  },

  async actualizar(
    id: number,
    input: ActualizarContactoRrhhInput,
  ): Promise<ContactoRrhhRow> {
    const actual = await this.obtenerPorId(id);

    const empresaId = input.empresa_id ?? actual.empresa_id;
    const empresa = await EmpresaModel.obtenerPorId(empresaId);
    if (!empresa) {
      throw new NotFoundError(`Empresa ${empresaId} no encontrada`);
    }

    if (
      input.email &&
      (await ContactoRrhhModel.existeEmailEnEmpresa(input.email, empresaId, id))
    ) {
      throw new ConflictError(
        `Ya existe un contacto con el email "${input.email}" en esa empresa`,
      );
    }

    try {
      const actualizado = await ContactoRrhhModel.actualizar(id, input);
      if (!actualizado) {
        throw new NotFoundError(`Contacto ${id} no encontrado`);
      }
      return actualizado;
    } catch (error) {
      if (esErrorConstraintUnico(error)) {
        throw new ConflictError(
          `Ya existe un contacto con el email "${input.email}" en esa empresa`,
        );
      }
      throw error;
    }
  },

  async eliminar(id: number): Promise<void> {
    const eliminado = await ContactoRrhhModel.eliminar(id);
    if (!eliminado) {
      throw new NotFoundError(`Contacto ${id} no encontrado`);
    }
  },
};