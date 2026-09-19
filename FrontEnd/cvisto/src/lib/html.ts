import type { Firma } from "@/src/schemas/firma";

export { textoSinHtml } from "./texto";

export interface ImagenEmailDetectada {
  src: string;
  alt: string;
  tipo: "firma" | "logo" | "embebida" | "remota";
  id?: string;
}

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
 * Sanitiza contenido HTML eliminando scripts, iframes externos y atributos de eventos (XSS).
 */
export const sanitizarHtml = (html: string): string => {
  if (!html) return "";
  let limpio = html
    // Eliminar etiquetas <script>...</script>
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    // Eliminar etiquetas <iframe...>, <object...>, <embed...>, <applet...>
    .replace(/<\s*(?:iframe|object|embed|applet|form|base)\b[^>]*>/gi, "")
    .replace(/<\/\s*(?:iframe|object|embed|applet|form|base)\s*>/gi, "")
    // Eliminar atributos de evento on* (ej: onload, onclick, onerror)
    .replace(/\s+on[a-z]+\s*=\s*(?:["'][^"']*["']|[^\s>]+)/gi, "")
    // Neutralizar enlaces javascript:
    .replace(/(href|src)\s*=\s*(["']?)\s*javascript:[^"'>\s]+/gi, '$1=$2#');

  return limpio;
};

/**
 * Detecta y clasifica todas las imágenes presentes en el contenido HTML de un correo.
 */
export const extraerImagenesDeHtml = (
  html: string,
): ImagenEmailDetectada[] => {
  if (!html) return [];
  const imagenes: ImagenEmailDetectada[] = [];
  const regex = /<img\b([^>]*)\/?>/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) !== null) {
    const atributos = match[1];
    const srcMatch = atributos.match(/src\s*=\s*["']([^"']+)["']/i);
    if (!srcMatch) continue;

    const src = srcMatch[1].trim();
    if (!src) continue;

    const altMatch = atributos.match(/alt\s*=\s*["']([^"']*)["']/i);
    const alt = altMatch ? altMatch[1].trim() : "Imagen";

    let tipo: ImagenEmailDetectada["tipo"] = "remota";
    const srcLower = src.toLowerCase();
    const altLower = alt.toLowerCase();

    if (
      srcLower.includes("firma") ||
      altLower.includes("firma") ||
      srcLower.includes("signature") ||
      altLower.includes("signature")
    ) {
      tipo = "firma";
    } else if (
      srcLower.includes("logo") ||
      altLower.includes("logo") ||
      srcLower.includes("brand") ||
      srcLower.includes("avatar")
    ) {
      tipo = "logo";
    } else if (srcLower.startsWith("data:") || srcLower.startsWith("cid:")) {
      tipo = "embebida";
    }

    imagenes.push({
      src,
      alt,
      tipo,
      id: `img_${imagenes.length + 1}`,
    });
  }

  return imagenes;
};

const ESTILOS_EMAIL_MODERNO = `
<style id="cvisto-email-styles">
  html {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    -webkit-text-size-adjust: 100%;
  }
  *, *:before, *:after {
    box-sizing: inherit;
  }
  body {
    margin: 0 !important;
    padding: 24px !important;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
    font-size: 14px !important;
    line-height: 1.6 !important;
    color: #1f2937 !important;
    background-color: #ffffff !important;
    word-break: break-word !important;
    overflow-wrap: break-word !important;
  }
  img {
    max-width: 100% !important;
    height: auto !important;
    display: inline-block;
  }
  table {
    max-width: 100% !important;
    height: auto !important;
  }
  a {
    color: #0284c7 !important;
    text-decoration: underline;
  }
  blockquote {
    border-left: 3px solid #cbd5e1 !important;
    margin: 12px 0 !important;
    padding-left: 12px !important;
    color: #64748b !important;
  }
  @media (max-width: 640px) {
    body {
      padding: 16px !important;
      font-size: 13px !important;
      line-height: 1.5 !important;
    }
  }
</style>
`;

/**
 * Envuelve un fragmento HTML en un documento completo y seguro para renderizarlo
 * en un iframe, inyectando estilos de padding y tipografía para evitar que toque los bordes.
 */
export const normalizarHtml = (
  contenido: string,
  opciones: { permitirImagenes?: boolean } = { permitirImagenes: true },
): string => {
  const sanitizado = sanitizarHtml((contenido ?? "").trim());
  if (!sanitizado) return "";

  let procesado = sanitizado;

  // Si no se permiten imágenes todavía, reemplazar fuentes externas con un placeholder visual
  if (opciones.permitirImagenes === false) {
    procesado = procesado.replace(
      /<img\b([^>]*src\s*=\s*["'])([^"']+)(["'][^>]*)>/gi,
      (match, p1, src, p3) => {
        // Preservar SVGs y data URLs básicas de sistema si se desea, pero ocultar remotas
        if (src.startsWith("data:image/svg") || src.startsWith("data:image/gif")) {
          return match;
        }
        return `<span style="display:inline-flex;align-items:center;padding:6px 10px;background:#f1f5f9;border:1px dashed #94a3b8;border-radius:6px;font-size:11px;color:#64748b;margin:4px 0;">[Imagen oculta]</span>`;
      },
    );
  }

  // Si ya es un documento HTML completo, inyectar el estilo de padding y sanitización antes de </head> o <body>
  if (/\s*<!DOCTYPE\b/i.test(procesado) || /\s*<html\b/i.test(procesado)) {
    if (/<\/head>/i.test(procesado)) {
      return procesado.replace(/<\/head>/i, `${ESTILOS_EMAIL_MODERNO}</head>`);
    }
    if (/<body\b[^>]*>/i.test(procesado)) {
      return procesado.replace(
        /(<body\b[^>]*>)/i,
        `$1${ESTILOS_EMAIL_MODERNO}`,
      );
    }
    return `${ESTILOS_EMAIL_MODERNO}${procesado}`;
  }

  // Si es un fragmento, envolver en un documento HTML completo con estilos
  return `<!DOCTYPE html><html><head><meta charset="utf-8">${ESTILOS_EMAIL_MODERNO}</head><body>${procesado}</body></html>`;
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
