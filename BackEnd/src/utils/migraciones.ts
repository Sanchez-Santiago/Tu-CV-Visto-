import type { Client } from '@libsql/client';
import { logger } from './logger';

interface MigracionColumna {
  tabla: string;
  columna: string;
  ddl: string;
}

const MIGRACIONES_COLUMNAS: MigracionColumna[] = [
  {
    tabla: 'empresas',
    columna: 'cadencia_contacto',
    ddl: 'ALTER TABLE empresas ADD COLUMN cadencia_contacto INTEGER',
  },
  {
    tabla: 'emails',
    columna: 'tipo_seguimiento',
    ddl: 'ALTER TABLE emails ADD COLUMN tipo_seguimiento TEXT',
  },
  {
    tabla: 'seguimientos',
    columna: 'tipo_seguimiento',
    ddl: "ALTER TABLE seguimientos ADD COLUMN tipo_seguimiento TEXT NOT NULL DEFAULT 'consulta'",
  },
  {
    tabla: 'postulaciones',
    columna: 'proxima_contacto',
    ddl: 'ALTER TABLE postulaciones ADD COLUMN proxima_contacto TEXT',
  },
  {
    tabla: 'emails',
    columna: 'cuerpo_html',
    ddl: 'ALTER TABLE emails ADD COLUMN cuerpo_html TEXT',
  },
  {
    tabla: 'emails',
    columna: 'tipo_respuesta',
    ddl: 'ALTER TABLE emails ADD COLUMN tipo_respuesta TEXT',
  },
  {
    tabla: 'emails',
    columna: 'tipo_respuesta_fuente',
    ddl: "ALTER TABLE emails ADD COLUMN tipo_respuesta_fuente TEXT",
  },
  {
    tabla: 'usuarios',
    columna: 'telefono',
    ddl: 'ALTER TABLE usuarios ADD COLUMN telefono TEXT',
  },
  {
    tabla: 'usuarios',
    columna: 'linkedin',
    ddl: 'ALTER TABLE usuarios ADD COLUMN linkedin TEXT',
  },
  {
    tabla: 'usuarios',
    columna: 'sitio_web',
    ddl: 'ALTER TABLE usuarios ADD COLUMN sitio_web TEXT',
  },
];

export async function aplicarMigracionesColumnas(
  client: Client,
): Promise<void> {
  for (const migracion of MIGRACIONES_COLUMNAS) {
    const resultado = await client.execute(
      `PRAGMA table_info(${migracion.tabla})`,
    );
    const existe = resultado.rows.some(
      (fila) => (fila as Record<string, unknown>).name === migracion.columna,
    );
    if (!existe) {
      await client.execute(migracion.ddl);
    }
  }

  await emailsPostulacionIdNullable(client);
  await corregirHtmlLegacy(client);
  await crearTablaFirmas(client);

  // Aislamiento multiusuario.Va al final porque
  // `emailsPostulacionIdNullable` recrea la tabla emails con DROP TABLE y
  // descartaría las columnas nuevas.
  await ownershipEmails(client);
  await ownershipSeguimientos(client);
  await ownershipEmpresas(client);
  await ownershipContactosRrhh(client);
  await crearIndicesOwnership(client);
}

async function agregarColumna(
  client: Client,
  tabla: string,
  columna: string,
  ddl: string,
): Promise<boolean> {
  const info = await client.execute(`PRAGMA table_info(${tabla})`);
  const existe = info.rows.some(
    (fila) => (fila as Record<string, unknown>).name === columna,
  );
  if (existe) return false;
  await client.execute(ddl);
  return true;
}

async function contar(client: Client, sql: string): Promise<number> {
  const resultado = await client.execute(sql);
  const fila = resultado.rows[0] as Record<string, unknown> | undefined;
  if (!fila) return 0;
  return Number(Object.values(fila)[0] ?? 0);
}

/**
 * Los emails solo eran atribuibles a través de postulacion_id, que es
 * nullable: los que no matchean una postulación quedaban sin dueño y se
 * servían a todos. Se agrega la columna y se rellena en tres pasos.
 */
