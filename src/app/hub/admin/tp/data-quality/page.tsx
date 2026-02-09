"use client";

import { useState } from "react";
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
  FileWarning,
  TrendingDown,
  Activity,
  Info,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

/* =========================================================
   Translations
========================================================= */
const translations = {
  es: {
    backToHub: "TP Hub",
    badgeLabel: "Calidad de Datos",
    pageTitle: "Calidad de Datos y Detección de Duplicados",
    pageSubtitle: "Análisis de integridad, completitud y confiabilidad de 14,886 evaluaciones SEI de Teleperformance",
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
    lowReliability: "Baja Confiabilidad",
    assessments: "evaluaciones",
    completenessTitle: "Completitud de Datos por Campo",
    completenessDesc: "Porcentaje de registros con valores válidos por cada campo — ordenado de menor a mayor completitud",
    fieldName: "Campo",
    completeness: "Completitud",
    validValues: "Valores Válidos",
    totalLabel: "Total",
    issues: "Problemas",
    outliers: "Outliers",
    duplicatesTitle: "Detección de Duplicados",
    duplicatesDesc: "Grupos de registros potencialmente duplicados identificados por coincidencia de ID exacto, nombre aproximado o datos demográficos",
    matchExactId: "ID Exacto",
    matchFuzzyName: "Nombre Aproximado",
    matchDemographic: "Coincidencia Demográfica",
    confidence: "Confianza",
    recommendation: "Recomendación",
    recMerge: "Fusionar",
    recReview: "Revisar",
    recKeepSeparate: "Mantener Separado",
    colSourceId: "ID Fuente",
    colName: "Nombre",
    colDate: "Fecha",
    colEqTotal: "EQ Total",
    colCountry: "País",
    colRole: "Rol",
    showRecords: "Ver registros",
    hideRecords: "Ocultar registros",
    reliabilityTitle: "Distribución del Índice de Confiabilidad",
    reliabilityDesc: "Distribución de las evaluaciones según su índice de confiabilidad — valores por debajo de 0.5 sugieren evaluaciones potencialmente inválidas",
    outliersTitle: "Registros Atípicos (Outliers)",
    outliersDesc: "Evaluaciones con valores fuera del rango esperado que requieren revisión manual",
    colField: "Campo",
    colValue: "Valor",
    colExpected: "Rango Esperado",
    colSeverity: "Severidad",
    colNote: "Nota",
    severityCritical: "Crítico",
    severityWarning: "Advertencia",
    severityInfo: "Info",
    issuesTitle: "Registro de Problemas de Datos",
    issuesDesc: "Log de problemas detectados durante el análisis de calidad — filtra por estado para priorizar acciones",
    colId: "ID",
    colType: "Tipo",
    colDescription: "Descripción",
    colAffected: "Afectados",
    colDetected: "Detectado",
    colStatus: "Estado",
    typeMissingData: "Datos Faltantes",
    typeInconsistentData: "Datos Inconsistentes",
    typeOutlier: "Outlier",
    typeDuplicate: "Duplicado",
    typeLowReliability: "Baja Confiabilidad",
    statusOpen: "Abierto",
    statusAcknowledged: "Reconocido",
    statusResolved: "Resuelto",
    filterAll: "Todos",
    filterOpen: "Abiertos",
    filterAcknowledged: "Reconocidos",
    filterResolved: "Resueltos",
    infoTitle: "Análisis de Calidad de Datos TP",
    infoDesc: "Este módulo analiza la integridad de 14,886 evaluaciones SEI de Teleperformance. Los duplicados se detectan por coincidencia de ID, nombre y datos demográficos. Todos los datos individuales están anonimizados.",
    navAlerts: "Alertas",
    navHub: "TP Hub",
    noIssuesFilter: "No hay problemas con este filtro",
  },
  en: {
    backToHub: "TP Hub",
    badgeLabel: "Data Quality",
    pageTitle: "Data Quality & Duplicate Detection",
    pageSubtitle: "Integrity, completeness, and reliability analysis of 14,886 Teleperformance SEI assessments",
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
    lowReliability: "Low Reliability",
    assessments: "assessments",
    completenessTitle: "Data Completeness by Field",
    completenessDesc: "Percentage of records with valid values per field — sorted from lowest to highest completeness",
    fieldName: "Field",
    completeness: "Completeness",
    validValues: "Valid Values",
    totalLabel: "Total",
    issues: "Issues",
    outliers: "Outliers",
    duplicatesTitle: "Duplicate Detection",
    duplicatesDesc: "Groups of potentially duplicated records identified by exact ID match, fuzzy name, or demographic data",
    matchExactId: "Exact ID",
    matchFuzzyName: "Fuzzy Name",
    matchDemographic: "Demographic Match",
    confidence: "Confidence",
    recommendation: "Recommendation",
    recMerge: "Merge",
    recReview: "Review",
    recKeepSeparate: "Keep Separate",
    colSourceId: "Source ID",
    colName: "Name",
    colDate: "Date",
    colEqTotal: "EQ Total",
    colCountry: "Country",
    colRole: "Role",
    showRecords: "Show records",
    hideRecords: "Hide records",
    reliabilityTitle: "Reliability Index Distribution",
    reliabilityDesc: "Distribution of assessments by reliability index — values below 0.5 suggest potentially invalid assessments",
    outliersTitle: "Outlier Records",
    outliersDesc: "Assessments with values outside the expected range that require manual review",
    colField: "Field",
    colValue: "Value",
    colExpected: "Expected Range",
    colSeverity: "Severity",
    colNote: "Note",
    severityCritical: "Critical",
    severityWarning: "Warning",
    severityInfo: "Info",
    issuesTitle: "Data Issues Log",
    issuesDesc: "Log of issues detected during quality analysis — filter by status to prioritize actions",
    colId: "ID",
    colType: "Type",
    colDescription: "Description",
    colAffected: "Affected",
    colDetected: "Detected",
    colStatus: "Status",
    typeMissingData: "Missing Data",
    typeInconsistentData: "Inconsistent Data",
    typeOutlier: "Outlier",
    typeDuplicate: "Duplicate",
    typeLowReliability: "Low Reliability",
    statusOpen: "Open",
    statusAcknowledged: "Acknowledged",
    statusResolved: "Resolved",
    filterAll: "All",
    filterOpen: "Open",
    filterAcknowledged: "Acknowledged",
    filterResolved: "Resolved",
    infoTitle: "TP Data Quality Analysis",
    infoDesc: "This module analyzes the integrity of 14,886 Teleperformance SEI assessments. Duplicates are detected by ID match, name similarity, and demographic data. All individual data is anonymized.",
    navAlerts: "Alerts",
    navHub: "TP Hub",
    noIssuesFilter: "No issues match this filter",
  },
};

