/**
 * BE2GROW catalog — Six Seconds Vital Signs model.
 *
 * Five drivers × three pulse points = 15 pulse points.
 * Each pulse point is activated by a specific set of SEI competencies
 * (the K/C/G 8-competency model) and supported by specific Brain Talents.
 * Source: Vital Signs · EQ Latam · Anexo BE2GROW (PPTX, slides 55–74).
 *
 * SEI keys match EqSnapshot columns: EL, RP, ACT, NE, IM, OP, EMP, NG.
 * Brain Talent keys match TalentSnapshot.key normalized form (lowercase, no spaces).
 */

export type SeiKey = "EL" | "RP" | "ACT" | "NE" | "IM" | "OP" | "EMP" | "NG";

export const SEI_COMPETENCIES: ReadonlyArray<{
  key: SeiKey;
  pursuit: "know" | "choose" | "give";
  enName: string;
  esName: string;
}> = [
  { key: "EL", pursuit: "know", enName: "Enhance Emotional Literacy", esName: "Alfabetización Emocional" },
  { key: "RP", pursuit: "know", enName: "Recognize Patterns", esName: "Reconocer Patrones" },
  { key: "ACT", pursuit: "choose", enName: "Apply Consequential Thinking", esName: "Pensamiento Consecuente" },
  { key: "NE", pursuit: "choose", enName: "Navigate Emotions", esName: "Navegar Emociones" },
  { key: "IM", pursuit: "choose", enName: "Engage Intrinsic Motivation", esName: "Motivación Intrínseca" },
  { key: "OP", pursuit: "choose", enName: "Exercise Optimism", esName: "Ejercitar Optimismo" },
  { key: "EMP", pursuit: "give", enName: "Increase Empathy", esName: "Incrementar Empatía" },
  { key: "NG", pursuit: "give", enName: "Pursue Noble Goals", esName: "Nobles Metas" },
];

export type BrainTalentKey =
  | "datamining" | "modeling" | "prioritizing"
  | "connection" | "emotionalinsight" | "collaboration"
  | "reflecting" | "adaptability" | "criticalthinking"
  | "resilience" | "risktolerance" | "imagination"
  | "proactivity" | "commitment" | "problemsolving"
  | "vision" | "designing" | "entrepreneurship";

export type DriverCode = "TRUST" | "MOTIVATION" | "CHANGE" | "TEAMWORK" | "EXECUTION";

export type Quadrant = "LINTERNA" | "MAPA" | "BOTIQUIN" | "BOTAS";

export const DRIVERS: ReadonlyArray<{
  code: DriverCode;
  i18nKey: string;
  esName: string;
  enName: string;
  esNeed: string;
  enNeed: string;
  axisVertical: "STRATEGY" | "OPERATIONS" | "CENTER";
  axisHorizontal: "PEOPLE" | "ORGANIZATION" | "CENTER";
  quadrant: Quadrant | "CENTER";
}> = [
  { code: "TRUST",      i18nKey: "vs.driver.trust",      esName: "Confianza",        enName: "Trust",       esNeed: "Seguridad",   enNeed: "Safety",      axisVertical: "CENTER",     axisHorizontal: "CENTER",       quadrant: "CENTER" },
  { code: "MOTIVATION", i18nKey: "vs.driver.motivation", esName: "Motivación",       enName: "Motivation",  esNeed: "Significado", enNeed: "Meaning",     axisVertical: "STRATEGY",   axisHorizontal: "PEOPLE",       quadrant: "MAPA" },
  { code: "CHANGE",     i18nKey: "vs.driver.change",     esName: "Cambio",           enName: "Change",      esNeed: "Crecimiento", enNeed: "Growth",      axisVertical: "STRATEGY",   axisHorizontal: "ORGANIZATION", quadrant: "LINTERNA" },
  { code: "TEAMWORK",   i18nKey: "vs.driver.teamwork",   esName: "Trabajo en Equipo", enName: "Teamwork",   esNeed: "Pertenencia", enNeed: "Belonging",   axisVertical: "OPERATIONS", axisHorizontal: "PEOPLE",       quadrant: "BOTIQUIN" },
  { code: "EXECUTION",  i18nKey: "vs.driver.execution",  esName: "Ejecución",        enName: "Execution",   esNeed: "Logro",       enNeed: "Achievement", axisVertical: "OPERATIONS", axisHorizontal: "ORGANIZATION", quadrant: "BOTAS" },
];

