/**
 * 🔌 Mapper: datos del módulo consultor → inputs de los generadores de entregables.
 *
 * El módulo consultor produce dos objetos server-side:
 *  - `report`   (de /api/consultant/report): perfil integral + SEI + VS +
 *               blindspotMap + diagnosis + insights{client,partner}.
 *  - `findings` (de runMultiLeaderAnalysis): teams + correlaciones + deriva
 *               temporal + espejo de cada líder.
 *
 * Este módulo los convierte en los inputs tipados que esperan los buildX():
 * PerfilIntegralData, GuiaConfidencialData, HallazgosData, PropuestaData. Es la
 * costura entre los motores reales y los entregables — sin recalcular nada.
 */
import type { Lang } from "./pdf-kit";
import type { PerfilIntegralData } from "./perfil-integral";
import type { GuiaConfidencialData } from "./guia-confidencial";
import type { HallazgosData } from "./hallazgos";
import type { PropuestaData } from "./propuesta-cliente";
import type { BlindspotRow } from "@/lib/consultant/blindspot-map";
import type { Insight } from "@/lib/consultant/diagnosis-engine";
import type { MultiLeaderAnalysisResult, MetricDelta } from "@/lib/consultant/cross-analysis";

// ── Forma del `report` de /api/consultant/report (el subconjunto que usamos) ──
export interface ConsultantReportShape {
  subjectLabel: string;
  scope: "individual" | "cohort";
  vsInstrument: "LVS" | "TVS" | "OVS";
  blindspotMap: BlindspotRow[];
  diagnosis: string | null;
  sei: { competencies: Record<string, number>; talents: Record<string, number>; sampleSize: number };
  pulses: Record<string, number>;
  vsSource: "real" | "inferred";
  vsSampleSize: number;
  insights: { client: Insight[]; partner: Insight[] };
}

// Etiquetas SEI por idioma (para los hallazgos/propuesta que traen keys crudas).
const SEI_LABEL: Record<Lang, Record<string, string>> = {
  es: { EL: "Alfabetización emocional", RP: "Reconocer patrones", ACT: "Pensamiento consecuente", NE: "Navegar emociones", IM: "Motivación intrínseca", OP: "Optimismo", EMP: "Empatía", NG: "Metas nobles", eqTotal: "EQ total" },
  en: { EL: "Emotional literacy", RP: "Recognize patterns", ACT: "Consequential thinking", NE: "Navigate emotions", IM: "Intrinsic motivation", OP: "Optimism", EMP: "Empathy", NG: "Noble goals", eqTotal: "Total EQ" },
  pt: { EL: "Alfabetização emocional", RP: "Reconhecer padrões", ACT: "Pensamento consequente", NE: "Navegar emoções", IM: "Motivação intrínseca", OP: "Otimismo", EMP: "Empatia", NG: "Metas nobres", eqTotal: "EQ total" },
};
const OUTCOME_LABEL: Record<Lang, Record<string, string>> = {
  es: { decisions: "Toma de decisiones", quality_of_life: "Calidad de vida", effectiveness: "Efectividad", relationships: "Relaciones", wellbeing: "Bienestar", satisfaction: "Satisfacción", influence: "Influencia", achievement: "Logro", balance: "Equilibrio", health: "Salud" },
  en: { decisions: "Decision making", quality_of_life: "Quality of life", effectiveness: "Effectiveness", relationships: "Relationships", wellbeing: "Wellbeing", satisfaction: "Satisfaction", influence: "Influence", achievement: "Achievement", balance: "Balance", health: "Health" },
  pt: { decisions: "Tomada de decisão", quality_of_life: "Qualidade de vida", effectiveness: "Efetividade", relationships: "Relações", wellbeing: "Bem-estar", satisfaction: "Satisfação", influence: "Influência", achievement: "Realização", balance: "Equilíbrio", health: "Saúde" },
};
const seiL = (lang: Lang, k: string) => SEI_LABEL[lang][k] ?? k;
const outL = (lang: Lang, k: string) => OUTCOME_LABEL[lang][k] ?? k.replace(/_/g, " ");

