"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Shield,
  Sparkles,
  Users,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ChevronDown,
  BarChart3,
  Globe,
  Brain,
  Target,
  TrendingUp,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { getEqLevel } from "@/domains/eq/lib/eqLevels";
import {
  getBrainStyleLabel,
  getBrainStyleEmoji,
  getBrainStyleColor,
  normalizeBrainStyle,
} from "@/domains/eq/lib/dictionary";

/* =========================================================
   Constants
========================================================= */
const TP_BENCHMARK_ID = "tp-all-assessments-2025";

const COMP_KEYS = ["EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"] as const;
const OUTCOME_KEYS = [
  "effectiveness",
  "relationships",
  "wellbeing",
  "qualityOfLife",
] as const;

const COMP_TKEYS: Record<string, string> = {
  EL: "compEL",
  RP: "compRP",
  ACT: "compACT",
  NE: "compNE",
  IM: "compIM",
  OP: "compOP",
  EMP: "compEMP",
  NG: "compNG",
};

const GROUP_BY_OPTIONS = [
  { value: "country", labelEs: "Pais", labelEn: "Country" },
  { value: "region", labelEs: "Region", labelEn: "Region" },
  { value: "jobRole", labelEs: "Rol", labelEn: "Job Role" },
  { value: "jobFunction", labelEs: "Funcion", labelEn: "Job Function" },
  { value: "sector", labelEs: "Sector", labelEn: "Sector" },
];

