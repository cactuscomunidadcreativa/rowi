"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Heart, Users, Sparkles, Brain, Zap, Target,
  Building2, Globe, Shield, TrendingUp, Award, Loader2, AlertCircle,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { getEqLevel } from "@/domains/eq/lib/eqLevels";
import {
  getBrainStyleLabel,
  getBrainStyleEmoji,
  getBrainStyleColor,
  BRAIN_STYLES as BRAIN_STYLE_DATA,
  type BrainStyleKey,
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
    badge: "Afinidad de Equipo",
    title: "Afinidad de Equipo TP",
    subtitle: "Analisis de compatibilidad emocional en los equipos globales de Teleperformance — basado en estilos cerebrales SEI y datos reales de 14,886 evaluaciones",

    // Brain styles section
    brainDistTitle: "Distribucion Real de Estilos Cerebrales",
    brainDistDesc: "Distribucion de estilos cerebrales del benchmark TP basada en datos reales",
    employees: "evaluaciones",

    // Affinity matrix
    affinityMatrixTitle: "Matriz de Afinidad entre Estilos",
    affinityMatrixDesc: "Compatibilidad emocional calculada por similitud de perfiles de competencia entre estilos cerebrales",
    highAffinity: "Alta afinidad",
    mediumAffinity: "Media afinidad",
    lowAffinity: "Baja afinidad",

    // Complementary pairs
    complementaryTitle: "Parejas Complementarias",
    complementaryDesc: "Combinaciones de estilos cerebrales que generan mayor complementariedad de competencias",
    complementaryReason: "Razon",

    // Regional brain style distribution
    regionalTitle: "Estilos Cerebrales por Region",
    regionalDesc: "Como se distribuyen los estilos cerebrales en cada region de TP",

    // Brain style profiles
    profilesTitle: "Perfiles de Estilo Cerebral",
    profilesDesc: "Caracteristicas, fortalezas y riesgos de cada estilo cerebral encontrado en TP",
    traits: "Rasgos",
    strengths: "Fortalezas",
    risks: "Riesgos",
    facilitation: "Facilitacion",

    // Cross-region insights
    crossRegionTitle: "Perspectivas Interregionales",
    crossRegionDesc: "Patrones de afinidad en las operaciones globales de TP",

    // EQ by brain style
    eqByStyleTitle: "EQ Promedio por Estilo Cerebral",
    eqByStyleDesc: "Puntaje EQ Total promedio para cada estilo cerebral en el benchmark TP",
    avgEQ: "EQ Prom.",
    count: "Evaluaciones",

    // Info box
    infoTitle: "Datos de Afinidad TP",
    infoDesc: "Datos basados en el benchmark real de Teleperformance con 14,886 evaluaciones SEI. Estilos cerebrales y metricas de afinidad calculados desde perfiles reales.",

    // Navigation
    navBenchmark: "Benchmark",
    navEco: "ECO",

    loading: "Cargando datos de afinidad...",
    errorTitle: "Error al cargar datos",
    errorDesc: "No se pudieron cargar los datos del benchmark. Intenta de nuevo.",
    retry: "Reintentar",
  },
  en: {
    backToHub: "TP Hub",
    badge: "Team Affinity",
    title: "TP Team Affinity",
    subtitle: "Emotional compatibility analysis across Teleperformance global teams — powered by SEI brain style matching and real data from 14,886 assessments",

    // Brain styles section
    brainDistTitle: "Real Brain Style Distribution",
    brainDistDesc: "Brain style distribution from the TP benchmark based on real data",
    employees: "assessments",

    // Affinity matrix
    affinityMatrixTitle: "Style Affinity Matrix",
    affinityMatrixDesc: "Emotional compatibility calculated from competency profile similarity between brain styles",
    highAffinity: "High affinity",
    mediumAffinity: "Medium affinity",
    lowAffinity: "Low affinity",

    // Complementary pairs
    complementaryTitle: "Complementary Pairs",
    complementaryDesc: "Brain style combinations that generate the most competency complementarity",
    complementaryReason: "Reason",

    // Regional brain style distribution
    regionalTitle: "Brain Styles by Region",
    regionalDesc: "How brain styles are distributed across each TP region",

    // Brain style profiles
    profilesTitle: "Brain Style Profiles",
    profilesDesc: "Characteristics, strengths, and risks of each brain style found in TP",
    traits: "Traits",
    strengths: "Strengths",
    risks: "Risks",
    facilitation: "Facilitation",

    // Cross-region insights
    crossRegionTitle: "Cross-Region Insights",
    crossRegionDesc: "Affinity patterns across TP global operations",

    // EQ by brain style
    eqByStyleTitle: "Average EQ by Brain Style",
    eqByStyleDesc: "Average EQ Total score for each brain style in the TP benchmark",
    avgEQ: "Avg EQ",
    count: "Assessments",

    // Info box
    infoTitle: "TP Affinity Data",
    infoDesc: "Data based on the real Teleperformance benchmark with 14,886 SEI assessments. Brain styles and affinity metrics calculated from real profiles.",

    // Navigation
    navBenchmark: "Benchmark",
    navEco: "ECO",

    loading: "Loading affinity data...",
    errorTitle: "Error loading data",
    errorDesc: "Could not load benchmark data. Please try again.",
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

interface BrainStyleGroup {
  name: string;
  count: number;
  metrics: Record<string, GroupMetric>;
  brainStyleDist?: Record<string, number>;
}

interface RegionGroup {
  name: string;
  count: number;
  metrics: Record<string, GroupMetric>;
  brainStyleDist?: Record<string, number>;
}

/* =========================================================
   Complementary pairs logic
========================================================= */
const COMPLEMENTARY_PAIRS: { a: string; b: string; reasonEs: string; reasonEn: string; score: number }[] = [
  { a: "Scientist", b: "Visionary", reasonEs: "El analisis riguroso del Cientifico complementa la vision futurista del Visionario", reasonEn: "The Scientist's rigorous analysis complements the Visionary's forward-looking perspective", score: 92 },
  { a: "Strategist", b: "Energizer", reasonEs: "La planificacion estrategica del Estratega se potencia con la energia y accion del Energizador", reasonEn: "The Strategist's planning is enhanced by the Energizer's drive and action", score: 89 },
  { a: "Guardian", b: "Inventor", reasonEs: "La estabilidad del Guardian balancea la creatividad del Inventor", reasonEn: "The Guardian's stability balances the Inventor's creativity", score: 87 },
  { a: "Doer", b: "Sage", reasonEs: "La ejecucion practica del Hacedor se enriquece con la reflexion profunda del Sabio", reasonEn: "The Doer's practical execution is enriched by the Sage's deep reflection", score: 85 },
  { a: "Scientist", b: "Energizer", reasonEs: "El enfoque analitico se complementa con la motivacion contagiosa", reasonEn: "The analytical focus complements the contagious motivation", score: 84 },
  { a: "Strategist", b: "Guardian", reasonEs: "La vision a largo plazo se protege con lealtad y cuidado", reasonEn: "Long-term vision is protected with loyalty and care", score: 83 },
];

/* =========================================================
   Main Page
========================================================= */
export default function TPAffinityPage() {
  const { lang } = useI18n();
  const t = translations[lang as keyof typeof translations] || translations.es;

  const [brainStyleGroups, setBrainStyleGroups] = useState<BrainStyleGroup[]>([]);
  const [regionGroups, setRegionGroups] = useState<RegionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch brain style grouped stats + region grouped stats
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [brainRes, regionRes] = await Promise.all([
          fetch(`/api/admin/benchmarks/${TP_BENCHMARK_ID}/stats/grouped?groupBy=brainStyle`),
          fetch(`/api/admin/benchmarks/${TP_BENCHMARK_ID}/stats/grouped?groupBy=region`),
        ]);
        const brainJson = await brainRes.json();
        const regionJson = await regionRes.json();

        if (brainJson.ok) {
          setBrainStyleGroups(brainJson.groups ?? []);
        }
        if (regionJson.ok) {
          setRegionGroups(regionJson.groups ?? []);
        }
        if (!brainJson.ok && !regionJson.ok) {
          setError(brainJson.error || "Unknown error");
        }
      } catch (e) {
        console.error("Error loading affinity data:", e);
        setError("Network error");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Compute total assessments
  const totalAssessments = useMemo(
    () => brainStyleGroups.reduce((s, g) => s + g.count, 0),
    [brainStyleGroups]
  );

  // Sort brain styles by count
  const sortedBrainStyles = useMemo(
    () => [...brainStyleGroups].sort((a, b) => b.count - a.count),
    [brainStyleGroups]
  );

  // Compute affinity matrix (similarity of competency profiles)
  const affinityMatrix = useMemo(() => {
    if (brainStyleGroups.length < 2) return [];
    const COMP_KEYS = ["EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"];

    function getCompVector(group: BrainStyleGroup): number[] {
      return COMP_KEYS.map(k => group.metrics[k]?.mean ?? 100);
    }

    function cosineSimilarity(a: number[], b: number[]): number {
      const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
      const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
      const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
      return magA && magB ? (dotProduct / (magA * magB)) * 100 : 0;
    }

    const matrix: { styleA: string; styleB: string; similarity: number }[] = [];
    for (let i = 0; i < brainStyleGroups.length; i++) {
      for (let j = i + 1; j < brainStyleGroups.length; j++) {
        const vecA = getCompVector(brainStyleGroups[i]);
        const vecB = getCompVector(brainStyleGroups[j]);
        matrix.push({
          styleA: brainStyleGroups[i].name,
          styleB: brainStyleGroups[j].name,
          similarity: Math.round(cosineSimilarity(vecA, vecB) * 10) / 10,
        });
      }
    }
    return matrix.sort((a, b) => b.similarity - a.similarity);
  }, [brainStyleGroups]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <Link href="/hub/admin/tp" className="inline-flex items-center gap-2 text-sm text-[var(--rowi-muted)] hover:text-purple-500 transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" /> {t.backToHub}
          </Link>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-pink-500/20 text-pink-500 mb-3">
            <Sparkles className="w-3 h-3" /> {t.badge}
          </span>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Heart className="w-8 h-8 text-pink-500" /> {t.title}
          </h1>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full" />
            <span className="text-sm text-[var(--rowi-muted)]">{t.loading}</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <Link href="/hub/admin/tp" className="inline-flex items-center gap-2 text-sm text-[var(--rowi-muted)] hover:text-purple-500 transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" /> {t.backToHub}
          </Link>
          <h1 className="text-3xl font-bold mb-2">{t.title}</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="w-10 h-10 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-red-600">{t.errorTitle}</h3>
          <p className="text-sm text-[var(--rowi-muted)] mt-2">{t.errorDesc}</p>
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
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-pink-500/20 text-pink-500 mb-3">
          <Sparkles className="w-3 h-3" /> {t.badge}
        </span>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Heart className="w-8 h-8 text-pink-500" /> {t.title}
        </h1>
        <p className="text-[var(--rowi-muted)]">{t.subtitle}</p>
      </div>

      {/* ── Brain Style Distribution (REAL DATA) ── */}
      <div>
        <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-500" /> {t.brainDistTitle}
        </h2>
        <p className="text-sm text-[var(--rowi-muted)] mb-4">{t.brainDistDesc}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
          {sortedBrainStyles.map((group, i) => {
            const pct = totalAssessments > 0 ? ((group.count / totalAssessments) * 100).toFixed(1) : "0";
            const avgEQ = group.metrics.eqTotal?.mean ?? 0;
            const eqLevel = getEqLevel(avgEQ);
            return (
              <motion.div
                key={group.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white dark:bg-zinc-900 rounded-xl p-4 shadow-sm text-center border border-gray-100 dark:border-zinc-800 hover:shadow-md transition-shadow"
              >
                <span className="text-3xl block mb-2">{getBrainStyleEmoji(group.name)}</span>
                <h3 className="font-semibold text-sm" style={{ color: getBrainStyleColor(group.name) }}>
                  {getBrainStyleLabel(group.name, lang)}
                </h3>
                <div className="text-2xl font-bold mt-1" style={{ color: getBrainStyleColor(group.name) }}>
                  {pct}%
                </div>
                <p className="text-[10px] text-[var(--rowi-muted)] mt-1">
                  {group.count.toLocaleString()} {t.employees}
                </p>
                {/* EQ avg + level badge */}
                <div className="mt-2 flex flex-col items-center gap-1">
                  <span className="text-sm font-mono font-bold text-purple-600">
                    {avgEQ.toFixed(1)} EQ
                  </span>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${eqLevel.color}20`, color: eqLevel.color }}
                  >
                    {eqLevel.emoji} {lang === "en" ? eqLevel.labelEN : eqLevel.label}
                  </span>
                </div>
                {/* Percentage bar */}
                <div className="h-1.5 bg-gray-200 dark:bg-zinc-800 rounded-full mt-3 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: getBrainStyleColor(group.name) }}
                    initial={{ width: 0 }}
                    animate={{ width: `${parseFloat(pct) * 4}%` }}
                    transition={{ duration: 0.8, delay: i * 0.05 }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── EQ by Brain Style (bars) ── */}
      <div>
        <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-500" /> {t.eqByStyleTitle}
        </h2>
        <p className="text-sm text-[var(--rowi-muted)] mb-4">{t.eqByStyleDesc}</p>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800">
          <div className="space-y-3">
            {sortedBrainStyles
              .sort((a, b) => (b.metrics.eqTotal?.mean ?? 0) - (a.metrics.eqTotal?.mean ?? 0))
              .map((group, i) => {
                const avgEQ = group.metrics.eqTotal?.mean ?? 0;
                const minEQ = 90;
                const maxEQ = 115;
                const barWidth = Math.max(0, Math.min(100, ((avgEQ - minEQ) / (maxEQ - minEQ)) * 100));
                return (
                  <motion.div
                    key={group.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3"
                  >
                    <span className="text-lg w-8">{getBrainStyleEmoji(group.name)}</span>
                    <span className="text-sm font-medium w-28 truncate" style={{ color: getBrainStyleColor(group.name) }}>
                      {getBrainStyleLabel(group.name, lang)}
                    </span>
                    <div className="flex-1 h-4 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: getBrainStyleColor(group.name) }}
                        initial={{ width: 0 }}
                        animate={{ width: `${barWidth}%` }}
                        transition={{ duration: 0.8, delay: i * 0.06 }}
                      />
                    </div>
                    <span className="text-sm font-mono font-bold w-14 text-right text-purple-600">
                      {avgEQ.toFixed(1)}
                    </span>
                    <span className="text-[10px] text-[var(--rowi-muted)] w-16 text-right">
                      {group.count.toLocaleString()}
                    </span>
                  </motion.div>
                );
              })}
          </div>
        </div>
      </div>

      {/* ── Affinity Matrix ── */}
      {affinityMatrix.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-500" /> {t.affinityMatrixTitle}
          </h2>
          <p className="text-sm text-[var(--rowi-muted)] mb-4">{t.affinityMatrixDesc}</p>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800">
            <div className="grid md:grid-cols-2 gap-3">
              {affinityMatrix.slice(0, 12).map((pair, i) => {
                const affinityLevel = pair.similarity > 99.5 ? "high" : pair.similarity > 99 ? "medium" : "low";
                const bgColor = affinityLevel === "high"
                  ? "bg-green-50 dark:bg-green-900/15 border-green-200 dark:border-green-800"
                  : affinityLevel === "medium"
                  ? "bg-blue-50 dark:bg-blue-900/15 border-blue-200 dark:border-blue-800"
                  : "bg-gray-50 dark:bg-zinc-800/50 border-gray-200 dark:border-zinc-700";
                return (
                  <motion.div
                    key={`${pair.styleA}-${pair.styleB}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`rounded-xl p-4 border ${bgColor}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <span className="text-lg">{getBrainStyleEmoji(pair.styleA)}</span>
                        <span className="text-xs font-medium" style={{ color: getBrainStyleColor(pair.styleA) }}>
                          {getBrainStyleLabel(pair.styleA, lang)}
                        </span>
                      </div>
                      <span className="text-[var(--rowi-muted)]">×</span>
                      <div className="flex items-center gap-1">
                        <span className="text-lg">{getBrainStyleEmoji(pair.styleB)}</span>
                        <span className="text-xs font-medium" style={{ color: getBrainStyleColor(pair.styleB) }}>
                          {getBrainStyleLabel(pair.styleB, lang)}
                        </span>
                      </div>
                      <span className="ml-auto text-sm font-bold text-pink-600">
                        {pair.similarity.toFixed(1)}%
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            <div className="flex items-center gap-6 justify-center mt-4 text-xs text-[var(--rowi-muted)]">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-400" /> {t.highAffinity}</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-400" /> {t.mediumAffinity}</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-gray-400" /> {t.lowAffinity}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Complementary Pairs ── */}
      <div>
        <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" /> {t.complementaryTitle}
        </h2>
        <p className="text-sm text-[var(--rowi-muted)] mb-4">{t.complementaryDesc}</p>
        <div className="grid md:grid-cols-2 gap-4">
          {COMPLEMENTARY_PAIRS.map((pair, i) => (
            <motion.div
              key={`${pair.a}-${pair.b}`}
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-gradient-to-br from-pink-500/5 to-purple-500/5 rounded-2xl p-5 border border-pink-500/10"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xl">{getBrainStyleEmoji(pair.a)}</span>
                  <span className="text-sm font-bold" style={{ color: getBrainStyleColor(pair.a) }}>
                    {getBrainStyleLabel(pair.a, lang)}
                  </span>
                </div>
                <span className="text-pink-500 font-bold">+</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl">{getBrainStyleEmoji(pair.b)}</span>
                  <span className="text-sm font-bold" style={{ color: getBrainStyleColor(pair.b) }}>
                    {getBrainStyleLabel(pair.b, lang)}
                  </span>
                </div>
                <span className="ml-auto text-lg font-bold text-pink-600">{pair.score}%</span>
              </div>
              <p className="text-xs text-[var(--rowi-muted)]">
                {lang === "en" ? pair.reasonEn : pair.reasonEs}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Brain Styles by Region (REAL DATA) ── */}
      {regionGroups.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-500" /> {t.regionalTitle}
          </h2>
          <p className="text-sm text-[var(--rowi-muted)] mb-4">{t.regionalDesc}</p>
          <div className="grid md:grid-cols-2 gap-4">
            {regionGroups
              .filter(r => r.brainStyleDist && Object.keys(r.brainStyleDist).length > 0)
              .slice(0, 6)
              .map((region, i) => {
                const total = Object.values(region.brainStyleDist!).reduce((s, v) => s + v, 0);
                const entries = Object.entries(region.brainStyleDist!)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5);
                return (
                  <motion.div
                    key={region.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="bg-white dark:bg-zinc-900 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-zinc-800"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Globe className="w-4 h-4 text-blue-500" />
                      <span className="font-semibold text-sm">{region.name}</span>
                      <span className="text-xs text-[var(--rowi-muted)] ml-auto">
                        {region.count.toLocaleString()} {t.employees}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {entries.map(([style, count]) => {
                        const pct = total > 0 ? ((count / total) * 100).toFixed(1) : "0";
                        return (
                          <div key={style} className="flex items-center gap-2">
                            <span className="text-sm">{getBrainStyleEmoji(style)}</span>
                            <span className="text-xs w-20 truncate" style={{ color: getBrainStyleColor(style) }}>
                              {getBrainStyleLabel(style, lang)}
                            </span>
                            <div className="flex-1 h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{ backgroundColor: getBrainStyleColor(style), width: `${parseFloat(pct) * 4}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-mono font-bold w-12 text-right">
                              {pct}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              })}
          </div>
        </div>
      )}

      {/* ── Brain Style Profiles ── */}
      <div>
        <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
          <Award className="w-5 h-5 text-purple-500" /> {t.profilesTitle}
        </h2>
        <p className="text-sm text-[var(--rowi-muted)] mb-4">{t.profilesDesc}</p>
        <div className="grid md:grid-cols-2 gap-4">
          {sortedBrainStyles.slice(0, 8).map((group, i) => {
            const styleKey = group.name.toLowerCase() as BrainStyleKey;
            const styleData = BRAIN_STYLE_DATA[styleKey];
            if (!styleData) return null;
            return (
              <motion.div
                key={group.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="bg-white dark:bg-zinc-900 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-zinc-800"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{getBrainStyleEmoji(group.name)}</span>
                  <div>
                    <h3 className="font-bold" style={{ color: getBrainStyleColor(group.name) }}>
                      {getBrainStyleLabel(group.name, lang)}
                    </h3>
                    <p className="text-[10px] text-[var(--rowi-muted)]">
                      {group.count.toLocaleString()} {t.employees} · EQ {(group.metrics.eqTotal?.mean ?? 0).toFixed(1)}
                    </p>
                  </div>
                </div>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="font-medium text-[var(--rowi-muted)]">{t.traits}: </span>
                    <span>{styleData.traits.join(", ")}</span>
                  </div>
                  <div>
                    <span className="font-medium text-green-600">{t.strengths}: </span>
                    <span>{styleData.strengths.join(", ")}</span>
                  </div>
                  <div>
                    <span className="font-medium text-yellow-600">{t.risks}: </span>
                    <span>{styleData.risks.join(", ")}</span>
                  </div>
                  <div>
                    <span className="font-medium text-purple-500">{t.facilitation}: </span>
                    <span>{styleData.facilitation}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Info */}
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 rounded-2xl p-6 flex gap-4">
        <Shield className="w-6 h-6 text-pink-500 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-pink-900 dark:text-pink-100 mb-1">{t.infoTitle}</h3>
          <p className="text-sm text-pink-700 dark:text-pink-300">{t.infoDesc}</p>
        </div>
      </motion.div>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between pt-6 border-t border-gray-200 dark:border-zinc-800">
        <Link href="/hub/admin/tp/benchmark" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border-2 border-gray-200 dark:border-zinc-700 hover:border-pink-500 transition-colors font-medium">
          <ArrowLeft className="w-5 h-5" /> {t.navBenchmark}
        </Link>
        <Link href="/hub/admin/tp/eco" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold hover:opacity-90 transition-opacity">
          {t.navEco} <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