const META_WORD: Record<Lang, { agg: string; ind: string; sei: string; vsReal: string; vsInf: string }> = {
  es: { agg: "cohorte agregada", ind: "individual", sei: "SEI n=", vsReal: "VS real", vsInf: "VS inferido" },
  en: { agg: "aggregate cohort", ind: "individual", sei: "SEI n=", vsReal: "VS real", vsInf: "VS inferred" },
  pt: { agg: "cohorte agregada", ind: "individual", sei: "SEI n=", vsReal: "VS real", vsInf: "VS inferido" },
};

function metaLine(report: ConsultantReportShape, lang: Lang): string {
  const w = META_WORD[lang];
  return [
    report.vsInstrument,
    report.scope === "cohort" ? w.agg : w.ind,
    `${w.sei}${report.sei.sampleSize}`,
    `${report.vsSource === "real" ? w.vsReal : w.vsInf}${report.vsSampleSize ? ` (n=${report.vsSampleSize})` : ""}`,
  ].join(" · ");
}

// ─────────────────────────── Perfil Integral ───────────────────────────
export function toPerfilIntegral(report: ConsultantReportShape, lang: Lang): PerfilIntegralData {
  const isLvs = report.vsInstrument === "LVS";
  return {
    subjectLabel: report.subjectLabel,
    meta: metaLine(report, lang),
    competencies: report.sei.competencies,
    talents: Object.keys(report.sei.talents).length ? report.sei.talents : undefined,
    pulses: Object.keys(report.pulses).length ? report.pulses : undefined,
    pulseScale: isLvs ? "lvs" : "vs",
    blindspotMap: report.blindspotMap,
    diagnosis: report.diagnosis,
  };
}

// ─────────────────────────── Guía Confidencial ───────────────────────────
export function toGuiaConfidencial(report: ConsultantReportShape, lang: Lang, opts?: {
  scopeLabel?: string; teamMap?: GuiaConfidencialData["teamMap"];
}): GuiaConfidencialData {
  const scopeLabel = opts?.scopeLabel ?? (report.vsInstrument === "LVS" ? "Leadership Vital Signs + SEI" : `${report.vsInstrument} + SEI`);
  // teamMap por defecto: una fila con el sujeto del informe (el consultor la edita).
  const measuredWord: Record<Lang, string> = {
    es: `${report.vsInstrument} + SEI · n=${report.sei.sampleSize}`,
    en: `${report.vsInstrument} + SEI · n=${report.sei.sampleSize}`,
    pt: `${report.vsInstrument} + SEI · n=${report.sei.sampleSize}`,
  };
  const roleWord: Record<Lang, string> = { es: "Sujeto del informe", en: "Report subject", pt: "Sujeito do relatório" };
  return {
    subjectLabel: report.subjectLabel,
    scopeLabel,
    teamMap: opts?.teamMap ?? [{ team: report.subjectLabel, measured: measuredWord[lang], bridgeRole: roleWord[lang] }],
    partnerInsights: report.insights.partner,
  };
}

// ─────────────────────────── Hallazgos (PPTX) ───────────────────────────
function topDeltas(rows: MetricDelta[], lang: Lang, n = 5): { label: string; value: string }[] {
  return rows.slice(0, n).map((d) => ({ label: seiL(lang, d.key), value: `${d.vsNorm >= 0 ? "+" : ""}${d.vsNorm.toFixed(1)}` }));
}

