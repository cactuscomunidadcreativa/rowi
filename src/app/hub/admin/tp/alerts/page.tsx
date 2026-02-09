"use client";

import { useState } from "react";
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
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

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
    teamHealthTitle: "Salud de Equipos",
    teamHealthDesc: "Vista general del estado de salud EQ por equipo con indicadores semáforo",
    health: "Salud",
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
    trendMonitorTitle: "Monitoreo de Tendencias",
    trendMonitorDesc: "Indicadores de dirección de tendencia para métricas clave — últimos 4 trimestres",
    q1: "Q1",
    q2: "Q2",
    q3: "Q3",
    q4: "Q4",
    infoTitle: "Sistema de Alertas EQ",
    infoDesc: "Las alertas se generan automáticamente basándose en umbrales configurados, análisis de tendencias y detección de anomalías sobre datos SEI de Teleperformance. Todos los datos individuales permanecen anonimizados.",
    navPrev: "World",
    navNext: "Data Quality",
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
    teamHealthTitle: "Team Health Overview",
    teamHealthDesc: "EQ health status overview by team with traffic light indicators",
    health: "Health",
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
    trendMonitorTitle: "Trend Monitoring",
    trendMonitorDesc: "Trend direction indicators for key metrics — last 4 quarters",
    q1: "Q1",
    q2: "Q2",
    q3: "Q3",
    q4: "Q4",
    infoTitle: "EQ Alert System",
    infoDesc: "Alerts are automatically generated based on configured thresholds, trend analysis, and anomaly detection over Teleperformance SEI data. All individual data remains anonymized.",
    navPrev: "World",
    navNext: "Data Quality",
  },
};