export type PulsePointCode =
  | "TRUST_TRANSPARENCY" | "TRUST_COHERENCE" | "TRUST_CARE"
  | "MOTIVATION_MEANING" | "MOTIVATION_MASTERY" | "MOTIVATION_AUTONOMY"
  | "CHANGE_IMAGINATION" | "CHANGE_EXPLORATION" | "CHANGE_CELEBRATION"
  | "TEAMWORK_DIVERGENCE" | "TEAMWORK_CONNECTION" | "TEAMWORK_JOY"
  | "EXECUTION_ACCOUNTABILITY" | "EXECUTION_FEEDBACK" | "EXECUTION_FOCUS";

export interface PulsePoint {
  code: PulsePointCode;
  driver: DriverCode;
  i18nKey: string;
  esName: string;
  enName: string;
  esFunction: string;
  enFunction: string;
  competencies: SeiKey[];
  talents: BrainTalentKey[];
  successFactors: ReadonlyArray<"Effectiveness" | "Relationships" | "Wellbeing" | "QualityOfLife">;
}

export const PULSE_POINTS: ReadonlyArray<PulsePoint> = [
  // === TRUST ===
  {
    code: "TRUST_TRANSPARENCY", driver: "TRUST",
    i18nKey: "vs.pp.transparency",
    esName: "Transparencia", enName: "Transparency",
    esFunction: "Compartir verdad", enFunction: "Share truth",
    competencies: ["EMP", "ACT", "EL", "NG"],
    talents: ["emotionalinsight", "connection", "criticalthinking", "reflecting", "collaboration"],
    successFactors: ["Relationships", "Effectiveness"],
  },
  {
    code: "TRUST_COHERENCE", driver: "TRUST",
    i18nKey: "vs.pp.coherence",
    esName: "Coherencia", enName: "Coherence",
    esFunction: "Alinear discurso y acción", enFunction: "Align discourse and action",
    competencies: ["IM", "ACT", "RP"],
    talents: ["commitment", "prioritizing", "proactivity", "designing"],
    successFactors: ["Effectiveness", "Wellbeing"],
  },
  {
    code: "TRUST_CARE", driver: "TRUST",
    i18nKey: "vs.pp.care",
    esName: "Cuidado", enName: "Care",
    esFunction: "Generar conexión humana", enFunction: "Generate human connection",
    competencies: ["EMP", "NE", "NG"],
    talents: ["connection", "collaboration", "emotionalinsight", "adaptability"],
    successFactors: ["Relationships", "Wellbeing"],
  },

  // === MOTIVATION ===
  {
    code: "MOTIVATION_MEANING", driver: "MOTIVATION",
    i18nKey: "vs.pp.meaning",
    esName: "Significado", enName: "Meaning",
    esFunction: "Crear propósito", enFunction: "Create purpose",
    competencies: ["NG", "IM", "EL"],
    talents: ["vision", "commitment", "designing"],
    successFactors: ["QualityOfLife", "Effectiveness"],
  },
  {
    code: "MOTIVATION_MASTERY", driver: "MOTIVATION",
    i18nKey: "vs.pp.mastery",
    esName: "Maestría", enName: "Mastery",
    esFunction: "Construir fortalezas", enFunction: "Build strengths",
    competencies: ["RP", "IM", "ACT"],
    talents: ["datamining", "modeling", "problemsolving"],
    successFactors: ["Effectiveness", "QualityOfLife"],
  },
  {
    code: "MOTIVATION_AUTONOMY", driver: "MOTIVATION",
    i18nKey: "vs.pp.autonomy",
    esName: "Autonomía", enName: "Autonomy",
    esFunction: "Generar ownership", enFunction: "Generate ownership",
    competencies: ["IM", "ACT", "OP"],
    talents: ["proactivity", "prioritizing", "problemsolving"],
    successFactors: ["Effectiveness", "Wellbeing"],
  },

  // === CHANGE ===
  {
    code: "CHANGE_IMAGINATION", driver: "CHANGE",
    i18nKey: "vs.pp.imagination",
    esName: "Imaginación", enName: "Imagination",
    esFunction: "Crear emoción para innovar", enFunction: "Create emotion to innovate",
    competencies: ["OP", "NE", "NG"],
    talents: ["imagination", "designing", "vision"],
    successFactors: ["Effectiveness", "QualityOfLife"],
  },
  {
    code: "CHANGE_EXPLORATION", driver: "CHANGE",
    i18nKey: "vs.pp.exploration",
    esName: "Exploración", enName: "Exploration",
    esFunction: "Prototipar y aprender", enFunction: "Prototype and learn",
    competencies: ["OP", "ACT", "RP"],
    talents: ["risktolerance", "entrepreneurship", "adaptability"],
    successFactors: ["Effectiveness", "Wellbeing"],
  },
  {
    code: "CHANGE_CELEBRATION", driver: "CHANGE",
    i18nKey: "vs.pp.celebration",
    esName: "Celebración", enName: "Celebration",
    esFunction: "Integrar el aprendizaje", enFunction: "Integrate learning",
    competencies: ["EL", "OP", "EMP"],
    talents: ["collaboration", "emotionalinsight", "resilience"],
    successFactors: ["Relationships", "QualityOfLife"],
  },

  // === TEAMWORK ===
  {
    code: "TEAMWORK_DIVERGENCE", driver: "TEAMWORK",
    i18nKey: "vs.pp.divergence",
    esName: "Divergencia", enName: "Divergence",
    esFunction: "Buscar perspectivas distintas", enFunction: "Seek different perspectives",
    competencies: ["EMP", "NE", "RP"],
    talents: ["adaptability", "collaboration", "criticalthinking"],
    successFactors: ["Relationships", "Effectiveness"],
  },
  {
    code: "TEAMWORK_CONNECTION", driver: "TEAMWORK",
    i18nKey: "vs.pp.connection",
    esName: "Conexión", enName: "Connection",
    esFunction: "Crear terreno común", enFunction: "Create common ground",
    competencies: ["EMP", "EL", "NE"],
    talents: ["connection", "emotionalinsight", "collaboration"],
    successFactors: ["Relationships", "Wellbeing"],
  },
  {
    code: "TEAMWORK_JOY", driver: "TEAMWORK",
    i18nKey: "vs.pp.joy",
    esName: "Alegría", enName: "Joy",
    esFunction: "Amplificar energía emocional", enFunction: "Amplify emotional energy",
    competencies: ["OP", "IM", "NE"],
    talents: ["resilience", "collaboration", "proactivity"],
    successFactors: ["Wellbeing", "Relationships"],
  },

  // === EXECUTION ===
  {
    code: "EXECUTION_ACCOUNTABILITY", driver: "EXECUTION",
    i18nKey: "vs.pp.accountability",
    esName: "Responsabilidad", enName: "Accountability",
    esFunction: "Hacer resultados visibles", enFunction: "Make results visible",
    competencies: ["ACT", "IM", "RP"],
    talents: ["commitment", "proactivity", "prioritizing"],
    successFactors: ["Effectiveness"],
  },
  {
    code: "EXECUTION_FEEDBACK", driver: "EXECUTION",
    i18nKey: "vs.pp.feedback",
    esName: "Feedback", enName: "Feedback",
    esFunction: "Conciencia continua", enFunction: "Continuous awareness",
    competencies: ["EMP", "EL", "ACT"],
    talents: ["emotionalinsight", "criticalthinking", "reflecting"],
    successFactors: ["Relationships", "Effectiveness"],
  },
  {
    code: "EXECUTION_FOCUS", driver: "EXECUTION",
    i18nKey: "vs.pp.focus",
    esName: "Enfoque", enName: "Focus",
    esFunction: "Concentrar en lo esencial", enFunction: "Concentrate on the essential",
    competencies: ["RP", "ACT", "NE"],
    talents: ["prioritizing", "datamining", "modeling"],
    successFactors: ["Effectiveness", "Wellbeing"],
  },
];

