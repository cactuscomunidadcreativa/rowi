/**
 * 📄 Entregable: PERFIL INDIVIDUAL POR CANDIDATO (módulo Hiring).
 *
 * Una ficha por persona del proceso. NO es un veredicto ni un score de aptitud:
 * es la lente relacional de Rowi aplicada a una persona. Damos a TODAS las
 * personas como candidatas y la ficha responde "a quién puede ayudar esta
 * persona y en qué, y quién puede ayudarle a ella" — reciprocidad, no ranking.
 * Cada brecha se cierra con un puente, nunca con un veredicto.
 *
 * Reusa el mismo `HiringReportData` que el Reporte Full (un solo build de datos
 * sirve a ambos entregables) + el nombre de la persona a destacar. Para la
 * reciprocidad cruza la afinidad por contexto del destacado contra el resto.
 *
 * Dos modos:
 *  - "compacto" (1-2 págs): afinidad, percentil EQ vs benchmark, 8 competencias,
 *    hipótesis LVS, lente recíproca (quién ayuda a quién).
 *  - "completo": además abre detalle por contexto y los drivers LVS.
 *
 * Server-side (pdfkit, vía deliverables/pdf-kit). Parametrizado por idioma.
 */
import { RowiPdf, C, MX, CW, type Lang } from "./pdf-kit";
import type { HiringReportData, HiringCandidate } from "./reporte-full-hiring";

export type PerfilCandidatoMode = "compacto" | "completo";

const CTX_ORDER = ["leadership", "execution", "innovation", "decision", "conversation", "relationship"] as const;
const COMP_ORDER = ["EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"];

