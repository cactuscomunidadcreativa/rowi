/**
 * 📤 Export PPTX del informe Rowi Consultor (SEI ↔ Vital Signs).
 *
 * Client-side only (pptxgenjs en el browser, import dinámico para no engordar
 * el bundle inicial). Recibe los datos YA computados por /api/consultant/report
 * — no recalcula nada, solo maqueta.
 *
 * DOS entregables separados a propósito (regla de las dos canastas):
 *  - exportClientPptx        → portada, lectura general, barras SEI/VS,
 *                              puntos ciegos, diagnóstico y canasta CLIENTE.
 *  - exportConfidentialPptx  → canasta CONFIDENCIAL + guía del partner.
 *    Va en archivo aparte para que el consultor no la pegue por error
 *    en el material del cliente.
 *
 * El texto de los slides replica el lenguaje EXACTO de la página
 * (src/app/hub/admin/vital-signs/report/page.tsx): mismas etiquetas,
 * misma regla de color de barras, mismas marcas de honestidad.
 */

// ——— Tipos del informe (espejo del payload de /api/consultant/report) ———

export interface BlindspotRowData {
  pulse: string;
  state: string;
}

export interface EngineInsightData {
  kind: string;
  label: string;
  reading: string;
  flags: { smallN: boolean; highDispersion: boolean; isWellbeing: boolean };
}

export interface ConsultantReportData {
  subjectLabel: string;
  scope: string;
  vsInstrument: string;
  blindspotMap: BlindspotRowData[];
  diagnosis: string | null;
  sei: { competencies: Record<string, number>; talents: Record<string, number>; sampleSize: number };
  pulses: Record<string, number>;
  vsSource: "real" | "inferred";
  vsSampleSize: number;
  insights: { client: EngineInsightData[]; partner: EngineInsightData[] };
}

// ——— Etiquetas (idénticas a la página del informe) ———

const SEI_LABEL: Record<string, string> = {
  EL: "Alfabetización Emocional", RP: "Reconocer Patrones", ACT: "Pensamiento Consecuente",
  NE: "Navegar Emociones", IM: "Motivación Intrínseca", OP: "Optimismo",
  EMP: "Empatía", NG: "Metas Nobles",
};
const PULSE_LABEL: Record<string, string> = {
  TRUST_TRANSPARENCY: "Transparencia", TRUST_COHERENCE: "Coherencia", TRUST_CARE: "Cuidado",
  MOTIVATION_MEANING: "Significado", MOTIVATION_MASTERY: "Maestría", MOTIVATION_AUTONOMY: "Autonomía",
  CHANGE_IMAGINATION: "Imaginación", CHANGE_EXPLORATION: "Exploración", CHANGE_CELEBRATION: "Celebración",
  TEAMWORK_DIVERGENCE: "Divergencia", TEAMWORK_CONNECTION: "Conexión", TEAMWORK_JOY: "Alegría",
  EXECUTION_ACCOUNTABILITY: "Responsabilidad", EXECUTION_FEEDBACK: "Feedback", EXECUTION_FOCUS: "Enfoque",
};
const STATE_LABEL: Record<string, string> = {
  alineado: "Alineado", punto_ciego: "Punto ciego", oculto: "Oculto", neutral: "Neutral",
};
// chip: texto + fondo (sin '#', formato pptxgenjs)
const STATE_COLOR: Record<string, { fg: string; bg: string }> = {
  alineado: { fg: "166534", bg: "DCFCE7" },
  punto_ciego: { fg: "9F1239", bg: "FFE4E6" },
  oculto: { fg: "92400E", bg: "FEF3C7" },
  neutral: { fg: "4B5563", bg: "F3F4F6" },
};

// ——— Marca ———
const VIOLET = "7C3AED";
const FG = "1F2937";
const MUTED = "6B7280";
const TRACK = "E5E7EB";
// Misma regla de la página: verde si ≥108, ámbar si medio/bajo.
const BAR_HIGH = "4D7C0F";
const BAR_MID = "CA8A04";

