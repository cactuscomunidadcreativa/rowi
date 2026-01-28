/**
 * 📐 Math utilities — usadas en métricas de crecimiento y afinidad
 * ------------------------------------------------------------
 * Exporta: N, clamp, avg, stddev
 */

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** 🧮 Promedio simple */
export function avg(values: number[]): number {
  if (!values || values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** 📊 Desviación estándar */
export function stddev(values: number[]): number {
  if (!values || values.length === 0) return 0;
  const mean = avg(values);
  const variance = avg(values.map(v => (v - mean) ** 2));
  return Math.sqrt(variance);
}

/** 📈 Normaliza un valor en rango 0–100 */
export function N(value: number, min = 0, max = 100): number {
  if (max === min) return 0;
  return ((value - min) / (max - min)) * 100;
}

// ✅ Exportación agrupada (si se usa import default)
export default { clamp, avg, stddev, N };