"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Shield,
  Database,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Copy,
  ChevronDown,
  ChevronUp,
  BarChart3,
  TrendingDown,
  Activity,
  Info,
  Loader2,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import {
  getBrainStyleLabel,
  getBrainStyleEmoji,
  getBrainStyleColor,
} from "@/domains/eq/lib/dictionary";

/* =========================================================
   Constants
========================================================= */
const TP_BENCHMARK_ID = "tp-all-assessments-2025";

/* =========================================================
   Translations
========================================================= */
const translations = {
  es: {
    backToHub: "TP Hub",
    badgeLabel: "Calidad de Datos",
    pageTitle: "Calidad de Datos y Detección de Duplicados",
    pageSubtitle: "Análisis de integridad, completitud y confiabilidad de las evaluaciones SEI de Teleperformance",
    overallQuality: "Calidad General de Datos",
    recordsAnalyzed: "registros analizados",
    qualityExcellent: "Excelente",
    qualityGood: "Buena",
    qualityFair: "Aceptable",
    qualityPoor: "Deficiente",
    totalRecords: "Registros Totales",
    duplicatesFound: "Duplicados Detectados",
    groups: "grupos",
    records: "registros",
    outliersDetected: "Outliers",
    avgReliability: "Confiabilidad Promedio",
    assessments: "evaluaciones",
    completenessTitle: "Completitud de Datos por Campo",
    completenessDesc: "Porcentaje de registros con valores válidos por cada campo — ordenado de menor a mayor completitud",
    fieldName: "Campo",
    completeness: "Completitud",
    present: "Presentes",
    missing: "Faltantes",
    totalLabel: "Total",
    outliers: "Outliers",
    duplicatesTitle: "Detección de Duplicados",
    duplicatesDesc: "Grupos de registros duplicados identificados por coincidencia de ID fuente exacto",
    showRecords: "Ver registros",
    hideRecords: "Ocultar registros",
    colSourceId: "ID Fuente",
    colDate: "Fecha",
    colEqTotal: "EQ Total",
    colCountry: "País",
    colRegion: "Región",
    colRole: "Rol",
    colBrainStyle: "Estilo Cerebral",
    reliabilityTitle: "Distribución del Índice de Confiabilidad",
    reliabilityDesc: "Distribución de las evaluaciones según su índice de confiabilidad agrupadas en rangos",
    reliabilityCount: "evaluaciones",
    reliabilityMean: "Media",
    reliabilityMedian: "Mediana",
    reliabilityMin: "Mínimo",
    reliabilityMax: "Máximo",
    outliersTitle: "Registros Atípicos (Outliers)",
    outliersDesc: "Evaluaciones con EQ Total fuera de ±2σ del promedio que requieren revisión",
    colZScore: "Z-Score",
    colType: "Tipo",
    typeHigh: "Alto",
    typeLow: "Bajo",
    outlierStatsTitle: "Estadísticas de Outliers",
    outlierStatsMean: "Media EQ Total",
    outlierStatsStdDev: "Desviación Estándar",
    outlierStatsThresholdHigh: "Umbral Alto (μ+2σ)",
    outlierStatsThresholdLow: "Umbral Bajo (μ-2σ)",
    outlierStatsTotalOutliers: "Total Outliers",
    infoTitle: "Análisis de Calidad de Datos TP",
    infoDesc: "Este módulo analiza la integridad de las evaluaciones SEI de Teleperformance. Los duplicados se detectan por coincidencia de ID fuente. Los outliers se calculan como registros con EQ Total fuera de ±2 desviaciones estándar. Todos los datos individuales están anonimizados.",
    navAlerts: "Alertas",
    navHub: "TP Hub",
    loading: "Cargando datos de calidad...",
    errorLoading: "Error al cargar datos de calidad",
    noData: "No hay datos disponibles",
  },
  en: {
    backToHub: "TP Hub",
    badgeLabel: "Data Quality",
    pageTitle: "Data Quality & Duplicate Detection",
    pageSubtitle: "Integrity, completeness, and reliability analysis of Teleperformance SEI assessments",
    overallQuality: "Overall Data Quality",
    recordsAnalyzed: "records analyzed",
    qualityExcellent: "Excellent",
    qualityGood: "Good",
    qualityFair: "Fair",
    qualityPoor: "Poor",
    totalRecords: "Total Records",
    duplicatesFound: "Duplicates Found",
    groups: "groups",
    records: "records",
    outliersDetected: "Outliers",
    avgReliability: "Avg Reliability",
    assessments: "assessments",
    completenessTitle: "Data Completeness by Field",
    completenessDesc: "Percentage of records with valid values per field — sorted from lowest to highest completeness",
    fieldName: "Field",
    completeness: "Completeness",
    present: "Present",
    missing: "Missing",
    totalLabel: "Total",
    outliers: "Outliers",
    duplicatesTitle: "Duplicate Detection",
    duplicatesDesc: "Groups of duplicated records identified by exact source ID match",
    showRecords: "Show records",
    hideRecords: "Hide records",
    colSourceId: "Source ID",
    colDate: "Date",
    colEqTotal: "EQ Total",
    colCountry: "Country",
    colRegion: "Region",
    colRole: "Role",
    colBrainStyle: "Brain Style",
    reliabilityTitle: "Reliability Index Distribution",
    reliabilityDesc: "Distribution of assessments by reliability index grouped in ranges",
    reliabilityCount: "assessments",
    reliabilityMean: "Mean",
    reliabilityMedian: "Median",
    reliabilityMin: "Min",
    reliabilityMax: "Max",
    outliersTitle: "Outlier Records",
    outliersDesc: "Assessments with EQ Total outside +/-2 std dev from the mean that require review",
    colZScore: "Z-Score",
    colType: "Type",
    typeHigh: "High",
    typeLow: "Low",
    outlierStatsTitle: "Outlier Statistics",
    outlierStatsMean: "EQ Total Mean",
    outlierStatsStdDev: "Standard Deviation",
    outlierStatsThresholdHigh: "High Threshold (μ+2σ)",
    outlierStatsThresholdLow: "Low Threshold (μ-2σ)",
    outlierStatsTotalOutliers: "Total Outliers",
    infoTitle: "TP Data Quality Analysis",
    infoDesc: "This module analyzes the integrity of Teleperformance SEI assessments. Duplicates are detected by source ID match. Outliers are calculated as records with EQ Total outside +/-2 standard deviations. All individual data is anonymized.",
    navAlerts: "Alerts",
    navHub: "TP Hub",
    loading: "Loading quality data...",
    errorLoading: "Error loading quality data",
    noData: "No data available",
  },
};