export function toHallazgos(findings: MultiLeaderAnalysisResult, client: string, lang: Lang): HallazgosData {
  const team0 = findings.teams[0];
  const leader0 = findings.leaders[0];

  // El alcance: una tarjeta por equipo (hasta 2) + persona puente si hay líder.
  const cards = findings.teams.slice(0, 2).map((tm) => ({
    number: String(tm.n),
    title: tm.projectCohort,
    desc: `${seiL(lang, "eqTotal")}: ${tm.eqAverage?.toFixed(1) ?? "—"}`,
  }));
  if (leader0) cards.push({ number: "1", title: leader0.label ?? leader0.projectCohort ?? "—", desc: lang === "en" ? "marked leader" : lang === "pt" ? "líder marcado" : "líder marcado" });

  // Hallazgo 1: clima del equipo (fortalezas, "superficie") vs brechas ("debajo").
  const f1 = {
    surfaceTitle: lang === "en" ? "Strengths (above norm)" : lang === "pt" ? "Forças (acima da norma)" : "Fortalezas (sobre la norma)",
    surface: (team0?.strengths ?? []).slice(0, 5).map((d) => ({ label: seiL(lang, d.key), value: d.value.toFixed(1) })),
    deepTitle: lang === "en" ? "Gaps (below norm)" : lang === "pt" ? "Lacunas (abaixo da norma)" : "Brechas (bajo la norma)",
    deep: (team0?.gaps ?? []).slice(0, 5).map((d) => ({ label: seiL(lang, d.key), value: d.value.toFixed(1), flag: d.vsNorm < 0 })),
    reading: lang === "en"
      ? "Read both layers together: a strong surface can rest on capabilities with room to grow."
      : lang === "pt"
      ? "Leia as duas camadas juntas: uma superfície forte pode repousar sobre capacidades com espaço para crescer."
      : "Lee las dos capas juntas: una superficie fuerte puede descansar sobre capacidades con espacio para crecer.",
  };

  // Hallazgo 2: correlaciones EQ→outcome.
  const f2 = {
    correlations: findings.topCorrelations.slice(0, 6).map((c) => ({ label: outL(lang, c.outcomeKey), value: c.r })),
    crossTitle: "",
    crossBody: lang === "en"
      ? "The lowest team competency often correlates most with outcomes — investing there is leverage, not 'soft'."
      : lang === "pt"
      ? "A competência mais baixa da equipe costuma correlacionar mais com os outcomes — investir aí é alavancagem, não 'soft'."
      : "La competencia más baja del equipo suele correlacionar más con los outcomes — invertir ahí es palanca, no «soft».",
    note: `Pearson r · n=${findings.topCorrelations[0]?.n ?? "?"}.`,
  };

  // Hallazgo 3: barras de fortalezas/brechas (reutiliza team0).
  const f3bars = [...(team0?.strengths ?? []), ...(team0?.gaps ?? [])].slice(0, 7).map((d) => ({ label: seiL(lang, d.key), value: d.value }));
  const f3 = {
    bars: f3bars,
    mechanism: [{
      lead: lang === "en" ? "Where the team holds" : lang === "pt" ? "Onde a equipe sustenta" : "Dónde sostiene el equipo",
      body: (team0?.strengths ?? []).slice(0, 2).map((d) => seiL(lang, d.key)).join(", ") || "—",
    }, {
      lead: lang === "en" ? "Where it has room" : lang === "pt" ? "Onde tem espaço" : "Dónde tiene espacio",
      body: (team0?.gaps ?? []).slice(0, 2).map((d) => seiL(lang, d.key)).join(", ") || "—",
    }],
    note: lang === "en" ? "Global norm = 100" : lang === "pt" ? "Norma global = 100" : "Norma global = 100",
  };

  // Hallazgo 4: espejo del primer líder marcado (si hay).
  const mirror = leader0?.mirror;
  const f4 = {
    leaderName: leader0?.label ?? (lang === "en" ? "The leader" : lang === "pt" ? "O líder" : "El líder"),
    aboveTitle: lang === "en" ? "Where the leader is well above the team" : lang === "pt" ? "Onde o líder está muito acima da equipe" : "Donde la líder está muy por encima del equipo",
    above: topDeltas(mirror?.aboveTeam ?? [], lang),
    belowTitle: lang === "en" ? "Where the leader is below the team" : lang === "pt" ? "Onde o líder está abaixo da equipe" : "Donde la líder va por debajo del equipo",
    below: (mirror?.belowTeam ?? []).slice(0, 2).map((d) => ({
      label: seiL(lang, d.key),
      sub: lang === "en" ? "below the team — a point to strengthen." : lang === "pt" ? "abaixo da equipe — um ponto a fortalecer." : "por debajo del equipo — un punto a fortalecer.",
      value: `${d.vsNorm >= 0 ? "+" : ""}${d.vsNorm.toFixed(1)}`,
    })),
    careNote: lang === "en"
      ? "Care signal: handle the leader-team mirror as a coaching mirror, not as blame."
      : lang === "pt"
      ? "Sinal de cuidado: trate o espelho líder-equipe como espelho de coaching, não como culpa."
      : "Señal a atender con cuidado: trata el espejo líder-equipo como espejo de coaching, no como culpa.",
  };

  // Hallazgo 5: deriva temporal (si hay re-medición).
  const drift = findings.temporalDrift;
  const f5 = {
    intro: drift.present
      ? (lang === "en" ? `${drift.peopleWithRetest} people were measured twice. The movement is mixed — and that's the point.`
        : lang === "pt" ? `${drift.peopleWithRetest} pessoas foram medidas duas vezes. O movimento é misto — e esse é o ponto.`
        : `${drift.peopleWithRetest} personas fueron medidas dos veces. El movimiento es mixto — y ese es el punto.`)
      : (lang === "en" ? "No re-measurement yet — measuring twice is what reveals real movement."
        : lang === "pt" ? "Ainda sem re-medição — medir duas vezes é o que revela o movimento real."
        : "Sin re-medición aún — medir dos veces es lo que revela el movimiento real."),
    strengthenedTitle: lang === "en" ? "Strengthened" : lang === "pt" ? "Fortaleceu" : "Se fortaleció",
    strengthened: topDeltas(drift.improved, lang, 4),
    cooledTitle: lang === "en" ? "Cooled" : lang === "pt" ? "Esfriou" : "Se enfrió",
    cooled: topDeltas(drift.declined, lang, 4),
    honestRead: lang === "en"
      ? "A high score doesn't sustain itself. Without re-measurement, this movement would have been invisible."
      : lang === "pt"
      ? "Uma pontuação alta não se sustenta sozinha. Sem re-medição, esse movimento teria sido invisível."
      : "Un puntaje alto no se sostiene solo. Sin re-medición, este movimiento habría sido invisible.",
    note: lang === "en" ? "Anonymized · directional reading." : lang === "pt" ? "Anonimizado · leitura direcional." : "Anonimizado · lectura direccional.",
  };

  // Lo que significa: dos frentes (genérico, el consultor lo edita).
  const meaning = {
    frontA: {
      title: team0?.projectCohort ?? (lang === "en" ? "Front A · Team" : lang === "pt" ? "Frente A · Equipe" : "Frente A · Equipo"),
      message: lang === "en" ? "Message: sustainability and unlocking change" : lang === "pt" ? "Mensagem: sustentabilidade e desbloqueio da mudança" : "Mensaje: sostenibilidad y desbloqueo del cambio",
      bullets: [
        lang === "en" ? "Strong today, fragile to sustain" : lang === "pt" ? "Forte hoje, frágil para sustentar" : "Fuerte hoy, frágil para sostenerlo",
        lang === "en" ? "TVS re-measurement at 3-6 months" : lang === "pt" ? "Re-medição de TVS aos 3-6 meses" : "Re-medición TVS a 3-6 meses",
        lang === "en" ? "Care for the individual engine" : lang === "pt" ? "Cuidado do motor individual" : "Cuidado del motor individual",
      ],
    },
    frontB: {
      title: findings.teams[1]?.projectCohort ?? (lang === "en" ? "Front B · Leadership" : lang === "pt" ? "Frente B · Liderança" : "Frente B · Liderazgo"),
      message: lang === "en" ? "Message: leadership development" : lang === "pt" ? "Mensagem: desenvolvimento de liderança" : "Mensaje: desarrollo de liderazgo",
      bullets: [
        lang === "en" ? "LVS for the leader" : lang === "pt" ? "LVS para o líder" : "LVS para la líder",
        lang === "en" ? "1:1 coaching on decision rigor" : lang === "pt" ? "Coaching 1:1 sobre rigor de decisão" : "Coaching 1:1: rigor de decisión",
        lang === "en" ? "Leader-team alignment" : lang === "pt" ? "Alinhamento líder-equipe" : "Alineación líder-equipo",
      ],
    },
    bridgeNote: lang === "en"
      ? "The bridge person connects both fronts and is the natural candidate for internal champion."
      : lang === "pt"
      ? "A pessoa ponte conecta ambas as frentes e é a candidata natural a champion interno."
      : "La persona puente conecta ambos frentes y es la candidata natural a champion interno.",
  };

  return {
    client,
    scope: { cards: cards.length ? cards : [{ number: String(findings.totalDataPoints), title: client, desc: "" }] },
    finding1: f1, finding2: f2, finding3: f3, finding4: f4, finding5: f5, meaning,
  };
}