/**
 * Outcomes by instrument.
 * OVS: organizational business outcomes.
 * LVS: leadership role outcomes (different set from OVS).
 * FVS: family system outcomes (Rowi-original extension, provisional, pending Joshua review).
 * TVS: shares OVS outcomes plus a quadrant archetype (Lantern/Map/First Aid Kit/Hiking Boots).
 */

export type Instrument = "OVS" | "TVS" | "LVS" | "FVS";

export type OvsOutcomeCode = "FUTURE_SUCCESS" | "CUSTOMER_FOCUS" | "PRODUCTIVITY" | "RETENTION";
export type LvsOutcomeCode = "DIRECTION" | "DESIGN" | "EFFICACY" | "INFLUENCE";
export type FvsOutcomeCode = "COHESION" | "MUTUAL_CARE" | "GROWTH" | "RESILIENCE";

export const OVS_OUTCOMES: ReadonlyArray<{
  code: OvsOutcomeCode;
  esName: string;
  enName: string;
  esQuestion: string;
  enQuestion: string;
  axis: "STRATEGY" | "ORGANIZATION" | "OPERATIONS" | "PEOPLE";
  relatedDrivers: DriverCode[];
}> = [
  { code: "FUTURE_SUCCESS", esName: "Éxito Futuro", enName: "Future Success",
    esQuestion: "¿La organización avanza en una dirección sostenible y valiosa?",
    enQuestion: "Is the organization moving in a sustainable and valuable direction?",
    axis: "STRATEGY",
    relatedDrivers: ["TRUST", "MOTIVATION", "CHANGE"] },
  { code: "CUSTOMER_FOCUS", esName: "Enfoque en el Cliente", enName: "Customer Focus",
    esQuestion: "¿Hay compromiso genuino con el cliente para generar lealtad?",
    enQuestion: "Is there genuine commitment to the customer to generate loyalty?",
    axis: "ORGANIZATION",
    relatedDrivers: ["TRUST", "CHANGE", "EXECUTION"] },
  { code: "PRODUCTIVITY", esName: "Productividad", enName: "Productivity",
    esQuestion: "¿Las personas hacen tanto el trabajo inmediato como el trabajo que importa?",
    enQuestion: "Are people doing both the immediate work and the work that matters?",
    axis: "OPERATIONS",
    relatedDrivers: ["TRUST", "TEAMWORK", "EXECUTION"] },
  { code: "RETENTION", esName: "Retención", enName: "Retention",
    esQuestion: "¿La organización está reteniendo a las personas con talento?",
    enQuestion: "Is the organization retaining talented people?",
    axis: "PEOPLE",
    relatedDrivers: ["TRUST", "MOTIVATION", "TEAMWORK"] },
];

