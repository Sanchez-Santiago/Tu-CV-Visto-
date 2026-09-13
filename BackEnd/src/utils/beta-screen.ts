import { env } from '../config/env';

export interface DatosPantallaBeta {
  nombre: string;
  email: string;
}

export function renderizarPantallaBeta(datos: DatosPantallaBeta): string {
  const destino = env.FRONTEND_URL || '/';
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>CVisto — Sesión iniciada</title>
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #0f172a;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        color: #e2e8f0;
        padding: 24px;
      }
      .tarjeta {
        max-width: 520px;
        width: 100%;
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 16px;
        padding: 32px;
      }
      .sello {
        display: inline-block;
        background: #f59e0b;
        color: #1c1917;
        font-weight: 700;
        font-size: 12px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        border-radius: 999px;
        padding: 6px 12px;
        margin-bottom: 16px;
      }
      h1 { margin: 0 0 8px; font-size: 22px; }
      p  { margin: 0 0 16px; line-height: 1.6; }
      .email {
        background: #0f172a;
        border-radius: 8px;
        padding: 12px 16px;
        font-weight: 600;
        word-break: break-all;
        margin-bottom: 16px;
      }
      .aviso {
        background: rgba(245, 158, 11, 0.12);
        border: 1px solid rgba(245, 158, 11, 0.4);
        border-radius: 8px;
        color: #fcd34d;
        padding: 12px 16px;
        font-size: 14px;
        margin-bottom: 24px;
      }
      a.boton {
        display: inline-block;
        background: #22c55e;
        color: #052e16;
        font-weight: 700;
        text-decoration: none;
        border-radius: 10px;
        padding: 12px 24px;
      }
      a.boton.disabled { background: #334155; color: #94a3b8; pointer-events: none; }
      .indirecto { margin-top: 24px; font-size: 12px; color: #94a3b8; }
    </style>
  </head>
  <body>
    <div class="tarjeta">
      <span class="sello">Fase de prueba</span>
      <h1>Tu sesión en CVisto quedó iniciada</h1>
      <p>Sesión vinculada a la cuenta:</p>
      <div class="email">${escapeHtml(datos.email)}</div>
      <div class="aviso">
        CVisto todavía está en <strong>fase de prueba</strong>: la app no cuenta con
        la verificación de Google y puede cambiar sin aviso. Los datos que guardes
        son solo para desarrollo.
      </div>
      <a class="boton${destino === '/' ? ' disabled' : ''}" href="${escapeAttr(destino)}">
        Ir al panel
      </a>
      <div class="indirecto">${escapeHtml(datos.nombre)} · CVisto backend</div>
    </div>
  </body>
</html>`;
}

function escapeHtml(valor: string): string {
  return valor
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(valor: string): string {
  return escapeHtml(valor).replace(/'/g, '&#39;');
}