/* =========================================================
   Mock Data
========================================================= */
const DATA_QUALITY_SCORE = 87.4;

const QUALITY_METRICS = [
  { field: "eqTotal", label: { es: "EQ Total", en: "EQ Total" }, completeness: 100, validValues: 14886, totalRecords: 14886, outliers: 12, issues: 0 },
  { field: "country", label: { es: "País", en: "Country" }, completeness: 99.8, validValues: 14856, totalRecords: 14886, outliers: 0, issues: 30 },
  { field: "region", label: { es: "Región", en: "Region" }, completeness: 99.9, validValues: 14872, totalRecords: 14886, outliers: 0, issues: 14 },
  { field: "jobFunction", label: { es: "Función Laboral", en: "Job Function" }, completeness: 96.2, validValues: 14320, totalRecords: 14886, outliers: 0, issues: 566 },
  { field: "jobRole", label: { es: "Rol", en: "Job Role" }, completeness: 94.8, validValues: 14112, totalRecords: 14886, outliers: 0, issues: 774 },
  { field: "ageRange", label: { es: "Rango de Edad", en: "Age Range" }, completeness: 92.4, validValues: 13754, totalRecords: 14886, outliers: 0, issues: 1132 },
  { field: "gender", label: { es: "Género", en: "Gender" }, completeness: 91.8, validValues: 13664, totalRecords: 14886, outliers: 0, issues: 1222 },
  { field: "education", label: { es: "Educación", en: "Education" }, completeness: 88.6, validValues: 13188, totalRecords: 14886, outliers: 0, issues: 1698 },
  { field: "brainStyle", label: { es: "Estilo Cerebral", en: "Brain Style" }, completeness: 99.2, validValues: 14766, totalRecords: 14886, outliers: 0, issues: 120 },
  { field: "reliabilityIndex", label: { es: "Índice de Confiabilidad", en: "Reliability Index" }, completeness: 98.4, validValues: 14648, totalRecords: 14886, outliers: 48, issues: 238 },
];

