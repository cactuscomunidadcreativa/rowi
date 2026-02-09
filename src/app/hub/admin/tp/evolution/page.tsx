"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  Users,
  Sparkles,
  Shield,
  Activity,
  Target,
  Brain,
  Zap,
  Award,
  Search,
  ChevronDown,
  ArrowUpRight,
  Clock,
  BarChart3,
  LineChart,
  Loader2,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

/* =========================================================
   Constants
========================================================= */
const TP_BENCHMARK_ID = "tp-all-assessments-2025";

/* =========================================================
   Translations — Fully bilingual ES / EN
========================================================= */
const translations = {
  es: {
    backToHub: "TP Hub",
    badge: "Curva de Aprendizaje / Learning Curve",
    pageTitle: "Evolución y Curva de Aprendizaje EQ",
    pageSubtitle:
      "Seguimiento longitudinal de crecimiento emocional: curvas de aprendizaje, comparaciones antes/después y predicciones",

    selectorLabel: "Seleccionar persona",
    selectorPlaceholder: "Selecciona un participante...",
    assessmentsLabel: "evaluaciones",
    regionLabel: "Región",
    roleLabel: "Rol",

    chartTitle: "Curva de Evolución EQ",
    chartSubtitle: "Puntaje total EQ a lo largo del tiempo con línea de predicción",
    prediction: "Predicción",
    actual: "Real",

    beforeAfterTitle: "Comparación Antes / Después",
    beforeAfterSubtitle: "Primera evaluación vs evaluación más reciente",
    firstAssessment: "Primera Evaluación",
    latestAssessment: "Última Evaluación",
    totalGrowth: "Crecimiento Total",
    points: "puntos",

    compGrowthTitle: "Crecimiento por Competencia",
    compGrowthSubtitle: "Desglose detallado del progreso en cada competencia SEI",
    competency: "Competencia",
    firstScore: "Primer Puntaje",
    latestScore: "Último Puntaje",
    growthPts: "Crecimiento (pts)",
    growthPct: "Crecimiento (%)",
    rate: "Ritmo",
    rateFast: "Rápido",
    rateModerate: "Moderado",
    rateSlow: "Lento",
    topGrowth: "Mayor crecimiento",

    compEL: "Alfabetización Emocional",
    compRP: "Reconocer Patrones",
    compACT: "Pensamiento Consecuente",
    compNE: "Navegar Emociones",
    compIM: "Motivación Intrínseca",
    compOP: "Ejercer Optimismo",
    compEMP: "Aumentar Empatía",
    compNG: "Metas Nobles",

    growthRateTitle: "Análisis de Ritmo de Crecimiento",
    growthRateSubtitle: "Indicadores clave del progreso de desarrollo EQ",
    avgGrowthRate: "Ritmo de Crecimiento Promedio",
    ptsPerYear: "puntos/año",
    fastestComp: "Competencia de Mayor Crecimiento",
    strongestComp: "Competencia Más Fuerte",
    predicted12m: "EQ Predicho en 12 Meses",

    dupTitle: "Detección de IDs Duplicados",
    dupSubtitle: "IDs con múltiples evaluaciones para seguimiento longitudinal",
    dupBadge: "IDs duplicados encontrados",
    dupId: "ID Fuente",
    dupName: "Nombre",
    dupCount: "Evaluaciones",
    dupFirst: "Primera",
    dupLast: "Última",
    dupGrowth: "Crecimiento",

    teamTitle: "Resumen de Evolución del Equipo",
    teamSubtitle: "Trayectoria de crecimiento comparativa de todos los participantes rastreados",
    teamMostGrowth: "Mayor crecimiento",
    teamLeastGrowth: "Menor crecimiento",
    teamName: "Nombre",
    teamStart: "EQ Inicial",
    teamEnd: "EQ Final",
    teamChange: "Cambio",

    predTitle: "Predicciones de Crecimiento",
    predSubtitle: "Proyecciones basadas en la tasa de crecimiento actual del participante",
    pred6m: "Predicción a 6 Meses",
    pred12m: "Predicción a 12 Meses",
    predCurrent: "EQ Actual",
    predBasis: "Basado en ritmo de crecimiento de",

    infoTitle: "Seguimiento Longitudinal de IE",
    infoDesc:
      "Esta página rastrea la evolución de inteligencia emocional a lo largo del tiempo usando detección de ID duplicado para vincular múltiples evaluaciones SEI. Todos los datos individuales están anonimizados. Escala SEI: 65–135.",
    navPrev: "Selection",
    navNext: "ROI",

    loading: "Cargando datos de evolución...",
    noEvolutionData: "Sin datos de evolución",
    noEvolutionDataDesc:
      "No se encontraron personas con múltiples evaluaciones SEI en el dataset actual. Los datos de evolución requieren que la misma persona haya sido evaluada al menos 2 veces.",
  },
  en: {
    backToHub: "TP Hub",
    badge: "Learning Curve / Curva de Aprendizaje",
    pageTitle: "EQ Evolution & Learning Curve",
    pageSubtitle:
      "Longitudinal emotional growth tracking: learning curves, before/after comparisons, and predictions",

    selectorLabel: "Select person",
    selectorPlaceholder: "Select a participant...",
    assessmentsLabel: "assessments",
    regionLabel: "Region",
    roleLabel: "Role",

    chartTitle: "EQ Evolution Curve",
    chartSubtitle: "Total EQ score over time with prediction line",
    prediction: "Prediction",
    actual: "Actual",

    beforeAfterTitle: "Before / After Comparison",
    beforeAfterSubtitle: "First assessment vs most recent assessment",
    firstAssessment: "First Assessment",
    latestAssessment: "Latest Assessment",
    totalGrowth: "Total Growth",
    points: "points",

    compGrowthTitle: "Competency Growth",
    compGrowthSubtitle: "Detailed breakdown of progress across each SEI competency",
    competency: "Competency",
    firstScore: "First Score",
    latestScore: "Latest Score",
    growthPts: "Growth (pts)",
    growthPct: "Growth (%)",
    rate: "Rate",
    rateFast: "Fast",
    rateModerate: "Moderate",
    rateSlow: "Slow",
    topGrowth: "Top growth",

    compEL: "Enhance Emotional Literacy",
    compRP: "Recognize Patterns",
    compACT: "Apply Consequential Thinking",
    compNE: "Navigate Emotions",
    compIM: "Engage Intrinsic Motivation",
    compOP: "Exercise Optimism",
    compEMP: "Increase Empathy",
    compNG: "Pursue Noble Goals",

    growthRateTitle: "Growth Rate Analysis",
    growthRateSubtitle: "Key indicators of EQ development progress",
    avgGrowthRate: "Average Growth Rate",
    ptsPerYear: "pts/year",
    fastestComp: "Fastest Growing Competency",
    strongestComp: "Strongest Competency",
    predicted12m: "Predicted EQ in 12 Months",

    dupTitle: "Duplicate ID Detection",
    dupSubtitle: "IDs with multiple assessments for longitudinal tracking",
    dupBadge: "Duplicate IDs found",
    dupId: "Source ID",
    dupName: "Name",
    dupCount: "Assessments",
    dupFirst: "First Seen",
    dupLast: "Last Seen",
    dupGrowth: "Growth",

    teamTitle: "Team Evolution Summary",
    teamSubtitle: "Comparative growth trajectory of all tracked participants",
    teamMostGrowth: "Most growth",
    teamLeastGrowth: "Least growth",
    teamName: "Name",
    teamStart: "Start EQ",
    teamEnd: "End EQ",
    teamChange: "Change",

    predTitle: "Growth Predictions",
    predSubtitle: "Projections based on the participant's current growth rate",
    pred6m: "6-Month Prediction",
    pred12m: "12-Month Prediction",
    predCurrent: "Current EQ",
    predBasis: "Based on growth rate of",

    infoTitle: "Longitudinal EQ Tracking",
    infoDesc:
      "This page tracks emotional intelligence evolution over time using duplicate ID detection to link multiple SEI assessments. All individual data is anonymized. SEI Scale: 65–135.",
    navPrev: "Selection",
    navNext: "ROI",

    loading: "Loading evolution data...",
    noEvolutionData: "No evolution data",
    noEvolutionDataDesc:
      "No individuals with multiple SEI assessments found in the current dataset. Evolution data requires the same person to have been assessed at least 2 times.",
  },
};

