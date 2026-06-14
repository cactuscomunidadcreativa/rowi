/**
 * 📊 Entregable: HALLAZGOS PRELIMINARES (módulo Consulting, PPTX).
 *
 * Clona el modelo validado (Hallazgos_Bancolombia_VS_SEI): el borrador de
 * trabajo que presenta los 5 hallazgos de la lectura cruzada TVS+SEI, con la
 * persona puente como hilo conductor. Documento de discusión interna — la
 * versión pulida y comercial es la Propuesta (entregable 6).
 *
 * 9 slides: portada · el alcance (dos equipos + persona puente) · 5 hallazgos
 * (clima vs motor · la cadena EQ→desempeño · por qué el equipo es débil en
 * cambio · líder espejo del equipo · persona puente medida dos veces) · lo que
 * significa (dos frentes de venta) · próximos pasos.
 *
 * Server-side (pptxgenjs vía pptx-kit, salida nodebuffer). Texto HÍBRIDO: la
 * estructura y la doctrina son estables; los hallazgos y cifras los pasa el
 * caller. Comparte el kit gráfico PPTX con la Propuesta.
 */
import type { Lang } from "./pdf-kit";
import {
  VIOLET, VIOLET_DARK, CORAL, FG, MUTED, BOX_BG, WHITE, FONT, SLIDE_H,
  type Slide, type StatRow,
  newDeck, deckToBuffer, coverSlide, contentSlide, statBox, quoteNote, closingSlide,
  bigStatCard, hbars, vbars,
} from "./pptx-kit";

// ── Entrada ──
export interface ScopeCard { number: string; title: string; desc: string }
export interface BandStat { label: string; value: string; flag?: boolean } // flag = ↓ marca

export interface HallazgosData {
  client: string;
  subtitle?: string; // subtítulo de portada
  /** El alcance: 3 tarjetas (equipo A, equipo B, persona puente) + nota */
  scope: { cards: ScopeCard[]; note?: string };
  /** Hallazgo 1: clima TVS (superficie) vs SEI (debajo) + lectura */
  finding1: { surfaceTitle: string; surface: BandStat[]; deepTitle: string; deep: BandStat[]; reading: string };
  /** Hallazgo 2: cadena EQ→desempeño (correlaciones) + cruce + nota */
  finding2: { correlations: { label: string; value: number }[]; crossTitle: string; crossBody: string; note: string };
  /** Hallazgo 3: por qué débil en cambio (barras h) + mecanismo + nota */
  finding3: { bars: { label: string; value: number }[]; mechanism: { lead: string; body: string }[]; note: string };
  /** Hallazgo 4: líder espejo (arriba/abajo del equipo) + señal */
  finding4: { leaderName: string; aboveTitle: string; above: StatRow[]; belowTitle: string; below: { label: string; sub: string; value: string }[]; careNote: string };
  /** Hallazgo 5: persona puente, dos tomas + lectura honesta + nota */
  finding5: { intro: string; strengthenedTitle: string; strengthened: StatRow[]; cooledTitle: string; cooled: StatRow[]; honestRead: string; note: string };
  /** Lo que significa: dos frentes de venta + puente */
  meaning: { frontA: { title: string; message: string; bullets: string[] }; frontB: { title: string; message: string; bullets: string[] }; bridgeNote: string };
}

type LStrings = (typeof L)[Lang];

