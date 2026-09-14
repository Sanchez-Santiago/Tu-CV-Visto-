import type { Postulacion, PostulacionSinId } from "@/src/schemas/postulacion";
import type { EstadoPostulacion, TipoSeguimiento } from "@/src/schemas/common";
import { hoyDia, sumarDias } from "@/src/lib/fechas";
import { request } from "./http";
import { postulacionFila, postulacionPayload } from "./mappers";
import { resolverUsuarioId } from "./usuario";

export const postulacionesApi = {
  async getAll(): Promise<Postulacion[]> {
    const filas = await request<Record<string, unknown>[]>("/postulaciones");
    return filas.map(postulacionFila);
  },

  async getById(id: string): Promise<Postulacion | null> {
    try {
      const fila = await request<Record<string, unknown>>(`/postulaciones/${id}`);
      return postulacionFila(fila);
    } catch {
      return null;
    }
  },

  async create(data: PostulacionSinId): Promise<Postulacion> {
    const usuarioId = await resolverUsuarioId();
    const payload = postulacionPayload(data, usuarioId);
    const creada = await request<Record<string, unknown>>("/postulaciones", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return postulacionFila(creada);
  },

  async update(id: string, cambios: Partial<Postulacion>): Promise<Postulacion> {
    const payload: Record<string, unknown> = {};
    if (cambios.empresaId !== undefined) payload.empresa_id = cambios.empresaId;
    if (cambios.puesto !== undefined) payload.puesto = cambios.puesto;
    if (cambios.modalidad !== undefined) payload.modalidad = cambios.modalidad ?? null;
    if (cambios.respondio !== undefined) payload.respondio = cambios.respondio;
    if (cambios.estado !== undefined) payload.estado = cambios.estado;
    if (cambios.interes !== undefined) payload.interes = cambios.interes;
    if (cambios.fuente !== undefined) payload.fuente = cambios.fuente ?? null;
    if (cambios.cantidadMailsEnviados !== undefined)
      payload.cantidad_mails_enviados = cambios.cantidadMailsEnviados;
    if (cambios.fechaPostulacion !== undefined)
      payload.fecha_postulacion = cambios.fechaPostulacion ?? null;
    if (cambios.ultimoContacto !== undefined)
      payload.ultimo_contacto = cambios.ultimoContacto ?? null;
    if (cambios.proximoContacto !== undefined)
      payload.proxima_contacto = cambios.proximoContacto ?? null;
    if (cambios.observaciones !== undefined)
      payload.observaciones = cambios.observaciones ?? null;
    const fila = await request<Record<string, unknown>>(`/postulaciones/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return postulacionFila(fila);
  },

  async cambiarEstado(id: string, estado: EstadoPostulacion): Promise<Postulacion> {
    return this.update(id, { estado });
  },

  async registrarSeguimiento(
    id: string,
    datos: {
      tipoSeguimiento: TipoSeguimiento;
      fecha: string;
      observaciones?: string;
      enviado?: 0 | 1;
    },
    cadenciaDias?: number,
  ): Promise<Postulacion> {
    const fecha = datos.fecha || hoyDia();
    const postulacionFila_ = await request<Record<string, unknown>>(
      `/postulaciones/${id}`,
    );
    const empresa = await request<Record<string, unknown>>(
      `/empresas/${postulacionFila_.empresa_id}`,
    );
    const cadencia =
      (empresa.cadencia_contacto as number | null) ?? cadenciaDias ?? 30;
    const proximaFecha = sumarDias(fecha, cadencia);

    await request("/seguimientos", {
      method: "POST",
      body: JSON.stringify({
        postulacion_id: Number(id),
        fecha_programada: fecha,
        tipo_seguimiento: datos.tipoSeguimiento,
        enviado: datos.enviado ?? 0,
        requiere_aprobacion: 0,
        observaciones: datos.observaciones ?? null,
      }),
    });

    const actualizada = await request<Record<string, unknown>>(
      `/postulaciones/${id}`,
      {
        method: "PUT",
        body: JSON.stringify({
          ultimo_contacto: fecha,
          proxima_contacto: proximaFecha,
        }),
      },
    );
    return postulacionFila(actualizada);
  },

  async delete(id: string): Promise<boolean> {
    await request(`/postulaciones/${id}`, { method: "DELETE" });
    return true;
  },
};