const DUPLICATE_GROUPS = [
  {
    id: "DUP-001", sourceId: "TP-4821", matchType: "exact_id" as const, confidence: 100,
    records: [
      { sourceId: "TP-4821", name: "Carlos Méndez", date: "2023-02-15", eqTotal: 96.4, country: "México", role: "Customer Service" },
      { sourceId: "TP-4821", name: "Carlos Méndez", date: "2023-08-20", eqTotal: 100.2, country: "México", role: "Customer Service" },
      { sourceId: "TP-4821", name: "Carlos Mendez", date: "2024-01-18", eqTotal: 104.8, country: "Mexico", role: "Customer Service Lead" },
      { sourceId: "TP-4821", name: "Carlos Méndez", date: "2024-09-12", eqTotal: 108.4, country: "México", role: "Customer Service Lead" },
    ],
    recommendation: "merge" as const,
  },
  {
    id: "DUP-002", sourceId: "TP-7293", matchType: "exact_id" as const, confidence: 100,
    records: [
      { sourceId: "TP-7293", name: "Sarah Chen", date: "2023-05-10", eqTotal: 106.8, country: "Philippines", role: "Sales Rep" },
      { sourceId: "TP-7293", name: "Sarah Chen", date: "2024-02-22", eqTotal: 110.2, country: "Philippines", role: "Sales Manager" },
      { sourceId: "TP-7293", name: "Sarah Chen", date: "2024-11-05", eqTotal: 112.7, country: "Philippines", role: "Sales Manager" },
    ],
    recommendation: "merge" as const,
  },
  {
    id: "DUP-003", sourceId: "TP-1456", matchType: "exact_id" as const, confidence: 100,
    records: [
      { sourceId: "TP-1456", name: "James O'Brien", date: "2023-03-08", eqTotal: 89.2, country: "USA", role: "IT Support" },
      { sourceId: "TP-1456", name: "James OBrien", date: "2023-09-15", eqTotal: 91.8, country: "USA", role: "IT Support" },
      { sourceId: "TP-1456", name: "James O'Brien", date: "2024-03-20", eqTotal: 93.4, country: "USA", role: "IT Support Manager" },
      { sourceId: "TP-1456", name: "James O'Brien", date: "2024-08-28", eqTotal: 95.3, country: "USA", role: "IT Support Manager" },
    ],
    recommendation: "merge" as const,
  },
  {
    id: "DUP-004", sourceId: null, matchType: "fuzzy_name" as const, confidence: 72,
    records: [
      { sourceId: "TP-9102", name: "Ana Maria Garcia", date: "2023-06-14", eqTotal: 102.4, country: "Argentina", role: "Team Lead" },
      { sourceId: "TP-9381", name: "Ana García", date: "2024-04-20", eqTotal: 107.5, country: "Argentina", role: "Team Lead" },
    ],
    recommendation: "review" as const,
  },
  {
    id: "DUP-005", sourceId: null, matchType: "demographic_match" as const, confidence: 58,
    records: [
      { sourceId: "TP-6200", name: "M. Weber", date: "2023-02-28", eqTotal: 97.2, country: "Germany", role: "Operations" },
      { sourceId: "TP-3169", name: "Marcus Weber", date: "2023-04-18", eqTotal: 97.8, country: "Germany", role: "Operations Lead" },
    ],
    recommendation: "review" as const,
  },
];

const RELIABILITY_DISTRIBUTION = [
  { range: "0.0 - 0.3", label: { es: "Muy Baja", en: "Very Low" }, count: 42, percentage: 0.3, color: "#ef4444" },
  { range: "0.3 - 0.5", label: { es: "Baja", en: "Low" }, count: 186, percentage: 1.2, color: "#f97316" },
  { range: "0.5 - 0.7", label: { es: "Moderada", en: "Moderate" }, count: 1248, percentage: 8.4, color: "#eab308" },
  { range: "0.7 - 0.85", label: { es: "Buena", en: "Good" }, count: 5842, percentage: 39.2, color: "#22c55e" },
  { range: "0.85 - 1.0", label: { es: "Excelente", en: "Excellent" }, count: 7568, percentage: 50.9, color: "#10b981" },
];