/* =========================================================
   Translations
========================================================= */
const translations = {
  es: {
    backToHub: "TP Hub",
    badge: "Equipos / Teams",
    pageTitle: "Team Deep Analytics",
    pageSubtitle:
      "Analisis profundo de equipos: agrupa por dimension, compara grupos y monitorea indicadores de salud",
    groupByLabel: "Agrupar por",
    filterAll: "Todos",
    teamOverview: "Vista General de Grupos",
    teamOverviewDesc:
      "Tarjetas de resumen para cada grupo con metricas clave de EQ y salud",
    assessments: "evaluaciones",
    avgEQ: "EQ Prom.",
    teamComparison: "Comparacion de Grupos",
    teamComparisonDesc:
      "Selecciona 2 grupos para comparar competencias, resultados y estilos cerebrales",
    selectTeamA: "Seleccionar Grupo A",
    selectTeamB: "Seleccionar Grupo B",
    competencyRadar: "Radar de Competencias",
    outcomesComparison: "Comparacion de Resultados",
    brainStyleComparison: "Distribucion de Estilos Cerebrales",
    seiLevelComparison: "Comparación de Nivel SEI",
    effectiveness: "Efectividad",
    relationships: "Relaciones",
    wellbeing: "Bienestar",
    qualityOfLife: "Calidad de Vida",
    teamHealthDashboard: "Dashboard SEI de Grupos",
    teamHealthDesc:
      "Nivel SEI de cada grupo con fortalezas y áreas de mejora",
    strength: "Fortaleza",
    gap: "Brecha",
    brainStyleDist: "Distribucion de Estilos Cerebrales",
    brainStyleDistDesc:
      "Haz clic en un grupo para ver su distribucion de estilos cerebrales en detalle",
    selectTeamToView: "Selecciona un grupo para ver su distribucion",
    membersLabel: "evaluaciones",
    regionalSummary: "Resumen por Dimension",
    regionalSummaryDesc: "Metricas agregadas por la dimension seleccionada",
    avgEQLabel: "EQ Promedio",
    totalTeams: "Grupos",
    totalMembers: "Evaluaciones",
    topTeam: "Mejor Grupo",
    infoTitle: "Datos de Equipos TP",
    infoDesc:
      "Este análisis muestra datos agregados de equipos de Teleperformance. Todos los datos individuales están anonimizados. Los niveles SEI se basan en la escala oficial de Six Seconds (65-135).",
    navPeople: "People",
    navSelection: "Selection",
    compEL: "Alfabetizacion Emocional",
    compRP: "Reconocer Patrones",
    compACT: "Pensamiento Consecuente",
    compNE: "Navegar Emociones",
    compIM: "Motivacion Intrinseca",
    compOP: "Ejercer Optimismo",
    compEMP: "Aumentar Empatia",
    compNG: "Metas Nobles",
    eqLevel: "Nivel SEI",
    noTeamsFound: "No se encontraron grupos con los filtros seleccionados",
    loading: "Cargando datos...",
    errorTitle: "Error al cargar datos",
    errorDesc:
      "No se pudieron cargar los datos del benchmark. Intenta de nuevo mas tarde.",
    retry: "Reintentar",
  },
  en: {
    backToHub: "TP Hub",
    badge: "Equipos / Teams",
    pageTitle: "Team Deep Analytics",
    pageSubtitle:
      "Deep team analysis: group by dimension, compare groups, and monitor health indicators",
    groupByLabel: "Group by",
    filterAll: "All",
    teamOverview: "Group Overview",
    teamOverviewDesc:
      "Summary cards for each group with key EQ and health metrics",
    assessments: "assessments",
    avgEQ: "Avg EQ",
    teamComparison: "Group Comparison",
    teamComparisonDesc:
      "Select 2 groups to compare competencies, outcomes, and brain styles",
    selectTeamA: "Select Group A",
    selectTeamB: "Select Group B",
    competencyRadar: "Competency Radar",
    outcomesComparison: "Outcomes Comparison",
    brainStyleComparison: "Brain Style Distribution",
    seiLevelComparison: "SEI Level Comparison",
    effectiveness: "Effectiveness",
    relationships: "Relationships",
    wellbeing: "Wellbeing",
    qualityOfLife: "Quality of Life",
    teamHealthDashboard: "Group SEI Dashboard",
    teamHealthDesc:
      "SEI level for each group with strengths and improvement areas",
    strength: "Strength",
    gap: "Gap",
    brainStyleDist: "Brain Style Distribution",
    brainStyleDistDesc:
      "Click on a group to view its detailed brain style distribution",
    selectTeamToView: "Select a group to view its distribution",
    membersLabel: "assessments",
    regionalSummary: "Dimension Summary",
    regionalSummaryDesc: "Aggregated metrics by selected dimension",
    avgEQLabel: "Average EQ",
    totalTeams: "Groups",
    totalMembers: "Assessments",
    topTeam: "Top Group",
    infoTitle: "TP Team Data",
    infoDesc:
      "This analysis shows aggregated Teleperformance team data. All individual data is anonymized. SEI levels are based on the official Six Seconds scale (65-135).",
    navPeople: "People",
    navSelection: "Selection",
    compEL: "Emotional Literacy",
    compRP: "Recognize Patterns",
    compACT: "Consequential Thinking",
    compNE: "Navigate Emotions",
    compIM: "Intrinsic Motivation",
    compOP: "Exercise Optimism",
    compEMP: "Increase Empathy",
    compNG: "Noble Goals",
    eqLevel: "SEI Level",
    noTeamsFound: "No groups found with the selected filters",
    loading: "Loading data...",
    errorTitle: "Error loading data",
    errorDesc:
      "Could not load benchmark data. Please try again later.",
    retry: "Retry",
  },
};

/* =========================================================
   Types
========================================================= */
interface GroupMetric {
  mean: number;
  median: number;
  min: number;
  max: number;
  stdDev: number;
}

interface ApiGroup {
  name: string;
  count: number;
  metrics: Record<string, GroupMetric>;
  brainStyleDist?: Record<string, number>;
}

/* =========================================================
   Helper functions
========================================================= */

/** Extract competency means as a flat record */
function getCompetencyMeans(
  metrics: Record<string, GroupMetric>,
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const k of COMP_KEYS) {
    result[k] = metrics[k]?.mean ?? 100;
  }
  return result;
}

/** Extract outcome means as a flat record */
function getOutcomeMeans(
  metrics: Record<string, GroupMetric>,
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const k of OUTCOME_KEYS) {
    result[k] = metrics[k]?.mean ?? 100;
  }
  return result;
}

function getBestCompetency(competencies: Record<string, number>) {
  let best = { key: "", value: 0 };
  for (const [k, v] of Object.entries(competencies)) {
    if (v > best.value) best = { key: k, value: v };
  }
  return best;
}

function getWorstCompetency(competencies: Record<string, number>) {
  let worst = { key: "", value: 999 };
  for (const [k, v] of Object.entries(competencies)) {
    if (v < worst.value) worst = { key: k, value: v };
  }
  return worst;
}

