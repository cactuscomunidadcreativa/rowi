/**
 * 🎨 Kit gráfico Rowi para PDF (server-side, pdfkit) — primitivas compartidas.
 *
 * Es la línea gráfica ÚNICA de todos los entregables del producto (Perfil
 * Integral, Guía Confidencial, Reporte Full de Hiring, etc.). Clona el estilo
 * de los entregables ya validados (perfil Carolina / guías confidenciales):
 * franja violeta con gradiente + búho, barras 70–130 con marca de norma,
 * tablas con header violeta, cajas de callout, chips de estado.
 *
 * No sabe NADA de SEI/VS/afinidad: solo dibuja. Cada generador concreto
 * (deliverables/*.ts) compone estas primitivas con sus datos.
 *
 * Fuentes: embebe Poppins (.ttf en `public/fonts/`) para la voz de marca —
 * redondeada y cálida. Si los .ttf no cargan (entorno raro), cae a Helvetica
 * sin romper. Usa los pesos lógicos `font()` ("regular"/"bold"/…), nunca
 * `doc.font("Helvetica")` directo desde los generadores.
 *
 * Solo caracteres latinos (ES/PT/EN). Evita flechas unicode (↔ → ←) en texto
 * renderizado; usa "<->", "->" en su lugar.
 */
import PDFDocument from "pdfkit";
import fs from "node:fs";
import path from "node:path";

export type Doc = InstanceType<typeof PDFDocument>;

// ─────────────────────────── Paleta Rowi ───────────────────────────
export const C = {
  violet: "#7c3aed", // --rowi-g2 (color de marca)
  violetDark: "#5b21b6",
  pink: "#d797cf", // --rowi-g1 (fin del gradiente de marca)
  violetBg: "#f3eefe",
  ink: "#1f2937",
  muted: "#6b7280",
  track: "#e9e4f5",
  white: "#ffffff",
  blue: "#31a2e3",
  pinkAccent: "#f378a5",
  greenDark: "#047857",
  tealBg: "#ecfdf5",
  amberBg: "#fff7ed",
  amberTxt: "#9a3412",
  coral: "#e8643c",
  coralBg: "#fff1ec",
  barHigh: "#4d7c0f", // ≥108 (norma SEI/VS)
  barMid: "#ca8a04",
} as const;

// ── Paleta extra del "Reporte Full de Hiring" (port reportlab → pdfkit) ──
// El generador Python usa estos hex literales, distintos de C.barMid/C.muted;
// se exportan para que las secciones del reporte rico los reusen con fidelidad.
export const GREEN = "#10b981"; // punto verde / marca top (Python GREEN)
export const HIRING_WARM = "#f59e0b"; // Python WARM (ámbar, más vivo que C.barMid)
export const HIRING_COLD = "#64748b"; // Python COLD (slate, distinto de C.muted)

// Estados del cruce SEI↔VS (chips). Mismo set que blindspot-map.
export const STATE_LABEL: Record<string, string> = {
  alineado: "Alineado", punto_ciego: "Punto ciego", oculto: "Oculto", neutral: "Neutral",
};
export const STATE_LABEL_EN: Record<string, string> = {
  alineado: "Aligned", punto_ciego: "Blind spot", oculto: "Hidden", neutral: "Neutral",
};
export const STATE_LABEL_PT: Record<string, string> = {
  alineado: "Alinhado", punto_ciego: "Ponto cego", oculto: "Oculto", neutral: "Neutro",
};
export const STATE_COLOR: Record<string, { fg: string; bg: string }> = {
  alineado: { fg: "#166534", bg: "#dcfce7" },
  punto_ciego: { fg: "#9f1239", bg: "#ffe4e6" },
  oculto: { fg: "#92400e", bg: "#fef3c7" },
  neutral: { fg: "#4b5563", bg: "#f3f4f6" },
};

// ─────────────────────────── Geometría A4 ───────────────────────────
export const PAGE_W = 595.28;
export const PAGE_H = 841.89;
export const MX = 48;
export const CW = PAGE_W - 2 * MX;
export const BOTTOM = PAGE_H - 56;

export type Lang = "es" | "en" | "pt";

/** Tagline de marca por idioma (no se traduce "rowi"). */
const TAGLINE: Record<Lang, string> = {
  es: "Sé quien quieres ser",
  en: "Be who you want to be",
  pt: "Seja quem você quer ser",
};
const PAGE_WORD: Record<Lang, string> = { es: "pág.", en: "page", pt: "pág." };