export const LVS_OUTCOMES: ReadonlyArray<{
  code: LvsOutcomeCode;
  esName: string;
  enName: string;
  esQuestion: string;
  enQuestion: string;
  axis: "STRATEGY" | "ORGANIZATION" | "OPERATIONS" | "PEOPLE";
  relatedDrivers: DriverCode[];
}> = [
  { code: "DIRECTION", esName: "Dirección", enName: "Direction",
    esQuestion: "¿A dónde vamos? El líder establece visión, propósito y rumbo a largo plazo.",
    enQuestion: "Where are we going? The leader sets vision, purpose, and long-term direction.",
    axis: "STRATEGY",
    relatedDrivers: ["TRUST", "MOTIVATION", "CHANGE"] },
  { code: "DESIGN", esName: "Diseño", enName: "Design",
    esQuestion: "¿Cómo llegamos? El líder construye sistemas, procesos y planes para ejecutar.",
    enQuestion: "How do we get there? The leader builds systems, processes, and plans to execute.",
    axis: "ORGANIZATION",
    relatedDrivers: ["TRUST", "CHANGE", "EXECUTION"] },
  { code: "EFFICACY", esName: "Eficacia", enName: "Efficacy",
    esQuestion: "¿Estamos avanzando? El líder produce resultados visibles y útiles.",
    enQuestion: "Are we making progress? The leader produces visible and useful results.",
    axis: "OPERATIONS",
    relatedDrivers: ["TRUST", "TEAMWORK", "EXECUTION"] },
  { code: "INFLUENCE", esName: "Influencia", enName: "Influence",
    esQuestion: "¿Hay otros que se suman? El líder construye relaciones e involucra a las personas.",
    enQuestion: "Are others joining? The leader builds relationships and engages people.",
    axis: "PEOPLE",
    relatedDrivers: ["TRUST", "MOTIVATION", "TEAMWORK"] },
];