/* =========================================================
   Mock Data
========================================================= */
const ALERTS = [
  { id: "ALT-001", type: "low_eq", severity: "critical", title: { es: "EQ Cr\u00edticamente Bajo", en: "Critically Low EQ" }, description: { es: "James O'Brien (TP-1456) tiene un EQ de 95.3, por debajo del umbral m\u00ednimo de 96 para IT Support Manager", en: "James O'Brien (TP-1456) has an EQ of 95.3, below the minimum threshold of 96 for IT Support Manager" }, entity: "James O'Brien", entityType: "person", region: "NA", metric: "eqTotal", currentValue: 95.3, threshold: 96, detectedAt: "2024-12-15", status: "new" },
  { id: "ALT-002", type: "team_health", severity: "critical", title: { es: "Equipo con Salud Baja", en: "Low Team Health" }, description: { es: "Berlin Ops tiene un score de salud de 74, por debajo del umbral cr\u00edtico de 75", en: "Berlin Ops has a health score of 74, below the critical threshold of 75" }, entity: "Berlin Ops", entityType: "team", region: "EMEA", metric: "healthScore", currentValue: 74, threshold: 75, detectedAt: "2024-12-14", status: "new" },
  { id: "ALT-003", type: "declining_trend", severity: "critical", title: { es: "Tendencia Declinante Sostenida", en: "Sustained Declining Trend" }, description: { es: "APAC regi\u00f3n muestra descenso de -2.1 puntos en EMP durante los \u00faltimos 2 trimestres", en: "APAC region shows -2.1 point decline in EMP over the last 2 quarters" }, entity: "APAC Region", entityType: "region", region: "APAC", metric: "EMP", currentValue: 96.8, threshold: 98.0, trend: -2.1, detectedAt: "2024-12-12", status: "acknowledged" },
  { id: "ALT-004", type: "low_eq", severity: "warning", title: { es: "EQ Bajo", en: "Low EQ" }, description: { es: "C\u00f3ndor CX team promedio de 101.8, cercano al umbral m\u00ednimo para Customer Experience", en: "C\u00f3ndor CX team average of 101.8, approaching minimum threshold for Customer Experience" }, entity: "C\u00f3ndor CX", entityType: "team", region: "LATAM", metric: "eqTotal", currentValue: 101.8, threshold: 103, detectedAt: "2024-12-13", status: "new" },
  { id: "ALT-005", type: "declining_trend", severity: "warning", title: { es: "Tendencia Declinante", en: "Declining Trend" }, description: { es: "Phoenix Support muestra descenso de -1.4 en NE en el \u00faltimo trimestre", en: "Phoenix Support shows -1.4 decline in NE over last quarter" }, entity: "Phoenix Support", entityType: "team", region: "NA", metric: "NE", currentValue: 101.2, threshold: 102, trend: -1.4, detectedAt: "2024-12-10", status: "new" },
  { id: "ALT-006", type: "anomaly", severity: "warning", title: { es: "Anomal\u00eda Detectada", en: "Anomaly Detected" }, description: { es: "Score de RP inusualmente alto (134.2) detectado en evaluaci\u00f3n reciente \u2014 posible dato inv\u00e1lido", en: "Unusually high RP score (134.2) detected in recent assessment \u2014 possible invalid data" }, entity: "Assessment #14872", entityType: "person", region: "EMEA", metric: "RP", currentValue: 134.2, threshold: 130, detectedAt: "2024-12-11", status: "new" },
  { id: "ALT-007", type: "team_health", severity: "warning", title: { es: "Equipo Necesita Atenci\u00f3n", en: "Team Needs Attention" }, description: { es: "C\u00f3ndor CX tiene un score de salud de 78, en zona de precauci\u00f3n", en: "C\u00f3ndor CX has a health score of 78, in caution zone" }, entity: "C\u00f3ndor CX", entityType: "team", region: "LATAM", metric: "healthScore", currentValue: 78, threshold: 80, detectedAt: "2024-12-09", status: "acknowledged" },
  { id: "ALT-008", type: "low_eq", severity: "info", title: { es: "EQ por Debajo del Promedio", en: "EQ Below Average" }, description: { es: "5 empleados nuevos en NA tienen EQ promedio de 94.2 \u2014 considerar programa de desarrollo", en: "5 new employees in NA have average EQ of 94.2 \u2014 consider development program" }, entity: "NA New Hires", entityType: "region", region: "NA", metric: "eqTotal", currentValue: 94.2, threshold: 98.7, detectedAt: "2024-12-08", status: "new" },
  { id: "ALT-009", type: "declining_trend", severity: "info", title: { es: "Leve Descenso en OP", en: "Slight OP Decline" }, description: { es: "EMEA muestra leve descenso de -0.8 en Optimismo \u2014 monitorear en pr\u00f3ximo trimestre", en: "EMEA shows slight -0.8 decline in Optimism \u2014 monitor next quarter" }, entity: "EMEA Region", entityType: "region", region: "EMEA", metric: "OP", currentValue: 99.1, threshold: 100.0, trend: -0.8, detectedAt: "2024-12-07", status: "resolved" },
  { id: "ALT-010", type: "anomaly", severity: "info", title: { es: "Patron Inusual", en: "Unusual Pattern" }, description: { es: "Correlaci\u00f3n inesperada entre EL bajo y effectiveness alto en equipo de IT", en: "Unexpected correlation between low EL and high effectiveness in IT team" }, entity: "Tech Shield", entityType: "team", region: "NA", metric: "EL", currentValue: 104.6, threshold: 100.0, detectedAt: "2024-12-06", status: "acknowledged" },
  { id: "ALT-011", type: "team_health", severity: "info", title: { es: "Equipo Nuevo sin Baseline", en: "New Team Without Baseline" }, description: { es: "3 equipos nuevos en LATAM a\u00fan no tienen evaluaci\u00f3n baseline completa", en: "3 new teams in LATAM still don't have complete baseline assessment" }, entity: "LATAM New Teams", entityType: "region", region: "LATAM", metric: "healthScore", currentValue: 0, threshold: 0, detectedAt: "2024-12-05", status: "new" },
];