// ── Constantes del header/footer absolutos del Reporte Full de Hiring ──
const HEADER_TAGLINE: Record<Lang, string> = {
  es: "Sé quien quieres ser",
  en: "Be who you want to be",
  pt: "Seja quem você quer ser",
};
const PAGE_WORD_HIRING: Record<Lang, string> = { es: "pág.", en: "page", pt: "pág." };
const FOOTER_GEN: Record<Lang, string> = { es: "Generado el", en: "Generated on", pt: "Gerado em" };
// Fallback de fecha si la sección no inyecta una real vía genLeft.
const FOOTER_DATE = "23-jun-2026";
// Etiquetas por defecto del chip de banda (Python band_chip default labels).
const BAND_CHIP_LABEL: Record<"hot" | "warm" | "cold", Record<Lang, string>> = {
  hot: { es: "Alta sintonía", en: "High sync", pt: "Alta sintonia" },
  warm: { es: "Sintonía media", en: "Mid sync", pt: "Sintonia média" },
  cold: { es: "Baja sintonía", en: "Low sync", pt: "Baixa sintonia" },
};

// ─────────────────────── Fuentes de marca (Poppins) ───────────────────────
// Pesos lógicos → nombre registrado en pdfkit; cae a Helvetica si no carga.
type Weight = "regular" | "medium" | "semibold" | "bold" | "italic";
const POPPINS_FILES: Record<Weight, string> = {
  regular: "Poppins-Regular.ttf",
  medium: "Poppins-Medium.ttf",
  semibold: "Poppins-SemiBold.ttf",
  bold: "Poppins-Bold.ttf",
  italic: "Poppins-Italic.ttf",
};
const HELVETICA_FALLBACK: Record<Weight, string> = {
  regular: "Helvetica", medium: "Helvetica", semibold: "Helvetica-Bold",
  bold: "Helvetica-Bold", italic: "Helvetica-Oblique",
};
const FONT_KEY: Record<Weight, string> = {
  regular: "Rowi", medium: "Rowi-Md", semibold: "Rowi-SB", bold: "Rowi-Bd", italic: "Rowi-It",
};

/** Carga los .ttf en el doc. Devuelve true si Poppins quedó disponible. */
function registerFonts(doc: Doc): boolean {
  const dir = path.join(process.cwd(), "public", "fonts");
  let ok = true;
  for (const w of Object.keys(POPPINS_FILES) as Weight[]) {
    try {
      const file = path.join(dir, POPPINS_FILES[w]);
      if (!fs.existsSync(file)) { ok = false; continue; }
      doc.registerFont(FONT_KEY[w], file);
    } catch {
      ok = false;
    }
  }
  return ok;
}

/**
 * Documento Rowi: envuelve pdfkit con el cursor, header/footer, gradiente de
 * marca y el búho opcional. Lleva el estado de paginación. Usa `r.font(w)` en
 * vez de `doc.font(...)`: respeta las fuentes embebidas con fallback seguro.
 */
export class RowiPdf {
  doc: Doc;
  y = 0;
  page = 1;
  lang: Lang;
  footerLeft: string;
  badge: string; // palabra de esquina (CONFIDENCIAL / SOLO AGREGADO / etc.)
  badgeColor: string;
  private owl?: Buffer;
  private hasPoppins: boolean;

  constructor(opts: { lang: Lang; footerLeft: string; badge?: string; badgeColor?: string; owl?: Buffer }) {
    this.doc = new PDFDocument({ size: "A4", margin: 0, bufferPages: true });
    this.hasPoppins = registerFonts(this.doc);
    this.lang = opts.lang;
    this.footerLeft = opts.footerLeft;
    this.badge = opts.badge ?? "";
    this.badgeColor = opts.badgeColor ?? C.violet;
    this.owl = opts.owl;
  }

  /** Aplica un peso lógico a `this.doc` (Poppins embebida o Helvetica). */
  font(w: Weight): Doc {
    return this.doc.font(this.hasPoppins ? FONT_KEY[w] : HELVETICA_FALLBACK[w]);
  }

  /** Gradiente de marca violeta→rosa para una franja rectangular. */
  private brandGradient(x: number, y: number, w: number, h: number) {
    const g = this.doc.linearGradient(x, y, x + w, y);
    g.stop(0, C.violet).stop(1, C.pink);
    return g;
  }