async function ownershipEmails(client: Client): Promise<void> {
  const agregada = await agregarColumna(
    client,
    'emails',
    'usuario_id',
    'ALTER TABLE emails ADD COLUMN usuario_id INTEGER',
  );
  if (!agregada) return;

  await client.execute(`
    UPDATE emails
    SET usuario_id = (
      SELECT p.usuario_id FROM postulaciones p WHERE p.id = emails.postulacion_id
    )
    WHERE postulacion_id IS NOT NULL
  `);

  // Huérfanos: se atribuyen al usuario cuyo email aparece como remitente
  // (recibido) o destinatario (enviado).
  await client.execute(`
    UPDATE emails
    SET usuario_id = (
      SELECT MIN(u.id)
      FROM usuarios u
      WHERE LOWER(u.email) = LOWER(emails.remitente)
         OR LOWER(u.email) = LOWER(emails.destinatario)
    )
    WHERE usuario_id IS NULL
  `);

  const huerfanos = await contar(
    client,
    'SELECT COUNT(*) FROM emails WHERE usuario_id IS NULL',
  );
  if (huerfanos > 0) {
    await client.execute('DELETE FROM emails WHERE usuario_id IS NULL');
  }
  logger.info(
    `[migracion] emails: ${huerfanos} no atribuibles purgados (se re-sincronizan)`,
  );
}

async function ownershipSeguimientos(client: Client): Promise<void> {
  const agregada = await agregarColumna(
    client,
    'seguimientos',
    'usuario_id',
    'ALTER TABLE seguimientos ADD COLUMN usuario_id INTEGER',
  );
  if (!agregada) return;

  await client.execute(`
    UPDATE seguimientos
    SET usuario_id = (
      SELECT p.usuario_id FROM postulaciones p WHERE p.id = seguimientos.postulacion_id
    )
  `);

  const huerfanos = await contar(
    client,
    'SELECT COUNT(*) FROM seguimientos WHERE usuario_id IS NULL',
  );
  if (huerfanos > 0) {
    await client.execute('DELETE FROM seguimientos WHERE usuario_id IS NULL');
  }
}

/**
 * empresas era un catálogo compartido sin dueño, y su DELETE cascada
 * destruía postulaciones de todos los usuarios. Se vuelve privado por
 * usuario clonando: la original queda para el primer dueño y cada dueño
 * adicional recibe una copia con sus postulaciones y contactos re-apuntados.
 */
async function ownershipEmpresas(client: Client): Promise<void> {
  const agregada = await agregarColumna(
    client,
    'empresas',
    'usuario_id',
    'ALTER TABLE empresas ADD COLUMN usuario_id INTEGER',
  );
  if (!agregada) return;

  // Los contactos se clonan junto con la empresa, así que su columna tiene que
  // existir antes (el backfill sí corre después, en ownershipContactosRrhh).
  await agregarColumna(
    client,
    'contactos_rrhh',
    'usuario_id',
    'ALTER TABLE contactos_rrhh ADD COLUMN usuario_id INTEGER',
  );

  const todosUsuarios = await idsDeUsuarios(client);
  if (todosUsuarios.length === 0) return;

  const empresas = await client.execute('SELECT id FROM empresas ORDER BY id ASC');
  let clonadas = 0;

  for (const fila of empresas.rows) {
    const empresaId = Number((fila as Record<string, unknown>).id);

    const duenos = await client.execute({
      sql: `
        SELECT DISTINCT usuario_id AS usuarioId
        FROM postulaciones
        WHERE empresa_id = ?
        ORDER BY usuario_id ASC
      `,
      args: [empresaId],
    });
    const conPostulaciones = duenos.rows.map((r) =>
      Number((r as Record<string, unknown>).usuarioId),
    );
    // Sin postulaciones (semilla/demo): se replica para todos para que
    // nadie quede con el catálogo vacío.
    const destinos =
      conPostulaciones.length > 0 ? conPostulaciones : todosUsuarios;

    for (const usuarioId of destinos.slice(1)) {
      const nuevaEmpresaId = await clonarEmpresa(client, empresaId, usuarioId);
      clonadas += 1;
      await clonarContactosDeEmpresa(client, empresaId, nuevaEmpresaId, usuarioId);
      await client.execute({
        sql: 'UPDATE postulaciones SET empresa_id = ? WHERE empresa_id = ? AND usuario_id = ?',
        args: [nuevaEmpresaId, empresaId, usuarioId],
      });
    }

    await client.execute({
      sql: 'UPDATE empresas SET usuario_id = ? WHERE id = ?',
      args: [destinos[0] as number, empresaId],
    });
  }

  if (clonadas > 0) {
    logger.info(
      `[migracion] empresas: ${clonadas} copias creadas para separar el catalogo compartido por usuario`,
    );
  }
}

