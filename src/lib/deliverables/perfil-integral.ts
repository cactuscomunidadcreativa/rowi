/**
 * 📄 Entregable: PERFIL INTEGRAL (módulo Consulting) — modelo Carolina Navarro.
 *
 * Clona el PDF validado (Carolina_Navarro_perfil_integral_ROWI): SEI completo
 * (8 competencias + 18 talentos + outcomes + sub-outcomes + estilos de cerebro)
 * + Vital Signs (pulse points + 5 drivers) + cruce SEI↔VS (mapa de puntos
 * ciegos) + diagnóstico-espejo. Server-side, parametrizado por idioma.
 *
 * Usa el kit gráfico Rowi (deliverables/pdf-kit) y el motor de puntos ciegos
 * que ya existe (consultant/blindspot-map). El diagnóstico narrativo lo provee
 * el caller (lo genera profile-generator con IA) o se omite.
 */
import { RowiPdf, C, STATE_LABEL, STATE_LABEL_EN, STATE_LABEL_PT, MX, PAGE_W, type Lang } from "./pdf-kit";
import type { BlindspotRow } from "@/lib/consultant/blindspot-map";

export interface PerfilIntegralData {
  subjectLabel: string;
  meta: string; // "Consultant · CO · 60 años · SEI 2026-04-06 · LVS Self 2026"
  eqTotal?: number;
  kcg?: { K: number; C: number; G: number };
  competencies: Record<string, number>; // EL..NG, escala 70-130
  talents?: Record<string, number>; // 18 brain talents, 70-130
  brainAgility?: number;
  outcomes?: Record<string, number>; // Effectiveness..Overall4
  subOutcomes?: Record<string, number>; // Influence..Health
  brainStyles?: Record<string, number>; // RATIONAL..IDEALISTIC
  pulses?: Record<string, number>; // pulse point code -> valor (LVS 1-5 o 70-130)
  pulseScale?: "lvs" | "vs"; // 1-5 vs 70-130
  drivers?: { code: string; rowi: number; official?: number }[]; // 5 drivers LVS
  blindspotMap: BlindspotRow[];
  diagnosis?: string | null;
  vsValidationNote?: string; // "error medio 0.17"
}