const OUTLIER_RECORDS = [
  { sourceId: "TP-09834", field: "reliabilityIndex", value: 0.12, expected: "0.5-1.0", severity: "critical" as const, note: { es: "Evaluación posiblemente inválida", en: "Possibly invalid assessment" } },
  { sourceId: "TP-12456", field: "reliabilityIndex", value: 0.18, expected: "0.5-1.0", severity: "critical" as const, note: { es: "Índice de confiabilidad extremadamente bajo", en: "Extremely low reliability index" } },
  { sourceId: "TP-14201", field: "eqTotal", value: 134.8, expected: "65-135", severity: "warning" as const, note: { es: "Valor cercano al máximo de la escala", en: "Value near scale maximum" } },
  { sourceId: "TP-08442", field: "RP", value: 134.9, expected: "65-135", severity: "warning" as const, note: { es: "RP extremadamente alto", en: "Extremely high RP" } },
  { sourceId: "TP-05671", field: "eqTotal", value: 67.1, expected: "65-135", severity: "warning" as const, note: { es: "EQ Total muy por debajo del promedio", en: "EQ Total far below average" } },
  { sourceId: "TP-11283", field: "NE", value: 66.2, expected: "65-135", severity: "info" as const, note: { es: "NE extremadamente bajo", en: "Extremely low NE" } },
];

const DATA_ISSUES_LOG = [
  { id: "ISS-001", type: "missing_data" as const, severity: "warning" as const, description: { es: "566 registros sin función laboral asignada", en: "566 records without assigned job function" }, field: "jobFunction", affectedRecords: 566, detectedAt: "2024-12-01", status: "open" as const },
  { id: "ISS-002", type: "inconsistent_data" as const, severity: "warning" as const, description: { es: "30 registros con país no reconocido en el catálogo estándar", en: "30 records with unrecognized country in standard catalog" }, field: "country", affectedRecords: 30, detectedAt: "2024-12-01", status: "open" as const },
  { id: "ISS-003", type: "outlier" as const, severity: "info" as const, description: { es: "12 evaluaciones con EQ total fuera de rango esperado (\u00B12\u03C3)", en: "12 assessments with EQ total outside expected range (\u00B12\u03C3)" }, field: "eqTotal", affectedRecords: 12, detectedAt: "2024-12-01", status: "acknowledged" as const },
  { id: "ISS-004", type: "duplicate" as const, severity: "info" as const, description: { es: "5 grupos de registros duplicados detectados \u2014 3 por ID exacto, 2 por coincidencia demográfica", en: "5 duplicate record groups detected \u2014 3 by exact ID, 2 by demographic match" }, field: "sourceId", affectedRecords: 13, detectedAt: "2024-12-01", status: "open" as const },
  { id: "ISS-005", type: "low_reliability" as const, severity: "warning" as const, description: { es: "228 evaluaciones con índice de confiabilidad < 0.5 \u2014 considerar exclusión del benchmark", en: "228 assessments with reliability index < 0.5 \u2014 consider excluding from benchmark" }, field: "reliabilityIndex", affectedRecords: 228, detectedAt: "2024-12-01", status: "open" as const },
];

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

function SeverityBadge({ severity, t }: { severity: "critical" | "warning" | "info"; t: typeof translations.es }) {
  const config = {
    critical: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", label: t.severityCritical },
    warning: { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-400", label: t.severityWarning },
    info: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", label: t.severityInfo },
  };
  const c = config[severity];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      {severity === "critical" && <XCircle className="w-3 h-3" />}
      {severity === "warning" && <AlertTriangle className="w-3 h-3" />}
      {severity === "info" && <Info className="w-3 h-3" />}
      {c.label}
    </span>
  );
}

