"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { Sparkles, Heart, Brain, Target, Star, Zap, TrendingUp, Award } from "lucide-react";
import { EQ_LEVELS, getEqLevel, EQ_MAX } from "@/domains/eq/lib/eqLevels";

/**
 * 🥚 Rowi Evolution Component
 * Conectado con los niveles SEI de Six Seconds (65-135)
 *
 * Niveles SEI y evolución visual (usando /rowivectors/):
 * - Desafío (65-81) → Rowi-01.png - Huevo cerrado
 * - Emergente (82-91) → Rowi-02.png - Huevo agrietado
 * - Funcional (92-107) → Rowi-04.png - Rowi asomándose
 * - Diestro (108-117) → Rowi-05.png - Rowi joven saliendo
 * - Experto (118-135) → Rowi-06.png - 🦉 Rowi adulto COMPLETO
 */

type EvolutionStage = "challenge" | "emerging" | "functional" | "skilled" | "expert";

interface StageInfo {
  id: EvolutionStage;
  seiLevel: typeof EQ_LEVELS[number];
  image: string;
  fallbackImage?: string; // Imagen alternativa si la principal no existe
  fallbackEmoji: string; // Emoji fallback si no hay imagen
  icon: React.ElementType;
  bgGradient: string;
  glowColor: string;
  particles: string[];
  scale?: number; // Escala de la imagen
  yOffset?: number; // Offset vertical para ajustar posición
  showHatchingEffect?: boolean; // Efecto de estar saliendo del huevo (skilled)
  showMasterEffect?: boolean; // Efecto de maestro/experto (expert)
}

// Mapeo de etapas de evolución con niveles SEI - usando /rowivectors/
const EVOLUTION_STAGES: StageInfo[] = [
  {
    id: "challenge",
    seiLevel: EQ_LEVELS[0], // Desafío 65-81
    image: "/rowivectors/Rowi-01.png", // Huevo cerrado
    fallbackEmoji: "🥚",
    icon: Sparkles,
    bgGradient: "from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30",
    glowColor: "shadow-red-500/30",
    particles: ["🔴", "⚡", "🧩"],
    scale: 0.85,
  },
  {
    id: "emerging",
    seiLevel: EQ_LEVELS[1], // Emergente 82-91
    image: "/rowivectors/Rowi-02.png", // Huevo agrietado
    fallbackEmoji: "🐣",
    icon: Heart,
    bgGradient: "from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30",
    glowColor: "shadow-amber-500/30",
    particles: ["🟠", "🌱", "💫"],
    scale: 0.9,
  },
  {
    id: "functional",
    seiLevel: EQ_LEVELS[2], // Funcional 92-107
    image: "/rowivectors/Rowi-04.png", // Rowi asomándose del huevo
    fallbackEmoji: "🐥",
    icon: Brain,
    bgGradient: "from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-blue-900/30",
    glowColor: "shadow-blue-500/30",
    particles: ["🔵", "🧠", "✨"],
    scale: 0.95,
  },
  {
    id: "skilled",
    seiLevel: EQ_LEVELS[3], // Diestro 108-117
    image: "/rowivectors/Rowi-05.png", // Rowi joven saliendo del huevo
    fallbackEmoji: "🦉",
    icon: Target,
    bgGradient: "from-purple-100 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30",
    glowColor: "shadow-purple-500/30",
    particles: ["🟣", "🎯", "💪"],
    scale: 1.0,
    showHatchingEffect: true,
  },
  {
    id: "expert",
    seiLevel: EQ_LEVELS[4], // Experto 118-135
    image: "/rowivectors/Rowi-06.png", // 🦉 Rowi adulto COMPLETO
    fallbackEmoji: "🦉",
    icon: Star,
    bgGradient: "from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30",
    glowColor: "shadow-emerald-500/30",
    particles: ["🟢", "🌟", "👑"],
    scale: 1.1,
    showMasterEffect: true,
  },
];

