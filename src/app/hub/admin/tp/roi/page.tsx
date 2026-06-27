"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Shield,
  TrendingUp,
  DollarSign,
  Target,
  BarChart3,
  Clock,
  Zap,
  Calculator,
  Building2,
  Minus,
  Plus,
  Activity,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

/* =========================================================
   Constants
========================================================= */
const TP_BENCHMARK_ID = "tp-all-assessments-2025";

/* =========================================================
   Industry Benchmarks (external reference data, not from DB)
========================================================= */
const INDUSTRY_BENCHMARKS = [
  { id: "bpo", name: { es: "BPO / Contact Center", en: "BPO / Contact Center" }, avgCostPerPoint: 185, avgROI: 340, avgTimeMonths: 8, turnoverReduction: 22, productivityGain: 18, satisfactionGain: 24 },
  { id: "tech", name: { es: "Tecnología", en: "Technology" }, avgCostPerPoint: 220, avgROI: 410, avgTimeMonths: 10, turnoverReduction: 18, productivityGain: 22, satisfactionGain: 20 },
  { id: "healthcare", name: { es: "Salud", en: "Healthcare" }, avgCostPerPoint: 195, avgROI: 380, avgTimeMonths: 9, turnoverReduction: 25, productivityGain: 15, satisfactionGain: 28 },
  { id: "finance", name: { es: "Finanzas", en: "Finance" }, avgCostPerPoint: 250, avgROI: 450, avgTimeMonths: 12, turnoverReduction: 16, productivityGain: 20, satisfactionGain: 18 },
  { id: "retail", name: { es: "Retail", en: "Retail" }, avgCostPerPoint: 160, avgROI: 290, avgTimeMonths: 7, turnoverReduction: 28, productivityGain: 16, satisfactionGain: 26 },
];

/* =========================================================
   TP baseline assumptions (non-API reference constants)
========================================================= */
const TP_BASELINE = {
  avgSalary: 42000,
  turnoverRate: 34,
  costPerHire: 4200,
  avgProductivity: 78,
};

/* =========================================================
   Types
========================================================= */
interface CorrelationItem {
  outcomeKey: string;
  competencyKey: string;
  correlation: number;
  strength: string;
}

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

/* =========================================================
   Build correlation matrix from API data
========================================================= */
function buildCorrelationMatrix(
  correlations: CorrelationItem[]
): Record<string, Record<string, number>> {
  const matrix: Record<string, Record<string, number>> = {};
  const outcomes = ["effectiveness", "relationships", "wellbeing", "qualityOfLife"];

  for (const corr of correlations) {
    if (!outcomes.includes(corr.outcomeKey)) continue;
    if (!matrix[corr.competencyKey]) {
      matrix[corr.competencyKey] = {};
    }
    matrix[corr.competencyKey][corr.outcomeKey] = corr.correlation;
  }

  return matrix;
}

/* =========================================================
   Extract TP current stats from API data
========================================================= */
function extractTpCurrent(stats: StatItem[]) {
  const eqStat = stats.find((s) => s.metricKey === "eqTotal");
  const effectivenessStat = stats.find((s) => s.metricKey === "effectiveness");
  const relationshipsStat = stats.find((s) => s.metricKey === "relationships");
  const wellbeingStat = stats.find((s) => s.metricKey === "wellbeing");
  const qualityOfLifeStat = stats.find((s) => s.metricKey === "qualityOfLife");

  return {
    avgEQ: eqStat?.mean ?? 98.7,
    totalAssessments: eqStat?.n ?? 0,
    avgProductivity: TP_BASELINE.avgProductivity,
    avgSalary: TP_BASELINE.avgSalary,
    turnoverRate: TP_BASELINE.turnoverRate,
    costPerHire: TP_BASELINE.costPerHire,
    // Outcome scores from stats (mean values, scaled to percentage-like for display)
    outcomeScores: {
      effectiveness: effectivenessStat?.mean ?? TP_BASELINE.avgProductivity,
      relationships: relationshipsStat?.mean ?? TP_BASELINE.avgProductivity - 2,
      wellbeing: wellbeingStat?.mean ?? TP_BASELINE.avgProductivity - 5,
      qualityOfLife: qualityOfLifeStat?.mean ?? TP_BASELINE.avgProductivity - 3,
    },
  };
}

