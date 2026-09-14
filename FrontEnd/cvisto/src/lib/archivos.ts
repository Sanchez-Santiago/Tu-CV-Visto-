export interface ArchivoBase64 {
  base64: string;
  size: number;
}

export function archivoABase64(
  archivo: File,
  nombreFallback: string,
): Promise<{ nombre: string; contentType: string; base64: string; size: number }> {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => {
      const dataUrl = lector.result as string;
      resolve({
        nombre: archivo.name || nombreFallback,
        contentType: archivo.type || "application/octet-stream",
        base64: dataUrl.split(",")[1] ?? "",
        size: archivo.size,
      });
    };
    lector.onerror = () =>
      reject(lector.error ?? new Error("Error al leer el archivo"));
    lector.readAsDataURL(archivo);
  });
}

export function formatearBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export function dataUrlDeImagen(
  mimeType: string | null | undefined,
  base64: string | null | undefined,
): string {
  return `data:${mimeType ?? "image/png"};base64,${base64 ?? ""}`;
}