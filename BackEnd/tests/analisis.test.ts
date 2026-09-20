import { describe, expect, it } from 'vitest';
import {
  clasificarRespuesta,
  esAlertaDeEmpleo,
  extraerEmailDireccion,
  matchearPostulacion,
} from '../src/services/analisis.service';

describe('clasificarRespuesta', () => {
  it('detecta rechazo por keywords en español', () => {
    expect(
      clasificarRespuesta({
        asunto: 'Re: Tu postulación',
        remitente: 'rrhh@empresa.com',
        cuerpo: 'Gracias por tu interés. No preseleccionado en esta oportunidad.',
      }),
    ).toBe('rechazo');
    expect(
      clasificarRespuesta({
        asunto: 'Resultado del proceso',
        remitente: 'rrhh@empresa.com',
        cuerpo: 'Hemos decidido no continuar con tu postulación.',
      }),
    ).toBe('rechazo');
    expect(
      clasificarRespuesta({
        asunto: 'Notificación',
        remitente: 'noreply@empresa.com',
        cuerpo: 'La empresa ha rechazado tu candidatura a la posición.',
      }),
    ).toBe('rechazo');
    expect(
      clasificarRespuesta({
        asunto: 'Update',
        remitente: 'hr@empresa.com',
        cuerpo: 'We are not selecting your profile at this time.',
      }),
    ).toBe('rechazo');
  });

  it('detecta entrevista / avance de proceso', () => {
    expect(
      clasificarRespuesta({
        asunto: 'Siguiente paso',
        remitente: 'rrhh@empresa.com',
        cuerpo: 'Te invitamos a una entrevista el próximo lunes.',
      }),
    ).toBe('entrevista');
    expect(
      clasificarRespuesta({
        asunto: 'Tu candidatura',
        remitente: 'hr@empresa.com',
        cuerpo: 'Queremos avanzar al siguiente paso del proceso.',
      }),
    ).toBe('entrevista');
    expect(
      clasificarRespuesta({
        asunto: 'Interview',
        remitente: 'recruiter@empresa.com',
        cuerpo: 'We would like to move you forward to the next stage.',
      }),
    ).toBe('entrevista');
  });

  it('detecta novedades', () => {
    expect(
      clasificarRespuesta({
        asunto: 'Novedades del proceso',
        remitente: 'rrhh@empresa.com',
        cuerpo: 'Te contamos las novedades del proceso.',
      }),
    ).toBe('novedad');
  });

  it('clasifica como contacto cualquier otra respuesta', () => {
    expect(
      clasificarRespuesta({
        asunto: 'Re: Consulta',
        remitente: 'rrhh@empresa.com',
        cuerpo: 'Hola, cualquier duda escribinos.',
      }),
    ).toBe('contacto');
  });

  it('trata las alertas de portales de empleo como "otro"', () => {
    expect(
      clasificarRespuesta({
        asunto: 'Trabajo Copado: 5 empleos que te pueden interesar',
        remitente: 'alertas@computrabajo.com',
        cuerpo: 'Nuevas ofertas laborales para tu perfil. Postulate ahora.',
      }),
    ).toBe('otro');
    expect(
      clasificarRespuesta({
        asunto: 'Nuevas ofertas que te pueden interesar',
        remitente: 'jobalerts-noreply@linkedin.com',
        cuerpo: 'Hay 12 nuevos empleos para vos.',
      }),
    ).toBe('otro');
    expect(
      clasificarRespuesta({
        asunto: 'Job Alert: Backend Developer',
        remitente: 'alerts@indeed.com',
        cuerpo: 'New jobs matching your search.',
      }),
    ).toBe('otro');
  });

  it('detecta y procesa actualizaciones de candidaturas de portales (NO las ignora)', () => {
    expect(
      clasificarRespuesta({
        asunto: 'Tu candidatura ha sido vista',
        remitente: 'candidaturas@computrabajo.com',
        cuerpo: 'La empresa Globant ha visto tu CV para el puesto Backend Engineer.',
      }),
    ).toBe('novedad');

    expect(
      clasificarRespuesta({
        asunto: 'La empresa ha revisado tu perfil',
        remitente: 'notificaciones@bumeran.com.ar',
        cuerpo: 'Tu candidatura continúa en el proceso de selección.',
      }),
    ).toBe('novedad');

    expect(
      clasificarRespuesta({
        asunto: 'Has avanzado a la siguiente etapa',
        remitente: 'jobs-noreply@linkedin.com',
        cuerpo: 'Queremos coordinar una entrevista para avanzar en el proceso.',
      }),
    ).toBe('entrevista');

    expect(
      clasificarRespuesta({
        asunto: 'Actualización del proceso',
        remitente: 'notificaciones@infojobs.net',
        cuerpo: 'Lamentablemente tu candidatura ha sido descartada por el empleador.',
      }),
    ).toBe('rechazo');
  });

  it('la palabra descartada en "rechazar" no confunde a "entrevista"', () => {
    expect(
      clasificarRespuesta({
        asunto: '',
        remitente: '',
        cuerpo: '',
      }),
    ).toBe('otro');
  });
});

