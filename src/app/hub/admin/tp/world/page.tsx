"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Globe,
  Shield,
  Sparkles,
  TrendingUp,
  Award,
  Target,
  Users,
  BarChart3,
  Zap,
  Brain,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Loader2,
  AlertTriangle,
  BookOpen,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

/* =========================================================
   Translations — ES / EN
========================================================= */
const translations = {
  es: {
    backToHub: "TP Hub",
    badgeLabel: "Benchmark Global",
    pageTitle: "Benchmark Global — Teleperformance",
    pageSubtitle:
      "TP vs. el benchmark global Rowiverse. Comparaciones con datos reales de la comunidad global y el top 10%.",
    selectorTitle: "Seleccionar Comparación",
    benchmarkTPvsGlobal: "TP vs Rowiverse Global",
    benchmarkTPvsBPO: "TP vs Percentil 25",
    benchmarkTPvsTop10: "TP vs Top 10%",
    headToHeadTitle: "Comparación Directa",
    sampleSize: "Muestra",
    avgEQ: "EQ Promedio",
    compChartTitle: "Comparación de Competencias",
    compChartDesc: "8 competencias SEI: TP vs benchmark seleccionado (datos reales Rowiverse)",
    delta: "Delta",
    compEL: "Alfabetización Emocional",
    compRP: "Reconocer Patrones",
    compACT: "Pensamiento Consecuente",
    compNE: "Navegar Emociones",
    compIM: "Motivación Intrínseca",
    compOP: "Ejercer Optimismo",
    compEMP: "Aumentar Empatía",
    compNG: "Metas Nobles",
    outcomesTitle: "Comparación de Resultados",
    outcomesDesc: "Resultados de vida: TP vs benchmark seleccionado",
    outcomeEffectiveness: "Efectividad",
    outcomeRelationships: "Relaciones",
    outcomeWellbeing: "Bienestar",
    outcomeQuality: "Calidad de Vida",
    regionalTitle: "Posicionamiento Regional TP",
    regionalDesc: "Cada región TP comparada con el promedio global y la industria BPO",
    region: "Región",
    regionAvgEQ: "EQ Prom",
    regionN: "N",
    vsGlobal: "vs Global",
    vsBPO: "vs BPO",
    rank: "Posición",
    differentiatorTitle: "Diferenciadores de Top Performers",
    differentiatorDesc: "Qué distingue a los top performers de TP vs el promedio general",
    competency: "Competencia",
    tpTopAvg: "TP Top Prom",
    tpAllAvg: "TP Prom General",
    globalTopAvg: "Global Top Prom",
    gap: "Brecha",
    impact: "Impacto",
    impactHigh: "Alto",
    impactMedium: "Medio",
    impactLow: "Bajo",
    exceedsGlobal: "Supera al promedio",
    successTitle: "Patrones de Éxito por Rol",
    successDesc: "Las fórmulas de competencias que definen a los top performers en cada función",
    successFormula: "Fórmula de Éxito",
    topPerformerMatch: "de top performers con este patrón",
    keyInsight: "Hallazgo clave",
    gapTitle: "Brecha hacia Clase Mundial",
    gapDesc: "Cuánto necesita mejorar TP para alcanzar el top 10% global",
    current: "Actual TP",
    target: "Objetivo (Top 10%)",
    gapPoints: "Brecha",
    gapSummary: "TP necesita +{points} puntos promedio para alcanzar el top 10% mundial",
    infoTitle: "Datos de Benchmarking",
    infoDesc: "Todas las comparaciones utilizan datos 100% reales del benchmark Rowiverse (300,000+ evaluaciones globales) y datos reales de TP. Los percentiles se calculan directamente de la base de datos.",
    referenceData: "Benchmark Rowiverse (datos reales)",
    liveData: "Datos en vivo TP (API)",
    navROI: "ROI",
    navAlerts: "Alertas",
    loading: "Cargando datos del benchmark...",
    errorTitle: "Error al cargar datos",
    errorDesc: "No se pudieron cargar los datos del benchmark. Intenta de nuevo más tarde.",
    retry: "Reintentar",
    noData: "Sin datos disponibles",
    outcomeLabel: "Outcome",
    topPerformersCount: "Top Performers",
    effectSize: "Effect Size",
  },
  en: {
    backToHub: "TP Hub",
    badgeLabel: "World Benchmark",
    pageTitle: "World Benchmark — Teleperformance",
    pageSubtitle:
      "TP vs. Rowiverse global benchmark. Real data comparisons with the global community and top 10%.",
    selectorTitle: "Select Comparison",
    benchmarkTPvsGlobal: "TP vs Rowiverse Global",
    benchmarkTPvsBPO: "TP vs 25th Percentile",
    benchmarkTPvsTop10: "TP vs Top 10%",
    headToHeadTitle: "Head-to-Head Comparison",
    sampleSize: "Sample Size",
    avgEQ: "Avg EQ",
    compChartTitle: "Competency Comparison",
    compChartDesc: "8 SEI competencies: TP vs selected benchmark (real Rowiverse data)",
    delta: "Delta",
    compEL: "Enhance Emotional Literacy",
    compRP: "Recognize Patterns",
    compACT: "Apply Consequential Thinking",
    compNE: "Navigate Emotions",
    compIM: "Engage Intrinsic Motivation",
    compOP: "Exercise Optimism",
    compEMP: "Increase Empathy",
    compNG: "Pursue Noble Goals",
    outcomesTitle: "Outcomes Comparison",
    outcomesDesc: "Life outcomes: TP vs selected benchmark",
    outcomeEffectiveness: "Effectiveness",
    outcomeRelationships: "Relationships",
    outcomeWellbeing: "Wellbeing",
    outcomeQuality: "Quality of Life",
    regionalTitle: "TP Regional Positioning",
    regionalDesc: "Each TP region compared against global average and BPO industry",
    region: "Region",
    regionAvgEQ: "Avg EQ",
    regionN: "N",
    vsGlobal: "vs Global",
    vsBPO: "vs BPO",
    rank: "Rank",
    differentiatorTitle: "Top Performer Differentiators",
    differentiatorDesc: "What sets TP top performers apart from the overall average",
    competency: "Competency",
    tpTopAvg: "TP Top Avg",
    tpAllAvg: "TP Overall Avg",
    globalTopAvg: "Global Top Avg",
    gap: "Gap",
    impact: "Impact",
    impactHigh: "High",
    impactMedium: "Medium",
    impactLow: "Low",
    exceedsGlobal: "Exceeds average",
    successTitle: "Success Patterns by Role",
    successDesc: "The competency formulas that define top performers in each function",
    successFormula: "Success Formula",
    topPerformerMatch: "of top performers match this pattern",
    keyInsight: "Key insight",
    gapTitle: "Gap to World-Class",
    gapDesc: "How much TP needs to improve to reach the global top 10%",
    current: "Current TP",
    target: "Target (Top 10%)",
    gapPoints: "Gap",
    gapSummary: "TP needs +{points} average points to reach the global top 10%",
    infoTitle: "Benchmarking Data",
    infoDesc: "All comparisons use 100% real data from the Rowiverse benchmark (300,000+ global assessments) and real TP data. Percentiles are calculated directly from the database.",
    referenceData: "Rowiverse benchmark (real data)",
    liveData: "TP live data (API)",
    navROI: "ROI",
    navAlerts: "Alerts",
    loading: "Loading benchmark data...",
    errorTitle: "Error loading data",
    errorDesc: "Could not load benchmark data. Please try again later.",
    retry: "Retry",
    noData: "No data available",
    outcomeLabel: "Outcome",
    topPerformersCount: "Top Performers",
    effectSize: "Effect Size",
  },
};