/* =========================================================
   Types
========================================================= */
type ApiAssessment = {
  sourceDate: string;
  eqTotal: number;
  EL: number;
  RP: number;
  ACT: number;
  NE: number;
  IM: number;
  OP: number;
  EMP: number;
  NG: number;
  [key: string]: unknown;
};

type ApiEvolution = {
  sourceId: string;
  assessmentCount: number;
  country: string;
  region: string;
  jobRole: string;
  brainStyle: string;
  firstEQ: number;
  lastEQ: number;
  eqGrowth: number;
  firstDate: string;
  lastDate: string;
  assessments: ApiAssessment[];
};

const COMP_KEYS = ["EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"] as const;
type CompKey = (typeof COMP_KEYS)[number];

const COMP_T_KEYS: Record<CompKey, string> = {
  EL: "compEL",
  RP: "compRP",
  ACT: "compACT",
  NE: "compNE",
  IM: "compIM",
  OP: "compOP",
  EMP: "compEMP",
  NG: "compNG",
};

/* =========================================================
   Helpers
========================================================= */
function getTimeSpanYears(first: string, last: string): number {
  const d1 = new Date(first);
  const d2 = new Date(last);
  return Math.max((d2.getTime() - d1.getTime()) / (365.25 * 24 * 60 * 60 * 1000), 0.25);
}