  /** Franja con gradiente de marca + marca + (opcional) búho + título/subtítulo. */
  header(opts: { eyebrow?: string; eyebrowColor?: string; title: string; subtitle?: string }) {
    const d = this.doc;
    d.rect(0, 0, PAGE_W, 64).fill(this.brandGradient(0, 0, PAGE_W, 64));
    if (this.owl) {
      try { d.image(this.owl, PAGE_W - MX - 46, 9, { fit: [46, 46] }); } catch { /* búho opcional */ }
    }
    this.font("bold").fontSize(20).fillColor(C.white).text("rowi", MX, 15, { lineBreak: false });
    this.font("regular").fontSize(7).fillColor(C.white).text(TAGLINE[this.lang], MX, 41, { lineBreak: false });
    const rightW = CW - 56; // deja sitio al búho
    this.font("semibold").fontSize(12).fillColor(C.white)
      .text(opts.title, MX, 16, { width: rightW, align: "right", lineBreak: false });
    if (opts.subtitle) {
      this.font("regular").fontSize(8).fillColor("#f3e8ff")
        .text(opts.subtitle, MX, 36, { width: rightW, align: "right", lineBreak: false });
    }
    this.y = 86;
    if (opts.eyebrow) {
      this.font("semibold").fontSize(8).fillColor(opts.eyebrowColor ?? C.violet)
        .text(opts.eyebrow.toUpperCase(), MX, this.y, { lineBreak: false });
      this.y += 16;
    }
  }

  private footer() {
    const d = this.doc;
    this.font("regular").fontSize(7.5).fillColor(C.muted)
      .text(this.footerLeft, MX, PAGE_H - 38, { width: CW * 0.7, lineBreak: false });
    const right = this.badge ? `${this.badge} · ${PAGE_WORD[this.lang]} ${this.page}` : `${PAGE_WORD[this.lang]} ${this.page}`;
    this.font("semibold").fillColor(this.badge ? this.badgeColor : C.muted)
      .text(right, MX, PAGE_H - 38, { width: CW, align: "right", lineBreak: false });
    d.moveTo(MX, PAGE_H - 46).lineTo(PAGE_W - MX, PAGE_H - 46).lineWidth(0.6).strokeColor(C.track).stroke();
  }

  newPage() {
    this.footer();
    this.doc.addPage();
    this.page += 1;
    this.y = 56;
  }

  /** Salta de página si no caben `h` puntos. */
  ensure(h: number) {
    if (this.y + h > BOTTOM) this.newPage();
  }

  /** Espaciador vertical explícito (para densidad controlada). */
  gap(h: number) {
    this.y += h;
  }

  /**
   * Banda de sección en flujo (densidad): si no caben `need` puntos en la
   * página, abre una nueva con header completo; si caben, dibuja una franja
   * fina con eyebrow + título y una regla. Mantiene las secciones juntas sin
   * dejar páginas medio vacías. Devuelve true si abrió página nueva.
   */
  section(opts: { eyebrow: string; title: string; subtitle?: string; need?: number; headerOnNewPage: { title: string; subtitle?: string } }): boolean {
    const need = opts.need ?? 160;
    if (this.y + need > BOTTOM) {
      this.newPage();
      this.header({ eyebrow: opts.eyebrow, title: opts.headerOnNewPage.title, subtitle: opts.headerOnNewPage.subtitle });
      if (opts.title) this.h2(opts.title);
      return true;
    }
    // franja fina de sección dentro de la misma página
    this.y += 8;
    const d = this.doc;
    d.rect(MX, this.y, 3, 12).fill(C.violet);
    this.font("semibold").fontSize(8).fillColor(C.violet).text(opts.eyebrow.toUpperCase(), MX + 8, this.y + 1, { lineBreak: false });
    this.y += 18;
    if (opts.title) this.h2(opts.title);
    return false;
  }

  h2(text: string) {
    this.ensure(30);
    this.y += 6;
    this.font("semibold").fontSize(13).fillColor(C.violet).text(text, MX, this.y, { width: CW });
    this.y = this.doc.y + 8;
  }

  para(text: string, opts?: { size?: number; color?: string; bold?: boolean }) {
    const size = opts?.size ?? 9;
    this.font(opts?.bold ? "semibold" : "regular").fontSize(size).fillColor(opts?.color ?? C.ink);
    const h = this.doc.heightOfString(text, { width: CW });
    this.ensure(h);
    this.doc.text(text, MX, this.y, { width: CW });
    this.y = this.doc.y + 6;
  }

  note(text: string) {
    this.font("italic").fontSize(7.5).fillColor(C.muted);
    const h = this.doc.heightOfString(text, { width: CW });
    this.ensure(h);
    this.doc.text(text, MX, this.y, { width: CW });
    this.y = this.doc.y + 6;
  }

