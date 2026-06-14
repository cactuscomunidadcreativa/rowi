/**
 * 📄 Entregable: REPORTE FULL de HIRING (12 págs) — modelo "Recrutamento BDP".
 *
 * El entregable estrella del módulo Hiring. Cruza, para un proceso de selección
 * (un líder + N candidatos), cuatro lentes sobre los mismos SEI:
 *   Sección 1 · AFINIDAD   → ranking por contexto + matriz 6 contextos + puentes
 *   Sección 2 · BENCHMARK  → percentil mundial + perfil top performer + fichas
 *   Sección 3 · VITAL SIGNS→ hipótesis LVS (drivers + roles)
 *
 * Server-side (pdfkit, vía deliverables/pdf-kit). Parametrizado por idioma. Los
 * DATOS llegan ya calculados por los motores del repo (affinityEngine,
 * top-performers, calculate); este módulo solo maqueta.
 *
 * Texto interpretativo HÍBRIDO: plantillas deterministas por defecto (gratis,
 * reproducible); si `enrich` trae textos de IA (plan superior), los usa en su
 * lugar. El generador nunca llama IA directo — la capa de plan decide y pasa el
 * texto ya redactado.
 */
import { RowiPdf, C, MX, CW, PAGE_W, type Lang } from "./pdf-kit";

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
}

