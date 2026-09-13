import { EmailModel } from '../models/email.model';
import { EmpresaModel } from '../models/empresa.model';
import { PostulacionModel, type FiltroPostulaciones } from '../models/postulacion.model';
import { SeguimientoModel } from '../models/seguimiento.model';
import { UsuarioModel } from '../models/usuario.model';
import type { PostulacionRow } from '../types/models';
import { NotFoundError } from '../utils/errors';
import type {
  ActualizarPostulacionInput,
  CrearPostulacionInput,
} from '../schemas/postulacion';

export const PostulacionService = {
  async crear(input: CrearPostulacionInput): Promise<PostulacionRow> {
    await verificarUsuarioExiste(input.usuario_id);
    await verificarEmpresaExiste(input.empresa_id);
    return PostulacionModel.crear(input);
  },

  listar(filtros: FiltroPostulaciones = {}): Promise<PostulacionRow[]> {
    return PostulacionModel.listar(filtros);
  },

  async obtenerPorId(id: number): Promise<PostulacionRow> {
    const postulacion = await PostulacionModel.obtenerPorId(id);
    if (!postulacion) {
      throw new NotFoundError(`Postulación ${id} no encontrada`);
    }
    return postulacion;
  },

  async actualizar(
    id: number,
    input: ActualizarPostulacionInput,
  ): Promise<PostulacionRow> {
    const actual = await this.obtenerPorId(id);

    if (
      input.usuario_id !== undefined &&
      input.usuario_id !== actual.usuario_id
    ) {
      await verificarUsuarioExiste(input.usuario_id);
    }
    if (
      input.empresa_id !== undefined &&
      input.empresa_id !== actual.empresa_id
    ) {
      await verificarEmpresaExiste(input.empresa_id);
    }

    const actualizada = await PostulacionModel.actualizar(id, input);
    if (!actualizada) {
      throw new NotFoundError(`Postulación ${id} no encontrada`);
    }
    return actualizada;
  },

  async eliminar(id: number): Promise<void> {
    const eliminada = await PostulacionModel.eliminar(id);
    if (!eliminada) {
      throw new NotFoundError(`Postulación ${id} no encontrada`);
    }
  },

  async obtenerRelacion(id: number): Promise<{
    postulacion: PostulacionRow;
    emails: Awaited<ReturnType<typeof EmailModel.listar>>;
    seguimientos: Awaited<ReturnType<typeof SeguimientoModel.listar>>;
  }> {
    const postulacion = await this.obtenerPorId(id);
    const [emails, seguimientos] = await Promise.all([
      EmailModel.listar({ postulacionId: id }),
      SeguimientoModel.listar({ postulacionId: id }),
    ]);
    return { postulacion, emails, seguimientos };
  },
};

async function verificarUsuarioExiste(usuarioId: number): Promise<void> {
  const usuario = await UsuarioModel.obtenerPorId(usuarioId);
  if (!usuario) {
    throw new NotFoundError(`Usuario ${usuarioId} no encontrado`);
  }
}

async function verificarEmpresaExiste(empresaId: number): Promise<void> {
  const empresa = await EmpresaModel.obtenerPorId(empresaId);
  if (!empresa) {
    throw new NotFoundError(`Empresa ${empresaId} no encontrada`);
  }
}