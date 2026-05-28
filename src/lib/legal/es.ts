// src/lib/legal/es.ts
// ============================================================
// CONTENIDO LEGAL — ESPAÑOL (MASTER / fuente de verdad)
// Las traducciones EN/PT/IT derivan de este archivo.
// ============================================================

import type { LegalDocSet } from "./types";

const LAST_UPDATED = "2026-05-28";

export const LEGAL_ES: LegalDocSet = {
  privacy: {
    title: "Política de Privacidad",
    lastUpdated: LAST_UPDATED,
    draft: false,
    intro:
      "Esta Política de Privacidad describe cómo Rowi recolecta, usa, comparte y protege tus datos personales. Rowi opera la plataforma de Emotional Budgeting y Vital Signs basada en la metodología Six Seconds. Tu privacidad es un principio central de nuestro producto, no un trámite.",
    sections: [
      {
        heading: "1. Quién es responsable de tus datos",
        body: [
          "Rowi, con operaciones gestionadas desde Perú, es el responsable del tratamiento de los datos personales que recolecta a través de esta plataforma para usuarios individuales.",
          "Cuando usás Rowi como parte de tu empresa, institución educativa u organización (cuenta B2B), esa organización es el responsable del tratamiento (controlador) de tus datos, y Rowi actúa como encargado del tratamiento (procesador) siguiendo sus instrucciones. En ese caso, las políticas de privacidad de tu organización también aplican.",
          "Six Seconds es una entidad independiente que provee la metodología científica (SEI, Brain Talents, Vital Signs) y datos de referencia (benchmark). Six Seconds no es responsable de la operación de esta plataforma. Ver el 'Aviso sobre Six Seconds' para más detalle.",
        ],
      },
      {
        heading: "2. Qué datos recolectamos",
        body: [
          "- Datos de cuenta: nombre, correo electrónico, idioma preferido, país, foto de perfil.",
          "- Datos de medición emocional: respuestas a evaluaciones (Vital Signs, pulse points), competencias SEI, Brain Talents, debriefs.",
          "- Datos de relaciones: vínculos familiares, relaciones laborales (manager/reportes), engagements de servicio que declares.",
          "- Datos técnicos: dirección IP, tipo de dispositivo, navegador, logs de acceso.",
          "- Datos de pago: gestionados por Stripe; Rowi no almacena números de tarjeta.",
        ],
      },
      {
        heading: "3. Para qué usamos tus datos (bases legales)",
        body: [
          "- Prestar el servicio (ejecución del contrato): mostrarte tus mediciones, generar reportes, habilitar las funciones que activás.",
          "- Mejorar el producto y la investigación (interés legítimo y/o consentimiento explícito): refinar el modelo BE2GROW y los frameworks. El uso para investigación se rige por el 'Aviso de Investigación' y requiere tu consentimiento explícito y revocable.",
          "- Comunicaciones transaccionales (ejecución del contrato): confirmaciones, invitaciones, recordatorios.",
          "- Cumplimiento legal y seguridad (obligación legal e interés legítimo).",
        ],
      },
      {
        heading: "4. Uso de datos para investigación",
        body: [
          "Rowi es también una plataforma de investigación sobre inteligencia emocional. Tus datos pueden contribuir a refinar nuestros modelos, SIEMPRE bajo salvaguardas:",
          "- Consentimiento explícito y separado del uso básico del producto. Podés revocarlo en cualquier momento.",
          "- Anonimización o seudonimización antes de cualquier análisis agregado.",
          "- Regla de N≥5: ningún dato agregado de equipo u organización se muestra si hay menos de 5 personas, para evitar reidentificación.",
          "- Cinco niveles de visibilidad: personal, agregado de equipo, agregado de organización, comunidad pública, y lente de investigación.",
          "- Toda consulta de investigación queda registrada en una auditoría de accesos (ResearchAccessAudit).",
          "Ver el 'Aviso de Investigación' para el detalle completo y el flujo de consentimiento.",
        ],
      },
      {
        heading: "5. Con quién compartimos datos",
        body: [
          "- Proveedores de servicio (encargados): Stripe (pagos), Resend (correo), proveedores de infraestructura (Vercel, Neon), bajo contratos de tratamiento de datos.",
          "- Six Seconds: en su rol de socio metodológico y científico, puede acceder a datos anonimizados/agregados para fines de investigación, conforme al nivel de visibilidad 'six_seconds_team' y siempre bajo auditoría.",
          "- Tu organización: si usás una cuenta B2B, los datos agregados (N≥5) pueden ser visibles para administradores de tu organización según el rol.",
          "- Nunca vendemos tus datos personales.",
        ],
      },
      {
        heading: "6. Transferencias internacionales",
        body: [
          "Rowi opera con infraestructura que puede procesar datos fuera de tu país de residencia. Aplicamos como piso de protección el Reglamento General de Protección de Datos de la UE (GDPR), adaptado por jurisdicción (Perú: Ley N° 29733; Ecuador: LOPDP). Cuando entremos a mercados con requisitos de residencia de datos (por ejemplo, China bajo PIPL), implementaremos las medidas correspondientes.",
        ],
      },
      {
        heading: "7. Tus derechos",
        body: [
          "Tenés derecho a: acceder a tus datos, rectificarlos, suprimirlos, oponerte a su tratamiento, solicitar la portabilidad y revocar consentimientos.",
          "Podés ejercer la mayoría de estos derechos directamente desde la sección de Privacidad de tu cuenta, incluyendo la exportación de tus datos.",
          "Para solicitudes adicionales, escribí a privacidad@rowiia.com.",
        ],
      },
      {
        heading: "8. Retención",
        body: [
          "Conservamos tus datos mientras tu cuenta esté activa y por el período necesario para cumplir obligaciones legales. Al eliminar tu cuenta, tus datos personales se eliminan o anonimizan, salvo lo que debamos conservar por ley.",
        ],
      },
      {
        heading: "9. Seguridad",
        body: [
          "Aplicamos cifrado en tránsito y en reposo para datos sensibles, control de acceso por roles, y registro de auditoría. Ningún sistema es 100% infalible, pero tratamos la seguridad como prioridad.",
        ],
      },
      {
        heading: "10. Contacto",
        body: [
          "Responsable: Rowi, con operaciones gestionadas desde Perú. Contacto de privacidad: privacidad@rowiia.com. Para consultas legales: legal@rowiia.com.",
        ],
      },
    ],
  },

  terms: {
    title: "Términos de Servicio",
    lastUpdated: LAST_UPDATED,
    draft: false,
    intro:
      "Estos Términos rigen el uso de la plataforma Rowi. Al crear una cuenta o usar el servicio, aceptás estos Términos.",
    sections: [
      {
        heading: "1. Quiénes somos",
        body: [
          "Rowi es una plataforma de Emotional Budgeting y Vital Signs basada en la metodología Six Seconds, con operaciones gestionadas desde Perú. Rowi es una entidad independiente, única responsable de la operación de esta plataforma.",
        ],
      },
      {
        heading: "2. Uso del servicio",
        body: [
          "Debés ser mayor de edad o contar con autorización de tu representante legal. Sos responsable de la veracidad de los datos que ingresás y de mantener la confidencialidad de tus credenciales.",
          "No podés usar Rowi para fines ilícitos, para vulnerar la privacidad de terceros, ni para extraer datos de forma automatizada sin autorización.",
        ],
      },
      {
        heading: "3. Propiedad intelectual",
        body: [
          "La metodología Six Seconds (SEI, Brain Talents, Vital Signs y marcas asociadas) es propiedad de Six Seconds y se usa bajo licencia/alianza. 'Six Seconds' es una marca registrada de su titular y no se traduce ni se usa fuera de los términos de dicha licencia.",
          "El software, diseño e implementación de la plataforma Rowi son propiedad de Rowi. No adquirís ningún derecho sobre ellos más allá del uso del servicio.",
        ],
      },
      {
        heading: "4. No es asesoría profesional",
        body: [
          "Rowi es una herramienta de desarrollo y medición de inteligencia emocional. NO sustituye asesoría médica, psicológica, psiquiátrica ni terapéutica. Si estás atravesando una crisis, contactá a un profesional de salud o a una línea de ayuda. Las funciones de detección de crisis escalan señales pero no constituyen atención clínica.",
        ],
      },
      {
        heading: "5. Pagos y suscripciones",
        body: [
          "Los planes pagos se gestionan a través de Stripe. Las suscripciones se renuevan automáticamente salvo cancelación. Podés gestionar o cancelar tu suscripción desde tu cuenta. Los reembolsos se rigen por la política vigente al momento de la compra.",
        ],
      },
      {
        heading: "6. Limitación de responsabilidad",
        body: [
          "Rowi se provee 'tal cual'. En la máxima medida permitida por la ley, Rowi no será responsable por daños indirectos, incidentales o consecuentes derivados del uso del servicio.",
          "Rowi es responsable únicamente por la operación de su propia plataforma. Six Seconds, como proveedor de metodología y entidad independiente, no es responsable por la operación, disponibilidad ni decisiones de tratamiento de datos de la plataforma Rowi.",
        ],
      },
      {
        heading: "7. Suspensión y terminación",
        body: [
          "Podemos suspender o terminar cuentas que violen estos Términos. Podés cerrar tu cuenta en cualquier momento desde la configuración.",
        ],
      },
      {
        heading: "8. Ley aplicable y arbitraje",
        body: [
          "Estos Términos se rigen por las leyes de la República del Perú.",
          "Toda controversia derivada de estos Términos se resolverá de manera definitiva mediante arbitraje de derecho, con sede en Lima, Perú, administrado conforme al reglamento del centro de arbitraje correspondiente. El arbitraje se llevará a cabo en español ante un árbitro único.",
        ],
      },
      {
        heading: "9. Cambios",
        body: [
          "Podemos actualizar estos Términos. Te notificaremos los cambios materiales. El uso continuado tras la notificación implica aceptación.",
        ],
      },
    ],
  },

  "six-seconds": {
    title: "Aviso sobre Six Seconds",
    lastUpdated: LAST_UPDATED,
    draft: false,
    intro:
      "Este aviso aclara la relación entre Rowi y Six Seconds, y la separación de responsabilidades entre ambas entidades.",
    sections: [
      {
        heading: "1. Entidades independientes",
        body: [
          "Rowi, con operaciones gestionadas desde Perú, y Six Seconds son entidades legalmente independientes.",
          "Rowi opera su plataforma en alianza con Six Seconds, utilizando su metodología y datos de referencia bajo licencia. Cada entidad mantiene su personalidad jurídica propia y responde de forma independiente por sus respectivas obligaciones.",
        ],
      },
      {
        heading: "2. Rol de Six Seconds",
        body: [
          "Six Seconds provee: la metodología científica (SEI — las 8 competencias de inteligencia emocional, los 18 Brain Talents, el framework Vital Signs), datos de referencia (benchmark) y orientación científica.",
          "Six Seconds es una marca registrada de su titular. Rowi la usa conforme a los términos de su licencia/alianza y no la traduce.",
        ],
      },
      {
        heading: "3. Respeto a las políticas de Six Seconds",
        body: [
          "Rowi se compromete a respetar las políticas de privacidad y uso de datos de Six Seconds aplicables a la metodología y datos que provee. Cualquier acceso de Six Seconds a datos de la plataforma se limita a información anonimizada/agregada con fines de investigación y bajo auditoría.",
        ],
      },
      {
        heading: "4. Responsabilidad",
        body: [
          "Rowi es la única responsable de la operación de esta plataforma: disponibilidad, seguridad, atención a usuarios y decisiones de tratamiento de datos personales de los usuarios.",
          "Six Seconds, como proveedor de metodología y entidad independiente, no es responsable por la operación de la plataforma Rowi ni por el tratamiento de datos que Rowi realiza como responsable.",
        ],
      },
    ],
  },

  cookies: {
    title: "Política de Cookies",
    lastUpdated: LAST_UPDATED,
    draft: false,
    intro:
      "Usamos cookies y tecnologías similares para operar la plataforma y, con tu consentimiento, para analítica.",
    sections: [
      {
        heading: "1. Qué son las cookies",
        body: [
          "Las cookies son pequeños archivos que se guardan en tu dispositivo para recordar información entre visitas.",
        ],
      },
      {
        heading: "2. Categorías que usamos",
        body: [
          "- Esenciales: necesarias para iniciar sesión y mantener tu sesión segura. No requieren consentimiento.",
          "- Funcionales: recuerdan preferencias como idioma y contexto activo.",
          "- Analíticas: nos ayudan a entender el uso de la plataforma (por ejemplo, Google Analytics). Solo se activan con tu consentimiento.",
        ],
      },
      {
        heading: "3. Tu control",
        body: [
          "Al ingresar te mostramos un banner para aceptar, rechazar o configurar las cookies no esenciales. Podés cambiar tu elección en cualquier momento. Si rechazás las analíticas, no cargamos esos scripts.",
        ],
      },
    ],
  },

  research: {
    title: "Aviso de Investigación y Consentimiento",
    lastUpdated: LAST_UPDATED,
    draft: false,
    intro:
      "Rowi es también una plataforma de investigación sobre inteligencia emocional, en colaboración con Six Seconds. Este aviso explica cómo se usan los datos para investigación y cómo controlás tu participación.",
    sections: [
      {
        heading: "1. Participación voluntaria y revocable",
        body: [
          "El uso de tus datos para investigación es opcional y requiere tu consentimiento explícito, separado del uso básico del producto. Podés otorgarlo o revocarlo en cualquier momento desde la configuración de privacidad, sin afectar tu acceso al servicio.",
        ],
      },
      {
        heading: "2. Qué datos y cómo se protegen",
        body: [
          "Para investigación usamos datos de medición emocional (Vital Signs, competencias SEI, Brain Talents, debriefs) de forma anonimizada o seudonimizada.",
          "Regla de N≥5: ningún resultado agregado se publica o muestra si representa a menos de 5 personas.",
          "El modelo BE2GROW (relación entre pulse points, competencias SEI y Brain Talents) es una hipótesis en calibración; tus contribuciones ayudan a refinarlo, siempre de forma agregada y anonimizada.",
        ],
      },
      {
        heading: "3. Niveles de visibilidad",
        body: [
          "- Personal: solo vos ves tus datos individuales.",
          "- Agregado de equipo (N≥5): visible para tu equipo, sin identificar individuos.",
          "- Agregado de organización (N≥5): visible a nivel organizacional, sin identificar individuos.",
          "- Comunidad pública: estadísticas anónimas de la comunidad.",
          "- Lente de investigación: acceso restringido y auditado para fines científicos.",
        ],
      },
      {
        heading: "4. Quién accede al lente de investigación",
        body: [
          "El acceso de investigación se otorga por niveles definidos y se registra siempre en una auditoría (ResearchAccessAudit): equipo fundador de Rowi, liderazgo científico, equipos de Rowi y de Six Seconds (sobre datos anonimizados), y personas que vos invites explícitamente (tu coach o mentor).",
        ],
      },
      {
        heading: "5. Tus derechos sobre la investigación",
        body: [
          "Podés revocar tu consentimiento, solicitar que tus datos dejen de usarse en futuros análisis, y consultar el registro de quién accedió a tus datos. La revocación no afecta análisis ya anonimizados e irreversibles.",
        ],
      },
    ],
  },
};
