import { db } from '../config/database';
import type { ContactoRrhhRow, PostulacionContactoRow } from '../types/models';

export const PostulacionContactoModel = {
  async asignar(
    postulacionId: number,
    contactoRrhhId: number,
  ): Promise<PostulacionContactoRow> {
    await db.execute({
      sql: `
        INSERT INTO postulacion_contactos (postulacion_id, contacto_rrhh_id)
        VALUES (?, ?)
      `,
      args: [postulacionId, contactoRrhhId],
    });
    return {
      postulacion_id: postulacionId,
      contacto_rrhh_id: contactoRrhhId,
    };
  },

  async quitar(postulacionId: number, contactoRrhhId: number): Promise<boolean> {
    const resultado = await db.execute({
      sql: `
        DELETE FROM postulacion_contactos
        WHERE postulacion_id = ? AND contacto_rrhh_id = ?
      `,
      args: [postulacionId, contactoRrhhId],
    });
    return resultado.rowsAffected > 0;
  },

  async listarContactosDePostulacion(
    postulacionId: number,
  ): Promise<ContactoRrhhRow[]> {
    const resultado = await db.execute({
      sql: `
        SELECT cr.id, cr.empresa_id, cr.nombre, cr.email, cr.cargo,
               cr.observaciones, cr.created_at, cr.updated_at
        FROM postulacion_contactos pc
        JOIN contactos_rrhh cr ON cr.id = pc.contacto_rrhh_id
        WHERE pc.postulacion_id = ?
        ORDER BY cr.nombre ASC
      `,
      args: [postulacionId],
    });
    return resultado.rows as unknown as ContactoRrhhRow[];
  },

  async existe(postulacionId: number, contactoRrhhId: number): Promise<boolean> {
    const resultado = await db.execute({
      sql: `
        SELECT 1 FROM postulacion_contactos
        WHERE postulacion_id = ? AND contacto_rrhh_id = ?
      `,
      args: [postulacionId, contactoRrhhId],
    });
    return resultado.rows.length > 0;
  },
};