// ── i18n local (solo strings de este entregable) ──
const L = {
  es: {
    eyebrow: "Perfil integral · Material reservado",
    title: "Perfil integral",
    footer: "Material reservado · uso interno Rowi",
    badge: "CONFIDENCIAL",
    eqTotal: "EQ Total", know: "Conócete", choose: "Elígete", give: "Entrégate",
    comps: "8 Competencias SEI · capacidad emocional (70–130)",
    talents: "18 Brain Talents · el “cómo” natural (70–130)",
    brainAgility: "Brain Agility",
    outcomes: "4 Outcomes de vida (70–130)",
    subOutcomes: "8 Sub-outcomes (70–130)",
    styles: "Estilos de cerebro (70–130)",
    pulses: "15 Pulse Points LVS · autopercepción de liderazgo (1–5)",
    driversTitle: "5 Drivers LVS — reconstruido vs oficial",
    dDriver: "Driver", dRowi: "Rowi (mapa)", dOfficial: "Oficial", dDelta: "∆",
    crossTitle: "Cruce SEI–LVS · el mapa de puntos ciegos",
    crossIntro: "Lectura relativa interna (z-score): dónde se cree fuerte vs dónde su capacidad real (competencia + talento) la sostiene. La escala absoluta no aplica — el LVS es autoevaluación generosa; importa el patrón dentro de la persona.",
    cType: "Tipo", cPulse: "Pulse point", cReading: "Lectura",
    dx: "Diagnóstico (espejo)",
    closing: "Material reservado · uso interno Rowi. El mapa pulse-point (desde competencia + talento) es hipótesis v0 del motor BE2GROW; el mapa pregunta–pulse-point del LVS está validado",
    state: STATE_LABEL,
  },
  en: {
    eyebrow: "Integral profile · Reserved material",
    title: "Integral profile",
    footer: "Reserved material · Rowi internal use",
    badge: "CONFIDENTIAL",
    eqTotal: "EQ Total", know: "Know Yourself", choose: "Choose Yourself", give: "Give Yourself",
    comps: "8 SEI Competencies · emotional capability (70–130)",
    talents: "18 Brain Talents · the natural “how” (70–130)",
    brainAgility: "Brain Agility",
    outcomes: "4 Life Outcomes (70–130)",
    subOutcomes: "8 Sub-outcomes (70–130)",
    styles: "Brain styles (70–130)",
    pulses: "15 LVS Pulse Points · leadership self-perception (1–5)",
    driversTitle: "5 LVS Drivers — reconstructed vs official",
    dDriver: "Driver", dRowi: "Rowi (map)", dOfficial: "Official", dDelta: "∆",
    crossTitle: "SEI–LVS cross-read · the blind spot map",
    crossIntro: "Internal relative reading (z-score): where she believes she is strong vs where her real capability (competency + talent) backs her. The absolute scale does not apply — the LVS is generous self-assessment; what matters is the pattern within the person.",
    cType: "Type", cPulse: "Pulse point", cReading: "Reading",
    dx: "Diagnosis (mirror)",
    closing: "Reserved material · Rowi internal use. The pulse-point map (from competency + talent) is a v0 hypothesis of the BE2GROW engine; the LVS question–pulse-point map is validated",
    state: STATE_LABEL_EN,
  },
  pt: {
    eyebrow: "Perfil integral · Material reservado",
    title: "Perfil integral",
    footer: "Material reservado · uso interno Rowi",
    badge: "CONFIDENCIAL",
    eqTotal: "EQ Total", know: "Conheça-se", choose: "Escolha-se", give: "Entregue-se",
    comps: "8 Competências SEI · capacidade emocional (70–130)",
    talents: "18 Brain Talents · o “como” natural (70–130)",
    brainAgility: "Brain Agility",
    outcomes: "4 Outcomes de vida (70–130)",
    subOutcomes: "8 Sub-outcomes (70–130)",
    styles: "Estilos de cérebro (70–130)",
    pulses: "15 Pulse Points LVS · autopercepção de liderança (1–5)",
    driversTitle: "5 Drivers LVS — reconstruído vs oficial",
    dDriver: "Driver", dRowi: "Rowi (mapa)", dOfficial: "Oficial", dDelta: "∆",
    crossTitle: "Cruzamento SEI–LVS · o mapa de pontos cegos",
    crossIntro: "Leitura relativa interna (z-score): onde ela se acredita forte vs onde sua capacidade real (competência + talento) a sustenta. A escala absoluta não se aplica — o LVS é autoavaliação generosa; o que importa é o padrão dentro da pessoa.",
    cType: "Tipo", cPulse: "Pulse point", cReading: "Leitura",
    dx: "Diagnóstico (espelho)",
    closing: "Material reservado · uso interno Rowi. O mapa pulse-point (a partir de competência + talento) é hipótese v0 do motor BE2GROW; o mapa pergunta–pulse-point do LVS está validado",
    state: STATE_LABEL_PT,
  },
} as const;

