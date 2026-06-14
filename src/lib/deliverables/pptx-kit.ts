/**
 * 🎨 Kit gráfico Rowi para PPTX (server-side, pptxgenjs) — primitivas compartidas.
 *
 * Línea gráfica única de los entregables PPTX (Propuesta al cliente, Hallazgos
 * preliminares). Gradiente/círculos de marca en portadas, slides de contenido
 * con eyebrow + título, cajas (bullet/stat), listas numeradas, barras como
 * shapes y la franja oscura de cierre. Solo dibuja: cada deck compone.
 *
 * pptxgenjs no embebe fuentes de forma fiable → Arial (universal). Colores en
 * formato pptxgenjs (hex sin '#').
 */

// ── Marca (hex sin '#') ──
export const VIOLET = "7C3AED";
export const VIOLET_LT = "8B5CF6";
export const VIOLET_DARK = "5B21B6";
export const PINK = "D797CF";
export const CORAL = "C2410C";
export const FG = "1F2937";
export const MUTED = "6B7280";
export const BOX_BG = "F3EEFE";
export const PANEL = "F3F4F6";
export const TRACK = "E5E7EB";
export const WHITE = "FFFFFF";
export const FONT = "Arial";
export const SLIDE_W = 10;
export const SLIDE_H = 5.625;

export type Pptx = InstanceType<typeof import("pptxgenjs").default>;
export type Slide = ReturnType<Pptx["addSlide"]>;

export interface StatRow { label: string; value: string }

/** Crea un deck 16:9 con el layout de marca aplicado. */
export async function newDeck(): Promise<Pptx> {
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "ROWI_16x9", width: SLIDE_W, height: SLIDE_H });
  pptx.layout = "ROWI_16x9";
  return pptx;
}

/** Serializa el deck a Buffer (server-side). */
export async function deckToBuffer(pptx: Pptx): Promise<Buffer> {
  return (await pptx.write({ outputType: "nodebuffer" })) as Buffer;
}

/** Pie de página estándar: cliente + entregable (izq) · sección · n (der). */
export function footer(slide: Slide, leftText: string, rightLabel: string, n: number) {
  slide.addText(leftText, { x: 0.5, y: SLIDE_H - 0.35, w: 6, h: 0.25, fontFace: FONT, fontSize: 7, color: MUTED });
  slide.addText(`${rightLabel} · ${n}`, { x: SLIDE_W - 3, y: SLIDE_H - 0.35, w: 2.5, h: 0.25, fontFace: FONT, fontSize: 7, color: MUTED, align: "right" });
}

/** Portada de marca: gradiente violeta + círculos + búho opcional. */
export function coverSlide(pptx: Pptx, opts: {
  kicker: string; type: string; title: string; subtitle: string; tail: string; owl?: Buffer;
}): Slide {
  const cover = pptx.addSlide();
  cover.background = { color: VIOLET };
  cover.addShape("ellipse", { x: 7.0, y: -1.2, w: 4.2, h: 4.2, fill: { color: VIOLET_LT } });
  cover.addShape("ellipse", { x: 8.2, y: 2.4, w: 2.6, h: 2.6, fill: { color: PINK, transparency: 35 } });
  cover.addText(opts.kicker.toUpperCase(), { x: 0.5, y: 0.85, w: 6.5, h: 0.3, fontFace: FONT, fontSize: 11, bold: true, color: "DDD6FE", charSpacing: 2 });
  cover.addText(opts.type, { x: 0.5, y: 1.5, w: 7, h: 0.4, fontFace: FONT, fontSize: 16, italic: true, color: "DDD6FE" });
  cover.addText(opts.title, { x: 0.5, y: 2.1, w: 7.2, h: 1.2, fontFace: FONT, fontSize: 30, bold: true, color: WHITE });
  cover.addText(opts.subtitle, { x: 0.5, y: 3.6, w: 6.8, h: 0.6, fontFace: FONT, fontSize: 12, color: "E9D5FF" });
  if (opts.owl) {
    try { cover.addImage({ data: `image/png;base64,${opts.owl.toString("base64")}`, x: 8.25, y: 3.55, w: 1.05, h: 1.05 }); } catch { /* búho opcional */ }
  }
  cover.addText(opts.tail, { x: 0.5, y: SLIDE_H - 0.7, w: 6, h: 0.3, fontFace: FONT, fontSize: 10, color: "C4B5FD" });
  return cover;
}

