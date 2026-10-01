# Assets del frontend (CVisto)

Convención del proyecto:

- **`public/`** (fuera de `src/`): archivos con **URL estable** que se sirven
  tal cual — `favicon.svg` (`/favicon.svg`), `logo.svg` (apple-touch-icon),
  futuras `og-image`, `manifest`, etc. Se referencian desde `index.html`.
  No importar estos archivos desde el código.
- **`src/assets/`** (esta carpeta): archivos que **importa el código**
  (`import logo from "@/src/assets/brand/logo.svg"`). Vite los empaqueta
  con hash. Los tipos vienen de `vite/client` (ver `src/vite-env.d.ts`).

## Estructura

```
src/assets/
  brand/    → logo, favicon e identidad (copias importables de public/)
  images/   → ilustraciones, capturas, fondos
  icons/    → iconos SVG propios (los de UI general son lucide-react)
```

## Reglas

1. Preferir SVG inline o `lucide-react` para iconos de UI (permiten
   `currentColor` y no suman requests).
2. Imágenes pesadas (JPG/PNG/WebP) van en `images/` y se importan, no en
   `public/`, salvo que necesiten URL estable.
3. El componente `Logo` (`components/ui/Logo.tsx`) es SVG inline a
   propósito (se tiñe con el tema): no reemplazarlo por `<img>`.
4. No subir capturas de datos reales de usuarios.
