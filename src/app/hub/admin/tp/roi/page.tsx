"use client";

import { useState } from "react";
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
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

/* =========================================================
   Translations
========================================================= */
const translations = {
  es: {
    backToHub: "TP Hub",
    badge: "ROI Calculator",
    pageTitle: "Retorno de Inversi\u00f3n EQ",
    pageSubtitle:
      "Calcula el retorno proyectado de programas de desarrollo de inteligencia emocional basado en correlaciones, benchmarks de la industria y datos de TP",
    configTitle: "Configuraci\u00f3n de Inversi\u00f3n",
    configDesc: "Ajusta los par\u00e1metros para modelar el retorno de tu programa EQ",
    labelBudget: "Presupuesto de Inversi\u00f3n",
    labelDuration: "Duraci\u00f3n del Programa",
    labelMonths: "meses",
    labelPopulation: "Poblaci\u00f3n Objetivo",
    labelEmployees: "empleados",
    labelImprovement: "Mejora EQ Objetivo",
    labelPoints: "puntos",
    roiTitle: "ROI Proyectado",
    roiFor: "Por cada",
    roiInvested: "invertido, retorno proyectado de",
    roiPayback: "Per\u00edodo de Recuperaci\u00f3n",
    roiPaybackMonths: "meses",
    roiNetBenefit: "Beneficio Neto",
    roiTotalSavings: "Ahorro Total Proyectado",
    outcomesTitle: "Resultados Proyectados",
    outcomesDesc: "Mejoras estimadas basadas en la matriz de correlaci\u00f3n SEI y la mejora EQ objetivo",
    outcomeEffectiveness: "Efectividad",
    outcomeRelationships: "Relaciones",
    outcomeWellbeing: "Bienestar",
    outcomeQuality: "Calidad de Vida",
    outcomeCurrent: "Actual",
    outcomeProjected: "Proyectado",
    costTitle: "Desglose de Costos",
    costDesc: "An\u00e1lisis de costo por empleado y por punto EQ vs benchmarks de la industria",
    costPerEmployee: "Costo por Empleado",
    costPerPoint: "Costo por Punto EQ",
    costVsBenchmark: "vs Benchmark Industria",
    costBelow: "por debajo",
    costAbove: "por encima",
    impactTitle: "Impacto en el Negocio",
    impactDesc: "Proyecciones financieras basadas en la mejora de EQ",
    impactTurnover: "Reducci\u00f3n de Rotaci\u00f3n",
    impactTurnoverFrom: "de",
    impactTurnoverTo: "a",
    impactSavings: "Ahorro por Rotaci\u00f3n",
    impactProductivity: "Ganancia de Productividad",
    impactRevenue: "Impacto en Ingresos",
    impactPerYear: "por a\u00f1o",
    scenarioTitle: "Comparaci\u00f3n de Escenarios",
    scenarioDesc: "Tres escenarios basados en distintos niveles de efectividad del programa",
    scenarioConservative: "Conservador",
    scenarioModerate: "Moderado",
    scenarioAggressive: "Agresivo",
    scenarioROI: "ROI",
    scenarioPayback: "Recuperaci\u00f3n",
    scenarioSavings: "Ahorro Total",
    scenarioMultiplier: "Multiplicador",
    industryTitle: "Comparaci\u00f3n por Industria",
    industryDesc: "M\u00e9tricas proyectadas de TP vs benchmarks de otras industrias",
    industryName: "Industria",
    industryCostPerPt: "Costo/Punto",
    industryAvgROI: "ROI Prom.",
    industryTimeline: "Tiempo",
    industryTurnover: "Red. Rotaci\u00f3n",
    industryProductivity: "Productividad",
    industrySatisfaction: "Satisfacci\u00f3n",
    industryTPProjected: "TP (Proyectado)",
    timelineTitle: "Cronolog\u00eda del ROI",
    timelineDesc: "Fases y milestones esperados del programa de desarrollo EQ",
    timelinePhase1: "Fase 1: Formaci\u00f3n",
    timelinePhase1Desc: "Evaluaciones SEI, selecci\u00f3n de cohortes, dise\u00f1o de programa",
    timelinePhase2: "Fase 2: Resultados Tempranos",
    timelinePhase2Desc: "Primeras mejoras medibles en competencias EQ",
    timelinePhase3: "Fase 3: Impacto Completo",
    timelinePhase3Desc: "Beneficios financieros realizados, ROI medible",
    timelineMilestone1: "Kickoff del programa",
    timelineMilestone2: "Primera medici\u00f3n",
    timelineMilestone3: "Punto de equilibrio",
    timelineMilestone4: "ROI completo",
    infoTitle: "Modelo de Proyecci\u00f3n",
    infoDesc: "Las proyecciones se basan en la matriz de correlaci\u00f3n SEI de Six Seconds y benchmarks de la industria. Los resultados reales pueden variar seg\u00fan factores organizacionales, culturales y de implementaci\u00f3n. Datos basados en 14,886 evaluaciones de TP.",
    navPrev: "Dashboard",
    navNext: "Benchmark",
  },
  en: {
    backToHub: "TP Hub",
    badge: "ROI Calculator",
    pageTitle: "EQ Investment ROI",
    pageSubtitle: "Calculate projected return on EQ development programs based on correlations, industry benchmarks, and TP data",
    configTitle: "Investment Configuration",
    configDesc: "Adjust parameters to model your EQ program return",
    labelBudget: "Investment Budget",
    labelDuration: "Program Duration",
    labelMonths: "months",
    labelPopulation: "Target Population",
    labelEmployees: "employees",
    labelImprovement: "Target EQ Improvement",
    labelPoints: "points",
    roiTitle: "Projected ROI",
    roiFor: "For every",
    roiInvested: "invested, projected return of",
    roiPayback: "Payback Period",
    roiPaybackMonths: "months",
    roiNetBenefit: "Net Benefit",
    roiTotalSavings: "Total Projected Savings",
    outcomesTitle: "Projected Outcomes",
    outcomesDesc: "Estimated improvements based on the SEI correlation matrix and target EQ improvement",
    outcomeEffectiveness: "Effectiveness",
    outcomeRelationships: "Relationships",
    outcomeWellbeing: "Wellbeing",
    outcomeQuality: "Quality of Life",
    outcomeCurrent: "Current",
    outcomeProjected: "Projected",
    costTitle: "Cost Breakdown",
    costDesc: "Cost per employee and per EQ point analysis vs industry benchmarks",
    costPerEmployee: "Cost per Employee",
    costPerPoint: "Cost per EQ Point",
    costVsBenchmark: "vs Industry Benchmark",
    costBelow: "below",
    costAbove: "above",
    impactTitle: "Business Impact",
    impactDesc: "Financial projections based on EQ improvement",
    impactTurnover: "Turnover Reduction",
    impactTurnoverFrom: "from",
    impactTurnoverTo: "to",
    impactSavings: "Turnover Savings",
    impactProductivity: "Productivity Gain",
    impactRevenue: "Revenue Impact",
    impactPerYear: "per year",
    scenarioTitle: "Scenario Comparison",
    scenarioDesc: "Three scenarios based on different program effectiveness levels",
    scenarioConservative: "Conservative",
    scenarioModerate: "Moderate",
    scenarioAggressive: "Aggressive",
    scenarioROI: "ROI",
    scenarioPayback: "Payback",
    scenarioSavings: "Total Savings",
    scenarioMultiplier: "Multiplier",
    industryTitle: "Industry Comparison",
    industryDesc: "TP projected metrics vs benchmarks from other industries",
    industryName: "Industry",
    industryCostPerPt: "Cost/Point",
    industryAvgROI: "Avg ROI",
    industryTimeline: "Timeline",
    industryTurnover: "Turnover Red.",
    industryProductivity: "Productivity",
    industrySatisfaction: "Satisfaction",
    industryTPProjected: "TP (Projected)",
    timelineTitle: "ROI Timeline",
    timelineDesc: "Expected phases and milestones for the EQ development program",
    timelinePhase1: "Phase 1: Training",
    timelinePhase1Desc: "SEI assessments, cohort selection, program design",
    timelinePhase2: "Phase 2: Early Results",
    timelinePhase2Desc: "First measurable improvements in EQ competencies",
    timelinePhase3: "Phase 3: Full Impact",
    timelinePhase3Desc: "Financial benefits realized, measurable ROI",
    timelineMilestone1: "Program kickoff",
    timelineMilestone2: "First measurement",
    timelineMilestone3: "Break-even point",
    timelineMilestone4: "Full ROI",
    infoTitle: "Projection Model",
    infoDesc: "Projections are based on the Six Seconds SEI correlation matrix and industry benchmarks. Actual results may vary based on organizational, cultural, and implementation factors. Data based on 14,886 TP assessments.",
    navPrev: "Dashboard",
    navNext: "Benchmark",
  },
};

