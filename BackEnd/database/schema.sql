PRAGMA foreign_keys = ON;

-- =========================================================
-- USUARIOS
-- =========================================================

CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    nombre TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,

    perfil TEXT,

    pais TEXT,
    provincia TEXT,

    cv TEXT,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- EXPERIENCIA LABORAL
-- =========================================================

CREATE TABLE IF NOT EXISTS experiencias_laborales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    usuario_id INTEGER NOT NULL,

    empresa TEXT NOT NULL,
    puesto TEXT NOT NULL,

    fecha_inicio TEXT,
    fecha_fin TEXT,

    descripcion TEXT,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
);


-- =========================================================
-- PROYECTOS
-- =========================================================

CREATE TABLE IF NOT EXISTS proyectos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    usuario_id INTEGER NOT NULL,

    nombre TEXT NOT NULL,
    descripcion TEXT,

    tecnologias TEXT,

    url TEXT,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
);


-- =========================================================
-- CATEGORÍAS DE TRABAJO
-- =========================================================

CREATE TABLE IF NOT EXISTS categorias_trabajo (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    nombre TEXT NOT NULL UNIQUE,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- RELACIÓN USUARIO <-> CATEGORÍAS
-- =========================================================

CREATE TABLE IF NOT EXISTS usuario_categorias (
    usuario_id INTEGER NOT NULL,
    categoria_id INTEGER NOT NULL,

    PRIMARY KEY (usuario_id, categoria_id),

    FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE,

    FOREIGN KEY (categoria_id)
        REFERENCES categorias_trabajo(id)
        ON DELETE CASCADE
);


-- =========================================================
-- CONTACTOS DEL USUARIO
-- =========================================================

CREATE TABLE IF NOT EXISTS contactos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    usuario_id INTEGER NOT NULL,

    tipo TEXT NOT NULL,
    nombre TEXT,
    email TEXT,
    telefono TEXT,

    observaciones TEXT,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
);


-- =========================================================
-- EMPRESAS
-- =========================================================

CREATE TABLE IF NOT EXISTS empresas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    nombre TEXT NOT NULL,

    pais TEXT,
    provincia TEXT,
    ciudad TEXT,

    modalidad TEXT
        CHECK (modalidad IN (
            'presencial',
            'remoto',
            'hibrido',
            'no_especificado'
        )),

    cadencia_contacto INTEGER,

    observaciones TEXT,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- CONTACTOS DE RRHH
-- Una empresa puede tener varios contactos
-- =========================================================

CREATE TABLE IF NOT EXISTS contactos_rrhh (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    empresa_id INTEGER NOT NULL,

    nombre TEXT NOT NULL,
    email TEXT NOT NULL,

    cargo TEXT,

    observaciones TEXT,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (empresa_id)
        REFERENCES empresas(id)
        ON DELETE CASCADE,

    UNIQUE (empresa_id, email)
);


-- =========================================================
-- POSTULACIONES
-- =========================================================

CREATE TABLE IF NOT EXISTS postulaciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    usuario_id INTEGER NOT NULL,
    empresa_id INTEGER NOT NULL,

    puesto TEXT NOT NULL,

    modalidad TEXT
        CHECK (modalidad IN (
            'presencial',
            'remoto',
            'hibrido',
            'no_especificado'
        )),

    respondio INTEGER NOT NULL DEFAULT 0
        CHECK (respondio IN (0, 1)),

    estado TEXT NOT NULL DEFAULT 'pendiente'
        CHECK (estado IN (
            'pendiente',
            'en_proceso',
            'entrevista',
            'oferta',
            'aceptado',
            'rechazado',
            'cancelado'
        )),

    interes TEXT NOT NULL DEFAULT 'medio'
        CHECK (interes IN (
            'bajo',
            'medio',
            'alto'
        )),

    fuente TEXT,

    cantidad_mails_enviados INTEGER NOT NULL DEFAULT 0,

    fecha_postulacion TEXT,

    ultimo_contacto TEXT,

    proxima_contacto TEXT,

    observaciones TEXT,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE,

    FOREIGN KEY (empresa_id)
        REFERENCES empresas(id)
        ON DELETE CASCADE
);


-- =========================================================
-- CONTACTOS UTILIZADOS EN UNA POSTULACIÓN
-- Permite saber a qué persona de RRHH se contactó
-- =========================================================

