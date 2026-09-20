import React from "react";
import { LegalPage, SeccionLegal } from "./LegalPage";

const EMAIL = "sanchez242018@gmail.com";

const INDICE = [
  { id: "responsable", label: "1. Responsable del tratamiento" },
  { id: "ambito", label: "2. Ámbito de aplicación" },
  { id: "edad", label: "3. Edad mínima" },
  { id: "datos", label: "4. Información que recopilamos" },
  { id: "correos", label: "5. Información de correos electrónicos" },
  { id: "gmail", label: "6. Uso de Gmail" },
  { id: "tokens", label: "7. Credenciales y tokens de Google OAuth" },
  { id: "ia", label: "8. Inteligencia artificial" },
  { id: "ia-datos", label: "9. Información enviada a proveedores de IA" },
  { id: "ia-proveedores", label: "10. Proveedores de IA" },
  { id: "decisiones", label: "11. Decisiones automatizadas" },
  { id: "cookies", label: "12. Datos técnicos, cookies y almacenamiento" },
  { id: "logs", label: "13. Registros técnicos" },
  { id: "no-solicitados", label: "14. Datos que no se solicitan" },
  { id: "finalidades", label: "15. Finalidades del tratamiento" },
  { id: "encargados", label: "16. Proveedores y encargados" },
  { id: "almacenamiento", label: "17. Almacenamiento de datos" },
  { id: "transferencias", label: "18. Transferencias internacionales" },
  { id: "proteccion", label: "19. Protección ante proveedores" },
  { id: "acceso", label: "20. Acceso interno a los datos" },
  { id: "seguridad", label: "21. Seguridad" },
  { id: "backups", label: "22. Copias de seguridad" },
  { id: "conservacion", label: "23. Conservación de datos" },
  { id: "derechos", label: "24. Derechos de las personas usuarias" },
  { id: "revocacion", label: "25. Revocación de acceso a Google" },
  { id: "terceros", label: "26. Información de terceros" },
  { id: "publicidad", label: "27. Ausencia de publicidad personalizada" },
  { id: "pagos", label: "28. Ausencia de pagos" },
  { id: "enlaces", label: "29. Enlaces externos" },
  { id: "cambios", label: "30. Cambios en la política" },
  { id: "legislacion", label: "31. Legislación aplicable" },
  { id: "contacto", label: "32. Contacto sobre privacidad" },
  { id: "autoridad", label: "33. Autoridad de control" },
  { id: "aceptacion", label: "34. Aceptación" },
];