/* =========================================================
   Types
========================================================= */
interface CompletenessField {
  field: string;
  present: number;
  missing: number;
  percentage: number;
}

interface DuplicateRecord {
  id: string;
  sourceId: string | null;
  sourceDate: string | null;
  country: string | null;
  region: string | null;
  jobRole: string | null;
  eqTotal: number | null;
  brainStyle: string | null;
}

interface DuplicateGroup {
  sourceId: string;
  count: number;
  records: DuplicateRecord[];
}

interface OutlierRecord {
  id: string;
  sourceId: string | null;
  country: string | null;
  region: string | null;
  jobRole: string | null;
  eqTotal: number | null;
  brainStyle: string | null;
  reliabilityIndex: number | null;
  zScore: number;
  type: "high" | "low";
}

interface OutlierStats {
  mean: number;
  stdDev: number;
  thresholdHigh: number;
  thresholdLow: number;
  totalOutliers: number;
}

interface ReliabilityBucket {
  range: string;
  count: number;
}

interface ReliabilityDistribution {
  count: number;
  mean: number;
  median: number;
  min: number;
  max: number;
  buckets: ReliabilityBucket[];
}

interface DataQualityResponse {
  ok: boolean;
  totalRecords: number;
  qualityScore: number;
  completeness: CompletenessField[];
  duplicates: DuplicateGroup[];
  totalDuplicateGroups: number;
  totalDuplicateRecords: number;
  outliers: OutlierRecord[];
  outlierStats: OutlierStats;
  reliabilityDistribution: ReliabilityDistribution;
}

