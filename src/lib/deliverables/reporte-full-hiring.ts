/**
 * 📄 Entregable: REPORTE FULL de HIRING (12 págs) — modelo "Recrutamento BDP".
 *
 * El entregable estrella del módulo Hiring. Cruza, para un proceso de selección
 * (un líder + N candidatos), cuatro lentes sobre los mismos SEI:
 *   P1     · RESUMEN EJECUTIVO  → tabla 4 lentes + lectura de Rowi + principio
 *   P2     · AFINIDAD           → ranking + matriz 6 contextos (puntos verdes)
 *   P3-4   · FICHAS DE AFINIDAD → díada por persona (dims + chips talentos)
 *   P5     · LENTE RELACIONAL   → deltas vs líder + "el puente con cada persona"
 *   P6     · BENCHMARK intro    → 4 stats + ranking percentil mundial
 *   P7     · TOP PERFORMER      → tabla población/top/brecha + distintivo
 *   P8-10  · FICHAS BENCHMARK   → doble-marca población/top por persona
 *   P11    · HIPÓTESIS LVS      → tabla 5 drivers × persona
 *   P12    · NOTAS DE HONESTIDAD→ "cómo leer este reporte" + caja amber
 *
 * Server-side (pdfkit, vía deliverables/pdf-kit). Cada página se dibuja a
 * COORDENADAS ABSOLUTAS con los helpers *Abs del kit (headerAbs/footerAbs/
 * scoreBarAbs/pctBarAbs/compBarAbs/bandChipAbs/chipsAbs/lecturaAbs/greenDot).
 * NO usa el flujo this.y/section/h2/para/table (eso comprimía el PDF a 5 págs).
 *
 * Porta fielmente scripts/hiring-rich-report/generate.py (referencia de layout).
 * Los DATOS llegan ya calculados por los motores del repo (affinityEngine,
 * top-performers, calculate); este módulo solo maqueta. Los deltas de la lente
 * relacional se LEEN de candidate.relationalDelta (no se recalculan).
 *
 * Texto interpretativo HÍBRIDO: plantillas deterministas por defecto; si
 * `enrich` trae textos de IA (plan superior), los usa en su lugar.
 */
import {
  RowiPdf, C, MX, CW, PAGE_W, PAGE_H, GREEN, HIRING_WARM, HIRING_COLD, type Lang,
} from "./pdf-kit";

// ── Estructuras de entrada (lo que producen los motores) ──
export interface HiringCandidate {
  name: string;
  role: string; // "Candidata" | "Líder del proceso"
  eq: number;
  brain: string; // brain style
  changeStyle: string;
  influence: string;
  affinityAvg: number; // 0-135, promedio de 6 contextos
  affinityByContext: Record<string, number>; // leadership..relationship
  affinityBands: Record<string, "hot" | "warm" | "cold">;
  eqPercentile: number; // 0-100 vs benchmark
  compsAtTopLevel: number; // 0-8
  pctOfTopsBelow: number; // % de top performers que supera
  competencies: { key: string; score: number; pctl: number; vsTop: number }[];
  relationalDelta: Record<string, number>; // delta vs líder por contexto
  lvs: { score: number; band: "low" | "mid" | "high" };
  lvsDrivers: { code: string; score: number; band: "low" | "mid" | "high" }[];
  // ── Detalle rico de la díada candidato↔líder (para las fichas de afinidad) ──
  /** Dimensiones de la díada promediadas sobre los 6 contextos (0-135). */
  dims: { growth: number; collab: number; understand: number };
  /** Compatibilidad de estilos de cerebro líder×candidato (0-100). */
  bbp: number;
  /** Claves de talento (camelCase del engine) fuertes (>=108) que comparten
   * líder y candidato. El generador las traduce por idioma. */
  sharedTalents: string[];
  /** Claves de competencia SEI (EL/RP/…) donde ambos brillan (>=100). El
   * generador las traduce por idioma. */
  brightComps: string[];
}

export interface HiringReportData {
  process: string; // "Recrutamento BDP"
  meta: string; // "SEI Adult v4 · 12-jun-2026"
  leaderName: string;
  leaderMeta: string; // "EQ 104.75 · percentil 73 · LVS 104 (media) · Visionary · Generator · Balanced"
  /** Líder como entrada de benchmark/LVS (sin díada — aparece en ranking EQ,
   * fichas benchmark y tabla LVS junto a los candidatos). */
  leader: {
    name: string; role: string; eq: number; brain: string;
    changeStyle: string; influence: string;
    eqPercentile: number; compsAtTopLevel: number; pctOfTopsBelow: number;
    competencies: { key: string; score: number; pctl: number; vsTop: number }[];
    lvs: { score: number; band: "low" | "mid" | "high" };
    lvsDrivers: { code: string; score: number; band: "low" | "mid" | "high" }[];
  };
  candidates: HiringCandidate[]; // ordenados por afinidad desc
  benchmark: {
    nTotal: number; nTop: number; threshold: number; nHealthcare?: number;
    population: Record<string, number>; topPerformers: Record<string, number>;
    distinctive: [string, number][];
  };
  /** Textos de IA opcionales (plan superior). Si faltan → plantilla determinista. */
  enrich?: {
    execSummary?: string;
    bridges?: Record<string, string>; // name -> texto del puente
    roles?: Record<string, { role: string; text: string }>;
  };
}

type LeaderEntry = HiringReportData["leader"];

const CTX_ORDER = ["leadership", "execution", "innovation", "decision", "conversation", "relationship"] as const;
const COMP_ORDER = ["EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"] as const;
const DIM_ORDER = ["growth", "collab", "understand"] as const;
const DRIVER_ORDER = ["TRUST", "MOTIVATION", "CHANGE", "TEAMWORK", "EXECUTION"] as const;

// Banda de afinidad/LVS → color del relleno (Python BAND_COLOR / VSB).
const BAND_COLOR: Record<"hot" | "warm" | "cold", string> = {
  hot: C.violet, warm: HIRING_WARM, cold: HIRING_COLD,
};
const VSB: Record<"low" | "mid" | "high", string> = {
  low: HIRING_COLD, mid: HIRING_WARM, high: C.greenDark,
};