export const FVS_OUTCOMES: ReadonlyArray<{
  code: FvsOutcomeCode;
  esName: string;
  enName: string;
  esQuestion: string;
  enQuestion: string;
  relatedDrivers: DriverCode[];
}> = [
  { code: "COHESION", esName: "Cohesión", enName: "Cohesion",
    esQuestion: "¿La familia se siente como un «nosotros» sólido?",
    enQuestion: "Does the family feel like a solid 'we'?",
    relatedDrivers: ["TRUST", "TEAMWORK", "MOTIVATION"] },
  { code: "MUTUAL_CARE", esName: "Cuidado mutuo", enName: "Mutual Care",
    esQuestion: "¿Las necesidades de cada miembro son vistas y atendidas?",
    enQuestion: "Are each member's needs seen and attended to?",
    relatedDrivers: ["TRUST", "TEAMWORK", "EXECUTION"] },
  { code: "GROWTH", esName: "Crecimiento", enName: "Growth",
    esQuestion: "¿Cada miembro puede evolucionar dentro del sistema?",
    enQuestion: "Can each member evolve within the system?",
    relatedDrivers: ["TRUST", "MOTIVATION", "CHANGE"] },
  { code: "RESILIENCE", esName: "Resiliencia", enName: "Resilience",
    esQuestion: "¿La familia procesa golpes externos sin romperse?",
    enQuestion: "Does the family process external shocks without breaking?",
    relatedDrivers: ["TRUST", "CHANGE", "EXECUTION"] },
];

/**
 * Official instrument definitions, sourced from the book + Six Seconds program PPTX + debrief PDFs.
 * FVS definition is Rowi-original (Eduardo + Claude), to be reviewed with Joshua Freedman.
 */