  bullets(items: string[], opts?: { size?: number }) {
    const size = opts?.size ?? 9;
    for (const it of items) {
      this.font("regular").fontSize(size).fillColor(C.ink);
      const h = this.doc.heightOfString(it, { width: CW - 14 });
      this.ensure(h + 3);
      this.font("bold").fillColor(C.violet).text("•", MX, this.y, { lineBreak: false });
      this.font("regular").fillColor(C.ink).text(it, MX + 14, this.y, { width: CW - 14 });
      this.y = this.doc.y + 4;
    }
    this.y += 4;
  }

  /** Caja de callout (insight/regla/advertencia) con lead opcional en negrita. */
  callout(text: string, opts?: { lead?: string; bg?: string; leadColor?: string }) {
    const d = this.doc;
    const bg = opts?.bg ?? C.violetBg;
    const leadColor = opts?.leadColor ?? C.violetDark;
    const pad = 12;
    const innerW = CW - pad * 2;
    // Mide el alto del bloque completo (lead + texto) al ancho interior.
    this.font("regular").fontSize(8.5);
    const full = opts?.lead ? `${opts.lead} ${text}` : text;
    const textH = d.heightOfString(full, { width: innerW });
    const boxH = textH + pad * 2;
    this.ensure(boxH + 6);
    d.roundedRect(MX, this.y, CW, boxH, 8).fill(bg);
    const tx = MX + pad;
    const ty = this.y + pad;
    if (opts?.lead) {
      // continued:true mantiene el flujo; el width DEBE ir en el primer segmento
      // o pdfkit usa el ancho de página y el texto desborda la caja (bug 2.1).
      this.font("bold").fontSize(8.5).fillColor(leadColor)
        .text(opts.lead + " ", tx, ty, { width: innerW, continued: true });
      this.font("regular").fillColor(C.ink).text(text, { width: innerW });
    } else {
      this.font("regular").fontSize(8.5).fillColor(C.ink).text(text, tx, ty, { width: innerW });
    }
    this.y += boxH + 10;
  }

  quote(text: string) {
    const d = this.doc;
    this.font("italic").fontSize(9.5);
    const innerW = CW - 26;
    const h = d.heightOfString(text, { width: innerW }) + 12;
    this.ensure(h + 6);
    d.rect(MX + 8, this.y, 3, h).fill(C.violet);
    this.font("italic").fontSize(9.5).fillColor(C.ink).text(text, MX + 22, this.y + 6, { width: innerW });
    this.y += h + 8;
  }

  /**
   * Fila con chip a la izquierda (etiqueta tipo "pág. 5") y texto que envuelve
   * a la derecha, dentro de una tarjeta con borde. Para guiones página-por-
   * página. El chip puede pintarse sólido (violeta) o suave (violetBg).
   */
  chipRow(chip: string, text: string, opts?: { soft?: boolean }) {
    const d = this.doc;
    const pad = 10;
    const chipW = 52;
    const textX = MX + pad + chipW + 10;
    const textW = CW - pad - chipW - 10 - pad;
    this.font("regular").fontSize(9);
    const textH = d.heightOfString(text, { width: textW });
    const boxH = Math.max(28, textH + pad * 2);
    this.ensure(boxH + 6);
    const y = this.y;
    d.roundedRect(MX, y, CW, boxH, 8).lineWidth(1).strokeColor(C.track).stroke();
    // chip
    const chipBg = opts?.soft ? C.violetBg : C.violet;
    const chipFg = opts?.soft ? C.violetDark : C.white;
    const chipY = y + boxH / 2 - 8;
    d.roundedRect(MX + pad, chipY, chipW, 16, 8).fill(chipBg);
    this.font("bold").fontSize(8).fillColor(chipFg).text(chip, MX + pad, chipY + 4, { width: chipW, align: "center", lineBreak: false });
    // texto
    this.font("regular").fontSize(9).fillColor(C.ink).text(text, textX, y + pad, { width: textW });
    this.y = y + boxH + 6;
  }