// Etiquetas de competencias SEI por idioma (clave -> nombre).
const COMP_LABEL: Record<Lang, Record<string, string>> = {
  es: { EL: "EL (Alfabetización Emocional)", RP: "RP (Reconocer Patrones)", ACT: "ACT (Pensamiento Consecuente)", NE: "NE (Navegar Emociones)", IM: "IM (Motivación Intrínseca)", OP: "OP (Optimismo)", EMP: "EMP (Empatía)", NG: "NG (Metas Nobles)" },
  en: { EL: "EL (Emotional Literacy)", RP: "RP (Recognize Patterns)", ACT: "ACT (Consequential Thinking)", NE: "NE (Navigate Emotions)", IM: "IM (Intrinsic Motivation)", OP: "OP (Optimism)", EMP: "EMP (Empathy)", NG: "NG (Noble Goals)" },
  pt: { EL: "EL (Alfabetização Emocional)", RP: "RP (Reconhecer Padrões)", ACT: "ACT (Pensamento Consequente)", NE: "NE (Navegar Emoções)", IM: "IM (Motivação Intrínseca)", OP: "OP (Otimismo)", EMP: "EMP (Empatia)", NG: "NG (Metas Nobres)" },
};
const DRIVER_LABEL: Record<Lang, Record<string, string>> = {
  es: { TRUST: "Confianza", MOTIVATION: "Motivación", CHANGE: "Cambio", TEAMWORK: "Trabajo en Equipo", EXECUTION: "Ejecución" },
  en: { TRUST: "Trust", MOTIVATION: "Motivation", CHANGE: "Change", TEAMWORK: "Teamwork", EXECUTION: "Execution" },
  pt: { TRUST: "Confiança", MOTIVATION: "Motivação", CHANGE: "Mudança", TEAMWORK: "Trabalho em Equipe", EXECUTION: "Execução" },
};
const PULSE_LABEL: Record<Lang, Record<string, string>> = {
  es: { TRUST_TRANSPARENCY: "Transparencia", TRUST_COHERENCE: "Coherencia", TRUST_CARE: "Cuidado", MOTIVATION_MEANING: "Significado", MOTIVATION_MASTERY: "Maestría", MOTIVATION_AUTONOMY: "Autonomía", CHANGE_IMAGINATION: "Imaginación", CHANGE_EXPLORATION: "Exploración", CHANGE_CELEBRATION: "Celebración", TEAMWORK_DIVERGENCE: "Divergencia", TEAMWORK_CONNECTION: "Conexión", TEAMWORK_JOY: "Alegría", EXECUTION_ACCOUNTABILITY: "Responsabilidad", EXECUTION_FEEDBACK: "Feedback", EXECUTION_FOCUS: "Enfoque" },
  en: { TRUST_TRANSPARENCY: "Transparency", TRUST_COHERENCE: "Coherence", TRUST_CARE: "Care", MOTIVATION_MEANING: "Meaning", MOTIVATION_MASTERY: "Mastery", MOTIVATION_AUTONOMY: "Autonomy", CHANGE_IMAGINATION: "Imagination", CHANGE_EXPLORATION: "Exploration", CHANGE_CELEBRATION: "Celebration", TEAMWORK_DIVERGENCE: "Divergence", TEAMWORK_CONNECTION: "Connection", TEAMWORK_JOY: "Joy", EXECUTION_ACCOUNTABILITY: "Accountability", EXECUTION_FEEDBACK: "Feedback", EXECUTION_FOCUS: "Focus" },
  pt: { TRUST_TRANSPARENCY: "Transparência", TRUST_COHERENCE: "Coerência", TRUST_CARE: "Cuidado", MOTIVATION_MEANING: "Significado", MOTIVATION_MASTERY: "Maestria", MOTIVATION_AUTONOMY: "Autonomia", CHANGE_IMAGINATION: "Imaginação", CHANGE_EXPLORATION: "Exploração", CHANGE_CELEBRATION: "Celebração", TEAMWORK_DIVERGENCE: "Divergência", TEAMWORK_CONNECTION: "Conexão", TEAMWORK_JOY: "Alegria", EXECUTION_ACCOUNTABILITY: "Responsabilidade", EXECUTION_FEEDBACK: "Feedback", EXECUTION_FOCUS: "Foco" },
};
const COMP_ORDER = ["EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"];