const SLIDE_W = 10; // LAYOUT_16x9
const FONT = "Arial";

// pptxgenjs no exporta tipos cómodos para uso dinámico; alias mínimos locales.
type Pptx = InstanceType<typeof import("pptxgenjs").default>;
type Slide = ReturnType<Pptx["addSlide"]>;

function slug(s: string): string {
  return (
    s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "informe"
  );
}

function metaLine(report: ConsultantReportData): string {
  return [
    report.vsInstrument,
    report.scope === "cohort" ? "cohorte agregada" : "individual",
    `SEI n=${report.sei.sampleSize}`,
    `VS ${report.vsSource === "real" ? "real" : "inferido"}${report.vsSampleSize ? ` (n=${report.vsSampleSize})` : ""}`,
  ].join(" · ");
}

/** Franja violeta + título de sección arriba de cada slide de contenido. */
function sectionSlide(pptx: Pptx, title: string, subtitle?: string): Slide {
  const slide = pptx.addSlide();
  slide.background = { color: "FFFFFF" };
  slide.addShape("rect", { x: 0, y: 0, w: SLIDE_W, h: 0.12, fill: { color: VIOLET } });
  slide.addText(title, {
    x: 0.5, y: 0.3, w: 9, h: 0.5,
    fontFace: FONT, fontSize: 20, bold: true, color: FG,
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.5, y: 0.78, w: 9, h: 0.3,
      fontFace: FONT, fontSize: 10, color: MUTED,
    });
  }
  return slide;
}

/**
 * Barra estilo Rowi como shapes (sin addChart: control exacto de la regla de
 * color por-valor de la página, que un chart no replica).
 */
function addBar(
  slide: Slide,
  opts: { label: string; value: number; min: number; max: number; y: number },
) {
  const { label, value, min, max, y } = opts;
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  const color = value >= 108 ? BAR_HIGH : BAR_MID;
  const labelW = 2.7;
  const barX = 0.5 + labelW + 0.1;
  const barW = 5.4;
  slide.addText(label, {
    x: 0.5, y, w: labelW, h: 0.26,
    fontFace: FONT, fontSize: 10, color: MUTED, valign: "middle",
  });
  slide.addShape("roundRect", {
    x: barX, y: y + 0.05, w: barW, h: 0.16, rectRadius: 0.08, fill: { color: TRACK }, line: { type: "none" },
  });
  if (pct > 0) {
    slide.addShape("roundRect", {
      x: barX, y: y + 0.05, w: Math.max(0.16, (barW * pct) / 100), h: 0.16, rectRadius: 0.08,
      fill: { color }, line: { type: "none" },
    });
  }
  slide.addText(String(Math.round(value)), {
    x: barX + barW + 0.1, y, w: 0.6, h: 0.26,
    fontFace: FONT, fontSize: 10, bold: true, color: FG, valign: "middle",
  });
}

function addBarsSlides(
  pptx: Pptx,
  title: string,
  rows: { label: string; value: number; min: number; max: number }[],
  subtitle?: string,
) {
  const PER_SLIDE = 14;
  for (let i = 0; i < rows.length; i += PER_SLIDE) {
    const chunk = rows.slice(i, i + PER_SLIDE);
    const more = rows.length > PER_SLIDE ? ` (${i / PER_SLIDE + 1}/${Math.ceil(rows.length / PER_SLIDE)})` : "";
    const slide = sectionSlide(pptx, title + more, subtitle);
    chunk.forEach((r, j) => addBar(slide, { ...r, y: 1.25 + j * 0.31 }));
  }
}

/** Marcas de honestidad del motor — mismo texto que la página. */
function flagSuffix(it: EngineInsightData): string {
  const parts: string[] = [];
  if (it.flags.smallN) parts.push("[n pequeño]");
  if (it.flags.highDispersion) parts.push("[DE alta]");
  if (it.flags.isWellbeing) parts.push("[bienestar]");
  return parts.length ? " " + parts.join(" ") : "";
}