CREATE TABLE IF NOT EXISTS postulacion_contactos (
    postulacion_id INTEGER NOT NULL,
    contacto_rrhh_id INTEGER NOT NULL,

    PRIMARY KEY (postulacion_id, contacto_rrhh_id),

    FOREIGN KEY (postulacion_id)
        REFERENCES postulaciones(id)
        ON DELETE CASCADE,

    FOREIGN KEY (contacto_rrhh_id)
        REFERENCES contactos_rrhh(id)
        ON DELETE CASCADE
);


-- =========================================================
-- EMAILS
-- Historial de emails enviados/recibidos
-- =========================================================

CREATE TABLE IF NOT EXISTS emails (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    postulacion_id INTEGER,

    gmail_message_id TEXT,

    tipo TEXT NOT NULL
        CHECK (tipo IN (
            'postulacion',
            'seguimiento',
            'respuesta',
            'otro'
        )),

    tipo_seguimiento TEXT,

    asunto TEXT,

    remitente TEXT NOT NULL,
    destinatario TEXT NOT NULL,

    fecha TEXT NOT NULL,

    enviado INTEGER NOT NULL DEFAULT 1
        CHECK (enviado IN (0, 1)),

    contenido_resumen TEXT,

    cuerpo_html TEXT,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (postulacion_id)
        REFERENCES postulaciones(id)
        ON DELETE CASCADE
);


-- =========================================================
-- SEGUIMIENTOS
-- Plan de contacto estratégico con cada empresa
-- =========================================================

CREATE TABLE IF NOT EXISTS seguimientos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    postulacion_id INTEGER NOT NULL,

    fecha_programada TEXT NOT NULL,

    tipo_seguimiento TEXT NOT NULL DEFAULT 'consulta'
        CHECK (tipo_seguimiento IN (
            'consulta',
            'novedad',
            'recordatorio',
            'nuevo_proyecto',
            'disponibilidad'
        )),

    enviado INTEGER NOT NULL DEFAULT 0
        CHECK (enviado IN (0, 1)),

    requiere_aprobacion INTEGER NOT NULL DEFAULT 1
        CHECK (requiere_aprobacion IN (0, 1)),

    fecha_envio TEXT,

    observaciones TEXT,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (postulacion_id)
        REFERENCES postulaciones(id)
        ON DELETE CASCADE
);


-- =========================================================
-- CUENTAS GOOGLE
-- Tokens OAuth por usuario para la integración con Gmail
-- =========================================================

CREATE TABLE IF NOT EXISTS cuentas_google (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    usuario_id INTEGER NOT NULL UNIQUE,
    google_id TEXT NOT NULL UNIQUE,

    access_token TEXT,
    refresh_token TEXT,

    token_expires_at TEXT,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
);


-- =========================================================
-- ÍNDICES
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_experiencias_usuario
ON experiencias_laborales(usuario_id);

CREATE INDEX IF NOT EXISTS idx_proyectos_usuario
ON proyectos(usuario_id);

CREATE INDEX IF NOT EXISTS idx_usuario_categorias_usuario
ON usuario_categorias(usuario_id);

CREATE INDEX IF NOT EXISTS idx_usuario_categorias_categoria
ON usuario_categorias(categoria_id);

CREATE INDEX IF NOT EXISTS idx_contactos_usuario
ON contactos(usuario_id);

CREATE INDEX IF NOT EXISTS idx_contactos_rrhh_empresa
ON contactos_rrhh(empresa_id);

CREATE INDEX IF NOT EXISTS idx_postulaciones_usuario
ON postulaciones(usuario_id);

CREATE INDEX IF NOT EXISTS idx_postulaciones_empresa
ON postulaciones(empresa_id);

CREATE INDEX IF NOT EXISTS idx_postulaciones_estado
ON postulaciones(estado);

CREATE INDEX IF NOT EXISTS idx_emails_postulacion
ON emails(postulacion_id);

CREATE INDEX IF NOT EXISTS idx_seguimientos_postulacion
ON seguimientos(postulacion_id);

CREATE INDEX IF NOT EXISTS idx_seguimientos_pendientes
ON seguimientos(enviado, fecha_programada);

CREATE INDEX IF NOT EXISTS idx_cuentas_google_usuario
ON cuentas_google(usuario_id);

CREATE INDEX IF NOT EXISTS idx_cuentas_google_google_id
ON cuentas_google(google_id);