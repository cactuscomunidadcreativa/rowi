"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Brain, TrendingUp, Award, Star } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * Avatar Page — Tu Rowi evoluciona con tu Inteligencia Emocional
 *
 * Basado en los 5 niveles SEI de Six Seconds:
 * - Desafío (65–81) → Rowi-01.png
 * - Emergente (82–91) → Rowi-02.png
 * - Funcional (92–107) → Rowi-04.png
 * - Diestro (108–117) → Rowi-05.png
 * - Experto (118–135) → Rowi-06.png
 */

interface SeiLevel {
  key: string;
  image: string;
  name: { es: string; en: string };
  emoji: string;
  color: string;
  bgGradient: string;
  glowColor: string;
  particles: string[];
  description: { es: string; en: string };
  min: number;
  max: number;
}

const SEI_LEVELS: SeiLevel[] = [
  {
    key: "challenge",
    image: "/rowivectors/Rowi-01.png",
    name: { es: "Desafío", en: "Challenge" },
    emoji: "🧩",
    color: "#ef4444",
    bgGradient: "from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30",
    glowColor: "shadow-red-500/30",
    particles: ["🧩", "✨", "💫"],
    description: {
      es: "Necesita desarrollar consciencia emocional y autogestión. Área de oportunidad significativa.",
      en: "Needs to develop emotional awareness and self-management. Significant opportunity area.",
    },
    min: 65,
    max: 81,
  },
  {
    key: "emerging",
    image: "/rowivectors/Rowi-02.png",
    name: { es: "Emergente", en: "Emerging" },
    emoji: "🌱",
    color: "#f59e0b",
    bgGradient: "from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30",
    glowColor: "shadow-amber-500/30",
    particles: ["🌱", "💡", "💫"],
    description: {
      es: "Comienza a reconocer emociones y usarlas de forma funcional. En proceso de desarrollo.",
      en: "Beginning to recognize emotions and use them functionally. In development process.",
    },
    min: 82,
    max: 91,
  },
  {
    key: "functional",
    image: "/rowivectors/Rowi-04.png",
    name: { es: "Funcional", en: "Functional" },
    emoji: "🧠",
    color: "#3b82f6",
    bgGradient: "from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30",
    glowColor: "shadow-blue-500/30",
    particles: ["🧠", "🎯", "✨"],
    description: {
      es: "Integra pensamiento y emoción con equilibrio consistente. Competencia estable.",
      en: "Integrates thinking and emotion with consistent balance. Stable competence.",
    },
    min: 92,
    max: 107,
  },
  {
    key: "skilled",
    image: "/rowivectors/Rowi-05.png",
    name: { es: "Diestro", en: "Skilled" },
    emoji: "🎯",
    color: "#8b5cf6",
    bgGradient: "from-purple-100 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30",
    glowColor: "shadow-purple-500/30",
    particles: ["🎯", "🌟", "💪"],
    description: {
      es: "Maneja con fluidez las competencias emocionales clave. Alto desempeño.",
      en: "Fluently manages key emotional competencies. High performance.",
    },
    min: 108,
    max: 117,
  },
  {
    key: "expert",
    image: "/rowivectors/Rowi-06.png",
    name: { es: "Experto", en: "Expert" },
    emoji: "🌟",
    color: "#10b981",
    bgGradient: "from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30",
    glowColor: "shadow-emerald-500/30",
    particles: ["🌟", "👑", "⭐"],
    description: {
      es: "Domina la inteligencia emocional con propósito y liderazgo. Nivel de excelencia.",
      en: "Masters emotional intelligence with purpose and leadership. Level of excellence.",
    },
    min: 118,
    max: 135,
  },
];

function getSeiLevelFromScore(score: number): SeiLevel {
  return SEI_LEVELS.find((l) => score >= l.min && score <= l.max) || SEI_LEVELS[0];
}

function getSeiLevelIndex(score: number): number {
  const idx = SEI_LEVELS.findIndex((l) => score >= l.min && score <= l.max);
  return idx >= 0 ? idx : 0;
}