export const INSTRUMENT_DEFINITIONS: Record<Instrument, {
  esName: string;
  enName: string;
  esShort: string;
  enShort: string;
  esLong: string;
  enLong: string;
  esWhenToUse: string;
  enWhenToUse: string;
  status: "official" | "rowi-extension-pending-review";
}> = {
  OVS: {
    esName: "OVS · Organizational Vital Signs",
    enName: "OVS · Organizational Vital Signs",
    esShort: "Mide los 5 drivers de toda la organización y los conecta con 4 outcomes de negocio.",
    enShort: "Measures the 5 drivers at organization scale, connecting them to 4 business outcomes.",
    esLong: "OVS es la lectura agregada que necesitan CEOs y boards. El clima organizacional es como el «clima» en la organización — ¿es una organización donde la gente teme que llueva, o donde llegan esperando buen tiempo? Las sensaciones y expectativas están ligadas a relaciones, equipo de liderazgo, encaje individual y la evolución de la organización.",
    enLong: "OVS is the aggregate read CEOs and boards need. Organizational climate is like the 'weather' inside the organization — is this an organization where people fear rain, or one where they arrive expecting lovely weather? Feelings and expectations are tied to relationships, the leadership team, individual fit, and the organization's evolution.",
    esWhenToUse: "Diagnóstico estratégico, transformación cultural, employer branding, línea base para programas de cambio a 12-24 meses, input para sesiones de planificación de Comité Ejecutivo.",
    enWhenToUse: "Strategic diagnosis, cultural transformation, employer branding, baseline for 12–24 month change programs, executive committee planning input.",
    status: "official",
  },
  TVS: {
    esName: "TVS · Team Vital Signs",
    enName: "TVS · Team Vital Signs",
    esShort: "Mide el clima del equipo en los 5 drivers, identifica oportunidades y obstáculos para un desempeño grupal óptimo.",
    enShort: "Measures team climate across the 5 drivers, identifies opportunities and obstacles for optimal group performance.",
    esLong: "TVS aplica a Equipos (no a Grupos ni Cuadrillas). Un Equipo tiene propósito compartido, interdependencia real, responsabilidades mutuas y sentido de «nosotros». Clasifica al equipo en uno de cuatro arquetipos (Linterna/Mapa/Botiquín/Botas) según dónde tiene su perfil dominante.",
    enLong: "TVS applies to Teams (not Groups or Squads). A Team has shared purpose, real interdependence, mutual accountability, and a sense of 'we.' It classifies the team into one of four archetypes (Lantern/Map/First Aid Kit/Hiking Boots) according to where its profile dominates.",
    esWhenToUse: "Desarrollo de equipo, intervenciones de team building, cambio organizacional.",
    enWhenToUse: "Team development, team building interventions, organizational change.",
    status: "official",
  },
  LVS: {
    esName: "LVS · Leadership Vital Signs",
    enName: "LVS · Leadership Vital Signs",
    esShort: "Evaluación 360° del liderazgo. Compara la autopercepción del líder con la percepción de supervisores, subordinados, pares y clientes.",
    enShort: "360° leadership evaluation. Compares the leader's self-perception with the perception of supervisors, direct reports, peers, and clients.",
    esLong: "LVS captura tu impacto de liderazgo desde múltiples ángulos. Mide los 5 drivers y los conecta con 4 outcomes específicos del rol de líder: Dirección, Diseño, Eficacia, Influencia. Cuatro principios rectores: Feedback (no realidad), Snapshot (no permanente), Perspectivas (no verdad), Ownership (del cliente).",
    enLong: "LVS captures your leadership impact from multiple angles. Measures the 5 drivers and connects them to 4 leadership-role-specific outcomes: Direction, Design, Efficacy, Influence. Four guiding principles: Feedback (not reality), Snapshot (not permanent), Perspectives (not truth), Ownership (the client's).",
    esWhenToUse: "Desarrollo de líderes, programas high potentials, executive coaching.",
    enWhenToUse: "Leader development, high-potential programs, executive coaching.",
    status: "official",
  },
  FVS: {
    esName: "FVS · Family Vital Signs",
    enName: "FVS · Family Vital Signs",
    esShort: "Adapta el modelo Vital Signs a sistemas familiares. Mide cómo se siente vivir en esta familia hoy, qué la sostiene, qué la desgasta.",
    enShort: "Adapts the Vital Signs model to family systems. Measures how it feels to live in this family today, what sustains it, what depletes it.",
    esLong: "FVS aplica los 5 drivers al contexto familiar: Confianza (seguridad emocional en casa), Motivación (sentido compartido del proyecto familiar), Cambio (procesar transiciones), Trabajo en Equipo (cooperación cotidiana), Ejecución (sostener rutinas y compromisos compartidos). Los 15 Pulse Points mantienen nombre y función, con ejemplos contextualizados para la vida familiar.",
    enLong: "FVS applies the 5 drivers to family context: Trust (emotional safety at home), Motivation (shared sense of the family project), Change (processing transitions), Teamwork (daily cooperation), Execution (sustaining shared routines and commitments). The 15 Pulse Points keep names and function with examples contextualized for family life.",
    esWhenToUse: "Parejas en transición, familias con adolescentes, post-pandemia, post-mudanza, post-pérdida, terapia familiar, coaching parental.",
    enWhenToUse: "Couples in transition, families with adolescents, post-pandemic, post-relocation, post-loss, family therapy, parental coaching.",
    status: "rowi-extension-pending-review",
  },
};

/**
 * Driver definitions adapted for FVS (family context).
 * Same five drivers, but the human-need framing changes from "team at work" to "family at home."
 */
export const FVS_DRIVER_FRAMINGS: Record<DriverCode, { esExample: string; enExample: string }> = {
  TRUST:      { esExample: "Seguridad emocional en casa · poder hablar honesto sin consecuencias", enExample: "Emotional safety at home · being able to speak honestly without consequences" },
  MOTIVATION: { esExample: "Sentido compartido del proyecto familiar · lo que valoramos juntos",   enExample: "Shared sense of the family project · what we value together" },
  CHANGE:     { esExample: "Procesar transiciones · mudanzas, nacimientos, duelos, etapas",        enExample: "Processing transitions · moves, births, grief, life stages" },
  TEAMWORK:   { esExample: "Cooperación cotidiana · división de cargas · calidad del «nosotros»", enExample: "Daily cooperation · division of loads · quality of 'we'" },
  EXECUTION:  { esExample: "Sostener rutinas y compromisos compartidos",                            enExample: "Sustaining shared routines and commitments" },
};

