import type { InValue } from '@libsql/client';
import { db } from '../config/database';
import type { ProyectoRow } from '../types/models';
import type {
  ActualizarProyectoInput,
  CrearProyectoInput,
} from '../schemas/proyecto';

const CAMPOS_ACTUALIZABLES = {
  nombre: 'nombre',
  descripcion: 'descripcion',
  tecnologias: 'tecnologias',
  url: 'url',
} as const;

const SELECCION = `
  SELECT id, usuario_id, nombre, descripcion, tecnologias, url,
         created_at, updated_at
  FROM proyectos
`;

function serializarTecnologias(tecnologias: string[] | undefined): string | null {
  if (tecnologias === undefined) return undefined as unknown as string | null;
  return tecnologias.join(', ');
}

export const ProyectoModel = {
  async listarPorUsuario(usuarioId: number): Promise<ProyectoRow[]> {
    const resultado = await db.execute({
      sql: `${SELECCION}
        WHERE usuario_id = ?
        ORDER BY COALESCE(created_at, '') DESC, id DESC
      `,
      args: [usuarioId],
    });
    return resultado.rows as unknown as ProyectoRow[];
  },

  async obtenerPorId(id: number): Promise<ProyectoRow | null> {
    const resultado = await db.execute({
      sql: `${SELECCION} WHERE id = ?`,
      args: [id],
    });
    return (resultado.rows[0] as unknown as ProyectoRow) ?? null;
  },

  async crear(input: CrearProyectoInput): Promise<ProyectoRow> {
    const resultado = await db.execute({
      sql: `
        INSERT INTO proyectos (usuario_id, nombre, descripcion, tecnologias, url)
        VALUES (?, ?, ?, ?, ?)
      `,
      args: [
        input.usuario_id,
        input.nombre,
        input.descripcion ?? null,
        serializarTecnologias(input.tecnologias),
        input.url ?? null,
      ],
    });
    const creado = await this.obtenerPorId(Number(resultado.lastInsertRowid));
    if (!creado) {
      throw new Error('No se pudo recuperar el proyecto recién creado');
    }
    return creado;
  },

  async actualizar(
    id: number,
    input: ActualizarProyectoInput,
  ): Promise<ProyectoRow | null> {
    const sets: string[] = [];
    const args: InValue[] = [];

    for (const [key, columna] of Object.entries(CAMPOS_ACTUALIZABLES)) {
      const valor = (input as Record<string, unknown>)[key];
      if (valor !== undefined) {
        sets.push(`${columna} = ?`);
        if (key === 'tecnologias') {
          args.push(serializarTecnologias(valor as string[] | undefined));
        } else {
          args.push(valor as InValue);
        }
      }
    }

    if (sets.length === 0) {
      return this.obtenerPorId(id);
    }

    sets.push('updated_at = CURRENT_TIMESTAMP');
    const resultado = await db.execute({
      sql: `UPDATE proyectos SET ${sets.join(', ')} WHERE id = ?`,
      args: [...args, id],
    });

    if (resultado.rowsAffected === 0) {
      return null;
    }
    return this.obtenerPorId(id);
  },

  async eliminar(id: number): Promise<boolean> {
    const resultado = await db.execute({
      sql: 'DELETE FROM proyectos WHERE id = ?',
      args: [id],
    });
    return resultado.rowsAffected > 0;
  },
};