/* =========================================================
   Constants
========================================================= */
const TP_BENCHMARK_ID = "tp-all-assessments-2025";
const ROWIVERSE_BENCHMARK_ID = "cml290jyy0004ky04bz5qu35v"; // rowi initial data — 273K+ global assessments

const COMP_KEYS = ["EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"] as const;
type CompKey = (typeof COMP_KEYS)[number];
const COMP_T_MAP: Record<CompKey, string> = {
  EL: "compEL", RP: "compRP", ACT: "compACT", NE: "compNE",
  IM: "compIM", OP: "compOP", EMP: "compEMP", NG: "compNG",
};

const OUTCOME_KEYS = ["effectiveness", "relationships", "wellbeing", "qualityOfLife"] as const;
type OutcomeKey = (typeof OUTCOME_KEYS)[number];
const OUTCOME_T_MAP: Record<OutcomeKey, string> = {
  effectiveness: "outcomeEffectiveness",
  relationships: "outcomeRelationships",
  wellbeing: "outcomeWellbeing",
  qualityOfLife: "outcomeQuality",
};

/* =========================================================
   Reference Benchmark Type — built dynamically from Rowiverse DB
========================================================= */
interface ReferenceBenchmark {
  name: { es: string; en: string };
  sampleSize: number;
  avgEQ: number;
  competencies: Record<string, number>;
  outcomes: Record<string, number>;
}

/** Fallback when Rowiverse data is loading/unavailable */
const EMPTY_BENCHMARK: ReferenceBenchmark = {
  name: { es: "Cargando...", en: "Loading..." },
  sampleSize: 0,
  avgEQ: 100,
  competencies: { EL: 100, RP: 100, ACT: 100, NE: 100, IM: 100, OP: 100, EMP: 100, NG: 100 },
  outcomes: { effectiveness: 100, relationships: 100, wellbeing: 100, qualityOfLife: 100 },
};

/* =========================================================
   Success Patterns — curated reference data
========================================================= */
const SUCCESS_PATTERNS = [
  {
    role: { es: "Servicio al Cliente", en: "Customer Service" },
    formula: "EMP + ACT + OP",
    topPerformerPct: 87,
    keyInsight: {
      es: "Los top performers combinan empatía alta con pensamiento consecuente para resolver problemas complejos",
      en: "Top performers combine high empathy with consequential thinking to solve complex problems",
    },
  },
  {
    role: { es: "Ventas", en: "Sales" },
    formula: "IM + ACT + RP",
    topPerformerPct: 82,
    keyInsight: {
      es: "La motivación intrínseca y el reconocimiento de patrones diferencian a los mejores vendedores",
      en: "Intrinsic motivation and pattern recognition differentiate top sales performers",
    },
  },
  {
    role: { es: "Recursos Humanos", en: "Human Resources" },
    formula: "EMP + NE + EL",
    topPerformerPct: 91,
    keyInsight: {
      es: "El trío empatía-navegación emocional-literacia emocional es la fórmula del éxito en HR",
      en: "The empathy-navigate emotions-emotional literacy trio is the HR success formula",
    },
  },
  {
    role: { es: "Operaciones", en: "Operations" },
    formula: "ACT + RP + NG",
    topPerformerPct: 78,
    keyInsight: {
      es: "El pensamiento estratégico y las metas nobles impulsan la excelencia operacional",
      en: "Strategic thinking and noble goals drive operational excellence",
    },
  },
  {
    role: { es: "IT", en: "IT" },
    formula: "ACT + RP + IM",
    topPerformerPct: 74,
    keyInsight: {
      es: "Pensamiento consecuente y motivación intrínseca son clave para resolver problemas técnicos",
      en: "Consequential thinking and intrinsic motivation are key for technical problem-solving",
    },
  },
];

/* =========================================================
   Types
========================================================= */
interface StatItem {
  metricKey: string;
  n: number;
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  p95: number;
}