/* =========================================================
   Mock Data
========================================================= */
const CORRELATION_MATRIX: Record<string, Record<string, number>> = {
  EL: { effectiveness: 0.62, relationships: 0.58, wellbeing: 0.54, qualityOfLife: 0.51 },
  RP: { effectiveness: 0.68, relationships: 0.52, wellbeing: 0.48, qualityOfLife: 0.55 },
  ACT: { effectiveness: 0.74, relationships: 0.46, wellbeing: 0.42, qualityOfLife: 0.58 },
  NE: { effectiveness: 0.56, relationships: 0.72, wellbeing: 0.68, qualityOfLife: 0.62 },
  IM: { effectiveness: 0.71, relationships: 0.54, wellbeing: 0.58, qualityOfLife: 0.64 },
  OP: { effectiveness: 0.64, relationships: 0.58, wellbeing: 0.72, qualityOfLife: 0.68 },
  EMP: { effectiveness: 0.58, relationships: 0.82, wellbeing: 0.64, qualityOfLife: 0.61 },
  NG: { effectiveness: 0.66, relationships: 0.62, wellbeing: 0.56, qualityOfLife: 0.72 },
};

const INDUSTRY_BENCHMARKS = [
  { id: "bpo", name: { es: "BPO / Contact Center", en: "BPO / Contact Center" }, avgCostPerPoint: 185, avgROI: 340, avgTimeMonths: 8, turnoverReduction: 22, productivityGain: 18, satisfactionGain: 24 },
  { id: "tech", name: { es: "Tecnolog\u00eda", en: "Technology" }, avgCostPerPoint: 220, avgROI: 410, avgTimeMonths: 10, turnoverReduction: 18, productivityGain: 22, satisfactionGain: 20 },
  { id: "healthcare", name: { es: "Salud", en: "Healthcare" }, avgCostPerPoint: 195, avgROI: 380, avgTimeMonths: 9, turnoverReduction: 25, productivityGain: 15, satisfactionGain: 28 },
  { id: "finance", name: { es: "Finanzas", en: "Finance" }, avgCostPerPoint: 250, avgROI: 450, avgTimeMonths: 12, turnoverReduction: 16, productivityGain: 20, satisfactionGain: 18 },
  { id: "retail", name: { es: "Retail", en: "Retail" }, avgCostPerPoint: 160, avgROI: 290, avgTimeMonths: 7, turnoverReduction: 28, productivityGain: 16, satisfactionGain: 26 },
];