/** Slide de contenido: eyebrow + título grande + subtítulo + footer. */
export function contentSlide(pptx: Pptx, opts: {
  eyebrow: string; title: string; sub?: string; footerLeft: string; footerLabel: string; n: number;
}): Slide {
  const slide = pptx.addSlide();
  slide.background = { color: WHITE };
  slide.addText(opts.eyebrow.toUpperCase(), { x: 0.5, y: 0.3, w: 9, h: 0.25, fontFace: FONT, fontSize: 9, bold: true, color: VIOLET, charSpacing: 2 });
  slide.addText(opts.title, { x: 0.5, y: 0.6, w: 9, h: 0.6, fontFace: FONT, fontSize: 22, bold: true, color: FG });
  if (opts.sub) slide.addText(opts.sub, { x: 0.5, y: 1.25, w: 9, h: 0.5, fontFace: FONT, fontSize: 11, color: MUTED });
  footer(slide, opts.footerLeft, opts.footerLabel, opts.n);
  return slide;
}

/** Caja con título + bullets y barra de acento a la izquierda. */
export function bulletBox(slide: Slide, x: number, y: number, w: number, h: number, title: string, items: string[], accent: string) {
  slide.addShape("rect", { x, y, w, h, fill: { color: BOX_BG } });
  slide.addShape("rect", { x, y, w: 0.06, h, fill: { color: accent } });
  slide.addText(title, { x: x + 0.25, y: y + 0.18, w: w - 0.5, h: 0.3, fontFace: FONT, fontSize: 12, bold: true, color: accent });
  slide.addText(items.map((it) => ({ text: it, options: { bullet: { code: "2022" }, fontSize: 11, color: FG, paraSpaceAfter: 6 } })), { x: x + 0.25, y: y + 0.7, w: w - 0.5, h: h - 0.9, fontFace: FONT, valign: "top" });
}

/** Caja de estadísticas: título + filas etiqueta→valor. */
export function statBox(slide: Slide, x: number, y: number, w: number, h: number, title: string, rows: StatRow[], valueColor: string) {
  slide.addShape("rect", { x, y, w, h, fill: { color: BOX_BG } });
  slide.addText(title.toUpperCase(), { x: x + 0.25, y: y + 0.18, w: w - 0.5, h: 0.3, fontFace: FONT, fontSize: 10, bold: true, color: VIOLET, charSpacing: 1 });
  const rowH = (h - 0.7) / Math.max(rows.length, 1);
  rows.forEach((r, i) => {
    const ry = y + 0.6 + i * rowH;
    slide.addText(r.label, { x: x + 0.25, y: ry, w: w - 1.4, h: rowH, fontFace: FONT, fontSize: 11, color: FG, valign: "middle" });
    slide.addText(r.value, { x: x + w - 1.3, y: ry, w: 1.1, h: rowH, fontFace: FONT, fontSize: 13, bold: true, color: valueColor, align: "right", valign: "middle" });
  });
}

/** Nota en itálica al pie del área de contenido (la "cita" del slide). */
export function quoteNote(slide: Slide, text: string) {
  slide.addText(text, { x: 0.5, y: SLIDE_H - 0.95, w: 9, h: 0.5, fontFace: FONT, fontSize: 10, italic: true, color: VIOLET_DARK, valign: "top" });
}

/** Lista numerada con círculos violeta (clara u oscura). */
export function numberedList(slide: Slide, items: { title: string; desc: string }[], y0: number, dark: boolean) {
  const rowH = Math.min(0.78, (SLIDE_H - y0 - 0.6) / items.length);
  items.forEach((it, i) => {
    const y = y0 + i * rowH;
    slide.addShape("ellipse", { x: 0.5, y, w: 0.4, h: 0.4, fill: { color: dark ? VIOLET_LT : VIOLET } });
    slide.addText(String(i + 1), { x: 0.5, y, w: 0.4, h: 0.4, fontFace: FONT, fontSize: 13, bold: true, color: WHITE, align: "center", valign: "middle" });
    slide.addText(it.title, { x: 1.1, y: y - 0.02, w: 8, h: 0.3, fontFace: FONT, fontSize: 13, bold: true, color: dark ? WHITE : FG });
    slide.addText(it.desc, { x: 1.1, y: y + 0.26, w: 8, h: 0.3, fontFace: FONT, fontSize: 10.5, color: dark ? "DDD6FE" : MUTED });
  });
}