// ── i18n (doctrina/estructura del deck) ──
const L = {
  es: {
    kicker: "EQ Latam · Six Seconds Network · Be to Grow",
    coverType: "Hallazgos preliminares",
    coverTitle: (c: string) => `Inteligencia Emocional para el Desempeño en ${c}`,
    coverSub: "Lectura cruzada de Team Vital Signs (TVS) y perfiles SEI individuales · dos equipos, una persona puente",
    coverTail: "Documento de trabajo · borrador para discusión interna",
    footerTail: "Inteligencia Emocional para el Desempeño",
    eyebrowScope: "El alcance", scopeTitle: "Dos frentes abiertos dentro de la organización",
    eyebrowF1: "Hallazgo 1 · Equipo principal", f1Title: "Un equipo que se siente fuerte, con el motor en reserva",
    waterline: "línea de agua",
    eyebrowF2: "Hallazgo 2 · La hipótesis se valida", f2Title: "La cadena EQ -> desempeño aparece en sus propios datos",
    eyebrowF3: "Hallazgo 3 · TVS <-> participantes", f3Title: "Por qué el equipo es débil en Cambio y Agilidad",
    f3Norm: "Norma global = 100", f3MechTitle: "El mecanismo",
    eyebrowF4: "Hallazgo 4 · Líder <-> equipo", f4Title: (n: string) => `${n}: liderazgo de propósito con un punto ciego`,
    eyebrowF5: "Hallazgo 5 · La persona puente", f5Title: "Medida dos veces: por qué medir una sola vez no basta",
    f5Honest: "Lectura honesta:",
    eyebrowMeaning: "Lo que significa", meaningTitle: "Dos ventas distintas, no una",
    eyebrowNext: "Próximos pasos", nextTitle: "Cómo seguimos",
    nextSteps: [
      { title: "Confirmar la persona puente", desc: "Validar identidad con el cliente antes de personalizar el caso." },
      { title: "«Lo que escuchamos» × 2", desc: "Una devolución para el frente A (sostenibilidad) y otra para el frente B (liderazgo)." },
      { title: "Elegir alcance", desc: "Piloto / activación · implementación completa · expansión organizacional." },
      { title: "One-pager visual", desc: "Estos hallazgos en una pieza para la conversación comercial." },
    ],
    f2CrossDefault: "El cruce que cierra la conversación",
  },
  en: {
    kicker: "EQ Latam · Six Seconds Network · Be to Grow",
    coverType: "Preliminary findings",
    coverTitle: (c: string) => `Emotional Intelligence for Performance at ${c}`,
    coverSub: "Cross-read of Team Vital Signs (TVS) and individual SEI profiles · two teams, one bridge person",
    coverTail: "Working document · draft for internal discussion",
    footerTail: "Emotional Intelligence for Performance",
    eyebrowScope: "The scope", scopeTitle: "Two fronts open inside the organization",
    eyebrowF1: "Finding 1 · Main team", f1Title: "A team that feels strong, with the engine in reserve",
    waterline: "waterline",
    eyebrowF2: "Finding 2 · The hypothesis holds", f2Title: "The EQ -> performance chain shows in their own data",
    eyebrowF3: "Finding 3 · TVS <-> participants", f3Title: "Why the team is weak in Change and Agility",
    f3Norm: "Global norm = 100", f3MechTitle: "The mechanism",
    eyebrowF4: "Finding 4 · Leader <-> team", f4Title: (n: string) => `${n}: purpose-driven leadership with a blind spot`,
    eyebrowF5: "Finding 5 · The bridge person", f5Title: "Measured twice: why measuring once isn't enough",
    f5Honest: "Honest read:",
    eyebrowMeaning: "What it means", meaningTitle: "Two different sales, not one",
    eyebrowNext: "Next steps", nextTitle: "How we continue",
    nextSteps: [
      { title: "Confirm the bridge person", desc: "Validate identity with the client before personalizing the case." },
      { title: "“What we heard” × 2", desc: "One readout for front A (sustainability) and one for front B (leadership)." },
      { title: "Choose scope", desc: "Pilot / activation · full implementation · organizational expansion." },
      { title: "Visual one-pager", desc: "These findings in one piece for the commercial conversation." },
    ],
    f2CrossDefault: "The cross-read that closes the conversation",
  },
  pt: {
    kicker: "EQ Latam · Six Seconds Network · Be to Grow",
    coverType: "Achados preliminares",
    coverTitle: (c: string) => `Inteligência Emocional para o Desempenho em ${c}`,
    coverSub: "Leitura cruzada de Team Vital Signs (TVS) e perfis SEI individuais · duas equipes, uma pessoa ponte",
    coverTail: "Documento de trabalho · rascunho para discussão interna",
    footerTail: "Inteligência Emocional para o Desempenho",
    eyebrowScope: "O alcance", scopeTitle: "Duas frentes abertas dentro da organização",
    eyebrowF1: "Achado 1 · Equipe principal", f1Title: "Uma equipe que se sente forte, com o motor em reserva",
    waterline: "linha d'água",
    eyebrowF2: "Achado 2 · A hipótese se valida", f2Title: "A cadeia EQ -> desempenho aparece nos próprios dados",
    eyebrowF3: "Achado 3 · TVS <-> participantes", f3Title: "Por que a equipe é fraca em Mudança e Agilidade",
    f3Norm: "Norma global = 100", f3MechTitle: "O mecanismo",
    eyebrowF4: "Achado 4 · Líder <-> equipe", f4Title: (n: string) => `${n}: liderança de propósito com um ponto cego`,
    eyebrowF5: "Achado 5 · A pessoa ponte", f5Title: "Medida duas vezes: por que medir uma só vez não basta",
    f5Honest: "Leitura honesta:",
    eyebrowMeaning: "O que significa", meaningTitle: "Duas vendas distintas, não uma",
    eyebrowNext: "Próximos passos", nextTitle: "Como seguimos",
    nextSteps: [
      { title: "Confirmar a pessoa ponte", desc: "Validar identidade com o cliente antes de personalizar o caso." },
      { title: "“O que ouvimos” × 2", desc: "Uma devolutiva para a frente A (sustentabilidade) e outra para a frente B (liderança)." },
      { title: "Escolher escopo", desc: "Piloto / ativação · implementação completa · expansão organizacional." },
      { title: "One-pager visual", desc: "Estes achados em uma peça para a conversa comercial." },
    ],
    f2CrossDefault: "O cruzamento que fecha a conversa",
  },
};