interface RegionalGroup {
  name: string;
  count: number;
  metrics: Record<string, { mean: number; median: number; min: number; max: number; stdDev: number }>;
}

interface TopPerformerRecord {
  outcomeKey: string;
  sampleSize: number;
  totalPopulation: number;
  confidenceLevel: string;
  topCompetencies: Array<{
    key: string;
    avgScore: number;
    diffFromAvg: number;
    effectSize: number;
    effectInterpretation: string;
    isSignificant: boolean;
  }>;
  statistics: {
    globalMeans?: Record<string, number>;
    significantCompetencies: number;
    avgEffectSizeCompetencies: number;
  };
  avgEL?: number;
  avgRP?: number;
  avgACT?: number;
  avgNE?: number;
  avgIM?: number;
  avgOP?: number;
  avgEMP?: number;
  avgNG?: number;
}

interface TPBenchmark {
  name: string;
  sampleSize: number;
  avgEQ: number;
  competencies: Record<string, number>;
  outcomes: Record<string, number>;
}

type BenchmarkKey = "global" | "bpoIndustry" | "topTenPercent";

/* =========================================================
   Helpers
========================================================= */
function getBenchmarkName(bm: ReferenceBenchmark, lang: string): string {
  if (typeof bm.name === "string") return bm.name;
  return (bm.name as Record<string, string>)[lang] || (bm.name as Record<string, string>).es;
}

function deltaColor(val: number): string {
  if (val > 0.5) return "text-emerald-600 dark:text-emerald-400";
  if (val < -0.5) return "text-red-500 dark:text-red-400";
  return "text-amber-500 dark:text-amber-400";
}

function deltaBg(val: number): string {
  if (val > 0.5) return "bg-emerald-50 dark:bg-emerald-900/20";
  if (val < -0.5) return "bg-red-50 dark:bg-red-900/20";
  return "bg-amber-50 dark:bg-amber-900/20";
}

function formatDelta(val: number): string {
  return val >= 0 ? `+${val.toFixed(1)}` : val.toFixed(1);
}

const BENCHMARK_COLORS: Record<BenchmarkKey, string> = {
  global: "#3b82f6",
  bpoIndustry: "#f59e0b",
  topTenPercent: "#ef4444",
};

/** Map region names from DB to display-friendly keys */
function regionDisplayName(regionName: string, lang: string): string {
  const map: Record<string, Record<string, string>> = {
    "North America": { es: "Norteamérica", en: "North America" },
    "NA": { es: "Norteamérica", en: "North America" },
    "Latin America": { es: "Latinoamérica", en: "Latin America" },
    "LATAM": { es: "Latinoamérica", en: "Latin America" },
    "EMEA": { es: "EMEA", en: "EMEA" },
    "Europe": { es: "Europa", en: "Europe" },
    "Asia Pacific": { es: "Asia Pacífico", en: "Asia Pacific" },
    "APAC": { es: "Asia Pacífico", en: "Asia Pacific" },
  };
  return map[regionName]?.[lang] || regionName;
}

/* =========================================================
   Sub-Components
========================================================= */
function EQGauge({ score, color, label, size = 140 }: { score: number; color: string; label: string; size?: number }) {
  const min = 65;
  const max = 135;
  const pct = ((score - min) / (max - min)) * 100;
  const r = 45;
  const circumference = 2 * Math.PI * r;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={r} stroke="currentColor" strokeWidth="8" fill="none" className="text-gray-200 dark:text-zinc-800" />
          <motion.circle
            cx="60" cy="60" r={r}
            stroke={color}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{ strokeDasharray: circumference }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span className="text-3xl font-bold" style={{ color }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            {score.toFixed(1)}
          </motion.span>
        </div>
      </div>
      <span className="text-xs text-[var(--rowi-muted)] mt-2 text-center">{label}</span>
    </div>
  );
}

