import { contactosApi } from "@/src/lib/api/client";
import type { Contacto, ContactoSinId } from "@/src/schemas/contacto";
import { useRecurso } from "./useRecurso";

export function useContactos() {
  return useRecurso<Contacto, ContactoSinId>(contactosApi);
}