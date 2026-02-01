"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Brain, TreePine, TrendingUp, Award, Star, Heart, Target } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * 🥚 Avatar Page - Tu Rowi evoluciona contigo
 *
 * Usa las imágenes de /rowivectors/ basadas en el nivel SEI:
 * - Nivel 1 (Desafío) → Rowi-01.png - Huevo cerrado
 * - Nivel 2 (Emergente) → Rowi-02.png - Huevo agrietado
 * - Nivel 3 (Funcional) → Rowi-04.png - Rowi asomándose
 * - Nivel 4 (Diestro) → Rowi-05.png - Rowi joven
 * - Nivel 5 (Experto) → Rowi-06.png - Rowi adulto completo
 */

// Configuración de evolución basada en el STAGE del avatar (determinado por evolutionScore)
// evolutionScore = (rowiLevel * 0.6) + (sixSecondsLevel * 0.4)
const STAGE_CONFIG: Record<string, {
  image: string;
  name: { es: string; en: string };
  emoji: string;
  color: string;
  bgGradient: string;
  glowColor: string;
  particles: string[];
  description: { es: string; en: string };
}> = {
  EGG: {
    image: "/rowivectors/Rowi-01.png",
    name: { es: "Huevito", en: "Egg" },
    emoji: "🥚",
    color: "#94a3b8",
    bgGradient: "from-slate-100 to-gray-100 dark:from-slate-900/30 dark:to-gray-900/30",
    glowColor: "shadow-slate-500/30",
    particles: ["🥚", "✨", "💫"],
    description: { es: "Tu Rowi está incubando, esperando crecer contigo", en: "Your Rowi is incubating, waiting to grow with you" },
  },
  HATCHING: {
    image: "/rowivectors/Rowi-02.png",
    name: { es: "Eclosionando", en: "Hatching" },
    emoji: "🐣",
    color: "#fbbf24",
    bgGradient: "from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30",
    glowColor: "shadow-amber-500/30",
    particles: ["🐣", "🌱", "💫"],
    description: { es: "El huevo comienza a agrietarse", en: "The egg is starting to crack" },
  },
  BABY: {
    image: "/rowivectors/Rowi-04.png",
    name: { es: "Bebé", en: "Baby" },
    emoji: "🐥",
    color: "#fb923c",
    bgGradient: "from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30",
    glowColor: "shadow-orange-500/30",
    particles: ["🐥", "🧠", "✨"],
    description: { es: "Tu Rowi bebé recién nacido", en: "Your newborn baby Rowi" },
  },
  YOUNG: {
    image: "/rowivectors/Rowi-05.png",
    name: { es: "Joven", en: "Young" },
    emoji: "🦉",
    color: "#3b82f6",
    bgGradient: "from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30",
    glowColor: "shadow-blue-500/30",
    particles: ["🦉", "🎯", "💪"],
    description: { es: "Tu Rowi joven y curioso", en: "Your young and curious Rowi" },
  },
  ADULT: {
    image: "/rowivectors/Rowi-06.png",
    name: { es: "Adulto", en: "Adult" },
    emoji: "🦅",
    color: "#8b5cf6",
    bgGradient: "from-purple-100 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30",
    glowColor: "shadow-purple-500/30",
    particles: ["🦅", "🌟", "👑"],
    description: { es: "Tu Rowi adulto y equilibrado", en: "Your adult and balanced Rowi" },
  },
  WISE: {
    image: "/rowivectors/Rowi-06.png",
    name: { es: "Sabio", en: "Wise" },
    emoji: "🪶",
    color: "#10b981",
    bgGradient: "from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30",
    glowColor: "shadow-emerald-500/30",
    particles: ["🪶", "🌟", "👑"],
    description: { es: "Tu Rowi sabio y maestro", en: "Your wise master Rowi" },
  },
};