const TP_CURRENT = {
  avgEQ: 98.7,
  employees: 14886,
  avgSalary: 42000,
  turnoverRate: 34,
  costPerHire: 4200,
  avgProductivity: 78,
};

/* =========================================================
   Helper: Calculate Projections
========================================================= */
function calculateProjections(budget: number, duration: number, population: number, improvement: number) {
  const outcomes = ["effectiveness", "relationships", "wellbeing", "qualityOfLife"] as const;
  const competencies = Object.keys(CORRELATION_MATRIX);

  const avgCorrelations: Record<string, number> = {};
  outcomes.forEach((outcome) => {
    const total = competencies.reduce((sum, comp) => sum + CORRELATION_MATRIX[comp][outcome], 0);
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
  const projectedTurnoverRate = Math.max(TP_CURRENT.turnoverRate - turnoverReductionPct, 8);
  const turnoverSavings = (turnoverReductionPct / 100) * population * TP_CURRENT.costPerHire;

  const productivityGainPct = outcomeGains["effectiveness"];
  const revenueImpact = (productivityGainPct / 100) * population * TP_CURRENT.avgSalary * 0.3;

  const totalSavings = turnoverSavings + revenueImpact;
  const roiPercentage = ((totalSavings - budget) / budget) * 100;
  const paybackMonths = Math.max(1, Math.ceil((budget / totalSavings) * 12));

  return { outcomeGains, costPerEmployee, costPerPoint, bpoBenchmarkCostPerPoint, turnoverReductionPct, projectedTurnoverRate, turnoverSavings, productivityGainPct, revenueImpact, totalSavings, roiPercentage, paybackMonths };
}

/* =========================================================
   Components
========================================================= */
function SliderInput({ label, value, min, max, step, unit, prefix, onChange }: { label: string; value: number; min: number; max: number; step: number; unit?: string; prefix?: string; onChange: (v: number) => void }) {
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
        <span className="text-sm font-bold text-purple-600">{formatValue(value)}{unit ? ` ${unit}` : ""}</span>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={() => onChange(Math.max(min, value - step))} className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors">
          <Minus className="w-3 h-3" />
        </button>
        <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="flex-1 h-2 bg-gray-200 dark:bg-zinc-700 rounded-full appearance-none cursor-pointer accent-purple-500" />
        <button onClick={() => onChange(Math.min(max, value + step))} className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors">
          <Plus className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

function DurationSelector({ label, value, options, unit, onChange }: { label: string; value: number; options: number[]; unit: string; onChange: (v: number) => void }) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">{label}</label>
      <div className="grid grid-cols-4 gap-2">
        {options.map((opt) => (
          <button key={opt} onClick={() => onChange(opt)} className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${value === opt ? "bg-purple-500 text-white shadow-lg shadow-purple-500/25" : "bg-gray-100 dark:bg-zinc-800 text-[var(--rowi-muted)] hover:bg-gray-200 dark:hover:bg-zinc-700"}`}>
            {opt} {unit}
          </button>
        ))}
      </div>
    </div>
  );
}

function OutcomeBar({ label, currentPct, projectedPct, currentLabel, projectedLabel, delay }: { label: string; currentPct: number; projectedPct: number; currentLabel: string; projectedLabel: string; delay: number }) {
  return (
    <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay }} className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-[var(--rowi-muted)]">{currentLabel}: {currentPct.toFixed(1)}%</span>
          <span className="text-purple-600 font-semibold">{projectedLabel}: {projectedPct.toFixed(1)}%</span>
        </div>
      </div>
      <div className="relative h-4 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
        <motion.div className="absolute h-full rounded-full bg-gray-400 dark:bg-zinc-600" initial={{ width: 0 }} whileInView={{ width: `${Math.min(currentPct, 100)}%` }} viewport={{ once: true }} transition={{ duration: 0.8, ease: "easeOut", delay }} />
        <motion.div className="absolute h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 opacity-80" initial={{ width: 0 }} whileInView={{ width: `${Math.min(projectedPct, 100)}%` }} viewport={{ once: true }} transition={{ duration: 1.2, ease: "easeOut", delay: delay + 0.2 }} />
      </div>
    </motion.div>
  );
}

function ScenarioCard({ title, multiplier, roi, payback, savings, labels, isHighlighted }: { title: string; multiplier: string; roi: number; payback: number; savings: number; labels: { scenarioROI: string; scenarioPayback: string; scenarioSavings: string; scenarioMultiplier: string; roiPaybackMonths: string }; isHighlighted: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className={`rounded-2xl p-6 border ${isHighlighted ? "bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800 shadow-lg" : "bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800"}`}>
      <div className="text-center mb-4">
        <h4 className="font-bold text-lg mb-1">{title}</h4>
        <span className="text-xs text-[var(--rowi-muted)]">{labels.scenarioMultiplier}: {multiplier}</span>
      </div>
      <div className="space-y-4">
        <div className="text-center">
          <div className={`text-4xl font-bold ${isHighlighted ? "bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent" : "text-purple-600"}`}>{roi.toFixed(0)}%</div>
          <div className="text-xs text-[var(--rowi-muted)]">{labels.scenarioROI}</div>
        </div>
        <div className="border-t border-gray-100 dark:border-zinc-800 pt-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--rowi-muted)]">{labels.scenarioPayback}</span>
            <span className="font-semibold">{payback} {labels.roiPaybackMonths}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--rowi-muted)]">{labels.scenarioSavings}</span>
            <span className="font-semibold text-green-600">${(savings / 1000000).toFixed(1)}M</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function TimelinePhase({ phase, title, description, months, color, delay, milestones }: { phase: number; title: string; description: string; months: string; color: string; delay: number; milestones: { label: string; position: string }[] }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay }} className="relative">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ backgroundColor: color }}>{phase}</div>
        <div className="flex-1">
          <h4 className="font-bold mb-1">{title}</h4>
          <p className="text-sm text-[var(--rowi-muted)] mb-2">{description}</p>
          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-zinc-800 text-[var(--rowi-muted)]">
            <Clock className="w-3 h-3" /> {months}
          </span>
          <div className="mt-3 flex flex-wrap gap-2">
            {milestones.map((m, i) => (
              <span key={i} className="text-[10px] px-2 py-0.5 rounded-full border border-gray-200 dark:border-zinc-700 text-[var(--rowi-muted)]">{m.position}: {m.label}</span>
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
  const { lang } = useI18n();
  const t = translations[lang as keyof typeof translations] || translations.es;

  const [budget, setBudget] = useState(500000);
  const [duration, setDuration] = useState(12);
  const [population, setPopulation] = useState(2000);
  const [improvement, setImprovement] = useState(5);

  const proj = calculateProjections(budget, duration, population, improvement);

  const currentOutcomes = {
    effectiveness: TP_CURRENT.avgProductivity,
    relationships: TP_CURRENT.avgProductivity - 2,
    wellbeing: TP_CURRENT.avgProductivity - 5,
    qualityOfLife: TP_CURRENT.avgProductivity - 3,
  };

  const outcomeKeys = [
    { key: "effectiveness" as const, tKey: "outcomeEffectiveness" as const },
    { key: "relationships" as const, tKey: "outcomeRelationships" as const },
    { key: "wellbeing" as const, tKey: "outcomeWellbeing" as const },
    { key: "qualityOfLife" as const, tKey: "outcomeQuality" as const },
  ];

  const scenarios = [
    { multiplier: 0.6, label: t.scenarioConservative, multiplierLabel: "0.6x" },
    { multiplier: 1.0, label: t.scenarioModerate, multiplierLabel: "1.0x" },
    { multiplier: 1.4, label: t.scenarioAggressive, multiplierLabel: "1.4x" },
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

  return (
    <div className="space-y-8">
      {/* Section 1: Header */}
      <div>
        <Link href="/hub/admin/tp" className="inline-flex items-center gap-2 text-sm text-[var(--rowi-muted)] hover:text-purple-500 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> {t.backToHub}
        </Link>
        <div>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-500 mb-3">
            <Calculator className="w-3 h-3" /> {t.badge}
          </span>
          <h1 className="text-3xl font-bold mb-2">{t.pageTitle}</h1>
          <p className="text-[var(--rowi-muted)] max-w-3xl">{t.pageSubtitle}</p>
        </div>
      </div>

      {/* Section 2: Investment Configuration */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-zinc-900 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-zinc-800">
        <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-500" /> {t.configTitle}
        </h2>
        <p className="text-sm text-[var(--rowi-muted)] mb-6">{t.configDesc}</p>
        <div className="grid md:grid-cols-2 gap-8">
          <SliderInput label={t.labelBudget} value={budget} min={100000} max={5000000} step={50000} prefix="$" onChange={setBudget} />
          <DurationSelector label={t.labelDuration} value={duration} options={[6, 12, 18, 24]} unit={t.labelMonths} onChange={setDuration} />
          <SliderInput label={t.labelPopulation} value={population} min={100} max={TP_CURRENT.employees} step={100} unit={t.labelEmployees} onChange={setPopulation} />
          <SliderInput label={t.labelImprovement} value={improvement} min={2} max={15} step={1} unit={t.labelPoints} onChange={setImprovement} />
        </div>
      </motion.div>

      {/* Section 3: BIG ROI Summary */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-10 shadow-xl border border-purple-200 dark:border-purple-800 text-center">
        <h2 className="text-xl font-bold mb-6 flex items-center justify-center gap-2">
          <TrendingUp className="w-6 h-6 text-purple-500" /> {t.roiTitle}
        </h2>
        <motion.div key={`${budget}-${population}-${improvement}-${duration}`} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5, type: "spring" }} className="mb-4">
          <span className="text-7xl md:text-8xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
            {proj.roiPercentage.toFixed(0)}%
          </span>
        </motion.div>
        <p className="text-[var(--rowi-muted)] mb-8 text-lg">
          {t.roiFor} <strong>$1</strong> {t.roiInvested}{" "}
          <strong className="text-purple-600">${(proj.roiPercentage / 100 + 1).toFixed(2)}</strong>
        </p>
        <div className="grid sm:grid-cols-3 gap-6">
          <div className="bg-white/60 dark:bg-zinc-900/60 rounded-xl p-4 backdrop-blur">
            <div className="text-sm text-[var(--rowi-muted)] mb-1">{t.roiPayback}</div>
            <div className="text-2xl font-bold text-purple-600">{proj.paybackMonths} <span className="text-base font-normal text-[var(--rowi-muted)]">{t.roiPaybackMonths}</span></div>
          </div>
          <div className="bg-white/60 dark:bg-zinc-900/60 rounded-xl p-4 backdrop-blur">
            <div className="text-sm text-[var(--rowi-muted)] mb-1">{t.roiNetBenefit}</div>
            <div className="text-2xl font-bold text-green-600">${((proj.totalSavings - budget) / 1000000).toFixed(2)}M</div>
          </div>
          <div className="bg-white/60 dark:bg-zinc-900/60 rounded-xl p-4 backdrop-blur">
            <div className="text-sm text-[var(--rowi-muted)] mb-1">{t.roiTotalSavings}</div>
            <div className="text-2xl font-bold text-green-600">${(proj.totalSavings / 1000000).toFixed(2)}M</div>
          </div>
        </div>
      </motion.div>

      {/* Section 4: Projected Outcomes */}
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-white dark:bg-zinc-900 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-zinc-800">
        <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-500" /> {t.outcomesTitle}
        </h2>
        <p className="text-sm text-[var(--rowi-muted)] mb-6">{t.outcomesDesc}</p>
        <div className="flex items-center gap-6 mb-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-400 dark:bg-zinc-600" />
            <span className="text-[var(--rowi-muted)]">{t.outcomeCurrent}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
            <span className="text-[var(--rowi-muted)]">{t.outcomeProjected}</span>
          </div>
        </div>
        <div className="space-y-6">
          {outcomeKeys.map((outcome, i) => {
            const current = currentOutcomes[outcome.key as keyof typeof currentOutcomes];
            const gain = proj.outcomeGains[outcome.key] || 0;
            return <OutcomeBar key={outcome.key} label={t[outcome.tKey]} currentPct={current} projectedPct={current + gain} currentLabel={t.outcomeCurrent} projectedLabel={t.outcomeProjected} delay={i * 0.1} />;
          })}
        </div>
      </motion.div>

      {/* Sections 5-6: Cost Breakdown + Business Impact */}
      <div className="grid md:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-zinc-800">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-purple-500" /> {t.costTitle}
          </h3>
          <p className="text-sm text-[var(--rowi-muted)] mb-6">{t.costDesc}</p>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[var(--rowi-muted)]">{t.costPerEmployee}</span>
                <span className="font-bold text-purple-600">${proj.costPerEmployee.toFixed(0)}</span>
              </div>
              <div className="h-3 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                <motion.div className="h-full rounded-full bg-purple-500" initial={{ width: 0 }} whileInView={{ width: `${Math.min((proj.costPerEmployee / 500) * 100, 100)}%` }} viewport={{ once: true }} transition={{ duration: 0.8 }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[var(--rowi-muted)]">{t.costPerPoint}</span>
                <span className="font-bold text-purple-600">${proj.costPerPoint.toFixed(0)}</span>
              </div>
              <div className="h-3 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                <motion.div className="h-full rounded-full bg-pink-500" initial={{ width: 0 }} whileInView={{ width: `${Math.min((proj.costPerPoint / 300) * 100, 100)}%` }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.1 }} />
              </div>
            </div>
            <div className="pt-4 border-t border-gray-100 dark:border-zinc-800">
              <div className="flex justify-between items-center text-sm">
                <span className="text-[var(--rowi-muted)]">{t.costVsBenchmark}</span>
                <span className={`font-bold ${proj.costPerPoint < proj.bpoBenchmarkCostPerPoint ? "text-green-600" : "text-red-500"}`}>
                  {proj.costPerPoint < proj.bpoBenchmarkCostPerPoint ? "-" : "+"}
                  {Math.abs(((proj.costPerPoint - proj.bpoBenchmarkCostPerPoint) / proj.bpoBenchmarkCostPerPoint) * 100).toFixed(0)}%{" "}
                  {proj.costPerPoint < proj.bpoBenchmarkCostPerPoint ? t.costBelow : t.costAbove}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-zinc-800">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-500" /> {t.impactTitle}
          </h3>
          <p className="text-sm text-[var(--rowi-muted)] mb-6">{t.impactDesc}</p>
          <div className="space-y-5">
            <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-4">
              <div className="text-sm text-[var(--rowi-muted)] mb-1">{t.impactTurnover}</div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-purple-600">{proj.projectedTurnoverRate.toFixed(1)}%</span>
                <span className="text-sm text-[var(--rowi-muted)]">({t.impactTurnoverFrom} {TP_CURRENT.turnoverRate}% {t.impactTurnoverTo} {proj.projectedTurnoverRate.toFixed(1)}%)</span>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-4">
              <div className="text-sm text-[var(--rowi-muted)] mb-1">{t.impactSavings}</div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-green-600">${(proj.turnoverSavings / 1000000).toFixed(2)}M</span>
                <span className="text-sm text-[var(--rowi-muted)]">{t.impactPerYear}</span>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-4">
              <div className="text-sm text-[var(--rowi-muted)] mb-1">{t.impactProductivity}</div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-purple-600">+{proj.productivityGainPct.toFixed(1)}%</span>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-4">
              <div className="text-sm text-[var(--rowi-muted)] mb-1">{t.impactRevenue}</div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-green-600">${(proj.revenueImpact / 1000000).toFixed(2)}M</span>
                <span className="text-sm text-[var(--rowi-muted)]">{t.impactPerYear}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Section 7: Scenario Comparison */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-purple-500" /> {t.scenarioTitle}
          </h2>
          <p className="text-[var(--rowi-muted)]">{t.scenarioDesc}</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          {scenarioData.map((scenario, i) => (
            <ScenarioCard key={scenario.label} title={scenario.label} multiplier={scenario.multiplierLabel} roi={scenario.roi} payback={scenario.payback} savings={scenario.savings} labels={{ scenarioROI: t.scenarioROI, scenarioPayback: t.scenarioPayback, scenarioSavings: t.scenarioSavings, scenarioMultiplier: t.scenarioMultiplier, roiPaybackMonths: t.roiPaybackMonths }} isHighlighted={i === 1} />
          ))}
        </div>
      </div>

      {/* Section 8: Industry Comparison */}
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-white dark:bg-zinc-900 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-zinc-800 overflow-x-auto">
        <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-purple-500" /> {t.industryTitle}
        </h2>
        <p className="text-sm text-[var(--rowi-muted)] mb-6">{t.industryDesc}</p>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-zinc-800">
              <th className="text-left py-3 px-2 font-semibold text-[var(--rowi-muted)]">{t.industryName}</th>
              <th className="text-right py-3 px-2 font-semibold text-[var(--rowi-muted)]">{t.industryCostPerPt}</th>
              <th className="text-right py-3 px-2 font-semibold text-[var(--rowi-muted)]">{t.industryAvgROI}</th>
              <th className="text-right py-3 px-2 font-semibold text-[var(--rowi-muted)]">{t.industryTimeline}</th>
              <th className="text-right py-3 px-2 font-semibold text-[var(--rowi-muted)]">{t.industryTurnover}</th>
              <th className="text-right py-3 px-2 font-semibold text-[var(--rowi-muted)]">{t.industryProductivity}</th>
              <th className="text-right py-3 px-2 font-semibold text-[var(--rowi-muted)]">{t.industrySatisfaction}</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-purple-50 dark:bg-purple-900/20 font-semibold">
              <td className="py-3 px-2 rounded-l-lg"><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-purple-500" />{t.industryTPProjected}</div></td>
              <td className="text-right py-3 px-2 text-purple-600">${tpCostPerPoint.toFixed(0)}</td>
              <td className="text-right py-3 px-2 text-purple-600">{tpROI.toFixed(0)}%</td>
              <td className="text-right py-3 px-2">{duration} {t.labelMonths}</td>
              <td className="text-right py-3 px-2">{tpTurnoverReduction.toFixed(1)}%</td>
              <td className="text-right py-3 px-2">{tpProductivityGain.toFixed(1)}%</td>
              <td className="text-right py-3 px-2 rounded-r-lg">--</td>
            </tr>
            {INDUSTRY_BENCHMARKS.map((ind) => (
              <tr key={ind.id} className="border-b border-gray-50 dark:border-zinc-800/50 hover:bg-gray-50 dark:hover:bg-zinc-800/30 transition-colors">
                <td className="py-3 px-2">{ind.name[lang as keyof typeof ind.name] || ind.name.es}</td>
                <td className="text-right py-3 px-2">${ind.avgCostPerPoint}</td>
                <td className="text-right py-3 px-2">{ind.avgROI}%</td>
                <td className="text-right py-3 px-2">{ind.avgTimeMonths} {t.labelMonths}</td>
                <td className="text-right py-3 px-2">{ind.turnoverReduction}%</td>
                <td className="text-right py-3 px-2">{ind.productivityGain}%</td>
                <td className="text-right py-3 px-2">{ind.satisfactionGain}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {/* Section 9: Timeline to ROI */}
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-white dark:bg-zinc-900 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-zinc-800">
        <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
          <Clock className="w-5 h-5 text-purple-500" /> {t.timelineTitle}
        </h2>
        <p className="text-sm text-[var(--rowi-muted)] mb-8">{t.timelineDesc}</p>
        <div className="relative mb-10">
          <div className="h-2 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-green-500" initial={{ width: 0 }} whileInView={{ width: "100%" }} viewport={{ once: true }} transition={{ duration: 2, ease: "easeOut" }} />
          </div>
          <div className="flex justify-between mt-3">
            {[
              { month: 1, label: t.timelineMilestone1 },
              { month: Math.ceil(duration * 0.25), label: t.timelineMilestone2 },
              { month: Math.ceil(duration * 0.6), label: t.timelineMilestone3 },
              { month: duration, label: t.timelineMilestone4 },
            ].map((milestone, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.5 + i * 0.2 }} className="text-center">
                <div className="w-3 h-3 rounded-full bg-purple-500 mx-auto mb-1 -mt-[22px]" />
                <div className="text-[10px] font-semibold">M{milestone.month}</div>
                <div className="text-[10px] text-[var(--rowi-muted)] max-w-[80px]">{milestone.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <TimelinePhase phase={1} title={t.timelinePhase1} description={t.timelinePhase1Desc} months={`M1 - M${Math.ceil(duration * 0.25)}`} color="#7B2D8E" delay={0} milestones={[{ label: t.timelineMilestone1, position: "M1" }, { label: t.timelineMilestone2, position: `M${Math.ceil(duration * 0.25)}` }]} />
          <TimelinePhase phase={2} title={t.timelinePhase2} description={t.timelinePhase2Desc} months={`M${Math.ceil(duration * 0.25) + 1} - M${Math.ceil(duration * 0.5)}`} color="#E31937" delay={0.1} milestones={[{ label: t.timelineMilestone3, position: `M${Math.ceil(duration * 0.6)}` }]} />
          <TimelinePhase phase={3} title={t.timelinePhase3} description={t.timelinePhase3Desc} months={`M${Math.ceil(duration * 0.5) + 1} - M${duration}`} color="#10b981" delay={0.2} milestones={[{ label: t.timelineMilestone4, position: `M${duration}` }]} />
        </div>
      </motion.div>

      {/* Section 10: Info Box */}
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl p-6 flex gap-4">
        <Shield className="w-6 h-6 text-purple-500 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-1">{t.infoTitle}</h3>
          <p className="text-sm text-purple-700 dark:text-purple-300">{t.infoDesc}</p>
        </div>
      </motion.div>

      {/* Navigation Footer */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between pt-6 border-t border-gray-200 dark:border-zinc-800">
        <Link href="/hub/admin/tp/dashboard" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border-2 border-gray-200 dark:border-zinc-700 hover:border-purple-500 transition-colors font-medium">
          <ArrowLeft className="w-5 h-5" /> {t.navPrev}
        </Link>
        <Link href="/hub/admin/tp/benchmark" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:opacity-90 transition-opacity">
          {t.navNext} <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
