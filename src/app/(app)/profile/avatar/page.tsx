"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";
import useSWR from "swr";
import { motion } from "framer-motion";
import { Sparkles, Brain, TreePine, TrendingUp, Award } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Configuracion de stages
const AVATAR_STAGES = {
  EGG: { emoji: "🥚", color: "#94a3b8" },
  HATCHING: { emoji: "🐣", color: "#fbbf24" },
  BABY: { emoji: "🐥", color: "#fb923c" },
  YOUNG: { emoji: "🦉", color: "#3b82f6" },
  ADULT: { emoji: "🦅", color: "#8b5cf6" },
  WISE: { emoji: "🪶", color: "#10b981" },
};

// Colores Six Seconds
const SIX_SECONDS_COLORS: Record<number, string> = {
  1: "#ef4444",
  2: "#f59e0b",
  3: "#3b82f6",
  4: "#8b5cf6",
  5: "#10b981",
};

// Traducciones
const translations = {
  es: {
    title: "Tu Rowi",
    subtitle: "Tu companero de viaje emocional",
    stage: "Etapa",
    nextStage: "Proxima etapa",
    maxLevel: "Has alcanzado el nivel maximo!",
    sixSecondsLevel: "Nivel Six Seconds",
    sixSecondsDesc: "Tu nivel de inteligencia emocional (SEI)",
    rowiLevel: "Nivel Rowi",
    rowiLevelDesc: "Tu nivel de engagement en la plataforma",
    evolution: "Evolucion",
    evolutionDesc: "Tu evolucion combina tu nivel Rowi (60%) y Six Seconds (40%)",
    hatchProgress: "Progreso de eclosion",
    hatchReady: "Tu huevo esta listo para eclosionar!",
    hatchWaiting: "Sigue interactuando para que tu huevo eclosione",
    daysActive: "dias activo",
    totalXP: "XP Total",
    loading: "Cargando tu Rowi...",
    stages: {
      EGG: "Huevito",
      HATCHING: "Eclosionando",
      BABY: "Bebe",
      YOUNG: "Joven",
      ADULT: "Adulto",
      WISE: "Sabio",
    },
    sixSecondsNames: {
      1: "Desafio",
      2: "Emergente",
      3: "Funcional",
      4: "Diestro",
      5: "Experto",
    },
    rowiLevelNames: {
      1: "Semilla",
      2: "Brote",
      3: "Planta",
      4: "Arbol Joven",
      5: "Arbol",
      6: "Arbol Fuerte",
      7: "Arbol Sabio",
      8: "Bosque",
      9: "Guardian",
      10: "Ancestro",
    },
  },
  en: {
    title: "Your Rowi",
    subtitle: "Your emotional journey companion",
    stage: "Stage",
    nextStage: "Next stage",
    maxLevel: "You have reached the maximum level!",
    sixSecondsLevel: "Six Seconds Level",
    sixSecondsDesc: "Your emotional intelligence level (SEI)",
    rowiLevel: "Rowi Level",
    rowiLevelDesc: "Your platform engagement level",
    evolution: "Evolution",
    evolutionDesc: "Your evolution combines your Rowi level (60%) and Six Seconds level (40%)",
    hatchProgress: "Hatch progress",
    hatchReady: "Your egg is ready to hatch!",
    hatchWaiting: "Keep interacting to hatch your egg",
    daysActive: "days active",
    totalXP: "Total XP",
    loading: "Loading your Rowi...",
    stages: {
      EGG: "Egg",
      HATCHING: "Hatching",
      BABY: "Baby",
      YOUNG: "Young",
      ADULT: "Adult",
      WISE: "Wise",
    },
    sixSecondsNames: {
      1: "Challenge",
      2: "Emerging",
      3: "Functional",
      4: "Skilled",
      5: "Expert",
    },
    rowiLevelNames: {
      1: "Seed",
      2: "Sprout",
      3: "Plant",
      4: "Young Tree",
      5: "Tree",
      6: "Strong Tree",
      7: "Wise Tree",
      8: "Forest",
      9: "Guardian",
      10: "Ancestor",
    },
  },
};