// ── i18n ──
const L = {
  es: {
    eyebrow: "Perfil individual · Hiring", title: "Perfil de candidato",
    footer: "Rowi · Perfil de candidato", footerTail: "lente de relación, no veredicto",
    role: "En el proceso", anchorLeader: (l: string) => `Líder del proceso: ${l}`,
    affLabel: "Afinidad media (0-135)", eqLabel: "Percentil EQ mundial", lvsLabel: "LVS inferido",
    compsTitle: "8 Competencias SEI vs perfil top performer (70–130)",
    compsIntro: "La línea punteada marca el nivel medio del top performer en cada competencia. Verde = ya a nivel top; ámbar = zona para acompañar. No es una nota: es dónde apoyar y dónde la persona ya sostiene.",
    vsTop: "vs top", atTop: "a nivel top", toSupport: "zona para acompañar",
    recipTitle: "Lente recíproca · quién ayuda a quién",
    recipIntro: "Esta persona no compite con el resto: se complementa. Aquí, dónde aporta a cada quien y dónde el equipo la eleva. Cada flecha es un puente para trabajar mejor juntos, no un criterio de selección.",
    bringsLead: "Lo que trae a la mesa:",
    addsTo: "aporta en", liftedBy: "lo elevan en", peerWith: "opera parejo con",
    lvsTitle: "Hipótesis LVS · 5 drivers (inferido del SEI, no normado)",
    lvsIntro: "Cómo se vería esta persona en clave Vital Signs. Es hipótesis a confirmar, no medición normada.",
    ctxTitle: "Afinidad por contexto (0-135)",
    closing: "Esto es un lente de relación y desarrollo, no un veredicto. La IE no decide a quién contratar: léase junto a la entrevista y el criterio técnico. Cada brecha se cierra con un puente.",
    band: { low: "baja", mid: "media", high: "alta" },
    drivers: { TRUST: "Confianza", MOTIVATION: "Motivación", CHANGE: "Cambio", TEAMWORK: "Equipo", EXECUTION: "Ejecución" },
    ctx: { leadership: "Liderazgo", execution: "Ejecución", innovation: "Innovación", decision: "Decisión", conversation: "Conversación", relationship: "Relación" },
    comps: { EL: "Alfabetización emocional", RP: "Reconocer patrones", ACT: "Pensamiento consecuente", NE: "Navegar emociones", IM: "Motivación intrínseca", OP: "Optimismo", EMP: "Empatía", NG: "Metas nobles" },
    leaderWord: "el líder",
  },
  en: {
    eyebrow: "Individual profile · Hiring", title: "Candidate profile",
    footer: "Rowi · Candidate profile", footerTail: "a relationship lens, not a verdict",
    role: "In the process", anchorLeader: (l: string) => `Process leader: ${l}`,
    affLabel: "Mean affinity (0-135)", eqLabel: "World EQ percentile", lvsLabel: "Inferred LVS",
    compsTitle: "8 SEI competencies vs top performer profile (70–130)",
    compsIntro: "The dotted line marks the top performer's mean level in each competency. Green = already at top level; amber = zone to support. Not a grade: where to support and where the person already holds.",
    vsTop: "vs top", atTop: "at top level", toSupport: "zone to support",
    recipTitle: "Reciprocal lens · who helps whom",
    recipIntro: "This person doesn't compete with the rest: they complement each other. Here, where they add to each one and where the team lifts them. Each arrow is a bridge to work better together, not a selection criterion.",
    bringsLead: "What they bring to the table:",
    addsTo: "adds in", liftedBy: "lifted in", peerWith: "runs as a peer with",
    lvsTitle: "LVS hypothesis · 5 drivers (inferred from SEI, not normed)",
    lvsIntro: "How this person would look through a Vital Signs lens. A hypothesis to confirm, not a normed measure.",
    ctxTitle: "Affinity by context (0-135)",
    closing: "This is a relationship-and-development lens, not a verdict. EQ does not decide who gets hired: read alongside the interview and the technical criteria. Every gap is closed with a bridge.",
    band: { low: "low", mid: "medium", high: "high" },
    drivers: { TRUST: "Trust", MOTIVATION: "Motivation", CHANGE: "Change", TEAMWORK: "Teamwork", EXECUTION: "Execution" },
    ctx: { leadership: "Leadership", execution: "Execution", innovation: "Innovation", decision: "Decision", conversation: "Conversation", relationship: "Relationship" },
    comps: { EL: "Emotional literacy", RP: "Recognize patterns", ACT: "Consequential thinking", NE: "Navigate emotions", IM: "Intrinsic motivation", OP: "Optimism", EMP: "Empathy", NG: "Noble goals" },
    leaderWord: "the leader",
  },
  pt: {
    eyebrow: "Perfil individual · Hiring", title: "Perfil de candidato",
    footer: "Rowi · Perfil de candidato", footerTail: "lente de relação, não veredito",
    role: "No processo", anchorLeader: (l: string) => `Líder do processo: ${l}`,
    affLabel: "Afinidade média (0-135)", eqLabel: "Percentil EQ mundial", lvsLabel: "LVS inferido",
    compsTitle: "8 competências SEI vs perfil top performer (70–130)",
    compsIntro: "A linha pontilhada marca o nível médio do top performer em cada competência. Verde = já em nível top; âmbar = zona para acompanhar. Não é uma nota: é onde apoiar e onde a pessoa já sustenta.",
    vsTop: "vs top", atTop: "em nível top", toSupport: "zona para acompanhar",
    recipTitle: "Lente recíproca · quem ajuda quem",
    recipIntro: "Esta pessoa não compete com o resto: se complementam. Aqui, onde agrega a cada um e onde o time a eleva. Cada seta é uma ponte para trabalhar melhor juntos, não um critério de seleção.",
    bringsLead: "O que traz para a mesa:",
    addsTo: "agrega em", liftedBy: "é elevada em", peerWith: "opera em par com",
    lvsTitle: "Hipótese LVS · 5 drivers (inferido do SEI, não normatizado)",
    lvsIntro: "Como esta pessoa se veria em chave Vital Signs. É hipótese a confirmar, não medição normatizada.",
    ctxTitle: "Afinidade por contexto (0-135)",
    closing: "Isto é uma lente de relação e desenvolvimento, não um veredito. A IE não decide quem contratar: leia junto com a entrevista e o critério técnico. Cada lacuna se fecha com uma ponte.",
    band: { low: "baixa", mid: "média", high: "alta" },
    drivers: { TRUST: "Confiança", MOTIVATION: "Motivação", CHANGE: "Mudança", TEAMWORK: "Equipe", EXECUTION: "Execução" },
    ctx: { leadership: "Liderança", execution: "Execução", innovation: "Inovação", decision: "Decisão", conversation: "Conversa", relationship: "Relacionamento" },
    comps: { EL: "Alfabetização emocional", RP: "Reconhecer padrões", ACT: "Pensamento consequente", NE: "Navegar emoções", IM: "Motivação intrínseca", OP: "Otimismo", EMP: "Empatia", NG: "Metas nobres" },
    leaderWord: "o líder",
  },
};

type LStrings = (typeof L)[Lang];

interface PeerView {
  name: string; // contraparte (otro candidato o el líder)
  isLeader: boolean;
  addsContexts: string[]; // contextos donde el destacado aporta por encima
  liftedContexts: string[]; // contextos donde la contraparte eleva al destacado
}