/* =========================================================
   Helper: Calculate Projections
========================================================= */
function calculateProjections(
  budget: number,
  duration: number,
  population: number,
  improvement: number,
  correlationMatrix: Record<string, Record<string, number>>,
  tpCurrent: ReturnType<typeof extractTpCurrent>
) {
  const outcomes = ["effectiveness", "relationships", "wellbeing", "qualityOfLife"] as const;
  const competencies = Object.keys(correlationMatrix);

  const avgCorrelations: Record<string, number> = {};
  outcomes.forEach((outcome) => {
    if (competencies.length === 0) {
      avgCorrelations[outcome] = 0.6; // fallback
      return;
    }
    const total = competencies.reduce(
      (sum, comp) => sum + (correlationMatrix[comp]?.[outcome] ?? 0),
      0
    );
    avgCorrelations[outcome] = total / competencies.length;
  });

  const outcomeGains: Record<string, number> = {};
  outcomes.forEach((outcome) => {
    outcomeGains[outcome] = improvement * avgCorrelations[outcome] * 0.8;
  });

  const costPerEmployee = budget / population;
  const costPerPoint = costPerEmployee / improvement;
  const bpoBenchmarkCostPerPoint = 185;

  const turnoverReductionPct = improvement * 1.8;
  const projectedTurnoverRate = Math.max(tpCurrent.turnoverRate - turnoverReductionPct, 8);
  const turnoverSavings = (turnoverReductionPct / 100) * population * tpCurrent.costPerHire;

  const productivityGainPct = outcomeGains["effectiveness"];
  const revenueImpact = (productivityGainPct / 100) * population * tpCurrent.avgSalary * 0.3;

  const totalSavings = turnoverSavings + revenueImpact;
  const roiPercentage = ((totalSavings - budget) / budget) * 100;
  const paybackMonths = Math.max(1, Math.ceil((budget / totalSavings) * 12));

  return {
    outcomeGains,
    costPerEmployee,
    costPerPoint,
    bpoBenchmarkCostPerPoint,
    turnoverReductionPct,
    projectedTurnoverRate,
    turnoverSavings,
    productivityGainPct,
    revenueImpact,
    totalSavings,
    roiPercentage,
    paybackMonths,
  };
}

/* =========================================================
   Components
========================================================= */
function SliderInput({
  label,
  value,
  min,
  max,
  step,
  unit,
  prefix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  prefix?: string;
  onChange: (v: number) => void;
}) {
  const formatValue = (v: number) => {
    if (prefix === "$") {
      return v >= 1000000 ? `$${(v / 1000000).toFixed(1)}M` : `$${(v / 1000).toFixed(0)}K`;
    }
    return v.toLocaleString();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        <span className="text-sm font-bold text-purple-600">
          {formatValue(value)}
          {unit ? ` ${unit}` : ""}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(min, value - step))}
          className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
        >
          <Minus className="w-3 h-3" />
        </button>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 h-2 bg-gray-200 dark:bg-zinc-700 rounded-full appearance-none cursor-pointer accent-purple-500"
        />
        <button
          onClick={() => onChange(Math.min(max, value + step))}
          className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

