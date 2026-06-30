"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  GraduationCap,
  BookOpen,
  Play,
  CheckCircle,
  Clock,
  Star,
  Trophy,
  Target,
  Sparkles,
  ArrowRight,
  Lock,
  Flame,
  Brain,
  Heart,
  Zap,
  TrendingUp,
  Users,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";
import EqeLessonsSection from "@/components/learning/EqeLessonsSection";

/* =========================================================
   📚 Learning Hub — Centro de Aprendizaje Rowi
   ---------------------------------------------------------
   Módulos de desarrollo de Inteligencia Emocional
========================================================= */

interface MicroLesson {
  slug: string;
  title: string;
  progress: { status: string; progress: number } | null;
}

export default function LearningPage() {
  const { t, lang } = useI18n();
  const [mounted, setMounted] = useState(false);
  // Lecciones REALES de la DB para las estadísticas del encabezado. El grid de
  // lecciones lo renderiza <EqeLessonsSection/> (mismo endpoint). Antes había
  // un array hardcodeado con progreso falso igual para todos.
  const [lessons, setLessons] = useState<MicroLesson[]>([]);

  useEffect(() => {
    setMounted(true);
    fetch("/api/learning/microlearnings/list?source=EQE")
      .then((r) => r.json())
      .then((d) => {
        if (d?.ok && Array.isArray(d.items)) setLessons(d.items);
      })
      .catch(() => {});
  }, []);

  // Stats reales a partir de las lecciones del usuario.
  const totalLessons = lessons.length;
  const completedLessons = lessons.filter(
    (l) => String(l.progress?.status || "").toLowerCase() === "completed",
  ).length;
  const progressPercent =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const safeLang = mounted ? lang : "es";

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-zinc-900 dark:to-zinc-950">
      {/* Header compacto estilo app */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {safeLang === "es" ? "Centro de Aprendizaje" : "Learning Hub"}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {safeLang === "es"
                  ? "Desarrolla tu Inteligencia Emocional con el modelo Six Seconds"
                  : "Develop your Emotional Intelligence with the Six Seconds model"}
              </p>
            </div>
          </div>

          {/* Progress mini card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-4 px-5 py-3 bg-white dark:bg-zinc-800 rounded-2xl border border-gray-200 dark:border-zinc-700 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {completedLessons}/{totalLessons}
              </span>
            </div>
            <div className="w-24 h-2 bg-gray-100 dark:bg-zinc-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
              />
            </div>
            <span className="text-sm font-bold text-violet-600 dark:text-violet-400">{progressPercent}%</span>
          </motion.div>
        </motion.div>
      </div>

      {/* Quick Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: BookOpen, value: totalLessons, label: safeLang === "es" ? "Lecciones" : "Lessons", color: "#3b82f6" },
            { icon: Trophy, value: completedLessons, label: safeLang === "es" ? "Completadas" : "Completed", color: "#10b981" },
            { icon: Target, value: `${progressPercent}%`, label: safeLang === "es" ? "Progreso" : "Progress", color: "#8b5cf6" },
            { icon: Zap, value: 3, label: safeLang === "es" ? "Mini-juegos" : "Mini-games", color: "#f59e0b" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white dark:bg-zinc-800/80 rounded-xl p-4 border border-gray-200 dark:border-zinc-700/50 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: `${stat.color}12` }}
                >
                  <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Mini-games strip */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              {safeLang === "es" ? "Mini-games para ganar puntos" : "Mini-games to earn points"}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <Link
              href="/learning/play/pulse-pause"
              className="group bg-gradient-to-br from-violet-500 to-indigo-600 text-white rounded-2xl p-5 shadow-lg shadow-violet-500/20 hover:scale-[1.02] transition-transform"
            >
              <div className="flex items-start justify-between mb-3">
                <Heart className="w-6 h-6" />
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                  {safeLang === "es" ? "Six Seconds" : "Six Seconds"}
                </span>
              </div>
              <h3 className="font-bold text-lg mb-1">
                {safeLang === "es" ? "Pausa de Pulso" : "Pulse Pause"}
              </h3>
              <p className="text-xs text-white/80 mb-3">
                {safeLang === "es"
                  ? "Practica la pausa de 6 segundos antes de reaccionar. 5 escenarios · hasta 100 pts."
                  : "Practice the 6-second pause before reacting. 5 scenarios · up to 100 pts."}
              </p>
              <div className="inline-flex items-center gap-1 text-xs font-semibold">
                {safeLang === "es" ? "Jugar ahora" : "Play now"}
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
            <Link
              href="/learning/play/emotion-match"
              className="group bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl p-5 shadow-lg shadow-emerald-500/20 hover:scale-[1.02] transition-transform"
            >
              <div className="flex items-start justify-between mb-3">
                <Sparkles className="w-6 h-6" />
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                  EL · SEI
                </span>
              </div>
              <h3 className="font-bold text-lg mb-1">
                {safeLang === "es" ? "Empareja la Emoción" : "Emotion Match"}
              </h3>
              <p className="text-xs text-white/80 mb-3">
                {safeLang === "es"
                  ? "Practica alfabetización emocional. 5 escenarios + justifica · hasta 75 pts."
                  : "Practice emotional literacy. 5 scenarios + justify · up to 75 pts."}
              </p>
              <div className="inline-flex items-center gap-1 text-xs font-semibold">
                {safeLang === "es" ? "Jugar ahora" : "Play now"}
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
            <Link
              href="/learning/play/empathy-mirror"
              className="group bg-gradient-to-br from-rose-500 to-pink-600 text-white rounded-2xl p-5 shadow-lg shadow-rose-500/20 hover:scale-[1.02] transition-transform"
            >
              <div className="flex items-start justify-between mb-3">
                <Heart className="w-6 h-6" />
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                  EMP · SEI
                </span>
              </div>
              <h3 className="font-bold text-lg mb-1">
                {safeLang === "es" ? "Espejo de Empatía" : "Empathy Mirror"}
              </h3>
              <p className="text-xs text-white/80 mb-3">
                {safeLang === "es"
                  ? "Mira lo que siente el otro. 5 escenarios · hasta 75 pts."
                  : "See what the other feels. 5 scenarios · up to 75 pts."}
              </p>
              <div className="inline-flex items-center gap-1 text-xs font-semibold">
                {safeLang === "es" ? "Jugar ahora" : "Play now"}
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* EQE micro-lessons (Six Seconds adapted) */}
      <EqeLessonsSection />

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Las lecciones reales se renderizan en <EqeLessonsSection/> arriba
            (desde /api/learning/microlearnings/list). Aquí ya no hay un
            catálogo hardcodeado con progreso ficticio. */}

        {/* Coming Soon Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-8 border border-indigo-100 dark:border-indigo-800"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                  {safeLang === "es" ? "Próximamente" : "Coming Soon"}
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {safeLang === "es" ? "Rowi, tu Guía" : "Rowi, your Guide"}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-lg">
                {safeLang === "es"
                  ? "Aprendizaje personalizado con inteligencia artificial. Tu coach personal de IE disponible 24/7."
                  : "Personalized learning with artificial intelligence. Your personal EI coach available 24/7."}
              </p>
            </div>
            <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/25">
              {safeLang === "es" ? "Notificarme" : "Notify Me"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