function CompetencyBarChart({
  tpComps, compareComps, compareColor,
}: {
  tpComps: Record<string, number>;
  compareComps: Record<string, number>;
  compareColor: string;
}) {
  const barHeight = 28;
  const gapY = 8;
  const labelWidth = 52;
  const chartWidth = 500;
  const barAreaWidth = chartWidth - labelWidth - 80;
  const svgHeight = COMP_KEYS.length * (barHeight + gapY) + 20;
  const minVal = 90;
  const maxVal = 125;
  const scaleX = (v: number) => ((Math.min(Math.max(v, minVal), maxVal) - minVal) / (maxVal - minVal)) * barAreaWidth;

  return (
    <div className="overflow-x-auto">
      <svg width={chartWidth} height={svgHeight} className="block mx-auto" aria-label="Competency comparison chart">
        {COMP_KEYS.map((key, i) => {
          const y = i * (barHeight + gapY) + 10;
          const tpVal = tpComps[key] || 0;
          const cmpVal = compareComps[key] || 0;
          const d = tpVal - cmpVal;
          const halfBar = (barHeight - 4) / 2;
          return (
            <g key={key}>
              <text x={0} y={y + barHeight / 2 + 4} className="text-[11px] font-medium fill-current">{key}</text>
              <motion.rect x={labelWidth} y={y} height={halfBar} rx={3} fill="#7B2D8E" initial={{ width: 0 }} animate={{ width: scaleX(tpVal) }} transition={{ duration: 0.8, delay: i * 0.05 }} />
              <text x={labelWidth + scaleX(tpVal) + 4} y={y + halfBar / 2 + 4} className="text-[10px]" style={{ fill: "#7B2D8E" }}>{tpVal.toFixed(1)}</text>
              <motion.rect x={labelWidth} y={y + halfBar + 2} height={halfBar} rx={3} fill={compareColor} fillOpacity={0.7} initial={{ width: 0 }} animate={{ width: scaleX(cmpVal) }} transition={{ duration: 0.8, delay: i * 0.05 + 0.1 }} />
              <text x={labelWidth + scaleX(cmpVal) + 4} y={y + halfBar + 2 + halfBar / 2 + 4} className="text-[10px]" style={{ fill: compareColor }}>{cmpVal.toFixed(1)}</text>
              <text x={chartWidth - 40} y={y + barHeight / 2 + 4} className="text-[10px] font-bold" style={{ fill: d >= 0 ? "#10b981" : "#ef4444" }} textAnchor="end">{formatDelta(d)}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function LoadingState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      >
        <Loader2 className="w-10 h-10 text-purple-500" />
      </motion.div>
      <p className="text-[var(--rowi-muted)] text-sm">{message}</p>
    </div>
  );
}

function ErrorState({ title, desc, onRetry }: { title: string; desc: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
        <AlertTriangle className="w-8 h-8 text-red-500" />
      </div>
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="text-[var(--rowi-muted)] text-sm text-center max-w-md">{desc}</p>
      <button
        onClick={onRetry}
        className="px-6 py-2.5 rounded-full bg-purple-500 text-white font-medium hover:bg-purple-600 transition-colors"
      >
        {onRetry.name || "Retry"}
      </button>
    </div>
  );
}

/* =========================================================
   Main Page
========================================================= */
export default function TPWorldPage() {
  const { lang } = useI18n();
  const t = translations[lang as keyof typeof translations] || translations.es;
  const [selectedBenchmark, setSelectedBenchmark] = useState<BenchmarkKey>("global");

  // --- Live data from APIs ---
  const [tpStats, setTpStats] = useState<StatItem[]>([]);
  const [regionalData, setRegionalData] = useState<RegionalGroup[]>([]);
  const [topPerformers, setTopPerformers] = useState<TopPerformerRecord[]>([]);
  const [rowiverseStats, setRowiverseStats] = useState<StatItem[]>([]);
  const [rowiverseSampleSize, setRowiverseSampleSize] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch TP stats + Rowiverse stats in parallel (using hardcoded Rowiverse ID)
      const [statsRes, regionRes, topRes, rvStatsRes] = await Promise.all([
        fetch(`/api/admin/benchmarks/${TP_BENCHMARK_ID}/stats`),
        fetch(`/api/admin/benchmarks/${TP_BENCHMARK_ID}/stats/grouped?groupBy=region`),
        fetch(`/api/admin/benchmarks/${TP_BENCHMARK_ID}/top-performers`),
        fetch(`/api/admin/benchmarks/${ROWIVERSE_BENCHMARK_ID}/stats`),
      ]);

      const statsData = await statsRes.json();
      const regionData = await regionRes.json();
      const topData = await topRes.json();
      const rvStatsData = await rvStatsRes.json();

      if (statsData.ok) setTpStats(statsData.statistics);
      else throw new Error(statsData.error || "Failed to load stats");

      if (regionData.ok) setRegionalData(regionData.groups);
      if (topData.ok) setTopPerformers(topData.topPerformers);

      // Rowiverse stats (273K+ global assessments)
      if (rvStatsData.ok) {
        setRowiverseStats(rvStatsData.statistics);
        const rvEq = rvStatsData.statistics?.find((s: StatItem) => s.metricKey === "eqTotal");
        setRowiverseSampleSize(rvEq?.n || 273197);
      }
    } catch (e: any) {
      console.error("Error loading benchmark data:", e);
      setError(e.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- Build TP benchmark from real stats ---
  const tpBenchmark: TPBenchmark | null = useMemo(() => {
    if (!tpStats.length) return null;
    const getStat = (key: string) => tpStats.find((s) => s.metricKey === key);
    return {
      name: "Teleperformance",
      sampleSize: getStat("eqTotal")?.n || 0,
      avgEQ: getStat("eqTotal")?.mean || 0,
      competencies: {
        EL: getStat("EL")?.mean || 0,
        RP: getStat("RP")?.mean || 0,
        ACT: getStat("ACT")?.mean || 0,
        NE: getStat("NE")?.mean || 0,
        IM: getStat("IM")?.mean || 0,
        OP: getStat("OP")?.mean || 0,
        EMP: getStat("EMP")?.mean || 0,
        NG: getStat("NG")?.mean || 0,
      },
      outcomes: {
        effectiveness: getStat("effectiveness")?.mean || 0,
        relationships: getStat("relationships")?.mean || 0,
        wellbeing: getStat("wellbeing")?.mean || 0,
        qualityOfLife: getStat("qualityOfLife")?.mean || 0,
      },
    };
  }, [tpStats]);

  // --- Build reference benchmarks from Rowiverse real data ---
  const referenceBenchmarks = useMemo((): Record<BenchmarkKey, ReferenceBenchmark> => {
    const getRvStat = (key: string) => rowiverseStats.find((s) => s.metricKey === key);

    const rvGlobal: ReferenceBenchmark = rowiverseStats.length
      ? {
          name: { es: "Rowiverse Global", en: "Rowiverse Global" },
          sampleSize: rowiverseSampleSize || getRvStat("eqTotal")?.n || 0,
          avgEQ: getRvStat("eqTotal")?.mean || 100,
          competencies: {
            EL: getRvStat("EL")?.mean || 100,
            RP: getRvStat("RP")?.mean || 100,
            ACT: getRvStat("ACT")?.mean || 100,
            NE: getRvStat("NE")?.mean || 100,
            IM: getRvStat("IM")?.mean || 100,
            OP: getRvStat("OP")?.mean || 100,
            EMP: getRvStat("EMP")?.mean || 100,
            NG: getRvStat("NG")?.mean || 100,
          },
          outcomes: {
            effectiveness: getRvStat("effectiveness")?.mean || 100,
            relationships: getRvStat("relationships")?.mean || 100,
            wellbeing: getRvStat("wellbeing")?.mean || 100,
            qualityOfLife: getRvStat("qualityOfLife")?.mean || 100,
          },
        }
      : { ...EMPTY_BENCHMARK, name: { es: "Rowiverse Global", en: "Rowiverse Global" } };

    // Top 10% = p90 from the Rowiverse data
    const rvTop10: ReferenceBenchmark = rowiverseStats.length
      ? {
          name: { es: "Top 10% Rowiverse", en: "Rowiverse Top 10%" },
          sampleSize: Math.round((getRvStat("eqTotal")?.n || 0) * 0.1),
          avgEQ: getRvStat("eqTotal")?.p90 || 118,
          competencies: {
            EL: getRvStat("EL")?.p90 || 116,
            RP: getRvStat("RP")?.p90 || 117,
            ACT: getRvStat("ACT")?.p90 || 119,
            NE: getRvStat("NE")?.p90 || 117,
            IM: getRvStat("IM")?.p90 || 119,
            OP: getRvStat("OP")?.p90 || 118,
            EMP: getRvStat("EMP")?.p90 || 120,
            NG: getRvStat("NG")?.p90 || 116,
          },
          outcomes: {
            effectiveness: getRvStat("effectiveness")?.p90 || 119,
            relationships: getRvStat("relationships")?.p90 || 120,
            wellbeing: getRvStat("wellbeing")?.p90 || 118,
            qualityOfLife: getRvStat("qualityOfLife")?.p90 || 117,
          },
        }
      : { ...EMPTY_BENCHMARK, name: { es: "Top 10% Rowiverse", en: "Rowiverse Top 10%" } };

    // Bottom 25% = p25 from the Rowiverse data (used as "BPO Industry" equivalent = low-performing segment)
    const rvBottom25: ReferenceBenchmark = rowiverseStats.length
      ? {
          name: { es: "Percentil 25 Rowiverse", en: "Rowiverse 25th Percentile" },
          sampleSize: Math.round((getRvStat("eqTotal")?.n || 0) * 0.25),
          avgEQ: getRvStat("eqTotal")?.p25 || 96,
          competencies: {
            EL: getRvStat("EL")?.p25 || 95,
            RP: getRvStat("RP")?.p25 || 96,
            ACT: getRvStat("ACT")?.p25 || 97,
            NE: getRvStat("NE")?.p25 || 94,
            IM: getRvStat("IM")?.p25 || 97,
            OP: getRvStat("OP")?.p25 || 96,
            EMP: getRvStat("EMP")?.p25 || 95,
            NG: getRvStat("NG")?.p25 || 96,
          },
          outcomes: {
            effectiveness: getRvStat("effectiveness")?.p25 || 98,
            relationships: getRvStat("relationships")?.p25 || 95,
            wellbeing: getRvStat("wellbeing")?.p25 || 94,
            qualityOfLife: getRvStat("qualityOfLife")?.p25 || 96,
          },
        }
      : { ...EMPTY_BENCHMARK, name: { es: "Percentil 25 Rowiverse", en: "Rowiverse 25th Percentile" } };

    return {
      global: rvGlobal,
      bpoIndustry: rvBottom25,
      topTenPercent: rvTop10,
    };
  }, [rowiverseStats, rowiverseSampleSize]);

  // --- Build regional comparison from real grouped data ---
  const regionsComparison = useMemo(() => {
    if (!regionalData.length) return [];
    const globalRef = referenceBenchmarks.global;
    const bpoRef = referenceBenchmarks.bpoIndustry;

    return regionalData
      .filter((g) => g.metrics.eqTotal)
      .map((g, idx) => ({
        regionName: g.name,
        count: g.count,
        avgEQ: g.metrics.eqTotal?.mean || 0,
        vsGlobal: (g.metrics.eqTotal?.mean || 0) - globalRef.avgEQ,
        vsBPO: (g.metrics.eqTotal?.mean || 0) - bpoRef.avgEQ,
      }))
      .sort((a, b) => b.avgEQ - a.avgEQ)
      .map((r, i) => ({ ...r, rank: i + 1 }));
  }, [regionalData]);

  // --- Build top performer differentiators from real data ---
  const differentiators = useMemo(() => {
    if (!topPerformers.length || !tpBenchmark) return [];

    // Use "effectiveness" outcome as the primary differentiator (or first available)
    const primaryOutcome = topPerformers.find((tp) => tp.outcomeKey === "effectiveness") || topPerformers[0];
    if (!primaryOutcome || !primaryOutcome.topCompetencies) return [];

    const globalMeans = primaryOutcome.statistics?.globalMeans || {};

    return COMP_KEYS.map((key) => {
      const topComp = primaryOutcome.topCompetencies?.find((c: any) => c.key === key);
      const tpTopAvg = topComp?.avgScore || 0;
      const tpAllAvg = tpBenchmark.competencies[key] || 0;
      const effectSize = topComp?.effectSize || 0;
      const diffFromAvg = topComp?.diffFromAvg || 0;
      const absEffect = Math.abs(effectSize);

      let impact: "high" | "medium" | "low" = "low";
      if (absEffect >= 0.8) impact = "high";
      else if (absEffect >= 0.5) impact = "medium";

      return {
        competency: key as CompKey,
        tKey: COMP_T_MAP[key as CompKey],
        tpTopAvg,
        tpAllAvg,
        gap: diffFromAvg,
        effectSize,
        impact,
        isSignificant: topComp?.isSignificant || false,
      };
    })
      .filter((d) => d.tpTopAvg > 0)
      .sort((a, b) => Math.abs(b.effectSize) - Math.abs(a.effectSize));
  }, [topPerformers, tpBenchmark]);

  // --- Reference benchmark for comparison ---
  const compare = referenceBenchmarks[selectedBenchmark];
  const compareName = getBenchmarkName(compare, lang);
  const compareColor = BENCHMARK_COLORS[selectedBenchmark];

  // --- Gap to World-Class ---
  const avgGap = useMemo(() => {
    if (!tpBenchmark) return 0;
    const gapSum = COMP_KEYS.reduce(
      (acc, k) => acc + (referenceBenchmarks.topTenPercent.competencies[k] - (tpBenchmark.competencies[k] || 0)),
      0
    );
    return gapSum / COMP_KEYS.length;
  }, [tpBenchmark]);

  // --- Loading & Error states ---
  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <Link href="/hub/admin/tp" className="inline-flex items-center gap-2 text-sm text-[var(--rowi-muted)] hover:text-purple-500 transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" /> {t.backToHub}
          </Link>
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-500 mb-3">
              <Globe className="w-3 h-3" /> {t.badgeLabel}
            </span>
            <h1 className="text-3xl font-bold mb-2">{t.pageTitle}</h1>
          </div>
        </div>
        <LoadingState message={t.loading} />
      </div>
    );
  }

  if (error || !tpBenchmark) {
    return (
      <div className="space-y-8">
        <div>
          <Link href="/hub/admin/tp" className="inline-flex items-center gap-2 text-sm text-[var(--rowi-muted)] hover:text-purple-500 transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" /> {t.backToHub}
          </Link>
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-500 mb-3">
              <Globe className="w-3 h-3" /> {t.badgeLabel}
            </span>
            <h1 className="text-3xl font-bold mb-2">{t.pageTitle}</h1>
          </div>
        </div>
        <ErrorState title={t.errorTitle} desc={t.errorDesc} onRetry={loadData} />
      </div>
    );
  }

  const tp = tpBenchmark;

  return (
    <div className="space-y-8">
      {/* -- Header -- */}
      <div>
        <Link href="/hub/admin/tp" className="inline-flex items-center gap-2 text-sm text-[var(--rowi-muted)] hover:text-purple-500 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> {t.backToHub}
        </Link>
        <div>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-500 mb-3">
            <Globe className="w-3 h-3" /> {t.badgeLabel}
          </span>
          <h1 className="text-3xl font-bold mb-2">{t.pageTitle}</h1>
          <p className="text-[var(--rowi-muted)]">{t.pageSubtitle}</p>
        </div>
      </div>

      {/* -- Benchmark Selector -- */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-gray-100 dark:border-zinc-800">
        <h2 className="text-sm font-semibold mb-4 flex items-center gap-2 text-[var(--rowi-muted)]">
          <BarChart3 className="w-4 h-4" /> {t.selectorTitle}
        </h2>
        <div className="flex flex-wrap gap-3">
          {([
            { key: "global" as BenchmarkKey, label: t.benchmarkTPvsGlobal, color: "#3b82f6" },
            { key: "bpoIndustry" as BenchmarkKey, label: t.benchmarkTPvsBPO, color: "#f59e0b" },
            { key: "topTenPercent" as BenchmarkKey, label: t.benchmarkTPvsTop10, color: "#ef4444" },
          ]).map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSelectedBenchmark(opt.key)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                selectedBenchmark === opt.key
                  ? "text-white shadow-lg"
                  : "bg-gray-100 dark:bg-zinc-800 text-[var(--rowi-muted)] hover:bg-gray-200 dark:hover:bg-zinc-700"
              }`}
              style={selectedBenchmark === opt.key ? { backgroundColor: opt.color } : undefined}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-4 text-[10px] text-[var(--rowi-muted)]">
          <span className="inline-flex items-center gap-1"><Sparkles className="w-3 h-3 text-purple-500" /> {t.liveData}</span>
          <span className="inline-flex items-center gap-1"><BookOpen className="w-3 h-3 text-blue-500" /> {t.referenceData}</span>
        </div>
      </motion.div>

      {/* -- Head-to-Head Comparison -- */}
      <div>
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <Target className="w-6 h-6 text-purple-500" /> {t.headToHeadTitle}
        </h2>
        <div className="grid md:grid-cols-2 gap-6 mt-4">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white dark:bg-zinc-900 rounded-2xl p-8 border-2 border-purple-500/30 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Award className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg">{tp.name}</h3>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                    <Sparkles className="w-2.5 h-2.5" /> LIVE
                  </span>
                </div>
                <p className="text-xs text-[var(--rowi-muted)]">{t.sampleSize}: {tp.sampleSize.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex justify-center">
              <EQGauge score={tp.avgEQ} color="#7B2D8E" label={t.avgEQ} />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white dark:bg-zinc-900 rounded-2xl p-8 border-2 shadow-lg" style={{ borderColor: `${compareColor}50` }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${compareColor}15` }}>
                <Globe className="w-5 h-5" style={{ color: compareColor }} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg">{compareName}</h3>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                    <Sparkles className="w-2.5 h-2.5" /> ROWIVERSE
                  </span>
                </div>
                <p className="text-xs text-[var(--rowi-muted)]">{t.sampleSize}: {compare.sampleSize.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex justify-center">
              <EQGauge score={compare.avgEQ} color={compareColor} label={t.avgEQ} />
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className={`mt-4 rounded-xl p-4 flex items-center justify-center gap-3 text-sm font-semibold ${deltaBg(tp.avgEQ - compare.avgEQ)} ${deltaColor(tp.avgEQ - compare.avgEQ)}`}
        >
          {tp.avgEQ - compare.avgEQ >= 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
          <span>TP {formatDelta(tp.avgEQ - compare.avgEQ)} {t.delta} vs {compareName}</span>
        </motion.div>
      </div>

      {/* -- Competency Comparison Chart -- */}
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-white dark:bg-zinc-900 rounded-2xl p-8 border border-gray-100 dark:border-zinc-800">
        <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-500" /> {t.compChartTitle}
        </h2>
        <p className="text-sm text-[var(--rowi-muted)] mb-6">{t.compChartDesc}</p>
        <div className="flex items-center gap-6 mb-4 text-xs">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#7B2D8E" }} /><span>Teleperformance</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: compareColor }} /><span>{compareName}</span></div>
          <div className="flex items-center gap-2 ml-auto"><span className="text-[var(--rowi-muted)]">{t.delta}</span></div>
        </div>
        <CompetencyBarChart tpComps={tp.competencies} compareComps={compare.competencies} compareColor={compareColor} />
      </motion.div>

      {/* -- Outcomes Comparison -- */}
      <div>
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-purple-500" /> {t.outcomesTitle}
        </h2>
        <p className="text-[var(--rowi-muted)] mb-4">{t.outcomesDesc}</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {OUTCOME_KEYS.map((key, i) => {
            const tpVal = tp.outcomes[key] || 0;
            const cmpVal = compare.outcomes[key];
            const d = tpVal - cmpVal;
            const tKey = OUTCOME_T_MAP[key] as keyof typeof t;
            return (
              <motion.div key={key} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-white dark:bg-zinc-900 rounded-xl p-5 border border-gray-100 dark:border-zinc-800">
                <div className="text-sm font-medium text-[var(--rowi-muted)] mb-3">{t[tKey]}</div>
                <div className="flex items-end justify-between mb-2">
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{tpVal.toFixed(1)}</div>
                    <div className="text-[10px] text-[var(--rowi-muted)]">TP</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold" style={{ color: compareColor }}>{cmpVal.toFixed(1)}</div>
                    <div className="text-[10px] text-[var(--rowi-muted)]">{compareName}</div>
                  </div>
                </div>
                <div className={`flex items-center gap-1 text-xs font-semibold rounded-md px-2 py-1 ${deltaBg(d)} ${deltaColor(d)}`}>
                  {d >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {formatDelta(d)}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* -- Regional Positioning (Real Data) -- */}
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-white dark:bg-zinc-900 rounded-2xl p-8 border border-gray-100 dark:border-zinc-800">
        <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
          <Globe className="w-5 h-5 text-purple-500" /> {t.regionalTitle}
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
            <Sparkles className="w-2.5 h-2.5" /> LIVE
          </span>
        </h2>
        <p className="text-sm text-[var(--rowi-muted)] mb-6">{t.regionalDesc}</p>
        {regionsComparison.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-zinc-700">
                  <th className="text-left py-3 px-2 font-semibold text-[var(--rowi-muted)]">{t.region}</th>
                  <th className="text-center py-3 px-2 font-semibold text-[var(--rowi-muted)]">{t.regionN}</th>
                  <th className="text-center py-3 px-2 font-semibold text-[var(--rowi-muted)]">{t.regionAvgEQ}</th>
                  <th className="text-center py-3 px-2 font-semibold text-[var(--rowi-muted)]">{t.vsGlobal}</th>
                  <th className="text-center py-3 px-2 font-semibold text-[var(--rowi-muted)]">{t.vsBPO}</th>
                  <th className="text-center py-3 px-2 font-semibold text-[var(--rowi-muted)]">{t.rank}</th>
                </tr>
              </thead>
              <tbody>
                {regionsComparison.map((row, i) => (
                  <motion.tr key={row.regionName} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="border-b border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="py-3 px-2 font-medium">{regionDisplayName(row.regionName, lang)}</td>
                    <td className="py-3 px-2 text-center text-[var(--rowi-muted)] text-xs">{row.count.toLocaleString()}</td>
                    <td className="py-3 px-2 text-center font-mono font-bold text-purple-600">{row.avgEQ.toFixed(1)}</td>
                    <td className="py-3 px-2 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${deltaBg(row.vsGlobal)} ${deltaColor(row.vsGlobal)}`}>
                        {row.vsGlobal >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {formatDelta(row.vsGlobal)}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${deltaBg(row.vsBPO)} ${deltaColor(row.vsBPO)}`}>
                        {row.vsBPO >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {formatDelta(row.vsBPO)}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-bold">#{row.rank}</span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-[var(--rowi-muted)] text-center py-8">{t.noData}</p>
        )}
      </motion.div>

      {/* -- Top Performer Differentiators (Real Data) -- */}
      <div>
        <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
          <Star className="w-6 h-6 text-purple-500" /> {t.differentiatorTitle}
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
            <Sparkles className="w-2.5 h-2.5" /> LIVE
          </span>
        </h2>
        <p className="text-[var(--rowi-muted)] mb-4">{t.differentiatorDesc}</p>
        {differentiators.length > 0 ? (
          <div className="grid gap-3">
            {differentiators.map((item, i) => {
              const isPositive = item.gap >= 0;
              const impactLabel = item.impact === "high" ? t.impactHigh : item.impact === "medium" ? t.impactMedium : t.impactLow;
              const impactColor = item.impact === "high"
                ? "bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                : item.impact === "medium"
                  ? "bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
                  : "bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-gray-400";
              const tKey = item.tKey as keyof typeof t;
              return (
                <motion.div
                  key={item.competency}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className={`bg-white dark:bg-zinc-900 rounded-xl p-4 border ${isPositive ? "border-emerald-200 dark:border-emerald-800" : "border-gray-100 dark:border-zinc-800"} flex flex-col sm:flex-row sm:items-center gap-3`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600 font-bold text-sm shrink-0">{item.competency}</div>
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{t[tKey]}</div>
                      <div className="text-[10px] text-[var(--rowi-muted)]">{t.tpAllAvg}: {item.tpAllAvg.toFixed(1)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-bold text-purple-600">{item.tpTopAvg.toFixed(1)}</div>
                      <div className="text-[10px] text-[var(--rowi-muted)]">{t.tpTopAvg}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-[var(--rowi-muted)]">{item.tpAllAvg.toFixed(1)}</div>
                      <div className="text-[10px] text-[var(--rowi-muted)]">{t.tpAllAvg}</div>
                    </div>
                    <div className={`px-2.5 py-1 rounded-lg text-xs font-bold ${isPositive ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600" : "bg-red-50 dark:bg-red-900/20 text-red-500"}`}>
                      {formatDelta(item.gap)}
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${impactColor}`}>{impactLabel}</span>
                    {isPositive && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold whitespace-nowrap">{t.exceedsGlobal}</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-[var(--rowi-muted)] text-center py-8">{t.noData}</p>
        )}
      </div>

      {/* -- Success Patterns by Role -- */}
      <div>
        <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
          <Zap className="w-6 h-6 text-purple-500" /> {t.successTitle}
        </h2>
        <p className="text-[var(--rowi-muted)] mb-4">{t.successDesc}</p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SUCCESS_PATTERNS.map((pattern, i) => {
            const roleName = (pattern.role as Record<string, string>)[lang] || pattern.role.es;
            const insight = (pattern.keyInsight as Record<string, string>)[lang] || pattern.keyInsight.es;
            return (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-gray-100 dark:border-zinc-800 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-500" />
                  </div>
                  <h3 className="font-bold">{roleName}</h3>
                </div>
                <div className="mb-4">
                  <div className="text-[10px] text-[var(--rowi-muted)] uppercase tracking-wide mb-1">{t.successFormula}</div>
                  <div className="flex items-center gap-1.5">
                    {pattern.formula.split(" + ").map((comp, ci) => (
                      <span key={ci} className="flex items-center gap-1.5">
                        {ci > 0 && <span className="text-purple-400 text-xs">+</span>}
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-bold">{comp}</span>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[var(--rowi-muted)]">{t.topPerformerMatch}</span>
                    <span className="font-bold text-purple-600">{pattern.topPerformerPct}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500" initial={{ width: 0 }} whileInView={{ width: `${pattern.topPerformerPct}%` }} viewport={{ once: true }} transition={{ duration: 1 }} />
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-lg p-3">
                  <div className="text-[10px] text-[var(--rowi-muted)] uppercase tracking-wide mb-1">{t.keyInsight}</div>
                  <p className="text-xs leading-relaxed">{insight}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* -- Gap to World-Class Analysis -- */}
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-white dark:bg-zinc-900 rounded-2xl p-8 border border-gray-100 dark:border-zinc-800">
        <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-500" /> {t.gapTitle}
        </h2>
        <p className="text-sm text-[var(--rowi-muted)] mb-6">{t.gapDesc}</p>
        <div className="space-y-4">
          {COMP_KEYS.map((key, i) => {
            const current = tp.competencies[key] || 0;
            const targetVal = referenceBenchmarks.topTenPercent.competencies[key];
            const gapVal = targetVal - current;
            const minVal = 90;
            const maxVal = 125;
            const currentPct = ((current - minVal) / (maxVal - minVal)) * 100;
            const targetPct = ((targetVal - minVal) / (maxVal - minVal)) * 100;
            const tKey = COMP_T_MAP[key] as keyof typeof t;
            return (
              <motion.div key={key} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600 text-[10px] font-bold">{key}</span>
                    <span className="font-medium text-xs">{t[tKey]}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-[var(--rowi-muted)]">{t.current}: <span className="font-mono font-bold text-purple-600">{current.toFixed(1)}</span></span>
                    <span className="text-[var(--rowi-muted)]">{t.target}: <span className="font-mono font-bold text-red-500">{targetVal.toFixed(1)}</span></span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${gapVal > 0 ? "bg-red-50 dark:bg-red-900/20 text-red-500" : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600"}`}>
                      {t.gapPoints}: {gapVal > 0 ? `+${gapVal.toFixed(1)}` : gapVal.toFixed(1)}
                    </span>
                  </div>
                </div>
                <div className="relative h-3 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div className="absolute h-full rounded-full bg-gradient-to-r from-purple-500 to-purple-600" initial={{ width: 0 }} whileInView={{ width: `${Math.min(Math.max(currentPct, 0), 100)}%` }} viewport={{ once: true }} transition={{ duration: 0.8, delay: i * 0.05 }} />
                  <div className="absolute top-0 h-full w-0.5 bg-red-500" style={{ left: `${Math.min(Math.max(targetPct, 0), 100)}%` }} />
                  <div className="absolute -top-1 w-2 h-2 rounded-full bg-red-500 border border-white dark:border-zinc-900" style={{ left: `${Math.min(Math.max(targetPct, 0), 100)}%`, transform: "translateX(-50%)" }} />
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.5 }} className="mt-8 p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-3">
            <Target className="w-6 h-6 text-purple-500 shrink-0" />
            <p className="text-sm font-semibold text-purple-800 dark:text-purple-200">
              {t.gapSummary.replace("{points}", avgGap.toFixed(1))}
            </p>
          </div>
        </motion.div>

        <div className="flex items-center gap-6 mt-4 text-xs text-[var(--rowi-muted)]">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-purple-600" /><span>{t.current}</span></div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500" /><span>{t.target}</span></div>
        </div>
      </motion.div>

      {/* -- Info Box -- */}
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl p-6 flex gap-4">
        <Shield className="w-6 h-6 text-purple-500 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-1">{t.infoTitle}</h3>
          <p className="text-sm text-purple-700 dark:text-purple-300">{t.infoDesc}</p>
        </div>
      </motion.div>

      {/* -- Navigation Footer -- */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between pt-6 border-t border-gray-200 dark:border-zinc-800">
        <Link href="/hub/admin/tp" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border-2 border-gray-200 dark:border-zinc-700 hover:border-purple-500 transition-colors font-medium">
          <ArrowLeft className="w-5 h-5" /> {t.navROI}
        </Link>
        <Link href="/hub/admin/tp" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:opacity-90 transition-opacity">
          {t.navAlerts} <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