export async function buildPerfilIntegral(data: PerfilIntegralData, lang: Lang = "es", owl?: Buffer): Promise<Buffer> {
  const t = L[lang];
  const pdf = new RowiPdf({ lang, footerLeft: t.footer, badge: t.badge, badgeColor: C.amberTxt, owl });

  pdf.header({ eyebrow: t.eyebrow, eyebrowColor: C.amberTxt, title: t.title, subtitle: data.subjectLabel });

  // Nombre + meta
  pdf.doc.font("Helvetica-Bold").fontSize(20).fillColor(C.ink).text(data.subjectLabel, MX, pdf.y);
  pdf.y = pdf.doc.y + 3;
  pdf.doc.font("Helvetica").fontSize(9).fillColor(C.muted).text(data.meta, MX, pdf.y);
  pdf.y = pdf.doc.y + 10;

  // Caja EQ Total + KCG
  if (data.eqTotal !== undefined && data.kcg) {
    pdf.callout(
      `${t.eqTotal}: ${data.eqTotal} · ${t.know} ${data.kcg.K} · ${t.choose} ${data.kcg.C} · ${t.give} ${data.kcg.G}`,
    );
  }

  // 8 competencias
  pdf.h2(t.comps);
  pdf.barsBlock(
    COMP_ORDER.filter((k) => typeof data.competencies[k] === "number").map((k) => ({
      label: COMP_LABEL[lang][k] ?? k, value: data.competencies[k], min: 70, max: 130, norm: 100,
    })),
  );

  // 18 talentos
  if (data.talents && Object.keys(data.talents).length) {
    pdf.h2(t.talents);
    pdf.barsBlock(
      Object.entries(data.talents)
        .sort((a, b) => b[1] - a[1])
        .map(([k, v]) => ({ label: k, value: v, min: 70, max: 130, norm: 100, color: C.blue })),
    );
    if (data.brainAgility !== undefined) pdf.para(`${t.brainAgility}: ${data.brainAgility}`, { bold: true });
  }

  // Outcomes de vida
  if (data.outcomes && Object.keys(data.outcomes).length) {
    pdf.h2(t.outcomes);
    pdf.barsBlock(Object.entries(data.outcomes).map(([k, v]) => ({ label: k, value: v, min: 70, max: 130, norm: 100, color: C.pink })));
  }

  // Sub-outcomes
  if (data.subOutcomes && Object.keys(data.subOutcomes).length) {
    pdf.h2(t.subOutcomes);
    pdf.barsBlock(Object.entries(data.subOutcomes).map(([k, v]) => ({ label: k, value: v, min: 70, max: 130, norm: 100 })));
  }

  // Estilos de cerebro
  if (data.brainStyles && Object.keys(data.brainStyles).length) {
    pdf.h2(t.styles);
    pdf.barsBlock(Object.entries(data.brainStyles).map(([k, v]) => ({ label: k, value: v, min: 70, max: 130, norm: 100, color: C.blue })));
  }

  // Pulse points LVS
  if (data.pulses && Object.keys(data.pulses).length) {
    pdf.h2(t.pulses);
    if (data.vsValidationNote) pdf.note(data.vsValidationNote);
    const isLvs = data.pulseScale !== "vs";
    pdf.barsBlock(
      Object.entries(data.pulses).map(([code, v]) => ({
        label: PULSE_LABEL[lang][code] ?? code, value: v,
        min: isLvs ? 1 : 70, max: isLvs ? 5 : 130, norm: isLvs ? 3 : 100, color: C.pink,
      })),
    );
  }

  // Tabla 5 drivers
  if (data.drivers && data.drivers.length) {
    pdf.h2(t.driversTitle);
    pdf.table(
      [t.dDriver, t.dRowi, t.dOfficial, t.dDelta],
      data.drivers.map((d) => [
        DRIVER_LABEL[lang][d.code] ?? d.code,
        d.rowi.toFixed(2),
        d.official !== undefined ? d.official.toFixed(2) : "—",
        d.official !== undefined ? (d.rowi - d.official >= 0 ? "+" : "") + (d.rowi - d.official).toFixed(2) : "—",
      ]),
      [0.4, 0.2, 0.2, 0.2],
    );
  }

  // Cruce SEI-LVS (mapa de puntos ciegos)
  pdf.h2(t.crossTitle);
  pdf.para(t.crossIntro, { size: 8.5, color: C.muted });
  for (const r of data.blindspotMap) {
    pdf.ensure(20);
    pdf.doc.font("Helvetica").fontSize(9).fillColor(C.ink)
      .text(PULSE_LABEL[lang][r.pulse] ?? r.pulse, MX, pdf.y + 2, { width: pdf.doc.x ? 200 : 200, lineBreak: false });
    pdf.stateChip(PAGE_W - MX - 90, pdf.y, r.state, t.state[r.state] ?? r.state);
    pdf.y += 20;
  }
  pdf.y += 6;

  // Diagnóstico-espejo
  if (data.diagnosis) {
    pdf.h2(t.dx);
    pdf.quote(data.diagnosis);
  }

  pdf.note(t.closing + (data.vsValidationNote ? "." : "."));
  return pdf.finish();
}
