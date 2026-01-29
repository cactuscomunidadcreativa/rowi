/**
 * 📊 BENCHMARK STATISTICS
 * Funciones para cálculos estadísticos del motor de inteligencia comparativa
 */

// =========================================================
// 📈 TIPOS Y CONSTANTES
// =========================================================

export const MIN_SAMPLE_SIZE = 30; // Mínimo para validez estadística

export interface StatResult {
  n: number;
  mean: number | null;
  median: number | null;
  stdDev: number | null;
  min: number | null;
  max: number | null;
  p10: number | null;
  p25: number | null;
  p50: number | null;
  p75: number | null;
  p90: number | null;
  p95: number | null;
}

export interface CorrelationResult {
  correlation: number;
  pValue: number | null;
  n: number;
  strength: "strong" | "moderate" | "weak" | "none";
  direction: "positive" | "negative" | "none";
}

// =========================================================
// 📐 FUNCIONES ESTADÍSTICAS BÁSICAS
// =========================================================

/**
 * Calcula la media aritmética
 */
export function mean(values: number[]): number | null {
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Calcula la mediana
 */
export function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Calcula la desviación estándar (muestral)
 */
export function stdDev(values: number[]): number | null {
  if (values.length < 2) return null;
  const m = mean(values);
  if (m === null) return null;
  const squaredDiffs = values.map((v) => Math.pow(v - m, 2));
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / (values.length - 1));
}

/**
 * Calcula un percentil específico
 */
export function percentile(values: number[], p: number): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  const weight = index - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

/**
 * Calcula todas las estadísticas para un conjunto de valores
 */
export function calculateStats(values: number[]): StatResult {
  const validValues = values.filter((v) => v !== null && v !== undefined && !isNaN(v));

  return {
    n: validValues.length,
    mean: mean(validValues),
    median: median(validValues),
    stdDev: stdDev(validValues),
    min: validValues.length ? Math.min(...validValues) : null,
    max: validValues.length ? Math.max(...validValues) : null,
    p10: percentile(validValues, 10),
    p25: percentile(validValues, 25),
    p50: percentile(validValues, 50),
    p75: percentile(validValues, 75),
    p90: percentile(validValues, 90),
    p95: percentile(validValues, 95),
  };
}

// =========================================================
// 🔗 CORRELACIÓN DE PEARSON
// =========================================================

/**
 * Calcula el coeficiente de correlación de Pearson entre dos variables
 */
export function pearsonCorrelation(x: number[], y: number[]): CorrelationResult {
  // Filtrar pares con valores válidos
  const pairs: [number, number][] = [];
  for (let i = 0; i < Math.min(x.length, y.length); i++) {
    if (
      x[i] !== null &&
      x[i] !== undefined &&
      !isNaN(x[i]) &&
      y[i] !== null &&
      y[i] !== undefined &&
      !isNaN(y[i])
    ) {
      pairs.push([x[i], y[i]]);
    }
  }

  const n = pairs.length;
  if (n < 3) {
    return { correlation: 0, pValue: null, n, strength: "none", direction: "none" };
  }

  const xVals = pairs.map((p) => p[0]);
  const yVals = pairs.map((p) => p[1]);

  const xMean = mean(xVals)!;
  const yMean = mean(yVals)!;

  let numerator = 0;
  let xSumSq = 0;
  let ySumSq = 0;

  for (let i = 0; i < n; i++) {
    const xDiff = xVals[i] - xMean;
    const yDiff = yVals[i] - yMean;
    numerator += xDiff * yDiff;
    xSumSq += xDiff * xDiff;
    ySumSq += yDiff * yDiff;
  }

  const denominator = Math.sqrt(xSumSq * ySumSq);
  if (denominator === 0) {
    return { correlation: 0, pValue: null, n, strength: "none", direction: "none" };
  }

  const r = numerator / denominator;

  // Calcular p-value usando aproximación t
  const tStat = r * Math.sqrt((n - 2) / (1 - r * r));
  const pValue = twoTailedTTest(tStat, n - 2);

  // Clasificar fuerza y dirección
  const absR = Math.abs(r);
  let strength: CorrelationResult["strength"];
  if (absR >= 0.7) strength = "strong";
  else if (absR >= 0.4) strength = "moderate";
  else if (absR >= 0.2) strength = "weak";
  else strength = "none";

  let direction: CorrelationResult["direction"];
  if (r > 0.1) direction = "positive";
  else if (r < -0.1) direction = "negative";
  else direction = "none";

  return { correlation: r, pValue, n, strength, direction };
}

