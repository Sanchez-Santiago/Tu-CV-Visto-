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
  async crear(
    usuarioId: number,
    input: CrearContactoRrhhInput,
  ): Promise<ContactoRrhhRow> {
    await exigirEmpresaDeUsuario(input.empresa_id, usuarioId);
    if (
      await ContactoRrhhModel.existeEmailEnEmpresa(
        usuarioId,
        input.email,
        input.empresa_id,
      )
    ) {
      throw new ConflictError(
        `Ya existe un contacto con el email "${input.email}" en esa empresa`,
      );
    }
    try {
      return await ContactoRrhhModel.crear(usuarioId, input);
    } catch (error) {
      if (esErrorConstraintUnico(error)) {
        throw new ConflictError(
          `Ya existe un contacto con el email "${input.email}" en esa empresa`,
        );
      }
      throw error;
    }
  },

  async obtenerPorId(usuarioId: number, id: number): Promise<ContactoRrhhRow> {
    const contacto = await ContactoRrhhModel.obtenerPorIdDeUsuario(id, usuarioId);
    if (!contacto) {
      throw new NotFoundError(`Contacto ${id} no encontrado`);
    }
    return contacto;
  },

  async listar(usuarioId: number, empresaId?: number): Promise<ContactoRrhhRow[]> {
    if (empresaId !== undefined) {
      await exigirEmpresaDeUsuario(empresaId, usuarioId);
    }
    return ContactoRrhhModel.listar(usuarioId, empresaId);
  },

  async listarPorEmpresa(
    usuarioId: number,
    empresaId: number,
  ): Promise<ContactoRrhhRow[]> {
    await exigirEmpresaDeUsuario(empresaId, usuarioId);
    return ContactoRrhhModel.listarPorEmpresa(usuarioId, empresaId);
  },

  async actualizar(
    usuarioId: number,
    id: number,
    input: ActualizarContactoRrhhInput,
  ): Promise<ContactoRrhhRow> {
    const actual = await this.obtenerPorId(usuarioId, id);

    const empresaId = input.empresa_id ?? actual.empresa_id;
    await exigirEmpresaDeUsuario(empresaId, usuarioId);

    if (
      input.email &&
      (await ContactoRrhhModel.existeEmailEnEmpresa(
        usuarioId,
        input.email,
        empresaId,
        id,
      ))
    ) {
      throw new ConflictError(
        `Ya existe un contacto con el email "${input.email}" en esa empresa`,
      );
    }

    try {
      const actualizado = await ContactoRrhhModel.actualizar(
        id,
        usuarioId,
        input,
      );
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

  async eliminar(usuarioId: number, id: number): Promise<void> {
    const eliminado = await ContactoRrhhModel.eliminar(id, usuarioId);
    if (!eliminado) {
      throw new NotFoundError(`Contacto ${id} no encontrado`);
    }
  },
};

async function exigirEmpresaDeUsuario(
  empresaId: number,
  usuarioId: number,
): Promise<void> {
  const empresa = await EmpresaModel.obtenerPorIdDeUsuario(empresaId, usuarioId);
  if (!empresa) {
    throw new NotFoundError(`Empresa ${empresaId} no encontrada`);
  }
}