// ── i18n: objeto único por idioma con TODAS las claves que consumen las
//    secciones. es/pt copiados del dict T del Python; en traducido con criterio.
//    Las funciones (anchor, supera, sello3, etc.) interpolan; las plantillas con
//    {placeholder} usan el helper fmt(). ──
const L = {
  es: {
    tag: "Sé quien quieres ser", gen: "Generado el",
    foot: "Rowi · Reporte Full + Hipótesis LVS · Recrutamento BDP — lente de relación, no veredicto",
    footFull: "Rowi · Reporte Full + Hipótesis LVS · lente de relación, no veredicto",
    footer: "Rowi · Reporte Full + Hipótesis LVS", footerTail: "lente de relación, no veredicto",
    // P1 resumen
    exec: "RESUMEN EJECUTIVO", title: "Reporte Full + Hipótesis LVS",
    t1: "El equipo alrededor de {l}, en una sola vista",
    s1: "Cuatro lentes sobre los mismos SEI: afinidad por contexto, lente relacional, benchmark mundial e hipótesis LVS.",
    cols: ["Persona", "Afinidad", "Percentil EQ", "LVS inferido", "Lente relacional"],
    anchor: "{f} (ancla): EQ {eq} · percentil mundial {p} · LVS inferido {lvs} ({b}) · {brain} · {inf} · {st}.",
    lectura: "Lectura de Rowi",
    principle: "Principio Rowi: esto es un lente sobre cómo trabajar, acompañar y desarrollar — no un criterio de selección.",
    principle2: "Cada brecha se cierra con un puente, nunca con un veredicto. Los perfiles de IE no deciden a quién contratar.",
    lec_p: [
      "{top} encabeza la afinidad ({a}/135) y está en el percentil {p} mundial. Comparte {n} talentos fuertes con {f}.",
      "{lo} muestra la mayor brecha ({al}/135, p{lp}): relación de desarrollo. Lee cada ficha con la entrevista.",
    ],
    // P2 afinidad + P3-4 fichas
    affMatrixSection: "SECCIÓN 1 · AFINIDAD", affTitle2: "Afinidad por contexto",
    affSub: "Motor Rowi · escala 0-135 · 6 contextos",
    affH: "¿Con quién se entiende mejor {f}? (promedio de 6 contextos)",
    ctxTitle: "Los 6 contextos del motor", ctxHeader: "Contexto",
    ctxLabel: { leadership: "Liderazgo", execution: "Ejecución", innovation: "Innovación", decision: "Decisión", conversation: "Conversación", relationship: "Relación" } as Record<string, string>,
    ctxDesc: { leadership: "Guiar, inspirar y sostener", execution: "Sacar el trabajo adelante", innovation: "Crear y explorar ideas", decision: "Decidir bajo presión", conversation: "Conversaciones que fluyen", relationship: "Vínculo y confianza" } as Record<string, string>,
    bandsNote: "Bandas: 108-135 alta sintonía (violeta) · 92-107 media (ámbar) · <92 baja (gris). Punto verde = mayor afinidad del contexto.",
    fichas: "Fichas de afinidad", detalle: "Detalle por persona", sec_aff: "SECCIÓN 1 · AFINIDAD",
    aff_ctx: "Afinidad por contexto", dims: "Dimensiones de la díada", styles: "Estilos de cerebro",
    shared: "Talentos fuertes compartidos ({n} de 18)", bright: "Competencias SEI donde ambos brillan (>=100)",
    dimk: { growth: "Crecimiento", collab: "Colaboración", understand: "Entendimiento" } as Record<string, string>,
    // P5 puentes
    sec_bridge: "SECCIÓN 1 · PUENTES", bridge_t: "El lente relacional",
    bridge_sub: "Quién aporta, quién opera parejo, dónde {f} lleva la delantera",
    cap_rel: "Capacidad relativa por contexto (pesos reales del motor)",
    cap_intro: "Diferencia entre la capacidad ponderada de cada persona y la de {f} en cada contexto. ±2 = operan parejo (sync).",
    persona: "Persona",
    bridge_leg: "+N = aporta por encima de {f} · sync = parejos · -N = {f} lleva la delantera (zona para acompañar o desarrollar).",
    bridge_each: "El puente con cada persona",
    b_eleva: "eleva", b_par: "par estable", b_del: "{f} lleva la delantera suave", b_men: "mentoría",
    lente_eleva: "Eleva a {f}", lente_par: "Par estable", lente_del: "{f} delante", lente_men: "Mentoría",
    b_l1: "Afinidad {a}/135, percentil EQ {p}. Comparte {n} talentos fuertes con {f}.",
    b_l2: "LVS inferido {lvs} ({b}). Nivel top en {at}/8 competencias.",
    // P6 benchmark intro
    secBench: "SECCIÓN 2 · BENCHMARK", benchTitle: "Benchmark Global",
    benchSub: "{n} SEI del mundo (State of the Heart 2018-2024)",
    benchH: "¿Cómo se ven estos perfiles frente a los top performers?",
    benchStats: ["evaluaciones SEI en el benchmark", "top performers (top 10% en éxito global)", "umbral de outcome para ser top (p90)", "perfiles del sector salud (referencia)"],
    eqpctT: "EQ total: percentil mundial (marcas: p25 · p50 · p75 · p90)",
    supera: "{role} · supera al {p}% del mundo · nivel top en {at}/8 competencias",
    pctEQ: "percentil EQ", roleLeader: "Líder", roleCand: "Cand.",
    // P7 top performer
    topTitle: "El perfil del top performer", topSub: "Top 10% en éxito global · qué los distingue",
    topH: "Qué separa a un top performer del resto del mundo",
    topCols: ["Métrica", "Población", "Top performers", "Brecha"],
    distTitle: "Lo más distintivo", distSub: "(brecha vs población)",
    eyebrowBench: "SECCIÓN 2 · BENCHMARK",
    sello: "El sello de los top performers: Metas nobles, Motivación intrínseca y Optimismo (+14 puntos cada una).",
    sello2: "No destacan por una sola habilidad: suben en las 8 a la vez, con el propósito y la energía propia como motor.",
    sello3: "Referencia sector salud (n={n}): EQ medio 99.1 — el listón es prácticamente el global.",
    purs: { K: "Conócete (Know)", C: "Elígete (Choose)", G: "Entrégate (Give)", EQ: "EQ total" } as Record<string, string>,
    // P8-10 fichas benchmark
    perfiles_t: "Perfiles vs top performers",
    supera_tops: "{role} · EQ {eq} · percentil mundial {p} · supera al {pb}% de los tops",
    comp_lbl: "Competencias vs población (gris) y top performers (verde) · escala 60-135",
    niveltop: "nivel top: {n}/8 comp.", vstop: "vs top",
    metod_t: "Metodología del benchmark",
    metod: [
      "State of the Heart de Six Seconds, 273.173 evaluaciones SEI (2018-2024) — el mismo dataset que Rowi usa en producción.",
      "Top performers según el criterio del motor Rowi: percentil 90 del outcome de éxito global \"Overall 4\" (promedio de",
      "efectividad, relaciones, calidad de vida y bienestar), n=27.318, umbral 110.33. Percentiles contra la distribución completa.",
      "\"Top performer\" = top 10% en éxito autorreportado, no en desempeño laboral medido.",
    ],
    // P11 LVS
    sec_vs: "SECCIÓN 3 · VITAL SIGNS", vs_t: "Hipótesis LVS",
    vs_sub: "Leadership Vital Signs inferido desde el SEI · NO normado",
    vs_h: "Cómo se vería cada persona en clave Vital Signs",
    vs_i1: "El motor Rowi infiere los 15 pulse points desde SEI + Brain Talents y los agrega en 5 drivers. La vista LVS",
    vs_i2: "(cómo lideras) promedia Motivación + Cambio + Ejecución — misma proyección que usa el Pre-SEI en producción.",
    drv: { TRUST: "Confianza", MOTIVATION: "Motivación", CHANGE: "Cambio", TEAMWORK: "Equipo", EXECUTION: "Ejecución" } as Record<string, string>,
    vista_lvs: "Vista LVS",
    vs_scale: "Escala Six Seconds 70-130 (norma 100). Bandas: <90 baja · 90-109 media · 110+ alta. Vistas TVS/OVS en la ficha de cada persona.",
    rolesTitle: "Capacidades LVS: cómo apoya cada quien", rolesSub: "Rol natural en el equipo según drivers y pulse points",
    roleByDriver: { TRUST: "Sostiene la confianza", MOTIVATION: "Mueve con propósito", CHANGE: "Impulsa el cambio", TEAMWORK: "Cohesiona al equipo", EXECUTION: "Lleva la ejecución" } as Record<string, string>,
    roleLine: "Driver más alto: {d} ({s}). LVS inferido {lvs} (banda {b}). Su rol natural se apoya en este motor; acompáñalo donde el LVS baja.",
    // P12 honestidad
    cierre_t: "Cómo leer este reporte", honest_t: "Notas de honestidad — léeme antes de decidir",
    honest: [
      "· El LVS de este reporte es INFERIDO desde el SEI individual (flag inferred / no normado). El LVS real es otro instrumento,",
      "  con evaluadores del entorno. La validación interna de Rowi muestra que el motor SEI->VS tiende a subestimar el nivel:",
      "  trátalo como hipótesis a confirmar, no como medición. · Pesos de afinidad y matriz BBP = hipótesis v0 calibrable.",
      "· Para un proceso de selección, esto NO reemplaza la entrevista ni el criterio técnico. Es un lente de relación y",
      "  desarrollo: cada brecha se cierra con un puente, nunca con un veredicto. La IE no decide a quién contratar.",
    ],
    // mapas auxiliares
    band: { low: "baja", mid: "media", high: "alta" } as Record<"low" | "mid" | "high", string>,
    comps: { EL: "Alfabetización emocional", RP: "Reconocer patrones", ACT: "Pensamiento consecuente", NE: "Navegar emociones", IM: "Motivación intrínseca", OP: "Optimismo", EMP: "Empatía", NG: "Metas nobles" } as Record<string, string>,
    talents: { dataMining: "Minería de datos", modeling: "Modelado", prioritizing: "Priorización", connection: "Conexión", emotionalInsight: "Lectura emocional", collaboration: "Colaboración", reflection: "Reflexión", adaptability: "Adaptabilidad", criticalThinking: "Pensamiento crítico", resilience: "Resiliencia", riskTolerance: "Tolerancia al riesgo", imagination: "Imaginación", proactivity: "Proactividad", commitment: "Compromiso", problemSolving: "Resolución de problemas", vision: "Visión", design: "Diseño", entrepreneurship: "Emprendimiento" } as Record<string, string>,
  },
  en: {
    tag: "Be who you want to be", gen: "Generated on",
    foot: "Rowi · Full Report + LVS Hypothesis · Recrutamento BDP — a relationship lens, not a verdict",
    footFull: "Rowi · Full Report + LVS Hypothesis · relationship lens, not a verdict",
    footer: "Rowi · Full Report + LVS Hypothesis", footerTail: "a relationship lens, not a verdict",
    exec: "EXECUTIVE SUMMARY", title: "Full Report + LVS Hypothesis",
    t1: "The team around {l}, in a single view",
    s1: "Four lenses on the same SEI: affinity by context, relational lens, global benchmark and LVS hypothesis.",
    cols: ["Person", "Affinity", "EQ percentile", "Inferred LVS", "Relational lens"],
    anchor: "{f} (anchor): EQ {eq} · world percentile {p} · inferred LVS {lvs} ({b}) · {brain} · {inf} · {st}.",
    lectura: "Rowi's read",
    principle: "Rowi principle: this is a lens on how to work, support and develop — not a selection criterion.",
    principle2: "Every gap is closed with a bridge, never with a verdict. EQ profiles do not decide who gets hired.",
    lec_p: [
      "{top} leads on affinity ({a}/135) and sits at the {p}th world percentile. Shares {n} strong talents with {f}.",
      "{lo} shows the widest gap ({al}/135, p{lp}): a development relationship. Read each profile alongside the interview.",
    ],
    affMatrixSection: "SECTION 1 · AFFINITY", affTitle2: "Affinity by context",
    affSub: "Rowi engine · scale 0-135 · 6 contexts",
    affH: "Who does {f} click with best? (average of 6 contexts)",
    ctxTitle: "The engine's 6 contexts", ctxHeader: "Context",
    ctxLabel: { leadership: "Leadership", execution: "Execution", innovation: "Innovation", decision: "Decision", conversation: "Conversation", relationship: "Relationship" } as Record<string, string>,
    ctxDesc: { leadership: "Guide, inspire and sustain", execution: "Get the work done", innovation: "Create and explore ideas", decision: "Decide under pressure", conversation: "Conversations that flow", relationship: "Bond and trust" } as Record<string, string>,
    bandsNote: "Bands: 108-135 high sync (violet) · 92-107 medium (amber) · <92 low (gray). Green dot = highest affinity in the context.",
    fichas: "Affinity cards", detalle: "Detail per person", sec_aff: "SECTION 1 · AFFINITY",
    aff_ctx: "Affinity by context", dims: "Dyad dimensions", styles: "Brain styles",
    shared: "Shared strong talents ({n} of 18)", bright: "SEI competencies where both shine (>=100)",
    dimk: { growth: "Growth", collab: "Collaboration", understand: "Understanding" } as Record<string, string>,
    sec_bridge: "SECTION 1 · BRIDGES", bridge_t: "The relational lens",
    bridge_sub: "Who adds, who runs even, where {f} leads",
    cap_rel: "Relative capacity by context (real engine weights)",
    cap_intro: "Difference between each person's weighted capacity and {f}'s in each context. ±2 = running even (sync).",
    persona: "Person",
    bridge_leg: "+N = adds above {f} · sync = even · -N = {f} leads (zone to support or develop).",
    bridge_each: "The bridge with each person",
    b_eleva: "lifts", b_par: "steady peer", b_del: "{f} leads gently", b_men: "mentoring",
    lente_eleva: "Lifts {f}", lente_par: "Steady peer", lente_del: "{f} ahead", lente_men: "Mentoring",
    b_l1: "Affinity {a}/135, EQ percentile {p}. Shares {n} strong talents with {f}.",
    b_l2: "Inferred LVS {lvs} ({b}). Top level in {at}/8 competencies.",
    secBench: "SECTION 2 · BENCHMARK", benchTitle: "Global Benchmark",
    benchSub: "{n} SEI worldwide (State of the Heart 2018-2024)",
    benchH: "How do these profiles compare to top performers?",
    benchStats: ["SEI assessments in the benchmark", "top performers (top 10% in global success)", "outcome threshold to be top (p90)", "healthcare-sector profiles (reference)"],
    eqpctT: "Total EQ: world percentile (marks: p25 · p50 · p75 · p90)",
    supera: "{role} · above {p}% of the world · top level in {at}/8 competencies",
    pctEQ: "EQ percentile", roleLeader: "Leader", roleCand: "Cand.",
    topTitle: "The top performer profile", topSub: "Top 10% in global success · what sets them apart",
    topH: "What separates a top performer from the rest of the world",
    topCols: ["Metric", "Population", "Top performers", "Gap"],
    distTitle: "Most distinctive", distSub: "(gap vs population)",
    eyebrowBench: "SECTION 2 · BENCHMARK",
    sello: "The top performers' hallmark: Noble Goals, Intrinsic Motivation and Optimism (+14 points each).",
    sello2: "They don't stand out on a single skill: they rise on all 8 at once, with purpose and their own energy as the engine.",
    sello3: "Healthcare-sector reference (n={n}): mean EQ 99.1 — the bar is essentially the global one.",
    purs: { K: "Know Yourself (Know)", C: "Choose Yourself (Choose)", G: "Give Yourself (Give)", EQ: "Total EQ" } as Record<string, string>,
    perfiles_t: "Profiles vs top performers",
    supera_tops: "{role} · EQ {eq} · world percentile {p} · above {pb}% of the tops",
    comp_lbl: "Competencies vs population (gray) and top performers (green) · scale 60-135",
    niveltop: "top level: {n}/8 comp.", vstop: "vs top",
    metod_t: "Benchmark methodology",
    metod: [
      "Six Seconds State of the Heart, 273,173 SEI assessments (2018-2024) — the same dataset Rowi uses in production.",
      "Top performers per the Rowi engine criterion: 90th percentile of the global success outcome \"Overall 4\" (average of",
      "effectiveness, relationships, quality of life and wellbeing), n=27,318, threshold 110.33. Percentiles against the full distribution.",
      "\"Top performer\" = top 10% in self-reported success, not in measured job performance.",
    ],
    sec_vs: "SECTION 3 · VITAL SIGNS", vs_t: "LVS hypothesis",
    vs_sub: "Leadership Vital Signs inferred from the SEI · NOT normed",
    vs_h: "How each person would look in Vital Signs terms",
    vs_i1: "The Rowi engine infers the 15 pulse points from SEI + Brain Talents and aggregates them into 5 drivers. The LVS view",
    vs_i2: "(how you lead) averages Motivation + Change + Execution — the same projection the Pre-SEI uses in production.",
    drv: { TRUST: "Trust", MOTIVATION: "Motivation", CHANGE: "Change", TEAMWORK: "Teamwork", EXECUTION: "Execution" } as Record<string, string>,
    vista_lvs: "LVS view",
    rolesTitle: "LVS capabilities: how each one supports", rolesSub: "Natural role on the team by drivers and pulse points",
    roleByDriver: { TRUST: "Holds the trust", MOTIVATION: "Moves with purpose", CHANGE: "Drives change", TEAMWORK: "Bonds the team", EXECUTION: "Carries execution" } as Record<string, string>,
    roleLine: "Highest driver: {d} ({s}). Inferred LVS {lvs} ({b} band). Their natural role leans on this engine; support them where the LVS drops.",
    vs_scale: "Six Seconds scale 70-130 (norm 100). Bands: <90 low · 90-109 mid · 110+ high. TVS/OVS views on each person's card.",
    cierre_t: "How to read this report", honest_t: "Honesty notes — read me before deciding",
    honest: [
      "· The LVS in this report is INFERRED from the individual SEI (inferred flag / not normed). The real LVS is a different instrument,",
      "  with raters from the environment. Rowi's internal validation shows the SEI->VS engine tends to underestimate the level:",
      "  treat it as a hypothesis to confirm, not a measurement. · Affinity weights and the BBP matrix = calibratable v0 hypothesis.",
      "· For a selection process, this does NOT replace the interview or technical judgment. It is a relationship-and-",
      "  development lens: every gap is closed with a bridge, never a verdict. EQ does not decide who gets hired.",
    ],
    band: { low: "low", mid: "medium", high: "high" } as Record<"low" | "mid" | "high", string>,
    comps: { EL: "Emotional literacy", RP: "Recognize patterns", ACT: "Consequential thinking", NE: "Navigate emotions", IM: "Intrinsic motivation", OP: "Optimism", EMP: "Empathy", NG: "Noble goals" } as Record<string, string>,
    talents: { dataMining: "Data mining", modeling: "Modeling", prioritizing: "Prioritizing", connection: "Connection", emotionalInsight: "Emotional insight", collaboration: "Collaboration", reflection: "Reflection", adaptability: "Adaptability", criticalThinking: "Critical thinking", resilience: "Resilience", riskTolerance: "Risk tolerance", imagination: "Imagination", proactivity: "Proactivity", commitment: "Commitment", problemSolving: "Problem solving", vision: "Vision", design: "Design", entrepreneurship: "Entrepreneurship" } as Record<string, string>,
  },
  pt: {
    tag: "Seja quem você quer ser", gen: "Gerado em",
    foot: "Rowi · Relatório Completo + Hipótese LVS · Recrutamento BDP — lente de relação, não veredito",
    footFull: "Rowi · Relatório Completo + Hipótese LVS · lente de relação, não veredito",
    footer: "Rowi · Relatório Completo + Hipótese LVS", footerTail: "lente de relação, não veredito",
    exec: "RESUMO EXECUTIVO", title: "Relatório Completo + Hipótese LVS",
    t1: "O time ao redor de {l}, em uma única visão",
    s1: "Quatro lentes sobre os mesmos SEI: afinidade por contexto, lente relacional, benchmark mundial e hipótese LVS.",
    cols: ["Pessoa", "Afinidade", "Percentil EQ", "LVS inferido", "Lente relacional"],
    anchor: "{f} (âncora): EQ {eq} · percentil mundial {p} · LVS inferido {lvs} ({b}) · {brain} · {inf} · {st}.",
    lectura: "Leitura do Rowi",
    principle: "Princípio Rowi: isto é uma lente sobre como trabalhar, acompanhar e desenvolver — não um critério de seleção.",
    principle2: "Cada lacuna se fecha com uma ponte, nunca com um veredito. Perfis de IE não decidem quem contratar.",
    lec_p: [
      "{top} encabeça a afinidade ({a}/135) e está no percentil {p} mundial. Compartilha {n} talentos fortes com {f}.",
      "{lo} mostra a maior lacuna ({al}/135, p{lp}): relação de desenvolvimento. Leia cada ficha com a entrevista.",
    ],
    affMatrixSection: "SEÇÃO 1 · AFINIDADE", affTitle2: "Afinidade por contexto",
    affSub: "Motor Rowi · escala 0-135 · 6 contextos",
    affH: "Com quem {f} se entende melhor? (média de 6 contextos)",
    ctxTitle: "Os 6 contextos do motor", ctxHeader: "Contexto",
    ctxLabel: { leadership: "Liderança", execution: "Execução", innovation: "Inovação", decision: "Decisão", conversation: "Conversa", relationship: "Relacionamento" } as Record<string, string>,
    ctxDesc: { leadership: "Guiar, inspirar e sustentar", execution: "Tirar o trabalho do papel", innovation: "Criar e explorar ideias", decision: "Decidir sob pressão", conversation: "Conversas que fluem", relationship: "Vínculo e confiança" } as Record<string, string>,
    bandsNote: "Bandas: 108-135 alta sintonia (violeta) · 92-107 média (âmbar) · <92 baixa (cinza). Ponto verde = maior afinidade do contexto.",
    fichas: "Fichas de afinidade", detalle: "Detalhe por pessoa", sec_aff: "SEÇÃO 1 · AFINIDADE",
    aff_ctx: "Afinidade por contexto", dims: "Dimensões da díade", styles: "Estilos de cérebro",
    shared: "Talentos fortes compartilhados ({n} de 18)", bright: "Competências SEI onde ambos brilham (>=100)",
    dimk: { growth: "Crescimento", collab: "Colaboração", understand: "Entendimento" } as Record<string, string>,
    sec_bridge: "SEÇÃO 1 · PONTES", bridge_t: "A lente relacional",
    bridge_sub: "Quem agrega, quem opera em par, onde {f} lidera",
    cap_rel: "Capacidade relativa por contexto (pesos reais do motor)",
    cap_intro: "Diferença entre a capacidade ponderada de cada pessoa e a de {f} em cada contexto. ±2 = operam em par (sync).",
    persona: "Pessoa",
    bridge_leg: "+N = agrega acima de {f} · sync = em par · -N = {f} lidera (zona para acompanhar ou desenvolver).",
    bridge_each: "A ponte com cada pessoa",
    b_eleva: "eleva", b_par: "par estável", b_del: "{f} lidera de leve", b_men: "mentoria",
    lente_eleva: "Eleva {f}", lente_par: "Par estável", lente_del: "{f} à frente", lente_men: "Mentoria",
    b_l1: "Afinidade {a}/135, percentil EQ {p}. Compartilha {n} talentos fortes com {f}.",
    b_l2: "LVS inferido {lvs} ({b}). Nível top em {at}/8 competências.",
    secBench: "SEÇÃO 2 · BENCHMARK", benchTitle: "Benchmark Global",
    benchSub: "{n} SEI do mundo (State of the Heart 2018-2024)",
    benchH: "Como esses perfis se comparam aos top performers?",
    benchStats: ["avaliações SEI no benchmark", "top performers (top 10% em sucesso global)", "corte de outcome para ser top (p90)", "perfis do setor saúde (referência)"],
    eqpctT: "EQ total: percentil mundial (marcas: p25 · p50 · p75 · p90)",
    supera: "{role} · supera {p}% do mundo · nível top em {at}/8 competências",
    pctEQ: "percentil EQ", roleLeader: "Líder", roleCand: "Cand.",
    topTitle: "O perfil do top performer", topSub: "Top 10% em sucesso global · o que os distingue",
    topH: "O que separa um top performer do resto do mundo",
    topCols: ["Métrica", "População", "Top performers", "Lacuna"],
    distTitle: "O mais distintivo", distSub: "(lacuna vs população)",
    eyebrowBench: "SEÇÃO 2 · BENCHMARK",
    sello: "A marca dos top performers: Metas nobres, Motivação intrínseca e Otimismo (+14 pontos cada).",
    sello2: "Não se destacam por uma só habilidade: sobem nas 8 ao mesmo tempo, com o propósito e a energia própria como motor.",
    sello3: "Referência setor saúde (n={n}): EQ médio 99.1 — a régua é praticamente a global.",
    purs: { K: "Conheça-se (Know)", C: "Escolha-se (Choose)", G: "Entregue-se (Give)", EQ: "EQ total" } as Record<string, string>,
    perfiles_t: "Perfis vs top performers",
    supera_tops: "{role} · EQ {eq} · percentil mundial {p} · supera {pb}% dos tops",
    comp_lbl: "Competências vs população (cinza) e top performers (verde) · escala 60-135",
    niveltop: "nível top: {n}/8 comp.", vstop: "vs top",
    metod_t: "Metodologia do benchmark",
    metod: [
      "State of the Heart da Six Seconds, 273.173 avaliações SEI (2018-2024) — o mesmo dataset que o Rowi usa em produção.",
      "Top performers segundo o critério do motor Rowi: percentil 90 do outcome de sucesso global \"Overall 4\" (média de",
      "efetividade, relacionamentos, qualidade de vida e bem-estar), n=27.318, corte 110.33. Percentis contra a distribuição completa.",
      "\"Top performer\" = top 10% em sucesso autorrelatado, não em desempenho profissional medido.",
    ],
    sec_vs: "SEÇÃO 3 · VITAL SIGNS", vs_t: "Hipótese LVS",
    vs_sub: "Leadership Vital Signs inferido do SEI · NÃO normatizado",
    vs_h: "Como cada pessoa se veria em chave Vital Signs",
    vs_i1: "O motor Rowi infere os 15 pulse points do SEI + Brain Talents e os agrega em 5 drivers. A visão LVS",
    vs_i2: "(como você lidera) é a média de Motivação + Mudança + Execução — mesma projeção que o Pre-SEI usa em produção.",
    drv: { TRUST: "Confiança", MOTIVATION: "Motivação", CHANGE: "Mudança", TEAMWORK: "Equipe", EXECUTION: "Execução" } as Record<string, string>,
    vista_lvs: "Visão LVS",
    rolesTitle: "Capacidades LVS: como cada um apoia", rolesSub: "Papel natural na equipe segundo drivers e pulse points",
    roleByDriver: { TRUST: "Sustenta a confiança", MOTIVATION: "Move com propósito", CHANGE: "Impulsiona a mudança", TEAMWORK: "Une a equipe", EXECUTION: "Conduz a execução" } as Record<string, string>,
    roleLine: "Driver mais alto: {d} ({s}). LVS inferido {lvs} (banda {b}). Seu papel natural se apoia neste motor; acompanhe onde o LVS cai.",
    vs_scale: "Escala Six Seconds 70-130 (norma 100). Bandas: <90 baixa · 90-109 média · 110+ alta. Visões TVS/OVS na ficha de cada pessoa.",
    cierre_t: "Como ler este relatório", honest_t: "Notas de honestidade — leia antes de decidir",
    honest: [
      "· O LVS deste relatório é INFERIDO do SEI individual (flag inferred / não normatizado). O LVS real é outro instrumento,",
      "  com avaliadores do entorno. A validação interna do Rowi mostra que o motor SEI->VS tende a subestimar o nível:",
      "  trate como hipótese a confirmar, não como medição. · Pesos de afinidade e matriz BBP = hipótese v0 calibrável.",
      "· Para um processo de seleção, isto NÃO substitui a entrevista nem o critério técnico. É uma lente de relação e",
      "  desenvolvimento: cada lacuna se fecha com uma ponte, nunca com um veredito. A IE não decide quem contratar.",
    ],
    band: { low: "baixa", mid: "média", high: "alta" } as Record<"low" | "mid" | "high", string>,
    comps: { EL: "Alfabetização emocional", RP: "Reconhecer padrões", ACT: "Pensamento consequente", NE: "Navegar emoções", IM: "Motivação intrínseca", OP: "Otimismo", EMP: "Empatia", NG: "Metas nobres" } as Record<string, string>,
    talents: { dataMining: "Mineração de dados", modeling: "Modelagem", prioritizing: "Priorização", connection: "Conexão", emotionalInsight: "Leitura emocional", collaboration: "Colaboração", reflection: "Reflexão", adaptability: "Adaptabilidade", criticalThinking: "Pensamento crítico", resilience: "Resiliência", riskTolerance: "Tolerância ao risco", imagination: "Imaginação", proactivity: "Proatividade", commitment: "Comprometimento", problemSolving: "Resolução de problemas", vision: "Visão", design: "Design", entrepreneurship: "Empreendedorismo" } as Record<string, string>,
  },
} as const;