/**
 * Aproximación del p-value para test t de dos colas
 */
function twoTailedTTest(t: number, df: number): number {
  // Aproximación usando la distribución t
  const x = df / (df + t * t);
  const p = 0.5 * incompleteBeta(df / 2, 0.5, x);
  return Math.min(2 * p, 1);
}

/**
 * Función beta incompleta (aproximación)
 */
function incompleteBeta(a: number, b: number, x: number): number {
  // Aproximación simple para p-values
  if (x === 0) return 0;
  if (x === 1) return 1;

  // Usar aproximación de continuación de fracción
  const maxIterations = 100;
  const epsilon = 1e-10;

  let bt = Math.exp(
    logGamma(a + b) -
      logGamma(a) -
      logGamma(b) +
      a * Math.log(x) +
      b * Math.log(1 - x)
  );

  if (x < (a + 1) / (a + b + 2)) {
    return (bt * betacf(a, b, x, maxIterations, epsilon)) / a;
  } else {
    return 1 - (bt * betacf(b, a, 1 - x, maxIterations, epsilon)) / b;
  }
}

/**
 * Aproximación de log-gamma
 */
function logGamma(z: number): number {
  const c = [
    76.18009172947146, -86.50532032941677, 24.01409824083091,
    -1.231739572450155, 0.001208650973866179, -0.000005395239384953,
  ];

  let x = z;
  let y = z;
  let tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (let j = 0; j < 6; j++) {
    ser += c[j] / ++y;
  }
  return -tmp + Math.log((2.5066282746310005 * ser) / x);
}

/**
 * Continuación de fracción para beta incompleta
 */
function betacf(
  a: number,
  b: number,
  x: number,
  maxIter: number,
  eps: number
): number {
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < 1e-30) d = 1e-30;
  d = 1 / d;
  let h = d;

  for (let m = 1; m <= maxIter; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1 + aa / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1 + aa / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < eps) break;
  }
  return h;
}

// =========================================================
// 📊 FUNCIONES DE AGRUPACIÓN Y FILTRADO
// =========================================================

export interface DataPointFilters {
  country?: string | null;
  region?: string | null;
  sector?: string | null;
  jobRole?: string | null;
  jobFunction?: string | null;
  ageRange?: string | null;
  gender?: string | null;
  education?: string | null;
  tenantId?: string | null;
  hubId?: string | null;
  teamId?: string | null;
  communityId?: string | null;
}

/**
 * Extrae valores de una métrica específica de un array de data points
 */
export function extractMetricValues(
  dataPoints: any[],
  metricKey: string
): number[] {
  return dataPoints
    .map((dp) => dp[metricKey])
    .filter((v) => v !== null && v !== undefined && !isNaN(v));
}

/**
 * Filtra data points según criterios
 */
export function filterDataPoints(
  dataPoints: any[],
  filters: DataPointFilters
): any[] {
  return dataPoints.filter((dp) => {
    if (filters.country && dp.country !== filters.country) return false;
    if (filters.region && dp.region !== filters.region) return false;
    if (filters.sector && dp.sector !== filters.sector) return false;
    if (filters.jobRole && dp.jobRole !== filters.jobRole) return false;
    if (filters.jobFunction && dp.jobFunction !== filters.jobFunction) return false;
    if (filters.ageRange && dp.ageRange !== filters.ageRange) return false;
    if (filters.gender && dp.gender !== filters.gender) return false;
    if (filters.education && dp.education !== filters.education) return false;
    if (filters.tenantId && dp.tenantId !== filters.tenantId) return false;
    if (filters.hubId && dp.hubId !== filters.hubId) return false;
    if (filters.teamId && dp.teamId !== filters.teamId) return false;
    if (filters.communityId && dp.communityId !== filters.communityId) return false;
    return true;
  });
}

/**
 * Calcula el percentil de un valor dentro de un conjunto de referencia
 */
export function calculatePercentileRank(
  value: number,
  referenceValues: number[]
): number {
  if (!referenceValues.length) return 50;
  const sorted = [...referenceValues].sort((a, b) => a - b);
  const belowCount = sorted.filter((v) => v < value).length;
  const equalCount = sorted.filter((v) => v === value).length;
  return Math.round(((belowCount + 0.5 * equalCount) / sorted.length) * 100);
}