  /** Barra horizontal con pista, relleno por valor y marca de norma punteada. */
  bar(opts: { label: string; value: number; min: number; max: number; norm?: number; color?: string; labelW?: number }) {
    const d = this.doc;
    const labelW = opts.labelW ?? 165;
    const barX = MX + labelW + 8;
    const barW = CW - labelW - 8 - 38;
    const y = this.y;
    const pct = Math.max(0, Math.min(1, (opts.value - opts.min) / (opts.max - opts.min)));
    const color = opts.color ?? (opts.value >= 108 ? C.barHigh : C.barMid);
    this.font("regular").fontSize(8.5).fillColor(C.muted).text(opts.label, MX, y + 1, { width: labelW, lineBreak: false });
    d.roundedRect(barX, y, barW, 7, 3.5).fill(C.track);
    if (pct > 0) d.roundedRect(barX, y, Math.max(7, barW * pct), 7, 3.5).fill(color);
    if (opts.norm !== undefined) {
      const nx = barX + barW * ((opts.norm - opts.min) / (opts.max - opts.min));
      d.moveTo(nx, y - 2).lineTo(nx, y + 9).lineWidth(0.8).dash(2, { space: 2 }).strokeColor("#b9b3d6").stroke().undash();
    }
    this.font("bold").fontSize(8.5).fillColor(C.ink)
      .text(opts.value.toFixed(opts.max <= 5 ? 2 : 0), barX + barW + 6, y + 1, { width: 32, lineBreak: false });
    this.y += 13;
  }

  barsBlock(rows: { label: string; value: number; min: number; max: number; norm?: number; color?: string; labelW?: number }[]) {
    for (const r of rows) {
      this.ensure(13);
      this.bar(r);
    }
    this.y += 6;
  }

  /** Tabla con header violeta. `widths` en fracciones que suman ~1. Soporta
   * celdas multilínea (con `\n` o wrap por ancho): la fila crece a la celda
   * más alta. */
  table(headers: string[], rows: string[][], widths: number[], opts?: { fs?: number; headerColor?: string }) {
    const d = this.doc;
    const fs = opts?.fs ?? 8.5;
    const ws = widths.map((w) => w * CW);
    // header
    this.ensure(20);
    d.roundedRect(MX, this.y, CW, 18, 4).fill(opts?.headerColor ?? C.violet);
    this.font("semibold").fillColor(C.white).fontSize(fs);
    let x = MX;
    headers.forEach((hd, i) => {
      d.text(hd, x + 6, this.y + 5, { width: ws[i] - 12, lineBreak: false });
      x += ws[i];
    });
    this.y += 18;
    rows.forEach((row, r) => {
      // Mide cada celda con la fuente que se usará al dibujarla (col 0 = bold).
      const heights = row.map((cell, i) => {
        this.font(i === 0 ? "bold" : "regular").fontSize(fs);
        return d.heightOfString(String(cell), { width: ws[i] - 12 });
      });
      const rh = Math.max(...heights) + 7;
      this.ensure(rh);
      d.rect(MX, this.y, CW, rh).fill(r % 2 === 0 ? C.white : "#faf8ff");
      x = MX;
      row.forEach((cell, i) => {
        this.font(i === 0 ? "bold" : "regular").fontSize(fs).fillColor(i === 0 ? C.ink : "#444050")
          .text(String(cell), x + 6, this.y + 4, { width: ws[i] - 12 });
        x += ws[i];
      });
      this.y += rh;
    });
    this.y += 10;
  }

  /** Chip de estado coloreado, dibujado en una posición x/y absoluta. */
  stateChip(x: number, y: number, state: string, label: string, w = 86, h = 15) {
    const d = this.doc;
    const c = STATE_COLOR[state] ?? STATE_COLOR.neutral;
    d.roundedRect(x, y, w, h, h / 2).fill(c.bg);
    this.font("bold").fontSize(8).fillColor(c.fg)
      .text(label, x, y + 3.5, { width: w, align: "center", lineBreak: false });
  }

  /** Tarjetas grandes de conteo (las 4 de "lectura general"). */
  countCards(cards: { n: number; label: string; state: string }[]) {
    const d = this.doc;
    const gap = 10;
    const cardW = (CW - (cards.length - 1) * gap) / cards.length;
    this.ensure(70);
    cards.forEach((card, i) => {
      const c = STATE_COLOR[card.state] ?? STATE_COLOR.neutral;
      const x = MX + i * (cardW + gap);
      d.roundedRect(x, this.y, cardW, 60, 8).fill(c.bg);
      this.font("bold").fontSize(24).fillColor(c.fg)
        .text(String(card.n), x, this.y + 10, { width: cardW, align: "center", lineBreak: false });
      this.font("semibold").fontSize(9).fillColor(c.fg)
        .text(card.label, x, this.y + 40, { width: cardW, align: "center", lineBreak: false });
    });
    this.y += 70;
  }

