import { emailsApi } from "@/src/lib/api/client";
import type { Email, EmailSinId } from "@/src/schemas/email";
import { useRecurso } from "./useRecurso";

export function useEmails() {
  return useRecurso<Email, EmailSinId>(emailsApi, { prepend: true });
}