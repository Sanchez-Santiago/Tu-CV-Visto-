import type { Firma } from "@/src/schemas/firma";

export { textoSinHtml } from "./texto";

/**
 * Heurística para saber si un contenido de correo es HTML o texto plano.
 */
export const esHtml = (contenido: string | null | undefined): boolean => {
  const texto = (contenido ?? "").trim();
  if (!texto) return false;
  return /<\s*(?:!DOCTYPE|html|head|body|div|table|tr|td|p\b|span|a\b|img|style|strong|b\b|br\b|ul|ol|li|h[1-6])\b[\s\S]*>/i.test(
    texto,
  );
};

/**
 * Envuelve un fragmento HTML en un documento completo para renderizarlo en un
 * iframe de forma segura. Si ya es un documento completo lo deja igual.
 */
export const normalizarHtml = (contenido: string): string => {
  const texto = (contenido ?? "").trim();
  if (!texto) return "";
  if (/\s*<!DOCTYPE\b/i.test(texto) || /\s*<html\b/i.test(texto)) {
    return texto;
  }
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.45}</style></head><body>${texto}</body></html>`;
};

/**
 * Las firmas de imagen viajan embebidas como `cid:firma_<id>` (necesario para
 * que Gmail las muestre inline). En el preview dentro de la app el navegador no
 * puede resolver `cid:`, así que las reemplazamos por data URLs locales.
 */
export const reemplazarCidPorDataUrl = (
  html: string,
  firmas: Firma[] = [],
): string => {
  if (!html || firmas.length === 0) return html;
  const porId = new Map(firmas.map((f) => [String(f.id), f]));
  return html.replace(
    /src=(["'])cid:firma_(\d+)\1/gi,
    (match, quote: string, id: string) => {
      const firma = porId.get(id);
      if (!firma || firma.tipo !== "imagen" || !firma.imagenBase64) {
        return match;
      }
      const mime = firma.imagenMime || "image/png";
      return `src=${quote}data:${mime};base64,${firma.imagenBase64}${quote}`;
    },
  );
};
