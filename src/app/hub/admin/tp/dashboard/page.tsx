"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  Heart,
  Target,
  Zap,
  TrendingUp,
  Award,
  Sparkles,
  Info,
  Users,
  Building2,
  Activity,
  BarChart3,
  Globe,
  Shield,
  Loader2,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

/* =========================================================
   Translations
========================================================= */
const translations = {
  es: {
    backToHub: "TP Hub",
    badgeEQDashboard: "EQ Dashboard",
    pageTitle: "Teleperformance EQ Dashboard",
    pageSubtitle: "Métricas agregadas de inteligencia emocional de {count} evaluaciones SEI en {countries} países",
    levelEnterprise: "Enterprise",
    assessments: "evaluaciones",
    globalEQAverage: "Promedio EQ Global",
    tpGlobalAvg: "Promedio Global TP",
    seiScaleLabel: "Escala SEI: 65–135 | Basado en {count} evaluaciones",
    threePursuits: "Las 3 Búsquedas",
    threePursuitsDesc: "El modelo SEI de Six Seconds organiza 8 competencias en 3 búsquedas",
    pursuitKnow: "Conócete",
    pursuitChoose: "Elígete",
    pursuitGive: "Entrégate",
    competenciesTitle: "8 Competencias SEI",
    competenciesDesc: "Promedio vs mejores puntajes en todas las evaluaciones de TP",
    compEL: "Alfabetización Emocional",
    compRP: "Reconocer Patrones",
    compACT: "Pensamiento Consecuente",
    compNE: "Navegar Emociones",
    compIM: "Motivación Intrínseca",
    compOP: "Ejercer Optimismo",
    compEMP: "Aumentar Empatía",
    compNG: "Metas Nobles",
    compAvg: "Prom",
    compTop: "Mejor",
    outcomesTitle: "Resultados de Vida",
    outcomesDesc: "Cómo la inteligencia emocional impacta los resultados de vida en TP",
    outcomeEffectiveness: "Efectividad",
    outcomeRelationships: "Relaciones",
    outcomeWellbeing: "Bienestar",
    outcomeQuality: "Calidad de Vida",
    infoTitle: "Datos TP en Vivo",
    infoDesc: "Este dashboard muestra datos reales agregados de {count} evaluaciones SEI de Teleperformance. Todos los datos individuales están anonimizados. Escala SEI: 65–135.",
    navBenchmark: "Benchmark",
    regionNorthAmerica: "Norteamérica",
    regionAsiaPacific: "Asia Pacífico",
    regionEMEA: "EMEA",
    regionLatinAmerica: "Latinoamérica",
    loading: "Cargando datos del benchmark...",
    emptyBenchmark: "Sin datos de benchmark todavía",
    noData: "—",
  },
  en: {
    backToHub: "TP Hub",
    badgeEQDashboard: "EQ Dashboard",
    pageTitle: "Teleperformance EQ Dashboard",
    pageSubtitle: "Aggregated emotional intelligence metrics from {count} SEI assessments across {countries} countries",
    levelEnterprise: "Enterprise",
    assessments: "assessments",
    globalEQAverage: "Global EQ Average",
    tpGlobalAvg: "TP Global Avg",
    seiScaleLabel: "SEI Scale: 65–135 | Based on {count} assessments",
    threePursuits: "The 3 Pursuits",
    threePursuitsDesc: "Six Seconds SEI model organizes 8 competencies into 3 pursuits",
    pursuitKnow: "Know Yourself",
    pursuitChoose: "Choose Yourself",
    pursuitGive: "Give Yourself",
    competenciesTitle: "8 SEI Competencies",
    competenciesDesc: "Average vs top performer scores across all TP assessments",
    compEL: "Enhance Emotional Literacy",
    compRP: "Recognize Patterns",
    compACT: "Apply Consequential Thinking",
    compNE: "Navigate Emotions",
    compIM: "Engage Intrinsic Motivation",
    compOP: "Exercise Optimism",
    compEMP: "Increase Empathy",
    compNG: "Pursue Noble Goals",
    compAvg: "Avg",
    compTop: "Top",
    outcomesTitle: "Life Outcomes",
    outcomesDesc: "How emotional intelligence impacts life outcomes across TP",
    outcomeEffectiveness: "Effectiveness",
    outcomeRelationships: "Relationships",
    outcomeWellbeing: "Wellbeing",
    outcomeQuality: "Quality of Life",
    infoTitle: "Live TP Data",
    infoDesc: "This dashboard shows real aggregated data from {count} Teleperformance SEI assessments. All individual data is anonymized. SEI Scale: 65–135.",
    navBenchmark: "Benchmark",
    regionNorthAmerica: "North America",
    regionAsiaPacific: "Asia Pacific",
    regionEMEA: "EMEA",
    regionLatinAmerica: "Latin America",
    loading: "Loading benchmark data...",
    emptyBenchmark: "No benchmark data yet",
    noData: "—",
  },
  pt: {
    backToHub: "TP Hub",
    badgeEQDashboard: "EQ Dashboard",
    pageTitle: "Teleperformance EQ Dashboard",
    pageSubtitle: "Aggregated emotional intelligence metrics from {count} SEI assessments across {countries} countries",
    levelEnterprise: "Enterprise",
    assessments: "assessments",
    globalEQAverage: "Global EQ Average",
    tpGlobalAvg: "TP Global Avg",
    seiScaleLabel: "SEI Scale: 65–135 | Based on {count} assessments",
    threePursuits: "The 3 Pursuits",
    threePursuitsDesc: "Six Seconds SEI model organizes 8 competencies into 3 pursuits",
    pursuitKnow: "Know Yourself",
    pursuitChoose: "Choose Yourself",
    pursuitGive: "Give Yourself",
    competenciesTitle: "8 SEI Competencies",
    competenciesDesc: "Average vs top performer scores across all TP assessments",
    compEL: "Enhance Emotional Literacy",
    compRP: "Recognize Patterns",
    compACT: "Apply Consequential Thinking",
    compNE: "Navigate Emotions",
    compIM: "Engage Intrinsic Motivation",
    compOP: "Exercise Optimism",
    compEMP: "Increase Empathy",
    compNG: "Pursue Noble Goals",
    compAvg: "Avg",
    compTop: "Top",
    outcomesTitle: "Life Outcomes",
    outcomesDesc: "How emotional intelligence impacts life outcomes across TP",
    outcomeEffectiveness: "Effectiveness",
    outcomeRelationships: "Relationships",
    outcomeWellbeing: "Wellbeing",
    outcomeQuality: "Quality of Life",
    infoTitle: "Live TP Data",
    infoDesc: "This dashboard shows real aggregated data from {count} Teleperformance SEI assessments. All individual data is anonymized. SEI Scale: 65–135.",
    navBenchmark: "Benchmark",
    regionNorthAmerica: "North America",
    regionAsiaPacific: "Asia Pacific",
    regionEMEA: "EMEA",
    regionLatinAmerica: "Latin America",
    loading: "Loading benchmark data...",
    emptyBenchmark: "No benchmark data yet",
    noData: "—",
  },
  it: {
    backToHub: "TP Hub",
    badgeEQDashboard: "EQ Dashboard",
    pageTitle: "Teleperformance EQ Dashboard",
    pageSubtitle: "Aggregated emotional intelligence metrics from {count} SEI assessments across {countries} countries",
    levelEnterprise: "Enterprise",
    assessments: "assessments",
    globalEQAverage: "Global EQ Average",
    tpGlobalAvg: "TP Global Avg",
    seiScaleLabel: "SEI Scale: 65–135 | Based on {count} assessments",
    threePursuits: "The 3 Pursuits",
    threePursuitsDesc: "Six Seconds SEI model organizes 8 competencies into 3 pursuits",
    pursuitKnow: "Know Yourself",
    pursuitChoose: "Choose Yourself",
    pursuitGive: "Give Yourself",
    competenciesTitle: "8 SEI Competencies",
    competenciesDesc: "Average vs top performer scores across all TP assessments",
    compEL: "Enhance Emotional Literacy",
    compRP: "Recognize Patterns",
    compACT: "Apply Consequential Thinking",
    compNE: "Navigate Emotions",
    compIM: "Engage Intrinsic Motivation",
    compOP: "Exercise Optimism",
    compEMP: "Increase Empathy",
    compNG: "Pursue Noble Goals",
    compAvg: "Avg",
    compTop: "Top",
    outcomesTitle: "Life Outcomes",
    outcomesDesc: "How emotional intelligence impacts life outcomes across TP",
    outcomeEffectiveness: "Effectiveness",
    outcomeRelationships: "Relationships",
    outcomeWellbeing: "Wellbeing",
    outcomeQuality: "Quality of Life",
    infoTitle: "Live TP Data",
    infoDesc: "This dashboard shows real aggregated data from {count} Teleperformance SEI assessments. All individual data is anonymized. SEI Scale: 65–135.",
    navBenchmark: "Benchmark",
    regionNorthAmerica: "North America",
    regionAsiaPacific: "Asia Pacific",
    regionEMEA: "EMEA",
    regionLatinAmerica: "Latin America",
    loading: "Loading benchmark data...",
    emptyBenchmark: "No benchmark data yet",
    noData: "—",
  },

};