export const PrivacidadView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <LegalPage
      titulo="Política de Privacidad de CVisto"
      subtitulo="Cómo tratamos tus datos personales en CVisto."
      vigencia="Última actualización: septiembre de 2026"
      indice={INDICE}
      onBack={onBack}
    >
      <SeccionLegal id="responsable" titulo="1. Responsable del tratamiento">
        <p>
          El responsable del tratamiento de los datos personales gestionados a
          través de CVisto es <strong>Santiago Javier Sanchez</strong>, persona
          física, con residencia en la República Argentina.
        </p>
        <p>
          Correo electrónico general y de privacidad:{" "}
          <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.
        </p>
        <p>
          Por razones de privacidad y seguridad, esta política no publica el
          domicilio particular, número telefónico ni identificación tributaria
          del responsable.
        </p>
      </SeccionLegal>

      <SeccionLegal id="ambito" titulo="2. Ámbito de aplicación">
        <p>
          CVisto está disponible para personas usuarias de cualquier país. El
          servicio se desarrolla y administra desde Argentina y puede ser
          utilizado internacionalmente.
        </p>
        <p>
          Debido a la utilización de proveedores tecnológicos internacionales,
          determinados datos pueden almacenarse o procesarse fuera de Argentina.
        </p>
      </SeccionLegal>

      <SeccionLegal id="edad" titulo="3. Edad mínima">
        <p>
          CVisto está destinado a personas de 16 años o más. Las personas
          menores de 16 años no deben crear una cuenta ni utilizar el servicio.
        </p>
        <p>
          Cuando corresponda, las personas menores de edad deberán utilizar el
          servicio de acuerdo con las normas aplicables en su jurisdicción y con
          la intervención o autorización de sus representantes legales.
        </p>
      </SeccionLegal>

      <SeccionLegal id="datos" titulo="4. Información que recopilamos">
        <p>
          CVisto recopila la información necesaria para proporcionar sus
          funcionalidades.
        </p>
        <p>
          Mediante Google puede recibir nombre, correo electrónico e
          identificador único de cuenta (sub). La fotografía de perfil no se
          almacena.
        </p>
        <p>
          El perfil profesional puede incluir nombre, email, teléfono, LinkedIn,
          sitio web, perfil profesional, CV/resumen, país, provincia,
          categorías, experiencia, proyectos y firma.
        </p>
        <p>
          Las empresas pueden incluir nombre, país, provincia, ciudad y
          modalidad. Los contactos de RR. HH. pueden incluir nombre, email y
          cargo.
        </p>
        <p>
          Las postulaciones pueden incluir puesto, estado, interés, fechas,
          observaciones y seguimientos.
        </p>
      </SeccionLegal>

      <SeccionLegal id="correos" titulo="5. Información de correos electrónicos">
        <p>
          Las funcionalidades de correo pueden procesar asunto, remitente,
          destinatario, CC, Reply-To, fecha, contenido, HTML, enlaces y nombres
          de archivos adjuntos.
        </p>
        <p>
          El contenido puede contener información personal de la persona usuaria
          o de terceros. Se recomienda evitar información innecesaria.
        </p>
      </SeccionLegal>

      <SeccionLegal id="gmail" titulo="6. Uso de Gmail">
        <p>
          CVisto puede utilizar servicios de Google para operaciones
          relacionadas con correo electrónico. Los envíos se realizan a
          solicitud de la persona usuaria.
        </p>
        <p>CVisto solicita los siguientes permisos (scopes) de Google:</p>
        <ul>
          <li>
            <strong>openid, email, profile</strong>: identificarte y crear tu
            perfil (nombre y correo).
          </li>
          <li>
            <strong>gmail.readonly</strong>: leer tus correos para vincularlos
            con tus postulaciones y detectar respuestas.
          </li>
          <li>
            <strong>gmail.send</strong>: enviar seguimientos y correos que vos
            redactes o apruebes desde la app.
          </li>
        </ul>
        <p>
          CVisto no utiliza el correo electrónico para publicidad comercial
          propia ni vende direcciones de correo electrónico a terceros.
        </p>
      </SeccionLegal>

      <SeccionLegal id="tokens" titulo="7. Credenciales y tokens de Google OAuth">
        <p>
          CVisto utiliza OAuth 2.0 para autenticación mediante Google y
          determinadas funcionalidades autorizadas.
        </p>
        <p>
          Puede recibir y almacenar access_token y refresh_token. El
          access_token es temporal y el refresh_token permite obtener nuevos
          tokens mientras la autorización continúe vigente.
        </p>
        <p>
          Los tokens se almacenan en la infraestructura de CVisto y se utilizan
          para las funcionalidades autorizadas. CVisto no comercializa ni
          publica deliberadamente estos tokens.
        </p>
        <p>
          La persona usuaria puede revocar el acceso desde los mecanismos de
          administración de su Cuenta de Google. La revocación puede hacer que
          determinadas funciones dejen de estar disponibles.
        </p>
      </SeccionLegal>

      <SeccionLegal id="ia" titulo="8. Inteligencia artificial">
        <p>
          CVisto utiliza IA para clasificación de correos, detección de
          postulaciones, extracción de empresa y puesto y sugerencia de estados.
        </p>
      </SeccionLegal>

      <SeccionLegal id="ia-datos" titulo="9. Información enviada a proveedores de IA">
        <p>
          Para ejecutar funciones de IA pueden enviarse asunto, remitente,
          destinatario, CC, Reply-To, fecha, contenido del correo de hasta
          aproximadamente 2500 caracteres, enlaces y nombres de archivos
          adjuntos.
        </p>
        <p>
          Esta información puede contener datos personales. Los proveedores
          externos aplican sus propias políticas y condiciones. Dependiendo del
          proveedor, configuración y modalidad, pueden existir condiciones
          distintas respecto del uso de prompts para entrenamiento.
        </p>
        <p>
          CVisto no utiliza deliberadamente los datos de sus usuarios para
          entrenar sus propios modelos. Se recomienda no enviar información
          personal, confidencial o sensible innecesaria.
        </p>
      </SeccionLegal>

      <SeccionLegal id="ia-proveedores" titulo="10. Proveedores de IA">
        <p>
          Según la configuración y disponibilidad del servidor, CVisto puede
          utilizar Google Gemini, Groq, OpenRouter, OpenAI y Anthropic mediante
          mecanismos de fallback.
        </p>
      </SeccionLegal>

      <SeccionLegal id="decisiones" titulo="11. Decisiones automatizadas">
        <p>
          CVisto puede utilizar IA para sugerir o actualizar estados de
          postulaciones, por ejemplo rechazo, entrevista u oferta. Estas
          funciones pueden contener errores y deben considerarse asistencia, no
          una determinación definitiva.
        </p>
      </SeccionLegal>

      <SeccionLegal id="cookies" titulo="12. Datos técnicos, cookies y almacenamiento local">
        <p>
          CVisto utiliza cookies de sesión como <strong>cvisto_token</strong> y{" "}
          <strong>cvisto_logged</strong>. La cookie de autenticación utiliza
          HttpOnly y Secure en producción.
        </p>
        <p>
          Puede utilizar sessionStorage para información de sesión y
          localStorage para la preferencia de tema claro/oscuro.
        </p>
        <p>
          No utiliza actualmente Google Analytics ni mecanismos de seguimiento
          publicitario.
        </p>
      </SeccionLegal>

      <SeccionLegal id="logs" titulo="13. Registros técnicos">
        <p>
          CVisto puede registrar ruta, código de respuesta y duración de
          solicitudes para supervisar el funcionamiento y detectar errores. No
          registra deliberadamente la dirección IP como parte de sus registros
          propios ni almacena deliberadamente cuerpos de solicitudes en dichos
          logs.
        </p>
      </SeccionLegal>

      <SeccionLegal id="no-solicitados" titulo="14. Datos que CVisto no solicita deliberadamente">
        <p>
          CVisto no solicita deliberadamente DNI, CUIL, fecha de nacimiento,
          domicilio particular, coordenadas GPS, información bancaria, tarjetas,
          información financiera, datos biométricos, salud, religión, opiniones
          políticas, orientación sexual u origen étnico o racial.
        </p>
        <p>
          Un correo procesado voluntariamente podría contener información
          sensible. Se recomienda no incorporar información sensible que no sea
          necesaria.
        </p>
      </SeccionLegal>

      <SeccionLegal id="finalidades" titulo="15. Finalidades del tratamiento">
        <p>
          Los datos pueden utilizarse para administrar la cuenta, autenticar,
          mantener la sesión, gestionar el perfil, empresas, contactos,
          postulaciones y seguimientos, procesar correos, permitir envíos
          solicitados, ejecutar IA, mantener seguridad y funcionamiento, generar
          estadísticas internas, detectar errores y cumplir obligaciones
          legales.
        </p>
        <p>
          CVisto no utiliza los datos para publicidad dirigida ni comercializa
          los datos de sus usuarios.
        </p>
      </SeccionLegal>

      <SeccionLegal id="encargados" titulo="16. Proveedores y encargados del tratamiento">
        <p>
          CVisto utiliza Google, Turso, Render y Netlify para autenticación,
          correo, base de datos y hosting. Según la configuración, puede
          utilizar Groq, OpenRouter, OpenAI y Anthropic para IA.
        </p>
      </SeccionLegal>

      <SeccionLegal id="almacenamiento" titulo="17. Almacenamiento de datos">
        <p>
          La información se almacena principalmente en una base de datos
          proporcionada por Turso. La infraestructura utilizada está asociada
          actualmente con AWS us-east-1, en Estados Unidos.
        </p>
        <p>
          Las firmas pueden almacenarse como datos Base64 dentro de la base de
          datos. CVisto no mantiene actualmente almacenamiento independiente
          para conservar adjuntos de correos.
        </p>
      </SeccionLegal>

      <SeccionLegal id="transferencias" titulo="18. Transferencias internacionales de datos">
        <p>
          Determinados datos pueden almacenarse, procesarse o transmitirse
          fuera de Argentina mediante Google, Turso, Render, Netlify y
          proveedores de IA.
        </p>
        <p>
          La legislación argentina establece reglas específicas para
          transferencias internacionales. CVisto procurará utilizar proveedores
          y mecanismos que permitan niveles adecuados de protección y, cuando
          resulte necesario, garantías contractuales u otros mecanismos
          reconocidos por la normativa.
        </p>
        <p>
          Las transferencias podrán basarse, cuando corresponda, en un nivel
          adecuado de protección, una excepción legal, consentimiento expreso
          cuando corresponda, cláusulas contractuales adecuadas u otro
          mecanismo reconocido por la legislación vigente.
        </p>
      </SeccionLegal>

      <SeccionLegal id="proteccion" titulo="19. Protección de información almacenada por proveedores">
        <p>
          CVisto procura limitar la información transmitida a cada proveedor a
          aquella necesaria para ejecutar la funcionalidad correspondiente. La
          información enviada a proveedores externos queda sujeta también a sus
          condiciones de tratamiento y seguridad.
        </p>
      </SeccionLegal>

      <SeccionLegal id="acceso" titulo="20. Acceso interno a los datos">
        <p>
          CVisto no cuenta actualmente con un panel administrativo para que
          terceros consulten libremente la información de usuarios. No existen
          roles internos de soporte con acceso rutinario a las cuentas.
        </p>
      </SeccionLegal>

      <SeccionLegal id="seguridad" titulo="21. Seguridad">
        <p>
          CVisto implementa HTTPS en producción, Google OAuth 2.0, cookies
          HttpOnly y Secure, JWT, separación de componentes y controles de
          acceso.
        </p>
        <p>
          Los tokens OAuth de Google son información confidencial y se
          almacenan para permitir funcionalidades autorizadas. CVisto procura
          proteger estas credenciales frente a acceso, divulgación,
          modificación o utilización no autorizada.
        </p>
        <p>
          Ningún sistema puede garantizar seguridad absoluta frente a todos los
          riesgos informáticos.
        </p>
      </SeccionLegal>

      <SeccionLegal id="backups" titulo="22. Copias de seguridad">
        <p>
          La base de datos puede contar con mecanismos automáticos de respaldo
          proporcionados por Turso. CVisto no mantiene actualmente un sistema
          independiente de copias administrado directamente por el responsable.
        </p>
      </SeccionLegal>

      <SeccionLegal id="conservacion" titulo="23. Conservación de datos">
        <p>
          CVisto conserva los datos mientras sean necesarios para proporcionar
          el servicio, mantener la cuenta y cumplir las finalidades descritas.
        </p>
        <p>
          Actualmente no existe una política automatizada de eliminación por
          plazo. La persona usuaria puede solicitar la eliminación mediante{" "}
          <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.
        </p>
        <p>
          Determinada información puede conservarse durante un período adicional
          cuando exista obligación legal, contractual, técnica o de seguridad.
        </p>
      </SeccionLegal>

      <SeccionLegal id="derechos" titulo="24. Derechos de las personas usuarias">
        <p>
          La persona usuaria puede solicitar acceso, rectificación,
          actualización y eliminación de sus datos mediante{" "}
          <a href={`mailto:${EMAIL}`}>{EMAIL}</a>, sujeto a la normativa
          aplicable.
        </p>
        <p>
          CVisto permite actualmente exportar determinados datos de la cuenta
          en formato JSON y modificar información del perfil.
        </p>
      </SeccionLegal>

      <SeccionLegal id="revocacion" titulo="25. Revocación de acceso a Google">
        <p>
          La persona usuaria puede revocar los permisos otorgados a CVisto
          desde su Cuenta de Google. La revocación puede impedir funciones que
          requieran autorización.
        </p>
        <p>
          La revocación no implica necesariamente la eliminación de los datos
          ya almacenados en CVisto. Para solicitarla debe utilizarse el correo
          de privacidad.
        </p>
      </SeccionLegal>

      <SeccionLegal id="terceros" titulo="26. Información de terceros">
        <p>
          Cuando la persona usuaria incorpora contactos de Recursos Humanos,
          correos u otros datos de terceros, es responsable de utilizarlos de
          forma legítima y evitar información personal innecesaria.
        </p>
      </SeccionLegal>

      <SeccionLegal id="publicidad" titulo="27. Ausencia de publicidad personalizada">
        <p>
          CVisto no utiliza actualmente información personal para crear
          perfiles publicitarios ni vende información personal a anunciantes.
        </p>
      </SeccionLegal>

      <SeccionLegal id="pagos" titulo="28. Ausencia de pagos">
        <p>
          CVisto no procesa pagos ni almacena actualmente datos de tarjetas,
          cuentas bancarias o información financiera.
        </p>
      </SeccionLegal>

      <SeccionLegal id="enlaces" titulo="29. Enlaces externos">
        <p>
          Los servicios externos vinculados desde CVisto pueden tener sus
          propias políticas de privacidad. CVisto no controla sus prácticas de
          privacidad.
        </p>
      </SeccionLegal>

      <SeccionLegal id="cambios" titulo="30. Cambios en la Política de Privacidad">
        <p>
          Esta política puede modificarse para reflejar cambios en CVisto,
          nuevas funcionalidades, proveedores, prácticas de tratamiento,
          seguridad o normativa.
        </p>
        <p>
          Cuando existan cambios relevantes, se actualizará la fecha de última
          actualización y, cuando corresponda, se informará mediante los
          mecanismos disponibles.
        </p>
      </SeccionLegal>

      <SeccionLegal id="legislacion" titulo="31. Legislación aplicable">
        <p>
          Esta política se redacta teniendo en consideración la normativa
          aplicable en materia de protección de datos personales en Argentina,
          incluyendo la Ley N.º 25.326 y su normativa complementaria.
        </p>
        <p>
          Cuando corresponda por la ubicación de la persona usuaria o por la
          naturaleza del tratamiento, podrán resultar aplicables otras normas
          de protección de datos.
        </p>
      </SeccionLegal>

      <SeccionLegal id="contacto" titulo="32. Contacto sobre privacidad">
        <p>Responsable: Santiago Javier Sanchez. Tipo: Persona física. País: República Argentina.</p>
        <p>
          Correo general y de privacidad:{" "}
          <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.
        </p>
        <p>
          El correo puede utilizarse para solicitar acceso, rectificación,
          actualización, eliminación o información sobre el tratamiento de
          datos.
        </p>
      </SeccionLegal>

      <SeccionLegal id="autoridad" titulo="33. Autoridad de control">
        <p>
          En Argentina, la autoridad de aplicación en materia de protección de
          datos personales es la Agencia de Acceso a la Información Pública
          (AAIP).
        </p>
      </SeccionLegal>

      <SeccionLegal id="aceptacion" titulo="34. Aceptación">
        <p>
          Al registrarse y utilizar CVisto, la persona usuaria declara haber
          tenido acceso a esta Política de Privacidad y haber podido conocer
          las condiciones aplicables al tratamiento de sus datos personales.
        </p>
        <p>
          El uso de CVisto implica la aceptación de las prácticas descritas en
          esta política, dentro de los límites establecidos por la legislación
          aplicable.
        </p>
        <p>
          Santiago Javier Sanchez — <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
        </p>
      </SeccionLegal>
    </LegalPage>
  );
};