type T = (typeof L)[Lang];

/** Sustituye {clave} por su valor (imita str.format(**k) del Python). */
function fmt(tpl: string, vars: Record<string, string | number>): string {
  return tpl.replace(/\{(\w+)\}/g, (_m, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

/** Separador de miles con punto (Python f"{n:,}".replace(",",".")). */
function miles(n: number): string {
  return Math.round(n).toLocaleString("de-DE");
}

/** Etiqueta de la "lente relacional" (col 5 de la tabla P1) según la media de
 * relationalDelta del candidato respecto al líder. */
function lensLabel(c: HiringCandidate, t: T, leaderFirst: string): string {
  const dm = CTX_ORDER.reduce((s, k) => s + (c.relationalDelta[k] ?? 0), 0) / CTX_ORDER.length;
  if (dm >= 2) return fmt(t.lente_eleva, { f: leaderFirst });
  if (dm > -2) return t.lente_par;
  if (dm > -10) return fmt(t.lente_del, { f: leaderFirst });
  return t.lente_men;
}

/** Etiqueta humana de un brain talent por idioma (fallback = key humanizada). */
function talentLabel(key: string, t: T): string {
  const m = t.talents[key];
  if (m) return m;
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()).trim();
}

export async function buildReporteFullHiring(data: HiringReportData, lang: Lang = "es", owl?: Buffer): Promise<Buffer> {
  const t = L[lang];
  const genDate = data.meta.split("·").pop()?.trim() || new Date().toLocaleDateString("es");
  const pdf = new RowiPdf({ lang, footerLeft: t.foot, owl });
  // El header de cada página incrementa pdf.page; arrancamos en 0 para que la
  // primera headerAbs lo deje en 1 (espejo del PAGE[0]+=1 dentro de header()).
  pdf.page = 0;

  drawResumen(pdf, data, t, genDate);          // P1
  drawAfinidad(pdf, data, t);                   // P2
  drawFichasAff(pdf, data, t);                  // P3-4
  drawPuentes(pdf, data, t, genDate);           // P5
  drawBenchIntro(pdf, data, t, genDate);        // P6
  drawTopPerf(pdf, data, t, genDate);           // P7
  drawFichasBench(pdf, data, t, genDate);       // P8-10
  drawLvs(pdf, data, t, genDate);               // P11
  drawHonestidad(pdf, data, t, genDate);        // P12

  // Cada sección dibuja su propio footerAbs por página → no dupliques en finish.
  return pdf.finish({ skipFooter: true });
}

// ════════════════════════════════════════════════════════════════════════
// P1 · RESUMEN EJECUTIVO  (generate.py L170-195)
// ════════════════════════════════════════════════════════════════════════
function drawResumen(pdf: RowiPdf, data: HiringReportData, t: T, genDate: string): void {
  const d = pdf.doc;
  const leader = data.leader;
  const cand = data.candidates;
  const LEADER_FIRST = data.leaderName.split(" ")[0];

  pdf.headerAbs({ section: t.exec, title: t.title, subtitle: `${data.process} · ${data.meta}` });

  // Título + subtítulo de la página
  pdf.font("bold").fontSize(17).fillColor(C.ink)
    .text(fmt(t.t1, { l: data.leaderName }), MX, 108, { lineBreak: false });
  pdf.font("regular").fontSize(10).fillColor(C.muted)
    .text(t.s1, MX, 130, { width: CW, lineBreak: false });

  // Tabla 4 lentes — col0 fija a 150 (verdict minor: no truncar nombres);
  // el faltante de ancho se reparte entre las 4 columnas restantes.
  const tableTop = 158;
  const tx = MX;
  const fixedCol0 = 168;
  const restW = (CW - fixedCol0) / 4;
  const cw = [fixedCol0, restW, restW, restW, restW];
  const sumCw = cw.reduce((a, b) => a + b, 0);
  const headerBandH = 24;
  const rh = 38;

  d.roundedRect(tx, tableTop, sumCw, headerBandH, 6).fill(C.violet);
  {
    let xa = tx;
    for (let i = 0; i < t.cols.length; i++) {
      pdf.font("bold").fontSize(8.5).fillColor(C.white).text(t.cols[i], xa + 8, tableTop + 9, { width: cw[i] - 12, lineBreak: false, ellipsis: true });
      xa += cw[i];
    }
  }

  const rowsTop = tableTop + headerBandH;
  cand.forEach((c, r) => {
    const yy = rowsTop + r * rh;
    d.rect(tx, yy, sumCw, rh).fill(r % 2 === 0 ? C.white : "#faf8ff");
    const lente = lensLabel(c, t, LEADER_FIRST);
    const vals = [c.name, `${c.affinityAvg}/135`, `p${Math.round(c.eqPercentile)}`, `${c.lvs.score} (${t.band[c.lvs.band]})`, lente];
    let xa = tx;
    for (let i = 0; i < vals.length; i++) {
      if (i === 0) {
        pdf.font("bold").fontSize(8.5).fillColor(C.ink).text(c.name, xa + 8, yy + rh / 2 - 9, { width: cw[0] - 12, height: 11, lineBreak: false, ellipsis: true });
        pdf.font("regular").fontSize(7).fillColor(C.muted).text(`EQ ${c.eq}`, xa + 8, yy + rh / 2 + 3, { lineBreak: false });
      } else {
        pdf.font("regular").fontSize(9).fillColor(C.violetDark).text(vals[i], xa + 8, yy + rh / 2 - 4.5, { width: cw[i] - 12, lineBreak: false });
      }
      xa += cw[i];
    }
  });

  // Línea ancla del líder (lee leader.influence / leader.changeStyle directos)
  let cursor = rowsTop + cand.length * rh + 18;
  pdf.font("regular").fontSize(8.5).fillColor(C.muted).text(
    fmt(t.anchor, {
      f: LEADER_FIRST, eq: leader.eq, p: Math.round(leader.eqPercentile),
      lvs: leader.lvs.score, b: t.band[leader.lvs.band],
      brain: leader.brain, inf: leader.influence, st: leader.changeStyle,
    }),
    MX, cursor, { width: CW, lineBreak: false },
  );

  // Caja "Lectura de Rowi" (violeta)
  cursor += 24;
  const tp = cand[0];
  const lo = cand[cand.length - 1];
  const execLines = data.enrich?.execSummary
    ? splitToLines(data.enrich.execSummary, 2)
    : [
        fmt(t.lec_p[0], { top: tp.name.split(" ")[0], a: tp.affinityAvg, p: Math.round(tp.eqPercentile), n: tp.sharedTalents.length, f: LEADER_FIRST }),
        fmt(t.lec_p[1], { lo: lo.name.split(" ")[0], al: lo.affinityAvg, lp: Math.round(lo.eqPercentile) }),
      ];
  const lecBottom = pdf.lecturaAbs(MX, cursor, CW, execLines, t.lectura);

  // Caja principio (coral). Texto con WRAP real (no lineBreak:false, que
  // desbordaba la caja y solapaba las líneas).
  cursor = lecBottom + 18;
  const innerW = CW - 32;
  pdf.font("bold").fontSize(9.5);
  const pH1 = pdf.doc.heightOfString(t.principle, { width: innerW });
  pdf.font("regular").fontSize(9);
  const pH2 = pdf.doc.heightOfString(t.principle2, { width: innerW });
  const coralH = pH1 + pH2 + 24;
  d.roundedRect(MX, cursor, CW, coralH, 10).fill(C.coralBg);
  pdf.font("bold").fontSize(9.5).fillColor("#9a3412").text(t.principle, MX + 16, cursor + 12, { width: innerW });
  pdf.font("regular").fontSize(9).fillColor("#9a3412").text(t.principle2, MX + 16, cursor + 12 + pH1 + 2, { width: innerW });

  pdf.footerAbs({ foot: t.foot, genLeft: `${t.gen} ${genDate}` });
}

/** Parte un texto largo en `max` líneas para la caja lectura (fallback enrich). */
function splitToLines(s: string, max: number): string[] {
  const parts = s.split(/(?<=\.)\s+/).map((x) => x.trim()).filter(Boolean);
  if (parts.length <= max) return parts;
  return [parts.slice(0, parts.length - max + 1).join(" "), ...parts.slice(parts.length - max + 1)];
}

// ════════════════════════════════════════════════════════════════════════
// P2 · AFINIDAD + MATRIZ (puntos verdes)  (generate.py L197-229)
// ════════════════════════════════════════════════════════════════════════
function drawAfinidad(pdf: RowiPdf, data: HiringReportData, t: T): void {
  const d = pdf.doc;
  const cand = data.candidates;
  const nC = cand.length;
  const leaderFirst = data.leaderName.split(" ")[0];
  const GRAY = C.muted;

  pdf.doc.addPage();
  pdf.headerAbs({ section: t.affMatrixSection, title: t.affTitle2, subtitle: t.affSub });

  pdf.font("bold").fontSize(14).fillColor(C.ink).text(fmt(t.affH, { f: leaderFirst }), MX, 108, { lineBreak: false });

  // Ranking de candidatos
  const rankTop0 = 132;
  for (let i = 0; i < nC; i++) {
    const cd = cand[i];
    const cardTop = rankTop0 + i * 44;
    d.save();
    d.roundedRect(MX, cardTop, CW, 40, 8).lineWidth(1.2).strokeColor(C.track).stroke();
    d.restore();
    const circleColor = i === 0 ? C.violet : i === 1 ? C.violetDark : GRAY;
    const ccx = MX + 20;
    const ccy = cardTop + 20;
    d.circle(ccx, ccy, 10).fill(circleColor);
    pdf.font("bold").fontSize(10).fillColor(C.white).text(String(i + 1), ccx - 10, ccy - 5, { width: 20, align: "center", lineBreak: false });
    const textX = MX + 40;
    pdf.font("bold").fontSize(10.5).fillColor(C.ink).text(cd.name, textX, cardTop + 6, { width: PAGE_W - 144 - textX - 6, lineBreak: false, ellipsis: true });
    pdf.font("regular").fontSize(7.5).fillColor(GRAY).text(`EQ ${cd.eq} · ${cd.brain} · ${cd.changeStyle} · ${cd.influence}`, textX, cardTop + 18, { width: 300, lineBreak: false, ellipsis: true });
    pdf.scoreBarAbs(textX, cardTop + 28, 300, 7, cd.affinityAvg);
    pdf.font("bold").fontSize(14).fillColor(C.violetDark).text(String(cd.affinityAvg), PAGE_W - 144 - 60, cardTop + 11, { width: 60, align: "right", lineBreak: false });
    pdf.font("regular").fontSize(7).fillColor(GRAY).text("/ 135", PAGE_W - 144 - 60, cardTop + 27, { width: 60, align: "right", lineBreak: false });
    const band: "hot" | "warm" = cd.affinityAvg < 108 ? "warm" : "hot";
    pdf.bandChipAbs(PAGE_W - 132, cardTop + 12, band, 86, 16);
  }

  // Título de la matriz
  const myTop = rankTop0 + nC * 44 + 6;
  pdf.font("bold").fontSize(14).fillColor(C.ink).text(t.ctxTitle, MX, myTop, { lineBreak: false });

  // Matriz 6 contextos × candidatos. headerTop=myTop+32 (verdict minor: clavar al Python).
  const tx = MX;
  const headerTop = myTop + 32;
  const headerH = 22;
  const rh = 44;
  const fc = 120;
  const rest = (CW - fc) / nC;
  const colW: number[] = [fc, ...Array(nC).fill(rest)];
  const tableW = colW.reduce((a, b) => a + b, 0);
  const ns = cand.map((c) => c.name.split(" ")[0]);

  d.roundedRect(tx, headerTop, tableW, headerH, 6).fill(C.violet);
  pdf.font("bold").fontSize(8.5).fillColor(C.white).text(t.ctxHeader, tx + 10, headerTop + 7, { lineBreak: false });
  for (let i = 0; i < nC; i++) {
    const cxp = tx + colW[0] + colW.slice(1, i + 1).reduce((a, b) => a + b, 0);
    pdf.font("bold").fontSize(8.5).fillColor(C.white).text(ns[i], cxp, headerTop + 7, { width: colW[i + 1], align: "center", lineBreak: false });
  }

  for (let r = 0; r < CTX_ORDER.length; r++) {
    const ctx = CTX_ORDER[r];
    const rowTop = headerTop + headerH + r * rh;
    d.rect(tx, rowTop, tableW, rh).fill(r % 2 === 0 ? C.white : "#faf8ff");
    pdf.font("bold").fontSize(9).fillColor(C.ink).text(t.ctxLabel[ctx], tx + 10, rowTop + 8, { width: colW[0] - 14, lineBreak: false });
    pdf.font("regular").fontSize(6.5).fillColor(GRAY).text(t.ctxDesc[ctx].slice(0, 34), tx + 10, rowTop + 20, { width: colW[0] - 14, lineBreak: false });
    const best = Math.max(...cand.map((c) => c.affinityByContext[ctx] ?? 0));
    for (let i = 0; i < nC; i++) {
      const cd = cand[i];
      const heat = cd.affinityByContext[ctx] ?? 0;
      const cband = cd.affinityBands[ctx] ?? "warm";
      const cxp = tx + colW[0] + colW.slice(1, i + 1).reduce((a, b) => a + b, 0);
      const cwi = colW[i + 1];
      pdf.font("bold").fontSize(12).fillColor(BAND_COLOR[cband]).text(String(heat), cxp, rowTop + 12, { width: cwi, align: "center", lineBreak: false });
      pdf.scoreBarAbs(cxp + 10, rowTop + 32, cwi - 20, 4, heat, { col: BAND_COLOR[cband] });
      if (heat === best) pdf.greenDot(cxp + cwi / 2 + 16, rowTop + 18, 3.5);
    }
  }

  const notesTop = headerTop + headerH + CTX_ORDER.length * rh + 10;
  pdf.font("regular").fontSize(8).fillColor(GRAY).text(t.bandsNote, MX, notesTop, { width: CW, lineBreak: false });
  pdf.footerAbs({ foot: t.foot });
}

// ════════════════════════════════════════════════════════════════════════
// P3-4 · FICHAS DE AFINIDAD (2 por página)  (generate.py L231-258)
// ════════════════════════════════════════════════════════════════════════
function drawFichasAff(pdf: RowiPdf, data: HiringReportData, t: T): void {
  const cand = data.candidates;
  const leader = data.leader;
  const total = Math.ceil(cand.length / 2);

  for (let pi = 0; pi < cand.length; pi += 2) {
    const n = pi / 2 + 1;
    pdf.doc.addPage();
    pdf.headerAbs({ title: `${t.fichas} (${n}/${total})`, subtitle: t.detalle, section: t.sec_aff });
    fichaAff(pdf, cand[pi], pi + 1, 112, leader, t);
    if (pi + 1 < cand.length) fichaAff(pdf, cand[pi + 1], pi + 2, 452, leader, t);
    pdf.footerAbs({ foot: t.foot });
  }
}

function fichaAff(pdf: RowiPdf, cd: HiringCandidate, rank: number, cardTop: number, leader: LeaderEntry, t: T): void {
  const d = pdf.doc;
  const x0 = MX;
  const cardw = CW;
  const ch = 322;
  const tb = (off: number, fs: number) => cardTop + off - fs * 0.80;

  d.lineWidth(1.2);
  d.roundedRect(x0, cardTop, cardw, ch, 12).fillAndStroke(C.white, C.track);
  d.roundedRect(x0, cardTop, cardw, 54, 12).fill(C.violetBg);
  d.rect(x0, cardTop + 34, cardw, 20).fill(C.violetBg);

  // círculo de rank — baseline objetivo del Python es y0-31 (no y0-27)
  d.circle(x0 + 28, cardTop + 27, 14).fill(C.violet);
  pdf.font("bold").fontSize(11).fillColor(C.white).text(String(rank), x0 + 14, cardTop + 31 - 11 * 0.80, { width: 28, align: "center", lineBreak: false });

  pdf.font("bold").fontSize(12.5).fillColor(C.ink).text(cd.name, x0 + 50, tb(22, 12.5), { lineBreak: false });
  pdf.font("regular").fontSize(8.5).fillColor(C.muted).text(`EQ ${cd.eq} · ${cd.brain} · ${cd.changeStyle} · ${cd.influence}`, x0 + 50, tb(36, 8.5), { lineBreak: false });

  const scoreRightX = x0 + cardw - 110;
  pdf.font("bold").fontSize(20).fillColor(C.violetDark).text(String(cd.affinityAvg), scoreRightX - 60, tb(34, 20), { width: 60, align: "right", lineBreak: false });
  pdf.font("regular").fontSize(7.5).fillColor(C.muted).text("/ 135", scoreRightX - 60, tb(46, 7.5), { width: 60, align: "right", lineBreak: false });
  // chip a x0+cardw-92 (verdict minor: ~28px de desborde como el original)
  pdf.bandChipAbs(x0 + cardw - 92, cardTop + 40, cd.affinityAvg < 108 ? "warm" : "hot", 86, 15);

  // columna IZQ: afinidad × 6 contextos
  const bx = x0 + 20;
  const by = cardTop + 76;
  pdf.font("bold").fontSize(9.5).fillColor(C.ink).text(t.aff_ctx, bx, by - 9.5 * 0.80, { lineBreak: false });
  CTX_ORDER.forEach((ctx, i) => {
    const v = cd.affinityByContext[ctx] ?? 0;
    const band = cd.affinityBands[ctx] ?? "warm";
    const rowBase = by + 18 + i * 19;
    pdf.font("regular").fontSize(8.5).fillColor(C.muted).text(t.ctxLabel[ctx], bx, rowBase - 1 - 8.5 * 0.80, { lineBreak: false });
    pdf.scoreBarAbs(bx + 78, rowBase, 120, 8, v, { col: BAND_COLOR[band] });
    pdf.font("bold").fontSize(8.5).fillColor(C.ink).text(String(v), bx + 204, rowBase - 1 - 8.5 * 0.80, { lineBreak: false });
  });

  // columna DER: dims de díada + estilos de cerebro
  const dx = x0 + 280;
  pdf.font("bold").fontSize(9.5).fillColor(C.ink).text(t.dims, dx, by - 9.5 * 0.80, { lineBreak: false });
  DIM_ORDER.forEach((k, i) => {
    const rowBase = by + 18 + i * 19;
    pdf.font("regular").fontSize(8.5).fillColor(C.muted).text(t.dimk[k], dx, rowBase - 1 - 8.5 * 0.80, { lineBreak: false });
    pdf.scoreBarAbs(dx + 78, rowBase, 100, 8, cd.dims[k]);
    pdf.font("bold").fontSize(8.5).fillColor(C.ink).text(String(cd.dims[k]), dx + 184, rowBase - 1 - 8.5 * 0.80, { lineBreak: false });
  });
  const styleBase = by + 18 + 3 * 19;
  pdf.font("regular").fontSize(8.5).fillColor(C.muted).text(t.styles, dx, styleBase - 1 - 8.5 * 0.80, { lineBreak: false });
  pdf.font("bold").fontSize(8.5).fillColor(C.violetDark).text(`${leader.brain} × ${cd.brain} = ${cd.bbp.toFixed(0)}/100`, dx + 78, styleBase - 1 - 8.5 * 0.80, { lineBreak: false });

  // talentos compartidos (chips violeta). maxw = ancho útil (verdict major fix).
  // ty2 subido a +124 y gaps ajustados para que las 3 filas de chips de un
  // candidato con muchos talentos compartidos (p.ej. 17/18) quepan dentro de la
  // tarjeta de 322px sin desbordar el borde inferior.
  const ty2 = by + 124;
  const maxw = PAGE_W - MX - bx; // preserva el borde derecho del diseño aprobado
  pdf.font("bold").fontSize(9.5).fillColor(C.ink).text(fmt(t.shared, { n: cd.sharedTalents.length }), bx, ty2 - 9.5 * 0.80, { lineBreak: false });
  const sharedWords = cd.sharedTalents.length ? cd.sharedTalents.map((k) => talentLabel(k, t)) : ["—"];
  const lastTop = pdf.chipsAbs(bx, ty2 + 16, sharedWords, maxw, { fill: C.violetBg, txt: C.violetDark });

  // competencias donde ambos brillan (chips teal).
  const cy2 = lastTop + 30;
  pdf.font("bold").fontSize(9.5).fillColor(C.ink).text(t.bright, bx, cy2 - 9.5 * 0.80, { lineBreak: false });
  const brightWords = cd.brightComps.length ? cd.brightComps.map((k) => t.comps[k] ?? k) : ["—"];
  pdf.chipsAbs(bx, cy2 + 17, brightWords, maxw, { fill: C.tealBg, txt: C.greenDark });
}

// ════════════════════════════════════════════════════════════════════════
// P5 · LENTE RELACIONAL / "El puente con cada persona"  (generate.py L260-297)
// Usa cd.relationalDelta del DATO (NO recalcula wcap/deltas — blocker corregido).
// ════════════════════════════════════════════════════════════════════════
function drawPuentes(pdf: RowiPdf, data: HiringReportData, t: T, genDate: string): void {
  const doc = pdf.doc;
  const leaderFirst = data.leaderName.split(" ")[0];
  const cand = data.candidates;

  pdf.doc.addPage();
  pdf.headerAbs({ title: t.bridge_t, subtitle: fmt(t.bridge_sub, { f: leaderFirst }), section: t.sec_bridge });

  pdf.font("bold").fillColor(C.ink).fontSize(14).text(t.cap_rel, MX, 120, { lineBreak: false });
  pdf.font("regular").fillColor(C.muted).fontSize(9).text(fmt(t.cap_intro, { f: leaderFirst }), MX, 138, { width: CW, lineBreak: false });

  const tx = MX;
  const nameW = 120;
  const ctxW = (CW - nameW) / 6;
  const rh = 28;
  const headRh = 22;
  const tableTopY = 158;

  doc.roundedRect(tx, tableTopY, CW, headRh, 6).fill(C.violet);
  pdf.font("bold").fillColor(C.white).fontSize(8).text(t.persona, tx + 8, tableTopY + headRh / 2 - 4, { lineBreak: false });
  for (let i = 0; i < CTX_ORDER.length; i++) {
    const cxp = tx + nameW + i * ctxW;
    pdf.font("bold").fillColor(C.white).fontSize(8).text(t.ctxLabel[CTX_ORDER[i]], cxp, tableTopY + headRh / 2 - 4, { width: ctxW, align: "center", lineBreak: false });
  }

  const rowsTop = tableTopY + headRh;
  for (let r = 0; r < cand.length; r++) {
    const cd = cand[r];
    const yy = rowsTop + r * rh;
    const dd = cd.relationalDelta;
    doc.rect(tx, yy, CW, rh).fill(r % 2 === 0 ? C.white : "#faf8ff");
    pdf.font("bold").fillColor(C.ink).fontSize(8.5).text(cd.name.split(" ")[0], tx + 8, yy + rh / 2 - 5, { lineBreak: false });
    for (let i = 0; i < CTX_ORDER.length; i++) {
      const ctx = CTX_ORDER[i];
      const dv = dd[ctx] ?? 0;
      const cxp = tx + nameW + i * ctxW;
      let bg: string, fg: string, tt: string;
      if (Math.abs(dv) < 2) { bg = C.violetBg; fg = C.violetDark; tt = "sync"; }
      else if (dv > 0) { bg = C.tealBg; fg = C.greenDark; tt = `+${Math.round(dv)}`; }
      else { bg = C.coralBg; fg = C.coral; tt = `${Math.round(dv)}`; }
      const chipY = yy + (rh - 18) / 2;
      doc.roundedRect(cxp + 8, chipY, ctxW - 16, 18, 5).fill(bg);
      pdf.font("bold").fillColor(fg).fontSize(8.5).text(tt, cxp, chipY + 18 / 2 - 5, { width: ctxW, align: "center", lineBreak: false });
    }
  }

  const legendY = rowsTop + cand.length * rh + 12;
  pdf.font("regular").fillColor(C.muted).fontSize(8).text(fmt(t.bridge_leg, { f: leaderFirst }), MX, legendY, { width: CW, lineBreak: false });

  const eachTitleY = legendY + 22;
  pdf.font("bold").fillColor(C.ink).fontSize(14).text(t.bridge_each, MX, eachTitleY, { lineBreak: false });

  let by = eachTitleY + 24;
  for (const cd of cand) {
    const dd = cd.relationalDelta;
    const vals = CTX_ORDER.map((c) => dd[c] ?? 0);
    const dm = vals.reduce((a, b) => a + b, 0) / 6;
    let col: string, bg: string, vd: string;
    if (dm >= 2) { col = C.greenDark; bg = C.tealBg; vd = t.b_eleva; }
    else if (dm > -2) { col = C.violetDark; bg = C.violetBg; vd = t.b_par; }
    else if (dm > -10) { col = C.coral; bg = C.coralBg; vd = fmt(t.b_del, { f: leaderFirst }); }
    else { col = HIRING_COLD; bg = "#f1f5f9"; vd = t.b_men; }
    const bridge = data.enrich?.bridges?.[cd.name];
    const lines = bridge
      ? splitToLines(bridge, 2)
      : [
          fmt(t.b_l1, { a: cd.affinityAvg, p: Math.round(cd.eqPercentile), n: cd.sharedTalents.length, f: leaderFirst }),
          fmt(t.b_l2, { lvs: cd.lvs.score, b: t.band[cd.lvs.band], at: cd.compsAtTopLevel }),
        ];
    const h = 22 + lines.length * 12 + 8;
    doc.roundedRect(MX, by, CW, h, 8).fill(bg);
    doc.rect(MX, by, 4, h).fill(col);
    // título a by+16 y líneas a by+29 (verdict minor: equilibrar vertical como el Python)
    pdf.font("bold").fillColor(col).fontSize(9.5).text(`${cd.name.split(" ")[0]} · ${vd}`, MX + 16, by + 16, { lineBreak: false });
    pdf.font("regular").fillColor(C.ink).fontSize(8.5);
    for (let j = 0; j < lines.length; j++) {
      doc.text(lines[j], MX + 16, by + 29 + j * 12, { width: CW - 24, lineBreak: false });
    }
    by += h + 8;
  }

  pdf.footerAbs({ foot: t.foot, genLeft: `${t.gen} ${genDate}` });
}

// ════════════════════════════════════════════════════════════════════════
// P6 · BENCHMARK intro  (generate.py L299-318)
// ════════════════════════════════════════════════════════════════════════
function drawBenchIntro(pdf: RowiPdf, data: HiringReportData, t: T, genDate: string): void {
  const doc = pdf.doc;
  const b = data.benchmark;

  pdf.doc.addPage();
  pdf.headerAbs({ title: t.benchTitle, subtitle: fmt(t.benchSub, { n: miles(b.nTotal) }), section: t.secBench });

  const thr = (n: number) => (Number.isInteger(n) ? String(n) : String(n));

  let baseTop = 120;
  pdf.font("bold").fontSize(15).fillColor(C.ink).text(t.benchH, MX, baseTop - 15, { lineBreak: false });

  // 4 stat-cards
  baseTop += 28; // 148
  const cardTop = baseTop;
  const cardH = 70;
  doc.roundedRect(MX, cardTop, CW, cardH, 10).fill(C.violetBg);
  const stats: [string, string][] = [
    [miles(b.nTotal), t.benchStats[0]],
    [miles(b.nTop), t.benchStats[1]],
    [thr(b.threshold), t.benchStats[2]],
    [miles(b.nHealthcare ?? 0), t.benchStats[3]],
  ];
  const cwx = CW / 4;
  for (let i = 0; i < stats.length; i++) {
    const [num, lbl] = stats[i];
    const cx = MX + i * cwx;
    pdf.font("bold").fontSize(16).fillColor(C.violetDark).text(num, cx, cardTop + 30 - 16, { width: cwx, align: "center", lineBreak: false });
    pdf.font("regular").fontSize(7.5).fillColor(C.muted);
    const segs = wrapChars(lbl, 26);
    for (let j = 0; j < segs.length; j++) {
      doc.text(segs[j], cx, cardTop + 44 + j * 9 - 7.5, { width: cwx, align: "center", lineBreak: false });
    }
  }

  // título ranking
  baseTop += 100; // 248
  pdf.font("bold").fontSize(13).fillColor(C.ink).text(t.eqpctT, MX, baseTop - 13, { lineBreak: false });

  let ry = baseTop + 16;
  type Row = { name: string; pct: number; atTop: number; role: string };
  const allp: Row[] = [
    { name: data.leader.name, pct: data.leader.eqPercentile, atTop: data.leader.compsAtTopLevel, role: t.roleLeader },
    ...data.candidates.map((c) => ({ name: c.name, pct: c.eqPercentile, atTop: c.compsAtTopLevel, role: t.roleCand })),
  ];
  allp.sort((a, z) => z.pct - a.pct);

  const barX = MX + 16; // inset 16 como el diseño aprobado (verdict minor fix)
  const rightX = PAGE_W - MX - 16;
  const barW = Math.round((330 / 515) * CW);

  for (const p of allp) {
    const boxTop = ry - 2;
    doc.lineWidth(1.2);
    doc.roundedRect(MX, boxTop, CW, 46, 9).fillAndStroke(C.white, C.track);
    pdf.font("bold").fontSize(10.5).fillColor(C.ink).text(p.name, barX, boxTop + 9, { lineBreak: false });
    pdf.font("regular").fontSize(8).fillColor(C.muted).text(fmt(t.supera, { role: p.role, p: Math.round(p.pct), at: p.atTop }), barX, boxTop + 22, { lineBreak: false });
    pdf.pctBarAbs(barX, boxTop + 31, barW, 9, p.pct);
    // pNN grande ARRIBA, "percentil EQ" DEBAJO (verdict major fix: orden vertical)
    pdf.font("bold").fontSize(15).fillColor(C.violetDark).text(`p${Math.round(p.pct)}`, rightX - 60, boxTop + 11, { width: 60, align: "right", lineBreak: false });
    pdf.font("regular").fontSize(7.5).fillColor(C.muted).text(t.pctEQ, rightX - 80, boxTop + 28, { width: 80, align: "right", lineBreak: false });
    ry += 54;
  }

  pdf.footerAbs({ foot: t.footFull, genLeft: `${t.gen} ${genDate}` });
}

/** Envuelve texto a ~`width` caracteres por línea (port de textwrap.wrap). */
function wrapChars(s: string, width: number): string[] {
  const words = s.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if (cur.length === 0) cur = w;
    else if (cur.length + 1 + w.length <= width) cur += " " + w;
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines;
}

// ════════════════════════════════════════════════════════════════════════
// P7 · PERFIL DEL TOP PERFORMER  (generate.py L320-343)
// ════════════════════════════════════════════════════════════════════════
function drawTopPerf(pdf: RowiPdf, data: HiringReportData, t: T, genDate: string): void {
  const doc = pdf.doc;
  const B = data.benchmark;
  const pop = B.population;
  const topp = B.topPerformers;
  const GRAY = C.muted;
  const ZEBRA = "#faf8ff";
  const A78 = "#a78bfa";

  pdf.doc.addPage();
  pdf.headerAbs({ title: t.topTitle, subtitle: t.topSub, section: t.eyebrowBench });

  const headTop = 111; // verdict minor: baseline 15pt cae en ~122 como el Python
  pdf.font("bold").fontSize(15).fillColor(C.ink).text(t.topH, MX, headTop, { lineBreak: false });

  const tx = MX;
  const cw = [160, 90, 90, 75];
  const tableW = cw[0] + cw[1] + cw[2] + cw[3];
  const rh = 26;
  const headerTop = headTop + 34;

  // filas: EQ + K/C/G + 8 comps. Etiquetas K/C/G con sufijo (Know/Choose/Give) (verdict major fix).
  const rows: [string, string][] = [
    ["EQ", t.purs.EQ],
    ...(["K", "C", "G"] as const).map((k) => [k, t.purs[k]] as [string, string]),
    ...COMP_ORDER.map((k) => [k, t.comps[k] ?? k] as [string, string]),
  ];

  doc.roundedRect(tx, headerTop, tableW, 24, 6).fill(C.violet);
  pdf.font("bold").fontSize(9).fillColor(C.white);
  const tcols = t.topCols;
  const colYtxt = headerTop + 8;
  doc.text(tcols[0], tx + 10, colYtxt, { lineBreak: false });
  doc.text(tcols[1], tx + cw[0], colYtxt, { width: cw[1], align: "center", lineBreak: false });
  doc.text(tcols[2], tx + cw[0] + cw[1], colYtxt, { width: cw[2], align: "center", lineBreak: false });
  doc.text(tcols[3], tx + cw[0] + cw[1] + cw[2], colYtxt, { width: cw[3], align: "center", lineBreak: false });

  const rowsTop = headerTop + 24;
  rows.forEach(([key, lbl], r) => {
    const yy = rowsTop + r * rh;
    doc.rect(tx, yy, tableW, rh).fill(r % 2 === 0 ? C.white : ZEBRA);
    const pm = pop[key];
    const tm = topp[key];
    const txtY = yy + 9;
    doc.fillColor(C.ink);
    (key === "EQ" ? pdf.font("bold") : pdf.font("regular")).fontSize(9);
    doc.text(lbl, tx + 10, txtY, { lineBreak: false });
    if (pm === undefined || tm === undefined) {
      pdf.font("regular").fontSize(9.5).fillColor(GRAY).text("—", tx + cw[0], txtY, { width: cw[1], align: "center", lineBreak: false });
      return;
    }
    pdf.font("regular").fontSize(9.5).fillColor(GRAY).text(pm.toFixed(1), tx + cw[0], txtY, { width: cw[1], align: "center", lineBreak: false });
    pdf.font("bold").fontSize(9.5).fillColor(C.greenDark).text(tm.toFixed(1), tx + cw[0] + cw[1], txtY, { width: cw[2], align: "center", lineBreak: false });
    pdf.font("bold").fontSize(9.5).fillColor(C.violetDark).text(`+${(tm - pm).toFixed(1)}`, tx + cw[0] + cw[1] + cw[2], txtY, { width: cw[3], align: "center", lineBreak: false });
  });

  // panel lateral "Lo más distintivo"
  const dx = tx + tableW + 18;
  pdf.font("bold").fontSize(10).fillColor(C.ink).text(t.distTitle, dx, headerTop + 6, { lineBreak: false });
  pdf.font("regular").fontSize(7.5).fillColor(GRAY).text(t.distSub, dx, headerTop + 18, { lineBreak: false });
  const dist = B.distinctive;
  const maxd = dist.length ? dist[0][1] : 1;
  const distTop = headerTop + 30; // verdict minor fix: subir el bloque
  dist.forEach(([k, v], i) => {
    const yy = distTop + i * 30;
    pdf.font("bold").fontSize(7).fillColor(C.ink).text(t.comps[k] ?? k, dx, yy, { lineBreak: false });
    const barTop = yy + 9;
    doc.roundedRect(dx, barTop, 56, 7, 3.5).fill(C.track);
    const fillW = Math.max(7, (56 * v) / maxd);
    doc.roundedRect(dx, barTop, fillW, 7, 3.5).fill(i < 3 ? C.violet : A78);
    pdf.font("bold").fontSize(7.5).fillColor(C.violetDark).text(`+${v.toFixed(1)}`, dx + 60, barTop - 0.5, { lineBreak: false });
  });

  // caja sello (violetBg) — texto con WRAP real para no solaparse.
  const tableBottom = rowsTop + rows.length * rh;
  const boxTop = tableBottom + 20;
  const selloW = CW - 32;
  const sello3Txt = fmt(t.sello3, { n: miles(B.nHealthcare ?? 0) });
  pdf.font("bold").fontSize(10);
  const sH1 = doc.heightOfString(t.sello, { width: selloW });
  pdf.font("regular").fontSize(9);
  const sH2 = doc.heightOfString(t.sello2, { width: selloW });
  const sH3 = doc.heightOfString(sello3Txt, { width: selloW });
  const boxH = sH1 + sH2 + sH3 + 24;
  doc.roundedRect(MX, boxTop, CW, boxH, 10).fill(C.violetBg);
  pdf.font("bold").fontSize(10).fillColor(C.violetDark).text(t.sello, MX + 16, boxTop + 12, { width: selloW });
  pdf.font("regular").fontSize(9).fillColor(GRAY).text(t.sello2, MX + 16, boxTop + 12 + sH1 + 2, { width: selloW });
  pdf.doc.text(sello3Txt, MX + 16, boxTop + 12 + sH1 + sH2 + 4, { width: selloW });

  pdf.footerAbs({ foot: `${t.footer} · ${data.process} — ${t.footerTail}`, genLeft: `${t.gen} ${genDate}` });
}

// ════════════════════════════════════════════════════════════════════════
// P8-10 · FICHAS BENCHMARK (doble-marca)  (generate.py L345-373)
// ════════════════════════════════════════════════════════════════════════
interface FichaPerson {
  name: string; role: string; eq: number; pct: number; atTop: number; pctBelow: number;
  comps: { key: string; score: number; pctl: number; vsTop: number }[];
}

function drawFichasBench(pdf: RowiPdf, data: HiringReportData, t: T, genDate: string): void {
  const pop = data.benchmark.population;
  const topp = data.benchmark.topPerformers;
  const all: FichaPerson[] = [
    { name: data.leader.name, role: t.roleLeader, eq: data.leader.eq, pct: data.leader.eqPercentile, atTop: data.leader.compsAtTopLevel, pctBelow: data.leader.pctOfTopsBelow, comps: data.leader.competencies },
    ...data.candidates.map((cd) => ({ name: cd.name, role: t.roleCand, eq: cd.eq, pct: cd.eqPercentile, atTop: cd.compsAtTopLevel, pctBelow: cd.pctOfTopsBelow, comps: cd.competencies })),
  ];
  all.sort((a, b) => b.pct - a.pct);
  const total = Math.ceil(all.length / 2);

  for (let pi = 0; pi < all.length; pi += 2) {
    const pageNo = pi / 2 + 1;
    pdf.doc.addPage();
    pdf.headerAbs({ title: `${t.perfiles_t} (${pageNo}/${total})`, subtitle: t.detalle, section: t.secBench });
    fichaBench(pdf, all[pi], 112, pop, topp, t);
    if (pi + 1 < all.length) fichaBench(pdf, all[pi + 1], 430, pop, topp, t);
    if (pi + 2 >= all.length) {
      const ykTop = pi + 1 < all.length ? 112 + 318 + 30 : 112 + 318;
      pdf.font("bold").fontSize(12).fillColor(C.ink).text(t.metod_t, MX, ykTop - 12, { lineBreak: false });
      pdf.font("regular").fontSize(9).fillColor(C.muted);
      t.metod.forEach((l, j) => {
        pdf.doc.text(l, MX, ykTop + 16 + j * 12 - 9, { lineBreak: false });
      });
    }
    pdf.footerAbs({ foot: t.foot, genLeft: `${t.gen} ${genDate}` });
  }
}

function fichaBench(pdf: RowiPdf, p: FichaPerson, top0: number, pop: Record<string, number>, topp: Record<string, number>, t: T): void {
  const d = pdf.doc;
  const ch = 296;
  const x0 = MX;
  const cardw = CW;

  d.lineWidth(1.2);
  d.roundedRect(x0, top0, cardw, ch, 12).fillAndStroke(C.white, C.track);
  d.roundedRect(x0, top0, cardw, 52, 12).fill(C.violetBg);
  d.rect(x0, top0 + 34, cardw, 18).fill(C.violetBg);

  const initials = p.name.split(/\s+/).slice(0, 2).map((w) => w[0] ?? "").join("");
  d.circle(x0 + 26, top0 + 26, 13).fill(C.violet);
  pdf.font("bold").fontSize(9).fillColor(C.white).text(initials, x0 + 26 - 13, top0 + 26 - 4.5, { width: 26, align: "center", lineBreak: false });

  pdf.font("bold").fontSize(12).fillColor(C.ink).text(p.name, x0 + 46, top0 + 22 - 12, { lineBreak: false });
  pdf.font("regular").fontSize(8).fillColor(C.muted).text(
    fmt(t.supera_tops, { role: p.role, eq: String(p.eq), p: p.pct.toFixed(0), pb: p.pctBelow.toFixed(0) }),
    x0 + 46, top0 + 35 - 8, { lineBreak: false },
  );

  pdf.font("bold").fontSize(18).fillColor(C.violetDark).text(`p${p.pct.toFixed(0)}`, x0, top0 + 32 - 18, { width: cardw - 100, align: "right", lineBreak: false });

  const n = p.atTop;
  const chipCol = n >= 5 ? C.violet : n >= 3 ? GREEN : n >= 1 ? HIRING_WARM : HIRING_COLD;
  d.roundedRect(x0 + cardw - 92, top0 + 39 - 15, 82, 15, 7.5).fill(chipCol);
  pdf.font("bold").fontSize(7.5).fillColor(C.white).text(fmt(t.niveltop, { n }), x0 + cardw - 92, top0 + 34.5 - 7.5, { width: 82, align: "center", lineBreak: false });

  const bx = x0 + 20;
  const byOff = 72;
  pdf.font("bold").fontSize(9).fillColor(C.ink).text(t.comp_lbl, bx, top0 + byOff - 9, { lineBreak: false });

  COMP_ORDER.forEach((key, i) => {
    const cm = p.comps.find((c) => c.key === key);
    if (!cm) return;
    const rowTop = top0 + byOff + 18 + i * 23;
    pdf.font("regular").fontSize(8.5).fillColor(C.muted).text(t.comps[cm.key] ?? cm.key, bx, rowTop + 1 - 8.5, { lineBreak: false });
    pdf.compBarAbs(bx + 128, rowTop, 240, 8, cm.score, pop[cm.key], topp[cm.key]);
    pdf.font("bold").fontSize(8.5).fillColor(C.ink).text(cm.score.toFixed(0), bx + 374, rowTop + 1 - 8.5, { lineBreak: false });
    pdf.font("regular").fontSize(7.5).fillColor(C.muted).text(`p${cm.pctl.toFixed(0)}`, bx + 400, rowTop + 1 - 7.5, { lineBreak: false });
    const dlt = cm.vsTop;
    pdf.font("bold").fontSize(7.5).fillColor(dlt >= 0 ? C.greenDark : HIRING_COLD).text(`${dlt >= 0 ? "+" : ""}${dlt.toFixed(1)} ${t.vstop}`, bx + 428, rowTop + 1 - 7.5, { lineBreak: false });
  });
}

// ════════════════════════════════════════════════════════════════════════
// P11 · HIPÓTESIS LVS (tabla 5 drivers × persona)  (generate.py L375-396)
// ════════════════════════════════════════════════════════════════════════
function drawLvs(pdf: RowiPdf, data: HiringReportData, t: T, genDate: string): void {
  const d = pdf.doc;
  pdf.doc.addPage();
  pdf.headerAbs({ title: t.vs_t, subtitle: t.vs_sub, section: t.sec_vs });

  // baseline→top de glifo con ~0.20·fs (verdict blocker fix: NO 0.80).
  const bl = (yTop: number, fs: number) => yTop - fs * 0.20;

  pdf.font("bold").fontSize(15).fillColor(C.ink).text(t.vs_h, MX, bl(120, 15), { lineBreak: false });
  pdf.font("regular").fontSize(9).fillColor(C.muted).text(t.vs_i1, MX, bl(134, 9), { lineBreak: false });
  pdf.font("regular").fontSize(9).fillColor(C.muted).text(t.vs_i2, MX, bl(146, 9), { lineBreak: false });

  const ALL: (LeaderEntry | HiringCandidate)[] = [data.leader, ...data.candidates];
  const nCols = ALL.length;
  const totalW = CW;
  const fc = Math.round(115 * (CW / (PAGE_W - 80)));
  const rest = (totalW - fc) / nCols;
  const colW = [fc, ...Array(nCols).fill(rest)];
  const rh = 32;
  const tx = MX;
  const headerTop = 170; // borde superior de la banda violeta de la tabla
  const colX = (i: number) => tx + colW[0] + colW.slice(1, i + 1).reduce((a, b) => a + b, 0);

  const cstr = (s: string, cx: number, top: number, fs: number, weight: "bold" | "regular", color: string, cwi: number) => {
    pdf.font(weight).fontSize(fs).fillColor(color);
    d.text(s, cx - cwi / 2, top, { width: cwi, align: "center", lineBreak: false });
  };

  // cabecera
  d.roundedRect(tx, headerTop, totalW, 22, 6).fill(C.violet);
  pdf.font("bold").fontSize(8).fillColor(C.white).text("Driver", tx + 8, headerTop + 22 / 2 - 4, { lineBreak: false });
  ALL.forEach((p, i) => {
    const cxp = colX(i);
    const cwi = colW[i + 1];
    cstr((p.name ?? "").split(" ")[0] || "—", cxp + cwi / 2, headerTop + 22 / 2 - 4, 8, "bold", C.white, cwi);
  });

  const rowsTop = headerTop + 22;
  const dsc = (p: LeaderEntry | HiringCandidate, code: string) => p.lvsDrivers.find((x) => x.code === code) ?? null;

  DRIVER_ORDER.forEach((dc, r) => {
    const rowTop = rowsTop + r * rh;
    d.rect(tx, rowTop, totalW, rh).fill(r % 2 === 0 ? C.white : "#faf8ff");
    pdf.font("bold").fontSize(9).fillColor(C.ink).text(t.drv[dc] ?? dc, tx + 8, rowTop + rh / 2 - 5, { lineBreak: false });
    ALL.forEach((p, i) => {
      const dr = dsc(p, dc);
      if (!dr) return;
      const cxp = colX(i);
      const cwi = colW[i + 1];
      cstr(dr.score.toFixed(0), cxp + cwi / 2, rowTop + 8, 11, "bold", VSB[dr.band], cwi);
      cstr(t.band[dr.band], cxp + cwi / 2, rowTop + 20, 6.5, "regular", VSB[dr.band], cwi);
    });
  });

  // fila final "Vista LVS" (#efe9fc)
  const lvsRowTop = rowsTop + DRIVER_ORDER.length * rh;
  d.rect(tx, lvsRowTop, totalW, rh).fill("#efe9fc");
  pdf.font("bold").fontSize(9).fillColor(C.violetDark).text(t.vista_lvs, tx + 8, lvsRowTop + rh / 2 - 5, { lineBreak: false });
  ALL.forEach((p, i) => {
    const v = p.lvs;
    const cxp = colX(i);
    const cwi = colW[i + 1];
    cstr(String(v.score), cxp + cwi / 2, lvsRowTop + 8, 12, "bold", VSB[v.band], cwi);
    cstr(t.band[v.band], cxp + cwi / 2, lvsRowTop + 20, 6.5, "regular", VSB[v.band], cwi);
  });

  const noteTop = lvsRowTop + rh + 14;
  pdf.font("regular").fontSize(8).fillColor(C.muted).text(t.vs_scale, MX, noteTop, { width: CW, lineBreak: false });

  pdf.footerAbs({ foot: t.foot, genLeft: `${t.gen} ${genDate}` });
}

// ════════════════════════════════════════════════════════════════════════
// P12 · CAPACIDADES LVS (fichas de rol) + NOTAS DE HONESTIDAD
// Réplica del PDF aprobado pág.12: una ficha de rol por persona (líder +
// candidatos) con su rol natural según el driver más alto, y la caja de
// honestidad al pie. Los textos de rol pueden venir de data.enrich?.roles
// (plan superior); si no, plantilla determinista.
// ════════════════════════════════════════════════════════════════════════
function drawHonestidad(pdf: RowiPdf, data: HiringReportData, t: T, genDate: string): void {
  const d = pdf.doc;
  pdf.doc.addPage();
  pdf.headerAbs({ title: t.rolesTitle, subtitle: t.rolesSub, section: t.sec_vs });

  const innerW = CW - 32;
  const people = [data.leader, ...data.candidates];

  // ── Fichas de rol (una por persona) ──
  let cursor = 116;
  for (const p of people) {
    const topDriver = [...p.lvsDrivers].sort((a, b) => b.score - a.score)[0];
    const drvLabel = t.drv[topDriver?.code ?? ""] ?? topDriver?.code ?? "—";
    const enrich = data.enrich?.roles?.[p.name];
    const roleTitle = enrich?.role ?? (t.roleByDriver[topDriver?.code ?? ""] ?? "");
    const roleText = enrich?.text ?? fmt(t.roleLine, {
      d: drvLabel, s: Math.round(topDriver?.score ?? 0),
      lvs: p.lvs.score, b: t.band[p.lvs.band],
    });
    const barColor = p.lvs.band === "high" ? C.greenDark : p.lvs.band === "low" ? HIRING_COLD : C.violet;

    pdf.font("regular").fontSize(8.5);
    const textH = d.heightOfString(roleText, { width: innerW });
    const cardH = textH + 30;
    d.save();
    d.roundedRect(MX, cursor, CW, cardH, 8).fill("#f6f4fb");
    d.rect(MX, cursor, 4, cardH).fill(barColor);
    d.restore();
    pdf.font("bold").fontSize(10).fillColor(C.ink).text(p.name, MX + 16, cursor + 10, { width: CW * 0.6, lineBreak: false, ellipsis: true });
    if (roleTitle) {
      pdf.font("bold").fontSize(9).fillColor(barColor).text(roleTitle, PAGE_W - MX - CW * 0.4, cursor + 11, { width: CW * 0.4 - 16, align: "right", lineBreak: false, ellipsis: true });
    }
    pdf.font("regular").fontSize(8.5).fillColor("#444050").text(roleText, MX + 16, cursor + 26, { width: innerW });
    cursor += cardH + 8;
  }

  // ── Caja de honestidad (amber) con WRAP real ──
  cursor += 8;
  // El array honest viene pre-cortado al estilo Python; lo unimos en 2 párrafos
  // por el bullet "·" para que pdfkit los envuelva al ancho real (MX=48).
  const honestJoined = t.honest.map((l) => l.trim()).join(" ");
  const paras = honestJoined.split(/(?=· )/).map((s) => s.trim()).filter(Boolean);
  pdf.font("regular").fontSize(8.5);
  const parasH = paras.reduce((sum, pa) => sum + d.heightOfString(pa, { width: innerW }) + 4, 0);
  pdf.font("bold").fontSize(10.5);
  const titleH = d.heightOfString(t.honest_t, { width: innerW });
  const boxH = titleH + parasH + 24;
  d.roundedRect(MX, cursor, CW, boxH, 10).fill(C.amberBg);
  pdf.font("bold").fontSize(10.5).fillColor(C.amberTxt).text(t.honest_t, MX + 16, cursor + 12, { width: innerW });
  let ly = cursor + 12 + titleH + 6;
  pdf.font("regular").fontSize(8.5).fillColor(C.amberTxt);
  for (const pa of paras) {
    d.text(pa, MX + 16, ly, { width: innerW });
    ly += d.heightOfString(pa, { width: innerW }) + 4;
  }

  pdf.footerAbs({ foot: t.foot, genLeft: `${t.gen} ${genDate}` });
}