/** Capacidad ponderada del destacado por contexto vs cada contraparte: dónde
 * aporta (>+4) y dónde lo elevan (<-4). Umbral ±4 sobre 0-135 ≈ diferencia real. */
function reciprocity(spot: HiringCandidate, others: { name: string; isLeader: boolean; byContext: Record<string, number> }[]): PeerView[] {
  return others.map((o) => {
    const adds: string[] = [];
    const lifted: string[] = [];
    for (const ctx of CTX_ORDER) {
      const d = (spot.affinityByContext[ctx] ?? 0) - (o.byContext[ctx] ?? 0);
      if (d >= 4) adds.push(ctx);
      else if (d <= -4) lifted.push(ctx);
    }
    return { name: o.name, isLeader: o.isLeader, addsContexts: adds, liftedContexts: lifted };
  });
}

export async function buildPerfilCandidato(
  report: HiringReportData,
  candidateName: string,
  lang: Lang = "es",
  owl?: Buffer,
  opts?: { mode?: PerfilCandidatoMode },
): Promise<Buffer> {
  const t = L[lang];
  const mode: PerfilCandidatoMode = opts?.mode ?? "compacto";
  const spot = report.candidates.find((c) => c.name === candidateName);
  if (!spot) throw new Error(`Candidato no encontrado: ${candidateName}`);
  const compL = (k: string) => (t.comps as Record<string, string>)[k] ?? k;

  const pdf = new RowiPdf({
    lang, footerLeft: `${t.footer} · ${report.process} — ${t.footerTail}`, owl,
  });

  // ── Header + identidad ──
  pdf.header({ eyebrow: t.eyebrow, title: t.title, subtitle: report.process });
  pdf.para(spot.name, { size: 20, bold: true, color: C.ink });
  pdf.para(`${t.role} · EQ ${spot.eq} · ${spot.brain} · ${spot.changeStyle} · ${spot.influence}`, { size: 9, color: C.muted });
  pdf.note(t.anchorLeader(report.leaderName));

  // ── 3 métricas de cabecera ──
  headlineCards(pdf, spot, t);

  // ── 8 competencias vs top performer ──
  pdf.h2(t.compsTitle);
  pdf.para(t.compsIntro, { size: 8.5, color: C.muted });
  const top = report.benchmark.topPerformers;
  pdf.barsBlock(
    COMP_ORDER.map((k) => {
      const cm = spot.competencies.find((x) => x.key === k);
      const score = cm?.score ?? 0;
      const tnorm = top[k];
      const atTop = tnorm !== undefined && score >= tnorm;
      return {
        label: `${compL(k)} (${atTop ? t.atTop : t.toSupport})`,
        value: score, min: 60, max: 135, norm: tnorm, labelW: 230,
        color: atTop ? C.barHigh : C.barMid,
      };
    }),
  );

  // ── Lente recíproca: quién ayuda a quién ──
  reciprocalBlock(pdf, report, spot, t);

  // ── Hipótesis LVS ──
  pdf.section({ eyebrow: t.eyebrow, title: t.lvsTitle, need: 160,
    headerOnNewPage: { title: t.title, subtitle: spot.name } });
  pdf.para(t.lvsIntro, { size: 8.5, color: C.muted });
  lvsDriversBlock(pdf, spot, t);

  // ── Modo completo: afinidad por contexto ──
  if (mode === "completo") {
    pdf.section({ eyebrow: t.eyebrow, title: t.ctxTitle, need: 140,
      headerOnNewPage: { title: t.title, subtitle: spot.name } });
    pdf.barsBlock(
      CTX_ORDER.map((ctx) => ({
        label: (t.ctx as Record<string, string>)[ctx],
        value: spot.affinityByContext[ctx] ?? 0, min: 0, max: 135, norm: 108, labelW: 165,
        color: (spot.affinityByContext[ctx] ?? 0) >= 108 ? C.violet : C.barMid,
      })),
    );
  }

  // ── Cierre (regla de oro) ──
  pdf.callout(t.closing, { bg: C.coralBg, leadColor: C.amberTxt });

  return pdf.finish();
}