  /** Chip de banda de afinidad (hot/warm/cold) — escala 0-135. */
  bandChip(x: number, y: number, band: "hot" | "warm" | "cold", label: string, w = 88, h = 16) {
    const d = this.doc;
    const color = band === "hot" ? C.violet : band === "warm" ? C.barMid : C.muted;
    d.roundedRect(x, y, w, h, h / 2).fill(color);
    this.font("bold").fontSize(8).fillColor(C.white)
      .text(label, x, y + 4, { width: w, align: "center", lineBreak: false });
  }

  /** Tarjeta de ranking: círculo numerado + nombre + sub + barra 0-135 + score + chip. */
  rankCard(opts: {
    rank: number; name: string; sub: string; value: number; max?: number;
    band: "hot" | "warm" | "cold"; bandLabel: string;
  }) {
    const d = this.doc;
    const max = opts.max ?? 135;
    const h = 42;
    this.ensure(h + 4);
    const y = this.y;
    d.roundedRect(MX, y, CW, h, 8).lineWidth(1).strokeColor(C.track).stroke();
    const circleColor = opts.rank === 1 ? C.violet : opts.rank === 2 ? C.violetDark : C.muted;
    d.circle(MX + 20, y + 21, 10).fill(circleColor);
    this.font("bold").fontSize(10).fillColor(C.white)
      .text(String(opts.rank), MX + 10, y + 17, { width: 20, align: "center", lineBreak: false });
    // Nombre y sub se acotan para no pisar el score/chip de la derecha.
    const leftW = PAGE_W - MX - 160 - (MX + 40);
    this.font("bold").fontSize(10.5).fillColor(C.ink).text(opts.name, MX + 40, y + 8, { width: leftW, lineBreak: false, ellipsis: true });
    this.font("regular").fontSize(7.5).fillColor(C.muted).text(opts.sub, MX + 40, y + 22, { width: 280, lineBreak: false, ellipsis: true });
    // barra
    const barX = MX + 40, barW = 280, barY = y + 32;
    const pct = Math.max(0.02, Math.min(1, opts.value / max));
    d.roundedRect(barX, barY, barW, 6, 3).fill(C.track);
    d.roundedRect(barX, barY, barW * pct, 6, 3).fill(opts.band === "hot" ? C.violet : opts.band === "warm" ? C.barMid : C.muted);
    // score
    this.font("bold").fontSize(14).fillColor(C.violetDark)
      .text(String(opts.value), PAGE_W - MX - 150, y + 12, { width: 60, align: "right", lineBreak: false });
    this.font("regular").fontSize(7).fillColor(C.muted).text(`/ ${max}`, PAGE_W - MX - 150, y + 27, { width: 60, align: "right", lineBreak: false });
    this.bandChip(PAGE_W - MX - 92, y + 13, opts.band, opts.bandLabel);
    this.y += h + 6;
  }

  // ════════════════════════════════════════════════════════════════════
  // HELPERS A COORDENADAS ABSOLUTAS (Reporte Full de Hiring) — portados de
  // reportlab. NO usan this.y/ensure/section; cada uno pinta en (x, top)
  // absolutos (top = distancia desde arriba). Coexisten con el flujo del kit.
  // ════════════════════════════════════════════════════════════════════

  /** c.drawString(x, y, s) — texto desde arriba-izquierda, sin salto de línea. */
  absText(s: string, x: number, top: number, opts?: { width?: number; align?: "left" | "center" | "right" }) {
    this.doc.text(s, x, top, { lineBreak: false, width: opts?.width, align: opts?.align });
  }
  /** c.drawCentredString(cx, y, s) — centrado en cx con un box [cx-half, cx+half]. */
  absCentred(s: string, cx: number, top: number, halfSpan = 200) {
    this.doc.text(s, cx - halfSpan, top, { lineBreak: false, width: halfSpan * 2, align: "center" });
  }
  /** c.drawRightString(xr, y, s) — alinea el borde derecho del texto en xr. */
  absRight(s: string, xr: number, top: number, span = 300) {
    this.doc.text(s, xr - span, top, { lineBreak: false, width: span, align: "right" });
  }

