import type { TipoSeguimiento } from '../types/common';
import type { ExperienciaRow, ProyectoRow } from '../types/models';
import { EmpresaModel } from '../models/empresa.model';
import { ExperienciaModel } from '../models/experiencia.model';
import { PostulacionContactoModel } from '../models/postulacion-contacto.model';
import { PostulacionModel } from '../models/postulacion.model';
import { ProyectoModel } from '../models/proyecto.model';
import { UsuarioModel } from '../models/usuario.model';
import { NotFoundError } from '../utils/errors';

export interface PlantillaGenerada {
  asunto: string;
  cuerpo: string;
}

export interface PlantillaInput {
  tipo: TipoSeguimiento;
  usuarioId: number;
  postulacionId: number;
}

export const PlantillaService = {
  async generar(input: PlantillaInput): Promise<PlantillaGenerada> {
    const postulacion = await PostulacionModel.obtenerPorId(
      input.postulacionId,
    );
    if (!postulacion) {
      throw new NotFoundError(
        `Postulación ${input.postulacionId} no encontrada`,
      );
    }

    const usuario = await UsuarioModel.obtenerPorId(input.usuarioId);
    if (!usuario) {
      throw new NotFoundError(`Usuario ${input.usuarioId} no encontrado`);
    }

    const empresa =
      postulacion.empresa_id !== null
        ? await EmpresaModel.obtenerPorId(postulacion.empresa_id)
        : null;

    const contactos =
      await PostulacionContactoModel.listarContactosDePostulacion(
        input.postulacionId,
      );
    const contactoNombre = contactos[0]?.nombre ?? null;

    const proyectos = await ProyectoModel.listarPorUsuario(input.usuarioId);
    const experiencias = await ExperienciaModel.listarPorUsuario(
      input.usuarioId,
    );

    const nombreEmpresa = empresa?.nombre ?? 'la empresa';
    const saludo = contactoNombre
      ? `Hola ${primerNombre(contactoNombre)},`
      : 'Hola,';
    const firma = [
      '',
      usuario.nombre,
      usuario.email,
      usuario.perfil ? `Perfil: ${usuario.perfil}` : null,
    ]
      .filter(Boolean)
      .join(' · ');

    const asunto = construirAsunto({
      tipo: input.tipo,
      nombreUsuario: usuario.nombre,
      puesto: postulacion.puesto,
      empresa: nombreEmpresa,
      proyecto: proyectos[0]?.nombre ?? null,
    });

    const cuerpo = construirCuerpo({
      tipo: input.tipo,
      saludo,
      firma,
      nombreEmpresa,
      puesto: postulacion.puesto,
      perfil: usuario.perfil,
      proyectos: proyectos.slice(0, 3),
      experiencias: experiencias.slice(0, 2),
    });

    return { asunto, cuerpo };
  },
};

function construirAsunto(input: {
  tipo: TipoSeguimiento;
  nombreUsuario: string;
  puesto: string;
  empresa: string;
  proyecto: string | null;
}): string {
  switch (input.tipo) {
    case 'nuevo_proyecto':
      return input.proyecto
        ? `Nuevo proyecto: ${input.proyecto}`
        : `Nuevo proyecto – ${input.nombreUsuario}`;
    case 'consulta':
      return `Consulta – ${input.puesto} en ${input.empresa}`;
    case 'recordatorio':
      return `Mantenerme en contacto – ${input.nombreUsuario}`;
    case 'disponibilidad':
      return `Disponibilidad – ${input.nombreUsuario}`;
    case 'novedad':
    default:
      return `Actualización de mi perfil – ${input.nombreUsuario}`;
  }
}

function construirCuerpo(input: {
  tipo: TipoSeguimiento;
  saludo: string;
  firma: string;
  nombreEmpresa: string;
  puesto: string;
  perfil: string | null;
  proyectos: ProyectoRow[];
  experiencias: ExperienciaRow[];
}): string {
  const { tipo, saludo, firma, nombreEmpresa, puesto } = input;
  const secciones: string[] = [saludo, ''];

  switch (tipo) {
    case 'nuevo_proyecto':
      secciones.push(
        `Quería compartirles un proyecto en el que vengo trabajando y que quizás puede interesarles en ${nombreEmpresa}.`,
        '',
      );
      secciones.push(...descripcionProyectos(input.proyectos, true));
      break;
    case 'consulta':
      secciones.push(
        `Quería saber si hubo novedades en el proceso y, sobre todo, reafirmar que sigo muy interesado en el puesto de ${puesto} en ${nombreEmpresa}.`,
        '',
      );
      secciones.push(...lineaPerfil(input.perfil));
      break;
    case 'recordatorio':
      secciones.push(
        `Solo quería dejarles presente que sigo muy interesado en ${nombreEmpresa} y en el puesto de ${puesto}.`,
        '',
      );
      secciones.push(...lineaPerfil(input.perfil));
      break;
    case 'disponibilidad':
      secciones.push(
        `Quería comentarles que sigo disponible y muy motivado ante una posible oportunidad en ${nombreEmpresa} para el puesto de ${puesto}.`,
        '',
      );
      secciones.push(...lineaPerfil(input.perfil));
      break;
    case 'novedad':
    default:
      secciones.push(
        `Quería mantenerme en contacto y compartirles algunas novedades. Sigo muy interesado en ${nombreEmpresa} y en el puesto de ${puesto}.`,
        '',
      );
      secciones.push(...descripcionProyectos(input.proyectos, false));
      secciones.push(...lineaPerfil(input.perfil));
  }

  secciones.push(
    '',
    'Sigo a disposición para conversar cuando lo consideren. Quedo atento.',
    '',
    firma,
  );

  return secciones.join('\n');
}

function descripcionProyectos(
  proyectos: ProyectoRow[],
  soloPrincipal: boolean,
): string[] {
  if (proyectos.length === 0) {
    return [
      'Sigo trabajando en proyectos propios y profundizando mis conocimientos.',
    ];
  }
  const seleccion = soloPrincipal ? proyectos.slice(0, 1) : proyectos;
  const lineas = seleccion.map((proyecto) => {
    const tecnologia = proyecto.tecnologias?.trim()
      ? ` (${proyecto.tecnologias})`
      : '';
    const descripcion = proyecto.descripcion?.trim()
      ? ` — ${proyecto.descripcion}`
      : '';
    const url = proyecto.url?.trim() ? ` · ${proyecto.url}` : '';
    return `• ${proyecto.nombre}${tecnologia}${descripcion}${url}`;
  });
  return ['Algunos de mis últimos proyectos:', ...lineas];
}

function lineaPerfil(perfil: string | null): string[] {
  return perfil?.trim()
    ? [`Resumen de mi perfil: ${perfil.trim()}`]
    : [
        'Sigo enfocado en aportar valor y seguir creciendo profesionalmente.',
      ];
}

function primerNombre(nombre: string): string {
  return nombre.trim().split(/\s+/)[0] ?? '';
}