const translations = {
  es: {
    title: "Tu Rowi",
    subtitle: "Tu Rowi evoluciona contigo",
    subtitleDesc: "A medida que desarrollas tu inteligencia emocional, tu Rowi crece y se transforma",
    seiScore: "Puntaje SEI",
    seiLevel: "Nivel de Inteligencia Emocional",
    seiDesc: "Basado en la metodología Six Seconds (SEI)",
    levels: "Niveles de Inteligencia Emocional (SEI)",
    current: "Actual",
    loading: "Cargando tu Rowi...",
    noData: "Completa tu evaluación SEI para ver tu nivel",
    scale: "Escala SEI",
  },
  en: {
    title: "Your Rowi",
    subtitle: "Your Rowi evolves with you",
    subtitleDesc: "As you develop your emotional intelligence, your Rowi grows and transforms",
    seiScore: "SEI Score",
    seiLevel: "Emotional Intelligence Level",
    seiDesc: "Based on Six Seconds methodology (SEI)",
    levels: "Emotional Intelligence Levels (SEI)",
    current: "Current",
    loading: "Loading your Rowi...",
    noData: "Complete your SEI assessment to see your level",
    scale: "SEI Scale",
  },
};

export default function AvatarPage() {
  const { lang } = useI18n();
  const t = translations[lang as keyof typeof translations] || translations.es;
  const { data: session, status } = useSession();

  const isAuthenticated = status === "authenticated" && !!session?.user;

  // Fetch EQ data to get the SEI score
  const { data: eqData, isLoading: eqLoading } = useSWR(
    isAuthenticated ? "/api/eq/me" : null,
    fetcher
  );

  if (status === "loading" || (isAuthenticated && eqLoading)) {
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">{lang === "es" ? "Inicia sesión para ver tu avatar" : "Sign in to see your avatar"}</p>
      </div>
    );
  }

  // Get SEI score from EQ data
  const seiScore = eqData?.eq?.total ?? eqData?.outcomes?.overall4 ?? 0;
  const hasSei = seiScore > 0;
  const currentLevel = getSeiLevelFromScore(seiScore);
  const currentIndex = getSeiLevelIndex(seiScore);

  // Calculate progress within current level
  const progressInLevel = hasSei
    ? Math.round(((seiScore - currentLevel.min) / (currentLevel.max - currentLevel.min)) * 100)
    : 0;

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
            className="text-gray-500 dark:text-gray-400 mt-1"
          >
            {t.subtitle}
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="text-gray-400 dark:text-gray-500 text-sm mt-1"
          >
            {t.subtitleDesc}
          </motion.p>
        </div>

        {!hasSei ? (
          /* No SEI data */
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-zinc-800 rounded-3xl shadow-xl p-12 text-center"
          >
            <Image
              src="/rowivectors/Rowi-01.png"
              alt="Rowi"
              width={160}
              height={160}
              className="mx-auto drop-shadow-xl mb-6"
            />
            <p className="text-gray-500 dark:text-gray-400">{t.noData}</p>
          </motion.div>
        ) : (
          <>
            {/* Main Avatar Card */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`relative bg-gradient-to-br ${currentLevel.bgGradient} rounded-3xl shadow-2xl ${currentLevel.glowColor} p-8 overflow-hidden`}
            >
              {/* Floating Particles */}
              <AnimatePresence>
                {currentLevel.particles.map((particle, i) => (
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

              {/* Rowi Image + Level Info */}
              <div className="relative flex flex-col items-center">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="relative w-48 h-48 md:w-64 md:h-64"
                >
                  <Image
                    src={currentLevel.image}
                    alt="Tu Rowi"
                    fill
                    className="object-contain drop-shadow-2xl"
                    priority
                  />

                  {/* Special effects for Expert level */}
                  {currentLevel.key === "expert" && (
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

                  {/* Skilled level effects */}
                  {currentLevel.key === "skilled" && (
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

                {/* Level Name */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-6 text-center"
                >
                  <h2
                    className="text-2xl md:text-3xl font-bold flex items-center justify-center gap-2"
                    style={{ color: currentLevel.color }}
                  >
                    {currentLevel.emoji} {currentLevel.name[lang as "es" | "en"]}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-md mx-auto">
                    {currentLevel.description[lang as "es" | "en"]}
                  </p>
                </motion.div>

                {/* SEI Score Display */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mt-6 flex items-center gap-4"
                >
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">{t.seiScore}</p>
                    <div
                      className="text-4xl font-bold"
                      style={{ color: currentLevel.color }}
                    >
                      {Math.round(seiScore)}
                    </div>
                    <p className="text-xs text-gray-400">/135</p>
                  </div>
                </motion.div>

                {/* Progress within level */}
                <div className="w-full max-w-md mt-6">
                  <div className="flex justify-between text-sm text-gray-500 mb-2">
                    <span>{currentLevel.min}</span>
                    <span className="font-medium" style={{ color: currentLevel.color }}>
                      {currentLevel.name[lang as "es" | "en"]} ({currentLevel.min}–{currentLevel.max})
                    </span>
                    <span>{currentLevel.max}</span>
                  </div>
                  <div className="h-3 bg-white/50 dark:bg-zinc-700/50 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(5, progressInLevel)}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: currentLevel.color }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* SEI Level Card */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="p-3 rounded-xl"
                  style={{ backgroundColor: `${currentLevel.color}20` }}
                >
                  <Brain className="w-6 h-6" style={{ color: currentLevel.color }} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {t.seiLevel}
                  </h3>
                  <p className="text-xs text-gray-500">{t.seiDesc}</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold" style={{ color: currentLevel.color }}>
                    {currentLevel.emoji} {currentLevel.name[lang as "es" | "en"]}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {Math.round(seiScore)} / 135
                  </p>
                </div>
                <div
                  className="h-16 w-16 rounded-full flex items-center justify-center text-3xl"
                  style={{ backgroundColor: `${currentLevel.color}15` }}
                >
                  {currentLevel.emoji}
                </div>
              </div>
            </motion.div>

            {/* All 5 SEI Levels */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg p-6"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" />
                {t.levels}
              </h3>

              <div className="space-y-3">
                {SEI_LEVELS.map((level, index) => {
                  const isActive = index <= currentIndex;
                  const isCurrent = level.key === currentLevel.key;

                  return (
                    <motion.div
                      key={level.key}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className={`flex items-center gap-4 p-4 rounded-xl transition-all border-2 ${
                        isCurrent
                          ? "shadow-md"
                          : isActive
                          ? "bg-gray-50 dark:bg-zinc-700/50 border-transparent"
                          : "opacity-50 border-transparent"
                      }`}
                      style={{
                        backgroundColor: isCurrent ? `${level.color}10` : undefined,
                        borderColor: isCurrent ? level.color : "transparent",
                      }}
                    >
                      {/* Rowi Image */}
                      <div
                        className={`relative w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${
                          isActive ? "" : "grayscale"
                        }`}
                        style={{ backgroundColor: isActive ? `${level.color}15` : "#e5e7eb" }}
                      >
                        <Image
                          src={level.image}
                          alt={level.name.en}
                          width={40}
                          height={40}
                          className="object-contain"
                        />
                        {isCurrent && (
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                            style={{ backgroundColor: level.color }}
                          >
                            ✓
                          </motion.div>
                        )}
                      </div>

                      {/* Level Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{level.emoji}</span>
                          <span
                            className="font-semibold"
                            style={{ color: isActive ? level.color : "#9ca3af" }}
                          >
                            {level.name[lang as "es" | "en"]}
                          </span>
                          {isCurrent && (
                            <span
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                              style={{ backgroundColor: level.color }}
                            >
                              {t.current}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {level.description[lang as "es" | "en"]}
                        </p>
                      </div>

                      {/* Score Range */}
                      <div className="text-right shrink-0">
                        <p
                          className="text-sm font-mono font-semibold"
                          style={{ color: isActive ? level.color : "#9ca3af" }}
                        >
                          {level.min}–{level.max}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* SEI Scale footer */}
              <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  {t.scale}: Six Seconds Emotional Intelligence (SEI) · 65–135
                </p>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