/* =========================================================
   TP Dashboard — Full EQ Dashboard with TP Data
   Shows aggregated TP data in individual dashboard format
========================================================= */

const TP_BENCHMARK_ID = "tp-all-assessments-2025";

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

interface GroupBucket {
  name: string;
  count: number;
  metrics: Record<string, { mean: number; median: number; min: number; max: number; stdDev: number }>;
}

// Static identity (non-metric) for the aggregate org card
const TP_USER_IDENTITY = {
  name: "TP Global Organization",
  avatar: "/rowivectors/Rowi-01.webp",
  level: "Enterprise",
  eqMax: 135,
  eqMin: 65,
};

type CompTKey = "compEL" | "compRP" | "compACT" | "compNE" | "compIM" | "compOP" | "compEMP" | "compNG";
type OutcomeTKey = "outcomeEffectiveness" | "outcomeRelationships" | "outcomeWellbeing" | "outcomeQuality";

interface CompetencyDatum {
  key: string;
  tKey: CompTKey;
  score: number;
  max: number;
  pursuit: string;
  topPerformer: number;
}

interface OutcomeDatum {
  key: string;
  tKey: OutcomeTKey;
  score: number;
}

const REGION_FLAGS: Record<string, string> = {
  "North America": "\u{1F30E}", "NA": "\u{1F30E}",
  "Latin America": "\u{1F30E}", "LATAM": "\u{1F30E}",
  "EMEA": "\u{1F30D}", "Europe": "\u{1F30D}",
  "Asia Pacific": "\u{1F30F}", "APAC": "\u{1F30F}",
};

