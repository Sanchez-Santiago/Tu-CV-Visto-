import { z } from "zod";
import { ModalidadSchema } from "./common";

export const EmpresaSchema = z.object({
  id: z.string(),
  nombre: z.string().min(1, "El nombre de la empresa es requerido"),
  pais: z.string().max(100).nullable().optional(),
  provincia: z.string().max(100).nullable().optional(),
  ciudad: z.string().max(100).nullable().optional(),
  modalidad: ModalidadSchema.nullable().optional(),
  cadenciaContacto: z.number().int().positive().nullable().optional(),
  observaciones: z.string().max(2000).nullable().optional(),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});
export type Empresa = z.infer<typeof EmpresaSchema>;

export const EmpresaSinIdSchema = EmpresaSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type EmpresaSinId = z.infer<typeof EmpresaSinIdSchema>;