export default function AvatarPage() {
  const { lang } = useI18n();
  const t = translations[lang as keyof typeof translations] || translations.es;

  const { data, isLoading } = useSWR("/api/avatar", fetcher);
  const avatar = data?.data;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-bounce text-6xl mb-4">🥚</div>
          <p className="text-gray-500 dark:text-gray-400">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (!avatar) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Error loading avatar</p>
      </div>
    );
  }

  const stageConfig = AVATAR_STAGES[avatar.currentStage as keyof typeof AVATAR_STAGES];
  const stageName = t.stages[avatar.currentStage as keyof typeof t.stages];
  const sixSecondsName = t.sixSecondsNames[avatar.sixSecondsLevel as keyof typeof t.sixSecondsNames];
  const rowiLevelName = t.rowiLevelNames[avatar.rowiLevel as keyof typeof t.rowiLevelNames];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-950 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2">
            <Sparkles className="w-8 h-8 text-amber-500" />
            {t.title}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">{t.subtitle}</p>
        </div>

        {/* Avatar Principal */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-8 text-center"
        >
          {/* Avatar Grande */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="text-8xl mb-6"
          >
            {stageConfig.emoji}
          </motion.div>

          {/* Stage Name */}
          <h2
            className="text-2xl font-bold mb-2"
            style={{ color: stageConfig.color }}
          >
            {stageName}
          </h2>

          {/* Barra de progreso */}
          {!avatar.isHatched ? (
            <div className="max-w-md mx-auto mt-6">
              <div className="flex justify-between text-sm text-gray-500 mb-2">
                <span>{t.hatchProgress}</span>
                <span>{avatar.hatchProgress}%</span>
              </div>
              <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${avatar.hatchProgress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-amber-400 to-orange-500"
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {avatar.canHatchNow ? t.hatchReady : t.hatchWaiting}
              </p>
            </div>
          ) : (
            <div className="max-w-md mx-auto mt-6">
              <div className="flex justify-between text-sm text-gray-500 mb-2">
                <span>{t.evolution}</span>
                <span>{avatar.progressToNext}%</span>
              </div>
              <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${avatar.progressToNext}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full"
                  style={{ backgroundColor: stageConfig.color }}
                />
              </div>
              {avatar.nextStage ? (
                <p className="text-sm text-gray-500 mt-2">
                  {t.nextStage}: {AVATAR_STAGES[avatar.nextStage as keyof typeof AVATAR_STAGES]?.emoji}{" "}
                  {t.stages[avatar.nextStage as keyof typeof t.stages]}
                </p>
              ) : (
                <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-2 font-medium">
                  {t.maxLevel}
                </p>
              )}
            </div>
          )}
        </motion.div>

        {/* Niveles Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Six Seconds Level */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="p-3 rounded-xl"
                style={{ backgroundColor: `${SIX_SECONDS_COLORS[avatar.sixSecondsLevel]}20` }}
              >
                <Brain
                  className="w-6 h-6"
                  style={{ color: SIX_SECONDS_COLORS[avatar.sixSecondsLevel] }}
                />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {t.sixSecondsLevel}
                </h3>
                <p className="text-xs text-gray-500">{t.sixSecondsDesc}</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p
                  className="text-3xl font-bold"
                  style={{ color: SIX_SECONDS_COLORS[avatar.sixSecondsLevel] }}
                >
                  {avatar.sixSecondsLevelInfo?.emoji} {sixSecondsName}
                </p>
                <p className="text-sm text-gray-500">
                  Level {avatar.sixSecondsLevel} / 5
                </p>
              </div>
              <div
                className="h-16 w-16 rounded-full flex items-center justify-center text-2xl font-bold text-white"
                style={{ backgroundColor: SIX_SECONDS_COLORS[avatar.sixSecondsLevel] }}
              >
                L{avatar.sixSecondsLevel}
              </div>
            </div>
          </motion.div>

          {/* Rowi Level */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                <TreePine className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {t.rowiLevel}
                </h3>
                <p className="text-xs text-gray-500">{t.rowiLevelDesc}</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  🌱 {rowiLevelName}
                </p>
                <p className="text-sm text-gray-500">
                  Level {avatar.rowiLevel} / 10
                </p>
              </div>
              <div className="h-16 w-16 rounded-full flex items-center justify-center text-2xl font-bold text-white bg-emerald-500">
                L{avatar.rowiLevel}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg p-6"
        >
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Stats
          </h3>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-gray-50 dark:bg-zinc-700/50 rounded-xl">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {avatar.daysActive}
              </p>
              <p className="text-xs text-gray-500">{t.daysActive}</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-zinc-700/50 rounded-xl">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {avatar.totalXP}
              </p>
              <p className="text-xs text-gray-500">{t.totalXP}</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-zinc-700/50 rounded-xl">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {avatar.evolutionScore.toFixed(1)}
              </p>
              <p className="text-xs text-gray-500">Evolution Score</p>
            </div>
          </div>

          {/* Formula explicativa */}
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <Award className="w-4 h-4" />
              {t.evolutionDesc}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