/* =========================================================
   Components
========================================================= */
function EQCircle({ score, max, min, avgLabel }: { score: number; max: number; min: number; avgLabel: string }) {
  const percentage = ((score - min) / (max - min)) * 100;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-44 h-44">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r="45" stroke="currentColor" strokeWidth="10" fill="none" className="text-gray-200 dark:text-zinc-800" />
        <motion.circle
          cx="80" cy="80" r="45"
          stroke="url(#eqGradientTP)"
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{ strokeDasharray: circumference }}
        />
        <defs>
          <linearGradient id="eqGradientTP" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7B2D8E" />
            <stop offset="100%" stopColor="#E31937" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span className="text-4xl font-bold text-purple-600" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          {score.toFixed(1)}
        </motion.span>
        <span className="text-sm text-[var(--rowi-muted)]">/ {max}</span>
        <span className="text-[10px] text-[var(--rowi-muted)]">{avgLabel}</span>
      </div>
    </div>
  );
}

function PursuitBar({ pursuit, label }: { pursuit: { score: number; max: number; min: number; color: string }; label: string }) {
  const percentage = ((pursuit.score - pursuit.min) / (pursuit.max - pursuit.min)) * 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-[var(--rowi-muted)] font-mono">{pursuit.score.toFixed(1)}</span>
      </div>
      <div className="h-3 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: pursuit.color }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function CompetencyCard({ comp, name, avgLabel, topLabel }: { comp: CompetencyDatum; name: string; avgLabel: string; topLabel: string }) {
  const percentage = ((comp.score - 65) / 70) * 100;
  const topPercentage = ((comp.topPerformer - 65) / 70) * 100;
  const pursuitColors: Record<string, string> = { know: "#3b82f6", choose: "#10b981", give: "#f59e0b" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white dark:bg-zinc-900 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-zinc-800"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: pursuitColors[comp.pursuit] }}>
          {comp.key}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{name}</div>
          <div className="text-xs text-[var(--rowi-muted)]">
            {avgLabel}: {comp.score.toFixed(1)} | {topLabel}: {comp.topPerformer.toFixed(1)}
          </div>
        </div>
      </div>
      <div className="relative h-2 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          className="absolute h-full rounded-full opacity-30"
          style={{ backgroundColor: pursuitColors[comp.pursuit] }}
          initial={{ width: 0 }}
          animate={{ width: `${topPercentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
        <motion.div
          className="absolute h-full rounded-full"
          style={{ backgroundColor: pursuitColors[comp.pursuit] }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </motion.div>
  );
}

function OutcomeCard({ outcome, name }: { outcome: OutcomeDatum; name: string }) {
  const percentage = ((outcome.score - 65) / 70) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className="bg-white dark:bg-zinc-900 rounded-xl p-4 shadow-sm text-center border border-gray-100 dark:border-zinc-800"
    >
      <div className="text-3xl font-bold mb-1 text-purple-600">{outcome.score.toFixed(1)}</div>
      <div className="text-sm text-[var(--rowi-muted)]">{name}</div>
      <div className="mt-3 h-2 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </motion.div>
  );
}

/* =========================================================
   Main Page
========================================================= */
export default function TPDashboardPage() {
  const { lang } = useI18n();
  const t = translations[lang as keyof typeof translations] || translations.en;

  // --- Live data from the real benchmark API ---
  const [stats, setStats] = useState<StatItem[]>([]);
  const [regionGroups, setRegionGroups] = useState<GroupBucket[]>([]);
  const [countryCount, setCountryCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      setLoading(true);
      try {
        const [statsRes, regionRes, countryRes] = await Promise.all([
          fetch(`/api/admin/benchmarks/${TP_BENCHMARK_ID}/stats`),
          fetch(`/api/admin/benchmarks/${TP_BENCHMARK_ID}/stats/grouped?groupBy=region`),
          fetch(`/api/admin/benchmarks/${TP_BENCHMARK_ID}/stats/grouped?groupBy=country`),
        ]);
        const statsJson = await statsRes.json();
        const regionJson = await regionRes.json();
        const countryJson = await countryRes.json();
        if (cancelled) return;
        if (statsJson.ok) setStats(statsJson.statistics ?? []);
        if (regionJson.ok) setRegionGroups(regionJson.groups ?? []);
        if (countryJson.ok) setCountryCount(countryJson.totalGroups ?? 0);
      } catch (e) {
        console.error("Error loading dashboard data:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, []);

  const getStat = (key: string) => stats.find((s) => s.metricKey === key);
  const hasData = stats.length > 0;

  const eqStat = getStat("eqTotal");
  const totalAssessments = eqStat?.n ?? 0;
  const avgEQ = eqStat?.mean ?? 0;

  const meanOf = (keys: string[]) => {
    const vals = keys.map((k) => getStat(k)?.mean ?? 0).filter((v) => v > 0);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  };

  const TP_PURSUITS = useMemo(() => ({
    know: { score: meanOf(["EL", "RP", "ACT"]), max: 135, min: 65, color: "#3b82f6" },
    choose: { score: meanOf(["NE", "IM", "OP"]), max: 135, min: 65, color: "#10b981" },
    give: { score: meanOf(["EMP", "NG"]), max: 135, min: 65, color: "#f59e0b" },
  }), [stats]);

  const TP_COMPETENCIES = useMemo<CompetencyDatum[]>(() => {
    const defs: { key: string; tKey: CompTKey; pursuit: string }[] = [
      { key: "EL", tKey: "compEL", pursuit: "know" },
      { key: "RP", tKey: "compRP", pursuit: "know" },
      { key: "ACT", tKey: "compACT", pursuit: "know" },
      { key: "NE", tKey: "compNE", pursuit: "choose" },
      { key: "IM", tKey: "compIM", pursuit: "choose" },
      { key: "OP", tKey: "compOP", pursuit: "choose" },
      { key: "EMP", tKey: "compEMP", pursuit: "give" },
      { key: "NG", tKey: "compNG", pursuit: "give" },
    ];
    return defs.map((d) => {
      const s = getStat(d.key);
      return { ...d, max: 135, score: s?.mean ?? 0, topPerformer: s?.p90 ?? 0 };
    });
  }, [stats]);

  const TP_OUTCOMES = useMemo<OutcomeDatum[]>(() => [
    { key: "effectiveness", tKey: "outcomeEffectiveness", score: getStat("effectiveness")?.mean ?? 0 },
    { key: "relationships", tKey: "outcomeRelationships", score: getStat("relationships")?.mean ?? 0 },
    { key: "wellbeing", tKey: "outcomeWellbeing", score: getStat("wellbeing")?.mean ?? 0 },
    { key: "quality", tKey: "outcomeQuality", score: getStat("qualityOfLife")?.mean ?? 0 },
  ], [stats]);

  const TP_REGIONS = useMemo(() =>
    regionGroups.map((g) => ({
      name: g.name,
      count: g.count,
      avgEQ: g.metrics.eqTotal?.mean ?? 0,
      flag: REGION_FLAGS[g.name] ?? "\u{1F310}",
    })), [regionGroups]);

  const headerBlock = (
    <div>
      <Link href="/hub/admin/tp" className="inline-flex items-center gap-2 text-sm text-[var(--rowi-muted)] hover:text-purple-500 transition-colors mb-4">
        <ArrowLeft className="w-4 h-4" /> {t.backToHub}
      </Link>
      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-500 mb-3">
        <Sparkles className="w-3 h-3" /> {t.badgeEQDashboard}
      </span>
      <h1 className="text-3xl font-bold mb-2">{t.pageTitle}</h1>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-8">
        {headerBlock}
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
          <p className="text-sm text-[var(--rowi-muted)]">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="space-y-8">
        {headerBlock}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-12 border border-dashed border-gray-200 dark:border-zinc-700 text-center">
          <BarChart3 className="w-12 h-12 text-[var(--rowi-muted)] mx-auto mb-3 opacity-50" />
          <p className="text-[var(--rowi-muted)]">{t.emptyBenchmark}</p>
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

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-500 mb-3">
              <Sparkles className="w-3 h-3" /> {t.badgeEQDashboard}
            </span>
            <h1 className="text-3xl font-bold mb-2">{t.pageTitle}</h1>
            <p className="text-[var(--rowi-muted)]">
              {t.pageSubtitle
                .replace("{count}", totalAssessments.toLocaleString())
                .replace("{countries}", countryCount > 0 ? String(countryCount) : t.noData)}
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-lg border border-gray-100 dark:border-zinc-800 flex items-center gap-4"
          >
            <div className="relative w-16 h-16">
              <Image src={TP_USER_IDENTITY.avatar} alt="TP" fill className="object-contain" />
            </div>
            <div>
              <div className="font-bold text-lg">{TP_USER_IDENTITY.name}</div>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                <Award className="w-3 h-3" /> {t.levelEnterprise}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Quick Stats */}
      {TP_REGIONS.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-dashed border-gray-200 dark:border-zinc-700 text-center">
          <p className="text-sm text-[var(--rowi-muted)]">{t.emptyBenchmark}</p>
        </div>
      ) : (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {TP_REGIONS.map((region, i) => (
          <motion.div
            key={region.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-gray-100 dark:border-zinc-800 text-center"
          >
            <span className="text-2xl block mb-1">{region.flag}</span>
            <div className="text-xs text-[var(--rowi-muted)] mb-1">{region.name}</div>
            <div className="text-lg font-bold text-purple-600">{region.avgEQ.toFixed(1)}</div>
            <div className="text-[10px] text-[var(--rowi-muted)]">{region.count.toLocaleString()} {t.assessments}</div>
          </motion.div>
        ))}
      </div>
      )}

      {/* EQ Score + Pursuits */}
      <div className="grid lg:grid-cols-2 gap-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-zinc-900 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-zinc-800">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-500" /> {t.globalEQAverage}
          </h2>
          <div className="flex items-center justify-center">
            <EQCircle score={avgEQ} max={TP_USER_IDENTITY.eqMax} min={TP_USER_IDENTITY.eqMin} avgLabel={t.tpGlobalAvg} />
          </div>
          <p className="text-xs text-[var(--rowi-muted)] text-center mt-4">
            {t.seiScaleLabel.replace("{count}", totalAssessments.toLocaleString())}
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-zinc-900 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-zinc-800">
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-500" /> {t.threePursuits}
          </h2>
          <p className="text-sm text-[var(--rowi-muted)] mb-6">{t.threePursuitsDesc}</p>
          <div className="space-y-5">
            <PursuitBar pursuit={TP_PURSUITS.know} label={t.pursuitKnow} />
            <PursuitBar pursuit={TP_PURSUITS.choose} label={t.pursuitChoose} />
            <PursuitBar pursuit={TP_PURSUITS.give} label={t.pursuitGive} />
          </div>
        </motion.div>
      </div>

      {/* Competencies */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <Zap className="w-6 h-6 text-purple-500" /> {t.competenciesTitle}
          </h2>
          <p className="text-[var(--rowi-muted)]">{t.competenciesDesc}</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TP_COMPETENCIES.map((comp) => (
            <CompetencyCard key={comp.key} comp={comp} name={t[comp.tKey]} avgLabel={t.compAvg} topLabel={t.compTop} />
          ))}
        </div>
      </div>

      {/* Outcomes */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-purple-500" /> {t.outcomesTitle}
          </h2>
          <p className="text-[var(--rowi-muted)]">{t.outcomesDesc}</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TP_OUTCOMES.map((outcome) => (
            <OutcomeCard key={outcome.key} outcome={outcome} name={t[outcome.tKey]} />
          ))}
        </div>
      </div>

      {/* Info Tip */}
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl p-6 flex gap-4">
        <Shield className="w-6 h-6 text-purple-500 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-1">{t.infoTitle}</h3>
          <p className="text-sm text-purple-700 dark:text-purple-300">
            {t.infoDesc.replace("{count}", totalAssessments.toLocaleString())}
          </p>
        </div>
      </motion.div>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between pt-6 border-t border-gray-200 dark:border-zinc-800">
        <Link href="/hub/admin/tp" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border-2 border-gray-200 dark:border-zinc-700 hover:border-purple-500 transition-colors font-medium">
          <ArrowLeft className="w-5 h-5" /> {t.backToHub}
        </Link>
        <Link href="/hub/admin/tp/benchmark" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:opacity-90 transition-opacity">
          {t.navBenchmark} <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
