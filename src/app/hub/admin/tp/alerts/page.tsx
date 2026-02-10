"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  AlertTriangle,
  AlertCircle,
  Info,
  Shield,
  TrendingDown,
  TrendingUp,
  Users,
  Globe,
  Activity,
  Settings,
  CheckCircle2,
  Clock,
  Eye,
  Minus,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { EQ_LEVELS, getEqLevel } from "@/domains/eq/lib/eqLevels";

/* =========================================================
   Translations — Bilingual ES / EN
========================================================= */
const translations = {
  es: {
    backToHub: "TP Hub",
    badgeAlerts: "Alertas / Alerts",
    pageTitle: "Alertas y Notificaciones EQ",
    pageSubtitle: "Monitoreo proactivo de salud EQ — umbrales, tendencias, anomalías y salud de equipos",
    totalAlerts: "Total Alertas",
    critical: "Críticas",
    warning: "Advertencias",
    informational: "Informativas",
    filterSeverity: "Severidad",
    filterType: "Tipo",
    filterRegion: "Región",
    filterStatus: "Estado",
    all: "Todas",
    severityCritical: "Crítica",
    severityWarning: "Advertencia",
    severityInfo: "Info",
    typeLowEQ: "EQ Bajo",
    typeDeclining: "Tendencia",
    typeTeamHealth: "Salud Equipo",
    typeAnomaly: "Anomalía",
    regionNA: "NA",
    regionLATAM: "LATAM",
    regionAPAC: "APAC",
    regionEMEA: "EMEA",
    statusNew: "Nueva",
    statusAcknowledged: "Reconocida",
    statusResolved: "Resuelta",
    activeAlertsTitle: "Alertas Activas",
    activeAlertsDesc: "Lista filtrada de alertas detectadas por el sistema de monitoreo EQ",
    detected: "Detectada",
    threshold: "Umbral",
    current: "Actual",
    entity: "Entidad",
    noAlertsMatch: "No hay alertas que coincidan con los filtros seleccionados",
    teamHealthTitle: "Nivel EQ por País",
    teamHealthDesc: "Vista general del nivel de inteligencia emocional por país basado en la escala SEI",
    health: "Nivel",
    trend: "Tendencia",
    topStrength: "Mayor Fortaleza",
    biggestGap: "Mayor Brecha",
    trendUp: "Subiendo",
    trendDown: "Bajando",
    trendStable: "Estable",
    configTitle: "Configuración de Umbrales",
    configDesc: "Definir umbrales de alerta para métricas clave del sistema EQ",
    metric: "Métrica",
    warningThreshold: "Umbral Advertencia",
    criticalThreshold: "Umbral Crítico",
    enabled: "Activo",
    trendMonitorTitle: "Monitoreo de Métricas Actuales",
    trendMonitorDesc: "Indicadores de métricas clave por región — datos en vivo del benchmark",
    infoTitle: "Sistema de Alertas EQ",
    infoDesc: "Las alertas se generan automáticamente basándose en umbrales configurados, análisis de tendencias y detección de anomalías sobre datos SEI de Teleperformance. Todos los datos individuales permanecen anonimizados.",
    navPrev: "World",
    navNext: "Data Quality",
    loading: "Cargando datos...",
    assessments: "evaluaciones",
    avgEQ: "EQ Prom",
    regionMetrics: "Métricas por Región",
    regionMetricsDesc: "Promedios de métricas clave por región geográfica",
    mean: "Prom",
    count: "N",
    lowCompAlert: "Competencia Baja",
    lowCompAlertDesc: "tiene {comp} en {value}, por debajo del umbral de {threshold}",
    lowEQAlertDesc: "tiene un EQ promedio de {value}, por debajo del umbral de {threshold}",
    lowHealthAlertDesc: "tiene un score de salud de {value}, por debajo del umbral de {threshold}",
  },
  en: {
    backToHub: "TP Hub",
    badgeAlerts: "Alerts / Notifications",
    pageTitle: "EQ Alerts & Notifications",
    pageSubtitle: "Proactive EQ health monitoring — thresholds, trends, anomalies, and team health",
    totalAlerts: "Total Alerts",
    critical: "Critical",
    warning: "Warnings",
    informational: "Informational",
    filterSeverity: "Severity",
    filterType: "Type",
    filterRegion: "Region",
    filterStatus: "Status",
    all: "All",
    severityCritical: "Critical",
    severityWarning: "Warning",
    severityInfo: "Info",
    typeLowEQ: "Low EQ",
    typeDeclining: "Trend",
    typeTeamHealth: "Team Health",
    typeAnomaly: "Anomaly",
    regionNA: "NA",
    regionLATAM: "LATAM",
    regionAPAC: "APAC",
    regionEMEA: "EMEA",
    statusNew: "New",
    statusAcknowledged: "Acknowledged",
    statusResolved: "Resolved",
    activeAlertsTitle: "Active Alerts",
    activeAlertsDesc: "Filtered list of alerts detected by the EQ monitoring system",
    detected: "Detected",
    threshold: "Threshold",
    current: "Current",
    entity: "Entity",
    noAlertsMatch: "No alerts match the selected filters",
    teamHealthTitle: "EQ Level by Country",
    teamHealthDesc: "Emotional intelligence level overview by country based on the SEI scale",
    health: "Level",
    trend: "Trend",
    topStrength: "Top Strength",
    biggestGap: "Biggest Gap",
    trendUp: "Improving",
    trendDown: "Declining",
    trendStable: "Stable",
    configTitle: "Threshold Configuration",
    configDesc: "Define alert thresholds for key EQ system metrics",
    metric: "Metric",
    warningThreshold: "Warning Threshold",
    criticalThreshold: "Critical Threshold",
    enabled: "Enabled",
    trendMonitorTitle: "Current Metrics Monitoring",
    trendMonitorDesc: "Key metric indicators by region — live benchmark data",
    infoTitle: "EQ Alert System",
    infoDesc: "Alerts are automatically generated based on configured thresholds, trend analysis, and anomaly detection over Teleperformance SEI data. All individual data remains anonymized.",
    navPrev: "World",
    navNext: "Data Quality",
    loading: "Loading data...",
    assessments: "assessments",
    avgEQ: "Avg EQ",
    regionMetrics: "Metrics by Region",
    regionMetricsDesc: "Key metric averages by geographic region",
    mean: "Avg",
    count: "N",
    lowCompAlert: "Low Competency",
    lowCompAlertDesc: "has {comp} at {value}, below threshold of {threshold}",
    lowEQAlertDesc: "has an average EQ of {value}, below the threshold of {threshold}",
    lowHealthAlertDesc: "has a health score of {value}, below the threshold of {threshold}",
  },
};

