"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Loader2,
  TrendingUp,
  Users,
  Globe,
  Target,
  Award,
  Brain,
  Sparkles,
  ChevronDown,
  BarChart3,
  Zap,
  Trophy,
  ArrowUp,
  ArrowDown,
  Minus,
  Filter,
  Info,
  Star,
  Heart,
  Lightbulb,
  Network,
  Scale,
  Activity,
  Smile,
  CheckCircle,
  Compass,
  ChevronRight,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Cell,
} from "recharts";

/* =========================================================
   📊 Benchmark Page - Compárate con tu comunidad y el Rowiverse
   =========================================================
   Incluye:
   - Comparación de competencias (radar chart)
   - Comparación de talentos (bar chart)
   - Sugerencias basadas en correlaciones (sin IA)
   - Multi-idioma completo (es/en)
========================================================= */

type CompareWith = "rowiverse" | "community" | "benchmark";
type Outcome =
  | "effectiveness"
  | "relationships"
  | "qualityOfLife"
  | "wellbeing"
  | "influence"
  | "decisionMaking"
  | "community"
  | "network"
  | "achievement"
  | "satisfaction"
  | "balance"
  | "health";

const OUTCOMES: { value: Outcome; labelEs: string; labelEn: string; icon: React.ElementType }[] = [
  { value: "effectiveness", labelEs: "Efectividad", labelEn: "Effectiveness", icon: Target },
  { value: "relationships", labelEs: "Relaciones", labelEn: "Relationships", icon: Heart },
  { value: "qualityOfLife", labelEs: "Calidad de Vida", labelEn: "Quality of Life", icon: Sparkles },
  { value: "wellbeing", labelEs: "Bienestar", labelEn: "Wellbeing", icon: Smile },
  { value: "influence", labelEs: "Influencia", labelEn: "Influence", icon: TrendingUp },
  { value: "decisionMaking", labelEs: "Toma de Decisiones", labelEn: "Decision Making", icon: Lightbulb },
  { value: "community", labelEs: "Comunidad", labelEn: "Community", icon: Users },
  { value: "network", labelEs: "Networking", labelEn: "Network", icon: Network },
  { value: "achievement", labelEs: "Logro", labelEn: "Achievement", icon: Trophy },
  { value: "satisfaction", labelEs: "Satisfacción", labelEn: "Satisfaction", icon: CheckCircle },
  { value: "balance", labelEs: "Balance", labelEn: "Balance", icon: Scale },
  { value: "health", labelEs: "Salud", labelEn: "Health", icon: Activity },
];

const PURSUIT_COLORS = {
  K: "#1E88E5", // Know - Azul
  C: "#E53935", // Choose - Rojo
  G: "#43A047", // Give - Verde
};

const PURSUIT_MAP: Record<string, "K" | "C" | "G"> = {
  K: "K", EL: "K", RP: "K",
  C: "C", ACT: "C", NE: "C", IM: "C",
  G: "G", OP: "G", EMP: "G", NG: "G",
};

const SEI_LEVELS = [
  { key: "challenge", min: 65, max: 81, color: "#ef4444", emoji: "🧩", es: "Desafío", en: "Challenge" },
  { key: "emerging", min: 82, max: 91, color: "#f59e0b", emoji: "🌱", es: "Emergente", en: "Emerging" },
  { key: "functional", min: 92, max: 107, color: "#3b82f6", emoji: "🧠", es: "Funcional", en: "Functional" },
  { key: "skilled", min: 108, max: 117, color: "#8b5cf6", emoji: "🎯", es: "Diestro", en: "Skilled" },
  { key: "expert", min: 118, max: 135, color: "#10b981", emoji: "🌟", es: "Experto", en: "Expert" },
];

function getLevel(score: number) {
  return SEI_LEVELS.find((l) => score >= l.min && score <= l.max) || SEI_LEVELS[0];
}

