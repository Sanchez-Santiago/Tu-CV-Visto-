import React from "react";
import { LegalPage, SeccionLegal } from "./LegalPage";

const EMAIL = "sanchez242018@gmail.com";

const INDICE = [
  { id: "objeto", label: "1. Objeto del servicio" },
  { id: "cuenta", label: "2. Cuenta, edad mínima y acceso" },
  { id: "uso", label: "3. Uso aceptable" },
  { id: "ia", label: "4. Inteligencia artificial como asistencia" },
  { id: "disponibilidad", label: "5. Disponibilidad y responsabilidad" },
  { id: "terminacion", label: "6. Terminación y eliminación" },
  { id: "cambios", label: "7. Cambios en los términos" },
  { id: "legislacion", label: "8. Legislación y contacto" },
];

export const TerminosView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <LegalPage
      titulo="Términos de Servicio de CVisto"
      subtitulo="Condiciones de uso de tu espacio de trabajo para la búsqueda laboral."
      vigencia="Última actualización: septiembre de 2026"
      indice={INDICE}
      onBack={onBack}
    >
      <SeccionLegal id="objeto" titulo="1. Objeto del servicio">
        <p>
          CVisto es un espacio de trabajo personal para organizar la búsqueda
          laboral: registra postulaciones, empresas y contactos, sincroniza
          Gmail para vincular correos, clasifica respuestas con inteligencia
          artificial y sugiere seguimientos.
        </p>
        <p>
          El servicio lo presta <strong>Santiago Javier Sanchez</strong>,
          persona física con residencia en la República Argentina, y está
          disponible para personas usuarias de cualquier país.
        </p>
      </SeccionLegal>

      <SeccionLegal id="cuenta" titulo="2. Cuenta, edad mínima y acceso">
        <p>
          Para usar CVisto necesitás una cuenta de Google: el registro y el
          inicio de sesión se hacen exclusivamente mediante Google OAuth 2.0.
          Sos responsable de mantener la seguridad de tu cuenta de Google.
        </p>
        <p>
          El servicio está destinado a personas de 16 años o más. Las personas
          menores de 16 años no deben crear una cuenta ni utilizar el servicio.
        </p>
        <p>
          Algunas funciones requieren que mantengas otorgados los permisos de
          Google (lectura y envío de correos). Si los revocás desde tu Cuenta
          de Google, esas funciones dejarán de estar disponibles.
        </p>
      </SeccionLegal>

      <SeccionLegal id="uso" titulo="3. Uso aceptable">
        <p>Al usar CVisto te comprometés a:</p>
        <ul>
          <li>Usar el servicio solo para tu búsqueda laboral personal.</li>
          <li>
            No incorporar datos personales de terceros sin base legítima ni
            información sensible innecesaria.
          </li>
          <li>
            No usar el servicio para spam, publicidad no solicitada ni envíos
            masivos ajenos a tus procesos de selección.
          </li>
          <li>
            No intentar vulnerar la seguridad del servicio ni acceder a cuentas
            ajenas.
          </li>
        </ul>
        <p>
          El tratamiento de tus datos personales se rige por la{" "}
          <a href="/privacidad">Política de Privacidad de CVisto</a>.
        </p>
      </SeccionLegal>

      <SeccionLegal id="ia" titulo="4. Inteligencia artificial como asistencia">
        <p>
          Las funciones de IA (clasificación de correos, detección de
          postulaciones, sugerencia de estados) son una asistencia y pueden
          contener errores. Las decisiones sobre tus postulaciones son siempre
          tuyas: revisá las sugerencias antes de actuar.
        </p>
        <p>
          La IA se ejecuta únicamente cuando la solicitás (botón Analizar IA)
          y puede apoyarse en proveedores externos según la configuración del
          servidor.
        </p>
      </SeccionLegal>

      <SeccionLegal id="disponibilidad" titulo="5. Disponibilidad y responsabilidad">
        <p>
          CVisto se ofrece "tal cual", sin garantías de disponibilidad
          ininterrumpida ni de resultados en tu búsqueda laboral. Pueden
          existir interrupciones por mantenimiento, fallas de proveedores
          (Google, hosting, IA) o causas fuera de nuestro control.
        </p>
        <p>
          En la máxima medida permitida por la ley, el responsable no será
          responsable por daños indirectos derivados del uso o la
          imposibilidad de uso del servicio.
        </p>
      </SeccionLegal>

      <SeccionLegal id="terminacion" titulo="6. Terminación y eliminación">
        <p>
          Podés dejar de usar CVisto en cualquier momento: basta con revocar
          el acceso desde tu Cuenta de Google y dejar de ingresar.
        </p>
        <p>
          Para solicitar la eliminación de tus datos escribí a{" "}
          <a href={`mailto:${EMAIL}`}>{EMAIL}</a>. También podés exportar tu
          información en JSON desde Configuración antes de eliminarla.
        </p>
      </SeccionLegal>

      <SeccionLegal id="cambios" titulo="7. Cambios en los términos">
        <p>
          Estos términos pueden actualizarse para reflejar cambios en el
          servicio, nuevas funcionalidades o normativa. Cuando haya cambios
          relevantes se actualizará la fecha de última actualización.
        </p>
      </SeccionLegal>

      <SeccionLegal id="legislacion" titulo="8. Legislación y contacto">
        <p>
          Estos términos se interpretan conforme a la legislación de la
          República Argentina.
        </p>
        <p>
          Responsable: Santiago Javier Sanchez. Contacto:{" "}
          <a href={`mailto:${EMAIL}`}>{EMAIL}</a>. Por razones de privacidad no
          se publican domicilio, teléfono ni identificación tributaria.
        </p>
      </SeccionLegal>
    </LegalPage>
  );
};