function MatchTypeBadge({ matchType, t }: { matchType: "exact_id" | "fuzzy_name" | "demographic_match"; t: typeof translations.es }) {
  const config = {
    exact_id: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400", label: t.matchExactId },
    fuzzy_name: { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-400", label: t.matchFuzzyName },
    demographic_match: { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-400", label: t.matchDemographic },
  };
  const c = config[matchType];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

function RecommendationBadge({ rec, t }: { rec: "merge" | "review" | "keep_separate"; t: typeof translations.es }) {
  const config = {
    merge: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400", label: t.recMerge },
    review: { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-400", label: t.recReview },
    keep_separate: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", label: t.recKeepSeparate },
  };
  const c = config[rec];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

function StatusBadge({ status, t }: { status: "open" | "acknowledged" | "resolved"; t: typeof translations.es }) {
  const config = {
    open: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", label: t.statusOpen, icon: <XCircle className="w-3 h-3" /> },
    acknowledged: { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-400", label: t.statusAcknowledged, icon: <AlertTriangle className="w-3 h-3" /> },
    resolved: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400", label: t.statusResolved, icon: <CheckCircle2 className="w-3 h-3" /> },
  };
  const c = config[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      {c.icon} {c.label}
    </span>
  );
}

function IssueTypeLabel({ type, t }: { type: string; t: typeof translations.es }) {
  const map: Record<string, { icon: React.ReactNode; label: string }> = {
    missing_data: { icon: <FileWarning className="w-3.5 h-3.5" />, label: t.typeMissingData },
    inconsistent_data: { icon: <AlertTriangle className="w-3.5 h-3.5" />, label: t.typeInconsistentData },
    outlier: { icon: <TrendingDown className="w-3.5 h-3.5" />, label: t.typeOutlier },
    duplicate: { icon: <Copy className="w-3.5 h-3.5" />, label: t.typeDuplicate },
    low_reliability: { icon: <Activity className="w-3.5 h-3.5" />, label: t.typeLowReliability },
  };
  const entry = map[type] || { icon: <Info className="w-3.5 h-3.5" />, label: type };
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-[var(--rowi-muted)]">
      {entry.icon} {entry.label}
    </span>
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

function highlightNameDiff(name: string, baselineName: string) {
  if (name === baselineName) return <span>{name}</span>;
  return (
    <span>
      {name.split("").map((char, i) => {
        const isDiff = i >= baselineName.length || char !== baselineName[i];
        return isDiff ? (
          <span key={i} className="text-red-500 font-semibold underline">{char}</span>
        ) : (
          <span key={i}>{char}</span>
        );
      })}
    </span>
  );
}

/* =========================================================
   Main Page
========================================================= */
export default function TPDataQualityPage() {
  const { lang } = useI18n();
  const t = translations[lang as keyof typeof translations] || translations.es;

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [issueFilter, setIssueFilter] = useState<"all" | "open" | "acknowledged" | "resolved">("all");

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const sortedMetrics = [...QUALITY_METRICS].sort((a, b) => a.completeness - b.completeness);

  const filteredIssues = DATA_ISSUES_LOG.filter((issue) => {
    if (issueFilter === "all") return true;
    return issue.status === issueFilter;
  });

  const totalDuplicateRecords = DUPLICATE_GROUPS.reduce((sum, g) => sum + g.records.length, 0);

  const qualityLabel = DATA_QUALITY_SCORE >= 80
    ? t.qualityExcellent
    : DATA_QUALITY_SCORE >= 60
    ? t.qualityGood
    : DATA_QUALITY_SCORE >= 40
    ? t.qualityFair
    : t.qualityPoor;

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

      {/* Overall Quality Score */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-zinc-900 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-zinc-800 flex flex-col items-center"
      >
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-purple-500" /> {t.overallQuality}
        </h2>
        <QualityGauge score={DATA_QUALITY_SCORE} />
        <div className="mt-4 text-center">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
            <CheckCircle2 className="w-4 h-4" /> {qualityLabel}
          </span>
          <p className="text-sm text-[var(--rowi-muted)] mt-2">
            14,886 {t.recordsAnalyzed}
          </p>
        </div>
      </motion.div>

      {/* Quality Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: <Database className="w-5 h-5" />, label: t.totalRecords, value: "14,886", sub: null, color: "text-purple-500" },
          { icon: <Copy className="w-5 h-5" />, label: t.duplicatesFound, value: `${DUPLICATE_GROUPS.length}`, sub: `${DUPLICATE_GROUPS.length} ${t.groups}, ${totalDuplicateRecords} ${t.records}`, color: "text-orange-500" },
          { icon: <TrendingDown className="w-5 h-5" />, label: t.outliersDetected, value: "12", sub: null, color: "text-yellow-500" },
          { icon: <Activity className="w-5 h-5" />, label: t.lowReliability, value: "228", sub: t.assessments, color: "text-red-500" },
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

        <div className="hidden md:grid md:grid-cols-[200px_1fr_140px_80px_80px] gap-4 px-4 py-2 text-xs font-semibold text-[var(--rowi-muted)] uppercase tracking-wide border-b border-gray-100 dark:border-zinc-800 mb-2">
          <span>{t.fieldName}</span>
          <span>{t.completeness}</span>
          <span className="text-right">{t.validValues}</span>
          <span className="text-right">{t.outliers}</span>
          <span className="text-right">{t.issues}</span>
        </div>

        <div className="space-y-1">
          {sortedMetrics.map((metric, i) => (
            <motion.div
              key={metric.field}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              className="grid grid-cols-1 md:grid-cols-[200px_1fr_140px_80px_80px] gap-2 md:gap-4 px-4 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors items-center"
            >
              <span className="font-medium text-sm">
                {metric.label[lang as keyof typeof metric.label] || metric.label.es}
              </span>
              <CompletenessBar value={metric.completeness} />
              <span className="text-sm text-[var(--rowi-muted)] text-right font-mono">
                {metric.validValues.toLocaleString()} / {metric.totalRecords.toLocaleString()}
              </span>
              <span className={`text-sm text-right font-mono ${metric.outliers > 0 ? "text-yellow-600 dark:text-yellow-400 font-semibold" : "text-[var(--rowi-muted)]"}`}>
                {metric.outliers}
              </span>
              <span className={`text-sm text-right font-mono ${metric.issues > 0 ? "text-red-600 dark:text-red-400 font-semibold" : "text-[var(--rowi-muted)]"}`}>
                {metric.issues.toLocaleString()}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Duplicate Detection Panel */}
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
          {DUPLICATE_GROUPS.map((group) => {
            const isExpanded = expandedGroups.has(group.id);
            const baselineName = group.records[0]?.name || "";

            return (
              <div key={group.id} className="border border-gray-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex flex-wrap items-center gap-3 px-5 py-4 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors text-left"
                >
                  <span className="font-mono font-bold text-sm text-purple-600 dark:text-purple-400">{group.id}</span>
                  {group.sourceId && (
                    <span className="text-xs text-[var(--rowi-muted)] font-mono">{group.sourceId}</span>
                  )}
                  <MatchTypeBadge matchType={group.matchType} t={t} />
                  <span className="text-xs text-[var(--rowi-muted)]">
                    {t.confidence}: <span className="font-bold">{group.confidence}%</span>
                  </span>
                  <span className="text-xs text-[var(--rowi-muted)]">
                    {group.records.length} {t.records}
                  </span>
                  <RecommendationBadge rec={group.recommendation} t={t} />
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
                            <th className="px-4 py-2 text-left font-semibold">{t.colName}</th>
                            <th className="px-4 py-2 text-left font-semibold">{t.colDate}</th>
                            <th className="px-4 py-2 text-right font-semibold">{t.colEqTotal}</th>
                            <th className="px-4 py-2 text-left font-semibold">{t.colCountry}</th>
                            <th className="px-4 py-2 text-left font-semibold">{t.colRole}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.records.map((rec, ri) => (
                            <tr
                              key={ri}
                              className="border-t border-gray-50 dark:border-zinc-800/50 hover:bg-gray-50/50 dark:hover:bg-zinc-800/30"
                            >
                              <td className="px-4 py-2.5 font-mono text-xs">{rec.sourceId}</td>
                              <td className="px-4 py-2.5">
                                {highlightNameDiff(rec.name, baselineName)}
                              </td>
                              <td className="px-4 py-2.5 text-[var(--rowi-muted)]">{rec.date}</td>
                              <td className="px-4 py-2.5 text-right font-mono font-medium">{rec.eqTotal.toFixed(1)}</td>
                              <td className="px-4 py-2.5 text-[var(--rowi-muted)]">{rec.country}</td>
                              <td className="px-4 py-2.5 text-[var(--rowi-muted)]">{rec.role}</td>
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

      {/* Reliability Index Distribution */}
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

        <div className="space-y-4">
          {RELIABILITY_DISTRIBUTION.map((bucket, i) => (
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
                <div className="text-xs text-[var(--rowi-muted)]">
                  {bucket.label[lang as keyof typeof bucket.label] || bucket.label.es}
                </div>
              </div>
              <div className="flex-1 h-8 bg-gray-100 dark:bg-zinc-800 rounded-lg overflow-hidden relative">
                <motion.div
                  className="h-full rounded-lg flex items-center justify-end pr-3"
                  style={{ backgroundColor: bucket.color }}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${Math.max(bucket.percentage * 1.8, 4)}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: i * 0.08 }}
                >
                  {bucket.percentage > 5 && (
                    <span className="text-xs font-bold text-white">{bucket.percentage}%</span>
                  )}
                </motion.div>
                {bucket.percentage <= 5 && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[var(--rowi-muted)]">
                    {bucket.percentage}%
                  </span>
                )}
              </div>
              <div className="w-20 text-right flex-shrink-0">
                <span className="text-sm font-mono font-medium">{bucket.count.toLocaleString()}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Outlier Records Table */}
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
                <th className="px-4 py-3 text-left font-semibold">{t.colField}</th>
                <th className="px-4 py-3 text-right font-semibold">{t.colValue}</th>
                <th className="px-4 py-3 text-left font-semibold">{t.colExpected}</th>
                <th className="px-4 py-3 text-center font-semibold">{t.colSeverity}</th>
                <th className="px-4 py-3 text-left font-semibold">{t.colNote}</th>
              </tr>
            </thead>
            <tbody>
              {OUTLIER_RECORDS.map((rec, i) => (
                <motion.tr
                  key={rec.sourceId + rec.field}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="border-t border-gray-100 dark:border-zinc-800 hover:bg-gray-50/50 dark:hover:bg-zinc-800/30"
                >
                  <td className="px-4 py-3 font-mono text-xs font-medium">{rec.sourceId}</td>
                  <td className="px-4 py-3 font-mono text-xs">{rec.field}</td>
                  <td className={`px-4 py-3 text-right font-mono font-bold ${
                    rec.severity === "critical" ? "text-red-600 dark:text-red-400"
                      : rec.severity === "warning" ? "text-yellow-600 dark:text-yellow-400"
                      : "text-blue-600 dark:text-blue-400"
                  }`}>
                    {rec.value}
                  </td>
                  <td className="px-4 py-3 text-[var(--rowi-muted)] font-mono text-xs">{rec.expected}</td>
                  <td className="px-4 py-3 text-center">
                    <SeverityBadge severity={rec.severity} t={t} />
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--rowi-muted)]">
                    {rec.note[lang as keyof typeof rec.note] || rec.note.es}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Data Issues Log */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-zinc-800"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FileWarning className="w-5 h-5 text-purple-500" /> {t.issuesTitle}
            </h2>
            <p className="text-sm text-[var(--rowi-muted)] mt-1">{t.issuesDesc}</p>
          </div>

          <div className="flex items-center gap-1 bg-gray-100 dark:bg-zinc-800 rounded-lg p-1">
            {(["all", "open", "acknowledged", "resolved"] as const).map((filter) => {
              const filterLabels = {
                all: t.filterAll,
                open: t.filterOpen,
                acknowledged: t.filterAcknowledged,
                resolved: t.filterResolved,
              };
              return (
                <button
                  key={filter}
                  onClick={() => setIssueFilter(filter)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    issueFilter === filter
                      ? "bg-white dark:bg-zinc-700 shadow-sm text-purple-600 dark:text-purple-400"
                      : "text-[var(--rowi-muted)] hover:text-purple-500"
                  }`}
                >
                  {filterLabels[filter]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          {filteredIssues.map((issue, i) => (
            <motion.div
              key={issue.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 rounded-xl border border-gray-100 dark:border-zinc-800 hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400 w-16 flex-shrink-0">
                  {issue.id}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <IssueTypeLabel type={issue.type} t={t} />
                    <SeverityBadge severity={issue.severity} t={t} />
                  </div>
                  <p className="text-sm truncate">
                    {issue.description[lang as keyof typeof issue.description] || issue.description.es}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="text-right">
                  <div className="text-sm font-mono font-medium">{issue.affectedRecords.toLocaleString()}</div>
                  <div className="text-[10px] text-[var(--rowi-muted)] uppercase">{t.colAffected}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono text-[var(--rowi-muted)]">{issue.detectedAt}</div>
                  <div className="text-[10px] text-[var(--rowi-muted)] uppercase">{t.colDetected}</div>
                </div>
                <StatusBadge status={issue.status} t={t} />
              </div>
            </motion.div>
          ))}

          {filteredIssues.length === 0 && (
            <div className="text-center py-8 text-[var(--rowi-muted)] text-sm">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
              {t.noIssuesFilter}
            </div>
          )}
        </div>
      </motion.div>

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