// Traducciones
const translations = {
  es: {
    title: "Tu Rowi",
    subtitle: "Tu compañero de viaje emocional",
    sixSecondsLevel: "Nivel Six Seconds",
    sixSecondsDesc: "Tu nivel de inteligencia emocional (SEI)",
    rowiLevel: "Nivel Rowi",
    rowiLevelDesc: "Tu nivel de engagement en la plataforma",
    evolution: "Evolución",
    evolutionDesc: "Tu evolución combina tu nivel Rowi (60%) y Six Seconds (40%)",
    nextStage: "Próxima etapa",
    maxLevel: "¡Has alcanzado el nivel máximo!",
    daysActive: "días activo",
    totalXP: "XP Total",
    loading: "Cargando tu Rowi...",
    stats: "Estadísticas",
    rowiLevelNames: {
      1: "Semilla", 2: "Brote", 3: "Planta", 4: "Árbol Joven", 5: "Árbol",
      6: "Árbol Fuerte", 7: "Árbol Sabio", 8: "Bosque", 9: "Guardián", 10: "Ancestro",
    },
  },
  en: {
    title: "Your Rowi",
    subtitle: "Your emotional journey companion",
    sixSecondsLevel: "Six Seconds Level",
    sixSecondsDesc: "Your emotional intelligence level (SEI)",
    rowiLevel: "Rowi Level",
    rowiLevelDesc: "Your platform engagement level",
    evolution: "Evolution",
    evolutionDesc: "Your evolution combines your Rowi level (60%) and Six Seconds level (40%)",
    nextStage: "Next stage",
    maxLevel: "You have reached the maximum level!",
    daysActive: "days active",
    totalXP: "Total XP",
    loading: "Loading your Rowi...",
    stats: "Statistics",
    rowiLevelNames: {
      1: "Seed", 2: "Sprout", 3: "Plant", 4: "Young Tree", 5: "Tree",
      6: "Strong Tree", 7: "Wise Tree", 8: "Forest", 9: "Guardian", 10: "Ancestor",
    },
  },
};