export interface HiringReportData {
  process: string; // "Recrutamento BDP"
  meta: string; // "SEI Adult v4 · 12-jun-2026"
  leaderName: string;
  leaderMeta: string; // "EQ 104.75 · percentil 73 · LVS 104 (media) · Visionary · Generator · Balanced"
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

const CTX_ORDER = ["leadership", "execution", "innovation", "decision", "conversation", "relationship"];
const COMP_ORDER = ["EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"];

// ── i18n ──
const L = {
  es: {
    eyebrowExec: "Resumen ejecutivo", eyebrowAff: "Sección 1 · Afinidad",
    eyebrowBridge: "Sección 1 · Puentes", eyebrowBench: "Sección 2 · Benchmark",
    eyebrowVs: "Sección 3 · Vital Signs",
    title: "Reporte Full + Hipótesis LVS", footer: "Rowi · Reporte Full + Hipótesis LVS",
    footerTail: "lente de relación, no veredicto", badge: "",
    t1: (l: string) => `El equipo alrededor de ${l}, en una sola vista`,
    s1: "Cuatro lentes sobre los mismos SEI: afinidad por contexto, lente relacional, benchmark mundial e hipótesis LVS.",
    cols: ["Persona", "Afinidad", "Percentil EQ", "LVS inferido", "Lente relacional"],
    anchor: (m: string) => `Ancla: ${m}`,
    affTitle: (l: string) => `¿Con quién se entiende mejor ${l}? (promedio de 6 contextos)`,
    ctxTitle: "Los 6 contextos del motor",
    ctx: { leadership: "Liderazgo", execution: "Ejecución", innovation: "Innovación", decision: "Decisión", conversation: "Conversación", relationship: "Relación" },
    bandsNote: "Bandas: 108-135 alta sintonía · 92-107 media · <92 baja. Punto verde = mayor afinidad del contexto.",
    bridgeTitle: "El lente relacional", bridgeSub: "Quién aporta, quién opera parejo, dónde el líder lleva la delantera",
    bridgeIntro: "Diferencia entre la capacidad ponderada de cada persona y la del líder en cada contexto. ±2 = operan parejo (sync).",
    bridgeLegend: "+N = aporta por encima del líder · sync = parejos · -N = el líder lleva la delantera (zona para acompañar o desarrollar).",
    benchTitle: "Benchmark Global", benchSub: (n: number) => `${n.toLocaleString("es")} SEI del mundo (State of the Heart 2018-2024)`,
    benchH: "¿Cómo se ven estos perfiles frente a los top performers?",
    benchStats: ["evaluaciones SEI", "top performers (top 10%)", "umbral de outcome (p90)", "perfiles sector salud"],
    eqPctTitle: "EQ total: percentil mundial (marcas: p25 · p50 · p75 · p90)",
    topTitle: "El perfil del top performer", topSub: "Top 10% en éxito global · qué los distingue",
    topH: "Qué separa a un top performer del resto del mundo",
    topCols: ["Métrica", "Población", "Top performers", "Brecha"],
    distTitle: "Lo más distintivo",
    vsTitle: "Hipótesis LVS", vsSub: "Leadership Vital Signs inferido desde el SEI · NO normado",
    vsH: "Cómo se vería cada persona en clave Vital Signs",
    vsIntro: "El motor infiere los 15 pulse points desde SEI + Brain Talents y los agrega en 5 drivers. LVS = Motivación + Cambio + Ejecución.",
    rolesTitle: "Capacidades LVS: cómo apoya cada quien",
    drivers: { TRUST: "Confianza", MOTIVATION: "Motivación", CHANGE: "Cambio", TEAMWORK: "Equipo", EXECUTION: "Ejecución" },
    band: { low: "baja", mid: "media", high: "alta" },
    lenteEleva: "Eleva al líder", lentePar: "Par estable", lenteDelante: "Líder delante", lenteMentoria: "Mentoría",
    principle: "Principio Rowi: esto es un lente sobre cómo trabajar, acompañar y desarrollar — no un criterio de selección.",
    principle2: "Cada brecha se cierra con un puente, nunca con un veredicto. Los perfiles de IE no deciden a quién contratar.",
    comps: { EL: "Alfabetización emocional", RP: "Reconocer patrones", ACT: "Pensamiento consecuente", NE: "Navegar emociones", IM: "Motivación intrínseca", OP: "Optimismo", EMP: "Empatía", NG: "Metas nobles" },
    vsTop: "vs top",
  },
  en: {
    eyebrowExec: "Executive summary", eyebrowAff: "Section 1 · Affinity",
    eyebrowBridge: "Section 1 · Bridges", eyebrowBench: "Section 2 · Benchmark",
    eyebrowVs: "Section 3 · Vital Signs",
    title: "Full Report + LVS Hypothesis", footer: "Rowi · Full Report + LVS Hypothesis",
    footerTail: "a relationship lens, not a verdict", badge: "",
    t1: (l: string) => `The team around ${l}, in a single view`,
    s1: "Four lenses on the same SEI: affinity by context, relational lens, global benchmark and LVS hypothesis.",
    cols: ["Person", "Affinity", "EQ percentile", "Inferred LVS", "Relational lens"],
    anchor: (m: string) => `Anchor: ${m}`,
    affTitle: (l: string) => `Who does ${l} click with best? (average of 6 contexts)`,
    ctxTitle: "The engine's 6 contexts",
    ctx: { leadership: "Leadership", execution: "Execution", innovation: "Innovation", decision: "Decision", conversation: "Conversation", relationship: "Relationship" },
    bandsNote: "Bands: 108-135 high attunement · 92-107 mid · <92 low. Green dot = highest affinity in that context.",
    bridgeTitle: "The relational lens", bridgeSub: "Who adds, who runs as a peer, where the leader leads",
    bridgeIntro: "Difference between each person's weighted capability and the leader's in each context. ±2 = peers (sync).",
    bridgeLegend: "+N = adds above the leader · sync = peers · -N = the leader leads (zone to support or develop).",
    benchTitle: "Global Benchmark", benchSub: (n: number) => `${n.toLocaleString("en")} SEI worldwide (State of the Heart 2018-2024)`,
    benchH: "How do these profiles compare to top performers?",
    benchStats: ["SEI assessments", "top performers (top 10%)", "outcome threshold (p90)", "healthcare profiles"],
    eqPctTitle: "Total EQ: world percentile (marks: p25 · p50 · p75 · p90)",
    topTitle: "The top performer profile", topSub: "Top 10% in overall success · what sets them apart",
    topH: "What separates a top performer from the rest of the world",
    topCols: ["Metric", "Population", "Top performers", "Gap"],
    distTitle: "Most distinctive",
    vsTitle: "LVS Hypothesis", vsSub: "Leadership Vital Signs inferred from the SEI · NOT normed",
    vsH: "How each person would look through a Vital Signs lens",
    vsIntro: "The engine infers the 15 pulse points from SEI + Brain Talents and aggregates them into 5 drivers. LVS = Motivation + Change + Execution.",
    rolesTitle: "LVS capabilities: how each one supports",
    drivers: { TRUST: "Trust", MOTIVATION: "Motivation", CHANGE: "Change", TEAMWORK: "Teamwork", EXECUTION: "Execution" },
    band: { low: "low", mid: "medium", high: "high" },
    lenteEleva: "Lifts the leader", lentePar: "Stable peer", lenteDelante: "Leader ahead", lenteMentoria: "Mentorship",
    principle: "Rowi principle: this is a lens on how to work, support and develop — not a selection criterion.",
    principle2: "Every gap is closed with a bridge, never with a verdict. EQ profiles do not decide who gets hired.",
    comps: { EL: "Emotional literacy", RP: "Recognize patterns", ACT: "Consequential thinking", NE: "Navigate emotions", IM: "Intrinsic motivation", OP: "Optimism", EMP: "Empathy", NG: "Noble goals" },
    vsTop: "vs top",
  },
  pt: {
    eyebrowExec: "Resumo executivo", eyebrowAff: "Seção 1 · Afinidade",
    eyebrowBridge: "Seção 1 · Pontes", eyebrowBench: "Seção 2 · Benchmark",
    eyebrowVs: "Seção 3 · Vital Signs",
    title: "Relatório Completo + Hipótese LVS", footer: "Rowi · Relatório Completo + Hipótese LVS",
    footerTail: "lente de relação, não veredito", badge: "",
    t1: (l: string) => `O time ao redor de ${l}, em uma única visão`,
    s1: "Quatro lentes sobre os mesmos SEI: afinidade por contexto, lente relacional, benchmark mundial e hipótese LVS.",
    cols: ["Pessoa", "Afinidade", "Percentil EQ", "LVS inferido", "Lente relacional"],
    anchor: (m: string) => `Âncora: ${m}`,
    affTitle: (l: string) => `Com quem ${l} se entende melhor? (média de 6 contextos)`,
    ctxTitle: "Os 6 contextos do motor",
    ctx: { leadership: "Liderança", execution: "Execução", innovation: "Inovação", decision: "Decisão", conversation: "Conversa", relationship: "Relacionamento" },
    bandsNote: "Bandas: 108-135 alta sintonia · 92-107 média · <92 baixa. Ponto verde = maior afinidade do contexto.",
    bridgeTitle: "A lente relacional", bridgeSub: "Quem agrega, quem opera em par, onde o líder lidera",
    bridgeIntro: "Diferença entre a capacidade ponderada de cada pessoa e a do líder em cada contexto. ±2 = em par (sync).",
    bridgeLegend: "+N = agrega acima do líder · sync = em par · -N = o líder lidera (zona para acompanhar ou desenvolver).",
    benchTitle: "Benchmark Global", benchSub: (n: number) => `${n.toLocaleString("pt")} SEI do mundo (State of the Heart 2018-2024)`,
    benchH: "Como esses perfis se comparam aos top performers?",
    benchStats: ["avaliações SEI", "top performers (top 10%)", "corte de outcome (p90)", "perfis setor saúde"],
    eqPctTitle: "EQ total: percentil mundial (marcas: p25 · p50 · p75 · p90)",
    topTitle: "O perfil do top performer", topSub: "Top 10% em sucesso global · o que os distingue",
    topH: "O que separa um top performer do resto do mundo",
    topCols: ["Métrica", "População", "Top performers", "Lacuna"],
    distTitle: "O mais distintivo",
    vsTitle: "Hipótese LVS", vsSub: "Leadership Vital Signs inferido do SEI · NÃO normatizado",
    vsH: "Como cada pessoa se veria em chave Vital Signs",
    vsIntro: "O motor infere os 15 pulse points do SEI + Brain Talents e os agrega em 5 drivers. LVS = Motivação + Mudança + Execução.",
    rolesTitle: "Capacidades LVS: como cada um apoia",
    drivers: { TRUST: "Confiança", MOTIVATION: "Motivação", CHANGE: "Mudança", TEAMWORK: "Equipe", EXECUTION: "Execução" },
    band: { low: "baixa", mid: "média", high: "alta" },
    lenteEleva: "Eleva o líder", lentePar: "Par estável", lenteDelante: "Líder à frente", lenteMentoria: "Mentoria",
    principle: "Princípio Rowi: isto é uma lente sobre como trabalhar, acompanhar e desenvolver — não um critério de seleção.",
    principle2: "Cada lacuna se fecha com uma ponte, nunca com um veredito. Perfis de IE não decidem quem contratar.",
    comps: { EL: "Alfabetização emocional", RP: "Reconhecer padrões", ACT: "Pensamento consequente", NE: "Navegar emoções", IM: "Motivação intrínseca", OP: "Otimismo", EMP: "Empatia", NG: "Metas nobres" },
    vsTop: "vs top",
  },
} as const;

const PURSUIT_LABEL: Record<Lang, Record<string, string>> = {
  es: { K: "Conócete", C: "Elígete", G: "Entrégate", EQ: "EQ total" },
  en: { K: "Know Yourself", C: "Choose Yourself", G: "Give Yourself", EQ: "Total EQ" },
  pt: { K: "Conheça-se", C: "Escolha-se", G: "Entregue-se", EQ: "EQ total" },
};

function lenteLabel(t: (typeof L)[Lang], delta: number): string {
  if (delta >= 2) return t.lenteEleva;
  if (delta > -2) return t.lentePar;
  if (delta > -10) return t.lenteDelante;
  return t.lenteMentoria;
}

export async function buildReporteFullHiring(data: HiringReportData, lang: Lang = "es", owl?: Buffer): Promise<Buffer> {
  const t = L[lang];
  const pdf = new RowiPdf({ lang, footerLeft: `${t.footer} · ${data.process} — ${t.footerTail}`, owl });
  const compL = (k: string) => (t.comps as Record<string, string>)[k] ?? k;

  const affSectionTitle = lang === "es" ? "Afinidad por contexto" : lang === "pt" ? "Afinidade por contexto" : "Affinity by context";
  const relSectionTitle = lang === "es" ? "Capacidad relativa por contexto" : lang === "pt" ? "Capacidade relativa por contexto" : "Relative capability by context";

  // ════ RESUMEN EJECUTIVO ════
  pdf.header({ eyebrow: t.eyebrowExec, title: t.title, subtitle: `${data.process} · ${data.meta}` });
  pdf.para(t.t1(data.leaderName), { size: 15, bold: true, color: C.ink });
  pdf.para(t.s1, { size: 9, color: C.muted });
  pdf.table(
    t.cols as unknown as string[],
    data.candidates.map((c) => {
      const dmean = CTX_ORDER.reduce((s, k) => s + (c.relationalDelta[k] ?? 0), 0) / CTX_ORDER.length;
      return [
        `${c.name}\n${c.role} · EQ ${c.eq}`,
        `${c.affinityAvg}/135`,
        `p${c.eqPercentile}`,
        `${c.lvs.score} (${t.band[c.lvs.band]})`,
        lenteLabel(t, dmean),
      ];
    }),
    [0.30, 0.16, 0.16, 0.18, 0.20],
  );
  pdf.note(t.anchor(data.leaderMeta));
  pdf.callout(data.enrich?.execSummary ?? buildExecSummary(data, lang), { lead: lang === "es" ? "Lectura de Rowi" : lang === "pt" ? "Leitura do Rowi" : "Rowi's read", bg: C.violet, leadColor: C.white });
  pdf.callout(t.principle + " " + t.principle2, { bg: C.coralBg, leadColor: C.amberTxt });

  // ════ AFINIDAD: ranking + matriz ════
  pdf.section({ eyebrow: t.eyebrowAff, title: t.affTitle(data.leaderName), need: 260,
    headerOnNewPage: { title: affSectionTitle, subtitle: "Motor Rowi · 0-135 · 6 contextos" } });
  data.candidates.forEach((c, i) => {
    pdf.rankCard({
      rank: i + 1, name: c.name,
      sub: `EQ ${c.eq} · ${c.brain} · ${c.changeStyle} · ${c.influence}`,
      value: c.affinityAvg, band: c.affinityAvg >= 108 ? "hot" : "warm",
      bandLabel: c.affinityAvg >= 108 ? (lang === "es" ? "Alta sintonía" : lang === "pt" ? "Alta sintonia" : "High") : (lang === "es" ? "Sintonía media" : lang === "pt" ? "Sintonia média" : "Mid"),
    });
  });
  pdf.h2(t.ctxTitle);
  affinityMatrix(pdf, data, t);
  pdf.note(t.bandsNote);

  // ════ LENTE RELACIONAL (puentes) ════
  pdf.section({ eyebrow: t.eyebrowBridge, title: relSectionTitle, need: 200,
    headerOnNewPage: { title: t.bridgeTitle, subtitle: t.bridgeSub } });
  pdf.para(t.bridgeIntro, { size: 9, color: C.muted });
  relationalMatrix(pdf, data, t);
  pdf.note(t.bridgeLegend);

  // ════ BENCHMARK intro + ranking percentil ════
  pdf.section({ eyebrow: t.eyebrowBench, title: t.benchH, need: 280,
    headerOnNewPage: { title: t.benchTitle, subtitle: t.benchSub(data.benchmark.nTotal) } });
  benchStatsRow(pdf, data, t);
  pdf.h2(t.eqPctTitle);
  data.candidates.forEach((c) => {
    pdf.ensure(30);
    const y = pdf.y;
    const sub = lang === "es"
      ? `${c.role} · supera al ${c.eqPercentile}% del mundo · nivel top en ${c.compsAtTopLevel}/8 competencias`
      : lang === "pt"
      ? `${c.role} · supera ${c.eqPercentile}% do mundo · nível top em ${c.compsAtTopLevel}/8 competências`
      : `${c.role} · above ${c.eqPercentile}% of the world · top level in ${c.compsAtTopLevel}/8 competencies`;
    pdf.font("bold").fontSize(10).fillColor(C.ink).text(c.name, MX, y, { lineBreak: false });
    pdf.font("regular").fontSize(7.5).fillColor(C.muted)
      .text(sub, MX, y + 12, { width: CW - 80, lineBreak: false });
    pdf.doc.roundedRect(MX + CW - 70, y, 60, 14, 7).fill(C.violet);
    pdf.font("bold").fontSize(11).fillColor(C.white).text(`p${c.eqPercentile}`, MX + CW - 70, y + 2, { width: 60, align: "center", lineBreak: false });
    pdf.y += 24;
    pdf.bar({ label: "", value: c.eqPercentile, min: 0, max: 100, norm: 90, labelW: 0, color: c.eqPercentile >= 90 ? C.violet : c.eqPercentile >= 70 ? C.greenDark : C.barMid });
    pdf.y += 4;
  });

  // ════ PERFIL TOP PERFORMER ════
  pdf.section({ eyebrow: t.eyebrowBench, title: t.topH, need: 320,
    headerOnNewPage: { title: t.topTitle, subtitle: t.topSub } });
  const rows: [string, string][] = [["EQ", PURSUIT_LABEL[lang].EQ], ...(["K", "C", "G"].map((k) => [k, PURSUIT_LABEL[lang][k]] as [string, string])), ...COMP_ORDER.map((k) => [k, compL(k)] as [string, string])];
  pdf.table(
    t.topCols as unknown as string[],
    rows.map(([key, label]) => {
      const pm = data.benchmark.population[key]; const tm = data.benchmark.topPerformers[key];
      if (pm === undefined || tm === undefined) return [label, "—", "—", "—"];
      return [label, pm.toFixed(1), tm.toFixed(1), `+${(tm - pm).toFixed(1)}`];
    }),
    [0.40, 0.20, 0.22, 0.18],
  );
  pdf.callout(
    lang === "es" ? "El sello de los top performers: Metas nobles, Motivación intrínseca y Optimismo (+14 cada una). No destacan en una sola habilidad: suben en las 8 a la vez."
    : lang === "pt" ? "A marca dos top performers: Metas nobres, Motivação intrínseca e Otimismo (+14 cada). Não se destacam em uma só habilidade: sobem nas 8 ao mesmo tempo."
    : "The top performers' hallmark: Noble Goals, Intrinsic Motivation and Optimism (+14 each). They don't stand out on one skill: they rise on all 8 at once.",
  );

  // ════ FICHAS BENCHMARK por persona ════
  const fichasTitle = lang === "es" ? "Perfiles vs top performers" : lang === "pt" ? "Perfis vs top performers" : "Profiles vs top performers";
  const fichasSub = lang === "es" ? "Detalle por persona" : lang === "pt" ? "Detalhe por pessoa" : "Detail per person";
  pdf.section({ eyebrow: t.eyebrowBench, title: fichasTitle, need: 240,
    headerOnNewPage: { title: fichasTitle, subtitle: fichasSub } });
  for (const c of data.candidates) {
    // cada ficha (h2 + ~8 barras) ocupa ~180pt; rompe página solo si no cabe.
    pdf.ensure(190);
    benchCard(pdf, c, data, t, lang, compL);
  }

  // ════ HIPÓTESIS LVS ════
  pdf.section({ eyebrow: t.eyebrowVs, title: t.vsH, need: 220,
    headerOnNewPage: { title: t.vsTitle, subtitle: t.vsSub } });
  pdf.para(t.vsIntro, { size: 9, color: C.muted });
  lvsDriverTable(pdf, data, t);

  // ════ ROLES (cómo apoya cada quien) ════
  const rolesSub = lang === "es" ? "Rol natural según drivers y pulse points" : lang === "pt" ? "Papel natural segundo drivers e pulse points" : "Natural role by drivers and pulse points";
  pdf.section({ eyebrow: t.eyebrowVs, title: t.rolesTitle, need: 260,
    headerOnNewPage: { title: t.rolesTitle, subtitle: rolesSub } });
  for (const c of data.candidates) {
    const role = data.enrich?.roles?.[c.name];
    const roleText = role?.text ?? buildRoleText(c, t, lang);
    const roleTitle = role?.role ?? "";
    pdf.callout(roleText, { lead: `${c.name}${roleTitle ? " · " + roleTitle : ""}`, leadColor: C.violetDark });
  }
  pdf.callout(
    lang === "es" ? "Notas de honestidad: el LVS es INFERIDO del SEI (no normado), hipótesis a confirmar. Pesos de afinidad y matriz BBP = hipótesis v0 calibrable. Este reporte es un lente de relación y desarrollo; la IE no decide a quién contratar."
    : lang === "pt" ? "Notas de honestidade: o LVS é INFERIDO do SEI (não normatizado), hipótese a confirmar. Pesos de afinidade e matriz BBP = hipótese v0 calibrável. Este relatório é uma lente de relação e desenvolvimento; a IE não decide quem contratar."
    : "Honesty notes: the LVS is INFERRED from the SEI (not normed), a hypothesis to confirm. Affinity weights and BBP matrix = calibratable v0 hypothesis. This report is a relationship-and-development lens; EQ does not decide who gets hired.",
    { bg: C.amberBg, leadColor: C.amberTxt, lead: lang === "en" ? "Read before deciding." : lang === "pt" ? "Leia antes de decidir." : "Léeme antes de decidir." },
  );

  return pdf.finish();
}

// ───────────────────────── plantillas deterministas ─────────────────────────
function buildExecSummary(data: HiringReportData, lang: Lang): string {
  const top = data.candidates[0];
  const last = data.candidates[data.candidates.length - 1];
  if (lang === "en") {
    return `${top.name} leads on affinity (${top.affinityAvg}/135) and sits at the ${top.eqPercentile}th world percentile. ${last.name} shows the widest gap (${last.affinityAvg}/135, p${last.eqPercentile}): a development relationship. Read each profile alongside the interview and the technical criteria.`;
  }
  if (lang === "pt") {
    return `${top.name} lidera a afinidade (${top.affinityAvg}/135) e está no percentil ${top.eqPercentile} mundial. ${last.name} mostra a maior lacuna (${last.affinityAvg}/135, p${last.eqPercentile}): relação de desenvolvimento. Leia cada perfil junto com a entrevista e o critério técnico.`;
  }
  return `${top.name} encabeza la afinidad (${top.affinityAvg}/135) y está en el percentil ${top.eqPercentile} mundial. ${last.name} muestra la mayor brecha (${last.affinityAvg}/135, p${last.eqPercentile}): relación de desarrollo. Lee cada ficha junto a la entrevista y el criterio técnico.`;
}

function buildRoleText(c: HiringCandidate, t: (typeof L)[Lang], lang: Lang): string {
  const topDriver = [...c.lvsDrivers].sort((a, b) => b.score - a.score)[0];
  const dl = (t.drivers as Record<string, string>)[topDriver?.code] ?? topDriver?.code ?? "";
  const lvsBand = t.band[c.lvs.band];
  if (lang === "en") return `Highest driver: ${dl} (${topDriver?.score.toFixed(0)}). Inferred LVS ${c.lvs.score} (${lvsBand} band). EQ percentile ${c.eqPercentile}, at top level in ${c.compsAtTopLevel}/8 competencies.`;
  if (lang === "pt") return `Driver mais alto: ${dl} (${topDriver?.score.toFixed(0)}). LVS inferido ${c.lvs.score} (banda ${lvsBand}). Percentil EQ ${c.eqPercentile}, em nível top em ${c.compsAtTopLevel}/8 competências.`;
  return `Driver más alto: ${dl} (${topDriver?.score.toFixed(0)}). LVS inferido ${c.lvs.score} (banda ${lvsBand}). Percentil EQ ${c.eqPercentile}, a nivel top en ${c.compsAtTopLevel}/8 competencias.`;
}

// ───────────────────────── bloques de maquetación ─────────────────────────
function affinityMatrix(pdf: RowiPdf, data: HiringReportData, t: (typeof L)[Lang]) {
  const headers = ["", ...data.candidates.map((c) => c.name.split(" ")[0])];
  const rows = CTX_ORDER.map((ctx) => {
    const best = Math.max(...data.candidates.map((c) => c.affinityByContext[ctx] ?? 0));
    return [
      (t.ctx as Record<string, string>)[ctx],
      ...data.candidates.map((c) => {
        const v = c.affinityByContext[ctx] ?? 0;
        return v === best ? `${v} *` : `${v}`;
      }),
    ];
  });
  const w = [0.28, ...data.candidates.map(() => 0.72 / data.candidates.length)];
  pdf.table(headers, rows, w, { fs: 8.5 });
}

function relationalMatrix(pdf: RowiPdf, data: HiringReportData, t: (typeof L)[Lang]) {
  const headers = ["", ...CTX_ORDER.map((c) => (t.ctx as Record<string, string>)[c])];
  const rows = data.candidates.map((c) => [
    c.name.split(" ")[0],
    ...CTX_ORDER.map((ctx) => {
      const d = c.relationalDelta[ctx] ?? 0;
      if (Math.abs(d) < 2) return "sync";
      return (d > 0 ? "+" : "") + d.toFixed(0);
    }),
  ]);
  const w = [0.16, ...CTX_ORDER.map(() => 0.84 / CTX_ORDER.length)];
  pdf.table(headers, rows, w, { fs: 8 });
}

function benchStatsRow(pdf: RowiPdf, data: HiringReportData, t: (typeof L)[Lang]) {
  const b = data.benchmark;
  const cards = [
    { n: b.nTotal, label: t.benchStats[0] },
    { n: b.nTop, label: t.benchStats[1] },
    { n: b.threshold, label: t.benchStats[2] },
    { n: b.nHealthcare ?? 0, label: t.benchStats[3] },
  ];
  const d = pdf.doc;
  const gap = 10; const cardW = (CW - 3 * gap) / 4;
  pdf.ensure(56);
  cards.forEach((card, i) => {
    const x = MX + i * (cardW + gap);
    d.roundedRect(x, pdf.y, cardW, 48, 8).fill(C.violetBg);
    pdf.font("bold").fontSize(15).fillColor(C.violetDark)
      .text(typeof card.n === "number" && card.n > 999 ? card.n.toLocaleString() : String(card.n), x, pdf.y + 8, { width: cardW, align: "center", lineBreak: false });
    pdf.font("regular").fontSize(7).fillColor(C.muted).text(card.label, x + 4, pdf.y + 28, { width: cardW - 8, align: "center" });
  });
  pdf.y += 58;
}

function benchCard(pdf: RowiPdf, c: HiringCandidate, data: HiringReportData, t: (typeof L)[Lang], lang: Lang, compL: (k: string) => string) {
  pdf.h2(`${c.name} · p${c.eqPercentile}`);
  pdf.note(`${c.role} · EQ ${c.eq} · ${lang === "es" ? "supera al" : lang === "pt" ? "supera" : "above"} ${c.pctOfTopsBelow}% ${lang === "es" ? "de los tops" : lang === "pt" ? "dos tops" : "of the tops"} · ${lang === "es" ? "nivel top en" : lang === "pt" ? "nível top em" : "top level in"} ${c.compsAtTopLevel}/8`);
  const pop = data.benchmark.population; const top = data.benchmark.topPerformers;
  pdf.barsBlock(
    c.competencies.map((cm) => ({
      label: `${compL(cm.key)} (p${cm.pctl}, ${cm.vsTop >= 0 ? "+" : ""}${cm.vsTop.toFixed(0)} ${t.vsTop})`,
      value: cm.score, min: 60, max: 135, labelW: 220,
      norm: pop[cm.key], color: cm.score >= (top[cm.key] ?? 999) ? C.violet : cm.score >= (pop[cm.key] ?? 0) ? C.barMid : C.muted,
    })),
  );
}

function lvsDriverTable(pdf: RowiPdf, data: HiringReportData, t: (typeof L)[Lang]) {
  const DRIVER_ORDER = ["TRUST", "MOTIVATION", "CHANGE", "TEAMWORK", "EXECUTION"];
  const headers = ["Driver", ...data.candidates.map((c) => c.name.split(" ")[0])];
  const rows = DRIVER_ORDER.map((code) => [
    (t.drivers as Record<string, string>)[code],
    ...data.candidates.map((c) => {
      const d = c.lvsDrivers.find((x) => x.code === code);
      return d ? `${d.score.toFixed(0)} ${t.band[d.band]}` : "—";
    }),
  ]);
  rows.push([
    "LVS",
    ...data.candidates.map((c) => `${c.lvs.score} ${t.band[c.lvs.band]}`),
  ]);
  const w = [0.22, ...data.candidates.map(() => 0.78 / data.candidates.length)];
  pdf.table(headers, rows, w, { fs: 8 });
}