function predictEQ(current: number, growthPerYear: number, months: number): number {
  return +(current + growthPerYear * (months / 12)).toFixed(1);
}

function formatDisplayId(sourceId: string): string {
  return "TP-" + sourceId.slice(0, 6);
}

function formatDate(dateStr: string): string {
  return dateStr.slice(0, 10);
}

function formatPeriodLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const q = Math.ceil((d.getMonth() + 1) / 3);
  return `${y}-Q${q}`;
}

/* =========================================================
   SVG Evolution Chart Component
========================================================= */
function EvolutionChart({
  evolution,
  predLabel,
  actualLabel,
}: {
  evolution: ApiEvolution;
  predLabel: string;
  actualLabel: string;
}) {
  const assessments = evolution.assessments;
  const first = assessments[0];
  const last = assessments[assessments.length - 1];
  const totalYears = getTimeSpanYears(first.sourceDate, last.sourceDate);
  const growthPerYear = (last.eqTotal - first.eqTotal) / totalYears;

  const pred6 = predictEQ(last.eqTotal, growthPerYear, 6);
  const pred12 = predictEQ(last.eqTotal, growthPerYear, 12);

  const allScores = [...assessments.map((a) => a.eqTotal), pred6, pred12];
  const minY = Math.floor(Math.min(...allScores) - 4);
  const maxY = Math.ceil(Math.max(...allScores) + 4);

  const W = 700;
  const H = 320;
  const PAD = { top: 30, right: 80, bottom: 50, left: 55 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const totalPeriods = assessments.length + 2;
  const xStep = chartW / (totalPeriods - 1);

  function toX(i: number) {
    return PAD.left + i * xStep;
  }
  function toY(v: number) {
    return PAD.top + chartH - ((v - minY) / (maxY - minY)) * chartH;
  }

  const actualPoints = assessments.map((a, i) => ({
    x: toX(i),
    y: toY(a.eqTotal),
    score: a.eqTotal,
    label: formatPeriodLabel(a.sourceDate),
  }));

  const predPoints = [
    { x: toX(assessments.length), y: toY(pred6), score: pred6, label: "+6m" },
    { x: toX(assessments.length + 1), y: toY(pred12), score: pred12, label: "+12m" },
  ];

  const actualPath = actualPoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const fillPath = `${actualPath} L ${actualPoints[actualPoints.length - 1].x} ${PAD.top + chartH} L ${actualPoints[0].x} ${PAD.top + chartH} Z`;

  const predPath = `M ${actualPoints[actualPoints.length - 1].x} ${actualPoints[actualPoints.length - 1].y} L ${predPoints[0].x} ${predPoints[0].y} L ${predPoints[1].x} ${predPoints[1].y}`;

  const yTicks = 5;
  const yTickVals = Array.from(
    { length: yTicks + 1 },
    (_, i) => +(minY + ((maxY - minY) / yTicks) * i).toFixed(1)
  );

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      <defs>
        <linearGradient id="evoFillGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7B2D8E" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#7B2D8E" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="evoStrokeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7B2D8E" />
          <stop offset="100%" stopColor="#E31937" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {yTickVals.map((v) => (
        <g key={v}>
          <line
            x1={PAD.left}
            y1={toY(v)}
            x2={W - PAD.right}
            y2={toY(v)}
            stroke="currentColor"
            strokeOpacity="0.08"
            strokeWidth="1"
          />
          <text
            x={PAD.left - 8}
            y={toY(v) + 4}
            textAnchor="end"
            fill="currentColor"
            fillOpacity="0.4"
            fontSize="10"
          >
            {v.toFixed(0)}
          </text>
        </g>
      ))}

      {/* Gradient fill under line */}
      <motion.path
        d={fillPath}
        fill="url(#evoFillGrad)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.5 }}
      />

      {/* Actual data line */}
      <motion.path
        d={actualPath}
        fill="none"
        stroke="url(#evoStrokeGrad)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
      />

      {/* Prediction dashed line */}
      <motion.path
        d={predPath}
        fill="none"
        stroke="#7B2D8E"
        strokeWidth="2"
        strokeDasharray="6 4"
        strokeOpacity="0.5"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 1.5 }}
      />

      {/* Actual data points with labels */}
      {actualPoints.map((p, i) => (
        <motion.g
          key={`actual-${i}`}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 + i * 0.2 }}
        >
          <circle cx={p.x} cy={p.y} r="6" fill="#7B2D8E" stroke="white" strokeWidth="2" />
          <text x={p.x} y={p.y - 14} textAnchor="middle" fill="currentColor" fillOpacity="0.8" fontSize="11" fontWeight="600">
            {p.score.toFixed(1)}
          </text>
          <text x={p.x} y={PAD.top + chartH + 18} textAnchor="middle" fill="currentColor" fillOpacity="0.4" fontSize="9">
            {p.label}
          </text>
        </motion.g>
      ))}

      {/* Prediction points */}
      {predPoints.map((p, i) => (
        <motion.g
          key={`pred-${i}`}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 2 + i * 0.2 }}
        >
          <circle cx={p.x} cy={p.y} r="5" fill="none" stroke="#7B2D8E" strokeWidth="2" strokeDasharray="3 2" />
          <text x={p.x} y={p.y - 14} textAnchor="middle" fill="#7B2D8E" fillOpacity="0.6" fontSize="11" fontWeight="500">
            {p.score.toFixed(1)}
          </text>
          <text x={p.x} y={PAD.top + chartH + 18} textAnchor="middle" fill="#7B2D8E" fillOpacity="0.5" fontSize="9">
            {p.label}
          </text>
        </motion.g>
      ))}

      {/* Legend */}
      <g transform={`translate(${W - PAD.right + 10}, ${PAD.top})`}>
        <line x1="0" y1="0" x2="16" y2="0" stroke="url(#evoStrokeGrad)" strokeWidth="3" />
        <text x="20" y="4" fill="currentColor" fillOpacity="0.5" fontSize="9">
          {actualLabel}
        </text>
        <line x1="0" y1="18" x2="16" y2="18" stroke="#7B2D8E" strokeWidth="2" strokeDasharray="4 3" strokeOpacity="0.5" />
        <text x="20" y="22" fill="currentColor" fillOpacity="0.5" fontSize="9">
          {predLabel}
        </text>
      </g>
    </svg>
  );
}