/* =========================================================
   Helper Components
========================================================= */
function QualityGauge({ score }: { score: number }) {
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const percentage = score / 100;
  const strokeDashoffset = circumference - percentage * circumference;
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#eab308" : "#ef4444";

  return (
    <div className="relative w-40 h-40">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
        <circle
          cx="80" cy="80" r={radius}
          stroke="currentColor" strokeWidth="12" fill="none"
          className="text-gray-200 dark:text-zinc-800"
        />
        <motion.circle
          cx="80" cy="80" r={radius}
          stroke={color} strokeWidth="12" fill="none" strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{ strokeDasharray: circumference }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-4xl font-bold"
          style={{ color }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {score.toFixed(1)}
        </motion.span>
        <span className="text-sm text-[var(--rowi-muted)]">/ 100</span>
      </div>
    </div>
  );
}

function CompletenessBar({ value }: { value: number }) {
  const color = value >= 95 ? "bg-green-500" : value >= 90 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-3 flex-1 min-w-0">
      <div className="flex-1 h-2.5 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          whileInView={{ width: `${value}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      <span className={`text-sm font-mono font-medium w-14 text-right ${
        value >= 95 ? "text-green-600 dark:text-green-400"
          : value >= 90 ? "text-yellow-600 dark:text-yellow-400"
          : "text-red-600 dark:text-red-400"
      }`}>
        {value.toFixed(1)}%
      </span>
    </div>
  );
}

/* =========================================================
   Main Page
========================================================= */
export default function TPDataQualityPage() {
  const { lang } = useI18n();
  const t = translations[lang as keyof typeof translations] || translations.es;

  const [data, setData] = useState<DataQualityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch(`/api/admin/benchmarks/${TP_BENCHMARK_ID}/data-quality`);
        const json = await res.json();
        if (json.ok) {
          setData(json);
        } else {
          setError(true);
        }
      } catch (e) {
        console.error(e);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const qualityLabel = data
    ? data.qualityScore >= 80
      ? t.qualityExcellent
      : data.qualityScore >= 60
      ? t.qualityGood
      : data.qualityScore >= 40
      ? t.qualityFair
      : t.qualityPoor
    : "";

  const qualityLabelColor = data
    ? data.qualityScore >= 80
      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
      : data.qualityScore >= 60
      ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
      : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
    : "";

  const sortedCompleteness = data
    ? [...data.completeness].sort((a, b) => a.percentage - b.percentage)
    : [];

  // Reliability bucket colors
  const bucketColors: Record<string, string> = {
    "0-20": "#ef4444",
    "20-40": "#f97316",
    "40-60": "#eab308",
    "60-80": "#22c55e",
    "80-100": "#10b981",
  };

  const bucketLabels: Record<string, { es: string; en: string }> = {
    "0-20": { es: "Muy Baja", en: "Very Low" },
    "20-40": { es: "Baja", en: "Low" },
    "40-60": { es: "Moderada", en: "Moderate" },
    "60-80": { es: "Buena", en: "Good" },
    "80-100": { es: "Excelente", en: "Excellent" },
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link href="/hub/admin/tp" className="inline-flex items-center gap-2 text-sm text-[var(--rowi-muted)] hover:text-purple-500 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> {t.backToHub}
        </Link>

        <div>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-500 mb-3">
            <Database className="w-3 h-3" /> {t.badgeLabel}
          </span>
          <h1 className="text-3xl font-bold mb-2">{t.pageTitle}</h1>
          <p className="text-[var(--rowi-muted)]">{t.pageSubtitle}</p>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-4" />
          <p className="text-[var(--rowi-muted)] text-sm">{t.loading}</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-20">
          <XCircle className="w-10 h-10 text-red-500 mb-4" />
          <p className="text-red-600 dark:text-red-400 text-sm">{t.errorLoading}</p>
        </div>
      )}

      {/* No Data State */}
      {!loading && !error && data && data.totalRecords === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <Database className="w-10 h-10 text-[var(--rowi-muted)] mb-4 opacity-40" />
          <p className="text-[var(--rowi-muted)] text-sm">{t.noData}</p>
        </div>
      )}

      {/* Data Loaded */}
      {!loading && !error && data && data.totalRecords > 0 && (
        <>
          {/* Overall Quality Score */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-zinc-800 flex flex-col items-center"
          >
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-500" /> {t.overallQuality}
            </h2>
            <QualityGauge score={data.qualityScore} />
            <div className="mt-4 text-center">
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${qualityLabelColor}`}>
                <CheckCircle2 className="w-4 h-4" /> {qualityLabel}
              </span>
              <p className="text-sm text-[var(--rowi-muted)] mt-2">
                {data.totalRecords.toLocaleString()} {t.recordsAnalyzed}
              </p>
            </div>
          </motion.div>

          {/* Quality Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: <Database className="w-5 h-5" />,
                label: t.totalRecords,
                value: data.totalRecords.toLocaleString(),
                sub: null,
                color: "text-purple-500",
              },
              {
                icon: <Copy className="w-5 h-5" />,
                label: t.duplicatesFound,
                value: data.totalDuplicateGroups.toString(),
                sub: `${data.totalDuplicateGroups} ${t.groups}, ${data.totalDuplicateRecords} ${t.records}`,
                color: "text-orange-500",
              },
              {
                icon: <TrendingDown className="w-5 h-5" />,
                label: t.outliersDetected,
                value: data.outlierStats.totalOutliers.toString(),
                sub: null,
                color: "text-yellow-500",
              },
              {
                icon: <Activity className="w-5 h-5" />,
                label: t.avgReliability,
                value: data.reliabilityDistribution.mean.toFixed(1),
                sub: `${data.reliabilityDistribution.count.toLocaleString()} ${t.assessments}`,
                color: "text-blue-500",
              },
            ].map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white dark:bg-zinc-900 rounded-xl p-5 border border-gray-100 dark:border-zinc-800"
              >
                <div className={`mb-2 ${card.color}`}>{card.icon}</div>
                <div className="text-2xl font-bold">{card.value}</div>
                <div className="text-sm text-[var(--rowi-muted)]">{card.label}</div>
                {card.sub && <div className="text-xs text-[var(--rowi-muted)] mt-1">{card.sub}</div>}
              </motion.div>
            ))}
          </div>

          {/* Data Completeness Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-zinc-800"
          >
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-purple-500" /> {t.completenessTitle}
            </h2>
            <p className="text-sm text-[var(--rowi-muted)] mb-6">{t.completenessDesc}</p>

            <div className="hidden md:grid md:grid-cols-[200px_1fr_140px_100px] gap-4 px-4 py-2 text-xs font-semibold text-[var(--rowi-muted)] uppercase tracking-wide border-b border-gray-100 dark:border-zinc-800 mb-2">
              <span>{t.fieldName}</span>
              <span>{t.completeness}</span>
              <span className="text-right">{t.present}</span>
              <span className="text-right">{t.missing}</span>
            </div>

            <div className="space-y-1">
              {sortedCompleteness.map((field, i) => (
                <motion.div
                  key={field.field}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.04 }}
                  className="grid grid-cols-1 md:grid-cols-[200px_1fr_140px_100px] gap-2 md:gap-4 px-4 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors items-center"
                >
                  <span className="font-medium text-sm font-mono">
                    {field.field}
                  </span>
                  <CompletenessBar value={field.percentage} />
                  <span className="text-sm text-[var(--rowi-muted)] text-right font-mono">
                    {field.present.toLocaleString()}
                  </span>
                  <span className={`text-sm text-right font-mono ${field.missing > 0 ? "text-red-600 dark:text-red-400 font-semibold" : "text-[var(--rowi-muted)]"}`}>
                    {field.missing.toLocaleString()}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Duplicate Detection Panel */}
          {data.duplicates.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-zinc-800"
            >
              <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                <Copy className="w-5 h-5 text-purple-500" /> {t.duplicatesTitle}
              </h2>
              <p className="text-sm text-[var(--rowi-muted)] mb-6">{t.duplicatesDesc}</p>

              <div className="space-y-4">
                {data.duplicates.map((group) => {
                  const groupKey = group.sourceId;
                  const isExpanded = expandedGroups.has(groupKey);

                  return (
                    <div key={groupKey} className="border border-gray-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                      <button
                        onClick={() => toggleGroup(groupKey)}
                        className="w-full flex flex-wrap items-center gap-3 px-5 py-4 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors text-left"
                      >
                        <span className="font-mono font-bold text-sm text-purple-600 dark:text-purple-400">
                          {group.sourceId}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
                          {group.count} {t.records}
                        </span>
                        <span className="ml-auto flex items-center gap-1 text-xs text-[var(--rowi-muted)]">
                          {isExpanded ? t.hideRecords : t.showRecords}
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </span>
                      </button>

                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          transition={{ duration: 0.2 }}
                          className="border-t border-gray-100 dark:border-zinc-800"
                        >
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-gray-50 dark:bg-zinc-800/50 text-xs uppercase tracking-wide text-[var(--rowi-muted)]">
                                  <th className="px-4 py-2 text-left font-semibold">{t.colSourceId}</th>
                                  <th className="px-4 py-2 text-left font-semibold">{t.colDate}</th>
                                  <th className="px-4 py-2 text-right font-semibold">{t.colEqTotal}</th>
                                  <th className="px-4 py-2 text-left font-semibold">{t.colCountry}</th>
                                  <th className="px-4 py-2 text-left font-semibold">{t.colRegion}</th>
                                  <th className="px-4 py-2 text-left font-semibold">{t.colRole}</th>
                                  <th className="px-4 py-2 text-left font-semibold">{t.colBrainStyle}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {group.records.map((rec, ri) => (
                                  <tr
                                    key={ri}
                                    className="border-t border-gray-50 dark:border-zinc-800/50 hover:bg-gray-50/50 dark:hover:bg-zinc-800/30"
                                  >
                                    <td className="px-4 py-2.5 font-mono text-xs">{rec.sourceId || "—"}</td>
                                    <td className="px-4 py-2.5 text-[var(--rowi-muted)]">
                                      {rec.sourceDate ? new Date(rec.sourceDate).toLocaleDateString() : "—"}
                                    </td>
                                    <td className="px-4 py-2.5 text-right font-mono font-medium">
                                      {rec.eqTotal != null ? rec.eqTotal.toFixed(1) : "—"}
                                    </td>
                                    <td className="px-4 py-2.5 text-[var(--rowi-muted)]">{rec.country || "—"}</td>
                                    <td className="px-4 py-2.5 text-[var(--rowi-muted)]">{rec.region || "—"}</td>
                                    <td className="px-4 py-2.5 text-[var(--rowi-muted)]">{rec.jobRole || "—"}</td>
                                    <td className="px-4 py-2.5">
                                      {rec.brainStyle ? (
                                        <span
                                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                                          style={{
                                            backgroundColor: `${getBrainStyleColor(rec.brainStyle)}15`,
                                            color: getBrainStyleColor(rec.brainStyle),
                                          }}
                                        >
                                          {getBrainStyleEmoji(rec.brainStyle)} {getBrainStyleLabel(rec.brainStyle, lang)}
                                        </span>
                                      ) : (
                                        <span className="text-[var(--rowi-muted)]">—</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Reliability Index Distribution */}
          {data.reliabilityDistribution.buckets.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-zinc-800"
            >
              <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-500" /> {t.reliabilityTitle}
              </h2>
              <p className="text-sm text-[var(--rowi-muted)] mb-6">{t.reliabilityDesc}</p>

              {/* Stats summary row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                {[
                  { label: t.reliabilityMean, value: data.reliabilityDistribution.mean.toFixed(1) },
                  { label: t.reliabilityMedian, value: data.reliabilityDistribution.median.toFixed(1) },
                  { label: t.reliabilityMin, value: data.reliabilityDistribution.min.toFixed(1) },
                  { label: t.reliabilityMax, value: data.reliabilityDistribution.max.toFixed(1) },
                ].map((stat) => (
                  <div key={stat.label} className="text-center px-3 py-2 bg-gray-50 dark:bg-zinc-800/50 rounded-lg">
                    <div className="text-lg font-bold font-mono">{stat.value}</div>
                    <div className="text-xs text-[var(--rowi-muted)]">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Bar chart */}
              <div className="space-y-4">
                {data.reliabilityDistribution.buckets.map((bucket, i) => {
                  const totalCount = data.reliabilityDistribution.count;
                  const pct = totalCount > 0 ? Math.round((bucket.count / totalCount) * 1000) / 10 : 0;
                  const color = bucketColors[bucket.range] || "#8b5cf6";
                  const labelObj = bucketLabels[bucket.range];
                  const label = labelObj
                    ? labelObj[lang as keyof typeof labelObj] || labelObj.es
                    : bucket.range;

                  return (
                    <motion.div
                      key={bucket.range}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.08 }}
                      className="flex items-center gap-4"
                    >
                      <div className="w-28 sm:w-36 flex-shrink-0">
                        <div className="text-sm font-medium">{bucket.range}</div>
                        <div className="text-xs text-[var(--rowi-muted)]">{label}</div>
                      </div>
                      <div className="flex-1 h-8 bg-gray-100 dark:bg-zinc-800 rounded-lg overflow-hidden relative">
                        <motion.div
                          className="h-full rounded-lg flex items-center justify-end pr-3"
                          style={{ backgroundColor: color }}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${Math.max(pct * 1.8, 4)}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.8, ease: "easeOut", delay: i * 0.08 }}
                        >
                          {pct > 5 && (
                            <span className="text-xs font-bold text-white">{pct}%</span>
                          )}
                        </motion.div>
                        {pct <= 5 && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[var(--rowi-muted)]">
                            {pct}%
                          </span>
                        )}
                      </div>
                      <div className="w-20 text-right flex-shrink-0">
                        <span className="text-sm font-mono font-medium">{bucket.count.toLocaleString()}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Outlier Stats */}
          {data.outlierStats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-zinc-800"
            >
              <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-500" /> {t.outlierStatsTitle}
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mt-4">
                {[
                  { label: t.outlierStatsMean, value: data.outlierStats.mean.toFixed(2) },
                  { label: t.outlierStatsStdDev, value: data.outlierStats.stdDev.toFixed(2) },
                  { label: t.outlierStatsThresholdHigh, value: data.outlierStats.thresholdHigh.toFixed(2) },
                  { label: t.outlierStatsThresholdLow, value: data.outlierStats.thresholdLow.toFixed(2) },
                  { label: t.outlierStatsTotalOutliers, value: data.outlierStats.totalOutliers.toString() },
                ].map((stat) => (
                  <div key={stat.label} className="text-center px-3 py-3 bg-gray-50 dark:bg-zinc-800/50 rounded-xl">
                    <div className="text-xl font-bold font-mono">{stat.value}</div>
                    <div className="text-xs text-[var(--rowi-muted)] mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Outlier Records Table */}
          {data.outliers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-zinc-800"
            >
              <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-purple-500" /> {t.outliersTitle}
              </h2>
              <p className="text-sm text-[var(--rowi-muted)] mb-6">{t.outliersDesc}</p>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-zinc-800/50 text-xs uppercase tracking-wide text-[var(--rowi-muted)]">
                      <th className="px-4 py-3 text-left font-semibold">{t.colSourceId}</th>
                      <th className="px-4 py-3 text-left font-semibold">{t.colCountry}</th>
                      <th className="px-4 py-3 text-right font-semibold">{t.colEqTotal}</th>
                      <th className="px-4 py-3 text-right font-semibold">{t.colZScore}</th>
                      <th className="px-4 py-3 text-center font-semibold">{t.colType}</th>
                      <th className="px-4 py-3 text-left font-semibold">{t.colRole}</th>
                      <th className="px-4 py-3 text-left font-semibold">{t.colBrainStyle}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.outliers.map((rec, i) => (
                      <motion.tr
                        key={rec.id}
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.03 }}
                        className="border-t border-gray-100 dark:border-zinc-800 hover:bg-gray-50/50 dark:hover:bg-zinc-800/30"
                      >
                        <td className="px-4 py-3 font-mono text-xs font-medium">{rec.sourceId || "—"}</td>
                        <td className="px-4 py-3 text-[var(--rowi-muted)]">{rec.country || "—"}</td>
                        <td className={`px-4 py-3 text-right font-mono font-bold ${
                          rec.type === "high"
                            ? "text-red-600 dark:text-red-400"
                            : "text-blue-600 dark:text-blue-400"
                        }`}>
                          {rec.eqTotal != null ? rec.eqTotal.toFixed(1) : "—"}
                        </td>
                        <td className={`px-4 py-3 text-right font-mono font-medium ${
                          Math.abs(rec.zScore) >= 3
                            ? "text-red-600 dark:text-red-400"
                            : "text-yellow-600 dark:text-yellow-400"
                        }`}>
                          {rec.zScore > 0 ? "+" : ""}{rec.zScore.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            rec.type === "high"
                              ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                              : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                          }`}>
                            {rec.type === "high" ? t.typeHigh : t.typeLow}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[var(--rowi-muted)] text-xs">{rec.jobRole || "—"}</td>
                        <td className="px-4 py-3">
                          {rec.brainStyle ? (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: `${getBrainStyleColor(rec.brainStyle)}15`,
                                color: getBrainStyleColor(rec.brainStyle),
                              }}
                            >
                              {getBrainStyleEmoji(rec.brainStyle)} {getBrainStyleLabel(rec.brainStyle, lang)}
                            </span>
                          ) : (
                            <span className="text-[var(--rowi-muted)] text-xs">—</span>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </>
      )}

      {/* Info Box */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl p-6 flex gap-4"
      >
        <Shield className="w-6 h-6 text-purple-500 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-1">{t.infoTitle}</h3>
          <p className="text-sm text-purple-700 dark:text-purple-300">
            {t.infoDesc}
          </p>
        </div>
      </motion.div>

      {/* Navigation Footer */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between pt-6 border-t border-gray-200 dark:border-zinc-800">
        <Link
          href="/hub/admin/tp"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border-2 border-gray-200 dark:border-zinc-700 hover:border-purple-500 transition-colors font-medium"
        >
          <ArrowLeft className="w-5 h-5" /> {t.navAlerts}
        </Link>
        <Link
          href="/hub/admin/tp"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:opacity-90 transition-opacity"
        >
          {t.navHub} <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