const ALERT_CONFIGS = [
  { metric: "eqTotal", label: { es: "EQ Total", en: "EQ Total" }, warningThreshold: 95, criticalThreshold: 90, enabled: true },
  { metric: "healthScore", label: { es: "Salud de Equipo", en: "Team Health" }, warningThreshold: 80, criticalThreshold: 75, enabled: true },
  { metric: "trend", label: { es: "Tendencia Trimestral", en: "Quarterly Trend" }, warningThreshold: -1.0, criticalThreshold: -2.0, enabled: true },
  { metric: "reliability", label: { es: "\u00cdndice de Confiabilidad", en: "Reliability Index" }, warningThreshold: 0.7, criticalThreshold: 0.5, enabled: true },
  { metric: "anomaly", label: { es: "Detecci\u00f3n de Anomal\u00edas", en: "Anomaly Detection" }, warningThreshold: 2.0, criticalThreshold: 3.0, enabled: true },
];

const TEAM_HEALTH_GRID = [
  { name: "Phoenix Support", region: "NA", health: 82, trend: "stable", topStrength: "IM", biggestGap: "NE" },
  { name: "Jaguar Sales", region: "LATAM", health: 91, trend: "up", topStrength: "EMP", biggestGap: "EL" },
  { name: "Sakura People", region: "APAC", health: 95, trend: "up", topStrength: "EMP", biggestGap: "NG" },
  { name: "Berlin Ops", region: "EMEA", health: 74, trend: "down", topStrength: "RP", biggestGap: "NE" },
  { name: "Mumbai Quality", region: "APAC", health: 88, trend: "stable", topStrength: "RP", biggestGap: "NE" },
  { name: "Tech Shield", region: "NA", health: 85, trend: "up", topStrength: "RP", biggestGap: "EMP" },
  { name: "UK Academy", region: "EMEA", health: 92, trend: "up", topStrength: "EMP", biggestGap: "NG" },
  { name: "C\u00f3ndor CX", region: "LATAM", health: 78, trend: "down", topStrength: "EMP", biggestGap: "EL" },
];

const TREND_METRICS = [
  { key: "EQ Total", quarters: [98.2, 98.5, 98.7, 98.7], direction: "stable" as const },
  { key: "EMP", quarters: [100.1, 99.6, 99.2, 98.9], direction: "down" as const },
  { key: "NE", quarters: [95.8, 96.2, 96.5, 96.8], direction: "up" as const },
  { key: "RP", quarters: [99.0, 99.1, 99.1, 99.1], direction: "stable" as const },
  { key: "OP", quarters: [100.2, 100.0, 99.7, 99.5], direction: "down" as const },
  { key: "Team Health", quarters: [83, 84, 85, 84], direction: "stable" as const },
];

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

function statusColor(status: string) {
  switch (status) {
    case "new": return "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300";
    case "acknowledged": return "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300";
    case "resolved": return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300";
    default: return "bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300";
  }
}

function statusIcon(status: string) {
  switch (status) {
    case "new": return <Clock className="w-3 h-3" />;
    case "acknowledged": return <Eye className="w-3 h-3" />;
    case "resolved": return <CheckCircle2 className="w-3 h-3" />;
    default: return <Clock className="w-3 h-3" />;
  }
}

function typeIcon(type: string) {
  switch (type) {
    case "low_eq": return <AlertTriangle className="w-4 h-4" />;
    case "declining_trend": return <TrendingDown className="w-4 h-4" />;
    case "team_health": return <Users className="w-4 h-4" />;
    case "anomaly": return <Activity className="w-4 h-4" />;
    default: return <Bell className="w-4 h-4" />;
  }
}

function healthColor(health: number) {
  if (health > 85) return "bg-emerald-500";
  if (health >= 75) return "bg-amber-500";
  return "bg-red-500";
}