  /**
   * Franja violeta SÓLIDA de 92px con óvalo violetDark arriba-derecha + marca
   * "rowi"/tagline a la izquierda y eyebrow(#a78bfa)/título/subtítulo a la
   * derecha. Réplica del header() de generate.py (franja H-92, no el gradiente
   * de 64px del header() del flujo). INCREMENTA el contador de página (espejo
   * exacto del Python, que numera dentro de header()).
   */
  headerAbs(opts: { title: string; subtitle?: string; section?: string }) {
    const d = this.doc;
    this.page += 1;
    const HH = 92;
    d.rect(0, 0, PAGE_W, HH).fill(C.violet);
    d.save();
    // Óvalo decorativo: en el Python (reportlab, Y desde abajo) el centro está
    // a 30px del TOPE de la página → en pdfkit top=30 (NO HH-30, que lo bajaba
    // hasta y=132 invadiendo el cuerpo).
    d.circle(PAGE_W - 60, 30, 70).fill(C.violetDark);
    d.restore();
    // marca "rowi" (bold 26). Python baseline H-48 → ~18 top de glifo.
    this.font("bold").fontSize(26).fillColor(C.white);
    this.absText("rowi", MX, 18);
    // tagline (regular 9), baseline H-62 → ~52 top
    this.font("regular").fontSize(9).fillColor(C.white);
    this.absText(HEADER_TAGLINE[this.lang], MX, 52);
    // eyebrow (#a78bfa bold 8), baseline H-26 → ~22 top
    if (opts.section) {
      this.font("bold").fontSize(8).fillColor("#a78bfa");
      this.absRight(opts.section, PAGE_W - MX, 22, CW);
    }
    // título (bold 15), baseline H-44 → ~33 top
    this.font("bold").fontSize(15).fillColor(C.white);
    this.absRight(opts.title, PAGE_W - MX, 33, CW);
    // subtítulo (regular 9.5), baseline H-60 → ~52 top
    if (opts.subtitle) {
      this.font("regular").fontSize(9.5).fillColor(C.white);
      this.absRight(opts.subtitle, PAGE_W - MX, 52, CW);
    }
  }

  /**
   * Pie fijo: foot gris a la izquierda + "Generado el <fecha> · pág. N" a la
   * derecha (usa this.page) + línea track. NO toca el contador de página.
   */
  footerAbs(opts: { foot: string; genLeft?: string }) {
    const d = this.doc;
    const baseTop = PAGE_H - 28 - 8; // baseline 28 desde abajo, glifo 8px → top
    this.font("regular").fontSize(8).fillColor(C.muted);
    this.absText(opts.foot, MX, baseTop, { width: CW * 0.72 });
    const gen = opts.genLeft ?? `${FOOTER_GEN[this.lang]} ${FOOTER_DATE}`;
    const right = `${gen} · ${PAGE_WORD_HIRING[this.lang]} ${this.page}`;
    this.font("regular").fontSize(8).fillColor(C.muted);
    this.absRight(right, PAGE_W - MX, baseTop, CW);
    d.save();
    d.moveTo(MX, PAGE_H - 40).lineTo(PAGE_W - MX, PAGE_H - 40).lineWidth(1).strokeColor(C.track).stroke();
    d.restore();
  }

  /** Chip redondeado con color por banda y texto blanco centrado. Auto-label
   * por idioma si no se pasa `label` (port de band_chip de generate.py). */
  bandChipAbs(x: number, top: number, band: "hot" | "warm" | "cold", w = 86, h = 16, label?: string) {
    const d = this.doc;
    const color = band === "hot" ? C.violet : band === "warm" ? HIRING_WARM : HIRING_COLD;
    d.roundedRect(x, top, w, h, h / 2).fill(color);
    const lbl = label ?? BAND_CHIP_LABEL[band][this.lang] ?? BAND_CHIP_LABEL[band].es;
    this.font("bold").fontSize(8).fillColor(C.white);
    this.doc.text(lbl, x, top + h / 2 - 4, { width: w, align: "center", lineBreak: false });
  }

  /** Pista track + relleno por valor (0..maxv) + marcas blancas verticales. */
  scoreBarAbs(x: number, top: number, w: number, h: number, value: number, opts?: { maxv?: number; col?: string; marks?: number[] }) {
    const d = this.doc;
    const maxv = opts?.maxv ?? 135;
    const col = opts?.col ?? C.violet;
    const marks = opts?.marks ?? [92, 108];
    d.roundedRect(x, top, w, h, h / 2).fill(C.track);
    const fillW = Math.max(h, (w * Math.min(value, maxv)) / maxv);
    d.roundedRect(x, top, fillW, h, h / 2).fill(col);
    d.save();
    for (const m of marks) {
      const mx = x + (w * m) / maxv;
      d.moveTo(mx, top).lineTo(mx, top + h).lineWidth(1).strokeColor(C.white).stroke();
    }
    d.restore();
  }

