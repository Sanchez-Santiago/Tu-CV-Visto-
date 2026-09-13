import { firmarToken } from '../../src/utils/jwt';

export async function headersDe(
  usuarioId: number,
  email = 'test@test.com',
  nombre = 'Usuario de Test',
): Promise<{ Authorization: string }> {
  const token = await firmarToken({
    usuario_id: usuarioId,
    email,
    nombre,
  });
  return { Authorization: `Bearer ${token}` };
}