/** Las dos bandas del Hallazgo 1 (superficie clara / fondo oscuro) con la
 * línea de agua punteada entre ambas. */
function waterlineBands(slide: Slide, t: LStrings, f: HallazgosData["finding1"]) {
  // Banda superior (clima TVS) — clara
  slide.addShape("rect", { x: 0.5, y: 1.5, w: 9, h: 1.35, fill: { color: BOX_BG } });
  slide.addText(f.surfaceTitle.toUpperCase(), { x: 0.7, y: 1.6, w: 8.6, h: 0.25, fontFace: FONT, fontSize: 9, bold: true, color: VIOLET, charSpacing: 1 });
  bandStats(slide, f.surface, 1.95, VIOLET, false);
  // línea de agua
  slide.addText(t.waterline, { x: 7.6, y: 2.86, w: 1.9, h: 0.2, fontFace: FONT, fontSize: 8, italic: true, color: CORAL, align: "right" });
  // Banda inferior (SEI individual) — oscura
  slide.addShape("rect", { x: 0.5, y: 3.05, w: 9, h: 1.35, fill: { color: VIOLET_DARK } });
  slide.addText(f.deepTitle.toUpperCase(), { x: 0.7, y: 3.15, w: 8.6, h: 0.25, fontFace: FONT, fontSize: 9, bold: true, color: "C4B5FD", charSpacing: 1 });
  bandStats(slide, f.deep, 3.5, WHITE, true);
}

/** Fila de estadísticas grandes (número + etiqueta) dentro de una banda. */
function bandStats(slide: Slide, rows: BandStat[], y: number, color: string, dark: boolean) {
  const n = rows.length;
  const colW = 9 / n;
  rows.forEach((r, i) => {
    const x = 0.5 + i * colW;
    slide.addText(r.value, { x: x + 0.1, y, w: colW - 0.2, h: 0.45, fontFace: FONT, fontSize: 22, bold: true, color });
    slide.addText(r.label + (r.flag ? "  ↓" : ""), { x: x + 0.1, y: y + 0.45, w: colW - 0.2, h: 0.25, fontFace: FONT, fontSize: 9, color: dark ? "DDD6FE" : MUTED });
  });
}

