"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
*/

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

// Todos los 12 outcomes del modelo Six Seconds
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

// Niveles SEI (Six Seconds) - Sin mostrar números, solo niveles
const SEI_LEVELS = [
  { key: "challenge", min: 65, max: 81, color: "#ef4444", emoji: "🧩", es: "Desafío", en: "Challenge" },
  { key: "emerging", min: 82, max: 91, color: "#f59e0b", emoji: "🌱", es: "Emergente", en: "Emerging" },
  { key: "functional", min: 92, max: 107, color: "#3b82f6", emoji: "🧠", es: "Funcional", en: "Functional" },
  { key: "skilled", min: 108, max: 117, color: "#8b5cf6", emoji: "🎯", es: "Diestro", en: "Skilled" },
  { key: "expert", min: 118, max: 135, color: "#10b981", emoji: "🌟", es: "Experto", en: "Expert" },
];

// Función para obtener el nivel SEI según el puntaje
function getLevel(score: number) {
  return SEI_LEVELS.find((l) => score >= l.min && score <= l.max) || SEI_LEVELS[0];
}

export default function BenchmarkPage() {
  const { lang } = useI18n();

  // Estados
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [compareWith, setCompareWith] = useState<CompareWith>("rowiverse");
  const [selectedOutcome, setSelectedOutcome] = useState<Outcome>("effectiveness");
  const [selectedBenchmarkId, setSelectedBenchmarkId] = useState<string | null>(null);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Traducciones
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
        rowiverseDesc: "Comparación con toda la comunidad global",
        communityDesc: "Comparación con tu comunidad de trabajo",
        benchmarkDesc: "Selecciona un benchmark específico",
        yourStrengths: "Tus Fortalezas",
        top3Competencies: "Top 3 Competencias SEI",
        top5Talents: "Top 5 Talentos",
        vsTopPerformers: "vs Top Performers",
        competencyComparison: "Comparación de Competencias",
        talentProfile: "Perfil de Talentos",
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
        filters: "Filtros",
        allRoles: "Todos los roles",
        allSectors: "Todos los sectores",
        percentile: "Percentil",
        insight: "Insight",
        insightStrength: "Esta es una de tus fortalezas clave",
        insightDevelop: "Área con potencial de desarrollo",
        pursuitsK: "Conocerse",
        pursuitsC: "Elegirse",
        pursuitsG: "Darse",
        radarYou: "Tú",
        radarAvg: "Promedio",
        radarTop: "Top 10%",
        levelsLegend: "Niveles SEI",
      },
      en: {
        title: "Benchmark",
        subtitle: "Compare your SEI profile",
        description: "Discover how you compare with others and leverage your strengths",
        compareWith: "Compare with",
        rowiverse: "Global Rowiverse",
        community: "My Community",
        benchmark: "Specific Benchmark",
        rowiverseDesc: "Comparison with the entire global community",
        communityDesc: "Comparison with your work community",
        benchmarkDesc: "Select a specific benchmark",
        yourStrengths: "Your Strengths",
        top3Competencies: "Top 3 SEI Competencies",
        top5Talents: "Top 5 Talents",
        vsTopPerformers: "vs Top Performers",
        competencyComparison: "Competency Comparison",
        talentProfile: "Talent Profile",
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
        filters: "Filters",
        allRoles: "All roles",
        allSectors: "All sectors",
        percentile: "Percentile",
        insight: "Insight",
        insightStrength: "This is one of your key strengths",
        insightDevelop: "Area with development potential",
        pursuitsK: "Know Yourself",
        pursuitsC: "Choose Yourself",
        pursuitsG: "Give Yourself",
        radarYou: "You",
        radarAvg: "Average",
        radarTop: "Top 10%",
        levelsLegend: "SEI Levels",
      },
    };
    return t[lang] || t.es;
  }, [lang]);

  // Cargar datos
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

  // Preparar datos para radar chart
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

  // Preparar datos para bar chart de talentos
  const talentBarData = useMemo(() => {
    if (!data?.top5Talents) return [];
    return data.top5Talents.map((t: any) => ({
      key: t.key,
      label: data.labels?.talents?.[t.key]?.[lang] || t.key,
      score: t.score,
      benchmarkMean: t.benchmarkMean,
    }));
  }, [data, lang]);

  // Render loading
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

  // Render no data
  if (data?.noData) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
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
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-3"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[var(--rowi-g1)]/10 to-[var(--rowi-g2)]/10 border border-[var(--rowi-g1)]/20">
            <BarChart3 className="w-4 h-4 text-[var(--rowi-g2)]" />
            <span className="text-sm font-medium text-[var(--rowi-g2)]">{tr.subtitle}</span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] bg-clip-text text-transparent">
            {tr.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-lg mx-auto">{tr.description}</p>
        </motion.header>

        {/* Controles - Compare With */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          <div className="flex flex-wrap items-center gap-3">
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

            {/* Selector de comunidad cuando se elige "community" */}
            {compareWith === "community" && data?.availableCommunities?.length > 1 && (
              <select
                value={selectedCommunityId || ""}
                onChange={(e) => setSelectedCommunityId(e.target.value || null)}
                className="px-4 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-sm font-medium text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-[var(--rowi-g2)] focus:border-transparent outline-none"
              >
                <option value="">{lang === "es" ? "Mi comunidad principal" : "My main community"}</option>
                {data.availableCommunities.map((c: { id: string; name: string }) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </motion.div>

        {/* Outcome selector - Grid de todos los outcomes */}
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
                  <Icon
                    className={`w-5 h-5 ${
                      isSelected ? "text-[var(--rowi-g2)]" : "text-gray-500 dark:text-gray-400"
                    }`}
                  />
                  <span
                    className={`text-xs font-medium text-center leading-tight ${
                      isSelected ? "text-[var(--rowi-g2)]" : "text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {lang === "es" ? o.labelEs : o.labelEn}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Benchmark info */}
        {data?.benchmark && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-4 text-sm text-gray-500"
          >
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
          {/* Left column - Fortalezas */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Top 3 Competencias */}
            <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-zinc-800 bg-gradient-to-r from-[var(--rowi-g1)]/5 to-[var(--rowi-g2)]/5">
                <h2 className="font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  {tr.top3Competencies}
                </h2>
              </div>
              <div className="p-4 space-y-4">
                {data?.top3Competencies?.map((comp: any, idx: number) => {
                  const pursuit = comp.key === "K" || comp.key === "EL" || comp.key === "RP" ? "K" :
                                 comp.key === "C" || comp.key === "ACT" || comp.key === "NE" || comp.key === "IM" ? "C" : "G";
                  const pursuitColor = PURSUIT_COLORS[pursuit];
                  const label = data.labels?.competencies?.[comp.key]?.[lang] || comp.key;
                  const level = getLevel(comp.score);
                  const avgLevel = getLevel(comp.benchmarkMean);
                  return (
                    <div key={comp.key} className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                          style={{ backgroundColor: pursuitColor }}
                        >
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {label}
                          </span>
                        </div>
                      </div>
                      {/* Nivel del usuario */}
                      <div className="flex items-center gap-2 ml-11">
                        <span
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-white"
                          style={{ backgroundColor: level.color }}
                        >
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

            {/* Top 5 Talentos */}
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
                  return (
                    <div key={talent.key} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {idx < 3 && <Star className="w-3 h-3 text-amber-500" />}
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {label}
                          </span>
                        </div>
                      </div>
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-white whitespace-nowrap"
                        style={{ backgroundColor: level.color }}
                      >
                        <span>{level.emoji}</span>
                        <span>{lang === "es" ? level.es : level.en}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Center column - Radar Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
                <h2 className="font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
                  <BarChart3 className="w-5 h-5 text-[var(--rowi-g2)]" />
                  {tr.competencyComparison}
                </h2>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-[var(--rowi-g2)]" />
                    {tr.radarYou}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-gray-400" />
                    {tr.radarAvg}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-amber-500" />
                    {tr.radarTop}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                      <PolarGrid stroke="#e5e7eb" />
                      <PolarAngleAxis
                        dataKey="label"
                        tick={{ fontSize: 11, fill: "#6b7280" }}
                      />
                      <PolarRadiusAxis
                        angle={90}
                        domain={[0, 135]}
                        tick={false}
                        axisLine={false}
                      />
                      <Radar
                        name={tr.radarTop}
                        dataKey="top"
                        stroke="#f59e0b"
                        fill="#f59e0b"
                        fillOpacity={0.1}
                        strokeWidth={1}
                        strokeDasharray="4 4"
                      />
                      <Radar
                        name={tr.radarAvg}
                        dataKey="average"
                        stroke="#9ca3af"
                        fill="#9ca3af"
                        fillOpacity={0.1}
                        strokeWidth={1}
                      />
                      <Radar
                        name={tr.radarYou}
                        dataKey="you"
                        stroke="var(--rowi-g2)"
                        fill="var(--rowi-g2)"
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const item = payload[0]?.payload;
                          const youLevel = getLevel(item?.you || 0);
                          const avgLevel = getLevel(item?.average || 0);
                          const topLevel = getLevel(item?.top || 0);
                          return (
                            <div className="bg-white dark:bg-zinc-800 p-3 rounded-xl shadow-lg border border-gray-200 dark:border-zinc-700 min-w-[200px]">
                              <p className="font-semibold text-gray-900 dark:text-white mb-3">
                                {item?.fullLabel}
                              </p>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between gap-3">
                                  <span className="text-gray-500 text-sm">{tr.radarYou}:</span>
                                  <span
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                                    style={{ backgroundColor: youLevel.color }}
                                  >
                                    {youLevel.emoji} {lang === "es" ? youLevel.es : youLevel.en}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                  <span className="text-gray-500 text-sm">{tr.radarAvg}:</span>
                                  <span
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                                    style={{ backgroundColor: avgLevel.color }}
                                  >
                                    {avgLevel.emoji} {lang === "es" ? avgLevel.es : avgLevel.en}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                  <span className="text-gray-500 text-sm">{tr.radarTop}:</span>
                                  <span
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                                    style={{ backgroundColor: topLevel.color }}
                                  >
                                    {topLevel.emoji} {lang === "es" ? topLevel.es : topLevel.en}
                                  </span>
                                </div>
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
            <div className="mt-4 flex items-center justify-center gap-6">
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

            {/* Leyenda de niveles SEI */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-6 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm p-4"
            >
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                {tr.levelsLegend}
              </h3>
              <div className="flex flex-wrap gap-2">
                {SEI_LEVELS.map((level) => (
                  <div
                    key={level.key}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: level.color }}
                  >
                    <span>{level.emoji}</span>
                    <span>{lang === "es" ? level.es : level.en}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