  /** Barra percentil 0-100 con marcas blancas en 25/50/75/90 y color por umbral. */
  pctBarAbs(x: number, top: number, w: number, h: number, p: number) {
    const d = this.doc;
    d.roundedRect(x, top, w, h, h / 2).fill(C.track);
    const col = p >= 90 ? C.violet : p >= 70 ? GREEN : p >= 40 ? HIRING_WARM : HIRING_COLD;
    d.roundedRect(x, top, Math.max(h, (w * p) / 100), h, h / 2).fill(col);
    d.save();
    for (const m of [25, 50, 75, 90]) {
      const mx = x + (w * m) / 100;
      d.moveTo(mx, top).lineTo(mx, top + h).lineWidth(1).strokeColor(C.white).stroke();
    }
    d.restore();
  }

  /** Barra 60-135 con DOBLE marca: gris (#9ca3af) en popMark, verde (greenDark)
   * en topMark. Relleno color por umbral (>=top violet / >=pop warm / else cold). */
  compBarAbs(x: number, top: number, w: number, h: number, value: number, popMark: number, topMark: number) {
    const d = this.doc;
    const sc = (v: number) => x + (w * (Math.max(60, Math.min(135, v)) - 60)) / 75;
    d.roundedRect(x, top, w, h, h / 2).fill(C.track);
    const col = value >= topMark ? C.violet : value >= popMark ? HIRING_WARM : HIRING_COLD;
    d.roundedRect(x, top, Math.max(h, sc(value) - x), h, h / 2).fill(col);
    d.save();
    d.moveTo(sc(popMark), top - 2.5).lineTo(sc(popMark), top + h + 2.5).lineWidth(1.4).strokeColor("#9ca3af").stroke();
    d.moveTo(sc(topMark), top - 2.5).lineTo(sc(topMark), top + h + 2.5).lineWidth(1.6).strokeColor(C.greenDark).stroke();
    d.restore();
  }

  /** Chips que ENVUELVEN en filas de 15px. Devuelve la Y (top) de la última
   * fila dibujada (mismo punto que el `cy` que devolvía chips() en Python). */
  chipsAbs(x: number, top: number, words: string[], maxw: number, opts?: { fill?: string; txt?: string; fs?: number }): number {
    const d = this.doc;
    const fill = opts?.fill ?? C.violetBg;
    const txt = opts?.txt ?? C.violetDark;
    const fs = opts?.fs ?? 8;
    let cx = x;
    let cy = top;
    this.font("regular").fontSize(fs);
    for (const wd of words) {
      const tw = this.doc.widthOfString(wd) + 12;
      if (cx + tw > x + maxw) {
        cx = x;
        cy += 15;
      }
      d.roundedRect(cx, cy, tw, 13, 6.5).fill(fill);
      this.font("regular").fontSize(fs).fillColor(txt);
      this.absText(wd, cx + 6, cy + 3);
      cx += tw + 5;
    }
    return cy;
  }

  /** Caja VIOLETA con título blanco bold + líneas blancas. `top` = borde
   * superior. Devuelve el bottom (top + h). */
  lecturaAbs(x: number, top: number, w: number, lines: string[], title: string): number {
    const d = this.doc;
    const h = 26 + lines.length * 13 + 10;
    d.roundedRect(x, top, w, h, 10).fill(C.violet);
    this.font("bold").fontSize(11.5).fillColor(C.white);
    this.absText(title, x + 16, top + 10);
    this.font("regular").fontSize(9.5).fillColor(C.white);
    lines.forEach((l, j) => {
      this.absText(l, x + 16, top + 28 + j * 13);
    });
    return top + h;
  }

  /** Punto verde (#10b981) — marca de mayor afinidad del contexto. (cx, top) = centro. */
  greenDot(cx: number, top: number, r = 3.5) {
    this.doc.save();
    this.doc.circle(cx, top, r).fill(GREEN);
    this.doc.restore();
  }

  /** Cierra el documento y devuelve el Buffer. */
  /** Cierra el documento. Por defecto pinta el footer de flujo en la última
   * página; los generadores que ya dibujan su propio footer por página (p.ej.
   * el reporte rico de hiring con footerAbs) pasan skipFooter:true para no
   * duplicarlo. */
  finish(opts?: { skipFooter?: boolean }): Promise<Buffer> {
    if (!opts?.skipFooter) this.footer();
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      this.doc.on("data", (c: Buffer) => chunks.push(c));
      this.doc.on("end", () => resolve(Buffer.concat(chunks)));
      this.doc.on("error", reject);
      this.doc.end();
    });
  }
}