/* =========================================================
   Constants
========================================================= */
const TP_BENCHMARK_ID = "tp-all-assessments-2025";

const COMP_KEYS = ["EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"] as const;

const COMP_LABELS: Record<string, { es: string; en: string }> = {
  EL: { es: "Alfabetización Emocional", en: "Emotional Literacy" },
  RP: { es: "Reconocer Patrones", en: "Recognize Patterns" },
  ACT: { es: "Pensamiento Consecuente", en: "Apply Consequential Thinking" },
  NE: { es: "Navegar Emociones", en: "Navigate Emotions" },
  IM: { es: "Motivación Intrínseca", en: "Increase Intrinsic Motivation" },
  OP: { es: "Ejercer Optimismo", en: "Exercise Optimism" },
  EMP: { es: "Aumentar Empatía", en: "Increase Empathy" },
  NG: { es: "Metas Nobles", en: "Pursue Noble Goals" },
};

/* Threshold configuration — based on SEI levels */
const ALERT_CONFIGS = [
  { metric: "eqTotal", label: { es: "EQ Total", en: "EQ Total" }, warningThreshold: "< 92 🌱 Emergente", criticalThreshold: "< 82 🧩 Desafío", enabled: true },
  { metric: "competency", label: { es: "Competencia Individual", en: "Individual Competency" }, warningThreshold: "< 92 🌱 Emergente", criticalThreshold: "< 82 🧩 Desafío", enabled: true },
  { metric: "reliability", label: { es: "Índice de Confiabilidad", en: "Reliability Index" }, warningThreshold: "< 0.7", criticalThreshold: "< 0.5", enabled: true },
  { metric: "anomaly", label: { es: "Detección de Anomalías", en: "Anomaly Detection" }, warningThreshold: "> 2.0 σ", criticalThreshold: "> 3.0 σ", enabled: true },
];

/* =========================================================
   Types
========================================================= */
interface GroupMetrics {
  [key: string]: { mean: number; median: number; min: number; max: number; stdDev: number };
}

interface StatsGroup {
  name: string;
  count: number;
  metrics: GroupMetrics;
  brainStyleDist?: Record<string, number>;
}

interface OverallStat {
  metricKey: string;
  n: number;
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
  p10?: number;
  p25?: number;
  p50?: number;
  p75?: number;
  p90?: number;
  p95?: number;
}

