export const textoSinHtml = (contenido: string): string =>
  contenido
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

const PREFIJO_RE = /^\s*(?:re|rv|fw|fwd|enc)\s*\[\d*\]?\s*:\s*/iu;

export const quitarPrefijoAsunto = (asunto: string | null): string =>
  (asunto ?? "").replace(PREFIJO_RE, "").trim();

export const armarPrefijoAsunto = (
  asunto: string | null,
  modo: "responder" | "reenviar",
): string => {
  const base = quitarPrefijoAsunto(asunto);
  const prefijo = modo === "responder" ? "Re: " : "Fwd: ";
  return `${prefijo}${base || "(Sin asunto)"}`;
};