function addInsightSlides(
  pptx: Pptx,
  title: string,
  subtitle: string,
  items: EngineInsightData[],
) {
  if (!items.length) {
    const slide = sectionSlide(pptx, title, subtitle);
    slide.addText("Sin señales en este nivel.", {
      x: 0.5, y: 1.3, w: 9, h: 0.4, fontFace: FONT, fontSize: 12, color: MUTED,
    });
    return;
  }
  const PER_SLIDE = 7;
  for (let i = 0; i < items.length; i += PER_SLIDE) {
    const chunk = items.slice(i, i + PER_SLIDE);
    const more = items.length > PER_SLIDE ? ` (${i / PER_SLIDE + 1}/${Math.ceil(items.length / PER_SLIDE)})` : "";
    const slide = sectionSlide(pptx, title + more, subtitle);
    slide.addText(
      chunk.map((it) => ({
        text: `${it.reading}${flagSuffix(it)}`,
        options: { bullet: { characterCode: "2022" as const, indent: 14 }, fontSize: 11, color: FG, paraSpaceAfter: 8 },
      })),
      { x: 0.5, y: 1.25, w: 9, h: 4, fontFace: FONT, valign: "top" },
    );
  }
}

function coverSlide(
  pptx: Pptx,
  report: ConsultantReportData,
  opts: { tagline: string; taglineColor: string; deckTitle: string },
) {
  const slide = pptx.addSlide();
  slide.background = { color: "FFFFFF" };
  slide.addShape("rect", { x: 0, y: 0, w: SLIDE_W, h: 1.7, fill: { color: VIOLET } });
  slide.addText("Rowi · Six Seconds", {
    x: 0.5, y: 0.55, w: 9, h: 0.5, fontFace: FONT, fontSize: 16, bold: true, color: "FFFFFF",
  });
  slide.addText(opts.tagline, {
    x: 0.5, y: 2.0, w: 9, h: 0.35, fontFace: FONT, fontSize: 11, bold: true, color: opts.taglineColor,
  });
  slide.addText(opts.deckTitle, {
    x: 0.5, y: 2.4, w: 9, h: 0.7, fontFace: FONT, fontSize: 28, bold: true, color: FG,
  });
  slide.addText(report.subjectLabel, {
    x: 0.5, y: 3.2, w: 9, h: 0.5, fontFace: FONT, fontSize: 18, color: VIOLET, bold: true,
  });
  slide.addText(metaLine(report), {
    x: 0.5, y: 3.75, w: 9, h: 0.35, fontFace: FONT, fontSize: 11, color: MUTED,
  });
  // Client-side: new Date() es la fecha local del consultor (nunca corre en server).
  slide.addText(
    new Date().toLocaleDateString("es", { year: "numeric", month: "long", day: "numeric" }),
    { x: 0.5, y: 4.15, w: 9, h: 0.35, fontFace: FONT, fontSize: 11, color: MUTED },
  );
}

async function newDeck(): Promise<Pptx> {
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "ROWI_16x9", width: SLIDE_W, height: 5.625 });
  pptx.layout = "ROWI_16x9";
  return pptx;
}