/** Franja oscura de cierre (próximos pasos): eyebrow + título + lista numerada. */
export function closingSlide(pptx: Pptx, opts: {
  eyebrow: string; title: string; steps: { title: string; desc: string }[]; tail: string;
}): Slide {
  const s = pptx.addSlide();
  s.background = { color: VIOLET };
  s.addShape("ellipse", { x: -1.5, y: 3.2, w: 4, h: 4, fill: { color: VIOLET_LT } });
  s.addText(opts.eyebrow.toUpperCase(), { x: 0.5, y: 0.5, w: 9, h: 0.3, fontFace: FONT, fontSize: 11, bold: true, color: "DDD6FE", charSpacing: 2 });
  s.addText(opts.title, { x: 0.5, y: 0.95, w: 9, h: 0.7, fontFace: FONT, fontSize: 30, bold: true, color: WHITE });
  numberedList(s, opts.steps, 2.1, true);
  s.addText(opts.tail, { x: 0.5, y: SLIDE_H - 0.45, w: 6, h: 0.3, fontFace: FONT, fontSize: 9, color: "C4B5FD" });
  return s;
}

/**
 * Tarjeta de estadística grande (las del alcance: número gigante + título +
 * descripción), con barra de acento arriba.
 */
export function bigStatCard(slide: Slide, x: number, y: number, w: number, h: number, opts: {
  number: string; title: string; desc: string; accent: string;
}) {
  slide.addShape("rect", { x, y, w, h, fill: { color: BOX_BG } });
  slide.addShape("rect", { x, y, w, h: 0.07, fill: { color: opts.accent } });
  slide.addText(opts.number, { x: x + 0.25, y: y + 0.25, w: w - 0.5, h: 0.9, fontFace: FONT, fontSize: 40, bold: true, color: opts.accent });
  slide.addText(opts.title, { x: x + 0.25, y: y + 1.2, w: w - 0.5, h: 0.6, fontFace: FONT, fontSize: 13, bold: true, color: FG, valign: "top" });
  slide.addText(opts.desc, { x: x + 0.25, y: y + 1.95, w: w - 0.5, h: h - 2.1, fontFace: FONT, fontSize: 9.5, color: MUTED, valign: "top" });
}

/**
 * Barras horizontales como shapes (no addChart: control de color por valor y de
 * la marca de norma). Escala configurable. Devuelve el alto consumido.
 */
export function hbars(slide: Slide, x: number, y: number, w: number, rows: { label: string; value: number }[], opts?: {
  min?: number; max?: number; norm?: number; color?: string; rowH?: number; labelW?: number;
}) {
  const min = opts?.min ?? 60;
  const max = opts?.max ?? 135;
  const color = opts?.color ?? VIOLET;
  const rowH = opts?.rowH ?? 0.42;
  const labelW = opts?.labelW ?? 1.5;
  const barX = x + labelW;
  const barMaxW = w - labelW - 0.6;
  rows.forEach((r, i) => {
    const ry = y + i * rowH;
    slide.addText(r.label, { x, y: ry, w: labelW - 0.1, h: rowH, fontFace: FONT, fontSize: 9.5, color: FG, align: "right", valign: "middle" });
    slide.addShape("rect", { x: barX, y: ry + rowH / 2 - 0.08, w: barMaxW, h: 0.16, fill: { color: TRACK } });
    const pct = Math.max(0.02, Math.min(1, (r.value - min) / (max - min)));
    slide.addShape("rect", { x: barX, y: ry + rowH / 2 - 0.08, w: barMaxW * pct, h: 0.16, fill: { color } });
    slide.addText(r.value.toFixed(1), { x: barX + barMaxW + 0.05, y: ry, w: 0.55, h: rowH, fontFace: FONT, fontSize: 9, bold: true, color: FG, valign: "middle" });
  });
  return rows.length * rowH;
}

/** Columnas verticales (las correlaciones del Hallazgo 2). */
export function vbars(slide: Slide, x: number, y: number, w: number, h: number, rows: { label: string; value: number }[], opts?: { min?: number; max?: number; color?: string }) {
  const min = opts?.min ?? 0;
  const max = opts?.max ?? 1;
  const color = opts?.color ?? VIOLET;
  const gap = 0.18;
  const colW = (w - gap * (rows.length - 1)) / rows.length;
  const chartH = h - 0.7; // deja sitio a etiquetas abajo
  rows.forEach((r, i) => {
    const cx = x + i * (colW + gap);
    const pct = Math.max(0.02, Math.min(1, (r.value - min) / (max - min)));
    const barH = chartH * pct;
    const by = y + chartH - barH;
    slide.addShape("rect", { x: cx, y: by, w: colW, h: barH, fill: { color } });
    slide.addText(r.value.toFixed(2), { x: cx, y: by - 0.25, w: colW, h: 0.22, fontFace: FONT, fontSize: 9, color: MUTED, align: "center" });
    slide.addText(r.label, { x: cx - 0.1, y: y + chartH + 0.05, w: colW + 0.2, h: 0.5, fontFace: FONT, fontSize: 8.5, color: FG, align: "center", valign: "top" });
  });
}
