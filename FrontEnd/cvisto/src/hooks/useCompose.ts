import { useCallback, useState } from "react";
import { gmailApi, type AdjuntoEnviar } from "@/src/lib/api/client";
import type { Contacto } from "@/src/schemas/contacto";
import type { Empresa } from "@/src/schemas/empresa";
import { useToast } from "@/src/components/ui/Toast";

interface PrefillCompose {
  destinatario: string;
  asunto: string;
  cuerpo: string;
}

export function useCompose(opts: {
  contactos: Contacto[];
  refrescarEmails: () => Promise<void>;
}) {
  const { success, error } = useToast();
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composePrefill, setComposePrefill] = useState<PrefillCompose>({
    destinatario: "",
    asunto: "",
    cuerpo: "",
  });

  const abrirComposeConPrefill = useCallback((prefill: PrefillCompose) => {
    setComposePrefill(prefill);
    setIsComposeOpen(true);
  }, []);

  const abrirComposeVacio = useCallback(() => {
    setComposePrefill({ destinatario: "", asunto: "", cuerpo: "" });
    setIsComposeOpen(true);
  }, []);

  const abrirComposeParaContacto = useCallback(
    (email: string) => {
      abrirComposeConPrefill({ destinatario: email, asunto: "", cuerpo: "" });
    },
    [abrirComposeConPrefill],
  );

  const abrirComposeParaEmpresa = useCallback(
    (empresa: Empresa) => {
      const primerContacto = opts.contactos.find(
        (c) => Number(c.empresaId) === Number(empresa.id) && Boolean(c.email),
      );
      if (primerContacto) {
        abrirComposeConPrefill({
          destinatario: primerContacto.email,
          asunto: "",
          cuerpo: "",
        });
      } else {
        setComposePrefill({ destinatario: "", asunto: "", cuerpo: "" });
        error(`La empresa "${empresa.nombre}" no tiene contactos con email`);
      }
      setIsComposeOpen(true);
    },
    [opts.contactos, error, abrirComposeConPrefill],
  );

  const enviarCorreo = useCallback(
    async (input: {
      destinatario: string;
      asunto: string;
      cuerpo: string;
      cc?: string;
      adjuntos?: AdjuntoEnviar[];
      firmaId?: number;
    }) => {
      try {
        await gmailApi.enviar({
          destinatario: input.destinatario,
          asunto: input.asunto,
          cuerpo: input.cuerpo,
          cc: input.cc,
          adjuntos: input.adjuntos,
          firmas: input.firmaId != null ? [input.firmaId] : undefined,
          tipo: "seguimiento",
        });
        await opts.refrescarEmails();
        success(`Email enviado a ${input.destinatario}`);
      } catch (err) {
        error(err instanceof Error ? err.message : "Error al enviar el email");
        throw err;
      }
    },
    [opts.refrescarEmails, success, error],
  );

  return {
    isComposeOpen,
    composePrefill,
    cerrarCompose: () => setIsComposeOpen(false),
    abrirComposeVacio,
    abrirComposeConPrefill,
    abrirComposeParaContacto,
    abrirComposeParaEmpresa,
    enviarCorreo,
  };
}