/* =========================================================
   Team Mini Bar Chart (SVG)
========================================================= */
function TeamBarChart({ evolutions }: { evolutions: ApiEvolution[] }) {
  const W = 700;
  const H = 200;
  const PAD = { top: 20, right: 20, bottom: 40, left: 20 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const barW = chartW / evolutions.length;

  const growths = evolutions.map((evo) => {
    return {
      name: formatDisplayId(evo.sourceId),
      growth: +evo.eqGrowth.toFixed(1),
      id: evo.sourceId,
    };
  });

  const maxG = Math.max(...growths.map((g) => Math.abs(g.growth)), 1);
  const sorted = [...growths].sort((a, b) => b.growth - a.growth);
  const bestId = sorted[0].id;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {growths.map((g, i) => {
        const barH = (Math.abs(g.growth) / maxG) * chartH;
        const x = PAD.left + i * barW + barW * 0.15;
        const w = barW * 0.7;
        const y = PAD.top + chartH - barH;
        const isBest = g.id === bestId;

        return (
          <motion.g key={g.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <motion.rect
              x={x}
              y={PAD.top + chartH}
              width={w}
              rx={4}
              fill={g.growth >= 0 ? "#7B2D8E" : "#E31937"}
              fillOpacity={isBest ? 0.9 : 0.35}
              initial={{ height: 0 }}
              animate={{ height: barH, y }}
              transition={{ duration: 0.8, delay: i * 0.1 }}
            />
            <text x={x + w / 2} y={y - 6} textAnchor="middle" fill="currentColor" fillOpacity="0.7" fontSize="11" fontWeight="600">
              {g.growth >= 0 ? "+" : ""}{g.growth}
            </text>
            <text x={x + w / 2} y={PAD.top + chartH + 16} textAnchor="middle" fill="currentColor" fillOpacity="0.4" fontSize="10">
              {g.name}
            </text>
          </motion.g>
        );
      })}
      <line x1={PAD.left} y1={PAD.top + chartH} x2={W - PAD.right} y2={PAD.top + chartH} stroke="currentColor" strokeOpacity="0.1" />
    </svg>
  );
}

/* =========================================================
   Main Page Component
========================================================= */
export default function TPEvolutionPage() {
  const { lang } = useI18n();
  const t = translations[lang as keyof typeof translations] || translations.es;

  const [evolutions, setEvolutions] = useState<ApiEvolution[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalWithEvolution, setTotalWithEvolution] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [selectorOpen, setSelectorOpen] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/admin/benchmarks/${TP_BENCHMARK_ID}/evolution?minAssessments=2&limit=50`
        );
        const json = await res.json();
        if (json.ok) {
          setEvolutions(json.evolutions || []);
          setTotalWithEvolution(json.totalWithEvolution || 0);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Derived data for the selected person
  const hasData = evolutions.length > 0;
  const evo = hasData ? evolutions[selectedIdx] : null;

  const firstA = evo ? evo.assessments[0] : null;
  const lastA = evo ? evo.assessments[evo.assessments.length - 1] : null;
  const totalYears = evo && firstA && lastA ? getTimeSpanYears(firstA.sourceDate, lastA.sourceDate) : 1;
  const totalGrowthEQ = evo ? +evo.eqGrowth.toFixed(1) : 0;
  const growthPerYear = evo ? +(totalGrowthEQ / totalYears).toFixed(1) : 0;

  // Competency growth computations
  const compGrowthData =
    firstA && lastA
      ? COMP_KEYS.map((key) => {
          const first = (firstA as Record<string, number>)[key] ?? 0;
          const last = (lastA as Record<string, number>)[key] ?? 0;
          const growthPts = +(last - first).toFixed(1);
          const growthPct = first > 0 ? +((growthPts / first) * 100).toFixed(1) : 0;
          const ptsPerYear = +(growthPts / totalYears).toFixed(1);
          let rate: "fast" | "moderate" | "slow" = "moderate";
          if (ptsPerYear >= 5) rate = "fast";
          else if (ptsPerYear < 3) rate = "slow";
          return { key, first, last, growthPts, growthPct, ptsPerYear, rate };
        })
      : [];

  const topGrowthComp = compGrowthData.length > 0
    ? [...compGrowthData].sort((a, b) => b.growthPts - a.growthPts)[0]
    : null;
  const strongestComp = compGrowthData.length > 0
    ? [...compGrowthData].sort((a, b) => b.last - a.last)[0]
    : null;

  const pred6 = lastA ? predictEQ(lastA.eqTotal, growthPerYear, 6) : 0;
  const pred12 = lastA ? predictEQ(lastA.eqTotal, growthPerYear, 12) : 0;

  // Team summary sorted by growth
  const teamData = evolutions
    .map((e) => ({
      name: formatDisplayId(e.sourceId),
      id: e.sourceId,
      start: e.firstEQ,
      end: e.lastEQ,
      change: +e.eqGrowth.toFixed(1),
      country: e.country,
    }))
    .sort((a, b) => b.change - a.change);

  return (
    <div className="space-y-8">
      {/* Section 1: Header */}
      <div>
        <Link
          href="/hub/admin/tp"
          className="inline-flex items-center gap-2 text-sm text-[var(--rowi-muted)] hover:text-purple-500 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> {t.backToHub}
        </Link>

        <div>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-500 mb-3">
            <Sparkles className="w-3 h-3" /> {t.badge}
          </span>
          <h1 className="text-3xl font-bold mb-2">{t.pageTitle}</h1>
          <p className="text-[var(--rowi-muted)]">{t.pageSubtitle}</p>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800"
        >
          <Loader2 className="w-12 h-12 text-purple-500 mx-auto mb-4 animate-spin" />
          <p className="text-sm text-[var(--rowi-muted)]">{t.loading}</p>
        </motion.div>
      )}

      {/* Empty State */}
      {!loading && !hasData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800"
        >
          <TrendingUp className="w-16 h-16 text-gray-200 dark:text-zinc-700 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t.noEvolutionData}</h3>
          <p className="text-sm text-[var(--rowi-muted)] max-w-md mx-auto">{t.noEvolutionDataDesc}</p>
        </motion.div>
      )}

      {/* Data Content */}
      {!loading && hasData && evo && firstA && lastA && (
        <>
          {/* Section 2: Person Selector */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-zinc-800"
          >
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Search className="w-5 h-5 text-purple-500" /> {t.selectorLabel}
            </h2>

            <div className="relative">
              <button
                onClick={() => setSelectorOpen(!selectorOpen)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 hover:border-purple-400 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                    {formatDisplayId(evo.sourceId).slice(0, 2)}
                  </div>
                  <div>
                    <div className="font-semibold">{formatDisplayId(evo.sourceId)}</div>
                    <div className="text-xs text-[var(--rowi-muted)]">
                      {evo.sourceId.slice(0, 8)} &middot; {evo.jobRole || evo.country} &middot; {evo.region} &middot;{" "}
                      {evo.assessmentCount} {t.assessmentsLabel}
                    </div>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-[var(--rowi-muted)] transition-transform ${selectorOpen ? "rotate-180" : ""}`} />
              </button>

              {selectorOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute z-20 top-full mt-2 w-full rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden max-h-80 overflow-y-auto"
                >
                  {evolutions.map((p, i) => (
                    <button
                      key={p.sourceId}
                      onClick={() => {
                        setSelectedIdx(i);
                        setSelectorOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors ${i === selectedIdx ? "bg-purple-50 dark:bg-purple-900/20" : ""}`}
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs">
                        {formatDisplayId(p.sourceId).slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{formatDisplayId(p.sourceId)}</div>
                        <div className="text-xs text-[var(--rowi-muted)] truncate">
                          {p.country} &middot; {p.jobRole || p.region} &middot; {p.region} &middot; {p.assessmentCount} {t.assessmentsLabel}
                        </div>
                      </div>
                      <span className="text-xs font-mono text-purple-500">{p.brainStyle}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Section 3: Evolution Line Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-zinc-800"
          >
            <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
              <LineChart className="w-5 h-5 text-purple-500" /> {t.chartTitle}
            </h2>
            <p className="text-sm text-[var(--rowi-muted)] mb-4">{t.chartSubtitle}</p>
            <EvolutionChart evolution={evo} predLabel={t.prediction} actualLabel={t.actual} />
          </motion.div>

          {/* Section 4: Before / After Comparison */}
          <div>
            <div className="mb-4">
              <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
                <Activity className="w-6 h-6 text-purple-500" /> {t.beforeAfterTitle}
              </h2>
              <p className="text-[var(--rowi-muted)]">{t.beforeAfterSubtitle}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* First Assessment Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <div className="font-bold">{t.firstAssessment}</div>
                    <div className="text-xs text-[var(--rowi-muted)]">{formatPeriodLabel(firstA.sourceDate)} &middot; {formatDate(firstA.sourceDate)}</div>
                  </div>
                </div>
                <div className="text-center mb-4">
                  <div className="text-4xl font-bold text-blue-500">{firstA.eqTotal.toFixed(1)}</div>
                  <div className="text-xs text-[var(--rowi-muted)]">EQ Total</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {COMP_KEYS.map((key) => (
                    <div key={key} className="flex justify-between px-2 py-1 rounded-lg bg-gray-50 dark:bg-zinc-800 text-sm">
                      <span className="text-[var(--rowi-muted)]">{key}</span>
                      <span className="font-mono font-medium">{((firstA as Record<string, number>)[key] ?? 0).toFixed(1)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-2 px-2 py-1 rounded-lg bg-gray-50 dark:bg-zinc-800 text-sm">
                  <Brain className="w-4 h-4 text-purple-500" />
                  <span className="text-[var(--rowi-muted)]">Brain Style:</span>
                  <span className="font-medium">{evo.brainStyle}</span>
                </div>
              </motion.div>

              {/* Latest Assessment Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 px-3 py-1 rounded-bl-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3" /> +{totalGrowthEQ} {t.points}
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <div className="font-bold">{t.latestAssessment}</div>
                    <div className="text-xs text-[var(--rowi-muted)]">{formatPeriodLabel(lastA.sourceDate)} &middot; {formatDate(lastA.sourceDate)}</div>
                  </div>
                </div>
                <div className="text-center mb-4">
                  <div className="text-4xl font-bold text-green-500">{lastA.eqTotal.toFixed(1)}</div>
                  <div className="text-xs text-[var(--rowi-muted)]">EQ Total</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {COMP_KEYS.map((key) => {
                    const firstVal = (firstA as Record<string, number>)[key] ?? 0;
                    const lastVal = (lastA as Record<string, number>)[key] ?? 0;
                    const delta = lastVal - firstVal;
                    return (
                      <div key={key} className="flex justify-between px-2 py-1 rounded-lg bg-gray-50 dark:bg-zinc-800 text-sm">
                        <span className="text-[var(--rowi-muted)]">{key}</span>
                        <span className="font-mono font-medium">
                          {lastVal.toFixed(1)}{" "}
                          <span className={`text-xs ${delta >= 0 ? "text-green-500" : "text-red-500"}`}>
                            {delta >= 0 ? "+" : ""}{delta.toFixed(1)}
                          </span>
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 flex items-center gap-2 px-2 py-1 rounded-lg bg-gray-50 dark:bg-zinc-800 text-sm">
                  <Brain className="w-4 h-4 text-purple-500" />
                  <span className="text-[var(--rowi-muted)]">Brain Style:</span>
                  <span className="font-medium">{evo.brainStyle}</span>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Section 5: Competency Growth Table */}
          {compGrowthData.length > 0 && topGrowthComp && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-zinc-800"
            >
              <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-500" /> {t.compGrowthTitle}
              </h2>
              <p className="text-sm text-[var(--rowi-muted)] mb-4">{t.compGrowthSubtitle}</p>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-zinc-700">
                      <th className="text-left py-2 px-2 font-medium text-[var(--rowi-muted)]">{t.competency}</th>
                      <th className="text-right py-2 px-2 font-medium text-[var(--rowi-muted)]">{t.firstScore}</th>
                      <th className="text-right py-2 px-2 font-medium text-[var(--rowi-muted)]">{t.latestScore}</th>
                      <th className="text-right py-2 px-2 font-medium text-[var(--rowi-muted)]">{t.growthPts}</th>
                      <th className="text-right py-2 px-2 font-medium text-[var(--rowi-muted)]">{t.growthPct}</th>
                      <th className="text-center py-2 px-2 font-medium text-[var(--rowi-muted)]">{t.rate}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compGrowthData.map((c) => {
                      const isTop = c.key === topGrowthComp.key;
                      return (
                        <motion.tr
                          key={c.key}
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          className={`border-b border-gray-100 dark:border-zinc-800 ${isTop ? "bg-green-50 dark:bg-green-900/10" : ""}`}
                        >
                          <td className="py-2.5 px-2 font-medium flex items-center gap-2">
                            {t[COMP_T_KEYS[c.key as CompKey] as keyof typeof t]}
                            {isTop && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                                <Award className="w-3 h-3" /> {t.topGrowth}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono">{c.first.toFixed(1)}</td>
                          <td className="py-2.5 px-2 text-right font-mono font-semibold">{c.last.toFixed(1)}</td>
                          <td className="py-2.5 px-2 text-right font-mono text-green-600 dark:text-green-400">+{c.growthPts.toFixed(1)}</td>
                          <td className="py-2.5 px-2 text-right font-mono text-purple-500">+{c.growthPct.toFixed(1)}%</td>
                          <td className="py-2.5 px-2 text-center">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                c.rate === "fast"
                                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                  : c.rate === "moderate"
                                    ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                                    : "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400"
                              }`}
                            >
                              {c.rate === "fast" ? t.rateFast : c.rate === "moderate" ? t.rateModerate : t.rateSlow}
                            </span>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Section 6: Growth Rate Analysis */}
          {topGrowthComp && strongestComp && (
            <div>
              <div className="mb-4">
                <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-purple-500" /> {t.growthRateTitle}
                </h2>
                <p className="text-[var(--rowi-muted)]">{t.growthRateSubtitle}</p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-white dark:bg-zinc-900 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-zinc-800 text-center">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="w-6 h-6 text-purple-500" />
                  </div>
                  <div className="text-3xl font-bold text-purple-600">{growthPerYear}</div>
                  <div className="text-xs text-[var(--rowi-muted)] mt-1">{t.avgGrowthRate}</div>
                  <div className="text-[10px] text-[var(--rowi-muted)]">{t.ptsPerYear}</div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="bg-white dark:bg-zinc-900 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-zinc-800 text-center">
                  <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-3">
                    <Zap className="w-6 h-6 text-green-500" />
                  </div>
                  <div className="text-lg font-bold text-green-600">{t[COMP_T_KEYS[topGrowthComp.key as CompKey] as keyof typeof t]}</div>
                  <div className="text-xs text-[var(--rowi-muted)] mt-1">{t.fastestComp}</div>
                  <div className="text-[10px] font-mono text-green-500">+{topGrowthComp.growthPts.toFixed(1)} pts</div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="bg-white dark:bg-zinc-900 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-zinc-800 text-center">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-3">
                    <Award className="w-6 h-6 text-blue-500" />
                  </div>
                  <div className="text-lg font-bold text-blue-600">{t[COMP_T_KEYS[strongestComp.key as CompKey] as keyof typeof t]}</div>
                  <div className="text-xs text-[var(--rowi-muted)] mt-1">{t.strongestComp}</div>
                  <div className="text-[10px] font-mono text-blue-500">{strongestComp.last.toFixed(1)} pts</div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="bg-white dark:bg-zinc-900 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-zinc-800 text-center">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-3">
                    <Target className="w-6 h-6 text-amber-500" />
                  </div>
                  <div className="text-3xl font-bold text-amber-600">{pred12}</div>
                  <div className="text-xs text-[var(--rowi-muted)] mt-1">{t.predicted12m}</div>
                  <div className="text-[10px] text-[var(--rowi-muted)]">+{(pred12 - lastA.eqTotal).toFixed(1)} pts</div>
                </motion.div>
              </div>
            </div>
          )}

          {/* Section 7: Duplicate ID Detection Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-zinc-800"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-500" /> {t.dupTitle}
                </h2>
                <p className="text-sm text-[var(--rowi-muted)]">{t.dupSubtitle}</p>
              </div>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 whitespace-nowrap">
                <Search className="w-3 h-3" /> {t.dupBadge}: {totalWithEvolution}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-zinc-700">
                    <th className="text-left py-2 px-2 font-medium text-[var(--rowi-muted)]">{t.dupId}</th>
                    <th className="text-left py-2 px-2 font-medium text-[var(--rowi-muted)]">{t.dupName}</th>
                    <th className="text-center py-2 px-2 font-medium text-[var(--rowi-muted)]">{t.dupCount}</th>
                    <th className="text-center py-2 px-2 font-medium text-[var(--rowi-muted)]">{t.dupFirst}</th>
                    <th className="text-center py-2 px-2 font-medium text-[var(--rowi-muted)]">{t.dupLast}</th>
                    <th className="text-right py-2 px-2 font-medium text-[var(--rowi-muted)]">{t.dupGrowth}</th>
                  </tr>
                </thead>
                <tbody>
                  {evolutions.map((e, i) => (
                    <motion.tr
                      key={e.sourceId}
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05 }}
                      className="border-b border-gray-100 dark:border-zinc-800 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-colors"
                    >
                      <td className="py-2.5 px-2 font-mono text-purple-500 font-medium">{formatDisplayId(e.sourceId)}</td>
                      <td className="py-2.5 px-2 font-medium">{e.country} &middot; {e.jobRole}</td>
                      <td className="py-2.5 px-2 text-center">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-bold">
                          {e.assessmentCount}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-center text-[var(--rowi-muted)] font-mono text-xs">{formatDate(e.firstDate)}</td>
                      <td className="py-2.5 px-2 text-center text-[var(--rowi-muted)] font-mono text-xs">{formatDate(e.lastDate)}</td>
                      <td className="py-2.5 px-2 text-right font-mono font-semibold text-green-600 dark:text-green-400">+{e.eqGrowth.toFixed(1)}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Section 8: Team Evolution Summary */}
          {evolutions.length > 1 && (
            <div>
              <div className="mb-4">
                <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
                  <Users className="w-6 h-6 text-purple-500" /> {t.teamTitle}
                </h2>
                <p className="text-[var(--rowi-muted)]">{t.teamSubtitle}</p>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800"
                >
                  <TeamBarChart evolutions={evolutions} />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800"
                >
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-zinc-700">
                        <th className="text-left py-2 px-2 font-medium text-[var(--rowi-muted)]">{t.teamName}</th>
                        <th className="text-right py-2 px-2 font-medium text-[var(--rowi-muted)]">{t.teamStart}</th>
                        <th className="text-right py-2 px-2 font-medium text-[var(--rowi-muted)]">{t.teamEnd}</th>
                        <th className="text-right py-2 px-2 font-medium text-[var(--rowi-muted)]">{t.teamChange}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamData.map((row, i) => (
                        <tr
                          key={row.id}
                          className={`border-b border-gray-100 dark:border-zinc-800 ${
                            i === 0 ? "bg-green-50 dark:bg-green-900/10" : i === teamData.length - 1 ? "bg-gray-50 dark:bg-zinc-800/50" : ""
                          }`}
                        >
                          <td className="py-2.5 px-2 font-medium flex items-center gap-2">
                            {row.name}
                            {i === 0 && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                                {t.teamMostGrowth}
                              </span>
                            )}
                            {i === teamData.length - 1 && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-200 dark:bg-zinc-700 text-gray-500">
                                {t.teamLeastGrowth}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-[var(--rowi-muted)]">{row.start.toFixed(1)}</td>
                          <td className="py-2.5 px-2 text-right font-mono font-semibold">{row.end.toFixed(1)}</td>
                          <td className="py-2.5 px-2 text-right font-mono font-bold text-green-600 dark:text-green-400">+{row.change.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </motion.div>
              </div>
            </div>
          )}

          {/* Section 9: Predictions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-zinc-800"
          >
            <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-500" /> {t.predTitle}
            </h2>
            <p className="text-sm text-[var(--rowi-muted)] mb-6">{t.predSubtitle}</p>

            <div className="grid sm:grid-cols-3 gap-6">
              <div className="text-center p-4 rounded-xl bg-gray-50 dark:bg-zinc-800">
                <div className="text-xs text-[var(--rowi-muted)] mb-2">{t.predCurrent}</div>
                <div className="text-4xl font-bold text-purple-600">{lastA.eqTotal.toFixed(1)}</div>
                <div className="text-xs text-[var(--rowi-muted)] mt-1">{formatPeriodLabel(lastA.sourceDate)}</div>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="text-center p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800"
              >
                <div className="text-xs text-purple-600 dark:text-purple-400 mb-2 font-medium">{t.pred6m}</div>
                <div className="text-4xl font-bold text-purple-600">{pred6}</div>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <ArrowUpRight className="w-3 h-3 text-green-500" />
                  <span className="text-xs font-mono text-green-600 dark:text-green-400">+{(pred6 - lastA.eqTotal).toFixed(1)} pts</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-center p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800"
              >
                <div className="text-xs text-amber-600 dark:text-amber-400 mb-2 font-medium">{t.pred12m}</div>
                <div className="text-4xl font-bold text-amber-600">{pred12}</div>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <ArrowUpRight className="w-3 h-3 text-green-500" />
                  <span className="text-xs font-mono text-green-600 dark:text-green-400">+{(pred12 - lastA.eqTotal).toFixed(1)} pts</span>
                </div>
              </motion.div>
            </div>

            <div className="mt-4 text-center text-xs text-[var(--rowi-muted)]">
              {t.predBasis} {growthPerYear} {t.ptsPerYear}
            </div>
          </motion.div>
        </>
      )}

      {/* Section 10: Info Box */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl p-6 flex gap-4"
      >
        <Shield className="w-6 h-6 text-purple-500 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-1">{t.infoTitle}</h3>
          <p className="text-sm text-purple-700 dark:text-purple-300">{t.infoDesc}</p>
        </div>
      </motion.div>

      {/* Navigation Footer */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between pt-6 border-t border-gray-200 dark:border-zinc-800">
        <Link
          href="/hub/admin/tp"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border-2 border-gray-200 dark:border-zinc-700 hover:border-purple-500 transition-colors font-medium"
        >
          <ArrowLeft className="w-5 h-5" /> {t.navPrev}
        </Link>
        <Link
          href="/hub/admin/tp"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:opacity-90 transition-opacity"
        >
          {t.navNext} <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