/* =========================================================
   SVG Radar Chart Component (8-axis)
========================================================= */
function CompetencyRadar({
  teamA,
  teamB,
}: {
  teamA: { name: string; competencies: Record<string, number> };
  teamB: { name: string; competencies: Record<string, number> };
}) {
  const cx = 150;
  const cy = 150;
  const maxR = 110;
  const minVal = 85;
  const maxVal = 120;

  function getPoint(index: number, value: number) {
    const angle = (Math.PI * 2 * index) / 8 - Math.PI / 2;
    const clamped = Math.max(minVal, Math.min(maxVal, value));
    const r = ((clamped - minVal) / (maxVal - minVal)) * maxR;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  }

  function getPolygon(
    competencies: Record<string, number>,
    color: string,
    opacity: number,
  ) {
    const points = COMP_KEYS.map((key, i) => {
      const pt = getPoint(i, competencies[key] ?? 100);
      return `${pt.x},${pt.y}`;
    }).join(" ");
    return (
      <polygon
        points={points}
        fill={color}
        fillOpacity={opacity}
        stroke={color}
        strokeWidth="2"
      />
    );
  }

  return (
    <svg viewBox="0 0 300 300" className="w-full max-w-[320px] mx-auto">
      {/* Grid circles */}
      {[0.25, 0.5, 0.75, 1].map((scale) => (
        <circle
          key={scale}
          cx={cx}
          cy={cy}
          r={maxR * scale}
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.1"
          strokeWidth="1"
        />
      ))}
      {/* Axis lines + labels */}
      {COMP_KEYS.map((key, i) => {
        const pt = getPoint(i, maxVal);
        const labelPt = getPoint(i, maxVal + 4);
        return (
          <g key={key}>
            <line
              x1={cx}
              y1={cy}
              x2={pt.x}
              y2={pt.y}
              stroke="currentColor"
              strokeOpacity="0.15"
              strokeWidth="1"
            />
            <text
              x={labelPt.x}
              y={labelPt.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-current text-[10px] opacity-60"
            >
              {key}
            </text>
          </g>
        );
      })}
      {/* Data polygons */}
      {getPolygon(teamA.competencies, "#7B2D8E", 0.2)}
      {getPolygon(teamB.competencies, "#E31937", 0.2)}
    </svg>
  );
}

/* =========================================================
   SVG Donut Chart Component
========================================================= */
function BrainStyleDonut({
  brainStyles,
  teamName,
  lang,
}: {
  brainStyles: Record<string, number>;
  teamName: string;
  lang: string;
}) {
  const total = Object.values(brainStyles).reduce((a, b) => a + b, 0);
  const entries = Object.entries(brainStyles)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);
  let cumulative = 0;
  const cxD = 100;
  const cyD = 100;
  const r = 70;
  const circumference = 2 * Math.PI * r;

  return (
    <div className="flex flex-col items-center gap-4">
      <svg viewBox="0 0 200 200" className="w-48 h-48">
        {entries.map(([style, count]) => {
          const pct = count / total;
          const offset = circumference * (1 - cumulative / total);
          const dash = circumference * pct;
          cumulative += count;
          return (
            <circle
              key={style}
              cx={cxD}
              cy={cyD}
              r={r}
              fill="none"
              stroke={getBrainStyleColor(style)}
              strokeWidth="24"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={offset}
              transform={`rotate(-90 ${cxD} ${cyD})`}
            />
          );
        })}
        <text
          x={cxD}
          y={cyD - 6}
          textAnchor="middle"
          className="fill-current text-lg font-bold"
        >
          {total}
        </text>
        <text
          x={cxD}
          y={cyD + 12}
          textAnchor="middle"
          className="fill-current text-[10px] opacity-60"
        >
          {teamName}
        </text>
      </svg>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
        {entries.map(([style, count]) => {
          const pct = ((count / total) * 100).toFixed(1);
          return (
            <div key={style} className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: getBrainStyleColor(style) }}
              />
              <span className="text-[var(--rowi-muted)]">
                {getBrainStyleEmoji(style)} {getBrainStyleLabel(style, lang)}
              </span>
              <span className="font-mono font-bold text-purple-600 ml-auto">
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* =========================================================
   Main Page
========================================================= */
export default function TPTeamsPage() {
  const { lang } = useI18n();
  const t = translations[lang as keyof typeof translations] || translations.es;

  /* ---- API State ---- */
  const [groups, setGroups] = useState<ApiGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groupBy, setGroupBy] = useState("country");

  /* ---- UI State ---- */
  const [compareA, setCompareA] = useState<string>("");
  const [compareB, setCompareB] = useState<string>("");
  const [selectedBrainGroup, setSelectedBrainGroup] = useState<string>("");

  /* ---- Fetch grouped stats ---- */
  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      setCompareA("");
      setCompareB("");
      setSelectedBrainGroup("");
      try {
        const res = await fetch(
          `/api/admin/benchmarks/${TP_BENCHMARK_ID}/stats/grouped?groupBy=${groupBy}`,
        );
        const json = await res.json();
        if (json.ok) {
          setGroups(json.groups ?? []);
        } else {
          setError(json.error || "Unknown error");
        }
      } catch (e) {
        console.error("Failed to fetch grouped stats:", e);
        setError("Network error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [groupBy]);

  /* ---- Derived data ---- */
  const enrichedGroups = useMemo(() => {
    return groups.map((g) => {
      const avgEQ = g.metrics.eqTotal?.mean ?? 0;
      const eqLevel = getEqLevel(avgEQ);
      return {
        ...g,
        avgEQ,
        competencies: getCompetencyMeans(g.metrics),
        outcomes: getOutcomeMeans(g.metrics),
        eqLevel,
      };
    });
  }, [groups]);

  const totalAssessments = useMemo(
    () => enrichedGroups.reduce((s, g) => s + g.count, 0),
    [enrichedGroups],
  );

  const groupA = useMemo(
    () => enrichedGroups.find((g) => g.name === compareA),
    [enrichedGroups, compareA],
  );
  const groupB = useMemo(
    () => enrichedGroups.find((g) => g.name === compareB),
    [enrichedGroups, compareB],
  );
  const brainGroup = useMemo(
    () => enrichedGroups.find((g) => g.name === selectedBrainGroup),
    [enrichedGroups, selectedBrainGroup],
  );

  /* ---- Top 4 groups for summary cards ---- */
  const topGroups = useMemo(() => {
    const sorted = [...enrichedGroups].sort((a, b) => b.count - a.count);
    return sorted.slice(0, Math.min(sorted.length, 4));
  }, [enrichedGroups]);

  /* ---- Retry handler ---- */
  function handleRetry() {
    setLoading(true);
    setError(null);
    fetch(`/api/admin/benchmarks/${TP_BENCHMARK_ID}/stats/grouped?groupBy=${groupBy}`)
      .then(r => r.json())
      .then((json) => {
        if (json.ok) setGroups(json.groups ?? []);
        else setError(json.error || "Unknown error");
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }

  /* ---- Loading spinner ---- */
  if (loading) {
    return (
      <div className="space-y-8">
        {/* Header (always visible) */}
        <div>
          <Link
            href="/hub/admin/tp"
            className="inline-flex items-center gap-2 text-sm text-[var(--rowi-muted)] hover:text-purple-500 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> {t.backToHub}
          </Link>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-500 mb-3">
            <Sparkles className="w-3 h-3" /> {t.badge}
          </span>
          <h1 className="text-3xl font-bold mb-2">{t.pageTitle}</h1>
          <p className="text-[var(--rowi-muted)]">{t.pageSubtitle}</p>
        </div>

        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
            <span className="text-sm text-[var(--rowi-muted)]">
              {t.loading}
            </span>
          </div>
        </div>
      </div>
    );
  }

  /* ---- Error state ---- */
  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <Link
            href="/hub/admin/tp"
            className="inline-flex items-center gap-2 text-sm text-[var(--rowi-muted)] hover:text-purple-500 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> {t.backToHub}
          </Link>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-500 mb-3">
            <Sparkles className="w-3 h-3" /> {t.badge}
          </span>
          <h1 className="text-3xl font-bold mb-2">{t.pageTitle}</h1>
          <p className="text-[var(--rowi-muted)]">{t.pageSubtitle}</p>
        </div>

        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="w-10 h-10 text-red-500" />
            <h3 className="text-lg font-semibold text-red-600">
              {t.errorTitle}
            </h3>
            <p className="text-sm text-[var(--rowi-muted)] max-w-md">
              {t.errorDesc}
            </p>
            <button
              onClick={handleRetry}
              className="mt-2 px-5 py-2 rounded-full bg-purple-500 text-white text-sm font-medium hover:bg-purple-600 transition-colors"
            >
              {t.retry}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Header ──────────────────────────────────────── */}
      <div>
        <Link
          href="/hub/admin/tp"
          className="inline-flex items-center gap-2 text-sm text-[var(--rowi-muted)] hover:text-purple-500 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> {t.backToHub}
        </Link>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-500 mb-3">
              <Sparkles className="w-3 h-3" /> {t.badge}
            </span>
            <h1 className="text-3xl font-bold mb-2">{t.pageTitle}</h1>
            <p className="text-[var(--rowi-muted)]">{t.pageSubtitle}</p>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl px-5 py-3 shadow-lg border border-gray-100 dark:border-zinc-800 flex items-center gap-3"
          >
            <Users className="w-6 h-6 text-purple-500" />
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {enrichedGroups.length}
              </div>
              <div className="text-xs text-[var(--rowi-muted)]">
                {t.totalTeams}
              </div>
            </div>
            <div className="w-px h-8 bg-gray-200 dark:bg-zinc-700 mx-2" />
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {totalAssessments.toLocaleString()}
              </div>
              <div className="text-xs text-[var(--rowi-muted)]">
                {t.totalMembers}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Group-By Selector ─────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-zinc-900 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-zinc-800 flex flex-col sm:flex-row gap-4"
      >
        <div className="flex-1 max-w-xs">
          <label className="text-xs font-medium text-[var(--rowi-muted)] mb-1 block">
            {t.groupByLabel}
          </label>
          <div className="relative">
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              className="w-full appearance-none bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {GROUP_BY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {lang === "en" ? opt.labelEn : opt.labelEs}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--rowi-muted)]" />
          </div>
        </div>
      </motion.div>

      {/* ── Section: Group Overview Grid ───────────────── */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-500" /> {t.teamOverview}
          </h2>
          <p className="text-[var(--rowi-muted)]">{t.teamOverviewDesc}</p>
        </div>

        {enrichedGroups.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 text-[var(--rowi-muted)]"
          >
            {t.noTeamsFound}
          </motion.div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {enrichedGroups.map((group, i) => {
              const eqPct = Math.max(
                0,
                Math.min(100, ((group.avgEQ - 65) / 70) * 100),
              );
              return (
                <motion.div
                  key={group.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white dark:bg-zinc-900 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-zinc-800 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedBrainGroup(group.name)}
                >
                  {/* Group name + EQ level badge */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-semibold text-sm">{group.name}</div>
                      <div className="text-[10px] text-[var(--rowi-muted)]">
                        {group.count.toLocaleString()} {t.assessments}
                      </div>
                    </div>
                    <div
                      className="text-xs font-bold px-2 py-1 rounded-full"
                      style={{ backgroundColor: `${group.eqLevel.color}20`, color: group.eqLevel.color }}
                    >
                      {group.eqLevel.emoji} {lang === "en" ? group.eqLevel.labelEN : group.eqLevel.label}
                    </div>
                  </div>

                  {/* Top competencies preview */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {COMP_KEYS.slice(0, 4).map((k) => (
                      <span
                        key={k}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 text-[var(--rowi-muted)]"
                      >
                        {k}: {group.competencies[k]?.toFixed(1)}
                      </span>
                    ))}
                  </div>

                  {/* EQ gauge */}
                  <div className="mb-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[var(--rowi-muted)]">
                        {t.avgEQ}
                      </span>
                      <span className="font-mono font-bold text-purple-600">
                        {group.avgEQ.toFixed(1)}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${eqPct}%` }}
                        transition={{
                          duration: 0.8,
                          ease: "easeOut",
                          delay: i * 0.05,
                        }}
                      />
                    </div>
                  </div>

                  {/* SEI Level */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-sm">{group.eqLevel.emoji}</span>
                    <span className="font-medium" style={{ color: group.eqLevel.color }}>
                      {lang === "en" ? group.eqLevel.labelEN : group.eqLevel.label}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Section: Group Comparison ──────────────────── */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-purple-500" />{" "}
            {t.teamComparison}
          </h2>
          <p className="text-[var(--rowi-muted)]">{t.teamComparisonDesc}</p>
        </div>

        {/* Group selectors */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-xs font-medium text-[var(--rowi-muted)] mb-1 block">
              {t.selectTeamA}
            </label>
            <div className="relative">
              <select
                value={compareA}
                onChange={(e) => setCompareA(e.target.value)}
                className="w-full appearance-none bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">{t.selectTeamA}</option>
                {enrichedGroups.map((g) => (
                  <option key={g.name} value={g.name}>
                    {g.name} ({g.count})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--rowi-muted)]" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--rowi-muted)] mb-1 block">
              {t.selectTeamB}
            </label>
            <div className="relative">
              <select
                value={compareB}
                onChange={(e) => setCompareB(e.target.value)}
                className="w-full appearance-none bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">{t.selectTeamB}</option>
                {enrichedGroups.map((g) => (
                  <option key={g.name} value={g.name}>
                    {g.name} ({g.count})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--rowi-muted)]" />
            </div>
          </div>
        </div>

        {/* Comparison panels */}
        <AnimatePresence>
          {groupA && groupB && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid lg:grid-cols-2 gap-6"
            >
              {/* Competency Radar */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-500" />{" "}
                  {t.competencyRadar}
                </h3>
                <CompetencyRadar
                  teamA={{
                    name: groupA.name,
                    competencies: groupA.competencies,
                  }}
                  teamB={{
                    name: groupB.name,
                    competencies: groupB.competencies,
                  }}
                />
                <div className="flex justify-center gap-6 mt-4 text-xs">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-[#7B2D8E]" />{" "}
                    {groupA.name}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-[#E31937]" />{" "}
                    {groupB.name}
                  </span>
                </div>
              </div>

              {/* Outcomes Comparison */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-500" />{" "}
                  {t.outcomesComparison}
                </h3>
                <div className="space-y-4">
                  {OUTCOME_KEYS.map((key) => {
                    const tKey = key as keyof typeof t;
                    const valA = groupA.outcomes[key] ?? 100;
                    const valB = groupB.outcomes[key] ?? 100;
                    const maxOutcome = Math.max(valA, valB, 115);
                    return (
                      <div key={key}>
                        <div className="text-xs font-medium text-[var(--rowi-muted)] mb-1">
                          {t[tKey]}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] w-20 truncate text-[var(--rowi-muted)]">
                              {groupA.name}
                            </span>
                            <div className="flex-1 h-3 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full rounded-full bg-[#7B2D8E]"
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${Math.max(0, ((valA - 85) / (maxOutcome - 85)) * 100)}%`,
                                }}
                                transition={{ duration: 0.8 }}
                              />
                            </div>
                            <span className="text-xs font-mono w-12 text-right">
                              {valA.toFixed(1)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] w-20 truncate text-[var(--rowi-muted)]">
                              {groupB.name}
                            </span>
                            <div className="flex-1 h-3 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full rounded-full bg-[#E31937]"
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${Math.max(0, ((valB - 85) / (maxOutcome - 85)) * 100)}%`,
                                }}
                                transition={{ duration: 0.8 }}
                              />
                            </div>
                            <span className="text-xs font-mono w-12 text-right">
                              {valB.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Brain Style Comparison */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-500" />{" "}
                  {t.brainStyleComparison}
                </h3>
                <div className="space-y-3">
                  {(() => {
                    // Collect all brain styles from both groups
                    const allStyles = new Set([
                      ...Object.keys(groupA.brainStyleDist ?? {}),
                      ...Object.keys(groupB.brainStyleDist ?? {}),
                    ]);
                    const totalA = Object.values(groupA.brainStyleDist ?? {}).reduce((s, v) => s + v, 0) || 1;
                    const totalB = Object.values(groupB.brainStyleDist ?? {}).reduce((s, v) => s + v, 0) || 1;
                    return Array.from(allStyles).sort().map((style) => {
                      const vA = groupA.brainStyleDist?.[style] ?? 0;
                      const vB = groupB.brainStyleDist?.[style] ?? 0;
                      const pctA = (vA / totalA) * 100;
                      const pctB = (vB / totalB) * 100;
                      const maxPct = Math.max(pctA, pctB, 1);
                      return (
                        <div key={style}>
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{
                                backgroundColor: getBrainStyleColor(style),
                              }}
                            />
                            <span className="text-xs font-medium flex-1">
                              {getBrainStyleEmoji(style)} {getBrainStyleLabel(style, lang)}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-1">
                              <div className="flex-1 h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <motion.div
                                  className="h-full rounded-full"
                                  style={{ backgroundColor: "#7B2D8E" }}
                                  initial={{ width: 0 }}
                                  animate={{
                                    width: `${(pctA / maxPct) * 100}%`,
                                  }}
                                  transition={{ duration: 0.6 }}
                                />
                              </div>
                              <span className="text-[10px] font-mono w-12 text-right">
                                {pctA.toFixed(1)}%
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="flex-1 h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <motion.div
                                  className="h-full rounded-full"
                                  style={{ backgroundColor: "#E31937" }}
                                  initial={{ width: 0 }}
                                  animate={{
                                    width: `${(pctB / maxPct) * 100}%`,
                                  }}
                                  transition={{ duration: 0.6 }}
                                />
                              </div>
                              <span className="text-[10px] font-mono w-12 text-right">
                                {pctB.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
                <div className="flex justify-center gap-6 mt-4 text-xs">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-[#7B2D8E]" />{" "}
                    {groupA.name}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-[#E31937]" />{" "}
                    {groupB.name}
                  </span>
                </div>
              </div>

              {/* SEI Level Comparison */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-500" />{" "}
                  {t.seiLevelComparison}
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  {[groupA, groupB].map((group, idx) => {
                    const eqLvl = getEqLevel(group.avgEQ);
                    const circumference = 2 * Math.PI * 45;
                    // EQ gauge: map 65-135 to 0-100%
                    const eqPct = Math.max(0, Math.min(100, ((group.avgEQ - 65) / 70) * 100));
                    const offset = circumference - (eqPct / 100) * circumference;
                    return (
                      <div
                        key={group.name}
                        className="flex flex-col items-center"
                      >
                        <svg viewBox="0 0 120 120" className="w-28 h-28">
                          <circle
                            cx="60"
                            cy="60"
                            r="45"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            className="text-gray-200 dark:text-zinc-800"
                          />
                          <motion.circle
                            cx="60"
                            cy="60"
                            r="45"
                            stroke={eqLvl.color}
                            strokeWidth="8"
                            fill="none"
                            strokeLinecap="round"
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset: offset }}
                            transition={{ duration: 1.2, ease: "easeOut" }}
                            style={{ strokeDasharray: circumference }}
                            transform="rotate(-90 60 60)"
                          />
                          <text
                            x="60"
                            y="50"
                            textAnchor="middle"
                            className="fill-current text-lg font-bold"
                          >
                            {group.avgEQ.toFixed(1)}
                          </text>
                          <text
                            x="60"
                            y="66"
                            textAnchor="middle"
                            className="fill-current text-[9px] opacity-50"
                          >
                            {t.avgEQ}
                          </text>
                          <text
                            x="60"
                            y="80"
                            textAnchor="middle"
                            className="text-[9px]"
                            fill={eqLvl.color}
                          >
                            {eqLvl.emoji} {lang === "en" ? eqLvl.labelEN : eqLvl.label}
                          </text>
                        </svg>
                        <div className="text-sm font-medium mt-2 text-center">
                          {group.name}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Section: Group Health Dashboard ────────────── */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <Activity className="w-6 h-6 text-purple-500" />{" "}
            {t.teamHealthDashboard}
          </h2>
          <p className="text-[var(--rowi-muted)]">{t.teamHealthDesc}</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {enrichedGroups.map((group, i) => {
            const best = getBestCompetency(group.competencies);
            const worst = getWorstCompetency(group.competencies);
            return (
              <motion.div
                key={group.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="bg-white dark:bg-zinc-900 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-zinc-800"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm">{group.name}</span>
                  <span className="text-lg">{group.eqLevel.emoji}</span>
                </div>
                {/* EQ Level badge */}
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${group.eqLevel.color}20`, color: group.eqLevel.color }}
                  >
                    {group.eqLevel.emoji} {lang === "en" ? group.eqLevel.labelEN : group.eqLevel.label}
                  </span>
                  <span className="text-xs font-mono text-purple-600">{group.avgEQ.toFixed(1)}</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                    <span className="text-[var(--rowi-muted)]">
                      {t.strength}:
                    </span>
                    <span className="font-medium">
                      {t[COMP_TKEYS[best.key] as keyof typeof t] || best.key}
                    </span>
                    <span className="font-mono text-green-600 ml-auto">
                      {best.value.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />
                    <span className="text-[var(--rowi-muted)]">
                      {t.gap}:
                    </span>
                    <span className="font-medium">
                      {t[COMP_TKEYS[worst.key] as keyof typeof t] || worst.key}
                    </span>
                    <span className="font-mono text-yellow-600 ml-auto">
                      {worst.value.toFixed(1)}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── Section: Brain Style Distribution ─────────── */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-500" /> {t.brainStyleDist}
          </h2>
          <p className="text-[var(--rowi-muted)]">{t.brainStyleDistDesc}</p>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-zinc-800"
        >
          {/* Group selector chips */}
          <div className="flex flex-wrap gap-2 mb-8">
            {enrichedGroups.map((group) => (
              <button
                key={group.name}
                onClick={() => setSelectedBrainGroup(group.name)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedBrainGroup === group.name
                    ? "bg-purple-500 text-white shadow-md"
                    : "bg-gray-100 dark:bg-zinc-800 text-[var(--rowi-muted)] hover:bg-purple-100 dark:hover:bg-purple-900/30"
                }`}
              >
                {group.name}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {brainGroup && brainGroup.brainStyleDist ? (
              <motion.div
                key={brainGroup.name}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <BrainStyleDonut
                  brainStyles={brainGroup.brainStyleDist}
                  teamName={brainGroup.name}
                  lang={lang}
                />
                <div className="text-center mt-4 text-sm text-[var(--rowi-muted)]">
                  {brainGroup.count.toLocaleString()} {t.membersLabel}
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 text-[var(--rowi-muted)]"
              >
                {t.selectTeamToView}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* ── Section: Dimension Summary ─────────────────── */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <Globe className="w-6 h-6 text-purple-500" /> {t.regionalSummary}
          </h2>
          <p className="text-[var(--rowi-muted)]">{t.regionalSummaryDesc}</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {topGroups.map((group, i) => (
            <motion.div
              key={group.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="bg-white dark:bg-zinc-900 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-zinc-800"
            >
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-5 h-5 text-purple-500" />
                <span className="font-semibold">{group.name}</span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--rowi-muted)]">
                    {t.avgEQLabel}
                  </span>
                  <span className="font-bold text-purple-600">
                    {group.avgEQ.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--rowi-muted)]">
                    {t.totalMembers}
                  </span>
                  <span className="font-bold">
                    {group.count.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span className="text-[var(--rowi-muted)]">
                    {t.eqLevel}
                  </span>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${group.eqLevel.color}20`, color: group.eqLevel.color }}
                  >
                    {group.eqLevel.emoji} {lang === "en" ? group.eqLevel.labelEN : group.eqLevel.label}
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-100 dark:border-zinc-800">
                  <div className="text-xs text-[var(--rowi-muted)] mb-1">
                    {t.strength}
                  </div>
                  <div className="text-sm font-semibold">
                    {t[
                      COMP_TKEYS[
                        getBestCompetency(group.competencies).key
                      ] as keyof typeof t
                    ] || getBestCompetency(group.competencies).key}
                  </div>
                  <div className="text-xs text-purple-500 font-mono">
                    {getBestCompetency(group.competencies).value.toFixed(1)}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Info Tip ────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl p-6 flex gap-4"
      >
        <Shield className="w-6 h-6 text-purple-500 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-1">
            {t.infoTitle}
          </h3>
          <p className="text-sm text-purple-700 dark:text-purple-300">
            {t.infoDesc}
          </p>
        </div>
      </motion.div>

      {/* ── Navigation Footer ───────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between pt-6 border-t border-gray-200 dark:border-zinc-800">
        <Link
          href="/hub/admin/tp/people"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border-2 border-gray-200 dark:border-zinc-700 hover:border-purple-500 transition-colors font-medium"
        >
          <ArrowLeft className="w-5 h-5" /> {t.navPeople}
        </Link>
        <Link
          href="/hub/admin/tp/selection"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:opacity-90 transition-opacity"
        >
          {t.navSelection} <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
