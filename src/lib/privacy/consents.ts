/**
 * Granular consent catalog. Five independent opt-in consents shown at onboarding
 * and managed in /hub/account/privacy. The text shown to the user is versioned —
 * when we update the wording, we bump the version and re-ask.
 *
 * Source of truth: docs/EMOTIONAL_BUDGETING.md section 5.3.
 */

export type ConsentKey =
  | "basic_processing"
  | "analytics"
  | "research_lens"
  | "benchmarking_contribution"
  | "marketing_communications"
  | "vs_sei_individual_linking";

export interface ConsentDescriptor {
  key: ConsentKey;
  required: boolean;
  defaultGranted: boolean;
  version: number;
  esTitle: string;
  enTitle: string;
  ptTitle: string;
  itTitle: string;
  esBody: string;
  enBody: string;
  ptBody: string;
  itBody: string;
}

export type ConsentLang = "es" | "en" | "pt" | "it";

export function titleFor(descriptor: ConsentDescriptor, lang: ConsentLang): string {
  switch (lang) {
    case "en":
      return descriptor.enTitle;
    case "pt":
      return descriptor.ptTitle;
    case "it":
      return descriptor.itTitle;
    default:
      return descriptor.esTitle;
  }
}

export function bodyFor(descriptor: ConsentDescriptor, lang: ConsentLang): string {
  switch (lang) {
    case "en":
      return descriptor.enBody;
    case "pt":
      return descriptor.ptBody;
    case "it":
      return descriptor.itBody;
    default:
      return descriptor.esBody;
  }
}

