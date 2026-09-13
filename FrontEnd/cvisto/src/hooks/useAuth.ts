import { useCallback, useEffect, useState } from "react";
import { USUARIO, urlLoginGoogle } from "@/src/lib/api/client";
import type { Usuario } from "@/src/schemas/usuario";

export function useAuth() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  const verificarSesion = useCallback(async () => {
    setCargando(true);
    try {
      const me = await USUARIO.getMe();
      setUsuario(me);
    } catch {
      setUsuario(null);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    verificarSesion();
  }, [verificarSesion]);

  const iniciarLogin = useCallback(() => {
    window.location.assign(urlLoginGoogle());
  }, []);

  const actualizarUsuario = useCallback(async (data: Partial<Usuario>) => {
    const actualizado = await USUARIO.updateMe(data);
    setUsuario(actualizado);
    return actualizado;
  }, []);

  const cerrarSesion = useCallback(async () => {
    try {
      await USUARIO.logout();
    } finally {
      setUsuario(null);
    }
  }, []);

  return {
    usuario,
    cargando,
    necesitaLogin: !cargando && !usuario,
    verificarSesion,
    iniciarLogin,
    actualizarUsuario,
    cerrarSesion,
  };
}