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

  /** Cierra el documento y devuelve el Buffer. */
  finish(): Promise<Buffer> {
    this.footer();
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      this.doc.on("data", (c: Buffer) => chunks.push(c));
      this.doc.on("end", () => resolve(Buffer.concat(chunks)));
      this.doc.on("error", reject);
      this.doc.end();
    });
  }
}