// ————————————————————————————————————————————————————————————————
// 1) PPTX CLIENTE — lo que SÍ va a la propuesta oficial.
// ————————————————————————————————————————————————————————————————
export async function exportClientPptx(report: ConsultantReportData): Promise<void> {
  const pptx = await newDeck();

  coverSlide(pptx, report, {
    tagline: "INFORME PARA EL CLIENTE · SOLO AGREGADO",
    taglineColor: "166534",
    deckTitle: "Informe SEI ↔ Vital Signs",
  });

  // Lectura general (niveles del cruce, no re-cálculo)
  {
    const slide = sectionSlide(pptx, "Lectura general", metaLine(report));
    const counts: Record<string, number> = {};
    for (const r of report.blindspotMap) counts[r.state] = (counts[r.state] ?? 0) + 1;
    const order = ["alineado", "punto_ciego", "oculto", "neutral"] as const;
    order.forEach((state, i) => {
      const c = STATE_COLOR[state];
      const x = 0.5 + i * 2.35;
      slide.addShape("roundRect", {
        x, y: 1.5, w: 2.15, h: 1.5, rectRadius: 0.08, fill: { color: c.bg }, line: { type: "none" },
      });
      slide.addText(String(counts[state] ?? 0), {
        x, y: 1.65, w: 2.15, h: 0.7, fontFace: FONT, fontSize: 30, bold: true, color: c.fg, align: "center",
      });
      slide.addText(STATE_LABEL[state], {
        x, y: 2.35, w: 2.15, h: 0.4, fontFace: FONT, fontSize: 12, color: c.fg, align: "center",
      });
    });
    slide.addText(
      "Cruce de la capacidad real (SEI) con la autopercepción (Vital Signs). Lectura relativa interna: importa el patrón, no el nivel absoluto.",
      { x: 0.5, y: 3.4, w: 9, h: 0.7, fontFace: FONT, fontSize: 11, color: MUTED },
    );
  }

  // SEI · 8 competencias (barras 70–130, misma regla de color que la página)
  addBarsSlides(
    pptx,
    "SEI · 8 competencias",
    Object.entries(report.sei.competencies).map(([k, v]) => ({
      label: SEI_LABEL[k] ?? k, value: v, min: 70, max: 130,
    })),
  );

  // Vital Signs · pulse points
  const pulseEntries = Object.entries(report.pulses);
  if (pulseEntries.length > 0) {
    const isLvs = report.vsInstrument === "LVS";
    addBarsSlides(
      pptx,
      `Vital Signs · pulse points${report.vsSource === "inferred" ? " (inferidos)" : ""}`,
      pulseEntries.map(([code, v]) => ({
        label: PULSE_LABEL[code] ?? code, value: v, min: isLvs ? 1 : 70, max: isLvs ? 5 : 130,
      })),
    );
  }

  // Mapa de puntos ciegos
  {
    const PER_SLIDE = 13;
    const rows = report.blindspotMap;
    for (let i = 0; i < rows.length; i += PER_SLIDE) {
      const chunk = rows.slice(i, i + PER_SLIDE);
      const more = rows.length > PER_SLIDE ? ` (${i / PER_SLIDE + 1}/${Math.ceil(rows.length / PER_SLIDE)})` : "";
      const slide = sectionSlide(pptx, "Cruce SEI ↔ VS · mapa de puntos ciegos" + more);
      chunk.forEach((r, j) => {
        const y = 1.2 + j * 0.33;
        const c = STATE_COLOR[r.state] ?? STATE_COLOR.neutral;
        slide.addText(PULSE_LABEL[r.pulse] ?? r.pulse, {
          x: 0.5, y, w: 5.5, h: 0.28, fontFace: FONT, fontSize: 11, color: FG, valign: "middle",
        });
        slide.addShape("roundRect", {
          x: 6.2, y: y + 0.02, w: 1.6, h: 0.24, rectRadius: 0.12, fill: { color: c.bg }, line: { type: "none" },
        });
        slide.addText(STATE_LABEL[r.state] ?? r.state, {
          x: 6.2, y: y + 0.02, w: 1.6, h: 0.24, fontFace: FONT, fontSize: 9, bold: true, color: c.fg,
          align: "center", valign: "middle",
        });
      });
    }
  }

  // Diagnóstico (espejo)
  if (report.diagnosis) {
    const paras = report.diagnosis.split(/\n+/).map((s) => s.trim()).filter(Boolean);
    const PER_SLIDE = 6;
    for (let i = 0; i < paras.length; i += PER_SLIDE) {
      const chunk = paras.slice(i, i + PER_SLIDE);
      const more = paras.length > PER_SLIDE ? ` (${i / PER_SLIDE + 1}/${Math.ceil(paras.length / PER_SLIDE)})` : "";
      const slide = sectionSlide(pptx, "Diagnóstico (espejo)" + more);
      slide.addText(
        chunk.map((p) => ({ text: p, options: { fontSize: 11, color: FG, paraSpaceAfter: 10 } })),
        { x: 0.5, y: 1.25, w: 9, h: 4, fontFace: FONT, valign: "top" },
      );
    }
  }

  // Canasta CLIENTE (agregado) — la confidencial NO entra en este archivo.
  addInsightSlides(
    pptx,
    "Para el cliente (agregado)",
    "Insights de equipo — van a la propuesta oficial.",
    report.insights?.client ?? [],
  );

  await pptx.writeFile({ fileName: `rowi-informe-${slug(report.subjectLabel)}-cliente.pptx` });
}

