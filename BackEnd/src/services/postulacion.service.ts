import { EmailModel } from '../models/email.model';
import { EmpresaModel } from '../models/empresa.model';
import { PostulacionModel, type FiltroPostulaciones } from '../models/postulacion.model';
import { SeguimientoModel } from '../models/seguimiento.model';
import type { PostulacionRow } from '../types/models';
import { NotFoundError } from '../utils/errors';
import { postulacionDeUsuario } from '../utils/scope';
import type {
  ActualizarPostulacionInput,
  CrearPostulacionInput,
} from '../schemas/postulacion';

export const PostulacionService = {
  /**
   * El usuario sale de la sesión: antes `usuario_id` venía en el body y
   * cualquiera podía crear o mover postulaciones en la cuenta de otro.
   */
  async crear(
    usuarioId: number,
    input: CrearPostulacionInput,
  ): Promise<PostulacionRow> {
    await verificarEmpresaDeUsuario(input.empresa_id, usuarioId);
    return PostulacionModel.crear(usuarioId, input);
  },

  listar(
    usuarioId: number,
    filtros: Omit<FiltroPostulaciones, 'usuarioId'> = {},
  ): Promise<PostulacionRow[]> {
    return PostulacionModel.listar({ usuarioId, ...filtros });
  },

  obtenerPorId(usuarioId: number, id: number): Promise<PostulacionRow> {
    return postulacionDeUsuario(id, usuarioId);
  },

  async actualizar(
    usuarioId: number,
    id: number,
    input: ActualizarPostulacionInput,
  ): Promise<PostulacionRow> {
    const actual = await postulacionDeUsuario(id, usuarioId);

    if (
      input.empresa_id !== undefined &&
      input.empresa_id !== actual.empresa_id
    ) {
      await verificarEmpresaDeUsuario(input.empresa_id, usuarioId);
    }

    const actualizada = await PostulacionModel.actualizar(id, usuarioId, input);
    if (!actualizada) {
      throw new NotFoundError(`Postulación ${id} no encontrada`);
    }
    return actualizada;
  },

  async eliminar(usuarioId: number, id: number): Promise<void> {
    await postulacionDeUsuario(id, usuarioId);
    const eliminada = await PostulacionModel.eliminar(id, usuarioId);
    if (!eliminada) {
      throw new NotFoundError(`Postulación ${id} no encontrada`);
    }
  },

  async obtenerRelacion(
    usuarioId: number,
    id: number,
  ): Promise<{
    postulacion: PostulacionRow;
    emails: Awaited<ReturnType<typeof EmailModel.listar>>;
    seguimientos: Awaited<ReturnType<typeof SeguimientoModel.listar>>;
  }> {
    const postulacion = await postulacionDeUsuario(id, usuarioId);
    const [emails, seguimientos] = await Promise.all([
      EmailModel.listar({ usuarioId, postulacionId: id }),
      SeguimientoModel.listar({ usuarioId, postulacionId: id }),
    ]);
    return { postulacion, emails, seguimientos };
  },
};

async function verificarEmpresaDeUsuario(
  empresaId: number,
  usuarioId: number,
): Promise<void> {
  const empresa = await EmpresaModel.obtenerPorIdDeUsuario(
    empresaId,
    usuarioId,
  );
  if (!empresa) {
    throw new NotFoundError(`Empresa ${empresaId} no encontrada`);
  }
}