interface RowiEvolutionProps {
  /** Score SEI actual del usuario (65-135) */
  currentScore?: number;
  /** Mostrar versión compacta */
  compact?: boolean;
  /** Mostrar interactivo (click para cambiar) */
  interactive?: boolean;
}

export default function RowiEvolution({
  currentScore,
  compact = false,
  interactive = true
}: RowiEvolutionProps) {
  const { t, lang } = useI18n();
  const [activeStage, setActiveStage] = useState<EvolutionStage>("challenge");
  const [simulatedScore, setSimulatedScore] = useState(75);
  const [isAnimating, setIsAnimating] = useState(false);

  // Si hay un score real, usarlo
  useEffect(() => {
    if (currentScore !== undefined) {
      const level = getEqLevel(currentScore);
      setActiveStage(level.key as EvolutionStage);
      setSimulatedScore(currentScore);
    }
  }, [currentScore]);

  const currentStage = EVOLUTION_STAGES.find((s) => s.id === activeStage) || EVOLUTION_STAGES[0];

  // Cambiar etapa con animación
  const handleStageChange = (stageId: EvolutionStage) => {
    if (!interactive || stageId === activeStage) return;
    setIsAnimating(true);
    setActiveStage(stageId);
    const stage = EVOLUTION_STAGES.find(s => s.id === stageId);
    if (stage) {
      setSimulatedScore(Math.floor((stage.seiLevel.min + stage.seiLevel.max) / 2));
    }
    setTimeout(() => setIsAnimating(false), 500);
  };

  // Calcular posición en la barra de progreso (65-135 → 0-100%)
  const progressPercent = Math.max(0, Math.min(100, ((simulatedScore - 65) / (135 - 65)) * 100));

  if (compact) {
    return <CompactEvolution stage={currentStage} score={simulatedScore} t={t} />;
  }

  return (
    <section className="py-20 px-4 overflow-hidden bg-gradient-to-b from-transparent via-[var(--rowi-card)]/50 to-transparent">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-[var(--rowi-primary)]/20 to-[var(--rowi-secondary)]/20 text-[var(--rowi-primary)] mb-4"
          >
            <Zap className="w-4 h-4" />
            {t("public.evolution.badge", "Gamificación + Six Seconds")}
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-bold mb-4"
          >
            {t("public.evolution.title", "Tu Rowi evoluciona contigo")}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-[var(--rowi-muted)] max-w-2xl mx-auto"
          >
            {t(
              "public.evolution.subtitle",
              "Basado en el modelo SEI de Six Seconds. A medida que desarrollas tu inteligencia emocional, tu Rowi crece y se transforma."
            )}
          </motion.p>
        </div>

        {/* Evolution Display */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Rowi Image with Effects */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div
              className={`relative aspect-square max-w-md mx-auto rounded-3xl bg-gradient-to-br ${currentStage.bgGradient} p-8 shadow-2xl ${currentStage.glowColor}`}
            >
              {/* Floating Particles */}
              <AnimatePresence>
                {currentStage.particles.map((particle, i) => (
                  <motion.span
                    key={`${currentStage.id}-${i}`}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0.5, 1, 0.5],
                      y: [0, -30, -60],
                      x: [0, (i - 1) * 20, (i - 1) * 30],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.5,
                    }}
                    className="absolute text-2xl"
                    style={{
                      left: `${30 + i * 20}%`,
                      top: "70%",
                    }}
                  >
                    {particle}
                  </motion.span>
                ))}
              </AnimatePresence>

              {/* Rowi Image */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStage.id}
                  initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                  animate={{
                    opacity: 1,
                    scale: isAnimating ? [1, 1.1, 1] : (currentStage.scale || 1),
                    rotate: 0
                  }}
                  exit={{ opacity: 0, scale: 0.8, rotate: 10 }}
                  transition={{ type: "spring", damping: 20 }}
                  className="relative w-full h-full flex items-center justify-center"
                >
                  {/* Usar imagen o emoji fallback */}
                  <RowiImage stage={currentStage} />

                  {/* === EFECTOS PARA EXPERT (Rowi fuera del huevo) === */}
                  {currentStage.id === "expert" && (
                    <>
                      {/* Corona flotante */}
                      <motion.div
                        initial={{ y: -20, opacity: 0, scale: 0 }}
                        animate={{ y: [-5, 0, -5], opacity: 1, scale: 1 }}
                        transition={{
                          y: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                          opacity: { delay: 0.3 },
                          scale: { delay: 0.3, type: "spring" }
                        }}
                        className="absolute -top-8 left-1/2 -translate-x-1/2 text-5xl drop-shadow-lg z-10"
                      >
                        👑
                      </motion.div>

                      {/* Estrellas brillantes alrededor */}
                      <motion.div
                        animate={{
                          scale: [1, 1.3, 1],
                          opacity: [0.5, 1, 0.5],
                          rotate: [0, 180, 360]
                        }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="absolute -right-6 top-1/4 text-3xl"
                      >
                        ⭐
                      </motion.div>
                      <motion.div
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.6, 1, 0.6],
                          rotate: [0, -180, -360]
                        }}
                        transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
                        className="absolute -left-6 top-1/4 text-3xl"
                      >
                        ⭐
                      </motion.div>
                      <motion.div
                        animate={{
                          scale: [1, 1.4, 1],
                          opacity: [0.4, 1, 0.4]
                        }}
                        transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                        className="absolute right-0 bottom-1/4 text-2xl"
                      >
                        ✨
                      </motion.div>
                      <motion.div
                        animate={{
                          scale: [1, 1.4, 1],
                          opacity: [0.4, 1, 0.4]
                        }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.7 }}
                        className="absolute left-0 bottom-1/4 text-2xl"
                      >
                        ✨
                      </motion.div>

                      {/* Aura dorada para Expert */}
                      <motion.div
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: `radial-gradient(circle, rgba(34, 197, 94, 0.3) 0%, rgba(16, 185, 129, 0.1) 50%, transparent 70%)`,
                        }}
                        animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 2.5, repeat: Infinity }}
                      />
                    </>
                  )}

                  {/* === EFECTOS PARA SKILLED (saliendo del huevo) === */}
                  {currentStage.id === "skilled" && (
                    <>
                      {/* Pequeños destellos */}
                      <motion.div
                        animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute -right-2 top-1/3 text-xl"
                      >
                        💫
                      </motion.div>
                      <motion.div
                        animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                        className="absolute -left-2 top-1/3 text-xl"
                      >
                        💫
                      </motion.div>

                      {/* Aura púrpura suave para Skilled */}
                      <motion.div
                        className="absolute inset-0 rounded-full opacity-20"
                        style={{
                          background: `radial-gradient(circle, ${currentStage.seiLevel.color}40 0%, transparent 70%)`,
                        }}
                        animate={{ scale: [1, 1.08, 1], opacity: [0.15, 0.3, 0.15] }}
                        transition={{ duration: 2.5, repeat: Infinity }}
                      />
                    </>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Stage Badge */}
              <motion.div
                layout
                className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white dark:bg-zinc-900 rounded-full px-5 py-2.5 shadow-lg flex items-center gap-3"
              >
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: currentStage.seiLevel.color }}
                />
                <span className="font-semibold">
                  {currentStage.seiLevel.emoji} {lang === "en" ? currentStage.seiLevel.labelEN : currentStage.seiLevel.label}
                </span>
                <span className="text-sm text-[var(--rowi-muted)] font-mono">
                  {currentStage.seiLevel.min}-{currentStage.seiLevel.max}
                </span>
              </motion.div>
            </div>

            {/* Score Display */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mt-6"
            >
              <p className="text-sm text-[var(--rowi-muted)] mb-1">
                {lang === "es" ? "Puntaje SEI simulado" : "Simulated SEI Score"}
              </p>
              <p className="text-4xl font-bold" style={{ color: currentStage.seiLevel.color }}>
                {simulatedScore}
                <span className="text-lg font-normal text-[var(--rowi-muted)]">/{EQ_MAX}</span>
              </p>
            </motion.div>
          </motion.div>

          {/* Stage Selector with SEI Info */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-[var(--rowi-muted)] mb-4 flex items-center gap-2">
              <Award className="w-4 h-4" />
              {lang === "es" ? "Niveles de Inteligencia Emocional (SEI)" : "Emotional Intelligence Levels (SEI)"}
            </p>

            {EVOLUTION_STAGES.map((stage, index) => (
              <motion.button
                key={stage.id}
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleStageChange(stage.id)}
                disabled={!interactive}
                className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-300 ${
                  activeStage === stage.id
                    ? `border-transparent bg-gradient-to-r ${stage.bgGradient} shadow-lg`
                    : "border-[var(--rowi-border)] hover:border-[var(--rowi-primary)]/50 bg-[var(--rowi-card)]"
                } ${interactive ? "cursor-pointer" : "cursor-default"}`}
              >
                <div className="flex items-center gap-4">
                  {/* Level indicator */}
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold ${
                      activeStage === stage.id ? "scale-110" : ""
                    } transition-transform`}
                    style={{ backgroundColor: stage.seiLevel.color }}
                  >
                    {stage.seiLevel.emoji}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        {lang === "en" ? stage.seiLevel.labelEN : stage.seiLevel.label}
                        {activeStage === stage.id && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="text-xs px-2 py-0.5 rounded-full bg-[var(--rowi-primary)] text-white"
                          >
                            {lang === "es" ? "Actual" : "Current"}
                          </motion.span>
                        )}
                      </h3>
                      <span
                        className="text-sm font-mono px-2 py-0.5 rounded-lg"
                        style={{
                          backgroundColor: `${stage.seiLevel.color}20`,
                          color: stage.seiLevel.color
                        }}
                      >
                        {stage.seiLevel.min}-{stage.seiLevel.max}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--rowi-muted)] line-clamp-2">
                      {lang === "en" ? stage.seiLevel.descriptionEN : stage.seiLevel.description}
                    </p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Progress Bar with SEI Scale */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 max-w-4xl mx-auto"
        >
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="text-[var(--rowi-muted)]">{lang === "es" ? "Escala SEI" : "SEI Scale"}</span>
            <span className="font-mono text-[var(--rowi-primary)]">{simulatedScore}/{EQ_MAX}</span>
          </div>

          <div className="relative h-6 bg-[var(--rowi-border)] rounded-full overflow-hidden">
            {/* Level sections */}
            <div className="absolute inset-0 flex">
              {EVOLUTION_STAGES.map((stage, i) => {
                const width = ((stage.seiLevel.max - stage.seiLevel.min + 1) / (135 - 65)) * 100;
                return (
                  <div
                    key={stage.id}
                    className="h-full transition-opacity"
                    style={{
                      width: `${width}%`,
                      backgroundColor: `${stage.seiLevel.color}30`,
                      borderRight: i < EVOLUTION_STAGES.length - 1 ? "2px solid var(--rowi-background)" : "none",
                    }}
                  />
                );
              })}
            </div>

            {/* Progress fill */}
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                background: `linear-gradient(90deg, ${EVOLUTION_STAGES[0].seiLevel.color}, ${currentStage.seiLevel.color})`,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />

            {/* Current position indicator */}
            <motion.div
              className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-lg border-2 flex items-center justify-center"
              style={{
                borderColor: currentStage.seiLevel.color,
                left: `${progressPercent}%`,
                transform: "translate(-50%, -50%)"
              }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: currentStage.seiLevel.color }}
              />
            </motion.div>
          </div>

          {/* Scale labels */}
          <div className="flex justify-between mt-2 text-xs text-[var(--rowi-muted)]">
            <span>65</span>
            {EVOLUTION_STAGES.slice(1).map(stage => (
              <span key={stage.id} className="font-medium" style={{ color: stage.seiLevel.color }}>
                {stage.seiLevel.min}
              </span>
            ))}
            <span>135</span>
          </div>

          {/* Level names */}
          <div className="flex justify-around mt-3">
            {EVOLUTION_STAGES.map(stage => (
              <span
                key={stage.id}
                className={`text-xs font-medium px-2 py-1 rounded-full transition-all ${
                  activeStage === stage.id
                    ? "bg-[var(--rowi-primary)] text-white"
                    : "text-[var(--rowi-muted)]"
                }`}
              >
                {stage.seiLevel.emoji} {stage.seiLevel.short}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Call to action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-[var(--rowi-muted)] mb-4">
            {lang === "es"
              ? "¿Quieres descubrir tu nivel real? Completa la evaluación SEI."
              : "Want to discover your real level? Complete the SEI assessment."}
          </p>
          <a
            href="/register"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[var(--rowi-primary)] to-[var(--rowi-secondary)] text-white font-semibold hover:opacity-90 transition-opacity shadow-lg"
          >
            <TrendingUp className="w-5 h-5" />
            {lang === "es" ? "Evaluar mi Inteligencia Emocional" : "Assess my Emotional Intelligence"}
          </a>
        </motion.div>
      </div>
    </section>
  );
}

// Componente de imagen con fallback a emoji
function RowiImage({ stage }: { stage: StageInfo }) {
  const [imageError, setImageError] = useState(false);

  // Reset error state when stage changes
  useEffect(() => {
    setImageError(false);
  }, [stage.image]);

  // Si hay error de imagen, mostrar emoji fallback
  if (imageError) {
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <motion.span
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className={`transition-all ${
            stage.id === "expert"
              ? "text-[120px] md:text-[150px]"
              : stage.id === "skilled"
              ? "text-[100px] md:text-[130px]"
              : "text-[80px] md:text-[100px]"
          }`}
        >
          {stage.fallbackEmoji}
        </motion.span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <Image
        src={stage.image}
        alt={stage.seiLevel.label}
        fill
        className={`object-contain drop-shadow-2xl transition-all ${
          stage.id === "expert" ? "scale-110" : ""
        }`}
        onError={() => setImageError(true)}
      />

      {/* Efecto hatching para skilled - cáscaras de huevo volando */}
      {stage.showHatchingEffect && (
        <>
          <motion.span
            className="absolute top-1/4 -left-2 text-2xl opacity-60"
            animate={{
              y: [-5, 5, -5],
              x: [-3, 3, -3],
              rotate: [-10, 10, -10]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            🥚
          </motion.span>
          <motion.span
            className="absolute top-1/3 -right-2 text-xl opacity-50"
            animate={{
              y: [5, -5, 5],
              x: [3, -3, 3],
              rotate: [10, -10, 10]
            }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 0.3 }}
          >
            💫
          </motion.span>
        </>
      )}
    </div>
  );
}

// Versión compacta para usar en otras partes
function CompactEvolution({
  stage,
  score,
  t
}: {
  stage: StageInfo;
  score: number;
  t: (key: string, fallback?: string) => string;
}) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--rowi-card)] border border-[var(--rowi-border)]">
      <div className="relative w-16 h-16">
        <Image
          src={stage.image}
          alt={stage.seiLevel.label}
          fill
          className="object-contain"
        />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: stage.seiLevel.color }}
          />
          <span className="font-semibold">{stage.seiLevel.emoji} {stage.seiLevel.label}</span>
        </div>
        <div className="h-2 bg-[var(--rowi-border)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${((score - 65) / 70) * 100}%`,
              backgroundColor: stage.seiLevel.color
            }}
          />
        </div>
        <p className="text-xs text-[var(--rowi-muted)] mt-1">
          {score}/{EQ_MAX} • {stage.seiLevel.description.split(".")[0]}
        </p>
      </div>
    </div>
  );
}