/**
 * Pulse Point examples adapted to FVS family context.
 * Same codes, same functions, contextualized examples.
 */
export const FVS_PP_EXAMPLES: Partial<Record<PulsePointCode, { es: string; en: string }>> = {
  TRUST_TRANSPARENCY:       { es: "Decir verdades difíciles en la mesa",                            en: "Speaking difficult truths at the dinner table" },
  TRUST_COHERENCE:          { es: "Cumplir promesas a hijos y pareja con la misma seriedad",        en: "Keeping promises to children and partner with equal seriousness" },
  TRUST_CARE:               { es: "Notar cuando alguien en casa no está bien",                       en: "Noticing when someone at home is not okay" },
  MOTIVATION_MEANING:       { es: "Qué nos une como familia más allá de las tareas",                en: "What unites us as a family beyond chores" },
  MOTIVATION_MASTERY:       { es: "Reconocer que cada miembro está aprendiendo y creciendo",        en: "Recognizing that each member is learning and growing" },
  MOTIVATION_AUTONOMY:      { es: "Espacio para que cada quien tenga lo suyo",                       en: "Room for everyone to have their own space" },
  CHANGE_IMAGINATION:       { es: "Imaginar el próximo capítulo de la familia juntos",              en: "Imagining the family's next chapter together" },
  CHANGE_EXPLORATION:       { es: "Probar rutinas nuevas, lugares nuevos, conversaciones nuevas",   en: "Trying new routines, places, conversations" },
  CHANGE_CELEBRATION:       { es: "Honrar logros y transiciones sin pasarlos por alto",             en: "Honoring achievements and transitions without overlooking them" },
  TEAMWORK_DIVERGENCE:      { es: "Permitir desacuerdos sin que rompan el vínculo",                  en: "Allowing disagreements without breaking the bond" },
  TEAMWORK_CONNECTION:      { es: "Tiempo de calidad sin agenda · simplemente estar",                en: "Quality time without agenda · simply being together" },
  TEAMWORK_JOY:             { es: "Reír juntos · momentos sin productividad detrás",                 en: "Laughing together · moments without productivity behind them" },
  EXECUTION_FOCUS:          { es: "Enfocarnos en lo esencial · soltar lo que no suma",               en: "Focusing on the essential · letting go of what doesn't add" },
  EXECUTION_ACCOUNTABILITY: { es: "Cada quien hace lo suyo · responsabilidades claras",              en: "Everyone does their part · clear responsibilities" },
  EXECUTION_FEEDBACK:       { es: "Conversaciones honestas sobre cómo nos está yendo",               en: "Honest conversations about how we're doing" },
};

export const QUADRANTS: ReadonlyArray<{
  code: Quadrant;
  esName: string;
  enName: string;
  esStrength: string;
  enStrength: string;
  esRisk: string;
  enRisk: string;
}> = [
  { code: "LINTERNA", esName: "Linterna", enName: "Lantern",
    esStrength: "Pensar hacia el futuro · visión sistémica",
    enStrength: "Future-thinking · systemic vision",
    esRisk: "Le cuesta pasar a la acción bajo presión",
    enRisk: "Struggles to act under pressure" },
  { code: "MAPA", esName: "Mapa", enName: "Map",
    esStrength: "Energizar con propósito · personas en el centro",
    enStrength: "Energize with purpose · people-centered",
    esRisk: "Le cuesta traducir entusiasmo en acción práctica",
    enRisk: "Struggles to turn enthusiasm into practical action" },
  { code: "BOTIQUIN", esName: "Botiquín", enName: "First Aid Kit",
    esStrength: "Cuidar personas · proteger cultura · resolver lo urgente",
    enStrength: "Care for people · protect culture · solve urgent",
    esRisk: "Le cuesta abrirse a nuevas ideas · puede ser excesivamente cauteloso",
    enRisk: "Struggles to open to new ideas · overly cautious" },
  { code: "BOTAS", esName: "Botas de Senderismo", enName: "Hiking Boots",
    esStrength: "Ejecución confiable · sistemas eficientes",
    enStrength: "Reliable execution · efficient systems",
    esRisk: "Le cuesta mantener a las personas comprometidas · olvida el «por qué»",
    enRisk: "Struggles to keep people engaged · forgets the why" },
];