async function idsDeUsuarios(client: Client): Promise<number[]> {
  const resultado = await client.execute('SELECT id FROM usuarios ORDER BY id ASC');
  return resultado.rows.map((r) => Number((r as Record<string, unknown>).id));
}

async function clonarEmpresa(
  client: Client,
  empresaId: number,
  usuarioId: number,
): Promise<number> {
  const resultado = await client.execute({
    sql: `
      INSERT INTO empresas
        (nombre, pais, provincia, ciudad, modalidad, cadencia_contacto,
         observaciones, usuario_id, created_at, updated_at)
      SELECT nombre, pais, provincia, ciudad, modalidad, cadencia_contacto,
             observaciones, ?, created_at, CURRENT_TIMESTAMP
      FROM empresas WHERE id = ?
    `,
    args: [usuarioId, empresaId],
  });
  return Number(resultado.lastInsertRowid);
}

async function clonarContactosDeEmpresa(
  client: Client,
  empresaOrigen: number,
  empresaDestino: number,
  usuarioId: number,
): Promise<void> {
  const contactos = await client.execute({
    sql: 'SELECT id, nombre, email, cargo, observaciones FROM contactos_rrhh WHERE empresa_id = ?',
    args: [empresaOrigen],
  });

  for (const fila of contactos.rows) {
    const c = fila as Record<string, unknown>;
    const insercion = await client.execute({
      sql: `
        INSERT INTO contactos_rrhh
          (empresa_id, nombre, email, cargo, observaciones, usuario_id,
           created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `,
      args: [
        empresaDestino,
        c.nombre as string,
        c.email as string,
        (c.cargo as string | null) ?? null,
        (c.observaciones as string | null) ?? null,
        usuarioId,
      ],
    });
    const nuevoContactoId = Number(insercion.lastInsertRowid);

    await client.execute({
      sql: `
        UPDATE postulacion_contactos
        SET contacto_rrhh_id = ?
        WHERE contacto_rrhh_id = ?
          AND postulacion_id IN (
            SELECT id FROM postulaciones
            WHERE empresa_id = ? AND usuario_id = ?
          )
      `,
      args: [nuevoContactoId, Number(c.id), empresaOrigen, usuarioId],
    });
  }
}

async function ownershipContactosRrhh(client: Client): Promise<void> {
  // La columna puede haberla agregado ya ownershipEmpresas (para poder
  // clonar contactos), así que el backfill se corre siempre.
  await agregarColumna(
    client,
    'contactos_rrhh',
    'usuario_id',
    'ALTER TABLE contactos_rrhh ADD COLUMN usuario_id INTEGER',
  );

  // Corre después de ownershipEmpresas para poder heredar de la empresa.
  await client.execute(`
    UPDATE contactos_rrhh
    SET usuario_id = (
      SELECT e.usuario_id FROM empresas e WHERE e.id = contactos_rrhh.empresa_id
    )
    WHERE usuario_id IS NULL
  `);
}