export const CONSENTS: ReadonlyArray<ConsentDescriptor> = [
  {
    key: "basic_processing",
    required: true,
    defaultGranted: true,
    version: 1,
    esTitle: "Uso del producto",
    enTitle: "Product use",
    ptTitle: "Uso do produto",
    itTitle: "Uso del prodotto",
    esBody:
      "Para que Rowi funcione necesitamos procesar tu correo, tus respuestas en assessments y tus interacciones en la plataforma. Sin este consentimiento no podemos darte el servicio.",
    enBody:
      "For Rowi to work we need to process your email, your assessment answers, and your interactions on the platform. Without this consent we cannot provide the service.",
    ptBody:
      "Para que o Rowi funcione precisamos processar o seu email, suas respostas em avaliações e suas interações na plataforma. Sem este consentimento não podemos oferecer o serviço.",
    itBody:
      "Affinché Rowi funzioni dobbiamo trattare la tua email, le tue risposte nelle valutazioni e le tue interazioni sulla piattaforma. Senza questo consenso non possiamo fornire il servizio.",
  },
  {
    key: "analytics",
    required: false,
    defaultGranted: false,
    version: 1,
    esTitle: "Mejora del producto (datos agregados)",
    enTitle: "Product improvement (aggregated data)",
    ptTitle: "Melhoria do produto (dados agregados)",
    itTitle: "Miglioramento del prodotto (dati aggregati)",
    esBody:
      "Usamos tus datos de uso de forma anónima y agregada para entender qué funciona y qué no. Nunca te identificamos individualmente en estos análisis.",
    enBody:
      "We use your usage data anonymously and aggregated to understand what works and what doesn't. We never identify you individually in these analyses.",
    ptBody:
      "Usamos seus dados de uso de forma anônima e agregada para entender o que funciona e o que não. Nunca o identificamos individualmente nestas análises.",
    itBody:
      "Usiamo i tuoi dati di utilizzo in forma anonima e aggregata per capire cosa funziona e cosa no. Non ti identifichiamo mai individualmente in queste analisi.",
  },
  {
    key: "research_lens",
    required: false,
    defaultGranted: false,
    version: 2,
    esTitle: "Investigación científica · rowi team + six seconds team",
    enTitle: "Scientific research · rowi team + six seconds team",
    ptTitle: "Pesquisa científica · rowi team + six seconds team",
    itTitle: "Ricerca scientifica · rowi team + six seconds team",
    esBody:
      "El rowi team y el six seconds team pueden acceder a tu información en modo pseudonimizado para refinar el modelo Emotional Budgeting y construir casos de estudio agregados. Tu identidad no sale de ese círculo cerrado. Cada acceso queda registrado y puedes solicitar el log de quién vio tus datos en cualquier momento.",
    enBody:
      "The rowi team and the six seconds team can access your information in pseudonymized mode to refine the Emotional Budgeting model and build aggregated case studies. Your identity does not leave that closed circle. Every access is logged and you can request the log of who viewed your data at any time.",
    ptBody:
      "O rowi team e o six seconds team podem acessar suas informações em modo pseudonimizado para refinar o modelo Emotional Budgeting e construir casos de estudo agregados. Sua identidade não sai desse círculo fechado. Cada acesso fica registrado e você pode solicitar o log de quem viu seus dados a qualquer momento.",
    itBody:
      "Il rowi team e il six seconds team possono accedere alle tue informazioni in modalità pseudonimizzata per affinare il modello Emotional Budgeting e costruire casi di studio aggregati. La tua identità non esce da quel cerchio chiuso. Ogni accesso viene registrato e puoi richiedere il log di chi ha visto i tuoi dati in qualsiasi momento.",
  },
  {
    key: "benchmarking_contribution",
    required: false,
    defaultGranted: false,
    version: 1,
    esTitle: "Contribuir al benchmark Six Seconds Network",
    enTitle: "Contribute to the Six Seconds Network benchmark",
    ptTitle: "Contribuir para o benchmark Six Seconds Network",
    itTitle: "Contribuire al benchmark Six Seconds Network",
    esBody:
      "Tus scores, anonimizados y sin ningún identificador personal, pueden contribuir al benchmark global de Six Seconds Network. Esto ayuda a calibrar las normas que después se usan para interpretar los resultados de otras personas y organizaciones.",
    enBody:
      "Your scores, anonymized and stripped of any personal identifier, can contribute to the global Six Seconds Network benchmark. This helps calibrate the norms used afterward to interpret other people's and organizations' results.",
    ptBody:
      "Suas pontuações, anonimizadas e sem qualquer identificador pessoal, podem contribuir para o benchmark global da Six Seconds Network. Isso ajuda a calibrar as normas que depois são usadas para interpretar os resultados de outras pessoas e organizações.",
    itBody:
      "I tuoi punteggi, anonimizzati e privi di qualsiasi identificatore personale, possono contribuire al benchmark globale di Six Seconds Network. Questo aiuta a calibrare le norme usate poi per interpretare i risultati di altre persone e organizzazioni.",
  },
  {
    key: "marketing_communications",
    required: false,
    defaultGranted: false,
    version: 1,
    esTitle: "Comunicaciones de Rowi",
    enTitle: "Rowi communications",
    ptTitle: "Comunicações do Rowi",
    itTitle: "Comunicazioni di Rowi",
    esBody:
      "Te enviamos novedades del producto, casos de uso, invitaciones a eventos y contenido educativo de Emotional Budgeting. Puedes darte de baja en cualquier momento.",
    enBody:
      "We send you product news, use cases, event invitations, and educational content about Emotional Budgeting. You can unsubscribe at any time.",
    ptBody:
      "Enviamos novidades do produto, casos de uso, convites para eventos e conteúdo educacional sobre Emotional Budgeting. Você pode cancelar a inscrição a qualquer momento.",
    itBody:
      "Ti inviamo novità del prodotto, casi d'uso, inviti a eventi e contenuti educativi su Emotional Budgeting. Puoi annullare l'iscrizione in qualsiasi momento.",
  },
  {
    key: "vs_sei_individual_linking",
    required: false,
    defaultGranted: false,
    version: 1,
    esTitle: "Análisis individual cruzado (Vital Signs ↔ SEI)",
    enTitle: "Individual cross-instrument analysis (Vital Signs ↔ SEI)",
    ptTitle: "Análise individual cruzada (Vital Signs ↔ SEI)",
    itTitle: "Analisi individuale incrociata (Vital Signs ↔ SEI)",
    esBody:
      "Autorizas a enlazar tus respuestas de Vital Signs con tu resultado SEI como una misma persona, para análisis individual de cómo se relacionan tus impulsores y tus competencias emocionales. Estos datos son de categoría especial: solo tú y, si lo activas, el equipo de investigación con consentimiento, pueden verlos. Cada acceso queda registrado y puedes revocar este permiso en cualquier momento.",
    enBody:
      "You authorize linking your Vital Signs responses with your SEI result as the same person, for individual analysis of how your drivers and your emotional competencies relate. This data is a special category: only you and, if you enable it, the research team with consent, can see it. Every access is logged and you can revoke this permission at any time.",
    ptBody:
      "Você autoriza vincular suas respostas de Vital Signs com seu resultado SEI como a mesma pessoa, para análise individual de como seus impulsionadores e suas competências emocionais se relacionam. Estes dados são de categoria especial: apenas você e, se você ativar, a equipe de pesquisa com consentimento, podem vê-los. Cada acesso fica registrado e você pode revogar esta permissão a qualquer momento.",
    itBody:
      "Autorizzi a collegare le tue risposte di Vital Signs con il tuo risultato SEI come la stessa persona, per un'analisi individuale di come si relazionano i tuoi driver e le tue competenze emotive. Questi dati sono di categoria speciale: solo tu e, se lo attivi, il team di ricerca con consenso, possono vederli. Ogni accesso viene registrato e puoi revocare questo permesso in qualsiasi momento.",
  },
];

export function getConsentDescriptor(key: ConsentKey): ConsentDescriptor | undefined {
  return CONSENTS.find((c) => c.key === key);
}