// ————————————————————————————————————————————————————————————————
// 2) PPTX CONFIDENCIAL — canasta partner + guía. Archivo APARTE.
// ————————————————————————————————————————————————————————————————
export async function exportConfidentialPptx(report: ConsultantReportData): Promise<void> {
  const pptx = await newDeck();

  coverSlide(pptx, report, {
    tagline: "CONFIDENCIAL · SOLO PARA EL PARTNER FACILITADOR",
    taglineColor: "92400E",
    deckTitle: "Guía de lectura e intervención",
  });

  // Advertencia (mismo texto que la página)
  {
    const slide = sectionSlide(pptx, "Antes de usar este documento");
    slide.addText(
      "Este documento contiene lecturas individuales que NO deben compartirse con el cliente ni incluirse en la propuesta oficial. La data personal pertenece a cada persona; aquí se usa solo para diseñar una conversación cuidadosa.",
      { x: 0.5, y: 1.4, w: 9, h: 1.2, fontFace: FONT, fontSize: 13, color: FG },
    );
    slide.addText(
      "Regla raíz: lo agregado es del proyecto; lo individual es de la persona. Si una lectura no ayuda a la persona, no se usa.",
      { x: 0.5, y: 3.0, w: 9, h: 0.8, fontFace: FONT, fontSize: 12, italic: true, color: "92400E" },
    );
  }

  // Canasta CONFIDENCIAL del partner
  addInsightSlides(
    pptx,
    "Lecturas individuales (motor)",
    "Individual/SEI — NUNCA en material de cliente. Solo en 1:1 con consentimiento.",
    report.insights?.partner ?? [],
  );

  // Cómo entrar (guion)
  {
    const slide = sectionSlide(pptx, "Cómo entrar (guion)");
    const bullets = [
      "El SEI es un espejo, no un veredicto. No defender el reporte.",
      "Empezar por lo que se fortaleció antes de explorar lo que se enfrió.",
      "Una emoción por vez. Curiosidad antes que juicio.",
      "Ante señales de bienestar (marcadas): acompañar, no diagnosticar.",
    ];
    slide.addText(
      bullets.map((b) => ({
        text: b,
        options: { bullet: { characterCode: "2022" as const, indent: 14 }, fontSize: 13, color: FG, paraSpaceAfter: 12 },
      })),
      { x: 0.5, y: 1.4, w: 9, h: 3.5, fontFace: FONT, valign: "top" },
    );
  }

  // ¿Tocar el SEI o no?
  {
    const slide = sectionSlide(pptx, "¿Tocar el SEI o no?");
    const rows: [string, string][] = [
      ["Presentación/propuesta al cliente", "No. Solo agregado, nunca perfiles individuales."],
      ["Debrief de equipo", "No a nivel persona. Patrones del grupo, sin señalar."],
      ["Sesión 1:1", "Sí, con su permiso. Su SEI es de la persona; se trabaja como espejo."],
    ];
    rows.forEach(([ctx, rule], i) => {
      const y = 1.4 + i * 1.0;
      slide.addText(ctx, {
        x: 0.5, y, w: 3.4, h: 0.8, fontFace: FONT, fontSize: 12, bold: true, color: VIOLET, valign: "top",
      });
      slide.addText(rule, {
        x: 4.1, y, w: 5.4, h: 0.8, fontFace: FONT, fontSize: 12, color: FG, valign: "top",
      });
    });
  }

  await pptx.writeFile({ fileName: `rowi-informe-${slug(report.subjectLabel)}-confidencial.pptx` });
}