async function crearIndicesOwnership(client: Client): Promise<void> {
  await client.executeMultiple(`
    CREATE INDEX IF NOT EXISTS idx_emails_usuario ON emails(usuario_id);
    CREATE INDEX IF NOT EXISTS idx_emails_usuario_gmail ON emails(usuario_id, gmail_message_id);
    CREATE INDEX IF NOT EXISTS idx_seguimientos_usuario ON seguimientos(usuario_id);
    CREATE INDEX IF NOT EXISTS idx_empresas_usuario ON empresas(usuario_id);
    CREATE INDEX IF NOT EXISTS idx_contactos_rrhh_usuario ON contactos_rrhh(usuario_id);
    CREATE INDEX IF NOT EXISTS idx_postulacion_contactos_contacto ON postulacion_contactos(contacto_rrhh_id);
  `);
}

export async function crearTablaFirmas(client: Client): Promise<void> {
  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS firmas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER NOT NULL,
      nombre TEXT NOT NULL,
      tipo TEXT NOT NULL CHECK (tipo IN ('texto', 'imagen')),
      contenido TEXT,
      imagen_mime TEXT,
      imagen_base64 TEXT,
      enlace TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_firmas_usuario ON firmas(usuario_id);
  `);
}

async function corregirHtmlLegacy(client: Client): Promise<void> {
  await client.execute(`
    UPDATE emails
    SET cuerpo_html = contenido_resumen
    WHERE cuerpo_html IS NULL
      AND contenido_resumen IS NOT NULL
      AND ltrim(contenido_resumen, char(10) || char(13) || ' ') LIKE '<%'
      AND (
        ltrim(contenido_resumen, char(10) || char(13) || ' ') LIKE '<!DOCTYPE%'
        OR ltrim(contenido_resumen, char(10) || char(13) || ' ') LIKE '<html%'
        OR ltrim(contenido_resumen, char(10) || char(13) || ' ') LIKE '<head%'
        OR ltrim(contenido_resumen, char(10) || char(13) || ' ') LIKE '<body%'
        OR ltrim(contenido_resumen, char(10) || char(13) || ' ') LIKE '<div%'
        OR ltrim(contenido_resumen, char(10) || char(13) || ' ') LIKE '<table%'
        OR ltrim(contenido_resumen, char(10) || char(13) || ' ') LIKE '<p%'
        OR ltrim(contenido_resumen, char(10) || char(13) || ' ') LIKE '<span%'
      )
  `);
}

async function emailsPostulacionIdNullable(client: Client): Promise<void> {
  const info = await client.execute('PRAGMA table_info(emails)');
  const col = info.rows.find(
    (r) => (r as Record<string, unknown>).name === 'postulacion_id',
  );
  if (!col) return;
  if ((col as Record<string, unknown>).notnull === 0) return;

  await client.executeMultiple(`
    PRAGMA foreign_keys = OFF;
    CREATE TABLE emails_nuevo (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      postulacion_id INTEGER,
      gmail_message_id TEXT,
      tipo TEXT NOT NULL CHECK (tipo IN ('postulacion','seguimiento','respuesta','otro')),
      tipo_seguimiento TEXT,
      asunto TEXT,
      remitente TEXT NOT NULL,
      destinatario TEXT NOT NULL,
      fecha TEXT NOT NULL,
      enviado INTEGER NOT NULL DEFAULT 1 CHECK (enviado IN (0,1)),
      contenido_resumen TEXT,
      cuerpo_html TEXT,
      tipo_respuesta TEXT,
      tipo_respuesta_fuente TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (postulacion_id) REFERENCES postulaciones(id) ON DELETE CASCADE
    );
    INSERT INTO emails_nuevo
      (id, postulacion_id, gmail_message_id, tipo, tipo_seguimiento, asunto,
       remitente, destinatario, fecha, enviado, contenido_resumen, cuerpo_html,
       tipo_respuesta, tipo_respuesta_fuente, created_at)
      SELECT id, postulacion_id, gmail_message_id, tipo, tipo_seguimiento, asunto,
             remitente, destinatario, fecha, enviado, contenido_resumen, cuerpo_html,
             tipo_respuesta, tipo_respuesta_fuente, created_at
      FROM emails;
    DROP TABLE emails;
    ALTER TABLE emails_nuevo RENAME TO emails;
    PRAGMA foreign_keys = ON;
  `);
}