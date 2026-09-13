import { EmpresaModel } from '../models/empresa.model';
import { ContactoRrhhModel } from '../models/contacto-rrhh.model';
import { dominioSinTld, extraerEmailDireccion } from './analisis.service';

const REMITENTES_AUTOMATICOS = new Set([
  'postmaster',
  'no-reply',
  'noreply',
  'no_reply',
  'mailer-daemon',
  'mailer',
  'bounce',
  'notification',
  'notifications',
  'newsletter',
  'marketing',
  'alerts',
  'info',
  'support',
]);

export function esRemitenteAutomatico(address: string | null): boolean {
  const email = extraerEmailDireccion(address ?? '');
  if (!email) return true;
  const local = (email.split('@')[0] ?? '').toLowerCase().replace(/[^a-z0-9.-]+/g, '');
  return REMITENTES_AUTOMATICOS.has(local);
}

function nombreDesdeLocalPart(email: string): string {
  const local = (email.split('@')[0] ?? '').toLowerCase();
  const limpio = local.replace(/[._-]+/g, ' ').split(' ').filter(Boolean);
  if (limpio.length === 0) return email;
  return limpio
    .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1))
    .join(' ');
}

export const AgendaService = {
  /**
   * Crea (si no existe) una empresa derivada del dominio del correo
   * y deja el contraparte registrado como contacto de RRHH.
   * Devuelve el id de la empresa creada/existente, o null si la
   * dirección es automática o no se puede derivar nombre.
   */
  async agendarDesdeCorreo(direccion: string): Promise<number | null> {
    const email = extraerEmailDireccion(direccion);
    if (!email || esRemitenteAutomatico(email)) return null;

    const nombre = dominioSinTld(email);
    if (!nombre) return null;

    let empresaId: number;
    if (await EmpresaModel.existeNombre(nombre)) {
      const empresas = await EmpresaModel.listar();
      const existente = empresas.find(
        (e) => e.nombre.toLowerCase() === nombre.toLowerCase(),
      );
      if (!existente) return null;
      empresaId = existente.id;
    } else {
      const creada = await EmpresaModel.crear({ nombre });
      empresaId = creada.id;
    }

    if (!(await ContactoRrhhModel.existeEmailEnEmpresa(email, empresaId))) {
      await ContactoRrhhModel.crear({
        empresa_id: empresaId,
        nombre: nombreDesdeLocalPart(email),
        email,
      });
    }

    return empresaId;
  },
};