export default function BenchmarkPage() {
  const { lang } = useI18n();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [compareWith, setCompareWith] = useState<CompareWith>("rowiverse");
  const [selectedOutcome, setSelectedOutcome] = useState<Outcome>("effectiveness");
  const [selectedBenchmarkId, setSelectedBenchmarkId] = useState<string | null>(null);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);
  const [showAllTalents, setShowAllTalents] = useState(false);

  // =========================================================
  // 🌐 Translations
  // =========================================================
  const tr = useMemo(() => {
    const t: Record<string, Record<string, string>> = {
      es: {
        title: "Benchmark",
        subtitle: "Compara tu perfil SEI",
        description: "Descubre cómo te comparas con otros y potencia tus fortalezas",
        compareWith: "Comparar con",
        rowiverse: "Rowiverse Global",
        community: "Mi Comunidad",
        benchmark: "Benchmark Específico",
        yourStrengths: "Tus Fortalezas",
        top3Competencies: "Top 3 Competencias SEI",
        top5Talents: "Top 5 Talentos",
        allTalents: "Todos los Talentos",
        showAll: "Ver todos",
        showLess: "Ver menos",
        vsTopPerformers: "vs Top Performers",
        competencyComparison: "Comparación de Competencias",
        talentComparison: "Comparación de Talentos",
        talentComparisonDesc: "Tus talentos vs el promedio del benchmark",
        outcome: "Resultado buscado",
        outcomeDesc: "¿Qué quieres mejorar?",
        noData: "Sin datos SEI",
        noDataDesc: "Completa tu evaluación SEI para ver tu benchmark",
        loading: "Cargando benchmark...",
        yourScore: "Tu puntaje",
        average: "Promedio",
        topPerformers: "Top Performers",
        above: "por encima",
        below: "por debajo",
        onPar: "en el promedio",
        benchmarkN: "Muestra",
        people: "personas",
        percentile: "Percentil",
        pursuitsK: "Conocerse",
        pursuitsC: "Elegirse",
        pursuitsG: "Darse",
        radarYou: "Tú",
        radarAvg: "Promedio",
        radarTop: "Top 10%",
        levelsLegend: "Niveles SEI",
        // Suggestions
        suggestions: "Sugerencias de Desarrollo",
        suggestionsDesc: "Basadas en correlaciones con los top performers en",
        developAreas: "Áreas a Desarrollar",
        developDesc: "Los top performers tienen un nivel más alto en estas áreas",
        leverageStrengths: "Fortalezas a Aprovechar",
        leverageDesc: "Ya estás al nivel de los top performers o por encima",
        talentGaps: "Talentos con Oportunidad",
        talentGapsDesc: "Talentos donde los top performers destacan más",
        talentStrengths: "Talentos Destacados",
        talentStrengthsDesc: "Talentos donde estás al nivel de los mejores",
        shouldIncrease: "Deberías aumentar",
        shouldMaintain: "Mantén tu nivel en",
        youAre: "Estás en",
        topPerformersAre: "Top performers están en",
        suggestedAction: "Acción sugerida",
        noSuggestions: "Necesitas datos de top performers para generar sugerencias",
        mainCommunity: "Mi comunidad principal",
      },
      en: {
        title: "Benchmark",
        subtitle: "Compare your SEI profile",
        description: "Discover how you compare with others and leverage your strengths",
        compareWith: "Compare with",
        rowiverse: "Global Rowiverse",
        community: "My Community",
        benchmark: "Specific Benchmark",
        yourStrengths: "Your Strengths",
        top3Competencies: "Top 3 SEI Competencies",
        top5Talents: "Top 5 Talents",
        allTalents: "All Talents",
        showAll: "Show all",
        showLess: "Show less",
        vsTopPerformers: "vs Top Performers",
        competencyComparison: "Competency Comparison",
        talentComparison: "Talent Comparison",
        talentComparisonDesc: "Your talents vs the benchmark average",
        outcome: "Target outcome",
        outcomeDesc: "What do you want to improve?",
        noData: "No SEI data",
        noDataDesc: "Complete your SEI assessment to see your benchmark",
        loading: "Loading benchmark...",
        yourScore: "Your score",
        average: "Average",
        topPerformers: "Top Performers",
        above: "above",
        below: "below",
        onPar: "on par",
        benchmarkN: "Sample",
        people: "people",
        percentile: "Percentile",
        pursuitsK: "Know Yourself",
        pursuitsC: "Choose Yourself",
        pursuitsG: "Give Yourself",
        radarYou: "You",
        radarAvg: "Average",
        radarTop: "Top 10%",
        levelsLegend: "SEI Levels",
        // Suggestions
        suggestions: "Development Suggestions",
        suggestionsDesc: "Based on correlations with top performers in",
        developAreas: "Areas to Develop",
        developDesc: "Top performers have a higher level in these areas",
        leverageStrengths: "Strengths to Leverage",
        leverageDesc: "You're already at or above top performer level",
        talentGaps: "Talent Opportunities",
        talentGapsDesc: "Talents where top performers stand out more",
        talentStrengths: "Outstanding Talents",
        talentStrengthsDesc: "Talents where you match the best",
        shouldIncrease: "You should increase",
        shouldMaintain: "Maintain your level in",
        youAre: "You're at",
        topPerformersAre: "Top performers are at",
        suggestedAction: "Suggested action",
        noSuggestions: "Need top performer data to generate suggestions",
        mainCommunity: "My main community",
      },
    };
    return t[lang] || t.es;
  }, [lang]);

  // =========================================================
  // 📦 Load data
  // =========================================================
  useEffect(() => {
    loadBenchmark();
  }, [compareWith, selectedOutcome, selectedBenchmarkId, selectedCommunityId]);

  async function loadBenchmark() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        compareWith,
        outcome: selectedOutcome,
        ...(selectedBenchmarkId && { benchmarkId: selectedBenchmarkId }),
        ...(selectedCommunityId && { communityId: selectedCommunityId }),
      });
      const res = await fetch(`/api/user/benchmark?${params}`, { cache: "no-store" });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error);
        if (json.noData) setData({ noData: true });
      } else {
        setData(json);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // 📊 Radar chart data
  // =========================================================
  const radarData = useMemo(() => {
    if (!data?.competencies) return [];
    const competencies = ["K", "C", "G", "EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"];
    return competencies
      .map((key) => {
        const comp = data.competencies.find((c: any) => c.key === key);
        const stats = data.benchmarkStats?.[key];
        const tp = data.topPerformerComparison?.find((t: any) => t.key === key);
        const label = data.labels?.competencies?.[key]?.[lang] || key;
        return {
          key,
          label: label.length > 12 ? label.substring(0, 10) + "..." : label,
          fullLabel: label,
          you: comp?.score || 0,
          average: stats?.mean || 50,
          top: tp?.topPerformerAvg || stats?.p90 || 70,
        };
      })
      .filter((d) => d.you > 0);
  }, [data, lang]);

  // =========================================================
  // 📊 Talent bar data (all talents)
  // =========================================================
  const allTalentData = useMemo(() => {
    if (!data?.talents) return [];
    return data.talents
      .filter((t: any) => t.score != null)
      .map((t: any) => ({
        key: t.key,
        label: data.labels?.talents?.[t.key]?.[lang] || t.key,
        score: t.score,
        benchmarkMean: data.benchmarkStats?.[t.key]?.mean || t.benchmarkMean || 0,
        diff: t.score - (data.benchmarkStats?.[t.key]?.mean || t.benchmarkMean || 0),
      }))
      .sort((a: any, b: any) => b.score - a.score);
  }, [data, lang]);

  // =========================================================
  // 💡 Correlation-based suggestions
  // =========================================================
  const suggestions = useMemo(() => {
    if (!data?.topPerformerComparison || !data?.competencies) {
      return { develop: [], leverage: [], talentGaps: [], talentStrengths: [] };
    }

    // Competency suggestions
    const develop: any[] = [];
    const leverage: any[] = [];

    for (const comp of data.topPerformerComparison) {
      const label = data.labels?.competencies?.[comp.key]?.[lang] || comp.key;
      const userLevel = getLevel(comp.userScore);
      const topLevel = getLevel(comp.topPerformerAvg);
      const gap = comp.gap; // positive = user is better, negative = top is better

      if (gap < -5) {
        // User is significantly below top performers
        develop.push({
          key: comp.key,
          label,
          userScore: comp.userScore,
          topScore: comp.topPerformerAvg,
          userLevel,
          topLevel,
          gap: Math.abs(gap),
          pursuit: PURSUIT_MAP[comp.key] || "K",
        });
      } else if (gap >= -2) {
        // User is at or above top performer level
        leverage.push({
          key: comp.key,
          label,
          userScore: comp.userScore,
          topScore: comp.topPerformerAvg,
          userLevel,
          topLevel,
          gap,
          pursuit: PURSUIT_MAP[comp.key] || "K",
        });
      }
    }

    // Talent suggestions based on top performer talent profile
    const talentGaps: any[] = [];
    const talentStrengths: any[] = [];

    const topTalents = data.topPerformerProfile?.topTalents || [];
    for (const tp of topTalents) {
      const tKey = tp.key;
      const userTalent = data.talents?.find((t: any) => t.key === tKey);
      const label = data.labels?.talents?.[tKey]?.[lang] || tp.label || tKey;
      if (!userTalent?.score) continue;

      const gap = userTalent.score - (tp.avg || 0);
      const userLevel = getLevel(userTalent.score);
      const topLevel = getLevel(tp.avg || 0);

      if (gap < -5) {
        talentGaps.push({ key: tKey, label, userScore: userTalent.score, topScore: tp.avg, userLevel, topLevel, gap: Math.abs(gap) });
      } else {
        talentStrengths.push({ key: tKey, label, userScore: userTalent.score, topScore: tp.avg, userLevel, topLevel, gap });
      }
    }

    // Sort: biggest gaps first for develop, biggest advantage first for leverage
    develop.sort((a, b) => b.gap - a.gap);
    leverage.sort((a, b) => b.gap - a.gap);
    talentGaps.sort((a, b) => b.gap - a.gap);

    return { develop: develop.slice(0, 5), leverage: leverage.slice(0, 5), talentGaps: talentGaps.slice(0, 5), talentStrengths: talentStrengths.slice(0, 5) };
  }, [data, lang]);

  const selectedOutcomeLabel = OUTCOMES.find((o) => o.value === selectedOutcome);
  const outcomeLabel = selectedOutcomeLabel
    ? lang === "es" ? selectedOutcomeLabel.labelEs : selectedOutcomeLabel.labelEn
    : selectedOutcome;

  // =========================================================
  // 🎨 Render
  // =========================================================
  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--rowi-g2)] mx-auto" />
          <p className="mt-2 text-gray-500">{tr.loading}</p>
        </div>
      </main>
    );
  }

  if (data?.noData) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--rowi-g1)]/20 to-[var(--rowi-g2)]/20 flex items-center justify-center mx-auto mb-6">
            <BarChart3 className="w-10 h-10 text-[var(--rowi-g2)]" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{tr.noData}</h2>
          <p className="text-gray-500">{tr.noDataDesc}</p>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[var(--rowi-g1)]/10 to-[var(--rowi-g2)]/10 border border-[var(--rowi-g1)]/20">
            <BarChart3 className="w-4 h-4 text-[var(--rowi-g2)]" />
            <span className="text-sm font-medium text-[var(--rowi-g2)]">{tr.subtitle}</span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] bg-clip-text text-transparent">
            {tr.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-lg mx-auto">{tr.description}</p>
        </motion.header>

        {/* Compare With toggle */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-wrap items-center justify-center gap-4">
          <div className="flex items-center gap-2 p-1 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800">
            {(["rowiverse", "community"] as CompareWith[]).map((opt) => (
              <button
                key={opt}
                onClick={() => setCompareWith(opt)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  compareWith === opt
                    ? "bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white shadow-md"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800"
                }`}
              >
                {opt === "rowiverse" ? <Globe className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                {tr[opt]}
              </button>
            ))}
          </div>

          {compareWith === "community" && data?.availableCommunities?.length > 1 && (
            <select
              value={selectedCommunityId || ""}
              onChange={(e) => setSelectedCommunityId(e.target.value || null)}
              className="px-4 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-sm font-medium text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-[var(--rowi-g2)] focus:border-transparent outline-none"
            >
              <option value="">{tr.mainCommunity}</option>
              {data.availableCommunities.map((c: { id: string; name: string }) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
        </motion.div>

        {/* Outcome selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm p-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <Compass className="w-5 h-5 text-[var(--rowi-g2)]" />
            <h3 className="font-semibold text-gray-900 dark:text-white">{tr.outcome}</h3>
            <span className="text-sm text-gray-500">— {tr.outcomeDesc}</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
            {OUTCOMES.map((o) => {
              const Icon = o.icon;
              const isSelected = selectedOutcome === o.value;
              return (
                <button
                  key={o.value}
                  onClick={() => setSelectedOutcome(o.value)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                    isSelected
                      ? "border-[var(--rowi-g2)] bg-[var(--rowi-g2)]/10 ring-2 ring-[var(--rowi-g2)]/20"
                      : "border-gray-200 dark:border-zinc-700 hover:border-[var(--rowi-g2)]/50 hover:bg-gray-50 dark:hover:bg-zinc-800"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isSelected ? "text-[var(--rowi-g2)]" : "text-gray-500 dark:text-gray-400"}`} />
                  <span className={`text-xs font-medium text-center leading-tight ${isSelected ? "text-[var(--rowi-g2)]" : "text-gray-600 dark:text-gray-400"}`}>
                    {lang === "es" ? o.labelEs : o.labelEn}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Benchmark info */}
        {data?.benchmark && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {tr.benchmarkN}: {data.benchmark.totalRows?.toLocaleString()} {tr.people}
            </span>
            <span className="w-1 h-1 rounded-full bg-gray-300" />
            <span>{data.benchmark.name}</span>
          </motion.div>
        )}

        {/* Main content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left column */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="space-y-6">
            {/* Top 3 Competencies */}
            <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-zinc-800 bg-gradient-to-r from-[var(--rowi-g1)]/5 to-[var(--rowi-g2)]/5">
                <h2 className="font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  {tr.top3Competencies}
                </h2>
              </div>
              <div className="p-4 space-y-4">
                {data?.top3Competencies?.map((comp: any, idx: number) => {
                  const pursuit = PURSUIT_MAP[comp.key] || "K";
                  const pursuitColor = PURSUIT_COLORS[pursuit];
                  const label = data.labels?.competencies?.[comp.key]?.[lang] || comp.key;
                  const level = getLevel(comp.score);
                  const avgLevel = getLevel(comp.benchmarkMean);
                  return (
                    <div key={comp.key} className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: pursuitColor }}>
                          {idx + 1}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white flex-1">{label}</span>
                      </div>
                      <div className="flex items-center gap-2 ml-11">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-white" style={{ backgroundColor: level.color }}>
                          <span>{level.emoji}</span>
                          <span>{lang === "es" ? level.es : level.en}</span>
                        </span>
                        <span className="text-xs text-gray-500">
                          vs {tr.average}: {lang === "es" ? avgLevel.es : avgLevel.en}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top 5 Talents */}
            <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-zinc-800 bg-gradient-to-r from-purple-500/5 to-pink-500/5">
                <h2 className="font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
                  <Brain className="w-5 h-5 text-purple-500" />
                  {tr.top5Talents}
                </h2>
              </div>
              <div className="p-4 space-y-3">
                {data?.top5Talents?.map((talent: any, idx: number) => {
                  const label = data.labels?.talents?.[talent.key]?.[lang] || talent.key;
                  const level = getLevel(talent.score);
                  const avgMean = data.benchmarkStats?.[talent.key]?.mean || talent.benchmarkMean;
                  const avgLevel = avgMean ? getLevel(avgMean) : null;
                  return (
                    <div key={talent.key} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {idx < 3 && <Star className="w-3 h-3 text-amber-500" />}
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
                        </div>
                        {avgLevel && (
                          <span className="text-[10px] text-gray-400 ml-5">
                            vs {tr.average}: {lang === "es" ? avgLevel.es : avgLevel.en}
                          </span>
                        )}
                      </div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-white whitespace-nowrap" style={{ backgroundColor: level.color }}>
                        <span>{level.emoji}</span>
                        <span>{lang === "es" ? level.es : level.en}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Center + Right — Radar Chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2 space-y-6">
            {/* Radar Chart */}
            <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
                <h2 className="font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
                  <BarChart3 className="w-5 h-5 text-[var(--rowi-g2)]" />
                  {tr.competencyComparison}
                </h2>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[var(--rowi-g2)]" />{tr.radarYou}</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-gray-400" />{tr.radarAvg}</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-500" />{tr.radarTop}</span>
                </div>
              </div>
              <div className="p-4">
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                      <PolarGrid stroke="#e5e7eb" />
                      <PolarAngleAxis dataKey="label" tick={{ fontSize: 11, fill: "#6b7280" }} />
                      <PolarRadiusAxis angle={90} domain={[0, 135]} tick={false} axisLine={false} />
                      <Radar name={tr.radarTop} dataKey="top" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} strokeWidth={1} strokeDasharray="4 4" />
                      <Radar name={tr.radarAvg} dataKey="average" stroke="#9ca3af" fill="#9ca3af" fillOpacity={0.1} strokeWidth={1} />
                      <Radar name={tr.radarYou} dataKey="you" stroke="var(--rowi-g2)" fill="var(--rowi-g2)" fillOpacity={0.3} strokeWidth={2} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const item = payload[0]?.payload;
                          const youLevel = getLevel(item?.you || 0);
                          const avgLevel = getLevel(item?.average || 0);
                          const topLevel = getLevel(item?.top || 0);
                          return (
                            <div className="bg-white dark:bg-zinc-800 p-3 rounded-xl shadow-lg border border-gray-200 dark:border-zinc-700 min-w-[200px]">
                              <p className="font-semibold text-gray-900 dark:text-white mb-3">{item?.fullLabel}</p>
                              <div className="space-y-2">
                                {[
                                  { label: tr.radarYou, level: youLevel },
                                  { label: tr.radarAvg, level: avgLevel },
                                  { label: tr.radarTop, level: topLevel },
                                ].map((row) => (
                                  <div key={row.label} className="flex items-center justify-between gap-3">
                                    <span className="text-gray-500 text-sm">{row.label}:</span>
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: row.level.color }}>
                                      {row.level.emoji} {lang === "es" ? row.level.es : row.level.en}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Pursuits Legend */}
            <div className="flex items-center justify-center gap-6">
              {[
                { key: "K", label: tr.pursuitsK, color: PURSUIT_COLORS.K },
                { key: "C", label: tr.pursuitsC, color: PURSUIT_COLORS.C },
                { key: "G", label: tr.pursuitsG, color: PURSUIT_COLORS.G },
              ].map((p) => (
                <div key={p.key} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{p.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ═══════════════════════════════════════════════════════
           🎯 TALENT COMPARISON — Full bar chart
        ═══════════════════════════════════════════════════════ */}
        {allTalentData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm overflow-hidden"
          >
            <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h2 className="font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  {tr.talentComparison}
                </h2>
                <p className="text-xs text-gray-500 mt-1">{tr.talentComparisonDesc}</p>
              </div>
              {allTalentData.length > 8 && (
                <button
                  onClick={() => setShowAllTalents(!showAllTalents)}
                  className="flex items-center gap-1 text-sm text-[var(--rowi-g2)] hover:underline"
                >
                  {showAllTalents ? tr.showLess : tr.showAll}
                  <ChevronDown className={`w-4 h-4 transition-transform ${showAllTalents ? "rotate-180" : ""}`} />
                </button>
              )}
            </div>
            <div className="p-4">
              <div className="space-y-3">
                {(showAllTalents ? allTalentData : allTalentData.slice(0, 8)).map((talent: any) => {
                  const level = getLevel(talent.score);
                  const avgLevel = talent.benchmarkMean > 0 ? getLevel(talent.benchmarkMean) : null;
                  const pct = Math.min(100, Math.round((talent.score / 135) * 100));
                  const avgPct = talent.benchmarkMean > 0 ? Math.min(100, Math.round((talent.benchmarkMean / 135) * 100)) : 0;
                  const diff = talent.diff;

                  return (
                    <div key={talent.key} className="flex items-center gap-3">
                      <div className="w-32 sm:w-40 text-sm font-medium text-gray-700 dark:text-gray-300 truncate shrink-0">{talent.label}</div>
                      <div className="flex-1 relative">
                        {/* Background bar */}
                        <div className="h-6 rounded-full bg-gray-100 dark:bg-zinc-800 relative overflow-hidden">
                          {/* Benchmark average line */}
                          {avgPct > 0 && (
                            <div
                              className="absolute top-0 bottom-0 w-0.5 bg-gray-400 dark:bg-gray-500 z-10"
                              style={{ left: `${avgPct}%` }}
                              title={`${tr.average}: ${Math.round(talent.benchmarkMean)}`}
                            />
                          )}
                          {/* User bar */}
                          <div
                            className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                            style={{ width: `${pct}%`, backgroundColor: level.color }}
                          >
                            <span className="text-[10px] text-white font-medium">
                              {lang === "es" ? level.es : level.en}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="w-14 text-right shrink-0">
                        {diff !== 0 && talent.benchmarkMean > 0 ? (
                          <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${diff > 0 ? "text-green-500" : "text-red-400"}`}>
                            {diff > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                            {Math.abs(Math.round(diff))}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400"><Minus className="w-3 h-3 inline" /></span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-gray-200 dark:border-zinc-800 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-8 h-2 rounded-full bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)]" />
                  {tr.radarYou}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-0.5 h-4 bg-gray-400" />
                  {tr.radarAvg}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════
           💡 SUGGESTIONS — Correlation-based (no AI)
        ═══════════════════════════════════════════════════════ */}
        {(suggestions.develop.length > 0 || suggestions.leverage.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                {tr.suggestions}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {tr.suggestionsDesc} <strong>{outcomeLabel}</strong>
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Develop areas */}
              {suggestions.develop.length > 0 && (
                <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 overflow-hidden">
                  <div className="p-4 border-b border-red-200 dark:border-red-900/50">
                    <h3 className="font-semibold flex items-center gap-2 text-red-700 dark:text-red-400">
                      <ArrowUp className="w-5 h-5" />
                      {tr.developAreas}
                    </h3>
                    <p className="text-xs text-red-500/70 mt-1">{tr.developDesc}</p>
                  </div>
                  <div className="p-4 space-y-4">
                    {suggestions.develop.map((item) => (
                      <div key={item.key} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900 dark:text-white">{item.label}</span>
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PURSUIT_COLORS[item.pursuit] }} />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: item.userLevel.color }}>
                            {item.userLevel.emoji} {lang === "es" ? item.userLevel.es : item.userLevel.en}
                          </span>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: item.topLevel.color }}>
                            {item.topLevel.emoji} {lang === "es" ? item.topLevel.es : item.topLevel.en}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {tr.shouldIncrease} <strong>{item.label}</strong>. {tr.youAre} <em>{lang === "es" ? item.userLevel.es : item.userLevel.en}</em>, {tr.topPerformersAre} <em>{lang === "es" ? item.topLevel.es : item.topLevel.en}</em>.
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Leverage strengths */}
              {suggestions.leverage.length > 0 && (
                <div className="rounded-2xl border border-green-200 dark:border-green-900/50 bg-green-50/50 dark:bg-green-950/20 overflow-hidden">
                  <div className="p-4 border-b border-green-200 dark:border-green-900/50">
                    <h3 className="font-semibold flex items-center gap-2 text-green-700 dark:text-green-400">
                      <CheckCircle className="w-5 h-5" />
                      {tr.leverageStrengths}
                    </h3>
                    <p className="text-xs text-green-500/70 mt-1">{tr.leverageDesc}</p>
                  </div>
                  <div className="p-4 space-y-4">
                    {suggestions.leverage.map((item) => (
                      <div key={item.key} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900 dark:text-white">{item.label}</span>
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PURSUIT_COLORS[item.pursuit] }} />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: item.userLevel.color }}>
                            {item.userLevel.emoji} {lang === "es" ? item.userLevel.es : item.userLevel.en}
                          </span>
                          {item.gap > 0 && (
                            <span className="text-xs text-green-500 font-medium">+{Math.round(item.gap)}</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {tr.shouldMaintain} <strong>{item.label}</strong>. {tr.youAre} <em>{lang === "es" ? item.userLevel.es : item.userLevel.en}</em>.
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Talent-level suggestions */}
            {(suggestions.talentGaps.length > 0 || suggestions.talentStrengths.length > 0) && (
              <div className="grid lg:grid-cols-2 gap-6">
                {suggestions.talentGaps.length > 0 && (
                  <div className="rounded-2xl border border-orange-200 dark:border-orange-900/50 bg-orange-50/50 dark:bg-orange-950/20 overflow-hidden">
                    <div className="p-4 border-b border-orange-200 dark:border-orange-900/50">
                      <h3 className="font-semibold flex items-center gap-2 text-orange-700 dark:text-orange-400">
                        <Sparkles className="w-5 h-5" />
                        {tr.talentGaps}
                      </h3>
                      <p className="text-xs text-orange-500/70 mt-1">{tr.talentGapsDesc}</p>
                    </div>
                    <div className="p-4 space-y-3">
                      {suggestions.talentGaps.map((item) => (
                        <div key={item.key} className="flex items-center justify-between">
                          <div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium text-white" style={{ backgroundColor: item.userLevel.color }}>
                                {item.userLevel.emoji} {lang === "es" ? item.userLevel.es : item.userLevel.en}
                              </span>
                              <ChevronRight className="w-3 h-3 text-gray-400" />
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium text-white" style={{ backgroundColor: item.topLevel.color }}>
                                {item.topLevel.emoji} {lang === "es" ? item.topLevel.es : item.topLevel.en}
                              </span>
                            </div>
                          </div>
                          <span className="text-xs text-orange-500 font-medium">-{Math.round(item.gap)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {suggestions.talentStrengths.length > 0 && (
                  <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 overflow-hidden">
                    <div className="p-4 border-b border-emerald-200 dark:border-emerald-900/50">
                      <h3 className="font-semibold flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                        <Award className="w-5 h-5" />
                        {tr.talentStrengths}
                      </h3>
                      <p className="text-xs text-emerald-500/70 mt-1">{tr.talentStrengthsDesc}</p>
                    </div>
                    <div className="p-4 space-y-3">
                      {suggestions.talentStrengths.map((item) => (
                        <div key={item.key} className="flex items-center justify-between">
                          <div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium text-white" style={{ backgroundColor: item.userLevel.color }}>
                                {item.userLevel.emoji} {lang === "es" ? item.userLevel.es : item.userLevel.en}
                              </span>
                              {item.gap > 0 && <span className="text-xs text-emerald-500 font-medium">+{Math.round(item.gap)}</span>}
                            </div>
                          </div>
                          <Star className="w-4 h-4 text-amber-500" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* SEI Levels Legend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm p-4"
        >
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{tr.levelsLegend}</h3>
          <div className="flex flex-wrap gap-2">
            {SEI_LEVELS.map((level) => (
              <div key={level.key} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: level.color }}>
                <span>{level.emoji}</span>
                <span>{lang === "es" ? level.es : level.en}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </main>
  );
}