interface ComputedAlert {
  id: string;
  type: "low_eq" | "low_competency" | "team_health" | "anomaly";
  severity: "critical" | "warning" | "info";
  entity: string;
  entityType: "country" | "region";
  region: string;
  metric: string;
  currentValue: number;
  threshold: number;
  detectedAt: string;
  status: "new";
  title: { es: string; en: string };
  description: { es: string; en: string };
}

interface TeamHealthItem {
  name: string;
  count: number;
  avgEQ: number;
  eqLevel: { key: string; label: string; labelEN: string; color: string; emoji: string };
  strength: string;
  gap: string;
}

/* =========================================================
   Helpers
========================================================= */
function severityColor(severity: string) {
  switch (severity) {
    case "critical":
      return { bg: "bg-red-500", bgLight: "bg-red-50 dark:bg-red-900/20", text: "text-red-600 dark:text-red-400", border: "border-red-200 dark:border-red-800", ring: "ring-red-500/30" };
    case "warning":
      return { bg: "bg-amber-500", bgLight: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-600 dark:text-amber-400", border: "border-amber-200 dark:border-amber-800", ring: "ring-amber-500/30" };
    default:
      return { bg: "bg-blue-500", bgLight: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-600 dark:text-blue-400", border: "border-blue-200 dark:border-blue-800", ring: "ring-blue-500/30" };
  }
}

function typeIcon(type: string) {
  switch (type) {
    case "low_eq": return <AlertTriangle className="w-4 h-4" />;
    case "low_competency": return <TrendingDown className="w-4 h-4" />;
    case "team_health": return <Users className="w-4 h-4" />;
    case "anomaly": return <Activity className="w-4 h-4" />;
    default: return <Bell className="w-4 h-4" />;
  }
}

function eqLevelBgClass(levelKey: string) {
  switch (levelKey) {
    case "expert": return "bg-emerald-500";
    case "skilled": return "bg-purple-500";
    case "functional": return "bg-blue-500";
    case "emerging": return "bg-amber-500";
    case "challenge": return "bg-red-500";
    default: return "bg-gray-500";
  }
}

function eqLevelTextClass(levelKey: string) {
  switch (levelKey) {
    case "expert": return "text-emerald-600 dark:text-emerald-400";
    case "skilled": return "text-purple-600 dark:text-purple-400";
    case "functional": return "text-blue-600 dark:text-blue-400";
    case "emerging": return "text-amber-600 dark:text-amber-400";
    case "challenge": return "text-red-600 dark:text-red-400";
    default: return "text-gray-600 dark:text-gray-400";
  }
}

function eqLevelRingClass(levelKey: string) {
  switch (levelKey) {
    case "expert": return "ring-emerald-500/30";
    case "skilled": return "ring-purple-500/30";
    case "functional": return "ring-blue-500/30";
    case "emerging": return "ring-amber-500/30";
    case "challenge": return "ring-red-500/30";
    default: return "ring-gray-500/30";
  }
}

function compLabel(comp: string, lang: string): string {
  const entry = COMP_LABELS[comp];
  if (!entry) return comp;
  return entry[lang as keyof typeof entry] || entry.es;
}

/* =========================================================
   Main Page Component
========================================================= */
export default function TPAlertsPage() {
  const { lang } = useI18n();
  const t = translations[lang as keyof typeof translations] || translations.es;

  /* ---- Filter state ---- */
  const [severityFilter, setSeverityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");

  /* ---- API data state ---- */
  const [countryGroups, setCountryGroups] = useState<StatsGroup[]>([]);
  const [regionGroups, setRegionGroups] = useState<StatsGroup[]>([]);
  const [overallStats, setOverallStats] = useState<OverallStat[]>([]);
  const [loading, setLoading] = useState(true);

  /* ---- Fetch real data from APIs ---- */
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [countryRes, regionRes, overallRes] = await Promise.all([
          fetch(`/api/admin/benchmarks/${TP_BENCHMARK_ID}/stats/grouped?groupBy=country`),
          fetch(`/api/admin/benchmarks/${TP_BENCHMARK_ID}/stats/grouped?groupBy=region`),
          fetch(`/api/admin/benchmarks/${TP_BENCHMARK_ID}/stats`),
        ]);
        const countryData = await countryRes.json();
        const regionData = await regionRes.json();
        const overallData = await overallRes.json();

        if (countryData.ok) setCountryGroups(countryData.groups);
        if (regionData.ok) setRegionGroups(regionData.groups);
        if (overallData.ok) setOverallStats(overallData.statistics);
      } catch (err) {
        console.error("Error loading alerts data:", err);
      }
      setLoading(false);
    }
    load();
  }, []);

  /* ---- Thresholds ---- */
  const thresholds = {
    eqCritical: 82,   // Below this = Challenge level
    eqWarning: 92,    // Below this = Emerging level
    compCritical: 82,  // Challenge threshold for individual competencies
    compWarning: 92,   // Emerging threshold for individual competencies
  };

  /* ---- Compute alerts from real country data ---- */
  const computedAlerts = useMemo<ComputedAlert[]>(() => {
    if (!countryGroups.length) return [];
    const alerts: ComputedAlert[] = [];
    const now = new Date().toISOString().split("T")[0];

    for (const group of countryGroups) {
      const eqMean = group.metrics.eqTotal?.mean;

      // EQ Total alerts — based on SEI levels
      if (eqMean !== undefined && eqMean < thresholds.eqCritical) {
        const lvl = getEqLevel(eqMean);
        alerts.push({
          id: `eq-critical-${group.name}`,
          type: "low_eq",
          severity: "critical",
          entity: group.name,
          entityType: "country",
          region: group.name,
          metric: "eqTotal",
          currentValue: eqMean,
          threshold: thresholds.eqCritical,
          detectedAt: now,
          status: "new",
          title: { es: `EQ Nivel Desafío ${lvl.emoji}`, en: `EQ Challenge Level ${lvl.emoji}` },
          description: {
            es: `${group.name} tiene EQ promedio de ${eqMean.toFixed(1)} — nivel ${lvl.label} (umbral: ${thresholds.eqCritical})`,
            en: `${group.name} has average EQ of ${eqMean.toFixed(1)} — ${lvl.labelEN} level (threshold: ${thresholds.eqCritical})`,
          },
        });
      } else if (eqMean !== undefined && eqMean < thresholds.eqWarning) {
        const lvl = getEqLevel(eqMean);
        alerts.push({
          id: `eq-warning-${group.name}`,
          type: "low_eq",
          severity: "warning",
          entity: group.name,
          entityType: "country",
          region: group.name,
          metric: "eqTotal",
          currentValue: eqMean,
          threshold: thresholds.eqWarning,
          detectedAt: now,
          status: "new",
          title: { es: `EQ Nivel Emergente ${lvl.emoji}`, en: `EQ Emerging Level ${lvl.emoji}` },
          description: {
            es: `${group.name} tiene EQ promedio de ${eqMean.toFixed(1)} — nivel ${lvl.label} (umbral: ${thresholds.eqWarning})`,
            en: `${group.name} has average EQ of ${eqMean.toFixed(1)} — ${lvl.labelEN} level (threshold: ${thresholds.eqWarning})`,
          },
        });
      }

      // Check each competency — using SEI level thresholds
      for (const comp of COMP_KEYS) {
        const val = group.metrics[comp]?.mean;
        if (val !== undefined && val < thresholds.compCritical) {
          const lvl = getEqLevel(val);
          alerts.push({
            id: `comp-critical-${comp}-${group.name}`,
            type: "low_competency",
            severity: "critical",
            entity: group.name,
            entityType: "country",
            region: group.name,
            metric: comp,
            currentValue: val,
            threshold: thresholds.compCritical,
            detectedAt: now,
            status: "new",
            title: { es: `${comp} Nivel ${lvl.label} ${lvl.emoji}`, en: `${comp} ${lvl.labelEN} Level ${lvl.emoji}` },
            description: {
              es: `${group.name} tiene ${compLabel(comp, "es")} en ${val.toFixed(1)} — nivel ${lvl.label}`,
              en: `${group.name} has ${compLabel(comp, "en")} at ${val.toFixed(1)} — ${lvl.labelEN} level`,
            },
          });
        } else if (val !== undefined && val < thresholds.compWarning) {
          const lvl = getEqLevel(val);
          alerts.push({
            id: `comp-warning-${comp}-${group.name}`,
            type: "low_competency",
            severity: "warning",
            entity: group.name,
            entityType: "country",
            region: group.name,
            metric: comp,
            currentValue: val,
            threshold: thresholds.compWarning,
            detectedAt: now,
            status: "new",
            title: { es: `${comp} Nivel ${lvl.label} ${lvl.emoji}`, en: `${comp} ${lvl.labelEN} Level ${lvl.emoji}` },
            description: {
              es: `${group.name} tiene ${compLabel(comp, "es")} en ${val.toFixed(1)} — nivel ${lvl.label}`,
              en: `${group.name} has ${compLabel(comp, "en")} at ${val.toFixed(1)} — ${lvl.labelEN} level`,
            },
          });
        }
      }

      // EQ Level check — based on actual SEI levels
      // Challenge (65-81) = critical, Emerging (82-91) = warning
      if (eqMean !== undefined) {
        const level = getEqLevel(eqMean);
        if (level.key === "challenge") {
          alerts.push({
            id: `level-critical-${group.name}`,
            type: "team_health",
            severity: "critical",
            entity: group.name,
            entityType: "country",
            region: group.name,
            metric: "eqLevel",
            currentValue: eqMean,
            threshold: 82,
            detectedAt: now,
            status: "new",
            title: { es: `Nivel Desafío ${level.emoji}`, en: `Challenge Level ${level.emoji}` },
            description: {
              es: `${group.name} tiene EQ promedio de ${eqMean.toFixed(1)} — nivel Desafío. Requiere atención inmediata.`,
              en: `${group.name} has average EQ of ${eqMean.toFixed(1)} — Challenge level. Requires immediate attention.`,
            },
          });
        } else if (level.key === "emerging") {
          alerts.push({
            id: `level-warning-${group.name}`,
            type: "team_health",
            severity: "warning",
            entity: group.name,
            entityType: "country",
            region: group.name,
            metric: "eqLevel",
            currentValue: eqMean,
            threshold: 92,
            detectedAt: now,
            status: "new",
            title: { es: `Nivel Emergente ${level.emoji}`, en: `Emerging Level ${level.emoji}` },
            description: {
              es: `${group.name} tiene EQ promedio de ${eqMean.toFixed(1)} — nivel Emergente. Oportunidad de desarrollo.`,
              en: `${group.name} has average EQ of ${eqMean.toFixed(1)} — Emerging level. Development opportunity.`,
            },
          });
        }
      }
    }

    // Sort: critical first, then warning, then info
    const severityOrder: Record<string, number> = { critical: 0, warning: 1, info: 2 };
    alerts.sort((a, b) => (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9));

    return alerts;
  }, [countryGroups]);

  /* ---- Team health grid from real country data ---- */
  const teamHealthGrid = useMemo<TeamHealthItem[]>(() => {
    return countryGroups.map((group) => {
      const metrics = group.metrics;
      const avgEQ = metrics.eqTotal?.mean || 0;
      const level = getEqLevel(avgEQ);
      const compValues = COMP_KEYS.map((k) => metrics[k]?.mean || 100);
      const maxVal = Math.max(...compValues);
      const minVal = Math.min(...compValues);
      const strongest = COMP_KEYS[compValues.indexOf(maxVal)];
      const weakest = COMP_KEYS[compValues.indexOf(minVal)];
      return {
        name: group.name,
        count: group.count,
        avgEQ,
        eqLevel: { key: level.key, label: level.label, labelEN: level.labelEN, color: level.color, emoji: level.emoji },
        strength: strongest,
        gap: weakest,
      };
    });
  }, [countryGroups]);

  /* ---- Region metrics for monitoring section ---- */
  const regionMetricsData = useMemo(() => {
    const metricKeys = ["eqTotal", ...COMP_KEYS];
    return metricKeys.map((key) => {
      const regionValues: { name: string; mean: number }[] = regionGroups.map((rg) => ({
        name: rg.name,
        mean: rg.metrics[key]?.mean ?? 0,
      }));
      // Overall mean from stats
      const overallStat = overallStats.find((s) => s.metricKey === key);
      const overallMean = overallStat?.mean ?? 0;
      return {
        key,
        label: key === "eqTotal" ? "EQ Total" : key,
        overallMean: Math.round(overallMean * 100) / 100,
        regions: regionValues,
      };
    });
  }, [regionGroups, overallStats]);

  /* ---- Unique regions from alerts for region filter ---- */
  const uniqueRegions = useMemo(() => {
    const regions = new Set(regionGroups.map((rg) => rg.name));
    return Array.from(regions).sort();
  }, [regionGroups]);

  /* ---- Filtered alerts ---- */
  const filteredAlerts = useMemo(() => {
    return computedAlerts.filter((a) => {
      if (severityFilter !== "all" && a.severity !== severityFilter) return false;
      if (typeFilter !== "all" && a.type !== typeFilter) return false;
      // Region filter: match if alert entity is in the region
      // We skip region filtering for now since alerts are per-country, not per-region
      return true;
    });
  }, [computedAlerts, severityFilter, typeFilter]);

  const totalCount = computedAlerts.length;
  const criticalCount = computedAlerts.filter((a) => a.severity === "critical").length;
  const warningCount = computedAlerts.filter((a) => a.severity === "warning").length;
  const infoCount = computedAlerts.filter((a) => a.severity === "info").length;

  /* ---- Loading State ---- */
  if (loading) {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div>
          <Link href="/hub/admin/tp" className="inline-flex items-center gap-2 text-sm text-[var(--rowi-muted)] hover:text-purple-500 transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" /> {t.backToHub}
          </Link>
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-500 mb-3">
              <Bell className="w-3 h-3" /> {t.badgeAlerts}
            </span>
            <h1 className="text-3xl font-bold mb-2">{t.pageTitle}</h1>
            <p className="text-[var(--rowi-muted)]">{t.pageSubtitle}</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            <p className="text-[var(--rowi-muted)] text-sm">{t.loading}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link href="/hub/admin/tp" className="inline-flex items-center gap-2 text-sm text-[var(--rowi-muted)] hover:text-purple-500 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> {t.backToHub}
        </Link>
        <div>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-500 mb-3">
            <Bell className="w-3 h-3" /> {t.badgeAlerts}
          </span>
          <h1 className="text-3xl font-bold mb-2">{t.pageTitle}</h1>
          <p className="text-[var(--rowi-muted)]">{t.pageSubtitle}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t.totalAlerts, value: totalCount, color: "text-purple-600 dark:text-purple-400", bgColor: "bg-purple-50 dark:bg-purple-900/20", borderColor: "border-purple-200 dark:border-purple-800", icon: Bell },
          { label: t.critical, value: criticalCount, color: "text-red-600 dark:text-red-400", bgColor: "bg-red-50 dark:bg-red-900/20", borderColor: "border-red-200 dark:border-red-800", icon: AlertTriangle },
          { label: t.warning, value: warningCount, color: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-50 dark:bg-amber-900/20", borderColor: "border-amber-200 dark:border-amber-800", icon: AlertCircle },
          { label: t.informational, value: infoCount, color: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-50 dark:bg-blue-900/20", borderColor: "border-blue-200 dark:border-blue-800", icon: Info },
        ].map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className={`${card.bgColor} rounded-xl p-5 border ${card.borderColor} text-center`}>
            <card.icon className={`w-6 h-6 mx-auto mb-2 ${card.color}`} />
            <div className={`text-3xl font-bold ${card.color}`}>{card.value}</div>
            <div className="text-xs text-[var(--rowi-muted)] mt-1 font-medium">{card.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Filter Bar */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-gray-100 dark:border-zinc-800 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-medium text-[var(--rowi-muted)] mb-1.5 block">{t.filterSeverity}</label>
            <div className="flex flex-wrap gap-1.5">
              {[{ key: "all", label: t.all }, { key: "critical", label: t.severityCritical }, { key: "warning", label: t.severityWarning }, { key: "info", label: t.severityInfo }].map((opt) => (
                <button key={opt.key} onClick={() => setSeverityFilter(opt.key)} className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${severityFilter === opt.key ? "bg-purple-500 text-white" : "bg-gray-100 dark:bg-zinc-800 text-[var(--rowi-muted)] hover:bg-gray-200 dark:hover:bg-zinc-700"}`}>{opt.label}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--rowi-muted)] mb-1.5 block">{t.filterType}</label>
            <div className="flex flex-wrap gap-1.5">
              {[{ key: "all", label: t.all }, { key: "low_eq", label: t.typeLowEQ }, { key: "low_competency", label: t.typeDeclining }, { key: "team_health", label: t.typeTeamHealth }].map((opt) => (
                <button key={opt.key} onClick={() => setTypeFilter(opt.key)} className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${typeFilter === opt.key ? "bg-purple-500 text-white" : "bg-gray-100 dark:bg-zinc-800 text-[var(--rowi-muted)] hover:bg-gray-200 dark:hover:bg-zinc-700"}`}>{opt.label}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--rowi-muted)] mb-1.5 block">{t.filterRegion}</label>
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => setRegionFilter("all")} className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${regionFilter === "all" ? "bg-purple-500 text-white" : "bg-gray-100 dark:bg-zinc-800 text-[var(--rowi-muted)] hover:bg-gray-200 dark:hover:bg-zinc-700"}`}>{t.all}</button>
              {uniqueRegions.map((r) => (
                <button key={r} onClick={() => setRegionFilter(r)} className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${regionFilter === r ? "bg-purple-500 text-white" : "bg-gray-100 dark:bg-zinc-800 text-[var(--rowi-muted)] hover:bg-gray-200 dark:hover:bg-zinc-700"}`}>{r}</button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Active Alerts List */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2"><AlertTriangle className="w-6 h-6 text-purple-500" /> {t.activeAlertsTitle}</h2>
          <p className="text-[var(--rowi-muted)]">{t.activeAlertsDesc}</p>
        </div>
        {filteredAlerts.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-zinc-900 rounded-xl p-8 border border-gray-100 dark:border-zinc-800 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <p className="text-[var(--rowi-muted)]">{t.noAlertsMatch}</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {filteredAlerts.map((alert, i) => {
              const sev = severityColor(alert.severity);
              const alertTitle = alert.title[lang as keyof typeof alert.title] || alert.title.es;
              const alertDesc = alert.description[lang as keyof typeof alert.description] || alert.description.es;
              return (
                <motion.div key={alert.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className={`${sev.bgLight} rounded-xl p-5 border ${sev.border} shadow-sm`}>
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className={`w-3 h-3 rounded-full ${sev.bg} ring-4 ${sev.ring}`} />
                      <div className={sev.text}>{typeIcon(alert.type)}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`font-semibold ${sev.text}`}>{alertTitle}</span>
                        <span className="text-[10px] font-mono text-[var(--rowi-muted)] bg-gray-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">{alert.id}</span>
                      </div>
                      <p className="text-sm text-[var(--rowi-muted)] mb-3">{alertDesc}</p>
                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        <span className="inline-flex items-center gap-1 font-medium">
                          {alert.entityType === "country" ? <Globe className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                          {alert.entity}
                        </span>
                        {alert.currentValue > 0 && (
                          <span className="text-[var(--rowi-muted)]">
                            {alert.metric}: <span className={`font-semibold ${sev.text}`}>{alert.currentValue}</span> / {t.threshold}: {alert.threshold}
                          </span>
                        )}
                        <span className="text-[var(--rowi-muted)] inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {t.detected}: {alert.detectedAt}</span>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                        <Clock className="w-3 h-3" />
                        {t.statusNew}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Team Health Overview */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2"><Users className="w-6 h-6 text-purple-500" /> {t.teamHealthTitle}</h2>
          <p className="text-[var(--rowi-muted)]">{t.teamHealthDesc}</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {teamHealthGrid.map((team, i) => {
            const levelLabel = lang === "en" ? team.eqLevel.labelEN : team.eqLevel.label;
            return (
            <motion.div key={team.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }} className="bg-white dark:bg-zinc-900 rounded-xl p-5 border border-gray-100 dark:border-zinc-800 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-4 h-4 rounded-full ${eqLevelBgClass(team.eqLevel.key)} ring-2 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900 ${eqLevelRingClass(team.eqLevel.key)}`} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{team.name}</div>
                  <span className="text-[10px] font-mono text-[var(--rowi-muted)] bg-gray-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">{team.count} {t.assessments}</span>
                </div>
              </div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[var(--rowi-muted)]">{t.avgEQ}</span>
                <span className="text-sm font-mono font-medium">{team.avgEQ.toFixed(1)}</span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-[var(--rowi-muted)]">{t.health}</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{team.eqLevel.emoji}</span>
                  <span className={`text-lg font-bold ${eqLevelTextClass(team.eqLevel.key)}`}>{levelLabel}</span>
                </div>
              </div>
              {/* EQ level bar — shows position within SEI scale 65-135 */}
              <div className="relative h-3 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden mb-3">
                {/* Color segments for each level */}
                <div className="absolute inset-0 flex">
                  <div className="h-full bg-red-400/30" style={{ width: `${((81 - 65) / 70) * 100}%` }} />
                  <div className="h-full bg-amber-400/30" style={{ width: `${((91 - 81) / 70) * 100}%` }} />
                  <div className="h-full bg-blue-400/30" style={{ width: `${((107 - 91) / 70) * 100}%` }} />
                  <div className="h-full bg-purple-400/30" style={{ width: `${((117 - 107) / 70) * 100}%` }} />
                  <div className="h-full bg-emerald-400/30" style={{ width: `${((135 - 117) / 70) * 100}%` }} />
                </div>
                {/* Marker for current EQ */}
                <motion.div
                  className={`absolute top-0 h-full w-1 rounded-full ${eqLevelBgClass(team.eqLevel.key)} shadow-sm`}
                  initial={{ left: "0%" }}
                  whileInView={{ left: `${Math.max(0, Math.min(100, ((team.avgEQ - 65) / 70) * 100))}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-[var(--rowi-muted)] mb-3">
                <span>65</span>
                <span>92</span>
                <span>108</span>
                <span>135</span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--rowi-muted)]">{t.topStrength}</span>
                  <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">{team.strength}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--rowi-muted)]">{t.biggestGap}</span>
                  <span className="font-mono font-medium text-amber-600 dark:text-amber-400">{team.gap}</span>
                </div>
              </div>
            </motion.div>
            );
          })}
        </div>
      </div>

      {/* Alert Configuration */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2"><Settings className="w-6 h-6 text-purple-500" /> {t.configTitle}</h2>
          <p className="text-[var(--rowi-muted)]">{t.configDesc}</p>
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden">
          <div className="grid grid-cols-4 gap-4 px-6 py-3 bg-gray-50 dark:bg-zinc-800/50 border-b border-gray-100 dark:border-zinc-800 text-xs font-semibold text-[var(--rowi-muted)] uppercase tracking-wider">
            <span>{t.metric}</span>
            <span className="text-center">{t.warningThreshold}</span>
            <span className="text-center">{t.criticalThreshold}</span>
            <span className="text-center">{t.enabled}</span>
          </div>
          {ALERT_CONFIGS.map((cfg, i) => {
            const cfgLabel = cfg.label[lang as keyof typeof cfg.label] || cfg.label.es;
            return (
              <motion.div key={cfg.metric} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className={`grid grid-cols-4 gap-4 px-6 py-4 items-center ${i < ALERT_CONFIGS.length - 1 ? "border-b border-gray-100 dark:border-zinc-800" : ""}`}>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-500" />
                  <span className="font-medium text-sm">{cfgLabel}</span>
                </div>
                <div className="text-center">
                  <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-sm font-mono font-medium">{cfg.warningThreshold}</span>
                </div>
                <div className="text-center">
                  <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm font-mono font-medium">{cfg.criticalThreshold}</span>
                </div>
                <div className="flex justify-center">
                  <div className={`w-10 h-6 rounded-full relative transition-colors ${cfg.enabled ? "bg-emerald-500" : "bg-gray-300 dark:bg-zinc-700"}`}>
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${cfg.enabled ? "left-[18px]" : "left-0.5"}`} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Region Metrics Monitoring */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2"><TrendingUp className="w-6 h-6 text-purple-500" /> {t.trendMonitorTitle}</h2>
          <p className="text-[var(--rowi-muted)]">{t.trendMonitorDesc}</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {regionMetricsData.map((rm, i) => {
            const allMeans = rm.regions.map((r) => r.mean).filter((v) => v > 0);
            const maxMean = allMeans.length > 0 ? Math.max(...allMeans) : 0;
            const minMean = allMeans.length > 0 ? Math.min(...allMeans) : 0;
            const spread = maxMean - minMean;
            return (
              <motion.div key={rm.key} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }} className="bg-white dark:bg-zinc-900 rounded-xl p-5 border border-gray-100 dark:border-zinc-800 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-sm">{rm.label}</span>
                  <span className="text-xs font-mono text-[var(--rowi-muted)]">{t.mean}: {rm.overallMean}</span>
                </div>
                <div className="space-y-2">
                  {rm.regions.map((region) => {
                    const isAboveAvg = region.mean >= rm.overallMean;
                    return (
                      <div key={region.name} className="flex items-center gap-2">
                        <span className="text-[10px] text-[var(--rowi-muted)] w-20 truncate">{region.name}</span>
                        <div className="flex-1 h-2 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${isAboveAvg ? "bg-emerald-500" : "bg-amber-500"}`}
                            style={{ width: `${rm.overallMean > 0 ? Math.min(100, (region.mean / (rm.overallMean * 1.15)) * 100) : 0}%` }}
                          />
                        </div>
                        <span className={`text-xs font-mono font-medium w-12 text-right ${isAboveAvg ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                          {region.mean.toFixed(1)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800 text-xs text-[var(--rowi-muted)]">
                  <span className="font-medium">{lang === "es" ? "Rango" : "Spread"}: {spread.toFixed(1)}</span>{" "}
                  ({minMean.toFixed(1)} — {maxMean.toFixed(1)})
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Info Box */}
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl p-6 flex gap-4">
        <Shield className="w-6 h-6 text-purple-500 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-1">{t.infoTitle}</h3>
          <p className="text-sm text-purple-700 dark:text-purple-300">{t.infoDesc}</p>
        </div>
      </motion.div>

      {/* Navigation Footer */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between pt-6 border-t border-gray-200 dark:border-zinc-800">
        <Link href="/hub/admin/tp/world" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border-2 border-gray-200 dark:border-zinc-700 hover:border-purple-500 transition-colors font-medium">
          <ArrowLeft className="w-5 h-5" /> {t.navPrev}
        </Link>
        <Link href="/hub/admin/tp/data-quality" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:opacity-90 transition-opacity">
          {t.navNext} <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
