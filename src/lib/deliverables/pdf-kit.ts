/**
 * 🎨 Kit gráfico Rowi para PDF (server-side, pdfkit) — primitivas compartidas.
 *
 * Es la línea gráfica ÚNICA de todos los entregables del producto (Perfil
 * Integral, Guía Confidencial, Reporte Full de Hiring, etc.). Clona el estilo
 * de los entregables ya validados (perfil Carolina / guías confidenciales):
 * franja violeta + búho, barras 70–130 con marca de norma, tablas con header
 * violeta, cajas de callout, chips de estado.
 *
 * No sabe NADA de SEI/VS/afinidad: solo dibuja. Cada generador concreto
 * (deliverables/*.ts) compone estas primitivas con sus datos.
 *
 * pdfkit usa fuentes base (Helvetica) → solo caracteres WinAnsi. Evita flechas
 * unicode (↔ → ←) en texto renderizado; usa "<->", "->" en su lugar.
 */
import PDFDocument from "pdfkit";

export type Doc = InstanceType<typeof PDFDocument>;

// ─────────────────────────── Paleta Rowi ───────────────────────────
export const C = {
  violet: "#7c3aed",
  violetDark: "#5b21b6",
  violetBg: "#f3eefe",
  ink: "#1f2937",
  muted: "#6b7280",
  track: "#e9e4f5",
  white: "#ffffff",
  blue: "#31a2e3",
  pink: "#f378a5",
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

/**
 * Documento Rowi: envuelve pdfkit con el cursor, header/footer y el óvalo del
 * búho opcional. Lleva el estado de paginación.
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

  constructor(opts: { lang: Lang; footerLeft: string; badge?: string; badgeColor?: string; owl?: Buffer }) {
    this.doc = new PDFDocument({ size: "A4", margin: 0, bufferPages: true });
    this.lang = opts.lang;
    this.footerLeft = opts.footerLeft;
    this.badge = opts.badge ?? "";
    this.badgeColor = opts.badgeColor ?? C.violet;
    this.owl = opts.owl;
  }

  /** Franja violeta + marca + (opcional) búho + título/subtítulo de sección. */
  header(opts: { eyebrow?: string; eyebrowColor?: string; title: string; subtitle?: string }) {
    const d = this.doc;
    d.rect(0, 0, PAGE_W, 64).fill(C.violet);
    if (this.owl) {
      try { d.image(this.owl, PAGE_W - MX - 46, 9, { fit: [46, 46] }); } catch { /* búho opcional */ }
    }
    d.fillColor(C.white).font("Helvetica-Bold").fontSize(20).text("rowi", MX, 16, { lineBreak: false });
    d.font("Helvetica").fontSize(7).text(TAGLINE[this.lang], MX, 40, { lineBreak: false });
    const rightW = CW - 56; // deja sitio al búho
    d.font("Helvetica-Bold").fontSize(12).fillColor(C.white)
      .text(opts.title, MX, 16, { width: rightW, align: "right", lineBreak: false });
    if (opts.subtitle) {
      d.font("Helvetica").fontSize(8).fillColor("#e9d5ff")
        .text(opts.subtitle, MX, 36, { width: rightW, align: "right", lineBreak: false });
    }
    this.y = 86;
    if (opts.eyebrow) {
      d.font("Helvetica-Bold").fontSize(8).fillColor(opts.eyebrowColor ?? C.violet)
        .text(opts.eyebrow.toUpperCase(), MX, this.y, { lineBreak: false });
      this.y += 16;
    }
  }

  private footer() {
    const d = this.doc;
    d.fontSize(7.5).fillColor(C.muted).font("Helvetica")
      .text(this.footerLeft, MX, PAGE_H - 38, { width: CW * 0.7, lineBreak: false });
    const right = this.badge ? `${this.badge} · ${PAGE_WORD[this.lang]} ${this.page}` : `${PAGE_WORD[this.lang]} ${this.page}`;
    d.fillColor(this.badge ? this.badgeColor : C.muted).font("Helvetica-Bold")
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

  h2(text: string) {
    this.ensure(30);
    this.y += 6;
    this.doc.font("Helvetica-Bold").fontSize(13).fillColor(C.violet).text(text, MX, this.y, { width: CW });
    this.y = this.doc.y + 8;
  }

  para(text: string, opts?: { size?: number; color?: string; bold?: boolean }) {
    const size = opts?.size ?? 9;
    this.doc.font(opts?.bold ? "Helvetica-Bold" : "Helvetica").fontSize(size).fillColor(opts?.color ?? C.ink);
    const h = this.doc.heightOfString(text, { width: CW });
    this.ensure(h);
    this.doc.text(text, MX, this.y, { width: CW });
    this.y = this.doc.y + 6;
  }

  note(text: string) {
    this.doc.font("Helvetica-Oblique").fontSize(7.5).fillColor(C.muted);
    const h = this.doc.heightOfString(text, { width: CW });
    this.ensure(h);
    this.doc.text(text, MX, this.y, { width: CW });
    this.y = this.doc.y + 6;
  }

  bullets(items: string[], opts?: { size?: number }) {
    const size = opts?.size ?? 9;
    for (const it of items) {
      this.doc.font("Helvetica").fontSize(size).fillColor(C.ink);
      const h = this.doc.heightOfString(it, { width: CW - 14 });
      this.ensure(h + 3);
      this.doc.fillColor(C.violet).font("Helvetica-Bold").text("•", MX, this.y, { lineBreak: false });
      this.doc.fillColor(C.ink).font("Helvetica").text(it, MX + 14, this.y, { width: CW - 14 });
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
    d.font("Helvetica").fontSize(8.5);
    const full = opts?.lead ? `${opts.lead} ${text}` : text;
    const textH = d.heightOfString(full, { width: innerW });
    const boxH = textH + pad * 2;
    this.ensure(boxH + 6);
    d.roundedRect(MX, this.y, CW, boxH, 8).fill(bg);
    const tx = MX + pad;
    const ty = this.y + pad;
    if (opts?.lead) {
      d.font("Helvetica-Bold").fontSize(8.5).fillColor(leadColor).text(opts.lead + " ", tx, ty, { continued: true });
      d.font("Helvetica").fillColor(C.ink).text(text, { width: innerW });
    } else {
      d.font("Helvetica").fontSize(8.5).fillColor(C.ink).text(text, tx, ty, { width: innerW });
    }
    this.y += boxH + 10;
  }

  quote(text: string) {
    const d = this.doc;
    d.font("Helvetica-Oblique").fontSize(9.5);
    const innerW = CW - 26;
    const h = d.heightOfString(text, { width: innerW }) + 12;
    this.ensure(h + 6);
    d.rect(MX + 8, this.y, 3, h).fill(C.violet);
    d.font("Helvetica-Oblique").fontSize(9.5).fillColor(C.ink).text(text, MX + 22, this.y + 6, { width: innerW });
    this.y += h + 8;
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
    d.font("Helvetica").fontSize(8.5).fillColor(C.muted).text(opts.label, MX, y + 1, { width: labelW, lineBreak: false });
    d.roundedRect(barX, y, barW, 7, 3.5).fill(C.track);
    if (pct > 0) d.roundedRect(barX, y, Math.max(7, barW * pct), 7, 3.5).fill(color);
    if (opts.norm !== undefined) {
      const nx = barX + barW * ((opts.norm - opts.min) / (opts.max - opts.min));
      d.moveTo(nx, y - 2).lineTo(nx, y + 9).lineWidth(0.8).dash(2, { space: 2 }).strokeColor("#b9b3d6").stroke().undash();
    }
    d.font("Helvetica-Bold").fontSize(8.5).fillColor(C.ink)
      .text(opts.value.toFixed(opts.max <= 5 ? 2 : 0), barX + barW + 6, y + 1, { width: 32, lineBreak: false });
    this.y += 13;
  }

  barsBlock(rows: { label: string; value: number; min: number; max: number; norm?: number; color?: string }[]) {
    for (const r of rows) {
      this.ensure(13);
      this.bar(r);
    }
    this.y += 6;
  }

  /** Tabla con header violeta. `widths` en fracciones que suman ~1. */
  table(headers: string[], rows: string[][], widths: number[], opts?: { fs?: number; headerColor?: string }) {
    const d = this.doc;
    const fs = opts?.fs ?? 8.5;
    const ws = widths.map((w) => w * CW);
    // header
    this.ensure(20);
    d.roundedRect(MX, this.y, CW, 18, 4).fill(opts?.headerColor ?? C.violet);
    d.fillColor(C.white).font("Helvetica-Bold").fontSize(fs);
    let x = MX;
    headers.forEach((hd, i) => {
      d.text(hd, x + 6, this.y + 5, { width: ws[i] - 12, lineBreak: false });
      x += ws[i];
    });
    this.y += 18;
    rows.forEach((row, r) => {
      const cells = row.map((cell, i) => {
        d.font("Helvetica").fontSize(fs);
        return { lines: d.heightOfString(String(cell), { width: ws[i] - 12 }), text: String(cell) };
      });
      const rh = Math.max(...cells.map((c) => c.lines)) + 7;
      this.ensure(rh);
      d.rect(MX, this.y, CW, rh).fill(r % 2 === 0 ? C.white : "#faf8ff");
      x = MX;
      row.forEach((cell, i) => {
        d.fillColor(i === 0 ? C.ink : "#444050").font(i === 0 ? "Helvetica-Bold" : "Helvetica").fontSize(fs)
          .text(String(cell), x + 6, this.y + 4, { width: ws[i] - 12 });
        x += ws[i];
      });
      this.y += rh;
    });
    this.y += 10;
  }

  /** Chip de estado coloreado, devuelto a una posición x/y absoluta. */
  stateChip(x: number, y: number, state: string, label: string, w = 86, h = 15) {
    const d = this.doc;
    const c = STATE_COLOR[state] ?? STATE_COLOR.neutral;
    d.roundedRect(x, y, w, h, h / 2).fill(c.bg);
    d.font("Helvetica-Bold").fontSize(8).fillColor(c.fg)
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
      d.font("Helvetica-Bold").fontSize(24).fillColor(c.fg)
        .text(String(card.n), x, this.y + 10, { width: cardW, align: "center", lineBreak: false });
      d.font("Helvetica-Bold").fontSize(9).fillColor(c.fg)
        .text(card.label, x, this.y + 40, { width: cardW, align: "center", lineBreak: false });
    });
    this.y += 70;
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