// ─────────────────────────── Propuesta (PPTX) ───────────────────────────
export function toPropuesta(report: ConsultantReportShape, findings: MultiLeaderAnalysisResult | null, client: string, lang: Lang): PropuestaData {
  const team0 = findings?.teams[0];
  // Lente 1: clima (pulses agregados, top 4) vs capacidades (competencias SEI clave).
  const pulseEntries = Object.entries(report.pulses).slice(0, 4);
  const climate = pulseEntries.length
    ? pulseEntries.map(([k, v]) => ({ label: k.replace(/_/g, " "), value: v.toFixed(1) }))
    : (team0?.strengths ?? []).slice(0, 4).map((d) => ({ label: seiL(lang, d.key), value: d.value.toFixed(1) }));
  const compKeys = ["EL", "NE", "IM", "OP"];
  const caps = compKeys
    .filter((k) => typeof report.sei.competencies[k] === "number")
    .map((k) => ({ label: seiL(lang, k), value: report.sei.competencies[k].toFixed(1) }));

  const lead = lang === "en"
    ? "The climate measured is solid. Underneath, individual EQ capabilities sit at or barely above the norm."
    : lang === "pt"
    ? "O clima medido é sólido. Por baixo, as capacidades de IE individuais estão na norma ou logo acima."
    : "El clima medido es sólido. Debajo, las capacidades de IE individuales están en o apenas sobre la norma.";
  const question = lang === "en"
    ? "The question is not 'how to fix it' but 'how to sustain it and unlock the next level'. We read two layers together: team climate (VS) and members' EQ (SEI)."
    : lang === "pt"
    ? "A pergunta não é 'como consertar' mas 'como sustentar e desbloquear o próximo nível'. Lemos duas camadas juntas: clima (VS) e IE dos membros (SEI)."
    : "La pregunta no es «cómo arreglarlo» sino «cómo sostenerlo y desbloquear su siguiente nivel». Leemos dos capas juntas: clima (VS) e IE de sus miembros (SEI).";

  return {
    client,
    whatWeHeard: {
      lead,
      question,
      onTable: [
        { title: report.vsInstrument === "LVS" ? "Leadership Vital Signs" : `${report.vsInstrument}`, desc: lang === "en" ? "Climate and effectiveness · 5 drivers, 4 outcomes." : lang === "pt" ? "Clima e efetividade · 5 drivers, 4 outcomes." : "Clima y efectividad · 5 drivers, 4 outcomes." },
        { title: lang === "en" ? "SEI — EQ profiles (aggregate)" : lang === "pt" ? "SEI — perfis de IE (agregado)" : "SEI — perfiles de IE (agregado)", desc: lang === "en" ? "Individual capabilities, read as a team pattern." : lang === "pt" ? "Capacidades individuais, lidas como padrão de equipe." : "Capacidades individuales, leídas como patrón de equipo." },
      ],
    },
    lens1: {
      climateTitle: lang === "en" ? "Team climate (VS)" : lang === "pt" ? "Clima de equipe (VS)" : "Clima de equipo (VS)",
      climate,
      capsTitle: lang === "en" ? "EQ capabilities (SEI)" : lang === "pt" ? "Capacidades de IE (SEI)" : "Capacidades de IE (SEI)",
      caps,
    },
    lens2: {
      strengths: (team0?.strengths ?? []).slice(0, 4).map((d) => `${seiL(lang, d.key)} (${d.vsNorm >= 0 ? "+" : ""}${d.vsNorm.toFixed(1)})`),
      opportunities: (team0?.gaps ?? []).slice(0, 4).map((d) => `${seiL(lang, d.key)} (${d.vsNorm >= 0 ? "+" : ""}${d.vsNorm.toFixed(1)})`),
    },
  };
}
