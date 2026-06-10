/**
 * 🧠 Motor de reglas de diagnóstico — EQ Proposal Accelerator (fases 2-5).
 *
 * Codifica EXPLÍCITAMENTE las reglas del blueprint (reglas claras y auditables,
 * no caja negra). A partir de métricas agregadas (TVS de equipo + SEI individual)
 * produce INSIGHTS etiquetados con su audiencia (cliente/partner) y honestidad
 * (n pequeño, DE alta, confianza).
 *
 * Umbrales del blueprint: norma=100, DE≈15. bajo<96, alto>104, DE alta>14.
 * Correlaciones direccionales si n<30 (nunca causal). Segmentación raíz: lo
 * agregado es del proyecto (cliente); lo individual es de la persona (partner).
 */

export const NORM = 100;
export const LOW = 96;
export const HIGH = 104;
export const HIGH_DISPERSION = 14;
export const SMALL_N = 30;

export type Audience = "client" | "partner";
export type InsightKind =
  | "strength" // sobre norma
  | "gap" // bajo norma
  | "dispersion" // DE alta = desacuerdo interno
  | "iceberg" // superficie (TVS) oculta motor (SEI)
  | "wellbeing" // señal de bienestar — cuidado humano
  | "chain"; // cadena EQ→clima→desempeño

export interface Metric {
  key: string;
  label: string;
  mean: number;
  sd?: number | null;
  n?: number | null;
}

export interface Insight {
  kind: InsightKind;
  /** "team" (TVS, agregado) | "individual" (SEI) */
  layer: "team" | "individual";
  audience: Audience;
  /** ¿este insight toca el SEI individual? (gatea privacidad) */
  touchesSei: boolean;
  metricKey: string;
  label: string;
  value: number;
  vsNorm: number; // value - 100
  /** texto de lectura, en lenguaje consultivo neutro */
  reading: string;
  /** honestidad: marcas automáticas */
  flags: {
    smallN: boolean;
    highDispersion: boolean;
    isWellbeing: boolean;
  };
}

// Métricas SEI que son señales de BIENESTAR → cuidado humano, no diagnóstico.
const WELLBEING_KEYS = new Set(["NE", "OP", "balance", "wellbeing", "health", "Health", "Balance", "Wellbeing"]);

function band(value: number): "low" | "high" | "mid" {
  if (value < LOW) return "low";
  if (value > HIGH) return "high";
  return "mid";
}

/**
 * Lee una capa de métricas (equipo o individual) y emite insights.
 * @param layer "team" para TVS (agregado→cliente), "individual" para SEI (→partner).
 */
export function readLayer(metrics: Metric[], layer: "team" | "individual"): Insight[] {
  const insights: Insight[] = [];

  for (const m of metrics) {
    const b = band(m.mean);
    const smallN = typeof m.n === "number" && m.n < SMALL_N;
    const highDispersion = typeof m.sd === "number" && m.sd > HIGH_DISPERSION;
    const isWellbeing = WELLBEING_KEYS.has(m.key);

    // Segmentación raíz: equipo/agregado → cliente; individual/SEI → partner.
    const audience: Audience = layer === "team" ? "client" : "partner";
    const touchesSei = layer === "individual";

    if (b === "high") {
      insights.push(mk("strength", layer, audience, touchesSei, m,
        `${m.label} sobre la norma (${m.mean.toFixed(1)} vs 100): fortaleza ${layer === "team" ? "del clima" : "de capacidad"}.`,
        { smallN, highDispersion, isWellbeing }));
    } else if (b === "low") {
      const kind: InsightKind = isWellbeing ? "wellbeing" : "gap";
      const reading = isWellbeing
        ? `${m.label} bajo la norma (${m.mean.toFixed(1)}): señal de bienestar — tratar como conversación humana, no diagnóstico.`
        : `${m.label} bajo la norma (${m.mean.toFixed(1)} vs 100): brecha a trabajar.`;
      insights.push(mk(kind, layer, audience, touchesSei, m, reading,
        { smallN, highDispersion, isWellbeing }));
    }

    // Dispersión alta = desacuerdo interno (el promedio dice "qué", la DE "a quién").
    if (highDispersion) {
      insights.push(mk("dispersion", layer, audience, touchesSei, m,
        `${m.label}: dispersión alta (DE ${m.sd!.toFixed(1)}) — hay desacuerdo interno; la intervención difiere de un promedio bajo.`,
        { smallN, highDispersion: true, isWellbeing }));
    }
  }

  return insights;
}

function mk(
  kind: InsightKind,
  layer: "team" | "individual",
  audience: Audience,
  touchesSei: boolean,
  m: Metric,
  reading: string,
  flags: Insight["flags"],
): Insight {
  return {
    kind,
    layer,
    audience,
    touchesSei,
    metricKey: m.key,
    label: m.label,
    value: m.mean,
    vsNorm: Math.round((m.mean - NORM) * 10) / 10,
    reading,
    flags,
  };
}

/**
 * Lectura ICEBERG: cruza superficie (clima TVS alto) con motor (capacidad SEI
 * baja en la misma área). Si el clima se ve bien pero el motor está en reserva,
 * emite el insight de iceberg (es para el partner — toca el SEI).
 */
export function readIceberg(teamMetrics: Metric[], individualMetrics: Metric[]): Insight[] {
  const out: Insight[] = [];
  const teamAvg = avg(teamMetrics.map((m) => m.mean));
  const indivLow = individualMetrics.filter((m) => m.mean < LOW);
  if (teamAvg >= NORM && indivLow.length > 0) {
    out.push({
      kind: "iceberg",
      layer: "individual",
      audience: "partner",
      touchesSei: true,
      metricKey: "__iceberg__",
      label: "Iceberg",
      value: teamAvg,
      vsNorm: Math.round((teamAvg - NORM) * 10) / 10,
      reading:
        `El clima de equipo se lee sólido (≈${teamAvg.toFixed(0)}) pero el motor individual está en reserva en: ` +
        indivLow.map((m) => m.label).join(", ") +
        ". Leer las dos capas juntas; la fortaleza visible puede ocultar fragilidad.",
      flags: { smallN: false, highDispersion: false, isWellbeing: false },
    });
  }
  return out;
}

function avg(xs: number[]): number {
  const v = xs.filter((x) => Number.isFinite(x));
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
}

/** Separa insights en las dos canastas del blueprint. */
export function segment(insights: Insight[]): {
  client: Insight[]; // agregado, va a la propuesta oficial
  partner: Insight[]; // individual/sensible, solo guía confidencial
} {
  return {
    client: insights.filter((i) => i.audience === "client" && !i.touchesSei),
    partner: insights.filter((i) => i.audience === "partner" || i.touchesSei),
  };
}
