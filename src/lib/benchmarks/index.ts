/**
 * 📊 ROWI BENCHMARK
 * Motor de Inteligencia Comparativa Viva
 */

// Estadísticas
export {
  mean,
  median,
  stdDev,
  percentile,
  calculateStats,
  pearsonCorrelation,
  filterDataPoints,
  extractMetricValues,
  calculatePercentileRank,
  MIN_SAMPLE_SIZE,
  type StatResult,
  type CorrelationResult,
  type DataPointFilters,
} from "./statistics";

// Mapeo de columnas
export {
  SOH_COLUMN_MAPPING,
  NUMERIC_COLUMNS,
  EQ_COMPETENCIES,
  OUTCOMES,
  BRAIN_TALENTS,
  DEMOGRAPHIC_COLUMNS,
  METRIC_I18N_KEYS,
  OUTCOME_I18N_KEYS,
  transformRowToDataPoint,
  normalizeCountry,
  normalizeAgeRange,
  detectGeneration,
  extractYearFromValue,
  extractDateInfo,
  MONTH_NAMES,
  QUARTER_NAMES,
  type ExtractedDateInfo,
} from "./column-mapping";

// Top Performers
export {
  identifyTopPerformers,
  calculateTopPerformerProfile,
  generateTopPerformerInsights,
  calculateAllTopPerformerProfiles,
  type TopPerformerProfile,
  type CompetencyRanking,
  type TalentRanking,
  type Pattern,
} from "./top-performers";

// Fallback
export {
  withFallback,
  withFallbackSync,
  createFilteredContext,
  isEmptyContext,
  getFallbackMessage,
  getFallbackPrecision,
  describeContext,
  FALLBACK_CHAIN,
  type FallbackContext,
  type FallbackResult,
  type FallbackLevel,
} from "./fallback";

// Comparación
export {
  compareUserToBenchmark,
  type UserProfile,
  type UserStrength,
  type TopPerformerInsight,
  type DevelopmentArea,
  type ComparisonResult,
} from "./comparison";