function DurationSelector({
  label,
  value,
  options,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  options: number[];
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">{label}</label>
      <div className="grid grid-cols-4 gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              value === opt
                ? "bg-purple-500 text-white shadow-lg shadow-purple-500/25"
                : "bg-gray-100 dark:bg-zinc-800 text-[var(--rowi-muted)] hover:bg-gray-200 dark:hover:bg-zinc-700"
            }`}
          >
            {opt} {unit}
          </button>
        ))}
      </div>
    </div>
  );
}

function OutcomeBar({
  label,
  currentPct,
  projectedPct,
  currentLabel,
  projectedLabel,
  delay,
}: {
  label: string;
  currentPct: number;
  projectedPct: number;
  currentLabel: string;
  projectedLabel: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="space-y-2"
    >
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-[var(--rowi-muted)]">
            {currentLabel}: {currentPct.toFixed(1)}%
          </span>
          <span className="text-purple-600 font-semibold">
            {projectedLabel}: {projectedPct.toFixed(1)}%
          </span>
        </div>
      </div>
      <div className="relative h-4 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          className="absolute h-full rounded-full bg-gray-400 dark:bg-zinc-600"
          initial={{ width: 0 }}
          whileInView={{ width: `${Math.min(currentPct, 100)}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut", delay }}
        />
        <motion.div
          className="absolute h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 opacity-80"
          initial={{ width: 0 }}
          whileInView={{ width: `${Math.min(projectedPct, 100)}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: "easeOut", delay: delay + 0.2 }}
        />
      </div>
    </motion.div>
  );
}

function ScenarioCard({
  title,
  multiplier,
  roi,
  payback,
  savings,
  labels,
  isHighlighted,
}: {
  title: string;
  multiplier: string;
  roi: number;
  payback: number;
  savings: number;
  labels: {
    scenarioROI: string;
    scenarioPayback: string;
    scenarioSavings: string;
    scenarioMultiplier: string;
    roiPaybackMonths: string;
  };
  isHighlighted: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`rounded-2xl p-6 border ${
        isHighlighted
          ? "bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800 shadow-lg"
          : "bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800"
      }`}
    >
      <div className="text-center mb-4">
        <h4 className="font-bold text-lg mb-1">{title}</h4>
        <span className="text-xs text-[var(--rowi-muted)]">
          {labels.scenarioMultiplier}: {multiplier}
        </span>
      </div>
      <div className="space-y-4">
        <div className="text-center">
          <div
            className={`text-4xl font-bold ${
              isHighlighted
                ? "bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
                : "text-purple-600"
            }`}
          >
            {roi.toFixed(0)}%
          </div>
          <div className="text-xs text-[var(--rowi-muted)]">{labels.scenarioROI}</div>
        </div>
        <div className="border-t border-gray-100 dark:border-zinc-800 pt-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--rowi-muted)]">{labels.scenarioPayback}</span>
            <span className="font-semibold">
              {payback} {labels.roiPaybackMonths}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--rowi-muted)]">{labels.scenarioSavings}</span>
            <span className="font-semibold text-green-600">
              ${(savings / 1000000).toFixed(1)}M
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function TimelinePhase({
  phase,
  title,
  description,
  months,
  color,
  delay,
  milestones,
}: {
  phase: number;
  title: string;
  description: string;
  months: string;
  color: string;
  delay: number;
  milestones: { label: string; position: string }[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="relative"
    >
      <div className="flex items-start gap-4">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
          style={{ backgroundColor: color }}
        >
          {phase}
        </div>
        <div className="flex-1">
          <h4 className="font-bold mb-1">{title}</h4>
          <p className="text-sm text-[var(--rowi-muted)] mb-2">{description}</p>
          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-zinc-800 text-[var(--rowi-muted)]">
            <Clock className="w-3 h-3" /> {months}
          </span>
          <div className="mt-3 flex flex-wrap gap-2">
            {milestones.map((m, i) => (
              <span
                key={i}
                className="text-[10px] px-2 py-0.5 rounded-full border border-gray-200 dark:border-zinc-700 text-[var(--rowi-muted)]"
              >
                {m.position}: {m.label}
              </span>
            ))}
          </div>
        </div>
      </div>
      {phase < 3 && <div className="ml-5 w-px h-8 bg-gray-200 dark:bg-zinc-800 my-2" />}
    </motion.div>
  );
}

/* =========================================================
   Main Page
========================================================= */
export default function TPROIPage() {
  const { lang, t } = useI18n();

  /* ---- API state ---- */
  const [correlations, setCorrelations] = useState<CorrelationItem[]>([]);
  const [tpStats, setTpStats] = useState<StatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ---- Slider state ---- */
  const [budget, setBudget] = useState(500000);
  const [duration, setDuration] = useState(12);
  const [population, setPopulation] = useState(2000);
  const [improvement, setImprovement] = useState(5);

  /* ---- Fetch data from APIs ---- */
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [corrRes, statsRes] = await Promise.all([
        fetch(`/api/admin/benchmarks/${TP_BENCHMARK_ID}/correlations`),
        fetch(`/api/admin/benchmarks/${TP_BENCHMARK_ID}/stats`),
      ]);

      const corrData = await corrRes.json();
      const statsData = await statsRes.json();

      if (corrData.ok) {
        setCorrelations(corrData.correlations);
      } else {
        console.error("Correlations API error:", corrData.error);
        setError(corrData.error || "Failed to load correlations");
      }

      if (statsData.ok) {
        setTpStats(statsData.statistics);
      } else {
        console.error("Stats API error:", statsData.error);
        setError((prev) => (prev ? `${prev}; ${statsData.error}` : statsData.error || "Failed to load stats"));
      }
    } catch (e) {
      console.error("Error fetching ROI data:", e);
      setError("Network error loading data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* ---- Derived data from API responses ---- */
  const correlationMatrix = useMemo(
    () => buildCorrelationMatrix(correlations),
    [correlations]
  );

  const tpCurrent = useMemo(() => extractTpCurrent(tpStats), [tpStats]);

  /* ---- Projections ---- */
  const proj = useMemo(
    () => calculateProjections(budget, duration, population, improvement, correlationMatrix, tpCurrent),
    [budget, duration, population, improvement, correlationMatrix, tpCurrent]
  );

  const currentOutcomes = tpCurrent.outcomeScores;

  const outcomeKeys = [
    { key: "effectiveness" as const, label: t("tpRoi.outcomeEffectiveness", "Efectividad") },
    { key: "relationships" as const, label: t("tpRoi.outcomeRelationships", "Relaciones") },
    { key: "wellbeing" as const, label: t("tpRoi.outcomeWellbeing", "Bienestar") },
    { key: "qualityOfLife" as const, label: t("tpRoi.outcomeQuality", "Calidad de Vida") },
  ];

  const scenarios = [
    { multiplier: 0.6, label: t("tpRoi.scenarioConservative", "Conservador"), multiplierLabel: "0.6x" },
    { multiplier: 1.0, label: t("tpRoi.scenarioModerate", "Moderado"), multiplierLabel: "1.0x" },
    { multiplier: 1.4, label: t("tpRoi.scenarioAggressive", "Agresivo"), multiplierLabel: "1.4x" },
  ];

  const scenarioData = scenarios.map((s) => {
    const adjSavings = proj.totalSavings * s.multiplier;
    const adjROI = ((adjSavings - budget) / budget) * 100;
    const adjPayback = Math.max(1, Math.ceil((budget / adjSavings) * 12));
    return { ...s, roi: adjROI, payback: adjPayback, savings: adjSavings };
  });

  const tpCostPerPoint = proj.costPerPoint;
  const tpROI = proj.roiPercentage;
  const tpTurnoverReduction = proj.turnoverReductionPct;
  const tpProductivityGain = proj.productivityGainPct;

  /* ---- Dynamic info desc with real assessment count ---- */
  const infoDesc = t(
    "tpRoi.infoDesc",
    "Las proyecciones se basan en la matriz de correlación SEI de Six Seconds y benchmarks de la industria. Los resultados reales pueden variar según factores organizacionales, culturales y de implementación."
  );
  const infoDescWithCount = tpCurrent.totalAssessments > 0
    ? `${infoDesc.replace(/\.$/, "")}. ${t("tpRoi.dataBasedOn", "Datos basados en")} ${tpCurrent.totalAssessments.toLocaleString()} ${t("tpRoi.assessments", "evaluaciones")}.`
    : infoDesc;

  /* ---- Loading state ---- */
  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <Link
            href="/hub/admin/tp"
            className="inline-flex items-center gap-2 text-sm text-[var(--rowi-muted)] hover:text-purple-500 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> {t("tpRoi.backToHub", "TP Hub")}
          </Link>
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-500 mb-3">
              <Calculator className="w-3 h-3" /> {t("tpRoi.badge", "ROI Calculator")}
            </span>
            <h1 className="text-3xl font-bold mb-2">{t("tpRoi.pageTitle", "Retorno de Inversión EQ")}</h1>
            <p className="text-[var(--rowi-muted)] max-w-3xl">{t("tpRoi.pageSubtitle", "Calcula el retorno proyectado de programas de desarrollo de inteligencia emocional basado en correlaciones, benchmarks de la industria y datos de TP")}</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
          <p className="text-[var(--rowi-muted)] text-sm">{t("tpRoi.loading", "Cargando datos de correlaciones y estadísticas...")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Section 1: Header */}
      <div>
        <Link
          href="/hub/admin/tp"
          className="inline-flex items-center gap-2 text-sm text-[var(--rowi-muted)] hover:text-purple-500 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> {t("tpRoi.backToHub", "TP Hub")}
        </Link>
        <div>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-500 mb-3">
            <Calculator className="w-3 h-3" /> {t("tpRoi.badge", "ROI Calculator")}
          </span>
          <h1 className="text-3xl font-bold mb-2">{t("tpRoi.pageTitle", "Retorno de Inversión EQ")}</h1>
          <p className="text-[var(--rowi-muted)] max-w-3xl">{t("tpRoi.pageSubtitle", "Calcula el retorno proyectado de programas de desarrollo de inteligencia emocional basado en correlaciones, benchmarks de la industria y datos de TP")}</p>
        </div>
      </div>

      {/* Error Banner (non-blocking) */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex items-start gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-amber-900 dark:text-amber-100 text-sm">
              {t("tpRoi.errorTitle", "Error al cargar datos")}
            </h3>
            <p className="text-xs text-amber-700 dark:text-amber-300">{t("tpRoi.errorDesc", "No se pudieron cargar las correlaciones o estadísticas. Usando valores de referencia.")}</p>
          </div>
          <button
            onClick={fetchData}
            className="px-3 py-1 text-xs font-medium rounded-lg bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 hover:bg-amber-300 dark:hover:bg-amber-700 transition-colors"
          >
            {t("tpRoi.retry", "Reintentar")}
          </button>
        </motion.div>
      )}

      {/* Section 2: Investment Configuration */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-zinc-900 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-zinc-800"
      >
        <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-500" /> {t("tpRoi.configTitle", "Configuración de Inversión")}
        </h2>
        <p className="text-sm text-[var(--rowi-muted)] mb-6">{t("tpRoi.configDesc", "Ajusta los parámetros para modelar el retorno de tu programa EQ")}</p>
        <div className="grid md:grid-cols-2 gap-8">
          <SliderInput
            label={t("tpRoi.labelBudget", "Presupuesto de Inversión")}
            value={budget}
            min={100000}
            max={5000000}
            step={50000}
            prefix="$"
            onChange={setBudget}
          />
          <DurationSelector
            label={t("tpRoi.labelDuration", "Duración del Programa")}
            value={duration}
            options={[6, 12, 18, 24]}
            unit={t("tpRoi.labelMonths", "meses")}
            onChange={setDuration}
          />
          <SliderInput
            label={t("tpRoi.labelPopulation", "Población Objetivo")}
            value={population}
            min={100}
            max={tpCurrent.totalAssessments > 0 ? tpCurrent.totalAssessments : 15000}
            step={100}
            unit={t("tpRoi.labelEmployees", "empleados")}
            onChange={setPopulation}
          />
          <SliderInput
            label={t("tpRoi.labelImprovement", "Mejora EQ Objetivo")}
            value={improvement}
            min={2}
            max={15}
            step={1}
            unit={t("tpRoi.labelPoints", "puntos")}
            onChange={setImprovement}
          />
        </div>
      </motion.div>

      {/* Section 3: BIG ROI Summary */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-10 shadow-xl border border-purple-200 dark:border-purple-800 text-center"
      >
        <h2 className="text-xl font-bold mb-6 flex items-center justify-center gap-2">
          <TrendingUp className="w-6 h-6 text-purple-500" /> {t("tpRoi.roiTitle", "ROI Proyectado")}
        </h2>
        <motion.div
          key={`${budget}-${population}-${improvement}-${duration}`}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="mb-4"
        >
          <span className="text-7xl md:text-8xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
            {proj.roiPercentage.toFixed(0)}%
          </span>
        </motion.div>
        <p className="text-[var(--rowi-muted)] mb-8 text-lg">
          {t("tpRoi.roiFor", "Por cada")} <strong>$1</strong> {t("tpRoi.roiInvested", "invertido, retorno proyectado de")}{" "}
          <strong className="text-purple-600">
            ${(proj.roiPercentage / 100 + 1).toFixed(2)}
          </strong>
        </p>
        <div className="grid sm:grid-cols-3 gap-6">
          <div className="bg-white/60 dark:bg-zinc-900/60 rounded-xl p-4 backdrop-blur">
            <div className="text-sm text-[var(--rowi-muted)] mb-1">{t("tpRoi.roiPayback", "Período de Recuperación")}</div>
            <div className="text-2xl font-bold text-purple-600">
              {proj.paybackMonths}{" "}
              <span className="text-base font-normal text-[var(--rowi-muted)]">
                {t("tpRoi.roiPaybackMonths", "meses")}
              </span>
            </div>
          </div>
          <div className="bg-white/60 dark:bg-zinc-900/60 rounded-xl p-4 backdrop-blur">
            <div className="text-sm text-[var(--rowi-muted)] mb-1">{t("tpRoi.roiNetBenefit", "Beneficio Neto")}</div>
            <div className="text-2xl font-bold text-green-600">
              ${((proj.totalSavings - budget) / 1000000).toFixed(2)}M
            </div>
          </div>
          <div className="bg-white/60 dark:bg-zinc-900/60 rounded-xl p-4 backdrop-blur">
            <div className="text-sm text-[var(--rowi-muted)] mb-1">{t("tpRoi.roiTotalSavings", "Ahorro Total Proyectado")}</div>
            <div className="text-2xl font-bold text-green-600">
              ${(proj.totalSavings / 1000000).toFixed(2)}M
            </div>
          </div>
        </div>
      </motion.div>

      {/* Section 4: Projected Outcomes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-white dark:bg-zinc-900 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-zinc-800"
      >
        <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-500" /> {t("tpRoi.outcomesTitle", "Resultados Proyectados")}
        </h2>
        <p className="text-sm text-[var(--rowi-muted)] mb-6">{t("tpRoi.outcomesDesc", "Mejoras estimadas basadas en la matriz de correlación SEI y la mejora EQ objetivo")}</p>
        <div className="flex items-center gap-6 mb-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-400 dark:bg-zinc-600" />
            <span className="text-[var(--rowi-muted)]">{t("tpRoi.outcomeCurrent", "Actual")}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
            <span className="text-[var(--rowi-muted)]">{t("tpRoi.outcomeProjected", "Proyectado")}</span>
          </div>
        </div>
        <div className="space-y-6">
          {outcomeKeys.map((outcome, i) => {
            const current =
              currentOutcomes[outcome.key as keyof typeof currentOutcomes];
            const gain = proj.outcomeGains[outcome.key] || 0;
            return (
              <OutcomeBar
                key={outcome.key}
                label={outcome.label}
                currentPct={current}
                projectedPct={current + gain}
                currentLabel={t("tpRoi.outcomeCurrent", "Actual")}
                projectedLabel={t("tpRoi.outcomeProjected", "Proyectado")}
                delay={i * 0.1}
              />
            );
          })}
        </div>
      </motion.div>

      {/* Sections 5-6: Cost Breakdown + Business Impact */}
      <div className="grid md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-zinc-800"
        >
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-purple-500" /> {t("tpRoi.costTitle", "Desglose de Costos")}
          </h3>
          <p className="text-sm text-[var(--rowi-muted)] mb-6">{t("tpRoi.costDesc", "Análisis de costo por empleado y por punto EQ vs benchmarks de la industria")}</p>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[var(--rowi-muted)]">{t("tpRoi.costPerEmployee", "Costo por Empleado")}</span>
                <span className="font-bold text-purple-600">
                  ${proj.costPerEmployee.toFixed(0)}
                </span>
              </div>
              <div className="h-3 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-purple-500"
                  initial={{ width: 0 }}
                  whileInView={{
                    width: `${Math.min((proj.costPerEmployee / 500) * 100, 100)}%`,
                  }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[var(--rowi-muted)]">{t("tpRoi.costPerPoint", "Costo por Punto EQ")}</span>
                <span className="font-bold text-purple-600">
                  ${proj.costPerPoint.toFixed(0)}
                </span>
              </div>
              <div className="h-3 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-pink-500"
                  initial={{ width: 0 }}
                  whileInView={{
                    width: `${Math.min((proj.costPerPoint / 300) * 100, 100)}%`,
                  }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.1 }}
                />
              </div>
            </div>
            <div className="pt-4 border-t border-gray-100 dark:border-zinc-800">
              <div className="flex justify-between items-center text-sm">
                <span className="text-[var(--rowi-muted)]">{t("tpRoi.costVsBenchmark", "vs Benchmark Industria")}</span>
                <span
                  className={`font-bold ${
                    proj.costPerPoint < proj.bpoBenchmarkCostPerPoint
                      ? "text-green-600"
                      : "text-red-500"
                  }`}
                >
                  {proj.costPerPoint < proj.bpoBenchmarkCostPerPoint ? "-" : "+"}
                  {Math.abs(
                    ((proj.costPerPoint - proj.bpoBenchmarkCostPerPoint) /
                      proj.bpoBenchmarkCostPerPoint) *
                      100
                  ).toFixed(0)}
                  %{" "}
                  {proj.costPerPoint < proj.bpoBenchmarkCostPerPoint
                    ? t("tpRoi.costBelow", "por debajo")
                    : t("tpRoi.costAbove", "por encima")}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-zinc-800"
        >
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-500" /> {t("tpRoi.impactTitle", "Impacto en el Negocio")}
          </h3>
          <p className="text-sm text-[var(--rowi-muted)] mb-6">{t("tpRoi.impactDesc", "Proyecciones financieras basadas en la mejora de EQ")}</p>
          <div className="space-y-5">
            <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-4">
              <div className="text-sm text-[var(--rowi-muted)] mb-1">
                {t("tpRoi.impactTurnover", "Reducción de Rotación")}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-purple-600">
                  {proj.projectedTurnoverRate.toFixed(1)}%
                </span>
                <span className="text-sm text-[var(--rowi-muted)]">
                  ({t("tpRoi.impactTurnoverFrom", "de")} {tpCurrent.turnoverRate}% {t("tpRoi.impactTurnoverTo", "a")}{" "}
                  {proj.projectedTurnoverRate.toFixed(1)}%)
                </span>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-4">
              <div className="text-sm text-[var(--rowi-muted)] mb-1">
                {t("tpRoi.impactSavings", "Ahorro por Rotación")}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-green-600">
                  ${(proj.turnoverSavings / 1000000).toFixed(2)}M
                </span>
                <span className="text-sm text-[var(--rowi-muted)]">
                  {t("tpRoi.impactPerYear", "por año")}
                </span>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-4">
              <div className="text-sm text-[var(--rowi-muted)] mb-1">
                {t("tpRoi.impactProductivity", "Ganancia de Productividad")}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-purple-600">
                  +{proj.productivityGainPct.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-4">
              <div className="text-sm text-[var(--rowi-muted)] mb-1">
                {t("tpRoi.impactRevenue", "Impacto en Ingresos")}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-green-600">
                  ${(proj.revenueImpact / 1000000).toFixed(2)}M
                </span>
                <span className="text-sm text-[var(--rowi-muted)]">
                  {t("tpRoi.impactPerYear", "por año")}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Section 7: Scenario Comparison */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-purple-500" /> {t("tpRoi.scenarioTitle", "Comparación de Escenarios")}
          </h2>
          <p className="text-[var(--rowi-muted)]">{t("tpRoi.scenarioDesc", "Tres escenarios basados en distintos niveles de efectividad del programa")}</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          {scenarioData.map((scenario, i) => (
            <ScenarioCard
              key={scenario.label}
              title={scenario.label}
              multiplier={scenario.multiplierLabel}
              roi={scenario.roi}
              payback={scenario.payback}
              savings={scenario.savings}
              labels={{
                scenarioROI: t("tpRoi.scenarioROI", "ROI"),
                scenarioPayback: t("tpRoi.scenarioPayback", "Recuperación"),
                scenarioSavings: t("tpRoi.scenarioSavings", "Ahorro Total"),
                scenarioMultiplier: t("tpRoi.scenarioMultiplier", "Multiplicador"),
                roiPaybackMonths: t("tpRoi.roiPaybackMonths", "meses"),
              }}
              isHighlighted={i === 1}
            />
          ))}
        </div>
      </div>

      {/* Section 8: Industry Comparison */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-white dark:bg-zinc-900 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-zinc-800 overflow-x-auto"
      >
        <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-purple-500" /> {t("tpRoi.industryTitle", "Comparación por Industria")}
        </h2>
        <p className="text-sm text-[var(--rowi-muted)] mb-6">{t("tpRoi.industryDesc", "Métricas proyectadas de TP vs benchmarks de otras industrias")}</p>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-zinc-800">
              <th className="text-left py-3 px-2 font-semibold text-[var(--rowi-muted)]">
                {t("tpRoi.industryName", "Industria")}
              </th>
              <th className="text-right py-3 px-2 font-semibold text-[var(--rowi-muted)]">
                {t("tpRoi.industryCostPerPt", "Costo/Punto")}
              </th>
              <th className="text-right py-3 px-2 font-semibold text-[var(--rowi-muted)]">
                {t("tpRoi.industryAvgROI", "ROI Prom.")}
              </th>
              <th className="text-right py-3 px-2 font-semibold text-[var(--rowi-muted)]">
                {t("tpRoi.industryTimeline", "Tiempo")}
              </th>
              <th className="text-right py-3 px-2 font-semibold text-[var(--rowi-muted)]">
                {t("tpRoi.industryTurnover", "Red. Rotación")}
              </th>
              <th className="text-right py-3 px-2 font-semibold text-[var(--rowi-muted)]">
                {t("tpRoi.industryProductivity", "Productividad")}
              </th>
              <th className="text-right py-3 px-2 font-semibold text-[var(--rowi-muted)]">
                {t("tpRoi.industrySatisfaction", "Satisfacción")}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-purple-50 dark:bg-purple-900/20 font-semibold">
              <td className="py-3 px-2 rounded-l-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  {t("tpRoi.industryTPProjected", "TP (Proyectado)")}
                </div>
              </td>
              <td className="text-right py-3 px-2 text-purple-600">
                ${tpCostPerPoint.toFixed(0)}
              </td>
              <td className="text-right py-3 px-2 text-purple-600">
                {tpROI.toFixed(0)}%
              </td>
              <td className="text-right py-3 px-2">
                {duration} {t("tpRoi.labelMonths", "meses")}
              </td>
              <td className="text-right py-3 px-2">
                {tpTurnoverReduction.toFixed(1)}%
              </td>
              <td className="text-right py-3 px-2">
                {tpProductivityGain.toFixed(1)}%
              </td>
              <td className="text-right py-3 px-2 rounded-r-lg">--</td>
            </tr>
            {INDUSTRY_BENCHMARKS.map((ind) => (
              <tr
                key={ind.id}
                className="border-b border-gray-50 dark:border-zinc-800/50 hover:bg-gray-50 dark:hover:bg-zinc-800/30 transition-colors"
              >
                <td className="py-3 px-2">
                  {ind.name[lang as keyof typeof ind.name] || ind.name.es}
                </td>
                <td className="text-right py-3 px-2">${ind.avgCostPerPoint}</td>
                <td className="text-right py-3 px-2">{ind.avgROI}%</td>
                <td className="text-right py-3 px-2">
                  {ind.avgTimeMonths} {t("tpRoi.labelMonths", "meses")}
                </td>
                <td className="text-right py-3 px-2">{ind.turnoverReduction}%</td>
                <td className="text-right py-3 px-2">{ind.productivityGain}%</td>
                <td className="text-right py-3 px-2">{ind.satisfactionGain}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {/* Section 9: Timeline to ROI */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-white dark:bg-zinc-900 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-zinc-800"
      >
        <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
          <Clock className="w-5 h-5 text-purple-500" /> {t("tpRoi.timelineTitle", "Cronología del ROI")}
        </h2>
        <p className="text-sm text-[var(--rowi-muted)] mb-8">{t("tpRoi.timelineDesc", "Fases y milestones esperados del programa de desarrollo EQ")}</p>
        <div className="relative mb-10">
          <div className="h-2 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-green-500"
              initial={{ width: 0 }}
              whileInView={{ width: "100%" }}
              viewport={{ once: true }}
              transition={{ duration: 2, ease: "easeOut" }}
            />
          </div>
          <div className="flex justify-between mt-3">
            {[
              { month: 1, label: t("tpRoi.timelineMilestone1", "Kickoff del programa") },
              { month: Math.ceil(duration * 0.25), label: t("tpRoi.timelineMilestone2", "Primera medición") },
              { month: Math.ceil(duration * 0.6), label: t("tpRoi.timelineMilestone3", "Punto de equilibrio") },
              { month: duration, label: t("tpRoi.timelineMilestone4", "ROI completo") },
            ].map((milestone, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 + i * 0.2 }}
                className="text-center"
              >
                <div className="w-3 h-3 rounded-full bg-purple-500 mx-auto mb-1 -mt-[22px]" />
                <div className="text-[10px] font-semibold">M{milestone.month}</div>
                <div className="text-[10px] text-[var(--rowi-muted)] max-w-[80px]">
                  {milestone.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <TimelinePhase
            phase={1}
            title={t("tpRoi.timelinePhase1", "Fase 1: Formación")}
            description={t("tpRoi.timelinePhase1Desc", "Evaluaciones SEI, selección de cohortes, diseño de programa")}
            months={`M1 - M${Math.ceil(duration * 0.25)}`}
            color="#7B2D8E"
            delay={0}
            milestones={[
              { label: t("tpRoi.timelineMilestone1", "Kickoff del programa"), position: "M1" },
              {
                label: t("tpRoi.timelineMilestone2", "Primera medición"),
                position: `M${Math.ceil(duration * 0.25)}`,
              },
            ]}
          />
          <TimelinePhase
            phase={2}
            title={t("tpRoi.timelinePhase2", "Fase 2: Resultados Tempranos")}
            description={t("tpRoi.timelinePhase2Desc", "Primeras mejoras medibles en competencias EQ")}
            months={`M${Math.ceil(duration * 0.25) + 1} - M${Math.ceil(duration * 0.5)}`}
            color="#E31937"
            delay={0.1}
            milestones={[
              {
                label: t("tpRoi.timelineMilestone3", "Punto de equilibrio"),
                position: `M${Math.ceil(duration * 0.6)}`,
              },
            ]}
          />
          <TimelinePhase
            phase={3}
            title={t("tpRoi.timelinePhase3", "Fase 3: Impacto Completo")}
            description={t("tpRoi.timelinePhase3Desc", "Beneficios financieros realizados, ROI medible")}
            months={`M${Math.ceil(duration * 0.5) + 1} - M${duration}`}
            color="#10b981"
            delay={0.2}
            milestones={[
              { label: t("tpRoi.timelineMilestone4", "ROI completo"), position: `M${duration}` },
            ]}
          />
        </div>
      </motion.div>

      {/* Section 10: Info Box */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl p-6 flex gap-4"
      >
        <Shield className="w-6 h-6 text-purple-500 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-1">
            {t("tpRoi.infoTitle", "Modelo de Proyección")}
          </h3>
          <p className="text-sm text-purple-700 dark:text-purple-300">
            {infoDescWithCount}
          </p>
        </div>
      </motion.div>

      {/* Navigation Footer */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between pt-6 border-t border-gray-200 dark:border-zinc-800">
        <Link
          href="/hub/admin/tp/dashboard"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border-2 border-gray-200 dark:border-zinc-700 hover:border-purple-500 transition-colors font-medium"
        >
          <ArrowLeft className="w-5 h-5" /> {t("tpRoi.navPrev", "Dashboard")}
        </Link>
        <Link
          href="/hub/admin/tp/benchmark"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:opacity-90 transition-opacity"
        >
          {t("tpRoi.navNext", "Benchmark")} <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