export async function buildHallazgos(data: HallazgosData, lang: Lang = "es", owl?: Buffer): Promise<Buffer> {
  const t = L[lang];
  const pptx = await newDeck();
  const client = data.client;
  const fLeft = `${client} · ${t.footerTail}`;
  const cs = (n: number, eyebrow: string, title: string, sub?: string): Slide =>
    contentSlide(pptx, { eyebrow, title, sub, footerLeft: fLeft, footerLabel: eyebrow, n });

  // ── 1 · PORTADA ──
  coverSlide(pptx, {
    kicker: t.kicker, type: t.coverType, title: t.coverTitle(client),
    subtitle: data.subtitle ?? t.coverSub, tail: t.coverTail, owl,
  });

  // ── 2 · EL ALCANCE ──
  {
    const s = cs(2, t.eyebrowScope, t.scopeTitle);
    const accents = [VIOLET, CORAL, VIOLET_DARK];
    const cardW = 2.93, gap = 0.13;
    data.scope.cards.slice(0, 3).forEach((c, i) => {
      bigStatCard(s, 0.5 + i * (cardW + gap), 1.55, cardW, 2.75, { number: c.number, title: c.title, desc: c.desc, accent: accents[i] });
    });
    if (data.scope.note) quoteNote(s, data.scope.note);
  }

  // ── 3 · HALLAZGO 1 (línea de agua) ──
  {
    const s = cs(3, t.eyebrowF1, t.f1Title);
    waterlineBands(s, t, data.finding1);
    quoteNote(s, data.finding1.reading);
  }

  // ── 4 · HALLAZGO 2 (correlaciones + cruce) ──
  {
    const s = cs(4, t.eyebrowF2, t.f2Title);
    vbars(s, 0.5, 1.7, 5.0, 2.6, data.finding2.correlations, { min: 0, max: 1 });
    // box derecho
    s.addShape("rect", { x: 5.9, y: 1.6, w: 3.6, h: 2.85, fill: { color: BOX_BG } });
    s.addText(data.finding2.crossTitle || t.f2CrossDefault, { x: 6.15, y: 1.8, w: 3.1, h: 0.3, fontFace: FONT, fontSize: 12, bold: true, color: VIOLET_DARK });
    s.addText(data.finding2.crossBody, { x: 6.15, y: 2.25, w: 3.1, h: 2.0, fontFace: FONT, fontSize: 10.5, color: FG, valign: "top" });
    quoteNote(s, data.finding2.note);
  }

  // ── 5 · HALLAZGO 3 (barras h + mecanismo) ──
  {
    const s = cs(5, t.eyebrowF3, t.f3Title);
    hbars(s, 0.5, 1.7, 5.2, data.finding3.bars, { min: 80, max: 115, color: CORAL, rowH: 0.36, labelW: 1.6 });
    s.addText(t.f3Norm, { x: 0.5, y: 4.35, w: 3, h: 0.25, fontFace: FONT, fontSize: 8, italic: true, color: MUTED });
    // box mecanismo
    s.addShape("rect", { x: 5.9, y: 1.6, w: 3.6, h: 3.0, fill: { color: BOX_BG } });
    s.addText(t.f3MechTitle, { x: 6.15, y: 1.8, w: 3.1, h: 0.3, fontFace: FONT, fontSize: 12, bold: true, color: VIOLET_DARK });
    const rich = data.finding3.mechanism.flatMap((m) => [
      { text: m.lead + "\n", options: { fontSize: 10.5, bold: true, color: VIOLET, breakLine: true, paraSpaceBefore: 6 } },
      { text: m.body + "\n", options: { fontSize: 10, color: FG, breakLine: true, paraSpaceAfter: 4 } },
    ]);
    s.addText(rich, { x: 6.15, y: 2.25, w: 3.1, h: 2.25, fontFace: FONT, valign: "top" });
  }

  // ── 6 · HALLAZGO 4 (líder espejo) ──
  {
    const s = cs(6, t.eyebrowF4, t.f4Title(data.finding4.leaderName));
    statBox(s, 0.5, 1.55, 4.3, 2.4, data.finding4.aboveTitle, data.finding4.above, VIOLET);
    // box derecho: etiqueta + sub + valor grande
    s.addShape("rect", { x: 5.2, y: 1.55, w: 4.3, h: 2.4, fill: { color: BOX_BG } });
    s.addText(data.finding4.belowTitle.toUpperCase(), { x: 5.45, y: 1.73, w: 3.8, h: 0.3, fontFace: FONT, fontSize: 10, bold: true, color: CORAL, charSpacing: 1 });
    const half = (2.4 - 0.6) / Math.max(data.finding4.below.length, 1);
    data.finding4.below.forEach((b, i) => {
      const by = 1.55 + 0.6 + i * half;
      s.addText([{ text: b.label + "\n", options: { fontSize: 11, bold: true, color: FG } }, { text: b.sub, options: { fontSize: 9, color: MUTED } }], { x: 5.45, y: by, w: 2.9, h: half, fontFace: FONT, valign: "top" });
      s.addText(b.value, { x: 8.4, y: by, w: 0.95, h: 0.5, fontFace: FONT, fontSize: 18, bold: true, color: CORAL, align: "right" });
    });
    // callout señal
    s.addShape("rect", { x: 0.5, y: 4.15, w: 9, h: 0.75, fill: { color: VIOLET_DARK } });
    s.addText(data.finding4.careNote, { x: 0.75, y: 4.25, w: 8.5, h: 0.55, fontFace: FONT, fontSize: 10, color: WHITE, valign: "middle" });
  }

  // ── 7 · HALLAZGO 5 (persona puente, dos tomas) ──
  {
    const s = cs(7, t.eyebrowF5, t.f5Title, data.finding5.intro);
    statBox(s, 0.5, 2.0, 4.3, 2.0, data.finding5.strengthenedTitle, data.finding5.strengthened, VIOLET);
    statBox(s, 5.2, 2.0, 4.3, 2.0, data.finding5.cooledTitle, data.finding5.cooled, CORAL);
    s.addText([{ text: t.f5Honest + " ", options: { bold: true, italic: true, color: VIOLET_DARK } }, { text: data.finding5.honestRead, options: { italic: true, color: VIOLET_DARK } }], { x: 0.5, y: 4.15, w: 9, h: 0.55, fontFace: FONT, fontSize: 10, valign: "top" });
  }

  // ── 8 · LO QUE SIGNIFICA (dos frentes) ──
  {
    const s = cs(8, t.eyebrowMeaning, t.meaningTitle);
    frontBox(s, 0.5, data.meaning.frontA, VIOLET);
    frontBox(s, 5.2, data.meaning.frontB, CORAL);
    s.addShape("rect", { x: 0.5, y: 4.2, w: 9, h: 0.72, fill: { color: VIOLET_DARK } });
    s.addText(data.meaning.bridgeNote, { x: 0.75, y: 4.28, w: 8.5, h: 0.55, fontFace: FONT, fontSize: 10, color: WHITE, valign: "middle" });
  }

  // ── 9 · PRÓXIMOS PASOS ──
  closingSlide(pptx, { eyebrow: t.eyebrowNext, title: t.nextTitle, steps: t.nextSteps, tail: t.kicker });

  return deckToBuffer(pptx);
}

/** Caja de "frente de venta": título + mensaje en itálica + bullets. */
function frontBox(slide: Slide, x: number, front: { title: string; message: string; bullets: string[] }, accent: string) {
  slide.addShape("rect", { x, y: 1.55, w: 4.3, h: 2.5, fill: { color: BOX_BG } });
  slide.addShape("rect", { x, y: 1.55, w: 0.06, h: 2.5, fill: { color: accent } });
  slide.addText(front.title, { x: x + 0.25, y: 1.72, w: 3.8, h: 0.3, fontFace: FONT, fontSize: 12, bold: true, color: FG });
  slide.addText(front.message, { x: x + 0.25, y: 2.05, w: 3.8, h: 0.3, fontFace: FONT, fontSize: 10, italic: true, bold: true, color: accent });
  slide.addText(front.bullets.map((b) => ({ text: b, options: { bullet: { code: "2022" }, fontSize: 10, color: FG, paraSpaceAfter: 4 } })), { x: x + 0.25, y: 2.45, w: 3.85, h: 1.5, fontFace: FONT, valign: "top" });
}