describe('extraerEmailDireccion', () => {
  it('extrae la dirección de un header con nombre', () => {
    expect(
      extraerEmailDireccion('RRHH Empresa <rrhh@empresa.com>'),
    ).toBe('rrhh@empresa.com');
    expect(
      extraerEmailDireccion('"Ana López" <ana.lopez@empresa.com>'),
    ).toBe('ana.lopez@empresa.com');
  });

  it('devuelve el header limpio si es solo email', () => {
    expect(extraerEmailDireccion('rrhh@empresa.com')).toBe('rrhh@empresa.com');
  });

  it('devuelve null si no hay email', () => {
    expect(extraerEmailDireccion(null)).toBeNull();
    expect(extraerEmailDireccion('RRHH')).toBeNull();
  });
});

describe('matchearPostulacion', () => {
  const postulaciones = [
    { id: 1, puesto: 'Backend Engineer', empresa_nombre: 'Globant' },
    { id: 2, puesto: 'Frontend Dev', empresa_nombre: 'Meli' },
  ];

  it('matchea por el destinatario del último email enviado', () => {
    const emailsEnviados = [
      { postulacion_id: 1, destinatario: 'rrhh@globant.com' },
      { postulacion_id: 2, destinatario: 'hr@meli.com' },
    ];
    expect(
      matchearPostulacion({
        remitente: 'RRHH <rrhh@globant.com>',
        asunto: 'Re: Consulta',
        postulaciones,
        emailsEnviados,
      }),
    ).toBe(1);
  });

  it('matchea por asunto como fallback', () => {
    expect(
      matchearPostulacion({
        remitente: 'unknown@empresa.com',
        asunto: 'Tu postulación Backend Engineer',
        postulaciones,
        emailsEnviados: [],
      }),
    ).toBe(1);
    expect(
      matchearPostulacion({
        remitente: 'unknown@empresa.com',
        asunto: 'Globant',
        postulaciones,
        emailsEnviados: [],
      }),
    ).toBe(1);
  });

  it('devuelve null si no hay coincidencia', () => {
    expect(
      matchearPostulacion({
        remitente: 'otra@cosa.com',
        asunto: 'Publicidad',
        postulaciones,
        emailsEnviados: [],
      }),
    ).toBeNull();
  });

  it('matchea por dominio del remitente contra el nombre de la empresa', () => {
    const conMeli = [
      { id: 1, puesto: 'Backend Engineer', empresa_nombre: 'Globant' },
      { id: 2, puesto: 'Frontend Dev', empresa_nombre: 'Mercado Libre' },
    ];
    expect(
      matchearPostulacion({
        remitente: 'no-reply@mercadolibre.com',
        asunto: 'Comunicación',
        postulaciones: conMeli,
        emailsEnviados: [],
      }),
    ).toBe(2);
    expect(
      matchearPostulacion({
        remitente: 'hr@globant.net',
        asunto: 'Comunicación',
        postulaciones: conMeli,
        emailsEnviados: [],
      }),
    ).toBe(1);
  });

  it('no matchea por dominio si la empresa no guarda relación', () => {
    expect(
      matchearPostulacion({
        remitente: 'hola@google.com',
        asunto: 'Comunicación',
        postulaciones,
        emailsEnviados: [],
      }),
    ).toBeNull();
  });

  it('matchea por In-Reply-To o References con gmail_message_id enviado', () => {
    const emailsEnviados = [
      {
        postulacion_id: 1,
        destinatario: 'rrhh@globant.com',
        gmail_message_id: 'msg_12345_abc',
      },
    ];
    expect(
      matchearPostulacion({
        remitente: 'notificaciones@sistema.com',
        asunto: 'Respuesta automática',
        postulaciones,
        emailsEnviados,
        inReplyTo: '<msg_12345_abc>',
      }),
    ).toBe(1);
  });

  it('matchea por mención de empresa y puesto en el cuerpo aunque venga de un portal', () => {
    expect(
      matchearPostulacion({
        remitente: 'candidaturas@computrabajo.com',
        asunto: 'Novedades sobre tu postulación',
        cuerpo: 'Hola! La empresa Globant ha visto tu CV para el puesto Backend Engineer.',
        postulaciones,
        emailsEnviados: [],
      }),
    ).toBe(1);
  });
});

describe('esAlertaDeEmpleo', () => {
  it('detecta alertas de Computrabajo por remitente y asunto', () => {
    expect(
      esAlertaDeEmpleo(
        'alertas@computrabajo.com',
        'Trabajo Copado: 5 empleos para vos',
        'Nuevas ofertas que te pueden interesar.',
      ),
    ).toBe(true);
  });

  it('detecta job alerts de LinkedIn', () => {
    expect(
      esAlertaDeEmpleo(
        'jobalerts-noreply@linkedin.com',
        'Nuevas ofertas que te pueden interesar',
        'Hay 12 nuevos empleos para vos.',
      ),
    ).toBe(true);
  });

  it('no marca como alerta una actualización de candidatura', () => {
    expect(
      esAlertaDeEmpleo(
        'alertas@computrabajo.com',
        'Tu candidatura ha sido vista',
        'La empresa ha visto tu CV.',
      ),
    ).toBe(false);
  });

  it('no marca como alerta un correo normal de empresa', () => {
    expect(
      esAlertaDeEmpleo(
        'rrhh@empresa.com',
        'Entrevista la semana próxima',
        'Te invitamos a una entrevista.',
      ),
    ).toBe(false);
  });
});