function healthTextColor(health: number) {
  if (health > 85) return "text-emerald-600 dark:text-emerald-400";
  if (health >= 75) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

/* =========================================================
   Mini Sparkline
========================================================= */
function MiniSparkline({ quarters, direction }: { quarters: number[]; direction: "up" | "down" | "stable" }) {
  const min = Math.min(...quarters) - 1;
  const max = Math.max(...quarters) + 1;
  const range = max - min || 1;
  const h = 32;
  const w = 80;
  const points = quarters.map((v, i) => {
    const x = (i / (quarters.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  });
  const pathD = `M ${points.join(" L ")}`;
  const color = direction === "up" ? "#10b981" : direction === "down" ? "#ef4444" : "#6b7280";
  return (
    <svg width={w} height={h} className="flex-shrink-0">
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {quarters.map((v, i) => {
        const x = (i / (quarters.length - 1)) * w;
        const y = h - ((v - min) / range) * h;
        return <circle key={i} cx={x} cy={y} r="2.5" fill={color} />;
      })}
    </svg>
  );
}

/* =========================================================
   Main Page Component
========================================================= */
export default function TPAlertsPage() {
  const { lang } = useI18n();
  const t = translations[lang as keyof typeof translations] || translations.es;
  const [severityFilter, setSeverityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredAlerts = ALERTS.filter((a) => {
    if (severityFilter !== "all" && a.severity !== severityFilter) return false;
    if (typeFilter !== "all" && a.type !== typeFilter) return false;
    if (regionFilter !== "all" && a.region !== regionFilter) return false;
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    return true;
  });

  const totalCount = ALERTS.length;
  const criticalCount = ALERTS.filter((a) => a.severity === "critical").length;
  const warningCount = ALERTS.filter((a) => a.severity === "warning").length;
  const infoCount = ALERTS.filter((a) => a.severity === "info").length;

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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              {[{ key: "all", label: t.all }, { key: "low_eq", label: t.typeLowEQ }, { key: "declining_trend", label: t.typeDeclining }, { key: "team_health", label: t.typeTeamHealth }, { key: "anomaly", label: t.typeAnomaly }].map((opt) => (
                <button key={opt.key} onClick={() => setTypeFilter(opt.key)} className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${typeFilter === opt.key ? "bg-purple-500 text-white" : "bg-gray-100 dark:bg-zinc-800 text-[var(--rowi-muted)] hover:bg-gray-200 dark:hover:bg-zinc-700"}`}>{opt.label}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--rowi-muted)] mb-1.5 block">{t.filterRegion}</label>
            <div className="flex flex-wrap gap-1.5">
              {[{ key: "all", label: t.all }, { key: "NA", label: t.regionNA }, { key: "LATAM", label: t.regionLATAM }, { key: "APAC", label: t.regionAPAC }, { key: "EMEA", label: t.regionEMEA }].map((opt) => (
                <button key={opt.key} onClick={() => setRegionFilter(opt.key)} className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${regionFilter === opt.key ? "bg-purple-500 text-white" : "bg-gray-100 dark:bg-zinc-800 text-[var(--rowi-muted)] hover:bg-gray-200 dark:hover:bg-zinc-700"}`}>{opt.label}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--rowi-muted)] mb-1.5 block">{t.filterStatus}</label>
            <div className="flex flex-wrap gap-1.5">
              {[{ key: "all", label: t.all }, { key: "new", label: t.statusNew }, { key: "acknowledged", label: t.statusAcknowledged }, { key: "resolved", label: t.statusResolved }].map((opt) => (
                <button key={opt.key} onClick={() => setStatusFilter(opt.key)} className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${statusFilter === opt.key ? "bg-purple-500 text-white" : "bg-gray-100 dark:bg-zinc-800 text-[var(--rowi-muted)] hover:bg-gray-200 dark:hover:bg-zinc-700"}`}>{opt.label}</button>
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
                          {alert.entityType === "team" ? <Users className="w-3 h-3" /> : alert.entityType === "region" ? <Globe className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                          {alert.entity}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-[var(--rowi-muted)] font-mono text-[10px]">{alert.region}</span>
                        {alert.currentValue > 0 && (
                          <span className="text-[var(--rowi-muted)]">
                            {alert.metric}: <span className={`font-semibold ${sev.text}`}>{alert.currentValue}</span> / {t.threshold}: {alert.threshold}
                          </span>
                        )}
                        {"trend" in alert && alert.trend && (
                          <span className="inline-flex items-center gap-1 text-red-500 font-medium"><TrendingDown className="w-3 h-3" /> {alert.trend}</span>
                        )}
                        <span className="text-[var(--rowi-muted)] inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {t.detected}: {alert.detectedAt}</span>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${statusColor(alert.status)}`}>
                        {statusIcon(alert.status)}
                        {alert.status === "new" ? t.statusNew : alert.status === "acknowledged" ? t.statusAcknowledged : t.statusResolved}
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
          {TEAM_HEALTH_GRID.map((team, i) => (
            <motion.div key={team.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }} className="bg-white dark:bg-zinc-900 rounded-xl p-5 border border-gray-100 dark:border-zinc-800 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-4 h-4 rounded-full ${healthColor(team.health)} ring-2 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900 ${team.health > 85 ? "ring-emerald-500/30" : team.health >= 75 ? "ring-amber-500/30" : "ring-red-500/30"}`} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{team.name}</div>
                  <span className="text-[10px] font-mono text-[var(--rowi-muted)] bg-gray-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">{team.region}</span>
                </div>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-[var(--rowi-muted)]">{t.health}</span>
                <span className={`text-2xl font-bold ${healthTextColor(team.health)}`}>{team.health}</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden mb-3">
                <motion.div className={`h-full rounded-full ${healthColor(team.health)}`} initial={{ width: 0 }} whileInView={{ width: `${team.health}%` }} viewport={{ once: true }} transition={{ duration: 0.8, ease: "easeOut" }} />
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--rowi-muted)]">{t.trend}</span>
                  <span className={`inline-flex items-center gap-1 font-medium ${team.trend === "up" ? "text-emerald-600 dark:text-emerald-400" : team.trend === "down" ? "text-red-600 dark:text-red-400" : "text-gray-500"}`}>
                    {team.trend === "up" ? <TrendingUp className="w-3 h-3" /> : team.trend === "down" ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                    {team.trend === "up" ? t.trendUp : team.trend === "down" ? t.trendDown : t.trendStable}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--rowi-muted)]">{t.topStrength}</span>
                  <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">{team.topStrength}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--rowi-muted)]">{t.biggestGap}</span>
                  <span className="font-mono font-medium text-amber-600 dark:text-amber-400">{team.biggestGap}</span>
                </div>
              </div>
            </motion.div>
          ))}
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

      {/* Trend Monitoring */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2"><TrendingUp className="w-6 h-6 text-purple-500" /> {t.trendMonitorTitle}</h2>
          <p className="text-[var(--rowi-muted)]">{t.trendMonitorDesc}</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TREND_METRICS.map((tm, i) => (
            <motion.div key={tm.key} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }} className="bg-white dark:bg-zinc-900 rounded-xl p-5 border border-gray-100 dark:border-zinc-800 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-sm">{tm.key}</span>
                <span className={`inline-flex items-center gap-1 text-xs font-medium ${tm.direction === "up" ? "text-emerald-600 dark:text-emerald-400" : tm.direction === "down" ? "text-red-600 dark:text-red-400" : "text-gray-500"}`}>
                  {tm.direction === "up" ? <TrendingUp className="w-3 h-3" /> : tm.direction === "down" ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                  {tm.direction === "up" ? t.trendUp : tm.direction === "down" ? t.trendDown : t.trendStable}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <MiniSparkline quarters={tm.quarters} direction={tm.direction} />
                <div className="flex-1">
                  <div className="flex justify-between text-[10px] text-[var(--rowi-muted)] mb-1">
                    <span>{t.q1}</span><span>{t.q2}</span><span>{t.q3}</span><span>{t.q4}</span>
                  </div>
                  <div className="flex justify-between text-xs font-mono">
                    {tm.quarters.map((q, qi) => (
                      <span key={qi} className={qi === tm.quarters.length - 1 ? "font-bold" : "text-[var(--rowi-muted)]"}>{q}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800 text-xs text-[var(--rowi-muted)]">
                <span className="font-medium">
                  {tm.quarters[tm.quarters.length - 1] > tm.quarters[0] ? `+${(tm.quarters[tm.quarters.length - 1] - tm.quarters[0]).toFixed(1)}` : (tm.quarters[tm.quarters.length - 1] - tm.quarters[0]).toFixed(1)}
                </span>{" "}
                {lang === "es" ? "vs inicio de periodo" : "vs period start"}
              </div>
            </motion.div>
          ))}
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
