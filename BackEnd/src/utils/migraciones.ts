import type { Client } from '@libsql/client';

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
}

export async function crearTablaFirmas(client: Client): Promise<void> {
  await client.execute(`
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
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (postulacion_id) REFERENCES postulaciones(id) ON DELETE CASCADE
    );
    INSERT INTO emails_nuevo
      (id, postulacion_id, gmail_message_id, tipo, tipo_seguimiento, asunto,
       remitente, destinatario, fecha, enviado, contenido_resumen, cuerpo_html,
       created_at)
      SELECT id, postulacion_id, gmail_message_id, tipo, tipo_seguimiento, asunto,
             remitente, destinatario, fecha, enviado, contenido_resumen, cuerpo_html,
             created_at
      FROM emails;
    DROP TABLE emails;
    ALTER TABLE emails_nuevo RENAME TO emails;
    PRAGMA foreign_keys = ON;
  `);
}