export default function AvatarPage() {
  const { lang } = useI18n();
  const t = translations[lang as keyof typeof translations] || translations.es;
  const { data: session, status } = useSession();

  // Solo fetch si hay sesión activa
  const isAuthenticated = status === "authenticated" && !!session?.user;
  const { data, isLoading } = useSWR(
    isAuthenticated ? "/api/avatar" : null,
    fetcher
  );
  const avatar = data?.data;

  // Mostrar loading mientras carga la sesión o el avatar
  if (status === "loading" || (isAuthenticated && isLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-950">
        <div className="text-center">
          <motion.div
            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Image
              src="/rowivectors/Rowi-01.png"
              alt="Loading Rowi"
              width={120}
              height={120}
              className="mx-auto drop-shadow-xl"
            />
          </motion.div>
          <p className="text-gray-500 dark:text-gray-400 mt-4">{t.loading}</p>
        </div>
      </div>
    );
  }

  // Si no hay sesión, mostrar mensaje
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">{lang === "es" ? "Inicia sesión para ver tu avatar" : "Sign in to see your avatar"}</p>
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

  // Obtener configuración basada en el STAGE actual (determinado por evolutionScore)
  // evolutionScore = (rowiLevel * 0.6) + (sixSecondsLevel * 0.4)
  const currentStage = avatar.currentStage || "EGG";
  const stageConfig = STAGE_CONFIG[currentStage] || STAGE_CONFIG.EGG;
  const rowiLevelName = t.rowiLevelNames[avatar.rowiLevel as keyof typeof t.rowiLevelNames] || t.rowiLevelNames[1];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-950 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2"
          >
            <Sparkles className="w-8 h-8 text-amber-500" />
            {t.title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-gray-500 dark:text-gray-400 mt-2"
          >
            {t.subtitle}
          </motion.p>
        </div>

        {/* Avatar Principal con imagen PNG */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`relative bg-gradient-to-br ${stageConfig.bgGradient} rounded-3xl shadow-2xl ${stageConfig.glowColor} p-8 overflow-hidden`}
        >
          {/* Floating Particles */}
          <AnimatePresence>
            {stageConfig.particles.map((particle, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0.5, 1, 0.5],
                  y: [0, -40, -80],
                  x: [0, (i - 1) * 30, (i - 1) * 50],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.7,
                }}
                className="absolute text-3xl pointer-events-none"
                style={{
                  left: `${25 + i * 25}%`,
                  bottom: "20%",
                }}
              >
                {particle}
              </motion.span>
            ))}
          </AnimatePresence>

          {/* Rowi Image */}
          <div className="relative flex flex-col items-center">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="relative w-48 h-48 md:w-64 md:h-64"
            >
              <Image
                src={stageConfig.image}
                alt="Tu Rowi"
                fill
                className="object-contain drop-shadow-2xl"
                priority
              />

              {/* Efectos especiales para WISE (máximo nivel) */}
              {currentStage === "WISE" && (
                <>
                  <motion.div
                    animate={{ y: [-5, 0, -5], opacity: [0.8, 1, 0.8] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -top-8 left-1/2 -translate-x-1/2 text-4xl drop-shadow-lg"
                  >
                    👑
                  </motion.div>
                  <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -right-4 top-1/4 text-2xl"
                  >
                    ⭐
                  </motion.div>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
                    className="absolute -left-4 top-1/4 text-2xl"
                  >
                    ⭐
                  </motion.div>
                </>
              )}

              {/* Efectos para ADULT */}
              {currentStage === "ADULT" && (
                <>
                  <motion.div
                    animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -right-2 top-1/3 text-xl"
                  >
                    💫
                  </motion.div>
                  <motion.div
                    animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                    className="absolute -left-2 top-1/3 text-xl"
                  >
                    💫
                  </motion.div>
                </>
              )}
            </motion.div>

            {/* Nombre del nivel */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 text-center"
            >
              <h2
                className="text-2xl md:text-3xl font-bold flex items-center justify-center gap-2"
                style={{ color: stageConfig.color }}
              >
                {stageConfig.emoji} {stageConfig.name[lang as "es" | "en"]}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {stageConfig.description[lang as "es" | "en"]}
              </p>
            </motion.div>

            {/* Barra de progreso */}
            <div className="w-full max-w-md mt-6">
              <div className="flex justify-between text-sm text-gray-500 mb-2">
                <span>{t.evolution}</span>
                <span>{avatar.progressToNext}%</span>
              </div>
              <div className="h-3 bg-white/50 dark:bg-zinc-700/50 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${avatar.progressToNext}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: stageConfig.color }}
                />
              </div>
              {avatar.nextStage ? (
                <p className="text-sm text-gray-500 mt-2 text-center">
                  {t.nextStage}: {STAGE_CONFIG[avatar.nextStage]?.emoji}{" "}
                  {STAGE_CONFIG[avatar.nextStage]?.name[lang as "es" | "en"]}
                </p>
              ) : (
                <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-2 text-center font-medium">
                  {t.maxLevel}
                </p>
              )}
            </div>
          </div>
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
                style={{ backgroundColor: `${stageConfig.color}20` }}
              >
                <Brain className="w-6 h-6" style={{ color: stageConfig.color }} />
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
                <p className="text-3xl font-bold" style={{ color: stageConfig.color }}>
                  {stageConfig.emoji} {stageConfig.name[lang as "es" | "en"]}
                </p>
                <p className="text-sm text-gray-500">
                  Level {avatar.sixSecondsLevel} / 5
                </p>
              </div>
              <div
                className="h-16 w-16 rounded-full flex items-center justify-center text-2xl font-bold text-white"
                style={{ backgroundColor: stageConfig.color }}
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
            {t.stats}
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
                {avatar.evolutionScore?.toFixed(1) || "0.0"}
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

        {/* Evolution Timeline */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg p-6"
        >
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" />
            {lang === "es" ? "Etapas de Evolución" : "Evolution Stages"}
          </h3>

          <div className="flex justify-between items-center">
            {(["EGG", "HATCHING", "BABY", "YOUNG", "ADULT", "WISE"] as const).map((stage, index) => {
              const config = STAGE_CONFIG[stage];
              const stages = ["EGG", "HATCHING", "BABY", "YOUNG", "ADULT", "WISE"];
              const currentIndex = stages.indexOf(currentStage);
              const isActive = index <= currentIndex;
              const isCurrent = stage === currentStage;

              return (
                <div key={stage} className="flex flex-col items-center">
                  <motion.div
                    className={`relative w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center ${
                      isActive ? "" : "opacity-40 grayscale"
                    } ${isCurrent ? "ring-4 ring-offset-2" : ""}`}
                    style={{
                      backgroundColor: isActive ? `${config.color}20` : "#e5e7eb",
                      ringColor: isCurrent ? config.color : "transparent",
                    }}
                    animate={isCurrent ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Image
                      src={config.image}
                      alt={config.name.en}
                      width={32}
                      height={32}
                      className="object-contain"
                    />
                  </motion.div>
                  <span
                    className={`text-xs mt-2 font-medium ${
                      isActive ? "" : "text-gray-400"
                    }`}
                    style={{ color: isActive ? config.color : undefined }}
                  >
                    {config.emoji}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Progress line */}
          <div className="relative h-1 bg-gray-200 dark:bg-zinc-700 rounded-full mt-4 mx-6">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(["EGG", "HATCHING", "BABY", "YOUNG", "ADULT", "WISE"].indexOf(currentStage) / 5) * 100}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              className="absolute h-full rounded-full"
              style={{ backgroundColor: stageConfig.color }}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