// ───────────────────────── bloques de maquetación ─────────────────────────
function headlineCards(pdf: RowiPdf, spot: HiringCandidate, t: LStrings) {
  const d = pdf.doc;
  // El "sub" (escala/banda) va en la MISMA línea del número, más pequeño.
  const cards = [
    { n: `${spot.affinityAvg}`, sub: " /135", label: t.affLabel },
    { n: `p${spot.eqPercentile}`, sub: "", label: t.eqLabel },
    { n: `${spot.lvs.score}`, sub: ` ${t.band[spot.lvs.band]}`, label: t.lvsLabel },
  ];
  const gap = 10;
  const cardW = (CW - 2 * gap) / 3;
  const cardH = 56;
  pdf.gap(4);
  pdf.ensure(cardH + 8);
  const y0 = pdf.y;
  cards.forEach((card, i) => {
    const x = MX + i * (cardW + gap);
    d.roundedRect(x, y0, cardW, cardH, 8).fill(C.violetBg);
    // número + sub medidos juntos y centrados como un bloque
    const numW = pdf.font("bold").fontSize(20).widthOfString(card.n);
    const subW = card.sub ? pdf.font("regular").fontSize(9).widthOfString(card.sub) : 0;
    const startX = x + (cardW - numW - subW) / 2;
    pdf.font("bold").fontSize(20).fillColor(C.violetDark).text(card.n, startX, y0 + 10, { lineBreak: false });
    if (card.sub) {
      pdf.font("regular").fontSize(9).fillColor(C.muted).text(card.sub, startX + numW, y0 + 20, { lineBreak: false });
    }
    pdf.font("semibold").fontSize(8).fillColor(C.muted)
      .text(card.label, x + 4, y0 + 38, { width: cardW - 8, align: "center", lineBreak: false });
  });
  pdf.y = y0 + cardH + 10;
}

function reciprocalBlock(pdf: RowiPdf, report: HiringReportData, spot: HiringCandidate, t: LStrings) {
  pdf.h2(t.recipTitle);
  pdf.para(t.recipIntro, { size: 8.5, color: C.muted });

  // "Lo que aporta" desde sus PROPIAS fortalezas (no ranking relativo): así
  // nadie es solo "elevado por el equipo" — todos traen algo a la mesa.
  const compL = (k: string) => (t.comps as Record<string, string>)[k] ?? k;
  const topComps = [...spot.competencies].sort((a, b) => b.score - a.score).slice(0, 3).map((c) => compL(c.key));
  pdf.callout(topComps.join(" · "), { lead: t.bringsLead, bg: C.tealBg, leadColor: C.greenDark });

  const others = [
    { name: report.leaderName, isLeader: true, byContext: leaderByContext(report, spot) },
    ...report.candidates.filter((c) => c.name !== spot.name).map((c) => ({ name: c.name, isLeader: false, byContext: c.affinityByContext })),
  ];
  const views = reciprocity(spot, others);
  const ctxL = (k: string) => (t.ctx as Record<string, string>)[k] ?? k;

  for (const v of views) {
    const adds = v.addsContexts.map(ctxL);
    const lifted = v.liftedContexts.map(ctxL);
    const lines: string[] = [];
    if (adds.length) lines.push(`${t.addsTo}: ${adds.join(", ")}`);
    if (lifted.length) lines.push(`${t.liftedBy}: ${lifted.join(", ")}`);
    if (!adds.length && !lifted.length) lines.push(t.peerWith + " " + (v.isLeader ? t.leaderWord : v.name.split(" ")[0]));
    const who = v.isLeader ? `${v.name} (${t.leaderWord})` : v.name;
    pdf.callout(lines.join("  ·  "), { lead: who, leadColor: C.violetDark });
  }
}

/** Capacidad del líder por contexto: el delta relacional del destacado vs el
 * líder ya está en `relationalDelta` (spot - líder). Líder = spot - delta. */
function leaderByContext(report: HiringReportData, spot: HiringCandidate): Record<string, number> {
  const out: Record<string, number> = {};
  for (const ctx of CTX_ORDER) {
    out[ctx] = (spot.affinityByContext[ctx] ?? 0) - (spot.relationalDelta[ctx] ?? 0);
  }
  return out;
}

function lvsDriversBlock(pdf: RowiPdf, spot: HiringCandidate, t: LStrings) {
  const DRIVER_ORDER = ["TRUST", "MOTIVATION", "CHANGE", "TEAMWORK", "EXECUTION"];
  pdf.barsBlock(
    DRIVER_ORDER.map((code) => {
      const d = spot.lvsDrivers.find((x) => x.code === code);
      return {
        label: (t.drivers as Record<string, string>)[code] ?? code,
        value: d?.score ?? 0, min: 60, max: 135, norm: 100, labelW: 165,
        color: (d?.score ?? 0) >= 100 ? C.violet : C.barMid,
      };
    }),
  );
  pdf.note(`LVS: ${spot.lvs.score} (${t.band[spot.lvs.band]})`);
}
